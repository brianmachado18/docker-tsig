# Prompt: Consolidar GeoServer como fuente de render y REST como ABM

## Objetivo actualizado

Luego de los ultimos commits, el frontend ya tiene una primera conexion con GeoServer. Este prompt ya no debe pedir "conectar GeoServer desde cero"; debe pedir consolidar la separacion de responsabilidades:

- GeoServer/WMS como fuente de render geografico cuando la pantalla sea visual o de consulta.
- REST backend como fuente de ABM, formularios, listas administrativas y operaciones de alta, modificacion y baja.
- WFS solo read-only para identificacion o lectura de atributos cuando haga falta.
- Sin WFS-T ni escrituras directas contra GeoServer.

## Estado actual del repo

Este prompt debe ejecutarse usando `@GeoTravel-FE` y `@GeoTravel-GIS`.

Cambios ya aplicados:

- `MapCanvas.jsx` ya fue dividido y ahora orquesta:
  - `MapBaseLayer.jsx`
  - `MapOverlayLayers.jsx`
  - componentes de capa bajo `components/map/layers/`
- Existe `frontend/src/config/mapLayers.js` para decidir estrategia por pantalla.
- Existe `frontend/src/services/geoserver/` con:
  - `geoserverClient.js`
  - `geoserverLayers.js`
  - `geoserverWms.js`
  - `geoserverWfs.js`
  - `geoserverCapabilities.js`
  - `geoserverMappers.js`
- `GuestPortal` ya consume GeoServer como fuente visual principal para rutas y atracciones usando WMS.
- `ZoneManagement` conserva vector/REST como fuente principal de edicion y usa WMS de zonas como capa de soporte.
- `RoutePlanner` conserva vector/REST como fuente principal por ahora.

Contratos implementados:

- Workspace GeoServer: `geotravel` mediante `VITE_GEOSERVER_WORKSPACE`.
- Base URL: `VITE_GEOSERVER_URL`, por defecto `/geoserver`.
- Capas configuradas en `geoserverLayers.js`:
  - `zones -> geotravel:zona_turistica`
  - `routes -> geotravel:recorrido`
  - `attractions -> geotravel:atraccion_turistica`
- WMS implementado con `ImageLayer` + `ImageWMS`.
- WFS helper existe, usa `srsName=EPSG:4326` por defecto y debe mantenerse read-only.
- El ABM sigue escribiendo por servicios REST.

## Prompt de implementacion

````text
Actua como @GeoTravel-FE y coordina cualquier contrato espacial, CRS, nombres de capas o publicacion GeoServer con @GeoTravel-GIS.

Contexto:
GeoServer ya esta conectado parcialmente. No rehagas la integracion desde cero. Trabaja sobre la arquitectura actual:
- `frontend/src/components/map/MapCanvas.jsx`
- `frontend/src/components/map/MapOverlayLayers.jsx`
- `frontend/src/components/map/MapBaseLayer.jsx`
- `frontend/src/components/map/layers/*`
- `frontend/src/config/mapLayers.js`
- `frontend/src/services/geoserver/*`
- `frontend/src/store/mapStore.js`
- stores/services REST de ABM.

Objetivo:
Consolidar la separacion de responsabilidades:
- OpenLayers renderiza capas publicadas por GeoServer cuando la pantalla no requiere edicion geometrica directa.
- Las pantallas de ABM siguen usando REST backend para listas administrativas, formularios, create/update/delete y reglas de negocio.
- WFS queda reservado para lectura/identificacion de features, nunca para escritura.
- No introducir WFS-T.

Estado que debes respetar:
- `GuestPortal` ya debe seguir usando WMS para rutas y atracciones.
- `ZoneManagement` debe conservar por ahora `zones: vector-primary` para edicion de zonas y `zonesSupport: wms` como referencia visual.
- `RoutePlanner` debe conservar por ahora `routes: vector-primary`, salvo que se implemente una migracion explicita y validada.
- No quitar los vector layers que soportan edicion/admin hasta que exista reemplazo funcional equivalente.

Tareas esperadas:

1. Auditar la arquitectura actual
- Revisar `config/mapLayers.js` y confirmar que cada pantalla tenga una estrategia explicita.
- Documentar para cada pantalla si usa:
  - `wms`
  - `vector-primary`
  - capa WMS de soporte
  - ninguna capa.
- Evitar que una pantalla use REST como fuente visual principal si no necesita edicion geometrica.

2. Consolidar `services/geoserver`
- Mantener centralizados los nombres de capas en `geoserverLayers.js`.
- No duplicar nombres `zona_turistica`, `recorrido` o `atraccion_turistica` fuera de ese archivo.
- Mantener URLs y parametros WMS/WFS en `geoserverClient.js`.
- Confirmar que `buildWmsEndpoint`, `buildWfsEndpoint`, `getDefaultWmsParams` y `buildWfsUrl` usen `VITE_GEOSERVER_URL` y `VITE_GEOSERVER_WORKSPACE`.
- Confirmar con `@GeoTravel-GIS` si el `srsName` WFS debe seguir en `EPSG:4326` o cambiar por caso de uso.
- Mantener WFS read-only. No agregar WFS-T ni transacciones.

3. Mejorar el contrato de render por pantalla
- Para pantallas publicas o de consulta, preferir WMS GeoServer.
- Para pantallas administrativas con edicion geometrica, conservar vector-primary si el flujo necesita manipular geometria en OpenLayers.
- Si se agrega WMS a una pantalla admin, usarlo como soporte visual o capa de contexto, no como reemplazo silencioso del flujo editable.
- No pasar arrays REST a `MapCanvas` como fuente principal de render si la estrategia de la pantalla es `wms`.

4. Reducir acoplamiento REST -> mapa
- Donde una pantalla use WMS como render principal, eliminar dependencias innecesarias de `routes`, `attractions` o `zones` solo para pintar el mapa.
- Mantener fetch REST solo si la pantalla necesita cards, filtros, listas, formularios o datos administrativos.
- No eliminar stores REST de ABM.
- No romper flujos existentes de `save`, `delete`, `fetch` ni formularios.

5. Refresh post-ABM
- Despues de un alta, modificacion o baja REST exitosa, refrescar la capa GeoServer afectada cuando esa capa este visible.
- Implementar refresh sin recargar la pagina:
  - para WMS: actualizar params con cache-buster/timestamp;
  - para WFS read-only: limpiar/refrescar source si se usa;
  - evitar duplicar capas en el mapa.
- Centralizar el mecanismo en `mapStore`, helpers de capa o un utility claro.

6. Seleccion e identificacion
- Si el usuario debe seleccionar features renderizadas por GeoServer, usar WFS read-only o GetFeatureInfo.
- No usar listas REST como fuente de hit detection visual en pantallas WMS.
- Mapear resultados WFS con `geoserverMappers.js` o helper equivalente.
- Documentar los atributos minimos esperados por capa: id, nombre y tipo/entidad si aplica.

7. CRS y contratos GIS
- Validar con @GeoTravel-GIS el CRS real de:
  - PostGIS;
  - GeoServer;
  - WFS;
  - intercambio FE/API.
- No asumir que la documentacion vieja esta correcta si contradice el backend.
- Mantener OpenLayers renderizando en `EPSG:3857`.
- Mantener ABM REST con WKT lon/lat mientras backend no migre a GeoJSON.
- No invertir coordenadas: WKT de puntos debe ser `POINT(longitude latitude)`.

8. Documentacion
- Actualizar `docs/frontend/geoserver-openlayers-flow.md` si cambia la estrategia por pantalla.
- Actualizar `docs/frontend/integration-contracts.md` con:
  - workspace;
  - layer names reales;
  - WMS URL template;
  - WFS read-only URL template;
  - CRS confirmado;
  - REST reservado para ABM;
  - no WFS-T.
- Si cambia la responsabilidad de `MapCanvas`, `MapOverlayLayers` o `config/mapLayers.js`, actualizar `docs/frontend/architecture.md`.

Restricciones:
- No cambiar endpoints REST existentes.
- No mover reglas de negocio al frontend ni a GeoServer.
- No publicar escrituras por GeoServer.
- No introducir WFS-T.
- No eliminar vector layers necesarios para edicion geometrica.
- No romper `/guest`, `/zones`, `/routes` ni `/attractions`.
- No duplicar nombres de capas fuera de `geoserverLayers.js`.
- No hardcodear URLs absolutas que rompan Vite, nginx o Docker.

Criterios de aceptacion:
- `GuestPortal` renderiza rutas y atracciones desde WMS GeoServer.
- Las pantallas admin siguen funcionando con sus formularios y stores REST.
- `ZoneManagement` conserva edicion vectorial y muestra WMS de soporte si corresponde.
- `RoutePlanner` conserva su comportamiento actual o migra de forma explicita y documentada.
- Las estrategias de capa estan centralizadas en `config/mapLayers.js`.
- Los nombres de capas GeoServer estan centralizados en `services/geoserver/geoserverLayers.js`.
- WFS, si se usa, es read-only.
- Despues de un ABM exitoso, las capas WMS visibles pueden refrescarse sin recargar la pagina.
- La documentacion refleja que GeoServer ya esta conectado y que la migracion es incremental.
- `npm run build` pasa correctamente.

Verificacion:
- Ejecutar:
  ```bash
  npm run build
  ```
- Validar manualmente:
  - `GuestPortal` muestra rutas y atracciones desde WMS.
  - `ZoneManagement` mantiene edicion/lista/formulario de zonas.
  - `RoutePlanner` mantiene lista/formulario y render actual.
  - Cambiar layer names o workspace solo requiere tocar `services/geoserver/geoserverLayers.js` o env vars.
  - No aparecen requests REST innecesarias solo para pintar capas WMS.
````

## Riesgos y decisiones pendientes

- Confirmar con `@GeoTravel-GIS` si el CRS oficial de persistencia es `EPSG:4326` o `EPSG:32721`; la documentacion y el backend pueden no estar alineados.
- Definir si la identificacion de features WMS se resolvera con WFS read-only o `GetFeatureInfo`.
- Implementar un mecanismo explicito de refresh post-ABM para WMS visible.
- Confirmar que las capas GeoServer publicadas mantienen los nombres reales actuales:
  - `zona_turistica`
  - `recorrido`
  - `atraccion_turistica`
- Decidir si `AttractionCatalog` debe incorporar mapa/WMS en una etapa posterior o seguir siendo catalogo/lista ABM.
