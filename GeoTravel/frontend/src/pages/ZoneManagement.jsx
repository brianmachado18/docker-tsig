import React, { useEffect, useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import TopAppBar from '../components/common/TopAppBar';
import MapControls from '../components/map/MapControls';
import MapCanvas from '../components/map/MapCanvas';
import ZoneForm from '../components/zones/ZoneForm';
import useZonesStore from '../store/zonesStore';
import useLangStore from '../store/langStore';
import { fetchFeatures } from '../services/geoserver';

const getFeatureProperty = (properties = {}, ...keys) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(properties, key) && properties[key] != null) {
      return properties[key];
    }
  }

  const normalizedProperties = Object.entries(properties).reduce((result, [key, value]) => {
    result[key.toLowerCase()] = value;
    return result;
  }, {});

  for (const key of keys) {
    const value = normalizedProperties[key.toLowerCase()];
    if (value != null) {
      return value;
    }
  }

  return undefined;
};

const getFeatureId = (featureId, properties) => {
  const propertyId = getFeatureProperty(properties, 'idZona', 'id_zona', 'id', 'gid');
  if (propertyId != null) {
    return propertyId;
  }

  if (typeof featureId === 'string') {
    const numericSuffix = featureId.match(/(?:\.|_)(\d+)$/);
    return numericSuffix ? Number(numericSuffix[1]) : featureId;
  }

  return featureId;
};

const getRouteIds = (properties) => {
  const routes = getFeatureProperty(properties, 'routeIds', 'recorridos', 'routes');
  if (Array.isArray(routes)) {
    return routes;
  }
  if (typeof routes === 'string') {
    return routes
      .split(',')
      .map((routeId) => routeId.trim())
      .filter(Boolean)
      .map((routeId) => (Number.isNaN(Number(routeId)) ? routeId : Number(routeId)));
  }
  return [];
};

const polygonToWkt = (geometry) => {
  if (!geometry || geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates?.[0])) {
    return '';
  }

  const outerRing = geometry.coordinates[0]
    .map((coordinate) => `${coordinate[0]} ${coordinate[1]}`)
    .join(', ');

  return `POLYGON((${outerRing}))`;
};

const mapGeoServerZone = (feature) => {
  const properties = feature.properties || {};
  const geomWkt = getFeatureProperty(properties, 'geomWkt', 'geom_wkt') || polygonToWkt(feature.geometry);

  return {
    id: getFeatureId(feature.id, properties),
    name: getFeatureProperty(properties, 'name', 'nombre') || '',
    description: getFeatureProperty(properties, 'description', 'descripcion') || '',
    attractionLevel: Number(getFeatureProperty(properties, 'attractionLevel', 'nivelAtractivo', 'nivel_atractivo')) || 1,
    notes: getFeatureProperty(properties, 'notes', 'observaciones') || '',
    geomWkt,
    geometry: feature.geometry,
    routeIds: getRouteIds(properties),
    status: getFeatureProperty(properties, 'status', 'estado') || 'active',
  };
};

const ZoneManagement = () => {
  const {
    selectedZone,
    isFormOpen,
    openForm,
    closeForm,
  } = useZonesStore();
  const { t } = useLangStore();
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchZonesFromGeoServer = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const features = await fetchFeatures('zones');
        if (isMounted) {
          setZones(features.map(mapGeoServerZone));
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError);
          setZones([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchZonesFromGeoServer();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md overflow-hidden h-screen w-screen flex">
      <Sidebar activeItem="zones" />

      <main className="ml-[360px] flex-grow relative h-full bg-surface-dim map-pattern">
        <TopAppBar />
        <MapCanvas screenId="zoneManagement" zones={zones} />

        {/* <section className="absolute top-24 left-20 z-30 w-[360px] bg-surface/95 backdrop-blur border border-outline-variant rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-surface">{t('zones.title')}</h3>
            <button
              onClick={() => openForm(null)}
              className="px-3 py-1.5 rounded bg-primary text-on-primary text-sm"
              type="button"
            >
              {t('zones.newZone')}
            </button>
          </div>
          <div className="max-h-[56vh] overflow-y-auto">
            {isLoading && <p className="p-3 text-sm text-outline">{t('zones.loading')}</p>}
            {error && <p className="p-3 text-sm text-error">{error.details || error.message || t('zones.loadFailed')}</p>}
            {!isLoading && !zones.length && <p className="p-3 text-sm text-outline">Sin zonas.</p>}
            {zones.map((zone) => (
              <div key={zone.id} className="px-4 py-3 border-b border-outline-variant/40 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-on-surface truncate">{zone.name}</p>
                  <p className="text-xs text-outline">Atractivo: {zone.attractionLevel}</p>
                </div>
                <button
                  type="button"
                  className="px-2 py-1 rounded border border-outline text-sm"
                  onClick={() => openForm(zone)}
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
            onClick={() => openForm(null)}
            className="absolute bottom-8 right-8 z-30 bg-primary text-on-primary shadow-lg hover:shadow-xl transition-all rounded-full px-6 py-4 flex items-center gap-2 font-label-md text-label-md font-bold"
            type="button"
          >
            <span className="material-symbols-outlined">add</span>
            {t('zones.newZone')}
          </button>
        )}

        {isFormOpen && <ZoneForm zone={selectedZone} onClose={closeForm} />}
      </main>
    </div>
  );
};

export default ZoneManagement;
