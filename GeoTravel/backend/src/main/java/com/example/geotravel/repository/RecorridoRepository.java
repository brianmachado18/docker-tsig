package com.example.geotravel.repository;

import com.example.geotravel.model.Recorrido;
import com.example.geotravel.model.Zona;
import com.example.geotravel.enums.Estado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecorridoRepository extends JpaRepository<Recorrido, Long> {

    Boolean existsByIdRecorrido(Long id);
    Boolean existsByZonas(Zona zona);
    Recorrido findByIdRecorrido(Long id);
    List<Recorrido> findAll();

    @Query("SELECT DISTINCT r FROM Recorrido r, Zona z WHERE z.idZona = :idZona AND ST_Intersects(r.geomWkt, z.geomWkt)")
    List<Recorrido> findAllByZonaGeom(@Param("idZona") Long idZona);

    @Query("""
            SELECT DISTINCT r
            FROM Recorrido r, Zona z
            WHERE z.idZona = :idZona
              AND r.estado = :estado
              AND ST_Intersects(r.geomWkt, z.geomWkt)
            """)
    List<Recorrido> findAllByZonaGeomAndEstado(@Param("idZona") Long idZona, @Param("estado") Estado estado);

    @Query(value = """
            SELECT r.id_recorrido
            FROM recorrido r
            ORDER BY ST_Distance(
                r.geom_wkt::geography,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
            ) ASC
            LIMIT 1
            """, nativeQuery = true)
    Long findNearestRecorridoId(@Param("lon") double lon, @Param("lat") double lat);

    @Query(value = """
            SELECT ST_Distance(
                r.geom_wkt::geography,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
            )
            FROM recorrido r
            WHERE r.id_recorrido = :idRecorrido
            """, nativeQuery = true)
    Double findDistanceToPoint(
            @Param("idRecorrido") Long idRecorrido,
            @Param("lon") double lon,
            @Param("lat") double lat
    );

}
