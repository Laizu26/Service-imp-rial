import React, { useState, useMemo, useCallback, useEffect, useRef, Suspense, lazy } from "react";
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
  User,
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
  Hash,
  X,
  Flag,
  GraduationCap,
} from "lucide-react";

// Hooks & Lib
import { useAuth } from "./hooks/useAuth";
import { useGameEngine } from "./hooks/useGameEngine";
import { useGameActions } from "./hooks/useGameActions";
import { ROLES, DEFAULT_RACE_CONFIG, MUSHTAGRAM_REPORT_REASONS } from "./lib/constants";
import { applyEntryFee } from "./lib/travelUtils";
import { ageToBirthDate } from "./lib/gameUtils";
import { useSettings } from "./hooks/useSettings";
import { useVersionCheck } from "./hooks/useVersionCheck";
import { usePushNotifications } from "./hooks/usePushNotifications";

// UI Components
import Toast from "./components/ui/Toast";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import UpdateBanner from "./components/ui/UpdateBanner";
import SettingsPanel from "./components/ui/SettingsPanel";
import NotificationCenter from "./components/ui/NotificationCenter";
import { useNotifications } from "./hooks/useNotifications";

// Views — chargées à la demande (code splitting) : chaque vue admin/citoyenne devient son
// propre chunk JS, téléchargé seulement quand l'onglet correspondant s'affiche. Seuls
// BootIntro/LoginScreen/DeathScreen restent en import statique (nécessaires dès le premier rendu).
import BootIntro from "./components/views/BootIntro";
import LoginScreen from "./components/views/LoginScreen";
import DeathScreen from "./components/views/DeathScreen";
const DashboardView = lazy(() => import("./components/views/DashboardView"));
const GeopoliticsView = lazy(() => import("./components/views/GeopoliticsView"));
const RegistryView = lazy(() => import("./components/views/RegistryView"));
const BankView = lazy(() => import("./components/views/BankView"));
const InventoryView = lazy(() => import("./components/views/InventoryView"));
const PostView = lazy(() => import("./components/views/PostView"));
const MushtagramView = lazy(() => import("./components/views/MushtagramView"));
const EspionageView = lazy(() => import("./components/views/EspionageView"));
const PostOfficeView = lazy(() => import("./components/views/PostOfficeView"));
const CompaniesAdminView = lazy(() => import("./components/views/CompaniesAdminView"));
const MaisonDeAsiaAdmin = lazy(() => import("./components/views/MaisonDeAsiaAdmin"));
const LibraryAdminView = lazy(() => import("./components/views/LibraryAdminView"));
const CombatAdminView = lazy(() => import("./components/views/CombatAdminView"));
const GuardAdminView = lazy(() => import("./components/views/GuardAdminView"));
const JobsAdminView = lazy(() => import("./components/views/JobsAdminView"));
const FamiliesAdminView = lazy(() => import("./components/views/FamiliesAdminView"));
const GazetteAdminView = lazy(() => import("./components/views/GazetteAdminView"));
const BourseView = lazy(() => import("./components/views/BourseView"));
const PropertiesAdminView = lazy(() => import("./components/views/PropertiesAdminView"));
const TribunalAdminView = lazy(() => import("./components/views/TribunalAdminView"));
const GameMasterView = lazy(() => import("./components/views/GameMasterView"));
const CitizenLayout = lazy(() => import("./components/layout/CitizenLayout"));
const PostalCheckModal = lazy(() => import("./components/views/PostalCheckModal"));
const CharacterCreationView = lazy(() => import("./components/views/CharacterCreationView"));
const LinkStartIntro = lazy(() => import("./components/views/LinkStartIntro"));

// Affiché pendant le téléchargement du chunk JS d'une vue chargée à la demande (voir les
// imports lazy() ci-dessus) — le temps que ça dure est négligeable une fois la vue en cache.
const AppLoadingScreen = () => (
  <div className="fixed inset-0 z-[250] flex items-center justify-center bg-stone-950">
    <div className="flex flex-col items-center gap-3">
      <Crown size={28} className="text-yellow-600 animate-pulse" />
      <div className="w-24 h-0.5 bg-stone-800 overflow-hidden rounded-full">
        <div className="h-full w-1/3 bg-yellow-600 rounded-full animate-[loading-bar_1.1s_ease-in-out_infinite]" />
      </div>
    </div>
    <style>{`@keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }`}</style>
  </div>
);

const sha256 = async (str) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const ADMIN_CATEGORIES = [
  { id: "gouvernance", label: "Gouvernance", tabs: ["dashboard", "country"] },
  { id: "information", label: "Information", tabs: ["gazette_admin", "library_admin"] },
  { id: "social",      label: "Social & Registre", tabs: ["registry", "mushtagram"] },
  { id: "economie",    label: "Économie", tabs: ["bank", "items", "post", "bourse_admin", "companies_admin", "postoffice", "asia_admin", "properties_admin"] },
  { id: "ordre",       label: "Ordre & Combat", tabs: ["combat_admin", "guard_admin", "espionage", "jobs_admin", "tribunal_admin"] },
  { id: "social2",     label: "Société", tabs: ["families_admin", "erudit_admin"] },
];

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

  const { state, saveState, saveStateAppend, syncStatus, connection, dbError, forceInit } =
    useGameEngine(firebaseUser, notify);

  const actions = useGameActions(session, state, saveState, notify, saveStateAppend);

  const { settings, isDark, updateSetting, resetSettings } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const updateAvailable = useVersionCheck();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isViewingAsCitizen, setIsViewingAsCitizen] = useState(false);
  const [adminAccountMenuOpen, setAdminAccountMenuOpen] = useState(false);
  // Suivi du check postal : stocke l'id du citoyen ayant confirmé sa position dans cette session
  const [postalCheckUserId, setPostalCheckUserId] = useState(null);

  // --- Cinématique de démarrage (jouée une fois à chaque rechargement de page) ---
  const [showBootIntro, setShowBootIntro] = useState(true);

  // --- Création de personnage (auto-inscription depuis l'écran de connexion) ---
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [linkStartActive, setLinkStartActive] = useState(false);

  const handleCreateCharacter = async (data) => {
    const safeCitizens = state.citizens || [];
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    if (safeCitizens.find((c) => c.name?.toLowerCase() === fullName.toLowerCase())) {
      notify("Ce nom de personnage existe déjà, choisis-en un autre.", "error");
      return;
    }
    const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
    const birthDate = ageToBirthDate(data.age, gd);
    const num = String(safeCitizens.length + 1).padStart(3, "0");
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
    const newId = `EMP-${num}-${rand}`;
    const newCitizen = {
      id: newId, firstName: data.firstName, lastName: data.lastName, name: fullName,
      birthDate, role: "CITOYEN", countryId: data.countryId, locationCountryId: data.countryId,
      password: data.password, balance: 100,
      occupation: "Citoyen", status: "Actif",
      sexe: data.sexe, race: data.race,
      power: data.power, physicalDescription: data.physicalDescription,
      bio: data.story, avatarUrl: data.avatarUrl,
      inventory: [], messages: [],
      currentPosition: "", motto: "", title: "", religion: "", origin: "",
    };
    const newCitizens = [...safeCitizens, newCitizen];
    saveState({ ...state, citizens: newCitizens });
    const ok = await loginGame({ u: newId, p: data.password }, newCitizens);
    if (ok) {
      setShowCharacterCreation(false);
      setLinkStartActive(true);
    }
  };

  // --- Game Master ---
  const [gmStep, setGmStep] = useState(null); // null | 'choice' | 'password'
  const [gmAction, setGmAction] = useState(null); // null | 'gm' | 'boost'
  const [gmMode, setGmMode] = useState(false);
  const [gmInput, setGmInput] = useState("");
  const [gmError, setGmError] = useState("");
  const [gmConfirm, setGmConfirm] = useState("");
  const [gmTempBoost, setGmTempBoost] = useState(null); // { citizenId, expiresAt } | null
  const gmIsSetup = !!state.gmHash;

  const [hiddenAdminTabs, setHiddenAdminTabs] = useState([]);
  const [collapsedAdminCats, setCollapsedAdminCats] = useState(new Set());

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

  // No-op sur le web — n'enregistre l'appareil pour les notifications push que dans l'app
  // Android/iOS empaquetée avec Capacitor.
  usePushNotifications(session?.id, actions.onRegisterPushToken);

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
    { debtRegistry: state.debtRegistry || [], gazette: state.gazette || [], postalAlerts: state.postalAlerts || [], mushtagramNotifs: state.mushtagramNotifs || [], propertyAlerts: state.propertyAlerts || [], bourseAlerts: state.bourseAlerts || [], staffLoanAlerts: state.staffLoanAlerts || [], magicBondAlerts: state.magicBondAlerts || [], coupleGifts: state.coupleGifts || {}, coupleGoals: state.coupleGoals || {} },
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
    tabs.push({ id: "mushtagram", label: "Mushtagram", icon: Hash });
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

    if (effectiveLevel >= 50) {
      tabs.push({ id: "asia_admin", label: "Maison Asia", icon: Gem });
    }

    if (effectiveLevel >= 20 || effectiveScope === "LOCAL")
      tabs.push({ id: "erudit_admin", label: "Érudits", icon: Library });

    return tabs;
  }, [roleInfo, effectiveLevel, effectiveScope]);

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

        {updateAvailable && <UpdateBanner />}

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

        {/* --- Cinématique de démarrage (au-dessus de tout, révèle l'écran de connexion en fondu) --- */}
        {showBootIntro && (
          <BootIntro
            connectedAccounts={connectedAccounts}
            onFinished={() => setShowBootIntro(false)}
          />
        )}

        {/* --- Game Master View (plein écran) --- */}
        <Suspense fallback={<AppLoadingScreen />}>
        {gmMode ? (
          <GameMasterView
            state={state}
            onUpdateState={saveState}
            notify={notify}
            onClose={() => setGmMode(false)}
            session={currentUser}
          />
        ) : linkStartActive ? (
          <LinkStartIntro onFinished={() => setLinkStartActive(false)} />
        ) : !session && showCharacterCreation ? (
          <CharacterCreationView
            state={state}
            onCreateCharacter={handleCreateCharacter}
            notify={notify}
            onBack={() => setShowCharacterCreation(false)}
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
            onCreateCharacter={() => setShowCharacterCreation(true)}
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
            updateAvailable={updateAvailable}
            users={state.citizens || []}
            companies={state.companies || []}
            houseRegistry={state.maisonRegistry || []}
            maisonStaff={state.maisonStaff || []}
            onBookMaison={actions.onBookMaison}
            countries={state.countries || []}
            travelRequests={state.travelRequests || []}
            onRequestTravel={actions.onRequestTravel}
            onCancelTravelRequest={actions.onCancelTravelRequest}
            onInternalTravel={actions.onInternalTravel}
            onSetCityPosition={actions.onSetCityPosition}
            onSetCountryPosition={actions.onSetCountryPosition}
            onSetRegionPosition={actions.onSetRegionPosition}
            onSetBuildingPosition={actions.onSetBuildingPosition}
            catalog={state.inventoryCatalog || []}
            raceConfig={state.raceConfig}
            globalLedger={state.globalLedger || []}
            debtRegistry={state.debtRegistry || []}
            gazette={state.gazette || []}
            families={state.families || []}
            onGuardIssueOrder={actions.onGuardIssueOrder}
            onGuardUpdateMember={actions.onGuardUpdateMember}
            onGuardCompleteOrder={actions.onGuardCompleteOrder}
            onGuardImprison={actions.onGuardImprison}
            onGuardRelease={actions.onGuardRelease}
            onGuardApply={actions.onGuardApply}
            onGuardWithdrawApplication={actions.onGuardWithdrawApplication}
            onGuardAcceptApplication={actions.onGuardAcceptApplication}
            onGuardRejectApplication={actions.onGuardRejectApplication}
            onGuardLeave={actions.onGuardLeave}
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
            bagueCost={state.bagueCost}
            eruditRequests={state.eruditRequests || []}
            onRequestEruditValidation={actions.onRequestEruditValidation}
            onRequestEruditTitle={actions.onRequestEruditTitle}
            eruditResearch={state.eruditResearch || []}
            onSaveEruditResearch={actions.onSaveEruditResearch}
            onPublishEruditResearch={actions.onPublishEruditResearch}
            onUnpublishEruditResearch={actions.onUnpublishEruditResearch}
            onDeleteEruditResearch={actions.onDeleteEruditResearch}
            onWithdrawEruditFromCountry={actions.onWithdrawEruditFromCountry}
            onSetEruditResearchAccess={actions.onSetEruditResearchAccess}
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
            onSetEmployeeSerfRights={actions.onSetEmployeeSerfRights}
            onSetSelfRights={actions.onSetSelfRights}
            onSetMyMorale={actions.onSetMyMorale}
            illnessConfig={state.illnessConfig}
            careRequests={state.careRequests || []}
            onSetApothecaryOffer={actions.onSetApothecaryOffer}
            onRequestTreatment={actions.onRequestTreatment}
            onCancelTreatmentRequest={actions.onCancelTreatmentRequest}
            onRespondTreatmentRequest={actions.onRespondTreatmentRequest}
            onSelfTreat={actions.onSelfTreat}
            onUpdateEmployeeContract={actions.onUpdateEmployeeContract}
            onApplyToCompany={actions.onApplyToCompany}
            onRespondApplication={actions.onRespondApplication}
            onUpdateEmployeeProfile={actions.onUpdateEmployeeProfile}
            onCompanyInventoryAdd={actions.onCompanyInventoryAdd}
            onCompanyInventoryRemove={actions.onCompanyInventoryRemove}
            onCreateCompanyEvent={actions.onCreateCompanyEvent}
            onDeleteCompanyEvent={actions.onDeleteCompanyEvent}
            onCreateSubcontract={actions.onCreateSubcontract}
            staffLoans={state.staffLoans || []}
            onCreateStaffLoan={actions.onCreateStaffLoan}
            onEndStaffLoan={actions.onEndStaffLoan}
            onSetStaffLoanPermissions={actions.onSetStaffLoanPermissions}
            onAppointCEO={actions.onAppointCEO}
            onRevokeCEO={actions.onRevokeCEO}
            onAssignEmployeeToProperty={actions.onAssignEmployeeToProperty}
            propertyAlerts={state.propertyAlerts || []}
            bourseAlerts={state.bourseAlerts || []}
            staffLoanAlerts={state.staffLoanAlerts || []}
            magicBondAlerts={state.magicBondAlerts || []}
            healthAlerts={state.healthAlerts || []}
            companyAlerts={state.companyAlerts || []}
            postalAlerts={state.postalAlerts || []}
            guildAlerts={state.guildAlerts || []}
            contractAlerts={state.contractAlerts || []}
            guardAlerts={state.guardAlerts || []}
            onAcknowledgeMagicBondAlert={actions.onAcknowledgeMagicBondAlert}
            coupleGifts={state.coupleGifts || {}}
            coupleGoals={state.coupleGoals || {}}
            coupleJournals={state.coupleJournals || {}}
            onSendCoupleGift={actions.onSendCoupleGift}
            onSetCoupleGoal={actions.onSetCoupleGoal}
            onContributeToCoupleGoal={actions.onContributeToCoupleGoal}
            onWithdrawCoupleGoal={actions.onWithdrawCoupleGoal}
            onCancelCoupleGoal={actions.onCancelCoupleGoal}
            onAddCoupleJournalEntry={actions.onAddCoupleJournalEntry}
            onDeleteCoupleJournalEntry={actions.onDeleteCoupleJournalEntry}
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
            onGrantFreeMenuItem={actions.onGrantFreeMenuItem}
            onGrantFreePass={actions.onGrantFreePass}
            onRevokeFreePass={actions.onRevokeFreePass}
            onPayRound={actions.onPayRound}
            onLeaveDailyRound={actions.onLeaveDailyRound}
            onCreateTavernPoll={actions.onCreateTavernPoll}
            onVoteTavernPoll={actions.onVoteTavernPoll}
            onCloseTavernPoll={actions.onCloseTavernPoll}
            onBuyFromShop={actions.onBuyFromShop}
            onAddPropertyStaff={actions.onAddPropertyStaff}
            onRemovePropertyStaff={actions.onRemovePropertyStaff}
            onUpdatePropertyStaff={actions.onUpdatePropertyStaff}
            onAddPropertyGuest={actions.onAddPropertyGuest}
            onRemovePropertyGuest={actions.onRemovePropertyGuest}
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
            onCancelMarriageProposal={actions.onCancelMarriageProposal}
            onCounterProposeMarriage={actions.onCounterProposeMarriage}
            onDivorce={actions.onDivorce}
            onDeclareChild={actions.onDeclareChild}
            onRemoveChild={actions.onRemoveChild}
            onConvertChildToCitizen={actions.onConvertChildToCitizen}
            onUpdateChildInfo={actions.onUpdateChildInfo}
            onSetChildGuardianship={actions.onSetChildGuardianship}
            onSetChildRights={actions.onSetChildRights}
            onGuardianProposeMarriage={actions.onGuardianProposeMarriage}
            onGuardianAcceptMarriage={actions.onGuardianAcceptMarriage}
            onGuardianRejectMarriage={actions.onGuardianRejectMarriage}
            onSetParents={actions.onSetParents}
            onProposeAdoption={actions.onProposeAdoption}
            onAcceptParentRequest={actions.onAcceptParentRequest}
            onRejectParentRequest={actions.onRejectParentRequest}
            sharedAccounts={state.sharedAccounts || {}}
            onSharedAccountDeposit={actions.onSharedAccountDeposit}
            onSharedAccountWithdraw={actions.onSharedAccountWithdraw}
            onSetSpouseRights={actions.onSetSpouseRights}
            onWithdrawSpouseSalary={actions.onWithdrawSpouseSalary}
            onProposeMarriageDominance={actions.onProposeMarriageDominance}
            onAcceptMarriageDominance={actions.onAcceptMarriageDominance}
            onRejectMarriageDominance={actions.onRejectMarriageDominance}
            onRequisitionSpouseMoney={actions.onRequisitionSpouseMoney}
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
            onApplyToGuild={actions.onApplyToGuild}
            onCancelGuildApplication={actions.onCancelGuildApplication}
            onRespondGuildApplication={actions.onRespondGuildApplication}
            onLeaveGuild={actions.onLeaveGuild}
            onKickGuildMember={actions.onKickGuildMember}
            onSetGuildMemberRank={actions.onSetGuildMemberRank}
            onTransferGuildLeadership={actions.onTransferGuildLeadership}
            onGuildDeposit={actions.onGuildDeposit}
            onGuildWithdraw={actions.onGuildWithdraw}
            onPostGuildBulletin={actions.onPostGuildBulletin}
            onDeleteGuildBulletin={actions.onDeleteGuildBulletin}
            onDissolveGuild={actions.onDissolveGuild}
            onSetFamilyHead={actions.onSetFamilyHead}
            bourseListings={state.bourseListings || []}
            onBoursePlaceOrder={actions.onBoursePlaceOrder}
            onBourseCancelOrder={actions.onBourseCancelOrder}
            onBourseCompanyOffer={actions.onBourseCompanyOffer}
            onBourseDirectOffer={actions.onBourseDirectOffer}
            onBourseCreateListing={actions.onBourseCreateListing}
            onBourseEditListing={actions.onBourseEditListing}
            onBoursePayDividends={actions.onBoursePayDividends}
            boardProposals={state.boardProposals || []}
            dayCycle={state.dayCycle || 0}
            onCreateBoardProposal={actions.onCreateBoardProposal}
            onCastBoardVote={actions.onCastBoardVote}
            onCancelBoardProposal={actions.onCancelBoardProposal}
            onUpdateCompanyESPP={actions.onUpdateCompanyESPP}
            onEmployeeBuyShares={actions.onEmployeeBuyShares}
            onPayBuyout={actions.onPayBuyout}
            onClaimCorvee={actions.onClaimCorvee}
            onSetCompanyMushtagramAccess={actions.onSetCompanyMushtagramAccess}
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
            onCounterProposeContract={actions.onCounterProposeContract}
            trials={state.trials || []}
            bookmarks={currentUser?.bookmarks}
            onBookmarksChange={handleBookmarksChange}
            onDismissedChange={handleDismissedChange}
            mushtagramPosts={state.mushtagramPosts || []}
            mushtagramDMs={state.mushtagramDMs || []}
            mushtagramStories={state.mushtagramStories || []}
            mushtagramNotifs={state.mushtagramNotifs || []}
            mushtagramSubscriptions={state.mushtagramSubscriptions || []}
            companies={state.companies || []}
            onPostMushtagram={actions.onPostMushtagram}
            onDeleteMushtagramPost={actions.onDeleteMushtagramPost}
            onEditMushtagramPost={actions.onEditMushtagramPost}
            onToggleMushtagramLike={actions.onToggleMushtagramLike}
            onAddMushtagramComment={actions.onAddMushtagramComment}
            onDeleteMushtagramComment={actions.onDeleteMushtagramComment}
            onLikeMushtagramComment={actions.onLikeMushtagramComment}
            onPinMushtagramComment={actions.onPinMushtagramComment}
            onUpdateMushtagramProfile={actions.onUpdateMushtagramProfile}
            onUpdateEntityMushtagramProfile={actions.onUpdateEntityMushtagramProfile}
            onSendMushtagramDM={actions.onSendMushtagramDM}
            onMarkMushtagramDMsRead={actions.onMarkMushtagramDMsRead}
            onFollowMushtagram={actions.onFollowMushtagram}
            onUnfollowMushtagram={actions.onUnfollowMushtagram}
            onReactMushtagram={actions.onReactMushtagram}
            onRepostMushtagram={actions.onRepostMushtagram}
            onVoteMushtagramPoll={actions.onVoteMushtagramPoll}
            onPinMushtagramPost={actions.onPinMushtagramPost}
            onReportMushtagramPost={actions.onReportMushtagramPost}
            onReportMushtagramComment={actions.onReportMushtagramComment}
            onPostMushtagramStory={actions.onPostMushtagramStory}
            onDeleteMushtagramStory={actions.onDeleteMushtagramStory}
            onLikeMushtagramStory={actions.onLikeMushtagramStory}
            onUpdateMushtagramSettings={actions.onUpdateMushtagramSettings}
            onRequestPublicPersonality={actions.onRequestPublicPersonality}
            onMarkMushtagramNotifsRead={actions.onMarkMushtagramNotifsRead}
            onBroadcastMushtagram={actions.onBroadcastMushtagram}
            onUpdateMushtagramMonetization={actions.onUpdateMushtagramMonetization}
            onSubscribeMushtagramCreator={actions.onSubscribeMushtagramCreator}
            onUnsubscribeMushtagramCreator={actions.onUnsubscribeMushtagramCreator}
            onUnlockMushtagramPost={actions.onUnlockMushtagramPost}
            onToggleMushtagramMute={actions.onToggleMushtagramMute}
            onTipMushtagramCreator={actions.onTipMushtagramCreator}
            onMarkMushtagramFeedSeen={actions.onMarkMushtagramFeedSeen}
            onDeleteMushtagramDM={actions.onDeleteMushtagramDM}
            onHideMushtagramDM={actions.onHideMushtagramDM}
            mushtagramGroups={state.mushtagramGroups || []}
            onCreateMushtagramGroup={actions.onCreateMushtagramGroup}
            onUpdateMushtagramGroup={actions.onUpdateMushtagramGroup}
            onAddMushtagramGroupMember={actions.onAddMushtagramGroupMember}
            onLeaveMushtagramGroup={actions.onLeaveMushtagramGroup}
            onSendMushtagramGroupDM={actions.onSendMushtagramGroupDM}
            onMarkMushtagramGroupDMsRead={actions.onMarkMushtagramGroupDMsRead}
            onSetMushtagramNickname={actions.onSetMushtagramNickname}
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

              <nav className="flex-1 p-4 md:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent space-y-1">
                {ADMIN_CATEGORIES.map(cat => {
                  const catTabs = availableTabs.filter(t =>
                    cat.tabs.includes(t.id) && !hiddenAdminTabs.includes(t.id)
                  );
                  if (catTabs.length === 0) return null;
                  const isCollapsed = collapsedAdminCats.has(cat.id);
                  return (
                    <div key={cat.id} className="mb-1">
                      {/* En-tête catégorie */}
                      <button
                        onClick={() => setCollapsedAdminCats(prev => {
                          const next = new Set(prev);
                          isCollapsed ? next.delete(cat.id) : next.add(cat.id);
                          return next;
                        })}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-800/50 transition-colors group"
                      >
                        <div className="flex-1 h-px bg-stone-700/50" />
                        <span className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-500 group-hover:text-stone-400 whitespace-nowrap">{cat.label}</span>
                        <div className="flex-1 h-px bg-stone-700/50" />
                        {isCollapsed ? <ChevronDown size={10} className="text-stone-600 shrink-0" /> : <ChevronUp size={10} className="text-stone-600 shrink-0" />}
                      </button>
                      {/* Onglets */}
                      {!isCollapsed && (
                        <div className="space-y-0.5">
                          {catTabs.map(t => (
                            <div key={t.id} className="relative group/admintab">
                              <button
                                onClick={() => { setActiveTab(t.id); if (window.innerWidth < 768) setSidebarOpen(false); }}
                                className={`w-full text-left p-3 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-4 transition-all duration-300 group pr-8 ${
                                  activeTab === t.id
                                    ? "bg-[#e6dcc3] text-stone-900 shadow-[0_4px_15px_rgba(0,0,0,0.3)] translate-x-2"
                                    : "text-stone-400 hover:bg-stone-900/50 hover:text-stone-100 hover:translate-x-1"
                                }`}
                              >
                                <t.icon size={16} className={`transition-colors shrink-0 ${activeTab === t.id ? "text-stone-900" : "text-stone-500 group-hover:text-stone-300"}`} />
                                {t.label}
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); setHiddenAdminTabs(prev => [...prev, t.id]); if (activeTab === t.id) setActiveTab("dashboard"); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/admintab:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded hover:bg-stone-700 text-stone-500 hover:text-stone-200 z-10"
                                title={`Fermer ${t.label}`}
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Onglets hors catégories (non listés dans ADMIN_CATEGORIES) */}
                {availableTabs.filter(t => !ADMIN_CATEGORIES.flatMap(c => c.tabs).includes(t.id) && !hiddenAdminTabs.includes(t.id)).map(t => (
                  <div key={t.id} className="relative group/admintab">
                    <button
                      onClick={() => { setActiveTab(t.id); if (window.innerWidth < 768) setSidebarOpen(false); }}
                      className={`w-full text-left p-3 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-4 transition-all duration-300 group pr-8 ${
                        activeTab === t.id
                          ? "bg-[#e6dcc3] text-stone-900 shadow-[0_4px_15px_rgba(0,0,0,0.3)] translate-x-2"
                          : "text-stone-400 hover:bg-stone-900/50 hover:text-stone-100 hover:translate-x-1"
                      }`}
                    >
                      <t.icon size={16} className={`shrink-0 ${activeTab === t.id ? "text-stone-900" : "text-stone-500 group-hover:text-stone-300"}`} />
                      {t.label}
                    </button>
                  </div>
                ))}
                {/* Restaurer onglets masqués */}
                {hiddenAdminTabs.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-stone-800">
                    <div className="text-[8px] font-black uppercase tracking-widest text-stone-600 px-2 mb-1">{hiddenAdminTabs.length} masqué{hiddenAdminTabs.length > 1 ? "s" : ""}</div>
                    {availableTabs.filter(t => hiddenAdminTabs.includes(t.id)).map(t => (
                      <button key={t.id} onClick={() => setHiddenAdminTabs(prev => prev.filter(id => id !== t.id))}
                        className="w-full text-left p-2 rounded-lg text-[10px] text-stone-600 hover:text-stone-300 hover:bg-stone-800 flex items-center gap-3 transition-colors">
                        <t.icon size={13} />
                        {t.label}
                        <span className="ml-auto text-[8px] text-stone-500">↩ Restaurer</span>
                      </button>
                    ))}
                  </div>
                )}
              </nav>

              <div className="p-4 md:p-6 border-t border-stone-900 space-y-3 bg-stone-950 shrink-0">
                <div className="bg-stone-900 rounded-xl border border-stone-700 shadow-lg overflow-hidden">
                  <button
                    onClick={() =>
                      setAdminAccountMenuOpen(!adminAccountMenuOpen)
                    }
                    className={`w-full p-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest transition-all ${
                      adminAccountMenuOpen
                        ? "bg-stone-700 text-white"
                        : "text-stone-300 hover:bg-stone-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-yellow-600" />
                      Comptes ({connectedAccounts.length})
                    </div>
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-200 ${adminAccountMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {adminAccountMenuOpen && (
                    <div className="border-t border-stone-800 bg-stone-950 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="max-h-64 overflow-y-auto scrollbar-hide">
                        {connectedAccounts.length > 0 ? (
                          connectedAccounts.map((acc) => (
                            <div
                              key={acc.id}
                              className="flex items-center group hover:bg-stone-800 transition-colors border-b border-stone-900 last:border-0 relative"
                            >
                              <button
                                onClick={() => switchAccount(acc.id)}
                                className="flex-1 text-left px-4 py-3 flex items-center gap-3 w-full"
                              >
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border-2 shrink-0 ${
                                    acc.id === session.id ? "border-yellow-500" : "border-stone-600"
                                  }`}
                                  style={{ width: 36, height: 36, minWidth: 36, minHeight: 36 }}
                                >
                                  {acc.avatarUrl ? (
                                    <img src={acc.avatarUrl} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <User size={16} className="text-stone-400" />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className={`text-xs font-bold truncate ${acc.id === session.id ? "text-yellow-500" : "text-stone-200"}`}>
                                    {acc.name}
                                  </span>
                                  <span className="text-[9px] text-stone-500 font-mono truncate">{acc.role || "Citoyen"}</span>
                                </div>
                                {acc.id === session.id && (
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full ml-auto shrink-0 shadow-[0_0_10px_#eab308]"></div>
                                )}
                              </button>
                              {acc.id !== session.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    logoutAccount(acc.id);
                                  }}
                                  className="p-3 text-stone-600 hover:text-red-500 hover:bg-stone-950/50 transition-colors absolute right-0 h-full border-l border-stone-900"
                                  title="Oublier ce compte"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-stone-500 text-xs italic">Aucun autre compte.</div>
                        )}
                      </div>
                      <button
                        onClick={addAccount}
                        className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-green-500 hover:bg-stone-800 hover:text-green-400 flex items-center justify-center gap-2 border-t border-stone-800 transition-colors bg-stone-900"
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

              <main className="flex-1 p-4 md:p-6 overflow-hidden relative z-10">
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
                        onSetBagueCost={actions.onSetBagueCost}
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
                      onGuardAcceptApplication={actions.onGuardAcceptApplication}
                      onGuardRejectApplication={actions.onGuardRejectApplication}
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
                      combatEffects={state.combatEffects || []}
                      onSaveCombatStats={actions.onSaveCombatStats}
                      onCreateCombatSession={actions.onCreateCombatSession}
                      onUpdateCombatSession={actions.onUpdateCombatSession}
                      onDeleteCombatSession={actions.onDeleteCombatSession}
                      onSaveCombatEffect={actions.onSaveCombatEffect}
                      onDeleteCombatEffect={actions.onDeleteCombatEffect}
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
                      bourseListings={state.bourseListings || []}
                      session={session}
                      roleInfo={roleInfo}
                      gameDate={state.gameDate || { day: 1, month: 1, year: 1200 }}
                      races={state.raceConfig?.races?.length ? state.raceConfig.races : DEFAULT_RACE_CONFIG.races}
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
                  {activeTab === "mushtagram" && (
                    <div className="space-y-4">
                      {/* Admin panel: gestion Personnalité Publique (demandes + liste des accordées) */}
                      {(() => {
                        const pending = (state.citizens || []).filter(c => c.mushtagramPublicPersonality === "pending");
                        const approved = (state.citizens || []).filter(c => c.mushtagramPublicPersonality === "approved" || c.mushtagramPublicPersonality === true);
                        return (
                          <div className="bg-[#fdf6e3] rounded-2xl border border-amber-300 shadow p-5 space-y-5">
                            <div className="flex items-center gap-2">
                              <Crown size={18} className="text-amber-500" />
                              <h3 className="text-sm font-black uppercase tracking-widest text-stone-800">Personnalité Publique</h3>
                            </div>

                            <div className="space-y-2">
                              <div className="text-[10px] font-black uppercase tracking-widest text-stone-500">Demandes en attente ({pending.length})</div>
                              {pending.length === 0 ? (
                                <p className="text-xs text-stone-400 italic">Aucune demande en attente.</p>
                              ) : pending.map(c => (
                                <div key={c.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-sm">
                                  <div>
                                    <div className="font-bold text-stone-800 text-sm">{c.name}</div>
                                    {c.mushtagramHandle && <div className="text-[10px] text-stone-400">@{c.mushtagramHandle}</div>}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => actions.onRejectPublicPersonality(c.id)}
                                      className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-600 text-xs font-black rounded-lg transition-colors">
                                      Refuser
                                    </button>
                                    <button
                                      onClick={() => actions.onApprovePublicPersonality(c.id)}
                                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-lg transition-colors">
                                      Valider
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="space-y-2 pt-3 border-t border-amber-200/60">
                              <div className="text-[10px] font-black uppercase tracking-widest text-stone-500">Personnalités publiques actuelles ({approved.length})</div>
                              {approved.length === 0 ? (
                                <p className="text-xs text-stone-400 italic">Aucune personnalité publique reconnue pour l'instant.</p>
                              ) : approved.map(c => (
                                <div key={c.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-sm">
                                  <div>
                                    <div className="font-bold text-stone-800 text-sm">{c.name}</div>
                                    {c.mushtagramHandle && <div className="text-[10px] text-stone-400">@{c.mushtagramHandle}</div>}
                                  </div>
                                  <button
                                    onClick={() => actions.onRevokePublicPersonality(c.id)}
                                    className="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-black rounded-lg transition-colors">
                                    Révoquer
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                      {/* Admin panel: reported content moderation queue (posts + comments) */}
                      {(() => {
                        const reasonLabel = id => MUSHTAGRAM_REPORT_REASONS.find(r => r.id === id)?.label || id || "Non précisé";
                        const reportedPosts = (state.mushtagramPosts || [])
                          .filter(p => (p.reports || []).length > 0)
                          .map(p => ({ type: "post", key: `post-${p.id}`, post: p, reports: p.reports || [] }));
                        const reportedComments = (state.mushtagramPosts || []).flatMap(p =>
                          (p.comments || [])
                            .filter(c => (c.reports || []).length > 0)
                            .map(c => ({ type: "comment", key: `comment-${p.id}-${c.id}`, post: p, comment: c, reports: c.reports || [] }))
                        );
                        const allReported = [...reportedPosts, ...reportedComments].sort((a, b) => b.reports.length - a.reports.length);
                        if (allReported.length === 0) return null;
                        return (
                          <div className="bg-[#fdf6e3] rounded-2xl border border-red-300 shadow p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <Flag size={18} className="text-red-500" />
                              <h3 className="text-sm font-black uppercase tracking-widest text-stone-800">Contenu signalé</h3>
                              <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{allReported.length}</span>
                            </div>
                            <div className="space-y-2">
                              {allReported.map(item => {
                                const { type, post, comment, reports } = item;
                                const reasonCounts = {};
                                reports.forEach(r => { reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1; });
                                return (
                                  <div key={item.key} className="bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-sm">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[8px] font-black uppercase bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
                                          {type === "post" ? "Publication" : "Commentaire"}
                                        </span>
                                        <div className="font-bold text-stone-800 text-sm">{type === "post" ? post.authorName : comment.authorName}</div>
                                      </div>
                                      <span className="text-[9px] font-black bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full shrink-0">
                                        {reports.length} signalement{reports.length > 1 ? "s" : ""}
                                      </span>
                                    </div>
                                    <p className="text-xs text-stone-500 italic line-clamp-2 mb-2">
                                      {(type === "post" ? post.content : comment.content) || "(sans texte)"}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {Object.entries(reasonCounts).map(([reason, count]) => (
                                        <span key={reason} className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                          {reasonLabel(reason)} × {count}
                                        </span>
                                      ))}
                                    </div>
                                    <div className="text-[9px] text-stone-400 mb-2 space-y-0.5">
                                      {reports.map(r => (
                                        <div key={r.id}>
                                          <strong className="text-stone-500">{r.citizenName || "Anonyme"}</strong> — {reasonLabel(r.reason)}
                                          {r.note && <span className="italic"> : « {r.note} »</span>}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        onClick={() => type === "post"
                                          ? actions.onDismissMushtagramReport(post.id)
                                          : actions.onDismissMushtagramCommentReport({ postId: post.id, commentId: comment.id })}
                                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-black uppercase rounded-lg transition-colors">
                                        Ignorer
                                      </button>
                                      <button
                                        onClick={() => type === "post"
                                          ? actions.onDeleteMushtagramPost(post.id)
                                          : actions.onDeleteMushtagramComment({ postId: post.id, commentId: comment.id })}
                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase rounded-lg transition-colors">
                                        Supprimer
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                      <MushtagramView
                        session={currentUser}
                        citizens={state.citizens}
                        companies={state.companies || []}
                        guilds={state.guilds || []}
                        eruditRequests={state.eruditRequests || []}
                        gameDate={state.gameDate || { day: 1, month: 1, year: 1200 }}
                        mushtagramPosts={state.mushtagramPosts || []}
                        mushtagramDMs={state.mushtagramDMs || []}
                        mushtagramStories={state.mushtagramStories || []}
                        mushtagramNotifs={state.mushtagramNotifs || []}
                        mushtagramSubscriptions={state.mushtagramSubscriptions || []}
                        onPostMushtagram={actions.onPostMushtagram}
                        onDeleteMushtagramPost={actions.onDeleteMushtagramPost}
                        onEditMushtagramPost={actions.onEditMushtagramPost}
                        onToggleMushtagramLike={actions.onToggleMushtagramLike}
                        onAddMushtagramComment={actions.onAddMushtagramComment}
                        onDeleteMushtagramComment={actions.onDeleteMushtagramComment}
                        onLikeMushtagramComment={actions.onLikeMushtagramComment}
                        onUpdateMushtagramProfile={actions.onUpdateMushtagramProfile}
                        onUpdateEntityMushtagramProfile={actions.onUpdateEntityMushtagramProfile}
                        onSendMushtagramDM={actions.onSendMushtagramDM}
                        onMarkMushtagramDMsRead={actions.onMarkMushtagramDMsRead}
                        onFollowMushtagram={actions.onFollowMushtagram}
                        onUnfollowMushtagram={actions.onUnfollowMushtagram}
                        onReactMushtagram={actions.onReactMushtagram}
                        onRepostMushtagram={actions.onRepostMushtagram}
                        onVoteMushtagramPoll={actions.onVoteMushtagramPoll}
                        onPinMushtagramPost={actions.onPinMushtagramPost}
                        onReportMushtagramPost={actions.onReportMushtagramPost}
                        onReportMushtagramComment={actions.onReportMushtagramComment}
                        onPostMushtagramStory={actions.onPostMushtagramStory}
                        onDeleteMushtagramStory={actions.onDeleteMushtagramStory}
                        onLikeMushtagramStory={actions.onLikeMushtagramStory}
                        onUpdateMushtagramSettings={actions.onUpdateMushtagramSettings}
                        onRequestPublicPersonality={actions.onRequestPublicPersonality}
                        onMarkMushtagramNotifsRead={actions.onMarkMushtagramNotifsRead}
                        onBroadcastMushtagram={actions.onBroadcastMushtagram}
                        onUpdateMushtagramMonetization={actions.onUpdateMushtagramMonetization}
                        onSubscribeMushtagramCreator={actions.onSubscribeMushtagramCreator}
                        onUnsubscribeMushtagramCreator={actions.onUnsubscribeMushtagramCreator}
                        onUnlockMushtagramPost={actions.onUnlockMushtagramPost}
                        onToggleMushtagramMute={actions.onToggleMushtagramMute}
                        onTipMushtagramCreator={actions.onTipMushtagramCreator}
                        onMarkMushtagramFeedSeen={actions.onMarkMushtagramFeedSeen}
                        onDeleteMushtagramDM={actions.onDeleteMushtagramDM}
                        onHideMushtagramDM={actions.onHideMushtagramDM}
                        mushtagramGroups={state.mushtagramGroups || []}
                        onCreateMushtagramGroup={actions.onCreateMushtagramGroup}
                        onUpdateMushtagramGroup={actions.onUpdateMushtagramGroup}
                        onAddMushtagramGroupMember={actions.onAddMushtagramGroupMember}
                        onLeaveMushtagramGroup={actions.onLeaveMushtagramGroup}
                        onSendMushtagramGroupDM={actions.onSendMushtagramGroupDM}
                        onMarkMushtagramGroupDMsRead={actions.onMarkMushtagramGroupDMsRead}
                        onSetMushtagramNickname={actions.onSetMushtagramNickname}
                        notify={notify}
                      />
                    </div>
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
                      onApprovePendingChild={actions.onApprovePendingChild}
                      onRejectPendingChild={actions.onRejectPendingChild}
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
                      onBourseCompanyOffer={actions.onBourseCompanyOffer}
                      onBourseCancelOrder={actions.onBourseCancelOrder}
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
                      onCancelPropertySale={actions.onCancelPropertySale}
                      onCancelPropertyRental={actions.onCancelPropertyRental}
                      onEvictTenant={actions.onEvictTenant}
                      onAddPropertyStaff={actions.onAddPropertyStaff}
                      onRemovePropertyStaff={actions.onRemovePropertyStaff}
                      onAddGarrison={actions.onAddGarrison}
                      onRemoveGarrison={actions.onRemoveGarrison}
                      onReleasePrisoner={actions.onReleasePrisoner}
                      onCheckoutRoom={actions.onCheckoutRoom}
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
                    const pendingTitles = effectiveScope === "GLOBAL" ? (state.citizens || []).filter((c) => c.eruditTitleStatus === "pending") : [];
                    return (
                      <div className="space-y-6 animate-in fade-in">
                        {pendingTitles.length > 0 && (
                          <div className="bg-[#fdf6e3] rounded-2xl border border-purple-300 shadow p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <GraduationCap size={20} className="text-purple-600" />
                              <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-stone-800 font-serif">Demandes de titre d'Érudit</h3>
                                <p className="text-xs text-stone-500">Titre additif — n'affecte pas le rôle/fonction actuel du citoyen</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {pendingTitles.map((c) => (
                                <div key={c.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-sm">
                                  <div>
                                    <div className="font-bold text-stone-800 text-sm">{c.name}</div>
                                    <div className="text-[10px] text-stone-400">{ROLES[c.role]?.label || c.role}</div>
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                    <button
                                      onClick={() => actions.onApproveEruditTitle(c.id)}
                                      className="bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                                    >
                                      ✓ Accorder
                                    </button>
                                    <button
                                      onClick={() => actions.onRejectEruditTitle(c.id)}
                                      className="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                                    >
                                      ✕ Refuser
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
                                  {(() => {
                                    const salary = (state.countries || []).find((c) => c.id === req.countryId)?.laws?.eruditSalary || 0;
                                    return salary > 0 ? (
                                      <div className="text-[10px] text-purple-600 font-bold mt-0.5">Rémunération : {salary} écus / jour</div>
                                    ) : null;
                                  })()}
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
                                {done.map((req) => {
                                  const statusColors = {
                                    APPROVED: "bg-green-50 border-green-200",
                                    REJECTED: "bg-red-50 border-red-200",
                                    EXPELLED: "bg-orange-50 border-orange-200",
                                    WITHDRAWN: "bg-stone-50 border-stone-200",
                                  };
                                  const badgeColors = {
                                    APPROVED: "bg-green-100 text-green-700 border-green-300",
                                    REJECTED: "bg-red-100 text-red-700 border-red-300",
                                    EXPELLED: "bg-orange-100 text-orange-700 border-orange-300",
                                    WITHDRAWN: "bg-stone-100 text-stone-500 border-stone-300",
                                  };
                                  const statusLabel = {
                                    APPROVED: "✓ Validé", REJECTED: "✕ Refusé", EXPELLED: "⛔ Radié", WITHDRAWN: "Retiré",
                                  };
                                  return (
                                    <div key={req.id} className={`border rounded-xl p-4 flex items-center gap-4 ${statusColors[req.status] || "bg-stone-50 border-stone-200"}`}>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-black text-stone-800">{req.citizenName}</div>
                                        <div className="text-xs text-stone-500 mt-0.5">
                                          {req.countryName} · {req.responseDate || req.expelledDate || req.withdrawnDate} · {req.respondedBy || req.expelledBy || ""}
                                        </div>
                                        {req.expelNote && <div className="text-[10px] text-orange-600 mt-0.5">Motif : {req.expelNote}</div>}
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border ${badgeColors[req.status] || "bg-stone-100 text-stone-500 border-stone-300"}`}>
                                          {statusLabel[req.status] || req.status}
                                        </span>
                                        {req.status === "APPROVED" && (
                                          <button
                                            onClick={() => {
                                              const note = window.prompt(`Motif de radiation de ${req.citizenName} (optionnel) :`);
                                              if (note !== null) actions.onExpelErudit(req.id, note);
                                            }}
                                            className="text-[9px] font-black uppercase px-2 py-1.5 rounded-lg bg-orange-700 hover:bg-orange-600 text-white transition-colors"
                                          >
                                            Radier
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
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
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
