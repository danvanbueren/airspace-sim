# Performance instrumentation

Live tooling for observing frame budget pressure while operating the simulator.

## Performance analytics overlay

**Settings → Simulation → Show performance analytics overlay**

When enabled, a **semi-transparent** panel (`rgba(0, 0, 0, 0.5)` with backdrop blur) appears at the bottom-right of the map.

### Stacked frame-time chart

| Axis | Meaning |
|------|---------|
| **X** | Recent history in 1 s intervals (oldest left, newest right; up to 15 columns ≈ 15 s) |
| **Y** | Peak measured compute in milliseconds for each interval (scale uses the 95th percentile of recent stacks, minimum 20 ms) |

Each vertical bar is one 1 s interval. Colored segments stack **peak measured compute per segment** within that interval (the highest value each segment reached during the bucket). Idle frame gap is left blank — bars are not stretched to fill the 60 fps budget.

| Color | Segment | Source |
|-------|---------|--------|
| Cyan (`#4fc3f7`) | Simulation tick | `TrackEngine.tick` duration |
| Amber (`#ffb74d`) | Track symbols | Track icon GeoJSON `setData` |
| Deep orange (`#ff8a65`) | Velocity vectors | Track vector GeoJSON `setData` |
| Green (`#81c784`) | Radar detections | Radar current + history `setData` |
| Light green (`#66bb6a`) | IFF detections | IFF current + history `setData` |
| Teal (`#4dd0e1`) | Viewport filter | Map bounds filter + track list sync |

A **horizontal tick** on each bar marks the **average measured compute** for that 1 s bucket. Its color reflects budget pressure: **green** at or below the 60 fps budget (16.67 ms), **yellow** above 60 fps but at or below the 50 fps budget (20 ms), and **red** above 20 ms.

Per-bucket **averages** are still recorded alongside these peaks for stats and future use.

**FPS** reflects display refresh rate (RAF spacing, ~60 on a 60 Hz panel, higher on high-refresh displays). **Frame Time** is smoothed **measured compute only** — the same instrumented work shown in the chart, excluding idle time between frames.

A **yellow dashed horizontal line** at **16.67 ms** marks the 60 fps budget and is drawn above the bars so it stays visible.

### Compact stats

Above the chart: FPS (display refresh), frame time (measured compute ms), tracks in view (viewport), firm track total, adaptive throttle % (highlighted above 15%).

### Update rate

The overlay UI and chart history refresh every **1 s** — each column summarizes all frames captured in that interval (stacked peaks plus an average marker).

---

## Implementation map

| Component | Role |
|-----------|------|
| `app/simulation/PerformanceMonitor.js` | Ring buffer, per-frame accumulators, smoothed metrics |
| `app/simulation/performanceFrameSegments.js` | Segment keys, colors, history length |
| `app/contexts/PerformanceMonitorContext.js` | Provider, RAF frame commits, instrumentation hooks |
| `app/components/map/PerformanceAnalyticsOverlay.js` | Overlay shell + legend |
| `app/components/map/PerformanceFrameTimeChart.js` | Canvas stacked bar renderer |

### Instrumentation hooks

| Hook location | Records |
|---------------|---------|
| `useSimulationLoop.js` | Simulation tick ms, snapshot counts |
| `useTrackMapLayer.js` | Track symbol and vector `setData` duration and feature counts |
| `useSensorDetectionMapLayer.js` | Radar and IFF `setData` duration and feature counts |
| `MapView.js` | Viewport filter/sync duration, snapshot metadata |

When the overlay is **disabled**, hooks are no-ops — zero collection overhead.

---

## Adaptive performance (engine)

Separate from the overlay, `PerfBudgetController` adjusts simulation tick rate under load:

| `loadFactor` | Effective behavior |
|--------------|-------------------|
| 1.0 | Full configured Hz |
| 0.85 | Mild reduction |
| 0.65 | Moderate reduction |
| 0.45 | Aggressive reduction |
| &lt; 0.35 | May skip simulation steps |

Controlled by **Settings → Simulation → Adaptive performance balancing**. The overlay’s **Throttle** stat is how much the engine is backing off from the configured simulation tick rate (0% = no throttling).

---

## Node-side stress harness

Development builds expose:

```javascript
window.__airspaceSimStressHarness({ trackTarget: 1200, ticks: 120 })
```

Defined in `app/simulation/stressHarness.js`. Measures **simulation tick** time only (no MapLibre/React). Useful for comparing correlation and fleet scaling without browser variance.

---

## How to profile effectively

1. Enable the overlay
2. Set quality preset and fleet size to the scenario you care about
3. Pan and zoom continuously for 10–15 seconds — watch track and sensor segments grow during map interaction
4. Wait for IFF/radar scan intervals — watch cyan (simulation) spike if correlation is hot
5. Open Chrome DevTools **Performance** panel for GPU and React detail the overlay cannot see
6. Compare Mercator vs globe if a projection toggle is available

---

## Future instrumentation ideas

Not implemented; candidates for later phases:

- React render count per tick
- MapLibre `render` event duration
- Memory / JS heap snapshot button
- Export last 30 s of history as JSON for bug reports
