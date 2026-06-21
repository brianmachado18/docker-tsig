package com.example.geotravel.repository;

import com.example.geotravel.model.Atraccion;
import com.example.geotravel.model.Recorrido;
import com.example.geotravel.model.RecorridoAtracciones;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecorridoAtraccionesRepository extends JpaRepository<RecorridoAtracciones, Long> {
    Boolean existsByAtraccion(Atraccion atraccion);
    List<RecorridoAtracciones> findByRecorridoOrderByOrden(Recorrido recorrido);
    Long countByAtraccion(Atraccion atraccion);
}
