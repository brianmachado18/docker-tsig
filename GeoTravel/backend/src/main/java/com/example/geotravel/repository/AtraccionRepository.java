package com.example.geotravel.repository;

import com.example.geotravel.model.Atraccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AtraccionRepository extends JpaRepository<Atraccion, Long> {

    Atraccion findByIdAtraccion(Long id);
    List<Atraccion> findAll();
    Atraccion findByNombre(String nombre);

}
