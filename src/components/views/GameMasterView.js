import React, { useState } from "react";
import {
  UserPlus,
  Scroll,
  Shield,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  ArrowLeft,
  Users,
  BookOpen,
  LayoutDashboard,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  Save,
  X,
} from "lucide-react";
import { ROLES } from "../../lib/constants";

// =============================================
// SECTION : DASHBOARD (vue d'ensemble HRP)
// =============================================
const GMDashboard = ({ state }) => {
  const citizens = state.citizens || [];
  const countries = state.countries || [];
  const companies = state.companies || [];

  const stats = [
    { label: "Citoyens", value: citizens.length, color: "text-blue-400" },
    { label: "Pays", value: countries.length, color: "text-emerald-400" },
    { label: "Entreprises", value: companies.length, color: "text-purple-400" },
    { label: "Trésor Impérial", value: `${(state.treasury || 0).toLocaleString()} E`, color: "text-yellow-400" },
    { label: "Cycle de jeu", value: state.dayCycle || 0, color: "text-stone-400" },
    { label: "Date RP", value: state.gameDate ? `${state.gameDate.day}/${state.gameDate.month}/${state.gameDate.year}` : "—", color: "text-stone-300" },
  ];

  const roleDistribution = {};
  citizens.forEach((c) => {
    const label = ROLES[c.role]?.label || c.role || "Inconnu";
    roleDistribution[label] = (roleDistribution[label] || 0) + 1;
  });

  const statusDistribution = {};
  citizens.forEach((c) => {
    const s = c.status || "Actif";
    statusDistribution[s] = (statusDistribution[s] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black uppercase tracking-widest text-stone-200 flex items-center gap-3 font-serif">
        <LayoutDashboard size={20} className="text-red-400" />
        Tableau de Bord
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
            <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1">{s.label}</div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Distribution des rôles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Répartition des Rôles</h3>
          <div className="space-y-2">
            {Object.entries(roleDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-xs text-stone-300">{role}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-stone-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-red-500/60 h-full rounded-full"
                        style={{ width: `${(count / citizens.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-stone-500 w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Répartition des Statuts</h3>
          <div className="space-y-2">
            {Object.entries(statusDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => {
                const color = status === "Actif" ? "bg-green-500/60" :
                  status === "Esclave" ? "bg-red-500/60" :
                  status === "Prisonnier" ? "bg-orange-500/60" :
                  status === "Banni" ? "bg-stone-500/60" :
                  "bg-yellow-500/60";
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-xs text-stone-300">{status}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-stone-800 rounded-full h-1.5 overflow-hidden">
                        <div className={`${color} h-full rounded-full`} style={{ width: `${(count / citizens.length) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-stone-500 w-6 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================
// SECTION : COMPTES (création + liste)
// =============================================
const GMAccounts = ({ state, onUpdateState, notify }) => {
  const [view, setView] = useState("list"); // "list" | "create"
  const [form, setForm] = useState({
    name: "", age: 20, role: "CITOYEN",
    countryId: state.countries?.[0]?.id || "C1",
    password: "", balance: 100, occupation: "", status: "Actif",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [createdAccount, setCreatedAccount] = useState(null);
  const [search, setSearch] = useState("");

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
    for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    return pass;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => notify("Copié.", "success")).catch(() => {});
  };

  const handleCreate = () => {
    if (!form.name.trim()) { notify("Le nom est requis.", "error"); return; }
    if (!form.password.trim()) { notify("Le mot de passe est requis.", "error"); return; }
    if (safeCitizens.find((c) => c.name.toLowerCase() === form.name.trim().toLowerCase())) {
      notify("Ce nom existe déjà.", "error"); return;
    }

    const newId = generateId();
    const newCitizen = {
      id: newId, name: form.name.trim(), age: parseInt(form.age) || 20,
      role: form.role, countryId: form.countryId, locationCountryId: form.countryId,
      password: form.password, balance: parseInt(form.balance) || 0,
      occupation: form.occupation || "Citoyen", status: form.status,
      bio: "", avatarUrl: "", inventory: [], messages: [],
      currentPosition: "", motto: "", title: "", religion: "", origin: "",
    };

    onUpdateState({ ...state, citizens: [...safeCitizens, newCitizen] });
    setCreatedAccount({ id: newId, name: form.name.trim(), password: form.password });
    notify(`Compte "${form.name.trim()}" créé.`, "success");
    setForm({ name: "", age: 20, role: "CITOYEN", countryId: state.countries?.[0]?.id || "C1", password: "", balance: 100, occupation: "", status: "Actif" });
  };

  const filtered = safeCitizens.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.name?.toLowerCase().includes(s) || c.id?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black uppercase tracking-widest text-stone-200 flex items-center gap-3 font-serif">
          <Users size={20} className="text-red-400" />
          Gestion des Comptes
        </h2>
        <button
          onClick={() => { setView(view === "create" ? "list" : "create"); setCreatedAccount(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            view === "create"
              ? "bg-stone-800 text-stone-300 hover:bg-stone-700"
              : "bg-red-900/50 border border-red-800/50 text-red-300 hover:bg-red-900/70"
          }`}
        >
          {view === "create" ? <><ArrowLeft size={14} /> Liste</> : <><Plus size={14} /> Nouveau</>}
        </button>
      </div>

      {/* === VUE CRÉATION === */}
      {view === "create" && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-5 max-w-xl">
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
            <div>
              <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Nom complet</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50" placeholder="Nom du citoyen..." />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Mot de passe</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50 pr-10" placeholder="Sceau..." />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button onClick={() => setForm({ ...form, password: generatePassword() })} className="px-3 py-2 bg-stone-800 border border-stone-700 text-stone-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:text-white hover:bg-stone-700 transition-all whitespace-nowrap">
                  Générer
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Âge</label>
                <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50" min="1" max="120" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Solde (Écus)</label>
                <input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50" min="0" />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Rôle</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50">
                {Object.entries(ROLES).map(([key, val]) => (<option key={key} value={key}>{val.label}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Pays</label>
              <select value={form.countryId} onChange={(e) => setForm({ ...form, countryId: e.target.value })} className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50">
                {safeCountries.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Occupation</label>
              <input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50" placeholder="Métier..." />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Statut</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50">
                <option value="Actif">Actif</option>
                <option value="Esclave">Esclave</option>
                <option value="Prisonnier">Prisonnier</option>
                <option value="Malade">Malade</option>
                <option value="Banni">Banni</option>
              </select>
            </div>
            <button onClick={handleCreate} className="w-full py-3.5 bg-red-900/50 border border-red-800/50 text-red-300 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-900/70 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
              <UserPlus size={16} /> Créer le compte
            </button>
          </div>
        </div>
      )}

      {/* === VUE LISTE === */}
      {view === "list" && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-stone-900 border border-stone-800 rounded-lg text-sm text-stone-200 outline-none focus:border-stone-600" placeholder="Rechercher un citoyen..." />
          </div>

          <div className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">
            {filtered.length} compte{filtered.length > 1 ? "s" : ""}
          </div>

          <div className="space-y-2">
            {filtered.map((c) => {
              const roleLabel = ROLES[c.role]?.label || c.role;
              const country = safeCountries.find((ct) => ct.id === c.countryId);
              return (
                <div key={c.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center gap-4 hover:border-stone-600 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-stone-500 text-xs font-black">{(c.name || "?")[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-200 truncate">{c.name}</span>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                        c.status === "Actif" ? "bg-green-900/30 text-green-400" :
                        c.status === "Esclave" ? "bg-red-900/30 text-red-400" :
                        c.status === "Banni" ? "bg-stone-700 text-stone-400" :
                        "bg-yellow-900/30 text-yellow-400"
                      }`}>{c.status || "Actif"}</span>
                    </div>
                    <div className="text-[10px] text-stone-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{c.id}</span>
                      <span>·</span>
                      <span>{roleLabel}</span>
                      {country && <><span>·</span><span>{country.name}</span></>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-yellow-500">{(c.balance || 0).toLocaleString()} E</div>
                    <div className="text-[9px] text-stone-600 font-mono mt-0.5">mdp: {c.password || "???"}</div>
                  </div>
                  <button onClick={() => copyToClipboard(`ID: ${c.id}\nMDP: ${c.password}`)} className="text-stone-600 hover:text-stone-300 p-1.5 rounded hover:bg-stone-800 transition-all" title="Copier identifiants">
                    <Copy size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================
// SECTION : LORE
// =============================================
const GMLore = ({ state, onUpdateState, notify }) => {
  const loreEntries = state.lore || [];
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", category: "Histoire", content: "" });
  const [expandedId, setExpandedId] = useState(null);

  const categories = ["Histoire", "Géographie", "Religion", "Politique", "Culture", "Bestiaire", "Magie", "Autre"];

  const categoryColors = {
    Histoire: "bg-amber-900/30 text-amber-400 border-amber-800/50",
    Géographie: "bg-emerald-900/30 text-emerald-400 border-emerald-800/50",
    Religion: "bg-purple-900/30 text-purple-400 border-purple-800/50",
    Politique: "bg-blue-900/30 text-blue-400 border-blue-800/50",
    Culture: "bg-rose-900/30 text-rose-400 border-rose-800/50",
    Bestiaire: "bg-orange-900/30 text-orange-400 border-orange-800/50",
    Magie: "bg-indigo-900/30 text-indigo-400 border-indigo-800/50",
    Autre: "bg-stone-800 text-stone-400 border-stone-700",
  };

  const handleSave = () => {
    if (!form.title.trim()) { notify("Le titre est requis.", "error"); return; }
    if (!form.content.trim()) { notify("Le contenu est requis.", "error"); return; }

    let updated;
    if (editing) {
      updated = loreEntries.map((e) => e.id === editing ? { ...e, title: form.title.trim(), category: form.category, content: form.content, updatedAt: Date.now() } : e);
    } else {
      const newEntry = {
        id: `lore_${Date.now()}`,
        title: form.title.trim(),
        category: form.category,
        content: form.content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      updated = [newEntry, ...loreEntries];
    }

    onUpdateState({ ...state, lore: updated });
    notify(editing ? "Article mis à jour." : "Article créé.", "success");
    setForm({ title: "", category: "Histoire", content: "" });
    setEditing(null);
  };

  const handleDelete = (id) => {
    onUpdateState({ ...state, lore: loreEntries.filter((e) => e.id !== id) });
    notify("Article supprimé.", "info");
  };

  const startEdit = (entry) => {
    setEditing(entry.id);
    setForm({ title: entry.title, category: entry.category, content: entry.content });
  };

  const [filterCat, setFilterCat] = useState("ALL");
  const filtered = filterCat === "ALL" ? loreEntries : loreEntries.filter((e) => e.category === filterCat);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-black uppercase tracking-widest text-stone-200 flex items-center gap-3 font-serif">
        <BookOpen size={20} className="text-red-400" />
        Lore & Univers
      </h2>

      {/* Éditeur */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-2">
          {editing ? <><Save size={12} /> Modifier l'article</> : <><Plus size={12} /> Nouvel article</>}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Titre</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50" placeholder="Titre de l'article..." />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Catégorie</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Contenu</label>
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50 min-h-[160px] font-serif" placeholder="Écrivez votre article de lore ici..." />
        </div>
        <div className="flex gap-2">
          {editing && (
            <button onClick={() => { setEditing(null); setForm({ title: "", category: "Histoire", content: "" }); }} className="px-4 py-2.5 bg-stone-800 text-stone-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-stone-700 transition-all">
              Annuler
            </button>
          )}
          <button onClick={handleSave} className="flex-1 py-2.5 bg-red-900/50 border border-red-800/50 text-red-300 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-900/70 transition-all flex items-center justify-center gap-2">
            {editing ? <><Save size={14} /> Sauvegarder</> : <><Plus size={14} /> Ajouter</>}
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat("ALL")} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterCat === "ALL" ? "bg-red-900/50 text-red-300 border border-red-800/50" : "bg-stone-900 text-stone-500 border border-stone-800 hover:text-stone-300"}`}>
          Tout ({loreEntries.length})
        </button>
        {categories.map((cat) => {
          const count = loreEntries.filter((e) => e.category === cat).length;
          if (count === 0) return null;
          return (
            <button key={cat} onClick={() => setFilterCat(cat)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${filterCat === cat ? categoryColors[cat] : "bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-300"}`}>
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Articles */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-stone-600">
          <BookOpen size={32} className="mx-auto mb-3 opacity-50" />
          <div className="text-sm font-bold">Aucun article de lore</div>
          <div className="text-[10px] mt-1">Commencez à construire l'univers de votre jeu.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden hover:border-stone-700 transition-all">
              <button
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="w-full text-left p-4 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${categoryColors[entry.category] || categoryColors.Autre}`}>
                      {entry.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-stone-200 font-serif">{entry.title}</h4>
                  {expandedId !== entry.id && (
                    <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">{entry.content}</p>
                  )}
                </div>
                {expandedId === entry.id ? <ChevronUp size={16} className="text-stone-500 shrink-0 mt-1" /> : <ChevronDown size={16} className="text-stone-500 shrink-0 mt-1" />}
              </button>
              {expandedId === entry.id && (
                <div className="px-4 pb-4 border-t border-stone-800 pt-3">
                  <div className="text-sm text-stone-300 whitespace-pre-wrap font-serif leading-relaxed mb-4">
                    {entry.content}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] text-stone-600 font-mono">
                      Modifié le {new Date(entry.updatedAt || entry.createdAt).toLocaleDateString("fr-FR")}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(entry)} className="px-3 py-1.5 bg-stone-800 text-stone-400 text-[9px] font-black uppercase tracking-widest rounded hover:text-white hover:bg-stone-700 transition-all">
                        Modifier
                      </button>
                      <button onClick={() => handleDelete(entry.id)} className="px-3 py-1.5 bg-stone-800 text-red-500 text-[9px] font-black uppercase tracking-widest rounded hover:bg-red-900/30 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =============================================
// LAYOUT PRINCIPAL GAME MASTER
// =============================================
const GameMasterView = ({ state, onUpdateState, notify, onClose }) => {
  const [activeSection, setActiveSection] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Tableau de Bord", icon: LayoutDashboard },
    { id: "accounts", label: "Comptes", icon: Users },
    { id: "lore", label: "Lore & Univers", icon: BookOpen },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-stone-950 font-sans text-stone-200">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-stone-900 border-r border-stone-800 z-30 shrink-0 shadow-2xl">
        {/* Header sidebar */}
        <div className="p-6 pb-5 flex flex-col items-center border-b border-stone-800/50 bg-stone-900/50">
          <div className="w-14 h-14 rounded-xl bg-red-900/20 border-2 border-red-800/40 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(220,38,38,0.1)]">
            <Shield size={28} className="text-red-400" />
          </div>
          <h1 className="text-sm font-black uppercase tracking-[0.2em] text-red-400">
            Game Master
          </h1>
          <div className="text-[9px] text-stone-500 uppercase tracking-widest mt-1">
            Maître du Jeu — HRP
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                activeSection === item.id
                  ? "bg-red-900/30 text-red-300 border border-red-800/40 shadow-lg"
                  : "text-stone-400 hover:bg-stone-800 hover:text-stone-100"
              }`}
            >
              <item.icon
                size={18}
                className={activeSection === item.id ? "text-red-400" : "text-stone-500 group-hover:text-stone-300"}
              />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div className="p-4 border-t border-stone-800 space-y-2">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-stone-800 text-stone-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-stone-700 hover:border-stone-600"
          >
            <ArrowLeft size={16} /> Retour au Jeu
          </button>
          <div className="text-center opacity-30 pt-2">
            <Shield className="mx-auto mb-1 text-red-600" size={18} />
            <div className="text-[8px] uppercase tracking-[0.2em] font-black text-stone-600">
              Interface HRP
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <header className="h-14 bg-stone-900/95 backdrop-blur border-b border-stone-800 flex items-center justify-between px-4 md:px-8 shadow-xl shrink-0 z-20">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-red-400" />
            <span className="text-xs font-black uppercase tracking-widest text-red-400">
              Game Master
            </span>
          </div>
          {/* Menu mobile */}
          <div className="flex gap-2 md:hidden">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`p-2 rounded-lg transition-all ${
                  activeSection === item.id
                    ? "bg-red-900/30 text-red-400"
                    : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <item.icon size={18} />
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-all flex items-center justify-center px-3 py-1.5 rounded-lg border border-stone-700 text-[10px] font-black uppercase tracking-widest gap-2"
          >
            <ArrowLeft size={14} /> <span className="hidden sm:inline">Retour</span>
          </button>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-stone-900">
          <div className="max-w-5xl mx-auto pb-10">
            {activeSection === "dashboard" && <GMDashboard state={state} />}
            {activeSection === "accounts" && <GMAccounts state={state} onUpdateState={onUpdateState} notify={notify} />}
            {activeSection === "lore" && <GMLore state={state} onUpdateState={onUpdateState} notify={notify} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default GameMasterView;
