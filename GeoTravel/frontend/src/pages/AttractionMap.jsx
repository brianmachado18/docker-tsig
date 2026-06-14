import React, { useEffect } from 'react';
import NuevaAtraccionModal from '@/features/attractions/NuevaAtraccionModal';
import useAttractionsStore from '@/features/attractions/attractionsStore';
import MapCanvas from '@/features/map/MapCanvas';
import MapControls from '@/features/map/MapControls';
import MapFeaturePopup from '@/features/map/MapFeaturePopup';
import AttractionMapInteractions from '@/features/map/interactions/AttractionMapInteractions';
import useMapStore from '@/features/map/mapStore';
import useRefreshEntityLayer from '@/features/map/useRefreshEntityLayer';
import AdminLayout from '@/shared/components/AdminLayout';
import Modal from '@/shared/components/Modal';
import TopAppBar from '@/shared/components/TopAppBar';
import useLangStore from '@/shared/i18n/langStore';

const URUGUAY_CENTER = [-56.2, -33.1];
const URUGUAY_ZOOM = 7;

const AttractionMap = () => {
  const { t } = useLangStore();
  const setViewport = useMapStore((state) => state.setViewport);
  const setActiveTool = useMapStore((state) => state.setActiveTool);
  const refreshAttractionLayer = useRefreshEntityLayer('attractions');
  const {
    attractions,
    fetchAttractions,
    isFormOpen,
    openForm,
    closeForm,
    setPendingWizardData,
    clearPendingWizardData,
  } = useAttractionsStore();

  const handleDrawActivate = () => {
    openForm(null);
  };

  const handleUbicarEnMapa = (partialData) => {
    setPendingWizardData(partialData);
    closeForm();
  };

  const handleCloseModal = () => {
    clearPendingWizardData();
    closeForm();
    setActiveTool('select');
  };

  const handleSaved = () => {
    refreshAttractionLayer();
    setActiveTool('select');
  };

  useEffect(() => {
    setViewport(URUGUAY_CENTER, URUGUAY_ZOOM);
    setActiveTool('select');
    fetchAttractions();
  }, [fetchAttractions, setActiveTool, setViewport]);

  return (
    <AdminLayout activeItem="attractionsMap" mainClassName="bg-surface-dim">
      <TopAppBar title={t('attractions.mapTitle')} />
      <MapCanvas screenId="attractionMap" attractions={attractions} />
      <AttractionMapInteractions attractions={attractions} />
      <MapControls drawIcon="add_location_alt" drawLabelKey="map.placeAttraction" onDrawActivate={handleDrawActivate} />
      <MapFeaturePopup />
      <Modal isOpen={isFormOpen} onClose={handleCloseModal}>
        <NuevaAtraccionModal
          onUbicarEnMapa={handleUbicarEnMapa}
          onSaved={handleSaved}
          onDeleted={handleSaved}
        />
      </Modal>
    </AdminLayout>
  );
};

export default AttractionMap;
