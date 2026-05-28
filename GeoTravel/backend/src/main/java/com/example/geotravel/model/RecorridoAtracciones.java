package com.example.geotravel.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecorridoAtracciones {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idRecorridoAtracciones;

    @ManyToOne
    @JoinColumn(name = "idRecorrido")
    private Recorrido recorrido;

    @ManyToOne
    @JoinColumn(name = "idAtraccion")
    private Atraccion atraccion;

    private int orden;
}
