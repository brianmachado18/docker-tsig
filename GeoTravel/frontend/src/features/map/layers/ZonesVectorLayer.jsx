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

const selectedZoneStyle = new Style({
  fill: new Fill({ color: 'rgba(10, 108, 68, 0.28)' }),
  stroke: new Stroke({ color: '#064e3b', width: 4 }),
});

const toComparableId = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return String(value);
};

const getZeroRoutesZoneStyle = (isSelected) =>
  isSelected
    ? new Style({
        fill: new Fill({ color: 'rgba(226, 232, 240, 0.55)' }),
        stroke: new Stroke({ color: '#475569', width: 4 }),
      })
    : new Style({
        fill: new Fill({ color: 'rgba(226, 232, 240, 0.35)' }),
        stroke: new Stroke({ color: '#94a3b8', width: 2 }),
      });

const getActiveRoutesZoneStyle = (activeRoutesCount, maxActiveRoutesCount, isSelected) => {
  if (!maxActiveRoutesCount || activeRoutesCount <= 0) {
    return getZeroRoutesZoneStyle(isSelected);
  }

  const ratio = Math.max(0, Math.min(1, activeRoutesCount / maxActiveRoutesCount));
  const alpha = 0.22 + ratio * 0.48;
  const red = Math.round(209 - ratio * 164);
  const green = Math.round(250 - ratio * 66);
  const blue = Math.round(229 - ratio * 146);

  return new Style({
    fill: new Fill({ color: `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(2)})` }),
    stroke: new Stroke({
      color: isSelected ? '#14532d' : '#166534',
      width: isSelected ? 4 : 2,
    }),
  });
};

const getOffSeasonRoutesZoneStyle = (offSeasonRoutesCount, maxOffSeasonRoutesCount, isSelected) => {
  if (!maxOffSeasonRoutesCount || offSeasonRoutesCount <= 0) {
    return getZeroRoutesZoneStyle(isSelected);
  }

  const ratio = Math.max(0, Math.min(1, offSeasonRoutesCount / maxOffSeasonRoutesCount));
  const alpha = 0.28 + ratio * 0.42;
  const red = Math.round(254 - ratio * 34);
  const green = Math.round(226 - ratio * 188);
  const blue = Math.round(226 - ratio * 188);

  return new Style({
    fill: new Fill({ color: `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(2)})` }),
    stroke: new Stroke({
      color: isSelected ? '#7f1d1d' : '#dc2626',
      width: isSelected ? 4 : 2,
    }),
  });
};

const getReportedRoutesZoneStyle = (
  activeRoutesCount,
  offSeasonRoutesCount,
  maxActiveRoutesCount,
  maxOffSeasonRoutesCount,
  isSelected
) => {
  if (offSeasonRoutesCount > 0) {
    return getOffSeasonRoutesZoneStyle(offSeasonRoutesCount, maxOffSeasonRoutesCount, isSelected);
  }

  if (activeRoutesCount > 0) {
    return getActiveRoutesZoneStyle(activeRoutesCount, maxActiveRoutesCount, isSelected);
  }

  return getZeroRoutesZoneStyle(isSelected);
};

const ZonesVectorLayer = ({
  map,
  zones = [],
  visibleZoneIds = null,
  selectedZoneId = null,
  themeMode = 'default',
  zIndex = 10,
}) => {
  const sourceRef = useRef(null);
  const layerRef = useRef(null);
  const visibleIdsRef = useRef(null);
  const selectedZoneIdRef = useRef(null);
  const themeModeRef = useRef(themeMode);
  const maxActiveRoutesCountRef = useRef(0);
  const maxOffSeasonRoutesCountRef = useRef(0);

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
            activeRoutesCount: zone.activeRoutesCount ?? 0,
            offSeasonRoutesCount: zone.offSeasonRoutesCount ?? 0,
          },
          geometry: zone.geometry,
        })),
    };

    return geojson.readFeatures(collection, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });
  }, [zones]);

  const maxActiveRoutesCount = useMemo(
    () => zones.reduce((max, zone) => Math.max(max, Number(zone?.activeRoutesCount ?? 0)), 0),
    [zones]
  );
  const maxOffSeasonRoutesCount = useMemo(
    () => zones.reduce((max, zone) => Math.max(max, Number(zone?.offSeasonRoutesCount ?? 0)), 0),
    [zones]
  );

  useEffect(() => {
    visibleIdsRef.current = Array.isArray(visibleZoneIds)
      ? visibleZoneIds.map(toComparableId).filter(Boolean)
      : null;
    layerRef.current?.changed();
  }, [visibleZoneIds]);

  useEffect(() => {
    selectedZoneIdRef.current = toComparableId(selectedZoneId);
    layerRef.current?.changed();
  }, [selectedZoneId]);

  useEffect(() => {
    themeModeRef.current = themeMode;
    maxActiveRoutesCountRef.current = maxActiveRoutesCount;
    maxOffSeasonRoutesCountRef.current = maxOffSeasonRoutesCount;
    layerRef.current?.changed();
  }, [maxActiveRoutesCount, maxOffSeasonRoutesCount, themeMode]);

  useEffect(() => {
    if (!map || layerRef.current) {
      return undefined;
    }

    const source = new VectorSource();
    const layer = new VectorLayer({
      source,
      style: (feature) => {
        const visibleIds = visibleIdsRef.current;
        const currentThemeMode = themeModeRef.current;
        const currentMaxActiveRoutesCount = maxActiveRoutesCountRef.current;
        const currentMaxOffSeasonRoutesCount = maxOffSeasonRoutesCountRef.current;
        if (visibleIds === null) {
          const isSelected = toComparableId(feature?.get?.('id')) === selectedZoneIdRef.current;
          if (currentThemeMode === 'active-routes') {
            return getReportedRoutesZoneStyle(
              Number(feature?.get?.('activeRoutesCount') ?? 0),
              Number(feature?.get?.('offSeasonRoutesCount') ?? 0),
              currentMaxActiveRoutesCount,
              currentMaxOffSeasonRoutesCount,
              isSelected
            );
          }

          return isSelected ? selectedZoneStyle : zoneStyle;
        }

        const featureId = toComparableId(feature?.get?.('id'));
        if (!visibleIds.includes(featureId)) {
          return null;
        }

        const isSelected = featureId === selectedZoneIdRef.current;
        if (currentThemeMode === 'active-routes') {
          return getReportedRoutesZoneStyle(
            Number(feature?.get?.('activeRoutesCount') ?? 0),
            Number(feature?.get?.('offSeasonRoutesCount') ?? 0),
            currentMaxActiveRoutesCount,
            currentMaxOffSeasonRoutesCount,
            isSelected
          );
        }

        return isSelected ? selectedZoneStyle : zoneStyle;
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
