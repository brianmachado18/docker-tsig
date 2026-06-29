const OSRM_BASE = 'http://router.project-osrm.org/route/v1';
const OSRM_DE = 'https://routing.openstreetmap.de';

// ── Creación de rutas (formulario) ────────────────────────────────────────────

export const fetchRoadRoute = async (waypoints) => {
  if (!waypoints || waypoints.length < 2) return null;
  const coordStr = waypoints.map(([lon, lat]) => `${lon},${lat}`).join(';');
  try {
    const res = await fetch(`${OSRM_BASE}/driving/${coordStr}?overview=full&geometries=geojson`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    const inner = data.routes[0].geometry.coordinates.map(([lon, lat]) => `${lon} ${lat}`).join(', ');
    return `LINESTRING (${inner})`;
  } catch { return null; }
};

export const optimizeStopsOrder = async (coords) => {
  if (coords.length < 3) return null;
  const coordStr = coords.map(([lon, lat]) => `${lon},${lat}`).join(';');
  try {
    const res = await fetch(`${OSRM_BASE}/trip/v1/driving/${coordStr}?roundtrip=false&source=first&destination=last&geometries=geojson`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.trips?.[0] || !data.waypoints) return null;
    const tripToOriginal = new Array(coords.length);
    data.waypoints.forEach((wp, origIdx) => { tripToOriginal[wp.waypoint_index] = origIdx; });
    const inner = data.trips[0].geometry.coordinates.map(([lon, lat]) => `${lon} ${lat}`).join(', ');
    return { reorderedIndices: tripToOriginal, wkt: `LINESTRING (${inner})` };
  } catch { return null; }
};

// ── Rutas por modo de transporte (popup) ─────────────────────────────────────

const geojsonToWkt = (coordinates) => {
  const inner = coordinates.map(([lon, lat]) => `${lon} ${lat}`).join(', ');
  return `LINESTRING (${inner})`;
};

// fetch con timeout — aborta si el servidor no responde en `ms` milisegundos
const fetchWithTimeout = (url, ms = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
};

// Distancia en línea recta (metros) entre dos puntos [lon, lat]
const haversineMeters = (a, b) => {
  const R = 6371000;
  const toRad = (d) => d * (Math.PI / 180);
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Intenta una URL de OSRM y devuelve { wkt, minutes, distance } o null si falla
const tryOsrm = async (url) => {
  try {
    const res = await fetchWithTimeout(url, 6000);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    const { duration, geometry, distance } = data.routes[0];
    return { wkt: geojsonToWkt(geometry.coordinates), minutes: Math.round(duration / 60), distance };
  } catch {
    return null;
  }
};

// Devuelve { driving, cycling, walking } con { wkt, minutes } para cada modo.
// Los tres modos se consultan en paralelo; si OSRM falla usa tiempo estimado por distancia.
export const fetchAllModeRoutes = async (origin, destination) => {
  const coordStr = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
  // Factor 1.3 sobre línea recta para aproximar distancia real de camino
  const dist = haversineMeters(origin, destination) * 1.3;

  const [driving, cycling, walking] = await Promise.all([
    tryOsrm(`${OSRM_BASE}/driving/${coordStr}?overview=full&geometries=geojson`)
      .then((r) => r ?? { wkt: null, minutes: Math.round(dist / (30000 / 60)), distance: dist }),
    tryOsrm(`${OSRM_DE}/routed-bike/route/v1/bike/${coordStr}?overview=full&geometries=geojson`)
      .then((r) => r ?? { wkt: null, minutes: Math.round(dist / (20000 / 60)), distance: dist }),
    tryOsrm(`${OSRM_DE}/routed-foot/route/v1/foot/${coordStr}?overview=full&geometries=geojson`)
      .then((r) => r ?? { wkt: null, minutes: Math.round(dist / (5000 / 60)), distance: dist }),
  ]);

  return { driving, cycling, walking };
};

// Compatibilidad con código que usa fetchTravelTimes
export const fetchTravelTimes = async (origin, destination) => {
  const routes = await fetchAllModeRoutes(origin, destination);
  if (!routes.driving && !routes.cycling && !routes.walking) return null;
  return {
    driving: routes.driving?.minutes ?? null,
    cycling: routes.cycling?.minutes ?? null,
    walking: routes.walking?.minutes ?? null,
  };
};
