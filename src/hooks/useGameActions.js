import { useMemo } from "react";
import { ROLES } from "../lib/constants";

export const useGameActions = (session, state, saveState, notify) => {
  return useMemo(() => {
    return {
      onPassDay: () => {
        let ns = JSON.parse(JSON.stringify(state));
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

        saveState(ns);
        notify(
          `Nouveau jour : ${ns.gameDate.day}/${ns.gameDate.month}/${ns.gameDate.year} (${season})`,
          "info"
        );
      },
      onAddTreasury: (amount) => {
        const val = parseInt(amount);
        if (val && !isNaN(val) && val > 0) {
          const newEntry = {
            id: Date.now(),
            fromName: "Hôtel des Monnaies",
            toName: "Trésor Impérial",
            amount: val,
            timestamp: Date.now(),
            reason: "Frappe de monnaie (Création)",
          };
          saveState({
            ...state,
            treasury: (state.treasury || 0) + val,
            globalLedger: [newEntry, ...(state.globalLedger || [])],
          });
          notify(`${val.toLocaleString()} Écus ont été frappés.`, "success");
        } else {
          notify("Montant invalide.", "error");
        }
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
          balance: parseInt(startingBalance) || 0,
          employees: [],
          slaves: [],
          inventory: [],
          createdAt: Date.now(),
        };
        saveState({
          ...state,
          companies: [newCompany, ...(state.companies || [])],
        });
        notify(`Entreprise "${name}" créée.`, "success");
      },

      // --- GESTION TRÉSORERIE ---
      onCompanyTreasury: (companyId, amount, type) => {
        if (!session) return;
        const compIdx = state.companies.findIndex((c) => c.id === companyId);
        const userIdx = state.citizens.findIndex((c) => c.id === session.id);

        if (compIdx === -1 || userIdx === -1) return;

        const company = state.companies[compIdx];
        const user = state.citizens[userIdx];
        const val = parseInt(amount);

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

        saveState({ ...state, companies: newCompanies, citizens: newCitizens });
      },

      // --- NOUVEAU : PAYER SALAIRES ---
      onPaySalaries: (companyId, amountPerEmployee) => {
        const compIdx = state.companies.findIndex((c) => c.id === companyId);
        if (compIdx === -1) return;

        const company = state.companies[compIdx];
        const employees = company.employees || [];
        if (employees.length === 0) {
          notify("Aucun salarié à payer.", "info");
          return;
        }

        const val = parseInt(amountPerEmployee);
        if (!val || val <= 0) {
          notify("Montant invalide.", "error");
          return;
        }

        const totalCost = val * employees.length;
        if (company.balance < totalCost) {
          notify(`Fonds insuffisants. Il faut ${totalCost} écus.`, "error");
          return;
        }

        const newCompanies = [...state.companies];
        const newCitizens = [...state.citizens];

        // Débit Entreprise
        newCompanies[compIdx] = {
          ...company,
          balance: company.balance - totalCost,
        };

        // Crédit Employés
        employees.forEach((empId) => {
          const empIdx = newCitizens.findIndex((c) => c.id === empId);
          if (empIdx !== -1) {
            newCitizens[empIdx] = {
              ...newCitizens[empIdx],
              balance: (newCitizens[empIdx].balance || 0) + val,
            };
          }
        });

        saveState({ ...state, companies: newCompanies, citizens: newCitizens });
        notify(`Salaires versés (${val} écus/personne).`, "success");
      },

      // --- NOUVEAU : OFFRES D'EMPLOI ---
      onSendJobOffer: (companyId, targetId) => {
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

        newCitizens[targetIdx] = {
          ...target,
          jobOffers: [
            ...existingOffers,
            {
              id: Date.now(),
              companyId: company.id,
              companyName: company.name,
              date: Date.now(),
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
            newCompanies[compIdx] = {
              ...company,
              employees: [...(company.employees || []), user.id],
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
          newCompanies[compIdx] = {
            ...company,
            employees: (company.employees || []).filter(
              (id) => id !== targetId
            ),
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

      // --- LE RESTE EST INCHANGÉ (POUR COMPATIBILITÉ) ---
      onTransfer: (srcRaw, tgtRaw, amount) => {
        if (!session) return;
        if (!amount || amount <= 0 || !srcRaw || !tgtRaw) {
          notify("Erreur virement.", "error");
          return;
        }
        // ... (votre code transfert habituel) ...
        let s = JSON.parse(JSON.stringify(state));
        const process = (raw, isCredit) => {
          const v = isCredit ? parseInt(amount) : -parseInt(amount);
          if (raw === "GLOBAL") {
            s.treasury += v;
            return "Trésor";
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
          return "Autre";
        };
        process(srcRaw, false);
        process(tgtRaw, true);
        saveState(s);
        notify("Transfert validé.", "success");
      },
      onSendPost: (targetId, subject, content, ccList, seal) => {
        if (!session) return;
        const safeCitizens = state.citizens || [];
        const newMessage = {
          id: Date.now(),
          from: session.name,
          fromId: session.id,
          date: `J${state.dayCycle}`,
          subject,
          content,
          seal,
          censored: false,
        };
        const newCitizens = safeCitizens.map((c) =>
          c.id === targetId
            ? { ...c, messages: [newMessage, ...(c.messages || [])] }
            : c
        );
        saveState({ ...state, citizens: newCitizens });
        notify("Message envoyé.", "success");
      },
      onRequestTravel: (toCountryId, toRegion) => {
        const newReq = {
          id: `req_${Date.now()}`,
          citizenId: session.id,
          citizenName: session.name,
          fromCountry: session.countryId,
          toCountry: toCountryId,
          toRegion: toRegion,
          status: "PENDING",
          timestamp: Date.now(),
        };
        saveState({
          ...state,
          travelRequests: [...(state.travelRequests || []), newReq],
        });
        notify("Demande soumise.", "success");
      },
      onUpdateCitizen: (formData) => {
        if (!session) return;
        let freshCitizens = [...(state.citizens || [])];
        const index = freshCitizens.findIndex((x) => x.id === formData.id);
        if (index !== -1)
          freshCitizens[index] = { ...freshCitizens[index], ...formData };
        saveState({ ...state, citizens: freshCitizens });
        notify("Mis à jour.", "success");
      },
      onBuyItem: () => notify("Achat OK", "success"),
      onGiveItem: () => {},
      onBuySlave: (slaveId, price) => {
        // Logique simplifiée pour slave
        if (!session) return;
        const buyerIdx = state.citizens.findIndex((c) => c.id === session.id);
        const slaveIdx = state.citizens.findIndex((c) => c.id === slaveId);
        if (buyerIdx === -1 || slaveIdx === -1) return;
        const newCitizens = [...state.citizens];
        if (newCitizens[buyerIdx].balance < price) {
          notify("Fonds insuffisants", "error");
          return;
        }
        newCitizens[buyerIdx].balance -= price;
        newCitizens[slaveIdx] = {
          ...newCitizens[slaveIdx],
          ownerId: session.id,
          isForSale: false,
        };
        saveState({ ...state, citizens: newCitizens });
        notify("Esclave acheté.", "success");
      },
      onSelfManumit: () => {},
      onUpdateHouseRegistry: (reg) =>
        saveState({ ...state, maisonRegistry: reg }),
      onBookMaison: (entryId, price) => {
        const clientIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (clientIdx === -1) return;
        const newCitizens = [...state.citizens];
        newCitizens[clientIdx].balance -= price;
        saveState({
          ...state,
          citizens: newCitizens,
          treasury: (state.treasury || 0) + price,
        });
        notify("Réservé.", "success");
      },
      onProposeDebt: () => {},
      onSignDebt: () => {},
      onPayDebt: () => {},
      onCancelDebt: () => {},
    };
  }, [session, state, saveState, notify]);
};
