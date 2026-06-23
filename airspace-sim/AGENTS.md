<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Material UI Version

Use the Material UI version installed in this project, not examples from another major version. Check `package-lock.json` before writing or updating MUI code; it is the source of truth for the exact installed packages. At the time this rule was written, `@mui/material`, `@mui/icons-material`, and `@mui/system` are on version `9.0.0`.

When using Material UI APIs, verify patterns against the installed version's documentation or local package types. Avoid deprecated imports, props, styling APIs, or theming patterns from earlier MUI versions.

## Code Formatting And Styling

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

## Cursor Cloud specific instructions

- The Next.js app and its `package.json` live in the nested `airspace-sim/` directory, not the repo root. Run all `npm` commands from `airspace-sim/` (the update script installs deps there automatically on startup).
- Standard scripts (see `airspace-sim/package.json`): `npm run dev` (dev server on http://localhost:3000), `npm test` (Node test runner over `tests/**/*.test.js`), `npm run build`, `npm run start`.
- There is no separate lint step: the project has no `lint` script and no ESLint config. Type checking runs as part of `npm run build` (`next build` reports `Running TypeScript`).
- The app is fully client-side with no backend service, database, or environment variables required; just start the dev server and open the browser.
