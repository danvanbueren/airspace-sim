# Application Architecture

**Last updated:** June 2026  
**Audience:** Contributors working on the Next.js UI, map workspace, and operator workflows.

The simulator UI is a Next.js client application. Simulation state is produced in JavaScript modules under `app/simulation/` and consumed by MapLibre hooks under `app/hooks/map/`. The two sides meet in `MapView` and `SimulationContext`.

See the [repository root README](../../README.md) for setup and a high-level overview. For engine behavior, see [Simulation Architecture](simulation-architecture.md).

## UI shell and providers

[`app/layout.js`](../../airspace-sim/app/layout.js) wraps the app with providers (outermost to innermost):

| Provider | Role |
|----------|------|
| `MapStateProvider` | Registered map instance, alarm alerts, fixed-function zoom controls |
| `CustomThemeContext` | Light/dark theme (cookie-backed) |
| `AppSettingsProvider` | Grid reference system, simulation tuning (cookie-backed) |
| `ControlBindingsProvider` | Keyboard/mouse bindings (cookie-backed) |
| `SensorDisplayProvider` | Category Select Panel toggle state |
| `SimulationProvider` | Singleton `TrackEngine`, manual track APIs |

[`app/page.js`](../../airspace-sim/app/page.js) gates unsupported mobile and tablet devices before rendering [`app/Home.js`](../../airspace-sim/app/Home.js), which composes the main shell: classification bars, map corner panels (Category Select, Fixed Function, alarm alerts, settings toolbelt), a dedicated map overlay layer for floating track windows, and the full-screen map.

## Map workspace

[`MapView`](../../airspace-sim/app/components/map/MapView.js) owns the MapLibre instance and wires:

- **Simulation loop** — [`useSimulationLoop`](../../airspace-sim/app/hooks/simulation/useSimulationLoop.js) calls `TrackEngine.tick()` on a throttled `requestAnimationFrame` schedule.
- **Track layer** — [`useTrackMapLayer`](../../airspace-sim/app/hooks/map/useTrackMapLayer.js) renders familiar platform silhouettes (default) or full MIL-STD-2525 symbols when info fields are enabled; draws callsign labels and heading/velocity vectors; only tracks inside the expanded viewport are drawn, with icon and vector size scaled by zoom.
- **Sensor layers** — [`useSensorDetectionMapLayer`](../../airspace-sim/app/hooks/map/useSensorDetectionMapLayer.js) renders radar/IFF tick marks; geometry is recomputed on pan/zoom so tick size stays proportional to zoom.
- **Overlays** — [`useAirportMapLayer`](../../airspace-sim/app/hooks/map/useAirportMapLayer.js) and [`useAirRouteMapLayer`](../../airspace-sim/app/hooks/map/useAirRouteMapLayer.js) for optional airport/route context.
- **Interactions** — Map pan/zoom, click-to-center (default **F** or middle mouse; rebindable in Settings → Keybinds), context menu (with inline grid-reference picker), bearing/range measurements with configurable persistence (Settings → Look & Feel; default is temporary unless the persist modifier is held on release), track pick, draggable track management windows with keyboard custody and focus stacking, and map-click dismissal of transient windows.

Map styles are loaded from [`public/map-styles/`](../../airspace-sim/public/map-styles/) (Voyager for light mode, Dark Matter for dark mode). Water-feature and track label colors are adjusted at runtime for readability in each theme.

## Operator workflows

| Workflow | Entry point | Engine API |
|----------|-------------|------------|
| Initiate manual track | Map context menu → Initiate Track | `upsertManualTrack` |
| Edit track (including correlation mode) | Click symbol or context menu → Track Management window | `upsertManualTrack` (sets `userDirected`; converts auto tracks to manual) |
| Drop track | Context menu on existing track | `dropTrack` |
| Bearing/range | Right-drag on map (behavior configurable in Settings → Look & Feel) | Local map tool (not part of simulation engine) |
| Sensor/history visibility | Category Select Panel | Display toggles only (no sim logic) |
| Map zoom | Fixed Function Panel → Zoom In / Zoom Out | `MapStateProvider` zoom helpers (display only) |

The Track Management window edits callsign (alphanumeric, unique across tracks), domain, identity, MIL-STD type, platform-specific type (searchable catalog), optional symbol info fields, heading, speed, altitude, and correlation mode. A read-only **IFF Mode 3** field shows the squawk code from the last correlated IFF return (greyed out with a stale pill when the code has not refreshed). While a window is open, displayed fields refresh from the live simulation about once per second; a field pauses live updates while it is focused for editing. Focusing a kinematic field without changing its value does not count as an operator commit. Committed heading, speed, altitude, or position edits hold automatic correlation and truth-aircraft kinematic updates for about 10 seconds; after the hold expires, correlation regains control and live kinematic fields resume syncing. Invalid or duplicate callsigns are rejected in the UI and track store. Any committed edit from the window routes through `upsertManualTrack`, including correlation mode changes.

Manual track edits are marked `userDirected` so they take priority when tracks merge (see [Track merge and deduplication](simulation-architecture.md#track-merge-and-deduplication)).

## Settings and persistence

Settings opened from the toolbelt modal are stored in the `appSettings` cookie via [`AppSettingsContext`](../../airspace-sim/app/contexts/AppSettingsContext.js). Simulation-related fields are passed to `TrackEngine` as `simulationSettings`. Keybinds and theme use separate cookies.
