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
