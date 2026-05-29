# Skill: Servicios, APIs y Consultas Geográficas

## 📌 Propósito
Implementar servicios HTTP reutilizables para comunicación con backend (APIs REST) y GeoServer (WMS/WFS), incluyendo manejo de errores, autenticación y caching.

## 🎯 Cuándo Usar Este Skill

**USE ESTE SKILL CUANDO:**
- Necesites crear llamadas a endpoints REST del backend
- Requieras consumir servicios WFS de GeoServer
- Debas implementar reportes y consultas complejas
- Necesites gestionar autenticación y autorización
- Requieras caching o sincronización de datos

**NO USES ESTE SKILL PARA:**
- Configuración de componentes mapa (usa skill de OpenLayers)
- UI components (usa skill de Componentes React)
- State management (usa skill de State Management)

## 🌐 Configuración Base de Axios

### Cliente HTTP
```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const GEOSERVER_BASE = process.env.REACT_APP_GEOSERVER_URL || 'http://localhost:8080/geoserver';

// Cliente para backend
export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cliente para GeoServer
export const geoserverClient = axios.create({
  baseURL: GEOSERVER_BASE,
  timeout: 30000, // GeoServer puede ser lento
});

// Interceptor: Agregar token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Manejar errores globalmente
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 📚 Servicios de Zonas

### CRUD de Zonas Turísticas
```javascript
// src/services/zones.js
import { apiClient, geoserverClient } from './api';
import GeoJSON from 'ol/format/GeoJSON';

export const zonesService = {
  // Listar todas las zonas
  listZones: async (filters = {}) => {
    try {
      const response = await apiClient.get('/zones', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Error al obtener zonas: ' + error.message);
    }
  },

  // Obtener zona por ID
  getZone: async (zoneId) => {
    try {
      const response = await apiClient.get(`/zones/${zoneId}`);
      return response.data;
    } catch (error) {
      throw new Error('Error al obtener zona: ' + error.message);
    }
  },

  // Crear nueva zona
  createZone: async (zoneData) => {
    try {
      // Validar no superposición en backend
      const response = await apiClient.post('/zones', zoneData);
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        throw new Error('Esta zona se superpone con otra existente');
      }
      throw new Error('Error al crear zona: ' + error.message);
    }
  },

  // Actualizar zona
  updateZone: async (zoneId, zoneData) => {
    try {
      const response = await apiClient.put(`/zones/${zoneId}`, zoneData);
      return response.data;
    } catch (error) {
      throw new Error('Error al actualizar zona: ' + error.message);
    }
  },

  // Eliminar zona
  deleteZone: async (zoneId) => {
    try {
      await apiClient.delete(`/zones/${zoneId}`);
    } catch (error) {
      throw new Error('Error al eliminar zona: ' + error.message);
    }
  },

  // Obtener zona con geométrica (GeoJSON)
  getZoneGeometry: async (zoneId) => {
    try {
      const response = await apiClient.get(`/zones/${zoneId}/geometry`);
      return response.data; // GeoJSON
    } catch (error) {
      throw new Error('Error al obtener geometría de zona: ' + error.message);
    }
  },

  // Validar superposición
  checkOverlap: async (geometry, excludeZoneId = null) => {
    try {
      const response = await apiClient.post('/zones/check-overlap', {
        geometry,
        excludeZoneId,
      });
      return response.data;
    } catch (error) {
      throw new Error('Error al validar superposición: ' + error.message);
    }
  },

  // Obtener estadísticas de zona
  getZoneStats: async (zoneId) => {
    try {
      const response = await apiClient.get(`/zones/${zoneId}/stats`);
      return response.data; // { routeCount, attractionCount, area, etc. }
    } catch (error) {
      throw new Error('Error al obtener estadísticas de zona: ' + error.message);
    }
  },
};
```

## 🛣️ Servicios de Recorridos

### CRUD y Gestión de Estado
```javascript
// src/services/routes.js
import { apiClient } from './api';

export const routesService = {
  // Listar recorridos
  listRoutes: async (filters = {}) => {
    try {
      const response = await apiClient.get('/routes', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Error al obtener recorridos: ' + error.message);
    }
  },

  // Obtener recorrido con detalles
  getRoute: async (routeId) => {
    try {
      const response = await apiClient.get(`/routes/${routeId}`);
      return response.data;
    } catch (error) {
      throw new Error('Error al obtener recorrido: ' + error.message);
    }
  },

  // Crear recorrido
  createRoute: async (routeData) => {
    try {
      const response = await apiClient.post('/routes', routeData);
      return response.data;
    } catch (error) {
      throw new Error('Error al crear recorrido: ' + error.message);
    }
  },

  // Actualizar recorrido
  updateRoute: async (routeId, routeData) => {
    try {
      const response = await apiClient.put(`/routes/${routeId}`, routeData);
      return response.data;
    } catch (error) {
      throw new Error('Error al actualizar recorrido: ' + error.message);
    }
  },

  // Eliminar recorrido
  deleteRoute: async (routeId) => {
    try {
      await apiClient.delete(`/routes/${routeId}`);
    } catch (error) {
      throw new Error('Error al eliminar recorrido: ' + error.message);
    }
  },

  // Cambiar estado (con validación de transiciones)
  changeRouteStatus: async (routeId, newStatus) => {
    try {
      const response = await apiClient.post(
        `/routes/${routeId}/status`,
        { status: newStatus }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Transición de estado no permitida');
      }
      throw new Error('Error al cambiar estado: ' + error.message);
    }
  },

  // Obtener historial de cambios
  getRouteHistory: async (routeId) => {
    try {
      const response = await apiClient.get(`/routes/${routeId}/history`);
      return response.data; // Array de { status, timestamp, reason }
    } catch (error) {
      throw new Error('Error al obtener historial: ' + error.message);
    }
  },

  // Obtener recorridos por zona
  getRoutesByZone: async (zoneId, filters = {}) => {
    try {
      const response = await apiClient.get(`/zones/${zoneId}/routes`, { 
        params: filters 
      });
      return response.data;
    } catch (error) {
      throw new Error('Error al obtener recorridos de zona: ' + error.message);
    }
  },

  // Agregar atracción a recorrido
  addAttractionToRoute: async (routeId, attractionId, order) => {
    try {
      const response = await apiClient.post(
        `/routes/${routeId}/attractions`,
        { attractionId, order }
      );
      return response.data;
    } catch (error) {
      throw new Error('Error al agregar atracción: ' + error.message);
    }
  },

  // Remover atracción de recorrido
  removeAttractionFromRoute: async (routeId, attractionId) => {
    try {
      await apiClient.delete(`/routes/${routeId}/attractions/${attractionId}`);
    } catch (error) {
      throw new Error('Error al remover atracción: ' + error.message);
    }
  },

  // Obtener recorridos activos por estacionalidad
  getActiveRoutes: async () => {
    try {
      const response = await apiClient.get('/routes/active');
      return response.data;
    } catch (error) {
      throw new Error('Error al obtener recorridos activos: ' + error.message);
    }
  },
};
```

## 🎯 Servicios de Atracciones

```javascript
// src/services/attractions.js
import { apiClient } from './api';

export const attractionsService = {
  // Listar atracciones
  listAttractions: async (filters = {}) => {
    try {
      const response = await apiClient.get('/attractions', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Error al obtener atracciones: ' + error.message);
    }
  },

  // Obtener atracción
  getAttraction: async (attractionId) => {
    try {
      const response = await apiClient.get(`/attractions/${attractionId}`);
      return response.data;
    } catch (error) {
      throw new Error('Error al obtener atracción: ' + error.message);
    }
  },

  // Crear atracción
  createAttraction: async (attractionData) => {
    try {
      const formData = new FormData();
      Object.keys(attractionData).forEach(key => {
        formData.append(key, attractionData[key]);
      });
      const response = await apiClient.post('/attractions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw new Error('Error al crear atracción: ' + error.message);
    }
  },

  // Actualizar atracción
  updateAttraction: async (attractionId, attractionData) => {
    try {
      const response = await apiClient.put(`/attractions/${attractionId}`, attractionData);
      return response.data;
    } catch (error) {
      throw new Error('Error al actualizar atracción: ' + error.message);
    }
  },

  // Eliminar atracción
  deleteAttraction: async (attractionId) => {
    try {
      await apiClient.delete(`/attractions/${attractionId}`);
    } catch (error) {
      throw new Error('Error al eliminar atracción: ' + error.message);
    }
  },

  // Obtener atracciones más populares
  getMostPopular: async (limit = 10) => {
    try {
      const response = await apiClient.get('/attractions/popular', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw new Error('Error al obtener atracciones populares: ' + error.message);
    }
  },

  // Buscar atracciones por clasificación
  searchByCategory: async (category) => {
    try {
      const response = await apiClient.get('/attractions/search', {
        params: { category },
      });
      return response.data;
    } catch (error) {
      throw new Error('Error al buscar atracciones: ' + error.message);
    }
  },
};
```

## 📊 Servicios de Reportes

```javascript
// src/services/reports.js
import { apiClient } from './api';

export const reportsService = {
  // Reporte: Recorridos por zona
  getRoutesByZoneReport: async (filters = {}) => {
    try {
      const response = await apiClient.get('/reports/routes-by-zone', { 
        params: filters 
      });
      return response.data; // { [zoneName]: { available, pending, etc. } }
    } catch (error) {
      throw new Error('Error al generar reporte: ' + error.message);
    }
  },

  // Reporte: Zonas con más recorridos activos
  getZonesByActiveRoutes: async (limit = 10) => {
    try {
      const response = await apiClient.get('/reports/zones-by-active-routes', {
        params: { limit },
      });
      return response.data; // Ordenado por cantidad de recorridos activos
    } catch (error) {
      throw new Error('Error al obtener zonas activas: ' + error.message);
    }
  },

  // Reporte: Puntos más populares
  getMostPopularPoints: async (limit = 20) => {
    try {
      const response = await apiClient.get('/reports/popular-points', {
        params: { limit },
      });
      return response.data; // Atracciones ordenadas por cantidad de recorridos
    } catch (error) {
      throw new Error('Error al obtener puntos populares: ' + error.message);
    }
  },

  // Exportar reporte (PDF/Excel)
  exportReport: async (reportType, format = 'pdf') => {
    try {
      const response = await apiClient.get(`/reports/${reportType}/export`, {
        params: { format },
        responseType: format === 'pdf' ? 'arraybuffer' : 'blob',
      });
      return response.data;
    } catch (error) {
      throw new Error('Error al exportar reporte: ' + error.message);
    }
  },
};
```

## 🔍 Consultas Geográficas

```javascript
// src/services/geoQueries.js
import { apiClient } from './api';

export const geoQueriesService = {
  // Búsqueda: Recorrido más cercano a ubicación
  findNearestRoute: async (latitude, longitude, maxDistance = 5000) => {
    try {
      const response = await apiClient.get('/geo/nearest-route', {
        params: { latitude, longitude, maxDistance },
      });
      return response.data;
    } catch (error) {
      throw new Error('Error en búsqueda de recorrido más cercano: ' + error.message);
    }
  },

  // Búsqueda: Zona por dirección
  findZoneByAddress: async (address) => {
    try {
      const response = await apiClient.get('/geo/zone-by-address', {
        params: { address },
      });
      return response.data;
    } catch (error) {
      throw new Error('Error al buscar zona por dirección: ' + error.message);
    }
  },

  // Búsqueda: Recorridos dentro de zona
  findRoutesByZone: async (zoneId) => {
    try {
      const response = await apiClient.get(`/geo/routes-in-zone/${zoneId}`);
      return response.data;
    } catch (error) {
      throw new Error('Error al buscar recorridos en zona: ' + error.message);
    }
  },

  // Búsqueda: Atracciones en buffer
  findAttractionsInBuffer: async (latitude, longitude, radiusMeters) => {
    try {
      const response = await apiClient.get('/geo/attractions-in-buffer', {
        params: { latitude, longitude, radius: radiusMeters },
      });
      return response.data;
    } catch (error) {
      throw new Error('Error al buscar atracciones: ' + error.message);
    }
  },

  // Geocoding: Dirección a coordenadas
  geocodeAddress: async (address) => {
    try {
      // Puede usar un servicio externo como Nominatim
      const response = await apiClient.get('/geo/geocode', {
        params: { address },
      });
      return response.data; // { latitude, longitude }
    } catch (error) {
      throw new Error('Error en geocoding: ' + error.message);
    }
  },

  // Reverse Geocoding: Coordenadas a dirección
  reverseGeocode: async (latitude, longitude) => {
    try {
      const response = await apiClient.get('/geo/reverse-geocode', {
        params: { latitude, longitude },
      });
      return response.data; // { address, zone, nearbyAttractions }
    } catch (error) {
      throw new Error('Error en reverse geocoding: ' + error.message);
    }
  },
};
```

## 🧠 Caching y Optimización

```javascript
// src/services/cache.js
const cache = new Map();

export const withCache = (key, ttl = 5 * 60 * 1000) => {
  return {
    set: (value) => {
      cache.set(key, {
        value,
        timestamp: Date.now(),
      });
    },
    get: () => {
      const cached = cache.get(key);
      if (!cached) return null;
      if (Date.now() - cached.timestamp > ttl) {
        cache.delete(key);
        return null;
      }
      return cached.value;
    },
    clear: () => cache.delete(key),
  };
};

// Ejemplo de uso:
const zonesCache = withCache('zones', 10 * 60 * 1000); // 10 minutos

export const getCachedZones = async () => {
  const cached = zonesCache.get();
  if (cached) return cached;
  
  const zones = await zonesService.listZones();
  zonesCache.set(zones);
  return zones;
};
```

## 📋 Checklist de Servicios

- [ ] Cliente HTTP configurado con autenticación
- [ ] Todos los endpoints REST implementados
- [ ] Servicios de WFS/WMS para GeoServer
- [ ] Manejo de errores consistente
- [ ] Caching implementado donde corresponda
- [ ] Validaciones de entrada en frontend
- [ ] Timeouts adecuados configurados
- [ ] Logging de errores para debugging
- [ ] Tests unitarios para servicios críticos
- [ ] Documentación de API esperada del backend

## 🔗 Componentes Relacionados

- Consulta el skill: **OpenLayers & GeoServer** para consultas WFS
- Consulta el skill: **State Management** para sincronizar datos

---

**Última actualización**: Mayo 2026
