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
    Long countInterseccion(@Param("geomWkt") String geomWkt);

    @Query(value = "SELECT * FROM zona z WHERE ST_Covers(z.geom_wkt, ST_GeomFromText(:pointWkt, 4326))", nativeQuery = true)
    List<Zona> findAllByPoint(@Param("pointWkt") String pointWkt);
}
