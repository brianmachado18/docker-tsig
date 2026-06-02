import React from 'react';
import useMapStore from '../../store/mapStore';
import useLangStore from '../../store/langStore';

const MapControls = () => {
  const activeTool = useMapStore((state) => state.activeTool);
  const setActiveTool = useMapStore((state) => state.setActiveTool);

  const getButtonClass = (tool) => {
    if (activeTool === tool) {
      return 'w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center relative group';
    }
    return 'w-10 h-10 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary flex items-center justify-center transition-colors relative group';
  };

  return (
    <div className="absolute top-28 left-6 z-30 bg-surface-container-lowest rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] p-2 border border-outline-variant flex flex-col gap-2">
      {(() => {
        const { t } = useLangStore();
        return (
          <>
            <button className={getButtonClass('select')} title={t('map.selectEdit')} onClick={() => setActiveTool('select')}>
              <span className="material-symbols-outlined">arrow_selector_tool</span>
              <div className="absolute left-full ml-2 px-2 py-1 bg-inverse-surface text-inverse-on-surface font-label-md text-label-md rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">{t('map.selectEdit')}</div>
            </button>
            <button className={getButtonClass('draw')} title={t('map.drawPolygon')} onClick={() => setActiveTool('draw')}>
              <span className="material-symbols-outlined">draw</span>
              <div className="absolute left-full ml-2 px-2 py-1 bg-inverse-surface text-inverse-on-surface font-label-md text-label-md rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">{t('map.drawPolygon')}</div>
            </button>
          </>
        );
      })()}
    </div>
  );
};

export default MapControls;
