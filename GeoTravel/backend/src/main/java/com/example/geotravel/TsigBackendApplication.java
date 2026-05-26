package com.example.geotravel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
public class TsigBackendApplication extends SpringBootServletInitializer {
    public static void main(String[] args) {
        SpringApplication.run(TsigBackendApplication.class, args);
    }
}
