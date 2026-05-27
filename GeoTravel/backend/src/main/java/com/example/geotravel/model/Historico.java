package com.example.geotravel.model;

import com.example.geotravel.dto.DTHistorico;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Historico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idHistorico;

    @ManyToOne
    @JoinColumn(name = "idRecorrido")
    private Recorrido recorrido;

    private String fechaCambio;

    public DTHistorico objToDto(){
        DTHistorico dtHistorico = new DTHistorico();
        dtHistorico.setIdHistorico(this.getIdHistorico());
        dtHistorico.setIdRecorrido(this.getRecorrido().getIdRecorrido());
        dtHistorico.setFechaCambio(this.getFechaCambio());
        return dtHistorico;
    }

}
