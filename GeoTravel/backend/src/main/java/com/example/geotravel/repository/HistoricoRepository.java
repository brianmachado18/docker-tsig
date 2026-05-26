package com.example.geotravel.repository;

import com.example.geotravel.model.Historico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistoricoRepository extends JpaRepository<Historico, Long> {

    Historico findByIdHistorico(Long id);
    List<Historico> findAll();

}
