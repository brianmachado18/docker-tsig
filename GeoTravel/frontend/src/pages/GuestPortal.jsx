import React, { useEffect, useMemo, useState } from 'react';
import MapCanvas from '../components/map/MapCanvas';
import MapControls from '../components/map/MapControls';
import TopAppBar from '../components/common/TopAppBar';
import useLangStore from '../store/langStore';
import { fetchFeatures } from '../services/geoserver';
import { parseLineStringWkt, parsePointWkt, toPointWkt } from '../services/wkt';

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

const getFeatureId = (featureId, properties, ...propertyKeys) => {
  const propertyId = getFeatureProperty(properties, ...propertyKeys, 'id', 'gid');
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

const getPointCoordinates = (geometry, geomWkt) => {
  if (geometry?.type === 'Point' && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates;
  }

  return parsePointWkt(geomWkt);
};

const mapGeoServerRoute = (feature) => {
  const properties = feature.properties || {};
  const geomWkt = getFeatureProperty(properties, 'geomWkt', 'geom_wkt') || lineStringToWkt(feature.geometry);
  const stationId = getFeatureProperty(properties, 'stationId', 'idEstacion', 'id_estacion');
  const zoneIds = getFeatureProperty(properties, 'zoneIds', 'zonas');
  const attractionIds = getFeatureProperty(properties, 'attractionIds', 'atracciones');

  return {
    id: getFeatureId(feature.id, properties, 'idRecorrido', 'id_recorrido'),
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

const mapGeoServerAttraction = (feature) => {
  const properties = feature.properties || {};
  const geomWkt = getFeatureProperty(properties, 'geomWkt', 'geom_wkt') || '';
  const coordinates = getPointCoordinates(feature.geometry, geomWkt);

  return {
    id: getFeatureId(feature.id, properties, 'idAtraccion', 'id_atraccion'),
    title: getFeatureProperty(properties, 'title', 'name', 'nombre') || '',
    description: getFeatureProperty(properties, 'description', 'descripcion') || '',
    category: getFeatureProperty(properties, 'category', 'clasificacion') || 'OTRO',
    imageUrl: getFeatureProperty(properties, 'imageUrl', 'fotoUrl', 'foto_url') || '',
    coordinates,
    longitude: coordinates?.[0] ?? '',
    latitude: coordinates?.[1] ?? '',
    geomWkt: geomWkt || (coordinates ? toPointWkt(coordinates[0], coordinates[1]) : ''),
    status: getFeatureProperty(properties, 'status', 'estado') || 'active',
  };
};

const GuestPortal = () => {
  const { t } = useLangStore();
  const [attractions, setAttractions] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;

    const fetchGuestDataFromGeoServer = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [routeFeatures, attractionFeatures] = await Promise.all([
          fetchFeatures('routes'),
          fetchFeatures('attractions'),
        ]);

        if (isMounted) {
          setRoutes(routeFeatures.map(mapGeoServerRoute));
          setAttractions(attractionFeatures.map(mapGeoServerAttraction));
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError);
          setRoutes([]);
          setAttractions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchGuestDataFromGeoServer();

    return () => {
      isMounted = false;
    };
  }, []);


  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const availabilityMatch = availabilityFilter === 'all' || route.status === availabilityFilter;
      const experienceMatch = experienceFilter === 'all' || route.experienceType === experienceFilter;
      return availabilityMatch && experienceMatch;
    });
  }, [routes, availabilityFilter, experienceFilter]);

  const featuredRoutes = filteredRoutes//.slice(0, 2);
  const mapAttractions = attractions//.slice(0, 4);

  const clearFilters = () => {
    setAvailabilityFilter('all');
    setExperienceFilter('all');
  };

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md overflow-hidden h-screen w-screen flex">
      <main className="flex-1 relative h-full bg-surface-dim map-pattern">
        <TopAppBar title="GeoTravel GIS" variant="public" showGuestActions />

        <div className="absolute inset-0 z-0">
          <MapCanvas screenId="guestPortal" routes={featuredRoutes} attractions={mapAttractions} />
        </div>
        <MapControls />

        <aside className="absolute top-24 right-8 bottom-8 w-[380px] z-40 bg-surface/95 backdrop-blur border border-outline-variant rounded-xl flex flex-col shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant bg-surface/95">
            <h3 className="font-headline-lg text-headline-lg text-primary">{t('guest.title')}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t('guest.subtitle')}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="font-label-md text-label-md text-outline uppercase tracking-wider">{t('guest.filters')}</h4>
                <button className="text-primary font-label-md text-label-md hover:underline" onClick={clearFilters}>{t('guest.clearAll')}</button>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface">{t('guest.availability')}</label>
                <div className="flex gap-2">
                  <button
                    className={`px-4 py-1.5 rounded-full border font-label-md text-label-md flex items-center gap-1 transition-colors ${availabilityFilter === 'available' ? 'border-status-available text-status-available bg-status-available/10' : 'border-outline-variant text-on-surface-variant bg-surface hover:bg-surface-variant'}`}
                    onClick={() => setAvailabilityFilter(availabilityFilter === 'available' ? 'all' : 'available')}
                  >
                    <span className="material-symbols-outlined text-[14px]">check_circle</span> {t('guest.available')}
                  </button>
                  <button
                    className={`px-4 py-1.5 rounded-full border font-label-md text-label-md flex items-center gap-1 transition-colors ${availabilityFilter === 'off-season' ? 'border-status-off-season text-status-off-season bg-status-off-season/10' : 'border-outline-variant text-on-surface-variant bg-surface hover:bg-surface-variant'}`}
                    onClick={() => setAvailabilityFilter(availabilityFilter === 'off-season' ? 'all' : 'off-season')}
                  >
                    <span className="material-symbols-outlined text-[14px]">schedule</span> {t('guest.offSeason')}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <label className="font-label-md text-label-md text-on-surface">{t('guest.experienceType')}</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'cultural', label: t('guest.cultural') },
                    { id: 'gastronomic', label: t('guest.gastronomic') },
                    { id: 'natural', label: t('guest.natural') },
                    { id: 'historical', label: t('guest.historical') },
                  ].map((type) => (
                    <button
                      key={type.id}
                      className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${experienceFilter === type.id ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface border border-outline-variant text-on-surface hover:bg-surface-variant'}`}
                      onClick={() => setExperienceFilter(experienceFilter === type.id ? 'all' : type.id)}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <hr className="border-outline-variant/30" />

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
                  <div key={route.id} className="bg-surface rounded-xl overflow-hidden border border-outline-variant/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="h-32 w-full relative overflow-hidden bg-surface-variant flex items-center justify-center">
                      <span className="material-symbols-outlined text-[48px] text-outline opacity-20">landscape</span>
                      <div className="absolute top-2 right-2 px-2 py-1 bg-surface/90 backdrop-blur rounded font-mono-label text-[10px] text-status-available flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-available"></span>
                        {route.status}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-2">
                      <h5 className="font-headline-md text-[16px] leading-tight text-primary font-semibold">{route.name}</h5>
                      <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">{route.description}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1 text-outline font-mono-label text-mono-label">
                          <span className="material-symbols-outlined text-[14px]">map</span>
                          {route.stops?.length || 0} {t('guest.stops')}
                        </span>
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
        </aside>

      </main>
    </div>
  );
};

export default GuestPortal;
