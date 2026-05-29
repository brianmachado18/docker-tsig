# Documentation Guide

GeoTravel documentation is organized so agents and humans can find the right context quickly without scanning frontend source folders for prompts.

| Area | Path | Purpose |
|---|---|---|
| Agent router | `AGENTS.md` | Which agent/skill to use |
| Documentation index | `docs/INDEX.md` | Quick navigation |
| Product spec | `docs/spec/TSIG-2026-Letra.md` | Functional requirements |
| Frontend docs | `docs/frontend/` | Architecture, design, integration notes |
| Frontend skills | `docs/skills/frontend/` | Reusable implementation guidance |
| Archived prompts | `docs/archive/frontend-prompts/` | Historical reference only |

## Recommended Flow

1. Start with `AGENTS.md`.
2. Read `docs/spec/TSIG-2026-Letra.md` for product scope.
3. For frontend work, read the relevant file in `docs/skills/frontend/`.
4. For GIS/backend/infra work, use `@GeoTravel-GIS`.
5. Keep implementation files under `frontend/src/`; keep prompts and skills under `docs/` or `.github/agents/`.
