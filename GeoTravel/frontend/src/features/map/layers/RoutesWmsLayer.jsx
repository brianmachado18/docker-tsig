import { useEffect, useRef } from 'react';
import { createWmsLayer } from '@/features/map/services/geoserver';

const RoutesWmsLayer = ({ map, zIndex = 20, opacity = 0.9 }) => {
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map || layerRef.current) {
      return undefined;
    }

    const layer = createWmsLayer('routes', {
      zIndex,
      opacity,
      properties: {
        layerKey: 'routes-wms',
      },
    });

    map.addLayer(layer);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, opacity, zIndex]);

  return null;
};

export default RoutesWmsLayer;
