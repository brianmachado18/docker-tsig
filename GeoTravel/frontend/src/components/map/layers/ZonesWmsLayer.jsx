import { useEffect, useRef } from 'react';
import { createWmsLayer } from '../../../services/geoserver';

const ZonesWmsLayer = ({ map, zIndex = 10, opacity = 0.55 }) => {
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map || layerRef.current) {
      return undefined;
    }

    const layer = createWmsLayer('zones', {
      zIndex,
      opacity,
      properties: {
        layerKey: 'zones-wms',
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

export default ZonesWmsLayer;
