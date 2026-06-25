import { useEffect, useRef } from 'react';
import HeatmapLayer from 'ol/layer/Heatmap';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import useHeatmapStore from '@/features/map/heatmapStore';

const geojson = new GeoJSON();

// Construye un punto por atracción. El "peso" es 1 para todas: el mapa de calor
// se intensifica solo por densidad (cuantas más atracciones cerca, más caliente).
const buildHeatFeatures = (attractions) => {
  const collection = {
    type: 'FeatureCollection',
    features: (attractions || [])
      .filter((attraction) => attraction.coordinates)
      .map((attraction) => ({
        type: 'Feature',
        properties: { weight: 1 },
        geometry: { type: 'Point', coordinates: [...attraction.coordinates] },
      })),
  };

  return geojson.readFeatures(collection, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  });
};

const AttractionsHeatmapLayer = ({ map, attractions = [], zIndex = 45 }) => {
  const sourceRef = useRef(null);
  const layerRef = useRef(null);
  const visible = useHeatmapStore((state) => state.visible);

  // Crear la capa una sola vez (arranca oculta; el toggle la muestra).
  useEffect(() => {
    if (!map || layerRef.current) {
      return undefined;
    }

    const source = new VectorSource();
    const layer = new HeatmapLayer({
      source,
      blur: 20,
      radius: 12,
      weight: 'weight',
      zIndex,
      visible: false,
      properties: { layerKey: 'attractions-heatmap', entityKey: 'attractions-heatmap' },
    });

    map.addLayer(layer);
    sourceRef.current = source;
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.clear(true);
        sourceRef.current = null;
      }
    };
  }, [map, zIndex]);

  // Refrescar los puntos cuando cambian las atracciones.
  useEffect(() => {
    if (!sourceRef.current) {
      return;
    }
    sourceRef.current.clear(true);
    sourceRef.current.addFeatures(buildHeatFeatures(attractions));
  }, [attractions]);

  // Prender/apagar según el toggle.
  useEffect(() => {
    layerRef.current?.setVisible(visible);
  }, [visible]);

  return null;
};

export default AttractionsHeatmapLayer;
