import React, { useState, useMemo } from "react";
import {
  Swords, Sword, Shield, Zap, Heart, Plus, Trash2, Edit3, X,
  SkipForward, FileText, Save, RefreshCw, Search,
} from "lucide-react";

/* ─── UTILITAIRES ─────────────────────────────────────────────── */

const DEFAULT_COMBAT_STATS = {
  maxHp: 30, currentHp: 30,
  defense: 0, magicDefense: 0,
  attack: 0, speed: 0,
  maxMana: 10, currentMana: 10,
  class: "guerrier", level: 1,
};

const DEFAULT_TECH = {
  name: "", type: "technique",
  bonusDamage: 0, effect: "", effectChance: 100,
  cooldown: 2, manaCost: 0, description: "",
};

const StatNum = ({ label, value, onChange, min = 0, max = 9999 }) => (
  <div>
    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">{label}</label>
    <input type="number" min={min} max={max} value={value}
      onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 font-mono outline-none focus:border-amber-600/60 transition-colors"
    />
  </div>
);

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
  const [logForm, setLogForm] = useState({ actor: "", action: "Attaque", detail: "" });
  const [editHp, setEditHp] = useState({});
  const [editMana, setEditMana] = useState({});

  const safeCitizens = Array.isArray(citizens) ? citizens : [];
  const safeSessions = Array.isArray(combatSessions) ? combatSessions : [];

  /* ══════════════════════ FICHES LOGIQUE ══════════════════════ */

  const filteredCitizens = safeCitizens.filter(c =>
    !citizenSearch || c.name?.toLowerCase().includes(citizenSearch.toLowerCase())
  );

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

  const sortedParticipants = useMemo(() => {
    if (!selSession) return [];
    return [...selSession.participants].sort((a, b) =>
      b.speed !== a.speed ? b.speed - a.speed : (b.initiativeRoll || 0) - (a.initiativeRoll || 0)
    );
  }, [selSession]);

  const handleCreateSession = () => {
    if (!newSessionName.trim()) { notify("Nom requis.", "error"); return; }
    const s = { id: Date.now().toString(), name: newSessionName.trim(), status: "pending", createdAt: Date.now(), currentParticipantIndex: 0, turnNumber: 1, participants: [], log: [] };
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
    const stats = { ...DEFAULT_COMBAT_STATS, ...(c.combatStats || {}) };
    onUpdateCombatSession(selSession.id, {
      participants: [...selSession.participants, {
        citizenId: c.id, name: c.name,
        class: stats.class, level: stats.level || 1,
        maxHp: stats.maxHp, currentHp: stats.currentHp,
        defense: stats.defense, magicDefense: stats.magicDefense,
        attack: stats.attack, speed: stats.speed,
        maxMana: stats.maxMana, currentMana: stats.currentMana,
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

  const applyHpChange = (citizenId) => {
    const val = editHp[String(citizenId)];
    if (val === undefined || val === "") return;
    const p = selSession.participants.find(x => String(x.citizenId) === String(citizenId));
    if (!p) return;
    updateParticipant(citizenId, { currentHp: Math.max(0, Math.min(p.maxHp, Number(val))) });
    setEditHp(prev => { const n = { ...prev }; delete n[String(citizenId)]; return n; });
  };

  const applyManaChange = (citizenId) => {
    const val = editMana[String(citizenId)];
    if (val === undefined || val === "") return;
    const p = selSession.participants.find(x => String(x.citizenId) === String(citizenId));
    if (!p) return;
    updateParticipant(citizenId, { currentMana: Math.max(0, Math.min(p.maxMana, Number(val))) });
    setEditMana(prev => { const n = { ...prev }; delete n[String(citizenId)]; return n; });
  };

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
          { id: "fiches", label: "Fiches de Combat" },
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
                  placeholder="Rechercher…" />
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-22rem)]">
              {filteredCitizens.length === 0 ? (
                <p className="text-xs text-stone-400 text-center p-6 italic">Aucun résultat</p>
              ) : filteredCitizens.map(c => {
                const hasFiche = !!c.combatStats;
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
                      <div className="text-[9px] text-stone-400 uppercase">{c.role || "Citoyen"}</div>
                    </div>
                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${hasFiche ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-400"}`}>
                      {hasFiche ? "Fiche" : "—"}
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
            ) : editStats && (
              <>
                {/* Stats de base */}
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
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Classe</label>
                        <select value={editStats.class} onChange={e => setEditStats(p => ({ ...p, class: e.target.value }))}
                          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-600/60">
                          <option value="guerrier">Guerrier</option>
                          <option value="mage">Mage</option>
                        </select>
                      </div>
                      <StatNum label="Niveau" value={editStats.level} onChange={sc("level")} min={1} max={99} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <StatNum label="PV Maximum" value={editStats.maxHp} onChange={sc("maxHp")} min={1} />
                      <StatNum label="Défense" value={editStats.defense} onChange={sc("defense")} />
                      <StatNum label="Déf. Magique" value={editStats.magicDefense} onChange={sc("magicDefense")} />
                      <StatNum label="Attaque" value={editStats.attack} onChange={sc("attack")} />
                      <StatNum label="Vitesse" value={editStats.speed} onChange={sc("speed")} />
                      <StatNum label="Mana Maximum" value={editStats.maxMana} onChange={sc("maxMana")} />
                    </div>
                  </div>
                </div>

                {/* Techniques */}
                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-amber-500" />
                      <span className="text-xs font-black uppercase tracking-widest text-stone-800">
                        Compétences ({editTechs.length})
                      </span>
                    </div>
                    {!techForm && (
                      <button
                        onClick={() => { setTechForm({ ...DEFAULT_TECH, type: editStats.class === "mage" ? "sort" : "technique" }); setTechEditId(null); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg transition-all"
                      >
                        <Plus size={11} /> Ajouter
                      </button>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Formulaire technique */}
                    {techForm && (
                      <div className="bg-stone-900 rounded-xl border border-stone-700 p-4 space-y-3">
                        <div className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                          {techEditId ? "Modifier" : "Nouvelle compétence"}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2">
                            <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Nom</label>
                            <input value={techForm.name} onChange={e => setTechForm(p => ({ ...p, name: e.target.value }))}
                              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-600/60"
                              placeholder="Nom de la compétence" />
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
                            <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Effet (description)</label>
                            <input value={techForm.effect} onChange={e => setTechForm(p => ({ ...p, effect: e.target.value }))}
                              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-600/60"
                              placeholder="Ex: Ralentit la cible" />
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Chance d'effet (%)</label>
                            <input type="number" min={0} max={100} value={techForm.effectChance} onChange={e => setTechForm(p => ({ ...p, effectChance: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-600/60" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">Description narrative</label>
                            <textarea value={techForm.description} onChange={e => setTechForm(p => ({ ...p, description: e.target.value }))} rows={2}
                              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-600/60 resize-none"
                              placeholder="Décrivez la compétence…" />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => { setTechForm(null); setTechEditId(null); }} className="px-3 py-1.5 text-[10px] font-bold text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition-all">Annuler</button>
                          <button onClick={saveTech} className="px-3 py-1.5 text-[10px] font-black text-stone-900 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all">
                            {techEditId ? "Modifier" : "Ajouter"}
                          </button>
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
                          {tech.description && <p className="text-[10px] text-stone-400 mt-0.5 italic">{tech.description}</p>}
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
            )}
          </div>
        </div>
      )}

      {/* ══════════════════ ONGLET COMBATS ══════════════════ */}
      {tab === "combats" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Colonne gauche */}
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

          {/* Colonne droite */}
          <div className="md:col-span-2 space-y-4">
            {!selSession ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-400 italic text-sm shadow-sm">
                Sélectionner ou créer une session de combat
              </div>
            ) : (
              <>
                {/* Header session */}
                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
                    <div>
                      <h2 className="text-sm font-black uppercase text-stone-900">{selSession.name}</h2>
                      <p className="text-[9px] text-stone-400">
                        {selSession.status === "active" ? `Tour ${selSession.turnNumber} · ` : ""}
                        {selSession.participants.length} combattant{selSession.participants.length !== 1 ? "s" : ""}
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
                    <div className="px-5 py-3 bg-stone-50 border-b border-stone-100">
                      <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-2">Ajouter un combattant</p>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={12} />
                        <input value={participantSearch} onChange={e => setParticipantSearch(e.target.value)}
                          className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400/30"
                          placeholder="Chercher un citoyen…" />
                      </div>
                      {participantSearch && (
                        <div className="mt-1 bg-white border border-stone-200 rounded-lg overflow-hidden max-h-32 overflow-y-auto shadow-lg">
                          {safeCitizens
                            .filter(c => c.name?.toLowerCase().includes(participantSearch.toLowerCase()) && !selSession.participants.some(p => String(p.citizenId) === String(c.id)))
                            .slice(0, 8).map(c => (
                              <button key={c.id} onClick={() => addParticipant(c.id)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 flex items-center gap-2 border-b border-stone-50 transition-colors">
                                <span className="w-5 h-5 rounded-full bg-stone-700 text-white text-[9px] flex items-center justify-center font-black shrink-0">{c.name?.[0]?.toUpperCase()}</span>
                                <span className="font-semibold text-stone-800">{c.name}</span>
                                {!c.combatStats && <span className="text-[8px] text-amber-500 ml-auto font-bold">Sans fiche</span>}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Participants */}
                  <div className="p-4 space-y-2">
                    {sortedParticipants.length === 0 ? (
                      <p className="text-xs text-stone-400 italic text-center py-4">Aucun combattant ajouté</p>
                    ) : sortedParticipants.map((p, idx) => {
                      const isCurrent = selSession.status === "active" && idx === selSession.currentParticipantIndex;
                      const hpPct = p.maxHp > 0 ? Math.max(0, (p.currentHp / p.maxHp) * 100) : 0;
                      const manaPct = p.maxMana > 0 ? Math.max(0, (p.currentMana / p.maxMana) * 100) : 0;
                      const hpColor = hpPct > 50 ? "bg-green-500" : hpPct > 25 ? "bg-amber-500" : "bg-red-500";
                      const isDead = p.currentHp <= 0;
                      return (
                        <div key={p.citizenId}
                          className={`rounded-xl border transition-all ${isCurrent ? "border-amber-400 bg-amber-50 shadow-md" : isDead ? "border-stone-200 bg-stone-50 opacity-50" : "border-stone-200 bg-white"}`}
                        >
                          <div className="flex items-center gap-3 px-4 py-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isCurrent ? "bg-amber-500 text-stone-900" : "bg-stone-700 text-stone-300"}`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className={`text-sm font-black ${isDead ? "line-through text-stone-400" : "text-stone-900"}`}>{p.name}</span>
                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${p.class === "mage" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>{p.class}</span>
                                <span className="text-[7px] text-stone-400">Niv.{p.level} · VIT {p.speed} · ATK {p.attack}</span>
                                {p.initiativeRoll !== null && <span className="text-[7px] bg-stone-200 text-stone-600 px-1 rounded font-mono">d20:{p.initiativeRoll}</span>}
                                {isCurrent && <span className="text-[7px] bg-amber-500 text-stone-900 px-1.5 py-0.5 rounded font-black animate-pulse">→ SON TOUR</span>}
                              </div>
                              {/* Barre HP */}
                              <div className="flex items-center gap-2">
                                <Heart size={9} className="text-red-400 shrink-0" />
                                <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${hpColor}`} style={{ width: `${hpPct}%` }} />
                                </div>
                                <input type="number" min={0} max={p.maxHp}
                                  value={editHp[String(p.citizenId)] ?? p.currentHp}
                                  onChange={e => setEditHp(prev => ({ ...prev, [String(p.citizenId)]: e.target.value }))}
                                  onBlur={() => applyHpChange(p.citizenId)}
                                  onKeyDown={e => e.key === "Enter" && applyHpChange(p.citizenId)}
                                  className="w-10 text-[10px] font-mono bg-white border border-stone-300 rounded px-1 py-0.5 text-center outline-none focus:border-amber-500" />
                                <span className="text-[9px] text-stone-400 shrink-0">/{p.maxHp}</span>
                              </div>
                              {/* Barre Mana (mage) */}
                              {p.class === "mage" && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Zap size={9} className="text-blue-400 shrink-0" />
                                  <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all bg-blue-500" style={{ width: `${manaPct}%` }} />
                                  </div>
                                  <input type="number" min={0} max={p.maxMana}
                                    value={editMana[String(p.citizenId)] ?? p.currentMana}
                                    onChange={e => setEditMana(prev => ({ ...prev, [String(p.citizenId)]: e.target.value }))}
                                    onBlur={() => applyManaChange(p.citizenId)}
                                    onKeyDown={e => e.key === "Enter" && applyManaChange(p.citizenId)}
                                    className="w-10 text-[10px] font-mono bg-white border border-stone-300 rounded px-1 py-0.5 text-center outline-none focus:border-blue-500" />
                                  <span className="text-[9px] text-stone-400 shrink-0">/{p.maxMana}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {selSession.status === "pending" && (
                                <button
                                  onClick={() => { const r = Math.floor(Math.random() * 20) + 1; updateParticipant(p.citizenId, { initiativeRoll: r }); }}
                                  title="Lancer d20 pour l'initiative"
                                  className="px-1.5 py-1 rounded text-[8px] font-black text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-all border border-stone-200"
                                >
                                  d20
                                </button>
                              )}
                              {selSession.status !== "ended" && (
                                <button onClick={() => onUpdateCombatSession(selSession.id, { participants: selSession.participants.filter(x => String(x.citizenId) !== String(p.citizenId)) })}
                                  className="p-1.5 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 transition-all">
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                            placeholder="Détail de l'action (dégâts, roll, etc.)…" />
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
