package com.example.geotravel.controller;

import com.example.geotravel.model.Estacion;
import com.example.geotravel.service.EstacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/estacion")
public class EstacionController {

    @Autowired
    private EstacionService estacionService;

    @GetMapping("/buscar/todos")
    public ResponseEntity<List<Estacion>> obtenerTodos(){
        try{
            return ResponseEntity.ok().body(estacionService.obtenerTodos());
        } catch (Exception e){
            return ResponseEntity.badRequest().body(Collections.emptyList());
        }
    }

    @GetMapping("/buscar/id")
    public ResponseEntity<Estacion> obtenerPorId(@RequestParam Long id){
        try{
            return ResponseEntity.ok().body(estacionService.obtenerPorId(id));
        } catch (Exception e){
            return ResponseEntity.badRequest().body(null);
        }
    }

}
