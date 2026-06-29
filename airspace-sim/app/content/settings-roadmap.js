import {PROJECT_NAME} from '../config/projectName'
import {EXTERNAL_LINKS, githubCommitUrl} from './externalLinks'

function commit(sha) {
    return `[\`${sha}\`](${githubCommitUrl(sha)})`
}

export default `Planned work for ${PROJECT_NAME}, grouped chronologically. Completed items link to the commit that introduced them.

## May 2026

### Map & scope tools

- ✅ Bearing/range measurement lines on the map — ${commit('1725cf6')}
- ✅ Bearing/range QOL and tooltip refinements — ${commit('6864844')}
- ✅ Bearing/range tool directory refactor — ${commit('63caa1c')}
- ✅ Cursor coordinate overlay with selectable grid reference formats — ${commit('c4b80f2')}
- ✅ Connect fixed-function panel zoom buttons to MapLibre — ${commit('2a58c93')}

### Operator interface

- ✅ Configurable keyboard and mouse bindings — ${commit('d56eb0b')}

### Simulation & sensors

- ✅ Simulated radar and IFF feeds from phantom truth aircraft — ${commit('5b54dac')}

### Tracks & symbology

- ✅ Floating track management windows — ${commit('e44422c')}
- ✅ Track display with MIL-STD-2525 symbology — ${commit('bb2cc4d')}

## June 2026

### Map & scope tools

- ✅ Dark map water and track label readability — ${commit('1e82879')}
- ✅ Click-to-center map camera with rebindable key or mouse button — ${commit('523fc9d')}
- ✅ Temporary vs permanent bearing/range lines with rebindable persist modifier — ${commit('2294fef')}
- ✅ Complete Control Reference in Settings → Usage Guide — ${commit('2294fef')} (moved from Keybinds)
- ✅ Bearing/range persistence behavior selector in Settings → Look & Feel — ${commit('95f94c4')}
- ✅ Group criteria circle toggle (Caps Lock, 3 NM radius) — ${commit('2478486')}
- ✅ Draw Tool context menu entry opens compact draw-tools action panel — ${commit('d67c112')}

### Operator interface

- ✅ Markdown-backed settings roadmap page — ${commit('c5f2013')}
- ✅ Modular draggable action panels with cookie-backed layout — ${commit('00d945a')}

### Simulation & sensors

- ✅ Detection-to-track correlation and merge — ${commit('961dcc1')}, ${commit('e96a06e')}

### Tracks & symbology

- ✅ Track engine with static display and sensor-driven extrapolation — ${commit('961dcc1')}
- ✅ Velocity vector sticks on firm tracks — ${commit('7b1214a')}
- ✅ Live kinematic field editing in Track Management — ${commit('a0ff710')}, ${commit('011f714')}
- ✅ Lazy registration for missing MIL-STD map icons — ${commit('4c9623e')}
- ✅ Callsign validation and civilian CIV## allocation — ${commit('5dc8803')}
- ✅ Searchable platform-specific type catalog — ${commit('e6f85d3')}
- ✅ Track management UI overhaul — ${commit('67464d8')}
- ✅ Track Management window viewport scrolling on short map viewports — ${commit('ef2bae0')}
- ✅ Reference point creation from the map context menu — ${commit('16e3321')}

## Future

### Exploratory

- 🔮 Fuel, weapons, and fighter timeline concepts — unclassified simulated data only; scope boundaries still TBD

### Map & scope tools

- 🔮 Draw geometry tools (rectangle, square, circle, oval, racetrack, polygon)
- 🔮 Track-attached bearing/range line endpoints (line snapping)
- 🔮 Reference point editing and management

### Training & mission workflows

- 🔮 Pre-built training scenarios and recurring tactical picture templates
- 🔮 Tools to automate creation of static pictures for drill repetition
- 🔮 End-to-end control loops for mission practice
- 🔮 Automated picture call calculations inspired by [ParrotSour](${EXTERNAL_LINKS.parrotSour.site})
`
