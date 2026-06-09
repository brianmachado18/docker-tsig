import { create } from 'zustand';
import { zonesService } from '@/features/zones/zonesService';

const useZonesStore = create((set, get) => ({
  zones: [],
  selectedZone: null,
  selectedZoneForRoutes: null,
  selectedZoneByAddress: null,
  zoneRoutes: [],
  visibleZoneIds: null,
  isFormOpen: false,
  isLoading: false,
  isSaving: false,
  isDeleting: false,
  isLoadingZoneRoutes: false,
  isLoadingAddressZone: false,
  error: null,
  routeQueryError: null,
  addressQueryError: null,
  zoneQueryType: 'routes',

  openForm: (zone = null) => set({ isFormOpen: true, selectedZone: zone, error: null }),
  closeForm: () => set({ isFormOpen: false, selectedZone: null, error: null }),
  clearError: () => set({ error: null }),
  setZoneQueryType: (zoneQueryType) =>
    set({
      zoneQueryType,
      selectedZoneForRoutes: null,
      selectedZoneByAddress: null,
      zoneRoutes: [],
      visibleZoneIds: null,
      isLoadingZoneRoutes: false,
      isLoadingAddressZone: false,
      routeQueryError: null,
      addressQueryError: null,
    }),
  clearZoneQueries: () =>
    set({
      zoneQueryType: 'routes',
      selectedZoneForRoutes: null,
      selectedZoneByAddress: null,
      zoneRoutes: [],
      visibleZoneIds: null,
      isLoadingZoneRoutes: false,
      isLoadingAddressZone: false,
      routeQueryError: null,
      addressQueryError: null,
    }),

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
      set({ isDeleting: false, selectedZone: null });
      return true;
    } catch (error) {
      set({ error, isDeleting: false });
      return false;
    }
  },

  fetchZoneRoutes: async (zone) => {
    if (!zone?.id) {
      get().clearZoneQueries();
      return [];
    }

    set({
      zoneQueryType: 'routes',
      selectedZoneForRoutes: zone,
      selectedZoneByAddress: null,
      zoneRoutes: [],
      visibleZoneIds: null,
      isLoadingZoneRoutes: true,
      isLoadingAddressZone: false,
      routeQueryError: null,
      addressQueryError: null,
    });

    try {
      const { routesService } = await import('@/features/routes/routesService');
      const zoneRoutes = await routesService.listByZone(zone.id);
      set({
        zoneQueryType: 'routes',
        selectedZoneForRoutes: zone,
        selectedZoneByAddress: null,
        zoneRoutes,
        visibleZoneIds: null,
        isLoadingZoneRoutes: false,
      });
      return zoneRoutes;
    } catch (error) {
      set({
        selectedZoneByAddress: null,
        zoneRoutes: [],
        visibleZoneIds: null,
        isLoadingZoneRoutes: false,
        routeQueryError: error,
        addressQueryError: null,
      });
      return [];
    }
  },

  searchZoneByAddress: async (address) => {
    const normalizedAddress = String(address || '').trim();
    if (!normalizedAddress) {
      set({
        selectedZoneByAddress: null,
        visibleZoneIds: null,
        addressQueryError: { message: 'Direccion requerida.' },
      });
      return null;
    }

    set({
      zoneQueryType: 'address',
      selectedZoneForRoutes: null,
      selectedZoneByAddress: null,
      zoneRoutes: [],
      visibleZoneIds: null,
      isLoadingZoneRoutes: false,
      isLoadingAddressZone: true,
      routeQueryError: null,
      addressQueryError: null,
    });

    try {
      const zone = await zonesService.findByAddress(normalizedAddress);
      set({
        zoneQueryType: 'address',
        selectedZoneByAddress: zone,
        visibleZoneIds: zone?.id ? [zone.id] : null,
        isLoadingAddressZone: false,
      });
      return zone;
    } catch (error) {
      set({
        selectedZoneByAddress: null,
        visibleZoneIds: null,
        isLoadingAddressZone: false,
        addressQueryError: error,
      });
      return null;
    }
  },
}));

export default useZonesStore;
