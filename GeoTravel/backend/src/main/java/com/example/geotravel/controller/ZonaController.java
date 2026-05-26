package com.example.geotravel.controller;

import com.example.geotravel.model.Zona;
import com.example.geotravel.service.ZonaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/zona")
public class ZonaController {

    @Autowired
    private ZonaService zonaService;

    @PostMapping("/alta")
    public ResponseEntity<String> altaZona(@RequestBody Zona zona){
        try{
            zonaService.alta(zona);
            return ResponseEntity.ok().body("Alta completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/actualizar")
    public ResponseEntity<String> actualizarZona(@RequestBody Zona zona){
        try{
            zonaService.actualizar(zona);
            return ResponseEntity.ok().body("Actualizacion completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/eliminar")
    public ResponseEntity<String> eliminarZona(@RequestBody Zona zona){
        try{
            zonaService.eliminar(zona);
            return ResponseEntity.ok().body("Eliminacion completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/buscar/todos")
    public ResponseEntity<List<Zona>> obtenerTodos(){
        try{
            return ResponseEntity.ok().body(zonaService.obtenerTodos());
        } catch (Exception e){
            return ResponseEntity.badRequest().body(Collections.emptyList());
        }
    }

    @GetMapping("/buscar/id")
    public ResponseEntity<Zona> obtenerPorId(@RequestBody Map<String, Long> body){
        try{
            return ResponseEntity.ok().body(zonaService.obtenerPorId(body.get("id")));
        } catch (Exception e){
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/buscar/nombre")
    public ResponseEntity<Zona> obtenerPorNombre(@RequestBody Map<String, String> body){
        try{
            return ResponseEntity.ok().body(zonaService.obtenerPorNombre(body.get("nombre")));
        } catch (Exception e){
            return ResponseEntity.badRequest().body(null);
        }
    }

}
