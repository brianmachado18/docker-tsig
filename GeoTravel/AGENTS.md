# AGENTS.md - Guía de Agentes y Workflows

## 🤖 Agentes Disponibles

### 1. GeoTravel Frontend Builder (Agente Principal)
**Ubicación**: `.agent.md`
**Especialidad**: Construcción completa del frontend GeoTravel
**Invocación**: `@GeoTravel-Frontend-Builder`

**Responsable de**:
- ✅ Implementación de componentes React
- ✅ Integración de mapas OpenLayers
- ✅ State management con Zustand
- ✅ Servicios HTTP y GeoServer
- ✅ Validación de formularios
- ✅ Testing y optimización

**Cómo usar**:
```
@GeoTravel-Frontend-Builder
Necesito crear el componente ZoneForm con:
- Validación de campos
- Editor geométrico
- Guardar en backend

Usa los skills de formularios y mapas.
```

---

### 2. GeoTravel Localization Specialist
**Ubicación**: Nuevo agent para i18n
**Especialidad**: Multiidioma, extracción de strings, gestión de locales
**Invocación**: `@GeoTravel-Localization`

**Responsable de**:
- ✅ Identificar strings hardcodeadas
- ✅ Crear/actualizar JSON locales (en.json, es.json)
- ✅ Implementar LangStore con Zustand
- ✅ Reemplazar hardcoding en componentes con `t()`
- ✅ Auditoría de cobertura i18n
- ✅ Agregar nuevos idiomas

**Cómo usar**:
```
@GeoTravel-Localization
Extraer todos los strings de:
- GuestPortal.jsx
- ZoneForm.jsx
- RouteForm.jsx

Crea en.json, es.json, implementa LangStore y t() en componentes.
Verifica que no quede ni un string hardcodeado.
```

---

## 📚 Skill Mapping - Qué Skill Para Cada Tarea

### Crear/Editar Componentes UI
| Tarea | Skill | Ubicación |
|-------|-------|-----------|
| Button, Card, Modal | SKILL_REACT_COMPONENTS.md | src/components/ |
| FormField, validación | SKILL_FORMS_VALIDATION.md | src/components/ |
| Layout, grid, responsive | SKILL_REACT_COMPONENTS.md | src/components/ |
| Componentes con estado local | SKILL_REACT_COMPONENTS.md | src/components/ |

### Implementar Mapas
| Tarea | Skill | Ubicación |
|-------|-------|-----------|
| Mapa base OpenLayers | SKILL_OPENLAYERS_GEOSERVER.md | src/components/map/ |
| Capas WMS/WFS | SKILL_OPENLAYERS_GEOSERVER.md | src/services/ |
| Editor geométrico | SKILL_OPENLAYERS_GEOSERVER.md | src/components/map/ |
| Consultas espaciales | SKILL_OPENLAYERS_GEOSERVER.md | src/services/ |

### Servicios y APIs
| Tarea | Skill | Ubicación |
|-------|-------|-----------|
| Endpoints REST | SKILL_SERVICES_APIs.md | src/services/api.js |
| CRUD de entidades | SKILL_SERVICES_APIs.md | src/services/zones.js, routes.js, etc. |
| Reportes | SKILL_SERVICES_APIs.md | src/services/reports.js |
| Geocoding/búsqueda | SKILL_SERVICES_APIs.md | src/services/geoQueries.js |

### Gestión de Estado
| Tarea | Skill | Ubicación |
|-------|-------|-----------|
| Stores Zustand | SKILL_STATE_MANAGEMENT.md | src/store/zonesStore.js, etc. |
| Custom hooks | SKILL_STATE_MANAGEMENT.md | src/hooks/useZones.js, etc. |
| Sincronización | SKILL_STATE_MANAGEMENT.md | src/store/ |
| Persistencia | SKILL_STATE_MANAGEMENT.md | src/store/ |

### Validación y Formularios
| Tarea | Skill | Ubicación |
|-------|-------|-----------|
| Esquemas Yup | SKILL_FORMS_VALIDATION.md | src/utils/validators.js |
| Formularios complejos | SKILL_FORMS_VALIDATION.md | src/components/[entity]/ |
| Validación real-time | SKILL_FORMS_VALIDATION.md | src/components/ |
| Upload de archivos | SKILL_FORMS_VALIDATION.md | src/components/ |
### Autenticación
| Tarea | Skill | Ubicación |
|-------|-------|----------|
| AuthStore, login/logout | SKILL_AUTH_PATTERNS.md | src/store/authStore.js |
| ProtectedRoute wrapper | SKILL_AUTH_PATTERNS.md | src/components/auth/ProtectedRoute.jsx |
| Mock auth (desarrollo) | SKILL_AUTH_PATTERNS.md | src/components/auth/AdminLoginForm.jsx |
| Token management | SKILL_AUTH_PATTERNS.md | src/services/authService.js |

### Localización (i18n)
| Tarea | Skill | Ubicación |
|-------|-------|----------|
| JSON locales (en.json, es.json) | SKILL_UI_LOCALIZATION.md | src/locales/ |
| LangStore Zustand | SKILL_UI_LOCALIZATION.md | src/store/langStore.js |
| Función t() en componentes | SKILL_UI_LOCALIZATION.md | src/components/ |
| Language switcher UI | SKILL_UI_LOCALIZATION.md | src/components/common/ |
| Auditoría de strings hardcodeados | SKILL_UI_LOCALIZATION.md | src/ |

### Formularios CRUD con Estado
| Tarea | Skill | Ubicación |
|-------|-------|----------|
| Componentes Formulario (ZoneForm) | SKILL_CRUD_STATE_FORMS.md | src/components/zones/ZoneForm.jsx |
| Stores mock CRUD (Zustand) | SKILL_CRUD_STATE_FORMS.md | src/store/zonesStore.js, routesStore.js |
| Drag-drop nativo (reordenar) | SKILL_CRUD_STATE_FORMS.md | src/components/routes/RouteForm.jsx |
| Listas de items editables | SKILL_CRUD_STATE_FORMS.md | src/components/*/List.jsx |
| Sincronización local ↔ global | SKILL_CRUD_STATE_FORMS.md | src/components/ |
---

## 🔄 Workflows Coordinados

### Workflow 1: Crear Nuevo ABM (ej: Zonas)

```
1. DISEÑO (usa SKILL_REACT_COMPONENTS.md)
   └─ Crear ZoneList.jsx (listado)
   └─ Crear ZoneForm.jsx (formulario)
   └─ Crear ZoneDetail.jsx (detalles)

2. VALIDACIÓN (usa SKILL_FORMS_VALIDATION.md)
   └─ Definir zoneSchema en validators.js
   └─ Integrar en ZoneForm
   └─ Agregar FormField components

3. SERVICIOS (usa SKILL_SERVICES_APIs.md)
   └─ Definir zonesService con CRUD
   └─ Endpoints para validación de superposición
   └─ Endpoints para estadísticas

4. ESTADO (usa SKILL_STATE_MANAGEMENT.md)
   └─ Crear useZonesStore
   └─ Implementar acciones CRUD
   └─ Crear useZones hook

5. MAPA (usa SKILL_OPENLAYERS_GEOSERVER.md)
   └─ Crear ZoneLayer (visualización)
   └─ Crear ZonePolygonEditor (edición)
   └─ Integrar con formulario

6. INTEGRACIÓN
   └─ ZoneList → ZoneForm → zonesService → useZonesStore
   └─ ZoneForm → GeometryEditor → Map
   └─ Manejo de errores con Toast

7. TESTING
   └─ Tests para validators
   └─ Tests para servicios
   └─ Tests para componentes
```

### Workflow 2: Implementar Reportes

```
1. SERVICIO DE REPORTE (SKILL_SERVICES_APIs.md)
   └─ Definir endpoints en reportsService
   └─ Ejemplo: getRoutesByZoneReport()

2. COMPONENTE DE REPORTE (SKILL_REACT_COMPONENTS.md)
   └─ Crear ReportTable component
   └─ Crear ReportFilters component
   └─ Crear ReportPage wrapper

3. ESTADO (SKILL_STATE_MANAGEMENT.md)
   └─ Hook personalizado useReports
   └─ Manejo de loading y errores

4. VISUALIZACIÓN
   └─ Grid responsive
   └─ Ordenamiento
   └─ Exportación (opcional)
```

### Workflow 3: Integración Mapa + Formulario

```
1. SETUP MAPA (SKILL_OPENLAYERS_GEOSERVER.md)
   └─ useMap hook
   └─ Mapas con capas base

2. EDITOR GEOMÉTRICO (SKILL_OPENLAYERS_GEOSERVER.md)
   └─ Draw interaction
   └─ Capture de geometría

3. FORMULARIO (SKILL_FORMS_VALIDATION.md)
   └─ FormField para cada propiedad
   └─ Validación con Yup

4. INTEGRACIÓN
   └─ Botón "Dibujar en Mapa"
   └─ GeometryEditor → setFormValue
   └─ Validación de geometría

5. GUARDADO
   └─ Servicios (SKILL_SERVICES_APIs.md)
   └─ Estado (SKILL_STATE_MANAGEMENT.md)
   └─ Feedback visual (Toast)
```

### Workflow 4: Agregar Bilingüismo a Aplicación Existente

```
ℹ️ Usa: SKILL_UI_LOCALIZATION.md con @GeoTravel-Localization

1. AUDITORÍA (15 min)
   └─ Listar todos los strings hardcodeados
   └─ Agrupar por feature (guest, auth, zones, routes, attractions)

2. CREAR LOCALES (20 min)
   └─ Crear src/locales/en.json con estructura anidada
   └─ Crear src/locales/es.json (traducción)
   └─ Crear src/locales/index.js (export)

3. IMPLEMENTAR STORE (10 min)
   └─ Crear src/store/langStore.js con Zustand
   └─ Implementar t() con fallback a inglés
   └─ Persistencia en localStorage

4. REEMPLAZAR EN COMPONENTES (30 min)
   └─ Importar useLangStore en cada componente
   └─ Reemplazar strings con t('path.key')
   └─ Actualizar todos los componentes

5. LANGUAGE SWITCHER (10 min)
   └─ Crear LanguageSwitcher.jsx (EN/ES buttons)
   └─ Integrar en GuestPortal (header público)

6. VALIDACIÓN (10 min)
   └─ Testing manual EN y ES
   └─ Auditoría grep para confirmar sin hardcoding
   └─ Verificar localStorage persistence
```

### Workflow 5: Implementar Autenticación con ProtectedRoute

```
ℹ️ Usa: SKILL_AUTH_PATTERNS.md

1. STORE (15 min)
   └─ Crear src/store/authStore.js con Zustand
   └─ Acciones: login, logout, setToken
   └─ Persistencia: isAuthenticated + user (NO token)

2. PROTECTED ROUTE (10 min)
   └─ Crear src/components/auth/ProtectedRoute.jsx
   └─ Verifica isAuthenticated + role
   └─ Redirige a /login si no autenticado

3. LOGIN FORM (15 min)
   └─ Crear/actualizar AdminLoginForm.jsx
   └─ Mock login: admin/password (desarrollo)
   └─ Llamar a authStore.login()
   └─ Navegar a /zones en éxito

4. RUTAS APP (10 min)
   └─ Wrappear rutas admin en <ProtectedRoute>
   └─ Ruta default: /guest (público)
   └─ Ruta login: /login (sin protección)

5. LOGOUT (5 min)
   └─ Agregar logout button a Sidebar
   └─ Llamar authStore.logout()
   └─ Navegar a /guest

6. TRANSICIÓN A REAL (después)
   └─ Reemplazar mock login con authService.login()
   └─ Implementar refresh token
   └─ Validar en backend
```

### Workflow 6: Crear Formulario CRUD Funcional con Drag-Drop

```
ℹ️ Usa: SKILL_CRUD_STATE_FORMS.md

1. STORE MOCK (20 min)
   └─ Crear useZonesStore o useRoutesStore
   └─ Implementar CRUD: getItem, add, update, delete
   └─ Datos mock iniciales

2. COMPONENTE FORMULARIO (25 min)
   └─ Crear ZoneForm.jsx o RouteForm.jsx
   └─ useState para cada campo (copia local)
   └─ useEffect sincroniza cuando cambia prop
   └─ Handlers: onChange para cada field
   └─ Button "Save" → store.update()

3. LISTA PARA SELECCIONAR (15 min)
   └─ Crear ZoneList.jsx o RouteList.jsx
   └─ Mostrar items en sidebar/left
   └─ Click selecciona → abre formulario
   └─ Delete wired en formulario

4. DRAG-DROP (20 min, solo si aplicable)
   └─ HTML5 Drag & Drop API
   └─ dragStart (guarda ID)
   └─ dragOver (permite drop)
   └─ drop (reordena array)
   └─ Recalcular order numbers post-drop

5. FEEDBACK (10 min)
   └─ Mostrar "Guardado..." mientras isSaving
   └─ Mensaje de error si falla
   └─ Confirmación "Cambios guardados"

6. LOCALIZACION (5 min)
   └─ Todos los labels con t('domain.key')
   └─ Botones: t('common.save'), t('common.delete')
   └─ Mensajes: t('common.savedSuccessfully')
```

---

## 🎯 Flujo de Solicitudes Típicas

### Solicitud 1: "Crear componente X"
```
✅ Usa: SKILL_REACT_COMPONENTS.md
Pasos:
1. Lee estructura de componentes
2. Crea con variantes y estados
3. Integra con Tailwind design system
4. Incluye PropTypes y documentación
5. Proporciona tests básicos
```

### Solicitud 2: "Integrar Y con GeoServer"
```
✅ Usa: SKILL_OPENLAYERS_GEOSERVER.md + SKILL_SERVICES_APIs.md
Pasos:
1. Define capas WMS/WFS necesarias
2. Crea cliente GeoServer
3. Implementa en componente mapa
4. Sincroniza con estado
5. Maneja errores de conexión
```

### Solicitud 3: "Agregar formulario para Z"
```
✅ Usa: SKILL_FORMS_VALIDATION.md + SKILL_STATE_MANAGEMENT.md
Pasos:
1. Define schema Yup
2. Crea componentes FormField
3. Integra con servicios
4. Sincroniza con store
5. Manejo de loading/errores
```

### Solicitud 4: "Crear reporte/consulta"
```
✅ Usa: SKILL_SERVICES_APIs.md + SKILL_REACT_COMPONENTS.md
Pasos:
1. Implementa servicio de reporte
2. Crea componentes de visualización
3. Integra filtros/búsqueda
4. Agrega estado local si es necesario
5. Testing de datos
```

---

## 🔗 Referencias Cruzadas

### Componentes que Usan Mapas
```
→ Dentro de estas necesitarás SKILL_OPENLAYERS_GEOSERVER.md:
- ZoneForm (editor geométrico)
- RoutePlanner (visualización y edición)
- MapLegend (leyenda interactiva)
- AttractionCatalog (puntos en mapa)
```

### Componentes que Usan Formularios
```
→ Dentro de estas necesitarás SKILL_FORMS_VALIDATION.md:
- ZoneForm
- RouteForm
- AttractionForm
- Todos los modales de edición
```

### Componentes que Usan Estado Compartido
```
→ Dentro de estas necesitarás SKILL_STATE_MANAGEMENT.md:
- Cualquier component que use datos del backend
- Filtros y búsquedas
- Selecciones en mapa (zona, recorrido, etc.)
```

---

## 📋 Checklist de Implementación Completa

Para una feature completa (ej: ABM Zonas):

- [ ] **Componentes** (SKILL_REACT_COMPONENTS.md)
  - [ ] ZoneList
  - [ ] ZoneForm  
  - [ ] ZoneDetail
  - [ ] ZonePolygonEditor

- [ ] **Validación** (SKILL_FORMS_VALIDATION.md)
  - [ ] zoneSchema definido
  - [ ] Errores mostrados inline
  - [ ] Validación de superposición

- [ ] **Servicios** (SKILL_SERVICES_APIs.md)
  - [ ] zonesService.listZones()
  - [ ] zonesService.createZone()
  - [ ] zonesService.updateZone()
  - [ ] zonesService.deleteZone()
  - [ ] zonesService.checkOverlap()

- [ ] **Estado** (SKILL_STATE_MANAGEMENT.md)
  - [ ] useZonesStore definido
  - [ ] useZones hook creado
  - [ ] Actions CRUD implementadas

- [ ] **Mapas** (SKILL_OPENLAYERS_GEOSERVER.md)
  - [ ] ZoneLayer WMS/WFS
  - [ ] GeometryEditor integrado
  - [ ] Estilos por atractivo

- [ ] **Integración**
  - [ ] ZoneList → ZoneForm → Guardar
  - [ ] Formulario → Mapa ← Geometría
  - [ ] Estados y errores sincronizados

- [ ] **Testing**
  - [ ] Unit tests para servicios
  - [ ] Component tests para formularios
  - [ ] Integration tests para flujos

- [ ] **Documentación**
  - [ ] README del componente
  - [ ] Ejemplos de uso
  - [ ] JSDoc en funciones críticas

---

## 🚀 Inicio Rápido

Si es tu primer día con GeoTravel Frontend:

1. **Lee primero**:
   - `/frontend/.instructions.md` - Contexto general
   - `/frontend/.agent.md` - Cómo trabaja el agente
   - Este archivo (AGENTS.md)

2. **Antes de codificar**:
   - Identifica qué tipo de tarea es
   - Busca el skill correspondiente
   - Lee la sección relevante del skill

3. **Durante la implementación**:
   - Sigue los patrones del skill
   - Usa los ejemplos como referencia
   - Mantén consistencia con el design system

4. **Después de codificar**:
   - Revisa checklist de componente
   - Incluye tests básicos
   - Documenta patrones complejos

---

**Última actualización**: Mayo 2026
**Responsable**: Senior Frontend Architect
