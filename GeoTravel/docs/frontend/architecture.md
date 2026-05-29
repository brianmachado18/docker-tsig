# Frontend Architecture

GeoTravel frontend is a Vite + React SPA organized by feature and integration boundary.

```text
frontend/src/
├── components/
│   ├── auth/
│   ├── attractions/
│   ├── common/
│   ├── map/
│   ├── routes/
│   └── zones/
├── pages/
├── services/
│   └── mocks/
├── store/
├── locales/
├── config/
├── App.jsx
└── main.jsx
```

Use `pages/` for route-level composition, `components/` for reusable or feature UI, `services/` for API/GeoServer adapters, and `store/` for Zustand state.
