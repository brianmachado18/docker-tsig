package com.example.geotravel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DTZonaActiva {
    private Long idZona;
    private String nombre;
    private String descripcion;
    private int nivelAtractivo;
    private String observaciones;
    private String geomWkt;
    private int cantidadRecorridosActivos;
    private List<DTRecorridoActivoResumen> recorridosActivos;
}
