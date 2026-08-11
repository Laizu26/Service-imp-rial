import React, { useState, useMemo, useEffect } from "react";
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
  Baby,
  CheckCircle2,
  XCircle,
  ScrollText,
  HeartPulse,
  Sparkles,
  Activity,
  Dna,
} from "lucide-react";
import { ROLES, BASE_STATUSES, DEFAULT_RACE_CONFIG } from "../../lib/constants";
import { getCitizenAge, ageToBirthDate, formatRPDate, formatMoney, formatMoneyShort, rollIllnessInstance, applyIllnessToCitizen, clearIllnessFromCitizen } from "../../lib/gameUtils";

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
    { label: "Tresor Imperial", value: `${formatMoneyShort((state.treasury || 0))}`, color: "text-yellow-400", icon: Crown },
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
          <div className="text-2xl font-black text-yellow-400 mb-3">{formatMoneyShort(totalWealth)}</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>Tresor Imperial</span><span className="font-mono text-stone-300">{formatMoneyShort((state.treasury || 0))}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Citoyens</span><span className="font-mono text-stone-300">{formatMoneyShort(totalCitizenWealth)}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Pays</span><span className="font-mono text-stone-300">{formatMoneyShort(totalCountryWealth)}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Entreprises</span><span className="font-mono text-stone-300">{formatMoneyShort(totalCompanyWealth)}</span>
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
                  <span className="font-mono text-yellow-500 shrink-0 ml-2">{formatMoneyShort((c.balance || 0))}</span>
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
                <span className="font-mono font-bold text-yellow-500 shrink-0 ml-2">{formatMoneyShort((e.amount || 0))}</span>
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

// Restrictions applicables via la Bague Impériale
const BAGUE_RESTRICTIONS_CONFIG = [
  { id: "magie_coupee",  label: "Accès à la magie coupé",          desc: "Le flux magique du porteur est supprimé." },
  { id: "malade",        label: "Rendre malade",                    desc: "Maladie chronique inexpliquée." },
  { id: "incontinent",   label: "Rendre incontinent",               desc: "Troubles vésicaux persistants." },
  { id: "impuissant",    label: "Rendre impuissant",                desc: "Dysfonction intime d'origine inconnue." },
  { id: "fatigue",       label: "Fatigue chronique sévère",         desc: "Épuisement résistant au repos." },
  { id: "douleurs",      label: "Douleurs diffuses inexpliquées",   desc: "Douleurs sans traumatisme apparent." },
];

// États temporaires gérés par les MJs (visibles côté joueur)
const STATUS_EFFECTS_CONFIG = {
  physique: [
    { id: "fatigue_legere",   label: "Fatigué(e)",              icon: "😴", desc: "Légère fatigue, manque d'énergie.",                     badge: "bg-stone-100 text-stone-700 border-stone-300" },
    { id: "emeche",           label: "Éméché(e)",               icon: "🍷", desc: "Légèrement sous l'effet de l'alcool.",                  badge: "bg-rose-100 text-rose-700 border-rose-300" },
    { id: "alcoolise",        label: "Alcoolisé(e)",            icon: "🍺", desc: "Ivre, coordination et jugement altérés.",                badge: "bg-amber-100 text-amber-800 border-amber-300" },
    { id: "ovulation",        label: "En ovulation",            icon: "🌸", desc: "Période fertile active.",                               badge: "bg-pink-100 text-pink-700 border-pink-300" },
    { id: "enceinte",         label: "Enceinte",                icon: "🤰", desc: "Grossesse en cours.",                                   badge: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300" },
    { id: "enrhume",          label: "Enrhumé(e)",              icon: "🤧", desc: "Rhume ou infection légère des voies respiratoires.",    badge: "bg-blue-100 text-blue-700 border-blue-300" },
    { id: "fievre",           label: "Fièvre",                  icon: "🌡️", desc: "Température élevée, état fébrile.",                     badge: "bg-orange-100 text-orange-800 border-orange-300" },
    { id: "empoisonne",       label: "Empoisonné(e)",           icon: "☠️", desc: "Présence d'un poison dans l'organisme.",                badge: "bg-green-100 text-green-800 border-green-300" },
    { id: "sous_drogue",      label: "Sous substance",          icon: "💊", desc: "Sous l'emprise d'une substance altérante.",             badge: "bg-violet-100 text-violet-800 border-violet-300" },
    { id: "affaibli",         label: "Affaibli(e)",             icon: "😓", desc: "Force physique réduite, état de faiblesse générale.",   badge: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    { id: "en_rut",           label: "En rut / en chaleur",     icon: "🔥", desc: "État de pulsion physiologique intense.",                badge: "bg-red-100 text-red-700 border-red-300" },
    { id: "blessure_cachee",  label: "Blessure interne",        icon: "🩸", desc: "Blessure interne non apparente, douleur sourde.",       badge: "bg-red-100 text-red-800 border-red-300" },
    { id: "paralysie",        label: "Paralysé(e)",             icon: "🧊", desc: "Incapacité partielle ou totale à se mouvoir.",          badge: "bg-cyan-100 text-cyan-800 border-cyan-300" },
  ],
  magique: [
    { id: "sous_charme",      label: "Sous charme",             icon: "✨", desc: "Sous l'effet d'un sort de charme ou d'attrait.",        badge: "bg-pink-100 text-pink-700 border-pink-300" },
    { id: "envoute",          label: "Envoûté(e)",              icon: "🔮", desc: "Esprit influencé par une magie externe.",                badge: "bg-purple-100 text-purple-800 border-purple-300" },
    { id: "malediction",      label: "Sous malédiction",        icon: "💀", desc: "Affecté(e) par une malédiction active.",                badge: "bg-slate-100 text-slate-800 border-slate-300" },
    { id: "beni",             label: "Béni(e)",                 icon: "⭐", desc: "Protection ou faveur divine en cours.",                  badge: "bg-amber-100 text-amber-700 border-amber-300" },
    { id: "transformation",   label: "En transformation",       icon: "🐺", desc: "Processus de métamorphose physique actif.",              badge: "bg-orange-100 text-orange-800 border-orange-300" },
    { id: "possede",          label: "Possédé(e)",              icon: "👻", desc: "Entité extérieure exerçant une influence sur l'hôte.",   badge: "bg-indigo-100 text-indigo-800 border-indigo-300" },
    { id: "lien_magique",     label: "Lié(e) magiquement",      icon: "🔗", desc: "Lien magique actif avec une personne ou un objet.",      badge: "bg-teal-100 text-teal-800 border-teal-300" },
    { id: "surcharge_mana",   label: "Surcharge de mana",       icon: "⚡", desc: "Excès d'énergie magique, instabilité des sorts.",        badge: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    { id: "manque_mana",      label: "Manque de mana",          icon: "🌑", desc: "Réserves magiques épuisées, incapacité à lancer des sorts.", badge: "bg-gray-100 text-gray-700 border-gray-300" },
    { id: "vision_magique",   label: "Vision altérée (magie)",  icon: "👁️", desc: "Perception du monde altérée par un effet magique.",      badge: "bg-violet-100 text-violet-700 border-violet-300" },
  ],
};

const GMAccounts = ({ state, onUpdateState, notify, session }) => {
  const [view, setView] = useState("list");
  const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
  const defaultBirth = { day: 1, month: 1, year: gd.year - 20 };
  const [form, setForm] = useState({
    firstName: "", lastName: "", birthDay: 1, birthMonth: 1, birthYear: gd.year - 20, role: "CITOYEN",
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
    if (!form.firstName.trim()) { notify("Le prénom est requis.", "error"); return; }
    if (!form.password.trim()) { notify("Le mot de passe est requis.", "error"); return; }
    const fullName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ");
    if (safeCitizens.find((c) => c.name.toLowerCase() === fullName.toLowerCase())) {
      notify("Ce nom existe deja.", "error"); return;
    }
    const birthDate = { day: parseInt(form.birthDay) || 1, month: parseInt(form.birthMonth) || 1, year: parseInt(form.birthYear) || (gd.year - 20) };
    const newId = generateId();
    const newCitizen = {
      id: newId, firstName: form.firstName.trim(), lastName: form.lastName.trim(), name: fullName, birthDate,
      role: form.role, countryId: form.countryId, locationCountryId: form.countryId,
      password: form.password, balance: parseFloat(form.balance) || 0,
      occupation: form.occupation || "Citoyen", status: form.status,
      bio: "", avatarUrl: "", inventory: [], messages: [],
      currentPosition: "", motto: "", title: "", religion: "", origin: "",
    };
    onUpdateState({ ...state, citizens: [...safeCitizens, newCitizen] });
    setCreatedAccount({ id: newId, name: fullName, password: form.password });
    notify(`Compte "${fullName}" cree.`, "success");
    setForm({ firstName: "", lastName: "", birthDay: 1, birthMonth: 1, birthYear: gd.year - 20, role: "CITOYEN", countryId: state.countries?.[0]?.id || "C1", password: "", balance: 100, occupation: "", status: "Actif" });
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    const bd = c.birthDate || ageToBirthDate(c.age, gd);
    // Rétrocompatibilité : si firstName/lastName pas encore stockés, on split le name
    const firstName = c.firstName || (c.name || "").split(" ")[0] || "";
    const lastName  = c.lastName  || (c.name || "").split(" ").slice(1).join(" ") || "";
    setEditForm({ firstName, lastName, birthDay: bd.day, birthMonth: bd.month, birthYear: bd.year, role: c.role, countryId: c.countryId, password: c.password || "", balance: c.balance || 0, occupation: c.occupation || "", status: c.status || "Actif", bagueImperiale: c.bagueImperiale || false, bagueRestrictions: c.bagueRestrictions || [], statusEffects: c.statusEffects || [] });
  };

  const saveEdit = () => {
    if (!editForm.firstName?.trim()) { notify("Le prénom est requis.", "error"); return; }
    const fullName = [editForm.firstName.trim(), editForm.lastName.trim()].filter(Boolean).join(" ");
    const dup = safeCitizens.find((c) => c.id !== editingId && c.name.toLowerCase() === fullName.toLowerCase());
    if (dup) { notify("Ce nom existe deja.", "error"); return; }
    const birthDate = { day: parseInt(editForm.birthDay) || 1, month: parseInt(editForm.birthMonth) || 1, year: parseInt(editForm.birthYear) || (gd.year - 20) };
    const isEmperor = session?.role === "EMPEREUR";
    const updated = safeCitizens.map((c) =>
      c.id === editingId
        ? {
            ...c,
            firstName: editForm.firstName.trim(), lastName: editForm.lastName.trim(),
            name: fullName, birthDate,
            role: editForm.role, countryId: editForm.countryId,
            password: editForm.password || c.password,
            balance: parseFloat(editForm.balance),
            occupation: editForm.occupation, status: editForm.status,
            statusEffects: editForm.statusEffects || [],
            ...(isEmperor && {
              bagueImperiale: editForm.bagueImperiale || false,
              bagueRestrictions: editForm.bagueImperiale ? (editForm.bagueRestrictions || []) : [],
            }),
          }
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Prénom</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Prénom..." />
              </div>
              <div>
                <Label>Nom de famille</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Nom..." />
              </div>
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
            <div>
              <Label>Date de naissance (RP)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" step="0.1" value={form.birthDay} onChange={(e) => setForm({ ...form, birthDay: e.target.value })} min="1" max="30" placeholder="Jour" />
                <Select value={form.birthMonth} onChange={(e) => setForm({ ...form, birthMonth: e.target.value })}>
                  {["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </Select>
                <Input type="number" step="0.1" value={form.birthYear} onChange={(e) => setForm({ ...form, birthYear: e.target.value })} placeholder="Annee" />
              </div>
              <div className="text-[9px] text-stone-500 mt-1">Age : {getCitizenAge({ birthDate: { day: parseInt(form.birthDay) || 1, month: parseInt(form.birthMonth) || 1, year: parseInt(form.birthYear) || (gd.year - 20) } }, gd)} ans</div>
            </div>
            <div><Label>Solde initial (Écus)</Label><div className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-sm font-mono text-yellow-400 opacity-70 cursor-not-allowed">0 — géré par la frappe impériale</div></div>
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
                        <span className="text-stone-700">|</span>
                        <span>{getCitizenAge(c, gd)} ans</span>
                        {country && <><span className="text-stone-700">|</span><span>{country.name}</span></>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-yellow-500">{formatMoneyShort((c.balance || 0))}</div>
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
                        <div><Label>Prénom</Label><Input value={editForm.firstName || ""} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} placeholder="Prénom..." /></div>
                        <div><Label>Nom de famille</Label><Input value={editForm.lastName || ""} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} placeholder="Nom..." /></div>
                        <div><Label>Mot de passe</Label><Input value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} /></div>
                        <div><Label>Role</Label><Select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select></div>
                        <div><Label>Pays</Label><Select value={editForm.countryId} onChange={(e) => setEditForm({ ...editForm, countryId: e.target.value })}>{safeCountries.map((ct) => <option key={ct.id} value={ct.id}>{ct.name}</option>)}</Select></div>
                        <div><Label>Statut</Label><Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>{(BASE_STATUSES || ["Actif", "Esclave", "Prisonnier", "Malade", "Banni"]).map((s) => <option key={s} value={s}>{s}</option>)}</Select></div>
                        <div><Label>Solde</Label><div className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-sm font-mono text-yellow-400 opacity-70 cursor-not-allowed">{formatMoney((editForm.balance || 0))} — frappe impériale</div></div>
                        <div><Label>Occupation</Label><Input value={editForm.occupation} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })} /></div>
                        <div className="md:col-span-2">
                          <Label>Date de naissance (RP)</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <Input type="number" step="0.1" value={editForm.birthDay} onChange={(e) => setEditForm({ ...editForm, birthDay: e.target.value })} min="1" max="30" placeholder="Jour" />
                            <Select value={editForm.birthMonth} onChange={(e) => setEditForm({ ...editForm, birthMonth: e.target.value })}>
                              {["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </Select>
                            <Input type="number" value={editForm.birthYear} onChange={(e) => setEditForm({ ...editForm, birthYear: e.target.value })} placeholder="Annee" />
                          </div>
                          <div className="text-[9px] text-stone-500 mt-1">Age : {getCitizenAge({ birthDate: { day: parseInt(editForm.birthDay) || 1, month: parseInt(editForm.birthMonth) || 1, year: parseInt(editForm.birthYear) || (gd.year - 20) } }, gd)} ans</div>
                        </div>
                      </div>
                      {/* ── BAGUE IMPÉRIALE — Visible Empereur uniquement ── */}
                      {session?.role === "EMPEREUR" && (
                        <div className="md:col-span-2 border-t border-yellow-900/40 pt-3 mt-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-yellow-500 text-base">💍</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-600">Bague Impériale — Confidentiel</span>
                          </div>
                          <Toggle
                            checked={editForm.bagueImperiale || false}
                            onChange={(v) => setEditForm({ ...editForm, bagueImperiale: v, bagueRestrictions: v ? (editForm.bagueRestrictions || []) : [] })}
                            label="Porteur de la Bague Impériale"
                            description="Active le badge sur le profil et les privilèges associés."
                          />
                          {editForm.bagueImperiale && (
                            <div className="mt-3 bg-stone-950/60 border border-stone-800 rounded-lg p-3 space-y-1">
                              <div className="text-[9px] font-black uppercase tracking-widest text-red-500/80 mb-2 flex items-center gap-1">
                                <ShieldAlert size={10} /> Restrictions actives (non divulguées au porteur)
                              </div>
                              {BAGUE_RESTRICTIONS_CONFIG.map((r) => (
                                <Toggle
                                  key={r.id}
                                  checked={(editForm.bagueRestrictions || []).includes(r.id)}
                                  onChange={(v) => {
                                    const current = editForm.bagueRestrictions || [];
                                    const next = v ? [...current, r.id] : current.filter((x) => x !== r.id);
                                    setEditForm({ ...editForm, bagueRestrictions: next });
                                  }}
                                  label={r.label}
                                  description={r.desc}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── ÉTATS DU PERSONNAGE — Physique & Magique ── */}
                      <div className="border-t border-stone-800 pt-3 mt-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-base">🎭</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">États du personnage</span>
                        </div>
                        <div className="space-y-3">
                          {[
                            { key: "physique", label: "Physiques", icon: "💪" },
                            { key: "magique",  label: "Magiques",  icon: "✨" },
                          ].map(({ key, label, icon }) => (
                            <div key={key} className="bg-stone-950/60 border border-stone-800 rounded-lg p-3">
                              <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-1">
                                <span>{icon}</span> {label}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {STATUS_EFFECTS_CONFIG[key].map((eff) => {
                                  const active = (editForm.statusEffects || []).includes(eff.id);
                                  return (
                                    <button
                                      key={eff.id}
                                      type="button"
                                      title={eff.desc}
                                      onClick={() => {
                                        const current = editForm.statusEffects || [];
                                        const next = active ? current.filter((x) => x !== eff.id) : [...current, eff.id];
                                        setEditForm({ ...editForm, statusEffects: next });
                                      }}
                                      className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold transition-all ${
                                        active
                                          ? "bg-red-900/60 border-red-700 text-red-300 ring-1 ring-red-600"
                                          : "bg-stone-900 border-stone-700 text-stone-500 hover:text-stone-300 hover:border-stone-500"
                                      }`}
                                    >
                                      <span>{eff.icon}</span>
                                      <span>{eff.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                        {(editForm.statusEffects || []).length > 0 && (
                          <div className="mt-2 text-[9px] text-stone-500">
                            {(editForm.statusEffects || []).length} état{(editForm.statusEffects || []).length > 1 ? "s" : ""} actif{(editForm.statusEffects || []).length > 1 ? "s" : ""} — visibles dans la fiche physique/magie du personnage.
                          </div>
                        )}
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
      { key: "requireChildApproval", label: "Validation des filiations", desc: "Les declarations d'enfants necessitent une approbation admin avant d'etre enregistrees" },
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

/* ================================================
   PENDING CHILDREN — Admin validation panel
   ================================================ */
const GMPendingChildren = ({ state, onUpdateState, notify }) => {
  const pending = state.pendingChildren || [];
  const citizens = state.citizens || [];

  const approvePending = (req) => {
    const newCitizens = [...citizens];
    const parentIdx = newCitizens.findIndex((c) => c.id === req.requestedBy);
    if (parentIdx === -1) { notify("Parent introuvable.", "error"); return; }

    const child = req.childData;
    const parent = newCitizens[parentIdx];
    const alreadyThere = (parent.children || []).some((ch) => ch.id === child.id);
    if (!alreadyThere) {
      newCitizens[parentIdx] = { ...parent, children: [...(parent.children || []), child] };
    }

    // Ajouter aussi chez l'autre parent si connu
    if (child.otherParentId) {
      const otherIdx = newCitizens.findIndex((c) => c.id === child.otherParentId);
      if (otherIdx !== -1) {
        const other = newCitizens[otherIdx];
        if (!(other.children || []).some((ch) => ch.id === child.id)) {
          newCitizens[otherIdx] = { ...other, children: [...(other.children || []), { ...child, otherParentId: req.requestedBy }] };
        }
      }
    }

    const pendingChildren = pending.filter((p) => p.id !== req.id);
    onUpdateState({ ...state, citizens: newCitizens, pendingChildren });
    notify(`Filiation de ${child.name} validée.`, "success");
  };

  const rejectPending = (req) => {
    const pendingChildren = pending.filter((p) => p.id !== req.id);
    onUpdateState({ ...state, pendingChildren });
    notify(`Déclaration de ${req.childData.name} rejetée.`, "info");
  };

  if (pending.length === 0) return null;

  return (
    <div className="mb-4 bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400">
        <Baby size={13} /> Filiations en attente de validation ({pending.length})
      </div>
      {pending.map((req) => {
        const child = req.childData;
        const linkedCitizen = child.citizenId ? citizens.find((c) => c.id === child.citizenId) : null;
        const otherParent = child.otherParentId ? citizens.find((c) => c.id === child.otherParentId) : null;
        return (
          <div key={req.id} className="bg-stone-900 rounded-xl border border-stone-800 p-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-900/40 flex items-center justify-center border border-amber-800/50 shrink-0" style={{ width: 36, height: 36, minWidth: 36, minHeight: 36 }}>
              <Baby size={16} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="font-black text-stone-200 text-sm">{linkedCitizen?.name || child.name}</div>
              <div className="text-[9px] text-stone-500">
                Déclaré par <span className="text-stone-300 font-bold">{req.requestedByName}</span>
                {otherParent && <> · Autre parent : <span className="text-stone-300 font-bold">{otherParent.name}</span></>}
              </div>
              {child.birthDate && (
                <div className="text-[9px] text-stone-500 italic">
                  Né(e) le {formatRPDate(child.birthDate)}
                </div>
              )}
              {child.notes && (
                <div className="text-[9px] text-amber-300/70 italic">{child.notes}</div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => approvePending(req)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-green-900/40 text-green-400 text-[9px] font-black uppercase rounded-lg border border-green-800/50 hover:bg-green-900/60 transition-colors"
              >
                <CheckCircle2 size={11} /> Valider
              </button>
              <button
                onClick={() => rejectPending(req)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-900/40 text-red-400 text-[9px] font-black uppercase rounded-lg border border-red-800/50 hover:bg-red-900/60 transition-colors"
              >
                <XCircle size={11} /> Rejeter
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const GMLois = ({ state, onUpdateState, notify }) => {
  const countries = state.countries || [];
  const [selectedId, setSelectedId] = useState(countries[0]?.id || null);
  const country = countries.find((c) => c.id === selectedId);
  const [treasuryInput, setTreasuryInput] = useState(String(country?.treasury || 0));
  useEffect(() => { setTreasuryInput(String(country?.treasury || 0)); }, [selectedId]);

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
              <div className="text-right">
                <div className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-1">Trésor</div>
                <div className="font-mono font-black text-yellow-400 text-sm">{formatMoneyShort((country.treasury || 0))}</div>
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
                <Input type="number" step="0.1" value={laws.marriageMinAge || 16} onChange={(e) => setLawValue("marriageMinAge", parseInt(e.target.value) || 16)} min="0" max="100" />
              </div>
              <div>
                <Label>Frais de visa (Ecus)</Label>
                <Input type="number" step="0.1" value={laws.entryVisaFee || 0} onChange={(e) => setLawValue("entryVisaFee", parseFloat(e.target.value) || 0)} min="0" />
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
  const [manualDate, setManualDate] = useState({ day: gd.day, month: gd.month, year: gd.year });
  useEffect(() => { setManualDate({ day: gd.day, month: gd.month, year: gd.year }); }, [gd.day, gd.month, gd.year]);

  const monthNames = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];

  const handleSetDate = () => {
    const day = Math.max(1, Math.min(30, parseInt(manualDate.day) || 1));
    const month = Math.max(1, Math.min(12, parseInt(manualDate.month) || 1));
    const year = parseInt(manualDate.year) || gd.year;
    onUpdateState({ ...state, gameDate: { day, month, year } });
    notify(`Date définie : ${day} ${monthNames[(month - 1) % 12]} ${year}.`, "success");
  };

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
    const amount = parseFloat(mintAmount);
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
    notify(`${formatMoneyShort(amount)} frappes et ajoutes au Tresor Imperial.`, "success");
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
        <div className="mt-5 pt-5 border-t border-stone-800">
          <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
            <Edit3 size={10} /> Définir manuellement
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <Label>Jour</Label>
              <Input type="number" value={manualDate.day} onChange={(e) => setManualDate({ ...manualDate, day: e.target.value })} min="1" max="30" />
            </div>
            <div>
              <Label>Mois</Label>
              <Select value={manualDate.month} onChange={(e) => setManualDate({ ...manualDate, month: parseInt(e.target.value) })}>
                {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </Select>
            </div>
            <div>
              <Label>Année</Label>
              <Input type="number" value={manualDate.year} onChange={(e) => setManualDate({ ...manualDate, year: e.target.value })} />
            </div>
          </div>
          <BtnPrimary onClick={handleSetDate} className="w-full">
            <Calendar size={14} /> Définir cette date
          </BtnPrimary>
        </div>
      </Card>

      {/* Mint */}
      <Card className="p-5">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
          <Coins size={12} /> Frapper de la monnaie
        </h3>
        <div className="flex items-center gap-2 text-sm text-stone-400 mb-3">
          <Crown size={14} className="text-yellow-500" />
          Tresor Imperial actuel : <span className="font-bold text-yellow-400">{formatMoneyShort((state.treasury || 0))}</span>
        </div>
        <div className="flex gap-2">
          <Input type="number" step="0.1" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} placeholder="Montant a frapper..." min="1" className="flex-1" />
          <BtnPrimary onClick={handleMint} className="px-6" disabled={!mintAmount || parseFloat(mintAmount) <= 0}>
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
                <div className="text-sm font-bold text-yellow-500">{formatMoneyShort((j.amount || 0))}</div>
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
   6. QUÊTES
   ================================================ */
const QUEST_STATUSES = ["Brouillon", "Active", "Terminée", "Échouée"];
const QUEST_DIFFICULTIES = ["Facile", "Intermédiaire", "Difficile", "Épique"];
const NPC_DISPOSITIONS = ["Allié", "Ennemi", "Neutre", "Mystérieux"];
const NPC_STATUSES_LIST = ["Vivant", "Mort", "Disparu", "Inconnu"];
const NPC_EMOJIS = ["👤","⚔️","🧙","👑","🗡️","🛡️","🔮","📜","💀","🌹","🐉","🦅","🏴","🎭","👁️","🗝️"];

const questStatusColor = (s) =>
  s === "Active" ? "green" : s === "Terminée" ? "blue" : s === "Échouée" ? "red" : "stone";
const questDifficultyColor = (d) =>
  d === "Facile" ? "green" : d === "Intermédiaire" ? "blue" : d === "Difficile" ? "orange" : "purple";
const npcDispositionColor = (d) =>
  d === "Allié" ? "green" : d === "Ennemi" ? "red" : d === "Mystérieux" ? "purple" : "stone";
const npcStatusColor = (s) =>
  s === "Vivant" ? "green" : s === "Mort" ? "red" : s === "Disparu" ? "orange" : "stone";

const EMPTY_QUEST_FORM = {
  title: "",
  description: "",
  objectives: [],
  status: "Brouillon",
  difficulty: "Intermédiaire",
  reward: { money: 0, description: "" },
  assignedCitizens: [],
  countryId: "",
  isPublic: false,
  npcs: [],
  rebondissements: [],
  gmNotes: "",
};

const EMPTY_NPC = { name: "", role: "", disposition: "Neutre", status: "Vivant", description: "", secret: "", emoji: "👤" };
const EMPTY_REB = { title: "", description: "", condition: "", consequence: "", isTriggered: false, triggeredAt: null };

/* — NPC sub-form — */
const NPCFormRow = ({ npc, onChange, onRemove }) => {
  const [showSecret, setShowSecret] = useState(false);
  return (
    <div className="border border-stone-700 rounded-xl p-4 space-y-3 bg-stone-800/30">
      <div className="flex items-center gap-2">
        <select
          value={npc.emoji}
          onChange={(e) => onChange({ ...npc, emoji: e.target.value })}
          className="w-12 h-10 bg-stone-800 border border-stone-700 rounded-lg text-center text-base outline-none shrink-0"
        >
          {NPC_EMOJIS.map((em) => <option key={em} value={em}>{em}</option>)}
        </select>
        <Input value={npc.name} onChange={(e) => onChange({ ...npc, name: e.target.value })} placeholder="Nom du personnage..." className="flex-1" />
        <button onClick={onRemove} className="text-stone-600 hover:text-red-400 transition-all shrink-0"><X size={16} /></button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div><Label>Rôle</Label><Input value={npc.role} onChange={(e) => onChange({ ...npc, role: e.target.value })} placeholder="Marchand, Garde…" /></div>
        <div>
          <Label>Disposition</Label>
          <Select value={npc.disposition} onChange={(e) => onChange({ ...npc, disposition: e.target.value })}>
            {NPC_DISPOSITIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>
        <div>
          <Label>Statut</Label>
          <Select value={npc.status} onChange={(e) => onChange({ ...npc, status: e.target.value })}>
            {NPC_STATUSES_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>
      <div>
        <Label>Description (visible par les joueurs)</Label>
        <textarea value={npc.description} onChange={(e) => onChange({ ...npc, description: e.target.value })}
          className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-red-500/50 min-h-[60px]"
          placeholder="Ce que les joueurs savent de ce personnage…" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Label>Secrets GM</Label>
          <button onClick={() => setShowSecret(!showSecret)} className="text-stone-500 hover:text-stone-300 transition-all mb-1">
            {showSecret ? <EyeOff size={11} /> : <Eye size={11} />}
          </button>
        </div>
        <textarea value={npc.secret} onChange={(e) => onChange({ ...npc, secret: e.target.value })}
          className={`w-full bg-stone-900 border border-red-900/50 rounded-lg p-2.5 text-sm outline-none focus:border-red-500/50 min-h-[50px] transition-colors ${showSecret ? "text-red-300" : "text-stone-900 select-none"}`}
          placeholder="Informations confidentielles GM…" />
      </div>
    </div>
  );
};

/* — Rebondissement sub-form — */
const RebForm = ({ item, onChange, onRemove }) => (
  <div className="border border-amber-900/40 rounded-xl p-4 space-y-3 bg-amber-900/5">
    <div className="flex items-center gap-2">
      <span className="text-xl shrink-0">⚡</span>
      <Input value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} placeholder="Titre du rebondissement…" className="flex-1" />
      <button onClick={onRemove} className="text-stone-600 hover:text-red-400 transition-all shrink-0"><X size={16} /></button>
    </div>
    <div>
      <Label>Description de l'événement</Label>
      <textarea value={item.description} onChange={(e) => onChange({ ...item, description: e.target.value })}
        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-amber-500/50 min-h-[80px]"
        placeholder="Que se passe-t-il lors de ce rebondissement ?" />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <Label>Condition de déclenchement</Label>
        <textarea value={item.condition} onChange={(e) => onChange({ ...item, condition: e.target.value })}
          className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-amber-500/50 min-h-[60px]"
          placeholder="Quand déclencher cet événement ?" />
      </div>
      <div>
        <Label>Conséquences</Label>
        <textarea value={item.consequence} onChange={(e) => onChange({ ...item, consequence: e.target.value })}
          className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-amber-500/50 min-h-[60px]"
          placeholder="Impact sur la quête ou l'histoire…" />
      </div>
    </div>
  </div>
);

const GMQuests = ({ state, onUpdateState, notify }) => {
  const [view, setView] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [expandedId, setExpandedId] = useState(null);
  const [expandedTab, setExpandedTab] = useState("resume");
  const [form, setForm] = useState(EMPTY_QUEST_FORM);
  const [formTab, setFormTab] = useState("principal");
  const [newObjective, setNewObjective] = useState("");

  const quests = state.quests || [];
  const citizens = state.citizens || [];
  const countries = state.countries || [];

  const filtered = useMemo(() => {
    return quests.filter((q) => {
      if (filterStatus !== "ALL" && q.status !== filterStatus) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return q.title?.toLowerCase().includes(s) || q.description?.toLowerCase().includes(s);
    });
  }, [quests, search, filterStatus]);

  const handleSave = () => {
    if (!form.title.trim()) { notify("Le titre est requis.", "error"); return; }
    const now = Date.now();
    if (editingId) {
      onUpdateState({ ...state, quests: quests.map((q) => q.id === editingId ? { ...q, ...form, updatedAt: now } : q) });
      notify("Quête mise à jour.", "success");
    } else {
      onUpdateState({ ...state, quests: [...quests, { id: `q${now}`, ...form, createdAt: now, updatedAt: now }] });
      notify("Quête créée.", "success");
    }
    setForm(EMPTY_QUEST_FORM); setEditingId(null); setView("list"); setFormTab("principal");
  };

  const handleDelete = (id) => {
    onUpdateState({ ...state, quests: quests.filter((q) => q.id !== id) });
    if (expandedId === id) setExpandedId(null);
    notify("Quête supprimée.", "success");
  };

  const handleStatusChange = (id, newStatus) => {
    onUpdateState({ ...state, quests: quests.map((q) => q.id === id ? { ...q, status: newStatus, updatedAt: Date.now() } : q) });
  };

  const toggleObjective = (questId, objId) => {
    onUpdateState({
      ...state,
      quests: quests.map((q) => q.id !== questId ? q : {
        ...q,
        objectives: q.objectives.map((o) => o.id === objId ? { ...o, completed: !o.completed } : o),
        updatedAt: Date.now(),
      }),
    });
  };

  const triggerRebondissement = (questId, rebId) => {
    onUpdateState({
      ...state,
      quests: quests.map((q) => q.id !== questId ? q : {
        ...q,
        rebondissements: (q.rebondissements || []).map((r) =>
          r.id === rebId ? { ...r, isTriggered: !r.isTriggered, triggeredAt: !r.isTriggered ? Date.now() : null } : r
        ),
        updatedAt: Date.now(),
      }),
    });
  };

  const updateNpcStatusInline = (questId, npcId, newSt) => {
    onUpdateState({
      ...state,
      quests: quests.map((q) => q.id !== questId ? q : {
        ...q,
        npcs: (q.npcs || []).map((n) => n.id === npcId ? { ...n, status: newSt } : n),
        updatedAt: Date.now(),
      }),
    });
  };

  const startEdit = (quest) => {
    setForm({
      title: quest.title || "",
      description: quest.description || "",
      objectives: quest.objectives || [],
      status: quest.status || "Brouillon",
      difficulty: quest.difficulty || "Intermédiaire",
      reward: quest.reward || { money: 0, description: "" },
      assignedCitizens: quest.assignedCitizens || [],
      countryId: quest.countryId || "",
      isPublic: quest.isPublic || false,
      npcs: quest.npcs || [],
      rebondissements: quest.rebondissements || [],
      gmNotes: quest.gmNotes || "",
    });
    setEditingId(quest.id); setFormTab("principal"); setView("form");
  };

  const addObjective = () => {
    if (!newObjective.trim()) return;
    setForm({ ...form, objectives: [...form.objectives, { id: `o${Date.now()}`, text: newObjective.trim(), completed: false }] });
    setNewObjective("");
  };
  const removeObjective = (idx) => setForm({ ...form, objectives: form.objectives.filter((_, i) => i !== idx) });

  const addNpc = () => setForm({ ...form, npcs: [...form.npcs, { ...EMPTY_NPC, id: `npc${Date.now()}` }] });
  const updateNpc = (idx, upd) => { const a = [...form.npcs]; a[idx] = upd; setForm({ ...form, npcs: a }); };
  const removeNpc = (idx) => setForm({ ...form, npcs: form.npcs.filter((_, i) => i !== idx) });

  const addReb = () => setForm({ ...form, rebondissements: [...form.rebondissements, { ...EMPTY_REB, id: `r${Date.now()}` }] });
  const updateReb = (idx, upd) => { const a = [...form.rebondissements]; a[idx] = upd; setForm({ ...form, rebondissements: a }); };
  const removeReb = (idx) => setForm({ ...form, rebondissements: form.rebondissements.filter((_, i) => i !== idx) });

  const openForm = () => { setForm(EMPTY_QUEST_FORM); setEditingId(null); setFormTab("principal"); setView("form"); };
  const closeForm = () => { setView("list"); setForm(EMPTY_QUEST_FORM); setEditingId(null); };

  const FORM_TABS = [
    { id: "principal", label: "Principal" },
    { id: "objectifs", label: `Objectifs (${form.objectives.length})` },
    { id: "npcs", label: `PNJs (${form.npcs.length})` },
    { id: "rebondissements", label: `Rebond. (${form.rebondissements.length})` },
    { id: "notes", label: "Notes GM" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <SectionTitle icon={ScrollText}>Gestion des Quêtes</SectionTitle>
        <button
          onClick={view !== "list" ? closeForm : openForm}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            view !== "list" ? "bg-stone-800 text-stone-300 hover:bg-stone-700" : "bg-red-900/50 border border-red-800/50 text-red-300 hover:bg-red-900/70"
          }`}
        >
          {view !== "list" ? <><ArrowLeft size={14} /> Liste</> : <><Plus size={14} /> Nouvelle quête</>}
        </button>
      </div>

      {/* ── FORM VIEW ── */}
      {view === "form" && (
        <Card className="overflow-hidden">
          {/* Form tab bar */}
          <div className="flex border-b border-stone-800 overflow-x-auto">
            {FORM_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFormTab(tab.id)}
                className={`shrink-0 px-4 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 ${
                  formTab === tab.id ? "text-red-300 border-red-600 bg-stone-800/30" : "text-stone-500 hover:text-stone-300 border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {/* ─ Tab: Principal ─ */}
            {formTab === "principal" && (<>
              <div><Label>Titre</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nom de la quête…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Statut</Label>
                  <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {QUEST_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
                <div><Label>Difficulté</Label>
                  <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                    {QUEST_DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </div>
              </div>
              <div><Label>Description narrative</Label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50 min-h-[120px] font-serif"
                  placeholder="Décrivez la quête, son contexte et ses enjeux…" />
              </div>
              <div><Label>Récompense</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input type="number" step="0.1" value={form.reward.money} min="0"
                      onChange={(e) => setForm({ ...form, reward: { ...form.reward, money: parseInt(e.target.value) || 0 } })}
                      placeholder="Écus…" />
                    <div className="text-[9px] text-stone-500 mt-1">Montant en Écus</div>
                  </div>
                  <div>
                    <Input value={form.reward.description}
                      onChange={(e) => setForm({ ...form, reward: { ...form.reward, description: e.target.value } })}
                      placeholder="Objet, titre, faveur…" />
                    <div className="text-[9px] text-stone-500 mt-1">Autre récompense</div>
                  </div>
                </div>
              </div>
              <div><Label>Pays associé (optionnel)</Label>
                <Select value={form.countryId} onChange={(e) => setForm({ ...form, countryId: e.target.value })}>
                  <option value="">— Tous les pays —</option>
                  {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Citoyens assignés</Label>
                <select multiple value={form.assignedCitizens}
                  onChange={(e) => setForm({ ...form, assignedCitizens: Array.from(e.target.selectedOptions, (o) => o.value) })}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-red-500/50 min-h-[90px]">
                  {citizens.filter((c) => c.status !== "Décédé").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="text-[9px] text-stone-500 mt-1">Ctrl+clic pour sélectionner plusieurs</div>
              </div>
              <Toggle checked={form.isPublic} onChange={(v) => setForm({ ...form, isPublic: v })}
                label="Quête publique" description="Visible par tous les citoyens, pas seulement les assignés" />
            </>)}

            {/* ─ Tab: Objectifs ─ */}
            {formTab === "objectifs" && (
              <div className="space-y-3">
                {form.objectives.length === 0 && (
                  <div className="text-center py-6 text-stone-600">
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="text-sm font-bold">Aucun objectif</div>
                    <div className="text-[10px] mt-1">Ajoutez les étapes que les joueurs doivent accomplir.</div>
                  </div>
                )}
                {form.objectives.map((obj, idx) => (
                  <div key={obj.id} className="flex items-center gap-2 bg-stone-800/50 rounded-lg px-3 py-2.5 border border-stone-700">
                    <div className="w-3 h-3 rounded-full border border-stone-600 shrink-0" />
                    <span className="flex-1 text-sm text-stone-300">{obj.text}</span>
                    <button onClick={() => removeObjective(idx)} className="text-stone-600 hover:text-red-400 transition-all"><X size={14} /></button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input value={newObjective} onChange={(e) => setNewObjective(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addObjective()}
                    placeholder="Nouvel objectif (Entrée pour valider)…" className="flex-1" />
                  <BtnSecondary onClick={addObjective}>Ajouter</BtnSecondary>
                </div>
              </div>
            )}

            {/* ─ Tab: PNJs ─ */}
            {formTab === "npcs" && (
              <div className="space-y-4">
                {form.npcs.length === 0 && (
                  <div className="text-center py-8 text-stone-600">
                    <div className="text-3xl mb-2">🎭</div>
                    <div className="text-sm font-bold">Aucun personnage exclusif</div>
                    <div className="text-[10px] mt-1">Créez les PNJs propres à cette quête.</div>
                  </div>
                )}
                {form.npcs.map((npc, idx) => (
                  <NPCFormRow key={npc.id} npc={npc} onChange={(u) => updateNpc(idx, u)} onRemove={() => removeNpc(idx)} />
                ))}
                <BtnPrimary onClick={addNpc} className="w-full"><Plus size={14} /> Ajouter un personnage</BtnPrimary>
              </div>
            )}

            {/* ─ Tab: Rebondissements ─ */}
            {formTab === "rebondissements" && (
              <div className="space-y-4">
                {form.rebondissements.length === 0 && (
                  <div className="text-center py-8 text-stone-600">
                    <div className="text-3xl mb-2">⚡</div>
                    <div className="text-sm font-bold">Aucun rebondissement</div>
                    <div className="text-[10px] mt-1">Planifiez des coups de théâtre et événements inattendus.</div>
                  </div>
                )}
                {form.rebondissements.map((item, idx) => (
                  <RebForm key={item.id} item={item} onChange={(u) => updateReb(idx, u)} onRemove={() => removeReb(idx)} />
                ))}
                <BtnPrimary onClick={addReb} className="w-full"><Plus size={14} /> Ajouter un rebondissement</BtnPrimary>
              </div>
            )}

            {/* ─ Tab: Notes GM ─ */}
            {formTab === "notes" && (
              <div>
                <div className="flex items-center gap-2 mb-3 p-3 bg-red-900/10 border border-red-900/30 rounded-lg">
                  <Shield size={14} className="text-red-400 shrink-0" />
                  <div className="text-[10px] text-red-400 font-bold">Notes confidentielles — Visibles uniquement par le GM</div>
                </div>
                <textarea value={form.gmNotes} onChange={(e) => setForm({ ...form, gmNotes: e.target.value })}
                  className="w-full bg-stone-900 border border-red-900/40 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50 min-h-[260px]"
                  placeholder="Notes secrètes, indices cachés, développements alternatifs, intentions narratives…" />
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-stone-800">
              <BtnSecondary onClick={closeForm}>Annuler</BtnSecondary>
              <BtnPrimary onClick={handleSave} className="flex-1">
                {editingId ? <><Save size={14} /> Sauvegarder</> : <><Plus size={14} /> Créer la quête</>}
              </BtnPrimary>
            </div>
          </div>
        </Card>
      )}

      {/* ── LIST VIEW ── */}
      {view === "list" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {QUEST_STATUSES.map((s) => {
              const count = quests.filter((q) => q.status === s).length;
              return (
                <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "ALL" : s)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    filterStatus === s ? "bg-red-900/30 border-red-800/50" : "bg-stone-900 border-stone-800 hover:border-stone-700"
                  }`}>
                  <div className="text-lg font-black text-stone-200">{count}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest mt-0.5 text-stone-500">{s}</div>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-stone-900 border border-stone-800 rounded-lg text-sm text-stone-200 outline-none focus:border-stone-600"
              placeholder="Rechercher une quête…" />
          </div>

          {/* Filter chips */}
          <div className="flex gap-1.5 flex-wrap">
            {["ALL", ...QUEST_STATUSES].map((s) => (
              <button key={s} onClick={() => setFilterStatus(s === filterStatus ? "ALL" : s)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                  filterStatus === s ? "bg-red-900/50 text-red-300 border-red-800/50" : "bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-300"
                }`}>
                {s === "ALL" ? `Toutes (${quests.length})` : `${s} (${quests.filter((q) => q.status === s).length})`}
              </button>
            ))}
          </div>

          {/* Quest cards */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-stone-600">
              <ScrollText size={32} className="mx-auto mb-3 opacity-50" />
              <div className="text-sm font-bold">Aucune quête</div>
              <div className="text-[10px] mt-1">
                {search || filterStatus !== "ALL" ? "Aucun résultat pour ces filtres." : "Créez votre première quête pour lancer l'aventure."}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((quest) => {
                const isExpanded = expandedId === quest.id;
                const completedCount = (quest.objectives || []).filter((o) => o.completed).length;
                const totalCount = (quest.objectives || []).length;
                const country = countries.find((c) => c.id === quest.countryId);
                const assignedNames = (quest.assignedCitizens || []).map((id) => citizens.find((c) => c.id === id)?.name).filter(Boolean);
                const npcCount = (quest.npcs || []).length;
                const totalRebs = (quest.rebondissements || []).length;
                const triggeredRebs = (quest.rebondissements || []).filter((r) => r.isTriggered).length;
                const hasNotes = !!quest.gmNotes;

                const cardTabs = [
                  { id: "resume", label: "Résumé" },
                  totalCount > 0 && { id: "objectifs", label: `Objectifs ${completedCount}/${totalCount}` },
                  npcCount > 0 && { id: "npcs", label: `PNJs (${npcCount})` },
                  totalRebs > 0 && { id: "rebondissements", label: `Rebond. ${triggeredRebs}/${totalRebs}` },
                  hasNotes && { id: "notes", label: "Notes GM" },
                ].filter(Boolean);

                const curTab = expandedId === quest.id ? expandedTab : "resume";

                return (
                  <Card key={quest.id} className={`overflow-hidden transition-all ${isExpanded ? "border-red-800/60" : "hover:border-stone-700"}`}>
                    {/* Card header row */}
                    <button onClick={() => { setExpandedId(isExpanded ? null : quest.id); setExpandedTab("resume"); }}
                      className="w-full text-left p-4 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <Badge color={questStatusColor(quest.status)}>{quest.status}</Badge>
                          <Badge color={questDifficultyColor(quest.difficulty)}>{quest.difficulty}</Badge>
                          {quest.isPublic && <Badge color="blue">Public</Badge>}
                          {country && <Badge color="stone">{country.name}</Badge>}
                          {npcCount > 0 && <Badge color="purple">🎭 {npcCount} PNJ{npcCount > 1 ? "s" : ""}</Badge>}
                          {totalRebs > 0 && <Badge color={triggeredRebs > 0 ? "orange" : "stone"}>⚡ {triggeredRebs}/{totalRebs}</Badge>}
                          {hasNotes && <Badge color="red">📝 GM</Badge>}
                        </div>
                        <h4 className="text-sm font-bold text-stone-200 font-serif">{quest.title}</h4>
                        {!isExpanded && quest.description && (
                          <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">{quest.description}</p>
                        )}
                        {totalCount > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 bg-stone-800 rounded-full h-1">
                              <div className="bg-red-600 h-1 rounded-full transition-all" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
                            </div>
                            <span className="text-[9px] text-stone-500 font-mono">{completedCount}/{totalCount}</span>
                          </div>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-stone-500 shrink-0 mt-1" /> : <ChevronDown size={16} className="text-stone-500 shrink-0 mt-1" />}
                    </button>

                    {/* Expanded panel */}
                    {isExpanded && (
                      <div className="border-t border-stone-800">
                        {/* Inner tab bar */}
                        {cardTabs.length > 1 && (
                          <div className="flex border-b border-stone-800/60 bg-stone-900/50 overflow-x-auto">
                            {cardTabs.map((tab) => (
                              <button key={tab.id} onClick={() => setExpandedTab(tab.id)}
                                className={`shrink-0 px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 ${
                                  curTab === tab.id ? "text-red-300 border-red-600" : "text-stone-500 hover:text-stone-300 border-transparent"
                                }`}>
                                {tab.label}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="p-4 space-y-4">
                          {/* ─ Résumé ─ */}
                          {curTab === "resume" && (<>
                            {quest.description && <p className="text-sm text-stone-300 font-serif leading-relaxed">{quest.description}</p>}
                            {(quest.reward?.money > 0 || quest.reward?.description) && (
                              <div className="flex items-center gap-3 p-2.5 bg-yellow-900/10 border border-yellow-900/30 rounded-lg">
                                {quest.reward?.money > 0 && (
                                  <span className="text-sm font-bold text-yellow-400 flex items-center gap-1"><Coins size={12} /> {formatMoney(quest.reward.money)}</span>
                                )}
                                {quest.reward?.description && <span className="text-sm text-stone-300">{quest.reward.description}</span>}
                              </div>
                            )}
                            {assignedNames.length > 0 && (
                              <div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-2">Participants</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {assignedNames.map((name) => (
                                    <span key={name} className="px-2.5 py-1 bg-stone-800 text-stone-300 text-[10px] font-bold rounded-lg border border-stone-700">{name}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>)}

                          {/* ─ Objectifs ─ */}
                          {curTab === "objectifs" && (
                            <div className="space-y-1.5">
                              {quest.objectives.map((obj) => (
                                <button key={obj.id} onClick={() => toggleObjective(quest.id, obj.id)}
                                  className="w-full flex items-center gap-2.5 text-left p-2 rounded-lg hover:bg-stone-800/50 transition-all group">
                                  {obj.completed
                                    ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                                    : <div className="w-3.5 h-3.5 rounded-full border border-stone-600 shrink-0 group-hover:border-stone-400 transition-all" />}
                                  <span className={`text-sm ${obj.completed ? "line-through text-stone-600" : "text-stone-300"}`}>{obj.text}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* ─ PNJs ─ */}
                          {curTab === "npcs" && (
                            <div className="space-y-3">
                              {(quest.npcs || []).map((npc) => (
                                <div key={npc.id} className="p-3 bg-stone-800/40 rounded-xl border border-stone-700/50 space-y-2">
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl shrink-0">{npc.emoji || "👤"}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-bold text-stone-200">{npc.name}</span>
                                        {npc.role && <span className="text-[9px] text-stone-500 italic">{npc.role}</span>}
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <Badge color={npcDispositionColor(npc.disposition)}>{npc.disposition}</Badge>
                                        <Badge color={npcStatusColor(npc.status)}>{npc.status}</Badge>
                                      </div>
                                    </div>
                                    <Select value={npc.status}
                                      onChange={(e) => updateNpcStatusInline(quest.id, npc.id, e.target.value)}
                                      className="!w-28 !py-1 !text-[10px] shrink-0">
                                      {NPC_STATUSES_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </Select>
                                  </div>
                                  {npc.description && <p className="text-[11px] text-stone-400 leading-relaxed">{npc.description}</p>}
                                  {npc.secret && (
                                    <div className="p-2 bg-red-900/10 border border-red-900/30 rounded-lg">
                                      <div className="text-[8px] font-black uppercase tracking-widest text-red-500 mb-1 flex items-center gap-1"><Shield size={9} /> Secret GM</div>
                                      <p className="text-[11px] text-red-300/80 leading-relaxed">{npc.secret}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* ─ Rebondissements ─ */}
                          {curTab === "rebondissements" && (
                            <div className="space-y-3">
                              {(quest.rebondissements || []).map((reb) => (
                                <div key={reb.id} className={`p-3 rounded-xl border transition-all ${
                                  reb.isTriggered ? "bg-amber-900/20 border-amber-800/50" : "bg-stone-800/30 border-stone-700/50"
                                }`}>
                                  <div className="flex items-start gap-3">
                                    <span className={`text-xl shrink-0 mt-0.5 ${reb.isTriggered ? "" : "opacity-30"}`}>⚡</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className={`text-sm font-bold ${reb.isTriggered ? "text-amber-300" : "text-stone-300"}`}>
                                          {reb.title || "Sans titre"}
                                        </span>
                                        {reb.isTriggered && <Badge color="orange">Déclenché</Badge>}
                                      </div>
                                      {reb.description && <p className="text-[11px] text-stone-400 leading-relaxed mb-2">{reb.description}</p>}
                                      <div className="grid grid-cols-2 gap-2">
                                        {reb.condition && (
                                          <div className="p-2 bg-stone-900/50 rounded-lg border border-stone-700/30">
                                            <div className="text-[8px] font-black uppercase tracking-widest text-stone-500 mb-1">Condition</div>
                                            <p className="text-[11px] text-stone-400">{reb.condition}</p>
                                          </div>
                                        )}
                                        {reb.consequence && (
                                          <div className="p-2 bg-stone-900/50 rounded-lg border border-stone-700/30">
                                            <div className="text-[8px] font-black uppercase tracking-widest text-stone-500 mb-1">Conséquences</div>
                                            <p className="text-[11px] text-stone-400">{reb.consequence}</p>
                                          </div>
                                        )}
                                      </div>
                                      {reb.isTriggered && reb.triggeredAt && (
                                        <div className="text-[9px] text-amber-600 font-mono mt-1">
                                          Déclenché le {new Date(reb.triggeredAt).toLocaleDateString("fr-FR")}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => triggerRebondissement(quest.id, reb.id)}
                                      className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                        reb.isTriggered
                                          ? "bg-amber-900/30 border-amber-800/50 text-amber-400 hover:bg-amber-900/50"
                                          : "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200 hover:bg-stone-700"
                                      }`}>
                                      {reb.isTriggered ? "Annuler" : "Déclencher"}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* ─ Notes GM ─ */}
                          {curTab === "notes" && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <Shield size={12} className="text-red-400" />
                                <div className="text-[9px] font-black uppercase tracking-widest text-red-400">Notes confidentielles GM</div>
                              </div>
                              <div className="p-3 bg-red-900/5 border border-red-900/30 rounded-lg">
                                <p className="text-sm text-stone-300 whitespace-pre-wrap leading-relaxed">{quest.gmNotes}</p>
                              </div>
                            </div>
                          )}

                          {/* Footer actions */}
                          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-stone-800">
                            <div className="flex gap-1.5 flex-wrap">
                              {QUEST_STATUSES.filter((s) => s !== quest.status).map((s) => (
                                <button key={s} onClick={() => handleStatusChange(quest.id, s)}
                                  className="px-2.5 py-1 bg-stone-800 text-stone-400 text-[9px] font-black uppercase tracking-widest rounded hover:bg-stone-700 hover:text-stone-200 transition-all border border-stone-700">
                                  → {s}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <BtnSecondary onClick={() => startEdit(quest)}><Edit3 size={12} /></BtnSecondary>
                              <button onClick={() => handleDelete(quest.id)}
                                className="px-3 py-1.5 bg-stone-800 text-red-500 text-[9px] font-black uppercase tracking-widest rounded hover:bg-red-900/30 transition-all border border-stone-700">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <div className="text-[9px] text-stone-600 font-mono">
                            Créée le {new Date(quest.createdAt).toLocaleDateString("fr-FR")}
                            {quest.updatedAt !== quest.createdAt && ` · Modifiée le ${new Date(quest.updatedAt).toLocaleDateString("fr-FR")}`}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ================================================
   6. PHYSIQUE & MAGIE
   ================================================ */
const INJURY_STATES_GM = [
  { id: "sain",            label: "Sain",          color: "bg-stone-700 text-stone-300 border-stone-600" },
  { id: "contusion",       label: "Contusion",      color: "bg-amber-900/50 text-amber-300 border-amber-700" },
  { id: "blessure_legere", label: "Blessé léger",   color: "bg-orange-900/50 text-orange-300 border-orange-700" },
  { id: "blessure_grave",  label: "Blessé grave",   color: "bg-red-900/60 text-red-300 border-red-700" },
  { id: "fracture",        label: "Fracture",        color: "bg-violet-900/50 text-violet-300 border-violet-700" },
  { id: "critique",        label: "État critique",   color: "bg-slate-800 text-slate-200 border-slate-600" },
];

const BODY_ZONES_GM = [
  { id: "tete",         label: "Tête"         },
  { id: "cou",          label: "Cou"          },
  { id: "torse",        label: "Torse"        },
  { id: "abdomen",      label: "Abdomen"      },
  { id: "bassin",       label: "Bassin"       },
  { id: "bras_g",       label: "Bras G."      },
  { id: "bras_d",       label: "Bras D."      },
  { id: "avant_bras_g", label: "Av. bras G."  },
  { id: "avant_bras_d", label: "Av. bras D."  },
  { id: "main_g",       label: "Main G."      },
  { id: "main_d",       label: "Main D."      },
  { id: "cuisse_g",     label: "Cuisse G."    },
  { id: "cuisse_d",     label: "Cuisse D."    },
  { id: "jambe_g",      label: "Jambe G."     },
  { id: "jambe_d",      label: "Jambe D."     },
  { id: "pied_g",       label: "Pied G."      },
  { id: "pied_d",       label: "Pied D."      },
];

const GMPhysicsMagic = ({ state, onUpdateState, notify }) => {
  const safeCitizens = Array.isArray(state.citizens) ? state.citizens : [];
  const [search, setSearch]       = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab]   = useState("physique");

  const filtered = safeCitizens.filter(
    (c) => c.name?.toLowerCase().includes(search.toLowerCase())
  );
  const selected = safeCitizens.find((c) => c.id === selectedId) || null;

  const updateCitizen = (patch) => {
    onUpdateState({
      ...state,
      citizens: safeCitizens.map((c) => (c.id === selectedId ? { ...c, ...patch } : c)),
    });
  };

  const setInjury = (zoneId, value) => {
    const injuries = { ...(selected?.physicalStats?.injuries || {}), [zoneId]: value };
    updateCitizen({ physicalStats: { ...(selected?.physicalStats || {}), injuries } });
  };

  const toggleEffect = (effectId) => {
    const current = selected?.statusEffects || [];
    const next = current.includes(effectId)
      ? current.filter((x) => x !== effectId)
      : [...current, effectId];
    updateCitizen({ statusEffects: next });
  };

  return (
    <div className="space-y-4">
      <SectionTitle icon={HeartPulse}>Physique & Magie</SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">

        {/* ─ Liste des citoyens ─ */}
        <div className="md:col-span-1 space-y-2">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chercher un citoyen…"
              className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-8 pr-3 py-2 text-xs text-stone-200 outline-none focus:border-red-500/50"
            />
          </div>
          <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.map((c) => {
              const injuries   = c?.physicalStats?.injuries || {};
              const hasInjury  = Object.values(injuries).some((v) => v && v !== "sain");
              const hasEffects = (c.statusEffects || []).length > 0;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center gap-2 ${
                    selectedId === c.id
                      ? "bg-red-900/30 border-red-800/50 text-red-300"
                      : "bg-stone-800/50 border-stone-700/50 text-stone-300 hover:bg-stone-800 hover:border-stone-600"
                  }`}
                >
                  <span className="text-xs font-bold flex-1 truncate">{c.name}</span>
                  {hasInjury  && <span title="Blessures" className="text-red-400 text-xs">🩹</span>}
                  {hasEffects && <span title="États actifs" className="text-amber-400 text-xs">⚡</span>}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-stone-600 text-xs">Aucun citoyen trouvé</div>
            )}
          </div>
        </div>

        {/* ─ Panneau d'édition ─ */}
        <div className="md:col-span-2">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-600 gap-3 border border-dashed border-stone-700 rounded-xl">
              <Activity size={32} className="opacity-40" />
              <div className="text-xs font-bold uppercase tracking-widest">Sélectionner un citoyen</div>
            </div>
          ) : (
            <div className="bg-stone-900/60 border border-stone-700 rounded-xl overflow-hidden">

              {/* En-tête citoyen */}
              <div className="px-4 py-3 border-b border-stone-700 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-900/30 border border-red-800/40 flex items-center justify-center text-xs font-black text-red-400">
                  {selected.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-black text-stone-200">{selected.name}</div>
                  <div className="text-[9px] text-stone-500 uppercase tracking-widest">{selected.occupation || "Citoyen"}</div>
                </div>
              </div>

              {/* Onglets internes */}
              <div className="flex border-b border-stone-700">
                {[
                  { id: "physique", label: "Corps & Blessures", icon: HeartPulse },
                  { id: "magie",    label: "Magie & États",     icon: Sparkles   },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                      activeTab === id
                        ? "border-red-600 text-red-300 bg-red-900/10"
                        : "border-transparent text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>

              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">

                {/* ── TAB PHYSIQUE ── */}
                {activeTab === "physique" && (
                  <>
                    <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-2">
                      Cliquez sur une zone puis choisissez son état
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {BODY_ZONES_GM.map((zone) => {
                        const currentId = selected?.physicalStats?.injuries?.[zone.id] || "sain";
                        const current   = INJURY_STATES_GM.find((s) => s.id === currentId) || INJURY_STATES_GM[0];
                        return (
                          <div key={zone.id} className="bg-stone-800/60 border border-stone-700 rounded-lg p-2">
                            <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5">{zone.label}</div>
                            <select
                              value={currentId}
                              onChange={(e) => { setInjury(zone.id, e.target.value); notify(`${zone.label} → ${e.target.options[e.target.selectedIndex].text}`, "success"); }}
                              className="w-full bg-stone-900 border border-stone-700 rounded text-[10px] text-stone-200 p-1 outline-none focus:border-red-500/50"
                            >
                              {INJURY_STATES_GM.map((s) => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                              ))}
                            </select>
                            {currentId !== "sain" && (
                              <div className={`mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded border text-center ${current.color}`}>
                                {current.label}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => { updateCitizen({ physicalStats: { ...(selected?.physicalStats || {}), injuries: {} } }); notify("Blessures effacées.", "success"); }}
                      className="text-[9px] text-stone-500 hover:text-red-400 underline transition-colors"
                    >
                      Réinitialiser toutes les blessures
                    </button>
                  </>
                )}

                {/* ── TAB MAGIE & ÉTATS ── */}
                {activeTab === "magie" && (
                  <div className="space-y-4">
                    {[
                      { key: "physique", label: "États physiques", icon: "💪" },
                      { key: "magique",  label: "États magiques",  icon: "✨" },
                    ].map(({ key, label, icon }) => (
                      <div key={key}>
                        <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-1">
                          <span>{icon}</span> {label}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {STATUS_EFFECTS_CONFIG[key].map((eff) => {
                            const active = (selected.statusEffects || []).includes(eff.id);
                            return (
                              <button
                                key={eff.id}
                                type="button"
                                title={eff.desc}
                                onClick={() => { toggleEffect(eff.id); notify(`${eff.label} ${active ? "retiré" : "ajouté"}.`, "success"); }}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[10px] font-bold transition-all ${
                                  active
                                    ? "bg-red-900/60 border-red-700 text-red-300 ring-1 ring-red-600"
                                    : "bg-stone-800 border-stone-700 text-stone-500 hover:text-stone-200 hover:border-stone-500"
                                }`}
                              >
                                <span>{eff.icon}</span>
                                <span>{eff.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {(selected.statusEffects || []).length > 0 && (
                      <div className="pt-2 border-t border-stone-700">
                        <div className="text-[9px] text-stone-500 mb-2 font-bold uppercase tracking-widest">
                          {(selected.statusEffects || []).length} état{(selected.statusEffects || []).length > 1 ? "s" : ""} actif{(selected.statusEffects || []).length > 1 ? "s" : ""}
                        </div>
                        <button
                          onClick={() => { updateCitizen({ statusEffects: [] }); notify("États effacés.", "success"); }}
                          className="text-[9px] text-stone-500 hover:text-red-400 underline transition-colors"
                        >
                          Effacer tous les états
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
    </div>
  );
};

const DEFAULT_ILLNESS_CONFIG = {
  enabled: false,
  dailyChancePercent: 2,
  illnesses: [
    { id: "rhume", name: "Rhume", description: "Un simple refroidissement, gênant mais sans gravité.", icon: "🤧", weight: 40, minDurationDays: 2, maxDurationDays: 4, productionPenaltyPercent: 10, statusEffectIds: ["enrhume"] },
    { id: "grippe", name: "Grippe", description: "Fièvre et courbatures qui clouent au lit plusieurs jours.", icon: "🤒", weight: 30, minDurationDays: 3, maxDurationDays: 7, productionPenaltyPercent: 30, statusEffectIds: ["fievre", "enrhume"] },
    { id: "dysenterie", name: "Dysenterie", description: "Infection intestinale sévère, très affaiblissante.", icon: "🤢", weight: 15, minDurationDays: 5, maxDurationDays: 10, productionPenaltyPercent: 50, statusEffectIds: ["affaibli"] },
    { id: "fievre_maligne", name: "Fièvre maligne", description: "Fièvre violente aux origines incertaines, potentiellement grave si négligée.", icon: "🥵", weight: 10, minDurationDays: 7, maxDurationDays: 14, productionPenaltyPercent: 70, statusEffectIds: ["fievre", "affaibli"] },
    { id: "peste", name: "Peste", description: "Le fléau redouté de tous les âges. Rare, mais dévastateur.", icon: "☠️", weight: 5, minDurationDays: 10, maxDurationDays: 21, productionPenaltyPercent: 90, statusEffectIds: ["fievre", "affaibli", "blessure_cachee"] },
  ],
  // Traitements administrables par un citoyen dont l'occupation est "Apothicaire" (voir l'onglet
  // Apothicaire côté citoyen) — chaque traitement a son propre effet et son propre prix, payé par
  // le patient à l'apothicaire.
  treatments: [
    { id: "tisane", name: "Tisane fortifiante", description: "Un remède simple à base de plantes, allège un peu le mal.", icon: "🍵", effect: "REDUCE_PENALTY", value: 15, price: 3 },
    { id: "cataplasme", name: "Cataplasme et repos forcé", description: "Accélère la convalescence de quelques jours.", icon: "🩹", effect: "REDUCE_DAYS", value: 2, price: 6 },
    { id: "remede_savant", name: "Remède du savant", description: "Une préparation complexe, coûteuse, mais qui guérit net.", icon: "⚗️", effect: "CURE", value: 0, price: 20 },
  ],
};

const TREATMENT_EFFECTS = {
  CURE: { label: "Guérison immédiate", unit: "" },
  REDUCE_DAYS: { label: "Réduit la durée restante", unit: "jour(s)" },
  REDUCE_PENALTY: { label: "Réduit la pénalité de production", unit: "%" },
};

const blankIllness = () => ({
  id: `maladie_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  name: "Nouvelle maladie", description: "", icon: "🤒",
  weight: 10, minDurationDays: 2, maxDurationDays: 5, productionPenaltyPercent: 20, statusEffectIds: [],
});

const blankTreatment = () => ({
  id: `traitement_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  name: "Nouveau traitement", description: "", icon: "⚗️",
  effect: "REDUCE_PENALTY", value: 10, price: 5,
});

const GMIllness = ({ state, onUpdateState, notify }) => {
  const cfg = { ...DEFAULT_ILLNESS_CONFIG, ...(state.illnessConfig || {}) };
  const illnesses = cfg.illnesses?.length ? cfg.illnesses : DEFAULT_ILLNESS_CONFIG.illnesses;
  const treatments = cfg.treatments?.length ? cfg.treatments : DEFAULT_ILLNESS_CONFIG.treatments;

  const save = (patch, msg) => {
    onUpdateState({ ...state, illnessConfig: { ...cfg, ...patch } });
    if (msg) notify(msg, "success");
  };

  const updateTreatment = (id, field, value) => {
    const next = treatments.map((t) => (t.id === id ? { ...t, [field]: value } : t));
    save({ treatments: next });
  };

  const addTreatment = () => {
    save({ treatments: [...treatments, blankTreatment()] }, "Traitement ajouté.");
  };

  const removeTreatment = (id) => {
    save({ treatments: treatments.filter((t) => t.id !== id) }, "Traitement supprimé.");
  };

  const updateIllness = (id, field, value) => {
    const next = illnesses.map((i) => (i.id === id ? { ...i, [field]: value } : i));
    save({ illnesses: next });
  };

  const toggleIllnessStatus = (id, statusId) => {
    const ill = illnesses.find((i) => i.id === id);
    if (!ill) return;
    const current = ill.statusEffectIds || [];
    const next = current.includes(statusId) ? current.filter((s) => s !== statusId) : [...current, statusId];
    updateIllness(id, "statusEffectIds", next);
  };

  const addIllness = () => {
    save({ illnesses: [...illnesses, blankIllness()] }, "Maladie ajoutée.");
  };

  const removeIllness = (id) => {
    save({ illnesses: illnesses.filter((i) => i.id !== id) }, "Maladie supprimée.");
  };

  const sickCitizens = (state.citizens || []).filter((c) => c.illness);
  const sickCount = sickCitizens.length;

  const cureCitizen = (citizenId) => {
    const citizen = (state.citizens || []).find((c) => c.id === citizenId);
    if (!citizen || !citizen.illness) return;
    const illnessName = citizen.illness.name;
    const newCitizens = (state.citizens || []).map((c) => (c.id === citizenId ? clearIllnessFromCitizen(c) : c));
    const healthAlerts = [
      { id: `health_${citizenId}_${Date.now()}`, toId: citizenId, type: "illness_recovered", name: illnessName, timestamp: Date.now() },
      ...(state.healthAlerts || []),
    ].slice(0, 300);
    onUpdateState({ ...state, citizens: newCitizens, healthAlerts });
    notify(`${citizen.name} est guéri(e).`, "success");
  };

  // --- Infliger manuellement une maladie à un citoyen précis ---
  const [inflictSearch, setInflictSearch] = useState("");
  const [inflictCitizenId, setInflictCitizenId] = useState("");
  const [inflictIllnessId, setInflictIllnessId] = useState("");

  const inflictMatches = inflictSearch.trim()
    ? (state.citizens || []).filter((c) => c.name?.toLowerCase().includes(inflictSearch.trim().toLowerCase())).slice(0, 30)
    : [];

  const inflictIllness = () => {
    const illnessDef = illnesses.find((i) => i.id === inflictIllnessId);
    if (!illnessDef) { notify("Choisissez une maladie.", "error"); return; }
    const citizen = (state.citizens || []).find((c) => c.id === inflictCitizenId);
    if (!citizen) { notify("Choisissez un citoyen.", "error"); return; }
    if (citizen.illness) { notify(`${citizen.name} est déjà malade.`, "error"); return; }
    const illness = rollIllnessInstance(illnessDef, state.dayCycle || 0);
    if (!illness) return;
    const newCitizens = (state.citizens || []).map((c) => (c.id === citizen.id ? applyIllnessToCitizen(c, illness) : c));
    const healthAlerts = [
      { id: `health_${citizen.id}_${Date.now()}`, toId: citizen.id, type: "illness_started", name: illness.name, description: illness.description, timestamp: Date.now() },
      ...(state.healthAlerts || []),
    ].slice(0, 300);
    onUpdateState({ ...state, citizens: newCitizens, healthAlerts });
    notify(`${citizen.name} est désormais malade (${illness.name}).`, "success");
    setInflictCitizenId(""); setInflictSearch("");
  };

  // --- Déclenchement manuel d'une épidémie (portée : monde / pays / région / entreprise) ---
  const [epiIllnessId, setEpiIllnessId] = useState("");
  const [epiScope, setEpiScope] = useState("ALL");
  const [epiScopeId, setEpiScopeId] = useState("");
  const [epiCountryId, setEpiCountryId] = useState(""); // pays parent, utilisé par la portée région
  const [epiRegionId, setEpiRegionId] = useState("");
  const [epiRate, setEpiRate] = useState(30);

  const epiCountryRegions = (state.countries || []).find((c) => c.id === epiCountryId)?.regions || [];

  const triggerEpidemic = () => {
    const illnessDef = illnesses.find((i) => i.id === epiIllnessId);
    if (!illnessDef) { notify("Choisissez une maladie à propager.", "error"); return; }
    if ((epiScope === "COUNTRY" || epiScope === "COMPANY") && !epiScopeId) {
      notify("Choisissez une cible.", "error");
      return;
    }
    if (epiScope === "REGION" && (!epiCountryId || !epiRegionId)) {
      notify("Choisissez un pays puis une région.", "error");
      return;
    }

    let company = null;
    let targetIds;
    if (epiScope === "ALL") {
      targetIds = null; // tout le monde
    } else if (epiScope === "COUNTRY") {
      targetIds = new Set(
        (state.citizens || [])
          .filter((c) => String(c.locationCountryId || c.countryId) === String(epiScopeId))
          .map((c) => String(c.id))
      );
    } else if (epiScope === "REGION") {
      const region = epiCountryRegions.find((r) => String(r.id) === String(epiRegionId));
      if (!region) { notify("Région introuvable.", "error"); return; }
      targetIds = new Set(
        (state.citizens || [])
          .filter((c) => String(c.locationCountryId || c.countryId) === String(epiCountryId) && (c.currentPosition || "") === (region.name || ""))
          .map((c) => String(c.id))
      );
    } else {
      company = (state.companies || []).find((c) => c.id === epiScopeId);
      if (!company) { notify("Entreprise introuvable.", "error"); return; }
      targetIds = new Set(
        [...(company.employees || []), ...(company.slaves || []), company.ownerId, company.ceoId]
          .filter(Boolean).map(String)
      );
    }

    const rate = Math.max(0, Math.min(100, epiRate));
    const newHealthAlerts = [];
    let infectedCount = 0;
    const newCitizens = (state.citizens || []).map((c) => {
      if (c.status === "Décédé" || c.illness) return c;
      if (targetIds && !targetIds.has(String(c.id))) return c;
      if (Math.random() * 100 >= rate) return c;
      const illness = rollIllnessInstance(illnessDef, state.dayCycle || 0);
      if (!illness) return c;
      infectedCount++;
      newHealthAlerts.push({
        id: `health_${c.id}_${Date.now()}_${infectedCount}`, toId: c.id, type: "illness_started",
        name: illness.name, description: illness.description, timestamp: Date.now(),
      });
      return applyIllnessToCitizen(c, illness);
    });

    if (infectedCount === 0) {
      notify("Aucun citoyen infecté (cible vide ou coup de chance).", "info");
      return;
    }

    const patch = {
      citizens: newCitizens,
      healthAlerts: [...newHealthAlerts, ...(state.healthAlerts || [])].slice(0, 300),
    };
    if (company) {
      const notifyIds = [...new Set([company.ownerId, company.ceoId].filter(Boolean))];
      const newCompanyAlerts = notifyIds.map((toId) => ({
        id: `epidemic_${company.id}_${Date.now()}_${toId}`, toId, type: "auto_event",
        companyId: company.id, companyName: company.name,
        title: `${illnessDef.icon || "🤒"} Épidémie de ${illnessDef.name}`,
        description: `Une épidémie de ${illnessDef.name} s'est déclarée dans l'entreprise (${infectedCount} touché${infectedCount > 1 ? "s" : ""}).`,
        timestamp: Date.now(),
      }));
      patch.companyAlerts = [...newCompanyAlerts, ...(state.companyAlerts || [])].slice(0, 300);
    }

    onUpdateState({ ...state, ...patch });
    notify(`Épidémie déclenchée : ${infectedCount} citoyen${infectedCount > 1 ? "s" : ""} infecté${infectedCount > 1 ? "s" : ""} (${illnessDef.name}).`, "success");
  };

  return (
    <div className="space-y-6">
      <SectionTitle icon={Activity}>Maladies Aléatoires</SectionTitle>
      <div className="text-xs text-stone-500 max-w-2xl">
        Effet passif et environnemental uniquement : réduit la production de l'employé touché et
        se signale sur son profil. Le système ne prend jamais de décision à la place d'un joueur
        (aucune démission, aucun message envoyé en son nom).
      </div>

      <Card className="p-6">
        <Toggle
          checked={!!cfg.enabled}
          onChange={(v) => save({ enabled: v }, v ? "Maladies aléatoires activées." : "Maladies aléatoires désactivées.")}
          label="Activer les maladies aléatoires"
          description={`Actuellement ${sickCount} citoyen${sickCount > 1 ? "s" : ""} malade${sickCount > 1 ? "s" : ""} dans le monde.`}
        />

        <div className="mt-5 pt-5 border-t border-stone-800 max-w-xs">
          <Label>Chance quotidienne par citoyen (%)</Label>
          <Input
            type="number" min="0" max="100" step="0.1"
            value={cfg.dailyChancePercent}
            onChange={(e) => save({ dailyChancePercent: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
          />
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-[9px] font-black uppercase tracking-widest text-stone-500">
          Maladies définies ({illnesses.length}) — poids relatif au tirage, durée et effet propres à chacune
        </div>
        <button
          onClick={addIllness}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/40 border border-red-800/50 text-red-300 text-[10px] font-black uppercase tracking-widest hover:bg-red-900/60"
        >
          <Plus size={12} /> Ajouter une maladie
        </button>
      </div>

      <div className="space-y-3">
        {illnesses.map((ill) => (
          <Card key={ill.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-14 shrink-0">
                <Label>Icône</Label>
                <Input
                  value={ill.icon}
                  onChange={(e) => updateIllness(ill.id, "icon", e.target.value)}
                  className="text-center text-lg"
                  maxLength={4}
                />
              </div>
              <div className="flex-1">
                <Label>Nom</Label>
                <Input
                  value={ill.name}
                  onChange={(e) => updateIllness(ill.id, "name", e.target.value)}
                  placeholder="Ex: Fièvre des marais"
                />
              </div>
              <button
                onClick={() => removeIllness(ill.id)}
                className="mt-5 text-stone-500 hover:text-red-400 p-2 shrink-0"
                title="Supprimer cette maladie"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="mt-3">
              <Label>Description (RP)</Label>
              <textarea
                value={ill.description}
                onChange={(e) => updateIllness(ill.id, "description", e.target.value)}
                placeholder="Symptômes, ton, ambiance..."
                rows={2}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-red-500/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div>
                <Label>Poids (tirage)</Label>
                <Input
                  type="number" min="0"
                  value={ill.weight}
                  onChange={(e) => updateIllness(ill.id, "weight", Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
              <div>
                <Label>Pénalité production (%)</Label>
                <Input
                  type="number" min="0" max="100"
                  value={ill.productionPenaltyPercent}
                  onChange={(e) => updateIllness(ill.id, "productionPenaltyPercent", Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                />
              </div>
              <div>
                <Label>Durée min. (j)</Label>
                <Input
                  type="number" min="1"
                  value={ill.minDurationDays}
                  onChange={(e) => updateIllness(ill.id, "minDurationDays", Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div>
                <Label>Durée max. (j)</Label>
                <Input
                  type="number" min="1"
                  value={ill.maxDurationDays}
                  onChange={(e) => updateIllness(ill.id, "maxDurationDays", Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-stone-800">
              <Label>Statuts infligés (visibles sur la fiche Physique & Magie, retirés à la guérison)</Label>
              {["physique", "magique"].map((key) => (
                <div key={key} className="flex flex-wrap gap-1.5 mt-1.5">
                  {STATUS_EFFECTS_CONFIG[key].map((eff) => {
                    const active = (ill.statusEffectIds || []).includes(eff.id);
                    return (
                      <button
                        key={eff.id}
                        type="button"
                        title={eff.desc}
                        onClick={() => toggleIllnessStatus(ill.id, eff.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold transition-all ${
                          active
                            ? "bg-red-900/60 border-red-700 text-red-300 ring-1 ring-red-600"
                            : "bg-stone-800 border-stone-700 text-stone-500 hover:text-stone-200 hover:border-stone-500"
                        }`}
                      >
                        <span>{eff.icon}</span>
                        <span>{eff.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        ))}
        {illnesses.length === 0 && (
          <div className="text-center py-8 text-stone-600 text-xs italic border border-dashed border-stone-700 rounded-xl">
            Aucune maladie définie — les maladies aléatoires n'auront aucun effet même si activées.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[9px] font-black uppercase tracking-widest text-stone-500">
          Traitements ({treatments.length}) — administrables en jeu par un citoyen dont l'occupation est "Apothicaire"
        </div>
        <button
          onClick={addTreatment}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/40 border border-red-800/50 text-red-300 text-[10px] font-black uppercase tracking-widest hover:bg-red-900/60"
        >
          <Plus size={12} /> Ajouter un traitement
        </button>
      </div>

      <div className="space-y-3">
        {treatments.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-14 shrink-0">
                <Label>Icône</Label>
                <Input value={t.icon} onChange={(e) => updateTreatment(t.id, "icon", e.target.value)} className="text-center text-lg" maxLength={4} />
              </div>
              <div className="flex-1">
                <Label>Nom</Label>
                <Input value={t.name} onChange={(e) => updateTreatment(t.id, "name", e.target.value)} placeholder="Ex: Décoction fébrifuge" />
              </div>
              <button onClick={() => removeTreatment(t.id)} className="mt-5 text-stone-500 hover:text-red-400 p-2 shrink-0" title="Supprimer ce traitement">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mt-3">
              <Label>Description (RP)</Label>
              <textarea
                value={t.description}
                onChange={(e) => updateTreatment(t.id, "description", e.target.value)}
                rows={2}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-red-500/50 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div className="sm:col-span-2">
                <Label>Effet</Label>
                <Select value={t.effect} onChange={(e) => updateTreatment(t.id, "effect", e.target.value)}>
                  {Object.entries(TREATMENT_EFFECTS).map(([id, meta]) => (
                    <option key={id} value={id}>{meta.label}</option>
                  ))}
                </Select>
              </div>
              {t.effect !== "CURE" && (
                <div>
                  <Label>Valeur ({TREATMENT_EFFECTS[t.effect]?.unit})</Label>
                  <Input type="number" min="0" value={t.value} onChange={(e) => updateTreatment(t.id, "value", Math.max(0, parseInt(e.target.value) || 0))} />
                </div>
              )}
              <div>
                <Label>Prix (Écus)</Label>
                <Input type="number" min="0" step="0.1" value={t.price} onChange={(e) => updateTreatment(t.id, "price", Math.max(0, parseFloat(e.target.value) || 0))} />
              </div>
            </div>
          </Card>
        ))}
        {treatments.length === 0 && (
          <div className="text-center py-8 text-stone-600 text-xs italic border border-dashed border-stone-700 rounded-xl">
            Aucun traitement défini — l'onglet Apothicaire n'aura rien à proposer.
          </div>
        )}
      </div>

      <Card className="p-6">
        <SectionTitle icon={Users}>Citoyens malades ({sickCount})</SectionTitle>
        {sickCitizens.length === 0 ? (
          <div className="text-xs text-stone-600 italic mt-2">Personne n'est malade actuellement.</div>
        ) : (
          <div className="space-y-2 mt-4 max-h-96 overflow-y-auto pr-1">
            {sickCitizens.map((c) => {
              const remaining = Math.max(0, (c.illness.durationDays || 0) - (c.illness.daysElapsed || 0));
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 bg-stone-800/50 border border-stone-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0">{c.illness.icon || "🤒"}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-stone-200 truncate">{c.name}</div>
                      <div className="text-[10px] text-stone-500">
                        {c.illness.name || c.illness.severityLabel || "Maladie"} — {remaining} jour{remaining > 1 ? "s" : ""} restant{remaining > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => cureCitizen(c.id)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-green-900/40 border border-green-800/50 text-green-300 text-[10px] font-black uppercase tracking-widest hover:bg-green-900/60"
                  >
                    Guérir
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <SectionTitle icon={Activity}>Infliger une maladie</SectionTitle>
        <div className="text-xs text-stone-500 mt-2 mb-4 max-w-2xl">
          Rend immédiatement malade un citoyen précis, avec la maladie de votre choix parmi celles définies ci-dessus.
        </div>
        {illnesses.length === 0 ? (
          <div className="text-xs text-stone-600 italic">Définissez au moins une maladie ci-dessus avant de pouvoir en infliger une.</div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Label>Citoyen</Label>
                <Input
                  value={inflictCitizenId ? (state.citizens || []).find((c) => c.id === inflictCitizenId)?.name || inflictSearch : inflictSearch}
                  onChange={(e) => { setInflictSearch(e.target.value); setInflictCitizenId(""); }}
                  placeholder="Chercher un citoyen…"
                />
                {inflictSearch && !inflictCitizenId && inflictMatches.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-stone-800 border border-stone-700 rounded-lg shadow-xl">
                    {inflictMatches.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setInflictCitizenId(c.id); setInflictSearch(c.name); }}
                        className="w-full text-left px-3 py-2 text-xs text-stone-200 hover:bg-stone-700 flex items-center justify-between"
                      >
                        {c.name}
                        {c.illness && <span className="text-[9px] text-yellow-500">déjà malade</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Maladie</Label>
                <Select value={inflictIllnessId} onChange={(e) => setInflictIllnessId(e.target.value)}>
                  <option value="">— Choisir —</option>
                  {illnesses.map((i) => (
                    <option key={i.id} value={i.id}>{i.icon} {i.name}</option>
                  ))}
                </Select>
              </div>
            </div>
            <BtnPrimary onClick={inflictIllness} className="w-full sm:w-auto px-6">
              <ShieldAlert size={14} /> Infliger
            </BtnPrimary>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <SectionTitle icon={ShieldAlert}>Déclencher une épidémie</SectionTitle>
        <div className="text-xs text-stone-500 mt-2 mb-4 max-w-2xl">
          Propage immédiatement une maladie définie ci-dessus à une partie de la population, pour
          un événement narratif ponctuel — indépendamment du tirage quotidien passif.
        </div>
        {illnesses.length === 0 ? (
          <div className="text-xs text-stone-600 italic">Définissez au moins une maladie ci-dessus avant de pouvoir déclencher une épidémie.</div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Maladie</Label>
                <Select value={epiIllnessId} onChange={(e) => setEpiIllnessId(e.target.value)}>
                  <option value="">— Choisir —</option>
                  {illnesses.map((i) => (
                    <option key={i.id} value={i.id}>{i.icon} {i.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Portée</Label>
                <Select value={epiScope} onChange={(e) => { setEpiScope(e.target.value); setEpiScopeId(""); setEpiCountryId(""); setEpiRegionId(""); }}>
                  <option value="ALL">Tout le monde</option>
                  <option value="COUNTRY">Un pays</option>
                  <option value="REGION">Une région / ville</option>
                  <option value="COMPANY">Une entreprise</option>
                </Select>
              </div>
              <div>
                <Label>Taux d'infection (%)</Label>
                <Input
                  type="number" min="0" max="100"
                  value={epiRate}
                  onChange={(e) => setEpiRate(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                />
              </div>
            </div>
            {epiScope === "COUNTRY" && (
              <div>
                <Label>Pays ciblé</Label>
                <Select value={epiScopeId} onChange={(e) => setEpiScopeId(e.target.value)}>
                  <option value="">— Choisir —</option>
                  {(state.countries || []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
            )}
            {epiScope === "REGION" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Pays</Label>
                  <Select value={epiCountryId} onChange={(e) => { setEpiCountryId(e.target.value); setEpiRegionId(""); }}>
                    <option value="">— Choisir —</option>
                    {(state.countries || []).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Région / ville</Label>
                  <Select value={epiRegionId} onChange={(e) => setEpiRegionId(e.target.value)} disabled={!epiCountryId}>
                    <option value="">— Choisir —</option>
                    {epiCountryRegions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
            )}
            {epiScope === "COMPANY" && (
              <div>
                <Label>Entreprise ciblée</Label>
                <Select value={epiScopeId} onChange={(e) => setEpiScopeId(e.target.value)}>
                  <option value="">— Choisir —</option>
                  {(state.companies || []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
            )}
            <BtnPrimary onClick={triggerEpidemic} className="w-full sm:w-auto px-6">
              <ShieldAlert size={14} /> Déclencher l'épidémie
            </BtnPrimary>
          </div>
        )}
      </Card>
    </div>
  );
};

/* ================================================
   RACES
   ================================================ */
const blankRace = () => ({
  id: `race_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  name: "Nouvelle race", description: "", icon: "❓", alcoholTolerance: 1,
});

const GMRaces = ({ state, onUpdateState, notify }) => {
  const cfg = { ...DEFAULT_RACE_CONFIG, ...(state.raceConfig || {}) };
  const races = cfg.races?.length ? cfg.races : DEFAULT_RACE_CONFIG.races;

  const save = (patch, msg) => {
    onUpdateState({ ...state, raceConfig: { ...cfg, ...patch } });
    if (msg) notify(msg, "success");
  };

  const updateRace = (id, field, value) => {
    const next = races.map((r) => (r.id === id ? { ...r, [field]: value } : r));
    save({ races: next });
  };

  const addRace = () => {
    save({ races: [...races, blankRace()] }, "Race ajoutée.");
  };

  const removeRace = (id) => {
    save({ races: races.filter((r) => r.id !== id) }, "Race supprimée.");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <SectionTitle icon={Dna}>Races & Espèces</SectionTitle>
      <p className="text-xs text-stone-500 max-w-2xl">
        Cette liste alimente le menu déroulant « Race / Espèce » du Registre de Population. Ajoute, modifie
        ou supprime des entrées librement — chaque citoyen déjà enregistré garde la race qui lui a été assignée
        même si tu la retires ensuite de la liste.
      </p>

      <div className="flex items-center justify-between">
        <div className="text-[9px] font-black uppercase tracking-widest text-stone-500">
          Races définies ({races.length})
        </div>
        <button
          onClick={addRace}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/40 border border-red-800/50 text-red-300 text-[10px] font-black uppercase tracking-widest hover:bg-red-900/60"
        >
          <Plus size={12} /> Ajouter une race
        </button>
      </div>

      <div className="space-y-3">
        {races.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-14 shrink-0">
                <Label>Icône</Label>
                <Input
                  value={r.icon}
                  onChange={(e) => updateRace(r.id, "icon", e.target.value)}
                  className="text-center text-lg"
                  maxLength={4}
                />
              </div>
              <div className="flex-1">
                <Label>Nom</Label>
                <Input
                  value={r.name}
                  onChange={(e) => updateRace(r.id, "name", e.target.value)}
                  placeholder="Ex: Orque"
                />
              </div>
              <button
                onClick={() => removeRace(r.id)}
                className="mt-5 text-stone-500 hover:text-red-400 p-2 shrink-0"
                title="Supprimer cette race"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mt-3">
              <Label>Description (lore)</Label>
              <textarea
                value={r.description}
                onChange={(e) => updateRace(r.id, "description", e.target.value)}
                placeholder="Particularités anatomiques, magiques, culturelles..."
                rows={2}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-red-500/50 resize-none"
              />
            </div>
            <div className="mt-3 max-w-xs">
              <Label>Tolérance à l'alcool (multiplicateur)</Label>
              <Input
                type="number" min="0.1" step="0.1"
                value={r.alcoholTolerance ?? 1}
                onChange={(e) => updateRace(r.id, "alcoholTolerance", Math.max(0.1, parseFloat(e.target.value) || 1))}
              />
              <p className="text-[9px] text-stone-500 mt-1">
                1 = neutre · &lt; 1 encaisse mieux (ex : 0.6) · &gt; 1 encaisse moins bien (ex : 1.3)
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

/* ================================================
   MAIN LAYOUT
   ================================================ */
const GameMasterView = ({ state, onUpdateState, notify, onClose, session }) => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showReset, setShowReset] = useState(false);
  const pendingChildCount = (state.pendingChildren || []).length;

  const questCount = (state.quests || []).filter((q) => q.status === "Active").length;

  const menuItems = [
    { id: "dashboard",   label: "Vue d'Ensemble",  icon: LayoutDashboard },
    { id: "accounts",    label: "Comptes",          icon: Users, badge: pendingChildCount || null },
    { id: "quests",      label: "Quêtes",           icon: ScrollText, badge: questCount || null },
    { id: "physique",    label: "Physique & Magie", icon: HeartPulse },
    { id: "maladies",    label: "Maladies",         icon: Activity },
    { id: "races",       label: "Races & Espèces",  icon: Dna },
    { id: "lore",        label: "Lore & Univers",   icon: BookOpen },
    { id: "lois",        label: "Lois & Nations",   icon: Gavel },
    { id: "calendrier",  label: "Calendrier",        icon: Calendar },
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
              <span className="text-[10px] font-black uppercase tracking-widest flex-1">{item.label}</span>
              {item.badge && (
                <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-amber-500 text-stone-900 text-[9px] font-black px-1">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-800 space-y-2">
          <button onClick={onClose} className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-stone-800 text-stone-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-stone-700 hover:border-stone-600">
            <ArrowLeft size={16} /> Retour au Jeu
          </button>
          <button
            onClick={() => setShowReset(true)}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all text-red-600 border-red-900/50 hover:bg-red-900/20 hover:text-red-400 hover:border-red-800/60"
          >
            <RefreshCw size={12} /> Réinitialiser
          </button>
          <div className="text-center opacity-30 pt-1">
            <Shield className="mx-auto mb-1 text-red-600" size={16} />
            <div className="text-[8px] uppercase tracking-[0.2em] font-black text-stone-600">Interface HRP</div>
          </div>
        </div>

      </aside>

      {/* ── Modal Réinitialiser ── */}
      {showReset && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-stone-950 border border-red-900/60 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-red-900/20 border-b border-red-900/40 p-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-900/40 border border-red-800/60 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-red-400">Réinitialiser les données</h2>
                <div className="text-[9px] text-stone-500 uppercase tracking-widest mt-0.5">Action irréversible</div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-red-900/10 border border-red-900/30 rounded-xl">
                <p className="text-[11px] text-red-300/80 leading-relaxed">
                  Cette action va <span className="font-black text-red-400">effacer définitivement</span> toutes les données du jeu :
                </p>
                <ul className="mt-2 space-y-1">
                  {["Citoyens & comptes", "Quêtes & objectifs", "Lore & entrées", "Gazette & publications", "Lois & nations", "Calendrier & événements", "Dettes & registres", "Candidatures en attente"].map((item) => (
                    <li key={item} className="text-[10px] text-red-400/70 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-red-700 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-[10px] text-stone-500 text-center">
                Les pays et la date de jeu seront conservés.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReset(false)}
                  className="flex-1 py-2.5 bg-stone-800 text-stone-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-stone-700 hover:text-stone-200 transition-all border border-stone-700"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    onUpdateState({
                      countries: state.countries || [],
                      gameDate: state.gameDate || { day: 1, month: 1, year: 1200 },
                      citizens: [],
                      gazette: [],
                      quests: [],
                      lore: [],
                      laws: [],
                      events: [],
                      pendingChildren: [],
                      debtRegistry: [],
                      companies: [],
                      jobs: [],
                      maisonRegistry: [],
                      library: [],
                      jobOffers: [],
                      hiddenTransfers: [],
                    });
                    setShowReset(false);
                    notify("Données réinitialisées.", "success");
                  }}
                  className="flex-1 py-2.5 bg-red-900/50 border border-red-800/50 text-red-300 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-900/70 transition-all"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                className={`p-2 rounded-lg transition-all shrink-0 relative ${
                  activeSection === item.id ? "bg-red-900/30 text-red-400" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <item.icon size={18} />
                {item.badge && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-amber-500 text-stone-900 text-[8px] font-black px-0.5">
                    {item.badge}
                  </span>
                )}
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
            {activeSection === "accounts" && (
              <>
                <GMPendingChildren state={state} onUpdateState={onUpdateState} notify={notify} />
                <GMAccounts state={state} onUpdateState={onUpdateState} notify={notify} session={session} />
              </>
            )}
            {activeSection === "quests" && <GMQuests state={state} onUpdateState={onUpdateState} notify={notify} />}
            {activeSection === "physique" && <GMPhysicsMagic state={state} onUpdateState={onUpdateState} notify={notify} />}
            {activeSection === "maladies" && <GMIllness state={state} onUpdateState={onUpdateState} notify={notify} />}
            {activeSection === "races" && <GMRaces state={state} onUpdateState={onUpdateState} notify={notify} />}
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
