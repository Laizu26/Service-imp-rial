import React, { useState, useMemo } from "react";
import {
  Map, Plus, Flag, Edit3, Crown, Users, Coins, Activity, Gavel, Lock,
  Award, Globe, Link, DownloadCloud, Heart, Search, X, Save, Trash2,
  MapPin, Shield, Anchor, Trees, Mountain, Building2, Landmark, Tent,
  ChevronDown, ChevronRight, BookOpen, UserCheck, Check,
} from "lucide-react";
import Card from "../ui/Card";
import SecureDeleteButton from "../ui/SecureDeleteButton";
import { MARRIAGE_STRUCTURES, FILIATION_TYPES } from "../../lib/constants";

// ── Palette couleurs pays ──────────────────────────────────────────────────
const COUNTRY_COLORS = [
  { id: "stone",  bg: "bg-stone-50",   accent: "bg-stone-700",  border: "border-stone-400",  label: "Pierre"    },
  { id: "amber",  bg: "bg-amber-50",   accent: "bg-amber-700",  border: "border-amber-400",  label: "Or"        },
  { id: "red",    bg: "bg-red-50",     accent: "bg-red-700",    border: "border-red-400",    label: "Écarlate"  },
  { id: "blue",   bg: "bg-blue-50",    accent: "bg-blue-700",   border: "border-blue-400",   label: "Azur"      },
  { id: "green",  bg: "bg-green-50",   accent: "bg-green-700",  border: "border-green-400",  label: "Émeraude"  },
  { id: "purple", bg: "bg-purple-50",  accent: "bg-purple-700", border: "border-purple-400", label: "Pourpre"   },
  { id: "rose",   bg: "bg-rose-50",    accent: "bg-rose-700",   border: "border-rose-400",   label: "Rosé"      },
  { id: "teal",   bg: "bg-teal-50",    accent: "bg-teal-700",   border: "border-teal-400",   label: "Jade"      },
];
const getColor = (id) => COUNTRY_COLORS.find((c) => c.id === id) || COUNTRY_COLORS[0];

// ── Types de régions ───────────────────────────────────────────────────────
const REGION_TYPES = [
  { id: "capitale", label: "Capitale",    icon: Crown      },
  { id: "ville",    label: "Ville",       icon: Building2  },
  { id: "village",  label: "Village",     icon: Tent       },
  { id: "port",     label: "Port",        icon: Anchor     },
  { id: "forteresse", label: "Forteresse", icon: Shield    },
  { id: "foret",    label: "Forêt",       icon: Trees      },
  { id: "montagne", label: "Montagne",    icon: Mountain   },
  { id: "plaine",   label: "Plaine",      icon: MapPin     },
  { id: "temple",   label: "Temple",      icon: Landmark   },
];
const getRegionType = (id) => REGION_TYPES.find((r) => r.id === id) || REGION_TYPES[1];

// ── Composant barre de stat ────────────────────────────────────────────────
const StatBar = ({ value, label, color = "bg-green-500", canEdit, onDec, onInc }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] uppercase font-bold text-stone-500">{label}</span>
      <span className="text-xs font-black text-stone-700">{value ?? 50}%</span>
    </div>
    <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value ?? 50}%` }} />
    </div>
    {canEdit && (
      <div className="flex gap-1 mt-1 justify-end">
        <button onClick={onDec} className="px-2 py-0.5 bg-stone-200 hover:bg-stone-300 rounded text-xs font-bold">−5</button>
        <button onClick={onInc} className="px-2 py-0.5 bg-stone-200 hover:bg-stone-300 rounded text-xs font-bold">+5</button>
      </div>
    )}
  </div>
);

const GeopoliticsView = ({
  countries,
  citizens,
  onUpdate,
  session,
  roleInfo,
}) => {
  const [selectedId, setSelectedId]   = useState(null);
  const [activeTab, setActiveTab]     = useState("info");
  const [isCreating, setIsCreating]   = useState(false);
  const [newCountryName, setNewCountryName] = useState("");
  const [renameBuf, setRenameBuf]     = useState("");
  const [isRenaming, setIsRenaming]   = useState(false);
  const [search, setSearch]           = useState("");

  // Région
  const [newRegionName, setNewRegionName]   = useState("");
  const [newRegionType, setNewRegionType]   = useState("ville");
  const [editingRegionId, setEditingRegionId] = useState(null);
  const [editRegionName, setEditRegionName] = useState("");
  const [editRegionType, setEditRegionType] = useState("ville");
  const [editRegionNote, setEditRegionNote] = useState("");

  // Hiérarchie
  const [newRoleName, setNewRoleName]               = useState("");
  const [newRoleType, setNewRoleType]               = useState("ROLE");
  const [newRoleLevel, setNewRoleLevel]             = useState(10);
  const [isRestrictedStatus, setIsRestrictedStatus] = useState(false);

  // Import GDoc
  const [gDocUrl, setGDocUrl]         = useState("");
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);

  // Décret expandé
  const [expandedDecree, setExpandedDecree] = useState(null);

  // ── Sécurités ──
  const safeCountries = Array.isArray(countries) ? countries : [];
  const safeCitizens  = Array.isArray(citizens)  ? citizens  : [];
  const safeRoleInfo  = roleInfo || { level: 0, scope: "LOCAL", role: "CITOYEN" };
  const isGlobal      = safeRoleInfo.scope === "GLOBAL";

  const selectedCountry = safeCountries.find((c) => c.id === selectedId);
  const colorCfg        = getColor(selectedCountry?.colorId);

  const canEdit           = isGlobal || (session?.countryId === selectedId && safeRoleInfo.level >= 40);
  const canManageCountries = safeRoleInfo.level >= 90 || safeRoleInfo.scope === "GLOBAL";

  const updateSelected = (updates) =>
    onUpdate(safeCountries.map((c) => (c.id === selectedId ? { ...c, ...updates } : c)));

  // ── Données calculées ──
  const displayedCountries = useMemo(() => {
    const list = safeCountries.filter((c) => isGlobal || c.id === session?.countryId);
    if (!search.trim()) return list;
    return list.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [safeCountries, isGlobal, session, search]);

  const countryCitizens = useMemo(() =>
    selectedCountry ? safeCitizens.filter((c) => c.countryId === selectedCountry.id) : [],
  [safeCitizens, selectedCountry]);

  const ruler = countryCitizens.find((c) => c.role === "ROI" || c.role === "EMPEREUR");
  const rulerName = ruler ? ruler.name : "Trône Vacant";

  // ── Migration helper ──
  const migrateSelectedCountry = () => {
    if (!selectedCountry || !Array.isArray(selectedCountry.laws)) return;
    if (!canEdit) return;
    if (
      !window.confirm(
        "Confirmer la migration ? Cette opération est irréversible."
      )
    )
      return;

    const defaultStructured = {
      allowExternalDebits: false,
      allowLocalConfiscation: true,
      allowLocalSales: true,
      allowPermissionEditsByLocalAdmins: true,
      requireRulerApprovalForSales: false,
    };

    const decrees = (selectedCountry.laws || []).map((d) => ({ ...d }));
    updateSelected({ laws: defaultStructured, decrees });
  };

  // --- IMPORT GDOC ---
  const handleImportGDoc = async () => {
    if (!gDocUrl) return;
    setIsLoadingDoc(true);

    try {
      const match = gDocUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match || !match[1]) {
        throw new Error("Lien invalide. Vérifiez le format Google Doc.");
      }
      const docId = match[1];
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        exportUrl
      )}`;

      const response = await fetch(proxyUrl);
      if (!response.ok)
        throw new Error("Impossible de lire le document. Est-il public ?");

      const text = await response.text();
      // On importe tout le texte comme un seul décret
      const newDecree = {
        id: Date.now(),
        name: "Décret Importé (Sans titre)",
        content: text, // Contenu riche
        date: new Date().toISOString(),
      };

      if (Array.isArray(selectedCountry.laws)) {
        updateSelected({
          laws: [...(selectedCountry.laws || []), newDecree],
        });
      } else {
        updateSelected({
          decrees: [...(selectedCountry.decrees || []), newDecree],
        });
      }

      setGDocUrl("");
      alert(`Décret importé avec succès !`);
    } catch (err) {
      alert("Erreur Import : " + err.message);
    } finally {
      setIsLoadingDoc(false);
    }
  };

  // ── Handlers création ──
  const handleStartCreation = () => {
    setSelectedId(null);
    setIsCreating(true);
    setNewCountryName("");
  };

  const handleCancelCreation = () => {
    setIsCreating(false);
    setNewCountryName("");
  };

  const handleAddCountry = () => {
    if (!newCountryName.trim()) return;
    const newCountry = {
      id: `C-${Date.now()}`,
      name: newCountryName.trim(),
      treasury: 1000,
      population: 0,
      stability: 50,
      security: 50,
      prosperity: 50,
      laws: [],
      regions: [{ id: 1, name: "Capitale", type: "Ville" }],
      customRoles: [],
      color: "bg-stone-50",
      rulerName: "Gouverneur",
      description: "Nouvelle contrée.",
      specialty: "Aucune",
    };
    onUpdate([...safeCountries, newCountry]);
    handleCancelCreation();
  };

  const handleDeleteCountry = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir dissoudre ce territoire ?")) {
      onUpdate(safeCountries.filter((c) => c.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  const addCustomRole = () => {
    if (!newRoleName) return;
    const maxLevel = safeRoleInfo.level - 1;
    const safeLevel = Math.min(
      Math.max(0, parseInt(newRoleLevel) || 0),
      maxLevel
    );

    const newRole = {
      id: `cr-${Date.now()}`,
      name: newRoleName,
      type: newRoleType,
      level: newRoleType === "ROLE" ? safeLevel : 0,
      isRestricted: newRoleType === "STATUS" ? isRestrictedStatus : false,
    };
    updateSelected({
      customRoles: [...(selectedCountry.customRoles || []), newRole],
    });
    setNewRoleName("");
    setNewRoleLevel(10);
    setIsRestrictedStatus(false);
  };

  const removeCustomRole = (roleId) => {
    updateSelected({
      customRoles: (selectedCountry.customRoles || []).filter(
        (r) => r.id !== roleId
      ),
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 font-sans">

      {/* ══════════════════════════════════════════════
          COLONNE GAUCHE — LISTE DES PAYS
      ══════════════════════════════════════════════ */}
      <div className="w-full md:w-72 shrink-0 bg-[#fdf6e3] rounded-2xl border border-stone-300 flex flex-col overflow-hidden shadow-md">

        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between gap-2">
          <div className="font-black uppercase text-[11px] tracking-[0.18em] text-stone-600 flex items-center gap-2">
            <Globe size={14} className="text-stone-500" /> Atlas Impérial
          </div>
          {canManageCountries && (
            <button onClick={handleStartCreation}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                isCreating ? "bg-stone-800 text-white" : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"
              }`}>
              <Plus size={14} />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-stone-100">
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-1.5">
            <Search size={12} className="text-stone-400 shrink-0" />
            <input
              className="flex-1 text-xs outline-none bg-transparent text-stone-700 placeholder:text-stone-300"
              placeholder="Rechercher un pays..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch("")}><X size={10} className="text-stone-400" /></button>}
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-2 space-y-1.5">
          {displayedCountries.length === 0 && (
            <div className="text-center p-10 text-stone-400 italic text-xs">
              {search ? "Aucun résultat." : "L'Empire est vide."}
            </div>
          )}
          {displayedCountries.map((c) => {
            const cc    = getColor(c.colorId);
            const cit   = safeCitizens.filter((u) => u.countryId === c.id).length;
            const regs  = (c.regions || []).length;
            const stab  = c.stability ?? 50;
            const isSelected = selectedId === c.id;
            return (
              <div key={c.id} onClick={() => { setSelectedId(c.id); setIsCreating(false); setActiveTab("info"); }}
                className={`relative rounded-xl cursor-pointer transition-all overflow-hidden border-2 ${
                  isSelected ? "border-stone-800 shadow-lg" : "border-transparent hover:border-stone-300 hover:shadow-sm"
                }`}>
                {/* Accent strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${cc.accent}`} />
                <div className={`pl-4 pr-3 py-3 ${isSelected ? "bg-white" : "bg-white/60 hover:bg-white/90"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-black text-sm text-stone-800 font-serif truncate">{c.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-stone-400">{cit} citoyen{cit !== 1 ? "s" : ""}</span>
                        <span className="text-stone-200">·</span>
                        <span className="text-[10px] text-stone-400">{regs} région{regs !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-stone-800 text-xs">{(c.treasury || 0).toLocaleString()}</div>
                      <div className="text-[9px] text-stone-400">Écus</div>
                    </div>
                  </div>
                  {/* Mini stability bar */}
                  <div className="mt-2 h-1 bg-stone-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${stab >= 70 ? "bg-green-400" : stab >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                      style={{ width: `${stab}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer stats */}
        <div className="p-3 border-t border-stone-200 bg-stone-50 flex gap-3 text-center">
          <div className="flex-1">
            <div className="font-black text-sm text-stone-700">{displayedCountries.length}</div>
            <div className="text-[9px] uppercase text-stone-400">Pays</div>
          </div>
          <div className="flex-1">
            <div className="font-black text-sm text-stone-700">{safeCitizens.filter((c) => isGlobal || c.countryId === session?.countryId).length}</div>
            <div className="text-[9px] uppercase text-stone-400">Citoyens</div>
          </div>
          <div className="flex-1">
            <div className="font-black text-sm text-stone-700">{displayedCountries.reduce((acc, c) => acc + (c.regions || []).length, 0)}</div>
            <div className="text-[9px] uppercase text-stone-400">Régions</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          COLONNE DROITE — CONTENU
      ══════════════════════════════════════════════ */}
      <div className="flex-1 bg-[#e6e2d6] rounded-2xl border border-stone-300 overflow-hidden shadow-inner flex flex-col min-h-0">

        {/* ── FORMULAIRE CRÉATION ── */}
        {isCreating ? (
          <div className="w-full h-full flex flex-col justify-center items-center p-8 animate-fadeIn">
            <div className="w-full max-w-lg p-8 bg-[#fdf6e3] rounded-2xl border-4 border-stone-800 shadow-2xl">
              <div className="text-center mb-8 border-b-2 border-stone-200 pb-6">
                <div className="inline-flex p-4 bg-stone-900 text-yellow-500 rounded-full mb-4 shadow-lg">
                  <Crown size={32} />
                </div>
                <h2 className="text-3xl font-black font-serif uppercase tracking-tight text-stone-900">Décret d'Annexion</h2>
              </div>
              <div className="space-y-4">
                <input autoFocus
                  className="w-full p-4 bg-white border-2 border-stone-300 rounded-xl font-serif font-bold text-xl outline-none focus:border-stone-900"
                  placeholder="Nom du pays..."
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCountry()}
                />
                {/* Couleur */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-stone-400 mb-2">Couleur emblématique</div>
                  <div className="flex gap-2 flex-wrap">
                    {COUNTRY_COLORS.map((cc) => (
                      <button key={cc.id} title={cc.label}
                        className={`w-7 h-7 rounded-full border-2 ${cc.accent} ${selectedId === cc.id ? "border-stone-900 scale-110" : "border-white"}`} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={handleCancelCreation} className="flex-1 py-3 rounded-xl font-bold uppercase text-[10px] text-stone-500 hover:bg-stone-200">Annuler</button>
                  <button onClick={handleAddCountry} disabled={!newCountryName.trim()}
                    className="flex-[2] bg-stone-900 text-yellow-500 py-3 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-stone-800 disabled:opacity-50">
                    Proclamer
                  </button>
                </div>
              </div>
            </div>
          </div>

        /* ── PAYS SÉLECTIONNÉ ── */
        ) : selectedCountry ? (
          <div className={`flex flex-col h-full ${colorCfg.bg}`}>

            {/* Hero header */}
            <div className="shrink-0">
              {/* Bande couleur */}
              <div className={`h-2 w-full ${colorCfg.accent}`} />
              <div className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-black/5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {isRenaming && canEdit ? (
                    <div className="flex gap-2 items-center">
                      <input autoFocus
                        className="text-2xl font-black font-serif p-2 flex-1 bg-white/80 rounded-lg border-2 border-stone-800 outline-none"
                        value={renameBuf}
                        onChange={(e) => setRenameBuf(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { updateSelected({ name: renameBuf }); setIsRenaming(false); } }}
                      />
                      <button onClick={() => { updateSelected({ name: renameBuf }); setIsRenaming(false); }}
                        className="bg-green-600 text-white p-2 rounded-lg"><Save size={16} /></button>
                      <button onClick={() => setIsRenaming(false)} className="p-2 rounded-lg bg-stone-100"><X size={16} /></button>
                    </div>
                  ) : (
                    <h2 className="text-2xl md:text-3xl font-black font-serif text-stone-800 flex items-center gap-3 cursor-pointer group"
                      onClick={() => { if (canEdit) { setRenameBuf(selectedCountry.name); setIsRenaming(true); } }}>
                      {selectedCountry.name}
                      {canEdit && <Edit3 size={16} className="opacity-0 group-hover:opacity-40 transition-opacity" />}
                    </h2>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-stone-500 flex items-center gap-1"><Crown size={11} /> {rulerName}</span>
                    {selectedCountry.specialty && (
                      <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{selectedCountry.specialty}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Couleur picker (owner) */}
                  {canEdit && (
                    <div className="flex gap-1">
                      {COUNTRY_COLORS.map((cc) => (
                        <button key={cc.id} title={cc.label}
                          onClick={() => updateSelected({ colorId: cc.id })}
                          className={`w-5 h-5 rounded-full ${cc.accent} border-2 transition-all ${selectedCountry.colorId === cc.id ? "border-stone-900 scale-125" : "border-white/60 hover:scale-110"}`} />
                      ))}
                    </div>
                  )}
                  {canManageCountries && <SecureDeleteButton onClick={() => handleDeleteCountry(selectedCountry.id)} />}
                </div>
              </div>

              {/* Barre de stats rapides */}
              <div className="grid grid-cols-4 border-b border-black/5 bg-white/40">
                {[
                  { label: "Trésorerie", value: `${(selectedCountry.treasury || 0).toLocaleString()} Écus`, icon: Coins },
                  { label: "Citoyens",   value: countryCitizens.length, icon: Users },
                  { label: "Régions",    value: (selectedCountry.regions || []).length, icon: MapPin },
                  { label: "Stabilité",  value: `${selectedCountry.stability ?? 50}%`, icon: Activity },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center justify-center py-3 border-r border-black/5 last:border-0">
                    <s.icon size={14} className="text-stone-400 mb-1" />
                    <div className="font-black text-sm text-stone-800">{s.value}</div>
                    <div className="text-[9px] uppercase text-stone-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white/30 border-b border-black/5 px-3 pt-2 gap-1 font-sans font-bold text-[10px] uppercase overflow-x-auto shrink-0">
              {[
                { id: "info",    label: "Gouvernance", icon: Crown    },
                { id: "laws",    label: "Législation",  icon: Gavel    },
                { id: "regions", label: "Territoires",  icon: Map      },
                { id: "ranks",   label: "Hiérarchie",   icon: Award    },
                { id: "citizens",label: "Habitants",    icon: Users    },
              ].map((t) => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg tracking-widest transition-all whitespace-nowrap border-b-2 ${
                    activeTab === t.id
                      ? "bg-white border-stone-800 text-stone-800 shadow-sm"
                      : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-white/40"
                  }`}>
                  <t.icon size={11} />{t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-5 md:p-8 space-y-6 pb-16 overflow-y-auto flex-1">
              {/* ══ ONGLET GOUVERNANCE ══ */}
              {activeTab === "info" && (
                <div className="space-y-5">
                  {/* Description + Spécialité */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/70 rounded-xl border border-stone-200 p-4 space-y-2">
                      <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-2"><BookOpen size={11} /> Description</div>
                      {canEdit ? (
                        <textarea
                          className="w-full p-2 border rounded-lg text-sm text-stone-700 bg-white/80 outline-none resize-none focus:border-stone-400"
                          rows={3}
                          value={selectedCountry.description || ""}
                          onChange={(e) => updateSelected({ description: e.target.value })}
                          placeholder="Décrivez ce territoire..."
                        />
                      ) : (
                        <p className="text-sm text-stone-600 italic">{selectedCountry.description || "Aucune description."}</p>
                      )}
                    </div>
                    <div className="bg-white/70 rounded-xl border border-stone-200 p-4 space-y-2">
                      <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Spécialité</div>
                      {canEdit ? (
                        <input
                          className="w-full p-2 border rounded-lg text-sm outline-none focus:border-stone-400"
                          value={selectedCountry.specialty || ""}
                          onChange={(e) => updateSelected({ specialty: e.target.value })}
                          placeholder="Ex: Commerce maritime, Artisanat..."
                        />
                      ) : (
                        <p className="text-sm font-bold text-stone-700">{selectedCountry.specialty || "Non définie"}</p>
                      )}
                      <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mt-3">Souverain</div>
                      <p className="text-sm font-black font-serif text-stone-800 flex items-center gap-2">
                        <Crown size={14} className="text-yellow-600" />{rulerName}
                      </p>
                    </div>
                  </div>

                  {/* Indicateurs */}
                  <div className="bg-white/70 rounded-xl border border-stone-200 p-4">
                    <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-4 flex items-center gap-2"><Activity size={11} /> Indicateurs</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <StatBar label="Stabilité"  value={selectedCountry.stability  ?? 50} color="bg-green-500"
                        canEdit={canEdit}
                        onDec={() => updateSelected({ stability:  Math.max(0,   (selectedCountry.stability  ?? 50) - 5) })}
                        onInc={() => updateSelected({ stability:  Math.min(100, (selectedCountry.stability  ?? 50) + 5) })} />
                      <StatBar label="Sécurité"   value={selectedCountry.security   ?? 50} color="bg-blue-500"
                        canEdit={canEdit}
                        onDec={() => updateSelected({ security:   Math.max(0,   (selectedCountry.security   ?? 50) - 5) })}
                        onInc={() => updateSelected({ security:   Math.min(100, (selectedCountry.security   ?? 50) + 5) })} />
                      <StatBar label="Prospérité" value={selectedCountry.prosperity ?? 50} color="bg-amber-500"
                        canEdit={canEdit}
                        onDec={() => updateSelected({ prosperity: Math.max(0,   (selectedCountry.prosperity ?? 50) - 5) })}
                        onInc={() => updateSelected({ prosperity: Math.min(100, (selectedCountry.prosperity ?? 50) + 5) })} />
                    </div>
                  </div>

                  {/* Trésorerie */}
                  <div className="bg-white/70 rounded-xl border border-stone-200 p-4 flex items-center gap-3">
                    <div className="p-3 bg-yellow-100 rounded-xl"><Coins size={20} className="text-yellow-700" /></div>
                    <div>
                      <div className="text-[10px] uppercase font-black text-stone-400 tracking-widest">Trésorerie nationale</div>
                      <div className="text-2xl font-black text-yellow-800 font-mono">{(selectedCountry.treasury || 0).toLocaleString()} <span className="text-sm">Écus</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- ONGLET LOIS (LEGISLATION) --- */}
              {activeTab === "laws" && (
                <Card title="Législation & Décrets" icon={Gavel}>
                  <div className="space-y-4">
                    {/* RESTAURATION DES CHECKBOXES DE LOIS */}
                    {selectedCountry.laws &&
                    !Array.isArray(selectedCountry.laws) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            key: "allowExternalDebits",
                            label: "Autoriser prélèvements externes",
                          },
                          {
                            key: "allowLocalConfiscation",
                            label: "Autoriser confiscations locales",
                          },
                          {
                            key: "allowLocalSales",
                            label: "Autoriser ventes locales",
                          },
                          {
                            key: "allowPermissionEditsByLocalAdmins",
                            label: "Admin: Edit Permissions",
                          },
                          {
                            key: "requireRulerApprovalForSales",
                            label: "Ventes: Approbation requise",
                          },
                          {
                            key: "taxForeignTransfers",
                            label: "Taxe transferts étrangers (10%)",
                          },
                          {
                            key: "freezeAssets",
                            label: "Geler les avoirs (Banque)",
                          },
                          {
                            key: "closedCurrency",
                            label: "Fermer la monnaie (Isolation)",
                          },
                          {
                            key: "closeBorders",
                            label: "Fermer les frontières",
                          },
                          { key: "forbidExit", label: "Interdire les sorties" },
                          {
                            key: "allowSelfManumission",
                            label: "Droit d'auto-rachat (Esclave)",
                          },
                          {
                            key: "militaryServitude",
                            label: "Servitude Martiale",
                          },
                          {
                            key: "banPublicSlaveMarket",
                            label: "Interdire marché esclaves",
                          },
                          {
                            key: "allowWeapons",
                            label: "Autoriser le port d'armes",
                          },
                          { key: "mailCensorship", label: "Censure Postale" },
                        ].map((f) => (
                          <div
                            key={f.key}
                            className="flex justify-between items-center p-3 bg-white border rounded"
                          >
                            <span className="text-xs font-bold text-stone-700">
                              {f.label}
                            </span>
                            {canEdit ? (
                              <label className="switch">
                                <input
                                  type="checkbox"
                                  checked={!!selectedCountry.laws[f.key]}
                                  onChange={() =>
                                    updateSelected({
                                      laws: {
                                        ...selectedCountry.laws,
                                        [f.key]: !selectedCountry.laws[f.key],
                                      },
                                    })
                                  }
                                />
                              </label>
                            ) : (
                              <span className="text-xs">
                                {selectedCountry.laws[f.key] ? "OUI" : "NON"}
                              </span>
                            )}
                          </div>
                        ))}
                        {/* Cas Spécial : Frais de Visa */}
                        <div className="flex justify-between items-center p-3 bg-white border rounded">
                          <span className="text-xs font-bold text-stone-700">
                            Frais Visa Entrée
                          </span>
                          {canEdit ? (
                            <input
                              type="number"
                              className="w-20 p-1 border rounded text-xs"
                              value={selectedCountry.laws.entryVisaFee || 0}
                              onChange={(e) =>
                                updateSelected({
                                  laws: {
                                    ...selectedCountry.laws,
                                    entryVisaFee: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                            />
                          ) : (
                            <span className="text-xs">
                              {selectedCountry.laws.entryVisaFee || 0} Écus
                            </span>
                          )}
                        </div>

                        {/* ── LOIS MATRIMONIALES ── */}
                        <div className="col-span-1 md:col-span-2 bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-4 mt-2">
                          <h4 className="text-xs font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                            <Heart size={12} /> Coutumes d'Union
                          </h4>

                          {/* Structure */}
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-xs font-bold text-stone-700 block">Coutume des Liens</span>
                              <span className="text-[9px] text-stone-400">Combien de liens sacrés un sujet peut-il contracter</span>
                            </div>
                            {canEdit ? (
                              <select
                                className="p-2 border-2 border-rose-200 rounded-lg text-xs font-bold bg-white outline-none focus:border-rose-400"
                                value={selectedCountry.laws.marriageStructure || "monogamie"}
                                onChange={(e) => updateSelected({ laws: { ...selectedCountry.laws, marriageStructure: e.target.value } })}
                              >
                                {Object.entries(MARRIAGE_STRUCTURES).map(([k, v]) => (
                                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-xs font-bold text-rose-700">
                                {MARRIAGE_STRUCTURES[selectedCountry.laws.marriageStructure || "monogamie"]?.emoji}{" "}
                                {MARRIAGE_STRUCTURES[selectedCountry.laws.marriageStructure || "monogamie"]?.label}
                              </span>
                            )}
                          </div>

                          {/* Filiation par défaut */}
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-xs font-bold text-stone-700 block">Lignée par Défaut</span>
                              <span className="text-[9px] text-stone-400">Quel sang transmet le nom et l'héritage aux descendants</span>
                            </div>
                            {canEdit ? (
                              <select
                                className="p-2 border-2 border-rose-200 rounded-lg text-xs font-bold bg-white outline-none focus:border-rose-400"
                                value={selectedCountry.laws.marriageDefaultFiliation || "patrilineaire"}
                                onChange={(e) => updateSelected({ laws: { ...selectedCountry.laws, marriageDefaultFiliation: e.target.value } })}
                              >
                                {FILIATION_TYPES.map((f) => (
                                  <option key={f.id} value={f.id}>{f.label}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-xs font-bold text-rose-700">
                                {FILIATION_TYPES.find((f) => f.id === (selectedCountry.laws.marriageDefaultFiliation || "patrilineaire"))?.label}
                              </span>
                            )}
                          </div>

                          {/* Âge minimum */}
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-xs font-bold text-stone-700 block">Âge des Noces</span>
                              <span className="text-[9px] text-stone-400">Âge minimal pour prononcer les vœux d'union</span>
                            </div>
                            {canEdit ? (
                              <input
                                type="number"
                                min={0}
                                max={100}
                                className="w-20 p-2 border-2 border-rose-200 rounded-lg text-xs font-bold text-center bg-white outline-none focus:border-rose-400"
                                value={selectedCountry.laws.marriageMinAge ?? 16}
                                onChange={(e) => updateSelected({ laws: { ...selectedCountry.laws, marriageMinAge: parseInt(e.target.value) || 0 } })}
                              />
                            ) : (
                              <span className="text-xs font-bold text-rose-700">{selectedCountry.laws.marriageMinAge ?? 16} hivers</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-stone-500 italic">
                        Format ancien.{" "}
                        <button
                          onClick={migrateSelectedCountry}
                          className="underline text-blue-600"
                        >
                          Migrer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SECTION IMPORT & LISTE DECRETS */}
                  <div className="mt-6 pt-6 border-t border-stone-200">
                    <h3 className="font-black uppercase text-xs mb-4 text-stone-400">
                      Décrets Spéciaux
                    </h3>
                    {canEdit && (
                      <div className="mb-6 p-4 bg-stone-100 border border-stone-300 rounded-xl shadow-inner">
                        <div className="text-[10px] font-black uppercase text-stone-500 tracking-widest mb-2 flex items-center gap-2">
                          <Link size={12} /> Importer GDoc
                        </div>
                        <div className="flex gap-2">
                          <input
                            className="flex-1 p-2 border border-stone-300 rounded text-xs"
                            placeholder="Lien public..."
                            value={gDocUrl}
                            onChange={(e) => setGDocUrl(e.target.value)}
                          />
                          <button
                            onClick={handleImportGDoc}
                            disabled={isLoadingDoc || !gDocUrl}
                            className="bg-stone-800 text-white px-4 rounded text-[10px] font-bold uppercase"
                          >
                            {isLoadingDoc ? "..." : <DownloadCloud size={14} />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {((Array.isArray(selectedCountry.laws) ? selectedCountry.laws : selectedCountry.decrees) || []).map((l) => (
                        <div key={l.id} className="bg-white border border-stone-100 rounded-xl shadow-sm overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3">
                            <button onClick={() => setExpandedDecree(expandedDecree === l.id ? null : l.id)}
                              className="flex items-center gap-2 flex-1 text-left">
                              {expandedDecree === l.id ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronRight size={14} className="text-stone-400" />}
                              <span className="font-bold text-stone-800 text-sm">📜 {l.name}</span>
                            </button>
                            {canEdit && (
                              <SecureDeleteButton onClick={() => {
                                if (Array.isArray(selectedCountry.laws)) {
                                  updateSelected({ laws: selectedCountry.laws.filter((x) => x.id !== l.id) });
                                } else {
                                  updateSelected({ decrees: (selectedCountry.decrees || []).filter((x) => x.id !== l.id) });
                                }
                              }} />
                            )}
                          </div>
                          {expandedDecree === l.id && l.content && (
                            <div className="px-4 pb-4 border-t border-stone-100 bg-stone-50">
                              <pre className="text-xs text-stone-600 whitespace-pre-wrap font-sans mt-3 leading-relaxed max-h-60 overflow-y-auto">{l.content}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* ══ ONGLET TERRITOIRES ══ */}
              {activeTab === "regions" && (
                <div className="space-y-4">
                  {canEdit && (
                    <div className="bg-white/70 border border-stone-200 rounded-xl p-4 space-y-3">
                      <div className="text-[10px] uppercase font-black text-stone-400 tracking-widest">Ajouter une région</div>
                      <div className="flex gap-2">
                        <input className="flex-1 p-2 border rounded-lg text-sm outline-none focus:border-stone-400"
                          placeholder="Nom de la région..."
                          value={newRegionName}
                          onChange={(e) => setNewRegionName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && newRegionName.trim()) { updateSelected({ regions: [...(selectedCountry.regions || []), { id: Date.now(), name: newRegionName.trim(), type: newRegionType }] }); setNewRegionName(""); } }}
                        />
                        <select className="p-2 border rounded-lg text-xs font-bold outline-none focus:border-stone-400 bg-white"
                          value={newRegionType} onChange={(e) => setNewRegionType(e.target.value)}>
                          {REGION_TYPES.map((rt) => <option key={rt.id} value={rt.id}>{rt.label}</option>)}
                        </select>
                        <button
                          onClick={() => { if (newRegionName.trim()) { updateSelected({ regions: [...(selectedCountry.regions || []), { id: Date.now(), name: newRegionName.trim(), type: newRegionType }] }); setNewRegionName(""); } }}
                          className="bg-stone-800 text-white px-4 rounded-lg text-[10px] uppercase font-bold"><Plus size={14} /></button>
                      </div>
                    </div>
                  )}
                  <div className="grid gap-3">
                    {(selectedCountry.regions || []).length === 0 && (
                      <p className="text-stone-400 text-sm italic text-center py-8">Aucun territoire défini.</p>
                    )}
                    {(selectedCountry.regions || []).map((r) => {
                      const rt      = getRegionType(r.type);
                      const present = safeCitizens.filter((c) => c.countryId === selectedCountry.id && c.currentPosition === r.name);
                      if (editingRegionId === r.id && canEdit) return (
                        <div key={r.id} className="bg-white border-2 border-stone-400 rounded-xl p-4 space-y-2">
                          <div className="flex gap-2">
                            <input className="flex-1 p-2 border rounded-lg text-sm font-bold outline-none"
                              value={editRegionName} onChange={(e) => setEditRegionName(e.target.value)} />
                            <select className="p-2 border rounded-lg text-xs font-bold bg-white"
                              value={editRegionType} onChange={(e) => setEditRegionType(e.target.value)}>
                              {REGION_TYPES.map((rt2) => <option key={rt2.id} value={rt2.id}>{rt2.label}</option>)}
                            </select>
                          </div>
                          <input className="w-full p-2 border rounded-lg text-xs outline-none"
                            value={editRegionNote} onChange={(e) => setEditRegionNote(e.target.value)}
                            placeholder="Note / description..." />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => {
                              const regions = (selectedCountry.regions || []).map((x) =>
                                x.id === r.id ? { ...x, name: editRegionName.trim() || x.name, type: editRegionType, note: editRegionNote } : x);
                              updateSelected({ regions });
                              setEditingRegionId(null);
                            }} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1"><Check size={12} /> Enregistrer</button>
                            <button onClick={() => setEditingRegionId(null)} className="bg-stone-100 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase">Annuler</button>
                          </div>
                        </div>
                      );
                      return (
                        <div key={r.id} className="bg-white/70 border border-stone-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-all">
                          <div className={`p-2.5 rounded-xl ${colorCfg.accent} text-white shrink-0`}>
                            <rt.icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-sm text-stone-800">{r.name}</span>
                              <span className="text-[9px] uppercase font-bold bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{rt.label}</span>
                              {present.length > 0 && (
                                <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <UserCheck size={9} /> {present.length} présent{present.length > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                            {r.note && <p className="text-xs text-stone-400 mt-0.5 truncate">{r.note}</p>}
                          </div>
                          {canEdit && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => { setEditingRegionId(r.id); setEditRegionName(r.name); setEditRegionType(r.type || "ville"); setEditRegionNote(r.note || ""); }}
                                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700"><Edit3 size={13} /></button>
                              <button onClick={() => updateSelected({ regions: (selectedCountry.regions || []).filter((x) => x.id !== r.id) })}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-stone-300 hover:text-red-500"><Trash2 size={13} /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══ ONGLET HIÉRARCHIE ══ */}
              {activeTab === "ranks" && (
                <div className="space-y-5">
                  {canEdit && (
                    <div className="bg-white/70 border border-stone-200 rounded-xl p-4 space-y-3">
                      <div className="text-[10px] uppercase font-black text-stone-400 tracking-widest">Ajouter un rang / statut</div>
                      <div className="flex gap-2">
                        <input className="flex-1 p-2 border rounded-lg text-sm outline-none focus:border-stone-400"
                          placeholder="Nom (ex: Duc, Banni...)"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)} />
                        <select className="p-2 border rounded-lg text-xs font-bold bg-white"
                          value={newRoleType}
                          onChange={(e) => setNewRoleType(e.target.value)}>
                          <option value="ROLE">Titre</option>
                          <option value="STATUS">Statut</option>
                        </select>
                      </div>
                      {newRoleType === "ROLE" && (
                        <div className="bg-white rounded-lg border p-3">
                          <label className="text-[9px] uppercase font-bold block mb-1 text-stone-500">Niveau accréditation : {newRoleLevel}</label>
                          <input type="range" min="0" max={Math.max(0, safeRoleInfo.level - 1)}
                            value={newRoleLevel} onChange={(e) => setNewRoleLevel(e.target.value)} className="w-full" />
                        </div>
                      )}
                      {newRoleType === "STATUS" && (
                        <label className="flex items-center gap-2 text-xs font-bold text-red-800 bg-red-50 p-3 rounded-lg border border-red-200 cursor-pointer">
                          <input type="checkbox" checked={isRestrictedStatus} onChange={(e) => setIsRestrictedStatus(e.target.checked)} />
                          <Lock size={12} /> Restreindre les libertés (Prisonnier / Esclave)
                        </label>
                      )}
                      <button onClick={addCustomRole} disabled={!newRoleName}
                        className="w-full bg-stone-800 text-white py-2 rounded-lg text-[10px] uppercase font-bold hover:bg-stone-700 disabled:opacity-50">
                        Enregistrer
                      </button>
                    </div>
                  )}
                  <div className="space-y-2">
                    {(selectedCountry.customRoles || []).length === 0 && (
                      <p className="text-stone-400 text-sm italic text-center py-8">Aucun rang défini.</p>
                    )}
                    {(selectedCountry.customRoles || []).map((r) => (
                      <div key={r.id} className={`flex items-center justify-between p-3 rounded-xl border ${r.isRestricted ? "bg-red-50 border-red-200" : "bg-white/70 border-stone-200"}`}>
                        <div>
                          <span className="font-bold text-sm">{r.type === "STATUS" ? "⚠️" : "🎖️"} {r.name}</span>
                          <div className="text-[9px] text-stone-400 uppercase mt-0.5">
                            {r.type === "ROLE" ? `Accréditation niv. ${r.level}` : r.isRestricted ? "Statut restreint" : "Statut libre"}
                          </div>
                        </div>
                        {canEdit && <SecureDeleteButton onClick={() => removeCustomRole(r.id)} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ ONGLET HABITANTS ══ */}
              {activeTab === "citizens" && (
                <div className="space-y-3">
                  <div className="text-xs text-stone-500">{countryCitizens.length} citoyen{countryCitizens.length !== 1 ? "s" : ""} enregistré{countryCitizens.length !== 1 ? "s" : ""}</div>
                  {countryCitizens.length === 0 && (
                    <p className="text-stone-400 text-sm italic text-center py-8">Aucun habitant.</p>
                  )}
                  {countryCitizens.map((c) => (
                    <div key={c.id} className="bg-white/70 border border-stone-200 rounded-xl px-4 py-3 flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-full ${colorCfg.accent} text-white flex items-center justify-center font-black text-sm shrink-0`}>
                        {(c.name || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-stone-800 truncate">{c.name}</div>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          {c.role && <span className="text-[9px] uppercase bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-bold">{c.role}</span>}
                          {c.currentPosition && (
                            <span className="text-[9px] text-stone-400 flex items-center gap-0.5">
                              <MapPin size={9} /> {c.currentPosition}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-bold text-stone-700">{(c.balance || 0).toLocaleString()}</div>
                        <div className="text-[9px] text-stone-400">Écus</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        /* ── ÉTAT VIDE ── */
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400 gap-4 p-8">
            <Globe size={48} className="opacity-20" />
            <p className="italic text-sm">Sélectionnez un territoire dans l'Atlas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeopoliticsView;
