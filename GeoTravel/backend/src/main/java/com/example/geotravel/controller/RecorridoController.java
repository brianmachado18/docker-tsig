package com.example.geotravel.controller;

import com.example.geotravel.model.Recorrido;
import com.example.geotravel.service.RecorridoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/recorrido")
public class RecorridoController {

    @Autowired
    private RecorridoService recorridoService;

    @PostMapping("/alta")
    public ResponseEntity<String> altaRecorrido(@RequestBody Recorrido recorrido){
        try{
            recorridoService.alta(recorrido);
            return ResponseEntity.ok().body("Alta completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/actualizar")
    public ResponseEntity<String> actualizarRecorrido(@RequestBody Recorrido recorrido){
        try{
            recorridoService.actualizar(recorrido);
            return ResponseEntity.ok().body("Actualizacion completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/eliminar")
    public ResponseEntity<String> eliminarRecorrido(@RequestBody Recorrido recorrido){
        try{
            recorridoService.eliminar(recorrido);
            return ResponseEntity.ok().body("Eliminacion completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/buscar/todos")
    public ResponseEntity<List<Recorrido>> obtenerTodos(){
        try{
            return ResponseEntity.ok().body(recorridoService.obtenerTodos());
        } catch (Exception e){
            return ResponseEntity.badRequest().body(Collections.emptyList());
        }
    }

    @GetMapping("/buscar/id")
    public ResponseEntity<Recorrido> obtenerPorId(@RequestBody Map<String, Long> body){
        try{
            return ResponseEntity.ok().body(recorridoService.obtenerPorId(body.get("id")));
        } catch (Exception e){
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/buscar/nombre")
    public ResponseEntity<Recorrido> obtenerPorNombre(@RequestBody Map<String, String> body){
        try{
            return ResponseEntity.ok().body(recorridoService.obtenerPorNombre(body.get("nombre")));
        } catch (Exception e){
            return ResponseEntity.badRequest().body(null);
        }
    }

}
