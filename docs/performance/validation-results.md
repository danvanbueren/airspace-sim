# Performance validation results

Deep validation pass conducted **2026-06-25** on the cloud-agent VM (Node.js benchmarks + static code audit). Goal: confirm or refute every major claim in [analysis.md](analysis.md) before starting optimizations.

**Environment:** Linux VM, Node 22, no browser/GPU profiling in this pass. Browser-side costs (MapLibre `setData` GPU work, React reconciliation) are inferred from architecture and marked **CONFIRMED (architectural)** vs **MEASURED (Node)**.

**How to reproduce:**

```bash
cd airspace-sim
node --import ./scripts/register-loader.mjs --experimental-default-type=module scripts/validate-performance-findings.mjs
node --import ./scripts/register-loader.mjs --experimental-default-type=module scripts/validate-performance-extended.mjs
```

---

## Verdict summary

| Claim | Verdict | Evidence |
|-------|---------|----------|
| Tracks use MapLibre WebGL symbols, not DOM sprites | **CONFIRMED** | Static: `useTrackMapLayer.js` symbol layers, no track Markers |
| Simulation tick ~10 Hz triggers React `setSnapshot` | **CONFIRMED** | Static: `useSimulationLoop.js` → `engine.subscribe(setSnapshot)` |
| Six GeoJSON `setData` paths per update | **CONFIRMED** | Static: 2 track + 4 sensor sources; pan/zoom re-triggers all |
| O(n²) correlation | **CONFIRMED (measured)** | 100→1000 scale: 0.42 ms → 24.6 ms (~60× for 10× n) |
| **`syncKinematics` O(tracks × fleet) dominates steady-state tick** | **CONFIRMED (measured)** | **15.5 ms** at 329 tracks / 1200 fleet; see below |
| Global fleet advance independent of viewport | **CONFIRMED (measured)** | `advance` ~0.95 ms at 1200 fleet regardless of bounds |
| Viewport width affects firm-track count & scan cost | **CONFIRMED (measured)** | Narrow 72 tracks / 4.7 ms tick vs wide 333 tracks / 20.4 ms tick |
| IFF scan spikes tick duration | **CONFIRMED (measured)** | Normal 16.8 ms avg → IFF scan 46.1 ms avg (**2.7×**) |
| Render-prep JS is cheap vs frame budget | **CONFIRMED (measured)** | 1000 visible: vectors 0.15 ms, sensors 0.34 ms, JSON 0.84 ms |
| `shouldCoalesceUpdates()` never wired | **CONFIRMED** | Only referenced in `PerfBudgetController.js` |
| Globe + 93-layer basemap | **CONFIRMED (static)** | `useMapLibreMap.js` globe; Voyager style 93 layers |
| `icon-allow-overlap: true` on tracks | **CONFIRMED (static)** | `useTrackMapLayer.js` lines 319–320 |
| MapLibre `setData` dominates browser time | **LIKELY (architectural)** | JS prep &lt;1 ms; cannot measure GPU in Node |
| React re-render dominates browser time | **LIKELY (architectural)** | Coupled to every tick; use overlay + Chrome Performance to confirm locally |

---

## Measurement 1: Steady-state simulation phase breakdown

**Setup:** `maxActiveFlights: 1200`, wide CONUS viewport (`-130/24/-65/50`), 80 s warmup with live radar/IFF scans, adaptive perf **disabled**.

| Phase | Avg (ms) | P95 (ms) | Notes |
|-------|----------|----------|-------|
| `flightWorld.advance(1200)` | 0.95 | 1.59 | Linear with fleet; **not** viewport-dependent |
| `trackStore.extrapolate(329 tracks)` | 0.05 | 0.06 | Negligible |
| **`syncActiveTrackKinematicsFromFlightWorld`** | **15.47** | **16.12** | **Dominant simulation cost** |
| `enrichTracksWithAttentionFlags` | 0.08 | 0.09 | Negligible |
| `correlateDetections(300 × 329)` | 2.68 | 3.00 | Significant on scan ticks, not every frame |

**Root cause of syncKinematics cost:** For each active/correlated firm track, `findNearestAircraft` iterates **all 1200 aircraft** with haversine (`FlightWorldSimulator.js`). At 329 tracks → ~395,000 distance checks per tick ≈ **15 ms**.

### syncKinematics scaling (fleet fixed at 1200)

| Firm tracks | syncKinematics avg (ms) |
|-------------|-------------------------|
| 50 | 2.2 |
| 150 | 6.6 |
| 300 | 12.7 |
| 400 | 17.9 |

Roughly **linear in firm track count**, confirming O(tracks × fleet).

---

## Measurement 2: Full tick timing (normal vs sensor scan)

Same steady-state setup after warmup (~330 firm tracks).

| Tick type | Avg (ms) | P95 (ms) | Samples |
|-----------|----------|----------|---------|
| Normal (no scan) | 16.8 | 17.5 | ~108 |
| IFF interval tick | 46.1 | 63.4 | 12 |

**Interpretation:** Normal tick ≈ advance (1) + syncKinematics (15) + overhead (1) ≈ **17 ms** — matches measurement.

IFF scan adds ~**29 ms** on top (IFF correlation path, initiation, merge, extra correlation at higher detection counts).

Radar scan spike not captured in this 12 s window (4000 ms interval); expect similar or larger spike when radar fires with 300+ detections.

---

## Measurement 3: Viewport width vs simulation cost

Same fleet (1200), 40 s warmup, adaptive perf disabled.

| Viewport | Firm tracks | Avg tick (ms) | P95 tick (ms) |
|----------|-------------|---------------|---------------|
| Narrow (~10° box) | 72 | 4.7 | 8.1 |
| Wide (CONUS) | 333 | 20.4 | 43.8 |

**Validated:** Viewport culling does **not** reduce `flightWorld.advance` (always 1200 aircraft). It **does** reduce firm track accumulation and per-scan work, which dramatically lowers `syncKinematics` and correlation cost.

Display culling alone does not help simulation CPU if the viewport is wide.

---

## Measurement 4: Correlation O(n²) scaling

Isolated benchmark (synthetic uniform positions, threshold 5 NM):

| n (detections = tracks) | n² ops | Avg (ms) | P95 (ms) |
|-------------------------|--------|----------|----------|
| 100 | 10,000 | 0.42 | 0.42 |
| 400 | 160,000 | 3.96 | 4.05 |
| 600 | 360,000 | 8.83 | 8.91 |
| 800 | 640,000 | 15.90 | 18.44 |
| 1000 | 1,000,000 | 24.64 | 27.56 |

Quadratic growth confirmed. At operational density (300×330), isolated correlate ≈ **2.7 ms**; IFF path adds additional work beyond radar correlate.

---

## Measurement 5: Fleet advance scaling (viewport-independent)

| maxActiveFlights | advance avg (ms) | P95 (ms) |
|------------------|------------------|----------|
| 400 | 0.36 | 0.50 |
| 800 | 0.64 | 0.99 |
| 1200 | 0.99 | 1.66 |
| 1500 | 1.13 | 1.54 |

Linear with fleet size. At 1500 aircraft, advance alone is ~**7%** of frame budget; syncKinematics at 330 tracks is ~**93%**.

---

## Measurement 6: Render-prep JavaScript (no MapLibre)

| Visible tracks | replaceTracks pattern | vectors | 4× sensor FC | JSON.stringify (vectors) |
|----------------|----------------------|---------|--------------|--------------------------|
| 100 | 0.03 ms | 0.17 ms | 0.15 ms | 0.07 ms (21 KB) |
| 300 | 0.03 ms | 0.17 ms | 0.21 ms | 0.18 ms (64 KB) |
| 600 | 0.04 ms | 0.07 ms | 0.18 ms | 0.36 ms (127 KB) |
| 1000 | 0.06 ms | 0.15 ms | 0.34 ms | 0.84 ms (213 KB) |

**Validated:** Building GeoJSON in JS is **not** the bottleneck. Even at 1000 tracks, total JS prep is **&lt;2 ms**. MapLibre internal reprocessing after `setData` is the render-side concern (requires browser profiling).

---

## Static audit: pan/zoom cascade

Four independent `move`/`zoom` handlers confirmed:

1. `MapView.js` — `syncVisibleTracks` → `setMapVisibleTracks` + `replaceTracks`
2. `useTrackMapLayer.js` — `scheduleSetData` (2 sources)
3. `useSensorDetectionMapLayer.js` — `applySnapshotToSources` (4 sources)
4. `TrackAttentionOverlay.js` — `updatePositions` → `setState`

Minimum **6 `setData` calls** per pan frame, plus up to **4 React state updates**. The `MapView` viewport effect also re-subscribes on every `simulationSnapshot` change, coupling pan handler registration to tick rate.

---

## Static audit: dead optimization hook

`PerfBudgetController.shouldCoalesceUpdates()` — implemented, increments stats when called, but **zero call sites** in `app/`. Confirmed via ripgrep across codebase.

---

## Revised bottleneck ranking (post-validation)

| Rank | Subsystem | Confidence | Typical cost (wide viewport, ~330 firm tracks) |
|------|-----------|------------|--------------------------------------------------|
| **1** | **`syncActiveTrackKinematicsFromFlightWorld`** | Measured | **~15 ms / tick** |
| **2** | React + MapLibre render path | Architectural | Unknown in Node; dominant in browser per architecture |
| **3** | Full GeoJSON `setData` × 6 | Architectural | JS &lt;2 ms; GPU/MapLibre likely larger |
| **4** | IFF/radar scan spikes (correlation + initiation) | Measured | +29 ms on IFF interval |
| **5** | O(n²) correlation (steady scans) | Measured | ~2.7 ms per radar correlate at 300×329 |
| **6** | `flightWorld.advance` | Measured | ~1 ms at 1200 fleet |
| **7** | Pan/zoom handler cascade | Static | 6× setData + React per pan frame |
| **8** | Globe + 93-layer basemap | Static | GPU baseline |
| **9** | `icon-allow-overlap: true` | Static | GPU symbol cost |
| **10** | Icon cold-start / canvas raster | Static | Spike on new variants only |

---

## Impact on optimization priorities

### Elevated priority (new or upgraded)

1. **Spatial index for `findNearestAircraft`** — single biggest simulation win; could drop syncKinematics from ~15 ms → ~1 ms. Candidate for **Phase 1** alongside React decoupling.
2. **Spatial index for correlation** — still important for IFF scan spikes; steady-state correlate is smaller than syncKinematics at current densities.

### Confirmed priorities (unchanged)

1. Decouple React from simulation tick
2. Coalesce pan/zoom `setData` (wire `shouldCoalesceUpdates`)
3. Replace `replaceTracks` with incremental upsert on tick
4. Mercator toggle + LOD for vectors/labels
5. Phase 3 instanced layer (deck.gl/canvas) for browser render path

### Deprioritized or reframed

- **Sprite atlas alone** — helps icon cold-start, not steady-state 15 ms syncKinematics problem
- **Reducing fleet cap alone** — helps advance (~1 ms) marginally; does **not** fix syncKinematics unless firm track count drops
- **Viewport display culling alone** — insufficient when viewport is wide; simulation cost scales with firm tracks in sensor bounds

---

## Recommended browser confirmation (local)

Before implementing Phase 1, run on a lagging machine:

1. Enable performance overlay; confirm purple "Other" grows during pan (MapLibre/React)
2. Chrome Performance: record pan + idle; verify `setData` and React in flame chart
3. Temporarily log `syncKinematics` duration in `TrackEngine.tick` — expect ~15 ms at dense wide viewport
4. Compare narrow zoom (few firm tracks) vs continental view — expect tick ms to drop proportionally

---

## Confidence statement

We are **highly confident** in:

- Simulation-side bottleneck identification (`syncKinematics` + scan spikes)
- Algorithmic complexity claims (O(n²) correlation, O(tracks×fleet) sync)
- Render-prep JS being a non-bottleneck
- Architectural render/React coupling issues

We are **moderately confident** (pending browser GPU profiling) in:

- MapLibre `setData` exceeding simulation cost during pan/zoom
- Globe basemap GPU baseline being significant on laptops

**Best path forward:** Implement **syncKinematics spatial index** and **React/render decoupling** in parallel as Phase 1 — together they address both measured simulation cost and architectural render cost. Defer deck.gl/canvas overlay until Phase 1 metrics are captured in the live overlay on target hardware.
