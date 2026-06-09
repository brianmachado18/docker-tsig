import React, { useEffect, useMemo, useState } from 'react';
import useAttractionsStore from '@/features/attractions/attractionsStore';
import MapCanvas from '@/features/map/MapCanvas';
import useRouteFilterStore from '@/features/map/routeFilterStore';
import useRoutesStore from '@/features/routes/routesStore';
import TopAppBar from '@/shared/components/TopAppBar';
import useLangStore from '@/shared/i18n/langStore';

const GuestPortal = () => {
  const { t } = useLangStore();
  const {
    attractions,
    isLoading: isAttractionsLoading,
    error: attractionsError,
    fetchAttractions,
  } = useAttractionsStore();
  const { routes, isLoading: isRoutesLoading, error: routesError, fetchRoutes } = useRoutesStore();
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const setStatusFilter = useRouteFilterStore((state) => state.setStatus);
  const setExperienceTypeFilter = useRouteFilterStore((state) => state.setExperienceType);
  const resetRouteFilter = useRouteFilterStore((state) => state.reset);

  useEffect(() => {
    fetchAttractions();
    fetchRoutes();
  }, [fetchAttractions, fetchRoutes]);

  // Sincronizar el filtro del panel con el mapa (capa WFS de recorridos).
  useEffect(() => {
    setStatusFilter(availabilityFilter);
  }, [availabilityFilter, setStatusFilter]);

  useEffect(() => {
    setExperienceTypeFilter(experienceFilter);
  }, [experienceFilter, setExperienceTypeFilter]);

  // Al salir del portal, limpiar el filtro para no afectar otras pantallas.
  useEffect(() => () => resetRouteFilter(), [resetRouteFilter]);

  const isLoading = isAttractionsLoading || isRoutesLoading;
  const error = attractionsError || routesError;

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const availabilityMatch = availabilityFilter === 'all' || route.status === availabilityFilter;
      const experienceMatch = experienceFilter === 'all' || route.experienceType === experienceFilter;
      return availabilityMatch && experienceMatch;
    });
  }, [routes, availabilityFilter, experienceFilter]);

  const featuredRoutes = filteredRoutes//.slice(0, 2);
  const featuredAttractions = attractions.slice(0, 4);

  const getAttractionCategoryLabel = (category) => {
    switch (String(category || '').toUpperCase()) {
      case 'MUSEO':
      case 'MUSEUM':
        return t('attractions.museum');
      case 'PARQUE':
      case 'PARK':
        return t('attractions.park');
      case 'MONUMENTO':
      case 'MONUMENT':
        return t('attractions.monument');
      case 'LANDMARK':
      case 'PUNTO_DE_REFERENCIA':
        return t('attractions.landmark');
      default:
        return String(category || '').replace(/_/g, ' ') || t('attractions.category');
    }
  };

  const clearFilters = () => {
    setAvailabilityFilter('all');
    setExperienceFilter('all');
  };

  return (
    <div className="bg-background text-on-background h-screen overflow-hidden font-body-md flex">
      <main className="flex-1 relative flex flex-col h-full bg-surface-container-lowest">
        <TopAppBar title="GeoTravel GIS" variant="public" showGuestActions />

        <div className="absolute inset-0 z-0">
          <MapCanvas screenId="guestPortal" />
        </div>

        <aside className="absolute top-24 right-4 bottom-4 w-[380px] z-40 bg-surface/90 backdrop-blur-md border border-outline-variant rounded-2xl flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden">
          <div className="px-6 py-5 border-b border-outline-variant/30 bg-surface/50">
            <h3 className="font-headline-lg text-headline-lg text-primary">{t('guest.title')}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t('guest.subtitle')}</p>
          </div>
          <div className="px-6 py-5 border-b border-outline-variant/30 bg-surface/50">
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
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
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

            <hr className="border-outline-variant/30" />

            <section className="flex flex-col gap-4 pb-4">
              <h4 className="font-label-md text-label-md text-outline uppercase tracking-wider">{t('common.attractions')}</h4>
              {!isLoading && featuredAttractions.length === 0 && (
                <div className="text-sm text-outline">{t('attractions.noAttractions')}</div>
              )}
              <div className="grid grid-cols-1 gap-3">
                {featuredAttractions.map((attraction) => (
                  <div key={attraction.id} className="bg-surface rounded-xl border border-outline-variant/50 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h5 className="font-headline-md text-[15px] leading-tight text-primary font-semibold">
                          {attraction.title}
                        </h5>
                        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mt-1">
                          {attraction.description}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-outline-variant bg-surface-variant px-2.5 py-1 font-mono-label text-mono-label text-on-surface">
                        {getAttractionCategoryLabel(attraction.category)}
                      </span>
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
