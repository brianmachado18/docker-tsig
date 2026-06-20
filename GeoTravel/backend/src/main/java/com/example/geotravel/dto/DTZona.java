package com.example.geotravel.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class DTZona {
    private Long idZona;
    private String nombre;
    private String descripcion;
    private int nivelAtractivo;
    private String observaciones;
    private String geomWkt;
    private List<Long> recorridos;
    private List<Long> atracciones;
}
