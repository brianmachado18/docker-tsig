-- Datos de prueba GeoTravel (Montevideo, EPSG:4326). Geometrías en columnas geography geom_wkt.
BEGIN;

-- Limpieza (orden por FKs)
DELETE FROM historico;
DELETE FROM recorrido_atracciones;
DELETE FROM recorrido_zona;
DELETE FROM recorrido;
DELETE FROM atraccion;
DELETE FROM zona;

-- ZONAS (polígonos que NO se superponen)
INSERT INTO zona (nombre, descripcion, nivel_atractivo, observaciones, geom_wkt) VALUES
  ('Ciudad Vieja', 'Casco histórico de Montevideo', 1, 'Alta densidad de patrimonio',
     ST_SetSRID(ST_GeomFromText('POLYGON((-56.220 -34.900, -56.205 -34.900, -56.205 -34.912, -56.220 -34.912, -56.220 -34.900))'),4326)::geography),
  ('Centro / Parque Rodó', 'Zona central y cultural', 2, 'Museos y espacios verdes',
     ST_SetSRID(ST_GeomFromText('POLYGON((-56.180 -34.905, -56.165 -34.905, -56.165 -34.918, -56.180 -34.918, -56.180 -34.905))'),4326)::geography),
  ('Pocitos', 'Zona costera residencial', 2, 'Rambla y playa',
     ST_SetSRID(ST_GeomFromText('POLYGON((-56.160 -34.910, -56.145 -34.910, -56.145 -34.922, -56.160 -34.922, -56.160 -34.910))'),4326)::geography),
  ('Carrasco', 'Barrio costero al este', 3, 'Playas y casonas',
     ST_SetSRID(ST_GeomFromText('POLYGON((-56.070 -34.885, -56.050 -34.885, -56.050 -34.897, -56.070 -34.897, -56.070 -34.885))'),4326)::geography);

-- ATRACCIONES (puntos)
-- Clasificacion: MUSEO=0, TEATRO=1, MONUMENTO=2, PLAZA=3, GASTRONOMIA=4, PLAYA=5, PARQUE=6
INSERT INTO atraccion (nombre, descripcion, clasificacion, foto_url, geom_wkt) VALUES
  ('Mercado del Puerto', 'Gastronomía típica', 4, NULL,
     ST_SetSRID(ST_GeomFromText('POINT(-56.2117 -34.9056)'),4326)::geography),
  ('Teatro Solís', 'Principal teatro del país', 1, NULL,
     ST_SetSRID(ST_GeomFromText('POINT(-56.2046 -34.9069)'),4326)::geography),
  ('Plaza Independencia', 'Plaza fundacional', 3, NULL,
     ST_SetSRID(ST_GeomFromText('POINT(-56.1985 -34.9066)'),4326)::geography),
  ('Parque Rodó', 'Parque urbano y lago', 6, NULL,
     ST_SetSRID(ST_GeomFromText('POINT(-56.1722 -34.9156)'),4326)::geography),
  ('Estadio Centenario', 'Estadio histórico del fútbol', 2, NULL,
     ST_SetSRID(ST_GeomFromText('POINT(-56.1606 -34.8941)'),4326)::geography),
  ('Rambla de Pocitos', 'Paseo costero', 6, NULL,
     ST_SetSRID(ST_GeomFromText('POINT(-56.1530 -34.9170)'),4326)::geography),
  ('Playa Carrasco', 'Playa al este', 5, NULL,
     ST_SetSRID(ST_GeomFromText('POINT(-56.0560 -34.8930)'),4326)::geography);

-- RECORRIDOS (líneas)
INSERT INTO recorrido (nombre, descripcion, duracion_estimada, guia_responsable, tipo_experiencia, estado, mes_inicio, mes_fin, geom_wkt) VALUES
  ('Circuito Histórico Ciudad Vieja', 'Patrimonio y cultura', 120, 'Ana Pérez', 'CULTURAL', 'DISPONIBLE', 1, 12,
     ST_SetSRID(ST_GeomFromText('LINESTRING(-56.2117 -34.9056, -56.2046 -34.9069, -56.1985 -34.9066)'),4326)::geography),
  ('Tour Gastronómico Centro', 'Sabores del centro', 90, 'Luis Gómez', 'GASTRONOMICO', 'PENDIENTE', 1, 12,
     ST_SetSRID(ST_GeomFromText('LINESTRING(-56.1985 -34.9066, -56.1820 -34.9100, -56.1722 -34.9156)'),4326)::geography),
  ('Recorrido Costero Pocitos-Carrasco', 'Playas y rambla', 180, 'María Silva', 'NATURAL', 'FUERA_DE_ESTACION', 11, 2,
     ST_SetSRID(ST_GeomFromText('LINESTRING(-56.1530 -34.9170, -56.1000 -34.9050, -56.0560 -34.8930)'),4326)::geography),
  ('Aventura Parque Rodó', 'Actividades al aire libre', 60, 'Diego Rodríguez', 'AVENTURA', 'CANCELADO', 3, 6,
     ST_SetSRID(ST_GeomFromText('LINESTRING(-56.1722 -34.9156, -56.1700 -34.9120, -56.1650 -34.9100)'),4326)::geography);

-- RELACIÓN recorrido <-> zona
INSERT INTO recorrido_zona (id_recorrido, id_zona)
SELECT r.id_recorrido, z.id_zona FROM recorrido r, zona z WHERE
  (r.nombre='Circuito Histórico Ciudad Vieja' AND z.nombre='Ciudad Vieja') OR
  (r.nombre='Tour Gastronómico Centro'        AND z.nombre='Centro / Parque Rodó') OR
  (r.nombre='Recorrido Costero Pocitos-Carrasco' AND z.nombre IN ('Pocitos','Carrasco')) OR
  (r.nombre='Aventura Parque Rodó'            AND z.nombre='Centro / Parque Rodó');

-- RELACIÓN recorrido <-> atracciones (con orden)
INSERT INTO recorrido_atracciones (id_recorrido, id_atraccion, orden)
SELECT r.id_recorrido, a.id_atraccion, x.orden FROM recorrido r, atraccion a,
 (VALUES
   ('Circuito Histórico Ciudad Vieja','Mercado del Puerto',1),
   ('Circuito Histórico Ciudad Vieja','Teatro Solís',2),
   ('Circuito Histórico Ciudad Vieja','Plaza Independencia',3),
   ('Tour Gastronómico Centro','Plaza Independencia',1),
   ('Tour Gastronómico Centro','Parque Rodó',2),
   ('Recorrido Costero Pocitos-Carrasco','Rambla de Pocitos',1),
   ('Recorrido Costero Pocitos-Carrasco','Playa Carrasco',2),
   ('Aventura Parque Rodó','Parque Rodó',1)
 ) AS x(rec,atr,orden)
WHERE r.nombre=x.rec AND a.nombre=x.atr;

-- HISTÓRICO
INSERT INTO historico (id_recorrido, estado, fecha_cambio)
SELECT r.id_recorrido, x.estado, x.fecha FROM recorrido r,
 (VALUES
   ('Circuito Histórico Ciudad Vieja', 2, '2026-01-10'),
   ('Circuito Histórico Ciudad Vieja', 0, '2026-02-01'),
   ('Aventura Parque Rodó', 2, '2026-03-15'),
   ('Aventura Parque Rodó', 3, '2026-04-02')
 ) AS x(rec, estado, fecha)
WHERE r.nombre=x.rec;

COMMIT;

-- Resumen
SELECT 'zonas' AS t, count(*) FROM zona
UNION ALL SELECT 'atracciones', count(*) FROM atraccion
UNION ALL SELECT 'recorridos', count(*) FROM recorrido
UNION ALL SELECT 'recorrido_zona', count(*) FROM recorrido_zona
UNION ALL SELECT 'recorrido_atracciones', count(*) FROM recorrido_atracciones
UNION ALL SELECT 'historico', count(*) FROM historico;