package com.example.geotravel.dto;

import com.example.geotravel.enums.Estado;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DTRecorridoActivoResumen {
    private Long idRecorrido;
    private String nombre;
    private String descripcion;
    private Estado estado;
    private String geomWkt;
}
