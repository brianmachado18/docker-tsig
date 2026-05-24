package com.example.geotravel.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;
import org.locationtech.jts.geom.LineString;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Recorrido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idRecorrido;

    private String nombre;
    private String descripcion;
    private int duracionEstimada;
    private String guiaResponsable;
    private String tipoExperiencia;
    private String estado;
    private int mesInicioTemporada;
    private int mesFinTemporada;

    @Column(columnDefinition = "geography(LineString,4326)")
    //@Type(type = "jts_geometry")
    //@Type(type="org.hibernate.spatial.GeometryType")
    private LineString geomWkt;
}
