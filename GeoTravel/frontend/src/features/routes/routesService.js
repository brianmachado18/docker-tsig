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
  //stationId: route.stationId ?? route.idEstacion ?? null,
  name: route.name ?? route.nombre ?? '',
  description: route.description ?? route.descripcion ?? '',
  durationHours: route.durationHours ?? route.duracionEstimada ?? 0,
  guide: route.guide ?? route.guiaResponsable ?? '',
  experienceType: route.experienceType ?? experienceFromBackend(route.tipoExperiencia),
  status: route.status ?? statusFromBackend(route.estado),
  startDay: route.startDay ?? route.diaInicio ?? 0,
  startMonth: route.startMonth ?? route.mesInicio ?? 0,
  endDay: route.endDay ?? route.diaFin ?? 0,
  endMonth: route.endMonth ?? route.mesFin ?? 0,
  geomWkt: route.geomWkt ?? '',
  geometry: route.geometry ?? parseLineStringWkt(route.geomWkt),
  zoneIds: route.zoneIds ?? route.zonas ?? [],
  // El backend (mauri) ya devuelve las paradas en `atracciones`, ordenadas.
  attractionIds: route.attractionIds ?? route.atracciones ?? [],
});

const toDto = (route) => ({
  idRecorrido: route.id ?? null,
  //idEstacion: Number(route.stationId),
  nombre: String(route.name || '').trim(),
  descripcion: String(route.description || '').trim(),
  duracionEstimada: Number(route.durationHours),
  guiaResponsable: String(route.guide || '').trim(),
  tipoExperiencia: experienceToBackend(route.experienceType),
  estado: statusToBackend(route.status),
  diaInicio: Number(route.startDay),
  mesInicio: Number(route.startMonth),
  diaFin: Number(route.endDay),
  mesFin: Number(route.endMonth),
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

  async listByZone(zoneId) {
    const routes = await apiClient.get(`/recorrido/buscar/porZona?idZona=${zoneId}`);
    return Array.isArray(routes) ? routes.map(normalizeRoute) : [];
  },

  async findByIntersection(street1, street2) {
    const result = await apiClient.get(
      `/recorrido/buscar/porInterseccion?calle1=${encodeURIComponent(street1)}&calle2=${encodeURIComponent(street2)}`
    );

    if (!result) {
      return null;
    }

    return {
      route: result.recorrido ? normalizeRoute(result.recorrido) : null,
      zones: Array.isArray(result.zonas)
        ? result.zonas.map((zone) => ({
            id: zone.id ?? zone.idZona,
            name: zone.name ?? zone.nombre ?? '',
            description: zone.description ?? zone.descripcion ?? '',
            attractionLevel: zone.attractionLevel ?? zone.nivelAtractivo ?? 1,
            notes: zone.notes ?? zone.observaciones ?? '',
            geomWkt: zone.geomWkt ?? '',
            routeIds: zone.routeIds ?? zone.recorridos ?? [],
          }))
        : [],
      distanceMeters: result.distanciaMetros ?? null,
    };
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
    if (!Array.isArray(entries)) {
      return [];
    }

    return entries
      .map((entry) => ({
        id: entry.idHistorico,
        status: statusFromBackend(entry.estado),
        date: entry.fechaCambio,
      }))
      .reverse();
  },
};
