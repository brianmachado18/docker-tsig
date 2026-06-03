import React, { useEffect } from 'react';
import MapCanvas from '@/features/map/MapCanvas';
import MapControls from '@/features/map/MapControls';
import RouteMapInteractions from '@/features/map/interactions/RouteMapInteractions';
import useMapStore from '@/features/map/mapStore';
import useRefreshEntityLayer from '@/features/map/useRefreshEntityLayer';
import RouteForm from '@/features/routes/RouteForm';
import useRoutesStore from '@/features/routes/routesStore';
import Sidebar from '@/shared/components/Sidebar';
import TopAppBar from '@/shared/components/TopAppBar';
import useLangStore from '@/shared/i18n/langStore';

const URUGUAY_CENTER = [-56.2, -33.1];
const URUGUAY_ZOOM = 7;

const RoutePlanner = () => {
  const {
    routes,
    selectedRoute,
    isFormOpen,
    closeForm,
    fetchRoutes,
  } = useRoutesStore();
  const { t } = useLangStore();
  const setViewport = useMapStore((state) => state.setViewport);
  const setActiveTool = useMapStore((state) => state.setActiveTool);
  const refreshRouteLayer = useRefreshEntityLayer('routes');

  useEffect(() => {
    setViewport(URUGUAY_CENTER, URUGUAY_ZOOM);
    setActiveTool('select');
    fetchRoutes();
  }, [fetchRoutes, setActiveTool, setViewport]);

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md overflow-hidden h-screen w-screen flex">
      <Sidebar activeItem="routes" />

      <main className="ml-[360px] flex-1 relative h-full bg-surface-dim">
        <TopAppBar title={t('routes.design')} />
        <MapCanvas screenId="routePlanner" />
        <RouteMapInteractions routes={routes} />
        <MapControls drawIcon="route" drawLabelKey="map.drawRoute" />

        {isFormOpen && (
          <RouteForm
            route={selectedRoute}
            onClose={closeForm}
            onSaved={refreshRouteLayer}
            onDeleted={refreshRouteLayer}
          />
        )}
      </main>
    </div>
  );
};

export default RoutePlanner;
