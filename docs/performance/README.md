# Performance documentation

Investigation and optimization planning for simulator frame rate and responsiveness.

## Documents

| Document | Summary |
|----------|---------|
| [analysis.md](analysis.md) | Rendering architecture, data flow, profiling results, and ranked bottlenecks |
| [optimization-plan.md](optimization-plan.md) | Phased remediation options (quick wins through architectural bets) |
| [validation-results.md](validation-results.md) | **Deep validation pass (2026-06-25)** — measured benchmarks confirming/refining findings |
| [instrumentation.md](instrumentation.md) | Live performance analytics overlay and how to use it while profiling |

## Status

| Item | Status |
|------|--------|
| Performance analysis (2026-06) | Documented |
| Deep validation pass (2026-06-25) | Documented — see [validation-results.md](validation-results.md) |
| Live analytics overlay | Shipped — Settings → Simulation → **Show performance analytics overlay** |
| Phase 1 quick wins (React decoupling, syncKinematics index, setData coalescing, Mercator toggle) | Planned |
| Phase 2 algorithm/render-prep fixes | Planned |
| Phase 3 instanced render layer (deck.gl / canvas / custom WebGL) | Exploratory |

## Related code

- `airspace-sim/app/simulation/PerformanceMonitor.js` — frame history and segment timing
- `airspace-sim/app/simulation/PerfBudgetController.js` — adaptive simulation tick rate
- `airspace-sim/app/simulation/stressHarness.js` — Node-side simulation benchmark (`window.__airspaceSimStressHarness` in dev)
