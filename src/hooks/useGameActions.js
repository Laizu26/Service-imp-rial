import { useMemo } from "react";
import { formatMoney, toRoman, formatRPDate } from "../lib/gameUtils";

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

// ──────────────────────────────────────────────────────────────────────────────

export const useGameActions = (session, state, saveState, notify) => {
  return useMemo(() => {
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
        companies.forEach((company, compIdx) => {
          if (company.frozen) return;

          const empCount = (company.employees || []).length;
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

        // --- Production journalière (Ferme) ---
        (ns.properties || []).forEach((prop, propIdx) => {
          if (!prop.production || !prop.production.itemName || !prop.production.qtyPerDay) return;
          if (!prop.ownerId) return;
          const qty = prop.production.qtyPerDay;
          if (prop.ownerType === "COMPANY") {
            const cIdx = (ns.companies || []).findIndex((c) => c.id === prop.ownerId);
            if (cIdx !== -1) {
              const inv = [...(ns.companies[cIdx].companyInventory || [])];
              const iIdx = inv.findIndex((i) => i.name === prop.production.itemName);
              if (iIdx !== -1) inv[iIdx] = { ...inv[iIdx], quantity: inv[iIdx].quantity + qty };
              else inv.push({ name: prop.production.itemName, quantity: qty });
              ns.companies[cIdx] = { ...ns.companies[cIdx], companyInventory: inv };
            }
          } else {
            const oIdx = (ns.citizens || []).findIndex((c) => c.id === prop.ownerId);
            if (oIdx !== -1) {
              const inv = [...(ns.citizens[oIdx].inventory || [])];
              const iIdx = inv.findIndex((i) => i.name === prop.production.itemName);
              if (iIdx !== -1) inv[iIdx] = { ...inv[iIdx], quantity: inv[iIdx].quantity + qty };
              else inv.push({ name: prop.production.itemName, quantity: qty });
              ns.citizens[oIdx] = { ...ns.citizens[oIdx], inventory: inv };
            }
          }
          ns.properties[propIdx] = { ...ns.properties[propIdx], production: { ...prop.production, lastProduced: `${ns.gameDate.day}/${ns.gameDate.month}/${ns.gameDate.year}` } };
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
            }
          });
        });

        // --- Abonnement Bague Impériale : débit 10 écus + reset compteur voyages ---
        const BAGUE_COUT = 10;
        let bagueResiliations = 0;
        ns.citizens = (ns.citizens || []).map((c) => {
          if (!c.bagueImperiale) return c;
          if ((c.balance || 0) < BAGUE_COUT) {
            bagueResiliations++;
            return { ...c, bagueImperiale: false, bagueVoyagesUsed: 0 };
          }
          return { ...c, balance: (c.balance || 0) - BAGUE_COUT, bagueVoyagesUsed: 0 };
        });

        saveState(ns);
        notify(
          `Nouveau jour : ${ns.gameDate.day}/${ns.gameDate.month}/${ns.gameDate.year} (${season})${bagueResiliations > 0 ? ` — ${bagueResiliations} bague(s) résiliée(s) (fonds insuffisants)` : ""}`,
          "info"
        );
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
        if (company.ownerId !== session.id) {
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

      // --- GESTION TRÉSORERIE ---
      onCompanyTreasury: (companyId, amount, type) => {
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

        const terms = contractTerms || { type: "MERCENARIAT", contractDurationDays: null, dimePercent: 0, corveeFreeDaysPerMonth: 0, buyoutAmount: 0, migrationLocked: false, customClauses: [] };
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
            const defaultTerms = { type: "MERCENARIAT", contractDurationDays: null, dimePercent: 0, corveeFreeDaysPerMonth: 0, buyoutAmount: 0, migrationLocked: false, customClauses: [] };
            newCompanies[compIdx] = {
              ...company,
              employees: [...(company.employees || []), user.id],
              employeeSeniority: seniorityData,
              employmentContracts: {
                ...(company.employmentContracts || {}),
                [user.id]: { ...(offer.contractTerms || defaultTerms), signedAt: Date.now() },
              },
            };
            notify(`Vous avez rejoint ${company.name}.`, "success");
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
          delete firedContracts[targetId];
          newCompanies[compIdx] = {
            ...company,
            employees: (company.employees || []).filter((id) => id !== targetId),
            employmentContracts: firedContracts,
          };
          notify("Employé licencié.", "info");
        } else if (action === "ASSIGN_SLAVE") {
          if ((company.slaves || []).includes(targetId)) return;
          newCompanies[compIdx] = {
            ...company,
            slaves: [...(company.slaves || []), targetId],
          };
          notify("Esclave affecté.", "success");
        } else if (action === "REMOVE_SLAVE") {
          newCompanies[compIdx] = {
            ...company,
            slaves: (company.slaves || []).filter((id) => id !== targetId),
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
        newCompanies[compIdx] = {
          ...company,
          employees: (company.employees || []).filter((id) => id !== session.id),
          employmentContracts: newContracts,
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
        if (company.ownerId !== session.id) { notify("Action non autorisée.", "error"); return; }
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
        const BAGUE_COUT = 10;
        const idx = (state.citizens || []).findIndex((c) => c.id === session.id);
        if (idx === -1) return;
        const citizen = state.citizens[idx];
        if (citizen.bagueImperiale) { notify("Abonnement Bague Impériale déjà actif.", "info"); return; }
        if ((citizen.balance || 0) < BAGUE_COUT) { notify(`Fonds insuffisants — ${BAGUE_COUT} écus requis.`, "error"); return; }
        const newCitizens = [...state.citizens];
        newCitizens[idx] = { ...citizen, bagueImperiale: true, bagueVoyagesUsed: 0, balance: (citizen.balance || 0) - BAGUE_COUT };
        saveState({ ...state, citizens: newCitizens });
        notify("💍 Abonnement Bague Impériale activé — 10 écus prélevés.", "success");
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

      onRequestTravel: (toCountryId, toRegion) => {
        const currentCitizen = (state.citizens || []).find((c) => c.id === session.id);
        // Vérification compteur voyages Bague Impériale
        if (currentCitizen?.bagueImperiale) {
          const used = currentCitizen.bagueVoyagesUsed || 0;
          if (used >= 2) { notify("Limite journalière atteinte — 2 voyages/jour inclus avec la Bague Impériale.", "error"); return; }
        }
        const fromCountry = currentCitizen?.locationCountryId || currentCitizen?.countryId || session.countryId;
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
        };
        let newCitizens = state.citizens;
        if (currentCitizen?.bagueImperiale) {
          const cidx = (state.citizens || []).findIndex((c) => c.id === session.id);
          if (cidx !== -1) {
            newCitizens = [...state.citizens];
            newCitizens[cidx] = { ...newCitizens[cidx], bagueVoyagesUsed: (currentCitizen.bagueVoyagesUsed || 0) + 1 };
          }
        }
        saveState({ ...state, citizens: newCitizens, travelRequests: [...(state.travelRequests || []), newReq] });
        notify("Demande soumise.", "success");
      },

      onInternalTravel: (toRegion) => {
        if (!session) return;
        const currentCitizen = (state.citizens || []).find((c) => c.id === session.id);
        if (currentCitizen?.bagueImperiale) {
          const used = currentCitizen.bagueVoyagesUsed || 0;
          if (used >= 2) { notify("Limite journalière atteinte — 2 voyages/jour inclus avec la Bague Impériale.", "error"); return; }
        }
        const userIdx = (state.citizens || []).findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const newCitizens = [...state.citizens];
        newCitizens[userIdx] = {
          ...newCitizens[userIdx],
          currentPosition: toRegion || "Capitale",
          ...(currentCitizen?.bagueImperiale ? { bagueVoyagesUsed: (currentCitizen.bagueVoyagesUsed || 0) + 1 } : {}),
        };
        saveState({ ...state, citizens: newCitizens });
        notify(`Déplacement vers ${toRegion || "la Capitale"}.`, "success");
      },
      onUpdateCitizen: (formData) => {
        if (!session) return;
        let freshCitizens = [...(state.citizens || [])];
        const index = freshCitizens.findIndex((x) => x.id === formData.id);

        if (index !== -1) {
          freshCitizens[index] = { ...freshCitizens[index], ...formData };
        } else {
          freshCitizens.push(formData);
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

        saveState({ ...state, citizens: freshCitizens, families: freshFamilies });
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
          else if (dominance === "epoux_dominant") fiefDominantId = null; // résolu à l'affichage selon genre
          else if (dominance === "epouse_dominante") fiefDominantId = null;
          sharedAccounts[pairKey] = { type: "fief", balance: 0, members: [session.id, proposerId], dominance, fiefDominantId };
        }

        newCitizens[userIdx] = {
          ...newCitizens[userIdx],
          spouseId: userSpouses[0]?.id || proposerId,
          spouses: userSpouses,
          marriageProposals: (user.marriageProposals || []).filter((p) => p.fromId !== proposerId),
        };
        newCitizens[proposerIdx] = {
          ...newCitizens[proposerIdx],
          spouseId: proposerSpouses[0]?.id || session.id,
          spouses: proposerSpouses,
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

        newCitizens[slaveIdx] = { ...newCitizens[slaveIdx], spouseId: slaveSpouses[0]?.id || proposerId, spouses: slaveSpouses,
          marriageProposals: (slave.marriageProposals || []).filter((p) => p.fromId !== proposerId) };
        newCitizens[proposerIdx] = { ...newCitizens[proposerIdx], spouseId: proposerSpouses[0]?.id || slaveId, spouses: proposerSpouses };
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

        const newSlaveSpouses = (slave.spouses || []).filter((s) => s.id !== spouseId);
        newCitizens[slaveIdx] = { ...slave, spouseId: newSlaveSpouses[0]?.id || null, spouses: newSlaveSpouses };
        if (spouseIdx !== -1) {
          const spouse = newCitizens[spouseIdx];
          const newSpouseSpouses = (spouse.spouses || []).filter((s) => s.id !== slaveId);
          newCitizens[spouseIdx] = { ...spouse, spouseId: newSpouseSpouses[0]?.id || null, spouses: newSpouseSpouses };
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
        if (!window.confirm("Rompre cette union ? Les vœux seront brisés de manière irréversible.")) return;
        const spouseIdx = newCitizens.findIndex((c) => c.id === targetSpouseId);

        // Récupérer la clé du compte commun avant de supprimer le lien
        const spouseEntry = (user.spouses || []).find((s) => s.id === targetSpouseId);
        const pairKey = spouseEntry?.sharedBalanceKey || spouseEntry?.fiefBalanceKey;

        const newUserSpouses = (user.spouses || []).filter((s) => s.id !== targetSpouseId);
        newCitizens[userIdx] = { ...user, spouseId: newUserSpouses[0]?.id || null, spouses: newUserSpouses };
        if (spouseIdx !== -1) {
          const spouse = newCitizens[spouseIdx];
          const newSpouseSpouses = (spouse.spouses || []).filter((s) => s.id !== session.id);
          newCitizens[spouseIdx] = { ...spouse, spouseId: newSpouseSpouses[0]?.id || null, spouses: newSpouseSpouses };
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

      // Dépôt dans le trésor commun / fief
      onSharedAccountDeposit: (pairKey, amount) => {
        if (!session) return;
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) return;
        const newCitizens = [...state.citizens];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const sharedAccounts = { ...(state.sharedAccounts || {}) };
        if (!sharedAccounts[pairKey]) { notify("Compte introuvable.", "error"); return; }
        if ((newCitizens[userIdx].balance || 0) < amt) { notify("Votre trésor personnel est insuffisant.", "error"); return; }
        newCitizens[userIdx] = { ...newCitizens[userIdx], balance: (newCitizens[userIdx].balance || 0) - amt };
        sharedAccounts[pairKey] = { ...sharedAccounts[pairKey], balance: (sharedAccounts[pairKey].balance || 0) + amt };
        saveState({ ...state, citizens: newCitizens, sharedAccounts });
        notify(`${formatMoney(amt)} versés dans le trésor commun.`, "success");
      },

      // Retrait du trésor commun / fief (avec vérification de domination pour le fief)
      onSharedAccountWithdraw: (pairKey, amount) => {
        if (!session) return;
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) return;
        const newCitizens = [...state.citizens];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const sharedAccounts = { ...(state.sharedAccounts || {}) };
        const account = sharedAccounts[pairKey];
        if (!account) { notify("Compte introuvable.", "error"); return; }

        // Vérification droits pour le fief
        if (account.type === "fief") {
          const userSpouseEntry = (newCitizens[userIdx].spouses || []).find((s) => s.fiefBalanceKey === pairKey);
          const dominance = userSpouseEntry?.dominance || "egal";
          const iAmDominant =
            dominance === "egal" ||
            (dominance === "proposant_dominant" && account.fiefDominantId === session.id) ||
            // Pour epoux_dominant / epouse_dominante on résout selon un champ genre si existant
            (dominance === "proposant_dominant" && account.fiefDominantId === session.id);
          if (!iAmDominant && dominance !== "egal") {
            notify("Seul l'époux dominant peut retirer du Fief Conjoint.", "error");
            return;
          }
        }

        if ((account.balance || 0) < amt) { notify("Le trésor commun ne contient pas assez de fonds.", "error"); return; }
        sharedAccounts[pairKey] = { ...account, balance: account.balance - amt };
        newCitizens[userIdx] = { ...newCitizens[userIdx], balance: (newCitizens[userIdx].balance || 0) + amt };
        saveState({ ...state, citizens: newCitizens, sharedAccounts });
        notify(`${formatMoney(amt)} retirés du trésor commun.`, "success");
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

      onSetParents: (citizenId, { fatherId, motherId }) => {
        const newCitizens = [...(state.citizens || [])];
        const idx = newCitizens.findIndex((c) => c.id === citizenId);
        if (idx === -1) return;
        const updates = {};
        if (fatherId !== undefined) {
          updates.fatherId = fatherId || null;
          if (fatherId) {
            const father = newCitizens.find((c) => c.id === fatherId);
            updates.fatherName = father ? father.name : null;
          } else {
            updates.fatherName = null;
          }
        }
        if (motherId !== undefined) {
          updates.motherId = motherId || null;
          if (motherId) {
            const mother = newCitizens.find((c) => c.id === motherId);
            updates.motherName = mother ? mother.name : null;
          } else {
            updates.motherName = null;
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
        if (company.ownerId !== session.id) {
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
        if (company.ownerId !== session.id) {
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
        if (company.ownerId !== session.id) {
          notify("Seul le dirigeant peut attribuer des grades.", "error");
          return;
        }
        const isWorker = (company.employees || []).includes(employeeId) || (company.slaves || []).includes(employeeId);
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
        if (company.ownerId !== session.id) return;

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
          const defaultTerms = { type: "MERCENARIAT", contractDurationDays: null, dimePercent: 0, corveeFreeDaysPerMonth: 0, buyoutAmount: 0, migrationLocked: false, customClauses: [] };
          newCompanies[compIdx] = {
            ...newCompanies[compIdx],
            employees: [...(newCompanies[compIdx].employees || []), app.citizenId],
            employeeSeniority: seniorityData,
            employmentContracts: {
              ...(newCompanies[compIdx].employmentContracts || {}),
              [app.citizenId]: { ...(contractTerms || defaultTerms), signedAt: Date.now() },
            },
          };
          notify(`${app.citizenName} a été embauché.`, "success");
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
        if (company.ownerId !== session.id) {
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
        if (company.ownerId !== session.id) {
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
        if (company.ownerId !== session.id) {
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
        if (company.ownerId !== session.id) return;
        const newCompanies = [...state.companies];
        newCompanies[compIdx] = {
          ...company,
          companyEvents: (company.companyEvents || []).filter((e) => e.id !== eventId),
        };
        saveState({ ...state, companies: newCompanies });
        notify("Événement supprimé.", "info");
      },

      // --- SOUS-TRAITANCE (contrat entre entreprises) ---
      onCreateSubcontract: (fromCompanyId, toCompanyId, amount, description) => {
        if (!session) return;
        const fromIdx = state.companies.findIndex((c) => c.id === fromCompanyId);
        const toIdx = state.companies.findIndex((c) => c.id === toCompanyId);
        if (fromIdx === -1 || toIdx === -1) return;
        const fromCompany = state.companies[fromIdx];
        if (fromCompany.ownerId !== session.id) {
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
          farmWorkers: [], // Ferme: [{id, name, salary}]
          craftRecipes: [], // Atelier: [{id, inputItem, inputQty, outputItem, outputQty}]
          commissions: [], // Atelier: [{id, clientId, clientName, recipe, status, date}]
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
        if (prop.ownerId !== session.id) { notify("Ce n'est pas votre propriété.", "error"); return; }
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
        if (properties[pIdx].ownerId !== session.id) return;
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
        const buyer = state.citizens[buyerIdx];
        if ((buyer.balance || 0) < prop.salePrice) { notify("Fonds insuffisants.", "error"); return; }
        const newCitizens = [...state.citizens];
        newCitizens[buyerIdx] = { ...buyer, balance: buyer.balance - prop.salePrice };
        if (sellerIdx !== -1) {
          newCitizens[sellerIdx] = { ...newCitizens[sellerIdx], balance: (newCitizens[sellerIdx].balance || 0) + prop.salePrice };
        }
        properties[pIdx] = { ...prop, ownerId: session.id, ownerName: buyer.name, forSale: false, salePrice: 0 };
        const ledgerEntry = {
          id: Date.now(),
          fromName: buyer.name,
          toName: sellerIdx !== -1 ? newCitizens[sellerIdx].name : prop.ownerName,
          amount: prop.salePrice,
          timestamp: Date.now(),
          reason: `Achat propriété: ${prop.name}`,
          type: "PROPERTY_PURCHASE",
        };
        saveState({
          ...state,
          citizens: newCitizens,
          properties,
          globalLedger: [ledgerEntry, ...(state.globalLedger || [])],
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
        if (companies[cIdx].ownerId !== session.id) { notify("Vous n'êtes pas le dirigeant.", "error"); return; }
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
        // Vérifier que le joueur ou son entreprise possède la propriété
        const isOwner = prop.ownerId === session.id || (prop.ownerType === "COMPANY" && (state.companies || []).find((c) => c.id === prop.ownerId && c.ownerId === session.id));
        if (!isOwner) { notify("Vous ne gérez pas cette propriété.", "error"); return; }
        properties[pIdx] = { ...prop, [featureKey]: featureValue };
        saveState({ ...state, properties });
      },

      // Château: garnison
      onAddGarrison: (propertyId, citizenId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
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
        properties[pIdx] = { ...properties[pIdx], garrison: (properties[pIdx].garrison || []).filter((g) => g.id !== citizenId) };
        saveState({ ...state, properties });
        notify("Retiré de la garnison.", "info");
      },

      // Château: cachot
      onImprison: (propertyId, citizenId, reason) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const citizen = (state.citizens || []).find((c) => c.id === citizenId);
        if (!citizen) return;
        const dungeon = [...(properties[pIdx].dungeon || [])];
        dungeon.push({ citizenId, citizenName: citizen.name, reason: reason || "Non précisé", since: Date.now() });
        properties[pIdx] = { ...properties[pIdx], dungeon };
        saveState({ ...state, properties });
        notify(`${citizen.name} emprisonné(e) dans le cachot.`, "info");
      },

      onReleasePrisoner: (propertyId, citizenId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        properties[pIdx] = { ...properties[pIdx], dungeon: (properties[pIdx].dungeon || []).filter((d) => d.citizenId !== citizenId) };
        saveState({ ...state, properties });
        notify("Prisonnier libéré.", "success");
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
        properties[pIdx] = { ...properties[pIdx], rooms };
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
        const staff = [...(properties[pIdx].staff || [])];
        if (staff.find((s) => s.id === citizenId)) { notify("Déjà employé.", "error"); return; }
        staff.push({ id: citizenId, name: citizen.name, role: role || "Employé", salary: parseFloat(salary) || 0 });
        properties[pIdx] = { ...properties[pIdx], staff };
        saveState({ ...state, properties });
        notify(`${citizen.name} embauché(e) comme ${role || "employé"}.`, "success");
      },

      onRemovePropertyStaff: (propertyId, citizenId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        properties[pIdx] = { ...properties[pIdx], staff: (properties[pIdx].staff || []).filter((s) => s.id !== citizenId) };
        saveState({ ...state, properties });
        notify("Employé retiré.", "info");
      },

      // Événements propriété
      onAddPropertyEvent: (propertyId, { title, desc, date }) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
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
        if (prop.ownerId !== session.id) { notify("Ce n'est pas votre propriété.", "error"); return; }
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
        if (properties[pIdx].ownerId !== session.id) return;
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
        saveState({
          ...state,
          citizens: newCitizens,
          properties,
          globalLedger: [ledgerEntry, ...(state.globalLedger || [])],
        });
        notify(`Vous louez "${prop.name}" pour ${formatMoney(prop.rental.dailyRate)}/jour.`, "success");
      },

      onEvictTenant: (propertyId) => {
        if (!session) return;
        const properties = [...(state.properties || [])];
        const pIdx = properties.findIndex((p) => p.id === propertyId);
        if (pIdx === -1) return;
        const prop = properties[pIdx];
        if (prop.ownerId !== session.id) { notify("Ce n'est pas votre propriété.", "error"); return; }
        if (!prop.rental || !prop.rental.tenantId) { notify("Aucun locataire.", "error"); return; }
        const tenantName = prop.rental.tenantName;
        properties[pIdx] = { ...prop, rental: { ...prop.rental, tenantId: null, tenantName: null, startDate: null } };
        saveState({ ...state, properties });
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

      onBourseCreateListing: ({ companyId, symbol, totalShares, sharesOnMarket, pricePerShare, description }) => {
        const listings = [...(state.bourseListings || [])];
        const company = (state.companies || []).find((c) => c.id === companyId);
        if (!company) { notify("Entreprise introuvable.", "error"); return; }
        const symUp = (symbol || "").toUpperCase().trim();
        if (!symUp) { notify("Le symbole boursier est requis.", "error"); return; }
        if (listings.some((l) => l.symbol === symUp)) { notify("Ce symbole est déjà utilisé.", "error"); return; }
        const shares = parseInt(totalShares) || 0;
        const onMarket = Math.min(parseInt(sharesOnMarket) || shares, shares);
        const price = parseFloat(pricePerShare) || 0;
        if (shares <= 0 || price <= 0) { notify("Actions et prix doivent être positifs.", "error"); return; }
        const ts = Date.now();
        const listing = {
          id: `BOURSE-${ts}`,
          companyId, companyName: company.name, symbol: symUp,
          totalShares: shares, sharesOnMarket: onMarket, pricePerShare: price, initialPrice: price,
          ownerId: company.ownerId,
          isActive: true,
          description: description || company.description || "",
          launchedAt: ts,
          priceHistory: [{ price, timestamp: ts }],
          dividendHistory: [],
        };
        const ledgerEntry = { id: ts, fromName: company.name, toName: "Bourse Impériale", amount: 0, timestamp: ts, reason: `Introduction en bourse : ${symUp} (${shares} actions à ${formatMoney(price)})`, type: "BOURSE_IPO" };
        saveState({ ...state, bourseListings: [listing, ...listings], globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
        notify(`${company.name} est désormais cotée en bourse sous le symbole ${symUp}.`, "success");
      },

      onBourseEditListing: (listingId, updates) => {
        const listings = [...(state.bourseListings || [])];
        const idx = listings.findIndex((l) => l.id === listingId);
        if (idx === -1) return;
        const listing = listings[idx];
        // Si le prix change, l'enregistrer dans l'historique
        const newPrice = updates.pricePerShare !== undefined ? parseFloat(updates.pricePerShare) : null;
        let priceHistory = listing.priceHistory || [];
        if (newPrice && newPrice !== listing.pricePerShare) {
          priceHistory = [{ price: newPrice, timestamp: Date.now() }, ...priceHistory].slice(0, 30);
        }
        listings[idx] = { ...listing, ...updates, priceHistory };
        saveState({ ...state, bourseListings: listings });
        notify("Cotation mise à jour.", "success");
      },

      onBourseDeleteListing: (listingId) => {
        // Rembourser les actionnaires au prix actuel
        const listing = (state.bourseListings || []).find((l) => l.id === listingId);
        if (!listing) return;
        const newCitizens = [...(state.citizens || [])].map((c) => {
          const held = (c.stockholdings || {})[listingId] || 0;
          if (held <= 0) return c;
          const refund = held * listing.pricePerShare;
          const newHoldings = { ...(c.stockholdings || {}) };
          delete newHoldings[listingId];
          return { ...c, balance: (c.balance || 0) + refund, stockholdings: newHoldings };
        });
        saveState({ ...state, bourseListings: (state.bourseListings || []).filter((l) => l.id !== listingId), citizens: newCitizens });
        notify(`Cotation ${listing.symbol} supprimée. Les actionnaires ont été remboursés.`, "info");
      },

      onBourseBuyShares: (listingId, quantity) => {
        if (!session) return;
        const qty = parseInt(quantity);
        if (!qty || qty <= 0) { notify("Quantité invalide.", "error"); return; }
        const listings = [...(state.bourseListings || [])];
        const idx = listings.findIndex((l) => l.id === listingId);
        if (idx === -1) { notify("Cotation introuvable.", "error"); return; }
        const listing = listings[idx];
        if (!listing.isActive) { notify("Cette valeur n'est plus active.", "error"); return; }
        if (listing.sharesOnMarket < qty) { notify(`Seulement ${listing.sharesOnMarket} action(s) disponible(s).`, "error"); return; }
        const total = qty * listing.pricePerShare;
        const newCitizens = [...(state.citizens || [])];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        if ((newCitizens[userIdx].balance || 0) < total) { notify("Fonds insuffisants.", "error"); return; }
        // Créditer la trésorerie de l'entreprise
        const newCompanies = [...(state.companies || [])];
        const compIdx = newCompanies.findIndex((c) => c.id === listing.companyId);
        if (compIdx !== -1) {
          newCompanies[compIdx] = { ...newCompanies[compIdx], balance: (newCompanies[compIdx].balance || 0) + total };
        }
        const currentHoldings = newCitizens[userIdx].stockholdings || {};
        newCitizens[userIdx] = {
          ...newCitizens[userIdx],
          balance: (newCitizens[userIdx].balance || 0) - total,
          stockholdings: { ...currentHoldings, [listingId]: (currentHoldings[listingId] || 0) + qty },
        };
        listings[idx] = { ...listing, sharesOnMarket: listing.sharesOnMarket - qty };
        const ts = Date.now();
        const ledgerEntry = { id: ts, fromName: newCitizens[userIdx].name, toName: `${listing.companyName} (Bourse: ${listing.symbol})`, amount: total, timestamp: ts, reason: `Achat ${qty} action(s) ${listing.symbol} à ${formatMoney(listing.pricePerShare)}`, type: "BOURSE_BUY" };
        saveState({ ...state, citizens: newCitizens, companies: newCompanies, bourseListings: listings, globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
        notify(`${qty} action(s) ${listing.symbol} achetée(s) pour ${formatMoney(total)}.`, "success");
      },

      onBourseSellShares: (listingId, quantity) => {
        if (!session) return;
        const qty = parseInt(quantity);
        if (!qty || qty <= 0) { notify("Quantité invalide.", "error"); return; }
        const listings = [...(state.bourseListings || [])];
        const idx = listings.findIndex((l) => l.id === listingId);
        if (idx === -1) { notify("Cotation introuvable.", "error"); return; }
        const listing = listings[idx];
        const newCitizens = [...(state.citizens || [])];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        const held = (newCitizens[userIdx].stockholdings || {})[listingId] || 0;
        if (held < qty) { notify(`Vous ne possédez que ${held} action(s) de cette valeur.`, "error"); return; }
        // Vérifier les actions bloquées par période ESPP
        const now = Date.now();
        const activeLocks = (newCitizens[userIdx].esppLocks || []).filter((l) => l.listingId === listingId && l.unlocksAt > now);
        const lockedQty = activeLocks.reduce((sum, l) => sum + l.qty, 0);
        if (held - lockedQty < qty) {
          const mostRecentUnlock = Math.max(...activeLocks.map((l) => l.unlocksAt));
          notify(`${lockedQty} action(s) bloquée(s) par période ESPP jusqu'au ${new Date(mostRecentUnlock).toLocaleDateString("fr-FR")}. Vous ne pouvez vendre que ${Math.max(0, held - lockedQty)} action(s).`, "error");
          return;
        }
        const total = qty * listing.pricePerShare;
        // Débiter la trésorerie de l'entreprise (rachat)
        const newCompanies = [...(state.companies || [])];
        const compIdx = newCompanies.findIndex((c) => c.id === listing.companyId);
        if (compIdx !== -1) {
          if ((newCompanies[compIdx].balance || 0) < total) { notify("La trésorerie de l'entreprise est insuffisante pour racheter ces actions.", "error"); return; }
          newCompanies[compIdx] = { ...newCompanies[compIdx], balance: (newCompanies[compIdx].balance || 0) - total };
        }
        const newHoldings = { ...(newCitizens[userIdx].stockholdings || {}) };
        const remaining = held - qty;
        if (remaining === 0) delete newHoldings[listingId]; else newHoldings[listingId] = remaining;
        // Nettoyer les verrous ESPP expirés au moment de la vente
        const cleanedLocks = (newCitizens[userIdx].esppLocks || []).filter((l) => l.unlocksAt > now);
        newCitizens[userIdx] = { ...newCitizens[userIdx], balance: (newCitizens[userIdx].balance || 0) + total, stockholdings: newHoldings, esppLocks: cleanedLocks };
        listings[idx] = { ...listing, sharesOnMarket: listing.sharesOnMarket + qty };
        const ts = Date.now();
        const ledgerEntry = { id: ts, fromName: `${listing.companyName} (Bourse: ${listing.symbol})`, toName: newCitizens[userIdx].name, amount: total, timestamp: ts, reason: `Rachat ${qty} action(s) ${listing.symbol} à ${formatMoney(listing.pricePerShare)}`, type: "BOURSE_SELL" };
        saveState({ ...state, citizens: newCitizens, companies: newCompanies, bourseListings: listings, globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
        notify(`${qty} action(s) ${listing.symbol} vendues pour ${formatMoney(total)}.`, "success");
      },

      onBoursePayDividends: (listingId, dividendPerShare) => {
        const dpS = parseFloat(dividendPerShare);
        if (!dpS || dpS <= 0) { notify("Dividende invalide.", "error"); return; }
        const listings = [...(state.bourseListings || [])];
        const idx = listings.findIndex((l) => l.id === listingId);
        if (idx === -1) return;
        const listing = listings[idx];
        const newCitizens = [...(state.citizens || [])];
        let totalPaid = 0;
        const ledgerEntries = [];
        const ts = Date.now();
        newCitizens.forEach((c, i) => {
          const held = (c.stockholdings || {})[listingId] || 0;
          if (held <= 0) return;
          const payout = held * dpS;
          totalPaid += payout;
          newCitizens[i] = { ...c, balance: (c.balance || 0) + payout };
          ledgerEntries.push({ id: ts + i, fromName: `${listing.companyName} (dividende ${listing.symbol})`, toName: c.name, amount: payout, timestamp: ts, reason: `Dividende ${listing.symbol} (${formatMoney(dpS)}/action × ${held})`, type: "BOURSE_DIVIDEND" });
        });
        // Prélever les dividendes de la trésorerie de l'entreprise
        const newCompanies = [...(state.companies || [])];
        const compIdx = newCompanies.findIndex((c) => c.id === listing.companyId);
        if (compIdx !== -1) {
          if ((newCompanies[compIdx].balance || 0) < totalPaid) { notify(`Trésorerie insuffisante pour verser ${formatMoney(totalPaid)} de dividendes.`, "error"); return; }
          newCompanies[compIdx] = { ...newCompanies[compIdx], balance: (newCompanies[compIdx].balance || 0) - totalPaid };
        }
        const divHistory = [{ amount: dpS, timestamp: ts, totalPaid }, ...(listing.dividendHistory || [])].slice(0, 20);
        listings[idx] = { ...listing, dividendHistory: divHistory };
        saveState({ ...state, citizens: newCitizens, companies: newCompanies, bourseListings: listings, globalLedger: [...ledgerEntries, ...(state.globalLedger || [])].slice(0, 1000) });
        notify(`Dividendes versés : ${formatMoney(dpS)}/action. Total distribué : ${formatMoney(totalPaid)}.`, "success");
      },

      // ── Plan d'Actionnariat Salarié (ESPP) ──
      onUpdateCompanyESPP: (companyId, esppSettings) => {
        const companies = [...(state.companies || [])];
        const idx = companies.findIndex((c) => c.id === companyId);
        if (idx === -1) return;
        if (companies[idx].ownerId !== session.id) { notify("Action non autorisée.", "error"); return; }
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
        const discount = Math.min(Math.max(parseFloat(espp.discountPercent) || 0, 0), 90) / 100;
        const listings = [...(state.bourseListings || [])];
        const lIdx = listings.findIndex((l) => l.id === listingId);
        if (lIdx === -1) { notify("Cotation introuvable.", "error"); return; }
        const listing = listings[lIdx];
        if (!listing.isActive) { notify("Cette valeur n'est plus active.", "error"); return; }
        if (listing.sharesOnMarket < quantity) { notify(`Seulement ${listing.sharesOnMarket} action(s) disponible(s).`, "error"); return; }
        const discountedPrice = Math.round(listing.pricePerShare * (1 - discount) * 10) / 10;
        const totalCost = Math.round(quantity * discountedPrice * 10) / 10;
        const workerBal = (company.workerBalances || {})[session.id] || 0;
        if (workerBal < totalCost) { notify(`Compte entreprise insuffisant. Disponible : ${formatMoney(workerBal)}, requis : ${formatMoney(totalCost)}.`, "error"); return; }
        const newCitizens = [...(state.citizens || [])];
        const userIdx = newCitizens.findIndex((c) => c.id === session.id);
        if (userIdx === -1) return;
        // Débit du compte entreprise de l'employé
        const wb = { ...(company.workerBalances || {}) };
        wb[session.id] = workerBal - totalCost;
        companies[compIdx] = { ...company, workerBalances: wb };
        // Crédit de la trésorerie de l'entreprise (au prix réduit)
        companies[compIdx] = { ...companies[compIdx], balance: (companies[compIdx].balance || 0) + totalCost };
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
        listings[lIdx] = { ...listing, sharesOnMarket: listing.sharesOnMarket - quantity };
        const ledgerEntry = { id: ts, fromName: `Compte salarié — ${company.name}`, toName: `${listing.companyName} (ESPP: ${listing.symbol})`, amount: totalCost, timestamp: ts, reason: `ESPP : ${quantity} action(s) ${listing.symbol} à ${formatMoney(discountedPrice)} (−${espp.discountPercent}%${lockupDays > 0 ? `, bloqué ${lockupDays}j` : ""})`, type: "ESPP_BUY" };
        saveState({ ...state, companies, citizens: newCitizens, bourseListings: listings, globalLedger: [ledgerEntry, ...(state.globalLedger || [])].slice(0, 1000) });
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
      // ────────────────────────────────────────────────────────────

    }, notify);
  }, [session, state, saveState, notify]);
};
