# Plan De Seguimiento Post-Merge/PR (GeoTravel)

Fecha: 2026-05-29  
Owner(s): @GeoTravel-FE, @GeoTravel-GIS  
Fuente de requisitos: `docs/spec/TSIG-2026-Letra.md`

## Summary
Plan para continuar despues del merge/PR, ordenado por prioridad (1 + 2 + 3) y guiado por Clean Code: limites claros entre capas, contratos explicitos, nombres con intencion, responsabilidades unicas, y deuda tecnica visible.

Decisiones bloqueadas:
- CRS FE<->API: GeoJSON en EPSG:4326.
- Writes (ABM geometria): via API Spring (no WFS-T directo).
- Orden de ejecucion: 1) Contratos 2) Backend/PostGIS 3) GeoServer, con frontend en paralelo sin romper contratos.

## 1) Contratos Canonicos (Prioridad 1)
Objetivo: congelar contratos FE/BE/GIS para reducir cambios en cascada y duplicacion.

- Fuente de verdad: `docs/spec/TSIG-2026-Letra.md` + `docs/frontend/integration-contracts.md`.
- CRS policy:
  - FE<->API: GeoJSON EPSG:4326.
  - FE (OpenLayers): transforma a EPSG:3857 para render.
  - Backend/DB: transforma a EPSG:32721 para persistencia/consultas.
- Definir contratos REST + error shape estable:
  - Zonas: CRUD + `check-overlap` + `stats`.
  - Atracciones: CRUD + filtros por zona/recorrido.
  - Recorridos: CRUD + avance de estado + historico + filtros por estado/estacionalidad.
  - Consultas geograficas: recorridos por zona, zonas con mas recorridos activos, nearest a interseccion, zona por direccion, puntos mas populares.
  - Errores: JSON estable (codigo, mensaje, detalles opcionales) y uso consistente de HTTP 4xx/5xx.
- Definir enums/naming canonico:
  - Estados de recorrido: Disponible, Fuera de estacion, Pendiente, Cancelado (o mapping canonico documentado).
  - Tipo experiencia: cultural, gastronomica, natural, historica.

Entregables:
- Actualizar `docs/frontend/integration-contracts.md` con endpoints, DTOs, error shape, CRS/SRID y nombres GeoServer (workspace/layers).
- Checklist de contratos consumidos por FE (services) sin mocks para happy path cuando BE este listo.

## 2) Backend + PostGIS (Prioridad 2)
Objetivo: implementar invariantes core y endpoints MVP sin mezclar capas.

Arquitectura (Clean Code):
- controller -> service -> repository
- DTOs separados de entidades
- Validaciones en service
- SQL PostGIS nativo cuando aplique (repos dedicados)

Invariantes core:
- No superposicion de zonas:
  - Chequeo transaccional (ST_Intersects) excluyendo el mismo id.
  - Respuesta 409 con detalle util para FE.
- Geometria valida:
  - ST_IsValid y 400 cuando no cumple.
- Estacionalidad y “Fuera de estacion”:
  - Regla deterministica documentada y testeada.
- Historico de estados:
  - Persistir cambio con timestamp al avanzar estado.

SRID handling:
- Entrada: GeoJSON 4326 -> convertir en backend a 32721.
- Persistencia/consultas: 32721.
- Salida: devolver geometria como GeoJSON 4326 (incluyendo SRID declarado en doc/contrato).

Entregables:
- Endpoints MVP implementados segun contratos.
- Consultas espaciales core funcionando con datos de `postgres/init/`.

## 3) GeoServer Publicacion (Prioridad 3)
Objetivo: dejar GeoServer listo para consumo read (WMS/WFS) con naming estable.

- Workspace: `geotravel` (constante).
- Store PostGIS: conectar DB del compose, publicar capas base (zonas, atracciones; recorridos cuando exista geometria).
- WMS:
  - Visualizacion de capas principales.
  - Estilos por estado en recorridos (SLD).
- WFS read:
  - Solo si FE necesita features para seleccion/identificacion.
- Contrato de nombres:
  - Documentar workspace/layer names en `docs/frontend/integration-contracts.md`.

Entregables:
- Capas y estilos publicados y verificados via WMS (y WFS read si aplica).

## Frontend Seguimiento (En Paralelo, Sin Romper Contratos)
Objetivo: mantener FE productivo con mocks, pero converger a contratos reales sin deuda explosiva.

- Servicios:
  - `apiClient` como infra, `*Service` como casos de uso.
  - Normalizar responses y errores.
- Stores (Zustand):
  - Acciones pequenas con nombres verbales.
  - Side-effects async centralizados por store.
- Map/CRS:
  - Transformaciones CRS centralizadas en un helper unico.
- De-mock progresivo:
  - Mantener mocks como fallback, pero permitir usar API real por feature-flag/config.
- i18n:
  - Solo donde aporte; evitar refactor masivo.

## Test Plan (Aceptacion)
Contratos:
- FE consume endpoints definidos sin cambios ad-hoc.
- Payloads declaran CRS/SRID y geometria valida.

Backend:
- Crear/editar zona rechaza solape (409) y geometria invalida (400).
- Avance de estado crea historico.
- Consultas espaciales basicas responden con datos de `postgres/init/`.

GeoServer:
- WMS responde y renderiza capas principales.
- Estilos por estado visibles.

Frontend:
- Flujos admin (zonas/atracciones/recorridos) funcionan contra API real al menos en happy path.
- MapCanvas no rompe por CRS y las features caen donde corresponde.
