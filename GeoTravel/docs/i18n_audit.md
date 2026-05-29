# i18n Audit Report

Date: 2026-05-29
Author: @GeoTravel-Frontend-Builder (agent)

Scope
-----
Auditoría rápida de strings hardcodeadas en `frontend/src/components/**` para identificar etiquetas visibles al usuario que deben ser extraídas a los locales (`en.json`, `es.json`) y reemplazadas por `t('...')`.

Summary
-------
Se encontraron múltiples strings visibles en componentes UI que todavía están hardcodeadas (botones, tooltips, titles). Recomendación: reemplazar estos strings por llamadas a `useLangStore().t('...')` y añadir las claves en `frontend/src/locales/en.json` y `es.json`.

Findings (sample)
------------------
- `frontend/src/components/map/MapControls.jsx`:
  - title="Select" (tooltip label)
  - tooltip text: "Select"
  - title="Draw Polygon" / tooltip: "Draw Polygon"
  - title="Edit Geometry" / tooltip: "Edit"
  - title="Delete Zone" / tooltip: "Delete"

- `frontend/src/components/common/TopAppBar.jsx`:
  - displays `title` prop (ensure pages use `t()` when passing title strings)

- `frontend/src/components/common/Sidebar.jsx`:
  - static nav labels (ensure they are built from `t('common.zones')`, etc.)

Recommendations
---------------
1. Replace hardcoded labels with localized keys. Example:

```jsx
// Before
<button title="Select">...</button>

// After
const { t } = useLangStore();
<button title={t('map.select')}>...</button>
```

2. Add keys to `en.json` and `es.json` under appropriate namespaces (e.g., `map.select`, `map.drawPolygon`, `map.edit`, `map.delete`).
3. Add unit smoke test that runs a grep for capitalized literal strings in `frontend/src/components` to prevent regressions.

Proposed quick key list (to add to locales)
------------------------------------------
- `map.select` — EN: "Select" / ES: "Seleccionar"
- `map.drawPolygon` — EN: "Draw Polygon" / ES: "Dibujar Polígono"
- `map.edit` — EN: "Edit" / ES: "Editar"
- `map.delete` — EN: "Delete" / ES: "Eliminar"
- `common.sidebar.*` — ensure nav labels already use keys (`common.zones`, `common.routes`, ...)

Next actions
------------
- Implement replacements across `frontend/src/components/map/MapControls.jsx`, `Sidebar.jsx`, `TopAppBar.jsx` and any other components listed in the grep results.
- Add the proposed keys to `en.json` and `es.json`.
- Run the grep again to confirm no remaining hardcoded UI strings.

Appendix: grep hits (excerpt)
-----------------------------
(Use `grep -n` locally to see full lines)
- frontend/src/components/map/MapControls.jsx: title="Select"
- frontend/src/components/map/MapControls.jsx: "Select"
- frontend/src/components/map/MapControls.jsx: title="Draw Polygon"
- frontend/src/components/map/MapControls.jsx: "Draw Polygon"
- frontend/src/components/map/MapControls.jsx: title="Edit Geometry"
- frontend/src/components/map/MapControls.jsx: "Edit"
- frontend/src/components/map/MapControls.jsx: title="Delete Zone"
- frontend/src/components/map/MapControls.jsx: "Delete"

(End of report)
