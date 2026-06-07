import { create } from 'zustand';

// Filtro de recorridos compartido entre el panel (UI) y la capa del mapa (WFS).
// Valores 'all' = sin filtro.
const useRouteFilterStore = create((set) => ({
  status: 'all', // 'all' | 'available' | 'off-season' | 'pending' | 'cancelled'
  experienceType: 'all', // 'all' | 'cultural' | 'gastronomic' | 'natural' | 'historical' | 'adventure' | 'other'

  setStatus: (status) => set({ status }),
  setExperienceType: (experienceType) => set({ experienceType }),
  reset: () => set({ status: 'all', experienceType: 'all' }),
}));

// Decide si un recorrido pasa el filtro actual (usado por la capa del mapa).
export const matchesRouteFilter = (route, { status, experienceType }) => {
  if (status && status !== 'all' && route?.status !== status) {
    return false;
  }
  if (experienceType && experienceType !== 'all' && route?.experienceType !== experienceType) {
    return false;
  }
  return true;
};

export default useRouteFilterStore;
