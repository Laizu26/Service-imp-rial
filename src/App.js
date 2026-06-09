import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
  Users,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Briefcase,
  Library, // <--- 1. ICÔNE AJOUTÉE
  Settings,
  Key,
  HeartHandshake,
  MapPin,
  Scale,
  TrendingUp,
  Newspaper,
  Swords,
} from "lucide-react";

// Hooks & Lib
import { useAuth } from "./hooks/useAuth";
import { useGameEngine } from "./hooks/useGameEngine";
import { useGameActions } from "./hooks/useGameActions";
import { ROLES } from "./lib/constants";
import { applyEntryFee } from "./lib/travelUtils";
import { useSettings } from "./hooks/useSettings";

// UI Components
import Toast from "./components/ui/Toast";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import SettingsPanel from "./components/ui/SettingsPanel";
import NotificationCenter from "./components/ui/NotificationCenter";
import { useNotifications } from "./hooks/useNotifications";

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
import CompaniesAdminView from "./components/views/CompaniesAdminView";
import MaisonDeAsiaAdmin from "./components/views/MaisonDeAsiaAdmin";
import LibraryAdminView from "./components/views/LibraryAdminView"; // <--- 2. IMPORT VIEW ADMIN
import CombatAdminView from "./components/views/CombatAdminView";
import GuardAdminView from "./components/views/GuardAdminView";
import JobsAdminView from "./components/views/JobsAdminView";
import FamiliesAdminView from "./components/views/FamiliesAdminView";
import GazetteAdminView from "./components/views/GazetteAdminView";
import BourseView from "./components/views/BourseView";
import PropertiesAdminView from "./components/views/PropertiesAdminView";
import TribunalAdminView from "./components/views/TribunalAdminView";
import GameMasterView from "./components/views/GameMasterView";
import CitizenLayout from "./components/layout/CitizenLayout";
import PostalCheckModal from "./components/views/PostalCheckModal";

const sha256 = async (str) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

export default function App() {
  const [toast, setToast] = useState({ msg: null, type: "info" });
  const notify = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: null, type: "info" }), 3000);
  }, []);

  const {
    firebaseUser,
    session,
    authLoading,
    loginGame,
    connectedAccounts,
    switchAccount,
    addAccount,
    logoutAccount,
  } = useAuth(notify);

  const { state, saveState, syncStatus, connection, dbError, forceInit } =
    useGameEngine(firebaseUser, notify);

  const actions = useGameActions(session, state, saveState, notify);

  const { settings, isDark, updateSetting, resetSettings } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isViewingAsCitizen, setIsViewingAsCitizen] = useState(false);
  const [adminAccountMenuOpen, setAdminAccountMenuOpen] = useState(false);
  // Suivi du check postal : stocke l'id du citoyen ayant confirmé sa position dans cette session
  const [postalCheckUserId, setPostalCheckUserId] = useState(null);

  // --- Game Master ---
  const [gmStep, setGmStep] = useState(null); // null | 'choice' | 'password'
  const [gmAction, setGmAction] = useState(null); // null | 'gm' | 'boost'
  const [gmMode, setGmMode] = useState(false);
  const [gmInput, setGmInput] = useState("");
  const [gmError, setGmError] = useState("");
  const [gmConfirm, setGmConfirm] = useState("");
  const [gmTempBoost, setGmTempBoost] = useState(null); // { citizenId, expiresAt } | null
  const gmIsSetup = !!state.gmHash;

  // Auto-expiry du boost exceptionnel (5 minutes)
  useEffect(() => {
    if (!gmTempBoost) return;
    const remaining = gmTempBoost.expiresAt - Date.now();
    if (remaining <= 0) { setGmTempBoost(null); return; }
    const t = setTimeout(() => setGmTempBoost(null), remaining);
    return () => clearTimeout(t);
  }, [gmTempBoost]);

  const triggerGmModal = useCallback(() => {
    setGmStep("choice");
    setGmInput("");
    setGmConfirm("");
    setGmError("");
    setGmAction(null);
  }, []);

  const handleGmSubmit = async () => {
    const applyAction = (currentGmAction) => {
      if (currentGmAction === "gm") {
        setGmMode(true);
        notify("Accès Game Master activé.", "success");
      } else if (currentGmAction === "boost" && session?.id) {
        setGmTempBoost({ citizenId: session.id, expiresAt: Date.now() + 5 * 60 * 1000 });
        // Silencieux côté joueur — pas de notify visible
      }
      setGmStep(null);
      setGmAction(null);
      setGmInput("");
      setGmConfirm("");
      setGmError("");
    };

    if (!gmIsSetup) {
      if (gmInput.length < 4) { setGmError("Au moins 4 caractères."); return; }
      if (gmInput !== gmConfirm) { setGmError("Les mots de passe ne correspondent pas."); return; }
      saveState({ ...state, gmHash: await sha256(gmInput) });
      notify("Mot de passe GM enregistré.", "success");
      applyAction(gmAction);
    } else {
      // Accepte SHA-256 (nouveau) ou btoa (migration anciens GM)
      const inputHash = await sha256(gmInput);
      if (inputHash === state.gmHash || btoa(gmInput) === state.gmHash) {
        // Si c'est encore en btoa, on migre vers SHA-256 silencieusement
        if (btoa(gmInput) === state.gmHash) {
          saveState({ ...state, gmHash: inputHash });
        }
        applyAction(gmAction);
      } else {
        setGmError("Mot de passe incorrect.");
      }
    }
  };

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

  // Callback partagé : persiste les IDs rejetés dans le citoyen Firestore
  const handleDismissedChange = useCallback((ids) => {
    if (!currentUser) return;
    actions.onUpdateCitizen({ ...currentUser, dismissedNotifs: ids });
  }, [currentUser, actions]);

  const { grouped: adminGrouped, unreadCount: adminUnreadCount, dismiss: adminDismiss, dismissAll: adminDismissAll } = useNotifications(
    currentUser,
    state.citizens || [],
    { debtRegistry: state.debtRegistry || [], gazette: state.gazette || [], postalAlerts: state.postalAlerts || [] },
    undefined,
    undefined,
    handleDismissedChange
  );

  // Callback signets → Firestore
  const handleBookmarksChange = useCallback((arr) => {
    if (!currentUser) return;
    actions.onUpdateCitizen({ ...currentUser, bookmarks: arr });
  }, [currentUser, actions]);

  // ── Sync paramètres UI ↔ Firestore ──────────────────────────────────────
  const settingsLoadedForUser = useRef(null);
  const settingsSaveTimer = useRef(null);

  // Refs toujours à jour pour éviter les closures périmées dans le setTimeout
  const currentUserRef = useRef(currentUser);
  const actionsRef = useRef(actions);
  const settingsRef = useRef(settings);
  useEffect(() => { currentUserRef.current = currentUser; });
  useEffect(() => { actionsRef.current = actions; });
  useEffect(() => { settingsRef.current = settings; });

  // Chargement cloud → local (une fois par compte, après que currentUser soit défini)
  useEffect(() => {
    if (!currentUser?.id || settingsLoadedForUser.current === currentUser.id) return;
    settingsLoadedForUser.current = currentUser.id;
    if (currentUser.uiSettings) {
      Object.entries(currentUser.uiSettings).forEach(([k, v]) => updateSetting(k, v));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Sauvegarde local → cloud (débounce 2s) — utilise les refs pour toujours
  // opérer sur l'état le plus récent et éviter d'écraser des données fraîches
  useEffect(() => {
    if (!currentUser?.id || settingsLoadedForUser.current !== currentUser.id) return;
    if (JSON.stringify(settings) === JSON.stringify(currentUser.uiSettings || {})) return;
    clearTimeout(settingsSaveTimer.current);
    settingsSaveTimer.current = setTimeout(() => {
      const cu = currentUserRef.current;
      if (!cu?.id) return;
      actionsRef.current.onUpdateCitizen({ ...cu, uiSettings: settingsRef.current });
    }, 2000);
    return () => clearTimeout(settingsSaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);
  // ────────────────────────────────────────────────────────────────────────

  const currentStatus = currentUser?.status || "Actif";
  const isDead = currentStatus === "Décédé";
  const isSlave = currentStatus === "Esclave";
  const isBanned = currentStatus === "Banni";
  const isPrisoner = currentStatus === "Prisonnier";

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

  // Boost exceptionnel GM : toutes permissions déverrouillées pendant 5 min
  const gmBoostActive = !!(
    gmTempBoost &&
    session &&
    gmTempBoost.citizenId === session.id &&
    Date.now() < gmTempBoost.expiresAt
  );

  const isActuallyGraded = roleInfo.level >= 20;
  const slaveGradeBlocked = isSlave && currentUser?.permissions?.grade === false;
  const canAccessAdmin = (isActuallyGraded && !isIncapacitated && !slaveGradeBlocked) || gmBoostActive;
  const shouldShowCitizenView = !canAccessAdmin || isViewingAsCitizen;

  // Niveau effectif : le boost donne accès total (level 100, scope GLOBAL)
  const effectiveLevel = gmBoostActive ? 100 : roleInfo.level;
  const effectiveScope = gmBoostActive ? "GLOBAL" : roleInfo.scope;

  const availableTabs = useMemo(() => {
    const tabs = [];
    if (effectiveLevel >= 90 || effectiveScope === "LOCAL")
      tabs.push({
        id: "dashboard",
        label: effectiveScope === "GLOBAL" ? "Grand Empire" : "Gouvernance",
        icon: Crown,
      });
    tabs.push({ id: "country", label: "Atlas", icon: Globe });
    if (effectiveLevel >= 30 || effectiveScope === "LOCAL")
      tabs.push({ id: "gazette_admin", label: "Gazette", icon: Newspaper });

    // --- 3. AJOUT DE L'ONGLET BIBLIOTHÈQUE ---
    if (effectiveLevel >= 40) {
      tabs.push({
        id: "library_admin",
        label: "Bibliothèque",
        icon: Library,
      });
    }
    // ----------------------------------------

    tabs.push({ id: "combat_admin", label: "Combat", icon: Swords });
    tabs.push({ id: "registry", label: "Registre", icon: Scroll });
    tabs.push({ id: "items", label: "Objets", icon: Box });
    tabs.push({ id: "bank", label: "Banque", icon: Coins });
    tabs.push({ id: "post", label: "Poste", icon: Mail });
    if (effectiveLevel >= 40)
      tabs.push({ id: "guard_admin", label: "Garde", icon: Shield });
    if (effectiveLevel >= 40)
      tabs.push({ id: "espionage", label: "Cabinet Noir", icon: EyeOff });
    if (effectiveLevel >= 40)
      tabs.push({ id: "jobs_admin", label: "Emplois", icon: Briefcase });
    if (effectiveLevel >= 40)
      tabs.push({ id: "families_admin", label: "Familles", icon: HeartHandshake });
    if (effectiveLevel >= 40)
      tabs.push({ id: "bourse_admin", label: "Bourse", icon: TrendingUp });
    if (effectiveLevel >= 20 || roleInfo.role === "POSTIERE")
      tabs.push({ id: "postoffice", label: "Bureau Visas", icon: Stamp });

    if (effectiveLevel >= 50) {
      tabs.push({
        id: "companies_admin",
        label: "Entreprises",
        icon: Briefcase,
      });
    }

    if (effectiveLevel >= 40)
      tabs.push({ id: "properties_admin", label: "Immobilier", icon: MapPin });
    if (effectiveLevel >= 30)
      tabs.push({ id: "tribunal_admin", label: "Tribunal", icon: Scale });

    if (effectiveLevel >= 50 || (session && session.role === "TENANCIER")) {
      tabs.push({ id: "asia_admin", label: "Maison Asia", icon: Gem });
    }

    if (effectiveLevel >= 20 || effectiveScope === "LOCAL")
      tabs.push({ id: "erudit_admin", label: "Érudits", icon: Library });

    return tabs;
  }, [roleInfo, session, effectiveLevel, effectiveScope]);

  if (session && isDead)
    return <DeathScreen onLogout={() => logoutAccount(session.id)} />;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-stone-900 font-sans text-stone-900">
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast({ ...toast, msg: null })}
        />

        {settingsOpen && (
          <SettingsPanel
            settings={settings}
            isDark={isDark}
            updateSetting={updateSetting}
            resetSettings={resetSettings}
            onClose={() => setSettingsOpen(false)}
          />
        )}

        {/* --- Game Master : Choix d'action --- */}
        {gmStep === "choice" && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-stone-950 border border-stone-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="bg-stone-900 border-b border-stone-800 p-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-900/30 border border-red-800/50 flex items-center justify-center">
                  <Shield size={18} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-red-400">Accès Game Master</h2>
                  <div className="text-[9px] text-stone-500 uppercase tracking-widest">Que souhaitez-vous faire ?</div>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <button
                  onClick={() => { setGmMode(true); setGmStep(null); notify("Accès Game Master activé.", "success"); }}
                  className="w-full flex items-start gap-4 p-4 bg-stone-900 border border-stone-700 hover:border-red-800/50 rounded-xl transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-red-900/20 border border-red-800/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-red-900/40 transition-all">
                    <Shield size={18} className="text-red-400" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-stone-200">Interface GM</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">Ouvrir le panneau Maître du Jeu complet</div>
                  </div>
                </button>
                {session && (
                  <button
                    onClick={() => { setGmAction("boost"); setGmStep("password"); }}
                    className="w-full flex items-start gap-4 p-4 bg-stone-900 border border-stone-700 hover:border-amber-800/50 rounded-xl transition-all group text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-900/20 border border-amber-800/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-900/40 transition-all">
                      <Key size={18} className="text-amber-400" />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-stone-200">Droits Exceptionnels</div>
                      <div className="text-[10px] text-stone-500 mt-0.5">Accorder un accès maximal temporaire (5 min)</div>
                    </div>
                  </button>
                )}
                <button
                  onClick={() => setGmStep(null)}
                  className="w-full py-2.5 bg-stone-900 text-stone-500 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-stone-800 hover:text-stone-300 transition-all border border-stone-800"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Game Master : Saisie du mot de passe --- */}
        {gmStep === "password" && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-stone-950 border border-stone-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="bg-stone-900 border-b border-stone-800 p-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-900/30 border border-red-800/50 flex items-center justify-center">
                  <Key size={18} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-red-400">
                    {gmIsSetup ? "Accès Restreint" : "Initialisation"}
                  </h2>
                  <div className="text-[9px] text-stone-500 uppercase tracking-widest">
                    {gmAction === "boost" ? "Confirmer : droits exceptionnels" : gmIsSetup ? "Entrez le mot de passe GM" : "Créez votre mot de passe GM"}
                  </div>
                </div>
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); handleGmSubmit(); }}
                className="p-5 space-y-4"
              >
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">
                    {gmIsSetup ? "Mot de passe" : "Nouveau mot de passe"}
                  </label>
                  <input
                    type="password"
                    value={gmInput}
                    onChange={(e) => { setGmInput(e.target.value); setGmError(""); }}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50 transition-colors"
                    placeholder="••••••••"
                    autoFocus
                  />
                </div>
                {!gmIsSetup && (
                  <div>
                    <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Confirmer</label>
                    <input
                      type="password"
                      value={gmConfirm}
                      onChange={(e) => { setGmConfirm(e.target.value); setGmError(""); }}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-red-500/50 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                )}
                {gmError && (
                  <div className="text-red-400 text-[10px] font-bold bg-red-900/20 border border-red-900/30 rounded-lg p-2 text-center">
                    {gmError}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGmStep("choice")}
                    className="flex-1 py-2.5 bg-stone-800 text-stone-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-stone-700 transition-all"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-red-900/50 border border-red-800/50 text-red-300 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-900/70 transition-all"
                  >
                    {gmIsSetup ? "Confirmer" : "Créer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- Game Master View (plein écran) --- */}
        {gmMode ? (
          <GameMasterView
            state={state}
            onUpdateState={saveState}
            notify={notify}
            onClose={() => setGmMode(false)}
            session={currentUser}
          />
        ) : !session ? (
          <LoginScreen
            onLogin={loginGame}
            users={state.citizens}
            loading={authLoading}
            notify={notify}
            connectedAccounts={connectedAccounts}
            onSwitchAccount={switchAccount}
            onLogoutAccount={logoutAccount}
          />
        ) : (currentUser && postalCheckUserId !== currentUser.id) ? (
          <PostalCheckModal
            user={currentUser}
            countries={state.countries || []}
            onConfirm={(claimedCountryId, claimedRegion, isMismatch) => {
              if (isMismatch) {
                actions.onRecordPostalAlert(
                  currentUser.id,
                  currentUser.name,
                  claimedCountryId,
                  claimedRegion
                );
              }
              setPostalCheckUserId(currentUser.id);
            }}
          />
        ) : shouldShowCitizenView ? (
          <CitizenLayout
            user={gmBoostActive
              ? { ...currentUser, permissions: { bank: true, post: true, travel: true, grade: true } }
              : currentUser}
            users={state.citizens || []}
            companies={state.companies || []}
            houseRegistry={state.maisonRegistry || []}
            maisonStaff={state.maisonStaff || []}
            onBookMaison={actions.onBookMaison}
            countries={state.countries || []}
            travelRequests={state.travelRequests || []}
            onRequestTravel={actions.onRequestTravel}
            onInternalTravel={actions.onInternalTravel}
            catalog={state.inventoryCatalog || []}
            globalLedger={state.globalLedger || []}
            debtRegistry={state.debtRegistry || []}
            gazette={state.gazette || []}
            families={state.families || []}
            onGuardIssueOrder={actions.onGuardIssueOrder}
            onGuardUpdateMember={actions.onGuardUpdateMember}
            onGuardCompleteOrder={actions.onGuardCompleteOrder}
            onGuardImprison={actions.onGuardImprison}
            onGuardRelease={actions.onGuardRelease}
            connectedAccounts={connectedAccounts}
            onSwitchAccount={switchAccount}
            onAddAccount={addAccount}
            onLogoutAccount={logoutAccount}
            onLogout={() => logoutAccount(null)}
            onUpdateUser={actions.onUpdateCitizen}
            onBuySlave={actions.onBuySlave}
            onConfiscateSlaveMoney={actions.onConfiscateSlaveMoney}
            onSelfManumit={actions.onSelfManumit}
            onOwnerProposeMarriage={actions.onOwnerProposeMarriage}
            onOwnerAcceptMarriage={actions.onOwnerAcceptMarriage}
            onOwnerRejectMarriage={actions.onOwnerRejectMarriage}
            onOwnerBreakMarriage={actions.onOwnerBreakMarriage}
            onSend={actions.onSendPost}
            onTransfer={actions.onTransfer}
            onProposeDebt={actions.onProposeDebt}
            onSignDebt={actions.onSignDebt}
            onPayDebt={actions.onPayDebt}
            onCancelDebt={actions.onCancelDebt}
            onBuyItem={actions.onBuyItem}
            onGiveItem={actions.onGiveItem}
            onUseItem={actions.onUseItem}
            onSubscribeBague={actions.onSubscribeBague}
            onUnsubscribeBague={actions.onUnsubscribeBague}
            eruditRequests={state.eruditRequests || []}
            onRequestEruditValidation={actions.onRequestEruditValidation}
            eruditResearch={state.eruditResearch || []}
            onSaveEruditResearch={actions.onSaveEruditResearch}
            onPublishEruditResearch={actions.onPublishEruditResearch}
            onUnpublishEruditResearch={actions.onUnpublishEruditResearch}
            onDeleteEruditResearch={actions.onDeleteEruditResearch}
            combatSessions={state.combatSessions || []}
            notify={notify}
            isGraded={canAccessAdmin}
            isBanned={gmBoostActive ? false : isBanned}
            isPrisoner={gmBoostActive ? false : isPrisoner}
            onSwitchBack={() => setIsViewingAsCitizen(false)}
            onGmTrigger={triggerGmModal}
            gmBoostActive={gmBoostActive}
            gmTempBoost={gmTempBoost}
            gameDate={state.gameDate || { day: 1, month: 1, year: 1200 }}
            settings={settings}
            isDark={isDark}
            updateSetting={updateSetting}
            resetSettings={resetSettings}
            onCompanyTreasury={actions.onCompanyTreasury}
            onWithdrawCompanySalary={actions.onWithdrawCompanySalary}
            onSendJobOffer={actions.onSendJobOffer}
            onRespondJobOffer={actions.onRespondJobOffer}
            onPaySalaries={actions.onPaySalaries}
            onCompanyFire={actions.onCompanyFire}
            onCustomizeCompany={actions.onCustomizeCompany}
            onDeleteCompany={actions.onDeleteCompany}
            onQuitCompany={actions.onQuitCompany}
            jobContracts={state.jobContracts || []}
            onSaveJobContract={actions.onSaveJobContract}
            onDeleteJobContract={actions.onDeleteJobContract}
            onToggleJobContract={actions.onToggleJobContract}
            onPostBulletin={actions.onPostBulletin}
            onDeleteBulletin={actions.onDeleteBulletin}
            onSetEmployeeRank={actions.onSetEmployeeRank}
            onApplyToCompany={actions.onApplyToCompany}
            onRespondApplication={actions.onRespondApplication}
            onUpdateEmployeeProfile={actions.onUpdateEmployeeProfile}
            onCompanyInventoryAdd={actions.onCompanyInventoryAdd}
            onCompanyInventoryRemove={actions.onCompanyInventoryRemove}
            onCreateCompanyEvent={actions.onCreateCompanyEvent}
            onDeleteCompanyEvent={actions.onDeleteCompanyEvent}
            onCreateSubcontract={actions.onCreateSubcontract}
            onAddJournalEntry={actions.onAddJournalEntry}
            onEditJournalEntry={actions.onEditJournalEntry}
            onDeleteJournalEntry={actions.onDeleteJournalEntry}
            onListItemForSale={actions.onListItemForSale}
            onCancelListing={actions.onCancelListing}
            onBuyFromPlayer={actions.onBuyFromPlayer}
            onProposeTrade={actions.onProposeTrade}
            onRespondTrade={actions.onRespondTrade}
            onCancelTrade={actions.onCancelTrade}
            onBuyProperty={actions.onBuyProperty}
            onSellProperty={actions.onSellProperty}
            onCancelPropertySale={actions.onCancelPropertySale}
            onBuyPropertyFromPlayer={actions.onBuyPropertyFromPlayer}
            onListPropertyForRent={actions.onListPropertyForRent}
            onCancelPropertyRental={actions.onCancelPropertyRental}
            onRentProperty={actions.onRentProperty}
            onEvictTenant={actions.onEvictTenant}
            onLeaveTenancy={actions.onLeaveTenancy}
            onToggleFavorite={actions.onToggleFavorite}
            onCompanyBuyProperty={actions.onCompanyBuyProperty}
            onUpdatePropertyFeature={actions.onUpdatePropertyFeature}
            onAddGarrison={actions.onAddGarrison}
            onRemoveGarrison={actions.onRemoveGarrison}
            onImprison={actions.onImprison}
            onReleasePrisoner={actions.onReleasePrisoner}
            onRequestAudience={actions.onRequestAudience}
            onRespondAudience={actions.onRespondAudience}
            onSetupRooms={actions.onSetupRooms}
            onBookRoom={actions.onBookRoom}
            onCheckoutRoom={actions.onCheckoutRoom}
            onPostTavernMessage={actions.onPostTavernMessage}
            onPostRumor={actions.onPostRumor}
            onDeleteRumor={actions.onDeleteRumor}
            onBuyFromMenu={actions.onBuyFromMenu}
            onBuyFromShop={actions.onBuyFromShop}
            onAddPropertyStaff={actions.onAddPropertyStaff}
            onRemovePropertyStaff={actions.onRemovePropertyStaff}
            onAddPropertyEvent={actions.onAddPropertyEvent}
            onRemovePropertyEvent={actions.onRemovePropertyEvent}
            playerMarket={state.playerMarket || []}
            tradeProposals={state.tradeProposals || []}
            properties={state.properties || []}
            onHideMoney={actions.onHideMoney}
            onWithdrawHiddenMoney={actions.onWithdrawHiddenMoney}
            onHiddenTransfer={actions.onHiddenTransfer}
            onDismissSlaveAlert={actions.onDismissSlaveAlert}
            onRestoreHiddenTransfer={actions.onRestoreHiddenTransfer}
            onProposeMarriage={actions.onProposeMarriage}
            onAcceptMarriage={actions.onAcceptMarriage}
            onRejectMarriage={actions.onRejectMarriage}
            onDivorce={actions.onDivorce}
            onDeclareChild={actions.onDeclareChild}
            onRemoveChild={actions.onRemoveChild}
            onSetParents={actions.onSetParents}
            sharedAccounts={state.sharedAccounts || {}}
            onSharedAccountDeposit={actions.onSharedAccountDeposit}
            onSharedAccountWithdraw={actions.onSharedAccountWithdraw}
            maisonQueue={state.maisonQueue || []}
            maisonHistory={state.maisonHistory || []}
            maisonReviews={state.maisonReviews || []}
            maisonDefaultDuration={state.maisonDefaultDuration || 60}
            maisonServiceCategories={state.maisonServiceCategories || []}
            maisonSubscriptions={state.maisonSubscriptions || []}
            maisonSubscriptionPrice={state.maisonSubscriptionPrice || 50}
            onJoinMaisonQueue={actions.onJoinMaisonQueue}
            onLeaveMaisonQueue={actions.onLeaveMaisonQueue}
            onSubmitMaisonReview={actions.onSubmitMaisonReview}
            onBuyMaisonSubscription={actions.onBuyMaisonSubscription}
            guilds={state.guilds || []}
            onCreateGuild={actions.onCreateGuild}
            onEditGuild={actions.onEditGuild}
            onJoinGuild={actions.onJoinGuild}
            onLeaveGuild={actions.onLeaveGuild}
            onKickGuildMember={actions.onKickGuildMember}
            onSetGuildMemberRole={actions.onSetGuildMemberRole}
            onTransferGuildLeadership={actions.onTransferGuildLeadership}
            onGuildDeposit={actions.onGuildDeposit}
            onGuildWithdraw={actions.onGuildWithdraw}
            onDissolveGuild={actions.onDissolveGuild}
            onSetFamilyHead={actions.onSetFamilyHead}
            bourseListings={state.bourseListings || []}
            onBourseBuyShares={actions.onBourseBuyShares}
            onBourseSellShares={actions.onBourseSellShares}
            onBourseCreateListing={actions.onBourseCreateListing}
            onBourseEditListing={actions.onBourseEditListing}
            onBoursePayDividends={actions.onBoursePayDividends}
            onUpdateCompanyESPP={actions.onUpdateCompanyESPP}
            onEmployeeBuyShares={actions.onEmployeeBuyShares}
            onPayBuyout={actions.onPayBuyout}
            onClaimCorvee={actions.onClaimCorvee}
            onFamilyDeposit={actions.onFamilyDeposit}
            onFamilyWithdraw={actions.onFamilyWithdraw}
            onFamilyTreasuryTransfer={actions.onFamilyTreasuryTransfer}
            onEditFamilyInfo={actions.onEditFamilyInfo}
            onTransferFamilyHead={actions.onTransferFamilyHead}
            onSetFamilyRegent={actions.onSetFamilyRegent}
            onRemoveFamilyRegent={actions.onRemoveFamilyRegent}
            contracts={state.contracts || []}
            onCreateContract={actions.onCreateContract}
            onSignContract={actions.onSignContract}
            onCancelContract={actions.onCancelContract}
            onCompleteContract={actions.onCompleteContract}
            onBreachContract={actions.onBreachContract}
            onDeleteContract={actions.onDeleteContract}
            trials={state.trials || []}
            bookmarks={currentUser?.bookmarks}
            onBookmarksChange={handleBookmarksChange}
            onDismissedChange={handleDismissedChange}
          />
        ) : (
          <div className="flex h-screen overflow-hidden bg-[#e6e2d6]">
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
                onClick={() => setSidebarOpen(false)}
              ></div>
            )}

            <div
              className={`fixed inset-y-0 left-0 z-40 w-72 md:w-80 bg-stone-950 text-stone-200 flex flex-col border-r border-stone-800 transition-transform duration-300 shadow-2xl ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              } md:relative md:translate-x-0`}
            >
              <div className="p-6 md:p-8 text-center border-b border-stone-900 bg-stone-900/30 shadow-inner relative shrink-0">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden absolute top-4 left-4 text-stone-500 hover:text-white"
                >
                  <div className="font-bold text-xl">X</div>
                </button>

                <div className="absolute top-4 right-4 flex gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connection === "connected"
                        ? "bg-green-500 shadow-[0_0_10px_#10b981]"
                        : "bg-red-500"
                    }`}
                  />
                </div>
                <button
                  onClick={triggerGmModal}
                  className="mx-auto mb-4 mt-2 md:mt-0 flex items-center justify-center cursor-default hover:opacity-80 transition-opacity focus:outline-none"
                  title=""
                  tabIndex={-1}
                >
                  <Shield
                    className="text-yellow-600 drop-shadow-lg"
                    size={48}
                  />
                </button>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-[0.2em] text-white font-serif">
                  Service Impérial
                </h1>
                <div className="text-[10px] uppercase mt-3 text-stone-500 font-black tracking-[0.4em] border border-stone-800 py-2 rounded-lg px-2 shadow-inner bg-stone-900/50">
                  {roleInfo.label}
                </div>
              </div>

              <nav className="flex-1 p-4 md:p-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
                {availableTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTab(t.id);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`w-full text-left p-4 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-5 transition-all duration-300 group ${
                      activeTab === t.id
                        ? "bg-[#e6dcc3] text-stone-900 shadow-[0_4px_15px_rgba(0,0,0,0.3)] translate-x-2"
                        : "text-stone-400 hover:bg-stone-900/50 hover:text-stone-100 hover:translate-x-1"
                    }`}
                  >
                    <t.icon
                      size={18}
                      className={`transition-colors ${
                        activeTab === t.id
                          ? "text-stone-900"
                          : "text-stone-500 group-hover:text-stone-300"
                      }`}
                    />
                    {t.label}
                  </button>
                ))}
              </nav>

              <div className="p-4 md:p-6 border-t border-stone-900 space-y-3 bg-stone-950 shrink-0">
                <div className="bg-stone-900 rounded-xl border border-stone-800 overflow-hidden">
                  <button
                    onClick={() =>
                      setAdminAccountMenuOpen(!adminAccountMenuOpen)
                    }
                    className="w-full p-3 flex items-center justify-between text-xs font-black uppercase text-stone-400 hover:text-white hover:bg-stone-800 transition-all tracking-widest"
                  >
                    <div className="flex items-center gap-3">
                      <Users size={16} />{" "}
                      <span className="text-[10px]">
                        Comptes ({connectedAccounts.length})
                      </span>
                    </div>
                    {adminAccountMenuOpen ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>

                  {adminAccountMenuOpen && (
                    <div className="bg-stone-950 border-t border-stone-800 max-h-40 overflow-y-auto">
                      {connectedAccounts.map((acc) => (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between group hover:bg-stone-900 pr-2"
                        >
                          <button
                            onClick={() => switchAccount(acc.id)}
                            className={`flex-1 text-left p-3 flex items-center gap-3 transition-all ${
                              acc.id === session.id
                                ? "text-yellow-500 font-bold"
                                : "text-stone-500 hover:text-stone-300"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                acc.id === session.id
                                  ? "bg-yellow-500"
                                  : "bg-stone-600"
                              }`}
                            ></div>
                            <span className="text-[10px] uppercase truncate w-24">
                              {acc.name}
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              logoutAccount(acc.id);
                            }}
                            className="text-stone-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Oublier ce compte"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addAccount}
                        className="w-full p-3 text-[10px] font-bold uppercase text-green-600 hover:text-green-400 hover:bg-stone-900 flex items-center gap-2 border-t border-stone-900 sticky bottom-0 bg-stone-950"
                      >
                        <PlusCircle size={14} /> Ajouter un compte
                      </button>
                    </div>
                  )}
                </div>

                {canAccessAdmin && (
                  <button
                    onClick={() => setIsViewingAsCitizen(true)}
                    className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-stone-900 text-stone-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-stone-800 shadow-lg hover:border-stone-600"
                  >
                    <UserCircle size={18} /> Mode Citoyen
                  </button>
                )}
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="w-full p-3 text-xs font-black uppercase text-stone-500 hover:text-yellow-400 flex items-center gap-3 justify-center transition-all hover:bg-stone-800 rounded-xl tracking-widest"
                >
                  <Settings size={16} /> Paramètres
                </button>
                <button
                  onClick={() => logoutAccount(null)}
                  className="w-full p-3 text-xs font-black uppercase text-stone-500 hover:text-red-400 flex items-center gap-3 justify-center transition-all hover:bg-red-900/10 rounded-xl tracking-widest"
                >
                  <LogOut size={16} /> Déconnexion
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
              <header className="h-16 md:h-20 bg-[#fdf6e3]/95 backdrop-blur border-b border-stone-300 flex items-center px-4 md:px-8 justify-between shadow-sm relative z-20 shrink-0">
                <div className="flex items-center gap-4 md:gap-6">
                  <button
                    className="md:hidden p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-all shadow-sm text-stone-700 dark:text-stone-300"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu size={24} />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[9px] md:text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] md:tracking-[0.4em] mb-1 font-mono">
                      Administration Impériale
                    </span>
                    <div className="text-lg md:text-xl font-black uppercase text-stone-800 dark:text-stone-100 tracking-widest font-serif">
                      {state.gameDate
                        ? `${state.gameDate.day}/${state.gameDate.month}/${state.gameDate.year}`
                        : `Cycle ${state.dayCycle}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest px-3 py-2 md:px-5 md:py-2.5 border-2 border-stone-200 rounded-full bg-white/50 dark:bg-stone-800 dark:border-stone-700 shadow-inner hidden sm:block">
                    Liaison: {syncStatus === "saving" ? "Archivage..." : "Stable"}
                  </div>
                  <NotificationCenter
                    grouped={adminGrouped}
                    unreadCount={adminUnreadCount}
                    onNavigate={(route) => {
                      const adminRoutes = { msg: "post", bank: "bank", gazette: "gazette_admin" };
                      if (adminRoutes[route]) {
                        setActiveTab(adminRoutes[route]);
                      } else {
                        setIsViewingAsCitizen(true);
                      }
                    }}
                    onDismiss={adminDismiss}
                    onDismissAll={adminDismissAll}
                  />
                </div>
              </header>

              <main className="flex-1 p-4 md:p-8 overflow-hidden relative z-10">
                <div className="max-w-[1600px] mx-auto w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-stone-400 dark:scrollbar-thumb-stone-600 scrollbar-track-stone-200 dark:scrollbar-track-stone-900 pb-10">
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

                  {activeTab === "guard_admin" && (
                    <GuardAdminView
                      countries={state.countries}
                      citizens={state.citizens}
                      session={session}
                      roleInfo={roleInfo}
                      onGuardUpdateInfo={actions.onGuardUpdateInfo}
                      onGuardAddRank={actions.onGuardAddRank}
                      onGuardRemoveRank={actions.onGuardRemoveRank}
                      onGuardAddMember={actions.onGuardAddMember}
                      onGuardUpdateMember={actions.onGuardUpdateMember}
                      onGuardRemoveMember={actions.onGuardRemoveMember}
                      onGuardIssueOrder={actions.onGuardIssueOrder}
                      onGuardDeleteOrder={actions.onGuardDeleteOrder}
                      onGuardCompleteOrder={actions.onGuardCompleteOrder}
                      onGuardImprison={actions.onGuardImprison}
                      onGuardRelease={actions.onGuardRelease}
                    />
                  )}

                  {/* --- 4. AFFICHAGE DE LA VUE ADMIN --- */}
                  {activeTab === "library_admin" && (
                    <LibraryAdminView
                      countries={state.countries}
                      onUpdate={(c) => saveState({ ...state, countries: c })}
                    />
                  )}
                  {/* ----------------------------------- */}

                  {activeTab === "combat_admin" && (
                    <CombatAdminView
                      citizens={state.citizens || []}
                      combatSessions={state.combatSessions || []}
                      onSaveCombatStats={actions.onSaveCombatStats}
                      onCreateCombatSession={actions.onCreateCombatSession}
                      onUpdateCombatSession={actions.onUpdateCombatSession}
                      onDeleteCombatSession={actions.onDeleteCombatSession}
                      notify={notify}
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
                      companies={state.companies || []}
                      countries={state.countries || []}
                      citizens={state.citizens || []}
                    />
                  )}
                  {activeTab === "registry" && (
                    <RegistryView
                      citizens={state.citizens}
                      countries={state.countries}
                      catalog={state.inventoryCatalog}
                      families={state.families || []}
                      session={session}
                      roleInfo={roleInfo}
                      gameDate={state.gameDate || { day: 1, month: 1, year: 1200 }}
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
                      companies={state.companies}
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
                      onUpdateCitizen={actions.onUpdateCitizen}
                    />
                  )}
                  {activeTab === "postoffice" && (
                    <PostOfficeView
                      travelRequests={state.travelRequests}
                      countries={state.countries}
                      citizens={state.citizens}
                      session={currentUser}
                      isGlobalScope={effectiveScope === "GLOBAL"}
                      notify={notify}
                      onUpdateRequests={(reqs) =>
                        saveState({ ...state, travelRequests: reqs })
                      }
                      onVisaGranted={(
                        citizenId,
                        toCountryId,
                        region,
                        updatedRequests
                      ) => {
                        // Appliquer les frais de visa (avec réduction bague si applicable)
                        const feeResult = applyEntryFee({ state, citizenId, toCountryId });
                        const baseState = feeResult.ok ? feeResult.state : state;

                        if (feeResult.ok && feeResult.entryFee > 0) {
                          if (feeResult.discountApplied) {
                            notify(`Frais de visa : ${feeResult.entryFee} É (réduction impériale appliquée — ${feeResult.originalFee} É initialement).`, "info");
                          } else {
                            notify(`Frais de visa prélevés : ${feeResult.entryFee} É.`, "info");
                          }
                        }

                        // Le voyage change la LOCALISATION (locationCountryId + currentPosition),
                        // PAS l'allégeance (countryId)
                        const newCitizens = baseState.citizens.map((c) =>
                          c.id === citizenId
                            ? {
                                ...c,
                                locationCountryId: toCountryId,
                                currentPosition: region || c.currentPosition,
                              }
                            : c
                        );
                        saveState({
                          ...baseState,
                          citizens: newCitizens,
                          travelRequests: updatedRequests,
                        });
                      }}
                      onUpdateCitizen={(id, newCountryId, newRegion) => {
                        // Ancien callback — change aussi la localisation, pas l'allégeance
                        const newCitizens = state.citizens.map((c) =>
                          c.id === id
                            ? {
                                ...c,
                                locationCountryId: newCountryId,
                                currentPosition: newRegion || c.currentPosition,
                              }
                            : c
                        );
                        saveState({ ...state, citizens: newCitizens });
                      }}
                    />
                  )}

                  {activeTab === "companies_admin" && (
                    <CompaniesAdminView
                      companies={state.companies}
                      citizens={state.citizens}
                      countries={state.countries}
                      onCreateCompany={actions.onCreateCompany}
                      onDeleteCompany={actions.onDeleteCompany}
                      onEditCompany={actions.onEditCompany}
                    />
                  )}

                  {activeTab === "jobs_admin" && (
                    <JobsAdminView
                      jobs={state.jobContracts || []}
                      citizens={state.citizens || []}
                      countries={state.countries || []}
                      companies={state.companies || []}
                      session={session}
                      roleInfo={roleInfo}
                      onSaveJobContract={actions.onSaveJobContract}
                      onDeleteJobContract={actions.onDeleteJobContract}
                      onToggleJobContract={actions.onToggleJobContract}
                    />
                  )}

                  {activeTab === "families_admin" && (
                    <FamiliesAdminView
                      state={state}
                      onUpdateState={saveState}
                      notify={notify}
                    />
                  )}

                  {activeTab === "gazette_admin" && (
                    <GazetteAdminView
                      state={state}
                      roleInfo={roleInfo}
                      session={session}
                      onUpdateState={saveState}
                      notify={notify}
                    />
                  )}

                  {activeTab === "bourse_admin" && (
                    <BourseView
                      state={state}
                      session={session}
                      companies={state.companies || []}
                      citizens={state.citizens || []}
                      bourseListings={state.bourseListings || []}
                      globalLedger={state.globalLedger || []}
                      onBourseCreateListing={actions.onBourseCreateListing}
                      onBourseEditListing={actions.onBourseEditListing}
                      onBourseDeleteListing={actions.onBourseDeleteListing}
                      onBoursePayDividends={actions.onBoursePayDividends}
                    />
                  )}

                  {activeTab === "properties_admin" && (
                    <PropertiesAdminView
                      properties={state.properties || []}
                      countries={state.countries || []}
                      citizens={state.citizens || []}
                      companies={state.companies || []}
                      onCreateProperty={actions.onCreateProperty}
                      onDeleteProperty={actions.onDeleteProperty}
                      onEditProperty={actions.onEditProperty}
                    />
                  )}

                  {activeTab === "tribunal_admin" && (
                    <TribunalAdminView
                      trials={state.trials || []}
                      citizens={state.citizens || []}
                      onCreateTrial={actions.onCreateTrial}
                      onAssignTrialRole={actions.onAssignTrialRole}
                      onAddTrialArgument={actions.onAddTrialArgument}
                      onRenderVerdict={actions.onRenderVerdict}
                      onDeleteTrial={actions.onDeleteTrial}
                    />
                  )}

                  {activeTab === "asia_admin" && (
                    <MaisonDeAsiaAdmin
                      citizens={state.citizens || []}
                      companies={state.companies || []}
                      countries={state.countries || []}
                      houseRegistry={state.maisonRegistry || []}
                      staff={state.maisonStaff || []}
                      maisonCompanyId={state.maisonCompanyId}
                      maisonQueue={state.maisonQueue || []}
                      maisonHistory={state.maisonHistory || []}
                      maisonReviews={state.maisonReviews || []}
                      maisonDefaultDuration={state.maisonDefaultDuration || 60}
                      maisonServiceCategories={state.maisonServiceCategories || []}
                      maisonSubscriptions={state.maisonSubscriptions || []}
                      maisonSubscriptionPrice={state.maisonSubscriptionPrice || 50}
                      jobs={state.jobContracts || []}
                      session={session}
                      roleInfo={roleInfo}
                      onUpdateRegistry={actions.onUpdateHouseRegistry}
                      onUpdateStaff={actions.onUpdateMaisonStaff}
                      onRemoveStaff={actions.onRemoveMaisonStaff}
                      onPurgeMaison={actions.onPurgeMaison}
                      onSetMaisonCompany={actions.onSetMaisonCompany}
                      onDeleteReview={actions.onDeleteMaisonReview}
                      onSetDefaultDuration={actions.onSetMaisonDefaultDuration}
                      onEvictMaison={actions.onEvictMaison}
                      onSaveJobContract={actions.onSaveJobContract}
                      onDeleteJobContract={actions.onDeleteJobContract}
                      onToggleJobContract={actions.onToggleJobContract}
                      onToggleMaisonStaffAvailability={actions.onToggleMaisonStaffAvailability}
                      onAddMaisonService={actions.onAddMaisonService}
                      onUpdateMaisonService={actions.onUpdateMaisonService}
                      onRemoveMaisonService={actions.onRemoveMaisonService}
                      onSaveMaisonCategory={actions.onSaveMaisonCategory}
                      onDeleteMaisonCategory={actions.onDeleteMaisonCategory}
                      onSetMaisonSubscriptionPrice={actions.onSetMaisonSubscriptionPrice}
                      onAdminRemoveFromQueue={actions.onAdminRemoveFromQueue}
                    />
                  )}
                  {activeTab === "erudit_admin" && (() => {
                    const myCountryId = effectiveScope !== "GLOBAL" ? session?.countryId : null;
                    const allReqs = (state.eruditRequests || []).filter(
                      (r) => !myCountryId || r.countryId === myCountryId
                    );
                    const pending = allReqs.filter((r) => r.status === "PENDING");
                    const done = allReqs.filter((r) => r.status !== "PENDING");
                    return (
                      <div className="space-y-6 animate-in fade-in">
                        <div className="bg-[#fdf6e3] rounded-2xl border border-stone-300 shadow p-6">
                          <div className="flex items-center gap-3 mb-6">
                            <Library size={22} className="text-purple-700" />
                            <div>
                              <h2 className="text-lg font-black uppercase tracking-widest text-stone-800 font-serif">Validations Érudit</h2>
                              <p className="text-xs text-stone-500">Demandes de reconnaissance du statut Érudit dans votre pays</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="text-[10px] font-black uppercase text-stone-500 tracking-widest">
                              En attente ({pending.length})
                            </div>
                            {pending.length === 0 && (
                              <p className="text-stone-400 italic text-sm py-4 text-center">Aucune demande en attente.</p>
                            )}
                            {pending.map((req) => (
                              <div key={req.id} className="bg-white border border-stone-200 rounded-xl p-4 flex items-start gap-4 shadow-sm">
                                <div className="flex-1 min-w-0">
                                  <div className="font-black text-stone-800">{req.citizenName}</div>
                                  <div className="text-xs text-stone-500 mt-0.5">
                                    Pays : <span className="font-bold">{req.countryName}</span>
                                  </div>
                                  <div className="text-[10px] text-stone-400 mt-0.5">Soumis le {req.requestDate}</div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button
                                    onClick={() => actions.onRespondEruditValidation(req.id, true)}
                                    className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                                  >
                                    ✓ Valider
                                  </button>
                                  <button
                                    onClick={() => actions.onRespondEruditValidation(req.id, false)}
                                    className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                                  >
                                    ✕ Refuser
                                  </button>
                                </div>
                              </div>
                            ))}

                            {done.length > 0 && (
                              <>
                                <div className="text-[10px] font-black uppercase text-stone-500 tracking-widest mt-6 pt-4 border-t border-stone-200">
                                  Traitées ({done.length})
                                </div>
                                {done.map((req) => (
                                  <div key={req.id} className={`border rounded-xl p-4 flex items-center gap-4 ${req.status === "APPROVED" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-black text-stone-800">{req.citizenName}</div>
                                      <div className="text-xs text-stone-500 mt-0.5">
                                        {req.countryName} · {req.responseDate} · par {req.respondedBy}
                                      </div>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border shrink-0 ${req.status === "APPROVED" ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300"}`}>
                                      {req.status === "APPROVED" ? "✓ Validé" : "✕ Refusé"}
                                    </span>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </main>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
