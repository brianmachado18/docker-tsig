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
VITE_API_URL=http://localhost:8080/api
VITE_GEOSERVER_URL=http://localhost:8081/geoserver
VITE_GEOSERVER_WORKSPACE=geotravel
```
