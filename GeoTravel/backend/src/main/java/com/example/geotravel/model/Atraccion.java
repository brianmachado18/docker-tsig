package com.example.geotravel.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;
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
}
