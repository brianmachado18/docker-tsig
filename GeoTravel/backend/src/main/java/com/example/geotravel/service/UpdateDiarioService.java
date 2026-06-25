package com.example.geotravel.service;

import com.example.geotravel.enums.Estado;
import com.example.geotravel.model.Recorrido;
import com.example.geotravel.repository.RecorridoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UpdateDiarioService {

    @Autowired
    private RecorridoRepository recorridoRepository;

    @Autowired
    private HistoricoService historicoService;

    @Scheduled(cron = "0 0 0 * * ?", zone = "America/Montevideo")
    @Transactional
    public void performDailyTableUpdates() {
        recorridoRepository.updateFechas();

        for (Recorrido r : recorridoRepository.updateEstadoRecorridoFuera()) {
            r.setEstado(Estado.FUERA_DE_ESTACION);
            recorridoRepository.save(r);
            historicoService.registrarCambioEstado(r, r.getEstado());
        }

        for (Recorrido r : recorridoRepository.updateEstadoRecorridoDentro()) {
            r.setEstado(Estado.PENDIENTE);
            recorridoRepository.save(r);
            historicoService.registrarCambioEstado(r, r.getEstado());
        }
    }

}
