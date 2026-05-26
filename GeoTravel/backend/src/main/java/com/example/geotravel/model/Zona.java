package com.example.geotravel.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;
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
}
