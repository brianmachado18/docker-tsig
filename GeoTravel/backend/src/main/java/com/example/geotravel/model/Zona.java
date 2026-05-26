package com.example.geotravel.model;

import com.example.geotravel.dto.DTZona;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Polygon;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Zona {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idZona;

    private String nombre;
    private String descripcion;
    private int nivelAtractivo;
    private String observaciones;

    @Column(columnDefinition = "geography(Polygon,4326)")
    private Polygon geomWkt;

    public DTZona objToDto(){
        DTZona dtZona = new DTZona();
        dtZona.setIdZona(this.getIdZona());
        dtZona.setDescripcion(this.getDescripcion());
        dtZona.setNombre(this.getNombre());
        dtZona.setObservaciones(this.getObservaciones());
        dtZona.setNivelAtractivo(this.getNivelAtractivo());
        dtZona.setGeomWkt(this.getGeomWkt().toString());
        return dtZona;
    }

}
