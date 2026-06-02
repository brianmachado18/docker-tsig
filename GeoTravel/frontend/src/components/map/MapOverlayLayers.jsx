import { getMapLayerStrategy } from '../../config/mapLayers';
import AttractionsVectorLayer from './layers/AttractionsVectorLayer';
import AttractionsWmsLayer from './layers/AttractionsWmsLayer';
import RoutesVectorLayer from './layers/RoutesVectorLayer';
import RoutesWmsLayer from './layers/RoutesWmsLayer';
import ZonesVectorLayer from './layers/ZonesVectorLayer';
import ZonesWmsLayer from './layers/ZonesWmsLayer';

const MapOverlayLayers = ({ map, screenId, zones = [], routes = [], attractions = [] }) => {
  const strategy = getMapLayerStrategy(screenId);
  const showZonesWms = strategy.zones === 'wms' || strategy.zonesSupport === 'wms';

  return (
    <>
      {strategy.zones === 'vector-primary' && <ZonesVectorLayer map={map} zones={zones} />}
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
