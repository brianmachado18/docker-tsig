package com.example.geotravel.service;

import com.example.geotravel.dto.DTRecorrido;
import com.example.geotravel.model.Recorrido;
import com.example.geotravel.repository.RecorridoRepository;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RecorridoService {

    @Autowired
    private RecorridoRepository recorridoRepository;

    public void alta(DTRecorrido dtRecorrido){
        recorridoRepository.save(dtoToObj(dtRecorrido));
    }

    public void actualizar(DTRecorrido dtRecorrido){
        recorridoRepository.save(dtoToObj(dtRecorrido));
    }

    public void eliminar(Long idRecorrido){
        recorridoRepository.delete(recorridoRepository.findByIdRecorrido(idRecorrido));
    }

    public List<DTRecorrido> obtenerTodos(){
        List<DTRecorrido> listDto = new ArrayList<>();
        for (Recorrido r : recorridoRepository.findAll()){
            listDto.add(objToDto(r));
        }
        return listDto;
    }

    public DTRecorrido obtenerPorId(Long id){
        return objToDto(recorridoRepository.findByIdRecorrido(id));
    }

    public Recorrido obtenerObjPorId(Long id){
        return recorridoRepository.findByIdRecorrido(id);
    }

    public DTRecorrido obtenerPorNombre(String nombre){
        return objToDto(recorridoRepository.findByNombre(nombre));
    }

    public Recorrido dtoToObj(DTRecorrido dtRecorrido){
        Recorrido recorrido = new Recorrido();
        recorrido.setIdRecorrido(dtRecorrido.getIdRecorrido());
        recorrido.setNombre(dtRecorrido.getNombre());
        recorrido.setDescripcion(dtRecorrido.getDescripcion());
        recorrido.setDuracionEstimada(dtRecorrido.getDuracionEstimada());
        recorrido.setGuiaResponsable(dtRecorrido.getGuiaResponsable());
        recorrido.setFechaInicio(dtRecorrido.getFechaInicio());
        recorrido.setFechaFin(dtRecorrido.getFechaFin());
        recorrido.setTipoExperiencia(dtRecorrido.getTipoExperiencia());
        recorrido.setEstado(dtRecorrido.getEstado());
        WKTReader reader = new WKTReader();
        try {
            recorrido.setGeomWkt((LineString) reader.read(dtRecorrido.getGeomWkt()));
        } catch(ParseException e) {
            System.err.println(e.getMessage());
            recorrido.setGeomWkt(null);
        }
        return recorrido;
    }

    public DTRecorrido objToDto(Recorrido recorrido){
        DTRecorrido dtRecorrido = new DTRecorrido();
        dtRecorrido.setIdRecorrido(recorrido.getIdRecorrido());
        dtRecorrido.setNombre(recorrido.getNombre());
        dtRecorrido.setDescripcion(recorrido.getDescripcion());
        dtRecorrido.setDuracionEstimada(recorrido.getDuracionEstimada());
        dtRecorrido.setGuiaResponsable(recorrido.getGuiaResponsable());
        dtRecorrido.setFechaInicio(recorrido.getFechaInicio());
        dtRecorrido.setFechaFin(recorrido.getFechaFin());
        dtRecorrido.setTipoExperiencia(recorrido.getTipoExperiencia());
        dtRecorrido.setEstado(recorrido.getEstado());
        dtRecorrido.setGeomWkt(recorrido.getGeomWkt().toString());
        return dtRecorrido;
    }

}
