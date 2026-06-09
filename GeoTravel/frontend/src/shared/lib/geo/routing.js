const OSRM_ROUTE_BASE = 'http://router.project-osrm.org/route/v1';
const OSRM_TRIP_BASE = 'http://router.project-osrm.org/trip/v1';
const OSRM_DE_BASE = 'https://routing.openstreetmap.de';

const isValidCoordinate = (pair) =>
  Array.isArray(pair)
  && Number.isFinite(Number(pair[0]))
  && Number.isFinite(Number(pair[1]));

const normalizeCoordinates = (coordinates) =>
  Array.isArray(coordinates)
    ? coordinates
      .filter(isValidCoordinate)
      .map(([lon, lat]) => [Number(lon), Number(lat)])
    : [];

const toCoordinateString = (coordinates) =>
  normalizeCoordinates(coordinates)
    .map(([lon, lat]) => `${lon},${lat}`)
    .join(';');

const geojsonToWkt = (coordinates) => {
  const normalized = normalizeCoordinates(coordinates);
  if (normalized.length < 2) {
    return null;
  }
  const inner = normalized.map(([lon, lat]) => `${lon} ${lat}`).join(', ');
  return `LINESTRING (${inner})`;
};

const fetchWithTimeout = (url, ms = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
};

const readRoute = async (url, timeoutMs) => {
  try {
    const res = await fetchWithTimeout(url, timeoutMs);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) {
      return null;
    }

    const { duration, geometry, distance } = data.routes[0];
    const wkt = geojsonToWkt(geometry?.coordinates);
    if (!wkt) {
      return null;
    }

    return {
      wkt,
      minutes: Math.round(Number(duration || 0) / 60),
      distance: Number(distance || 0),
    };
  } catch {
    return null;
  }
};

const profileFromDeEndpoint = (endpoint) => {
  if (endpoint === 'routed-bike') {
    return 'bike';
  }
  if (endpoint === 'routed-foot') {
    return 'foot';
  }
  return 'driving';
};

const estimateFallback = (profile, drivingRoute) => {
  if (!drivingRoute?.distance) {
    return null;
  }

  const speedMetersPerMinute = profile === 'bike'
    ? 20000 / 60
    : 5000 / 60;

  return {
    wkt: null,
    minutes: Math.round(drivingRoute.distance / speedMetersPerMinute),
    distance: drivingRoute.distance,
  };
};

export const fetchRoadRoute = async (waypoints) => {
  const coordinateString = toCoordinateString(waypoints);
  if (normalizeCoordinates(waypoints).length < 2) {
    return null;
  }

  const route = await readRoute(
    `${OSRM_ROUTE_BASE}/driving/${coordinateString}?overview=full&geometries=geojson`,
    7000,
  );

  return route?.wkt ?? null;
};

export const optimizeStopsOrder = async (coords) => {
  const normalized = normalizeCoordinates(coords);
  if (normalized.length < 2) {
    return null;
  }

  const coordinateString = toCoordinateString(normalized);

  try {
    const res = await fetchWithTimeout(
      `${OSRM_TRIP_BASE}/driving/${coordinateString}?roundtrip=false&source=first&destination=last&overview=full&geometries=geojson`,
      7000,
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.code !== 'Ok' || !data.trips?.[0] || !Array.isArray(data.waypoints)) {
      return null;
    }

    const reorderedIndices = new Array(normalized.length);
    data.waypoints.forEach((waypoint, originalIndex) => {
      reorderedIndices[waypoint.waypoint_index] = originalIndex;
    });

    const wkt = geojsonToWkt(data.trips[0].geometry?.coordinates);
    if (!wkt || reorderedIndices.some((index) => !Number.isInteger(index))) {
      return null;
    }

    return { reorderedIndices, wkt };
  } catch {
    return null;
  }
};

const fetchModeRoute = async (endpoint, coordinateString, timeoutMs) => {
  const profile = profileFromDeEndpoint(endpoint);
  return readRoute(
    `${OSRM_DE_BASE}/${endpoint}/route/v1/${profile}/${coordinateString}?overview=full&geometries=geojson`,
    timeoutMs,
  );
};

export const fetchAllModeRoutes = async (origin, destination) => {
  const normalized = normalizeCoordinates([origin, destination]);
  if (normalized.length < 2) {
    return {
      driving: null,
      cycling: null,
      walking: null,
    };
  }

  const coordinateString = toCoordinateString(normalized);

  const drivingPromise = readRoute(
    `${OSRM_ROUTE_BASE}/driving/${coordinateString}?overview=full&geometries=geojson`,
    7000,
  );
  const cyclingPromise = fetchModeRoute('routed-bike', coordinateString, 8000);
  const walkingPromise = fetchModeRoute('routed-foot', coordinateString, 8000);

  const [driving, cyclingResult, walkingResult] = await Promise.all([
    drivingPromise,
    cyclingPromise,
    walkingPromise,
  ]);

  return {
    driving,
    cycling: cyclingResult ?? estimateFallback('bike', driving),
    walking: walkingResult ?? estimateFallback('foot', driving),
  };
};

export const fetchTravelTimes = async (origin, destination) => {
  const routes = await fetchAllModeRoutes(origin, destination);
  if (!routes.driving && !routes.cycling && !routes.walking) {
    return null;
  }

  return {
    driving: routes.driving?.minutes ?? null,
    cycling: routes.cycling?.minutes ?? null,
    walking: routes.walking?.minutes ?? null,
  };
};
