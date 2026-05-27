package com.example.geotravel.controller;

import com.example.geotravel.dto.DTAtraccion;
import com.example.geotravel.service.AtraccionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/atraccion")
public class AtraccionController {

    @Autowired
    private AtraccionService atraccionService;

    @PostMapping("/alta")
    public ResponseEntity<String> altaAtraccion(@RequestBody DTAtraccion dtAtraccion){
        try{
            atraccionService.alta(dtAtraccion);
            return ResponseEntity.ok().body("Alta completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/actualizar")
    public ResponseEntity<String> actualizarAtraccion(@RequestBody DTAtraccion dtAtraccion){
        try{
            atraccionService.actualizar(dtAtraccion);
            return ResponseEntity.ok().body("Actualizacion completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/eliminar")
    public ResponseEntity<String> eliminarAtraccion(@RequestParam Long idAtraccion){
        try{
            atraccionService.eliminar(idAtraccion);
            return ResponseEntity.ok().body("Eliminacion completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/buscar/todos")
    public ResponseEntity<List<DTAtraccion>> obtenerTodos(){
        try{
            return ResponseEntity.ok().body(atraccionService.obtenerTodos());
        } catch (Exception e){
            return ResponseEntity.badRequest().body(Collections.emptyList());
        }
    }

    @GetMapping("/buscar/id")
    public ResponseEntity<DTAtraccion> obtenerPorId(@RequestParam Long id){
        try{
            return ResponseEntity.ok().body(atraccionService.obtenerPorId(id));
        } catch (Exception e){
            return ResponseEntity.badRequest().body(null);
        }
    }

}
