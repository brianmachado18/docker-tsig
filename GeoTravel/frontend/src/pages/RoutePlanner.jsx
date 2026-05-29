import React, { useEffect } from 'react';
import Sidebar from '../components/common/Sidebar';
import TopAppBar from '../components/common/TopAppBar';
import MapControls from '../components/map/MapControls';
import MapCanvas from '../components/map/MapCanvas';
import RouteForm from '../components/routes/RouteForm';
import useRoutesStore from '../store/routesStore';
import useLangStore from '../store/langStore';

const RoutePlanner = () => {
  const {
    routes,
    selectedRoute,
    isFormOpen,
    openForm,
    closeForm,
    isLoading,
    error,
    fetchRoutes,
  } = useRoutesStore();
  const { t } = useLangStore();

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md overflow-hidden h-screen w-screen flex">
      <Sidebar activeItem="routes" />

      <main className="ml-[360px] flex-1 relative h-full bg-surface-dim">
        <TopAppBar title="Route Planner" />
        <MapCanvas routes={routes} />

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

        {isFormOpen && <RouteForm route={selectedRoute || {}} onClose={closeForm} />}
      </main>
    </div>
  );
};

export default RoutePlanner;

