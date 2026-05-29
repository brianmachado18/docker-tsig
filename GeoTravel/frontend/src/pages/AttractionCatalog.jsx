import React, { useEffect } from 'react';
import Sidebar from '../components/common/Sidebar';
import TopAppBar from '../components/common/TopAppBar';
import AttractionCard from '../components/attractions/AttractionCard';
import AttractionForm from '../components/attractions/AttractionForm';
import useAttractionsStore from '../store/attractionsStore';
import useLangStore from '../store/langStore';

const AttractionCatalog = () => {
  const { 
    attractions, 
    isLoading, 
    error, 
    fetchAttractions,
    isFormOpen,
    openForm,
    selectedAttraction
  } = useAttractionsStore();
  const { t } = useLangStore();

  useEffect(() => {
    fetchAttractions();
  }, [fetchAttractions]);

  return (
    <div className="bg-background text-on-background h-screen overflow-hidden font-body-md flex">
      <Sidebar activeItem="attractions" />
      
      <main className="ml-[360px] flex-1 flex flex-col relative h-full">
        <TopAppBar title={t('attractions.title')} mobileOnlyAccount />
        
        <div className="flex-1 overflow-y-auto pt-28 px-4 md:px-8 pb-8 bg-surface-container-lowest">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-background">{t('attractions.poi')}</h2>
              <p className="font-body-md text-body-md text-outline mt-1">{t('attractions.description')}</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-surface text-primary border border-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-sm">filter_list</span>
                {t('attractions.filter')}
              </button>
              <button 
                className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary/90 transition-colors"
                onClick={() => openForm(null)}
              >
                <span className="material-symbols-outlined text-sm">add</span>
                {t('attractions.addAttraction')}
              </button>
            </div>
          </div>
          
          {/* Grid de Atracciones (Mock) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading && (
              <div className="col-span-full text-sm text-outline">{t('common.loading')}</div>
            )}
            {error && (
              <div className="col-span-full text-sm text-error">{t('common.error')}</div>
            )}
            {!isLoading && !error && attractions.length === 0 && (
              <div className="col-span-full text-sm text-outline">{t('attractions.noAttractions')}</div>
            )}
            {!isLoading && !error && attractions.map((attraction) => (
              <AttractionCard key={attraction.id} {...attraction} status={attraction.status.replace('-', ' ')} />
            ))}

            <button 
              className="bg-surface-container-low rounded-xl border-2 border-dashed border-outline-variant hover:border-primary hover:bg-surface-container transition-all flex flex-col items-center justify-center min-h-[320px] group"
              onClick={() => openForm(null)}
            >
              <div className="w-16 h-16 rounded-full bg-primary-container/20 group-hover:bg-primary-container/40 flex items-center justify-center text-primary mb-4 transition-colors">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <span className="font-headline-md text-headline-md text-on-surface">{t('attractions.addNew')}</span>
              <span className="font-body-md text-body-md text-outline mt-2 text-center px-6">{t('attractions.addInstructions')}</span>
            </button>
          </div>
        </div>

        {isFormOpen && <AttractionForm attraction={selectedAttraction} />}
      </main>
    </div>
  );
};

export default AttractionCatalog;
