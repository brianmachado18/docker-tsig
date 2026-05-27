package com.example.geotravel.service;

import com.example.geotravel.dto.DTRecorrido;
import com.example.geotravel.model.Recorrido;
import com.example.geotravel.repository.RecorridoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RecorridoService {

    @Autowired
    private RecorridoRepository recorridoRepository;

    public void alta(DTRecorrido dtRecorrido){
        recorridoRepository.save(dtRecorrido.dtoToObj());
    }

    public void actualizar(DTRecorrido dtRecorrido){
        recorridoRepository.save(dtRecorrido.dtoToObj());
    }

    public void eliminar(Long idRecorrido){
        recorridoRepository.delete(recorridoRepository.findByIdRecorrido(idRecorrido));
    }

    public List<DTRecorrido> obtenerTodos(){
        List<DTRecorrido> listDto = new ArrayList<>();
        for (Recorrido r : recorridoRepository.findAll()){
            listDto.add(r.objToDto());
        }
        return listDto;
    }

    public DTRecorrido obtenerPorId(Long id){
        return recorridoRepository.findByIdRecorrido(id).objToDto();
    }

    public DTRecorrido obtenerPorNombre(String nombre){
        return recorridoRepository.findByNombre(nombre).objToDto();
    }

}
