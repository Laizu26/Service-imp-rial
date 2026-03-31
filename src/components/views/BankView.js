import React, { useState, useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  EyeOff,
  Landmark,
  Crown,
  Flag,
  Users,
  Building2,
  Search,
  Filter,
  AlertTriangle,
  Snowflake,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import UserSearchSelect from "../ui/UserSearchSelect";

// --- Carte statistique ---
const TreasuryStatCard = ({ icon: Icon, label, value, color, sub }) => (
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
      {sub && <div className="text-[10px] text-stone-400 mt-0.5">{sub}</div>}
    </div>
  </div>
);

// --- Sélecteur de type de compte ---
const AccountTypeButton = ({ active, onClick, icon: Icon, label, color }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2.5 rounded-lg text-[10px] font-bold uppercase border-2 transition-all flex items-center gap-2 ${
      active
        ? `${color} border-current shadow-md`
        : "bg-white text-stone-400 border-stone-200 hover:border-stone-300 hover:text-stone-600"
    }`}
  >
    <Icon size={14} />
    {label}
  </button>
);

const BankView = ({
  users,
  countries,
  companies = [],
  treasury,
  ledger,
  onTransfer,
  session,
}) => {
  const [srcType, setSrcType] = useState("CITIZEN");
  const [srcId, setSrcId] = useState(session.id);
  const [tgtType, setTgtType] = useState("CITIZEN");
  const [tgtId, setTgtId] = useState("");
  const [amount, setAmount] = useState("");

  // Filtres du grand livre
  const [ledgerFilter, setLedgerFilter] = useState("ALL");
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [showAllLedger, setShowAllLedger] = useState(false);

  const isGlobalAdmin = ["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(
    session?.role
  );
  const canUseCountry = [
    "EMPEREUR",
    "GRAND_FONC_GLOBAL",
    "ROI",
    "INTENDANT",
    "GRAND_FONC_LOCAL",
  ].includes(session?.role);
  const safeUsers = Array.isArray(users) ? users : [];
  const safeCountries = Array.isArray(countries) ? countries : [];
  const safeCompanies = Array.isArray(companies) ? companies : [];
  const allowedCountries = isGlobalAdmin
    ? safeCountries
    : safeCountries.filter((c) => c.id === session?.countryId);

  const getRaw = (type, id) => {
    if (type === "GLOBAL") return "GLOBAL";
    if (type === "COUNTRY") return `C-${id}`;
    if (type === "CITIZEN") return `U-${id}`;
    if (type === "COMPANY") return `E-${id}`;
    return "";
  };

  const getBalance = (type, id) => {
    if (type === "GLOBAL") return treasury;
    if (type === "COUNTRY")
      return safeCountries.find((c) => c.id === id)?.treasury || 0;
    if (type === "CITIZEN")
      return safeUsers.find((u) => u.id === id)?.balance || 0;
    if (type === "COMPANY")
      return safeCompanies.find((c) => c.id === id)?.balance || 0;
    return 0;
  };

  const currentSrcBalance = getBalance(srcType, srcId);

  // Warnings
  const srcCountryObj =
    srcType === "COUNTRY"
      ? safeCountries.find((c) => c.id === srcId)
      : srcType === "CITIZEN"
      ? safeUsers.find((u) => u.id === srcId)
      : null;
  const srcCountryIdResolved =
    srcType === "COUNTRY"
      ? srcId
      : srcType === "CITIZEN"
      ? srcCountryObj?.countryId
      : null;
  const tgtCountryObj =
    tgtType === "COUNTRY"
      ? safeCountries.find((c) => c.id === tgtId)
      : tgtType === "CITIZEN"
      ? safeUsers.find((u) => u.id === tgtId)
      : null;
  const tgtCountryIdResolved =
    tgtType === "COUNTRY"
      ? tgtId
      : tgtType === "CITIZEN"
      ? tgtCountryObj?.countryId
      : null;

  const isBlockedByFreeze =
    srcType === "CITIZEN" &&
    srcId === session.id &&
    srcCountryIdResolved &&
    safeCountries.find((c) => c.id === srcCountryIdResolved)?.laws
      ?.freezeAssets &&
    !isGlobalAdmin;

  const taxApplies =
    tgtCountryIdResolved &&
    srcCountryIdResolved &&
    tgtCountryIdResolved !== srcCountryIdResolved &&
    safeCountries.find((c) => c.id === tgtCountryIdResolved)?.laws
      ?.taxForeignTransfers;

  const allowedSourceUsers =
    srcType === "CITIZEN" && !isGlobalAdmin
      ? safeUsers.filter((u) => u.countryId === session?.countryId)
      : safeUsers;

  // Statistiques
  const totalWealth = safeUsers.reduce(
    (sum, u) => sum + (u.balance || 0),
    0
  );
  const totalCompanyWealth = safeCompanies.reduce(
    (sum, c) => sum + (c.balance || 0),
    0
  );
  const totalCountryWealth = safeCountries.reduce(
    (sum, c) => sum + (c.treasury || 0),
    0
  );

  // Filtrage du grand livre
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
    TRANSFER: "bg-blue-100 text-blue-700 border-blue-200",
    MINT: "bg-yellow-100 text-yellow-700 border-yellow-200",
    SLAVE_PURCHASE: "bg-red-100 text-red-700 border-red-200",
    CONFISCATION: "bg-orange-100 text-orange-700 border-orange-200",
    MAISON: "bg-pink-100 text-pink-700 border-pink-200",
    SALARY: "bg-green-100 text-green-700 border-green-200",
    MANUMISSION: "bg-purple-100 text-purple-700 border-purple-200",
    DEBT_PAYMENT: "bg-emerald-100 text-emerald-700 border-emerald-200",
    HIDDEN_TRANSFER: "bg-amber-100 text-amber-700 border-amber-200",
    HIDE_MONEY: "bg-stone-100 text-stone-600 border-stone-200",
    WITHDRAW_HIDDEN: "bg-stone-100 text-stone-600 border-stone-200",
    COMPANY_TREASURY: "bg-indigo-100 text-indigo-700 border-indigo-200",
    SALARY_WITHDRAW: "bg-teal-100 text-teal-700 border-teal-200",
    COMPANY_LEVEL: "bg-violet-100 text-violet-700 border-violet-200",
    SUBCONTRACT: "bg-orange-100 text-orange-700 border-orange-200",
    PLAYER_MARKET: "bg-cyan-100 text-cyan-700 border-cyan-200",
    TRADE: "bg-lime-100 text-lime-700 border-lime-200",
    PROPERTY_PURCHASE: "bg-rose-100 text-rose-700 border-rose-200",
    RENT: "bg-sky-100 text-sky-700 border-sky-200",
  };

  const filteredLedger = useMemo(() => {
    const entries = [...(Array.isArray(ledger) ? ledger : [])].sort(
      (a, b) => (b.timestamp || b.id || 0) - (a.timestamp || a.id || 0)
    );
    let result = entries;
    if (ledgerFilter !== "ALL") {
      result = result.filter((l) => l.type === ledgerFilter);
    }
    if (ledgerSearch.trim()) {
      const q = ledgerSearch.toLowerCase();
      result = result.filter(
        (l) =>
          (l.fromName || "").toLowerCase().includes(q) ||
          (l.toName || "").toLowerCase().includes(q) ||
          (l.reason || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [ledger, ledgerFilter, ledgerSearch]);

  const displayedLedger = showAllLedger
    ? filteredLedger
    : filteredLedger.slice(0, 50);

  // Comptes cachés
  const hiddenAccounts = isGlobalAdmin
    ? safeUsers.filter((u) => (u.hiddenBalance || 0) > 0)
    : [];

  const handleTransfer = () => {
    if (amount > 0 && srcId && tgtId) {
      onTransfer(getRaw(srcType, srcId), getRaw(tgtType, tgtId), parseInt(amount));
      setAmount("");
    }
  };

  // Composant pour un sélecteur de compte
  const AccountSelector = ({ type, id, setType, setId, label, isSource }) => (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
      <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3 flex items-center gap-2">
        {isSource ? (
          <ArrowUpRight className="text-red-500" size={14} />
        ) : (
          <ArrowDownLeft className="text-green-500" size={14} />
        )}
        {label}
      </div>

      {/* Boutons de type */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {isGlobalAdmin && (
          <AccountTypeButton
            active={type === "GLOBAL"}
            onClick={() => {
              setType("GLOBAL");
              setId("GLOBAL");
            }}
            icon={Crown}
            label="Empire"
            color="bg-yellow-50 text-yellow-700"
          />
        )}
        {canUseCountry && (
          <AccountTypeButton
            active={type === "COUNTRY"}
            onClick={() => {
              setType("COUNTRY");
              setId(allowedCountries[0]?.id || "");
            }}
            icon={Flag}
            label="Nation"
            color="bg-blue-50 text-blue-700"
          />
        )}
        <AccountTypeButton
          active={type === "CITIZEN"}
          onClick={() => {
            setType("CITIZEN");
            setId(isSource ? session.id : "");
          }}
          icon={Users}
          label="Citoyen"
          color="bg-stone-100 text-stone-700"
        />
        {safeCompanies.length > 0 && (
          <AccountTypeButton
            active={type === "COMPANY"}
            onClick={() => {
              setType("COMPANY");
              setId(safeCompanies[0]?.id || "");
            }}
            icon={Building2}
            label="Entreprise"
            color="bg-purple-50 text-purple-700"
          />
        )}
      </div>

      {/* Sélecteur selon type */}
      <div className="mb-3">
        {type === "GLOBAL" && (
          <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg font-bold text-yellow-800 text-sm flex items-center gap-2">
            <Crown size={16} className="text-yellow-600" />
            Trésor Impérial Central
          </div>
        )}
        {type === "COUNTRY" && (
          <select
            className="w-full p-3 border-2 border-stone-200 rounded-lg font-bold text-sm bg-white focus:border-stone-400 outline-none transition-colors"
            value={id}
            onChange={(e) => setId(e.target.value)}
          >
            {(isSource ? allowedCountries : safeCountries).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({(c.treasury || 0).toLocaleString()} Écus)
              </option>
            ))}
          </select>
        )}
        {type === "CITIZEN" && (
          <UserSearchSelect
            users={isSource ? allowedSourceUsers : safeUsers}
            onSelect={(uid) => setId(uid)}
            value={id}
            placeholder={
              isSource
                ? "Rechercher le débiteur..."
                : "Rechercher le bénéficiaire..."
            }
          />
        )}
        {type === "COMPANY" && (
          <select
            className="w-full p-3 border-2 border-stone-200 rounded-lg font-bold text-sm bg-white focus:border-stone-400 outline-none transition-colors"
            value={id}
            onChange={(e) => setId(e.target.value)}
          >
            {safeCompanies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({(c.balance || 0).toLocaleString()} Écus)
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Solde */}
      {isSource && (
        <div className="flex justify-between items-center bg-stone-50 rounded-lg p-3 border border-stone-100">
          <span className="text-[10px] uppercase text-stone-400 font-bold">
            Solde Actuel
          </span>
          <span
            className={`font-mono font-bold text-lg ${
              currentSrcBalance < (parseInt(amount) || 0)
                ? "text-red-500"
                : "text-stone-800"
            }`}
          >
            {Number(currentSrcBalance).toLocaleString()} Écus
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 font-sans animate-fadeIn pb-10">
      {/* ═══════════════ EN-TÊTE AVEC STATS ═══════════════ */}
      {isGlobalAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <TreasuryStatCard
            icon={Crown}
            label="Trésor Impérial"
            value={`${Number(treasury || 0).toLocaleString()} ¢`}
            color="bg-yellow-50 text-yellow-600"
            sub="Caisse centrale"
          />
          <TreasuryStatCard
            icon={Users}
            label="Richesse Citoyenne"
            value={`${totalWealth.toLocaleString()} ¢`}
            color="bg-blue-50 text-blue-600"
            sub={`${safeUsers.length} citoyen${safeUsers.length !== 1 ? "s" : ""}`}
          />
          <TreasuryStatCard
            icon={Flag}
            label="Trésors Nationaux"
            value={`${totalCountryWealth.toLocaleString()} ¢`}
            color="bg-green-50 text-green-600"
            sub={`${safeCountries.length} nation${safeCountries.length !== 1 ? "s" : ""}`}
          />
          <TreasuryStatCard
            icon={Building2}
            label="Capital Entreprises"
            value={`${totalCompanyWealth.toLocaleString()} ¢`}
            color="bg-purple-50 text-purple-600"
            sub={`${safeCompanies.length} entreprise${safeCompanies.length !== 1 ? "s" : ""}`}
          />
        </div>
      )}

      {/* ═══════════════ CONSOLE DE TRANSACTION ═══════════════ */}
      <div className="bg-gradient-to-br from-[#fdf6e3] to-[#f5f0dc] rounded-2xl border border-stone-300 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-stone-200 bg-white/30 flex items-center gap-3">
          <div className="p-2.5 bg-stone-800 rounded-xl">
            <Landmark size={18} className="text-yellow-500" />
          </div>
          <div>
            <h3 className="font-black uppercase text-xs tracking-[0.3em] text-stone-700">
              Console de Transaction Impériale
            </h3>
            <p className="text-[9px] text-stone-400 mt-0.5">
              Transferts inter-comptes avec contrôle administratif
            </p>
          </div>
        </div>

        <div className="p-5 md:p-8">
          {/* Source & Cible */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <AccountSelector
              type={srcType}
              id={srcId}
              setType={setSrcType}
              setId={setSrcId}
              label="Compte Débiteur (Source)"
              isSource={true}
            />
            <AccountSelector
              type={tgtType}
              id={tgtId}
              setType={setTgtType}
              setId={setTgtId}
              label="Compte Créditeur (Cible)"
              isSource={false}
            />
          </div>

          {/* Avertissements */}
          {(isBlockedByFreeze || taxApplies) && (
            <div className="space-y-2 mb-6">
              {isBlockedByFreeze && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-bold">
                  <Snowflake size={16} className="text-red-500 shrink-0" />
                  Transferts bloqués : Gel des avoirs en vigueur dans votre
                  pays.
                </div>
              )}
              {taxApplies && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 font-bold">
                  <AlertTriangle
                    size={16}
                    className="text-yellow-600 shrink-0"
                  />
                  Une taxe de 10% s'appliquera au destinataire (taxe nationale
                  étrangère).
                </div>
              )}
            </div>
          )}

          {/* Montant & Action */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch bg-stone-100 p-5 rounded-xl border border-stone-200">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase text-stone-400 block mb-2 tracking-widest">
                Montant du Transfert
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full p-4 border-2 border-stone-300 rounded-xl text-xl font-bold bg-white outline-none focus:border-yellow-500 font-mono transition-colors"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
                <span className="absolute right-4 top-4 text-stone-300 font-bold text-sm">
                  Écus
                </span>
              </div>
              {amount && parseInt(amount) > currentSrcBalance && (
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-red-500 font-bold">
                  <AlertTriangle size={10} />
                  Le montant dépasse le solde source
                </div>
              )}
            </div>
            <div className="flex items-end">
              <button
                onClick={handleTransfer}
                disabled={
                  !amount ||
                  amount <= 0 ||
                  !srcId ||
                  !tgtId ||
                  isBlockedByFreeze
                }
                className={`w-full md:w-auto px-10 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 ${
                  !amount || amount <= 0 || !srcId || !tgtId
                    ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-stone-800 to-stone-900 text-yellow-500 hover:from-stone-700 hover:to-stone-800 active:scale-[0.98] shadow-xl"
                }`}
              >
                <RefreshCw size={18} /> Exécuter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ COMPTES CACHÉS (Admin) ═══════════════ */}
      {hiddenAccounts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-5 shadow-sm">
          <h3 className="font-black border-b border-amber-200 pb-3 mb-4 uppercase text-[11px] tracking-[0.2em] text-amber-700 flex items-center gap-2">
            <EyeOff size={16} className="text-amber-500" /> Comptes Cachés
            Détectés
            <span className="ml-auto bg-amber-200 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-full font-mono">
              {hiddenAccounts.length}
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {hiddenAccounts.map((u) => (
              <div
                key={u.id}
                className="bg-white p-4 rounded-xl border border-amber-200 flex justify-between items-center hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="font-bold text-stone-800 text-sm">
                    {u.name}
                  </div>
                  <div className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">
                    Compte caché
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-black text-amber-700 text-sm">
                    {(u.hiddenBalance || 0).toLocaleString()} Écus
                  </div>
                  <div className="text-[9px] text-stone-400">
                    Visible : {(u.balance || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════ GRAND LIVRE ═══════════════ */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* En-tête avec filtres */}
        <div className="p-4 border-b bg-stone-50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-800 rounded-lg">
                <BarChart3 size={14} className="text-yellow-500" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-stone-700">
                  Grand Livre Impérial
                </h3>
                <p className="text-[9px] text-stone-400 mt-0.5">
                  {filteredLedger.length} transaction
                  {filteredLedger.length !== 1 ? "s" : ""} enregistrée
                  {filteredLedger.length !== 1 ? "s" : ""}
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
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
              />
            </div>

            {/* Filtres par type */}
            <div className="flex gap-1 flex-wrap">
              {[
                { key: "ALL", label: "Tous" },
                { key: "TRANSFER", label: "Virements" },
                { key: "MINT", label: "Frappe" },
                { key: "SALARY", label: "Salaires" },
                { key: "CONFISCATION", label: "Confiscations" },
                { key: "DEBT_PAYMENT", label: "Dettes" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setLedgerFilter(f.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                    ledgerFilter === f.key
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

        {/* Table du Grand Livre */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[700px]">
            <thead className="bg-stone-50 uppercase sticky top-0 border-b-2 border-stone-200 z-10">
              <tr>
                <th className="p-3 font-black text-stone-400 tracking-[0.15em] text-[10px]">
                  Date
                </th>
                <th className="p-3 font-black text-stone-400 tracking-[0.15em] text-[10px]">
                  Type
                </th>
                <th className="p-3 font-black text-stone-400 tracking-[0.15em] text-[10px]">
                  Source
                </th>
                <th className="p-3 font-black text-stone-400 tracking-[0.15em] text-[10px]">
                  Bénéficiaire
                </th>
                <th className="p-3 text-right font-black text-stone-400 tracking-[0.15em] text-[10px]">
                  Montant
                </th>
                <th className="p-3 font-black text-stone-400 tracking-[0.15em] text-[10px]">
                  Motif
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 font-bold text-stone-700">
              {displayedLedger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <Filter
                      size={32}
                      className="mx-auto mb-2 text-stone-200"
                    />
                    <div className="text-xs text-stone-300 font-bold uppercase tracking-wider">
                      Aucune transaction trouvée
                    </div>
                  </td>
                </tr>
              ) : (
                displayedLedger.map((l, i) => {
                  const typeLabel = typeLabels[l?.type] || "Autre";
                  const typeColor =
                    typeColors[l?.type] || "bg-stone-100 text-stone-600 border-stone-200";
                  return (
                    <tr
                      key={l?.id || i}
                      className="hover:bg-stone-50/50 transition-colors"
                    >
                      <td className="p-3 text-stone-400 text-[10px] font-mono whitespace-nowrap">
                        {l?.timestamp
                          ? new Date(l.timestamp).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${typeColor}`}
                        >
                          {typeLabel}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        {String(l?.fromName || "Archives")}
                      </td>
                      <td className="p-3 text-sm">
                        {String(l?.toName || "Archives")}
                      </td>
                      <td className="p-3 text-right font-mono text-stone-900 font-black text-sm">
                        {Number(l?.amount || 0).toLocaleString()}{" "}
                        <span className="text-stone-400 text-[10px]">Écus</span>
                      </td>
                      <td className="p-3 text-stone-400 text-[10px] normal-case font-normal max-w-[180px] truncate">
                        {l?.reason || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Charger plus */}
        {!showAllLedger && filteredLedger.length > 50 && (
          <div className="p-4 text-center border-t border-stone-100">
            <button
              onClick={() => setShowAllLedger(true)}
              className="text-[10px] font-bold text-stone-400 hover:text-stone-700 uppercase tracking-wider transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <ChevronDown size={12} />
              Afficher les {filteredLedger.length - 50} transactions restantes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankView;
