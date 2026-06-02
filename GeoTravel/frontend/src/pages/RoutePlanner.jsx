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
        <MapCanvas screenId="routePlanner" />
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
