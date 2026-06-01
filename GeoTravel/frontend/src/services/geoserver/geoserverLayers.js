import { ENV } from '../../config/env';

export const geoserverLayers = {
  zones: {
    key: 'zones',
    workspace: ENV.geoserverWorkspace,
    layerName: 'zona',
    typeName: 'zona',
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
    layerName: 'atraccion',
    typeName: 'atraccion',
    title: 'Atracciones turísticas',
  },
};

export const getGeoServerLayer = (layerKey) => geoserverLayers[layerKey] || null;
