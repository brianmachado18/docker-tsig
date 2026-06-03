import { minimumNumber, required } from '@/shared/lib/forms/validation';
import { parseLineStringWkt } from '@/shared/lib/geo/wkt';

export const validateRouteForm = ({ name, description, stationId, durationHours, guide, geomWkt }, t) => {
  if (!required(name)) return t('validation.nameRequired');
  if (!required(description)) return `${t('common.description')} requerida.`;
  if (!stationId) return 'Estación obligatoria.';
  if (!minimumNumber(durationHours, 1)) return t('validation.durationMin');
  if (!required(guide)) return 'Guía responsable obligatoria.';
  if (!required(geomWkt)) return 'Geometría WKT obligatoria.';
  if (!parseLineStringWkt(String(geomWkt).trim())) {
    return 'La geometría debe ser un LINESTRING WKT válido.';
  }
  return '';
};
