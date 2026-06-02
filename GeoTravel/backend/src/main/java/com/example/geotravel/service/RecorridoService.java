package com.example.geotravel.service;

import com.example.geotravel.dto.DTRecorrido;
import com.example.geotravel.model.Recorrido;
import com.example.geotravel.model.Zona;
import com.example.geotravel.repository.RecorridoRepository;
import com.example.geotravel.repository.ZonaRepository;
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

    @Autowired
    private EstacionService estacionService;

    @Autowired
    private ZonaRepository zonaRepository;

    public void alta(DTRecorrido dtRecorrido) throws Exception{
        validarRecorrido(dtRecorrido);
        recorridoRepository.save(dtoToObj(dtRecorrido));
    }

    public void actualizar(DTRecorrido dtRecorrido) throws Exception{
        validarRecorrido(dtRecorrido);
        recorridoRepository.save(dtoToObj(dtRecorrido));
    }

    public void eliminar(Long idRecorrido){
        recorridoRepository.delete(recorridoRepository.findByIdRecorrido(idRecorrido));
    }

    public Boolean existe(Long idRecorrido){
        return recorridoRepository.existsByIdRecorrido(idRecorrido);
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

    public Recorrido dtoToObj(DTRecorrido dtRecorrido){
        Recorrido recorrido = new Recorrido();
        recorrido.setIdRecorrido(dtRecorrido.getIdRecorrido());
        recorrido.setEstacion(estacionService.obtenerPorId(dtRecorrido.getIdEstacion()));
        recorrido.setNombre(dtRecorrido.getNombre());
        recorrido.setDescripcion(dtRecorrido.getDescripcion());
        recorrido.setDuracionEstimada(dtRecorrido.getDuracionEstimada());
        recorrido.setGuiaResponsable(dtRecorrido.getGuiaResponsable());
        recorrido.setTipoExperiencia(dtRecorrido.getTipoExperiencia());
        recorrido.setEstado(dtRecorrido.getEstado());

        if (dtRecorrido.getZonas() == null) {
            recorrido.setZonas(new ArrayList<>());
        } else {
            List<Zona> zonasList = new ArrayList<>();
            for (Long z : dtRecorrido.getZonas()){
                zonasList.add(zonaRepository.findByIdZona(z));
            }
            recorrido.setZonas(zonasList);
        }

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
        dtRecorrido.setIdEstacion(recorrido.getEstacion().getIdEstacion());
        dtRecorrido.setNombre(recorrido.getNombre());
        dtRecorrido.setDescripcion(recorrido.getDescripcion());
        dtRecorrido.setDuracionEstimada(recorrido.getDuracionEstimada());
        dtRecorrido.setGuiaResponsable(recorrido.getGuiaResponsable());
        dtRecorrido.setTipoExperiencia(recorrido.getTipoExperiencia());
        dtRecorrido.setEstado(recorrido.getEstado());
        dtRecorrido.setZonas(new ArrayList<>());
        dtRecorrido.setGeomWkt(recorrido.getGeomWkt().toString());
        return dtRecorrido;
    }

    public void validarRecorrido(DTRecorrido dtRecorrido) throws Exception{
        if (dtRecorrido.getNombre() == null || dtRecorrido.getNombre().trim().isEmpty())
            throw new Exception("Nombre requerido.");
        if (dtRecorrido.getDescripcion() == null || dtRecorrido.getDescripcion().trim().isEmpty())
            throw new Exception("Descripcion requerida.");
        if (dtRecorrido.getDuracionEstimada()  <= 0)
            throw new Exception("Duracion requerida.");
        if (dtRecorrido.getGuiaResponsable() == null || dtRecorrido.getGuiaResponsable().trim().isEmpty())
            throw new Exception("Guia responsable requerido.");
        if (dtRecorrido.getIdEstacion() == null || dtRecorrido.getIdEstacion() <= 0)
            throw new Exception("Estacion invalida.");
        if (dtRecorrido.getTipoExperiencia() == null)
            throw new Exception("Experiencia requerida.");
        if (dtRecorrido.getEstado() == null)
            throw new Exception("Estado requerido.");
        if (dtRecorrido.getGeomWkt() == null || dtRecorrido.getGeomWkt().trim().isEmpty())
            throw new Exception("Linea requerida.");
        try {
            WKTReader reader = new WKTReader();
            LineString l = (LineString)reader.read(dtRecorrido.getGeomWkt());
        } catch(ParseException e) {
            throw new Exception("Linea invalida.");
        }
    }

}
