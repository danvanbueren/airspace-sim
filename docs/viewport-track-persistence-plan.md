# Viewport Track Persistence — Implementation Plan

**Last updated:** June 2026  
**Audience:** Contributors and agents fixing off-viewport track drop and re-initiation.

This document is the **single source of truth** for why auto tracks die when the camera pans or zooms, and how to fix it without sacrificing map rendering performance.

User-facing behavior is summarized in the [repository root README](../README.md). In-app roadmap items live in `airspace-sim/app/content/settings-roadmap.md`.

---

## Status at a glance

| Area | Status | Notes |
|------|--------|-------|
| Root cause analysis | ✅ Complete | Display culling vs simulation viewport coupling |
| Product decisions | ✅ Locked | Maintain existing tracks only; fixed NM sensor padding |
| Failing integration tests | ❌ Not started | Phase 0 acceptance criteria |
| Sensor scan bounds split | ❌ Not started | Display bounds ≠ sensor scan bounds |
| Track-aware sensor coverage | ❌ Not started | Union of viewport + firm track envelope |
| Initiation limited to display bounds | ❌ Not started | New tracks only when in view |
| Lifecycle guards (defense in depth) | ❌ Not started | Optional safety nets |
| Sensor tick display culling | ❌ Not started | Render only viewport ticks if scan area grows |
| Performance validation | ❌ Not started | Existing scripts under `airspace-sim/scripts/` |
| README architecture update | ❌ Not started | Clarify bounds split after implementation |

---

## Problem statement

When the operator pans or zooms the map, tracks outside the current viewport appear to **drop** and then **re-initiate** when the camera returns. Operator metadata tied to the original track (callsign edits, identity, type, correlation mode, drop-protect, etc.) is lost. Re-correlation to “new” sensor data introduces delay and confusion.

**Expected behavior:**

- Off-screen tracks remain firm tracks in the engine with stable IDs and metadata.
- The map may hide off-screen symbols for performance (display culling is fine).
- New automatic tracks should **only** initiate when sensor evidence is inside the **visible** map area.
- Existing tracks must continue to receive sensor correlation updates even when off-screen.

---

## Diagnosis

Two separate mechanisms produce the reported behavior. They feel like one bug because both trigger on pan/zoom.

### 1. Visual disappearance (intentional — not data loss)

On every `move` / `zoom`, `MapView` filters tracks to the expanded viewport and replaces the map layer contents. Off-screen symbols vanish from MapLibre, but tracks **still exist** in `TrackStore` and the full engine snapshot.

**Key files:**

| File | Role |
|------|------|
| `airspace-sim/app/components/map/MapView.js` | `syncVisibleTracks` on map move/zoom |
| `airspace-sim/app/simulation/mapViewportUtils.js` | `getExpandedMapBounds`, `filterTracksByBounds` |
| `airspace-sim/app/hooks/map/useTrackMapLayer.js` | `replaceTracks` — clears render cache, redraws visible subset |

This matches the documented design goal: *“Rendering is not simulation.”*

### 2. Actual track death (the real bug)

Sensor processing is **also** viewport-bound. Every tick, `TrackEngine.tick()` computes bounds from the map view and only scans aircraft inside that region before running correlation and initiation.

**Key code path:**

```
TrackEngine.tick()
  → expandBounds(getMapBounds(map), viewportPaddingDegrees)
  → flightWorld.getAircraftInBounds(bounds)
  → sensorSimulator.scan({ aircraftInBounds, ... })
  → correlation.apply(...)
  → trackInitiation.ingest(...)  // uncorrelated only
```

When a track leaves expanded viewport bounds:

| Time off-viewport | Event |
|-------------------|--------|
| 0 s | Hidden on map; `lastSensorUpdateAt` stops refreshing |
| ~8 s | `stale: true`; active correlated tracks **decorrelated** (`correlated: false`, IFF codes cleared) |
| ~8 s | Auto-drop risk phase begins (`dropRiskAt`) |
| ~13 s | DROP attention flag (`dropAt`) — only visible if track is on map |
| ~23 s | Track **removed** from `TrackStore` via `processAutoDropTracks()` |

When the camera returns, the contact gets fresh viewport-scoped detections, a **new 3-hit plot trail**, and a **new track ID** (`TRK-radar-…` / `TRK-iff-…`).

**Important nuance:** `syncActiveTrackKinematicsFromFlightWorld()` still updates heading, speed, and altitude from the nearest truth aircraft globally, but it does **not** refresh `lastSensorUpdateAt`. Stale / decorrelation / auto-drop logic therefore still fires.

**Key lifecycle files:**

| File | Role |
|------|------|
| `airspace-sim/app/simulation/trackDecorrelation.js` | Stale threshold, decorrelation |
| `airspace-sim/app/simulation/trackAutoDrop.js` | Auto-drop countdown and removal |
| `airspace-sim/app/simulation/CorrelationService.js` | Sets `lastSensorUpdateAt` on correlated sensor updates |

There is **no** engine code that deletes tracks purely because they left viewport bounds. Deletion is an **indirect** consequence of viewport-scoped sensor starvation.

---

## Design principle

```
┌─────────────────────────────────────────────────────────┐
│  SIMULATION (TrackEngine)                               │
│  Firm tracks live globally. Sensor correlation for      │
│  existing tracks must not depend on map visibility.     │
├─────────────────────────────────────────────────────────┤
│  DISPLAY (MapView / map layers)                         │
│  Only render tracks and sensor ticks in viewport.       │
│  No lifecycle impact.                                   │
└─────────────────────────────────────────────────────────┘
```

**Locked product decisions:**

1. **Initiation:** Only maintain **existing** firm tracks off-screen. **New** automatic tracks populate only when sensor evidence is inside the **display** (visible) bounds.
2. **Sensor padding:** Use a **fixed NM** envelope around firm track positions (simple; aligns with existing `findNearestAircraft` radius of 15 NM). Do not tie padding dynamically to correlation threshold.

---

## Implementation phases

Ship in this order:

```
Phase 0  Failing integration tests (acceptance criteria)
   ↓
Phase 1  Explicit bounds concepts (display vs sensor scan)
   ↓
Phase 2  Track-aware sensor scan bounds (core fix)
   ↓
Phase 3  Initiation limited to display bounds
   ↓
Phase 4  Lifecycle guards (defense in depth)
   ↓
Phase 5  Sensor tick display culling
   ↓
Phase 6  Performance validation
   ↓
Phase 7  README + roadmap updates
```

---

### Phase 0 — Failing integration tests

Write tests **before** changing production logic. Use a mock map (see `airspace-sim/scripts/validate-performance-findings.mjs` `createMockMap`) and advance simulated time past stale + auto-drop thresholds.

**Scenarios:**

1. **Lifecycle persistence:** Initiate firm auto track in viewport → move mock map so track is outside expanded bounds → advance time past ~23 s → assert same `trackId`, metadata, and no auto-drop.
2. **No re-initiation on return:** After step 1, pan mock map back → assert no second `TRK-*` ID for the same contact.
3. **Display-only cull (control):** Pan away and back within ~5 s → track hidden then visible on map with same ID (may already pass).

**Suggested location:** `airspace-sim/tests/simulation/viewportTrackPersistence.test.js`

---

### Phase 1 — Explicit bounds concepts

Today `viewportPaddingDegrees` serves double duty for display and sensor scans. Split the concepts in code:

| Concept | Purpose | Used by |
|---------|---------|---------|
| **Display bounds** | What gets drawn on the map | `MapView`, sensor tick rendering |
| **Sensor scan bounds** | What aircraft produce detections for correlation | `TrackEngine.runSensorScan()` |

Keep `viewportPaddingDegrees` for display. Introduce helpers (new module or extend `mapViewportUtils.js`):

- `getDisplayBounds(map, viewportPaddingDegrees)`
- `computeSensorScanBounds(displayBounds, tracks, trackSensorPaddingNm)`

Default `trackSensorPaddingNm`: **15** (matches `FlightWorldSimulator.findNearestAircraft` default `maxDistanceNm`).

---

### Phase 2 — Track-aware sensor scan bounds (core fix)

Compute sensor scan bounds as the **union** of:

1. Expanded **display** bounds (current behavior), and  
2. A bounding envelope around **all firm track positions**, expanded by fixed **track sensor padding (NM)**.

```javascript
// Pseudocode
function computeSensorScanBounds(displayBounds, tracks, trackSensorPaddingNm = 15) {
  const viewportScan = displayBounds // already expanded by viewportPaddingDegrees
  const trackEnvelope = boundingBoxOfTracks(tracks, trackSensorPaddingNm)
  return unionBounds(viewportScan, trackEnvelope)
}
```

**Why this approach:**

- Fixes reported bug: tracks left behind when panning continue to receive sensor correlation where truth aircraft remain scannable.
- Preserves performance: empty viewport with no nearby tracks does not scan the full 800–1500 aircraft fleet.
- Honest simulation: correlation still flows through real sensor pipeline (noise, IFF, merge rules).
- Aligns with module boundaries: `SensorSimulator` stays dumb; `TrackEngine` decides coverage.

**`TrackEngine.tick()` changes:**

- Compute `displayBounds` once per tick.
- Compute `sensorScanBounds` from display bounds + all firm tracks.
- Pass `sensorScanBounds` to `runSensorScan()` (aircraft filter + scan).
- Keep display culling unchanged in `MapView`.

---

### Phase 3 — Initiation limited to display bounds

Split responsibilities inside `runSensorScan()`:

| Step | Bounds |
|------|--------|
| `sensorSimulator.scan` | Sensor scan bounds (union) |
| `correlation.apply` | Uses detections from full sensor scan |
| `mergeTracksFromCorrelatedDetections` | Full sensor scan correlated set |
| `absorbPlotsNearCorrelatedDetections` | Full sensor scan correlated set |
| `trackInitiation.ingest` | **Display bounds only** — filter uncorrelated detections to display bounds before ingest |

This prevents off-screen track sprawl while preserving existing tracks globally.

---

### Phase 4 — Lifecycle guards (defense in depth)

Primary fix is Phase 2. Add guards so viewport visibility alone cannot trigger lifecycle changes:

1. **Stale guard (optional):** Do not mark stale if track recently received kinematic sync from flight world and nearest truth aircraft is within correlation range.
2. **Decorrelation guard:** In `refreshTrackStaleAndDecorrelation()`, skip decorrelation when off-display but nearest aircraft remains within correlation threshold.
3. **Auto-drop guard:** In `processAutoDropTracks()`, do not advance drop countdown when off-display only because the camera moved, not because sensor evidence ended.

Implement only if Phase 2 tests leave edge cases (extrapolation drift, sensor drop/noise at envelope edge).

---

### Phase 5 — Sensor tick display culling

If sensor scan bounds grow beyond display bounds, history buffers hold more detections. Before GeoJSON conversion for map layers, filter detections to **display bounds** only.

**Key files:**

- `airspace-sim/app/hooks/map/useSensorDetectionMapLayer.js`
- `airspace-sim/app/simulation/detectionFeatures.js`

Correlation uses full scan data; map draws viewport ticks only.

**Secondary UX (optional):** Attention overlay currently uses `mapVisibleTracks` only — off-screen DROP/STALE pills do not show. Track Management window already uses full snapshot; no change required for persistence fix.

---

### Phase 6 — Performance validation

Run after implementation:

- `airspace-sim/scripts/validate-performance-findings.mjs`
- `airspace-sim/scripts/validate-performance-extended.mjs`

**Scenarios:**

1. Baseline: 50 tracks in viewport, 200 tracks globally dispersed.
2. Pan stress: camera jumping between clusters; measure aircraft scanned per tick.
3. Compare: viewport-only vs track-aware bounds vs full global scan.

**Adaptive cap (fallback only):** If union bounds routinely approach global scan cost (many dispersed tracks), cap off-viewport envelope contribution or correlate off-viewport tracks via lightweight per-track nearest-aircraft pass. Do not implement unless Phase 6 shows a problem.

---

### Phase 7 — Documentation updates

After shipping:

- Update root [README](../README.md) simulation architecture: display bounds ≠ sensor scan bounds; auto tracks persist across pan/zoom.
- Update `airspace-sim/app/content/settings-roadmap.md` when complete.
- Mark phases ✅ in this document with commit/PR links.

---

## Approaches considered and rejected

| Approach | Why not primary |
|----------|-----------------|
| Global fleet scan every interval | Semantically correct but expensive at 800–1500 aircraft × IFF 1 s |
| Increase `viewportPaddingDegrees` only | At zoomed-out views ≈ global scan; at zoomed-in views still drops tracks outside padding |
| Refresh `lastSensorUpdateAt` from kinematic sync | Misrepresents sensor state; breaks decorrelation / IFF semantics |
| Auto drop-protect all tracks | Operator workaround exists; does not fix correlation or root cause |
| Force `extrapolated` mode off-viewport | Changes operator-chosen correlation semantics; still loses sensor position updates |
| Initiate new tracks in full sensor scan bounds | Rejected by product decision — new tracks only in view |

---

## Key files reference

| Area | Path |
|------|------|
| Orchestrator | `airspace-sim/app/simulation/TrackEngine.js` |
| Track state | `airspace-sim/app/simulation/TrackStore.js` |
| Correlation | `airspace-sim/app/simulation/CorrelationService.js` |
| Initiation | `airspace-sim/app/simulation/TrackInitiationService.js` |
| Auto-drop | `airspace-sim/app/simulation/trackAutoDrop.js` |
| Decorrelation | `airspace-sim/app/simulation/trackDecorrelation.js` |
| Flight world | `airspace-sim/app/simulation/FlightWorldSimulator.js` |
| Sensor sim | `airspace-sim/app/simulation/SensorSimulator.js` |
| Viewport utils | `airspace-sim/app/simulation/mapViewportUtils.js` |
| Map integration | `airspace-sim/app/components/map/MapView.js` |
| Track rendering | `airspace-sim/app/hooks/map/useTrackMapLayer.js` |
| Kinematic sync | `airspace-sim/app/simulation/syncActiveTrackKinematicsFromFlightWorld.js` |

---

## Acceptance criteria

- [ ] Auto track panning off-screen does not decorrelate or auto-drop within default timelines (~23 s) while truth aircraft remain within sensor coverage.
- [ ] Panning back shows the **same** track ID and preserved operator metadata.
- [ ] No duplicate `TRK-*` initiation for the same contact after pan-away / pan-back.
- [ ] New automatic tracks still require 3-hit plot promotion and only initiate for detections inside **display** bounds.
- [ ] Map rendering still culls off-screen tracks and (after Phase 5) off-screen sensor ticks.
- [ ] Performance scripts show acceptable scan cost vs baseline for typical operator workloads.

---

## Operator mitigations today (until fix ships)

| Mitigation | Effect |
|------------|--------|
| Drop Protect (context menu) | Blocks auto-drop |
| Manual track | Not eligible for auto-drop |
| Correlation mode `extrapolated` | Skips active decorrelation path |
| Keep camera padding large | Reduces but does not eliminate edge drops at zoom extremes |

These are workarounds, not substitutes for the architectural fix above.
