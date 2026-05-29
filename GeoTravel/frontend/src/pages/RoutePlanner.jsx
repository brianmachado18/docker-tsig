import React, { useEffect } from 'react';
import Sidebar from '../components/common/Sidebar';
import TopAppBar from '../components/common/TopAppBar';
import MapControls from '../components/map/MapControls';
import MapCanvas from '../components/map/MapCanvas';
import RouteForm from '../components/routes/RouteForm';
import useRoutesStore from '../store/routesStore';
import useLangStore from '../store/langStore';

const RoutePlanner = () => {
  const { routes, selectedRoute, isFormOpen, openForm, isLoading, error, fetchRoutes } = useRoutesStore();
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
        {isLoading && (
          <div className="absolute top-24 left-6 z-30 bg-surface/90 border border-outline-variant px-4 py-2 rounded-lg text-sm text-outline shadow-sm">
            Loading routes...
          </div>
        )}
        {error && (
          <div className="absolute top-24 left-6 z-30 bg-error-container text-on-error-container border border-outline-variant px-4 py-2 rounded-lg text-sm shadow-sm">
            Failed to load routes.
          </div>
        )}

        <MapControls />

        {/* Floating Action Button for New Route */}
        {!isFormOpen && (
          <button 
            onClick={() => openForm()}
            className="absolute bottom-8 right-8 z-30 bg-primary text-on-primary shadow-lg hover:shadow-xl transition-all rounded-full px-6 py-4 flex items-center gap-2 font-label-lg font-bold"
          >
            <span className="material-symbols-outlined">add</span>
            {t('routes.newRoute')}
          </button>
        )}

        {isFormOpen && <RouteForm route={selectedRoute || {}} />}
      </main>
    </div>
  );
};

export default RoutePlanner;
