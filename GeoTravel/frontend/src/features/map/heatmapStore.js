import { create } from 'zustand';

// Estado del mapa de calor de atracciones (toggle on/off), compartido entre
// el botón del portal y la capa del mapa.
const useHeatmapStore = create((set) => ({
  visible: false,
  toggle: () => set((state) => ({ visible: !state.visible })),
  setVisible: (visible) => set({ visible }),
}));

export default useHeatmapStore;
