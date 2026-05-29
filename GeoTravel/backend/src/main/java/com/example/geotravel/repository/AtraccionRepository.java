package com.example.geotravel.repository;

import com.example.geotravel.model.Atraccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AtraccionRepository extends JpaRepository<Atraccion, Long> {

    Boolean existsByIdAtraccion(Long id);
    Atraccion findByIdAtraccion(Long id);
    List<Atraccion> findAll();

}
