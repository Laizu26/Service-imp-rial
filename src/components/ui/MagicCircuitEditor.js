import React, { useState } from "react";
import { BODY_OUTLINE_PATHS, BODY_OUTLINE_VIEWBOX } from "../../lib/bodyOutline";

const SIZE_RADIUS = { s: 2.8, m: 4.2, l: 6.2 };

// Convertit un pourcentage (0-100) en coordonnées du viewBox "0 0 200 496" du corps.
const pctToSvg = (x, y) => [x * 2, y * 4.96];

/**
 * Éditeur du circuit magique d'une race : place librement des points (noyaux/récepteurs) sur une
 * silhouette de référence, avec une taille (petit/moyen/grand) et un réseau de lignes optionnel
 * entre les points — voir la description de chaque race (guide des corps) pour ce que ça
 * représente concrètement (noyau unique, récepteurs décentralisés, double source, etc.).
 */
const MagicCircuitEditor = ({ circuit, onChange, accentColor = "#facc15" }) => {
  const points = circuit?.points || [];
  const linked = !!circuit?.linked;
  const [selectedId, setSelectedId] = useState(null);

  const selected = points.find((p) => p.id === selectedId) || null;

  const set = (patch) => onChange({ ...circuit, ...patch });

  const updatePoint = (id, patch) => {
    set({ points: points.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  };

  const removePoint = (id) => {
    set({ points: points.filter((p) => p.id !== id) });
    setSelectedId(null);
  };

  const handleCanvasClick = (e) => {
    const svg = e.currentTarget.ownerSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    if (selectedId) {
      updatePoint(selectedId, { x, y });
      setSelectedId(null);
    } else {
      const id = `pt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      set({ points: [...points, { id, x, y, size: "m" }] });
      setSelectedId(id);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg
          viewBox={BODY_OUTLINE_VIEWBOX}
          className="w-full max-w-[220px] mx-auto aspect-[200/496] rounded-lg border-2 border-dashed border-stone-700 bg-stone-950"
          style={{ cursor: "crosshair" }}
        >
          {BODY_OUTLINE_PATHS.map((d, i) => (
            <path key={i} d={d} fill="#292524" stroke="#57534e" strokeWidth="1.2" />
          ))}
          {/* Zone cliquable invisible par-dessus tout le canevas */}
          <rect x="0" y="0" width="200" height="496" fill="transparent" onClick={handleCanvasClick} />

          {/* Lignes du réseau, si les points sont reliés */}
          {linked && points.length > 1 && points.slice(1).map((p, i) => {
            const [x1, y1] = pctToSvg(points[i].x, points[i].y);
            const [x2, y2] = pctToSvg(p.x, p.y);
            return (
              <line key={`l_${p.id}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accentColor} strokeWidth="1.2" opacity="0.6" pointerEvents="none" />
            );
          })}

          {points.map((p) => {
            const [cx, cy] = pctToSvg(p.x, p.y);
            const r = SIZE_RADIUS[p.size] || SIZE_RADIUS.m;
            const isSel = p.id === selectedId;
            return (
              <circle
                key={p.id}
                cx={cx}
                cy={cy}
                r={r}
                fill={accentColor}
                stroke={isSel ? "#ffffff" : "#0f172a"}
                strokeWidth={isSel ? 2 : 1}
                opacity={isSel ? 1 : 0.85}
                style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); setSelectedId(isSel ? null : p.id); }}
              />
            );
          })}
        </svg>
      </div>

      <p className="text-[9px] text-stone-500 font-mono">
        {selected
          ? "Cliquez sur le corps pour repositionner ce point."
          : "Cliquez sur le corps pour ajouter un point."}
      </p>

      {selected && (
        <div className="flex flex-wrap items-center gap-3 bg-stone-800 border border-stone-700 rounded-lg p-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Taille</span>
          <div className="flex gap-1">
            {[["s", "S"], ["m", "M"], ["l", "L"]].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => updatePoint(selected.id, { size: val })}
                className={`w-7 h-7 rounded text-[10px] font-black ${
                  (selected.size || "m") === val ? "bg-yellow-600 text-stone-950" : "bg-stone-700 text-stone-300 hover:bg-stone-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => removePoint(selected.id)}
            className="ml-auto text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300"
          >
            Supprimer le point
          </button>
        </div>
      )}

      <label className="flex items-center gap-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest cursor-pointer">
        <input
          type="checkbox"
          checked={linked}
          onChange={(e) => set({ linked: e.target.checked })}
          className="accent-yellow-600"
        />
        Relier les points en réseau
      </label>
    </div>
  );
};

export default MagicCircuitEditor;
