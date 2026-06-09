export const ROUTE_STATUS_LABEL_KEYS = {
  available: 'routes.available',
  pending: 'routes.pending',
  'off-season': 'routes.offSeason',
  cancelled: 'routes.cancelled',
};

export const STATUS_LABELS = {
  available: 'Disponible',
  pending: 'Pendiente',
  'off-season': 'Fuera de Temporada',
  cancelled: 'Cancelado',
};

export const STATUS_STYLES = {
  available: 'bg-status-available/10 text-status-available border-status-available/20',
  pending: 'bg-status-pending/10 text-status-pending border-status-pending/20',
  'off-season': 'bg-status-off-season/10 text-status-off-season border-status-off-season/20',
  cancelled: 'bg-status-cancelled/10 text-status-cancelled border-status-cancelled/20',
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
