package com.example.geotravel.dto;

import com.example.geotravel.enums.Estado;
import com.example.geotravel.enums.TipoExperiencia;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DTRecorrido {
    private Long idRecorrido;
    private Long idEstacion;
    private String nombre;
    private String descripcion;
    private int duracionEstimada;
    private String guiaResponsable;
    private TipoExperiencia tipoExperiencia;
    private Estado estado;
    private String geomWkt;
}
