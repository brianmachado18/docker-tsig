import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AttractionForm from '../components/attractions/AttractionForm';
import Sidebar from '../components/common/Sidebar';
import TopAppBar from '../components/common/TopAppBar';
import MapCanvas from '../components/map/MapCanvas';
import useAttractionsStore from '../store/attractionsStore';
import useLangStore from '../store/langStore';
import useMapStore from '../store/mapStore';

const URUGUAY_CENTER = [-56.2, -33.1];
const URUGUAY_ZOOM = 7;

const AttractionMap = () => {
  const navigate = useNavigate();
  const { t } = useLangStore();
  const setViewport = useMapStore((state) => state.setViewport);
  const {
    attractions,
    isLoading,
    error,
    fetchAttractions,
    isFormOpen,
    openForm,
    selectedAttraction,
  } = useAttractionsStore();

  useEffect(() => {
    setViewport(URUGUAY_CENTER, URUGUAY_ZOOM);
    fetchAttractions();
  }, [fetchAttractions, setViewport]);

  const categoryStats = useMemo(() => {
    const stats = attractions.reduce((accumulator, attraction) => {
      const category = attraction.category || 'OTRO';
      accumulator[category] = (accumulator[category] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(stats)
      .sort(([, leftCount], [, rightCount]) => rightCount - leftCount)
      .slice(0, 5);
  }, [attractions]);

  const mappedAttractions = useMemo(
    () => attractions.filter((attraction) => Array.isArray(attraction.coordinates)),
    [attractions]
  );

  const visibleAttractions = mappedAttractions.slice(0, 8);
  const errorMessage = error?.details || error?.message || t('common.error');

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md overflow-hidden h-screen w-screen flex">
      <Sidebar activeItem="attractionsMap" />

      <main className="ml-[360px] flex-1 relative h-full bg-surface-dim">
        <TopAppBar title={t('attractions.mapTitle')} />
        <MapCanvas screenId="attractionMap" />
        
        {!isFormOpen && (
          <button
            onClick={() => openForm(null)}
            className="absolute bottom-8 right-8 z-30 bg-primary text-on-primary shadow-lg hover:shadow-xl transition-all rounded-full px-6 py-4 flex items-center gap-2 font-label-md text-label-md font-bold"
            type="button"
          >
            <span className="material-symbols-outlined">add_location_alt</span>
            {t('attractions.addAttraction')}
          </button>
        )}

        {isFormOpen && <AttractionForm attraction={selectedAttraction} />}
      </main>
    </div>
  );
};

export default AttractionMap;
