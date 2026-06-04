const DEFAULT_STRATEGY = {
  zones: 'off',
  routes: 'off',
  attractions: 'off',
};

const MAP_LAYER_STRATEGIES = {
  guestPortal: {
    routes: 'wms',
    attractions: 'wms',
    zones: 'off',
  },
  zoneManagement: {
    zones: 'wfs',
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
