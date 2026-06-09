package com.example.geotravel.repository;

import com.example.geotravel.model.Estacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EstacionRepository extends JpaRepository<Estacion, Long> {

    Boolean existsByIdEstacion(Long id);
    Estacion findByIdEstacion(Long id);
    List<Estacion> findAll();

}
