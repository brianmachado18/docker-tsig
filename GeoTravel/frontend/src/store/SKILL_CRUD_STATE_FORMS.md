# SKILL_CRUD_STATE_FORMS.md - Componentes CRUD con Estado y Drag-Drop

## Problema Resuelto
Implementar formularios funcionales con estado local, almacenamiento mock en stores, y UI interactivo (drag-drop, listas editables) sin repetir patrones.

---

## Patrón: Local State (useState) + Store (Zustand) + HTML5 Drag-Drop

### 1. Ciclo de Vida Típico

```
Usuario abre formulario
    ↓
Componente recibe prop (ej: zone)
    ↓
useEffect copia valores a estado local (useState)
    ↓
Usuario edita campos (setField)
    ↓
Usuario hace click "Guardar"
    ↓
Validación (opcional)
    ↓
Guardar en store global (store.updateZone)
    ↓
Confirmar al usuario (toast/modal)
```

---

### 2. Store Mock (Zustand)

**Archivo**: `src/store/zonesStore.js`

```javascript
import { create } from 'zustand';

const useZonesStore = create((set, get) => ({
  zones: [
    {
      id: 1,
      name: 'Zona Centro',
      description: 'Centro histórico',
      level: 3,
      observations: 'Buena infraestructura'
    },
    {
      id: 2,
      name: 'Zona Este',
      description: 'Este rural',
      level: 2,
      observations: 'Caminos sin asfaltar'
    }
  ],
  
  // CRUD Actions
  getZone: (id) => {
    const { zones } = get();
    return zones.find(z => z.id === id);
  },
  
  updateZone: (id, updates) => {
    set((state) => ({
      zones: state.zones.map(z =>
        z.id === id ? { ...z, ...updates } : z
      )
    }));
  },
  
  deleteZone: (id) => {
    set((state) => ({
      zones: state.zones.filter(z => z.id !== id)
    }));
  },
  
  addZone: (newZone) => {
    set((state) => ({
      zones: [...state.zones, { id: Date.now(), ...newZone }]
    }));
  }
}));

export default useZonesStore;
```

**Archivo**: `src/store/routesStore.js`

```javascript
import { create } from 'zustand';

const useRoutesStore = create((set, get) => ({
  routes: [
    {
      id: 1,
      name: 'Recorrido A',
      description: 'Sur de Uruguay',
      duration: 4,
      guide: 'Carlos',
      status: 'active',
      stops: [
        { id: 's1', name: 'Zona Centro', order: 1 },
        { id: 's2', name: 'Playa Negra', order: 2 },
        { id: 's3', name: 'Faro', order: 3 }
      ]
    }
  ],
  
  getRoute: (id) => {
    const { routes } = get();
    return routes.find(r => r.id === id);
  },
  
  updateRoute: (id, updates) => {
    set((state) => ({
      routes: state.routes.map(r =>
        r.id === id ? { ...r, ...updates } : r
      )
    }));
  },
  
  updateStops: (routeId, stops) => {
    set((state) => ({
      routes: state.routes.map(r =>
        r.id === routeId ? { ...r, stops } : r
      )
    }));
  },
  
  deleteRoute: (id) => {
    set((state) => ({
      routes: state.routes.filter(r => r.id !== id)
    }));
  },
  
  addRoute: (newRoute) => {
    set((state) => ({
      routes: [...state.routes, { id: Date.now(), ...newRoute }]
    }));
  }
}));

export default useRoutesStore;
```

---

### 3. Componente Formulario: ZoneForm

**Archivo**: `src/components/zones/ZoneForm.jsx`

```javascript
import { useState, useEffect } from 'react';
import useLangStore from '../../store/langStore';
import useZonesStore from '../../store/zonesStore';

export default function ZoneForm({ zone, onSaveComplete }) {
  const { t } = useLangStore();
  const { updateZone } = useZonesStore();
  
  // Estado local: copia del prop
  const [zoneName, setZoneName] = useState(zone?.name || '');
  const [description, setDescription] = useState(zone?.description || '');
  const [attractionLevel, setAttractionLevel] = useState(zone?.level || 1);
  const [observations, setObservations] = useState(zone?.observations || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Sincronizar cuando cambia zone prop
  useEffect(() => {
    if (zone) {
      setZoneName(zone.name);
      setDescription(zone.description);
      setAttractionLevel(zone.level);
      setObservations(zone.observations);
    }
  }, [zone?.id]); // Depend en zone.id, no zone (evitar loops)
  
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Simular delay de guardado
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Validaciones básicas
      if (!zoneName.trim()) {
        alert(t('zones.nameRequired'));
        setIsSaving(false);
        return;
      }
      
      // Guardar en store
      updateZone(zone.id, {
        name: zoneName,
        description,
        level: attractionLevel,
        observations
      });
      
      // Callback para componente padre
      if (onSaveComplete) {
        onSaveComplete(zone.id);
      }
      
      // Feedback al usuario
      console.log('✓ Zona guardada');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert(t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <form onSubmit={handleSave} className="border p-4 rounded-lg">
      <h2>{t('zones.details')}</h2>
      
      {/* Nombre */}
      <div className="mb-4">
        <label className="block font-semibold">{t('zones.name')}</label>
        <input
          type="text"
          value={zoneName}
          onChange={(e) => setZoneName(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      
      {/* Descripción */}
      <div className="mb-4">
        <label className="block font-semibold">{t('zones.description')}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2"
          rows="3"
        />
      </div>
      
      {/* Attraction Level (Radio Buttons) */}
      <div className="mb-4">
        <label className="block font-semibold">{t('zones.attractionLevel')}</label>
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map(level => (
            <label key={level} className="flex items-center gap-2">
              <input
                type="radio"
                value={level}
                checked={attractionLevel === level}
                onChange={(e) => setAttractionLevel(Number(e.target.value))}
              />
              {level}
            </label>
          ))}
        </div>
      </div>
      
      {/* Observaciones */}
      <div className="mb-4">
        <label className="block font-semibold">{t('zones.observations')}</label>
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          className="w-full border p-2"
          rows="2"
        />
      </div>
      
      {/* Botones */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {isSaving ? t('common.loading') : t('zones.save')}
        </button>
        <button
          type="button"
          className="px-4 py-2 border rounded"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
```

---

### 4. Componente Drag-Drop: RouteForm

**Archivo**: `src/components/routes/RouteForm.jsx`

```javascript
import { useState, useEffect } from 'react';
import useLangStore from '../../store/langStore';
import useRoutesStore from '../../store/routesStore';

export default function RouteForm({ route, onSaveComplete }) {
  const { t } = useLangStore();
  const { updateRoute, updateStops } = useRoutesStore();
  
  // Estado local
  const [routeName, setRouteName] = useState(route?.name || '');
  const [description, setDescription] = useState(route?.description || '');
  const [duration, setDuration] = useState(route?.duration || '');
  const [guide, setGuide] = useState(route?.guide || '');
  const [status, setStatus] = useState(route?.status || 'active');
  const [stops, setStops] = useState(route?.stops || []);
  const [draggedId, setDraggedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (route) {
      setRouteName(route.name);
      setDescription(route.description);
      setDuration(route.duration);
      setGuide(route.guide);
      setStatus(route.status);
      setStops(route.stops || []);
    }
  }, [route?.id]);
  
  // Drag-Drop Handlers
  const handleDragStart = (stopId) => {
    setDraggedId(stopId);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleDrop = (targetId) => {
    if (draggedId === targetId) return;
    
    const draggedIndex = stops.findIndex(s => s.id === draggedId);
    const targetIndex = stops.findIndex(s => s.id === targetId);
    
    // Crear copia y reordenar
    const updated = [...stops];
    const [draggedStop] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedStop);
    
    // Recalcular números de orden
    const reordered = updated.map((stop, idx) => ({
      ...stop,
      order: idx + 1
    }));
    
    setStops(reordered);
    setDraggedId(null);
  };
  
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Guardar ruta
      updateRoute(route.id, {
        name: routeName,
        description,
        duration: Number(duration),
        guide,
        status
      });
      
      // Guardar paradas
      updateStops(route.id, stops);
      
      if (onSaveComplete) {
        onSaveComplete(route.id);
      }
      
      console.log('✓ Recorrido guardado');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <form onSubmit={handleSave} className="border p-4 rounded-lg">
      <h2>{t('routes.details')}</h2>
      
      {/* Nombre */}
      <div className="mb-4">
        <label className="block font-semibold">{t('routes.name')}</label>
        <input
          type="text"
          value={routeName}
          onChange={(e) => setRouteName(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      
      {/* Descripción */}
      <div className="mb-4">
        <label className="block font-semibold">{t('routes.description')}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2"
          rows="3"
        />
      </div>
      
      {/* Duración y Guía (Grid) */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block font-semibold">{t('routes.duration')}</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full border p-2"
          />
        </div>
        <div>
          <label className="block font-semibold">{t('routes.guide')}</label>
          <input
            type="text"
            value={guide}
            onChange={(e) => setGuide(e.target.value)}
            className="w-full border p-2"
          />
        </div>
      </div>
      
      {/* Estado */}
      <div className="mb-4">
        <label className="block font-semibold">{t('routes.status')}</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border p-2"
        >
          <option value="active">{t('routes.statusActive')}</option>
          <option value="planning">{t('routes.statusPlanning')}</option>
          <option value="archived">{t('routes.statusArchived')}</option>
        </select>
      </div>
      
      {/* Paradas con Drag-Drop */}
      <div className="mb-4">
        <label className="block font-semibold mb-2">{t('routes.stops')}</label>
        {stops.length === 0 ? (
          <p className="text-gray-500">{t('routes.noStops')}</p>
        ) : (
          <ul className="border rounded">
            {stops.map(stop => (
              <li
                key={stop.id}
                draggable
                onDragStart={() => handleDragStart(stop.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stop.id)}
                className="p-3 border-b bg-gray-50 cursor-move hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="font-semibold text-gray-600 w-6">{stop.order}</span>
                <span className="material-symbols-outlined text-gray-400">drag_indicator</span>
                <span>{stop.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Guardar */}
      <button
        type="submit"
        disabled={isSaving}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {isSaving ? t('common.loading') : t('routes.save')}
      </button>
    </form>
  );
}
```

---

### 5. Componente Lista (CRUD Read)

**Archivo**: `src/components/zones/ZoneList.jsx`

```javascript
import { useState } from 'react';
import useZonesStore from '../../store/zonesStore';
import useLangStore from '../../store/langStore';
import ZoneForm from './ZoneForm';

export default function ZoneList() {
  const { t } = useLangStore();
  const { zones, deleteZone } = useZonesStore();
  const [selectedZone, setSelectedZone] = useState(null);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Lista */}
      <div>
        <h2>{t('zones.title')}</h2>
        <ul className="space-y-2">
          {zones.map(zone => (
            <li
              key={zone.id}
              onClick={() => setSelectedZone(zone)}
              className={`p-2 border rounded cursor-pointer ${
                selectedZone?.id === zone.id ? 'bg-blue-100' : ''
              }`}
            >
              {zone.name} <span className="text-xs text-gray-500">Lvl {zone.level}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Formulario (ocupa 2 columnas) */}
      <div className="col-span-2">
        {selectedZone ? (
          <div>
            <ZoneForm
              zone={selectedZone}
              onSaveComplete={() => console.log('Guardado')}
            />
            <button
              onClick={() => {
                deleteZone(selectedZone.id);
                setSelectedZone(null);
              }}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
            >
              {t('common.delete')}
            </button>
          </div>
        ) : (
          <p className="text-gray-500">{t('common.selectItem')}</p>
        )}
      </div>
    </div>
  );
}
```

---

## Checklist: Implementación CRUD Completa

- [ ] Store Zustand con acciones CRUD (get, add, update, delete)
- [ ] Componente Formulario con useState (copia de prop)
- [ ] useEffect sincroniza con prop al montar/cambiar ID
- [ ] Handlers (onChange) actualizan estado local
- [ ] Button "Save" llama a store.update()
- [ ] Drag-drop HTML5 con dragStart/dragOver/drop
- [ ] Recalcular order numbers post-drop
- [ ] Componente Lista muestra items y permite seleccionar
- [ ] Delete wired correctamente
- [ ] Todas las labels usan `t()`

---

## Patrones Comunes

### ✅ Validar Antes de Guardar

```javascript
const handleSave = async (e) => {
  e.preventDefault();
  
  // Validaciones
  if (!name.trim()) {
    setError(t('validation.nameRequired'));
    return;
  }
  
  if (duration < 1) {
    setError(t('validation.durationMin'));
    return;
  }
  
  // Proceed...
  updateRoute(route.id, { name, duration });
};
```

### ✅ Mostrar Error/Éxito

```javascript
const [message, setMessage] = useState('');

const handleSave = async (e) => {
  try {
    updateZone(zone.id, data);
    setMessage(t('common.savedSuccessfully'));
    setTimeout(() => setMessage(''), 3000);
  } catch (error) {
    setMessage(t('common.errorSaving'));
  }
};

return (
  <>
    {message && (
      <div className={message.includes('Error') ? 'text-red-600' : 'text-green-600'}>
        {message}
      </div>
    )}
    {/* Form */}
  </>
);
```

### ✅ Discard Changes

```javascript
const [hasChanges, setHasChanges] = useState(false);

const handleChange = (field, value) => {
  setHasChanges(true);
  setFieldValue(value);
};

const handleCancel = () => {
  if (hasChanges && !window.confirm(t('common.discardChanges'))) {
    return;
  }
  // Reset to original
  syncFromProp();
};
```

### ✅ Optimistic Updates (Avanzado)

```javascript
const handleSave = async (e) => {
  e.preventDefault();
  
  // Actualizar UI inmediatamente
  setOptimisticZone({ ...zone, name: zoneName });
  
  try {
    // Enviar al backend (o al store en mock)
    await updateZone(zone.id, { name: zoneName });
  } catch (error) {
    // Revertir si falló
    setOptimisticZone(zone);
  }
};
```

---

## Debugging: "¿Por Qué No Se Actualiza?"

| Síntoma | Causa Probable | Solución |
|---------|----------------|----------|
| Formulario vacío | useEffect depend de `zone` en vez de `zone.id` | Cambiar: `useEffect(..., [zone?.id])` |
| No guarda | handleSave no llama a store.update() | Agregar: `updateZone(id, data)` |
| Drag-drop no reordena | Drop handler no recalcula order | Verificar: `updated.map((s, idx) => ({...s, order: idx+1}))` |
| Lista no refresca | Componente Lista no re-render | Zustand debe update state correctamente |
| Cambios se pierden | useState no sincroniza con prop | Verificar useEffect cuando `zone` cambia |

