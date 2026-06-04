import { create } from 'zustand';

const useMapStore = create((set, get) => ({
  mapInstance: null,
  activeTool: null, // 'draw', 'select'
  center: [-56, -33], // Default center (Uruguay)
  zoom: 7,
  
  // Acciones
  setMapInstance: (instance) => set({ mapInstance: instance }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setViewport: (center, zoom) => set({ center, zoom }),

  refreshMapLayer: (layerKey) => {
    const map = get().mapInstance;
    if (!map || !layerKey) {
      return false;
    }

    const layer = map
      .getLayers()
      .getArray()
      .find((candidate) => candidate?.get?.('layerKey') === layerKey);
    if (!layer) {
      return false;
    }

    const source = layer.getSource?.();
    if (!source) {
      return false;
    }

    const reload = source.get?.('reload');
    if (typeof reload === 'function') {
      reload();
      return true;
    }
    if (typeof source.updateParams === 'function') {
      source.updateParams({ _ts: Date.now() });
      return true;
    }
    if (typeof source.refresh === 'function') {
      source.refresh();
      return true;
    }
    return false;
  },
}));

export default useMapStore;
