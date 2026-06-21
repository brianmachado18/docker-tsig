import { apiClient } from '@/shared/lib/api/apiClient';
import { parsePointWkt, toPointWkt } from '@/shared/lib/geo/wkt';

const normalizeAttraction = (attraction) => {
  const coordinates = attraction.coordinates ?? parsePointWkt(attraction.geomWkt);
  return {
    id: attraction.id ?? attraction.idAtraccion,
    title: attraction.title ?? attraction.name ?? attraction.nombre ?? '',
    description: attraction.description ?? attraction.descripcion ?? '',
    category: attraction.category ?? attraction.clasificacion ?? 'OTRO',
    imageUrl: attraction.imageUrl ?? attraction.fotoUrl ?? '',
    coordinates,
    longitude: coordinates?.[0] ?? '',
    latitude: coordinates?.[1] ?? '',
    geomWkt: attraction.geomWkt ?? (coordinates ? toPointWkt(coordinates[0], coordinates[1]) : ''),
    status: attraction.status ?? 'active',
    ranking: attraction.ranking ?? attraction.cantidadDeAparicionesEnRecorridos,
  };
};

const toDto = (attraction) => ({
  idAtraccion: attraction.id ?? null,
  nombre: String(attraction.title || '').trim(),
  descripcion: String(attraction.description || '').trim(),
  clasificacion: String(attraction.category || '').trim(),
  fotoUrl: String(attraction.imageUrl || '').trim(),
  geomWkt: String(
    attraction.geomWkt ||
      toPointWkt(attraction.longitude, attraction.latitude)
  ).trim(),
  cantidadDeAparicionesEnRecorridos: attraction.ranking ?? null,
});

export const attractionsService = {
  async list() {
    const attractions = await apiClient.get('/atraccion/buscar/todos');
    return Array.isArray(attractions) ? attractions.map(normalizeAttraction) : [];
  },

  async save(attraction) {
    const dto = toDto(attraction);
    if (attraction.id) {
      await apiClient.put('/atraccion/actualizar', dto);
      return normalizeAttraction(dto);
    }
    await apiClient.post('/atraccion/alta', dto);
    return normalizeAttraction(dto);
  },

  async remove(attractionId) {
    return apiClient.delete(`/atraccion/eliminar?idAtraccion=${attractionId}`);
  },
};
