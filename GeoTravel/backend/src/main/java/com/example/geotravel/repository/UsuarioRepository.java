package com.example.geotravel.repository;

import com.example.geotravel.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;


public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    boolean existsByNombreAndPassword(String nombre, String password);

}
