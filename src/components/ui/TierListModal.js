import React, { useState, useRef, useCallback, useEffect } from "react";
import html2canvas from "html2canvas";
import { X, Download, RotateCcw, Plus, Trash2, Save, FolderOpen, Check, GripVertical } from "lucide-react";

const DEFAULT_TIERS = [
  { id: "S", label: "S", color: "#ef4444" },
  { id: "A", label: "A", color: "#f97316" },
  { id: "B", label: "B", color: "#eab308" },
  { id: "C", label: "C", color: "#22c55e" },
  { id: "D", label: "D", color: "#3b82f6" },
  { id: "E", label: "E", color: "#8b5cf6" },
];

const LS_KEY = "hrp_tierlist_saves_v1";
const LS_ACTIVE = "hrp_tierlist_active_v1";

const hexToRgb = (hex) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

const colorToBg = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},0.08)`;
};

const colorToGlow = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},0.25)`;
};

const loadSaves = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } };
const loadActive = () => { try { return JSON.parse(localStorage.getItem(LS_ACTIVE)) || null; } catch { return null; } };

const CharCard = ({ user, draggable, onDragStart, onDragEnd, small, isDragging }) => (
  <div
    draggable={draggable}
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    className={`flex flex-col items-center cursor-grab active:cursor-grabbing select-none shrink-0 group/card transition-all duration-150 ${
      small ? "w-14" : "w-[72px]"
    } ${isDragging ? "opacity-30 scale-95" : "hover:scale-105 hover:-translate-y-0.5"}`}
    title={user.name || user.id}
  >
    <div
      className={`rounded-xl overflow-hidden bg-stone-800 shadow-lg group-hover/card:shadow-xl transition-shadow ${
        small ? "w-11 h-11" : "w-14 h-14"
      }`}
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)" }}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="w-full h-full object-cover"
          style={{
            objectPosition: user.avatarPosition || "50% 50%",
            transform: `scale(${user.avatarZoom || 1})`,
            transformOrigin: user.avatarPosition || "50% 50%",
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-700 to-stone-800">
          <span className={`font-black text-stone-200 uppercase ${small ? "text-base" : "text-xl"}`}>
            {(user.name || user.id || "?")[0]}
          </span>
        </div>
      )}
    </div>
    <div
      className={`text-center mt-1 leading-tight font-bold text-stone-300 uppercase tracking-wide truncate px-0.5 w-full ${
        small ? "text-[7px]" : "text-[8px]"
      }`}
    >
      {user.name || user.id}
    </div>
  </div>
);

const makeEmptyState = (users, title = "Service Impérial — Tier List") => ({
  title,
  tiers: DEFAULT_TIERS.map((t) => ({ ...t, chars: [] })),
  pool: (users || []).filter((u) => u.name || u.id).map((u) => u.id),
  zoom: 100,
});

const TierListModal = ({ users = [], onClose }) => {
  const allIds = (users || []).filter((u) => u.name || u.id).map((u) => u.id);

  const [saves, setSaves] = useState(loadSaves);
  const [showSaves, setShowSaves] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const [activeId, setActiveId] = useState(loadActive);
  const [tiers, setTiers] = useState(() => {
    const active = loadActive();
    const saved = loadSaves().find((s) => s.id === active);
    if (saved) return saved.tiers;
    return DEFAULT_TIERS.map((t) => ({ ...t, chars: [] }));
  });
  const [pool, setPool] = useState(() => {
    const active = loadActive();
    const saved = loadSaves().find((s) => s.id === active);
    if (saved) {
      const placed = new Set([...saved.pool, ...saved.tiers.flatMap((t) => t.chars)]);
      return [...saved.pool, ...allIds.filter((id) => !placed.has(id))];
    }
    return allIds;
  });
  const [title, setTitle] = useState(() => {
    const active = loadActive();
    const saved = loadSaves().find((s) => s.id === active);
    return saved?.title || "Service Impérial — Tier List";
  });
  const [zoom, setZoom] = useState(() => {
    const active = loadActive();
    const saved = loadSaves().find((s) => s.id === active);
    return saved?.zoom || 100;
  });

  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [dragOverPos, setDragOverPos] = useState(null); // { tierId, index }
  const [tierDragging, setTierDragging] = useState(null); // id du rang déplacé
  const [tierDragOver, setTierDragOver] = useState(null); // id du rang cible
  const [exporting, setExporting] = useState(false);
  const [editingTierId, setEditingTierId] = useState(null);
  const boardRef = useRef(null);
  const colorRefs = useRef({});

  useEffect(() => {
    if (!activeId) return;
    try {
      const updated = saves.map((s) =>
        s.id === activeId ? { ...s, title, tiers, pool, zoom, updatedAt: Date.now() } : s
      );
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      setSaves(updated);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiers, pool, title, zoom]);

  const persistSaves = (newSaves) => {
    setSaves(newSaves);
    try { localStorage.setItem(LS_KEY, JSON.stringify(newSaves)); } catch {}
  };

  const saveAs = () => {
    const name = saveNameInput.trim() || title;
    const id = `tl_${Date.now()}`;
    const entry = { id, name, title, tiers, pool, zoom, createdAt: Date.now(), updatedAt: Date.now() };
    const newSaves = [...saves, entry];
    persistSaves(newSaves);
    setActiveId(id);
    try { localStorage.setItem(LS_ACTIVE, JSON.stringify(id)); } catch {}
    setSaveNameInput("");
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const loadSave = (save) => {
    setTiers(save.tiers);
    const placed = new Set([...save.pool, ...save.tiers.flatMap((t) => t.chars)]);
    setPool([...save.pool, ...allIds.filter((id) => !placed.has(id))]);
    setTitle(save.title);
    setZoom(save.zoom || 100);
    setActiveId(save.id);
    try { localStorage.setItem(LS_ACTIVE, JSON.stringify(save.id)); } catch {}
    setShowSaves(false);
  };

  const deleteSave = (id) => {
    const newSaves = saves.filter((s) => s.id !== id);
    persistSaves(newSaves);
    if (activeId === id) {
      setActiveId(null);
      try { localStorage.removeItem(LS_ACTIVE); } catch {}
    }
  };

  const handleReset = () => {
    const empty = makeEmptyState(users);
    setTiers(empty.tiers);
    setPool(empty.pool);
    setTitle(empty.title);
    setZoom(empty.zoom);
    setActiveId(null);
    try { localStorage.removeItem(LS_ACTIVE); } catch {}
  };

  const handleTierReorder = (toId) => {
    if (!tierDragging || tierDragging === toId) { setTierDragging(null); setTierDragOver(null); return; }
    setTiers((ts) => {
      const fromIdx = ts.findIndex((t) => t.id === tierDragging);
      const toIdx = ts.findIndex((t) => t.id === toId);
      if (fromIdx === -1 || toIdx === -1) return ts;
      const next = [...ts];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setTierDragging(null);
    setTierDragOver(null);
  };

  const renameTier = (id, label) => setTiers((ts) => ts.map((t) => t.id === id ? { ...t, label } : t));
  const recolorTier = (id, color) => setTiers((ts) => ts.map((t) => t.id === id ? { ...t, color } : t));
  const addTier = () => setTiers((ts) => [...ts, { id: `tier_${Date.now()}`, label: "?", color: "#6b7280", chars: [] }]);
  const deleteTier = (id) => {
    const tier = tiers.find((t) => t.id === id);
    if (tier) setPool((p) => [...p, ...tier.chars]);
    setTiers((ts) => ts.filter((t) => t.id !== id));
  };

  const getUser = useCallback((id) => users.find((u) => u.id === id), [users]);

  const handleDragStart = (userId, from) => setDragging({ userId, from });

  const handleDrop = (to) => {
    if (!dragging) return;
    const { userId, from } = dragging;
    const pos = dragOverPos;
    setDragging(null);
    setDragOver(null);
    setDragOverPos(null);

    if (from === to) {
      if (from === "pool") return;
      // Reorder within same tier
      setTiers((ts) => ts.map((t) => {
        if (t.id !== to) return t;
        const withoutUser = t.chars.filter((id) => id !== userId);
        const origIdx = t.chars.indexOf(userId);
        let insertIdx = pos?.tierId === to ? pos.index : withoutUser.length;
        if (origIdx < insertIdx) insertIdx--;
        insertIdx = Math.max(0, Math.min(insertIdx, withoutUser.length));
        const chars = [...withoutUser];
        chars.splice(insertIdx, 0, userId);
        return { ...t, chars };
      }));
      return;
    }

    // Remove from source
    if (from === "pool") setPool((p) => p.filter((id) => id !== userId));
    else setTiers((ts) => ts.map((t) => t.id === from ? { ...t, chars: t.chars.filter((id) => id !== userId) } : t));

    // Add to destination
    if (to === "pool") {
      setPool((p) => [...p, userId]);
    } else {
      setTiers((ts) => ts.map((t) => {
        if (t.id !== to) return t;
        const chars = [...t.chars];
        const insertIdx = pos?.tierId === to ? Math.min(pos.index, chars.length) : chars.length;
        chars.splice(insertIdx, 0, userId);
        return { ...t, chars };
      }));
    }
  };

  // Génère un carré stone avec l'initiale — utilisé quand l'image est inaccessible en CORS
  const makeInitialDataUrl = (text) => {
    const initial = (text || "?")[0].toUpperCase();
    const s = 112;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#44403c";
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = "#e7e5e4";
    ctx.font = `bold ${Math.round(s * 0.5)}px system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initial, s / 2, s / 2);
    return c.toDataURL();
  };

  const handleExport = async () => {
    if (!boardRef.current) return;
    setExporting(true);

    // Tenter de charger chaque image avec crossOrigin="anonymous".
    // Firebase Storage sert des headers CORS → data URL réelle.
    // Pinterest/autres sans CORS → fallback initiale (meilleur que carré noir).
    const imgs = Array.from(boardRef.current.querySelectorAll("img"));
    const origSrcs = new Map();

    const tryDataUrl = (src) => new Promise((resolve) => {
      const tmp = new Image();
      tmp.crossOrigin = "anonymous";
      const timer = setTimeout(() => resolve(null), 8000);
      tmp.onload = () => {
        clearTimeout(timer);
        try {
          const c = document.createElement("canvas");
          c.width = tmp.naturalWidth || 112;
          c.height = tmp.naturalHeight || 112;
          c.getContext("2d").drawImage(tmp, 0, 0);
          resolve(c.toDataURL());
        } catch { resolve(null); }
      };
      tmp.onerror = () => { clearTimeout(timer); resolve(null); };
      tmp.src = src;
    });

    await Promise.allSettled(imgs.map(async (img) => {
      origSrcs.set(img, img.src);
      const dataUrl = await tryDataUrl(img.src);
      img.src = dataUrl || makeInitialDataUrl(img.alt);
      if (!img.complete) await new Promise((r) => { img.onload = r; img.onerror = r; setTimeout(r, 500); });
    }));

    try {
      const canvas = await html2canvas(boardRef.current, {
        backgroundColor: "#0c0a09",
        scale: 2,
        allowTaint: false,
        useCORS: false,
        imageTimeout: 0,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `${title.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) { console.error("Export error:", e); }

    origSrcs.forEach((src, img) => { img.src = src; });
    setExporting(false);
  };

  return (
    <div className="fixed inset-0 z-[500] flex flex-col font-sans overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 0%, #1c1917 0%, #0c0a09 100%)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-800/80 shrink-0 gap-3 flex-wrap"
        style={{ background: "rgba(28,25,23,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-amber-400 to-amber-600"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">HRP — Tier List</span>
          </div>
          {activeId && (
            <span className="hidden sm:block text-[8px] text-stone-600 italic truncate max-w-[120px]">
              {saves.find((s) => s.id === activeId)?.name || ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom */}
          <div className="flex items-center gap-0 bg-stone-900 border border-stone-700/60 rounded-lg overflow-hidden">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="px-2.5 py-1.5 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors text-sm font-black leading-none"
            >−</button>
            <span className="px-2 py-1.5 text-[9px] font-black text-stone-300 w-10 text-center border-x border-stone-700/60">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="px-2.5 py-1.5 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors text-sm font-black leading-none"
            >+</button>
          </div>

          {/* Saves */}
          <button
            onClick={() => setShowSaves((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all ${
              showSaves
                ? "bg-amber-700/80 border border-amber-600/50 text-white"
                : "bg-stone-900 border border-stone-700/60 text-stone-400 hover:text-stone-200 hover:border-stone-600"
            }`}
          >
            <FolderOpen size={10} />
            Saves
            {saves.length > 0 && (
              <span className="bg-stone-700 text-stone-300 rounded-full px-1.5 py-0.5 text-[7px] font-black">{saves.length}</span>
            )}
          </button>

          {/* Add tier */}
          <button
            onClick={addTier}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700/60 text-stone-400 hover:text-stone-200 hover:border-stone-600 text-[9px] font-black uppercase tracking-wide transition-all"
          >
            <Plus size={10} /> Rang
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700/60 text-stone-400 hover:text-red-400 hover:border-red-800/50 text-[9px] font-black uppercase tracking-wide transition-all"
          >
            <RotateCcw size={10} /> Reset
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #b45309, #d97706)", color: "#fff", boxShadow: "0 1px 8px rgba(180,83,9,0.4)" }}
          >
            <Download size={10} /> {exporting ? "Export..." : "Exporter"}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-stone-900 border border-stone-700/60 text-stone-500 hover:text-white hover:border-stone-500 flex items-center justify-center transition-all"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Saves panel */}
      {showSaves && (
        <div className="border-b border-stone-800/80 px-5 py-4 space-y-3 shrink-0" style={{ background: "rgba(20,18,17,0.97)" }}>
          <div className="flex items-center gap-2">
            <input
              value={saveNameInput}
              onChange={(e) => setSaveNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveAs()}
              placeholder={`Nom de la save (défaut : "${title}")`}
              className="flex-1 bg-stone-900 border border-stone-700/60 rounded-lg px-3 py-2 text-xs text-stone-200 outline-none focus:border-amber-600/60 placeholder:text-stone-600 transition-colors"
            />
            <button
              onClick={saveAs}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all shrink-0 ${
                savedFlash
                  ? "bg-green-700 text-white"
                  : "text-white"
              }`}
              style={savedFlash ? {} : { background: "linear-gradient(135deg, #b45309, #d97706)", boxShadow: "0 1px 6px rgba(180,83,9,0.4)" }}
            >
              {savedFlash ? <><Check size={10} /> Sauvegardé</> : <><Save size={10} /> Sauvegarder</>}
            </button>
          </div>

          {saves.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {saves.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg border text-[9px] font-black uppercase transition-all ${
                    s.id === activeId
                      ? "bg-amber-900/30 border-amber-700/60 text-amber-300"
                      : "bg-stone-900 border-stone-700/60 text-stone-400 hover:border-stone-500 hover:text-stone-200"
                  }`}
                >
                  <button onClick={() => loadSave(s)} className="tracking-wide">{s.name || s.title}</button>
                  <button onClick={() => deleteSave(s.id)} className="text-stone-600 hover:text-red-400 transition-colors ml-0.5">
                    <X size={9} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[8px] text-stone-700 italic">Aucune save — entre un nom et clique sur Sauvegarder.</p>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

        {/* Board — zoom wrapper séparé pour que html2canvas capture à 100% */}
        <div style={{ zoom: zoom / 100 }}>
        <div
          ref={boardRef}
          className="rounded-2xl border border-stone-800/60 p-4 sm:p-5 space-y-1.5"
          style={{
            background: "linear-gradient(180deg, #1c1917 0%, #171412 100%)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset, 0 8px 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* Title */}
          <div className="text-center pb-3 pt-1">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent text-sm font-black uppercase tracking-[0.25em] text-stone-300 text-center outline-none border-b border-transparent hover:border-stone-700 focus:border-stone-500 transition-colors w-full max-w-sm placeholder:text-stone-700"
              placeholder="Nom de la tier list"
            />
          </div>

          {/* Tier rows */}
          {tiers.map((tier) => {
            const isOver = dragOver === tier.id;
            return (
              <div
                key={tier.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (tierDragging) {
                    setTierDragOver(tier.id);
                  } else {
                    setDragOver(tier.id);
                    if (!dragOverPos || dragOverPos.tierId !== tier.id) setDragOverPos({ tierId: tier.id, index: tier.chars.length });
                  }
                }}
                onDragLeave={() => { setDragOver(null); setDragOverPos(null); setTierDragOver(null); }}
                onDrop={() => tierDragging ? handleTierReorder(tier.id) : handleDrop(tier.id)}
                className="flex items-stretch gap-0 rounded-xl overflow-hidden border transition-all duration-150 group/row"
                style={{
                  borderColor: tierDragOver === tier.id ? "#ffffff55" : isOver ? tier.color : "rgba(255,255,255,0.06)",
                  boxShadow: tierDragOver === tier.id ? "0 0 0 2px #ffffff22" : isOver ? `0 0 0 1px ${tier.color}40, 0 4px 20px ${colorToGlow(tier.color)}` : "0 1px 3px rgba(0,0,0,0.3)",
                  transform: isOver ? "scale(1.005)" : "scale(1)",
                  opacity: tierDragging === tier.id ? 0.35 : 1,
                }}
              >
                {/* Grip handle — réordonne les rangs */}
                <div
                  draggable
                  onDragStart={(e) => { e.stopPropagation(); setTierDragging(tier.id); }}
                  onDragEnd={() => { setTierDragging(null); setTierDragOver(null); }}
                  className="w-6 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-stone-700 hover:text-stone-400 bg-stone-900/40 opacity-0 group-hover/row:opacity-100 transition-all"
                  title="Déplacer ce rang"
                >
                  <GripVertical size={12} />
                </div>

                {/* Color swatch — clickable */}
                <div
                  className="w-2 shrink-0 cursor-pointer transition-all hover:brightness-125 hover:w-3"
                  style={{ background: `linear-gradient(180deg, ${tier.color}, ${tier.color}cc)` }}
                  onClick={() => colorRefs.current[tier.id]?.click()}
                  title="Changer la couleur"
                >
                  <input
                    ref={(el) => (colorRefs.current[tier.id] = el)}
                    type="color"
                    value={tier.color}
                    onChange={(e) => recolorTier(tier.id, e.target.value)}
                    className="opacity-0 w-0 h-0 absolute"
                    tabIndex={-1}
                  />
                </div>

                {/* Label */}
                <div
                  className="min-w-[56px] px-2 shrink-0 flex items-center justify-center cursor-pointer relative group/label"
                  style={{ background: `linear-gradient(135deg, ${tier.color}dd, ${tier.color}99)` }}
                  onClick={() => setEditingTierId(editingTierId === tier.id ? null : tier.id)}
                >
                  {editingTierId === tier.id ? (
                    <input
                      autoFocus
                      value={tier.label}
                      onChange={(e) => renameTier(tier.id, e.target.value)}
                      onBlur={() => setEditingTierId(null)}
                      onKeyDown={(e) => e.key === "Enter" && setEditingTierId(null)}
                      onClick={(e) => e.stopPropagation()}
                      className="min-w-[40px] w-full text-center bg-transparent outline-none font-black text-2xl text-white"
                      maxLength={8}
                      style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
                    />
                  ) : (
                    <>
                      <span
                        className="font-black text-2xl text-white select-none leading-none"
                        style={{ textShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
                      >
                        {tier.label}
                      </span>
                      <span className="absolute inset-0 bg-black/0 group-hover/label:bg-black/20 transition-colors flex items-end justify-center pb-1">
                        <span className="text-[7px] text-white/0 group-hover/label:text-white/60 transition-colors font-bold uppercase tracking-wider">✎</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Drop zone */}
                <div
                  className="flex-1 flex flex-wrap items-center gap-1 p-2.5 min-h-[80px] transition-colors"
                  style={{ backgroundColor: isOver ? `${tier.color}15` : colorToBg(tier.color) }}
                >
                  {tier.chars.map((id, idx) => {
                    const u = getUser(id);
                    if (!u) return null;
                    const insertBefore = dragOverPos?.tierId === tier.id && dragOverPos?.index === idx;
                    const insertAfter = dragOverPos?.tierId === tier.id && dragOverPos?.index === idx + 1 && idx === tier.chars.length - 1;
                    return (
                      <React.Fragment key={id}>
                        {insertBefore && (
                          <div className="w-0.5 self-stretch rounded-full mx-0.5 shrink-0" style={{ background: tier.color, boxShadow: `0 0 6px ${tier.color}` }} />
                        )}
                        <div
                          onDragStart={(e) => e.stopPropagation()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOver(tier.id);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setDragOverPos({ tierId: tier.id, index: e.clientX < rect.left + rect.width / 2 ? idx : idx + 1 });
                          }}
                        >
                          <CharCard
                            user={u}
                            small
                            draggable
                            isDragging={dragging?.userId === id}
                            onDragStart={() => handleDragStart(id, tier.id)}
                            onDragEnd={() => { setDragging(null); setDragOver(null); setDragOverPos(null); }}
                          />
                        </div>
                        {insertAfter && (
                          <div className="w-0.5 self-stretch rounded-full mx-0.5 shrink-0" style={{ background: tier.color, boxShadow: `0 0 6px ${tier.color}` }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                  {tier.chars.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-[8px] text-stone-700 italic tracking-wide">Glisse ici</span>
                    </div>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteTier(tier.id)}
                  className="w-9 shrink-0 flex items-center justify-center text-stone-700 hover:text-red-400 transition-colors opacity-0 group-hover/row:opacity-100"
                  style={{ background: "rgba(0,0,0,0.2)" }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
        </div>{/* fin zoom wrapper */}

        {/* Pool */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver("pool"); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={() => handleDrop("pool")}
          className="rounded-2xl border transition-all duration-150 p-4"
          style={{
            zoom: zoom / 100,
            borderColor: dragOver === "pool" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
            background: dragOver === "pool"
              ? "rgba(255,255,255,0.04)"
              : "rgba(28,25,23,0.6)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-600">Non classés</span>
            <span
              className="text-[7px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.06)", color: "#78716c" }}
            >
              {pool.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {pool.map((id) => {
              const u = getUser(id);
              if (!u) return null;
              return (
                <CharCard
                  key={id}
                  user={u}
                  draggable
                  isDragging={dragging?.userId === id}
                  onDragStart={() => handleDragStart(id, "pool")}
                  onDragEnd={() => { setDragging(null); setDragOver(null); }}
                />
              );
            })}
            {pool.length === 0 && (
              <div className="w-full text-center py-4 text-[8px] text-stone-700 italic tracking-wide">
                Tous les personnages sont classés !
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierListModal;
