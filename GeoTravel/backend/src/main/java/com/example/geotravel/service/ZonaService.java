package com.example.geotravel.service;

import com.example.geotravel.model.Zona;
import com.example.geotravel.repository.ZonaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@Service
public class ZonaService {

    @Autowired
    private ZonaRepository zonaRepository;

    public void alta(@RequestBody Zona zona){
        zonaRepository.save(zona);
    }

    public void actualizar(@RequestBody Zona zona){
        zonaRepository.save(zona);
    }

    public void eliminar(@RequestBody Zona zona){
        zonaRepository.delete(zona);
    }

    public List<Zona> obtenerTodos(){
        return zonaRepository.findAll();
    }

    public Zona obtenerPorId(Long id){
        return zonaRepository.findByIdZona(id);
    }

    public Zona obtenerPorNombre(String nombre){
        return zonaRepository.findByNombre(nombre);
    }

}
