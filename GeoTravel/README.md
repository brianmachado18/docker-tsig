# GeoTravel

GeoTravel es una SPA GIS turistica para administrar y consultar zonas, recorridos y atracciones sobre Uruguay.

Stack principal:

- PostgreSQL + PostGIS
- Spring Boot 3 / Java 21 desplegado en Tomcat
- GeoServer
- React + Vite + Zustand + OpenLayers
- Docker Compose

## Requisitos

- Docker Desktop
- Git
- Node.js 22 si se ejecuta el frontend fuera de Docker
- IntelliJ IDEA u otro IDE Java si se ejecuta el backend fuera de Docker

## Configuracion

Crear el archivo local de entorno:

```bash
cp .env.example .env
```

Revisar los puertos y credenciales en `.env` antes de levantar el stack. El archivo `.env` es local y no se versiona.

## Levantar Todo

Desde `GeoTravel/`:

```bash
docker compose up --build
```

Servicios principales:

- `postgres`: base PostGIS.
- `tomcat`: backend Spring Boot empaquetado para Tomcat.
- `geoserver`: publicacion WMS/WFS read-only.
- `data-loader`: carga `postgres/data/data.sql`.
- `geoserver-config`: crea workspace/datastore/capas GeoServer.
- `frontend`: Vite con proxy a Tomcat y GeoServer.

## URLs Locales

- Frontend: http://localhost:5173
- Portal publico: http://localhost:5173/guest
- Gestion de zonas: http://localhost:5173/zones
- Gestion de recorridos: http://localhost:5173/routes
- Atracciones: http://localhost:5173/attractions
- Mapa de atracciones: http://localhost:5173/attractions/map
- Backend status: http://localhost:8082/tsig-backend/api/status
- Spring health: http://localhost:8082/tsig-backend/actuator/health
- GeoServer: http://localhost:8081/geoserver
- PostgreSQL host: `localhost:5433`

## Credenciales Locales

PostgreSQL:

- Base: `tsig`
- Usuario: `tsig`
- Password: `tsig`

GeoServer:

- Usuario: `admin`
- Password: `geoserver`

Login admin de prueba:

- Usuario: `admin`
- Password: `admin`

## Arquitectura Frontend

El frontend vive en `frontend/src` y usa imports con alias `@`.

Estructura vigente:

```text
frontend/src/
├── app/                 # bootstrap y rutas React Router
├── pages/               # composicion de pantallas
├── features/
│   ├── attractions/     # atracciones, formularios, store y servicio
│   ├── auth/            # login y rutas protegidas
│   ├── map/             # OpenLayers, capas, interacciones y GeoServer client
│   ├── routes/          # recorridos, planner, store y servicio
│   └── zones/           # zonas, consultas, paneles, store y servicio
└── shared/
    ├── components/
    ├── config/
    ├── i18n/
    └── lib/
```

No crear codigo nuevo en las carpetas historicas `src/components`, `src/services`, `src/store`, `src/config` o `src/locales`.

## Estrategias De Mapa

La fuente de verdad es `frontend/src/shared/config/mapLayers.js`.

Estado actual:

| Pantalla | `screenId` | Capas |
|---|---|---|
| Portal publico | `guestPortal` | `zones`, `routes`, `attractions` como `vector-primary` |
| Gestion de zonas | `zoneManagement` | `zones`, `routes` como `vector-primary` |
| Planificador de recorridos | `routePlanner` | `routes` por WFS |
| Mapa de atracciones | `attractionMap` | `attractions` como `vector-primary` |
| Catalogo de atracciones | `attractionCatalog` | `attractions` como `vector-primary` |

GeoServer es read-only para el frontend. Altas, bajas y modificaciones pasan por REST.

## Contratos GIS

- OpenLayers renderiza en `EPSG:3857`.
- Frontend, backend y GeoServer intercambian geometria en `EPSG:4326`.
- PostGIS usa columnas:
  - `atraccion.geom_wkt`: `geometry(Point,4326)`
  - `recorrido.geom_wkt`: `geometry(LineString,4326)`
  - `zona.geom_wkt`: `geometry(Polygon,4326)`
- Las zonas pueden venir desde GeoServer/WFS sin relaciones `routeIds` o `attractionIds`.
- La UI usa IDs relacionales cuando existen y fallback espacial cuando no:
  - atracciones por zona: punto dentro/intersectando el poligono.
  - recorridos por zona: linea que intersecta/cruza el poligono.

## Endpoints Principales

El frontend consume los endpoints del backend en espanol:

- Zonas: `/zona/buscar/todos`, `/zona/buscar/porDireccion`, `/zona/alta`, `/zona/actualizar`, `/zona/eliminar`
- Atracciones: `/atraccion/buscar/todos`, `/atraccion/alta`, `/atraccion/actualizar`, `/atraccion/eliminar`
- Recorridos: `/recorrido/buscar/todos`, `/recorrido/buscar/porZona`, `/recorrido/buscar/porInterseccion`, `/recorrido/buscar/porPunto`, `/recorrido/buscar/sugerenciasCalles`, `/recorrido/buscar/sugerenciasCruces`, `/recorrido/alta`, `/recorrido/actualizar`, `/recorrido/eliminar`
- Historico: `/historico/buscar/porRecorrido`

El backend usa IDE Uruguay para geocoding y sugerencias de calles/cruces.

## Desarrollo Frontend Fuera De Docker

Desde `GeoTravel/frontend`:

```bash
npm install
npm run dev
```

Si el puerto `5173` esta ocupado, Vite usara otro puerto y lo mostrara en consola.

Para validar cambios frontend:

```bash
npm run build
```

## Backend En IntelliJ

Abrir `GeoTravel/backend` como proyecto Maven, o abrir la raiz y marcar `backend` como modulo.

Variables utiles si se ejecuta Spring fuera de Docker:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/tsig
SPRING_DATASOURCE_USERNAME=tsig
SPRING_DATASOURCE_PASSWORD=tsig
GEOSERVER_URL=http://localhost:8081/geoserver
GEOCODING_IDE_BASE_URL=https://direcciones.ide.uy
```

## Datos Locales

PostgreSQL ejecuta automaticamente `postgres/init/` al crear el volumen por primera vez. Luego `data-loader` carga:

```text
postgres/data/data.sql
```

Ese dataset incluye usuario admin, atracciones, zonas, recorridos, relaciones zona-recorrido y paradas ordenadas de recorridos.

Para reiniciar base y GeoServer desde cero:

```bash
docker compose down -v
docker compose up --build
```

Importante: `docker compose down -v` borra los datos locales persistidos.

## GeoServer

`geoserver-config` configura workspace, datastore PostGIS y capas publicadas. La documentacion detallada esta en:

```text
docs/geoserver-configuration.md
```

No usar WFS-T ni escribir directamente contra GeoServer.
