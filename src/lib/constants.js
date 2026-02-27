export const SYSTEM_CONFIG = {
  firebase: {
    apiKey:
      process.env.REACT_APP_FIREBASE_API_KEY ||
      "AIzaSyAmAK0k0yeVNjTKc5T2db_6QfZ6bZykGI8",
    authDomain:
      process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
      "rpempire-f3123.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "rpempire-f3123",
    storageBucket:
      process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
      "rpempire-f3123.firebasestorage.app",
    messagingSenderId:
      process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1026740352554",
    appId:
      process.env.REACT_APP_FIREBASE_APP_ID ||
      "1:1026740352554:web:5dddfcad63ff16bc273553",
    measurementId:
      process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-5EWR3WZR7S",
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
      // Lois locales (valeurs par défaut)
      laws: {
        allowExternalDebits: false, // autorise les prélèvements par des admins locaux venant d'autres pays
        allowLocalConfiscation: true, // autorise la confiscation locale des fonds d'un sujet
        allowLocalSales: true, // autorise la mise en vente locale d'objets ou sujets
        allowPermissionEditsByLocalAdmins: true, // autorise modification des permissions par admins locaux
        requireRulerApprovalForSales: false, // nécessite approbation du souverain pour mettre en vente

        // ÉCONOMIE & BANQUE
        taxForeignTransfers: false, // taxe 10% appliquée aux virements entrants depuis un autre pays
        freezeAssets: false, // interdit aux citoyens de retirer ou transférer des fonds
        closedCurrency: false, // seuls les résidents peuvent recevoir de l'argent

        // FRONTIÈRES & VOYAGE
        closeBorders: false, // rejette automatiquement les nouvelles demandes de visa
        entryVisaFee: 0, // coût (Écus) pour demander un visa d'entrée
        forbidExit: false, // interdit demandes de visa de sortie

        // SOCIÉTÉ & MAISON DE ASIA
        allowSelfManumission: false, // permet à un esclave de s'acheter sa liberté
        militaryServitude: false, // transforme la main d'œuvre en servitude militaire
        banPublicSlaveMarket: false, // interdit mise en vente publique des esclaves

        // JUSTICE & INVENTAIRE
        allowWeapons: true, // si false, possession d'armes est illégale
        mailCensorship: false, // si true, le courrier peut être censuré/consulté localement
      },
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
  quests: [],
  treasury: 50000,
  dayCycle: 1,
  lastUpdate: 0,
};
