import { create } from 'zustand';
import { routesService } from '@/features/routes/routesService';

const useRoutesStore = create((set, get) => ({
  routes: [],
  stations: [],
  selectedRoute: null,
  isFormOpen: false,
  isLoading: false,
  isSaving: false,
  isDeleting: false,
  error: null,

  openForm: (route = null) => set({ isFormOpen: true, selectedRoute: route, error: null }),
  closeForm: () => set({ isFormOpen: false, selectedRoute: null, error: null }),
  clearError: () => set({ error: null }),

  fetchRoutes: async () => {
    set({ isLoading: true, error: null });
    try {
      const routes = await routesService.list();
      set({ routes, isLoading: false });
    } catch (error) {
      set({ error, isLoading: false });
    }
  },

  fetchStations: async () => {
    try {
      const stations = await routesService.listStations();
      set({ stations });
    } catch (error) {
      set({ error });
    }
  },

  saveRoute: async (routeData) => {
    set({ isSaving: true, error: null });
    try {
      await routesService.save(routeData);
      await get().fetchRoutes();
      set({ isSaving: false, isFormOpen: false, selectedRoute: null });
      return true;
    } catch (error) {
      set({ error, isSaving: false });
      return false;
    }
  },

  deleteRoute: async (routeId) => {
    set({ isDeleting: true, error: null });
    try {
      await routesService.remove(routeId);
      await get().fetchRoutes();
      set({ isDeleting: false, selectedRoute: null });
      return true;
    } catch (error) {
      set({ error, isDeleting: false });
      return false;
    }
  },
}));

export default useRoutesStore;
