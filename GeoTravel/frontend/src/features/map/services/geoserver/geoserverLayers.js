import { ENV } from '@/shared/config/env';

export const geoserverLayers = {
  zones: {
    key: 'zones',
    workspace: ENV.geoserverWorkspace,
    layerName: 'zona_turistica',
    typeName: 'zona_turistica',
    title: 'Zonas turísticas',
  },
  routes: {
    key: 'routes',
    workspace: ENV.geoserverWorkspace,
    layerName: 'recorrido',
    typeName: 'recorrido',
    title: 'Recorridos',
  },
  attractions: {
    key: 'attractions',
    workspace: ENV.geoserverWorkspace,
    layerName: 'atraccion_turistica',
    typeName: 'atraccion_turistica',
    title: 'Atracciones turísticas',
  },
};

export const getGeoServerLayer = (layerKey) => geoserverLayers[layerKey] || null;
