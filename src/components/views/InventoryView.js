import React, { useState, useMemo } from "react";
import {
  Box,
  Plus,
  EyeOff,
  Search,
  Save,
  X,
  PackageOpen,
  Tag,
  Scale,
  Coins,
  ImageIcon,
  Archive,
  Layers,
  Zap,
  SortAsc,
  SortDesc,
  Copy,
  Infinity,
} from "lucide-react";
import SecureDeleteButton from "../ui/SecureDeleteButton";
import { ROLES } from "../../lib/constants";
import { formatMoney } from "../../lib/gameUtils";

// Couleurs de rareté
const RARITY_CONFIG = {
  Commun: {
    border: "border-stone-300",
    bg: "bg-stone-100",
    text: "text-stone-600",
    badge: "bg-stone-200 text-stone-700",
    glow: "",
  },
  Atypique: {
    border: "border-green-300",
    bg: "bg-green-50",
    text: "text-green-700",
    badge: "bg-green-100 text-green-700",
    glow: "",
  },
  Rare: {
    border: "border-blue-300",
    bg: "bg-blue-50",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    glow: "ring-1 ring-blue-200",
  },
  Épique: {
    border: "border-purple-300",
    bg: "bg-purple-50",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-700",
    glow: "ring-2 ring-purple-200",
  },
  Légendaire: {
    border: "border-yellow-400",
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    badge: "bg-yellow-100 text-yellow-800",
    glow: "ring-2 ring-yellow-300 shadow-lg shadow-yellow-100",
  },
  Unique: {
    border: "border-red-400",
    bg: "bg-red-50",
    text: "text-red-800",
    badge: "bg-red-100 text-red-800",
    glow: "ring-2 ring-red-300 shadow-lg shadow-red-100",
  },
};

const RARITIES = ["Commun", "Atypique", "Rare", "Épique", "Légendaire", "Unique"];

const CATEGORIES = [
  "Nourriture",
  "Arme",
  "Armure",
  "Outil",
  "Matériau",
  "Bijou",
  "Vêtement",
  "Potion",
  "Parchemin",
  "Relique",
  "Divers",
];

const getRarityStyle = (rarity) => RARITY_CONFIG[rarity] || RARITY_CONFIG.Commun;

const InventoryView = ({ items, onUpdate, session, roleInfo, companies = [], countries = [], citizens = [] }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRarity, setFilterRarity] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [sortBy, setSortBy] = useState("name"); // name, price, rarity
  const [sortDir, setSortDir] = useState("asc");

  const canEdit = (ROLES[session?.role]?.level || 0) >= 90;
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const selected = safeItems.find((i) => i.id === selectedId);

  // Types dynamiques
  const allTypes = useMemo(() => {
    const types = new Set(safeItems.map((i) => i.type).filter(Boolean));
    return Array.from(types).sort();
  }, [safeItems]);

  // Catégories dynamiques
  const allCategories = useMemo(() => {
    const cats = new Set(safeItems.map((i) => i.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [safeItems]);

  // Filtrage + tri
  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase();
    let result = safeItems.filter((item) => {
      const matchSearch =
        (item.name || "").toLowerCase().includes(q) ||
        (item.type || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q);
      const matchRarity = filterRarity === "ALL" || item.rarity === filterRarity;
      const matchCategory = filterCategory === "ALL" || item.category === filterCategory;
      const matchType = filterType === "ALL" || item.type === filterType;
      return matchSearch && matchRarity && matchCategory && matchType;
    });

    // Tri
    const rarityOrder = RARITIES.reduce((acc, r, i) => { acc[r] = i; return acc; }, {});
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = (a.name || "").localeCompare(b.name || "");
      else if (sortBy === "price") cmp = (a.price || 0) - (b.price || 0);
      else if (sortBy === "rarity") cmp = (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0);
      else if (sortBy === "weight") cmp = (a.weight || 0) - (b.weight || 0);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [safeItems, searchTerm, filterRarity, filterCategory, filterType, sortBy, sortDir]);

  // Stats
  const stats = useMemo(() => ({
    total: safeItems.length,
    hidden: safeItems.filter((i) => i.hidden).length,
    byRarity: RARITIES.reduce((acc, r) => {
      acc[r] = safeItems.filter((i) => i.rarity === r).length;
      return acc;
    }, {}),
  }), [safeItems]);

  // Actions
  const handleCreate = () => {
    const newId = "i" + Date.now();
    const newItem = {
      id: newId,
      name: "Nouvel Objet",
      description: "",
      rarity: "Commun",
      price: 10,
      weight: 0.1,
      type: "Divers",
      category: "Divers",
      imageUrl: "",
      hidden: true,
      stackable: true,
      usable: false,
      stock: -1,
    };
    onUpdate([...safeItems, newItem]);
    setSelectedId(newId);
    setEditForm(newItem);
  };

  const handleDuplicate = (item) => {
    const newId = "i" + Date.now();
    const dup = { ...item, id: newId, name: item.name + " (copie)", hidden: true };
    onUpdate([...safeItems, dup]);
    setSelectedId(newId);
    setEditForm(dup);
  };

  const handleSave = () => {
    if (!editForm) return;
    const updatedItems = safeItems.map((i) =>
      i.id === editForm.id ? editForm : i
    );
    onUpdate(updatedItems);
    setEditForm(null);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const SortIcon = sortDir === "asc" ? SortAsc : SortDesc;

  return (
    <div className="flex flex-col h-full font-sans gap-4">
      {/* HEADER */}
      <div className="bg-stone-100 p-4 rounded-xl border border-stone-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-stone-800 flex items-center gap-2">
              <PackageOpen size={24} className="text-yellow-600" /> Catalogue Impérial
            </h2>
            <p className="text-[10px] uppercase text-stone-500 font-bold mt-1 ml-1">
              {filteredItems.length} / {stats.total} artefacts
              {stats.hidden > 0 && (
                <span className="ml-2 text-red-400">
                  ({stats.hidden} cachés)
                </span>
              )}
            </p>
          </div>

          {/* Mini stats raretés */}
          <div className="flex gap-1.5 flex-wrap">
            {RARITIES.map((r) => {
              const s = getRarityStyle(r);
              const count = stats.byRarity[r] || 0;
              if (count === 0) return null;
              return (
                <span
                  key={r}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${s.badge} cursor-pointer ${
                    filterRarity === r ? "ring-2 ring-stone-800" : ""
                  }`}
                  onClick={() => setFilterRarity(filterRarity === r ? "ALL" : r)}
                  title={`${r}: ${count} objet(s)`}
                >
                  {count} {r}
                </span>
              );
            })}
          </div>
        </div>

        {/* Filtres & Recherche */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold outline-none focus:border-stone-500"
              placeholder="Rechercher par nom, type, catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold outline-none"
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value)}
          >
            <option value="ALL">Toutes Raretés</option>
            {RARITIES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold outline-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="ALL">Toutes Catégories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {allTypes.length > 1 && (
            <select
              className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold outline-none"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">Tous Types</option>
              {allTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}

          {/* Tri */}
          <div className="flex bg-white border border-stone-300 rounded-lg overflow-hidden">
            {[
              { id: "name", label: "Nom" },
              { id: "price", label: "Prix" },
              { id: "rarity", label: "Rareté" },
              { id: "weight", label: "Poids" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => toggleSort(s.id)}
                className={`px-2.5 py-2 text-[10px] font-bold uppercase flex items-center gap-1 transition-colors ${
                  sortBy === s.id
                    ? "bg-stone-800 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                {s.label}
                {sortBy === s.id && <SortIcon size={10} />}
              </button>
            ))}
          </div>

          {canEdit && (
            <button
              onClick={handleCreate}
              className="bg-stone-900 text-white px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2 hover:bg-stone-700 transition-all shadow-lg"
            >
              <Plus size={14} /> Créer
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-6">
        {/* GRILLE D'OBJETS */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map((item) => {
              const rs = getRarityStyle(item.rarity);
              return (
                <div
                  key={item.id}
                  onClick={() => { setSelectedId(item.id); setEditForm(null); }}
                  className={`group relative p-3 rounded-xl border-2 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg bg-white flex gap-3 items-center ${
                    selectedId === item.id
                      ? `${rs.border} ring-2 ring-stone-200`
                      : "border-stone-100 hover:border-stone-300"
                  } ${rs.glow}`}
                >
                  {/* Image */}
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden border flex-shrink-0 ${rs.border} ${rs.bg}`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Box size={22} className={`opacity-50 ${rs.text}`} />
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-stone-800 text-sm truncate flex items-center gap-1.5">
                      {item.name}
                      {item.hidden && <EyeOff size={10} className="text-red-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider flex items-center gap-0.5">
                        <Tag size={8} /> {item.type}
                      </span>
                      {item.category && (
                        <span className="text-[8px] uppercase font-bold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-yellow-700 flex items-center gap-0.5">
                        <Coins size={9} /> {formatMoney(item.price)}
                      </span>
                      <span className="text-[9px] text-stone-400 flex items-center gap-0.5">
                        <Scale size={8} /> {item.weight || 0} kg
                      </span>
                      {item.stock !== undefined && item.stock !== -1 && (
                        <span className={`text-[9px] font-bold flex items-center gap-0.5 ${
                          item.stock === 0 ? "text-red-500" : "text-stone-500"
                        }`}>
                          <Archive size={8} /> {item.stock}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badge rareté */}
                  <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${rs.badge}`}>
                    {item.rarity}
                  </span>

                  {/* Indicateurs */}
                  <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                    {item.usable && (
                      <span className="bg-emerald-100 text-emerald-600 w-4 h-4 rounded flex items-center justify-center" title="Utilisable">
                        <Zap size={8} />
                      </span>
                    )}
                    {item.stackable && (
                      <span className="bg-blue-100 text-blue-600 w-4 h-4 rounded flex items-center justify-center" title="Empilable">
                        <Layers size={8} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-16 text-stone-400 italic">
                Aucun objet trouvé.
              </div>
            )}
          </div>
        </div>

        {/* PANNEAU DÉTAIL / ÉDITION */}
        {(selected || editForm) && (
          <div className="w-full md:w-[420px] bg-white border border-stone-200 rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Image Header */}
            <div className="h-48 bg-stone-100 relative group overflow-hidden">
              {(editForm || selected).imageUrl ? (
                <img src={(editForm || selected).imageUrl} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
                  <ImageIcon size={64} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                {canEdit && !editForm && (
                  <>
                    <button
                      onClick={() => setEditForm({ ...selected })}
                      className="bg-white text-stone-900 px-4 py-2 rounded-full font-bold text-xs uppercase hover:scale-105 transition-transform"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDuplicate(selected)}
                      className="bg-stone-800 text-white px-3 py-2 rounded-full font-bold text-xs uppercase hover:scale-105 transition-transform flex items-center gap-1"
                    >
                      <Copy size={12} /> Dupliquer
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => { setSelectedId(null); setEditForm(null); }}
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/50 text-white p-1 rounded-full backdrop-blur-md"
              >
                <X size={16} />
              </button>
              {/* Badge rareté */}
              {(() => {
                const rs = getRarityStyle((editForm || selected).rarity);
                return (
                  <span className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-black uppercase border ${rs.border} ${rs.bg} ${rs.text}`}>
                    {(editForm || selected).rarity}
                  </span>
                );
              })()}
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {editForm ? (
                /* MODE ÉDITION */
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">Nom</label>
                    <input
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded font-bold text-sm focus:border-stone-800 outline-none"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">Type</label>
                      <input
                        className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-xs font-bold outline-none"
                        value={editForm.type}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">Catégorie</label>
                      <select
                        className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-xs font-bold outline-none"
                        value={editForm.category || "Divers"}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">Rareté</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {RARITIES.map((r) => {
                        const rs = getRarityStyle(r);
                        return (
                          <button
                            key={r}
                            onClick={() => setEditForm({ ...editForm, rarity: r })}
                            className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase border transition-all ${
                              editForm.rarity === r
                                ? `${rs.border} ${rs.bg} ${rs.text} ring-2 ring-stone-400`
                                : "border-stone-200 bg-white text-stone-400 hover:bg-stone-50"
                            }`}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">Prix</label>
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full p-2 pr-6 bg-stone-50 border border-stone-200 rounded text-xs font-bold outline-none font-mono"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                        />
                        <Coins size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">Poids (kg)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          className="w-full p-2 pr-6 bg-stone-50 border border-stone-200 rounded text-xs font-bold outline-none font-mono"
                          value={editForm.weight}
                          onChange={(e) => setEditForm({ ...editForm, weight: parseFloat(e.target.value) || 0 })}
                        />
                        <Scale size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1 flex items-center gap-1">
                        Stock
                        <span className="text-[7px] text-stone-300 normal-case">(-1 = illimité)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-xs font-bold outline-none font-mono"
                          value={editForm.stock === undefined ? -1 : editForm.stock}
                          onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Destination des revenus */}
                  <div>
                    <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">
                      Destination des revenus
                      <span className="text-[7px] text-stone-300 normal-case ml-1">(où va l'argent des ventes)</span>
                    </label>
                    <select
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-xs font-bold outline-none"
                      value={editForm.revenueTarget ? `${editForm.revenueTarget.type}:${editForm.revenueTarget.id || ""}` : "GLOBAL:"}
                      onChange={(e) => {
                        const [type, id] = e.target.value.split(":");
                        if (type === "GLOBAL") {
                          setEditForm({ ...editForm, revenueTarget: null });
                        } else {
                          setEditForm({ ...editForm, revenueTarget: { type, id } });
                        }
                      }}
                    >
                      <option value="GLOBAL:">Trésor Impérial (par défaut)</option>
                      <optgroup label="Entreprises">
                        {companies.map((c) => (
                          <option key={c.id} value={`COMPANY:${c.id}`}>{c.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Pays">
                        {countries.map((c) => (
                          <option key={c.id} value={`COUNTRY:${c.id}`}>{c.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Citoyens">
                        {citizens.map((c) => (
                          <option key={c.id} value={`CITIZEN:${c.id}`}>{c.name}</option>
                        ))}
                      </optgroup>
                    </select>
                    {editForm.revenueTarget && (
                      <div className="mt-1 text-[9px] text-stone-400 italic">
                        Les revenus des ventes iront à : {
                          editForm.revenueTarget.type === "COMPANY" ? companies.find((c) => c.id === editForm.revenueTarget.id)?.name :
                          editForm.revenueTarget.type === "COUNTRY" ? countries.find((c) => c.id === editForm.revenueTarget.id)?.name :
                          editForm.revenueTarget.type === "CITIZEN" ? citizens.find((c) => c.id === editForm.revenueTarget.id)?.name :
                          "Trésor Impérial"
                        }
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">Image URL</label>
                    <input
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-xs text-stone-600 outline-none"
                      value={editForm.imageUrl}
                      onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                      placeholder="https://..."
                    />
                    {editForm.imageUrl && (
                      <div className="mt-2 w-20 h-20 rounded-lg border border-stone-200 overflow-hidden">
                        <img src={editForm.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">Description</label>
                    <textarea
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-sm italic min-h-[80px] outline-none resize-none"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      maxLength={500}
                    />
                  </div>
                  {/* Flags */}
                  <div className="flex flex-wrap gap-4 pt-2 border-t border-stone-100">
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.hidden}
                        onChange={(e) => setEditForm({ ...editForm, hidden: e.target.checked })}
                        className="rounded border-stone-300"
                      />
                      <EyeOff size={12} /> Caché du marché
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.stackable !== false}
                        onChange={(e) => setEditForm({ ...editForm, stackable: e.target.checked })}
                        className="rounded border-stone-300"
                      />
                      <Layers size={12} /> Empilable
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.usable || false}
                        onChange={(e) => setEditForm({ ...editForm, usable: e.target.checked })}
                        className="rounded border-stone-300"
                      />
                      <Zap size={12} /> Utilisable
                    </label>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => setEditForm(null)}
                      className="flex-1 py-3 text-xs font-bold uppercase text-stone-500 hover:bg-stone-50 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 py-3 bg-stone-900 text-white text-xs font-black uppercase rounded-lg hover:bg-stone-700 shadow-lg flex items-center justify-center gap-2"
                    >
                      <Save size={14} /> Sauvegarder
                    </button>
                  </div>
                </div>
              ) : (
                /* MODE LECTURE */
                <div className="space-y-5">
                  <div>
                    <h3 className="text-2xl font-black font-serif text-stone-900 uppercase leading-none mb-2">
                      {selected.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const rs = getRarityStyle(selected.rarity);
                        return (
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${rs.border} ${rs.bg} ${rs.text}`}>
                            {selected.rarity}
                          </span>
                        );
                      })()}
                      {selected.hidden && (
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-2 py-1 rounded border border-red-100 flex items-center gap-1">
                          <EyeOff size={10} /> Caché
                        </span>
                      )}
                      {selected.usable && (
                        <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1">
                          <Zap size={10} /> Utilisable
                        </span>
                      )}
                      {selected.stackable !== false && (
                        <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded border border-blue-200 flex items-center gap-1">
                          <Layers size={10} /> Empilable
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <div className="text-center">
                      <div className="text-[9px] uppercase font-black text-stone-400">Type</div>
                      <div className="font-bold text-stone-700 text-xs mt-1 flex items-center justify-center gap-1">
                        <Tag size={10} /> {selected.type}
                      </div>
                    </div>
                    <div className="text-center border-l border-stone-200">
                      <div className="text-[9px] uppercase font-black text-stone-400">Catégorie</div>
                      <div className="font-bold text-stone-700 text-xs mt-1">{selected.category || "—"}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <div className="text-center">
                      <div className="text-[9px] uppercase font-black text-stone-400">Prix</div>
                      <div className="font-black text-yellow-600 text-sm mt-1 flex items-center justify-center gap-1">
                        <Coins size={12} /> {selected.price}
                      </div>
                    </div>
                    <div className="text-center border-l border-stone-200">
                      <div className="text-[9px] uppercase font-black text-stone-400">Poids</div>
                      <div className="font-bold text-stone-700 text-xs mt-1 flex items-center justify-center gap-1">
                        <Scale size={10} /> {selected.weight || 0} kg
                      </div>
                    </div>
                    <div className="text-center border-l border-stone-200">
                      <div className="text-[9px] uppercase font-black text-stone-400">Stock</div>
                      <div className="font-bold text-stone-700 text-xs mt-1 flex items-center justify-center gap-1">
                        {selected.stock === -1 || selected.stock === undefined ? (
                          <><Infinity size={12} /> Illimité</>
                        ) : selected.stock === 0 ? (
                          <span className="text-red-600 font-black">Épuisé</span>
                        ) : (
                          <><Archive size={10} /> {selected.stock}</>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="italic text-stone-600 text-sm leading-relaxed border-l-4 border-stone-200 pl-4">
                      {selected.description || "Aucune description disponible pour cet artefact."}
                    </p>
                  </div>

                  {canEdit && (
                    <div className="pt-6 mt-auto border-t border-stone-100 flex items-center justify-between">
                      <SecureDeleteButton
                        onClick={() => {
                          onUpdate(safeItems.filter((x) => x.id !== selected.id));
                          setSelectedId(null);
                        }}
                        label="Détruire cet objet"
                      />
                      <button
                        onClick={() => handleDuplicate(selected)}
                        className="text-xs font-bold text-stone-500 hover:text-stone-700 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-stone-50"
                      >
                        <Copy size={12} /> Dupliquer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryView;
