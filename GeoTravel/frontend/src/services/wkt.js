const NUMBER_PATTERN = '-?\\d+(?:\\.\\d+)?';

const splitCoords = (coordText) =>
  coordText
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [x, y] = pair.split(/\s+/).filter(Boolean).map(Number);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return null;
      }
      return [x, y];
    })
    .filter(Boolean);

export const parsePointWkt = (wkt) => {
  if (!wkt || typeof wkt !== 'string') {
    return null;
  }
  const match = wkt.match(new RegExp(`POINT\\s*\\(\\s*(${NUMBER_PATTERN})\\s+(${NUMBER_PATTERN})\\s*\\)`, 'i'));
  if (!match) {
    return null;
  }
  return [Number(match[1]), Number(match[2])];
};

export const parseLineStringWkt = (wkt) => {
  if (!wkt || typeof wkt !== 'string') {
    return null;
  }
  const match = wkt.match(/^LINESTRING\s*\((.+)\)$/i);
  if (!match) {
    return null;
  }
  const coordinates = splitCoords(match[1]);
  if (coordinates.length < 2) {
    return null;
  }
  return { type: 'LineString', coordinates };
};

export const parsePolygonWkt = (wkt) => {
  if (!wkt || typeof wkt !== 'string') {
    return null;
  }
  const match = wkt.match(/^POLYGON\s*\(\((.+)\)\)$/i);
  if (!match) {
    return null;
  }
  const ring = splitCoords(match[1]);
  if (ring.length < 4) {
    return null;
  }
  const [firstX, firstY] = ring[0];
  const [lastX, lastY] = ring[ring.length - 1];
  if (firstX !== lastX || firstY !== lastY) {
    ring.push([firstX, firstY]);
  }
  return { type: 'Polygon', coordinates: [ring] };
};

export const toPointWkt = (longitude, latitude) => `POINT(${Number(longitude)} ${Number(latitude)})`;

