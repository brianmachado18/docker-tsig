# Skill: Construcción de Componentes React desde Diseños

## 📌 Propósito
Convertir archivos HTML de diseño (Stitch) en componentes React funcionales, manteniendo fidelidad al design system y garantizando responsividad y accesibilidad.

## 🎯 Cuándo Usar Este Skill

**USE ESTE SKILL CUANDO:**
- Necesites crear un nuevo componente React basado en diseños HTML proporcionados
- Debas extraer elementos de las pantallas de Stitch (Dashboard, Catalogo, etc.)
- Requieras componentes UI complejos con múltiples variantes
- Necesites asegurar que los componentes sigan el design system Tailwind/Material 3

**NO USES ESTE SKILL PARA:**
- Lógica de estado o business logic (usa skill de State Management)
- Integración con mapas (usa skill de OpenLayers)
- Consultas a APIs (usa skill de Servicios)

## 🛠️ Proceso de Conversión

### Paso 1: Análisis del Diseño
```
1. Identificar estructura visual (layout grid)
2. Extraer colores y espaciado del design system
3. Detectar componentes reutilizables
4. Documentar interactividad y estados
```

### Paso 2: Creación de Componente Base
```javascript
// Estructura estándar
import React from 'react';
import PropTypes from 'prop-types';

export const MyComponent = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className,
  ...props 
}) => {
  return (
    <div 
      className={`
        // Clases base
        flex items-center justify-between
        // Variantes
        ${variant === 'primary' ? 'bg-primary text-on-primary' : 'bg-surface'}
        // Tamaños
        ${size === 'sm' ? 'p-2' : size === 'md' ? 'p-4' : 'p-6'}
        // Clases personalizadas
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

MyComponent.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
```

### Paso 3: Implementar Variantes y Estados
```javascript
// Variantes: primary, secondary, tertiary, outline
// Tamaños: sm (32px), md (40px), lg (48px)
// Estados: default, hover, active, disabled, loading
```

### Paso 4: Asegurar Responsividad
```javascript
// Usar breakpoints de Tailwind
className={`
  grid 
  grid-cols-1          // mobile
  md:grid-cols-2       // tablet
  lg:grid-cols-4       // desktop
  gap-container-padding
`}
```

### Paso 5: Validar con Design System
```javascript
// Verificar:
✓ Colores del palette (primary, secondary, tertiary, status-*)
✓ Tipografía (headline-lg, body-md, label-md, etc.)
✓ Espaciado (container-padding: 1.5rem, gutter: 1rem, etc.)
✓ Bordes (DEFAULT: 0.125rem, lg: 0.25rem, xl: 0.5rem, full: 0.75rem)
✓ Iconos Material Symbols
```

## 📦 Componentes Prioritarios

### Tier 1 (Críticos - Semana 1)
1. **Button** - variants: primary, secondary, tertiary, outline
2. **Card** - contenedor base
3. **Modal** - diálogos
4. **Sidebar** - navegación principal
5. **SearchBar** - búsqueda

### Tier 2 (Esenciales - Semana 2)
1. **FormField** - inputs, textareas, selects
2. **StatusBadge** - estados de recorridos
3. **AttractionCard** - catálogo
4. **MapLegend** - leyenda de capas
5. **Tabs** - navegación interna

### Tier 3 (Complementarios - Semana 3)
1. **RouteDetail** - panel lateral
2. **ZoneInfo** - información de zona
3. **AttractionDetail** - detalles expandidos
4. **ReportTable** - datos tabulares
5. **DateRange** - filtro temporal

## 💡 Patrones Comunes

### Patrón: Componente Controlado
```javascript
export const ZoneForm = ({ zone, onSave, onCancel }) => {
  const [formData, setFormData] = React.useState(zone || {});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <FormField 
        label="Nombre"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <FormField 
        label="Descripción"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        type="textarea"
      />
      {/* Resto de campos */}
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" onClick={() => onSave(formData)}>Guardar</Button>
      </div>
    </div>
  );
};
```

### Patrón: Componente con Estados
```javascript
export const RouteStatusBadge = ({ status }) => {
  const statusConfig = {
    available: { bg: 'bg-status-available', label: 'Disponible' },
    pending: { bg: 'bg-status-pending', label: 'Pendiente' },
    'off-season': { bg: 'bg-status-off-season', label: 'Fuera de estación' },
    cancelled: { bg: 'bg-status-cancelled', label: 'Cancelado' },
  };

  const config = statusConfig[status];
  return (
    <span className={`${config.bg} text-on-surface px-3 py-1 rounded-full text-label-md`}>
      {config.label}
    </span>
  );
};
```

## 📐 Grid & Layout

```javascript
// Dashboard Layout
<div className="grid grid-cols-1 lg:grid-cols-4 gap-container-padding">
  <aside className="lg:col-span-1">
    <Sidebar />
  </aside>
  <main className="lg:col-span-3">
    <TopBar />
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
      {/* Contenido principal */}
    </div>
  </main>
</div>
```

## ♿ Accesibilidad

- Usar `<button>` para botones, `<a>` para enlaces
- Incluir `aria-label` en iconos
- Mantener contrast ratio ≥ 4.5:1
- Keyboard navigation funcional
- Semántica HTML correcta

## 🧪 Testing de Componentes

```javascript
// Ejemplo con Vitest + Testing Library
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct variant', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## 📋 Checklist de Componente

- [ ] Implementado con estructura correcta
- [ ] Propiedades documentadas con PropTypes
- [ ] Variantes y estados cubiertos
- [ ] Responsive en mobile/tablet/desktop
- [ ] Colores del design system aplicados
- [ ] Iconografía Material Symbols correcta
- [ ] Validación de accesibilidad (a11y)
- [ ] Tests unitarios implementados
- [ ] Documentación de uso incluida
- [ ] Integrado en storybook (opcional)

## 🔗 Componentes Relacionados

- Consulta el skill: **State Management & Hooks** para conectar con stores
- Consulta el skill: **Formularios y Validaciones** para componentes de entrada

---

**Última actualización**: Mayo 2026
