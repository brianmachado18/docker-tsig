import React, { useEffect, useMemo } from 'react';
import useAttractionsStore from '@/features/attractions/attractionsStore';
import StarRating from '@/shared/components/StarRating';

const CATEGORY_ICONS = {
  MUSEO: 'museum',
  TEATRO: 'theater_comedy',
  MONUMENTO: 'account_balance',
  PLAZA: 'park',
  GASTRONOMIA: 'restaurant',
  PLAYA: 'beach_access',
  PARQUE: 'nature',
};

const CATEGORY_LABELS = {
  MUSEO: 'Museo',
  TEATRO: 'Teatro',
  MONUMENTO: 'Monumento',
  PLAZA: 'Plaza',
  GASTRONOMIA: 'Gastronomía',
  PLAYA: 'Playa',
  PARQUE: 'Parque',
};

const ZoneAttractionsPanel = ({ zone, onClose, onEdit, onAttractionSelect }) => {
  const { attractions, fetchAttractions, isLoading } = useAttractionsStore();

  useEffect(() => {
    fetchAttractions();
  }, [fetchAttractions]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const linkedAttractions = useMemo(() => {
    const ids = zone?.attractionIds;
    if (!Array.isArray(ids) || !ids.length) return [];
    const strIds = ids.map(String);
    return attractions.filter((a) => strIds.includes(String(a.id)));
  }, [attractions, zone]);

  if (!zone) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-[520px] max-h-[85dvh] rounded-2xl overflow-hidden shadow-2xl bg-surface-container-lowest flex flex-col">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-outline-variant bg-surface-bright shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                <p className="text-xs uppercase tracking-wide text-on-surface-variant font-medium">Zona</p>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
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

          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            {zone.attractionLevel > 0 && (
              <div className="flex items-center gap-2">
                <StarRating value={zone.attractionLevel} readonly sizeClassName="text-[16px]" ariaLabel="Nivel de atractivo" />
                <span className="text-xs text-on-surface-variant">Nivel de atractivo</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="material-symbols-outlined text-[16px] text-primary">local_activity</span>
              <span className="text-sm font-medium text-on-surface">
                {linkedAttractions.length}{' '}
                <span className="text-on-surface-variant font-normal">
                  {linkedAttractions.length === 1 ? 'atracción' : 'atracciones'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              <span className="text-sm">Cargando atracciones...</span>
            </div>
          )}

          {!isLoading && linkedAttractions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <span className="material-symbols-outlined text-5xl text-outline mb-3">location_off</span>
              <p className="font-title-sm text-title-sm text-on-surface">Sin atracciones vinculadas</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Esta zona no tiene atracciones asignadas aún.
              </p>
              <button
                type="button"
                onClick={onEdit}
                className="mt-4 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm hover:opacity-90 transition-opacity"
              >
                Editar zona
              </button>
            </div>
          )}

          {!isLoading && linkedAttractions.length > 0 && (
            <ul className="divide-y divide-outline-variant">
              {linkedAttractions.map((attraction) => {
                const c = String(attraction.category || '').toUpperCase();
                const icon = CATEGORY_ICONS[c] || 'place';
                const label = CATEGORY_LABELS[c] || attraction.category || 'Atracción';
                const hasImage = Boolean(attraction.imageUrl);
                return (
                  <li
                    key={attraction.id}
                    className="flex gap-4 p-4 hover:bg-surface-container/50 transition-colors cursor-pointer"
                    onClick={() => onAttractionSelect?.(attraction)}
                  >
                    {hasImage ? (
                      <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-surface-container">
                        <img src={attraction.imageUrl} alt={attraction.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="shrink-0 w-14 h-14 rounded-lg bg-surface-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-[26px] text-primary">{icon}</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-label-lg text-label-lg text-on-surface leading-snug">
                          {attraction.title || `Atracción ${attraction.id}`}
                        </p>
                        <span className="shrink-0 text-[10px] uppercase tracking-wide text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant mt-0.5">
                          {label}
                        </span>
                      </div>
                      {attraction.description && (
                        <p className="mt-1 text-xs text-on-surface-variant line-clamp-2">{attraction.description}</p>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-outline self-center shrink-0">chevron_right</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-outline-variant bg-surface-container-lowest px-5 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-outline text-on-surface text-sm hover:bg-surface-container transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Editar zona
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZoneAttractionsPanel;
