package com.example.geotravel.model;

import com.example.geotravel.enums.Clasificacion;
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

    private String nombre;
    private String descripcion;
    private String fotoUrl;

    //@Enumerated(EnumType.STRING)
    private Clasificacion clasificacion;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point geomWkt;
}
