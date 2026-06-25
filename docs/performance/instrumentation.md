# Performance instrumentation

Live tooling for observing frame budget pressure while operating the simulator.

## Performance analytics overlay

**Settings → Simulation → Show performance analytics overlay**

When enabled, a **semi-transparent** panel (`rgba(0, 0, 0, 0.5)` with backdrop blur) appears at the bottom-right of the map.

### Stacked frame-time chart

| Axis | Meaning |
|------|---------|
| **X** | Recent frame history (oldest left, newest right; up to 120 samples) |
| **Y** | Frame time in milliseconds |

Each vertical bar is one frame, split into colored segments:

| Color | Segment | Source |
|-------|---------|--------|
| Cyan (`#4fc3f7`) | Simulation | `TrackEngine.tick` duration |
| Amber (`#ffb74d`) | Track setData | Track + vector GeoJSON `setData` |
| Green (`#81c784`) | Sensor setData | Four sensor layer `setData` calls |
| Purple (`#b39ddb`) | Other | Remaining frame budget (browser, MapLibre, React, unmeasured) |

A **dashed horizontal line** at **16.67 ms** marks the 60 fps budget.

### Compact stats

Above the chart: FPS, frame ms, visible track count, firm track count, load factor (highlighted when under pressure).

### Update rate

The overlay UI refreshes at **4 Hz** intentionally — fast enough to diagnose spikes without adding measurable React churn while profiling.

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
| `useTrackMapLayer.js` | Track/vector `setData` duration and feature counts |
| `useSensorDetectionMapLayer.js` | Sensor `setData` duration and feature counts |
| `MapView.js` | Viewport sync counts, snapshot metadata |

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

Controlled by **Settings → Simulation → Adaptive performance balancing**. The overlay’s **load factor** and **adaptive level** fields reflect this system.

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
3. Pan and zoom continuously for 10–15 seconds — watch purple (“Other”) grow during map interaction
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
