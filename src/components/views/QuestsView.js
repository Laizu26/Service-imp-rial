import React, { useState, useMemo } from "react";
import {
  Scroll,
  Plus,
  X,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit3,
  Star,
  Sword,
  Sun,
  Zap,
  Users,
  Coins,
  Flag,
  AlertTriangle,
} from "lucide-react";
import Card from "../ui/Card";

// --- CONSTANTES ---
const QUEST_TYPES = [
  { id: "Principale", label: "Principale", icon: Star, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { id: "Secondaire", label: "Secondaire", icon: Sword, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "Quotidienne", label: "Quotidienne", icon: Sun, color: "text-green-600 bg-green-50 border-green-200" },
  { id: "Événement", label: "Événement", icon: Zap, color: "text-purple-600 bg-purple-50 border-purple-200" },
];

const QUEST_STATUSES = [
  { id: "Brouillon", label: "Brouillon", color: "text-stone-500 bg-stone-100 border-stone-300" },
  { id: "Active", label: "Active", color: "text-emerald-700 bg-emerald-50 border-emerald-300" },
  { id: "Complétée", label: "Complétée", color: "text-sky-700 bg-sky-50 border-sky-300" },
  { id: "Échouée", label: "Échouée", color: "text-red-600 bg-red-50 border-red-300" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  type: "Secondaire",
  status: "Brouillon",
  objectives: [],
  reward: { gold: 0, description: "" },
  assignedCitizens: [],
  countryId: "",
};

// --- SOUS-COMPOSANTS ---
const TypeBadge = ({ type }) => {
  const t = QUEST_TYPES.find((x) => x.id === type) || QUEST_TYPES[1];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${t.color}`}>
      <t.icon size={10} /> {t.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const s = QUEST_STATUSES.find((x) => x.id === status) || QUEST_STATUSES[0];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${s.color}`}>
      {s.label}
    </span>
  );
};

// --- FORMULAIRE DE CRÉATION / ÉDITION ---
const QuestForm = ({ initial, citizens, countries, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [newObjective, setNewObjective] = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addObjective = () => {
    if (!newObjective.trim()) return;
    set("objectives", [
      ...form.objectives,
      { id: Date.now(), text: newObjective.trim(), done: false },
    ]);
    setNewObjective("");
  };

  const removeObjective = (id) =>
    set("objectives", form.objectives.filter((o) => o.id !== id));

  const toggleCitizen = (citizenId) => {
    const current = form.assignedCitizens || [];
    set(
      "assignedCitizens",
      current.includes(citizenId)
        ? current.filter((id) => id !== citizenId)
        : [...current, citizenId]
    );
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <div className="space-y-5">
      {/* Titre */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">
          Titre *
        </label>
        <input
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50"
          placeholder="Nom de la quête..."
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </div>

      {/* Type & Statut */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">
            Type
          </label>
          <select
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50"
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
          >
            {QUEST_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">
            Statut
          </label>
          <select
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {QUEST_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pays */}
      {countries && countries.length > 0 && (
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">
            Pays concerné (optionnel)
          </label>
          <select
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50"
            value={form.countryId}
            onChange={(e) => set("countryId", e.target.value)}
          >
            <option value="">— Tous les pays —</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">
          Description
        </label>
        <textarea
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50 resize-none"
          rows={4}
          placeholder="Décrivez la quête, son contexte, ses enjeux..."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      {/* Objectifs */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
          Objectifs
        </label>
        <div className="space-y-2 mb-2">
          {form.objectives.map((obj) => (
            <div key={obj.id} className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
              <Circle size={14} className="text-stone-400 shrink-0" />
              <span className="text-sm flex-1">{obj.text}</span>
              <button
                onClick={() => removeObjective(obj.id)}
                className="text-stone-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50"
            placeholder="Ajouter un objectif..."
            value={newObjective}
            onChange={(e) => setNewObjective(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addObjective()}
          />
          <button
            onClick={addObjective}
            className="px-3 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors text-sm font-bold"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Récompense */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
          Récompense
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <label className="block text-[9px] text-stone-400 mb-1 uppercase tracking-wide">Or (Écus)</label>
            <div className="relative">
              <Coins size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-yellow-500" />
              <input
                type="number"
                min="0"
                className="w-full border border-stone-300 rounded-lg pl-7 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50"
                value={form.reward.gold}
                onChange={(e) =>
                  set("reward", { ...form.reward, gold: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-[9px] text-stone-400 mb-1 uppercase tracking-wide">Autres récompenses</label>
            <input
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50"
              placeholder="Objets, titres, terres..."
              value={form.reward.description}
              onChange={(e) =>
                set("reward", { ...form.reward, description: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Citoyens assignés */}
      {citizens && citizens.length > 0 && (
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
            Citoyens assignés
          </label>
          <div className="max-h-36 overflow-y-auto border border-stone-200 rounded-lg divide-y divide-stone-100">
            {citizens.map((c) => {
              const assigned = (form.assignedCitizens || []).includes(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                    assigned ? "bg-stone-100" : "hover:bg-stone-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={assigned}
                    onChange={() => toggleCitizen(c.id)}
                    className="accent-stone-800"
                  />
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className="text-xs text-stone-400 ml-auto">{c.role}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Boutons */}
      <div className="flex justify-end gap-3 pt-2 border-t border-stone-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-bold text-stone-600 hover:text-stone-900 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={!form.title.trim()}
          className="px-5 py-2 text-sm font-bold bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Sauvegarder
        </button>
      </div>
    </div>
  );
};

// --- DÉTAIL D'UNE QUÊTE ---
const QuestDetail = ({ quest, citizens, onToggleObjective, onEdit, onDelete, onStatusChange }) => {
  const assignedCitizens = (citizens || []).filter((c) =>
    (quest.assignedCitizens || []).includes(c.id)
  );
  const progress =
    quest.objectives.length > 0
      ? Math.round(
          (quest.objectives.filter((o) => o.done).length / quest.objectives.length) * 100
        )
      : 0;

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-stone-900 font-serif leading-tight mb-2">
            {quest.title}
          </h2>
          <div className="flex flex-wrap gap-2">
            <TypeBadge type={quest.type} />
            <StatusBadge status={quest.status} />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onEdit}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
            title="Modifier"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Changement de statut rapide */}
      <div className="flex flex-wrap gap-2">
        {QUEST_STATUSES.map((s) => (
          <button
            key={s.id}
            onClick={() => onStatusChange(s.id)}
            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
              quest.status === s.id
                ? "ring-2 ring-stone-800 " + s.color
                : "border-stone-200 text-stone-400 hover:border-stone-400"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Description */}
      {quest.description && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
          <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
            {quest.description}
          </p>
        </div>
      )}

      {/* Objectifs */}
      {quest.objectives.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
              Objectifs
            </span>
            <span className="text-xs font-bold text-stone-600">
              {quest.objectives.filter((o) => o.done).length}/{quest.objectives.length} — {progress}%
            </span>
          </div>
          {/* Barre de progression */}
          <div className="h-1.5 bg-stone-200 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="space-y-2">
            {quest.objectives.map((obj) => (
              <button
                key={obj.id}
                onClick={() => onToggleObjective(obj.id)}
                className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg border transition-all ${
                  obj.done
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-white border-stone-200 text-stone-700 hover:border-stone-400"
                }`}
              >
                {obj.done ? (
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                ) : (
                  <Circle size={16} className="text-stone-300 shrink-0" />
                )}
                <span className={`text-sm ${obj.done ? "line-through opacity-70" : ""}`}>
                  {obj.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Récompense */}
      {(quest.reward?.gold > 0 || quest.reward?.description) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-700 mb-2">
            Récompense
          </div>
          {quest.reward.gold > 0 && (
            <div className="flex items-center gap-2 text-sm font-bold text-yellow-800 mb-1">
              <Coins size={14} /> {quest.reward.gold} Écus
            </div>
          )}
          {quest.reward.description && (
            <p className="text-sm text-yellow-700">{quest.reward.description}</p>
          )}
        </div>
      )}

      {/* Citoyens assignés */}
      {assignedCitizens.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
            Citoyens assignés
          </div>
          <div className="flex flex-wrap gap-2">
            {assignedCitizens.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-stone-100 border border-stone-200 text-stone-700 px-2.5 py-1 rounded-full"
              >
                <Users size={11} /> {c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pays */}
      {quest.countryId && (
        <div className="text-xs text-stone-400 flex items-center gap-1.5">
          <Flag size={11} /> Lié à {quest.countryId}
        </div>
      )}
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---
const QuestsView = ({ quests = [], citizens = [], countries = [], onUpdate }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const selectedQuest = quests.find((q) => q.id === selectedId);

  const filteredQuests = useMemo(() => {
    return quests.filter((q) => {
      if (filterStatus !== "all" && q.status !== filterStatus) return false;
      if (filterType !== "all" && q.type !== filterType) return false;
      return true;
    });
  }, [quests, filterStatus, filterType]);

  // Statistiques
  const stats = useMemo(() => ({
    total: quests.length,
    active: quests.filter((q) => q.status === "Active").length,
    completed: quests.filter((q) => q.status === "Complétée").length,
    draft: quests.filter((q) => q.status === "Brouillon").length,
  }), [quests]);

  const handleCreate = (formData) => {
    const newQuest = {
      ...formData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    onUpdate([...quests, newQuest]);
    setIsCreating(false);
    setSelectedId(newQuest.id);
  };

  const handleEdit = (formData) => {
    onUpdate(quests.map((q) => (q.id === selectedId ? { ...q, ...formData } : q)));
    setIsEditing(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Supprimer cette quête ?")) return;
    onUpdate(quests.filter((q) => q.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleToggleObjective = (objectiveId) => {
    onUpdate(
      quests.map((q) =>
        q.id === selectedId
          ? {
              ...q,
              objectives: q.objectives.map((o) =>
                o.id === objectiveId ? { ...o, done: !o.done } : o
              ),
            }
          : q
      )
    );
  };

  const handleStatusChange = (newStatus) => {
    onUpdate(
      quests.map((q) => (q.id === selectedId ? { ...q, status: newStatus } : q))
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-stone-800 font-serif flex items-center gap-3">
            <Scroll size={24} className="text-stone-500" />
            Livre des Quêtes
          </h1>
          <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest">
            Gestion des missions impériales
          </p>
        </div>
        <button
          onClick={() => { setIsCreating(true); setIsEditing(false); setSelectedId(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors text-xs font-bold uppercase tracking-widest shadow-md"
        >
          <Plus size={16} /> Nouvelle quête
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-stone-700 bg-white" },
          { label: "Actives", value: stats.active, color: "text-emerald-700 bg-emerald-50" },
          { label: "Complétées", value: stats.completed, color: "text-sky-700 bg-sky-50" },
          { label: "Brouillons", value: stats.draft, color: "text-stone-500 bg-stone-100" },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl border border-stone-200 p-4 text-center shadow-sm`}>
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Corps principal */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Panneau gauche : liste des quêtes */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filtres */}
          <div className="flex flex-wrap gap-2">
            <select
              className="text-[10px] font-bold uppercase tracking-wider border border-stone-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              {QUEST_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <select
              className="text-[10px] font-bold uppercase tracking-wider border border-stone-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              {QUEST_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Liste */}
          {filteredQuests.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <Scroll size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold uppercase tracking-widest">Aucune quête</p>
              <p className="text-xs mt-1">Créez votre première mission</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredQuests.map((quest) => {
                const progress =
                  quest.objectives.length > 0
                    ? Math.round(
                        (quest.objectives.filter((o) => o.done).length /
                          quest.objectives.length) *
                          100
                      )
                    : null;
                return (
                  <button
                    key={quest.id}
                    onClick={() => { setSelectedId(quest.id); setIsCreating(false); setIsEditing(false); }}
                    className={`w-full text-left p-4 rounded-xl border transition-all shadow-sm ${
                      selectedId === quest.id
                        ? "border-stone-800 bg-stone-800 text-white shadow-md"
                        : "border-stone-200 bg-white hover:border-stone-400 hover:shadow"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`font-bold text-sm leading-tight ${selectedId === quest.id ? "text-white" : "text-stone-800"}`}>
                        {quest.title}
                      </span>
                      <ChevronRight size={14} className={`shrink-0 mt-0.5 ${selectedId === quest.id ? "text-stone-300" : "text-stone-400"}`} />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <TypeBadge type={quest.type} />
                      <StatusBadge status={quest.status} />
                    </div>
                    {progress !== null && (
                      <div className="mt-2">
                        <div className={`h-1 rounded-full ${selectedId === quest.id ? "bg-stone-600" : "bg-stone-200"}`}>
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className={`text-[10px] mt-0.5 ${selectedId === quest.id ? "text-stone-400" : "text-stone-400"}`}>
                          {progress}%
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Panneau droit : détail ou formulaire */}
        <div className="lg:col-span-3">
          <Card>
            {isCreating ? (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <Plus size={16} className="text-stone-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-stone-700">
                    Nouvelle quête
                  </h3>
                </div>
                <QuestForm
                  initial={EMPTY_FORM}
                  citizens={citizens}
                  countries={countries}
                  onSave={handleCreate}
                  onCancel={() => setIsCreating(false)}
                />
              </div>
            ) : isEditing && selectedQuest ? (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <Edit3 size={16} className="text-stone-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-stone-700">
                    Modifier la quête
                  </h3>
                </div>
                <QuestForm
                  initial={selectedQuest}
                  citizens={citizens}
                  countries={countries}
                  onSave={handleEdit}
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            ) : selectedQuest ? (
              <QuestDetail
                quest={selectedQuest}
                citizens={citizens}
                onToggleObjective={handleToggleObjective}
                onEdit={() => setIsEditing(true)}
                onDelete={() => handleDelete(selectedQuest.id)}
                onStatusChange={handleStatusChange}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-stone-300">
                <Scroll size={48} className="mb-4 opacity-40" />
                <p className="text-sm font-bold uppercase tracking-widest">
                  Sélectionnez une quête
                </p>
                <p className="text-xs mt-2 text-stone-400">
                  ou créez-en une nouvelle
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuestsView;
