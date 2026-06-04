import AttractionsVectorLayer from '@/features/map/layers/AttractionsVectorLayer';
import AttractionsWmsLayer from '@/features/map/layers/AttractionsWmsLayer';
import RoutesWfsLayer from '@/features/map/layers/RoutesWfsLayer';
import RoutesWmsLayer from '@/features/map/layers/RoutesWmsLayer';
import ZonesWfsLayer from '@/features/map/layers/ZonesWfsLayer';
import { getMapLayerStrategy } from '@/shared/config/mapLayers';

const MapOverlayLayers = ({ map, screenId, attractions = [] }) => {
  const strategy = getMapLayerStrategy(screenId);

  return (
    <>
      {strategy.zones === 'wfs' && <ZonesWfsLayer map={map} />}

      {strategy.routes === 'wfs' && <RoutesWfsLayer map={map} />}
      {strategy.routes === 'wms' && <RoutesWmsLayer map={map} />}

      {strategy.attractions === 'vector-primary' && (
        <AttractionsVectorLayer map={map} attractions={attractions} />
      )}
      {strategy.attractions === 'wms' && <AttractionsWmsLayer map={map} />}
    </>
  );
};

export default MapOverlayLayers;
