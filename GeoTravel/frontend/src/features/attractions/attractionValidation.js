import { required, validCoordinates } from '@/shared/lib/forms/validation';

export const validateAttractionForm = ({ title, description, category, latitude, longitude }, t) => {
  if (!required(title)) return t('validation.nameRequired');
  if (!required(description)) return `${t('common.description')} requerida.`;
  if (!required(category)) return `${t('attractions.category')} requerida.`;
  if (!required(latitude) || !required(longitude)) {
    return 'Latitud y longitud son obligatorias.';
  }
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return 'Latitud y longitud deben ser numéricas.';
  }
  if (!validCoordinates(latitude, longitude)) {
    return 'Latitud/longitud fuera de rango.';
  }
  return '';
};
