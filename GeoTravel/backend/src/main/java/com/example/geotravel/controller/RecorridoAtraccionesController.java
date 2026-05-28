package com.example.geotravel.controller;

import com.example.geotravel.dto.DTRecorridoAtracciones;
import com.example.geotravel.service.RecorridoAtraccionesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recorrido-atracciones")
public class RecorridoAtraccionesController {

    @Autowired
    RecorridoAtraccionesService recorridoAtraccionesService;

    @PostMapping("/alta")
    public ResponseEntity<String> altaRecorridoAtracciones(@RequestBody DTRecorridoAtracciones dtRecorridoAtracciones){
        try{
            if (!recorridoAtraccionesService.existe(dtRecorridoAtracciones.getIdRecorrido(), dtRecorridoAtracciones.getIdAtraccion())) {
                if (!recorridoAtraccionesService.existe(dtRecorridoAtracciones.getIdRecorrido(), dtRecorridoAtracciones.getOrden())){
                    recorridoAtraccionesService.alta(recorridoAtraccionesService.dtoToObj(dtRecorridoAtracciones));
                    return ResponseEntity.ok().body("Alta completada.");
                } else {
                    return ResponseEntity.ok().body("El orden no puede ser repetido.");
                }
            } else {
                return ResponseEntity.ok().body("Relacion recorrido-atraccion ya existe.");
            }
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/eliminar")
    public ResponseEntity<String> RecorridoAtracciones(@RequestParam Long idRecorridoAtracciones){
        try{
            if (recorridoAtraccionesService.existe(idRecorridoAtracciones)){
                recorridoAtraccionesService.eliminar(idRecorridoAtracciones);
                return ResponseEntity.ok().body("Eliminacion completada.");
            } else {
                return ResponseEntity.ok().body("Recorrido_Atraccion no encontrado.");
            }
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/buscar/recorrido")
    public ResponseEntity<List<DTRecorridoAtracciones>> obtenerPorIdRecorrido(@RequestParam Long idRecorrido){
        try{
            return ResponseEntity.ok().body(recorridoAtraccionesService.obtenerPorIdRecorrido(idRecorrido));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

}
