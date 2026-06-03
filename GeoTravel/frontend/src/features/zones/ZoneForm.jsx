import React, { useEffect, useMemo, useState } from 'react';
import useRoutesStore from '@/features/routes/routesStore';
import { validateZoneForm } from '@/features/zones/zoneValidation';
import useZonesStore from '@/features/zones/zonesStore';
import useLangStore from '@/shared/i18n/langStore';
import { getApiErrorMessage } from '@/shared/lib/forms/validation';

const ZoneForm = ({ zone, onClose, onSaved, onDeleted }) => {
  const { t } = useLangStore();
  const {
    closeForm,
    saveZone,
    deleteZone,
    isSaving,
    isDeleting,
    error,
    clearError,
  } = useZonesStore();
  const { routes, fetchRoutes } = useRoutesStore();

  const [zoneName, setZoneName] = useState('');
  const [zoneDescription, setZoneDescription] = useState('');
  const [attractionLevel, setAttractionLevel] = useState(1);
  const [zoneNotes, setZoneNotes] = useState('');
  const [geomWkt, setGeomWkt] = useState('');
  const [routeIds, setRouteIds] = useState([]);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  useEffect(() => {
    setZoneName(zone?.name || '');
    setZoneDescription(zone?.description || '');
    setAttractionLevel(Number(zone?.attractionLevel) || 1);
    setZoneNotes(zone?.notes || '');
    setGeomWkt(zone?.geomWkt || '');
    setRouteIds(Array.isArray(zone?.routeIds) ? zone.routeIds : []);
    setValidationError('');
    clearError();
  }, [zone, clearError]);

  const apiError = useMemo(() => {
    return getApiErrorMessage(error, t('common.error'));
  }, [error, t]);

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    closeForm();
  };

  const toggleRoute = (routeId) => {
    setRouteIds((current) =>
      current.includes(routeId) ? current.filter((id) => id !== routeId) : [...current, routeId]
    );
  };

  const validate = () => {
    return validateZoneForm({
      name: zoneName,
      description: zoneDescription,
      attractionLevel,
      geomWkt,
    }, t);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validate();
    setValidationError(validation);
    if (validation) {
      return;
    }

    const ok = await saveZone({
      id: zone?.id,
      name: zoneName,
      description: zoneDescription,
      attractionLevel: Number(attractionLevel),
      notes: zoneNotes,
      geomWkt,
      routeIds,
    });
    if (ok) {
      onSaved?.();
    }
  };

  const handleDelete = async () => {
    if (!zone?.id) {
      return;
    }
    const confirmed = window.confirm('¿Eliminar zona?');
    if (!confirmed) {
      return;
    }
    const ok = await deleteZone(zone.id);
    if (ok) {
      onDeleted?.();
      handleClose();
    }
  };

  return (
    <aside className="absolute top-0 right-0 h-full w-[420px] bg-surface-container-lowest border-l border-outline-variant z-40 shadow-lg flex flex-col">
      <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between bg-surface-bright">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">
            {zone?.id ? t('zones.details') : t('zones.newZone')}
          </h2>
          <p className="font-label-md text-label-md text-on-surface-variant mt-1">{t('zones.formSubtitle')}</p>
        </div>
        <button
          onClick={handleClose}
          className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <form className="p-6 flex-grow overflow-y-auto flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface">{t('zones.name')}</span>
          <input
            className="px-3 py-2 border border-outline rounded-lg bg-transparent"
            type="text"
            value={zoneName}
            onChange={(event) => setZoneName(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface">{t('common.description')}</span>
          <textarea
            className="px-3 py-2 border border-outline rounded-lg bg-transparent resize-none"
            rows="3"
            value={zoneDescription}
            onChange={(event) => setZoneDescription(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface">{t('zones.attractionLevel')}</span>
          <input
            className="px-3 py-2 border border-outline rounded-lg bg-transparent"
            type="number"
            min={1}
            max={5}
            value={attractionLevel}
            onChange={(event) => setAttractionLevel(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface">{t('zones.internalNotes')}</span>
          <textarea
            className="px-3 py-2 border border-outline rounded-lg bg-transparent resize-none"
            rows="3"
            value={zoneNotes}
            onChange={(event) => setZoneNotes(event.target.value)}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="font-label-md text-label-md text-on-surface">Recorridos vinculados (opcional)</span>
          <div className="max-h-32 overflow-y-auto border border-outline rounded-lg p-2 bg-surface">
            {!routes.length && <p className="text-xs text-outline">Sin recorridos para vincular.</p>}
            {routes.map((route) => (
              <label key={route.id} className="flex items-center gap-2 py-1 text-sm text-on-surface">
                <input
                  type="checkbox"
                  checked={routeIds.includes(route.id)}
                  onChange={() => toggleRoute(route.id)}
                />
                <span>{route.name || `Recorrido ${route.id}`}</span>
              </label>
            ))}
          </div>
        </div>

        {(validationError || apiError) && (
          <p className="text-sm text-error">{validationError || apiError}</p>
        )}

        <div className="pt-4 mt-auto border-t border-outline-variant flex items-center justify-between">
          <button
            type="button"
            disabled={!zone?.id || isDeleting || isSaving}
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg border border-error text-error disabled:opacity-40"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-outline text-on-surface"
              disabled={isSaving || isDeleting}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-on-primary disabled:opacity-60"
              disabled={isSaving || isDeleting}
            >
              {isSaving ? 'Guardando...' : t('common.save')}
            </button>
          </div>
        </div>
      </form>
    </aside>
  );
};

export default ZoneForm;
