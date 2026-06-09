CREATE EXTENSION IF NOT EXISTS postgis;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'atraccion'
          AND column_name = 'geom_wkt'
    ) THEN
        EXECUTE '
            ALTER TABLE public.atraccion
            ALTER COLUMN geom_wkt
            TYPE geometry(Point,4326)
            USING CASE
                WHEN geom_wkt IS NULL THEN NULL
                ELSE ST_SetSRID(geom_wkt::geometry, 4326)
            END
        ';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'recorrido'
          AND column_name = 'geom_wkt'
    ) THEN
        EXECUTE '
            ALTER TABLE public.recorrido
            ALTER COLUMN geom_wkt
            TYPE geometry(LineString,4326)
            USING CASE
                WHEN geom_wkt IS NULL THEN NULL
                ELSE ST_SetSRID(geom_wkt::geometry, 4326)
            END
        ';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'zona'
          AND column_name = 'geom_wkt'
    ) THEN
        EXECUTE '
            ALTER TABLE public.zona
            ALTER COLUMN geom_wkt
            TYPE geometry(Polygon,4326)
            USING CASE
                WHEN geom_wkt IS NULL THEN NULL
                ELSE ST_SetSRID(geom_wkt::geometry, 4326)
            END
        ';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'atraccion'
          AND column_name = 'geom_wkt'
    ) THEN
        EXECUTE '
            CREATE INDEX IF NOT EXISTS idx_atraccion_geom_wkt
            ON public.atraccion
            USING GIST (geom_wkt)
        ';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'recorrido'
          AND column_name = 'geom_wkt'
    ) THEN
        EXECUTE '
            CREATE INDEX IF NOT EXISTS idx_recorrido_geom_wkt
            ON public.recorrido
            USING GIST (geom_wkt)
        ';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'zona'
          AND column_name = 'geom_wkt'
    ) THEN
        EXECUTE '
            CREATE INDEX IF NOT EXISTS idx_zona_geom_wkt
            ON public.zona
            USING GIST (geom_wkt)
        ';
    END IF;
END $$;
