package com.example.geotravel.service;

import com.example.geotravel.dto.DTZona;
import com.example.geotravel.model.Zona;
import com.example.geotravel.repository.ZonaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ZonaService {

    @Autowired
    private ZonaRepository zonaRepository;

    public void alta(DTZona dtZona){
        zonaRepository.save(dtZona.dtoToObj());
    }

    public void actualizar(DTZona dtZona){
        zonaRepository.save(dtZona.dtoToObj());
    }

    public void eliminar(Long idZona){
        zonaRepository.delete(zonaRepository.findByIdZona(idZona));
    }

    public List<DTZona> obtenerTodos(){
        List<DTZona> listDto = new ArrayList<>();
        for (Zona z : zonaRepository.findAll()){
            listDto.add(z.objToDto());
        }
        return listDto;
    }

    public DTZona obtenerPorId(Long id){
        return zonaRepository.findByIdZona(id).objToDto();
    }

    public DTZona obtenerPorNombre(String nombre){
        return zonaRepository.findByNombre(nombre).objToDto();
    }

}
