package com.example.geotravel.dto;

import com.example.geotravel.model.Historico;
import com.example.geotravel.service.RecorridoService;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DTHistorico {
    private Long idHistorico;
    private Long idRecorrido;
    private String fechaCambio;

    public Historico dtoToObj(){
        Historico historico = new Historico();
        RecorridoService recorridoService = new RecorridoService();
        historico.setIdHistorico(this.getIdHistorico());
        historico.setRecorrido(recorridoService.obtenerPorId(this.idRecorrido).dtoToObj());
        historico.setFechaCambio(this.getFechaCambio());
        return historico;
    }
}
