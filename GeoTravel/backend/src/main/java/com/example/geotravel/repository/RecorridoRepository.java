package com.example.geotravel.repository;

import com.example.geotravel.model.Recorrido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecorridoRepository extends JpaRepository<Recorrido, Long> {

    Boolean existsByIdRecorrido(Long id);
    Recorrido findByIdRecorrido(Long id);
    List<Recorrido> findAll();
    @Query("SELECT DISTINCT r FROM Recorrido r, Zona z WHERE z.idZona = :idZona AND ST_Intersects(r.geomWkt, z.geomWkt)")
    List<Recorrido> findAllByZonaGeom(@Param("idZona") Long idZona);

}
