import { useCallback, useEffect, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';

const geojson = new GeoJSON();

const attractionStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: '#805ad5' }),
    stroke: new Stroke({ color: '#ffffff', width: 2 }),
  }),
});

const buildAttractionFeatures = (attractions) => {
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
          name: attraction.title || attraction.name,
          status: attraction.status,
        },
        geometry: {
          type: 'Point',
          coordinates: [...attraction.coordinates],
        },
      })),
  };

  return geojson.readFeatures(collection, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  });
};

const AttractionsVectorLayer = ({ map, attractions = [], zIndex = 25 }) => {
  const sourceRef = useRef(null);
  const layerRef = useRef(null);

  const reloadAttractionFeatures = useCallback(() => {
    if (!sourceRef.current) {
      return false;
    }

    const attractionFeatures = buildAttractionFeatures(attractions);
    sourceRef.current.clear(true);
    if (attractionFeatures.length) {
      sourceRef.current.addFeatures(attractionFeatures);
    }
    return true;
  }, [attractions]);

  useEffect(() => {
    if (!map || layerRef.current) {
      return undefined;
    }

    const source = new VectorSource();
    const layer = new VectorLayer({
      source,
      style: attractionStyle,
      zIndex,
      properties: {
        entityKey: 'attractions',
        layerKey: 'attractions-vector',
        sourceType: 'vector',
      },
    });

    map.addLayer(layer);
    sourceRef.current = source;
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.clear(true);
        sourceRef.current = null;
      }
    };
  }, [map, zIndex]);

  useEffect(() => {
    if (!sourceRef.current) {
      return;
    }

    sourceRef.current.set('reload', reloadAttractionFeatures);
    reloadAttractionFeatures();
  }, [reloadAttractionFeatures]);

  return null;
};

export default AttractionsVectorLayer;
