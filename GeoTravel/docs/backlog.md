# GeoTravel Documentation Backlog

Este backlog organiza la documentación pendiente del proyecto con foco en `frontend`, operación en Docker y onboarding técnico.

## Estado y prioridad

### P0 - Crítico (para trabajar sin bloqueos)
- [ ] Documentar flujo real de autenticación:
  - Mock actual en `frontend/src/components/auth/AdminLoginForm.jsx`.
  - Contrato objetivo con backend (`JWT`, expiración, refresh).
  - Comportamiento de `ProtectedRoute`.
- [ ] Documentar flujo de datos de zonas:
  - `zonesStore` y ciclo `fetch/save/delete`.
  - Apertura/cierre del formulario en `ZoneManagement`.
  - Eventos esperados desde mapa para edición.
- [ ] Documentar i18n operativo:
  - Convención de claves en `locales/en.json` y `locales/es.json`.
  - Reglas para strings nuevos y fallback de `langStore`.
- [ ] Documentar contrato de servicios frontend:
  - `apiClient`, `zonesService`, `routesService`, `attractionsService`.
  - Endpoints requeridos y shape mínimo de respuestas.

### P1 - Alta (mantenibilidad)
- [ ] Crear guía de arquitectura frontend:
  - Mapa `pages -> components -> store -> services`.
  - Qué estado es local y qué estado vive en store.
- [ ] Crear guía de design system aplicado:
  - Tokens actuales en `src/styles.css`.
  - Reglas de uso de colores/estados y tipografía.
- [ ] Crear guía de mapas:
  - Responsabilidad de `MapCanvas`, `MapControls`.
  - Integración esperada con selección/edición de entidades.
- [ ] Documentar estrategia de errores y loading:
  - Patrones de UI para errores de red/store.
  - Mensajes traducibles y estados vacíos.

### P2 - Media (calidad y escalabilidad)
- [ ] Crear checklist de PR para frontend:
  - i18n, accesibilidad, responsive, estados de carga, tests.
- [ ] Documentar convenciones de testing:
  - Qué testear en componentes, stores y servicios.
  - Setup recomendado para Vitest/RTL.
- [ ] Documentar límites y deuda técnica:
  - Uso de mocks actuales.
  - Diferencias entre diseño Stitch y runtime React.
- [ ] Crear glosario de dominio:
  - Zona, recorrido, atracción, estacionalidad, estado.

## Plan sugerido (semanal)
- Semana 1: P0 completo.
- Semana 2: P1 (arquitectura + design system + mapas).
- Semana 3: P1/P2 restante (errores, checklist PR, testing).

## Dueños sugeridos
- Frontend Builder: P0 flujo funcional + P1 arquitectura.
- Localization Specialist: P0/P1 de i18n.
- Reviewer técnico: checklist PR y deuda técnica.

## Criterio de cierre
- Cada item se cierra con:
  - Documento enlazado desde `README` correspondiente.
  - Ejemplo mínimo reproducible.
  - Fecha de actualización y responsable.
