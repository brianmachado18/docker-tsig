# Skill: Gestión de Estado y Custom Hooks

## 📌 Propósito
Implementar state management con Zustand y custom hooks React para manejar estado compartido, efectos secundarios y lógica compleja de forma centralizada y reutilizable.

## 🎯 Cuándo Usar Este Skill

**USE ESTE SKILL CUANDO:**
- Necesites compartir estado entre componentes
- Requieras sincronizar estado con datos del backend
- Debas manejar efectos secundarios (API calls, suscripciones)
- Necesites custom hooks para lógica reutilizable
- Requieras caching o persistencia de estado

**NO USES ESTE SKILL PARA:**
- UI components locales con estado simple (usa useState)
- Integración de mapas (usa skill de OpenLayers)
- Servicios HTTP (usa skill de Servicios)

## 🏪 Setup de Zustand

### Instalación
```bash
npm install zustand
```

### Estructura de Stores
```
src/store/
├── mapStore.js          # Estado del mapa
├── zonesStore.js        # Estado de zonas
├── routesStore.js       # Estado de recorridos
├── attractionsStore.js  # Estado de atracciones
└── uiStore.js           # Estado de UI (modales, notificaciones)
```

## 🗺️ Map Store

```javascript
// src/store/mapStore.js
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const useMapStore = create(
  devtools(
    persist(
      (set, get) => ({
        // Estado
        mapInstance: null,
        center: [-56, -33],
        zoom: 10,
        layers: {
          zones: true,
          routes: true,
          attractions: true,
        },
        selectedZoneId: null,
        selectedRouteId: null,
        selectedAttractionId: null,
        isDrawing: false,
        drawMode: null, // 'polygon', 'line', 'point'
        
        // Acciones
        setMapInstance: (map) => set({ mapInstance: map }),
        
        setCenter: (center) => set({ center }),
        
        setZoom: (zoom) => set({ zoom }),
        
        toggleLayer: (layerName) =>
          set((state) => ({
            layers: {
              ...state.layers,
              [layerName]: !state.layers[layerName],
            },
          })),

        selectZone: (zoneId) => set({ selectedZoneId: zoneId }),
        
        selectRoute: (routeId) => set({ selectedRouteId: routeId }),
        
        selectAttraction: (attractionId) => set({ selectedAttractionId: attractionId }),
        
        clearSelection: () => set({
          selectedZoneId: null,
          selectedRouteId: null,
          selectedAttractionId: null,
        }),

        startDrawing: (mode) => set({ isDrawing: true, drawMode: mode }),
        
        stopDrawing: () => set({ isDrawing: false, drawMode: null }),

        // Acciones complejas
        fitZone: async (zoneId) => {
          const map = get().mapInstance;
          if (!map) return;
          // Lógica para centrar en zona
          set({
            selectedZoneId: zoneId,
            // Actualizar center/zoom después
          });
        },
      }),
      {
        name: 'map-storage', // Persistir en localStorage
        partialize: (state) => ({
          center: state.center,
          zoom: state.zoom,
          layers: state.layers,
        }),
      }
    )
  )
);
```

## 🌍 Zones Store

```javascript
// src/store/zonesStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { zonesService } from '../services/zones';

export const useZonesStore = create(
  devtools(
    (set, get) => ({
      // Estado
      zones: [],
      loading: false,
      error: null,
      editingZone: null,

      // Acciones de lectura
      setZones: (zones) => set({ zones }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      // Fetch inicial
      fetchZones: async (filters = {}) => {
        set({ loading: true, error: null });
        try {
          const data = await zonesService.listZones(filters);
          set({ zones: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Fetch zona específica
      fetchZone: async (zoneId) => {
        set({ loading: true, error: null });
        try {
          const zone = await zonesService.getZone(zoneId);
          set((state) => ({
            zones: [
              ...state.zones.filter((z) => z.id !== zoneId),
              zone,
            ],
            loading: false,
          }));
          return zone;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // CRUD
      addZone: async (zoneData) => {
        set({ loading: true, error: null });
        try {
          const newZone = await zonesService.createZone(zoneData);
          set((state) => ({
            zones: [...state.zones, newZone],
            loading: false,
          }));
          return newZone;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateZone: async (zoneId, zoneData) => {
        set({ loading: true, error: null });
        try {
          const updatedZone = await zonesService.updateZone(zoneId, zoneData);
          set((state) => ({
            zones: state.zones.map((z) => (z.id === zoneId ? updatedZone : z)),
            editingZone: null,
            loading: false,
          }));
          return updatedZone;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteZone: async (zoneId) => {
        set({ loading: true, error: null });
        try {
          await zonesService.deleteZone(zoneId);
          set((state) => ({
            zones: state.zones.filter((z) => z.id !== zoneId),
            loading: false,
          }));
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Edición local
      setEditingZone: (zone) => set({ editingZone: zone }),

      clearEditingZone: () => set({ editingZone: null }),

      // Utilidades
      getZoneById: (zoneId) => get().zones.find((z) => z.id === zoneId),

      getZonesByAttractionLevel: (level) =>
        get().zones.filter((z) => z.attractionLevel === level),
    }),
    { name: 'zones-store' }
  )
);
```

## 🛣️ Routes Store

```javascript
// src/store/routesStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { routesService } from '../services/routes';

export const useRoutesStore = create(
  devtools(
    (set, get) => ({
      // Estado
      routes: [],
      loading: false,
      error: null,
      editingRoute: null,
      routeHistory: {}, // { routeId: [history] }

      // Acciones de lectura
      setRoutes: (routes) => set({ routes }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      // Fetch
      fetchRoutes: async (filters = {}) => {
        set({ loading: true, error: null });
        try {
          const data = await routesService.listRoutes(filters);
          set({ routes: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchRoute: async (routeId) => {
        set({ loading: true, error: null });
        try {
          const route = await routesService.getRoute(routeId);
          set((state) => ({
            routes: [
              ...state.routes.filter((r) => r.id !== routeId),
              route,
            ],
            loading: false,
          }));
          return route;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchRouteHistory: async (routeId) => {
        try {
          const history = await routesService.getRouteHistory(routeId);
          set((state) => ({
            routeHistory: {
              ...state.routeHistory,
              [routeId]: history,
            },
          }));
          return history;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // CRUD
      addRoute: async (routeData) => {
        set({ loading: true, error: null });
        try {
          const newRoute = await routesService.createRoute(routeData);
          set((state) => ({
            routes: [...state.routes, newRoute],
            loading: false,
          }));
          return newRoute;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateRoute: async (routeId, routeData) => {
        set({ loading: true, error: null });
        try {
          const updatedRoute = await routesService.updateRoute(routeId, routeData);
          set((state) => ({
            routes: state.routes.map((r) => (r.id === routeId ? updatedRoute : r)),
            editingRoute: null,
            loading: false,
          }));
          return updatedRoute;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteRoute: async (routeId) => {
        set({ loading: true, error: null });
        try {
          await routesService.deleteRoute(routeId);
          set((state) => ({
            routes: state.routes.filter((r) => r.id !== routeId),
            loading: false,
          }));
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Cambio de estado
      changeRouteStatus: async (routeId, newStatus) => {
        set({ loading: true, error: null });
        try {
          const updatedRoute = await routesService.changeRouteStatus(routeId, newStatus);
          set((state) => ({
            routes: state.routes.map((r) => (r.id === routeId ? updatedRoute : r)),
            loading: false,
          }));
          return updatedRoute;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Edición local
      setEditingRoute: (route) => set({ editingRoute: route }),

      clearEditingRoute: () => set({ editingRoute: null }),

      // Utilidades
      getRouteById: (routeId) => get().routes.find((r) => r.id === routeId),

      getRoutesByStatus: (status) =>
        get().routes.filter((r) => r.status === status),

      getRoutesByZone: (zoneId) =>
        get().routes.filter((r) => r.zoneId === zoneId),
    }),
    { name: 'routes-store' }
  )
);
```

## 🎯 Attractions Store

```javascript
// src/store/attractionsStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { attractionsService } from '../services/attractions';

export const useAttractionsStore = create(
  devtools(
    (set, get) => ({
      attractions: [],
      loading: false,
      error: null,
      editingAttraction: null,

      setAttractions: (attractions) => set({ attractions }),

      fetchAttractions: async (filters = {}) => {
        set({ loading: true, error: null });
        try {
          const data = await attractionsService.listAttractions(filters);
          set({ attractions: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      addAttraction: async (attractionData) => {
        set({ loading: true, error: null });
        try {
          const newAttraction = await attractionsService.createAttraction(attractionData);
          set((state) => ({
            attractions: [...state.attractions, newAttraction],
            loading: false,
          }));
          return newAttraction;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateAttraction: async (attractionId, attractionData) => {
        set({ loading: true, error: null });
        try {
          const updated = await attractionsService.updateAttraction(attractionId, attractionData);
          set((state) => ({
            attractions: state.attractions.map((a) => (a.id === attractionId ? updated : a)),
            editingAttraction: null,
            loading: false,
          }));
          return updated;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteAttraction: async (attractionId) => {
        set({ loading: true, error: null });
        try {
          await attractionsService.deleteAttraction(attractionId);
          set((state) => ({
            attractions: state.attractions.filter((a) => a.id !== attractionId),
            loading: false,
          }));
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      setEditingAttraction: (attraction) => set({ editingAttraction: attraction }),

      getAttractionById: (attractionId) =>
        get().attractions.find((a) => a.id === attractionId),
    }),
    { name: 'attractions-store' }
  )
);
```

## 🪝 Custom Hooks

### Hook para Mapa
```javascript
// src/hooks/useMap.js
import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { useMapStore } from '../store/mapStore';

export const useMap = (targetElement, options = {}) => {
  const mapRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const setMapInstance = useMapStore((state) => state.setMapInstance);

  useEffect(() => {
    if (!targetElement) return;

    const map = new Map({
      target: targetElement,
      layers: [
        new TileLayer({
          source: new OSM(),
          opacity: 0.8,
        }),
      ],
      view: new View({
        center: fromLonLat(options.center || [-56, -33]),
        zoom: options.zoom || 10,
      }),
    });

    mapRef.current = map;
    setMapInstance(map);
    setIsReady(true);

    return () => map.dispose();
  }, [targetElement, options, setMapInstance]);

  return { map: mapRef.current, isReady };
};
```

### Hook para Zonas
```javascript
// src/hooks/useZones.js
import { useEffect, useCallback } from 'react';
import { useZonesStore } from '../store/zonesStore';

export const useZones = (shouldFetch = true) => {
  const {
    zones,
    loading,
    error,
    fetchZones,
    addZone,
    updateZone,
    deleteZone,
  } = useZonesStore();

  useEffect(() => {
    if (shouldFetch) {
      fetchZones();
    }
  }, [shouldFetch, fetchZones]);

  return {
    zones,
    loading,
    error,
    createZone: useCallback((data) => addZone(data), [addZone]),
    updateZone: useCallback((id, data) => updateZone(id, data), [updateZone]),
    deleteZone: useCallback((id) => deleteZone(id), [deleteZone]),
  };
};
```

### Hook para Recorridos con Filtros
```javascript
// src/hooks/useRoutes.js
import { useEffect, useMemo, useCallback } from 'react';
import { useRoutesStore } from '../store/routesStore';

export const useRoutes = (filters = {}) => {
  const {
    routes,
    loading,
    error,
    fetchRoutes,
    addRoute,
    updateRoute,
    deleteRoute,
    changeRouteStatus,
  } = useRoutesStore();

  useEffect(() => {
    fetchRoutes(filters);
  }, [filters, fetchRoutes]);

  const filteredRoutes = useMemo(() => {
    let result = routes;

    if (filters.status) {
      result = result.filter((r) => r.status === filters.status);
    }
    if (filters.zoneId) {
      result = result.filter((r) => r.zoneId === filters.zoneId);
    }
    if (filters.experienceType) {
      result = result.filter((r) => r.experienceType === filters.experienceType);
    }

    return result;
  }, [routes, filters]);

  return {
    routes: filteredRoutes,
    loading,
    error,
    createRoute: useCallback((data) => addRoute(data), [addRoute]),
    updateRoute: useCallback((id, data) => updateRoute(id, data), [updateRoute]),
    deleteRoute: useCallback((id) => deleteRoute(id), [deleteRoute]),
    changeStatus: useCallback((id, status) => changeRouteStatus(id, status), [changeRouteStatus]),
  };
};
```

## 📋 Checklist de State Management

- [ ] Stores Zustand creados para cada entidad
- [ ] Acciones CRUD implementadas
- [ ] Manejo de errores consistente
- [ ] Custom hooks para datos comunes
- [ ] Persistencia en localStorage donde sea necesario
- [ ] DevTools integrado para debugging
- [ ] Integración con servicios HTTP
- [ ] Tests unitarios para stores
- [ ] Evitar re-renders innecesarios
- [ ] Selectors memorizados para performance

## 🔗 Componentes Relacionados

- Consulta el skill: **Servicios y APIs** para integración con backend
- Consulta el skill: **Componentes React** para usar hooks en componentes

---

**Última actualización**: Mayo 2026
