package com.example.geotravel.controller;

import com.example.geotravel.model.Atraccion;
import com.example.geotravel.service.AtraccionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/atraccion")
public class AtraccionController {

    @Autowired
    private AtraccionService atraccionService;

    @PostMapping("/alta")
    public ResponseEntity<String> altaAtraccion(@RequestBody Atraccion atraccion){
        try{
            atraccionService.alta(atraccion);
            return ResponseEntity.ok().body("Alta completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/actualizar")
    public ResponseEntity<String> actualizarAtraccion(@RequestBody Atraccion atraccion){
        try{
            atraccionService.actualizar(atraccion);
            return ResponseEntity.ok().body("Actualizacion completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping ResponseEntity<String> eliminarAtraccion(@RequestBody Atraccion atraccion){
        try{
            atraccionService.eliminar(atraccion);
            return ResponseEntity.ok().body("Eliminacion completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/buscar/todos")
    public ResponseEntity<List<Atraccion>> obtenerTodos(){
        try{
            return ResponseEntity.ok().body(atraccionService.obtenerTodos());
        } catch (Exception e){
            return ResponseEntity.badRequest().body(Collections.emptyList());
        }
    }

    @GetMapping("/buscar/id")
    public ResponseEntity<Atraccion> obtenerPorId(@RequestBody Map<String, Long> body){
        try{
            return ResponseEntity.ok().body(atraccionService.obtenerPorId(body.get("id")));
        } catch (Exception e){
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/buscar/nombre")
    public ResponseEntity<Atraccion> obtenerPorNombre(@RequestBody Map<String, String> body){
        try{
            return ResponseEntity.ok().body(atraccionService.obtenerPorNombre(body.get("nombre")));
        } catch (Exception e){
            return ResponseEntity.badRequest().body(null);
        }
    }

}
