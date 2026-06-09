const DEFAULT_STRATEGY = {
  zones: 'off',
  zonesSupport: 'off',
  routes: 'off',
  attractions: 'off',
};

const MAP_LAYER_STRATEGIES = {
  guestPortal: {
    routes: 'wfs',
    attractions: 'wms',
    zones: 'off',
  },
  zoneManagement: {
    zones: 'vector-primary',
    routes: 'vector-primary',
  },
  routePlanner: {
    routes: 'wfs',
  },
  attractionMap: {
    attractions: 'vector-primary',
  },
};

export const getMapLayerStrategy = (screenId) => ({
  ...DEFAULT_STRATEGY,
  ...(screenId ? MAP_LAYER_STRATEGIES[screenId] : null),
});
