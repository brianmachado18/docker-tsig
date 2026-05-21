INSERT INTO zona_turistica (
    nombre, descripcion, nivel_atractivo, observaciones, geom
)
VALUES (
    'Ciudad Vieja',
    'Zona histórica y cultural de Montevideo',
    1,
    'Zona con alto valor turístico',
    ST_GeomFromText(
        'POLYGON((
            -56.2150 -34.9100,
            -56.1900 -34.9100,
            -56.1900 -34.8950,
            -56.2150 -34.8950,
            -56.2150 -34.9100
        ))',
        4326
    )
);

INSERT INTO atraccion_turistica (
    id_zona, nombre, descripcion, clasificacion, foto_url, geom
)
VALUES
(
    1,
    'Plaza Independencia',
    'Plaza principal entre Centro y Ciudad Vieja',
    'Histórica',
    NULL,
    ST_SetSRID(ST_Point(-56.1990, -34.9067), 4326)
),
(
    1,
    'Teatro Solís',
    'Teatro histórico de Montevideo',
    'Cultural',
    NULL,
    ST_SetSRID(ST_Point(-56.2004, -34.9076), 4326)
),
(
    1,
    'Mercado del Puerto',
    'Punto gastronómico tradicional',
    'Gastronómica',
    NULL,
    ST_SetSRID(ST_Point(-56.2116, -34.9061), 4326)
);

INSERT INTO recorrido (
    id_zona,
    nombre,
    descripcion,
    duracion_estimada,
    guia_responsable,
    tipo_experiencia,
    estado,
    mes_inicio_temporada,
    mes_fin_temporada
)
VALUES (
    1,
    'Recorrido Histórico Ciudad Vieja',
    'Recorrido por puntos históricos y culturales de Ciudad Vieja',
    120,
    'Guía Demo',
    'Histórica',
    'Pendiente',
    3,
    12
);

INSERT INTO recorrido_atraccion (
    id_recorrido, id_atraccion, orden
)
VALUES
(1, 1, 1),
(1, 2, 2),
(1, 3, 3);
