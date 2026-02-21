import React, { useState, useMemo } from "react";
import {
  UserPlus,
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
  Edit3,
  Calendar,
  Coins,
  Gavel,
  Crown,
  TrendingUp,
  AlertTriangle,
  Globe,
  Landmark,
  RefreshCw,
  Banknote,
  Lock,
  Unlock,
  Swords,
  HeartHandshake,
  Mail,
  Plane,
  ShieldAlert,
  ShoppingBag,
} from "lucide-react";
import { ROLES, BASE_STATUSES } from "../../lib/constants";

/* ================================================
   HELPERS
   ================================================ */
const Badge = ({ children, color = "stone" }) => {
  const map = {
    green: "bg-green-900/30 text-green-400 border-green-800/40",
    red: "bg-red-900/30 text-red-400 border-red-800/40",
    yellow: "bg-yellow-900/30 text-yellow-400 border-yellow-800/40",
    orange: "bg-orange-900/30 text-orange-400 border-orange-800/40",
    blue: "bg-blue-900/30 text-blue-400 border-blue-800/40",
    purple: "bg-purple-900/30 text-purple-400 border-purple-800/40",
    stone: "bg-stone-800 text-stone-400 border-stone-700",
  };
  return (
    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${map[color] || map.stone}`}>
      {children}
    </span>
  );
};

const statusColor = (s) =>
  s === "Actif" ? "green" : s === "Esclave" ? "red" : s === "Prisonnier" ? "orange" : s === "Banni" ? "stone" : "yellow";

const Label = ({ children }) => (
  <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">{children}</label>
);

const Input = (props) => (
  <input {...props} className={`w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-red-500/50 ${props.className || ""}`} />
);

const Select = ({ children, ...props }) => (
  <select {...props} className={`w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-red-500/50 ${props.className || ""}`}>
    {children}
  </select>
);

const BtnPrimary = ({ children, onClick, disabled, className = "" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`py-2.5 bg-red-900/50 border border-red-800/50 text-red-300 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-900/70 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none ${className}`}
  >
    {children}
  </button>
);

const BtnSecondary = ({ children, onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 bg-stone-800 text-stone-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-stone-700 hover:text-stone-200 transition-all ${className}`}
  >
    {children}
  </button>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-stone-900 border border-stone-800 rounded-xl ${className}`}>{children}</div>
);

const SectionTitle = ({ icon: Icon, children }) => (
  <h2 className="text-lg font-black uppercase tracking-widest text-stone-200 flex items-center gap-3 font-serif">
    <Icon size={20} className="text-red-400" />
    {children}
  </h2>
);

const clip = (text, notify) => {
  navigator.clipboard.writeText(text).then(() => notify("Copie.", "success")).catch(() => {});
};

const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-start gap-3 py-2">
    <button
      onClick={() => onChange(!checked)}
      className={`mt-0.5 w-9 h-5 rounded-full transition-all duration-200 flex items-center shrink-0 ${
        checked ? "bg-red-600 justify-end" : "bg-stone-700 justify-start"
      }`}
    >
      <span className={`block w-4 h-4 rounded-full mx-0.5 transition-all ${checked ? "bg-white" : "bg-stone-500"}`} />
    </button>
    <div className="min-w-0">
      <div className="text-xs font-bold text-stone-200">{label}</div>
      {description && <div className="text-[10px] text-stone-500 mt-0.5">{description}</div>}
    </div>
  </div>
);

/* ================================================
   1. DASHBOARD
   ================================================ */
const GMDashboard = ({ state }) => {
  const citizens = state.citizens || [];
  const countries = state.countries || [];
  const companies = state.companies || [];
  const ledger = state.globalLedger || [];

  const totalCitizenWealth = citizens.reduce((s, c) => s + (c.balance || 0), 0);
  const totalCountryWealth = countries.reduce((s, c) => s + (c.treasury || 0), 0);
  const totalCompanyWealth = companies.reduce((s, c) => s + (c.balance || 0), 0);
  const totalWealth = (state.treasury || 0) + totalCitizenWealth + totalCountryWealth + totalCompanyWealth;

  const stats = [
    { label: "Citoyens", value: citizens.length, color: "text-blue-400", icon: Users },
    { label: "Pays", value: countries.length, color: "text-emerald-400", icon: Globe },
    { label: "Entreprises", value: companies.length, color: "text-purple-400", icon: Landmark },
    { label: "Tresor Imperial", value: `${(state.treasury || 0).toLocaleString()} E`, color: "text-yellow-400", icon: Crown },
    { label: "Cycle de jeu", value: state.dayCycle || 0, color: "text-stone-300", icon: RefreshCw },
    { label: "Date RP", value: state.gameDate ? `${state.gameDate.day}/${state.gameDate.month}/${state.gameDate.year}` : "\u2014", color: "text-stone-200", icon: Calendar },
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

  const alerts = [];
  const prisoners = citizens.filter((c) => c.status === "Prisonnier").length;
  const slaves = citizens.filter((c) => c.status === "Esclave").length;
  const banned = citizens.filter((c) => c.status === "Banni").length;
  const sick = citizens.filter((c) => c.status === "Malade").length;
  if (prisoners > 0) alerts.push({ text: `${prisoners} prisonnier${prisoners > 1 ? "s" : ""}`, color: "text-orange-400" });
  if (slaves > 0) alerts.push({ text: `${slaves} esclave${slaves > 1 ? "s" : ""}`, color: "text-red-400" });
  if (banned > 0) alerts.push({ text: `${banned} banni${banned > 1 ? "s" : ""}`, color: "text-stone-400" });
  if (sick > 0) alerts.push({ text: `${sick} malade${sick > 1 ? "s" : ""}`, color: "text-yellow-400" });

  const recentLedger = ledger.slice(-8).reverse();

  const topWealth = [...citizens].sort((a, b) => (b.balance || 0) - (a.balance || 0)).slice(0, 5);

  return (
    <div className="space-y-6">
      <SectionTitle icon={LayoutDashboard}>Tableau de Bord</SectionTitle>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={12} className="text-stone-600" />
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">{s.label}</span>
            </div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Economy total + Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
            <TrendingUp size={12} /> Masse monetaire totale
          </div>
          <div className="text-2xl font-black text-yellow-400 mb-3">{totalWealth.toLocaleString()} E</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>Tresor Imperial</span><span className="font-mono text-stone-300">{(state.treasury || 0).toLocaleString()} E</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Citoyens</span><span className="font-mono text-stone-300">{totalCitizenWealth.toLocaleString()} E</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Pays</span><span className="font-mono text-stone-300">{totalCountryWealth.toLocaleString()} E</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Entreprises</span><span className="font-mono text-stone-300">{totalCompanyWealth.toLocaleString()} E</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
            <AlertTriangle size={12} /> Alertes & statuts
          </div>
          {alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm font-bold ${a.color}`}>
                  <ShieldAlert size={14} /> {a.text}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-stone-600 text-sm">Aucune alerte active.</div>
          )}
          {topWealth.length > 0 && (
            <div className="mt-4 pt-3 border-t border-stone-800">
              <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-2">Top fortunes</div>
              {topWealth.map((c) => (
                <div key={c.id} className="flex justify-between text-xs py-0.5">
                  <span className="text-stone-400 truncate">{c.name}</span>
                  <span className="font-mono text-yellow-500 shrink-0 ml-2">{(c.balance || 0).toLocaleString()} E</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Role + Status distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Repartition des Roles</h3>
          <div className="space-y-2">
            {Object.entries(roleDistribution).sort((a, b) => b[1] - a[1]).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-xs text-stone-300 truncate mr-2">{role}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-20 bg-stone-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-red-500/60 h-full rounded-full" style={{ width: `${(count / citizens.length) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Repartition des Statuts</h3>
          <div className="space-y-2">
            {Object.entries(statusDistribution).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
              const color = status === "Actif" ? "bg-green-500/60" : status === "Esclave" ? "bg-red-500/60" : status === "Prisonnier" ? "bg-orange-500/60" : status === "Banni" ? "bg-stone-500/60" : "bg-yellow-500/60";
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
        </Card>
      </div>

      {/* Recent ledger */}
      {recentLedger.length > 0 && (
        <Card className="p-5">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
            <Banknote size={12} /> Transactions recentes
          </h3>
          <div className="space-y-1.5">
            {recentLedger.map((e, i) => (
              <div key={e.id || i} className="flex items-center justify-between text-xs py-1 border-b border-stone-800/50 last:border-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-stone-500 font-mono text-[9px] shrink-0">{new Date(e.timestamp).toLocaleDateString("fr-FR")}</span>
                  <span className="text-stone-400 truncate">{e.fromName || "?"} &rarr; {e.toName || "?"}</span>
                </div>
                <span className="font-mono font-bold text-yellow-500 shrink-0 ml-2">{(e.amount || 0).toLocaleString()} E</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

/* ================================================
   2. ACCOUNTS
   ================================================ */
const GMAccounts = ({ state, onUpdateState, notify }) => {
  const [view, setView] = useState("list");
  const [form, setForm] = useState({
    name: "", age: 20, role: "CITOYEN",
    countryId: state.countries?.[0]?.id || "C1",
    password: "", balance: 100, occupation: "", status: "Actif",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [createdAccount, setCreatedAccount] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const safeCountries = Array.isArray(state.countries) ? state.countries : [];
  const safeCitizens = Array.isArray(state.citizens) ? state.citizens : [];

  const generateId = () => {
    const num = String(safeCitizens.length + 1).padStart(3, "0");
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `EMP-${num}-${rand}`;
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pass = "";
    for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    return pass;
  };

  const handleCreate = () => {
    if (!form.name.trim()) { notify("Le nom est requis.", "error"); return; }
    if (!form.password.trim()) { notify("Le mot de passe est requis.", "error"); return; }
    if (safeCitizens.find((c) => c.name.toLowerCase() === form.name.trim().toLowerCase())) {
      notify("Ce nom existe deja.", "error"); return;
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
    notify(`Compte "${form.name.trim()}" cree.`, "success");
    setForm({ name: "", age: 20, role: "CITOYEN", countryId: state.countries?.[0]?.id || "C1", password: "", balance: 100, occupation: "", status: "Actif" });
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditForm({ name: c.name, age: c.age || 20, role: c.role, countryId: c.countryId, password: c.password || "", balance: c.balance || 0, occupation: c.occupation || "", status: c.status || "Actif" });
  };

  const saveEdit = () => {
    if (!editForm.name?.trim()) { notify("Le nom est requis.", "error"); return; }
    const dup = safeCitizens.find((c) => c.id !== editingId && c.name.toLowerCase() === editForm.name.trim().toLowerCase());
    if (dup) { notify("Ce nom existe deja.", "error"); return; }
    const updated = safeCitizens.map((c) =>
      c.id === editingId
        ? { ...c, name: editForm.name.trim(), age: parseInt(editForm.age) || c.age, role: editForm.role, countryId: editForm.countryId, password: editForm.password || c.password, balance: parseInt(editForm.balance), occupation: editForm.occupation, status: editForm.status }
        : c
    );
    onUpdateState({ ...state, citizens: updated });
    notify("Compte mis a jour.", "success");
    setEditingId(null);
  };

  const deleteCitizen = (id) => {
    onUpdateState({ ...state, citizens: safeCitizens.filter((c) => c.id !== id) });
    notify("Compte supprime.", "info");
    setConfirmDeleteId(null);
    setEditingId(null);
  };

  const filtered = useMemo(() => {
    return safeCitizens.filter((c) => {
      if (filterStatus !== "ALL" && (c.status || "Actif") !== filterStatus) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return c.name?.toLowerCase().includes(s) || c.id?.toLowerCase().includes(s);
    });
  }, [safeCitizens, search, filterStatus]);

  const statusCounts = useMemo(() => {
    const m = { ALL: safeCitizens.length };
    safeCitizens.forEach((c) => { const s = c.status || "Actif"; m[s] = (m[s] || 0) + 1; });
    return m;
  }, [safeCitizens]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <SectionTitle icon={Users}>Gestion des Comptes</SectionTitle>
        <button
          onClick={() => { setView(view === "create" ? "list" : "create"); setCreatedAccount(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            view === "create" ? "bg-stone-800 text-stone-300 hover:bg-stone-700" : "bg-red-900/50 border border-red-800/50 text-red-300 hover:bg-red-900/70"
          }`}
        >
          {view === "create" ? <><ArrowLeft size={14} /> Liste</> : <><Plus size={14} /> Nouveau</>}
        </button>
      </div>

      {/* CREATE VIEW */}
      {view === "create" && (
        <Card className="p-6 space-y-5 max-w-xl">
          {createdAccount && (
            <div className="bg-green-900/20 border border-green-800/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-400 text-xs font-black uppercase tracking-widest">
                <CheckCircle size={14} /> Compte cree
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-[9px] text-stone-500 uppercase tracking-widest block">Identifiant</span>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-200 font-mono font-bold">{createdAccount.id}</span>
                    <button onClick={() => clip(createdAccount.id, notify)} className="text-stone-500 hover:text-white"><Copy size={12} /></button>
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
                    <button onClick={() => clip(createdAccount.password, notify)} className="text-stone-500 hover:text-white"><Copy size={12} /></button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => clip(`Identifiant: ${createdAccount.id}\nNom: ${createdAccount.name}\nMot de passe: ${createdAccount.password}`, notify)}
                className="w-full mt-2 py-2 bg-green-800/30 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-green-800/50 transition-all flex items-center justify-center gap-2"
              >
                <Copy size={12} /> Copier tout
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label>Nom complet</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom du citoyen..." />
            </div>
            <div>
              <Label>Mot de passe</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Sceau..." className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <BtnSecondary onClick={() => setForm({ ...form, password: generatePassword() })}>Generer</BtnSecondary>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Age</Label><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} min="1" max="120" /></div>
              <div><Label>Solde (Ecus)</Label><Input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} min="0" /></div>
            </div>
            <div><Label>Role</Label><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{Object.entries(ROLES).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}</Select></div>
            <div><Label>Pays</Label><Select value={form.countryId} onChange={(e) => setForm({ ...form, countryId: e.target.value })}>{safeCountries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <div><Label>Occupation</Label><Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="Metier..." /></div>
            <div><Label>Statut</Label><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{(BASE_STATUSES || ["Actif", "Esclave", "Prisonnier", "Malade", "Banni"]).map((s) => <option key={s} value={s}>{s}</option>)}</Select></div>
            <BtnPrimary onClick={handleCreate} className="w-full"><UserPlus size={16} /> Creer le compte</BtnPrimary>
          </div>
        </Card>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-stone-900 border border-stone-800 rounded-lg text-sm text-stone-200 outline-none focus:border-stone-600" placeholder="Rechercher un citoyen..." />
          </div>

          {/* Status filter chips */}
          <div className="flex gap-1.5 flex-wrap">
            {["ALL", ...Object.keys(statusCounts).filter((k) => k !== "ALL")].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                  filterStatus === s ? "bg-red-900/50 text-red-300 border-red-800/50" : "bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-300"
                }`}
              >
                {s === "ALL" ? "Tous" : s} ({statusCounts[s] || 0})
              </button>
            ))}
          </div>

          <div className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">
            {filtered.length} compte{filtered.length > 1 ? "s" : ""}
          </div>

          {/* Citizen cards */}
          <div className="space-y-2">
            {filtered.map((c) => {
              const roleLabel = ROLES[c.role]?.label || c.role;
              const country = safeCountries.find((ct) => ct.id === c.countryId);
              const isEditing = editingId === c.id;
              const isDeleting = confirmDeleteId === c.id;

              return (
                <Card key={c.id} className={`overflow-hidden transition-all ${isEditing ? "border-red-800/60" : "hover:border-stone-600"}`}>
                  {/* Main row */}
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0 overflow-hidden">
                      {c.avatarUrl ? <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-stone-500 text-xs font-black">{(c.name || "?")[0]}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-stone-200 truncate">{c.name}</span>
                        <Badge color={statusColor(c.status)}>{c.status || "Actif"}</Badge>
                      </div>
                      <div className="text-[10px] text-stone-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="font-mono">{c.id}</span>
                        <span className="text-stone-700">|</span>
                        <span>{roleLabel}</span>
                        {country && <><span className="text-stone-700">|</span><span>{country.name}</span></>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-yellow-500">{(c.balance || 0).toLocaleString()} E</div>
                      <div className="text-[9px] text-stone-600 font-mono mt-0.5">mdp: {c.password || "???"}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => clip(`ID: ${c.id}\nMDP: ${c.password}`, notify)} className="text-stone-600 hover:text-stone-300 p-1.5 rounded hover:bg-stone-800 transition-all" title="Copier identifiants"><Copy size={14} /></button>
                      <button onClick={() => isEditing ? setEditingId(null) : startEdit(c)} className={`p-1.5 rounded transition-all ${isEditing ? "text-red-400 bg-red-900/20" : "text-stone-600 hover:text-stone-300 hover:bg-stone-800"}`} title="Modifier"><Edit3 size={14} /></button>
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="border-t border-stone-800 p-4 bg-stone-950/50 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div><Label>Nom</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
                        <div><Label>Mot de passe</Label><Input value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} /></div>
                        <div><Label>Role</Label><Select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select></div>
                        <div><Label>Pays</Label><Select value={editForm.countryId} onChange={(e) => setEditForm({ ...editForm, countryId: e.target.value })}>{safeCountries.map((ct) => <option key={ct.id} value={ct.id}>{ct.name}</option>)}</Select></div>
                        <div><Label>Statut</Label><Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>{(BASE_STATUSES || ["Actif", "Esclave", "Prisonnier", "Malade", "Banni"]).map((s) => <option key={s} value={s}>{s}</option>)}</Select></div>
                        <div><Label>Solde</Label><Input type="number" value={editForm.balance} onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })} /></div>
                        <div><Label>Occupation</Label><Input value={editForm.occupation} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })} /></div>
                        <div><Label>Age</Label><Input type="number" value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} /></div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <BtnPrimary onClick={saveEdit} className="flex-1"><Save size={14} /> Sauvegarder</BtnPrimary>
                        <BtnSecondary onClick={() => setEditingId(null)}><X size={14} /></BtnSecondary>
                        {isDeleting ? (
                          <button onClick={() => deleteCitizen(c.id)} className="px-3 py-2 bg-red-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all">Confirmer</button>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(c.id)} className="p-2 text-red-500/50 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all" title="Supprimer"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-stone-600">
                <Users size={32} className="mx-auto mb-3 opacity-50" />
                <div className="text-sm font-bold">Aucun citoyen trouve</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ================================================
   3. LORE
   ================================================ */
const GMLore = ({ state, onUpdateState, notify }) => {
  const loreEntries = state.lore || [];
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", category: "Histoire", content: "" });
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");

  const categories = ["Histoire", "Geographie", "Religion", "Politique", "Culture", "Bestiaire", "Magie", "Autre"];
  const categoryColors = {
    Histoire: "bg-amber-900/30 text-amber-400 border-amber-800/50",
    "Geographie": "bg-emerald-900/30 text-emerald-400 border-emerald-800/50",
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
      updated = [{ id: `lore_${Date.now()}`, title: form.title.trim(), category: form.category, content: form.content, createdAt: Date.now(), updatedAt: Date.now() }, ...loreEntries];
    }
    onUpdateState({ ...state, lore: updated });
    notify(editing ? "Article mis a jour." : "Article cree.", "success");
    setForm({ title: "", category: "Histoire", content: "" });
    setEditing(null);
  };

  const handleDelete = (id) => {
    onUpdateState({ ...state, lore: loreEntries.filter((e) => e.id !== id) });
    notify("Article supprime.", "info");
  };

  const startLoreEdit = (entry) => {
    setEditing(entry.id);
    setForm({ title: entry.title, category: entry.category, content: entry.content });
  };

  const [filterCat, setFilterCat] = useState("ALL");

  const filtered = useMemo(() => {
    let list = filterCat === "ALL" ? loreEntries : loreEntries.filter((e) => e.category === filterCat);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((e) => e.title?.toLowerCase().includes(s) || e.content?.toLowerCase().includes(s));
    }
    return list;
  }, [loreEntries, filterCat, search]);

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <SectionTitle icon={BookOpen}>Lore & Univers</SectionTitle>

      {/* Editor */}
      <Card className="p-5 space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-2">
          {editing ? <><Save size={12} /> Modifier l&apos;article</> : <><Plus size={12} /> Nouvel article</>}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titre de l'article..." /></div>
          <div><Label>Categorie</Label><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</Select></div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label>Contenu</Label>
            <span className="text-[9px] text-stone-600 font-mono">{wordCount} mot{wordCount > 1 ? "s" : ""}</span>
          </div>
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50 min-h-[160px] font-serif" placeholder="Ecrivez votre article de lore ici..." />
        </div>
        <div className="flex gap-2">
          {editing && <BtnSecondary onClick={() => { setEditing(null); setForm({ title: "", category: "Histoire", content: "" }); }}>Annuler</BtnSecondary>}
          <BtnPrimary onClick={handleSave} className="flex-1">
            {editing ? <><Save size={14} /> Sauvegarder</> : <><Plus size={14} /> Ajouter</>}
          </BtnPrimary>
        </div>
      </Card>

      {/* Search + Filters */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-stone-900 border border-stone-800 rounded-lg text-sm text-stone-200 outline-none focus:border-stone-600" placeholder="Rechercher dans le lore..." />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat("ALL")} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${filterCat === "ALL" ? "bg-red-900/50 text-red-300 border-red-800/50" : "bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-300"}`}>
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
          <div className="text-[10px] mt-1">Commencez a construire l&apos;univers de votre jeu.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <Card key={entry.id} className={`overflow-hidden hover:border-stone-700 transition-all`}>
              <button onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)} className="w-full text-left p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${categoryColors[entry.category] || categoryColors.Autre}`}>{entry.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-stone-200 font-serif">{entry.title}</h4>
                  {expandedId !== entry.id && <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">{entry.content}</p>}
                </div>
                {expandedId === entry.id ? <ChevronUp size={16} className="text-stone-500 shrink-0 mt-1" /> : <ChevronDown size={16} className="text-stone-500 shrink-0 mt-1" />}
              </button>
              {expandedId === entry.id && (
                <div className="px-4 pb-4 border-t border-stone-800 pt-3">
                  <div className="text-sm text-stone-300 whitespace-pre-wrap font-serif leading-relaxed mb-4">{entry.content}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] text-stone-600 font-mono">Modifie le {new Date(entry.updatedAt || entry.createdAt).toLocaleDateString("fr-FR")}</div>
                    <div className="flex gap-2">
                      <BtnSecondary onClick={() => startLoreEdit(entry)}>Modifier</BtnSecondary>
                      <button onClick={() => handleDelete(entry.id)} className="px-3 py-1.5 bg-stone-800 text-red-500 text-[9px] font-black uppercase tracking-widest rounded hover:bg-red-900/30 transition-all"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

/* ================================================
   4. LOIS & NATIONS
   ================================================ */
const LAW_CATEGORIES = [
  {
    label: "Commerce & Administration",
    icon: ShoppingBag,
    laws: [
      { key: "allowExternalDebits", label: "Prelevements externes", desc: "Autorise les prelevements par des admins d'autres pays" },
      { key: "allowLocalConfiscation", label: "Confiscation locale", desc: "Autorise la confiscation locale des fonds" },
      { key: "allowLocalSales", label: "Ventes locales", desc: "Autorise la mise en vente locale d'objets ou sujets" },
      { key: "allowPermissionEditsByLocalAdmins", label: "Edition des permissions", desc: "Permet aux admins locaux de modifier les permissions" },
      { key: "requireRulerApprovalForSales", label: "Approbation du souverain", desc: "Necessite l'approbation du souverain pour les ventes" },
    ],
  },
  {
    label: "Economie & Banque",
    icon: Coins,
    laws: [
      { key: "taxForeignTransfers", label: "Taxe etrangere (10%)", desc: "Taxe appliquee aux virements entrants depuis un autre pays" },
      { key: "freezeAssets", label: "Gel des avoirs", desc: "Interdit aux citoyens de retirer ou transferer des fonds" },
      { key: "closedCurrency", label: "Devise fermee", desc: "Seuls les residents peuvent recevoir de l'argent" },
    ],
  },
  {
    label: "Frontieres & Voyage",
    icon: Plane,
    laws: [
      { key: "closeBorders", label: "Fermer les frontieres", desc: "Rejette automatiquement les nouvelles demandes de visa" },
      { key: "forbidExit", label: "Interdire la sortie", desc: "Interdit les demandes de visa de sortie" },
    ],
  },
  {
    label: "Societe",
    icon: HeartHandshake,
    laws: [
      { key: "allowSelfManumission", label: "Auto-affranchissement", desc: "Permet a un esclave de s'acheter sa liberte" },
      { key: "militaryServitude", label: "Servitude militaire", desc: "Transforme la main d'oeuvre en servitude militaire" },
      { key: "banPublicSlaveMarket", label: "Interdire marche d'esclaves", desc: "Interdit la mise en vente publique des esclaves" },
    ],
  },
  {
    label: "Justice & Securite",
    icon: Swords,
    laws: [
      { key: "allowWeapons", label: "Autoriser les armes", desc: "Si desactive, la possession d'armes est illegale" },
      { key: "mailCensorship", label: "Censure du courrier", desc: "Le courrier peut etre censure / consulte localement" },
    ],
  },
];

const GMLois = ({ state, onUpdateState, notify }) => {
  const countries = state.countries || [];
  const [selectedId, setSelectedId] = useState(countries[0]?.id || null);
  const country = countries.find((c) => c.id === selectedId);

  const toggleLaw = (key) => {
    if (!country) return;
    const newCountries = countries.map((c) =>
      c.id === selectedId ? { ...c, laws: { ...c.laws, [key]: !c.laws?.[key] } } : c
    );
    onUpdateState({ ...state, countries: newCountries });
    notify(`Loi mise a jour.`, "success");
  };

  const setLawValue = (key, value) => {
    if (!country) return;
    const newCountries = countries.map((c) =>
      c.id === selectedId ? { ...c, laws: { ...c.laws, [key]: value } } : c
    );
    onUpdateState({ ...state, countries: newCountries });
  };

  const updateCountryField = (field, value) => {
    if (!country) return;
    const newCountries = countries.map((c) =>
      c.id === selectedId ? { ...c, [field]: value } : c
    );
    onUpdateState({ ...state, countries: newCountries });
    notify("Pays mis a jour.", "success");
  };

  const laws = country?.laws || {};
  const activeLawCount = LAW_CATEGORIES.reduce((sum, cat) => sum + cat.laws.filter((l) => !!laws[l.key]).length, 0);

  return (
    <div className="space-y-5">
      <SectionTitle icon={Gavel}>Lois & Nations</SectionTitle>

      {/* Country tabs */}
      {countries.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {countries.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                selectedId === c.id ? "bg-red-900/50 text-red-300 border-red-800/50" : "bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-300"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {country ? (
        <>
          {/* Country header card */}
          <Card className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-lg font-black text-stone-200 font-serif">{country.name}</div>
                <div className="text-[10px] text-stone-500 mt-0.5">
                  {country.rulerName || "Sans souverain"} &middot; {activeLawCount} loi{activeLawCount > 1 ? "s" : ""} active{activeLawCount > 1 ? "s" : ""}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[9px] font-black uppercase text-stone-500 tracking-widest">Tresor</div>
                  <div className="text-lg font-black text-yellow-400">{(country.treasury || 0).toLocaleString()} E</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Special inputs */}
          <Card className="p-5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-2">
              <HeartHandshake size={12} /> Mariage & Frontieres
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Structure du mariage</Label>
                <Select value={laws.marriageStructure || "monogamie"} onChange={(e) => setLawValue("marriageStructure", e.target.value)}>
                  <option value="monogamie">Monogamie</option>
                  <option value="polygamie">Polygamie</option>
                  <option value="polyandrie">Polyandrie</option>
                  <option value="polyamour">Polyamour</option>
                </Select>
              </div>
              <div>
                <Label>Age minimum mariage</Label>
                <Input type="number" value={laws.marriageMinAge || 16} onChange={(e) => setLawValue("marriageMinAge", parseInt(e.target.value) || 16)} min="0" max="100" />
              </div>
              <div>
                <Label>Frais de visa (Ecus)</Label>
                <Input type="number" value={laws.entryVisaFee || 0} onChange={(e) => setLawValue("entryVisaFee", parseInt(e.target.value) || 0)} min="0" />
              </div>
            </div>
          </Card>

          {/* Law toggles by category */}
          {LAW_CATEGORIES.map((cat) => (
            <Card key={cat.label} className="p-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-2">
                <cat.icon size={12} /> {cat.label}
              </h3>
              <div className="divide-y divide-stone-800/50">
                {cat.laws.map((law) => (
                  <Toggle
                    key={law.key}
                    checked={!!laws[law.key]}
                    onChange={() => toggleLaw(law.key)}
                    label={law.label}
                    description={law.desc}
                  />
                ))}
              </div>
            </Card>
          ))}
        </>
      ) : (
        <div className="text-center py-12 text-stone-600">
          <Globe size={32} className="mx-auto mb-3 opacity-50" />
          <div className="text-sm font-bold">Aucun pays configure</div>
        </div>
      )}
    </div>
  );
};

/* ================================================
   5. CALENDRIER & ECONOMIE
   ================================================ */
const GMCalendrier = ({ state, onUpdateState, notify }) => {
  const [mintAmount, setMintAmount] = useState("");
  const gd = state.gameDate || { day: 1, month: 1, year: 1200 };

  const monthNames = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];

  const advanceDate = (days) => {
    let { day, month, year } = { ...gd };
    for (let i = 0; i < days; i++) {
      day++;
      if (day > 30) { day = 1; month++; }
      if (month > 12) { month = 1; year++; }
    }
    onUpdateState({ ...state, gameDate: { day, month, year }, dayCycle: (state.dayCycle || 0) + days });
    notify(`Calendrier avance de ${days} jour${days > 1 ? "s" : ""}.`, "success");
  };

  const handleMint = () => {
    const amount = parseInt(mintAmount);
    if (!amount || amount <= 0) { notify("Montant invalide.", "error"); return; }
    const entry = {
      id: `ledger_${Date.now()}`,
      fromName: "Hotel des Monnaies",
      fromId: "MINT",
      toName: "Tresor Imperial",
      toId: "GLOBAL",
      amount,
      timestamp: Date.now(),
      type: "MINT",
    };
    onUpdateState({
      ...state,
      treasury: (state.treasury || 0) + amount,
      globalLedger: [...(state.globalLedger || []), entry],
    });
    setMintAmount("");
    notify(`${amount.toLocaleString()} Ecus frappes et ajoutes au Tresor Imperial.`, "success");
  };

  const activeContracts = (state.jobContracts || []).filter((j) => j.active);
  const season = gd.month <= 3 ? "Hiver" : gd.month <= 6 ? "Printemps" : gd.month <= 9 ? "Ete" : "Automne";

  return (
    <div className="space-y-6">
      <SectionTitle icon={Calendar}>Calendrier & Economie</SectionTitle>

      {/* Date display */}
      <Card className="p-6">
        <div className="text-center">
          <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-2">Date actuelle du jeu de role</div>
          <div className="text-4xl font-black text-stone-100 font-serif mb-1">
            {gd.day} {monthNames[(gd.month - 1) % 12]} {gd.year}
          </div>
          <div className="text-sm text-stone-500">
            {season} &middot; Cycle {state.dayCycle || 0}
          </div>
        </div>
        <div className="flex gap-3 justify-center mt-5">
          <BtnPrimary onClick={() => advanceDate(1)} className="px-6">
            <Calendar size={14} /> +1 Jour
          </BtnPrimary>
          <BtnSecondary onClick={() => advanceDate(7)}>+7 Jours</BtnSecondary>
          <BtnSecondary onClick={() => advanceDate(30)}>+30 Jours</BtnSecondary>
        </div>
      </Card>

      {/* Mint */}
      <Card className="p-5">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
          <Coins size={12} /> Frapper de la monnaie
        </h3>
        <div className="flex items-center gap-2 text-sm text-stone-400 mb-3">
          <Crown size={14} className="text-yellow-500" />
          Tresor Imperial actuel : <span className="font-bold text-yellow-400">{(state.treasury || 0).toLocaleString()} E</span>
        </div>
        <div className="flex gap-2">
          <Input type="number" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} placeholder="Montant a frapper..." min="1" className="flex-1" />
          <BtnPrimary onClick={handleMint} className="px-6" disabled={!mintAmount || parseInt(mintAmount) <= 0}>
            <Coins size={14} /> Frapper
          </BtnPrimary>
        </div>
      </Card>

      {/* Active job contracts */}
      <Card className="p-5">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
          <Banknote size={12} /> Contrats de travail actifs
        </h3>
        {activeContracts.length > 0 ? (
          <div className="space-y-2">
            {activeContracts.map((j) => (
              <div key={j.id} className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg border border-stone-800">
                <div>
                  <div className="text-sm font-bold text-stone-200">{j.name}</div>
                  <div className="text-[10px] text-stone-500">{j.frequency} &middot; {j.recipients?.length || 0} beneficiaire{(j.recipients?.length || 0) > 1 ? "s" : ""}</div>
                </div>
                <div className="text-sm font-bold text-yellow-500">{(j.amount || 0).toLocaleString()} E</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-stone-600 text-sm">Aucun contrat actif.</div>
        )}
      </Card>
    </div>
  );
};

/* ================================================
   MAIN LAYOUT
   ================================================ */
const GameMasterView = ({ state, onUpdateState, notify, onClose }) => {
  const [activeSection, setActiveSection] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Vue d'Ensemble", icon: LayoutDashboard },
    { id: "accounts", label: "Comptes", icon: Users },
    { id: "lore", label: "Lore & Univers", icon: BookOpen },
    { id: "lois", label: "Lois & Nations", icon: Gavel },
    { id: "calendrier", label: "Calendrier", icon: Calendar },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-stone-950 font-sans text-stone-200">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-stone-900 border-r border-stone-800 z-30 shrink-0 shadow-2xl">
        <div className="p-6 pb-5 flex flex-col items-center border-b border-stone-800/50 bg-stone-900/50">
          <div className="w-14 h-14 rounded-xl bg-red-900/20 border-2 border-red-800/40 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(220,38,38,0.1)]">
            <Shield size={28} className="text-red-400" />
          </div>
          <h1 className="text-sm font-black uppercase tracking-[0.2em] text-red-400">Game Master</h1>
          <div className="text-[9px] text-stone-500 uppercase tracking-widest mt-1">Maitre du Jeu — HRP</div>
        </div>

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
              <item.icon size={18} className={activeSection === item.id ? "text-red-400" : "text-stone-500 group-hover:text-stone-300"} />
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-800 space-y-2">
          <button onClick={onClose} className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-stone-800 text-stone-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-stone-700 hover:border-stone-600">
            <ArrowLeft size={16} /> Retour au Jeu
          </button>
          <div className="text-center opacity-30 pt-2">
            <Shield className="mx-auto mb-1 text-red-600" size={18} />
            <div className="text-[8px] uppercase tracking-[0.2em] font-black text-stone-600">Interface HRP</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-stone-900/95 backdrop-blur border-b border-stone-800 flex items-center justify-between px-4 md:px-8 shadow-xl shrink-0 z-20">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-red-400" />
            <span className="text-xs font-black uppercase tracking-widest text-red-400">Game Master</span>
          </div>
          <div className="flex gap-1.5 md:hidden overflow-x-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`p-2 rounded-lg transition-all shrink-0 ${
                  activeSection === item.id ? "bg-red-900/30 text-red-400" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <item.icon size={18} />
              </button>
            ))}
          </div>
          <button onClick={onClose} className="bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-all flex items-center justify-center px-3 py-1.5 rounded-lg border border-stone-700 text-[10px] font-black uppercase tracking-widest gap-2">
            <ArrowLeft size={14} /> <span className="hidden sm:inline">Retour</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-stone-900">
          <div className="max-w-5xl mx-auto pb-10">
            {activeSection === "dashboard" && <GMDashboard state={state} />}
            {activeSection === "accounts" && <GMAccounts state={state} onUpdateState={onUpdateState} notify={notify} />}
            {activeSection === "lore" && <GMLore state={state} onUpdateState={onUpdateState} notify={notify} />}
            {activeSection === "lois" && <GMLois state={state} onUpdateState={onUpdateState} notify={notify} />}
            {activeSection === "calendrier" && <GMCalendrier state={state} onUpdateState={onUpdateState} notify={notify} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default GameMasterView;
