import { create } from 'zustand';

const useMapStore = create((set) => ({
  mapInstance: null,
  activeLayer: 'zones', // 'zones', 'routes', 'attractions'
  activeTool: 'select', // 'select', 'draw', 'edit', 'delete'
  center: [-56, -33], // Default center (Uruguay)
  zoom: 10,
  
  // Acciones
  setMapInstance: (instance) => set({ mapInstance: instance }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setViewport: (center, zoom) => set({ center, zoom })
}));

export default useMapStore;
