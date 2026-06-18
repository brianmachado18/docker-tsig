package com.example.geotravel.controller;

import com.example.geotravel.dto.DTZonaActiva;
import com.example.geotravel.dto.DTZona;
import com.example.geotravel.service.ZonaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/zona")
public class ZonaController {

    @Autowired
    private ZonaService zonaService;

    @PostMapping("/alta")
    public ResponseEntity<String> altaZona(@RequestBody DTZona dtZona){
        try{
            zonaService.alta(dtZona);
            return ResponseEntity.ok().body("Alta completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/actualizar")
    public ResponseEntity<String> actualizarZona(@RequestBody DTZona dtZona){
        try{
            zonaService.actualizar(dtZona);
            return ResponseEntity.ok().body("Actualizacion completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/eliminar")
    public ResponseEntity<String> eliminarZona(@RequestParam Long idZona){
        try{
            zonaService.eliminar(idZona);
            return ResponseEntity.ok().body("Eliminacion completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/buscar/todos")
    public ResponseEntity<List<DTZona>> obtenerTodos(){
        try{
            return ResponseEntity.ok().body(zonaService.obtenerTodos());
        } catch (Exception e){
            return ResponseEntity.badRequest().body(Collections.emptyList());
        }
    }

    @GetMapping("/buscar/id")
    public ResponseEntity<DTZona> obtenerPorId(@RequestParam Long id){
        try{
            return ResponseEntity.ok().body(zonaService.obtenerPorId(id));
        } catch (Exception e){
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/buscar/porDireccion")
    public ResponseEntity<?> obtenerPorDireccion(@RequestParam String direccion){
        try{
            return ResponseEntity.ok().body(zonaService.obtenerPorDireccion(direccion));
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/buscar/activas")
    public ResponseEntity<List<DTZonaActiva>> obtenerZonasConMasRecorridosActivos() {
        try {
            return ResponseEntity.ok().body(zonaService.obtenerZonasConMasRecorridosActivos());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.emptyList());
        }
    }

}
