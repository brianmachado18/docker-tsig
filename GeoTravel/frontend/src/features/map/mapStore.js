import { fromLonLat } from 'ol/proj';
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

  savedViewport: null,

  flyTo: (lonLatCoords, zoom = 13) => {
    const map = get().mapInstance;
    if (!map || !lonLatCoords) return;
    const view = map.getView();
    set({ savedViewport: { center: view.getCenter(), zoom: view.getZoom() } });

    const projected = fromLonLat(lonLatCoords);
    const resolution = view.getResolutionForZoom(zoom);
    const mapSize = map.getSize() || [800, 600];
    // Shift center south so the point appears in the upper area, above the popup
    const verticalOffset = mapSize[1] * 0.18 * resolution;
    view.animate({ center: [projected[0], projected[1] - verticalOffset], zoom, duration: 700 });
  },

  fitToExtent: (extent) => {
    const map = get().mapInstance;
    if (!map || !extent) return;
    const view = map.getView();
    set({ savedViewport: { center: view.getCenter(), zoom: view.getZoom() } });
    view.fit(extent, { padding: [80, 80, 220, 80], duration: 700, maxZoom: 13 });
  },

  restoreViewport: () => {
    const { mapInstance, savedViewport } = get();
    if (!mapInstance || !savedViewport) return;
    mapInstance.getView().animate({ center: savedViewport.center, zoom: savedViewport.zoom, duration: 600 });
    set({ savedViewport: null });
  },

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
