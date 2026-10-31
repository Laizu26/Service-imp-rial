import React, { useState, useRef } from "react";
import { ZoomIn, ZoomOut, Move } from "lucide-react";

/**
 * Éditeur d'avatar : URL + glisser pour recadrer + zoom.
 * value = { url, position, zoom }
 * onChange(newValue)
 */
const AvatarEditor = ({ value = {}, onChange, shape = "circle", label = "Portrait (URL)" }) => {
  const { url = "", position = "50% 50%", zoom = 1 } = value;
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const parsePos = (p = "50% 50%") => {
    const [x, y] = p.replace(/%/g, "").split(" ").map(Number);
    return { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y };
  };
  const pos = parsePos(position);

  const updatePos = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    onChange({ url, zoom, position: `${x.toFixed(0)}% ${y.toFixed(0)}%` });
  };

  const setZoom = (z) => onChange({ url, position, zoom: Math.max(0.8, Math.min(3, z)) });

  const roundedClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  return (
    <div className="space-y-3">
      {/* Label + URL input */}
      <div>
        <span className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5">{label}</span>
        <input
          type="text"
          value={url}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
          placeholder="https://..."
          className="w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none focus:border-stone-700 transition-all font-bold text-sm text-stone-800 placeholder:font-normal placeholder:text-stone-300"
        />
      </div>

      {url && (
        <div className="flex gap-4 items-start">
          {/* Circular/square preview — drag to reposition */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <div
              ref={containerRef}
              className={`relative w-24 h-24 ${roundedClass} overflow-hidden border-2 border-stone-300 cursor-move select-none group bg-stone-100`}
              style={{ touchAction: "none" }}
              onMouseDown={(e) => { setDragging(true); updatePos(e); }}
              onMouseMove={(e) => { if (dragging) updatePos(e); }}
              onMouseUp={() => setDragging(false)}
              onMouseLeave={() => setDragging(false)}
              onTouchStart={(e) => { setDragging(true); updatePos(e); e.preventDefault(); }}
              onTouchMove={(e) => { if (dragging) { updatePos(e); e.preventDefault(); } }}
              onTouchEnd={() => setDragging(false)}
            >
              <img
                src={url}
                alt=""
                draggable={false}
                className="w-full h-full object-cover pointer-events-none"
                style={{
                  objectPosition: position,
                  transform: `scale(${zoom})`,
                  transformOrigin: `${pos.x}% ${pos.y}%`,
                }}
                onError={(e) => { e.target.style.opacity = "0.3"; }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-black/60 rounded-lg px-2 py-1 flex items-center gap-1">
                  <Move size={10} className="text-white" />
                  <span className="text-white text-[7px] font-black uppercase">Glisser</span>
                </div>
              </div>
            </div>
            <span className="text-[7px] text-stone-400 font-bold uppercase tracking-wider">Aperçu</span>
          </div>

          {/* Zoom control */}
          <div className="flex-1 pt-1 space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom(parseFloat((zoom - 0.1).toFixed(2)))}
                className="w-7 h-7 rounded-lg border-2 border-stone-200 bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors shrink-0"
              >
                <ZoomOut size={12} />
              </button>
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-stone-700 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom(parseFloat((zoom + 0.1).toFixed(2)))}
                className="w-7 h-7 rounded-lg border-2 border-stone-200 bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors shrink-0"
              >
                <ZoomIn size={12} />
              </button>
            </div>
            <div className="text-center text-[8px] font-black text-stone-400 uppercase tracking-widest">
              Zoom {Math.round(zoom * 100)}%
            </div>
            <div className="text-[8px] text-stone-400 italic leading-tight">
              Glisser l'aperçu pour recadrer.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarEditor;
