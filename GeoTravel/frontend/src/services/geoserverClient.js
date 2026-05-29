import { ENV } from '../config/env';

export const geoserverClient = {
  getWmsUrl(layerName) {
    return `${ENV.geoserverUrl}/${ENV.geoserverWorkspace}/wms?layers=${layerName}`;
  },
  getWfsUrl(typeName) {
    return `${ENV.geoserverUrl}/${ENV.geoserverWorkspace}/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=${typeName}&outputFormat=application/json`;
  },
  async fetchFeatures(typeName) {
    const response = await fetch(this.getWfsUrl(typeName));
    if (!response.ok) {
      throw new Error(`GeoServer WFS ${typeName} failed with ${response.status}`);
    }
    return response.json();
  },
};
