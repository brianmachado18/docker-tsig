export const zonesMock = [
  {
    id: 'zone-001',
    name: 'Coastal Heritage District',
    description: 'High-traffic area with colonial architecture and gastronomy.',
    attractionLevel: 4,
    status: 'active',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-56.232, -34.904],
          [-56.198, -34.912],
          [-56.184, -34.946],
          [-56.219, -34.952],
          [-56.232, -34.904],
        ],
      ],
    },
    notes: 'Seasonal maintenance required in winter.',
  },
  {
    id: 'zone-002',
    name: 'Punta Ballena Circuit',
    description: 'Coastal route with scenic overlooks.',
    attractionLevel: 5,
    status: 'active',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-55.115, -34.912],
          [-55.081, -34.921],
          [-55.069, -34.958],
          [-55.104, -34.966],
          [-55.115, -34.912],
        ],
      ],
    },
    notes: 'Watch for congestion on holidays.',
  },
];
