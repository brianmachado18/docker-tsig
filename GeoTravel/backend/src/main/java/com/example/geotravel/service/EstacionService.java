package com.example.geotravel.service;

import com.example.geotravel.model.Estacion;
import com.example.geotravel.repository.EstacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EstacionService {

    @Autowired
    private EstacionRepository estacionRepository;

    public List<Estacion> obtenerTodos() {
        return estacionRepository.findAll();
    }

    public Boolean existe(Long id) {
        return estacionRepository.existsByIdEstacion(id);
    }

    public Estacion obtenerPorId(Long id) {
        return estacionRepository.findByIdEstacion(id);
    }

}
