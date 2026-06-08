import React, { useEffect } from 'react';
import MapCanvas from '@/features/map/MapCanvas';
import MapControls from '@/features/map/MapControls';
import MapFeaturePopup from '@/features/map/MapFeaturePopup';
import RouteMapInteractions from '@/features/map/interactions/RouteMapInteractions';
import useMapStore from '@/features/map/mapStore';
import useRefreshEntityLayer from '@/features/map/useRefreshEntityLayer';
import RouteForm from '@/features/routes/RouteForm';
import useRoutesStore from '@/features/routes/routesStore';
import Modal from '@/shared/components/Modal';
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
    openForm,
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

        {/* Crear un recorrido sin dibujar: la línea se arma desde las paradas. */}
        <button
          type="button"
          onClick={() => openForm()}
          className="absolute top-20 right-4 z-40 px-4 py-2 rounded-lg bg-primary text-on-primary shadow-md flex items-center gap-1 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nuevo recorrido
        </button>

        <MapFeaturePopup />
        <Modal isOpen={isFormOpen} onClose={closeForm}>
          <RouteForm
            route={selectedRoute}
            onClose={closeForm}
            onSaved={refreshRouteLayer}
            onDeleted={refreshRouteLayer}
          />
        </Modal>
      </main>
    </div>
  );
};

export default RoutePlanner;
