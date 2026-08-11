export const SYSTEM_CONFIG = {
  firebase: {
    apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId:     process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
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
  ERUDIT: { label: "📚 Érudit", level: 5, scope: "NONE" },
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

        // ÉRUDIT
        eruditSalary: 0, // écus versés chaque jour par le pays à chaque Érudit reconnu

        // MARIAGE
        marriageStructure: "monogamie", // monogamie | polygamie | polyandrie | polyamour
        marriageDefaultFiliation: "patrilineaire", // filiation par défaut des enfants
        marriageMinAge: 16, // âge minimum légal pour se marier
        requireChildApproval: false, // si true, les déclarations d'enfants nécessitent validation admin
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
  maisonServiceCategories: [],
  maisonSubscriptions: [],
  maisonSubscriptionPrice: 50,
  treasury: 50000,
  dayCycle: 1,
  lastUpdate: 0,
  jobContracts: [],
  quests: [],
  gmHash: "",
  bourseListings: [],
  postalAlerts: [],
  eruditRequests: [],
  eruditResearch: [],
  combatSessions: [],
  combatEffects: [],
  mushtagramPosts: [],
  mushtagramDMs: [],
  mushtagramStories: [],
};

// ─── SYSTÈME MATRIMONIAL ───────────────────────────────────────────────────

export const MARRIAGE_STRUCTURES = {
  monogamie:  { label: "Lien Unique",       emoji: "💍", description: "Un seul époux ou épouse, selon la coutume ancienne" },
  polygamie:  { label: "Polygamie",          emoji: "👑", description: "Un seigneur peut prendre plusieurs épouses" },
  polyandrie: { label: "Polyandrie",         emoji: "🌙", description: "Une dame peut prendre plusieurs époux" },
  polyamour:  { label: "Union Libre",        emoji: "🌿", description: "Plusieurs liens autorisés sans restriction de sang" },
};

export const MARRIAGE_CONTRACT_TYPES = [
  { id: "sacre",       label: "Mariage Sacré",             emoji: "⛪", description: "Union bénie par les dieux devant l'autel" },
  { id: "feodal",      label: "Mariage Féodal",            emoji: "🏰", description: "Accord entre maisons pour sceller une alliance" },
  { id: "serment",     label: "Serment de Sang",           emoji: "🩸", description: "Lien magique scellé par le sang des deux époux" },
  { id: "alliance",    label: "Alliance Politique",        emoji: "⚔️", description: "Union stratégique entre royaumes ou clans" },
  { id: "promesse",    label: "Promesse sous les Étoiles", emoji: "🌙", description: "Engagement libre sans cérémonie officielle" },
  { id: "arcane",      label: "Pacte Arcanique",           emoji: "🔮", description: "Union magique liée par un sortilège ancien — les traces magiques des époux se lient et deviennent proches, sans jamais se confondre" },
];

// Contrats que les vœux rendent indissolubles : aucun divorce possible, seule la mort
// (ou une décision tutoriale pour une union d'esclave) peut y mettre fin.
export const MARRIAGE_INDISSOLUBLE_TYPES = ["sacre", "feodal", "serment", "arcane"];

// Régime de fond : comment les richesses sont gérées au quotidien
export const MARRIAGE_REGIMES = [
  { id: "separation",    label: "Biens Séparés",    emoji: "🔒", description: "Chaque époux conserve ses terres et possessions en propre" },
  { id: "communaute",    label: "Trésor Commun",    emoji: "🪙", description: "Un trésor partagé s'ajoute aux bourses personnelles — chacun peut y déposer et retirer" },
  { id: "fief_conjoint", label: "Fief Conjoint",    emoji: "🏰", description: "Un fief commun est accordé au couple — l'époux dominant en a la gestion exclusive" },
];

// Dot des noces : transaction unique lors de l'union
export const MARRIAGE_DOT_TYPES = [
  { id: "aucune",       label: "Aucune Dot",         emoji: "🤝", description: "Pas de transfert de richesse lors des noces" },
  { id: "dotal_epouse", label: "Dot de l'Épouse",    emoji: "💎", description: "La famille de l'épouse verse une dot au prétendant lors des noces" },
  { id: "dotal_epoux",  label: "Dot du Prétendant",  emoji: "💰", description: "Le prétendant verse une dot à la famille de l'épouse lors des noces" },
];

// Domination : qui dirige l'union, gère le fief/biens et peut restreindre l'accès de l'autre
// (voyage, Mushtagram, banque, marché) — à la manière d'un contrat de servage.
// "egal" / "proposant_dominant" / "cible_dominante" résolvent toujours vers un dominantId
// concret des deux côtés. "epoux_dominant"/"epouse_dominante" sont conservés pour l'affichage
// des unions existantes mais ne sont plus proposés lors d'une nouvelle union.
export const MARRIAGE_DOMINANCE = [
  { id: "egal",               label: "Union Égale",        emoji: "⚖️", description: "Les deux époux ont les mêmes droits sur les biens, la lignée et l'autre" },
  { id: "proposant_dominant", label: "Moi, Dominant(e)",   emoji: "📜", description: "Vous dirigez l'union, gérez les biens et pouvez restreindre l'accès de votre partenaire" },
  { id: "cible_dominante",    label: "Partenaire Dominant(e)", emoji: "👑", description: "Votre partenaire dirige l'union, gère les biens et peut restreindre votre accès" },
  { id: "epoux_dominant",     label: "Époux Dominant",     emoji: "🛡️", description: "L'époux masculin dirige l'union, gère le fief et impose sa lignée" },
  { id: "epouse_dominante",   label: "Épouse Dominante",   emoji: "👑", description: "L'épouse dirige l'union, gère le fief et impose sa lignée" },
];

export const FILIATION_TYPES = [
  { id: "patrilineaire", label: "Patrilinéaire", description: "Le sang du père transmet le nom, le titre et l'héritage" },
  { id: "matrilineaire", label: "Matrilinéaire", description: "Le sang de la mère transmet le nom, le titre et l'héritage" },
  { id: "bilineaire",    label: "Bilinéaire",    description: "Les deux lignées sont reconnues à parts égales" },
  { id: "cognatique",    label: "Au Choix",      description: "Les époux décident librement de la lignée à transmettre" },
];

// Tutelle parentale : condition activable unilatéralement par un parent sur son enfant
// devenu citoyen (même adulte), à la manière du contrat de servage — le parent peut alors
// restreindre certains droits de l'enfant tant que la tutelle reste active.
export const CHILD_RIGHTS_LIST = [
  { key: "marriageLocked",   icon: "💍", label: "Bloquer le mariage",             desc: "Interdit de proposer ou d'accepter une union sans lever la tutelle" },
  { key: "travelLocked",     icon: "🚫", label: "Bloquer le voyage",              desc: "Empêche tout déplacement inter-pays" },
  { key: "mushtagramLocked", icon: "📵", label: "Bloquer Mushtagram",             desc: "Interdit l'accès au réseau social" },
  { key: "bankLocked",       icon: "🏦", label: "Bloquer le compte bancaire",     desc: "Interdit les opérations bancaires" },
  { key: "creditLocked",     icon: "📄", label: "Bloquer les emprunts",           desc: "Interdit de signer un contrat de dette en tant que débiteur" },
  { key: "marketLocked",     icon: "🛒", label: "Bloquer le marché",              desc: "Interdit les échanges commerciaux (Bourse, Bazar, Échanges)" },
  { key: "postLocked",       icon: "✉️", label: "Bloquer la Poste Impériale",     desc: "Interdit l'envoi et la réception de courrier" },
  { key: "maisonLocked",     icon: "💋", label: "Bloquer la Maison de Asia",      desc: "Interdit l'accès à la maison de plaisir" },
];

// Races/espèces jouables — liste par défaut, modifiable par le Maître du Jeu (voir GMRaces dans
// GameMasterView.js, sauvegardée dans state.raceConfig.races) et utilisée par le menu déroulant
// "Race / Espèce" du Registre de Population.
// alcoholTolerance : multiplicateur appliqué au gain d'ivresse (voir rollDrunkenGain,
// gameUtils.js) — 1 = neutre, < 1 encaisse mieux, > 1 encaisse moins bien.
export const DEFAULT_RACE_CONFIG = {
  races: [
    { id: "humain", name: "Humain", icon: "🧑", description: "Race commune, réputée faible en apparence. Renferme pourtant la plus grande réserve d'énergie latente derrière l'estomac — mais des connexions magiques souvent faibles, voire inexistantes.", alcoholTolerance: 1 },
    { id: "elfe", name: "Elfe", icon: "🧝", description: "Race millénaire aux connexions magiques nombreuses et intriquées, indissociables de leur source de pouvoir. Peu de magie avant 50 ans.", alcoholTolerance: 1 },
    { id: "nain", name: "Nain", icon: "⛏️", description: "Fonctionnement décentralisé : des récepteurs indépendants répartis dans tout le corps communiquent directement avec le centre de pouvoir, sans réseau filaire classique.", alcoholTolerance: 0.6 },
    { id: "succube", name: "Succube", icon: "😈", description: "Source de pouvoir divisée en deux : une petite partie près du cerveau, la plus grande près des organes génitaux. Jamais de connexions inexistantes à la naissance.", alcoholTolerance: 1 },
    { id: "vampire", name: "Vampire", icon: "🧛", description: "Noyau unique et volumineux au niveau du cerveau, connexions vers le cortex et les yeux. Les transformés récents conservent brièvement des traces de leur ancien noyau racial.", alcoholTolerance: 1 },
    { id: "fee", name: "Fée", icon: "🧚", description: "Pas de noyau interne : toute l'architecture magique se concentre à la base des ailes. Sans ailes, plus aucune capacité magique.", alcoholTolerance: 1.3 },
    { id: "animagus", name: "Animagus", icon: "🐾", description: "Anatomie semblable à celle d'un humain, mais forcément magique.", alcoholTolerance: 1 },
  ],
};
