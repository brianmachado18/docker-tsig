const DEFAULT_STRATEGY = {
  zones: 'off',
  zonesSupport: 'off',
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
    zones: 'wms',
  },
  routePlanner: {
    routes: 'wms',
  },
  attractionMap: {
    attractions: 'wms',
  },
};

export const getMapLayerStrategy = (screenId) => ({
  ...DEFAULT_STRATEGY,
  ...(screenId ? MAP_LAYER_STRATEGIES[screenId] : null),
});

export { MAP_LAYER_STRATEGIES };
