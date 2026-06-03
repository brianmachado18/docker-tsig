import { geoserverClient } from '@/features/map/services/geoserver/geoserverClient';
import { getGeoServerLayer } from '@/features/map/services/geoserver/geoserverLayers';
import { mapGeoServerFeatureCollection } from '@/features/map/services/geoserver/geoserverMappers';

export const fetchFeatures = async (layerKey, options = {}) => {
  const layerDefinition = getGeoServerLayer(layerKey);
  if (!layerDefinition) {
    throw new Error(`GeoServer layer "${layerKey}" is not configured.`);
  }

  const response = await fetch(
    geoserverClient.buildWfsUrl(layerDefinition.typeName, {
      workspace: layerDefinition.workspace,
      params: options.params,
    })
  );

  if (!response.ok) {
    throw new Error(`GeoServer WFS ${layerDefinition.typeName} failed with ${response.status}`);
  }

  const featureCollection = await response.json();
  return options.mapToInternal === false
    ? featureCollection
    : mapGeoServerFeatureCollection(featureCollection);
};
