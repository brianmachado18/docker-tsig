import React, { useEffect, useMemo, useRef, useState } from 'react';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import WKT from 'ol/format/WKT';
import { parseLineStringWkt } from '@/shared/lib/geo/wkt';
import useAttractionsStore from '@/features/attractions/attractionsStore';
import MapCanvas from '@/features/map/MapCanvas';
import useHeatmapStore from '@/features/map/heatmapStore';
import useMapStore from '@/features/map/mapStore';
import { STATUS_COLORS, STATUS_LABELS } from '@/features/routes/routeStatus';
import useRoutesStore from '@/features/routes/routesStore';
import useZonesStore from '@/features/zones/zonesStore';
import StarRating from '@/shared/components/StarRating';
import TopAppBar from '@/shared/components/TopAppBar';
import useLangStore from '@/shared/i18n/langStore';
import { fetchAllModeRoutes } from '@/shared/lib/geo/routing';

const wktFmt = new WKT();
const GUEST_NAV_KEY = 'nav-route-guest';

const CATEGORY_ICONS = {
  MUSEO: 'museum',
  TEATRO: 'theater_comedy',
  MONUMENTO: 'account_balance',
  PLAZA: 'park',
  GASTRONOMIA: 'restaurant',
  PLAYA: 'beach_access',
  PARQUE: 'nature',
};

const CATEGORIES = [
  { value: 'MUSEO',      label: 'Museos',      icon: 'museum' },
  { value: 'PLAYA',      label: 'Playas',      icon: 'beach_access' },
  { value: 'PARQUE',     label: 'Parques',     icon: 'nature' },
  { value: 'PLAZA',      label: 'Plazas',      icon: 'park' },
  { value: 'MONUMENTO',  label: 'Monumentos',  icon: 'account_balance' },
  { value: 'GASTRONOMIA',label: 'Gastronomía', icon: 'restaurant' },
  { value: 'TEATRO',     label: 'Teatros',     icon: 'theater_comedy' },
];
const NAV_COLORS = { driving: '#1a73e8', cycling: '#2e7d32', walking: '#e65100' };

const getOrCreateNavLayer = (map) => {
  const existing = map?.getLayers?.().getArray().find((l) => l.get('layerKey') === GUEST_NAV_KEY);
  if (existing) return existing;
  const layer = new VectorLayer({
    source: new VectorSource(),
    zIndex: 60,
    properties: { layerKey: GUEST_NAV_KEY },
  });
  map.addLayer(layer);
  return layer;
};

const clearNavLayer = (map) => {
  if (!map) return;
  const layer = map.getLayers().getArray().find((l) => l.get('layerKey') === GUEST_NAV_KEY);
  if (layer) map.removeLayer(layer);
};

const drawNavRoute = (map, from, to, wkt, mode, isRoute = false) => {
  const layer = getOrCreateNavLayer(map);
  const src = layer.getSource();
  src.clear();
  const color = NAV_COLORS[mode] || NAV_COLORS.driving;

  let lineGeom;
  if (wkt) {
    try {
      lineGeom = wktFmt.readGeometry(wkt, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
    } catch { lineGeom = null; }
  }
  if (!lineGeom) lineGeom = new LineString([fromLonLat(from), fromLonLat(to)]);

  const mkStroke = (c, w) => new Style({ stroke: new Stroke({ color: c, width: w, lineCap: 'round', lineJoin: 'round' }) });
  const mkDot = (c, r) => new Style({ image: new CircleStyle({ radius: r, fill: new Fill({ color: c }), stroke: new Stroke({ color: '#fff', width: 2.5 }) }) });

  const outline = new Feature({ geometry: lineGeom });
  outline.setStyle(mkStroke('#fff', 9));
  const line = new Feature({ geometry: lineGeom.clone() });
  line.setStyle(mkStroke(color, 5));
  const userFeat = new Feature({ geometry: new Point(fromLonLat(from)) });
  userFeat.setStyle(mkDot('#1a73e8', 8));
  const destFeat = new Feature({ geometry: new Point(fromLonLat(to)) });
  destFeat.setStyle(new Style({
    image: new CircleStyle({ radius: 9, fill: new Fill({ color }), stroke: new Stroke({ color: '#fff', width: 2.5 }) }),
    text: isRoute ? new Text({
      text: 'Inicio del recorrido',
      offsetY: -18,
      font: 'bold 12px sans-serif',
      fill: new Fill({ color: '#ffffff' }),
      backgroundFill: new Fill({ color }),
      padding: [3, 6, 3, 6],
      backgroundStroke: new Stroke({ color: '#ffffff', width: 1 }),
    }) : null,
  }));

  src.addFeatures([outline, line, userFeat, destFeat]);
  const ext = src.getExtent();
  if (ext && Number.isFinite(ext[0])) {
    map.getView().fit(ext, { padding: [80, 60, 160, 60], duration: 700, maxZoom: 16 });
  }
};

const getItemDestCoords = (item, type) => {
  if (type === 'attraction') return item?.coordinates || null;
  if (type === 'route') {
    if (item?.geomWkt) {
      try {
        const geom = wktFmt.readGeometry(item.geomWkt);
        const first = geom?.getFirstCoordinate?.();
        if (first && Number.isFinite(first[0]) && Number.isFinite(first[1])) {
          return [first[0], first[1]];
        }
      } catch { /* ignore */ }
      const parsed = parseLineStringWkt(item.geomWkt);
      if (parsed?.coordinates?.[0]) return parsed.coordinates[0];
    }
    const firstCoord = item?.geometry?.coordinates?.[0];
    if (firstCoord && Number.isFinite(firstCoord[0]) && Number.isFinite(firstCoord[1])) {
      return [firstCoord[0], firstCoord[1]];
    }
    return null;
  }
  return null;
};

const fmtMins = (m) => {
  if (m == null) return '—';
  if (m < 1) return '< 1 min';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}min` : `${h}h`;
};

const getSeasonBounds = (route, startYear) => {
  const startMonth = Number(route.startMonth);
  const startDay = Number(route.startDay);
  const endMonth = Number(route.endMonth);
  const endDay = Number(route.endDay);

  if (!startMonth || !startDay || !endMonth || !endDay) {
    return null;
  }

  const crossesYear = endMonth < startMonth || (endMonth === startMonth && endDay < startDay);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(startYear + (crossesYear ? 1 : 0), endMonth - 1, endDay, 23, 59, 59, 999);
  const hasValidDates = start.getMonth() === startMonth - 1
    && start.getDate() === startDay
    && end.getMonth() === endMonth - 1
    && end.getDate() === endDay;

  return hasValidDates ? { start, end } : null;
};

const isRouteInSeasonOn = (route, date) => {
  const currentYear = date.getFullYear();
  return [currentYear - 1, currentYear].some((year) => {
    const season = getSeasonBounds(route, year);
    return season && date >= season.start && date <= season.end;
  });
};

const getMonthDayDate = (day, month, year, endOfDay = false) => {
  const numericDay = Number(day);
  const numericMonth = Number(month);
  if (!numericDay || !numericMonth) return null;

  const date = new Date(
    year,
    numericMonth - 1,
    numericDay,
    ...(endOfDay ? [23, 59, 59, 999] : []),
  );
  return date.getMonth() === numericMonth - 1 && date.getDate() === numericDay ? date : null;
};

const isRouteInSeasonOnMonthDay = (route, day, month) => {
  if (!day || !month) return true;
  const requestedDate = getMonthDayDate(day, month, 2000);
  return requestedDate ? isRouteInSeasonOn(route, requestedDate) : false;
};

const GuestPortal = () => {
  const { t, lang } = useLangStore();
  const {
    attractions,
    isLoading: isAttractionsLoading,
    error: attractionsError,
    fetchAttractions,
  } = useAttractionsStore();
  const { routes, isLoading: isRoutesLoading, error: routesError, fetchRoutes } = useRoutesStore();
  const { zones, isLoading: isZonesLoading, error: zonesError, fetchZones } = useZonesStore();
  const flyTo = useMapStore((state) => state.flyTo);
  const restoreViewport = useMapStore((state) => state.restoreViewport);
  const mapInstance = useMapStore((state) => state.mapInstance);
  const heatmapVisible = useHeatmapStore((state) => state.visible);
  const toggleHeatmap = useHeatmapStore((state) => state.toggle);
  const setHeatmapVisible = useHeatmapStore((state) => state.setVisible);
  const [routeStatusFilter, setRouteStatusFilter] = useState('all');
  const [requestedDay, setRequestedDay] = useState('');
  const [requestedMonth, setRequestedMonth] = useState('');
  const [selectedMapItem, setSelectedMapItem] = useState(null);
  const [previousMapItem, setPreviousMapItem] = useState(null);
  const [sidebarView, setSidebarView] = useState('routes');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [directionOpen, setDirectionOpen] = useState(false);
  const [directionState, setDirectionState] = useState('idle');
  const [navRoutes, setNavRoutes] = useState(null);
  const [selectedNavMode, setSelectedNavMode] = useState(null);
  const [navOrigin, setNavOrigin] = useState(null);
  const sessionIdRef = useRef(0);
  const geoTimerRef = useRef(null);

  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1),
    label: new Intl.DateTimeFormat(lang === 'es' ? 'es-UY' : 'en-US', { month: 'long' })
      .format(new Date(2000, index, 1)),
  })), [lang]);

  const routeStatusOptions = [
    { id: 'available', label: t('routes.available'), icon: 'check_circle' },
    { id: 'in-season', label: t('guest.inSeason'), icon: 'today' },
  ];

  useEffect(() => {
    fetchAttractions();
    fetchRoutes();
    fetchZones();
  }, [fetchAttractions, fetchRoutes, fetchZones]);

  useEffect(() => {
    if (selectedMapItem?.type !== 'attraction' || !selectedMapItem.item?.coordinates) {
      return;
    }

    flyTo(selectedMapItem.item.coordinates);
  }, [flyTo, selectedMapItem]);

  useEffect(() => {
    sessionIdRef.current += 1;
    clearTimeout(geoTimerRef.current);
    setDirectionOpen(false);
    setDirectionState('idle');
    setNavRoutes(null);
    setSelectedNavMode(null);
    setNavOrigin(null);
    clearNavLayer(mapInstance);
  }, [selectedMapItem, mapInstance]);

  // Apagar el mapa de calor al salir del portal (no afecta otras pantallas).
  useEffect(() => () => setHeatmapVisible(false), [setHeatmapVisible]);

  const isLoading = isAttractionsLoading || isRoutesLoading || isZonesLoading;
  const error = attractionsError || routesError || zonesError;

  const filteredRoutes = useMemo(() => {
    const today = new Date();

    return routes.filter((route) => {
      const isPublicRoute = route.status !== 'pending' && route.status !== 'cancelled';
      const statusMatch = isPublicRoute && (
        routeStatusFilter === 'all'
        || (routeStatusFilter === 'in-season'
          ? isRouteInSeasonOn(route, today)
          : route.status === routeStatusFilter)
      );
      return statusMatch && isRouteInSeasonOnMonthDay(route, requestedDay, requestedMonth);
    });
  }, [routes, routeStatusFilter, requestedDay, requestedMonth]);

  const featuredRoutes = filteredRoutes;

  const categoryCounts = useMemo(() => {
    const counts = {};
    attractions.forEach((a) => {
      const cat = String(a.category || '').toUpperCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [attractions]);

  const filteredAttractions = useMemo(() => {
    if (!selectedCategory) return attractions;
    return attractions.filter((a) => String(a.category || '').toUpperCase() === selectedCategory);
  }, [attractions, selectedCategory]);

  const zoneAttractions = useMemo(() => {
    if (selectedMapItem?.type !== 'zone') return [];
    const ids = selectedMapItem.item?.attractionIds;
    if (!Array.isArray(ids) || !ids.length) return [];
    const strIds = ids.map(String);
    return attractions.filter((a) => strIds.includes(String(a.id)));
  }, [attractions, selectedMapItem]);

  const getAttractionCategoryLabel = (category) => {
    switch (String(category || '').toUpperCase()) {
      case 'MUSEO':
      case 'MUSEUM':
        return t('attractions.museum');
      case 'TEATRO':
      case 'THEATER':
        return t('attractions.theater');
      case 'MONUMENTO':
      case 'MONUMENT':
        return t('attractions.monument');
      case 'PLAZA':
      case 'SQUARE':
        return t('attractions.square');
      case 'GASTRONOMIA':
      case 'GASTRONOMY':
        return t('attractions.gastronomy');
      case 'PLAYA':
      case 'BEACH':
        return t('attractions.beach');
      case 'PARQUE':
      case 'PARK':
        return t('attractions.park');
      default:
        return String(category || '').replace(/_/g, ' ') || t('attractions.category');
    }
  };

  const getExperienceLabel = (experienceType) => {
    switch (experienceType) {
      case 'gastronomic':
        return t('guest.gastronomic');
      case 'natural':
        return t('guest.natural');
      case 'historical':
        return t('guest.historical');
      default:
        return t('guest.cultural');
    }
  };

  const getRouteStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return t('routes.pending');
      case 'off-season':
        return t('guest.offSeason');
      case 'cancelled':
        return t('routes.cancelled');
      default:
        return t('routes.available');
    }
  };

  const getRouteStatusClassName = (status) => {
    switch (status) {
      case 'pending':
        return 'text-status-pending bg-status-pending/10';
      case 'off-season':
        return 'text-status-off-season bg-status-off-season/10';
      case 'cancelled':
        return 'text-error bg-error/10';
      default:
        return 'text-status-available bg-status-available/10';
    }
  };

  const getMapSelectionTitle = (selection) => {
    if (!selection) {
      return '';
    }
    if (selection.type === 'attraction') {
      return t('guest.selectedAttraction');
    }
    if (selection.type === 'route') {
      return t('guest.selectedRoute');
    }
    return t('guest.selectedZone');
  };

  const getMapSelectionName = (selection) => (
    selection?.item?.title || selection?.item?.name || t('common.selectItem')
  );

  const clearFilters = () => {
    setRouteStatusFilter('all');
    setRequestedDay('');
    setRequestedMonth('');
  };

  const closeMapSelection = () => {
    if (previousMapItem) {
      clearNavLayer(mapInstance);
      setSelectedMapItem(previousMapItem);
      setPreviousMapItem(null);
      return;
    }
    if (selectedMapItem?.type === 'attraction' || selectedMapItem?.type === 'route') {
      restoreViewport();
      clearNavLayer(mapInstance);
    }
    setSelectedMapItem(null);
  };

  const handleToggleDirection = () => {
    if (directionOpen) {
      setDirectionOpen(false);
      clearNavLayer(mapInstance);
      setSelectedNavMode(null);
      return;
    }

    setDirectionOpen(true);
    if (directionState !== 'idle') return;

    const coords = getItemDestCoords(selectedMapItem?.item, selectedMapItem?.type);
    if (!coords) {
      setDirectionState('no-location');
      return;
    }

    const sid = ++sessionIdRef.current;
    setDirectionState('loading');

    const timer = window.setTimeout(() => {
      if (sessionIdRef.current === sid) setDirectionState('no-location');
    }, 20000);
    geoTimerRef.current = timer;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        clearTimeout(timer);
        if (sessionIdRef.current !== sid) return;
        const origin = [pos.coords.longitude, pos.coords.latitude];
        setNavOrigin(origin);
        try {
          const modeRoutes = await fetchAllModeRoutes(origin, coords);
          if (sessionIdRef.current === sid) setNavRoutes(modeRoutes);
        } catch { /* ignore */ }
        if (sessionIdRef.current === sid) setDirectionState('ready');
      },
      () => {
        clearTimeout(timer);
        if (sessionIdRef.current === sid) setDirectionState('no-location');
      },
      { maximumAge: 300000, enableHighAccuracy: false, timeout: 15000 },
    );
  };

  const handleSelectNavMode = (mode) => {
    setSelectedNavMode(mode);
    const coords = getItemDestCoords(selectedMapItem?.item, selectedMapItem?.type);
    const isRoute = selectedMapItem?.type === 'route';
    if (!navOrigin || !coords || !mapInstance) return;
    drawNavRoute(mapInstance, navOrigin, coords, navRoutes?.[mode]?.wkt, mode, isRoute);
  };

  return (
    <div className="bg-background text-on-background h-screen overflow-hidden font-body-md flex">
      <main className="flex-1 relative flex flex-col h-full bg-surface-container-lowest">
        <TopAppBar title="GeoTravel GIS" variant="public" showGuestActions />

        <div className="absolute inset-0 z-0">
          <MapCanvas
            screenId="guestPortal"
            zones={zones}
            routes={filteredRoutes}
            attractions={sidebarView === 'attractions' ? filteredAttractions : attractions}
            onFeatureSelect={(item) => {
              setPreviousMapItem(null);
              setSelectedMapItem(item);
            }}
          />
        </div>

        {/* Toggle del mapa de calor de atracciones (por densidad). */}
        <button
          type="button"
          onClick={toggleHeatmap}
          aria-pressed={heatmapVisible}
          className={`absolute bottom-4 left-3 z-40 flex items-center gap-2 rounded-lg border px-3 py-2 font-label-md text-label-md shadow-md backdrop-blur-md transition-colors ${
            heatmapVisible
              ? 'border-primary bg-primary text-on-primary'
              : 'border-outline-variant bg-surface/90 text-on-surface hover:bg-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">whatshot</span>
          {t('guest.heatmap')}
        </button>

        {selectedMapItem && (
          <section className="absolute top-20 left-3 right-3 sm:top-24 sm:left-4 sm:right-auto z-40 sm:w-[360px] max-w-[calc(100vw-1.5rem)] flex flex-col gap-3 rounded-lg border border-primary/30 bg-surface/95 backdrop-blur-md p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="font-label-md text-label-md text-primary uppercase tracking-wider">
                  {getMapSelectionTitle(selectedMapItem)}
                </span>
                <h4 className="font-headline-md text-[18px] leading-tight text-on-surface mt-1">
                  {getMapSelectionName(selectedMapItem)}
                </h4>
              </div>
              <button
                className="shrink-0 rounded-full p-1.5 text-on-surface-variant hover:bg-surface-variant"
                type="button"
                aria-label={t('guest.closeSelection')}
                onClick={closeMapSelection}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            {selectedMapItem.type === 'attraction' && selectedMapItem.item?.imageUrl && (
              <img
                alt={getMapSelectionName(selectedMapItem)}
                className="w-full h-40 object-cover rounded-xl border border-outline-variant/40"
                src={selectedMapItem.item.imageUrl}
              />
            )}
            {selectedMapItem.item?.description && (
              <p className="font-body-md text-body-md text-on-surface-variant">
                {selectedMapItem.item.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedMapItem.type === 'attraction' && selectedMapItem.item?.category && (
                <span className="rounded-full border border-outline-variant bg-surface px-2.5 py-1 font-mono-label text-mono-label text-on-surface">
                  {getAttractionCategoryLabel(selectedMapItem.item.category)}
                </span>
              )}
              {selectedMapItem.type === 'route' && (
                <>
                  <span className="rounded-full border border-outline-variant bg-surface px-2.5 py-1 font-mono-label text-mono-label text-on-surface">
                    {getExperienceLabel(selectedMapItem.item?.experienceType)}
                  </span>
                  {selectedMapItem.item?.durationHours ? (
                    <span className="rounded-full border border-outline-variant bg-surface px-2.5 py-1 font-mono-label text-mono-label text-on-surface">
                      {selectedMapItem.item.durationHours} {t('guest.hours')}
                    </span>
                  ) : null}
                </>
              )}
              {selectedMapItem.type === 'zone' && selectedMapItem.item?.attractionLevel ? (
                <span className="rounded-full border border-outline-variant bg-surface px-2.5 py-1 font-mono-label text-mono-label text-on-surface">
                  <span className="inline-flex items-center gap-2">
                    <span>{t('guest.attractionLevel')}</span>
                    <StarRating
                      value={selectedMapItem.item.attractionLevel}
                      readonly
                      sizeClassName="text-[16px]"
                      className="gap-0.5"
                      ariaLabel={`${t('guest.attractionLevel')}: ${selectedMapItem.item.attractionLevel} de 5`}
                    />
                  </span>
                </span>
              ) : null}
              {selectedMapItem.item?.status && selectedMapItem.type !== 'zone' && (
                <span className="rounded-full border border-outline-variant bg-surface px-2.5 py-1 font-mono-label text-mono-label text-on-surface">
                  {selectedMapItem.type === 'route'
                    ? getRouteStatusLabel(selectedMapItem.item.status)
                    : selectedMapItem.item.status}
                </span>
              )}
            </div>

            {selectedMapItem.type === 'zone' && (
              <div className="pt-3 border-t border-outline-variant/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
                    Atracciones en esta zona
                  </p>
                  {zoneAttractions.length > 0 && (
                    <span className="text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded-full border border-outline-variant">
                      {zoneAttractions.length}
                    </span>
                  )}
                </div>
                {zoneAttractions.length === 0 ? (
                  <p className="text-sm text-outline">Sin atracciones en esta zona.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-0.5">
                    {zoneAttractions.map((attraction) => {
                      const cat = String(attraction.category || '').toUpperCase();
                      const icon = CATEGORY_ICONS[cat] || 'place';
                      const label = getAttractionCategoryLabel(attraction.category);
                      return (
                        <li
                          key={attraction.id}
                          className="flex items-center gap-3 rounded-lg bg-surface-container-low px-3 py-2 cursor-pointer hover:bg-surface-container transition-colors"
                          onClick={() => {
                            setPreviousMapItem(selectedMapItem);
                            setSelectedMapItem({ type: 'attraction', item: attraction });
                          }}
                        >
                          <span className="material-symbols-outlined text-[20px] text-primary shrink-0">{icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-on-surface truncate">
                              {attraction.title || `Atracción ${attraction.id}`}
                            </p>
                            <p className="text-[11px] text-on-surface-variant">{label}</p>
                          </div>
                          <span className="material-symbols-outlined text-[16px] text-outline shrink-0">chevron_right</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {(selectedMapItem.type === 'attraction' || selectedMapItem.type === 'route') && (
              <div className="pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={handleToggleDirection}
                  className={`w-full flex items-center justify-between text-sm py-1.5 px-0.5 rounded transition-colors ${
                    directionOpen ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
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
                  <div className="mt-2">
                    {directionState === 'no-location' ? (
                      <p className="text-xs text-outline text-center py-2">
                        Activa la ubicación para ver la ruta y tiempos estimados.
                      </p>
                    ) : (
                      <>
                        <p className="text-[11px] text-outline mb-2">
                          {directionState === 'loading'
                            ? 'Calculando rutas...'
                            : selectedNavMode
                              ? 'Camino dibujado en el mapa'
                              : selectedMapItem.type === 'route'
                                ? 'Toca un modo para ver el camino hasta el inicio del recorrido'
                                : 'Toca un modo para ver el camino hasta la atracción'}
                        </p>
                        <div className="flex gap-2">
                          {[
                            { mode: 'driving', icon: 'directions_car', label: 'Auto' },
                            { mode: 'cycling', icon: 'directions_bike', label: 'Bicicleta' },
                            { mode: 'walking', icon: 'directions_walk', label: 'Caminando' },
                          ].map(({ mode, icon, label }) => {
                            const color = NAV_COLORS[mode];
                            return (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => handleSelectNavMode(mode)}
                                className={`flex flex-col items-center gap-1 flex-1 py-2 px-1 rounded-xl border-2 transition-all ${
                                  selectedNavMode === mode
                                    ? 'bg-surface-container shadow-sm'
                                    : 'bg-surface-container hover:bg-surface-container-high border-transparent'
                                }`}
                                style={{ borderColor: selectedNavMode === mode ? color : 'transparent' }}
                              >
                                <span className="material-symbols-outlined text-[20px]" style={{ color }}>{icon}</span>
                                <span className="text-[10px] text-on-surface-variant leading-tight text-center">{label}</span>
                                <span className="text-xs font-semibold text-on-surface">
                                  {directionState === 'loading' ? (
                                    <span className="inline-block w-8 h-3 bg-outline-variant rounded animate-pulse" />
                                  ) : (
                                    fmtMins(navRoutes?.[mode]?.minutes)
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <aside className="absolute left-3 right-3 bottom-3 top-auto max-h-[56dvh] md:top-24 md:right-4 md:bottom-4 md:left-auto md:max-h-none md:w-[380px] z-40 bg-surface/90 backdrop-blur-md border border-outline-variant rounded-2xl flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-y-auto overscroll-contain">
          <div className="px-6 py-5 border-b border-outline-variant/30 bg-surface/50">
            <h3 className="font-headline-lg text-headline-lg text-primary">{t('guest.title')}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t('guest.subtitle')}</p>
          </div>

          {/* Tab switcher */}
          <div className="px-4 py-3 border-b border-outline-variant/30 bg-surface/30 flex gap-1.5">
            <button
              type="button"
              onClick={() => setSidebarView('routes')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                sidebarView === 'routes'
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">route</span>
              Recorridos
            </button>
            <button
              type="button"
              onClick={() => setSidebarView('attractions')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                sidebarView === 'attractions'
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">local_activity</span>
              Atracciones
            </button>
          </div>

          {sidebarView === 'routes' && (
            <div className="px-6 py-5 border-b border-outline-variant/30 bg-surface/50">
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-label-md text-label-md text-outline uppercase tracking-wider">{t('guest.filters')}</h4>
                  <button className="text-primary font-label-md text-label-md hover:underline" onClick={clearFilters}>{t('guest.clearAll')}</button>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface">{t('guest.routeStatus')}</label>
                  <div className="flex flex-wrap gap-2">
                    {routeStatusOptions.map((status) => (
                      <button
                        key={status.id}
                        className={`px-3 py-1.5 rounded-full border font-label-md text-label-md flex items-center gap-1 transition-colors ${routeStatusFilter === status.id ? `border-current ${getRouteStatusClassName(status.id)}` : 'border-outline-variant text-on-surface-variant bg-surface hover:bg-surface-variant'}`}
                        onClick={() => setRouteStatusFilter(routeStatusFilter === status.id ? 'all' : status.id)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[14px]">{status.icon}</span>
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <span className="font-label-md text-label-md text-on-surface">{t('guest.requestedDate')}</span>
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3">
                    <label className="flex flex-col gap-1 text-on-surface-variant font-label-md text-label-md">
                      {t('guest.day')}
                      <input
                        className="min-w-0 rounded-lg border border-outline-variant bg-surface px-2 py-1.5 text-on-surface"
                        type="number"
                        min="1"
                        max="31"
                        value={requestedDay}
                        onChange={(event) => setRequestedDay(event.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-on-surface-variant font-label-md text-label-md">
                      {t('guest.month')}
                      <select
                        className="min-w-0 rounded-lg border border-outline-variant bg-surface px-2 py-1.5 text-on-surface"
                        value={requestedMonth}
                        onChange={(event) => setRequestedMonth(event.target.value)}
                      >
                        <option value="" />
                        {monthOptions.map((month) => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

              </section>
            </div>
          )}
          {sidebarView === 'routes' && (
            <div className="p-6 flex flex-col gap-8">
              <section className="flex flex-col gap-4 pb-4">
                <h4 className="font-label-md text-label-md text-outline uppercase tracking-wider">{t('guest.featured')}</h4>
                {error && (
                  <div className="text-sm text-error">{t('common.error')}</div>
                )}
                {isLoading && (
                  <div className="text-sm text-outline">{t('common.loading')}</div>
                )}
                {!isLoading && featuredRoutes.length === 0 && (
                  <div className="text-sm text-outline">{t('guest.noRoutes')}</div>
                )}
                <div className="grid grid-cols-1 gap-4">
                  {featuredRoutes.map((route) => (
                    <div key={route.id} className="bg-surface rounded-xl border border-outline-variant/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                      <div className="p-4 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-3">
                          <h5 className="font-headline-md text-[16px] leading-tight text-primary font-semibold">{route.name}</h5>
                          <div
                            className="shrink-0 px-2 py-1 bg-surface-variant rounded font-mono-label text-[10px] flex items-center gap-1"
                            style={{ color: STATUS_COLORS[route.status] ?? '#9e9e9e' }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: STATUS_COLORS[route.status] ?? '#9e9e9e' }}
                            />
                            {STATUS_LABELS[route.status] || route.status}
                          </div>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">{route.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1 text-outline font-mono-label text-mono-label">
                            <span className="material-symbols-outlined text-[14px]">timer</span>
                            {route.durationHours} {t('guest.hours')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {sidebarView === 'attractions' && (
            <div className="flex flex-col min-h-0">
              <div className="px-4 py-3 border-b border-outline-variant/30 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedCategory === null
                      ? 'bg-primary text-on-primary border-primary'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  Todas
                </button>
                {CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat.value] || 0;
                  if (!count) return null;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        selectedCategory === cat.value
                          ? 'bg-primary text-on-primary border-primary'
                          : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
                      {cat.label}
                      <span className={`text-[11px] rounded-full px-1.5 ${selectedCategory === cat.value ? 'bg-white/20' : 'bg-surface-container'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 flex flex-col gap-3">
                {isAttractionsLoading && (
                  <div className="text-sm text-outline text-center py-4">{t('common.loading')}</div>
                )}
                {!isAttractionsLoading && filteredAttractions.length === 0 && (
                  <div className="text-sm text-outline text-center py-4">No hay atracciones en esta categoría.</div>
                )}
                {filteredAttractions.map((attraction) => {
                  const cat = String(attraction.category || '').toUpperCase();
                  const icon = CATEGORY_ICONS[cat] || 'place';
                  return (
                    <div
                      key={attraction.id}
                      className="flex items-center gap-3 bg-surface rounded-xl border border-outline-variant/50 p-3 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedMapItem({ type: 'attraction', item: attraction })}
                    >
                      {attraction.imageUrl ? (
                        <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-surface-container">
                          <img src={attraction.imageUrl} alt={attraction.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="shrink-0 w-14 h-14 rounded-lg bg-surface-container flex items-center justify-center">
                          <span className="material-symbols-outlined text-[26px] text-primary">{icon}</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-label-lg text-label-lg text-on-surface leading-snug truncate">
                          {attraction.title || `Atracción ${attraction.id}`}
                        </p>
                        {attraction.description && (
                          <p className="mt-0.5 text-xs text-on-surface-variant line-clamp-2">{attraction.description}</p>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-outline shrink-0">chevron_right</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

      </main>
    </div>
  );
};

export default GuestPortal;
