import React, { useState, useMemo } from "react";
import {
  Swords, Sword, Shield, Zap, Heart, Plus, Trash2, Edit3, X,
  SkipForward, FileText, Save, RefreshCw, Search, Users, Flag,
} from "lucide-react";

/* ─── CONSTANTES ───────────────────────────────────────────────── */

const DEFAULT_COMBAT_STATS = {
  maxHp: 30, currentHp: 30,
  // Défense = armorBonus + defenseBase
  defenseBase: 0, armorBonus: 0,
  // Déf. Magique = spellBonus + magicDefenseBase
  magicDefenseBase: 0, spellBonus: 0,
  // Attaque = weaponBonus + attackBase
  attackBase: 0, weaponBonus: 0,
  // Vitesse de base (le roll est entré par le MJ par session)
  speedBase: 0,
  maxMana: 10, currentMana: 10,
  class: "guerrier", level: 1,
};

const DEFAULT_TECH = {
  name: "", type: "technique",
  bonusDamage: 0, effect: "", effectChance: 100,
  cooldown: 2, manaCost: 0, description: "",
};

// Couleurs des camps A/B/C/D
const CAMP_STYLES = [
  { id: "A", label: "Camp A", bg: "bg-red-900/30",   border: "border-red-700/60",   badge: "bg-red-800 text-red-200",   dot: "bg-red-500"   },
  { id: "B", label: "Camp B", bg: "bg-blue-900/30",  border: "border-blue-700/60",  badge: "bg-blue-800 text-blue-200", dot: "bg-blue-500"  },
  { id: "C", label: "Camp C", bg: "bg-green-900/30", border: "border-green-700/60", badge: "bg-green-800 text-green-200",dot: "bg-green-500" },
  { id: "D", label: "Camp D", bg: "bg-amber-900/30", border: "border-amber-700/60", badge: "bg-amber-700 text-amber-100",dot: "bg-amber-500" },
];

/* ─── HELPERS ─────────────────────────────────────────────────── */

const calcStats = (cs) => ({
  defense:      (cs.defenseBase || 0)      + (cs.armorBonus  || 0),
  magicDefense: (cs.magicDefenseBase || 0) + (cs.spellBonus  || 0),
  attack:       (cs.attackBase || 0)       + (cs.weaponBonus || 0),
  speed:        cs.speedBase || 0,
});

const StatNum = ({ label, value, onChange, min = 0, max = 9999, dim = false }) => (
  <div>
    <label className={`text-[8px] font-black uppercase tracking-widest block mb-0.5 ${dim ? "text-stone-600" : "text-stone-400"}`}>{label}</label>
    <input type="number" min={min} max={max} value={value}
      onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 font-mono outline-none focus:border-amber-600/60 transition-colors"
    />
  </div>
);

// Bloc « base + bonus = total »
const StatFormula = ({ label, base, bonus, bonusLabel, onBase, onBonus }) => {
  const total = (base || 0) + (bonus || 0);
  return (
    <div className="bg-stone-800/60 border border-stone-700/40 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{label}</span>
        <span className="text-sm font-black text-amber-400 font-mono">= {total}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatNum label="Base joueur" value={base} onChange={onBase} dim />
        <StatNum label={bonusLabel} value={bonus} onChange={onBonus} />
      </div>
    </div>
  );
};

/* ─── COMPOSANT PRINCIPAL ──────────────────────────────────────── */
export default function CombatAdminView({
  citizens = [], combatSessions = [],
  onSaveCombatStats, onCreateCombatSession,
  onUpdateCombatSession, onDeleteCombatSession,
  notify,
}) {
  const [tab, setTab] = useState("fiches");

  /* ── FICHES ── */
  const [selCitizenId, setSelCitizenId] = useState("");
  const [editStats, setEditStats] = useState(null);
  const [editTechs, setEditTechs] = useState([]);
  const [techForm, setTechForm] = useState(null);
  const [techEditId, setTechEditId] = useState(null);
  const [citizenSearch, setCitizenSearch] = useState("");

  /* ── COMBATS ── */
  const [selSessionId, setSelSessionId] = useState(null);
  const [newSessionName, setNewSessionName] = useState("");
  const [participantSearch, setParticipantSearch] = useState("");
  const [addCamp, setAddCamp] = useState("A");
  const [logForm, setLogForm] = useState({ actor: "", action: "Attaque", detail: "" });
  const [editHp, setEditHp]   = useState({});
  const [editMana, setEditMana] = useState({});
  const [editRoll, setEditRoll] = useState({});

  const safeCitizens = Array.isArray(citizens) ? citizens : [];
  const safeSessions = Array.isArray(combatSessions) ? combatSessions : [];

  /* ══════════════════════ FICHES LOGIQUE ══════════════════════ */

  const selectCitizen = (id) => {
    const c = safeCitizens.find(x => String(x.id) === String(id));
    if (!c) return;
    setSelCitizenId(String(id));
    setEditStats({ ...DEFAULT_COMBAT_STATS, ...(c.combatStats || {}) });
    setEditTechs(Array.isArray(c.techniques) ? c.techniques : []);
    setTechForm(null); setTechEditId(null);
  };

  const sc = (key) => (val) => setEditStats(p => ({ ...p, [key]: val }));

  const handleSaveFiche = () => {
    if (!selCitizenId || !editStats) return;
    onSaveCombatStats(selCitizenId, {
      combatStats: { ...editStats, currentHp: editStats.maxHp, currentMana: editStats.maxMana },
      techniques: editTechs,
    });
  };

  const handleResetVitals = () => {
    if (!selCitizenId || !editStats) return;
    const updated = { ...editStats, currentHp: editStats.maxHp, currentMana: editStats.maxMana };
    setEditStats(updated);
    onSaveCombatStats(selCitizenId, { combatStats: updated, techniques: editTechs });
    notify("PV et Mana remis au maximum.", "info");
  };

  const saveTech = () => {
    if (!techForm?.name?.trim()) { notify("Nom requis.", "error"); return; }
    if (techEditId) {
      setEditTechs(p => p.map(t => t.id === techEditId ? { ...techForm, id: techEditId } : t));
      setTechEditId(null);
    } else {
      setEditTechs(p => [...p, { ...techForm, id: Date.now().toString() }]);
    }
    setTechForm(null);
  };

  /* ══════════════════════ COMBATS LOGIQUE ══════════════════════ */

  const selSession = safeSessions.find(s => String(s.id) === String(selSessionId));

  // Trier par (speedBase + initiativeRoll) décroissant
  const sortedParticipants = useMemo(() => {
    if (!selSession) return [];
    return [...selSession.participants].sort((a, b) => {
      const va = (a.speedBase || a.speed || 0) + (a.initiativeRoll || 0);
      const vb = (b.speedBase || b.speed || 0) + (b.initiativeRoll || 0);
      return vb - va;
    });
  }, [selSession]);

  // Grouper par camp
  const participantsByCamp = useMemo(() => {
    if (!selSession) return {};
    const groups = {};
    selSession.participants.forEach(p => {
      const camp = p.campId || "A";
      if (!groups[camp]) groups[camp] = [];
      groups[camp].push(p);
    });
    return groups;
  }, [selSession]);

  const usedCamps = Object.keys(participantsByCamp);

  const handleCreateSession = () => {
    if (!newSessionName.trim()) { notify("Nom requis.", "error"); return; }
    const s = {
      id: Date.now().toString(), name: newSessionName.trim(),
      status: "pending", createdAt: Date.now(),
      currentParticipantIndex: 0, turnNumber: 1,
      participants: [], log: [],
    };
    onCreateCombatSession(s);
    setNewSessionName("");
    setSelSessionId(s.id);
    notify("Session créée.", "success");
  };

  const addParticipant = (citizenId) => {
    if (!selSession) return;
    const c = safeCitizens.find(x => String(x.id) === String(citizenId));
    if (!c) return;
    if (selSession.participants.some(p => String(p.citizenId) === String(citizenId))) {
      notify("Déjà dans le combat.", "error"); return;
    }
    const cs = { ...DEFAULT_COMBAT_STATS, ...(c.combatStats || {}) };
    const computed = calcStats(cs);
    onUpdateCombatSession(selSession.id, {
      participants: [...selSession.participants, {
        citizenId: c.id, name: c.name,
        class: cs.class, level: cs.level || 1,
        campId: addCamp,
        maxHp: cs.maxHp, currentHp: cs.currentHp ?? cs.maxHp,
        maxMana: cs.maxMana, currentMana: cs.currentMana ?? cs.maxMana,
        defenseBase: cs.defenseBase || 0, armorBonus: cs.armorBonus || 0,
        magicDefenseBase: cs.magicDefenseBase || 0, spellBonus: cs.spellBonus || 0,
        attackBase: cs.attackBase || 0, weaponBonus: cs.weaponBonus || 0,
        speedBase: cs.speedBase || 0,
        defense: computed.defense, magicDefense: computed.magicDefense,
        attack: computed.attack, speed: computed.speed,
        cooldowns: {}, initiativeRoll: null,
      }],
    });
    setParticipantSearch("");
  };

  const updateParticipant = (citizenId, updates) => {
    onUpdateCombatSession(selSession.id, {
      participants: selSession.participants.map(p =>
        String(p.citizenId) === String(citizenId) ? { ...p, ...updates } : p
      ),
    });
  };

  const applyHpChange   = (cid) => { const v = editHp[String(cid)];   if (v == null || v === "") return; const p = selSession.participants.find(x => String(x.citizenId) === String(cid)); if (!p) return; updateParticipant(cid, { currentHp:   Math.max(0, Math.min(p.maxHp, Number(v))) }); setEditHp(prev => { const n={...prev}; delete n[String(cid)]; return n; }); };
  const applyManaChange = (cid) => { const v = editMana[String(cid)]; if (v == null || v === "") return; const p = selSession.participants.find(x => String(x.citizenId) === String(cid)); if (!p) return; updateParticipant(cid, { currentMana: Math.max(0, Math.min(p.maxMana,Number(v))) }); setEditMana(prev => { const n={...prev}; delete n[String(cid)]; return n; }); };
  const applyRollChange = (cid) => { const v = editRoll[String(cid)]; if (v == null || v === "") return; updateParticipant(cid, { initiativeRoll: Number(v) }); setEditRoll(prev => { const n={...prev}; delete n[String(cid)]; return n; }); };

  const handleNextTurn = () => {
    const total = sortedParticipants.length;
    if (!total) return;
    const nextIdx = (selSession.currentParticipantIndex + 1) % total;
    onUpdateCombatSession(selSession.id, {
      currentParticipantIndex: nextIdx,
      turnNumber: nextIdx === 0 ? selSession.turnNumber + 1 : selSession.turnNumber,
    });
  };

  const addLogEntry = () => {
    if (!logForm.detail.trim()) return;
    onUpdateCombatSession(selSession.id, {
      log: [...(selSession.log || []), { id: Date.now(), turn: selSession.turnNumber, ...logForm, timestamp: Date.now() }],
    });
    setLogForm(p => ({ ...p, detail: "" }));
  };

  /* ─── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-900/20 border border-red-300 flex items-center justify-center shrink-0">
          <Swords size={20} className="text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-stone-800">Combat</h1>
          <p className="text-xs text-stone-500">Fiches de combat · Gestion des sessions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-200 rounded-xl p-1">
        {[
          { id: "fiches",  label: "Fiches de Combat" },
          { id: "combats", label: "Gestionnaire de Combats", badge: safeSessions.filter(s => s.status === "active").length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tab === t.id ? "bg-white text-stone-900 shadow-md" : "text-stone-500 hover:text-stone-800"}`}
          >
            {t.label}
            {t.badge > 0 && <span className="bg-red-600 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ══════════════════ ONGLET FICHES ══════════════════ */}
      {tab === "fiches" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Liste citoyens */}
          <div className="md:col-span-1 bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-3 border-b border-stone-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={12} />
                <input value={citizenSearch} onChange={e => setCitizenSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-stone-100 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-400/30"
                  placeholder="Rechercher un citoyen…" />
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-22rem)]">
              {safeCitizens.filter(c => !citizenSearch || c.name?.toLowerCase().includes(citizenSearch.toLowerCase())).map(c => {
                const isSel = String(selCitizenId) === String(c.id);
                return (
                  <button key={c.id} onClick={() => selectCitizen(c.id)}
                    className={`w-full text-left px-4 py-3 border-b border-stone-50 flex items-center gap-3 transition-colors hover:bg-stone-50 ${isSel ? "bg-amber-50 border-l-2 border-l-amber-500" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-stone-700 text-white text-xs font-black flex items-center justify-center shrink-0">{c.name?.[0]?.toUpperCase() || "?"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-stone-800 truncate">{c.name}</div>
                      <div className="text-[9px] text-stone-400 uppercase">{c.combatStats?.class || "—"} · Niv.{c.combatStats?.level || "—"}</div>
                    </div>
                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${c.combatStats ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-400"}`}>
                      {c.combatStats ? "Fiche" : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formulaire */}
          <div className="md:col-span-2 space-y-4">
            {!selCitizenId ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-400 italic text-sm shadow-sm">
                Sélectionner un citoyen pour modifier sa fiche de combat
              </div>
            ) : editStats && (() => {
              const total = calcStats(editStats);
              return (
                <>
                  {/* Header fiche */}
                  <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <Swords size={15} className="text-red-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-stone-800">
                          {safeCitizens.find(c => String(c.id) === selCitizenId)?.name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleResetVitals}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-lg transition-all">
                          <RefreshCw size={11} /> PV/Mana max
                        </button>
                        <button onClick={handleSaveFiche}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-[#b8860b] text-stone-900 hover:bg-[#d4a017] rounded-lg transition-all">
                          <Save size={11} /> Sauvegarder
                        </button>
                      </div>
                    </div>

                    <div className="p-5 space-y-5">
                      {/* Classe / niveau / PV */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Classe</label>
                          <select value={editStats.class} onChange={e => setEditStats(p => ({ ...p, class: e.target.value }))}
                            className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-600/60">
                            <option value="guerrier">Guerrier</option>
                            <option value="mage">Mage</option>
                          </select>
                        </div>
                        <StatNum label="Niveau" value={editStats.level} onChange={sc("level")} min={1} max={99} />
                        <StatNum label="PV Maximum" value={editStats.maxHp} onChange={sc("maxHp")} min={1} />
                      </div>

                      {/* Formules */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <StatFormula
                          label="Défense"
                          base={editStats.defenseBase} bonus={editStats.armorBonus}
                          bonusLabel="Armure"
                          onBase={sc("defenseBase")} onBonus={sc("armorBonus")}
                        />
                        <StatFormula
                          label="Défense Magique"
                          base={editStats.magicDefenseBase} bonus={editStats.spellBonus}
                          bonusLabel="Sort défensif"
                          onBase={sc("magicDefenseBase")} onBonus={sc("spellBonus")}
                        />
                        <StatFormula
                          label="Attaque"
                          base={editStats.attackBase} bonus={editStats.weaponBonus}
                          bonusLabel="Arme"
                          onBase={sc("attackBase")} onBonus={sc("weaponBonus")}
                        />
                        <div className="bg-stone-800/60 border border-stone-700/40 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Vitesse</span>
                            <span className="text-[8px] text-stone-500 italic">+ roll MJ en session</span>
                          </div>
                          <StatNum label="Base joueur" value={editStats.speedBase} onChange={sc("speedBase")} dim />
                        </div>
                      </div>

                      {/* Mana */}
                      <div className="grid grid-cols-2 gap-3">
                        <StatNum label="Mana Maximum" value={editStats.maxMana} onChange={sc("maxMana")} />
                        <div className="bg-stone-100 border border-stone-200 rounded-xl p-3 flex items-center gap-3">
                          <div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-stone-400">Récapitulatif</div>
                            <div className="text-[10px] text-stone-600 mt-1 space-y-0.5 font-mono">
                              <div>DEF {total.defense} · DEFMAG {total.magicDefense}</div>
                              <div>ATK {total.attack} · VIT {total.speed}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compétences */}
                  <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-amber-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-stone-800">Compétences ({editTechs.length})</span>
                      </div>
                      {!techForm && (
                        <button onClick={() => { setTechForm({ ...DEFAULT_TECH, type: editStats.class === "mage" ? "sort" : "technique" }); setTechEditId(null); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg transition-all">
                          <Plus size={11} /> Ajouter
                        </button>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      {techForm && (
                        <div className="bg-stone-900 rounded-xl border border-stone-700 p-4 space-y-3">
                          <div className="text-[9px] font-black uppercase tracking-widest text-amber-400">{techEditId ? "Modifier" : "Nouvelle compétence"}</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                              <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Nom</label>
                              <input value={techForm.name} onChange={e => setTechForm(p => ({ ...p, name: e.target.value }))}
                                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-600/60" placeholder="Nom de la compétence" />
                            </div>
                            <div>
                              <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Type</label>
                              <select value={techForm.type} onChange={e => setTechForm(p => ({ ...p, type: e.target.value }))}
                                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-600/60">
                                <option value="technique">Technique (Guerrier)</option>
                                <option value="sort">Sort (Mage)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Dégâts bonus</label>
                              <input type="number" min={0} value={techForm.bonusDamage} onChange={e => setTechForm(p => ({ ...p, bonusDamage: Number(e.target.value) }))}
                                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-600/60" />
                            </div>
                            {techForm.type === "technique" ? (
                              <div>
                                <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Recharge (tours)</label>
                                <input type="number" min={0} value={techForm.cooldown} onChange={e => setTechForm(p => ({ ...p, cooldown: Number(e.target.value) }))}
                                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-600/60" />
                              </div>
                            ) : (
                              <div>
                                <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Coût Mana</label>
                                <input type="number" min={0} value={techForm.manaCost} onChange={e => setTechForm(p => ({ ...p, manaCost: Number(e.target.value) }))}
                                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-600/60" />
                              </div>
                            )}
                            <div>
                              <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Effet</label>
                              <input value={techForm.effect} onChange={e => setTechForm(p => ({ ...p, effect: e.target.value }))}
                                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-600/60" placeholder="Ralentit, brûle…" />
                            </div>
                            <div>
                              <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Chance d'effet (%)</label>
                              <input type="number" min={0} max={100} value={techForm.effectChance} onChange={e => setTechForm(p => ({ ...p, effectChance: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-600/60" />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Description narrative</label>
                              <textarea value={techForm.description} onChange={e => setTechForm(p => ({ ...p, description: e.target.value }))} rows={2}
                                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-600/60 resize-none" />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => { setTechForm(null); setTechEditId(null); }} className="px-3 py-1.5 text-[10px] font-bold text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition-all">Annuler</button>
                            <button onClick={saveTech} className="px-3 py-1.5 text-[10px] font-black text-stone-900 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all">{techEditId ? "Modifier" : "Ajouter"}</button>
                          </div>
                        </div>
                      )}
                      {editTechs.length === 0 && !techForm ? (
                        <p className="text-xs text-stone-400 italic text-center py-4">Aucune compétence</p>
                      ) : editTechs.map(tech => (
                        <div key={tech.id} className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${tech.type === "sort" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                            {tech.type === "sort" ? <Zap size={14} /> : <Sword size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-stone-800">{tech.name}</span>
                              {tech.bonusDamage > 0 && <span className="text-[7px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black">+{tech.bonusDamage} dégâts</span>}
                              {tech.type === "technique" && tech.cooldown > 0 && <span className="text-[7px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded font-black">CD {tech.cooldown}t</span>}
                              {tech.type === "sort" && tech.manaCost > 0 && <span className="text-[7px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black">{tech.manaCost} mana</span>}
                              {tech.effectChance < 100 && tech.effect && <span className="text-[7px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black">{tech.effectChance}%</span>}
                            </div>
                            {tech.effect && <p className="text-[10px] text-stone-500 mt-0.5">Effet : {tech.effect}</p>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => { setTechForm({ ...tech }); setTechEditId(tech.id); }} className="p-1.5 rounded hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-all"><Edit3 size={12} /></button>
                            <button onClick={() => setEditTechs(p => p.filter(t => t.id !== tech.id))} className="p-1.5 rounded hover:bg-red-100 text-stone-400 hover:text-red-600 transition-all"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ══════════════════ ONGLET COMBATS ══════════════════ */}
      {tab === "combats" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Colonne gauche : sessions */}
          <div className="md:col-span-1 space-y-3">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">Nouvelle session</p>
              <input value={newSessionName} onChange={e => setNewSessionName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateSession()}
                className="w-full bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-400/30"
                placeholder="Nom du combat…" />
              <button onClick={handleCreateSession}
                className="w-full py-2 bg-[#b8860b] text-stone-900 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#d4a017] transition-all flex items-center justify-center gap-2">
                <Plus size={12} /> Créer
              </button>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
              {safeSessions.length === 0 ? (
                <p className="text-xs text-stone-400 italic text-center p-6">Aucune session</p>
              ) : [...safeSessions].sort((a, b) => b.createdAt - a.createdAt).map(s => {
                const sc = { pending: "bg-stone-200 text-stone-600", active: "bg-green-100 text-green-700", ended: "bg-stone-100 text-stone-400" }[s.status] || "bg-stone-100 text-stone-400";
                const sl = { pending: "En attente", active: "En cours", ended: "Terminé" }[s.status] || s.status;
                const isSel = String(selSessionId) === String(s.id);
                return (
                  <button key={s.id} onClick={() => setSelSessionId(String(s.id))}
                    className={`w-full text-left px-4 py-3 border-b border-stone-50 flex items-center gap-3 hover:bg-stone-50 transition-colors ${isSel ? "bg-amber-50 border-l-2 border-l-amber-500" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-stone-800 truncate">{s.name}</div>
                      <div className="text-[9px] text-stone-400">{s.participants?.length || 0} combattants · Tour {s.turnNumber}</div>
                    </div>
                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${sc}`}>{sl}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colonne droite : session sélectionnée */}
          <div className="md:col-span-2 space-y-4">
            {!selSession ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-400 italic text-sm shadow-sm">
                Sélectionner ou créer une session de combat
              </div>
            ) : (
              <>
                {/* Header + contrôles */}
                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
                    <div>
                      <h2 className="text-sm font-black uppercase text-stone-900">{selSession.name}</h2>
                      <p className="text-[9px] text-stone-400">
                        {selSession.status === "active" ? `Tour ${selSession.turnNumber} · ` : ""}
                        {selSession.participants.length} combattant{selSession.participants.length !== 1 ? "s" : ""}
                        {usedCamps.length > 0 && ` · ${usedCamps.length} camps`}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {selSession.status === "pending" && selSession.participants.length >= 2 && (
                        <button onClick={() => onUpdateCombatSession(selSession.id, { status: "active", currentParticipantIndex: 0, turnNumber: 1 })}
                          className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-green-700 transition-all">
                          Commencer
                        </button>
                      )}
                      {selSession.status === "active" && (
                        <>
                          <button onClick={handleNextTurn}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-stone-900 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-400 transition-all">
                            <SkipForward size={12} /> Tour suivant
                          </button>
                          <button onClick={() => onUpdateCombatSession(selSession.id, { status: "ended" })}
                            className="px-3 py-1.5 bg-stone-200 text-stone-700 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-stone-300 transition-all">
                            Terminer
                          </button>
                        </>
                      )}
                      <button onClick={() => { onDeleteCombatSession(selSession.id); setSelSessionId(null); }}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Ajouter participant */}
                  {selSession.status === "pending" && (
                    <div className="px-5 py-3 bg-stone-50 border-b border-stone-100 space-y-2">
                      <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Ajouter un combattant</p>
                      {/* Choix du camp */}
                      <div className="flex gap-2">
                        {CAMP_STYLES.map(camp => (
                          <button key={camp.id} onClick={() => setAddCamp(camp.id)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${addCamp === camp.id ? `${camp.badge} ${camp.border}` : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${camp.dot}`} />
                            {camp.label}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={12} />
                        <input value={participantSearch} onChange={e => setParticipantSearch(e.target.value)}
                          className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400/30"
                          placeholder="Chercher un citoyen à ajouter…" />
                      </div>
                      {participantSearch && (
                        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden max-h-36 overflow-y-auto shadow-lg">
                          {safeCitizens
                            .filter(c => c.name?.toLowerCase().includes(participantSearch.toLowerCase()) && !selSession.participants.some(p => String(p.citizenId) === String(c.id)))
                            .slice(0, 8).map(c => (
                              <button key={c.id} onClick={() => addParticipant(c.id)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 flex items-center gap-2 border-b border-stone-50 transition-colors">
                                <span className="w-5 h-5 rounded-full bg-stone-700 text-white text-[9px] flex items-center justify-center font-black shrink-0">{c.name?.[0]?.toUpperCase()}</span>
                                <span className="font-semibold text-stone-800 flex-1">{c.name}</span>
                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ml-auto ${CAMP_STYLES.find(x => x.id === addCamp)?.badge || ""}`}>
                                  Camp {addCamp}
                                </span>
                                {!c.combatStats && <span className="text-[8px] text-amber-500 font-bold">Sans fiche</span>}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vue par camps */}
                  {selSession.participants.length > 0 && (
                    <div className="p-4">
                      {/* Camps côte à côte */}
                      <div className={`grid gap-3 mb-4 ${usedCamps.length >= 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                        {usedCamps.sort().map(campId => {
                          const campStyle = CAMP_STYLES.find(x => x.id === campId) || CAMP_STYLES[0];
                          const campMembers = participantsByCamp[campId] || [];
                          return (
                            <div key={campId} className={`rounded-xl border p-3 ${campStyle.bg} ${campStyle.border}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Flag size={12} className="shrink-0" />
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${campStyle.badge}`}>{campStyle.label}</span>
                                <span className="text-[8px] text-stone-400">{campMembers.length} combattant{campMembers.length !== 1 ? "s" : ""}</span>
                              </div>
                              <div className="space-y-1.5">
                                {campMembers.map(p => {
                                  const hpPct = p.maxHp > 0 ? Math.max(0, (p.currentHp / p.maxHp) * 100) : 0;
                                  const hpColor = hpPct > 50 ? "bg-green-500" : hpPct > 25 ? "bg-amber-500" : "bg-red-500";
                                  const isDead = p.currentHp <= 0;
                                  const initTotal = (p.speedBase || p.speed || 0) + (p.initiativeRoll || 0);
                                  return (
                                    <div key={p.citizenId} className={`bg-stone-900/60 rounded-lg p-2.5 ${isDead ? "opacity-40" : ""}`}>
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className={`text-xs font-black text-stone-100 truncate ${isDead ? "line-through" : ""}`}>{p.name}</span>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <span className="text-[7px] font-mono text-stone-400">VIT {initTotal}</span>
                                          {selSession.status !== "ended" && (
                                            <button onClick={() => onUpdateCombatSession(selSession.id, { participants: selSession.participants.filter(x => String(x.citizenId) !== String(p.citizenId)) })}
                                              className="p-0.5 rounded hover:bg-red-900/50 text-stone-600 hover:text-red-400 transition-all">
                                              <X size={11} />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      {/* HP */}
                                      <div className="flex items-center gap-1.5">
                                        <Heart size={8} className="text-red-400 shrink-0" />
                                        <div className="flex-1 h-1 bg-stone-700 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full ${hpColor}`} style={{ width: `${hpPct}%` }} />
                                        </div>
                                        <input type="number" min={0} max={p.maxHp}
                                          value={editHp[String(p.citizenId)] ?? p.currentHp}
                                          onChange={e => setEditHp(prev => ({ ...prev, [String(p.citizenId)]: e.target.value }))}
                                          onBlur={() => applyHpChange(p.citizenId)}
                                          onKeyDown={e => e.key === "Enter" && applyHpChange(p.citizenId)}
                                          className="w-9 text-[9px] font-mono bg-stone-800 border border-stone-700 rounded px-1 py-0.5 text-center text-stone-200 outline-none focus:border-amber-500" />
                                        <span className="text-[8px] text-stone-500">/{p.maxHp}</span>
                                      </div>
                                      {/* Mana si mage */}
                                      {p.class === "mage" && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <Zap size={8} className="text-blue-400 shrink-0" />
                                          <div className="flex-1 h-1 bg-stone-700 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${p.maxMana > 0 ? Math.max(0,(p.currentMana/p.maxMana)*100) : 0}%` }} />
                                          </div>
                                          <input type="number" min={0} max={p.maxMana}
                                            value={editMana[String(p.citizenId)] ?? p.currentMana}
                                            onChange={e => setEditMana(prev => ({ ...prev, [String(p.citizenId)]: e.target.value }))}
                                            onBlur={() => applyManaChange(p.citizenId)}
                                            onKeyDown={e => e.key === "Enter" && applyManaChange(p.citizenId)}
                                            className="w-9 text-[9px] font-mono bg-stone-800 border border-stone-700 rounded px-1 py-0.5 text-center text-stone-200 outline-none focus:border-blue-500" />
                                          <span className="text-[8px] text-stone-500">/{p.maxMana}</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Ordre d'initiative */}
                      <div className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-stone-200 bg-stone-50">
                          <Users size={13} className="text-stone-500" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">Ordre d'initiative · Vitesse = Base + Roll MJ</span>
                        </div>
                        <div className="divide-y divide-stone-200">
                          {sortedParticipants.map((p, idx) => {
                            const isCurrent = selSession.status === "active" && idx === selSession.currentParticipantIndex;
                            const isDead = p.currentHp <= 0;
                            const campStyle = CAMP_STYLES.find(x => x.id === (p.campId || "A")) || CAMP_STYLES[0];
                            const initTotal = (p.speedBase || p.speed || 0) + (p.initiativeRoll || 0);
                            return (
                              <div key={p.citizenId}
                                className={`flex items-center gap-3 px-4 py-2 transition-all ${isCurrent ? "bg-amber-100 border-l-2 border-l-amber-500" : isDead ? "opacity-40" : "hover:bg-stone-50"}`}
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${isCurrent ? "bg-amber-500 text-stone-900" : "bg-stone-300 text-stone-700"}`}>
                                  {idx + 1}
                                </div>
                                <span className={`w-2 h-2 rounded-full shrink-0 ${campStyle.dot}`} />
                                <span className={`flex-1 text-xs font-bold truncate ${isDead ? "line-through text-stone-400" : "text-stone-800"}`}>
                                  {p.name}
                                </span>
                                {isCurrent && <span className="text-[7px] bg-amber-500 text-stone-900 px-1.5 py-0.5 rounded font-black animate-pulse">SON TOUR</span>}
                                {/* Roll MJ */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[8px] text-stone-400 font-mono">{p.speedBase || 0}+</span>
                                  <input type="number" min={0} max={99}
                                    value={editRoll[String(p.citizenId)] ?? (p.initiativeRoll ?? "")}
                                    onChange={e => setEditRoll(prev => ({ ...prev, [String(p.citizenId)]: e.target.value }))}
                                    onBlur={() => applyRollChange(p.citizenId)}
                                    onKeyDown={e => e.key === "Enter" && applyRollChange(p.citizenId)}
                                    placeholder="roll"
                                    className="w-12 text-[10px] font-mono bg-white border border-stone-300 rounded px-1 py-0.5 text-center outline-none focus:border-amber-500" />
                                  <span className="text-[8px] text-stone-500 font-mono w-7">={initTotal}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Journal */}
                {selSession.status !== "pending" && (
                  <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-stone-100">
                      <FileText size={14} className="text-stone-500" />
                      <span className="text-xs font-black uppercase tracking-widest text-stone-800">Journal de combat</span>
                    </div>
                    {selSession.status === "active" && (
                      <div className="px-5 py-3 border-b border-stone-100 bg-stone-50 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Acteur</label>
                            <select value={logForm.actor} onChange={e => setLogForm(p => ({ ...p, actor: e.target.value }))}
                              className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-amber-400/30">
                              <option value="">— Choisir —</option>
                              {sortedParticipants.map(p => <option key={p.citizenId} value={p.name}>{p.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Action</label>
                            <select value={logForm.action} onChange={e => setLogForm(p => ({ ...p, action: e.target.value }))}
                              className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-amber-400/30">
                              {["Attaque", "Technique/Sort", "Défense", "Esquive", "Fuite"].map(a => <option key={a}>{a}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input value={logForm.detail} onChange={e => setLogForm(p => ({ ...p, detail: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && addLogEntry()}
                            className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-amber-400/30"
                            placeholder="Dégâts infligés, roll, effet déclenché…" />
                          <button onClick={addLogEntry}
                            className="px-3 py-1.5 bg-[#b8860b] text-stone-900 text-[10px] font-black rounded-lg hover:bg-[#d4a017] transition-all">
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="max-h-56 overflow-y-auto divide-y divide-stone-50">
                      {(selSession.log || []).length === 0 ? (
                        <p className="text-xs text-stone-400 italic text-center p-6">Aucune action enregistrée</p>
                      ) : [...(selSession.log || [])].reverse().map(entry => {
                        const ac = { "Attaque": "text-red-600 bg-red-50", "Technique/Sort": "text-violet-700 bg-violet-50", "Défense": "text-blue-600 bg-blue-50", "Esquive": "text-green-600 bg-green-50", "Fuite": "text-stone-600 bg-stone-100" }[entry.action] || "text-stone-600 bg-stone-100";
                        return (
                          <div key={entry.id} className="px-4 py-2 flex items-start gap-3">
                            <span className="text-[8px] font-mono text-stone-400 shrink-0 mt-0.5">T{entry.turn}</span>
                            <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${ac}`}>{entry.action}</span>
                            <div className="flex-1 min-w-0">
                              {entry.actor && <span className="text-[9px] font-bold text-stone-600">{entry.actor} — </span>}
                              <span className="text-[10px] text-stone-700">{entry.detail}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
