import AttractionsVectorLayer from '@/features/map/layers/AttractionsVectorLayer';
import AttractionsWmsLayer from '@/features/map/layers/AttractionsWmsLayer';
import RoutesVectorLayer from '@/features/map/layers/RoutesVectorLayer';
import RoutesWfsLayer from '@/features/map/layers/RoutesWfsLayer';
import RoutesWmsLayer from '@/features/map/layers/RoutesWmsLayer';
import ZonesVectorLayer from '@/features/map/layers/ZonesVectorLayer';
import ZonesWfsLayer from '@/features/map/layers/ZonesWfsLayer';
import ZonesWmsLayer from '@/features/map/layers/ZonesWmsLayer';
import { getMapLayerStrategy } from '@/shared/config/mapLayers';

const MapOverlayLayers = ({ map, screenId, zones = [], routes = [], attractions = [], visibleZoneIds = null }) => {
  const strategy = getMapLayerStrategy(screenId);
  const showZonesWms = strategy.zones === 'wms' || strategy.zonesSupport === 'wms';

  return (
    <>
      {strategy.zones === 'vector-primary' && (
        <ZonesVectorLayer map={map} zones={zones} visibleZoneIds={visibleZoneIds} />
      )}
      {strategy.zones === 'wfs' && <ZonesWfsLayer map={map} visibleZoneIds={visibleZoneIds} />}
      {showZonesWms && <ZonesWmsLayer map={map} />}

      {strategy.routes === 'vector-primary' && <RoutesVectorLayer map={map} routes={routes} />}
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
