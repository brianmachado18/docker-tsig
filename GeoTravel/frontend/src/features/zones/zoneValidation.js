import { integerBetween, required } from '@/shared/lib/forms/validation';
import { parsePolygonWkt } from '@/shared/lib/geo/wkt';

export const validateZoneForm = ({ name, description, attractionLevel, geomWkt }, t) => {
  if (!required(name)) return t('validation.nameRequired');
  if (!required(description)) return `${t('common.description')} requerida.`;
  if (!integerBetween(attractionLevel, 1, 5)) {
    return 'Nivel de atractivo debe estar entre 1 y 5.';
  }
  if (!required(geomWkt)) return t('zones.geometryRequired');
  if (!parsePolygonWkt(String(geomWkt).trim())) {
    return t('zones.geometryInvalid');
  }
  return '';
};
