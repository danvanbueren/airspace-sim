# Bearing Range Tool — Rewrite Plan

**Last updated:** June 2026  
**Audience:** Contributors and agents implementing or extending the map bearing/range tool.

This document is the **single source of truth** for how the bearing/range system should work. It captures:

1. Why the original monolithic hook was rewritten.
2. What has already landed on `main`.
3. What still needs to be built (track snapping).
4. Exact data models, file boundaries, control bindings, and test expectations so a future agent can implement the remaining work **without re-discovering requirements in chat**.

User-facing behavior is also summarized in the [repository root README](../README.md). In-app roadmap items live in `airspace-sim/app/content/settings-roadmap.md`.

---

## Status at a glance

| Area | Status | Notes |
|------|--------|-------|
| Modular geometry (`bearingRangeGeometry.js`) | ✅ On `main` | Unit tests in `tests/map/bearingRangeGeometry.test.js` |
| Preview canvas overlay | ✅ On `main` | `bearingRangePreviewCanvas.js` |
| MapLibre committed layer | ✅ On `main` | `bearingRangeMapLayer.js` |
| Label manager | ✅ On `main` | `bearingRangeLabels.js` |
| Thin hook orchestrator | ✅ On `main` | Sync map writes; preview cleared in same handler tick as commit |
| Temporary vs permanent lines | ✅ On `main` | `persistModifier` gate in `finishDrag`; default Shift on release |
| Keybinds UI + control reference | ✅ On `main` | `SettingsModalKeybindsPage.js`, `controlReference.js` |
| Behavior mode selector (Look & Feel) | ✅ On `main` | `bearingRangeBehavior.js`, `SettingsModalLookAndFeelPage.js` |
| Map layer sync reliability | ⚠️ Improved | Phase 3c — existing-source `setData` + idle retry; [manual verification pending](#phase-3c--map-layer-sync-labels-vs-geometry-desync) |
| Track-attached endpoints (line snapping) | ❌ Not started | Spec below (Phase 5) |
| Preview → commit transition | ✅ On `main` | Sync `setBearingRangeLines`; no `mapWritePromiseRef` queue |

**Historical context:** [PR #73](https://github.com/danvanbueren/airspace-sim/pull/73) accumulated incremental fixes on top of a dual-renderer design. The pre-rewrite hook was ~1,280 lines, mixed geometry/canvas/MapLibre/input/labels, and had unreliable deletes/commits. Phases 1–3 on `main` addressed that split. Phases 4–5 are the next product increments.

**Abandoned prototype:** [PR #72](https://github.com/danvanbueren/airspace-sim/pull/72) (`cursor/bearing-range-temp-lines-keybinds-fdde`, commits `3b79e41` / `2fafb69`) implemented Phase 4 against the **old monolithic hook** before the modular rewrite landed. The PR will be **deleted**. All useful behavior from that effort is captured in this document — re-implement on top of modular `main`, do not cherry-pick the PR diff.

---

## Forward action plan

Ship in this order. Phases 3b–4c are complete on `main`. **Phase 5 is next.**

```
Phase 3b  Fix preview→commit flash (sync map writes)          ✅
   ↓
Phase 3c  Map layer sync (labels vs geometry desync)         ✅
   ↓
Phase 4   Temporary vs permanent commit gate                   ✅
   ↓
Phase 4b  Keybinds UI + Complete Control Reference             ✅
   ↓
Phase 4c  Look & Feel behavior mode selector                   ✅
   ↓
Phase 5   Track-attached endpoints (line snapping)             ← next
   ↓
Phase 6   Hardening (optional)
```

### Phase 3b — Fix preview→commit flash (prerequisite)

**Problem:** On mouse release, the preview line flashes or briefly disappears before the committed MapLibre line appears.

**Root cause (current `main`):** `finishDrag` in `useBearingRangeTool.js` calls `commitLines(...)`, which queues an **async** `setBearingRangeLines` via `mapWritePromiseRef`. `clearPreview()` runs only in `.finally()` after that promise resolves — so for one or more frames the preview canvas is still visible while the map layer is also updating, or the preview vanishes before the layer paints.

```javascript
// Current (buggy) — preview cleared after async write
void commitLines([...linesRef.current, lineToCommit]).finally(() => {
    clearPreview()
})
```

**Target behavior:** Preview canvas exists **only** while `drag !== null`. On release, `clearPreview()` runs **synchronously in the same handler tick** as the map `setData` call. No overlap, no gap.

**Checklist:**

- [x] Make `setBearingRangeLines` synchronous — remove `waitForStyleReady` from the hot path; keep async wait only inside `rehydrateBearingRangeLines` on `style.load` rehydrate.
- [x] Remove `mapWritePromiseRef` and the revision-retry loop in `flushLinesToMap`.
- [x] In `finishDrag`, call `clearPreview()` **before** or **immediately after** sync `setBearingRangeLines` in the same synchronous block — never in `.finally()` on an async promise.
- [x] Verify `syncLabels()` does not briefly show a preview label after the canvas is cleared (preview label should clear with `clearPreview()` or when `dragRef` is nulled).
- [ ] Manual test: drag and release 20+ lines rapidly — no flash, no ghost lines, no missing lines.
- [ ] Manual test: delete one / clear all still immediate.

### Phase 3c — Map layer sync (labels vs geometry desync)

**Problem:** After Phase 3b landed, operators reported committed lines and clear/delete behaving inconsistently on the **MapLibre layer** even though midpoint labels looked correct.

**Reported symptoms:**

| Symptom | What the operator sees |
|---------|------------------------|
| Missing commit | Preview disappears on release; label may appear but **no line** on the map (or line appears only after a later pan/zoom) |
| Stale geometry on clear | **Clear all** or **delete one** removes labels immediately but **lines remain** on the map |
| Intermittent recovery | A failed write sometimes “fixes itself” after map movement because a later effect or `idle` handler finally flushed `linesRef` to the source |

**Root cause (Phase 3b regression):** Phase 3b correctly removed the async write queue and made `setBearingRangeLines` synchronous, but the first cut gated **every** write on `map.isStyleLoaded()`. When that guard returned `false`, the function exited without calling `setData` — yet `writeLinesToMap` in `useBearingRangeTool.js` had already updated `linesRef` and called `syncLabels()`. Labels follow `linesRef`; the GeoJSON source kept its **previous** feature collection. That split explains all three symptoms: labels and map geometry diverged silently with no thrown error.

```javascript
// Phase 3b (buggy) — silent failure left stale map geometry
export function setBearingRangeLines(map, lines, ...) {
    if (!map || !map.isStyleLoaded()) {
        return false  // labels already updated; map layer unchanged
    }
    // ...
}
```

**Fix (landed with Phase 4c work):** Keep sync writes from Phase 3b, but never let a failed map write go unretried.

1. **Split the hot path in `bearingRangeMapLayer.js`:**
   - If `bearing-range-lines-source` **already exists** → call `source.setData(...)` immediately. Do **not** require `isStyleLoaded()` for routine commit/delete/clear updates.
   - If the source does **not** exist yet → only then require `isStyleLoaded()`, call `ensureBearingRangeLayer`, then `setData`.
   - `rehydrateBearingRangeLines` remains **async** (`waitForStyleReady`) and is used only from `style.load` rehydrate — not from pointer handlers.

2. **Retry failed writes in `useBearingRangeTool.js`:**
   - `flushLinesToMapLayer()` calls sync `setBearingRangeLines` and returns success/failure.
   - `writeLinesToMap` (commit, delete one, clear all) calls `flushLinesToMapLayer()`; on `false`, registers `scheduleMapFlush()` → `map.once('idle', ...)` until the write succeeds.
   - `cancelScheduledMapFlush()` runs on hook teardown so idle listeners do not leak.

**Target behavior:** `linesRef`, midpoint labels, and MapLibre `setData` always reflect the same `lines[]` after commit, delete, and clear-all. A failed first write must retry automatically — never leave the map showing geometry that labels no longer describe.

**Checklist:**

- [x] Update existing-source path in `setBearingRangeLines` to skip `isStyleLoaded` guard.
- [x] Add `flushLinesToMapLayer` + `scheduleMapFlush` idle retry in `useBearingRangeTool.js`.
- [x] Keep `rehydrateBearingRangeLines` async for `style.load` only.
- [ ] Manual test: commit permanent line — line visible same frame as preview clears.
- [ ] Manual test: clear all with 10+ lines — map and labels empty together.
- [ ] Manual test: delete one line — map and labels update together.
- [ ] Manual test: rapid draw/delete 20+ lines — no ghost lines, no missing lines.

**Do not regress:**

- Do not reintroduce `mapWritePromiseRef`, revision-retry queues, or `.finally(() => clearPreview())`.
- Do not make commit/delete/clear hot paths `async` again.
- Do not update labels before a map write without either succeeding or scheduling `scheduleMapFlush`.

### Phase 4 — Temporary vs permanent lines

**Problem:** Every valid drag currently commits permanently. Operators cannot measure without leaving lines on the map.

**Checklist:**

- [x] Add `persistModifier: ['shift']` to `DEFAULT_CONTROL_BINDINGS.bearingRangeTool` in `ControlBindingsContext.js`.
- [x] Add `BEARING_RANGE_KEYBOARD_BINDING_KEYS = ['persistModifier']` and wire into normalize / clear / unbind logic.
- [x] Export `eventModifierKeysMatchBinding(event, bindingKeys)` helper (Shift, Control, Alt, Meta only).
- [x] Gate `finishDrag` commit per [finishDrag logic](#finishdrag-logic-phase-4--implement-in-modular-hook): release without modifier → `clearPreview()` only; release with modifier → commit.
- [x] Update hover-cursor suppression: also suppress when `eventModifierKeysMatchBinding(event, bindings.persistModifier)` (keep hard-coded `event.shiftKey` for box-zoom).
- [x] If `persistModifier` is unbound (`[]`), no drag produces a permanent line.
- [ ] Manual test matrix — [Temporary vs permanent](#temporary-vs-permanent-phase-4) rows.
- [x] Update root `README.md` bearing/range interaction description when shipped.

### Phase 4b — Keybinds UI and control reference

**Problem:** Operators cannot rebind the persist modifier; map controls are not fully documented in Settings.

**Checklist:**

- [x] Add **Persist Line Modifier** click-to-capture row to `SettingsModalKeybindsPage.js` (`bearingRangeTool:persistModifier`).
- [x] Extend key-capture listener to handle both `keyboardCamera:*` and `bearingRangeTool:*` binding targets.
- [x] Expose `grabButton` and `pointerButton` in the Mouse Controls grid (currently only drag, center, draw, context menu).
- [x] Add **Complete Control Reference** — extract `buildControlReference(controlBindings)` (pure function) and render grouped MUI cards on Settings → Usage Guide per [required entries](#complete-control-reference--required-entries).
- [x] List fixed combos (box zoom, scroll wheel) with a note that they are not individually rebindable today.
- [x] Reset Keybinds page restores `persistModifier: ['shift']`.
- [ ] Manual test matrix — [Keybinds UI](#keybinds-ui-phase-4b) rows.
- [x] Update `settings-roadmap.md` when shipped.

**Note:** Phase 4 and 4b can land in the **same PR** — they are one user-facing feature.

### Phase 4c — Look & Feel behavior mode selector

**Problem:** Operators want different default commit behavior without re-binding the persist modifier every session.

**Modes** (`appSettings.bearingRangeBehavior`, Settings → Look & Feel):

| Mode | Default on release | Persist modifier on release |
|------|-------------------|----------------------------|
| `temporary_default` | Temporary measurement | Commit permanent line |
| `permanent_default` | Permanent line | Temporary measurement only |
| `always_permanent` | Permanent line | Ignored |
| `never_permanent` | Temporary measurement | Ignored |

**Checklist:**

- [x] Add `bearingRangeBehavior` to `AppSettingsContext` with normalization and cookie persistence.
- [x] Add **Bearing/Range Behavior** Select to `SettingsModalLookAndFeelPage.js`.
- [x] Add pure `shouldPersistBearingRangeLine(behaviorMode, modifierActive)` in `bearingRangeBehavior.js`.
- [x] Gate `finishDrag` via behavior mode + persist modifier.
- [x] Update Complete Control Reference text per active behavior mode.
- [x] Improve map layer sync: update existing GeoJSON source without `isStyleLoaded` guard; idle retry when first write fails. See [Phase 3c](#phase-3c--map-layer-sync-labels-vs-geometry-desync).
- [ ] Manual test matrix — all four modes + clear/delete still immediate.

### Phase 5 — Track-attached endpoints (line snapping)

**Problem:** Permanent line endpoints do not snap to tracks or follow track movement.

**Checklist:**

- [ ] Create `app/tools/map/trackHitTest.js` — extract `queryTrackAtMapPoint` / `findSnapTrackAtMapPoint` from `useTrackMapLayer.js`; add `SNAP_MARGIN_PX = 8`.
- [ ] Create `app/tools/map/bearingRangeTrackSnap.js` + `tests/map/bearingRangeTrackSnap.test.js` **before** wiring the hook.
- [ ] Extend `BearingRangeLine` with `startTrackId` / `endTrackId` (null = free geographic endpoint).
- [ ] At permanent commit only: screen-space snap per endpoint via `findSnapTrackAtMapPoint`; recompute geometry with `createBearingRangeLine`.
- [ ] Add track-follow sync effect (or `useBearingRangeTrackSync.js` if hook exceeds ~350 lines): depend on `simulationSnapshot.evaluationTime`, store tracks in ref, bail out on equality before `setLines`.
- [ ] Wire `tracks` from `MapView` with module-level `EMPTY_TRACKS` constant.
- [ ] On track drop: freeze endpoint at last position, clear `*TrackId`.
- [ ] Temporary lines never get track bindings.
- [ ] Manual + unit test matrix — [Track snap](#track-snap-phase-5) rows.

### Phase 6 — Hardening (optional, after 4–5)

- [ ] Integration test: `setData` call order on rapid draw/delete.
- [ ] Promote lines to a small React context if other tools need overlays.
- [ ] Consider making box-zoom modifier rebindable (today hard-coded to Shift).

---

## Operator requirements (June 2026)

These are the product decisions that motivated Phase 4. A future agent should treat them as fixed unless the operator says otherwise.

### Bearing/range interaction model

| Gesture | Expected behavior |
|---------|-------------------|
| Draw-button drag (default: right-drag) | Show a **live** bearing/range measurement while dragging. |
| Release draw button **without** persist modifier | Measurement **disappears**. Nothing is added to `lines[]`. |
| Release draw button **while holding** persist modifier (default: `Shift`) | Line is **committed permanently** to `lines[]`. |
| Short draw-button click (no drag) | Open context menu (map or line actions). |
| Hover over permanent line | Context-menu cursor. |
| Context menu on permanent line | Remove one line / clear all lines. |

**Important:** Temporary preview during drag must feel identical to today's preview (R1–R6). Only the **commit gate on release** changes.

### Keybinds and discoverability

Operators must be able to:

1. **Rebind the persist modifier** in Settings → Keybinds (not hard-coded to Shift in UI forever).
2. See **every map control combination** documented in the Keybinds tab — including combos that are not individually rebindable (e.g. Shift + left-drag box zoom, scroll-wheel zoom).

Bindings that already exist in `ControlBindingsContext` but were **hidden from the settings UI** must be exposed:

- `mapCursor.grabButton` — track select
- `mapCursor.pointerButton` — pointer cursor while held

---

## Product behavior (complete target)

### Core drawing (Phases 1–3)

| # | Requirement |
|---|-------------|
| R1 | While dragging, show a **solid preview line** immediately (no pan/zoom needed to see it). |
| R2 | Preview geometry matches **committed MapLibre lines**: straight segment between projected start and normalized end (no Mercator warp from geographic interpolation). |
| R3 | At world zoom, repeat the **preview line on every visible world copy** (same rules as midpoint labels). |
| R4 | When longitude normalization snaps the endpoint, show **one dashed screen-space segment** from drag origin to cursor **only during active drag**. |
| R5 | On mouse release, the dashed guide **disappears immediately**; any committed line updates the map in the same interaction. |
| R6 | Midpoint **labels render above** the preview canvas. |
| R7 | **Delete one** or **clear all** via context menu removes lines **immediately** from map and labels — no ghosts, no waiting for another draw. |
| R8 | Context menu, hover cursor, and keybind settings continue to work. |
| R9 | Code is **small, testable, and obvious** — suitable for long-term maintenance. |

### Temporary vs permanent lines (Phase 4)

| # | Requirement |
|---|-------------|
| R10 | A draw-button drag measurement is **temporary by default**: the preview disappears on release and **nothing is committed** to `lines[]`. |
| R11 | Holding the **persist modifier** (default: `Shift`) **on release** commits the line to `lines[]` — this is a **permanent** line. |
| R12 | The persist modifier is **rebindable** in Settings → Keybinds (`bearingRangeTool.persistModifier`, keyboard chord array). |
| R13 | Temporary preview during drag behaves exactly like today (R1–R6); only the **commit gate** changes. |
| R14 | Context menu, hover hit-test, delete, and clear-all apply **only to permanent** lines in `lines[]`. |
| R15 | If `persistModifier` is unbound (`[]`), **no drag can produce a permanent line** in modifier-driven modes — all measurements are temporary. |

### Behavior mode selector (Phase 4c)

| # | Requirement |
|---|-------------|
| R26 | Settings → Look & Feel exposes a **Bearing/Range Behavior** select with four modes: temporary by default, permanent by default (inverted), always permanent, never permanent. |
| R27 | `temporary_default` matches Phase 4 behavior: release without modifier discards; modifier on release commits. |
| R28 | `permanent_default` inverts Phase 4: release commits; modifier on release discards. |
| R29 | `always_permanent` commits every valid drag regardless of modifier state. |
| R30 | `never_permanent` never commits regardless of modifier state. |
| R31 | Complete Control Reference updates its bearing/range entries when the behavior mode changes. |
| R32 | Committed lines must update the MapLibre layer immediately on commit, delete, and clear-all — labels and map geometry stay in sync. |
| R33 | A failed `setBearingRangeLines` on the hot path must schedule an idle retry; map geometry must not lag behind `linesRef` / labels. |
| R34 | Routine updates to an **existing** GeoJSON source must not be blocked by `map.isStyleLoaded()` — only first source/layer creation may wait for style readiness. |

### Keybinds documentation (Phase 4b)

| # | Requirement |
|---|-------------|
| R16 | Settings → Keybinds exposes **Persist Line Modifier** with click-to-capture UI (same pattern as camera keys). |
| R17 | Settings → Keybinds exposes **all mouse bindings** used by the map: drag, center, grab, pointer, draw, context menu. |
| R18 | Settings → Usage Guide includes a **Complete Control Reference** section listing every operator control combo, updating dynamically when bindings change. |
| R19 | Fixed combos (not individually rebindable today) are still listed with a note — e.g. box zoom = `Shift + Left Mouse + drag`. |

### Track-attached permanent lines (Phase 5)

| # | Requirement |
|---|-------------|
| R20 | When a **permanent** line is committed (R11), each endpoint is evaluated **independently** for track snap. Start only, end only, or **both** may attach. |
| R21 | Snap detection uses **screen space (pixels)**, not nautical miles. Anything generally on or near rendered track symbology should qualify at any zoom level. |
| R22 | Snap is evaluated **once at commit time** (creation). Endpoints do **not** retroactively snap if a track later moves under a free endpoint. |
| R23 | After commit, any endpoint bound to a track **follows that track's geographic position** as the simulation updates (bearing/range label recomputed). |
| R24 | **Temporary** lines (preview only, not committed) never get track bindings and never follow tracks. |
| R25 | Free endpoints (no snap at commit) stay fixed in geographic space. |

#### Snap detection (screen space)

Use the same mechanism as track pick — `map.queryRenderedFeatures` with a pixel bounding box — not great-circle distance in NM.

**Layers to query (recommended default):**

- `tracks-symbols` (`TRACK_LAYER_ID`)
- `tracks-labels` (`TRACK_LABEL_LAYER_ID`)

Do **not** include velocity-vector layers in v1 unless product explicitly requests it (vectors are not in track pick today).

**Snap radius (pixels):**

```
snapPaddingPx = round((iconSize × zoomScale) / 2) + SNAP_MARGIN_PX
```

| Constant | Default | Source |
|----------|---------|--------|
| `iconSize` | `40` | `MapView` → `useTrackMapLayer({ iconSize: 40 })` |
| `zoomScale` | `getTrackIconScaleForZoom(map.getZoom())` | `app/simulation/mapViewportUtils.js` |
| `SNAP_MARGIN_PX` | `8` | New constant in `trackHitTest.js` |

This is intentionally **wider** than the 6 px track hover/pick padding (`TRACK_HIT_TEST_PADDING`) so "generally close" feels natural.

**Tie-breaking:** If multiple tracks overlap the query box, choose the track whose **projected center** is closest to the endpoint in pixel space.

**Anchor point:** Snap to the track's **geographic center** (symbol point), using the same coordinate normalization as `useTrackMapLayer` (`longitude`/`latitude`, `coordinates[]`, or `lng`/`lat`).

#### Bound track lifecycle (recommended defaults)

| Event | Default behavior |
|-------|------------------|
| Track moves | Recompute bound endpoint(s); update line geometry, labels, and map layer. |
| Track dropped / removed from simulation | **Freeze** endpoint at last known position; **clear** the `*TrackId` binding. Line remains. |
| Both ends snap to same track | **Allowed.** Line length goes to ~0 nm until the track moves. |
| Visual indicator for snapped ends | **None in v1** (invisible follow). Optional polish later. |

---

## What went wrong in the pre-rewrite hook (root causes)

Understanding these failures explains design constraints for all future work.

### 1. Two renderers + handoff state machine

Preview on canvas (fast) and committed lines on MapLibre (correct for hit-testing) were bridged by a **handoff** period (`handoffInProgress`, `waitForCommittedLineRendered`, etc.). That created a third lifecycle between preview and committed and caused visible glitches and race bugs.

**Rule going forward:** Preview canvas exists **only** while `drag !== null`. No handoff overlap.

### 2. Too many ways to write the map

Concurrent `setData` paths (sync, async, idle re-sync, effect re-sync) produced **stale geometry wins** — deleted lines reappearing, new lines vanishing.

**Rule going forward:** One write API; prefer **synchronous** `setData` from explicit handler calls + style rehydrate only. If a sync write cannot run yet (source not created), **retry on `idle`** — never update labels ahead of a silently skipped map write. See [Phase 3c](#phase-3c--map-layer-sync-labels-vs-geometry-desync).

### 2b. Labels updated but map write skipped (Phase 3b regression)

Phase 3b fixed preview flash by syncing `clearPreview()` with `setData`, but an over-broad `isStyleLoaded()` guard caused `setBearingRangeLines` to return `false` while `linesRef` and labels had already advanced. Operators saw tooltips without lines, or ghost lines after clear-all.

**Rule going forward:** `linesRef`, labels, and GeoJSON `setData` are one logical write. Either all three succeed in the handler tick, or `scheduleMapFlush()` retries until the map catches up.

### 3. Duplicate label systems

Separate preview and committed marker pools fought z-order and cleanup.

**Rule going forward:** One label sync path driven by `lines[]` plus optional single preview line during drag.

### 4. Monolithic file

Geometry, rendering, input, and layer management in one ~1,280-line hook — untestable and fragile.

**Rule going forward:** Pure functions in `app/tools/map/`; hook is a thin FSM.

---

## Architecture

### Design principle: one owner per concern

```
┌──────────────────────────────────────────────────────────────────┐
│                      useBearingRangeTool                         │
│           (thin orchestrator + pointer FSM + track sync)          │
└────────────┬─────────────────────┬──────────────────┬────────────┘
             │                     │                  │
    ┌────────▼────────┐   ┌────────▼────────┐  ┌──────▼──────┐
    │ Preview canvas   │   │  MapLibre layer │  │ Label mgr   │
    │ (in-drag ONLY)   │   │  (permanent)    │  │             │
    └────────┬─────────┘   └────────┬────────┘  └──────┬──────┘
             │                     │                  │
             └─────────────────────┼──────────────────┘
                                   │
              ┌────────────────────▼────────────────────┐
              │  Pure geometry (bearingRangeGeometry.js)   │
              └────────────────────┬────────────────────┘
                                   │
              ┌────────────────────▼────────────────────┐
              │  Track hit-test (trackHitTest.js)        │
              │  Screen-space snap at commit             │
              └─────────────────────────────────────────┘
```

### File layout

#### Implemented on `main`

| File | Responsibility |
|------|----------------|
| `app/tools/map/bearingRangeGeometry.js` | Pure math: normalize lng, bearing/range, midpoint, `isEndpointNormalized`, world-copy offsets, `createBearingRangeLine`, feature builders. **Unit-testable.** |
| `app/tools/map/bearingRangePreviewCanvas.js` | Create/resize/clear/draw overlay; screen segments + dashed guide. No React. |
| `app/tools/map/bearingRangeMapLayer.js` | `ensureBearingRangeLayer`, sync `setBearingRangeLines`, async `rehydrateBearingRangeLines`, `getBearingRangeLineAtMapPoint`. |
| `app/tools/map/bearingRangeLabels.js` | `BearingRangeLabelManager` — create/update/remove midpoint markers. |
| `app/hooks/map/useBearingRangeTool.js` | State machine, pointer listeners, orchestration. **Target ≤ 350 lines** after Phase 5. |
| `app/tools/settings/controlReference.js` | Pure `buildControlReference(controlBindings)` for Settings → Keybinds |
| `app/tools/settings/controlBindingMatchers.js` | `eventModifierKeysMatchBinding` helper |
| `tests/map/bearingRangeGeometry.test.js` | Geometry unit tests. |
| `app/tools/map/bearingRangeBehavior.js` | Behavior mode constants + `shouldPersistBearingRangeLine` |
| `tests/map/bearingRangeBehavior.test.js` | Behavior mode unit tests |

#### To add (Phase 5)

| File | Responsibility |
|------|----------------|
| `app/tools/map/trackHitTest.js` | Shared `queryTrackAtMapPoint(map, mapPoint, { paddingPx })` and `findSnapTrackAtMapPoint(map, mapPoint, options)`. Extract from `useTrackMapLayer.js`. |
| `app/tools/map/bearingRangeTrackSnap.js` | Pure helpers: `applyTrackSnapToEndpoint`, `updateLineFromTracks(line, trackById)`, `getTrackLngLat(track)`. Unit-testable. |
| `tests/map/bearingRangeTrackSnap.test.js` | Snap selection, line recomputation, freeze-on-drop behavior. |
| `tests/map/trackHitTest.test.js` | Optional; mock `queryRenderedFeatures` if needed. |

Settings changes (Phase 4 — complete):

| File | Change |
|------|--------|
| `app/contexts/ControlBindingsContext.js` | `persistModifier`, `eventModifierKeysMatchBinding`, normalization keys |
| `app/components/panels/settings/modal/pages/SettingsModalKeybindsPage.js` | Persist modifier row, full mouse controls, Unbind All button |
| `app/components/panels/settings/modal/pages/SettingsModalUsageGuidePage.js` | Complete Control Reference (read-only) |

### Data model

#### `BearingRangeLine` (permanent, in `lines[]`)

```typescript
type LngLat = { lng: number; lat: number }
type MapPoint = { x: number; y: number }
type ClientPoint = { x: number; y: number }

type BearingRangeLine = {
  id: string

  // Committed geometry (updated when bound tracks move)
  start: LngLat
  end: LngLat
  rawEnd: LngLat              // pre-normalization end (for dashed guide if ever re-opened)
  isEndNormalized: boolean
  midpoint: LngLat
  bearingDegrees: number
  rangeNauticalMiles: number

  // Screen anchors at last layout (refresh when geometry changes)
  startPoint: ClientPoint
  endPoint: ClientPoint
  startMapPoint: MapPoint
  endMapPoint: MapPoint

  // Phase 5 — optional track bindings (null = free geographic endpoint)
  startTrackId: string | null
  endTrackId: string | null
}
```

- `startTrackId` / `endTrackId` are set **only** when `shouldPersistLine` is true **and** snap succeeds at commit.
- Recompute geometry via `createBearingRangeLine` whenever bound track positions change.
- Refresh `*Point` / `*MapPoint` via `map.project` after geometry updates.

#### Drag state (temporary, never in `lines[]`)

```typescript
type DragState = {
  time: number
  start: { point: ClientPoint; mapPoint: MapPoint; lngLat: LngLat }
  current: { point: ClientPoint; mapPoint: MapPoint; lngLat: LngLat }
}
```

Preview is derived from `drag` on each `pointermove`; it is **never** committed unless R11 is satisfied on `pointerup`.

---

## State machine

### Pointer FSM (core)

```
        pointerdown (draw button)
 idle ──────────────────────────► dragging
        ◄──────────────────────────┘
        pointerup / cancel              pointermove updates preview

 dragging ──pointerup──► idle
              │
              ├─ context menu gesture? → open menu, no commit
              ├─ deltaPixels < min?    → discard, no commit
              ├─ persist modifier?     → commit permanent line (Phase 4+)
              └─ else                  → discard temporary line (Phase 4)

 idle ──context menu delete/clear──► idle
              │  update lines[] → mapLayer → labels
              └─ done
```

### `finishDrag` logic (Phase 4) — implement in modular hook

This is the exact decision tree from the PR #72 prototype, adapted for the modular `finishDrag` / `handlePointerUp` handler. **This is the only behavior change for Phase 4** — preview rendering stays the same.

```javascript
function finishDrag(event, dragStart, endPoint) {
  const deltaTime = performance.now() - dragStart.time
  const deltaPixels = getDistancePixels(dragStart.point, endPoint.point)

  // 1. Context menu gesture (short click, minimal movement)
  const shouldOpenContextMenu =
    mouseButtonMatchesBinding(eventButton, bindings.contextMenuButton)
    && deltaTime <= bindings.contextMenuMaxMs
    && deltaPixels <= bindings.contextMenuMaxPixels

  if (shouldOpenContextMenu) {
    clearPreview()
    onContextMenu?.({ point, mapPoint, lngLat, line: hitTestPermanentLine(endPoint) })
    return
  }

  // 2. Too short to measure
  if (deltaPixels < bindings.minPersistedLinePixels) {
    clearPreview()
    return
  }

  // 3. Commit gate — temporary vs permanent
  const shouldPersistLine = eventModifierKeysMatchBinding(event, bindings.persistModifier)

  clearPreview()  // synchronous — same tick as map write; never defer to async .finally()

  if (!shouldPersistLine) {
    return  // temporary measurement only; lines[] unchanged
  }

  // 4. Permanent commit (Phase 5 adds track snap before append)
  const line = createBearingRangeLine(dragStart, endPoint)
  appendToLines(line)
  setBearingRangeLines(map, lines)  // sync setData + triggerRepaint
  labels.sync(lines)
}
```

**Order matters:** evaluate context-menu gesture **before** minimum-length discard, same as today.

### Hover cursor (Phase 4)

While idle (not dragging), show context-menu cursor when hovering a **permanent** line. **Suppress** hover cursor when:

- Any drag is in progress.
- Map drag button is pressed (`mapCursor.dragButton`).
- Draw button is pressed (`bearingRangeTool.drawButton`).
- **Box-zoom modifier is active:** `event.shiftKey` (hard-coded today in `useRemappableMapDragPan`, `useMapCursor`).
- **Persist modifier is active:** `eventModifierKeysMatchBinding(event, bindings.persistModifier)`.

The PR #72 prototype used:

```javascript
const modifierKeyActive =
  event.shiftKey
  || eventModifierKeysMatchBinding(event, bindings.persistModifier)
```

Keep both checks so box-zoom Shift and a rebound persist modifier (e.g. Control) both suppress line hover.

### Commit path (permanent line, Phase 4 + 5)

On `pointerup` when `shouldPersistLine` is true and the line meets minimum pixel length:

```
1. Build draft line from drag start/end (createBearingRangeLine).
2. [Phase 5] For each endpoint mapPoint:
     a. findSnapTrackAtMapPoint(map, mapPoint, { paddingPx: snapPaddingPx })
     b. If track found → set *TrackId and override endpoint lngLat from track position.
3. Recompute final line geometry (bearing/range/midpoint).
4. Append to lines[].
5. setBearingRangeLines(map, lines) — same tick.
6. previewCanvas.clear().
7. labels.sync(lines).
```

**Do not** bind tracks for temporary releases.

### Track follow sync (Phase 5)

Runs when simulation track positions change — **not** on every map pan/zoom.

```
Input:  lines[] with any startTrackId or endTrackId
        trackById from simulation snapshot (MapView passes tracks)

For each bound line:
  For each bound endpoint:
    If track missing → freeze lngLat, clear *TrackId
    Else if track lng/lat changed → update endpoint
  If any endpoint changed → recompute line geometry
If any line changed → setBearingRangeLines + labels.sync
```

**React effect guidance** (see `airspace-sim/AGENTS.md`):

- Pass `simulationSnapshot.tracks` from `MapView` into `useBearingRangeTool`.
- Store tracks in a **ref** inside the sync effect; depend on a stable tick signal (e.g. `simulationSnapshot.evaluationTime`) — **not** `tracks ?? []` inline in deps.
- Bail out with equality check before `setLines` to avoid re-render loops.

---

## Control bindings (complete reference)

All bindings persist in the `controlBindings` cookie via `ControlBindingsContext`.

### Default values

```javascript
// app/contexts/ControlBindingsContext.js — DEFAULT_CONTROL_BINDINGS

keyboardCamera: {
  panUp: ['w'],
  panLeft: ['a'],
  panDown: ['s'],
  panRight: ['d'],
  panSpeedModifier: ['shift'],
  panSpeedMultiplier: 2.5,
  regularPanSpeed: 1000,
  centerMap: [],                    // unbound by default; optional key for center-at-cursor
},

mapCursor: {
  dragButton: MOUSE_BUTTONS.left,   // pan map
  grabButton: MOUSE_BUTTONS.left,   // click track → Track Management window
  pointerButton: MOUSE_BUTTONS.right, // hold → pointer cursor
  centerButton: MOUSE_BUTTONS.middle, // click → center map at cursor
},

bearingRangeTool: {
  drawButton: MOUSE_BUTTONS.right,
  contextMenuButton: MOUSE_BUTTONS.right,
  persistModifier: ['shift'],       // Phase 4 — hold on release to commit line
  contextMenuMaxMs: 250,
  contextMenuMaxPixels: 6,
  minPersistedLinePixels: 24,
},
```

### Phase 4 additions to `ControlBindingsContext`

1. Add `persistModifier: ['shift']` to `bearingRangeTool` defaults.
2. Add `BEARING_RANGE_KEYBOARD_BINDING_KEYS = ['persistModifier']` for normalize/clear/unbind logic (mirror `KEYBOARD_BINDING_KEYS` pattern).
3. Add exported helper:

```javascript
export function eventModifierKeysMatchBinding(event, bindingKeys) {
  if (!bindingKeys?.length) return false
  return bindingKeys.some((key) => {
    const k = key.toLowerCase()
    if (k === 'shift') return event.shiftKey
    if (k === 'control') return event.ctrlKey
    if (k === 'alt') return event.altKey
    if (k === 'meta') return event.metaKey
    return false
  })
}
```

Use this on `pointerup` for the persist gate. Supports Shift, Control, Alt, Meta — not arbitrary letter keys (those are not modifier flags on mouse events).

### Sensitivity settings (already in Keybinds UI)

| Key | Default | Meaning |
|-----|---------|---------|
| `contextMenuMaxMs` | `250` | Max press duration for context-menu click |
| `contextMenuMaxPixels` | `6` | Max movement for context-menu click |
| `minPersistedLinePixels` | `24` | Min drag length before preview/commit is considered |

---

## Keybinds settings UI (Phase 4b)

File: `app/components/panels/settings/modal/pages/SettingsModalKeybindsPage.js`

### New / expanded sections

1. **Keyboard Camera Controls** — existing (WASD, speed modifier, center map key). Pan speed sliders live on Settings → Look & Feel.
2. **Mouse Controls** — expand to six selectors:

| Setting key | Section | Label |
|-------------|---------|-------|
| `dragButton` | `mapCursor` | Map Drag Button |
| `centerButton` | `mapCursor` | Center Map Button |
| `grabButton` | `mapCursor` | Track Select Button |
| `pointerButton` | `mapCursor` | Pointer Cursor Button |
| `drawButton` | `bearingRangeTool` | Bearing/Range Draw Button |
| `contextMenuButton` | `bearingRangeTool` | Context Menu Button |

3. **Bearing/Range Keyboard Modifier** — click-to-capture row grouped with other keyboard bindings on the Keybinds page.

| Key | Label | Description |
|-----|-------|-------------|
| `persistModifier` | Persist Line Modifier | Hold while releasing a bearing/range draw to keep the line on the map. Without this key, lines disappear when the draw button is released. |

Use binding target format `bearingRangeTool:persistModifier` (or equivalent) so one key-capture listener handles both `keyboardCamera:*` and `bearingRangeTool:*` sections.

4. **Complete Control Reference** — read-only reference cards on Settings → Usage Guide (see below). Line/context menu sensitivity fields live on Settings → Advanced.

### Complete Control Reference — required entries

Build dynamically from current `controlBindings` so labels update when the operator changes bindings. Group by category:

#### Keyboard Camera

| Action | Combo (default) | Notes |
|--------|-----------------|-------|
| Pan north | `W` | |
| Pan east | `D` | |
| Pan south | `S` | |
| Pan west | `A` | |
| Pan faster | `Shift + movement keys` | Uses `panSpeedModifier` binding |
| Center map at cursor | `Center Map key` or `Middle Mouse click` | If center key unbound, show mouse button |

#### Mouse Map Navigation

| Action | Combo (default) | Notes |
|--------|-----------------|-------|
| Pan map | `Left Mouse + drag` | `mapCursor.dragButton` |
| Box zoom to area | `Shift + Left Mouse + drag` | **Fixed** — not rebindable today; `useRemappableMapDragPan` skips pan when `event.shiftKey && button === 0`; `map.boxZoom` enabled |
| Center map at cursor | `Middle Mouse click` | `mapCursor.centerButton` |
| Zoom in or out | `Scroll wheel` | MapLibre default; also Fixed Function Panel buttons |

#### Tracks

| Action | Combo (default) | Notes |
|--------|-----------------|-------|
| Open Track Management window | `Left Mouse click on track` | `mapCursor.grabButton` |
| Dismiss transient track windows | `Left Mouse click on empty map` | Persistent windows stay until closed |
| Pointer cursor | `Right Mouse hold` | `mapCursor.pointerButton` |

#### Bearing/Range Lines

| Action | Combo (default) | Notes |
|--------|-----------------|-------|
| Measure bearing/range (temporary) | `Right Mouse + drag` | Disappears on release |
| Keep bearing/range line on map | `Right Mouse + drag + hold Shift on release` | Uses `persistModifier` binding |
| Open map context menu | `Right Mouse click` | Short click; sensitivity limits apply |
| Open line context menu | `Right Mouse click on line` | Hit-tests permanent lines only |

#### Track Management Windows

| Action | Combo | Notes |
|--------|-------|-------|
| Focus window for keyboard input | Click window header or body | Claims keyboard custody; disables map camera keys |
| Commit text field edits | `Enter` or click away | Deferred text field pattern; Enter blurs |

#### Fixed / non-rebindable combos to document explicitly

These are **not** missing from the product — they are intentionally fixed today. List them so operators are not surprised:

- `Shift + Left Mouse + drag` → box zoom (`useRemappableMapDragPan.js`, `useMapCursor.js`)
- `Shift` held over map → `nesw-resize` cursor (box-zoom mode indicator)
- Scroll wheel over map → zoom in/out (MapLibre `scrollZoom`, enabled by default)
- Fixed Function Panel → Zoom In / Zoom Out buttons (`MapStateProvider.zoomIn` / `zoomOut`)

**Implementation tip:** extract a pure `buildControlReference(controlBindings)` function (can live in the settings page file or `app/tools/settings/controlReference.js`) and map sections to MUI cards with `Chip` labels for combos. The PR #72 prototype used this pattern successfully.

---

## Integration points

### `MapView.js`

```javascript
const trackMapLayer = useTrackMapLayer(...)

const {
  lines,
  removeBearingRangeLine,
  clearBearingRangeLines,
  isDrawingBearingRangeLine,
} = useBearingRangeTool(mapRef, mapReady, {
  onContextMenu: handleMapContextMenu,
  lineColor: theme.palette.mode === 'dark' ? '#fff' : '#111',
  mapCursor,
  // Phase 5:
  tracks: simulationSnapshot?.tracks ?? EMPTY_TRACKS,
  getTrackAtMapPoint: trackMapLayer.getTrackAtMapPoint,
  trackSnapIconSize: 40,
})
```

- Hide cursor coordinate overlay while drawing: `isDrawingBearingRangeLine ? null : cursorInfo`
- Context menu receives `line` from hit-test for remove/clear actions
- `EMPTY_TRACKS` must be a **module-level constant** (never `?? []` in effect deps)

### Related map interaction files

| File | Bearing/range interaction |
|------|---------------------------|
| `useMapContextMenuState.js` | Opens menu at click point; passes `line` for line actions |
| `MapContextMenu.js` | Remove one / clear all bearing-range lines |
| `useMapCursorState.js` | `BEARING_RANGE_HOVER`, `BEARING_RANGE_DRAW` cursor requests |
| `useRemappableMapDragPan.js` | Shift+left skips pan; enables `map.boxZoom` |
| `useMapCursor.js` | Shift → `nesw-resize` cursor over map |
| `useTrackMapLayer.js` | Track pick via `grabButton`; shares hit-test layers with Phase 5 snap |

---

## Known gaps vs this plan

| Gap | Current behavior on `main` | Target |
|-----|---------------------------|--------|
| Preview→commit flash | ✅ Fixed — sync `clearPreview()` + sync `setData` in same handler tick | Done in Phase 3b |
| Map writes | ✅ Sync `setData` from handlers; async `rehydrateBearingRangeLines` on `style.load` only | Done in Phase 3b |
| Hook size | ~500 lines | ≤ 350 after Phase 5 extractions |
| Temporary vs permanent | ✅ Release without modifier discards; persist modifier commits | Done in Phase 4 |
| Keybinds reference | ✅ Full mouse bindings, persist modifier, Complete Control Reference | Done in Phase 4b |
| Map layer sync | ⚠️ Improved | Phase 3c fix landed; idle retry + existing-source `setData` — [details](#phase-3c--map-layer-sync-labels-vs-geometry-desync) |
| Track snap / line snapping | Not implemented | Phase 5 |

---

## Implementation phases (ordered)

### Phase 1 — Extract & test geometry ✅

1. `bearingRangeGeometry.js` + unit tests.

### Phase 2 — Extract renderers ✅

1. Preview canvas, map layer, labels.

### Phase 3 — Rewrite hook ⚠️

1. Modular orchestrator landed.
2. **Remaining:** finish by removing async write queue and fixing preview→commit flash — see [Phase 3b](#phase-3b--fix-previewcommit-flash-prerequisite).

### Phase 3b — Fix preview→commit flash (prerequisite for Phase 4)

1. Make `setBearingRangeLines` synchronous on the commit/delete/clear hot path.
2. Remove `mapWritePromiseRef` queue from `useBearingRangeTool.js`.
3. Call `clearPreview()` synchronously in `finishDrag` — not in `.finally()` after async write.
4. Manual test: no flash on release; rapid draw/delete still correct.

### Phase 3c — Map layer sync (labels vs geometry desync)

1. Split `setBearingRangeLines`: existing source → immediate `setData`; new source → wait for `isStyleLoaded`.
2. Add `flushLinesToMapLayer` + `scheduleMapFlush` idle retry in `useBearingRangeTool.js`.
3. Manual test: commit, delete, and clear-all keep map geometry and labels in sync.

### Phase 4 — Temporary vs permanent lines

1. Add `persistModifier` + `eventModifierKeysMatchBinding` to `ControlBindingsContext.js`.
2. Gate `finishDrag` / `handlePointerUp` commit on `eventModifierKeysMatchBinding` (see [finishDrag logic](#finishdrag-logic-phase-4--implement-in-modular-hook)).
3. Update hover-cursor suppression for persist modifier.
4. Manual test: release without modifier → no line; release with modifier → line persists.
5. Update README when shipped.

**Depends on Phase 3b** — do not implement the commit gate on top of the async preview handoff.

### Phase 4b — Keybinds UI and control reference

1. Add **Persist Line Modifier** capture row to `SettingsModalKeybindsPage.js`.
2. Expose `grabButton` and `pointerButton` in mouse controls grid.
3. Add **Complete Control Reference** section per [required entries](#complete-control-reference--required-entries).
4. Update `settings-roadmap.md` when shipped.

**Do not merge PR #72.** Re-implement these UI changes on current `main`; the prototype diff is a reference only.

### Phase 5 — Track-attached endpoints

1. Add `trackHitTest.js`; refactor `useTrackMapLayer` to use it.
2. Add `bearingRangeTrackSnap.js` + tests.
3. Extend `BearingRangeLine` with `startTrackId` / `endTrackId`.
4. Snap at commit in `finishDrag` (permanent lines only).
5. Add track-follow effect (or `useBearingRangeTrackSync.js` if hook grows).
6. Wire `tracks` from `MapView`.
7. Manual + unit tests per matrix below.

### Phase 6 — Hardening (optional)

- Integration test: `setData` call order on rapid draw/delete.
- Promote lines to a small React context if other tools need overlays.
- Consider making box-zoom modifier rebindable (today hard-coded to Shift).

---

## Test matrix

### Core (Phases 1–3)

| Scenario | Expected |
|----------|----------|
| Drag short line (< min pixels) | No preview, no commit |
| Drag long line, release | Solid preview during drag; **no flash** on release; line commits (until Phase 4: only with persist modifier) |
| Drag across antimeridian | Dashed guide during drag; solid normalized line; world copies at low zoom |
| Draw 10+ lines quickly | All permanent lines remain visible |
| Clear all | Map empty immediately; labels gone |
| Delete one | That line gone immediately |
| Clear all → draw new line | New line visible and stays (with persist modifier) |
| Pan/zoom during drag | Preview tracks correctly |
| Pan/zoom after commit | Lines and labels track |
| Right-click context menu on line | Opens menu; delete works |
| Style reload / theme change | Lines reappear with correct color |

### Preview→commit transition (Phase 3b)

| Scenario | Expected |
|----------|----------|
| Release after long drag | Preview clears and committed line appears in the **same frame** — no flash, no double line, no brief blank |
| Rapid draw 10+ lines | All lines visible; no preview ghosts left on canvas |
| Delete one during/after draw | Immediate removal; no preview canvas leftover |
| Style reload mid-session | Lines reappear; no flash on next draw |

### Map layer sync (Phase 3c)

| Scenario | Expected |
|----------|----------|
| Commit permanent line | MapLibre line visible in the **same interaction** as preview clear; label and line both present |
| Clear all with 10+ lines | Map empty and labels gone **together** — no ghost lines |
| Delete one line | That line removed from map and labels **together** |
| Write while style loading (source not yet created) | `scheduleMapFlush` retries on `idle`; geometry eventually matches `linesRef` |
| Write with existing source | `setData` runs even if `isStyleLoaded()` is false — no silent skip |

### Temporary vs permanent (Phase 4)

| Scenario | Expected |
|----------|----------|
| Drag and release **without** persist modifier | Preview clears; **no** line in `lines[]` |
| Drag and release **with** persist modifier held | Line committed to `lines[]` |
| Rebind persist modifier in Settings | New binding honored after cookie save |
| Unbind persist modifier | No drag can create permanent lines |
| Context menu after temporary measure | No line to delete; clear-all unchanged if no permanent lines |
| Hover over permanent line | Context-menu cursor |
| Hover while holding persist modifier | No line hover cursor |

### Keybinds UI (Phase 4b)

| Scenario | Expected |
|----------|----------|
| Change persist modifier to Control | Reference section shows Control; commit works with Control held on release |
| Change draw button to Middle Mouse | Reference and drawing both use new button |
| Complete Control Reference | Lists all sections in [required entries](#complete-control-reference--required-entries) |
| Reset Keybinds page | Restores defaults including `persistModifier: ['shift']` |

### Track snap (Phase 5)

| Scenario | Expected |
|----------|----------|
| Permanent line, start on track symbol | `startTrackId` set; start follows track |
| Permanent line, end on track symbol | `endTrackId` set; end follows track |
| Permanent line, both ends near two tracks | Both ends bound independently |
| Permanent line, both ends near **same** track | Both bindings set; ~0 nm range until track moves |
| Permanent line, endpoint in empty ocean | Free endpoint; fixed geo position |
| Track moves after commit | Bearing/range label updates |
| Track dropped after commit | Endpoint freezes; binding cleared |
| Temporary measure over track, release without modifier | No commit; no binding |
| Zoom in/out | Snap at commit used pixel box — no re-snap on zoom |
| Endpoint just outside snap radius | No binding (free endpoint) |

---

## Success criteria (complete system)

1. `useBearingRangeTool.js` ≤ ~350 lines; bearing-range code ≤ ~1,000 lines across modules (excluding tests).
2. **One** code path writes committed geometry to the map (sync `setData` from handlers + style rehydrate).
3. Preview canvas used **only** while `drag !== null`; **no flash** on release (Phase 3b).
4. Delete/clear immediate with 20+ lines (manual matrix).
5. No `handoff*`, `flushChain`, or revision-based async write queues.
6. Temporary vs permanent behavior matches R10–R15.
7. Keybinds page documents all operator controls per R16–R19.
8. Track snap matches R20–R25 with screen-space detection.
9. Unit tests cover geometry and track-snap recomputation.

---

## Agent implementation checklist

Use this as a literal work order. Do not skip steps.

### Before you start

- [ ] Read this document end-to-end.
- [ ] Read `airspace-sim/AGENTS.md` (React effect deps, deferred settings patterns).
- [ ] Run `npm test` in `airspace-sim/` before and after changes.
- [ ] Confirm you are on **modular** `main` (geometry/map layer/labels split exists). **Do not merge PR #72.**

### Phase 3b — Fix flash (do first)

- [x] Make `setBearingRangeLines` sync on commit/delete/clear path (`bearingRangeMapLayer.js`).
- [x] Remove `mapWritePromiseRef` and revision-retry loop (`useBearingRangeTool.js`).
- [x] Move `clearPreview()` into synchronous `finishDrag` — remove `.finally(() => clearPreview())` pattern.
- [ ] Manual test: [Preview→commit transition](#previewcommit-transition-phase-3b) matrix.

### Phase 3c — Map layer sync

- [x] Split existing-source vs new-source paths in `setBearingRangeLines` (`bearingRangeMapLayer.js`).
- [x] Add `flushLinesToMapLayer` + `scheduleMapFlush` idle retry (`useBearingRangeTool.js`).
- [ ] Manual test: [Map layer sync](#map-layer-sync-phase-3c) matrix.

### Phase 4 — Temporary vs permanent

- [x] Add `persistModifier` + `eventModifierKeysMatchBinding` to `ControlBindingsContext.js`.
- [x] Gate `finishDrag` commit per [finishDrag logic](#finishdrag-logic-phase-4--implement-in-modular-hook).
- [x] Update hover-cursor suppression for persist modifier.
- [ ] Manual test: [Temporary vs permanent](#temporary-vs-permanent-phase-4) matrix.

### Phase 4b — Keybinds UI

- [x] Add persist modifier row + expanded mouse controls to `SettingsModalKeybindsPage.js`.
- [x] Add Complete Control Reference per [required entries](#complete-control-reference--required-entries).
- [ ] Manual test: [Keybinds UI](#keybinds-ui-phase-4b) matrix.

### Phase 5 — Line snapping

- [ ] Create `trackHitTest.js`; dedupe from `useTrackMapLayer.js`.
- [ ] Create `bearingRangeTrackSnap.js` + tests **before** wiring the hook.
- [ ] Extend line model with `startTrackId` / `endTrackId`.
- [ ] Wire `tracks` from `MapView` with `EMPTY_TRACKS` constant.
- [ ] Manual test: [Track snap](#track-snap-phase-5) matrix.

### Ship docs

- [x] Update root `README.md` + `settings-roadmap.md` when user-visible behavior ships.

---

## Recommendation

**Do not patch the old monolith. Do not merge PR #72.** The modular layout on `main` is the foundation.

Ship in order:

1. **Phase 3b** — fix preview→commit flash (sync map writes, remove write queue). **Blocker for everything below.**
2. **Phase 4** — temporary vs permanent commit gate.
3. **Phase 4b** — keybinds UI and complete control reference (can land in the same PR as Phase 4).
4. **Phase 5** — track-attached endpoints / line snapping (snap applies only to permanent lines).

The experience should feel boring: drag → see line → release (with modifier if permanent) → line is on the map with no flash → attached ends follow tracks → delete → line is gone. If any step needs a state machine with more than a handful of explicit states, the design has slipped.
