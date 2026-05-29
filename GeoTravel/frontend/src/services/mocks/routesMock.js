export const routesMock = [
  {
    id: 'route-001',
    name: 'Coastal Heritage Trail',
    description: 'Historic lighthouses and coastal defenses along the east.',
    status: 'available',
    experienceType: 'cultural',
    durationHours: 4.5,
    guide: 'Maria Silva',
    seasonStart: 'March',
    seasonEnd: 'December',
    stops: [
      { id: 'stop-001', name: 'Punta del Este Lighthouse', order: 1 },
      { id: 'stop-002', name: 'Casapueblo Museum', order: 2 },
    ],
    geometry: {
      type: 'LineString',
      coordinates: [
        [-55.155, -34.962],
        [-55.116, -34.908],
      ],
    },
  },
  {
    id: 'route-002',
    name: 'Old Town Gastronomy Loop',
    description: 'A curated tasting route through historic restaurants.',
    status: 'pending',
    experienceType: 'gastronomic',
    durationHours: 3,
    guide: 'Carlos Ruiz',
    seasonStart: 'November',
    seasonEnd: 'February',
    stops: [
      { id: 'stop-003', name: 'Mercado del Puerto', order: 1 },
      { id: 'stop-004', name: 'Historic Cafe', order: 2 },
    ],
    geometry: {
      type: 'LineString',
      coordinates: [
        [-56.207, -34.906],
        [-56.186, -34.909],
      ],
    },
  },
];
