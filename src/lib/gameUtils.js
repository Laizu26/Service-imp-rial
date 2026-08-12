/**
 * Calcule l'âge d'un citoyen à partir de sa date de naissance RP et de la date de jeu actuelle.
 * @param {{ day: number, month: number, year: number }} birthDate
 * @param {{ day: number, month: number, year: number }} gameDate
 * @returns {number}
 */
export function computeAge(birthDate, gameDate) {
  if (!birthDate || !gameDate) return 0;
  let age = gameDate.year - birthDate.year;
  if (
    gameDate.month < birthDate.month ||
    (gameDate.month === birthDate.month && gameDate.day < birthDate.day)
  ) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Convertit un ancien champ `age` (entier) en `birthDate` { day, month, year }
 * en soustrayant l'âge de la date de jeu actuelle.
 * @param {number} age
 * @param {{ day: number, month: number, year: number }} gameDate
 * @returns {{ day: number, month: number, year: number }}
 */
export function ageToBirthDate(age, gameDate) {
  if (!gameDate) return { day: 1, month: 1, year: 1180 };
  return {
    day: gameDate.day,
    month: gameDate.month,
    year: gameDate.year - (age || 20),
  };
}

/**
 * Retourne l'âge affiché d'un citoyen.
 * Gère la rétrocompatibilité : si `birthDate` existe on calcule, sinon on utilise `age`.
 * @param {object} citizen
 * @param {{ day: number, month: number, year: number }} gameDate
 * @returns {number}
 */
export function getCitizenAge(citizen, gameDate) {
  if (citizen.birthDate) {
    return computeAge(citizen.birthDate, gameDate);
  }
  return citizen.age || 0;
}

/**
 * Formate une date RP en texte lisible.
 * @param {{ day: number, month: number, year: number }} date
 * @returns {string}
 */
export function formatRPDate(date) {
  if (!date) return "—";
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  return `${date.day} ${months[(date.month - 1) % 12]} ${date.year}`;
}

// ── Système monétaire : Écu (or) + Liar (cuivre, 1/10 écu) ────────────────

/**
 * Formate un montant en écus (float) sous forme lisible.
 * Exemples : 12.5 → "12 Écus 5 Liards" | 10 → "10 Écus" | 0.3 → "3 Liards" | 0 → "0 Liard"
 */
export function formatMoney(val) {
  const v = Math.round((val || 0) * 10); // en liards entiers
  const ecus = Math.floor(v / 10);
  const liards = v % 10;
  if (ecus === 0 && liards === 0) return "0 Liard";
  if (ecus === 0) return `${liards} Liard${liards > 1 ? "s" : ""}`;
  if (liards === 0) return `${ecus.toLocaleString()} Écu${ecus > 1 ? "s" : ""}`;
  return `${ecus.toLocaleString()} Écu${ecus > 1 ? "s" : ""} ${liards} Liard${liards > 1 ? "s" : ""}`;
}

/**
 * Formate le nom complet d'un citoyen.
 * Utilise prénom+nom si disponibles, sinon le champ name legacy.
 */
export function formatName(citizen) {
  if (!citizen) return "";
  return citizen.firstName
    ? `${citizen.firstName} ${citizen.lastName || ""}`.trim()
    : (citizen.name || "");
}

/**
 * Formate un montant compact (pour les espaces réduits).
 * Exemples : 12.5 → "12 É 5 L" | 10 → "10 É" | 0.3 → "3 L"
 */
export function formatMoneyShort(val) {
  const v = Math.round((val || 0) * 10);
  const ecus = Math.floor(v / 10);
  const liards = v % 10;
  if (ecus === 0 && liards === 0) return "0 L";
  if (ecus === 0) return `${liards} L`;
  if (liards === 0) return `${ecus.toLocaleString()} É`;
  return `${ecus.toLocaleString()} É ${liards} L`;
}

/**
 * Convertit des écus + liards en valeur float stockable.
 * parseMoney(10, 5) → 10.5
 */
export function parseMoney(ecus = 0, liards = 0) {
  return Math.round((parseInt(ecus) || 0) * 10 + (parseInt(liards) || 0)) / 10;
}

/**
 * Décompose un float écu en { ecus, liards }.
 * splitMoney(10.5) → { ecus: 10, liards: 5 }
 */
export function splitMoney(val) {
  const v = Math.round((val || 0) * 10);
  return { ecus: Math.floor(v / 10), liards: v % 10 };
}

// ── Thème de rôle ────────────────────────────────────────────────────────────

/**
 * Retourne les classes CSS correspondant au rôle d'un citoyen.
 * Version complète (border, bg, accent, badge).
 */
export function getRoleTheme(role) {
  switch (role) {
    case "EMPEREUR":
      return { border: "border-yellow-500", bg: "bg-yellow-50", accent: "text-yellow-700", badge: "bg-yellow-100 text-yellow-800 border-yellow-300" };
    case "ROI":
      return { border: "border-purple-500", bg: "bg-purple-50", accent: "text-purple-700", badge: "bg-purple-100 text-purple-800 border-purple-300" };
    case "GRAND_FONC_GLOBAL":
    case "GRAND_FONC_LOCAL":
      return { border: "border-blue-500", bg: "bg-blue-50", accent: "text-blue-700", badge: "bg-blue-100 text-blue-800 border-blue-300" };
    case "INTENDANT":
      return { border: "border-emerald-500", bg: "bg-emerald-50", accent: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    case "FONCTIONNAIRE":
    case "POSTIERE":
      return { border: "border-sky-500", bg: "bg-sky-50", accent: "text-sky-700", badge: "bg-sky-100 text-sky-800 border-sky-300" };
    default:
      return { border: "border-stone-400", bg: "bg-stone-50", accent: "text-stone-600", badge: "bg-stone-100 text-stone-700 border-stone-300" };
  }
}

// ── Helpers log de trésorerie ─────────────────────────────────────────────────

/**
 * Retourne true si le type d'entrée de log est positif (crédit).
 */
export function logEntryIsPositive(type) {
  return type === "deposit" || type === "transfer_in" || type === "admin_add";
}

/**
 * Retourne la classe CSS de couleur pour un type de log de trésorerie.
 */
export function logEntryColor(type) {
  return logEntryIsPositive(type) ? "text-green-600" : "text-red-500";
}

/**
 * Retourne le signe (+/-) pour un type de log de trésorerie.
 */
export function logEntrySign(type) {
  return logEntryIsPositive(type) ? "+" : "-";
}

// ── Utilitaires bibliothèque ──────────────────────────────────────────────────

export function toRoman(num) {
  const lookup = {
    M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90,
    L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1,
  };
  let roman = "";
  for (const i in lookup) {
    while (num >= lookup[i]) { roman += i; num -= lookup[i]; }
  }
  return roman;
}

export function isNewEntry(dateStr, days = 7) {
  return !!dateStr && Date.now() - new Date(dateStr).getTime() < days * 24 * 3600 * 1000;
}

// Détachement de personnel actif d'un citoyen (voir onCreateStaffLoan dans useGameActions.js) —
// l'entreprise emprunteuse peut y attacher des droits restreints (permissions), au même titre
// que serfRights côté employeur ou spouseRights côté conjoint dominant.
export function getActiveStaffLoan(citizenId, staffLoans) {
  return (
    (staffLoans || []).find(
      (l) => l.status === "ACTIVE" && String(l.employeeId) === String(citizenId)
    ) || null
  );
}

export function getStaffLoanRestriction(citizenId, staffLoans) {
  return getActiveStaffLoan(citizenId, staffLoans)?.permissions || {};
}

// ===== FILIATION =====
// Remonte la chaîne fatherId/motherId de candidateId et dit si ancestorId s'y trouve —
// sert à interdire les boucles de filiation (ex: se déclarer le parent de son propre ascendant).
export function isDescendantOf(candidateId, ancestorId, citizens, depth = 0) {
  if (depth > 25 || !candidateId) return false;
  const candidate = (citizens || []).find((c) => String(c.id) === String(candidateId));
  if (!candidate) return false;
  if (String(candidate.fatherId) === String(ancestorId) || String(candidate.motherId) === String(ancestorId)) return true;
  return (
    (candidate.fatherId && isDescendantOf(candidate.fatherId, ancestorId, citizens, depth + 1)) ||
    (candidate.motherId && isDescendantOf(candidate.motherId, ancestorId, citizens, depth + 1))
  );
}

// ===== TRACE MAGIQUE (aura) =====
// Hash déterministe — sert à dériver la teinte de base d'un citoyen (sa "signature"
// avant tout pacte magique). Partagé entre l'affichage (CitizenPhysicsMagicView) et
// la fusion appliquée au mariage arcanique (useGameActions.onAcceptMarriage et variantes).
export function hashCode(str) {
  let h = 0;
  const s = String(str ?? "");
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ===== GRILLE HEXAGONALE (Atlas — Empire/Pays/Ville) =====
// Coordonnées axiales, hexagones "flat-top" — partagées entre la carte (WorldMapView.js) et ses
// éditeurs de position dans l'Atlas (GeopoliticsView.js, PropertiesAdminView.js, via
// HexPositionPicker), pour que la génération de repli et le rendu utilisent exactement la même
// géométrie.
const HEX_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
export function hexRing(radius) {
  if (radius === 0) return [[0, 0]];
  const results = [];
  let hex = [HEX_DIRS[4][0] * radius, HEX_DIRS[4][1] * radius];
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < radius; j++) {
      results.push(hex);
      hex = [hex[0] + HEX_DIRS[i][0], hex[1] + HEX_DIRS[i][1]];
    }
  }
  return results;
}
export function hexSpiral(n) {
  const coords = [[0, 0]];
  let radius = 1;
  while (coords.length < n) { coords.push(...hexRing(radius)); radius++; }
  return coords.slice(0, Math.max(n, 1));
}
// Toutes les cellules à distance ≤ radius du centre — grille complète pour un sélecteur de
// position (contrairement à hexSpiral, qui ne retourne qu'un sous-ensemble ordonné).
export function hexGrid(radius) {
  const cells = [];
  for (let r = 0; r <= radius; r++) cells.push(...hexRing(r));
  return cells;
}
export function axialToPixel(q, r, size) {
  return [size * 1.5 * q, size * Math.sqrt(3) * (r + q / 2)];
}
export function hexPoints(cx, cy, size) {
  return Array.from({ length: 6 }, (_, i) => {
    const rad = (Math.PI / 180) * (60 * i);
    return `${(cx + size * Math.cos(rad)).toFixed(1)},${(cy + size * Math.sin(rad)).toFixed(1)}`;
  }).join(" ");
}
// Cellule de repli déterministe (jamais aléatoire d'un rendu à l'autre) pour un pays/région/bien
// sans position définie dans l'Atlas — tirée d'une spirale de 61 cellules (rayon 4), ce qui
// garantit toujours une position valide et stable tant que rien n'a été placé à la main.
const FALLBACK_SPIRAL = hexSpiral(61);
export function getFallbackHex(id) {
  const idx = hashCode(String(id ?? "default")) % FALLBACK_SPIRAL.length;
  return { q: FALLBACK_SPIRAL[idx][0], r: FALLBACK_SPIRAL[idx][1] };
}

// Teinte (0-359) propre au citoyen, dérivée de son identité — inchangée tant qu'aucun pacte
// arcanique ne l'a rapprochée de celle d'un conjoint.
export function getBaseMagicHue(citizen) {
  const seed = String(citizen?.id ?? citizen?.name ?? "default");
  return hashCode(seed) % 360;
}

// Teinte effective affichée : celle du pacte arcanique si le citoyen en a contracté un,
// sinon sa teinte de base.
export function getEffectiveMagicHue(citizen) {
  if (citizen?.magicBond && typeof citizen.magicBond.hue === "number") {
    return citizen.magicBond.hue;
  }
  return getBaseMagicHue(citizen);
}

function circularHueBlend(hueA, hueB, weightB) {
  const rad = (h) => (h * Math.PI) / 180;
  const ax = Math.cos(rad(hueA));
  const ay = Math.sin(rad(hueA));
  const bx = Math.cos(rad(hueB));
  const by = Math.sin(rad(hueB));
  const x = ax * (1 - weightB) + bx * weightB;
  const y = ay * (1 - weightB) + by * weightB;
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/**
 * Un pacte magique (mariage "arcane") lie les traces magiques des deux conjoints : chacun
 * dérive vers une teinte partagée, sans jamais la rejoindre complètement — leurs auras
 * deviennent proches, reconnaissables l'une de l'autre, sans être identiques. Applicable
 * plusieurs fois (unions arcaniques successives) : la teinte effective déjà liée sert de
 * point de départ, donc le lien s'accumule au fil des pactes.
 */
export function bondMagicTraces(citizenA, citizenB) {
  const hueA = getEffectiveMagicHue(citizenA);
  const hueB = getEffectiveMagicHue(citizenB);
  const midpoint = circularHueBlend(hueA, hueB, 0.5);
  return {
    hueA: circularHueBlend(hueA, midpoint, 0.35),
    hueB: circularHueBlend(hueB, midpoint, 0.35),
  };
}

// Écart (0-180°) en-dessous duquel deux traces liées entrent en résonance et se figent.
export const MAGIC_RESONANCE_THRESHOLD_DEG = 6;

function circularHueDistance(hueA, hueB) {
  const d = Math.abs(hueA - hueB) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Dérive quotidienne d'un couple lié par pacte arcanique : un tirage aléatoire rapproche ou
 * éloigne les deux traces magiques d'une petite fraction du chemin qui les sépare. Si l'écart
 * devient très faible, la résonance est atteinte : les deux teintes se figent à l'identique et
 * ne dérivent plus jamais (appelant : ne pas rappeler cette fonction pour un couple résonant).
 */
export function driftMagicBond(citizenA, citizenB) {
  const hueA = getEffectiveMagicHue(citizenA);
  const hueB = getEffectiveMagicHue(citizenB);
  const midpoint = circularHueBlend(hueA, hueB, 0.5);
  const direction = Math.random() < 0.5 ? -1 : 1; // -1 = s'éloigne, +1 = se rapproche
  const magnitude = Math.random() * 0.1; // jusqu'à 10% du chemin vers/depuis le point moyen
  const weight = direction * magnitude;
  const newHueA = circularHueBlend(hueA, midpoint, weight);
  const newHueB = circularHueBlend(hueB, midpoint, weight);
  const gap = circularHueDistance(newHueA, newHueB);
  if (gap <= MAGIC_RESONANCE_THRESHOLD_DEG) {
    const resonantHue = circularHueBlend(newHueA, newHueB, 0.5);
    return { hueA: resonantHue, hueB: resonantHue, resonance: true };
  }
  return { hueA: newHueA, hueB: newHueB, resonance: false };
}

// ===== MALADIES (voir illnessConfig, configurable dans l'espace GM) =====
// Chaque maladie est une fiche définie par le GM (nom, description, icône, poids de tirage,
// durée min/max, pénalité de production, éventuels statuts physique/magique qu'elle inflige).
// Regroupé ici pour être partagé sans duplication entre le tirage quotidien (onPassDay,
// useGameActions.js) et le déclenchement manuel d'épidémie (GameMasterView.js).

export function pickWeightedIllness(illnessDefs) {
  const defs = (illnessDefs || []).filter((d) => d.weight > 0);
  const totalWeight = defs.reduce((s, d) => s + d.weight, 0);
  if (totalWeight <= 0) return null;
  let roll = Math.random() * totalWeight;
  let chosen = defs[0];
  for (const d of defs) {
    if (roll < d.weight) { chosen = d; break; }
    roll -= d.weight;
  }
  return chosen;
}

export function rollIllnessInstance(illnessDef, dayCycle) {
  if (!illnessDef) return null;
  const minD = illnessDef.minDurationDays || 1;
  const maxD = illnessDef.maxDurationDays || minD;
  const span = Math.max(0, maxD - minD);
  const durationDays = Math.max(1, Math.round(minD + Math.random() * span));
  return {
    illnessId: illnessDef.id, name: illnessDef.name, description: illnessDef.description || "",
    icon: illnessDef.icon || "🤒", productionPenaltyPercent: illnessDef.productionPenaltyPercent || 0,
    statusEffectIds: illnessDef.statusEffectIds || [],
    startedDayCycle: dayCycle, durationDays, daysElapsed: 0,
  };
}

// Applique une maladie à un citoyen : ajoute les statuts physique/magique qu'elle inflige (sans
// dupliquer ceux déjà présents), en mémorisant lesquels elle a réellement ajoutés pour ne retirer
// que ceux-là à la guérison — un statut déjà présent pour une autre raison (GM, sort...) n'est
// jamais touché.
export function applyIllnessToCitizen(citizen, illnessInstance) {
  const existingEffects = citizen.statusEffects || [];
  const statusToAdd = (illnessInstance.statusEffectIds || []).filter((id) => !existingEffects.includes(id));
  return {
    ...citizen,
    illness: { ...illnessInstance, grantedStatusEffects: statusToAdd },
    statusEffects: [...existingEffects, ...statusToAdd],
    status: (!citizen.status || citizen.status === "Actif") ? "Malade" : citizen.status,
  };
}

export function clearIllnessFromCitizen(citizen) {
  const granted = citizen.illness?.grantedStatusEffects || [];
  const remainingEffects = (citizen.statusEffects || []).filter((id) => !granted.includes(id));
  return {
    ...citizen,
    illness: null,
    statusEffects: remainingEffects,
    status: citizen.status === "Malade" ? "Actif" : citizen.status,
  };
}

// ===== IVRESSE (consommation d'articles alcoolisés en auberge) =====
// Purement informationnel : le jeu ne décide jamais des actions du citoyen à sa place — il
// affiche un taux et des indications de jeu de rôle que le joueur incarne lui-même.

// Jet d20 : plus le jet est bas, plus le gain de % est élevé. toleranceMultiplier vient de la
// race du citoyen (voir getRaceToleranceMultiplier) : < 1 encaisse mieux, > 1 encaisse moins bien.
// 19-20→+0% · 17-18→+5% · 15-16→+10% · 13-14→+15% · 11-12→+20% · 9-10→+25% ·
// 7-8→+30% · 5-6→+35% · 3-4→+40% · 1-2→+45%
export function rollDrunkenGain(toleranceMultiplier = 1) {
  const roll = 1 + Math.floor(Math.random() * 20);
  const base = Math.floor((20 - roll) / 2) * 5;
  return Math.max(0, Math.round(base * (toleranceMultiplier || 1)));
}

// Gain d'ivresse pour un article dont le gérant a configuré un intervalle propre (voir
// drunkMin/drunkMax sur l'article du menu, PropertyDetailView.js) — tirage uniforme dans cet
// intervalle plutôt que le jet d20 générique, toujours modulé par la même tolérance/malus.
export function rollDrunkenGainInRange(min, max, toleranceMultiplier = 1) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const base = lo + Math.random() * (hi - lo);
  return Math.max(0, Math.round(base * (toleranceMultiplier || 1)));
}

// Multiplicateur de tolérance à l'alcool associé à la race du citoyen — champ GM-configurable
// (state.raceConfig.races[].alcoholTolerance, voir GMRaces dans GameMasterView.js). 1 = neutre.
export function getRaceToleranceMultiplier(raceName, races) {
  if (!raceName) return 1;
  const race = (races || []).find((r) => r.name === raceName);
  const m = race?.alcoholTolerance;
  return typeof m === "number" && m > 0 ? m : 1;
}

// Repart de zéro dès que la date RP a changé depuis la dernière consommation — même logique que
// les consommateurs du jour (addDailyConsumer, useGameActions.js).
export function addDrunkenness(citizen, gain, todayKey) {
  const current = citizen.drunkenness?.day === todayKey ? (citizen.drunkenness.percent || 0) : 0;
  return { ...citizen, drunkenness: { percent: current + gain, day: todayKey } };
}

// Paliers cumulatifs : à 200%, tous s'appliquent en même temps ("tout réuni").
export const DRUNK_TIERS = [
  { threshold: 110, label: "Langue bien pendue", desc: "Tu parles beaucoup, tu révèles plein de choses sur toi." },
  { threshold: 130, label: "Étourdi(e)", desc: "Tu fais des bêtises." },
  { threshold: 150, label: "Entreprenant(e)", desc: "Tu fais des avances à tout le monde." },
  { threshold: 170, label: "Sans retenue", desc: "Tu te jettes sur tout le monde." },
];

export function getActiveDrunkTiers(percent) {
  return DRUNK_TIERS.filter((t) => percent >= t.threshold);
}

// Gueule de bois : si le pic d'ivresse de la veille a atteint ce seuil, le lendemain porte une
// indication RP (voir onPassDay, useGameActions.js) et un vrai malus : reboire ce jour-là fait
// monter l'ivresse plus vite (voir HANGOVER_DRINK_MALUS, appliqué dans useGameActions.js).
export const HANGOVER_THRESHOLD = 150;

// Multiplicateur appliqué au gain d'ivresse (en plus de la tolérance raciale) tant que la
// gueule de bois de la veille est active — le corps encaisse moins bien un nouveau verre.
export const HANGOVER_DRINK_MALUS = 1.3;

export const HANGOVER_INFO = {
  label: "Gueule de bois",
  desc: "Migraine carabinée, bouche pâteuse, lumière insupportable — la soirée d'hier se paie cash aujourd'hui. Reboire dans cet état enivre 30% plus vite.",
};
