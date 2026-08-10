import { useMemo } from "react";
import { formatMoney, toRoman, formatRPDate, bondMagicTraces, driftMagicBond } from "../lib/gameUtils";
import { MARRIAGE_INDISSOLUBLE_TYPES, ROLES } from "../lib/constants";

// Enveloppe toutes les actions dans un try/catch pour éviter les crashes silencieux
const wrapActions = (actionsObj, notify) =>
  Object.fromEntries(
    Object.entries(actionsObj).map(([key, fn]) => [
      key,
      (...args) => {
        try {
          return fn(...args);
        } catch (e) {
          console.error(`[useGameActions] Erreur dans ${key}:`, e);
          notify("Une erreur inattendue s'est produite.", "error");
        }
      },
    ])
  );

// Résout le destinataire réel d'une notification liée à un post : un citoyen classique
// reçoit directement la notif, une guilde/entreprise la redirige vers son chef/propriétaire
// (aucun citoyen n'a "guild_X" comme id de session, la notif n'arriverait jamais sinon).
const resolveNotifRecipient = (authorId, state) => {
  const id = String(authorId || "");
  if (id.startsWith("guild_")) {
    const guild = (state.guilds || []).find(g => `guild_${g.id}` === id);
    return guild ? String(guild.leaderId) : id;
  }
  if (id.startsWith("company_")) {
    const company = (state.companies || []).find(c => `company_${c.id}` === id);
    return company ? String(company.ownerId) : id;
  }
  return id;
};

// Extrait les mentions @handle d'un texte et les résout vers des ids de citoyens
// (via mushtagramHandle, insensible à la casse). Exclut l'auteur lui-même.
const extractMentions = (content, citizens, excludeId) => {
  const handles = [...new Set((content || "").match(/@[\wÀ-ɏ]+/g) || [])].map(h => h.slice(1).toLowerCase());
  if (handles.length === 0) return [];
  const ids = [];
  (citizens || []).forEach(c => {
    if (String(c.id) === String(excludeId)) return;
    if (c.mushtagramHandle && handles.includes(c.mushtagramHandle.toLowerCase())) ids.push(String(c.id));
  });
  return [...new Set(ids)];
};

// Helper : distribue le paiement d'une session Maison selon le contrat lié au worker,
// ou en fallback sur le split 80/20 classique (maisonCompanyId).
// Retourne { newCitizens, updatedCompanies, updatedCountries, newTreasury, toName }
const applyMaisonPayment = (worker, price, citizens, companies, countries, treasury, jobContracts, maisonCompanyId) => {
  const newCitizens = [...citizens];
  const updatedCompanies = [...companies];
  const updatedCountries = [...(countries || [])];
  let newTreasury = treasury;
  let toName;

  const workerContract = worker.contractId
    ? (jobContracts || []).find((c) => c.id === worker.contractId)
    : null;

  if (workerContract && (workerContract.recipients || []).length > 0) {
    toName = workerContract.recipients.map((r) => r.name).join(" / ");
    workerContract.recipients.forEach((recipient) => {
      const share = Math.floor(price * (recipient.percent || 0) / 100);
      if (share <= 0) return;
      if (recipient.type === "CITIZEN") {
        const idx = newCitizens.findIndex((c) => c.id === recipient.id);
        if (idx !== -1) newCitizens[idx] = { ...newCitizens[idx], balance: (newCitizens[idx].balance || 0) + share };
      } else if (recipient.type === "COMPANY") {
        const idx = updatedCompanies.findIndex((c) => c.id === recipient.id);
        if (idx !== -1) updatedCompanies[idx] = { ...updatedCompanies[idx], balance: (updatedCompanies[idx].balance || 0) + share };
      } else if (recipient.type === "COUNTRY") {
        const idx = updatedCountries.findIndex((c) => c.id === recipient.id);
        if (idx !== -1) updatedCountries[idx] = { ...updatedCountries[idx], treasury: (updatedCountries[idx].treasury || 0) + share };
      } else if (recipient.type === "GLOBAL") {
        newTreasury += share;
      }
    });
  } else {
    // Fallback : split 80/20 historique
    const maisonCompIdx = maisonCompanyId
      ? updatedCompanies.findIndex((c) => c.id === maisonCompanyId)
      : -1;
    const maisonCut = Math.floor(price * 0.8);
    const treasuryCut = price - maisonCut;
    if (maisonCompIdx !== -1) {
      updatedCompanies[maisonCompIdx] = {
        ...updatedCompanies[maisonCompIdx],
        balance: (updatedCompanies[maisonCompIdx].balance || 0) + maisonCut,
      };
      newTreasury += treasuryCut;
      toName = updatedCompanies[maisonCompIdx].name + " / Trésor";
    } else {
      newTreasury += price;
      toName = "Trésor Impérial";
    }
  }

  return { newCitizens, updatedCompanies, updatedCountries, newTreasury, toName };
};

// ─── FONCTIONS PURES VIP / FIDÉLITÉ / ABONNEMENT ──────────────────────────────

export function getMaisonVipRank(citizenId, maisonHistory) {
  const visits = (maisonHistory || []).filter((h) => h.citizenId === citizenId).length;
  if (visits >= 50) return { rank: "DIAMANT", label: "Diamant", emoji: "💎", color: "text-cyan-400", bg: "bg-cyan-900/30 border-cyan-500/40", visits, next: null };
  if (visits >= 30) return { rank: "OR", label: "Or", emoji: "✨", color: "text-yellow-400", bg: "bg-yellow-900/30 border-yellow-500/40", visits, next: { label: "Diamant", at: 50 } };
  if (visits >= 15) return { rank: "ARGENT", label: "Argent", emoji: "🥈", color: "text-gray-300", bg: "bg-gray-700/30 border-gray-400/40", visits, next: { label: "Or", at: 30 } };
  if (visits >= 5)  return { rank: "BRONZE", label: "Bronze", emoji: "🥉", color: "text-amber-500", bg: "bg-amber-900/30 border-amber-500/40", visits, next: { label: "Argent", at: 15 } };
  return null;
}

export function getMaisonLoyaltyDiscount(citizenId, staffId, maisonHistory) {
  const visits = (maisonHistory || []).filter((h) => h.citizenId === citizenId && h.staffId === staffId).length;
  if (visits >= 20) return { pct: 15, visits };
  if (visits >= 10) return { pct: 10, visits };
  if (visits >= 5)  return { pct: 5, visits };
  return { pct: 0, visits };
}

export function hasMaisonSubscription(citizenId, maisonSubscriptions) {
  return (maisonSubscriptions || []).some((s) => s.citizenId === citizenId && s.expiresAt > Date.now());
}

export function getMaisonSubscription(citizenId, maisonSubscriptions) {
  return (maisonSubscriptions || []).find((s) => s.citizenId === citizenId && s.expiresAt > Date.now()) || null;
}

export function computeMaisonDiscount(citizenId, staffId, maisonHistory, maisonSubscriptions) {
  const loyalty = getMaisonLoyaltyDiscount(citizenId, staffId, maisonHistory);
  const sub = hasMaisonSubscription(citizenId, maisonSubscriptions);
  return Math.min(loyalty.pct + (sub ? 10 : 0), 40);
}

// ── Bourse : carnet d'ordres ──────────────────────────────────────────────────
// Plafond de variation journalière anti-manipulation : un ordre ne peut être placé plus de
// ±30% au-dessus/en-dessous du cours d'ouverture du jour RP en cours pour cette cotation.
export const BOURSE_DAILY_CAP = 0.3;

// Apparie les ordres d'achat et de vente en attente d'une cotation (priorité prix, puis
// antériorité) et renvoie les transactions exécutées ainsi que les carnets mis à jour.
// Le prix d'exécution est celui de l'ordre "résident" (déjà présent dans le carnet), conformément
// à la convention prix-temps utilisée par les marchés réels.
export function matchBourseOrders(listing) {
  let buys = (listing.buyOrders || []).map((o) => ({ ...o }));
  let sells = (listing.sellOrders || []).map((o) => ({ ...o }));
  buys.sort((a, b) => b.price - a.price || a.timestamp - b.timestamp);
  sells.sort((a, b) => a.price - b.price || a.timestamp - b.timestamp);
  // Bande de prix légale du jour — un ordre résident (déjà dans le carnet) a pu être placé un
  // jour où le plafond était différent ; sans ce garde-fou, son exécution pouvait fixer un
  // lastPrice hors de la bande actuelle (ex: 55 écus exécutés alors que le plafond du jour
  // plafonne à ~39), rendant le cours affiché incohérent avec le carnet réel.
  const capBase = listing.dayOpenPrice || listing.lastPrice || listing.initialPrice || 0;
  const minAllowed = capBase > 0 ? Math.round(capBase * (1 - BOURSE_DAILY_CAP) * 10) / 10 : 0;
  const maxAllowed = capBase > 0 ? Math.round(capBase * (1 + BOURSE_DAILY_CAP) * 10) / 10 : Infinity;
  const trades = [];
  let bi = 0, si = 0;
  while (bi < buys.length && si < sells.length && buys[bi].price >= sells[si].price) {
    const buy = buys[bi], sell = sells[si];
    // Prévention d'auto-transaction : un citoyen ne peut pas s'échanger des titres avec lui-même
    // pour déplacer artificiellement le cours sans contrepartie réelle. On met de côté l'ordre le
    // plus ancien des deux pour cette passe et on retente l'appariement avec le suivant.
    if (buy.citizenId === sell.citizenId) {
      if (buy.timestamp <= sell.timestamp) si++; else bi++;
      continue;
    }
    const residentPrice = buy.timestamp <= sell.timestamp ? buy.price : sell.price;
    const tradePrice = Math.min(maxAllowed, Math.max(minAllowed, residentPrice));
    const tradeQty = Math.min(buy.qty, sell.qty);
    trades.push({
      buyerId: buy.citizenId, buyerName: buy.citizenName, buyOrderPrice: buy.price,
      sellerId: sell.citizenId, sellerName: sell.citizenName,
      qty: tradeQty, price: tradePrice,
    });
    buy.qty -= tradeQty;
    sell.qty -= tradeQty;
    if (buy.qty <= 0) bi++;
    if (sell.qty <= 0) si++;
  }
  return {
    trades,
    buyOrders: buys.filter((o) => o.qty > 0),
    sellOrders: sells.filter((o) => o.qty > 0),
  };
}

// Applique une liste de transactions déjà appariées : transfère les écus/actions entre acheteur
// et vendeur (ou la trésorerie de l'entreprise si le vendeur est l'offre primaire "COMPANY"),
// et rembourse à l'acheteur la différence entre son prix limite et le prix d'exécution réel.
export function applyBourseTrades(trades, citizens, companies, listing) {
  let newCitizens = [...citizens];
  let newCompanies = [...companies];
  const ledgerEntries = [];
  const ts = Date.now();
  const compIdx = newCompanies.findIndex((c) => c.id === listing.companyId);

  trades.forEach((t, i) => {
    const tradeValue = Math.round(t.qty * t.price * 10) / 10;

    if (t.buyerId !== "COMPANY") {
      const bIdx = newCitizens.findIndex((c) => c.id === t.buyerId);
      if (bIdx !== -1) {
        const refund = Math.round((t.buyOrderPrice - t.price) * t.qty * 10) / 10;
        const holdings = { ...(newCitizens[bIdx].stockholdings || {}) };
        holdings[listing.id] = (holdings[listing.id] || 0) + t.qty;
        newCitizens[bIdx] = {
          ...newCitizens[bIdx],
          balance: Math.round(((newCitizens[bIdx].balance || 0) + refund) * 10) / 10,
          stockholdings: holdings,
        };
      }
    }

    if (t.sellerId === "COMPANY") {
      if (compIdx !== -1) {
        newCompanies[compIdx] = { ...newCompanies[compIdx], balance: Math.round(((newCompanies[compIdx].balance || 0) + tradeValue) * 10) / 10 };
      }
    } else {
      const sIdx = newCitizens.findIndex((c) => c.id === t.sellerId);
      if (sIdx !== -1) {
        newCitizens[sIdx] = { ...newCitizens[sIdx], balance: Math.round(((newCitizens[sIdx].balance || 0) + tradeValue) * 10) / 10 };
      }
    }

    ledgerEntries.push({
      id: ts + i,
      fromName: t.buyerId === "COMPANY" ? "Bourse Impériale" : (t.buyerName || t.buyerId),
      toName: t.sellerId === "COMPANY" ? listing.companyName : (t.sellerName || t.sellerId),
      amount: tradeValue,
      timestamp: ts,
      reason: `${t.qty} action(s) ${listing.symbol} à ${formatMoney(t.price)}`,
      type: "BOURSE_TRADE",
    });
  });

  return { newCitizens, newCompanies, ledgerEntries };
}

// Prise de contrôle par majorité (conseil des actionnaires) : dès qu'un citoyen détient plus de
// 50% des actions ÉMISES d'une entreprise cotée (ex: 101/200), il en devient automatiquement le
// nouveau propriétaire légal — la propriété suit le contrôle du capital. Le PDG en poste est
// révoqué (la délégation du précédent propriétaire n'a plus de sens sous un nouveau propriétaire) ;
// l'ancien propriétaire garde ses actions et son argent, seule la propriété de l'entreprise change
// de main. À appeler après toute opération qui modifie des stockholdings (échange, ESPP, cession
// directe...). Retourne null si aucune bascule n'a lieu.
export function checkBourseTakeover(companies, citizens, listing) {
  if (!listing?.totalShares) return null;
  const compIdx = companies.findIndex((c) => c.id === listing.companyId);
  if (compIdx === -1) return null;
  const company = companies[compIdx];
  const majorityHolder = citizens.find((c) => ((c.stockholdings || {})[listing.id] || 0) > listing.totalShares / 2);
  if (!majorityHolder || String(majorityHolder.id) === String(company.ownerId)) return null;
  const newCompanies = [...companies];
  newCompanies[compIdx] = { ...company, ownerId: majorityHolder.id, ceoId: null };
  return {
    companies: newCompanies,
    previousOwnerId: company.ownerId,
    newOwnerId: majorityHolder.id,
    newOwnerName: majorityHolder.name,
    companyId: company.id,
    companyName: company.name,
    symbol: listing.symbol,
  };
}

// ──────────────────────────────────────────────────────────────────────────────

export const useGameActions = (session, state, saveState, notify) => {
  return useMemo(() => {
    // Un citoyen restreint (contrat de servage, conjoint dominant ou tutelle active) ne
    // peut pas accéder à la Maison de Asia — même logique que combinedRestriction côté UI.
    const isMaisonLocked = (citizenId) => {
      const citizen = (state.citizens || []).find((c) => c.id === citizenId);
      if (!citizen) return false;
      const employer = (state.companies || []).find((c) => (c.employees || []).map(String).includes(String(citizenId)));
      const employerLocked = employer?.employmentContracts?.[citizenId]?.serfRights?.maisonLocked;
      const spouseLocked = (citizen.spouses || []).some((s) => s.dominantId && String(s.dominantId) !== String(citizenId) && s.spouseRights?.maisonLocked);
      const guardianLocked = citizen.guardianship?.active && citizen.guardianship.rights?.maisonLocked;
      const ownerLocked = citizen.status === "Esclave" && !citizen.permissions?.maison;
      return !!(employerLocked || spouseLocked || guardianLocked || ownerLocked);
    };

    // Un PDG (voir onAppointCEO) reçoit délégation de la TOTALITÉ des droits de gestion
    // opérationnelle de l'entreprise — dès qu'un PDG est en poste, le propriétaire les perd (il
    // reste seul propriétaire légal : nomination/révocation du PDG et dissolution restent réservées
    // à lui seul, cf. onAppointCEO/onRevokeCEO/onDeleteCompany, qui vérifient ownerId directement
    // et non isCompanyManager). Sans PDG, le propriétaire opère normalement l'entreprise.
    const isCompanyManager = (company, sessionId) =>
      !!company && String(company.ceoId ? company.ceoId : company.ownerId) === String(sessionId);

    // Bonus de revenu d'un bien d'entreprise selon le personnel affecté (voir
    // onAssignEmployeeToProperty) : +8% par employé/esclave affecté, plafonné à 4 (soit +32%
    // max), pour éviter qu'un seul bâtiment n'absorbe tout l'effectif sans limite.
    const PROPERTY_STAFF_BONUS_RATE = 0.08;
    const PROPERTY_STAFF_BONUS_CAP = 4;

    // Un bien détenu par une entreprise est géré par son dirigeant (propriétaire ou PDG
    // délégué, cf. isCompanyManager) ; un rôle impérial de haut niveau garde systématiquement
    // la main, comme pour la liste d'invités (onAddPropertyGuest).
    const isPropertyManager = (prop, sessionId) => {
      if (!prop) return false;
      if (String(prop.ownerId) === String(sessionId)) return true;
      if (prop.ownerType === "COMPANY") {
        const company = (state.companies || []).find((c) => c.id === prop.ownerId);
        if (isCompanyManager(company, sessionId)) return true;
      }
      return ["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(session?.role);
    };

    // Autorité sur la carte (Atlas) d'un pays donné : un rôle à portée globale (Empereur/Grand
    // Fonctionnaire) a autorité partout ; un officiel local (niveau ≥ 40, même principe que
    // GeopoliticsView.canEdit) n'a autorité que sur le pays dont il relève.
    const hasMapAuthority = (countryId) => {
      if (!session) return false;
      const info = ROLES[session.role] || { level: 0, scope: "NONE" };
      if (info.scope === "GLOBAL") return true;
      return String(session.countryId) === String(countryId) && info.level >= 40;
    };

    return wrapActions({
      onPassDay: () => {
        let ns = structuredClone(state);
        if (!ns.gameDate) ns.gameDate = { day: 1, month: 1, year: 1200 };

        ns.gameDate.day++;
        if (ns.gameDate.day > 30) {
          ns.gameDate.day = 1;
          ns.gameDate.month++;
          if (ns.gameDate.month > 12) {
            ns.gameDate.month = 1;
            ns.gameDate.year++;
          }
        }
        ns.dayCycle++;

        const m = ns.gameDate.month;
        let season = "Hiver";
        if (m >= 3 && m <= 5) season = "Printemps";
        else if (m >= 6 && m <= 8) season = "Été";
        else if (m >= 9 && m <= 11) season = "Automne";

        // --- Production journalière des entreprises ---
        const TYPE_RATES = {
          SERVICE: { emp: 12, slave: 9 },
          MANUFACTURE: { emp: 10, slave: 8 },
          EXTRACTION: { emp: 8, slave: 7 },
        };
        const companies = ns.companies || [];

        // Détachements de personnel actifs — en exclusif, la production du salarié passe
        // intégralement à l'entreprise emprunteuse (poids 1). Sinon, il reste partagé moitié-
        // moitié entre les deux (poids 0.5 chacune) : l'entreprise d'origine garde la moitié
        // de sa production, l'emprunteuse touche l'autre moitié.
        // Le dirigeant lui-même n'entre jamais dans le calcul de production de sa propre
        // entreprise (seuls employees/slaves comptent) — le prêter n'a donc rien à déduire
        // côté fromCompany, seulement à ajouter côté emprunteuse.
        const loanOutDeductionByCompany = {};
        const loanInAdditionByCompany = {};
        (ns.staffLoans || []).forEach((l) => {
          if (l.status !== "ACTIVE") return;
          const weight = l.exclusive ? 1 : 0.5;
          if (!l.isOwnerLoan) {
            loanOutDeductionByCompany[l.fromCompanyId] = (loanOutDeductionByCompany[l.fromCompanyId] || 0) + weight;
          }
          loanInAdditionByCompany[l.toCompanyId] = (loanInAdditionByCompany[l.toCompanyId] || 0) + weight;
        });

        companies.forEach((company, compIdx) => {
          if (company.frozen) return;

          const empCount = Math.max(0, (company.employees || []).length - (loanOutDeductionByCompany[company.id] || 0))
            + (loanInAdditionByCompany[company.id] || 0);
          const slaveCount = (company.slaves || []).length;
          const level = company.level || 1;
          const rates = TYPE_RATES[company.type] || { emp: 10, slave: 8 };

          const revenue =
            (empCount * rates.emp + slaveCount * rates.slave) * level;
          if (revenue <= 0) return;

          const taxRate = (company.taxRate ?? 10) / 100;
          const tax = Math.floor(revenue * taxRate);
          const net = revenue - tax;

          ns.companies[compIdx] = {
            ...ns.companies[compIdx],
            balance: (ns.companies[compIdx].balance || 0) + net,
            lastProduction: {
              date: `${ns.gameDate.day}/${ns.gameDate.month}/${ns.gameDate.year}`,
              gross: revenue,
              tax,
              net,
              employees: empCount,
              slaves: slaveCount,
            },
          };

          const countryIdx = (ns.countries || []).findIndex(
            (c) => c.id === company.countryId
          );
          if (countryIdx !== -1) {
            ns.countries[countryIdx] = {
              ...ns.countries[countryIdx],
              treasury: (ns.countries[countryIdx].treasury || 0) + tax,
            };
          } else {
            ns.treasury = (ns.treasury || 0) + tax;
          }
        });

        // --- Ancienneté des employés (chaque jour RP) ---
        (ns.companies || []).forEach((company, compIdx) => {
          if (company.frozen) return;
          const seniority = { ...(company.employeeSeniority || {}) };
          [...(company.employees || []), ...(company.slaves || [])].forEach((wId) => {
            seniority[wId] = (seniority[wId] || 0) + 1;
          });
          ns.companies[compIdx] = { ...ns.companies[compIdx], employeeSeniority: seniority };
        });

        // --- Dîme et expiration des contrats d'emploi ---
        (ns.companies || []).forEach((company, compIdx) => {
          if (company.frozen) return;
          const contracts = ns.companies[compIdx].employmentContracts || {};
          if (Object.keys(contracts).length === 0) return;
          const seniority = ns.companies[compIdx].employeeSeniority || {};
          let newContracts = { ...contracts };
          let newEmployees = [...(ns.companies[compIdx].employees || [])];
          let compBalance = ns.companies[compIdx].balance || 0;
          let workerBalances = { ...(ns.companies[compIdx].workerBalances || {}) };
          const ts = Date.now();
          let ledgerEntries = [];
          Object.entries(contracts).forEach(([citizenId, contract], i) => {
            // — Dîme —
            if (contract.dimePercent > 0) {
              const wbal = workerBalances[citizenId] || 0;
              if (wbal > 0) {
                const dime = Math.round(wbal * contract.dimePercent / 100 * 10) / 10;
                if (dime > 0) {
                  workerBalances[citizenId] = Math.round((wbal - dime) * 10) / 10;
                  compBalance = Math.round((compBalance + dime) * 10) / 10;
                  const cit = ns.citizens.find((c) => c.id === citizenId);
                  ledgerEntries.push({ id: ts + i, fromName: cit?.name || citizenId, toName: company.name, amount: dime, timestamp: ts, reason: `Dîme ${contract.dimePercent}% — contrat ${contract.type}`, type: "DIME" });
                }
              }
            }
            // — Participation aux bénéfices (clause favorable au travailleur, inverse de la dîme) —
            if (contract.profitSharePercent > 0 && compBalance > 0) {
              const share = Math.round(compBalance * contract.profitSharePercent / 100 * 10) / 10;
              if (share > 0) {
                compBalance = Math.round((compBalance - share) * 10) / 10;
                workerBalances[citizenId] = Math.round(((workerBalances[citizenId] || 0) + share) * 10) / 10;
                const cit = ns.citizens.find((c) => c.id === citizenId);
                ledgerEntries.push({ id: ts + i + 2000, fromName: company.name, toName: cit?.name || citizenId, amount: share, timestamp: ts, reason: `Participation aux bénéfices ${contract.profitSharePercent}% — contrat ${contract.type}`, type: "PROFIT_SHARE" });
              }
            }
            // — Expiration (CDD/Apprentissage/Mercenariat) —
            if (contract.contractDurationDays && (seniority[citizenId] || 0) >= contract.contractDurationDays) {
              newEmployees = newEmployees.filter((id) => id !== citizenId);
              delete newContracts[citizenId];
              const cit = ns.citizens.find((c) => c.id === citizenId);
              ledgerEntries.push({ id: ts + i + 1000, fromName: company.name, toName: cit?.name || citizenId, amount: 0, timestamp: ts, reason: `Fin de contrat ${contract.type} — durée atteinte (${contract.contractDurationDays} jours)`, type: "CONTRACT_EXPIRED" });
            }
          });
          ns.companies[compIdx] = { ...ns.companies[compIdx], balance: compBalance, workerBalances, employees: newEmployees, employmentContracts: newContracts };
          if (ledgerEntries.length > 0) {
            ns.globalLedger = [...ledgerEntries, ...(ns.globalLedger || [])].slice(0, 1000);
          }
        });

        // --- Détachements de personnel : facturation journalière + durée ---
        // L'entreprise emprunteuse paie le tarif de location à l'entreprise prêteuse chaque
        // jour RP ; si elle n'a pas les fonds, le prélèvement est simplement sauté (alerte
        // envoyée au salarié) plutôt que d'annuler le détachement automatiquement.
        if ((ns.staffLoans || []).some((l) => l.status === "ACTIVE")) {
          const loanTs = Date.now();
          const loanLedger = [];
          const loanAlerts = [...(ns.staffLoanAlerts || [])];
          ns.staffLoans = ns.staffLoans.map((loan, i) => {
            if (loan.status !== "ACTIVE") return loan;
            let updated = { ...loan };
            if (loan.dailyRate > 0) {
              const toIdx = ns.companies.findIndex((c) => c.id === loan.toCompanyId);
              const fromIdx = ns.companies.findIndex((c) => c.id === loan.fromCompanyId);
              if (toIdx !== -1 && fromIdx !== -1) {
                if ((ns.companies[toIdx].balance || 0) >= loan.dailyRate) {
                  ns.companies[toIdx] = { ...ns.companies[toIdx], balance: ns.companies[toIdx].balance - loan.dailyRate };
                  ns.companies[fromIdx] = { ...ns.companies[fromIdx], balance: (ns.companies[fromIdx].balance || 0) + loan.dailyRate };
                  loanLedger.push({ id: loanTs + i, fromName: loan.toCompanyName, toName: loan.fromCompanyName, amount: loan.dailyRate, timestamp: loanTs, reason: `Détachement — ${loan.employeeName}`, type: "STAFF_LOAN_FEE" });
                } else {
                  loanAlerts.push({ id: `sla_${loanTs}_${i}`, toId: loan.employeeId, type: "unpaid", fromCompanyName: loan.fromCompanyName, toCompanyName: loan.toCompanyName, timestamp: loanTs });
                }
              }
            }
            updated.daysElapsed = (loan.daysElapsed || 0) + 1;
            if (loan.durationType === "FIXED" && updated.daysElapsed >= loan.durationDays) {
              updated.status = "ENDED";
              updated.endedAt = loanTs;
              loanAlerts.push({ id: `sla_${loanTs}_${i}_end`, toId: loan.employeeId, type: "ended", fromCompanyName: loan.fromCompanyName, toCompanyName: loan.toCompanyName, timestamp: loanTs });
            }
            return updated;
          });
          if (loanLedger.length > 0) {
            ns.globalLedger = [...loanLedger, ...(ns.globalLedger || [])].slice(0, 1000);
          }
          ns.staffLoanAlerts = loanAlerts;
        }

        // --- Bourse : réinitialisation du plafond de variation journalier ---
        // Chaque cotation active repart d'une nouvelle bande de ±BOURSE_DAILY_CAP autour du dernier
        // cours connu — évite qu'un plafond figé sur un vieux cours bloque le marché indéfiniment.
        (ns.bourseListings || []).forEach((listing, i) => {
          if (!listing.isActive) return;
          ns.bourseListings[i] = {
            ...listing,
            dayOpenPrice: listing.lastPrice || listing.initialPrice,
            dayOpenGameDate: formatRPDate(ns.gameDate),
          };
        });

        // --- Progression de niveau (mensuelle, 1er du mois) ---
        if (ns.gameDate.day === 1) {
          (ns.companies || []).forEach((company, compIdx) => {
            if (company.frozen) return;
            const currentLevel = company.level || 1;
            const totalWorkers =
              (company.employees || []).length +
              (company.slaves || []).length;
            const requiredWorkers = currentLevel * 2;
            const requiredFunds = currentLevel * 500;
            if (
              totalWorkers >= requiredWorkers &&
              (company.balance || 0) >= requiredFunds
            ) {
              const newLevel = currentLevel + 1;
              // Coût de la montée : prélever les fonds requis
              ns.companies[compIdx] = {
                ...ns.companies[compIdx],
                level: newLevel,
                balance: (ns.companies[compIdx].balance || 0) - requiredFunds,
              };
              // Log dans le ledger
              ns.globalLedger = [{
                id: Date.now() + Math.random(),
                fromName: company.name,
                toName: "Expansion",
                amount: requiredFunds,
                timestamp: Date.now(),
                reason: `Passage au niveau ${newLevel}`,
                type: "COMPANY_LEVEL",
              }, ...(ns.globalLedger || [])];
            }
          });
        }

        // --- Exécution des contrats d'emploi ---
        (ns.jobContracts || []).forEach((job) => {
          if (!job.active) return;
          const shouldTrigger =
            job.frequency === "daily" ||
            (job.frequency === "weekly" && ns.dayCycle % 7 === 0) ||
            (job.frequency === "monthly" && ns.gameDate.day === 1);
          if (!shouldTrigger) return;

          const totalAmount = job.amount || 0;
          if (totalAmount <= 0) return;

          // Prélèvement selon la source
          if (job.source?.type === "COUNTRY") {
            const idx = (ns.countries || []).findIndex((c) => c.id === job.source.id);
            if (idx === -1 || (ns.countries[idx].treasury || 0) < totalAmount) return;
            ns.countries[idx] = { ...ns.countries[idx], treasury: ns.countries[idx].treasury - totalAmount };
          } else if (job.source?.type === "GLOBAL") {
            if ((ns.treasury || 0) < totalAmount) return;
            ns.treasury -= totalAmount;
          } else if (job.source?.type === "CITIZEN") {
            const idx = (ns.citizens || []).findIndex((c) => c.id === job.source.id);
            if (idx === -1 || (ns.citizens[idx].balance || 0) < totalAmount) return;
            ns.citizens[idx] = { ...ns.citizens[idx], balance: ns.citizens[idx].balance - totalAmount };
          } else if (job.source?.type === "COMPANY") {
            const idx = (ns.companies || []).findIndex((c) => c.id === job.source.id);
            if (idx === -1 || (ns.companies[idx].balance || 0) < totalAmount) return;
            ns.companies[idx] = { ...ns.companies[idx], balance: ns.companies[idx].balance - totalAmount };
          } else {
            return;
          }

          // Distribution aux bénéficiaires
          // Si source = COMPANY, les citoyens employés/esclaves reçoivent sur workerBalances
          const sourceCompany = job.source?.type === "COMPANY"
            ? (ns.companies || []).find((c) => c.id === job.source.id)
            : null;
          (job.recipients || []).forEach((recipient) => {
            const share = Math.floor(totalAmount * (recipient.percent || 0) / 100);
            if (share <= 0) return;
            const type = recipient.type || "CITIZEN";
            if (type === "CITIZEN") {
              // Si c'est un employé/esclave de la source company → workerBalances
              if (sourceCompany) {
                const isWorker = [...(sourceCompany.employees || []), ...(sourceCompany.slaves || [])].includes(recipient.id);
                if (isWorker) {
                  const scIdx = (ns.companies || []).findIndex((c) => c.id === job.source.id);
                  if (scIdx !== -1) {
                    const wb = { ...(ns.companies[scIdx].workerBalances || {}) };
                    wb[recipient.id] = (wb[recipient.id] || 0) + share;
                    ns.companies[scIdx] = { ...ns.companies[scIdx], workerBalances: wb };
                  }
                } else {
                  // Dirigeant ou citoyen externe → directement sur son solde
                  const idx = (ns.citizens || []).findIndex((c) => c.id === recipient.id);
                  if (idx !== -1) ns.citizens[idx] = { ...ns.citizens[idx], balance: (ns.citizens[idx].balance || 0) + share };
                }
              } else {
                const idx = (ns.citizens || []).findIndex((c) => c.id === recipient.id);
                if (idx !== -1) ns.citizens[idx] = { ...ns.citizens[idx], balance: (ns.citizens[idx].balance || 0) + share };
              }
            } else if (type === "COUNTRY") {
              const idx = (ns.countries || []).findIndex((c) => c.id === recipient.id);
              if (idx !== -1) ns.countries[idx] = { ...ns.countries[idx], treasury: (ns.countries[idx].treasury || 0) + share };
            } else if (type === "COMPANY") {
              const idx = (ns.companies || []).findIndex((c) => c.id === recipient.id);
              if (idx !== -1) ns.companies[idx] = { ...ns.companies[idx], balance: (ns.companies[idx].balance || 0) + share };
            } else if (type === "GLOBAL") {
              ns.treasury = (ns.treasury || 0) + share;
            }
          });

          // Ledger
          const ledgerEntry = {
            id: Date.now() + Math.random(),
            fromName: job.sourceName || "Contrat",
            toName: (job.recipients || []).map((r) => r.name).join(", "),
            amount: totalAmount,
            timestamp: Date.now(),
            reason: job.name,
            type: "SALARY",
          };
          ns.globalLedger = [ledgerEntry, ...(ns.globalLedger || [])];
        });

        // --- Loyers immobiliers (chaque jour RP) ---
        (ns.properties || []).forEach((prop, propIdx) => {
          if (!prop.rental || !prop.rental.tenantId || !prop.rental.dailyRate) return;
          const tenantIdx = (ns.citizens || []).findIndex((c) => c.id === prop.rental.tenantId);
          if (tenantIdx === -1) return;
          const tenant = ns.citizens[tenantIdx];
          const dailyRate = prop.rental.dailyRate;
          if ((tenant.balance || 0) < dailyRate) {
            ns.properties[propIdx] = { ...ns.properties[propIdx], rental: null };
            ns.propertyAlerts = [
              ...(ns.propertyAlerts || []),
              { id: `palert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, toId: prop.ownerId, type: "rent_failed", propertyId: prop.id, propertyName: prop.name, otherName: tenant.name, timestamp: Date.now() },
              { id: `palert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, toId: tenant.id, type: "evicted_nonpayment", propertyId: prop.id, propertyName: prop.name, timestamp: Date.now() },
            ];
            return;
          }
          ns.citizens[tenantIdx] = { ...ns.citizens[tenantIdx], balance: (ns.citizens[tenantIdx].balance || 0) - dailyRate };
          // Verser au propriétaire (citoyen ou entreprise)
          let ownerName = prop.ownerName;
          if (prop.ownerType === "COMPANY") {
            const cIdx = (ns.companies || []).findIndex((c) => c.id === prop.ownerId);
            if (cIdx !== -1) { ns.companies[cIdx] = { ...ns.companies[cIdx], balance: (ns.companies[cIdx].balance || 0) + dailyRate }; ownerName = ns.companies[cIdx].name; }
          } else {
            const ownerIdx = (ns.citizens || []).findIndex((c) => c.id === prop.ownerId);
            if (ownerIdx !== -1) ns.citizens[ownerIdx] = { ...ns.citizens[ownerIdx], balance: (ns.citizens[ownerIdx].balance || 0) + dailyRate };
          }
          ns.globalLedger = [{ id: Date.now() + Math.random(), fromName: tenant.name, toName: ownerName, amount: dailyRate, timestamp: Date.now(), reason: `Loyer : ${prop.name}`, type: "RENT" }, ...(ns.globalLedger || [])];
        });

        // --- Revenu passif des propriétés (champ "income", affiché mais jusqu'ici jamais versé) ---
        (ns.properties || []).forEach((prop) => {
          if (!prop.ownerId || !(prop.income > 0)) return;
          let ownerName = prop.ownerName;
          let payout = prop.income;
          if (prop.ownerType === "COMPANY") {
            const cIdx = (ns.companies || []).findIndex((c) => c.id === prop.ownerId);
            if (cIdx === -1) return;
            // Bonus de revenu selon le personnel affecté au bien (employeeAssignments) — un
            // bâtiment tenu par une entreprise (auberge, atelier...) rapporte davantage s'il est
            // réellement staffé, sans pénaliser un bien laissé sans personnel affecté.
            const assignedCount = Object.values(ns.companies[cIdx].employeeAssignments || {})
              .filter((pid) => String(pid) === String(prop.id)).length;
            const bonusStaff = Math.min(assignedCount, PROPERTY_STAFF_BONUS_CAP);
            payout = Math.round(prop.income * (1 + bonusStaff * PROPERTY_STAFF_BONUS_RATE) * 10) / 10;
            ns.companies[cIdx] = { ...ns.companies[cIdx], balance: (ns.companies[cIdx].balance || 0) + payout };
            ownerName = ns.companies[cIdx].name;
          } else {
            const ownerIdx = (ns.citizens || []).findIndex((c) => c.id === prop.ownerId);
            if (ownerIdx === -1) return;
            ns.citizens[ownerIdx] = { ...ns.citizens[ownerIdx], balance: (ns.citizens[ownerIdx].balance || 0) + payout };
          }
          ns.globalLedger = [{ id: Date.now() + Math.random(), fromName: prop.name, toName: ownerName, amount: payout, timestamp: Date.now(), reason: `Revenu — ${prop.name}`, type: "PROPERTY_INCOME" }, ...(ns.globalLedger || [])];
        });

        // --- Production journalière (Ferme) ---
        (ns.properties || []).forEach((prop, propIdx) => {
          if (!prop.production || !prop.production.itemName || !prop.production.qtyPerDay) return;
          if (!prop.ownerId) return;
          const qty = prop.production.qtyPerDay;
          if (prop.ownerType === "COMPANY") {
            const cIdx = (ns.companies || []).findIndex((c) => c.id === prop.ownerId);
            if (cIdx !== -1) {
              const inv = [...(ns.companies[cIdx].companyInventory || [])];
              // Comparaison insensible à la casse, alignée sur onCompanyInventoryAdd — sinon
              // "Blé" (production) et "blé" (ajout manuel) finissent en deux lignes distinctes.
              const iIdx = inv.findIndex((i) => i.name.toLowerCase() === prop.production.itemName.toLowerCase());
              if (iIdx !== -1) inv[iIdx] = { ...inv[iIdx], quantity: inv[iIdx].quantity + qty };
              // id requis : le stock & inventaire (MyCompanyView) clé et retire les articles par
              // id — sans lui, ces lignes ne pouvaient jamais être retirées ni affichées correctement.
              else inv.push({ id: `INV-${Date.now()}-${prop.id || propIdx}`, name: prop.production.itemName, quantity: qty });
              ns.companies[cIdx] = { ...ns.companies[cIdx], companyInventory: inv };
            }
          } else {
            const oIdx = (ns.citizens || []).findIndex((c) => c.id === prop.ownerId);
            if (oIdx !== -1) {
              // L'inventaire personnel référence toujours un itemId du catalogue (jamais un nom
              // libre, contrairement au stock d'entreprise) — sans entrée catalogue, ces objets
              // étaient silencieusement ignorés par CitizenInventoryView (myInventory filtre
              // tout slot sans itemId). On trouve ou crée une entrée masquée (hidden: true, donc
              // absente de la boutique publique mais visible dans l'inventaire du propriétaire).
              const catalog = ns.inventoryCatalog || [];
              let catEntry = catalog.find((i) => (i.name || "").toLowerCase() === prop.production.itemName.toLowerCase());
              if (!catEntry) {
                catEntry = {
                  id: `ITEM-FARM-${Date.now()}-${propIdx}`,
                  name: prop.production.itemName,
                  description: "Produit agricole récolté automatiquement par une propriété.",
                  rarity: "Commun",
                  price: 1,
                  weight: 0.1,
                  type: "Ressource",
                  category: "Ressources",
                  imageUrl: "",
                  hidden: true,
                  stackable: true,
                  usable: false,
                  stock: -1,
                };
                ns.inventoryCatalog = [...catalog, catEntry];
              }
              const inv = [...(ns.citizens[oIdx].inventory || [])];
              const iIdx = inv.findIndex((i) => i.itemId === catEntry.id);
              if (iIdx !== -1) inv[iIdx] = { ...inv[iIdx], quantity: inv[iIdx].quantity + qty };
              else inv.push({ itemId: catEntry.id, quantity: qty });
              ns.citizens[oIdx] = { ...ns.citizens[oIdx], inventory: inv };
            }
          }
          ns.properties[propIdx] = { ...ns.properties[propIdx], production: { ...prop.production, lastProduced: `${ns.gameDate.day}/${ns.gameDate.month}/${ns.gameDate.year}` } };
        });

        // --- Migration silencieuse : anciens articles de stock d'entreprise sans id (bug de
        // production de ferme corrigé ci-dessus) — leur attribue un id stable pour qu'ils
        // redeviennent affichables et retirables. Idempotent (ne touche que les entreprises
        // encore concernées, ne se redéclenche donc pas les jours suivants).
        (ns.companies || []).forEach((company, compIdx) => {
          const inv = company.companyInventory || [];
          if (inv.length === 0 || inv.every((i) => i.id)) return;
          ns.companies[compIdx] = {
            ...company,
            companyInventory: inv.map((i, ii) => (i.id ? i : { ...i, id: `INV-MIG-${Date.now()}-${ii}` })),
          };
        });

        // --- Migration silencieuse : anciens objets d'inventaire personnel issus de fermes,
        // coincés sans itemId (même bug, corrigé ci-dessus) — les relie à une entrée catalogue
        // (créée si besoin, masquée de la boutique) pour qu'ils redeviennent visibles.
        (ns.citizens || []).forEach((citizen, cIdx) => {
          const inv = citizen.inventory || [];
          if (inv.length === 0 || inv.every((i) => i.itemId || !i.name)) return;
          let catalog = ns.inventoryCatalog || [];
          const fixed = inv.map((slot, si) => {
            if (slot.itemId || !slot.name) return slot;
            let catEntry = catalog.find((i) => (i.name || "").toLowerCase() === slot.name.toLowerCase());
            if (!catEntry) {
              catEntry = {
                id: `ITEM-FARM-MIG-${Date.now()}-${cIdx}-${si}`,
                name: slot.name,
                description: "Produit agricole récolté automatiquement par une propriété.",
                rarity: "Commun", price: 1, weight: 0.1, type: "Ressource", category: "Ressources",
                imageUrl: "", hidden: true, stackable: true, usable: false, stock: -1,
              };
              catalog = [...catalog, catEntry];
            }
            return { itemId: catEntry.id, quantity: slot.quantity };
          });
          ns.inventoryCatalog = catalog;
          ns.citizens[cIdx] = { ...citizen, inventory: fixed };
        });

        // --- Salaires du personnel de propriété ---
        (ns.properties || []).forEach((prop) => {
          if (!prop.ownerId || !(prop.staff || []).length) return;
          (prop.staff || []).forEach((s) => {
            if (!s.salary || s.salary <= 0) return;
            // Prélever du propriétaire
            let paid = false;
            if (prop.ownerType === "COMPANY") {
              const cIdx = (ns.companies || []).findIndex((c) => c.id === prop.ownerId);
              if (cIdx !== -1 && (ns.companies[cIdx].balance || 0) >= s.salary) {
                ns.companies[cIdx] = { ...ns.companies[cIdx], balance: ns.companies[cIdx].balance - s.salary };
                paid = true;
              }
            } else {
              const oIdx = (ns.citizens || []).findIndex((c) => c.id === prop.ownerId);
              if (oIdx !== -1 && (ns.citizens[oIdx].balance || 0) >= s.salary) {
                ns.citizens[oIdx] = { ...ns.citizens[oIdx], balance: ns.citizens[oIdx].balance - s.salary };
                paid = true;
              }
            }
            if (paid) {
              const sIdx = (ns.citizens || []).findIndex((c) => c.id === s.id);
              if (sIdx !== -1) ns.citizens[sIdx] = { ...ns.citizens[sIdx], balance: (ns.citizens[sIdx].balance || 0) + s.salary };
              ns.globalLedger = [{ id: Date.now() + Math.random(), fromName: prop.ownerName, toName: s.name, amount: s.salary, timestamp: Date.now(), reason: `Salaire (${s.role}) — ${prop.name}`, type: "PROPERTY_STAFF" }, ...(ns.globalLedger || [])];
            } else {
              ns.propertyAlerts = [
                ...(ns.propertyAlerts || []),
                { id: `palert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, toId: s.id, type: "staff_unpaid", propertyId: prop.id, propertyName: prop.name, amount: s.salary, timestamp: Date.now() },
              ];
            }
          });
        });

        // --- Abonnement Bague Impériale : débit + reset compteur voyages ---
        const BAGUE_COUT = ns.bagueCost || 10;
        let bagueResiliations = 0;
        const bagueTs = Date.now();
        const bagueLedgerEntries = [];
        ns.citizens = (ns.citizens || []).map((c, i) => {
          if (!c.bagueImperiale) return c;
          if ((c.balance || 0) < BAGUE_COUT) {
            bagueResiliations++;
            bagueLedgerEntries.push({ id: bagueTs + i, fromName: c.name, toName: "Trésor Impérial", amount: 0, timestamp: bagueTs, reason: "Abonnement Bague Impériale résilié (solde insuffisant)", type: "BAGUE_CANCEL" });
            return { ...c, bagueImperiale: false, bagueVoyagesUsed: 0 };
          }
          bagueLedgerEntries.push({ id: bagueTs + i, fromName: c.name, toName: "Trésor Impérial", amount: BAGUE_COUT, timestamp: bagueTs, reason: "Abonnement Bague Impériale (journalier)", type: "BAGUE" });
          return { ...c, balance: (c.balance || 0) - BAGUE_COUT, bagueVoyagesUsed: 0 };
        });
        if (bagueLedgerEntries.length > 0) {
          ns.globalLedger = [...bagueLedgerEntries, ...(ns.globalLedger || [])];
        }

        // --- Rémunération journalière des Érudits ---
        let eruditPayments = 0;
        const eruditLedgerEntries = [];
        (ns.eruditRequests || []).filter((r) => r.status === "APPROVED").forEach((req) => {
          const coIdx = (ns.countries || []).findIndex((c) => String(c.id) === String(req.countryId));
          if (coIdx === -1) return;
          const laws = ns.countries[coIdx].laws;
          const salary = (laws && !Array.isArray(laws)) ? (laws.eruditSalary || 0) : 0;
          if (salary <= 0) return;
          if ((ns.countries[coIdx].treasury || 0) < salary) return;
          const cIdx = (ns.citizens || []).findIndex((c) => String(c.id) === String(req.citizenId));
          if (cIdx === -1) return;
          ns.countries[coIdx] = { ...ns.countries[coIdx], treasury: (ns.countries[coIdx].treasury || 0) - salary };
          ns.citizens[cIdx] = { ...ns.citizens[cIdx], balance: (ns.citizens[cIdx].balance || 0) + salary };
          eruditLedgerEntries.push({
            id: Date.now() + Math.random(),
            fromName: req.countryName || ns.countries[coIdx].name,
            toName: req.citizenName || ns.citizens[cIdx].name,
            amount: salary,
            timestamp: Date.now(),
            reason: `Rémunération Érudit — ${req.countryName || ns.countries[coIdx].name}`,
            type: "ERUDIT_SALARY",
          });
          eruditPayments++;
        });
        if (eruditLedgerEntries.length > 0) {
          ns.globalLedger = [...eruditLedgerEntries, ...(ns.globalLedger || [])];
        }

        // --- Facturation journalière des abonnements Mushtagram ---
        let subBillings = 0;
        let subCancellations = 0;
        const subDateStr = formatRPDate(ns.gameDate);
        const subLedgerEntries = [];
        const survivingSubs = [];
        (ns.mushtagramSubscriptions || []).forEach((sub, i) => {
          if (sub.lastBilledDate === subDateStr) { survivingSubs.push(sub); return; }
          const subIdx = (ns.citizens || []).findIndex(c => String(c.id) === String(sub.subscriberId));
          const creatorIdx = (ns.citizens || []).findIndex(c => String(c.id) === String(sub.creatorId));
          if (subIdx === -1 || creatorIdx === -1) return;
          if ((ns.citizens[subIdx].balance || 0) < sub.price) {
            subCancellations++;
            subLedgerEntries.push({ id: Date.now() + i, fromName: sub.subscriberName, toName: sub.creatorName, amount: 0, timestamp: Date.now(), reason: `Abonnement Mushtagram résilié (solde insuffisant) — ${sub.tierName}`, type: "MUSHTAGRAM_SUB_CANCEL" });
            return;
          }
          ns.citizens[subIdx] = { ...ns.citizens[subIdx], balance: Math.round(((ns.citizens[subIdx].balance || 0) - sub.price) * 10) / 10 };
          ns.citizens[creatorIdx] = { ...ns.citizens[creatorIdx], balance: Math.round(((ns.citizens[creatorIdx].balance || 0) + sub.price) * 10) / 10, mushtagramTotalPaidRevenue: Math.round((((ns.citizens[creatorIdx].mushtagramTotalPaidRevenue || 0) + sub.price)) * 10) / 10 };
          subLedgerEntries.push({ id: Date.now() + i + 1, fromName: sub.subscriberName, toName: sub.creatorName, amount: sub.price, timestamp: Date.now(), reason: `Abonnement Mushtagram — ${sub.tierName}`, type: "MUSHTAGRAM_SUB" });
          subBillings++;
          survivingSubs.push({ ...sub, lastBilledDate: subDateStr });
        });
        ns.mushtagramSubscriptions = survivingSubs;
        if (subLedgerEntries.length > 0) {
          ns.globalLedger = [...subLedgerEntries, ...(ns.globalLedger || [])];
        }

        // --- Dérive quotidienne des pactes arcaniques (traces magiques) ---
        // Chaque couple lié par un pacte arcanique voit l'écart entre ses deux traces
        // magiques varier aléatoirement (rapprochement ou éloignement). Si l'écart devient
        // très faible, la résonance est atteinte : les deux teintes se figent à l'identique,
        // une alerte est envoyée aux deux conjoints, et la dérive s'arrête définitivement
        // pour ce couple.
        let resonanceCount = 0;
        const magicBondAlertEntries = [];
        (ns.citizens || []).forEach((citizen) => {
          (citizen.spouses || []).forEach((s) => {
            if (s.contractType !== "arcane") return;
            if (String(citizen.id) >= String(s.id)) return; // ne traiter chaque paire qu'une fois
            if ((citizen.magicBond?.resonantWith || []).includes(s.id)) return; // déjà figé
            const spouseIdx = (ns.citizens || []).findIndex((c) => String(c.id) === String(s.id));
            if (spouseIdx === -1) return;
            const citizenIdx = (ns.citizens || []).findIndex((c) => String(c.id) === String(citizen.id));
            if (citizenIdx === -1) return;
            const spouse = ns.citizens[spouseIdx];

            const { hueA, hueB, resonance } = driftMagicBond(ns.citizens[citizenIdx], spouse);
            ns.citizens[citizenIdx] = {
              ...ns.citizens[citizenIdx],
              magicBond: {
                ...ns.citizens[citizenIdx].magicBond,
                hue: hueA,
                ...(resonance ? { resonantWith: [...(ns.citizens[citizenIdx].magicBond?.resonantWith || []), spouse.id] } : {}),
              },
            };
            ns.citizens[spouseIdx] = {
              ...ns.citizens[spouseIdx],
              magicBond: {
                ...ns.citizens[spouseIdx].magicBond,
                hue: hueB,
                ...(resonance ? { resonantWith: [...(ns.citizens[spouseIdx].magicBond?.resonantWith || []), citizen.id] } : {}),
              },
            };

            if (resonance) {
              resonanceCount++;
              const ts = Date.now();
              magicBondAlertEntries.push(
                { id: `magicbond_${ts}_${Math.random().toString(36).slice(2, 6)}`, toId: citizen.id, spouseId: spouse.id, spouseName: spouse.name, timestamp: ts, read: false },
                { id: `magicbond_${ts}_${Math.random().toString(36).slice(2, 6)}`, toId: spouse.id, spouseId: citizen.id, spouseName: citizen.name, timestamp: ts, read: false },
              );
            }
          });
        });
        if (magicBondAlertEntries.length > 0) {
          ns.magicBondAlerts = [...magicBondAlertEntries, ...(ns.magicBondAlerts || [])];
        }

        saveState(ns);
        notify(
          `Nouveau jour : ${ns.gameDate.day}/${ns.gameDate.month}/${ns.gameDate.year} (${season})${bagueResiliations > 0 ? ` — ${bagueResiliations} bague(s) résiliée(s)` : ""}${eruditPayments > 0 ? ` — ${eruditPayments} Érudit(s) rémunéré(s)` : ""}${subBillings > 0 ? ` — ${subBillings} abonnement(s) Mushtagram facturé(s)` : ""}${subCancellations > 0 ? ` — ${subCancellations} résilié(s)` : ""}${resonanceCount > 0 ? ` — ${resonanceCount} pacte(s) arcanique(s) en résonance !` : ""}`,
          "info"
        );
      },

      // Marque une alerte de résonance arcanique comme lue (ferme le grand rituel affiché).
      onAcknowledgeMagicBondAlert: (alertId) => {
        if (!session) return;
        const alert = (state.magicBondAlerts || []).find((a) => a.id === alertId);
        if (!alert || String(alert.toId) !== String(session.id)) return;
        const magicBondAlerts = (state.magicBondAlerts || []).map((a) => a.id === alertId ? { ...a, read: true } : a);
        saveState({ ...state, magicBondAlerts });
      },

      onAddTreasury: (amount) => {
        const val = parseFloat(amount);
        if (val && !isNaN(val) && val > 0) {
          const newEntry = {
            id: Date.now(),
            fromName: "Hôtel des Monnaies",
            toName: "Trésor Impérial",
            amount: val,
            timestamp: Date.now(),
            reason: "Frappe de monnaie (Création)",
            type: "MINT",
          };
          saveState({
            ...state,
            treasury: (state.treasury || 0) + val,
            globalLedger: [newEntry, ...(state.globalLedger || [])],
          });
          notify(`${formatMoney(val)} ont été frappés.`, "success");
        } else {
          notify("Montant invalide.", "error");
        }
      },
      // --- CONTRATS D'EMPLOI ---
      onSaveJobContract: (job) => {
        const contracts = [...(state.jobContracts || [])];
        const idx = contracts.findIndex((j) => j.id === job.id);
        if (idx !== -1) {
          contracts[idx] = job;
        } else {
          contracts.push(job);
        }
        saveState({ ...state, jobContracts: contracts });
        notify(`Contrat "${job.name}" sauvegardé.`, "success");
      },

      onDeleteJobContract: (jobId) => {
        const contracts = (state.jobContracts || []).filter((j) => j.id !== jobId);
        saveState({ ...state, jobContracts: contracts });
        notify("Contrat supprimé.", "info");
      },

      onToggleJobContract: (jobId) => {
        const contracts = (state.jobContracts || []).map((j) =>
          j.id === jobId ? { ...j, active: !j.active } : j
        );
        saveState({ ...state, jobContracts: contracts });
      },

      onCreateCompany: (name, type, ownerId, countryId, startingBalance) => {
        if (!name || !type || !ownerId) {
          notify("Données incomplètes.", "error");
          return;
        }
        const newCompany = {
          id: `comp_${Date.now()}`,
          name: name,
          type: type,
          ownerId: ownerId,
          countryId: countryId || "NONE",
          level: 1,
          balance: parseFloat(startingBalance) || 0,
          employees: [],
          slaves: [],
          inventory: [],
          createdAt: Date.now(),
          taxRate: 10,
          frozen: false,
          description: "",
          color: "#8B5CF6",
          motto: "",
          hiringOpen: true,
        };
        saveState({
          ...state,
          companies: [newCompany, ...(state.companies || [])],
        });
        notify(`Entreprise "${name}" créée.`, "success");
      },
      onDeleteCompany: (companyId) => {
        if (!session) return;
        const company = (state.companies || []).find(
          (c) => c.id === companyId
        );
        if (!company) return;
        // Autorisé si admin OU propriétaire
        const isAdmin = session.role === "admin";
        const isOwner = company.ownerId === session.id;
        if (!isAdmin && !isOwner) {
          notify("Non autorisé.", "error");
          return;
        }

        const newCitizens = [...state.citizens];
        // Restituer le solde au propriétaire
        if (company.balance > 0) {
          const ownerIdx = newCitizens.findIndex(
            (c) => c.id === company.ownerId
          );
          if (ownerIdx !== -1) {
            newCitizens[ownerIdx] = {
              ...newCitizens[ownerIdx],
              balance:
                (newCitizens[ownerIdx].balance || 0) + company.balance,
            };
          }
        }

        const newCompanies = (state.companies || []).filter(
          (c) => c.id !== companyId
        );
        saveState({
          ...state,
          companies: newCompanies,
          citizens: newCitizens,
        });
        notify(`Entreprise "${company.name}" dissoute.`, "info");
      },

      // --- ÉDITION ADMIN COMPLÈTE ---
      onEditCompany: (companyId, updates) => {
        const compIdx = (state.companies || []).findIndex(
          (c) => c.id === companyId
        );
        if (compIdx === -1) return;
        const allowed = [
          "name",
          "type",
          "level",
          "balance",
          "ownerId",
          "countryId",
          "taxRate",
          "frozen",
        ];
        const sanitized = {};
        allowed.forEach((key) => {
          if (updates[key] !== undefined) sanitized[key] = updates[key];
        });
        if (sanitized.level !== undefined)
          sanitized.level = Math.max(1, parseInt(sanitized.level) || 1);
        if (sanitized.balance !== undefined)
          sanitized.balance = parseFloat(sanitized.balance) || 0;
        if (sanitized.taxRate !== undefined)
          sanitized.taxRate = Math.max(
            0,
            Math.min(100, parseFloat(sanitized.taxRate) || 0)
          );
        const newCompanies = [...state.companies];
        newCompanies[compIdx] = { ...newCompanies[compIdx], ...sanitized };
        saveState({ ...state, companies: newCompanies });
        notify("Entreprise modifiée.", "success");
      },

      // --- PERSONNALISATION JOUEUR ---
      onCustomizeCompany: (companyId, updates) => {
        if (!session) return;
        const compIdx = (state.companies || []).findIndex(
          (c) => c.id === companyId
        );
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        if (!isCompanyManager(company, session.id)) {
          notify("Vous n'êtes pas propriétaire.", "error");
          return;
        }
        const allowed = ["description", "color", "motto", "hiringOpen"];
        const sanitized = {};
        allowed.forEach((key) => {
          if (updates[key] !== undefined) sanitized[key] = updates[key];
        });
        const newCompanies = [...state.companies];
        newCompanies[compIdx] = { ...newCompanies[compIdx], ...sanitized };
        saveState({ ...state, companies: newCompanies });
        notify("Entreprise personnalisée.", "success");
      },

      // --- PDG : délégation de gestion + actions non émises offertes ---
      // Le propriétaire reste seul propriétaire légal (ownerId inchangé) mais délègue au PDG
      // la quasi-totalité des droits de gestion (voir isCompanyManager, utilisé par toutes les
      // actions de gestion d'entreprise). Si l'entreprise est cotée en bourse, le PDG reçoit en
      // plus, gratuitement, toutes les actions du flottant COMPANY jamais vendues à un
      // investisseur — il devient actionnaire sans rien débourser.
      onAppointCEO: ({ companyId, citizenId }) => {
        if (!session) return;
        const compIdx = (state.companies || []).findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        if (String(company.ownerId) !== String(session.id)) {
          notify("Seul le propriétaire peut nommer un PDG.", "error");
          return;
        }
        if (String(citizenId) === String(company.ownerId)) {
          notify("Vous êtes déjà propriétaire de cette entreprise.", "error");
          return;
        }
        const citizen = (state.citizens || []).find((c) => c.id === citizenId);
        if (!citizen) { notify("Citoyen introuvable.", "error"); return; }
        // Le PDG doit être choisi parmi le personnel de l'entreprise : salarié en poste, ou
        // salarié actuellement détaché vers cette entreprise (staffLoans, toCompanyId).
        const isEmployee = (company.employees || []).map(String).includes(String(citizenId));
        const isBorrowedIn = (state.staffLoans || []).some(
          (l) => l.status === "ACTIVE" && String(l.toCompanyId) === String(companyId) && String(l.employeeId) === String(citizenId)
        );
        if (!isEmployee && !isBorrowedIn) {
          notify("Le PDG doit être choisi parmi les salariés ou salariés détachés de l'entreprise.", "error");
          return;
        }

        const newCompanies = [...state.companies];
        newCompanies[compIdx] = { ...company, ceoId: citizenId };

        // Le PROPRIÉTAIRE (pas le PDG) devient actionnaire : en se retirant de la gestion
        // opérationnelle au profit du PDG, il récupère gratuitement toutes les actions du
        // flottant COMPANY jamais vendues à un investisseur.
        let newCitizens = state.citizens;
        let newListings = state.bourseListings;
        let grantedShares = 0;
        const listingIdx = (state.bourseListings || []).findIndex((l) => l.companyId === companyId);
        if (listingIdx !== -1) {
          const listing = state.bourseListings[listingIdx];
          grantedShares = (listing.sellOrders || []).filter((o) => o.citizenId === "COMPANY").reduce((s, o) => s + o.qty, 0);
          if (grantedShares > 0) {
            newListings = [...state.bourseListings];
            newListings[listingIdx] = { ...listing, sellOrders: (listing.sellOrders || []).filter((o) => o.citizenId !== "COMPANY") };
            const ownerIdx = (state.citizens || []).findIndex((c) => c.id === company.ownerId);
            if (ownerIdx !== -1) {
              newCitizens = [...state.citizens];
              const holdings = { ...(newCitizens[ownerIdx].stockholdings || {}) };
              holdings[listing.id] = (holdings[listing.id] || 0) + grantedShares;
              newCitizens[ownerIdx] = { ...newCitizens[ownerIdx], stockholdings: holdings };
            }
          }
        }

        saveState({ ...state, companies: newCompanies, citizens: newCitizens, bourseListings: newListings });
        notify(`${citizen.name} nommé PDG de ${company.name}${grantedShares > 0 ? ` — vous recevez gratuitement ${grantedShares} action(s) non émise(s) en tant qu'actionnaire.` : ""}.`, "success");
      },

      onRevokeCEO: (companyId) => {
        if (!session) return;
        const compIdx = (state.companies || []).findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        if (String(company.ownerId) !== String(session.id)) {
          notify("Seul le propriétaire peut révoquer le PDG.", "error");
          return;
        }
        if (!company.ceoId) return;
        const newCompanies = [...state.companies];
        newCompanies[compIdx] = { ...company, ceoId: null };
        saveState({ ...state, companies: newCompanies });
        notify("PDG révoqué — les actions déjà attribuées restent acquises au titre d'actionnaire.", "info");
      },

      // --- AFFECTATION DU PERSONNEL À UN BIEN DE L'ENTREPRISE ---
      // Un employé/esclave ne peut être affecté qu'à un seul bien à la fois (son "poste"). Voir
      // le versement du revenu passif (onPassDay) pour le bonus de revenu qui en découle.
      // propertyId = null/"" retire l'affectation.
      onAssignEmployeeToProperty: ({ companyId, employeeId, propertyId }) => {
        if (!session) return;
        const compIdx = (state.companies || []).findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        if (!isCompanyManager(company, session.id)) {
          notify("Seul le dirigeant peut affecter le personnel.", "error");
          return;
        }
        const isWorker = (company.employees || []).map(String).includes(String(employeeId))
          || (company.slaves || []).map(String).includes(String(employeeId));
        if (!isWorker) { notify("Ce citoyen ne fait pas partie du personnel de l'entreprise.", "error"); return; }

        const assignments = { ...(company.employeeAssignments || {}) };
        if (!propertyId) {
          delete assignments[employeeId];
        } else {
          const prop = (state.properties || []).find((p) => p.id === propertyId);
          if (!prop || prop.ownerType !== "COMPANY" || String(prop.ownerId) !== String(companyId)) {
            notify("Ce bien n'appartient pas à l'entreprise.", "error");
            return;
          }
          assignments[employeeId] = propertyId;
        }
        const newCompanies = [...state.companies];
        newCompanies[compIdx] = { ...company, employeeAssignments: assignments };
        saveState({ ...state, companies: newCompanies });
        notify(propertyId ? "Personnel affecté." : "Affectation retirée.", "success");
      },

      // --- NOTIFICATIONS PUSH (app Android/iOS) ---
      // Enregistre le token FCM de l'appareil sur le citoyen, pour qu'une Cloud Function
      // puisse plus tard lui envoyer une notification push ciblée. Un citoyen peut avoir
      // plusieurs appareils enregistrés (plusieurs tokens).
      onRegisterPushToken: (token) => {
        if (!session || !token) return;
        const idx = (state.citizens || []).findIndex((c) => c.id === session.id);
        if (idx === -1) return;
        const citizen = state.citizens[idx];
        const tokens = citizen.pushTokens || [];
        if (tokens.includes(token)) return;
        const newCitizens = [...state.citizens];
        newCitizens[idx] = { ...citizen, pushTokens: [...tokens, token] };
        saveState({ ...state, citizens: newCitizens });
      },

      // --- GESTION TRÉSORERIE ---
      onCompanyTreasury: (companyId, amount, type) => {
        if (!session) return;
        const compIdx = state.companies.findIndex((c) => c.id === companyId);
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);

        if (compIdx === -1 || userIdx === -1) return;

        const company = state.companies[compIdx];
        const user = state.citizens[userIdx];
        const val = parseFloat(amount);

        if (!isCompanyManager(company, session.id)) {
          notify("Action non autorisée.", "error");
          return;
        }

        if (!val || val <= 0) {
          notify("Montant invalide.", "error");
          return;
        }

        const newCompanies = [...state.companies];
        const newCitizens = [...state.citizens];

        if (type === "DEPOSIT") {
          if (user.balance < val) {
            notify("Fonds insuffisants.", "error");
            return;
          }
          newCitizens[userIdx] = { ...user, balance: user.balance - val };
          newCompanies[compIdx] = {
            ...company,
            balance: company.balance + val,
          };
          notify(`Capital injecté : ${val} écus.`, "success");
        } else if (type === "WITHDRAW") {
          // Une fois cotée en bourse, la trésorerie appartient aussi aux actionnaires — le
          // propriétaire ne peut plus la ponctionner directement, seul onBoursePayDividends
          // (versement par action, partagé avec tous les détenteurs) reste disponible.
          const isListed = (state.bourseListings || []).some((l) => l.companyId === companyId);
          if (isListed) {
            notify("Entreprise cotée en bourse : utilisez le versement de dividendes par action (onglet Bourse).", "error");
            return;
          }
          if (company.balance < val) {
            notify("Trésorerie insuffisante.", "error");
            return;
          }
          newCompanies[compIdx] = {
            ...company,
            balance: company.balance - val,
          };
          newCitizens[userIdx] = { ...user, balance: user.balance + val };
          notify(`Dividendes retirés : ${val} écus.`, "success");
        }

        const ledgerEntry = {
          id: Date.now(),
          fromName: type === "DEPOSIT" ? user.name : company.name,
          toName: type === "DEPOSIT" ? company.name : user.name,
          amount: val,
          timestamp: Date.now(),
          reason: type === "DEPOSIT" ? "Injection de capital" : "Retrait de dividendes",
          type: "COMPANY_TREASURY",
        };

        saveState({
          ...state,
          companies: newCompanies,
          citizens: newCitizens,
          globalLedger: [ledgerEntry, ...(state.globalLedger || [])],
        });
      },

      // --- PAYER SALAIRES (individuel ou uniforme, employés + esclaves) ---
      onPaySalaries: (companyId, salaryData) => {
        const compIdx = state.companies.findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;

        const company = state.companies[compIdx];
        const employees = company.employees || [];
        const slaves = company.slaves || [];
        const allWorkers = [...employees, ...slaves];
        if (allWorkers.length === 0) {
          notify("Aucun travailleur à payer.", "info");
          return;
        }

        const isMap =
          typeof salaryData === "object" && !Array.isArray(salaryData);
        let totalCost = 0;
        const payments = {};

        allWorkers.forEach((wId) => {
          const val = isMap
            ? parseFloat(salaryData[wId]) || 0
            : parseFloat(salaryData) || 0;
          if (val > 0) {
            payments[wId] = val;
            totalCost += val;
          }
        });

        if (totalCost <= 0) {
          notify("Aucun salaire à verser.", "error");
          return;
        }
        if (company.balance < totalCost) {
          notify(`Fonds insuffisants. Il faut ${totalCost} écus.`, "error");
          return;
        }

        const newCompanies = [...state.companies];

        // Salaire crédité sur le compte interne de l'entreprise (workerBalances)
        const wb = { ...(company.workerBalances || {}) };
        Object.entries(payments).forEach(([empId, val]) => {
          wb[empId] = (wb[empId] || 0) + val;
        });

        newCompanies[compIdx] = {
          ...company,
          balance: company.balance - totalCost,
          workerBalances: wb,
        };

        const salaryLedger = Object.entries(payments).map(([empId, val]) => {
          const emp = (state.citizens || []).find((c) => c.id === empId);
          return {
            id: Date.now() + Math.random(),
            fromName: company.name,
            toName: emp?.name || empId,
            amount: val,
            timestamp: Date.now(),
            reason: "Salaire (compte entreprise)",
            type: "SALARY",
          };
        });

        saveState({
          ...state,
          companies: newCompanies,
          globalLedger: [...salaryLedger, ...(state.globalLedger || [])],
        });
        notify(
          `Salaires versés : ${totalCost.toLocaleString()} écus crédités sur les comptes internes.`,
          "success"
        );
      },

      // --- RETRAIT SALAIRE EMPLOYÉ ---
      onWithdrawCompanySalary: (companyId, amount) => {
        if (!session) return;
        const compIdx = state.companies.findIndex((c) => c.id === companyId);
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (compIdx === -1 || userIdx === -1) return;

        const company = state.companies[compIdx];
        const user = state.citizens[userIdx];
        const val = parseFloat(amount);
        if (!val || val <= 0) {
          notify("Montant invalide.", "error");
          return;
        }

        const wb = { ...(company.workerBalances || {}) };
        const available = wb[session.id] || 0;
        if (val > available) {
          notify(`Solde insuffisant. Disponible : ${available} écus.`, "error");
          return;
        }

        wb[session.id] = available - val;
        if (wb[session.id] <= 0) delete wb[session.id];

        const newCompanies = [...state.companies];
        newCompanies[compIdx] = { ...company, workerBalances: wb };

        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = { ...user, balance: (user.balance || 0) + val };

        const ledgerEntry = {
          id: Date.now(),
          fromName: company.name,
          toName: user.name,
          amount: val,
          timestamp: Date.now(),
          reason: "Retrait de salaire",
          type: "SALARY_WITHDRAW",
        };

        saveState({
          ...state,
          companies: newCompanies,
          citizens: newCitizens,
          globalLedger: [ledgerEntry, ...(state.globalLedger || [])],
        });
        notify(`${val.toLocaleString()} écus retirés de votre compte entreprise.`, "success");
      },

      // --- NOUVEAU : OFFRES D'EMPLOI ---
      onSendJobOffer: (companyId, targetId, contractTerms) => {
        const company = state.companies.find((c) => c.id === companyId);
        if (!company) return;

        // Vérifier si déjà employé ailleurs ou ici
        const isEmployed = state.companies.some((c) =>
          (c.employees || []).includes(targetId)
        );
        if (isEmployed) {
          notify("Ce citoyen a déjà un emploi.", "error");
          return;
        }

        const newCitizens = [...state.citizens];
        const targetIdx = newCitizens.findIndex((c) => c.id === targetId);
        if (targetIdx === -1) return;

        const target = newCitizens[targetIdx];
        // Vérifier si déjà une offre de cette boite
        const existingOffers = target.jobOffers || [];
        if (existingOffers.some((o) => o.companyId === companyId)) {
          notify("Offre déjà envoyée.", "info");
          return;
        }

        const terms = contractTerms || { type: "MERCENARIAT", contractDurationDays: null, dimePercent: 0, corveeFreeDaysPerMonth: 0, buyoutAmount: 0, migrationLocked: false, customClauses: [], signingBonus: 0, profitSharePercent: 0, severanceAmount: 0 };
        newCitizens[targetIdx] = {
          ...target,
          jobOffers: [
            ...existingOffers,
            {
              id: Date.now(),
              companyId: company.id,
              companyName: company.name,
              date: Date.now(),
              contractTerms: terms,
            },
          ],
        };

        saveState({ ...state, citizens: newCitizens });
        notify("Proposition d'embauche envoyée.", "success");
      },

      onRespondJobOffer: (offerId, accept) => {
        if (!session) return;
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;

        const user = state.citizens[userIdx];
        const offer = (user.jobOffers || []).find((o) => o.id === offerId);
        if (!offer) return;

        const newCitizens = [...state.citizens];
        const newCompanies = [...state.companies];

        // Supprimer l'offre
        newCitizens[userIdx] = {
          ...user,
          jobOffers: (user.jobOffers || []).filter((o) => o.id !== offerId),
        };

        if (accept) {
          const compIdx = newCompanies.findIndex(
            (c) => c.id === offer.companyId
          );
          if (compIdx !== -1) {
            const company = newCompanies[compIdx];
            // Ajout à l'entreprise
            const seniorityData = { ...(company.employeeSeniority || {}) };
            seniorityData[user.id] = 0;
            const defaultTerms = { type: "MERCENARIAT", contractDurationDays: null, dimePercent: 0, corveeFreeDaysPerMonth: 0, buyoutAmount: 0, migrationLocked: false, customClauses: [], signingBonus: 0, profitSharePercent: 0, severanceAmount: 0 };
            const finalTerms = offer.contractTerms || defaultTerms;
            const signingBonus = finalTerms.signingBonus || 0;
            let ledgerEntries = [];
            if (signingBonus > 0) {
              newCitizens[userIdx] = { ...newCitizens[userIdx], balance: Math.round(((newCitizens[userIdx].balance || 0) + signingBonus) * 10) / 10 };
              const ts = Date.now();
              ledgerEntries.push({ id: ts, fromName: company.name, toName: user.name, amount: signingBonus, timestamp: ts, reason: `Prime d'embauche — contrat ${finalTerms.type}`, type: "SIGNING_BONUS" });
            }
            newCompanies[compIdx] = {
              ...company,
              balance: Math.round(((company.balance || 0) - signingBonus) * 10) / 10,
              employees: [...(company.employees || []), user.id],
              employeeSeniority: seniorityData,
              employmentContracts: {
                ...(company.employmentContracts || {}),
                [user.id]: { ...finalTerms, signedAt: Date.now() },
              },
            };
            saveState({ ...state, citizens: newCitizens, companies: newCompanies, ...(ledgerEntries.length > 0 ? { globalLedger: [...ledgerEntries, ...(state.globalLedger || [])].slice(0, 1000) } : {}) });
            notify(`Vous avez rejoint ${company.name}.${signingBonus > 0 ? ` Prime d'embauche : ${formatMoney(signingBonus)}.` : ""}`, "success");
            return;
          } else {
            notify("L'entreprise n'existe plus.", "error");
          }
        } else {
          notify("Offre déclinée.", "info");
        }

        saveState({ ...state, citizens: newCitizens, companies: newCompanies });
      },

      onCompanyFire: (companyId, targetId, action) => {
        const compIdx = state.companies.findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        const newCompanies = [...state.companies];

        if (action === "FIRE") {
          const firedContracts = { ...(company.employmentContracts || {}) };
          const contract = firedContracts[targetId];
          delete firedContracts[targetId];
          const firedAssignments = { ...(company.employeeAssignments || {}) };
          delete firedAssignments[targetId];
          newCompanies[compIdx] = {
            ...company,
            employees: (company.employees || []).filter((id) => id !== targetId),
            employmentContracts: firedContracts,
            employeeAssignments: firedAssignments,
            mushtagramAuthorizedIds: (company.mushtagramAuthorizedIds || []).filter((id) => String(id) !== String(targetId)),
          };
          const severance = contract?.severanceAmount || 0;
          if (severance > 0) {
            const citIdx = state.citizens.findIndex((c) => c.id === targetId);
            if (citIdx !== -1) {
              const newCitizens = [...state.citizens];
              newCitizens[citIdx] = { ...newCitizens[citIdx], balance: Math.round(((newCitizens[citIdx].balance || 0) + severance) * 10) / 10 };
              newCompanies[compIdx] = { ...newCompanies[compIdx], balance: Math.round(((newCompanies[compIdx].balance || 0) - severance) * 10) / 10 };
              const ts = Date.now();
              const ledgerEntry = { id: ts, fromName: company.name, toName: newCitizens[citIdx].name, amount: severance, timestamp: ts, reason: `Indemnité de licenciement — contrat ${contract.type}`, type: "SEVERANCE" };
              saveState({ ...state, companies: newCompanies, citizens: newCitizens, globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
              notify(`Employé licencié. Indemnité versée : ${formatMoney(severance)}.`, "info");
              return;
            }
          }
          notify("Employé licencié.", "info");
        } else if (action === "ASSIGN_SLAVE") {
          if ((company.slaves || []).includes(targetId)) return;
          newCompanies[compIdx] = {
            ...company,
            slaves: [...(company.slaves || []), targetId],
          };
          notify("Esclave affecté.", "success");
        } else if (action === "REMOVE_SLAVE") {
          const removedAssignments = { ...(company.employeeAssignments || {}) };
          delete removedAssignments[targetId];
          newCompanies[compIdx] = {
            ...company,
            slaves: (company.slaves || []).filter((id) => id !== targetId),
            employeeAssignments: removedAssignments,
          };
          notify("Esclave retiré.", "info");
        }
        saveState({ ...state, companies: newCompanies });
      },

      // --- DÉMISSION (employé quitte de lui-même) ---
      onQuitCompany: (companyId) => {
        if (!session) return;
        const compIdx = (state.companies || []).findIndex(
          (c) => c.id === companyId
        );
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        const isEmployee = (company.employees || []).includes(session.id);
        if (!isEmployee) {
          notify("Vous n'êtes pas employé ici.", "error");
          return;
        }
        // Vérifier clause de rachat
        const myContract = (company.employmentContracts || {})[session.id];
        if (myContract && myContract.buyoutAmount > 0) {
          notify(`Votre contrat exige le paiement de ${formatMoney(myContract.buyoutAmount)} pour rompre le lien. Utilisez "Payer ma liberté".`, "error");
          return;
        }
        const newCompanies = [...state.companies];
        const newContracts = { ...(company.employmentContracts || {}) };
        delete newContracts[session.id];
        const newAssignments = { ...(company.employeeAssignments || {}) };
        delete newAssignments[session.id];
        newCompanies[compIdx] = {
          ...company,
          employees: (company.employees || []).filter((id) => id !== session.id),
          employmentContracts: newContracts,
          employeeAssignments: newAssignments,
          mushtagramAuthorizedIds: (company.mushtagramAuthorizedIds || []).filter((id) => String(id) !== String(session.id)),
        };
        saveState({ ...state, companies: newCompanies });
        notify(`Vous avez quitté ${company.name}.`, "info");
      },

      // --- RACHAT DE LIBERTÉ (serf paie pour rompre son contrat) ---
      onPayBuyout: (companyId) => {
        if (!session) return;
        const compIdx = (state.companies || []).findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        const contract = (company.employmentContracts || {})[session.id];
        if (!contract || !contract.buyoutAmount) { notify("Aucun rachat requis.", "info"); return; }
        const amount = contract.buyoutAmount;
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const citizen = state.citizens[userIdx];
        if ((citizen.balance || 0) < amount) {
          notify(`Fonds insuffisants. Il vous faut ${formatMoney(amount)} pour acheter votre liberté.`, "error");
          return;
        }
        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = { ...citizen, balance: Math.round(((citizen.balance || 0) - amount) * 10) / 10 };
        const newCompanies = [...state.companies];
        const newContracts = { ...(company.employmentContracts || {}), [session.id]: { ...contract, buyoutAmount: 0 } };
        newCompanies[compIdx] = { ...company, balance: Math.round(((company.balance || 0) + amount) * 10) / 10, employmentContracts: newContracts };
        const ts = Date.now();
        const ledgerEntry = { id: ts, fromName: citizen.name, toName: company.name, amount, timestamp: ts, reason: `Rachat de liberté — contrat ${contract.type}`, type: "BUYOUT" };
        saveState({ ...state, citizens: newCitizens, companies: newCompanies, globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
        notify(`Liberté acquise ! ${formatMoney(amount)} versés à ${company.name}. Vous pouvez désormais quitter votre emploi.`, "success");
      },

      // --- RÉCLAMER LA CORVÉE (employeur prélève des jours de travail gratuit) ---
      onClaimCorvee: (companyId, targetId) => {
        if (!session) return;
        const compIdx = (state.companies || []).findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        if (!isCompanyManager(company, session.id)) { notify("Action non autorisée.", "error"); return; }
        const contract = (company.employmentContracts || {})[targetId];
        if (!contract || !contract.corveeFreeDaysPerMonth || contract.corveeFreeDaysPerMonth <= 0) {
          notify("Cet employé n'a pas de clause de corvée.", "error");
          return;
        }
        const workerBalance = (company.workerBalances || {})[targetId] || 0;
        if (workerBalance <= 0) { notify("Le compte de cet employé est vide, impossible de réclamer la corvée.", "error"); return; }
        // La corvée prélève la valeur de N jours de travail gratuit (calculée sur le workerBalance disponible / 30 * corveeFreeDaysPerMonth)
        const days = Math.min(contract.corveeFreeDaysPerMonth, 30);
        const deduction = Math.min(workerBalance, Math.round(workerBalance / 30 * days * 10) / 10);
        if (deduction <= 0) { notify("Montant de corvée nul.", "info"); return; }
        const newCompanies = [...state.companies];
        newCompanies[compIdx] = {
          ...company,
          balance: Math.round(((company.balance || 0) + deduction) * 10) / 10,
          workerBalances: { ...(company.workerBalances || {}), [targetId]: Math.round((workerBalance - deduction) * 10) / 10 },
        };
        const citizen = (state.citizens || []).find((c) => c.id === targetId);
        const ts = Date.now();
        const ledgerEntry = { id: ts, fromName: citizen?.name || targetId, toName: company.name, amount: deduction, timestamp: ts, reason: `Corvée ${days} jour(s) — contrat ${contract.type}`, type: "CORVEE" };
        saveState({ ...state, companies: newCompanies, globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
        notify(`Corvée réclamée : ${formatMoney(deduction)} prélevés sur le compte de l'employé.`, "success");
      },

      // --- LE RESTE EST INCHANGÉ (POUR COMPATIBILITÉ) ---
      onTransfer: (srcRaw, tgtRaw, amount) => {
        if (!session) return;
        if (!amount || amount <= 0 || !srcRaw || !tgtRaw) {
          notify("Erreur virement.", "error");
          return;
        }

        // Plafond de virement imposé par une tutelle active, uniquement lorsque le virement
        // part du propre compte de l'appelant (n'affecte pas les virements admin entre tiers).
        if (srcRaw === `U-${session.id}`) {
          const me = (state.citizens || []).find((c) => c.id === session.id);
          const limit = me?.guardianship?.active ? me.guardianship.rights?.bankLimit : null;
          if (limit) {
            if (parseFloat(amount) > limit) {
              notify(`Votre tuteur a plafonné vos virements à ${formatMoney(limit)}.`, "error");
              return;
            }
            // Cumul glissant sur 24h vers le même bénéficiaire, pour empêcher de contourner
            // le plafond en fractionnant un gros virement en plusieurs petits dans la journée.
            const now = Date.now();
            const alreadySent = (state.globalLedger || [])
              .filter((e) => e.type === "TRANSFER" && e.fromKey === srcRaw && e.toKey === tgtRaw && now - e.timestamp < 86400000)
              .reduce((sum, e) => sum + (e.amount || 0), 0);
            if (alreadySent + parseFloat(amount) > limit) {
              notify(`Votre tuteur a plafonné vos virements à ${formatMoney(limit)} par jour et par bénéficiaire. Vous avez déjà envoyé ${formatMoney(alreadySent)} à ce destinataire aujourd'hui.`, "error");
              return;
            }
          }
        }

        let s = structuredClone(state);
        const process = (raw, isCredit) => {
          const v = isCredit ? parseFloat(amount) : -parseFloat(amount);
          if (raw === "GLOBAL") {
            s.treasury += v;
            return "Trésor Impérial";
          }
          if (raw.startsWith("U-")) {
            const idx = s.citizens.findIndex((x) => x.id === raw.slice(2));
            if (idx !== -1) {
              s.citizens[idx].balance += v;
              return s.citizens[idx].name;
            }
          }
          if (raw.startsWith("C-")) {
            const idx = s.countries.findIndex((x) => x.id === raw.slice(2));
            if (idx !== -1) {
              s.countries[idx].treasury += v;
              return s.countries[idx].name;
            }
          }
          if (raw.startsWith("E-")) {
            const idx = (s.companies || []).findIndex(
              (x) => x.id === raw.slice(2)
            );
            if (idx !== -1) {
              s.companies[idx].balance = (s.companies[idx].balance || 0) + v;
              return s.companies[idx].name;
            }
          }
          return "Autre";
        };
        const fromName = process(srcRaw, false);
        const toName = process(tgtRaw, true);

        // Enregistrer dans le grand livre
        const ledgerEntry = {
          id: Date.now(),
          fromName,
          toName,
          fromKey: srcRaw,
          toKey: tgtRaw,
          amount: parseFloat(amount),
          timestamp: Date.now(),
          type: "TRANSFER",
        };
        s.globalLedger = [...(s.globalLedger || []), ledgerEntry];

        saveState(s);
        notify("Transfert validé.", "success");
      },
      onSendPost: (targetId, subject, content, ccList, seal, threadId, parentId) => {
        if (!session) return;
        const safeCitizens = state.citizens || [];
        const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
        const dateStr = formatRPDate(gd);
        const newMessage = {
          id: Date.now(),
          from: session.name,
          fromId: session.id,
          date: dateStr,
          subject,
          content,
          seal,
          cc: Array.isArray(ccList) ? ccList : [],
          censored: false,
          threadId: threadId || null,
          parentId: parentId || null,
        };
        const newCitizens = safeCitizens.map((c) =>
          c.id === targetId
            ? { ...c, messages: [newMessage, ...(c.messages || [])] }
            : c
        );
        saveState({ ...state, citizens: newCitizens });
        notify("Message envoyé.", "success");
      },
      onSubscribeBague: () => {
        if (!session) return;
        const bagueCout = state.bagueCost || 10;
        const idx = (state.citizens || []).findIndex((c) => c.id === session.id);
        if (idx === -1) return;
        const citizen = state.citizens[idx];
        if (citizen.bagueImperiale) { notify("Abonnement Bague Impériale déjà actif.", "info"); return; }
        if ((citizen.balance || 0) < bagueCout) { notify(`Fonds insuffisants — ${bagueCout} écus requis.`, "error"); return; }
        const newCitizens = [...state.citizens];
        newCitizens[idx] = { ...citizen, bagueImperiale: true, bagueVoyagesUsed: 0, balance: (citizen.balance || 0) - bagueCout };
        const ledgerEntry = { id: Date.now() + Math.random(), fromName: citizen.name, toName: "Trésor Impérial", amount: bagueCout, timestamp: Date.now(), reason: "Abonnement Bague Impériale (souscription)", type: "BAGUE" };
        saveState({ ...state, citizens: newCitizens, globalLedger: [ledgerEntry, ...(state.globalLedger || [])] });
        notify(`💍 Abonnement Bague Impériale activé — ${bagueCout} écus prélevés.`, "success");
      },

      onUnsubscribeBague: () => {
        if (!session) return;
        const idx = (state.citizens || []).findIndex((c) => c.id === session.id);
        if (idx === -1) return;
        const newCitizens = [...state.citizens];
        newCitizens[idx] = { ...newCitizens[idx], bagueImperiale: false, bagueVoyagesUsed: 0 };
        saveState({ ...state, citizens: newCitizens });
        notify("Abonnement Bague Impériale résilié.", "info");
      },

      onSetBagueCost: (amount) => {
        const val = parseFloat(amount);
        if (isNaN(val) || val < 0) return;
        saveState({ ...state, bagueCost: val });
        notify(`Prix de l'abonnement Bague Impériale fixé à ${val} écus/jour.`, "success");
      },

      onRequestTravel: (toCountryId, toRegion) => {
        const currentCitizen = (state.citizens || []).find((c) => c.id === session.id);
        // L'allocation "2 voyages/jour inclus" de la Bague Impériale ne doit être consommée
        // que pour une destination qui aurait un coût (frais de visa) sans elle — un trajet
        // déjà gratuit (entryVisaFee = 0) ne doit pas grignoter l'allocation pour rien.
        const destCountry = (state.countries || []).find((c) => c.id === toCountryId);
        const hasFee = (destCountry?.laws?.entryVisaFee || 0) > 0;
        if (currentCitizen?.bagueImperiale && hasFee) {
          const used = currentCitizen.bagueVoyagesUsed || 0;
          if (used >= 2) { notify("Limite journalière atteinte — 2 voyages/jour inclus avec la Bague Impériale.", "error"); return; }
        }
        const fromCountry = currentCitizen?.locationCountryId || currentCitizen?.countryId || session.countryId;
        // Mémorise si CETTE demande précise a consommé un voyage gratuit de la Bague Impériale,
        // pour pouvoir le recréditer précisément si la demande est annulée avant validation
        // (voir onCancelTravelRequest) — aucun argent n'est prélevé à la demande (seulement à
        // la validation complète, via applyEntryFee), donc rien d'autre à rembourser.
        const consumedBagueTrip = !!(currentCitizen?.bagueImperiale && hasFee);
        const newReq = {
          id: `req_${Date.now()}`,
          citizenId: session.id,
          citizenName: session.name,
          fromCountry,
          toCountry: toCountryId,
          toRegion: toRegion,
          status: "PENDING",
          validations: { exit: false, entry: false },
          timestamp: Date.now(),
          consumedBagueTrip,
        };
        let newCitizens = state.citizens;
        if (consumedBagueTrip) {
          const cidx = (state.citizens || []).findIndex((c) => c.id === session.id);
          if (cidx !== -1) {
            newCitizens = [...state.citizens];
            newCitizens[cidx] = { ...newCitizens[cidx], bagueVoyagesUsed: (currentCitizen.bagueVoyagesUsed || 0) + 1 };
          }
        }
        saveState({ ...state, citizens: newCitizens, travelRequests: [...(state.travelRequests || []), newReq] });
        notify("Demande soumise.", "success");
      },

      // Annule une demande de voyage encore en attente. Aucun argent n'est prélevé à la demande
      // (les frais de visa ne sont débités qu'à la validation complète, voir applyEntryFee) —
      // rien à rembourser côté Écus, mais un voyage gratuit de la Bague Impériale consommé pour
      // cette demande précise est recrédité.
      onCancelTravelRequest: (requestId) => {
        if (!session) return;
        const req = (state.travelRequests || []).find((r) => r.id === requestId);
        if (!req) { notify("Demande introuvable.", "error"); return; }
        if (String(req.citizenId) !== String(session.id)) { notify("Ce n'est pas votre demande.", "error"); return; }
        if (req.status !== "PENDING") { notify("Cette demande a déjà été traitée.", "error"); return; }
        const travelRequests = (state.travelRequests || []).filter((r) => r.id !== requestId);
        let newCitizens = state.citizens;
        if (req.consumedBagueTrip) {
          const cidx = (state.citizens || []).findIndex((c) => c.id === session.id);
          if (cidx !== -1) {
            newCitizens = [...state.citizens];
            newCitizens[cidx] = { ...newCitizens[cidx], bagueVoyagesUsed: Math.max(0, (newCitizens[cidx].bagueVoyagesUsed || 0) - 1) };
          }
        }
        saveState({ ...state, citizens: newCitizens, travelRequests });
        notify(req.consumedBagueTrip ? "Demande annulée — votre voyage gratuit Bague Impériale a été recrédité." : "Demande annulée.", "info");
      },

      onInternalTravel: (toRegion) => {
        if (!session) return;
        // Le déplacement interne (même pays) n'a jamais de frais de visa — ne doit donc jamais
        // consommer l'allocation de voyages inclus de la Bague Impériale, réservée aux trajets
        // inter-pays qui auraient réellement un coût.
        const userIdx = (state.citizens || []).findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = {
          ...newCitizens[userIdx],
          currentPosition: toRegion || "Capitale",
        };
        saveState({ ...state, citizens: newCitizens });
        notify(`Déplacement vers ${toRegion || "la Capitale"}.`, "success");
      },

      // Position décorative d'un citoyen sur la grille hexagonale de la Ville (carte détaillée
      // de sa région actuelle) — purement visuel/RP, ne change ni son pays ni sa région
      // (voir onInternalTravel/onRequestTravel pour ça), juste où il apparaît sur le plan.
      onSetCityPosition: (hexQ, hexR) => {
        if (!session) return;
        const userIdx = (state.citizens || []).findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const citizen = state.citizens[userIdx];
        const regionId = (state.countries || [])
          .find((c) => c.id === (citizen.locationCountryId || citizen.countryId))
          ?.regions?.find((r) => r.name === citizen.currentPosition)?.id ?? null;
        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = { ...citizen, cityHexQ: hexQ, cityHexR: hexR, cityHexRegionId: regionId };
        saveState({ ...state, citizens: newCitizens });
      },

      // Repositionnement d'un pays sur la carte de l'Empire — depuis la Carte elle-même (clic
      // sur le pays puis sur sa nouvelle case), en plus de l'éditeur dans l'Atlas
      // (GeopoliticsView). Portée globale uniquement : la carte Empire est partagée par tous.
      onSetCountryPosition: (countryId, hexQ, hexR) => {
        if (!session || (ROLES[session.role]?.scope !== "GLOBAL")) { notify("Autorité impériale requise.", "error"); return; }
        const countries = (state.countries || []).map((c) => c.id === countryId ? { ...c, hexQ, hexR } : c);
        saveState({ ...state, countries });
      },

      // Repositionnement d'une région sur la carte de son pays.
      onSetRegionPosition: (countryId, regionId, hexQ, hexR) => {
        if (!hasMapAuthority(countryId)) { notify("Autorité insuffisante sur ce territoire.", "error"); return; }
        const countries = (state.countries || []).map((c) =>
          c.id === countryId ? { ...c, regions: (c.regions || []).map((r) => r.id === regionId ? { ...r, hexQ, hexR } : r) } : c
        );
        saveState({ ...state, countries });
      },

      // Repositionnement d'un bâtiment sur la carte détaillée de sa ville — ouvert en plus à son
      // propriétaire (citoyen ou dirigeant/PDG d'entreprise), pas seulement à l'autorité locale.
      onSetBuildingPosition: (propertyId, hexQ, hexR) => {
        if (!session) return;
        const prop = (state.properties || []).find((p) => p.id === propertyId);
        if (!prop) { notify("Bien introuvable.", "error"); return; }
        if (!isPropertyManager(prop, session.id) && !hasMapAuthority(prop.countryId)) {
          notify("Vous ne pouvez pas repositionner ce bien.", "error");
          return;
        }
        const properties = (state.properties || []).map((p) => p.id === propertyId ? { ...p, cityHexQ: hexQ, cityHexR: hexR } : p);
        saveState({ ...state, properties });
      },

      onUpdateCitizen: (formData) => {
        if (!session) return;
        let freshCitizens = [...(state.citizens || [])];
        const index = freshCitizens.findIndex((x) => x.id === formData.id);
        const previous = index !== -1 ? freshCitizens[index] : null;
        const justDied = formData.status === "Décédé" && previous?.status !== "Décédé";

        if (index !== -1) {
          freshCitizens[index] = { ...freshCitizens[index], ...formData };
        } else {
          freshCitizens.push(formData);
        }

        let sharedAccounts = { ...(state.sharedAccounts || {}) };
        const ledgerEntries = [];

        // ── Veuvage + succession + héritage, uniquement au moment du décès (transition vivant → mort) ──
        if (justDied && previous) {
          const endedAt = Date.now();

          // Chaque union en cours passe au registre matrimonial du défunt et du conjoint survivant,
          // et le fief/trésor commun revient intégralement au survivant (personne d'autre pour le partager).
          (previous.spouses || []).forEach((s) => {
            const spouseIdx = freshCitizens.findIndex((c) => c.id === s.id);
            if (spouseIdx === -1) return;
            const spouse = freshCitizens[spouseIdx];
            const theirEntry = (spouse.spouses || []).find((x) => x.id === previous.id);
            const newSpouseSpouses = (spouse.spouses || []).filter((x) => x.id !== previous.id);
            freshCitizens[spouseIdx] = {
              ...spouse,
              spouseId: newSpouseSpouses[0]?.id || null,
              spouses: newSpouseSpouses,
              marriageHistory: theirEntry
                ? [{ ...theirEntry, endedAt, endReason: "veuvage" }, ...(spouse.marriageHistory || [])]
                : (spouse.marriageHistory || []),
            };
            const pairKey = theirEntry?.sharedBalanceKey || theirEntry?.fiefBalanceKey;
            if (pairKey && sharedAccounts[pairKey]) {
              const remaining = sharedAccounts[pairKey].balance || 0;
              if (remaining > 0) {
                freshCitizens[spouseIdx] = { ...freshCitizens[spouseIdx], balance: (freshCitizens[spouseIdx].balance || 0) + remaining };
              }
              delete sharedAccounts[pairKey];
            }
          });
          if ((previous.spouses || []).length > 0) {
            freshCitizens[index] = {
              ...freshCitizens[index],
              spouseId: null,
              spouses: [],
              marriageHistory: [
                ...(previous.spouses || []).map((s) => ({ ...s, endedAt, endReason: "veuvage" })),
                ...(previous.marriageHistory || []),
              ],
            };
          }

          // Héritage : le trésor personnel du défunt est réparti à parts égales entre les
          // conjoints survivants et les enfants reconnus comme citoyens ; à défaut d'héritier,
          // il revient au Trésor Impérial.
          const estate = previous.balance || 0;
          if (estate > 0) {
            const spouseIds = (previous.spouses || []).map((s) => s.id).filter((sid) => freshCitizens.some((c) => c.id === sid));
            const childIds = (previous.children || []).map((ch) => ch.citizenId).filter((cid) => cid && freshCitizens.some((c) => c.id === cid));
            const beneficiaryIds = [...new Set([...spouseIds, ...childIds])];
            if (beneficiaryIds.length > 0) {
              const share = Math.floor(estate / beneficiaryIds.length);
              let distributed = 0;
              beneficiaryIds.forEach((bid, i) => {
                const bIdx = freshCitizens.findIndex((c) => c.id === bid);
                if (bIdx === -1) return;
                const amount = i === beneficiaryIds.length - 1 ? (estate - distributed) : share;
                distributed += amount;
                freshCitizens[bIdx] = { ...freshCitizens[bIdx], balance: (freshCitizens[bIdx].balance || 0) + amount };
                ledgerEntries.push({ id: Date.now() + Math.random(), fromName: previous.name, toName: freshCitizens[bIdx].name, amount, timestamp: Date.now(), reason: `Héritage — succession de ${previous.name}`, type: "INHERITANCE" });
              });
            } else {
              ledgerEntries.push({ id: Date.now() + Math.random(), fromName: previous.name, toName: "Trésor Impérial", amount: estate, timestamp: Date.now(), reason: `Succession en déshérence — ${previous.name}`, type: "INHERITANCE" });
            }
            freshCitizens[index] = { ...freshCitizens[index], balance: 0 };
          }
        }

        // Succession automatique si le citoyen décède en étant chef de famille
        let freshFamilies = [...(state.families || [])];
        if (formData.status === "Décédé") {
          const fIdx = freshFamilies.findIndex((f) => f.headId === formData.id);
          if (fIdx !== -1) {
            const fam = freshFamilies[fIdx];
            const famLabel = fam.dynastyName || fam.lastName || "la famille";
            if (fam.regentId) {
              const regent = freshCitizens.find((c) => c.id === fam.regentId);
              const newHeadName = regent ? (regent.firstName ? `${regent.firstName} ${regent.lastName || ""}`.trim() : regent.name) : fam.regentName;
              freshFamilies[fIdx] = { ...fam, headId: fam.regentId, headName: newHeadName, regentId: null, regentName: null };
              notify(`Succession : ${fam.regentName || "le régent"} devient chef de ${famLabel}.`, "info");
            } else {
              freshFamilies[fIdx] = { ...fam, headId: null, headName: null };
              notify(`Vacance du titre de chef de ${famLabel} : aucun régent désigné.`, "info");
            }
          }
        }

        saveState({
          ...state,
          citizens: freshCitizens,
          families: freshFamilies,
          sharedAccounts,
          ...(ledgerEntries.length ? { globalLedger: [...ledgerEntries, ...(state.globalLedger || [])].slice(0, 1000) } : {}),
        });
        notify("Registres mis à jour.", "success");
      },
      onBuyItem: (itemId, quantity) => {
        if (!session) return;
        const catalog = state.inventoryCatalog || [];
        const item = catalog.find((i) => i.id === itemId);
        if (!item) {
          notify("Objet introuvable.", "error");
          return;
        }
        const qty = parseInt(quantity) || 1;
        const cost = (item.price || 0) * qty;

        // Vérifier le stock
        if (item.stock !== undefined && item.stock !== -1) {
          if (item.stock < qty) {
            notify(
              item.stock === 0
                ? "Cet objet est épuisé."
                : `Stock insuffisant (${item.stock} restant).`,
              "error"
            );
            return;
          }
        }

        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        if (state.citizens[userIdx].balance < cost) {
          notify("Fonds insuffisants.", "error");
          return;
        }

        const newCitizens = [...state.citizens];
        const inv = [...(newCitizens[userIdx].inventory || [])];
        const existing = inv.findIndex((e) => e.itemId === itemId);
        if (existing !== -1) {
          inv[existing] = {
            ...inv[existing],
            quantity: inv[existing].quantity + qty,
          };
        } else {
          inv.push({ itemId, quantity: qty });
        }
        newCitizens[userIdx] = {
          ...newCitizens[userIdx],
          balance: newCitizens[userIdx].balance - cost,
          inventory: inv,
        };

        // Décrémenter le stock si limité
        let newCatalog = catalog;
        if (item.stock !== undefined && item.stock !== -1) {
          newCatalog = catalog.map((i) =>
            i.id === itemId ? { ...i, stock: i.stock - qty } : i
          );
        }

        // Déterminer la destination des revenus
        let toName = "Trésor Impérial";
        let newTreasury = (state.treasury || 0) + cost;
        const newCompanies = [...(state.companies || [])];
        const newCountries = [...(state.countries || [])];
        const target = item.revenueTarget;

        if (target && target.type !== "GLOBAL" && cost > 0) {
          newTreasury = state.treasury || 0; // pas au trésor
          if (target.type === "COMPANY") {
            const cIdx = newCompanies.findIndex((c) => c.id === target.id);
            if (cIdx !== -1) {
              newCompanies[cIdx] = { ...newCompanies[cIdx], balance: (newCompanies[cIdx].balance || 0) + cost };
              toName = newCompanies[cIdx].name;
            } else {
              newTreasury += cost; toName = "Trésor Impérial";
            }
          } else if (target.type === "CITIZEN") {
            const cIdx = newCitizens.findIndex((c) => c.id === target.id);
            if (cIdx !== -1) {
              newCitizens[cIdx] = { ...newCitizens[cIdx], balance: (newCitizens[cIdx].balance || 0) + cost };
              toName = newCitizens[cIdx].name;
            } else {
              newTreasury += cost; toName = "Trésor Impérial";
            }
          } else if (target.type === "COUNTRY") {
            const cIdx = newCountries.findIndex((c) => c.id === target.id);
            if (cIdx !== -1) {
              newCountries[cIdx] = { ...newCountries[cIdx], treasury: (newCountries[cIdx].treasury || 0) + cost };
              toName = newCountries[cIdx].name;
            } else {
              newTreasury += cost; toName = "Trésor Impérial";
            }
          }
        }

        // Entrée ledger
        const ledgerEntry = {
          id: Date.now(),
          fromName: newCitizens[userIdx].name,
          toName,
          amount: cost,
          timestamp: Date.now(),
          reason: `Achat: ${qty}x ${item.name}`,
          type: "ITEM_PURCHASE",
        };

        saveState({
          ...state,
          citizens: newCitizens,
          companies: newCompanies,
          countries: newCountries,
          inventoryCatalog: newCatalog,
          treasury: newTreasury,
          globalLedger: [ledgerEntry, ...(state.globalLedger || [])],
        });
        notify(
          `${qty}x ${item.name} acheté(s) pour ${formatMoney(cost)}.`,
          "success"
        );
      },
      onGiveItem: (targetId, itemId, quantity) => {
        if (!session) return;
        const qty = parseInt(quantity) || 1;

        const srcIdx = state.citizens.findIndex((c) => c.id === session.id);
        const tgtIdx = state.citizens.findIndex((c) => c.id === targetId);
        if (srcIdx === -1 || tgtIdx === -1) return;

        const srcInv = [...(state.citizens[srcIdx].inventory || [])];
        const slotIdx = srcInv.findIndex((e) => e.itemId === itemId);
        if (slotIdx === -1 || srcInv[slotIdx].quantity < qty) {
          notify("Quantité insuffisante.", "error");
          return;
        }

        // Décrémenter source
        if (srcInv[slotIdx].quantity === qty) {
          srcInv.splice(slotIdx, 1);
        } else {
          srcInv[slotIdx] = {
            ...srcInv[slotIdx],
            quantity: srcInv[slotIdx].quantity - qty,
          };
        }

        // Incrémenter cible
        const tgtInv = [...(state.citizens[tgtIdx].inventory || [])];
        const tgtSlot = tgtInv.findIndex((e) => e.itemId === itemId);
        if (tgtSlot !== -1) {
          tgtInv[tgtSlot] = {
            ...tgtInv[tgtSlot],
            quantity: tgtInv[tgtSlot].quantity + qty,
          };
        } else {
          tgtInv.push({ itemId, quantity: qty });
        }

        const newCitizens = [...state.citizens];
        newCitizens[srcIdx] = {
          ...newCitizens[srcIdx],
          inventory: srcInv,
        };
        newCitizens[tgtIdx] = {
          ...newCitizens[tgtIdx],
          inventory: tgtInv,
        };

        const itemName =
          (state.inventoryCatalog || []).find((i) => i.id === itemId)?.name ||
          "objet";

        // Entrée ledger (don sans transfert monétaire)
        const giftLedger = {
          id: Date.now(),
          fromName: state.citizens[srcIdx].name,
          toName: state.citizens[tgtIdx].name,
          amount: 0,
          timestamp: Date.now(),
          reason: `Don: ${qty}x ${itemName}`,
          type: "ITEM_GIFT",
        };

        saveState({
          ...state,
          citizens: newCitizens,
          globalLedger: [giftLedger, ...(state.globalLedger || [])],
        });
        notify(`${qty}x ${itemName} donné(s).`, "success");
      },

      onUseItem: (itemId) => {
        if (!session) return;
        const catalog = state.inventoryCatalog || [];
        const itemDef = catalog.find((i) => i.id === itemId);
        if (!itemDef?.usable) { notify("Cet objet ne peut pas être utilisé.", "error"); return; }

        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const citizen = state.citizens[userIdx];
        const inv = [...(citizen.inventory || [])];
        const slotIdx = inv.findIndex((e) => e.itemId === itemId);
        if (slotIdx === -1) { notify("Objet introuvable.", "error"); return; }

        // Consommer 1 unité
        const slot = inv[slotIdx];
        if (slot.quantity <= 1) {
          inv.splice(slotIdx, 1);
        } else {
          inv[slotIdx] = { ...slot, quantity: slot.quantity - 1 };
        }

        // Appliquer effets HP / Mana sur les stats de combat
        const cs = { ...(citizen.combatStats || {}) };
        const hpGain   = itemDef.hpRestore   || 0;
        const manaGain = itemDef.manaRestore  || 0;
        if (hpGain > 0) {
          cs.currentHp = Math.min(cs.maxHp || 30, (cs.currentHp ?? cs.maxHp ?? 30) + hpGain);
        }
        if (manaGain > 0) {
          cs.currentMana = Math.min(cs.maxMana || 10, (cs.currentMana ?? cs.maxMana ?? 10) + manaGain);
        }

        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = {
          ...citizen,
          inventory: inv,
          ...((hpGain > 0 || manaGain > 0) ? { combatStats: cs } : {}),
        };
        saveState({ ...state, citizens: newCitizens });

        const gains = [hpGain > 0 && `+${hpGain} PV`, manaGain > 0 && `+${manaGain} Mana`].filter(Boolean).join(", ");
        const msg = itemDef.useEffect?.trim() || (gains || "Aucun effet défini.");
        notify(`${itemDef.name} utilisé${gains ? ` (${gains})` : ""}. ${msg}`, "success");
      },

      onBuySlave: (slaveId, price) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const buyerIdx = newCitizens.findIndex((c) => c.id === session.id);
        const slaveIdx = newCitizens.findIndex((c) => c.id === slaveId);
        if (buyerIdx === -1 || slaveIdx === -1) return;

        if ((newCitizens[buyerIdx].balance || 0) < price) {
          notify("Fonds insuffisants", "error");
          return;
        }

        const previousOwnerId = newCitizens[slaveIdx].ownerId;

        // Débit acheteur
        newCitizens[buyerIdx] = {
          ...newCitizens[buyerIdx],
          balance: (newCitizens[buyerIdx].balance || 0) - price,
        };

        // Crédit vendeur (ancien propriétaire)
        let newTreasury = state.treasury || 0;
        if (previousOwnerId) {
          const sellerIdx = newCitizens.findIndex(
            (c) => c.id === previousOwnerId
          );
          if (sellerIdx !== -1) {
            newCitizens[sellerIdx] = {
              ...newCitizens[sellerIdx],
              balance: (newCitizens[sellerIdx].balance || 0) + price,
            };
          }
        } else {
          // Pas de propriétaire → trésor impérial
          newTreasury += price;
        }

        // Transfert de propriété
        const slave = newCitizens[slaveIdx];
        const hadRole =
          slave.role && slave.role !== "CITOYEN" ? slave.role : null;

        newCitizens[slaveIdx] = {
          ...slave,
          ownerId: session.id,
          isForSale: false,
          salePrice: 0,
          status: "Esclave",
          role: "CITOYEN",
        };

        // Entrée ledger
        const ledgerEntry = {
          id: Date.now(),
          fromName: newCitizens[buyerIdx].name,
          toName: previousOwnerId
            ? newCitizens.find((c) => c.id === previousOwnerId)?.name ||
              "Ancien propriétaire"
            : "Trésor Impérial",
          amount: price,
          timestamp: Date.now(),
          reason: `Achat esclave: ${newCitizens[slaveIdx].name}`,
          type: "SLAVE_PURCHASE",
        };

        // Gazette si déchéance d'un gradé
        const newGazette = [...(state.gazette || [])];
        if (hadRole) {
          const ROLE_LABELS = {
            EMPEREUR: "Grand Empereur",
            GRAND_FONC_GLOBAL: "Grand Fonctionnaire Impérial",
            ROI: "Roi",
            INTENDANT: "Intendant",
            GRAND_FONC_LOCAL: "Grand Fonctionnaire",
            FONCTIONNAIRE: "Fonctionnaire",
            POSTIERE: "Postière",
          };
          newGazette.unshift({
            id: Date.now() + 1,
            date: new Date().toLocaleDateString("fr-FR"),
            author: "Chancellerie Impériale",
            authorRole: "Système",
            title: `Déchéance — ${slave.name}`,
            content: `L'ancien ${ROLE_LABELS[hadRole] || hadRole} ${slave.name} a été réduit en servitude. Son titre et ses fonctions lui ont été retirés par la force des choses.`,
            scope: "GLOBAL",
            countryId: null,
          });
        }

        saveState({
          ...state,
          citizens: newCitizens,
          treasury: newTreasury,
          globalLedger: [ledgerEntry, ...(state.globalLedger || [])],
          gazette: newGazette,
        });
        notify("Esclave acheté.", "success");
      },
      onConfiscateSlaveMoney: (slaveId) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const slaveIdx = newCitizens.findIndex((c) => c.id === slaveId);
        const ownerIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (slaveIdx === -1 || ownerIdx === -1) return;

        const amount = newCitizens[slaveIdx].balance || 0;
        if (amount <= 0) return;

        // Débit esclave
        newCitizens[slaveIdx] = {
          ...newCitizens[slaveIdx],
          balance: 0,
        };
        // Crédit propriétaire
        newCitizens[ownerIdx] = {
          ...newCitizens[ownerIdx],
          balance: (newCitizens[ownerIdx].balance || 0) + amount,
        };

        const ledgerEntry = {
          id: Date.now(),
          fromName: newCitizens[slaveIdx].name,
          toName: newCitizens[ownerIdx].name,
          amount,
          timestamp: Date.now(),
          reason: "Confiscation (Main d'Oeuvre)",
          type: "CONFISCATION",
        };

        saveState({
          ...state,
          citizens: newCitizens,
          globalLedger: [ledgerEntry, ...(state.globalLedger || [])],
        });
        notify(
          `${formatMoney(amount)} confisqués à ${newCitizens[slaveIdx].name}.`,
          "info"
        );
      },

      // --- COMPTE CACHÉ (esclave dissimule son argent) ---
      onHideMoney: (amount) => {
        if (!session) return;
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) return;

        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const citizen = state.citizens[userIdx];

        if (citizen.status !== "Esclave" && !citizen.ownerId) {
          notify("Seuls les esclaves peuvent utiliser cette fonction.", "error");
          return;
        }
        if ((citizen.balance || 0) < amt) {
          notify("Fonds insuffisants.", "error");
          return;
        }

        const newCitizens = [...state.citizens];

        // Transfert vers le compte caché
        newCitizens[userIdx] = {
          ...citizen,
          balance: (citizen.balance || 0) - amt,
          hiddenBalance: (citizen.hiddenBalance || 0) + amt,
        };

        // Chance de détection : 10% de base + 5% par tranche de 15 écus
        const detectionChance = 10 + Math.floor(amt / 15) * 5;
        const roll = Math.random() * 100;
        const detected = roll < detectionChance;

        if (detected && citizen.ownerId) {
          const ownerIdx = newCitizens.findIndex(
            (c) => c.id === citizen.ownerId
          );
          if (ownerIdx !== -1) {
            const owner = newCitizens[ownerIdx];
            const alerts = [...(owner.slaveAlerts || [])];
            alerts.unshift({
              id: Date.now(),
              slaveId: citizen.id,
              slaveName: citizen.name,
              amount: amt,
              timestamp: Date.now(),
              read: false,
            });
            newCitizens[ownerIdx] = { ...owner, slaveAlerts: alerts };
          }
        }

        const hideLedger = {
          id: Date.now(),
          fromName: citizen.name,
          toName: `${citizen.name} (caché)`,
          amount: amt,
          timestamp: Date.now(),
          reason: "Dissimulation de fonds",
          type: "HIDE_MONEY",
        };

        saveState({
          ...state,
          citizens: newCitizens,
          globalLedger: [hideLedger, ...(state.globalLedger || [])],
        });

        if (detected) {
          notify(
            `${formatMoney(amt)} dissimulés... mais votre maître a été alerté ! (${detectionChance}% de risque)`,
            "error"
          );
        } else {
          notify(
            `${formatMoney(amt)} dissimulés avec succès. (${detectionChance}% de risque)`,
            "success"
          );
        }
      },

      onWithdrawHiddenMoney: (amount) => {
        if (!session) return;
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) return;

        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const citizen = state.citizens[userIdx];

        if ((citizen.hiddenBalance || 0) < amt) {
          notify("Fonds cachés insuffisants.", "error");
          return;
        }

        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = {
          ...citizen,
          balance: (citizen.balance || 0) + amt,
          hiddenBalance: (citizen.hiddenBalance || 0) - amt,
        };

        const withdrawLedger = {
          id: Date.now(),
          fromName: `${citizen.name} (caché)`,
          toName: citizen.name,
          amount: amt,
          timestamp: Date.now(),
          reason: "Retrait du compte caché",
          type: "WITHDRAW_HIDDEN",
        };

        saveState({
          ...state,
          citizens: newCitizens,
          globalLedger: [withdrawLedger, ...(state.globalLedger || [])],
        });
        notify(
          `${formatMoney(amt)} retirés du compte caché. Attention, ils sont maintenant visibles !`,
          "info"
        );
      },

      // --- TRANSFERT DEPUIS LE COMPTE CACHÉ ---
      onHiddenTransfer: (targetRaw, amount) => {
        if (!session) return;
        const amt = parseFloat(amount);
        if (!amt || amt <= 0 || !targetRaw) return;

        let s = structuredClone(state);
        const senderIdx = s.citizens.findIndex((c) => c.id === session.id);
        if (senderIdx === -1) return;

        const sender = s.citizens[senderIdx];
        if ((sender.hiddenBalance || 0) < amt) {
          notify("Fonds cachés insuffisants.", "error");
          return;
        }

        s.citizens[senderIdx] = {
          ...sender,
          hiddenBalance: (sender.hiddenBalance || 0) - amt,
        };

        let targetName = "Autre";
        // Support prefixed targets (E- for company, C- for country) or plain citizen ID
        if (targetRaw.startsWith("E-")) {
          const compIdx = (s.companies || []).findIndex((x) => x.id === targetRaw.slice(2));
          if (compIdx !== -1) {
            s.companies[compIdx].balance = (s.companies[compIdx].balance || 0) + amt;
            targetName = s.companies[compIdx].name;
          }
        } else if (targetRaw.startsWith("C-")) {
          const countryIdx = s.countries.findIndex((x) => x.id === targetRaw.slice(2));
          if (countryIdx !== -1) {
            s.countries[countryIdx].treasury += amt;
            targetName = s.countries[countryIdx].name;
          }
        } else {
          // Plain citizen ID (backward compat)
          const targetId = targetRaw.startsWith("U-") ? targetRaw.slice(2) : targetRaw;
          const targetIdx = s.citizens.findIndex((c) => c.id === targetId);
          if (targetIdx !== -1) {
            s.citizens[targetIdx] = {
              ...s.citizens[targetIdx],
              balance: (s.citizens[targetIdx].balance || 0) + amt,
            };
            targetName = s.citizens[targetIdx].name;
          }
        }

        const hiddenLedger = {
          id: Date.now(),
          fromName: `${sender.name} (caché)`,
          toName: targetName,
          amount: amt,
          timestamp: Date.now(),
          reason: "Transfert secret",
          type: "HIDDEN_TRANSFER",
        };
        s.globalLedger = [hiddenLedger, ...(s.globalLedger || [])];

        saveState(s);
        notify(
          `${formatMoney(amt)} transférés discrètement à ${targetName}.`,
          "success"
        );
      },

      // --- ALERTES ESCLAVES (marquer comme lues) ---
      onDismissSlaveAlert: (alertId) => {
        if (!session) return;
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const citizen = state.citizens[userIdx];
        const newAlerts = (citizen.slaveAlerts || []).filter(
          (a) => a.id !== alertId
        );
        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = { ...citizen, slaveAlerts: newAlerts };
        saveState({ ...state, citizens: newCitizens });
      },

      // --- RESTITUTION D'UN TRANSFERT CACHÉ DÉCOUVERT ---
      onRestoreHiddenTransfer: (alertId, slaveId, amount) => {
        if (!session) return;
        const amt = parseFloat(amount);
        if (!amt || amt <= 0 || !slaveId) return;

        const newCitizens = [...state.citizens];
        const masterIdx = newCitizens.findIndex((c) => c.id === session.id);
        const slaveIdx = newCitizens.findIndex((c) => c.id === slaveId);
        if (masterIdx === -1 || slaveIdx === -1) return;

        const slave = newCitizens[slaveIdx];
        const master = newCitizens[masterIdx];

        const available = slave.hiddenBalance || 0;
        const toRestore = Math.min(amt, available);

        // Prélever sur le compte caché de l'esclave
        newCitizens[slaveIdx] = {
          ...slave,
          hiddenBalance: available - toRestore,
        };

        // Créditer le maître
        newCitizens[masterIdx] = {
          ...master,
          balance: (master.balance || 0) + toRestore,
          slaveAlerts: (master.slaveAlerts || []).filter((a) => a.id !== alertId),
        };

        const restoreLedger = {
          id: Date.now(),
          fromName: `${slave.name} (caché)`,
          toName: master.name,
          amount: toRestore,
          timestamp: Date.now(),
          reason: "Restitution — fonds cachés découverts",
          type: "CONFISCATION",
        };

        saveState({
          ...state,
          citizens: newCitizens,
          globalLedger: [restoreLedger, ...(state.globalLedger || [])],
        });
        notify(
          `${formatMoney(toRestore)} restitués depuis le compte caché de ${slave.name}.`,
          "success"
        );
      },

      // --- MARIAGE ---
      onProposeMarriage: (targetId, contractData = {}) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const senderIdx = newCitizens.findIndex((c) => c.id === session.id);
        const targetIdx = newCitizens.findIndex((c) => c.id === targetId);
        if (senderIdx === -1 || targetIdx === -1) return;
        const sender = newCitizens[senderIdx];
        const target = newCitizens[targetIdx];

        if (sender.guardianship?.active && sender.guardianship.rights?.marriageLocked) {
          notify("Votre tuteur a restreint votre droit de contracter une union.", "error");
          return;
        }

        // Vérifier loi matrimoniale du pays de l'expéditeur
        const userCountry = (state.countries || []).find((c) => c.id === session.countryId);
        const structure = userCountry?.laws?.marriageStructure || "monogamie";
        const senderSpouses = sender.spouses || (sender.spouseId ? [{ id: sender.spouseId }] : []);
        const targetSpouses = target.spouses || (target.spouseId ? [{ id: target.spouseId }] : []);

        if (structure === "monogamie") {
          if (senderSpouses.length >= 1) { notify("Vous êtes déjà lié(e) par les vœux. La coutume du Lien Unique est en vigueur.", "error"); return; }
          if (targetSpouses.length >= 1) { notify(`${target.name} est déjà lié(e) par les vœux. La coutume du Lien Unique règne ici.`, "error"); return; }
        }

        if (senderSpouses.some((s) => s.id === targetId)) { notify("Vos destins sont déjà liés.", "error"); return; }
        const existing = (target.marriageProposals || []).some((p) => p.fromId === session.id);
        if (existing) { notify("Vous avez déjà envoyé une proposition à cette personne.", "error"); return; }

        const defaultFiliation = userCountry?.laws?.marriageDefaultFiliation || "patrilineaire";
        newCitizens[targetIdx] = {
          ...target,
          marriageProposals: [...(target.marriageProposals || []), {
            fromId: session.id,
            fromName: sender.name,
            timestamp: Date.now(),
            contractType: contractData.contractType || "sacre",
            regime: contractData.regime || "separation",
            dotType: contractData.dotType || "aucune",
            dot: contractData.dot || 0,
            dominance: contractData.dominance || "egal",
            filiation: contractData.filiation || defaultFiliation,
            clauses: contractData.clauses || "",
          }],
        };
        saveState({ ...state, citizens: newCitizens });
        notify(`Votre proposition d'union a été envoyée à ${target.name}.`, "success");
      },

      onAcceptMarriage: (proposerId) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        const proposerIdx = newCitizens.findIndex((c) => c.id === proposerId);
        if (userIdx === -1 || proposerIdx === -1) return;
        const user = newCitizens[userIdx];
        const proposer = newCitizens[proposerIdx];

        if (user.guardianship?.active && user.guardianship.rights?.marriageLocked) {
          notify("Votre tuteur a restreint votre droit de contracter une union.", "error");
          return;
        }

        const proposal = (user.marriageProposals || []).find((p) => p.fromId === proposerId);
        if (!proposal) return;

        const contractType = proposal.contractType || "sacre";
        const regime = proposal.regime || "separation";
        const dotType = proposal.dotType || "aucune";
        const dot = proposal.dot || 0;
        const dominance = proposal.dominance || "egal";
        const clauses = proposal.clauses || "";
        const date = Date.now();

        // ── Résoudre la filiation selon la domination ──
        // Si dominance, le dominant impose sa lignée (sauf bilineaire/cognatique)
        let filiation = proposal.filiation || "patrilineaire";
        if (dominance === "epoux_dominant" && filiation !== "bilineaire" && filiation !== "cognatique") {
          filiation = "patrilineaire";
        } else if (dominance === "epouse_dominante" && filiation !== "bilineaire" && filiation !== "cognatique") {
          filiation = "matrilineaire";
        }
        // "proposant_dominant" → la filiation de la proposition s'applique telle quelle

        // ── Résoudre qui est le dominant dans chaque entrée ──
        // proposerIdx = celui qui a proposé (session.id au moment de la proposition)
        // userIdx = celui qui accepte (session.id maintenant)
        let dominantIdForUser; // id du dominant vu depuis userIdx
        let dominantIdForProposer; // id du dominant vu depuis proposerIdx
        if (dominance === "egal") {
          dominantIdForUser = null;
          dominantIdForProposer = null;
        } else if (dominance === "epoux_dominant") {
          // On ne connaît pas le genre ici, on se fie aux IDs
          // Par convention : on laisse null, l'UI l'affichera selon le genre du citoyen
          dominantIdForUser = null;
          dominantIdForProposer = null;
        } else if (dominance === "epouse_dominante") {
          dominantIdForUser = null;
          dominantIdForProposer = null;
        } else if (dominance === "proposant_dominant") {
          // Le proposant (proposerIdx) est le dominant
          dominantIdForUser = proposerId;      // vu de userIdx : le dominant est proposerId
          dominantIdForProposer = proposerId;  // vu de proposerIdx : lui-même est dominant
        } else if (dominance === "cible_dominante") {
          // Celui qui accepte (userIdx) est le dominant
          dominantIdForUser = session.id;
          dominantIdForProposer = session.id;
        }

        // ── Transfert de dot (transaction unique aux noces) ──
        if (dot > 0 && dotType !== "aucune") {
          if (dotType === "dotal_epouse") {
            // L'épouse (userIdx = celui qui accepte) verse au proposant
            if ((newCitizens[userIdx].balance || 0) < dot) { notify("Le trésor est insuffisant pour honorer la dot.", "error"); return; }
            newCitizens[userIdx] = { ...newCitizens[userIdx], balance: (newCitizens[userIdx].balance || 0) - dot };
            newCitizens[proposerIdx] = { ...newCitizens[proposerIdx], balance: (newCitizens[proposerIdx].balance || 0) + dot };
          } else if (dotType === "dotal_epoux") {
            // Le proposant verse à l'épouse (userIdx)
            if ((newCitizens[proposerIdx].balance || 0) < dot) { notify("Le trésor du prétendant est insuffisant pour honorer la dot.", "error"); return; }
            newCitizens[proposerIdx] = { ...newCitizens[proposerIdx], balance: (newCitizens[proposerIdx].balance || 0) - dot };
            newCitizens[userIdx] = { ...newCitizens[userIdx], balance: (newCitizens[userIdx].balance || 0) + dot };
          }
        }

        // ── Trésor commun (régime communauté) ──
        // sharedBalance est un objet indexé par paire d'IDs triés, stocké sur chaque époux
        const pairKey = [session.id, proposerId].sort().join("_");
        const sharedBalance = regime === "communaute" ? 0 : undefined;

        const spouseEntryForUser = {
          id: proposerId,
          name: proposer.name,
          contractType,
          regime,
          dotType,
          dot,
          dominance,
          dominantId: dominantIdForUser,
          filiation,
          clauses,
          date,
          ...(regime === "communaute" ? { sharedBalanceKey: pairKey } : {}),
          ...(regime === "fief_conjoint" ? { fiefBalanceKey: pairKey } : {}),
        };
        const spouseEntryForProposer = {
          id: session.id,
          name: user.name,
          contractType,
          regime,
          dotType,
          dot,
          dominance,
          dominantId: dominantIdForProposer,
          filiation,
          clauses,
          date,
          ...(regime === "communaute" ? { sharedBalanceKey: pairKey } : {}),
          ...(regime === "fief_conjoint" ? { fiefBalanceKey: pairKey } : {}),
        };

        const userSpouses = [...(newCitizens[userIdx].spouses || []), spouseEntryForUser];
        const proposerSpouses = [...(newCitizens[proposerIdx].spouses || []), spouseEntryForProposer];

        // Initialiser sharedBalance ou fiefBalance dans l'état global si nécessaire
        const sharedAccounts = { ...(state.sharedAccounts || {}) };
        if (regime === "communaute" && !(pairKey in sharedAccounts)) {
          sharedAccounts[pairKey] = { type: "commun", balance: 0, members: [session.id, proposerId] };
        }
        if (regime === "fief_conjoint" && !(pairKey in sharedAccounts)) {
          // Déterminer qui est le dominant du fief
          let fiefDominantId = null;
          if (dominance === "proposant_dominant") fiefDominantId = proposerId;
          else if (dominance === "cible_dominante") fiefDominantId = session.id;
          else if (dominance === "epoux_dominant") fiefDominantId = null; // résolu à l'affichage selon genre
          else if (dominance === "epouse_dominante") fiefDominantId = null;
          sharedAccounts[pairKey] = { type: "fief", balance: 0, members: [session.id, proposerId], dominance, fiefDominantId };
        }

        // ── Pacte arcanique : fusion des traces magiques ──
        // Un mariage "arcane" lie l'aura de chaque conjoint vers une teinte partagée, sans
        // jamais la rejoindre complètement — association visible sans perte d'identité.
        let userMagicBond, proposerMagicBond;
        if (contractType === "arcane") {
          const { hueA, hueB } = bondMagicTraces(newCitizens[userIdx], newCitizens[proposerIdx]);
          const userLinked = [...(newCitizens[userIdx].magicBond?.linkedSpouses || [])];
          if (!userLinked.some((s) => s.id === proposerId)) userLinked.push({ id: proposerId, name: proposer.name });
          const proposerLinked = [...(newCitizens[proposerIdx].magicBond?.linkedSpouses || [])];
          if (!proposerLinked.some((s) => s.id === session.id)) proposerLinked.push({ id: session.id, name: user.name });
          userMagicBond = { hue: hueA, linkedSpouses: userLinked };
          proposerMagicBond = { hue: hueB, linkedSpouses: proposerLinked };
        }

        newCitizens[userIdx] = {
          ...newCitizens[userIdx],
          spouseId: userSpouses[0]?.id || proposerId,
          spouses: userSpouses,
          marriageProposals: (user.marriageProposals || []).filter((p) => p.fromId !== proposerId),
          ...(userMagicBond ? { magicBond: userMagicBond } : {}),
        };
        newCitizens[proposerIdx] = {
          ...newCitizens[proposerIdx],
          spouseId: proposerSpouses[0]?.id || session.id,
          spouses: proposerSpouses,
          ...(proposerMagicBond ? { magicBond: proposerMagicBond } : {}),
        };
        saveState({ ...state, citizens: newCitizens, sharedAccounts });
        const ctLabel = { sacre: "mariage sacré", feodal: "mariage féodal", serment: "serment de sang", alliance: "alliance politique", promesse: "promesse sous les étoiles", arcane: "pacte arcanique" }[contractType] || contractType;
        notify(`Par les dieux, vous êtes désormais uni(e) à ${proposer.name} par ${ctLabel}.`, "success");
      },

      onRejectMarriage: (proposerId) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const user = newCitizens[userIdx];
        newCitizens[userIdx] = {
          ...user,
          marriageProposals: (user.marriageProposals || []).filter((p) => p.fromId !== proposerId),
        };
        saveState({ ...state, citizens: newCitizens });
        notify("La proposition d'union a été déclinée.", "info");
      },

      // --- MARIAGE DES ESCLAVES (tutelle du propriétaire) ---

      onOwnerProposeMarriage: (slaveId, targetId, contractData = {}) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const slaveIdx = newCitizens.findIndex((c) => c.id === slaveId);
        const targetIdx = newCitizens.findIndex((c) => c.id === targetId);
        if (slaveIdx === -1 || targetIdx === -1) return;
        const slave = newCitizens[slaveIdx];
        const target = newCitizens[targetIdx];
        const isOwner = slave.ownerId === session.id || ["EMPEREUR","GRAND_FONC_GLOBAL"].includes(session.role);
        if (!isOwner) { notify("Vous n'êtes pas le tuteur légal de cet esclave.", "error"); return; }

        const slaveCountry = (state.countries || []).find((c) => c.id === slave.countryId);
        const structure = slaveCountry?.laws?.marriageStructure || "monogamie";
        const slaveSpouses = slave.spouses || (slave.spouseId ? [{ id: slave.spouseId }] : []);
        const targetSpouses = target.spouses || (target.spouseId ? [{ id: target.spouseId }] : []);
        if (structure === "monogamie") {
          if (slaveSpouses.length >= 1) { notify(`${slave.name} est déjà lié(e) par les vœux.`, "error"); return; }
          if (targetSpouses.length >= 1) { notify(`${target.name} est déjà lié(e) par les vœux.`, "error"); return; }
        }
        if (slaveSpouses.some((s) => s.id === targetId)) { notify("Leurs destins sont déjà liés.", "error"); return; }
        if ((target.marriageProposals || []).some((p) => p.fromId === slaveId)) { notify("Une proposition a déjà été envoyée.", "error"); return; }

        const defaultFiliation = slaveCountry?.laws?.marriageDefaultFiliation || "patrilineaire";
        newCitizens[targetIdx] = {
          ...target,
          marriageProposals: [...(target.marriageProposals || []), {
            fromId: slaveId,
            fromName: slave.name,
            timestamp: Date.now(),
            contractType: contractData.contractType || "sacre",
            regime: contractData.regime || "separation",
            dotType: "aucune",
            dot: 0,
            dominance: contractData.dominance || "egal",
            filiation: contractData.filiation || defaultFiliation,
            clauses: contractData.clauses || "",
          }],
        };
        saveState({ ...state, citizens: newCitizens });
        notify(`Proposition d'union envoyée à ${target.name} au nom de ${slave.name}.`, "success");
      },

      onOwnerAcceptMarriage: (slaveId, proposerId) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const slaveIdx = newCitizens.findIndex((c) => c.id === slaveId);
        const proposerIdx = newCitizens.findIndex((c) => c.id === proposerId);
        if (slaveIdx === -1 || proposerIdx === -1) return;
        const slave = newCitizens[slaveIdx];
        const proposer = newCitizens[proposerIdx];
        const isOwner = slave.ownerId === session.id || ["EMPEREUR","GRAND_FONC_GLOBAL"].includes(session.role);
        if (!isOwner) { notify("Vous n'êtes pas le tuteur légal de cet esclave.", "error"); return; }

        const proposal = (slave.marriageProposals || []).find((p) => p.fromId === proposerId);
        if (!proposal) return;

        const contractType = proposal.contractType || "sacre";
        const regime = proposal.regime || "separation";
        const dotType = proposal.dotType || "aucune";
        const dot = proposal.dot || 0;
        const dominance = proposal.dominance || "egal";
        const clauses = proposal.clauses || "";
        const date = Date.now();

        let filiation = proposal.filiation || "patrilineaire";
        if (dominance === "epoux_dominant" && filiation !== "bilineaire" && filiation !== "cognatique") filiation = "patrilineaire";
        else if (dominance === "epouse_dominante" && filiation !== "bilineaire" && filiation !== "cognatique") filiation = "matrilineaire";

        const dominantIdForSlave = dominance === "proposant_dominant" ? proposerId : null;
        const dominantIdForProposer = dominance === "proposant_dominant" ? proposerId : null;

        if (dot > 0 && dotType !== "aucune") {
          if (dotType === "dotal_epouse") {
            if ((newCitizens[slaveIdx].balance || 0) < dot) { notify("Trésor insuffisant pour la dot.", "error"); return; }
            newCitizens[slaveIdx] = { ...newCitizens[slaveIdx], balance: (newCitizens[slaveIdx].balance || 0) - dot };
            newCitizens[proposerIdx] = { ...newCitizens[proposerIdx], balance: (newCitizens[proposerIdx].balance || 0) + dot };
          } else if (dotType === "dotal_epoux") {
            if ((newCitizens[proposerIdx].balance || 0) < dot) { notify("Trésor du prétendant insuffisant.", "error"); return; }
            newCitizens[proposerIdx] = { ...newCitizens[proposerIdx], balance: (newCitizens[proposerIdx].balance || 0) - dot };
            newCitizens[slaveIdx] = { ...newCitizens[slaveIdx], balance: (newCitizens[slaveIdx].balance || 0) + dot };
          }
        }

        const pairKey = [slaveId, proposerId].sort().join("_");
        const spouseEntryForSlave = { id: proposerId, name: proposer.name, contractType, regime, dotType, dot, dominance, dominantId: dominantIdForSlave, filiation, clauses, date,
          ...(regime === "communaute" ? { sharedBalanceKey: pairKey } : {}),
          ...(regime === "fief_conjoint" ? { fiefBalanceKey: pairKey } : {}),
        };
        const spouseEntryForProposer = { id: slaveId, name: slave.name, contractType, regime, dotType, dot, dominance, dominantId: dominantIdForProposer, filiation, clauses, date,
          ...(regime === "communaute" ? { sharedBalanceKey: pairKey } : {}),
          ...(regime === "fief_conjoint" ? { fiefBalanceKey: pairKey } : {}),
        };

        const slaveSpouses = [...(newCitizens[slaveIdx].spouses || []), spouseEntryForSlave];
        const proposerSpouses = [...(newCitizens[proposerIdx].spouses || []), spouseEntryForProposer];

        const sharedAccounts = { ...(state.sharedAccounts || {}) };
        if (regime === "communaute" && !(pairKey in sharedAccounts))
          sharedAccounts[pairKey] = { type: "commun", balance: 0, members: [slaveId, proposerId] };
        if (regime === "fief_conjoint" && !(pairKey in sharedAccounts)) {
          const fiefDominantId = dominance === "proposant_dominant" ? proposerId : null;
          sharedAccounts[pairKey] = { type: "fief", balance: 0, members: [slaveId, proposerId], dominance, fiefDominantId };
        }

        // ── Pacte arcanique : fusion des traces magiques (voir onAcceptMarriage) ──
        let slaveMagicBond, proposerMagicBond;
        if (contractType === "arcane") {
          const { hueA, hueB } = bondMagicTraces(newCitizens[slaveIdx], newCitizens[proposerIdx]);
          const slaveLinked = [...(newCitizens[slaveIdx].magicBond?.linkedSpouses || [])];
          if (!slaveLinked.some((s) => s.id === proposerId)) slaveLinked.push({ id: proposerId, name: proposer.name });
          const proposerLinked = [...(newCitizens[proposerIdx].magicBond?.linkedSpouses || [])];
          if (!proposerLinked.some((s) => s.id === slaveId)) proposerLinked.push({ id: slaveId, name: slave.name });
          slaveMagicBond = { hue: hueA, linkedSpouses: slaveLinked };
          proposerMagicBond = { hue: hueB, linkedSpouses: proposerLinked };
        }

        newCitizens[slaveIdx] = { ...newCitizens[slaveIdx], spouseId: slaveSpouses[0]?.id || proposerId, spouses: slaveSpouses,
          marriageProposals: (slave.marriageProposals || []).filter((p) => p.fromId !== proposerId),
          ...(slaveMagicBond ? { magicBond: slaveMagicBond } : {}) };
        newCitizens[proposerIdx] = { ...newCitizens[proposerIdx], spouseId: proposerSpouses[0]?.id || slaveId, spouses: proposerSpouses,
          ...(proposerMagicBond ? { magicBond: proposerMagicBond } : {}) };
        saveState({ ...state, citizens: newCitizens, sharedAccounts });
        const ctLabel = { sacre: "mariage sacré", feodal: "mariage féodal", serment: "serment de sang", alliance: "alliance politique", promesse: "promesse sous les étoiles", arcane: "pacte arcanique" }[contractType] || contractType;
        notify(`${slave.name} est désormais uni(e) à ${proposer.name} par ${ctLabel}.`, "success");
      },

      onOwnerRejectMarriage: (slaveId, proposerId) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const slaveIdx = newCitizens.findIndex((c) => c.id === slaveId);
        if (slaveIdx === -1) return;
        const slave = newCitizens[slaveIdx];
        const isOwner = slave.ownerId === session.id || ["EMPEREUR","GRAND_FONC_GLOBAL"].includes(session.role);
        if (!isOwner) { notify("Vous n'êtes pas le tuteur légal de cet esclave.", "error"); return; }
        newCitizens[slaveIdx] = { ...slave,
          marriageProposals: (slave.marriageProposals || []).filter((p) => p.fromId !== proposerId) };
        saveState({ ...state, citizens: newCitizens });
        notify(`Proposition déclinée au nom de ${slave.name}.`, "info");
      },

      onOwnerBreakMarriage: (slaveId, spouseId) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const slaveIdx = newCitizens.findIndex((c) => c.id === slaveId);
        if (slaveIdx === -1) return;
        const slave = newCitizens[slaveIdx];
        const isOwner = slave.ownerId === session.id || ["EMPEREUR","GRAND_FONC_GLOBAL"].includes(session.role);
        if (!isOwner) { notify("Vous n'êtes pas le tuteur légal de cet esclave.", "error"); return; }

        const spouseIdx = newCitizens.findIndex((c) => c.id === spouseId);
        const spouseEntry = (slave.spouses || []).find((s) => s.id === spouseId);
        const pairKey = spouseEntry?.sharedBalanceKey || spouseEntry?.fiefBalanceKey;

        const endedAt = Date.now();
        const newSlaveSpouses = (slave.spouses || []).filter((s) => s.id !== spouseId);
        newCitizens[slaveIdx] = {
          ...slave,
          spouseId: newSlaveSpouses[0]?.id || null,
          spouses: newSlaveSpouses,
          marriageHistory: spouseEntry
            ? [{ ...spouseEntry, endedAt, endReason: "tutelle" }, ...(slave.marriageHistory || [])]
            : (slave.marriageHistory || []),
        };
        if (spouseIdx !== -1) {
          const spouse = newCitizens[spouseIdx];
          const theirEntry = (spouse.spouses || []).find((s) => s.id === slaveId);
          const newSpouseSpouses = (spouse.spouses || []).filter((s) => s.id !== slaveId);
          newCitizens[spouseIdx] = {
            ...spouse,
            spouseId: newSpouseSpouses[0]?.id || null,
            spouses: newSpouseSpouses,
            marriageHistory: theirEntry
              ? [{ ...theirEntry, endedAt, endReason: "tutelle" }, ...(spouse.marriageHistory || [])]
              : (spouse.marriageHistory || []),
          };
        }

        const sharedAccounts = { ...(state.sharedAccounts || {}) };
        if (pairKey && sharedAccounts[pairKey]) {
          const remaining = sharedAccounts[pairKey].balance || 0;
          if (remaining > 0) {
            const half = Math.floor(remaining / 2);
            newCitizens[slaveIdx] = { ...newCitizens[slaveIdx], balance: (newCitizens[slaveIdx].balance || 0) + half };
            if (spouseIdx !== -1) newCitizens[spouseIdx] = { ...newCitizens[spouseIdx], balance: (newCitizens[spouseIdx].balance || 0) + (remaining - half) };
          }
          delete sharedAccounts[pairKey];
        }
        saveState({ ...state, citizens: newCitizens, sharedAccounts });
        notify(`L'union de ${slave.name} a été rompue par décision tutoriale.`, "info");
      },

      onDivorce: (spouseId) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const user = newCitizens[userIdx];
        const targetSpouseId = spouseId || user.spouseId;
        if (!targetSpouseId) { notify("Vous n'êtes lié(e) à personne.", "error"); return; }

        // Récupérer la clé du compte commun avant de supprimer le lien
        const spouseEntry = (user.spouses || []).find((s) => s.id === targetSpouseId);
        const pairKey = spouseEntry?.sharedBalanceKey || spouseEntry?.fiefBalanceKey;

        if (spouseEntry && MARRIAGE_INDISSOLUBLE_TYPES.includes(spouseEntry.contractType)) {
          notify("Cette union est indissoluble par ces vœux — seule la mort peut y mettre fin.", "error");
          return;
        }

        if (!window.confirm("Rompre cette union ? Les vœux seront brisés de manière irréversible.")) return;
        const spouseIdx = newCitizens.findIndex((c) => c.id === targetSpouseId);

        // Archiver l'union rompue dans le registre matrimonial des deux ex-époux
        const endedAt = Date.now();
        const newUserSpouses = (user.spouses || []).filter((s) => s.id !== targetSpouseId);
        newCitizens[userIdx] = {
          ...user,
          spouseId: newUserSpouses[0]?.id || null,
          spouses: newUserSpouses,
          marriageHistory: spouseEntry
            ? [{ ...spouseEntry, endedAt, endReason: "divorce" }, ...(user.marriageHistory || [])]
            : (user.marriageHistory || []),
        };
        if (spouseIdx !== -1) {
          const spouse = newCitizens[spouseIdx];
          const theirEntry = (spouse.spouses || []).find((s) => s.id === session.id);
          const newSpouseSpouses = (spouse.spouses || []).filter((s) => s.id !== session.id);
          newCitizens[spouseIdx] = {
            ...spouse,
            spouseId: newSpouseSpouses[0]?.id || null,
            spouses: newSpouseSpouses,
            marriageHistory: theirEntry
              ? [{ ...theirEntry, endedAt, endReason: "divorce" }, ...(spouse.marriageHistory || [])]
              : (spouse.marriageHistory || []),
          };
        }

        // Dissoudre le compte commun / fief si personne d'autre ne partage cette clé
        const sharedAccounts = { ...(state.sharedAccounts || {}) };
        if (pairKey && sharedAccounts[pairKey]) {
          const remaining = sharedAccounts[pairKey].balance || 0;
          if (remaining > 0) {
            // Redistribuer équitablement le solde restant aux deux ex-époux
            const half = Math.floor(remaining / 2);
            newCitizens[userIdx] = { ...newCitizens[userIdx], balance: (newCitizens[userIdx].balance || 0) + half };
            if (spouseIdx !== -1) {
              newCitizens[spouseIdx] = { ...newCitizens[spouseIdx], balance: (newCitizens[spouseIdx].balance || 0) + (remaining - half) };
            }
          }
          delete sharedAccounts[pairKey];
        }

        saveState({ ...state, citizens: newCitizens, sharedAccounts });
        notify("L'union a été rompue. Les vœux sont brisés.", "info");
      },

      // Droits restreints par le conjoint dominant (voyage/Mushtagram/banque/marché) —
      // même principe que serfRights pour un employeur, mais porté par le mariage.
      // Stocké en miroir sur les deux entrées spouses[] de la paire pour rester cohérent
      // quel que soit le côté depuis lequel on le relit.
      onSetSpouseRights: ({ spouseId, rights }) => {
        if (!session) return;
        const me = (state.citizens || []).find((c) => String(c.id) === String(session.id));
        const mySpouseEntry = (me?.spouses || []).find((s) => String(s.id) === String(spouseId));
        if (!mySpouseEntry) { notify("Union introuvable.", "error"); return; }
        if (!mySpouseEntry.dominantId || String(mySpouseEntry.dominantId) !== String(session.id)) {
          notify("Seul le conjoint dominant peut définir ces droits.", "error");
          return;
        }
        const updated = (state.citizens || []).map((c) => {
          if (String(c.id) === String(session.id)) {
            return {
              ...c,
              spouses: (c.spouses || []).map((s) =>
                String(s.id) === String(spouseId) ? { ...s, spouseRights: { ...(s.spouseRights || {}), ...rights } } : s
              ),
            };
          }
          if (String(c.id) === String(spouseId)) {
            return {
              ...c,
              spouses: (c.spouses || []).map((s) =>
                String(s.id) === String(session.id) ? { ...s, spouseRights: { ...(s.spouseRights || {}), ...rights } } : s
              ),
            };
          }
          return c;
        });
        saveState({ ...state, citizens: updated });
        notify("Droits mis à jour.", "success");
      },

      // Renégociation de la domination sur une union déjà existante (ex: contractée
      // avant l'introduction de ce système, ou en "Union Égale") — nécessite l'accord
      // du conjoint, comme la proposition de mariage elle-même.
      onProposeMarriageDominance: ({ spouseId, dominance }) => {
        if (!session) return;
        if (!["egal", "proposant_dominant", "cible_dominante"].includes(dominance)) return;
        const me = (state.citizens || []).find((c) => String(c.id) === String(session.id));
        const mySpouseEntry = (me?.spouses || []).find((s) => String(s.id) === String(spouseId));
        if (!mySpouseEntry) { notify("Union introuvable.", "error"); return; }
        const pending = { proposedBy: session.id, dominance, timestamp: Date.now() };
        const updated = (state.citizens || []).map((c) => {
          if (String(c.id) === String(session.id)) {
            return { ...c, spouses: (c.spouses || []).map((s) => String(s.id) === String(spouseId) ? { ...s, pendingDominance: pending } : s) };
          }
          if (String(c.id) === String(spouseId)) {
            return { ...c, spouses: (c.spouses || []).map((s) => String(s.id) === String(session.id) ? { ...s, pendingDominance: pending } : s) };
          }
          return c;
        });
        saveState({ ...state, citizens: updated });
        notify("Proposition de domination envoyée — en attente de l'accord de votre conjoint.", "success");
      },

      onAcceptMarriageDominance: ({ spouseId }) => {
        if (!session) return;
        const me = (state.citizens || []).find((c) => String(c.id) === String(session.id));
        const mySpouseEntry = (me?.spouses || []).find((s) => String(s.id) === String(spouseId));
        const pending = mySpouseEntry?.pendingDominance;
        if (!pending) { notify("Aucune proposition en attente.", "error"); return; }
        if (String(pending.proposedBy) === String(session.id)) { notify("Vous ne pouvez pas accepter votre propre proposition.", "error"); return; }
        let dominantId = null;
        if (pending.dominance === "proposant_dominant") dominantId = pending.proposedBy;
        else if (pending.dominance === "cible_dominante") dominantId = session.id;
        const updated = (state.citizens || []).map((c) => {
          if (String(c.id) === String(session.id)) {
            return { ...c, spouses: (c.spouses || []).map((s) => String(s.id) === String(spouseId) ? { ...s, dominance: pending.dominance, dominantId, pendingDominance: null } : s) };
          }
          if (String(c.id) === String(spouseId)) {
            return { ...c, spouses: (c.spouses || []).map((s) => String(s.id) === String(session.id) ? { ...s, dominance: pending.dominance, dominantId, pendingDominance: null } : s) };
          }
          return c;
        });
        // Répercute la nouvelle domination sur le Fief Conjoint (state.sharedAccounts),
        // sans quoi son fiefDominantId reste figé sur l'ancienne valeur (souvent null)
        // et le retrait resterait bloqué même après une renégociation réussie.
        const pairKey = mySpouseEntry?.fiefBalanceKey || mySpouseEntry?.sharedBalanceKey;
        const sharedAccounts = { ...(state.sharedAccounts || {}) };
        if (pairKey && sharedAccounts[pairKey]?.type === "fief") {
          sharedAccounts[pairKey] = { ...sharedAccounts[pairKey], dominance: pending.dominance, fiefDominantId: dominantId };
        }
        saveState({ ...state, citizens: updated, sharedAccounts });
        notify("Domination de l'union mise à jour.", "success");
      },

      onRejectMarriageDominance: ({ spouseId }) => {
        if (!session) return;
        const updated = (state.citizens || []).map((c) => {
          if (String(c.id) === String(session.id)) {
            return { ...c, spouses: (c.spouses || []).map((s) => String(s.id) === String(spouseId) ? { ...s, pendingDominance: null } : s) };
          }
          if (String(c.id) === String(spouseId)) {
            return { ...c, spouses: (c.spouses || []).map((s) => String(s.id) === String(session.id) ? { ...s, pendingDominance: null } : s) };
          }
          return c;
        });
        saveState({ ...state, citizens: updated });
        notify("Proposition de domination refusée.", "info");
      },

      // Réquisition d'argent par le conjoint dominant sur le trésor personnel du
      // conjoint dominé — prélèvement direct, indépendant du trésor commun.
      onRequisitionSpouseMoney: ({ spouseId, amount, reason = "" }) => {
        if (!session) return;
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) return;
        const me = (state.citizens || []).find((c) => String(c.id) === String(session.id));
        const mySpouseEntry = (me?.spouses || []).find((s) => String(s.id) === String(spouseId));
        if (!mySpouseEntry) { notify("Union introuvable.", "error"); return; }
        if (!mySpouseEntry.dominantId || String(mySpouseEntry.dominantId) !== String(session.id)) {
          notify("Seul le conjoint dominant peut réquisitionner de l'argent.", "error");
          return;
        }
        const spouseCitizen = (state.citizens || []).find((c) => String(c.id) === String(spouseId));
        if (!spouseCitizen) { notify("Conjoint introuvable.", "error"); return; }
        if ((spouseCitizen.balance || 0) < amt) {
          notify("Votre conjoint ne possède pas cette somme.", "error");
          return;
        }
        const tx = {
          id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          amount: amt,
          reason: String(reason || "").slice(0, 120),
          timestamp: Date.now(),
        };
        const updated = (state.citizens || []).map((c) => {
          if (String(c.id) === String(session.id)) {
            return {
              ...c,
              balance: (c.balance || 0) + amt,
              spouses: (c.spouses || []).map((s) =>
                String(s.id) === String(spouseId) ? { ...s, requisitionHistory: [tx, ...(s.requisitionHistory || [])].slice(0, 20) } : s
              ),
            };
          }
          if (String(c.id) === String(spouseId)) {
            return {
              ...c,
              balance: Math.max(0, (c.balance || 0) - amt),
              spouses: (c.spouses || []).map((s) =>
                String(s.id) === String(session.id) ? { ...s, requisitionHistory: [tx, ...(s.requisitionHistory || [])].slice(0, 20) } : s
              ),
            };
          }
          return c;
        });
        const ledgerEntry = {
          id: Date.now() + Math.random(),
          fromName: spouseCitizen.name,
          toName: session.name,
          amount: amt,
          timestamp: Date.now(),
          reason: reason ? `Réquisition conjugale — ${reason}` : "Réquisition conjugale",
          type: "SPOUSE_REQUISITION",
        };
        saveState({ ...state, citizens: updated, globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
        notify(`${formatMoney(amt)} réquisitionnés à ${spouseCitizen.name}.`, "success");
      },

      // ========== VIE DE COUPLE (cadeaux, projet commun, journal partagé) ==========
      onSendCoupleGift: (spouseId, { type, amount, itemId, quantity, message } = {}) => {
        if (!session) return;
        const me = (state.citizens || []).find((c) => String(c.id) === String(session.id));
        const mySpouseEntry = (me?.spouses || []).find((s) => String(s.id) === String(spouseId));
        if (!mySpouseEntry) { notify("Union introuvable.", "error"); return; }
        const spouseCitizen = (state.citizens || []).find((c) => String(c.id) === String(spouseId));
        if (!spouseCitizen) { notify("Conjoint introuvable.", "error"); return; }

        const newCitizens = [...state.citizens];
        const meIdx = newCitizens.findIndex((c) => String(c.id) === String(session.id));
        const spouseIdx = newCitizens.findIndex((c) => String(c.id) === String(spouseId));
        let ledgerEntry, giftDesc, itemName = null, qty = null;

        if (type === "money") {
          const amt = parseFloat(amount);
          if (!amt || amt <= 0) { notify("Montant invalide.", "error"); return; }
          if ((newCitizens[meIdx].balance || 0) < amt) { notify("Fonds insuffisants.", "error"); return; }
          newCitizens[meIdx] = { ...newCitizens[meIdx], balance: newCitizens[meIdx].balance - amt };
          newCitizens[spouseIdx] = { ...newCitizens[spouseIdx], balance: (newCitizens[spouseIdx].balance || 0) + amt };
          ledgerEntry = { id: Date.now(), fromName: me.name, toName: spouseCitizen.name, amount: amt, timestamp: Date.now(), reason: "Cadeau conjugal", type: "SPOUSE_GIFT" };
          giftDesc = formatMoney(amt);
        } else if (type === "item") {
          qty = parseInt(quantity) || 1;
          const srcInv = [...(newCitizens[meIdx].inventory || [])];
          const slotIdx = srcInv.findIndex((e) => e.itemId === itemId);
          if (slotIdx === -1 || srcInv[slotIdx].quantity < qty) { notify("Quantité insuffisante.", "error"); return; }
          if (srcInv[slotIdx].quantity === qty) srcInv.splice(slotIdx, 1);
          else srcInv[slotIdx] = { ...srcInv[slotIdx], quantity: srcInv[slotIdx].quantity - qty };
          const tgtInv = [...(newCitizens[spouseIdx].inventory || [])];
          const tgtSlot = tgtInv.findIndex((e) => e.itemId === itemId);
          if (tgtSlot !== -1) tgtInv[tgtSlot] = { ...tgtInv[tgtSlot], quantity: tgtInv[tgtSlot].quantity + qty };
          else tgtInv.push({ itemId, quantity: qty });
          newCitizens[meIdx] = { ...newCitizens[meIdx], inventory: srcInv };
          newCitizens[spouseIdx] = { ...newCitizens[spouseIdx], inventory: tgtInv };
          itemName = (state.inventoryCatalog || []).find((i) => i.id === itemId)?.name || "objet";
          ledgerEntry = { id: Date.now(), fromName: me.name, toName: spouseCitizen.name, amount: 0, timestamp: Date.now(), reason: `Cadeau conjugal : ${qty}x ${itemName}`, type: "SPOUSE_GIFT" };
          giftDesc = `${qty}x ${itemName}`;
        } else {
          notify("Type de cadeau invalide.", "error");
          return;
        }

        const pairKey = [session.id, spouseId].sort().join("_");
        const coupleGifts = { ...(state.coupleGifts || {}) };
        const giftEntry = {
          id: `gift_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          fromId: session.id, fromName: me.name,
          type, amount: type === "money" ? parseFloat(amount) : null,
          itemId: type === "item" ? itemId : null, itemName, quantity: qty,
          message: String(message || "").slice(0, 300),
          timestamp: Date.now(),
        };
        coupleGifts[pairKey] = [giftEntry, ...(coupleGifts[pairKey] || [])].slice(0, 50);

        saveState({ ...state, citizens: newCitizens, coupleGifts, globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
        notify(`Cadeau envoyé à ${spouseCitizen.name} : ${giftDesc}.`, "success");
      },

      onSetCoupleGoal: (spouseId, { title, targetAmount } = {}) => {
        if (!session) return;
        const me = (state.citizens || []).find((c) => String(c.id) === String(session.id));
        const mySpouseEntry = (me?.spouses || []).find((s) => String(s.id) === String(spouseId));
        if (!mySpouseEntry) { notify("Union introuvable.", "error"); return; }
        const amt = parseFloat(targetAmount);
        const t = String(title || "").trim();
        if (!t || !amt || amt <= 0) { notify("Objectif invalide.", "error"); return; }
        const spouseCitizen = (state.citizens || []).find((c) => String(c.id) === String(spouseId));
        const pairKey = [session.id, spouseId].sort().join("_");
        if ((state.coupleGoals || {})[pairKey]) { notify("Un projet commun est déjà en cours — retirez-le ou attendez son terme.", "error"); return; }
        const coupleGoals = { ...(state.coupleGoals || {}) };
        coupleGoals[pairKey] = {
          id: `goal_${Date.now()}`,
          title: t.slice(0, 80),
          targetAmount: amt,
          currentAmount: 0,
          contributions: [],
          createdAt: Date.now(),
          createdBy: session.id,
          completedAt: null,
        };
        saveState({ ...state, coupleGoals });
        notify(`Projet commun "${t.slice(0, 80)}" lancé avec ${spouseCitizen?.name || "votre conjoint"} !`, "success");
      },

      onContributeToCoupleGoal: (spouseId, amount) => {
        if (!session) return;
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { notify("Montant invalide.", "error"); return; }
        const me = (state.citizens || []).find((c) => String(c.id) === String(session.id));
        const mySpouseEntry = (me?.spouses || []).find((s) => String(s.id) === String(spouseId));
        if (!mySpouseEntry) { notify("Union introuvable.", "error"); return; }
        if ((me.balance || 0) < amt) { notify("Fonds insuffisants.", "error"); return; }
        const pairKey = [session.id, spouseId].sort().join("_");
        const goal = (state.coupleGoals || {})[pairKey];
        if (!goal || goal.completedAt) { notify("Aucun projet commun actif.", "error"); return; }
        const newCitizens = state.citizens.map((c) => String(c.id) === String(session.id) ? { ...c, balance: c.balance - amt } : c);
        const newCurrent = (goal.currentAmount || 0) + amt;
        const completed = newCurrent >= goal.targetAmount;
        const coupleGoals = { ...(state.coupleGoals || {}) };
        coupleGoals[pairKey] = {
          ...goal,
          currentAmount: newCurrent,
          contributions: [{ citizenId: session.id, citizenName: me.name, amount: amt, date: Date.now() }, ...(goal.contributions || [])].slice(0, 50),
          completedAt: completed ? Date.now() : null,
        };
        const ledgerEntry = { id: Date.now(), fromName: me.name, toName: `Projet commun : ${goal.title}`, amount: amt, timestamp: Date.now(), reason: `Contribution au projet "${goal.title}"`, type: "COUPLE_GOAL" };
        saveState({ ...state, citizens: newCitizens, coupleGoals, globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
        notify(completed ? `Objectif "${goal.title}" atteint !` : `${formatMoney(amt)} versés au projet "${goal.title}".`, "success");
      },

      // Retire la cagnotte du projet commun (que l'objectif soit atteint ou non) et le clôt.
      onWithdrawCoupleGoal: (spouseId) => {
        if (!session) return;
        const me = (state.citizens || []).find((c) => String(c.id) === String(session.id));
        const mySpouseEntry = (me?.spouses || []).find((s) => String(s.id) === String(spouseId));
        if (!mySpouseEntry) { notify("Union introuvable.", "error"); return; }
        const pairKey = [session.id, spouseId].sort().join("_");
        const goal = (state.coupleGoals || {})[pairKey];
        if (!goal || (goal.currentAmount || 0) <= 0) { notify("La cagnotte est vide.", "error"); return; }
        const amount = goal.currentAmount;
        const newCitizens = state.citizens.map((c) => String(c.id) === String(session.id) ? { ...c, balance: (c.balance || 0) + amount } : c);
        const coupleGoals = { ...(state.coupleGoals || {}) };
        delete coupleGoals[pairKey];
        const ledgerEntry = { id: Date.now(), fromName: `Projet commun : ${goal.title}`, toName: me.name, amount, timestamp: Date.now(), reason: `Retrait du projet "${goal.title}"`, type: "COUPLE_GOAL" };
        saveState({ ...state, citizens: newCitizens, coupleGoals, globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
        notify(`${formatMoney(amount)} retirés du projet "${goal.title}".`, "success");
      },

      onCancelCoupleGoal: (spouseId) => {
        if (!session) return;
        const me = (state.citizens || []).find((c) => String(c.id) === String(session.id));
        const mySpouseEntry = (me?.spouses || []).find((s) => String(s.id) === String(spouseId));
        if (!mySpouseEntry) { notify("Union introuvable.", "error"); return; }
        const pairKey = [session.id, spouseId].sort().join("_");
        const goal = (state.coupleGoals || {})[pairKey];
        if (!goal) return;
        if ((goal.currentAmount || 0) > 0) { notify("Retirez d'abord la cagnotte avant d'annuler le projet.", "error"); return; }
        const coupleGoals = { ...(state.coupleGoals || {}) };
        delete coupleGoals[pairKey];
        saveState({ ...state, coupleGoals });
        notify("Projet commun annulé.", "info");
      },

      onAddCoupleJournalEntry: (spouseId, text) => {
        if (!session) return;
        const t = String(text || "").trim();
        if (!t) return;
        const me = (state.citizens || []).find((c) => String(c.id) === String(session.id));
        const mySpouseEntry = (me?.spouses || []).find((s) => String(s.id) === String(spouseId));
        if (!mySpouseEntry) { notify("Union introuvable.", "error"); return; }
        const pairKey = [session.id, spouseId].sort().join("_");
        const coupleJournals = { ...(state.coupleJournals || {}) };
        const entry = { id: `journal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, authorId: session.id, authorName: me.name, text: t.slice(0, 500), timestamp: Date.now() };
        coupleJournals[pairKey] = [entry, ...(coupleJournals[pairKey] || [])].slice(0, 200);
        saveState({ ...state, coupleJournals });
        notify("Souvenir ajouté au journal.", "success");
      },

      onDeleteCoupleJournalEntry: (spouseId, entryId) => {
        if (!session) return;
        const pairKey = [session.id, spouseId].sort().join("_");
        const entries = (state.coupleJournals || {})[pairKey] || [];
        const entry = entries.find((e) => e.id === entryId);
        if (!entry || String(entry.authorId) !== String(session.id)) { notify("Vous ne pouvez retirer que vos propres souvenirs.", "error"); return; }
        const coupleJournals = { ...(state.coupleJournals || {}) };
        coupleJournals[pairKey] = entries.filter((e) => e.id !== entryId);
        saveState({ ...state, coupleJournals });
        notify("Souvenir retiré.", "info");
      },

      // Dépôt dans le trésor commun / fief
      onSharedAccountDeposit: (pairKey, amount, reason = "") => {
        if (!session) return;
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) return;
        const newCitizens = [...state.citizens];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const sharedAccounts = { ...(state.sharedAccounts || {}) };
        const account = sharedAccounts[pairKey];
        if (!account) { notify("Compte introuvable.", "error"); return; }
        if ((newCitizens[userIdx].balance || 0) < amt) { notify("Votre trésor personnel est insuffisant.", "error"); return; }
        const tx = {
          id: `satx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: "deposit",
          citizenId: session.id,
          citizenName: session.name,
          amount: amt,
          reason: String(reason || "").slice(0, 120),
          timestamp: Date.now(),
        };
        newCitizens[userIdx] = { ...newCitizens[userIdx], balance: (newCitizens[userIdx].balance || 0) - amt };
        sharedAccounts[pairKey] = {
          ...account,
          balance: (account.balance || 0) + amt,
          transactions: [tx, ...(account.transactions || [])].slice(0, 50),
        };
        saveState({ ...state, citizens: newCitizens, sharedAccounts });
        notify(`${formatMoney(amt)} versés dans ${account.type === "fief" ? "le fief conjoint" : "le trésor commun"}.`, "success");
      },

      // Retrait du trésor commun / fief (avec vérification de domination pour le fief)
      onSharedAccountWithdraw: (pairKey, amount, reason = "") => {
        if (!session) return;
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) return;
        const newCitizens = [...state.citizens];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const sharedAccounts = { ...(state.sharedAccounts || {}) };
        const account = sharedAccounts[pairKey];
        if (!account) { notify("Compte introuvable.", "error"); return; }

        // Vérification droits pour le fief : seul le dominant résolu peut retirer, sauf
        // union égale où tout le monde peut. On relit la domination depuis l'entrée
        // spouses[] du citoyen (source de vérité, toujours à jour) plutôt que depuis les
        // champs dominance/fiefDominantId du compte, qui peuvent rester figés sur une
        // ancienne valeur si la domination a été renégociée après la création du fief.
        if (account.type === "fief") {
          const otherId = (account.members || []).find((m) => String(m) !== String(session.id));
          const mySpouseEntry = (newCitizens[userIdx].spouses || []).find((s) => String(s.id) === String(otherId));
          const currentDominance = mySpouseEntry ? mySpouseEntry.dominance : account.dominance;
          const currentDominantId = mySpouseEntry ? mySpouseEntry.dominantId : account.fiefDominantId;
          if (currentDominance !== "egal") {
            if (!currentDominantId || String(currentDominantId) !== String(session.id)) {
              notify("Seul l'époux dominant peut retirer du Fief Conjoint.", "error");
              return;
            }
          }
        }

        if ((account.balance || 0) < amt) { notify("Le trésor commun ne contient pas assez de fonds.", "error"); return; }
        const tx = {
          id: `satx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: "withdraw",
          citizenId: session.id,
          citizenName: session.name,
          amount: amt,
          reason: String(reason || "").slice(0, 120),
          timestamp: Date.now(),
        };
        sharedAccounts[pairKey] = {
          ...account,
          balance: account.balance - amt,
          transactions: [tx, ...(account.transactions || [])].slice(0, 50),
        };
        newCitizens[userIdx] = { ...newCitizens[userIdx], balance: (newCitizens[userIdx].balance || 0) + amt };
        saveState({ ...state, citizens: newCitizens, sharedAccounts });
        notify(`${formatMoney(amt)} retirés ${account.type === "fief" ? "du fief conjoint" : "du trésor commun"}.`, "success");
      },

      onSelfManumit: () => {
        if (!session) return;
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;

        const citizen = state.citizens[userIdx];
        if (citizen.status !== "Esclave") {
          notify("Vous n'êtes pas esclave.", "error");
          return;
        }

        // Vérifier la loi du pays de localisation physique
        const country = (state.countries || []).find(
          (c) => c.id === (citizen.locationCountryId || citizen.countryId)
        );
        if (!country || !country.laws || !country.laws.allowSelfManumission) {
          notify(
            "L'auto-affranchissement est interdit dans ce pays.",
            "error"
          );
          return;
        }

        // Le prix est basé sur le prix de vente ou 500 par défaut
        const price = citizen.salePrice || 500;
        if ((citizen.balance || 0) < price) {
          notify(
            `Fonds insuffisants. Il faut ${formatMoney(price)} pour racheter votre liberté.`,
            "error"
          );
          return;
        }

        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = {
          ...citizen,
          balance: citizen.balance - price,
          status: "Actif",
          ownerId: null,
          isForSale: false,
          salePrice: null,
        };

        const manumitLedger = {
          id: Date.now(),
          fromName: citizen.name,
          toName: "Trésor Impérial",
          amount: price,
          timestamp: Date.now(),
          reason: "Auto-affranchissement",
          type: "MANUMISSION",
        };

        saveState({
          ...state,
          citizens: newCitizens,
          treasury: (state.treasury || 0) + price,
          globalLedger: [manumitLedger, ...(state.globalLedger || [])],
        });
        notify("Vous êtes libre !", "success");
      },
      onUpdateHouseRegistry: (reg) =>
        saveState({ ...state, maisonRegistry: reg }),
      onUpdateMaisonStaff: (staff) =>
        saveState({ ...state, maisonStaff: staff }),
      onRemoveMaisonStaff: (staffId) => {
        const newStaff = (state.maisonStaff || []).filter(
          (s) => s.id !== staffId
        );
        const newRegistry = (state.maisonRegistry || []).filter(
          (r) => r.staffId !== staffId
        );
        const newQueue = (state.maisonQueue || []).filter(
          (q) => q.staffId !== staffId
        );
        saveState({
          ...state,
          maisonStaff: newStaff,
          maisonRegistry: newRegistry,
          maisonQueue: newQueue,
        });
      },
      onSetMaisonCompany: (companyId) => {
        saveState({ ...state, maisonCompanyId: companyId || null });
        const name = companyId
          ? (state.companies || []).find((c) => c.id === companyId)?.name || "?"
          : "aucune";
        notify(`Entreprise Maison d'Asia : ${name}`, "success");
      },
      onPurgeMaison: () => {
        saveState({
          ...state,
          maisonStaff: [],
          maisonRegistry: [],
          maisonQueue: [],
        });
        notify("Maison de Asia purgée.", "info");
      },
      onSetMaisonDefaultDuration: (minutes) => {
        const val = Math.max(10, Math.min(480, parseInt(minutes) || 60));
        saveState({ ...state, maisonDefaultDuration: val });
        notify(`Durée par défaut : ${val} minutes.`, "success");
      },

      // --- FILE D'ATTENTE ---
      onJoinMaisonQueue: (staffId) => {
        if (!session) return;
        if (isMaisonLocked(session.id)) { notify("Votre accès à la Maison de Asia est restreint.", "error"); return; }
        const queue = state.maisonQueue || [];
        if (queue.some((q) => q.citizenId === session.id && q.staffId === staffId)) {
          notify("Vous êtes déjà dans la file.", "info");
          return;
        }
        if ((state.maisonRegistry || []).some((r) => r.citizenId === session.id)) {
          notify("Vous êtes déjà en compagnie.", "error");
          return;
        }
        if (queue.some((q) => q.citizenId === session.id)) {
          notify("Vous êtes déjà dans une autre file.", "error");
          return;
        }
        const newEntry = { citizenId: session.id, staffId, joinedAt: Date.now(), position: 0 };
        const staffQueue = queue.filter((q) => q.staffId === staffId);
        const otherQueue = queue.filter((q) => q.staffId !== staffId);
        const isVip = getMaisonVipRank(session.id, state.maisonHistory || []) !== null;

        let newStaffQueue;
        if (isVip) {
          // Insérer avant le premier non-VIP
          const firstNonVipIdx = staffQueue.findIndex(
            (q) => getMaisonVipRank(q.citizenId, state.maisonHistory || []) === null
          );
          if (firstNonVipIdx === -1) {
            newStaffQueue = [...staffQueue, newEntry];
          } else {
            newStaffQueue = [
              ...staffQueue.slice(0, firstNonVipIdx),
              newEntry,
              ...staffQueue.slice(firstNonVipIdx),
            ];
          }
        } else {
          newStaffQueue = [...staffQueue, newEntry];
        }
        // Renuméroter
        let pos = 0;
        newStaffQueue = newStaffQueue.map((q) => { pos++; return { ...q, position: pos }; });

        saveState({
          ...state,
          maisonQueue: [...otherQueue, ...newStaffQueue],
        });
        notify(isVip ? "Vous avez rejoint la file en priorité VIP." : "Vous avez rejoint la file d'attente.", "success");
      },
      onLeaveMaisonQueue: (staffId) => {
        if (!session) return;
        const filtered = (state.maisonQueue || []).filter(
          (q) => !(q.citizenId === session.id && q.staffId === staffId)
        );
        let pos = 0;
        const reindexed = filtered.map((q) => {
          if (q.staffId === staffId) {
            pos++;
            return { ...q, position: pos };
          }
          return q;
        });
        saveState({ ...state, maisonQueue: reindexed });
        notify("Vous avez quitté la file.", "info");
      },

      // --- SUPPRESSION ADMIN DE LA FILE ---
      onAdminRemoveFromQueue: (citizenId, staffId) => {
        const filtered = (state.maisonQueue || []).filter(
          (q) => !(q.citizenId === citizenId && q.staffId === staffId)
        );
        let pos = 0;
        const reindexed = filtered.map((q) => {
          if (q.staffId === staffId) {
            pos++;
            return { ...q, position: pos };
          }
          return q;
        });
        saveState({ ...state, maisonQueue: reindexed });
        notify("Client retiré de la file.", "info");
      },

      // --- AVIS ---
      onSubmitMaisonReview: (staffId, rating, comment) => {
        if (!session) return;
        const history = state.maisonHistory || [];
        const unreviewed = history.find(
          (h) => h.citizenId === session.id && h.staffId === staffId && !h.reviewed
        );
        if (!unreviewed) {
          notify("Aucune visite à noter.", "error");
          return;
        }
        const citizen = (state.citizens || []).find((c) => c.id === session.id);
        const staff = (state.maisonStaff || []).find((s) => s.id === staffId);
        const newReview = {
          id: Date.now(),
          historyId: unreviewed.id,
          citizenId: session.id,
          citizenName: citizen?.name || "Anonyme",
          citizenAvatarUrl: citizen?.avatarUrl || "",
          staffId,
          staffName: staff?.name || "Inconnue",
          rating: Math.max(1, Math.min(5, parseInt(rating) || 3)),
          comment: (comment || "").slice(0, 200),
          timestamp: Date.now(),
        };
        const updatedHistory = history.map((h) =>
          h.id === unreviewed.id ? { ...h, reviewed: true } : h
        );
        saveState({
          ...state,
          maisonReviews: [newReview, ...(state.maisonReviews || [])],
          maisonHistory: updatedHistory,
        });
        notify("Votre avis a été enregistré.", "success");
      },
      onDeleteMaisonReview: (reviewId) => {
        saveState({
          ...state,
          maisonReviews: (state.maisonReviews || []).filter((r) => r.id !== reviewId),
        });
        notify("Avis supprimé.", "info");
      },

      // --- RÉSERVATION MAISON D'ASIA ---
      onBookMaison: (staffId, serviceId = null) => {
        if (!session) return;
        const registry = state.maisonRegistry || [];
        const queue = state.maisonQueue || [];
        const history = state.maisonHistory || [];
        const defaultDur = state.maisonDefaultDuration || 60;

        // === QUITTER ===
        if (staffId === null) {
          const myBooking = registry.find((r) => r.citizenId === session.id);
          if (!myBooking) return;
          const worker = (state.maisonStaff || []).find((s) => s.id === myBooking.staffId);
          const svc = myBooking.serviceId
            ? (worker?.services || []).find((sv) => sv.id === myBooking.serviceId)
            : null;

          // Créer l'historique
          const historyEntry = {
            id: Date.now(),
            citizenId: session.id,
            citizenName: session.name,
            staffId: myBooking.staffId,
            staffName: worker?.name || "Inconnue",
            startTime: myBooking.startTime,
            endTime: Date.now(),
            duration: myBooking.duration || worker?.sessionDuration || defaultDur,
            pricePaid: myBooking.pricePaid || worker?.price || 0,
            serviceId: myBooking.serviceId || null,
            serviceName: svc?.name || null,
            discountApplied: myBooking.discountApplied || 0,
            reviewed: false,
          };

          // Retirer du registre
          let newRegistry = registry.filter((r) => r.citizenId !== session.id);
          let newQueue = [...queue];
          let newCitizens = [...state.citizens];
          let newCompanies = [...(state.companies || [])];
          let newCountries = [...(state.countries || [])];
          let newLedger = [...(state.globalLedger || [])];
          let newTreasury = state.treasury || 0;

          // Auto-réserver le prochain dans la queue
          if (worker) {
            const staffQueue = newQueue
              .filter((q) => q.staffId === myBooking.staffId)
              .sort((a, b) => a.joinedAt - b.joinedAt);

            if (staffQueue.length > 0) {
              const next = staffQueue[0];
              const nextIdx = newCitizens.findIndex((c) => c.id === next.citizenId);

              if (nextIdx !== -1 && newCitizens[nextIdx].balance >= (worker.price || 0)) {
                const price = worker.price || 0;
                // Déduire du client d'abord
                newCitizens[nextIdx] = {
                  ...newCitizens[nextIdx],
                  balance: newCitizens[nextIdx].balance - price,
                };
                // Distribuer aux bénéficiaires via le helper
                const qP = applyMaisonPayment(
                  worker, price,
                  newCitizens, newCompanies, state.countries || [],
                  newTreasury, state.jobContracts, state.maisonCompanyId
                );
                newCitizens.splice(0, newCitizens.length, ...qP.newCitizens);
                newCompanies.splice(0, newCompanies.length, ...qP.updatedCompanies);
                newCountries.splice(0, newCountries.length, ...qP.updatedCountries);
                newTreasury = qP.newTreasury;

                newRegistry.push({
                  citizenId: next.citizenId,
                  staffId: worker.id,
                  startTime: Date.now(),
                  duration: worker.sessionDuration || defaultDur,
                  pricePaid: price,
                });

                newLedger = [
                  {
                    id: Date.now() + 1,
                    fromName: newCitizens[nextIdx].name,
                    toName: qP.toName,
                    amount: price,
                    timestamp: Date.now(),
                    reason: `Réservation Maison d'Asia — ${worker.name} (file d'attente)`,
                    type: "MAISON",
                  },
                  ...newLedger,
                ];
              }
              // Retirer de la queue
              newQueue = newQueue.filter(
                (q) => !(q.citizenId === next.citizenId && q.staffId === next.staffId)
              );
              // Re-indexer
              let pos = 0;
              newQueue = newQueue.map((q) => {
                if (q.staffId === myBooking.staffId) {
                  pos++;
                  return { ...q, position: pos };
                }
                return q;
              });
            }
          }

          saveState({
            ...state,
            maisonRegistry: newRegistry,
            maisonHistory: [historyEntry, ...history],
            maisonQueue: newQueue,
            citizens: newCitizens,
            companies: newCompanies,
            countries: newCountries,
            treasury: newTreasury,
            globalLedger: newLedger,
          });
          notify("Vous avez quitté la Maison.", "info");
          return;
        }

        // === RÉSERVER ===
        if (isMaisonLocked(session.id)) { notify("Votre accès à la Maison de Asia est restreint.", "error"); return; }
        const worker = (state.maisonStaff || []).find((s) => s.id === staffId);
        if (!worker) { notify("Personnel introuvable.", "error"); return; }
        if (worker.isAvailable === false) {
          notify("Ce membre du personnel n'est pas disponible.", "error"); return;
        }
        if (registry.some((r) => r.staffId === staffId)) {
          notify("Cette personne est déjà occupée.", "error"); return;
        }
        if (registry.some((r) => r.citizenId === session.id)) {
          notify("Vous êtes déjà en compagnie.", "error"); return;
        }

        // Résoudre service et prix
        const svcBooked = serviceId ? (worker.services || []).find((sv) => sv.id === serviceId) : null;
        const basePrice = svcBooked ? (svcBooked.price || 0) : (worker.price || 0);
        const svcDuration = svcBooked?.duration || worker.sessionDuration || defaultDur;

        // Calculer remise
        const discountPct = computeMaisonDiscount(session.id, staffId, history, state.maisonSubscriptions || []);
        const price = Math.max(0, Math.round(basePrice * (1 - discountPct / 100)));

        const clientIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (clientIdx === -1) return;
        if (state.citizens[clientIdx].balance < price) {
          notify("Fonds insuffisants.", "error"); return;
        }

        // Retirer de toute queue
        const cleanedQueue = queue.filter((q) => q.citizenId !== session.id);

        const { newCitizens, updatedCompanies, updatedCountries, newTreasury, toName } =
          applyMaisonPayment(
            worker, price,
            state.citizens, state.companies || [], state.countries || [],
            state.treasury || 0, state.jobContracts, state.maisonCompanyId
          );
        newCitizens[clientIdx] = {
          ...newCitizens[clientIdx],
          balance: newCitizens[clientIdx].balance - price,
        };

        const newEntry = {
          citizenId: session.id,
          staffId,
          startTime: Date.now(),
          duration: svcDuration,
          pricePaid: price,
          serviceId: svcBooked?.id || null,
          discountApplied: discountPct,
        };

        const maisonLedger = {
          id: Date.now(),
          fromName: session.name,
          toName,
          amount: price,
          timestamp: Date.now(),
          reason: `Réservation Maison d'Asia — ${worker.name || "Personnel"}${svcBooked ? ` (${svcBooked.name})` : ""}`,
          type: "MAISON",
        };

        saveState({
          ...state,
          citizens: newCitizens,
          maisonRegistry: [...registry, newEntry],
          maisonQueue: cleanedQueue,
          treasury: newTreasury,
          companies: updatedCompanies,
          countries: updatedCountries,
          globalLedger: [maisonLedger, ...(state.globalLedger || [])],
        });
        notify("Réservé.", "success");
      },
      onEvictMaison: (citizenId) => {
        const registry = state.maisonRegistry || [];
        const queue = state.maisonQueue || [];
        const history = state.maisonHistory || [];
        const defaultDur = state.maisonDefaultDuration || 60;
        const booking = registry.find((r) => r.citizenId === citizenId);
        if (!booking) return;
        const worker = (state.maisonStaff || []).find((s) => s.id === booking.staffId);
        const citizen = (state.citizens || []).find((c) => c.id === citizenId);

        const historyEntry = {
          id: Date.now(),
          citizenId,
          citizenName: citizen?.name || "Inconnu",
          staffId: booking.staffId,
          staffName: worker?.name || "Inconnue",
          startTime: booking.startTime,
          endTime: Date.now(),
          duration: booking.duration || worker?.sessionDuration || defaultDur,
          pricePaid: booking.pricePaid || worker?.price || 0,
          reviewed: false,
        };

        let newRegistry = registry.filter((r) => r.citizenId !== citizenId);
        let newQueue = [...queue];
        let newCitizens = [...state.citizens];
        let newCompanies = [...(state.companies || [])];
        let newCountries = [...(state.countries || [])];
        let newLedger = [...(state.globalLedger || [])];
        let newTreasury = state.treasury || 0;

        if (worker) {
          const staffQueue = newQueue
            .filter((q) => q.staffId === booking.staffId)
            .sort((a, b) => a.joinedAt - b.joinedAt);

          if (staffQueue.length > 0) {
            const next = staffQueue[0];
            const nextIdx = newCitizens.findIndex((c) => c.id === next.citizenId);

            if (nextIdx !== -1 && newCitizens[nextIdx].balance >= (worker.price || 0)) {
              const price = worker.price || 0;
              newCitizens[nextIdx] = {
                ...newCitizens[nextIdx],
                balance: newCitizens[nextIdx].balance - price,
              };
              const evictQP = applyMaisonPayment(
                worker, price,
                newCitizens, newCompanies, newCountries,
                newTreasury, state.jobContracts, state.maisonCompanyId
              );
              newCitizens.splice(0, newCitizens.length, ...evictQP.newCitizens);
              newCompanies.splice(0, newCompanies.length, ...evictQP.updatedCompanies);
              newCountries.splice(0, newCountries.length, ...evictQP.updatedCountries);
              newTreasury = evictQP.newTreasury;
              newRegistry.push({
                citizenId: next.citizenId,
                staffId: worker.id,
                startTime: Date.now(),
                duration: worker.sessionDuration || defaultDur,
                pricePaid: price,
              });
              newLedger = [
                {
                  id: Date.now() + 1,
                  fromName: newCitizens[nextIdx].name,
                  toName: evictQP.toName,
                  amount: price,
                  timestamp: Date.now(),
                  reason: `Réservation Maison d'Asia — ${worker.name} (file d'attente)`,
                  type: "MAISON",
                },
                ...newLedger,
              ];
            }
            newQueue = newQueue.filter(
              (q) => !(q.citizenId === next.citizenId && q.staffId === next.staffId)
            );
            let pos = 0;
            newQueue = newQueue.map((q) => {
              if (q.staffId === booking.staffId) {
                pos++;
                return { ...q, position: pos };
              }
              return q;
            });
          }
        }

        saveState({
          ...state,
          maisonRegistry: newRegistry,
          maisonHistory: [historyEntry, ...history],
          maisonQueue: newQueue,
          citizens: newCitizens,
          companies: newCompanies,
          countries: newCountries,
          treasury: newTreasury,
          globalLedger: newLedger,
        });
        notify("Client retiré (historique créé).", "info");
      },

      // --- NOUVELLES ACTIONS MAISON D'ASIA ---

      onToggleMaisonStaffAvailability: (staffId) => {
        const newStaff = (state.maisonStaff || []).map((s) =>
          s.id === staffId ? { ...s, isAvailable: s.isAvailable === false ? true : false } : s
        );
        const member = newStaff.find((s) => s.id === staffId);
        saveState({ ...state, maisonStaff: newStaff });
        notify(
          member?.isAvailable === false
            ? `${member?.name} marqué(e) comme indisponible.`
            : `${member?.name} de nouveau disponible.`,
          "info"
        );
      },

      onAddMaisonService: (staffId, service) => {
        const newStaff = (state.maisonStaff || []).map((s) => {
          if (s.id !== staffId) return s;
          return {
            ...s,
            services: [...(s.services || []), { ...service, id: Date.now().toString() }],
          };
        });
        saveState({ ...state, maisonStaff: newStaff });
        notify("Service ajouté.", "success");
      },

      onUpdateMaisonService: (staffId, serviceId, updates) => {
        const newStaff = (state.maisonStaff || []).map((s) => {
          if (s.id !== staffId) return s;
          return {
            ...s,
            services: (s.services || []).map((sv) =>
              sv.id === serviceId ? { ...sv, ...updates } : sv
            ),
          };
        });
        saveState({ ...state, maisonStaff: newStaff });
        notify("Service mis à jour.", "success");
      },

      onRemoveMaisonService: (staffId, serviceId) => {
        const newStaff = (state.maisonStaff || []).map((s) => {
          if (s.id !== staffId) return s;
          return { ...s, services: (s.services || []).filter((sv) => sv.id !== serviceId) };
        });
        saveState({ ...state, maisonStaff: newStaff });
        notify("Service supprimé.", "info");
      },

      onSaveMaisonCategory: (category) => {
        const cats = state.maisonServiceCategories || [];
        let newCats;
        if (category.id && cats.some((c) => c.id === category.id)) {
          newCats = cats.map((c) => (c.id === category.id ? { ...c, ...category } : c));
        } else {
          newCats = [...cats, { ...category, id: Date.now().toString() }];
        }
        saveState({ ...state, maisonServiceCategories: newCats });
        notify("Catégorie enregistrée.", "success");
      },

      onDeleteMaisonCategory: (categoryId) => {
        const newCats = (state.maisonServiceCategories || []).filter((c) => c.id !== categoryId);
        // Désassocier la catégorie des services
        const newStaff = (state.maisonStaff || []).map((s) => ({
          ...s,
          services: (s.services || []).map((sv) =>
            sv.categoryId === categoryId ? { ...sv, categoryId: null } : sv
          ),
        }));
        saveState({ ...state, maisonServiceCategories: newCats, maisonStaff: newStaff });
        notify("Catégorie supprimée.", "info");
      },

      onBuyMaisonSubscription: () => {
        if (!session) return;
        if (isMaisonLocked(session.id)) { notify("Votre accès à la Maison de Asia est restreint.", "error"); return; }
        const price = state.maisonSubscriptionPrice || 50;
        const citizenIdx = (state.citizens || []).findIndex((c) => c.id === session.id);
        if (citizenIdx === -1) return;
        if (state.citizens[citizenIdx].balance < price) {
          notify("Fonds insuffisants pour l'abonnement.", "error");
          return;
        }
        const now = Date.now();
        const monthMs = 30 * 24 * 3600 * 1000;
        const subs = state.maisonSubscriptions || [];
        const existingIdx = subs.findIndex((s) => s.citizenId === session.id);
        let newSubs;
        if (existingIdx !== -1 && subs[existingIdx].expiresAt > now) {
          // Prolonger
          newSubs = subs.map((s, i) =>
            i === existingIdx ? { ...s, expiresAt: s.expiresAt + monthMs } : s
          );
        } else if (existingIdx !== -1) {
          // Renouveler
          newSubs = subs.map((s, i) =>
            i === existingIdx ? { ...s, purchasedAt: now, expiresAt: now + monthMs } : s
          );
        } else {
          newSubs = [...subs, { citizenId: session.id, purchasedAt: now, expiresAt: now + monthMs }];
        }
        const newCitizens = [...state.citizens];
        newCitizens[citizenIdx] = { ...newCitizens[citizenIdx], balance: newCitizens[citizenIdx].balance - price };
        const ledgerEntry = {
          id: now,
          fromName: session.name,
          toName: "Maison de Asia",
          amount: price,
          timestamp: now,
          reason: "Abonnement mensuel Maison de Asia",
          type: "MAISON_SUBSCRIPTION",
        };
        saveState({
          ...state,
          citizens: newCitizens,
          maisonSubscriptions: newSubs,
          globalLedger: [ledgerEntry, ...(state.globalLedger || [])],
        });
        notify("Abonnement activé pour 30 jours.", "success");
      },

      onSetMaisonSubscriptionPrice: (price) => {
        const val = Math.max(1, parseFloat(price) || 50);
        saveState({ ...state, maisonSubscriptionPrice: val });
        notify(`Prix d'abonnement : ${val} Écus.`, "success");
      },

      onProposeDebt: (targetId, amount, interest, reason) => {
        if (!session) return;
        const val = parseFloat(amount);
        const rate = parseFloat(interest) || 0;
        if (!val || val <= 0) {
          notify("Montant invalide.", "error");
          return;
        }
        if (!targetId || targetId === session.id) {
          notify("Débiteur invalide.", "error");
          return;
        }

        const newDebt = {
          id: Date.now(),
          creditorId: session.id,
          debtorId: targetId,
          amount: val,
          interest: rate,
          total: Math.round(val * (1 + rate / 100)),
          reason: reason || "",
          status: "PENDING",
          createdAt: Date.now(),
        };

        saveState({
          ...state,
          debtRegistry: [newDebt, ...(state.debtRegistry || [])],
        });
        notify("Contrat de dette proposé.", "success");
      },
      onSignDebt: (debtId) => {
        if (!session) return;
        const registry = [...(state.debtRegistry || [])];
        const idx = registry.findIndex((d) => d.id === debtId);
        if (idx === -1) return;

        const debt = registry[idx];
        if (debt.debtorId !== session.id) {
          notify("Seul le débiteur peut signer.", "error");
          return;
        }
        const me = (state.citizens || []).find((c) => c.id === session.id);
        if (me?.guardianship?.active && me.guardianship.rights?.creditLocked) {
          notify("Votre tuteur a interdit la souscription d'emprunts.", "error");
          return;
        }
        if (debt.status !== "PENDING") {
          notify("Ce contrat n'est plus en attente.", "error");
          return;
        }

        registry[idx] = { ...debt, status: "ACTIVE", signedAt: Date.now() };
        saveState({ ...state, debtRegistry: registry });
        notify("Contrat signé. La dette est active.", "success");
      },
      onPayDebt: (debtId) => {
        if (!session) return;
        const registry = [...(state.debtRegistry || [])];
        const idx = registry.findIndex((d) => d.id === debtId);
        if (idx === -1) return;

        const debt = registry[idx];
        if (debt.debtorId !== session.id) {
          notify("Seul le débiteur peut rembourser.", "error");
          return;
        }
        if (debt.status !== "ACTIVE") {
          notify("Cette dette n'est pas active.", "error");
          return;
        }

        const debtorIdx = state.citizens.findIndex(
          (c) => c.id === debt.debtorId
        );
        const creditorIdx = state.citizens.findIndex(
          (c) => c.id === debt.creditorId
        );
        if (debtorIdx === -1 || creditorIdx === -1) return;

        const total = debt.total || debt.amount;
        if ((state.citizens[debtorIdx].balance || 0) < total) {
          notify(
            `Fonds insuffisants. Il faut ${formatMoney(total)}.`,
            "error"
          );
          return;
        }

        const newCitizens = [...state.citizens];
        newCitizens[debtorIdx] = {
          ...newCitizens[debtorIdx],
          balance: newCitizens[debtorIdx].balance - total,
        };
        newCitizens[creditorIdx] = {
          ...newCitizens[creditorIdx],
          balance: (newCitizens[creditorIdx].balance || 0) + total,
        };

        registry[idx] = { ...debt, status: "PAID", paidAt: Date.now() };

        const debtLedger = {
          id: Date.now(),
          fromName: newCitizens[debtorIdx].name,
          toName: newCitizens[creditorIdx].name,
          amount: total,
          timestamp: Date.now(),
          reason: `Remboursement dette${debt.reason ? " — " + debt.reason : ""}`,
          type: "DEBT_PAYMENT",
        };

        saveState({
          ...state,
          citizens: newCitizens,
          debtRegistry: registry,
          globalLedger: [debtLedger, ...(state.globalLedger || [])],
        });
        notify(`Dette remboursée (${formatMoney(total)}).`, "success");
      },
      onCancelDebt: (debtId) => {
        if (!session) return;
        const registry = [...(state.debtRegistry || [])];
        const idx = registry.findIndex((d) => d.id === debtId);
        if (idx === -1) return;

        const debt = registry[idx];
        // Le créancier peut annuler à tout moment, le débiteur seulement si PENDING
        const isCreditor = debt.creditorId === session.id;
        const isDebtor = debt.debtorId === session.id;

        if (!isCreditor && !isDebtor) {
          notify("Vous n'êtes pas partie de ce contrat.", "error");
          return;
        }
        if (isDebtor && debt.status !== "PENDING") {
          notify(
            "Impossible d'annuler une dette déjà signée.",
            "error"
          );
          return;
        }

        registry[idx] = {
          ...debt,
          status: "CANCELLED",
          cancelledAt: Date.now(),
        };
        saveState({ ...state, debtRegistry: registry });
        notify("Contrat annulé.", "info");
      },

      // ── ENFANTS & DESCENDANCE ────────────────────────────────────────────────

      onDeclareChild: (childData) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;

        const user = newCitizens[userIdx];
        const userCountry = (state.countries || []).find((c) => c.id === user.countryId);
        const requireApproval = !!userCountry?.laws?.requireChildApproval;

        const child = {
          id: Date.now().toString(),
          name: childData.name || "Enfant",
          citizenId: childData.citizenId || null,
          birthDate: childData.birthDate || null,
          filiation: childData.filiation || "patrilineaire",
          otherParentId: childData.otherParentId || null,
          notes: childData.notes || "",
          declaredAt: Date.now(),
        };

        if (requireApproval) {
          // Ajouter en file d'attente pour validation admin
          const pending = {
            id: child.id,
            requestedBy: session.id,
            requestedByName: user.name,
            countryId: user.countryId,
            childData: child,
            requestedAt: Date.now(),
          };
          const pendingChildren = [...(state.pendingChildren || []), pending];
          saveState({ ...state, pendingChildren });
          notify(`Déclaration de ${child.name} soumise — en attente de validation.`, "info");
          return;
        }

        // Ajout direct (pas d'approbation requise)
        newCitizens[userIdx] = {
          ...user,
          children: [...(user.children || []), child],
        };

        // Ajouter aussi chez l'autre parent s'il est un citoyen connu
        if (childData.otherParentId) {
          const otherIdx = newCitizens.findIndex((c) => c.id === childData.otherParentId);
          if (otherIdx !== -1) {
            const other = newCitizens[otherIdx];
            const alreadyThere = (other.children || []).some((ch) => ch.id === child.id);
            if (!alreadyThere) {
              newCitizens[otherIdx] = {
                ...other,
                children: [...(other.children || []), { ...child, otherParentId: session.id }],
              };
            }
          }
        }

        // Mettre à jour fatherId/motherId sur l'enfant citoyen s'il est lié
        if (childData.citizenId) {
          const childIdx = newCitizens.findIndex((c) => c.id === childData.citizenId);
          if (childIdx !== -1) {
            const childCitizen = newCitizens[childIdx];
            const parentUpdates = {};
            // Déterminer le sexe du déclarant pour savoir si c'est père ou mère
            const declarantSex = user.sex || user.gender;
            const otherParent = childData.otherParentId ? newCitizens.find((c) => c.id === childData.otherParentId) : null;
            if (declarantSex === "F" || declarantSex === "female" || declarantSex === "Femme") {
              parentUpdates.motherId = session.id;
              parentUpdates.motherName = user.name;
              if (otherParent) { parentUpdates.fatherId = otherParent.id; parentUpdates.fatherName = otherParent.name; }
            } else {
              parentUpdates.fatherId = session.id;
              parentUpdates.fatherName = user.name;
              if (otherParent) { parentUpdates.motherId = otherParent.id; parentUpdates.motherName = otherParent.name; }
            }
            newCitizens[childIdx] = { ...childCitizen, ...parentUpdates };
          }
        }

        saveState({ ...state, citizens: newCitizens });
        notify(`${child.name} a été déclaré(e) comme enfant.`, "success");
      },

      // Convertit un enfant déclaré en NPC (children[] sans citizenId) en un véritable
      // compte citoyen jouable — même schéma de création qu'un compte créé par le MJ
      // (id EMP-xxx-XXX, mot de passe généré), avec fatherId/motherId déjà renseignés.
      // Renvoie {id, name, password} pour affichage à l'appelant, ou null en cas d'échec.
      onConvertChildToCitizen: (childId) => {
        if (!session) return null;
        const newCitizens = [...state.citizens];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return null;
        const user = newCitizens[userIdx];
        const child = (user.children || []).find((ch) => ch.id === childId);
        if (!child) { notify("Enfant introuvable.", "error"); return null; }
        if (child.citizenId) { notify(`${child.name} possède déjà un compte.`, "error"); return null; }

        const num = String(newCitizens.length + 1).padStart(3, "0");
        const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
        const newId = `EMP-${num}-${rand}`;
        const passChars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        let password = "";
        for (let i = 0; i < 8; i++) password += passChars[Math.floor(Math.random() * passChars.length)];

        const nameParts = (child.name || "Enfant").trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || nameParts[0];

        const otherParent = child.otherParentId ? newCitizens.find((c) => c.id === child.otherParentId) : null;
        const declarantSex = user.sex || user.gender;
        const parentFields = {};
        if (declarantSex === "F" || declarantSex === "female" || declarantSex === "Femme") {
          parentFields.motherId = user.id; parentFields.motherName = user.name;
          if (otherParent) { parentFields.fatherId = otherParent.id; parentFields.fatherName = otherParent.name; }
        } else {
          parentFields.fatherId = user.id; parentFields.fatherName = user.name;
          if (otherParent) { parentFields.motherId = otherParent.id; parentFields.motherName = otherParent.name; }
        }

        const newCitizen = {
          id: newId,
          firstName, lastName, name: child.name || `${firstName} ${lastName}`.trim(),
          birthDate: child.birthDate || null,
          role: "CITOYEN",
          countryId: user.countryId, locationCountryId: user.countryId,
          password, balance: 100,
          occupation: "Citoyen", status: "Actif",
          bio: "", avatarUrl: "", inventory: [], messages: [],
          currentPosition: "", motto: "", title: "", religion: "", origin: "",
          ...parentFields,
        };

        newCitizens[userIdx] = {
          ...user,
          children: (user.children || []).map((ch) => ch.id === childId ? { ...ch, citizenId: newId } : ch),
        };
        if (child.otherParentId) {
          const otherIdx = newCitizens.findIndex((c) => c.id === child.otherParentId);
          if (otherIdx !== -1) {
            newCitizens[otherIdx] = {
              ...newCitizens[otherIdx],
              children: (newCitizens[otherIdx].children || []).map((ch) => ch.id === childId ? { ...ch, citizenId: newId } : ch),
            };
          }
        }

        newCitizens.push(newCitizen);
        saveState({ ...state, citizens: newCitizens });
        notify(`${newCitizen.name} dispose désormais d'un compte jouable.`, "success");
        return { id: newId, name: newCitizen.name, password };
      },

      // Le nom et la date de naissance d'un enfant NPC (sans citizenId) restent
      // modifiables tant qu'il n'a pas de compte joué — une fois converti en citoyen,
      // ces informations se gèrent directement sur sa fiche.
      onUpdateChildInfo: (childId, { name, birthDate }) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const user = newCitizens[userIdx];
        const child = (user.children || []).find((ch) => ch.id === childId);
        if (!child) { notify("Enfant introuvable.", "error"); return; }
        if (child.citizenId) { notify("Cet enfant a déjà un compte — modifiez sa fiche de citoyen directement.", "error"); return; }

        const updates = {};
        if (name !== undefined) updates.name = String(name).trim() || child.name;
        if (birthDate !== undefined) updates.birthDate = birthDate;

        newCitizens[userIdx] = {
          ...user,
          children: (user.children || []).map((ch) => ch.id === childId ? { ...ch, ...updates } : ch),
        };
        if (child.otherParentId) {
          const otherIdx = newCitizens.findIndex((c) => c.id === child.otherParentId);
          if (otherIdx !== -1) {
            newCitizens[otherIdx] = {
              ...newCitizens[otherIdx],
              children: (newCitizens[otherIdx].children || []).map((ch) => ch.id === childId ? { ...ch, ...updates } : ch),
            };
          }
        }
        saveState({ ...state, citizens: newCitizens });
        notify("Fiche de l'enfant mise à jour.", "success");
      },

      onRemoveChild: (childId) => {
        if (!session) return;
        if (!window.confirm("Supprimer ce lien de filiation ? Cette action est irréversible.")) return;

        const newCitizens = [...state.citizens];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;

        const user = newCitizens[userIdx];
        const child = (user.children || []).find((ch) => ch.id === childId);
        newCitizens[userIdx] = {
          ...user,
          children: (user.children || []).filter((ch) => ch.id !== childId),
        };

        // Retirer aussi chez l'autre parent
        if (child?.otherParentId) {
          const otherIdx = newCitizens.findIndex((c) => c.id === child.otherParentId);
          if (otherIdx !== -1) {
            const other = newCitizens[otherIdx];
            newCitizens[otherIdx] = {
              ...other,
              children: (other.children || []).filter((ch) => ch.id !== childId),
            };
          }
        }

        saveState({ ...state, citizens: newCitizens });
        notify("Lien de filiation supprimé.", "info");
      },

      // Tutelle parentale : condition activable unilatéralement par un parent (père ou mère
      // reconnu) sur son enfant devenu citoyen, même adulte — contrairement au mariage, pas
      // besoin d'accord de l'enfant, l'autorité parentale est de fait tant que le lien existe.
      onSetChildGuardianship: (childCitizenId, active) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const childIdx = newCitizens.findIndex((c) => c.id === childCitizenId);
        if (childIdx === -1) { notify("Enfant introuvable.", "error"); return; }
        const child = newCitizens[childIdx];
        const isParent = String(child.fatherId) === String(session.id) || String(child.motherId) === String(session.id);
        if (!isParent) { notify("Vous n'êtes pas reconnu(e) comme parent de ce citoyen.", "error"); return; }

        newCitizens[childIdx] = active
          ? { ...child, guardianship: { guardianId: session.id, guardianName: session.name, active: true, rights: child.guardianship?.guardianId === session.id ? (child.guardianship.rights || {}) : {}, since: Date.now() } }
          : { ...child, guardianship: null };

        saveState({ ...state, citizens: newCitizens });
        notify(active ? `Tutelle établie sur ${child.name}.` : `Tutelle levée sur ${child.name}.`, active ? "success" : "info");
      },

      onSetChildRights: ({ childId, rights }) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const childIdx = newCitizens.findIndex((c) => c.id === childId);
        if (childIdx === -1) { notify("Enfant introuvable.", "error"); return; }
        const child = newCitizens[childIdx];
        if (!child.guardianship?.active || String(child.guardianship.guardianId) !== String(session.id)) {
          notify("Vous n'exercez pas de tutelle active sur ce citoyen.", "error");
          return;
        }
        newCitizens[childIdx] = {
          ...child,
          guardianship: { ...child.guardianship, rights: { ...(child.guardianship.rights || {}), ...rights } },
        };
        saveState({ ...state, citizens: newCitizens });
        notify("Droits de tutelle mis à jour.", "success");
      },

      // --- MARIAGE ARRANGÉ (au nom d'un enfant sous tutelle active) ---
      // Même principe que le mariage arrangé pour un esclave (tutelle du propriétaire),
      // mais l'autorisation repose sur une tutelle parentale active plutôt que la propriété.

      onGuardianProposeMarriage: (childId, targetId, contractData = {}) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const childIdx = newCitizens.findIndex((c) => c.id === childId);
        const targetIdx = newCitizens.findIndex((c) => c.id === targetId);
        if (childIdx === -1 || targetIdx === -1) return;
        const child = newCitizens[childIdx];
        const target = newCitizens[targetIdx];
        if (!child.guardianship?.active || String(child.guardianship.guardianId) !== String(session.id)) {
          notify("Vous n'exercez pas de tutelle active sur ce citoyen.", "error");
          return;
        }

        const childCountry = (state.countries || []).find((c) => c.id === child.countryId);
        const structure = childCountry?.laws?.marriageStructure || "monogamie";
        const childSpouses = child.spouses || (child.spouseId ? [{ id: child.spouseId }] : []);
        const targetSpouses = target.spouses || (target.spouseId ? [{ id: target.spouseId }] : []);
        if (structure === "monogamie") {
          if (childSpouses.length >= 1) { notify(`${child.name} est déjà lié(e) par les vœux.`, "error"); return; }
          if (targetSpouses.length >= 1) { notify(`${target.name} est déjà lié(e) par les vœux.`, "error"); return; }
        }
        if (childSpouses.some((s) => s.id === targetId)) { notify("Leurs destins sont déjà liés.", "error"); return; }
        if ((target.marriageProposals || []).some((p) => p.fromId === childId)) { notify("Une proposition a déjà été envoyée.", "error"); return; }

        const defaultFiliation = childCountry?.laws?.marriageDefaultFiliation || "patrilineaire";
        newCitizens[targetIdx] = {
          ...target,
          marriageProposals: [...(target.marriageProposals || []), {
            fromId: childId,
            fromName: child.name,
            timestamp: Date.now(),
            contractType: contractData.contractType || "sacre",
            regime: contractData.regime || "separation",
            dotType: contractData.dotType || "aucune",
            dot: contractData.dot || 0,
            dominance: contractData.dominance || "egal",
            filiation: contractData.filiation || defaultFiliation,
            clauses: contractData.clauses || "",
          }],
        };
        saveState({ ...state, citizens: newCitizens });
        notify(`Proposition d'union envoyée à ${target.name} au nom de ${child.name}.`, "success");
      },

      onGuardianAcceptMarriage: (childId, proposerId) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const childIdx = newCitizens.findIndex((c) => c.id === childId);
        const proposerIdx = newCitizens.findIndex((c) => c.id === proposerId);
        if (childIdx === -1 || proposerIdx === -1) return;
        const child = newCitizens[childIdx];
        const proposer = newCitizens[proposerIdx];
        if (!child.guardianship?.active || String(child.guardianship.guardianId) !== String(session.id)) {
          notify("Vous n'exercez pas de tutelle active sur ce citoyen.", "error");
          return;
        }

        const proposal = (child.marriageProposals || []).find((p) => p.fromId === proposerId);
        if (!proposal) return;

        const contractType = proposal.contractType || "sacre";
        const regime = proposal.regime || "separation";
        const dotType = proposal.dotType || "aucune";
        const dot = proposal.dot || 0;
        const dominance = proposal.dominance || "egal";
        const clauses = proposal.clauses || "";
        const date = Date.now();

        let filiation = proposal.filiation || "patrilineaire";
        if (dominance === "epoux_dominant" && filiation !== "bilineaire" && filiation !== "cognatique") filiation = "patrilineaire";
        else if (dominance === "epouse_dominante" && filiation !== "bilineaire" && filiation !== "cognatique") filiation = "matrilineaire";

        let dominantIdForChild = null;
        let dominantIdForProposer = null;
        if (dominance === "proposant_dominant") {
          dominantIdForChild = proposerId;
          dominantIdForProposer = proposerId;
        } else if (dominance === "cible_dominante") {
          dominantIdForChild = childId;
          dominantIdForProposer = childId;
        }

        if (dot > 0 && dotType !== "aucune") {
          if (dotType === "dotal_epouse") {
            if ((newCitizens[childIdx].balance || 0) < dot) { notify("Trésor insuffisant pour honorer la dot.", "error"); return; }
            newCitizens[childIdx] = { ...newCitizens[childIdx], balance: (newCitizens[childIdx].balance || 0) - dot };
            newCitizens[proposerIdx] = { ...newCitizens[proposerIdx], balance: (newCitizens[proposerIdx].balance || 0) + dot };
          } else if (dotType === "dotal_epoux") {
            if ((newCitizens[proposerIdx].balance || 0) < dot) { notify("Trésor du prétendant insuffisant.", "error"); return; }
            newCitizens[proposerIdx] = { ...newCitizens[proposerIdx], balance: (newCitizens[proposerIdx].balance || 0) - dot };
            newCitizens[childIdx] = { ...newCitizens[childIdx], balance: (newCitizens[childIdx].balance || 0) + dot };
          }
        }

        const pairKey = [childId, proposerId].sort().join("_");
        const spouseEntryForChild = { id: proposerId, name: proposer.name, contractType, regime, dotType, dot, dominance, dominantId: dominantIdForChild, filiation, clauses, date,
          ...(regime === "communaute" ? { sharedBalanceKey: pairKey } : {}),
          ...(regime === "fief_conjoint" ? { fiefBalanceKey: pairKey } : {}),
        };
        const spouseEntryForProposer = { id: childId, name: child.name, contractType, regime, dotType, dot, dominance, dominantId: dominantIdForProposer, filiation, clauses, date,
          ...(regime === "communaute" ? { sharedBalanceKey: pairKey } : {}),
          ...(regime === "fief_conjoint" ? { fiefBalanceKey: pairKey } : {}),
        };

        const childSpouses = [...(newCitizens[childIdx].spouses || []), spouseEntryForChild];
        const proposerSpouses = [...(newCitizens[proposerIdx].spouses || []), spouseEntryForProposer];

        const sharedAccounts = { ...(state.sharedAccounts || {}) };
        if (regime === "communaute" && !(pairKey in sharedAccounts)) {
          sharedAccounts[pairKey] = { type: "commun", balance: 0, members: [childId, proposerId] };
        }
        if (regime === "fief_conjoint" && !(pairKey in sharedAccounts)) {
          let fiefDominantId = null;
          if (dominance === "proposant_dominant") fiefDominantId = proposerId;
          else if (dominance === "cible_dominante") fiefDominantId = childId;
          sharedAccounts[pairKey] = { type: "fief", balance: 0, members: [childId, proposerId], dominance, fiefDominantId };
        }

        // ── Pacte arcanique : fusion des traces magiques (voir onAcceptMarriage) ──
        let childMagicBond, proposerMagicBond;
        if (contractType === "arcane") {
          const { hueA, hueB } = bondMagicTraces(newCitizens[childIdx], newCitizens[proposerIdx]);
          const childLinked = [...(newCitizens[childIdx].magicBond?.linkedSpouses || [])];
          if (!childLinked.some((s) => s.id === proposerId)) childLinked.push({ id: proposerId, name: proposer.name });
          const proposerLinked = [...(newCitizens[proposerIdx].magicBond?.linkedSpouses || [])];
          if (!proposerLinked.some((s) => s.id === childId)) proposerLinked.push({ id: childId, name: child.name });
          childMagicBond = { hue: hueA, linkedSpouses: childLinked };
          proposerMagicBond = { hue: hueB, linkedSpouses: proposerLinked };
        }

        newCitizens[childIdx] = { ...newCitizens[childIdx], spouseId: childSpouses[0]?.id || proposerId, spouses: childSpouses,
          marriageProposals: (child.marriageProposals || []).filter((p) => p.fromId !== proposerId),
          ...(childMagicBond ? { magicBond: childMagicBond } : {}) };
        newCitizens[proposerIdx] = { ...newCitizens[proposerIdx], spouseId: proposerSpouses[0]?.id || childId, spouses: proposerSpouses,
          ...(proposerMagicBond ? { magicBond: proposerMagicBond } : {}) };
        saveState({ ...state, citizens: newCitizens, sharedAccounts });
        const ctLabel = { sacre: "mariage sacré", feodal: "mariage féodal", serment: "serment de sang", alliance: "alliance politique", promesse: "promesse sous les étoiles", arcane: "pacte arcanique" }[contractType] || contractType;
        notify(`${child.name} est désormais uni(e) à ${proposer.name} par ${ctLabel}.`, "success");
      },

      onGuardianRejectMarriage: (childId, proposerId) => {
        if (!session) return;
        const newCitizens = [...state.citizens];
        const childIdx = newCitizens.findIndex((c) => c.id === childId);
        if (childIdx === -1) return;
        const child = newCitizens[childIdx];
        if (!child.guardianship?.active || String(child.guardianship.guardianId) !== String(session.id)) {
          notify("Vous n'exercez pas de tutelle active sur ce citoyen.", "error");
          return;
        }
        newCitizens[childIdx] = {
          ...child,
          marriageProposals: (child.marriageProposals || []).filter((p) => p.fromId !== proposerId),
        };
        saveState({ ...state, citizens: newCitizens });
        notify("La proposition d'union a été déclinée.", "info");
      },

      // Validation admin des naissances soumises via la loi "requireChildApproval"
      // (voir onDeclareChild) — reprend la même logique d'ajout que la déclaration directe.
      onApprovePendingChild: (pendingId) => {
        if (!session) return;
        const pending = (state.pendingChildren || []).find((p) => p.id === pendingId);
        if (!pending) { notify("Demande introuvable.", "error"); return; }

        const newCitizens = [...state.citizens];
        const requesterIdx = newCitizens.findIndex((c) => c.id === pending.requestedBy);
        if (requesterIdx === -1) { notify("Le déclarant n'existe plus.", "error"); return; }

        const child = pending.childData;
        const requester = newCitizens[requesterIdx];
        newCitizens[requesterIdx] = { ...requester, children: [...(requester.children || []), child] };

        if (child.otherParentId) {
          const otherIdx = newCitizens.findIndex((c) => c.id === child.otherParentId);
          if (otherIdx !== -1) {
            const other = newCitizens[otherIdx];
            const alreadyThere = (other.children || []).some((ch) => ch.id === child.id);
            if (!alreadyThere) {
              newCitizens[otherIdx] = { ...other, children: [...(other.children || []), { ...child, otherParentId: pending.requestedBy }] };
            }
          }
        }

        if (child.citizenId) {
          const childIdx = newCitizens.findIndex((c) => c.id === child.citizenId);
          if (childIdx !== -1) {
            const childCitizen = newCitizens[childIdx];
            const parentUpdates = {};
            const declarantSex = requester.sex || requester.gender;
            const otherParent = child.otherParentId ? newCitizens.find((c) => c.id === child.otherParentId) : null;
            if (declarantSex === "F" || declarantSex === "female" || declarantSex === "Femme") {
              parentUpdates.motherId = pending.requestedBy;
              parentUpdates.motherName = requester.name;
              if (otherParent) { parentUpdates.fatherId = otherParent.id; parentUpdates.fatherName = otherParent.name; }
            } else {
              parentUpdates.fatherId = pending.requestedBy;
              parentUpdates.fatherName = requester.name;
              if (otherParent) { parentUpdates.motherId = otherParent.id; parentUpdates.motherName = otherParent.name; }
            }
            newCitizens[childIdx] = { ...childCitizen, ...parentUpdates };
          }
        }

        const pendingChildren = (state.pendingChildren || []).filter((p) => p.id !== pendingId);
        saveState({ ...state, citizens: newCitizens, pendingChildren });
        notify(`${child.name} a été reconnu(e) — déclaration approuvée.`, "success");
      },

      onRejectPendingChild: (pendingId) => {
        if (!session) return;
        const pending = (state.pendingChildren || []).find((p) => p.id === pendingId);
        if (!pending) { notify("Demande introuvable.", "error"); return; }
        const pendingChildren = (state.pendingChildren || []).filter((p) => p.id !== pendingId);
        saveState({ ...state, pendingChildren });
        notify(`Déclaration de ${pending.childData?.name || "l'enfant"} refusée.`, "info");
      },

      // Un citoyen ne peut définir que sa propre filiation. Chaque parent peut être un
      // citoyen existant (fatherId/motherId résolu) ou un personnage NPC (id null, nom
      // libre) — même principe que le mode NPC déjà disponible pour les enfants.
      onSetParents: (citizenId, { fatherId, fatherName, motherId, motherName }) => {
        if (!session) return;
        if (String(session.id) !== String(citizenId)) { notify("Vous ne pouvez modifier que votre propre filiation.", "error"); return; }
        const newCitizens = [...(state.citizens || [])];
        const idx = newCitizens.findIndex((c) => c.id === citizenId);
        if (idx === -1) return;
        const updates = {};
        if (fatherId !== undefined) {
          if (fatherId) {
            const father = newCitizens.find((c) => c.id === fatherId);
            updates.fatherId = fatherId;
            updates.fatherName = father ? father.name : (fatherName || null);
          } else {
            updates.fatherId = null;
            updates.fatherName = fatherName ? String(fatherName).trim().slice(0, 80) : null;
          }
        }
        if (motherId !== undefined) {
          if (motherId) {
            const mother = newCitizens.find((c) => c.id === motherId);
            updates.motherId = motherId;
            updates.motherName = mother ? mother.name : (motherName || null);
          } else {
            updates.motherId = null;
            updates.motherName = motherName ? String(motherName).trim().slice(0, 80) : null;
          }
        }
        newCitizens[idx] = { ...newCitizens[idx], ...updates };
        saveState({ ...state, citizens: newCitizens });
        notify("Filiation mise à jour.", "success");
      },

      // --- BABILLARD D'ENTREPRISE ---
      onPostBulletin: (companyId, message) => {
        if (!session) return;
        const compIdx = state.companies.findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        if (!isCompanyManager(company, session.id)) {
          notify("Seul le dirigeant peut publier sur le babillard.", "error");
          return;
        }
        if (!message || !message.trim()) {
          notify("Le message ne peut pas être vide.", "error");
          return;
        }
        const newCompanies = [...state.companies];
        const bulletin = [...(company.bulletinBoard || [])];
        bulletin.unshift({
          id: "BUL-" + Date.now(),
          message: message.trim(),
          date: Date.now(),
          authorId: session.id,
        });
        newCompanies[compIdx] = { ...company, bulletinBoard: bulletin };
        saveState({ ...state, companies: newCompanies });
        notify("Annonce publiée sur le babillard.", "success");
      },

      onDeleteBulletin: (companyId, bulletinId) => {
        if (!session) return;
        const compIdx = state.companies.findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        if (!isCompanyManager(company, session.id)) {
          notify("Seul le dirigeant peut supprimer une annonce.", "error");
          return;
        }
        const newCompanies = [...state.companies];
        newCompanies[compIdx] = {
          ...company,
          bulletinBoard: (company.bulletinBoard || []).filter((b) => b.id !== bulletinId),
        };
        saveState({ ...state, companies: newCompanies });
        notify("Annonce supprimée.", "info");
      },

      // --- GRADES / RANGS PERSONNALISÉS ---
      onSetEmployeeRank: (companyId, employeeId, rankData) => {
        if (!session) return;
        const compIdx = state.companies.findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        if (!isCompanyManager(company, session.id)) {
          notify("Seul le dirigeant peut attribuer des grades.", "error");
          return;
        }
        const isBorrowedIn = (state.staffLoans || []).some(
          (l) => l.status === "ACTIVE" && String(l.toCompanyId) === String(companyId) && String(l.employeeId) === String(employeeId)
        );
        const isWorker = (company.employees || []).includes(employeeId) || (company.slaves || []).includes(employeeId) || isBorrowedIn;
        if (!isWorker) {
          notify("Ce citoyen ne fait pas partie de l'entreprise.", "error");
          return;
        }
        const newCompanies = [...state.companies];
        const ranks = { ...(company.employeeRanks || {}) };
        if (!rankData || (!rankData.title && !rankData.permissions)) {
          delete ranks[employeeId];
        } else {
          ranks[employeeId] = {
            title: rankData.title || "",
            permissions: rankData.permissions || {},
          };
        }
        newCompanies[compIdx] = { ...company, employeeRanks: ranks };
        saveState({ ...state, companies: newCompanies });
        notify(rankData?.title ? `Grade "${rankData.title}" attribué.` : "Grade retiré.", "success");
      },

      onSetEmployeeSerfRights: ({ companyId, citizenId, rights }) => {
        if (!session) return;
        const company = (state.companies || []).find(c => c.id === companyId);
        if (!isCompanyManager(company, session.id)) return;
        const contracts = { ...(company.employmentContracts || {}) };
        contracts[citizenId] = {
          ...(contracts[citizenId] || {}),
          serfRights: { ...((contracts[citizenId] || {}).serfRights || {}), ...rights },
        };
        const updatedCompanies = (state.companies || []).map(c =>
          c.id === companyId ? { ...c, employmentContracts: contracts } : c
        );
        saveState({ ...state, companies: updatedCompanies });
        notify("Droits mis à jour.", "success");
      },

      // --- AUTO-GESTION DES DROITS (dirigeant / PDG) ---
      // Un employé ou un détaché voit ses droits (voyage, Mushtagram, banque, marché, poste)
      // gérés par quelqu'un au-dessus de lui (employeur, entreprise emprunteuse). Un dirigeant ou
      // PDG n'a personne pour le faire à sa place — il gère donc lui-même les siens (citizen.
      // selfLockedRights), pris en compte au même titre que les autres sources dans
      // combinedRestriction (CitizenLayout.js).
      onSetSelfRights: (rights) => {
        if (!session) return;
        const idx = (state.citizens || []).findIndex((c) => c.id === session.id);
        if (idx === -1) return;
        const newCitizens = [...state.citizens];
        newCitizens[idx] = { ...newCitizens[idx], selfLockedRights: { ...(newCitizens[idx].selfLockedRights || {}), ...rights } };
        saveState({ ...state, citizens: newCitizens });
        notify("Vos droits ont été mis à jour.", "success");
      },

      onUpdateEmployeeContract: ({ companyId, citizenId, updates }) => {
        if (!session) return;
        const company = (state.companies || []).find(c => c.id === companyId);
        if (!isCompanyManager(company, session.id)) return;
        const contracts = { ...(company.employmentContracts || {}) };
        contracts[citizenId] = { ...(contracts[citizenId] || {}), ...updates };
        const updatedCompanies = (state.companies || []).map(c =>
          c.id === companyId ? { ...c, employmentContracts: contracts } : c
        );
        saveState({ ...state, companies: updatedCompanies });
        notify("Contrat mis à jour.", "success");
      },

      // --- ACCÈS AU COMPTE MUSHTAGRAM DE L'ENTREPRISE (délégué par le propriétaire) ---
      onSetCompanyMushtagramAccess: ({ companyId, citizenId, authorized }) => {
        if (!session) return;
        const company = (state.companies || []).find(c => c.id === companyId);
        if (!isCompanyManager(company, session.id)) return;
        const isBorrowedIn = (state.staffLoans || []).some(
          (l) => l.status === "ACTIVE" && String(l.toCompanyId) === String(companyId) && String(l.employeeId) === String(citizenId)
        );
        if (!(company.employees || []).map(String).includes(String(citizenId)) && !isBorrowedIn) return;
        const current = (company.mushtagramAuthorizedIds || []).map(String);
        const next = authorized
          ? (current.includes(String(citizenId)) ? current : [...current, String(citizenId)])
          : current.filter((id) => id !== String(citizenId));
        const updatedCompanies = (state.companies || []).map(c =>
          c.id === companyId ? { ...c, mushtagramAuthorizedIds: next } : c
        );
        saveState({ ...state, companies: updatedCompanies });
        notify(authorized ? "Accès Mushtagram accordé." : "Accès Mushtagram retiré.", "success");
      },

      // --- CANDIDATURE SPONTANÉE ---
      onApplyToCompany: (companyId) => {
        if (!session) return;
        const company = state.companies.find((c) => c.id === companyId);
        if (!company) return;
        if (company.hiringOpen === false) {
          notify("Cette entreprise ne recrute pas.", "error");
          return;
        }
        const isEmployed = state.companies.some((c) =>
          (c.employees || []).includes(session.id)
        );
        if (isEmployed) {
          notify("Vous avez déjà un emploi.", "error");
          return;
        }
        // Vérifier interdiction de migration
        const isMigrationLocked = state.companies.some((c) => {
          const contract = (c.employmentContracts || {})[session.id];
          return contract && contract.migrationLocked;
        });
        if (isMigrationLocked) {
          notify("Votre contrat de travail interdit de rejoindre une autre entreprise sans l'accord de votre seigneur.", "error");
          return;
        }
        if (company.ownerId === session.id) {
          notify("Vous êtes le dirigeant de cette entreprise.", "error");
          return;
        }
        const existingApps = company.applications || [];
        if (existingApps.some((a) => a.citizenId === session.id)) {
          notify("Candidature déjà envoyée.", "info");
          return;
        }
        const newCompanies = [...state.companies];
        const compIdx = newCompanies.findIndex((c) => c.id === companyId);
        newCompanies[compIdx] = {
          ...company,
          applications: [...existingApps, {
            id: "APP-" + Date.now(),
            citizenId: session.id,
            citizenName: (state.citizens.find((c) => c.id === session.id))?.name || session.id,
            date: Date.now(),
          }],
        };
        saveState({ ...state, companies: newCompanies });
        notify("Candidature envoyée.", "success");
      },

      onRespondApplication: (companyId, applicationId, accept, contractTerms) => {
        if (!session) return;
        const compIdx = state.companies.findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        if (!isCompanyManager(company, session.id)) return;

        const app = (company.applications || []).find((a) => a.id === applicationId);
        if (!app) return;

        const newCompanies = [...state.companies];
        newCompanies[compIdx] = {
          ...company,
          applications: (company.applications || []).filter((a) => a.id !== applicationId),
        };

        if (accept) {
          const isEmployed = state.companies.some((c) =>
            (c.employees || []).includes(app.citizenId)
          );
          if (isEmployed) {
            notify("Ce citoyen a déjà trouvé un emploi.", "error");
            saveState({ ...state, companies: newCompanies });
            return;
          }
          const seniorityData = { ...(company.employeeSeniority || {}) };
          seniorityData[app.citizenId] = 0;
          const defaultTerms = { type: "MERCENARIAT", contractDurationDays: null, dimePercent: 0, corveeFreeDaysPerMonth: 0, buyoutAmount: 0, migrationLocked: false, customClauses: [], signingBonus: 0, profitSharePercent: 0, severanceAmount: 0 };
          const finalTerms = contractTerms || defaultTerms;
          const signingBonus = finalTerms.signingBonus || 0;
          let newCitizens = state.citizens;
          let ledgerEntries = [];
          if (signingBonus > 0) {
            const citIdx = state.citizens.findIndex((c) => c.id === app.citizenId);
            if (citIdx !== -1) {
              newCitizens = [...state.citizens];
              newCitizens[citIdx] = { ...newCitizens[citIdx], balance: Math.round(((newCitizens[citIdx].balance || 0) + signingBonus) * 10) / 10 };
              const ts = Date.now();
              ledgerEntries.push({ id: ts, fromName: company.name, toName: app.citizenName, amount: signingBonus, timestamp: ts, reason: `Prime d'embauche — contrat ${finalTerms.type}`, type: "SIGNING_BONUS" });
            }
          }
          newCompanies[compIdx] = {
            ...newCompanies[compIdx],
            balance: Math.round(((newCompanies[compIdx].balance || 0) - signingBonus) * 10) / 10,
            employees: [...(newCompanies[compIdx].employees || []), app.citizenId],
            employeeSeniority: seniorityData,
            employmentContracts: {
              ...(newCompanies[compIdx].employmentContracts || {}),
              [app.citizenId]: { ...finalTerms, signedAt: Date.now() },
            },
          };
          notify(`${app.citizenName} a été embauché.${signingBonus > 0 ? ` Prime d'embauche : ${formatMoney(signingBonus)}.` : ""}`, "success");
          saveState({ ...state, companies: newCompanies, citizens: newCitizens, ...(ledgerEntries.length > 0 ? { globalLedger: [...ledgerEntries, ...(state.globalLedger || [])].slice(0, 1000) } : {}) });
          return;
        } else {
          notify("Candidature refusée.", "info");
        }
        saveState({ ...state, companies: newCompanies });
      },

      // --- PROFIL EMPLOYÉ (CV) ---
      onUpdateEmployeeProfile: (profileData) => {
        if (!session) return;
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = {
          ...newCitizens[userIdx],
          employeeProfile: {
            skills: profileData.skills || "",
            experience: profileData.experience || "",
            seeking: profileData.seeking || false,
          },
        };
        saveState({ ...state, citizens: newCitizens });
        notify("Profil employé mis à jour.", "success");
      },

      // --- INVENTAIRE D'ENTREPRISE ---
      onCompanyInventoryAdd: (companyId, itemName, quantity) => {
        if (!session) return;
        const compIdx = state.companies.findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        if (!isCompanyManager(company, session.id)) {
          notify("Seul le dirigeant peut gérer le stock.", "error");
          return;
        }
        if (!itemName?.trim() || !quantity || quantity <= 0) {
          notify("Données invalides.", "error");
          return;
        }
        const newCompanies = [...state.companies];
        const inv = [...(company.companyInventory || [])];
        const existing = inv.findIndex((i) => i.name.toLowerCase() === itemName.trim().toLowerCase());
        if (existing !== -1) {
          inv[existing] = { ...inv[existing], quantity: inv[existing].quantity + parseInt(quantity) };
        } else {
          inv.push({ id: "INV-" + Date.now(), name: itemName.trim(), quantity: parseInt(quantity) });
        }
        newCompanies[compIdx] = { ...company, companyInventory: inv };
        saveState({ ...state, companies: newCompanies });
        notify(`${quantity}x ${itemName.trim()} ajouté au stock.`, "success");
      },

      onCompanyInventoryRemove: (companyId, itemId, quantity) => {
        if (!session) return;
        const compIdx = state.companies.findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        if (!isCompanyManager(company, session.id)) {
          const rank = (company.employeeRanks || {})[session.id];
          if (!rank?.permissions?.inventory) {
            notify("Vous n'avez pas la permission.", "error");
            return;
          }
        }
        const newCompanies = [...state.companies];
        let inv = [...(company.companyInventory || [])];
        const itemIdx = inv.findIndex((i) => i.id === itemId);
        if (itemIdx === -1) return;
        const item = inv[itemIdx];
        const qty = parseInt(quantity) || 1;
        if (qty >= item.quantity) {
          inv = inv.filter((i) => i.id !== itemId);
        } else {
          inv[itemIdx] = { ...item, quantity: item.quantity - qty };
        }
        newCompanies[compIdx] = { ...company, companyInventory: inv };
        saveState({ ...state, companies: newCompanies });
        notify(`Stock mis à jour.`, "info");
      },

      // --- ÉVÉNEMENTS D'ENTREPRISE ---
      onCreateCompanyEvent: (companyId, eventData) => {
        if (!session) return;
        const compIdx = state.companies.findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        if (!isCompanyManager(company, session.id)) {
          notify("Seul le dirigeant peut créer un événement.", "error");
          return;
        }
        if (!eventData.title?.trim()) {
          notify("L'événement doit avoir un titre.", "error");
          return;
        }
        const newCompanies = [...state.companies];
        const events = [...(company.companyEvents || [])];
        events.push({
          id: "EVT-" + Date.now(),
          title: eventData.title.trim(),
          description: eventData.description?.trim() || "",
          date: eventData.date || "",
          createdAt: Date.now(),
        });
        newCompanies[compIdx] = { ...company, companyEvents: events };
        saveState({ ...state, companies: newCompanies });
        notify("Événement créé.", "success");
      },

      onDeleteCompanyEvent: (companyId, eventId) => {
        if (!session) return;
        const compIdx = state.companies.findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;
        const company = state.companies[compIdx];
        if (!isCompanyManager(company, session.id)) return;
        const newCompanies = [...state.companies];
        newCompanies[compIdx] = {
          ...company,
          companyEvents: (company.companyEvents || []).filter((e) => e.id !== eventId),
        };
        saveState({ ...state, companies: newCompanies });
        notify("Événement supprimé.", "info");
      },

      // --- DÉTACHEMENT DE PERSONNEL (prêt de salariés entre entreprises) ---
      // Le salarié reste employé par fromCompany (contrat, ancienneté, salaire via
      // workerBalances inchangés) mais travaille temporairement pour toCompany, qui verse
      // un tarif de location + une éventuelle prime à fromCompany. Décision unilatérale du
      // dirigeant de fromCompany, aucun accord du salarié requis.
      onCreateStaffLoan: ({ employeeId, fromCompanyId, toCompanyId, durationType, durationDays, dailyRate, signingBonus, exclusive }) => {
        if (!session) return;
        const fromIdx = state.companies.findIndex((c) => c.id === fromCompanyId);
        const toIdx = state.companies.findIndex((c) => c.id === toCompanyId);
        if (fromIdx === -1 || toIdx === -1) { notify("Entreprise introuvable.", "error"); return; }
        const fromCompany = state.companies[fromIdx];
        const toCompany = state.companies[toIdx];
        if (!isCompanyManager(fromCompany, session.id)) {
          notify("Seul le dirigeant peut détacher un salarié.", "error");
          return;
        }
        if (String(fromCompanyId) === String(toCompanyId)) { notify("Choisissez une autre entreprise.", "error"); return; }
        // Ni le propriétaire ni le PDG ne comptent dans employees/slaves (voir la production
        // journalière d'onPassDay) — les détacher n'a donc rien à déduire côté entreprise
        // d'origine, contrairement à un salarié ordinaire.
        const isOwnerLoan = String(fromCompany.ownerId) === String(employeeId) || String(fromCompany.ceoId || "") === String(employeeId);
        const isWorker = isOwnerLoan
          || (fromCompany.employees || []).map(String).includes(String(employeeId))
          || (fromCompany.slaves || []).map(String).includes(String(employeeId));
        if (!isWorker) { notify("Ce citoyen ne fait pas partie de votre entreprise.", "error"); return; }
        const alreadyLoaned = (state.staffLoans || []).some((l) => l.status === "ACTIVE" && String(l.employeeId) === String(employeeId));
        if (alreadyLoaned) { notify("Ce salarié est déjà détaché ailleurs.", "error"); return; }

        const rate = Math.max(0, parseFloat(dailyRate) || 0);
        const bonus = Math.max(0, parseFloat(signingBonus) || 0);
        const isFixed = durationType === "FIXED";
        const days = isFixed ? Math.max(1, parseInt(durationDays) || 0) : null;
        if (isFixed && !days) { notify("Durée invalide.", "error"); return; }
        if (bonus > 0 && (toCompany.balance || 0) < bonus) {
          notify("Trésorerie de l'entreprise emprunteuse insuffisante pour la prime.", "error");
          return;
        }

        const citizen = (state.citizens || []).find((c) => c.id === employeeId);
        const newCompanies = [...state.companies];
        let ledgerEntries = [];
        if (bonus > 0) {
          newCompanies[toIdx] = { ...toCompany, balance: toCompany.balance - bonus };
          newCompanies[fromIdx] = { ...fromCompany, balance: (fromCompany.balance || 0) + bonus };
          ledgerEntries.push({
            id: Date.now(), fromName: toCompany.name, toName: fromCompany.name, amount: bonus,
            timestamp: Date.now(), reason: `Prime de détachement — ${citizen?.name || employeeId}`, type: "STAFF_LOAN_BONUS",
          });
        }

        const loan = {
          id: `loan_${Date.now()}`,
          employeeId, employeeName: citizen?.name || employeeId,
          fromCompanyId, fromCompanyName: fromCompany.name,
          toCompanyId, toCompanyName: toCompany.name,
          status: "ACTIVE",
          durationType: isFixed ? "FIXED" : "INDEFINITE",
          durationDays: days,
          daysElapsed: 0,
          dailyRate: rate,
          signingBonus: bonus,
          exclusive: !!exclusive,
          isOwnerLoan,
          permissions: {},
          createdAt: Date.now(),
          endedAt: null,
        };
        const alerts = [...(state.staffLoanAlerts || []), {
          id: `sla_${Date.now()}`, toId: employeeId, type: "loaned",
          fromCompanyName: fromCompany.name, toCompanyName: toCompany.name, timestamp: Date.now(),
        }];

        saveState({
          ...state,
          companies: newCompanies,
          staffLoans: [...(state.staffLoans || []), loan],
          staffLoanAlerts: alerts,
          globalLedger: ledgerEntries.length ? [...ledgerEntries, ...(state.globalLedger || [])] : state.globalLedger,
        });
        notify(`${citizen?.name || "Salarié"} détaché chez ${toCompany.name}.`, "success");
      },

      onEndStaffLoan: (loanId, reason) => {
        if (!session) return;
        const loan = (state.staffLoans || []).find((l) => l.id === loanId);
        if (!loan || loan.status !== "ACTIVE") return;
        const fromCompany = (state.companies || []).find((c) => c.id === loan.fromCompanyId);
        const toCompany = (state.companies || []).find((c) => c.id === loan.toCompanyId);
        const isAdmin = ["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(session.role);
        const canEnd = isCompanyManager(fromCompany, session.id) || isCompanyManager(toCompany, session.id) || isAdmin;
        if (!canEnd) { notify("Vous n'êtes pas partie à ce détachement.", "error"); return; }
        const newLoans = (state.staffLoans || []).map((l) =>
          l.id === loanId ? { ...l, status: reason === "RECALLED" ? "RECALLED" : "ENDED", endedAt: Date.now() } : l
        );
        const alerts = [...(state.staffLoanAlerts || []), {
          id: `sla_${Date.now()}`, toId: loan.employeeId, type: reason === "RECALLED" ? "recalled" : "ended",
          fromCompanyName: loan.fromCompanyName, toCompanyName: loan.toCompanyName, timestamp: Date.now(),
        }];
        saveState({ ...state, staffLoans: newLoans, staffLoanAlerts: alerts });
        notify("Détachement terminé.", "info");
      },

      onSetStaffLoanPermissions: ({ loanId, permissions }) => {
        if (!session) return;
        const loan = (state.staffLoans || []).find((l) => l.id === loanId);
        if (!loan || loan.status !== "ACTIVE") return;
        const toCompany = (state.companies || []).find((c) => c.id === loan.toCompanyId);
        if (!isCompanyManager(toCompany, session.id)) {
          notify("Seule l'entreprise emprunteuse peut gérer ces droits.", "error");
          return;
        }
        const newLoans = (state.staffLoans || []).map((l) =>
          l.id === loanId ? { ...l, permissions: { ...(l.permissions || {}), ...permissions } } : l
        );
        saveState({ ...state, staffLoans: newLoans });
        notify("Droits mis à jour.", "success");
      },

      // --- SOUS-TRAITANCE (contrat entre entreprises) ---
      onCreateSubcontract: (fromCompanyId, toCompanyId, amount, description) => {
        if (!session) return;
        const fromIdx = state.companies.findIndex((c) => c.id === fromCompanyId);
        const toIdx = state.companies.findIndex((c) => c.id === toCompanyId);
        if (fromIdx === -1 || toIdx === -1) return;
        const fromCompany = state.companies[fromIdx];
        if (!isCompanyManager(fromCompany, session.id)) {
          notify("Seul le dirigeant peut créer un contrat de sous-traitance.", "error");
          return;
        }
        const val = parseFloat(amount);
        if (!val || val <= 0) {
          notify("Montant invalide.", "error");
          return;
        }
        if ((fromCompany.balance || 0) < val) {
          notify("Trésorerie insuffisante.", "error");
          return;
        }
        const toCompany = state.companies[toIdx];
        const newCompanies = [...state.companies];
        newCompanies[fromIdx] = { ...fromCompany, balance: fromCompany.balance - val };
        newCompanies[toIdx] = { ...toCompany, balance: (toCompany.balance || 0) + val };

        const ledgerEntry = {
          id: Date.now(),
          fromName: fromCompany.name,
          toName: toCompany.name,
          amount: val,
          timestamp: Date.now(),
          reason: description?.trim() || "Sous-traitance",
          type: "SUBCONTRACT",
        };
        saveState({
          ...state,
          companies: newCompanies,
          globalLedger: [ledgerEntry, ...(state.globalLedger || [])],
        });
        notify(`${val.toLocaleString()} écus transférés à ${toCompany.name}.`, "success");
      },

      // --- JOURNAL INTIME RP ---
      onAddJournalEntry: (content, title, mood) => {
        if (!session) return;
        if (!content?.trim()) { notify("Le contenu ne peut pas être vide.", "error"); return; }
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const newCitizens = [...state.citizens];
        const journal = [...(newCitizens[userIdx].journal || [])];
        const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
        journal.unshift({
          id: "J-" + Date.now(),
          title: title?.trim() || "",
          content: content.trim(),
          mood: mood || "neutre",
          rpDate: `${gd.day}/${gd.month}/${gd.year}`,
          timestamp: Date.now(),
        });
        newCitizens[userIdx] = { ...newCitizens[userIdx], journal };
        saveState({ ...state, citizens: newCitizens });
        notify("Entrée ajoutée au journal.", "success");
      },

      onEditJournalEntry: (entryId, content, title, mood) => {
        if (!session) return;
        if (!content?.trim()) { notify("Le contenu ne peut pas être vide.", "error"); return; }
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = {
          ...newCitizens[userIdx],
          journal: (newCitizens[userIdx].journal || []).map((j) =>
            j.id === entryId ? { ...j, content: content.trim(), title: title?.trim() || j.title || "", mood: mood || j.mood || "neutre", editedAt: Date.now() } : j
          ),
        };
        saveState({ ...state, citizens: newCitizens });
        notify("Entrée modifiée.", "success");
      },

      onDeleteJournalEntry: (entryId) => {
        if (!session) return;
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = {
          ...newCitizens[userIdx],
          journal: (newCitizens[userIdx].journal || []).filter((j) => j.id !== entryId),
        };
        saveState({ ...state, citizens: newCitizens });
        notify("Entrée supprimée.", "info");
      },

      // --- MARCHÉ ENTRE JOUEURS ---
      onListItemForSale: (itemId, price, quantity) => {
        if (!session) return;
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const user = state.citizens[userIdx];
        const inv = user.inventory || [];
        const slot = inv.find((e) => e.itemId === itemId);
        const qty = parseInt(quantity) || 1;
        const pr = parseFloat(price);
        if (!slot || slot.quantity < qty) { notify("Quantité insuffisante.", "error"); return; }
        if (!pr || pr <= 0) { notify("Prix invalide.", "error"); return; }
        const catalog = state.inventoryCatalog || [];
        const itemInfo = catalog.find((i) => i.id === itemId);
        const listings = [...(state.playerMarket || [])];
        listings.push({
          id: "MKT-" + Date.now(),
          sellerId: session.id,
          sellerName: user.name,
          itemId,
          itemName: itemInfo?.name || itemId,
          price: pr,
          quantity: qty,
          date: Date.now(),
        });
        // Retirer de l'inventaire du vendeur
        const newCitizens = [...state.citizens];
        const newInv = [...inv];
        const slotIdx = newInv.findIndex((e) => e.itemId === itemId);
        if (newInv[slotIdx].quantity === qty) {
          newInv.splice(slotIdx, 1);
        } else {
          newInv[slotIdx] = { ...newInv[slotIdx], quantity: newInv[slotIdx].quantity - qty };
        }
        newCitizens[userIdx] = { ...user, inventory: newInv };
        saveState({ ...state, citizens: newCitizens, playerMarket: listings });
        notify(`${qty}x ${itemInfo?.name || "objet"} mis en vente pour ${formatMoney(pr)}.`, "success");
      },

      onCancelListing: (listingId) => {
        if (!session) return;
        const listings = state.playerMarket || [];
        const listing = listings.find((l) => l.id === listingId);
        if (!listing || listing.sellerId !== session.id) return;
        // Rendre l'objet au vendeur
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const newCitizens = [...state.citizens];
        const inv = [...(newCitizens[userIdx].inventory || [])];
        const existing = inv.findIndex((e) => e.itemId === listing.itemId);
        if (existing !== -1) {
          inv[existing] = { ...inv[existing], quantity: inv[existing].quantity + listing.quantity };
        } else {
          inv.push({ itemId: listing.itemId, quantity: listing.quantity });
        }
        newCitizens[userIdx] = { ...newCitizens[userIdx], inventory: inv };
        saveState({
          ...state,
          citizens: newCitizens,
          playerMarket: listings.filter((l) => l.id !== listingId),
        });
        notify("Annonce retirée.", "info");
      },

      onBuyFromPlayer: (listingId) => {
        if (!session) return;
        const listings = state.playerMarket || [];
        const listing = listings.find((l) => l.id === listingId);
        if (!listing) { notify("Annonce introuvable.", "error"); return; }
        if (listing.sellerId === session.id) { notify("Vous ne pouvez pas acheter votre propre annonce.", "error"); return; }
        const buyerIdx = state.citizens.findIndex((c) => c.id === session.id);
        const sellerIdx = state.citizens.findIndex((c) => c.id === listing.sellerId);
        if (buyerIdx === -1) return;
        const buyer = state.citizens[buyerIdx];
        if ((buyer.balance || 0) < listing.price) { notify("Fonds insuffisants.", "error"); return; }
        const newCitizens = [...state.citizens];
        // Débit acheteur
        newCitizens[buyerIdx] = { ...buyer, balance: buyer.balance - listing.price };
        // Crédit vendeur
        if (sellerIdx !== -1) {
          newCitizens[sellerIdx] = { ...newCitizens[sellerIdx], balance: (newCitizens[sellerIdx].balance || 0) + listing.price };
        }
        // Ajouter à l'inventaire de l'acheteur
        const inv = [...(newCitizens[buyerIdx].inventory || [])];
        const existing = inv.findIndex((e) => e.itemId === listing.itemId);
        if (existing !== -1) {
          inv[existing] = { ...inv[existing], quantity: inv[existing].quantity + listing.quantity };
        } else {
          inv.push({ itemId: listing.itemId, quantity: listing.quantity });
        }
        newCitizens[buyerIdx] = { ...newCitizens[buyerIdx], inventory: inv };
        const ledgerEntry = {
          id: Date.now(),
          fromName: buyer.name,
          toName: sellerIdx !== -1 ? newCitizens[sellerIdx].name : listing.sellerName,
          amount: listing.price,
          timestamp: Date.now(),
          reason: `Achat marché: ${listing.quantity}x ${listing.itemName}`,
          type: "PLAYER_MARKET",
        };
        saveState({
          ...state,
          citizens: newCitizens,
          playerMarket: listings.filter((l) => l.id !== listingId),
          globalLedger: [ledgerEntry, ...(state.globalLedger || [])],
        });
        notify(`${listing.quantity}x ${listing.itemName} acheté(s) pour ${formatMoney(listing.price)}.`, "success");
      },

      // --- PROPOSITIONS D'ÉCHANGE ---
      onProposeTrade: (targetId, offer, request) => {
        if (!session) return;
        if (targetId === session.id) return;
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        const targetIdx = state.citizens.findIndex((c) => c.id === targetId);
        if (userIdx === -1 || targetIdx === -1) return;
        const user = state.citizens[userIdx];
        const target = state.citizens[targetIdx];
        // offer = { items: [{itemId, quantity}], money: number }
        // request = { items: [{itemId, quantity}], money: number }
        // Vérifier que l'offrant a les objets/argent
        if (offer.money && offer.money > 0 && (user.balance || 0) < offer.money) {
          notify("Fonds insuffisants pour cette offre.", "error"); return;
        }
        for (const item of (offer.items || [])) {
          const slot = (user.inventory || []).find((e) => e.itemId === item.itemId);
          if (!slot || slot.quantity < item.quantity) {
            notify("Vous n'avez pas assez d'objets pour cette offre.", "error"); return;
          }
        }
        const catalog = state.inventoryCatalog || [];
        const trades = [...(state.tradeProposals || [])];
        trades.push({
          id: "TRD-" + Date.now(),
          fromId: session.id,
          fromName: user.name,
          toId: targetId,
          toName: target.name,
          offer: {
            items: (offer.items || []).map((i) => ({ ...i, name: catalog.find((c) => c.id === i.itemId)?.name || i.itemId })),
            money: offer.money || 0,
          },
          request: {
            items: (request.items || []).map((i) => ({ ...i, name: catalog.find((c) => c.id === i.itemId)?.name || i.itemId })),
            money: request.money || 0,
          },
          status: "PENDING",
          date: Date.now(),
        });
        saveState({ ...state, tradeProposals: trades });
        notify(`Proposition d'échange envoyée à ${target.name}.`, "success");
      },

      onRespondTrade: (tradeId, accept) => {
        if (!session) return;
        const trades = [...(state.tradeProposals || [])];
        const tIdx = trades.findIndex((t) => t.id === tradeId);
        if (tIdx === -1) return;
        const trade = trades[tIdx];
        if (trade.toId !== session.id) return;
        if (!accept) {
          trades[tIdx] = { ...trade, status: "REFUSED" };
          saveState({ ...state, tradeProposals: trades.filter((t) => t.status !== "REFUSED") });
          notify("Échange refusé.", "info");
          return;
        }
        // Vérifier que les deux parties ont toujours les ressources
        const newCitizens = [...state.citizens];
        const fromIdx = newCitizens.findIndex((c) => c.id === trade.fromId);
        const toIdx = newCitizens.findIndex((c) => c.id === trade.toId);
        if (fromIdx === -1 || toIdx === -1) { notify("Citoyen introuvable.", "error"); return; }
        const from = newCitizens[fromIdx];
        const to = newCitizens[toIdx];
        // Vérif offrant
        if (trade.offer.money > 0 && (from.balance || 0) < trade.offer.money) { notify("L'offrant n'a plus les fonds.", "error"); return; }
        for (const item of (trade.offer.items || [])) {
          const slot = (from.inventory || []).find((e) => e.itemId === item.itemId);
          if (!slot || slot.quantity < item.quantity) { notify("L'offrant n'a plus les objets.", "error"); return; }
        }
        // Vérif destinataire
        if (trade.request.money > 0 && (to.balance || 0) < trade.request.money) { notify("Vous n'avez pas les fonds demandés.", "error"); return; }
        for (const item of (trade.request.items || [])) {
          const slot = (to.inventory || []).find((e) => e.itemId === item.itemId);
          if (!slot || slot.quantity < item.quantity) { notify("Vous n'avez pas les objets demandés.", "error"); return; }
        }
        // Exécuter l'échange
        let fromInv = [...(from.inventory || [])];
        let toInv = [...(to.inventory || [])];
        let fromBal = from.balance || 0;
        let toBal = to.balance || 0;
        // Transférer offre (from -> to)
        for (const item of (trade.offer.items || [])) {
          const si = fromInv.findIndex((e) => e.itemId === item.itemId);
          if (fromInv[si].quantity === item.quantity) fromInv.splice(si, 1);
          else fromInv[si] = { ...fromInv[si], quantity: fromInv[si].quantity - item.quantity };
          const ti = toInv.findIndex((e) => e.itemId === item.itemId);
          if (ti !== -1) toInv[ti] = { ...toInv[ti], quantity: toInv[ti].quantity + item.quantity };
          else toInv.push({ itemId: item.itemId, quantity: item.quantity });
        }
        if (trade.offer.money > 0) { fromBal -= trade.offer.money; toBal += trade.offer.money; }
        // Transférer demande (to -> from)
        for (const item of (trade.request.items || [])) {
          const si = toInv.findIndex((e) => e.itemId === item.itemId);
          if (toInv[si].quantity === item.quantity) toInv.splice(si, 1);
          else toInv[si] = { ...toInv[si], quantity: toInv[si].quantity - item.quantity };
          const ti = fromInv.findIndex((e) => e.itemId === item.itemId);
          if (ti !== -1) fromInv[ti] = { ...fromInv[ti], quantity: fromInv[ti].quantity + item.quantity };
          else fromInv.push({ itemId: item.itemId, quantity: item.quantity });
        }
        if (trade.request.money > 0) { toBal -= trade.request.money; fromBal += trade.request.money; }
        newCitizens[fromIdx] = { ...from, inventory: fromInv, balance: fromBal };
        newCitizens[toIdx] = { ...to, inventory: toInv, balance: toBal };
        const ledger = [];
        if (trade.offer.money > 0) {
          ledger.push({ id: Date.now(), fromName: from.name, toName: to.name, amount: trade.offer.money, timestamp: Date.now(), reason: "Échange accepté", type: "TRADE" });
        }
        if (trade.request.money > 0) {
          ledger.push({ id: Date.now() + 1, fromName: to.name, toName: from.name, amount: trade.request.money, timestamp: Date.now(), reason: "Échange accepté", type: "TRADE" });
        }
        saveState({
          ...state,
          citizens: newCitizens,
          tradeProposals: trades.filter((t) => t.id !== tradeId),
          globalLedger: [...ledger, ...(state.globalLedger || [])],
        });
        notify("Échange effectué !", "success");
      },

      onCancelTrade: (tradeId) => {
        if (!session) return;
        const trades = state.tradeProposals || [];
        const trade = trades.find((t) => t.id === tradeId);
        if (!trade || trade.fromId !== session.id) return;
        saveState({ ...state, tradeProposals: trades.filter((t) => t.id !== tradeId) });
        notify("Proposition d'échange annulée.", "info");
      },

      // --- PROPRIÉTÉS IMMOBILIÈRES (ADMIN) ---
      onCreateProperty: ({ name, type, description, price, income, countryId, regionId, location }) => {
        const properties = [...(state.properties || [])];
        properties.push({
          id: `prop-${Date.now()}`,
          name: name || "Propriété sans nom",
          type: type || "MAISON",
          description: description || "",
          price: parseFloat(price) || 0,
          income: parseFloat(income) || 0,
          countryId: countryId || null,
          regionId: regionId || null,
          location: location || "",
          ownerId: null,
          ownerName: null,
          ownerType: null, // "CITIZEN" | "COMPANY"
          forSale: false,
          salePrice: 0,
          // Fonctionnalités spéciales
          garrison: [], // Château: [{id, name}]
          audiences: [], // Château: [{id, from, subject, text, date, status}]
          dungeon: [], // Château: [{citizenId, citizenName, reason, since}]
          rooms: [], // Auberge: [{id, name, pricePerNight, tenantId, tenantName}]
          tavernMessages: [], // Auberge: [{id, authorName, text, timestamp}]
          rumors: [], // Auberge: [{id, text, timestamp}]
          menu: [], // Auberge: [{itemName, price, stock}]
          production: null, // Ferme: {itemName, qtyPerDay, lastProduced}
          craftRecipes: [], // Atelier: [{id, inputItem, inputQty, outputItem, outputQty}] — indicatif, sans transformation automatique
          shopStock: [], // Commerce: [{itemName, qty, price}]
          staff: [], // Commun: [{id, name, role, salary}]
          propertyEvents: [], // Commun: [{id, title, desc, date}]
        });
        saveState({ ...state, properties });
        notify(`Propriété "${name}" créée.`, "success");
      },

      onDeleteProperty: (propertyId) => {
        const properties = (state.properties || []).filter((p) => p.id !== propertyId);
        saveState({ ...state, properties });
        notify("Propriété supprimée.", "info");
      },

      onEditProperty: (propertyId, updates) => {
        const properties = [...(state.properties || [])];
        const idx = properties.findIndex((p) => p.id === propertyId);
        if (idx === -1) return;
        properties[idx] = { ...properties[idx], ...updates };
        saveState({ ...state, properties });
        notify("Propriété modifiée.", "success");
      },

      // --- PROPRIÉTÉS IMMOBILIÈRES (CITOYEN) ---
      onBuyProperty: (propertyId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) { notify("Propriété introuvable.", "error"); return; }
        const prop = properties[pIdx];
        if (prop.ownerId) { notify("Cette propriété a déjà un propriétaire.", "error"); return; }
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const user = state.citizens[userIdx];
        if ((user.balance || 0) < prop.price) { notify("Fonds insuffisants.", "error"); return; }
        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = { ...user, balance: user.balance - prop.price };
        properties[pIdx] = { ...prop, ownerId: session.id, ownerName: user.name };
        const ledgerEntry = {
          id: Date.now(),
          fromName: user.name,
          toName: "Registre Foncier",
          amount: prop.price,
          timestamp: Date.now(),
          reason: `Achat propriété: ${prop.name}`,
          type: "PROPERTY_PURCHASE",
        };
        saveState({
          ...state,
          citizens: newCitizens,
          properties,
          treasury: (state.treasury || 0) + prop.price,
          globalLedger: [ledgerEntry, ...(state.globalLedger || [])],
        });
        notify(`Propriété "${prop.name}" acquise !`, "success");
      },

      onSellProperty: (propertyId, price) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const prop = properties[pIdx];
        if (!isPropertyManager(prop, session.id)) { notify("Ce n'est pas votre propriété.", "error"); return; }
        const pr = parseFloat(price);
        if (!pr || pr <= 0) { notify("Prix invalide.", "error"); return; }
        properties[pIdx] = { ...prop, forSale: true, salePrice: pr };
        saveState({ ...state, properties });
        notify(`"${prop.name}" mise en vente pour ${formatMoney(pr)}.`, "success");
      },

      onCancelPropertySale: (propertyId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        if (!isPropertyManager(properties[pIdx], session.id)) { notify("Ce n'est pas votre propriété.", "error"); return; }
        properties[pIdx] = { ...properties[pIdx], forSale: false, salePrice: 0 };
        saveState({ ...state, properties });
        notify("Vente annulée.", "info");
      },

      onBuyPropertyFromPlayer: (propertyId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const prop = properties[pIdx];
        if (!prop.forSale || !prop.salePrice) { notify("Cette propriété n'est pas en vente.", "error"); return; }
        if (prop.ownerId === session.id) { notify("Vous possédez déjà cette propriété.", "error"); return; }
        const buyerIdx = state.citizens.findIndex((c) => c.id === session.id);
        const sellerIdx = state.citizens.findIndex((c) => c.id === prop.ownerId);
        if (buyerIdx === -1) return;
        // Vendeur introuvable (compte supprimé) : on bloque plutôt que de débiter l'acheteur
        // sans personne à créditer — l'argent partirait sinon dans le vide.
        if (sellerIdx === -1) { notify("Le vendeur de ce bien n'existe plus, transaction annulée.", "error"); return; }
        const buyer = state.citizens[buyerIdx];
        if ((buyer.balance || 0) < prop.salePrice) { notify("Fonds insuffisants.", "error"); return; }
        const newCitizens = [...state.citizens];
        newCitizens[buyerIdx] = { ...buyer, balance: buyer.balance - prop.salePrice };
        newCitizens[sellerIdx] = { ...newCitizens[sellerIdx], balance: (newCitizens[sellerIdx].balance || 0) + prop.salePrice };
        // Le changement de bailleur est silencieux pour le locataire/le personnel en place —
        // on prévient au moins le locataire actuel, puisque son loyer ira désormais au nouvel
        // acquéreur (onPassDay relit prop.ownerId en direct).
        const previousTenantId = prop.rental?.tenantId;
        properties[pIdx] = { ...prop, ownerId: session.id, ownerName: buyer.name, forSale: false, salePrice: 0 };
        const ledgerEntry = {
          id: Date.now(),
          fromName: buyer.name,
          toName: newCitizens[sellerIdx].name,
          amount: prop.salePrice,
          timestamp: Date.now(),
          reason: `Achat propriété: ${prop.name}`,
          type: "PROPERTY_PURCHASE",
        };
        const propertyAlerts = [
          ...(state.propertyAlerts || []),
          { id: `palert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, toId: prop.ownerId, type: "sold", propertyId: prop.id, propertyName: prop.name, otherName: buyer.name, amount: prop.salePrice, timestamp: Date.now() },
          ...(previousTenantId ? [{ id: `palert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}t`, toId: previousTenantId, type: "owner_changed", propertyId: prop.id, propertyName: prop.name, otherName: buyer.name, timestamp: Date.now() }] : []),
        ];
        saveState({
          ...state,
          citizens: newCitizens,
          properties,
          globalLedger: [ledgerEntry, ...(state.globalLedger || [])],
          propertyAlerts,
        });
        notify(`Propriété "${prop.name}" acquise !`, "success");
      },

      // --- ACHAT PROPRIÉTÉ PAR ENTREPRISE ---
      onCompanyBuyProperty: (companyId, propertyId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) { notify("Propriété introuvable.", "error"); return; }
        const prop = properties[pIdx];
        if (prop.ownerId) { notify("Propriété déjà possédée.", "error"); return; }
        const companies = [...(state.companies || [])];
        const cIdx = companies.findIndex((c) => c.id === companyId);
        if (cIdx === -1) return;
        if (!isCompanyManager(companies[cIdx], session.id)) { notify("Vous n'êtes pas le dirigeant.", "error"); return; }
        if ((companies[cIdx].balance || 0) < prop.price) { notify("L'entreprise n'a pas assez de fonds.", "error"); return; }
        companies[cIdx] = { ...companies[cIdx], balance: companies[cIdx].balance - prop.price };
        properties[pIdx] = { ...prop, ownerId: companyId, ownerName: companies[cIdx].name, ownerType: "COMPANY" };
        const ledgerEntry = { id: Date.now(), fromName: companies[cIdx].name, toName: "Registre Foncier", amount: prop.price, timestamp: Date.now(), reason: `Achat propriété: ${prop.name}`, type: "PROPERTY_PURCHASE" };
        saveState({ ...state, properties, companies, treasury: (state.treasury || 0) + prop.price, globalLedger: [ledgerEntry, ...(state.globalLedger || [])] });
        notify(`${companies[cIdx].name} a acquis "${prop.name}" !`, "success");
      },

      // --- FONCTIONNALITÉS SPÉCIALES PROPRIÉTÉS ---
      onUpdatePropertyFeature: (propertyId, featureKey, featureValue) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const prop = properties[pIdx];
        if (!isPropertyManager(prop, session.id)) { notify("Vous ne gérez pas cette propriété.", "error"); return; }
        properties[pIdx] = { ...prop, [featureKey]: featureValue };
        saveState({ ...state, properties });
      },

      // Château: garnison
      onAddGarrison: (propertyId, citizenId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        if (!isPropertyManager(properties[pIdx], session.id)) { notify("Vous ne gérez pas cette propriété.", "error"); return; }
        const citizen = (state.citizens || []).find((c) => c.id === citizenId);
        if (!citizen) return;
        const garrison = [...(properties[pIdx].garrison || [])];
        if (garrison.find((g) => g.id === citizenId)) { notify("Déjà dans la garnison.", "error"); return; }
        garrison.push({ id: citizenId, name: citizen.name });
        properties[pIdx] = { ...properties[pIdx], garrison };
        saveState({ ...state, properties });
        notify(`${citizen.name} ajouté(e) à la garnison.`, "success");
      },

      onRemoveGarrison: (propertyId, citizenId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        if (!isPropertyManager(properties[pIdx], session.id)) { notify("Vous ne gérez pas cette propriété.", "error"); return; }
        properties[pIdx] = { ...properties[pIdx], garrison: (properties[pIdx].garrison || []).filter((g) => g.id !== citizenId) };
        saveState({ ...state, properties });
        notify("Retiré de la garnison.", "info");
      },

      // Château: cachot
      // Le cachot d'une propriété privée (Manoir, Bateau) reflète désormais une véritable
      // incarcération — même mécanisme que le système judiciaire (onGuardImprison/
      // onGuardRelease) : citizen.status passe à "Prisonnier", ce qui le restreint
      // réellement (banque/voyage/marché) ailleurs dans le jeu, au lieu d'un simple
      // enregistrement décoratif sans effet.
      onImprison: (propertyId, citizenId, reason) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        if (!isPropertyManager(properties[pIdx], session.id)) { notify("Vous ne gérez pas cette propriété.", "error"); return; }
        const citizen = (state.citizens || []).find((c) => c.id === citizenId);
        if (!citizen) return;
        if (citizen.status === "Prisonnier") { notify("Ce citoyen est déjà incarcéré.", "error"); return; }
        const dungeon = [...(properties[pIdx].dungeon || [])];
        dungeon.push({ citizenId, citizenName: citizen.name, reason: reason || "Non précisé", since: Date.now() });
        properties[pIdx] = { ...properties[pIdx], dungeon };
        const newCitizens = (state.citizens || []).map((c) => c.id === citizenId ? { ...c, status: "Prisonnier" } : c);
        saveState({ ...state, properties, citizens: newCitizens });
        notify(`${citizen.name} emprisonné(e) dans le cachot.`, "info");
      },

      onReleasePrisoner: (propertyId, citizenId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        if (!isPropertyManager(properties[pIdx], session.id)) { notify("Vous ne gérez pas cette propriété.", "error"); return; }
        const citizen = (state.citizens || []).find((c) => c.id === citizenId);
        properties[pIdx] = { ...properties[pIdx], dungeon: (properties[pIdx].dungeon || []).filter((d) => d.citizenId !== citizenId) };
        const newCitizens = (state.citizens || []).map((c) => c.id === citizenId ? { ...c, status: "Actif" } : c);
        saveState({ ...state, properties, citizens: newCitizens });
        notify(`${citizen?.name || "Prisonnier"} libéré(e).`, "success");
      },

      // Château: audiences
      onRequestAudience: (propertyId, subject, text) => {
        if (!session) return;
        const user = (state.citizens || []).find((c) => c.id === session.id);
        if (!user) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const audiences = [...(properties[pIdx].audiences || [])];
        audiences.push({ id: Date.now(), fromId: session.id, from: user.name, subject: subject || "", text: text || "", date: Date.now(), status: "PENDING" });
        properties[pIdx] = { ...properties[pIdx], audiences };
        saveState({ ...state, properties });
        notify("Demande d'audience envoyée.", "success");
      },

      onRespondAudience: (propertyId, audienceId, status) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        if (!isPropertyManager(properties[pIdx], session.id)) { notify("Vous ne gérez pas cette propriété.", "error"); return; }
        const audiences = (properties[pIdx].audiences || []).map((a) => a.id === audienceId ? { ...a, status } : a);
        properties[pIdx] = { ...properties[pIdx], audiences };
        saveState({ ...state, properties });
        notify(`Audience ${status === "ACCEPTED" ? "acceptée" : "refusée"}.`, "info");
      },

      // Auberge: chambres
      onSetupRooms: (propertyId, rooms) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        if (!isPropertyManager(properties[pIdx], session.id)) { notify("Vous ne gérez pas cette propriété.", "error"); return; }
        // Une chambre occupée ne doit pas pouvoir perdre son locataire ou disparaître via un
        // simple remplacement du tableau — on préserve l'occupation en cours dans tous les cas.
        const existingRooms = properties[pIdx].rooms || [];
        const existingById = new Map(existingRooms.map((r) => [r.id, r]));
        const merged = rooms.map((r) => {
          const prev = existingById.get(r.id);
          return prev && prev.tenantId ? { ...r, tenantId: prev.tenantId, tenantName: prev.tenantName } : r;
        });
        const mergedIds = new Set(merged.map((r) => r.id));
        const droppedOccupied = existingRooms.filter((r) => r.tenantId && !mergedIds.has(r.id));
        properties[pIdx] = { ...properties[pIdx], rooms: [...merged, ...droppedOccupied] };
        saveState({ ...state, properties });
        notify("Chambres mises à jour.", "success");
      },

      onBookRoom: (propertyId, roomId) => {
        if (!session) return;
        const user = (state.citizens || []).find((c) => c.id === session.id);
        if (!user) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const rooms = [...(properties[pIdx].rooms || [])];
        const rIdx = rooms.findIndex((r) => r.id === roomId);
        if (rIdx === -1) return;
        if (rooms[rIdx].tenantId) { notify("Cette chambre est occupée.", "error"); return; }
        if ((user.balance || 0) < rooms[rIdx].pricePerNight) { notify("Fonds insuffisants.", "error"); return; }
        const newCitizens = [...state.citizens];
        const uIdx = newCitizens.findIndex((c) => c.id === session.id);
        newCitizens[uIdx] = { ...newCitizens[uIdx], balance: newCitizens[uIdx].balance - rooms[rIdx].pricePerNight };
        rooms[rIdx] = { ...rooms[rIdx], tenantId: session.id, tenantName: user.name };
        properties[pIdx] = { ...properties[pIdx], rooms };
        // Verser au propriétaire
        let newState = { ...state, citizens: newCitizens, properties };
        if (properties[pIdx].ownerType === "COMPANY") {
          const companies = [...(state.companies || [])];
          const cIdx = companies.findIndex((c) => c.id === properties[pIdx].ownerId);
          if (cIdx !== -1) { companies[cIdx] = { ...companies[cIdx], balance: (companies[cIdx].balance || 0) + rooms[rIdx].pricePerNight }; newState.companies = companies; }
        } else if (properties[pIdx].ownerId) {
          const oIdx = newCitizens.findIndex((c) => c.id === properties[pIdx].ownerId);
          if (oIdx !== -1) newCitizens[oIdx] = { ...newCitizens[oIdx], balance: (newCitizens[oIdx].balance || 0) + rooms[rIdx].pricePerNight };
        }
        newState.globalLedger = [{ id: Date.now(), fromName: user.name, toName: properties[pIdx].ownerName, amount: rooms[rIdx].pricePerNight, timestamp: Date.now(), reason: `Chambre: ${rooms[rIdx].name}`, type: "RENT" }, ...(state.globalLedger || [])];
        saveState(newState);
        notify(`Chambre "${rooms[rIdx].name}" réservée.`, "success");
      },

      onCheckoutRoom: (propertyId, roomId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const room = (properties[pIdx].rooms || []).find((r) => r.id === roomId);
        if (!room) return;
        const isTenant = String(room.tenantId) === String(session.id);
        if (!isTenant && !isPropertyManager(properties[pIdx], session.id)) { notify("Vous ne pouvez pas libérer cette chambre.", "error"); return; }
        const rooms = (properties[pIdx].rooms || []).map((r) => r.id === roomId ? { ...r, tenantId: null, tenantName: null } : r);
        properties[pIdx] = { ...properties[pIdx], rooms };
        saveState({ ...state, properties });
        notify("Chambre libérée.", "info");
      },

      // Auberge: taverne (messages)
      onPostTavernMessage: (propertyId, text) => {
        if (!session) return;
        const user = (state.citizens || []).find((c) => c.id === session.id);
        if (!user) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const msgs = [...(properties[pIdx].tavernMessages || [])];
        msgs.push({ id: Date.now(), authorName: user.name, text, timestamp: Date.now() });
        if (msgs.length > 50) msgs.shift();
        properties[pIdx] = { ...properties[pIdx], tavernMessages: msgs };
        saveState({ ...state, properties });
      },

      // Auberge: rumeurs
      onPostRumor: (propertyId, text) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const rumors = [...(properties[pIdx].rumors || [])];
        rumors.push({ id: Date.now(), text, timestamp: Date.now() });
        properties[pIdx] = { ...properties[pIdx], rumors };
        saveState({ ...state, properties });
        notify("Rumeur affichée anonymement.", "success");
      },

      onDeleteRumor: (propertyId, rumorId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        if (!isPropertyManager(properties[pIdx], session.id)) { notify("Vous ne gérez pas cette propriété.", "error"); return; }
        properties[pIdx] = { ...properties[pIdx], rumors: (properties[pIdx].rumors || []).filter((r) => r.id !== rumorId) };
        saveState({ ...state, properties });
      },

      // Auberge: menu (vente nourriture)
      onBuyFromMenu: (propertyId, itemName) => {
        if (!session) return;
        const user = (state.citizens || []).find((c) => c.id === session.id);
        if (!user) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const menu = [...(properties[pIdx].menu || [])];
        const mIdx = menu.findIndex((m) => m.itemName === itemName);
        const infinite = menu[mIdx]?.stock === -1;
        if (mIdx === -1 || (!infinite && menu[mIdx].stock <= 0)) { notify("Article indisponible.", "error"); return; }
        if ((user.balance || 0) < menu[mIdx].price) { notify("Fonds insuffisants.", "error"); return; }
        const price = menu[mIdx].price;
        if (!infinite) menu[mIdx] = { ...menu[mIdx], stock: menu[mIdx].stock - 1 };
        const newCitizens = [...state.citizens];
        const uIdx = newCitizens.findIndex((c) => c.id === session.id);
        newCitizens[uIdx] = { ...newCitizens[uIdx], balance: newCitizens[uIdx].balance - price };
        properties[pIdx] = { ...properties[pIdx], menu };
        let newState = { ...state, citizens: newCitizens, properties };
        if (properties[pIdx].ownerType === "COMPANY") {
          const companies = [...(state.companies || [])];
          const cIdx = companies.findIndex((c) => c.id === properties[pIdx].ownerId);
          if (cIdx !== -1) { companies[cIdx] = { ...companies[cIdx], balance: (companies[cIdx].balance || 0) + price }; newState.companies = companies; }
        } else if (properties[pIdx].ownerId) {
          const oIdx = newCitizens.findIndex((c) => c.id === properties[pIdx].ownerId);
          if (oIdx !== -1) newCitizens[oIdx] = { ...newCitizens[oIdx], balance: (newCitizens[oIdx].balance || 0) + price };
        }
        newState.globalLedger = [{ id: Date.now(), fromName: user.name, toName: properties[pIdx].ownerName, amount: price, timestamp: Date.now(), reason: `Menu: ${itemName}`, type: "PROPERTY_SALE" }, ...(state.globalLedger || [])].slice(0, 1000);
        saveState(newState);
        notify(`Vous dégustez ${itemName}. Bon appétit !`, "success");
      },

      // Commerce: acheter au shop
      onBuyFromShop: (propertyId, itemName) => {
        if (!session) return;
        const user = (state.citizens || []).find((c) => c.id === session.id);
        if (!user) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const stock = [...(properties[pIdx].shopStock || [])];
        const sIdx = stock.findIndex((s) => s.itemName === itemName);
        if (sIdx === -1 || stock[sIdx].qty <= 0) { notify("Article indisponible.", "error"); return; }
        if ((user.balance || 0) < stock[sIdx].price) { notify("Fonds insuffisants.", "error"); return; }
        stock[sIdx] = { ...stock[sIdx], qty: stock[sIdx].qty - 1 };
        const newCitizens = [...state.citizens];
        const uIdx = newCitizens.findIndex((c) => c.id === session.id);
        const inv = [...(newCitizens[uIdx].inventory || [])];
        const existingItem = inv.findIndex((i) => i.name === itemName);
        if (existingItem !== -1) inv[existingItem] = { ...inv[existingItem], quantity: inv[existingItem].quantity + 1 };
        else inv.push({ name: itemName, quantity: 1 });
        newCitizens[uIdx] = { ...newCitizens[uIdx], balance: newCitizens[uIdx].balance - stock[sIdx].price, inventory: inv };
        properties[pIdx] = { ...properties[pIdx], shopStock: stock };
        let newState = { ...state, citizens: newCitizens, properties };
        if (properties[pIdx].ownerType === "COMPANY") {
          const companies = [...(state.companies || [])];
          const cIdx = companies.findIndex((c) => c.id === properties[pIdx].ownerId);
          if (cIdx !== -1) { companies[cIdx] = { ...companies[cIdx], balance: (companies[cIdx].balance || 0) + stock[sIdx].price }; newState.companies = companies; }
        } else if (properties[pIdx].ownerId) {
          const oIdx = newCitizens.findIndex((c) => c.id === properties[pIdx].ownerId);
          if (oIdx !== -1) newCitizens[oIdx] = { ...newCitizens[oIdx], balance: (newCitizens[oIdx].balance || 0) + stock[sIdx].price };
        }
        newState.globalLedger = [{ id: Date.now(), fromName: user.name, toName: properties[pIdx].ownerName, amount: stock[sIdx].price, timestamp: Date.now(), reason: `Boutique: ${itemName}`, type: "PROPERTY_SALE" }, ...(state.globalLedger || [])];
        saveState(newState);
        notify(`${itemName} acheté(e) !`, "success");
      },

      // Staff commun
      onAddPropertyStaff: (propertyId, citizenId, role, salary) => {
        if (!session) return;
        const citizen = (state.citizens || []).find((c) => c.id === citizenId);
        if (!citizen) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        if (!isPropertyManager(properties[pIdx], session.id)) { notify("Vous ne gérez pas cette propriété.", "error"); return; }
        const staff = [...(properties[pIdx].staff || [])];
        if (staff.find((s) => s.id === citizenId)) { notify("Déjà employé.", "error"); return; }
        staff.push({ id: citizenId, name: citizen.name, role: role || "Employé", salary: parseFloat(salary) || 0 });
        properties[pIdx] = { ...properties[pIdx], staff };
        saveState({ ...state, properties });
        notify(`${citizen.name} embauché(e) comme ${role || "employé"}.`, "success");
      },

      onUpdatePropertyStaff: (propertyId, citizenId, { role, salary }) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        if (!isPropertyManager(properties[pIdx], session.id)) { notify("Vous ne gérez pas cette propriété.", "error"); return; }
        const staff = (properties[pIdx].staff || []).map((s) =>
          s.id === citizenId ? { ...s, role: role !== undefined ? (role || "Employé") : s.role, salary: salary !== undefined ? (parseFloat(salary) || 0) : s.salary } : s
        );
        properties[pIdx] = { ...properties[pIdx], staff };
        saveState({ ...state, properties });
        notify("Fiche mise à jour.", "success");
      },

      onRemovePropertyStaff: (propertyId, citizenId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        if (!isPropertyManager(properties[pIdx], session.id)) { notify("Vous ne gérez pas cette propriété.", "error"); return; }
        properties[pIdx] = { ...properties[pIdx], staff: (properties[pIdx].staff || []).filter((s) => s.id !== citizenId) };
        saveState({ ...state, properties });
        notify("Employé retiré.", "info");
      },

      // Liste des invités — pour un bateau, seuls l'équipage (staff) et les invités
      // peuvent visiter le bien ; contrairement au personnel, réservé au propriétaire.
      onAddPropertyGuest: (propertyId, citizenId) => {
        if (!session) return;
        const citizen = (state.citizens || []).find((c) => c.id === citizenId);
        if (!citizen) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const prop = properties[pIdx];
        if (!isPropertyManager(prop, session.id)) { notify("Seul le propriétaire peut inviter un visiteur.", "error"); return; }
        const guestList = [...(prop.guestList || [])];
        if (guestList.find((g) => g.id === citizenId)) { notify("Déjà invité(e).", "error"); return; }
        guestList.push({ id: citizenId, name: citizen.name });
        properties[pIdx] = { ...prop, guestList };
        saveState({ ...state, properties });
        notify(`${citizen.name} est désormais invité(e) à visiter.`, "success");
      },

      onRemovePropertyGuest: (propertyId, citizenId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const prop = properties[pIdx];
        if (!isPropertyManager(prop, session.id)) { notify("Seul le propriétaire peut retirer un invité.", "error"); return; }
        properties[pIdx] = { ...prop, guestList: (prop.guestList || []).filter((g) => g.id !== citizenId) };
        saveState({ ...state, properties });
        notify("Invité retiré.", "info");
      },

      // Événements propriété
      onAddPropertyEvent: (propertyId, { title, desc, date }) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        if (!isPropertyManager(properties[pIdx], session.id)) { notify("Vous ne gérez pas cette propriété.", "error"); return; }
        const events = [...(properties[pIdx].propertyEvents || [])];
        events.push({ id: Date.now(), title, desc: desc || "", date: date || "" });
        properties[pIdx] = { ...properties[pIdx], propertyEvents: events };
        saveState({ ...state, properties });
        notify("Événement ajouté.", "success");
      },

      onRemovePropertyEvent: (propertyId, eventId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        if (!isPropertyManager(properties[pIdx], session.id)) { notify("Vous ne gérez pas cette propriété.", "error"); return; }
        properties[pIdx] = { ...properties[pIdx], propertyEvents: (properties[pIdx].propertyEvents || []).filter((e) => e.id !== eventId) };
        saveState({ ...state, properties });
      },

      // --- LOCATION IMMOBILIÈRE ---
      onListPropertyForRent: (propertyId, dailyRate) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const prop = properties[pIdx];
        if (!isPropertyManager(prop, session.id)) { notify("Ce n'est pas votre propriété.", "error"); return; }
        const rate = parseFloat(dailyRate);
        if (!rate || rate <= 0) { notify("Tarif invalide.", "error"); return; }
        if (prop.rental && prop.rental.tenantId) { notify("Un locataire occupe déjà ce bien.", "error"); return; }
        properties[pIdx] = { ...prop, rental: { dailyRate: rate, tenantId: null, tenantName: null, startDate: null } };
        saveState({ ...state, properties });
        notify(`"${prop.name}" proposée à la location pour ${formatMoney(rate)}/jour.`, "success");
      },

      onCancelPropertyRental: (propertyId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        if (!isPropertyManager(properties[pIdx], session.id)) { notify("Ce n'est pas votre propriété.", "error"); return; }
        properties[pIdx] = { ...properties[pIdx], rental: null };
        saveState({ ...state, properties });
        notify("Annonce de location retirée.", "info");
      },

      onRentProperty: (propertyId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) { notify("Propriété introuvable.", "error"); return; }
        const prop = properties[pIdx];
        if (!prop.rental || !prop.rental.dailyRate) { notify("Ce bien n'est pas à louer.", "error"); return; }
        if (prop.rental.tenantId) { notify("Ce bien est déjà loué.", "error"); return; }
        if (prop.ownerId === session.id) { notify("Vous ne pouvez pas louer votre propre bien.", "error"); return; }
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const user = state.citizens[userIdx];
        if ((user.balance || 0) < prop.rental.dailyRate) { notify("Fonds insuffisants pour le premier jour de loyer.", "error"); return; }
        // Prélever le premier jour
        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = { ...user, balance: user.balance - prop.rental.dailyRate };
        const ownerIdx = newCitizens.findIndex((c) => c.id === prop.ownerId);
        if (ownerIdx !== -1) {
          newCitizens[ownerIdx] = { ...newCitizens[ownerIdx], balance: (newCitizens[ownerIdx].balance || 0) + prop.rental.dailyRate };
        }
        const gameDate = state.gameDate || { day: 1, month: 1, year: 1200 };
        properties[pIdx] = {
          ...prop,
          rental: { ...prop.rental, tenantId: session.id, tenantName: user.name, startDate: `${gameDate.day}/${gameDate.month}/${gameDate.year}` },
        };
        const ledgerEntry = {
          id: Date.now(),
          fromName: user.name,
          toName: ownerIdx !== -1 ? newCitizens[ownerIdx].name : prop.ownerName,
          amount: prop.rental.dailyRate,
          timestamp: Date.now(),
          reason: `Loyer (1er jour) : ${prop.name}`,
          type: "RENT",
        };
        const propertyAlerts = ownerIdx !== -1
          ? [...(state.propertyAlerts || []), { id: `palert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, toId: prop.ownerId, type: "new_tenant", propertyId: prop.id, propertyName: prop.name, otherName: user.name, amount: prop.rental.dailyRate, timestamp: Date.now() }]
          : (state.propertyAlerts || []);
        saveState({
          ...state,
          citizens: newCitizens,
          properties,
          globalLedger: [ledgerEntry, ...(state.globalLedger || [])],
          propertyAlerts,
        });
        notify(`Vous louez "${prop.name}" pour ${formatMoney(prop.rental.dailyRate)}/jour.`, "success");
      },

      onEvictTenant: (propertyId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const prop = properties[pIdx];
        if (!isPropertyManager(prop, session.id)) { notify("Ce n'est pas votre propriété.", "error"); return; }
        if (!prop.rental || !prop.rental.tenantId) { notify("Aucun locataire.", "error"); return; }
        const tenantName = prop.rental.tenantName;
        const tenantId = prop.rental.tenantId;
        properties[pIdx] = { ...prop, rental: { ...prop.rental, tenantId: null, tenantName: null, startDate: null } };
        const propertyAlerts = [...(state.propertyAlerts || []), { id: `palert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, toId: tenantId, type: "evicted", propertyId: prop.id, propertyName: prop.name, timestamp: Date.now() }];
        saveState({ ...state, properties, propertyAlerts });
        notify(`${tenantName} a été expulsé(e) de "${prop.name}".`, "info");
      },

      onLeaveTenancy: (propertyId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const prop = properties[pIdx];
        if (!prop.rental || prop.rental.tenantId !== session.id) { notify("Vous n'êtes pas locataire de ce bien.", "error"); return; }
        properties[pIdx] = { ...prop, rental: { ...prop.rental, tenantId: null, tenantName: null, startDate: null } };
        saveState({ ...state, properties });
        notify(`Vous avez quitté "${prop.name}".`, "info");
      },

      // --- FAVORIS / RACCOURCIS ---
      onToggleFavorite: (favoriteData) => {
        if (!session) return;
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const newCitizens = [...state.citizens];
        const favs = [...(newCitizens[userIdx].favorites || [])];
        const existingIdx = favs.findIndex((f) => f.type === favoriteData.type && f.id === favoriteData.id);
        if (existingIdx !== -1) {
          favs.splice(existingIdx, 1);
        } else {
          favs.push({ type: favoriteData.type, id: favoriteData.id, label: favoriteData.label });
        }
        newCitizens[userIdx] = { ...newCitizens[userIdx], favorites: favs };
        saveState({ ...state, citizens: newCitizens });
      },

      // ========== TRIBUNAL ==========
      onCreateTrial: ({ accusedId, plaintiff, charge, description }) => {
        const accused = (state.citizens || []).find((c) => c.id === accusedId);
        if (!accused) { notify("Accusé introuvable.", "error"); return; }
        const trial = {
          id: `trial-${Date.now()}`,
          accusedId,
          accusedName: accused.name,
          plaintiff: plaintiff || "Le Ministère Public",
          charge: charge || "Infraction non précisée",
          description: description || "",
          status: "PENDING", // PENDING, IN_PROGRESS, VERDICT
          judgeId: null, judgeName: null,
          lawyerDefenseId: null, lawyerDefenseName: null,
          lawyerProsecutionId: null, lawyerProsecutionName: null,
          arguments: [],
          verdict: null, // GUILTY, NOT_GUILTY, DISMISSED
          sentence: null, // { type: "FINE"|"PRISON"|"EXILE"|"CUSTOM", amount, duration, text }
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        saveState({ ...state, trials: [trial, ...(state.trials || [])] });
        notify(`Procès ouvert contre ${accused.name}.`, "success");
      },

      onAssignTrialRole: (trialId, role, citizenId) => {
        const trials = [...(state.trials || [])];
        const idx = trials.findIndex((t) => t.id === trialId);
        if (idx === -1) return;
        const citizen = (state.citizens || []).find((c) => c.id === citizenId);
        if (!citizen) { notify("Citoyen introuvable.", "error"); return; }
        const update = {};
        if (role === "judge") { update.judgeId = citizenId; update.judgeName = citizen.name; }
        else if (role === "defense") { update.lawyerDefenseId = citizenId; update.lawyerDefenseName = citizen.name; }
        else if (role === "prosecution") { update.lawyerProsecutionId = citizenId; update.lawyerProsecutionName = citizen.name; }
        trials[idx] = { ...trials[idx], ...update, status: "IN_PROGRESS", updatedAt: Date.now() };
        saveState({ ...state, trials });
        notify(`${citizen.name} assigné(e) comme ${role === "judge" ? "juge" : role === "defense" ? "avocat de la défense" : "procureur"}.`, "success");
      },

      onAddTrialArgument: (trialId, { authorName, side, text }) => {
        const trials = [...(state.trials || [])];
        const idx = trials.findIndex((t) => t.id === trialId);
        if (idx === -1) return;
        const args = [...(trials[idx].arguments || [])];
        args.push({ id: Date.now(), authorName, side, text, timestamp: Date.now() });
        trials[idx] = { ...trials[idx], arguments: args, updatedAt: Date.now() };
        saveState({ ...state, trials });
        notify("Argument ajouté au dossier.", "success");
      },

      onRenderVerdict: (trialId, { verdict, sentence }) => {
        const trials = [...(state.trials || [])];
        const idx = trials.findIndex((t) => t.id === trialId);
        if (idx === -1) return;
        const trial = trials[idx];
        trials[idx] = { ...trial, status: "VERDICT", verdict, sentence, updatedAt: Date.now() };
        // Appliquer l'amende si GUILTY + FINE
        const newCitizens = [...(state.citizens || [])];
        let newTreasury = state.treasury || 0;
        const newLedger = [...(state.globalLedger || [])];
        if (verdict === "GUILTY" && sentence?.type === "FINE" && sentence.amount > 0) {
          const accIdx = newCitizens.findIndex((c) => c.id === trial.accusedId);
          if (accIdx !== -1) {
            newCitizens[accIdx] = { ...newCitizens[accIdx], balance: (newCitizens[accIdx].balance || 0) - sentence.amount };
            newTreasury += sentence.amount;
            newLedger.unshift({
              id: Date.now(), fromName: trial.accusedName, toName: "Trésor (Amende)",
              amount: sentence.amount, timestamp: Date.now(),
              reason: `Amende : ${trial.charge}`, type: "TRIAL_FINE",
            });
          }
        }
        // Casier judiciaire
        if (verdict === "GUILTY") {
          const accIdx = newCitizens.findIndex((c) => c.id === trial.accusedId);
          if (accIdx !== -1) {
            const record = [...(newCitizens[accIdx].criminalRecord || [])];
            record.push({
              trialId, charge: trial.charge, verdict, sentence,
              date: Date.now(), judgeName: trial.judgeName,
            });
            newCitizens[accIdx] = { ...newCitizens[accIdx], criminalRecord: record };
          }
        }
        saveState({ ...state, trials, citizens: newCitizens, treasury: newTreasury, globalLedger: newLedger });
        notify(`Verdict rendu : ${verdict === "GUILTY" ? "Coupable" : verdict === "NOT_GUILTY" ? "Non coupable" : "Affaire classée"}.`, verdict === "GUILTY" ? "error" : "success");
      },

      onDeleteTrial: (trialId) => {
        saveState({ ...state, trials: (state.trials || []).filter((t) => t.id !== trialId) });
        notify("Procès supprimé.", "info");
      },

      // ========== GUILDES / ASSOCIATIONS ==========
      onCreateGuild: ({ name, description, type }) => {
        if (!session) return;
        const user = (state.citizens || []).find((c) => c.id === session.id);
        if (!user) return;
        const guild = {
          id: `guild-${Date.now()}`,
          name: name || "Guilde sans nom",
          description: description || "",
          type: type || "GENERAL", // GENERAL, COMMERCE, MILITAIRE, RELIGIEUX, ARTISAN
          leaderId: session.id,
          leaderName: user.name,
          members: [{ id: session.id, name: user.name, role: "Chef", joinedAt: Date.now() }],
          balance: 0,
          createdAt: Date.now(),
          motto: "",
          isRecruiting: true,
        };
        saveState({ ...state, guilds: [guild, ...(state.guilds || [])] });
        notify(`Guilde "${name}" fondée !`, "success");
      },

      onEditGuild: (guildId, updates) => {
        if (!session) return;
        const guilds = [...(state.guilds || [])];
        const idx = guilds.findIndex((g) => g.id === guildId);
        if (idx === -1) return;
        if (guilds[idx].leaderId !== session.id) { notify("Seul le chef peut modifier la guilde.", "error"); return; }
        guilds[idx] = { ...guilds[idx], ...updates };
        saveState({ ...state, guilds });
        notify("Guilde mise à jour.", "success");
      },

      onJoinGuild: (guildId) => {
        if (!session) return;
        const user = (state.citizens || []).find((c) => c.id === session.id);
        if (!user) return;
        const guilds = [...(state.guilds || [])];
        const idx = guilds.findIndex((g) => g.id === guildId);
        if (idx === -1) return;
        if (!guilds[idx].isRecruiting) { notify("Cette guilde ne recrute pas.", "error"); return; }
        const members = [...(guilds[idx].members || [])];
        if (members.find((m) => m.id === session.id)) { notify("Vous êtes déjà membre.", "error"); return; }
        members.push({ id: session.id, name: user.name, role: "Membre", joinedAt: Date.now() });
        guilds[idx] = { ...guilds[idx], members };
        saveState({ ...state, guilds });
        notify(`Vous avez rejoint "${guilds[idx].name}".`, "success");
      },

      onLeaveGuild: (guildId) => {
        if (!session) return;
        const guilds = [...(state.guilds || [])];
        const idx = guilds.findIndex((g) => g.id === guildId);
        if (idx === -1) return;
        if (guilds[idx].leaderId === session.id) { notify("Le chef ne peut pas quitter. Transférez d'abord le rôle ou dissolvez la guilde.", "error"); return; }
        guilds[idx] = { ...guilds[idx], members: (guilds[idx].members || []).filter((m) => m.id !== session.id) };
        saveState({ ...state, guilds });
        notify("Vous avez quitté la guilde.", "info");
      },

      onKickGuildMember: (guildId, memberId) => {
        if (!session) return;
        const guilds = [...(state.guilds || [])];
        const idx = guilds.findIndex((g) => g.id === guildId);
        if (idx === -1) return;
        if (guilds[idx].leaderId !== session.id) { notify("Seul le chef peut exclure.", "error"); return; }
        if (memberId === session.id) return;
        const kicked = (guilds[idx].members || []).find((m) => m.id === memberId);
        guilds[idx] = { ...guilds[idx], members: (guilds[idx].members || []).filter((m) => m.id !== memberId) };
        saveState({ ...state, guilds });
        notify(`${kicked?.name || "Membre"} exclu de la guilde.`, "info");
      },

      onSetGuildMemberRole: (guildId, memberId, role) => {
        if (!session) return;
        const guilds = [...(state.guilds || [])];
        const idx = guilds.findIndex((g) => g.id === guildId);
        if (idx === -1) return;
        if (guilds[idx].leaderId !== session.id) return;
        const members = (guilds[idx].members || []).map((m) => m.id === memberId ? { ...m, role } : m);
        guilds[idx] = { ...guilds[idx], members };
        saveState({ ...state, guilds });
        notify("Rôle mis à jour.", "success");
      },

      onTransferGuildLeadership: (guildId, newLeaderId) => {
        if (!session) return;
        const guilds = [...(state.guilds || [])];
        const idx = guilds.findIndex((g) => g.id === guildId);
        if (idx === -1) return;
        if (guilds[idx].leaderId !== session.id) return;
        const newLeader = (guilds[idx].members || []).find((m) => m.id === newLeaderId);
        if (!newLeader) { notify("Ce citoyen n'est pas membre.", "error"); return; }
        const members = (guilds[idx].members || []).map((m) => {
          if (m.id === newLeaderId) return { ...m, role: "Chef" };
          if (m.id === session.id) return { ...m, role: "Membre" };
          return m;
        });
        guilds[idx] = { ...guilds[idx], leaderId: newLeaderId, leaderName: newLeader.name, members };
        saveState({ ...state, guilds });
        notify(`Direction transférée à ${newLeader.name}.`, "success");
      },

      onGuildDeposit: (guildId, amount) => {
        if (!session) return;
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { notify("Montant invalide.", "error"); return; }
        const userIdx = (state.citizens || []).findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        if ((state.citizens[userIdx].balance || 0) < amt) { notify("Fonds insuffisants.", "error"); return; }
        const guilds = [...(state.guilds || [])];
        const gIdx = guilds.findIndex((g) => g.id === guildId);
        if (gIdx === -1) return;
        if (!(guilds[gIdx].members || []).find((m) => m.id === session.id)) { notify("Vous n'êtes pas membre.", "error"); return; }
        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = { ...newCitizens[userIdx], balance: newCitizens[userIdx].balance - amt };
        guilds[gIdx] = { ...guilds[gIdx], balance: (guilds[gIdx].balance || 0) + amt };
        const ledgerEntry = {
          id: Date.now(), fromName: newCitizens[userIdx].name, toName: `Guilde: ${guilds[gIdx].name}`,
          amount: amt, timestamp: Date.now(), reason: "Cotisation guilde", type: "GUILD",
        };
        saveState({ ...state, citizens: newCitizens, guilds, globalLedger: [ledgerEntry, ...(state.globalLedger || [])] });
        notify(`${formatMoney(amt)} déposés dans la caisse de la guilde.`, "success");
      },

      onGuildWithdraw: (guildId, amount) => {
        if (!session) return;
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { notify("Montant invalide.", "error"); return; }
        const guilds = [...(state.guilds || [])];
        const gIdx = guilds.findIndex((g) => g.id === guildId);
        if (gIdx === -1) return;
        if (guilds[gIdx].leaderId !== session.id) { notify("Seul le chef peut retirer des fonds.", "error"); return; }
        if ((guilds[gIdx].balance || 0) < amt) { notify("Fonds insuffisants.", "error"); return; }
        const userIdx = (state.citizens || []).findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = { ...newCitizens[userIdx], balance: (newCitizens[userIdx].balance || 0) + amt };
        guilds[gIdx] = { ...guilds[gIdx], balance: guilds[gIdx].balance - amt };
        const ledgerEntry = {
          id: Date.now(), fromName: `Guilde: ${guilds[gIdx].name}`, toName: newCitizens[userIdx].name,
          amount: amt, timestamp: Date.now(), reason: "Retrait guilde", type: "GUILD",
        };
        saveState({ ...state, citizens: newCitizens, guilds, globalLedger: [ledgerEntry, ...(state.globalLedger || [])] });
        notify(`${formatMoney(amt)} retirés de la caisse.`, "success");
      },

      onDissolveGuild: (guildId) => {
        if (!session) return;
        const guilds = [...(state.guilds || [])];
        const gIdx = guilds.findIndex((g) => g.id === guildId);
        if (gIdx === -1) return;
        if (guilds[gIdx].leaderId !== session.id) { notify("Seul le chef peut dissoudre.", "error"); return; }
        // Rendre le solde au chef
        const remaining = guilds[gIdx].balance || 0;
        const newCitizens = [...(state.citizens || [])];
        if (remaining > 0) {
          const userIdx = newCitizens.findIndex((c) => c.id === session.id);
          if (userIdx !== -1) newCitizens[userIdx] = { ...newCitizens[userIdx], balance: (newCitizens[userIdx].balance || 0) + remaining };
        }
        const name = guilds[gIdx].name;
        saveState({ ...state, guilds: guilds.filter((g) => g.id !== guildId), citizens: newCitizens });
        notify(`Guilde "${name}" dissoute.${remaining > 0 ? ` ${formatMoney(remaining)} restitués.` : ""}`, "info");
      },

      // ========== GESTION FAMILLE / DYNASTIE (CITOYEN) ==========
      onSetFamilyHead: (familyId, citizenId) => {
        const families = [...(state.families || [])];
        const fIdx = families.findIndex((f) => f.id === familyId);
        if (fIdx === -1) return;
        const citizen = (state.citizens || []).find((c) => c.id === citizenId);
        families[fIdx] = { ...families[fIdx], headId: citizenId, headName: citizen ? citizen.name : null };
        saveState({ ...state, families });
        notify(`${citizen ? citizen.name : "Citoyen"} est désormais chef de famille.`, "success");
      },

      onSetFamilyRegent: (familyId, citizenId) => {
        if (!session) return;
        const families = [...(state.families || [])];
        const fIdx = families.findIndex((f) => f.id === familyId);
        if (fIdx === -1) return;
        const fam = families[fIdx];
        if (fam.headId !== session.id && fam.regentId !== session.id) { notify("Seul le chef ou le régent peut nommer un régent.", "error"); return; }
        const citizen = (state.citizens || []).find((c) => c.id === citizenId);
        families[fIdx] = { ...fam, regentId: citizenId, regentName: citizen ? citizen.name : null };
        saveState({ ...state, families });
        notify(`${citizen ? citizen.name : "Citoyen"} est désormais régent de la famille.`, "success");
      },

      onRemoveFamilyRegent: (familyId) => {
        const families = [...(state.families || [])];
        const fIdx = families.findIndex((f) => f.id === familyId);
        if (fIdx === -1) return;
        const fam = families[fIdx];
        const isAdmin = session?.role === "ADMIN" || session?.isAdmin;
        if (!isAdmin && fam.headId !== session?.id) { notify("Seul le chef de famille peut révoquer un régent.", "error"); return; }
        families[fIdx] = { ...fam, regentId: null, regentName: null };
        saveState({ ...state, families });
        notify("Le régent a été révoqué.", "info");
      },

      onSubmitBook: (countryId, bookData) => {
        if (!session) return;
        const countries = [...(state.countries || [])];
        const cIdx = countries.findIndex((c) => c.id === countryId);
        if (cIdx === -1) return;
        const pending = countries[cIdx].pendingBooks || [];
        const newPending = {
          ...bookData,
          id: Date.now(),
          authorId: session.id,
          authorName: session.firstName ? `${session.firstName} ${session.lastName || ""}`.trim() : session.name,
          date: new Date().toISOString(),
          status: "pending",
        };
        countries[cIdx] = { ...countries[cIdx], pendingBooks: [newPending, ...pending] };
        saveState({ ...state, countries });
        notify("Votre texte a été soumis et sera examiné par l'administration.", "success");
      },

      onFamilyDeposit: (familyId, amount) => {
        if (!session) return;
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { notify("Montant invalide.", "error"); return; }
        const families = [...(state.families || [])];
        const fIdx = families.findIndex((f) => f.id === familyId);
        if (fIdx === -1) return;
        const newCitizens = [...(state.citizens || [])];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        if ((newCitizens[userIdx].balance || 0) < amt) { notify("Fonds insuffisants.", "error"); return; }
        const ts = Date.now();
        const userName = newCitizens[userIdx].name;
        newCitizens[userIdx] = { ...newCitizens[userIdx], balance: (newCitizens[userIdx].balance || 0) - amt };
        const famName = families[fIdx].dynastyName || families[fIdx].lastName;
        const logEntry = { id: ts, type: "deposit", amount: amt, actor: userName, label: `Dépôt par ${userName}`, timestamp: ts };
        families[fIdx] = { ...families[fIdx], treasury: (families[fIdx].treasury || 0) + amt, treasuryLog: [logEntry, ...(families[fIdx].treasuryLog || [])].slice(0, 60) };
        const ledgerEntry = { id: ts, fromName: userName, toName: `Famille: ${famName}`, amount: amt, timestamp: ts, reason: "Dépôt trésorerie familiale", type: "FAMILY" };
        saveState({ ...state, citizens: newCitizens, families, globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
        notify(`${formatMoney(amt)} déposés dans la trésorerie familiale.`, "success");
      },

      onFamilyWithdraw: (familyId, amount) => {
        if (!session) return;
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { notify("Montant invalide.", "error"); return; }
        const families = [...(state.families || [])];
        const fIdx = families.findIndex((f) => f.id === familyId);
        if (fIdx === -1) return;
        const fam = families[fIdx];
        if (fam.headId !== session.id && fam.regentId !== session.id) { notify("Seul le chef ou le régent peut retirer des fonds.", "error"); return; }
        if ((fam.treasury || 0) < amt) { notify("Fonds insuffisants.", "error"); return; }
        const newCitizens = [...(state.citizens || [])];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const ts = Date.now();
        const userName = newCitizens[userIdx].name;
        newCitizens[userIdx] = { ...newCitizens[userIdx], balance: (newCitizens[userIdx].balance || 0) + amt };
        const famName = fam.dynastyName || fam.lastName;
        const logEntry = { id: ts, type: "withdraw", amount: amt, actor: userName, label: `Retrait par ${userName}`, timestamp: ts };
        families[fIdx] = { ...fam, treasury: (fam.treasury || 0) - amt, treasuryLog: [logEntry, ...(fam.treasuryLog || [])].slice(0, 60) };
        const ledgerEntry = { id: ts, fromName: `Famille: ${famName}`, toName: userName, amount: amt, timestamp: ts, reason: "Retrait trésorerie familiale", type: "FAMILY" };
        saveState({ ...state, citizens: newCitizens, families, globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
        notify(`${formatMoney(amt)} retirés de la trésorerie familiale.`, "success");
      },

      onFamilyTreasuryTransfer: (fromFamilyId, toFamilyId, amount, reason) => {
        if (!session) return;
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { notify("Montant invalide.", "error"); return; }
        if (fromFamilyId === toFamilyId) { notify("Impossible de transférer vers la même famille.", "error"); return; }
        const families = [...(state.families || [])];
        const fromIdx = families.findIndex((f) => f.id === fromFamilyId);
        const toIdx = families.findIndex((f) => f.id === toFamilyId);
        if (fromIdx === -1 || toIdx === -1) return;
        const fromFam = families[fromIdx];
        const toFam = families[toIdx];
        if (fromFam.headId !== session.id && fromFam.regentId !== session.id) { notify("Seul le chef ou le régent peut effectuer un virement.", "error"); return; }
        if ((fromFam.treasury || 0) < amt) { notify("Fonds insuffisants dans la trésorerie.", "error"); return; }
        const ts = Date.now();
        const fromName = fromFam.dynastyName || fromFam.lastName;
        const toName = toFam.dynastyName || toFam.lastName;
        const motif = reason || "Virement inter-familles";
        families[fromIdx] = { ...fromFam, treasury: (fromFam.treasury || 0) - amt,
          treasuryLog: [{ id: ts, type: "transfer_out", amount: amt, label: `Virement vers famille ${toName} — ${motif}`, timestamp: ts }, ...(fromFam.treasuryLog || [])].slice(0, 60) };
        families[toIdx] = { ...toFam, treasury: (toFam.treasury || 0) + amt,
          treasuryLog: [{ id: ts, type: "transfer_in", amount: amt, label: `Virement reçu de famille ${fromName} — ${motif}`, timestamp: ts }, ...(toFam.treasuryLog || [])].slice(0, 60) };
        const ledgerEntry = { id: ts, fromName: `Famille: ${fromName}`, toName: `Famille: ${toName}`, amount: amt, timestamp: ts, reason: motif, type: "FAMILY_TRANSFER" };
        saveState({ ...state, families, globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
        notify(`${formatMoney(amt)} transférés vers la famille ${toName}.`, "success");
      },

      onEditFamilyInfo: (familyId, updates) => {
        if (!session) return;
        const families = [...(state.families || [])];
        const fIdx = families.findIndex((f) => f.id === familyId);
        if (fIdx === -1) return;
        const fam = families[fIdx];
        if (fam.headId !== session.id && fam.regentId !== session.id) { notify("Seul le chef ou le régent peut modifier ces informations.", "error"); return; }
        families[fIdx] = { ...fam, ...updates };
        saveState({ ...state, families });
        notify("Informations familiales mises à jour.", "success");
      },

      onTransferFamilyHead: (familyId, newHeadId) => {
        if (!session) return;
        const families = [...(state.families || [])];
        const fIdx = families.findIndex((f) => f.id === familyId);
        if (fIdx === -1) return;
        const fam = families[fIdx];
        if (fam.headId !== session.id && fam.regentId !== session.id) { notify("Seul le chef ou le régent peut transférer le titre.", "error"); return; }
        const newHead = (state.citizens || []).find((c) => c.id === newHeadId);
        families[fIdx] = { ...fam, headId: newHeadId, headName: newHead ? newHead.name : null, regentId: null, regentName: null };
        saveState({ ...state, families });
        notify(`Le titre de chef de famille a été transféré à ${newHead ? newHead.name : "un autre membre"}.`, "success");
      },

      // ========== CONTRATS NOTARIÉS ==========
      onCreateContract: ({ title, parties, clauses, expiresAt }) => {
        if (!session) return;
        const user = (state.citizens || []).find((c) => c.id === session.id);
        if (!user) return;
        const partyList = (parties || []).map((pId) => {
          const c = (state.citizens || []).find((c) => c.id === pId);
          return { id: pId, name: c ? c.name : "Inconnu", signed: pId === session.id, signedAt: pId === session.id ? Date.now() : null };
        });
        // S'assurer que le créateur est dans les parties
        if (!partyList.find((p) => p.id === session.id)) {
          partyList.unshift({ id: session.id, name: user.name, signed: true, signedAt: Date.now() });
        }
        const contract = {
          id: `contract-${Date.now()}`,
          title: title || "Contrat sans titre",
          creatorId: session.id,
          creatorName: user.name,
          parties: partyList,
          clauses: clauses || [],
          status: "PENDING", // PENDING, ACTIVE, COMPLETED, CANCELLED, BREACHED
          createdAt: Date.now(),
          expiresAt: expiresAt || null,
        };
        saveState({ ...state, contracts: [contract, ...(state.contracts || [])] });
        notify(`Contrat "${title}" créé. En attente de signatures.`, "success");
      },

      onSignContract: (contractId) => {
        if (!session) return;
        const contracts = [...(state.contracts || [])];
        const idx = contracts.findIndex((c) => c.id === contractId);
        if (idx === -1) return;
        const contract = contracts[idx];
        if (contract.status !== "PENDING") { notify("Ce contrat n'est plus en attente.", "error"); return; }
        const parties = (contract.parties || []).map((p) =>
          p.id === session.id ? { ...p, signed: true, signedAt: Date.now() } : p
        );
        const allSigned = parties.every((p) => p.signed);
        contracts[idx] = { ...contract, parties, status: allSigned ? "ACTIVE" : "PENDING" };
        saveState({ ...state, contracts });
        notify(allSigned ? "Toutes les parties ont signé. Contrat actif !" : "Signature enregistrée.", "success");
      },

      onCancelContract: (contractId) => {
        if (!session) return;
        const contracts = [...(state.contracts || [])];
        const idx = contracts.findIndex((c) => c.id === contractId);
        if (idx === -1) return;
        const contract = contracts[idx];
        if (!contract.parties.find((p) => p.id === session.id)) { notify("Vous n'êtes pas partie prenante.", "error"); return; }
        contracts[idx] = { ...contract, status: "CANCELLED" };
        saveState({ ...state, contracts });
        notify("Contrat résilié.", "info");
      },

      onCompleteContract: (contractId) => {
        if (!session) return;
        const contracts = [...(state.contracts || [])];
        const idx = contracts.findIndex((c) => c.id === contractId);
        if (idx === -1) return;
        if (contracts[idx].creatorId !== session.id) { notify("Seul le créateur peut clore le contrat.", "error"); return; }
        contracts[idx] = { ...contracts[idx], status: "COMPLETED" };
        saveState({ ...state, contracts });
        notify("Contrat marqué comme accompli.", "success");
      },

      onBreachContract: (contractId, reason) => {
        const contracts = [...(state.contracts || [])];
        const idx = contracts.findIndex((c) => c.id === contractId);
        if (idx === -1) return;
        contracts[idx] = { ...contracts[idx], status: "BREACHED", breachReason: reason || "Non précisé" };
        saveState({ ...state, contracts });
        notify("Rupture de contrat enregistrée.", "error");
      },

      onDeleteContract: (contractId) => {
        saveState({ ...state, contracts: (state.contracts || []).filter((c) => c.id !== contractId) });
        notify("Contrat supprimé.", "info");
      },

      // ========== BOURSE ==========
      // Refonte : les échanges se font désormais entre citoyens via un vrai carnet d'ordres
      // (prix limite, appariement automatique) au lieu d'un rachat/vente instantané contre la seule
      // trésorerie de l'entreprise. La trésorerie de l'entreprise n'intervient plus que comme vendeur
      // initial (IPO / offre secondaire), matérialisé par un ordre de vente spécial citizenId="COMPANY".
      // Un plafond de variation journalière (±BOURSE_DAILY_CAP autour du cours d'ouverture du jour RP)
      // empêche qu'un seul ordre fasse s'envoler ou s'effondrer un cours.

      onBourseCreateListing: ({ companyId, symbol, totalShares, sharesOnMarket, pricePerShare, description }) => {
        if (!session) return;
        const listings = [...(state.bourseListings || [])];
        const company = (state.companies || []).find((c) => c.id === companyId);
        if (!company) { notify("Entreprise introuvable.", "error"); return; }
        const isAdmin = (ROLES[session.role]?.level || 0) >= 40;
        if (!isCompanyManager(company, session.id) && !isAdmin) { notify("Action non autorisée.", "error"); return; }
        const symUp = (symbol || "").toUpperCase().trim();
        if (!symUp) { notify("Le symbole boursier est requis.", "error"); return; }
        if (listings.some((l) => l.symbol === symUp)) { notify("Ce symbole est déjà utilisé.", "error"); return; }
        if (listings.some((l) => l.companyId === companyId)) { notify("Cette entreprise est déjà cotée.", "error"); return; }
        const shares = parseInt(totalShares) || 0;
        const onMarket = Math.min(parseInt(sharesOnMarket) || shares, shares);
        const price = parseFloat(pricePerShare) || 0;
        if (shares <= 0 || price <= 0) { notify("Actions et prix doivent être positifs.", "error"); return; }
        const ts = Date.now();
        const listing = {
          id: `BOURSE-${ts}`,
          companyId, companyName: company.name, symbol: symUp,
          totalShares: shares,
          ownerId: company.ownerId,
          isActive: true,
          description: description || company.description || "",
          launchedAt: ts,
          lastPrice: price, initialPrice: price,
          dayOpenPrice: price, dayOpenGameDate: formatRPDate(state.gameDate || { day: 1, month: 1, year: 1200 }),
          priceHistory: [{ price, timestamp: ts }],
          dividendHistory: [],
          buyOrders: [],
          sellOrders: onMarket > 0
            ? [{ id: `ORD-${ts}-co`, citizenId: "COMPANY", citizenName: company.name, qty: onMarket, price, timestamp: ts }]
            : [],
        };
        const ledgerEntry = { id: ts, fromName: company.name, toName: "Bourse Impériale", amount: 0, timestamp: ts, reason: `Introduction en bourse : ${symUp} (${shares} actions à ${formatMoney(price)})`, type: "BOURSE_IPO" };
        saveState({ ...state, bourseListings: [listing, ...listings], globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
        notify(`${company.name} est désormais cotée en bourse sous le symbole ${symUp}.`, "success");
      },

      // Seuls la description et le statut actif (suspension) sont modifiables directement — le cours et
      // l'offre de titres passent désormais par le carnet d'ordres (onBoursePlaceOrder / onBourseCompanyOffer).
      onBourseEditListing: (listingId, updates) => {
        if (!session) return;
        const listings = [...(state.bourseListings || [])];
        const idx = listings.findIndex((l) => l.id === listingId);
        if (idx === -1) return;
        const listing = listings[idx];
        const company = (state.companies || []).find((c) => c.id === listing.companyId);
        const isOwnerOrAdmin = isCompanyManager(company, session.id) || (ROLES[session.role]?.level || 0) >= 40;
        if (!isOwnerOrAdmin) { notify("Action non autorisée.", "error"); return; }
        const allowed = {};
        if (updates.description !== undefined) allowed.description = updates.description;
        if (updates.isActive !== undefined) allowed.isActive = updates.isActive;
        listings[idx] = { ...listing, ...allowed };
        saveState({ ...state, bourseListings: listings });
        notify("Cotation mise à jour.", "success");
      },

      onBourseDeleteListing: (listingId) => {
        if (!session) return;
        const listing = (state.bourseListings || []).find((l) => l.id === listingId);
        if (!listing) return;
        const company = (state.companies || []).find((c) => c.id === listing.companyId);
        const isOwnerOrAdmin = isCompanyManager(company, session.id) || (ROLES[session.role]?.level || 0) >= 40;
        if (!isOwnerOrAdmin) { notify("Action non autorisée.", "error"); return; }
        const price = listing.lastPrice || listing.initialPrice || 0;
        let newCitizens = [...(state.citizens || [])];
        // Rembourser les actionnaires au dernier cours connu
        newCitizens = newCitizens.map((c) => {
          const held = (c.stockholdings || {})[listingId] || 0;
          if (held <= 0) return c;
          const refund = Math.round(held * price * 10) / 10;
          const newHoldings = { ...(c.stockholdings || {}) };
          delete newHoldings[listingId];
          return { ...c, balance: Math.round(((c.balance || 0) + refund) * 10) / 10, stockholdings: newHoldings };
        });
        // Rembourser les ordres d'achat en cours (écus mis en séquestre)
        (listing.buyOrders || []).forEach((o) => {
          const idx = newCitizens.findIndex((c) => c.id === o.citizenId);
          if (idx !== -1) {
            const refund = Math.round(o.qty * o.price * 10) / 10;
            newCitizens[idx] = { ...newCitizens[idx], balance: Math.round(((newCitizens[idx].balance || 0) + refund) * 10) / 10 };
          }
        });
        // Rembourser (en écus, au dernier cours) les ordres de vente citoyens en cours — leurs actions
        // avaient déjà été mises en séquestre au moment du placement de l'ordre.
        (listing.sellOrders || []).forEach((o) => {
          if (o.citizenId === "COMPANY") return;
          const idx = newCitizens.findIndex((c) => c.id === o.citizenId);
          if (idx !== -1) {
            const refund = Math.round(o.qty * price * 10) / 10;
            newCitizens[idx] = { ...newCitizens[idx], balance: Math.round(((newCitizens[idx].balance || 0) + refund) * 10) / 10 };
          }
        });
        saveState({ ...state, bourseListings: (state.bourseListings || []).filter((l) => l.id !== listingId), citizens: newCitizens });
        notify(`Cotation ${listing.symbol} supprimée. Actionnaires et ordres en cours ont été remboursés.`, "info");
      },

      // ── Carnet d'ordres ──
      onBoursePlaceOrder: ({ listingId, side, qty, price }) => {
        if (!session) return;
        const quantity = parseInt(qty);
        const limitPrice = Math.round((parseFloat(price) || 0) * 10) / 10;
        if (!quantity || quantity <= 0) { notify("Quantité invalide.", "error"); return; }
        if (!limitPrice || limitPrice <= 0) { notify("Prix invalide.", "error"); return; }
        if (side !== "buy" && side !== "sell") { notify("Type d'ordre invalide.", "error"); return; }
        const listings = [...(state.bourseListings || [])];
        const idx = listings.findIndex((l) => l.id === listingId);
        if (idx === -1) { notify("Cotation introuvable.", "error"); return; }
        let listing = listings[idx];
        if (!listing.isActive) { notify("Cette valeur n'est plus active.", "error"); return; }

        const capBase = listing.dayOpenPrice || listing.lastPrice || listing.initialPrice;
        const minAllowed = Math.round(capBase * (1 - BOURSE_DAILY_CAP) * 10) / 10;
        const maxAllowed = Math.round(capBase * (1 + BOURSE_DAILY_CAP) * 10) / 10;
        if (limitPrice < minAllowed || limitPrice > maxAllowed) {
          notify(`Prix hors du plafond journalier (entre ${formatMoney(minAllowed)} et ${formatMoney(maxAllowed)} aujourd'hui).`, "error");
          return;
        }

        const citizens = [...(state.citizens || [])];
        const userIdx = citizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const me = citizens[userIdx];
        const ts = Date.now();
        const order = { id: `ORD-${ts}-${Math.random().toString(36).slice(2, 6)}`, citizenId: session.id, citizenName: me.name, qty: quantity, price: limitPrice, timestamp: ts };

        if (side === "buy") {
          const cost = Math.round(quantity * limitPrice * 10) / 10;
          if ((me.balance || 0) < cost) { notify("Fonds insuffisants pour cet ordre.", "error"); return; }
          citizens[userIdx] = { ...me, balance: Math.round(((me.balance || 0) - cost) * 10) / 10 };
          listing = { ...listing, buyOrders: [...(listing.buyOrders || []), order] };
        } else {
          const now = Date.now();
          const lockedQty = (me.esppLocks || []).filter((l) => l.listingId === listingId && l.unlocksAt > now).reduce((s, l) => s + l.qty, 0);
          const openSellQty = (listing.sellOrders || []).filter((o) => o.citizenId === session.id).reduce((s, o) => s + o.qty, 0);
          const held = (me.stockholdings || {})[listingId] || 0;
          const available = held - lockedQty - openSellQty;
          if (available < quantity) {
            notify(`Vous ne pouvez vendre que ${Math.max(0, available)} action(s) (détenues, moins verrous ESPP et ordres déjà en cours).`, "error");
            return;
          }
          const holdings = { ...(me.stockholdings || {}) };
          holdings[listingId] = held - quantity;
          if (holdings[listingId] <= 0) delete holdings[listingId];
          citizens[userIdx] = { ...me, stockholdings: holdings };
          listing = { ...listing, sellOrders: [...(listing.sellOrders || []), order] };
        }

        const { trades, buyOrders, sellOrders } = matchBourseOrders(listing);
        listing = { ...listing, buyOrders, sellOrders };
        let newCitizens = citizens;
        let newCompanies = state.companies || [];
        let ledgerEntries = [];
        const bourseAlerts = [];
        if (trades.length > 0) {
          const applied = applyBourseTrades(trades, newCitizens, newCompanies, listing);
          newCitizens = applied.newCitizens;
          newCompanies = applied.newCompanies;
          ledgerEntries = applied.ledgerEntries;
          const lastTrade = trades[trades.length - 1];
          // Plafond généreux (300) pour que la vue "mois" du graphe de cours ait des données
          // même sur un titre actif, au lieu de ne retenir que les toutes dernières heures.
          const newHistory = [...trades.map((t) => ({ price: t.price, timestamp: ts })), ...(listing.priceHistory || [])].slice(0, 300);
          listing = { ...listing, lastPrice: lastTrade.price, priceHistory: newHistory };
          // Notifier la contrepartie dont l'ordre résident vient d'être exécuté par ce nouvel ordre
          trades.forEach((t, i) => {
            if (t.buyerId !== "COMPANY" && String(t.buyerId) !== String(session.id)) {
              bourseAlerts.push({ id: `ba_${ts}_${i}_buy`, toId: t.buyerId, type: "trade_filled", symbol: listing.symbol, qty: t.qty, price: t.price, side: "buy", timestamp: ts });
            }
            if (t.sellerId !== "COMPANY" && String(t.sellerId) !== String(session.id)) {
              bourseAlerts.push({ id: `ba_${ts}_${i}_sell`, toId: t.sellerId, type: "trade_filled", symbol: listing.symbol, qty: t.qty, price: t.price, side: "sell", timestamp: ts });
            }
          });
          const takeover = checkBourseTakeover(newCompanies, newCitizens, listing);
          if (takeover) {
            newCompanies = takeover.companies;
            bourseAlerts.push({ id: `ba_${ts}_takeover_new`, toId: takeover.newOwnerId, type: "takeover_gained", companyName: takeover.companyName, symbol: takeover.symbol, timestamp: ts });
            bourseAlerts.push({ id: `ba_${ts}_takeover_old`, toId: takeover.previousOwnerId, type: "takeover_lost", companyName: takeover.companyName, symbol: takeover.symbol, newOwnerName: takeover.newOwnerName, timestamp: ts });
          }
        }

        listings[idx] = listing;
        saveState({ ...state, citizens: newCitizens, companies: newCompanies, bourseListings: listings, globalLedger: [...ledgerEntries, ...(state.globalLedger || [])].slice(0, 1000), bourseAlerts: [...bourseAlerts, ...(state.bourseAlerts || [])].slice(0, 300) });

        const book = side === "buy" ? listing.buyOrders : listing.sellOrders;
        const remaining = book.find((o) => o.id === order.id)?.qty ?? 0;
        const filled = quantity - remaining;
        if (filled >= quantity) {
          notify(`Ordre ${side === "buy" ? "d'achat" : "de vente"} exécuté intégralement (${quantity} action(s)).`, "success");
        } else if (filled > 0) {
          notify(`Ordre partiellement exécuté (${filled}/${quantity}) — le reste patiente dans le carnet.`, "info");
        } else {
          notify("Ordre placé, en attente d'une contrepartie.", "info");
        }
      },

      onBourseCancelOrder: ({ listingId, orderId, side }) => {
        if (!session) return;
        const listings = [...(state.bourseListings || [])];
        const idx = listings.findIndex((l) => l.id === listingId);
        if (idx === -1) return;
        const listing = listings[idx];
        const list = side === "buy" ? (listing.buyOrders || []) : (listing.sellOrders || []);
        const order = list.find((o) => o.id === orderId);
        if (!order) { notify("Ordre introuvable.", "error"); return; }
        if (order.citizenId === "COMPANY") {
          const company = (state.companies || []).find((c) => c.id === listing.companyId);
          const isOwnerOrAdmin = isCompanyManager(company, session.id) || (ROLES[session.role]?.level || 0) >= 40;
          if (!isOwnerOrAdmin) { notify("Action non autorisée.", "error"); return; }
        } else if (String(order.citizenId) !== String(session.id)) {
          notify("Vous ne pouvez annuler que vos propres ordres.", "error");
          return;
        }
        listings[idx] = { ...listing, [side === "buy" ? "buyOrders" : "sellOrders"]: list.filter((o) => o.id !== orderId) };
        let newCitizens = state.citizens || [];
        if (order.citizenId !== "COMPANY") {
          const citizens = [...(state.citizens || [])];
          const cIdx = citizens.findIndex((c) => c.id === order.citizenId);
          if (cIdx !== -1) {
            if (side === "buy") {
              const refund = Math.round(order.qty * order.price * 10) / 10;
              citizens[cIdx] = { ...citizens[cIdx], balance: Math.round(((citizens[cIdx].balance || 0) + refund) * 10) / 10 };
            } else {
              const holdings = { ...(citizens[cIdx].stockholdings || {}) };
              holdings[listingId] = (holdings[listingId] || 0) + order.qty;
              citizens[cIdx] = { ...citizens[cIdx], stockholdings: holdings };
            }
            newCitizens = citizens;
          }
        }
        saveState({ ...state, citizens: newCitizens, bourseListings: listings });
        notify("Ordre annulé.", "info");
      },

      // Offre de titres au nom de la société (IPO complémentaire) — matérialisée par un ordre de vente
      // citizenId="COMPANY" qui participe au carnet d'ordres comme n'importe quel autre vendeur.
      onBourseCompanyOffer: ({ listingId, qty, price }) => {
        if (!session) return;
        const quantity = parseInt(qty);
        const askPrice = Math.round((parseFloat(price) || 0) * 10) / 10;
        if (!quantity || quantity <= 0) { notify("Quantité invalide.", "error"); return; }
        if (!askPrice || askPrice <= 0) { notify("Prix invalide.", "error"); return; }
        const listings = [...(state.bourseListings || [])];
        const idx = listings.findIndex((l) => l.id === listingId);
        if (idx === -1) { notify("Cotation introuvable.", "error"); return; }
        let listing = listings[idx];
        const company = (state.companies || []).find((c) => c.id === listing.companyId);
        const isOwnerOrAdmin = isCompanyManager(company, session.id) || (ROLES[session.role]?.level || 0) >= 40;
        if (!isOwnerOrAdmin) { notify("Action non autorisée.", "error"); return; }
        if (!listing.isActive) { notify("Cette valeur n'est plus active.", "error"); return; }

        const totalHeld = (state.citizens || []).reduce((s, c) => s + ((c.stockholdings || {})[listingId] || 0), 0);
        const totalOpenSell = (listing.sellOrders || []).reduce((s, o) => s + o.qty, 0);
        if (totalHeld + totalOpenSell + quantity > listing.totalShares) {
          notify(`Dépasse le capital autorisé (${listing.totalShares} actions au total, ${totalHeld + totalOpenSell} déjà en circulation ou en vente).`, "error");
          return;
        }

        const capBase = listing.dayOpenPrice || listing.lastPrice || listing.initialPrice;
        const minAllowed = Math.round(capBase * (1 - BOURSE_DAILY_CAP) * 10) / 10;
        const maxAllowed = Math.round(capBase * (1 + BOURSE_DAILY_CAP) * 10) / 10;
        if (askPrice < minAllowed || askPrice > maxAllowed) {
          notify(`Prix hors du plafond journalier (entre ${formatMoney(minAllowed)} et ${formatMoney(maxAllowed)} aujourd'hui).`, "error");
          return;
        }

        const ts = Date.now();
        let sellOrders = [...(listing.sellOrders || [])];
        const existingIdx = sellOrders.findIndex((o) => o.citizenId === "COMPANY");
        if (existingIdx !== -1) {
          sellOrders[existingIdx] = { ...sellOrders[existingIdx], qty: sellOrders[existingIdx].qty + quantity, price: askPrice };
        } else {
          sellOrders = [...sellOrders, { id: `ORD-${ts}-co`, citizenId: "COMPANY", citizenName: company.name, qty: quantity, price: askPrice, timestamp: ts }];
        }
        listing = { ...listing, sellOrders };

        const { trades, buyOrders, sellOrders: matchedSellOrders } = matchBourseOrders(listing);
        listing = { ...listing, buyOrders, sellOrders: matchedSellOrders };
        let newCitizens = state.citizens || [];
        let newCompanies = state.companies || [];
        let ledgerEntries = [];
        const bourseAlerts = [];
        if (trades.length > 0) {
          const applied = applyBourseTrades(trades, newCitizens, newCompanies, listing);
          newCitizens = applied.newCitizens;
          newCompanies = applied.newCompanies;
          ledgerEntries = applied.ledgerEntries;
          const lastTrade = trades[trades.length - 1];
          listing = { ...listing, lastPrice: lastTrade.price, priceHistory: [...trades.map((t) => ({ price: t.price, timestamp: ts })), ...(listing.priceHistory || [])].slice(0, 300) };
          trades.forEach((t, i) => {
            if (t.buyerId !== "COMPANY") {
              bourseAlerts.push({ id: `ba_${ts}_${i}_buy`, toId: t.buyerId, type: "trade_filled", symbol: listing.symbol, qty: t.qty, price: t.price, side: "buy", timestamp: ts });
            }
          });
          const takeover = checkBourseTakeover(newCompanies, newCitizens, listing);
          if (takeover) {
            newCompanies = takeover.companies;
            bourseAlerts.push({ id: `ba_${ts}_takeover_new`, toId: takeover.newOwnerId, type: "takeover_gained", companyName: takeover.companyName, symbol: takeover.symbol, timestamp: ts });
            bourseAlerts.push({ id: `ba_${ts}_takeover_old`, toId: takeover.previousOwnerId, type: "takeover_lost", companyName: takeover.companyName, symbol: takeover.symbol, newOwnerName: takeover.newOwnerName, timestamp: ts });
          }
        }
        listings[idx] = listing;
        saveState({ ...state, citizens: newCitizens, companies: newCompanies, bourseListings: listings, globalLedger: [...ledgerEntries, ...(state.globalLedger || [])].slice(0, 1000), bourseAlerts: [...bourseAlerts, ...(state.bourseAlerts || [])].slice(0, 300) });
        notify(`Offre de ${quantity} action(s) ${listing.symbol} à ${formatMoney(askPrice)} placée sur le marché.`, "success");
      },

      // --- CESSION DIRECTE D'ACTIONS À UN CITOYEN CHOISI ---
      // Distincte du marché public (onBourseCompanyOffer, anonyme, tout le monde peut acheter)
      // et de l'ESPP (onEmployeeBuyShares, réservée aux employés) : ici l'entreprise cible
      // n'importe quel citoyen directement, hors carnet d'ordres. Prix à 0 = don pur (aucun
      // transfert d'écus), sinon vente immédiate au prix convenu (hors plafond journalier du
      // marché public, qui ne s'applique qu'aux échanges sur le carnet d'ordres).
      onBourseDirectOffer: ({ listingId, citizenId, qty, price }) => {
        if (!session) return;
        const quantity = parseInt(qty);
        const unitPrice = Math.max(0, Math.round((parseFloat(price) || 0) * 10) / 10);
        if (!quantity || quantity <= 0) { notify("Quantité invalide.", "error"); return; }
        const listings = [...(state.bourseListings || [])];
        const idx = listings.findIndex((l) => l.id === listingId);
        if (idx === -1) { notify("Cotation introuvable.", "error"); return; }
        const listing = listings[idx];
        const company = (state.companies || []).find((c) => c.id === listing.companyId);
        const isOwnerOrAdmin = isCompanyManager(company, session.id) || (ROLES[session.role]?.level || 0) >= 40;
        if (!isOwnerOrAdmin) { notify("Action non autorisée.", "error"); return; }
        if (!listing.isActive) { notify("Cette valeur n'est plus active.", "error"); return; }

        const citIdx = (state.citizens || []).findIndex((c) => c.id === citizenId);
        if (citIdx === -1) { notify("Citoyen introuvable.", "error"); return; }
        const citizen = state.citizens[citIdx];

        const totalHeld = (state.citizens || []).reduce((s, c) => s + ((c.stockholdings || {})[listingId] || 0), 0);
        const totalOpenSell = (listing.sellOrders || []).reduce((s, o) => s + o.qty, 0);
        if (totalHeld + totalOpenSell + quantity > listing.totalShares) {
          notify(`Dépasse le capital autorisé (${listing.totalShares} actions au total, ${totalHeld + totalOpenSell} déjà en circulation ou en vente).`, "error");
          return;
        }
        const cost = Math.round(quantity * unitPrice * 10) / 10;
        if (cost > 0 && (citizen.balance || 0) < cost) {
          notify(`${citizen.name} n'a pas les fonds nécessaires (${formatMoney(cost)} requis).`, "error");
          return;
        }

        const newCitizens = [...state.citizens];
        const holdings = { ...(newCitizens[citIdx].stockholdings || {}) };
        holdings[listingId] = (holdings[listingId] || 0) + quantity;
        newCitizens[citIdx] = {
          ...newCitizens[citIdx],
          stockholdings: holdings,
          balance: cost > 0 ? Math.round(((newCitizens[citIdx].balance || 0) - cost) * 10) / 10 : newCitizens[citIdx].balance,
        };
        let newCompanies = state.companies || [];
        let ledgerEntries = [];
        if (cost > 0) {
          const compIdx = state.companies.findIndex((c) => c.id === company.id);
          newCompanies = [...state.companies];
          newCompanies[compIdx] = { ...newCompanies[compIdx], balance: Math.round(((newCompanies[compIdx].balance || 0) + cost) * 10) / 10 };
          ledgerEntries.push({
            id: Date.now(), fromName: citizen.name, toName: company.name, amount: cost,
            timestamp: Date.now(), reason: `Cession directe de ${quantity} action(s) ${listing.symbol}`, type: "BOURSE_DIRECT",
          });
        }
        const ts = Date.now();
        let bourseAlerts = state.bourseAlerts || [];
        const takeover = checkBourseTakeover(newCompanies, newCitizens, listing);
        if (takeover) {
          newCompanies = takeover.companies;
          bourseAlerts = [
            { id: `ba_${ts}_takeover_new`, toId: takeover.newOwnerId, type: "takeover_gained", companyName: takeover.companyName, symbol: takeover.symbol, timestamp: ts },
            { id: `ba_${ts}_takeover_old`, toId: takeover.previousOwnerId, type: "takeover_lost", companyName: takeover.companyName, symbol: takeover.symbol, newOwnerName: takeover.newOwnerName, timestamp: ts },
            ...bourseAlerts,
          ].slice(0, 300);
        }
        saveState({ ...state, citizens: newCitizens, companies: newCompanies, bourseAlerts, globalLedger: ledgerEntries.length ? [...ledgerEntries, ...(state.globalLedger || [])].slice(0, 1000) : state.globalLedger });
        notify(`${quantity} action(s) ${listing.symbol} ${cost > 0 ? `vendue(s) à ${citizen.name} pour ${formatMoney(cost)}` : `offerte(s) à ${citizen.name}`}.`, "success");
      },

      onBoursePayDividends: (listingId, dividendPerShare) => {
        if (!session) return;
        const dpS = parseFloat(dividendPerShare);
        if (!dpS || dpS <= 0) { notify("Dividende invalide.", "error"); return; }
        const listings = [...(state.bourseListings || [])];
        const idx = listings.findIndex((l) => l.id === listingId);
        if (idx === -1) return;
        const listing = listings[idx];
        const newCompanies = [...(state.companies || [])];
        const compIdx = newCompanies.findIndex((c) => c.id === listing.companyId);
        const company = compIdx !== -1 ? newCompanies[compIdx] : null;
        const isOwnerOrAdmin = isCompanyManager(company, session.id) || (ROLES[session.role]?.level || 0) >= 40;
        if (!isOwnerOrAdmin) { notify("Action non autorisée.", "error"); return; }

        const newCitizens = [...(state.citizens || [])];
        const holders = [];
        newCitizens.forEach((c, i) => {
          const held = (c.stockholdings || {})[listingId] || 0;
          if (held > 0) holders.push({ i, held });
        });
        const fullTotal = holders.reduce((s, h) => s + h.held * dpS, 0);
        const treasury = company?.balance || 0;
        // Versement proportionnel si la trésorerie ne couvre pas le montant total, au lieu d'un échec
        // total qui empêchait tout dividende dès qu'il manquait ne serait-ce qu'un Écu.
        const payoutRatio = fullTotal > 0 ? Math.min(1, treasury / fullTotal) : 1;
        const effectiveDpS = Math.round(dpS * payoutRatio * 1000) / 1000;
        let totalPaid = 0;
        const ledgerEntries = [];
        const ts = Date.now();
        const bourseAlerts = [];
        holders.forEach(({ i, held }, hi) => {
          const payout = Math.round(held * effectiveDpS * 10) / 10;
          if (payout <= 0) return;
          totalPaid += payout;
          newCitizens[i] = { ...newCitizens[i], balance: Math.round(((newCitizens[i].balance || 0) + payout) * 10) / 10 };
          ledgerEntries.push({ id: ts + hi, fromName: `${listing.companyName} (dividende ${listing.symbol})`, toName: newCitizens[i].name, amount: payout, timestamp: ts, reason: `Dividende ${listing.symbol} (${formatMoney(effectiveDpS)}/action × ${held})`, type: "BOURSE_DIVIDEND" });
          if (String(newCitizens[i].id) !== String(session.id)) {
            bourseAlerts.push({ id: `ba_${ts}_${hi}_div`, toId: newCitizens[i].id, type: "dividend", symbol: listing.symbol, amount: payout, timestamp: ts });
          }
        });
        if (compIdx !== -1) {
          newCompanies[compIdx] = { ...newCompanies[compIdx], balance: Math.round(((newCompanies[compIdx].balance || 0) - totalPaid) * 10) / 10 };
        }
        const divHistory = [{ amount: effectiveDpS, requestedAmount: dpS, timestamp: ts, totalPaid, partial: payoutRatio < 1 }, ...(listing.dividendHistory || [])].slice(0, 20);
        listings[idx] = { ...listing, dividendHistory: divHistory };
        saveState({ ...state, citizens: newCitizens, companies: newCompanies, bourseListings: listings, globalLedger: [...ledgerEntries, ...(state.globalLedger || [])].slice(0, 1000), bourseAlerts: [...bourseAlerts, ...(state.bourseAlerts || [])].slice(0, 300) });
        if (payoutRatio < 1) {
          notify(`Trésorerie insuffisante : dividende réduit à ${formatMoney(effectiveDpS)}/action (au lieu de ${formatMoney(dpS)}). Total distribué : ${formatMoney(totalPaid)}.`, "info");
        } else {
          notify(`Dividendes versés : ${formatMoney(dpS)}/action. Total distribué : ${formatMoney(totalPaid)}.`, "success");
        }
      },

      // ── Plan d'Actionnariat Salarié (ESPP) ──
      onUpdateCompanyESPP: (companyId, esppSettings) => {
        if (!session) return;
        const companies = [...(state.companies || [])];
        const idx = companies.findIndex((c) => c.id === companyId);
        if (idx === -1) return;
        if (!isCompanyManager(companies[idx], session.id)) { notify("Action non autorisée.", "error"); return; }
        companies[idx] = { ...companies[idx], espp: { ...esppSettings } };
        saveState({ ...state, companies });
        notify(esppSettings.enabled ? "Plan d'actionnariat salarié activé." : "Plan d'actionnariat salarié désactivé.", "success");
      },

      onEmployeeBuyShares: (companyId, listingId, qty) => {
        if (!session) return;
        const quantity = parseInt(qty);
        if (!quantity || quantity <= 0) { notify("Quantité invalide.", "error"); return; }
        const companies = [...(state.companies || [])];
        const compIdx = companies.findIndex((c) => c.id === companyId);
        if (compIdx === -1) { notify("Entreprise introuvable.", "error"); return; }
        const company = companies[compIdx];
        const isEmployee = (company.employees || []).includes(session.id);
        if (!isEmployee) { notify("Vous n'êtes pas employé dans cette entreprise.", "error"); return; }
        const espp = company.espp || {};
        if (!espp.enabled) { notify("Le plan d'actionnariat n'est pas actif.", "error"); return; }
        const maxPer = parseInt(espp.maxSharesPerPurchase) || 0;
        if (maxPer > 0 && quantity > maxPer) { notify(`Maximum ${maxPer} action(s) par achat.`, "error"); return; }
        const discount = Math.min(Math.max(parseFloat(espp.discountPercent) || 0, 0), 90) / 100;
        const listings = [...(state.bourseListings || [])];
        const lIdx = listings.findIndex((l) => l.id === listingId);
        if (lIdx === -1) { notify("Cotation introuvable.", "error"); return; }
        const listing = listings[lIdx];
        if (!listing.isActive) { notify("Cette valeur n'est plus active.", "error"); return; }
        const companyFloat = (listing.sellOrders || []).filter((o) => o.citizenId === "COMPANY").reduce((s, o) => s + o.qty, 0);
        if (companyFloat < quantity) { notify(`Seulement ${companyFloat} action(s) disponible(s) auprès de l'entreprise.`, "error"); return; }
        const refPrice = listing.lastPrice || listing.initialPrice;
        const discountedPrice = Math.round(refPrice * (1 - discount) * 10) / 10;
        const totalCost = Math.round(quantity * discountedPrice * 10) / 10;
        const workerBal = (company.workerBalances || {})[session.id] || 0;
        if (workerBal < totalCost) { notify(`Compte entreprise insuffisant. Disponible : ${formatMoney(workerBal)}, requis : ${formatMoney(totalCost)}.`, "error"); return; }
        const newCitizens = [...(state.citizens || [])];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        // Débit du compte entreprise de l'employé
        const wb = { ...(company.workerBalances || {}) };
        wb[session.id] = Math.round((workerBal - totalCost) * 10) / 10;
        companies[compIdx] = { ...company, workerBalances: wb };
        // Crédit de la trésorerie de l'entreprise (au prix réduit)
        companies[compIdx] = { ...companies[compIdx], balance: Math.round(((companies[compIdx].balance || 0) + totalCost) * 10) / 10 };
        // Mise à jour des actions du citoyen
        const currentHoldings = newCitizens[userIdx].stockholdings || {};
        const ts = Date.now();
        // Enregistrement de la période de blocage si définie
        const lockupDays = Math.max(0, parseInt(espp.lockupDays) || 0);
        let updatedLocks = (newCitizens[userIdx].esppLocks || []).filter((l) => l.unlocksAt > ts); // nettoyer les verrous expirés
        if (lockupDays > 0) {
          updatedLocks = [...updatedLocks, { id: `ESPP-${ts}`, listingId, qty: quantity, unlocksAt: ts + lockupDays * 86400000, symbol: listing.symbol, companyName: listing.companyName }];
        }
        newCitizens[userIdx] = { ...newCitizens[userIdx], stockholdings: { ...currentHoldings, [listingId]: (currentHoldings[listingId] || 0) + quantity }, esppLocks: updatedLocks };
        // Décrémenter le float de la société (ordre(s) de vente COMPANY)
        let remaining = quantity;
        const newSellOrders = (listing.sellOrders || []).map((o) => {
          if (o.citizenId !== "COMPANY" || remaining <= 0) return o;
          const take = Math.min(o.qty, remaining);
          remaining -= take;
          return { ...o, qty: o.qty - take };
        }).filter((o) => o.qty > 0);
        listings[lIdx] = { ...listing, sellOrders: newSellOrders };
        const ledgerEntry = { id: ts, fromName: `Compte salarié — ${company.name}`, toName: `${listing.companyName} (ESPP: ${listing.symbol})`, amount: totalCost, timestamp: ts, reason: `ESPP : ${quantity} action(s) ${listing.symbol} à ${formatMoney(discountedPrice)} (−${espp.discountPercent}%${lockupDays > 0 ? `, bloqué ${lockupDays}j` : ""})`, type: "ESPP_BUY" };
        let finalCompanies = companies;
        let bourseAlerts = state.bourseAlerts || [];
        const takeover = checkBourseTakeover(companies, newCitizens, listings[lIdx]);
        if (takeover) {
          finalCompanies = takeover.companies;
          bourseAlerts = [
            { id: `ba_${ts}_takeover_new`, toId: takeover.newOwnerId, type: "takeover_gained", companyName: takeover.companyName, symbol: takeover.symbol, timestamp: ts },
            { id: `ba_${ts}_takeover_old`, toId: takeover.previousOwnerId, type: "takeover_lost", companyName: takeover.companyName, symbol: takeover.symbol, newOwnerName: takeover.newOwnerName, timestamp: ts },
            ...bourseAlerts,
          ].slice(0, 300);
        }
        saveState({ ...state, companies: finalCompanies, citizens: newCitizens, bourseListings: listings, bourseAlerts, globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
        notify(`${quantity} action(s) ${listing.symbol} achetée(s) pour ${formatMoney(totalCost)} (−${espp.discountPercent}%${lockupDays > 0 ? ` · bloquées ${lockupDays} jour(s)` : ""}).`, "success");
      },

      onGuardImprison: (countryId, citizenId, reason, sentence) => {
        if (!session) return;
        const guard = (state.countries || []).find((c) => c.id === countryId)?.guard || {};
        if ((guard.prison || []).some((p) => p.citizenId === citizenId)) { notify("Ce citoyen est déjà incarcéré.", "error"); return; }
        const citizen = (state.citizens || []).find((c) => c.id === citizenId);
        if (!citizen) return;
        const jailer = (state.citizens || []).find((c) => c.id === session.id);
        const entry = { id: Date.now(), citizenId, citizenName: citizen.name, reason: reason || "Non précisé", sentence: sentence || "", guardId: session.id, guardName: jailer?.name || "Garde inconnu", since: Date.now() };
        const countries = (state.countries || []).map((c) => {
          if (c.id !== countryId) return c;
          return { ...c, guard: { ...(c.guard || {}), prison: [...((c.guard || {}).prison || []), entry] } };
        });
        const newCitizens = (state.citizens || []).map((c) =>
          c.id === citizenId ? { ...c, status: "Prisonnier" } : c
        );
        saveState({ ...state, countries, citizens: newCitizens });
        notify(`${citizen.name} incarcéré(e). Motif : ${reason || "Non précisé"}.`, "info");
      },

      onGuardRelease: (countryId, citizenId) => {
        const citizen = (state.citizens || []).find((c) => c.id === citizenId);
        const countries = (state.countries || []).map((c) => {
          if (c.id !== countryId) return c;
          return { ...c, guard: { ...(c.guard || {}), prison: ((c.guard || {}).prison || []).filter((p) => p.citizenId !== citizenId) } };
        });
        const newCitizens = (state.citizens || []).map((c) =>
          c.id === citizenId ? { ...c, status: "Actif" } : c
        );
        saveState({ ...state, countries, citizens: newCitizens });
        notify(`${citizen?.name || "Prisonnier"} libéré(e).`, "success");
      },

      // ── GARDE ──────────────────────────────────────────────────────────
      onGuardUpdateInfo: (countryId, info) => {
        const countries = (state.countries || []).map((c) =>
          c.id === countryId ? { ...c, guard: { ...(c.guard || {}), ...info } } : c
        );
        saveState({ ...state, countries });
      },

      onGuardAddRank: (countryId, rank) => {
        const countries = (state.countries || []).map((c) => {
          if (c.id !== countryId) return c;
          const guard = c.guard || {};
          return { ...c, guard: { ...guard, ranks: [...(guard.ranks || []), rank] } };
        });
        saveState({ ...state, countries });
        notify(`Grade "${rank.name}" créé.`, "success");
      },

      onGuardRemoveRank: (countryId, rankId) => {
        const countries = (state.countries || []).map((c) => {
          if (c.id !== countryId) return c;
          const guard = c.guard || {};
          return { ...c, guard: { ...guard, ranks: (guard.ranks || []).filter((r) => r.id !== rankId) } };
        });
        saveState({ ...state, countries });
      },

      onGuardAddMember: (countryId, citizenId, rankId) => {
        const citizen = (state.citizens || []).find((c) => c.id === citizenId);
        if (!citizen) return;
        const countries = (state.countries || []).map((c) => {
          if (c.id !== countryId) return c;
          const guard = c.guard || {};
          const already = (guard.members || []).some((m) => m.citizenId === citizenId);
          if (already) return c;
          const newMember = { citizenId, citizenName: citizen.name, rankId, note: "", joinedAt: Date.now() };
          return { ...c, guard: { ...guard, members: [...(guard.members || []), newMember] } };
        });
        saveState({ ...state, countries });
        notify(`${citizen.name} rejoint la garde.`, "success");
      },

      onGuardUpdateMember: (countryId, citizenId, updates) => {
        const countries = (state.countries || []).map((c) => {
          if (c.id !== countryId) return c;
          const guard = c.guard || {};
          return { ...c, guard: { ...guard, members: (guard.members || []).map((m) => m.citizenId === citizenId ? { ...m, ...updates } : m) } };
        });
        saveState({ ...state, countries });
      },

      onGuardRemoveMember: (countryId, citizenId) => {
        const countries = (state.countries || []).map((c) => {
          if (c.id !== countryId) return c;
          const guard = c.guard || {};
          return { ...c, guard: { ...guard, members: (guard.members || []).filter((m) => m.citizenId !== citizenId) } };
        });
        saveState({ ...state, countries });
        notify("Membre retiré de la garde.", "info");
      },

      onGuardIssueOrder: (countryId, order) => {
        const countries = (state.countries || []).map((c) => {
          if (c.id !== countryId) return c;
          const guard = c.guard || {};
          return { ...c, guard: { ...guard, orders: [order, ...(guard.orders || [])].slice(0, 100) } };
        });
        saveState({ ...state, countries });
        notify("Ordre émis.", "success");
      },

      onGuardDeleteOrder: (countryId, orderId) => {
        const countries = (state.countries || []).map((c) => {
          if (c.id !== countryId) return c;
          const guard = c.guard || {};
          return { ...c, guard: { ...guard, orders: (guard.orders || []).filter((o) => o.id !== orderId) } };
        });
        saveState({ ...state, countries });
      },

      onGuardCompleteOrder: (countryId, orderId, report) => {
        if (!session) return;
        const citizen = (state.citizens || []).find((c) => c.id === session.id);
        const countries = (state.countries || []).map((c) => {
          if (c.id !== countryId) return c;
          const guard = c.guard || {};
          const orders = (guard.orders || []).map((o) => {
            if (o.id !== orderId) return o;
            const reports = [
              { id: Date.now(), author: citizen?.name || "Inconnu", content: report, date: Date.now() },
              ...(o.reports || []),
            ];
            return { ...o, status: "done", reports };
          });
          return { ...c, guard: { ...guard, orders } };
        });
        saveState({ ...state, countries });
        notify("Ordre marqué terminé. Rapport soumis.", "success");
      },

      // ── ALERTE BUREAU DE POSTE ──────────────────────────────────
      onRecordPostalAlert: (citizenId, citizenName, claimedCountryId, claimedRegion) => {
        const countries = state.countries || [];
        const citizen = (state.citizens || []).find((c) => String(c.id) === String(citizenId));
        if (!citizen) return;
        const registeredCountryName = countries.find((c) => c.id === (citizen.locationCountryId || citizen.countryId))?.name || "Inconnu";
        const claimedCountryName = countries.find((c) => c.id === claimedCountryId)?.name || "Inconnu";
        const alert = {
          id: `postal_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          citizenId,
          citizenName,
          registeredCountryId: citizen.locationCountryId || citizen.countryId || "",
          registeredRegion: citizen.currentPosition || "",
          registeredCountryName,
          claimedCountryId,
          claimedRegion,
          claimedCountryName,
          timestamp: Date.now(),
        };
        const postalAlerts = [...(state.postalAlerts || []), alert];
        saveState({ ...state, postalAlerts });
      },
      // ────────────────────────────────────────────────────────────

      // ── COMBAT ──────────────────────────────────────────────────
      onSaveCombatStats: (citizenId, data) => {
        const idx = (state.citizens || []).findIndex((c) => String(c.id) === String(citizenId));
        if (idx === -1) return;
        const newCitizens = [...state.citizens];
        newCitizens[idx] = { ...newCitizens[idx], ...data };
        saveState({ ...state, citizens: newCitizens });
        notify("Fiche de combat sauvegardée.", "success");
      },

      onCreateCombatSession: (session) => {
        saveState({ ...state, combatSessions: [...(state.combatSessions || []), session] });
      },

      onUpdateCombatSession: (sessionId, updates) => {
        const newSessions = (state.combatSessions || []).map((s) =>
          String(s.id) === String(sessionId) ? { ...s, ...updates } : s
        );
        saveState({ ...state, combatSessions: newSessions });
      },

      onDeleteCombatSession: (sessionId) => {
        const newSessions = (state.combatSessions || []).filter((s) => String(s.id) !== String(sessionId));
        saveState({ ...state, combatSessions: newSessions });
        notify("Session supprimée.", "info");
      },

      onSaveCombatEffect: (effect) => {
        const existing = (state.combatEffects || []).findIndex((e) => e.id === effect.id);
        const newEffects = existing !== -1
          ? (state.combatEffects || []).map((e) => e.id === effect.id ? effect : e)
          : [...(state.combatEffects || []), effect];
        saveState({ ...state, combatEffects: newEffects });
      },

      onDeleteCombatEffect: (id) => {
        saveState({ ...state, combatEffects: (state.combatEffects || []).filter((e) => e.id !== id) });
      },

      onSaveEruditResearch: ({ id, title, subtitle, abstract, chapters, category, coverUrl, accessCountries }) => {
        if (!session) return;
        const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
        const dateStr = formatRPDate(gd);
        const existing = [...(state.eruditResearch || [])];
        if (id) {
          const idx = existing.findIndex((r) => r.id === id);
          if (idx === -1) return;
          existing[idx] = {
            ...existing[idx],
            title, subtitle: subtitle || "",
            abstract: abstract || "",
            chapters: chapters || [],
            category: category || "",
            coverUrl: coverUrl || "",
            updatedDate: dateStr,
            ...(accessCountries !== undefined ? { accessCountries } : {}),
          };
          saveState({ ...state, eruditResearch: existing });
          notify("Œuvre mise à jour.", "success");
        } else {
          const newRes = {
            id: `rech_${Date.now()}`,
            authorId: session.id,
            authorName: session.name,
            title,
            subtitle: subtitle || "",
            abstract: abstract || "",
            chapters: chapters || [],
            category: category || "",
            coverUrl: coverUrl || "",
            published: false,
            publishedDate: null,
            accessCountries: null, // null = tous les pays
            createdDate: dateStr,
            updatedDate: dateStr,
          };
          saveState({ ...state, eruditResearch: [...existing, newRes] });
          notify("Œuvre enregistrée.", "success");
        }
      },

      onPublishEruditResearch: (id) => {
        if (!session) return;
        const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
        const updated = (state.eruditResearch || []).map((r) =>
          r.id === id && r.authorId === session.id
            ? { ...r, published: true, publishedDate: formatRPDate(gd) }
            : r
        );
        saveState({ ...state, eruditResearch: updated });
        notify("Travail publié dans la Bibliothèque Impériale.", "success");
      },

      onUnpublishEruditResearch: (id) => {
        if (!session) return;
        const updated = (state.eruditResearch || []).map((r) =>
          r.id === id && r.authorId === session.id ? { ...r, published: false, publishedDate: null } : r
        );
        saveState({ ...state, eruditResearch: updated });
        notify("Travail retiré de la bibliothèque.", "info");
      },

      onDeleteEruditResearch: (id) => {
        if (!session) return;
        const updated = (state.eruditResearch || []).filter(
          (r) => !(r.id === id && r.authorId === session.id)
        );
        saveState({ ...state, eruditResearch: updated });
        notify("Travail supprimé.", "info");
      },

      onSetEruditResearchAccess: (researchId, countryIds) => {
        // countryIds = null (tous) ou [id, id, ...]
        if (!session) return;
        const updated = (state.eruditResearch || []).map(r =>
          r.id === researchId && r.authorId === session.id
            ? { ...r, accessCountries: countryIds }
            : r
        );
        saveState({ ...state, eruditResearch: updated });
        notify("Accès mis à jour.", "success");
      },

      onRequestEruditValidation: (countryId) => {
        if (!session) return;
        const country = (state.countries || []).find((c) => c.id === countryId);
        if (!country) return;
        const existing = (state.eruditRequests || []).find(
          (r) => r.citizenId === session.id && r.countryId === countryId && r.status === "PENDING"
        );
        if (existing) { notify("Demande déjà en cours pour ce pays.", "info"); return; }
        const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
        const newReq = {
          id: `er_${Date.now()}`,
          citizenId: session.id,
          citizenName: session.name,
          countryId,
          countryName: country.name,
          status: "PENDING",
          requestDate: formatRPDate(gd),
          responseDate: null,
          respondedBy: null,
          note: "",
        };
        saveState({ ...state, eruditRequests: [...(state.eruditRequests || []), newReq] });
        notify("Demande de validation soumise.", "success");
      },

      onRespondEruditValidation: (requestId, approved, note = "") => {
        const requests = [...(state.eruditRequests || [])];
        const idx = requests.findIndex((r) => r.id === requestId);
        if (idx === -1) return;
        const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
        requests[idx] = {
          ...requests[idx],
          status: approved ? "APPROVED" : "REJECTED",
          responseDate: formatRPDate(gd),
          respondedBy: session?.name || "Admin",
          note: note || "",
        };
        saveState({ ...state, eruditRequests: requests });
        notify(approved ? "Statut Érudit validé." : "Demande refusée.", approved ? "success" : "info");
      },

      // Titre d'Érudit — statut additif indépendant du rôle (grade/fonction) du citoyen,
      // pour ne pas lui faire perdre un rôle plus élevé en devenant Érudit.
      onRequestEruditTitle: () => {
        if (!session) return;
        const me = (state.citizens || []).find(c => String(c.id) === String(session.id));
        if (!me) return;
        if (me.role === "ERUDIT") { notify("Vous êtes déjà Érudit.", "info"); return; }
        if (me.eruditTitleStatus === "pending") { notify("Demande déjà en cours.", "info"); return; }
        if (me.eruditTitleStatus === "approved") { notify("Vous détenez déjà le titre d'Érudit.", "info"); return; }
        const updated = (state.citizens || []).map(c =>
          String(c.id) === String(session.id) ? { ...c, eruditTitleStatus: "pending" } : c
        );
        saveState({ ...state, citizens: updated });
        notify("Demande de titre d'Érudit soumise.", "success");
      },

      onApproveEruditTitle: (citizenId) => {
        if (!session) return;
        const updated = (state.citizens || []).map(c =>
          String(c.id) === String(citizenId) ? { ...c, eruditTitleStatus: "approved" } : c
        );
        saveState({ ...state, citizens: updated });
        notify("Titre d'Érudit accordé.", "success");
      },

      onRejectEruditTitle: (citizenId) => {
        if (!session) return;
        const updated = (state.citizens || []).map(c =>
          String(c.id) === String(citizenId) ? { ...c, eruditTitleStatus: "rejected" } : c
        );
        saveState({ ...state, citizens: updated });
        notify("Demande de titre d'Érudit refusée.", "info");
      },

      onExpelErudit: (requestId, note = "") => {
        if (!session) return;
        const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
        const requests = (state.eruditRequests || []).map(r =>
          r.id === requestId
            ? { ...r, status: "EXPELLED", expelledDate: formatRPDate(gd), expelledBy: session.name, expelNote: note || "" }
            : r
        );
        saveState({ ...state, eruditRequests: requests });
        notify("Érudit radié.", "info");
      },

      onWithdrawEruditFromCountry: (countryId) => {
        if (!session) return;
        const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
        const requests = (state.eruditRequests || []).map(r =>
          r.citizenId === session.id && r.countryId === countryId && r.status === "APPROVED"
            ? { ...r, status: "WITHDRAWN", withdrawnDate: formatRPDate(gd) }
            : r
        );
        saveState({ ...state, eruditRequests: requests });
        notify("Vous vous êtes retiré de ce pays.", "info");
      },

      // ── MUSHTAGRAM ───────────────────────────────────────────────
      onPostMushtagram: ({ content, imageUrl, hashtags, poll, isOfficial, followersOnly, locked, price, subscribersOnly, postAsEntity }) => {
        if (!session) return;
        const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
        const dateStr = formatRPDate(gd);
        const me = (state.citizens || []).find(c => String(c.id) === String(session.id));
        const isPP = me?.mushtagramPublicPersonality === "approved";

        // — Publication au nom d'une guilde/entreprise —
        let entityAuthor = null;
        if (postAsEntity?.type === "guild") {
          const guild = (state.guilds || []).find(g => String(g.id) === String(postAsEntity.id));
          if (!guild || String(guild.leaderId) !== String(session.id)) { notify("Seul le chef de guilde peut publier en son nom.", "error"); return; }
          entityAuthor = { authorId: `guild_${guild.id}`, authorName: guild.name, authorType: "guild" };
        } else if (postAsEntity?.type === "company") {
          const company = (state.companies || []).find(c => String(c.id) === String(postAsEntity.id));
          const isAuthorized = isCompanyManager(company, session.id) ||
            (company?.mushtagramAuthorizedIds || []).map(String).includes(String(session.id));
          if (!isAuthorized) { notify("Vous n'êtes pas autorisé à publier au nom de l'entreprise.", "error"); return; }
          entityAuthor = { authorId: `company_${company.id}`, authorName: company.name, authorType: "company" };
        }

        let finalLocked = false;
        let finalPrice = 0;
        let citizensPatch = null;

        if (!entityAuthor && locked && me?.mushtagramMonetizationEnabled) {
          if (!isPP) {
            if (me?.mushtagramLastPPVDate === dateStr) {
              notify("Un seul post verrouillé par jour (non-PP).", "error");
              return;
            }
            finalPrice = Math.max(0.1, Math.min(5, Number(price) || 0));
          } else {
            finalPrice = Math.max(0.1, Number(price) || 0);
          }
          finalLocked = true;
          citizensPatch = (state.citizens || []).map(c =>
            String(c.id) === String(session.id) ? { ...c, mushtagramLastPPVDate: dateStr } : c
          );
        }

        const finalSubscribersOnly = !entityAuthor && !!(subscribersOnly && me?.mushtagramMonetizationEnabled && (me?.mushtagramSubTiers || []).length > 0);
        const isAnonymous = !entityAuthor && !!me?.mushtagramAnonymous;

        const newPost = {
          id: `mpost_${Date.now()}`,
          authorId: entityAuthor ? entityAuthor.authorId : session.id,
          authorName: entityAuthor ? entityAuthor.authorName : (isAnonymous ? "Citoyen Anonyme" : session.name),
          ...(entityAuthor ? { authorType: entityAuthor.authorType, postedBy: session.id } : {}),
          isAnonymous,
          content,
          imageUrl: imageUrl || null,
          hashtags: hashtags || [],
          likes: [],
          comments: [],
          date: dateStr,
          createdAt: Date.now(),
          followersOnly: followersOnly || false,
          locked: finalLocked,
          price: finalLocked ? finalPrice : 0,
          unlockedBy: [],
          subscribersOnly: finalSubscribersOnly,
          ...(poll ? { poll } : {}),
          ...(isOfficial ? { isOfficial: true } : {}),
        };

        let newNotifs = state.mushtagramNotifs || [];
        if (isPP && (finalLocked || finalSubscribersOnly)) {
          const subscribers = (state.mushtagramSubscriptions || []).filter(s => String(s.creatorId) === String(session.id));
          if (subscribers.length > 0) {
            const now = Date.now();
            newNotifs = [
              ...newNotifs,
              ...subscribers.map((s, i) => ({
                id: `mnotif_paid_${now}_${i}`,
                toId: String(s.subscriberId),
                type: "new_paid_post",
                fromId: String(session.id),
                fromName: session.name,
                postId: newPost.id,
                timestamp: now,
                read: false,
                priority: "high",
              })),
            ];
          }
        }

        const mentionedIds = extractMentions(content, state.citizens, session.id);
        if (mentionedIds.length > 0) {
          const now = Date.now();
          newNotifs = [
            ...newNotifs,
            ...mentionedIds.map((id, i) => ({
              id: `mnotif_mention_${now}_${i}`,
              toId: id,
              type: "mention",
              fromId: String(session.id),
              fromName: isAnonymous ? "Citoyen Anonyme" : (entityAuthor ? entityAuthor.authorName : session.name),
              isAnonymous,
              postId: newPost.id,
              timestamp: now,
              read: false,
              priority: "low",
            })),
          ];
        }

        saveState({
          ...state,
          mushtagramPosts: [...(state.mushtagramPosts || []), newPost],
          mushtagramNotifs: newNotifs,
          ...(citizensPatch ? { citizens: citizensPatch } : {}),
        });
      },

      onDeleteMushtagramPost: (id) => {
        saveState({ ...state, mushtagramPosts: (state.mushtagramPosts || []).filter((p) => p.id !== id) });
        notify("Publication supprimée.", "info");
      },

      onEditMushtagramPost: (id, updates) => {
        if (!session) return;
        const post = (state.mushtagramPosts || []).find((p) => p.id === id);
        if (!post) { notify("Publication introuvable.", "error"); return; }
        const isOwner = String(post.authorId) === String(session.id) || (post.authorType && String(post.postedBy) === String(session.id));
        if (!isOwner) { notify("Vous ne pouvez modifier que vos propres publications.", "error"); return; }
        // Rétrocompatibilité : accepte soit une chaîne (ancien appel), soit { content, lockedTitle }.
        const { content: newContent, lockedTitle } = typeof updates === "string" ? { content: updates, lockedTitle: undefined } : (updates || {});
        if (!newContent || !newContent.trim()) { notify("La publication ne peut pas être vide.", "error"); return; }
        const posts = (state.mushtagramPosts || []).map((p) =>
          p.id === id
            ? { ...p, content: newContent.trim(), ...(p.locked && lockedTitle !== undefined ? { lockedTitle: lockedTitle.trim() } : {}), editedAt: Date.now() }
            : p
        );
        saveState({ ...state, mushtagramPosts: posts });
        notify("Publication modifiée.", "success");
      },

      onToggleMushtagramLike: (postId) => {
        if (!session) return;
        const origPost = (state.mushtagramPosts || []).find(p => p.id === postId);
        const wasLiked = origPost && (origPost.likes || []).map(String).includes(String(session.id));
        const posts = (state.mushtagramPosts || []).map((p) => {
          if (p.id !== postId) return p;
          const liked = (p.likes || []).map(String).includes(String(session.id));
          return { ...p, likes: liked ? p.likes.filter((id) => String(id) !== String(session.id)) : [...(p.likes || []), session.id] };
        });
        const existingNotifs = state.mushtagramNotifs || [];
        let newNotifs = existingNotifs;
        if (!wasLiked && origPost && String(origPost.authorId) !== String(session.id)) {
          const me = (state.citizens || []).find(c => String(c.id) === String(session.id));
          const isAnonymous = !!me?.mushtagramAnonymous;
          const recipientId = resolveNotifRecipient(origPost.authorId, state);
          newNotifs = [...existingNotifs, { id: `mnotif_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, toId: recipientId, type: "like", fromId: String(session.id), fromName: isAnonymous ? "Citoyen Anonyme" : session.name, isAnonymous, postId, ...(origPost.authorType ? { entityName: origPost.authorName } : {}), timestamp: Date.now(), read: false, priority: "low" }];
        }
        saveState({ ...state, mushtagramPosts: posts, mushtagramNotifs: newNotifs });
      },

      onAddMushtagramComment: (postId, content, replyTo = null) => {
        if (!session || !content?.trim()) return;
        const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
        const origPost = (state.mushtagramPosts || []).find(p => p.id === postId);
        const me = (state.citizens || []).find(c => String(c.id) === String(session.id));
        const isAnonymous = !!me?.mushtagramAnonymous;
        const posts = (state.mushtagramPosts || []).map((p) => {
          if (p.id !== postId) return p;
          const comment = {
            id: `mc_${Date.now()}`,
            authorId: session.id,
            authorName: isAnonymous ? "Citoyen Anonyme" : session.name,
            isAnonymous,
            content: content.trim(),
            likes: [],
            replyTo: replyTo || null,
            date: formatRPDate(gd),
          };
          return { ...p, comments: [...(p.comments || []), comment] };
        });
        const existingNotifs = state.mushtagramNotifs || [];
        const addedNotifs = [];
        if (origPost && String(origPost.authorId) !== String(session.id)) {
          const recipientId = resolveNotifRecipient(origPost.authorId, state);
          addedNotifs.push({ id: `mnotif_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, toId: recipientId, type: "comment", fromId: String(session.id), fromName: isAnonymous ? "Citoyen Anonyme" : session.name, isAnonymous, postId, ...(origPost.authorType ? { entityName: origPost.authorName } : {}), content: content.trim().slice(0, 80), timestamp: Date.now(), read: false, priority: "low" });
        }
        if (replyTo && origPost) {
          // La vue envoie replyTo comme { commentId, authorName } (utilisé aussi pour l'affichage
          // "Réponse à X" sur le commentaire) — accepte aussi un id brut par rétrocompatibilité.
          const replyToId = replyTo && typeof replyTo === "object" ? replyTo.commentId : replyTo;
          const parentComment = (origPost.comments || []).find(c => c.id === replyToId);
          if (parentComment && String(parentComment.authorId) !== String(session.id) && String(parentComment.authorId) !== String(origPost.authorId)) {
            addedNotifs.push({ id: `mnotif_${Date.now()+1}_${Math.random().toString(36).slice(2,6)}`, toId: String(parentComment.authorId), type: "reply", fromId: String(session.id), fromName: isAnonymous ? "Citoyen Anonyme" : session.name, isAnonymous, postId, content: content.trim().slice(0, 80), timestamp: Date.now(), read: false, priority: "low" });
          }
        }
        const mentionedIds = extractMentions(content, state.citizens, session.id);
        if (mentionedIds.length > 0) {
          const now = Date.now();
          mentionedIds.forEach((id, i) => addedNotifs.push({
            id: `mnotif_mention_${now}_${i}`, toId: id, type: "mention", fromId: String(session.id),
            fromName: isAnonymous ? "Citoyen Anonyme" : session.name, isAnonymous, postId,
            content: content.trim().slice(0, 80), timestamp: now, read: false, priority: "low",
          }));
        }
        saveState({ ...state, mushtagramPosts: posts, mushtagramNotifs: [...existingNotifs, ...addedNotifs] });
      },

      onLikeMushtagramComment: (postId, commentId) => {
        if (!session) return;
        const posts = (state.mushtagramPosts || []).map(p => {
          if (p.id !== postId) return p;
          const comments = (p.comments || []).map(c => {
            if (c.id !== commentId) return c;
            const liked = (c.likes || []).map(String).includes(String(session.id));
            return { ...c, likes: liked
              ? (c.likes || []).filter(id => String(id) !== String(session.id))
              : [...(c.likes || []), session.id] };
          });
          return { ...p, comments };
        });
        saveState({ ...state, mushtagramPosts: posts });
      },

      onDeleteMushtagramComment: ({ postId, commentId }) => {
        if (!session || !postId || !commentId) return;
        const post = (state.mushtagramPosts || []).find(p => String(p.id) === String(postId));
        if (!post) return;
        const myCitizen = (state.citizens || []).find(c => String(c.id) === String(session.id));
        const isAdmin = ["EMPEREUR","GRAND_FONC_GLOBAL"].includes(session.role);
        const isCommentAuthor = (post.comments || []).some(c => String(c.id) === String(commentId) && String(c.authorId) === String(session.id));
        const isPostAuthorPP = String(post.authorId) === String(session.id) && myCitizen?.mushtagramPublicPersonality === "approved";
        if (!isAdmin && !isCommentAuthor && !isPostAuthorPP) return;
        const updatedPosts = (state.mushtagramPosts || []).map(p =>
          String(p.id) === String(postId)
            ? { ...p, comments: (p.comments || []).filter(c => String(c.id) !== String(commentId)) }
            : p
        );
        saveState({ ...state, mushtagramPosts: updatedPosts });
        notify("Commentaire supprimé.", "info");
      },

      onPinMushtagramComment: ({ postId, commentId }) => {
        if (!session || !postId) return;
        const post = (state.mushtagramPosts || []).find(p => String(p.id) === String(postId));
        if (!post || String(post.authorId) !== String(session.id)) return;
        const newPinned = post.pinnedCommentId === commentId ? null : commentId;
        const updatedPosts = (state.mushtagramPosts || []).map(p =>
          String(p.id) === String(postId) ? { ...p, pinnedCommentId: newPinned } : p
        );
        saveState({ ...state, mushtagramPosts: updatedPosts });
        notify(newPinned ? "Commentaire épinglé." : "Commentaire désépinglé.", "info");
      },

      onUpdateMushtagramProfile: ({ bio, avatar, handle, banner, photo, officialTitle, externalLink, bannerPosition, photoPosition }) => {
        if (!session) return;
        const updated = (state.citizens || []).map((c) =>
          String(c.id) === String(session.id)
            ? {
                ...c,
                mushtagramBio:            bio            !== undefined ? String(bio).slice(0, 300)          : c.mushtagramBio,
                mushtagramAvatar:         avatar         !== undefined ? avatar                              : c.mushtagramAvatar,
                mushtagramHandle:         handle         !== undefined ? handle                              : c.mushtagramHandle,
                mushtagramBanner:         banner         !== undefined ? banner                              : c.mushtagramBanner,
                mushtagramPhoto:          photo          !== undefined ? photo                               : c.mushtagramPhoto,
                mushtagramOfficialTitle:  officialTitle  !== undefined ? String(officialTitle).slice(0, 80)  : c.mushtagramOfficialTitle,
                mushtagramExternalLink:   externalLink   !== undefined ? String(externalLink).slice(0, 200)  : c.mushtagramExternalLink,
                mushtagramBannerPosition: bannerPosition !== undefined ? bannerPosition                      : c.mushtagramBannerPosition,
                mushtagramPhotoPosition:  photoPosition  !== undefined ? photoPosition                       : c.mushtagramPhotoPosition,
              }
            : c
        );
        saveState({ ...state, citizens: updated });
        notify("Profil mis à jour.", "success");
      },

      // Personnalisation Mushtagram d'un compte officiel de guilde/entreprise —
      // même principe que onUpdateMushtagramProfile, mais réservé au chef de guilde
      // ou au propriétaire de l'entreprise concernée.
      onUpdateEntityMushtagramProfile: ({ entityType, entityId, bio, avatar, handle, banner, photo, bannerPosition, photoPosition }) => {
        if (!session) return;
        const applyFields = (entity) => ({
          ...entity,
          mushtagramBio:            bio            !== undefined ? String(bio).slice(0, 300) : entity.mushtagramBio,
          mushtagramAvatar:         avatar         !== undefined ? avatar                     : entity.mushtagramAvatar,
          mushtagramHandle:         handle         !== undefined ? handle                     : entity.mushtagramHandle,
          mushtagramBanner:         banner         !== undefined ? banner                     : entity.mushtagramBanner,
          mushtagramPhoto:          photo          !== undefined ? photo                      : entity.mushtagramPhoto,
          mushtagramBannerPosition: bannerPosition !== undefined ? bannerPosition             : entity.mushtagramBannerPosition,
          mushtagramPhotoPosition:  photoPosition  !== undefined ? photoPosition              : entity.mushtagramPhotoPosition,
        });

        if (entityType === "guild") {
          const guilds = [...(state.guilds || [])];
          const idx = guilds.findIndex((g) => g.id === entityId);
          if (idx === -1) { notify("Guilde introuvable.", "error"); return; }
          const isLeader = String(guilds[idx].leaderId) === String(session.id) || ["EMPEREUR","GRAND_FONC_GLOBAL"].includes(session.role);
          if (!isLeader) { notify("Seul le chef de guilde peut modifier son compte Mushtagram.", "error"); return; }
          guilds[idx] = applyFields(guilds[idx]);
          saveState({ ...state, guilds });
          notify("Profil de la guilde mis à jour.", "success");
        } else if (entityType === "company") {
          const companies = [...(state.companies || [])];
          const idx = companies.findIndex((c) => c.id === entityId);
          if (idx === -1) { notify("Entreprise introuvable.", "error"); return; }
          const isOwner = isCompanyManager(companies[idx], session.id) || ["EMPEREUR","GRAND_FONC_GLOBAL"].includes(session.role);
          if (!isOwner) { notify("Seul le propriétaire peut modifier le compte Mushtagram de l'entreprise.", "error"); return; }
          companies[idx] = applyFields(companies[idx]);
          saveState({ ...state, companies });
          notify("Profil de l'entreprise mis à jour.", "success");
        } else {
          notify("Type d'entité invalide.", "error");
        }
      },

      onSendMushtagramDM: ({ toId, content }) => {
        if (!session || !content?.trim()) return;
        const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
        const recipient = (state.citizens || []).find(c => String(c.id) === String(toId));
        const dm = {
          id: `mdm_${Date.now()}`,
          fromId: session.id,
          fromName: session.name,
          toId,
          toName: recipient?.name || String(toId),
          content: content.trim(),
          date: formatRPDate(gd),
          createdAt: Date.now(),
          readByRecipient: false,
        };
        // Une conversation active pousse un message par échange RP — regrouper plutôt que
        // créer une entrée par message évite un mur de notifications individuelles sur une
        // négociation un peu longue : on met à jour l'entrée non lue existante (compteur +
        // horodatage) au lieu d'en empiler une nouvelle.
        const existingNotifs = state.mushtagramNotifs || [];
        const existingIdx = existingNotifs.findIndex((n) =>
          n.type === "dm" && String(n.fromId) === String(session.id) && String(n.toId) === String(toId) && !n.read
        );
        let mushtagramNotifs;
        if (existingIdx !== -1) {
          mushtagramNotifs = [...existingNotifs];
          mushtagramNotifs[existingIdx] = {
            ...mushtagramNotifs[existingIdx],
            content: content.trim().slice(0, 60),
            count: (mushtagramNotifs[existingIdx].count || 1) + 1,
            timestamp: Date.now(),
          };
        } else {
          const dmNotif = { id: `mnotif_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, toId: String(toId), type: "dm", fromId: String(session.id), fromName: session.name, content: content.trim().slice(0, 60), timestamp: Date.now(), read: false, priority: "high", count: 1 };
          mushtagramNotifs = [...existingNotifs, dmNotif];
        }
        saveState({ ...state, mushtagramDMs: [...(state.mushtagramDMs || []), dm], mushtagramNotifs });
      },

      onDeleteMushtagramDM: (dmId) => {
        if (!session) return;
        const dm = (state.mushtagramDMs || []).find(d => d.id === dmId);
        if (!dm) return;
        const isAdmin = ["EMPEREUR","GRAND_FONC_GLOBAL"].includes(session.role);
        if (String(dm.fromId) !== String(session.id) && !isAdmin) { notify("Vous ne pouvez supprimer que vos propres messages.", "error"); return; }
        saveState({ ...state, mushtagramDMs: (state.mushtagramDMs || []).filter(d => d.id !== dmId) });
      },

      // Masque un message reçu de la conversation de l'appelant uniquement — l'autre
      // partie continue de le voir de son côté. Contrairement à onDeleteMushtagramDM
      // (suppression globale, réservée à l'expéditeur), tout participant peut l'utiliser.
      onHideMushtagramDM: (dmId) => {
        if (!session) return;
        const dm = (state.mushtagramDMs || []).find(d => d.id === dmId);
        if (!dm) return;
        if (String(dm.fromId) !== String(session.id) && String(dm.toId) !== String(session.id)) {
          notify("Vous ne participez pas à cette conversation.", "error");
          return;
        }
        const dms = (state.mushtagramDMs || []).map(d =>
          d.id === dmId
            ? { ...d, hiddenFor: [...new Set([...(d.hiddenFor || []), session.id])] }
            : d
        );
        saveState({ ...state, mushtagramDMs: dms });
      },

      onMarkMushtagramNotifsRead: (ids) => {
        if (!session) return;
        const idsSet = new Set((ids || []).map(String));
        const notifs = (state.mushtagramNotifs || []).map(n =>
          idsSet.has(String(n.id)) && String(n.toId) === String(session.id) ? { ...n, read: true } : n
        );
        saveState({ ...state, mushtagramNotifs: notifs });
      },

      // Marque les messages d'une conversation comme lus ET la ou les notifications de la
      // cloche correspondantes — auparavant seul mushtagramDMs.readByRecipient était mis à
      // jour ici, laissant les entrées de mushtagramNotifs bloquées sur read:false même après
      // lecture effective (une resynchronisation ne se faisait qu'au travers d'un useEffect
      // fragile côté UI, déclenché uniquement en cliquant précisément la conversation dans
      // l'onglet Messages — jamais depuis un clic sur la notification elle-même).
      onMarkMushtagramDMsRead: (fromId) => {
        if (!session) return;
        const dms = (state.mushtagramDMs || []).map((dm) =>
          dm.fromId === fromId && dm.toId === session.id ? { ...dm, readByRecipient: true } : dm
        );
        const mushtagramNotifs = (state.mushtagramNotifs || []).map((n) =>
          n.type === "dm" && String(n.fromId) === String(fromId) && String(n.toId) === String(session.id) ? { ...n, read: true } : n
        );
        saveState({ ...state, mushtagramDMs: dms, mushtagramNotifs });
      },

      onFollowMushtagram: (userId) => {
        if (!session) return;
        const updated = (state.citizens||[]).map(c =>
          c.id === session.id
            ? { ...c, mushtagramFollowing: [...new Set([...(c.mushtagramFollowing||[]), String(userId)])] }
            : c
        );
        const existingNotifs = state.mushtagramNotifs || [];
        const recipientId = resolveNotifRecipient(userId, state);
        const entityGuild = String(userId).startsWith("guild_") ? (state.guilds || []).find(g => `guild_${g.id}` === String(userId)) : null;
        const entityCompany = String(userId).startsWith("company_") ? (state.companies || []).find(c => `company_${c.id}` === String(userId)) : null;
        const entityName = entityGuild?.name || entityCompany?.name || null;
        const notif = { id: `mnotif_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, toId: recipientId, type: "follow", fromId: String(session.id), fromName: session.name, ...(entityName ? { entityName } : {}), timestamp: Date.now(), read: false, priority: "high" };
        saveState({ ...state, citizens: updated, mushtagramNotifs: [...existingNotifs, notif] });
      },

      onUnfollowMushtagram: (userId) => {
        if (!session) return;
        const updated = (state.citizens||[]).map(c =>
          c.id === session.id
            ? { ...c, mushtagramFollowing: (c.mushtagramFollowing||[]).filter(id => id !== String(userId)) }
            : c
        );
        saveState({ ...state, citizens: updated });
      },

      onToggleMushtagramMute: (userId) => {
        if (!session) return;
        const updated = (state.citizens || []).map(c => {
          if (String(c.id) !== String(session.id)) return c;
          const muted = c.mushtagramMutedUsers || [];
          const isMuted = muted.map(String).includes(String(userId));
          return { ...c, mushtagramMutedUsers: isMuted ? muted.filter(id => String(id) !== String(userId)) : [...muted, String(userId)] };
        });
        saveState({ ...state, citizens: updated });
      },

      onMarkMushtagramFeedSeen: () => {
        if (!session) return;
        const updated = (state.citizens || []).map(c =>
          String(c.id) === String(session.id) ? { ...c, mushtagramLastSeenAt: Date.now() } : c
        );
        saveState({ ...state, citizens: updated });
      },

      onUpdateMushtagramMonetization: ({ enabled, tiers }) => {
        if (!session) return;
        const me = (state.citizens || []).find(c => String(c.id) === String(session.id));
        const isPP = me?.mushtagramPublicPersonality === "approved";
        let cleanTiers = (Array.isArray(tiers) ? tiers : [])
          .filter(t => t?.name?.trim())
          .map(t => ({
            id: t.id || `tier_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: String(t.name).trim().slice(0, 40),
            price: Math.max(0.1, Number(t.price) || 0),
          }));
        if (!isPP) {
          cleanTiers = cleanTiers.slice(0, 1).map(t => ({ ...t, price: Math.min(5, t.price) }));
        } else {
          cleanTiers = cleanTiers.slice(0, 6);
        }
        const wasEnabled = !!me?.mushtagramMonetizationEnabled;
        const nowEnabled = !!enabled;
        const updated = (state.citizens || []).map(c =>
          String(c.id) === String(session.id)
            ? { ...c, mushtagramMonetizationEnabled: nowEnabled, mushtagramSubTiers: cleanTiers }
            : c
        );
        let subs = state.mushtagramSubscriptions || [];
        if (wasEnabled && !nowEnabled) {
          subs = subs.filter(s => String(s.creatorId) !== String(session.id));
        }
        saveState({ ...state, citizens: updated, mushtagramSubscriptions: subs });
        notify(nowEnabled ? "Contenu payant activé." : "Contenu payant désactivé.", "success");
      },

      onSubscribeMushtagramCreator: ({ creatorId, tierId }) => {
        if (!session) return;
        if (String(creatorId) === String(session.id)) return;
        const creator = (state.citizens || []).find(c => String(c.id) === String(creatorId));
        if (!creator?.mushtagramMonetizationEnabled) { notify("Ce compte n'a pas de contenu payant actif.", "error"); return; }
        const tier = (creator.mushtagramSubTiers || []).find(t => t.id === tierId);
        if (!tier) { notify("Palier introuvable.", "error"); return; }
        const me = (state.citizens || []).find(c => String(c.id) === String(session.id));
        if ((me?.balance || 0) < tier.price) { notify("Solde insuffisant.", "error"); return; }

        const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
        const dateStr = formatRPDate(gd);
        const updatedCitizens = (state.citizens || []).map(c => {
          if (String(c.id) === String(session.id)) return { ...c, balance: Math.round(((c.balance || 0) - tier.price) * 10) / 10 };
          if (String(c.id) === String(creatorId)) return { ...c, balance: Math.round(((c.balance || 0) + tier.price) * 10) / 10, mushtagramTotalPaidRevenue: Math.round((((c.mushtagramTotalPaidRevenue || 0) + tier.price)) * 10) / 10 };
          return c;
        });
        const subs = (state.mushtagramSubscriptions || []).filter(s => !(String(s.subscriberId) === String(session.id) && String(s.creatorId) === String(creatorId)));
        subs.push({
          id: `msub_${Date.now()}`,
          subscriberId: String(session.id), subscriberName: session.name,
          creatorId: String(creatorId), creatorName: creator.name,
          tierId: tier.id, tierName: tier.name, price: tier.price,
          startedAt: Date.now(), lastBilledDate: dateStr,
        });
        const notifs = [...(state.mushtagramNotifs || []), {
          id: `mnotif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          toId: String(creatorId), type: "subscribe", fromId: String(session.id), fromName: session.name,
          content: tier.name, timestamp: Date.now(), read: false, priority: "high",
        }];
        const ledger = [{ id: Date.now() + Math.random(), fromName: session.name, toName: creator.name, amount: tier.price, timestamp: Date.now(), reason: `Abonnement Mushtagram — ${tier.name}`, type: "MUSHTAGRAM_SUB" }, ...(state.globalLedger || [])];
        saveState({ ...state, citizens: updatedCitizens, mushtagramSubscriptions: subs, mushtagramNotifs: notifs, globalLedger: ledger });
        notify(`Abonné à ${creator.name} — ${tier.name}.`, "success");
      },

      onUnsubscribeMushtagramCreator: ({ creatorId }) => {
        if (!session) return;
        const subs = (state.mushtagramSubscriptions || []).filter(s => !(String(s.subscriberId) === String(session.id) && String(s.creatorId) === String(creatorId)));
        saveState({ ...state, mushtagramSubscriptions: subs });
        notify("Désabonné.", "info");
      },

      onUnlockMushtagramPost: (postId) => {
        if (!session) return;
        const post = (state.mushtagramPosts || []).find(p => p.id === postId);
        if (!post || !post.locked) return;
        if (String(post.authorId) === String(session.id)) return;
        if ((post.unlockedBy || []).map(String).includes(String(session.id))) return;
        const me = (state.citizens || []).find(c => String(c.id) === String(session.id));
        if ((me?.balance || 0) < post.price) { notify("Solde insuffisant.", "error"); return; }

        const updatedCitizens = (state.citizens || []).map(c => {
          if (String(c.id) === String(session.id)) return { ...c, balance: Math.round(((c.balance || 0) - post.price) * 10) / 10 };
          if (String(c.id) === String(post.authorId)) return { ...c, balance: Math.round(((c.balance || 0) + post.price) * 10) / 10, mushtagramTotalPaidRevenue: Math.round((((c.mushtagramTotalPaidRevenue || 0) + post.price)) * 10) / 10 };
          return c;
        });
        const posts = (state.mushtagramPosts || []).map(p => p.id === postId ? { ...p, unlockedBy: [...(p.unlockedBy || []), String(session.id)] } : p);
        const isAnonymous = !!me?.mushtagramAnonymous;
        const notifs = [...(state.mushtagramNotifs || []), {
          id: `mnotif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          toId: String(post.authorId), type: "unlock", fromId: String(session.id), fromName: isAnonymous ? "Citoyen Anonyme" : session.name, isAnonymous,
          postId, timestamp: Date.now(), read: false, priority: "high",
        }];
        const ledger = [{ id: Date.now() + Math.random(), fromName: session.name, toName: post.authorName, amount: post.price, timestamp: Date.now(), reason: "Déverrouillage publication Mushtagram", type: "MUSHTAGRAM_PPV" }, ...(state.globalLedger || [])];
        saveState({ ...state, citizens: updatedCitizens, mushtagramPosts: posts, mushtagramNotifs: notifs, globalLedger: ledger });
        notify("Publication déverrouillée.", "success");
      },

      onTipMushtagramCreator: ({ toId, amount }) => {
        if (!session) return;
        if (String(toId) === String(session.id)) return;
        const amt = Math.max(0.1, Number(amount) || 0);
        const me = (state.citizens || []).find(c => String(c.id) === String(session.id));
        if ((me?.balance || 0) < amt) { notify("Solde insuffisant.", "error"); return; }
        const recipient = (state.citizens || []).find(c => String(c.id) === String(toId));
        if (!recipient) return;
        const updatedCitizens = (state.citizens || []).map(c => {
          if (String(c.id) === String(session.id)) return { ...c, balance: Math.round(((c.balance || 0) - amt) * 10) / 10 };
          if (String(c.id) === String(toId)) return { ...c, balance: Math.round(((c.balance || 0) + amt) * 10) / 10 };
          return c;
        });
        const isAnonymous = !!me?.mushtagramAnonymous;
        const notifs = [...(state.mushtagramNotifs || []), {
          id: `mnotif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          toId: String(toId), type: "tip", fromId: String(session.id), fromName: isAnonymous ? "Citoyen Anonyme" : session.name, isAnonymous,
          content: formatMoney(amt), timestamp: Date.now(), read: false, priority: "high",
        }];
        const ledger = [{ id: Date.now() + Math.random(), fromName: session.name, toName: recipient.name, amount: amt, timestamp: Date.now(), reason: "Pourboire Mushtagram", type: "MUSHTAGRAM_TIP" }, ...(state.globalLedger || [])];
        saveState({ ...state, citizens: updatedCitizens, mushtagramNotifs: notifs, globalLedger: ledger });
        notify(`Pourboire de ${formatMoney(amt)} envoyé.`, "success");
      },

      onDismissMushtagramReport: (postId) => {
        if (!session) return;
        const posts = (state.mushtagramPosts || []).map(p => p.id === postId ? { ...p, reports: [] } : p);
        saveState({ ...state, mushtagramPosts: posts });
        notify("Signalements ignorés.", "info");
      },

      onReactMushtagram: (postId, emoji) => {
        if (!session) return;
        const posts = (state.mushtagramPosts||[]).map(p => {
          if (p.id !== postId) return p;
          const reactions = { ...(p.reactions || {}) };
          // Remove from all other emojis first
          Object.keys(reactions).forEach(e => {
            reactions[e] = (reactions[e]||[]).filter(id => id !== session.id);
          });
          // Toggle on selected emoji
          const current = reactions[emoji] || [];
          const wasOn = current.includes(session.id);
          reactions[emoji] = wasOn ? current : [...current, session.id];
          return { ...p, reactions };
        });
        saveState({ ...state, mushtagramPosts: posts });
      },

      onRepostMushtagram: (postId) => {
        if (!session) return;
        const original = (state.mushtagramPosts||[]).find(p => p.id === postId);
        if (!original) return;
        if (original.locked || original.subscribersOnly) {
          notify("Impossible de republier un contenu payant.", "error");
          return;
        }
        const alreadyReposted = (state.mushtagramPosts||[]).some(
          p => String(p.authorId) === String(session.id) && p.repostOf?.postId === postId
        );
        if (alreadyReposted) { notify("Vous avez déjà republié cette publication.", "info"); return; }
        const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
        const newPost = {
          id: `mpost_${Date.now()}`,
          authorId: session.id,
          authorName: session.name,
          content: "",
          imageUrl: null,
          hashtags: original.hashtags || [],
          reactions: {},
          comments: [],
          date: formatRPDate(gd),
          createdAt: Date.now(),
          repostOf: {
            postId: original.id,
            authorId: original.authorId,
            authorName: original.authorName,
            content: original.content,
            imageUrl: original.imageUrl || null,
            poll: original.poll || null,
          },
        };
        const existingNotifs = state.mushtagramNotifs || [];
        const repostNotif = String(original.authorId) !== String(session.id)
          ? [{ id: `mnotif_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, toId: resolveNotifRecipient(original.authorId, state), type: "repost", fromId: String(session.id), fromName: session.name, postId, ...(original.authorType ? { entityName: original.authorName } : {}), timestamp: Date.now(), read: false, priority: "low" }]
          : [];
        saveState({ ...state, mushtagramPosts: [...(state.mushtagramPosts||[]), newPost], mushtagramNotifs: [...existingNotifs, ...repostNotif] });
        notify("Publication republiée.", "success");
      },

      onVoteMushtagramPoll: (postId, optionIdx) => {
        if (!session) return;
        const posts = (state.mushtagramPosts||[]).map(p => {
          if (p.id !== postId || !p.poll) return p;
          const options = p.poll.options.map((opt, i) => ({
            ...opt,
            votes: i === optionIdx
              ? (opt.votes||[]).includes(session.id) ? opt.votes : [...(opt.votes||[]), session.id]
              : (opt.votes||[]).filter(id => id !== session.id),
          }));
          return { ...p, poll: { ...p.poll, options } };
        });
        saveState({ ...state, mushtagramPosts: posts });
      },

      onPinMushtagramPost: (postId) => {
        if (!session) return;
        const updated = (state.citizens||[]).map(c =>
          c.id === session.id
            ? { ...c, mushtagramPinned: c.mushtagramPinned === postId ? null : postId }
            : c
        );
        saveState({ ...state, citizens: updated });
      },

      onReportMushtagramPost: (postId) => {
        if (!session) return;
        const posts = (state.mushtagramPosts||[]).map(p =>
          p.id === postId && !(p.reports||[]).includes(session.id)
            ? { ...p, reports: [...(p.reports||[]), session.id] }
            : p
        );
        saveState({ ...state, mushtagramPosts: posts });
      },

      onPostMushtagramStory: ({ content, imageUrl }) => {
        if (!session) return;
        const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
        const story = {
          id: `mstory_${Date.now()}`,
          authorId: session.id,
          authorName: session.name,
          content,
          imageUrl: imageUrl || null,
          likes: [],
          createdAt: Date.now(),
          date: formatRPDate(gd),
        };
        saveState({ ...state, mushtagramStories: [...(state.mushtagramStories||[]), story] });
      },

      onLikeMushtagramStory: (storyId) => {
        if (!session) return;
        const stories = (state.mushtagramStories || []).map(s => {
          if (s.id !== storyId) return s;
          const liked = (s.likes || []).map(String).includes(String(session.id));
          return { ...s, likes: liked
            ? (s.likes || []).filter(id => String(id) !== String(session.id))
            : [...(s.likes || []), session.id] };
        });
        saveState({ ...state, mushtagramStories: stories });
      },

      onDeleteMushtagramStory: (id) => {
        saveState({ ...state, mushtagramStories: (state.mushtagramStories||[]).filter(s => s.id !== id) });
      },

      onUpdateMushtagramSettings: ({ isPrivate, isAnonymous, hideReposts }) => {
        if (!session) return;
        const updated = (state.citizens||[]).map(c =>
          String(c.id) === String(session.id)
            ? { ...c,
                mushtagramPrivate: isPrivate ?? c.mushtagramPrivate ?? false,
                mushtagramAnonymous: isAnonymous ?? c.mushtagramAnonymous ?? false,
                mushtagramHideReposts: hideReposts ?? c.mushtagramHideReposts ?? false,
              }
            : c
        );
        saveState({ ...state, citizens: updated });
      },

      onRequestPublicPersonality: () => {
        if (!session) return;
        const existing = (state.citizens||[]).find(c => String(c.id) === String(session.id));
        // Un refus n'est pas définitif : seul un statut en attente ou déjà accordé bloque une nouvelle demande.
        if (existing?.mushtagramPublicPersonality === "pending" || existing?.mushtagramPublicPersonality === "approved" || existing?.mushtagramPublicPersonality === true) {
          notify("Demande déjà soumise ou statut déjà accordé.", "info");
          return;
        }
        const updated = (state.citizens||[]).map(c =>
          String(c.id) === String(session.id)
            ? { ...c, mushtagramPublicPersonality: "pending" }
            : c
        );
        saveState({ ...state, citizens: updated });
        notify("Demande de Personnalité Publique soumise.", "success");
      },

      onApprovePublicPersonality: (citizenId) => {
        if (!session) return;
        const updated = (state.citizens||[]).map(c =>
          String(c.id) === String(citizenId)
            ? { ...c, mushtagramPublicPersonality: "approved" }
            : c
        );
        const ppNotif = { id: `mnotif_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, toId: String(citizenId), type: "pp_status", status: "approved", fromName: "Administration Impériale", content: "Statut Personnalité Publique accordé : paliers de contenu payant illimités, publications réservées aux abonnés et badge de profil débloqués.", timestamp: Date.now(), read: false, priority: "high" };
        saveState({ ...state, citizens: updated, mushtagramNotifs: [...(state.mushtagramNotifs || []), ppNotif] });
        notify("Statut Personnalité Publique accordé.", "success");
      },

      onRejectPublicPersonality: (citizenId) => {
        if (!session) return;
        const updated = (state.citizens||[]).map(c =>
          String(c.id) === String(citizenId)
            ? { ...c, mushtagramPublicPersonality: "rejected" }
            : c
        );
        const ppNotif = { id: `mnotif_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, toId: String(citizenId), type: "pp_status", status: "rejected", fromName: "Administration Impériale", content: "Demande de statut Personnalité Publique refusée. Une nouvelle demande peut être soumise à tout moment.", timestamp: Date.now(), read: false, priority: "high" };
        saveState({ ...state, citizens: updated, mushtagramNotifs: [...(state.mushtagramNotifs || []), ppNotif] });
        notify("Demande refusée.", "info");
      },

      onRevokePublicPersonality: (citizenId) => {
        if (!session) return;
        const updated = (state.citizens||[]).map(c =>
          String(c.id) === String(citizenId)
            ? { ...c, mushtagramPublicPersonality: "rejected" }
            : c
        );
        const ppNotif = { id: `mnotif_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, toId: String(citizenId), type: "pp_status", status: "revoked", fromName: "Administration Impériale", content: "Statut Personnalité Publique révoqué par l'administration.", timestamp: Date.now(), read: false, priority: "high" };
        saveState({ ...state, citizens: updated, mushtagramNotifs: [...(state.mushtagramNotifs || []), ppNotif] });
        notify("Statut Personnalité Publique révoqué.", "success");
      },

      onBroadcastMushtagram: ({ content }) => {
        if (!session || !content?.trim()) return;
        const isPP = (state.citizens || []).find(c => String(c.id) === String(session.id))?.mushtagramPublicPersonality === "approved";
        if (!isPP) return;
        const followers = (state.citizens || []).filter(c =>
          (c.mushtagramFollowing || []).includes(String(session.id))
        );
        if (followers.length === 0) { notify("Aucun abonné.", "info"); return; }
        const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
        const now = Date.now();
        const newDMs = followers.map((follower, i) => ({
          id: `mdm_broadcast_${now}_${i}`,
          fromId: session.id,
          fromName: session.name,
          toId: String(follower.id),
          toName: follower.name,
          content: `[Diffusion] ${content.trim()}`,
          date: formatRPDate(gd),
          createdAt: now,
          readByRecipient: false,
          isBroadcast: true,
        }));
        const newNotifs = followers.map((follower, i) => ({
          id: `mnotif_broadcast_${now}_${i}`,
          toId: String(follower.id),
          type: "dm",
          fromId: String(session.id),
          fromName: session.name,
          content: content.trim().slice(0, 60),
          timestamp: now,
          read: false,
          priority: "high",
        }));
        saveState({
          ...state,
          mushtagramDMs: [...(state.mushtagramDMs || []), ...newDMs],
          mushtagramNotifs: [...(state.mushtagramNotifs || []), ...newNotifs],
        });
        notify(`Message envoyé à ${followers.length} abonné${followers.length > 1 ? "s" : ""}.`, "success");
      },
      // ────────────────────────────────────────────────────────────

    }, notify);
  }, [session, state, saveState, notify]);
};
