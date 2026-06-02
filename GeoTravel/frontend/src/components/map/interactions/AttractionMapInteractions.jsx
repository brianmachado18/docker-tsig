import { useEffect, useState } from 'react';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import Select from 'ol/interaction/Select';
import WKT from 'ol/format/WKT';
import { click } from 'ol/events/condition';
import useAttractionsStore from '../../../store/attractionsStore';
import useMapStore from '../../../store/mapStore';

const wktFormat = new WKT();

const getAttractionsVectorLayer = (map) => (
  map
    ?.getLayers()
    ?.getArray()
    ?.find((layer) => layer?.get?.('entityKey') === 'attractions' || layer?.get?.('layerKey') === 'attractions-vector')
);

const getPointGeometry = (feature) => {
  const geometry = feature?.getGeometry?.();
  if (!geometry || geometry.getType?.() !== 'Point') {
    return null;
  }

  return geometry.clone().transform('EPSG:3857', 'EPSG:4326');
};

const getPointCoordinates = (feature) => {
  const geometry4326 = getPointGeometry(feature);
  if (!geometry4326) {
    return null;
  }

  return geometry4326.getCoordinates().map((coordinate) => Number(coordinate.toFixed(6)));
};

const getPointWkt = (feature) => {
  const geometry4326 = getPointGeometry(feature);
  if (!geometry4326) {
    return '';
  }

  return wktFormat.writeGeometry(geometry4326, { decimals: 6 });
};

const getAttractionByFeature = (feature, attractions) => {
  const attractionId = feature?.get?.('id');
  if (attractionId === undefined || attractionId === null) {
    return null;
  }

  return attractions.find((attraction) => String(attraction.id) === String(attractionId)) || null;
};

const getAttractionFromFeature = (feature, attractions = []) => {
  const coordinates = getPointCoordinates(feature);
  if (!coordinates) {
    return null;
  }

  const [longitude, latitude] = coordinates;
  const existingAttraction = getAttractionByFeature(feature, attractions);
  if (existingAttraction) {
    return {
      ...existingAttraction,
      coordinates,
      longitude,
      latitude,
      geomWkt: getPointWkt(feature),
    };
  }

  const id = feature?.get?.('id');
  return {
    id: id ?? undefined,
    title: feature?.get?.('name') || '',
    description: feature?.get?.('description') || '',
    category: feature?.get?.('category') || 'CULTURAL',
    imageUrl: feature?.get?.('imageUrl') || '',
    coordinates,
    longitude,
    latitude,
    geomWkt: getPointWkt(feature),
  };
};

const removeDraftAttractions = (source) => {
  source
    ?.getFeatures()
    ?.filter((feature) => feature?.get?.('isDraftAttraction'))
    ?.forEach((feature) => source.removeFeature(feature));
};

const AttractionMapInteractions = ({ attractions = [] }) => {
  const [layerLookupAttempt, setLayerLookupAttempt] = useState(0);
  const map = useMapStore((state) => state.mapInstance);
  const activeTool = useMapStore((state) => state.activeTool);
  const setActiveTool = useMapStore((state) => state.setActiveTool);
  const openForm = useAttractionsStore((state) => state.openForm);

  useEffect(() => {
    if (!map || !activeTool) {
      return undefined;
    }

    const layer = getAttractionsVectorLayer(map);
    const source = layer?.getSource?.();
    if (!layer || !source) {
      const timeoutId = window.setTimeout(() => {
        setLayerLookupAttempt((attempt) => attempt + 1);
      }, 100);
      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    if (activeTool === 'draw') {
      const draw = new Draw({
        source,
        type: 'Point',
      });

      draw.on('drawstart', () => {
        removeDraftAttractions(source);
      });

      draw.on('drawend', (event) => {
        const feature = event.feature;
        feature.set('isDraftAttraction', true);
        feature.set('name', 'Nueva atracción');

        const attraction = getAttractionFromFeature(feature, attractions);
        if (attraction) {
          openForm(attraction);
        }
        setActiveTool('select');
      });

      map.addInteraction(draw);
      return () => {
        map.removeInteraction(draw);
      };
    }

    if (activeTool === 'select') {
      const select = new Select({
        condition: click,
        layers: [layer],
      });

      select.on('select', (event) => {
        const feature = event.selected?.[0];
        if (!feature) {
          return;
        }

        const attraction = getAttractionFromFeature(feature, attractions);
        if (attraction) {
          openForm(attraction);
        }
      });

      map.addInteraction(select);

      const modify = new Modify({
        source,
      });

      modify.on('modifyend', (event) => {
        const feature = event.features.item(0);
        const attraction = getAttractionFromFeature(feature, attractions);
        if (attraction) {
          openForm(attraction);
        }
      });

      map.addInteraction(modify);

      return () => {
        map.removeInteraction(modify);
        map.removeInteraction(select);
      };
    }

    return undefined;
  }, [activeTool, attractions, layerLookupAttempt, map, openForm, setActiveTool]);

  return null;
};

export default AttractionMapInteractions;
