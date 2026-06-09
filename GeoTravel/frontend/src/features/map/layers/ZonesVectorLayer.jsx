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

const ZonesVectorLayer = ({ map, zones = [], zIndex = 10 }) => {
  const sourceRef = useRef(null);
  const layerRef = useRef(null);
  const visibleIdsRef = useRef(null);

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
            entityType: 'zone',
            id: zone.id,
            name: zone.name,
            description: zone.description,
            attractionLevel: zone.attractionLevel,
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
    visibleIdsRef.current = Array.isArray(visibleZoneIds)
      ? visibleZoneIds.map(toComparableId).filter(Boolean)
      : null;
    layerRef.current?.changed();
  }, [visibleZoneIds]);

  useEffect(() => {
    if (!map || layerRef.current) {
      return undefined;
    }

    const source = new VectorSource();
    const layer = new VectorLayer({
      source,
      style: (feature) => {
        const visibleIds = visibleIdsRef.current;
        if (!visibleIds || !visibleIds.length) {
          return zoneStyle;
        }

        const featureId = toComparableId(feature?.get?.('id'));
        return visibleIds.includes(featureId) ? zoneStyle : null;
      },
      zIndex,
      properties: {
        entityKey: 'zones',
        layerKey: 'zones-vector',
        entityKey: 'zones',
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
