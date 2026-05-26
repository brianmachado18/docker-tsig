package com.example.geotravel.controller;

import com.example.geotravel.model.Historico;
import com.example.geotravel.service.HistoricoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/historico")
public class HistoricoController {

    @Autowired
    private HistoricoService historicoService;

    @PostMapping("/alta")
    public ResponseEntity<String> altaHistorico(@RequestBody Historico historico){
        try{
            historicoService.alta(historico);
            return ResponseEntity.ok().body("Alta completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/actualizar")
    public ResponseEntity<String> actualizarHistorico(@RequestBody Historico historico){
        try{
            historicoService.actualizar(historico);
            return ResponseEntity.ok().body("Actualizacion completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/eliminar")
    public ResponseEntity<String> eliminarHistorico(@RequestBody Historico historico){
        try{
            historicoService.eliminar(historico);
            return ResponseEntity.ok().body("Eliminacion completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/buscar/todos")
    public ResponseEntity<List<Historico>> obtenerTodos(){
        try{
            return ResponseEntity.ok().body(historicoService.obtenerTodos());
        } catch (Exception e){
            return ResponseEntity.badRequest().body(Collections.emptyList());
        }
    }

    @GetMapping("/buscar/id")
    public ResponseEntity<Historico> obtenerPorId(@RequestBody Map<String, Long> body){
        try{
            return ResponseEntity.ok().body(historicoService.obtenerPorId(body.get("id")));
        } catch (Exception e){
            return ResponseEntity.badRequest().body(null);
        }
    }

}
