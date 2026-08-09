import React, { useRef } from "react";

/**
 * Canvas cliquable pour placer un point (x, y en % 0-100) — utilisé par l'Atlas pour positionner
 * pays/régions/bâtiments sur les cartes Empire/Pays/Ville (voir WorldMapView.js). Un clic suffit
 * à repositionner ; les "voisins" (autres éléments du même niveau) s'affichent estompés pour se
 * repérer visuellement en plaçant.
 */
const PositionPicker = ({ x = 50, y = 50, siblings = [], onChange, accentColor = "#d97706", height = 200 }) => {
  const ref = useRef(null);

  const handleClick = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const px = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const py = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    onChange(Math.round(px * 10) / 10, Math.round(py * 10) / 10);
  };

  return (
    <div>
      <div
        ref={ref}
        onClick={handleClick}
        className="relative w-full rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 cursor-crosshair overflow-hidden"
        style={{ height, backgroundImage: "linear-gradient(#e7e5e4 1px, transparent 1px), linear-gradient(90deg, #e7e5e4 1px, transparent 1px)", backgroundSize: "10% 10%" }}
      >
        {siblings.map((s) => (
          <div
            key={s.id}
            className="absolute w-2 h-2 rounded-full bg-stone-400 opacity-50 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
            title={s.label}
          />
        ))}
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${x}%`, top: `${y}%`, background: accentColor }}
        />
      </div>
      <div className="text-[9px] text-stone-400 font-mono mt-1">Position : {Number(x).toFixed(0)}, {Number(y).toFixed(0)} — cliquez sur la carte pour repositionner</div>
    </div>
  );
};

export default PositionPicker;
