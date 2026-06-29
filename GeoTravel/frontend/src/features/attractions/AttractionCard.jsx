import React from 'react';
import useLangStore from '@/shared/i18n/langStore';

const AttractionCard = ({
  title,
  description,
  tag,
  tagIcon,
  imageUrl,
  ranking,
  rankingPosition,
  onViewOnMap,
}) => {
  const { t } = useLangStore();
  const hasImage = Boolean(imageUrl);

  const handleViewOnMapClick = (event) => {
    event.stopPropagation();
    if (onViewOnMap) onViewOnMap();
  };

  return (
    <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative flex flex-col h-full">
      <div className={`h-48 relative overflow-hidden ${hasImage ? 'bg-surface-container' : 'bg-surface-container/50 flex items-center justify-center'}`}>
        {hasImage ? (
          <img
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={imageUrl}
          />
        ) : (
          <div className="flex flex-col items-center text-outline">
            <span className="material-symbols-outlined text-4xl mb-2">image_not_supported</span>
            <span className="font-mono-label text-mono-label">{t('attractions.noImage')}</span>
          </div>
        )}
        
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-surface/90 backdrop-blur-sm px-2 py-1 rounded-md text-on-surface font-mono-label text-mono-label flex items-center gap-1 border border-outline-variant/50">
            <span className="material-symbols-outlined text-[14px] text-attraction-marker">{tagIcon}</span>
            {tag}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`px-4 py-1 rounded-md font-label-md text-label-md backdrop-blur-sm border-2 
            ${rankingPosition===1 ? 'text-yellow-500' : ''}
            ${rankingPosition===2 ? 'text-zinc-500' : ''}
            ${rankingPosition===3 ? 'text-yellow-900' : ''}
          `}>
            {rankingPosition}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-headline-md text-headline-md text-on-surface line-clamp-1">{title}</h3>
          <button
            className="text-outline hover:text-primary transition-colors p-1"
            onClick={handleViewOnMapClick}
            title={t('attractions.viewOnMap')}
            type="button"
          >
          </button>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-2 text-sm flex-1">
          {description}
        </p>
        <div className="pt-3 border-t border-surface-variant flex justify-between items-center">
          <span className="font-mono-label text-mono-label text-outline flex items-center gap-1">
            Atraccion presente en {ranking} recorrido/s.
          </span>
        </div>
      </div>
    </div>
  );
};

export default AttractionCard;
