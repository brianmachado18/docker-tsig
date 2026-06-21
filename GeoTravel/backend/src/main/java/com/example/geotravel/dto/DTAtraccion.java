package com.example.geotravel.dto;

import com.example.geotravel.enums.Clasificacion;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DTAtraccion {
    private Long idAtraccion;
    private String nombre;
    private String descripcion;
    private Clasificacion clasificacion;
    private String fotoUrl;
    private String geomWkt;
    private int cantidadDeAparicionesEnRecorridos;
}
