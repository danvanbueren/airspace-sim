Planned work for Airspace Simulator, grouped chronologically. Completed items link to the commit that introduced them.

## May 2026

### Map & scope tools

- ✅ Bearing/range measurement lines on the map — [`1725cf6`](https://github.com/danvanbueren/airspace-sim/commit/1725cf6)
- ✅ Bearing/range QOL and tooltip refinements — [`6864844`](https://github.com/danvanbueren/airspace-sim/commit/6864844)
- ✅ Bearing/range tool directory refactor — [`63caa1c`](https://github.com/danvanbueren/airspace-sim/commit/63caa1c)
- ✅ Cursor coordinate overlay with selectable grid reference formats — [`c4b80f2`](https://github.com/danvanbueren/airspace-sim/commit/c4b80f2)
- ✅ Connect fixed-function panel zoom buttons to MapLibre — [`2a58c93`](https://github.com/danvanbueren/airspace-sim/commit/2a58c93)

### Operator interface

- ✅ Configurable keyboard and mouse bindings — [`d56eb0b`](https://github.com/danvanbueren/airspace-sim/commit/d56eb0b)

### Simulation & sensors

- ✅ Simulated radar and IFF feeds from phantom truth aircraft — [`5b54dac`](https://github.com/danvanbueren/airspace-sim/commit/5b54dac)

### Tracks & symbology

- ✅ Floating track management windows — [`e44422c`](https://github.com/danvanbueren/airspace-sim/commit/e44422c)
- ✅ Track display with MIL-STD-2525 symbology — [`bb2cc4d`](https://github.com/danvanbueren/airspace-sim/commit/bb2cc4d)

## June 2026

### Map & scope tools

- ✅ Dark map water and track label readability — [`1e82879`](https://github.com/danvanbueren/airspace-sim/commit/1e82879)
- ✅ Click-to-center map camera with rebindable key or mouse button — [`523fc9d`](https://github.com/danvanbueren/airspace-sim/commit/523fc9d)
- ✅ Temporary vs permanent bearing/range lines with rebindable persist modifier — [`2294fef`](https://github.com/danvanbueren/airspace-sim/commit/2294fef)
- ✅ Complete Control Reference in Settings → Usage Guide — [`2294fef`](https://github.com/danvanbueren/airspace-sim/commit/2294fef) (moved from Keybinds)
- ✅ Bearing/range persistence behavior selector in Settings → Look & Feel — [`95f94c4`](https://github.com/danvanbueren/airspace-sim/commit/95f94c4)
- ✅ Group criteria circle toggle (Caps Lock, 3 NM radius) — pending PR

### Operator interface

- ✅ Markdown-backed settings roadmap page — [`c5f2013`](https://github.com/danvanbueren/airspace-sim/commit/c5f2013)
- ✅ Modular draggable action panels with cookie-backed layout — [`00d945a`](https://github.com/danvanbueren/airspace-sim/commit/00d945a)

### Simulation & sensors

- ✅ Detection-to-track correlation and merge — [`961dcc1`](https://github.com/danvanbueren/airspace-sim/commit/961dcc1), [`e96a06e`](https://github.com/danvanbueren/airspace-sim/commit/e96a06e)

### Tracks & symbology

- ✅ Track engine with static display and sensor-driven extrapolation — [`961dcc1`](https://github.com/danvanbueren/airspace-sim/commit/961dcc1)
- ✅ Velocity vector sticks on firm tracks — [`7b1214a`](https://github.com/danvanbueren/airspace-sim/commit/7b1214a)
- ✅ Live kinematic field editing in Track Management — [`a0ff710`](https://github.com/danvanbueren/airspace-sim/commit/a0ff710), [`011f714`](https://github.com/danvanbueren/airspace-sim/commit/011f714)
- ✅ Lazy registration for missing MIL-STD map icons — [`4c9623e`](https://github.com/danvanbueren/airspace-sim/commit/4c9623e)
- ✅ Callsign validation and civilian CIV## allocation — [`5dc8803`](https://github.com/danvanbueren/airspace-sim/commit/5dc8803)
- ✅ Searchable platform-specific type catalog — [`e6f85d3`](https://github.com/danvanbueren/airspace-sim/commit/e6f85d3)
- ✅ Track management UI overhaul — [`67464d8`](https://github.com/danvanbueren/airspace-sim/commit/67464d8)
- ✅ Track Management window viewport scrolling on short map viewports — [`ef2bae0`](https://github.com/danvanbueren/airspace-sim/commit/ef2bae0)
- ✅ Reference point creation from the map context menu — [`16e3321`](https://github.com/danvanbueren/airspace-sim/commit/16e3321)

## Future

### Exploratory

- 🔮 Fuel, weapons, and fighter timeline concepts — unclassified simulated data only; scope boundaries still TBD

### Map & scope tools

- 🔮 Track-attached bearing/range line endpoints (line snapping)
- 🔮 Reference point editing and management

### Training & mission workflows

- 🔮 Pre-built training scenarios and recurring tactical picture templates
- 🔮 Tools to automate creation of static pictures for drill repetition
- 🔮 End-to-end control loops for mission practice
- 🔮 Automated picture call calculations inspired by [ParrotSour](https://parrotsour.com/)
