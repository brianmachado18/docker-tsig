import { ENV } from '../../config/env';

const DEFAULT_WMS_PARAMS = {
  SERVICE: 'WMS',
  VERSION: '1.1.1',
  REQUEST: 'GetMap',
  FORMAT: 'image/png',
  TRANSPARENT: true,
};

const DEFAULT_WFS_PARAMS = {
  service: 'WFS',
  version: '2.0.0',
  request: 'GetFeature',
  outputFormat: 'application/json',
  srsName: 'EPSG:4326',
};

const normalizeQueryValue = (value) => {
  if (Array.isArray(value)) {
    return value.join(',');
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.set(key, normalizeQueryValue(value));
  });
  return searchParams.toString();
};

const getWorkspace = (workspace) => workspace || ENV.geoserverWorkspace;
const getQualifiedName = (layerName, workspace) => `${getWorkspace(workspace)}:${layerName}`;

export const geoserverClient = {
  get baseUrl() {
    return ENV.geoserverUrl;
  },

  get workspace() {
    return ENV.geoserverWorkspace;
  },

  getQualifiedName,
  buildQueryString,

  buildWmsEndpoint(workspace) {
    return `${this.baseUrl}/${getWorkspace(workspace)}/wms`;
  },

  buildWfsEndpoint(workspace) {
    return `${this.baseUrl}/${getWorkspace(workspace)}/ows`;
  },

  buildWmsUrl(layerName, options = {}) {
    const workspace = getWorkspace(options.workspace);
    const query = buildQueryString({
      ...DEFAULT_WMS_PARAMS,
      ...options.params,
      LAYERS: getQualifiedName(layerName, workspace),
    });
    return `${this.buildWmsEndpoint(workspace)}?${query}`;
  },

  buildWfsUrl(typeName, options = {}) {
    const workspace = getWorkspace(options.workspace);
    const query = buildQueryString({
      ...DEFAULT_WFS_PARAMS,
      ...options.params,
      typeName: getQualifiedName(typeName, workspace),
    });
    return `${this.buildWfsEndpoint(workspace)}?${query}`;
  },

  getDefaultWmsParams(layerName, options = {}) {
    const workspace = getWorkspace(options.workspace);
    return {
      ...DEFAULT_WMS_PARAMS,
      ...options.params,
      LAYERS: getQualifiedName(layerName, workspace),
    };
  },

  getDefaultWfsParams(typeName, options = {}) {
    const workspace = getWorkspace(options.workspace);
    return {
      ...DEFAULT_WFS_PARAMS,
      ...options.params,
      typeName: getQualifiedName(typeName, workspace),
    };
  },
};
