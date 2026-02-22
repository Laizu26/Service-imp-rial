import { useMemo } from "react";

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

        // --- Progression de niveau (mensuelle) ---
        if (ns.gameDate.day === 1) {
          (ns.companies || []).forEach((company, compIdx) => {
            if (company.frozen) return;
            const totalWorkers =
              (company.employees || []).length +
              (company.slaves || []).length;
            const requiredWorkers = (company.level || 1) * 2;
            const requiredFunds = (company.level || 1) * 500;
            if (
              totalWorkers >= requiredWorkers &&
              (company.balance || 0) >= requiredFunds
            ) {
              ns.companies[compIdx] = {
                ...ns.companies[compIdx],
                level: (ns.companies[compIdx].level || 1) + 1,
              };
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

          // Distribution aux bénéficiaires (citoyen, pays, entreprise, trésor impérial)
          (job.recipients || []).forEach((recipient) => {
            const share = Math.floor(totalAmount * (recipient.percent || 0) / 100);
            if (share <= 0) return;
            const type = recipient.type || "CITIZEN";
            if (type === "CITIZEN") {
              const idx = (ns.citizens || []).findIndex((c) => c.id === recipient.id);
              if (idx !== -1) ns.citizens[idx] = { ...ns.citizens[idx], balance: (ns.citizens[idx].balance || 0) + share };
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

        // --- Salaires passifs Maison d'Asia ---
        (ns.maisonStaff || []).forEach((worker) => {
          if (!worker.passiveSalary || worker.passiveSalary <= 0) return;
          const freq = worker.passiveSalaryFreq || "daily";
          const shouldPay =
            freq === "daily" ||
            (freq === "weekly" && ns.dayCycle % 7 === 0) ||
            (freq === "monthly" && ns.gameDate.day === 1);
          if (!shouldPay) return;

          const amount = worker.passiveSalary;
          const workerIdx = (ns.citizens || []).findIndex((c) => c.id === worker.id);
          if (workerIdx === -1) return;

          // Source : entreprise liée de la Maison ou Trésor Impérial
          const maisonCompId = ns.maisonCompanyId;
          const maisonCompIdx = maisonCompId ? (ns.companies || []).findIndex((c) => c.id === maisonCompId) : -1;
          let paid = false;
          if (maisonCompIdx !== -1 && (ns.companies[maisonCompIdx].balance || 0) >= amount) {
            ns.companies[maisonCompIdx] = { ...ns.companies[maisonCompIdx], balance: ns.companies[maisonCompIdx].balance - amount };
            paid = true;
          } else if ((ns.treasury || 0) >= amount) {
            ns.treasury -= amount;
            paid = true;
          }
          if (paid) {
            ns.citizens[workerIdx] = { ...ns.citizens[workerIdx], balance: (ns.citizens[workerIdx].balance || 0) + amount };
            ns.globalLedger = [{
              id: Date.now() + Math.random(),
              fromName: maisonCompIdx !== -1 ? ns.companies[maisonCompIdx].name : "Trésor Impérial",
              toName: worker.name,
              amount,
              timestamp: Date.now(),
              reason: `Salaire passif — Maison d'Asia`,
              type: "MAISON_SALARY",
            }, ...(ns.globalLedger || [])];
          }
        });

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
            type: "MINT",
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
          balance: parseInt(startingBalance) || 0,
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
          sanitized.balance = parseInt(sanitized.balance) || 0;
        if (sanitized.taxRate !== undefined)
          sanitized.taxRate = Math.max(
            0,
            Math.min(100, parseInt(sanitized.taxRate) || 0)
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

        // salaryData peut être un nombre (uniforme) ou un objet { workerId: montant }
        const isMap =
          typeof salaryData === "object" && !Array.isArray(salaryData);
        let totalCost = 0;
        const payments = {};

        allWorkers.forEach((wId) => {
          const val = isMap
            ? parseInt(salaryData[wId]) || 0
            : parseInt(salaryData) || 0;
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
        const newCitizens = [...state.citizens];

        newCompanies[compIdx] = {
          ...company,
          balance: company.balance - totalCost,
        };

        Object.entries(payments).forEach(([empId, val]) => {
          const empIdx = newCitizens.findIndex((c) => c.id === empId);
          if (empIdx !== -1) {
            newCitizens[empIdx] = {
              ...newCitizens[empIdx],
              balance: (newCitizens[empIdx].balance || 0) + val,
            };
          }
        });

        // Entrée ledger pour chaque paiement de salaire
        const salaryLedger = Object.entries(payments).map(([empId, val]) => {
          const emp = newCitizens.find((c) => c.id === empId);
          return {
            id: Date.now() + Math.random(),
            fromName: company.name,
            toName: emp?.name || empId,
            amount: val,
            timestamp: Date.now(),
            reason: "Salaire",
            type: "SALARY",
          };
        });

        saveState({
          ...state,
          companies: newCompanies,
          citizens: newCitizens,
          globalLedger: [...salaryLedger, ...(state.globalLedger || [])],
        });
        notify(
          `Salaires versés : ${totalCost.toLocaleString()} écus au total.`,
          "success"
        );
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
        const newCompanies = [...state.companies];
        newCompanies[compIdx] = {
          ...company,
          employees: (company.employees || []).filter(
            (id) => id !== session.id
          ),
        };
        saveState({ ...state, companies: newCompanies });
        notify(`Vous avez quitté ${company.name}.`, "info");
      },

      // --- LE RESTE EST INCHANGÉ (POUR COMPATIBILITÉ) ---
      onTransfer: (srcRaw, tgtRaw, amount) => {
        if (!session) return;
        if (!amount || amount <= 0 || !srcRaw || !tgtRaw) {
          notify("Erreur virement.", "error");
          return;
        }
        let s = JSON.parse(JSON.stringify(state));
        const process = (raw, isCredit) => {
          const v = isCredit ? parseInt(amount) : -parseInt(amount);
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
          amount: parseInt(amount),
          timestamp: Date.now(),
          type: "TRANSFER",
        };
        s.globalLedger = [...(s.globalLedger || []), ledgerEntry];

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
        // Utiliser locationCountryId (position physique) comme pays d'origine,
        // pas countryId (allégeance politique)
        const currentCitizen = (state.citizens || []).find(
          (c) => c.id === session.id
        );
        const fromCountry =
          currentCitizen?.locationCountryId ||
          currentCitizen?.countryId ||
          session.countryId;
        const newReq = {
          id: `req_${Date.now()}`,
          citizenId: session.id,
          citizenName: session.name,
          fromCountry: fromCountry,
          toCountry: toCountryId,
          toRegion: toRegion,
          status: "PENDING",
          validations: { exit: false, entry: false },
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

        if (index !== -1) {
          // Cas 1 : Le citoyen existe, on le met à jour
          freshCitizens[index] = { ...freshCitizens[index], ...formData };
        } else {
          // Cas 2 : Le citoyen n'existe pas (nouveau), on l'ajoute
          freshCitizens.push(formData);
        }

        saveState({ ...state, citizens: freshCitizens });
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

        // Entrée ledger
        const ledgerEntry = {
          id: Date.now(),
          fromName: newCitizens[userIdx].name,
          toName: "Trésor Impérial",
          amount: cost,
          timestamp: Date.now(),
          reason: `Achat: ${qty}x ${item.name}`,
          type: "ITEM_PURCHASE",
        };

        saveState({
          ...state,
          citizens: newCitizens,
          inventoryCatalog: newCatalog,
          treasury: (state.treasury || 0) + cost,
          globalLedger: [ledgerEntry, ...(state.globalLedger || [])],
        });
        notify(
          `${qty}x ${item.name} acheté(s) pour ${cost} Écus.`,
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
          `${amount} Écus confisqués à ${newCitizens[slaveIdx].name}.`,
          "info"
        );
      },

      // --- COMPTE CACHÉ (esclave dissimule son argent) ---
      onHideMoney: (amount) => {
        if (!session) return;
        const amt = parseInt(amount);
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

        saveState({ ...state, citizens: newCitizens });

        if (detected) {
          notify(
            `${amt} Écus dissimulés... mais votre maître a été alerté ! (${detectionChance}% de risque)`,
            "error"
          );
        } else {
          notify(
            `${amt} Écus dissimulés avec succès. (${detectionChance}% de risque)`,
            "success"
          );
        }
      },

      onWithdrawHiddenMoney: (amount) => {
        if (!session) return;
        const amt = parseInt(amount);
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

        saveState({ ...state, citizens: newCitizens });
        notify(
          `${amt} Écus retirés du compte caché. Attention, ils sont maintenant visibles !`,
          "info"
        );
      },

      // --- TRANSFERT DEPUIS LE COMPTE CACHÉ ---
      onHiddenTransfer: (targetId, amount) => {
        if (!session) return;
        const amt = parseInt(amount);
        if (!amt || amt <= 0 || !targetId) return;

        const newCitizens = [...state.citizens];
        const senderIdx = newCitizens.findIndex((c) => c.id === session.id);
        const targetIdx = newCitizens.findIndex((c) => c.id === targetId);
        if (senderIdx === -1 || targetIdx === -1) return;

        const sender = newCitizens[senderIdx];
        if ((sender.hiddenBalance || 0) < amt) {
          notify("Fonds cachés insuffisants.", "error");
          return;
        }

        newCitizens[senderIdx] = {
          ...sender,
          hiddenBalance: (sender.hiddenBalance || 0) - amt,
        };
        newCitizens[targetIdx] = {
          ...newCitizens[targetIdx],
          balance: (newCitizens[targetIdx].balance || 0) + amt,
        };

        saveState({ ...state, citizens: newCitizens });
        notify(
          `${amt} Écus transférés discrètement à ${newCitizens[targetIdx].name}.`,
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
        const amt = parseInt(amount);
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

        saveState({ ...state, citizens: newCitizens });
        notify(
          `${toRestore} Écus restitués depuis le compte caché de ${slave.name}.`,
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
        const amt = parseInt(amount);
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
        notify(`${amt.toLocaleString()} Écus versés dans le trésor commun.`, "success");
      },

      // Retrait du trésor commun / fief (avec vérification de domination pour le fief)
      onSharedAccountWithdraw: (pairKey, amount) => {
        if (!session) return;
        const amt = parseInt(amount);
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

        if ((account.balance || 0) < amt) { notify("Le trésor commun ne contient pas assez d'Écus.", "error"); return; }
        sharedAccounts[pairKey] = { ...account, balance: account.balance - amt };
        newCitizens[userIdx] = { ...newCitizens[userIdx], balance: (newCitizens[userIdx].balance || 0) + amt };
        saveState({ ...state, citizens: newCitizens, sharedAccounts });
        notify(`${amt.toLocaleString()} Écus retirés du trésor commun.`, "success");
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
            `Fonds insuffisants. Il faut ${price} Écus pour racheter votre liberté.`,
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
        const position = queue.filter((q) => q.staffId === staffId).length + 1;
        saveState({
          ...state,
          maisonQueue: [...queue, { citizenId: session.id, staffId, joinedAt: Date.now(), position }],
        });
        notify("Vous avez rejoint la file d'attente.", "success");
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
      onBookMaison: (staffId) => {
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
            reviewed: false,
          };

          // Retirer du registre
          let newRegistry = registry.filter((r) => r.citizenId !== session.id);
          let newQueue = [...queue];
          let newCitizens = [...state.citizens];
          let newCompanies = [...(state.companies || [])];
          let newLedger = [...(state.globalLedger || [])];
          let newTreasury = state.treasury || 0;

          // --- Paiement à la tâche au pensionnaire ---
          if (worker && (worker.taskPayment || 0) > 0) {
            const pricePaid = myBooking.pricePaid || worker.price || 0;
            const taskPay = worker.taskPaymentType === "percent"
              ? Math.floor(pricePaid * (worker.taskPayment / 100))
              : worker.taskPayment;
            if (taskPay > 0) {
              const workerCitizenIdx = newCitizens.findIndex((c) => c.id === worker.id);
              if (workerCitizenIdx !== -1) {
                // Payer depuis la Maison (entreprise liée) ou le trésor
                const maisonCompId = state.maisonCompanyId;
                const maisonCompIdx = maisonCompId ? newCompanies.findIndex((c) => c.id === maisonCompId) : -1;
                let paid = false;
                if (maisonCompIdx !== -1 && (newCompanies[maisonCompIdx].balance || 0) >= taskPay) {
                  newCompanies[maisonCompIdx] = { ...newCompanies[maisonCompIdx], balance: newCompanies[maisonCompIdx].balance - taskPay };
                  paid = true;
                } else if (newTreasury >= taskPay) {
                  newTreasury -= taskPay;
                  paid = true;
                }
                if (paid) {
                  newCitizens[workerCitizenIdx] = { ...newCitizens[workerCitizenIdx], balance: (newCitizens[workerCitizenIdx].balance || 0) + taskPay };
                  newLedger = [{
                    id: Date.now() + 0.5,
                    fromName: maisonCompIdx !== -1 ? newCompanies[maisonCompIdx].name : "Trésor Impérial",
                    toName: worker.name,
                    amount: taskPay,
                    timestamp: Date.now(),
                    reason: `Paiement à la tâche — Maison d'Asia`,
                    type: "MAISON_TASK",
                  }, ...newLedger];
                }
              }
            }
          }

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
                newCitizens[nextIdx] = {
                  ...newCitizens[nextIdx],
                  balance: newCitizens[nextIdx].balance - price,
                };

                // Revenue split
                const maisonCompId = state.maisonCompanyId;
                const maisonCompIdx = maisonCompId
                  ? newCompanies.findIndex((c) => c.id === maisonCompId)
                  : -1;
                const maisonCut = Math.floor(price * 0.8);
                const treasuryCut = price - maisonCut;
                if (maisonCompIdx !== -1) {
                  newCompanies[maisonCompIdx] = {
                    ...newCompanies[maisonCompIdx],
                    balance: (newCompanies[maisonCompIdx].balance || 0) + maisonCut,
                  };
                  newTreasury += treasuryCut;
                } else {
                  newTreasury += price;
                }

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
                    toName: maisonCompIdx !== -1 ? newCompanies[maisonCompIdx].name + " / Trésor" : "Trésor Impérial",
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
            treasury: newTreasury,
            globalLedger: newLedger,
          });
          notify("Vous avez quitté la Maison.", "info");
          return;
        }

        // === RÉSERVER ===
        const worker = (state.maisonStaff || []).find((s) => s.id === staffId);
        if (!worker) { notify("Personnel introuvable.", "error"); return; }
        if (registry.some((r) => r.staffId === staffId)) {
          notify("Cette personne est déjà occupée.", "error"); return;
        }
        if (registry.some((r) => r.citizenId === session.id)) {
          notify("Vous êtes déjà en compagnie.", "error"); return;
        }

        const clientIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (clientIdx === -1) return;
        const price = worker.price || 0;
        if (state.citizens[clientIdx].balance < price) {
          notify("Fonds insuffisants.", "error"); return;
        }

        // Retirer de toute queue
        const cleanedQueue = queue.filter((q) => q.citizenId !== session.id);

        const newCitizens = [...state.citizens];
        newCitizens[clientIdx] = {
          ...newCitizens[clientIdx],
          balance: newCitizens[clientIdx].balance - price,
        };

        const newEntry = {
          citizenId: session.id,
          staffId,
          startTime: Date.now(),
          duration: worker.sessionDuration || defaultDur,
          pricePaid: price,
        };

        // Revenue split 80/20
        const maisonCompId = state.maisonCompanyId;
        const maisonCompIdx = maisonCompId
          ? (state.companies || []).findIndex((c) => c.id === maisonCompId)
          : -1;
        const maisonCut = Math.floor(price * 0.8);
        const treasuryCut = price - maisonCut;
        const updatedCompanies = [...(state.companies || [])];
        if (maisonCompIdx !== -1) {
          updatedCompanies[maisonCompIdx] = {
            ...updatedCompanies[maisonCompIdx],
            balance: (updatedCompanies[maisonCompIdx].balance || 0) + maisonCut,
          };
        }

        const maisonLedger = {
          id: Date.now(),
          fromName: session.name,
          toName: maisonCompIdx !== -1 ? updatedCompanies[maisonCompIdx].name + " / Trésor" : "Trésor Impérial",
          amount: price,
          timestamp: Date.now(),
          reason: `Réservation Maison d'Asia — ${worker.name || "Personnel"}`,
          type: "MAISON",
        };

        saveState({
          ...state,
          citizens: newCitizens,
          maisonRegistry: [...registry, newEntry],
          maisonQueue: cleanedQueue,
          treasury: (state.treasury || 0) + (maisonCompIdx !== -1 ? treasuryCut : price),
          companies: maisonCompIdx !== -1 ? updatedCompanies : state.companies,
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
        let newLedger = [...(state.globalLedger || [])];
        let newTreasury = state.treasury || 0;

        // --- Paiement à la tâche au pensionnaire (eviction) ---
        if (worker && (worker.taskPayment || 0) > 0) {
          const pricePaid = booking.pricePaid || worker.price || 0;
          const taskPay = worker.taskPaymentType === "percent"
            ? Math.floor(pricePaid * (worker.taskPayment / 100))
            : worker.taskPayment;
          if (taskPay > 0) {
            const workerIdx = newCitizens.findIndex((c) => c.id === worker.id);
            if (workerIdx !== -1) {
              const maisonCompId = state.maisonCompanyId;
              const maisonCompIdx = maisonCompId ? newCompanies.findIndex((c) => c.id === maisonCompId) : -1;
              let paid = false;
              if (maisonCompIdx !== -1 && (newCompanies[maisonCompIdx].balance || 0) >= taskPay) {
                newCompanies[maisonCompIdx] = { ...newCompanies[maisonCompIdx], balance: newCompanies[maisonCompIdx].balance - taskPay };
                paid = true;
              } else if (newTreasury >= taskPay) {
                newTreasury -= taskPay;
                paid = true;
              }
              if (paid) {
                newCitizens[workerIdx] = { ...newCitizens[workerIdx], balance: (newCitizens[workerIdx].balance || 0) + taskPay };
                newLedger = [{
                  id: Date.now() + 0.5,
                  fromName: maisonCompIdx !== -1 ? newCompanies[maisonCompIdx].name : "Trésor Impérial",
                  toName: worker.name,
                  amount: taskPay,
                  timestamp: Date.now(),
                  reason: `Paiement à la tâche — Maison d'Asia`,
                  type: "MAISON_TASK",
                }, ...newLedger];
              }
            }
          }
        }

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
              const maisonCompId = state.maisonCompanyId;
              const maisonCompIdx = maisonCompId
                ? newCompanies.findIndex((c) => c.id === maisonCompId)
                : -1;
              const maisonCut = Math.floor(price * 0.8);
              const treasuryCut = price - maisonCut;
              if (maisonCompIdx !== -1) {
                newCompanies[maisonCompIdx] = {
                  ...newCompanies[maisonCompIdx],
                  balance: (newCompanies[maisonCompIdx].balance || 0) + maisonCut,
                };
                newTreasury += treasuryCut;
              } else {
                newTreasury += price;
              }
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
                  toName: maisonCompIdx !== -1 ? newCompanies[maisonCompIdx].name + " / Trésor" : "Trésor Impérial",
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
          treasury: newTreasury,
          globalLedger: newLedger,
        });
        notify("Client retiré (historique créé).", "info");
      },
      onProposeDebt: (targetId, amount, interest, reason) => {
        if (!session) return;
        const val = parseInt(amount);
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
            `Fonds insuffisants. Il faut ${total} Écus.`,
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
        notify(`Dette remboursée (${total} Écus).`, "success");
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
    };
  }, [session, state, saveState, notify]);
};
