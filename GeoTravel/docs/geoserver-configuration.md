# GeoServer Configuration Wiki

This page documents the local GeoServer setup required by GeoTravel FE/GIS.

## Runtime Context

| Component | Local URL | Docker network URL |
|---|---|---|
| GeoServer | `http://localhost:8081/geoserver` | `http://geoserver:8080/geoserver` |
| PostgreSQL/PostGIS | `localhost:5433` | `postgres:5432` |
| Frontend GeoServer proxy | `/geoserver` | `http://geoserver:8080` |

Local credentials are defined in [README.md](../README.md):

| Service | User | Password |
|---|---|---|
| GeoServer | `admin` | `geoserver` |
| PostgreSQL | `tsig` | `tsig` |

## Published GeoServer Contract

The frontend expects the workspace and layer names below. Keep these names stable unless `frontend/src/services/geoserver/geoserverLayers.js` and env vars are changed in the same delivery.

| Frontend key | Published layer | Native PostGIS table | Geometry | CRS |
|---|---|---|---|---|
| `zones` | `geotravel:zona_turistica` | `public.zona` | `Polygon` | `EPSG:4326` |
| `routes` | `geotravel:recorrido` | `public.recorrido` | `LineString` | `EPSG:4326` |
| `attractions` | `geotravel:atraccion_turistica` | `public.atraccion` | `Point` | `EPSG:4326` |

Data is read from the backend-owned PostGIS tables. GeoServer is used for map publication only.

## GeoServer Objects Created

### Workspace

- Name: `geotravel`
- Namespace URI: `http://geotravel`

### Datastore

- Name: `postgis`
- Type: `PostGIS`
- Host: `postgres`
- Port: `5432`
- Database: `tsig`
- Schema: `public`
- User: `tsig`
- Password: `tsig`

Use the Docker network host `postgres`, not `localhost`, because GeoServer runs inside the Docker network.

### Feature Types

Each feature type was published with:

- `srs`: `EPSG:4326`
- `projectionPolicy`: `FORCE_DECLARED`
- `enabled`: `true`
- bbox recalculation: `nativebbox,latlonbbox`

## REST Configuration Commands

These commands reproduce the local configuration from an empty GeoServer data directory.

Create workspace:

```bash
curl -u admin:geoserver \
  -H "Content-Type: text/xml" \
  -d "<workspace><name>geotravel</name></workspace>" \
  http://localhost:8081/geoserver/rest/workspaces
```

Create PostGIS datastore:

```bash
curl -u admin:geoserver \
  -H "Content-Type: text/xml" \
  -d "<dataStore><name>postgis</name><enabled>true</enabled><connectionParameters><entry key='dbtype'>postgis</entry><entry key='host'>postgres</entry><entry key='port'>5432</entry><entry key='database'>tsig</entry><entry key='schema'>public</entry><entry key='user'>tsig</entry><entry key='passwd'>tsig</entry></connectionParameters></dataStore>" \
  http://localhost:8081/geoserver/rest/workspaces/geotravel/datastores
```

Publish zones:

```bash
curl -u admin:geoserver \
  -H "Content-Type: text/xml" \
  -d "<featureType><name>zona_turistica</name><nativeName>zona</nativeName><title>Zonas turisticas</title><abstract>Zonas turisticas publicadas desde PostGIS para render WMS en GeoTravel.</abstract><srs>EPSG:4326</srs><projectionPolicy>FORCE_DECLARED</projectionPolicy><enabled>true</enabled></featureType>" \
  "http://localhost:8081/geoserver/rest/workspaces/geotravel/datastores/postgis/featuretypes?recalculate=nativebbox,latlonbbox"
```

Publish routes:

```bash
curl -u admin:geoserver \
  -H "Content-Type: text/xml" \
  -d "<featureType><name>recorrido</name><nativeName>recorrido</nativeName><title>Recorridos</title><abstract>Recorridos turisticos publicados desde PostGIS para render WMS en GeoTravel.</abstract><srs>EPSG:4326</srs><projectionPolicy>FORCE_DECLARED</projectionPolicy><enabled>true</enabled></featureType>" \
  "http://localhost:8081/geoserver/rest/workspaces/geotravel/datastores/postgis/featuretypes?recalculate=nativebbox,latlonbbox"
```

Publish attractions:

```bash
curl -u admin:geoserver \
  -H "Content-Type: text/xml" \
  -d "<featureType><name>atraccion_turistica</name><nativeName>atraccion</nativeName><title>Atracciones turisticas</title><abstract>Atracciones turisticas publicadas desde PostGIS para render WMS en GeoTravel.</abstract><srs>EPSG:4326</srs><projectionPolicy>FORCE_DECLARED</projectionPolicy><enabled>true</enabled></featureType>" \
  "http://localhost:8081/geoserver/rest/workspaces/geotravel/datastores/postgis/featuretypes?recalculate=nativebbox,latlonbbox"
```

If rerunning against an already configured GeoServer, use `GET` first or convert the relevant calls to `PUT` to avoid duplicate-create errors.

## Validation

List published feature types:

```bash
curl -u admin:geoserver \
  http://localhost:8081/geoserver/rest/workspaces/geotravel/datastores/postgis/featuretypes.json
```

Expected layer names:

```text
atraccion_turistica
recorrido
zona_turistica
```

Validate WMS capabilities:

```bash
curl "http://localhost:8081/geoserver/geotravel/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities"
```

Validate WFS read-only access:

```bash
curl "http://localhost:8081/geoserver/geotravel/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=geotravel:zona_turistica&outputFormat=application/json&count=1"
curl "http://localhost:8081/geoserver/geotravel/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=geotravel:recorrido&outputFormat=application/json&count=1"
curl "http://localhost:8081/geoserver/geotravel/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=geotravel:atraccion_turistica&outputFormat=application/json&count=1"
```

Validated counts on the current local dataset:

| Layer | `numberMatched` |
|---|---:|
| `geotravel:zona_turistica` | 19 |
| `geotravel:recorrido` | 57 |
| `geotravel:atraccion_turistica` | 153 |

Validate WMS render output:

```bash
curl -o /tmp/geoserver_wms_zona.png \
  "http://localhost:8081/geoserver/geotravel/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=geotravel:zona_turistica&SRS=EPSG:4326&BBOX=-59,-36,-53,-30&WIDTH=800&HEIGHT=800"

curl -o /tmp/geoserver_wms_recorrido.png \
  "http://localhost:8081/geoserver/geotravel/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=geotravel:recorrido&SRS=EPSG:4326&BBOX=-59,-36,-53,-30&WIDTH=800&HEIGHT=800"

curl -o /tmp/geoserver_wms_atraccion.png \
  "http://localhost:8081/geoserver/geotravel/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=geotravel:atraccion_turistica&SRS=EPSG:4326&BBOX=-59,-36,-53,-30&WIDTH=800&HEIGHT=800"
```

The three requests should return `image/png`.

Validate the Vite frontend proxy used by the app:

```bash
curl "http://localhost:5173/geoserver/geotravel/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities"
```

The proxy should return `application/vnd.ogc.wms_xml`. The same GetMap URLs also work through `http://localhost:5173/geoserver/...` and should return `image/png`.

## Frontend Consumption

The current frontend configuration consumes the layers through:

- `VITE_GEOSERVER_URL=/geoserver`
- `VITE_GEOSERVER_WORKSPACE=geotravel`
- `frontend/src/services/geoserver/geoserverLayers.js`

WMS endpoints generated by the frontend:

```text
/geoserver/geotravel/wms?LAYERS=geotravel:zona_turistica
/geoserver/geotravel/wms?LAYERS=geotravel:recorrido
/geoserver/geotravel/wms?LAYERS=geotravel:atraccion_turistica
```

## Operational Policy

- GeoServer is the visual publication layer for WMS.
- WFS can be used read-only for inspection and future identify flows.
- WFS-T is not enabled for application writes.
- CRUD and business validation remain in the Spring/Tomcat REST backend.
- Do not point GeoServer at host `localhost` for PostGIS from inside Docker; use `postgres:5432`.
- If `docker compose down -v` is run, this GeoServer configuration is removed with the `geoserver_data` volume and must be recreated.
