import React from 'react';

const RouteCreationModePicker = ({ onClose, onSelectPoints, onSelectDraw }) => (
  <div className="flex flex-col flex-1 min-h-0">
    <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-bright shrink-0">
      <h3 className="font-headline-lg text-headline-lg text-on-surface">Nuevo recorrido</h3>
      <button onClick={onClose} className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container" type="button">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
      <p className="text-on-surface-variant text-sm text-center">¿Cómo querés definir el recorrido?</p>
      <div className="grid grid-cols-2 gap-4 w-full">
        <button
          type="button"
          onClick={onSelectDraw}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-outline-variant hover:border-primary hover:bg-primary/5 transition-all group"
        >
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary/10">
            <span className="material-symbols-outlined text-primary text-[32px]">edit</span>
          </div>
          <div className="text-center">
            <p className="font-semibold text-on-surface text-sm">Dibujar en el mapa</p>
            <p className="text-xs text-on-surface-variant mt-1">Hacé click para dibujar y doble click para terminar</p>
          </div>
        </button>
        <button
          type="button"
          onClick={onSelectPoints}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-outline-variant hover:border-primary hover:bg-primary/5 transition-all group"
        >
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary/10">
            <span className="material-symbols-outlined text-primary text-[32px]">route</span>
          </div>
          <div className="text-center">
            <p className="font-semibold text-on-surface text-sm">Seleccionar puntos</p>
            <p className="text-xs text-on-surface-variant mt-1">Elegí atracciones o zonas como paradas</p>
          </div>
        </button>
      </div>
    </div>
  </div>
);

export default RouteCreationModePicker;
