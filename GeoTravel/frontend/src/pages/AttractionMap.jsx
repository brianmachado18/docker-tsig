import React, { useEffect } from 'react';
import AttractionForm from '../components/attractions/AttractionForm';
import Sidebar from '../components/common/Sidebar';
import TopAppBar from '../components/common/TopAppBar';
import MapCanvas from '../components/map/MapCanvas';
import MapControls from '../components/map/MapControls';
import AttractionMapInteractions from '../components/map/interactions/AttractionMapInteractions';
import useAttractionsStore from '../store/attractionsStore';
import useLangStore from '../store/langStore';
import useMapStore from '../store/mapStore';

const URUGUAY_CENTER = [-56.2, -33.1];
const URUGUAY_ZOOM = 7;

const AttractionMap = () => {
  const { t } = useLangStore();
  const setViewport = useMapStore((state) => state.setViewport);
  const setActiveTool = useMapStore((state) => state.setActiveTool);
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
        {isFormOpen && <AttractionForm attraction={selectedAttraction} />}
      </main>
    </div>
  );
};

export default AttractionMap;
