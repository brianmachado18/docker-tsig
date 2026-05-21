package com.example.tsig;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    private final String geoserverUrl;

    public HealthController(@Value("${geoserver.url}") String geoserverUrl) {
        this.geoserverUrl = geoserverUrl;
    }

    @GetMapping("/api/status")
    public Map<String, String> status() {
        return Map.of(
                "backend", "ok",
                "geoserverUrl", geoserverUrl
        );
    }
}
