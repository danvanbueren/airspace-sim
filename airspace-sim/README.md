# [Airspace Simulator](https://github.com/danvanbueren/airspace-sim) &middot; [![License](https://img.shields.io/badge/license-all_rights_reserved-blue)](https://github.com/danvanbueren/airspace-sim/blob/main/LICENSE.md) [![Repo Size](https://img.shields.io/github/repo-size/danvanbueren/airspace-sim?color=blue)](https://github.com/danvanbueren/airspace-sim) [![Issues](https://img.shields.io/github/issues/danvanbueren/airspace-sim)](https://github.com/danvanbueren/airspace-sim/issues) [![Last Commit](https://img.shields.io/github/last-commit/danvanbueren/airspace-sim)](https://github.com/danvanbueren/airspace-sim/commits/main/)

Airspace Simulator is a non-secure browser-based simulator for practicing command and control workflows in a simulated operational airspace. It is intended for learning, experimentation, and software development around airspace visualization, track management, grid references, map interaction patterns, and scenario-building tools.

This project is personal. It is not owned, operated, sponsored, or endorsed by any government entity. The repository is unclassified and should only contain unclassified, non-sensitive, non-operational information.

See [#context](#context) for more detail about the goal and backstory of this application.

## Get Started

### Developers

1. Fork the repository on GitHub: [danvanbueren/airspace-sim](https://github.com/danvanbueren/airspace-sim).
2. Clone your fork locally:

```bash
git clone https://github.com/<your-github-username>/airspace-sim.git
cd airspace-sim
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. Open the local app URL printed by Next.js, typically [http://localhost:3000](http://localhost:3000).

Before opening a pull request, make sure the app still builds:

```bash
npm run build
```

### Testers

Testers can help by running the simulator locally, trying realistic workflows, and reporting confusing behavior, broken controls, visual issues, or crashes.

To run the app locally:

```bash
git clone https://github.com/danvanbueren/airspace-sim.git
cd airspace-sim
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). Try creating tracks, dragging the map, switching settings, drawing bearing/range lines, changing keybinds, and refreshing the page to confirm persisted settings still behave as expected.

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
airspace-sim/
+-- app/
|   +-- components/
|   |   +-- global/          # Classification bars, commit display, and global UI pieces.
|   |   +-- map/             # Map view, context menu, and cursor coordinate overlay.
|   |   +-- panels/          # Glass panels, settings toolbelt, settings modal pages.
|   |   +-- windows/         # Floating workflow windows such as track management.
|   +-- contexts/            # React contexts for map state, theme, app settings, and controls.
|   +-- hooks/
|   |   +-- global/          # Global interaction guards, measurement hooks, error forwarding.
|   |   +-- map/             # Map setup, controls, track layers, bearing/range tools.
|   +-- tools/
|   |   +-- browser/         # Browser storage helpers.
|   |   +-- external/        # External service helpers.
|   |   +-- formatting/      # Date/time and grid reference formatting.
|   |   +-- milstd2525/      # Symbol code and icon generation helpers.
|   +-- buildInfo.js         # Project metadata, links, version, and copyright text.
|   +-- globals.css          # Global styles.
|   +-- layout.js            # Root Next.js layout and providers.
|   +-- page.js              # Main simulator shell.
+-- public/
|   +-- map-styles/          # Local MapLibre style JSON files.
+-- AGENTS.md                # Workspace guidance for AI coding agents.
+-- CLAUDE.md                # Pointer to shared agent guidance.
+-- jsconfig.json            # JavaScript path alias configuration.
+-- next.config.mjs          # Next.js configuration.
+-- package-lock.json        # Locked dependency versions.
+-- package.json             # Project scripts and dependencies.
+-- README.md                # Project documentation.
```

## Tech Stack

- [Next.js](https://nextjs.org/) ([docs](https://nextjs.org/docs)) powers the application framework, development server, routing, build, and production start flow.
- [React](https://react.dev/) ([docs](https://react.dev/learn)) provides the component model, hooks, context providers, and client-side UI behavior.
- [Material UI](https://mui.com/material-ui/) ([docs](https://mui.com/material-ui/getting-started/)) provides the UI component library used for panels, buttons, forms, modals, typography, alerts, and layout.
- [Emotion](https://emotion.sh/docs/introduction) ([docs](https://emotion.sh/docs/introduction)) supports Material UI styling.
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) ([docs](https://maplibre.org/maplibre-gl-js/docs/)) renders the interactive map and map layers.
- [milsymbol](https://spatialillusions.com/milsymbol/) ([docs](https://github.com/spatialillusions/milsymbol)) generates MIL-STD-2525-style tactical symbols for simulated tracks.
- [mgrs](https://www.npmjs.com/package/mgrs) ([package docs](https://www.npmjs.com/package/mgrs)) converts coordinates into MGRS.
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

## Roadmap

Near-term and exploratory work includes:

- Improve static and extrapolated track behavior.
- Add reference point creation and management.
- Build simulated radar and IFF sensor feeds from phantom track data.
- Correlate moving target indicators with sensor data.
- Create tools for pre-built training scenarios.
- Automate generation of recurring tactical pictures.
- Build end-to-end control loops for mission practice.
- Add automated picture call calculations inspired by ParrotSour workflows.
- Continue evaluating what additional fuel, weapons, timeline, and mission-planning concepts can be represented safely with unclassified simulated data.

## Context

Airspace Simulator is a spiritual successor to John McCarthy's [ParrotSour](https://parrotsour.com/), with a focus on making command and control practice more approachable in a modern web application. The long-term goal is to provide a training sandbox where aircrew, operators, controllers, students, and hobbyist developers can rehearse airspace management concepts without relying on classified systems or operational data.

The mission is to build a practical, extensible, and transparent simulator that can support:

- Interactive map familiarization and airspace visualization.
- Track creation, labeling, and management workflows.
- Bearing/range measurement and map annotation tools.
- Multiple grid reference formats used in operational discussions.
- Scenario construction for repeatable training events.
- Future sensor, radar, IFF, and tactical picture automation experiments using simulated data only.

### Current Capabilities

- Full-screen map workspace with light and dark map styles.
- Track initiation and editing from the map context menu.
- MIL-STD-2525-style symbol rendering for simulated tracks.
- Bearing/range drawing, context menus, and line removal controls.
- Cursor coordinate overlay with selectable grid reference systems.
- Supported coordinate displays include DD, DDM, DMS, GARS, Geohash, GEOREF, Killbox-style GARS, and MGRS.
- Configurable keyboard and mouse controls persisted in browser cookies.
- In-app settings, keybinds, about, and roadmap pages.
- Error forwarding into an in-app alert panel for easier testing feedback.

### Safety and Data Policy

Use simulated data only. Do not commit, upload, paste, screenshot, or describe classified, controlled, sensitive, operational, or real-world mission data. When in doubt, leave it out and use fictional examples.