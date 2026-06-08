import { useEffect, useMemo, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Stroke, Style } from 'ol/style';
import { STATUS_COLORS } from '@/features/routes/routeStatus';

const geojson = new GeoJSON();

const STATUS_STYLES = Object.fromEntries(
  Object.entries(STATUS_COLORS).map(([status, color]) => [
    status,
    new Style({ stroke: new Stroke({ color, width: 3, lineDash: [8, 6] }) }),
  ]),
);

const getRouteStyle = (feature) => STATUS_STYLES[feature.get('status')] ?? STATUS_STYLES.available;

const RoutesVectorLayer = ({ map, routes = [], zIndex = 20 }) => {
  const sourceRef = useRef(null);
  const layerRef = useRef(null);

  const routeFeatures = useMemo(() => {
    if (!routes.length) {
      return [];
    }

    const collection = {
      type: 'FeatureCollection',
      features: routes
        .filter((route) => route.geometry)
        .map((route) => ({
          type: 'Feature',
          properties: {
            id: route.id,
            name: route.name,
            status: route.status,
          },
          geometry: route.geometry,
        })),
    };

    return geojson.readFeatures(collection, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });
  }, [routes]);

  useEffect(() => {
    if (!map || layerRef.current) {
      return undefined;
    }

    const source = new VectorSource();
    const layer = new VectorLayer({
      source,
      style: getRouteStyle,
      zIndex,
      properties: {
        layerKey: 'routes-vector',
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
    if (routeFeatures.length) {
      sourceRef.current.addFeatures(routeFeatures);
    }
  }, [routeFeatures]);

  return null;
};

export default RoutesVectorLayer;
