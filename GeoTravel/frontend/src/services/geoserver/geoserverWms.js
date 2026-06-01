import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import { geoserverClient } from './geoserverClient';
import { getGeoServerLayer } from './geoserverLayers';

export const createWmsLayer = (layerKey, options = {}) => {
  const layerDefinition = getGeoServerLayer(layerKey);
  if (!layerDefinition) {
    throw new Error(`GeoServer layer "${layerKey}" is not configured.`);
  }

  const source = new ImageWMS({
    url: geoserverClient.buildWmsEndpoint(layerDefinition.workspace),
    params: geoserverClient.getDefaultWmsParams(layerDefinition.layerName, {
      workspace: layerDefinition.workspace,
      params: options.params,
    }),
    ratio: options.ratio ?? 1,
    serverType: 'geoserver',
  });

  return new ImageLayer({
    source,
    visible: options.visible ?? true,
    opacity: options.opacity ?? 1,
    zIndex: options.zIndex ?? 10,
    properties: {
      layerKey,
      sourceType: 'wms',
      title: layerDefinition.title,
      ...options.properties,
    },
  });
};
