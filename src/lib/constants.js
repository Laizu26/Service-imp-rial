export const SYSTEM_CONFIG = {
  firebase: {
    apiKey: "AIzaSyAmAK0k0yeVNjTKc5T2db_6QfZ6bZykGI8",
    authDomain: "rpempire-f3123.firebaseapp.com",
    projectId: "rpempire-f3123",
    storageBucket: "rpempire-f3123.firebasestorage.app",
    messagingSenderId: "1026740352554",
    appId: "1:1026740352554:web:5dddfcad63ff16bc273553",
    measurementId: "G-5EWR3WZR7S",
  },
  appId: "empire-prod-v1",
  dbPath: [
    "artifacts",
    "empire-prod-v1",
    "public",
    "data",
    "gamestate",
    "core",
  ],
};

export const ROLES = {
  EMPEREUR: { label: "👑 Grand Empereur", level: 100, scope: "GLOBAL" },
  GRAND_FONC_GLOBAL: {
    label: "🏛️ Grand Fonctionnaire (Empire)",
    level: 90,
    scope: "GLOBAL",
  },
  ROI: { label: "👑 Roi (Local)", level: 50, scope: "LOCAL" },
  INTENDANT: { label: "💰 Intendant", level: 45, scope: "LOCAL" },
  GRAND_FONC_LOCAL: {
    label: "📜 Grand Fonctionnaire (Pays)",
    level: 40,
    scope: "LOCAL",
  },
  FONCTIONNAIRE: { label: "📝 Fonctionnaire", level: 30, scope: "LOCAL" },
  POSTIERE: { label: "🦅 Postière", level: 20, scope: "LOCAL" },
  CITOYEN: { label: "👤 Citoyen", level: 0, scope: "NONE" },
};

export const BASE_STATUSES = [
  "Actif",
  "Malade",
  "Prisonnier",
  "Banni",
  "Décédé",
];

export const DEFAULT_GAME_STATE = {
  countries: [
    {
      id: "C1",
      name: "Empire Central",
      rulerName: "Sa Majesté Impériale",
      description: "Le cœur battant de la civilisation.",
      specialty: "Politique",
      population: 150000,
      color: "bg-yellow-50",
      treasury: 10000,
      stability: 80,
      security: 60,
      prosperity: 70,
      laws: [],
      regions: [{ id: "r1", name: "Capitale", status: "Calme" }],
      customRoles: [],
    },
  ],
  citizens: [],
  travelRequests: [],
  debtRegistry: [],
  inventoryCatalog: [
    {
      id: "i1",
      name: "Rations",
      description: "Vivres de base",
      rarity: "Commun",
      type: "Consommable",
      price: 5,
      weight: 0.5,
      imageUrl: "",
      hidden: false,
    },
  ],
  globalLedger: [],
  treasury: 50000,
  dayCycle: 1,
  lastUpdate: 0,
};
