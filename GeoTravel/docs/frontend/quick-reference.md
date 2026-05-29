# Quick Reference - Snippets Rápidos de Codificación

Esta guía contiene snippets listos para adaptar a tus necesidades.

---

## 🎨 Componentes Base

### Button Rápido
```jsx
// src/components/common/Button.jsx
export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-primary-container',
    secondary: 'bg-secondary text-on-secondary hover:bg-secondary-container',
    tertiary: 'bg-tertiary text-on-tertiary hover:bg-tertiary-container',
    outline: 'border border-outline text-on-surface hover:bg-surface-container',
  };

  const sizes = {
    sm: 'px-3 py-2 text-label-md',
    md: 'px-4 py-2 text-body-md',
    lg: 'px-6 py-3 text-body-lg',
  };

  return (
    <button
      className={`
        rounded-xl font-600 transition-colors
        ${variants[variant]}
        ${sizes[size]}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Card Reutilizable
```jsx
export const Card = ({ children, className = '', ...props }) => (
  <div
    className={`
      bg-surface rounded-xl p-container-padding
      shadow-sm border border-outline-variant
      ${className}
    `}
    {...props}
  >
    {children}
  </div>
);
```

### Modal Template
```jsx
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-headline-lg">{title}</h2>
          <button onClick={onClose} className="text-2xl">×</button>
        </div>
        {children}
      </Card>
    </div>
  );
};
```

---

## 🗺️ Mapas Rápidos

### Mapa Base Mínimo
```jsx
// src/components/map/Map.jsx
import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';

export const MapContainer = ({ center = [-56, -33], zoom = 10 }) => {
  const mapElement = useRef(null);

  useEffect(() => {
    if (!mapElement.current) return;

    const map = new Map({
      target: mapElement.current,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({
        center: fromLonLat(center),
        zoom,
      }),
    });

    return () => map.dispose();
  }, [center, zoom]);

  return <div ref={mapElement} style={{ width: '100%', height: '100%' }} />;
};
```

### Agregar Capa WMS
```jsx
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';

const addWMSLayer = (map, layerName) => {
  const wmsLayer = new ImageLayer({
    source: new ImageWMS({
      url: 'http://localhost:8080/geoserver/wms',
      params: { LAYERS: `GeoTravel:${layerName}` },
      serverType: 'geoserver',
    }),
  });
  map.addLayer(wmsLayer);
  return wmsLayer;
};
```

---

## 🛢️ Servicios Rápidos

### Servicio Base
```javascript
// src/services/zones.js
import { apiClient } from './api';

export const zonesService = {
  list: () => apiClient.get('/zones'),
  get: (id) => apiClient.get(`/zones/${id}`),
  create: (data) => apiClient.post('/zones', data),
  update: (id, data) => apiClient.put(`/zones/${id}`, data),
  delete: (id) => apiClient.delete(`/zones/${id}`),
};
```

### Hook para Usar Servicio
```javascript
// src/hooks/useZones.js
import { useEffect, useState } from 'react';
import { zonesService } from '../services/zones';

export const useZones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    zonesService.list()
      .then(res => setZones(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { zones, loading, error };
};
```

---

## 🏪 State Management Rápido

### Store Zustand Mínimo
```javascript
// src/store/zonesStore.js
import { create } from 'zustand';

export const useZonesStore = create((set) => ({
  zones: [],
  loading: false,
  
  setZones: (zones) => set({ zones }),
  setLoading: (loading) => set({ loading }),
  
  fetchZones: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/zones');
      const data = await res.json();
      set({ zones: data, loading: false });
    } catch (error) {
      console.error(error);
      set({ loading: false });
    }
  },
}));
```

### Usar Store en Componente
```jsx
const MyComponent = () => {
  const { zones, loading, fetchZones } = useZonesStore();

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  return loading ? <div>Cargando...</div> : <div>{zones.length} zonas</div>;
};
```

---

## ✅ Validación Rápida

### Esquema Yup Mínimo
```javascript
// src/utils/validators.js
import * as yup from 'yup';

export const zoneSchema = yup.object({
  name: yup.string().required('Requerido').min(3),
  description: yup.string().required('Requerido').min(10),
  level: yup.number().min(1).max(5),
});
```

### Usar con Formik
```jsx
import { useFormik } from 'formik';

const MyForm = () => {
  const formik = useFormik({
    initialValues: { name: '', description: '', level: 3 },
    validationSchema: zoneSchema,
    onSubmit: (values) => console.log(values),
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <input
        name="name"
        value={formik.values.name}
        onChange={formik.handleChange}
      />
      {formik.errors.name && <span>{formik.errors.name}</span>}
      <button type="submit">Guardar</button>
    </form>
  );
};
```

---

## 📊 Grid Responsive
```jsx
{/* 1 columna mobile, 2 tablet, 4 desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>
```

## 🎯 Estados de Recorrido Color
```javascript
const statusColors = {
  available: 'status-available', // #2f855a
  pending: 'status-pending',     // #ed8936
  'off-season': 'status-off-season', // #718096
  cancelled: 'status-cancelled', // #e53e3e
};

<span className={`bg-${statusColors[status]} text-white px-3 py-1 rounded-full`}>
  {status}
</span>
```

---

## 🔄 Patrón: Listar y Editar

```jsx
export const ZoneList = () => {
  const { zones } = useZones();
  const [editingId, setEditingId] = useState(null);

  return (
    <div className="space-y-4">
      {zones.map(zone => (
        <Card key={zone.id}>
          <h3>{zone.name}</h3>
          <Button onClick={() => setEditingId(zone.id)}>Editar</Button>
          
          {editingId === zone.id && (
            <ZoneForm 
              zone={zone}
              onSave={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          )}
        </Card>
      ))}
    </div>
  );
};
```

---

## 🧪 Testing Rápido

### Test de Componente
```javascript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Test de Hook
```javascript
import { renderHook, act } from '@testing-library/react';
import { useZones } from './useZones';

test('fetches zones', async () => {
  const { result } = renderHook(() => useZones());
  
  await act(async () => {
    // esperar
  });

  expect(result.current.zones).toBeDefined();
});
```

---

## 🛣️ Rutas Básicas (React Router)

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import ZoneManagement from './pages/ZoneManagement';
import AttractionCatalog from './pages/AttractionCatalog';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/zones" element={<ZoneManagement />} />
        <Route path="/attractions" element={<AttractionCatalog />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🔌 Integración API Base

```javascript
// src/services/api.js
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Agregar token a cada solicitud
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejo de errores global
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 🎛️ Environment Variables

```bash
# .env
VITE_API_URL=http://localhost:8080/api
VITE_GEOSERVER_URL=http://localhost:8081/geoserver
VITE_GEOSERVER_WORKSPACE=geotravel
```

---

## 📦 Install Dependencies

```bash
npm install react@18 react-dom@18 vite@4
npm install tailwindcss@3 ol@8 zustand@4 axios@1
npm install formik@2 yup@1
npm install react-router-dom@6
npm install date-fns@2

# Dev dependencies
npm install -D vitest @testing-library/react
npm install -D autoprefixer postcss
npm install -D eslint prettier
```

---

## 🚀 Scripts Típicos

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

---

Última actualización: Mayo 2026
