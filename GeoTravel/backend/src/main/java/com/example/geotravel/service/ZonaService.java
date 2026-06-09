package com.example.geotravel.service;

import com.example.geotravel.dto.DTZona;
import com.example.geotravel.model.Recorrido;
import com.example.geotravel.model.Zona;
import com.example.geotravel.repository.RecorridoRepository;
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

    @Autowired
    private RecorridoRepository recorridoRepository;

    @Autowired
    private GeocodingService geocodingService;

    public void alta(DTZona dtZona) throws Exception{
        validarZona(dtZona);
        zonaRepository.save(dtoToObj(dtZona));
    }

    public void actualizar(DTZona dtZona) throws Exception{
        validarZona(dtZona);
        zonaRepository.save(dtoToObj(dtZona));
    }

    public void eliminar(Long idZona){
        zonaRepository.delete(zonaRepository.findByIdZona(idZona));
    }

    public Boolean existe(Long idZona){
        return zonaRepository.existsByIdZona(idZona);
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

    public DTZona obtenerPorDireccion(String direccion) throws Exception{
        GeocodingService.GeocodedPoint geocodedPoint = geocodingService.geocode(direccion);
        String pointWkt = String.format("POINT(%s %s)", geocodedPoint.lon(), geocodedPoint.lat());

        List<Zona> zonas = zonaRepository.findAllByPoint(pointWkt);
        if (zonas.isEmpty()) {
            throw new Exception("No existe una zona registrada para esa direccion.");
        }

        return objToDto(zonas.get(0));
    }

    public Zona obtenerObjPorId(Long id){
        return zonaRepository.findByIdZona(id);
    }

    public Zona dtoToObj(DTZona dtZona){
        Zona zona = new Zona();
        zona.setIdZona(dtZona.getIdZona());
        zona.setDescripcion(dtZona.getDescripcion());
        zona.setNombre(dtZona.getNombre());
        zona.setObservaciones(dtZona.getObservaciones());
        zona.setNivelAtractivo(dtZona.getNivelAtractivo());
        WKTReader reader = new WKTReader();

        if (dtZona.getRecorridos() == null) {
            zona.setRecorridos(new ArrayList<>());
        } else {
            List<Recorrido> zonasList = new ArrayList<>();
            for (Long r : dtZona.getRecorridos()){
                zonasList.add(recorridoRepository.findByIdRecorrido(r));
            }
            zona.setRecorridos(zonasList);
        }

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
        dtZona.setRecorridos(new ArrayList<>());
        dtZona.setGeomWkt(zona.getGeomWkt().toString());
        return dtZona;
    }

    public void validarZona(DTZona dtZona) throws Exception{
        if (dtZona.getNombre() == null || dtZona.getNombre().trim().isEmpty())
            throw new Exception("Nombre requerido.");
        if (dtZona.getDescripcion() == null || dtZona.getDescripcion().trim().isEmpty())
            throw new Exception("Descripcion requerida.");
        if (dtZona.getNivelAtractivo()  <= 0)
            throw new Exception("Nivel de atractivo requerido.");
        if (dtZona.getObservaciones() == null || dtZona.getObservaciones().trim().isEmpty())
            throw new Exception("Observaciones requeridas.");
        if (dtZona.getGeomWkt() == null || dtZona.getGeomWkt().trim().isEmpty())
            throw new Exception("Poligono requerido.");
        try {
            WKTReader reader = new WKTReader();
            Polygon p = (Polygon) reader.read(dtZona.getGeomWkt());
        } catch(ParseException e) {
            throw new Exception("Poligono invalido.");
        }
    }

}
