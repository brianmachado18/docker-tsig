# SKILL_UI_LOCALIZATION.md - Multiidioma en React SPA

## Problema Resuelto
Soportar múltiples idiomas (EN/ES) sin hardcoding, con selección de idioma persistente y fallbacks, sin crear nuevos componentes.

---

## Patrón: JSON Locales + Zustand Store

### 1. Estructura de Archivos

```
frontend/
├── src/
│   ├── locales/
│   │   ├── en.json          # Strings en inglés
│   │   ├── es.json          # Strings en español
│   │   └── index.js         # Export de ambos
│   ├── store/
│   │   └── langStore.js     # Zustand language store
│   └── components/
│       └── [componentes usan t()]
```

---

### 2. JSON Locales Structure

**Archivo**: `src/locales/en.json`

```json
{
  "common": {
    "logout": "Logout",
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "zones": "Zones",
    "routes": "Routes",
    "attractions": "Attractions"
  },
  "guest": {
    "title": "Explore Uruguay",
    "subtitle": "Discover zones and attractions",
    "filterByZone": "Filter by Zone",
    "filterByExperience": "Filter by Experience",
    "adminLogin": "Admin Login",
    "featuredDestinations": "Featured Destinations"
  },
  "auth": {
    "adminLogin": "Admin Login",
    "username": "Username",
    "password": "Password",
    "login": "Login",
    "loginFailed": "Login failed. Please try again.",
    "invalidCredentials": "Invalid username or password"
  },
  "zones": {
    "title": "Zone Management",
    "details": "Zone Details",
    "name": "Zone Name",
    "description": "Description",
    "attractionLevel": "Attraction Level",
    "observations": "Internal Observations",
    "save": "Save Zone",
    "delete": "Delete Zone"
  },
  "routes": {
    "title": "Route Planning",
    "details": "Route Details",
    "name": "Route Name",
    "description": "Description",
    "duration": "Duration (hours)",
    "guide": "Assigned Guide",
    "status": "Status",
    "stops": "Tour Stops",
    "addStop": "Add Stop",
    "removeStop": "Remove Stop",
    "stopOrder": "Order",
    "noStops": "No stops added yet"
  },
  "attractions": {
    "title": "Attraction Catalog",
    "details": "Attraction Details",
    "name": "Attraction Name",
    "description": "Description",
    "zone": "Zone",
    "status": "Status",
    "offSeason": "Off Season",
    "active": "Active",
    "edit": "Edit Attraction"
  }
}
```

**Archivo**: `src/locales/es.json`

```json
{
  "common": {
    "logout": "Cerrar Sesión",
    "loading": "Cargando...",
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "zones": "Zonas",
    "routes": "Recorridos",
    "attractions": "Atracciones"
  },
  "guest": {
    "title": "Explora Uruguay",
    "subtitle": "Descubre zonas y atracciones",
    "filterByZone": "Filtrar por Zona",
    "filterByExperience": "Filtrar por Experiencia",
    "adminLogin": "Acceso Administrador",
    "featuredDestinations": "Destinos Destacados"
  },
  "auth": {
    "adminLogin": "Acceso Administrador",
    "username": "Usuario",
    "password": "Contraseña",
    "login": "Ingresar",
    "loginFailed": "Error de acceso. Intenta nuevamente.",
    "invalidCredentials": "Usuario o contraseña inválidos"
  },
  "zones": {
    "title": "Gestión de Zonas",
    "details": "Detalles de Zona",
    "name": "Nombre de Zona",
    "description": "Descripción",
    "attractionLevel": "Nivel de Atracción",
    "observations": "Observaciones Internas",
    "save": "Guardar Zona",
    "delete": "Eliminar Zona"
  },
  "routes": {
    "title": "Planificador de Recorridos",
    "details": "Detalles de Recorrido",
    "name": "Nombre del Recorrido",
    "description": "Descripción",
    "duration": "Duración (horas)",
    "guide": "Guía Asignado",
    "status": "Estado",
    "stops": "Paradas del Recorrido",
    "addStop": "Agregar Parada",
    "removeStop": "Quitar Parada",
    "stopOrder": "Orden",
    "noStops": "Sin paradas agregadas aún"
  },
  "attractions": {
    "title": "Catálogo de Atracciones",
    "details": "Detalles de Atracción",
    "name": "Nombre de Atracción",
    "description": "Descripción",
    "zone": "Zona",
    "status": "Estado",
    "offSeason": "Fuera de Temporada",
    "active": "Activo",
    "edit": "Editar Atracción"
  }
}
```

**Archivo**: `src/locales/index.js`

```javascript
import en from './en.json';
import es from './es.json';

export const translations = {
  en,
  es
};

export default translations;
```

---

### 3. Zustand Language Store

**Archivo**: `src/store/langStore.js`

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations } from '../locales';

const useLangStore = create(
  persist(
    (set, get) => ({
      lang: 'en', // 'en' o 'es'
      
      setLang: (newLang) => {
        if (['en', 'es'].includes(newLang)) {
          set({ lang: newLang });
        }
      },
      
      // Función principal de traducción
      t: (path) => {
        const { lang } = get();
        const keys = path.split('.');
        let value = translations[lang];
        
        // Navegar por la estructura anidada
        for (const key of keys) {
          value = value?.[key];
          if (!value) break;
        }
        
        // Fallback a inglés si no existe la clave
        if (!value) {
          value = translations['en'];
          for (const key of keys) {
            value = value?.[key];
            if (!value) break;
          }
        }
        
        // Si aún no existe, retornar la ruta (para debugging)
        return value || path;
      },
      
      // Utilidad: cambiar y retornar traducción
      switchLang: (newLang, fallbackKey) => {
        set({ lang: newLang });
        const { t } = get();
        return t(fallbackKey); // Ej: para actualizar UI inmediatamente
      }
    }),
    {
      name: 'geotravel-lang', // localStorage key
      partialize: (state) => ({
        lang: state.lang // Persisten solo el idioma
      })
    }
  )
);

export default useLangStore;
```

---

### 4. Uso en Componentes

**Patrón Básico**:

```javascript
import useLangStore from '../../store/langStore';

export default function MyComponent() {
  const { t } = useLangStore();
  
  return (
    <div>
      <h1>{t('zones.title')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

**Ejemplo Completo**: `src/components/zones/ZoneForm.jsx`

```javascript
import { useState, useEffect } from 'react';
import useLangStore from '../../store/langStore';

export default function ZoneForm({ zone, onSave }) {
  const { t } = useLangStore();
  const [zoneName, setZoneName] = useState(zone?.name || '');
  const [description, setDescription] = useState(zone?.description || '');
  const [level, setLevel] = useState(zone?.level || 1);
  
  useEffect(() => {
    if (zone) {
      setZoneName(zone.name);
      setDescription(zone.description);
      setLevel(zone.level);
    }
  }, [zone]);
  
  return (
    <form>
      <div>
        <label>{t('zones.name')}</label>
        <input value={zoneName} onChange={(e) => setZoneName(e.target.value)} />
      </div>
      
      <div>
        <label>{t('zones.description')}</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      
      <div>
        <label>{t('zones.attractionLevel')}</label>
        {[1, 2, 3, 4, 5].map(n => (
          <label key={n}>
            <input
              type="radio"
              value={n}
              checked={level === n}
              onChange={(e) => setLevel(Number(e.target.value))}
            />
            {n}
          </label>
        ))}
      </div>
      
      <button type="submit">{t('zones.save')}</button>
    </form>
  );
}
```

---

### 5. Language Switcher UI

**Archivo**: `src/components/common/LanguageSwitcher.jsx`

```javascript
import useLangStore from '../../store/langStore';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLangStore();
  
  return (
    <div className="flex gap-2">
      <button
        onClick={() => setLang('en')}
        className={lang === 'en' ? 'font-bold' : 'opacity-60'}
      >
        EN
      </button>
      <button
        onClick={() => setLang('es')}
        className={lang === 'es' ? 'font-bold' : 'opacity-60'}
      >
        ES
      </button>
    </div>
  );
}
```

**En GuestPortal.jsx**:

```javascript
import LanguageSwitcher from './LanguageSwitcher';

export default function GuestPortal() {
  const { t } = useLangStore();
  
  return (
    <div>
      <header className="flex justify-between items-center">
        <h1>{t('guest.title')}</h1>
        <LanguageSwitcher />
      </header>
      {/* resto del contenido */}
    </div>
  );
}
```

---

## Checklist: Implementación Completa

- [ ] `src/locales/en.json` con todas las strings
- [ ] `src/locales/es.json` con traducciones
- [ ] `src/locales/index.js` exporta ambos
- [ ] `src/store/langStore.js` con Zustand + persistencia
- [ ] Todos los componentes usan `const { t } = useLangStore()`
- [ ] No hay strings hardcodeadas (grep -r "sin-traducir")
- [ ] Language switcher en vistas públicas
- [ ] Fallback a inglés si falta clave en español
- [ ] Testing: verificar ambos idiomas funcionan

---

## Auditoría: Encontrar Strings No Localizadas

```bash
# Buscar strings que NO usan t()
grep -r "\"[A-Z]" src/components/ --include="*.jsx" | grep -v "t("
grep -r "'[A-Z]" src/components/ --include="*.jsx" | grep -v "t("

# Encontrar claves faltantes en es.json
# Si algo está en en.json pero no en es.json
```

---

## Transición: Agregar Idioma Nuevo (FR)

1. Crear `src/locales/fr.json` con mismo structure de en.json
2. En `src/locales/index.js`, agregar: `import fr from './fr.json'`
3. En translations object: `fr`
4. En `langStore.js`, validar `['en', 'es', 'fr']`
5. Agregar botón "FR" a LanguageSwitcher

**Una sola línea por idioma, sin refactorear nada más.**

---

## Performance Tips

- ✅ Store es ligero (solo `lang` + `t()`)
- ✅ JSON se cachea al importar (una sola vez)
- ✅ localStorage actualiza solo en cambio de idioma
- ✅ Fallback es rápido (búsqueda O(n) en objeto)
- ⚠️ Evitar: traduciones en loops sin memoización

```javascript
// ❌ Mal (re-ejecuta t() en cada render)
{items.map(item => <p key={item.id}>{t('common.item')}</p>)}

// ✅ Bien (cache en variable)
const itemLabel = t('common.item');
{items.map(item => <p key={item.id}>{itemLabel}</p>)}
```

