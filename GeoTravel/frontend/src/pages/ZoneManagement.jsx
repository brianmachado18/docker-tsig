import React, { useEffect, useRef, useState } from 'react';
import Feature from 'ol/Feature';
import WKT from 'ol/format/WKT';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import MapCanvas from '@/features/map/MapCanvas';
import MapControls from '@/features/map/MapControls';
import MapFeaturePopup from '@/features/map/MapFeaturePopup';
import ZoneMapInteractions from '@/features/map/interactions/ZoneMapInteractions';
import useMapStore from '@/features/map/mapStore';
import useMapPopupStore from '@/features/map/mapPopupStore';
import useRefreshEntityLayer from '@/features/map/useRefreshEntityLayer';
import ZoneActionPicker from '@/features/zones/ZoneActionPicker';
import ZoneAttractionsPanel from '@/features/zones/ZoneAttractionsPanel';
import ZoneForm from '@/features/zones/ZoneForm';
import ZoneRoutesQueryCard from '@/features/zones/ZoneRoutesQueryCard';
import useZonesStore from '@/features/zones/zonesStore';
import AdminLayout from '@/shared/components/AdminLayout';
import Modal from '@/shared/components/Modal';
import TopAppBar from '@/shared/components/TopAppBar';

const wktFormat = new WKT();
const ATTRACTION_PIN_KEY = 'zone-attraction-pin';

const showAttractionPin = (mapInstance, coordinates) => {
  if (!mapInstance || !coordinates) return;

  const existing = mapInstance.getLayers().getArray().find((l) => l.get('layerKey') === ATTRACTION_PIN_KEY);
  if (existing) mapInstance.removeLayer(existing);

  const point = new Feature({ geometry: new Point(fromLonLat(coordinates)) });
  point.setStyle([
    new Style({
      image: new CircleStyle({
        radius: 18,
        fill: new Fill({ color: 'rgba(29, 158, 117, 0.18)' }),
        stroke: new Stroke({ color: 'rgba(29, 158, 117, 0.45)', width: 2 }),
      }),
    }),
    new Style({
      image: new CircleStyle({
        radius: 9,
        fill: new Fill({ color: '#1D9E75' }),
        stroke: new Stroke({ color: '#ffffff', width: 2.5 }),
      }),
    }),
  ]);

  const layer = new VectorLayer({
    source: new VectorSource({ features: [point] }),
    zIndex: 110,
    properties: { layerKey: ATTRACTION_PIN_KEY },
  });

  mapInstance.addLayer(layer);
};

const clearAttractionPin = (mapInstance) => {
  if (!mapInstance) return;
  const existing = mapInstance.getLayers().getArray().find((l) => l.get('layerKey') === ATTRACTION_PIN_KEY);
  if (existing) mapInstance.removeLayer(existing);
};

const getEditableZoneFeature = (map, zone) => {
  const zoneId = zone?.id;
  const zoneLayers = map
    ?.getLayers()
    ?.getArray()
    ?.filter((layer) => layer?.get?.('entityKey') === 'zones') || [];

  for (const layer of zoneLayers) {
    const features = layer?.getSource?.()?.getFeatures?.() || [];
    const feature = zoneId !== undefined && zoneId !== null
      ? features.find((candidate) => String(candidate?.get?.('id')) === String(zoneId))
      : features.find((candidate) => candidate?.get?.('isDraftZone'));

    if (feature) {
      return feature;
    }
  }

  return null;
};

const restoreZoneFeatureGeometry = (map, zone, geomWkt) => {
  const feature = getEditableZoneFeature(map, zone);
  if (!feature || !geomWkt) {
    return;
  }

  const geometry = wktFormat.readGeometry(geomWkt, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  });

  feature.setGeometry(geometry);
  feature.set('geomWkt', geomWkt);

  if (feature.get('isDraftZone')) {
    feature.unset('draftGeomWkt');
    feature.unset('hasDraftGeometry');
    return;
  }

  const persistedGeomWkt = feature.get('persistedGeomWkt');
  if (!persistedGeomWkt || persistedGeomWkt === geomWkt) {
    feature.set('persistedGeomWkt', geomWkt);
    feature.unset('draftGeomWkt');
    feature.unset('hasDraftGeometry');
    return;
  }

  feature.set('draftGeomWkt', geomWkt);
  feature.set('hasDraftGeometry', true);
};

const ZoneManagement = () => {
  const {
    zones,
    activeZonesReport,
    zoneRoutes,
    visibleZoneIds,
    selectedZone,
    pendingActionZone,
    selectedZoneForRoutes,
    selectedZoneByAddress,
    selectedActiveZone,
    zoneQueryType,
    isFormOpen,
    geometryEditZone,
    geometryEditOriginalGeomWkt,
    openForm,
    closeForm,
    clearPendingActionZone,
    completeGeometryEdit,
    cancelGeometryEdit,
    fetchZones,
    clearZoneQueries,
  } = useZonesStore();
  const [isAttractionsPanelOpen, setIsAttractionsPanelOpen] = useState(false);
  const [attractionsPanelZone, setAttractionsPanelZone] = useState(null);
  const [attractionsPanelPaused, setAttractionsPanelPaused] = useState(false);
  const attractionsPanelPausedRef = useRef(false);
  const map = useMapStore((state) => state.mapInstance);
  const setActiveTool = useMapStore((state) => state.setActiveTool);
  const activeTool = useMapStore((state) => state.activeTool);
  const flyTo = useMapStore((state) => state.flyTo);
  const { isOpen: isPopupOpen, openPopup, closePopup } = useMapPopupStore();
  const refreshZoneLayers = useRefreshEntityLayer('zones');
  const displayedZones =
    activeTool === 'zone-query' && zoneQueryType === 'active-zones'
      ? activeZonesReport
      : activeTool === 'zone-query' && zoneQueryType === 'address' && selectedZoneByAddress
        ? [selectedZoneByAddress]
        : zones;
  const selectedZoneId =
    selectedActiveZone?.id ??
    selectedZoneForRoutes?.id ??
    selectedZoneByAddress?.id ??
    null;
  const zoneThemeMode = activeTool === 'zone-query' && zoneQueryType === 'active-zones' ? 'active-routes' : 'default';

  useEffect(() => {
    setActiveTool('select');
    fetchZones();
  }, [fetchZones, setActiveTool]);

  useEffect(() => {
    if (activeTool !== 'zone-query') {
      clearZoneQueries();
    }
  }, [activeTool, clearZoneQueries]);

  const handleApplyGeometry = () => {
    completeGeometryEdit();
    setActiveTool('select');
  };

  const handleCancelGeometry = () => {
    restoreZoneFeatureGeometry(map, geometryEditZone, geometryEditOriginalGeomWkt);
    cancelGeometryEdit();
    setActiveTool('select');
  };

  const handleModalClose = () => {
    refreshZoneLayers();
    closeForm();
    setActiveTool('select');
  };

  useEffect(() => {
    if (!isPopupOpen && attractionsPanelPausedRef.current) {
      attractionsPanelPausedRef.current = false;
      setAttractionsPanelPaused(false);
      clearAttractionPin(map);
    }
  }, [isPopupOpen, map]);

  const handleAttractionSelect = (attraction) => {
    if (attraction.coordinates) {
      flyTo(attraction.coordinates);
      showAttractionPin(map, attraction.coordinates);
    }
    attractionsPanelPausedRef.current = true;
    setAttractionsPanelPaused(true);
    openPopup(attraction, 'attraction');
  };

  const handlePickerEdit = () => {
    openForm(pendingActionZone);
  };

  const handlePickerViewAttractions = () => {
    setAttractionsPanelZone(pendingActionZone);
    setIsAttractionsPanelOpen(true);
    clearPendingActionZone();
  };

  const handlePickerClose = () => {
    clearPendingActionZone();
  };

  const handleAttractionsPanelClose = () => {
    clearAttractionPin(map);
    closePopup();
    attractionsPanelPausedRef.current = false;
    setAttractionsPanelPaused(false);
    setIsAttractionsPanelOpen(false);
    setAttractionsPanelZone(null);
  };

  const handleAttractionsPanelEdit = () => {
    const zone = attractionsPanelZone;
    setIsAttractionsPanelOpen(false);
    setAttractionsPanelZone(null);
    openForm(zone);
  };

  return (
    <AdminLayout activeItem="zones" mainClassName="bg-surface-dim map-pattern">
      <TopAppBar />
      <MapCanvas
        screenId="zoneManagement"
        zones={displayedZones}
        routes={zoneRoutes}
        visibleZoneIds={visibleZoneIds}
        selectedZoneId={selectedZoneId}
        zoneThemeMode={zoneThemeMode}
      />
      <ZoneMapInteractions zones={displayedZones} />
      {!geometryEditZone && <MapControls />}
      {!geometryEditZone && <ZoneRoutesQueryCard />}

      {geometryEditZone && (
        <div className="absolute left-1/2 bottom-4 sm:bottom-6 z-[60] w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 rounded-lg border border-outline-variant bg-surface-container-lowest shadow-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-label-md text-label-md text-on-surface">Editando geometría</p>
            <p className="text-xs text-on-surface-variant">{geometryEditZone.name || 'Zona sin nombre'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelGeometry}
              className="px-3 py-2 rounded-lg border border-outline text-on-surface hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyGeometry}
              className="px-3 py-2 rounded-lg bg-primary text-on-primary hover:opacity-90"
            >
              Aplicar geometría
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={isFormOpen} onClose={handleModalClose}>
        <ZoneForm
          zone={selectedZone}
          onClose={closeForm}
          onSaved={refreshZoneLayers}
          onDeleted={refreshZoneLayers}
        />
      </Modal>

      {pendingActionZone && !isFormOpen && !isAttractionsPanelOpen && (
        <ZoneActionPicker
          zone={pendingActionZone}
          onEdit={handlePickerEdit}
          onViewAttractions={handlePickerViewAttractions}
          onClose={handlePickerClose}
        />
      )}

      {isAttractionsPanelOpen && attractionsPanelZone && !attractionsPanelPaused && (
        <ZoneAttractionsPanel
          zone={attractionsPanelZone}
          onClose={handleAttractionsPanelClose}
          onEdit={handleAttractionsPanelEdit}
          onAttractionSelect={handleAttractionSelect}
        />
      )}

      <MapFeaturePopup />
    </AdminLayout>
  );
};

export default ZoneManagement;
