package com.example.geotravel.dto;

import com.example.geotravel.enums.Estado;
import com.example.geotravel.enums.TipoExperiencia;
import org.locationtech.jts.geom.LineString;

import java.time.LocalDate;

public class DTRecorrido {
    private Long idRecorrido;
    private String nombre;
    private String descripcion;
    private int duracionEstimada;
    private String guiaResponsable;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private TipoExperiencia tipoExperiencia;
    private Estado estado;
    private LineString geomWkt;
}
