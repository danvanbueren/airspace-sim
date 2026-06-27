# Documentation

Contributor-facing documentation for the Airspace Simulator repository. These files are **not** shown in the app UI.

User-facing overview and setup live in the [repository root README](../README.md). In-app content (for example, the settings roadmap) lives under `airspace-sim/app/content/`.

## Contents

| Path | Description |
|------|-------------|
| [architecture/](architecture/README.md) | Application and simulation architecture deep dives (extracted from the root README) |
| [plans/](plans/README.md) | Implementation plans with shipped-commit checklists and phased work |
| [performance/](performance/README.md) | Performance analysis, validation results, optimization roadmap, instrumentation |

## Conventions

- Use Markdown (`.md`) for all documents in this folder.
- Prefer accurate, dated analysis over aspirational claims — note what was measured and on what hardware when possible.
- When a plan item ships, update the relevant plan’s **Shipped commits** section and status checklist; link to the introducing commit or pull request.
- Keep filenames lowercase with hyphens (for example, `optimization-plan.md`).
- Keep the root README concise; move growing architecture or investigation detail into `docs/` and link from the README.

Agents: see [`AGENTS.md`](../AGENTS.md) for when to update the README, `docs/`, plans, and the in-app roadmap.
