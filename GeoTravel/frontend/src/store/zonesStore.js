import { create } from 'zustand';
import { zonesService } from '../services/zonesService';

const useZonesStore = create((set) => ({
  zones: [],
  selectedZone: null,
  isEditing: false,
  isFormOpen: false,
  isLoading: false,
  error: null,

  // Acciones
  setZones: (zones) => set({ zones }),
  setSelectedZone: (zone) => set({ selectedZone: zone, isFormOpen: !!zone }),
  setIsEditing: (isEditing) => set({ isEditing }),
  openForm: (zone = null) => set({ isFormOpen: true, selectedZone: zone }),
  closeForm: () => set({ isFormOpen: false, selectedZone: null }),
  
  // Dummy actions para ser implementadas luego (Conexión con PostGIS/GeoServer)
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
    set({ isLoading: true, error: null });
    try {
      const savedZone = await zonesService.save(zoneData);
      set((state) => ({
        zones: [...state.zones.filter((zone) => zone.id !== savedZone.id), savedZone],
        isLoading: false,
        isEditing: false,
        selectedZone: savedZone,
      }));
    } catch (error) {
      set({ error, isLoading: false });
    }
  },

  deleteZone: async (zoneId) => {
    set({ isLoading: true, error: null });
    try {
      await zonesService.remove(zoneId);
      set((state) => ({
        zones: state.zones.filter((zone) => zone.id !== zoneId),
        isLoading: false,
        selectedZone: null,
      }));
    } catch (error) {
      set({ error, isLoading: false });
    }
  }
}));

export default useZonesStore;
