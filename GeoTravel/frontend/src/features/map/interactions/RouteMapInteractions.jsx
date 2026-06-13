import { useEffect, useState } from 'react';
import Draw from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';
import WKT from 'ol/format/WKT';
import { click } from 'ol/events/condition';
import useMapStore from '@/features/map/mapStore';
import useMapPopupStore from '@/features/map/mapPopupStore';
import useRoutesStore from '@/features/routes/routesStore';

const wktFormat = new WKT();

const getRoutesVectorLayer = (map) => (
  map
    ?.getLayers()
    ?.getArray()
    ?.find((layer) => layer?.get?.('entityKey') === 'routes' || layer?.get?.('layerKey') === 'routes-wfs')
);

const getGeometryWkt = (feature) => {
  const geometry = feature?.getGeometry?.();
  if (!geometry) {
    return '';
  }

  const geometry4326 = geometry.clone().transform('EPSG:3857', 'EPSG:4326');
  return wktFormat.writeGeometry(geometry4326, { decimals: 6 });
};

const getRouteByFeature = (feature, routes) => {
  const routeId = feature?.get?.('id');
  if (routeId === undefined || routeId === null) {
    return null;
  }

  return routes.find((route) => String(route.id) === String(routeId)) || null;
};

const getRouteFromFeature = (feature, routes = []) => {
  const geomWkt = getGeometryWkt(feature);
  if (!geomWkt) {
    return null;
  }

  const existingRoute = getRouteByFeature(feature, routes);
  if (existingRoute) {
    return {
      ...existingRoute,
      geomWkt,
    };
  }

  const id = feature?.get?.('id');
  return {
    id: id ?? undefined,
    name: feature?.get?.('name') || '',
    description: feature?.get?.('description') || '',
    status: feature?.get?.('status') || 'available',
    durationHours: feature?.get?.('durationHours') || '',
    guide: feature?.get?.('guide') || '',
    experienceType: feature?.get?.('experienceType') || 'cultural',
    //stationId: feature?.get?.('stationId') || '',
    startDay: feature?.get?.('startDay') || '',
    startMonth: feature?.get?.('startMonth') || '',
    endDay: feature?.get?.('endDay') || '',
    endMonth: feature?.get?.('endMonth') || '',
    geomWkt,
    zoneIds: Array.isArray(feature?.get?.('zoneIds')) ? feature.get('zoneIds') : [],
  };
};

const removeDraftRoutes = (source) => {
  source
    ?.getFeatures()
    ?.filter((feature) => feature?.get?.('isDraftRoute'))
    ?.forEach((feature) => source.removeFeature(feature));
};

const RouteMapInteractions = ({ routes = [] }) => {
  const [layerLookupAttempt, setLayerLookupAttempt] = useState(0);
  const map = useMapStore((state) => state.mapInstance);
  const activeTool = useMapStore((state) => state.activeTool);
  const setActiveTool = useMapStore((state) => state.setActiveTool);
  const openForm = useRoutesStore((state) => state.openForm);
  const openPopup = useMapPopupStore((state) => state.openPopup);
  const fitToExtent = useMapStore((state) => state.fitToExtent);

  useEffect(() => {
    if (!map || !activeTool) {
      return undefined;
    }

    const layer = getRoutesVectorLayer(map);
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
        type: 'LineString',
      });

      draw.on('drawstart', () => {
        removeDraftRoutes(source);
      });

      draw.on('drawend', (event) => {
        const feature = event.feature;
        feature.set('isDraftRoute', true);
        feature.set('name', 'Nuevo recorrido');

        openForm({
          geomWkt: getGeometryWkt(feature),
          zoneIds: [],
          attractionIds: [],
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

        const route = getRouteFromFeature(feature, routes);
        if (route) {
          openPopup(route, 'route');
          const geom = feature.getGeometry();
          if (geom) {
            fitToExtent(geom.getExtent());
          }
        }
      });

      map.addInteraction(select);

      return () => {
        map.removeInteraction(select);
      };
    }

    return undefined;
  }, [activeTool, fitToExtent, layerLookupAttempt, map, openForm, openPopup, routes, setActiveTool]);

  return null;
};

export default RouteMapInteractions;
