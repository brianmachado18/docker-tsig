import { minimumNumber, required } from '@/shared/lib/forms/validation';
import { parseLineStringWkt } from '@/shared/lib/geo/wkt';

export const validateRouteForm = ({ name, description, startDay, startMonth, endDay, endMonth, durationHours, guide, geomWkt }, t) => {
  if (!required(name)) return t('validation.nameRequired');
  if (!required(description)) return `${t('common.description')} requerida.`;
  if (!required(startDay)) return 'Dia de inicio obligatorio.';
  if (!required(startMonth)) return 'Mes de inicio obligatorio.';
  if (!required(endDay)) return 'Dia de fin obligatorio.';
  if (!required(endMonth)) return 'Mes de fin obligatorio.';
  if (!minimumNumber(durationHours, 1)) return t('validation.durationMin');
  if (!required(guide)) return 'Guía responsable obligatoria.';
  if (!required(geomWkt)) return 'Dibujá el recorrido en el mapa o agregá al menos 2 paradas para generarlo.';
  if (!parseLineStringWkt(String(geomWkt).trim())) {
    return 'La geometría del recorrido no es válida.';
  }
  return '';
};
