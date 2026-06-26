# Bearing Range Tool — Rewrite Plan

**Last updated:** June 2026  
**Audience:** Contributors and agents implementing or extending the map bearing/range tool.

This document is the **single source of truth** for how the bearing/range system should work. It captures:

1. Why the original monolithic hook was rewritten.
2. What has already landed on `main`.
3. What still needs to be built (temporary vs permanent lines, track snapping).
4. Exact data models, file boundaries, and test expectations so a future agent can implement the remaining work **without re-discovering requirements in chat**.

User-facing behavior is also summarized in the [repository root README](../README.md). In-app roadmap items live in `airspace-sim/app/content/settings-roadmap.md`.

---

## Status at a glance

| Area | Status | Notes |
|------|--------|-------|
| Modular geometry (`bearingRangeGeometry.js`) | ✅ On `main` | Unit tests in `tests/map/bearingRangeGeometry.test.js` |
| Preview canvas overlay | ✅ On `main` | `bearingRangePreviewCanvas.js` |
| MapLibre committed layer | ✅ On `main` | `bearingRangeMapLayer.js` |
| Label manager | ✅ On `main` | `bearingRangeLabels.js` |
| Thin hook orchestrator | ⚠️ Partial | `useBearingRangeTool.js` is modular but still uses async map writes and a write queue — see [Known gaps](#known-gaps-vs-this-plan) |
| Temporary vs permanent lines | ❌ Not on `main` | Designed on branch `cursor/bearing-range-temp-lines-keybinds-fdde`; spec below |
| Track-attached endpoints | ❌ Not started | Spec below (this document) |

**Historical context:** [PR #73](https://github.com/danvanbueren/airspace-sim/pull/73) accumulated incremental fixes on top of a dual-renderer design. The pre-rewrite hook was ~1,280 lines, mixed geometry/canvas/MapLibre/input/labels, and had unreliable deletes/commits. Phases 1–3 below addressed that split. Phases 4–5 are the next product increments.

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
| R10 | A right-drag (draw-button) measurement is **temporary by default**: the preview disappears on release and **nothing is committed** to `lines[]`. |
| R11 | Holding the **persist modifier** (default: `Shift`) **on release** commits the line to `lines[]` — this is a **permanent** line. |
| R12 | The persist modifier is **rebindable** in Settings → Keybinds (`bearingRangeTool.persistModifier`, keyboard chord array). |
| R13 | Temporary preview during drag behaves exactly like today (R1–R6); only the **commit gate** changes. |
| R14 | Context menu, hover hit-test, delete, and clear-all apply **only to permanent** lines in `lines[]`. |

**Reference implementation:** branch `cursor/bearing-range-temp-lines-keybinds-fdde` (commit `3b79e41`). Merge or re-implement on top of current modular layout.

### Track-attached permanent lines (Phase 5)

| # | Requirement |
|---|-------------|
| R15 | When a **permanent** line is committed (R11), each endpoint is evaluated **independently** for track snap. Start only, end only, or **both** may attach. |
| R16 | Snap detection uses **screen space (pixels)**, not nautical miles. Anything generally on or near rendered track symbology should qualify at any zoom level. |
| R17 | Snap is evaluated **once at commit time** (creation). Endpoints do **not** retroactively snap if a track later moves under a free endpoint. |
| R18 | After commit, any endpoint bound to a track **follows that track's geographic position** as the simulation updates (bearing/range label recomputed). |
| R19 | **Temporary** lines (preview only, not committed) never get track bindings and never follow tracks. |
| R20 | Free endpoints (no snap at commit) stay fixed in geographic space. |

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

These are product decisions. Defaults below let an agent ship without blocking on further input; change only if the operator confirms otherwise.

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

**Rule going forward:** One write API; prefer **synchronous** `setData` from explicit handler calls + style rehydrate only.

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
| `app/tools/map/bearingRangeMapLayer.js` | `ensureBearingRangeLayer`, `setBearingRangeLines`, `getBearingRangeLineAtMapPoint`. |
| `app/tools/map/bearingRangeLabels.js` | `BearingRangeLabelManager` — create/update/remove midpoint markers. |
| `app/hooks/map/useBearingRangeTool.js` | State machine, pointer listeners, orchestration. **Target ≤ 350 lines** after Phase 4–5. |
| `tests/map/bearingRangeGeometry.test.js` | Geometry unit tests. |

#### To add (Phase 4–5)

| File | Responsibility |
|------|----------------|
| `app/tools/map/trackHitTest.js` | Shared `queryTrackAtMapPoint(map, mapPoint, { paddingPx })` and `findSnapTrackAtMapPoint(map, mapPoint, options)`. Extract from `useTrackMapLayer.js` so track pick and bearing-range snap share one implementation. |
| `app/tools/map/bearingRangeTrackSnap.js` | Pure helpers: `applyTrackSnapToEndpoint`, `updateLineFromTracks(line, trackById)`, `getTrackLngLat(track)`. Unit-testable with mocked positions. |
| `tests/map/bearingRangeTrackSnap.test.js` | Snap selection, line recomputation, freeze-on-drop behavior. |
| `tests/map/trackHitTest.test.js` | Optional; mock `queryRenderedFeatures` if needed. |

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
- Recompute `start`/`end`/bearing/range/midpoint via `createBearingRangeLine` (or a dedicated `updateBearingRangeLineGeometry`) whenever bound track positions change.
- Refresh `*Point` / `*MapPoint` via `map.project` after geometry updates (label anchor direction uses screen points).

#### Drag state (temporary, never in `lines[]`)

```typescript
type DragState = {
  time: number
  start: { point: ClientPoint; mapPoint: MapPoint; lngLat: LngLat }
  current: { point: ClientPoint; mapPoint: MapPoint; lngLat: LngLat }
}
```

Preview lines are derived from `drag` on each `pointermove`; they are **never** committed unless R11 is satisfied on `pointerup`.

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

### Commit path (permanent line, Phase 4 + 5)

On `pointerup` when `shouldPersistLine` is true and the line meets minimum pixel length:

```
1. Build draft line from drag start/end (createBearingRangeLine).
2. For each endpoint mapPoint:
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
- Store tracks in a **ref** inside the sync effect; depend on a stable tick signal (e.g. `simulationSnapshot.evaluationTime`) or shallow position hash — **not** `tracks ?? []` inline in deps.
- Bail out with equality check before `setLines` to avoid re-render loops.

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
  lineColor: ...,
  mapCursor,
  // Phase 5:
  tracks: simulationSnapshot?.tracks ?? EMPTY_TRACKS,
  getTrackAtMapPoint: trackMapLayer.getTrackAtMapPoint, // or import shared hit-test
  trackSnapIconSize: 40,
})
```

`EMPTY_TRACKS` must be a module-level constant (never `?? []` in effect deps).

### `ControlBindingsContext.js` (Phase 4)

Add to `bearingRangeTool`:

```javascript
persistModifier: ['shift'],  // keyboard chord; rebindable in Settings → Keybinds
```

Use `eventModifierKeysMatchBinding(event, bindings.persistModifier)` on `pointerup` (same helper as temp-lines branch).

### `useTrackMapLayer.js`

Replace inline `queryRenderedFeatures` duplication with imports from `trackHitTest.js`. Keep `getTrackAtMapPoint` as a thin wrapper with `TRACK_HIT_TEST_PADDING` (6 px) for **pick/hover**; bearing-range snap uses the wider padding from `bearingRangeTrackSnap.js`.

---

## Known gaps vs this plan

The modular rewrite on `main` is a major improvement but **does not yet fully match** the original Phase 3 target:

| Gap | Current behavior | Target |
|-----|------------------|--------|
| Map writes | `setBearingRangeLines` is `async` with `waitForStyleReady`; hook uses `mapWritePromiseRef` queue | Synchronous `setData` + `triggerRepaint` from handlers; rehydrate on `style.load` only |
| Hook size | ~515 lines | ≤ 350 after Phase 4–5 extractions |
| Temporary vs permanent | Every valid drag commits | Phase 4 gate on persist modifier |
| Track snap | Not implemented | Phase 5 |

Resolve the async write queue when touching the hook for Phase 4 — do not add a third sync mechanism for track follow.

---

## Implementation phases (ordered)

### Phase 1 — Extract & test geometry ✅

1. `bearingRangeGeometry.js` + unit tests.

### Phase 2 — Extract renderers ✅

1. Preview canvas, map layer, labels.

### Phase 3 — Rewrite hook ⚠️

1. Modular orchestrator landed; finish by removing async write queue per [Known gaps](#known-gaps-vs-this-plan).

### Phase 4 — Temporary vs permanent lines

1. Add `persistModifier` to control bindings + Settings → Keybinds UI (see temp-lines branch).
2. Gate `finishDrag` commit on `eventModifierKeysMatchBinding`.
3. Update README and settings roadmap when shipped.
4. Manual test: release without modifier → no line; release with modifier → line persists.

### Phase 5 — Track-attached endpoints

1. Add `trackHitTest.js`; refactor `useTrackMapLayer` to use it.
2. Add `bearingRangeTrackSnap.js` + tests.
3. Extend `BearingRangeLine` with `startTrackId` / `endTrackId`.
4. Snap at commit in `finishDrag` (permanent lines only).
5. Add track-follow `useEffect` in hook (or `useBearingRangeTrackSync.js` if hook grows).
6. Wire `tracks` from `MapView`.
7. Manual + unit tests per matrix below.

### Phase 6 — Hardening (optional)

- Integration test: `setData` call order on rapid draw/delete.
- Promote lines to a small React context if other tools need overlays.

---

## Test matrix

### Core (Phases 1–3)

| Scenario | Expected |
|----------|----------|
| Drag short line (< min pixels) | No preview, no commit |
| Drag long line | Solid preview during drag; line on map after release (until Phase 4 changes commit rules) |
| Drag across antimeridian | Dashed guide during drag; solid normalized line; world copies at low zoom |
| Draw 10+ lines quickly | All remain visible |
| Clear all | Map empty immediately; labels gone |
| Delete one | That line gone immediately |
| Clear all → draw new line | New line visible and stays |
| Pan/zoom during drag | Preview tracks correctly |
| Pan/zoom after commit | Lines and labels track |
| Right-click context menu on line | Opens menu; delete works |
| Style reload / theme change | Lines reappear with correct color |

### Temporary vs permanent (Phase 4)

| Scenario | Expected |
|----------|----------|
| Drag and release **without** persist modifier | Preview clears; **no** line in `lines[]` |
| Drag and release **with** persist modifier held | Line committed |
| Rebind persist modifier in Settings | New binding honored after save |
| Context menu after temporary measure | No line to delete; clear-all unchanged if no permanent lines |

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
3. Preview canvas used **only** while `drag !== null`.
4. Delete/clear immediate with 20+ lines (manual matrix).
5. No `handoff*`, `flushChain`, or revision-based async write queues.
6. Temporary vs permanent behavior matches R10–R14.
7. Track snap matches R15–R20 with screen-space detection.
8. Unit tests cover geometry and track-snap recomputation.

---

## Agent implementation checklist

Use this as a literal work order. Do not skip steps.

- [ ] Read this document end-to-end.
- [ ] Read `airspace-sim/AGENTS.md` (React effect deps, deferred settings patterns).
- [ ] Run `npm test` in `airspace-sim/` before and after changes.
- [ ] **Phase 4:** Implement persist modifier gate; port keybind UI from `cursor/bearing-range-temp-lines-keybinds-fdde` if not merged.
- [ ] **Phase 4:** Remove or simplify async `mapWritePromiseRef` while touching `finishDrag`.
- [ ] **Phase 5:** Create `trackHitTest.js`; dedupe from `useTrackMapLayer.js`.
- [ ] **Phase 5:** Create `bearingRangeTrackSnap.js` + tests **before** wiring the hook.
- [ ] **Phase 5:** Extend `createBearingRangeLine` or add `rebuildBearingRangeLineFromBindings` for track updates.
- [ ] **Phase 5:** Wire `tracks` from `MapView` with `EMPTY_TRACKS` constant.
- [ ] Update README + `settings-roadmap.md` when user-visible behavior ships.
- [ ] Manual test matrix — all rows.

---

## Recommendation

**Do not patch the old monolith.** The modular layout on `main` is the foundation. Ship Phase 4 (temporary/permanent) before Phase 5 (track snap) — snap applies only to permanent lines and depends on the commit gate.

The experience should feel boring: drag → see line → release (with modifier if permanent) → line is on the map → attached ends follow tracks → delete → line is gone. If any step needs a state machine with more than a handful of explicit states, the design has slipped.
