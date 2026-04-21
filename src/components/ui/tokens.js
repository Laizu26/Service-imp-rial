/**
 * Design tokens partagés — source unique pour toutes les vues citoyennes.
 * Aucune vue ne doit redéfinir ces maps.
 */

// ─────────────────────────── ROLES ───────────────────────────
// (Extrait de CitizenLayout.js:872-890)
export const ROLE_COLORS = {
  EMPEREUR: {
    border: "border-yellow-500",
    bg: "bg-yellow-50",
    accent: "text-yellow-700",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  ROI: {
    border: "border-purple-500",
    bg: "bg-purple-50",
    accent: "text-purple-700",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
  },
  GRAND_FONC_GLOBAL: {
    border: "border-blue-500",
    bg: "bg-blue-50",
    accent: "text-blue-700",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
  },
  GRAND_FONC_LOCAL: {
    border: "border-blue-500",
    bg: "bg-blue-50",
    accent: "text-blue-700",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
  },
  INTENDANT: {
    border: "border-emerald-500",
    bg: "bg-emerald-50",
    accent: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  FONCTIONNAIRE: {
    border: "border-sky-500",
    bg: "bg-sky-50",
    accent: "text-sky-700",
    badge: "bg-sky-100 text-sky-800 border-sky-300",
  },
  POSTIERE: {
    border: "border-sky-500",
    bg: "bg-sky-50",
    accent: "text-sky-700",
    badge: "bg-sky-100 text-sky-800 border-sky-300",
  },
  CITOYEN: {
    border: "border-stone-400",
    bg: "bg-stone-50",
    accent: "text-stone-600",
    badge: "bg-stone-100 text-stone-700 border-stone-300",
  },
};

export const getRoleTheme = (role) => ROLE_COLORS[role] || ROLE_COLORS.CITOYEN;

// ─────────────────────────── STATUTS (contrats, dettes, etc.) ───────────────────────────
export const STATUS_COLORS = {
  DRAFT: {
    bg: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "Brouillon",
  },
  PENDING: {
    bg: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "En attente",
  },
  ACTIVE: {
    bg: "bg-blue-100 text-blue-800 border-blue-200",
    label: "Actif",
  },
  PAID: {
    bg: "bg-green-100 text-green-800 border-green-200",
    label: "Payé",
  },
  DONE: {
    bg: "bg-green-100 text-green-800 border-green-200",
    label: "Terminé",
  },
  CANCELLED: {
    bg: "bg-stone-100 text-stone-500 border-stone-200",
    label: "Annulé",
  },
  REJECTED: {
    bg: "bg-red-100 text-red-800 border-red-200",
    label: "Refusé",
  },
  EXPIRED: {
    bg: "bg-orange-100 text-orange-800 border-orange-200",
    label: "Expiré",
  },
};

// ─────────────────────────── RARETÉ ITEMS ───────────────────────────
export const RARITY_COLORS = {
  Commun: {
    bg: "bg-stone-100 text-stone-700 border-stone-200",
    label: "Commun",
  },
  Rare: {
    bg: "bg-blue-100 text-blue-800 border-blue-200",
    label: "Rare",
  },
  Épique: {
    bg: "bg-purple-100 text-purple-800 border-purple-200",
    label: "Épique",
  },
  Légendaire: {
    bg: "bg-yellow-100 text-yellow-800 border-yellow-300",
    label: "Légendaire",
  },
  Unique: {
    bg: "bg-red-100 text-red-800 border-red-200",
    label: "Unique",
  },
};

// ─────────────────────────── CATÉGORIES NOTIF ───────────────────────────
export const NOTIFICATION_CATEGORIES = {
  Messages: { bg: "#3b82f620", text: "#60a5fa", dot: "#3b82f6" },
  Emploi: { bg: "#10b98120", text: "#34d399", dot: "#10b981" },
  "Vie Civile": { bg: "#f59e0b20", text: "#fbbf24", dot: "#f59e0b" },
  Économie: { bg: "#eab30820", text: "#facc15", dot: "#eab308" },
  Santé: { bg: "#ef444420", text: "#f87171", dot: "#ef4444" },
  Autre: { bg: "#78716c20", text: "#a8a29e", dot: "#78716c" },
};

// ─────────────────────────── TYPES DE TRANSACTION (BankView) ───────────────────────────
export const TRANSACTION_LABELS = {
  TRANSFER: "Virement",
  MINT: "Frappe",
  SLAVE_PURCHASE: "Achat esclave",
  CONFISCATION: "Confiscation",
  MAISON: "Maison Asia",
  SALARY: "Salaire",
  MANUMISSION: "Affranchissement",
  DEBT_PAYMENT: "Remb. dette",
  HIDDEN_TRANSFER: "Transfert secret",
  HIDE_MONEY: "Dissimulation",
  WITHDRAW_HIDDEN: "Retrait caché",
  COMPANY_TREASURY: "Trésorerie",
  SALARY_WITHDRAW: "Retrait salaire",
  COMPANY_LEVEL: "Expansion",
  SUBCONTRACT: "Sous-traitance",
  PLAYER_MARKET: "Marché joueur",
  TRADE: "Échange",
  PROPERTY_PURCHASE: "Propriété",
  RENT: "Loyer",
  TRIAL_FINE: "Amende",
  GUILD: "Guilde",
  PROPERTY_SALE: "Vente propriété",
  PROPERTY_STAFF: "Salaire propriété",
  FAMILY: "Trésorerie familiale",
};

export const TRANSACTION_COLORS = {
  TRANSFER: "bg-blue-50 text-blue-700 border-blue-100",
  MINT: "bg-yellow-50 text-yellow-700 border-yellow-100",
  SLAVE_PURCHASE: "bg-red-50 text-red-700 border-red-100",
  CONFISCATION: "bg-orange-50 text-orange-700 border-orange-100",
  MAISON: "bg-pink-50 text-pink-700 border-pink-100",
  SALARY: "bg-green-50 text-green-700 border-green-100",
  MANUMISSION: "bg-purple-50 text-purple-700 border-purple-100",
  DEBT_PAYMENT: "bg-emerald-50 text-emerald-700 border-emerald-100",
  HIDDEN_TRANSFER: "bg-amber-50 text-amber-700 border-amber-100",
  HIDE_MONEY: "bg-stone-50 text-stone-600 border-stone-100",
  WITHDRAW_HIDDEN: "bg-stone-50 text-stone-600 border-stone-100",
  COMPANY_TREASURY: "bg-indigo-50 text-indigo-700 border-indigo-100",
  SALARY_WITHDRAW: "bg-teal-50 text-teal-700 border-teal-100",
  COMPANY_LEVEL: "bg-violet-50 text-violet-700 border-violet-100",
  SUBCONTRACT: "bg-orange-50 text-orange-700 border-orange-100",
  PLAYER_MARKET: "bg-cyan-50 text-cyan-700 border-cyan-100",
  TRADE: "bg-lime-50 text-lime-700 border-lime-100",
  PROPERTY_PURCHASE: "bg-rose-50 text-rose-700 border-rose-100",
  RENT: "bg-sky-50 text-sky-700 border-sky-100",
  TRIAL_FINE: "bg-red-50 text-red-700 border-red-100",
  GUILD: "bg-purple-50 text-purple-700 border-purple-100",
  PROPERTY_SALE: "bg-rose-50 text-rose-700 border-rose-100",
  PROPERTY_STAFF: "bg-teal-50 text-teal-700 border-teal-100",
  FAMILY: "bg-amber-50 text-amber-700 border-amber-100",
};

// ─────────────────────────── TAILLES ───────────────────────────
export const SIZES = {
  sm: { padding: "px-3 py-1.5", text: "text-[10px]", icon: 12 },
  md: { padding: "px-4 py-2.5", text: "text-xs", icon: 14 },
  lg: { padding: "px-5 py-3", text: "text-sm", icon: 16 },
};
