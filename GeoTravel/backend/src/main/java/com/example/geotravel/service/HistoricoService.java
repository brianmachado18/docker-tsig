package com.example.geotravel.service;

import com.example.geotravel.dto.DTHistorico;
import com.example.geotravel.enums.Estado;
import com.example.geotravel.model.Historico;
import com.example.geotravel.model.Recorrido;
import com.example.geotravel.repository.HistoricoRepository;
import com.example.geotravel.repository.RecorridoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class HistoricoService {

    @Autowired
    private HistoricoRepository historicoRepository;

    @Autowired
    private RecorridoRepository recorridoRepository;

    public void alta(DTHistorico dtHistorico){
        historicoRepository.save(dtoToObj(dtHistorico));
    }

    public void actualizar(DTHistorico dtHistorico){
        historicoRepository.save(dtoToObj(dtHistorico));
    }

    public void eliminar(Long idHistorico){
        historicoRepository.delete(historicoRepository.findByIdHistorico(idHistorico));
    }

    public Boolean existe(Long idHistorico){
        return historicoRepository.existsByIdHistorico(idHistorico);
    }

    public List<DTHistorico> obtenerTodos(){
        List<DTHistorico> listDto = new ArrayList<>();
        for (Historico h : historicoRepository.findAll()){
            listDto.add(objToDto(h));
        }
        return listDto;
    }

    public DTHistorico obtenerPorId(Long id){
        return objToDto(historicoRepository.findByIdHistorico(id));
    }

    public List<DTHistorico> obtenerPorRecorrido(Long idRecorrido){
        List<DTHistorico> listDto = new ArrayList<>();
        for (Historico h : historicoRepository.findByRecorrido_IdRecorridoOrderByIdHistoricoAsc(idRecorrido)){
            listDto.add(objToDto(h));
        }
        return listDto;
    }

    public void registrarCambioEstado(Recorrido recorrido, Estado estado){
        Historico historico = new Historico();
        historico.setRecorrido(recorrido);
        historico.setEstado(estado);
        historico.setFechaCambio(LocalDate.now().toString());
        historicoRepository.save(historico);
    }

    public void eliminarPorRecorrido(Long idRecorrido){
        List<Historico> entradas = historicoRepository.findByRecorrido_IdRecorridoOrderByIdHistoricoAsc(idRecorrido);
        historicoRepository.deleteAll(entradas);
    }

    public Historico dtoToObj(DTHistorico dtHistorico){
        Historico historico = new Historico();
        historico.setIdHistorico(dtHistorico.getIdHistorico());
        historico.setRecorrido(recorridoRepository.findByIdRecorrido(dtHistorico.getIdRecorrido()));
        historico.setFechaCambio(dtHistorico.getFechaCambio());
        historico.setEstado(dtHistorico.getEstado());
        return historico;
    }

    public DTHistorico objToDto(Historico historico){
        DTHistorico dtHistorico = new DTHistorico();
        dtHistorico.setIdHistorico(historico.getIdHistorico());
        dtHistorico.setIdRecorrido(historico.getRecorrido().getIdRecorrido());
        dtHistorico.setFechaCambio(historico.getFechaCambio());
        dtHistorico.setEstado(historico.getEstado());
        return dtHistorico;
    }

}
