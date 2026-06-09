import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import MapBaseLayer from '@/features/map/MapBaseLayer';
import MapOverlayLayers from '@/features/map/MapOverlayLayers';
import PublicMapSelection from '@/features/map/interactions/PublicMapSelection';
import useMapStore from '@/features/map/mapStore';

const MapCanvas = ({
  screenId,
  zones = [],
  routes = [],
  attractions = [],
  className = '',
  onFeatureSelect,
}) => {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapInstance, setMapInstanceState] = useState(null);
  const { center, zoom, setMapInstance } = useMapStore();

  useEffect(() => {
    if (mapInstanceRef.current || !mapElementRef.current) {
      return undefined;
    }

    const instance = new Map({
      target: mapElementRef.current,
      layers: [],
      view: new View({
        center: fromLonLat(center),
        zoom,
      }),
      controls: [],
    });

    mapInstanceRef.current = instance;
    setMapInstanceState(instance);
    setMapInstance(instance);

    return () => {
      instance.setTarget(undefined);
      mapInstanceRef.current = null;
      setMapInstanceState(null);
      setMapInstance(null);
    };
  }, [setMapInstance]);

  useEffect(() => {
    if (!mapInstanceRef.current) {
      return;
    }
    mapInstanceRef.current.getView().setCenter(fromLonLat(center));
    mapInstanceRef.current.getView().setZoom(zoom);
  }, [center, zoom]);

  return (
    <>
      <div ref={mapElementRef} className={`absolute inset-0 ${className}`} />
      {mapInstance && <MapBaseLayer map={mapInstance} />}
      {mapInstance && (
        <MapOverlayLayers
          map={mapInstance}
          screenId={screenId}
          zones={zones}
          routes={routes}
          attractions={attractions}
          visibleZoneIds={visibleZoneIds}
        />
      )}
      {mapInstance && onFeatureSelect && (
        <PublicMapSelection
          map={mapInstance}
          zones={zones}
          routes={routes}
          attractions={attractions}
          onSelect={onFeatureSelect}
        />
      )}
    </>
  );
};

export default MapCanvas;
