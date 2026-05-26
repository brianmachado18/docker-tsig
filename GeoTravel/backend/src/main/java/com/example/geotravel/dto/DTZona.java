package com.example.geotravel.dto;

import com.example.geotravel.model.Zona;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;

@Data
@NoArgsConstructor
public class DTZona {
    private Long idZona;
    private String nombre;
    private String descripcion;
    private int nivelAtractivo;
    private String observaciones;
    private String geomWkt;

    public Zona dtoToObj(){
        Zona zona = new Zona();
        zona.setIdZona(this.getIdZona());
        zona.setDescripcion(this.getDescripcion());
        zona.setNombre(this.getNombre());
        zona.setObservaciones(this.getObservaciones());
        zona.setNivelAtractivo(this.getNivelAtractivo());
        WKTReader reader = new WKTReader();
        try {
            zona.setGeomWkt((Polygon)reader.read(this.geomWkt));

        } catch(ParseException e) {
            System.err.println(e.getMessage());
            zona.setGeomWkt(null);
        }
        return zona;
    }
}
