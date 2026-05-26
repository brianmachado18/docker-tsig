package com.example.geotravel.repository;

import com.example.geotravel.model.Zona;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ZonaRepository extends JpaRepository<Zona, Long> {

    Zona findByIdZona(Long id);
    List<Zona> findAll();
    Zona findByNombre(String nombre);

}
