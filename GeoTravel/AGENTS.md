# Agent Router

Use this file as the stable entry point for AI work in GeoTravel. Detailed documentation lives under `docs/`; production frontend code lives under `frontend/src/`.

## Available Agents

| Agent | File | Owns | Use For |
|---|---|---|---|
| `@GeoTravel-FE` | `.github/agents/frontend-spa-architect.agent.md` | React SPA, OpenLayers client, Zustand, services, forms, UI/i18n | Any `frontend/` implementation or architecture task |
| `@GeoTravel-MapOL` | `.github/agents/openlayers-geoserver-specialist.agent.md` | OpenLayers interactions, GeoServer WMS/WFS read-only, map-driven admin actions | Capturing coordinates, selecting map features, drawing/editing geometries, refreshing GeoServer layers |
| `@GeoTravel-GIS` | `.github/agents/geo-platform-architect.agent.md` | GIS architecture, PostGIS, GeoServer, Spring Boot, Docker, Tomcat | Backend/GIS/infra tasks or frontend contracts that depend on them |

## Skill Map

| Task | Primary Agent | Skill |
|---|---|---|
| UI components, pages, layout | `@GeoTravel-FE` | `docs/skills/frontend/react-components.md` |
| Forms, validation, field errors | `@GeoTravel-FE` | `docs/skills/frontend/forms-validation.md` |
| Zustand stores, shared state, hooks | `@GeoTravel-FE` | `docs/skills/frontend/state-management.md` |
| CRUD flows joining forms and stores | `@GeoTravel-FE` | `docs/skills/frontend/crud-state-forms.md` |
| API clients, service adapters, mocks | `@GeoTravel-FE` | `docs/skills/frontend/services-apis.md` |
| OpenLayers, WMS/WFS, map interactions | `@GeoTravel-MapOL` | `docs/skills/frontend/openlayers-geoserver.md` |
| Map-driven admin actions and geometry editing | `@GeoTravel-MapOL` | `.github/agents/openlayers-geoserver-specialist.agent.md` |
| Auth route guards and mock login | `@GeoTravel-FE` | `docs/skills/frontend/auth-patterns.md` |
| Locales, copy, i18n audit | `@GeoTravel-FE` | `docs/skills/frontend/ui-localization.md` |
| PostGIS schema, spatial SQL, SRID | `@GeoTravel-GIS` | Agent instructions |
| GeoServer stores/layers/styles | `@GeoTravel-GIS` | Agent instructions |
| Docker, Tomcat, Spring Boot contracts | `@GeoTravel-GIS` | Agent instructions |

## Workspace Rules

1. Read the current branch before acting: `docker-compose.yml`, `frontend/src`, `backend`, `postgres/init`, and the relevant docs.
2. Use `docs/spec/TSIG-2026-Letra.md` as the source of product requirements.
3. Keep `frontend/src` free of agent prompts and skills; it should contain runtime code and assets only.
4. For interactive map work, use `@GeoTravel-MapOL` with `@GeoTravel-FE` for React/state and `@GeoTravel-GIS` for CRS, layers and spatial contracts.
5. Legacy prompts are archived in `docs/archive/frontend-prompts/` for reference only.

## Current Frontend Layout

The frontend was restructured in commit `d2a9291 Estructura fe`. Agents must use the current boundaries:

| Path | Purpose |
|---|---|
| `frontend/src/app/` | SPA bootstrap and route definitions |
| `frontend/src/pages/` | Route-level screen composition |
| `frontend/src/features/<domain>/` | Domain components, Zustand stores, REST services and validation |
| `frontend/src/features/map/` | OpenLayers canvas, controls, layers, interactions, map store and GeoServer client |
| `frontend/src/shared/components/` | Shared shell/UI components |
| `frontend/src/shared/config/` | Runtime config and map layer strategies |
| `frontend/src/shared/i18n/` | Language store and locale JSON |
| `frontend/src/shared/lib/` | Shared API, form and geometry helpers |

Do not create new runtime code in the old root folders `frontend/src/components`, `frontend/src/services`, `frontend/src/store`, `frontend/src/config` or `frontend/src/locales`.
