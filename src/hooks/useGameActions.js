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

        saveState(ns);
        notify(
          `Un nouveau jour se lève : ${ns.gameDate.day}/${ns.gameDate.month}/${ns.gameDate.year}`,
          "info"
        );
      },
      onAddTreasury: () => {
        const amount = prompt("Quantité d'écus à frapper :");
        if (amount && !isNaN(amount)) {
          saveState({
            ...state,
            treasury: (state.treasury || 0) + parseInt(amount),
          });
          notify("Trésor impérial renfloué.", "success");
        }
      },
      onTransfer: (srcRaw, tgtRaw, amount) => {
        if (!session) return;

        if (!amount || amount <= 0 || !srcRaw || !tgtRaw) {
          notify("Virement souverain incomplet.", "error");
          return;
        }
        if (
          srcRaw === "GLOBAL" &&
          !["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(session.role)
        ) {
          notify("Action souveraine refusée.", "error");
          return;
        }

        const sourceId = srcRaw.startsWith("U-") ? srcRaw.slice(2) : null;
        const sourceCountryId = srcRaw.startsWith("C-")
          ? srcRaw.slice(2)
          : null;
        const targetId = tgtRaw.startsWith("U-") ? tgtRaw.slice(2) : null;
        const targetCountryId = tgtRaw.startsWith("C-")
          ? tgtRaw.slice(2)
          : targetId
          ? state.citizens.find((c) => c.id === targetId)?.countryId
          : null;

        if (sourceId && sourceId !== session.id) {
          const targetCitizen = state.citizens.find((c) => c.id === sourceId);
          if (!targetCitizen) {
            notify("Ponction interdite.", "error");
            return;
          }
          if (
            ![
              "EMPEREUR",
              "GRAND_FONC_GLOBAL",
              "ROI",
              "INTENDANT",
              "GRAND_FONC_LOCAL",
              "FONCTIONNAIRE",
            ].includes(session.role)
          ) {
            notify("Ponction interdite.", "error");
            return;
          }
          if (
            !["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(session.role) &&
            targetCitizen.countryId !== session.countryId
          ) {
            const targetCountry = state.countries.find(
              (c) => c.id === targetCitizen.countryId
            );
            if (!targetCountry || !targetCountry.laws?.allowExternalDebits) {
              notify("Ponction hors juridiction.", "error");
              return;
            }
          }
        }

        if (sourceCountryId) {
          if (
            ![
              "EMPEREUR",
              "GRAND_FONC_GLOBAL",
              "ROI",
              "INTENDANT",
              "GRAND_FONC_LOCAL",
            ].includes(session.role)
          ) {
            notify("Trésor protégé par édit.", "error");
            return;
          }
          if (
            !["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(session.role) &&
            sourceCountryId !== session.countryId
          ) {
            notify("Trésor hors juridiction.", "error");
            return;
          }
        }

        if (
          sourceId &&
          sourceId === session.id &&
          state.citizens.find((c) => c.id === sourceId)?.countryId
        ) {
          const sCountry = state.countries.find(
            (c) =>
              c.id === state.citizens.find((c2) => c2.id === sourceId).countryId
          );
          if (
            sCountry &&
            sCountry.laws?.freezeAssets &&
            !["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(session.role)
          ) {
            notify(
              "Transferts interdits: Gel des avoirs en vigueur dans votre pays.",
              "error"
            );
            return;
          }
        }

        if (
          targetCountryId &&
          sourceCountryId &&
          targetCountryId !== sourceCountryId
        ) {
          const tCountry = state.countries.find(
            (c) => c.id === targetCountryId
          );
          if (tCountry && tCountry.laws?.closedCurrency) {
            notify(
              "Transfert refusé: la monnaie du pays destinataire est fermée.",
              "error"
            );
            return;
          }
        }

        let s = JSON.parse(JSON.stringify(state));
        let sName = "Archives";
        let tName = "Archives";

        if (sourceId) {
          const senderIdx = s.citizens.findIndex((x) => x.id === sourceId);
          if (senderIdx !== -1 && s.citizens[senderIdx].balance < amount) {
            notify("Fonds insuffisants pour effectuer ce virement.", "error");
            return;
          }
        }

        const process = (raw, isCredit) => {
          const v = isCredit ? amount : -amount;
          if (raw === "GLOBAL") {
            s.treasury += v;
            return "Trésor Empire";
          }
          const type = raw.substring(0, 1);
          const id = raw.slice(2);
          if (type === "C") {
            const idx = s.countries.findIndex((x) => x.id === id);
            if (idx !== -1) {
              s.countries[idx].treasury += v;
              return s.countries[idx].name;
            }
          }
          if (type === "U") {
            const idx = s.citizens.findIndex((x) => x.id === id);
            if (idx !== -1) {
              s.citizens[idx].balance += v;
              return s.citizens[idx].name;
            }
          }
          return "Inconnu";
        };

        sName = process(srcRaw, false);
        tName = process(tgtRaw, true);
        if (sName === "Inconnu") {
          notify("Source non identifiée.", "error");
          return;
        }

        s.globalLedger = [
          {
            id: Date.now(),
            fromName: String(sName),
            toName: String(tName),
            amount: Number(amount),
            timestamp: Date.now(),
          },
          ...(s.globalLedger || []),
        ];

        if (
          targetCountryId &&
          sourceCountryId &&
          targetCountryId !== sourceCountryId
        ) {
          const tIdx = s.countries.findIndex((c) => c.id === targetCountryId);
          const tCountry = s.countries[tIdx];
          if (tCountry && tCountry.laws?.taxForeignTransfers) {
            const tax = Math.max(0, Math.round(amount * 0.1));
            if (targetId) {
              const tgtIdx = s.citizens.findIndex((c) => c.id === targetId);
              if (tgtIdx !== -1) {
                s.citizens[tgtIdx].balance -= tax;
              }
              s.countries[tIdx].treasury += tax;
            }
            s.globalLedger = [
              {
                id: Date.now() + 1,
                fromName: `Taxe (${s.countries[tIdx].name})`,
                toName: s.countries[tIdx].name,
                amount: Number(tax),
                timestamp: Date.now(),
              },
              ...s.globalLedger,
            ];
          }
        }

        saveState(s);
        notify("Virement validé et consigné.", "success");
      },
      onSendPost: (targetId, subject, content, ccList, seal) => {
        if (!session) return;
        const senderName = session.name || "Inconnu";
        const senderRole = ROLES[session.role]?.label || "Citoyen";
        const safeCitizens = Array.isArray(state.citizens)
          ? state.citizens
          : [];
        const newMessage = {
          id: Date.now(),
          from: `${senderName} (${senderRole})`,
          fromId: session.id,
          date: `J${state.dayCycle}`,
          subject: String(subject),
          content: String(content),
          seal: String(seal),
          censored: false,
        };
        const allTargets = [targetId, ...(Array.isArray(ccList) ? ccList : [])];
        for (const tid of allTargets) {
          const tc = safeCitizens.find((c) => c.id === tid);
          if (tc) {
            const tCountry = state.countries.find((c) => c.id === tc.countryId);
            if (tCountry?.laws?.mailCensorship) {
              newMessage.censored = true;
              break;
            }
          }
        }

        const newCitizens = safeCitizens.map((c) => {
          if (
            c.id === targetId ||
            (Array.isArray(ccList) && ccList.includes(c.id))
          ) {
            return { ...c, messages: [newMessage, ...(c.messages || [])] };
          }
          return c;
        });
        saveState({ ...state, citizens: newCitizens });
      },
      onRequestTravel: (toCountryId, toRegion) => {
        if (!session) return;

        const targetCountry = state.countries.find((c) => c.id === toCountryId);
        if (targetCountry?.laws?.closeBorders) {
          notify("Demande rejetée : frontières hermétiques.", "error");
          const newReq = {
            id: `req_${Date.now()}`,
            citizenId: session.id,
            citizenName: session.name,
            fromCountry: session.countryId,
            toCountry: toCountryId,
            toRegion: toRegion,
            status: "REJECTED",
            validations: { exit: false, entry: false },
            timestamp: Date.now(),
          };
          saveState({
            ...state,
            travelRequests: [...(state.travelRequests || []), newReq],
          });
          return;
        }

        const sourceCountry = state.countries.find(
          (c) => c.id === session.countryId
        );
        if (
          sourceCountry?.laws?.forbidExit &&
          !["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(session.role)
        ) {
          notify(
            "Demande rejetée : sorties interdites par la loi du pays de départ.",
            "error"
          );
          const newReq = {
            id: `req_${Date.now()}`,
            citizenId: session.id,
            citizenName: session.name,
            fromCountry: session.countryId,
            toCountry: toCountryId,
            toRegion: toRegion,
            status: "REJECTED",
            validations: { exit: false, entry: false },
            timestamp: Date.now(),
          };
          saveState({
            ...state,
            travelRequests: [...(state.travelRequests || []), newReq],
          });
          return;
        }

        const entryFee = targetCountry?.laws?.entryVisaFee || 0;
        if (entryFee > 0) {
          const meIdx = state.citizens.findIndex((c) => c.id === session.id);
          if (meIdx === -1 || state.citizens[meIdx].balance < entryFee) {
            notify("Fonds insuffisants pour les frais de visa.", "error");
            return;
          }
          const newCitizens = [...state.citizens];
          newCitizens[meIdx] = {
            ...newCitizens[meIdx],
            balance: newCitizens[meIdx].balance - entryFee,
          };
          const cIdx = state.countries.findIndex((c) => c.id === toCountryId);
          const newCountries = [...state.countries];
          if (cIdx !== -1)
            newCountries[cIdx] = {
              ...newCountries[cIdx],
              treasury: (newCountries[cIdx].treasury || 0) + entryFee,
            };

          const newReq = {
            id: `req_${Date.now()}`,
            citizenId: session.id,
            citizenName: session.name,
            fromCountry: session.countryId,
            toCountry: toCountryId,
            toRegion: toRegion,
            status: "PENDING",
            validations: { exit: false, entry: false },
            timestamp: Date.now(),
          };

          saveState({
            ...state,
            travelRequests: [...(state.travelRequests || []), newReq],
            citizens: newCitizens,
            countries: newCountries,
          });
          notify(`Frais de visa ( ${entryFee} Écus ) prélevés.`, "info");
          return;
        }

        const newReq = {
          id: `req_${Date.now()}`,
          citizenId: session.id,
          citizenName: session.name,
          fromCountry: session.countryId,
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
        notify("Demande de visa soumise au bureau de poste.", "success");
      },
      onUpdateCitizen: (formData) => {
        if (!session) return;
        let freshCitizens = [...(state.citizens || [])];
        const index = freshCitizens.findIndex((x) => x.id === formData.id);
        const existing = index !== -1 ? freshCitizens[index] : null;

        const sensitiveKeys = [
          "ownerId",
          "status",
          "permissions",
          "balance",
          "isForSale",
          "salePrice",
        ];
        const isSensitiveChange =
          existing &&
          sensitiveKeys.some((k) => {
            if (formData[k] === undefined) return false;
            return JSON.stringify(formData[k]) !== JSON.stringify(existing[k]);
          });

        const isGlobalAdmin = ["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(
          session.role
        );
        const isLocalAdmin = [
          "ROI",
          "INTENDANT",
          "GRAND_FONC_LOCAL",
          "FONCTIONNAIRE",
        ].includes(session.role);

        const canManageTarget = (target) => {
          if (!target) return false;
          if (session.id === target.id) return true;
          if (isGlobalAdmin) return true;
          if (
            isLocalAdmin &&
            target.countryId &&
            session.countryId &&
            target.countryId === session.countryId
          )
            return true;
          return false;
        };

        if (isSensitiveChange) {
          if (!existing) {
            notify(
              "Action interdite: modification sensible non autorisée.",
              "error"
            );
            return;
          }
          if (!canManageTarget(existing)) {
            notify("Action interdite: hors juridiction.", "error");
            return;
          }

          const targetCountry =
            state.countries.find((c) => c.id === existing.countryId) || null;

          if (
            formData.balance !== undefined &&
            formData.balance !== existing.balance
          ) {
            if (!isGlobalAdmin) {
              if (!targetCountry?.laws?.allowLocalConfiscation) {
                notify("Confiscation interdite par la loi du pays.", "error");
                return;
              }
              if (
                existing.countryId &&
                session.countryId &&
                existing.countryId !== session.countryId
              ) {
                if (!targetCountry?.laws?.allowExternalDebits) {
                  notify(
                    "Ponction interdite: la nation cible n'autorise pas les prélèvements externes.",
                    "error"
                  );
                  return;
                }
              }
            }
          }

          if (
            formData.permissions !== undefined &&
            JSON.stringify(formData.permissions) !==
              JSON.stringify(existing.permissions)
          ) {
            if (
              !isGlobalAdmin &&
              session.id !== existing.ownerId &&
              targetCountry &&
              !targetCountry.laws.allowPermissionEditsByLocalAdmins
            ) {
              notify(
                "Modification des permissions interdite par la loi du pays.",
                "error"
              );
              return;
            }
          }

          if (
            (formData.isForSale !== undefined &&
              formData.isForSale !== existing.isForSale) ||
            (formData.salePrice !== undefined &&
              formData.salePrice !== existing.salePrice)
          ) {
            if (!isGlobalAdmin && session.id !== existing.ownerId) {
              if (targetCountry && !targetCountry.laws.allowLocalSales) {
                notify("Mise en vente interdite par la loi du pays.", "error");
                return;
              }
              if (targetCountry && targetCountry.laws.banPublicSlaveMarket) {
                notify(
                  "Mise en vente publique interdite par la loi du pays.",
                  "error"
                );
                return;
              }
              if (
                targetCountry &&
                targetCountry.laws.requireRulerApprovalForSales &&
                session.role !== "ROI"
              ) {
                notify(
                  "Mise en vente: approbation du souverain requise.",
                  "error"
                );
                return;
              }
            }
          }

          if (
            (formData.ownerId !== undefined &&
              formData.ownerId !== existing.ownerId) ||
            (formData.status !== undefined &&
              formData.status !== existing.status)
          ) {
            if (!isGlobalAdmin && session.id !== existing.ownerId) {
              if (targetCountry && !targetCountry.laws.allowLocalConfiscation) {
                notify(
                  "Modification de propriété interdite par la loi du pays.",
                  "error"
                );
                return;
              }
            }
          }
        }

        if (index !== -1) {
          freshCitizens[index] = { ...freshCitizens[index], ...formData };
        } else {
          freshCitizens.push(formData);
        }
        saveState({ ...state, citizens: freshCitizens });
        notify("Dossier mis à jour.", "success");
      },
      onProposeDebt: (debtorId, amount, interestRate, reason, dueDate) => {
        if (!session) return;
        if (amount <= 0) {
          notify("Montant invalide.", "error");
          return;
        }

        const debtor = state.citizens.find((c) => c.id === debtorId);
        if (!debtor) {
          notify("Débiteur introuvable.", "error");
          return;
        }

        const totalAmount = Math.floor(amount * (1 + interestRate / 100));

        const newContract = {
          id: `contract-${Date.now()}`,
          creditorId: session.id,
          creditorName: session.name,
          debtorId: debtorId,
          debtorName: debtor.name,
          principal: parseInt(amount),
          interestRate: parseInt(interestRate),
          totalAmount: totalAmount,
          reason: reason,
          dueDate: dueDate || "Indéterminée",
          status: "DRAFT",
          timestamp: Date.now(),
          signatureDate: null,
        };

        saveState({
          ...state,
          debtRegistry: [newContract, ...(state.debtRegistry || [])],
        });
        notify(
          "Projet de contrat envoyé au débiteur pour signature.",
          "success"
        );
      },
      onSignDebt: (contractId) => {
        if (!session) return;
        const contract = (state.debtRegistry || []).find(
          (c) => c.id === contractId
        );

        if (!contract) return;
        if (contract.debtorId !== session.id) {
          notify(
            "Vous ne pouvez pas signer un contrat qui ne vous concerne pas.",
            "error"
          );
          return;
        }
        if (contract.status !== "DRAFT") {
          notify("Ce contrat n'est plus en attente de signature.", "error");
          return;
        }

        const creditorIdx = state.citizens.findIndex(
          (c) => c.id === contract.creditorId
        );
        const debtorIdx = state.citizens.findIndex((c) => c.id === session.id);

        if (creditorIdx === -1) {
          notify("Créancier introuvable.", "error");
          return;
        }

        if (state.citizens[creditorIdx].balance < contract.principal) {
          notify(
            "Le créancier n'a pas les fonds promis. Signature impossible.",
            "error"
          );
          return;
        }

        const newCitizens = [...state.citizens];
        newCitizens[creditorIdx] = {
          ...newCitizens[creditorIdx],
          balance: newCitizens[creditorIdx].balance - contract.principal,
        };
        newCitizens[debtorIdx] = {
          ...newCitizens[debtorIdx],
          balance: newCitizens[debtorIdx].balance + contract.principal,
        };

        const newRegistry = state.debtRegistry.map((d) =>
          d.id === contractId
            ? { ...d, status: "ACTIVE", signatureDate: Date.now() }
            : d
        );

        saveState({
          ...state,
          citizens: newCitizens,
          debtRegistry: newRegistry,
        });
        notify("Contrat signé. Les fonds ont été transférés.", "success");
      },
      onPayDebt: (contractId) => {
        const contract = state.debtRegistry.find((d) => d.id === contractId);
        if (!contract || contract.status !== "ACTIVE") return;

        const debtorIdx = state.citizens.findIndex(
          (c) => c.id === contract.debtorId
        );
        const creditorIdx = state.citizens.findIndex(
          (c) => c.id === contract.creditorId
        );

        if (debtorIdx === -1 || creditorIdx === -1) return;

        const debtor = state.citizens[debtorIdx];
        if (debtor.balance < contract.totalAmount) {
          notify("Fonds insuffisants pour honorer cette créance.", "error");
          return;
        }

        const newCitizens = [...state.citizens];
        newCitizens[debtorIdx] = {
          ...debtor,
          balance: debtor.balance - contract.totalAmount,
        };
        newCitizens[creditorIdx] = {
          ...newCitizens[creditorIdx],
          balance: newCitizens[creditorIdx].balance + contract.totalAmount,
        };

        const newRegistry = state.debtRegistry.map((d) =>
          d.id === contractId
            ? { ...d, status: "PAID", paidDate: Date.now() }
            : d
        );

        saveState({
          ...state,
          citizens: newCitizens,
          debtRegistry: newRegistry,
        });
        notify("Dette honorée et archivée.", "success");
      },
      onCancelDebt: (contractId) => {
        const contract = state.debtRegistry.find((d) => d.id === contractId);
        if (!contract) return;

        const isCreditor = contract.creditorId === session.id;
        const isDebtor = contract.debtorId === session.id;

        if (contract.status === "ACTIVE" && !isCreditor) {
          notify(
            "Seul le créancier peut accorder une remise de dette.",
            "error"
          );
          return;
        }

        if (contract.status === "DRAFT" && !isCreditor && !isDebtor) {
          notify("Action non autorisée.", "error");
          return;
        }

        const newRegistry = state.debtRegistry.map((d) =>
          d.id === contractId ? { ...d, status: "CANCELLED" } : d
        );
        saveState({ ...state, debtRegistry: newRegistry });
        notify(
          contract.status === "DRAFT"
            ? "Proposition refusée."
            : "Dette annulée (Cadeau).",
          "info"
        );
      },
      onBuyItem: (itemId, qty) => {
        if (!session) return;
        const item = state.inventoryCatalog.find((i) => i.id === itemId);
        if (!item) return;

        const myCountry = state.countries.find(
          (c) => c.id === session.countryId
        );
        if (
          item.type === "Arme" &&
          myCountry &&
          myCountry.laws &&
          !myCountry.laws.allowWeapons
        ) {
          notify(
            "Achat interdit: possession d'armes prohibée par la législation nationale.",
            "error"
          );
          return;
        }

        const cost = item.price * qty;
        const cIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (cIdx === -1) return;
        const citizen = state.citizens[cIdx];
        if (citizen.balance < cost) {
          notify("Fonds insuffisants.", "error");
          return;
        }
        const newCitizens = [...state.citizens];
        const inventory = [...(citizen.inventory || [])];
        const existingItemIdx = inventory.findIndex((i) => i.itemId === itemId);
        if (existingItemIdx >= 0) {
          inventory[existingItemIdx] = {
            ...inventory[existingItemIdx],
            qty: inventory[existingItemIdx].qty + qty,
          };
        } else {
          inventory.push({ itemId, qty });
        }
        newCitizens[cIdx] = {
          ...citizen,
          balance: citizen.balance - cost,
          inventory,
        };
        saveState({
          ...state,
          citizens: newCitizens,
          treasury: (state.treasury || 0) + cost,
        });
        notify(`Achat effectué : ${item.name} (x${qty})`, "success");
      },
      onGiveItem: (targetId, itemId, qty) => {
        if (!session) return;
        const cIdx = state.citizens.findIndex((c) => c.id === session.id);
        const tIdx = state.citizens.findIndex((c) => c.id === targetId);
        if (cIdx === -1 || tIdx === -1) {
          notify("Erreur de transaction.", "error");
          return;
        }
        const citizen = state.citizens[cIdx];
        const inventory = [...(citizen.inventory || [])];
        const itemIdx = inventory.findIndex((i) => i.itemId === itemId);
        if (itemIdx === -1 || inventory[itemIdx].qty < qty) {
          notify("Quantité insuffisante.", "error");
          return;
        }

        const target = state.citizens[tIdx];
        const targetInventory = [...(target.inventory || [])];

        const itemDef = state.inventoryCatalog.find((i) => i.id === itemId);
        const targetCountry = state.countries.find(
          (c) => c.id === target.countryId
        );
        if (
          itemDef &&
          itemDef.type === "Arme" &&
          targetCountry &&
          targetCountry.laws &&
          !targetCountry.laws.allowWeapons
        ) {
          notify(
            "Transfert interdit: possession d'armes prohibée dans le pays du destinataire.",
            "error"
          );
          return;
        }

        if (inventory[itemIdx].qty === qty) {
          inventory.splice(itemIdx, 1);
        } else {
          inventory[itemIdx] = {
            ...inventory[itemIdx],
            qty: inventory[itemIdx].qty - qty,
          };
        }
        const targetItemIdx = targetInventory.findIndex(
          (i) => i.itemId === itemId
        );
        if (targetItemIdx >= 0) {
          targetInventory[targetItemIdx] = {
            ...targetInventory[targetItemIdx],
            qty: targetInventory[targetItemIdx].qty + qty,
          };
        } else {
          targetInventory.push({ itemId, qty });
        }
        const newCitizens = [...state.citizens];
        newCitizens[cIdx] = { ...citizen, inventory };
        newCitizens[tIdx] = { ...target, inventory: targetInventory };
        saveState({ ...state, citizens: newCitizens });
        notify("Objet transféré.", "success");
      },
      onBuySlave: (slaveId, price) => {
        if (!session) return;
        const buyerIdx = state.citizens.findIndex((c) => c.id === session.id);
        const slaveIdx = state.citizens.findIndex((c) => c.id === slaveId);

        if (buyerIdx === -1 || slaveIdx === -1) {
          notify("Erreur de transaction.", "error");
          return;
        }

        const buyer = state.citizens[buyerIdx];
        const slave = state.citizens[slaveIdx];

        const slaveCountry = state.countries.find(
          (c) => c.id === slave.countryId
        );
        if (slaveCountry && slaveCountry.laws?.banPublicSlaveMarket) {
          notify(
            "Achat impossible : marché public d'esclaves interdit par la loi.",
            "error"
          );
          return;
        }

        if (buyer.balance < price) {
          notify("Fonds insuffisants.", "error");
          return;
        }

        const newCitizens = [...state.citizens];
        newCitizens[buyerIdx] = {
          ...buyer,
          balance: buyer.balance - price,
        };
        if (slave.ownerId) {
          const sellerIdx = newCitizens.findIndex(
            (c) => c.id === slave.ownerId
          );
          if (sellerIdx !== -1) {
            newCitizens[sellerIdx] = {
              ...newCitizens[sellerIdx],
              balance: newCitizens[sellerIdx].balance + price,
            };
          }
        }
        newCitizens[slaveIdx] = {
          ...slave,
          ownerId: buyer.id,
          isForSale: false,
          salePrice: 0,
        };

        saveState({ ...state, citizens: newCitizens });
        notify(`Vous avez acquis ${slave.name}.`, "success");
      },
      onSelfManumit: (slaveId) => {
        if (!session) return;
        const idx = state.citizens.findIndex((c) => c.id === slaveId);
        if (idx === -1) return;
        const slave = state.citizens[idx];
        if (slave.id !== session.id) {
          notify("Action non autorisée.", "error");
          return;
        }
        const laws =
          state.countries.find((c) => c.id === slave.countryId)?.laws || {};
        if (!laws.allowSelfManumission) {
          notify(
            "Auto-affranchissement non autorisé par la loi du pays.",
            "error"
          );
          return;
        }
        const price = slave.salePrice || 0;
        if (!price || slave.balance < price) {
          notify("Fonds insuffisants pour s'acheter la liberté.", "error");
          return;
        }
        const newCitizens = [...state.citizens];
        newCitizens[idx] = {
          ...slave,
          balance: slave.balance - price,
          ownerId: null,
          status: "Actif",
          isForSale: false,
          salePrice: 0,
        };
        if (slave.ownerId) {
          const ownerIdx = newCitizens.findIndex((c) => c.id === slave.ownerId);
          if (ownerIdx !== -1) {
            newCitizens[ownerIdx] = {
              ...newCitizens[ownerIdx],
              balance: newCitizens[ownerIdx].balance + price,
            };
          }
        }

        saveState({ ...state, citizens: newCitizens });
        notify("Vous avez racheté votre liberté.", "success");
      },
      onUpdateHouseRegistry: (newRegistry) => {
        saveState({ ...state, maisonRegistry: newRegistry });
        notify("Registre de la Maison mis à jour.", "success");
      },
      onBookMaison: (entryId, price) => {
        if (!session) return;
        const clientIdx = state.citizens.findIndex((c) => c.id === session.id);
        if (clientIdx === -1) return;

        const client = state.citizens[clientIdx];
        if (client.balance < price) {
          notify("Fonds insuffisants pour cette réservation.", "error");
          return;
        }

        const newCitizens = [...state.citizens];
        newCitizens[clientIdx] = {
          ...client,
          balance: client.balance - price,
        };
        const newTreasury = (state.treasury || 0) + price;
        const newRegistry = (state.maisonRegistry || []).map((item) =>
          item.id === entryId ? { ...item, status: "Réservé" } : item
        );

        saveState({
          ...state,
          citizens: newCitizens,
          treasury: newTreasury,
          maisonRegistry: newRegistry,
        });
        notify("Réservation confirmée. Bon divertissement.", "success");
      },
    };
  }, [session, state, saveState, notify]);
};
