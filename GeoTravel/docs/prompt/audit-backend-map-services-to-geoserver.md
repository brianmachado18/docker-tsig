# Prompt: Auditar servicios REST usados como render de mapa y migrarlos a GeoServer

## Objetivo

Identificar las pantallas y servicios del frontend que hoy consumen datos directamente desde el backend REST para renderizar geometria en `MapCanvas`, y definir cuales deben pasar a consumir GeoServer como fuente visual principal.

Este prompt toma como fuente `docs/prompt/separate-map-geoserver-from-backend-abm.md` y debe ejecutarse usando `@GeoTravel-FE` con coordinacion de contratos espaciales, CRS, nombres de capas y publicacion GeoServer con `@GeoTravel-GIS`.

## Contexto

GeoServer ya esta conectado parcialmente en el frontend. No rehacer la integracion desde cero. Trabajar sobre:

- `frontend/src/components/map/MapCanvas.jsx`
- `frontend/src/components/map/MapOverlayLayers.jsx`
- `frontend/src/components/map/layers/*`
- `frontend/src/config/mapLayers.js`
- `frontend/src/services/geoserver/*`
- `frontend/src/store/*`
- `frontend/src/services/*`
- `frontend/src/pages/GuestPortal.jsx`
- `frontend/src/pages/ZoneManagement.jsx`
- `frontend/src/pages/RoutePlanner.jsx`

Separacion esperada:

- GeoServer/WMS como fuente principal para render geografico de consulta o visualizacion.
- REST backend como fuente para ABM, formularios, listas administrativas, validaciones y operaciones create/update/delete.
- WFS o GetFeatureInfo solo para lectura/identificacion de features si hace falta.
- Sin WFS-T ni escrituras directas contra GeoServer.

## Estado actual que debes auditar

Pantallas relevantes:

- `GuestPortal.jsx`
  - Llama `fetchRoutes()` desde `routesStore`.
  - Llama `fetchAttractions()` desde `attractionsStore`.
  - Pasa `routes` y `attractions` a `MapCanvas`.
  - En `config/mapLayers.js`, `guestPortal` esta configurado con:
    - `routes: 'wms'`
    - `attractions: 'wms'`
    - `zones: 'off'`
  - Resultado esperado: el mapa debe renderizar desde GeoServer WMS, no desde arrays REST.

- `ZoneManagement.jsx`
  - Llama `fetchZones()` desde `zonesStore`.
  - `zonesStore` usa `zonesService.list()`.
  - `zonesService.list()` consume backend REST `/zona/buscar/todos`.
  - Pasa `zones={zones}` a `MapCanvas`.
  - En `config/mapLayers.js`, `zoneManagement` esta configurado con:
    - `zones: 'vector-primary'`
    - `zonesSupport: 'wms'`
  - Problema a analizar: hoy el render principal de zonas sale del backend REST/vector. Determinar si debe migrarse a GeoServer WMS como fuente visual y conservar REST solo para ABM.

- `RoutePlanner.jsx`
  - Llama `fetchRoutes()` desde `routesStore`.
  - `routesStore` usa `routesService.list()`.
  - `routesService.list()` consume backend REST `/recorrido/buscar/todos`.
  - Pasa `routes={routes}` a `MapCanvas`.
  - En `config/mapLayers.js`, `routePlanner` esta configurado con:
    - `routes: 'vector-primary'`
  - Problema a analizar: hoy el render principal de recorridos sale del backend REST/vector. Determinar si debe migrarse a GeoServer WMS como fuente visual y conservar REST solo para ABM.

Servicios REST directos involucrados:

- `frontend/src/services/zonesService.js`
  - `list()` -> `/zona/buscar/todos`
  - Uso actual: lista/formulario ABM y fuente vectorial de mapa en `ZoneManagement`.

- `frontend/src/services/routesService.js`
  - `list()` -> `/recorrido/buscar/todos`
  - Uso actual: lista/formulario ABM y fuente vectorial de mapa en `RoutePlanner`; tambien alimenta cards/filtros en `GuestPortal`.

- `frontend/src/services/attractionsService.js`
  - `list()` -> `/atraccion/buscar/todos`
  - Uso actual: datos de portal/catalogo/ABM; en `GuestPortal` el mapa debe usar WMS, no este array.

Capas GeoServer existentes:

- `zones -> geotravel:zona_turistica`
- `routes -> geotravel:recorrido`
- `attractions -> geotravel:atraccion_turistica`

## Prompt de implementacion

```text
Actua como @GeoTravel-FE y coordina con @GeoTravel-GIS cualquier definicion de CRS, layer name, workspace GeoServer, WMS, WFS read-only o GetFeatureInfo.

Objetivo:
Auditar y corregir el acoplamiento entre backend REST y render geografico en `MapCanvas`. Identificar todos los servicios REST que se estan usando como fuente visual del mapa y proponer o implementar su migracion a GeoServer WMS cuando la pantalla no requiera edicion geometrica directa.

No conectes GeoServer desde cero. Usa la arquitectura existente:
- `frontend/src/config/mapLayers.js`
- `frontend/src/components/map/MapOverlayLayers.jsx`
- `frontend/src/components/map/layers/*`
- `frontend/src/services/geoserver/*`
- stores y services REST actuales.

Tareas:

1. Auditar fuentes de render por pantalla
- Revisar `GuestPortal.jsx`, `ZoneManagement.jsx`, `RoutePlanner.jsx` y cualquier otra pantalla que use `MapCanvas`.
- Para cada pantalla, documentar:
  - `screenId`;
  - props enviados a `MapCanvas`;
  - estrategia en `config/mapLayers.js`;
  - capa real renderizada por `MapOverlayLayers`;
  - servicio REST o GeoServer usado como fuente visual;
  - si el consumo REST es necesario para ABM/listado/formulario o solo para pintar mapa.

2. Identificar servicios REST que no deberian pintar el mapa
- Detectar usos de:
  - `zonesService.list()` -> `/zona/buscar/todos`
  - `routesService.list()` -> `/recorrido/buscar/todos`
  - `attractionsService.list()` -> `/atraccion/buscar/todos`
- Marcar como problema cualquier uso donde esos datos se pasen a `MapCanvas` solo para render geografico cuando exista capa GeoServer equivalente.
- Mantener esos servicios REST cuando alimenten:
  - formularios;
  - listados administrativos;
  - cards;
  - filtros no espaciales;
  - operaciones de alta, modificacion o baja;
  - reglas de negocio.

3. Revisar casos concretos
- `GuestPortal`:
  - Confirmar que `routes` y `attractions` visuales salen de WMS GeoServer.
  - Si los arrays REST solo se usan para cards/filtros, mantenerlos para UI, pero no tratarlos como fuente de render.
  - Evitar pasar datos REST a `MapCanvas` si la estrategia es WMS y no se usan visualmente.

- `ZoneManagement`:
  - Actualmente usa `zones: vector-primary` y `zonesSupport: wms`.
  - Evaluar si la geometria editable exige mantener `vector-primary`.
  - Si no hay edicion geometrica directa en el mapa, migrar el render principal a `zones: 'wms'`.
  - Si se conserva `vector-primary` por ABM, documentar claramente que REST es fuente editable/admin y WMS es soporte/contexto.
  - No eliminar REST de ABM.

- `RoutePlanner`:
  - Actualmente usa `routes: vector-primary`.
  - Evaluar si el planificador requiere edicion geometrica directa en mapa.
  - Si no requiere edicion geometrica directa, migrar el render principal a `routes: 'wms'`.
  - Mantener `routesService.list()` para lista/formulario, pero no como fuente visual principal.
  - Si se conserva `vector-primary`, justificarlo por necesidad funcional concreta.

4. Consolidar `config/mapLayers.js`
- Definir explicitamente la estrategia de cada pantalla.
- Preferir:
  - pantallas publicas/consulta: `wms`;
  - pantallas admin sin edicion geometrica directa: `wms` + REST para ABM;
  - pantallas admin con edicion geometrica directa: `vector-primary` y opcional WMS de soporte.
- Evitar estados ambiguos donde una pantalla carga REST para mapa pero tambien tiene WMS equivalente sin criterio claro.

5. Consolidar GeoServer como fuente visual
- Usar `services/geoserver/geoserverLayers.js` como unico lugar para nombres:
  - `zona_turistica`
  - `recorrido`
  - `atraccion_turistica`
- No hardcodear nombres de capas en componentes.
- No duplicar URLs ni workspace fuera de `services/geoserver`.
- Confirmar con @GeoTravel-GIS que las capas publicadas corresponden a las entidades REST equivalentes.

6. Refresh post-ABM
- Si una pantalla guarda, actualiza o elimina por REST y tiene una capa WMS visible, refrescar la capa WMS afectada sin recargar la pagina.
- Para WMS, actualizar parametros con cache-buster/timestamp.
- Evitar duplicar capas al refrescar.
- Centralizar el mecanismo en `mapStore`, un helper de capas o utility compartido.

7. Identificacion y seleccion
- Si una pantalla WMS necesita seleccionar una feature del mapa, no usar el array REST como sustituto de hit detection.
- Usar WFS read-only o GetFeatureInfo.
- Mapear atributos con `geoserverMappers.js` o helper equivalente.
- No implementar WFS-T.

8. Documentacion
- Actualizar documentacion si cambia alguna estrategia:
  - `docs/frontend/geoserver-openlayers-flow.md`
  - `docs/frontend/integration-contracts.md`
  - `docs/frontend/architecture.md` si cambia responsabilidad de `MapCanvas`, `MapOverlayLayers` o `mapLayers`.
- Documentar expresamente que REST queda para ABM y GeoServer para render geografico.

Restricciones:
- No cambiar endpoints REST existentes.
- No eliminar stores REST.
- No romper ABM de zonas, recorridos ni atracciones.
- No introducir WFS-T.
- No escribir contra GeoServer.
- No hardcodear URLs absolutas.
- No duplicar nombres de capas fuera de `geoserverLayers.js`.
- No romper `/guest`, `/zones`, `/routes` ni `/attractions`.

Criterios de aceptacion:
- Hay una auditoria clara de que servicios REST se consumen y si son ABM o render.
- `GuestPortal` queda confirmado como render WMS para rutas y atracciones.
- `ZoneManagement` queda migrado a WMS como render principal o justificado como `vector-primary` por edicion geometrica/admin.
- `RoutePlanner` queda migrado a WMS como render principal o justificado como `vector-primary` por edicion geometrica/admin.
- Los servicios `/zona/buscar/todos`, `/recorrido/buscar/todos` y `/atraccion/buscar/todos` no se usan como fuente visual principal cuando existe WMS equivalente y no hay edicion directa.
- Las estrategias quedan centralizadas en `config/mapLayers.js`.
- Los nombres GeoServer quedan centralizados en `services/geoserver/geoserverLayers.js`.
- WFS, si se usa, es read-only.
- `npm run build` pasa correctamente.

Verificacion:
- Ejecutar `npm run build`.
- Validar manualmente:
  - `/guest` renderiza rutas y atracciones desde GeoServer WMS.
  - `/zones` no depende de `/zona/buscar/todos` solo para pintar mapa, salvo justificacion de edicion vectorial.
  - `/routes` no depende de `/recorrido/buscar/todos` solo para pintar mapa, salvo justificacion de edicion vectorial.
  - ABM/listas/formularios siguen funcionando por REST.
  - Cambiar workspace o layer names solo requiere tocar env vars o `geoserverLayers.js`.
```

## Resultado esperado

El resultado debe entregar:

- Una lista de consumos REST directos actuales y su proposito.
- Una clasificacion por pantalla: `WMS`, `vector-primary`, `WMS soporte`, o `REST solo ABM`.
- Los cambios necesarios en `config/mapLayers.js` y capas relacionadas, si corresponde.
- Una explicacion clara de que servicios quedan para ABM y cuales pasan a GeoServer para render.
- La validacion de build.

