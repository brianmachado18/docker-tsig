import React, { useCallback, useEffect, useState } from 'react';
import useMapStore from '@/features/map/mapStore';
import { ROUTE_STATUS_LABEL_KEYS, STATUS_LABELS, STATUS_STYLES } from '@/features/routes/routeStatus';
import { routesService } from '@/features/routes/routesService';
import useZonesStore from '@/features/zones/zonesStore';
import useLangStore from '@/shared/i18n/langStore';
import { getApiErrorMessage } from '@/shared/lib/forms/validation';

const MIN_AUTOCOMPLETE_QUERY_LENGTH = 2;
const ROUTE_REFERENCE_PATTERN = /\bruta\s*\d+\b|\bkm\.?\s*\d+\b|^\d+$/i;

const isRouteLikeReference = (value) => ROUTE_REFERENCE_PATTERN.test(String(value || '').trim());

const ZoneRoutesQueryCard = () => {
  const activeTool = useMapStore((state) => state.activeTool);
  const setActiveTool = useMapStore((state) => state.setActiveTool);
  const {
    zoneQueryType,
    setZoneQueryType,
    selectedZoneForRoutes,
    selectedZoneByAddress,
    selectedActiveZone,
    activeZonesReport,
    intersectionRouteResult,
    zoneRoutes,
    isLoadingZoneRoutes,
    isLoadingAddressZone,
    isLoadingActiveZonesReport,
    isLoadingIntersectionRoute,
    routeQueryError,
    addressQueryError,
    activeZonesReportError,
    intersectionQueryError,
    searchZoneByAddress,
    searchRouteByIntersection,
    searchRouteByPoint,
    fetchActiveZonesReport,
    clearZoneQueries,
  } = useZonesStore();
  const { t } = useLangStore();
  const [address, setAddress] = useState('');
  const [streetQuery, setStreetQuery] = useState('');
  const [streetSuggestions, setStreetSuggestions] = useState([]);
  const [isLoadingStreetSuggestions, setIsLoadingStreetSuggestions] = useState(false);
  const [streetSuggestionsError, setStreetSuggestionsError] = useState(null);
  const [selectedStreetSuggestion, setSelectedStreetSuggestion] = useState(null);
  const [crossStreetQuery, setCrossStreetQuery] = useState('');
  const [crossStreetSuggestions, setCrossStreetSuggestions] = useState([]);
  const [isLoadingCrossStreetSuggestions, setIsLoadingCrossStreetSuggestions] = useState(false);
  const [crossStreetSuggestionsError, setCrossStreetSuggestionsError] = useState(null);
  const [selectedCrossStreetSuggestion, setSelectedCrossStreetSuggestion] = useState(null);

  const isQueryMode = activeTool === 'zone-query';
  const routeQueryErrorMessage = getApiErrorMessage(routeQueryError, t('common.error'));
  const addressQueryErrorMessage = getApiErrorMessage(addressQueryError, t('common.error'));
  const activeZonesReportErrorMessage = getApiErrorMessage(activeZonesReportError, t('common.error'));
  const intersectionQueryErrorMessage = getApiErrorMessage(intersectionQueryError, t('common.error'));
  const streetSuggestionsErrorMessage = getApiErrorMessage(streetSuggestionsError, t('common.error'));
  const crossStreetSuggestionsErrorMessage = getApiErrorMessage(crossStreetSuggestionsError, t('common.error'));
  const routeCountLabel =
    zoneRoutes.length === 1
      ? t('zones.routesQuery.singleResult')
      : t('zones.routesQuery.multiResult').replace('{count}', String(zoneRoutes.length));
  const addressResultLabel = selectedZoneByAddress
    ? selectedZoneByAddress.name || `${t('common.zones')} #${selectedZoneByAddress.id}`
    : '';
  const intersectionRoute = intersectionRouteResult?.route || null;
  const intersectionZones = Array.isArray(intersectionRouteResult?.zones) ? intersectionRouteResult.zones : [];
  const activeZonesCountLabel =
    activeZonesReport.length === 1
      ? t('zones.activeZonesQuery.singleZoneResult')
      : t('zones.activeZonesQuery.multiZoneResult').replace('{count}', String(activeZonesReport.length));
  const selectedActiveRoutesCount = selectedActiveZone?.activeRoutesCount ?? 0;
  const selectedOffSeasonRoutesCount = selectedActiveZone?.offSeasonRoutesCount ?? 0;
  const reportedRoutesCountLabel =
    zoneRoutes.length === 1
      ? t('zones.activeZonesQuery.singleReportedRouteResult')
      : t('zones.activeZonesQuery.multiReportedRouteResult').replace('{count}', String(zoneRoutes.length));
  const activeRoutesCountLabel =
    selectedActiveRoutesCount === 1
      ? t('zones.activeZonesQuery.singleActiveRouteResult')
      : t('zones.activeZonesQuery.multiActiveRouteResult').replace('{count}', String(selectedActiveRoutesCount));
  const offSeasonRoutesCountLabel =
    selectedOffSeasonRoutesCount === 1
      ? t('zones.activeZonesQuery.singleOffSeasonRouteResult')
      : t('zones.activeZonesQuery.multiOffSeasonRouteResult').replace(
          '{count}',
          String(selectedOffSeasonRoutesCount)
        );
  const intersectionDistanceLabel =
    intersectionRouteResult?.distanceMeters !== null && intersectionRouteResult?.distanceMeters !== undefined
      ? Number(intersectionRouteResult.distanceMeters).toFixed(2)
      : null;
  const normalizedStreetQuery = streetQuery.trim();
  const normalizedCrossStreetQuery = crossStreetQuery.trim();
  const looksLikeRouteStreetReference = isRouteLikeReference(normalizedStreetQuery);
  const looksLikeRouteCrossReference = isRouteLikeReference(normalizedCrossStreetQuery);
  const canRequestStreetSuggestions =
    normalizedStreetQuery.length >= MIN_AUTOCOMPLETE_QUERY_LENGTH && !looksLikeRouteStreetReference;
  const canRequestCrossStreetSuggestions =
    Boolean(selectedStreetSuggestion) &&
    normalizedCrossStreetQuery.length >= MIN_AUTOCOMPLETE_QUERY_LENGTH &&
    !looksLikeRouteCrossReference;
  const canSearchIntersectionBySuggestion = Boolean(selectedStreetSuggestion && selectedCrossStreetSuggestion);
  const canUseTextFallbackForStreet1 =
    looksLikeRouteStreetReference ||
    (normalizedStreetQuery.length >= MIN_AUTOCOMPLETE_QUERY_LENGTH &&
      !selectedStreetSuggestion &&
      !isLoadingStreetSuggestions &&
      !streetSuggestionsErrorMessage &&
      !streetSuggestions.length);
  const canUseTextFallbackForStreet2 =
    looksLikeRouteCrossReference ||
    (normalizedCrossStreetQuery.length >= MIN_AUTOCOMPLETE_QUERY_LENGTH &&
      !selectedCrossStreetSuggestion &&
      !isLoadingCrossStreetSuggestions &&
      !crossStreetSuggestionsErrorMessage &&
      !crossStreetSuggestions.length);
  const canSearchIntersectionByText =
    normalizedStreetQuery.length > 0 &&
    normalizedCrossStreetQuery.length > 0 &&
    (looksLikeRouteStreetReference ||
      looksLikeRouteCrossReference ||
      (canUseTextFallbackForStreet1 && canUseTextFallbackForStreet2));
  const canSearchIntersection = canSearchIntersectionBySuggestion || canSearchIntersectionByText;

  const resetIntersectionFormState = useCallback(() => {
    setStreetQuery('');
    setStreetSuggestions([]);
    setIsLoadingStreetSuggestions(false);
    setStreetSuggestionsError(null);
    setSelectedStreetSuggestion(null);
    setCrossStreetQuery('');
    setCrossStreetSuggestions([]);
    setIsLoadingCrossStreetSuggestions(false);
    setCrossStreetSuggestionsError(null);
    setSelectedCrossStreetSuggestion(null);
  }, []);

  useEffect(() => {
    if (!isQueryMode) {
      setAddress('');
      resetIntersectionFormState();
    }
  }, [isQueryMode, resetIntersectionFormState]);

  useEffect(() => {
    if (!isQueryMode || zoneQueryType !== 'intersection') {
      setStreetSuggestions([]);
      setIsLoadingStreetSuggestions(false);
      return;
    }

    const normalizedQuery = streetQuery.trim();
    if (!canRequestStreetSuggestions) {
      setStreetSuggestions([]);
      setIsLoadingStreetSuggestions(false);
      if (looksLikeRouteStreetReference) {
        setStreetSuggestionsError(null);
      }
      return;
    }

    if (selectedStreetSuggestion && normalizedQuery === selectedStreetSuggestion.label) {
      setStreetSuggestions([]);
      setIsLoadingStreetSuggestions(false);
      return;
    }

    let cancelled = false;
    setIsLoadingStreetSuggestions(true);
    setStreetSuggestionsError(null);

    const timeoutId = setTimeout(async () => {
      try {
        const suggestions = await routesService.suggestStreetCandidates(normalizedQuery);
        if (!cancelled) {
          setStreetSuggestions(suggestions);
        }
      } catch (error) {
        if (!cancelled) {
          setStreetSuggestions([]);
          setStreetSuggestionsError(error);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStreetSuggestions(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    canRequestStreetSuggestions,
    isQueryMode,
    looksLikeRouteStreetReference,
    selectedStreetSuggestion,
    streetQuery,
    zoneQueryType,
  ]);

  useEffect(() => {
    if (!isQueryMode || zoneQueryType !== 'intersection' || !selectedStreetSuggestion) {
      setCrossStreetSuggestions([]);
      setIsLoadingCrossStreetSuggestions(false);
      return;
    }

    const normalizedQuery = crossStreetQuery.trim();
    if (!canRequestCrossStreetSuggestions) {
      setCrossStreetSuggestions([]);
      setIsLoadingCrossStreetSuggestions(false);
      return;
    }

    if (selectedCrossStreetSuggestion && normalizedQuery === selectedCrossStreetSuggestion.streetLabel) {
      setCrossStreetSuggestions([]);
      setIsLoadingCrossStreetSuggestions(false);
      return;
    }

    let cancelled = false;
    setIsLoadingCrossStreetSuggestions(true);
    setCrossStreetSuggestionsError(null);

    const timeoutId = setTimeout(async () => {
      try {
        const suggestions = await routesService.suggestIntersectionOptions(
          selectedStreetSuggestion.streetId,
          normalizedQuery
        );
        if (!cancelled) {
          setCrossStreetSuggestions(suggestions);
        }
      } catch (error) {
        if (!cancelled) {
          setCrossStreetSuggestions([]);
          setCrossStreetSuggestionsError(error);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCrossStreetSuggestions(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    canRequestCrossStreetSuggestions,
    crossStreetQuery,
    isQueryMode,
    selectedCrossStreetSuggestion,
    selectedStreetSuggestion,
    zoneQueryType,
  ]);

  const handleToggleQueryMode = () => {
    if (isQueryMode) {
      clearZoneQueries();
      resetIntersectionFormState();
      setActiveTool('select');
      return;
    }

    clearZoneQueries();
    resetIntersectionFormState();
    setZoneQueryType('routes');
    setActiveTool('zone-query');
  };

  const handleClear = () => {
    clearZoneQueries();
    resetIntersectionFormState();
    setActiveTool('select');
  };

  const handleChangeQueryType = (nextType) => {
    setZoneQueryType(nextType);
    resetIntersectionFormState();
    if (nextType === 'active-zones') {
      fetchActiveZonesReport();
    }
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    if (!isQueryMode) {
      setActiveTool('zone-query');
    }
    await searchZoneByAddress(address);
  };

  const handleIntersectionSubmit = async (event) => {
    event.preventDefault();
    if (!canSearchIntersection) {
      return;
    }
    if (!isQueryMode) {
      setActiveTool('zone-query');
    }
    if (canSearchIntersectionBySuggestion) {
      await searchRouteByPoint(
        Number(selectedCrossStreetSuggestion.lon),
        Number(selectedCrossStreetSuggestion.lat)
      );
      return;
    }

    await searchRouteByIntersection(normalizedStreetQuery, normalizedCrossStreetQuery);
  };

  const handleStreetSuggestionSelect = (suggestion) => {
    if (!suggestion) {
      return;
    }

    setZoneQueryType('intersection');
    setSelectedStreetSuggestion(suggestion);
    setStreetSuggestionsError(null);
    setStreetQuery(suggestion.label);
    setStreetSuggestions([]);
    setIsLoadingStreetSuggestions(false);
    setCrossStreetQuery('');
    setCrossStreetSuggestions([]);
    setIsLoadingCrossStreetSuggestions(false);
    setCrossStreetSuggestionsError(null);
    setSelectedCrossStreetSuggestion(null);
  };

  const handleCrossStreetSuggestionSelect = (suggestion) => {
    if (!suggestion) {
      return;
    }

    setZoneQueryType('intersection');
    setSelectedCrossStreetSuggestion(suggestion);
    setCrossStreetSuggestionsError(null);
    setCrossStreetQuery(suggestion.streetLabel);
    setCrossStreetSuggestions([]);
    setIsLoadingCrossStreetSuggestions(false);
  };

  return (
    <section className="absolute left-4 right-4 bottom-24 md:left-auto md:right-4 md:bottom-auto md:top-24 z-40 md:w-[340px] max-h-[42dvh] md:max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border border-outline-variant bg-surface/95 backdrop-blur-md shadow-lg p-4 flex flex-col gap-3">
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
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
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
          <button
            type="button"
            onClick={() => handleChangeQueryType('intersection')}
            className={`rounded-lg px-3 py-2 text-sm ${
              zoneQueryType === 'intersection'
                ? 'bg-primary text-on-primary'
                : 'border border-outline text-on-surface hover:bg-surface-container'
            }`}
          >
            {t('zones.query.intersectionTab')}
          </button>
          <button
            type="button"
            onClick={() => handleChangeQueryType('active-zones')}
            className={`rounded-lg px-3 py-2 text-sm ${
              zoneQueryType === 'active-zones'
                ? 'bg-primary text-on-primary'
                : 'border border-outline text-on-surface hover:bg-surface-container'
            }`}
          >
            {t('zones.query.activeZonesTab')}
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

      {isQueryMode && zoneQueryType === 'intersection' && (
        <>
          <form className="flex flex-col gap-3" onSubmit={handleIntersectionSubmit}>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-on-surface">{t('zones.intersectionQuery.via1Label')}</span>
              <input
                type="text"
                value={streetQuery}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setStreetQuery(nextValue);
                  if (selectedStreetSuggestion && nextValue !== selectedStreetSuggestion.label) {
                    setZoneQueryType('intersection');
                    setSelectedStreetSuggestion(null);
                    setCrossStreetQuery('');
                    setCrossStreetSuggestions([]);
                    setIsLoadingCrossStreetSuggestions(false);
                    setStreetSuggestionsError(null);
                    setCrossStreetSuggestionsError(null);
                    setSelectedCrossStreetSuggestion(null);
                  }
                }}
                placeholder={t('zones.intersectionQuery.via1Placeholder')}
                className="px-3 py-2 rounded-lg border border-outline bg-transparent text-on-surface"
              />
            </label>

            {isLoadingStreetSuggestions && (
              <p className="text-sm text-on-surface-variant">
                {t('zones.intersectionQuery.loadingStreetSuggestions')}
              </p>
            )}

            {!isLoadingStreetSuggestions && streetSuggestionsErrorMessage && (
              <p className="text-sm text-error">{streetSuggestionsErrorMessage}</p>
            )}

            {!isLoadingStreetSuggestions &&
              !streetSuggestionsErrorMessage &&
              canRequestStreetSuggestions &&
              !selectedStreetSuggestion &&
              !streetSuggestions.length && (
                <p className="text-sm text-on-surface-variant">
                  {t('zones.intersectionQuery.streetEmptySuggestions')}
                </p>
              )}

            {!!streetSuggestions.length && (
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-2">
                <p className="px-2 pt-1 text-xs uppercase tracking-wide text-on-surface-variant">
                  {t('zones.intersectionQuery.streetSuggestionsTitle')}
                </p>
                <ul className="mt-2 space-y-1">
                  {streetSuggestions.map((suggestion) => (
                    <li key={`${suggestion.streetId}-${suggestion.label}`}>
                      <button
                        type="button"
                        onClick={() => handleStreetSuggestionSelect(suggestion)}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container"
                      >
                        <span className="block">{suggestion.streetName || suggestion.label}</span>
                        {!!suggestion.locality && (
                          <span className="mt-1 block text-xs text-on-surface-variant">{suggestion.label}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedStreetSuggestion && (
              <div className="rounded-xl bg-surface-container-low p-3">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">
                  {t('zones.intersectionQuery.selectedStreetLabel')}
                </p>
                <p className="mt-1 text-sm text-on-surface">{selectedStreetSuggestion.label}</p>
              </div>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-sm text-on-surface">{t('zones.intersectionQuery.via2Label')}</span>
              <input
                type="text"
                value={crossStreetQuery}
                disabled={!selectedStreetSuggestion && !canUseTextFallbackForStreet1}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setCrossStreetQuery(nextValue);
                  if (selectedCrossStreetSuggestion && nextValue !== selectedCrossStreetSuggestion.streetLabel) {
                    setZoneQueryType('intersection');
                    setSelectedCrossStreetSuggestion(null);
                  }
                  setCrossStreetSuggestionsError(null);
                }}
                placeholder={t('zones.intersectionQuery.via2Placeholder')}
                className="px-3 py-2 rounded-lg border border-outline bg-transparent text-on-surface disabled:opacity-60"
              />
            </label>

            {!selectedStreetSuggestion && !canUseTextFallbackForStreet1 && (
              <p className="text-sm text-on-surface-variant">{t('zones.intersectionQuery.via2DisabledHint')}</p>
            )}

            {canSearchIntersectionByText && (
              <p className="text-sm text-on-surface-variant">{t('zones.intersectionQuery.textFallbackHint')}</p>
            )}

            {selectedStreetSuggestion && isLoadingCrossStreetSuggestions && (
              <p className="text-sm text-on-surface-variant">
                {t('zones.intersectionQuery.loadingCrossSuggestions')}
              </p>
            )}

            {selectedStreetSuggestion && !isLoadingCrossStreetSuggestions && crossStreetSuggestionsErrorMessage && (
              <p className="text-sm text-error">{crossStreetSuggestionsErrorMessage}</p>
            )}

            {selectedStreetSuggestion &&
              !isLoadingCrossStreetSuggestions &&
              !crossStreetSuggestionsErrorMessage &&
              canRequestCrossStreetSuggestions &&
              !selectedCrossStreetSuggestion &&
              !crossStreetSuggestions.length && (
                <p className="text-sm text-on-surface-variant">
                  {t('zones.intersectionQuery.crossEmptySuggestions')}
                </p>
              )}

            {!!crossStreetSuggestions.length && (
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-2">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">
                  {t('zones.intersectionQuery.crossSuggestionsTitle')}
                </p>
                <ul className="mt-2 space-y-1">
                  {crossStreetSuggestions.map((suggestion) => (
                    <li key={`${suggestion.intersectionLabel}-${suggestion.lon}-${suggestion.lat}`}>
                      <button
                        type="button"
                        onClick={() => handleCrossStreetSuggestionSelect(suggestion)}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container"
                      >
                        <span className="block">{suggestion.streetLabel}</span>
                        <span className="mt-1 block text-xs text-on-surface-variant">
                          {suggestion.intersectionLabel}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={
                isLoadingIntersectionRoute ||
                isLoadingStreetSuggestions ||
                isLoadingCrossStreetSuggestions ||
                !canSearchIntersection
              }
              className="self-end px-3 py-2 rounded-lg bg-primary text-on-primary text-sm disabled:opacity-60"
            >
              {isLoadingIntersectionRoute
                ? t('zones.intersectionQuery.loading')
                : t('zones.intersectionQuery.search')}
            </button>
          </form>

          {!selectedStreetSuggestion &&
            !canUseTextFallbackForStreet1 &&
            !isLoadingStreetSuggestions &&
            !intersectionQueryErrorMessage && (
            <p className="text-sm text-on-surface-variant">{t('zones.intersectionQuery.waitingStreetSelection')}</p>
          )}

          {selectedStreetSuggestion &&
            !selectedCrossStreetSuggestion &&
            !canSearchIntersectionByText &&
            !isLoadingCrossStreetSuggestions &&
            !intersectionQueryErrorMessage && (
              <p className="text-sm text-on-surface-variant">{t('zones.intersectionQuery.waitingCrossSelection')}</p>
            )}

          {intersectionQueryErrorMessage && (
            <p className="text-sm text-error">{intersectionQueryErrorMessage}</p>
          )}

          {intersectionRoute && !isLoadingIntersectionRoute && !intersectionQueryErrorMessage && (
            <>
              <div className="rounded-xl bg-surface-container p-3">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">
                  {t('zones.intersectionQuery.foundRoute')}
                </p>
                {selectedStreetSuggestion && (
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {t('zones.intersectionQuery.selectedStreetLabel')}: {selectedStreetSuggestion.label}
                  </p>
                )}
                {!selectedStreetSuggestion && normalizedStreetQuery && (
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {t('zones.intersectionQuery.selectedStreetLabel')}: {normalizedStreetQuery}
                  </p>
                )}
                {selectedCrossStreetSuggestion && (
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {t('zones.intersectionQuery.selectedSuggestionLabel')}: {selectedCrossStreetSuggestion.intersectionLabel}
                  </p>
                )}
                {!selectedCrossStreetSuggestion && normalizedCrossStreetQuery && (
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {t('zones.intersectionQuery.selectedSuggestionLabel')}: {normalizedCrossStreetQuery}
                  </p>
                )}
                <p className="mt-1 font-title-sm text-title-sm text-on-surface">
                  {intersectionRoute.name || `${t('common.routes')} #${intersectionRoute.id}`}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {intersectionRoute.description || t('zones.intersectionQuery.noDescription')}
                </p>
                {intersectionDistanceLabel && (
                  <p className="mt-2 text-sm text-on-surface">
                    {t('zones.intersectionQuery.distanceLabel').replace('{distance}', intersectionDistanceLabel)}
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-surface-container-low p-3">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">
                  {t('zones.intersectionQuery.routeZones')}
                </p>

                {intersectionZones.length ? (
                  <ul className="mt-2 space-y-2">
                    {intersectionZones.map((zone) => (
                      <li key={zone.id} className="rounded-lg border border-outline-variant bg-surface p-2">
                        <p className="font-label-lg text-label-lg text-on-surface">
                          {zone.name || `${t('common.zones')} #${zone.id}`}
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {zone.description || t('zones.intersectionQuery.noDescription')}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-on-surface-variant">{t('zones.intersectionQuery.noZones')}</p>
                )}
              </div>

              <p className="text-sm text-on-surface-variant">{t('zones.intersectionQuery.mapResultHint')}</p>

              <button
                type="button"
                onClick={handleClear}
                className="self-end px-3 py-2 rounded-lg border border-outline text-on-surface hover:bg-surface-container text-sm"
              >
                {t('zones.intersectionQuery.clear')}
              </button>
            </>
          )}
        </>
      )}

      {isQueryMode && zoneQueryType === 'active-zones' && (
        <>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container p-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-on-surface-variant">
                {t('zones.activeZonesQuery.title')}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {activeZonesReport.length ? activeZonesCountLabel : t('zones.activeZonesQuery.emptyState')}
              </p>
            </div>

            <button
              type="button"
              onClick={fetchActiveZonesReport}
              disabled={isLoadingActiveZonesReport}
              className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm text-on-primary disabled:opacity-60"
            >
              {isLoadingActiveZonesReport
                ? t('zones.activeZonesQuery.loading')
                : t('zones.activeZonesQuery.loadButton')}
            </button>
          </div>

          {activeZonesReportErrorMessage && (
            <p className="text-sm text-error">{activeZonesReportErrorMessage}</p>
          )}

          {!isLoadingActiveZonesReport && !activeZonesReportErrorMessage && !activeZonesReport.length && (
            <p className="text-sm text-on-surface-variant">{t('zones.activeZonesQuery.empty')}</p>
          )}

          {!!activeZonesReport.length && !selectedActiveZone && !isLoadingActiveZonesReport && (
            <p className="text-sm text-on-surface-variant">{t('zones.activeZonesQuery.waitingSelection')}</p>
          )}

          {selectedActiveZone && !isLoadingActiveZonesReport && !activeZonesReportErrorMessage && (
            <>
              <div className="rounded-xl bg-surface-container p-3">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">
                  {t('zones.activeZonesQuery.selectedZone')}
                </p>
                <p className="mt-1 font-title-sm text-title-sm text-on-surface">
                  {selectedActiveZone.name || `${t('common.zones')} #${selectedActiveZone.id}`}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">{reportedRoutesCountLabel}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-green-700">{activeRoutesCountLabel}</p>
                  <p className="text-sm text-red-700">{offSeasonRoutesCountLabel}</p>
                </div>
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
                            {route.description || t('zones.activeZonesQuery.noDescription')}
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
                <p className="text-sm text-on-surface-variant">{t('zones.activeZonesQuery.noRoutes')}</p>
              )}

              <p className="text-sm text-on-surface-variant">{t('zones.activeZonesQuery.mapResultHint')}</p>

              <button
                type="button"
                onClick={handleClear}
                className="self-end px-3 py-2 rounded-lg border border-outline text-on-surface hover:bg-surface-container text-sm"
              >
                {t('zones.activeZonesQuery.clear')}
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
};

export default ZoneRoutesQueryCard;
