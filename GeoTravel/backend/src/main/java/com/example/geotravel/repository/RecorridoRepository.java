package com.example.geotravel.repository;

import com.example.geotravel.model.Recorrido;
import com.example.geotravel.model.Zona;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecorridoRepository extends JpaRepository<Recorrido, Long> {

    Boolean existsByIdRecorrido(Long id);
    Boolean existsByZonas(Zona zona);
    Recorrido findByIdRecorrido(Long id);
    List<Recorrido> findAll();

}
