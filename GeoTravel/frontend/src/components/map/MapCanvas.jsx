import React, { useEffect, useMemo, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style, Circle as CircleStyle } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import useMapStore from '../../store/mapStore';

const geojson = new GeoJSON();

const zoneStyle = new Style({
  fill: new Fill({ color: 'rgba(10, 108, 68, 0.2)' }),
  stroke: new Stroke({ color: '#0a6c44', width: 2 }),
});

const routeStyle = new Style({
  stroke: new Stroke({ color: '#002045', width: 3, lineDash: [8, 6] }),
});

const attractionStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: '#805ad5' }),
    stroke: new Stroke({ color: '#ffffff', width: 2 }),
  }),
});

const MapCanvas = ({ zones = [], routes = [], attractions = [], className = '' }) => {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const zonesSourceRef = useRef(new VectorSource());
  const routesSourceRef = useRef(new VectorSource());
  const attractionsSourceRef = useRef(new VectorSource());
  const { center, zoom, setMapInstance } = useMapStore();

  const zoneFeatures = useMemo(() => {
    if (!zones.length) {
      return [];
    }
    const collection = {
      type: 'FeatureCollection',
      features: zones
        .filter((zone) => zone.geometry)
        .map((zone) => ({
          type: 'Feature',
          properties: {
            id: zone.id,
            name: zone.name,
            status: zone.status,
          },
          geometry: zone.geometry,
        })),
    };
    return geojson.readFeatures(collection, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });
  }, [zones]);

  const routeFeatures = useMemo(() => {
    if (!routes.length) {
      return [];
    }
    const collection = {
      type: 'FeatureCollection',
      features: routes
        .filter((route) => route.geometry)
        .map((route) => ({
          type: 'Feature',
          properties: {
            id: route.id,
            name: route.name,
            status: route.status,
          },
          geometry: route.geometry,
        })),
    };
    return geojson.readFeatures(collection, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });
  }, [routes]);

  const attractionFeatures = useMemo(() => {
    if (!attractions.length) {
      return [];
    }
    const collection = {
      type: 'FeatureCollection',
      features: attractions
        .filter((attraction) => attraction.coordinates)
        .map((attraction) => ({
          type: 'Feature',
          properties: {
            id: attraction.id,
            name: attraction.title,
            status: attraction.status,
          },
          geometry: {
            type: 'Point',
            coordinates: attraction.coordinates,
          },
        })),
    };
    return geojson.readFeatures(collection, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });
  }, [attractions]);

  useEffect(() => {
    if (mapInstanceRef.current || !mapElementRef.current) {
      return;
    }

    const mapInstance = new Map({
      target: mapElementRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source: zonesSourceRef.current, style: zoneStyle }),
        new VectorLayer({ source: routesSourceRef.current, style: routeStyle }),
        new VectorLayer({ source: attractionsSourceRef.current, style: attractionStyle }),
      ],
      view: new View({
        center: fromLonLat(center),
        zoom,
      }),
      controls: [],
    });

    mapInstanceRef.current = mapInstance;
    setMapInstance(mapInstance);

    return () => {
      mapInstance.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, [center, zoom, setMapInstance]);

  useEffect(() => {
    const source = zonesSourceRef.current;
    source.clear(true);
    if (zoneFeatures.length) {
      source.addFeatures(zoneFeatures);
    }
  }, [zoneFeatures]);

  useEffect(() => {
    const source = routesSourceRef.current;
    source.clear(true);
    if (routeFeatures.length) {
      source.addFeatures(routeFeatures);
    }
  }, [routeFeatures]);

  useEffect(() => {
    const source = attractionsSourceRef.current;
    source.clear(true);
    if (attractionFeatures.length) {
      source.addFeatures(attractionFeatures);
    }
  }, [attractionFeatures]);

  return <div ref={mapElementRef} className={`absolute inset-0 ${className}`} />;
};

export default MapCanvas;
