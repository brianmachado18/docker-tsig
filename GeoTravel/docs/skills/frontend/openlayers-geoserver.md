# Skill: Integración de OpenLayers con GeoServer

## 📌 Propósito
Implementar mapas interactivos con OpenLayers, integrando servicios WMS/WFS de GeoServer para visualizar y editar datos geoespaciales en tiempo real.

## 🎯 Cuándo Usar Este Skill

**USE ESTE SKILL CUANDO:**
- Necesites crear o actualizar componentes de mapa
- Debas integrar capas WMS/WFS desde GeoServer
- Requieras edición geométrica (polígonos, líneas, puntos)
- Necesites consultas espaciales (intersección, buffer, proximidad)
- Debas implementar controles de mapa (zoom, pan, búsqueda)

**NO USES ESTE SKILL PARA:**
- UI components genéricos (usa skill de Componentes React)
- Lógica de negocio (usa skill de State Management)
- Llamadas HTTP simples (usa skill de Servicios)

## 🗺️ Arquitectura de Mapas

### Estructura Recomendada
```
src/
├── components/map/
│   ├── Map.jsx              # Contenedor principal del mapa
│   ├── MapControls.jsx      # Botones de control (zoom, pan, etc.)
│   ├── ZoneLayer.jsx        # Capa de zonas turísticas
│   ├── RouteLayer.jsx       # Capa de recorridos
│   ├── AttractionLayer.jsx  # Capa de atracciones
│   ├── SearchLayer.jsx      # Visualización de resultados de búsqueda
│   ├── MapLegend.jsx        # Leyenda interactiva
│   └── GeometryEditor.jsx   # Editor de polígonos/líneas
├── services/
│   └── geoserver.js         # Cliente GeoServer (WMS/WFS)
├── hooks/
│   ├── useMap.js            # Hook para instancia de mapa
│   ├── useZoneLayer.js      # Hook para capa de zonas
│   ├── useRouteLayer.js     # Hook para capa de recorridos
│   └── useGeometryEditor.js # Hook para edición
└── utils/
    └── geoHelpers.js        # Utilidades geoespaciales
```

## 🔧 Inicialización de Mapa

### Mapa Base
```javascript
// src/hooks/useMap.js
import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';

export const useMap = (targetElement, options = {}) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!targetElement) return;

    const map = new Map({
      target: targetElement,
      layers: [
        new TileLayer({
          source: new OSM(),
          opacity: 0.8,
        }),
      ],
      view: new View({
        center: fromLonLat(options.center || [-56, -33]), // Uruguay center
        zoom: options.zoom || 10,
        minZoom: 5,
        maxZoom: 18,
      }),
    });

    mapRef.current = map;
    return () => map.dispose();
  }, [targetElement, options]);

  return mapRef.current;
};
```

## 🌍 Capas GeoServer (WMS)

### Ejemplo: Capa de Zonas
```javascript
// src/components/map/ZoneLayer.jsx
import { useEffect } from 'react';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import { useMap } from '../../hooks/useMap';

export const ZoneLayer = ({ map, visible = true }) => {
  useEffect(() => {
    if (!map) return;

    const wmsSource = new ImageWMS({
      url: 'http://localhost:8080/geoserver/wms',
      params: {
        SERVICE: 'WMS',
        VERSION: '1.1.1',
        REQUEST: 'GetMap',
        LAYERS: 'GeoTravel:zonas_turisticas',
        SRS: 'EPSG:3857',
        FORMAT: 'image/png',
        TRANSPARENT: true,
      },
      serverType: 'geoserver',
    });

    const wmsLayer = new ImageLayer({
      source: wmsSource,
      visible: visible,
      name: 'Zonas Turísticas',
      properties: {
        type: 'zones',
      },
    });

    map.addLayer(wmsLayer);
    return () => map.removeLayer(wmsLayer);
  }, [map, visible]);
};
```

## 📍 Capas Vectoriales (WFS)

### Lectura y Escritura con WFS-T
```javascript
// src/services/geoserver.js
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Stroke, Style, Fill } from 'ol/style';

export const createZoneVectorLayer = (map) => {
  const vectorSource = new VectorSource({
    format: new GeoJSON(),
    url: 'http://localhost:8080/geoserver/wfs',
    loader: (extent, resolution, projection) => {
      const url = `http://localhost:8080/geoserver/wfs?
        service=WFS&
        version=2.0.0&
        request=GetFeature&
        typeName=GeoTravel:zonas_turisticas&
        outputFormat=application/json&
        srsname=EPSG:3857`;

      fetch(url)
        .then(response => response.json())
        .then(data => {
          const features = new GeoJSON().readFeatures(data);
          vectorSource.addFeatures(features);
        });
    },
    strategy: 'all', // Cargar todas las features
  });

  const style = new Style({
    fill: new Fill({
      color: 'rgba(0, 32, 69, 0.3)', // primary con transparencia
    }),
    stroke: new Stroke({
      color: '#002045', // primary
      width: 2,
    }),
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: style,
    name: 'Zonas Turísticas',
  });

  return { vectorLayer, vectorSource };
};
```

## ✏️ Editor Geométrico (Polígonos)

### Draw & Modify Interactions
```javascript
// src/components/map/GeometryEditor.jsx
import { useEffect } from 'react';
import { Draw, Modify, Select } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle, Style, Stroke, Fill } from 'ol/style';

export const GeometryEditor = ({ map, mode = 'draw', geometryType = 'Polygon' }) => {
  useEffect(() => {
    if (!map) return;

    // Crear capa de edición
    const editSource = new VectorSource();
    const editLayer = new VectorLayer({
      source: editSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(255, 0, 0, 0.2)' }),
        stroke: new Stroke({ color: '#ff0000', width: 2 }),
        image: new Circle({
          radius: 5,
          fill: new Fill({ color: '#ff0000' }),
        }),
      }),
      name: 'Edit Layer',
    });

    map.addLayer(editLayer);

    if (mode === 'draw') {
      const draw = new Draw({
        source: editSource,
        type: geometryType,
      });

      map.addInteraction(draw);

      draw.on('drawend', (event) => {
        const feature = event.feature;
        const geometry = feature.getGeometry();
        console.log('Geometry drawn:', geometry.getCoordinates());
      });

      return () => {
        map.removeInteraction(draw);
        map.removeLayer(editLayer);
      };
    } else if (mode === 'modify') {
      const select = new Select();
      const modify = new Modify({ features: select.getFeatures() });

      map.addInteraction(select);
      map.addInteraction(modify);

      return () => {
        map.removeInteraction(select);
        map.removeInteraction(modify);
        map.removeLayer(editLayer);
      };
    }
  }, [map, mode, geometryType]);
};
```

## 🔍 Consultas Espaciales

### Búsqueda de Recorridos dentro de Zona
```javascript
// src/hooks/useGeoQuery.js
import axios from 'axios';

export const useGeoQuery = () => {
  const queryRoutesByZone = async (zoneName) => {
    try {
      const response = await axios.get(
        'http://localhost:8080/geoserver/wfs',
        {
          params: {
            service: 'WFS',
            version: '2.0.0',
            request: 'GetFeature',
            typeName: 'GeoTravel:recorridos',
            CQL_FILTER: `ST_Intersects(geometry, (SELECT geometry FROM GeoTravel:zonas_turisticas WHERE nombre='${zoneName}'))`,
            outputFormat: 'application/json',
          },
        }
      );
      return response.data.features;
    } catch (error) {
      console.error('Error querying routes by zone:', error);
      throw error;
    }
  };

  const queryNearestRoute = async (intersection) => {
    // Consulta para encontrar recorrido más cercano
    try {
      const response = await axios.get(
        'http://localhost:8080/geoserver/wfs',
        {
          params: {
            service: 'WFS',
            version: '2.0.0',
            request: 'GetFeature',
            typeName: 'GeoTravel:recorridos',
            CQL_FILTER: `ST_DWithin(geometry, ST_GeomFromText('POINT(${intersection.lon} ${intersection.lat})', 4326), 1000)`,
            outputFormat: 'application/json',
            sortBy: 'distance',
          },
        }
      );
      return response.data.features[0];
    } catch (error) {
      console.error('Error querying nearest route:', error);
      throw error;
    }
  };

  return { queryRoutesByZone, queryNearestRoute };
};
```

## 🎨 Estilos Dinámicos por Estado

```javascript
// src/utils/geoHelpers.js
export const getRouteStyle = (status) => {
  const styleConfig = {
    available: {
      color: '#2f855a', // status-available
      opacity: 0.7,
    },
    pending: {
      color: '#ed8936', // status-pending
      opacity: 0.7,
    },
    'off-season': {
      color: '#718096', // status-off-season
      opacity: 0.5,
      lineDash: [5, 5],
    },
    cancelled: {
      color: '#e53e3e', // status-cancelled
      opacity: 0.3,
      lineDash: [2, 2],
    },
  };

  const config = styleConfig[status];
  return new Style({
    stroke: new Stroke({
      color: config.color,
      width: 3,
      lineDash: config.lineDash,
    }),
    fill: new Fill({
      color: config.color + Math.floor(config.opacity * 255).toString(16),
    }),
  });
};

export const getAttractionStyle = () => {
  return new Style({
    image: new Circle({
      radius: 8,
      fill: new Fill({
        color: '#805ad5', // attraction-marker
      }),
      stroke: new Stroke({
        color: '#ffffff',
        width: 2,
      }),
    }),
  });
};
```

## 🧭 Controles de Mapa

```javascript
// src/components/map/MapControls.jsx
import { useEffect } from 'react';
import { Zoom, FullScreen } from 'ol/control';

export const MapControls = ({ map }) => {
  useEffect(() => {
    if (!map) return;

    // Agregar controles
    const zoom = new Zoom();
    const fullScreen = new FullScreen();

    map.addControl(zoom);
    map.addControl(fullScreen);

    return () => {
      map.removeControl(zoom);
      map.removeControl(fullScreen);
    };
  }, [map]);

  const handleZoomIn = () => map?.getView().animate({ zoom: map?.getView().getZoom() + 1 });
  const handleZoomOut = () => map?.getView().animate({ zoom: map?.getView().getZoom() - 1 });
  const handleFitAll = () => {
    // Ajustar vista a todas las features
    if (map) {
      map.getView().animate({
        center: [-56, -33],
        zoom: 10,
      });
    }
  };

  return (
    <div className="absolute top-4 right-4 space-y-2 z-10">
      <button onClick={handleZoomIn} className="bg-white p-2 rounded shadow">+</button>
      <button onClick={handleZoomOut} className="bg-white p-2 rounded shadow">−</button>
      <button onClick={handleFitAll} className="bg-white p-2 rounded shadow">Ajustar</button>
    </div>
  );
};
```

## 📋 Checklist de Mapa

- [ ] Mapa base inicializado correctamente
- [ ] Capas WMS/WFS cargadas
- [ ] Estilos aplicados según design system
- [ ] Interacciones (draw, modify, select) funcionales
- [ ] Consultas espaciales implementadas
- [ ] Leyenda visible y actualizable
- [ ] Performance optimizado (lazy loading, clustering)
- [ ] Responsive en todos los tamaños
- [ ] Accesibilidad de controles garantizada

## 🔗 Componentes Relacionados

- Consulta el skill: **Servicios y APIs** para llamadas GeoServer
- Consulta el skill: **State Management** para sincronizar estado del mapa

---

**Última actualización**: Mayo 2026
