# P0 - Frontend Critical Documentation

Date: 2026-05-28
Author: @Frontend SPA Architect

Summary
-------
Este documento describe y documenta los cambios críticos aplicados al frontend durante la conversación reciente: 
- Apertura/cierre del formulario de Zonas (UX: Nueva Zona / Editar / Cancelar)
- Estado y API del store `zonesStore` (nuevo `isFormOpen`, `openForm`, `closeForm`)
- Flujo de datos de zonas (fetch, save, delete)
- i18n aplicado para los textos relacionados a Zonas

Objetivo
--------
Proveer a desarrolladores y revisores de una guía clara para verificar los cambios P0, los fragmentos de código relevantes y una checklist de aceptación para cerrar los items P0 en `docs/backlog.md`.

Files changed (quick list)
-------------------------
- `frontend/src/store/zonesStore.js` — añadido estado `isFormOpen`, acciones `openForm(zone)`, `closeForm()`, `setSelectedZone` abre el form; persistencia de comportamiento de UX.
- `frontend/src/pages/ZoneManagement.jsx` — ahora muestra el formulario solo si `isFormOpen`; agregado FAB "Nueva Zona" que llama `openForm()`.
- `frontend/src/components/zones/ZoneForm.jsx` — ahora usa `useZonesStore().closeForm()` para el botón de cancelar; los botones usan i18n (`zones.cancel`, `common.save`).
- `frontend/src/locales/en.json` y `frontend/src/locales/es.json` — agregadas claves `zones.newZone` y `zones.cancel`.
- `AGENTS.md` - actualizado con `@Frontend SPA Architect` y `@Geo Platform Architect`.
- Skills añadidos y movidos a `docs/skills/frontend/`.
- Memoria resumen: `/memories/repo/geotravel_retrospective_implementation.md`.

Design and rationale
--------------------
- UX: el formulario de `ZoneForm` era siempre visible; eso obligaba al usuario a ver siempre el panel lateral. Se cambió a abrirlo bajo demanda (nueva zona o editar) para reducir ruido y evitar confusiones.
- Estado: se añadió `isFormOpen` al store para que la visibilidad del formulario sea parte del flujo centralizado y pueda ser accionada desde el mapa o desde la lista.
- Localización: todos los textos nuevos usan `useLangStore().t()` y las claves están añadidas en `en.json` y `es.json`.

Detailed sections
-----------------

**1) Authentication (short note)**
- Nota: El flujo de autenticacion en P0 sigue siendo mock. Ver `docs/skills/frontend/auth-patterns.md` para detalles de la store `authStore` y `ProtectedRoute`.

**2) Zones flow (fetch / select / open / save / delete)**
- Fetch:
  - `useZonesStore().fetchZones()` — carga `zones` y setea `isLoading` y `error`.
- Select (edit):
  - `useZonesStore().setSelectedZone(zone)` ahora abre el formulario automáticamente (internamente setea `isFormOpen: !!zone`).
- New zone (create):
  - `useZonesStore().openForm()` abre formulario con `selectedZone == null`.
- Close / Cancel:
  - `useZonesStore().closeForm()` cierra el formulario y limpia `selectedZone`.
- Save:
  - `useZonesStore().saveZone(zoneData)` guarda (mock service) y actualiza `zones` y `selectedZone`.
- Delete:
  - `useZonesStore().deleteZone(zoneId)` elimina la zona y limpia `selectedZone`.

Code snippets (usage examples)
-----------------------------
- Abrir formulario para creación (UI):

```javascript
// zonaManagement UI handler
const openNew = () => useZonesStore.getState().openForm(null);

// seleccionar una zona desde lista o mapa
const selectZone = (zone) => useZonesStore.getState().setSelectedZone(zone);
```

- Verificar estado desde consola (runtime):

```javascript
// comprobar estado
const s = useZonesStore.getState();
console.log(s.isFormOpen, s.selectedZone);
```

- Guardar zona (ejemplo):

```javascript
await useZonesStore.getState().saveZone({ id, name, description, ... });
```

i18n: keys added
-----------------
- `zones.newZone` — EN: "New Zone" / ES: "Nueva Zona"
- `zones.cancel` — EN: "Cancel" / ES: "Cancelar"

Manual verification checklist (Acceptance criteria)
--------------------------------------------------
Preparación:
- Levantar la aplicación (si aplica):

```bash
docker compose up --build
# o en desarrollo local:
# npm install && npm run dev
```

Pasos de verificación manual:
1. Navegar a la ruta de administración de zonas: `/zones`.
2. Confirmar que el panel lateral `ZoneForm` NO está visible por defecto.
3. Buscar el botón `Nueva Zona` (FAB, esquina inferior derecha) y pulsarlo.
   - Resultado esperado: el formulario lateral aparece vacío y `selectedZone` es `null`.
4. Seleccionar una zona existente desde la lista o el mapa.
   - Resultado: `selectedZone` se setea y `ZoneForm` abre con los datos cargados.
5. Pulsar `Cancelar` en el `ZoneForm`.
   - Resultado: el formulario se cierra y `selectedZone` queda `null`.
6. Pulsar `Guardar` en el formulario con cambios válidos.
   - Resultado: `saveZone` se ejecuta, `zones` se actualiza y el formulario se cierra (según comportamiento actual del store).
7. Cambiar idioma (EN/ES) y verificar que las etiquetas `Nueva Zona` y `Cancelar` aparecen traducidas correctamente.

Checklist (para marcar)
- [ ] `isFormOpen` existe y se actualiza correctamente.
- [ ] `openForm()` abre formulario vacío.
- [ ] `setSelectedZone(zone)` abre formulario con datos.
- [ ] `closeForm()` cierra formulario y limpia `selectedZone`.
- [ ] `zones.newZone` y `zones.cancel` en `en.json` y `es.json`.
- [ ] UI cumple criterios manuales 1..7.

Files diff-summary (conceptual)
------------------------------
- `zonesStore.js`: agregado `isFormOpen`, `openForm(zone)`, `closeForm()`; `setSelectedZone` ahora abre el formulario.
- `ZoneManagement.jsx`: reemplazo de render permanente `ZoneForm` por condicional `isFormOpen` y adición del FAB que llama `openForm()`.
- `ZoneForm.jsx`: boton `Cancelar` invoca `closeForm()`; header close button llama `closeForm()`; botones usan `t('zones.cancel')`.
- `en.json`/`es.json`: añadidas `zones.newZone` y `zones.cancel`.

Docs snippets
-------------
Se incluyen en `docs/snippets/` ejemplos rápidos para desarrolladores con pasos reproducibles.

Next steps / Recommendations
---------------------------
- Agregar tests unitarios / e2e para el flujo (Vitest + Testing Library / Cypress).
- Revisar que `saveZone` cierre/limpie el formulario o dejarlo como comportamiento explícito (design decision).
- Documentar la API backend target para `zonesService` (contract: fields esperados).
- Añadir un pequeño script de auditoría para detectar strings hardcodeadas (grep + heurística).


Appendix: lista de archivos creados por este task
------------------------------------------------
- `docs/P0_frontend_critical.md` (este archivo)
- `docs/snippets/zones_flow.md`
- `docs/snippets/i18n_quick.md`

