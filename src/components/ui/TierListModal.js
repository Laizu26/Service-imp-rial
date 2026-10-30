import React, { useState, useRef, useCallback, useEffect } from "react";
import html2canvas from "html2canvas";
import { X, Download, RotateCcw, Plus, Trash2, Save, FolderOpen, Check } from "lucide-react";

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

const colorToBg = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.12)`;
};

const loadSaves = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } };
const loadActive = () => { try { return JSON.parse(localStorage.getItem(LS_ACTIVE)) || null; } catch { return null; } };

const CharCard = ({ user, draggable, onDragStart, onDragEnd, small }) => (
  <div
    draggable={draggable}
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    className={`flex flex-col items-center cursor-grab active:cursor-grabbing select-none shrink-0 ${small ? "w-14" : "w-16"}`}
    title={user.name || user.id}
  >
    <div className={`rounded-lg overflow-hidden border-2 border-stone-600 bg-stone-700 ${small ? "w-12 h-12" : "w-14 h-14"}`}>
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-stone-600">
          <span className="text-lg font-black text-stone-300 uppercase">{(user.name || user.id || "?")[0]}</span>
        </div>
      )}
    </div>
    <div className={`text-center mt-1 leading-tight ${small ? "text-[7px]" : "text-[8px]"} font-bold text-stone-200 uppercase tracking-wide w-full truncate px-0.5`}>
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

  // Saves list
  const [saves, setSaves] = useState(loadSaves);
  const [showSaves, setShowSaves] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  // Active board state
  const [activeId, setActiveId] = useState(loadActive);
  const [tiers, setTiers] = useState(() => {
    const active = loadActive();
    const saved = loadSaves().find((s) => s.id === active);
    if (saved) {
      // Merge new users not yet placed
      const placed = new Set([...saved.pool, ...saved.tiers.flatMap((t) => t.chars)]);
      const newOnes = allIds.filter((id) => !placed.has(id));
      return saved.tiers;
    }
    return DEFAULT_TIERS.map((t) => ({ ...t, chars: [] }));
  });
  const [pool, setPool] = useState(() => {
    const active = loadActive();
    const saved = loadSaves().find((s) => s.id === active);
    if (saved) {
      const placed = new Set([...saved.pool, ...saved.tiers.flatMap((t) => t.chars)]);
      const newOnes = allIds.filter((id) => !placed.has(id));
      return [...saved.pool, ...newOnes];
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
  const [exporting, setExporting] = useState(false);
  const [editingTierId, setEditingTierId] = useState(null);
  const boardRef = useRef(null);
  const colorRefs = useRef({});

  // Auto-save active state
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
    const newOnes = allIds.filter((id) => !placed.has(id));
    setPool([...save.pool, ...newOnes]);
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
    if (from === to) { setDragging(null); setDragOver(null); return; }
    if (from === "pool") setPool((p) => p.filter((id) => id !== userId));
    else setTiers((ts) => ts.map((t) => t.id === from ? { ...t, chars: t.chars.filter((id) => id !== userId) } : t));
    if (to === "pool") setPool((p) => [...p, userId]);
    else setTiers((ts) => ts.map((t) => t.id === to ? { ...t, chars: [...t.chars, userId] } : t));
    setDragging(null);
    setDragOver(null);
  };

  const handleExport = async () => {
    if (!boardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(boardRef.current, { backgroundColor: "#1c1917", scale: 2, useCORS: true, allowTaint: true });
      const link = document.createElement("a");
      link.download = `${title.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) { console.error(e); }
    setExporting(false);
  };

  return (
    <div className="fixed inset-0 z-[500] bg-stone-950/95 backdrop-blur-sm flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">HRP — Tier List</span>
          {activeId && <span className="text-[8px] text-stone-600 italic">{saves.find((s) => s.id === activeId)?.name || ""}</span>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom */}
          <div className="flex items-center gap-1 bg-stone-800 border border-stone-700 rounded-lg px-2 py-1">
            <button onClick={() => setZoom((z) => Math.max(50, z - 10))} className="text-stone-400 hover:text-white text-xs font-black w-5 h-5 flex items-center justify-center">−</button>
            <span className="text-[9px] font-black text-stone-400 w-8 text-center">{zoom}%</span>
            <button onClick={() => setZoom((z) => Math.min(200, z + 10))} className="text-stone-400 hover:text-white text-xs font-black w-5 h-5 flex items-center justify-center">+</button>
          </div>
          {/* Saves panel toggle */}
          <button onClick={() => setShowSaves((v) => !v)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-colors ${showSaves ? "bg-stone-600 text-white" : "bg-stone-800 hover:bg-stone-700 text-stone-300"}`}>
            <FolderOpen size={10} /> Saves {saves.length > 0 && <span className="bg-stone-600 text-stone-200 rounded-full px-1.5 text-[8px]">{saves.length}</span>}
          </button>
          {/* Add tier */}
          <button onClick={addTier} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[9px] font-black uppercase tracking-wide transition-colors">
            <Plus size={10} /> Rang
          </button>
          {/* Reset */}
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[9px] font-black uppercase tracking-wide transition-colors">
            <RotateCcw size={10} /> Reset
          </button>
          {/* Export */}
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-wide transition-colors disabled:opacity-50">
            <Download size={10} /> {exporting ? "Export..." : "Exporter"}
          </button>
          {/* Close */}
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Saves panel */}
      {showSaves && (
        <div className="border-b border-stone-800 bg-stone-900/80 px-4 py-3 space-y-3 shrink-0">
          {/* Save as */}
          <div className="flex items-center gap-2">
            <input
              value={saveNameInput}
              onChange={(e) => setSaveNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveAs()}
              placeholder={`Nom de la save (défaut : "${title}")`}
              className="flex-1 bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 outline-none focus:border-amber-600/50 placeholder:text-stone-600"
            />
            <button
              onClick={saveAs}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all ${savedFlash ? "bg-green-700 text-white" : "bg-amber-700 hover:bg-amber-600 text-white"}`}
            >
              {savedFlash ? <><Check size={10} /> Sauvegardé</> : <><Save size={10} /> Sauvegarder</>}
            </button>
          </div>
          {/* List of saves */}
          {saves.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {saves.map((s) => (
                <div key={s.id} className={`flex items-center gap-1.5 pl-3 pr-1 py-1.5 rounded-lg border text-[9px] font-black uppercase ${s.id === activeId ? "bg-stone-700 border-stone-500 text-white" : "bg-stone-800 border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200"} transition-colors`}>
                  <button onClick={() => loadSave(s)} className="tracking-wide">
                    {s.name || s.title}
                  </button>
                  <button onClick={() => deleteSave(s.id)} className="text-stone-600 hover:text-red-400 ml-1 transition-colors">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {saves.length === 0 && <div className="text-[8px] text-stone-700 italic">Aucune save — crée-en une ci-dessus.</div>}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Board */}
        <div ref={boardRef} className="rounded-xl overflow-hidden border border-stone-800 bg-stone-900 p-3 space-y-1" style={{ zoom: zoom / 100 }}>
          <div className="text-center pb-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent text-[11px] font-black uppercase tracking-[0.2em] text-stone-400 text-center outline-none border-b border-transparent hover:border-stone-600 focus:border-stone-500 transition-colors w-full max-w-xs"
              placeholder="Nom de la tier list"
            />
          </div>
          {tiers.map((tier) => (
            <div
              key={tier.id}
              onDragOver={(e) => { e.preventDefault(); setDragOver(tier.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(tier.id)}
              className={`flex items-stretch gap-0 rounded-lg overflow-hidden border transition-all group/row ${dragOver === tier.id ? "border-white/30 scale-[1.01]" : "border-stone-700/50"}`}
            >
              {/* Color swatch */}
              <div
                className="w-2 shrink-0 cursor-pointer hover:brightness-125 transition-all"
                style={{ backgroundColor: tier.color }}
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
                className="w-12 shrink-0 flex items-center justify-center font-black text-xl cursor-pointer relative group"
                style={{ backgroundColor: tier.color, color: "#fff" }}
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
                    className="w-10 text-center bg-transparent outline-none font-black text-xl text-white"
                    maxLength={8}
                  />
                ) : (
                  <>
                    <span className="truncate px-1 text-center leading-tight text-sm">{tier.label}</span>
                    <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px]">✎</span>
                  </>
                )}
              </div>
              {/* Drop zone */}
              <div className="flex-1 flex flex-wrap gap-2 p-2 min-h-[72px]" style={{ backgroundColor: colorToBg(tier.color) }}>
                {tier.chars.map((id) => {
                  const u = getUser(id);
                  if (!u) return null;
                  return (
                    <CharCard key={id} user={u} small draggable
                      onDragStart={() => handleDragStart(id, tier.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                    />
                  );
                })}
                {tier.chars.length === 0 && <div className="flex-1 flex items-center justify-center text-[8px] text-stone-700 italic">Glisse ici</div>}
              </div>
              {/* Delete button */}
              <button
                onClick={() => deleteTier(tier.id)}
                className="w-8 shrink-0 flex items-center justify-center bg-stone-800 text-stone-600 hover:text-red-400 hover:bg-stone-700 opacity-0 group-hover/row:opacity-100 transition-all"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>

        {/* Pool */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver("pool"); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={() => handleDrop("pool")}
          className={`rounded-xl border p-3 min-h-[100px] transition-all ${dragOver === "pool" ? "border-stone-500 bg-stone-800/60" : "border-stone-800 bg-stone-900/60"}`}
        >
          <div className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-600 mb-3">Non classés ({pool.length})</div>
          <div className="flex flex-wrap gap-3">
            {pool.map((id) => {
              const u = getUser(id);
              if (!u) return null;
              return (
                <CharCard key={id} user={u} draggable
                  onDragStart={() => handleDragStart(id, "pool")}
                  onDragEnd={() => { setDragging(null); setDragOver(null); }}
                />
              );
            })}
            {pool.length === 0 && <div className="text-[8px] text-stone-700 italic">Tous les personnages sont classés !</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierListModal;
