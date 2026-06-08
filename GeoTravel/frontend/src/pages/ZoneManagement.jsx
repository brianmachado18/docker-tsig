import React, { useEffect } from 'react';
import MapCanvas from '@/features/map/MapCanvas';
import MapControls from '@/features/map/MapControls';
import ZoneMapInteractions from '@/features/map/interactions/ZoneMapInteractions';
import useMapStore from '@/features/map/mapStore';
import useRefreshEntityLayer from '@/features/map/useRefreshEntityLayer';
import ZoneForm from '@/features/zones/ZoneForm';
import useZonesStore from '@/features/zones/zonesStore';
import Sidebar from '@/shared/components/Sidebar';
import TopAppBar from '@/shared/components/TopAppBar';

const ZoneManagement = () => {
  const {
    selectedZone,
    isFormOpen,
    closeForm,
  } = useZonesStore();
  const setActiveTool = useMapStore((state) => state.setActiveTool);
  const refreshZoneLayers = useRefreshEntityLayer('zones');

  useEffect(() => {
    setActiveTool('select');
  }, [setActiveTool]);

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md overflow-hidden h-screen w-screen flex">
      <Sidebar activeItem="zones" />

      <main className="ml-[360px] flex-grow relative h-full bg-surface-dim map-pattern">
        <TopAppBar />
        <MapCanvas screenId="zoneManagement" />
        <ZoneMapInteractions />
        <MapControls />

        {isFormOpen && (
          <ZoneForm
            zone={selectedZone}
            onClose={closeForm}
            onSaved={refreshZoneLayers}
            onDeleted={refreshZoneLayers}
          />
        )}
      </main>
    </div>
  );
};

export default ZoneManagement;
