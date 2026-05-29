import React, { useEffect, useState } from 'react';
import useLangStore from '../../store/langStore';

const ZoneForm = ({ zone }) => {
  const { t } = useLangStore();
  const zoneId = zone?.id || 'N/A';
  const [zoneName, setZoneName] = useState(zone?.name || '');
  const [zoneDescription, setZoneDescription] = useState(zone?.description || '');
  const [attractionLevel, setAttractionLevel] = useState(zone?.attractionLevel || 4);
  const [zoneNotes, setZoneNotes] = useState(zone?.notes || '');
  const status = zone?.status || 'active';
  const statusLabel = status === 'off-season' ? 'Off-season Zone' : 'Active Zone';

  useEffect(() => {
    setZoneName(zone?.name || '');
    setZoneDescription(zone?.description || '');
    setAttractionLevel(zone?.attractionLevel || 4);
    setZoneNotes(zone?.notes || '');
  }, [zone]);

  return (
    <aside className="absolute top-0 right-0 h-full w-[360px] bg-surface-container-lowest border-l border-outline-variant z-40 shadow-lg flex flex-col transform transition-transform duration-300 translate-x-0">
      <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between bg-surface-bright">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">{t('zones.details')}</h2>
          <p className="font-label-md text-label-md text-on-surface-variant mt-1">{t('zones.polygonId')}: {zoneId}</p>
        </div>
        <button className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <div className="p-6 flex-grow overflow-y-auto flex flex-col gap-6">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="zone_name">{t('zones.name')}</label>
          <input
            className="px-3 py-2 border border-outline rounded-lg bg-transparent font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            id="zone_name"
            type="text"
            value={zoneName}
            onChange={(event) => setZoneName(event.target.value)}
          />
        </div>
        
        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="zone_desc">{t('zones.description')}</label>
          <textarea
            className="px-3 py-2 border border-outline rounded-lg bg-transparent font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
            id="zone_desc"
            rows="3"
            value={zoneDescription}
            onChange={(event) => setZoneDescription(event.target.value)}
          ></textarea>
        </div>

        {/* Attraction Level */}
        <div className="flex flex-col gap-2">
          <label className="font-label-md text-label-md text-on-surface">{t('zones.attractionLevel')}</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(level => (
              <label key={level} className="cursor-pointer">
                <input
                  className="sr-only peer"
                  name="attraction_level"
                  type="radio"
                  value={level}
                  checked={level === attractionLevel}
                  onChange={() => setAttractionLevel(level)}
                />
                <div className="w-10 h-10 rounded border border-outline flex items-center justify-center font-label-md text-label-md text-on-surface-variant peer-checked:bg-primary-container peer-checked:text-on-primary-container peer-checked:border-primary hover:bg-surface-container transition-colors">
                  {level}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Observations */}
        <div className="flex flex-col gap-2">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="zone_obs">{t('zones.internalNotes')}</label>
          <textarea
            className="px-3 py-2 border border-outline rounded-lg bg-surface-container-low font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none placeholder:text-outline"
            id="zone_obs"
            placeholder={t('zones.notesPlaceholder')}
            rows="4"
            value={zoneNotes}
            onChange={(event) => setZoneNotes(event.target.value)}
          ></textarea>
        </div>

        {/* Status Chip */}
        <div className="flex items-center gap-3 py-2 border-t border-outline-variant mt-2">
          <span className="font-label-md text-label-md text-on-surface">{t('zones.status')}</span>
          <span className="px-3 py-1 rounded-full bg-secondary-fixed-dim text-on-secondary-fixed-variant font-label-md text-label-md flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            {status === 'off-season' ? t('zones.offSeason') : t('zones.active')}
          </span>
        </div>
      </div>

      <div className="p-4 border-t border-outline-variant bg-surface-bright flex justify-end gap-3">
        <button className="px-4 py-2 rounded-lg border border-outline text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors">
          {t('common.discard')}
        </button>
        <button className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">save</span>
          {t('common.save')}
        </button>
      </div>
    </aside>
  );
};

export default ZoneForm;
