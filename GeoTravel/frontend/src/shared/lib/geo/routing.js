const OSRM_BASE = 'http://router.project-osrm.org/route/v1';
const OSRM_DE   = 'https://routing.openstreetmap.de';

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

// Perfil OSRM correcto según el endpoint de routing.openstreetmap.de
const deProfile = (deEndpoint) => {
  if (deEndpoint === 'routed-bike') return 'bike';
  if (deEndpoint === 'routed-foot') return 'foot';
  return 'driving';
};

// Intenta routing.openstreetmap.de con fallback a tiempo estimado si falla o tarda
const fetchModeRoute = async (deEndpoint, coordStr, fallbackDrivingData) => {
  const profile = deProfile(deEndpoint);
  try {
    const res = await fetchWithTimeout(
      `${OSRM_DE}/${deEndpoint}/route/v1/${profile}/${coordStr}?overview=full&geometries=geojson`,
      8000,
    );
    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.[0]) {
        const { duration, geometry, distance } = data.routes[0];
        return { wkt: geojsonToWkt(geometry.coordinates), minutes: Math.round(duration / 60), distance };
      }
    }
  } catch { /* timeout o error de red → fallback */ }

  // Fallback: tiempo estimado por velocidad típica, sin WKT (renderNavRoute dibuja línea recta)
  if (fallbackDrivingData) {
    const { distance } = fallbackDrivingData;
    return {
      wkt: null,
      minutes: profile === 'bike'
        ? Math.round(distance / (20000 / 60))  // ~20 km/h
        : Math.round(distance / (5000 / 60)),   // ~5 km/h
      distance,
    };
  }
  return null;
};

// Devuelve { driving, cycling, walking } con { wkt, minutes } para cada modo.
export const fetchAllModeRoutes = async (origin, destination) => {
  const coordStr = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;

  // Driving con timeout de 6s (servidor conocido)
  let drivingResult = null;
  try {
    const res = await fetchWithTimeout(
      `${OSRM_BASE}/driving/${coordStr}?overview=full&geometries=geojson`,
      6000,
    );
    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.[0]) {
        const { duration, geometry, distance } = data.routes[0];
        drivingResult = { wkt: geojsonToWkt(geometry.coordinates), minutes: Math.round(duration / 60), distance };
      }
    }
  } catch { /* timeout → drivingResult null */ }

  // Cycling y walking en paralelo, timeout 5s cada uno, fallback a ruta de auto
  const [cycling, walking] = await Promise.all([
    fetchModeRoute('routed-bike', coordStr, drivingResult),
    fetchModeRoute('routed-foot', coordStr, drivingResult),
  ]);

  return { driving: drivingResult, cycling, walking };
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
