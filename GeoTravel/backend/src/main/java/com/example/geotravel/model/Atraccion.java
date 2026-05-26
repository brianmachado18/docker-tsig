package com.example.geotravel.model;

import com.example.geotravel.dto.DTAtraccion;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Point;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Atraccion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idAtraccion;

    @ManyToOne
    @JoinColumn(name = "idZona")
    private Zona zona;

    private String nombre;
    private String descripcion;
    private String clasificacion;
    private String fotoUrl;

    @Column(columnDefinition = "geography(Point,4326)")
    private Point geomWkt;

    public DTAtraccion objToDto(){
        DTAtraccion dtAtraccion = new DTAtraccion();
        dtAtraccion.setIdAtraccion(this.getIdAtraccion());
        dtAtraccion.setIdZona(this.getZona().getIdZona());
        dtAtraccion.setNombre(this.getNombre());
        dtAtraccion.setDescripcion(this.getDescripcion());
        dtAtraccion.setClasificacion(this.getClasificacion());
        dtAtraccion.setFotoUrl(this.getFotoUrl());
        dtAtraccion.setGeomWkt(this.getGeomWkt().toString());
        return dtAtraccion;
    }
}
