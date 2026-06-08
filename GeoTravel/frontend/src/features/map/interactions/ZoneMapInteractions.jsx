import { useEffect, useState } from 'react';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import Select from 'ol/interaction/Select';
import WKT from 'ol/format/WKT';
import { click } from 'ol/events/condition';
import useMapStore from '@/features/map/mapStore';
import useZonesStore from '@/features/zones/zonesStore';

const wktFormat = new WKT();

const getZonesVectorLayer = (map) => (
  map
    ?.getLayers()
    ?.getArray()
    ?.find((layer) => layer?.get?.('entityKey') === 'zones' || layer?.get?.('layerKey') === 'zones-vector')
);

const getGeometryWkt = (feature) => {
  const geometry = feature?.getGeometry?.();
  if (!geometry) {
    return '';
  }

  const geometry4326 = geometry.clone().transform('EPSG:3857', 'EPSG:4326');
  return wktFormat.writeGeometry(geometry4326, { decimals: 6 });
};

const ensurePersistedGeometryWkt = (feature) => {
  if (!feature || feature.get('isDraftZone') || feature.get('persistedGeomWkt')) {
    return;
  }

  feature.set('persistedGeomWkt', feature.get('geomWkt') || getGeometryWkt(feature));
};

const getZoneByFeature = (feature, zones) => {
  const zoneId = feature?.get?.('id');
  if (zoneId === undefined || zoneId === null) {
    return null;
  }

  return zones.find((zone) => String(zone.id) === String(zoneId)) || null;
};

const getZoneFromFeature = (feature, zones = []) => {
  const existingZone = getZoneByFeature(feature, zones);
  if (existingZone) {
    return {
      ...existingZone,
      geomWkt: getGeometryWkt(feature),
    };
  }

  const id = feature?.get?.('id');
  if (id === undefined || id === null) {
    return null;
  }

  return {
    id,
    name: feature.get('name') || '',
    description: feature.get('description') || '',
    attractionLevel: Number(feature.get('attractionLevel')) || 1,
    notes: feature.get('notes') || '',
    geomWkt: getGeometryWkt(feature),
    routeIds: Array.isArray(feature.get('routeIds')) ? feature.get('routeIds') : [],
  };
};

const removeDraftZones = (source) => {
  source
    ?.getFeatures()
    ?.filter((feature) => feature?.get?.('isDraftZone'))
    ?.forEach((feature) => source.removeFeature(feature));
};

const ZoneMapInteractions = ({ zones = [] }) => {
  const [layerLookupAttempt, setLayerLookupAttempt] = useState(0);
  const map = useMapStore((state) => state.mapInstance);
  const activeTool = useMapStore((state) => state.activeTool);
  const setActiveTool = useMapStore((state) => state.setActiveTool);
  const openForm = useZonesStore((state) => state.openForm);

  useEffect(() => {
    if (!map || !activeTool) {
      return undefined;
    }

    const layer = getZonesVectorLayer(map);
    const source = layer?.getSource?.();
    if (!layer || !source) {
      const timeoutId = window.setTimeout(() => {
        setLayerLookupAttempt((attempt) => attempt + 1);
      }, 100);
      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    if (!source.getFeatures().length && layer.get('sourceType') === 'wfs' && layerLookupAttempt < 20) {
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
        type: 'Polygon',
      });

      draw.on('drawstart', () => {
        removeDraftZones(source);
      });

      draw.on('drawend', (event) => {
        const feature = event.feature;
        feature.set('isDraftZone', true);
        feature.set('name', 'Nueva zona');

        openForm({
          geomWkt: getGeometryWkt(feature),
          routeIds: [],
        });
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

        const zone = getZoneFromFeature(feature, zones);
        if (zone) {
          openForm(zone);
          return;
        }

        if (feature.get('isDraftZone')) {
          openForm({
            geomWkt: getGeometryWkt(feature),
            routeIds: [],
          });
        }
      });

      map.addInteraction(select);

      const modify = new Modify({
        source,
      });

      modify.on('modifystart', (event) => {
        event.features?.forEach?.((feature) => {
          ensurePersistedGeometryWkt(feature);
        });
      });

      modify.on('modifyend', (event) => {
        const feature = event.features.item(0);
        const geomWkt = getGeometryWkt(feature);
        feature.set('geomWkt', geomWkt);
        if (!feature.get('isDraftZone')) {
          ensurePersistedGeometryWkt(feature);
          feature.set('draftGeomWkt', geomWkt);
          feature.set('hasDraftGeometry', true);
        }

        const zone = getZoneFromFeature(feature, zones);
        if (zone) {
          openForm(zone);
          return;
        }

        openForm({ geomWkt, routeIds: [] });
      });

      map.addInteraction(modify);

      return () => {
        map.removeInteraction(modify);
        map.removeInteraction(select);
      };
    }

    return undefined;
  }, [activeTool, layerLookupAttempt, map, openForm, setActiveTool, zones]);

  return null;
};

export default ZoneMapInteractions;
