package com.example.geotravel.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DTZona {
    private Long idZona;
    private String nombre;
    private String descripcion;
    private int nivelAtractivo;
    private String observaciones;
    private String geomWkt;
}
