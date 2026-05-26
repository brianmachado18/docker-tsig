package com.example.geotravel.dto;

import com.example.geotravel.model.Atraccion;
import com.example.geotravel.service.ZonaService;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.locationtech.jts.geom.Point;

@Data
@NoArgsConstructor
public class DTAtraccion {
    private Long idAtraccion;
    private Long idZona;
    private String nombre;
    private String descripcion;
    private String clasificacion;
    private String fotoUrl;
    private String geomWkt;

    public Atraccion dtoToObj(){
        Atraccion atraccion = new Atraccion();
        ZonaService zonaService = new ZonaService();
        atraccion.setIdAtraccion(this.getIdZona());
        atraccion.setZona(zonaService.obtenerPorId(this.idZona).dtoToObj());
        atraccion.setNombre(this.getNombre());
        atraccion.setDescripcion(this.getDescripcion());
        atraccion.setClasificacion(this.getClasificacion());
        atraccion.setFotoUrl(this.getFotoUrl());
        WKTReader reader = new WKTReader();
        try {
            atraccion.setGeomWkt((Point)reader.read(this.geomWkt));
        } catch(ParseException e) {
            System.err.println(e.getMessage());
            atraccion.setGeomWkt(null);
        }
        return atraccion;
    }

}
