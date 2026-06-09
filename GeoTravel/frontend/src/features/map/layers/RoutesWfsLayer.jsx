import { useEffect, useRef } from 'react';
import GeoJSON from 'ol/format/GeoJSON';
import WKT from 'ol/format/WKT';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import { fetchWfsFeatureCollection } from '@/features/map/services/geoserver';
import useRouteFilterStore, { matchesRouteFilter } from '@/features/map/routeFilterStore';
import { STATUS_COLORS } from '@/features/routes/routeStatus';

const geojsonFormat = new GeoJSON();
const wktFormat = new WKT();

const getRouteStyle = (feature) => {
  const status = feature.get('status') || 'available';
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.available;
  return new Style({
    stroke: new Stroke({ color, width: 4, lineDash: [10, 6] }),
  });
};

const toEntityId = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : value;
};

const getFeatureValue = (feature, keys) => {
  for (const key of keys) {
    const value = feature?.get?.(key);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return null;
};

const getFeatureNumericId = (feature) => {
  const explicitId = getFeatureValue(feature, ['id', 'idRecorrido', 'id_recorrido']);
  if (explicitId !== null) {
    return toEntityId(explicitId);
  }

  const geoServerId = feature?.getId?.();
  return toEntityId(String(geoServerId || '').split('.').pop());
};

const getFeatureWkt = (feature) => {
  const geometry = feature?.getGeometry?.();
  if (!geometry) {
    return '';
  }

  const geometry4326 = geometry.clone().transform('EPSG:3857', 'EPSG:4326');
  return wktFormat.writeGeometry(geometry4326, { decimals: 6 });
};

const normalizeStatus = (status) => {
  switch (String(status || '').toUpperCase()) {
    case 'FUERA_DE_ESTACION':
    case 'OFF-SEASON':
      return 'off-season';
    case 'PENDIENTE':
    case 'PENDING':
      return 'pending';
    case 'CANCELADO':
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'available';
  }
};

const normalizeExperienceType = (type) => {
  switch (String(type || '').toUpperCase()) {
    case 'GASTRONOMICO':
      return 'gastronomic';
    case 'NATURAL':
      return 'natural';
    case 'HITORICA':
    case 'HISTORICA':
      return 'historical';
    case 'AVENTURA':
      return 'adventure';
    case 'OTRO':
      return 'other';
    default:
      return 'cultural';
  }
};

const normalizeRouteFeature = (feature) => {
  const id = getFeatureNumericId(feature);
  const stationId = getFeatureValue(feature, ['stationId', 'idEstacion', 'id_estacion']);
  const durationHours = getFeatureValue(feature, [
    'durationHours',
    'duracionEstimada',
    'duracion_estimada',
  ]);
  const status = getFeatureValue(feature, ['status', 'estado']);
  const experienceType = getFeatureValue(feature, ['experienceType', 'tipoExperiencia', 'tipo_experiencia']);

  feature.setProperties({
    id,
    stationId: toEntityId(stationId),
    name: getFeatureValue(feature, ['name', 'nombre']) || '',
    description: getFeatureValue(feature, ['description', 'descripcion']) || '',
    durationHours: durationHours === null ? '' : Number(durationHours),
    guide: getFeatureValue(feature, ['guide', 'guiaResponsable', 'guia_responsable']) || '',
    experienceType: normalizeExperienceType(experienceType),
    status: normalizeStatus(status),
    geomWkt: getFeatureWkt(feature),
    zoneIds: [],
    sourceType: 'wfs',
  });
};

const RoutesWfsLayer = ({ map, zIndex = 30 }) => {
  const sourceRef = useRef(null);
  const layerRef = useRef(null);
  const status = useRouteFilterStore((state) => state.status);
  const experienceType = useRouteFilterStore((state) => state.experienceType);
  const filterRef = useRef({ status, experienceType });

  // El filtro actual vive en un ref para que la función de estilo lo lea sin recrear la capa.
  // Al cambiar el filtro, forzamos el re-render de la capa.
  useEffect(() => {
    filterRef.current = { status, experienceType };
    layerRef.current?.changed();
  }, [status, experienceType]);

  useEffect(() => {
    if (!map || layerRef.current) {
      return undefined;
    }

    const source = new VectorSource();

    const loadFeatures = async () => {
      const featureCollection = await fetchWfsFeatureCollection('routes', {
        srsName: 'EPSG:4326',
        _ts: Date.now(),
      });
      const features = geojsonFormat.readFeatures(featureCollection, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });

      features.forEach(normalizeRouteFeature);
      source.clear(true);
      source.addFeatures(features);
    };

    source.set('reload', loadFeatures);

    const layer = new VectorLayer({
      source,
      // Estilo por feature: si no pasa el filtro, devolvemos null y el recorrido se oculta.
      style: (feature) =>
        matchesRouteFilter(feature.getProperties(), filterRef.current) ? getRouteStyle(feature) : null,
      zIndex,
      properties: {
        layerKey: 'routes-wfs',
        entityKey: 'routes',
        sourceType: 'wfs',
      },
    });

    map.addLayer(layer);
    sourceRef.current = source;
    layerRef.current = layer;
    loadFeatures();

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

  return null;
};

export default RoutesWfsLayer;
