export const ENV = {
  apiUrl: import.meta.env.VITE_API_URL || '/tsig-backend',
  geoserverUrl: import.meta.env.VITE_GEOSERVER_URL || '/geoserver',
  geoserverWorkspace: import.meta.env.VITE_GEOSERVER_WORKSPACE || 'geotravel',
};
