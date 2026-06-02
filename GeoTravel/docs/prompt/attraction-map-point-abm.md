# Prompt: ABM de atracciones desde punto en mapa

## User story

Como usuario administrador, quiero poder seleccionar un punto desde el mapa para crear, modificar o eliminar una atraccion turistica.

Objetivo: capturar el evento del mapa y las coordenadas seleccionadas. Luego el usuario completa el resto de la informacion en el ABM.

## Prompt de implementacion

````text
Actua como @GeoTravel-FE y consulta/coordina con @GeoTravel-GIS cuando haya decisiones de coordenadas, SRID, OpenLayers, WKT o contratos GIS.

Contexto del proyecto:
- Frontend: React + Vite, React Router, Zustand, OpenLayers `ol`, Tailwind.
- Arquitectura:
  - `frontend/src/pages`: composicion de pantallas.
  - `frontend/src/components/map`: mapa y controles.
  - `frontend/src/components/attractions`: ABM de atracciones.
  - `frontend/src/store`: estado Zustand.
  - `frontend/src/services`: adaptadores API.
- El mapa principal esta en `src/components/map/MapCanvas.jsx`.
- El ABM de atracciones usa:
  - `src/pages/AttractionCatalog.jsx`
  - `src/components/attractions/AttractionForm.jsx`
  - `src/store/attractionsStore.js`
  - `src/services/attractionsService.js`
- El backend espera `geomWkt`; el frontend ya convierte `longitude`/`latitude` a `POINT(lon lat)`.
- Contrato GIS:
  - FE/API: coordenadas en `EPSG:4326`, formato `[longitude, latitude]`.
  - OpenLayers renderiza en `EPSG:3857`.
  - Usar `toLonLat(event.coordinate)` al capturar clicks del mapa.
  - No usar WFS-T para escritura; guardar por API existente.

User story:
Como usuario administrador, quiero poder seleccionar un punto desde el mapa para crear, modificar o eliminar una atraccion turistica. El objetivo inicial es capturar el evento del mapa y las coordenadas seleccionadas. Luego el usuario completa el resto de la informacion en el ABM.

Objetivo funcional:
Implementar en el frontend el flujo de seleccion de punto desde el mapa para atracciones turisticas, reutilizando el ABM existente.

Cambios requeridos:

1. Pantalla de atracciones con mapa
- Integrar `MapCanvas` en la pantalla admin de atracciones.
- Usar `MapCanvas attractions={attractions}` para renderizar las atracciones existentes.
- Mantener `Sidebar`, `TopAppBar`, panel/lista de atracciones y `AttractionForm`.
- Tomar como referencia visual/estructural `ZoneManagement` o `RoutePlanner`.

2. Interaccion de mapa
Extender `MapCanvas` con props opcionales para interaccion, sin acoplarlo directamente a `attractionsStore`.

Debe permitir:
- Registrar `map.on('singleclick', handler)` con cleanup correcto en `useEffect`.
- Capturar clicks sobre mapa vacio.
- Convertir coordenadas con `toLonLat(event.coordinate)`.
- Devolver a la pantalla:
  ```js
  {
    longitude,
    latitude,
    coordinates: [longitude, latitude],
    event
  }
  ```
- Detectar click sobre atraccion existente usando `map.forEachFeatureAtPixel(event.pixel, ...)`.

3. Identificacion de features
- Agregar a las features de atracciones una propiedad clara:
  ```js
  entityType: 'attraction'
  ```
- Mantener `id`, `name/title` y `status`.
- Al hacer click sobre una feature, identificar que sea una atraccion antes de operar.

4. Herramientas de mapa
Usar `useMapStore.activeLayer` y `useMapStore.activeTool`.

Comportamiento esperado:
- `activeLayer === 'attractions'`.
- `draw`: click en mapa vacio abre formulario de nueva atraccion con coordenadas precargadas.
- `select` o `edit`: click sobre marcador abre el formulario con la atraccion existente.
- `delete`: click sobre marcador pide confirmacion y elimina usando `deleteAttraction(id)`.

5. ABM de atraccion
- Reutilizar `AttractionForm`.
- El formulario ya acepta `latitude`, `longitude` y `coordinates`; no duplicar logica.
- Al crear desde mapa:
  ```js
  openForm({
    coordinates: [longitude, latitude],
    longitude,
    latitude
  })
  ```
- Mantener validaciones actuales de latitud/longitud.
- Mantener guardado actual con `saveAttraction`.

6. MapControls
- Ajustar `MapControls` para que soporte contexto de atracciones.
- Evitar texto como "Dibujar Poligono" cuando se esta trabajando con puntos.
- Si hace falta, parametrizar labels/herramientas visibles por props.
- No romper el uso actual en zonas/rutas.

7. Restricciones
- No cambiar endpoints existentes:
  - `/atraccion/buscar/todos`
  - `/atraccion/alta`
  - `/atraccion/actualizar`
  - `/atraccion/eliminar`
- No cambiar el contrato de `attractionsService`.
- No invertir lat/lon: siempre usar `POINT(longitude latitude)`.
- Limpiar listeners/interactions al desmontar o cambiar herramientas.
- No romper `/guest`, `/zones` ni `/routes`.

Criterios de aceptacion:
- Desde la pantalla de atracciones puedo activar creacion y hacer click en el mapa.
- El formulario se abre con latitud y longitud precargadas.
- Puedo guardar la atraccion y verla luego como marcador en el mapa.
- Puedo hacer click sobre un marcador existente y abrirlo para modificarlo.
- Puedo eliminar una atraccion desde el marcador con confirmacion previa.
- Las coordenadas guardadas respetan `[longitude, latitude]` y WKT `POINT(lon lat)`.
- `npm run build` pasa correctamente.

Verificacion:
- Ejecutar:
  ```bash
  npm run build
  ```
- Validar manualmente:
  - Crear atraccion desde click en mapa.
  - Editar atraccion desde marcador.
  - Eliminar atraccion desde marcador.
  - Confirmar que el formulario recibe coordenadas correctas.
````

## Notas tecnicas

- `AttractionForm.jsx` tiene actualmente la opcion `HITORICA`; confirmar si ese valor viene del backend antes de corregirlo.
- Mantener el orden de coordenadas como `[longitude, latitude]`.
- Para WKT, mantener `POINT(longitude latitude)`.
