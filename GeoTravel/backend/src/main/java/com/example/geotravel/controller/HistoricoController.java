package com.example.geotravel.controller;

import com.example.geotravel.dto.DTHistorico;
import com.example.geotravel.service.HistoricoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/historico")
public class HistoricoController {

    @Autowired
    private HistoricoService historicoService;

    @PostMapping("/alta")
    public ResponseEntity<String> altaHistorico(@RequestBody DTHistorico dtHistorico){
        try{
            historicoService.alta(dtHistorico);
            return ResponseEntity.ok().body("Alta completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/actualizar")
    public ResponseEntity<String> actualizarHistorico(@RequestBody DTHistorico dtHistorico){
        try{
            if (historicoService.existe(dtHistorico.getIdHistorico())) {
                historicoService.actualizar(dtHistorico);
                return ResponseEntity.ok().body("Actualizacion completada.");
            } else {
                return ResponseEntity.ok().body("Historico no encontrado.");
            }
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/eliminar")
    public ResponseEntity<String> eliminarHistorico(@RequestParam Long idHistorico){
        try{
            if (historicoService.existe(idHistorico)){
                historicoService.eliminar(idHistorico);
                return ResponseEntity.ok().body("Eliminacion completada.");
            } else {
                return ResponseEntity.ok().body("Historico no encontrado.");
            }
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/buscar/todos")
    public ResponseEntity<List<DTHistorico>> obtenerTodos(){
        try{
            return ResponseEntity.ok().body(historicoService.obtenerTodos());
        } catch (Exception e){
            return ResponseEntity.badRequest().body(Collections.emptyList());
        }
    }

    @GetMapping("/buscar/id")
    public ResponseEntity<DTHistorico> obtenerPorId(@RequestParam Long id){
        try{
            return ResponseEntity.ok().body(historicoService.obtenerPorId(id));
        } catch (Exception e){
            return ResponseEntity.badRequest().body(null);
        }
    }

}
