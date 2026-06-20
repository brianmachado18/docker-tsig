package com.example.geotravel.service;

import com.example.geotravel.dto.DTRecorrido;
import com.example.geotravel.dto.DTBusquedaRecorridoInterseccion;
import com.example.geotravel.dto.DTZona;
import com.example.geotravel.enums.Estado;
import com.example.geotravel.model.Recorrido;
import com.example.geotravel.model.RecorridoAtracciones;
import com.example.geotravel.model.Zona;
import com.example.geotravel.repository.*;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class RecorridoService {

    @Autowired
    private RecorridoRepository recorridoRepository;

    @Autowired
    private ZonaRepository zonaRepository;

    @Autowired
    private AtraccionRepository atraccionRepository;

    @Autowired
    private RecorridoAtraccionesRepository recorridoAtraccionesRepository;

    @Autowired
    private HistoricoService historicoService;

    @Autowired
    private InfraestructuraVialRepository infraestructuraVialRepository;

    @Autowired
    private GeocodingService geocodingService;

    public void alta(DTRecorrido dtRecorrido) throws Exception {
        validarRecorrido(dtRecorrido); // Validar los datos del recorrido
        validarAtracciones(dtRecorrido.getAtracciones()); // Validar las atracciones relacionadas
        Recorrido r = recorridoRepository.save(dtoToObj(dtRecorrido)); // Guardar el recorrido
        int cont = 1;
        for (Long idAtraccion : dtRecorrido.getAtracciones()) { // Guardar las relaciones recorrido-atraccion
            RecorridoAtracciones recorridoAtracciones = new RecorridoAtracciones();
            recorridoAtracciones.setRecorrido(r);
            recorridoAtracciones.setAtraccion(atraccionRepository.findByIdAtraccion(idAtraccion));
            recorridoAtracciones.setOrden(cont++);
            recorridoAtraccionesRepository.save(recorridoAtracciones);
        }
        historicoService.registrarCambioEstado(r, r.getEstado());
    }

    public void actualizar(DTRecorrido dtRecorrido) throws Exception {
        existeRecorrido(dtRecorrido.getIdRecorrido());
        validarRecorrido(dtRecorrido);
        validarAtracciones(dtRecorrido.getAtracciones());
        Recorrido anterior = recorridoRepository.findByIdRecorrido(dtRecorrido.getIdRecorrido());
        Estado estadoAnterior = anterior != null ? anterior.getEstado() : null;
        Recorrido r = dtoToObj(dtRecorrido);
        recorridoRepository.save(r);
        if (estadoAnterior != null && dtRecorrido.getEstado() != null
                && !dtRecorrido.getEstado().equals(estadoAnterior)) {
            historicoService.registrarCambioEstado(r, r.getEstado());
        }
        List<RecorridoAtracciones> recorridoAtraccionesList = recorridoAtraccionesRepository
                .findByRecorridoOrderByOrden(r);
        int cont = 1;
        for (Long idAtraccion : dtRecorrido.getAtracciones()) {
            if (recorridoAtraccionesList.isEmpty()) {
                RecorridoAtracciones recorridoAtracciones = new RecorridoAtracciones();
                recorridoAtracciones.setRecorrido(r);
                recorridoAtracciones.setAtraccion(atraccionRepository.findByIdAtraccion(idAtraccion));
                recorridoAtracciones.setOrden(cont);
                recorridoAtraccionesRepository.save(recorridoAtracciones);
            } else {
                RecorridoAtracciones re = recorridoAtraccionesList.get(0);
                if (re.getAtraccion().getIdAtraccion() != idAtraccion) {
                    re.setAtraccion(atraccionRepository.findByIdAtraccion(idAtraccion));
                    recorridoAtraccionesRepository.save(re);
                }
                recorridoAtraccionesList.remove(0);
            }
            cont++;
        }
        if (!recorridoAtraccionesList.isEmpty()) {
            for (RecorridoAtracciones ra : recorridoAtraccionesList)
                recorridoAtraccionesRepository.delete(ra);
        }
    }

    public void eliminar(Long idRecorrido) throws Exception {
        existeRecorrido(idRecorrido);
        Recorrido r = recorridoRepository.findByIdRecorrido(idRecorrido); // Obtener recorrido
        historicoService.eliminarPorRecorrido(idRecorrido);
        List<RecorridoAtracciones> recorridoAtraccionesList = recorridoAtraccionesRepository
                .findByRecorridoOrderByOrden(r); // Obtener lista recorrido-atracciones
        for (RecorridoAtracciones ra : recorridoAtraccionesList) // Eliminar todos los recorrido-atracciones
            recorridoAtraccionesRepository.delete(ra);
        recorridoRepository.delete(r);
    }

    public void cambiarEstado(Long idRecorrido, Estado nuevoEstado) throws Exception {
        Recorrido recorrido = recorridoRepository.findByIdRecorrido(idRecorrido);
        if (recorrido == null) {
            throw new Exception("Recorrido no encontrado.");
        }
        if (nuevoEstado.equals(recorrido.getEstado())) {
            return;
        }
        recorrido.setEstado(nuevoEstado);
        recorridoRepository.save(recorrido);
        historicoService.registrarCambioEstado(recorrido, nuevoEstado);
    }

    public Boolean existe(Long idRecorrido) {
        return recorridoRepository.existsByIdRecorrido(idRecorrido);
    }

    @Transactional(readOnly = true)
    public List<DTRecorrido> obtenerTodos() {
        List<DTRecorrido> listDto = new ArrayList<>();
        for (Recorrido r : recorridoRepository.findAll()) {
            listDto.add(objToDto(r));
        }
        return listDto;
    }

    @Transactional(readOnly = true)
    public DTRecorrido obtenerPorId(Long id) {
        return objToDto(recorridoRepository.findByIdRecorrido(id));
    }

    @Transactional(readOnly = true)
    public List<DTRecorrido> obtenerPorZona(Long idZona) throws Exception {
        if (!zonaRepository.existsByIdZona(idZona))
            throw new Exception("Zona no encontrada.");

        List<DTRecorrido> listDto = new ArrayList<>();
        for (Recorrido r : recorridoRepository.findByZonaGeom(idZona)) {
            listDto.add(objToDto(r));
        }
        return listDto;
    }

    public Recorrido obtenerObjPorId(Long id) {
        return recorridoRepository.findByIdRecorrido(id);
    }

    @Transactional(readOnly = true)
    public DTBusquedaRecorridoInterseccion obtenerPorInterseccion(String via1, String via2) throws Exception {
        String normalizedVia1 = String.valueOf(via1 == null ? "" : via1).trim();
        String normalizedVia2 = String.valueOf(via2 == null ? "" : via2).trim();

        if (normalizedVia1.isBlank()) {
            throw new Exception("Via 1 requerida.");
        }
        if (normalizedVia2.isBlank()) {
            throw new Exception("Via 2 requerida.");
        }
        if (normalizedVia1.equalsIgnoreCase(normalizedVia2)) {
            throw new Exception("Las referencias deben ser distintas.");
        }

        if (recorridoRepository.count() == 0) {
            throw new Exception("No hay recorridos registrados para evaluar cercania.");
        }

        InfraestructuraVialRepository.RoadReferenceMatch via1Local = resolveRoadReference(normalizedVia1);
        InfraestructuraVialRepository.RoadReferenceMatch via2Local = resolveRoadReference(normalizedVia2);

        if (via1Local != null && via2Local != null) {
            InfraestructuraVialRepository.RouteIntersectionResult interseccion =
                    infraestructuraVialRepository.findNearestRouteByRepresentativeIntersection(
                            via1Local.geometryWkt(),
                            via2Local.geometryWkt(),
                            via1Local.routeNumber(),
                            via2Local.routeNumber()
                    );
            if (interseccion == null || interseccion.routeId() == null) {
                throw new Exception("No se encontro una interseccion representativa entre las referencias ingresadas.");
            }
            return buildIntersectionResult(interseccion);
        }

        GeocodingService.GeocodedPoint geocodedPoint = geocodingService.geocodeIntersection(normalizedVia1, normalizedVia2);
        Long idRecorrido = recorridoRepository.findNearestRecorridoId(geocodedPoint.lon(), geocodedPoint.lat());
        if (idRecorrido == null) {
            throw new Exception("No hay recorridos registrados para evaluar cercania.");
        }

        Double distanciaMetros = recorridoRepository.findDistanceToPoint(
                idRecorrido,
                geocodedPoint.lon(),
                geocodedPoint.lat()
        );

        return buildIntersectionResult(new InfraestructuraVialRepository.RouteIntersectionResult(
                idRecorrido,
                distanciaMetros,
                recorridoRepository.count(),
                "POINT(" + geocodedPoint.lon() + " " + geocodedPoint.lat() + ")",
                null,
                null
        ));
    }

    private DTBusquedaRecorridoInterseccion buildIntersectionResult(
            InfraestructuraVialRepository.RouteIntersectionResult interseccion
    ) throws Exception {
        Recorrido recorrido = recorridoRepository.findByIdRecorrido(interseccion.routeId());
        if (recorrido == null) {
            throw new Exception("Recorrido no encontrado.");
        }

        List<DTZona> zonas = zonasToDto(zonaRepository.findAllByRecorridoIntersects(interseccion.routeId()));

        return new DTBusquedaRecorridoInterseccion(
                objToDto(recorrido),
                zonas,
                interseccion.distanceMeters(),
                interseccion.totalRoutesEvaluated(),
                interseccion.representativePointWkt(),
                interseccion.kmRoute1(),
                interseccion.kmRoute2()
        );
    }

    private InfraestructuraVialRepository.RoadReferenceMatch resolveRoadReference(String reference) {
        Integer routeNumber = tryExtractRouteNumber(reference);
        if (routeNumber != null) {
            InfraestructuraVialRepository.RoadReferenceMatch byNumber =
                    infraestructuraVialRepository.findRoadReferenceByNumber(routeNumber);
            if (byNumber != null) {
                return byNumber;
            }
        }

        return infraestructuraVialRepository.findRoadReferenceByName(reference);
    }

    private Integer tryExtractRouteNumber(String reference) {
        if (reference == null) {
            return null;
        }

        String normalized = reference.trim().toLowerCase();
        if (normalized.matches("^\\d+$")) {
            return Integer.parseInt(normalized);
        }

        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("^ruta\\s+(\\d+)$").matcher(normalized);
        if (matcher.matches()) {
            return Integer.parseInt(matcher.group(1));
        }

        return null;
    }

    public Recorrido dtoToObj(DTRecorrido dtRecorrido) {
        Recorrido recorrido = new Recorrido();
        recorrido.setIdRecorrido(dtRecorrido.getIdRecorrido());
        recorrido.setNombre(dtRecorrido.getNombre());
        recorrido.setDescripcion(dtRecorrido.getDescripcion());
        recorrido.setDuracionEstimada(dtRecorrido.getDuracionEstimada());
        recorrido.setGuiaResponsable(dtRecorrido.getGuiaResponsable());
        recorrido.setTipoExperiencia(dtRecorrido.getTipoExperiencia());
        recorrido.setEstado(dtRecorrido.getEstado());
        recorrido.setFechaInicio(LocalDate.of(LocalDate.now().getYear(), dtRecorrido.getMesInicio(), dtRecorrido.getDiaInicio()));
        recorrido.setFechaFin(LocalDate.of(LocalDate.now().getYear(), dtRecorrido.getMesFin(), dtRecorrido.getDiaFin()));

        recorrido.setZonas(zonaRepository.findByLinestring(dtRecorrido.getGeomWkt()));

        WKTReader reader = new WKTReader();
        try {
            recorrido.setGeomWkt((LineString) reader.read(dtRecorrido.getGeomWkt()));
        } catch (ParseException e) {
            System.err.println(e.getMessage());
            recorrido.setGeomWkt(null);
        }

        return recorrido;
    }

    public DTRecorrido objToDto(Recorrido recorrido) {
        DTRecorrido dtRecorrido = new DTRecorrido();
        dtRecorrido.setIdRecorrido(recorrido.getIdRecorrido());
        dtRecorrido.setNombre(recorrido.getNombre());
        dtRecorrido.setDescripcion(recorrido.getDescripcion());
        dtRecorrido.setDuracionEstimada(recorrido.getDuracionEstimada());
        dtRecorrido.setGuiaResponsable(recorrido.getGuiaResponsable());
        dtRecorrido.setTipoExperiencia(recorrido.getTipoExperiencia());
        dtRecorrido.setEstado(recorrido.getEstado());
        dtRecorrido.setDiaInicio(recorrido.getFechaInicio().getDayOfMonth());
        dtRecorrido.setMesInicio(recorrido.getFechaInicio().getMonthValue());
        dtRecorrido.setDiaFin(recorrido.getFechaFin().getDayOfMonth());
        dtRecorrido.setMesFin(recorrido.getFechaFin().getMonthValue());

        List<Long> zonasIds = new ArrayList<>();
        for (Zona z : zonaRepository.findAllByRecorridoIntersects(recorrido.getIdRecorrido())) {
            if (z != null && z.getIdZona() != null) {
                zonasIds.add(z.getIdZona());
            }
        }
        dtRecorrido.setZonas(zonasIds);

        // Atracciones (paradas) ordenadas por su orden en el recorrido
        List<Long> atraccionesIds = new ArrayList<>();
        for (RecorridoAtracciones ra : recorridoAtraccionesRepository.findByRecorridoOrderByOrden(recorrido)) {
            atraccionesIds.add(ra.getAtraccion().getIdAtraccion());
        }
        dtRecorrido.setAtracciones(atraccionesIds);

        dtRecorrido.setGeomWkt(recorrido.getGeomWkt().toString());
        return dtRecorrido;
    }

    private List<DTZona> zonasToDto(List<Zona> zonas) {
        List<DTZona> zonasDto = new ArrayList<>();
        if (zonas == null) {
            return zonasDto;
        }

        for (Zona zona : zonas) {
            if (zona == null) {
                continue;
            }

            DTZona dtZona = new DTZona();
            dtZona.setIdZona(zona.getIdZona());
            dtZona.setNombre(zona.getNombre());
            dtZona.setDescripcion(zona.getDescripcion());
            dtZona.setNivelAtractivo(zona.getNivelAtractivo());
            dtZona.setObservaciones(zona.getObservaciones());
            dtZona.setGeomWkt(zona.getGeomWkt() != null ? zona.getGeomWkt().toString() : null);
            dtZona.setRecorridos(new ArrayList<>());
            zonasDto.add(dtZona);
        }

        return zonasDto;
    }

    public void existeRecorrido(Long idRecorrido) throws Exception {
        if (!recorridoRepository.existsByIdRecorrido(idRecorrido))
            throw new Exception("Recorrido no encontrado.");
    }

    public void validarRecorrido(DTRecorrido dtRecorrido) throws Exception {
        if (dtRecorrido.getNombre() == null || dtRecorrido.getNombre().trim().isEmpty())
            throw new Exception("Nombre requerido.");
        if (dtRecorrido.getDescripcion() == null || dtRecorrido.getDescripcion().trim().isEmpty())
            throw new Exception("Descripcion requerida.");
        if (dtRecorrido.getDuracionEstimada() <= 0)
            throw new Exception("Duracion requerida.");
        if (dtRecorrido.getGuiaResponsable() == null || dtRecorrido.getGuiaResponsable().trim().isEmpty())
            throw new Exception("Guia responsable requerido.");
        if (dtRecorrido.getTipoExperiencia() == null)
            throw new Exception("Experiencia requerida.");
        if (dtRecorrido.getEstado() == null)
            throw new Exception("Estado requerido.");
        if (dtRecorrido.getGeomWkt() == null || dtRecorrido.getGeomWkt().trim().isEmpty())
            throw new Exception("Linea requerida.");
        try {
            LocalDate.of(LocalDate.now().getYear(), dtRecorrido.getMesInicio(), dtRecorrido.getDiaInicio());
        } catch (DateTimeException e) {
            throw new Exception("Fecha de inicio invalida.");
        }
        try {
            LocalDate.of(LocalDate.now().getYear(), dtRecorrido.getMesFin(), dtRecorrido.getDiaFin());
        } catch (DateTimeException e) {
            throw new Exception("Fecha de fin invalida.");
        }
        if (dtRecorrido.getMesInicio() == dtRecorrido.getMesFin() && dtRecorrido.getDiaInicio() == dtRecorrido.getDiaFin())
            throw new Exception("Las fechas de estacionalidad no pueden ser iguales.");
        try {
            WKTReader reader = new WKTReader();
            LineString l = (LineString) reader.read(dtRecorrido.getGeomWkt());
        } catch (ParseException e) {
            throw new Exception("Linea invalida.");
        }
    }

    public void validarAtracciones(List<Long> atraccionesList) throws Exception {
        for (Long id : atraccionesList) {
            if (!atraccionRepository.existsByIdAtraccion(id))
                throw new Exception("Una de las atracciones es invalida");
        }
    }

}
