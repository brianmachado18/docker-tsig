package com.example.geotravel.dto;

import com.example.geotravel.enums.Estado;
import com.example.geotravel.enums.TipoExperiencia;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
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
    private String geomWkt;
}
