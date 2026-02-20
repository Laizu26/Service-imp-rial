import React, { useState } from "react";
import {
  UserPlus,
  Scroll,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
} from "lucide-react";
import { ROLES } from "../../lib/constants";

const GameMasterView = ({ state, onUpdateState, notify, onClose }) => {
  const [tab, setTab] = useState("create");

  // --- Création de compte ---
  const [form, setForm] = useState({
    name: "",
    age: 20,
    role: "CITOYEN",
    countryId: state.countries?.[0]?.id || "C1",
    password: "",
    balance: 100,
    occupation: "",
    status: "Actif",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [createdAccount, setCreatedAccount] = useState(null);

  const safeCountries = Array.isArray(state.countries) ? state.countries : [];
  const safeCitizens = Array.isArray(state.citizens) ? state.citizens : [];

  const generateId = () => {
    const prefix = "EMP";
    const num = String(safeCitizens.length + 1).padStart(3, "0");
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `${prefix}-${num}-${rand}`;
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
  };

  const handleCreate = () => {
    if (!form.name.trim()) {
      notify("Le nom est requis.", "error");
      return;
    }
    if (!form.password.trim()) {
      notify("Le mot de passe est requis.", "error");
      return;
    }

    const existing = safeCitizens.find(
      (c) => c.name.toLowerCase() === form.name.trim().toLowerCase()
    );
    if (existing) {
      notify("Un citoyen avec ce nom existe déjà.", "error");
      return;
    }

    const newId = generateId();
    const newCitizen = {
      id: newId,
      name: form.name.trim(),
      age: parseInt(form.age) || 20,
      role: form.role,
      countryId: form.countryId,
      locationCountryId: form.countryId,
      password: form.password,
      balance: parseInt(form.balance) || 0,
      occupation: form.occupation || "Citoyen",
      status: form.status,
      bio: "",
      avatarUrl: "",
      inventory: [],
      messages: [],
      currentPosition: "",
      motto: "",
      title: "",
      religion: "",
      origin: "",
    };

    onUpdateState({
      ...state,
      citizens: [...safeCitizens, newCitizen],
    });

    setCreatedAccount({ id: newId, name: form.name.trim(), password: form.password });
    notify(`Compte "${form.name.trim()}" créé avec succès.`, "success");

    // Reset le formulaire
    setForm({
      name: "",
      age: 20,
      role: "CITOYEN",
      countryId: state.countries?.[0]?.id || "C1",
      password: "",
      balance: 100,
      occupation: "",
      status: "Actif",
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      notify("Copié dans le presse-papier.", "success");
    }).catch(() => {
      notify("Impossible de copier.", "error");
    });
  };

  const tabs = [
    { id: "create", label: "Créer un Compte", icon: UserPlus },
    { id: "list", label: "Tous les Comptes", icon: Scroll },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-stone-950 border border-stone-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-stone-900 border-b border-stone-800 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-900/30 border border-red-800/50 flex items-center justify-center">
              <Shield size={20} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-red-400">
                Game Master
              </h2>
              <div className="text-[9px] text-stone-500 uppercase tracking-widest">
                Interface Maître du Jeu
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-white text-lg font-bold w-8 h-8 rounded-lg hover:bg-stone-800 flex items-center justify-center transition-all"
          >
            X
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-800 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                tab === t.id
                  ? "bg-stone-800 text-red-400 border-b-2 border-red-500"
                  : "text-stone-500 hover:text-stone-300 hover:bg-stone-900"
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent">
          {/* === ONGLET CRÉATION === */}
          {tab === "create" && (
            <div className="space-y-6 max-w-lg mx-auto">
              {/* Récapitulatif du compte créé */}
              {createdAccount && (
                <div className="bg-green-900/20 border border-green-800/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-green-400 text-xs font-black uppercase tracking-widest">
                    <CheckCircle size={14} /> Compte créé
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[9px] text-stone-500 uppercase tracking-widest block">Identifiant</span>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-200 font-mono font-bold">{createdAccount.id}</span>
                        <button onClick={() => copyToClipboard(createdAccount.id)} className="text-stone-500 hover:text-white"><Copy size={12} /></button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-500 uppercase tracking-widest block">Nom</span>
                      <span className="text-stone-200 font-bold">{createdAccount.name}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[9px] text-stone-500 uppercase tracking-widest block">Mot de passe</span>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-200 font-mono font-bold">{createdAccount.password}</span>
                        <button onClick={() => copyToClipboard(createdAccount.password)} className="text-stone-500 hover:text-white"><Copy size={12} /></button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`Identifiant: ${createdAccount.id}\nNom: ${createdAccount.name}\nMot de passe: ${createdAccount.password}`)}
                    className="w-full mt-2 py-2 bg-green-800/30 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-green-800/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Copy size={12} /> Copier tout
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                  <UserPlus size={14} className="text-red-400" /> Nouveau Citoyen
                </h3>

                {/* Nom */}
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Nom complet</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50 transition-colors"
                    placeholder="Nom du citoyen..."
                  />
                </div>

                {/* Mot de passe */}
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Mot de passe</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50 transition-colors pr-10"
                        placeholder="Sceau de sécurité..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <button
                      onClick={() => setForm({ ...form, password: generatePassword() })}
                      className="px-3 py-2 bg-stone-800 border border-stone-700 text-stone-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:text-white hover:bg-stone-700 transition-all whitespace-nowrap"
                    >
                      Générer
                    </button>
                  </div>
                </div>

                {/* Ligne : Âge + Solde */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Âge</label>
                    <input
                      type="number"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50 transition-colors"
                      min="1"
                      max="120"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Solde initial (Écus)</label>
                    <input
                      type="number"
                      value={form.balance}
                      onChange={(e) => setForm({ ...form, balance: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50 transition-colors"
                      min="0"
                    />
                  </div>
                </div>

                {/* Rôle */}
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Rôle</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50 transition-colors"
                  >
                    {Object.entries(ROLES).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pays */}
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Pays d'allégeance</label>
                  <select
                    value={form.countryId}
                    onChange={(e) => setForm({ ...form, countryId: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50 transition-colors"
                  >
                    {safeCountries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Occupation */}
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Occupation</label>
                  <input
                    value={form.occupation}
                    onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50 transition-colors"
                    placeholder="Métier du citoyen..."
                  />
                </div>

                {/* Statut */}
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50 transition-colors"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Esclave">Esclave</option>
                    <option value="Prisonnier">Prisonnier</option>
                    <option value="Malade">Malade</option>
                    <option value="Banni">Banni</option>
                  </select>
                </div>

                {/* Bouton créer */}
                <button
                  onClick={handleCreate}
                  className="w-full py-3.5 bg-red-900/50 border border-red-800/50 text-red-300 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-900/70 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                >
                  <UserPlus size={16} /> Créer le compte
                </button>
              </div>
            </div>
          )}

          {/* === ONGLET LISTE === */}
          {tab === "list" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">
                  {safeCitizens.length} compte{safeCitizens.length > 1 ? "s" : ""} enregistré{safeCitizens.length > 1 ? "s" : ""}
                </h3>
              </div>

              {safeCitizens.length === 0 ? (
                <div className="text-center text-stone-600 py-12 text-sm">
                  Aucun citoyen dans l'Empire.
                </div>
              ) : (
                <div className="space-y-2">
                  {safeCitizens.map((c) => {
                    const roleLabel = ROLES[c.role]?.label || c.role;
                    const country = safeCountries.find((ct) => ct.id === c.countryId);
                    return (
                      <div
                        key={c.id}
                        className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center gap-4 hover:border-stone-600 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {c.avatarUrl ? (
                            <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-stone-500 text-xs font-black">
                              {(c.name || "?")[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-stone-200 truncate">
                              {c.name}
                            </span>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                              c.status === "Actif" ? "bg-green-900/30 text-green-400" :
                              c.status === "Esclave" ? "bg-red-900/30 text-red-400" :
                              c.status === "Banni" ? "bg-stone-700 text-stone-400" :
                              "bg-yellow-900/30 text-yellow-400"
                            }`}>
                              {c.status || "Actif"}
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{c.id}</span>
                            <span>·</span>
                            <span>{roleLabel}</span>
                            {country && (
                              <>
                                <span>·</span>
                                <span>{country.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-yellow-500">
                            {(c.balance || 0).toLocaleString()} E
                          </div>
                          <div className="text-[9px] text-stone-600 font-mono mt-0.5">
                            mdp: {c.password || "???"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameMasterView;
