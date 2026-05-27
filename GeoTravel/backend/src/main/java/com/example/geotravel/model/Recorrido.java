package com.example.geotravel.model;

import com.example.geotravel.enums.Estado;
import com.example.geotravel.enums.TipoExperiencia;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.LineString;

import java.time.LocalDate;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Recorrido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idRecorrido;

    private String nombre;
    private String descripcion;
    private int duracionEstimada;
    private String guiaResponsable;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;

    @Enumerated(EnumType.STRING)
    private TipoExperiencia tipoExperiencia;

    @Enumerated(EnumType.STRING)
    private Estado estado;

    @Column(columnDefinition = "geography(LineString,4326)")
    private LineString geomWkt;
}
