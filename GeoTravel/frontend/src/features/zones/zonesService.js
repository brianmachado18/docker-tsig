import { apiClient } from '@/shared/lib/api/apiClient';
import { parseLineStringWkt, parsePolygonWkt } from '@/shared/lib/geo/wkt';

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

const extractId = (item) => {
  if (item === null || item === undefined) return null;
  if (typeof item === 'object') return item.id ?? item.idAtraccion ?? item.idRecorrido ?? null;
  return item;
};

const normalizeIdArray = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.map(extractId).filter((id) => id !== null && id !== undefined);
};

const normalizeZone = (zone) => ({
  id: zone.id ?? zone.idZona,
  name: zone.name ?? zone.nombre ?? '',
  description: zone.description ?? zone.descripcion ?? '',
  attractionLevel: zone.attractionLevel ?? zone.nivelAtractivo ?? 1,
  notes: zone.notes ?? zone.observaciones ?? '',
  geomWkt: zone.geomWkt ?? '',
  geometry: zone.geometry ?? parsePolygonWkt(zone.geomWkt),
  routeIds: normalizeIdArray(zone.routeIds ?? zone.recorridos),
  attractionIds: normalizeIdArray(zone.attractionIds ?? zone.atracciones),
  status: zone.status ?? 'active',
});

const normalizeActiveRoute = (route) => ({
  id: route.id ?? route.idRecorrido,
  name: route.name ?? route.nombre ?? '',
  description: route.description ?? route.descripcion ?? '',
  status: route.status ?? statusFromBackend(route.estado),
  geomWkt: route.geomWkt ?? '',
  geometry: route.geometry ?? parseLineStringWkt(route.geomWkt),
});

const normalizeActiveZone = (zone) => ({
  ...normalizeZone(zone),
  activeRoutesCount: Number(zone.activeRoutesCount ?? zone.cantidadRecorridosActivos ?? 0),
  activeRoutes: Array.isArray(zone.activeRoutes ?? zone.recorridosActivos)
    ? (zone.activeRoutes ?? zone.recorridosActivos).map(normalizeActiveRoute)
    : [],
  offSeasonRoutesCount: Number(zone.offSeasonRoutesCount ?? zone.cantidadRecorridosFueraDeTemporada ?? 0),
  offSeasonRoutes: Array.isArray(zone.offSeasonRoutes ?? zone.recorridosFueraDeTemporada)
    ? (zone.offSeasonRoutes ?? zone.recorridosFueraDeTemporada).map(normalizeActiveRoute)
    : [],
});

const toDto = (zone) => ({
  idZona: zone.id ?? null,
  nombre: String(zone.name || '').trim(),
  descripcion: String(zone.description || '').trim(),
  nivelAtractivo: Number(zone.attractionLevel),
  observaciones: String(zone.notes || '').trim(),
  geomWkt: String(zone.geomWkt || '').trim(),
  recorridos: Array.isArray(zone.routeIds) ? zone.routeIds : [],
});

export const zonesService = {
  async list() {
    const zones = await apiClient.get('/zona/buscar/todos');
    return Array.isArray(zones) ? zones.map(normalizeZone) : [];
  },

  async findByAddress(address) {
    const zone = await apiClient.get(`/zona/buscar/porDireccion?direccion=${encodeURIComponent(address)}`);
    return zone ? normalizeZone(zone) : null;
  },

  async listActiveZones() {
    const zones = await apiClient.get('/zona/buscar/activas');
    return Array.isArray(zones) ? zones.map(normalizeActiveZone) : [];
  },

  async save(zone) {
    const dto = toDto(zone);
    if (zone.id) {
      await apiClient.put('/zona/actualizar', dto);
      return normalizeZone(dto);
    }
    await apiClient.post('/zona/alta', dto);
    return normalizeZone(dto);
  },

  async remove(zoneId) {
    return apiClient.delete(`/zona/eliminar?idZona=${zoneId}`);
  },
};
