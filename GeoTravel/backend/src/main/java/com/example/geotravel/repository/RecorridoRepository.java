package com.example.geotravel.repository;

import com.example.geotravel.model.Recorrido;
import com.example.geotravel.model.Zona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecorridoRepository extends JpaRepository<Recorrido, Long> {

    Boolean existsByIdRecorrido(Long id);

    Boolean existsByZonas(Zona zona);

    Recorrido findByIdRecorrido(Long id);

    List<Recorrido> findByZonas(Zona zona);

    List<Recorrido> findAll();

    @Query("SELECT DISTINCT r FROM Recorrido r, Zona z WHERE z.idZona = :idZona AND ST_Intersects(r.geomWkt, z.geomWkt)")
    List<Recorrido> findByZonaGeom(@Param("idZona") Long idZona);

    @Query("SELECT r FROM Recorrido r WHERE ST_Crosses(ST_GeomFromText(:geomWkt, 4326), r.geomWkt)")
    List<Recorrido> findByPolygon(@Param("geomWkt") String geomWkt);

}
