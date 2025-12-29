import React, { useState, useMemo, useCallback } from "react";
import {
  Shield,
  LogOut,
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
  Gem,
} from "lucide-react";

// Hooks & Lib
import { useAuth } from "./hooks/useAuth";
import { useGameEngine } from "./hooks/useGameEngine";
import { useGameActions } from "./hooks/useGameActions"; // <--- IMPORT DU NOUVEAU HOOK
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

import MaisonDeAsiaAdmin from "./components/views/MaisonDeAsiaAdmin";
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

  // --- UTILISATION DU HOOK D'ACTIONS ---
  const actions = useGameActions(session, state, saveState, notify);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isViewingAsCitizen, setIsViewingAsCitizen] = useState(false);

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

    if (roleInfo.level >= 50 || (session && session.role === "TENANCIER")) {
      tabs.push({ id: "asia_admin", label: "Maison Asia", icon: Gem });
    }

    return tabs;
  }, [roleInfo, session]);

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
          <CitizenLayout
            user={currentUser}
            users={state.citizens || []}
            houseRegistry={state.maisonRegistry || []}
            onBookMaison={actions.onBookMaison}
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
            onSelfManumit={actions.onSelfManumit}
            onSend={actions.onSendPost}
            onTransfer={actions.onTransfer}
            // --- PASSAGE DES ACTIONS VIA LE HOOK ---
            onProposeDebt={actions.onProposeDebt}
            onSignDebt={actions.onSignDebt}
            onPayDebt={actions.onPayDebt}
            onCancelDebt={actions.onCancelDebt}
            // ---------------------------------------
            onBuyItem={actions.onBuyItem}
            onGiveItem={actions.onGiveItem}
            notify={notify}
            isGraded={canAccessAdmin}
            onSwitchBack={() => setIsViewingAsCitizen(false)}
          />
        ) : (
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
                    onUpdateCitizen={actions.onUpdateCitizen} // --- MODIFICATION ICI ---
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
                    onUpdateCitizen={(id, newCountryId, newRegion) => {
                      const newCitizens = state.citizens.map((c) =>
                        c.id === id
                          ? {
                              ...c,
                              countryId: newCountryId,
                              currentPosition: newRegion || c.currentPosition,
                            }
                          : c
                      );
                      saveState({ ...state, citizens: newCitizens });
                    }}
                  />
                )}

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
