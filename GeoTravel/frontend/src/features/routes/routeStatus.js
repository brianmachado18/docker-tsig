export const ROUTE_STATUS_LABEL_KEYS = {
  available: 'routes.available',
  pending: 'routes.pending',
  'off-season': 'routes.offSeason',
  cancelled: 'routes.cancelled',
};

export const STATUS_LABELS = {
  available: 'Disponible',
  pending: 'Pendiente',
  'off-season': 'Fuera de temporada',
  cancelled: 'Cancelado',
};

export const STATUS_STYLES = {
  available: 'text-green-700 bg-green-50 border-green-200',
  pending: 'text-blue-700 bg-blue-50 border-blue-200',
  'off-season': 'text-orange-600 bg-orange-50 border-orange-200',
  cancelled: 'text-red-600 bg-red-50 border-red-200',
};

export const STATUS_COLORS = {
  available: '#16a34a',
  pending: '#2563eb',
  'off-season': '#ea580c',
  cancelled: '#dc2626',
};

export const getRouteStatusOptions = (t) => [
  { id: 'available', label: t('routes.available') },
  { id: 'pending', label: t('routes.pending') },
  { id: 'off-season', label: t('routes.offSeason') },
  { id: 'cancelled', label: t('routes.cancelled') },
];
