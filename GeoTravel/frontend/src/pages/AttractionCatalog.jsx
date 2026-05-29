import React, { useEffect } from 'react';
import Sidebar from '../components/common/Sidebar';
import TopAppBar from '../components/common/TopAppBar';
import AttractionCard from '../components/attractions/AttractionCard';
import useAttractionsStore from '../store/attractionsStore';

const AttractionCatalog = () => {
  const { attractions, isLoading, error, fetchAttractions } = useAttractionsStore();

  useEffect(() => {
    fetchAttractions();
  }, [fetchAttractions]);

  return (
    <div className="bg-background text-on-background h-screen overflow-hidden font-body-md flex">
      <Sidebar activeItem="attractions" />
      
      <main className="ml-[360px] flex-1 flex flex-col relative h-full">
        <TopAppBar title="Attraction Catalog" mobileOnlyAccount />
        
        <div className="flex-1 overflow-y-auto pt-28 px-4 md:px-8 pb-8 bg-surface-container-lowest">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-background">Points of Interest</h2>
              <p className="font-body-md text-body-md text-outline mt-1">Manage and organize tourist attractions across all zones.</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-surface text-primary border border-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-sm">filter_list</span>
                Filter
              </button>
              <button className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary/90 transition-colors">
                <span className="material-symbols-outlined text-sm">add</span>
                Add Attraction
              </button>
            </div>
          </div>
          
          {/* Grid de Atracciones (Mock) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading && (
              <div className="col-span-full text-sm text-outline">Loading attractions...</div>
            )}
            {error && (
              <div className="col-span-full text-sm text-error">Failed to load attractions.</div>
            )}
            {!isLoading && !error && attractions.length === 0 && (
              <div className="col-span-full text-sm text-outline">No attractions available yet.</div>
            )}
            {!isLoading && !error && attractions.map((attraction) => (
              <AttractionCard key={attraction.id} {...attraction} status={attraction.status.replace('-', ' ')} />
            ))}

            <button className="bg-surface-container-low rounded-xl border-2 border-dashed border-outline-variant hover:border-primary hover:bg-surface-container transition-all flex flex-col items-center justify-center min-h-[320px] group">
              <div className="w-16 h-16 rounded-full bg-primary-container/20 group-hover:bg-primary-container/40 flex items-center justify-center text-primary mb-4 transition-colors">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <span className="font-headline-md text-headline-md text-on-surface">Add New Attraction</span>
              <span className="font-body-md text-body-md text-outline mt-2 text-center px-6">Create a new point of interest to appear on the map.</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AttractionCatalog;
