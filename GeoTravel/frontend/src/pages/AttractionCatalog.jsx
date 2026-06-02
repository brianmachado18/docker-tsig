import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import TopAppBar from '../components/common/TopAppBar';
import AttractionCard from '../components/attractions/AttractionCard';
import AttractionForm from '../components/attractions/AttractionForm';
import useAttractionsStore from '../store/attractionsStore';
import useLangStore from '../store/langStore';

const normalizeFilterValue = (value) => String(value || '').trim().toLowerCase();

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');

  useEffect(() => {
    fetchAttractions();
  }, [fetchAttractions]);

  const statusOptions = useMemo(() => {
    const values = attractions.map((attraction) => attraction.status || 'active');
    return [...new Set(values.map(normalizeFilterValue).filter(Boolean))].sort();
  }, [attractions]);

  const experienceOptions = useMemo(() => {
    const values = attractions.map((attraction) => attraction.category || 'OTRO');
    return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))].sort();
  }, [attractions]);

  const filteredAttractions = useMemo(() => (
    attractions.filter((attraction) => {
      const statusMatches = statusFilter === 'all'
        || normalizeFilterValue(attraction.status || 'active') === statusFilter;
      const experienceMatches = experienceFilter === 'all'
        || String(attraction.category || 'OTRO') === experienceFilter;

      return statusMatches && experienceMatches;
    })
  ), [attractions, experienceFilter, statusFilter]);

  const activeFilterCount = Number(statusFilter !== 'all') + Number(experienceFilter !== 'all');

  const getStatusLabel = (status) => {
    switch (normalizeFilterValue(status || 'active')) {
      case 'active':
        return t('attractions.open');
      case 'maintenance':
        return t('attractions.maintenance');
      case 'closed':
        return t('attractions.closed');
      case 'off-season':
        return t('guest.offSeason');
      default:
        return String(status || '').replace(/-/g, ' ');
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setExperienceFilter('all');
  };

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
            <div className="relative">
              {isFilterOpen && (
                <button
                  aria-label={t('attractions.closeFilters')}
                  className="fixed inset-0 z-20 cursor-default bg-transparent"
                  onClick={() => setIsFilterOpen(false)}
                  type="button"
                />
              )}
              <button
                className="flex items-center gap-2 bg-surface text-primary border border-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors"
                onClick={() => setIsFilterOpen((value) => !value)}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">filter_list</span>
                {t('attractions.filter')}
                {activeFilterCount > 0 && (
                  <span className="min-w-5 h-5 rounded-full bg-primary text-on-primary text-xs flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-3 w-[320px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-30 overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
                    <h3 className="font-headline-md text-headline-md text-on-surface">{t('attractions.filters')}</h3>
                    <button
                      className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container flex items-center justify-center"
                      onClick={() => setIsFilterOpen(false)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  <div className="p-4 flex flex-col gap-4">
                    <label className="flex flex-col gap-2">
                      <span className="font-label-md text-label-md text-on-surface-variant">{t('attractions.status')}</span>
                      <select
                        className="w-full px-3 py-2 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                      >
                        <option value="all">{t('attractions.allStatuses')}</option>
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {getStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="font-label-md text-label-md text-on-surface-variant">{t('attractions.experienceType')}</span>
                      <select
                        className="w-full px-3 py-2 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        value={experienceFilter}
                        onChange={(event) => setExperienceFilter(event.target.value)}
                      >
                        <option value="all">{t('attractions.allExperienceTypes')}</option>
                        {experienceOptions.map((experience) => (
                          <option key={experience} value={experience}>
                            {experience}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      className="flex items-center justify-center gap-2 rounded-lg border border-outline text-on-surface px-3 py-2 font-label-md text-label-md hover:bg-surface-container transition-colors disabled:opacity-50"
                      disabled={activeFilterCount === 0}
                      onClick={clearFilters}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
                      {t('attractions.clearFilters')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
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
            {!isLoading && !error && attractions.length > 0 && filteredAttractions.length === 0 && (
              <div className="col-span-full text-sm text-outline">{t('attractions.noFilteredAttractions')}</div>
            )}
            {!isLoading && !error && filteredAttractions.map((attraction) => (
              <AttractionCard
                key={attraction.id}
                title={attraction.title}
                description={attraction.description}
                imageUrl={attraction.imageUrl}
                tag={attraction.category}
                status={getStatusLabel(attraction.status)}
                onEdit={() => openForm(attraction)}
              />
            ))}
          </div>
        </div>

        {isFormOpen && <AttractionForm attraction={selectedAttraction} />}
      </main>
    </div>
  );
};

export default AttractionCatalog;
