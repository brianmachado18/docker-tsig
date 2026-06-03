import { useEffect, useRef } from 'react';
import GeoJSON from 'ol/format/GeoJSON';
import WKT from 'ol/format/WKT';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import { geoserverClient, getGeoServerLayer } from '@/features/map/services/geoserver';

const geojsonFormat = new GeoJSON();
const wktFormat = new WKT();

const zoneStyle = new Style({
  fill: new Fill({ color: 'rgba(10, 108, 68, 0.2)' }),
  stroke: new Stroke({ color: '#0a6c44', width: 2 }),
});

const getFeatureNumericId = (feature) => {
  const explicitId = feature?.get?.('id');
  if (explicitId !== undefined && explicitId !== null) {
    return explicitId;
  }

  const geoServerId = feature?.getId?.();
  return String(geoServerId || '').split('.').pop() || null;
};

const getFeatureWkt = (feature) => {
  const geometry = feature?.getGeometry?.();
  if (!geometry) {
    return '';
  }

  const geometry4326 = geometry.clone().transform('EPSG:3857', 'EPSG:4326');
  return wktFormat.writeGeometry(geometry4326, { decimals: 6 });
};

const normalizeZoneFeature = (feature) => {
  const id = getFeatureNumericId(feature);

  feature.setProperties({
    id,
    name: feature.get('nombre') || feature.get('name') || '',
    description: feature.get('descripcion') || feature.get('description') || '',
    attractionLevel: feature.get('nivel_atractivo') || feature.get('attractionLevel') || 1,
    notes: feature.get('observaciones') || feature.get('notes') || '',
    geomWkt: getFeatureWkt(feature),
    routeIds: [],
    sourceType: 'wfs',
  });
};

const ZonesWfsLayer = ({ map, zIndex = 30 }) => {
  const sourceRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map || layerRef.current) {
      return undefined;
    }

    const layerDefinition = getGeoServerLayer('zones');
    const source = new VectorSource();

    const loadFeatures = async () => {
      const url = geoserverClient.buildWfsUrl(layerDefinition.typeName, {
        workspace: layerDefinition.workspace,
        params: {
          srsName: 'EPSG:4326',
          _ts: Date.now(),
        },
      });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GeoServer WFS zones failed with ${response.status}`);
      }

      const featureCollection = await response.json();
      const features = geojsonFormat.readFeatures(featureCollection, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });

      features.forEach(normalizeZoneFeature);
      source.clear(true);
      source.addFeatures(features);
    };

    source.set('reload', loadFeatures);

    const layer = new VectorLayer({
      source,
      style: zoneStyle,
      zIndex,
      properties: {
        layerKey: 'zones-wfs',
        entityKey: 'zones',
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

export default ZonesWfsLayer;
