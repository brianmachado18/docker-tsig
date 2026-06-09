import React, { useEffect, useState } from 'react';
import useMapStore from '@/features/map/mapStore';
import { ROUTE_STATUS_LABEL_KEYS, STATUS_LABELS, STATUS_STYLES } from '@/features/routes/routeStatus';
import useZonesStore from '@/features/zones/zonesStore';
import useLangStore from '@/shared/i18n/langStore';
import { getApiErrorMessage } from '@/shared/lib/forms/validation';

const ZoneRoutesQueryCard = () => {
  const activeTool = useMapStore((state) => state.activeTool);
  const setActiveTool = useMapStore((state) => state.setActiveTool);
  const {
    zoneQueryType,
    setZoneQueryType,
    selectedZoneForRoutes,
    selectedZoneByAddress,
    zoneRoutes,
    isLoadingZoneRoutes,
    isLoadingAddressZone,
    routeQueryError,
    addressQueryError,
    searchZoneByAddress,
    clearZoneQueries,
  } = useZonesStore();
  const { t } = useLangStore();
  const [address, setAddress] = useState('');

  const isQueryMode = activeTool === 'zone-query';
  const routeQueryErrorMessage = getApiErrorMessage(routeQueryError, t('common.error'));
  const addressQueryErrorMessage = getApiErrorMessage(addressQueryError, t('common.error'));
  const routeCountLabel =
    zoneRoutes.length === 1
      ? t('zones.routesQuery.singleResult')
      : t('zones.routesQuery.multiResult').replace('{count}', String(zoneRoutes.length));
  const addressResultLabel = selectedZoneByAddress
    ? selectedZoneByAddress.name || `${t('common.zones')} #${selectedZoneByAddress.id}`
    : '';

  useEffect(() => {
    if (!isQueryMode) {
      setAddress('');
    }
  }, [isQueryMode]);

  const handleToggleQueryMode = () => {
    if (isQueryMode) {
      clearZoneQueries();
      setActiveTool('select');
      return;
    }

    clearZoneQueries();
    setZoneQueryType('routes');
    setActiveTool('zone-query');
  };

  const handleClear = () => {
    clearZoneQueries();
    setActiveTool('select');
  };

  const handleChangeQueryType = (nextType) => {
    setZoneQueryType(nextType);
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    if (!isQueryMode) {
      setActiveTool('zone-query');
    }
    await searchZoneByAddress(address);
  };

  return (
    <section className="absolute top-24 right-4 z-40 w-[340px] rounded-2xl border border-outline-variant bg-surface/95 backdrop-blur-md shadow-lg p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-title-md text-title-md text-on-surface">{t('zones.query.title')}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{t('zones.query.subtitle')}</p>
        </div>

        <button
          type="button"
          onClick={handleToggleQueryMode}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isQueryMode
              ? 'bg-primary text-on-primary'
              : 'border border-outline text-on-surface hover:bg-surface-container'
          }`}
        >
          {isQueryMode ? t('zones.query.exitMode') : t('zones.query.enterMode')}
        </button>
      </div>

      {isQueryMode && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleChangeQueryType('routes')}
            className={`rounded-lg px-3 py-2 text-sm ${
              zoneQueryType === 'routes'
                ? 'bg-primary text-on-primary'
                : 'border border-outline text-on-surface hover:bg-surface-container'
            }`}
          >
            {t('zones.query.routesTab')}
          </button>
          <button
            type="button"
            onClick={() => handleChangeQueryType('address')}
            className={`rounded-lg px-3 py-2 text-sm ${
              zoneQueryType === 'address'
                ? 'bg-primary text-on-primary'
                : 'border border-outline text-on-surface hover:bg-surface-container'
            }`}
          >
            {t('zones.query.addressTab')}
          </button>
        </div>
      )}

      {!isQueryMode && (
        <p className="text-sm text-on-surface-variant">
          {t('zones.query.hiddenUntilSelection')}
        </p>
      )}

      {isQueryMode && zoneQueryType === 'routes' && !selectedZoneForRoutes && !isLoadingZoneRoutes && (
        <p className="text-sm text-on-surface-variant">{t('zones.routesQuery.waitingSelection')}</p>
      )}

      {isQueryMode && zoneQueryType === 'routes' && isLoadingZoneRoutes && (
        <p className="text-sm text-on-surface-variant">{t('zones.routesQuery.loading')}</p>
      )}

      {isQueryMode && zoneQueryType === 'routes' && routeQueryErrorMessage && (
        <p className="text-sm text-error">{routeQueryErrorMessage}</p>
      )}

      {isQueryMode && zoneQueryType === 'routes' && selectedZoneForRoutes && !isLoadingZoneRoutes && !routeQueryErrorMessage && (
        <>
          <div className="rounded-xl bg-surface-container p-3">
            <p className="text-xs uppercase tracking-wide text-on-surface-variant">
              {t('zones.routesQuery.selectedZone')}
            </p>
            <p className="mt-1 font-title-sm text-title-sm text-on-surface">
              {selectedZoneForRoutes.name || `${t('common.zones')} #${selectedZoneForRoutes.id}`}
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">{routeCountLabel}</p>
          </div>

          {zoneRoutes.length ? (
            <ul className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {zoneRoutes.map((route) => (
                <li key={route.id} className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-label-lg text-label-lg text-on-surface">
                        {route.name || `${t('common.routes')} #${route.id}`}
                      </p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {route.description || t('zones.routesQuery.noDescription')}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${
                        STATUS_STYLES[route.status] || STATUS_STYLES.available
                      }`}
                    >
                      {t(ROUTE_STATUS_LABEL_KEYS[route.status] || ROUTE_STATUS_LABEL_KEYS.available) ||
                        STATUS_LABELS[route.status] ||
                        STATUS_LABELS.available}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-on-surface-variant">{t('zones.routesQuery.empty')}</p>
          )}

          <button
            type="button"
            onClick={handleClear}
            className="self-end px-3 py-2 rounded-lg border border-outline text-on-surface hover:bg-surface-container text-sm"
          >
            {t('zones.routesQuery.clear')}
          </button>
        </>
      )}

      {isQueryMode && zoneQueryType === 'address' && (
        <>
          <form className="flex flex-col gap-3" onSubmit={handleAddressSubmit}>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-on-surface">{t('zones.addressQuery.inputLabel')}</span>
              <input
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder={t('zones.addressQuery.inputPlaceholder')}
                className="px-3 py-2 rounded-lg border border-outline bg-transparent text-on-surface"
              />
            </label>

            <button
              type="submit"
              disabled={isLoadingAddressZone}
              className="self-end px-3 py-2 rounded-lg bg-primary text-on-primary text-sm disabled:opacity-60"
            >
              {isLoadingAddressZone ? t('zones.addressQuery.loading') : t('zones.addressQuery.search')}
            </button>
          </form>

          {!selectedZoneByAddress && !isLoadingAddressZone && !addressQueryErrorMessage && (
            <p className="text-sm text-on-surface-variant">{t('zones.addressQuery.waitingInput')}</p>
          )}

          {addressQueryErrorMessage && (
            <p className="text-sm text-error">{addressQueryErrorMessage}</p>
          )}

          {selectedZoneByAddress && !isLoadingAddressZone && !addressQueryErrorMessage && (
            <>
              <div className="rounded-xl bg-surface-container p-3">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">
                  {t('zones.addressQuery.foundZone')}
                </p>
                <p className="mt-1 font-title-sm text-title-sm text-on-surface">{addressResultLabel}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {selectedZoneByAddress.description || t('zones.addressQuery.noDescription')}
                </p>
              </div>

              <p className="text-sm text-on-surface-variant">{t('zones.addressQuery.mapResultHint')}</p>

              <button
                type="button"
                onClick={handleClear}
                className="self-end px-3 py-2 rounded-lg border border-outline text-on-surface hover:bg-surface-container text-sm"
              >
                {t('zones.addressQuery.clear')}
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
};

export default ZoneRoutesQueryCard;
