# Documentation

Planning documents, architecture notes, and technical investigations for the Airspace Simulator repository.

This folder is for contributor-facing documentation that is **not** shown in the app UI. User-facing docs remain in the [repository root README](../README.md). In-app content (for example, the settings roadmap) lives under `airspace-sim/app/content/`.

## Contents

| Path | Description |
|------|-------------|
| [bearing-range-tool-rewrite-plan.md](bearing-range-tool-rewrite-plan.md) | Bearing/range tool rewrite plan: modular architecture, temporary vs permanent lines, keybinds/control reference, track-attached endpoints |
| [performance/](performance/README.md) | Performance investigation, validation results, and optimization roadmap |

## Conventions

- Use Markdown (`.md`) for all documents in this folder.
- Prefer accurate, dated analysis over aspirational claims — note what was measured and on what hardware when possible.
- When a plan item ships, update the relevant doc and cross-link to the introducing commit or pull request.
- Keep filenames lowercase with hyphens (for example, `optimization-plan.md`).
