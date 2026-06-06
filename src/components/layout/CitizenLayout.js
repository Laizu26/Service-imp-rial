import React, { useState, useEffect, useMemo } from "react";
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
  TrendingUp,
  TrendingDown,
  BarChart2,
  X,
  Edit3,
  Plane,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Swords,
  Sword,
} from "lucide-react";


import NotificationCenter from "../ui/NotificationCenter";
import Avatar from "../ui/Avatar";
import { ROLES, MARRIAGE_CONTRACT_TYPES } from "../../lib/constants";
import { getCitizenAge, formatRPDate, formatMoney, getRoleTheme, logEntryColor, logEntrySign, logEntryIsPositive } from "../../lib/gameUtils";
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
const FamilyTreasuryActions = ({ familyId, isHead, treasury, userBalance, onDeposit, onWithdraw, onTransfer, allFamilies }) => {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferTarget, setTransferTarget] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [activeOp, setActiveOp] = useState("deposit"); // "deposit" | "withdraw" | "transfer"

  const otherFamilies = (allFamilies || []).filter((f) => f.id !== familyId);

  return (
    <div className="space-y-3">
      {/* Onglets opérations */}
      <div className="flex gap-1">
        {[
          { id: "deposit", label: "Déposer" },
          isHead && { id: "withdraw", label: "Retirer" },
          isHead && otherFamilies.length > 0 && { id: "transfer", label: "Virer" },
        ].filter(Boolean).map((op) => (
          <button key={op.id} onClick={() => setActiveOp(op.id)}
            className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded border transition-all ${
              activeOp === op.id ? "bg-stone-800 border-stone-500 text-stone-200" : "border-stone-200 text-stone-400 hover:text-stone-600"
            }`}>
            {op.label}
          </button>
        ))}
      </div>

      {/* Dépôt */}
      {activeOp === "deposit" && (
        <div className="space-y-2">
          <div className="text-[9px] text-stone-400 mt-1">Votre solde : <span className="font-mono font-bold text-stone-600">{formatMoney(userBalance)}</span></div>
          <div className="flex gap-2">
            <input type="number" step="0.1" className="flex-1 p-2 border border-stone-200 rounded text-sm font-mono bg-white focus:border-stone-400 outline-none" placeholder="Montant" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
            <button
              onClick={() => { if (depositAmount) { onDeposit(familyId, depositAmount); setDepositAmount(""); } }}
              disabled={!depositAmount || parseFloat(depositAmount) <= 0 || parseFloat(depositAmount) > userBalance}
              className="bg-stone-800 text-yellow-500 px-4 py-2 rounded text-[10px] font-bold uppercase disabled:opacity-40 hover:bg-stone-700 transition-colors"
            >Déposer</button>
          </div>
        </div>
      )}

      {/* Retrait */}
      {activeOp === "withdraw" && isHead && (
        <div className="space-y-2">
          <div className="text-[9px] text-amber-600 mt-1">Trésorerie disponible : <span className="font-mono font-bold">{formatMoney(treasury)}</span></div>
          <div className="flex gap-2">
            <input type="number" step="0.1" className="flex-1 p-2 border border-amber-200 rounded text-sm font-mono bg-white focus:border-amber-400 outline-none" placeholder="Montant" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
            <button
              onClick={() => { if (withdrawAmount) { onWithdraw(familyId, withdrawAmount); setWithdrawAmount(""); } }}
              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > treasury}
              className="bg-amber-700 text-white px-4 py-2 rounded text-[10px] font-bold uppercase disabled:opacity-40 hover:bg-amber-600 transition-colors"
            >Retirer</button>
          </div>
        </div>
      )}

      {/* Virement inter-familles */}
      {activeOp === "transfer" && isHead && (
        <div className="space-y-2">
          <div className="text-[9px] text-blue-600 mt-1">Envoyer des fonds vers une autre famille/dynastie</div>
          <select value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)}
            className="w-full p-2 border border-blue-200 rounded text-xs bg-white focus:border-blue-400 outline-none">
            <option value="">— Famille destinataire —</option>
            {otherFamilies.map((f) => (
              <option key={f.id} value={f.id}>{f.type === "noble" ? `Dynastie ${f.dynastyName || f.lastName}` : `Famille ${f.lastName}`}</option>
            ))}
          </select>
          <input type="text" className="w-full p-2 border border-blue-200 rounded text-sm bg-white focus:border-blue-400 outline-none"
            placeholder="Motif (tribut, dot, remboursement…)" value={transferReason} onChange={(e) => setTransferReason(e.target.value)} />
          <div className="flex gap-2">
            <input type="number" className="flex-1 p-2 border border-blue-200 rounded text-sm font-mono bg-white focus:border-blue-400 outline-none"
              placeholder="Montant" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} />
            <button
              onClick={() => {
                if (transferTarget && transferAmount) {
                  onTransfer(familyId, transferTarget, transferAmount, transferReason);
                  setTransferAmount(""); setTransferTarget(""); setTransferReason("");
                }
              }}
              disabled={!transferTarget || !transferAmount || parseFloat(transferAmount) <= 0 || parseFloat(transferAmount) > treasury}
              className="bg-blue-700 text-white px-4 py-2 rounded text-[10px] font-bold uppercase disabled:opacity-40 hover:bg-blue-600 transition-colors"
            >Virer</button>
          </div>
          <div className="text-[9px] text-stone-400">Disponible : <span className="font-mono font-bold">{formatMoney(treasury)}</span></div>
        </div>
      )}

      {!isHead && activeOp !== "deposit" && (
        <div className="text-[9px] text-stone-400 italic border-t border-stone-100 pt-2">Seul le chef (ou le régent) peut retirer ou virer des fonds.</div>
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
            <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 gap-2">
              <div className="text-sm min-w-0">
                <span className="font-bold text-purple-700">{family.regentName || "Régent"}</span>
                <span className="text-[9px] text-purple-400 uppercase font-bold ml-2">Régent en exercice</span>
              </div>
              {isHead && (
                <button
                  onClick={() => onRemoveFamilyRegent(family.id)}
                  className="text-[9px] font-bold uppercase text-red-500 hover:text-red-400 border border-red-300 hover:border-red-400 px-2 py-1 rounded transition-colors shrink-0"
                >Révoquer</button>
              )}
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
          <div className="text-[9px] text-stone-400 italic">Le régent exerce tous les pouvoirs à la place du chef. Seul le chef peut nommer ou révoquer un régent.</div>
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
          if (price && parseFloat(price) > 0) {
            onSellProperty(propId, parseFloat(price));
            setOpen(false);
            setPrice("");
          }
        }}
        disabled={!price || parseFloat(price) <= 0}
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
          if (rate && parseFloat(rate) > 0) {
            onListPropertyForRent(propId, parseFloat(rate));
            setOpen(false);
            setRate("");
          }
        }}
        disabled={!rate || parseFloat(rate) <= 0}
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

/* ── Bourse citoyenne ── */
const Sparkline = ({ history }) => {
  if (!history || history.length < 2) return null;
  const prices = history.slice(0, 12).map(h => h.price).reverse();
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const w = 48, h = 16;
  const points = prices.map((p, i) => `${(i / (prices.length - 1)) * w},${h - ((p - min) / range) * h}`).join(" ");
  const color = prices[prices.length - 1] >= prices[0] ? "#10b981" : "#ef4444";
  return <svg width={w} height={h} className="opacity-70 shrink-0"><polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" /></svg>;
};

const CitizenBourse = ({ user, bourseListings, onBourseBuyShares, onBourseSellShares, globalLedger = [] }) => {
  const [bourseTab, setBourseTab] = useState("market");
  const [buyQty, setBuyQty] = useState({});
  const [sellQty, setSellQty] = useState({});
  const [bourseSearch, setBourseSearch] = useState("");

  const activeListing = bourseListings.filter((l) => l.isActive);
  const myHoldings = Object.entries(user.stockholdings || {}).filter(([lid, qty]) =>
    qty > 0 && bourseListings.some(l => l.id === lid)
  );
  const portfolioValue = myHoldings.reduce((sum, [lid, qty]) => {
    const l = bourseListings.find((x) => x.id === lid);
    return sum + (l ? l.pricePerShare * qty : 0);
  }, 0);

  const filteredListings = activeListing.filter(l => {
    const q = bourseSearch.toLowerCase();
    return !q || l.symbol.toLowerCase().includes(q) || l.companyName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* En-tête */}
      <div className="bg-gradient-to-br from-stone-900 to-emerald-950/30 border border-emerald-900/40 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-8xl opacity-5 select-none">📈</div>
        <div className="relative">
          <h2 className="text-2xl font-black font-serif text-stone-100 flex items-center gap-2">
            <TrendingUp size={22} className="text-emerald-400" /> Bourse Impériale
          </h2>
          <p className="text-xs text-stone-400 mt-1">Achetez et vendez des actions des sociétés de l'Empire.</p>
          <div className="flex gap-3 mt-3 flex-wrap">
            <div className="bg-emerald-900/30 border border-emerald-800/40 rounded-lg px-3 py-1.5">
              <div className="text-[8px] text-emerald-500 uppercase font-black">Sociétés cotées</div>
              <div className="text-lg font-black text-emerald-300">{activeListing.length}</div>
            </div>
            <div className="bg-amber-900/30 border border-amber-800/40 rounded-lg px-3 py-1.5">
              <div className="text-[8px] text-amber-500 uppercase font-black">Mon portefeuille</div>
              <div className="text-lg font-black font-mono text-amber-300">{formatMoney(portfolioValue)}</div>
            </div>
            <div className="bg-stone-800/40 border border-stone-700 rounded-lg px-3 py-1.5">
              <div className="text-[8px] text-stone-500 uppercase font-black">Mes lignes</div>
              <div className="text-lg font-black text-stone-200">{myHoldings.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200">
        {[
          { id: "market", label: "Marché", icon: <TrendingUp size={12} /> },
          { id: "portfolio", label: "Mon Portefeuille", icon: <BarChart2 size={12} /> },
          { id: "history", label: "Mes Transactions", icon: <History size={12} /> },
        ].map((t) => (
          <button key={t.id} onClick={() => setBourseTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 -mb-px transition-all ${
              bourseTab === t.id ? "border-emerald-500 text-emerald-700" : "border-transparent text-stone-400 hover:text-stone-600"
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* === MARCHÉ === */}
      {bourseTab === "market" && (
        <div className="space-y-2">
          {activeListing.length === 0 ? (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center">
              <TrendingUp size={36} className="mx-auto text-stone-300 mb-3" />
              <p className="text-sm text-stone-500">Aucune société n'est cotée pour le moment.</p>
            </div>
          ) : (
            <>
              <div className="relative mb-1">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input value={bourseSearch} onChange={e => setBourseSearch(e.target.value)}
                  placeholder="Rechercher un symbole ou une société..."
                  className="w-full pl-8 pr-3 py-2 border border-stone-200 rounded-lg text-xs bg-white outline-none focus:border-emerald-400" />
              </div>
              {filteredListings.length === 0 && activeListing.length > 0 && (
                <div className="text-center text-stone-400 italic text-xs py-6">Aucun résultat pour "{bourseSearch}"</div>
              )}
              {filteredListings.map((listing) => {
                const pct = listing.initialPrice ? ((listing.pricePerShare - listing.initialPrice) / listing.initialPrice * 100) : 0;
                const myShares = (user.stockholdings || {})[listing.id] || 0;
                const qty = parseInt(buyQty[listing.id] || 1);
                const canAfford = (user.balance || 0) >= qty * listing.pricePerShare;
                return (
                  <div key={listing.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 min-w-[60px] text-center shrink-0">
                        <div className="font-black font-mono text-emerald-700 text-sm">{listing.symbol}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-stone-800 text-sm truncate">{listing.companyName}</div>
                        {listing.description && <div className="text-[10px] text-stone-400 truncate">{listing.description}</div>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black font-mono text-stone-800 text-base">{formatMoney(listing.pricePerShare)}</div>
                        <div className={`text-[10px] font-black flex items-center justify-end gap-0.5 ${pct > 0 ? "text-green-600" : pct < 0 ? "text-red-500" : "text-stone-400"}`}>
                          {pct > 0 ? <TrendingUp size={10} /> : pct < 0 ? <TrendingDown size={10} /> : null}
                          {pct !== 0 ? `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%` : "—"}
                        </div>
                        <Sparkline history={listing.priceHistory} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-2.5 bg-stone-50/50">
                      <div className="text-[9px] text-stone-500 flex gap-3 flex-wrap">
                        <span>{listing.sharesOnMarket.toLocaleString()} dispo</span>
                        <span className="text-stone-300">|</span>
                        <span>{listing.totalShares.toLocaleString()} total</span>
                        {myShares > 0 && <><span className="text-stone-300">|</span><span className="text-amber-600 font-bold">Vous: {myShares}</span></>}
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <input type="number" min={1} max={listing.sharesOnMarket}
                          className="w-16 p-1.5 border border-stone-200 rounded text-sm font-mono text-center bg-white focus:border-emerald-400 outline-none"
                          value={buyQty[listing.id] || 1}
                          onChange={(e) => setBuyQty((q) => ({ ...q, [listing.id]: e.target.value }))}
                        />
                        <button
                          disabled={!listing.isActive || listing.sharesOnMarket < 1 || !canAfford || qty <= 0 || qty > listing.sharesOnMarket}
                          onClick={() => { onBourseBuyShares(listing.id, qty); setBuyQty((q) => ({ ...q, [listing.id]: 1 })); }}
                          className="bg-emerald-600 text-white px-4 py-1.5 rounded text-[10px] font-black uppercase hover:bg-emerald-500 disabled:opacity-40 transition-colors">
                          Acheter
                        </button>
                      </div>
                    </div>
                    {!canAfford && qty > 0 && (
                      <div className="px-4 py-1 bg-red-50 text-red-500 text-[9px] font-bold border-t border-red-100">
                        Fonds insuffisants — coût : {formatMoney((qty * listing.pricePerShare))} / solde : {formatMoney((user.balance || 0))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* === PORTEFEUILLE === */}
      {bourseTab === "portfolio" && (
        <div className="space-y-3">
          {myHoldings.length === 0 ? (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center">
              <BarChart2 size={36} className="mx-auto text-stone-300 mb-3" />
              <p className="text-sm text-stone-500">Vous ne possédez aucune action.</p>
              <button onClick={() => setBourseTab("market")} className="text-emerald-600 text-xs underline mt-2">Aller au marché</button>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
                <div className="text-[10px] text-amber-600 uppercase font-black tracking-widest">Valeur totale du portefeuille</div>
                <div className="text-3xl font-black font-mono text-amber-700 mt-1">{formatMoney(portfolioValue)}</div>
                <div className="text-xs text-amber-500 mt-0.5">{myHoldings.length} ligne(s) — solde personnel : {formatMoney((user.balance || 0))}</div>
              </div>
              {myHoldings.map(([lid, qty]) => {
                const listing = bourseListings.find((l) => l.id === lid);
                if (!listing) return null;
                const value = listing.pricePerShare * qty;
                const pct = listing.initialPrice ? ((listing.pricePerShare - listing.initialPrice) / listing.initialPrice * 100) : 0;
                const sQty = parseInt(sellQty[lid] || 1);
                const now = Date.now();
                const lockedQty = (user.esppLocks || [])
                  .filter(l => l.listingId === lid && l.unlocksAt > now)
                  .reduce((sum, l) => sum + l.qty, 0);
                return (
                  <div key={lid} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 min-w-[60px] text-center shrink-0">
                        <div className="font-black font-mono text-emerald-700 text-sm">{listing.symbol}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-stone-800 text-sm truncate">{listing.companyName}</div>
                        <div className="text-[10px] text-stone-500">{qty.toLocaleString()} action(s) × {formatMoney(listing.pricePerShare)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black font-mono text-stone-800 text-base">{formatMoney(value)}</div>
                        <div className={`text-[10px] font-black ${pct > 0 ? "text-green-600" : pct < 0 ? "text-red-500" : "text-stone-400"}`}>
                          {pct !== 0 ? `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%` : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-stone-50 border-t border-stone-100">
                      <span className="text-[9px] text-stone-400 flex-1">Cours : {formatMoney(listing.pricePerShare)}/action</span>
                      {lockedQty > 0 && (
                        <span className="text-[9px] text-amber-600 font-bold shrink-0">
                          🔒 {lockedQty} bloquée(s)
                        </span>
                      )}
                      <input type="number" min={1} max={qty - lockedQty}
                        className="w-16 p-1.5 border border-stone-200 rounded text-sm font-mono text-center bg-white focus:border-red-400 outline-none"
                        value={sellQty[lid] || 1}
                        onChange={(e) => setSellQty((q) => ({ ...q, [lid]: e.target.value }))}
                      />
                      <button
                        disabled={sQty <= 0 || sQty > (qty - lockedQty)}
                        onClick={() => { onBourseSellShares(lid, sQty); setSellQty((q) => ({ ...q, [lid]: 1 })); }}
                        className="bg-red-500 text-white px-4 py-1.5 rounded text-[10px] font-black uppercase hover:bg-red-400 disabled:opacity-40 transition-colors">
                        Vendre
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
      {/* === HISTORIQUE DES TRANSACTIONS === */}
      {bourseTab === "history" && (() => {
        const myBourseHistory = (globalLedger || [])
          .filter(e => ["BOURSE_BUY", "BOURSE_SELL", "BOURSE_DIVIDEND", "ESPP_BUY"].includes(e.type) &&
            (e.fromName === user.name || e.toName === user.name))
          .slice(0, 40);
        const typeLabel = { BOURSE_BUY: "Achat", BOURSE_SELL: "Vente", BOURSE_DIVIDEND: "Dividende", ESPP_BUY: "ESPP" };
        const typeColor = { BOURSE_BUY: "text-green-600 bg-green-50 border-green-200", BOURSE_SELL: "text-red-600 bg-red-50 border-red-200", BOURSE_DIVIDEND: "text-blue-600 bg-blue-50 border-blue-200", ESPP_BUY: "text-emerald-600 bg-emerald-50 border-emerald-200" };
        return myBourseHistory.length === 0 ? (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center text-stone-400 italic text-xs">
            Aucune transaction boursière enregistrée.
          </div>
        ) : (
          <div className="space-y-2">
            {myBourseHistory.map(e => {
              const isIn = e.toName === user.name;
              return (
                <div key={e.id} className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${typeColor[e.type] || "text-stone-600 bg-stone-50 border-stone-200"}`}>
                    {typeLabel[e.type] || e.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-stone-700 truncate">{e.reason || "Transaction"}</div>
                    <div className="text-[9px] text-stone-400">{new Date(e.timestamp).toLocaleDateString("fr-FR")}</div>
                  </div>
                  <span className={`font-mono font-black text-sm shrink-0 ${isIn ? "text-green-600" : "text-red-500"}`}>
                    {isIn ? "+" : "-"}{formatMoney(e.amount || 0)}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })()}
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
    onInternalTravel,
    onTransfer,
    onProposeDebt,
    onSignDebt,
    onPayDebt,
    onCancelDebt,
    onBuyItem,
    onGiveItem,
    onUseItem,
    onBuySlave,
    onConfiscateSlaveMoney,
    onSelfManumit,
    onOwnerProposeMarriage,
    onOwnerAcceptMarriage,
    onOwnerRejectMarriage,
    onOwnerBreakMarriage,
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
    onEditJournalEntry,
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
    maisonServiceCategories = [],
    maisonSubscriptions = [],
    maisonSubscriptionPrice = 50,
    onJoinMaisonQueue,
    onLeaveMaisonQueue,
    onSubmitMaisonReview,
    onBuyMaisonSubscription,
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
    bourseListings = [],
    onBourseBuyShares,
    onBourseSellShares,
    onBourseCreateListing,
    onBourseEditListing,
    onBoursePayDividends,
    onUpdateCompanyESPP,
    onEmployeeBuyShares,
    onPayBuyout,
    onClaimCorvee,
    onSetFamilyHead,
    onFamilyDeposit,
    onFamilyWithdraw,
    onFamilyTreasuryTransfer,
    onEditFamilyInfo,
    onTransferFamilyHead,
    onSetFamilyRegent,
    onRemoveFamilyRegent,
    onSubmitBook,
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
    onGuardIssueOrder,
    onGuardUpdateMember,
    onGuardCompleteOrder,
    onGuardImprison,
    onGuardRelease,
    bookmarks,
    onBookmarksChange,
    onDismissedChange,
    combatSessions = [],
  } = props;

  const gd = gameDate || { day: 1, month: 1, year: 1200 };

  // --- 1. HOOKS (DOIVENT ÊTRE EN PREMIER) ---
  const [active, setActive] = useState("gazette");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [showRestorePanel, setShowRestorePanel] = useState(false);

  // Onglets non-fermables (essentiels)
  const NON_CLOSEABLE = new Set(["profil", "notifications", "settings"]);

  const hiddenTabs = settings.hiddenTabs || [];

  const closeTab = (tabId) => {
    const next = [...hiddenTabs, tabId];
    updateSetting("hiddenTabs", next);
    // Si l'onglet actif est fermé, basculer sur gazette
    if (active === tabId) setActive("gazette");
  };

  const restoreTab = (tabId) => {
    updateSetting("hiddenTabs", hiddenTabs.filter((id) => id !== tabId));
  };


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
  const [journalTitle, setJournalTitle] = useState("");
  const [journalMood, setJournalMood] = useState("neutre");
  const [journalSearch, setJournalSearch] = useState("");
  const [journalEditId, setJournalEditId] = useState(null);
  const [journalEditContent, setJournalEditContent] = useState("");
  const [journalEditTitle, setJournalEditTitle] = useState("");
  const [journalEditMood, setJournalEditMood] = useState("neutre");
  const [journalExpanded, setJournalExpanded] = useState(new Set());
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [annuaireTab, setAnnuaireTab] = useState("citoyens");
  const [annuaireSearch, setAnnuaireSearch] = useState("");
  const [annuaireFilter, setAnnuaireFilter] = useState("ALL");
  const [selectedCitizen, setSelectedCitizen] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState(null);
  const [annuaireCompanySearch, setAnnuaireCompanySearch] = useState("");
  const [annuaireCountrySearch, setAnnuaireCountrySearch] = useState("");
  const [annuaireFamilySearch, setAnnuaireFamilySearch] = useState("");

  const [travelDestCountry, setTravelDestCountry] = useState("");
  const [travelDestRegion, setTravelDestRegion] = useState("");

  // Garde (citoyen)
  const [guardTab, setGuardTab] = useState("ordres");
  const [guardExpandedOrder, setGuardExpandedOrder] = useState(null);
  const [guardOrderTitle, setGuardOrderTitle] = useState("");
  const [guardOrderContent, setGuardOrderContent] = useState("");
  const [guardOrderMinLevel, setGuardOrderMinLevel] = useState(1);
  const [guardOrderUrgent, setGuardOrderUrgent] = useState(false);
  const [guardReportOrderId, setGuardReportOrderId] = useState(null);
  const [guardReportText, setGuardReportText] = useState("");
  const [guardPrisonCitizenId, setGuardPrisonCitizenId] = useState("");
  const [guardPrisonReason, setGuardPrisonReason] = useState("");

  // Famille / Dynastie
  const [familyTab, setFamilyTab] = useState("presentation");
  const [showFullLog, setShowFullLog] = useState(false);
  const [guardPrisonSentence, setGuardPrisonSentence] = useState("");

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

  // Reset des états de vue famille lors d'un changement de session utilisateur
  useEffect(() => {
    setFamilyTab("presentation");
    setShowFullLog(false);
  }, [user?.id]);

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
    gd,
    onDismissedChange
  );

  // --- 3. VARIABLES CALCULÉES (Sécurisées avec ?.) ---
  // Utilisation de l'opérateur optionnel pour éviter tout crash résiduel
  const isSlave = user?.status === "Esclave";

  const permissions = user?.permissions || {};

  const canUsePost = !isSlave || !!permissions.post;
  const canUseBank = !isSlave || !!permissions.bank;
  const canUseTravel = !isSlave || !!permissions.travel;

  // Sécurité sur users
  const safeUsers = Array.isArray(users) ? users : [];
  const mySlaves = safeUsers.filter((u) => u.ownerId === user?.id);

  const safeCountries = Array.isArray(countries) ? countries : [];

  // Garde
  const myCountryData = (safeCountries || []).find((c) => c.id === user?.countryId);
  const myGuard = myCountryData?.guard || {};
  const myGuardMember = (myGuard.members || []).find((m) => m.citizenId === user?.id);
  const isGuard = !!myGuardMember;

  const menuGroups = useMemo(() => [
    {
      id: "monde",
      label: "Information & Monde",
      items: [
        { id: "gazette",  label: "Gazette",       icon: Scroll },
        { id: "library",  label: "Bibliothèque",  icon: Book },
        { id: "annuaire", label: "Annuaire",       icon: Eye },
        (!isBanned && !isPrisoner && canUseTravel) && { id: "travel", label: "Voyage", icon: Map },
      ].filter(Boolean),
    },
    {
      id: "perso",
      label: "Personnelle",
      items: [
        { id: "profil", label: "Mon Registre", icon: User },
        (!isBanned && canUsePost) && { id: "msg", label: "Poste Impériale", icon: Mail },
        { id: "mariage", label: "Mariage & Famille", icon: Heart },
        !isSlave && { id: "famille", label: "Ma Dynastie", icon: HeartHandshake },
        { id: "physique_magie", label: "Physique & Magie", icon: Zap },
        { id: "combat", label: "Fiche de Combat", icon: Swords },
        isSlave && { id: "servitude", label: "Ma Servitude", icon: ShieldAlert },
      ].filter(Boolean),
    },
    {
      id: "travail",
      label: "Travail & Économie",
      items: [
        { id: "my_company", label: "Mon Entreprise", icon: Briefcase },
        { id: "inventory",  label: "Inventaire",     icon: Box },
        canUseBank && { id: "bank", label: "Banque", icon: Landmark },
        { id: "bourse",     label: "Bourse",         icon: TrendingUp },
        { id: "properties", label: "Propriétés",     icon: MapPin },
        { id: "guilds",     label: "Guildes",        icon: Users },
        { id: "asia",       label: "Maison Asia",    icon: Gem },
        { id: "contracts",  label: "Contrats",       icon: Scroll },
        isGuard && { id: "garde", label: "Garde Impériale", icon: Shield },
        mySlaves.length > 0 && { id: "slaves", label: "Main d'Œuvre", icon: Gavel },
      ].filter(Boolean),
    },
  ], [isSlave, canUseBank, canUsePost, canUseTravel, isBanned, isPrisoner, isGuard, mySlaves.length]);

  // --- 2. SÉCURITÉ CRITIQUE ---
  // Si user est undefined ou null, on affiche un loader et on ARRÊTE le rendu ici.
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e6e2d6] text-stone-500 font-serif animate-pulse">
        Chargement de l'identité...
      </div>
    );
  }

  // Autres variables qui nécessitent user non-null
  const owner =
    isSlave && user.ownerId
      ? (users || []).find((u) => u.id === user.ownerId)
      : null;

  // Dérivés mariage
  const currentSpouses = user.spouses || (user.spouseId ? [{ id: user.spouseId, name: safeUsers.find(u => u.id === user.spouseId)?.name || "…" }] : []);

  // Sécurité sur travelRequests
  const safeRequests = Array.isArray(travelRequests) ? travelRequests : [];
  const myPendingRequests = safeRequests.filter(
    (r) => r.citizenId === user.id && r.status === "PENDING"
  );

  const theme = getRoleTheme(user.role);
  const roleInfo = ROLES[user.role] || ROLES.CITOYEN;

  const myGuardRank = isGuard ? (myGuard.ranks || []).find((r) => r.id === myGuardMember.rankId) : null;

  // Badges du citoyen
  const safeCompanies = Array.isArray(companies) ? companies : [];
  const ownedCompany = safeCompanies.find((c) => c.ownerId === user.id);
  const employedCompany = safeCompanies.find(
    (c) => (c.employees || []).includes(user.id) || (c.slaves || []).includes(user.id)
  );

  // Liste plate utilisée pour la barre mobile
  const menuItems = [
    ...menuGroups.flatMap((g) => g.items),
    { id: "notifications", label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`, icon: Bell },
  ];

  // --- 4. RENDU ---
  return (
    <div
      className="flex h-screen font-serif text-stone-200 overflow-hidden bg-stone-950"
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

        <nav className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent ${settings.sidebarCollapsed ? "p-2" : "p-4"}`}>
          {menuGroups.map((group, gIdx) => (
            <div key={group.id} className={gIdx > 0 ? "mt-4" : ""}>
              {/* Séparateur de groupe */}
              {!settings.sidebarCollapsed ? (
                <div className="flex items-center gap-2 px-1 mb-1.5">
                  <div className="flex-1 h-px bg-stone-800" />
                  <span className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-600 whitespace-nowrap">{group.label}</span>
                  <div className="flex-1 h-px bg-stone-800" />
                </div>
              ) : (
                gIdx > 0 && <div className="h-px bg-stone-800 mx-1 mb-2 mt-2" />
              )}
              <div className="space-y-0.5">
                {group.items
                  .filter((item) => !hiddenTabs.includes(item.id))
                  .map((item) => (
                  <div key={item.id} className="relative group/tab">
                    <button
                      onClick={() => setActive(item.id)}
                      title={settings.sidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center ${settings.sidebarCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-2.5"} rounded-xl transition-all duration-200 group ${
                        active === item.id
                          ? "bg-[#e6dcc3] text-stone-900 shadow-[0_4px_12px_rgba(0,0,0,0.3)] translate-x-1"
                          : "text-stone-400 hover:bg-stone-800 hover:text-stone-100 hover:translate-x-1"
                      }`}
                    >
                      <item.icon
                        size={16}
                        className={`shrink-0 transition-colors ${
                          active === item.id
                            ? "text-stone-900"
                            : "text-stone-500 group-hover:text-stone-300"
                        }`}
                      />
                      {!settings.sidebarCollapsed && (
                        <span className="text-[10px] font-black uppercase tracking-widest flex-1 text-left">
                          {item.label}
                        </span>
                      )}
                    </button>
                    {/* Bouton fermer — visible au survol, sauf sidebar réduite et non-closeables */}
                    {!settings.sidebarCollapsed && !NON_CLOSEABLE.has(item.id) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); closeTab(item.id); }}
                        title={`Fermer « ${item.label} »`}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/tab:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded hover:bg-stone-700 text-stone-500 hover:text-stone-200 z-10"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Notifications — hors catégories */}
          <div className="mt-4">
            {!settings.sidebarCollapsed && <div className="flex items-center gap-2 px-1 mb-1.5"><div className="flex-1 h-px bg-stone-800" /></div>}
            <button
              onClick={() => setActive("notifications")}
              title={settings.sidebarCollapsed ? "Notifications" : undefined}
              className={`w-full flex items-center ${settings.sidebarCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-2.5"} rounded-xl transition-all duration-200 group ${
                active === "notifications"
                  ? "bg-[#e6dcc3] text-stone-900 shadow-[0_4px_12px_rgba(0,0,0,0.3)] translate-x-1"
                  : "text-stone-400 hover:bg-stone-800 hover:text-stone-100 hover:translate-x-1"
              }`}
            >
              <Bell
                size={16}
                className={`shrink-0 transition-colors ${active === "notifications" ? "text-stone-900" : "text-stone-500 group-hover:text-stone-300"}`}
              />
              {!settings.sidebarCollapsed && (
                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="bg-red-600 text-white text-[8px] font-black rounded-full px-1.5 py-0.5 leading-none">{unreadCount}</span>
                  )}
                </span>
              )}
              {settings.sidebarCollapsed && unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>

          {/* ── Bouton restaurer onglets fermés ── */}
          {!settings.sidebarCollapsed && hiddenTabs.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowRestorePanel((v) => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-600 hover:text-stone-300 hover:bg-stone-800 transition-all"
              >
                <PlusCircle size={13} className="shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {hiddenTabs.length} onglet{hiddenTabs.length > 1 ? "s" : ""} masqué{hiddenTabs.length > 1 ? "s" : ""}
                </span>
              </button>

              {showRestorePanel && (
                <div className="mt-1 mx-1 bg-stone-800 rounded-xl border border-stone-700 overflow-hidden">
                  <div className="px-3 py-2 border-b border-stone-700 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Restaurer</span>
                    <button onClick={() => setShowRestorePanel(false)} className="text-stone-600 hover:text-stone-300">
                      <X size={12} />
                    </button>
                  </div>
                  <div className="p-1">
                    {menuGroups.flatMap((g) => g.items)
                      .filter((item) => hiddenTabs.includes(item.id))
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => restoreTab(item.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-stone-400 hover:bg-stone-700 hover:text-stone-100 transition-colors"
                        >
                          <item.icon size={13} className="shrink-0 text-stone-500" />
                          <span className="text-[10px] font-bold uppercase tracking-wide flex-1 text-left">{item.label}</span>
                          <PlusCircle size={12} className="text-stone-600 hover:text-stone-300 shrink-0" />
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
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

        <main className={`flex-1 min-h-0 ${active === "msg" ? "overflow-hidden p-0" : "overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-stone-900"}`}>
          <div className={`${active === "msg" ? "hidden" : ""} md:hidden flex mb-6 bg-stone-900/80 backdrop-blur-sm p-1.5 rounded-2xl border border-stone-800 shadow-xl overflow-x-auto scrollbar-hide snap-x`}>
            {menuItems.filter((item) => !hiddenTabs.includes(item.id)).map((item) => (
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

          <div className={active === "msg" ? "h-full w-full" : "max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10"}>
            {active === "gazette" && <GazetteView gazette={gazette} gameDate={gd} userCountryId={user.countryId} />}

            {/* --- BLOC BIBLIOTHÈQUE --- */}
            {active === "library" && (
              <LibraryView
                countries={safeCountries}
                session={user}
                users={safeUsers}
                onSubmitBook={onSubmitBook}
                bookmarks={bookmarks}
                onBookmarksChange={onBookmarksChange}
              />
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
                onUseItem={onUseItem}
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
                bourseListings={bourseListings}
                onBourseCreateListing={onBourseCreateListing}
                onBourseEditListing={onBourseEditListing}
                onBoursePayDividends={onBoursePayDividends}
                onUpdateCompanyESPP={onUpdateCompanyESPP}
                onEmployeeBuyShares={onEmployeeBuyShares}
                onPayBuyout={onPayBuyout}
                onClaimCorvee={onClaimCorvee}
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
              canUseTravel && (() => {
                const currentCountry = safeCountries.find((c) => c.id === (user.locationCountryId || user.countryId));
                const pendingReq = myPendingRequests[0] || null;
                const destCountry = safeCountries.find((c) => c.id === travelDestCountry);
                const visaFee = destCountry?.laws?.entryVisaFee || 0;
                const travelHistory = safeRequests.filter((r) => r.citizenId === user.id && r.status === "APPROVED").slice(0, 8);
                const rejectedReqs = safeRequests.filter((r) => r.citizenId === user.id && r.status === "REJECTED").slice(0, 3);
                const otherCountries = safeCountries.filter((c) => c.id !== (user.locationCountryId || user.countryId));

                return (
                  <div className="space-y-5">
                    {/* === EN-TÊTE === */}
                    <div className="bg-[#fdf6e3] rounded-xl shadow-lg border-t-4 border-stone-400 p-5 md:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center shrink-0">
                          <Map size={20} className="text-amber-400" />
                        </div>
                        <div>
                          <h2 className="text-base font-black uppercase tracking-widest text-stone-800 font-serif">Bureau des Voyages</h2>
                          <p className="text-[9px] text-stone-500 uppercase tracking-widest">Laissez-passer & Visas Impériaux</p>
                        </div>
                      </div>

                      {/* Position actuelle */}
                      <div className="bg-stone-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-stone-700 flex items-center justify-center shrink-0">
                          <MapPin size={22} className="text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] text-stone-500 uppercase tracking-widest font-black mb-0.5">Vous vous trouvez actuellement</div>
                          <div className="text-base font-black text-stone-100 font-serif">{currentCountry?.name || "Empire"}</div>
                          {user.currentPosition && (
                            <div className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
                              <MapPin size={10} /> {user.currentPosition}
                            </div>
                          )}
                        </div>
                        {user.locationCountryId && user.locationCountryId !== user.countryId && (
                          <div className="text-right shrink-0">
                            <div className="text-[8px] text-stone-500 uppercase tracking-widest">Allégeance</div>
                            <div className="text-xs font-bold text-amber-400">{safeCountries.find((c) => c.id === user.countryId)?.name || "—"}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* === DEMANDE EN COURS === */}
                    {pendingReq && (() => {
                      const fromC = safeCountries.find((c) => c.id === pendingReq.fromCountry);
                      const toC = safeCountries.find((c) => c.id === pendingReq.toCountry);
                      const isIntra = pendingReq.fromCountry === pendingReq.toCountry;
                      const exitOk = pendingReq.validations?.exit || isIntra;
                      const entryOk = pendingReq.validations?.entry;
                      return (
                        <div className="bg-[#fdf6e3] rounded-xl shadow border border-amber-200 overflow-hidden">
                          <div className="bg-amber-800/10 border-b border-amber-200 px-5 py-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-widest text-amber-700">Laissez-passer en cours de traitement</span>
                          </div>
                          <div className="p-5">
                            {/* Trajet */}
                            <div className="flex items-center gap-3 mb-5">
                              <div className="flex-1 bg-stone-100 rounded-lg p-3 text-center">
                                <div className="text-[8px] text-stone-500 uppercase tracking-widest">Départ</div>
                                <div className="text-sm font-black text-stone-800 mt-0.5">{fromC?.name || "—"}</div>
                              </div>
                              <div className="flex flex-col items-center gap-1 shrink-0">
                                <Plane size={18} className="text-amber-600" />
                                <div className="text-[8px] text-stone-400 uppercase tracking-widest font-black">{isIntra ? "Interne" : "International"}</div>
                              </div>
                              <div className="flex-1 bg-stone-100 rounded-lg p-3 text-center">
                                <div className="text-[8px] text-stone-500 uppercase tracking-widest">Destination</div>
                                <div className="text-sm font-black text-stone-800 mt-0.5">{toC?.name || "—"}</div>
                                {pendingReq.toRegion && <div className="text-[10px] text-stone-500">{pendingReq.toRegion}</div>}
                              </div>
                            </div>

                            {/* Timeline */}
                            {!isIntra && (
                              <div className="flex items-center gap-2">
                                <div className={`flex-1 rounded-lg p-2.5 text-center border ${exitOk ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                                  <div className={`text-[8px] font-black uppercase tracking-widest ${exitOk ? "text-green-600" : "text-amber-600"}`}>
                                    {exitOk ? "✓ Visa Sortie" : "⏳ Visa Sortie"}
                                  </div>
                                  <div className={`text-[9px] mt-0.5 ${exitOk ? "text-green-500" : "text-amber-500"}`}>
                                    {exitOk ? "Accordé" : "En attente"}
                                  </div>
                                </div>
                                <div className="text-stone-400 shrink-0">→</div>
                                <div className={`flex-1 rounded-lg p-2.5 text-center border ${entryOk ? "bg-green-50 border-green-200" : exitOk ? "bg-amber-50 border-amber-200" : "bg-stone-50 border-stone-200"}`}>
                                  <div className={`text-[8px] font-black uppercase tracking-widest ${entryOk ? "text-green-600" : exitOk ? "text-amber-600" : "text-stone-400"}`}>
                                    {entryOk ? "✓ Visa Entrée" : exitOk ? "⏳ Visa Entrée" : "Visa Entrée"}
                                  </div>
                                  <div className={`text-[9px] mt-0.5 ${entryOk ? "text-green-500" : exitOk ? "text-amber-500" : "text-stone-400"}`}>
                                    {entryOk ? "Accordé" : exitOk ? "En attente" : "En attente du visa sortie"}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="mt-3 text-[9px] text-stone-400 text-right font-mono">
                              Soumis le {new Date(pendingReq.timestamp).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* === REJET RÉCENT === */}
                    {!pendingReq && rejectedReqs.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                          <X size={14} className="text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-black text-red-700 uppercase tracking-widest">Dernière demande refusée</div>
                          <div className="text-xs text-red-600 mt-0.5">
                            {safeCountries.find((c) => c.id === rejectedReqs[0].toCountry)?.name} — {rejectedReqs[0].toRegion}
                          </div>
                          {rejectedReqs[0].rejectionReason && (
                            <div className="text-[10px] text-red-500 italic mt-1">« {rejectedReqs[0].rejectionReason} »</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* === NOUVELLE DEMANDE (si pas de demande en cours) === */}
                    {!pendingReq && (
                      <div className="bg-[#fdf6e3] rounded-xl shadow border border-stone-200">
                        <div className="px-5 py-4 border-b border-stone-200">
                          <h3 className="text-xs font-black uppercase tracking-widest text-stone-700 flex items-center gap-2">
                            <Plane size={14} className="text-stone-500" /> Nouvelle demande de voyage
                          </h3>
                        </div>
                        <div className="p-5 space-y-4">
                          {/* Liste des pays */}
                          <div>
                            <div className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-2">Choisir une destination</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                              {/* Voyage intérieur */}
                              <button
                                onClick={() => { setTravelDestCountry("__internal__"); setTravelDestRegion(""); }}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                  travelDestCountry === "__internal__"
                                    ? "border-green-400 bg-green-50"
                                    : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
                                }`}
                              >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${travelDestCountry === "__internal__" ? "bg-green-100" : "bg-stone-100"}`}>
                                  <MapPin size={16} className={travelDestCountry === "__internal__" ? "text-green-600" : "text-stone-500"} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-black text-stone-800">Se déplacer dans {currentCountry?.name || "le pays actuel"}</div>
                                  <div className="text-[9px] text-stone-500">Aucun visa requis — déplacement immédiat</div>
                                </div>
                                <div className="ml-auto shrink-0">
                                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded border bg-green-50 border-green-200 text-green-700">Gratuit</span>
                                </div>
                              </button>

                              {otherCountries.map((c) => {
                                const fee = c.laws?.entryVisaFee || 0;
                                const isSelected = travelDestCountry === c.id;
                                return (
                                  <button key={c.id}
                                    onClick={() => { setTravelDestCountry(c.id); setTravelDestRegion(""); }}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                      isSelected ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
                                    }`}
                                  >
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-amber-100" : "bg-stone-100"}`}>
                                      <Landmark size={16} className={isSelected ? "text-amber-600" : "text-stone-500"} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-black text-stone-800 truncate">{c.name}</div>
                                      <div className="text-[9px] text-stone-500">{(c.regions || []).length} région{(c.regions || []).length !== 1 ? "s" : ""}</div>
                                    </div>
                                    <div className="shrink-0">
                                      {fee > 0
                                        ? <span className="text-[8px] font-black px-1.5 py-0.5 rounded border bg-amber-50 border-amber-200 text-amber-700">{formatMoney(fee)}</span>
                                        : <span className="text-[8px] font-black px-1.5 py-0.5 rounded border bg-green-50 border-green-200 text-green-700">Libre</span>
                                      }
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Région */}
                          {travelDestCountry && (() => {
                            const isInternal = travelDestCountry === "__internal__";
                            const regions = isInternal ? (currentCountry?.regions || []) : (destCountry?.regions || []);
                            if (regions.length === 0) return null;
                            return (
                              <div>
                                <div className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-2">
                                  {isInternal ? "Choisir une région" : "Région de destination"}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {regions.map((r) => {
                                    const rName = r.name || r;
                                    return (
                                      <button key={rName} onClick={() => setTravelDestRegion(rName)}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                          travelDestRegion === rName
                                            ? "bg-stone-800 text-white border-stone-700"
                                            : "bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:bg-stone-50"
                                        }`}>
                                        {rName}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Résumé + bouton */}
                          {travelDestCountry && (() => {
                            const isInternal = travelDestCountry === "__internal__";
                            if (isInternal) {
                              return (
                                <div className="rounded-xl p-4 border space-y-3 bg-green-50 border-green-200">
                                  <div className="flex items-start gap-3">
                                    <MapPin size={16} className="text-green-600 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                      <div className="text-xs font-black text-stone-800">
                                        Déplacement intérieur — {currentCountry?.name}
                                        {travelDestRegion ? ` · ${travelDestRegion}` : ""}
                                      </div>
                                      <div className="text-[10px] text-green-700 mt-1">Gratuit et immédiat — aucun visa requis</div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => { onInternalTravel && onInternalTravel(travelDestRegion || "Capitale"); setTravelDestCountry(""); setTravelDestRegion(""); }}
                                    className="w-full py-2.5 bg-green-700 text-white font-black uppercase text-[10px] tracking-widest rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <MapPin size={13} /> Se déplacer {travelDestRegion ? `vers ${travelDestRegion}` : ""}
                                  </button>
                                </div>
                              );
                            }
                            return (
                              <div className={`rounded-xl p-4 border space-y-3 ${visaFee > 0 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
                                <div className="flex items-start gap-3">
                                  <Plane size={16} className={visaFee > 0 ? "text-amber-600 mt-0.5 shrink-0" : "text-green-600 mt-0.5 shrink-0"} />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-black text-stone-800">
                                      {currentCountry?.name || "—"} → {destCountry?.name || "—"}
                                      {travelDestRegion ? ` · ${travelDestRegion}` : ""}
                                    </div>
                                    {visaFee > 0 ? (
                                      <div className="text-[10px] text-amber-700 mt-1 flex items-center gap-1">
                                        <Coins size={10} /> Frais de visa : <span className="font-black">{formatMoney(visaFee)}</span>
                                        {(user.balance || 0) < visaFee && (
                                          <span className="text-red-600 font-black ml-1">— Solde insuffisant !</span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-green-700 mt-1">Entrée libre — aucun frais de visa</div>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => onRequestTravel(travelDestCountry, travelDestRegion || "Frontière")}
                                  disabled={visaFee > 0 && (user.balance || 0) < visaFee}
                                  className="w-full py-2.5 bg-stone-800 text-amber-300 font-black uppercase text-[10px] tracking-widest rounded-lg hover:bg-stone-700 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-center gap-2"
                                >
                                  <Plane size={13} /> Soumettre la demande de laissez-passer
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* === HISTORIQUE === */}
                    {travelHistory.length > 0 && (
                      <div className="bg-[#fdf6e3] rounded-xl shadow border border-stone-200">
                        <div className="px-5 py-4 border-b border-stone-200">
                          <h3 className="text-xs font-black uppercase tracking-widest text-stone-700 flex items-center gap-2">
                            <History size={14} className="text-stone-500" /> Historique des voyages
                          </h3>
                        </div>
                        <div className="divide-y divide-stone-100">
                          {travelHistory.map((req) => {
                            const fromC = safeCountries.find((c) => c.id === req.fromCountry);
                            const toC = safeCountries.find((c) => c.id === req.toCountry);
                            return (
                              <div key={req.id} className="flex items-center gap-3 px-5 py-3">
                                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                  <Plane size={12} className="text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-stone-800 truncate">
                                    {fromC?.name || "—"} → {toC?.name || "—"}
                                    {req.toRegion ? ` · ${req.toRegion}` : ""}
                                  </div>
                                  <div className="text-[9px] text-stone-400 font-mono">{new Date(req.timestamp).toLocaleDateString("fr-FR")}</div>
                                </div>
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded border bg-green-50 border-green-200 text-green-700 shrink-0">Approuvé</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

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
                maisonServiceCategories={maisonServiceCategories}
                maisonSubscriptions={maisonSubscriptions}
                maisonSubscriptionPrice={maisonSubscriptionPrice}
                onBook={onBookMaison}
                onJoinQueue={onJoinMaisonQueue}
                onLeaveQueue={onLeaveMaisonQueue}
                onSubmitReview={onSubmitMaisonReview}
                onBuySubscription={onBuyMaisonSubscription}
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
                citizens={safeUsers}
                onUpdateCitizen={onUpdateUser}
                onConfiscateSlaveMoney={onConfiscateSlaveMoney}
                onBuySlave={onBuySlave}
                onSelfManumit={onSelfManumit}
                onDismissSlaveAlert={onDismissSlaveAlert}
                onRestoreHiddenTransfer={onRestoreHiddenTransfer}
                onOwnerProposeMarriage={onOwnerProposeMarriage}
                onOwnerAcceptMarriage={onOwnerAcceptMarriage}
                onOwnerRejectMarriage={onOwnerRejectMarriage}
                onOwnerBreakMarriage={onOwnerBreakMarriage}
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
                          {formatMoney((user.balance || 0))}
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
                {(() => {
                  const MOODS = [
                    { id: "neutre",   emoji: "📜", label: "Neutre",     color: "border-stone-300 bg-stone-50" },
                    { id: "joyeux",   emoji: "😊", label: "Joyeux",     color: "border-amber-300 bg-amber-50" },
                    { id: "triste",   emoji: "😢", label: "Triste",     color: "border-blue-300 bg-blue-50" },
                    { id: "colere",   emoji: "😤", label: "En colère",  color: "border-red-300 bg-red-50" },
                    { id: "songeur",  emoji: "🤔", label: "Songeur",    color: "border-purple-300 bg-purple-50" },
                    { id: "inquiet",  emoji: "😰", label: "Inquiet",    color: "border-orange-300 bg-orange-50" },
                    { id: "inspire",  emoji: "🌟", label: "Inspiré",    color: "border-yellow-300 bg-yellow-50" },
                    { id: "amoureux", emoji: "❤️", label: "Amoureux",   color: "border-pink-300 bg-pink-50" },
                  ];
                  const getMoodData = (id) => MOODS.find((m) => m.id === id) || MOODS[0];
                  const entries = user.journal || [];
                  const filteredEntries = journalSearch
                    ? entries.filter((e) => e.content?.toLowerCase().includes(journalSearch.toLowerCase()) || e.title?.toLowerCase().includes(journalSearch.toLowerCase()))
                    : entries;

                  return (
                    <div className="border-t border-stone-200">
                      {/* En-tête journal */}
                      <div className="bg-[#fdf6e3] px-6 md:px-8 pt-6 pb-4 border-b border-amber-200/60">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-black uppercase text-stone-700 tracking-widest flex items-center gap-2 font-serif">
                            <Book size={16} className="text-amber-700" /> Journal Intime
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-stone-400 font-mono">{entries.length} entrée{entries.length !== 1 ? "s" : ""}</span>
                            {entries.length > 0 && (
                              <div className="relative">
                                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input value={journalSearch} onChange={(e) => setJournalSearch(e.target.value)}
                                  placeholder="Chercher…"
                                  className="pl-6 pr-2 py-1 bg-white border border-stone-200 rounded text-[10px] outline-none focus:border-amber-400 w-28" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Formulaire nouvelle entrée */}
                        <div className="bg-white border-2 border-amber-200 rounded-xl p-4 shadow-sm space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest shrink-0">Humeur</span>
                            <div className="flex gap-1 flex-wrap">
                              {MOODS.map((m) => (
                                <button key={m.id} onClick={() => setJournalMood(m.id)} title={m.label}
                                  className={`text-base leading-none transition-all hover:scale-110 ${journalMood === m.id ? "opacity-100 scale-110" : "opacity-40"}`}>
                                  {m.emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                          <input
                            className="w-full bg-[#fdfaf4] border border-amber-100 rounded-lg px-3 py-2 text-sm text-stone-700 outline-none focus:border-amber-400 font-serif placeholder:text-stone-300 placeholder:italic"
                            value={journalTitle}
                            onChange={(e) => setJournalTitle(e.target.value)}
                            placeholder="Titre (optionnel)…"
                            maxLength={80}
                          />
                          <div className="relative">
                            <textarea
                              className="w-full bg-[#fdfaf4] border border-amber-100 rounded-lg px-3 py-2 text-sm text-stone-800 outline-none focus:border-amber-400 resize-none font-serif leading-relaxed"
                              rows={4}
                              value={journalEntry}
                              onChange={(e) => setJournalEntry(e.target.value)}
                              placeholder="Ce jour, il advint que…"
                              maxLength={2000}
                            />
                            <span className="absolute bottom-2 right-3 text-[9px] text-stone-300 font-mono">{journalEntry.length}/2000</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-stone-400 italic">{getMoodData(journalMood).emoji} {getMoodData(journalMood).label}</span>
                            <button
                              onClick={() => {
                                if (journalEntry.trim() && onAddJournalEntry) {
                                  onAddJournalEntry(journalEntry, journalTitle, journalMood);
                                  setJournalEntry(""); setJournalTitle(""); setJournalMood("neutre");
                                }
                              }}
                              disabled={!journalEntry.trim()}
                              className="flex items-center gap-1.5 bg-amber-800 text-amber-100 px-4 py-1.5 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-amber-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                            >
                              <Book size={11} /> Consigner
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Liste des entrées */}
                      <div className="bg-[#fdf6e3] px-6 md:px-8 pb-6 space-y-3 max-h-[700px] overflow-y-auto">
                        {filteredEntries.length === 0 ? (
                          <div className="text-center text-stone-400 italic py-10 text-sm font-serif">
                            {journalSearch ? "Aucune entrée ne correspond à la recherche." : "Les pages de votre journal sont encore vierges…"}
                          </div>
                        ) : (
                          filteredEntries.map((entry) => {
                            const moodData = getMoodData(entry.mood);
                            const isExpanded = journalExpanded.has(entry.id);
                            const isEditing = journalEditId === entry.id;
                            const isLong = entry.content?.length > 200;

                            return (
                              <div key={entry.id} className={`border-l-4 rounded-r-xl bg-white shadow-sm overflow-hidden group transition-all ${moodData.color}`}>
                                {isEditing ? (
                                  /* Mode édition */
                                  <div className="p-4 space-y-3">
                                    <input
                                      className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-1.5 text-sm text-stone-700 outline-none focus:border-amber-400 font-serif"
                                      value={journalEditTitle}
                                      onChange={(e) => setJournalEditTitle(e.target.value)}
                                      placeholder="Titre…"
                                    />
                                    <div className="flex gap-1 flex-wrap">
                                      {MOODS.map((m) => (
                                        <button key={m.id} onClick={() => setJournalEditMood(m.id)} title={m.label}
                                          className={`text-base leading-none transition-all ${journalEditMood === m.id ? "opacity-100 scale-110" : "opacity-35 hover:opacity-70"}`}>
                                          {m.emoji}
                                        </button>
                                      ))}
                                    </div>
                                    <textarea
                                      className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-sm text-stone-800 outline-none focus:border-amber-400 resize-none font-serif leading-relaxed"
                                      rows={5}
                                      value={journalEditContent}
                                      onChange={(e) => setJournalEditContent(e.target.value)}
                                      maxLength={2000}
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <button onClick={() => setJournalEditId(null)}
                                        className="px-3 py-1 text-stone-400 hover:text-stone-600 text-xs font-bold uppercase rounded">Annuler</button>
                                      <button
                                        onClick={() => {
                                          if (journalEditContent.trim() && onEditJournalEntry) {
                                            onEditJournalEntry(entry.id, journalEditContent, journalEditTitle, journalEditMood);
                                            setJournalEditId(null);
                                          }
                                        }}
                                        disabled={!journalEditContent.trim()}
                                        className="px-3 py-1 bg-amber-800 text-amber-100 text-[10px] font-black uppercase tracking-widest rounded hover:bg-amber-700 disabled:opacity-40">
                                        Sauvegarder
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Mode lecture */
                                  <div className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="text-lg leading-none shrink-0">{moodData.emoji}</span>
                                        <div className="min-w-0">
                                          {entry.title && <div className="text-sm font-black text-stone-800 font-serif truncate">{entry.title}</div>}
                                          <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-stone-400 font-mono">
                                              {entry.rpDate}{entry.editedAt ? " · modifié" : ""}
                                            </span>
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded border ${moodData.color}`}>{moodData.label}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => { setJournalEditId(entry.id); setJournalEditContent(entry.content); setJournalEditTitle(entry.title || ""); setJournalEditMood(entry.mood || "neutre"); }}
                                          className="p-1 text-stone-400 hover:text-amber-700 rounded hover:bg-amber-50 transition-colors">
                                          <Edit3 size={11} />
                                        </button>
                                        <button
                                          onClick={() => onDeleteJournalEntry && onDeleteJournalEntry(entry.id)}
                                          className="p-1 text-stone-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors">
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </div>
                                    <div className={`text-sm text-stone-700 font-serif leading-relaxed whitespace-pre-wrap ${!isExpanded && isLong ? "line-clamp-3" : ""}`}>
                                      {entry.content}
                                    </div>
                                    {isLong && (
                                      <button onClick={() => setJournalExpanded((prev) => { const s = new Set(prev); s.has(entry.id) ? s.delete(entry.id) : s.add(entry.id); return s; })}
                                        className="text-[10px] text-amber-700 font-bold mt-1 hover:underline">
                                        {isExpanded ? "Réduire ▲" : "Lire la suite ▼"}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}

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
                              Peine : {entry.sentence.type === "FINE" ? `Amende de ${formatMoney(entry.sentence.amount)}` : entry.sentence.type === "PRISON" ? `Emprisonnement${entry.sentence.text ? ` — ${entry.sentence.text}` : ""}` : entry.sentence.type === "EXILE" ? "Exil" : entry.sentence.text || "Autre"}
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
            {active === "mariage" && (
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
                onSharedAccountDeposit={onSharedAccountDeposit}
                onSharedAccountWithdraw={onSharedAccountWithdraw}
                gameDate={gameDate}
                notify={notify}
                readOnly={isSlave}
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
              const hasRegent = !!myFamily.regentId;
              const canManage = hasRegent ? isRegent : isHead;
              const members = getFamilyMembers(myFamily, safeUsers);
              const branches = normalizeBranches(myFamily);
              const myBranch = getBranchForCitizen(user, myFamily);
              const head = myFamily.headId ? safeUsers.find((c) => c.id === myFamily.headId) : null;
              const regent = myFamily.regentId ? safeUsers.find((c) => c.id === myFamily.regentId) : null;
              const displayName = getFamilyDisplayName(myFamily);
              const treasury = myFamily.treasury || 0;
              const treasuryLog = myFamily.treasuryLog || [];
              const logIcon = (t) => logEntryIsPositive(t)
                ? <ArrowDownLeft size={10} className="text-green-500 shrink-0" />
                : <ArrowUpRight size={10} className="text-red-400 shrink-0" />;

              const familyTabs = [
                { id: "presentation", label: "Présentation", icon: Crown },
                { id: "members", label: "Membres", icon: Users },
                { id: "treasury", label: "Trésorerie", icon: Coins },
                { id: "governance", label: "Gouvernance", icon: Shield },
              ];

              return (
                <div className="space-y-4 animate-fadeIn">

                  {/* ── En-tête héroïque ── */}
                  <div className={`relative overflow-hidden rounded-2xl border p-5 ${
                    myFamily.type === "noble"
                      ? "bg-gradient-to-br from-yellow-950/40 via-stone-900/60 to-amber-950/30 border-yellow-800/50"
                      : "bg-gradient-to-br from-stone-100 to-stone-50 border-stone-200"
                  }`}>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-8xl select-none pointer-events-none ${myFamily.type === "noble" ? "opacity-10" : "opacity-5"}`}>
                      {myFamily.coat || (myFamily.type === "noble" ? "⚜️" : "🏠")}
                    </div>
                    <div className="relative flex items-start gap-4">
                      <div className={`text-5xl p-3 rounded-xl ${myFamily.type === "noble" ? "bg-yellow-900/30 border border-yellow-800/40" : "bg-stone-100 border border-stone-200"}`}>
                        {myFamily.coat || (myFamily.type === "noble" ? "⚜️" : "🏠")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className={`text-2xl font-black font-serif ${myFamily.type === "noble" ? "text-amber-200" : "text-stone-800"}`}>{displayName}</h2>
                        {myFamily.motto && <p className={`text-sm italic mt-0.5 ${myFamily.type === "noble" ? "text-amber-400/70" : "text-stone-500"}`}>« {myFamily.motto} »</p>}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                            myFamily.type === "noble" ? "bg-yellow-900/30 text-yellow-400 border-yellow-700/50" : "bg-stone-100 text-stone-600 border-stone-200"
                          }`}>{myFamily.type === "noble" ? "⚜️ Dynastie noble" : "🏠 Famille commune"}</span>
                          {myBranch && (
                            <span className={`text-[10px] ${myFamily.type === "noble" ? "text-amber-500/70" : "text-stone-500"}`}>
                              {myBranch.isMain ? "👑 Branche principale" : `⚜️ Maison ${myBranch.name}`}
                            </span>
                          )}
                          {isHead && <span className="bg-amber-500/20 text-amber-300 border border-amber-600/40 px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1"><Crown size={9} /> Chef</span>}
                          {isRegent && <span className="bg-purple-500/20 text-purple-300 border border-purple-600/40 px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1"><Shield size={9} /> Régent</span>}
                          {myFamily.foundedYear && <span className={`text-[10px] ${myFamily.type === "noble" ? "text-stone-500" : "text-stone-400"}`}>Fondée en {myFamily.foundedYear}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Navigation par onglets ── */}
                  <div className="flex gap-1 border-b border-stone-200 mb-0">
                    {familyTabs.map((tab) => {
                      const TabIcon = tab.icon;
                      return (
                        <button key={tab.id} onClick={() => setFamilyTab(tab.id)}
                          className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 -mb-px transition-all flex items-center gap-1 ${
                            familyTab === tab.id ? "border-amber-500 text-amber-700" : "border-transparent text-stone-400 hover:text-stone-600"
                          }`}>
                          <TabIcon size={12} />{tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* ══════════════════════════════════════
                      ONGLET PRÉSENTATION
                  ══════════════════════════════════════ */}
                  {familyTab === "presentation" && (
                    <div className="space-y-4">
                      {/* Bande de stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-center">
                          <div className="text-[8px] text-stone-400 uppercase font-black tracking-widest">Membres</div>
                          <div className="text-lg font-black text-stone-700 mt-0.5">{members.length}</div>
                        </div>
                        {myFamily.type === "noble" && (
                          <div className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-center">
                            <div className="text-[8px] text-stone-400 uppercase font-black tracking-widest">Branches</div>
                            <div className="text-lg font-black text-stone-700 mt-0.5">{branches.length}</div>
                          </div>
                        )}
                        <div className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-center">
                          <div className="text-[8px] text-stone-400 uppercase font-black tracking-widest">Chef</div>
                          <div className="text-xs font-black text-amber-700 mt-0.5 truncate">{head ? (head.firstName ? `${head.firstName}`.trim() : head.name) : "—"}</div>
                        </div>
                        {regent && (
                          <div className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-center">
                            <div className="text-[8px] text-stone-400 uppercase font-black tracking-widest">Régent</div>
                            <div className="text-xs font-black text-purple-700 mt-0.5 truncate">{regent.firstName ? `${regent.firstName}`.trim() : regent.name}</div>
                          </div>
                        )}
                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl px-3 py-2.5 text-center col-span-2 sm:col-span-1">
                          <div className="text-[8px] text-amber-600 uppercase font-black tracking-widest flex items-center justify-center gap-1"><Coins size={9} /> Trésorerie</div>
                          <div className="text-lg font-black font-mono text-amber-700 mt-0.5">{formatMoney(treasury)}</div>
                        </div>
                      </div>

                      {/* Description */}
                      {myFamily.description && (
                        <div className="bg-white border border-stone-200 rounded-xl p-4">
                          <div className="text-[9px] text-stone-400 uppercase font-black tracking-widest mb-2">Histoire & réputation</div>
                          <p className="text-sm text-stone-600 leading-relaxed">{myFamily.description}</p>
                        </div>
                      )}

                      {/* Arbre des branches (nobles) */}
                      {myFamily.type === "noble" && branches.length > 0 && (
                        <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-2">
                          <div className="text-[9px] text-stone-400 uppercase font-black tracking-widest mb-2">Branches dynastiques</div>
                          {branches.map((branch, bIdx) => {
                            const bCount = safeUsers.filter(
                              (c) => c.lastName && branch.lastName && c.lastName.toLowerCase() === branch.lastName.toLowerCase()
                            ).length;
                            return (
                              <div key={bIdx} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${branch.isMain ? "bg-amber-50/60 border-amber-200/60" : "bg-stone-50 border-stone-100"}`}>
                                <span className="text-lg">{branch.isMain ? "👑" : "⚜️"}</span>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-xs font-black ${branch.isMain ? "text-amber-700" : "text-stone-600"}`}>{branch.isMain ? `Branche principale — ${branch.name}` : `Maison ${branch.name}`}</div>
                                </div>
                                <span className="text-[10px] text-stone-400 font-mono shrink-0">{bCount} membre{bCount !== 1 ? "s" : ""}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ══════════════════════════════════════
                      ONGLET MEMBRES
                  ══════════════════════════════════════ */}
                  {familyTab === "members" && (
                    <div className="space-y-4">
                      {(() => {
                        const memberIds = new Set(members.map((m) => m.id));
                        const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
                        const seen = new Set();
                        const parentLinks = [];
                        const spouseLinks = [];
                        members.forEach((m) => {
                          if (m.fatherId && memberIds.has(m.fatherId)) {
                            const key = `${m.fatherId}-${m.id}-p`;
                            if (!seen.has(key)) { seen.add(key); parentLinks.push({ parent: memberById[m.fatherId], child: m, rel: "père" }); }
                          }
                          if (m.motherId && memberIds.has(m.motherId)) {
                            const key = `${m.motherId}-${m.id}-p`;
                            if (!seen.has(key)) { seen.add(key); parentLinks.push({ parent: memberById[m.motherId], child: m, rel: "mère" }); }
                          }
                          const spouseIds = Array.isArray(m.spouses) ? m.spouses : (m.spouseId ? [m.spouseId] : []);
                          spouseIds.forEach((sid) => {
                            if (memberIds.has(sid)) {
                              const key = [m.id, sid].sort().join("-") + "-s";
                              if (!seen.has(key)) { seen.add(key); spouseLinks.push({ a: m, b: memberById[sid] }); }
                            }
                          });
                        });
                        if (parentLinks.length === 0 && spouseLinks.length === 0) return null;
                        const fmtName = (c) => c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : (c.name || "?");
                        return (
                          <div className="bg-white border border-stone-200 rounded-xl p-4">
                            <div className="text-[9px] text-stone-400 uppercase font-black tracking-widest mb-3">Liens de parenté</div>
                            <div className="space-y-1.5">
                              {spouseLinks.map((l, i) => (
                                <div key={`s-${i}`} className="flex items-center gap-2 text-xs py-1 border-b border-stone-50 last:border-0 flex-wrap">
                                  <Avatar citizen={l.a} size={6} />
                                  <span className="font-bold text-stone-700 max-w-[100px] truncate">{fmtName(l.a)}</span>
                                  <span className="text-[9px] text-rose-400 shrink-0">♥ époux·se de</span>
                                  <Avatar citizen={l.b} size={6} />
                                  <span className="font-bold text-stone-700 max-w-[100px] truncate">{fmtName(l.b)}</span>
                                </div>
                              ))}
                              {parentLinks.map((l, i) => (
                                <div key={`p-${i}`} className="flex items-center gap-2 text-xs py-1 border-b border-stone-50 last:border-0 flex-wrap">
                                  <Avatar citizen={l.parent} size={6} />
                                  <span className="font-bold text-stone-700 max-w-[100px] truncate">{fmtName(l.parent)}</span>
                                  <span className="text-[9px] text-stone-400 shrink-0">↳ {l.rel} de</span>
                                  <Avatar citizen={l.child} size={6} />
                                  <span className="font-bold text-stone-700 max-w-[100px] truncate">{fmtName(l.child)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                      {myFamily.type === "noble" ? (
                        <div className="space-y-3">
                          {branches.map((branch, bIdx) => {
                            const branchMembers = safeUsers.filter(
                              (c) => c.lastName && branch.lastName && c.lastName.toLowerCase() === branch.lastName.toLowerCase()
                            );
                            return (
                              <div key={bIdx} className={`rounded-xl border p-4 ${branch.isMain ? "bg-amber-50/40 border-amber-200/60" : "bg-stone-50 border-stone-100"}`}>
                                <div className={`text-[9px] font-black uppercase mb-3 flex items-center gap-1 ${branch.isMain ? "text-amber-600" : "text-stone-500"}`}>
                                  {branch.isMain ? "👑" : "⚜️"} {branch.isMain ? `Branche principale — ${branch.name}` : `Maison ${branch.name}`}
                                  <span className="text-stone-400 normal-case font-normal ml-1">({branchMembers.length})</span>
                                </div>
                                {branchMembers.length === 0 ? (
                                  <div className="text-xs text-stone-400 italic py-1">Aucun membre dans cette branche</div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {branchMembers.map((m) => (
                                      <div key={m.id} className="flex items-center gap-3 p-3 bg-white border border-stone-100 rounded-xl hover:shadow-sm transition-all">
                                        <Avatar citizen={m} size={10} className="border-2 border-stone-200" />
                                        <div className="min-w-0 flex-1">
                                          <div className="font-bold text-stone-800 text-sm truncate flex items-center gap-1">
                                            {m.firstName ? `${m.firstName} ${m.lastName || ""}`.trim() : m.name}
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${m.status === "Décédé" ? "bg-red-400" : m.status === "Malade" ? "bg-yellow-400" : "bg-green-400"}`} />
                                          </div>
                                          <div className="text-[10px] text-stone-400 truncate">{m.occupation || "Citoyen"}</div>
                                        </div>
                                        {m.id === myFamily.headId && <Crown size={13} className="text-amber-500 shrink-0" />}
                                        {m.id === myFamily.regentId && <Shield size={13} className="text-purple-400 shrink-0" />}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div>
                          {members.length === 0 ? (
                            <div className="text-sm text-stone-400 italic py-4 text-center">Aucun membre</div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {members.map((m) => (
                                <div key={m.id} className="flex items-center gap-3 p-3 bg-white border border-stone-100 rounded-xl hover:shadow-sm transition-all">
                                  <Avatar citizen={m} size={10} className="border-2 border-stone-200" />
                                  <div className="min-w-0 flex-1">
                                    <div className="font-bold text-stone-800 text-sm truncate flex items-center gap-1">
                                      {m.firstName ? `${m.firstName} ${m.lastName || ""}`.trim() : m.name}
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${m.status === "Décédé" ? "bg-red-400" : m.status === "Malade" ? "bg-yellow-400" : "bg-green-400"}`} />
                                    </div>
                                    <div className="text-[10px] text-stone-400 truncate">{m.occupation || "Citoyen"}</div>
                                  </div>
                                  {m.id === myFamily.headId && <Crown size={13} className="text-amber-500 shrink-0" />}
                                  {m.id === myFamily.regentId && <Shield size={13} className="text-purple-400 shrink-0" />}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ══════════════════════════════════════
                      ONGLET TRÉSORERIE
                  ══════════════════════════════════════ */}
                  {familyTab === "treasury" && (
                    <div className="space-y-4">
                      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
                        <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-1"><Coins size={11} /> Opérations</div>
                        <FamilyTreasuryActions
                          familyId={myFamily.id}
                          isHead={canManage}
                          treasury={treasury}
                          userBalance={user.balance || 0}
                          onDeposit={onFamilyDeposit}
                          onWithdraw={onFamilyWithdraw}
                          onTransfer={onFamilyTreasuryTransfer}
                          allFamilies={families}
                        />
                      </div>

                      {/* Log complet */}
                      {treasuryLog.length > 0 && (
                        <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-2">
                          <div className="text-[9px] text-stone-400 uppercase font-black tracking-widest flex items-center justify-between">
                            <span>Historique ({treasuryLog.length})</span>
                            <span className="font-mono text-amber-600">{formatMoney(treasury)}</span>
                          </div>
                          <div className={`space-y-1 ${showFullLog ? "max-h-96 overflow-y-auto pr-1" : ""}`}>
                            {treasuryLog.slice(0, showFullLog ? undefined : 10).map((entry) => (
                              <div key={entry.id} className="flex items-center gap-2 py-1.5 border-b border-stone-50 last:border-0">
                                {logIcon(entry.type)}
                                <div className="flex-1 min-w-0">
                                  <div className="text-[10px] text-stone-600 truncate">{entry.label}</div>
                                  <div className="text-[9px] text-stone-400">{new Date(entry.timestamp).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>
                                </div>
                                <div className={`font-black font-mono text-xs shrink-0 ${logEntryColor(entry.type)}`}>
                                  {logEntrySign(entry.type)}{formatMoney(entry.amount)}
                                </div>
                              </div>
                            ))}
                          </div>
                          {treasuryLog.length > 10 && (
                            <button onClick={() => setShowFullLog(!showFullLog)} className="text-[10px] text-amber-600 underline mt-1 hover:text-amber-500">
                              {showFullLog ? "Réduire" : `Voir ${treasuryLog.length - 10} entrées de plus`}
                            </button>
                          )}
                        </div>
                      )}
                      {treasuryLog.length === 0 && (
                        <div className="text-sm text-stone-400 italic text-center py-4">Aucune opération enregistrée.</div>
                      )}
                    </div>
                  )}

                  {/* ══════════════════════════════════════
                      ONGLET GOUVERNANCE
                  ══════════════════════════════════════ */}
                  {familyTab === "governance" && (
                    <div className="space-y-4">
                      {canManage ? (
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
                      ) : (
                        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Gouvernance actuelle</div>
                          {head && (
                            <div className="flex items-center gap-3 px-3 py-2.5 bg-white border border-amber-100 rounded-lg">
                              <Avatar citizen={head} size={9} className="border-2 border-amber-200" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-black text-stone-700 truncate">{head.firstName ? `${head.firstName} ${head.lastName || ""}`.trim() : head.name}</div>
                                <div className="text-[9px] text-amber-600 font-bold uppercase">👑 Chef de famille</div>
                              </div>
                            </div>
                          )}
                          {regent && (
                            <div className="flex items-center gap-3 px-3 py-2.5 bg-white border border-purple-100 rounded-lg">
                              <Avatar citizen={regent} size={9} className="border-2 border-purple-200" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-black text-stone-700 truncate">{regent.firstName ? `${regent.firstName} ${regent.lastName || ""}`.trim() : regent.name}</div>
                                <div className="text-[9px] text-purple-600 font-bold uppercase">🛡️ Régent</div>
                              </div>
                            </div>
                          )}
                          <p className="text-[10px] text-stone-400 italic">Seul le chef ou le régent peut retirer des fonds et gérer la famille.</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })()}

            {/* === BOURSE === */}
            {active === "bourse" && !isSlave && (
              <CitizenBourse
                user={user}
                bourseListings={bourseListings}
                onBourseBuyShares={onBourseBuyShares}
                onBourseSellShares={onBourseSellShares}
                globalLedger={globalLedger}
              />
            )}

            {/* === ANNUAIRE IMPÉRIAL === */}
            {active === "annuaire" && (
              <div className="space-y-4">
                <div className="bg-[#fdf6e3] text-stone-900 rounded-lg shadow-2xl border-t-8 border-stone-400 overflow-hidden p-6">
                  <h2 className="text-xl font-black uppercase text-stone-800 tracking-widest font-serif flex items-center gap-3 mb-1">
                    <Eye size={20} /> Annuaire Impérial
                  </h2>
                  <p className="text-xs text-stone-500 mb-4">Consultez les registres publics de l'Empire.</p>

                  {/* Onglets */}
                  <div className="flex gap-1 border-b-2 border-stone-300 mb-5">
                    {[
                      { id: "citoyens", label: "Citoyens", icon: <User size={13} />, count: safeUsers.length },
                      { id: "entreprises", label: "Entreprises", icon: <Building2 size={13} />, count: safeCompanies.length },
                      { id: "pays", label: "Pays", icon: <Landmark size={13} />, count: safeCountries.length },
                      { id: "familles", label: "Familles", icon: <HeartHandshake size={13} />, count: families.length },
                    ].map((t) => (
                      <button key={t.id} onClick={() => { setAnnuaireTab(t.id); setAnnuaireSearch(""); setAnnuaireCompanySearch(""); setAnnuaireCountrySearch(""); setAnnuaireFamilySearch(""); setSelectedCitizen(null); setSelectedCompanyId(null); setSelectedCountryId(null); setSelectedFamilyId(null); }}
                        className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 -mb-0.5 transition-all ${
                          annuaireTab === t.id ? "border-stone-700 text-stone-800" : "border-transparent text-stone-400 hover:text-stone-600"
                        }`}>
                        {t.icon}{t.label}
                        <span className={`ml-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-black ${annuaireTab === t.id ? "bg-stone-800 text-white" : "bg-stone-200 text-stone-500"}`}>{t.count}</span>
                      </button>
                    ))}
                  </div>

                  {/* ── CITOYENS ── */}
                  {annuaireTab === "citoyens" && (
                    <>
                      <div className="flex flex-col md:flex-row gap-3 mb-4">
                        <div className="flex-1 relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-stone-200 rounded-lg text-sm outline-none focus:border-stone-400 transition-colors"
                            value={annuaireSearch} onChange={(e) => setAnnuaireSearch(e.target.value)} placeholder="Rechercher un citoyen…" />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { key: "ALL", label: "Tous" },
                            { key: "EMPEREUR", label: "Empereur" },
                            { key: "ROI", label: "Rois" },
                            { key: "FONC", label: "Fonctionnaires" },
                            { key: "ESCLAVE", label: "Esclaves" },
                          ].map((f) => (
                            <button key={f.key} onClick={() => setAnnuaireFilter(f.key)}
                              className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${annuaireFilter === f.key ? "bg-stone-800 text-white" : "bg-stone-200 text-stone-600 hover:bg-stone-300"}`}>
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>
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
                              <button key={c.id} onClick={() => setSelectedCitizen(c)}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 ${selectedCitizen?.id === c.id ? cTheme.border : "border-stone-200"} bg-white hover:shadow-md transition-all text-left`}>
                                <div className={`w-10 h-10 rounded-lg ${cTheme.border} border-2 bg-stone-100 overflow-hidden shrink-0`}>
                                  {c.avatarUrl ? (
                                    <img src={c.avatarUrl} className="w-full h-full object-cover" alt="" onError={(e) => { e.target.style.display = "none"; }} />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center"><User size={16} className="text-stone-400" /></div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-sm text-stone-800 truncate">
                                    {c.name}{c.title && <span className="text-xs text-stone-400 font-normal ml-1 italic">« {c.title} »</span>}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${cTheme.badge}`}>{cRole.label}</span>
                                    <span className={`text-[8px] font-bold uppercase ${c.status === "Esclave" ? "text-red-600" : c.status === "Actif" ? "text-green-600" : c.status === "Diplomate" ? "text-blue-600" : "text-stone-400"}`}>
                                      {c.status === "Diplomate" ? "🎖️ Diplomate" : (c.status || "Actif")}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        {safeUsers.length === 0 && <div className="col-span-2 text-center text-stone-400 py-10 text-sm">Aucun citoyen enregistré.</div>}
                      </div>
                    </>
                  )}

                  {/* ── ENTREPRISES ── */}
                  {annuaireTab === "entreprises" && (
                    <>
                      <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-stone-200 rounded-lg text-sm outline-none focus:border-stone-400 transition-colors"
                          value={annuaireCompanySearch} onChange={(e) => setAnnuaireCompanySearch(e.target.value)} placeholder="Rechercher une entreprise…" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-300">
                        {safeCompanies
                          .filter((c) => !annuaireCompanySearch || c.name?.toLowerCase().includes(annuaireCompanySearch.toLowerCase()))
                          .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                          .map((co) => {
                            const owner = safeUsers.find((u) => u.id === co.ownerId);
                            const empCount = (co.employees || []).length;
                            const listing = (bourseListings || []).find((l) => l.companyId === co.id);
                            return (
                              <button key={co.id} onClick={() => setSelectedCompanyId(selectedCompanyId === co.id ? null : co.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 ${selectedCompanyId === co.id ? "border-stone-700" : "border-stone-200"} bg-white hover:shadow-md transition-all text-left`}>
                                <div className="w-10 h-10 rounded-lg border-2 border-stone-200 flex items-center justify-center shrink-0 text-white text-sm font-black"
                                  style={{ backgroundColor: co.color || "#8B5CF6" }}>
                                  {(co.name || "?")[0].toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-sm text-stone-800 truncate">{co.name}</div>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    {owner && <span className="text-[9px] text-stone-500 truncate">Patron : {owner.name}</span>}
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${co.hiringOpen !== false ? "border-green-300 bg-green-50 text-green-700" : "border-stone-200 bg-stone-100 text-stone-500"}`}>
                                      {co.hiringOpen !== false ? "Recrutement ouvert" : "Fermé"}
                                    </span>
                                    {listing && <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-amber-300 bg-amber-50 text-amber-700">Cotée : {listing.symbol}</span>}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-bold text-stone-600">{empCount} emp.</div>
                                </div>
                              </button>
                            );
                          })}
                        {safeCompanies.length === 0 && <div className="col-span-2 text-center text-stone-400 py-10 text-sm">Aucune entreprise enregistrée.</div>}
                      </div>
                      {/* Fiche entreprise */}
                      {selectedCompanyId && (() => {
                        const co = safeCompanies.find((c) => c.id === selectedCompanyId);
                        if (!co) return null;
                        const owner = safeUsers.find((u) => u.id === co.ownerId);
                        const employees = safeUsers.filter((u) => (co.employees || []).includes(u.id));
                        const slaves = safeUsers.filter((u) => (co.slaves || []).includes(u.id));
                        const listing = (bourseListings || []).find((l) => l.companyId === co.id);
                        return (
                          <div className="mt-4 bg-white border-2 border-stone-300 rounded-xl p-5 space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl border-2 border-stone-200 flex items-center justify-center text-white text-xl font-black shrink-0"
                                style={{ backgroundColor: co.color || "#8B5CF6" }}>
                                {(co.name || "?")[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-lg font-black text-stone-800">{co.name}</div>
                                {co.motto && <div className="text-xs text-stone-400 italic">« {co.motto} »</div>}
                                {owner && <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-1"><Crown size={11} /> {owner.name}</div>}
                              </div>
                              <button onClick={() => setSelectedCompanyId(null)} className="text-stone-400 hover:text-stone-600 p-1 self-start"><X size={16} /></button>
                            </div>
                            {co.description && <p className="text-xs text-stone-600 italic border-t border-stone-100 pt-3">{co.description}</p>}
                            <div className="grid grid-cols-2 gap-2 border-t border-stone-100 pt-3">
                              <div className="bg-stone-50 rounded-lg p-2 text-center">
                                <div className="text-[8px] uppercase font-black text-stone-400 tracking-widest">Employés</div>
                                <div className="text-lg font-black text-stone-700">{employees.length}</div>
                              </div>
                              <div className="bg-stone-50 rounded-lg p-2 text-center">
                                <div className="text-[8px] uppercase font-black text-stone-400 tracking-widest">Recrutement</div>
                                <div className={`text-xs font-black mt-0.5 ${co.hiringOpen !== false ? "text-green-600" : "text-stone-400"}`}>{co.hiringOpen !== false ? "Ouvert" : "Fermé"}</div>
                              </div>
                            </div>
                            {listing && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs space-y-1">
                                <div className="font-black text-amber-700 uppercase tracking-widest text-[9px] flex items-center gap-1"><TrendingUp size={11} /> Cotation boursière</div>
                                <div className="flex justify-between"><span className="text-stone-500">Symbole</span><span className="font-black font-mono">{listing.symbol}</span></div>
                                <div className="flex justify-between"><span className="text-stone-500">Cours actuel</span><span className="font-black font-mono text-amber-700">{formatMoney(listing.pricePerShare)}</span></div>
                                <div className="flex justify-between"><span className="text-stone-500">Actions en vente</span><span className="font-mono">{listing.sharesOnMarket} / {listing.totalShares}</span></div>
                              </div>
                            )}
                            {employees.length > 0 && (
                              <div className="border-t border-stone-100 pt-3">
                                <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-2">Employés</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {employees.map((e) => <span key={e.id} className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] rounded font-bold">{e.name}</span>)}
                                </div>
                              </div>
                            )}
                            {slaves.length > 0 && (
                              <div className="border-t border-stone-100 pt-3">
                                <div className="text-[9px] font-black uppercase text-red-400 tracking-widest mb-2">Esclaves</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {slaves.map((e) => <span key={e.id} className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] rounded font-bold">{e.name}</span>)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {/* ── PAYS ── */}
                  {annuaireTab === "pays" && (
                    <>
                      <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-stone-200 rounded-lg text-sm outline-none focus:border-stone-400 transition-colors"
                          value={annuaireCountrySearch} onChange={(e) => setAnnuaireCountrySearch(e.target.value)} placeholder="Rechercher un pays…" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-300">
                        {safeCountries
                          .filter((c) => !annuaireCountrySearch || c.name?.toLowerCase().includes(annuaireCountrySearch.toLowerCase()))
                          .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                          .map((ct) => {
                            const pop = safeUsers.filter((u) => u.countryId === ct.id).length;
                            const king = safeUsers.find((u) => u.role === "ROI" && u.countryId === ct.id) || safeUsers.find((u) => u.role === "EMPEREUR" && u.countryId === ct.id);
                            return (
                              <button key={ct.id} onClick={() => setSelectedCountryId(selectedCountryId === ct.id ? null : ct.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 ${selectedCountryId === ct.id ? "border-stone-700" : "border-stone-200"} bg-white hover:shadow-md transition-all text-left`}>
                                <div className={`w-10 h-10 rounded-lg border-2 border-stone-200 flex items-center justify-center shrink-0 ${ct.color || "bg-stone-100"}`}>
                                  <Landmark size={18} className="text-stone-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-sm text-stone-800 truncate">{ct.name}</div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {king && <span className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5"><Crown size={9} /> {king.name}</span>}
                                    <span className="text-[9px] text-stone-500">{pop} habitant{pop !== 1 ? "s" : ""}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-[9px] text-stone-400">{(ct.regions || []).length} région{(ct.regions || []).length !== 1 ? "s" : ""}</div>
                                </div>
                              </button>
                            );
                          })}
                        {safeCountries.length === 0 && <div className="col-span-2 text-center text-stone-400 py-10 text-sm">Aucun pays enregistré.</div>}
                      </div>
                      {/* Fiche pays */}
                      {selectedCountryId && (() => {
                        const ct = safeCountries.find((c) => c.id === selectedCountryId);
                        if (!ct) return null;
                        const pop = safeUsers.filter((u) => u.countryId === ct.id);
                        const king = pop.find((u) => u.role === "ROI") || pop.find((u) => u.role === "EMPEREUR");
                        const nobles = pop.filter((u) => ["ROI", "EMPRESS", "EMPEROR", "SEIGNEUR", "BARON"].includes(u.role));
                        const fonc = pop.filter((u) => ["GRAND_FONC_GLOBAL", "GRAND_FONC_LOCAL", "INTENDANT", "FONCTIONNAIRE"].includes(u.role));
                        return (
                          <div className="mt-4 bg-white border-2 border-stone-300 rounded-xl p-5 space-y-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-xl border-2 border-stone-200 flex items-center justify-center shrink-0 ${ct.color || "bg-stone-100"}`}>
                                <Landmark size={24} className="text-stone-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-lg font-black text-stone-800">{ct.name}</div>
                                {king && <div className="text-xs text-amber-600 font-bold flex items-center gap-1 mt-0.5"><Crown size={11} /> {king.name}</div>}
                              </div>
                              <button onClick={() => setSelectedCountryId(null)} className="text-stone-400 hover:text-stone-600 p-1 self-start"><X size={16} /></button>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-t border-stone-100 pt-3">
                              {[
                                { label: "Population", value: pop.length },
                                { label: "Régions", value: (ct.regions || []).length },
                                { label: "Fonctionnaires", value: fonc.length },
                              ].map((s) => (
                                <div key={s.label} className="bg-stone-50 rounded-lg p-2 text-center">
                                  <div className="text-[8px] uppercase font-black text-stone-400 tracking-widest">{s.label}</div>
                                  <div className="text-lg font-black text-stone-700">{s.value}</div>
                                </div>
                              ))}
                            </div>
                            {(ct.regions || []).length > 0 && (
                              <div className="border-t border-stone-100 pt-3">
                                <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-2">Régions</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {ct.regions.map((r, i) => <span key={i} className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] rounded font-bold">{r.name || r}</span>)}
                                </div>
                              </div>
                            )}
                            {nobles.length > 0 && (
                              <div className="border-t border-stone-100 pt-3">
                                <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-2">Dirigeants & Nobles</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {nobles.map((n) => <span key={n.id} className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] rounded font-bold">{n.name}</span>)}
                                </div>
                              </div>
                            )}
                            {ct.laws && typeof ct.laws === "object" && (
                              <div className="border-t border-stone-100 pt-3 space-y-1">
                                <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-2">Lois notables</div>
                                {ct.laws.entryVisaFee > 0 && <div className="text-xs text-stone-600 flex justify-between"><span>Visa d'entrée</span><span className="font-mono font-bold">{formatMoney(ct.laws.entryVisaFee)}</span></div>}
                                {ct.laws.marriageStructure && <div className="text-xs text-stone-600 flex justify-between"><span>Mariage</span><span className="font-bold">{ct.laws.marriageStructure}</span></div>}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {/* ── FAMILLES ── */}
                  {annuaireTab === "familles" && (
                    <>
                      <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-stone-200 rounded-lg text-sm outline-none focus:border-stone-400 transition-colors"
                          value={annuaireFamilySearch} onChange={(e) => setAnnuaireFamilySearch(e.target.value)} placeholder="Rechercher une famille…" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-300">
                        {families
                          .filter((f) => {
                            const n = (f.dynastyName || f.lastName || "");
                            return !annuaireFamilySearch || n.toLowerCase().includes(annuaireFamilySearch.toLowerCase());
                          })
                          .sort((a, b) => ((a.dynastyName || a.lastName || "").localeCompare(b.dynastyName || b.lastName || "")))
                          .map((fam) => {
                            const memberCount = getFamilyMembers(fam, safeUsers).length;
                            const famName = fam.dynastyName || fam.lastName || "Famille sans nom";
                            return (
                              <button key={fam.id} onClick={() => setSelectedFamilyId(selectedFamilyId === fam.id ? null : fam.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 ${selectedFamilyId === fam.id ? "border-stone-700" : "border-stone-200"} bg-white hover:shadow-md transition-all text-left`}>
                                <div className="w-10 h-10 rounded-lg border-2 border-stone-300 bg-stone-100 overflow-hidden flex items-center justify-center shrink-0">
                                  {fam.coat ? (
                                    <span className="text-2xl leading-none">{fam.coat}</span>
                                  ) : (
                                    <Shield size={18} className="text-stone-400" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-sm text-stone-800 truncate">{famName}</div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {fam.headName && <span className="text-[9px] text-stone-500 flex items-center gap-0.5"><Crown size={9} /> {fam.headName}</span>}
                                    <span className="text-[9px] text-stone-400">{memberCount} membre{memberCount !== 1 ? "s" : ""}</span>
                                  </div>
                                </div>
                                {(fam.branches || []).length > 0 && <div className="text-[9px] text-stone-400 shrink-0">{fam.branches.length} branche{fam.branches.length !== 1 ? "s" : ""}</div>}
                              </button>
                            );
                          })}
                        {families.length === 0 && <div className="col-span-2 text-center text-stone-400 py-10 text-sm">Aucune famille enregistrée.</div>}
                      </div>
                      {/* Fiche famille */}
                      {selectedFamilyId && (() => {
                        const fam = families.find((f) => f.id === selectedFamilyId);
                        if (!fam) return null;
                        const famName = fam.dynastyName || fam.lastName || "Famille sans nom";
                        const members = getFamilyMembers(fam, safeUsers);
                        return (
                          <div className="mt-4 bg-white border-2 border-stone-300 rounded-xl p-5 space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl border-2 border-stone-300 bg-stone-50 overflow-hidden flex items-center justify-center shrink-0">
                                {fam.coat ? (
                                  <span className="text-4xl leading-none">{fam.coat}</span>
                                ) : (
                                  <Shield size={28} className="text-stone-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-lg font-black text-stone-800">Maison {famName}</div>
                                {fam.headName && <div className="text-xs text-amber-600 font-bold flex items-center gap-1 mt-0.5"><Crown size={11} /> Chef : {fam.headName}</div>}
                                {fam.regentName && <div className="text-xs text-blue-600 font-bold flex items-center gap-1"><Shield size={11} /> Régent : {fam.regentName}</div>}
                              </div>
                              <button onClick={() => setSelectedFamilyId(null)} className="text-stone-400 hover:text-stone-600 p-1 self-start"><X size={16} /></button>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-t border-stone-100 pt-3">
                              {[
                                { label: "Membres", value: members.length },
                                { label: "Branches", value: (fam.branches || []).length },
                                { label: "Trésorerie", value: fam.treasury ? `${formatMoney((fam.treasury || 0))}` : "—" },
                              ].map((s) => (
                                <div key={s.label} className="bg-stone-50 rounded-lg p-2 text-center">
                                  <div className="text-[8px] uppercase font-black text-stone-400 tracking-widest">{s.label}</div>
                                  <div className="text-sm font-black text-stone-700 mt-0.5">{s.value}</div>
                                </div>
                              ))}
                            </div>
                            {members.length > 0 && (
                              <div className="border-t border-stone-100 pt-3">
                                <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-2">Membres</div>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {members.map((m) => {
                                    const mTheme = getRoleTheme(m.role);
                                    const mRole = ROLES[m.role] || ROLES.CITOYEN;
                                    return (
                                      <div key={m.id} className="flex items-center gap-2 px-2 py-1 rounded bg-stone-50">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${mTheme.bg} overflow-hidden`}>
                                          {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" alt="" onError={(e) => { e.target.style.display = "none"; }} /> : (m.name || "?")[0].toUpperCase()}
                                        </div>
                                        <span className="text-xs font-bold text-stone-700 flex-1 truncate">{m.name}</span>
                                        <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded border ${mTheme.badge}`}>{mRole.label}</span>
                                        {m.id === fam.headId && <Crown size={10} className="text-amber-500 shrink-0" />}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {(fam.branches || []).length > 0 && (
                              <div className="border-t border-stone-100 pt-3">
                                <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-2">Branches</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {fam.branches.map((b, i) => <span key={i} className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] rounded font-bold">{b.name || `Branche ${i + 1}`}</span>)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>

                {/* Fiche citoyen sélectionné */}
                {annuaireTab === "citoyens" && selectedCitizen && (
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
                                <Coins size={11} /> +{formatMoney(prop.income)}/jour
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
                              <div className="text-2xl font-black text-yellow-700 font-mono">{formatMoney(totalValue)}</div>
                              <div className="text-[10px] text-stone-400 uppercase font-bold">Valeur</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-black text-green-600 font-mono">+{formatMoney(totalIncome)}</div>
                              <div className="text-[10px] text-stone-400 uppercase font-bold">/ jour</div>
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
                                      <span className="text-blue-500 ml-2 font-mono">{formatMoney(prop.rental.dailyRate)}/jour</span>
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
                                      En location : <span className="font-mono font-bold">{formatMoney(prop.rental.dailyRate)}/jour</span>
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
                                  <div className="font-mono text-sm font-bold text-stone-500">Estimé : {formatMoney(prop.price)}</div>
                                  <div className="flex flex-wrap gap-2">
                                    {prop.forSale ? (
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-bold text-yellow-700">{formatMoney(prop.salePrice)}</span>
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
                                  <div className="font-mono text-lg font-black text-yellow-700">{formatMoney(prop.price)}</div>
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
                                    Il vous manque {formatMoney((prop.price - (user.balance || 0)))}
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
                                  <div className="font-mono text-lg font-black text-yellow-700">{formatMoney(prop.salePrice)}</div>
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
                                    Il vous manque {formatMoney((prop.salePrice - (user.balance || 0)))}
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
                                    <span className="text-blue-500 ml-2 font-mono">{formatMoney(prop.rental.dailyRate)}/jour</span>
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
                                    <div className="font-mono text-lg font-black text-blue-700">{formatMoney(prop.rental.dailyRate)}/jour</div>
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

            {/* --- BLOC FICHE DE COMBAT --- */}
            {active === "combat" && (() => {
              const cs = user.combatStats || {};
              const techs = Array.isArray(user.techniques) ? user.techniques : [];
              const maxHp = cs.maxHp || 30;
              const maxMana = cs.maxMana || 10;

              // Prefer live HP/Mana from an active combat session if this citizen is a participant
              const activeSession = combatSessions.find(
                (s) => s.status === "active" && (s.participants || []).some((p) => String(p.citizenId) === String(user.id))
              );
              const liveParticipant = activeSession
                ? (activeSession.participants || []).find((p) => String(p.citizenId) === String(user.id))
                : null;

              const currentHp   = liveParticipant ? (liveParticipant.currentHp ?? maxHp)   : (cs.currentHp ?? maxHp);
              const currentMana = liveParticipant ? (liveParticipant.currentMana ?? maxMana) : (cs.currentMana ?? maxMana);
              const hpPct = maxHp > 0 ? Math.max(0, Math.min(100, (currentHp / maxHp) * 100)) : 100;
              const manaPct = maxMana > 0 ? Math.max(0, Math.min(100, (currentMana / maxMana) * 100)) : 100;
              const hpColor = hpPct > 50 ? "bg-green-500" : hpPct > 25 ? "bg-amber-500" : "bg-red-500";
              const isMage = cs.class === "mage";
              const attack       = (cs.attackBase || 0)       + (cs.weaponBonus || 0);
              const defense      = (cs.defenseBase || 0)      + (cs.armorBonus  || 0);
              const magicDefense = (cs.magicDefenseBase || 0) + (cs.spellBonus  || 0);
              const speed        = cs.speedBase || 0;
              const statItems = [
                { label: "Attaque", value: attack, icon: "⚔" },
                { label: "Défense", value: defense, icon: "🛡" },
                { label: "Déf. Magique", value: magicDefense, icon: "✨" },
                { label: "Vitesse", value: speed, icon: "💨" },
              ];
              return (
                <div className="space-y-5 animate-fadeIn">
                  {/* Header */}
                  <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl border border-stone-700 p-5 shadow-xl">
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isMage ? "bg-blue-900/40 border-blue-700/50" : "bg-red-900/40 border-red-700/50"}`}>
                        {isMage ? <Zap size={22} className="text-blue-400" /> : <Sword size={22} className="text-red-400" />}
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-widest text-stone-400">
                          {isMage ? "Mage" : "Guerrier"} — Niveau {cs.level || 1}
                        </div>
                        <div className="text-lg font-black uppercase text-stone-100">{user.name}</div>
                      </div>
                    </div>

                    {/* Barres vitales */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Heart size={12} className="text-red-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Points de Vie</span>
                          </div>
                          <span className="text-xs font-mono text-stone-300">{currentHp} / {maxHp}</span>
                        </div>
                        <div className="h-3 bg-stone-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${hpColor}`} style={{ width: `${hpPct}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Zap size={12} className="text-blue-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Mana</span>
                          </div>
                          <span className="text-xs font-mono text-stone-300">{currentMana} / {maxMana}</span>
                        </div>
                        <div className="h-3 bg-stone-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all bg-blue-500" style={{ width: `${manaPct}%` }} />
                        </div>
                        {!isMage && <p className="text-[8px] text-stone-600 mt-1 italic">Guerrier — pas de magie utilisable</p>}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                      {statItems.map(s => (
                        <div key={s.label} className="bg-stone-800/60 border border-stone-700/50 rounded-xl p-3 text-center">
                          <div className="text-xl mb-1">{s.icon}</div>
                          <div className="text-lg font-black text-stone-100">{s.value}</div>
                          <div className="text-[8px] font-black uppercase tracking-widest text-stone-500">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compétences */}
                  <div className="bg-stone-900 border border-stone-700 rounded-2xl overflow-hidden shadow-xl">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-stone-800">
                      <Zap size={15} className="text-amber-500" />
                      <span className="text-xs font-black uppercase tracking-widest text-stone-300">
                        {isMage ? "Sorts" : "Techniques"} ({techs.length})
                      </span>
                    </div>
                    <div className="p-4">
                      {techs.length === 0 ? (
                        <p className="text-xs text-stone-600 italic text-center py-4">Aucune compétence attribuée</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {techs.map(tech => {
                            const isSort = tech.type === "sort";
                            return (
                              <div key={tech.id} className="bg-stone-800 border border-stone-700 rounded-xl overflow-hidden">
                                {/* En-tête */}
                                <div className={`flex items-center gap-3 px-4 py-3 border-b ${isSort ? "border-blue-900/50 bg-blue-950/20" : "border-red-900/50 bg-red-950/20"}`}>
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSort ? "bg-blue-900/60 text-blue-300" : "bg-red-900/60 text-red-300"}`}>
                                    {isSort ? <Zap size={15} /> : <Sword size={15} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-black text-stone-100 truncate">{tech.name}</div>
                                    <div className={`text-[8px] font-black uppercase tracking-widest ${isSort ? "text-blue-400" : "text-red-400"}`}>
                                      {isSort ? "Sort · Mage" : "Technique · Guerrier"}
                                    </div>
                                  </div>
                                </div>
                                {/* Statistiques */}
                                <div className="px-4 py-3 border-b border-stone-700/60">
                                  <div className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2">Statistiques</div>
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] text-stone-400">Dégâts</span>
                                      <span className={`text-[10px] font-black font-mono ${tech.bonusDamage > 0 ? "text-amber-400" : "text-stone-600"}`}>
                                        {tech.bonusDamage > 0 ? `+${tech.bonusDamage}` : "—"}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] text-stone-400">Effet</span>
                                      <span className="text-[10px] text-stone-200 text-right max-w-[60%] truncate">
                                        {tech.effect ? `${tech.effect}${tech.effectChance < 100 ? ` (${tech.effectChance}%)` : ""}` : <span className="text-stone-600">—</span>}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] text-stone-400">{isSort ? "Coût Mana" : "Recharge"}</span>
                                      <span className={`text-[10px] font-black font-mono ${isSort ? "text-blue-400" : "text-stone-200"}`}>
                                        {isSort
                                          ? (tech.manaCost > 0 ? `${tech.manaCost} mana` : <span className="text-stone-600">—</span>)
                                          : (tech.cooldown > 0 ? `${tech.cooldown} tour${tech.cooldown > 1 ? "s" : ""}` : "Aucune")}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {/* Descriptif */}
                                <div className="px-4 py-3">
                                  <div className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1.5">Descriptif</div>
                                  <p className={`text-[10px] leading-relaxed ${tech.description ? "text-stone-300 italic" : "text-stone-600"}`}>
                                    {tech.description || "Aucune description"}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {techs.length === 0 && !cs.class && (
                    <p className="text-xs text-stone-600 italic text-center py-2">La fiche de combat sera remplie par un administrateur.</p>
                  )}
                </div>
              );
            })()}

            {active === "garde" && isGuard && (() => {
              const gRanks = myGuard.ranks || [];
              const gAllMembers = myGuard.members || [];
              const gOrders = (myGuard.orders || []).filter((o) => (myGuardRank?.level || 0) >= (o.minRankLevel || 1));
              const RANK_COLORS_CIT = {
                stone:"bg-stone-100 text-stone-700 border-stone-300", amber:"bg-amber-100 text-amber-800 border-amber-300",
                red:"bg-red-100 text-red-800 border-red-300", blue:"bg-blue-100 text-blue-800 border-blue-300",
                green:"bg-green-100 text-green-800 border-green-300", purple:"bg-purple-100 text-purple-800 border-purple-300",
                black:"bg-stone-800 text-stone-100 border-stone-600",
              };
              const gRankBadge = myGuardRank ? (RANK_COLORS_CIT[myGuardRank.color] || RANK_COLORS_CIT.stone) : RANK_COLORS_CIT.stone;
              const gCanOrder  = myGuardRank?.canOrder  || false;
              const gCanManage = myGuardRank?.canManage || false;
              const gPrison    = myGuard.prison || [];
              const gVisibleMembers = gAllMembers.filter((m) => {
                if (gCanManage) return true;
                const mRank = gRanks.find((r) => r.id === m.rankId);
                return (mRank?.level || 0) <= (myGuardRank?.level || 0);
              });
              const GTABS = [
                { id: "ordres",  label: "Ordres"  },
                { id: "membres", label: "Membres" },
                ...(gCanManage ? [{ id: "prison", label: `Prison${gPrison.length > 0 ? ` (${gPrison.length})` : ""}` }] : []),
                ...(gCanOrder  ? [{ id: "emettre", label: "Émettre un ordre" }] : []),
              ];
              return (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-stone-800 text-white rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-xl"><Shield size={28} /></div>
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 font-bold">{myGuard.name || "Corps de Garde"}</div>
                      <div className="text-xl font-black font-serif">{user.name}</div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        {myGuardRank ? (
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${gRankBadge}`}>{myGuardRank.name}</span>
                        ) : (
                          <span className="text-xs text-stone-400 italic">Grade non assigné</span>
                        )}
                        {myGuardMember?.note && <span className="text-xs text-stone-400 italic">{myGuardMember.note}</span>}
                      </div>
                    </div>
                    <div className="ml-auto text-right text-xs text-stone-400">
                      <div className="font-black text-white text-lg">{gAllMembers.length}</div>
                      <div>membres</div>
                    </div>
                  </div>
                  {myGuard.description && (
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm text-stone-600 italic">{myGuard.description}</div>
                  )}
                  <div className="flex gap-1 border-b border-stone-200">
                    {GTABS.map((t) => (
                      <button key={t.id} onClick={() => setGuardTab(t.id)}
                        className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-t-lg border-b-2 transition-all ${
                          guardTab === t.id ? "border-stone-800 text-stone-800 bg-white" : "border-transparent text-stone-400 hover:text-stone-600"
                        }`}>{t.label}</button>
                    ))}
                  </div>
                  {guardTab === "ordres" && (
                    <div className="space-y-2">
                      {gOrders.length === 0 && <p className="text-stone-400 italic text-sm text-center py-8">Aucun ordre en cours.</p>}
                      {gOrders.map((o) => {
                        const isDone = o.status === "done";
                        return (
                          <div key={o.id} className={`bg-white rounded-xl border overflow-hidden ${isDone ? "border-green-200 opacity-70" : o.urgent ? "border-red-300" : "border-stone-200"}`}>
                            <button onClick={() => setGuardExpandedOrder(guardExpandedOrder === o.id ? null : o.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left">
                              {isDone
                                ? <span className="text-green-600 font-black text-[9px] uppercase bg-green-50 px-2 py-0.5 rounded-full border border-green-200">✓ Terminé</span>
                                : o.urgent && <span className="text-red-500 font-black text-[9px] uppercase bg-red-50 px-2 py-0.5 rounded-full border border-red-200">🚨 Urgent</span>
                              }
                              <span className={`font-bold flex-1 ${isDone ? "line-through text-stone-400" : "text-stone-800"}`}>{o.title}</span>
                              <span className="text-[10px] text-stone-400 shrink-0">{o.author} · {o.date ? new Date(o.date).toLocaleDateString("fr-FR") : ""}</span>
                              <ChevronDown size={13} className={`text-stone-400 transition-transform ${guardExpandedOrder === o.id ? "" : "-rotate-90"}`} />
                            </button>
                            {guardExpandedOrder === o.id && (
                              <div className="px-4 pb-4 border-t border-stone-100 bg-stone-50 space-y-3">
                                {o.content && <p className="text-sm text-stone-600 mt-3 leading-relaxed whitespace-pre-wrap">{o.content}</p>}
                                {/* Rapports existants */}
                                {(o.reports || []).length > 0 && (
                                  <div className="space-y-2">
                                    <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Rapports de mission</div>
                                    {(o.reports || []).map((r) => (
                                      <div key={r.id} className="bg-white rounded-lg border border-stone-200 p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs font-black text-stone-700">{r.author}</span>
                                          <span className="text-[9px] text-stone-400">{r.date ? new Date(r.date).toLocaleDateString("fr-FR") : ""}</span>
                                        </div>
                                        <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{r.content}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Formulaire rapport + terminer */}
                                {!isDone && onGuardCompleteOrder && (
                                  guardReportOrderId === o.id ? (
                                    <div className="space-y-2 mt-2">
                                      <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Rapport de mission</div>
                                      <textarea
                                        className="w-full p-2.5 border rounded-lg text-sm outline-none resize-none focus:border-stone-400 bg-white"
                                        rows={4}
                                        value={guardReportText}
                                        onChange={(e) => setGuardReportText(e.target.value)}
                                        placeholder="Décrivez le déroulement de la mission, les résultats, les incidents..."
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <button onClick={() => { setGuardReportOrderId(null); setGuardReportText(""); }}
                                          className="px-3 py-1.5 rounded-lg bg-stone-100 text-[10px] font-bold uppercase">Annuler</button>
                                        <button onClick={() => {
                                          onGuardCompleteOrder(user.countryId, o.id, guardReportText.trim());
                                          setGuardReportOrderId(null); setGuardReportText("");
                                        }}
                                          className="px-4 py-1.5 rounded-lg bg-green-600 text-white text-[10px] font-bold uppercase flex items-center gap-1.5">
                                          ✓ Soumettre et terminer
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button onClick={() => { setGuardReportOrderId(o.id); setGuardReportText(""); setGuardExpandedOrder(o.id); }}
                                      className="flex items-center gap-1.5 text-[10px] font-black uppercase text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-all">
                                      ✓ Marquer terminé + rapport
                                    </button>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {guardTab === "membres" && (
                    <div className="space-y-2">
                      {gVisibleMembers.length === 0 && <p className="text-stone-400 italic text-sm text-center py-8">Aucun membre visible.</p>}
                      {gVisibleMembers.map((m) => {
                        const mRank  = gRanks.find((r) => r.id === m.rankId);
                        const mBadge = mRank ? (RANK_COLORS_CIT[mRank.color] || RANK_COLORS_CIT.stone) : RANK_COLORS_CIT.stone;
                        return (
                          <div key={m.citizenId} className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center font-black text-stone-600 text-sm shrink-0">
                              {(m.citizenName || "?")[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-stone-800 text-sm">
                                {m.citizenName}{m.citizenId === user.id && <span className="ml-2 text-[9px] text-stone-400">(vous)</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {mRank && <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${mBadge}`}>{mRank.name}</span>}
                                {m.note && <span className="text-[10px] text-stone-400 italic truncate">{m.note}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {guardTab === "prison" && gCanManage && (
                    <div className="space-y-4">
                      {/* Incarcérer */}
                      <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
                        <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Incarcérer un citoyen</div>
                        <select className="w-full p-2.5 border rounded-lg text-sm bg-white outline-none focus:border-stone-400"
                          value={guardPrisonCitizenId} onChange={(e) => setGuardPrisonCitizenId(e.target.value)}>
                          <option value="">— Sélectionner un citoyen —</option>
                          {safeUsers.filter((c) => !gPrison.some((p) => p.citizenId === c.id)).map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <input className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-stone-400"
                          placeholder="Motif d'incarcération..." value={guardPrisonReason}
                          onChange={(e) => setGuardPrisonReason(e.target.value)} />
                        <input className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-stone-400"
                          placeholder="Durée de la peine (ex: 3 jours RP, indéterminée...)" value={guardPrisonSentence}
                          onChange={(e) => setGuardPrisonSentence(e.target.value)} />
                        <button onClick={() => {
                          if (!guardPrisonCitizenId || !onGuardImprison) return;
                          onGuardImprison(user.countryId, guardPrisonCitizenId, guardPrisonReason, guardPrisonSentence);
                          setGuardPrisonCitizenId(""); setGuardPrisonReason(""); setGuardPrisonSentence("");
                        }} disabled={!guardPrisonCitizenId}
                          className="w-full bg-red-700 hover:bg-red-800 text-white py-2.5 rounded-lg text-[10px] font-black uppercase disabled:opacity-40 flex items-center justify-center gap-1.5">
                          🔒 Incarcérer
                        </button>
                      </div>
                      {/* Liste */}
                      {gPrison.length === 0 ? (
                        <p className="text-stone-400 italic text-sm text-center py-8">La prison est vide.</p>
                      ) : (
                        <div className="space-y-2">
                          {gPrison.map((p) => (
                            <div key={p.id} className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
                              <div className="p-2 bg-red-100 rounded-lg shrink-0 mt-0.5 text-red-600 text-sm">🔒</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-black text-stone-800 text-sm">{p.citizenName}</div>
                                <div className="text-xs text-red-700 mt-0.5">{p.reason}</div>
                                {p.sentence && <div className="text-[10px] text-stone-500 mt-0.5">Peine : {p.sentence}</div>}
                                <div className="text-[10px] text-stone-400 mt-1">Arrêté par {p.guardName} · {p.since ? new Date(p.since).toLocaleDateString("fr-FR") : ""}</div>
                              </div>
                              <button onClick={() => onGuardRelease && onGuardRelease(user.countryId, p.citizenId)}
                                className="shrink-0 flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-800 border border-green-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all">
                                🔓 Libérer
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {guardTab === "emettre" && gCanOrder && (
                    <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
                      <input className="w-full p-2.5 border rounded-lg text-sm font-bold outline-none focus:border-stone-400"
                        value={guardOrderTitle} onChange={(e) => setGuardOrderTitle(e.target.value)} placeholder="Titre de l'ordre..." />
                      <textarea className="w-full p-2.5 border rounded-lg text-sm outline-none resize-none focus:border-stone-400" rows={4}
                        value={guardOrderContent} onChange={(e) => setGuardOrderContent(e.target.value)} placeholder="Contenu..." />
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-500">Visible dès niveau :</span>
                          <select className="p-2 border rounded-lg text-sm bg-white outline-none"
                            value={guardOrderMinLevel} onChange={(e) => setGuardOrderMinLevel(parseInt(e.target.value))}>
                            {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>Niv. {n}+</option>)}
                          </select>
                        </div>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-red-700 cursor-pointer">
                          <input type="checkbox" checked={guardOrderUrgent} onChange={(e) => setGuardOrderUrgent(e.target.checked)} />
                          🚨 Urgent
                        </label>
                        <button onClick={() => {
                          if (!guardOrderTitle.trim() || !onGuardIssueOrder) return;
                          onGuardIssueOrder(user.countryId, { id: `ord-${Date.now()}`, title: guardOrderTitle.trim(), content: guardOrderContent.trim(), minRankLevel: guardOrderMinLevel, urgent: guardOrderUrgent, author: user.name, date: Date.now() });
                          setGuardOrderTitle(""); setGuardOrderContent(""); setGuardOrderMinLevel(1); setGuardOrderUrgent(false);
                          setGuardTab("ordres");
                        }} disabled={!guardOrderTitle.trim()}
                          className="ml-auto bg-stone-800 text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase disabled:opacity-40">
                          Émettre
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

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
