package com.example.geotravel.dto;

import com.example.geotravel.enums.Estado;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DTHistorico {
    private Long idHistorico;
    private Long idRecorrido;
    private String fechaCambio;
    private Estado estado;
}
