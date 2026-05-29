import React, { useEffect } from 'react';
import Sidebar from '../components/common/Sidebar';
import TopAppBar from '../components/common/TopAppBar';
import MapCanvas from '../components/map/MapCanvas';
import RouteForm from '../components/routes/RouteForm';
import useRoutesStore from '../store/routesStore';

const RoutePlanner = () => {
  const { routes, selectedRoute, isLoading, error, fetchRoutes } = useRoutesStore();

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const activeRoute = selectedRoute || routes[0];

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
        <RouteForm route={activeRoute} />
      </main>
    </div>
  );
};

export default RoutePlanner;
