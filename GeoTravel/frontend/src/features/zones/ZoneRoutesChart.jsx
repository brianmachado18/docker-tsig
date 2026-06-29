import React from 'react';

const STATUSES = [
  { key: 'available',   label: 'Disponible',        color: '#16a34a' },
  { key: 'pending',     label: 'Pendiente',          color: '#2563eb' },
  { key: 'off-season',  label: 'Fuera de temporada', color: '#ea580c' },
  { key: 'cancelled',   label: 'Cancelado',          color: '#dc2626' },
];

const ZoneRoutesChart = ({ data, isLoading, onZoneClick }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-on-surface-variant">
        <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
        <span className="text-sm">Cargando datos...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
        <span className="material-symbols-outlined text-[40px] text-outline">bar_chart</span>
        <p className="text-sm text-on-surface-variant">No hay datos de recorridos por zona aún.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {data.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => onZoneClick?.(entry)}
          className="w-full text-left rounded-xl border border-outline-variant/50 bg-surface hover:bg-surface-container hover:border-primary/40 hover:shadow-sm active:scale-[0.99] transition-all p-3 flex flex-col gap-2 group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-on-surface truncate">{entry.name}</span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-colors">
                chevron_right
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[13px] text-primary">route</span>
              <span className="font-semibold text-on-surface">{entry.total}</span> recorridos
            </span>
            {entry.attractionCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[13px] text-primary">local_activity</span>
                <span className="font-semibold text-on-surface">{entry.attractionCount}</span> atracciones
              </span>
            )}
          </div>

          <div className="flex h-2.5 rounded-full overflow-hidden bg-surface-container-high w-full">
            {STATUSES.map((s) => {
              const pct = entry.total ? (entry[s.key] / entry.total) * 100 : 0;
              if (!pct) return null;
              return (
                <div
                  key={s.key}
                  style={{ width: `${pct}%`, background: s.color }}
                  title={`${s.label}: ${entry[s.key]}`}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {STATUSES.map((s) => entry[s.key] > 0 && (
              <span key={s.key} className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
                {entry[s.key]} {s.label.toLowerCase()}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
};

export default ZoneRoutesChart;
