# GeoTravel — Documento de Referencia

Sistema de gestión turística geoespacial desarrollado para el curso TSIG 2026.

---

## Objetivo del sistema

Aplicación geográfica para la gestión y seguimiento de recorridos turísticos en Uruguay.

- El **administrador** gestiona zonas, recorridos y atracciones, y genera reportes.
- El **invitado** consulta el mapa y filtra recorridos disponibles.

---

## Entidades principales

### Zona Turística
- Nombre, descripción, nivel de atractivo (1-5), observaciones
- Geometría: **Polígono** (o MultiPolygon para departamentos)
- Las zonas **no pueden superponerse** entre sí (validado con `ST_Overlaps`)

### Recorrido
- Nombre, descripción, duración estimada, guía responsable
- Tipo de experiencia: cultural, gastronómica, natural, histórica
- Estado: `pendiente` → `disponible` → `cancelado` (manual por admin)
- Estado `fuera_de_estacion`: calculado automáticamente según mes actual vs. estación del recorrido
- Estacionalidad: mes inicio y mes fin (soporta cruce de año, ej: noviembre a febrero)
- Geometría: **LineString**
- Tiene puntos de interés (atracciones) con orden

### Atracción Turística (Punto de Interés)
- Nombre, descripción, clasificación (museo, teatro, monumento, plaza, gastronomía, playa, parque)
- Foto (URL)
- Geometría: **Point**

### Histórico de Estado
- Registra cada cambio de estado de un recorrido con fecha y observación

### Usuario
- Email, password_hash, activo
- Roles: admin, invitado

---

## Modelo de base de datos

```sql
-- Enumeraciones
CREATE TYPE estado_recorrido AS ENUM ('pendiente', 'disponible', 'fuera_de_estacion', 'cancelado');
CREATE TYPE tipo_experiencia AS ENUM ('cultural', 'gastronomica', 'natural', 'historica');

-- Zonas turísticas
CREATE TABLE zona_turistica (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    nivel_atractivo INTEGER CHECK (nivel_atractivo BETWEEN 1 AND 5),
    observaciones TEXT,
    geom geometry(Geometry, 4326)  -- Geometry para soportar MultiPolygon
);

-- Recorridos
CREATE TABLE recorrido (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    duracion_estimada VARCHAR(100),
    guia_responsable VARCHAR(255),
    tipo_experiencia tipo_experiencia,
    estado estado_recorrido DEFAULT 'pendiente',
    estacion_inicio INTEGER CHECK (estacion_inicio BETWEEN 1 AND 12),
    estacion_fin INTEGER CHECK (estacion_fin BETWEEN 1 AND 12),
    geom geometry(LineString, 4326)
);

-- Atracciones turísticas
CREATE TABLE atraccion_turistica (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    clasificacion VARCHAR(100),
    foto_url TEXT,
    geom geometry(Point, 4326)
);

-- Relación recorrido-atracción (con orden)
CREATE TABLE recorrido_atraccion (
    id SERIAL PRIMARY KEY,
    recorrido_id INTEGER REFERENCES recorrido(id),
    atraccion_id INTEGER REFERENCES atraccion_turistica(id),
    orden INTEGER
);

-- Histórico de estados
CREATE TABLE historico_estado (
    id SERIAL PRIMARY KEY,
    recorrido_id INTEGER REFERENCES recorrido(id),
    estado estado_recorrido,
    observacion VARCHAR(500),
    fecha TIMESTAMP DEFAULT NOW()
);

-- Usuarios
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Consultas geográficas implementadas

### 1. Recorridos dentro de una zona
```sql
SELECT r.* FROM recorrido r, zona_turistica z
WHERE z.id = ? AND ST_Intersects(r.geom, z.geom)
```

### 2. Recorrido más cercano a un punto
```sql
SELECT *, ST_Distance(geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326)) AS dist
FROM recorrido
ORDER BY dist ASC LIMIT 1
```

### 3. Zona que contiene un punto (geocodificación)
```sql
SELECT * FROM zona_turistica
WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
```

### 4. Atracciones dentro de un recorrido (buffer)
```sql
SELECT a.* FROM atraccion_turistica a
WHERE ST_DWithin(a.geom, (SELECT geom FROM recorrido WHERE id = ?), 0.01)
```

### 5. Atracciones dentro de una zona
```sql
SELECT a.* FROM atraccion_turistica a, zona_turistica z
WHERE z.id = ? AND ST_Contains(z.geom, a.geom)
```

### 6. Puntos más populares (por cantidad de recorridos que los incluyen)
```sql
SELECT a.*, COUNT(ra.recorrido_id) AS popularidad
FROM atraccion_turistica a
JOIN recorrido_atraccion ra ON ra.atraccion_id = a.id
GROUP BY a.id ORDER BY popularidad DESC LIMIT ?
```

### 7. Validación de superposición de zonas
```sql
SELECT nombre FROM zona_turistica
WHERE ST_Overlaps(geom, ST_SetSRID(ST_GeomFromGeoJSON(?), 4326))
AND id != ?
```

### 8. Reporte de recorridos por zona
```sql
SELECT z.id, z.nombre,
  COUNT(CASE WHEN r.estado = 'disponible' THEN 1 END) AS disponibles,
  COUNT(CASE WHEN r.estado = 'pendiente' THEN 1 END) AS pendientes,
  COUNT(CASE WHEN r.estado = 'fuera_de_estacion' THEN 1 END) AS fuera_estacion,
  COUNT(CASE WHEN r.estado = 'cancelado' THEN 1 END) AS cancelados,
  COUNT(r.id) AS total
FROM zona_turistica z
LEFT JOIN recorrido r ON ST_Intersects(r.geom, z.geom)
GROUP BY z.id ORDER BY total DESC
```

### 9. Estacionalidad automática (se ejecuta en cada consulta)
```sql
-- Pasa a fuera_de_estacion si no está en temporada
UPDATE recorrido SET estado = 'fuera_de_estacion'
WHERE estado NOT IN ('cancelado', 'fuera_de_estacion')
AND CASE
  WHEN estacion_inicio <= estacion_fin
    THEN EXTRACT(MONTH FROM CURRENT_DATE) NOT BETWEEN estacion_inicio AND estacion_fin
  ELSE
    EXTRACT(MONTH FROM CURRENT_DATE) < estacion_inicio
    AND EXTRACT(MONTH FROM CURRENT_DATE) > estacion_fin
END;

-- Reactiva si volvió la temporada
UPDATE recorrido SET estado = 'disponible'
WHERE estado = 'fuera_de_estacion'
AND CASE
  WHEN estacion_inicio <= estacion_fin
    THEN EXTRACT(MONTH FROM CURRENT_DATE) BETWEEN estacion_inicio AND estacion_fin
  ELSE
    EXTRACT(MONTH FROM CURRENT_DATE) >= estacion_inicio
    OR EXTRACT(MONTH FROM CURRENT_DATE) <= estacion_fin
END;
```

---

## Lógica de negocio

### Estados del recorrido
- `pendiente` → recién creado, no visible para invitados
- `disponible` → aprobado por admin, visible para todos
- `fuera_de_estacion` → calculado automáticamente por mes, visible para invitados con advertencia
- `cancelado` → estado terminal, no visible para invitados

### Secuencia manual
```
pendiente → disponible → cancelado
```

### Roles
- **Admin**: ABM completo, cambio de estados, reportes, WMS, mapa de calor
- **Invitado**: solo ve recorridos `disponible` y `fuera_de_estacion`, filtrados por mes actual al ingresar

### Filtro de mes con estados calculados
Cuando se filtra por mes, el estado se calcula dinámicamente:
- Si la temporada incluye ese mes → `disponible`
- Si no → `fuera_de_estacion`
- Los `pendiente` y `cancelado` no aparecen para invitados

---

## GeoServer

- Workspace: `geotravel`
- Tres capas publicadas:
  - `geotravel:zona_turistica` → estilo por nivel de atractivo (1-5 colores)
  - `geotravel:recorrido` → estilo por estado del recorrido
  - `geotravel:atraccion_turistica` → estilo por clasificación
- Estilos en formato SLD
- Se accede por WMS desde el frontend

---

## Funcionalidades opcionales implementadas

| Funcionalidad | Implementación |
|---|---|
| Control de solapamiento | `ST_Overlaps` al guardar zona |
| Mapa de calor | `leaflet.heat` con coordenadas de atracciones |
| Ruteo "¿Cómo llego?" | OpenRouteService (3 modos de transporte) |
| Imágenes de atracciones | Campo `foto_url` + ImagePicker (Wikimedia, URL, archivo) |
| Gráfica popularidad por zona | Recharts BarChart con datos del reporte |
| Zonas activas en mapa | Gradiente de color según cantidad de recorridos activos |

---

## Notas técnicas importantes

- `zona_turistica.geom` debe ser `geometry(Geometry, 4326)` (no `Polygon`) para soportar MultiPolygon de departamentos
- `ST_Overlaps` no se activa cuando las zonas solo se tocan en el borde, solo cuando comparten área
- La estacionalidad con cruce de año (ej: noviembre a febrero) requiere lógica especial con `CASE WHEN estacion_inicio <= estacion_fin`
- Los recorridos se crean en estado `pendiente` por defecto
- El histórico registra cada cambio de estado con fecha

---

## Datos de Uruguay cargados

- **19 departamentos** con geometrías reales de OpenStreetMap (simplificadas con `ST_SimplifyPreserveTopology`)
- **~60 atracciones** turísticas reales distribuidas por todo el país
- **12 recorridos** reales con rutas aproximadas

---

## Credenciales por defecto

| Sistema | Usuario | Contraseña |
|---|---|---|
| App (admin) | admin@geotravel.com | admin123 |
| GeoServer | admin | geoserver |
| PostgreSQL | postgres | postgres |
| Base de datos | - | geotravel |
