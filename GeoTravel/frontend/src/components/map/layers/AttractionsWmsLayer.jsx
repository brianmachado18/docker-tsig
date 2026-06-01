import { useEffect, useRef } from 'react';
import { createWmsLayer } from '../../../services/geoserver';

const AttractionsWmsLayer = ({ map, zIndex = 25, opacity = 1 }) => {
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map || layerRef.current) {
      return undefined;
    }

    const layer = createWmsLayer('attractions', {
      zIndex,
      opacity,
      properties: {
        layerKey: 'attractions-wms',
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

export default AttractionsWmsLayer;
