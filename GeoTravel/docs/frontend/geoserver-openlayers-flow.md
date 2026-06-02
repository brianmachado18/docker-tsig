# GeoServer + OpenLayers: simple team explanation

## Why we added this

We needed to connect the frontend map to GeoServer **without breaking** the current admin flows.

The project now separates responsibilities clearly:

- **OpenLayers** draws and manages the map in the browser.
- **GeoServer** publishes ready-to-consume map layers.
- **Spring REST backend** remains the source of truth for CRUD and business rules.

This means we can show published GIS layers in the map, but we do **not** move business logic or writes into GeoServer.

## The simple mental model

Think of it like this:

- **OpenLayers** = the map engine
- **GeoServer** = the map image/data server
- **Backend REST** = the application brain

So:

- if we want to **visualize** published layers, OpenLayers asks **GeoServer**
- if we want to **create, edit or delete** business data, React forms/stores ask the **backend**

## Current flow by screen

### GuestPortal

GuestPortal is now the first screen that consumes GeoServer as the main visual source.

- Routes are shown through **WMS**
- Attractions are shown through **WMS**
- The page can still keep local arrays for cards, filters, and side content

Simple idea:

`GuestPortal -> MapCanvas -> OpenLayers -> GeoServer WMS`

### ZoneManagement

ZoneManagement now uses GeoServer as the main render source for zones.

- Zones are shown through **WMS**
- Zone CRUD still goes through **REST backend**
- The form keeps `geomWkt` input and backend validation as before

Simple idea:

`ZoneManagement -> MapCanvas -> OpenLayers -> GeoServer WMS`

### RoutePlanner

RoutePlanner now also uses GeoServer as the main visual source.

- Routes are shown through **WMS**
- Route list, form, and save/delete continue in **REST backend**
- After route ABM, visible WMS layers are refreshed from the frontend store

Simple idea:

`RoutePlanner -> MapCanvas -> OpenLayers -> GeoServer WMS`

## The new frontend structure

The map is now split into clear boundaries:

### `components/map/`

- `MapCanvas.jsx`: creates the map and orchestrates layers
- `MapBaseLayer.jsx`: base OSM map
- `MapOverlayLayers.jsx`: decides what each screen shows
- `layers/*`: individual vector or WMS layer components

### `services/geoserver/`

- `geoserverClient.js`: URLs, workspace, default params
- `geoserverLayers.js`: canonical layer names
- `geoserverWms.js`: WMS layer factory
- `geoserverWfs.js`: read-only WFS helper for future use
- `geoserverCapabilities.js`: technical health/capabilities helper
- `geoserverMappers.js`: shape adapters if we later need feature-level reads

### `config/mapLayers.js`

This file decides which strategy each screen uses.

That avoids spreading GeoServer decisions all over the app.

## CRS explained simply

This part matters A LOT.

We are not using the same CRS everywhere:

- **Frontend/API exchange**: `EPSG:4326`
- **OpenLayers map render**: `EPSG:3857`
- **Database/PostGIS**: `EPSG:32721`

Simple reading:

- browser/business exchange = geographic coordinates
- map render = web map projection
- database storage/querying = project spatial SRID

## End-to-end flow in one minute

### To visualize data

`User -> React/OpenLayers -> GeoServer WMS -> rendered map layer`

### To save business data

`User -> React form/store -> Spring REST backend -> PostGIS`

That is the key message:

> GeoServer helps us **show** geospatial information.
> The backend still decides how business data is **saved and validated**.

## What we are NOT doing

To avoid confusion, this implementation does **not** do the following:

- no **WFS-T**
- no direct editing against GeoServer
- no replacement of the REST backend with GeoServer
- no moving overlap validation into the frontend as the source of truth

## Why this design is safer

Because it keeps responsibilities explicit:

- all map render screens can consume WMS
- admin forms and business rules remain in REST backend
- the backend keeps enforcing rules like zone overlap validation
- future WFS read-only use cases can be added without rewriting the map again

## Practical takeaway for the team

If someone asks:

**"Where do I go if I need to change map rendering?"**

Go to:

- `frontend/src/components/map/`

**"Where do I go if I need to change GeoServer URLs, workspace, or layer names?"**

Go to:

- `frontend/src/services/geoserver/`

**"Where do I decide whether a screen uses vector, WMS, or both?"**

Go to:

- `frontend/src/config/mapLayers.js`
