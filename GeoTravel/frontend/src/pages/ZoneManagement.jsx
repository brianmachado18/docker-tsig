import React, { useEffect } from 'react';
import Sidebar from '../components/common/Sidebar';
import TopAppBar from '../components/common/TopAppBar';
import MapControls from '../components/map/MapControls';
import MapCanvas from '../components/map/MapCanvas';
import ZoneMapInteractions from '../components/map/interactions/ZoneMapInteractions';
import ZoneForm from '../components/zones/ZoneForm';
import useZonesStore from '../store/zonesStore';
import useMapStore from '../store/mapStore';

const ZoneManagement = () => {
  const {
    selectedZone,
    isFormOpen,
    closeForm,
  } = useZonesStore();
  const setActiveTool = useMapStore((state) => state.setActiveTool);

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

        {isFormOpen && <ZoneForm zone={selectedZone} onClose={closeForm} />}
      </main>
    </div>
  );
};

export default ZoneManagement;
