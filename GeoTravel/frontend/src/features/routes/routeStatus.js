export const STATUS_LABELS = {
  available:    'Disponible',
  pending:      'Pendiente',
  'off-season': 'Fuera de temporada',
  cancelled:    'Cancelado',
};

// Clases Tailwind para badge (texto + fondo + borde)
export const STATUS_STYLES = {
  available:    'text-green-700  bg-green-50  border-green-300',
  pending:      'text-blue-700   bg-blue-50   border-blue-300',
  'off-season': 'text-orange-700 bg-orange-50 border-orange-300',
  cancelled:    'text-red-700    bg-red-50    border-red-300',
};

// Hex para usos inline (puntos, íconos en mapa, etc.)
export const STATUS_COLORS = {
  available:    '#16a34a',
  pending:      '#2563eb',
  'off-season': '#ea580c',
  cancelled:    '#dc2626',
};
