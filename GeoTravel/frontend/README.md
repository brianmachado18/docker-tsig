# GeoTravel Frontend

Frontend de GeoTravel GIS construido con React, Vite, Tailwind CSS, Zustand y OpenLayers. Corre dentro del stack Docker del proyecto como servicio `frontend` y consume:

- Backend REST para ABM y autenticacion.
- GeoServer para visualizacion y lectura geoespacial por WMS/WFS.
- PostgreSQL/PostGIS de forma indirecta, a traves del backend y GeoServer.

La regla de arquitectura actual es: el backend mantiene el ABM y la persistencia; GeoServer publica capas geoespaciales; el frontend no escribe directo en GeoServer ni usa WFS-T.

## Requisitos

- Docker + Docker Compose.
- Repositorio clonado localmente.
- Archivo `.env` en la raiz `GeoTravel/`, creado desde `.env.example` cuando corresponda.

## Ejecucion con Docker

Desde la raiz del proyecto:

```bash
cd GeoTravel
docker compose up
```

Para levantar solo el frontend usando los servicios ya disponibles:

```bash
docker compose up frontend
```

Puertos por defecto:

| Servicio | URL |
| --- | --- |
| Frontend Vite | `http://localhost:5173` |
| Backend Spring Boot | `http://localhost:8080` |
| GeoServer | `http://localhost:8081/geoserver` |
| Tomcat | `http://localhost:8082` |
| PostgreSQL/PostGIS | `localhost:5433` |

El servicio `frontend` en `docker-compose.yml` usa `node:22-alpine`, monta `./frontend` en `/app` y ejecuta:

```bash
npm install && npm run dev -- --host 0.0.0.0 --port 5173
```

Esto habilita hot reload sobre la carpeta local.

## Desarrollo local sin Docker

Usar este modo solo si backend y GeoServer estan accesibles desde el host.

```bash
cd GeoTravel/frontend
npm install
npm run dev
```

Scripts disponibles:

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor Vite de desarrollo. |
| `npm run build` | Build de produccion en `dist/`. |
| `npm run preview` | Sirve localmente el build generado. |

No hay scripts declarados de test, lint o format.

## Variables de entorno

El frontend lee variables `VITE_*` desde el entorno Docker/Vite:

| Variable | Default en codigo/compose | Uso |
| --- | --- | --- |
| `VITE_API_URL` | `/tsig-backend` | Base path para REST backend. |
| `VITE_GEOSERVER_URL` | `/geoserver` | Base path para WMS/WFS. |
| `VITE_GEOSERVER_WORKSPACE` | `geotravel` | Workspace GeoServer esperado. |
| `VITE_API_PROXY_TARGET` | `http://tomcat:8080` | Target del proxy Vite para `/tsig-backend`. |
| `VITE_GEOSERVER_PROXY_TARGET` | `http://geoserver:8080` | Target del proxy Vite para `/geoserver`. |

La configuracion runtime esta en `src/shared/config/env.js` y los proxys Vite en `vite.config.js`.

## Stack frontend

- React + React DOM.
- React Router DOM para rutas SPA.
- Zustand para estado por dominio.
- OpenLayers para mapa, capas, dibujo, seleccion y edicion.
- Tailwind CSS 4 con `@tailwindcss/vite`.
- Alias `@` apuntando a `src`.

## Estructura principal

```text
frontend/
  src/
    app/                 # App shell y rutas SPA
    pages/               # Pantallas de composicion
    features/
      auth/              # Login, ProtectedRoute y store de autenticacion
      attractions/       # Catalogo, formulario, service y store
      zones/             # ABM de zonas turisticas
      routes/            # ABM de recorridos
      map/               # OpenLayers, capas, interacciones y servicios GeoServer
    shared/
      components/        # Sidebar, TopAppBar
      config/            # env y estrategia de capas
      i18n/              # langStore y locales en/es
      lib/               # apiClient, validaciones y helpers WKT
```

No usar paths antiguos como `src/components`, `src/store`, `src/services` o `src/locales`; la estructura vigente esta organizada por `features` y `shared`.

## Rutas de la aplicacion

| Ruta | Pantalla | Acceso |
| --- | --- | --- |
| `/guest` | `GuestPortal` | Publico |
| `/login` | `AdminLogin` | Publico |
| `/zones` | `ZoneManagement` | Protegido |
| `/routes` | `RoutePlanner` | Protegido |
| `/attractions` | `AttractionCatalog` | Protegido |
| `/attractions/map` | `AttractionMap` | Protegido |

`ProtectedRoute` valida solo estado client-side (`geotravel_auth` en `localStorage`). No hay token, roles ni expiracion.

## Mapa y GeoServer

El mapa se compone en `src/features/map/`:

- `MapCanvas.jsx` crea la instancia OpenLayers y la guarda en `mapStore`.
- `MapBaseLayer.jsx` agrega OSM como base.
- `MapOverlayLayers.jsx` agrega overlays segun `screenId`.
- `MapControls.jsx` alterna herramientas `select` y `draw`.
- `layers/` contiene capas WMS, WFS y vectoriales.
- `interactions/` contiene dibujo, seleccion y modificacion.
- `services/geoserver/` construye URLs WMS/WFS y define capas publicadas.

Estrategia vigente por pantalla:

| `screenId` | Zonas | Recorridos | Atracciones |
| --- | --- | --- | --- |
| `guestPortal` | Off | WMS | WMS |
| `zoneManagement` | WFS | Off | Off |
| `routePlanner` | Off | WFS | Off |
| `attractionMap` | Off | Off | Vector REST |

Capas GeoServer esperadas:

| Entidad | Capa |
| --- | --- |
| Zonas | `geotravel:zona_turistica` |
| Recorridos | `geotravel:recorrido` |
| Atracciones | `geotravel:atraccion_turistica` |

El CRS de intercambio es `EPSG:4326`. OpenLayers renderiza internamente en `EPSG:3857`; las interacciones convierten de vuelta a `EPSG:4326` y generan WKT para guardar por REST.

## Servicios REST

El cliente HTTP central esta en `src/shared/lib/api/apiClient.js`. Cada feature expone un service que normaliza DTOs del backend hacia modelos UI y arma DTOs para escritura:

- `features/zones/zonesService.js`
- `features/routes/routesService.js`
- `features/attractions/attractionsService.js`
- `features/auth/authService.js`

Endpoints principales:

| Dominio | Endpoints |
| --- | --- |
| Auth | `GET /usuario/login?nombre=&password=` |
| Zonas | `/zona/buscar/todos`, `/zona/alta`, `/zona/actualizar`, `/zona/eliminar?idZona=` |
| Recorridos | `/recorrido/buscar/todos`, `/recorrido/alta`, `/recorrido/actualizar`, `/recorrido/eliminar?idRecorrido=` |
| Atracciones | `/atraccion/buscar/todos`, `/atraccion/alta`, `/atraccion/actualizar`, `/atraccion/eliminar?idAtraccion=` |
| Estaciones | `/estacion/buscar/todos` |
| Recorrido-atracciones | `/recorrido-atracciones/*` |

La geometria via REST viaja como `geomWkt`.

## Flujos de ABM con mapa

- Zonas: dibujo `Polygon` sobre WFS, formulario `ZoneForm`, guardado REST.
- Recorridos: dibujo `LineString` sobre WFS, formulario `RouteForm`, guardado REST.
- Atracciones en mapa: dibujo `Point` sobre vector local desde REST, formulario `AttractionForm`, guardado REST.

Los formularios no escriben en GeoServer. Tras guardar, eliminar o cerrar, se refrescan las capas correspondientes con `useRefreshEntityLayer`.

## Comandos utiles

Desde `GeoTravel/`:

```bash
docker compose logs -f frontend
docker compose restart frontend
docker compose down
docker compose up --build frontend
```

Para reiniciar completamente datos locales y configuracion persistida:

```bash
docker compose down -v
docker compose up --build
```

Atencion: `docker compose down -v` borra volumenes de PostgreSQL y GeoServer. Si se elimina `geoserver_data`, hay que recrear workspace, datastore y capas.

## Troubleshooting

- Si el frontend no responde, revisar `docker compose logs -f frontend`.
- Si fallan llamadas REST, verificar `VITE_API_URL`, proxy `/tsig-backend` y disponibilidad de Tomcat/backend.
- Si no aparecen capas WMS/WFS, verificar `VITE_GEOSERVER_URL`, `VITE_GEOSERVER_WORKSPACE` y que GeoServer tenga publicadas las capas esperadas.
- Si el mapa no refleja cambios luego de guardar, revisar que la capa tenga `layerKey` correcto y que `useRefreshEntityLayer` incluya la entidad.

## Documentacion relacionada

- Wiki tecnica consultiva: [`../docs/project-technical-wiki.md`](../docs/project-technical-wiki.md)
- Configuracion GeoServer: [`../docs/geoserver-configuration.md`](../docs/geoserver-configuration.md)
- Flujo GeoServer/OpenLayers: [`../docs/frontend/geoserver-openlayers-flow.md`](../docs/frontend/geoserver-openlayers-flow.md)
- Arquitectura frontend: [`../docs/frontend/architecture.md`](../docs/frontend/architecture.md)
- Contratos de integracion: [`../docs/frontend/integration-contracts.md`](../docs/frontend/integration-contracts.md)
- Indice general de documentacion: [`../docs/INDEX.md`](../docs/INDEX.md)
