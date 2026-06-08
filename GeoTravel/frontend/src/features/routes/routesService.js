import { apiClient } from '@/shared/lib/api/apiClient';
import { parseLineStringWkt } from '@/shared/lib/geo/wkt';

const statusFromBackend = (status) => {
  switch (String(status || '').toUpperCase()) {
    case 'FUERA_DE_ESTACION':
      return 'off-season';
    case 'PENDIENTE':
      return 'pending';
    case 'CANCELADO':
      return 'cancelled';
    default:
      return 'available';
  }
};

const statusToBackend = (status) => {
  switch (status) {
    case 'off-season':
      return 'FUERA_DE_ESTACION';
    case 'pending':
      return 'PENDIENTE';
    case 'cancelled':
      return 'CANCELADO';
    default:
      return 'DISPONIBLE';
  }
};

const experienceFromBackend = (type) => {
  switch (String(type || '').toUpperCase()) {
    case 'GASTRONOMICO':
      return 'gastronomic';
    case 'NATURAL':
      return 'natural';
    case 'HITORICA':
      return 'historical';
    case 'AVENTURA':
      return 'adventure';
    case 'OTRO':
      return 'other';
    default:
      return 'cultural';
  }
};

const experienceToBackend = (type) => {
  switch (type) {
    case 'gastronomic':
      return 'GASTRONOMICO';
    case 'natural':
      return 'NATURAL';
    case 'historical':
      return 'HITORICA';
    case 'adventure':
      return 'AVENTURA';
    case 'other':
      return 'OTRO';
    default:
      return 'CULTURAL';
  }
};

const normalizeRoute = (route) => ({
  id: route.id ?? route.idRecorrido,
  mesInicio: route.mesInicio ?? null,
  mesFin: route.mesFin ?? null,
  name: route.name ?? route.nombre ?? '',
  description: route.description ?? route.descripcion ?? '',
  durationHours: route.durationHours ?? route.duracionEstimada ?? 0,
  guide: route.guide ?? route.guiaResponsable ?? '',
  experienceType: route.experienceType ?? experienceFromBackend(route.tipoExperiencia),
  status: route.status ?? statusFromBackend(route.estado),
  geomWkt: route.geomWkt ?? '',
  geometry: route.geometry ?? parseLineStringWkt(route.geomWkt),
  zoneIds: route.zoneIds ?? route.zonas ?? [],
  // El backend (mauri) ya devuelve las paradas en `atracciones`, ordenadas.
  attractionIds: route.attractionIds ?? route.atracciones ?? [],
});

const toDto = (route) => ({
  idRecorrido: route.id ?? null,
  mesInicio: Number(route.mesInicio),
  mesFin: Number(route.mesFin),
  nombre: String(route.name || '').trim(),
  descripcion: String(route.description || '').trim(),
  duracionEstimada: Number(route.durationHours),
  guiaResponsable: String(route.guide || '').trim(),
  tipoExperiencia: experienceToBackend(route.experienceType),
  estado: statusToBackend(route.status),
  geomWkt: String(route.geomWkt || '').trim(),
  // Zonas por las que pasa y paradas (en orden) viajan en el mismo body:
  // el endpoint /recorrido/alta y /recorrido/actualizar las sincroniza.
  zonas: Array.isArray(route.zoneIds) ? route.zoneIds : [],
  atracciones: Array.isArray(route.attractionIds) ? route.attractionIds : [],
});

export const routesService = {
  async list() {
    const routes = await apiClient.get('/recorrido/buscar/todos');
    return Array.isArray(routes) ? routes.map(normalizeRoute) : [];
  },

  async save(route) {
    const dto = toDto(route);
    if (route.id) {
      await apiClient.put('/recorrido/actualizar', dto);
    } else {
      await apiClient.post('/recorrido/alta', dto);
    }
    return normalizeRoute({ ...dto, idRecorrido: route.id ?? null });
  },

  async remove(routeId) {
    return apiClient.delete(`/recorrido/eliminar?idRecorrido=${routeId}`);
  },

  async changeStatus(routeId, status) {
    const backendStatus = statusToBackend(status);
    await apiClient.put(`/recorrido/cambiarEstado?idRecorrido=${routeId}&estado=${backendStatus}`);
  },

  async getHistory(routeId) {
    const entries = await apiClient.get(`/historico/buscar/porRecorrido?idRecorrido=${routeId}`);
    if (!Array.isArray(entries)) return [];
    return entries
      .map((e) => ({
        id: e.idHistorico,
        status: statusFromBackend(e.estado),
        date: e.fechaCambio,
      }))
      .reverse();
  },
};
