import { create } from 'zustand';
import { attractionsService } from '../services/attractionsService';

const useAttractionsStore = create((set) => ({
  attractions: [],
  selectedAttraction: null,
  isLoading: false,
  error: null,

  setSelectedAttraction: (attraction) => set({ selectedAttraction: attraction }),

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
    set({ isLoading: true, error: null });
    try {
      const saved = await attractionsService.save(attractionData);
      set((state) => ({
        attractions: [...state.attractions.filter((item) => item.id !== saved.id), saved],
        isLoading: false,
        selectedAttraction: saved,
      }));
    } catch (error) {
      set({ error, isLoading: false });
    }
  },

  deleteAttraction: async (attractionId) => {
    set({ isLoading: true, error: null });
    try {
      await attractionsService.remove(attractionId);
      set((state) => ({
        attractions: state.attractions.filter((item) => item.id !== attractionId),
        isLoading: false,
        selectedAttraction: null,
      }));
    } catch (error) {
      set({ error, isLoading: false });
    }
  },
}));

export default useAttractionsStore;
