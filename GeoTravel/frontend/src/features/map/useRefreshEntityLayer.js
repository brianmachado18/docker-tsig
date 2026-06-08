import { useCallback } from 'react';
import WKT from 'ol/format/WKT';
import useMapStore from '@/features/map/mapStore';

const wktFormat = new WKT();

const entityLayerKeys = {
  attractions: ['attractions-vector', 'attractions-wms'],
  routes: ['routes-wfs', 'routes-wms'],
  zones: ['zones-wfs', 'zones-wms'],
};

const restorePersistedGeometry = (feature) => {
  const persistedGeomWkt = feature?.get?.('persistedGeomWkt');
  if (!persistedGeomWkt) {
    return;
  }

  const geometry = wktFormat.readGeometry(persistedGeomWkt, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  });
  feature.setGeometry(geometry);
  feature.set('geomWkt', persistedGeomWkt);
  feature.unset('draftGeomWkt');
  feature.unset('hasDraftGeometry');
};

const commitDraftGeometry = (feature) => {
  const geomWkt = feature?.get?.('draftGeomWkt') || feature?.get?.('geomWkt');
  if (!geomWkt) {
    return;
  }

  feature.set('persistedGeomWkt', geomWkt);
  feature.set('geomWkt', geomWkt);
  feature.unset('draftGeomWkt');
  feature.unset('hasDraftGeometry');
};

const forEachZoneFeature = (map, callback) => {
  map
    ?.getLayers()
    ?.getArray()
    ?.filter((layer) => layer?.get?.('entityKey') === 'zones')
    ?.forEach((layer) => {
      layer
        ?.getSource?.()
        ?.getFeatures?.()
        ?.forEach(callback);
    });
};

const entityDraftActions = {
  zones: (map) => {
    map
      ?.getLayers()
      ?.getArray()
      ?.filter((layer) => layer?.get?.('entityKey') === 'zones')
      ?.forEach((layer) => {
        const source = layer?.getSource?.();
        source
          ?.getFeatures?.()
          ?.filter((feature) => feature?.get?.('isDraftZone'))
          ?.forEach((feature) => source.removeFeature(feature));
      });
    forEachZoneFeature(map, (feature) => {
      if (feature?.get?.('hasDraftGeometry')) {
        restorePersistedGeometry(feature);
      }
    });
  },
};

const entityCommitActions = {
  zones: (map) => {
    forEachZoneFeature(map, (feature) => {
      if (feature?.get?.('hasDraftGeometry')) {
        commitDraftGeometry(feature);
      }
    });
  },
};

const useRefreshEntityLayer = (entity) => {
  const refreshMapLayer = useMapStore((state) => state.refreshMapLayer);
  const map = useMapStore((state) => state.mapInstance);

  return useCallback((options = {}) => {
    const { commitDrafts = false, discardDrafts = true } = options;
    const layerKeys = entityLayerKeys[entity] || [];
    if (commitDrafts) {
      entityCommitActions[entity]?.(map);
    } else if (discardDrafts) {
      entityDraftActions[entity]?.(map);
    }
    return layerKeys.some((layerKey) => refreshMapLayer(layerKey));
  }, [entity, map, refreshMapLayer]);
};

export default useRefreshEntityLayer;
