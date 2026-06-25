<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Material UI Version

Use the Material UI version installed in this project, not examples from another major version. Check `package-lock.json` before writing or updating MUI code; it is the source of truth for the exact installed packages. At the time this rule was written, `@mui/material`, `@mui/icons-material`, and `@mui/system` are on version `9.0.0`.

When using Material UI APIs, verify patterns against the installed version's documentation or local package types. Avoid deprecated imports, props, styling APIs, or theming patterns from earlier MUI versions.

### MUI 9 slots, `slotProps`, and styling (read before writing JSX)

This project is on **MUI 9**. Training data from MUI v4–v8 is a common source of bugs here. The most frequent mistake is passing **layout/style props directly on a component** when MUI 9 only forwards a small, explicit prop surface to the underlying DOM node.

#### The React warning you must avoid

If you see:

`React does not recognize the 'alignItems' prop on a DOM element`

…you almost certainly put a style/layout prop on the JSX tag instead of in `sx` or `slotProps`. Fix the callsite; do not work around it with native `<span style={…}>` unless there is a strong reason.

#### Rule 1 — `Box`, `Paper`, `Typography`: use `sx`, not system props

In MUI 9 these components accept **`sx`** (and `component`) for styling. They do **not** accept `alignItems`, `justifyContent`, `flexWrap`, `gap`, `display`, etc. as top-level JSX props.

```jsx
// Wrong — alignItems leaks to the DOM <div>
<Box display='flex' alignItems='center' gap={1}>

// Right
<Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>

// Also right for panel chrome
<Paper elevation={0} sx={{display: 'flex', alignItems: 'center', gap: 1}}>
```

#### Rule 2 — `Stack`: only a few top-level props are valid

`Stack` supports `direction`, `spacing`, `divider`, `useFlexGap`, `component`, `children`, and **`sx`**. It does **not** support `alignItems`, `justifyContent`, or `flexWrap` as top-level props in v9.

```jsx
// Wrong
<Stack direction='row' alignItems='center' flexWrap='wrap'>

// Right
<Stack direction='row' spacing={1} sx={{alignItems: 'center', flexWrap: 'wrap'}}>
```

#### Rule 3 — composite components use `slotProps`, not `PaperProps` / `*Props`

MUI 9 replaced most `FooProps` passthrough APIs with **`slotProps`**. Each key names an internal **slot** (sub-component). Props under that key are forwarded to that slot's component.

Common slots in this codebase:

| Parent | Slot key | Forwards to | Typical use |
|--------|----------|-------------|-------------|
| `Menu`, `Select` `MenuProps` | `paper` | `Paper` | Menu surface styling (`maxHeight`, `zIndex`, nested selectors) |
| `TextField` | `htmlInput` | native `<input>` | `min` / `max` / `step`, `onKeyDown`, etc. |
| `Popover`, `Dialog`, `Drawer` | `paper` | `Paper` | Surface layout and theme overrides |
| `Modal` | `backdrop` | `Backdrop` | Backdrop behavior/styles |

Legacy names like `PaperProps`, `BackdropProps`, and `InputProps` are **not** the v9 pattern. Use `slotProps` instead. (People sometimes say “paperProps” informally — in this repo that means **`slotProps.paper`**.)

**Menu / Select menu surface** — see `getTrackManagementSelectMenuProps` in `app/components/windows/TrackManagementWindow.js`:

```jsx
slotProps: {
    paper: {
        sx: {
            maxHeight: 320,
            zIndex: (zIndex ?? 1300) + 1,
            '& .MuiMenuItem-root': { fontFamily: 'monospace' },
        },
    },
},
```

**Select inside a map overlay** — `MenuProps.slotProps.paper` in `app/components/map/MapContextMenu.js`.

**TextField native input** — see `TEXT_INPUT_ENTER_BLUR_SLOT_PROPS` in `TrackManagementWindow.js` and `slotProps={{ htmlInput: { min, max, step } }}` on settings fields:

```jsx
slotProps={{ htmlInput: { min: 500, max: 30000, step: 100 } }}
```

#### Rule 4 — put layout/styles on the correct layer

| Goal | Do this |
|------|---------|
| Style the component's own root | `sx` on `Box` / `Paper` / `Stack` / `Typography` |
| Style a Menu/Popover/Dialog surface | `slotProps.paper.sx` (or `MenuProps.slotProps.paper` on `Select`) |
| Style the native input inside `TextField` | `slotProps.htmlInput` |
| Style a one-off glass panel on the map | `Paper` + `sx` directly (e.g. `PerformanceAnalyticsOverlay`, `MapContextMenu`) |

Do **not** pass `alignItems` through `slotProps.paper` when you own the `Paper` element — put it in that `Paper`'s `sx` instead. `slotProps.paper` is for when **MUI** renders the `Paper` inside a composite component.

#### Rule 5 — verify against installed types

Before adding unfamiliar MUI props, check the component's `.d.ts` under `node_modules/@mui/material/<Component>/` or grep this repo for an existing pattern. If a prop is not listed in the component's public API, assume it will leak to the DOM.


Prioritize readability and standardized best practices throughout the codebase. Keep formatting consistent with the surrounding file, use clear names, and prefer straightforward control flow over clever or densely packed code.

Avoid excessively long components, hooks, or files. Split large front-end components into smaller focused components, and move reusable component logic into separate hook files when that improves readability. Prefer clear file boundaries over large files that mix rendering, state management, data shaping, and side effects.

Use React context where it fits the domain and reduces long prop chains through intermediate components. Keep context values focused and stable; do not introduce context for state that is only used by a narrow parent-child pair.

## README Documentation

The repository root [`README.md`](../README.md) is the primary user-facing documentation. Treat it as part of every change, not a separate follow-up task.

Whenever you add, remove, rename, or materially change code, validate whether the root README still accurately describes the project. Update it in the same work session when anything is out of date or missing. Do not leave README drift for a later pass.

At minimum, review and update the README when your change affects:

- **Repository structure** — new, moved, or removed directories and files; update the tree and path descriptions.
- **Business logic and workflows** — simulation behavior, operator flows, settings, persistence, merge/correlation/initiation rules, or API boundaries between UI and engine.
- **Architecture explanations** — provider layout, tick pipeline, module responsibilities, or how components and hooks connect.
- **Setup and operations** — scripts, dependencies, environment assumptions, build/test commands, or how to run the app.
- **Capabilities and roadmap** — user-visible features, toggles, panels, or planned work that should be discoverable without reading source.

When updating the README:

- Keep the existing tone, structure, and level of detail; extend sections in place rather than duplicating content.
- Prefer accurate, concise prose over listing every file touched.
- If a change is internal-only with no user or contributor impact, briefly confirm the README is still correct; no edit is required.
- The short [`airspace-sim/README.md`](README.md) should continue to point to the root README; update it only if the application directory role or quick-start steps change.

## Settings Roadmap Page

The in-app **Settings → Roadmap** page is backed by [`app/content/settings-roadmap.md`](app/content/settings-roadmap.md). Treat it as part of every change that affects project direction or delivered capabilities, not a separate follow-up task.

Whenever you ship a user-visible feature, close out planned work, or add or reprioritize future items, validate whether the roadmap still reflects reality. Update it in the same work session when anything is out of date or missing. Do not leave roadmap drift for a later pass.

At minimum, review and update the roadmap when your change affects:

- **Completed work** — mark shipped items with ✅, place them under the correct month section, and link to the introducing commit.
- **Planned or exploratory work** — add, remove, or reword **Future** items when scope, priorities, or naming change.
- **Feature grouping or naming** — keep category prefixes (for example, `Map & scope tools`, `Tracks & symbology`) consistent with how capabilities are described elsewhere.

When updating the roadmap:

- Keep the existing tone, structure, and checklist format; extend sections in place rather than duplicating content.
- Prefer accurate, concise item titles over listing every file touched.
- If a change is internal-only with no roadmap impact, briefly confirm the page is still correct; no edit is required.
- When the roadmap changes materially, also review the root README **Roadmap** section so the high-level summary stays aligned.
