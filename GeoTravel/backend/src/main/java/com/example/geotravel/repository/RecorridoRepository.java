package com.example.geotravel.repository;

import com.example.geotravel.model.Recorrido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecorridoRepository extends JpaRepository<Recorrido, Long> {

    Recorrido findByIdRecorrido(Long id);
    List<Recorrido> findAll();
    Recorrido findByNombre(String nombre);

}
