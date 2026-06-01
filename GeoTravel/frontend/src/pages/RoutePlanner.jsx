import React, { useEffect, useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import TopAppBar from '../components/common/TopAppBar';
import MapControls from '../components/map/MapControls';
import MapCanvas from '../components/map/MapCanvas';
import RouteForm from '../components/routes/RouteForm';
import useRoutesStore from '../store/routesStore';
import useLangStore from '../store/langStore';
import { fetchFeatures } from '../services/geoserver';
import { parseLineStringWkt } from '../services/wkt';

const normalizeKey = (key) => String(key).toLowerCase().replace(/[_-]/g, '');

const getFeatureProperty = (properties = {}, ...keys) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(properties, key) && properties[key] != null) {
      return properties[key];
    }
  }

  const normalizedProperties = Object.entries(properties).reduce((result, [key, value]) => {
    result[normalizeKey(key)] = value;
    return result;
  }, {});

  for (const key of keys) {
    const value = normalizedProperties[normalizeKey(key)];
    if (value != null) {
      return value;
    }
  }

  return undefined;
};

const toMaybeNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? value : numberValue;
};

const getFeatureId = (featureId, properties) => {
  const propertyId = getFeatureProperty(properties, 'idRecorrido', 'id_recorrido', 'id', 'gid');
  if (propertyId != null) {
    return toMaybeNumber(propertyId);
  }

  if (typeof featureId === 'string') {
    const numericSuffix = featureId.match(/(?:\.|_)(\d+)$/);
    return numericSuffix ? Number(numericSuffix[1]) : featureId;
  }

  return featureId;
};

const toIdArray = (value) => {
  if (Array.isArray(value)) {
    return value.map(toMaybeNumber).filter((item) => item != null);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => toMaybeNumber(item.trim()))
      .filter((item) => item != null);
  }

  const id = toMaybeNumber(value);
  return id == null ? [] : [id];
};

const statusFromGeoServer = (status) => {
  const normalized = String(status || '').trim();
  if (['available', 'pending', 'off-season', 'cancelled'].includes(normalized)) {
    return normalized;
  }

  switch (normalized.toUpperCase()) {
    case 'FUERA_DE_ESTACION':
      return 'off-season';
    case 'PENDIENTE':
      return 'pending';
    case 'CANCELADO':
      return 'cancelled';
    default:
      return 'available';
  }
};

const experienceFromGeoServer = (type) => {
  const normalized = String(type || '').trim();
  if (['cultural', 'gastronomic', 'natural', 'historical', 'adventure', 'other'].includes(normalized)) {
    return normalized;
  }

  switch (normalized.toUpperCase()) {
    case 'GASTRONOMICO':
      return 'gastronomic';
    case 'NATURAL':
      return 'natural';
    case 'HITORICA':
    case 'HISTORICA':
      return 'historical';
    case 'AVENTURA':
      return 'adventure';
    case 'OTRO':
      return 'other';
    default:
      return 'cultural';
  }
};

const lineStringToWkt = (geometry) => {
  if (!geometry || geometry.type !== 'LineString' || !Array.isArray(geometry.coordinates)) {
    return '';
  }

  const coordinates = geometry.coordinates
    .map((coordinate) => `${coordinate[0]} ${coordinate[1]}`)
    .join(', ');

  return `LINESTRING(${coordinates})`;
};

const mapGeoServerRoute = (feature) => {
  const properties = feature.properties || {};
  const geomWkt = getFeatureProperty(properties, 'geomWkt', 'geom_wkt') || lineStringToWkt(feature.geometry);
  const stationId = getFeatureProperty(properties, 'stationId', 'idEstacion', 'id_estacion');
  const zoneIds = getFeatureProperty(properties, 'zoneIds', 'zonas');
  const attractionIds = getFeatureProperty(properties, 'attractionIds', 'atracciones');

  return {
    id: getFeatureId(feature.id, properties),
    stationId: toMaybeNumber(stationId),
    name: getFeatureProperty(properties, 'name', 'nombre') || '',
    description: getFeatureProperty(properties, 'description', 'descripcion') || '',
    durationHours: Number(getFeatureProperty(properties, 'durationHours', 'duracionEstimada', 'duracion_estimada')) || 0,
    guide: getFeatureProperty(properties, 'guide', 'guiaResponsable', 'guia_responsable') || '',
    experienceType: experienceFromGeoServer(
      getFeatureProperty(properties, 'experienceType', 'tipoExperiencia', 'tipo_experiencia')
    ),
    status: statusFromGeoServer(getFeatureProperty(properties, 'status', 'estado')),
    geomWkt,
    geometry: feature.geometry || parseLineStringWkt(geomWkt),
    zoneIds: toIdArray(zoneIds),
    attractionIds: toIdArray(attractionIds),
  };
};

const RoutePlanner = () => {
  const {
    selectedRoute,
    isFormOpen,
    openForm,
    closeForm,
  } = useRoutesStore();
  const { t } = useLangStore();
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRoutesFromGeoServer = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const features = await fetchFeatures('routes');
        if (isMounted) {
          setRoutes(features.map(mapGeoServerRoute));
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError);
          setRoutes([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRoutesFromGeoServer();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md overflow-hidden h-screen w-screen flex">
      <Sidebar activeItem="routes" />

      <main className="ml-[360px] flex-1 relative h-full bg-surface-dim">
        <TopAppBar title="Route Planner" />
        <MapCanvas screenId="routePlanner" routes={routes} />
        {/* 
        <section className="absolute top-24 left-20 z-30 w-[380px] bg-surface/95 backdrop-blur border border-outline-variant rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-surface">{t('common.routes')}</h3>
            <button
              onClick={() => openForm(null)}
              className="px-3 py-1.5 rounded bg-primary text-on-primary text-sm"
              type="button"
            >
              {t('routes.newRoute')}
            </button>
          </div>
          <div className="max-h-[56vh] overflow-y-auto">
            {isLoading && <p className="p-3 text-sm text-outline">{t('common.loading')}</p>}
            {error && <p className="p-3 text-sm text-error">{error.details || error.message || t('common.error')}</p>}
            {!isLoading && !routes.length && <p className="p-3 text-sm text-outline">Sin recorridos.</p>}
            {routes.map((route) => (
              <div key={route.id} className="px-4 py-3 border-b border-outline-variant/40 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-on-surface truncate">{route.name}</p>
                  <p className="text-xs text-outline">{route.status}</p>
                </div>
                <button
                  type="button"
                  className="px-2 py-1 rounded border border-outline text-sm"
                  onClick={() => openForm(route)}
                >
                  {t('common.edit')}
                </button>
              </div>
            ))}
          </div>
        </section>
 */}
        <MapControls />

        {!isFormOpen && (
          <button
            onClick={() => openForm()}
            className="absolute bottom-8 right-8 z-30 bg-primary text-on-primary shadow-lg hover:shadow-xl transition-all rounded-full px-6 py-4 flex items-center gap-2 font-label-lg font-bold"
            type="button"
          >
            <span className="material-symbols-outlined">add</span>
            {t('routes.newRoute')}
          </button>
        )}

        {isFormOpen && <RouteForm route={selectedRoute} onClose={closeForm} />}
      </main>
    </div>
  );
};

export default RoutePlanner;
