import { useCallback } from 'react';
import useMapStore from '@/features/map/mapStore';

const entityLayerKeys = {
  attractions: ['attractions-vector', 'attractions-wms'],
  routes: ['routes-wfs', 'routes-wms'],
  zones: ['zones-wfs', 'zones-wms'],
};

const useRefreshEntityLayer = (entity) => {
  const refreshMapLayer = useMapStore((state) => state.refreshMapLayer);

  return useCallback(() => {
    const layerKeys = entityLayerKeys[entity] || [];
    return layerKeys.some((layerKey) => refreshMapLayer(layerKey));
  }, [entity, refreshMapLayer]);
};

export default useRefreshEntityLayer;
