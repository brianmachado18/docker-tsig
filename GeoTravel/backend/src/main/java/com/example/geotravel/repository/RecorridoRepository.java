package com.example.geotravel.repository;

import com.example.geotravel.model.Recorrido;
import com.example.geotravel.model.Zona;
import com.example.geotravel.enums.Estado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Recorrido r SET r.fechaInicio = r.fechaInicio + 1 year, r.fechaFin = r.fechaFin + 1 year WHERE r.fechaInicio < CURRENT_DATE AND r.fechaFin < CURRENT_DATE")
    int updateFechas();

    @Modifying(clearAutomatically = true)
    @Query("SELECT DISTINCT r FROM Recorrido r WHERE r.estado != 'FUERA_DE_ESTACION' AND r.fechaInicio > CURRENT_DATE AND r.fechaFin > CURRENT_DATE")
    List<Recorrido> updateEstadoRecorridoFuera();

    @Modifying(clearAutomatically = true)
    @Query("SELECT DISTINCT r FROM Recorrido r WHERE r.estado = 'FUERA_DE_ESTACION' AND r.fechaInicio < CURRENT_DATE AND r.fechaFin > CURRENT_DATE")
    List<Recorrido> updateEstadoRecorridoDentro();

}
