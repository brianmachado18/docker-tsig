# 📚 Índice de Documentación y Skills - GeoTravel Frontend

## 📌 Estructura General

```
GeoTravel/
├── AGENTS.md                          # Guía de agentes y workflows
├── QUICK_REFERENCE.md                 # Snippets rápidos de código
├── README.md                          # (existente)
├── docker-compose.yml                 # (existente)
├── backend/                           # (existente)
├── postgres/                          # (existente)
└── frontend/
    ├── .instructions.md               # ⭐ INSTRUCCIONES PRINCIPALES
    ├── .agent.md                      # ⭐ AGENTE ESPECIALIZADO
    ├── .prompt.md                     # ⭐ PROMPT PERSONALIZADO
    ├── Dockerfile                     # (existente)
    ├── package.json                   # (existente)
    ├── index.html                     # (existente)
    ├── nginx.conf                     # (existente)
    └── src/
        ├── App.jsx                    # (existente)
        ├── styles.css                 # (existente)
        ├── components/
        │   └── SKILL_REACT_COMPONENTS.md    # 🔧 SKILL: Componentes React
        │   └── SKILL_FORMS_VALIDATION.md    # 🔧 SKILL: Formularios
        ├── services/
        │   └── SKILL_OPENLAYERS_GEOSERVER.md  # 🔧 SKILL: Mapas
        │   └── SKILL_SERVICES_APIs.md         # 🔧 SKILL: Servicios HTTP
        ├── store/
        │   └── SKILL_STATE_MANAGEMENT.md      # 🔧 SKILL: Estado
        └── stitch/                    # (diseños HTML existentes)
```

---

## 🎯 Documentación Principal

### 1. **[.instructions.md](./frontend/.instructions.md)** ⭐ LEER PRIMERO
**Descripción**: Contexto completo del proyecto, arquitectura, stack tecnológico y convenciones.

**Contiene**:
- 📋 Stack tecnológico (React, Vite, OpenLayers, PostGIS)
- 🗂️ Estructura de carpetas recomendada
- 🎨 Design System (colores, tipografía, espaciado)
- 🗺️ Integración OpenLayers + GeoServer
- 🔄 Flujos de datos (ABM, recorridos, consultas)
- 📦 Dependencias recomendadas

**Cuándo leerlo**: Antes de empezar cualquier implementación.

---

### 2. **[.agent.md](./frontend/.agent.md)** ⭐ INSTRUCCIONES DEL AGENTE
**Descripción**: Cómo trabaja el agente especializado y cuáles son sus responsabilidades.

**Contiene**:
- 🤖 Perfil del agente
- 📊 Fases de trabajo (5 semanas)
- 🔄 Flujo de interacción
- ⚙️ Configuración esperada
- 📈 Métricas de éxito

**Cuándo leerlo**: Para entender cómo el agente puede ayudarte.

---

### 3. **[.prompt.md](./frontend/.prompt.md)** ⭐ PROMPT PERSONALIZADO
**Descripción**: Guía para el copilot sobre cómo ayudarte en este proyecto.

**Contiene**:
- 🎯 Objetivo y contexto
- 📚 Referencia a skills
- 🔄 Flujo de comunicación
- ✅ Checklist antes de responder

**Cuándo leerlo**: Para entender qué espera el agente de ti.

---

### 4. **[AGENTS.md](./AGENTS.md)** ⭐ GUÍA DE WORKFLOWS
**Descripción**: Mapeo completo de qué skill usar para cada tarea.

**Contiene**:
- 🤖 Descripción de agentes disponibles
- 📊 Tablas: Tarea → Skill → Ubicación
- 🔄 Workflows coordinados (ABM, reportes, mapas)
- 🎯 Flujo de solicitudes típicas
- 📋 Checklist de implementación completa

**Cuándo leerlo**: Cuando no sabes cuál skill usar o cómo ejecutar un workflow.

---

### 5. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** ⚡ SNIPPETS RÁPIDOS
**Descripción**: Código listo para adaptar a tus necesidades.

**Contiene**:
- 🎨 Componentes base (Button, Card, Modal)
- 🗺️ Ejemplos de mapas OpenLayers
- 🛢️ Servicios HTTP rápidos
- 🏪 Store Zustand mínimo
- ✅ Validación con Yup
- 📊 Grids responsive
- 🧪 Tests básicos

**Cuándo usarlo**: Cuando necesites inspiración o un punto de partida rápido.

---

## 🔧 Skills Especializados

Cada skill es un documento detallado con patrones, ejemplos y checklist.

### 1. **[SKILL_REACT_COMPONENTS.md](./frontend/src/components/SKILL_REACT_COMPONENTS.md)**
**Especialidad**: Construcción de componentes React desde diseños Stitch

**Cubre**:
- ✅ Proceso de conversión diseño → componente
- ✅ Componentes prioritarios (Tier 1, 2, 3)
- ✅ Patrones comunes (controlado, con estados)
- ✅ Grid y layout
- ✅ Accesibilidad
- ✅ Testing de componentes

**Usa cuando**: Necesites crear/modificar componentes UI

---

### 2. **[SKILL_OPENLAYERS_GEOSERVER.md](./frontend/src/services/SKILL_OPENLAYERS_GEOSERVER.md)**
**Especialidad**: Mapas interactivos con OpenLayers e integración GeoServer

**Cubre**:
- ✅ Arquitectura de mapas
- ✅ Inicialización de mapa base
- ✅ Capas WMS (imagen)
- ✅ Capas vectoriales WFS (lectura/escritura)
- ✅ Editor geométrico (draw, modify)
- ✅ Consultas espaciales
- ✅ Estilos dinámicos
- ✅ Controles de mapa

**Usa cuando**: Necesites trabajar con mapas, capas o geometrías

---

### 3. **[SKILL_SERVICES_APIs.md](./frontend/src/services/SKILL_SERVICES_APIs.md)**
**Especialidad**: Servicios HTTP y consultas a backend/GeoServer

**Cubre**:
- ✅ Configuración Axios base
- ✅ Servicios de Zonas (CRUD)
- ✅ Servicios de Recorridos (CRUD + cambio estado)
- ✅ Servicios de Atracciones (CRUD)
- ✅ Servicios de Reportes
- ✅ Consultas geográficas (búsquedas)
- ✅ Caching y optimización

**Usa cuando**: Necesites crear/modificar llamadas a APIs

---

### 4. **[SKILL_STATE_MANAGEMENT.md](./frontend/src/store/SKILL_STATE_MANAGEMENT.md)**
**Especialidad**: Gestión de estado con Zustand y custom hooks

**Cubre**:
- ✅ Setup de Zustand
- ✅ Map Store (estado del mapa)
- ✅ Zones Store (CRUD + utilidades)
- ✅ Routes Store (CRUD + historial)
- ✅ Attractions Store (CRUD)
- ✅ Custom hooks (useMap, useZones, useRoutes)
- ✅ Patrones de selección y filtrado

**Usa cuando**: Necesites compartir estado entre componentes

---

### 5. **[SKILL_FORMS_VALIDATION.md](./frontend/src/components/SKILL_FORMS_VALIDATION.md)**
**Especialidad**: Formularios complejos con validación y UX consistente

**Cubre**:
- ✅ Esquemas Yup para cada entidad
- ✅ Componente FormField reutilizable
- ✅ Formulario de Zona (completo)
- ✅ Validación en tiempo real
- ✅ Manejo de errores con Toast
- ✅ Upload de archivos
- ✅ Checklist de formularios

**Usa cuando**: Necesites crear formularios con validación

---

## 🔄 Mapeo Rápido: Problema → Skill

| Si necesitas... | Usa... |
|---|---|
| Crear un button/card | SKILL_REACT_COMPONENTS.md |
| Hacer responsivo un layout | SKILL_REACT_COMPONENTS.md |
| Dibujar polígono en mapa | SKILL_OPENLAYERS_GEOSERVER.md |
| Llamar API de zonas | SKILL_SERVICES_APIs.md |
| Compartir estado entre componentes | SKILL_STATE_MANAGEMENT.md |
| Validar entrada de usuario | SKILL_FORMS_VALIDATION.md |
| Agregar capa WMS | SKILL_OPENLAYERS_GEOSERVER.md |
| Crear hook personalizado | SKILL_STATE_MANAGEMENT.md |
| Formulario para atracción | SKILL_FORMS_VALIDATION.md |
| Búsqueda geográfica | SKILL_SERVICES_APIs.md |

---

## 🚀 Cómo Empezar

### Paso 1: Entiende el Proyecto
```
Lee en orden:
1. frontend/.instructions.md (30 min)
2. AGENTS.md (20 min)
3. frontend/.agent.md (10 min)
```

### Paso 2: Elige Tu Tarea
```
Ejecuta: @GeoTravel-Frontend-Builder
Ejemplo: "Necesito crear el componente ZoneForm"
```

### Paso 3: Consulta el Skill
```
El agente te dirá qué skill necesitas.
Ejemplo: "Ve a SKILL_FORMS_VALIDATION.md"
```

### Paso 4: Implementa
```
Usa los patrones del skill como base.
Adapta los ejemplos a tu contexto.
```

### Paso 5: Valida
```
Sigue el checklist del skill.
Prueba en navegador.
```

---

## 📋 Estructura de una Solicitud Típica

```
Yo: "Necesito el componente ZoneForm que..."
    "- Valide nombre, descripción, nivel
    "- Dibuje polígono en mapa
    "- Valide no superposición
    "- Guarde en backend"

Agente:
1. Consulta: SKILL_FORMS_VALIDATION.md ✅
2. Consulta: SKILL_OPENLAYERS_GEOSERVER.md ✅
3. Consulta: SKILL_SERVICES_APIs.md ✅
4. Consulta: SKILL_STATE_MANAGEMENT.md ✅
5. Genera: ZoneForm.jsx (componente completo)
6. Incluye: Tests unitarios
7. Incluye: Documentación
8. Incluye: Ejemplos de uso
```

---

## 🎓 Convenciones Importantes

### Archivos de Documentación
- **.instructions.md**: Contexto global del proyecto
- **.agent.md**: Cómo trabaja el agente
- **.prompt.md**: Guía para el copilot
- **SKILL_*.md**: Patrones especializados
- **AGENTS.md**: Mapeo de workflows
- **QUICK_REFERENCE.md**: Snippets rápidos

### Jerarquía de Autoridad
1. Requisitos en `TSIG 2026 - Letra.md`
2. Instrucciones en `.instructions.md`
3. Patterns en SKILL_*.md
4. Ejemplos en QUICK_REFERENCE.md

---

## 🔐 Checklist Antes de Empezar

- [ ] Leí `.instructions.md`
- [ ] Entiendo la arquitectura general
- [ ] Sé dónde va cada tipo de archivo
- [ ] Conozco el design system Tailwind
- [ ] He revisado AGENTS.md
- [ ] Identifiqué el skill que necesito

---

## 📞 Soporte Rápido

**¿Dónde va el componente X?**
→ Ve a: `.instructions.md` → "Arquitectura de Componentes"

**¿Cómo valido este campo?**
→ Ve a: `SKILL_FORMS_VALIDATION.md`

**¿Cómo integro con GeoServer?**
→ Ve a: `SKILL_OPENLAYERS_GEOSERVER.md`

**¿Dónde comparto estado?**
→ Ve a: `SKILL_STATE_MANAGEMENT.md`

**¿Necesito un ejemplo rápido?**
→ Ve a: `QUICK_REFERENCE.md`

**¿No sé qué skill usar?**
→ Ve a: `AGENTS.md` → "Skill Mapping"

---

## 📈 Progreso de Desarrollo

Usa este checklist para seguimiento:

- [ ] **Semana 1**: Setup + componentes base
  - [ ] Estructura de carpetas
  - [ ] Design system Tailwind
  - [ ] Button, Card, Modal, FormField
  
- [ ] **Semana 2**: Mapas + servicios
  - [ ] Cliente Axios
  - [ ] Mapa base OpenLayers
  - [ ] Capas GeoServer
  - [ ] Stores Zustand
  
- [ ] **Semana 3**: Páginas principales
  - [ ] Dashboard Admin
  - [ ] Gestión de Zonas
  - [ ] Catálogo de Atracciones
  - [ ] Planificador de Recorridos
  
- [ ] **Semana 4**: Funcionalidades avanzadas
  - [ ] Consultas geográficas
  - [ ] Reportes
  - [ ] Portal Invitado (Vista Guest)
  
- [ ] **Semana 5**: Testing + pulido
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] E2E tests
  - [ ] Performance

---

## 📚 Recursos Externos

- [OpenLayers Documentation](https://openlayers.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Yup Validation](https://github.com/jquense/yup)
- [Material Symbols](https://fonts.google.com/icons)
- [PostGIS Documentation](https://postgis.net/documentation/)

---

## 📝 Cambios Realizados

**Fecha**: Mayo 2026  
**Por**: Senior Frontend Architect  

**Archivos Creados**:
- ✅ `frontend/.instructions.md` - Instrucciones principales
- ✅ `frontend/.agent.md` - Agente especializado
- ✅ `frontend/.prompt.md` - Prompt personalizado
- ✅ `frontend/src/components/SKILL_REACT_COMPONENTS.md` - Skill: Componentes
- ✅ `frontend/src/services/SKILL_OPENLAYERS_GEOSERVER.md` - Skill: Mapas
- ✅ `frontend/src/services/SKILL_SERVICES_APIs.md` - Skill: Servicios
- ✅ `frontend/src/store/SKILL_STATE_MANAGEMENT.md` - Skill: Estado
- ✅ `frontend/src/components/SKILL_FORMS_VALIDATION.md` - Skill: Formularios
- ✅ `AGENTS.md` - Guía de workflows
- ✅ `QUICK_REFERENCE.md` - Snippets rápidos
- ✅ Este archivo (INDEX.md)

**Total**: 11 archivos de documentación + skills especializados

---

**Próximos Pasos**: Inicia con la lectura de `frontend/.instructions.md` y solicita implementación de componentes usando `@GeoTravel-Frontend-Builder`.

Última actualización: Mayo 2026
