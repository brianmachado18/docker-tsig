import React, { useEffect, useState } from 'react';
import useLangStore from '../../store/langStore';

const RouteForm = ({ route }) => {
  const { t } = useLangStore();
  const statusOptions = [
    { id: 'available', label: t('routes.available'), icon: 'check_circle' },
    { id: 'pending', label: t('routes.pending'), icon: 'schedule' },
    { id: 'off-season', label: t('routes.offSeason'), icon: 'event_busy' },
  ];
  const [routeName, setRouteName] = useState(route?.name || '');
  const [routeDescription, setRouteDescription] = useState(route?.description || '');
  const [routeStatus, setRouteStatus] = useState(route?.status || 'available');
  const [durationHours, setDurationHours] = useState(route?.durationHours || '');
  const [guide, setGuide] = useState(route?.guide || '');
  const [stops, setStops] = useState(route?.stops || []);
  const [draggedStopId, setDraggedStopId] = useState(null);

  useEffect(() => {
    setRouteName(route?.name || '');
    setRouteDescription(route?.description || '');
    setRouteStatus(route?.status || 'available');
    setDurationHours(route?.durationHours || '');
    setGuide(route?.guide || '');
    setStops(route?.stops || []);
    setDraggedStopId(null);
  }, [route]);

  const handleDragStart = (stopId) => {
    setDraggedStopId(stopId);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (targetId) => {
    if (!draggedStopId || draggedStopId === targetId) {
      return;
    }

    setStops((current) => {
      const updated = [...current];
      const sourceIndex = updated.findIndex((stop) => stop.id === draggedStopId);
      const targetIndex = updated.findIndex((stop) => stop.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) {
        return current;
      }
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated.map((stop, index) => ({ ...stop, order: index + 1 }));
    });
  };

  const displayStops = stops.length
    ? stops
    : [1, 2, 3].map((value) => ({ id: value, name: `Stop ${value}`, order: value }));

  return (
    <aside className="absolute left-6 top-28 bottom-6 w-[380px] bg-surface rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border border-outline flex flex-col z-10 overflow-hidden">
      <div className="p-5 border-b border-outline-variant bg-surface-bright">
        <h3 className="font-headline-lg text-headline-lg text-on-surface mb-2">{t('routes.design')}</h3>
        <div className="flex gap-2">
          {statusOptions.map((option) => {
            const isActive = routeStatus === option.id;
            const activeClasses = 'bg-status-available/20 text-status-available border-status-available';
            const idleClasses = 'bg-surface-container-high text-on-surface-variant border-outline-variant hover:bg-surface-variant';
            return (
              <button
                key={option.id}
                className={`px-3 py-1 border rounded font-label-md text-label-md flex items-center gap-1 ${isActive ? activeClasses : idleClasses}`}
                onClick={() => setRouteStatus(option.id)}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">{option.icon}</span>
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="font-label-md text-label-md text-on-surface-variant">{t('routes.name')}</label>
          <input
            className="w-full px-3 py-2 border border-outline rounded bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface"
            type="text"
            value={routeName}
            onChange={(event) => setRouteName(event.target.value)}
          />
        </div>
        
        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="font-label-md text-label-md text-on-surface-variant">{t('routes.description')}</label>
          <textarea
            className="w-full px-3 py-2 border border-outline rounded bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface resize-none"
            rows="3"
            value={routeDescription}
            onChange={(event) => setRouteDescription(event.target.value)}
          ></textarea>
        </div>
        
        {/* Duration & Guide */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-1 flex-1">
            <label className="font-label-md text-label-md text-on-surface-variant">{t('routes.duration')}</label>
            <div className="relative">
              <input
                className="w-full pl-3 pr-10 py-2 border border-outline rounded bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface"
                type="number"
                value={durationHours}
                onChange={(event) => setDurationHours(event.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant font-mono-label text-mono-label">{t('guest.hours')}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="font-label-md text-label-md text-on-surface-variant">{t('routes.guide')}</label>
            <input
              className="w-full px-3 py-2 border border-outline rounded bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface"
              type="text"
              value={guide}
              onChange={(event) => setGuide(event.target.value)}
            />
          </div>
        </div>

        {/* Attractions List (Draggable mockup) */}
        <div className="flex flex-col gap-2 mt-2">
          <label className="font-label-md text-label-md text-on-surface-variant flex justify-between">
            <span>{t('routes.stops')}</span>
            <span className="text-primary cursor-pointer hover:underline">{t('routes.addStop')}</span>
          </label>
          <ul className="flex flex-col gap-2">
            {displayStops.map(stop => (
              <li
                key={stop.id}
                className="bg-surface-container-low border border-outline-variant rounded p-3 flex items-center justify-between group"
                draggable
                onDragStart={() => handleDragStart(stop.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stop.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline cursor-grab">drag_indicator</span>
                  <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-mono-label text-[10px] font-black">{stop.order}</div>
                  <span className="font-body-md text-on-surface">{stop.name}</span>
                </div>
                <button className="text-error opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-[18px]">close</span></button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="p-4 border-t border-outline-variant bg-surface flex justify-between items-center bg-surface-bright">
        <button className="text-on-surface-variant font-label-md hover:text-on-surface transition-colors">{t('common.discard')}</button>
        <button className="px-6 py-2 bg-primary text-on-primary rounded font-label-md flex items-center gap-2 hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined text-[18px]">save</span> {t('common.save')}
        </button>
      </div>
    </aside>
  );
};

export default RouteForm;
