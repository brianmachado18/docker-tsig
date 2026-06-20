import Feature from 'ol/Feature';
import WKT from 'ol/format/WKT';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import useAttractionsStore from '@/features/attractions/attractionsStore';
import useMapStore from '@/features/map/mapStore';
import useMapPopupStore from '@/features/map/mapPopupStore';
import { STATUS_COLORS, STATUS_LABELS } from '@/features/routes/routeStatus';
import { routesService } from '@/features/routes/routesService';
import useRoutesStore from '@/features/routes/routesStore';
import { fetchAllModeRoutes } from '@/shared/lib/geo/routing';
import { parseLineStringWkt } from '@/shared/lib/geo/wkt';

const wktFormat = new WKT();
const NAV_LAYER_KEY = 'nav-route-popup';

const CATEGORY_LABELS = {
  // Clasificacion (atracciones)
  MUSEO: 'Museo',
  TEATRO: 'Teatro',
  MONUMENTO: 'Monumento',
  PLAZA: 'Plaza',
  GASTRONOMIA: 'Gastronomía',
  PLAYA: 'Playa',
  PARQUE: 'Parque',
  // TipoExperiencia (recorridos)
  CULTURAL: 'Cultural',
  GASTRONOMICO: 'Gastronómico',
  NATURAL: 'Natural',
  HISTORICA: 'Histórica',
  HITORICA: 'Histórica',
  AVENTURA: 'Aventura',
  OTRO: 'Otro',
};

const NEXT_STATUS = {
  pending: 'available',
  available: 'cancelled',
  cancelled: 'pending',
};

const TRANSITION_CONFIG = {
  pending: { label: 'Marcar como disponible', icon: 'check_circle' },
  available: { label: 'Cancelar recorrido', icon: 'cancel' },
  cancelled: { label: 'Reactivar recorrido', icon: 'undo' },
};

const MODE_COLORS = {
  driving: '#1a73e8',
  cycling: '#2e7d32',
  walking: '#e65100',
};

const makeRouteStyles = (color) => ({
  outline: new Style({
    stroke: new Stroke({ color: '#ffffff', width: 9, lineCap: 'round', lineJoin: 'round' }),
  }),
  line: new Style({
    stroke: new Stroke({ color, width: 5, lineCap: 'round', lineJoin: 'round' }),
  }),
});

const userDotStyle = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: '#1a73e8' }),
    stroke: new Stroke({ color: '#ffffff', width: 2.5 }),
  }),
});

const makeDotStyle = (color) =>
  new Style({
    image: new CircleStyle({
      radius: 9,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#ffffff', width: 2.5 }),
    }),
  });

const formatMinutes = (min) => {
  if (min === null || min === undefined) return '—';
  if (min < 1) return '< 1 min';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
};

const formatDate = (value) => {
  if (!value) return '';
  const raw = String(value).split('T')[0];
  const parts = raw.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return String(value);
};

const getDestCoords = (entity, entityType) => {
  if (entityType === 'attraction') return entity.coordinates || null;

  if (entityType === 'route' && entity.geomWkt) {
    try {
      const geom = wktFormat.readGeometry(entity.geomWkt);
      const first = geom?.getFirstCoordinate?.();
      if (first && Number.isFinite(first[0]) && Number.isFinite(first[1])) {
        return [first[0], first[1]];
      }
    } catch {
      // fallback abajo
    }

    const parsed = parseLineStringWkt(entity.geomWkt);
    return parsed?.coordinates?.[0] || null;
  }

  return null;
};

const getOrCreateNavLayer = (map) => {
  const existing = map?.getLayers?.().getArray().find((layer) => layer.get('layerKey') === NAV_LAYER_KEY);
  if (existing) return existing;

  const layer = new VectorLayer({
    source: new VectorSource(),
    zIndex: 60,
    properties: { layerKey: NAV_LAYER_KEY },
  });
  map.addLayer(layer);
  return layer;
};

const removeNavLayer = (map) => {
  if (!map) return;
  const layer = map.getLayers().getArray().find((item) => item.get('layerKey') === NAV_LAYER_KEY);
  if (layer) {
    map.removeLayer(layer);
  }
};

const renderNavRoute = (map, userCoords, destCoords, routeWkt, mode, isRoute = false) => {
  const layer = getOrCreateNavLayer(map);
  const source = layer.getSource();
  source.clear();

  const color = MODE_COLORS[mode] || MODE_COLORS.driving;
  const { outline, line } = makeRouteStyles(color);

  let lineGeom;
  if (routeWkt) {
    try {
      lineGeom = wktFormat.readGeometry(routeWkt, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
    } catch {
      lineGeom = null;
    }
  }

  if (!lineGeom) {
    lineGeom = new LineString([fromLonLat(userCoords), fromLonLat(destCoords)]);
  }

  const outlineFeat = new Feature({ geometry: lineGeom });
  outlineFeat.setStyle(outline);

  const lineFeat = new Feature({ geometry: lineGeom.clone() });
  lineFeat.setStyle(line);

  const userFeat = new Feature({ geometry: new Point(fromLonLat(userCoords)) });
  userFeat.setStyle(userDotStyle);

  const destFeat = new Feature({ geometry: new Point(fromLonLat(destCoords)) });
  destFeat.setStyle(
    new Style({
      image: makeDotStyle(color).getImage(),
      text: isRoute
        ? new Text({
          text: 'Inicio del recorrido',
          offsetY: -18,
          font: 'bold 12px sans-serif',
          fill: new Fill({ color: '#ffffff' }),
          backgroundFill: new Fill({ color }),
          padding: [3, 6, 3, 6],
          backgroundStroke: new Stroke({ color: '#ffffff', width: 1 }),
        })
        : null,
    }),
  );

  source.addFeatures([outlineFeat, lineFeat, userFeat, destFeat]);

  const extent = source.getExtent();
  if (extent && Number.isFinite(extent[0])) {
    map.getView().fit(extent, {
      padding: [80, 60, 160, 60],
      duration: 700,
      maxZoom: 16,
    });
  }
};

const TimeCard = ({ icon, label, minutes, loading, mode, selected, onClick }) => {
  const color = MODE_COLORS[mode];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 flex-1 py-3 px-1 rounded-xl transition-all border-2 ${selected
          ? 'bg-surface-container shadow-sm scale-[1.03]'
          : 'bg-surface-container hover:bg-surface-container-high border-transparent'
        }`}
      style={{ borderColor: selected ? color : 'transparent' }}
    >
      <span className="material-symbols-outlined text-[22px]" style={{ color }}>
        {icon}
      </span>
      <span className="text-[10px] text-on-surface-variant leading-tight text-center">{label}</span>
      <span className="text-sm font-semibold text-on-surface">
        {loading ? (
          <span className="inline-block w-8 h-4 bg-outline-variant rounded animate-pulse" />
        ) : (
          formatMinutes(minutes)
        )}
      </span>
    </button>
  );
};

const MapFeaturePopup = ({ editable = true }) => {
  const { isOpen, entity, entityType, closePopup } = useMapPopupStore();
  const openAttractionForm = useAttractionsStore((state) => state.openForm);
  const deleteAttraction = useAttractionsStore((state) => state.deleteAttraction);
  const openRouteForm = useRoutesStore((state) => state.openForm);
  const deleteRoute = useRoutesStore((state) => state.deleteRoute);
  const fetchRoutes = useRoutesStore((state) => state.fetchRoutes);
  const refreshMapLayer = useMapStore((state) => state.refreshMapLayer);
  const mapInstance = useMapStore((state) => state.mapInstance);
  const restoreViewport = useMapStore((state) => state.restoreViewport);

  const [localStatus, setLocalStatus] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [directionOpen, setDirectionOpen] = useState(false);
  const [directionState, setDirectionState] = useState('idle');
  const [navRoutes, setNavRoutes] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const sessionIdRef = useRef(0);
  const geoTimerRef = useRef(null);

  const isRoute = entityType === 'route';
  const isAttraction = entityType === 'attraction';
  const displayStatus = localStatus ?? entity?.status;
  const title = entity?.title || entity?.name || 'Elemento';
  const showRouteActions = editable && isRoute;
  const showAttractionActions = editable && isAttraction;

  const subtitle = useMemo(() => {
    if (!entity) return '';

    if (isRoute) {
      return STATUS_LABELS[displayStatus] || displayStatus || 'Disponible';
    }

    return CATEGORY_LABELS[String(entity.category || '').toUpperCase()] || entity.category || 'Atracción';
  }, [displayStatus, entity, isRoute]);

  const subtitleColor = isRoute ? STATUS_COLORS[displayStatus] || '#6b7280' : '#6b7280';
  const description = entity?.description || '';
  const transitionCfg = TRANSITION_CONFIG[displayStatus];
  const nextStatus = NEXT_STATUS[displayStatus];
  const modeColor = MODE_COLORS[selectedMode] ?? '#9e9e9e';

  useEffect(() => {
    sessionIdRef.current += 1;
    clearTimeout(geoTimerRef.current);
    setLocalStatus(null);
    setIsTransitioning(false);
    setHistoryOpen(false);
    setHistoryEntries(null);
    setHistoryLoading(false);
    setConfirmDelete(false);
    setIsDeleting(false);
    setDirectionOpen(false);
    setDirectionState('idle');
    setNavRoutes(null);
    setSelectedMode(null);
    setUserCoords(null);

    if (!isOpen || !entity) {
      removeNavLayer(mapInstance);
    }

    return () => {
      clearTimeout(geoTimerRef.current);
    };
  }, [entity, isOpen, mapInstance]);

  if (!isOpen || !entity) {
    return null;
  }

  const handleClose = () => {
    sessionIdRef.current += 1;
    clearTimeout(geoTimerRef.current);
    removeNavLayer(mapInstance);
    setConfirmDelete(false);
    setIsDeleting(false);
    restoreViewport();
    closePopup();
  };

  const handleEdit = () => {
    handleClose();
    if (isRoute) {
      openRouteForm(entity);
      return;
    }
    openAttractionForm(entity);
  };

  const handleDelete = async () => {
    if (!entity?.id || isDeleting) {
      return;
    }

    setIsDeleting(true);
    const ok = isRoute ? await deleteRoute(entity.id) : await deleteAttraction(entity.id);

    setIsDeleting(false);
    if (!ok) {
      return;
    }

    refreshMapLayer(isRoute ? 'routes-wfs' : 'attractions-wfs');
    handleClose();
  };

  const deleteDialogTitle = isRoute ? 'Eliminar recorrido' : 'Eliminar atracción';
  const deleteDialogDescription = isRoute
    ? '¿Estás seguro? Esta acción no se puede deshacer.'
    : '¿Estás seguro de eliminar esta atracción? Esta acción no se puede deshacer.';

  const handleStatusTransition = async () => {
    if (!entity?.id || isTransitioning || !nextStatus) {
      return;
    }

    const previousStatus = displayStatus;
    setLocalStatus(nextStatus);
    setIsTransitioning(true);

    try {
      await routesService.changeStatus(entity.id, nextStatus);

      if (historyEntries !== null) {
        const today = new Date().toISOString().split('T')[0];
        setHistoryEntries((prev) => [
          {
            id: `local-${Date.now()}`,
            status: nextStatus,
            date: today,
          },
          ...(Array.isArray(prev) ? prev : []),
        ]);
      }

      try {
        await fetchRoutes();
      } catch {
        // el backend ya quedó consistente; no revertimos la UI por un refresh fallido
      }

      refreshMapLayer('routes-wfs');
    } catch {
      setLocalStatus(previousStatus);
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleToggleDirection = () => {
    if (directionOpen) {
      setDirectionOpen(false);
      removeNavLayer(mapInstance);
      setSelectedMode(null);
      return;
    }

    setDirectionOpen(true);
    if (directionState !== 'idle') {
      return;
    }

    const dest = getDestCoords(entity, entityType);
    if (!dest) {
      setDirectionState('no-location');
      return;
    }

    const mySession = sessionIdRef.current;
    setDirectionState('loading');

    const timer = window.setTimeout(() => {
      if (sessionIdRef.current === mySession) {
        setDirectionState('no-location');
      }
    }, 20000);
    geoTimerRef.current = timer;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        clearTimeout(timer);
        if (sessionIdRef.current !== mySession) return;

        const origin = [pos.coords.longitude, pos.coords.latitude];
        setUserCoords(origin);

        try {
          const modeRoutes = await fetchAllModeRoutes(origin, dest);
          if (sessionIdRef.current !== mySession) return;
          setNavRoutes(modeRoutes);
        } catch {
          // si falla el servicio, dejamos igual la UI con fallback a línea recta
        }

        if (sessionIdRef.current === mySession) {
          setDirectionState('ready');
        }
      },
      () => {
        clearTimeout(timer);
        if (sessionIdRef.current === mySession) {
          setDirectionState('no-location');
        }
      },
      { maximumAge: 300000, enableHighAccuracy: false },
    );
  };

  const handleSelectMode = (mode) => {
    setSelectedMode(mode);
    const dest = getDestCoords(entity, entityType);
    if (!userCoords || !dest || !mapInstance) {
      return;
    }

    renderNavRoute(mapInstance, userCoords, dest, navRoutes?.[mode]?.wkt, mode, isRoute);
  };

  const handleToggleHistory = async () => {
    if (!showRouteActions) {
      return;
    }

    if (historyOpen) {
      setHistoryOpen(false);
      return;
    }

    setHistoryOpen(true);
    if (historyEntries !== null) {
      return;
    }

    setHistoryLoading(true);
    try {
      const entries = await routesService.getHistory(entity.id);
      setHistoryEntries(entries);
    } catch {
      setHistoryEntries([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (selectedMode) {
    return (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[340px] max-w-[calc(100vw-2rem)] bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant overflow-hidden">
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          <button
            type="button"
            onClick={() => setSelectedMode(null)}
            className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <p className="flex-1 font-semibold text-on-surface truncate text-sm">{title}</p>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="flex gap-2 px-3 pb-3">
          <TimeCard
            icon="directions_car"
            label="Auto"
            mode="driving"
            minutes={navRoutes?.driving?.minutes}
            selected={selectedMode === 'driving'}
            onClick={() => handleSelectMode('driving')}
          />
          <TimeCard
            icon="directions_bike"
            label="Bicicleta"
            mode="cycling"
            minutes={navRoutes?.cycling?.minutes}
            selected={selectedMode === 'cycling'}
            onClick={() => handleSelectMode('cycling')}
          />
          <TimeCard
            icon="directions_walk"
            label="Caminando"
            mode="walking"
            minutes={navRoutes?.walking?.minutes}
            selected={selectedMode === 'walking'}
            onClick={() => handleSelectMode('walking')}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[340px] max-w-[calc(100vw-2rem)] bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant overflow-hidden">
        <div className="flex items-start justify-between px-4 pt-4 pb-3 gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-on-surface truncate text-[15px] leading-tight">{title}</p>
            <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: subtitleColor }} />
              <span className="capitalize">{subtitle}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {entityType === 'attraction' && entity.imageUrl && (
          <div className="px-4 pb-3">
            <img
              src={entity.imageUrl}
              alt={title}
              className="w-full h-40 object-cover rounded-lg"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        )}

        {!!description && (
          <div className="px-4 pb-3">
            <p className="text-sm text-on-surface-variant line-clamp-3">{description}</p>
          </div>
        )}

        {showRouteActions && (
          <div className="border-t border-outline-variant">
            {transitionCfg && nextStatus && (
              <button
                type="button"
                onClick={handleStatusTransition}
                disabled={isTransitioning}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ color: STATUS_COLORS[nextStatus] || '#6b7280' }}
              >
                {isTransitioning ? (
                  <span className="inline-block w-4 h-4 border-2 rounded-full border-current border-t-transparent animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">{transitionCfg.icon}</span>
                )}
                {transitionCfg.label}
              </button>
            )}

            <div className="flex items-center border-t border-outline-variant/60 divide-x divide-outline-variant/60">
              <button
                type="button"
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Editar
              </button>

              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Eliminar
              </button>

              <button
                type="button"
                onClick={handleToggleHistory}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-colors ${historyOpen ? 'text-primary bg-primary/5' : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">history</span>
                Historial
                <span
                  className="material-symbols-outlined text-[14px] transition-transform"
                  style={{ transform: historyOpen ? 'rotate(180deg)' : 'none' }}
                >
                  expand_more
                </span>
              </button>
            </div>

            {historyOpen && (
              <div className="border-t border-outline-variant/60 px-4 py-3 max-h-40 overflow-y-auto">
                {historyLoading ? (
                  <p className="text-xs text-outline text-center py-1 animate-pulse">Cargando historial...</p>
                ) : !historyEntries?.length ? (
                  <p className="text-xs text-outline text-center py-1">Sin cambios registrados</p>
                ) : (
                  <ul className="space-y-2">
                    {historyEntries.map((entry) => (
                      <li key={entry.id} className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: STATUS_COLORS[entry.status] ?? '#9e9e9e' }}
                        />
                        <span className="text-xs text-on-surface flex-1">
                          {STATUS_LABELS[entry.status] || entry.status}
                        </span>
                        <span className="text-[11px] text-outline">{formatDate(entry.date)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {showAttractionActions && (
          <div className="border-t border-outline-variant px-4 py-3">
            <div className="flex items-center divide-x divide-outline-variant/60 rounded-lg border border-outline-variant/60 overflow-hidden">
              <button
                type="button"
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Editar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Eliminar
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-outline-variant">
          <button
            type="button"
            onClick={handleToggleDirection}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${directionOpen ? 'text-primary bg-primary/5' : 'text-on-surface-variant hover:bg-surface-container'
              }`}
          >
            <span className="flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-[18px]">directions</span>
              ¿Cómo llegar?
            </span>
            <span
              className="material-symbols-outlined text-[18px] transition-transform"
              style={{ transform: directionOpen ? 'rotate(180deg)' : 'none' }}
            >
              expand_more
            </span>
          </button>

          {directionOpen && (
            <div className="px-4 pb-4">
              {directionState === 'no-location' ? (
                <p className="text-xs text-outline text-center py-2">
                  Activa la ubicación para ver la ruta y tiempos estimados.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors"
                      style={{ backgroundColor: directionState === 'loading' ? '#9e9e9e' : modeColor }}
                    />
                    <p className="text-[11px] text-outline">
                      {directionState === 'loading'
                        ? 'Calculando rutas...'
                        : selectedMode
                          ? 'Camino dibujado en el mapa'
                          : 'Toca un modo para ver el camino hasta el inicio'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <TimeCard
                      icon="directions_car"
                      label="Auto"
                      mode="driving"
                      minutes={navRoutes?.driving?.minutes}
                      loading={directionState === 'loading'}
                      selected={selectedMode === 'driving'}
                      onClick={() => handleSelectMode('driving')}
                    />
                    <TimeCard
                      icon="directions_bike"
                      label="Bicicleta"
                      mode="cycling"
                      minutes={navRoutes?.cycling?.minutes}
                      loading={directionState === 'loading'}
                      selected={selectedMode === 'cycling'}
                      onClick={() => handleSelectMode('cycling')}
                    />
                    <TimeCard
                      icon="directions_walk"
                      label="Caminando"
                      mode="walking"
                      minutes={navRoutes?.walking?.minutes}
                      loading={directionState === 'loading'}
                      selected={selectedMode === 'walking'}
                      onClick={() => handleSelectMode('walking')}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (showRouteActions || showAttractionActions) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !isDeleting && setConfirmDelete(false)}
          />
          <div className="relative z-10 bg-surface-container-lowest rounded-2xl p-5 shadow-2xl border border-outline-variant w-[280px] mx-4">
            <p className="font-semibold text-on-surface text-[15px] mb-1">{deleteDialogTitle}</p>
            <p className="text-sm text-on-surface-variant mb-5">{deleteDialogDescription}</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 rounded-xl border border-outline text-sm text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                )}
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MapFeaturePopup;
