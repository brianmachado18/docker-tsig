package com.example.geotravel.controller;

import com.example.geotravel.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/usuario")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/login")
    public boolean login(@RequestParam String nombre, @RequestParam String password){
        try{
            return usuarioService.login(nombre, password);
        } catch (Exception e){
            return false;
        }
    }

}
