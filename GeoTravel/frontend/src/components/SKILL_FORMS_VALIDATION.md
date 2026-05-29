# Skill: Formularios, Validaciones y Manejo de Errores

## 📌 Propósito
Implementar formularios robustos con validación de datos, manejo de errores visual y experiencia de usuario consistente basada en el design system.

## 🎯 Cuándo Usar Este Skill

**USE ESTE SKILL CUANDO:**
- Necesites crear formularios para ABM de entidades
- Debas validar entrada de usuario antes de enviar
- Requieras mostrar errores de validación inline
- Necesites formularios con campos dinámicos o condicionales
- Requieras upload de archivos (fotos de atracciones)

**NO USES ESTE SKILL PARA:**
- Búsqueda y filtrado (usa componentes de Search)
- Componentes UI simples (usa skill de Componentes)
- Lógica de guardar datos (usa servicios)

## 📋 Esquemas de Validación

### Zonas Turísticas
```javascript
// src/utils/validators.js
import * as yup from 'yup';

export const zoneSchema = yup.object().shape({
  name: yup.string()
    .required('El nombre es obligatorio')
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),

  description: yup.string()
    .required('La descripción es obligatoria')
    .min(10, 'Mínimo 10 caracteres')
    .max(500, 'Máximo 500 caracteres'),

  attractionLevel: yup.number()
    .required('El nivel de atractivo es obligatorio')
    .min(1, 'Mínimo 1')
    .max(5, 'Máximo 5'),

  observations: yup.string()
    .max(500, 'Máximo 500 caracteres'),

  geometry: yup.object()
    .required('La geometría es obligatoria')
    .shape({
      type: yup.string().oneOf(['Polygon']),
      coordinates: yup.array().min(1, 'Al menos un polígono es requerido'),
    }),
});
```

### Recorridos
```javascript
export const routeSchema = yup.object().shape({
  name: yup.string()
    .required('El nombre es obligatorio')
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),

  description: yup.string()
    .required('La descripción es obligatoria')
    .min(20, 'Mínimo 20 caracteres')
    .max(1000, 'Máximo 1000 caracteres'),

  estimatedDuration: yup.number()
    .required('La duración estimada es obligatoria')
    .positive('Debe ser mayor a 0')
    .lessThan(480, 'Máximo 8 horas'),

  guide: yup.string()
    .required('El guía es obligatorio')
    .min(3, 'Mínimo 3 caracteres'),

  experienceType: yup.string()
    .required('El tipo de experiencia es obligatorio')
    .oneOf(['cultural', 'gastronomic', 'natural', 'historical']),

  zoneId: yup.string()
    .required('Debe seleccionar una zona'),

  seasonStart: yup.date()
    .required('Fecha de inicio requerida'),

  seasonEnd: yup.date()
    .required('Fecha de fin requerida')
    .min(
      yup.ref('seasonStart'),
      'La fecha de fin debe ser mayor a la de inicio'
    ),

  attractions: yup.array()
    .min(1, 'Al menos una atracción es requerida')
    .of(
      yup.object().shape({
        attractionId: yup.string().required(),
        order: yup.number().required().positive(),
      })
    ),
});
```

### Atracciones
```javascript
export const attractionSchema = yup.object().shape({
  name: yup.string()
    .required('El nombre es obligatorio')
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),

  description: yup.string()
    .required('La descripción es obligatoria')
    .min(20, 'Mínimo 20 caracteres')
    .max(1000, 'Máximo 1000 caracteres'),

  classification: yup.string()
    .required('La clasificación es obligatoria')
    .oneOf([
      'monument', 'nature', 'restaurant', 'hotel', 'museum', 'other'
    ]),

  latitude: yup.number()
    .required('Latitud requerida')
    .min(-90).max(90),

  longitude: yup.number()
    .required('Longitud requerida')
    .min(-180).max(180),

  photo: yup.mixed()
    .nullable()
    .test('fileSize', 'El archivo no debe exceder 5MB', (value) => {
      if (!value) return true;
      return value.size <= 5 * 1024 * 1024;
    })
    .test('fileType', 'Solo se permite PNG, JPG, JPEG', (value) => {
      if (!value) return true;
      return ['image/png', 'image/jpeg'].includes(value.type);
    }),
});
```

## 📝 Componentes de Formulario

### FormField (Reutilizable)
```javascript
// src/components/common/FormField.jsx
import React from 'react';

export const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  options = [], // para select
  rows = 3, // para textarea
  className = '',
  ...props
}) => {
  const baseInputClass = `
    w-full px-3 py-2 border rounded-xl
    text-body-md text-on-surface
    placeholder-on-surface-variant
    focus:outline-none focus:ring-2 focus:ring-primary
    ${error ? 'border-error' : 'border-outline'}
    ${className}
  `;

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-label-md font-600 text-on-surface">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={baseInputClass}
          {...props}
        />
      ) : type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={baseInputClass}
          {...props}
        >
          <option value="">Seleccionar...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'number' ? (
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={baseInputClass}
          {...props}
        />
      ) : type === 'date' ? (
        <input
          type="date"
          name={name}
          value={value}
          onChange={onChange}
          className={baseInputClass}
          {...props}
        />
      ) : type === 'file' ? (
        <input
          type="file"
          name={name}
          onChange={(e) => onChange(e.target.files[0])}
          className={baseInputClass}
          {...props}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={baseInputClass}
          {...props}
        />
      )}

      {error && (
        <span className="text-label-md text-error">
          {error}
        </span>
      )}
    </div>
  );
};
```

## 🏗️ Formulario de Zona

```javascript
// src/components/zones/ZoneForm.jsx
import React, { useState } from 'react';
import { useFormik } from 'formik';
import { zoneSchema } from '../../utils/validators';
import { useZonesStore } from '../../store/zonesStore';
import { useMapStore } from '../../store/mapStore';
import { FormField } from '../common/FormField';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { GeometryEditor } from '../map/GeometryEditor';

export const ZoneForm = ({ zone = null, onSuccess, onCancel }) => {
  const [toast, setToast] = useState(null);
  const { addZone, updateZone } = useZonesStore();
  const { drawMode, isDrawing, startDrawing, stopDrawing } = useMapStore();

  const formik = useFormik({
    initialValues: zone || {
      name: '',
      description: '',
      attractionLevel: 3,
      observations: '',
      geometry: null,
    },
    validationSchema: zoneSchema,
    onSubmit: async (values) => {
      try {
        if (zone) {
          await updateZone(zone.id, values);
          setToast({ type: 'success', message: 'Zona actualizada correctamente' });
        } else {
          await addZone(values);
          setToast({ type: 'success', message: 'Zona creada correctamente' });
        }
        setTimeout(() => onSuccess?.(), 1500);
      } catch (error) {
        setToast({ type: 'error', message: error.message });
      }
    },
  });

  const handleDrawPolygon = () => {
    if (!isDrawing) {
      startDrawing('Polygon');
    } else {
      stopDrawing();
      // Capturar geometría del editor
      setToast({ type: 'info', message: 'Polígono dibujado. Completa los datos.' });
    }
  };

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <FormField
          label="Nombre de la Zona"
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
          error={formik.touched.name && formik.errors.name}
          required
          placeholder="Ej: Barrio Histórico"
        />

        <FormField
          label="Descripción"
          name="description"
          type="textarea"
          value={formik.values.description}
          onChange={formik.handleChange}
          error={formik.touched.description && formik.errors.description}
          required
          placeholder="Describe la zona turística..."
        />

        <FormField
          label="Nivel de Atractivo"
          name="attractionLevel"
          type="select"
          value={formik.values.attractionLevel}
          onChange={formik.handleChange}
          error={formik.touched.attractionLevel && formik.errors.attractionLevel}
          required
          options={[
            { value: 1, label: '1 - Muy Alto' },
            { value: 2, label: '2 - Alto' },
            { value: 3, label: '3 - Medio' },
            { value: 4, label: '4 - Bajo' },
            { value: 5, label: '5 - Muy Bajo' },
          ]}
        />

        <FormField
          label="Observaciones"
          name="observations"
          type="textarea"
          value={formik.values.observations}
          onChange={formik.handleChange}
          error={formik.touched.observations && formik.errors.observations}
          placeholder="Notas adicionales..."
          rows={2}
        />

        <div className="space-y-2">
          <label className="text-label-md font-600 text-on-surface">
            Dibujar en Mapa *
          </label>
          <Button
            variant={isDrawing ? 'primary' : 'secondary'}
            onClick={handleDrawPolygon}
            type="button"
          >
            {isDrawing ? 'Finalizar Polígono' : 'Dibujar Polígono'}
          </Button>
          {formik.touched.geometry && formik.errors.geometry && (
            <span className="text-label-md text-error block">
              {formik.errors.geometry}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
          {zone ? 'Actualizar' : 'Crear'} Zona
        </Button>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </form>
  );
};
```

## 🧭 Validación en Tiempo Real

```javascript
// Hook personalizado para validación
export const useFormValidation = (initialValues, schema, onSubmit) => {
  const formik = useFormik({
    initialValues,
    validationSchema: schema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit,
  });

  const getFieldProps = (name) => ({
    value: formik.values[name],
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    error: formik.touched[name] && formik.errors[name],
  });

  const getFieldError = (name) => formik.touched[name] && formik.errors[name];

  return {
    ...formik,
    getFieldProps,
    getFieldError,
    isValid: formik.isValid && formik.dirty,
  };
};
```

## 🔔 Manejo de Errores con Toast

```javascript
// src/components/common/Toast.jsx
import React, { useEffect } from 'react';

export const Toast = ({ type = 'info', message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor = {
    success: 'bg-status-available',
    error: 'bg-status-cancelled',
    warning: 'bg-status-pending',
    info: 'bg-primary',
  };

  return (
    <div className={`
      fixed bottom-4 right-4 px-6 py-3 rounded-xl
      text-on-surface text-body-md font-600
      shadow-lg z-50 animate-slide-in
      ${bgColor[type]}
    `}>
      {message}
    </div>
  );
};
```

## 📋 Checklist de Formularios

- [ ] Esquemas de validación con Yup definidos
- [ ] Componentes FormField reutilizables
- [ ] Validación inline con mensajes claros
- [ ] Manejo de estados de carga (loading, disabled)
- [ ] Feedback visual de errores
- [ ] Toast notifications para mensajes
- [ ] Integración con stores Zustand
- [ ] Upload de archivos con validación
- [ ] Campos dinámicos/condicionales
- [ ] Tests de validación

## 🔗 Componentes Relacionados

- Consulta el skill: **Componentes React** para UI base
- Consulta el skill: **State Management** para guardar datos
- Consulta el skill: **Servicios** para enviar datos al backend

---

**Última actualización**: Mayo 2026
