CREATE TABLE zona_turistica (
    id_zona SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    nivel_atractivo INT CHECK (nivel_atractivo BETWEEN 1 AND 5),
    observaciones TEXT,
    geom GEOMETRY(POLYGON, 32721) NOT NULL
);

CREATE TABLE atraccion_turistica (
    id_atraccion SERIAL PRIMARY KEY,
    id_zona INT REFERENCES zona_turistica(id_zona),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    clasificacion TEXT,
    foto_url TEXT,
    geom GEOMETRY(POINT, 32721) NOT NULL
);

CREATE TABLE recorrido (
    id_recorrido SERIAL PRIMARY KEY,
    id_zona INT REFERENCES zona_turistica(id_zona),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    duracion_estimada INT,
    guia_responsable TEXT,
    tipo_experiencia TEXT,
    estado TEXT CHECK (estado IN ('Disponible', 'Fuera de estación', 'Pendiente', 'Cancelado')),
    mes_inicio_temporada INT CHECK (mes_inicio_temporada BETWEEN 1 AND 12),
    mes_fin_temporada INT CHECK (mes_fin_temporada BETWEEN 1 AND 12)
);

CREATE TABLE recorrido_atraccion (
    id_recorrido INT REFERENCES recorrido(id_recorrido) ON DELETE CASCADE,
    id_atraccion INT REFERENCES atraccion_turistica(id_atraccion),
    orden INT NOT NULL,
    PRIMARY KEY (id_recorrido, id_atraccion)
);

CREATE TABLE historial_estado_recorrido (
    id_historial SERIAL PRIMARY KEY,
    id_recorrido INT REFERENCES recorrido(id_recorrido) ON DELETE CASCADE,
    estado_anterior TEXT,
    estado_nuevo TEXT,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);