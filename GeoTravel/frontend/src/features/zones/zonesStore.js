import { create } from 'zustand';
import { zonesService } from '@/features/zones/zonesService';

const getVisibleZoneIdsFromRoutes = (routes = []) => {
  if (!Array.isArray(routes)) {
    return [];
  }

  return [...new Set(
    routes
      .flatMap((route) => (Array.isArray(route?.zoneIds) ? route.zoneIds : []))
      .filter((id) => id !== null && id !== undefined)
  )];
};

const getReportedRoutesForZone = (zone) => {
  const offSeasonRoutes = Array.isArray(zone?.offSeasonRoutes) ? zone.offSeasonRoutes : [];
  const activeRoutes = Array.isArray(zone?.activeRoutes) ? zone.activeRoutes : [];
  return [...offSeasonRoutes, ...activeRoutes];
};

const useZonesStore = create((set, get) => ({
  zones: [],
  activeZonesReport: [],
  selectedZone: null,
  pendingActionZone: null,
  geometryEditZone: null,
  geometryEditOriginalGeomWkt: '',
  geometryEditDraftGeomWkt: '',
  selectedZoneForRoutes: null,
  selectedZoneByAddress: null,
  selectedActiveZone: null,
  intersectionRouteResult: null,
  zoneRoutes: [],
  visibleZoneIds: null,
  isFormOpen: false,
  isLoading: false,
  isSaving: false,
  isDeleting: false,
  isLoadingZoneRoutes: false,
  isLoadingAddressZone: false,
  isLoadingActiveZonesReport: false,
  isLoadingIntersectionRoute: false,
  error: null,
  routeQueryError: null,
  addressQueryError: null,
  activeZonesReportError: null,
  intersectionQueryError: null,
  zoneQueryType: 'routes',

  setPendingActionZone: (zone) => set({ pendingActionZone: zone }),
  clearPendingActionZone: () => set({ pendingActionZone: null }),

  openForm: (zone = null) => set({ isFormOpen: true, selectedZone: zone, pendingActionZone: null, error: null }),
  closeForm: () =>
    set({
      isFormOpen: false,
      selectedZone: null,
      pendingActionZone: null,
      geometryEditZone: null,
      geometryEditOriginalGeomWkt: '',
      geometryEditDraftGeomWkt: '',
      error: null,
    }),
  clearError: () => set({ error: null }),
  startGeometryEdit: (zone) =>
    set({
      isFormOpen: false,
      selectedZone: zone,
      geometryEditZone: zone,
      geometryEditOriginalGeomWkt: zone?.geomWkt || '',
      geometryEditDraftGeomWkt: zone?.geomWkt || '',
      error: null,
    }),
  updateGeometryEditDraft: (geomWkt) => set({ geometryEditDraftGeomWkt: geomWkt || '' }),
  completeGeometryEdit: () => {
    const { geometryEditZone, geometryEditDraftGeomWkt } = get();
    const nextZone = geometryEditZone
      ? {
          ...geometryEditZone,
          geomWkt: geometryEditDraftGeomWkt || geometryEditZone.geomWkt || '',
        }
      : null;

    set({
      isFormOpen: true,
      selectedZone: nextZone,
      geometryEditZone: null,
      geometryEditOriginalGeomWkt: '',
      geometryEditDraftGeomWkt: '',
      error: null,
    });
  },
  cancelGeometryEdit: () => {
    const { geometryEditZone, geometryEditOriginalGeomWkt } = get();
    const nextZone = geometryEditZone
      ? {
          ...geometryEditZone,
          geomWkt: geometryEditOriginalGeomWkt || geometryEditZone.geomWkt || '',
        }
      : null;

    set({
      isFormOpen: true,
      selectedZone: nextZone,
      geometryEditZone: null,
      geometryEditOriginalGeomWkt: '',
      geometryEditDraftGeomWkt: '',
      error: null,
    });
  },
  setZoneQueryType: (zoneQueryType) =>
    set({
      zoneQueryType,
      selectedZoneForRoutes: null,
      selectedZoneByAddress: null,
      selectedActiveZone: null,
      activeZonesReport: [],
      intersectionRouteResult: null,
      zoneRoutes: [],
      visibleZoneIds: null,
      isLoadingZoneRoutes: false,
      isLoadingAddressZone: false,
      isLoadingActiveZonesReport: false,
      isLoadingIntersectionRoute: false,
      routeQueryError: null,
      addressQueryError: null,
      activeZonesReportError: null,
      intersectionQueryError: null,
    }),
  clearZoneQueries: () =>
    set({
      zoneQueryType: 'routes',
      selectedZoneForRoutes: null,
      selectedZoneByAddress: null,
      selectedActiveZone: null,
      activeZonesReport: [],
      intersectionRouteResult: null,
      zoneRoutes: [],
      visibleZoneIds: null,
      isLoadingZoneRoutes: false,
      isLoadingAddressZone: false,
      isLoadingActiveZonesReport: false,
      isLoadingIntersectionRoute: false,
      routeQueryError: null,
      addressQueryError: null,
      activeZonesReportError: null,
      intersectionQueryError: null,
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
      set({
        isSaving: false,
        isFormOpen: false,
        selectedZone: null,
        geometryEditZone: null,
        geometryEditOriginalGeomWkt: '',
        geometryEditDraftGeomWkt: '',
      });
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
      intersectionRouteResult: null,
      zoneRoutes: [],
      visibleZoneIds: null,
      isLoadingZoneRoutes: true,
      isLoadingAddressZone: false,
      isLoadingIntersectionRoute: false,
      routeQueryError: null,
      addressQueryError: null,
      intersectionQueryError: null,
    });

    try {
      const { routesService } = await import('@/features/routes/routesService');
      const zoneRoutes = await routesService.listByZone(zone.id);
      const visibleZoneIds = getVisibleZoneIdsFromRoutes(zoneRoutes);
      set({
        zoneQueryType: 'routes',
        selectedZoneForRoutes: zone,
        selectedZoneByAddress: null,
        selectedActiveZone: null,
        activeZonesReport: [],
        intersectionRouteResult: null,
        zoneRoutes,
        visibleZoneIds,
        isLoadingZoneRoutes: false,
      });
      return zoneRoutes;
    } catch (error) {
      set({
        selectedZoneByAddress: null,
        zoneRoutes: [],
        visibleZoneIds: null,
        isLoadingZoneRoutes: false,
        isLoadingIntersectionRoute: false,
        routeQueryError: error,
        addressQueryError: null,
        intersectionQueryError: null,
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
      intersectionRouteResult: null,
      zoneRoutes: [],
      visibleZoneIds: null,
      isLoadingZoneRoutes: false,
      isLoadingAddressZone: true,
      isLoadingIntersectionRoute: false,
      routeQueryError: null,
      addressQueryError: null,
      intersectionQueryError: null,
    });

    try {
      const zone = await zonesService.findByAddress(normalizedAddress);
      set({
        zoneQueryType: 'address',
        selectedZoneByAddress: zone,
        selectedActiveZone: null,
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

  searchRouteByPoint: async (lon, lat) => {
    if (!Number.isFinite(Number(lon)) || !Number.isFinite(Number(lat))) {
      set({
        intersectionRouteResult: null,
        zoneRoutes: [],
        visibleZoneIds: null,
        intersectionQueryError: { message: 'Coordenadas invalidas.' },
      });
      return null;
    }

    set({
      zoneQueryType: 'intersection',
      selectedZoneForRoutes: null,
      selectedZoneByAddress: null,
      selectedActiveZone: null,
      activeZonesReport: [],
      intersectionRouteResult: null,
      zoneRoutes: [],
      visibleZoneIds: null,
      isLoadingZoneRoutes: false,
      isLoadingAddressZone: false,
      isLoadingIntersectionRoute: true,
      routeQueryError: null,
      addressQueryError: null,
      intersectionQueryError: null,
    });

    try {
      const { routesService } = await import('@/features/routes/routesService');
      const intersectionRouteResult = await routesService.findByPoint(lon, lat);
      const zoneRoutes = intersectionRouteResult?.route ? [intersectionRouteResult.route] : [];
      const visibleZoneIds = getVisibleZoneIdsFromRoutes(zoneRoutes);

      set({
        zoneQueryType: 'intersection',
        intersectionRouteResult,
        zoneRoutes,
        visibleZoneIds,
        isLoadingIntersectionRoute: false,
      });

      return intersectionRouteResult;
    } catch (error) {
      set({
        intersectionRouteResult: null,
        zoneRoutes: [],
        visibleZoneIds: null,
        isLoadingIntersectionRoute: false,
        intersectionQueryError: error,
      });
      return null;
    }
  },

  searchRouteByIntersection: async (via1, via2) => {
    const normalizedVia1 = String(via1 || '').trim();
    const normalizedVia2 = String(via2 || '').trim();

    if (!normalizedVia1 || !normalizedVia2) {
      set({
        intersectionRouteResult: null,
        zoneRoutes: [],
        visibleZoneIds: null,
        intersectionQueryError: { message: 'Las dos referencias son obligatorias.' },
      });
      return null;
    }

    set({
      zoneQueryType: 'intersection',
      selectedZoneForRoutes: null,
      selectedZoneByAddress: null,
      selectedActiveZone: null,
      activeZonesReport: [],
      intersectionRouteResult: null,
      zoneRoutes: [],
      visibleZoneIds: null,
      isLoadingZoneRoutes: false,
      isLoadingAddressZone: false,
      isLoadingIntersectionRoute: true,
      routeQueryError: null,
      addressQueryError: null,
      intersectionQueryError: null,
    });

    try {
      const { routesService } = await import('@/features/routes/routesService');
      const intersectionRouteResult = await routesService.findByIntersection(normalizedVia1, normalizedVia2);
      const zoneRoutes = intersectionRouteResult?.route ? [intersectionRouteResult.route] : [];
      const visibleZoneIds = getVisibleZoneIdsFromRoutes(zoneRoutes);

      set({
        zoneQueryType: 'intersection',
        intersectionRouteResult,
        zoneRoutes,
        visibleZoneIds,
        isLoadingIntersectionRoute: false,
      });

      return intersectionRouteResult;
    } catch (error) {
      set({
        intersectionRouteResult: null,
        zoneRoutes: [],
        visibleZoneIds: null,
        isLoadingIntersectionRoute: false,
        intersectionQueryError: error,
      });
      return null;
    }
  },

  fetchActiveZonesReport: async () => {
    set({
      zoneQueryType: 'active-zones',
      selectedZoneForRoutes: null,
      selectedZoneByAddress: null,
      selectedActiveZone: null,
      intersectionRouteResult: null,
      zoneRoutes: [],
      visibleZoneIds: null,
      isLoadingZoneRoutes: false,
      isLoadingAddressZone: false,
      isLoadingActiveZonesReport: true,
      isLoadingIntersectionRoute: false,
      routeQueryError: null,
      addressQueryError: null,
      activeZonesReportError: null,
      intersectionQueryError: null,
    });

    try {
      const activeZonesReport = await zonesService.listActiveZones();
      set({
        zoneQueryType: 'active-zones',
        activeZonesReport,
        isLoadingActiveZonesReport: false,
      });
      return activeZonesReport;
    } catch (error) {
      set({
        activeZonesReport: [],
        selectedActiveZone: null,
        zoneRoutes: [],
        isLoadingActiveZonesReport: false,
        activeZonesReportError: error,
      });
      return [];
    }
  },

  selectActiveZone: (zoneId) => {
    const activeZone = get().activeZonesReport.find((zone) => String(zone?.id) === String(zoneId)) || null;

    set({
      zoneQueryType: 'active-zones',
      selectedZoneForRoutes: null,
      selectedZoneByAddress: null,
      selectedActiveZone: activeZone,
      intersectionRouteResult: null,
      zoneRoutes: getReportedRoutesForZone(activeZone),
      visibleZoneIds: null,
      routeQueryError: null,
      addressQueryError: null,
      activeZonesReportError: null,
      intersectionQueryError: null,
    });

    return activeZone;
  },
}));

export default useZonesStore;
