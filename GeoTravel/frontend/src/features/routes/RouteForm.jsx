import React, { useEffect, useMemo, useState } from 'react';
import { attractionsService } from '@/features/attractions/attractionsService';
import useRefreshEntityLayer from '@/features/map/useRefreshEntityLayer';
import useRoutesStore from '@/features/routes/routesStore';
import { validateRouteForm } from '@/features/routes/routeValidation';
import { zonesService } from '@/features/zones/zonesService';
import useLangStore from '@/shared/i18n/langStore';
import { getApiErrorMessage } from '@/shared/lib/forms/validation';
import { toLineStringWkt } from '@/shared/lib/geo/wkt';

const statusOptions = [
  { id: 'available', label: 'Disponible' },
  { id: 'pending', label: 'Pendiente' },
  { id: 'off-season', label: 'Fuera de estación' },
  { id: 'cancelled', label: 'Cancelado' },
];

const experienceOptions = [
  { id: 'cultural', label: 'Cultural' },
  { id: 'gastronomic', label: 'Gastronómico' },
  { id: 'natural', label: 'Natural' },
  { id: 'historical', label: 'Histórica' },
  { id: 'adventure', label: 'Aventura' },
  { id: 'other', label: 'Otro' },
];

const RouteForm = ({ route, onClose, onSaved, onDeleted }) => {
  const { t } = useLangStore();
  const {
    closeForm,
    saveRoute,
    deleteRoute,
    isSaving,
    isDeleting,
    stations,
    fetchStations,
    error,
    clearError,
  } = useRoutesStore();
  const refreshRouteLayers = useRefreshEntityLayer('routes');

  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [routeStatus, setRouteStatus] = useState('available');
  const [durationHours, setDurationHours] = useState('');
  const [guide, setGuide] = useState('');
  const [experienceType, setExperienceType] = useState('cultural');
  const [stationId, setStationId] = useState('');
  const [geomWkt, setGeomWkt] = useState('');
  const [zoneIds, setZoneIds] = useState([]);
  const [attractionIds, setAttractionIds] = useState([]);
  const [selectedAttractionId, setSelectedAttractionId] = useState('');
  const [availableAttractions, setAvailableAttractions] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);
  const [validationError, setValidationError] = useState('');

  const handleClose = () => {
    refreshRouteLayers();
    if (onClose) {
      onClose();
      return;
    }
    closeForm();
  };

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  useEffect(() => {
    const loadDependencies = async () => {
      const [attractions, zones] = await Promise.all([attractionsService.list(), zonesService.list()]);
      setAvailableAttractions(attractions);
      setAvailableZones(zones);
    };
    loadDependencies();
  }, []);

  useEffect(() => {
    const loadRouteData = async () => {
      setRouteName(route?.name || '');
      setRouteDescription(route?.description || '');
      setRouteStatus(route?.status || 'available');
      setDurationHours(route?.durationHours || '');
      setGuide(route?.guide || '');
      setExperienceType(route?.experienceType || 'cultural');
      setStationId(route?.stationId || '');
      setGeomWkt(route?.geomWkt || '');
      setZoneIds(Array.isArray(route?.zoneIds) ? route.zoneIds : []);
      // Las paradas vienen en el propio recorrido (el backend ya las devuelve ordenadas).
      setAttractionIds(Array.isArray(route?.attractionIds) ? route.attractionIds : []);
      setValidationError('');
      clearError();
    };

    loadRouteData();
  }, [route, clearError]);

  const apiError = useMemo(() => {
    return getApiErrorMessage(error, t('common.error'));
  }, [error, t]);

  const toggleZone = (zoneId) => {
    setZoneIds((current) =>
      current.includes(zoneId) ? current.filter((id) => id !== zoneId) : [...current, zoneId]
    );
  };

  const addAttraction = () => {
    if (!selectedAttractionId) {
      return;
    }
    const attrId = Number(selectedAttractionId);
    if (attractionIds.includes(attrId)) {
      return;
    }
    setAttractionIds((current) => [...current, attrId]);
    setSelectedAttractionId('');
  };

  const removeAttraction = (id) => {
    setAttractionIds((current) => current.filter((item) => item !== id));
  };

  const moveAttraction = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= attractionIds.length) {
      return;
    }
    const updated = [...attractionIds];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    setAttractionIds(updated);
  };

  // Arma la línea del recorrido uniendo las coordenadas de las paradas, en orden.
  const buildLineFromStops = () => {
    const coords = attractionIds
      .map((id) => availableAttractions.find((item) => item.id === id)?.coordinates)
      .filter(Boolean);
    return toLineStringWkt(coords);
  };

  const validate = (geom) => {
    return validateRouteForm({
      name: routeName,
      description: routeDescription,
      stationId,
      durationHours,
      guide,
      geomWkt: geom,
    }, t);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Si no se dibujó la línea en el mapa, se genera uniendo las paradas en orden.
    const effectiveGeomWkt = geomWkt && geomWkt.trim() ? geomWkt : buildLineFromStops();

    const validation = validate(effectiveGeomWkt);
    setValidationError(validation);
    if (validation) {
      return;
    }

    const ok = await saveRoute({
      id: route?.id,
      name: routeName,
      description: routeDescription,
      status: routeStatus,
      durationHours: Number(durationHours),
      guide,
      experienceType,
      stationId: Number(stationId),
      geomWkt: effectiveGeomWkt,
      zoneIds,
      attractionIds,
    });
    if (ok) {
      onSaved?.();
    }
  };

  const handleDelete = async () => {
    if (!route?.id) {
      return;
    }
    const confirmed = window.confirm('¿Eliminar recorrido?');
    if (!confirmed) {
      return;
    }
    const ok = await deleteRoute(route.id);
    if (ok) {
      onDeleted?.();
      handleClose();
    }
  };

  return (
    <aside className="absolute top-0 right-0 h-full w-[420px] bg-surface-container-lowest border-l border-outline-variant z-40 shadow-lg flex flex-col">
      <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between bg-surface-bright">
        <h3 className="font-headline-lg text-headline-lg text-on-surface">
          {route?.id ? t('routes.design') : t('routes.newRoute')}
        </h3>
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
          <span className="font-label-md text-label-md text-on-surface-variant">{t('routes.name')}</span>
          <input
            className="w-full px-3 py-2 border border-outline rounded bg-surface"
            type="text"
            value={routeName}
            onChange={(event) => setRouteName(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">{t('common.description')}</span>
          <textarea
            className="w-full px-3 py-2 border border-outline rounded bg-surface resize-none"
            rows="3"
            value={routeDescription}
            onChange={(event) => setRouteDescription(event.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">{t('routes.duration')}</span>
            <input
              className="w-full px-3 py-2 border border-outline rounded bg-surface"
              type="number"
              min={1}
              value={durationHours}
              onChange={(event) => setDurationHours(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">{t('routes.guide')}</span>
            <input
              className="w-full px-3 py-2 border border-outline rounded bg-surface"
              type="text"
              value={guide}
              onChange={(event) => setGuide(event.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">Estado</span>
            <select
              className="w-full px-3 py-2 border border-outline rounded bg-surface"
              value={routeStatus}
              onChange={(event) => setRouteStatus(event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">Tipo de experiencia</span>
            <select
              className="w-full px-3 py-2 border border-outline rounded bg-surface"
              value={experienceType}
              onChange={(event) => setExperienceType(event.target.value)}
            >
              {experienceOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">Estación</span>
          <select
            className="w-full px-3 py-2 border border-outline rounded bg-surface"
            value={stationId}
            onChange={(event) => setStationId(event.target.value)}
          >
            <option value="">Seleccionar...</option>
            {stations.map((station) => (
              <option key={station.idEstacion} value={station.idEstacion}>
                {station.nombre} ({station.mesInicio}-{station.mesFin})
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-2">
          <span className="font-label-md text-label-md text-on-surface-variant">Zonas incluidas (opcional)</span>
          <div className="max-h-28 overflow-y-auto border border-outline rounded p-2 bg-surface">
            {!availableZones.length && <p className="text-xs text-outline">Sin zonas disponibles.</p>}
            {availableZones.map((item) => (
              <label key={item.id} className="flex items-center gap-2 py-1 text-sm text-on-surface">
                <input
                  type="checkbox"
                  checked={zoneIds.includes(item.id)}
                  onChange={() => toggleZone(item.id)}
                />
                <span>{item.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-label-md text-label-md text-on-surface-variant">{t('routes.stops')}</span>
          <p className="text-xs text-outline">
            Si no dibujás el recorrido en el mapa, se generará automáticamente uniendo las paradas en orden.
          </p>
          <div className="flex gap-2">
            <select
              className="flex-1 px-3 py-2 border border-outline rounded bg-surface"
              value={selectedAttractionId}
              onChange={(event) => setSelectedAttractionId(event.target.value)}
            >
              <option value="">Seleccionar atracción...</option>
              {availableAttractions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <button type="button" onClick={addAttraction} className="px-3 py-2 rounded bg-primary text-on-primary">
              +
            </button>
          </div>
          <ul className="border border-outline rounded p-2 bg-surface flex flex-col gap-2">
            {!attractionIds.length && <li className="text-xs text-outline">Sin paradas cargadas.</li>}
            {attractionIds.map((id, index) => {
              const attraction = availableAttractions.find((item) => item.id === id);
              return (
                <li key={`${id}-${index}`} className="flex items-center justify-between text-sm">
                  <span>
                    {index + 1}. {attraction?.title || `Atracción ${id}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="px-2 py-1 border border-outline rounded"
                      onClick={() => moveAttraction(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 border border-outline rounded"
                      onClick={() => moveAttraction(index, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 border border-error rounded text-error"
                      onClick={() => removeAttraction(id)}
                    >
                      x
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {(validationError || apiError) && <p className="text-sm text-error">{validationError || apiError}</p>}

        <div className="pt-4 mt-auto border-t border-outline-variant flex items-center justify-between">
          <button
            type="button"
            disabled={!route?.id || isDeleting || isSaving}
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

export default RouteForm;
