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
  Lock,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  FileSignature,
  Handshake,
  Gift,
  ArrowUpRight as ArrowUpRightIcon,
  Hand,
} from "lucide-react";

// Hooks & Lib
import { useAuth } from "./hooks/useAuth";
import { useGameEngine } from "./hooks/useGameEngine";
import { ROLES, BASE_STATUSES } from "./lib/constants";

// UI Components
import Toast from "./components/ui/Toast";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import Card from "./components/ui/Card";
import UserSearchSelect from "./components/ui/UserSearchSelect";

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
import SlaveManagementView from "./components/views/SlaveManagementView";

export default function App() {
  const [toast, setToast] = useState({ msg: null, type: "info" });
  const notify = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: null, type: "info" }), 3000);
  }, []);

  // Hooks Logic
  const { firebaseUser, session, setSession, authLoading, loginGame } =
    useAuth(notify);
  const { state, saveState, syncStatus, connection, dbError, forceInit } =
    useGameEngine(firebaseUser, notify);

  // UI Logic
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isViewingAsCitizen, setIsViewingAsCitizen] = useState(false);

  // LOGIQUE UTILISATEUR & STATUS
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
  // Un esclave ne peut pas accéder à l'admin même s'il est gradé
  const canAccessAdmin = isActuallyGraded && !isIncapacitated && !isSlave;
  const shouldShowCitizenView = !canAccessAdmin || isViewingAsCitizen;

  // --- ACTIONS DU JEU ---
  const actions = {
    onPassDay: () => {
      let ns = JSON.parse(JSON.stringify(state));
      ns.dayCycle++;
      saveState(ns);
      notify("Les astres ont tourné. Un nouveau cycle commence.", "info");
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
  };

  const availableTabs = useMemo(() => {
    const tabs = [];
    if (roleInfo.level >= 90)
      tabs.push({ id: "dashboard", label: "Grand Empire", icon: Crown });
    tabs.push({ id: "country", label: "Atlas", icon: Globe });
    tabs.push({ id: "registry", label: "Registre", icon: Scroll });
    tabs.push({ id: "items", label: "Objets", icon: Box });
    tabs.push({ id: "bank", label: "Banque", icon: Coins });
    tabs.push({ id: "post", label: "Poste", icon: Mail });

    // NOTE: On ne met PAS l'onglet Esclaves ici (c'est l'admin)
    // Il est géré uniquement dans UserInterfaceWrapper

    if (roleInfo.level >= 40)
      tabs.push({ id: "espionage", label: "Cabinet Noir", icon: EyeOff });
    if (roleInfo.level >= 20 || roleInfo.role === "POSTIERE")
      tabs.push({ id: "postoffice", label: "Bureau Visas", icon: Stamp });
    return tabs;
  }, [roleInfo.level]);

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
          <UserInterfaceWrapper
            user={currentUser}
            users={state.citizens}
            countries={state.countries}
            travelRequests={state.travelRequests}
            globalLedger={state.globalLedger}
            debtRegistry={state.debtRegistry}
            catalog={state.inventoryCatalog}
            onLogout={() => setSession(null)}
            onUpdateUser={actions.onUpdateCitizen}
            onSend={actions.onSendPost}
            onRequestTravel={actions.onRequestTravel}
            onTransfer={actions.onTransfer}
            onCreateDebt={actions.onCreateDebt}
            onPayDebt={actions.onPayDebt}
            onCancelDebt={actions.onCancelDebt}
            onBuyItem={actions.onBuyItem}
            onGiveItem={actions.onGiveItem}
            notify={notify}
            isGraded={canAccessAdmin}
            onSwitchBack={() => setIsViewingAsCitizen(false)}
            isBanned={currentStatus === "Banni"}
            isPrisoner={currentStatus === "Prisonnier"}
          />
        ) : (
          /* --- ADMIN DASHBOARD --- */
          <div className="flex h-screen overflow-hidden">
            {/* SIDEBAR */}
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

            {/* MAIN CONTENT */}
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
                      Cycle {state.dayCycle}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest px-3 py-2 md:px-5 md:py-2.5 border-2 border-stone-200 rounded-full bg-white/50 shadow-inner hidden sm:block">
                  Liaison: {syncStatus === "saving" ? "Archivage..." : "Stable"}
                </div>
              </header>
              <main className="flex-1 p-4 md:p-8 overflow-hidden relative z-10">
                {activeTab === "dashboard" && roleInfo.level >= 90 && (
                  <DashboardView
                    state={state}
                    roleInfo={roleInfo}
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
                    session={session}
                    onSend={actions.onSendPost}
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
              </main>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

// --- HELPER WRAPPER POUR L'INTERFACE CITOYEN ---
const UserInterfaceWrapper = (props) => {
  const [active, setActive] = useState("profil");
  const {
    user,
    users,
    countries,
    globalLedger,
    debtRegistry,
    catalog,
    onLogout,
    onUpdateUser,
    onSend,
    onRequestTravel,
    onTransfer,
    onCreateDebt,
    onPayDebt,
    onCancelDebt,
    onBuyItem,
    onGiveItem,
    notify,
    isGraded,
    onSwitchBack,
    travelRequests,
    isBanned,
    isPrisoner,
  } = props;

  // --- LOGIQUE ESCLAVE ---
  const isSlave = user.status === "Esclave";
  const owner =
    isSlave && user.ownerId ? users.find((u) => u.id === user.ownerId) : null;
  const permissions = user.permissions || {};
  // Si esclave, vérifie la permission. Sinon (libre) toujours true.
  const canUsePost = !isSlave || permissions.post;
  const canUseBank = !isSlave || permissions.bank;
  const canUseTravel = !isSlave || permissions.travel;
  // -----------------------

  // --- LOGIQUE MAITRE (CITOYEN) ---
  const mySlaves = users.filter((u) => u.ownerId === user.id);
  // -------------------------------

  // State local pour les forms
  const [editOccupation, setEditOccupation] = useState(user?.occupation || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editAvatar, setEditAvatar] = useState(user?.avatarUrl || "");
  const [np, setNp] = useState("");

  const [transferTarget, setTransferTarget] = useState("");
  const [transferAmount, setTransferAmount] = useState(0);
  const [bankTab, setBankTab] = useState("ops");

  const [travelDestCountry, setTravelDestCountry] = useState("");
  const [travelDestRegion, setTravelDestRegion] = useState("");

  // Logique pour le Profil
  const safeCountries = Array.isArray(countries) ? countries : [];
  const targetCountry = safeCountries.find((c) => c.id === user.countryId);
  const customStatuses = targetCountry
    ? (targetCountry.customRoles || []).filter((r) => r.type === "STATUS")
    : [];

  // Computed Data
  const myTransactions = (globalLedger || []).filter(
    (l) => l.fromName === user.name || l.toName === user.name
  );
  const myDebts = (debtRegistry || []).filter(
    (d) => d.debtorId === user.id && d.status === "ACTIVE"
  );
  const myCredits = (debtRegistry || []).filter(
    (d) => d.creditorId === user.id && d.status === "ACTIVE"
  );
  const myInventory = (user.inventory || [])
    .map((slot) => {
      const itemDef = (catalog || []).find((i) => i.id === slot.itemId);
      return { ...slot, ...itemDef };
    })
    .filter((i) => i.name);
  const myPendingRequests = (travelRequests || []).filter(
    (r) => r.citizenId === user.id && r.status === "PENDING"
  );

  return (
    <div
      className={`flex flex-col font-serif text-stone-200 min-h-screen ${
        isSlave ? "bg-stone-950 border-8 border-stone-800" : "bg-stone-950"
      }`}
    >
      <header className="h-16 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-4 md:px-6 shadow-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center border border-stone-700 overflow-hidden relative">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                className="w-full h-full object-cover"
                alt=""
              />
            ) : (
              <User className="text-yellow-600" size={20} />
            )}
            {isSlave && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Lock size={16} className="text-white" />
              </div>
            )}
          </div>
          <div className="font-sans">
            <div className="font-bold text-sm md:text-base flex items-center gap-2">
              {user?.name}
              {isSlave && (
                <span className="bg-red-900 text-white text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest">
                  Esclave
                </span>
              )}
            </div>
            <div className="text-[9px] md:text-[10px] text-stone-500 uppercase tracking-widest">
              Mat: {user?.id}
            </div>
          </div>
        </div>
        <div className="flex gap-4 items-center font-sans">
          {isGraded && (
            <button
              onClick={onSwitchBack}
              className="bg-yellow-600 hover:bg-yellow-500 text-stone-950 px-3 md:px-4 py-1.5 rounded-lg font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
            >
              <Shield size={14} />{" "}
              <span className="hidden md:inline">Retour Admin</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="text-stone-500 hover:text-red-500 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          >
            <LogOut size={16} />{" "}
            <span className="hidden md:inline">Sortir</span>
          </button>
        </div>
      </header>

      {/* BANNIÈRE ESCLAVE */}
      {isSlave && (
        <div className="bg-stone-800 text-stone-400 text-xs p-2 text-center uppercase tracking-widest font-black flex items-center justify-center gap-2 border-b border-stone-700">
          <Lock size={12} /> Propriété de :{" "}
          {owner ? owner.name : "L'État (Sans maître)"}
        </div>
      )}

      <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-2xl mx-auto w-full font-sans pb-20 md:pb-6">
        <div className="flex mb-6 bg-stone-900 p-1 rounded-full border border-stone-800 shadow-inner overflow-x-auto">
          <button
            onClick={() => setActive("profil")}
            className={`flex-1 py-2 px-4 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${
              active === "profil"
                ? "bg-[#e6dcc3] text-stone-900 shadow-md"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            Registre
          </button>
          <button
            onClick={() => setActive("inventory")}
            className={`flex-1 py-2 px-4 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${
              active === "inventory"
                ? "bg-[#e6dcc3] text-stone-900 shadow-md"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            Inventaire
          </button>

          {/* BANQUE & POSTE & VOYAGE : Soumis aux permissions si esclave */}
          {canUseBank && (
            <button
              onClick={() => setActive("bank")}
              className={`flex-1 py-2 px-4 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${
                active === "bank"
                  ? "bg-[#e6dcc3] text-stone-900 shadow-md"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              Banque
            </button>
          )}

          {!isBanned && canUsePost && (
            <button
              onClick={() => setActive("msg")}
              className={`flex-1 py-2 px-4 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${
                active === "msg"
                  ? "bg-[#e6dcc3] text-stone-900 shadow-md"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              Poste
            </button>
          )}

          {!isBanned && !isPrisoner && canUseTravel && (
            <button
              onClick={() => setActive("travel")}
              className={`flex-1 py-2 px-4 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${
                active === "travel"
                  ? "bg-[#e6dcc3] text-stone-900 shadow-md"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              Voyage
            </button>
          )}

          {/* AJOUT : Onglet Main d'Œuvre (Visible uniquement si le citoyen a des esclaves) */}
          {mySlaves.length > 0 && (
            <button
              onClick={() => setActive("slaves")}
              className={`flex-1 py-2 px-4 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${
                active === "slaves"
                  ? "bg-[#e6dcc3] text-stone-900 shadow-md"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              Main d'Œuvre
            </button>
          )}
        </div>

        {/* --- PROFIL TAB --- */}
        {active === "profil" && (
          <div className="bg-[#fdf6e3] text-stone-900 rounded-lg shadow-2xl border-t-8 border-yellow-600 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-stone-300">
              <div className="flex justify-between items-start mb-6 border-b border-stone-200/50 pb-4">
                <h2 className="text-xl font-black uppercase text-stone-800 tracking-widest font-serif flex items-center gap-3">
                  <User size={20} /> Dossier Civil
                </h2>
                <span
                  className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                    user.status === "Esclave"
                      ? "bg-stone-800 text-white"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {user.status || "Actif"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-6">
                <div>
                  <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">
                    Nom & Matricule
                  </span>
                  <div className="font-bold text-lg text-stone-800">
                    {user.name}{" "}
                    <span className="text-xs text-stone-400 font-mono ml-2">
                      #{user.id}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">
                    Nation
                  </span>
                  <div className="font-bold text-lg text-stone-800">
                    {safeCountries.find((c) => c.id === user?.countryId)
                      ?.name || "Empire"}
                  </div>
                </div>
                <div>
                  <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">
                    Occupation
                  </span>
                  <input
                    className="w-full bg-stone-50 border-b-2 border-stone-300 font-bold text-stone-800 outline-none p-1"
                    value={editOccupation}
                    onChange={(e) => setEditOccupation(e.target.value)}
                    placeholder="Métier..."
                  />
                </div>
                <div>
                  <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">
                    Âge
                  </span>
                  <div className="font-bold text-lg text-stone-800">
                    {user.age || "?"} Ans
                  </div>
                </div>

                {isSlave && owner && (
                  <div className="col-span-2 bg-stone-200 p-2 rounded border border-stone-300">
                    <span className="block text-stone-500 uppercase font-bold text-[9px] mb-1 tracking-widest flex items-center gap-2">
                      <Lock size={10} /> Propriétaire
                    </span>
                    <div className="font-bold text-stone-900">{owner.name}</div>
                  </div>
                )}

                <div className="col-span-2">
                  <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">
                    Portrait (URL)
                  </span>
                  <input
                    className="w-full bg-stone-50 border-b-2 border-stone-300 font-bold text-stone-800 outline-none p-1"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                  />
                </div>
              </div>
              <textarea
                className="w-full bg-white/50 border-2 border-stone-200 rounded-lg p-3 text-sm italic font-serif text-stone-700 min-h-[100px] mb-6"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Biographie..."
              />

              <button
                onClick={() => {
                  onUpdateUser({
                    ...user,
                    occupation: editOccupation,
                    bio: editBio,
                    avatarUrl: editAvatar,
                  });
                  notify("Dossier mis à jour.", "success");
                }}
                className="w-full bg-stone-800 text-white py-3 rounded uppercase font-bold text-[10px] tracking-widest hover:bg-stone-700 transition-all shadow-md active:scale-95"
              >
                Mettre à jour
              </button>
            </div>
            <div className="p-6 md:p-8 bg-stone-100/50">
              <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest mb-4 flex items-center gap-2">
                <Lock size={16} /> Sceau de Sécurité
              </h3>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={np}
                  onChange={(e) => setNp(e.target.value)}
                  className="flex-1 p-3 bg-white border border-stone-200 rounded text-sm outline-none"
                  placeholder="Nouveau mot de passe..."
                />
                <button
                  onClick={() => {
                    if (np.length > 2) {
                      onUpdateUser({ ...user, password: np });
                      setNp("");
                      notify("Sceau modifié.", "success");
                    }
                  }}
                  className="bg-stone-800 text-white px-6 py-2 rounded text-[10px] font-bold uppercase hover:bg-stone-700"
                >
                  Changer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- BANK TAB (Si Permission OK) --- */}
        {active === "bank" && canUseBank && (
          <div className="space-y-6">
            <Card
              title="Solde Actuel"
              icon={Coins}
              className="bg-stone-900 text-yellow-500 shadow-inner border-yellow-900"
            >
              <div className="relative z-10 flex items-center justify-between p-2">
                <div>
                  <div className="text-[10px] uppercase opacity-50 tracking-widest mb-1">
                    Solde Personnel
                  </div>
                  <div className="text-4xl font-bold font-serif">
                    {Number(user?.balance || 0).toLocaleString()} Écus
                  </div>
                </div>
                <Coins size={64} className="opacity-10" />
              </div>
            </Card>
            <div className="flex border border-stone-300 rounded-lg overflow-hidden bg-stone-100">
              <button
                onClick={() => setBankTab("ops")}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest ${
                  bankTab === "ops"
                    ? "bg-[#fdf6e3] text-stone-900 shadow-inner"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                Trésorerie
              </button>
              <button
                onClick={() => setBankTab("debt")}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest ${
                  bankTab === "debt"
                    ? "bg-[#fdf6e3] text-stone-900 shadow-inner"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                Engagements
              </button>
            </div>
            {bankTab === "ops" && (
              <>
                {!isBanned && !isPrisoner && !isSlave && (
                  <Card title="Virement" icon={Send}>
                    <div className="flex flex-col gap-4">
                      <label className="text-[10px] font-bold uppercase text-stone-400 tracking-widest">
                        Bénéficiaire
                      </label>
                      <UserSearchSelect
                        users={users}
                        onSelect={setTransferTarget}
                        placeholder="Citoyen..."
                        excludeIds={[user.id]}
                        value={transferTarget}
                      />
                      <input
                        type="number"
                        className="w-full p-3 border rounded text-sm font-bold font-mono"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        placeholder="Montant"
                      />
                      <button
                        onClick={() => {
                          if (transferTarget && transferAmount > 0) {
                            onTransfer(
                              `U-${user.id}`,
                              `U-${transferTarget}`,
                              parseInt(transferAmount)
                            );
                            setTransferAmount(0);
                            setTransferTarget("");
                          }
                        }}
                        className="bg-stone-800 text-white w-full py-3 rounded text-[10px] font-bold uppercase hover:bg-stone-700"
                      >
                        Envoyer
                      </button>
                    </div>
                  </Card>
                )}
                <Card title="Historique" icon={Scroll}>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {myTransactions.length === 0 && (
                      <div className="text-center italic text-stone-400 text-xs py-4">
                        Aucune transaction.
                      </div>
                    )}
                    {myTransactions
                      .sort((a, b) => b.id - a.id)
                      .map((l) => (
                        <div
                          key={l.id}
                          className="flex justify-between items-center p-3 border-b border-stone-100 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                l.toName === user.name
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {l.toName === user.name ? (
                                <ArrowDownLeft size={16} />
                              ) : (
                                <ArrowUpRight size={16} />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-stone-800">
                                {l.toName === user.name
                                  ? `Reçu de ${l.fromName}`
                                  : `Envoyé à ${l.toName}`}
                              </div>
                              <div className="text-[10px] text-stone-400 uppercase tracking-widest">
                                {new Date(l.id).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`font-mono font-bold ${
                              l.toName === user.name
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {l.toName === user.name ? "+" : "-"}
                            {Number(l.amount).toLocaleString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              </>
            )}
            {bankTab === "debt" && (
              <div className="space-y-6">
                {!isBanned && !isSlave && (
                  <Card title="Reconnaissance de Dette" icon={FileSignature}>
                    <div className="space-y-4">
                      <UserSearchSelect
                        users={users}
                        onSelect={(id) => {
                          onCreateDebt(id, 10, "Dette");
                        }}
                        placeholder="Créancier..."
                        excludeIds={[user.id]}
                      />
                      <p className="text-xs text-stone-400 italic">
                        Utilisez le formulaire complet en mode bureau pour plus
                        d'options.
                      </p>
                    </div>
                  </Card>
                )}
                <Card
                  title="Dettes à régler"
                  icon={ArrowUpRightIcon}
                  className="border-l-4 border-red-500"
                >
                  <div className="space-y-3">
                    {myDebts.map((d) => (
                      <div
                        key={d.id}
                        className="bg-white p-3 rounded border border-stone-200"
                      >
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-sm">
                            À: {d.creditorName}
                          </span>
                          <span className="font-mono text-red-600 font-bold">
                            {d.amount}
                          </span>
                        </div>
                        <button
                          onClick={() => onPayDebt(d.id)}
                          className="w-full bg-red-50 text-red-700 py-2 rounded text-[10px] font-bold uppercase"
                        >
                          Rembourser
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card
                  title="Créances"
                  icon={Handshake}
                  className="border-l-4 border-green-500"
                >
                  <div className="space-y-3">
                    {myCredits.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white p-3 rounded border border-stone-200"
                      >
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-sm">
                            De: {c.debtorName}
                          </span>
                          <span className="font-mono text-green-600 font-bold">
                            {c.amount}
                          </span>
                        </div>
                        <button
                          onClick={() => onCancelDebt(c.id)}
                          className="w-full bg-stone-100 text-stone-500 py-2 rounded text-[10px] font-bold uppercase"
                        >
                          Annuler
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* --- INVENTORY TAB --- */}
        {active === "inventory" && (
          <div className="space-y-6">
            <div className="space-y-4">
              {myInventory.map((item) => (
                <div
                  key={item.itemId}
                  className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-stone-100 rounded-lg flex-shrink-0 flex items-center justify-center border border-stone-200">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : (
                      <Box size={20} className="text-stone-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-stone-800">{item.name}</div>
                    <div className="text-[10px] uppercase text-stone-400 tracking-widest">
                      x{item.qty}
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() =>
                        onGiveItem(
                          users.find((u) => u.id !== user.id)?.id,
                          item.itemId,
                          1
                        )
                      }
                      className="text-stone-400 hover:text-stone-600"
                    >
                      <Gift size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {!isSlave && (
              <>
                <h3 className="font-bold text-center border-t pt-4">Marché</h3>
                <div className="grid grid-cols-1 gap-4">
                  {catalog
                    .filter((i) => !i.hidden)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold">{item.name}</div>
                          <div className="text-xs text-stone-500">
                            {item.price} Écus
                          </div>
                        </div>
                        <button
                          onClick={() => onBuyItem(item.id, 1)}
                          className="bg-stone-800 text-white px-4 py-2 rounded text-[10px] font-bold uppercase"
                        >
                          Acheter
                        </button>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* --- MSG TAB (Si Permission OK) --- */}
        {active === "msg" && !isBanned && canUsePost && (
          <PostView
            users={users}
            session={user}
            onSend={onSend}
            notify={notify}
          />
        )}

        {/* --- TRAVEL TAB (Si Permission OK) --- */}
        {active === "travel" && !isBanned && !isPrisoner && canUseTravel && (
          <div className="bg-[#fdf6e3] text-stone-900 p-6 md:p-8 rounded-lg shadow-2xl border-t-8 border-stone-500 space-y-6">
            <h3 className="text-xl font-bold uppercase tracking-widest text-stone-800 border-b pb-4 mb-4 font-serif">
              Demande de Laissez-passer
            </h3>
            {myPendingRequests.length > 0 ? (
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-sm">
                <div className="font-bold text-yellow-800 mb-2">
                  En cours...
                </div>
                <div>
                  Destination:{" "}
                  {
                    countries.find(
                      (c) => c.id === myPendingRequests[0].toCountry
                    )?.name
                  }
                </div>
                <div className="text-[10px] uppercase mt-2 tracking-widest font-bold text-stone-400">
                  Status: {myPendingRequests[0].status}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <select
                  className="w-full p-3 border rounded bg-white text-sm"
                  value={travelDestCountry}
                  onChange={(e) => setTravelDestCountry(e.target.value)}
                >
                  <option value="">— Destination —</option>
                  {countries
                    .filter((c) => c.id !== user.countryId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  <option value={user.countryId}>Voyage Intérieur</option>
                </select>
                {travelDestCountry && (
                  <select
                    className="w-full p-3 border rounded bg-white text-sm"
                    value={travelDestRegion}
                    onChange={(e) => setTravelDestRegion(e.target.value)}
                  >
                    <option value="">— Région —</option>
                    {(
                      countries.find((c) => c.id === travelDestCountry)
                        ?.regions || []
                    ).map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => {
                    if (travelDestCountry)
                      onRequestTravel(
                        travelDestCountry,
                        travelDestRegion || "Frontière"
                      );
                  }}
                  disabled={!travelDestCountry}
                  className={`w-full py-3 rounded uppercase font-bold text-[10px] tracking-widest transition-all ${
                    travelDestCountry
                      ? "bg-stone-800 text-white hover:bg-stone-700"
                      : "bg-stone-200 text-stone-400"
                  }`}
                >
                  Soumettre
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- SLAVES TAB (MAITRE) --- */}
        {active === "slaves" && (
          <SlaveManagementView
            slaves={mySlaves}
            onUpdateCitizen={onUpdateUser}
            notify={notify}
            catalog={catalog}
          />
        )}
      </main>
    </div>
  );
};
