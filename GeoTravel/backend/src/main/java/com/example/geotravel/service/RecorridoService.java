package com.example.geotravel.service;

import com.example.geotravel.model.Recorrido;
import com.example.geotravel.repository.RecorridoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@Service
public class RecorridoService {

    @Autowired
    private RecorridoRepository recorridoRepository;

    public void alta(@RequestBody Recorrido recorrido){
        recorridoRepository.save(recorrido);
    }

    public void actualizar(@RequestBody Recorrido recorrido){
        recorridoRepository.save(recorrido);
    }

    public void eliminar(@RequestBody Recorrido recorrido){
        recorridoRepository.delete(recorrido);
    }

    public List<Recorrido> obtenerTodos(){
        return recorridoRepository.findAll();
    }

    public Recorrido obtenerPorId(Long id){
        return recorridoRepository.findByIdRecorrido(id);
    }

    public Recorrido obtenerPorNombre(String nombre){
        return recorridoRepository.findByNombre(nombre);
    }

}
