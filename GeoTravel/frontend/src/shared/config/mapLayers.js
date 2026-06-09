const DEFAULT_STRATEGY = {
  zones: 'off',
  zonesSupport: 'off',
  routes: 'off',
  attractions: 'off',
};

const MAP_LAYER_STRATEGIES = {
  guestPortal: {
    zones: 'vector-primary',
    routes: 'vector-primary',
    attractions: 'vector-primary',
  },
  zoneManagement: {
    zones: 'vector-primary',
    routes: 'vector-primary',
  },
  routePlanner: {
    routes: 'wfs',
    attractions: 'wms',
  },
  attractionMap: {
    attractions: 'vector-primary',
  },
  attractionCatalog: {
    attractions: 'vector-primary',
  },
};

export const getMapLayerStrategy = (screenId) => ({
  ...DEFAULT_STRATEGY,
  ...(screenId ? MAP_LAYER_STRATEGIES[screenId] : null),
});
