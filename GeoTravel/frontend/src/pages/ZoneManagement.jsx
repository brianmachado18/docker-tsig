import React, { useEffect } from 'react';
import Sidebar from '../components/common/Sidebar';
import TopAppBar from '../components/common/TopAppBar';
import MapControls from '../components/map/MapControls';
import MapCanvas from '../components/map/MapCanvas';
import ZoneForm from '../components/zones/ZoneForm';
import useZonesStore from '../store/zonesStore';
import useLangStore from '../store/langStore';

const ZoneManagement = () => {
  const {
    zones,
    selectedZone,
    isFormOpen,
    openForm,
    closeForm,
    setSelectedZone,
    isLoading,
    error,
    fetchZones,
  } = useZonesStore();
  const { t } = useLangStore();

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  useEffect(() => {
    if (selectedZone) {
      openForm(selectedZone);
    }
  }, [selectedZone, openForm]);

  const handleOpenNewZone = () => {
    setSelectedZone(null);
    openForm(null);
  };

  const handleCloseForm = () => {
    closeForm();
  };

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md overflow-hidden h-screen w-screen flex">
      <Sidebar activeItem="zones" />
      
      <main className="ml-[360px] flex-grow relative h-full bg-surface-dim map-pattern">
        <TopAppBar />
        <MapCanvas zones={zones} />
        {isLoading && (
          <div className="absolute top-24 left-6 z-30 bg-surface/90 border border-outline-variant px-4 py-2 rounded-lg text-sm text-outline shadow-sm">
            {t('zones.loading')}
          </div>
        )}
        {error && (
          <div className="absolute top-24 left-6 z-30 bg-error-container text-on-error-container border border-outline-variant px-4 py-2 rounded-lg text-sm shadow-sm">
            {t('zones.loadFailed')}
          </div>
        )}
        
        {/* Floating Action Button for New Zone */}
        {!isFormOpen && (
          <button 
            onClick={handleOpenNewZone}
            className="absolute bottom-8 right-8 z-30 bg-primary text-on-primary shadow-lg hover:shadow-xl transition-all rounded-full px-6 py-4 flex items-center gap-2 font-label-md text-label-md font-bold"
          >
            <span className="material-symbols-outlined">add</span>
            {t('zones.newZone')}
          </button>
        )}

        <MapControls />
        {isFormOpen && <ZoneForm zone={selectedZone || {}} onClose={handleCloseForm} />}
      </main>
    </div>
  );
};

export default ZoneManagement;
