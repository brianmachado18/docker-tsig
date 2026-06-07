# Frontend Architecture

GeoTravel frontend is a Vite + React SPA organized by feature and integration boundary.

This structure was introduced in commit `d2a9291 Estructura fe`.

```text
frontend/src/
├── app/
│   ├── App.jsx
│   └── routes.jsx
├── features/
│   ├── attractions/
│   │   ├── AttractionCard.jsx
│   │   ├── AttractionForm.jsx
│   │   ├── attractionValidation.js
│   │   ├── attractionsService.js
│   │   └── attractionsStore.js
│   ├── auth/
│   ├── map/
│   │   ├── MapBaseLayer.jsx
│   │   ├── MapCanvas.jsx
│   │   ├── MapControls.jsx
│   │   ├── MapOverlayLayers.jsx
│   │   ├── interactions/
│   │   ├── layers/
│   │   ├── services/geoserver/
│   │   ├── mapStore.js
│   │   └── useRefreshEntityLayer.js
│   ├── routes/
│   └── zones/
├── pages/
└── shared/
    ├── components/
    ├── config/
    ├── i18n/
    └── lib/
```

Use `app/` for SPA bootstrap and route definitions.

Use `pages/` for route-level composition.

Use `features/<domain>/` for domain UI, Zustand stores, REST services and validation.

Use `features/map/` for OpenLayers canvas, controls, layers, interactions, map state and GeoServer adapters.

Use `shared/` for cross-feature components, config, i18n and common helpers.

Do not add new runtime code to the pre-restructure root folders `components/`, `services/`, `store/`, `config/` or `locales/`.
