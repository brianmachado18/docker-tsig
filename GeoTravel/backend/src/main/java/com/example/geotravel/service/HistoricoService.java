package com.example.geotravel.service;

import com.example.geotravel.dto.DTHistorico;
import com.example.geotravel.model.Historico;
import com.example.geotravel.repository.HistoricoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class HistoricoService {

    @Autowired
    private HistoricoRepository historicoRepository;

    public void alta(DTHistorico dtHistorico){
        historicoRepository.save(dtHistorico.dtoToObj());
    }

    public void actualizar(DTHistorico dtHistorico){
        historicoRepository.save(dtHistorico.dtoToObj());
    }

    public void eliminar(Long idHistorico){
        historicoRepository.delete(historicoRepository.findByIdHistorico(idHistorico));
    }

    public List<DTHistorico> obtenerTodos(){
        List<DTHistorico> listDto = new ArrayList<>();
        for (Historico h : historicoRepository.findAll()){
            listDto.add(h.objToDto());
        }
        return listDto;
    }

    public DTHistorico obtenerPorId(Long id){
        return historicoRepository.findByIdHistorico(id).objToDto();
    }

}
