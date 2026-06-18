package com.example.geotravel.repository;

import com.example.geotravel.model.Zona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ZonaRepository extends JpaRepository<Zona, Long> {

    Boolean existsByIdZona(Long id);

    Zona findByIdZona(Long id);

    List<Zona> findAll();

    @Query("SELECT COUNT(z) FROM Zona z WHERE ST_Overlaps(z.geomWkt, ST_GeomFromText(:geomWkt, 4326)) OR ST_Contains(z.geomWkt, ST_GeomFromText(:geomWkt, 4326))")
    Long countIntersection(@Param("geomWkt") String geomWkt);

    @Query("SELECT COUNT(z) FROM Zona z WHERE z.idZona != :idZona AND (ST_Overlaps(z.geomWkt, ST_GeomFromText(:geomWkt, 4326)) OR ST_Contains(z.geomWkt, ST_GeomFromText(:geomWkt, 4326)))")
    Long countIntersectionExceptOne(@Param("geomWkt") String geomWkt, @Param("idZona") Long idZona);

    @Query("SELECT z FROM Zona z WHERE ST_Crosses(z.geomWkt, ST_GeomFromText(:geomWkt, 4326))")
    List<Zona> findByLinestring(@Param("geomWkt") String geomWkt);

    @Query("SELECT z FROM Zona z WHERE z.idZona != :idZona AND ST_Crosses(z.geomWkt, ST_GeomFromText(:geomWkt, 4326))")
    List<Zona> findByLinestringExceptOne(@Param("geomWkt") String geomWkt, @Param("idZona") Long idZona);

    // TODO
    @Query(value = "SELECT * FROM zona z WHERE ST_Covers(z.geom_wkt, ST_GeomFromText(:pointWkt, 4326))", nativeQuery = true)
    List<Zona> findAllByPoint(@Param("pointWkt") String pointWkt);

    @Query(value = """
            SELECT z.*
            FROM zona z
            JOIN recorrido r ON r.id_recorrido = :idRecorrido
            WHERE ST_Intersects(z.geom_wkt, r.geom_wkt)
            """, nativeQuery = true)
    List<Zona> findAllByRecorridoIntersects(@Param("idRecorrido") Long idRecorrido);
}
