import React, { useEffect } from 'react';
import StarRating from '@/shared/components/StarRating';

const ZoneActionPicker = ({ zone, onEdit, onViewAttractions, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!zone) return null;

  const attractionCount = Array.isArray(zone.attractionIds) ? zone.attractionIds.length : 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[360px] rounded-2xl overflow-hidden shadow-2xl bg-surface-container-lowest flex flex-col">
        <div className="px-5 pt-5 pb-4 border-b border-outline-variant">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                <p className="text-xs uppercase tracking-wide text-on-surface-variant font-medium">Zona</p>
              </div>
              <h2 className="font-title-md text-title-md text-on-surface truncate">
                {zone.name || `Zona #${zone.id}`}
              </h2>
              {zone.description && (
                <p className="mt-1 text-sm text-on-surface-variant line-clamp-2">{zone.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {zone.attractionLevel > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <StarRating value={zone.attractionLevel} readonly ariaLabel="Nivel de atractivo" />
              <span className="text-xs text-on-surface-variant">Nivel de atractivo</span>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs text-on-surface-variant text-center">¿Qué deseas hacer con esta zona?</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onEdit}
              className="flex flex-col items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-4 hover:bg-surface-container hover:border-outline transition-colors group"
            >
              <span className="material-symbols-outlined text-[28px] text-on-surface group-hover:text-primary transition-colors">edit</span>
              <span className="text-sm font-medium text-on-surface text-center leading-tight">Editar zona</span>
            </button>

            <button
              type="button"
              onClick={onViewAttractions}
              className="flex flex-col items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-4 hover:bg-primary/10 hover:border-primary/50 transition-colors group relative"
            >
              <span className="material-symbols-outlined text-[28px] text-primary transition-colors">local_activity</span>
              <span className="text-sm font-medium text-on-surface text-center leading-tight">Atracciones</span>
              {attractionCount > 0 && (
                <span className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-on-primary text-[11px] font-semibold flex items-center justify-center">
                  {attractionCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneActionPicker;
