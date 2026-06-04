import { geoserverClient } from '@/features/map/services/geoserver/geoserverClient';
import { getGeoServerLayer } from '@/features/map/services/geoserver/geoserverLayers';

export const fetchWfsFeatureCollection = async (layerKey, params = {}) => {
  const layerDefinition = getGeoServerLayer(layerKey);
  if (!layerDefinition) {
    throw new Error(`GeoServer layer "${layerKey}" is not configured.`);
  }

  const response = await fetch(
    geoserverClient.buildWfsUrl(layerDefinition.typeName, {
      workspace: layerDefinition.workspace,
      params,
    })
  );

  if (!response.ok) {
    throw new Error(`GeoServer WFS ${layerDefinition.typeName} failed with ${response.status}`);
  }

  return response.json();
};
