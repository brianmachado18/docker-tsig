package com.example.geotravel.controller;

import com.example.geotravel.dto.DTRecorrido;
import com.example.geotravel.enums.Estado;
import com.example.geotravel.service.RecorridoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/recorrido")
public class RecorridoController {

    @Autowired
    private RecorridoService recorridoService;

    @PostMapping("/alta")
    public ResponseEntity<String> altaRecorrido(@RequestBody DTRecorrido dtRecorrido){
        try{
            recorridoService.alta(dtRecorrido);
            return ResponseEntity.ok().body("Alta completada.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/actualizar")
    public ResponseEntity<String> actualizarRecorrido(@RequestBody DTRecorrido dtRecorrido){
        try{
            if (recorridoService.existe(dtRecorrido.getIdRecorrido())){
                recorridoService.actualizar(dtRecorrido);
                return ResponseEntity.ok().body("Actualizacion completada.");
            } else {
                return ResponseEntity.ok().body("Recorrido no encontrado.");
            }
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/eliminar")
    public ResponseEntity<String> eliminarRecorrido(@RequestParam Long idRecorrido){
        try{
            if (recorridoService.existe(idRecorrido)){
                recorridoService.eliminar(idRecorrido);
                return ResponseEntity.ok().body("Eliminacion completada.");
            } else {
                return ResponseEntity.ok().body("Recorrido no encontrado.");
            }
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/buscar/todos")
    public ResponseEntity<List<DTRecorrido>> obtenerTodos(){
        try{
            return ResponseEntity.ok().body(recorridoService.obtenerTodos());
        } catch (Exception e){
            return ResponseEntity.badRequest().body(Collections.emptyList());
        }
    }

    @GetMapping("/buscar/id")
    public ResponseEntity<DTRecorrido> obtenerPorId(@RequestParam Long id){
        try{
            return ResponseEntity.ok().body(recorridoService.obtenerPorId(id));
        } catch (Exception e){
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/buscar/porZona")
    public ResponseEntity<List<DTRecorrido>> obtenerPorZona(@RequestParam Long idZona){
        try{
            return ResponseEntity.ok().body(recorridoService.obtenerPorZona(idZona));
        } catch (Exception e){
            return ResponseEntity.badRequest().body(Collections.emptyList());
        }
    }

    @PutMapping("/cambiarEstado")
    public ResponseEntity<String> cambiarEstado(@RequestParam Long idRecorrido, @RequestParam Estado estado){
        try{
            recorridoService.cambiarEstado(idRecorrido, estado);
            return ResponseEntity.ok().body("Estado actualizado.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
