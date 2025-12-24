import React, { useState, useMemo, useCallback } from "react";
import {
  Shield,
  LogOut,
  User,
  Crown,
  Globe,
  Scroll,
  Box,
  Coins,
  Mail,
  EyeOff,
  Stamp,
  UserCircle,
  Menu,
  Gem, // Icône pour la Maison de Asia
} from "lucide-react";

// Hooks & Lib
import { useAuth } from "./hooks/useAuth";
import { useGameEngine } from "./hooks/useGameEngine";
import { ROLES } from "./lib/constants";

// UI Components
import Toast from "./components/ui/Toast";
import ErrorBoundary from "./components/ui/ErrorBoundary";

// Views
import LoginScreen from "./components/views/LoginScreen";
import DeathScreen from "./components/views/DeathScreen";
import DashboardView from "./components/views/DashboardView";
import GeopoliticsView from "./components/views/GeopoliticsView";
import RegistryView from "./components/views/RegistryView";
import BankView from "./components/views/BankView";
import InventoryView from "./components/views/InventoryView";
import PostView from "./components/views/PostView";
import EspionageView from "./components/views/EspionageView";
import PostOfficeView from "./components/views/PostOfficeView";

// NOUVEAU : Import de l'interface Admin Maison de Asia
import MaisonDeAsiaAdmin from "./components/views/MaisonDeAsiaAdmin";

// NOUVEAU : Import du Layout Citoyen
import CitizenLayout from "./components/layout/CitizenLayout";

export default function App() {
  const [toast, setToast] = useState({ msg: null, type: "info" });
  const notify = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: null, type: "info" }), 3000);
  }, []);

  const { firebaseUser, session, setSession, authLoading, loginGame } =
    useAuth(notify);
  const { state, saveState, syncStatus, connection, dbError, forceInit } =
    useGameEngine(firebaseUser, notify);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isViewingAsCitizen, setIsViewingAsCitizen] = useState(false);

  // Sécurisation de currentUser
  const currentUser = useMemo(
    () => (state.citizens || []).find((c) => c.id === session?.id) || session,
    [state.citizens, session]
  );

  const roleInfo = useMemo(() => {
    if (!currentUser) return ROLES.CITOYEN;
    if (ROLES[currentUser.role]) return ROLES[currentUser.role];

    const country = (state.countries || []).find(
      (c) => c.id === currentUser.countryId
    );
    if (country && country.customRoles) {
      const custom = country.customRoles.find(
        (r) => r.id === currentUser.role || r.name === currentUser.role
      );
      if (custom && custom.type === "ROLE") {
        return { label: custom.name, level: custom.level || 0, scope: "LOCAL" };
      }
    }
    return ROLES.CITOYEN;
  }, [currentUser, state.countries]);

  const currentStatus = currentUser?.status || "Actif";
  const isDead = currentStatus === "Décédé";
  const isSlave = currentStatus === "Esclave";

  const isRestricted = useMemo(() => {
    if (["Malade", "Prisonnier", "Banni", "Décédé"].includes(currentStatus))
      return true;

    const country = (state.countries || []).find(
      (c) => c.id === currentUser?.countryId
    );
    if (country && country.customRoles) {
      const customStatus = country.customRoles.find(
        (r) => r.type === "STATUS" && r.name === currentStatus
      );
      if (customStatus && customStatus.isRestricted) return true;
    }
    return false;
  }, [currentStatus, currentUser, state.countries]);

  const isIncapacitated = isRestricted;
  const isActuallyGraded = roleInfo.level >= 20;
  const canAccessAdmin = isActuallyGraded && !isIncapacitated && !isSlave;
  const shouldShowCitizenView = !canAccessAdmin || isViewingAsCitizen;

  // --- ACTIONS DU JEU ---
  const actions = {
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
      // Sécurité session
      if (!session) return;

      if (!amount || amount <= 0 || !srcRaw || !tgtRaw) {
        notify("Virement souverain incomplet.", "error");
        return;
      }
      if (srcRaw === "GLOBAL" && session.role !== "EMPEREUR") {
        notify("Action souveraine refusée.", "error");
        return;
      }

      const sourceId = srcRaw.startsWith("U-") ? srcRaw.slice(2) : null;
      const sourceCountryId = srcRaw.startsWith("C-") ? srcRaw.slice(2) : null;

      if (
        sourceId &&
        sourceId !== session.id &&
        !["EMPEREUR", "ROI", "INTENDANT", "FONCTIONNAIRE"].includes(
          session.role
        )
      ) {
        notify("Ponction interdite.", "error");
        return;
      }
      if (
        sourceCountryId &&
        !["ROI", "INTENDANT", "EMPEREUR"].includes(session.role)
      ) {
        notify("Trésor protégé par édit.", "error");
        return;
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
      saveState(s);
      notify("Virement validé et consigné.", "success");
    },
    onSendPost: (targetId, subject, content, ccList, seal) => {
      if (!session) return;
      const senderName = session.name || "Inconnu";
      const senderRole = ROLES[session.role]?.label || "Citoyen";
      const safeCitizens = Array.isArray(state.citizens) ? state.citizens : [];
      const newMessage = {
        id: Date.now(),
        from: `${senderName} (${senderRole})`,
        fromId: session.id,
        date: `J${state.dayCycle}`,
        subject: String(subject),
        content: String(content),
        seal: String(seal),
      };
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
      let freshCitizens = [...(state.citizens || [])];
      const index = freshCitizens.findIndex((x) => x.id === formData.id);
      if (index !== -1) {
        freshCitizens[index] = { ...freshCitizens[index], ...formData };
      } else {
        freshCitizens.push(formData);
      }
      saveState({ ...state, citizens: freshCitizens });
      notify("Dossier mis à jour.", "success");
    },
    onCreateDebt: (creditorId, amount, reason) => {
      if (!session) return;
      const newDebt = {
        id: `debt-${Date.now()}`,
        debtorId: session.id,
        debtorName: session.name,
        creditorId: creditorId,
        creditorName:
          state.citizens.find((c) => c.id === creditorId)?.name || "Inconnu",
        amount: amount,
        reason: reason,
        status: "ACTIVE",
        timestamp: Date.now(),
      };
      saveState({
        ...state,
        debtRegistry: [newDebt, ...(state.debtRegistry || [])],
      });
      notify("Dette enregistrée sous serment.", "success");
    },
    onPayDebt: (debtId) => {
      const debt = state.debtRegistry.find((d) => d.id === debtId);
      if (!debt || debt.status !== "ACTIVE") return;
      const debtorIdx = state.citizens.findIndex((c) => c.id === debt.debtorId);
      const creditorIdx = state.citizens.findIndex(
        (c) => c.id === debt.creditorId
      );
      if (debtorIdx === -1 || creditorIdx === -1) {
        notify("Erreur: Partie introuvable.", "error");
        return;
      }
      const debtor = state.citizens[debtorIdx];
      if (debtor.balance < debt.amount) {
        notify("Fonds insuffisants.", "error");
        return;
      }
      const newCitizens = [...state.citizens];
      newCitizens[debtorIdx] = {
        ...debtor,
        balance: debtor.balance - debt.amount,
      };
      newCitizens[creditorIdx] = {
        ...newCitizens[creditorIdx],
        balance: newCitizens[creditorIdx].balance + debt.amount,
      };
      const newDebtRegistry = state.debtRegistry.map((d) =>
        d.id === debtId ? { ...d, status: "PAID" } : d
      );
      saveState({
        ...state,
        citizens: newCitizens,
        debtRegistry: newDebtRegistry,
      });
      notify("Dette honorée.", "success");
    },
    onCancelDebt: (debtId) => {
      const newDebtRegistry = state.debtRegistry.map((d) =>
        d.id === debtId ? { ...d, status: "CANCELLED" } : d
      );
      saveState({ ...state, debtRegistry: newDebtRegistry });
      notify("Dette annulée.", "info");
    },
    onBuyItem: (itemId, qty) => {
      if (!session) return;
      const item = state.inventoryCatalog.find((i) => i.id === itemId);
      if (!item) return;
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
      if (inventory[itemIdx].qty === qty) {
        inventory.splice(itemIdx, 1);
      } else {
        inventory[itemIdx] = {
          ...inventory[itemIdx],
          qty: inventory[itemIdx].qty - qty,
        };
      }
      const target = state.citizens[tIdx];
      const targetInventory = [...(target.inventory || [])];
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

      if (buyer.balance < price) {
        notify("Fonds insuffisants.", "error");
        return;
      }

      const newCitizens = [...state.citizens];
      newCitizens[buyerIdx] = { ...buyer, balance: buyer.balance - price };
      if (slave.ownerId) {
        const sellerIdx = newCitizens.findIndex((c) => c.id === slave.ownerId);
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
    // --- NOUVELLES ACTIONS MAISON DE ASIA ---
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
      newCitizens[clientIdx] = { ...client, balance: client.balance - price };

      // Ajouter les fonds au trésor ou à un compte spécifique (ici Trésor)
      const newTreasury = (state.treasury || 0) + price;

      // Mettre à jour le statut dans le registre Maison (facultatif, si on veut bloquer)
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

  const availableTabs = useMemo(() => {
    const tabs = [];
    if (roleInfo.level >= 90 || roleInfo.scope === "LOCAL")
      tabs.push({
        id: "dashboard",
        label: roleInfo.scope === "GLOBAL" ? "Grand Empire" : "Gouvernance",
        icon: Crown,
      });
    tabs.push({ id: "country", label: "Atlas", icon: Globe });
    tabs.push({ id: "registry", label: "Registre", icon: Scroll });
    tabs.push({ id: "items", label: "Objets", icon: Box });
    tabs.push({ id: "bank", label: "Banque", icon: Coins });
    tabs.push({ id: "post", label: "Poste", icon: Mail });
    if (roleInfo.level >= 40)
      tabs.push({ id: "espionage", label: "Cabinet Noir", icon: EyeOff });
    if (roleInfo.level >= 20 || roleInfo.role === "POSTIERE")
      tabs.push({ id: "postoffice", label: "Bureau Visas", icon: Stamp });

    // --- CORRECTION DU CRASH ICI ---
    // Vérification stricte que session existe avant de lire le role
    if (roleInfo.level >= 50 || (session && session.role === "TENANCIER")) {
      tabs.push({ id: "asia_admin", label: "Maison Asia", icon: Gem });
    }

    return tabs;
  }, [roleInfo, isSlave, isRestricted, session]); // Dépendance sur 'session' objet entier

  // --- RENDER ---
  if (session && isDead)
    return <DeathScreen onLogout={() => setSession(null)} />;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-stone-900 font-sans text-stone-900">
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast({ ...toast, msg: null })}
        />

        {!session ? (
          <LoginScreen
            onLogin={loginGame}
            users={state.citizens}
            loading={authLoading}
            notify={notify}
          />
        ) : shouldShowCitizenView ? (
          /* --- CITIZEN INTERFACE --- */
          <CitizenLayout
            user={currentUser}
            users={state.citizens || []}
            // --- MAISON DE ASIA (DONNÉES) ---
            houseRegistry={state.maisonRegistry || []}
            onBookMaison={actions.onBookMaison}
            // --------------------------------
            countries={state.countries || []}
            travelRequests={state.travelRequests || []}
            onRequestTravel={actions.onRequestTravel}
            catalog={state.inventoryCatalog || []}
            globalLedger={state.globalLedger || []}
            debtRegistry={state.debtRegistry || []}
            gazette={state.gazette || []}
            onLogout={() => setSession(null)}
            onUpdateUser={actions.onUpdateCitizen}
            onBuySlave={actions.onBuySlave}
            onSend={actions.onSendPost}
            onTransfer={actions.onTransfer}
            onCreateDebt={actions.onCreateDebt}
            onPayDebt={actions.onPayDebt}
            onCancelDebt={actions.onCancelDebt}
            onBuyItem={actions.onBuyItem}
            onGiveItem={actions.onGiveItem}
            notify={notify}
            isGraded={canAccessAdmin}
            onSwitchBack={() => setIsViewingAsCitizen(false)}
          />
        ) : (
          /* --- ADMIN DASHBOARD --- */
          <div className="flex h-screen overflow-hidden">
            <div
              className={`fixed inset-y-0 z-40 w-72 md:w-80 bg-stone-950 text-stone-200 flex flex-col border-r border-stone-800 transition-transform duration-300 shadow-2xl ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              } md:relative md:translate-x-0`}
            >
              <div className="p-6 md:p-10 text-center border-b border-stone-900 bg-stone-900/30 shadow-inner relative">
                <div className="absolute top-3 right-3 flex gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connection === "connected"
                        ? "bg-green-500 shadow-[0_0_10px_#10b981]"
                        : "bg-red-500"
                    }`}
                  />
                </div>
                <Shield
                  className="mx-auto mb-4 text-yellow-600 shadow-lg"
                  size={48}
                />
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-[0.2em] text-white font-serif">
                  Service Impérial
                </h1>
                <div className="text-[10px] uppercase mt-3 text-stone-500 font-black tracking-[0.4em] border border-stone-800 py-2 rounded-lg px-2 shadow-inner">
                  {roleInfo.label}
                </div>
              </div>
              <nav className="flex-1 p-4 md:p-6 space-y-2 overflow-y-auto">
                {availableTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTab(t.id);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`w-full text-left p-4 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-5 transition-all duration-300 ${
                      activeTab === t.id
                        ? "bg-[#e6dcc3] text-stone-900 shadow-[0_4px_15px_rgba(0,0,0,0.3)] translate-x-2"
                        : "text-stone-400 hover:bg-stone-900/50 hover:text-stone-100 hover:translate-x-1"
                    }`}
                  >
                    <t.icon size={18} /> {t.label}
                  </button>
                ))}
              </nav>
              <div className="p-4 md:p-6 border-t border-stone-900 space-y-2">
                {canAccessAdmin && (
                  <button
                    onClick={() => setIsViewingAsCitizen(true)}
                    className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-stone-900 text-stone-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-stone-800 shadow-lg"
                  >
                    <UserCircle size={18} /> Voir comme Citoyen
                  </button>
                )}
                <button
                  onClick={() => setSession(null)}
                  className="w-full p-3 text-xs font-black uppercase text-stone-500 hover:text-red-400 flex items-center gap-3 justify-center transition-all hover:bg-red-500/5 tracking-widest"
                >
                  <LogOut size={16} /> Déconnexion
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#e6e2d6] flex flex-col h-screen overflow-hidden w-full">
              <header className="h-16 md:h-20 bg-[#fdf6e3] border-b border-stone-300 flex items-center px-4 md:px-8 justify-between shadow-xl relative z-20 shrink-0">
                <div className="flex items-center gap-4 md:gap-6">
                  <button
                    className="md:hidden p-2 hover:bg-stone-200 rounded-xl transition-all shadow-sm text-stone-700"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu size={24} />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[9px] md:text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] md:tracking-[0.4em] mb-1 font-mono">
                      Administration Impériale
                    </span>
                    <div className="text-lg md:text-xl font-black uppercase text-stone-800 tracking-widest font-serif">
                      {state.gameDate
                        ? `${state.gameDate.day}/${state.gameDate.month}/${state.gameDate.year}`
                        : `Cycle ${state.dayCycle}`}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest px-3 py-2 md:px-5 md:py-2.5 border-2 border-stone-200 rounded-full bg-white/50 shadow-inner hidden sm:block">
                  Liaison: {syncStatus === "saving" ? "Archivage..." : "Stable"}
                </div>
              </header>
              <main className="flex-1 p-4 md:p-8 overflow-hidden relative z-10">
                {activeTab === "dashboard" &&
                  (roleInfo.level >= 90 || roleInfo.scope === "LOCAL") && (
                    <DashboardView
                      state={state}
                      roleInfo={roleInfo}
                      session={session}
                      onUpdateState={saveState}
                      onPassDay={actions.onPassDay}
                      dbError={dbError}
                      onForceInit={forceInit}
                      onAddTreasury={actions.onAddTreasury}
                    />
                  )}
                {activeTab === "country" && (
                  <GeopoliticsView
                    countries={state.countries}
                    citizens={state.citizens}
                    onUpdate={(c) => saveState({ ...state, countries: c })}
                    session={session}
                    roleInfo={roleInfo}
                  />
                )}
                {activeTab === "items" && (
                  <InventoryView
                    items={state.inventoryCatalog}
                    onUpdate={(i) =>
                      saveState({ ...state, inventoryCatalog: i })
                    }
                    session={session}
                    roleInfo={roleInfo}
                  />
                )}
                {activeTab === "registry" && (
                  <RegistryView
                    citizens={state.citizens}
                    countries={state.countries}
                    catalog={state.inventoryCatalog}
                    session={session}
                    roleInfo={roleInfo}
                    onSave={actions.onUpdateCitizen}
                    onDelete={(c) => {
                      saveState({
                        ...state,
                        citizens: state.citizens.filter((x) => x.id !== c.id),
                      });
                    }}
                  />
                )}
                {activeTab === "bank" && (
                  <BankView
                    users={state.citizens}
                    countries={state.countries}
                    treasury={state.treasury}
                    ledger={state.globalLedger}
                    session={session}
                    roleInfo={roleInfo}
                    onTransfer={actions.onTransfer}
                  />
                )}
                {activeTab === "post" && (
                  <PostView
                    users={state.citizens}
                    session={currentUser}
                    onSend={actions.onSendPost}
                    onUpdateUser={actions.onUpdateCitizen}
                    notify={notify}
                  />
                )}
                {activeTab === "espionage" && (
                  <EspionageView
                    citizens={state.citizens}
                    session={session}
                    roleInfo={roleInfo}
                  />
                )}
                {activeTab === "postoffice" && (
                  <PostOfficeView
                    travelRequests={state.travelRequests}
                    countries={state.countries}
                    citizens={state.citizens}
                    session={session}
                    onUpdateRequests={(reqs) =>
                      saveState({ ...state, travelRequests: reqs })
                    }
                    onUpdateCitizen={(id, newCountryId) => {
                      const newCitizens = state.citizens.map((c) =>
                        c.id === id ? { ...c, countryId: newCountryId } : c
                      );
                      saveState({ ...state, citizens: newCitizens });
                    }}
                  />
                )}

                {/* --- VUE ADMIN MAISON DE ASIA --- */}
                {activeTab === "asia_admin" && (
                  <MaisonDeAsiaAdmin
                    citizens={state.citizens || []}
                    countries={state.countries || []}
                    houseRegistry={state.maisonRegistry || []}
                    onUpdateRegistry={actions.onUpdateHouseRegistry}
                  />
                )}
              </main>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
