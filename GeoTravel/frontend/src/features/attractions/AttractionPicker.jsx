import React, { useMemo, useState } from 'react';

const CATEGORY_ICONS = {
  CULTURAL: 'account_balance',
  GASTRONOMICO: 'restaurant',
  NATURAL: 'forest',
  HISTORICA: 'castle',
  HITORICA: 'castle',
  AVENTURA: 'hiking',
  OTRO: 'place',
};

const CATEGORY_LABELS = {
  CULTURAL: 'Cultural',
  GASTRONOMICO: 'Gastro',
  NATURAL: 'Natural',
  HISTORICA: 'Histórica',
  HITORICA: 'Histórica',
  AVENTURA: 'Aventura',
  OTRO: 'Otro',
};

const AttractionPicker = ({ attractions, selectedIds, onChange }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => {
    return [...new Set(attractions.map((a) => a.category || 'OTRO'))].sort();
  }, [attractions]);

  const available = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return attractions.filter((a) => {
      if (selectedIds.includes(a.id)) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (lowerSearch && !a.title.toLowerCase().includes(lowerSearch)) return false;
      return true;
    });
  }, [attractions, selectedIds, categoryFilter, search]);

  const selected = useMemo(() => {
    return selectedIds.map((id) => attractions.find((a) => a.id === id)).filter(Boolean);
  }, [attractions, selectedIds]);

  const addAttraction = (id) => onChange([...selectedIds, id]);

  const removeAttraction = (id) => onChange(selectedIds.filter((i) => i !== id));

  const moveAttraction = (index, direction) => {
    const newIds = [...selectedIds];
    const target = index + direction;
    if (target < 0 || target >= newIds.length) return;
    [newIds[index], newIds[target]] = [newIds[target], newIds[index]];
    onChange(newIds);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="font-label-md text-label-md text-on-surface-variant">Paradas del recorrido</span>
      <p className="text-xs text-outline">
        Si no dibujás el recorrido en el mapa, se generará automáticamente uniendo las paradas en orden.
      </p>

      <div className="relative">
        <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
          search
        </span>
        <input
          className="w-full pl-8 pr-3 py-2 border border-outline rounded bg-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar atracción..."
          type="text"
          value={search}
        />
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <button
          className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
            categoryFilter === 'all'
              ? 'bg-primary text-on-primary border-primary'
              : 'border-outline text-on-surface-variant hover:bg-surface-container'
          }`}
          onClick={() => setCategoryFilter('all')}
          type="button"
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
              categoryFilter === cat
                ? 'bg-primary text-on-primary border-primary'
                : 'border-outline text-on-surface-variant hover:bg-surface-container'
            }`}
            key={cat}
            onClick={() => setCategoryFilter(cat === categoryFilter ? 'all' : cat)}
            type="button"
          >
            <span className="material-symbols-outlined text-[12px]">{CATEGORY_ICONS[cat] || 'place'}</span>
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      <div className="border border-outline rounded bg-surface overflow-hidden">
        <div className="px-2 py-1.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
          <span className="text-xs font-medium text-on-surface-variant">Disponibles</span>
          <span className="text-xs text-outline">{available.length}</span>
        </div>
        <div className="max-h-40 overflow-y-auto divide-y divide-outline-variant">
          {available.length === 0 ? (
            <p className="text-xs text-outline text-center py-4">
              {search || categoryFilter !== 'all' ? 'Sin resultados.' : 'No hay atracciones disponibles.'}
            </p>
          ) : (
            available.map((attraction) => (
              <div
                className="flex items-center gap-2 px-2 py-2 hover:bg-surface-container-low transition-colors"
                key={attraction.id}
              >
                <div className="w-8 h-8 rounded flex-shrink-0 overflow-hidden bg-surface-container flex items-center justify-center">
                  {attraction.imageUrl ? (
                    <img alt={attraction.title} className="w-full h-full object-cover" src={attraction.imageUrl} />
                  ) : (
                    <span className="material-symbols-outlined text-[16px] text-outline">
                      {CATEGORY_ICONS[attraction.category] || 'place'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface truncate">{attraction.title}</p>
                  <p className="text-xs text-outline truncate">
                    {CATEGORY_LABELS[attraction.category] || attraction.category}
                  </p>
                </div>
                <button
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-colors flex items-center justify-center"
                  onClick={() => addAttraction(attraction.id)}
                  title="Agregar"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border border-outline rounded bg-surface overflow-hidden">
        <div className="px-2 py-1.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
          <span className="text-xs font-medium text-on-surface-variant">Seleccionadas</span>
          <span className="text-xs text-outline">{selected.length}</span>
        </div>
        <div className="divide-y divide-outline-variant">
          {selected.length === 0 ? (
            <p className="text-xs text-outline text-center py-4">Agregá atracciones desde la lista.</p>
          ) : (
            selected.map((attraction, index) => (
              <div className="flex items-center gap-2 px-2 py-2" key={attraction.id}>
                <span className="text-xs text-outline font-mono w-4 text-right flex-shrink-0">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface truncate">{attraction.title}</p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    className="w-6 h-6 rounded hover:bg-surface-container text-on-surface-variant disabled:opacity-30 flex items-center justify-center"
                    disabled={index === 0}
                    onClick={() => moveAttraction(index, -1)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                  </button>
                  <button
                    className="w-6 h-6 rounded hover:bg-surface-container text-on-surface-variant disabled:opacity-30 flex items-center justify-center"
                    disabled={index === selected.length - 1}
                    onClick={() => moveAttraction(index, 1)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                  </button>
                  <button
                    className="w-6 h-6 rounded hover:bg-error-container text-error flex items-center justify-center"
                    onClick={() => removeAttraction(attraction.id)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AttractionPicker;
