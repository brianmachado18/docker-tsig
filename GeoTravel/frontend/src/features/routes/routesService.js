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
  stationId: route.stationId ?? route.idEstacion ?? null,
  name: route.name ?? route.nombre ?? '',
  description: route.description ?? route.descripcion ?? '',
  durationHours: route.durationHours ?? route.duracionEstimada ?? 0,
  guide: route.guide ?? route.guiaResponsable ?? '',
  experienceType: route.experienceType ?? experienceFromBackend(route.tipoExperiencia),
  status: route.status ?? statusFromBackend(route.estado),
  geomWkt: route.geomWkt ?? '',
  geometry: route.geometry ?? parseLineStringWkt(route.geomWkt),
  zoneIds: route.zoneIds ?? route.zonas ?? [],
  attractionIds: Array.isArray(route.attractionIds) ? route.attractionIds : [],
});

const toDto = (route) => ({
  idRecorrido: route.id ?? null,
  idEstacion: Number(route.stationId),
  nombre: String(route.name || '').trim(),
  descripcion: String(route.description || '').trim(),
  duracionEstimada: Number(route.durationHours),
  guiaResponsable: String(route.guide || '').trim(),
  tipoExperiencia: experienceToBackend(route.experienceType),
  estado: statusToBackend(route.status),
  geomWkt: String(route.geomWkt || '').trim(),
  zonas: Array.isArray(route.zoneIds) ? route.zoneIds : [],
});

const resolveCreatedRouteId = async (dto) => {
  const routes = await apiClient.get('/recorrido/buscar/todos');
  if (!Array.isArray(routes) || !routes.length) {
    return null;
  }

  const exactMatch = routes.find(
    (item) =>
      item.nombre === dto.nombre &&
      item.guiaResponsable === dto.guiaResponsable &&
      Number(item.idEstacion) === Number(dto.idEstacion)
  );

  if (exactMatch?.idRecorrido) {
    return exactMatch.idRecorrido;
  }

  const sorted = [...routes].sort((a, b) => Number(b.idRecorrido) - Number(a.idRecorrido));
  return sorted[0]?.idRecorrido ?? null;
};

const syncRouteAttractions = async (routeId, attractionIds) => {
  const existing = await apiClient.get(`/recorrido-atracciones/buscar/recorrido?idRecorrido=${routeId}`);
  if (Array.isArray(existing)) {
    await Promise.all(
      existing
        .filter((item) => item?.idRecorridoAtracciones)
        .map((item) =>
          apiClient.delete(
            `/recorrido-atracciones/eliminar?idRecorridoAtracciones=${item.idRecorridoAtracciones}`
          )
        )
    );
  }

  for (let index = 0; index < attractionIds.length; index += 1) {
    const attractionId = Number(attractionIds[index]);
    if (!Number.isFinite(attractionId)) {
      continue;
    }
    await apiClient.post('/recorrido-atracciones/alta', {
      idRecorridoAtracciones: null,
      idRecorrido: Number(routeId),
      idAtraccion: attractionId,
      orden: index + 1,
    });
  }
};

export const routesService = {
  async list() {
    const routes = await apiClient.get('/recorrido/buscar/todos');
    return Array.isArray(routes) ? routes.map(normalizeRoute) : [];
  },

  async listStations() {
    const stations = await apiClient.get('/estacion/buscar/todos');
    return Array.isArray(stations) ? stations : [];
  },

  async listRouteAttractions(routeId) {
    const relations = await apiClient.get(`/recorrido-atracciones/buscar/recorrido?idRecorrido=${routeId}`);
    return Array.isArray(relations) ? relations : [];
  },

  async save(route) {
    const dto = toDto(route);
    let routeId = route.id ?? null;

    if (route.id) {
      await apiClient.put('/recorrido/actualizar', dto);
    } else {
      await apiClient.post('/recorrido/alta', dto);
      routeId = await resolveCreatedRouteId(dto);
    }

    if (routeId && Array.isArray(route.attractionIds)) {
      await syncRouteAttractions(routeId, route.attractionIds);
    }

    return normalizeRoute({ ...dto, idRecorrido: routeId });
  },

  async remove(routeId) {
    const relations = await apiClient.get(`/recorrido-atracciones/buscar/recorrido?idRecorrido=${routeId}`);
    if (Array.isArray(relations)) {
      await Promise.all(
        relations
          .filter((item) => item?.idRecorridoAtracciones)
          .map((item) =>
            apiClient.delete(
              `/recorrido-atracciones/eliminar?idRecorridoAtracciones=${item.idRecorridoAtracciones}`
            )
          )
      );
    }
    return apiClient.delete(`/recorrido/eliminar?idRecorrido=${routeId}`);
  },
};
