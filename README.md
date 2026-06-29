# [Airspace Simulator](https://github.com/danvanbueren/airspace-sim) &middot; [![License](https://img.shields.io/badge/license-all_rights_reserved-blue)](https://github.com/danvanbueren/airspace-sim/blob/main/LICENSE.md) [![Repo Size](https://img.shields.io/github/repo-size/danvanbueren/airspace-sim?color=blue)](https://github.com/danvanbueren/airspace-sim) [![Issues](https://img.shields.io/github/issues/danvanbueren/airspace-sim)](https://github.com/danvanbueren/airspace-sim/issues) [![Last Commit](https://img.shields.io/github/last-commit/danvanbueren/airspace-sim)](https://github.com/danvanbueren/airspace-sim/commits/main/)

Airspace Simulator is a non-secure browser-based simulator for practicing command and control workflows in a simulated operational airspace. It is intended for learning, experimentation, and software development around airspace visualization, track management, grid references, map interaction patterns, and scenario-building tools.

This project is personal. It is not owned, operated, sponsored, or endorsed by any government entity. The repository is unclassified and should only contain unclassified, non-sensitive, non-operational information.

## Table of Contents

- [Get Started](#get-started)
  - [Developers](#developers)
  - [Testers](#testers)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Scripts](#scripts)
- [Architecture](#architecture)
- [Roadmap](#roadmap)
- [Context](#context)
  - [Current Capabilities](#current-capabilities)
  - [Safety and Data Policy](#safety-and-data-policy)

## Get Started

### Developers

1. Fork the repository on GitHub: [danvanbueren/airspace-sim](https://github.com/danvanbueren/airspace-sim).
2. Clone your fork locally:

```bash
git clone https://github.com/<your-github-username>/airspace-sim.git
cd airspace-sim/airspace-sim
```

The Next.js application and `package.json` live in the nested `airspace-sim/` directory inside the repository root.

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. Open the local app URL printed by Next.js, typically [http://localhost:3000](http://localhost:3000).

Before opening a pull request, make sure tests pass and the app still builds:

```bash
npm test
npm run build
```

### Testers

Testers can help by running the simulator locally, trying realistic workflows, and reporting confusing behavior, broken controls, visual issues, or crashes.

To run the app locally:

```bash
git clone https://github.com/danvanbueren/airspace-sim.git
cd airspace-sim/airspace-sim
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). Try creating tracks, editing callsigns and platform types in the Track Management window, dragging the map, switching settings, drawing bearing/range lines, changing keybinds, and refreshing the page to confirm persisted settings still behave as expected.

To test a production-style local deployment:

```bash
npm run build
npm run start
```

Report issues in [GitHub Issues](https://github.com/danvanbueren/airspace-sim/issues). Helpful reports include:

- What you expected to happen.
- What actually happened.
- Steps to reproduce the issue.
- Browser, operating system, and screen size.
- Screenshots or screen recordings when they clarify the problem.
- Any visible error messages from the app or browser console.

Do not include classified, sensitive, operational, export-controlled, or personally identifying information in issues, screenshots, sample scenarios, or pull requests.

## Repository Structure

```text
docs/                      # Contributor docs (not in-app UI).
+-- architecture/          # Application and simulation architecture deep dives.
+-- plans/                 # Implementation plans with shipped-commit checklists.
+-- performance/           # Performance analysis, optimization plan, instrumentation.
airspace-sim/
+-- app/
|   +-- components/
|   |   +-- global/          # Classification bars, commit display, markdown renderer, and global UI pieces.
|   |   +-- map/             # Map view, context menu, and cursor coordinate overlay.
|   |   +-- floating/        # Draggable map overlays: action panels, alarm alerts, track windows.
|   |   |   +-- actionPanels/  # Operator button panels on the map.
|   |   |   +-- alerts/        # Alarm alert panel and detail modal.
|   |   |   +-- shared/        # Shared frosted panel chrome and overlay layer.
|   |   |   +-- windows/       # Track management floating windows.
|   |   +-- panels/          # Settings toolbelt and settings modal pages.
|   +-- constants/           # Shared UI constants (for example, z-index layering).
|   +-- content/             # Markdown and static copy for in-app settings pages.
|   +-- contexts/            # React contexts for map state, theme, app settings, simulation.
|   +-- data/                # Static JSON and seed data (airports, routes, startup alerts).
|   +-- hooks/
|   |   +-- global/          # Global interaction guards and measurement hooks.
|   |   +-- map/             # Map setup, controls, track/sensor/airport layers, bearing/range tools.
|   |   +-- simulation/      # Simulation tick loop (requestAnimationFrame).
|   +-- simulation/          # Track engine, flight world, sensor, initiation, correlation, merge.
|   +-- tools/
|   |   +-- actionPanels/    # Action panel registry, layout math, templates, normalization.
|   |   +-- browser/         # Browser storage and device support helpers.
|   |   +-- external/        # External service helpers.
|   |   +-- formatting/      # Date/time, grid reference, callsign, and track field formatting.
|   |   +-- map/             # Map style paint helpers (for example, water and label theming).
|   |   +-- milstd2525/      # Symbol codes, familiar icons, and platform-specific type catalog.
|   +-- buildInfo.js         # Project metadata, links, version, and copyright text.
|   +-- globals.css          # Global styles.
|   +-- layout.js            # Root Next.js layout and providers.
|   +-- page.js              # Main simulator shell.
+-- public/
|   +-- map-styles/          # Local MapLibre style JSON files.
+-- tests/                   # Node test runner suites (formatting, simulation, milstd2525).
+-- AGENTS.md                # Workspace guidance for AI coding agents.
+-- CLAUDE.md                # Pointer to shared agent guidance.
+-- jsconfig.json            # JavaScript path alias configuration.
+-- next.config.mjs          # Next.js configuration.
+-- package-lock.json        # Locked dependency versions.
+-- package.json             # Project scripts and dependencies.
+-- README.md                # Short pointer to the root README.
```

Paths above are relative to the repository root unless noted. Application paths under `airspace-sim/` are relative to that directory.

For contributor documentation (architecture, plans, performance investigations), see [docs/](docs/README.md).

## Tech Stack

- [Next.js](https://nextjs.org/) ([docs](https://nextjs.org/docs)) powers the application framework, development server, routing, build, and production start flow.
- [React](https://react.dev/) ([docs](https://react.dev/learn)) provides the component model, hooks, context providers, and client-side UI behavior.
- [Material UI](https://mui.com/material-ui/) ([docs](https://mui.com/material-ui/getting-started/)) provides the UI component library used for panels, buttons, forms, modals, typography, alerts, and layout.
- [Emotion](https://emotion.sh/docs/introduction) ([docs](https://emotion.sh/docs/introduction)) supports Material UI styling.
- [MapLibre GL JS](https://maplibre.org/projects/gl-js/) ([docs](https://maplibre.org/maplibre-gl-js/docs/)) renders the interactive map and map layers.
- [milsymbol](https://www.spatialillusions.com/) ([docs](https://github.com/spatialillusions/milsymbol)) generates full MIL-STD-2525-style tactical symbols when familiar icons or info fields are disabled.
- Custom familiar platform silhouettes (`createFamiliarTrackIcon.js`) provide simplified identity-colored icons for common air, surface, and subsurface tracks.
- [react-markdown](https://github.com/remarkjs/react-markdown) with [remark-gfm](https://github.com/remarkjs/remark-gfm) renders the in-app roadmap page from markdown.
- [mgrs](https://www.npmjs.com/package/mgrs) ([package docs](https://github.com/proj4js/mgrs)) converts coordinates into MGRS.
- [Fontsource Roboto](https://fontsource.org/fonts/roboto) ([docs](https://fontsource.org/docs/getting-started/introduction)) supplies the Roboto font used by Material UI.
- [npm](https://www.npmjs.com/) ([docs](https://docs.npmjs.com/)) manages dependencies and local scripts.

The current locked versions are defined in `package-lock.json`; use that file as the source of truth when checking exact dependency versions.

## Scripts

```bash
npm run dev
```

Starts the Next.js development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run start
```

Starts the production server after a successful build.

```bash
npm test
```

Runs the Node test runner over `tests/formatting`, `tests/simulation`, and `tests/milstd2525`.

```bash
npm run generate:flight-world
```

Regenerates `app/data/airports.json` and `app/data/airRoutes.json` from [OurAirports](https://ourairports.com/data/) open data.

## Architecture

The simulator splits **UI** (Next.js + MapLibre) from **simulation** (track engine modules). Simulation state flows from `TrackEngine` through React context into map hooks; operator actions call back into the engine API.

### Application (UI)

- Provider stack in `app/layout.js` (map state, theme, settings, keybinds, sensor display toggles, simulation context).
- Full-screen map workspace with track/sensor/airport layers, context menu, bearing/range tool, and floating Track Management windows.
- Settings persisted in browser cookies; simulation tuning passed to `TrackEngine` as `simulationSettings`.

**Deep dive:** [docs/architecture/application-architecture.md](docs/architecture/application-architecture.md)

### Simulation (engine)

Four core systems plus merge and an orchestrator:

| System | Role |
|--------|------|
| Flight world | Global aircraft on weighted routes; stable IDs across pan/zoom |
| Sensor simulation | Noisy radar/IFF returns inside scan bounds |
| Track initiation | 3-hit plot trails promote uncorrelated returns to firm tracks |
| Correlation | Links returns to existing active tracks before initiation runs |
| Track merge | Collapses duplicate tracks competing for the same return |
| TrackEngine | Fixed tick order, snapshots, sensor history buffers |

Design highlights:

- **Rendering is not simulation** — Off-screen tracks may be hidden on the map without deleting engine state.
- **Two distance knobs** — Correlation threshold (default 5 NM) vs plot association threshold (default 3 NM).
- **Correlation modes** — Active, extrapolated, and suspend (editable in Track Management).

**Deep dive:** [docs/architecture/simulation-architecture.md](docs/architecture/simulation-architecture.md) — tick pipeline, per-sensor scan order, merge rules, symbology, settings reference, and development utilities.

### Contributor plans and investigations

| Topic | Document |
|-------|----------|
| Bearing/range tool rewrite | [docs/plans/bearing-range-tool-rewrite-plan.md](docs/plans/bearing-range-tool-rewrite-plan.md) |
| Off-viewport track persistence | [docs/plans/viewport-track-persistence-plan.md](docs/plans/viewport-track-persistence-plan.md) |
| Performance optimization | [docs/performance/](docs/performance/README.md) |

## Roadmap

Near-term and exploratory work includes:

- Reference point editing and management.
- Pre-built training scenarios and recurring tactical picture templates.
- End-to-end control loops for mission practice.
- Automated picture call calculations inspired by [ParrotSour](https://github.com/jemccarthy13/parrotsour) workflows.
- Additional fuel, weapons, timeline, and mission-planning concepts represented with unclassified simulated data only.

The in-app **Settings → Roadmap** page (`app/content/settings-roadmap.md`) is the live checklist with completed items and commit links.

## Context

Airspace Simulator is a spiritual successor to [John McCarthy](https://github.com/jemccarthy13)'s [ParrotSour](https://github.com/jemccarthy13/parrotsour), with a focus on making command and control practice more approachable in a modern web application. The long-term goal is to provide a training sandbox where aircrew, operators, controllers, students, and hobbyist developers can rehearse airspace management concepts without relying on classified systems or operational data.

The mission is to build a practical, extensible, and transparent simulator that can support:

- Interactive map familiarization and airspace visualization.
- Track creation, labeling, and management workflows.
- Bearing/range measurement and map annotation tools.
- Multiple grid reference formats used in operational discussions.
- Scenario construction for repeatable training events.
- Sensor, radar, IFF, and track automation experiments using simulated data only (see [Simulation Architecture](docs/architecture/simulation-architecture.md)).

### Current Capabilities

- Full-screen map workspace with light and dark map styles and theme-aware water/label paint.
- Modular, draggable **action panels** (Settings → Action Panels) with cookie-backed layout; defaults match the former Category Select and Fixed Function panels.
- Glass panels for alarm alerts and settings, plus operator-configurable action panels on the map.
- **Global flight simulation** on weighted air routes between curated airports (no viewport-random spawning); can be paused via **Enable simulation engine**.
- **Separated sensor, initiation, and correlation pipeline** (see [Simulation Architecture](docs/architecture/simulation-architecture.md)).
- Simulated **radar and IFF** returns with history playback and configurable action-panel sensor toggles.
- **Track merge** after correlation — collapses duplicate tracks competing for the same sensor return; formation pairs correlating separately are left alone ([details](docs/architecture/simulation-architecture.md#track-merge-and-deduplication)).
- **Automatic track initiation** after three per-sensor plot updates on uncorrelated returns only.
- Manual track initiation and editing from the map context menu, with correlation mode (active / extrapolated / suspend); editing an auto track converts it to manual.
- Reference point creation from the map context menu (**Initiate Ref Point**) — suspended, drop-protected markers with MIL-STD control-measure symbology, auto-assigned RP## labels, and a simplified Reference Point management window.
- Track Management window with domain, identity, MIL-STD type, searchable platform-specific type, searchable nationality, callsign validation, optional symbol info fields, live attention-flag pills, and scrollable content when the map viewport is too short to show every field.
- On-map track attention flags (amber, monospace, synchronized flash) pinned beside tracks; up to five lines with overflow summary. Emergency IFF codes (`7500`, `7600`, `7700`) raise both attention flags and alarm alerts.
- Automatic drop of uncorrelated tracks after a countdown (invisible DROP-RISK, then visible DROP attention, then removal); drop protect shows a PROT attention flag and recover actions in the context menu.
- Settings page matrix for inhibiting track attentions and alarm alert types; central signal registry in `app/simulation/signalDefinitions.js`.
- Modular seed alarm alerts on page load (`app/data/seedAlarmAlerts.js`); system notices can include a left-side icon and external link action.
- Familiar platform silhouettes with MIL-STD-2525 fallback, callsign labels, and speed-scaled heading vectors on the map.
- Optional **airport** and **air route** overlay layers.
- Bearing/range measurements with configurable persistence (Settings → Look & Feel) and rebindable persist modifier (Settings → Keybinds).
- Bearing/range line context menus and line removal controls (permanent lines only).
- Group criteria circle toggle (default Caps Lock) that draws a 3 NM radius ring at the cursor, synced to the OS Caps Lock state when bound to Caps Lock.
- Complete Control Reference in Settings → Usage Guide documenting every map control combo (with a link to Keybinds for rebinding).
- Cursor coordinate overlay with selectable grid reference systems.
- Supported coordinate displays include DD, DDM, DMS, GARS, Geohash, GEOREF, Killbox-style GARS, and MGRS.
- Configurable keyboard and mouse controls persisted in browser cookies, including click-to-center on the map.
- In-app settings, keybinds, about, and markdown-backed roadmap pages.
- Node test suites for formatting, simulation, and symbol helpers (`npm test`).
- Error forwarding into an in-app alert panel for easier testing feedback.
- Desktop-first experience with keyboard and mouse controls; mobile and tablet devices see an unsupported-platform page instead of the simulator.

### Platform Support

Airspace Simulator targets desktop and laptop browsers. Mobile phones and tablets are detected on the server and client and shown a dedicated unsupported-platform page, because touch input and small viewports are not yet supported. A future mobile-first redesign may revisit this policy.

### Safety and Data Policy

Use simulated data only. Do not commit, upload, paste, screenshot, or describe classified, controlled, sensitive, operational, or real-world mission data. When in doubt, leave it out and use fictional examples.
