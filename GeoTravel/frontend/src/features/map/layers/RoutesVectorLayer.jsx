import { useEffect, useMemo, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Stroke, Style } from 'ol/style';
import { STATUS_COLORS } from '@/features/routes/routeStatus';

const geojson = new GeoJSON();

const getRouteStyle = (feature) => {
  const status = feature.get('status') || 'available';
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.available;
  return new Style({
    stroke: new Stroke({ color, width: 3, lineDash: [8, 6] }),
  });
};

const RoutesVectorLayer = ({ map, routes = [], zIndex = 40 }) => {
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
            entityType: 'route',
            id: route.id,
            name: route.name,
            description: route.description,
            durationHours: route.durationHours,
            experienceType: route.experienceType,
            status: route.status,
            startDay: route.startDay,
            startMonth: route.startMonth,
            endDay: route.endDay,
            endMonth: route.endMonth,
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
        entityKey: 'routes',
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
