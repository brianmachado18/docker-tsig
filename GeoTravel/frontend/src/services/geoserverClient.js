import { ENV } from '../config/env';

export const geoserverClient = {
  getWmsUrl(layerName) {
    return `${ENV.geoserverUrl}/${ENV.geoserverWorkspace}/wms?layers=${layerName}`;
  },
  getWfsUrl(typeName) {
    return `${ENV.geoserverUrl}/${ENV.geoserverWorkspace}/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=${typeName}&outputFormat=application/json`;
  },
  async fetchFeatures(typeName) {
    // TODO: Replace with real GeoServer WFS fetch.
    return {
      type: 'FeatureCollection',
      features: [],
      source: typeName,
      mocked: true,
    };
  },
};
