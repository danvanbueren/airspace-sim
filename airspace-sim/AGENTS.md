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
