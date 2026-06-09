import React, { useEffect, useState } from 'react';
import useAttractionsStore from '@/features/attractions/attractionsStore';
import ImagePicker from '@/features/attractions/ImagePicker';
import useRefreshEntityLayer from '@/features/map/useRefreshEntityLayer';

const CLASIFICACIONES = [
  { value: 'MUSEO', label: 'Museo', emoji: '🏛️' },
  { value: 'TEATRO', label: 'Teatro', emoji: '🎭' },
  { value: 'MONUMENTO', label: 'Monumento', emoji: '🗿' },
  { value: 'PLAZA', label: 'Plaza', emoji: '🏙️' },
  { value: 'GASTRONOMIA', label: 'Gastronomía', emoji: '🍽️' },
  { value: 'PLAYA', label: 'Playa', emoji: '🏖️' },
  { value: 'PARQUE', label: 'Parque', emoji: '🌿' },
];

const StepIndicator = ({ current }) => (
  <div className="flex items-center justify-center gap-2 mb-5">
    {[1, 2, 3].map((n, i) => (
      <React.Fragment key={n}>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
            n < current
              ? 'bg-[#1D9E75] border-[#1D9E75] text-white'
              : n === current
              ? 'border-primary text-primary'
              : 'border-outline-variant text-on-surface-variant'
          }`}
        >
          {n < current ? '✓' : n}
        </div>
        {i < 2 && (
          <div
            className={`h-0.5 w-8 transition-colors ${
              n < current ? 'bg-[#1D9E75]' : 'bg-outline-variant'
            }`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

const NuevaAtraccionModal = ({ onUbicarEnMapa, onSaved, onDeleted }) => {
  const {
    closeForm,
    saveAttraction,
    deleteAttraction,
    selectedAttraction: attraction,
    isSaving,
    isDeleting,
    error,
    clearError,
  } = useAttractionsStore();
  const refreshAttractionLayers = useRefreshEntityLayer('attractions');

  const isEditing = !!attraction?.id;
  const initialCoords =
    attraction?.coordinates
      ? { lon: attraction.coordinates[0], lat: attraction.coordinates[1] }
      : attraction?.longitude != null
      ? { lon: Number(attraction.longitude), lat: Number(attraction.latitude) }
      : null;

  // Skip to step 3 when coming directly from a map click (new point, coords already set)
  const [step, setStep] = useState(initialCoords && !isEditing ? 3 : 1);
  const [coords, setCoords] = useState(initialCoords);

  const [nombre, setNombre] = useState(attraction?.title || '');
  const [clasificacion, setClasificacion] = useState(
    attraction?.category || 'MUSEO'
  );
  const [descripcion, setDescripcion] = useState(attraction?.description || '');
  const [fotoUrl, setFotoUrl] = useState(attraction?.imageUrl || '');
  const [validationError, setValidationError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleNominatimSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5&countrycodes=uy`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result) => {
    setCoords({ lon: parseFloat(result.lon), lat: parseFloat(result.lat) });
    setStep(3);
  };

  const handleUbicarEnMapa = () => {
    onUbicarEnMapa({ nombre, clasificacion, descripcion, fotoUrl, id: attraction?.id });
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setValidationError('El nombre es requerido.');
      return;
    }
    if (!descripcion.trim()) {
      setValidationError('La descripción es requerida.');
      return;
    }
    if (!coords) {
      setValidationError('Falta la ubicación.');
      return;
    }
    setValidationError('');

    const ok = await saveAttraction({
      id: attraction?.id,
      title: nombre.trim(),
      description: descripcion.trim(),
      category: clasificacion,
      imageUrl: fotoUrl,
      longitude: coords.lon,
      latitude: coords.lat,
    });

    if (ok) {
      refreshAttractionLayers();
      onSaved?.();
    }
  };

  const handleDelete = async () => {
    if (!attraction?.id) return;
    const confirmed = window.confirm('¿Eliminar atracción?');
    if (!confirmed) return;
    const ok = await deleteAttraction(attraction.id);
    if (ok) {
      refreshAttractionLayers();
      onDeleted?.();
      closeForm();
    }
  };

  const canSave = nombre.trim() && clasificacion && coords && !isSaving && !isDeleting;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-bright shrink-0">
        <h3 className="font-headline-lg text-headline-lg text-on-surface">
          {isEditing ? 'Editar atracción' : 'Nueva atracción'}
        </h3>
        <button
          onClick={closeForm}
          className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 flex-1 overflow-y-auto min-h-0">
        <StepIndicator current={step} />

        {/* Paso 1: elegir modo de ubicación */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-on-surface-variant text-center mb-1">
              ¿Cómo querés ubicar la atracción?
            </p>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-outline-variant hover:border-primary hover:bg-surface-container transition-colors text-left"
            >
              <span className="text-2xl">🔍</span>
              <div>
                <p className="font-medium text-on-surface text-sm">Buscar dirección</p>
                <p className="text-xs text-on-surface-variant">
                  Escribí una dirección o lugar y buscamos las coordenadas
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleUbicarEnMapa}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-outline-variant hover:border-primary hover:bg-surface-container transition-colors text-left"
            >
              <span className="text-2xl">📍</span>
              <div>
                <p className="font-medium text-on-surface text-sm">Marcar en el mapa</p>
                <p className="text-xs text-on-surface-variant">
                  Hacé click en el mapa para elegir la ubicación exacta
                </p>
              </div>
            </button>

            {isEditing && initialCoords && (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-[#1D9E75] bg-[#E1F5EE] hover:bg-[#c8eede] transition-colors text-left"
              >
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium text-on-surface text-sm">Mantener ubicación actual</p>
                  <p className="text-xs text-on-surface-variant">
                    {initialCoords.lat.toFixed(5)}, {initialCoords.lon.toFixed(5)}
                  </p>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Paso 2: buscar dirección */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-on-surface-variant text-center mb-1">
              Buscá la dirección o lugar
            </p>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 border border-outline rounded bg-surface text-sm"
                type="text"
                placeholder="ej. Ciudad Vieja, Montevideo"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleNominatimSearch();
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={handleNominatimSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-3 py-2 text-sm bg-primary text-on-primary rounded disabled:opacity-60"
              >
                {isSearching ? '...' : 'Buscar'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <ul className="flex flex-col gap-1 max-h-52 overflow-y-auto">
                {searchResults.map((r) => (
                  <li key={r.place_id}>
                    <button
                      type="button"
                      onClick={() => handleSelectResult(r)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-surface-container border border-outline-variant transition-colors"
                    >
                      <span className="block text-sm font-medium text-on-surface truncate">
                        {r.display_name.split(',')[0]}
                      </span>
                      <span className="block text-xs text-on-surface-variant truncate">
                        {r.display_name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-on-surface-variant hover:text-on-surface mt-1 text-left"
            >
              ← Volver
            </button>
          </div>
        )}

        {/* Paso 3: formulario */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            {coords && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#E1F5EE] border border-[#1D9E75]">
                <span className="text-xs text-[#0F6E56] font-medium">
                  📍 {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[#0F6E56] underline hover:text-[#1D9E75]"
                >
                  cambiar
                </button>
              </div>
            )}

            <label className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant">Nombre *</span>
              <input
                className="w-full px-3 py-2 border border-outline rounded bg-surface text-sm"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoFocus
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Clasificación *
              </span>
              <div className="grid grid-cols-3 gap-2">
                {CLASIFICACIONES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setClasificacion(c.value)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border-2 text-xs font-medium transition-colors ${
                      clasificacion === c.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-outline hover:bg-surface-container'
                    }`}
                  >
                    <span className="text-lg">{c.emoji}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Descripción *
              </span>
              <textarea
                className="w-full px-3 py-2 border border-outline rounded bg-surface text-sm resize-none"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </label>

            <div className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Foto (opcional)
              </span>
              <ImagePicker value={fotoUrl} onChange={setFotoUrl} />
            </div>

            {(validationError || error) && (
              <p className="text-sm text-error">
                {validationError || error?.message || String(error)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer — solo en paso 3 */}
      {step === 3 && (
        <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between bg-surface-bright shrink-0">
          {isEditing ? (
            <button
              type="button"
              disabled={isDeleting || isSaving}
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg border border-error text-error text-sm disabled:opacity-40"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeForm}
              disabled={isSaving || isDeleting}
              className="px-4 py-2 rounded-lg border border-outline text-on-surface text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={!canSave}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm disabled:opacity-60"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevaAtraccionModal;
