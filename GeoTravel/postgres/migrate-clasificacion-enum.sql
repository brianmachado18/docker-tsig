-- Migración para la rama `mauri`: Atraccion.clasificacion pasó de texto (String)
-- a enum ORDINAL (Clasificacion) => columna smallint.
-- Mapea los valores de demo a los ordinales del enum:
-- MUSEO=0, TEATRO=1, MONUMENTO=2, PLAZA=3, GASTRONOMIA=4, PLAYA=5, PARQUE=6
ALTER TABLE atraccion
  ALTER COLUMN clasificacion TYPE smallint
  USING (CASE clasificacion
    WHEN 'CULTURAL'     THEN 0
    WHEN 'HISTORICA'    THEN 2
    WHEN 'GASTRONOMICO' THEN 4
    WHEN 'PLAYA'        THEN 5
    WHEN 'NATURAL'      THEN 6
    WHEN 'AVENTURA'     THEN 6
    WHEN 'RURAL'        THEN 6
    ELSE 0 END);
