export const ENV = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  geoserverUrl: import.meta.env.VITE_GEOSERVER_URL || 'http://localhost:8081/geoserver',
  geoserverWorkspace: import.meta.env.VITE_GEOSERVER_WORKSPACE || 'geotravel',
  useMocks: import.meta.env.VITE_USE_MOCKS !== 'false',
};
