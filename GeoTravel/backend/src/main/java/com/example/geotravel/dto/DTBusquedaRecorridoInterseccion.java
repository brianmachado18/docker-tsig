package com.example.geotravel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DTBusquedaRecorridoInterseccion {
    private DTRecorrido recorrido;
    private List<DTZona> zonas;
    private double distanciaMetros;
}
