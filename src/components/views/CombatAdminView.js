import React, { useState, useMemo } from "react";
import {
  Swords, Sword, Shield, Zap, Heart, Plus, Trash2, Edit3, X,
  SkipForward, FileText, Save, RefreshCw, Search, Users, Flag, EyeOff, Eye,
} from "lucide-react";

/* ─── CONSTANTES ───────────────────────────────────────────────── */

const DEFAULT_COMBAT_STATS = {
  maxHp: 30, currentHp: 30,
  defenseBase: 0, armorBonus: 0,
  magicDefenseBase: 0, spellBonus: 0,
  attackBase: 0, weaponBonus: 0,
  magicAttackBase: 0, magicAttackBonus: 0,
  speedBase: 0,
  maxMana: 10, currentMana: 10,
  level: 1,
};

const DEFAULT_TECH = {
  name: "", type: "technique",
  bonusDamage: 0, effect: "", effectChance: 100,
  cooldown: 2, manaCost: 0, description: "",
};

const DEFAULT_TALENT = { description: "", chance: 0, cooldown: 0 };

const EFFECT_STAT_OPTIONS = [
  { key: "attackBase",       label: "Attaque (base)" },
  { key: "weaponBonus",      label: "Attaque (arme)" },
  { key: "magicAttackBase",  label: "Atk. Mag. (base)" },
  { key: "magicAttackBonus", label: "Atk. Mag. (sort)" },
  { key: "defenseBase",      label: "Défense (base)" },
  { key: "armorBonus",       label: "Défense (armure)" },
  { key: "magicDefenseBase", label: "Déf. Mag. (base)" },
  { key: "spellBonus",       label: "Déf. Mag. (sort)" },
  { key: "maxHp",            label: "PV Max" },
  { key: "maxMana",          label: "Mana Max" },
];

const CAMP_STYLES = [
  { id: "A", label: "Camp A", bg: "bg-red-900/30",   border: "border-red-700/60",   badge: "bg-red-800 text-red-200",    dot: "bg-red-500"   },
  { id: "B", label: "Camp B", bg: "bg-blue-900/30",  border: "border-blue-700/60",  badge: "bg-blue-800 text-blue-200",  dot: "bg-blue-500"  },
  { id: "C", label: "Camp C", bg: "bg-green-900/30", border: "border-green-700/60", badge: "bg-green-800 text-green-200",dot: "bg-green-500" },
  { id: "D", label: "Camp D", bg: "bg-amber-900/30", border: "border-amber-700/60", badge: "bg-amber-700 text-amber-100",dot: "bg-amber-500" },
];

/* ─── HELPERS ─────────────────────────────────────────────────── */

const calcStats = (cs) => ({
  defense:      (cs.defenseBase || 0)       + (cs.armorBonus       || 0),
  magicDefense: (cs.magicDefenseBase || 0)  + (cs.spellBonus       || 0),
  attack:       (cs.attackBase || 0)        + (cs.weaponBonus      || 0),
  magicAttack:  (cs.magicAttackBase || 0)   + (cs.magicAttackBonus || 0),
  speed:        cs.speedBase || 0,
});

/* Champ numérique — toujours sur fond sombre */
const StatNum = ({ label, value, onChange, min = 0, max = 9999, dim = false }) => (
  <div>
    <label className={`text-[8px] font-black uppercase tracking-widest block mb-0.5 ${dim ? "text-stone-400" : "text-stone-200"}`}>
      {label}
    </label>
    <input
      type="number" min={min} max={max} value={value}
      onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
      className="w-full bg-stone-700 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 font-mono outline-none focus:border-amber-500 transition-colors"
    />
  </div>
);

/* Bloc « base + bonus = total » */
const StatFormula = ({ label, base, bonus, bonusLabel, onBase, onBonus }) => {
  const total = (base || 0) + (bonus || 0);
  return (
    <div className="bg-stone-800 border border-stone-600 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-stone-300">{label}</span>
        <span className="text-sm font-black text-amber-400 font-mono">= {total}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatNum label="Base joueur" value={base} onChange={onBase} dim />
        <StatNum label={bonusLabel} value={bonus} onChange={onBonus} />
      </div>
    </div>
  );
};

/* Carte technique structurée */
const TechCard = ({ tech, onEdit, onDelete }) => {
  const isSort = tech.type === "sort";
  return (
    <div className="bg-stone-800 border border-stone-700 rounded-xl overflow-hidden">
      {/* En-tête */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${isSort ? "border-blue-900/50 bg-blue-950/20" : "border-red-900/50 bg-red-950/20"}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSort ? "bg-blue-900/60 text-blue-300" : "bg-red-900/60 text-red-300"}`}>
          {isSort ? <Zap size={15} /> : <Sword size={15} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-stone-100 truncate">{tech.name || "Sans nom"}</div>
          <div className={`text-[8px] font-black uppercase tracking-widest ${isSort ? "text-blue-400" : "text-red-400"}`}>
            {isSort ? "Sort" : "Technique"}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-stone-700 text-stone-500 hover:text-stone-200 transition-all"
          >
            <Edit3 size={12} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-red-900/40 text-stone-500 hover:text-red-400 transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="px-4 py-3 border-b border-stone-700/60">
        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2.5">Statistiques</div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-stone-400">Dégâts</span>
            <span className={`text-[10px] font-black font-mono ${tech.bonusDamage > 0 ? "text-amber-400" : "text-stone-600"}`}>
              {tech.bonusDamage > 0 ? `+${tech.bonusDamage}` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-stone-400">Effet</span>
            <span className="text-[10px] text-stone-200 text-right max-w-[60%] truncate">
              {tech.effect
                ? `${tech.effect}${tech.effectChance < 100 ? ` (${tech.effectChance}%)` : ""}`
                : <span className="text-stone-600">—</span>
              }
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-stone-400">
              {isSort ? "Coût Mana" : "Recharge"}
            </span>
            <span className={`text-[10px] font-black font-mono ${isSort ? "text-blue-400" : "text-stone-200"}`}>
              {isSort
                ? (tech.manaCost > 0 ? `${tech.manaCost} mana` : <span className="text-stone-600">—</span>)
                : (tech.cooldown > 0 ? `${tech.cooldown} tour${tech.cooldown > 1 ? "s" : ""}` : "Aucune")
              }
            </span>
          </div>
        </div>
      </div>

      {/* Descriptif */}
      <div className="px-4 py-3">
        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1.5">Descriptif</div>
        <p className={`text-[10px] leading-relaxed ${tech.description ? "text-stone-300 italic" : "text-stone-600"}`}>
          {tech.description || "Aucune description"}
        </p>
      </div>
    </div>
  );
};

/* ─── COMPOSANT PRINCIPAL ──────────────────────────────────────── */
export default function CombatAdminView({
  citizens = [], combatSessions = [], combatEffects = [],
  onSaveCombatStats, onCreateCombatSession,
  onUpdateCombatSession, onDeleteCombatSession,
  onSaveCombatEffect, onDeleteCombatEffect,
  notify,
}) {
  const [tab, setTab] = useState("fiches");

  /* ── FICHES ── */
  const [selCitizenId, setSelCitizenId] = useState("");
  const [editStats, setEditStats] = useState(null);
  const [editTechs, setEditTechs] = useState([]);
  const [editTalent, setEditTalent] = useState(DEFAULT_TALENT);
  const [techForm, setTechForm] = useState(null);
  const [techEditId, setTechEditId] = useState(null);
  const [citizenSearch, setCitizenSearch] = useState("");

  /* ── COMBATS ── */
  const [selSessionId, setSelSessionId] = useState(null);
  const [newSessionName, setNewSessionName] = useState("");
  const [participantSearch, setParticipantSearch] = useState("");
  const [addCamp, setAddCamp] = useState("A");
  const [addMode, setAddMode] = useState("citizen");
  const [creatureForm, setCreatureForm] = useState({ name: "", maxHp: 30, attackBase: 0, magicAttackBase: 0, defenseBase: 0, magicDefenseBase: 0, speedBase: 0 });
  const [hideCreatureStats, setHideCreatureStats] = useState(true);
  const [statPopup, setStatPopup] = useState(null);   // citizenId string
  const [popupEdits, setPopupEdits] = useState({});
  const [logForm, setLogForm] = useState({ actor: "", action: "Attaque", detail: "" });
  const [editHp, setEditHp]   = useState({});
  const [editMana, setEditMana] = useState({});
  const [editRoll, setEditRoll] = useState({});
  const [malusForm, setMalusForm] = useState({ stat: "attackBase", value: -1, reason: "", turns: 0 });
  const [effectForm, setEffectForm] = useState({ name: "", emoji: "⚡", description: "", stat: "attackBase", value: -1, turns: 0 });
  const [editEffectId, setEditEffectId] = useState(null);
  const [applyingEffectId, setApplyingEffectId] = useState(null);

  const safeCitizens = Array.isArray(citizens) ? citizens : [];
  const safeSessions = Array.isArray(combatSessions) ? combatSessions : [];

  /* ══════════════════════ FICHES LOGIQUE ══════════════════════ */

  const selectCitizen = (id) => {
    const c = safeCitizens.find(x => String(x.id) === String(id));
    if (!c) return;
    setSelCitizenId(String(id));
    setEditStats({ ...DEFAULT_COMBAT_STATS, ...(c.combatStats || {}) });
    setEditTechs(Array.isArray(c.techniques) ? c.techniques : []);
    setEditTalent(c.talent ? { ...DEFAULT_TALENT, ...c.talent } : { ...DEFAULT_TALENT });
    setTechForm(null); setTechEditId(null);
  };

  const sc = (key) => (val) => setEditStats(p => ({ ...p, [key]: val }));

  const handleSaveFiche = () => {
    if (!selCitizenId || !editStats) return;
    onSaveCombatStats(selCitizenId, {
      combatStats: { ...editStats, currentHp: editStats.maxHp, currentMana: editStats.maxMana },
      techniques: editTechs,
      talent: editTalent,
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

  const sortedParticipants = useMemo(() => {
    if (!selSession) return [];
    return [...selSession.participants].sort((a, b) => {
      const va = a.initiativeRoll ?? -1;
      const vb = b.initiativeRoll ?? -1;
      return vb - va;
    });
  }, [selSession]);

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
        level: cs.level || 1,
        campId: addCamp,
        maxHp: cs.maxHp, currentHp: cs.currentHp ?? cs.maxHp,
        maxMana: cs.maxMana, currentMana: cs.currentMana ?? cs.maxMana,
        defenseBase: cs.defenseBase || 0, armorBonus: cs.armorBonus || 0,
        magicDefenseBase: cs.magicDefenseBase || 0, spellBonus: cs.spellBonus || 0,
        attackBase: cs.attackBase || 0, weaponBonus: cs.weaponBonus || 0,
        magicAttackBase: cs.magicAttackBase || 0, magicAttackBonus: cs.magicAttackBonus || 0,
        speedBase: cs.speedBase || 0,
        defense: computed.defense, magicDefense: computed.magicDefense,
        attack: computed.attack, magicAttack: computed.magicAttack, speed: computed.speed,
        cooldowns: {}, initiativeRoll: null,
      }],
    });
    setParticipantSearch("");
  };

  const addCreature = () => {
    if (!selSession || !creatureForm.name.trim()) return;
    const uid = "creature_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    const hp = Math.max(1, creatureForm.maxHp || 30);
    onUpdateCombatSession(selSession.id, {
      participants: [...selSession.participants, {
        citizenId: uid, name: creatureForm.name.trim(),
        isCreature: true,
        campId: addCamp,
        maxHp: hp, currentHp: hp,
        maxMana: 0, currentMana: 0,
        defenseBase: creatureForm.defenseBase || 0, armorBonus: 0,
        magicDefenseBase: creatureForm.magicDefenseBase || 0, spellBonus: 0,
        attackBase: creatureForm.attackBase || 0, weaponBonus: 0,
        magicAttackBase: creatureForm.magicAttackBase || 0, magicAttackBonus: 0,
        speedBase: creatureForm.speedBase || 0,
        defense: creatureForm.defenseBase || 0,
        magicDefense: creatureForm.magicDefenseBase || 0,
        attack: creatureForm.attackBase || 0,
        magicAttack: creatureForm.magicAttackBase || 0,
        speed: creatureForm.speedBase || 0,
        cooldowns: {}, initiativeRoll: null,
      }],
    });
    setCreatureForm({ name: "", maxHp: 30, attackBase: 0, magicAttackBase: 0, defenseBase: 0, magicDefenseBase: 0, speedBase: 0 });
  };

  const updateParticipant = (citizenId, updates) => {
    onUpdateCombatSession(selSession.id, {
      participants: selSession.participants.map(p =>
        String(p.citizenId) === String(citizenId) ? { ...p, ...updates } : p
      ),
    });
  };

  const applyHpChange   = (cid) => { const v = editHp[String(cid)];   if (v == null || v === "") return; const p = selSession.participants.find(x => String(x.citizenId) === String(cid)); if (!p) return; updateParticipant(cid, { currentHp:   Math.max(0, Math.min(p.maxHp,   Number(v))) }); setEditHp(prev => { const n={...prev}; delete n[String(cid)]; return n; }); };
  const applyManaChange = (cid) => { const v = editMana[String(cid)]; if (v == null || v === "") return; const p = selSession.participants.find(x => String(x.citizenId) === String(cid)); if (!p) return; updateParticipant(cid, { currentMana: Math.max(0, Math.min(p.maxMana, Number(v))) }); setEditMana(prev => { const n={...prev}; delete n[String(cid)]; return n; }); };
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

  const saveEffect = () => {
    if (!effectForm.name.trim()) { notify("Nom requis.", "error"); return; }
    const effect = {
      id: editEffectId || Date.now().toString(),
      name: effectForm.name.trim(),
      emoji: effectForm.emoji || "⚡",
      description: effectForm.description.trim(),
      stat: effectForm.stat,
      value: -Math.abs(effectForm.value || 1),
      turns: Math.max(0, effectForm.turns || 0),
    };
    onSaveCombatEffect(effect);
    setEffectForm({ name: "", emoji: "⚡", description: "", stat: "attackBase", value: -1, turns: 0 });
    setEditEffectId(null);
    notify(editEffectId ? "Effet modifié." : "Effet créé.", "success");
  };

  const startEditEffect = (effect) => {
    setEffectForm({ name: effect.name, emoji: effect.emoji || "⚡", description: effect.description || "", stat: effect.stat, value: effect.value, turns: effect.turns || 0 });
    setEditEffectId(effect.id);
    setTab("effets");
  };

  const applyEffect = (effect, citizenId) => {
    const participant = selSession?.participants.find(x => String(x.citizenId) === String(citizenId));
    if (!participant) return;
    const newMalus = { id: Date.now().toString(), stat: effect.stat, value: effect.value, reason: effect.name, turns: effect.turns || 0 };
    updateParticipant(citizenId, { malus: [...(participant.malus || []), newMalus] });
    setApplyingEffectId(null);
    notify(`${effect.emoji || ""} ${effect.name} appliqué à ${participant.name}.`, "success");
  };

  /* ─── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-900/20 border border-red-700/40 flex items-center justify-center shrink-0">
          <Swords size={20} className="text-red-500" />
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
          { id: "effets",  label: "Effets", badge: combatEffects.length },
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
              {safeCitizens
                .filter(c => !citizenSearch || c.name?.toLowerCase().includes(citizenSearch.toLowerCase()))
                .map(c => {
                  const isSel = String(selCitizenId) === String(c.id);
                  return (
                    <button key={c.id} onClick={() => selectCitizen(c.id)}
                      className={`w-full text-left px-4 py-3 border-b border-stone-50 flex items-center gap-3 transition-colors hover:bg-stone-50 ${isSel ? "bg-amber-50 border-l-2 border-l-amber-500" : ""}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-stone-700 text-white text-xs font-black flex items-center justify-center shrink-0">
                        {c.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-stone-800 truncate">{c.name}</div>
                        <div className="text-[9px] text-stone-400 uppercase">Niv. {c.combatStats?.level || "—"}</div>
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
                  {/* Fiche stats — fond sombre pour cohérence avec les inputs */}
                  <div className="bg-stone-900 border border-stone-700 rounded-2xl shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-stone-700">
                      <div className="flex items-center gap-2">
                        <Swords size={15} className="text-red-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-stone-200">
                          {safeCitizens.find(c => String(c.id) === selCitizenId)?.name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleResetVitals}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-stone-700 text-stone-200 hover:bg-stone-600 rounded-lg transition-all">
                          <RefreshCw size={11} /> PV/Mana max
                        </button>
                        <button onClick={handleSaveFiche}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-amber-600 text-stone-900 hover:bg-amber-500 rounded-lg transition-all">
                          <Save size={11} /> Sauvegarder
                        </button>
                      </div>
                    </div>

                    <div className="p-5 space-y-5">
                      {/* Niveau / PV */}
                      <div className="grid grid-cols-2 gap-3">
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
                        <StatFormula
                          label="Attaque Magique"
                          base={editStats.magicAttackBase} bonus={editStats.magicAttackBonus}
                          bonusLabel="Sort offensif"
                          onBase={sc("magicAttackBase")} onBonus={sc("magicAttackBonus")}
                        />
                      </div>

                      {/* Mana + récap */}
                      <div className="grid grid-cols-2 gap-3">
                        <StatNum label="Mana Maximum" value={editStats.maxMana} onChange={sc("maxMana")} />
                        <div className="bg-stone-800 border border-stone-600 rounded-xl p-3 flex items-center">
                          <div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-1">Récapitulatif</div>
                            <div className="text-[10px] text-stone-200 space-y-0.5 font-mono">
                              <div>DEF <span className="text-amber-400">{total.defense}</span> · DEFMAG <span className="text-amber-400">{total.magicDefense}</span></div>
                              <div>ATK <span className="text-amber-400">{total.attack}</span> · VIT <span className="text-amber-400">{total.speed}</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compétences */}
                  <div className="bg-stone-900 border border-stone-700 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-stone-700">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-amber-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-stone-200">Compétences ({editTechs.length})</span>
                      </div>
                      {!techForm && (
                        <button
                          onClick={() => { setTechForm({ ...DEFAULT_TECH }); setTechEditId(null); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-stone-700 text-stone-200 hover:bg-stone-600 rounded-lg transition-all"
                        >
                          <Plus size={11} /> Ajouter
                        </button>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Formulaire d'ajout */}
                      {techForm && (
                        <div className="bg-stone-800 rounded-xl border border-stone-600 p-4 space-y-3">
                          <div className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                            {techEditId ? "Modifier la compétence" : "Nouvelle compétence"}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Nom</label>
                              <input value={techForm.name} onChange={e => setTechForm(p => ({ ...p, name: e.target.value }))}
                                className="w-full bg-stone-700 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500"
                                placeholder="Nom de la compétence" />
                            </div>
                            <div>
                              <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Type</label>
                              <select value={techForm.type} onChange={e => setTechForm(p => ({ ...p, type: e.target.value }))}
                                className="w-full bg-stone-700 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500">
                                <option value="technique">Technique</option>
                                <option value="sort">Sort</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Dégâts bonus</label>
                              <input type="number" min={0} value={techForm.bonusDamage}
                                onChange={e => setTechForm(p => ({ ...p, bonusDamage: Number(e.target.value) }))}
                                className="w-full bg-stone-700 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 font-mono outline-none focus:border-amber-500" />
                            </div>
                            {techForm.type === "technique" ? (
                              <div>
                                <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Recharge (tours)</label>
                                <input type="number" min={0} value={techForm.cooldown}
                                  onChange={e => setTechForm(p => ({ ...p, cooldown: Number(e.target.value) }))}
                                  className="w-full bg-stone-700 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 font-mono outline-none focus:border-amber-500" />
                              </div>
                            ) : (
                              <div>
                                <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Coût Mana</label>
                                <input type="number" min={0} value={techForm.manaCost}
                                  onChange={e => setTechForm(p => ({ ...p, manaCost: Number(e.target.value) }))}
                                  className="w-full bg-stone-700 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 font-mono outline-none focus:border-amber-500" />
                              </div>
                            )}
                            <div>
                              <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Effet</label>
                              <input value={techForm.effect} onChange={e => setTechForm(p => ({ ...p, effect: e.target.value }))}
                                className="w-full bg-stone-700 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500"
                                placeholder="Ralentit, brûle…" />
                            </div>
                            <div>
                              <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Chance d'effet (%)</label>
                              <input type="number" min={0} max={100} value={techForm.effectChance}
                                onChange={e => setTechForm(p => ({ ...p, effectChance: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                                className="w-full bg-stone-700 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 font-mono outline-none focus:border-amber-500" />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Description narrative</label>
                              <textarea value={techForm.description}
                                onChange={e => setTechForm(p => ({ ...p, description: e.target.value }))} rows={2}
                                className="w-full bg-stone-700 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500 resize-none"
                                placeholder="Description narrative de la compétence…" />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => { setTechForm(null); setTechEditId(null); }}
                              className="px-3 py-1.5 text-[10px] font-bold text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-700 transition-all">
                              Annuler
                            </button>
                            <button onClick={saveTech}
                              className="px-3 py-1.5 text-[10px] font-black text-stone-900 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all">
                              {techEditId ? "Modifier" : "Ajouter"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Cartes fiches techniques */}
                      {editTechs.length === 0 && !techForm ? (
                        <p className="text-xs text-stone-500 italic text-center py-6">Aucune compétence — cliquez sur Ajouter</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {editTechs.map(tech => (
                            <TechCard
                              key={tech.id}
                              tech={tech}
                              onEdit={() => { setTechForm({ ...tech }); setTechEditId(tech.id); }}
                              onDelete={() => setEditTechs(p => p.filter(t => t.id !== tech.id))}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Talent */}
                  <div className="bg-stone-900 border border-stone-700 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-stone-700">
                      <span className="text-base">✦</span>
                      <span className="text-xs font-black uppercase tracking-widest text-stone-200">Talent</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Description</label>
                        <textarea
                          rows={3}
                          value={editTalent.description}
                          onChange={e => setEditTalent(p => ({ ...p, description: e.target.value }))}
                          className="w-full bg-stone-800 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500 resize-none"
                          placeholder="Description du talent passif ou actif…"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Chance (%)</label>
                          <input
                            type="number" min={0} max={100}
                            value={editTalent.chance}
                            onChange={e => setEditTalent(p => ({ ...p, chance: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                            className="w-full bg-stone-800 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 font-mono outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Recharge (tours)</label>
                          <input
                            type="number" min={0}
                            value={editTalent.cooldown}
                            onChange={e => setEditTalent(p => ({ ...p, cooldown: Number(e.target.value) }))}
                            className="w-full bg-stone-800 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 font-mono outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
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
                className="w-full bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-400/30 text-stone-800"
                placeholder="Nom du combat…" />
              <button onClick={handleCreateSession}
                className="w-full py-2 bg-amber-600 text-stone-900 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-500 transition-all flex items-center justify-center gap-2">
                <Plus size={12} /> Créer
              </button>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
              {safeSessions.length === 0 ? (
                <p className="text-xs text-stone-400 italic text-center p-6">Aucune session</p>
              ) : [...safeSessions].sort((a, b) => b.createdAt - a.createdAt).map(s => {
                const statusCls = { pending: "bg-stone-200 text-stone-600", active: "bg-green-100 text-green-700", ended: "bg-stone-100 text-stone-400" }[s.status] || "bg-stone-100 text-stone-400";
                const statusLbl = { pending: "En attente", active: "En cours", ended: "Terminé" }[s.status] || s.status;
                const isSel = String(selSessionId) === String(s.id);
                return (
                  <button key={s.id} onClick={() => setSelSessionId(String(s.id))}
                    className={`w-full text-left px-4 py-3 border-b border-stone-50 flex items-center gap-3 hover:bg-stone-50 transition-colors ${isSel ? "bg-amber-50 border-l-2 border-l-amber-500" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-stone-800 truncate">{s.name}</div>
                      <div className="text-[9px] text-stone-400">{s.participants?.length || 0} combattants · Tour {s.turnNumber}</div>
                    </div>
                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${statusCls}`}>{statusLbl}</span>
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
                      <p className="text-[9px] text-stone-500">
                        {selSession.status === "active" ? `Tour ${selSession.turnNumber} · ` : ""}
                        {selSession.participants.length} combattant{selSession.participants.length !== 1 ? "s" : ""}
                        {usedCamps.length > 0 && ` · ${usedCamps.length} camp${usedCamps.length > 1 ? "s" : ""}`}
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
                      <button
                        onClick={() => setHideCreatureStats(v => !v)}
                        title={hideCreatureStats ? "Afficher les stats des créatures" : "Masquer les stats des créatures"}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${hideCreatureStats ? "bg-stone-800 text-stone-200 border-stone-700" : "bg-stone-100 text-stone-500 border-stone-200 hover:border-stone-400"}`}
                      >
                        {hideCreatureStats ? <EyeOff size={11} /> : <Eye size={11} />}
                        Créatures
                      </button>
                      <button onClick={() => { onDeleteCombatSession(selSession.id); setSelSessionId(null); }}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Ajouter participant — disponible en pending ET en active */}
                  {(selSession.status === "pending" || selSession.status === "active") && (
                    <div className="px-5 py-3 bg-stone-50 border-b border-stone-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">Ajouter un combattant</p>
                        {/* Toggle citoyen / créature */}
                        <div className="flex gap-1 bg-stone-200 rounded-lg p-0.5">
                          <button onClick={() => setAddMode("citizen")}
                            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${addMode === "citizen" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}>
                            Citoyen
                          </button>
                          <button onClick={() => setAddMode("creature")}
                            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${addMode === "creature" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}>
                            Créature
                          </button>
                        </div>
                      </div>

                      {/* Sélection du camp (commun aux deux modes) */}
                      <div className="flex gap-2 flex-wrap">
                        {CAMP_STYLES.map(camp => (
                          <button key={camp.id} onClick={() => setAddCamp(camp.id)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${addCamp === camp.id ? `${camp.badge} ${camp.border}` : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${camp.dot}`} />
                            {camp.label}
                          </button>
                        ))}
                      </div>

                      {/* Mode : chercher un citoyen */}
                      {addMode === "citizen" && (
                        <>
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={12} />
                            <input value={participantSearch} onChange={e => setParticipantSearch(e.target.value)}
                              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400/30 text-stone-800"
                              placeholder="Chercher un citoyen à ajouter…" />
                          </div>
                          {participantSearch && (
                            <div className="bg-white border border-stone-200 rounded-lg overflow-hidden max-h-36 overflow-y-auto shadow-lg">
                              {safeCitizens
                                .filter(c => c.name?.toLowerCase().includes(participantSearch.toLowerCase()) && !selSession.participants.some(p => String(p.citizenId) === String(c.id)))
                                .slice(0, 8).map(c => (
                                  <button key={c.id} onClick={() => { addParticipant(c.id); }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 flex items-center gap-2 border-b border-stone-50 transition-colors">
                                    <span className="w-5 h-5 rounded-full bg-stone-700 text-white text-[9px] flex items-center justify-center font-black shrink-0">
                                      {c.name?.[0]?.toUpperCase()}
                                    </span>
                                    <span className="font-semibold text-stone-800 flex-1">{c.name}</span>
                                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ml-auto ${CAMP_STYLES.find(x => x.id === addCamp)?.badge || ""}`}>
                                      Camp {addCamp}
                                    </span>
                                    {!c.combatStats && <span className="text-[8px] text-amber-600 font-bold">Sans fiche</span>}
                                  </button>
                                ))}
                            </div>
                          )}
                        </>
                      )}

                      {/* Mode : créer une créature */}
                      {addMode === "creature" && (
                        <div className="space-y-2">
                          <input
                            value={creatureForm.name}
                            onChange={e => setCreatureForm(p => ({ ...p, name: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && addCreature()}
                            placeholder="Nom de la créature…"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-red-400/30 text-stone-800 font-semibold"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: "PV max",    key: "maxHp" },
                              { label: "Attaque",   key: "attackBase" },
                              { label: "Atk.Mag",   key: "magicAttackBase" },
                              { label: "Défense",   key: "defenseBase" },
                              { label: "Déf.Mag",   key: "magicDefenseBase" },
                              { label: "Vitesse",   key: "speedBase" },
                            ].map(({ label, key }) => (
                              <div key={key}>
                                <label className="text-[8px] font-bold uppercase tracking-widest text-stone-400 block mb-0.5">{label}</label>
                                <input type="number" min={0}
                                  value={creatureForm[key]}
                                  onChange={e => setCreatureForm(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))}
                                  className="w-full px-2 py-1 text-xs bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-red-400/30 text-stone-800 text-center font-mono"
                                />
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={addCreature}
                            disabled={!creatureForm.name.trim()}
                            className="w-full py-1.5 bg-red-800 hover:bg-red-700 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5"
                          >
                            <Plus size={11} /> Ajouter la créature
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vue par camps */}
                  {selSession.participants.length > 0 && (
                    <div className="p-4">
                      <div className={`grid gap-3 mb-4 ${usedCamps.length >= 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                        {usedCamps.sort().map(campId => {
                          const campStyle = CAMP_STYLES.find(x => x.id === campId) || CAMP_STYLES[0];
                          const campMembers = participantsByCamp[campId] || [];
                          return (
                            <div key={campId} className={`rounded-xl border p-3 ${campStyle.bg} ${campStyle.border}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Flag size={12} className="shrink-0 text-stone-300" />
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${campStyle.badge}`}>{campStyle.label}</span>
                                <span className="text-[8px] text-stone-400">{campMembers.length} combattant{campMembers.length !== 1 ? "s" : ""}</span>
                              </div>
                              <div className="space-y-1.5">
                                {campMembers.map(p => {
                                  const hpPct = p.maxHp > 0 ? Math.max(0, (p.currentHp / p.maxHp) * 100) : 0;
                                  const hpColor = hpPct > 50 ? "bg-green-500" : hpPct > 25 ? "bg-amber-500" : "bg-red-500";
                                  const isDead = p.currentHp <= 0;
                                  const initTotal = p.initiativeRoll ?? 0;
                                  const masked = hideCreatureStats && p.isCreature;
                                  // État lisible sans chiffres
                                  const hpState = isDead ? { label: "Mort", cls: "bg-stone-600 text-stone-300" }
                                    : hpPct > 66 ? { label: "Intact", cls: "bg-green-900/60 text-green-300" }
                                    : hpPct > 33 ? { label: "Blessé", cls: "bg-amber-900/60 text-amber-300" }
                                    : { label: "Critique", cls: "bg-red-900/60 text-red-300" };
                                  return (
                                    <div key={p.citizenId} className={`bg-stone-900/70 rounded-lg p-2.5 ${isDead ? "opacity-40" : ""} cursor-pointer hover:bg-stone-800/80 transition-colors`}
                                      onClick={() => { setStatPopup(String(p.citizenId)); setPopupEdits({}); }}>
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className={`text-xs font-black text-stone-100 truncate ${isDead ? "line-through" : ""}`}>{p.name}</span>
                                          {p.isCreature && <span className="text-[7px] font-black uppercase px-1 py-0.5 rounded bg-red-900/50 text-red-300 shrink-0">Créature</span>}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          {!masked && <span className="text-[7px] font-mono text-stone-300">VIT {initTotal}</span>}
                                          {selSession.status !== "ended" && (
                                            <button onClick={(e) => { e.stopPropagation(); onUpdateCombatSession(selSession.id, { participants: selSession.participants.filter(x => String(x.citizenId) !== String(p.citizenId)) }); }}
                                              className="p-0.5 rounded hover:bg-red-900/50 text-stone-500 hover:text-red-400 transition-all">
                                              <X size={11} />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      {/* HP */}
                                      {masked ? (
                                        <div className="flex items-center gap-1.5">
                                          <Heart size={8} className="text-red-400 shrink-0" />
                                          <span className={`text-[9px] font-black px-2 py-0.5 rounded ${hpState.cls}`}>{hpState.label}</span>
                                        </div>
                                      ) : (
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
                                            onClick={e => e.stopPropagation()}
                                            className="w-9 text-[9px] font-mono bg-stone-800 border border-stone-600 rounded px-1 py-0.5 text-center text-stone-100 outline-none focus:border-amber-500" />
                                          <span className="text-[8px] text-stone-400">/{p.maxHp}</span>
                                        </div>
                                      )}
                                      {/* Mana si mage (jamais masqué pour les créatures car elles n'en ont pas) */}
                                      {p.maxMana > 0 && !masked && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <Zap size={8} className="text-blue-400 shrink-0" />
                                          <div className="flex-1 h-1 bg-stone-700 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${p.maxMana > 0 ? Math.max(0, (p.currentMana / p.maxMana) * 100) : 0}%` }} />
                                          </div>
                                          <input type="number" min={0} max={p.maxMana}
                                            value={editMana[String(p.citizenId)] ?? p.currentMana}
                                            onChange={e => setEditMana(prev => ({ ...prev, [String(p.citizenId)]: e.target.value }))}
                                            onBlur={() => applyManaChange(p.citizenId)}
                                            onKeyDown={e => e.key === "Enter" && applyManaChange(p.citizenId)}
                                            onClick={e => e.stopPropagation()}
                                            className="w-9 text-[9px] font-mono bg-stone-800 border border-stone-600 rounded px-1 py-0.5 text-center text-stone-100 outline-none focus:border-blue-500" />
                                          <span className="text-[8px] text-stone-400">/{p.maxMana}</span>
                                        </div>
                                      )}
                                      {/* Malus badges */}
                                      {(p.malus?.length > 0) && !masked && (
                                        <div className="flex items-center gap-1 mt-1">
                                          <span className="text-[7px] font-black text-red-300 bg-red-900/40 px-1.5 py-0.5 rounded">↓ {p.malus.length} malus</span>
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
                          <Users size={13} className="text-stone-600" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-stone-600">Ordre d'initiative · Roll de vitesse (verrouillé une fois saisi)</span>
                        </div>
                        <div className="divide-y divide-stone-200">
                          {sortedParticipants.map((p, idx) => {
                            const isCurrent = selSession.status === "active" && idx === selSession.currentParticipantIndex;
                            const isDead = p.currentHp <= 0;
                            const campStyle = CAMP_STYLES.find(x => x.id === (p.campId || "A")) || CAMP_STYLES[0];
                            const initTotal = p.initiativeRoll ?? 0;
                            const maskedInit = hideCreatureStats && p.isCreature;
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
                                  {p.isCreature && <span className="ml-1 text-[7px] font-black text-red-400">★</span>}
                                </span>
                                {isCurrent && <span className="text-[7px] bg-amber-500 text-stone-900 px-1.5 py-0.5 rounded font-black animate-pulse">SON TOUR</span>}
                                {/* Roll de vitesse — verrouillé une fois saisi */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {p.initiativeRoll !== null && p.initiativeRoll !== undefined ? (
                                    <>
                                      <span className="text-sm font-black text-amber-400 font-mono w-8 text-center">{p.initiativeRoll}</span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); updateParticipant(p.citizenId, { initiativeRoll: null }); }}
                                        title="Réinitialiser le roll"
                                        className="p-0.5 rounded hover:bg-stone-700 text-stone-500 hover:text-amber-400 transition-all text-xs"
                                      >🔓</button>
                                    </>
                                  ) : (
                                    <input type="number" min={0} max={99}
                                      value={editRoll[String(p.citizenId)] ?? ""}
                                      onChange={e => setEditRoll(prev => ({ ...prev, [String(p.citizenId)]: e.target.value }))}
                                      onBlur={() => applyRollChange(p.citizenId)}
                                      onKeyDown={e => e.key === "Enter" && applyRollChange(p.citizenId)}
                                      placeholder="roll"
                                      className="w-14 text-[10px] font-mono bg-white border border-amber-300 rounded px-1 py-0.5 text-center text-stone-700 outline-none focus:border-amber-500" />
                                  )}
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
                      <FileText size={14} className="text-stone-600" />
                      <span className="text-xs font-black uppercase tracking-widest text-stone-800">Journal de combat</span>
                    </div>
                    {selSession.status === "active" && (
                      <div className="px-5 py-3 border-b border-stone-100 bg-stone-50 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] font-black uppercase tracking-widest text-stone-500 block mb-0.5">Acteur</label>
                            <select value={logForm.actor} onChange={e => setLogForm(p => ({ ...p, actor: e.target.value }))}
                              className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-amber-400/30">
                              <option value="">— Choisir —</option>
                              {sortedParticipants.map(p => <option key={p.citizenId} value={p.name}>{p.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase tracking-widest text-stone-500 block mb-0.5">Action</label>
                            <select value={logForm.action} onChange={e => setLogForm(p => ({ ...p, action: e.target.value }))}
                              className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-amber-400/30">
                              {["Attaque", "Technique/Sort", "Défense", "Esquive", "Fuite"].map(a => <option key={a}>{a}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input value={logForm.detail} onChange={e => setLogForm(p => ({ ...p, detail: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && addLogEntry()}
                            className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-amber-400/30"
                            placeholder="Dégâts infligés, roll, effet déclenché…" />
                          <button onClick={addLogEntry}
                            className="px-3 py-1.5 bg-amber-600 text-stone-900 text-[10px] font-black rounded-lg hover:bg-amber-500 transition-all">
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="max-h-56 overflow-y-auto divide-y divide-stone-50">
                      {(selSession.log || []).length === 0 ? (
                        <p className="text-xs text-stone-400 italic text-center p-6">Aucune action enregistrée</p>
                      ) : [...(selSession.log || [])].reverse().map(entry => {
                        const ac = {
                          "Attaque":       "text-red-700 bg-red-50 border-red-200",
                          "Technique/Sort":"text-violet-700 bg-violet-50 border-violet-200",
                          "Défense":       "text-blue-700 bg-blue-50 border-blue-200",
                          "Esquive":       "text-green-700 bg-green-50 border-green-200",
                          "Fuite":         "text-stone-700 bg-stone-100 border-stone-200",
                        }[entry.action] || "text-stone-700 bg-stone-100 border-stone-200";
                        return (
                          <div key={entry.id} className="px-4 py-2 flex items-start gap-3">
                            <span className="text-[8px] font-mono text-stone-500 shrink-0 mt-0.5">T{entry.turn}</span>
                            <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${ac}`}>{entry.action}</span>
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

      {/* ══════════════════ ONGLET EFFETS ══════════════════ */}
      {tab === "effets" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Formulaire création/édition */}
          <div className="md:col-span-1 bg-stone-900 border border-stone-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-stone-700">
              <Zap size={14} className="text-amber-400" />
              <span className="text-xs font-black uppercase tracking-widest text-stone-200">
                {editEffectId ? "Modifier l'effet" : "Nouvel effet"}
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Icône</label>
                  <input value={effectForm.emoji} onChange={e => setEffectForm(p => ({ ...p, emoji: e.target.value }))}
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-2 py-1.5 text-sm text-center text-stone-100 outline-none focus:border-amber-500" />
                </div>
                <div className="col-span-3">
                  <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Nom</label>
                  <input value={effectForm.name} onChange={e => setEffectForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Poison, Brûlure, Terreur…"
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Statistique affectée</label>
                <select value={effectForm.stat} onChange={e => setEffectForm(p => ({ ...p, stat: e.target.value }))}
                  className="w-full bg-stone-800 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500">
                  {EFFECT_STAT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Malus</label>
                  <input type="number" max={0} value={effectForm.value}
                    onChange={e => setEffectForm(p => ({ ...p, value: parseInt(e.target.value) || -1 }))}
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 font-mono outline-none focus:border-red-500 text-center" />
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Tours (0=∞)</label>
                  <input type="number" min={0} value={effectForm.turns}
                    onChange={e => setEffectForm(p => ({ ...p, turns: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 font-mono outline-none focus:border-amber-500 text-center" />
                </div>
              </div>
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 block mb-0.5">Description</label>
                <textarea value={effectForm.description} onChange={e => setEffectForm(p => ({ ...p, description: e.target.value }))}
                  rows={2} placeholder="Description narrative de l'effet…"
                  className="w-full bg-stone-800 border border-stone-600 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500 resize-none" />
              </div>
              <div className="flex gap-2">
                {editEffectId && (
                  <button onClick={() => { setEditEffectId(null); setEffectForm({ name: "", emoji: "⚡", description: "", stat: "attackBase", value: -1, turns: 0 }); }}
                    className="px-3 py-1.5 text-[10px] font-bold text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-700 transition-all">
                    Annuler
                  </button>
                )}
                <button onClick={saveEffect}
                  className="flex-1 px-3 py-1.5 text-[10px] font-black text-stone-900 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all">
                  {editEffectId ? "Modifier" : "Créer l'effet"}
                </button>
              </div>
            </div>
          </div>

          {/* Liste des effets */}
          <div className="md:col-span-2">
            {combatEffects.length === 0 ? (
              <div className="bg-stone-900 border border-stone-700 rounded-2xl p-12 text-center text-stone-500 italic text-sm">
                Aucun effet créé — utilisez le formulaire pour en créer
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {combatEffects.map(effect => {
                  const statLabel = EFFECT_STAT_OPTIONS.find(o => o.key === effect.stat)?.label || effect.stat;
                  const isApplying = applyingEffectId === effect.id;
                  return (
                    <div key={effect.id} className="bg-stone-900 border border-stone-700 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl bg-stone-800 border border-stone-700 shrink-0">
                          {effect.emoji || "⚡"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-black text-stone-100">{effect.name}</div>
                          <div className="text-[8px] text-stone-400 font-mono">
                            {statLabel}: <span className="text-red-400">{effect.value}</span>
                            {" · "}
                            {effect.turns > 0 ? `${effect.turns} tour${effect.turns > 1 ? "s" : ""}` : "Permanent"}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => startEditEffect(effect)}
                            className="p-1.5 rounded hover:bg-stone-700 text-stone-500 hover:text-stone-200 transition-all">
                            <Edit3 size={12} />
                          </button>
                          <button onClick={() => { onDeleteCombatEffect(effect.id); if (editEffectId === effect.id) { setEditEffectId(null); } }}
                            className="p-1.5 rounded hover:bg-red-900/40 text-stone-500 hover:text-red-400 transition-all">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {effect.description && (
                        <div className="px-4 py-2 border-t border-stone-700/50 text-[9px] text-stone-400 italic">
                          {effect.description}
                        </div>
                      )}
                      {/* Appliquer à un participant */}
                      {selSession && selSession.participants.length > 0 && (
                        <div className="px-4 py-2 border-t border-stone-700/50">
                          {isApplying ? (
                            <div className="space-y-1.5">
                              <div className="text-[8px] font-black uppercase text-stone-400">Appliquer à :</div>
                              <div className="flex flex-wrap gap-1">
                                {selSession.participants.map(p => (
                                  <button key={p.citizenId} onClick={() => applyEffect(effect, p.citizenId)}
                                    className="text-[8px] font-bold bg-stone-700 text-stone-200 px-2 py-0.5 rounded hover:bg-red-900/60 hover:text-red-200 transition-all">
                                    {p.name}
                                  </button>
                                ))}
                                <button onClick={() => setApplyingEffectId(null)}
                                  className="text-[8px] text-stone-500 hover:text-stone-300 transition-all px-1">✕</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setApplyingEffectId(effect.id)}
                              className="flex items-center gap-1 text-[8px] font-bold text-stone-500 hover:text-amber-400 transition-all">
                              <Plus size={9} /> Appliquer dans « {selSession.name} »
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── POPUP STATS PARTICIPANT (éditable) ──────────────────── */}
      {statPopup && selSession && (() => {
        const p = (selSession.participants || []).find(x => String(x.citizenId) === statPopup);
        if (!p) return null;

        // Helpers lecture/écriture locale
        const pe = (f) => popupEdits[f] !== undefined ? popupEdits[f] : (p[f] ?? 0);
        const set = (f, v) => setPopupEdits(prev => ({ ...prev, [f]: v }));
        const save = (f, extra = {}) => {
          const raw = popupEdits[f];
          if (raw === undefined) return;
          const val = Math.max(0, parseInt(raw) || 0);
          const updates = { [f]: val, ...extra };
          updateParticipant(p.citizenId, updates);
          setPopupEdits(prev => { const n = { ...prev }; delete n[f]; Object.keys(extra).forEach(k => delete n[k]); return n; });
        };
        // Sauvegarde HP avec cap currentHp ≤ maxHp
        const saveHp = (field) => {
          const rawCur = popupEdits.currentHp !== undefined ? popupEdits.currentHp : p.currentHp;
          const rawMax = popupEdits.maxHp !== undefined ? popupEdits.maxHp : p.maxHp;
          const newMax = Math.max(1, parseInt(rawMax) || 1);
          const newCur = Math.max(0, Math.min(newMax, parseInt(rawCur) || 0));
          updateParticipant(p.citizenId, { currentHp: newCur, maxHp: newMax });
          setPopupEdits(prev => { const n = { ...prev }; delete n.currentHp; delete n.maxHp; return n; });
        };
        const saveMana = () => {
          const rawCur = popupEdits.currentMana !== undefined ? popupEdits.currentMana : p.currentMana;
          const rawMax = popupEdits.maxMana !== undefined ? popupEdits.maxMana : p.maxMana;
          const newMax = Math.max(0, parseInt(rawMax) || 0);
          const newCur = Math.max(0, Math.min(newMax, parseInt(rawCur) || 0));
          updateParticipant(p.citizenId, { currentMana: newCur, maxMana: newMax });
          setPopupEdits(prev => { const n = { ...prev }; delete n.currentMana; delete n.maxMana; return n; });
        };

        const hpPct = p.maxHp > 0 ? Math.max(0, Math.min(100, (p.currentHp / p.maxHp) * 100)) : 0;
        const hpColor = hpPct > 50 ? "bg-green-500" : hpPct > 25 ? "bg-amber-500" : "bg-red-500";
        const manaPct = p.maxMana > 0 ? Math.max(0, Math.min(100, (p.currentMana / p.maxMana) * 100)) : 0;
        const campStyle = CAMP_STYLES.find(x => x.id === (p.campId || "A")) || CAMP_STYLES[0];
        const citizenRecord = safeCitizens.find(c => String(c.id) === p.citizenId);
        const techs = citizenRecord ? (Array.isArray(citizenRecord.techniques) ? citizenRecord.techniques : []) : [];
        const talentPopup = citizenRecord?.talent || null;

        const inputCls = "w-10 text-[10px] font-mono bg-stone-700 border border-stone-600 rounded px-1 py-0.5 text-center text-stone-100 outline-none focus:border-amber-500";

        const statDefs = [
          { label: "Attaque",    icon: "⚔",  base: "attackBase",       bonus: "weaponBonus",       bonusLbl: "Arme"    },
          { label: "Atk. Mag.", icon: "🔮", base: "magicAttackBase",  bonus: "magicAttackBonus",  bonusLbl: "Sort off." },
          { label: "Défense",    icon: "🛡",  base: "defenseBase",      bonus: "armorBonus",        bonusLbl: "Armure"  },
          { label: "Déf. Mag.", icon: "✨",  base: "magicDefenseBase", bonus: "spellBonus",        bonusLbl: "Sort déf." },
        ];

        const closePopup = () => { setStatPopup(null); setPopupEdits({}); };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closePopup}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-sm bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}>

              {/* En-tête */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${campStyle.bg} ${campStyle.border}`}>
                    <Swords size={16} className="text-stone-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-stone-100 truncate">{p.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${campStyle.badge}`}>{campStyle.label}</span>
                      {p.isCreature && <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-red-900/60 text-red-300">Créature</span>}
                      {p.level > 0 && <span className="text-[8px] text-stone-400 font-mono">Niv. {p.level}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={closePopup} className="p-1.5 rounded-lg hover:bg-stone-700 text-stone-500 hover:text-stone-200 transition-all shrink-0">
                  <X size={15} />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">
                {/* ── Barres vitales éditables ── */}
                <div className="space-y-3">
                  {/* PV */}
                  <div className="bg-stone-800/60 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Heart size={11} className="text-red-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Points de Vie</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <input type="number" min={0} value={pe("currentHp")}
                          onChange={e => set("currentHp", e.target.value)}
                          onBlur={saveHp}
                          onKeyDown={e => e.key === "Enter" && saveHp()}
                          className={inputCls} />
                        <span className="text-[9px] text-stone-500">/</span>
                        <input type="number" min={1} value={pe("maxHp")}
                          onChange={e => set("maxHp", e.target.value)}
                          onBlur={saveHp}
                          onKeyDown={e => e.key === "Enter" && saveHp()}
                          className={inputCls} />
                      </div>
                    </div>
                    <div className="h-2 bg-stone-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${hpColor}`} style={{ width: `${hpPct}%` }} />
                    </div>
                  </div>

                  {/* Mana */}
                  <div className="bg-stone-800/60 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Zap size={11} className="text-blue-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Mana</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <input type="number" min={0} value={pe("currentMana")}
                          onChange={e => set("currentMana", e.target.value)}
                          onBlur={saveMana}
                          onKeyDown={e => e.key === "Enter" && saveMana()}
                          className={inputCls} />
                        <span className="text-[9px] text-stone-500">/</span>
                        <input type="number" min={0} value={pe("maxMana")}
                          onChange={e => set("maxMana", e.target.value)}
                          onBlur={saveMana}
                          onKeyDown={e => e.key === "Enter" && saveMana()}
                          className={inputCls} />
                      </div>
                    </div>
                    <div className="h-2 bg-stone-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${manaPct}%` }} />
                    </div>
                  </div>
                </div>

                {/* ── Stats éditables ── */}
                <div className="grid grid-cols-2 gap-2">
                  {statDefs.map(({ label, icon, base, bonus, bonusLbl }) => {
                    const baseVal = parseInt(pe(base)) || 0;
                    const bonusVal = bonus ? (parseInt(pe(bonus)) || 0) : 0;
                    const malusTotal = (p.malus || []).filter(m => m.stat === base || (bonus && m.stat === bonus)).reduce((sum, m) => sum + (m.value || 0), 0);
                    const total = baseVal + bonusVal + malusTotal;
                    return (
                      <div key={label} className={`bg-stone-800 border rounded-xl p-3 ${malusTotal < 0 ? "border-red-800/50" : "border-stone-700/60"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span>{icon}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {malusTotal < 0 && <span className="text-[8px] text-red-400 font-mono">{malusTotal}</span>}
                            <span className={`text-base font-black ${malusTotal < 0 ? "text-red-300" : "text-stone-100"}`}>{total}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1">
                            <div className="text-[7px] text-stone-500 mb-0.5">Base</div>
                            <input type="number" min={0} value={pe(base)}
                              onChange={e => set(base, e.target.value)}
                              onBlur={() => save(base)}
                              onKeyDown={e => e.key === "Enter" && save(base)}
                              className="w-full text-[10px] font-mono bg-stone-700 border border-stone-600 rounded px-1.5 py-1 text-center text-stone-100 outline-none focus:border-amber-500" />
                          </div>
                          {bonus && (
                            <>
                              <span className="text-stone-600 text-xs mt-3">+</span>
                              <div className="flex-1">
                                <div className="text-[7px] text-stone-500 mb-0.5">{bonusLbl}</div>
                                <input type="number" min={0} value={pe(bonus)}
                                  onChange={e => set(bonus, e.target.value)}
                                  onBlur={() => save(bonus)}
                                  onKeyDown={e => e.key === "Enter" && save(bonus)}
                                  className="w-full text-[10px] font-mono bg-stone-700 border border-stone-600 rounded px-1.5 py-1 text-center text-stone-100 outline-none focus:border-amber-500" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Compétences ── */}
                {techs.length > 0 && (
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Compétences</div>
                    <div className="space-y-1.5">
                      {techs.map(tech => {
                        const isSort = tech.type === "sort";
                        return (
                          <div key={tech.id} className="bg-stone-800 border border-stone-700/50 rounded-lg px-3 py-2 flex items-start gap-2.5">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${isSort ? "bg-blue-900/60 text-blue-300" : "bg-red-900/60 text-red-300"}`}>
                              {isSort ? <Zap size={11} /> : <Sword size={11} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-bold text-stone-100 truncate">{tech.name}</div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {tech.bonusDamage > 0 && <span className="text-[8px] font-mono text-amber-400">+{tech.bonusDamage} dég.</span>}
                                {tech.effect && <span className="text-[8px] text-stone-400 truncate">{tech.effect}</span>}
                                {isSort && tech.manaCost > 0 && <span className="text-[8px] font-mono text-blue-400">{tech.manaCost} mana</span>}
                                {!isSort && tech.cooldown > 0 && <span className="text-[8px] font-mono text-stone-500">{tech.cooldown}t cd</span>}
                              </div>
                              {tech.description && <p className="text-[8px] text-stone-500 italic mt-0.5 line-clamp-2">{tech.description}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Talent ── */}
                {talentPopup?.description && (
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Talent</div>
                    <div className="bg-stone-800 border border-amber-700/30 rounded-lg px-3 py-2 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-amber-900/50 text-amber-300 text-xs font-black">✦</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-stone-200 leading-relaxed">{talentPopup.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {talentPopup.chance > 0 && <span className="text-[8px] font-mono text-amber-400">{talentPopup.chance}%</span>}
                          {talentPopup.cooldown > 0 && <span className="text-[8px] font-mono text-stone-500">{talentPopup.cooldown}t cd</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Malus ── */}
                {(() => {
                  const malus = p.malus || [];
                  const addMalus = () => {
                    if (!malusForm.reason.trim()) return;
                    const newMalus = { id: Date.now().toString(), stat: malusForm.stat, value: -Math.abs(malusForm.value || 1), reason: malusForm.reason, turns: Math.max(0, malusForm.turns || 0) };
                    updateParticipant(p.citizenId, { malus: [...malus, newMalus] });
                    setMalusForm(prev => ({ ...prev, reason: "", value: -1, turns: 0 }));
                  };
                  const removeMalus = (id) => updateParticipant(p.citizenId, { malus: malus.filter(m => m.id !== id) });
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-500">Malus</div>
                        {malus.length > 0 && <span className="text-[7px] font-black text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded">{malus.length} actif{malus.length > 1 ? "s" : ""}</span>}
                      </div>
                      {malus.length > 0 && (
                        <div className="space-y-1 mb-3">
                          {malus.map(m => {
                            const statLabel = EFFECT_STAT_OPTIONS.find(o => o.key === m.stat)?.label || m.stat;
                            return (
                              <div key={m.id} className="bg-stone-800 border border-red-800/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <span className="text-[9px] font-bold text-red-300">{statLabel}: {m.value}</span>
                                  <span className="text-[7px] font-mono text-stone-500 ml-1.5">{m.turns > 0 ? `${m.turns}t` : "∞"}</span>
                                  {m.reason && <span className="text-[8px] text-stone-400 ml-1.5 italic truncate">{m.reason}</span>}
                                </div>
                                <button onClick={() => removeMalus(m.id)} className="p-0.5 rounded hover:bg-red-900/40 text-stone-500 hover:text-red-400 transition-all shrink-0">
                                  <X size={10} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="bg-stone-800/60 border border-stone-700 rounded-xl p-3 space-y-2">
                        <div className="text-[7px] font-black uppercase tracking-widest text-stone-500">Ajouter un malus</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1">
                            <label className="text-[7px] text-stone-500 block mb-0.5">Statistique</label>
                            <select value={malusForm.stat}
                              onChange={e => setMalusForm(prev => ({ ...prev, stat: e.target.value }))}
                              className="w-full bg-stone-700 border border-stone-600 rounded px-1.5 py-1 text-[9px] text-stone-100 outline-none focus:border-red-500">
                              {EFFECT_STAT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[7px] text-stone-500 block mb-0.5">Valeur (négatif)</label>
                            <input type="number" max={0}
                              value={malusForm.value}
                              onChange={e => setMalusForm(prev => ({ ...prev, value: parseInt(e.target.value) || -1 }))}
                              className="w-full bg-stone-700 border border-stone-600 rounded px-1.5 py-1 text-[9px] text-stone-100 font-mono outline-none focus:border-red-500 text-center" />
                          </div>
                          <div>
                            <label className="text-[7px] text-stone-500 block mb-0.5">Tours (0=∞)</label>
                            <input type="number" min={0}
                              value={malusForm.turns}
                              onChange={e => setMalusForm(prev => ({ ...prev, turns: parseInt(e.target.value) || 0 }))}
                              className="w-full bg-stone-700 border border-stone-600 rounded px-1.5 py-1 text-[9px] text-stone-100 font-mono outline-none focus:border-red-500 text-center" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[7px] text-stone-500 block mb-0.5">Raison</label>
                          <input value={malusForm.reason}
                            onChange={e => setMalusForm(prev => ({ ...prev, reason: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && addMalus()}
                            placeholder="Blessure, poison, malédiction…"
                            className="w-full bg-stone-700 border border-stone-600 rounded px-1.5 py-1 text-[9px] text-stone-100 outline-none focus:border-red-500" />
                        </div>
                        <button onClick={addMalus}
                          disabled={!malusForm.reason.trim()}
                          className="w-full py-1 bg-red-800 hover:bg-red-700 disabled:opacity-40 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1">
                          <Plus size={9} /> Appliquer
                        </button>
                      </div>
                      {/* Appliquer depuis un modèle d'effet */}
                      {combatEffects.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          <div className="text-[7px] font-black uppercase tracking-widest text-stone-600 text-center">— ou depuis un effet —</div>
                          <div className="flex flex-wrap gap-1">
                            {combatEffects.map(eff => (
                              <button key={eff.id} onClick={() => {
                                const newMalus = { id: Date.now().toString(), stat: eff.stat, value: eff.value, reason: eff.name, turns: eff.turns || 0 };
                                updateParticipant(p.citizenId, { malus: [...(p.malus || []), newMalus] });
                                notify(`${eff.emoji || ""} ${eff.name} appliqué.`, "success");
                              }}
                                className="flex items-center gap-1 text-[8px] font-bold bg-stone-700 hover:bg-red-900/50 text-stone-200 hover:text-red-200 px-2 py-0.5 rounded transition-all">
                                {eff.emoji} {eff.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
