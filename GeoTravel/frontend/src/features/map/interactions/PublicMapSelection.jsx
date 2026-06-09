import { useEffect } from 'react';

const SELECTABLE_LAYER_KEYS = new Set([
  'zones-vector',
  'routes-vector',
  'attractions-vector',
]);

const TYPE_BY_LAYER_KEY = {
  'zones-vector': 'zone',
  'routes-vector': 'route',
  'attractions-vector': 'attraction',
};

const findByFeatureId = (items, feature) => {
  const featureId = feature?.get?.('id');
  if (featureId === undefined || featureId === null) {
    return null;
  }

  return items.find((item) => String(item.id) === String(featureId)) || null;
};

const buildFallbackItem = (feature) => ({
  id: feature?.get?.('id'),
  name: feature?.get?.('name') || '',
  title: feature?.get?.('name') || '',
  description: feature?.get?.('description') || '',
  status: feature?.get?.('status') || '',
  category: feature?.get?.('category') || '',
  durationHours: feature?.get?.('durationHours') || '',
  attractionLevel: feature?.get?.('attractionLevel') || '',
  experienceType: feature?.get?.('experienceType') || '',
});

const resolveSelection = (feature, layer, { zones, routes, attractions }) => {
  const layerKey = layer?.get?.('layerKey');
  const type = feature?.get?.('entityType') || TYPE_BY_LAYER_KEY[layerKey];

  if (type === 'zone') {
    return { type, item: findByFeatureId(zones, feature) || buildFallbackItem(feature) };
  }

  if (type === 'route') {
    return { type, item: findByFeatureId(routes, feature) || buildFallbackItem(feature) };
  }

  if (type === 'attraction') {
    return { type, item: findByFeatureId(attractions, feature) || buildFallbackItem(feature) };
  }

  return null;
};

const PublicMapSelection = ({ map, zones = [], routes = [], attractions = [], onSelect }) => {
  useEffect(() => {
    if (!map || typeof onSelect !== 'function') {
      return undefined;
    }

    const isSelectableLayer = (layer) => SELECTABLE_LAYER_KEYS.has(layer?.get?.('layerKey'));

    const handleSingleClick = (event) => {
      const hit = map.forEachFeatureAtPixel(
        event.pixel,
        (feature, layer) => ({ feature, layer }),
        {
          hitTolerance: 8,
          layerFilter: isSelectableLayer,
        }
      );

      if (!hit) {
        onSelect(null);
        return;
      }

      onSelect(resolveSelection(hit.feature, hit.layer, { zones, routes, attractions }));
    };

    const handlePointerMove = (event) => {
      const hasFeature = map.hasFeatureAtPixel(event.pixel, {
        hitTolerance: 8,
        layerFilter: isSelectableLayer,
      });
      const target = map.getTargetElement?.();
      if (target) {
        target.style.cursor = hasFeature ? 'pointer' : '';
      }
    };

    map.on('singleclick', handleSingleClick);
    map.on('pointermove', handlePointerMove);

    return () => {
      map.un('singleclick', handleSingleClick);
      map.un('pointermove', handlePointerMove);
      const target = map.getTargetElement?.();
      if (target) {
        target.style.cursor = '';
      }
    };
  }, [attractions, map, onSelect, routes, zones]);

  return null;
};

export default PublicMapSelection;
