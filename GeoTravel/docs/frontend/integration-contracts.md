# Frontend Integration Contracts

Use this document to capture assumptions between `@GeoTravel-FE` and `@GeoTravel-GIS`.

| Integration | Frontend Expects | Owner |
|---|---|---|
| REST API | `VITE_API_URL`, JSON DTOs, stable error shape | `@GeoTravel-GIS` |
| GeoServer | `VITE_GEOSERVER_URL`, workspace/layer names, WMS/WFS availability | `@GeoTravel-GIS` |
| Geometry exchange | Explicit CRS/SRID and GeoJSON shape when applicable | Both agents |
| Mock data | Same entity names and status values as backend contracts | `@GeoTravel-FE` |

Current frontend env names:

```env
VITE_API_URL=/api
VITE_GEOSERVER_URL=/geoserver
VITE_GEOSERVER_WORKSPACE=geotravel
VITE_USE_MOCKS=false
VITE_API_PROXY_TARGET=http://backend:8080
VITE_GEOSERVER_PROXY_TARGET=http://geoserver:8080
```

## CRS/SRID Policy

- FE <-> API exchange: GeoJSON in `EPSG:4326` (WGS84 lon/lat).
- FE map render (OpenLayers): transform to `EPSG:3857`.
- Backend/PostGIS persistence and spatial queries: `EPSG:32721`.

## Current Backend Endpoints (Implemented)

- Health:
  - `GET /api/status`
- Zonas:
  - `GET /zona/buscar/todos`
  - `GET /zona/buscar/id?id=<id>`
  - `POST /zona/alta`
  - `PUT /zona/actualizar`
  - `DELETE /zona/eliminar?idZona=<id>`
- Atracciones:
  - `GET /atraccion/buscar/todos`
  - `GET /atraccion/buscar/id?id=<id>`
  - `POST /atraccion/alta`
  - `PUT /atraccion/actualizar`
  - `DELETE /atraccion/eliminar?idAtraccion=<id>`
- Recorridos:
  - `GET /recorrido/buscar/todos`
  - `GET /recorrido/buscar/id?id=<id>`
  - `POST /recorrido/alta`
  - `PUT /recorrido/actualizar`
  - `DELETE /recorrido/eliminar?idRecorrido=<id>`
- Recorrido-Atracciones:
  - `GET /recorrido-atracciones/buscar/recorrido?idRecorrido=<id>`
  - `POST /recorrido-atracciones/alta`
  - `DELETE /recorrido-atracciones/eliminar?idRecorridoAtracciones=<id>`

## Current DTO Shape (Backend Today)

- `DTZona`: `idZona`, `nombre`, `descripcion`, `nivelAtractivo`, `observaciones`, `geomWkt`, `recorridos`.
- `DTAtraccion`: `idAtraccion`, `nombre`, `descripcion`, `clasificacion`, `fotoUrl`, `geomWkt`.
- `DTRecorrido`: `idRecorrido`, `idEstacion`, `nombre`, `descripcion`, `duracionEstimada`, `guiaResponsable`, `tipoExperiencia`, `estado`, `geomWkt`, `zonas`.

Frontend services currently normalize these DTOs to FE view-model fields (e.g. `id`, `name`, `description`, `status`, `geometry`/`coordinates`) to keep UI stable during migration.

## GeoServer Naming Contract

- Workspace: `geotravel`
- Base URL: `http://localhost:8081/geoserver`
- WMS template:
  - `/geoserver/{workspace}/wms?layers={workspace}:{layer}`
- WFS template:
  - `/geoserver/{workspace}/ows?service=WFS&version=2.0.0&request=GetFeature&typeName={workspace}:{layer}&outputFormat=application/json`

## Migration Notes (Post-Merge)

- `VITE_USE_MOCKS=false` uses live API for list flows (zonas, atracciones, recorridos).
- Mocks remain available as fallback by setting `VITE_USE_MOCKS=true`.
- Canonical REST naming from spec (`/api/zones`, `/api/routes`, etc.) is still pending; FE adapters isolate this mismatch until backend contracts are converged.
