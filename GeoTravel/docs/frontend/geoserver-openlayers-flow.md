# GeoServer + OpenLayers: simple team explanation

## Why we added this

We needed to connect the frontend map to GeoServer without breaking the current admin flows.

The project separates responsibilities clearly:

- **OpenLayers** draws and manages the map in the browser.
- **GeoServer** publishes ready-to-consume map layers.
- **Spring REST backend** remains the source of truth for CRUD and business rules.

This means we can show published GIS layers in the map, but we do not move business logic or writes into GeoServer.

## The simple mental model

- **OpenLayers** = the map engine.
- **GeoServer** = the map image/data server.
- **Backend REST** = the application source of truth.

So:

- visualize published layers through GeoServer;
- create, edit or delete business data through the backend.

## Current frontend structure

The map code now lives under `features/map/`:

```text
frontend/src/features/map/
├── MapCanvas.jsx
├── MapBaseLayer.jsx
├── MapControls.jsx
├── MapOverlayLayers.jsx
├── interactions/
├── layers/
├── services/geoserver/
├── mapStore.js
└── useRefreshEntityLayer.js
```

Supporting shared code:

- `frontend/src/shared/config/mapLayers.js`: strategy per screen.
- `frontend/src/shared/config/env.js`: runtime URLs and workspace.
- `frontend/src/shared/lib/geo/wkt.js`: WKT helpers.
- `frontend/src/shared/lib/api/apiClient.js`: REST client.

## Current flow by screen

### GuestPortal

GuestPortal consumes GeoServer as visual source:

- routes through WMS;
- attractions through WMS;
- local state can still support cards, filters and side content.

Simple idea:

`GuestPortal -> MapCanvas -> OpenLayers -> GeoServer WMS`

### ZoneManagement

ZoneManagement uses GeoServer WFS read-only as the editable local source for zones:

- zones are loaded through WFS;
- draw/modify happens locally in OpenLayers;
- zone CRUD still goes through REST backend;
- cancel/close reloads `zones-wfs` to discard unpersisted geometry changes.

Simple idea:

`ZoneManagement -> MapCanvas -> ZonesWfsLayer -> OpenLayers -> REST on save`

### RoutePlanner

RoutePlanner uses GeoServer as the visual source for routes:

- routes are shown through WMS;
- route list, form, save and delete continue through REST backend;
- after route ABM, visible map layers are refreshed from the frontend.

Simple idea:

`RoutePlanner -> MapCanvas -> OpenLayers -> GeoServer WMS`

### AttractionMap

AttractionMap uses a vector layer fed by REST state:

- attraction points are built from `attractionsStore`;
- draw/modify happens locally in OpenLayers;
- saving goes through REST;
- cancel/close rebuilds `attractions-vector` from stored coordinates to discard local moves.

Simple idea:

`AttractionMap -> MapCanvas -> AttractionsVectorLayer -> Zustand/REST`

## CRS explained simply

We are not using the same CRS everywhere:

- **OpenLayers render**: `EPSG:3857`.
- **Frontend/API exchange**: `EPSG:4326`, unless a specific contract says otherwise.
- **Database/PostGIS**: `EPSG:32721`.

Practical rule:

1. Read map geometry in `EPSG:3857`.
2. Transform to `EPSG:4326` before filling forms or REST DTOs.
3. Let backend/GIS transform to the persistence SRID when needed.

## End-to-end flow

### To visualize data

`User -> React/OpenLayers -> GeoServer WMS/WFS -> rendered map layer`

### To save business data

`User -> React form/store -> Spring REST backend -> PostGIS`

GeoServer helps us show geospatial information. The backend still decides how business data is saved and validated.

## What we are not doing

- no WFS-T;
- no direct editing against GeoServer;
- no replacement of REST backend with GeoServer;
- no moving overlap validation into the frontend as the source of truth.

## Practical takeaway

If you need to change map rendering, go to:

- `frontend/src/features/map/`

If you need GeoServer URLs, workspace or layer names, go to:

- `frontend/src/features/map/services/geoserver/`

If you need to decide whether a screen uses vector, WMS, WFS or a support layer, go to:

- `frontend/src/shared/config/mapLayers.js`
