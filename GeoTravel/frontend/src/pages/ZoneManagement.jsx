import React, { useEffect } from 'react';
import Sidebar from '../components/common/Sidebar';
import TopAppBar from '../components/common/TopAppBar';
import MapControls from '../components/map/MapControls';
import MapCanvas from '../components/map/MapCanvas';
import ZoneForm from '../components/zones/ZoneForm';
import useZonesStore from '../store/zonesStore';

const ZoneManagement = () => {
  const { zones, selectedZone, isLoading, error, fetchZones } = useZonesStore();

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md overflow-hidden h-screen w-screen flex">
      <Sidebar activeItem="zones" />
      
      <main className="ml-[360px] flex-grow relative h-full bg-surface-dim map-pattern">
        <TopAppBar title="GeoTravel GIS" />
        <MapCanvas zones={zones} />
        {isLoading && (
          <div className="absolute top-24 left-6 z-30 bg-surface/90 border border-outline-variant px-4 py-2 rounded-lg text-sm text-outline shadow-sm">
            Loading zones...
          </div>
        )}
        {error && (
          <div className="absolute top-24 left-6 z-30 bg-error-container text-on-error-container border border-outline-variant px-4 py-2 rounded-lg text-sm shadow-sm">
            Failed to load zones.
          </div>
        )}
        <MapControls />
        <ZoneForm zone={selectedZone || zones[0]} />
      </main>
    </div>
  );
};

export default ZoneManagement;
