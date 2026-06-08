package com.example.geotravel.service;

import com.example.geotravel.dto.DTRecorrido;
import com.example.geotravel.enums.Estado;
import com.example.geotravel.model.Atraccion;
import com.example.geotravel.model.Recorrido;
import com.example.geotravel.model.RecorridoAtracciones;
import com.example.geotravel.model.Zona;
import com.example.geotravel.repository.AtraccionRepository;
import com.example.geotravel.repository.RecorridoAtraccionesRepository;
import com.example.geotravel.repository.RecorridoRepository;
import com.example.geotravel.repository.ZonaRepository;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public void alta(DTRecorrido dtRecorrido) throws Exception{
        validarRecorrido(dtRecorrido);
        validarAtracciones(dtRecorrido.getAtracciones());
        Recorrido r = recorridoRepository.save(dtoToObj(dtRecorrido));
        int cont = 1;
        for (Long idAtraccion : dtRecorrido.getAtracciones()){
            RecorridoAtracciones recorridoAtracciones = new RecorridoAtracciones();
            recorridoAtracciones.setRecorrido(r);
            recorridoAtracciones.setAtraccion(atraccionRepository.findByIdAtraccion(idAtraccion));
            recorridoAtracciones.setOrden(cont++);
            recorridoAtraccionesRepository.save(recorridoAtracciones);
        }
        historicoService.registrarCambioEstado(r, r.getEstado());
    }

    public void actualizar(DTRecorrido dtRecorrido) throws Exception{
        validarRecorrido(dtRecorrido);
        validarAtracciones(dtRecorrido.getAtracciones());
        Recorrido anterior = recorridoRepository.findByIdRecorrido(dtRecorrido.getIdRecorrido());
        Estado estadoAnterior = anterior != null ? anterior.getEstado() : null;
        Recorrido r = dtoToObj(dtRecorrido);
        recorridoRepository.save(r);
        if (estadoAnterior != null && dtRecorrido.getEstado() != null && !dtRecorrido.getEstado().equals(estadoAnterior)) {
            historicoService.registrarCambioEstado(r, r.getEstado());
        }
        List<RecorridoAtracciones> recorridoAtraccionesList = recorridoAtraccionesRepository.findByRecorridoOrderByOrden(r);
        int cont = 1;
        for (Long idAtraccion : dtRecorrido.getAtracciones()){
            if (recorridoAtraccionesList.isEmpty()){
                RecorridoAtracciones recorridoAtracciones = new RecorridoAtracciones();
                recorridoAtracciones.setRecorrido(r);
                recorridoAtracciones.setAtraccion(atraccionRepository.findByIdAtraccion(idAtraccion));
                recorridoAtracciones.setOrden(cont);
                recorridoAtraccionesRepository.save(recorridoAtracciones);
            } else {
                RecorridoAtracciones re = recorridoAtraccionesList.get(0);
                if (re.getAtraccion().getIdAtraccion() != idAtraccion){
                    re.setAtraccion(atraccionRepository.findByIdAtraccion(idAtraccion));
                    recorridoAtraccionesRepository.save(re);
                }
                recorridoAtraccionesList.remove(0);
            }
            cont++;
        }
        if (!recorridoAtraccionesList.isEmpty()){
            for (RecorridoAtracciones ra : recorridoAtraccionesList)
                recorridoAtraccionesRepository.delete(ra);
        }
    }

    public void eliminar(Long idRecorrido){
        Recorrido r = recorridoRepository.findByIdRecorrido(idRecorrido);
        // Eliminar historicos primero (FK constraint)
        historicoService.eliminarPorRecorrido(idRecorrido);
        // Eliminar relaciones recorrido-atraccion
        List<RecorridoAtracciones> recorridoAtraccionesList = recorridoAtraccionesRepository.findByRecorridoOrderByOrden(r);
        for (RecorridoAtracciones ra : recorridoAtraccionesList)
            recorridoAtraccionesRepository.delete(ra);
        recorridoRepository.delete(r);
    }

    public void cambiarEstado(Long idRecorrido, Estado nuevoEstado) throws Exception{
        Recorrido r = recorridoRepository.findByIdRecorrido(idRecorrido);
        if (r == null) throw new Exception("Recorrido no encontrado.");
        if (nuevoEstado.equals(r.getEstado())) return;
        r.setEstado(nuevoEstado);
        recorridoRepository.save(r);
        historicoService.registrarCambioEstado(r, nuevoEstado);
    }

    public Boolean existe(Long idRecorrido){
        return recorridoRepository.existsByIdRecorrido(idRecorrido);
    }

    @Transactional(readOnly = true)
    public List<DTRecorrido> obtenerTodos(){
        List<DTRecorrido> listDto = new ArrayList<>();
        for (Recorrido r : recorridoRepository.findAll()){
            listDto.add(objToDto(r));
        }
        return listDto;
    }

    @Transactional(readOnly = true)
    public DTRecorrido obtenerPorId(Long id){
        return objToDto(recorridoRepository.findByIdRecorrido(id));
    }

    public Recorrido obtenerObjPorId(Long id){
        return recorridoRepository.findByIdRecorrido(id);
    }

    public Recorrido dtoToObj(DTRecorrido dtRecorrido){
        Recorrido recorrido = new Recorrido();
        recorrido.setIdRecorrido(dtRecorrido.getIdRecorrido());
        recorrido.setMesInicio(dtRecorrido.getMesInicio());
        recorrido.setMesFin(dtRecorrido.getMesFin());
        recorrido.setNombre(dtRecorrido.getNombre());
        recorrido.setDescripcion(dtRecorrido.getDescripcion());
        recorrido.setDuracionEstimada(dtRecorrido.getDuracionEstimada());
        recorrido.setGuiaResponsable(dtRecorrido.getGuiaResponsable());
        recorrido.setTipoExperiencia(dtRecorrido.getTipoExperiencia());
        recorrido.setEstado(dtRecorrido.getEstado());

        if (dtRecorrido.getZonas() == null) {
            recorrido.setZonas(new ArrayList<>());
        } else {
            List<Zona> zonasList = new ArrayList<>();
            for (Long z : dtRecorrido.getZonas()){
                zonasList.add(zonaRepository.findByIdZona(z));
            }
            recorrido.setZonas(zonasList);
        }

        WKTReader reader = new WKTReader();
        try {
            recorrido.setGeomWkt((LineString) reader.read(dtRecorrido.getGeomWkt()));
        } catch(ParseException e) {
            System.err.println(e.getMessage());
            recorrido.setGeomWkt(null);
        }

        return recorrido;
    }

    public DTRecorrido objToDto(Recorrido recorrido){
        DTRecorrido dtRecorrido = new DTRecorrido();
        dtRecorrido.setIdRecorrido(recorrido.getIdRecorrido());
        dtRecorrido.setMesInicio(recorrido.getMesInicio());
        dtRecorrido.setMesFin(recorrido.getMesFin());
        dtRecorrido.setNombre(recorrido.getNombre());
        dtRecorrido.setDescripcion(recorrido.getDescripcion());
        dtRecorrido.setDuracionEstimada(recorrido.getDuracionEstimada());
        dtRecorrido.setGuiaResponsable(recorrido.getGuiaResponsable());
        dtRecorrido.setTipoExperiencia(recorrido.getTipoExperiencia());
        dtRecorrido.setEstado(recorrido.getEstado());

        // Zonas por las que pasa el recorrido
        List<Long> zonasIds = new ArrayList<>();
        if (recorrido.getZonas() != null) {
            for (Zona z : recorrido.getZonas()) {
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

    public void validarRecorrido(DTRecorrido dtRecorrido) throws Exception{
        if (dtRecorrido.getNombre() == null || dtRecorrido.getNombre().trim().isEmpty())
            throw new Exception("Nombre requerido.");
        if (dtRecorrido.getDescripcion() == null || dtRecorrido.getDescripcion().trim().isEmpty())
            throw new Exception("Descripcion requerida.");
        if (dtRecorrido.getDuracionEstimada()  <= 0)
            throw new Exception("Duracion requerida.");
        if (dtRecorrido.getGuiaResponsable() == null || dtRecorrido.getGuiaResponsable().trim().isEmpty())
            throw new Exception("Guia responsable requerido.");
        if (dtRecorrido.getMesInicio() == null || dtRecorrido.getMesInicio() < 1 || dtRecorrido.getMesInicio() > 12)
            throw new Exception("Mes de inicio inválido.");
        if (dtRecorrido.getMesFin() == null || dtRecorrido.getMesFin() < 1 || dtRecorrido.getMesFin() > 12)
            throw new Exception("Mes de fin inválido.");
        if (dtRecorrido.getTipoExperiencia() == null)
            throw new Exception("Experiencia requerida.");
        if (dtRecorrido.getEstado() == null)
            throw new Exception("Estado requerido.");
        if (dtRecorrido.getGeomWkt() == null || dtRecorrido.getGeomWkt().trim().isEmpty())
            throw new Exception("Linea requerida.");
        try {
            WKTReader reader = new WKTReader();
            LineString l = (LineString)reader.read(dtRecorrido.getGeomWkt());
        } catch(ParseException e) {
            throw new Exception("Linea invalida.");
        }
    }

    public void validarAtracciones(List<Long> atraccionesList) throws Exception{
        for (Long id : atraccionesList){
            if (!atraccionRepository.existsByIdAtraccion(id))
                throw new Exception("Una de las atracciones es invalida");
        }
    }

}
