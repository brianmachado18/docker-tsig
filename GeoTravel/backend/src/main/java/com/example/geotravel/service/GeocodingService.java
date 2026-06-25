package com.example.geotravel.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLException;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.text.Normalizer;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GeocodingService {

    private static final int STREET_SUGGESTION_LIMIT = 6;
    private static final int INTERSECTION_SUGGESTION_LIMIT = 8;
    private static final int ADDRESS_RESULT_LIMIT = 12;
    private static final Set<String> NON_SIGNIFICANT_TOKENS = Set.of(
            "y", "e", "and", "con", "esquina", "esq", "de", "del", "la", "las", "el", "los"
    );
    private static final Map<String, String> STREET_TOKEN_NORMALIZATIONS = Map.ofEntries(
            Map.entry("av", "avenida"),
            Map.entry("avda", "avenida"),
            Map.entry("avd", "avenida"),
            Map.entry("bv", "bulevar"),
            Map.entry("blvr", "bulevar"),
            Map.entry("blvd", "bulevar"),
            Map.entry("gral", "general"),
            Map.entry("grl", "general")
    );
    private static final Pattern FIRST_NUMBER_PATTERN = Pattern.compile("\\b(\\d+)\\b");
    private static final Pattern INTERSECTION_SPLIT_PATTERN = Pattern.compile("\\s+ESQ\\s+", Pattern.CASE_INSENSITIVE);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private final HttpClient insecureHttpClient = buildInsecureHttpClient();

    @Value("${geocoding.ide.base-url:https://direcciones.ide.uy}")
    private String ideBaseUrl;

    @Value("${geocoding.ide.user-agent:GeoTravel/1.0 (tsig local project)}")
    private String userAgent;

    @Value("${geocoding.ide.request-timeout-ms:10000}")
    private long requestTimeoutMs;

    @Value("${geocoding.ide.insecure:false}")
    private boolean insecureTls;

    public GeocodedPoint geocode(String direccion) throws Exception {
        if (direccion == null || direccion.trim().isEmpty()) {
            throw new Exception("Direccion requerida.");
        }

        String normalizedAddress = direccion.trim();
        List<IdeAddressResult> candidates = searchIdeAddress(normalizedAddress);
        if (candidates.isEmpty()) {
            throw new Exception("No se encontro una ubicacion para la direccion ingresada.");
        }

        IdeAddressResult bestCandidate = selectBestAddressCandidate(normalizedAddress, candidates);
        return new GeocodedPoint(bestCandidate.lon(), bestCandidate.lat(), bestCandidate.label());
    }

    public GeocodedPoint geocodeIntersection(String calle1, String calle2) throws Exception {
        if (calle1 == null || calle1.trim().isEmpty()) {
            throw new Exception("Calle 1 requerida.");
        }
        if (calle2 == null || calle2.trim().isEmpty()) {
            throw new Exception("Calle 2 requerida.");
        }

        String normalizedStreet1 = normalizeStreetReference(calle1);
        String normalizedStreet2 = normalizeStreetReference(calle2);
        if (normalizedStreet1.isBlank() || normalizedStreet2.isBlank()) {
            throw new Exception("No se encontro una ubicacion para la interseccion ingresada.");
        }

        List<IntersectionCandidate> candidates = new ArrayList<>();
        candidates.addAll(resolveIntersectionCandidates(normalizedStreet1, normalizedStreet2));
        candidates.addAll(resolveIntersectionCandidates(normalizedStreet2, normalizedStreet1));

        if (candidates.isEmpty()) {
            throw new Exception("No se encontro una ubicacion para la interseccion ingresada.");
        }

        IntersectionCandidate bestCandidate = selectBestIntersectionCandidate(candidates);
        return new GeocodedPoint(bestCandidate.lon(), bestCandidate.lat(), bestCandidate.label());
    }

    public List<StreetSuggestion> suggestStreets(String query) throws Exception {
        String normalizedQuery = String.valueOf(query == null ? "" : query).trim();
        if (normalizedQuery.isBlank()) {
            return List.of();
        }

        return suggestIdeStreets(normalizedQuery).stream()
                .map(suggestion -> new StreetSuggestion(
                        suggestion.streetId(),
                        suggestion.label(),
                        suggestion.streetName(),
                        suggestion.locality(),
                        suggestion.department()
                ))
                .toList();
    }

    public List<IntersectionOption> suggestIntersectionsForStreet(int streetId, String query) throws Exception {
        String normalizedQuery = normalizeStreetReference(query);
        List<String> queryTokens = tokenizeForMatching(normalizedQuery);
        if (streetId <= 0 || queryTokens.isEmpty()) {
            return List.of();
        }

        List<IdeCornerResult> corners = findIdeCorners(streetId);
        Map<String, RankedIntersectionOption> rankedByKey = new LinkedHashMap<>();

        for (int index = 0; index < corners.size(); index++) {
            IdeCornerResult corner = corners.get(index);
            RankedIntersectionOption rankedOption = rankIntersectionOption(corner, queryTokens, index);
            if (rankedOption == null) {
                continue;
            }

            rankedByKey.merge(
                    normalizeText(rankedOption.option().streetLabel()) + "|" + roundedPointKey(rankedOption.option().lon(), rankedOption.option().lat()),
                    rankedOption,
                    (left, right) -> left.score() >= right.score() ? left : right
            );
        }

        return rankedByKey.values().stream()
                .sorted(Comparator.comparingInt(RankedIntersectionOption::score).reversed())
                .limit(INTERSECTION_SUGGESTION_LIMIT)
                .map(RankedIntersectionOption::option)
                .toList();
    }

    private IdeAddressResult selectBestAddressCandidate(
            String requestedAddress,
            List<IdeAddressResult> candidates
    ) throws Exception {
        List<String> requestedTokens = tokenizeForMatching(requestedAddress);
        Integer requestedPortalNumber = extractFirstNumber(requestedAddress);

        return candidates.stream()
                .map(candidate -> new RankedAddressCandidate(
                        candidate,
                        scoreAddressCandidate(requestedTokens, requestedPortalNumber, candidate)
                ))
                .filter(candidate -> candidate.score() > 0)
                .max(Comparator.comparingInt(RankedAddressCandidate::score))
                .orElseThrow(() -> new Exception("No se encontro una ubicacion para la direccion ingresada."))
                .candidate();
    }

    private int scoreAddressCandidate(
            List<String> requestedTokens,
            Integer requestedPortalNumber,
            IdeAddressResult candidate
    ) {
        List<String> labelTokens = tokenizeForMatching(candidate.label());
        List<String> streetTokens = tokenizeForMatching(candidate.streetName());

        int score = 20;
        if (candidate.error().isBlank()) {
            score += 80;
        } else {
            score -= 20;
        }
        if (containsAllTokens(requestedTokens, labelTokens)) {
            score += 120;
        }
        if (containsAllTokens(requestedTokens, streetTokens)) {
            score += 70;
        }

        score += overlapCount(requestedTokens, labelTokens) * 12;

        if (requestedPortalNumber != null) {
            if (requestedPortalNumber.equals(candidate.portalNumber())) {
                score += 150;
            } else if (candidate.portalNumber() != null) {
                score -= Math.min(Math.abs(requestedPortalNumber - candidate.portalNumber()), 80);
            } else {
                score -= 30;
            }
        }

        if (isApproximateResult(candidate.error())) {
            score -= 60;
        }

        return score;
    }

    private List<IntersectionCandidate> resolveIntersectionCandidates(
            String primaryStreet,
            String secondaryStreet
    ) throws Exception {
        List<String> secondaryTokens = tokenizeForMatching(secondaryStreet);
        if (secondaryTokens.isEmpty()) {
            return List.of();
        }

        List<IntersectionCandidate> candidates = new ArrayList<>();
        List<IdeStreetSuggestion> streetSuggestions = suggestIdeStreets(primaryStreet);

        for (int suggestionIndex = 0; suggestionIndex < streetSuggestions.size(); suggestionIndex++) {
            IdeStreetSuggestion streetSuggestion = streetSuggestions.get(suggestionIndex);
            List<IdeCornerResult> corners = findIdeCorners(streetSuggestion.streetId());
            for (int cornerIndex = 0; cornerIndex < corners.size(); cornerIndex++) {
                IntersectionCandidate candidate = toIntersectionCandidate(
                        primaryStreet,
                        secondaryStreet,
                        streetSuggestion,
                        corners.get(cornerIndex),
                        suggestionIndex,
                        cornerIndex
                );
                if (candidate != null) {
                    candidates.add(candidate);
                }
            }
        }

        return candidates;
    }

    private IntersectionCandidate toIntersectionCandidate(
            String primaryStreet,
            String secondaryStreet,
            IdeStreetSuggestion streetSuggestion,
            IdeCornerResult corner,
            int suggestionIndex,
            int cornerIndex
    ) {
        List<String> secondaryTokens = tokenizeForMatching(secondaryStreet);
        List<String> cornerTokens = tokenizeForMatching(corner.cornerStreetName());
        List<String> addressTokens = tokenizeForMatching(corner.address());

        int score = streetSuggestion.score() - (suggestionIndex * 4) - cornerIndex;
        if (normalizeStreetReference(corner.mainStreetName()).equals(normalizeStreetReference(primaryStreet))) {
            score += 40;
        }
        if (normalizeStreetReference(corner.cornerStreetName()).equals(normalizeStreetReference(secondaryStreet))) {
            score += 120;
        }
        if (containsAllTokens(secondaryTokens, cornerTokens)) {
            score += 180;
        } else if (containsAllTokens(secondaryTokens, addressTokens)) {
            score += 110;
        } else {
            int overlap = overlapCount(secondaryTokens, cornerTokens);
            if (overlap == 0) {
                overlap = overlapCount(secondaryTokens, addressTokens);
            }
            if (overlap == 0) {
                return null;
            }
            score += overlap * 30;
        }

        return new IntersectionCandidate(corner.lon(), corner.lat(), corner.label(), score);
    }

    private RankedIntersectionOption rankIntersectionOption(
            IdeCornerResult corner,
            List<String> queryTokens,
            int rank
    ) {
        List<String> cornerStreetTokens = tokenizeForMatching(corner.cornerStreetName());
        List<String> addressTokens = tokenizeForMatching(corner.address());

        int score = 80 - rank;
        if (containsAllTokens(queryTokens, cornerStreetTokens)) {
            score += 140;
        } else if (containsAllTokens(queryTokens, addressTokens)) {
            score += 80;
        } else {
            int overlap = overlapCount(queryTokens, cornerStreetTokens);
            if (overlap == 0) {
                overlap = overlapCount(queryTokens, addressTokens);
            }
            if (overlap == 0) {
                return null;
            }
            score += overlap * 25;
        }

        return new RankedIntersectionOption(
                new IntersectionOption(
                        buildStreetLabel(corner.cornerStreetName(), corner.locality(), corner.department()),
                        corner.label(),
                        corner.lon(),
                        corner.lat()
                ),
                score
        );
    }

    private IntersectionCandidate selectBestIntersectionCandidate(List<IntersectionCandidate> candidates) throws Exception {
        return rankIntersectionCandidates(candidates).stream()
                .findFirst()
                .orElseThrow(() -> new Exception("No se encontro una ubicacion para la interseccion ingresada."));
    }

    private List<IntersectionCandidate> rankIntersectionCandidates(List<IntersectionCandidate> candidates) {
        return candidates.stream()
                .collect(java.util.stream.Collectors.toMap(
                        candidate -> normalizeText(candidate.label()) + "|" + roundedPointKey(candidate.lon(), candidate.lat()),
                        candidate -> candidate,
                        (left, right) -> left.score() >= right.score() ? left : right,
                        LinkedHashMap::new
                ))
                .values()
                .stream()
                .sorted(Comparator.comparingInt(IntersectionCandidate::score).reversed())
                .toList();
    }

    private List<IdeAddressResult> searchIdeAddress(String query) throws Exception {
        IdeAddressQuery parsedQuery = parseAddressQuery(query);
        Map<String, String> params = new LinkedHashMap<>();
        params.put("calle", parsedQuery.street());
        if (!parsedQuery.locality().isBlank()) {
            params.put("localidad", parsedQuery.locality());
        }
        if (!parsedQuery.department().isBlank()) {
            params.put("departamento", parsedQuery.department());
        }

        JsonNode root = executeIdeGet("/api/v0/geocode/BusquedaDireccion", params);
        List<IdeAddressResult> results = new ArrayList<>();

        for (JsonNode node : root) {
            JsonNode direccion = node.path("direccion");
            String streetName = direccion.path("calle").path("nombre_normalizado").asText("");
            String inmuebleName = direccion.path("inmueble").path("nombre").asText("");
            String primaryName = streetName.isBlank() ? inmuebleName : streetName;
            String locality = direccion.path("localidad").path("nombre_normalizado").asText("");
            String department = direccion.path("departamento").path("nombre_normalizado").asText("");
            JsonNode numero = direccion.path("numero").path("nro_puerta");
            Integer portalNumber = numero.isNumber() ? numero.asInt() : null;
            double lon = readRequiredDouble(node, "puntoX");
            double lat = readRequiredDouble(node, "puntoY");
            String error = node.path("error").asText("");
            String label = buildAddressLabel(primaryName, portalNumber, locality, department);

            results.add(new IdeAddressResult(
                    label.isBlank() ? query.trim() : label,
                    primaryName,
                    locality,
                    department,
                    portalNumber,
                    lon,
                    lat,
                    error
            ));
        }

        return results.stream()
                .limit(ADDRESS_RESULT_LIMIT)
                .toList();
    }

    private List<IdeStreetSuggestion> suggestIdeStreets(String streetReference) throws Exception {
        String normalizedStreetReference = normalizeStreetReference(streetReference);
        List<String> streetTokens = tokenizeForMatching(normalizedStreetReference);
        if (streetTokens.isEmpty()) {
            return List.of();
        }

        JsonNode root = executeIdeGet("/api/v0/geocode/SugerenciaCalleCompleta", Map.of(
                "entrada", normalizedStreetReference,
                "todos", "true"
        ));

        Map<String, IdeStreetSuggestion> suggestionsByKey = new LinkedHashMap<>();
        int rank = 0;
        for (JsonNode node : root) {
            int streetId = node.path("idCalle").asInt(-1);
            if (streetId <= 0) {
                continue;
            }

            String streetName = node.path("calle").asText("");
            String locality = node.path("localidad").asText("");
            String department = node.path("departamento").asText("");
            int score = scoreStreetSuggestion(normalizedStreetReference, streetTokens, streetName, locality, department, rank++);
            if (score <= 0) {
                continue;
            }

            IdeStreetSuggestion suggestion = new IdeStreetSuggestion(
                    streetId,
                    streetName,
                    locality,
                    department,
                    buildStreetLabel(streetName, locality, department),
                    score
            );

            suggestionsByKey.merge(
                    streetId + "|" + normalizeText(locality) + "|" + normalizeText(department),
                    suggestion,
                    (left, right) -> left.score() >= right.score() ? left : right
            );
        }

        return suggestionsByKey.values()
                .stream()
                .sorted(Comparator.comparingInt(IdeStreetSuggestion::score).reversed())
                .limit(STREET_SUGGESTION_LIMIT)
                .toList();
    }

    private int scoreStreetSuggestion(
            String requestedStreet,
            List<String> requestedTokens,
            String streetName,
            String locality,
            String department,
            int rank
    ) {
        List<String> streetTokens = tokenizeForMatching(streetName);
        int overlap = overlapCount(requestedTokens, streetTokens);
        if (overlap == 0) {
            return -1;
        }

        int score = 120 - (rank * 4);
        if (normalizeStreetReference(streetName).equals(requestedStreet)) {
            score += 90;
        }
        if (containsAllTokens(requestedTokens, streetTokens)) {
            score += 80;
        }
        score += overlap * 15;

        List<String> localityTokens = tokenizeForMatching(locality + " " + department);
        if (containsAllTokens(requestedTokens, localityTokens)) {
            score -= 40;
        }

        return score;
    }

    private List<IdeCornerResult> findIdeCorners(int streetId) throws Exception {
        JsonNode root = executeIdeGet("/api/v1/geocode/findEsq", Map.of("idcalle", String.valueOf(streetId)));
        Map<String, IdeCornerResult> cornersByKey = new LinkedHashMap<>();

        for (JsonNode node : root) {
            String address = node.path("address").asText("");
            String mainStreet = node.path("nomVia").asText("");
            String cornerStreet = extractCornerStreetName(address);
            if (address.isBlank() || mainStreet.isBlank() || cornerStreet.isBlank()) {
                continue;
            }

            IdeCornerResult corner = new IdeCornerResult(
                    address,
                    buildIntersectionLabel(mainStreet, cornerStreet, node.path("localidad").asText(""), node.path("departamento").asText("")),
                    mainStreet,
                    cornerStreet,
                    node.path("localidad").asText(""),
                    node.path("departamento").asText(""),
                    readRequiredDouble(node, "lng"),
                    readRequiredDouble(node, "lat")
            );

            cornersByKey.putIfAbsent(normalizeText(corner.address()), corner);
        }

        return List.copyOf(cornersByKey.values());
    }

    private JsonNode executeIdeGet(String path, Map<String, String> queryParams) throws Exception {
        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromUriString(ideBaseUrl).path(path);
        queryParams.forEach((key, value) -> {
            if (value != null && !value.isBlank()) {
                uriBuilder.queryParam(key, value);
            }
        });

        URI builtUri = uriBuilder.build().encode().toUri();
        HttpRequest request = HttpRequest.newBuilder(builtUri)
                .header("Accept", "application/json")
                .header("User-Agent", userAgent)
                .timeout(Duration.ofMillis(Math.max(requestTimeoutMs, 1_000L)))
                .GET()
                .build();

        HttpResponse<String> response = sendRequest(request);
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new Exception("El servicio de geocodificacion no respondio correctamente.");
        }

        JsonNode root = objectMapper.readTree(response.body());
        if (!root.isArray()) {
            throw new Exception("El servicio de geocodificacion no respondio correctamente.");
        }

        return root;
    }

    private HttpResponse<String> sendRequest(HttpRequest request) throws Exception {
        try {
            return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new Exception("No fue posible consultar el servicio de geocodificacion.");
        } catch (IOException exception) {
            if (insecureTls && isTlsFailure(exception)) {
                try {
                    return insecureHttpClient.send(request, HttpResponse.BodyHandlers.ofString());
                } catch (InterruptedException insecureException) {
                    Thread.currentThread().interrupt();
                    throw new Exception("No fue posible consultar el servicio de geocodificacion.");
                } catch (IOException insecureIoException) {
                    throw new Exception("No fue posible consultar el servicio de geocodificacion.");
                }
            }
            throw new Exception("No fue posible consultar el servicio de geocodificacion.");
        }
    }

    private boolean isTlsFailure(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof SSLException) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private HttpClient buildInsecureHttpClient() {
        try {
            TrustManager[] trustAllManagers = new TrustManager[]{
                    new X509TrustManager() {
                        @Override
                        public void checkClientTrusted(X509Certificate[] chain, String authType) {
                        }

                        @Override
                        public void checkServerTrusted(X509Certificate[] chain, String authType) {
                        }

                        @Override
                        public X509Certificate[] getAcceptedIssuers() {
                            return new X509Certificate[0];
                        }
                    }
            };

            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, trustAllManagers, new SecureRandom());
            return HttpClient.newBuilder()
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .connectTimeout(Duration.ofSeconds(5))
                    .sslContext(sslContext)
                    .build();
        } catch (GeneralSecurityException exception) {
            return HttpClient.newBuilder()
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .connectTimeout(Duration.ofSeconds(5))
                    .build();
        }
    }

    private IdeAddressQuery parseAddressQuery(String query) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.isBlank()) {
            return new IdeAddressQuery("", "", "");
        }

        String[] parts = Arrays.stream(normalized.split(","))
                .map(String::trim)
                .filter(part -> !part.isBlank())
                .toArray(String[]::new);

        if (parts.length >= 3) {
            return new IdeAddressQuery(
                    String.join(", ", Arrays.copyOf(parts, parts.length - 2)),
                    parts[parts.length - 2],
                    parts[parts.length - 1]
            );
        }
        if (parts.length == 2) {
            return new IdeAddressQuery(parts[0], parts[1], "");
        }

        return new IdeAddressQuery(normalized, "", "");
    }

    private String buildStreetLabel(String streetName, String locality, String department) {
        return joinNonBlank(", ", streetName, locality, department);
    }

    private String buildAddressLabel(String streetName, Integer portalNumber, String locality, String department) {
        String streetWithNumber = portalNumber == null ? streetName : streetName + " " + portalNumber;
        return joinNonBlank(", ", streetWithNumber, locality, department);
    }

    private String buildIntersectionLabel(String mainStreet, String cornerStreet, String locality, String department) {
        return joinNonBlank(", ", mainStreet + " x " + cornerStreet, locality, department);
    }

    private String extractCornerStreetName(String address) {
        String firstSection = String.valueOf(address == null ? "" : address).split(",", 2)[0].trim();
        String[] parts = INTERSECTION_SPLIT_PATTERN.split(firstSection, 2);
        return parts.length == 2 ? parts[1].trim() : "";
    }

    private Integer extractFirstNumber(String value) {
        Matcher matcher = FIRST_NUMBER_PATTERN.matcher(String.valueOf(value == null ? "" : value));
        if (!matcher.find()) {
            return null;
        }
        return Integer.parseInt(matcher.group(1));
    }

    private int overlapCount(List<String> expected, List<String> actual) {
        return (int) expected.stream().filter(actual::contains).count();
    }

    private boolean containsAllTokens(List<String> expected, List<String> actual) {
        return !expected.isEmpty() && actual.containsAll(expected);
    }

    private boolean isApproximateResult(String error) {
        String normalizedError = normalizeText(error);
        return normalizedError.contains("aproximado")
                || normalizedError.contains("punto no encontrado")
                || normalizedError.contains("geometria de calle no encontrada");
    }

    private String roundedPointKey(double lon, double lat) {
        return String.format(Locale.ROOT, "%.6f|%.6f", lon, lat);
    }

    private double readRequiredDouble(JsonNode result, String fieldName) throws Exception {
        double value = result.path(fieldName).asDouble(Double.NaN);
        if (Double.isNaN(value)) {
            throw new Exception("El servicio de geocodificacion devolvio coordenadas invalidas.");
        }
        return value;
    }

    private String joinNonBlank(String separator, String... values) {
        List<String> nonBlankValues = new ArrayList<>();
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                nonBlankValues.add(value.trim());
            }
        }
        return String.join(separator, nonBlankValues);
    }

    private String normalizeStreetReference(String value) {
        String normalized = normalizeText(value).replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}\\s]", " ");
        StringBuilder builder = new StringBuilder();

        for (String token : normalized.trim().split("\\s+")) {
            if (token.isBlank()) {
                continue;
            }
            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(STREET_TOKEN_NORMALIZATIONS.getOrDefault(token, token));
        }

        return builder.toString().trim();
    }

    private List<String> tokenizeForMatching(String value) {
        String normalized = normalizeStreetReference(value);
        if (normalized.isBlank()) {
            return List.of();
        }

        return Arrays.stream(normalized.split("\\s+"))
                .filter(token -> !token.isBlank())
                .filter(token -> !NON_SIGNIFICANT_TOKENS.contains(token))
                .toList();
    }

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }

        return Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }

    public record GeocodedPoint(double lon, double lat, String label) {}

    public record StreetSuggestion(
            int streetId,
            String label,
            String streetName,
            String locality,
            String department
    ) {}

    public record IntersectionOption(
            String streetLabel,
            String intersectionLabel,
            double lon,
            double lat
    ) {}

    private record IdeAddressQuery(
            String street,
            String locality,
            String department
    ) {}

    private record IdeAddressResult(
            String label,
            String streetName,
            String locality,
            String department,
            Integer portalNumber,
            double lon,
            double lat,
            String error
    ) {}

    private record RankedAddressCandidate(
            IdeAddressResult candidate,
            int score
    ) {}

    private record RankedIntersectionOption(
            IntersectionOption option,
            int score
    ) {}

    private record IdeStreetSuggestion(
            int streetId,
            String streetName,
            String locality,
            String department,
            String label,
            int score
    ) {}

    private record IdeCornerResult(
            String address,
            String label,
            String mainStreetName,
            String cornerStreetName,
            String locality,
            String department,
            double lon,
            double lat
    ) {}

    private record IntersectionCandidate(
            double lon,
            double lat,
            String label,
            int score
    ) {}
}
