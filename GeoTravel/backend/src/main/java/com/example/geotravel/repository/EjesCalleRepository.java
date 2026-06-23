package com.example.geotravel.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class EjesCalleRepository {

    private static final String NORMALIZED_NAME_SQL = """
            trim(
                regexp_replace(
                    translate(
                        lower(nombre),
                        '\u00e1\u00e9\u00ed\u00f3\u00fa\u00e4\u00eb\u00ef\u00f6\u00fc\u00e0\u00e8\u00ec\u00f2\u00f9\u00e2\u00ea\u00ee\u00f4\u00fb\u00f1',
                        'aeiouaeiouaeiouaeioun'
                    ),
                    '[^a-z0-9]+',
                    ' ',
                    'g'
                )
            )
            """;

    private final JdbcTemplate jdbcTemplate;

    public EjesCalleRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<StreetAxisMatch> findStreetCandidates(
            String normalizedStreetReference,
            List<String> streetTokens,
            int limit
    ) {
        if (normalizedStreetReference == null || normalizedStreetReference.isBlank()
                || streetTokens == null || streetTokens.isEmpty()) {
            return List.of();
        }

        String allTokensPredicate = String.join(
                " AND ",
                streetTokens.stream().map(token -> "normalized_name LIKE ?").toList()
        );

        String sql = """
                WITH street_segments AS (
                    SELECT nombre,
                           cloc_iso,
                           tipovia,
                           %s AS normalized_name,
                           geom
                    FROM public.ejes_calle
                    WHERE nombre IS NOT NULL
                      AND trim(nombre) <> ''
                      AND geom IS NOT NULL
                      AND coalesce(tipovia, '') <> 'VIRTUAL'
                )
                SELECT nombre,
                       cloc_iso,
                       tipovia,
                       COUNT(*) AS segment_count,
                       ST_AsText(ST_Transform(ST_UnaryUnion(ST_Collect(geom)), 4326)) AS geometry_wkt
                FROM street_segments
                WHERE %s
                GROUP BY nombre, cloc_iso, tipovia, normalized_name
                ORDER BY CASE
                             WHEN normalized_name = ? THEN 0
                             ELSE 1
                         END,
                         COUNT(*) DESC,
                         nombre ASC,
                         cloc_iso ASC
                LIMIT ?
                """.formatted(NORMALIZED_NAME_SQL, allTokensPredicate);

        List<Object> params = new ArrayList<>();
        streetTokens.forEach(token -> params.add("%" + token + "%"));
        params.add(normalizedStreetReference);
        params.add(limit);

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new StreetAxisMatch(
                        rs.getString("nombre"),
                        rs.getString("cloc_iso"),
                        rs.getString("tipovia"),
                        rs.getString("geometry_wkt"),
                        rs.getInt("segment_count")
                ),
                params.toArray()
        );
    }

    public record StreetAxisMatch(
            String streetName,
            String localityCode,
            String streetType,
            String geometryWkt,
            int segmentCount
    ) {}
}
