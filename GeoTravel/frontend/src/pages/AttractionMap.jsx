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

        {/* <section className="absolute top-28 left-6 z-30 w-[360px] max-h-[calc(100vh-9rem)] bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-outline-variant bg-surface-bright">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">{t('attractions.mapTitle')}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t('attractions.mapSubtitle')}</p>
              </div>
              <button
                className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0"
                onClick={() => openForm(null)}
                type="button"
                title={t('attractions.addAttraction')}
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-outline-variant bg-surface px-4 py-3">
                <p className="font-label-md text-label-md text-on-surface-variant uppercase">{t('attractions.total')}</p>
                <p className="font-headline-lg text-headline-lg text-primary mt-1">{attractions.length}</p>
              </div>
              <div className="rounded-lg border border-outline-variant bg-surface px-4 py-3">
                <p className="font-label-md text-label-md text-on-surface-variant uppercase">{t('attractions.mapped')}</p>
                <p className="font-headline-lg text-headline-lg text-secondary mt-1">{mappedAttractions.length}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-primary text-primary bg-surface px-3 py-2 font-label-md text-label-md hover:bg-surface-container-low transition-colors"
                onClick={() => navigate('/attractions')}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">photo_library</span>
                {t('attractions.catalog')}
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-on-primary px-3 py-2 font-label-md text-label-md hover:bg-primary/90 transition-colors"
                onClick={() => openForm(null)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
                {t('attractions.addAttraction')}
              </button>
            </div>

            <div>
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase mb-2">{t('attractions.categories')}</h3>
              <div className="flex flex-wrap gap-2">
                {categoryStats.map(([category, count]) => (
                  <span
                    key={category}
                    className="px-2.5 py-1 rounded-full bg-primary-container/15 text-primary border border-primary/20 font-label-md text-label-md"
                  >
                    {category} - {count}
                  </span>
                ))}
                {!categoryStats.length && (
                  <span className="text-sm text-outline">{t('attractions.noAttractions')}</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase mb-2">{t('attractions.recent')}</h3>
              <div className="rounded-lg border border-outline-variant bg-surface overflow-hidden">
                {isLoading && <p className="p-3 text-sm text-outline">{t('common.loading')}</p>}
                {error && <p className="p-3 text-sm text-error">{errorMessage}</p>}
                {!isLoading && !error && !visibleAttractions.length && (
                  <p className="p-3 text-sm text-outline">{t('attractions.noAttractions')}</p>
                )}
                {!isLoading && !error && visibleAttractions.map((attraction) => (
                  <button
                    key={attraction.id}
                    className="w-full px-3 py-3 border-b border-outline-variant/50 last:border-b-0 text-left hover:bg-surface-container-low transition-colors"
                    onClick={() => openForm(attraction)}
                    type="button"
                  >
                    <span className="block font-label-md text-label-md text-on-surface truncate">{attraction.title}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-outline">
                      <span className="material-symbols-outlined text-[14px] text-attraction-marker">location_on</span>
                      {attraction.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section> */}

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
