import React, { useState, useMemo } from "react";
import {
  Coins,
  Send,
  Scroll,
  FileSignature,
  ArrowUpRight,
  ArrowDownLeft,
  Handshake,
  ShieldAlert,
  Wallet,
  Stamp,
  PenTool,
  Calendar,
  Percent,
  TrendingUp,
  TrendingDown,
  Filter,
  CreditCard,
  Banknote,
  Landmark,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronDown,
  Search,
  Receipt,
  PiggyBank,
  Scale,
} from "lucide-react";
import UserSearchSelect from "../ui/UserSearchSelect";

// --- Composant de statistiques bancaires ---
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
        {label}
      </div>
      <div className="text-xl font-black font-mono text-stone-900 truncate">
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-stone-400 mt-0.5">{sub}</div>
      )}
    </div>
  </div>
);

// --- Badge de statut ---
const StatusBadge = ({ status }) => {
  const config = {
    DRAFT: {
      bg: "bg-yellow-100 text-yellow-800 border-yellow-200",
      label: "Brouillon",
      icon: Clock,
    },
    ACTIVE: {
      bg: "bg-blue-100 text-blue-800 border-blue-200",
      label: "Actif",
      icon: CheckCircle2,
    },
    PAID: {
      bg: "bg-green-100 text-green-800 border-green-200",
      label: "Payé",
      icon: CheckCircle2,
    },
    CANCELLED: {
      bg: "bg-stone-100 text-stone-500 border-stone-200",
      label: "Annulé",
      icon: XCircle,
    },
  };
  const c = config[status] || config.ACTIVE;
  const IconComp = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${c.bg}`}
    >
      <IconComp size={10} /> {c.label}
    </span>
  );
};

const CitizenBankView = ({
  user,
  users,
  companies = [],
  countries = [],
  globalLedger,
  debtRegistry,
  onTransfer,
  onProposeDebt,
  onSignDebt,
  onPayDebt,
  onCancelDebt,
  canUseBank,
  isBanned,
}) => {
  const [activeTab, setActiveTab] = useState("operations");

  // --- ÉTATS FORMULAIRES ---
  const [transferTargetType, setTransferTargetType] = useState("CITIZEN");
  const [transferTarget, setTransferTarget] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const safeCompanies = Array.isArray(companies) ? companies : [];
  const safeCountries = Array.isArray(countries) ? countries : [];

  // Proposition de Prêt
  const [loanTarget, setLoanTarget] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanInterest, setLoanInterest] = useState("0");
  const [loanDueDate, setLoanDueDate] = useState("");
  const [loanReason, setLoanReason] = useState("");

  // Historique
  const [historyFilter, setHistoryFilter] = useState("ALL");
  const [historySearch, setHistorySearch] = useState("");
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Contrats
  const [contractFilter, setContractFilter] = useState("ALL");

  // --- DONNÉES CALCULÉES ---
  const safeRegistry = Array.isArray(debtRegistry) ? debtRegistry : [];

  const myTransactions = useMemo(
    () =>
      (globalLedger || [])
        .filter((l) => l.fromName === user.name || l.toName === user.name)
        .sort((a, b) => (b.timestamp || b.id) - (a.timestamp || a.id)),
    [globalLedger, user.name]
  );

  const filteredTransactions = useMemo(() => {
    let txs = myTransactions;
    if (historyFilter !== "ALL") {
      if (historyFilter === "IN") {
        txs = txs.filter((t) => t.toName === user.name);
      } else if (historyFilter === "OUT") {
        txs = txs.filter((t) => t.fromName === user.name);
      } else {
        txs = txs.filter((t) => t.type === historyFilter);
      }
    }
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      txs = txs.filter(
        (t) =>
          (t.fromName || "").toLowerCase().includes(q) ||
          (t.toName || "").toLowerCase().includes(q) ||
          (t.reason || "").toLowerCase().includes(q)
      );
    }
    return txs;
  }, [myTransactions, historyFilter, historySearch, user.name]);

  const displayedTransactions = showAllHistory
    ? filteredTransactions
    : filteredTransactions.slice(0, 20);

  // Dettes actives (Je dois payer)
  const myDebts = safeRegistry.filter(
    (d) => d.debtorId === user.id && d.status === "ACTIVE"
  );

  // Créances actives (On me doit)
  const myCredits = safeRegistry.filter(
    (d) => d.creditorId === user.id && d.status === "ACTIVE"
  );

  // En attente de ma signature
  const pendingSignatures = safeRegistry.filter(
    (d) => d.debtorId === user.id && d.status === "DRAFT"
  );

  // Mes propositions en attente
  const myProposals = safeRegistry.filter(
    (d) => d.creditorId === user.id && d.status === "DRAFT"
  );

  // Tous mes contrats (pour le filtre)
  const allMyContracts = safeRegistry.filter(
    (d) => d.debtorId === user.id || d.creditorId === user.id
  );

  const filteredContracts = useMemo(() => {
    if (contractFilter === "ALL") return allMyContracts;
    return allMyContracts.filter((d) => d.status === contractFilter);
  }, [allMyContracts, contractFilter]);

  // Statistiques
  const totalReceived = myTransactions
    .filter((t) => t.toName === user.name)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalSent = myTransactions
    .filter((t) => t.fromName === user.name)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalDebtOwed = myDebts.reduce(
    (sum, d) => sum + (d.totalAmount || 0),
    0
  );

  const totalCreditDue = myCredits.reduce(
    (sum, d) => sum + (d.totalAmount || 0),
    0
  );

  // --- ACTIONS ---
  const handleTransfer = () => {
    if (!transferTarget || !transferAmount || parseInt(transferAmount) <= 0)
      return;
    const tgtRaw =
      transferTargetType === "COMPANY"
        ? `E-${transferTarget}`
        : transferTargetType === "COUNTRY"
        ? `C-${transferTarget}`
        : `U-${transferTarget}`;
    onTransfer(`U-${user.id}`, tgtRaw, parseInt(transferAmount));
    setTransferAmount("");
    setTransferTarget("");
    setTransferReason("");
  };

  const handleProposeLoan = () => {
    if (!loanTarget || !loanAmount || parseInt(loanAmount) <= 0) return;
    if (onProposeDebt) {
      onProposeDebt(
        loanTarget,
        parseInt(loanAmount),
        parseInt(loanInterest) || 0,
        loanReason || "Prêt",
        loanDueDate || "Indéterminée"
      );
    }
    setLoanTarget("");
    setLoanAmount("");
    setLoanReason("");
    setLoanInterest("0");
    setLoanDueDate("");
  };

  const typeLabels = {
    TRANSFER: "Virement",
    MINT: "Frappe",
    SLAVE_PURCHASE: "Achat esclave",
    CONFISCATION: "Confiscation",
    MAISON: "Maison Asia",
    SALARY: "Salaire",
    MANUMISSION: "Affranchissement",
    DEBT_PAYMENT: "Remb. dette",
    HIDDEN_TRANSFER: "Transfert secret",
    HIDE_MONEY: "Dissimulation",
    WITHDRAW_HIDDEN: "Retrait caché",
    COMPANY_TREASURY: "Trésorerie",
    SALARY_WITHDRAW: "Retrait salaire",
    COMPANY_LEVEL: "Expansion",
    SUBCONTRACT: "Sous-traitance",
    PLAYER_MARKET: "Marché joueur",
    TRADE: "Échange",
    PROPERTY_PURCHASE: "Propriété",
    RENT: "Loyer",
  };

  const typeColors = {
    TRANSFER: "bg-blue-50 text-blue-700 border-blue-100",
    MINT: "bg-yellow-50 text-yellow-700 border-yellow-100",
    SLAVE_PURCHASE: "bg-red-50 text-red-700 border-red-100",
    CONFISCATION: "bg-orange-50 text-orange-700 border-orange-100",
    MAISON: "bg-pink-50 text-pink-700 border-pink-100",
    SALARY: "bg-green-50 text-green-700 border-green-100",
    MANUMISSION: "bg-purple-50 text-purple-700 border-purple-100",
    DEBT_PAYMENT: "bg-emerald-50 text-emerald-700 border-emerald-100",
    HIDDEN_TRANSFER: "bg-amber-50 text-amber-700 border-amber-100",
    HIDE_MONEY: "bg-stone-50 text-stone-600 border-stone-100",
    WITHDRAW_HIDDEN: "bg-stone-50 text-stone-600 border-stone-100",
    COMPANY_TREASURY: "bg-indigo-50 text-indigo-700 border-indigo-100",
    SALARY_WITHDRAW: "bg-teal-50 text-teal-700 border-teal-100",
    COMPANY_LEVEL: "bg-violet-50 text-violet-700 border-violet-100",
    SUBCONTRACT: "bg-orange-50 text-orange-700 border-orange-100",
    PLAYER_MARKET: "bg-cyan-50 text-cyan-700 border-cyan-100",
    TRADE: "bg-lime-50 text-lime-700 border-lime-100",
    PROPERTY_PURCHASE: "bg-rose-50 text-rose-700 border-rose-100",
    RENT: "bg-sky-50 text-sky-700 border-sky-100",
  };

  // --- INTERDIT ---
  if (!canUseBank || isBanned) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-50">
        <ShieldAlert size={64} className="mb-4 text-red-400" />
        <div className="uppercase font-black tracking-widest text-sm text-red-900">
          Accès Bancaire Interdit
        </div>
        <p className="text-xs mt-2">
          Vos droits économiques ont été révoqués.
        </p>
      </div>
    );
  }

  const pendingCount = pendingSignatures.length;
  const tabs = [
    { id: "operations", label: "Opérations", icon: Wallet },
    {
      id: "loans",
      label: "Contrats",
      icon: FileSignature,
      badge: pendingCount,
    },
    { id: "history", label: "Historique", icon: Scroll },
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-10">
      {/* ═══════════════ EN-TÊTE : SOLDE & STATS ═══════════════ */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-yellow-500 rounded-2xl p-6 md:p-8 shadow-2xl border border-yellow-600/20 relative overflow-hidden">
        {/* Motif décoratif */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 36px)",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Solde principal */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-600/20 rounded-lg">
                <PiggyBank size={20} className="text-yellow-500" />
              </div>
              <div className="text-[10px] uppercase font-bold tracking-[0.3em] text-yellow-600/80">
                Avoirs Personnels
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-yellow-600/50 hover:text-yellow-500 transition-colors ml-2"
              >
                {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
            <div className="text-5xl md:text-6xl font-black font-serif tracking-tighter">
              {showBalance ? (
                <>
                  {Number(user?.balance || 0).toLocaleString()}{" "}
                  <span className="text-lg font-sans font-medium text-yellow-600/60">
                    Écus
                  </span>
                </>
              ) : (
                <span className="text-yellow-600/40">••••••</span>
              )}
            </div>
            {showBalance && (
              <div className="flex items-center gap-4 mt-3 text-[10px] text-yellow-600/60">
                <span className="flex items-center gap-1">
                  <TrendingUp size={10} className="text-green-400" />
                  Reçu:{" "}
                  <span className="font-mono font-bold text-green-400">
                    {totalReceived.toLocaleString()}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <TrendingDown size={10} className="text-red-400" />
                  Envoyé:{" "}
                  <span className="font-mono font-bold text-red-400">
                    {totalSent.toLocaleString()}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Navigation onglets */}
          <div className="flex gap-2 flex-wrap">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "bg-yellow-600 text-stone-900 shadow-lg shadow-yellow-600/30 scale-105"
                      : "bg-stone-700/50 text-stone-400 hover:bg-stone-700 hover:text-stone-200"
                  }`}
                >
                  <TabIcon size={14} />
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Icône décorative */}
        <Coins
          size={140}
          className="absolute -right-8 -bottom-10 opacity-[0.06] text-yellow-100"
        />
      </div>

      {/* ═══════════════ STATS RAPIDES ═══════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Receipt}
          label="Transactions"
          value={myTransactions.length}
          color="bg-blue-50 text-blue-600"
          sub={`${myTransactions.filter((t) => t.toName === user.name).length} reçues`}
        />
        <StatCard
          icon={FileSignature}
          label="Contrats"
          value={allMyContracts.length}
          color="bg-purple-50 text-purple-600"
          sub={`${myDebts.length + myCredits.length} actifs`}
        />
        <StatCard
          icon={TrendingDown}
          label="Passif"
          value={`${totalDebtOwed.toLocaleString()} ¢`}
          color="bg-red-50 text-red-600"
          sub={`${myDebts.length} dette${myDebts.length !== 1 ? "s" : ""}`}
        />
        <StatCard
          icon={TrendingUp}
          label="Actif"
          value={`${totalCreditDue.toLocaleString()} ¢`}
          color="bg-green-50 text-green-600"
          sub={`${myCredits.length} créance${myCredits.length !== 1 ? "s" : ""}`}
        />
      </div>

      {/* ═══════════════ ONGLET 1 : OPÉRATIONS ═══════════════ */}
      {activeTab === "operations" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Formulaire Virement */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gradient-to-r from-stone-50 to-stone-100 flex items-center gap-3">
                <div className="p-2 bg-stone-800 rounded-lg">
                  <Send size={14} className="text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-stone-700">
                    Ordre de Virement
                  </h3>
                  <p className="text-[9px] text-stone-400 mt-0.5">
                    Transférer des fonds
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Type de bénéficiaire */}
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2 block">
                    Type de bénéficiaire
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setTransferTargetType("CITIZEN");
                        setTransferTarget("");
                      }}
                      className={`flex-1 px-3 py-2.5 rounded-lg text-[10px] font-bold uppercase border-2 transition-all flex items-center justify-center gap-2 ${
                        transferTargetType === "CITIZEN"
                          ? "bg-stone-800 text-white border-stone-800 shadow-md"
                          : "bg-white text-stone-400 border-stone-200 hover:border-stone-300 hover:text-stone-600"
                      }`}
                    >
                      <CreditCard size={12} />
                      Citoyen
                    </button>
                    {safeCompanies.length > 0 && (
                      <button
                        onClick={() => {
                          setTransferTargetType("COMPANY");
                          setTransferTarget(safeCompanies[0]?.id || "");
                        }}
                        className={`flex-1 px-3 py-2.5 rounded-lg text-[10px] font-bold uppercase border-2 transition-all flex items-center justify-center gap-2 ${
                          transferTargetType === "COMPANY"
                            ? "bg-stone-800 text-white border-stone-800 shadow-md"
                            : "bg-white text-stone-400 border-stone-200 hover:border-stone-300 hover:text-stone-600"
                        }`}
                      >
                        <Banknote size={12} />
                        Entreprise
                      </button>
                    )}
                    {safeCountries.length > 0 && (
                      <button
                        onClick={() => {
                          setTransferTargetType("COUNTRY");
                          setTransferTarget(safeCountries[0]?.id || "");
                        }}
                        className={`flex-1 px-3 py-2.5 rounded-lg text-[10px] font-bold uppercase border-2 transition-all flex items-center justify-center gap-2 ${
                          transferTargetType === "COUNTRY"
                            ? "bg-stone-800 text-white border-stone-800 shadow-md"
                            : "bg-white text-stone-400 border-stone-200 hover:border-stone-300 hover:text-stone-600"
                        }`}
                      >
                        <Landmark size={12} />
                        Pays
                      </button>
                    )}
                  </div>
                </div>

                {/* Bénéficiaire */}
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2 block">
                    Bénéficiaire
                  </label>
                  {transferTargetType === "CITIZEN" ? (
                    <UserSearchSelect
                      users={users}
                      onSelect={setTransferTarget}
                      placeholder="Rechercher un citoyen..."
                      excludeIds={[user.id]}
                      value={transferTarget}
                    />
                  ) : transferTargetType === "COMPANY" ? (
                    <select
                      className="w-full p-3 border-2 border-stone-200 rounded-lg font-bold text-sm bg-white focus:border-stone-400 outline-none transition-colors"
                      value={transferTarget}
                      onChange={(e) => setTransferTarget(e.target.value)}
                    >
                      <option value="">-- Choisir une entreprise --</option>
                      {safeCompanies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      className="w-full p-3 border-2 border-stone-200 rounded-lg font-bold text-sm bg-white focus:border-stone-400 outline-none transition-colors"
                      value={transferTarget}
                      onChange={(e) => setTransferTarget(e.target.value)}
                    >
                      <option value="">-- Choisir un pays --</option>
                      {safeCountries.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Montant */}
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2 block">
                    Montant
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full p-3 pr-16 bg-white border-2 border-stone-200 rounded-lg font-mono font-bold text-lg text-stone-900 outline-none focus:border-yellow-500 transition-colors"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-3.5 text-[10px] font-black text-stone-300 uppercase tracking-wider">
                      Écus
                    </span>
                  </div>
                  {transferAmount && parseInt(transferAmount) > (user?.balance || 0) && (
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-red-500 font-bold">
                      <AlertTriangle size={10} />
                      Fonds insuffisants
                    </div>
                  )}
                </div>

                {/* Motif (optionnel) */}
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2 block">
                    Motif{" "}
                    <span className="normal-case font-normal text-stone-300">
                      (optionnel)
                    </span>
                  </label>
                  <input
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 outline-none focus:border-stone-400 transition-colors font-serif italic"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="Raison du transfert..."
                  />
                </div>

                {/* Résumé & Action */}
                {transferTarget && transferAmount && (
                  <div className="bg-stone-50 rounded-lg p-3 border border-stone-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-500">Montant à envoyer</span>
                      <span className="font-black font-mono text-stone-800">
                        {parseInt(transferAmount || 0).toLocaleString()} Écus
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-stone-500">
                        Solde après transfert
                      </span>
                      <span
                        className={`font-black font-mono ${
                          (user?.balance || 0) - parseInt(transferAmount || 0) <
                          0
                            ? "text-red-500"
                            : "text-green-600"
                        }`}
                      >
                        {(
                          (user?.balance || 0) -
                          parseInt(transferAmount || 0)
                        ).toLocaleString()}{" "}
                        Écus
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleTransfer}
                  disabled={
                    !transferTarget ||
                    !transferAmount ||
                    parseInt(transferAmount) <= 0 ||
                    parseInt(transferAmount) > (user?.balance || 0)
                  }
                  className="w-full bg-gradient-to-r from-stone-800 to-stone-900 text-yellow-500 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:from-stone-700 hover:to-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Send size={14} />
                  Exécuter le Transfert
                </button>
              </div>
            </div>
          </div>

          {/* Dernières Transactions (aperçu rapide) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gradient-to-r from-stone-50 to-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-stone-800 rounded-lg">
                    <Scroll size={14} className="text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-stone-700">
                      Derniers Mouvements
                    </h3>
                    <p className="text-[9px] text-stone-400 mt-0.5">
                      {myTransactions.length} opération
                      {myTransactions.length !== 1 ? "s" : ""} au total
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("history")}
                  className="text-[10px] font-bold text-stone-400 hover:text-stone-700 uppercase tracking-wider transition-colors"
                >
                  Voir tout →
                </button>
              </div>

              <div className="max-h-[520px] overflow-y-auto">
                {myTransactions.length === 0 ? (
                  <div className="text-center py-16 text-stone-300">
                    <Receipt size={40} className="mx-auto mb-3 opacity-50" />
                    <div className="text-xs font-bold uppercase tracking-wider">
                      Aucun mouvement
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-50">
                    {myTransactions.slice(0, 15).map((tx) => {
                      const isIncoming = tx.toName === user.name;
                      return (
                        <div
                          key={tx.id}
                          className="flex justify-between items-center p-4 hover:bg-stone-50/50 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`p-2 rounded-lg shrink-0 ${
                                isIncoming
                                  ? "bg-green-50 text-green-600"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {isIncoming ? (
                                <ArrowDownLeft size={16} />
                              ) : (
                                <ArrowUpRight size={16} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-stone-800 text-sm truncate">
                                {isIncoming
                                  ? `De ${tx.fromName}`
                                  : `Vers ${tx.toName}`}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {tx.type && (
                                  <span
                                    className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                      typeColors[tx.type] ||
                                      "bg-stone-50 text-stone-500 border-stone-100"
                                    }`}
                                  >
                                    {typeLabels[tx.type] || tx.type}
                                  </span>
                                )}
                                <span className="text-[10px] text-stone-400 font-mono">
                                  {tx.timestamp
                                    ? new Date(
                                        tx.timestamp
                                      ).toLocaleDateString("fr-FR", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div
                            className={`font-black font-mono text-base shrink-0 ml-3 ${
                              isIncoming ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isIncoming ? "+" : "−"}
                            {tx.amount.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ ONGLET 2 : CONTRATS DE PRÊT ═══════════════ */}
      {activeTab === "loans" && (
        <div className="space-y-6">
          {/* ALERTES : Contrats en attente de signature */}
          {pendingSignatures.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-200 p-5 shadow-sm">
              <h3 className="text-xs font-black uppercase text-yellow-800 tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={14} className="text-yellow-600" />
                Signature Requise ({pendingSignatures.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingSignatures.map((contract) => (
                  <div
                    key={contract.id}
                    className="bg-white p-5 rounded-xl border border-yellow-200 shadow-sm relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-amber-500" />

                    <div className="flex justify-between items-start mb-3 mt-1">
                      <div>
                        <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                          Créancier
                        </div>
                        <div className="font-black text-stone-900 text-base">
                          {contract.creditorName}
                        </div>
                      </div>
                      <StatusBadge status="DRAFT" />
                    </div>

                    <div className="bg-stone-50 rounded-lg p-3 grid grid-cols-3 gap-3 mb-4 border border-stone-100 text-center">
                      <div>
                        <div className="text-[9px] text-stone-400 uppercase font-bold">
                          Prêt
                        </div>
                        <div className="font-black text-stone-800 text-sm">
                          {(contract.principal || 0).toLocaleString()} ¢
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-stone-400 uppercase font-bold">
                          Intérêts
                        </div>
                        <div className="font-black text-yellow-700 text-sm">
                          {contract.interestRate || 0}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-stone-400 uppercase font-bold">
                          Total dû
                        </div>
                        <div className="font-black text-red-600 text-sm">
                          {(contract.totalAmount || 0).toLocaleString()} ¢
                        </div>
                      </div>
                    </div>

                    {contract.dueDate && (
                      <div className="text-[10px] text-stone-400 mb-3 flex items-center gap-1.5">
                        <Calendar size={10} />
                        Échéance :{" "}
                        <span className="font-bold text-stone-600">
                          {contract.dueDate}
                        </span>
                      </div>
                    )}

                    {contract.reason && (
                      <div className="text-[10px] text-stone-500 italic mb-4 bg-stone-50 p-2 rounded border border-stone-100">
                        "{contract.reason}"
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => onSignDebt(contract.id)}
                        className="flex-1 bg-stone-900 text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
                      >
                        <Stamp size={12} /> Accepter & Signer
                      </button>
                      <button
                        onClick={() => onCancelDebt(contract.id)}
                        className="px-4 bg-white border-2 border-stone-200 text-stone-400 rounded-lg hover:border-red-300 hover:text-red-500 transition-all text-[10px] font-bold uppercase"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mes propositions en attente */}
          {myProposals.length > 0 && (
            <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5">
              <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest mb-3 flex items-center gap-2">
                <Clock size={14} />
                Mes Propositions en Attente ({myProposals.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {myProposals.map((contract) => (
                  <div
                    key={contract.id}
                    className="bg-white p-4 rounded-xl border border-stone-200 flex justify-between items-start group hover:shadow-md transition-shadow"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                        Proposé à
                      </div>
                      <div className="font-bold text-stone-800 text-sm truncate">
                        {contract.debtorName}
                      </div>
                      <div className="text-xs font-mono font-bold text-stone-600 mt-1">
                        {(contract.principal || 0).toLocaleString()} ¢
                        <span className="text-stone-400 text-[10px] ml-1">
                          → {(contract.totalAmount || 0).toLocaleString()} ¢
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onCancelDebt(contract.id)}
                      className="text-stone-300 hover:text-red-500 transition-colors p-1"
                      title="Annuler"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulaire : Proposer un Prêt */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gradient-to-r from-stone-50 to-stone-100 flex items-center gap-3">
                <div className="p-2 bg-stone-800 rounded-lg">
                  <PenTool size={14} className="text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-stone-700">
                    Rédiger un Contrat
                  </h3>
                  <p className="text-[9px] text-stone-400 mt-0.5">
                    Proposer un prêt à un citoyen
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2 block">
                    Bénéficiaire (Débiteur)
                  </label>
                  <UserSearchSelect
                    users={users}
                    onSelect={setLoanTarget}
                    excludeIds={[user.id]}
                    value={loanTarget}
                    placeholder="Choisir un citoyen..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2 block">
                      Somme Prêtée
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full p-2.5 pr-8 bg-white border-2 border-stone-200 rounded-lg font-mono font-bold text-stone-900 outline-none focus:border-yellow-500 transition-colors"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        placeholder="0"
                      />
                      <Coins
                        size={12}
                        className="absolute right-3 top-3.5 text-stone-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2 block">
                      Intérêts
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full p-2.5 pr-8 bg-white border-2 border-stone-200 rounded-lg font-mono font-bold text-stone-900 outline-none focus:border-yellow-500 transition-colors"
                        value={loanInterest}
                        onChange={(e) => setLoanInterest(e.target.value)}
                      />
                      <Percent
                        size={12}
                        className="absolute right-3 top-3.5 text-stone-300"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2 block">
                    Échéance
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full p-2.5 pr-8 bg-white border-2 border-stone-200 rounded-lg text-xs font-bold text-stone-900 outline-none focus:border-stone-400 transition-colors"
                      value={loanDueDate}
                      onChange={(e) => setLoanDueDate(e.target.value)}
                      placeholder="Ex: Fin du Cycle..."
                    />
                    <Calendar
                      size={12}
                      className="absolute right-3 top-3.5 text-stone-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2 block">
                    Motif / Conditions
                  </label>
                  <input
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-serif italic text-stone-700 outline-none focus:border-stone-400 transition-colors"
                    value={loanReason}
                    onChange={(e) => setLoanReason(e.target.value)}
                    placeholder="Ex: Financement expédition commerciale..."
                  />
                </div>

                {/* Récapitulatif */}
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-yellow-800">
                      Récapitulatif du contrat
                    </span>
                    <Scale size={14} className="text-yellow-600" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-yellow-700">Principal</span>
                      <span className="font-mono font-bold text-stone-800">
                        {loanAmount
                          ? parseInt(loanAmount).toLocaleString()
                          : "0"}{" "}
                        ¢
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-yellow-700">Intérêts</span>
                      <span className="font-mono font-bold text-yellow-700">
                        +
                        {loanAmount && loanInterest
                          ? Math.floor(
                              (parseInt(loanAmount) *
                                parseInt(loanInterest)) /
                                100
                            ).toLocaleString()
                          : "0"}{" "}
                        ¢
                      </span>
                    </div>
                    <div className="border-t border-yellow-200 pt-1.5 flex justify-between text-sm">
                      <span className="font-bold text-yellow-800">
                        Total à rembourser
                      </span>
                      <span className="font-black font-mono text-red-700 text-base">
                        {loanAmount
                          ? Math.floor(
                              parseInt(loanAmount) *
                                (1 + parseInt(loanInterest || 0) / 100)
                            ).toLocaleString()
                          : "0"}{" "}
                        ¢
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleProposeLoan}
                  disabled={!loanTarget || !loanAmount}
                  className="w-full bg-gradient-to-r from-stone-800 to-stone-900 text-white px-6 py-3.5 rounded-xl font-bold uppercase text-[10px] hover:from-stone-700 hover:to-stone-800 disabled:opacity-40 disabled:cursor-not-allowed tracking-widest shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <FileSignature size={14} />
                  Proposer le contrat
                </button>
              </div>
            </div>

            {/* Dettes & Créances actives */}
            <div className="space-y-6">
              {/* MES DETTES */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b flex items-center gap-3 bg-red-50/50">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ArrowUpRight size={14} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-red-800">
                      Mes Dettes
                    </h3>
                    <p className="text-[9px] text-red-400 mt-0.5">
                      {totalDebtOwed.toLocaleString()} ¢ à rembourser
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {myDebts.length === 0 ? (
                    <div className="text-center py-8 text-stone-300">
                      <CheckCircle2
                        size={32}
                        className="mx-auto mb-2 opacity-50"
                      />
                      <div className="text-[10px] font-bold uppercase tracking-wider">
                        Libre de toute dette
                      </div>
                    </div>
                  ) : (
                    myDebts.map((d) => (
                      <div
                        key={d.id}
                        className="bg-white p-4 rounded-xl border border-red-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 group-hover:w-1.5 transition-all" />
                        <div className="flex justify-between items-start mb-3 pl-2">
                          <div>
                            <div className="text-[9px] text-stone-400 uppercase font-bold tracking-wider">
                              Créancier
                            </div>
                            <div className="font-black text-stone-900 text-base leading-tight">
                              {d.creditorName}
                            </div>
                            {d.dueDate && (
                              <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
                                <Calendar size={9} /> {d.dueDate}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black font-mono text-red-600">
                              {(d.totalAmount || 0).toLocaleString()} ¢
                            </div>
                            <StatusBadge status="ACTIVE" />
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Rembourser ${d.totalAmount} écus à ${d.creditorName} ?`
                              )
                            ) {
                              onPayDebt(d.id);
                            }
                          }}
                          className="w-full mt-1 bg-red-50 text-red-700 border border-red-200 py-2 rounded-lg font-black uppercase text-[10px] hover:bg-red-600 hover:text-white hover:border-red-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Coins size={12} /> Rembourser
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* MES CRÉANCES */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b flex items-center gap-3 bg-green-50/50">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Handshake size={14} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-green-800">
                      Mes Créances
                    </h3>
                    <p className="text-[9px] text-green-400 mt-0.5">
                      {totalCreditDue.toLocaleString()} ¢ attendus
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {myCredits.length === 0 ? (
                    <div className="text-center py-8 text-stone-300">
                      <Handshake
                        size={32}
                        className="mx-auto mb-2 opacity-50"
                      />
                      <div className="text-[10px] font-bold uppercase tracking-wider">
                        Aucune créance
                      </div>
                    </div>
                  ) : (
                    myCredits.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white p-4 rounded-xl border border-green-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 group-hover:w-1.5 transition-all" />
                        <div className="flex justify-between items-start mb-3 pl-2">
                          <div>
                            <div className="text-[9px] text-stone-400 uppercase font-bold tracking-wider">
                              Débiteur
                            </div>
                            <div className="font-black text-stone-900 text-base leading-tight">
                              {c.debtorName}
                            </div>
                            {c.reason && (
                              <div className="text-[10px] text-stone-400 mt-1 italic">
                                "{c.reason}"
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black font-mono text-green-600">
                              {(c.totalAmount || 0).toLocaleString()} ¢
                            </div>
                            <StatusBadge status="ACTIVE" />
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "Faire grâce de cette dette ? Le débiteur n'aura plus rien à payer."
                              )
                            ) {
                              onCancelDebt(c.id);
                            }
                          }}
                          className="w-full mt-1 bg-stone-50 text-stone-400 border border-stone-200 py-2 rounded-lg font-black uppercase text-[10px] hover:bg-stone-100 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                        >
                          <Handshake size={12} /> Faire Grâce
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Historique complet des contrats */}
          {allMyContracts.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-stone-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-stone-200 rounded-lg">
                    <FileSignature size={14} className="text-stone-600" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-stone-700">
                    Registre des Contrats
                  </h3>
                </div>
                <div className="flex gap-1">
                  {["ALL", "ACTIVE", "PAID", "CANCELLED"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setContractFilter(f)}
                      className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase transition-all ${
                        contractFilter === f
                          ? "bg-stone-800 text-white"
                          : "text-stone-400 hover:text-stone-600"
                      }`}
                    >
                      {f === "ALL"
                        ? "Tous"
                        : f === "ACTIVE"
                        ? "Actifs"
                        : f === "PAID"
                        ? "Payés"
                        : "Annulés"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-stone-50 max-h-[300px] overflow-y-auto">
                {filteredContracts.length === 0 ? (
                  <div className="text-center py-8 text-stone-300 text-xs">
                    Aucun contrat trouvé.
                  </div>
                ) : (
                  filteredContracts
                    .sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id))
                    .map((c) => (
                      <div
                        key={c.id}
                        className="p-4 flex justify-between items-center hover:bg-stone-50/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-1.5 rounded-lg ${
                              c.creditorId === user.id
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {c.creditorId === user.id ? (
                              <TrendingUp size={14} />
                            ) : (
                              <TrendingDown size={14} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-stone-800 truncate">
                              {c.creditorId === user.id
                                ? `Prêt à ${c.debtorName}`
                                : `Emprunt de ${c.creditorName}`}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono">
                              {c.createdAt
                                ? new Date(c.createdAt).toLocaleDateString(
                                    "fr-FR"
                                  )
                                : "—"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <StatusBadge status={c.status} />
                          <div className="font-mono font-black text-sm text-stone-800">
                            {(c.totalAmount || 0).toLocaleString()} ¢
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ ONGLET 3 : HISTORIQUE COMPLET ═══════════════ */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Barre de filtres */}
          <div className="p-4 border-b bg-stone-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-800 rounded-lg">
                  <Scroll size={14} className="text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-stone-700">
                    Grand Livre des Comptes
                  </h3>
                  <p className="text-[9px] text-stone-400 mt-0.5">
                    {filteredTransactions.length} transaction
                    {filteredTransactions.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Recherche */}
              <div className="flex-1 relative">
                <Search
                  size={14}
                  className="absolute left-3 top-2.5 text-stone-300"
                />
                <input
                  className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-xs outline-none focus:border-stone-400 transition-colors"
                  placeholder="Rechercher par nom, motif..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>

              {/* Filtres rapides */}
              <div className="flex gap-1 flex-wrap">
                {[
                  { key: "ALL", label: "Tous" },
                  { key: "IN", label: "Reçus" },
                  { key: "OUT", label: "Envoyés" },
                  { key: "TRANSFER", label: "Virements" },
                  { key: "SALARY", label: "Salaires" },
                  { key: "DEBT_PAYMENT", label: "Dettes" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setHistoryFilter(f.key)}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                      historyFilter === f.key
                        ? "bg-stone-800 text-white shadow-sm"
                        : "bg-white border border-stone-200 text-stone-400 hover:text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Liste des transactions */}
          <div className="max-h-[600px] overflow-y-auto">
            {displayedTransactions.length === 0 ? (
              <div className="text-center py-16 text-stone-300">
                <Filter size={40} className="mx-auto mb-3 opacity-50" />
                <div className="text-xs font-bold uppercase tracking-wider">
                  Aucune transaction trouvée
                </div>
                <div className="text-[10px] text-stone-300 mt-1">
                  Modifiez vos filtres de recherche
                </div>
              </div>
            ) : (
              <>
                <div className="divide-y divide-stone-50">
                  {displayedTransactions.map((tx) => {
                    const isIncoming = tx.toName === user.name;
                    return (
                      <div
                        key={tx.id}
                        className="flex justify-between items-center p-4 hover:bg-stone-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              isIncoming
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {isIncoming ? (
                              <ArrowDownLeft size={16} />
                            ) : (
                              <ArrowUpRight size={16} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-stone-800 text-sm truncate">
                              {isIncoming
                                ? `Reçu de ${tx.fromName}`
                                : `Envoyé à ${tx.toName}`}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {tx.type && (
                                <span
                                  className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                    typeColors[tx.type] ||
                                    "bg-stone-50 text-stone-500 border-stone-100"
                                  }`}
                                >
                                  {typeLabels[tx.type] || tx.type}
                                </span>
                              )}
                              {tx.reason && (
                                <span className="text-[10px] text-stone-400 italic truncate max-w-[200px]">
                                  {tx.reason}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                              {tx.timestamp
                                ? new Date(tx.timestamp).toLocaleDateString(
                                    "fr-FR",
                                    {
                                      day: "2-digit",
                                      month: "long",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )
                                : `Ref: ${tx.id}`}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`font-black font-mono text-lg shrink-0 ml-4 ${
                            isIncoming ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isIncoming ? "+" : "−"}
                          {tx.amount.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Charger plus */}
                {!showAllHistory &&
                  filteredTransactions.length > 20 && (
                    <div className="p-4 text-center border-t border-stone-100">
                      <button
                        onClick={() => setShowAllHistory(true)}
                        className="text-[10px] font-bold text-stone-400 hover:text-stone-700 uppercase tracking-wider transition-colors flex items-center justify-center gap-1 mx-auto"
                      >
                        <ChevronDown size={12} />
                        Afficher les{" "}
                        {filteredTransactions.length - 20} transactions
                        restantes
                      </button>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenBankView;
