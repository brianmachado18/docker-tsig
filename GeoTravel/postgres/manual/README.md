# Migraciones manuales de PostgreSQL

## `align-geometry-columns.sql`

Convierte las columnas `geom_wkt` del schema actual:

- `public.atraccion.geom_wkt` -> `geometry(Point,4326)`
- `public.recorrido.geom_wkt` -> `geometry(LineString,4326)`
- `public.zona.geom_wkt` -> `geometry(Polygon,4326)`

También crea índices `GIST` si las tablas existen.

### Cuándo usarlo

Cuando la base existente quedó con columnas `geography` y el backend espera `geometry(...,4326)`.

### Ejecución

```powershell
Get-Content .\GeoTravel\postgres\manual\align-geometry-columns.sql | docker compose -f .\GeoTravel\docker-compose.yml exec -T postgres psql -U tsig -d tsig
```
