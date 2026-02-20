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
  "Esclave",
  "Diplomate",
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

        // MARIAGE
        marriageStructure: "monogamie", // monogamie | polygamie | polyandrie | polyamour
        marriageDefaultFiliation: "patrilineaire", // filiation par défaut des enfants
        marriageMinAge: 16, // âge minimum légal pour se marier
      },
      regions: [{ id: "r1", name: "Capitale", status: "Calme" }],
      customRoles: [],
      decrees: [],
      books: [],
    },
  ],
  gameDate: { day: 1, month: 1, year: 1200 },
  citizens: [],
  companies: [],
  travelRequests: [],
  debtRegistry: [],
  maisonRegistry: [],
  inventoryCatalog: [
    {
      id: "i1",
      name: "Rations",
      description: "Vivres de base pour sustenter un homme durant une journée.",
      rarity: "Commun",
      type: "Consommable",
      category: "Nourriture",
      price: 5,
      weight: 0.5,
      imageUrl: "",
      hidden: false,
      stackable: true,
      usable: false,
      stock: -1,
    },
  ],
  globalLedger: [],
  gazette: [],
  maisonStaff: [],
  maisonQueue: [],
  maisonHistory: [],
  maisonReviews: [],
  maisonDefaultDuration: 60,
  treasury: 50000,
  dayCycle: 1,
  lastUpdate: 0,
  jobContracts: [],
  gmHash: "",
};

// ─── SYSTÈME MATRIMONIAL ───────────────────────────────────────────────────

export const MARRIAGE_STRUCTURES = {
  monogamie:  { label: "Lien Unique",       emoji: "💍", description: "Un seul époux ou épouse, selon la coutume ancienne" },
  polygamie:  { label: "Polygamie",          emoji: "👑", description: "Un seigneur peut prendre plusieurs épouses" },
  polyandrie: { label: "Polyandrie",         emoji: "🌙", description: "Une dame peut prendre plusieurs époux" },
  polyamour:  { label: "Union Libre",        emoji: "🌿", description: "Plusieurs liens autorisés sans restriction de sang" },
};

export const MARRIAGE_CONTRACT_TYPES = [
  { id: "sacre",       label: "Mariage Sacré",          emoji: "⛪", description: "Union bénie par les dieux devant l'autel" },
  { id: "feodal",      label: "Mariage Féodal",         emoji: "🏰", description: "Accord entre maisons pour sceller une alliance" },
  { id: "serment",     label: "Serment de Sang",        emoji: "🩸", description: "Lien magique scellé par le sang des deux époux" },
  { id: "alliance",    label: "Alliance Politique",     emoji: "⚔️", description: "Union stratégique entre royaumes ou clans" },
  { id: "promesse",    label: "Promesse sous les Étoiles", emoji: "🌙", description: "Engagement libre sans cérémonie officielle" },
  { id: "arcane",      label: "Pacte Arcanique",        emoji: "🔮", description: "Union magique liée par un sortilège ancien" },
];

export const MARRIAGE_REGIMES = [
  { id: "communaute",    label: "Biens en Commun",          description: "Tous les avoirs sont mis en partage dès les noces" },
  { id: "separation",    label: "Biens Séparés",            description: "Chaque époux conserve ses terres et possessions" },
  { id: "dotal_epouse",  label: "Dot de l'Épouse",          description: "La famille de l'épouse verse une dot au seigneur" },
  { id: "dotal_epoux",   label: "Dot de l'Époux",           description: "Le prétendant verse une dot à la famille de l'épouse" },
  { id: "fief_conjoint", label: "Fief Conjoint",            description: "Un fief est partagé ou créé pour le couple" },
];

export const FILIATION_TYPES = [
  { id: "patrilineaire", label: "Patrilinéaire", description: "Le sang du père transmet le nom, le titre et l'héritage" },
  { id: "matrilineaire", label: "Matrilinéaire", description: "Le sang de la mère transmet le nom, le titre et l'héritage" },
  { id: "bilineaire",    label: "Bilinéaire",    description: "Les deux lignées sont reconnues à parts égales" },
  { id: "cognatique",    label: "Au Choix",      description: "Les époux décident librement de la lignée à transmettre" },
];
