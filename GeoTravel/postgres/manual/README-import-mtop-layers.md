# Importación manual de caminería nacional y postes km

Este proyecto incluye el script `GeoTravel/scripts/import_mtop_layers.py` para cargar:

- `v_camineria_nacional.zip`
- `postes_km.zip`

en las tablas:

- `camineria_nacional`
- `postes_km`

## Flujo

1. Extraer ambos ZIP.
2. Generar SQL con el script.
3. Ejecutar ese SQL contra PostGIS.

## Ejemplo

```powershell
python GeoTravel/scripts/import_mtop_layers.py `
  --camineria-dir "$env:TEMP\v_camineria_nacional_inspect" `
  --postes-dir "$env:TEMP\postes_km_inspect" `
  > "$env:TEMP\import_mtop_layers.sql"
```

Luego ejecutar el SQL con `psql` dentro del contenedor `tsig-postgres`.
