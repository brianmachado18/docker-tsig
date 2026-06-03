import { apiClient } from '@/shared/lib/api/apiClient';
import { parsePolygonWkt } from '@/shared/lib/geo/wkt';

const normalizeZone = (zone) => ({
  id: zone.id ?? zone.idZona,
  name: zone.name ?? zone.nombre ?? '',
  description: zone.description ?? zone.descripcion ?? '',
  attractionLevel: zone.attractionLevel ?? zone.nivelAtractivo ?? 1,
  notes: zone.notes ?? zone.observaciones ?? '',
  geomWkt: zone.geomWkt ?? '',
  geometry: zone.geometry ?? parsePolygonWkt(zone.geomWkt),
  routeIds: zone.routeIds ?? zone.recorridos ?? [],
  status: zone.status ?? 'active',
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
