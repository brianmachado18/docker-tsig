import { useEffect, useRef } from 'react';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

const MapBaseLayer = ({ map }) => {
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map || layerRef.current) {
      return undefined;
    }

    const layer = new TileLayer({
      source: new OSM(),
      zIndex: 0,
      properties: {
        layerKey: 'base-osm',
        sourceType: 'base',
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
  }, [map]);

  return null;
};

export default MapBaseLayer;
