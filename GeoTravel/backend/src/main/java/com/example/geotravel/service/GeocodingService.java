package com.example.geotravel.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class GeocodingService {

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${geocoding.nominatim.url:https://nominatim.openstreetmap.org}")
    private String nominatimBaseUrl;

    @Value("${geocoding.nominatim.user-agent:GeoTravel/1.0 (tsig local project)}")
    private String userAgent;

    public GeocodedPoint geocode(String direccion) throws Exception {
        if (direccion == null || direccion.trim().isEmpty()) {
            throw new Exception("Direccion requerida.");
        }

        String normalizedAddress = direccion.trim();
        String query = normalizedAddress.toLowerCase().contains("uruguay")
                ? normalizedAddress
                : normalizedAddress + ", Uruguay";

        URI uri = UriComponentsBuilder
                .fromUriString(nominatimBaseUrl)
                .path("/search")
                .queryParam("format", "jsonv2")
                .queryParam("limit", "1")
                .queryParam("q", query)
                .build()
                .encode()
                .toUri();

        HttpRequest request = HttpRequest.newBuilder(uri)
                .header("Accept", "application/json")
                .header("User-Agent", userAgent)
                .GET()
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new Exception("No fue posible consultar el servicio de geocodificacion.");
        } catch (IOException e) {
            throw new Exception("No fue posible consultar el servicio de geocodificacion.");
        }

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new Exception("El servicio de geocodificacion no respondio correctamente.");
        }

        JsonNode root = objectMapper.readTree(response.body());
        if (!root.isArray() || root.isEmpty()) {
            throw new Exception("No se encontro una ubicacion para la direccion ingresada.");
        }

        JsonNode firstResult = root.get(0);
        double lat = firstResult.path("lat").asDouble(Double.NaN);
        double lon = firstResult.path("lon").asDouble(Double.NaN);
        if (Double.isNaN(lat) || Double.isNaN(lon)) {
            throw new Exception("El servicio de geocodificacion devolvio coordenadas invalidas.");
        }

        return new GeocodedPoint(lon, lat, firstResult.path("display_name").asText(normalizedAddress));
    }

    public GeocodedPoint geocodeIntersection(String calle1, String calle2) throws Exception {
        if (calle1 == null || calle1.trim().isEmpty()) {
            throw new Exception("Calle 1 requerida.");
        }
        if (calle2 == null || calle2.trim().isEmpty()) {
            throw new Exception("Calle 2 requerida.");
        }

        String direccion = calle1.trim() + " y " + calle2.trim();
        return geocode(direccion);
    }

    public record GeocodedPoint(double lon, double lat, String label) {}
}
