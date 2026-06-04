# GeoTravel Wiki Tecnica Consultiva

Esta wiki resume la implementacion actual de GeoTravel para explicar el proyecto, orientar mantenimiento y evitar confusiones entre frontend, backend, GeoServer y PostGIS.

## Vision General

GeoTravel es una aplicacion GIS turistica con:

- Frontend React/Vite para portal publico y administracion.
- Backend Spring Boot/Tomcat para ABM, validaciones de negocio y persistencia.
- PostgreSQL/PostGIS como base geoespacial.
- GeoServer como publicador WMS/WFS sobre datos geoespaciales.
- OpenLayers como motor de mapa en el frontend.

Principio operativo vigente:

```text
Usuario -> Frontend React/OpenLayers
       -> REST Backend -> PostGIS
       -> WMS/WFS GeoServer -> PostGIS
```

El frontend no usa WFS-T. Las altas, bajas y modificaciones se envian por REST al backend. GeoServer se usa para leer/publicar capas y para que OpenLayers pueda renderizar o seleccionar geometria.

## Servicios Docker

La orquestacion principal esta en `docker-compose.yml`.

| Servicio | Contenedor | Funcion | Puerto host |
| --- | --- | --- | --- |
| `postgres` | `tsig-postgres` | PostgreSQL + PostGIS | `5433` |
| `geoserver` | `tsig-geoserver` | Publicacion WMS/WFS | `8081` |
| `backend` | `tsig-backend` | Spring Boot | `8080` |
| `frontend` | `tsig-frontend` | Vite dev server | `5173` |
| `tomcat` | `tsig-tomcat` | WAR desplegado | `8082` |

Comando recomendado:

```bash
cd GeoTravel
docker compose up --build
```

`postgres_data` y `geoserver_data` son volumenes persistentes. Si se ejecuta `docker compose down -v`, se pierden la base local y la configuracion de GeoServer.

## Configuracion de Entorno

El frontend usa `frontend/src/shared/config/env.js`:

| Variable | Proposito |
| --- | --- |
| `VITE_API_URL` | Base URL para REST backend. |
| `VITE_GEOSERVER_URL` | Base URL para GeoServer. |
| `VITE_GEOSERVER_WORKSPACE` | Workspace GeoServer. |

El servidor Vite define proxys en `frontend/vite.config.js`:

- `/tsig-backend` hacia backend/Tomcat.
- `/geoserver` hacia GeoServer.

Revisar `.env.example` contra `docker-compose.yml` cuando cambien defaults: Compose usa por defecto `/tsig-backend` para `VITE_API_URL`.

## CRS y Geometria

CRS vigente:

- PostGIS/backend/REST/GeoServer WFS: `EPSG:4326`.
- OpenLayers en pantalla: `EPSG:3857`.

Flujo de geometria:

1. El usuario dibuja o edita en OpenLayers.
2. OpenLayers mantiene geometria renderizada en `EPSG:3857`.
3. La interaccion clona la geometria y la transforma a `EPSG:4326`.
4. Se serializa como WKT (`geomWkt`).
5. El frontend envia `geomWkt` al backend por REST.
6. El backend persiste en PostGIS.
7. GeoServer publica la capa desde PostGIS.
8. El frontend refresca WMS/WFS para mostrar el cambio.

Tipos geometricos:

| Entidad | Tipo UI/OpenLayers | Tipo persistido |
| --- | --- | --- |
| Zona | `Polygon` | `geography(Polygon,4326)` |
| Recorrido | `LineString` | `geography(LineString,4326)` |
| Atraccion | `Point` | `geography(Point,4326)` |

## GeoServer

Contrato esperado por el frontend:

| Entidad | Workspace | Capa/typeName |
| --- | --- | --- |
| Zonas | `geotravel` | `zona_turistica` |
| Recorridos | `geotravel` | `recorrido` |
| Atracciones | `geotravel` | `atraccion_turistica` |

Archivos relevantes:

- `frontend/src/features/map/services/geoserver/geoserverLayers.js`
- `frontend/src/features/map/services/geoserver/geoserverClient.js`
- `frontend/src/features/map/services/geoserver/geoserverWms.js`
- `frontend/src/features/map/services/geoserver/geoserverWfs.js`
- `docs/geoserver-configuration.md`

GeoServer no se configura automaticamente desde el frontend. Si se recrea el volumen `geoserver_data`, se debe restaurar manualmente workspace, datastore PostGIS, capas y estilos.

## Frontend

Estructura vigente:

```text
frontend/src/
  app/        # App y router
  pages/      # pantallas
  features/   # dominios funcionales
  shared/     # componentes, config, i18n y helpers
```

Dominios principales:

| Dominio | Store | Service | Form/Componentes |
| --- | --- | --- | --- |
| Auth | `features/auth/authStore.js` | `features/auth/authService.js` | `AdminLoginForm`, `ProtectedRoute` |
| Zonas | `features/zones/zonesStore.js` | `features/zones/zonesService.js` | `ZoneForm` |
| Recorridos | `features/routes/routesStore.js` | `features/routes/routesService.js` | `RouteForm` |
| Atracciones | `features/attractions/attractionsStore.js` | `features/attractions/attractionsService.js` | `AttractionForm`, `AttractionCard` |
| Mapa | `features/map/mapStore.js` | `features/map/services/geoserver/*` | `MapCanvas`, capas, interacciones |

Patron de estado por dominio:

- Lista de entidades.
- Entidad seleccionada.
- Apertura/cierre de formulario.
- Estados `isLoading`, `isSaving`, `isDeleting`.
- Error de API.
- Acciones `fetch*`, `save*`, `delete*`.

Los services transforman DTOs backend a modelos de UI y vuelven a armar DTOs para persistir.

## Rutas SPA

Definidas en `frontend/src/app/routes.jsx`.

| Ruta | Pagina | Acceso |
| --- | --- | --- |
| `/` | redirect a `/guest` | Publico |
| `/guest` | `GuestPortal` | Publico |
| `/login` | `AdminLogin` | Publico |
| `/zones` | `ZoneManagement` | Protegido |
| `/routes` | `RoutePlanner` | Protegido |
| `/attractions` | `AttractionCatalog` | Protegido |
| `/attractions/map` | `AttractionMap` | Protegido |

La autenticacion actual es client-side: `authStore` persiste `geotravel_auth=true/false` en `localStorage`. No hay token JWT, roles, refresh token ni interceptor HTTP.

## OpenLayers

Componentes base:

- `MapCanvas.jsx`: crea `ol/Map`, `ol/View`, registra instancia en `mapStore`.
- `MapBaseLayer.jsx`: agrega OSM.
- `MapOverlayLayers.jsx`: monta overlays por estrategia.
- `MapControls.jsx`: botones de herramienta `select` y `draw`.
- `mapStore.js`: estado global del mapa, viewport, herramienta activa y refresh.

Estrategias en `frontend/src/shared/config/mapLayers.js`:

| Pantalla | `screenId` | Estrategia |
| --- | --- | --- |
| Portal publico | `guestPortal` | Recorridos WMS, atracciones WMS |
| Gestion de zonas | `zoneManagement` | Zonas WFS |
| Planificador de recorridos | `routePlanner` | Recorridos WFS |
| Mapa de atracciones | `attractionMap` | Atracciones vector desde REST |

Convenciones de capas:

- `layerKey`: identificador tecnico usado para refrescar.
- `entityKey`: entidad funcional (`zones`, `routes`, `attractions`).
- `sourceType`: origen (`wfs`, `vector`, etc.).
- `source.get('reload')`: funcion opcional para recargar fuentes WFS/vector.

`useRefreshEntityLayer` mapea entidades a capas:

| Entidad | Capas refrescables |
| --- | --- |
| `zones` | `zones-wfs`, `zones-wms` |
| `routes` | `routes-wfs`, `routes-wms` |
| `attractions` | `attractions-vector`, `attractions-wms` |

## Interacciones de Mapa

Archivos:

- `features/map/interactions/ZoneMapInteractions.jsx`
- `features/map/interactions/RouteMapInteractions.jsx`
- `features/map/interactions/AttractionMapInteractions.jsx`

Flujo comun:

1. La pagina monta `MapCanvas`.
2. La pagina monta la interaccion correspondiente.
3. `MapControls` define `activeTool`.
4. En `draw`, OpenLayers crea una feature draft.
5. Se extrae geometria y se abre el form con datos derivados.
6. En `select`, se selecciona feature existente y se abre el form.
7. En `modify`, se recalcula geometria y se reabre el form con `geomWkt` actualizado.

No debe existir un boton alternativo de alta para entidades geograficas si el flujo esperado es dibujo en mapa. El alta nace desde la herramienta `draw`.

## Capas: WMS, WFS y Vector

| Tipo | Uso | Escritura |
| --- | --- | --- |
| WMS | Visualizacion rapida, portal publico | No editable desde frontend |
| WFS | Lectura de features para seleccionar/editar localmente | Persistencia via REST backend |
| Vector local | Features construidas desde REST/Zustand | Persistencia via REST backend |

Capas WFS actuales:

- `ZonesWfsLayer.jsx`
- `RoutesWfsLayer.jsx`

Capas WMS actuales:

- `ZonesWmsLayer.jsx`
- `RoutesWmsLayer.jsx`
- `AttractionsWmsLayer.jsx`

Capas vectoriales locales:

- `ZonesVectorLayer.jsx`
- `RoutesVectorLayer.jsx`
- `AttractionsVectorLayer.jsx`

## Backend REST Consumido por Frontend

Cliente comun:

- `frontend/src/shared/lib/api/apiClient.js`

Endpoints principales:

| Dominio | Lectura | Escritura |
| --- | --- | --- |
| Auth | `/usuario/login?nombre=&password=` | N/A |
| Zonas | `/zona/buscar/todos` | `/zona/alta`, `/zona/actualizar`, `/zona/eliminar?idZona=` |
| Recorridos | `/recorrido/buscar/todos` | `/recorrido/alta`, `/recorrido/actualizar`, `/recorrido/eliminar?idRecorrido=` |
| Atracciones | `/atraccion/buscar/todos` | `/atraccion/alta`, `/atraccion/actualizar`, `/atraccion/eliminar?idAtraccion=` |
| Estaciones | `/estacion/buscar/todos` | N/A |
| Recorrido-atracciones | `/recorrido-atracciones/buscar/recorrido?idRecorrido=` | `/recorrido-atracciones/alta`, `/recorrido-atracciones/eliminar?idRecorridoAtracciones=` |

Normalizaciones importantes:

- Zonas: `idZona`, `nombre`, `descripcion`, `nivelAtractivo`, `observaciones`, `geomWkt`.
- Recorridos: `idRecorrido`, `idEstacion`, `nombre`, `descripcion`, `duracionEstimada`, `guiaResponsable`, `tipoExperiencia`, `estado`, `geomWkt`.
- Atracciones: `idAtraccion`, `nombre`, `descripcion`, `clasificacion`, `fotoUrl`, `geomWkt`.

## Formularios y Validacion

Los formularios viven dentro de cada feature y reciben una entidad seleccionada:

- `ZoneForm` valida nombre, descripcion, nivel atractivo y geometria.
- `RouteForm` valida nombre, descripcion, estacion, duracion, guia y geometria.
- `AttractionForm` valida nombre, descripcion, categoria y coordenadas/geometria.

La geometria no se muestra como campo tecnico al usuario. Se deriva del mapa y se conserva internamente para guardar.

Helpers:

- `shared/lib/forms/validation.js`
- `shared/lib/geo/wkt.js`

## i18n

Archivos:

- `shared/i18n/langStore.js`
- `shared/i18n/locales/es.json`
- `shared/i18n/locales/en.json`

El idioma se persiste en `localStorage` con clave `geotravel_lang`. Hay textos hardcodeados pendientes en formularios, validaciones e interacciones; al tocar UI conviene migrarlos progresivamente a locales.

## Estilos y UI

- `src/styles.css` contiene estilos globales, tokens CSS y utilidades.
- `tailwind.config.js` existe, aunque parte de los tokens esta duplicada con CSS.
- Componentes compartidos principales: `Sidebar` y `TopAppBar`.
- La UI administrativa usa layout con sidebar fijo y mapa como superficie principal.

## Como Agregar una Nueva Entidad Geografica

1. Definir contrato backend y DTO con `geomWkt`.
2. Crear `feature/<entidad>/` con service, store, form y validacion.
3. Si requiere mapa editable, crear layer WFS o vector local.
4. Crear interaction con tipo geometrico correcto.
5. Registrar estrategia en `shared/config/mapLayers.js`.
6. Agregar `layerKey` a `useRefreshEntityLayer`.
7. Crear o actualizar pagina en `pages/`.
8. Agregar ruta en `app/routes.jsx`.
9. Agregar textos en `locales/es.json` y `locales/en.json`.
10. Documentar capa GeoServer esperada.

## Troubleshooting

Frontend sin respuesta:

```bash
docker compose logs -f frontend
docker compose restart frontend
```

Backend o Tomcat inaccesible:

```bash
docker compose logs -f backend
docker compose logs -f tomcat
```

GeoServer sin capas:

- Revisar `http://localhost:8081/geoserver`.
- Verificar workspace `geotravel`.
- Verificar datastore PostGIS.
- Verificar capas `zona_turistica`, `recorrido`, `atraccion_turistica`.
- Si se uso `docker compose down -v`, recrear configuracion.

Capas no refrescan luego de guardar:

- Revisar `layerKey` en la capa.
- Revisar `useRefreshEntityLayer`.
- Revisar que el source tenga `reload`, `updateParams` o `refresh`.
- Revisar que el backend haya persistido el cambio.

Geometria incorrecta:

- Confirmar que el WKT generado este en `EPSG:4326`.
- Confirmar que OpenLayers transforme `EPSG:3857 -> EPSG:4326` antes de guardar.
- Confirmar tipo geometrico esperado por entidad.

## Limitaciones Actuales

- No hay WFS-T.
- No hay automatizacion completa de configuracion GeoServer.
- Auth admin es client-side con booleano en `localStorage`.
- No hay scripts de test/lint/format en `package.json`.
- Hay textos hardcodeados pendientes de i18n.
- Algunos documentos historicos pueden mencionar `EPSG:32721` o estrategias WMS antiguas para pantallas que hoy usan WFS.

## Referencias Internas

- `frontend/README.md`
- `docs/geoserver-configuration.md`
- `docs/frontend/geoserver-openlayers-flow.md`
- `docs/frontend/integration-contracts.md`
- `docs/frontend/architecture.md`
- `docs/frontend/quick-reference.md`
- `docs/INDEX.md`
