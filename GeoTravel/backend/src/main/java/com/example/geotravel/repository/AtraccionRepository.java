package com.example.geotravel.repository;

import com.example.geotravel.model.Atraccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AtraccionRepository extends JpaRepository<Atraccion, Long> {

    Boolean existsByIdAtraccion(Long id);

    Atraccion findByIdAtraccion(Long id);

    List<Atraccion> findAll();

    @Query("SELECT a FROM Atraccion a WHERE ST_Contains(ST_GeomFromText(:geomWkt, 4326), a.geomWkt)")
    List<Atraccion> findByZona(@Param("geomWkt") String geomWkt);

}
