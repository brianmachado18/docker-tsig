package com.example.geotravel.service;

import com.example.geotravel.dto.DTAtraccion;
import com.example.geotravel.model.Atraccion;
import com.example.geotravel.repository.AtraccionRepository;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AtraccionService {

    @Autowired
    private AtraccionRepository atraccionRepository;

    @Autowired
    private ZonaService zonaService;

    public void alta(DTAtraccion dtAtraccion) throws Exception{
        validarAtraccion(dtAtraccion);
        atraccionRepository.save(dtoToObj(dtAtraccion));
    }

    public void actualizar(DTAtraccion dtAtraccion) throws Exception{
        validarAtraccion(dtAtraccion);
        atraccionRepository.save(dtoToObj(dtAtraccion));
    }

    public void eliminar(Long idAtraccion){
        atraccionRepository.delete(atraccionRepository.findByIdAtraccion(idAtraccion));
    }

    public Boolean existe(Long idAtraccion){
        return atraccionRepository.existsByIdAtraccion(idAtraccion);
    }

    public List<DTAtraccion> obtenerTodos(){
        List<DTAtraccion> listDto = new ArrayList<>();
        for (Atraccion a : atraccionRepository.findAll()){
            listDto.add(objToDto(a));
        }
        return listDto;
    }

    public DTAtraccion obtenerPorId(Long id){
        return objToDto(atraccionRepository.findByIdAtraccion(id));
    }

    public Atraccion obtenerObjPorId(Long id){
        return atraccionRepository.findByIdAtraccion(id);
    }

    public Atraccion dtoToObj(DTAtraccion dtAtraccion){
        Atraccion atraccion = new Atraccion();
        atraccion.setIdAtraccion(dtAtraccion.getIdAtraccion());
        atraccion.setNombre(dtAtraccion.getNombre());
        atraccion.setDescripcion(dtAtraccion.getDescripcion());
        atraccion.setClasificacion(dtAtraccion.getClasificacion());
        atraccion.setFotoUrl(dtAtraccion.getFotoUrl());
        WKTReader reader = new WKTReader();
        try {
            atraccion.setGeomWkt((Point)reader.read(dtAtraccion.getGeomWkt()));
        } catch(ParseException e) {
            System.err.println(e.getMessage());
            atraccion.setGeomWkt(null);
        }
        return atraccion;
    }

    public DTAtraccion objToDto(Atraccion atraccion){
        DTAtraccion dtAtraccion = new DTAtraccion();
        dtAtraccion.setIdAtraccion(atraccion.getIdAtraccion());
        dtAtraccion.setNombre(atraccion.getNombre());
        dtAtraccion.setDescripcion(atraccion.getDescripcion());
        dtAtraccion.setClasificacion(atraccion.getClasificacion());
        dtAtraccion.setFotoUrl(atraccion.getFotoUrl());
        dtAtraccion.setGeomWkt(atraccion.getGeomWkt().toString());
        return dtAtraccion;
    }

    public void validarAtraccion(DTAtraccion dtAtraccion) throws Exception{
        if (dtAtraccion.getNombre() == null || dtAtraccion.getNombre().trim().isEmpty())
            throw new Exception("Nombre requerido.");
        if (dtAtraccion.getClasificacion() == null || dtAtraccion.getClasificacion().trim().isEmpty())
            throw new Exception("Clasificacion requerida.");
        if (dtAtraccion.getDescripcion() == null || dtAtraccion.getDescripcion().trim().isEmpty())
            throw new Exception("Descripcion requerida.");
        if (dtAtraccion.getGeomWkt() == null || dtAtraccion.getGeomWkt().trim().isEmpty())
            throw new Exception("Punto requerido.");
        try {
            WKTReader reader = new WKTReader();
            Point p = (Point)reader.read(dtAtraccion.getGeomWkt());
        } catch(ParseException e) {
            throw new Exception("Punto invalido.");
        }
    }

}
