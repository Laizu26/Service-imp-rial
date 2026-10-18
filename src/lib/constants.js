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
  guilds: [],
  guildAlerts: [],
  mushtagramGroups: [],
  contracts: [],
  contractAlerts: [],
  guardAlerts: [],
  careRequests: [],
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
  school: null,
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

// ── Guildes & Associations ──────────────────────────────────────────────────
export const GUILD_TYPES = [
  { id: "GENERAL",    label: "Générale",   emoji: "🏛️", description: "Association généraliste, ouverte à toutes les vocations" },
  { id: "COMMERCE",   label: "Commerce",   emoji: "⚖️", description: "Marchands, financiers et négociants" },
  { id: "MILITAIRE",  label: "Militaire",  emoji: "⚔️", description: "Ordre martial, gardes et compagnies armées" },
  { id: "RELIGIEUX",  label: "Religieux",  emoji: "✝️", description: "Culte, clergé et dévotion" },
  { id: "ARTISAN",    label: "Artisanat",  emoji: "🔨", description: "Métiers manuels et corporations d'artisans" },
];

// Rangs structurés d'une guilde — remplace l'ancien champ libre "role" (purement cosmétique,
// sans droit réel). Le Chef est unique et porté par guild.leaderId, pas par ce tableau ; il
// reste toujours au niveau le plus élevé quel que soit son rang stocké sur members[].
export const GUILD_RANKS = [
  { id: "MEMBRE",   label: "Membre",   level: 0 },
  { id: "OFFICIER", label: "Officier", level: 1 },
  { id: "CHEF",     label: "Chef",     level: 2 },
];

// Races/espèces jouables — liste par défaut, modifiable par le Maître du Jeu (voir GMRaces dans
// GameMasterView.js, sauvegardée dans state.raceConfig.races) et utilisée par le menu déroulant
// "Race / Espèce" du Registre de Population.
// alcoholTolerance : multiplicateur appliqué au gain d'ivresse (voir rollDrunkenGain,
// gameUtils.js) — 1 = neutre, < 1 encaisse mieux, > 1 encaisse moins bien.
// magicCircuit : { points: [{id,x,y,size}], linked } — représentation visuelle du circuit
// magique sur la silhouette (voir MagicCircuitEditor.js, éditable librement par le GM), x/y en
// pourcentage (0-100) du corps, size ∈ "s"|"m"|"l", linked relie les points par des lignes.
export const DEFAULT_RACE_CONFIG = {
  races: [
    { id: "humain", name: "Humain", icon: "🧑", description: "Race commune, réputée faible en apparence. Renferme pourtant la plus grande réserve d'énergie latente derrière l'estomac — mais des connexions magiques souvent faibles, voire inexistantes.", alcoholTolerance: 1,
      magicCircuit: { points: [{ id: "h1", x: 50, y: 39, size: "s" }], linked: false } },
    { id: "elfe", name: "Elfe", icon: "🧝", description: "Race millénaire aux connexions magiques nombreuses et intriquées, indissociables de leur source de pouvoir. Peu de magie avant 50 ans.", alcoholTolerance: 1,
      magicCircuit: { points: [
        { id: "e1", x: 50, y: 7, size: "m" }, { id: "e2", x: 50, y: 22, size: "m" }, { id: "e3", x: 50, y: 39, size: "m" }, { id: "e4", x: 50, y: 49, size: "m" },
        { id: "e5", x: 20, y: 26, size: "s" }, { id: "e6", x: 80, y: 26, size: "s" }, { id: "e7", x: 33, y: 80, size: "s" }, { id: "e8", x: 67, y: 80, size: "s" },
      ], linked: true } },
    { id: "nain", name: "Nain", icon: "⛏️", description: "Fonctionnement décentralisé : des récepteurs indépendants répartis dans tout le corps communiquent directement avec le centre de pouvoir, sans réseau filaire classique.", alcoholTolerance: 0.6,
      magicCircuit: { points: [
        { id: "n1", x: 50, y: 7, size: "s" }, { id: "n2", x: 50, y: 22, size: "s" }, { id: "n3", x: 50, y: 39, size: "s" },
        { id: "n4", x: 20, y: 26, size: "s" }, { id: "n5", x: 80, y: 26, size: "s" }, { id: "n6", x: 33, y: 80, size: "s" }, { id: "n7", x: 67, y: 80, size: "s" },
      ], linked: false } },
    { id: "succube", name: "Succube", icon: "😈", description: "Source de pouvoir divisée en deux : une petite partie près du cerveau, la plus grande près des organes génitaux. Jamais de connexions inexistantes à la naissance.", alcoholTolerance: 1,
      magicCircuit: { points: [{ id: "su1", x: 50, y: 8, size: "s" }, { id: "su2", x: 50, y: 49, size: "l" }], linked: true } },
    { id: "vampire", name: "Vampire", icon: "🧛", description: "Noyau unique et volumineux au niveau du cerveau, connexions vers le cortex et les yeux. Les transformés récents conservent brièvement des traces de leur ancien noyau racial.", alcoholTolerance: 1,
      magicCircuit: { points: [{ id: "v1", x: 44, y: 8, size: "s" }, { id: "v2", x: 50, y: 7, size: "l" }, { id: "v3", x: 56, y: 8, size: "s" }], linked: true } },
    { id: "fee", name: "Fée", icon: "🧚", description: "Pas de noyau interne : toute l'architecture magique se concentre à la base des ailes. Sans ailes, plus aucune capacité magique.", alcoholTolerance: 1.3,
      magicCircuit: { points: [{ id: "f1", x: 37, y: 19, size: "m" }, { id: "f2", x: 63, y: 19, size: "m" }], linked: true } },
    { id: "animagus", name: "Animagus", icon: "🐾", description: "Anatomie semblable à celle d'un humain, mais forcément magique.", alcoholTolerance: 1,
      magicCircuit: { points: [{ id: "a1", x: 50, y: 39, size: "m" }], linked: false } },
  ],
};

// Motifs de signalement Mushtagram (voir onReportMushtagramPost/onReportMushtagramComment,
// useGameActions.js) — proposés au citoyen qui signale, affichés à la modération.
export const MUSHTAGRAM_REPORT_REASONS = [
  { id: "spam", label: "Spam / publicité" },
  { id: "harcelement", label: "Harcèlement / intimidation" },
  { id: "choquant", label: "Contenu choquant ou violent" },
  { id: "arnaque", label: "Arnaque / fraude" },
  { id: "desinformation", label: "Désinformation" },
  { id: "autre", label: "Autre" },
];

// ─── ACADÉMIE IMPÉRIALE ────────────────────────────────────────────────────

export const DEFAULT_SCHOOL = {
  name: "Académie Impériale",
  description: "L'institution académique au service de l'Empire.",
  motto: "Sapientia et Virtus",
  active: true,
  subjects: [
    { id: "subj_rhetorique",    name: "Rhétorique",    description: "L'art de convaincre et de bien parler.", icon: "📜", year: "all", teachers: [], color: "#7C3AED" },
    { id: "subj_alchimie",      name: "Alchimie",      description: "La science des matières et de leurs transformations.", icon: "⚗️", year: "all", teachers: [], color: "#059669" },
    { id: "subj_escrime",       name: "Escrime",        description: "La maîtrise de l'épée et du combat noble.", icon: "⚔️", year: "all", teachers: [], color: "#DC2626" },
    { id: "subj_theologie",     name: "Théologie",      description: "L'étude des divinités et des textes sacrés.", icon: "✝️", year: "all", teachers: [], color: "#D97706" },
    { id: "subj_hermeneutique", name: "Herméneutique",  description: "L'interprétation des textes anciens.", icon: "🔍", year: "all", teachers: [], color: "#0891B2" },
    { id: "subj_arithmetique",  name: "Arithmétique",   description: "Les nombres, le calcul et la logique.", icon: "🔢", year: 1,     teachers: [], color: "#64748B" },
    { id: "subj_geographie",    name: "Géographie",     description: "La connaissance des terres et des royaumes.", icon: "🗺️", year: 2,     teachers: [], color: "#0D9488" },
    { id: "subj_heraldique",    name: "Héraldique",     description: "Les armoiries, blasons et symboles nobles.", icon: "🛡️", year: 3,     teachers: [], color: "#9333EA" },
  ],
  schedule: [],
  clubs: [],
  announcements: [],
  staff: [],
  currentWeek: 1,
};

export const SCHOOL_LIFE_EVENT_TYPES = {
  retard:     { label: "Retard",     color: "#F59E0B", bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700"  },
  absence:    { label: "Absence",    color: "#EF4444", bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700"    },
  punition:   { label: "Punition",   color: "#DC2626", bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700"    },
  detention:  { label: "Retenue",    color: "#9333EA", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  recompense: { label: "Récompense", color: "#16A34A", bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700"  },
  mention:    { label: "Mention",    color: "#2563EB", bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700"   },
  expulsion:  { label: "Expulsion",  color: "#1E1E1E", bg: "bg-stone-100", border: "border-stone-400",  text: "text-stone-900"  },
};

export const SCHOOL_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
export const SCHOOL_TIME_SLOTS = ["Matin", "Après-midi", "Soir"];

export const SCHOOL_STAFF_ROLES = [
  { id: "directeur",    label: "Directeur",          icon: "🎓", description: "Dirige l'Académie et en définit les orientations" },
  { id: "directeur_adj",label: "Directeur Adjoint",  icon: "📋", description: "Seconde le directeur et le remplace en son absence" },
  { id: "surveillant",  label: "Surveillant",         icon: "👁️", description: "Assure l'ordre et la discipline dans les couloirs" },
  { id: "infirmier",    label: "Infirmier / Infirmière", icon: "🏥", description: "Prend soin de la santé des élèves et du personnel" },
  { id: "intendant",    label: "Intendant",           icon: "🔑", description: "Gère les ressources matérielles et financières" },
  { id: "bibliothecaire",label: "Bibliothécaire",    icon: "📚", description: "Garde et organise les ouvrages de l'Académie" },
  { id: "concierge",    label: "Concierge",           icon: "🧹", description: "Entretien des locaux et gestion des accès" },
  { id: "conseiller",   label: "Conseiller",          icon: "💬", description: "Accompagne les élèves dans leur parcours scolaire" },
];
