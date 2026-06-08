package com.example.geotravel.dto;

import com.example.geotravel.enums.Estado;
import com.example.geotravel.enums.TipoExperiencia;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class DTRecorrido {
    private Long idRecorrido;
    private Integer mesInicio;
    private Integer mesFin;
    private String nombre;
    private String descripcion;
    private int duracionEstimada;
    private String guiaResponsable;
    private TipoExperiencia tipoExperiencia;
    private Estado estado;
    private String geomWkt;
    private List<Long> zonas;
    private List<Long> atracciones;
}
