package com.example.geotravel.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DTAtraccion {
    private Long idAtraccion;
    private Long idZona;
    private String nombre;
    private String descripcion;
    private String clasificacion;
    private String fotoUrl;
    private String geomWkt;
}
