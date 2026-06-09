import React, { useEffect } from 'react';
import AttractionForm from '@/features/attractions/AttractionForm';
import useAttractionsStore from '@/features/attractions/attractionsStore';
import MapCanvas from '@/features/map/MapCanvas';
import MapControls from '@/features/map/MapControls';
import MapFeaturePopup from '@/features/map/MapFeaturePopup';
import AttractionMapInteractions from '@/features/map/interactions/AttractionMapInteractions';
import useMapStore from '@/features/map/mapStore';
import useRefreshEntityLayer from '@/features/map/useRefreshEntityLayer';
import Sidebar from '@/shared/components/Sidebar';
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
    selectedAttraction,
  } = useAttractionsStore();

  useEffect(() => {
    setViewport(URUGUAY_CENTER, URUGUAY_ZOOM);
    setActiveTool('select');
    fetchAttractions();
  }, [fetchAttractions, setActiveTool, setViewport]);

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md overflow-hidden h-screen w-screen flex">
      <Sidebar activeItem="attractionsMap" />

      <main className="ml-[360px] flex-1 relative h-full bg-surface-dim">
        <TopAppBar title={t('attractions.mapTitle')} />
        <MapCanvas screenId="attractionMap" attractions={attractions} />
        <AttractionMapInteractions attractions={attractions} />
        <MapControls drawIcon="add_location_alt" drawLabelKey="map.placeAttraction" />
        <MapFeaturePopup />
        {isFormOpen && (
          <AttractionForm
            attraction={selectedAttraction}
            onSaved={refreshAttractionLayer}
            onDeleted={refreshAttractionLayer}
          />
        )}
      </main>
    </div>
  );
};

export default AttractionMap;
