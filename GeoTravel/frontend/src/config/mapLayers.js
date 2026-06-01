const DEFAULT_STRATEGY = {
  zones: 'off',
  zonesSupport: 'off',
  routes: 'off',
  attractions: 'off',
};

const MAP_LAYER_STRATEGIES = {
  guestPortal: {
    routes: 'vector-primary',
    attractions: 'wms',
    zones: 'off',
  },
  zoneManagement: {
    zones: 'vector-primary',
    zonesSupport: 'wms',
  },
  routePlanner: {
    routes: 'vector-primary',
  },
};

export const getMapLayerStrategy = (screenId) => ({
  ...DEFAULT_STRATEGY,
  ...(screenId ? MAP_LAYER_STRATEGIES[screenId] : null),
});

export { MAP_LAYER_STRATEGIES };
