package com.example.geotravel.service;

import com.example.geotravel.dto.DTRecorridoAtracciones;
import com.example.geotravel.model.RecorridoAtracciones;
import com.example.geotravel.repository.RecorridoAtraccionesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RecorridoAtraccionesService {

    @Autowired
    private RecorridoAtraccionesRepository recorridoAtraccionesRepository;

    @Autowired
    private RecorridoService recorridoService;

    @Autowired
    private AtraccionService atraccionService;

    public void alta(RecorridoAtracciones recorridoAtracciones){
        recorridoAtraccionesRepository.save(recorridoAtracciones);
    }

    public void eliminar(Long idRecorridoAtraccion){
        recorridoAtraccionesRepository.delete(recorridoAtraccionesRepository.findByIdRecorridoAtracciones(idRecorridoAtraccion));
    }

    public Boolean existe(Long idRecorridoAtracciones){
        return recorridoAtraccionesRepository.existsByIdRecorridoAtracciones(idRecorridoAtracciones);
    }

    public Boolean existe(Long idRecorrido, Long idAtraccion){
        return recorridoAtraccionesRepository.existsByRecorridoAndAtraccion(recorridoService.obtenerObjPorId(idRecorrido), atraccionService.obtenerObjPorId(idAtraccion));
    }

    public Boolean existe(Long idRecorrido, int orden){
        return recorridoAtraccionesRepository.existsByRecorridoAndOrden(recorridoService.obtenerObjPorId(idRecorrido), orden);
    }

    public List<DTRecorridoAtracciones> obtenerPorIdRecorrido(Long idRecorrido){
        List<DTRecorridoAtracciones> listDto = new ArrayList<>();
        for (RecorridoAtracciones ra : recorridoAtraccionesRepository.findByRecorrido(recorridoService.obtenerObjPorId(idRecorrido))){
            listDto.add(objToDto(ra));
        }
        return listDto;
    }

    public RecorridoAtracciones dtoToObj(DTRecorridoAtracciones dtRecorridoAtracciones){
        RecorridoAtracciones recorridoAtracciones = new RecorridoAtracciones();
        recorridoAtracciones.setIdRecorridoAtracciones(dtRecorridoAtracciones.getIdRecorridoAtracciones());
        recorridoAtracciones.setRecorrido(recorridoService.obtenerObjPorId(dtRecorridoAtracciones.getIdRecorrido()));
        recorridoAtracciones.setAtraccion(atraccionService.obtenerObjPorId(dtRecorridoAtracciones.getIdAtraccion()));
        recorridoAtracciones.setOrden(dtRecorridoAtracciones.getOrden());
        return recorridoAtracciones;
    }

    public DTRecorridoAtracciones objToDto(RecorridoAtracciones recorridoAtracciones){
        DTRecorridoAtracciones dtRecorridoAtracciones = new DTRecorridoAtracciones();
        dtRecorridoAtracciones.setIdRecorridoAtracciones(recorridoAtracciones.getIdRecorridoAtracciones());
        dtRecorridoAtracciones.setIdRecorrido(recorridoAtracciones.getRecorrido().getIdRecorrido());
        dtRecorridoAtracciones.setIdAtraccion(recorridoAtracciones.getAtraccion().getIdAtraccion());
        dtRecorridoAtracciones.setOrden(recorridoAtracciones.getOrden());
        return dtRecorridoAtracciones;
    }

}
