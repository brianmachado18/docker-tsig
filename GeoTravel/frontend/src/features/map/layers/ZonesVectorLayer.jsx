import { useEffect, useMemo, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style } from 'ol/style';

const geojson = new GeoJSON();

const zoneStyle = new Style({
  fill: new Fill({ color: 'rgba(10, 108, 68, 0.2)' }),
  stroke: new Stroke({ color: '#0a6c44', width: 2 }),
});

const ZonesVectorLayer = ({ map, zones = [], zIndex = 30 }) => {
  const sourceRef = useRef(null);
  const layerRef = useRef(null);

  const zoneFeatures = useMemo(() => {
    if (!zones.length) {
      return [];
    }

    const collection = {
      type: 'FeatureCollection',
      features: zones
        .filter((zone) => zone.geometry)
        .map((zone) => ({
          type: 'Feature',
          properties: {
            id: zone.id,
            name: zone.name,
            status: zone.status,
          },
          geometry: zone.geometry,
        })),
    };

    return geojson.readFeatures(collection, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });
  }, [zones]);

  useEffect(() => {
    if (!map || layerRef.current) {
      return undefined;
    }

    const source = new VectorSource();
    const layer = new VectorLayer({
      source,
      style: zoneStyle,
      zIndex,
      properties: {
        layerKey: 'zones-vector',
        sourceType: 'vector',
      },
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

  useEffect(() => {
    if (!sourceRef.current) {
      return;
    }

    sourceRef.current.clear(true);
    if (zoneFeatures.length) {
      sourceRef.current.addFeatures(zoneFeatures);
    }
  }, [zoneFeatures]);

  return null;
};

export default ZonesVectorLayer;
