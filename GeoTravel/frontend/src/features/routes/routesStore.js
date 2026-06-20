import { create } from 'zustand';
import { routesService } from '@/features/routes/routesService';

const useRoutesStore = create((set, get) => ({
  routes: [],
  selectedRoute: null,
  isFormOpen: false,
  isModePickerOpen: false,
  creationMode: null,
  draftCleanupVersion: 0,
  isLoading: false,
  isSaving: false,
  isDeleting: false,
  error: null,

  openForm: (route = null) => set({
    isFormOpen: true,
    isModePickerOpen: false,
    selectedRoute: route,
    creationMode: route?.creationMode ?? null,
    error: null,
  }),
  openModePicker: () => set({
    isModePickerOpen: true,
    isFormOpen: false,
    selectedRoute: null,
    creationMode: null,
    error: null,
  }),
  closeModePicker: () => set({
    isModePickerOpen: false,
    creationMode: null,
    error: null,
  }),
  startPointRouteCreation: () => set({
    isModePickerOpen: false,
    isFormOpen: true,
    selectedRoute: null,
    creationMode: 'points',
    error: null,
  }),
  startDrawRouteCreation: () => set({
    isModePickerOpen: false,
    isFormOpen: false,
    selectedRoute: null,
    creationMode: 'draw',
    error: null,
  }),
  finishDrawRouteCreation: (route) => set({
    isModePickerOpen: false,
    isFormOpen: true,
    selectedRoute: route,
    creationMode: 'draw',
    error: null,
  }),
  cancelDrawRouteCreation: () => set((state) => ({
    isModePickerOpen: false,
    isFormOpen: false,
    selectedRoute: null,
    creationMode: null,
    error: null,
    draftCleanupVersion: state.draftCleanupVersion + 1,
  })),
  closeForm: () => set((state) => {
    const shouldClearDraft = state.creationMode === 'draw' && !state.selectedRoute?.id;
    return {
      isFormOpen: false,
      selectedRoute: null,
      isModePickerOpen: false,
      creationMode: null,
      error: null,
      draftCleanupVersion: shouldClearDraft ? state.draftCleanupVersion + 1 : state.draftCleanupVersion,
    };
  }),
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

  saveRoute: async (routeData) => {
    set({ isSaving: true, error: null });
    try {
      await routesService.save(routeData);
      await get().fetchRoutes();
      set({
        isSaving: false,
        isFormOpen: false,
        isModePickerOpen: false,
        selectedRoute: null,
        creationMode: null,
      });
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
