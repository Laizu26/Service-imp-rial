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
