package com.example.geotravel.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Locale;

@Repository
public class InfraestructuraVialRepository {

    private static final String REPRESENTATIVE_INTERSECTION_NEAREST_ROUTE_SQL = """
            WITH ruta_1 AS (
                SELECT ST_GeomFromText(?, 4326) AS geom
            ),
            ruta_2 AS (
                SELECT ST_GeomFromText(?, 4326) AS geom
            ),
            interseccion_bruta AS (
                SELECT ST_Intersection(r1.geom, r2.geom) AS geom
                FROM ruta_1 r1
                CROSS JOIN ruta_2 r2
                WHERE r1.geom IS NOT NULL
                  AND r2.geom IS NOT NULL
            ),
            puntos_candidatos AS (
                SELECT (ST_Dump(ST_CollectionExtract(geom, 1))).geom AS geom
                FROM interseccion_bruta
                WHERE NOT ST_IsEmpty(ST_CollectionExtract(geom, 1))
                UNION ALL
                SELECT ST_LineInterpolatePoint((ST_Dump(ST_CollectionExtract(geom, 2))).geom, 0.5) AS geom
                FROM interseccion_bruta
                WHERE NOT ST_IsEmpty(ST_CollectionExtract(geom, 2))
            ),
            punto_representativo AS (
                SELECT pc.geom
                FROM puntos_candidatos pc
                CROSS JOIN (
                    SELECT ST_Centroid(ST_Collect(geom)) AS centroide
                    FROM puntos_candidatos
                ) resumen
                ORDER BY ST_Distance(pc.geom::geography, resumen.centroide::geography) ASC
                LIMIT 1
            ),
            recorrido_mas_cercano AS (
                SELECT r.id_recorrido,
                       ST_Distance(r.geom_wkt::geography, pr.geom::geography) AS distancia_metros
                FROM recorrido r
                CROSS JOIN punto_representativo pr
                ORDER BY distancia_metros ASC, r.id_recorrido ASC
                LIMIT 1
            )
            SELECT rm.id_recorrido,
                   rm.distancia_metros,
                   ST_AsText(pr.geom) AS punto_interseccion_wkt,
                   (SELECT COUNT(*) FROM recorrido) AS total_recorridos_evaluados,
                   pk1.km AS km_ruta_1,
                   pk2.km AS km_ruta_2
            FROM recorrido_mas_cercano rm
            CROSS JOIN punto_representativo pr
            LEFT JOIN LATERAL (
                SELECT km
                FROM postes_km p
                WHERE ? IS NOT NULL
                  AND p.ruta = ?
                ORDER BY ST_Distance(p.geom::geography, pr.geom::geography) ASC
                LIMIT 1
            ) pk1 ON TRUE
            LEFT JOIN LATERAL (
                SELECT km
                FROM postes_km p
                WHERE ? IS NOT NULL
                  AND p.ruta = ?
                ORDER BY ST_Distance(p.geom::geography, pr.geom::geography) ASC
                LIMIT 1
            ) pk2 ON TRUE
            """;

    private static final String ROAD_REFERENCE_BY_NUMBER_SQL = """
            SELECT ST_AsText(ST_UnaryUnion(ST_Collect(geom))) AS geom_wkt,
                   MIN(numero) AS numero_ruta,
                   COALESCE(NULLIF(MIN(nombre), ''), 'Ruta ' || MIN(numero)::text) AS etiqueta
            FROM camineria_nacional
            WHERE numero = ?
            """;

    private static final String ROAD_REFERENCE_BY_NAME_SQL = """
            WITH coincidencias AS (
                SELECT nombre,
                       MIN(numero) AS numero_ruta,
                       CASE WHEN COUNT(DISTINCT numero) = 1 THEN MIN(numero) ELSE NULL END AS numero_ruta_unico,
                       ST_AsText(ST_UnaryUnion(ST_Collect(geom))) AS geom_wkt
                FROM camineria_nacional
                WHERE nombre IS NOT NULL
                  AND TRIM(nombre) <> ''
                  AND translate(lower(nombre), 'áéíóúäëïöüàèìòùâêîôûñ', 'aeiouaeiouaeiouaeioun')
                      = ?
                GROUP BY nombre
                ORDER BY COUNT(*) DESC
                LIMIT 1
            )
            SELECT geom_wkt,
                   numero_ruta_unico AS numero_ruta,
                   nombre AS etiqueta
            FROM coincidencias
            """;

    private final JdbcTemplate jdbcTemplate;

    public InfraestructuraVialRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public RoadReferenceMatch findRoadReferenceByNumber(Integer routeNumber) {
        return jdbcTemplate.query(
                ROAD_REFERENCE_BY_NUMBER_SQL,
                (rs, rowNum) -> new RoadReferenceMatch(
                        rs.getString("geom_wkt"),
                        (Integer) rs.getObject("numero_ruta"),
                        rs.getString("etiqueta"),
                        "route-number"
                ),
                routeNumber
        ).stream().filter(match -> match.geometryWkt() != null && !match.geometryWkt().isBlank()).findFirst().orElse(null);
    }

    public RoadReferenceMatch findRoadReferenceByName(String referenceName) {
        String normalizedReference = normalizeReference(referenceName);
        if (normalizedReference.isBlank()) {
            return null;
        }

        return jdbcTemplate.query(
                ROAD_REFERENCE_BY_NAME_SQL,
                (rs, rowNum) -> new RoadReferenceMatch(
                        rs.getString("geom_wkt"),
                        (Integer) rs.getObject("numero_ruta"),
                        rs.getString("etiqueta"),
                        "road-name"
                ),
                normalizedReference
        ).stream().filter(match -> match.geometryWkt() != null && !match.geometryWkt().isBlank()).findFirst().orElse(null);
    }

    public RouteIntersectionResult findNearestRouteByRepresentativeIntersection(
            String geometryWkt1,
            String geometryWkt2,
            Integer routeNumber1,
            Integer routeNumber2
    ) {
        List<RouteIntersectionResult> results = jdbcTemplate.query(
                REPRESENTATIVE_INTERSECTION_NEAREST_ROUTE_SQL,
                (rs, rowNum) -> new RouteIntersectionResult(
                        rs.getLong("id_recorrido"),
                        rs.getDouble("distancia_metros"),
                        rs.getLong("total_recorridos_evaluados"),
                        rs.getString("punto_interseccion_wkt"),
                        (Integer) rs.getObject("km_ruta_1"),
                        (Integer) rs.getObject("km_ruta_2")
                ),
                geometryWkt1,
                geometryWkt2,
                routeNumber1,
                routeNumber1,
                routeNumber2,
                routeNumber2
        );

        return results.isEmpty() ? null : results.get(0);
    }

    private String normalizeReference(String value) {
        return value == null
                ? ""
                : java.text.Normalizer.normalize(value.trim(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }

    public record RouteIntersectionResult(
            Long routeId,
            Double distanceMeters,
            Long totalRoutesEvaluated,
            String representativePointWkt,
            Integer kmRoute1,
            Integer kmRoute2
    ) {}

    public record RoadReferenceMatch(
            String geometryWkt,
            Integer routeNumber,
            String label,
            String matchedBy
    ) {}
}
