import { create } from 'zustand';
import { routesService } from '../services/routesService';

const useRoutesStore = create((set) => ({
  routes: [],
  selectedRoute: null,
  isFormOpen: false,
  isLoading: false,
  error: null,

  setSelectedRoute: (route) => set({ selectedRoute: route, isFormOpen: !!route }),
  openForm: (route = null) => set({ isFormOpen: true, selectedRoute: route }),
  closeForm: () => set({ isFormOpen: false, selectedRoute: null }),

  fetchRoutes: async () => {
    set({ isLoading: true, error: null });
    try {
      const routes = await routesService.list();
      set({ routes, isLoading: false });
    } catch (error) {
      set({ error, isLoading: false });
    }
  },

  saveRoute: async (routeData) => {
    set({ isLoading: true, error: null });
    try {
      const saved = await routesService.save(routeData);
      set((state) => ({
        routes: [...state.routes.filter((item) => item.id !== saved.id), saved],
        isLoading: false,
        selectedRoute: saved,
      }));
    } catch (error) {
      set({ error, isLoading: false });
    }
  },

  deleteRoute: async (routeId) => {
    set({ isLoading: true, error: null });
    try {
      await routesService.remove(routeId);
      set((state) => ({
        routes: state.routes.filter((item) => item.id !== routeId),
        isLoading: false,
        selectedRoute: null,
      }));
    } catch (error) {
      set({ error, isLoading: false });
    }
  },
}));

export default useRoutesStore;
