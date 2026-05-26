package com.example.geotravel.service;

import com.example.geotravel.model.Historico;
import com.example.geotravel.repository.HistoricoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@Service
public class HistoricoService {

    @Autowired
    private HistoricoRepository historicoRepository;

    public void alta(@RequestBody Historico historico){
        historicoRepository.save(historico);
    }

    public void actualizar(@RequestBody Historico historico){
        historicoRepository.save(historico);
    }

    public void eliminar(@RequestBody Historico historico){
        historicoRepository.delete(historico);
    }

    public List<Historico> obtenerTodos(){
        return historicoRepository.findAll();
    }

    public Historico obtenerPorId(Long id){
        return historicoRepository.findByIdHistorico(id);
    }

}
