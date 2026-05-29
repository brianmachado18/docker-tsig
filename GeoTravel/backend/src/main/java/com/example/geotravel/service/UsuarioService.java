package com.example.geotravel.service;

import com.example.geotravel.model.Usuario;
import com.example.geotravel.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    public void alta(@RequestBody Usuario usuario){
        usuarioRepository.save(usuario);
    }

    public void actualizar(@RequestBody Usuario usuario){
        usuarioRepository.save(usuario);
    }

    public void eliminar(@RequestBody Usuario usuario){
        usuarioRepository.delete(usuario);
    }

    public boolean login(String nombre, String password){
        return usuarioRepository.existsByNombreAndPassword(nombre, password);
    }

}
