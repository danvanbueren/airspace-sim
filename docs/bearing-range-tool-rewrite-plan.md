# Bearing Range Tool — Rewrite Plan

**Status:** Proposed (March 2026)  
**Context:** [PR #73](https://github.com/danvanbueren/airspace-sim/pull/73) accumulated incremental fixes on top of a dual-renderer design. The hook (`useBearingRangeTool.js`) is ~1,280 lines and mixes geometry, canvas drawing, MapLibre lifecycle, pointer input, label DOM, and several overlapping sync mechanisms. Deletes and commits are unreliable; the code is hard to reason about.

This document captures requirements, root causes, and a **clean-slate architecture** intended for a focused rewrite—not more patches.

---

## Requirements (from product / UX)

| # | Requirement |
|---|-------------|
| R1 | While dragging, show a **solid preview line** immediately (no pan/zoom needed to see it). |
| R2 | Preview geometry matches **committed MapLibre lines**: straight segment between projected start and normalized end (no Mercator warp from geographic interpolation). |
| R3 | At world zoom, repeat the **preview line on every visible world copy** (same rules as midpoint labels). |
| R4 | When longitude normalization snaps the endpoint, show **one dashed screen-space segment** from drag origin to cursor **only during active drag**. |
| R5 | On mouse release, the dashed guide **disappears immediately**; the solid line becomes permanent. |
| R6 | Midpoint **labels render above** the preview canvas. |
| R7 | **Delete one** or **clear all** via context menu removes lines **immediately** from map and labels—no ghosts, no waiting for another draw. |
| R8 | Context menu, hover cursor, and keybind settings continue to work unchanged. |
| R9 | Code is **small, testable, and obvious**—suitable for long-term maintenance. |

---

## What went wrong (root causes)

### 1. Two renderers + handoff state machine

We draw preview on a **canvas overlay** (fast) and committed lines on a **MapLibre GeoJSON layer** (correct for hit-testing). A **handoff** period kept the canvas visible until MapLibre “confirmed” render, which introduced:

- `handoffInProgress`, `handoffDataReady`, `pendingCommitGeneration`, `handoffCancelFn`
- `waitForCommittedLineRendered` polling `queryRenderedFeatures`
- Canvas redraw on pan/zoom during handoff

This fixed visual glitches but created a **third lifecycle** between preview and committed.

### 2. Too many ways to write the map

At various times the committed source was updated by:

- Synchronous `setData` in `syncCommittedLinesToMap`
- Async `setData(..., true)` in handoff
- Serialized flush chains with revision counters
- `map.on('idle')` re-sync
- `useEffect` on `[lines]` re-sync

Concurrent async writes + clears = **stale geometry wins**, which matches the “deleted lines come back / new lines vanish” reports.

### 3. Duplicate label systems

- `previewLabelMarkersRef` during drag
- `labelsRef` for committed lines
- Both recreated on move/zoom with world-copy logic

Two marker pools fight the canvas z-order and add cleanup edge cases.

### 4. Monolithic file

Geometry, rendering, input, and layer management live in one hook. Hard to test, hard to review, easy to regress.

---

## Design principle: one owner per concern

```
┌─────────────────────────────────────────────────────────────┐
│                     useBearingRangeTool                     │
│              (thin orchestrator + pointer FSM)                │
└────────────┬──────────────────────┬─────────────────────────┘
             │                      │
    ┌────────▼────────┐    ┌────────▼────────┐
    │  Preview canvas   │    │  MapLibre layer │
    │  (in-drag ONLY)   │    │  (committed)    │
    └────────┬──────────┘    └────────┬────────┘
             │                      │
             └──────────┬───────────┘
                        │
              ┌─────────▼─────────┐
              │  Pure geometry    │
              │  (no map / DOM)   │
              └───────────────────┘
```

**Rule:** Preview canvas exists **only** in `dragging` state. Committed lines exist **only** in MapLibre. **No handoff overlap.**

---

## Proposed architecture

### File layout

| File | Responsibility |
|------|----------------|
| `app/tools/map/bearingRangeGeometry.js` | Pure math: normalize lng, bearing/range, midpoint, `isEndpointNormalized`, world-copy offsets. **Unit-testable.** |
| `app/tools/map/bearingRangePreviewCanvas.js` | Create/resize/clear/draw overlay; screen segments + dashed guide. No React. |
| `app/tools/map/bearingRangeMapLayer.js` | `ensureLayer`, `setLines(map, lines)` — **sync `setData` only**, `triggerRepaint`, `moveLayerToTop`. |
| `app/tools/map/bearingRangeLabels.js` | Create/update/remove midpoint markers (single code path). |
| `app/hooks/map/useBearingRangeTool.js` | State machine, pointer listeners, calls into modules above. Target **&lt; 350 lines**. |

### State machine (explicit, no handoff)

```
        pointerdown (draw button)
 idle ──────────────────────────► dragging
        ◄──────────────────────────┘
        pointerup / cancel              pointermove updates preview

 dragging ──pointerup (valid line)──► idle
              │  1. append to lines[]
              │  2. mapLayer.setLines(lines)   ← sync, same tick
              │  3. previewCanvas.clear()
              │  4. labels.sync(lines)
              └─ done (no async wait)

 idle ──context menu delete/clear──► idle
              │  1. update lines[]
              │  2. mapLayer.setLines(lines)   ← sync
              │  3. previewCanvas.clear()      ← defensive
              │  4. labels.sync(lines)
              └─ done
```

**Delete `handoff` entirely.** If MapLibre is one frame late, tolerate a single-frame flash or call `triggerRepaint()` + optional `requestAnimationFrame` **without** keeping the canvas line.

### Single map write API

```javascript
// bearingRangeMapLayer.js
export function setBearingRangeLines(map, lines) {
  ensureBearingRangeLayer(map, lineColor)
  map.getSource(SOURCE_ID).setData(buildFeatureCollection(lines))
  map.triggerRepaint()
  moveLayerToTop(map)
}
```

- **Always synchronous.** No async `setData`, no queues, no revision refs.
- Typical line counts (dozens, not thousands) make this fine.
- If perf becomes an issue later, add **one** serialized async path behind this function—not scattered call sites.

### Preview canvas rules

- Insert **immediately after** the map canvas (DOM order), no z-index—markers append later and stay on top (R6).
- Draw solid segments: for each world-copy offset, `project(start)` → `project(normalizedEnd)`.
- Draw dashed segment **iff** `dragging && isEndpointNormalized`: screen `startMapPoint` → `endMapPoint`.
- **Never** draw preview after `pointerup`.

### Labels

- **One** marker list driven by `lines` (+ optional single preview marker during drag, or include preview in derived list).
- World-copy longitude logic shared with preview via `bearingRangeGeometry.js`.

### React state (minimal)

```typescript
lines: BearingRangeLine[]           // committed
drag: null | { start, current }     // only while dragging
```

Use a ref mirror of `lines` **only** for pointer handlers inside a stable `useEffect`—not a second source of truth updated by competing effects.

### Pointer handling

- Keep pointer capture + window `pointermove`/`pointerup` (this part worked well).
- Stable effect deps: `[mapRef, enabled]` with refs for everything else.
- **Do not** re-subscribe on every line change.

---

## What we deliberately drop

| Removed | Why |
|---------|-----|
| `waitForCommittedLineRendered` | Caused handoff complexity; sync `setData` + `triggerRepaint` is enough. |
| Async `setData` in normal flow | Source of stale-write races. |
| `mapWritePromise` / revision / flush chains | Over-engineered; sync writes are simpler. |
| `handleIdle` → `syncCommittedLinesToMap` | Re-sync on every idle masks bugs and races; only rehydrate on `style.load`. |
| `useEffect` syncing lines to map on every `lines` change **and** explicit sync in handlers | Pick **one**: explicit calls from handlers + style rehydrate only. |
| Second preview label marker pool | Merge into one label sync. |

---

## Implementation phases

### Phase 1 — Extract & test geometry (low risk)

1. Move pure functions to `bearingRangeGeometry.js`.
2. Add unit tests: normalization, bearing/range, world-copy offsets, `isEndpointNormalized` edge cases near ±180°.

### Phase 2 — Extract renderers (medium risk)

1. `bearingRangePreviewCanvas.js` — canvas only, no handoff.
2. `bearingRangeMapLayer.js` — sync layer management only.
3. `bearingRangeLabels.js` — marker sync.

### Phase 3 — Rewrite hook (higher risk, do in one PR)

1. Replace `useBearingRangeTool.js` with thin FSM orchestrator.
2. Wire `MapView.js` unchanged (same exported API).
3. Manual test matrix (below).
4. Close PR #73; open new PR referencing this doc.

### Phase 4 — Hardening (optional)

- Integration test with mocked map `setData` call order.
- Consider promoting committed lines to a small React context if other tools need map overlays.

---

## Manual test matrix

| Scenario | Expected |
|----------|----------|
| Drag short line (&lt; min pixels) | No preview, no commit |
| Drag long line | Solid preview during drag; committed line on release; no dashed after release |
| Drag across antimeridian | One dashed guide during drag; solid normalized line; both world copies at low zoom |
| Draw 10+ lines quickly | All remain visible |
| Clear all | Map empty immediately; labels gone |
| Delete one | That line gone immediately |
| Clear all → draw new line | New line visible and stays |
| Pan/zoom during drag | Preview tracks correctly |
| Pan/zoom after commit | Lines and labels track |
| Right-click context menu on line | Still opens menu; delete works |
| Style reload / theme change | Lines reappear with correct color |

---

## Success criteria

1. `useBearingRangeTool.js` under ~350 lines; total bearing-range code under ~800 lines across modules.
2. **One** function writes committed geometry to the map.
3. Preview canvas is used **only** while `drag !== null`.
4. Delete/clear tests pass in manual matrix with 20+ lines.
5. No `handoff*`, `flushChain`, or `revision` refs in the codebase.

---

## Recommendation

**Stop patching PR #73.** Branch a rewrite from `main`, implement Phases 1–3 in order, and replace the hook wholesale. Keep the good parts (pointer capture, canvas preview during drag, world-copy math, normalization guide semantics); delete the handoff/async-sync layer cake.

The experience should feel boring: drag → see line → release → line is on the map → delete → line is gone. If any step needs a state machine with more than three states, the design has slipped.
