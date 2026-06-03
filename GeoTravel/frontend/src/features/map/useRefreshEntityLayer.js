import { useCallback } from 'react';
import useMapStore from '@/features/map/mapStore';

const entityLayerKeys = {
  attractions: ['attractions-wms'],
  routes: ['routes-wms'],
  zones: ['zones-wfs', 'zones-wms'],
};

const useRefreshEntityLayer = (entity) => {
  const refreshWmsLayer = useMapStore((state) => state.refreshWmsLayer);

  return useCallback(() => {
    const layerKeys = entityLayerKeys[entity] || [];
    return layerKeys.some((layerKey) => refreshWmsLayer(layerKey));
  }, [entity, refreshWmsLayer]);
};

export default useRefreshEntityLayer;
