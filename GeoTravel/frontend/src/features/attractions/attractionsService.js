import { apiClient } from '@/shared/lib/api/apiClient';
import { fetchWfsFeatureCollection } from '@/features/map/services/geoserver';
import { parsePointWkt, toPointWkt } from '@/shared/lib/geo/wkt';

const CLASIFICACION_LABELS = {
  0: 'MUSEO',
  1: 'TEATRO',
  2: 'MONUMENTO',
  3: 'PLAZA',
  4: 'GASTRONOMIA',
  5: 'PLAYA',
  6: 'PARQUE',
};

const normalizeClassification = (value) => {
  if (value === undefined || value === null || value === '') {
    return 'OTRO';
  }
  return CLASIFICACION_LABELS[value] ?? String(value);
};

const normalizeAttractionFeature = (feature) => {
  const properties = feature?.properties ?? {};
  const coordinates = feature?.geometry?.type === 'Point' ? feature.geometry.coordinates : null;
  return normalizeAttraction({
    idAtraccion: properties.id_atraccion ?? properties.idAtraccion ?? (feature?.id).replace("atraccion.", ""),
    nombre: properties.nombre,
    descripcion: properties.descripcion,
    clasificacion: normalizeClassification(properties.clasificacion),
    fotoUrl: properties.foto_url ?? properties.fotoUrl,
    geomWkt: coordinates ? toPointWkt(coordinates[0], coordinates[1]) : properties.geom_wkt,
    coordinates,
  });
};

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
  idAtraccion: attraction.id === undefined ?  null : (attraction.id).replace("atraccion.", ""),
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
    const featureCollection = await fetchWfsFeatureCollection('attractions');
    return Array.isArray(featureCollection.features)
      ? featureCollection.features.map(normalizeAttractionFeature)
      : [];
  },

  async listRanking() {
    const attractionCollection = await apiClient.get('/atraccion/buscar/todos');
    return Array.isArray(attractionCollection)
      ? attractionCollection.map(normalizeAttraction)
      : [];
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
    return apiClient.delete(`/atraccion/eliminar?idAtraccion=${attractionId.replace("atraccion.", "")}`);
  },
};
