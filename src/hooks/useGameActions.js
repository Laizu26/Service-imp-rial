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
        const companies = ns.companies || [];
        companies.forEach((company, compIdx) => {
          const empCount = (company.employees || []).length;
          const slaveCount = (company.slaves || []).length;
          const level = company.level || 1;

          const revenue = (empCount * 10 + slaveCount * 8) * level;
          if (revenue <= 0) return;

          // Taxe 10% au pays d'enregistrement
          const tax = Math.floor(revenue * 0.1);
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
      onDeleteCompany: (companyId) => {
        if (!session) return;
        const company = (state.companies || []).find(
          (c) => c.id === companyId
        );
        if (!company) return;

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
        const item = (state.inventoryCatalog || []).find(
          (i) => i.id === itemId
        );
        if (!item) {
          notify("Objet introuvable.", "error");
          return;
        }
        const qty = parseInt(quantity) || 1;
        const cost = (item.price || 0) * qty;

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

        saveState({
          ...state,
          citizens: newCitizens,
          treasury: (state.treasury || 0) + cost,
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
        saveState({ ...state, citizens: newCitizens });
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
        newCitizens[slaveIdx] = {
          ...newCitizens[slaveIdx],
          ownerId: session.id,
          isForSale: false,
          salePrice: 0,
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
        };

        saveState({
          ...state,
          citizens: newCitizens,
          treasury: newTreasury,
          globalLedger: [ledgerEntry, ...(state.globalLedger || [])],
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

        saveState({
          ...state,
          citizens: newCitizens,
          treasury: (state.treasury || 0) + price,
        });
        notify("Vous êtes libre !", "success");
      },
      onUpdateHouseRegistry: (reg) =>
        saveState({ ...state, maisonRegistry: reg }),
      onUpdateMaisonStaff: (staff) =>
        saveState({ ...state, maisonStaff: staff }),
      onBookMaison: (staffId) => {
        if (!session) return;
        const registry = state.maisonRegistry || [];

        // Départ : staffId === null → retirer du registre
        if (staffId === null) {
          saveState({
            ...state,
            maisonRegistry: registry.filter(
              (r) => r.citizenId !== session.id
            ),
          });
          notify("Vous avez quitté la Maison.", "info");
          return;
        }

        // Réservation : trouver le staff et vérifier le solde
        const worker = (state.maisonStaff || []).find(
          (s) => s.id === staffId
        );
        if (!worker) {
          notify("Personnel introuvable.", "error");
          return;
        }

        // Vérifier si déjà occupé
        if (registry.some((r) => r.staffId === staffId)) {
          notify("Cette personne est déjà occupée.", "error");
          return;
        }

        // Vérifier si le client a déjà une réservation
        if (registry.some((r) => r.citizenId === session.id)) {
          notify("Vous êtes déjà en compagnie.", "error");
          return;
        }

        const clientIdx = state.citizens.findIndex(
          (c) => c.id === session.id
        );
        if (clientIdx === -1) return;

        const price = worker.price || 0;
        if (state.citizens[clientIdx].balance < price) {
          notify("Fonds insuffisants.", "error");
          return;
        }

        const newCitizens = [...state.citizens];
        newCitizens[clientIdx] = {
          ...newCitizens[clientIdx],
          balance: newCitizens[clientIdx].balance - price,
        };

        const newEntry = {
          citizenId: session.id,
          staffId: staffId,
          startTime: Date.now(),
        };

        saveState({
          ...state,
          citizens: newCitizens,
          maisonRegistry: [...registry, newEntry],
          treasury: (state.treasury || 0) + price,
        });
        notify("Réservé.", "success");
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
        saveState({
          ...state,
          citizens: newCitizens,
          debtRegistry: registry,
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
    };
  }, [session, state, saveState, notify]);
};
