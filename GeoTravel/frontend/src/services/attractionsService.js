import { ENV } from '../config/env';
import { apiClient } from './apiClient';
import { attractionsMock } from './mocks/attractionsMock';
import { parsePointWkt, toPointWkt } from './wkt';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
});

export const attractionsService = {
  async list() {
    if (ENV.useMocks) {
      await delay(200);
      return [...attractionsMock];
    }
    const attractions = await apiClient.get('/atraccion/buscar/todos');
    return Array.isArray(attractions) ? attractions.map(normalizeAttraction) : [];
  },

  async save(attraction) {
    if (ENV.useMocks) {
      await delay(200);
      return {
        ...attraction,
        id: attraction.id || `attr-${Date.now()}`,
      };
    }
    const dto = toDto(attraction);
    if (attraction.id) {
      await apiClient.put('/atraccion/actualizar', dto);
      return normalizeAttraction(dto);
    }
    await apiClient.post('/atraccion/alta', dto);
    return normalizeAttraction(dto);
  },

  async remove(attractionId) {
    if (ENV.useMocks) {
      await delay(200);
      return { ok: true };
    }
    return apiClient.delete(`/atraccion/eliminar?idAtraccion=${attractionId}`);
  },
};

