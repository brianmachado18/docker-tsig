package com.example.geotravel.service;

import com.example.geotravel.repository.EjesCalleRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryCollection;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.MultiLineString;
import org.locationtech.jts.geom.MultiPoint;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.TopologyException;
import org.locationtech.jts.io.WKTReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class GeocodingService {

    private static final String DEFAULT_COUNTRY_CONTEXT = "Uruguay";
    private static final int DEFAULT_RESULT_LIMIT = 1;
    private static final int INTERSECTION_RESULT_LIMIT = 5;
    private static final int STREET_RESULT_LIMIT = 8;
    private static final double INTERSECTION_CLUSTER_RADIUS_METERS = 250d;
    private static final Set<String> NON_SIGNIFICANT_TOKENS = Set.of(
            "y", "e", "and", "con", "esquina", "de", "del", "la", "las", "el", "los"
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
    private static final List<String> ROAD_ADDRESS_FIELDS = List.of(
            "road", "pedestrian", "footway", "cycleway", "path", "residential", "living_street"
    );
    private static final Set<String> ROAD_RESULT_TYPES = Set.of(
            "road", "pedestrian", "footway", "cycleway", "path", "residential", "living_street",
            "service", "secondary", "tertiary", "primary", "trunk", "motorway", "unclassified"
    );
    private static final List<String> LOCALITY_ADDRESS_FIELDS = List.of(
            "suburb", "neighbourhood", "quarter", "city_district", "hamlet", "village",
            "town", "city", "municipality", "county", "state"
    );
    private static final Set<String> ADMINISTRATIVE_RESULT_TYPES = Set.of(
            "administrative", "city", "town", "village", "hamlet", "county", "state",
            "suburb", "neighbourhood", "municipality", "city_district", "quarter"
    );

    private final EjesCalleRepository ejesCalleRepository;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final GeometryFactory geometryFactory = new GeometryFactory();
    private final WKTReader wktReader = new WKTReader();

    @Autowired
    public GeocodingService(EjesCalleRepository ejesCalleRepository) {
        this.ejesCalleRepository = ejesCalleRepository;
    }

    @Value("${geocoding.nominatim.url:https://nominatim.openstreetmap.org}")
    private String nominatimBaseUrl;

    @Value("${geocoding.nominatim.user-agent:GeoTravel/1.0 (tsig local project)}")
    private String userAgent;

    public GeocodedPoint geocode(String direccion) throws Exception {
        if (direccion == null || direccion.trim().isEmpty()) {
            throw new Exception("Direccion requerida.");
        }

        String normalizedAddress = direccion.trim();
        List<JsonNode> results = search(buildCountryScopedQuery(normalizedAddress), DEFAULT_RESULT_LIMIT);
        if (results.isEmpty()) {
            throw new Exception("No se encontro una ubicacion para la direccion ingresada.");
        }

        JsonNode firstResult = results.get(0);
        double lat = readCoordinate(firstResult, "lat");
        double lon = readCoordinate(firstResult, "lon");
        return new GeocodedPoint(lon, lat, firstResult.path("display_name").asText(normalizedAddress));
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
        List<StreetCandidate> street1LocalCandidates = resolveStreetAxisCandidates(normalizedStreet1);
        List<StreetCandidate> street2LocalCandidates = resolveStreetAxisCandidates(normalizedStreet2);
        StreetIntersectionSelection streetIntersectionSelection =
                selectBestStreetIntersection(street1LocalCandidates, street2LocalCandidates);

        if (streetIntersectionSelection != null) {
            Point representativePoint = streetIntersectionSelection.representativePoint();
            return new GeocodedPoint(
                    representativePoint.getX(),
                    representativePoint.getY(),
                    formatIntersectionLabel(streetIntersectionSelection)
            );
        }

        List<StreetCandidate> street1Candidates = mergeStreetCandidates(
                street1LocalCandidates,
                resolveNominatimStreetCandidates(normalizedStreet1)
        );
        List<StreetCandidate> street2Candidates = mergeStreetCandidates(
                street2LocalCandidates,
                resolveNominatimStreetCandidates(normalizedStreet2)
        );

        streetIntersectionSelection = selectBestStreetIntersection(street1Candidates, street2Candidates);
        if (streetIntersectionSelection != null) {
            Point representativePoint = streetIntersectionSelection.representativePoint();
            return new GeocodedPoint(
                    representativePoint.getX(),
                    representativePoint.getY(),
                    formatIntersectionLabel(streetIntersectionSelection)
            );
        }

        List<String> street1Tokens = tokenizeForMatching(normalizedStreet1);
        List<String> street2Tokens = tokenizeForMatching(normalizedStreet2);
        List<IntersectionCandidate> candidates = new ArrayList<>();

        for (String queryVariant : buildIntersectionQueries(normalizedStreet1, normalizedStreet2)) {
            List<JsonNode> results = search(queryVariant, INTERSECTION_RESULT_LIMIT);
            for (int index = 0; index < results.size(); index++) {
                IntersectionCandidate candidate =
                        toIntersectionCandidate(results.get(index), queryVariant, index, street1Tokens, street2Tokens);
                if (candidate != null) {
                    candidates.add(candidate);
                }
            }
        }

        if (candidates.isEmpty()) {
            throw new Exception("No se encontro una ubicacion para la interseccion ingresada.");
        }

        IntersectionCandidate bestCandidate = selectBestIntersectionCandidate(candidates);
        return new GeocodedPoint(bestCandidate.lon(), bestCandidate.lat(), bestCandidate.displayName());
    }

    List<StreetCandidate> resolveStreetCandidates(String streetReference) throws Exception {
        return mergeStreetCandidates(
                resolveStreetAxisCandidates(streetReference),
                resolveNominatimStreetCandidates(streetReference)
        );
    }

    List<StreetCandidate> resolveStreetAxisCandidates(String streetReference) {
        String normalizedStreetReference = normalizeStreetReference(streetReference);
        List<String> streetTokens = tokenizeForMatching(normalizedStreetReference);
        if (streetTokens.isEmpty() || ejesCalleRepository == null) {
            return List.of();
        }

        List<StreetCandidate> candidates = new ArrayList<>();
        List<EjesCalleRepository.StreetAxisMatch> matches =
                ejesCalleRepository.findStreetCandidates(normalizedStreetReference, streetTokens, STREET_RESULT_LIMIT * 2);

        for (int index = 0; index < matches.size(); index++) {
            StreetCandidate candidate = toStreetAxisCandidate(
                    matches.get(index),
                    normalizedStreetReference,
                    streetTokens,
                    index
            );
            if (candidate != null) {
                candidates.add(candidate);
            }
        }

        return candidates.stream()
                .sorted(Comparator.comparingInt(StreetCandidate::score).reversed())
                .limit(STREET_RESULT_LIMIT)
                .toList();
    }

    private List<StreetCandidate> resolveNominatimStreetCandidates(String streetReference) throws Exception {
        String normalizedStreetReference = normalizeStreetReference(streetReference);
        List<String> streetTokens = tokenizeForMatching(normalizedStreetReference);
        if (streetTokens.isEmpty()) {
            return List.of();
        }

        List<JsonNode> results = searchStreet(normalizedStreetReference, STREET_RESULT_LIMIT);
        List<StreetCandidate> candidates = new ArrayList<>();

        for (int index = 0; index < results.size(); index++) {
            StreetCandidate candidate = toStreetCandidate(
                    results.get(index),
                    normalizedStreetReference,
                    streetTokens,
                    index
            );
            if (candidate != null) {
                candidates.add(candidate);
            }
        }

        return candidates.stream()
                .sorted(Comparator.comparingInt(StreetCandidate::score).reversed())
                .limit(STREET_RESULT_LIMIT)
                .toList();
    }

    List<String> buildIntersectionQueries(String calle1, String calle2) {
        List<String> orderedStreets = List.of(calle1, calle2).stream()
                .map(this::normalizeStreetReference)
                .sorted(String::compareToIgnoreCase)
                .toList();

        String streetA = orderedStreets.get(0);
        String streetB = orderedStreets.get(1);
        LinkedHashSet<String> queries = new LinkedHashSet<>();

        queries.add(buildCountryScopedQuery(streetA + " y " + streetB));
        queries.add(buildCountryScopedQuery(streetB + " y " + streetA));
        queries.add(buildCountryScopedQuery(streetA + " esquina " + streetB));
        queries.add(buildCountryScopedQuery(streetB + " esquina " + streetA));
        queries.add(buildCountryScopedQuery(streetA + " con " + streetB));
        queries.add(buildCountryScopedQuery(streetB + " con " + streetA));

        return List.copyOf(queries);
    }

    IntersectionCandidate selectBestIntersectionCandidate(List<IntersectionCandidate> candidates) {
        List<IntersectionCluster> clusters = new ArrayList<>();

        List<IntersectionCandidate> orderedCandidates = candidates.stream()
                .sorted(Comparator.comparingInt(IntersectionCandidate::score).reversed()
                        .thenComparingInt(IntersectionCandidate::rank))
                .toList();

        for (IntersectionCandidate candidate : orderedCandidates) {
            IntersectionCluster cluster = findCluster(clusters, candidate);
            if (cluster == null) {
                cluster = new IntersectionCluster(candidate);
                clusters.add(cluster);
            } else {
                cluster.add(candidate);
            }
        }

        return clusters.stream()
                .max(Comparator
                        .comparingInt(IntersectionCluster::score)
                        .thenComparingInt(IntersectionCluster::distinctQueryCount)
                        .thenComparing(IntersectionCluster::bestCandidate, Comparator
                                .comparingInt(IntersectionCandidate::score)
                                .thenComparing(Comparator.comparingInt(IntersectionCandidate::rank).reversed())))
                .map(IntersectionCluster::bestCandidate)
                .orElseThrow(() -> new IllegalStateException("No fue posible seleccionar un candidato de interseccion."));
    }

    private IntersectionCluster findCluster(List<IntersectionCluster> clusters, IntersectionCandidate candidate) {
        IntersectionCluster bestCluster = null;
        double bestDistance = Double.MAX_VALUE;

        for (IntersectionCluster cluster : clusters) {
            double distance = distanceMeters(
                    candidate.lat(),
                    candidate.lon(),
                    cluster.referenceLat(),
                    cluster.referenceLon()
            );
            if (distance <= INTERSECTION_CLUSTER_RADIUS_METERS && distance < bestDistance) {
                bestCluster = cluster;
                bestDistance = distance;
            }
        }

        return bestCluster;
    }

    StreetIntersectionSelection selectBestStreetIntersection(
            List<StreetCandidate> street1Candidates,
            List<StreetCandidate> street2Candidates
    ) {
        if (street1Candidates == null || street2Candidates == null
                || street1Candidates.isEmpty() || street2Candidates.isEmpty()) {
            return null;
        }

        StreetIntersectionSelection bestSelection = null;

        for (StreetCandidate street1Candidate : street1Candidates) {
            for (StreetCandidate street2Candidate : street2Candidates) {
                if (street1Candidate.geometry() == null || street2Candidate.geometry() == null) {
                    continue;
                }

                Geometry intersection = computeGeometryIntersection(
                        street1Candidate.geometry(),
                        street2Candidate.geometry()
                );
                if (intersection == null || intersection.isEmpty()) {
                    continue;
                }

                Point representativePoint = representativePointForIntersection(intersection);
                if (representativePoint == null || representativePoint.isEmpty()) {
                    continue;
                }

                int pairScore = street1Candidate.score() + street2Candidate.score();
                if (!street1Candidate.localityLabel().isBlank()
                        && street1Candidate.localityLabel().equalsIgnoreCase(street2Candidate.localityLabel())) {
                    pairScore += 30;
                }
                if (intersection.getDimension() == 0) {
                    pairScore += 20;
                } else if (intersection.getDimension() == 1) {
                    pairScore += 10;
                }

                StreetIntersectionSelection selection = new StreetIntersectionSelection(
                        street1Candidate,
                        street2Candidate,
                        representativePoint,
                        pairScore
                );

                if (bestSelection == null || selection.score() > bestSelection.score()) {
                    bestSelection = selection;
                }
            }
        }

        return bestSelection;
    }

    private String formatIntersectionLabel(StreetIntersectionSelection streetIntersectionSelection) {
        return streetIntersectionSelection.street1().displayName()
                + " x "
                + streetIntersectionSelection.street2().displayName();
    }

    private List<StreetCandidate> mergeStreetCandidates(
            List<StreetCandidate> primaryCandidates,
            List<StreetCandidate> secondaryCandidates
    ) {
        List<StreetCandidate> mergedCandidates = new ArrayList<>();
        if (primaryCandidates != null) {
            mergedCandidates.addAll(primaryCandidates);
        }
        if (secondaryCandidates != null) {
            mergedCandidates.addAll(secondaryCandidates);
        }

        return mergedCandidates.stream()
                .collect(java.util.stream.Collectors.toMap(
                        candidate -> normalizeStreetReference(candidate.displayName()) + "|" + candidate.localityLabel(),
                        candidate -> candidate,
                        (left, right) -> left.score() >= right.score() ? left : right,
                        java.util.LinkedHashMap::new
                ))
                .values()
                .stream()
                .sorted(Comparator.comparingInt(StreetCandidate::score).reversed())
                .limit(STREET_RESULT_LIMIT)
                .toList();
    }

    private StreetCandidate toStreetAxisCandidate(
            EjesCalleRepository.StreetAxisMatch match,
            String requestedStreet,
            List<String> streetTokens,
            int rank
    ) {
        Geometry geometry = parseWktGeometry(match.geometryWkt());
        if (geometry == null || geometry.isEmpty()) {
            return null;
        }

        String displayName = match.streetName();
        List<String> displayTokens = tokenizeForMatching(displayName);
        boolean exactMatch = normalizeStreetReference(displayName).equals(normalizeStreetReference(requestedStreet));
        int overlap = overlapCount(streetTokens, displayTokens);

        if (!containsAllTokens(streetTokens, displayTokens) && overlap == 0) {
            return null;
        }

        int score = 180 - (rank * 6);
        if (containsAllTokens(streetTokens, displayTokens)) {
            score += 70;
        }
        if (exactMatch) {
            score += 40;
        }
        score += overlap * 10;
        score += Math.min(match.segmentCount(), 20);

        return new StreetCandidate(
                displayName,
                geometry.toText(),
                geometry,
                score,
                match.localityCode() == null ? "" : match.localityCode()
        );
    }

    private IntersectionCandidate toIntersectionCandidate(
            JsonNode result,
            String queryVariant,
            int rank,
            List<String> street1Tokens,
            List<String> street2Tokens
    ) throws Exception {
        double lat = readCoordinate(result, "lat");
        double lon = readCoordinate(result, "lon");
        JsonNode address = result.path("address");
        String displayName = result.path("display_name").asText("");
        String displayText = displayName + " " + result.path("name").asText("");
        String roadText = extractAddressText(address, ROAD_ADDRESS_FIELDS) + " " + result.path("name").asText("");
        String localityText = extractAddressText(address, LOCALITY_ADDRESS_FIELDS);
        List<String> displayTokens = tokenizeForMatching(displayText);
        List<String> roadTokens = tokenizeForMatching(roadText);
        List<String> localityTokens = tokenizeForMatching(localityText);
        boolean roadLikeResult = isStreetLikeResult(result);
        boolean administrativeCandidate = isAdministrativeCandidate(result);

        int score = 40 - (rank * 6);
        score += scoreStreetMatch(street1Tokens, roadTokens, displayTokens, localityTokens);
        score += scoreStreetMatch(street2Tokens, roadTokens, displayTokens, localityTokens);

        if (containsAllTokens(street1Tokens, displayTokens) && containsAllTokens(street2Tokens, displayTokens)) {
            score += 30;
        }
        if (roadLikeResult) {
            score += 20;
        }
        if (administrativeCandidate) {
            score -= roadLikeResult ? 25 : 140;
        }
        if (score <= 0) {
            return null;
        }

        return new IntersectionCandidate(lon, lat, displayName, score, queryVariant, rank);
    }

    private StreetCandidate toStreetCandidate(
            JsonNode result,
            String requestedStreet,
            List<String> streetTokens,
            int rank
    ) {
        JsonNode address = result.path("address");
        String displayName = result.path("display_name").asText(requestedStreet);
        String displayText = displayName + " " + result.path("name").asText("");
        String roadText = extractAddressText(address, ROAD_ADDRESS_FIELDS) + " " + result.path("name").asText("");
        List<String> displayTokens = tokenizeForMatching(displayText);
        List<String> roadTokens = tokenizeForMatching(roadText);
        boolean roadLikeResult = isStreetLikeResult(result);
        boolean administrativeCandidate = isAdministrativeCandidate(result);

        boolean roadMatch = containsAllTokens(streetTokens, roadTokens);
        boolean displayMatch = containsAllTokens(streetTokens, displayTokens);

        if (!roadMatch && !displayMatch) {
            return null;
        }
        if (administrativeCandidate && !roadLikeResult) {
            return null;
        }

        Geometry geometry = extractStreetGeometry(result);
        if (geometry == null || geometry.isEmpty()) {
            return null;
        }

        int score = 90 - (rank * 8);
        if (roadMatch) {
            score += 90;
        } else if (displayMatch) {
            score += 40;
        }
        score += overlapCount(streetTokens, displayTokens) * 5;
        if (roadLikeResult) {
            score += 50;
        }
        if (administrativeCandidate) {
            score -= 150;
        }
        if (score <= 0) {
            return null;
        }

        return new StreetCandidate(
                displayName,
                geometry.toText(),
                geometry,
                score,
                extractLocalityLabel(address)
        );
    }

    private Geometry parseWktGeometry(String geometryWkt) {
        if (geometryWkt == null || geometryWkt.isBlank()) {
            return null;
        }

        try {
            return normalizeStreetGeometry(wktReader.read(geometryWkt));
        } catch (Exception exception) {
            return null;
        }
    }

    private int scoreStreetMatch(
            List<String> streetTokens,
            List<String> roadTokens,
            List<String> displayTokens,
            List<String> localityTokens
    ) {
        if (streetTokens.isEmpty()) {
            return 0;
        }
        if (containsAllTokens(streetTokens, roadTokens)) {
            return 55;
        }
        if (containsAllTokens(streetTokens, localityTokens)) {
            return -25;
        }
        if (containsAllTokens(streetTokens, displayTokens)) {
            return 35;
        }
        int displayOverlap = overlapCount(streetTokens, displayTokens);
        if (displayOverlap > 0) {
            return displayOverlap * 8;
        }
        return 0;
    }

    boolean isStreetLikeResult(JsonNode result) {
        String resultClass = normalizeText(result.path("class").asText(""));
        String resultType = normalizeText(result.path("type").asText(""));
        String addressType = normalizeText(result.path("addresstype").asText(""));

        return "highway".equals(resultClass)
                || ROAD_RESULT_TYPES.contains(resultType)
                || ROAD_RESULT_TYPES.contains(addressType);
    }

    boolean isAdministrativeCandidate(JsonNode result) {
        String resultClass = normalizeText(result.path("class").asText(""));
        String resultType = normalizeText(result.path("type").asText(""));
        String addressType = normalizeText(result.path("addresstype").asText(""));

        return "boundary".equals(resultClass)
                || "place".equals(resultClass)
                || ADMINISTRATIVE_RESULT_TYPES.contains(resultType)
                || ADMINISTRATIVE_RESULT_TYPES.contains(addressType);
    }

    private int overlapCount(List<String> expected, List<String> actual) {
        return (int) expected.stream().filter(actual::contains).count();
    }

    private boolean containsAllTokens(List<String> expected, List<String> actual) {
        return !expected.isEmpty() && actual.containsAll(expected);
    }

    private String extractAddressText(JsonNode address, List<String> fields) {
        if (address == null || address.isMissingNode()) {
            return "";
        }

        StringBuilder builder = new StringBuilder();
        for (String field : fields) {
            String value = address.path(field).asText("");
            if (!value.isBlank()) {
                if (builder.length() > 0) {
                    builder.append(' ');
                }
                builder.append(value);
            }
        }
        return builder.toString();
    }

    private String extractLocalityLabel(JsonNode address) {
        if (address == null || address.isMissingNode()) {
            return "";
        }

        for (String field : LOCALITY_ADDRESS_FIELDS) {
            String value = address.path(field).asText("");
            if (!value.isBlank()) {
                return value;
            }
        }

        return "";
    }

    private List<JsonNode> search(String query, int limit) throws Exception {
        return search(query, limit, false, null, true);
    }

    private List<JsonNode> searchStreet(String streetReference, int limit) throws Exception {
        return search(buildCountryScopedQuery(streetReference), limit, true, "address", false);
    }

    private List<JsonNode> search(
            String query,
            int limit,
            boolean includeGeometry,
            String layer,
            boolean dedupe
    ) throws Exception {
        UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromUriString(nominatimBaseUrl)
                .path("/search")
                .queryParam("format", "jsonv2")
                .queryParam("addressdetails", "1")
                .queryParam("countrycodes", "uy")
                .queryParam("limit", String.valueOf(limit))
                .queryParam("q", query)
                .queryParam("dedupe", dedupe ? "1" : "0");

        if (includeGeometry) {
            uriBuilder = uriBuilder.queryParam("polygon_geojson", "1");
        }
        if (layer != null && !layer.isBlank()) {
            uriBuilder = uriBuilder.queryParam("layer", layer);
        }

        URI builtUri = uriBuilder.build().encode().toUri();

        HttpRequest request = HttpRequest.newBuilder(builtUri)
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
        if (!root.isArray()) {
            throw new Exception("El servicio de geocodificacion no respondio correctamente.");
        }

        List<JsonNode> results = new ArrayList<>();
        root.forEach(results::add);
        return results;
    }

    private String buildCountryScopedQuery(String value) {
        String normalizedValue = value == null ? "" : value.trim();
        if (normalizedValue.isEmpty()) {
            return normalizedValue;
        }

        return normalizeText(normalizedValue).contains(normalizeText(DEFAULT_COUNTRY_CONTEXT))
                ? normalizedValue
                : normalizedValue + ", " + DEFAULT_COUNTRY_CONTEXT;
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

        return java.util.Arrays.stream(normalized.split("\\s+"))
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

    private Geometry extractStreetGeometry(JsonNode result) {
        JsonNode geojson = result.path("geojson");
        if (geojson.isMissingNode() || geojson.isNull()) {
            return null;
        }

        Geometry geometry = parseGeoJsonGeometry(geojson);
        if (geometry == null || geometry.isEmpty()) {
            return null;
        }

        return normalizeStreetGeometry(geometry);
    }

    private Geometry normalizeStreetGeometry(Geometry geometry) {
        if (geometry == null || geometry.isEmpty()) {
            return null;
        }
        if (geometry instanceof LineString || geometry instanceof MultiLineString) {
            return geometry;
        }
        if (geometry instanceof Polygon || geometry instanceof MultiPolygon) {
            Geometry boundary = geometry.getBoundary();
            return boundary == null || boundary.isEmpty() ? null : boundary;
        }
        if (geometry instanceof GeometryCollection geometryCollection) {
            List<Geometry> linearParts = new ArrayList<>();
            for (int index = 0; index < geometryCollection.getNumGeometries(); index++) {
                Geometry normalizedPart = normalizeStreetGeometry(geometryCollection.getGeometryN(index));
                if (normalizedPart != null && !normalizedPart.isEmpty()) {
                    linearParts.add(normalizedPart);
                }
            }
            if (linearParts.isEmpty()) {
                return null;
            }
            return geometryFactory.buildGeometry(linearParts).union();
        }

        return null;
    }

    private Geometry parseGeoJsonGeometry(JsonNode geojson) {
        String geometryType = geojson.path("type").asText("");
        JsonNode coordinates = geojson.path("coordinates");

        return switch (geometryType) {
            case "Point" -> geometryFactory.createPoint(readCoordinateNode(coordinates));
            case "MultiPoint" -> geometryFactory.createMultiPointFromCoords(readCoordinateArray(coordinates));
            case "LineString" -> geometryFactory.createLineString(readCoordinateArray(coordinates));
            case "MultiLineString" -> createMultiLineString(coordinates);
            case "Polygon" -> createPolygon(coordinates);
            case "MultiPolygon" -> createMultiPolygon(coordinates);
            case "GeometryCollection" -> createGeometryCollection(geojson.path("geometries"));
            default -> null;
        };
    }

    private MultiLineString createMultiLineString(JsonNode coordinates) {
        List<LineString> lineStrings = new ArrayList<>();
        for (JsonNode lineCoordinates : coordinates) {
            lineStrings.add(geometryFactory.createLineString(readCoordinateArray(lineCoordinates)));
        }
        return geometryFactory.createMultiLineString(lineStrings.toArray(LineString[]::new));
    }

    private Polygon createPolygon(JsonNode coordinates) {
        if (!coordinates.isArray() || coordinates.isEmpty()) {
            return null;
        }

        LinearRing shell = geometryFactory.createLinearRing(readCoordinateArray(coordinates.get(0)));
        LinearRing[] holes = new LinearRing[Math.max(0, coordinates.size() - 1)];
        for (int index = 1; index < coordinates.size(); index++) {
            holes[index - 1] = geometryFactory.createLinearRing(readCoordinateArray(coordinates.get(index)));
        }
        return geometryFactory.createPolygon(shell, holes);
    }

    private MultiPolygon createMultiPolygon(JsonNode coordinates) {
        List<Polygon> polygons = new ArrayList<>();
        for (JsonNode polygonCoordinates : coordinates) {
            Polygon polygon = createPolygon(polygonCoordinates);
            if (polygon != null) {
                polygons.add(polygon);
            }
        }
        return geometryFactory.createMultiPolygon(polygons.toArray(Polygon[]::new));
    }

    private GeometryCollection createGeometryCollection(JsonNode geometries) {
        List<Geometry> parts = new ArrayList<>();
        for (JsonNode geometryNode : geometries) {
            Geometry part = parseGeoJsonGeometry(geometryNode);
            if (part != null) {
                parts.add(part);
            }
        }
        return geometryFactory.createGeometryCollection(parts.toArray(Geometry[]::new));
    }

    private Coordinate[] readCoordinateArray(JsonNode coordinates) {
        List<Coordinate> values = new ArrayList<>();
        for (JsonNode coordinateNode : coordinates) {
            values.add(readCoordinateNode(coordinateNode));
        }
        return values.toArray(Coordinate[]::new);
    }

    private Coordinate readCoordinateNode(JsonNode coordinateNode) {
        return new Coordinate(
                coordinateNode.path(0).asDouble(Double.NaN),
                coordinateNode.path(1).asDouble(Double.NaN)
        );
    }

    private double readCoordinate(JsonNode result, String fieldName) throws Exception {
        double value = result.path(fieldName).asDouble(Double.NaN);
        if (Double.isNaN(value)) {
            throw new Exception("El servicio de geocodificacion devolvio coordenadas invalidas.");
        }
        return value;
    }

    private double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double earthRadiusMeters = 6_371_000d;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusMeters * c;
    }

    private Geometry computeGeometryIntersection(Geometry geometry1, Geometry geometry2) {
        try {
            return geometry1.intersection(geometry2);
        } catch (TopologyException exception) {
            try {
                return geometry1.buffer(0).intersection(geometry2.buffer(0));
            } catch (TopologyException ignored) {
                return null;
            }
        }
    }

    private Point representativePointForIntersection(Geometry intersection) {
        if (intersection == null || intersection.isEmpty()) {
            return null;
        }
        if (intersection instanceof Point point) {
            return point;
        }
        if (intersection instanceof MultiPoint multiPoint && multiPoint.getNumGeometries() > 0) {
            return (Point) multiPoint.getGeometryN(0);
        }

        Point interiorPoint = intersection.getInteriorPoint();
        if (interiorPoint != null && !interiorPoint.isEmpty()) {
            return interiorPoint;
        }

        Coordinate coordinate = intersection.getCoordinate();
        return coordinate == null ? null : geometryFactory.createPoint(coordinate);
    }

    public record GeocodedPoint(double lon, double lat, String label) {}

    record IntersectionCandidate(
            double lon,
            double lat,
            String displayName,
            int score,
            String queryVariant,
            int rank
    ) {}

    record StreetCandidate(
            String displayName,
            String geometryWkt,
            Geometry geometry,
            int score,
            String localityLabel
    ) {}

    record StreetIntersectionSelection(
            StreetCandidate street1,
            StreetCandidate street2,
            Point representativePoint,
            int score
    ) {}

    private static final class IntersectionCluster {
        private final List<IntersectionCandidate> candidates = new ArrayList<>();
        private final Set<String> queryVariants = new LinkedHashSet<>();
        private double referenceLon;
        private double referenceLat;

        private IntersectionCluster(IntersectionCandidate candidate) {
            add(candidate);
        }

        private void add(IntersectionCandidate candidate) {
            candidates.add(candidate);
            queryVariants.add(candidate.queryVariant());
            if (candidates.size() == 1) {
                referenceLon = candidate.lon();
                referenceLat = candidate.lat();
                return;
            }

            referenceLon = candidates.stream().mapToDouble(IntersectionCandidate::lon).average().orElse(referenceLon);
            referenceLat = candidates.stream().mapToDouble(IntersectionCandidate::lat).average().orElse(referenceLat);
        }

        private int score() {
            return candidates.stream().mapToInt(IntersectionCandidate::score).sum()
                    + (distinctQueryCount() * 25);
        }

        private int distinctQueryCount() {
            return queryVariants.size();
        }

        private IntersectionCandidate bestCandidate() {
            return candidates.stream()
                    .max(Comparator.comparingInt(IntersectionCandidate::score)
                            .thenComparing(Comparator.comparingInt(IntersectionCandidate::rank).reversed()))
                    .orElseThrow();
        }

        private double referenceLon() {
            return referenceLon;
        }

        private double referenceLat() {
            return referenceLat;
        }
    }
}
