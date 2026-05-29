package com.example.geotravel.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DTRecorridoAtracciones {
    private Long idRecorridoAtracciones;
    private Long idRecorrido;
    private Long idAtraccion;
    private int orden;
}
