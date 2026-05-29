import React, { useEffect, useState } from 'react';
import useLangStore from '../../store/langStore';
import useAttractionsStore from '../../store/attractionsStore';

const AttractionForm = ({ attraction }) => {
  const { t } = useLangStore();
  const { closeForm } = useAttractionsStore();
  
  const statusOptions = [
    { id: 'open', label: t('attractions.open') || 'Open', icon: 'check_circle' },
    { id: 'maintenance', label: t('attractions.maintenance') || 'Maintenance', icon: 'build' },
    { id: 'closed', label: t('attractions.closed') || 'Closed', icon: 'block' },
  ];
  
  const categoryOptions = [
    { id: 'museum', label: t('attractions.museum') || 'Museum' },
    { id: 'park', label: t('attractions.park') || 'Park' },
    { id: 'monument', label: t('attractions.monument') || 'Monument' },
    { id: 'landmark', label: t('attractions.landmark') || 'Landmark' },
  ];

  const [attractionName, setAttractionName] = useState(attraction?.name || '');
  const [attractionDescription, setAttractionDescription] = useState(attraction?.description || '');
  const [attractionStatus, setAttractionStatus] = useState(attraction?.status || 'open');
  const [attractionCategory, setAttractionCategory] = useState(attraction?.category || 'monument');
  const [attractionLat, setAttractionLat] = useState(attraction?.lat || '');
  const [attractionLng, setAttractionLng] = useState(attraction?.lng || '');

  useEffect(() => {
    setAttractionName(attraction?.name || '');
    setAttractionDescription(attraction?.description || '');
    setAttractionStatus(attraction?.status || 'open');
    setAttractionCategory(attraction?.category || 'monument');
    setAttractionLat(attraction?.lat || '');
    setAttractionLng(attraction?.lng || '');
  }, [attraction]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // API logic goes here...
    closeForm();
  };

  return (
    <aside className="absolute top-0 right-0 h-full w-[360px] bg-surface-container-lowest border-l border-outline-variant z-40 shadow-lg flex flex-col transform transition-transform duration-300 translate-x-0">
      <div className="px-6 py-5 border-b border-outline-variant flex flex-col gap-4 bg-surface-bright">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-lg text-headline-lg text-on-surface">{attraction ? t('attractions.edit') || 'Edit Attraction' : t('attractions.addNew') || 'Add Attraction'}</h3>
          <button 
            onClick={closeForm}
            className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => {
            const isActive = attractionStatus === option.id;
            const activeClasses = 'bg-status-available/20 text-status-available border-status-available';
            const idleClasses = 'bg-surface-container-high text-on-surface-variant border-outline-variant hover:bg-surface-variant';
            return (
              <button
                key={option.id}
                className={`px-3 py-1 border rounded font-label-md text-label-md flex items-center gap-1 ${isActive ? activeClasses : idleClasses}`}
                onClick={() => setAttractionStatus(option.id)}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">{option.icon}</span>
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="p-6 flex-grow overflow-y-auto flex flex-col gap-6">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="font-label-md text-label-md text-on-surface-variant">{t('attractions.name') || 'Name'}</label>
          <input
            className="w-full px-3 py-2 border border-outline rounded bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface"
            type="text"
            value={attractionName}
            onChange={(e) => setAttractionName(e.target.value)}
            placeholder={t('attractions.namePlaceholder') || 'Enter attraction name'}
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="font-label-md text-label-md text-on-surface-variant">{t('attractions.category') || 'Category'}</label>
          <select
            className="w-full px-3 py-2 border border-outline rounded bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface"
            value={attractionCategory}
            onChange={(e) => setAttractionCategory(e.target.value)}
          >
            {categoryOptions.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="font-label-md text-label-md text-on-surface-variant">{t('attractions.description') || 'Description'}</label>
          <textarea
            className="w-full px-3 py-2 border border-outline rounded bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface min-h-[100px] resize-y"
            value={attractionDescription}
            onChange={(e) => setAttractionDescription(e.target.value)}
            placeholder={t('attractions.descriptionPlaceholder') || 'Enter description'}
          />
        </div>

        {/* Location (Lat/Lng) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant">{t('attractions.latitude') || 'Latitude'}</label>
            <input
              className="w-full px-3 py-2 border border-outline rounded bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface"
              type="text"
              value={attractionLat}
              onChange={(e) => setAttractionLat(e.target.value)}
              placeholder="-34.9011"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant">{t('attractions.longitude') || 'Longitude'}</label>
            <input
              className="w-full px-3 py-2 border border-outline rounded bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface"
              type="text"
              value={attractionLng}
              onChange={(e) => setAttractionLng(e.target.value)}
              placeholder="-56.1645"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-outline-variant bg-surface flex justify-end gap-3">
        <button 
          onClick={closeForm}
          className="px-4 py-2 border border-outline-variant rounded font-label-md text-label-md text-on-surface hover:bg-surface-variant transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button 
          onClick={handleSubmit}
          className="px-4 py-2 bg-primary rounded font-label-md text-label-md text-on-primary hover:bg-primary/90 shadow-sm transition-colors"
        >
          {t('common.save')}
        </button>
      </div>
    </aside>
  );
};

export default AttractionForm;