package com.example.geotravel.service;

import com.example.geotravel.dto.DTAtraccion;
import com.example.geotravel.model.Atraccion;
import com.example.geotravel.repository.AtraccionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AtraccionService {

    @Autowired
    private AtraccionRepository atraccionRepository;

    public void alta(DTAtraccion dtAtraccion){
        atraccionRepository.save(dtAtraccion.dtoToObj());
    }

    public void actualizar(DTAtraccion dtAtraccion){
        atraccionRepository.save(dtAtraccion.dtoToObj());
    }

    public void eliminar(Long idAtraccion){
        atraccionRepository.delete(atraccionRepository.findByIdAtraccion(idAtraccion));
    }

    public List<DTAtraccion> obtenerTodos(){
        List<DTAtraccion> listDto = new ArrayList<>();
        for (Atraccion a : atraccionRepository.findAll()){
            listDto.add(a.objToDto());
        }
        return listDto;
    }

    public DTAtraccion obtenerPorId(Long id){
        return atraccionRepository.findByIdAtraccion(id).objToDto();
    }

    public DTAtraccion obtenerPorNombre(String nombre){
        return atraccionRepository.findByNombre(nombre).objToDto();
    }

}
