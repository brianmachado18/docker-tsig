import React, { useEffect, useMemo, useRef, useState } from 'react';
import { attractionsService } from '@/features/attractions/attractionsService';
import useRefreshEntityLayer from '@/features/map/useRefreshEntityLayer';
import useRoutesStore from '@/features/routes/routesStore';
import { STATUS_LABELS, STATUS_STYLES } from '@/features/routes/routeStatus';
import { validateRouteForm } from '@/features/routes/routeValidation';
import { zonesService } from '@/features/zones/zonesService';
import useLangStore from '@/shared/i18n/langStore';
import { getApiErrorMessage } from '@/shared/lib/forms/validation';
import { fetchRoadRoute, optimizeStopsOrder } from '@/shared/lib/geo/routing';
import { toLineStringWkt } from '@/shared/lib/geo/wkt';

// ─── Utilidades ────────────────────────────────────────────────────────────────

const getZoneCentroid = (zone) => {
  if (!zone?.geomWkt) return null;
  const matches = [...zone.geomWkt.matchAll(/(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/g)];
  if (!matches.length) return null;
  const lons = matches.map((m) => parseFloat(m[1]));
  const lats = matches.map((m) => parseFloat(m[2]));
  return [lons.reduce((a, b) => a + b, 0) / lons.length, lats.reduce((a, b) => a + b, 0) / lats.length];
};

const attractionToStop = (a) => ({
  type: 'attraction', id: a.id, title: a.title, coordinates: a.coordinates,
});

const zoneToStop = (z) => ({
  type: 'zone', id: z.id, title: z.name, coordinates: getZoneCentroid(z),
});

const isOutOfSeason = (mesInicio, mesFin, month) => {
  if (!mesInicio || !mesFin) return false;
  if (mesInicio <= mesFin) return month < mesInicio || month > mesFin;
  return month < mesInicio && month > mesFin; // cruza año (ej: nov-feb)
};

// ─── Estado y transiciones ─────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS = {
  pending: ['available', 'cancelled', 'off-season'],
  available: ['pending', 'cancelled', 'off-season'],
  'off-season': ['available', 'cancelled'],
  cancelled: ['pending', 'off-season'],
};

// ─── StopPicker ────────────────────────────────────────────────────────────────

const StopPicker = ({ value, onChange, attractions, zones, placeholder = 'Buscar atracción o zona...' }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const results = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return [];
    return [
      ...attractions.filter((a) => a.title?.toLowerCase().includes(q)).slice(0, 5).map(attractionToStop),
      ...zones.map(zoneToStop).filter((s) => s.coordinates && s.title?.toLowerCase().includes(q)).slice(0, 4),
    ];
  }, [search, attractions, zones]);

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-lg border border-outline-variant">
        <span className="material-symbols-outlined text-[16px] text-primary">
          {value.type === 'zone' ? 'pentagon' : 'location_on'}
        </span>
        <span className="flex-1 text-sm text-on-surface truncate">{value.title}</span>
        <span className="text-[10px] text-outline border border-outline-variant rounded px-1.5 py-0.5">
          {value.type === 'zone' ? 'Zona' : 'Atracción'}
        </span>
        <button type="button" onClick={() => onChange(null)} className="text-outline hover:text-error ml-1 flex items-center">
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        className="w-full px-3 py-2 border border-outline rounded bg-surface text-sm focus:outline-none focus:border-primary"
        placeholder={placeholder}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        type="text"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg z-30 max-h-44 overflow-y-auto">
          {results.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              className="w-full text-left px-3 py-2 hover:bg-surface-container flex items-center gap-2 text-sm"
              onClick={() => { onChange(item); setSearch(''); setOpen(false); }}
              type="button"
            >
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                {item.type === 'zone' ? 'pentagon' : 'location_on'}
              </span>
              <span className="flex-1 truncate">{item.title}</span>
              <span className="text-[10px] text-outline shrink-0">{item.type === 'zone' ? 'Zona' : 'Atracción'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Opciones ──────────────────────────────────────────────────────────────────

const experienceOptions = [
  { id: 'cultural', label: 'Cultural' },
  { id: 'gastronomic', label: 'Gastronómico' },
  { id: 'natural', label: 'Natural' },
  { id: 'historical', label: 'Histórica' },
  { id: 'adventure', label: 'Aventura' },
  { id: 'other', label: 'Otro' },
];

const months = [
  {id: '1', lable: 'Enero'},
  {id: '2', lable: 'Febrero'},
  {id: '3', lable: 'Marzo'},
  {id: '4', lable: 'Abril'},
  {id: '5', lable: 'Mayo'},
  {id: '6', lable: 'Junio'},
  {id: '7', lable: 'Julio'},
  {id: '8', lable: 'Agosto'},
  {id: '9', lable: 'Septiembre'},
  {id: '10', lable: 'Octubre'},
  {id: '11', lable: 'Noviembre'},
  {id: '12', lable: 'Diciembre'},
]

const isValidCoordinate = (coordinates) =>
  Array.isArray(coordinates)
  && Number.isFinite(Number(coordinates[0]))
  && Number.isFinite(Number(coordinates[1]));

const RouteForm = ({ route, onClose, onSaved, onDeleted }) => {
  const { t } = useLangStore();
  const {
    creationMode,
    closeForm, saveRoute, deleteRoute,
    isSaving, isDeleting, error, clearError,
  } = useRoutesStore();
  const refreshRouteLayers = useRefreshEntityLayer('routes');

  // Campos básicos
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [routeStatus, setRouteStatus] = useState('pending'); // siempre inicia en pendiente
  const [durationHours, setDurationHours] = useState('');
  const [guide, setGuide] = useState('');
  const [experienceType, setExperienceType] = useState('cultural');
  const [startDay, setStartDay] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [endDay, setEndDay] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [geomWkt, setGeomWkt] = useState('');
  const [zoneIds, setZoneIds] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

  // Modo y paradas
  const [routeMode, setRouteMode] = useState('points');
  const [startStop, setStartStop] = useState(null);
  const [endStop, setEndStop] = useState(null);
  const [intermediateStops, setIntermediateStops] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);
  const [originalIntermediates, setOriginalIntermediates] = useState(null);

  // Datos disponibles
  const [availableAttractions, setAvailableAttractions] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);
  const [routingFeedback, setRoutingFeedback] = useState('');

  const currentMonth = new Date().getMonth() + 1;

  const handleClose = () => {
    refreshRouteLayers();
    if (onClose) { onClose(); return; }
    closeForm();
  };

  useEffect(() => {
    const loadAll = async () => {
      const [attractions, zones] = await Promise.all([
        attractionsService.list(),
        zonesService.list(),
      ]);
      setAvailableAttractions(attractions);
      setAvailableZones(zones);

      setRouteName(route?.name || '');
      setRouteDescription(route?.description || '');
      setRouteStatus(route?.status || 'pending');
      setDurationHours(route?.durationHours || '');
      setGuide(route?.guide || '');
      setExperienceType(route?.experienceType || 'cultural');
      setStartDay(route?.startDay || '');
      setStartMonth(route?.startMonth || '');
      setEndDay(route?.endDay || '');
      setEndMonth(route?.endMonth || '');
      setGeomWkt(route?.geomWkt || '');
      setZoneIds(Array.isArray(route?.zoneIds) ? route.zoneIds : []);
      setValidationError('');
      setRoutingFeedback('');
      setIsOptimized(false);
      setOriginalIntermediates(null);
      clearError();

      if (!route?.id && creationMode === 'draw') {
        setRouteMode('draw');
      } else if (!route?.id && creationMode === 'points') {
        setRouteMode('points');
      } else if (route?.geomWkt && !route?.attractionIds?.length) {
        setRouteMode('draw');
      } else {
        setRouteMode('points');
      }

      // Poblar paradas desde attractionIds existentes
      const existingIds = Array.isArray(route?.attractionIds) ? route.attractionIds : [];
      if (existingIds.length >= 2) {
        const stops = existingIds.map((id) => attractions.find((a) => a.id === id)).filter(Boolean).map(attractionToStop);
        setStartStop(stops[0]);
        setEndStop(stops[stops.length - 1]);
        setIntermediateStops(stops.slice(1, -1));
      } else if (existingIds.length === 1) {
        const a = attractions.find((a) => a.id === existingIds[0]);
        if (a) setStartStop(attractionToStop(a));
        setEndStop(null);
        setIntermediateStops([]);
      } else {
        setStartStop(null);
        setEndStop(null);
        setIntermediateStops([]);
      }
    };
    loadAll();
  }, [route, creationMode, clearError]);
  const apiError = useMemo(() => getApiErrorMessage(error, t('common.error')), [error, t]);

  const moveIntermediate = (index, dir) => {
    const newList = [...intermediateStops];
    const target = index + dir;
    if (target < 0 || target >= newList.length) return;
    [newList[index], newList[target]] = [newList[target], newList[index]];
    setIntermediateStops(newList);
    setIsOptimized(false);
  };

  const removeIntermediate = (index) => {
    setIntermediateStops((s) => s.filter((_, i) => i !== index));
    setIsOptimized(false);
  };

  const handleOptimize = async () => {
    if (isOptimized) {
      // Toggle OFF: revertir al orden original
      setIntermediateStops(originalIntermediates || []);
      setOriginalIntermediates(null);
      setIsOptimized(false);
      return;
    }

    const allStops = [startStop, ...intermediateStops, endStop].filter(Boolean);
    if (allStops.length < 3) return;

    // Guardar orden original y marcar como optimizado ANTES del llamado OSRM
    // para que el toggle se vea activo inmediatamente
    setOriginalIntermediates([...intermediateStops]);
    setIsOptimized(true);
    setIsOptimizing(true);
    try {
      const coords = allStops.map((s) => s.coordinates);
      const result = await optimizeStopsOrder(coords);
      if (!result) return; // OSRM falló: toggle queda ON pero orden sin cambio

      const reordered = result.reorderedIndices.map((origIdx) => allStops[origIdx]);
      setStartStop(reordered[0]);
      setEndStop(reordered[reordered.length - 1]);
      setIntermediateStops(reordered.slice(1, -1));
    } finally {
      setIsOptimizing(false);
    }
  };

  const buildLineFromStops = async () => {
    const all = [startStop, ...intermediateStops, endStop].filter((s) => s?.coordinates);
    const coords = all
      .map((s) => s.coordinates)
      .filter(isValidCoordinate)
      .map(([lon, lat]) => [Number(lon), Number(lat)]);

    if (coords.length < 2) return '';

    setIsRoutingLoading(true);
    setRoutingFeedback('');
    try {
      const routedWkt = await fetchRoadRoute(coords);
      if (routedWkt) return routedWkt;

      setRoutingFeedback('No se pudo ajustar a calles reales. Se generó una línea directa entre las paradas.');
      return toLineStringWkt(coords);
    } finally {
      setIsRoutingLoading(false);
    }
  };

  const validate = (geom) =>
    validateRouteForm({ name: routeName, description: routeDescription, startDay, startMonth, endDay, endMonth, durationHours, guide, geomWkt: geom }, t);

  const handleSubmit = async (event) => {
    event.preventDefault();
    let effectiveGeomWkt = '';

    if (routeMode === 'draw') {
      effectiveGeomWkt = geomWkt?.trim() || '';
    } else {
      if (!startStop || !endStop) {
        setValidationError('Seleccioná un punto inicial y un punto final.');
        return;
      }
      effectiveGeomWkt = await buildLineFromStops();
    }

    const validation = validate(effectiveGeomWkt);
    setValidationError(validation);
    if (validation) return;

    const allStops = routeMode === 'points' ? [startStop, ...intermediateStops, endStop].filter(Boolean) : [];
    const derivedAttractionIds = allStops.filter((s) => s.type === 'attraction').map((s) => s.id);
    const stopZoneIds = allStops.filter((s) => s.type === 'zone').map((s) => s.id);
    const allZoneIds = [...new Set([...zoneIds, ...stopZoneIds])];

    const ok = await saveRoute({
      id: route?.id,
      name: routeName,
      description: routeDescription,
      status: routeStatus,
      durationHours: Number(durationHours),
      guide,
      experienceType,
      startDay: Number(startDay),
      startMonth: Number(startMonth),
      endDay: Number(endDay),
      endMonth: Number(endMonth),
      geomWkt: effectiveGeomWkt,
      zoneIds: allZoneIds,
      attractionIds: derivedAttractionIds,
    });
    if (ok) onSaved?.();
  };

  const handleDelete = async () => {
    if (!route?.id) return;
    if (!window.confirm('¿Eliminar recorrido?')) return;
    const ok = await deleteRoute(route.id);
    if (ok) { onDeleted?.(); handleClose(); }
  };

  const usedAttractionIds = useMemo(() => new Set([
    ...(startStop?.type === 'attraction' ? [startStop.id] : []),
    ...(endStop?.type === 'attraction' ? [endStop.id] : []),
    ...intermediateStops.filter((s) => s.type === 'attraction').map((s) => s.id),
  ]), [startStop, endStop, intermediateStops]);

  const usedZoneIds = useMemo(() => new Set([
    ...(startStop?.type === 'zone' ? [startStop.id] : []),
    ...(endStop?.type === 'zone' ? [endStop.id] : []),
    ...intermediateStops.filter((s) => s.type === 'zone').map((s) => s.id),
  ]), [startStop, endStop, intermediateStops]);

  const availableForIntermediate = {
    attractions: availableAttractions.filter((a) => !usedAttractionIds.has(a.id)),
    zones: availableZones.filter((z) => !usedZoneIds.has(z.id)),
  };

  const includedZones = useMemo(() => {
    const includedIds = new Set([...zoneIds, ...usedZoneIds]);
    return availableZones.filter((zone) => includedIds.has(zone.id));
  }, [availableZones, zoneIds, usedZoneIds]);

  const canOptimize = !!(startStop && endStop && intermediateStops.length >= 2);
  const isSubmitting = isSaving || isDeleting || isRoutingLoading || isOptimizing;

  const isManualDrawCreation = creationMode === 'draw' && !route?.id;

// ── Formulario principal ─────────────────────────────────────────────────────
return (
  <div className="flex flex-col flex-1 min-h-0">
    <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-bright shrink-0">
      <div className="flex items-center gap-3">
        <h3 className="font-headline-lg text-headline-lg text-on-surface">
          {route?.id ? t('routes.design') : t('routes.newRoute')}
        </h3>
      </div>
      <button onClick={handleClose} className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container" type="button">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>

    <form className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 p-6" onSubmit={handleSubmit}>

      {/* Nombre */}
      <label className="flex flex-col gap-1">
        <span className="font-label-md text-label-md text-on-surface-variant">{t('routes.name')}</span>
        <input className="w-full px-3 py-2 border border-outline rounded bg-surface" type="text" value={routeName} onChange={(e) => setRouteName(e.target.value)} />
      </label>

      {/* Descripción */}
      <label className="flex flex-col gap-1">
        <span className="font-label-md text-label-md text-on-surface-variant">{t('common.description')}</span>
        <textarea className="w-full px-3 py-2 border border-outline rounded bg-surface resize-none" rows="2" value={routeDescription} onChange={(e) => setRouteDescription(e.target.value)} />
      </label>

      {/* Duración / Guía */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">{t('routes.duration')}</span>
          <input className="w-full px-3 py-2 border border-outline rounded bg-surface" type="number" min={1} value={durationHours} onChange={(e) => setDurationHours(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">{t('routes.guide')}</span>
          <input className="w-full px-3 py-2 border border-outline rounded bg-surface" type="text" value={guide} onChange={(e) => setGuide(e.target.value)} />
        </label>
      </div>

      {/* Tipo experiencia */}
      <label className="flex flex-col gap-1">
        <span className="font-label-md text-label-md text-on-surface-variant">Experiencia</span>
        <select className="w-full px-3 py-2 border border-outline rounded bg-surface" value={experienceType} onChange={(e) => setExperienceType(e.target.value)}>
          {experienceOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </label>

      {/* Estacion */}
      <div className="flex flex-col gap-2">
        <span className="font-label-md text-label-md text-on-surface-variant">Inicio de estacion</span>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-on-surface-variant">Dia</span>
            <input className="w-full px-3 py-2 border border-outline rounded bg-surface" type="number" min={1} max={31} value={startDay} onChange={(e) => setStartDay(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-on-surface-variant">Mes</span>
            <select className="w-full px-3 py-2 border border-outline rounded bg-surface" value={startMonth} onChange={(e) => setStartMonth(e.target.value)}>
              <option value=""></option>
              {months.map((month) => (
                <option key={month.id} value={month.id}>{month.lable}</option>
              ))}
            </select>
          </label>
        </div>

        <span className="font-label-md text-label-md text-on-surface-variant">Fin de estacion</span>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-on-surface-variant">Dia</span>
            <input className="w-full px-3 py-2 border border-outline rounded bg-surface" type="number" min={1} max={31} value={endDay} onChange={(e) => setEndDay(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-on-surface-variant">Mes</span>
            <select className="w-full px-3 py-2 border border-outline rounded bg-surface" value={endMonth} onChange={(e) => setEndMonth(e.target.value)}>
              <option value=""></option>
              {months.map((month) => (
                <option key={month.id} value={month.id}>{month.lable}</option>
              ))}
            </select>
          </label>
        </div>

      </div>  

      {/* ── Estado del recorrido ───────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="font-label-md text-label-md text-on-surface-variant">Estado</span>

        {!route?.id ? (
          // Nuevo recorrido: siempre pendiente
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-300 bg-blue-50">
            <span className="material-symbols-outlined text-blue-700 text-[18px]">schedule</span>
            <span className="text-sm text-blue-700 font-medium">Pendiente</span>
            <span className="text-xs text-blue-600 ml-1">— los recorridos nuevos esperan aprobación</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Badge estado actual */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit text-sm font-medium ${STATUS_STYLES[routeStatus]}`}>
              {routeStatus === 'off-season' && <span className="material-symbols-outlined text-[16px]">ac_unit</span>}
              {routeStatus === 'available' && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
              {routeStatus === 'pending' && <span className="material-symbols-outlined text-[16px]">schedule</span>}
              {routeStatus === 'cancelled' && <span className="material-symbols-outlined text-[16px]">cancel</span>}
              {STATUS_LABELS[routeStatus]}
              {routeStatus === 'off-season' && (
                <span className="text-xs font-normal">— calculado automáticamente</span>
              )}
            </div>

            {/* Transiciones permitidas */}
            {(ALLOWED_TRANSITIONS[routeStatus]?.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {ALLOWED_TRANSITIONS[routeStatus].map((next) => (
                  <button
                    key={next}
                    type="button"
                    onClick={() => setRouteStatus(next)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${routeStatus === next
                      ? STATUS_STYLES[next]
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                      }`}
                  >
                    Pasar a {STATUS_LABELS[next]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Recorrido ─────────────────────────────────────────────── */}
      {isManualDrawCreation ? (
        <div className="flex items-start gap-3 bg-surface-container p-3 rounded-lg text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">check_circle</span>
          <span>
            El recorrido manual ya quedó trazado en el mapa.
            <span className="block text-primary font-medium mt-1">Completá los datos para guardarlo.</span>
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Recorrido</span>
            <span className="text-xs text-outline border border-outline-variant rounded-full px-2 py-0.5">
              {routeMode === 'draw' ? 'Dibujado en mapa' : 'Por puntos'}
            </span>
          </div>

          {routeMode === 'draw' && (
            <div className="flex items-start gap-3 bg-surface-container p-3 rounded-lg text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">info</span>
              <span>
                Usá la herramienta de dibujo del mapa para trazar la línea.
                {geomWkt?.trim() && <span className="block text-primary font-medium mt-1">✓ Recorrido dibujado</span>}
              </span>
            </div>
          )}

          {routeMode === 'points' && (
            <div className="flex flex-col gap-4 p-3 bg-surface-container/40 rounded-xl border border-outline-variant/50">

            {/* Punto inicial */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-on-primary text-[10px] font-bold">A</span>
                </span>
                <span className="text-sm font-medium text-on-surface">Punto inicial</span>
              </div>
              <StopPicker value={startStop} onChange={setStartStop} attractions={availableAttractions} zones={availableZones} />
            </div>

            {/* Paradas intermedias */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-on-surface">
                  Paradas intermedias
                  {intermediateStops.length > 0 && (
                    <span className="ml-2 text-xs text-outline font-normal">({intermediateStops.length})</span>
                  )}
                </span>
                {canOptimize && (
                  <button
                    type="button"
                    onClick={handleOptimize}
                    disabled={isOptimizing}
                    className={`flex items-center gap-1 text-xs border rounded-full px-2.5 py-1 transition-colors disabled:opacity-60 ${isOptimized
                      ? 'bg-primary text-on-primary border-primary'
                      : 'text-primary border-primary/30 hover:bg-primary/5'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {isOptimized ? 'check' : 'auto_awesome'}
                    </span>
                    {isOptimizing ? 'Optimizando...' : isOptimized ? 'Optimizado ✓ (deshacer)' : 'Optimizar orden'}
                  </button>
                )}
              </div>

              {intermediateStops.length > 0 && (
                <div className="flex flex-col gap-1">
                  {intermediateStops.map((stop, index) => (
                    <div key={`${stop.type}-${stop.id}-${index}`} className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg border border-outline-variant/50">
                      <span className="text-[11px] text-outline w-4 text-center shrink-0">{index + 1}</span>
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant shrink-0">
                        {stop.type === 'zone' ? 'pentagon' : 'location_on'}
                      </span>
                      <span className="flex-1 text-sm text-on-surface truncate">{stop.title}</span>
                      <div className="flex gap-0.5 shrink-0">
                        <button type="button" disabled={index === 0} onClick={() => moveIntermediate(index, -1)} className="w-6 h-6 rounded hover:bg-surface-container disabled:opacity-30 flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
                        </button>
                        <button type="button" disabled={index === intermediateStops.length - 1} onClick={() => moveIntermediate(index, 1)} className="w-6 h-6 rounded hover:bg-surface-container disabled:opacity-30 flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-[13px]">arrow_downward</span>
                        </button>
                        <button type="button" onClick={() => removeIntermediate(index)} className="w-6 h-6 rounded hover:bg-error-container text-error flex items-center justify-center">
                          <span className="material-symbols-outlined text-[13px]">close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <StopPicker
                value={null}
                onChange={(stop) => stop && setIntermediateStops((s) => [...s, stop])}
                attractions={availableForIntermediate.attractions}
                zones={availableForIntermediate.zones}
                placeholder="Agregar parada intermedia..."
              />
            </div>

            {/* Punto final */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-error flex items-center justify-center shrink-0">
                  <span className="text-on-error text-[10px] font-bold">B</span>
                </span>
                <span className="text-sm font-medium text-on-surface">Punto final</span>
              </div>
              <StopPicker value={endStop} onChange={setEndStop} attractions={availableAttractions} zones={availableZones} />
            </div>
            </div>
          )}
        </div>
      )}

      {/* Zonas incluidas */}
      <div className="flex flex-col gap-2">
        <span className="font-label-md text-label-md text-on-surface-variant">Zonas incluidas (autogenerado)</span>
        <div className="max-h-28 overflow-y-auto border border-outline rounded p-2 bg-surface">
          {!includedZones.length && <p className="text-xs text-outline">Sin zonas incluidas.</p>}
          {includedZones.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-1 text-sm text-on-surface">
              <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {!!routingFeedback && (
        <p className="text-xs text-on-surface-variant">{routingFeedback}</p>
      )}
      {(validationError || apiError) && (
        <p className="text-sm text-error">{validationError || apiError}</p>
      )}

      {/* Footer */}
      <div className="sticky bottom-0 -mx-6 border-t border-outline-variant bg-surface-container-lowest px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button type="button" disabled={!route?.id || isDeleting || isSaving} onClick={handleDelete} className="w-full sm:w-auto px-4 py-2 rounded-lg border border-error text-error disabled:opacity-40">
          {isDeleting ? 'Eliminando...' : 'Eliminar'}
        </button>
        <div className="flex w-full sm:w-auto gap-3">
          <button type="button" onClick={handleClose} className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-outline text-on-surface" disabled={isSubmitting}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-primary text-on-primary disabled:opacity-60" disabled={isSubmitting}>
            {isOptimizing ? 'Optimizando...' : isRoutingLoading ? 'Calculando ruta...' : isSaving ? 'Guardando...' : t('common.save')}
          </button>
        </div>
      </div>
    </form>
  </div>
);
};

export default RouteForm;
