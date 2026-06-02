import { create } from 'zustand';
import { attractionsService } from '../services/attractionsService';
import useMapStore from './mapStore';

const useAttractionsStore = create((set, get) => ({
  attractions: [],
  selectedAttraction: null,
  isFormOpen: false,
  isLoading: false,
  isSaving: false,
  isDeleting: false,
  error: null,

  setSelectedAttraction: (attraction) => set({ selectedAttraction: attraction }),
  openForm: (attraction = null) => set({ isFormOpen: true, selectedAttraction: attraction, error: null }),
  closeForm: () => set({ isFormOpen: false, selectedAttraction: null, error: null }),
  clearError: () => set({ error: null }),

  fetchAttractions: async () => {
    set({ isLoading: true, error: null });
    try {
      const attractions = await attractionsService.list();
      set({ attractions, isLoading: false });
    } catch (error) {
      set({ error, isLoading: false });
    }
  },

  saveAttraction: async (attractionData) => {
    set({ isSaving: true, error: null });
    try {
      await attractionsService.save(attractionData);
      await get().fetchAttractions();
      useMapStore.getState().refreshWmsLayer('attractions-wms');
      set({ isSaving: false, isFormOpen: false, selectedAttraction: null });
      return true;
    } catch (error) {
      set({ error, isSaving: false });
      return false;
    }
  },

  deleteAttraction: async (attractionId) => {
    set({ isDeleting: true, error: null });
    try {
      await attractionsService.remove(attractionId);
      await get().fetchAttractions();
      useMapStore.getState().refreshWmsLayer('attractions-wms');
      set({ isDeleting: false, selectedAttraction: null });
      return true;
    } catch (error) {
      set({ error, isDeleting: false });
      return false;
    }
  },
}));

export default useAttractionsStore;
