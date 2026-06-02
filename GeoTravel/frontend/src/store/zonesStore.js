import { create } from 'zustand';
import { zonesService } from '../services/zonesService';
import useMapStore from './mapStore';

const useZonesStore = create((set, get) => ({
  zones: [],
  selectedZone: null,
  isFormOpen: false,
  isLoading: false,
  isSaving: false,
  isDeleting: false,
  error: null,

  setSelectedZone: (zone) => set({ selectedZone: zone }),
  openForm: (zone = null) => set({ isFormOpen: true, selectedZone: zone, error: null }),
  closeForm: () => set({ isFormOpen: false, selectedZone: null, error: null }),
  clearError: () => set({ error: null }),

  fetchZones: async () => {
    set({ isLoading: true, error: null });
    try {
      const zones = await zonesService.list();
      set({ zones, isLoading: false });
    } catch (error) {
      set({ error, isLoading: false });
    }
  },

  saveZone: async (zoneData) => {
    set({ isSaving: true, error: null });
    try {
      await zonesService.save(zoneData);
      await get().fetchZones();
      const mapStore = useMapStore.getState();
      mapStore.refreshWmsLayer('zones-wfs') || mapStore.refreshWmsLayer('zones-wms');
      set({ isSaving: false, isFormOpen: false, selectedZone: null });
      return true;
    } catch (error) {
      set({ error, isSaving: false });
      return false;
    }
  },

  deleteZone: async (zoneId) => {
    set({ isDeleting: true, error: null });
    try {
      await zonesService.remove(zoneId);
      await get().fetchZones();
      const mapStore = useMapStore.getState();
      mapStore.refreshWmsLayer('zones-wfs') || mapStore.refreshWmsLayer('zones-wms');
      set({ isDeleting: false, selectedZone: null });
      return true;
    } catch (error) {
      set({ error, isDeleting: false });
      return false;
    }
  },
}));

export default useZonesStore;
