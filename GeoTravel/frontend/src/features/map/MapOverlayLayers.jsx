import AttractionsVectorLayer from '@/features/map/layers/AttractionsVectorLayer';
import AttractionsWmsLayer from '@/features/map/layers/AttractionsWmsLayer';
import RoutesVectorLayer from '@/features/map/layers/RoutesVectorLayer';
import RoutesWmsLayer from '@/features/map/layers/RoutesWmsLayer';
import ZonesVectorLayer from '@/features/map/layers/ZonesVectorLayer';
import ZonesWfsLayer from '@/features/map/layers/ZonesWfsLayer';
import ZonesWmsLayer from '@/features/map/layers/ZonesWmsLayer';
import { getMapLayerStrategy } from '@/shared/config/mapLayers';

const MapOverlayLayers = ({ map, screenId, zones = [], routes = [], attractions = [] }) => {
  const strategy = getMapLayerStrategy(screenId);
  const showZonesWms = strategy.zones === 'wms' || strategy.zonesSupport === 'wms';

  return (
    <>
      {strategy.zones === 'vector-primary' && <ZonesVectorLayer map={map} zones={zones} />}
      {strategy.zones === 'wfs' && <ZonesWfsLayer map={map} />}
      {showZonesWms && <ZonesWmsLayer map={map} />}

      {strategy.routes === 'vector-primary' && <RoutesVectorLayer map={map} routes={routes} />}
      {strategy.routes === 'wms' && <RoutesWmsLayer map={map} />}

      {strategy.attractions === 'vector-primary' && (
        <AttractionsVectorLayer map={map} attractions={attractions} />
      )}
      {strategy.attractions === 'wms' && <AttractionsWmsLayer map={map} />}
    </>
  );
};

export default MapOverlayLayers;
