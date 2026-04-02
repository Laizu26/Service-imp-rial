import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Shield,
  LogOut,
  Gem,
  Users,
  PlusCircle,
  ChevronDown,
  Trash2,
  Scroll,
  Box,
  Landmark,
  Mail,
  Map,
  Gavel,
  Briefcase,
  Book,
  Settings,
  ShieldAlert,
  Coins,
  Building2,
  MapPin,
  Church,
  Quote,
  Search,
  Eye,
  Heart,
  Zap,
  Bell,
  Crown,
  HeartHandshake,
} from "lucide-react";


import NotificationCenter from "../ui/NotificationCenter";
import { ROLES, MARRIAGE_CONTRACT_TYPES } from "../../lib/constants";
import { getCitizenAge, formatRPDate } from "../../lib/gameUtils";
import { useNotifications } from "../../hooks/useNotifications";

import { getFamilyForCitizen, getFamilyMembers, getFamilyDisplayName, normalizeBranches, getBranchForCitizen } from "../views/FamiliesAdminView";
import PostView from "../views/PostView";
import SlaveManagementView from "../views/SlaveManagementView";
import GazetteView from "../views/GazetteView";
import CitizenBankView from "../views/CitizenBankView";
import CitizenInventoryView from "../views/CitizenInventoryView";
import MaisonDeAsiaCitizen from "../views/MaisonDeAsiaCitizen";
import MyCompanyView from "../views/MyCompanyView";
import SlavePersonalView from "../views/SlavePersonalView";
import NotificationCenterView from "../views/NotificationCenterView";
import LibraryView from "../views/LibraryView";
import CitizenProfileCard from "../views/CitizenProfileCard";
import MarriageView from "../views/MarriageView";
import CitizenPhysicsMagicView from "../views/CitizenPhysicsMagicView";
import GuildsView from "../views/GuildsView";
import ContractsView from "../views/ContractsView";
import PropertyDetailView from "../views/PropertyDetailView";
import SettingsView from "../views/SettingsView";

// Mini-composant trésorerie famille
const FamilyTreasuryActions = ({ familyId, isHead, treasury, userBalance, onDeposit, onWithdraw }) => {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  return (
    <div className="space-y-3">
      {/* Dépôt - tout le monde */}
      <div>
        <div className="text-[9px] text-stone-500 font-bold uppercase mb-1">Déposer des fonds</div>
        <div className="flex gap-2">
          <input type="number" className="flex-1 p-2 border rounded text-sm font-mono" placeholder="Montant" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
          <button
            onClick={() => { if (depositAmount) { onDeposit(familyId, depositAmount); setDepositAmount(""); } }}
            disabled={!depositAmount || parseInt(depositAmount) <= 0 || parseInt(depositAmount) > userBalance}
            className="bg-stone-800 text-yellow-500 px-3 py-2 rounded text-[10px] font-bold uppercase disabled:opacity-40 hover:bg-stone-700 transition-colors"
          >Déposer</button>
        </div>
        <div className="text-[9px] text-stone-400 mt-1">Votre solde : {userBalance.toLocaleString()} Écus</div>
      </div>
      {/* Retrait - chef uniquement */}
      {isHead && (
        <div className="border-t border-stone-100 pt-3">
          <div className="text-[9px] text-amber-600 font-bold uppercase mb-1">Retirer des fonds (chef)</div>
          <div className="flex gap-2">
            <input type="number" className="flex-1 p-2 border rounded text-sm font-mono" placeholder="Montant" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
            <button
              onClick={() => { if (withdrawAmount) { onWithdraw(familyId, withdrawAmount); setWithdrawAmount(""); } }}
              disabled={!withdrawAmount || parseInt(withdrawAmount) <= 0 || parseInt(withdrawAmount) > treasury}
              className="bg-amber-700 text-white px-3 py-2 rounded text-[10px] font-bold uppercase disabled:opacity-40 hover:bg-amber-600 transition-colors"
            >Retirer</button>
          </div>
        </div>
      )}
      {!isHead && (
        <div className="text-[9px] text-stone-400 italic border-t border-stone-100 pt-2">Seul le chef (ou le régent s'il est en exercice) peut retirer des fonds.</div>
      )}
    </div>
  );
};

// Mini-composant gestion chef / régent de famille
const FamilyHeadActions = ({ family, members, user, isHead, isRegent, onEditFamilyInfo, onTransferFamilyHead, onSetFamilyRegent, onRemoveFamilyRegent }) => {
  const [editMotto, setEditMotto] = useState(family.motto || "");
  const [editDesc, setEditDesc] = useState(family.description || "");
  const [transferTo, setTransferTo] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [regentTo, setRegentTo] = useState("");
  const [showRegent, setShowRegent] = useState(false);
  const otherMembers = members.filter((m) => m.id !== user.id);
  const labelColor = isHead ? "text-amber-600" : "text-purple-600";
  const borderColor = isHead ? "border-amber-200" : "border-purple-200";

  return (
    <div className="space-y-3">
      {/* Édition devise / description — chef et régent */}
      <div>
        <div className={`text-[9px] font-bold uppercase mb-1 ${labelColor}`}>Devise familiale</div>
        <input className={`w-full p-2 border rounded text-sm bg-white ${borderColor}`} value={editMotto} onChange={(e) => setEditMotto(e.target.value)} placeholder="Devise..." />
      </div>
      <div>
        <div className={`text-[9px] font-bold uppercase mb-1 ${labelColor}`}>Description</div>
        <textarea className={`w-full p-2 border rounded text-sm bg-white ${borderColor}`} rows={2} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Histoire, réputation..." />
      </div>
      <button
        onClick={() => onEditFamilyInfo(family.id, { motto: editMotto, description: editDesc })}
        className={`w-full ${isHead ? "bg-amber-700 hover:bg-amber-600" : "bg-purple-700 hover:bg-purple-600"} text-white py-2 rounded text-[10px] font-bold uppercase transition-colors`}
      >Sauvegarder</button>

      {/* Gestion du régent — chef et régent */}
      {(isHead || isRegent) && family.type === "noble" && (
        <div className={`border-t pt-3 space-y-2 ${isHead ? "border-amber-200" : "border-purple-200"}`}>
          <div className={`text-[9px] font-bold uppercase ${labelColor}`}>Régent</div>
          {family.regentId ? (
            <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
              <div className="text-sm">
                <span className="font-bold text-purple-700">{family.regentName || "Régent"}</span>
                <span className="text-[9px] text-purple-400 uppercase font-bold ml-2">Régent en exercice</span>
              </div>
            </div>
          ) : !showRegent ? (
            <button onClick={() => setShowRegent(true)} className="text-purple-600 text-[10px] font-bold uppercase underline hover:text-purple-500">
              Nommer un régent
            </button>
          ) : (
            <div className="space-y-2">
              <select className="w-full p-2 border border-purple-200 rounded text-sm bg-white" value={regentTo} onChange={(e) => setRegentTo(e.target.value)}>
                <option value="">-- Choisir un membre --</option>
                {otherMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.firstName ? `${m.firstName} ${m.lastName || ""}`.trim() : m.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => { if (regentTo) { onSetFamilyRegent(family.id, regentTo); setShowRegent(false); setRegentTo(""); } }}
                  disabled={!regentTo}
                  className="flex-1 bg-purple-700 text-white py-2 rounded text-[10px] font-bold uppercase disabled:opacity-40 hover:bg-purple-600"
                >Nommer régent</button>
                <button onClick={() => { setShowRegent(false); setRegentTo(""); }} className="px-3 py-2 bg-stone-200 text-stone-600 rounded text-[10px] font-bold uppercase">Annuler</button>
              </div>
            </div>
          )}
          <div className="text-[9px] text-stone-400 italic">Le régent exerce tous les pouvoirs à la place du chef. Seul un administrateur peut révoquer un régent.</div>
        </div>
      )}

      {/* Transfert de titre — chef et régent */}
      <div className={`border-t pt-3 ${isHead ? "border-amber-200" : "border-purple-200"}`}>
        {!showTransfer ? (
          <button onClick={() => setShowTransfer(true)} className={`text-[10px] font-bold uppercase underline ${isHead ? "text-amber-600 hover:text-amber-500" : "text-purple-600 hover:text-purple-500"}`}>
            Transférer le titre de chef
          </button>
        ) : (
          <div className="space-y-2">
            <div className={`text-[9px] font-bold uppercase ${labelColor}`}>Transférer à :</div>
            <select className={`w-full p-2 border rounded text-sm bg-white ${borderColor}`} value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
              <option value="">-- Choisir un membre --</option>
              {otherMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.firstName ? `${m.firstName} ${m.lastName || ""}`.trim() : m.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => { if (transferTo) { onTransferFamilyHead(family.id, transferTo); setShowTransfer(false); } }}
                disabled={!transferTo}
                className="flex-1 bg-red-600 text-white py-2 rounded text-[10px] font-bold uppercase disabled:opacity-40 hover:bg-red-500"
              >Confirmer le transfert</button>
              <button onClick={() => setShowTransfer(false)} className="px-3 py-2 bg-stone-200 text-stone-600 rounded text-[10px] font-bold uppercase">Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Mini-composant pour la mise en vente avec champ de prix intégré
const SellPropertyButton = ({ propId, onSellProperty }) => {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-stone-500 text-[10px] font-bold uppercase border border-stone-200 px-3 py-1.5 rounded hover:bg-stone-50 transition-colors"
      >
        Mettre en vente
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        className="w-24 p-1.5 border border-stone-300 rounded text-sm font-mono text-center"
        placeholder="Prix"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        autoFocus
      />
      <button
        onClick={() => {
          if (price && parseInt(price) > 0) {
            onSellProperty(propId, parseInt(price));
            setOpen(false);
            setPrice("");
          }
        }}
        disabled={!price || parseInt(price) <= 0}
        className="bg-yellow-500 text-stone-900 text-[10px] font-bold uppercase px-3 py-1.5 rounded hover:bg-yellow-400 disabled:opacity-40 transition-colors"
      >
        Confirmer
      </button>
      <button
        onClick={() => { setOpen(false); setPrice(""); }}
        className="text-stone-400 hover:text-stone-600 text-[10px] font-bold uppercase px-2 py-1.5"
      >
        Annuler
      </button>
    </div>
  );
};

// Mini-composant pour proposer un bien à la location
const RentPropertyButton = ({ propId, onListPropertyForRent }) => {
  const [open, setOpen] = useState(false);
  const [rate, setRate] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-blue-600 text-[10px] font-bold uppercase border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors"
      >
        Proposer en location
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        className="w-24 p-1.5 border border-blue-300 rounded text-sm font-mono text-center"
        placeholder="Écus/jour"
        value={rate}
        onChange={(e) => setRate(e.target.value)}
        autoFocus
      />
      <button
        onClick={() => {
          if (rate && parseInt(rate) > 0) {
            onListPropertyForRent(propId, parseInt(rate));
            setOpen(false);
            setRate("");
          }
        }}
        disabled={!rate || parseInt(rate) <= 0}
        className="bg-blue-500 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded hover:bg-blue-400 disabled:opacity-40 transition-colors"
      >
        Confirmer
      </button>
      <button
        onClick={() => { setOpen(false); setRate(""); }}
        className="text-stone-400 hover:text-stone-600 text-[10px] font-bold uppercase px-2 py-1.5"
      >
        Annuler
      </button>
    </div>
  );
};

const BoostCountdown = ({ expiresAt }) => {
  const [remaining, setRemaining] = useState(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="mt-2 px-3 py-1.5 bg-amber-900/30 border border-amber-800/50 rounded-lg flex items-center gap-2">
      <Zap size={12} className="text-amber-400" />
      <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
        Boost {minutes}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
};

const CitizenLayout = (props) => {
  const {
    user,
    users,
    countries,
    globalLedger,
    debtRegistry,
    catalog,
    gazette,
    onLogout,
    onUpdateUser,
    onSend,
    onRequestTravel,
    onTransfer,
    onProposeDebt,
    onSignDebt,
    onPayDebt,
    onCancelDebt,
    onBuyItem,
    onGiveItem,
    onBuySlave,
    onConfiscateSlaveMoney,
    onSelfManumit,
    notify,
    isGraded,
    onSwitchBack,
    travelRequests,
    houseRegistry,
    maisonStaff = [],
    onBookMaison,
    isBanned,
    isPrisoner,
    connectedAccounts = [],
    onSwitchAccount,
    onAddAccount,
    onLogoutAccount,
    companies = [],
    onCompanyTreasury,
    onWithdrawCompanySalary,
    onSendJobOffer,
    onRespondJobOffer,
    onPaySalaries,
    onCompanyFire,
    onCustomizeCompany,
    onDeleteCompany,
    onQuitCompany,
    jobContracts = [],
    onSaveJobContract,
    onDeleteJobContract,
    onToggleJobContract,
    onPostBulletin,
    onDeleteBulletin,
    onSetEmployeeRank,
    onApplyToCompany,
    onRespondApplication,
    onUpdateEmployeeProfile,
    onCompanyInventoryAdd,
    onCompanyInventoryRemove,
    onCreateCompanyEvent,
    onDeleteCompanyEvent,
    onCreateSubcontract,
    onAddJournalEntry,
    onDeleteJournalEntry,
    onListItemForSale,
    onCancelListing,
    onBuyFromPlayer,
    onProposeTrade,
    onRespondTrade,
    onCancelTrade,
    onBuyProperty,
    onSellProperty,
    onCancelPropertySale,
    onBuyPropertyFromPlayer,
    onListPropertyForRent,
    onCancelPropertyRental,
    onRentProperty,
    onEvictTenant,
    onLeaveTenancy,
    onToggleFavorite,
    onCompanyBuyProperty,
    onUpdatePropertyFeature,
    onAddGarrison, onRemoveGarrison,
    onImprison, onReleasePrisoner,
    onRequestAudience, onRespondAudience,
    onSetupRooms, onBookRoom, onCheckoutRoom,
    onPostTavernMessage, onPostRumor, onDeleteRumor,
    onBuyFromMenu, onBuyFromShop,
    onAddPropertyStaff, onRemovePropertyStaff,
    onAddPropertyEvent, onRemovePropertyEvent,
    playerMarket = [],
    tradeProposals = [],
    properties = [],
    onHideMoney,
    onWithdrawHiddenMoney,
    onHiddenTransfer,
    onDismissSlaveAlert,
    onRestoreHiddenTransfer,
    onProposeMarriage,
    onAcceptMarriage,
    onRejectMarriage,
    onDivorce,
    onDeclareChild,
    onRemoveChild,
    onSetParents,
    sharedAccounts = {},
    onSharedAccountDeposit,
    onSharedAccountWithdraw,
    maisonQueue = [],
    maisonHistory = [],
    maisonReviews = [],
    maisonDefaultDuration = 60,
    onJoinMaisonQueue,
    onLeaveMaisonQueue,
    onSubmitMaisonReview,
    guilds = [],
    onCreateGuild,
    onEditGuild,
    onJoinGuild,
    onLeaveGuild,
    onKickGuildMember,
    onSetGuildMemberRole,
    onTransferGuildLeadership,
    onGuildDeposit,
    onGuildWithdraw,
    onDissolveGuild,
    onSetFamilyHead,
    onFamilyDeposit,
    onFamilyWithdraw,
    onEditFamilyInfo,
    onTransferFamilyHead,
    onSetFamilyRegent,
    onRemoveFamilyRegent,
    contracts = [],
    onCreateContract,
    onSignContract,
    onCancelContract,
    onCompleteContract,
    onBreachContract,
    onDeleteContract,
    trials = [],
    settings,
    isDark,
    updateSetting,
    resetSettings,
    onGmTrigger,
    gmBoostActive = false,
    gmTempBoost = null,
    gameDate,
    families = [],
  } = props;

  const gd = gameDate || { day: 1, month: 1, year: 1200 };

  // --- 1. HOOKS (DOIVENT ÊTRE EN PREMIER) ---
  const [active, setActive] = useState("gazette");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);


  // Formulaires (avec valeurs par défaut vides)
  const [editOccupation, setEditOccupation] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editMotto, setEditMotto] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editReligion, setEditReligion] = useState("");
  const [editOrigin, setEditOrigin] = useState("");
  const [np, setNp] = useState("");
  const [journalEntry, setJournalEntry] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [annuaireSearch, setAnnuaireSearch] = useState("");
  const [annuaireFilter, setAnnuaireFilter] = useState("ALL");
  const [selectedCitizen, setSelectedCitizen] = useState(null);

  const [travelDestCountry, setTravelDestCountry] = useState("");
  const [travelDestRegion, setTravelDestRegion] = useState("");

  // Mise à jour des formulaires une fois que l'user est chargé
  useEffect(() => {
    if (user) {
      setEditOccupation(user.occupation || "");
      setEditBio(user.bio || "");
      setEditAvatar(user.avatarUrl || "");
      setEditMotto(user.motto || "");
      setEditTitle(user.title || "");
      setEditReligion(user.religion || "");
      setEditOrigin(user.origin || "");
    }
  }, [user]);

  // --- CENTRE DE NOTIFICATIONS ---
  const {
    grouped,
    allWithStatus,
    categories: notifCategories,
    unreadCount,
    dismiss,
    dismissAll,
    dismissCategory,
    undismiss,
  } = useNotifications(
    user,
    users,
    { debtRegistry: debtRegistry || [], gazette: gazette || [] },
    settings.notifPrefs,
    gd
  );

  // --- 2. SÉCURITÉ CRITIQUE ---
  // Si user est undefined ou null, on affiche un loader et on ARRÊTE le rendu ici.
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e6e2d6] text-stone-500 font-serif animate-pulse">
        Chargement de l'identité...
      </div>
    );
  }

  // --- 3. VARIABLES CALCULÉES (Sécurisées avec ?.) ---
  // Utilisation de l'opérateur optionnel pour éviter tout crash résiduel
  const isSlave = user?.status === "Esclave";

  const owner =
    isSlave && user?.ownerId
      ? (users || []).find((u) => u.id === user.ownerId)
      : null;

  const permissions = user?.permissions || {};

  const canUsePost = !isSlave || !!permissions.post;
  const canUseBank = !isSlave || !!permissions.bank;
  const canUseTravel = !isSlave || !!permissions.travel;

  // Sécurité sur users
  const safeUsers = Array.isArray(users) ? users : [];
  const mySlaves = safeUsers.filter((u) => u.ownerId === user.id);

  const safeCountries = Array.isArray(countries) ? countries : [];

  // Dérivés mariage
  const currentSpouses = user?.spouses || (user?.spouseId ? [{ id: user.spouseId, name: safeUsers.find(u => u.id === user.spouseId)?.name || "…" }] : []);

  // Sécurité sur travelRequests
  const safeRequests = Array.isArray(travelRequests) ? travelRequests : [];
  const myPendingRequests = safeRequests.filter(
    (r) => r.citizenId === user.id && r.status === "PENDING"
  );

  // Helper: couleur de thème selon le rôle
  const getRoleTheme = (role) => {
    switch (role) {
      case "EMPEREUR":
        return { border: "border-yellow-500", bg: "bg-yellow-50", accent: "text-yellow-700", badge: "bg-yellow-100 text-yellow-800 border-yellow-300" };
      case "ROI":
        return { border: "border-purple-500", bg: "bg-purple-50", accent: "text-purple-700", badge: "bg-purple-100 text-purple-800 border-purple-300" };
      case "GRAND_FONC_GLOBAL":
      case "GRAND_FONC_LOCAL":
        return { border: "border-blue-500", bg: "bg-blue-50", accent: "text-blue-700", badge: "bg-blue-100 text-blue-800 border-blue-300" };
      case "INTENDANT":
        return { border: "border-emerald-500", bg: "bg-emerald-50", accent: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800 border-emerald-300" };
      case "FONCTIONNAIRE":
      case "POSTIERE":
        return { border: "border-sky-500", bg: "bg-sky-50", accent: "text-sky-700", badge: "bg-sky-100 text-sky-800 border-sky-300" };
      default:
        return { border: "border-stone-400", bg: "bg-stone-50", accent: "text-stone-600", badge: "bg-stone-100 text-stone-700 border-stone-300" };
    }
  };

  const theme = getRoleTheme(user.role);
  const roleInfo = ROLES[user.role] || ROLES.CITOYEN;

  // Badges du citoyen
  const safeCompanies = Array.isArray(companies) ? companies : [];
  const ownedCompany = safeCompanies.find((c) => c.ownerId === user.id);
  const employedCompany = safeCompanies.find(
    (c) => (c.employees || []).includes(user.id) || (c.slaves || []).includes(user.id)
  );

  const menuItems = [
    { id: "gazette", label: "Gazette", icon: Scroll },
    { id: "library", label: "Bibliothèque", icon: Book },
    { id: "profil", label: "Mon Registre", icon: User },
    { id: "my_company", label: "Mon Entreprise", icon: Briefcase },
    { id: "inventory", label: "Inventaire", icon: Box },
    canUseBank && { id: "bank", label: "Banque", icon: Landmark },
    !isBanned &&
      canUsePost && { id: "msg", label: "Poste Impériale", icon: Mail },
    !isBanned &&
      !isPrisoner &&
      canUseTravel && { id: "travel", label: "Voyage", icon: Map },
    { id: "asia", label: "Maison Asia", icon: Gem },
    isSlave && { id: "servitude", label: "Ma Servitude", icon: ShieldAlert },
    mySlaves.length > 0 && { id: "slaves", label: "Main d'Œuvre", icon: Gavel },
    !isSlave && { id: "mariage", label: "Mariage & Famille", icon: Heart },
    !isSlave && { id: "famille", label: "Ma Dynastie", icon: HeartHandshake },
    { id: "properties", label: "Propriétés", icon: MapPin },
    { id: "guilds", label: "Guildes", icon: Users },
    { id: "contracts", label: "Contrats", icon: Scroll },
    { id: "annuaire", label: "Annuaire", icon: Eye },
    { id: "physique_magie", label: "Physique & Magie", icon: Zap },
    { id: "notifications", label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`, icon: Bell },
  ].filter(Boolean);

  // --- 4. RENDU ---
  return (
    <div
      className={`flex h-screen font-serif text-stone-200 overflow-hidden ${
        isSlave ? "bg-stone-950" : "bg-stone-950"
      }`}
    >
      <aside className={`hidden md:flex flex-col ${settings.sidebarCollapsed ? "w-20" : "w-72"} bg-stone-900 border-r border-stone-800 z-30 shrink-0 shadow-2xl relative transition-all duration-300`}>
        <div className={`${settings.sidebarCollapsed ? "p-3 pb-3" : "p-8 pb-4"} flex flex-col items-center border-b border-stone-800/50 bg-stone-900/50 transition-all duration-300`}>
          {/* Avatar = bouton GM caché */}
          <button
            onClick={() => onGmTrigger && onGmTrigger()}
            className={`relative ${settings.sidebarCollapsed ? "w-10 h-10 mb-1" : "w-16 h-16 mb-4"} bg-stone-800 rounded-full flex items-center justify-center border-2 overflow-hidden cursor-default focus:outline-none group transition-all duration-300 ${
              gmBoostActive
                ? "border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse"
                : "border-yellow-600/30 shadow-[0_0_15px_rgba(202,138,4,0.1)] hover:border-yellow-600/60 hover:shadow-[0_0_20px_rgba(202,138,4,0.2)]"
            }`}
            title=""
            tabIndex={-1}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                className="w-full h-full object-cover"
                alt=""
              />
            ) : (
              <User className="text-yellow-600" size={32} />
            )}
            {/* Overlay GM discret au hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
              <Shield size={20} className="text-white opacity-0 group-hover:opacity-60 transition-all duration-300" />
            </div>
            {/* Indicateur boost actif */}
            {gmBoostActive && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-stone-900 shadow-lg">
                <Zap size={10} className="text-stone-900" />
              </div>
            )}
          </button>
          {!settings.sidebarCollapsed && (
            <>
              <h2 className="text-lg font-black uppercase tracking-widest text-stone-100 text-center leading-tight">
                {user.name}
              </h2>
              <div className="text-[10px] text-stone-500 font-mono mt-1 tracking-widest uppercase">
                Matricule: {user.id}
              </div>
              {isSlave && (
                <span className="mt-2 bg-red-900/50 text-red-200 text-[9px] px-2 py-0.5 rounded border border-red-900 uppercase tracking-widest">
                  Esclave
                </span>
              )}
              {gmBoostActive && gmTempBoost && (
                <BoostCountdown expiresAt={gmTempBoost.expiresAt} />
              )}
            </>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto ${settings.sidebarCollapsed ? "p-2 space-y-1" : "p-4 space-y-1"}`}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              title={settings.sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${settings.sidebarCollapsed ? "justify-center px-2 py-3" : "gap-4 px-4 py-3.5"} rounded-xl transition-all duration-300 group ${
                active === item.id
                  ? "bg-[#e6dcc3] text-stone-900 shadow-[0_4px_12px_rgba(0,0,0,0.3)] translate-x-1"
                  : "text-stone-400 hover:bg-stone-800 hover:text-stone-100 hover:translate-x-1"
              }`}
            >
              <item.icon
                size={18}
                className={`shrink-0 transition-colors ${
                  active === item.id
                    ? "text-stone-900"
                    : "text-stone-500 group-hover:text-stone-300"
                }`}
              />
              {!settings.sidebarCollapsed && (
                <span className="text-xs font-black uppercase tracking-widest">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className={`${settings.sidebarCollapsed ? "p-2" : "p-4"} border-t border-stone-800 space-y-2`}>
          <button
            onClick={() => setActive("settings")}
            title={settings.sidebarCollapsed ? "Paramètres" : undefined}
            className={`w-full p-2 text-[10px] font-black uppercase flex items-center ${settings.sidebarCollapsed ? "justify-center" : "gap-2 justify-center"} transition-all rounded-lg tracking-widest ${
              active === "settings"
                ? "text-yellow-400 bg-stone-800"
                : "text-stone-500 hover:text-yellow-400 hover:bg-stone-800"
            }`}
          >
            <Settings size={14} />
            {!settings.sidebarCollapsed && " Paramètres"}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#e6e2d6]/5 relative">
        <header className="h-16 bg-stone-900/95 backdrop-blur border-b border-stone-800 flex items-center justify-between px-4 md:px-8 shadow-xl sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-3 md:invisible">
            <button
              onClick={() => onGmTrigger && onGmTrigger()}
              className={`w-9 h-9 bg-stone-800 rounded-full flex items-center justify-center border overflow-hidden relative shrink-0 cursor-default focus:outline-none transition-all ${
                gmBoostActive
                  ? "border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  : "border-stone-700"
              }`}
              tabIndex={-1}
              title=""
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <User className="text-yellow-600" size={18} />
              )}
              {isSlave && !gmBoostActive && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Lock size={12} className="text-white" />
                </div>
              )}
              {gmBoostActive && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center border-2 border-stone-900">
                  <Zap size={8} className="text-stone-900" />
                </div>
              )}
            </button>
            <div className="font-sans">
              <div className="font-bold text-sm text-stone-200">
                {user.name}
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-stone-400">
            <Scroll size={14} className="text-yellow-600/60" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {formatRPDate(gd)}
            </span>
          </div>

          <div className="flex gap-3 items-center font-sans">
            <NotificationCenter
              grouped={grouped}
              unreadCount={unreadCount}
              onNavigate={(route) => setActive(route)}
              onDismiss={dismiss}
              onDismissAll={dismissAll}
              onOpenFull={() => setActive("notifications")}
            />
            <div className="relative">
              <button
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-all border shadow-lg ${
                  isAccountMenuOpen
                    ? "bg-stone-700 text-white border-stone-500"
                    : "bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700 hover:text-white"
                }`}
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              >
                <Users size={16} className="text-yellow-600" />
                <span className="hidden sm:inline">
                  Comptes ({connectedAccounts.length})
                </span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    isAccountMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isAccountMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setIsAccountMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 top-full mt-3 w-72 bg-stone-900 border border-stone-600 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-3 px-4 text-[9px] uppercase font-black text-stone-500 border-b border-stone-800 bg-stone-950">
                      Identités Mémorisées
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-hide">
                      {connectedAccounts.length > 0 ? (
                        connectedAccounts.map((acc) => (
                          <div
                            key={acc.id}
                            className="flex items-center group hover:bg-stone-800 transition-colors border-b border-stone-800 last:border-0 relative"
                          >
                            <button
                              onClick={() => {
                                if (onSwitchAccount) onSwitchAccount(acc.id);
                                setIsAccountMenuOpen(false);
                              }}
                              className="flex-1 text-left px-4 py-3 flex items-center gap-3 w-full"
                            >
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border-2 shrink-0 ${
                                  acc.id === user.id
                                    ? "border-yellow-500"
                                    : "border-stone-600"
                                }`}
                              >
                                {acc.avatarUrl ? (
                                  <img
                                    src={acc.avatarUrl}
                                    className="w-full h-full object-cover"
                                    alt=""
                                  />
                                ) : (
                                  <User size={16} className="text-stone-400" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span
                                  className={`text-xs font-bold truncate ${
                                    acc.id === user.id
                                      ? "text-yellow-500"
                                      : "text-stone-200"
                                  }`}
                                >
                                  {acc.name}
                                </span>
                                <span className="text-[9px] text-stone-500 font-mono truncate">
                                  {acc.role || "Citoyen"}
                                </span>
                              </div>
                              {acc.id === user.id && (
                                <div className="w-2 h-2 bg-yellow-500 rounded-full ml-auto shadow-[0_0_10px_#eab308]"></div>
                              )}
                            </button>
                            {acc.id !== user.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onLogoutAccount) onLogoutAccount(acc.id);
                                }}
                                className="p-3 text-stone-600 hover:text-red-500 hover:bg-stone-950/50 transition-colors absolute right-0 h-full border-l border-stone-800"
                                title="Oublier"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-stone-500 text-xs italic">
                          Aucun autre compte.
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        if (onAddAccount) onAddAccount();
                      }}
                      className="w-full text-left px-4 py-4 text-xs font-bold uppercase text-green-500 hover:bg-stone-800 hover:text-green-400 flex items-center justify-center gap-2 border-t border-stone-700 transition-colors bg-stone-900"
                    >
                      <PlusCircle size={16} /> Ajouter un compte
                    </button>
                  </div>
                </>
              )}
            </div>

            {isGraded && (
              <button
                onClick={onSwitchBack}
                className="bg-yellow-600 hover:bg-yellow-500 text-stone-900 px-3 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <Shield size={16} />{" "}
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            <button
              onClick={onLogout}
              className="bg-stone-800 hover:bg-red-900/80 text-stone-400 hover:text-white transition-all flex items-center justify-center w-9 h-9 rounded-lg border border-stone-700 shadow-md"
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {isSlave && (
          <div className="bg-stone-800 text-stone-400 text-xs p-2 text-center uppercase tracking-widest font-black flex items-center justify-center gap-2 border-b border-stone-700 shadow-inner shrink-0">
            <Lock size={12} /> Propriété de :{" "}
            {owner ? owner.name : "L'État (Sans maître)"}
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-stone-900">
          <div className="md:hidden flex mb-6 bg-stone-900/80 backdrop-blur-sm p-1.5 rounded-2xl border border-stone-800 shadow-xl overflow-x-auto scrollbar-hide snap-x">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`flex-1 py-2.5 px-5 text-[10px] font-black uppercase rounded-xl transition-all whitespace-nowrap tracking-widest snap-center ${
                  active === item.id
                    ? "bg-[#e6dcc3] text-stone-900 shadow-md transform scale-105"
                    : "text-stone-500 hover:text-stone-300 hover:bg-stone-800/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {active === "gazette" && <GazetteView gazette={gazette} gameDate={gd} />}

            {/* --- BLOC BIBLIOTHÈQUE --- */}
            {active === "library" && (
              <LibraryView countries={safeCountries} session={user} />
            )}
            {/* ------------------------- */}

            {active === "bank" && (
              <CitizenBankView
                user={user}
                users={safeUsers}
                companies={companies}
                countries={countries}
                globalLedger={globalLedger}
                debtRegistry={debtRegistry}
                onTransfer={onTransfer}
                onPayDebt={onPayDebt}
                onCancelDebt={onCancelDebt}
                canUseBank={canUseBank}
                isBanned={isBanned}
                onProposeDebt={onProposeDebt}
                onSignDebt={onSignDebt}
              />
            )}

            {active === "inventory" && (
              <CitizenInventoryView
                user={user}
                users={safeUsers}
                catalog={catalog}
                onBuyItem={onBuyItem}
                onGiveItem={onGiveItem}
                onBuySlave={onBuySlave}
                gameDate={gd}
                onListItemForSale={onListItemForSale}
                onCancelListing={onCancelListing}
                onBuyFromPlayer={onBuyFromPlayer}
                playerMarket={playerMarket}
                onProposeTrade={onProposeTrade}
                onRespondTrade={onRespondTrade}
                onCancelTrade={onCancelTrade}
                tradeProposals={tradeProposals}
              />
            )}

            {active === "my_company" && (
              <MyCompanyView
                user={user}
                companies={companies}
                citizens={safeUsers}
                onCompanyTreasury={onCompanyTreasury}
                onWithdrawCompanySalary={onWithdrawCompanySalary}
                onSendJobOffer={onSendJobOffer}
                onRespondJobOffer={onRespondJobOffer}
                onPaySalaries={onPaySalaries}
                onCompanyFire={onCompanyFire}
                onCustomizeCompany={onCustomizeCompany}
                onDeleteCompany={onDeleteCompany}
                onQuitCompany={onQuitCompany}
                jobContracts={jobContracts}
                onSaveJobContract={onSaveJobContract}
                onDeleteJobContract={onDeleteJobContract}
                onToggleJobContract={onToggleJobContract}
                globalLedger={globalLedger}
                onPostBulletin={onPostBulletin}
                onDeleteBulletin={onDeleteBulletin}
                onSetEmployeeRank={onSetEmployeeRank}
                onApplyToCompany={onApplyToCompany}
                onRespondApplication={onRespondApplication}
                onUpdateEmployeeProfile={onUpdateEmployeeProfile}
                onCompanyInventoryAdd={onCompanyInventoryAdd}
                onCompanyInventoryRemove={onCompanyInventoryRemove}
                onCreateCompanyEvent={onCreateCompanyEvent}
                onDeleteCompanyEvent={onDeleteCompanyEvent}
                onCreateSubcontract={onCreateSubcontract}
              />
            )}

            {active === "msg" && !isBanned && canUsePost && (
              <PostView
                users={safeUsers}
                session={user}
                onSend={onSend}
                onUpdateUser={onUpdateUser}
                notify={notify}
              />
            )}

            {active === "travel" &&
              !isBanned &&
              !isPrisoner &&
              canUseTravel && (
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
                          safeCountries.find(
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                          className="w-full p-3 border rounded bg-white text-sm"
                          value={travelDestCountry}
                          onChange={(e) => setTravelDestCountry(e.target.value)}
                        >
                          <option value="">— Destination —</option>
                          {safeCountries
                            .filter(
                              (c) =>
                                c.id !==
                                (user.locationCountryId || user.countryId)
                            )
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          <option
                            value={
                              user.locationCountryId || user.countryId
                            }
                          >
                            Voyage Intérieur
                          </option>
                        </select>
                        {travelDestCountry && (
                          <select
                            className="w-full p-3 border rounded bg-white text-sm"
                            value={travelDestRegion}
                            onChange={(e) =>
                              setTravelDestRegion(e.target.value)
                            }
                          >
                            <option value="">— Région —</option>
                            {(
                              safeCountries.find(
                                (c) => c.id === travelDestCountry
                              )?.regions || []
                            ).map((r) => (
                              <option key={r.id} value={r.name}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
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

            {active === "asia" && (
              <MaisonDeAsiaCitizen
                citizens={safeUsers}
                countries={safeCountries}
                houseRegistry={houseRegistry}
                staff={maisonStaff}
                maisonQueue={maisonQueue}
                maisonHistory={maisonHistory}
                maisonReviews={maisonReviews}
                maisonDefaultDuration={maisonDefaultDuration}
                onBook={onBookMaison}
                onJoinQueue={onJoinMaisonQueue}
                onLeaveQueue={onLeaveMaisonQueue}
                onSubmitReview={onSubmitMaisonReview}
                userBalance={user.balance}
                user={user}
              />
            )}
            {active === "servitude" && isSlave && (
              <SlavePersonalView
                user={user}
                users={safeUsers}
                companies={companies}
                countries={countries}
                owner={safeUsers.find((u) => u.id === user.ownerId)}
                onHideMoney={onHideMoney}
                onWithdrawHiddenMoney={onWithdrawHiddenMoney}
                onHiddenTransfer={onHiddenTransfer}
              />
            )}
            {active === "slaves" && (
              <SlaveManagementView
                slaves={mySlaves}
                onUpdateCitizen={onUpdateUser}
                onConfiscateSlaveMoney={onConfiscateSlaveMoney}
                onBuySlave={onBuySlave}
                onSelfManumit={onSelfManumit}
                onDismissSlaveAlert={onDismissSlaveAlert}
                onRestoreHiddenTransfer={onRestoreHiddenTransfer}
                notify={notify}
                catalog={catalog}
                session={user}
                countries={safeCountries}
              />
            )}

            {active === "profil" && (
              <div className={`bg-[#fdf6e3] text-stone-900 rounded-lg shadow-2xl border-t-8 ${theme.border} overflow-hidden`}>
                {/* === HEADER : Avatar + Identité + Badges === */}
                <div className="p-6 md:p-8 border-b border-stone-300">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Avatar preview */}
                    <div className="shrink-0">
                      <div className={`w-32 h-32 rounded-xl border-4 ${theme.border} bg-stone-100 overflow-hidden shadow-lg`}>
                        {(editAvatar || user.avatarUrl) ? (
                          <img
                            src={editAvatar || user.avatarUrl}
                            className="w-full h-full object-cover"
                            alt="Portrait"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-stone-200">
                            <User size={48} className="text-stone-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Identité */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h2 className="text-2xl font-black text-stone-800 font-serif leading-tight">
                          {user.name}
                        </h2>
                        <span className="text-xs text-stone-400 font-mono">#{user.id}</span>
                      </div>
                      {(user.title || editTitle) && (
                        <div className="text-sm font-bold text-stone-500 italic mb-1">
                          « {editTitle || user.title} »
                        </div>
                      )}
                      {(user.motto || editMotto) && (
                        <div className="text-xs text-stone-400 italic flex items-center gap-1 mb-3">
                          <Quote size={12} /> {editMotto || user.motto}
                        </div>
                      )}
                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${theme.badge}`}>
                          {roleInfo.label}
                        </span>
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                          user.status === "Esclave" ? "bg-red-900 text-white" :
                          user.status === "Prisonnier" ? "bg-orange-100 text-orange-800 border border-orange-300" :
                          user.status === "Malade" ? "bg-yellow-100 text-yellow-800 border border-yellow-300" :
                          user.status === "Banni" ? "bg-stone-800 text-white" :
                          user.status === "Décédé" ? "bg-stone-900 text-stone-400" :
                          "bg-green-100 text-green-800 border border-green-300"
                        }`}>
                          {user.status || "Actif"}
                        </span>
                        {ownedCompany && (
                          <span className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <Building2 size={10} /> Patron
                          </span>
                        )}
                        {employedCompany && !ownedCompany && (
                          <span className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
                            <Briefcase size={10} /> Employé
                          </span>
                        )}
                        {mySlaves.length > 0 && (
                          <span className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-stone-200 text-stone-700 border border-stone-300 flex items-center gap-1">
                            <Gavel size={10} /> {mySlaves.length} esclave{mySlaves.length > 1 ? "s" : ""}
                          </span>
                        )}
                        {currentSpouses.map((spouse) => (
                          <span key={spouse.id} className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-700 border border-rose-300 flex items-center gap-1">
                            <Heart size={10} />
                            {MARRIAGE_CONTRACT_TYPES.find((c) => c.id === spouse.contractType)?.emoji || "💍"}{" "}
                            {safeUsers.find((u) => u.id === spouse.id)?.name || spouse.name || "…"}
                          </span>
                        ))}
                      </div>
                      {/* Fortune rapide */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 font-bold text-stone-700">
                          <Coins size={16} className="text-yellow-600" />
                          {(user.balance || 0).toLocaleString()} Écus
                        </div>
                        {(user.inventory || []).length > 0 && (
                          <div className="flex items-center gap-1.5 text-stone-500">
                            <Box size={14} />
                            {(user.inventory || []).reduce((s, i) => s + (i.quantity || 1), 0)} objets
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* === ÉTAT CIVIL (lecture seule) === */}
                <div className="p-6 md:p-8 border-b border-stone-200 bg-white/30">
                  <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest mb-4 flex items-center gap-2">
                    <Shield size={14} /> État Civil
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Allégeance</span>
                      <div className="font-bold text-stone-800 flex items-center gap-1.5">
                        <Landmark size={14} className="text-stone-400" />
                        {safeCountries.find((c) => c.id === user?.countryId)?.name || "Empire"}
                      </div>
                    </div>
                    <div>
                      <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Localisation</span>
                      <div className="font-bold text-stone-800 flex items-center gap-1.5">
                        <MapPin size={14} className="text-stone-400" />
                        {safeCountries.find((c) => c.id === (user?.locationCountryId || user?.countryId))?.name || "Empire"}
                        <span className="text-xs text-stone-500 font-normal">— {user?.currentPosition || "Inconnue"}</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Âge</span>
                      <div className="font-bold text-stone-800">{getCitizenAge(user, gd) || "?"} ans</div>
                      {user.birthDate && (
                        <div className="text-[9px] text-stone-400 mt-0.5">Né(e) le {formatRPDate(user.birthDate)}</div>
                      )}
                    </div>
                    {employedCompany && (
                      <div>
                        <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Entreprise</span>
                        <div className="font-bold text-stone-800 flex items-center gap-1.5">
                          <Building2 size={14} className="text-stone-400" />
                          {employedCompany.name}
                        </div>
                      </div>
                    )}
                    {isSlave && owner && (
                      <div>
                        <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Propriétaire</span>
                        <div className="font-bold text-red-800 flex items-center gap-1.5">
                          <Lock size={14} className="text-red-400" />
                          {owner.name}
                        </div>
                      </div>
                    )}
                    {user.origin && (
                      <div>
                        <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Lieu d'Origine</span>
                        <div className="font-bold text-stone-800">{user.origin}</div>
                      </div>
                    )}
                    {user.religion && (
                      <div>
                        <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Religion</span>
                        <div className="font-bold text-stone-800 flex items-center gap-1.5">
                          <Church size={14} className="text-stone-400" />
                          {user.religion}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Droits de l'esclave */}
                  {isSlave && (
                    <div className="mt-4 pt-4 border-t border-stone-200">
                      <span className="block text-stone-400 uppercase font-bold text-[9px] mb-2 tracking-widest">Droits Actuels</span>
                      <div className="flex gap-3 flex-wrap">
                        {[
                          { key: "bank", label: "Banque", icon: Landmark },
                          { key: "post", label: "Poste", icon: Mail },
                          { key: "travel", label: "Voyage", icon: Map },
                        ].map((p) => (
                          <span key={p.key} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            permissions[p.key] ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500 line-through"
                          }`}>
                            <p.icon size={12} /> {p.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* === ÉDITION : Personnalisation === */}
                <div className="p-6 md:p-8 border-b border-stone-200">
                  <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest mb-4 flex items-center gap-2">
                    <Settings size={14} /> Personnaliser
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Portrait (URL)</span>
                      <input
                        className="w-full bg-stone-50 border-b-2 border-stone-300 font-bold text-stone-800 outline-none p-1.5 text-sm"
                        value={editAvatar}
                        onChange={(e) => setEditAvatar(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Occupation</span>
                      <input
                        className="w-full bg-stone-50 border-b-2 border-stone-300 font-bold text-stone-800 outline-none p-1.5 text-sm"
                        value={editOccupation}
                        onChange={(e) => setEditOccupation(e.target.value)}
                        placeholder="Métier..."
                      />
                    </div>
                    <div>
                      <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Titre Honorifique</span>
                      <input
                        className="w-full bg-stone-50 border-b-2 border-stone-300 font-bold text-stone-800 outline-none p-1.5 text-sm"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Le Magnifique, L'Intrépide..."
                      />
                    </div>
                    <div>
                      <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Devise</span>
                      <input
                        className="w-full bg-stone-50 border-b-2 border-stone-300 font-bold text-stone-800 outline-none p-1.5 text-sm"
                        value={editMotto}
                        onChange={(e) => setEditMotto(e.target.value.slice(0, 200))}
                        placeholder="Ma devise personnelle..."
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Religion</span>
                      <input
                        className="w-full bg-stone-50 border-b-2 border-stone-300 font-bold text-stone-800 outline-none p-1.5 text-sm"
                        value={editReligion}
                        onChange={(e) => setEditReligion(e.target.value)}
                        placeholder="Croyance..."
                      />
                    </div>
                    <div>
                      <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Lieu d'Origine</span>
                      <input
                        className="w-full bg-stone-50 border-b-2 border-stone-300 font-bold text-stone-800 outline-none p-1.5 text-sm"
                        value={editOrigin}
                        onChange={(e) => setEditOrigin(e.target.value)}
                        placeholder="D'où venez-vous..."
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Biographie</span>
                    <textarea
                      className="w-full bg-white/50 border-2 border-stone-200 rounded-lg p-3 text-sm italic font-serif text-stone-700 min-h-[120px]"
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Racontez votre histoire..."
                    />
                  </div>
                  <button
                    onClick={() => {
                      onUpdateUser({
                        ...user,
                        occupation: editOccupation,
                        bio: editBio,
                        avatarUrl: editAvatar,
                        motto: editMotto,
                        title: editTitle,
                        religion: editReligion,
                        origin: editOrigin,
                      });
                      notify("Dossier mis à jour.", "success");
                    }}
                    className={`w-full py-3 rounded uppercase font-bold text-[10px] tracking-widest transition-all shadow-md active:scale-95 text-white ${
                      theme.border.replace("border-", "bg-").replace("-500", "-700")
                    } hover:opacity-90`}
                  >
                    Mettre à jour le Dossier
                  </button>
                </div>

                {/* === JOURNAL INTIME RP === */}
                <div className="p-6 md:p-8 border-t border-stone-200">
                  <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest mb-4 flex items-center gap-2">
                    <Book size={16} /> Journal Intime
                  </h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <textarea
                        className="flex-1 p-3 bg-white border border-stone-200 rounded text-sm resize-none outline-none"
                        rows={2}
                        value={journalEntry}
                        onChange={(e) => setJournalEntry(e.target.value)}
                        placeholder="Écrire une entrée dans votre journal..."
                        maxLength={500}
                      />
                      <button
                        onClick={() => {
                          if (journalEntry.trim() && onAddJournalEntry) {
                            onAddJournalEntry(journalEntry);
                            setJournalEntry("");
                          }
                        }}
                        disabled={!journalEntry.trim()}
                        className="bg-stone-800 text-white px-4 rounded font-bold uppercase text-xs hover:bg-stone-700 disabled:opacity-50 self-end"
                      >
                        Écrire
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(user.journal || []).length === 0 ? (
                        <div className="text-center text-stone-400 italic py-3 text-xs">
                          Votre journal est vide. Commencez à écrire vos aventures !
                        </div>
                      ) : (
                        (user.journal || []).map((entry) => (
                          <div key={entry.id} className="bg-white border border-stone-200 rounded-lg p-3 group">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm text-stone-800 whitespace-pre-wrap">{entry.content}</div>
                                <div className="text-[10px] text-stone-400 mt-1 font-mono">{entry.rpDate}</div>
                              </div>
                              <button
                                onClick={() => onDeleteJournalEntry && onDeleteJournalEntry(entry.id)}
                                className="text-red-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* === CASIER JUDICIAIRE === */}
                {(user.criminalRecord || []).length > 0 && (
                  <div className="p-6 md:p-8 border-t border-stone-200">
                    <h3 className="text-xs font-black uppercase text-red-500 tracking-widest mb-4 flex items-center gap-2">
                      <Shield size={16} /> Casier Judiciaire
                    </h3>
                    <div className="space-y-2">
                      {(user.criminalRecord || []).map((entry, i) => (
                        <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-red-700">{entry.charge}</span>
                            <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                              {entry.verdict === "GUILTY" ? "Coupable" : entry.verdict}
                            </span>
                          </div>
                          {entry.sentence && (
                            <div className="text-red-600 mt-1">
                              Peine : {entry.sentence.type === "FINE" ? `Amende de ${entry.sentence.amount} Écus` : entry.sentence.type === "PRISON" ? `Emprisonnement${entry.sentence.text ? ` — ${entry.sentence.text}` : ""}` : entry.sentence.type === "EXILE" ? "Exil" : entry.sentence.text || "Autre"}
                            </div>
                          )}
                          <div className="text-red-400 mt-1">Juge : {entry.judgeName || "Inconnu"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* === FAVORIS === */}
                {(user.favorites || []).length > 0 && (
                  <div className="p-6 md:p-8 border-t border-stone-200">
                    <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest mb-4 flex items-center gap-2">
                      <Heart size={16} /> Favoris
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(user.favorites || []).map((fav, i) => (
                        <div key={i} className="bg-white border border-stone-200 rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
                          <span className="font-bold text-stone-700">{fav.label}</span>
                          <span className="text-[9px] text-stone-400 uppercase">{fav.type}</span>
                          <button
                            onClick={() => onToggleFavorite && onToggleFavorite(fav)}
                            className="text-red-300 hover:text-red-500"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* === SCEAU DE SÉCURITÉ === */}
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

            {/* === MARIAGE & FAMILLE === */}
            {active === "mariage" && !isSlave && (
              <MarriageView
                user={user}
                safeUsers={safeUsers}
                safeCountries={safeCountries}
                sharedAccounts={sharedAccounts}
                onProposeMarriage={onProposeMarriage}
                onAcceptMarriage={onAcceptMarriage}
                onRejectMarriage={onRejectMarriage}
                onDivorce={onDivorce}
                onDeclareChild={onDeclareChild}
                onRemoveChild={onRemoveChild}
                onSetParents={onSetParents}
                onSharedAccountDeposit={onSharedAccountDeposit}
                onSharedAccountWithdraw={onSharedAccountWithdraw}
                gameDate={gameDate}
                notify={notify}
              />
            )}

            {/* === MA DYNASTIE / FAMILLE === */}
            {active === "famille" && !isSlave && (() => {
              const myFamily = getFamilyForCitizen(user, families);
              if (!myFamily) {
                return (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center">
                      <HeartHandshake size={40} className="mx-auto text-stone-300 mb-3" />
                      <h3 className="text-lg font-black text-stone-600">Aucune famille</h3>
                      <p className="text-sm text-stone-400 mt-1">Vous n'appartenez à aucune famille ou dynastie enregistrée.</p>
                    </div>
                  </div>
                );
              }

              const isHead = myFamily.headId === user.id;
              const isRegent = myFamily.regentId === user.id;
              // Si un régent est en place, seul le régent peut gérer (il remplace le chef)
              const hasRegent = !!myFamily.regentId;
              const canManage = hasRegent ? isRegent : isHead;
              const members = getFamilyMembers(myFamily, safeUsers);
              const branches = normalizeBranches(myFamily);
              const myBranch = getBranchForCitizen(user, myFamily);
              const head = myFamily.headId ? safeUsers.find((c) => c.id === myFamily.headId) : null;
              const regent = myFamily.regentId ? safeUsers.find((c) => c.id === myFamily.regentId) : null;
              const displayName = getFamilyDisplayName(myFamily);
              const treasury = myFamily.treasury || 0;

              return (
                <div className="space-y-5 animate-fadeIn">
                  {/* En-tête famille */}
                  <div className="bg-gradient-to-r from-stone-100 to-amber-50/30 border border-stone-200 rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{myFamily.coat || (myFamily.type === "noble" ? "⚜️" : "🏠")}</div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-black font-serif text-stone-800">{displayName}</h2>
                        {myFamily.motto && <p className="text-sm text-stone-500 italic mt-1">« {myFamily.motto} »</p>}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                            myFamily.type === "noble" ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-stone-100 text-stone-600 border-stone-200"
                          }`}>{myFamily.type === "noble" ? "Dynastie noble" : "Famille commune"}</span>
                          {myBranch && (
                            <span className="text-[10px] text-stone-500">{myBranch.isMain ? "👑 Branche principale" : `⚜️ Maison ${myBranch.name}`}</span>
                          )}
                          {isHead && (
                            <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1"><Crown size={10} /> Chef de famille</span>
                          )}
                          {isRegent && (
                            <span className="bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1"><Shield size={10} /> Régent</span>
                          )}
                          {myFamily.foundedYear && <span className="text-[10px] text-stone-400">Fondée en {myFamily.foundedYear}</span>}
                        </div>
                      </div>
                    </div>
                    {myFamily.description && <p className="text-sm text-stone-500 mt-3 leading-relaxed">{myFamily.description}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Stats */}
                    <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
                      <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Informations</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500">Membres</span>
                          <span className="font-bold text-stone-700">{members.length}</span>
                        </div>
                        {myFamily.type === "noble" && (
                          <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Branches</span>
                            <span className="font-bold text-stone-700">{branches.length}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500">Chef</span>
                          <span className="font-bold text-amber-700">{head ? (head.firstName ? `${head.firstName} ${head.lastName || ""}`.trim() : head.name) : "Aucun"}</span>
                        </div>
                        {regent && (
                          <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Régent</span>
                            <span className="font-bold text-purple-700">{regent.firstName ? `${regent.firstName} ${regent.lastName || ""}`.trim() : regent.name}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm border-t border-stone-100 pt-2">
                          <span className="text-stone-500">Trésorerie</span>
                          <span className="font-black font-mono text-yellow-700 text-lg">{treasury.toLocaleString()} Écus</span>
                        </div>
                      </div>
                    </div>

                    {/* Trésorerie - actions */}
                    <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
                      <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-1"><Coins size={11} /> Trésorerie familiale</div>
                      <FamilyTreasuryActions
                        familyId={myFamily.id}
                        isHead={canManage}
                        treasury={treasury}
                        userBalance={user.balance || 0}
                        onDeposit={onFamilyDeposit}
                        onWithdraw={onFamilyWithdraw}
                      />
                    </div>

                    {/* Actions chef / régent */}
                    {canManage && (
                      <div className={`rounded-xl p-4 space-y-3 ${isHead ? "bg-amber-50/50 border border-amber-200" : "bg-purple-50/50 border border-purple-200"}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${isHead ? "text-amber-600" : "text-purple-600"}`}>
                          {isHead ? <><Crown size={11} /> Gestion du chef</> : <><Shield size={11} /> Gestion du régent</>}
                        </div>
                        <FamilyHeadActions
                          family={myFamily}
                          members={members}
                          user={user}
                          isHead={isHead}
                          isRegent={isRegent}
                          onEditFamilyInfo={onEditFamilyInfo}
                          onTransferFamilyHead={onTransferFamilyHead}
                          onSetFamilyRegent={onSetFamilyRegent}
                          onRemoveFamilyRegent={onRemoveFamilyRegent}
                        />
                      </div>
                    )}
                  </div>

                  {/* Membres */}
                  <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
                    <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-1">
                      <Users size={11} /> Membres de la famille ({members.length})
                    </div>
                    {myFamily.type === "noble" ? (
                      <div className="space-y-3">
                        {branches.map((branch, bIdx) => {
                          const branchMembers = safeUsers.filter(
                            (c) => c.lastName && branch.lastName && c.lastName.toLowerCase() === branch.lastName.toLowerCase()
                          );
                          return (
                            <div key={bIdx} className="bg-stone-50 rounded-lg border border-stone-100 p-3">
                              <div className="text-[9px] font-black uppercase text-stone-500 mb-2">
                                {branch.isMain ? `👑 Branche principale — ${branch.name}` : `⚜️ Maison ${branch.name}`}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                {branchMembers.map((m) => (
                                  <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded text-sm">
                                    <div className="w-7 h-7 bg-stone-200 rounded-full flex items-center justify-center text-xs font-bold text-stone-500 shrink-0">
                                      {(m.firstName || m.name || "?")[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-stone-700 truncate text-xs">{m.firstName ? `${m.firstName} ${m.lastName || ""}`.trim() : m.name}</div>
                                      <div className="text-[10px] text-stone-400">{m.occupation || "Citoyen"}</div>
                                    </div>
                                    {m.id === myFamily.headId && <Crown size={12} className="text-amber-500 shrink-0" />}
                                  </div>
                                ))}
                                {branchMembers.length === 0 && <div className="text-xs text-stone-400 italic col-span-2 py-2">Aucun membre</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
                        {members.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded text-sm">
                            <div className="w-7 h-7 bg-stone-200 rounded-full flex items-center justify-center text-xs font-bold text-stone-500 shrink-0">
                              {(m.firstName || m.name || "?")[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-stone-700 truncate text-xs">{m.firstName ? `${m.firstName} ${m.lastName || ""}`.trim() : m.name}</div>
                              <div className="text-[10px] text-stone-400">{m.occupation || "Citoyen"}</div>
                            </div>
                            {m.id === myFamily.headId && <Crown size={12} className="text-amber-500 shrink-0" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* === ANNUAIRE DES CITOYENS === */}
            {active === "annuaire" && (
              <div className="space-y-4">
                <div className="bg-[#fdf6e3] text-stone-900 rounded-lg shadow-2xl border-t-8 border-stone-400 overflow-hidden p-6">
                  <h2 className="text-xl font-black uppercase text-stone-800 tracking-widest font-serif flex items-center gap-3 mb-4">
                    <Eye size={20} /> Annuaire Impérial
                  </h2>
                  <p className="text-xs text-stone-500 mb-4">
                    Consultez les fiches des citoyens de l'Empire. Les informations financières restent privées.
                  </p>
                  {/* Barre de recherche + filtres */}
                  <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <div className="flex-1 relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-stone-200 rounded-lg text-sm outline-none focus:border-stone-400 transition-colors"
                        value={annuaireSearch}
                        onChange={(e) => setAnnuaireSearch(e.target.value)}
                        placeholder="Rechercher un citoyen..."
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { key: "ALL", label: "Tous" },
                        { key: "EMPEREUR", label: "Empereur" },
                        { key: "ROI", label: "Rois" },
                        { key: "FONC", label: "Fonctionnaires" },
                        { key: "ESCLAVE", label: "Esclaves" },
                      ].map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setAnnuaireFilter(f.key)}
                          className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                            annuaireFilter === f.key
                              ? "bg-stone-800 text-white"
                              : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Liste filtrée */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-300">
                    {safeUsers
                      .filter((c) => {
                        if (annuaireSearch) {
                          const s = annuaireSearch.toLowerCase();
                          if (!c.name?.toLowerCase().includes(s) && !c.id?.toLowerCase().includes(s)) return false;
                        }
                        if (annuaireFilter === "ALL") return true;
                        if (annuaireFilter === "EMPEREUR") return c.role === "EMPEREUR";
                        if (annuaireFilter === "ROI") return c.role === "ROI";
                        if (annuaireFilter === "FONC") return ["GRAND_FONC_GLOBAL", "GRAND_FONC_LOCAL", "INTENDANT", "FONCTIONNAIRE", "POSTIERE"].includes(c.role);
                        if (annuaireFilter === "ESCLAVE") return c.status === "Esclave";
                        return true;
                      })
                      .sort((a, b) => {
                        const getLevel = (c) => {
                          if (ROLES[c.role]) return ROLES[c.role].level;
                          const cc = safeCountries.find(ct => ct.id === c.countryId);
                          const custom = (cc?.customRoles || []).find(r => r.type === "ROLE" && (r.id === c.role || r.name === c.role));
                          return custom?.level || 0;
                        };
                        return getLevel(b) - getLevel(a);
                      })
                      .map((c) => {
                        const cTheme = getRoleTheme(c.role);
                        const cRole = (() => {
                          if (ROLES[c.role]) return ROLES[c.role];
                          const cc = safeCountries.find(ct => ct.id === c.countryId);
                          const custom = (cc?.customRoles || []).find(r => r.type === "ROLE" && (r.id === c.role || r.name === c.role));
                          return custom ? { label: custom.name, level: custom.level || 0 } : ROLES.CITOYEN;
                        })();
                        return (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCitizen(c)}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                              selectedCitizen?.id === c.id ? cTheme.border : "border-stone-200"
                            } bg-white hover:shadow-md transition-all text-left`}
                          >
                            <div className={`w-10 h-10 rounded-lg ${cTheme.border} border-2 bg-stone-100 overflow-hidden shrink-0`}>
                              {c.avatarUrl ? (
                                <img src={c.avatarUrl} className="w-full h-full object-cover" alt="" onError={(e) => { e.target.style.display = "none"; }} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User size={16} className="text-stone-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-sm text-stone-800 truncate">
                                {c.name}
                                {c.title && <span className="text-xs text-stone-400 font-normal ml-1 italic">« {c.title} »</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${cTheme.badge}`}>
                                  {cRole.label}
                                </span>
                                <span className={`text-[8px] font-bold uppercase ${
                                  c.status === "Esclave" ? "text-red-600" :
                                  c.status === "Actif" ? "text-green-600" :
                                  c.status === "Diplomate" ? "text-blue-600" :
                                  "text-stone-400"
                                }`}>
                                  {c.status === "Diplomate" ? "🎖️ Diplomate" : (c.status || "Actif")}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                  {safeUsers.length === 0 && (
                    <div className="text-center text-stone-400 py-10 text-sm">Aucun citoyen enregistré.</div>
                  )}
                </div>

                {/* Fiche sélectionnée */}
                {selectedCitizen && (
                  <CitizenProfileCard
                    citizen={selectedCitizen}
                    countries={safeCountries}
                    companies={safeCompanies}
                    users={safeUsers}
                    families={families}
                    gameDate={gd}
                    onClose={() => setSelectedCitizen(null)}
                    onAddJournalEntry={onAddJournalEntry}
                    onDeleteJournalEntry={onDeleteJournalEntry}
                    onToggleFavorite={onToggleFavorite}
                  />
                )}
              </div>
            )}

            {/* --- PROPRIÉTÉS --- */}
            {active === "properties" && selectedPropertyId && (() => {
              const selProp = properties.find((p) => p.id === selectedPropertyId);
              if (!selProp) { setSelectedPropertyId(null); return null; }
              const isPropertyOwner = selProp.ownerId === user.id || (selProp.ownerType === "COMPANY" && (companies || []).some((c) => c.id === selProp.ownerId && c.ownerId === user.id));
              return (
                <PropertyDetailView
                  property={selProp}
                  citizens={safeUsers}
                  user={user}
                  session={user}
                  isOwner={isPropertyOwner}
                  onUpdatePropertyFeature={onUpdatePropertyFeature}
                  onAddGarrison={onAddGarrison}
                  onRemoveGarrison={onRemoveGarrison}
                  onImprison={onImprison}
                  onReleasePrisoner={onReleasePrisoner}
                  onRequestAudience={onRequestAudience}
                  onRespondAudience={onRespondAudience}
                  onSetupRooms={onSetupRooms}
                  onBookRoom={onBookRoom}
                  onCheckoutRoom={onCheckoutRoom}
                  onPostTavernMessage={onPostTavernMessage}
                  onPostRumor={onPostRumor}
                  onDeleteRumor={onDeleteRumor}
                  onBuyFromMenu={onBuyFromMenu}
                  onBuyFromShop={onBuyFromShop}
                  onAddPropertyStaff={onAddPropertyStaff}
                  onRemovePropertyStaff={onRemovePropertyStaff}
                  onAddPropertyEvent={onAddPropertyEvent}
                  onRemovePropertyEvent={onRemovePropertyEvent}
                  onBack={() => setSelectedPropertyId(null)}
                />
              );
            })()}

            {active === "properties" && !selectedPropertyId && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin size={24} className="text-stone-400" />
                  <h2 className="text-2xl font-black font-serif text-stone-800">Registre Foncier</h2>
                </div>

                {/* Helper pour le nom de localisation */}
                {(() => {
                  const PROP_TYPES = {
                    MAISON: "Maison", DOMAINE: "Domaine", TERRAIN: "Terrain",
                    COMMERCE: "Local Commercial", FERME: "Ferme",
                    MANOIR: "Manoir / Château", ATELIER: "Atelier",
                  };

                  const getLocation = (prop) => {
                    const c = safeCountries.find((x) => x.id === prop.countryId);
                    if (!c) return prop.location || null;
                    const r = (c.regions || []).find((x) => x.id === prop.regionId);
                    return r ? `${r.name}, ${c.name}` : c.name;
                  };

                  const myCompanyIds = (companies || []).filter((c) => c.ownerId === user.id).map((c) => c.id);
                  const isMine = (p) => p.ownerId === user.id || (p.ownerType === "COMPANY" && myCompanyIds.includes(p.ownerId));
                  const myProps = properties.filter(isMine);
                  const available = properties.filter((p) => !p.ownerId);
                  const forSale = properties.filter((p) => p.forSale && p.ownerId && !isMine(p));
                  const myRentals = properties.filter((p) => p.rental && p.rental.tenantId === user.id);
                  const forRent = properties.filter((p) => p.rental && !p.rental.tenantId && p.ownerId && !isMine(p));
                  const totalValue = myProps.reduce((s, p) => s + (p.price || 0), 0);
                  const totalIncome = myProps.reduce((s, p) => s + (p.income || 0), 0);

                  // Carte propriété réutilisable
                  const PropertyCard = ({ prop, variant, children }) => {
                    const loc = getLocation(prop);
                    const borderColor = variant === "owned" ? "border-stone-300" : variant === "admin" ? "border-green-200" : "border-yellow-200";
                    const bgAccent = variant === "owned" ? "bg-stone-50" : variant === "admin" ? "bg-green-50/30" : "bg-yellow-50/30";
                    return (
                      <div className={`bg-white border-2 ${borderColor} rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                        {/* En-tête coloré */}
                        <div className={`${bgAccent} px-4 py-2.5 border-b border-stone-100 flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-stone-800">{prop.name}</span>
                            {prop.type && (
                              <span className="bg-stone-200/60 text-stone-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                                {PROP_TYPES[prop.type] || prop.type}
                              </span>
                            )}
                          </div>
                          {variant === "owned" && prop.forSale && (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                              En vente
                            </span>
                          )}
                          {variant === "owned" && prop.rental && prop.rental.tenantId && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                              Loué
                            </span>
                          )}
                          {variant === "owned" && prop.rental && !prop.rental.tenantId && (
                            <span className="bg-blue-50 text-blue-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                              En location
                            </span>
                          )}
                        </div>

                        <div className="p-4 space-y-3">
                          {/* Description */}
                          {prop.description && (
                            <p className="text-sm text-stone-600 leading-relaxed">{prop.description}</p>
                          )}

                          {/* Infos */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-400">
                            {loc && (
                              <span className="flex items-center gap-1">
                                <MapPin size={11} className="text-stone-400" /> {loc}
                              </span>
                            )}
                            {(prop.income || 0) > 0 && (
                              <span className="flex items-center gap-1 text-green-600 font-bold font-mono">
                                <Coins size={11} /> +{prop.income} Écus/jour
                              </span>
                            )}
                            {variant !== "owned" && prop.ownerId && (
                              <span className="flex items-center gap-1">
                                <User size={11} /> {prop.ownerName}
                              </span>
                            )}
                          </div>

                          {/* Prix + Actions */}
                          {children}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <>
                      {/* Résumé patrimoine */}
                      {myProps.length > 0 && (
                        <div className="bg-gradient-to-r from-stone-100 to-stone-50 border border-stone-200 rounded-xl p-4">
                          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3">Mon patrimoine immobilier</div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-black text-stone-800">{myProps.length}</div>
                              <div className="text-[10px] text-stone-400 uppercase font-bold">Bien{myProps.length > 1 ? "s" : ""}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-black text-yellow-700 font-mono">{totalValue.toLocaleString()}</div>
                              <div className="text-[10px] text-stone-400 uppercase font-bold">Valeur (Écus)</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-black text-green-600 font-mono">+{totalIncome}</div>
                              <div className="text-[10px] text-stone-400 uppercase font-bold">Écus / jour</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mes propriétés */}
                      {myProps.length > 0 && (
                        <div>
                          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3">Mes propriétés</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myProps.map((prop) => {
                              const ownerCompany = prop.ownerType === "COMPANY" ? (companies || []).find((c) => c.id === prop.ownerId) : null;
                              return (
                              <PropertyCard key={prop.id} prop={prop} variant="owned">
                                {ownerCompany && (
                                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 text-xs text-indigo-700 font-bold flex items-center gap-1.5">
                                    <Building2 size={12} /> Via entreprise : {ownerCompany.name}
                                  </div>
                                )}
                                {/* Locataire actuel */}
                                {prop.rental && prop.rental.tenantId && (
                                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                    <div className="text-xs">
                                      <span className="text-blue-700 font-bold">Loué à {prop.rental.tenantName}</span>
                                      <span className="text-blue-500 ml-2 font-mono">{prop.rental.dailyRate} Écus/jour</span>
                                      {prop.rental.startDate && <span className="text-blue-400 ml-2">depuis le {prop.rental.startDate}</span>}
                                    </div>
                                    <button
                                      onClick={() => onEvictTenant && onEvictTenant(prop.id)}
                                      className="text-red-500 text-[10px] font-bold uppercase border border-red-200 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                    >
                                      Expulser
                                    </button>
                                  </div>
                                )}
                                {/* En attente de locataire */}
                                {prop.rental && !prop.rental.tenantId && (
                                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                    <div className="text-xs text-blue-600">
                                      En location : <span className="font-mono font-bold">{prop.rental.dailyRate} Écus/jour</span>
                                    </div>
                                    <button
                                      onClick={() => onCancelPropertyRental && onCancelPropertyRental(prop.id)}
                                      className="text-red-500 text-[10px] font-bold uppercase border border-red-200 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                    >
                                      Retirer
                                    </button>
                                  </div>
                                )}
                                {/* Actions vente / location */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
                                  <div className="font-mono text-sm font-bold text-stone-500">Estimé : {prop.price} Écus</div>
                                  <div className="flex flex-wrap gap-2">
                                    {prop.forSale ? (
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-bold text-yellow-700">{prop.salePrice} Écus</span>
                                        <button
                                          onClick={() => onCancelPropertySale && onCancelPropertySale(prop.id)}
                                          className="text-red-500 text-[10px] font-bold uppercase border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
                                        >
                                          Retirer de la vente
                                        </button>
                                      </div>
                                    ) : (
                                      <SellPropertyButton propId={prop.id} onSellProperty={onSellProperty} />
                                    )}
                                    {!prop.forSale && (!prop.rental || !prop.rental.tenantId) && !prop.rental && (
                                      <RentPropertyButton propId={prop.id} onListPropertyForRent={onListPropertyForRent} />
                                    )}
                                  </div>
                                </div>
                                {(prop.type === "MANOIR" || prop.type === "AUBERGE" || prop.type === "FERME" || prop.type === "ATELIER" || prop.type === "COMMERCE" || (prop.staff || []).length > 0 || (prop.propertyEvents || []).length > 0) && (
                                  <button
                                    onClick={() => setSelectedPropertyId(prop.id)}
                                    className="w-full text-center bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-bold uppercase py-2 rounded-b-lg border-t border-stone-200 transition-colors"
                                  >
                                    Gérer cette propriété
                                  </button>
                                )}
                              </PropertyCard>
                            );})}
                          </div>
                        </div>
                      )}

                      {/* Propriétés disponibles (admin) */}
                      {available.length > 0 && (
                        <div>
                          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3">
                            Biens disponibles — Registre Impérial
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {available.map((prop) => (
                              <PropertyCard key={prop.id} prop={prop} variant="admin">
                                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                                  <div className="font-mono text-lg font-black text-yellow-700">{prop.price.toLocaleString()} Écus</div>
                                  <button
                                    onClick={() => onBuyProperty && onBuyProperty(prop.id)}
                                    disabled={(user.balance || 0) < prop.price}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                  >
                                    <Coins size={12} /> Acheter
                                  </button>
                                </div>
                                {(user.balance || 0) < prop.price && (
                                  <div className="text-[10px] text-red-400 text-right">
                                    Il vous manque {(prop.price - (user.balance || 0)).toLocaleString()} Écus
                                  </div>
                                )}
                              </PropertyCard>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Propriétés en vente par des joueurs */}
                      {forSale.length > 0 && (
                        <div>
                          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3">
                            En vente par des citoyens
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {forSale.map((prop) => (
                              <PropertyCard key={prop.id} prop={prop} variant="player">
                                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                                  <div className="font-mono text-lg font-black text-yellow-700">{prop.salePrice.toLocaleString()} Écus</div>
                                  <button
                                    onClick={() => onBuyPropertyFromPlayer && onBuyPropertyFromPlayer(prop.id)}
                                    disabled={(user.balance || 0) < prop.salePrice}
                                    className="bg-yellow-500 text-stone-900 px-4 py-2 rounded-lg font-bold text-xs uppercase hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                  >
                                    <Coins size={12} /> Acheter
                                  </button>
                                </div>
                                {(user.balance || 0) < prop.salePrice && (
                                  <div className="text-[10px] text-red-400 text-right">
                                    Il vous manque {(prop.salePrice - (user.balance || 0)).toLocaleString()} Écus
                                  </div>
                                )}
                              </PropertyCard>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mes locations (en tant que locataire) */}
                      {myRentals.length > 0 && (
                        <div>
                          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3">
                            Mes locations
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myRentals.map((prop) => (
                              <PropertyCard key={prop.id} prop={prop} variant="owned">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center justify-between">
                                  <div className="text-xs">
                                    <span className="text-blue-700 font-bold">Locataire</span>
                                    <span className="text-blue-500 ml-2 font-mono">{prop.rental.dailyRate} Écus/jour</span>
                                    {prop.rental.startDate && <span className="text-blue-400 ml-2">depuis le {prop.rental.startDate}</span>}
                                    <div className="text-stone-400 mt-0.5">Propriétaire : {prop.ownerName}</div>
                                  </div>
                                  <button
                                    onClick={() => onLeaveTenancy && onLeaveTenancy(prop.id)}
                                    className="text-red-500 text-[10px] font-bold uppercase border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition-colors shrink-0"
                                  >
                                    Quitter
                                  </button>
                                </div>
                              </PropertyCard>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Biens à louer */}
                      {forRent.length > 0 && (
                        <div>
                          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3">
                            Biens à louer
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {forRent.map((prop) => (
                              <PropertyCard key={prop.id} prop={prop} variant="admin">
                                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                                  <div>
                                    <div className="font-mono text-lg font-black text-blue-700">{prop.rental.dailyRate} Écus/jour</div>
                                    <div className="text-[10px] text-stone-400">Propriétaire : {prop.ownerName}</div>
                                  </div>
                                  <button
                                    onClick={() => onRentProperty && onRentProperty(prop.id)}
                                    disabled={(user.balance || 0) < prop.rental.dailyRate}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                  >
                                    <Coins size={12} /> Louer
                                  </button>
                                </div>
                                {(user.balance || 0) < prop.rental.dailyRate && (
                                  <div className="text-[10px] text-red-400 text-right">
                                    Fonds insuffisants pour le premier jour de loyer
                                  </div>
                                )}
                              </PropertyCard>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lieux à visiter (auberges, châteaux, commerces publics) */}
                      {(() => {
                        const myCompanyIds2 = (companies || []).filter((c) => c.ownerId === user.id).map((c) => c.id);
                        const isMine2 = (p) => p.ownerId === user.id || (p.ownerType === "COMPANY" && myCompanyIds2.includes(p.ownerId));
                        const visitable = properties.filter((p) => p.ownerId && !isMine2(p) && ["MANOIR", "AUBERGE", "COMMERCE"].includes(p.type));
                        return visitable.length > 0 ? (
                          <div>
                            <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3">
                              Lieux à visiter
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {visitable.map((prop) => (
                                <PropertyCard key={prop.id} prop={prop} variant="admin">
                                  <button
                                    onClick={() => setSelectedPropertyId(prop.id)}
                                    className="w-full bg-stone-800 text-yellow-500 py-2 rounded font-bold text-xs uppercase hover:bg-stone-700 transition-colors mt-2"
                                  >
                                    Visiter
                                  </button>
                                </PropertyCard>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* État vide */}
                      {myProps.length === 0 && available.length === 0 && forSale.length === 0 && forRent.length === 0 && myRentals.length === 0 && (
                        <div className="text-center py-16">
                          <MapPin size={48} className="mx-auto mb-3 text-stone-300" />
                          <div className="text-stone-400 italic">Aucune propriété disponible pour le moment.</div>
                          <div className="text-[10px] text-stone-300 mt-1">Les biens immobiliers apparaîtront ici lorsqu'ils seront mis en vente.</div>
                        </div>
                      )}

                      {myProps.length === 0 && (available.length > 0 || forSale.length > 0) && (
                        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-center text-xs text-stone-400 italic">
                          Vous ne possédez aucun bien immobilier. Consultez les offres ci-dessus pour acquérir votre première propriété.
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* --- BLOC GUILDES --- */}
            {active === "guilds" && (
              <GuildsView
                guilds={guilds}
                user={user}
                onCreateGuild={onCreateGuild}
                onEditGuild={onEditGuild}
                onJoinGuild={onJoinGuild}
                onLeaveGuild={onLeaveGuild}
                onKickGuildMember={onKickGuildMember}
                onSetGuildMemberRole={onSetGuildMemberRole}
                onTransferGuildLeadership={onTransferGuildLeadership}
                onGuildDeposit={onGuildDeposit}
                onGuildWithdraw={onGuildWithdraw}
                onDissolveGuild={onDissolveGuild}
              />
            )}

            {/* --- BLOC CONTRATS --- */}
            {active === "contracts" && (
              <ContractsView
                contracts={contracts}
                citizens={safeUsers}
                user={user}
                onCreateContract={onCreateContract}
                onSignContract={onSignContract}
                onCancelContract={onCancelContract}
                onCompleteContract={onCompleteContract}
                onBreachContract={onBreachContract}
                onDeleteContract={onDeleteContract}
              />
            )}

            {/* --- BLOC PHYSIQUE & MAGIE --- */}
            {active === "physique_magie" && (
              <CitizenPhysicsMagicView
                user={user}
                onUpdateUser={onUpdateUser}
              />
            )}
            {active === "notifications" && (
              <NotificationCenterView
                allWithStatus={allWithStatus}
                grouped={grouped}
                categories={notifCategories}
                unreadCount={unreadCount}
                onNavigate={(route) => setActive(route)}
                onDismiss={dismiss}
                onDismissAll={dismissAll}
                onDismissCategory={dismissCategory}
                onUndismiss={undismiss}
                isDark={isDark}
              />
            )}
            {active === "settings" && (
              <SettingsView
                settings={settings}
                isDark={isDark}
                updateSetting={updateSetting}
                resetSettings={resetSettings}
                user={user}
              />
            )}
            {/* ----------------------------- */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CitizenLayout;
