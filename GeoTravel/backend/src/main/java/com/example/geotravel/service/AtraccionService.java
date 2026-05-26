package com.example.geotravel.service;

import com.example.geotravel.model.Atraccion;
import com.example.geotravel.repository.AtraccionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@Service
public class AtraccionService {

    @Autowired
    private AtraccionRepository atraccionRepository;

    public void alta(@RequestBody Atraccion atraccion){
        atraccionRepository.save(atraccion);
    }

    public void actualizar(@RequestBody Atraccion atraccion){
        atraccionRepository.save(atraccion);
    }

    public void eliminar(@RequestBody Atraccion atraccion){
        atraccionRepository.delete(atraccion);
    }

    public List<Atraccion> obtenerTodos(){
        return atraccionRepository.findAll();
    }

    public Atraccion obtenerPorId(Long id){
        return atraccionRepository.findByIdAtraccion(id);
    }

    public Atraccion obtenerPorNombre(String nombre){
        return atraccionRepository.findByNombre(nombre);
    }

}
