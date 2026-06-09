import React, { useEffect } from 'react';
import MapCanvas from '@/features/map/MapCanvas';
import MapControls from '@/features/map/MapControls';
import ZoneMapInteractions from '@/features/map/interactions/ZoneMapInteractions';
import useMapStore from '@/features/map/mapStore';
import useRefreshEntityLayer from '@/features/map/useRefreshEntityLayer';
import ZoneForm from '@/features/zones/ZoneForm';
import ZoneRoutesQueryCard from '@/features/zones/ZoneRoutesQueryCard';
import useZonesStore from '@/features/zones/zonesStore';
import Modal from '@/shared/components/Modal';
import Sidebar from '@/shared/components/Sidebar';
import TopAppBar from '@/shared/components/TopAppBar';

const ZoneManagement = () => {
  const {
    zones,
    zoneRoutes,
    visibleZoneIds,
    selectedZone,
    isFormOpen,
    closeForm,
    fetchZones,
    clearZoneQueries,
  } = useZonesStore();
  const setActiveTool = useMapStore((state) => state.setActiveTool);
  const activeTool = useMapStore((state) => state.activeTool);
  const refreshZoneLayers = useRefreshEntityLayer('zones');

  useEffect(() => {
    setActiveTool('select');
    fetchZones();
  }, [fetchZones, setActiveTool]);

  useEffect(() => {
    if (activeTool !== 'zone-query') {
      clearZoneQueries();
    }
  }, [activeTool, clearZoneQueries]);

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md overflow-hidden h-screen w-screen flex">
      <Sidebar activeItem="zones" />

      <main className="ml-[360px] flex-grow relative h-full bg-surface-dim map-pattern">
        <TopAppBar />
        <MapCanvas
          screenId="zoneManagement"
          zones={zones}
          routes={zoneRoutes}
          visibleZoneIds={visibleZoneIds}
        />
        <ZoneMapInteractions zones={zones} />
        <MapControls />
        <ZoneRoutesQueryCard />

        <Modal isOpen={isFormOpen} onClose={closeForm}>
          <ZoneForm
            zone={selectedZone}
            onClose={closeForm}
            onSaved={refreshZoneLayers}
            onDeleted={refreshZoneLayers}
          />
        </Modal>
      </main>
    </div>
  );
};

export default ZoneManagement;
