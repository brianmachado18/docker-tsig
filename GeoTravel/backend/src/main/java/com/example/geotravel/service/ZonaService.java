package com.example.geotravel.service;

import com.example.geotravel.dto.DTZona;
import com.example.geotravel.model.Zona;
import com.example.geotravel.repository.ZonaRepository;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ZonaService {

    @Autowired
    private ZonaRepository zonaRepository;

    public void alta(DTZona dtZona){
        zonaRepository.save(dtoToObj(dtZona));
    }

    public void actualizar(DTZona dtZona){
        zonaRepository.save(dtoToObj(dtZona));
    }

    public void eliminar(Long idZona){
        zonaRepository.delete(zonaRepository.findByIdZona(idZona));
    }

    public List<DTZona> obtenerTodos(){
        List<DTZona> listDto = new ArrayList<>();
        for (Zona z : zonaRepository.findAll()){
            listDto.add(objToDto(z));
        }
        return listDto;
    }

    public DTZona obtenerPorId(Long id){
        return objToDto(zonaRepository.findByIdZona(id));
    }

    public Zona obtenerObjPorId(Long id){
        return zonaRepository.findByIdZona(id);
    }

    public DTZona obtenerPorNombre(String nombre){
        return objToDto(zonaRepository.findByNombre(nombre));
    }

    public Zona dtoToObj(DTZona dtZona){
        Zona zona = new Zona();
        zona.setIdZona(dtZona.getIdZona());
        zona.setDescripcion(dtZona.getDescripcion());
        zona.setNombre(dtZona.getNombre());
        zona.setObservaciones(dtZona.getObservaciones());
        zona.setNivelAtractivo(dtZona.getNivelAtractivo());
        WKTReader reader = new WKTReader();
        try {
            zona.setGeomWkt((Polygon)reader.read(dtZona.getGeomWkt()));
        } catch(ParseException e) {
            System.err.println(e.getMessage());
            zona.setGeomWkt(null);
        }
        return zona;
    }

    public DTZona objToDto(Zona zona){
        DTZona dtZona = new DTZona();
        dtZona.setIdZona(zona.getIdZona());
        dtZona.setDescripcion(zona.getDescripcion());
        dtZona.setNombre(zona.getNombre());
        dtZona.setObservaciones(zona.getObservaciones());
        dtZona.setNivelAtractivo(zona.getNivelAtractivo());
        dtZona.setGeomWkt(zona.getGeomWkt().toString());
        return dtZona;
    }

}
