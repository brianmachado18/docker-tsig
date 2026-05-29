# Snippets: Zones Flow

## Key store API (useZonesStore)

- `fetchZones()` — carga inicial
- `setSelectedZone(zone)` — marca `selectedZone` y abre formulario si zone != null
- `openForm(zone = null)` — abre formulario; si `zone` es null, abre para crear nueva zona
- `closeForm()` — cierra formulario y limpia `selectedZone`
- `saveZone(zoneData)` — guarda y reemplaza/añade la zona
- `deleteZone(zoneId)` — elimina la zona

## UI handlers examples

```javascript
// Abrir formulario para nueva zona
const handleNew = () => {
  useZonesStore.getState().openForm(null);
}

// Seleccionar una zona (ej: click en lista o mapa)
const handleSelect = (zone) => {
  useZonesStore.getState().setSelectedZone(zone);
}

// Cancelar / cerrar formulario
const handleCancel = () => {
  useZonesStore.getState().closeForm();
}

// Guardar desde formulario
const handleSave = async (zoneData) => {
  await useZonesStore.getState().saveZone(zoneData);
  // el store puede cerrar el form o mantenerlo según comportamiento
}
```

## Quick runtime checks (console)

```javascript
// Ver estado actual
console.log(useZonesStore.getState());

// Abrir nuevo
useZonesStore.getState().openForm();

// Cerrar
useZonesStore.getState().closeForm();
```