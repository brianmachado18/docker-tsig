import { geoserverClient } from './geoserverClient';

export const pingGeoServer = async () => {
  const response = await fetch(
    `${geoserverClient.buildWmsEndpoint()}?${geoserverClient.buildQueryString({
      SERVICE: 'WMS',
      VERSION: '1.1.1',
      REQUEST: 'GetCapabilities',
    })}`
  );

  return response.ok;
};

export const fetchWmsCapabilities = async () => {
  const response = await fetch(
    `${geoserverClient.buildWmsEndpoint()}?${geoserverClient.buildQueryString({
      SERVICE: 'WMS',
      VERSION: '1.1.1',
      REQUEST: 'GetCapabilities',
    })}`
  );

  if (!response.ok) {
    throw new Error(`GeoServer WMS capabilities failed with ${response.status}`);
  }

  return response.text();
};
