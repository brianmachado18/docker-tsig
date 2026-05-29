# Frontend Integration Contracts

Use this document to capture assumptions between `@Frontend SPA Architect` and `@Geo Platform Architect`.

| Integration | Frontend Expects | Owner |
|---|---|---|
| REST API | `VITE_API_URL`, JSON DTOs, stable error shape | `@Geo Platform Architect` |
| GeoServer | `VITE_GEOSERVER_URL`, workspace/layer names, WMS/WFS availability | `@Geo Platform Architect` |
| Geometry exchange | Explicit CRS/SRID and GeoJSON shape when applicable | Both agents |
| Mock data | Same entity names and status values as backend contracts | `@Frontend SPA Architect` |

Current frontend env names:

```env
VITE_API_URL=http://localhost:8080/api
VITE_GEOSERVER_URL=http://localhost:8081/geoserver
VITE_GEOSERVER_WORKSPACE=geotravel
```
