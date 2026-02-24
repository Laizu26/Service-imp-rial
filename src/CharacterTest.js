/**
 * CharacterTest.js
 * Version d'essai autonome — Mécanique de gestion du personnage
 * Pas de Firebase, pas d'auth. Données locales uniquement.
 */

import React, { useState } from "react";
import {
  Shield,
  User,
  Plus,
  Scroll,
  Coins,
  BookOpen,
  Lock,
  ImageIcon,
  MapPin,
  Flag,
  Trash2,
  Check,
  X,
  UserCircle,
} from "lucide-react";

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const ROLES = {
  EMPEREUR: { label: "Grand Empereur", level: 100, scope: "GLOBAL" },
  GRAND_FONC_GLOBAL: {
    label: "Grand Fonctionnaire (Empire)",
    level: 90,
    scope: "GLOBAL",
  },
  ROI: { label: "Roi (Local)", level: 50, scope: "LOCAL" },
  INTENDANT: { label: "Intendant", level: 45, scope: "LOCAL" },
  GRAND_FONC_LOCAL: {
    label: "Grand Fonctionnaire (Pays)",
    level: 40,
    scope: "LOCAL",
  },
  FONCTIONNAIRE: { label: "Fonctionnaire", level: 30, scope: "LOCAL" },
  POSTIERE: { label: "Postière", level: 20, scope: "LOCAL" },
  CITOYEN: { label: "Citoyen", level: 0, scope: "NONE" },
};

const BASE_STATUSES = ["Actif", "Malade", "Prisonnier", "Banni", "Décédé", "Esclave"];

// ─── DONNÉES DE TEST ──────────────────────────────────────────────────────────

const MOCK_COUNTRIES = [
  {
    id: "C1",
    name: "Empire Central",
    regions: [
      { id: "r1", name: "Capitale" },
      { id: "r2", name: "Plaines du Nord" },
      { id: "r3", name: "Quartier des Marchands" },
    ],
    customRoles: [],
  },
  {
    id: "C2",
    name: "Royaume de Vael",
    regions: [
      { id: "r4", name: "Port-Royal" },
      { id: "r5", name: "Forêt des Anciens" },
      { id: "r6", name: "Citadelle" },
    ],
    customRoles: [
      { id: "cr1", name: "Chevalier du Roi", type: "ROLE", level: 35 },
      { id: "cr2", name: "Exilé Maudit", type: "STATUS" },
    ],
  },
  {
    id: "C3",
    name: "Sultanat de Qarim",
    regions: [
      { id: "r7", name: "Médina" },
      { id: "r8", name: "Désert du Sel" },
      { id: "r9", name: "Palais de Jade" },
    ],
    customRoles: [],
  },
];

const INITIAL_CITIZENS = [
  {
    id: "EMP-0001",
    name: "Aurelius Magnus",
    age: 45,
    balance: 15000,
    role: "EMPEREUR",
    countryId: "C1",
    status: "Actif",
    occupation: "Grand Empereur",
    bio: "Souverain absolu de l'Empire, régent de toutes les nations vassales. Son règne est synonyme de stabilité et de grandeur impériale.",
    avatarUrl: "",
    password: "empire123",
    inventory: [],
    currentPosition: "Capitale",
    ownerId: null,
  },
  {
    id: "EMP-0042",
    name: "Mira de Valois",
    age: 28,
    balance: 3200,
    role: "FONCTIONNAIRE",
    countryId: "C1",
    status: "Actif",
    occupation: "Scribe Impérial",
    bio: "Gardienne des archives et des décrets. Maître de plume au service de l'administration centrale.",
    avatarUrl: "",
    password: "scribe456",
    inventory: [],
    currentPosition: "Capitale",
    ownerId: null,
  },
  {
    id: "EMP-0108",
    name: "Dorian Vael",
    age: 35,
    balance: 8750,
    role: "ROI",
    countryId: "C2",
    status: "Actif",
    occupation: "Roi de Vael",
    bio: "Souverain du Royaume de Vael, gardien des côtes occidentales de l'Empire.",
    avatarUrl: "",
    password: "roi789",
    inventory: [],
    currentPosition: "Citadelle",
    ownerId: null,
  },
  {
    id: "EMP-0213",
    name: "Selin Kara",
    age: 22,
    balance: 150,
    role: "CITOYEN",
    countryId: "C2",
    status: "Esclave",
    occupation: "Domestique",
    bio: "Servante capturée lors des guerres frontalières. Propriété de la couronne vaéloise.",
    avatarUrl: "",
    password: "selin001",
    inventory: [],
    currentPosition: "Port-Royal",
    ownerId: "EMP-0108",
  },
];

// ─── COMPOSANTS UI ────────────────────────────────────────────────────────────

const Card = ({ title, icon: Icon, children, className = "" }) => (
  <div
    className={`bg-white rounded-xl border border-stone-200 shadow-sm overflow-visible ${className}`}
  >
    {title && (
      <div className="p-3 border-b bg-stone-50 flex items-center">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 flex items-center gap-2">
          {Icon && <Icon size={14} />} {title}
        </h3>
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const classes = {
    Actif: "bg-green-100 text-green-800",
    Décédé: "bg-stone-800 text-white",
    Malade: "bg-yellow-100 text-yellow-800",
    Prisonnier: "bg-red-100 text-red-800",
    Banni: "bg-orange-100 text-orange-800",
    Esclave: "bg-purple-100 text-purple-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
        classes[status] || "bg-stone-100 text-stone-700"
      }`}
    >
      {status}
    </span>
  );
};

const StatusDot = ({ status }) => {
  const colors = {
    Actif: "bg-green-400",
    Décédé: "bg-stone-500",
    Malade: "bg-yellow-400",
    Prisonnier: "bg-red-500",
    Banni: "bg-orange-400",
    Esclave: "bg-purple-400",
  };
  return (
    <div
      className={`w-2 h-2 rounded-full shrink-0 ${
        colors[status] || "bg-stone-400"
      }`}
    />
  );
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function CharacterTest() {
  const [citizens, setCitizens] = useState(INITIAL_CITIZENS);
  const [selectedId, setSelectedId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  // ── Notifications ──
  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Données dérivées ──
  const filtered = citizens.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.id || "").includes(search) ||
      (c.occupation || "").toLowerCase().includes(search.toLowerCase())
  );

  const selected = citizens.find((c) => c.id === selectedId);

  const targetCountry = editForm
    ? MOCK_COUNTRIES.find((c) => c.id === editForm.countryId)
    : null;
  const availableRegions = targetCountry ? targetCountry.regions || [] : [];
  const customRoles = targetCountry
    ? (targetCountry.customRoles || []).filter((r) => r.type === "ROLE")
    : [];
  const customStatuses = targetCountry
    ? (targetCountry.customRoles || []).filter((r) => r.type === "STATUS")
    : [];

  // ── Statistiques sidebar ──
  const stats = {
    total: citizens.length,
    actifs: citizens.filter((c) => c.status === "Actif").length,
    decedes: citizens.filter((c) => c.status === "Décédé").length,
    esclaves: citizens.filter((c) => c.status === "Esclave").length,
  };

  // ── Actions CRUD ──
  const handleSave = (form) => {
    const exists = citizens.find((c) => c.id === form.id);
    if (exists) {
      setCitizens((prev) => prev.map((c) => (c.id === form.id ? form : c)));
      notify("Fiche archivée avec succès.");
    } else {
      setCitizens((prev) => [...prev, form]);
      notify("Nouveau sujet enregistré aux archives.");
    }
    setEditForm(null);
    setSelectedId(form.id);
  };

  const handleDelete = (citizen) => {
    setCitizens((prev) => prev.filter((c) => c.id !== citizen.id));
    setSelectedId(null);
    setEditForm(null);
    setDeleteConfirm(null);
    notify("Fiche supprimée des archives.", "error");
  };

  const handleCreate = () => {
    setSelectedId(null);
    setEditForm({
      id: "EMP-" + Date.now().toString().slice(-4),
      name: "Nouveau Sujet",
      age: 20,
      balance: 0,
      role: "CITOYEN",
      countryId: "C1",
      password: "123",
      occupation: "Citoyen",
      bio: "",
      status: "Actif",
      avatarUrl: "",
      inventory: [],
      currentPosition: "",
      ownerId: null,
    });
  };

  const handleSelectCitizen = (id) => {
    setSelectedId(id);
    setEditForm(null);
    setDeleteConfirm(null);
  };

  // ── Rendu ──
  return (
    <div className="min-h-screen bg-stone-900 font-sans text-stone-900">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl font-black text-sm uppercase tracking-widest transition-all animate-pulse ${
            toast.type === "error"
              ? "bg-red-900 text-red-100"
              : "bg-stone-900 text-yellow-400"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="flex h-screen overflow-hidden bg-[#e6e2d6]">
        {/* ── Barre latérale ── */}
        <div className="w-72 bg-stone-950 text-stone-200 flex flex-col border-r border-stone-800 shadow-2xl shrink-0">
          {/* Header */}
          <div className="p-6 text-center border-b border-stone-900 bg-stone-900/30 shadow-inner shrink-0">
            <Shield
              className="mx-auto mb-4 text-yellow-600 shadow-lg mt-2"
              size={48}
            />
            <h1 className="text-xl font-black uppercase tracking-[0.2em] text-white font-serif">
              Service Impérial
            </h1>
            <div className="text-[10px] uppercase mt-3 text-stone-500 font-black tracking-[0.4em] border border-stone-800 py-2 rounded-lg px-2 shadow-inner bg-stone-900/50">
              Test — Gestion Personnages
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 border-b border-stone-900 grid grid-cols-2 gap-2">
            <div className="bg-stone-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-yellow-500">
                {stats.total}
              </div>
              <div className="text-[9px] uppercase text-stone-500 tracking-widest mt-1">
                Sujets
              </div>
            </div>
            <div className="bg-stone-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-green-500">
                {stats.actifs}
              </div>
              <div className="text-[9px] uppercase text-stone-500 tracking-widest mt-1">
                Actifs
              </div>
            </div>
            {stats.esclaves > 0 && (
              <div className="bg-stone-900 rounded-lg p-3 text-center">
                <div className="text-2xl font-black text-purple-400">
                  {stats.esclaves}
                </div>
                <div className="text-[9px] uppercase text-stone-500 tracking-widest mt-1">
                  Esclaves
                </div>
              </div>
            )}
            {stats.decedes > 0 && (
              <div className="bg-stone-900 rounded-lg p-3 text-center">
                <div className="text-2xl font-black text-stone-500">
                  {stats.decedes}
                </div>
                <div className="text-[9px] uppercase text-stone-500 tracking-widest mt-1">
                  Décédés
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button className="w-full p-4 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-5 bg-[#e6dcc3] text-stone-900 shadow-[0_4px_15px_rgba(0,0,0,0.3)] translate-x-2">
              <Scroll size={18} className="text-stone-900" />
              Registre des Sujets
            </button>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-stone-900 text-center shrink-0">
            <span className="text-[9px] text-stone-600 uppercase tracking-[0.3em] font-black">
              v-test · données locales
            </span>
          </div>
        </div>

        {/* ── Contenu principal ── */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
          {/* Header */}
          <header className="h-20 bg-[#fdf6e3]/95 backdrop-blur border-b border-stone-300 flex items-center px-8 justify-between shadow-sm shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-[0.4em] mb-1 font-mono">
                Administration Impériale
              </span>
              <div className="text-xl font-black uppercase text-stone-800 tracking-widest font-serif">
                Registre de Population
              </div>
            </div>
            <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest px-5 py-2.5 border-2 border-stone-200 rounded-full bg-white/50 shadow-inner">
              Version d'Essai — Local
            </div>
          </header>

          {/* Corps */}
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto w-full h-full">
              <div className="flex h-full gap-6">
                {/* ── Liste des sujets ── */}
                <div
                  className={`w-1/3 bg-[#fdf6e3] rounded-xl border border-stone-300 flex flex-col overflow-hidden shadow-md ${
                    selectedId || editForm ? "hidden md:flex" : "flex"
                  }`}
                >
                  <div className="p-4 bg-stone-100 border-b flex justify-between items-center font-bold uppercase text-[11px] tracking-[0.2em] text-stone-500">
                    <span>Registre de Population</span>
                    <button
                      onClick={handleCreate}
                      className="bg-stone-800 text-white w-7 h-7 rounded-lg flex items-center justify-center hover:bg-stone-700 shadow-md transition-all active:scale-90"
                      title="Créer un nouveau sujet"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="p-3 border-b bg-white/50">
                    <input
                      className="w-full p-3 border-2 border-stone-200 rounded-xl text-xs outline-none bg-white focus:border-stone-500 shadow-inner transition-colors font-medium"
                      placeholder="Filtrer un sujet..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="overflow-y-auto flex-1 p-3 space-y-2">
                    {filtered.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCitizen(c.id)}
                        className={`p-4 cursor-pointer hover:bg-white rounded-xl transition-all flex items-center gap-4 ${
                          selectedId === c.id
                            ? "bg-stone-800 text-white shadow-xl border-l-8 border-yellow-600 translate-x-1"
                            : "bg-white/40 shadow-sm"
                        }`}
                      >
                        {c.avatarUrl ? (
                          <img
                            src={c.avatarUrl}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/20 shrink-0"
                            alt=""
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <User size={20} />
                          </div>
                        )}
                        <div className="overflow-hidden flex-1 min-w-0">
                          <div className="font-black text-sm uppercase truncate">
                            {c.name}
                          </div>
                          <div className="text-[10px] mt-0.5 tracking-[0.15em] font-bold font-mono opacity-60">
                            {c.id} — {ROLES[c.role]?.label || c.role}
                          </div>
                          <div className="text-[11px] mt-1 opacity-70 truncate">
                            {c.occupation}
                          </div>
                        </div>
                        <StatusDot status={c.status} />
                      </div>
                    ))}

                    {filtered.length === 0 && (
                      <div className="text-center text-stone-400 italic text-sm py-12 font-serif">
                        Aucun sujet trouvé.
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Panneau détail / édition ── */}
                <div
                  className={`flex-1 bg-[#fdf6e3] rounded-xl border border-stone-300 p-6 md:p-10 overflow-auto relative shadow-2xl ${
                    selectedId || editForm
                      ? "flex flex-col"
                      : "hidden md:flex flex-col"
                  }`}
                >
                  {editForm || selected ? (
                    <div className="max-w-2xl mx-auto w-full pb-20">
                      {/* En-tête fiche */}
                      <div className="flex justify-between items-start mb-10 border-b-4 border-stone-800 pb-6">
                        <div className="flex items-center gap-6">
                          {(editForm || selected)?.avatarUrl ? (
                            <img
                              src={(editForm || selected).avatarUrl}
                              className="w-24 h-24 rounded-xl object-cover border-4 border-stone-800 shadow-lg"
                              alt=""
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-xl bg-stone-200 flex items-center justify-center border-4 border-stone-300">
                              <User size={48} className="text-stone-400" />
                            </div>
                          )}
                          <div>
                            <h2 className="text-3xl md:text-4xl font-black font-serif uppercase tracking-tight text-stone-900">
                              {(editForm || selected).name}
                            </h2>
                            <div className="text-[10px] uppercase font-black tracking-[0.3em] text-stone-400 mt-3 pl-1">
                              Matricule: {(editForm || selected).id}
                            </div>
                            <div className="text-sm text-stone-600 mt-2 flex items-center gap-2">
                              <MapPin size={14} />
                              {(editForm || selected).currentPosition ||
                                "Position inconnue"}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 flex-wrap justify-end">
                          {/* Suppression */}
                          {deleteConfirm === (editForm || selected)?.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-black text-red-600 tracking-widest">
                                Confirmer?
                              </span>
                              <button
                                onClick={() =>
                                  handleDelete(editForm || selected)
                                }
                                className="bg-red-800 text-white px-3 py-2 rounded-lg font-black hover:bg-red-700 transition-all"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="bg-stone-200 text-stone-700 px-3 py-2 rounded-lg font-black hover:bg-stone-300 transition-all"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                setDeleteConfirm((editForm || selected)?.id)
                              }
                              className="border-2 border-red-200 text-red-500 px-4 py-3 rounded-xl text-[11px] font-black uppercase hover:bg-red-50 transition-all flex items-center gap-2 tracking-widest"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          {editForm ? (
                            <>
                              <button
                                onClick={() => {
                                  setEditForm(null);
                                  setSelectedId(selected?.id || null);
                                }}
                                className="border-2 border-stone-300 text-stone-600 px-6 py-3 rounded-xl text-[11px] font-black uppercase hover:bg-stone-100 transition-all tracking-widest"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={() => handleSave(editForm)}
                                className="bg-stone-900 text-yellow-500 px-8 py-3 rounded-xl text-[11px] font-black uppercase shadow-2xl hover:bg-stone-800 transition-all active:scale-95 tracking-widest"
                              >
                                Archiver
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setEditForm({ ...selected })}
                              className="bg-white border-2 border-stone-300 px-8 py-3 rounded-xl text-[11px] font-black uppercase flex items-center gap-3 shadow-md hover:bg-stone-50 transition-all active:scale-95 tracking-widest"
                            >
                              Modifier
                            </button>
                          )}
                        </div>
                      </div>

                      {editForm ? (
                        /* ── Formulaire d'édition ── */
                        <div className="space-y-8">
                          <Card title="Dossier Civil" icon={User}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Portrait */}
                              <div className="col-span-1 md:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1">
                                  Portrait (URL)
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm focus:border-stone-800 transition-all font-bold"
                                    value={editForm.avatarUrl || ""}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        avatarUrl: e.target.value,
                                      })
                                    }
                                    placeholder="https://..."
                                  />
                                  <div className="w-12 h-12 bg-stone-100 rounded-lg flex-shrink-0 border border-stone-200 overflow-hidden flex items-center justify-center">
                                    {editForm.avatarUrl ? (
                                      <img
                                        src={editForm.avatarUrl}
                                        className="w-full h-full object-cover"
                                        alt=""
                                        onError={(e) =>
                                          (e.target.style.display = "none")
                                        }
                                      />
                                    ) : (
                                      <ImageIcon
                                        size={20}
                                        className="text-stone-300"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Nom complet */}
                              <div className="col-span-1 md:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1">
                                  Nom Complet
                                </label>
                                <input
                                  className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm focus:border-stone-800 transition-all font-bold"
                                  value={editForm.name}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      name: e.target.value,
                                    })
                                  }
                                />
                              </div>

                              {/* Localisation */}
                              <div className="col-span-1 md:col-span-2 bg-stone-50 p-5 rounded-xl border border-stone-200">
                                <h4 className="text-xs font-black uppercase text-stone-400 mb-4 flex items-center gap-2 tracking-widest">
                                  <MapPin size={12} /> Localisation & Allégeance
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1">
                                      Nation d'Allégeance
                                    </label>
                                    <div className="relative">
                                      <Flag
                                        size={14}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                                      />
                                      <select
                                        className="w-full p-3 pl-9 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm font-bold"
                                        value={editForm.countryId}
                                        onChange={(e) =>
                                          setEditForm({
                                            ...editForm,
                                            countryId: e.target.value,
                                            currentPosition: "",
                                          })
                                        }
                                      >
                                        {MOCK_COUNTRIES.map((c) => (
                                          <option key={c.id} value={c.id}>
                                            {c.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1">
                                      Position actuelle
                                    </label>
                                    <select
                                      className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm font-bold"
                                      value={editForm.currentPosition || ""}
                                      onChange={(e) =>
                                        setEditForm({
                                          ...editForm,
                                          currentPosition: e.target.value,
                                        })
                                      }
                                    >
                                      <option value="">-- Non définie --</option>
                                      <option value="Frontière">Frontière</option>
                                      {availableRegions.map((r) => (
                                        <option
                                          key={r.id || r.name}
                                          value={r.name}
                                        >
                                          {r.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* Âge */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1">
                                  Âge
                                </label>
                                <input
                                  type="number"
                                  className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm focus:border-stone-800 transition-all font-bold"
                                  value={editForm.age}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      age: parseInt(e.target.value) || 0,
                                    })
                                  }
                                />
                              </div>

                              {/* Solde */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1">
                                  Solde (Écus)
                                </label>
                                <input
                                  type="number"
                                  className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm focus:border-stone-800 transition-all font-bold"
                                  value={editForm.balance}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      balance:
                                        parseInt(e.target.value) || 0,
                                    })
                                  }
                                />
                              </div>

                              {/* Statut */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1">
                                  Statut
                                </label>
                                <select
                                  className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm font-bold"
                                  value={editForm.status || "Actif"}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      status: e.target.value,
                                    })
                                  }
                                >
                                  <optgroup label="Standards">
                                    {BASE_STATUSES.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </optgroup>
                                  {customStatuses.length > 0 && (
                                    <optgroup
                                      label={`Spéciaux (${
                                        targetCountry?.name || "Local"
                                      })`}
                                    >
                                      {customStatuses.map((s) => (
                                        <option key={s.id} value={s.name}>
                                          {s.name}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>

                              {/* Occupation */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1">
                                  Occupation
                                </label>
                                <input
                                  className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm focus:border-stone-800 transition-all font-bold"
                                  value={editForm.occupation}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      occupation: e.target.value,
                                    })
                                  }
                                />
                              </div>

                              {/* Rang */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1">
                                  Rang Impérial
                                </label>
                                <select
                                  className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm font-bold"
                                  value={editForm.role || "CITOYEN"}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      role: e.target.value,
                                    })
                                  }
                                >
                                  <optgroup label="Hiérarchie Impériale">
                                    {Object.entries(ROLES).map(([k, v]) => (
                                      <option key={k} value={k}>
                                        {v.label}
                                      </option>
                                    ))}
                                  </optgroup>
                                  {customRoles.length > 0 && (
                                    <optgroup
                                      label={`Titres Locaux (${
                                        targetCountry?.name || "Local"
                                      })`}
                                    >
                                      {customRoles.map((r) => (
                                        <option key={r.id} value={r.name}>
                                          {r.name} (Niv. {r.level})
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>

                              {/* Propriétaire (esclave) */}
                              <div className="col-span-1 md:col-span-2 space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-200">
                                <label className="text-[10px] font-bold text-stone-500 uppercase block tracking-widest ml-1">
                                  <UserCircle
                                    size={10}
                                    className="inline mr-1"
                                  />
                                  Propriétaire (Si Esclave)
                                </label>
                                <select
                                  className="w-full p-2 border-2 border-stone-200 rounded-xl bg-white outline-none font-bold text-xs"
                                  value={editForm.ownerId || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      ownerId:
                                        e.target.value === ""
                                          ? null
                                          : e.target.value,
                                    })
                                  }
                                >
                                  <option value="">
                                    -- Aucun (Homme Libre) --
                                  </option>
                                  {citizens
                                    .filter((c) => c.id !== editForm.id)
                                    .map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name} ({c.id})
                                      </option>
                                    ))}
                                </select>
                              </div>

                              {/* Bio */}
                              <div className="col-span-1 md:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1">
                                  Biographie / Notes
                                </label>
                                <textarea
                                  className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm focus:border-stone-800 transition-all font-bold min-h-[100px]"
                                  value={editForm.bio}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      bio: e.target.value,
                                    })
                                  }
                                  placeholder="Histoire du personnage..."
                                />
                              </div>
                            </div>
                          </Card>

                          <Card title="Contrôle d'Accès" icon={Lock}>
                            <div>
                              <label className="text-[10px] font-bold text-stone-400 block mb-2 uppercase tracking-widest">
                                Sceau (Mot de Passe)
                              </label>
                              <input
                                className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm font-mono text-center"
                                value={editForm.password}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    password: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </Card>
                        </div>
                      ) : (
                        /* ── Vue lecture seule ── */
                        <div className="space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card
                              title="Informations Administratives"
                              icon={Scroll}
                            >
                              <div className="space-y-4 text-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-stone-400 uppercase text-[9px] font-black block mb-1 tracking-widest">
                                      Occupation
                                    </span>
                                    <span className="text-stone-900 font-bold text-lg uppercase">
                                      {selected.occupation || "Citoyen"}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-stone-400 uppercase text-[9px] font-black block mb-1 tracking-widest">
                                      Âge
                                    </span>
                                    <span className="text-stone-900 font-bold text-lg uppercase">
                                      {selected.age || "Inconnu"} ans
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-stone-400 uppercase text-[9px] font-black block mb-1 tracking-widest">
                                    Nation d'Allégeance
                                  </span>
                                  <span className="text-stone-900 font-bold text-lg uppercase">
                                    {MOCK_COUNTRIES.find(
                                      (c) => c.id === selected.countryId
                                    )?.name || "Empire"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-stone-400 uppercase text-[9px] font-black block mb-1 tracking-widest">
                                    Rang
                                  </span>
                                  <span className="text-stone-900 font-bold uppercase">
                                    {ROLES[selected.role]?.label ||
                                      selected.role}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-stone-400 uppercase text-[9px] font-black block mb-1 tracking-widest">
                                    Statut
                                  </span>
                                  <StatusBadge
                                    status={selected.status || "Actif"}
                                  />
                                </div>
                                {selected.ownerId && (
                                  <div>
                                    <span className="text-stone-400 uppercase text-[9px] font-black block mb-1 tracking-widest">
                                      Propriétaire
                                    </span>
                                    <span className="text-stone-900 font-bold uppercase text-sm">
                                      {citizens.find(
                                        (c) => c.id === selected.ownerId
                                      )?.name || selected.ownerId}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </Card>

                            <Card
                              title="Avoirs Impériaux"
                              icon={Coins}
                              className="bg-stone-900 text-yellow-500 flex flex-col justify-center items-center relative overflow-hidden font-serif"
                            >
                              <Coins
                                size={100}
                                className="absolute -right-6 -bottom-6 opacity-10"
                              />
                              <div className="text-6xl font-black relative z-10 font-serif">
                                {Number(
                                  selected.balance || 0
                                ).toLocaleString()}
                              </div>
                              <div className="text-[10px] uppercase font-black tracking-[0.4em] mt-3 opacity-50 relative z-10">
                                Écus
                              </div>
                            </Card>
                          </div>

                          <Card title="Biographie & Archives" icon={BookOpen}>
                            <div className="p-4 italic text-stone-600 bg-white/50 rounded-lg border border-stone-100 leading-relaxed text-sm font-serif">
                              {selected.bio ||
                                "Aucune archive biographique disponible pour ce sujet."}
                            </div>
                          </Card>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── État vide ── */
                    <div className="h-full flex items-center justify-center text-stone-300 italic flex-col gap-8 font-serif uppercase tracking-widest">
                      <User size={100} className="opacity-10 animate-pulse" />
                      <p className="text-2xl tracking-[0.4em] opacity-30 font-serif">
                        Consultation des Registres
                      </p>
                      <button
                        onClick={handleCreate}
                        className="flex items-center gap-3 px-8 py-4 bg-stone-800 text-yellow-500 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-stone-700 transition-all shadow-2xl not-italic"
                      >
                        <Plus size={18} /> Créer un sujet
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
