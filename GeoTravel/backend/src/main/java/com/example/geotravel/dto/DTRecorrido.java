package com.example.geotravel.dto;

import com.example.geotravel.enums.Estado;
import com.example.geotravel.enums.TipoExperiencia;
import com.example.geotravel.model.Recorrido;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;

import java.time.LocalDate;

@Data
@NoArgsConstructor
public class DTRecorrido {
    private Long idRecorrido;
    private String nombre;
    private String descripcion;
    private int duracionEstimada;
    private String guiaResponsable;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private TipoExperiencia tipoExperiencia;
    private Estado estado;
    private String geomWkt;

    public Recorrido dtoToObj(){
        Recorrido recorrido = new Recorrido();
        recorrido.setIdRecorrido(this.getIdRecorrido());
        recorrido.setNombre(this.getNombre());
        recorrido.setDescripcion(this.getDescripcion());
        recorrido.setDuracionEstimada(this.getDuracionEstimada());
        recorrido.setGuiaResponsable(this.getGuiaResponsable());
        recorrido.setFechaInicio(this.getFechaInicio());
        recorrido.setFechaFin(this.getFechaFin());
        recorrido.setTipoExperiencia(this.getTipoExperiencia());
        recorrido.setEstado(this.getEstado());
        WKTReader reader = new WKTReader();
        try {
            recorrido.setGeomWkt((LineString) reader.read(this.geomWkt));
        } catch(ParseException e) {
            System.err.println(e.getMessage());
            recorrido.setGeomWkt(null);
        }
        return recorrido;
    }

}
