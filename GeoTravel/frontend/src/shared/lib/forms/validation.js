export const required = (value) => String(value ?? '').trim().length > 0;

export const integerBetween = (value, min, max) => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue >= min && numberValue <= max;
};

export const minimumNumber = (value, min) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= min;
};

export const validCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
};

export const getApiErrorMessage = (error, fallback) => {
  if (!error) {
    return '';
  }
  return error.details || error.message || fallback;
};
