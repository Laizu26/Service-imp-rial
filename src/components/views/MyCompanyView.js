import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  CheckCircle,
  XCircle,
  Send,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Palette,
  Trash2,
  Plus,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  AlertTriangle,
  ScrollText,
  Megaphone,
  Shield,
  History,
  FileText,
  Star,
  Package,
  Calendar,
  Handshake,
  UserPlus,
  Clock,
  Coins,
  BarChart2,
  Lock,
  ArrowLeftRight,
  Crown,
  Smile,
} from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";
import SecureDeleteButton from "../ui/SecureDeleteButton";
import { OrderBookDepth, PriceHistoryChart, BoardVotingPanel } from "../ui/BourseWidgets";
import { formatMoney, getActiveStaffLoan } from "../../lib/gameUtils";

// ── Sous-composant ESPP — config patron (state propre pour éviter la synchro inter-entreprises) ──
function ESPPConfigCard({ myCompany, myListing, onUpdateCompanyESPP }) {
  const espp = myCompany.espp || {};
  const [discount, setDiscount] = useState(String(espp.discountPercent ?? 10));
  const [maxPer, setMaxPer] = useState(String(espp.maxSharesPerPurchase ?? ""));
  const [lockupDays, setLockupDays] = useState(String(espp.lockupDays ?? 0));
  const isActive = espp.enabled || false;

  // Resync quand les données de l'entreprise changent (ex: sauvegarde depuis autre session)
  useEffect(() => {
    setDiscount(String(espp.discountPercent ?? 10));
    setMaxPer(String(espp.maxSharesPerPurchase ?? ""));
    setLockupDays(String(espp.lockupDays ?? 0));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myCompany.id]);

  const discountNum = Math.min(90, Math.max(1, parseFloat(discount) || 10));
  const marketPrice = myListing.lastPrice || myListing.initialPrice;
  const salaryPrice = Math.round(marketPrice * (1 - discountNum / 100) * 10) / 10;

  const save = (enabledOverride) => {
    onUpdateCompanyESPP(myCompany.id, {
      enabled: enabledOverride !== undefined ? enabledOverride : isActive,
      discountPercent: discountNum,
      maxSharesPerPurchase: parseInt(maxPer) || 0,
      lockupDays: Math.max(0, parseInt(lockupDays) || 0),
    });
  };

  return (
    <Card title="Plan d'Actionnariat Salarié" icon={TrendingUp}>
      <div className="space-y-4">
        {/* Toggle activer/désactiver */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-stone-700">Activer l'ESPP</div>
            <div className="text-[10px] text-stone-400 mt-0.5">
              Les employés peuvent acheter des actions de l'entreprise à prix réduit depuis leur compte salarial.
            </div>
          </div>
          <button
            onClick={() => save(!isActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-colors ${
              isActive ? "bg-emerald-500 text-white hover:bg-emerald-400" : "bg-stone-200 text-stone-500 hover:bg-stone-300"
            }`}
          >
            {isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {isActive ? "Actif" : "Inactif"}
          </button>
        </div>

        {/* Paramètres */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
              Remise (%)
            </label>
            <input
              type="number" min={1} max={90} step={1}
              className="w-full p-2 border rounded font-mono text-sm"
              placeholder="ex: 20"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
              Max / achat (0 = ∞)
            </label>
            <input
              type="number" min={0} step={1}
              className="w-full p-2 border rounded font-mono text-sm"
              placeholder="0"
              value={maxPer}
              onChange={(e) => setMaxPer(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
              Blocage (jours réels)
            </label>
            <input
              type="number" min={0} step={1}
              className="w-full p-2 border rounded font-mono text-sm"
              placeholder="0"
              value={lockupDays}
              onChange={(e) => setLockupDays(e.target.value)}
            />
          </div>
        </div>

        {/* Aperçu prix */}
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-[10px] flex items-center justify-between">
          <span className="text-stone-400">Prix marché → Prix salarié</span>
          <span className="font-black">
            <span className="line-through text-stone-400 mr-2">{formatMoney(marketPrice)}</span>
            <span className="text-emerald-600">{formatMoney(salaryPrice)}</span>
            <span className="text-stone-400 ml-1">(−{discountNum}%)</span>
          </span>
        </div>

        <button
          onClick={() => save()}
          className="w-full py-2 bg-stone-800 text-white text-xs font-black uppercase rounded-lg hover:bg-stone-700"
        >
          Enregistrer la configuration
        </button>

        {isActive && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-[10px] text-emerald-700 font-bold text-center">
            ESPP actif — −{espp.discountPercent}% pour vos {(myCompany.employees || []).length} employé(s)
            {(espp.lockupDays || 0) > 0 && <span className="ml-2 text-amber-600">· Blocage {espp.lockupDays}j</span>}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Contrats d'emploi médiévaux ──
const DEFAULT_CONTRACT = { type: "MERCENARIAT", contractDurationDays: "", dimePercent: "", corveeFreeDaysPerMonth: "", buyoutAmount: "", migrationLocked: false, customClauses: "", signingBonus: "", profitSharePercent: "", severanceAmount: "" };

const CONTRACT_TYPE_META = {
  MERCENARIAT: { label: "Mercenariat", badge: "bg-green-100 text-green-700 border-green-200", shortLabel: "MERCENAIRE", desc: "Contrat léger, résiliable librement" },
  APPRENTISSAGE: { label: "Apprentissage", badge: "bg-blue-100 text-blue-700 border-blue-200", shortLabel: "APPRENTI", desc: "Durée fixe — apprend un métier" },
  COMPAGNONNAGE: { label: "Compagnonnage", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", shortLabel: "COMPAGNON", desc: "Contrat équitable — profite autant au travailleur qu'à l'entreprise" },
  SERVAGE: { label: "Servage", badge: "bg-red-100 text-red-700 border-red-200", shortLabel: "SERF", desc: "Lien fort au seigneur, clause de rachat possible" },
};

const normalizeContractTerms = (t) => ({
  type: t.type || "MERCENARIAT",
  contractDurationDays: t.contractDurationDays ? parseInt(t.contractDurationDays) || null : null,
  dimePercent: parseFloat(t.dimePercent) || 0,
  corveeFreeDaysPerMonth: parseInt(t.corveeFreeDaysPerMonth) || 0,
  buyoutAmount: parseFloat(t.buyoutAmount) || 0,
  migrationLocked: t.migrationLocked || false,
  customClauses: t.customClauses ? t.customClauses.split("\n").filter((s) => s.trim()) : [],
  signingBonus: parseFloat(t.signingBonus) || 0,
  profitSharePercent: parseFloat(t.profitSharePercent) || 0,
  severanceAmount: parseFloat(t.severanceAmount) || 0,
});

function ContractTermsForm({ terms, onChange }) {
  const set = (key, val) => onChange({ ...terms, [key]: val });
  const isServage = terms.type === "SERVAGE";
  return (
    <div className="space-y-3 text-xs bg-stone-50 border border-stone-200 rounded-xl p-4">
      <div className="text-[10px] font-black uppercase text-stone-500 tracking-widest mb-1">Type de contrat</div>
      <div className="flex gap-2">
        {Object.entries(CONTRACT_TYPE_META).map(([val, meta]) => (
          <button key={val} type="button" onClick={() => set("type", val)}
            className={`flex-1 py-2 px-2 rounded border text-[10px] font-black transition-all ${terms.type === val ? meta.badge + " border-current shadow-sm" : "bg-white text-stone-400 border-stone-200 hover:border-stone-300"}`}
          >{meta.label}</button>
        ))}
      </div>
      <div className="text-[10px] text-stone-400 italic -mt-1">{CONTRACT_TYPE_META[terms.type]?.desc}</div>
      {!isServage && (
        <div>
          <label className="text-[10px] font-black uppercase text-stone-400 mb-1 block">Durée (jours RP) — laisser vide = illimité</label>
          <input type="number" min={1} step={1} value={terms.contractDurationDays} onChange={(e) => set("contractDurationDays", e.target.value)}
            className="w-full p-2 border rounded font-mono text-sm bg-white" placeholder="ex. 30" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black uppercase text-stone-400 mb-1 block">Dîme (% par jour)</label>
          <input type="number" min={0} max={100} step={1} value={terms.dimePercent} onChange={(e) => set("dimePercent", e.target.value)}
            className="w-full p-2 border rounded font-mono text-sm bg-white" placeholder="0 = aucune" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-stone-400 mb-1 block">Corvée (jours/mois)</label>
          <input type="number" min={0} max={30} step={1} value={terms.corveeFreeDaysPerMonth} onChange={(e) => set("corveeFreeDaysPerMonth", e.target.value)}
            className="w-full p-2 border rounded font-mono text-sm bg-white" placeholder="0 = aucune" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 items-end">
        <div>
          <label className="text-[10px] font-black uppercase text-stone-400 mb-1 block">Rachat de liberté (Écus)</label>
          <input type="number" min={0} step={0.1} value={terms.buyoutAmount} onChange={(e) => set("buyoutAmount", e.target.value)}
            className="w-full p-2 border rounded font-mono text-sm bg-white" placeholder="0 = libre" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none pb-2">
          <input type="checkbox" checked={terms.migrationLocked} onChange={(e) => set("migrationLocked", e.target.checked)} className="w-4 h-4 accent-red-600" />
          <span className="text-[10px] font-black uppercase text-stone-600 leading-tight">Interdit de migration</span>
        </label>
      </div>
      <div className="space-y-3 bg-emerald-50/60 border border-emerald-200 rounded-xl p-3">
        <div className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">Clauses favorables au travailleur</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase text-stone-400 mb-1 block">Prime d'embauche (Écus)</label>
            <input type="number" min={0} step={0.1} value={terms.signingBonus} onChange={(e) => set("signingBonus", e.target.value)}
              className="w-full p-2 border rounded font-mono text-sm bg-white" placeholder="0 = aucune" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-stone-400 mb-1 block">Indemnité de licenciement (Écus)</label>
            <input type="number" min={0} step={0.1} value={terms.severanceAmount} onChange={(e) => set("severanceAmount", e.target.value)}
              className="w-full p-2 border rounded font-mono text-sm bg-white" placeholder="0 = aucune" />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-stone-400 mb-1 block">Participation aux bénéfices (% du solde de l'entreprise, par jour)</label>
          <input type="number" min={0} max={100} step={0.5} value={terms.profitSharePercent} onChange={(e) => set("profitSharePercent", e.target.value)}
            className="w-full p-2 border rounded font-mono text-sm bg-white" placeholder="0 = aucune" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-black uppercase text-stone-400 mb-1 block">Clauses libres (une par ligne)</label>
        <textarea value={terms.customClauses} onChange={(e) => set("customClauses", e.target.value)}
          className="w-full p-2 border rounded text-xs resize-none bg-white" rows={3}
          placeholder="Ex. Le serf s'engage à fournir 5 lapins par mois..." />
      </div>
    </div>
  );
}

const TYPE_RATES = {
  SERVICE: { emp: 12, slave: 9, label: "Services / Commerce" },
  MANUFACTURE: { emp: 10, slave: 8, label: "Manufacture / Artisanat" },
  EXTRACTION: { emp: 8, slave: 7, label: "Extraction / Ferme" },
};

const MORALE_OPTIONS = [
  { id: "excellent", label: "Excellent", emoji: "😄" },
  { id: "bon", label: "Bon", emoji: "🙂" },
  { id: "neutre", label: "Neutre", emoji: "😐" },
  { id: "difficile", label: "Difficile", emoji: "😞" },
  { id: "epuise", label: "Épuisé(e)", emoji: "😫" },
];

const CONTRACT_FREQUENCIES = [
  { value: "daily", label: "Chaque jour RP" },
  { value: "weekly", label: "Chaque semaine RP (7 jours)" },
  { value: "monthly", label: "Chaque mois RP (1er du mois)" },
  { value: "par_tache", label: "À la tâche (paiement immédiat)" },
];

const emptyContractForm = (companyId, companyName) => ({
  id: "JOB-" + Date.now().toString().slice(-6),
  name: "",
  active: true,
  amount: 0,
  frequency: "monthly",
  source: { type: "COMPANY", id: companyId },
  sourceName: companyName,
  recipients: [],
});

// ── Modale de gestion d'employé (multi-onglets) ──
function EmployeeManagementModal({
  emp,
  empId,
  myCompany,
  loan, // présent uniquement pour gérer un salarié détaché — même modale qu'un employé classique,
        // pour éviter deux interfaces différentes pour la même chose (restrictions, grade...).
  selfMode, // présent uniquement pour un dirigeant/PDG gérant ses PROPRES droits — personne
            // au-dessus de lui dans l'entreprise pour le faire à sa place. Même modale, un seul
            // onglet Restrictions pertinent (pas de grade/contrat/salaire/licenciement pour soi-même).
  selfRights,
  onSetSelfRights,
  onClose,
  onSetEmployeeSerfRights,
  onSetEmployeeRank,
  onUpdateEmployeeContract,
  onCompanyFire,
  onSetCompanyMushtagramAccess,
  onClaimCorvee,
  onSetStaffLoanPermissions,
  onEndStaffLoan,
  formatMoney: fmtMoney,
}) {
  const [activeTab, setActiveTab] = useState("restrictions");
  const [fireConfirm, setFireConfirm] = useState(false);
  const isLoan = !!loan;
  const isSelf = !!selfMode;

  const empContract = (myCompany.employmentContracts || {})[empId] || {};
  const sr = isSelf ? (selfRights || {}) : isLoan ? (loan.permissions || {}) : (empContract.serfRights || {});
  const empRank = (myCompany.employeeRanks || {})[empId];
  const empDays = (myCompany.employeeSeniority || {})[empId] || 0;
  const empBalance = (myCompany.workerBalances || {})[empId] || 0;
  const ctMeta = empContract.type ? CONTRACT_TYPE_META[empContract.type] : null;
  const hasMushtagramAccess = (myCompany.mushtagramAuthorizedIds || []).map(String).includes(String(empId));

  // Onglet Contrat
  const [buyoutInput, setBuyoutInput] = useState(String(empContract.buyoutAmount || ""));
  const [corveeInput, setCorveeInput] = useState(String(empContract.corveeFreeDaysPerMonth || ""));
  const [profitShareInput, setProfitShareInput] = useState(String(empContract.profitSharePercent || ""));
  const [severanceInput, setSeveranceInput] = useState(String(empContract.severanceAmount || ""));

  // Onglet Grade
  const [rankTitle, setRankTitle] = useState(empRank?.title || "");

  const SERF_RIGHTS_LIST = [
    { key: "travelLocked", icon: "🚫", label: "Bloquer le voyage", desc: "Empêche tout déplacement inter-pays" },
    { key: "mushtagramLocked", icon: "📵", label: "Bloquer Mushtagram", desc: "Interdit l'accès au réseau social" },
    { key: "bankLocked", icon: "🏦", label: "Bloquer le compte bancaire", desc: "Interdit les opérations bancaires" },
    { key: "marketLocked", icon: "🛒", label: "Bloquer le marché", desc: "Interdit les échanges commerciaux (Bourse)" },
    { key: "postLocked", icon: "✉️", label: "Bloquer la Poste Impériale", desc: "Interdit l'envoi et la réception de courrier" },
  ];

  const TABS = isSelf
    ? [{ id: "restrictions", label: "Restrictions", icon: "🚫" }]
    : isLoan
    ? [
        { id: "restrictions", label: "Restrictions", icon: "🚫" },
        { id: "contract", label: "Détachement", icon: "🔄" },
        { id: "rank", label: "Grade", icon: "⭐" },
      ]
    : [
        { id: "restrictions", label: "Restrictions", icon: "🚫" },
        { id: "contract", label: "Contrat", icon: "📜" },
        { id: "rank", label: "Grade", icon: "⭐" },
        { id: "salary", label: "Salaire", icon: "💰" },
      ];

  const empName = isSelf ? (emp?.name || "Moi") : isLoan ? loan.employeeName : (emp ? emp.name : "Employé");
  const initial = (empName[0] || "?").toUpperCase();

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-stone-100">
          <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-base font-black text-stone-600 flex-shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-lg text-stone-900 truncate">{empName}</div>
            <div className="text-[10px] text-stone-400 flex items-center gap-2 flex-wrap">
              {isSelf ? (
                <span className="px-1.5 py-0.5 rounded border text-[9px] font-black uppercase bg-yellow-100 text-yellow-700 border-yellow-200">
                  Mes droits
                </span>
              ) : isLoan ? (
                <>
                  <span className="px-1.5 py-0.5 rounded border text-[9px] font-black uppercase bg-blue-100 text-blue-700 border-blue-200">Détaché</span>
                  <span>Prêté par {loan.fromCompanyName}</span>
                  <span>·</span>
                  <span>Solde ici : {fmtMoney(empBalance)}</span>
                </>
              ) : (
                <>
                  {ctMeta && <span className={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase ${ctMeta.badge}`}>{ctMeta.label}</span>}
                  <span>{empDays}j d'ancienneté</span>
                  <span>·</span>
                  <span>Solde: {fmtMoney(empBalance)}</span>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 flex-shrink-0 p-1 rounded">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100 px-2 pt-2 gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-t text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-stone-800 text-white"
                  : "text-stone-500 hover:bg-stone-100"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── ONGLET RESTRICTIONS ── */}
          {activeTab === "restrictions" && (
            <div className="space-y-2">
              <p className="text-[10px] text-stone-400 italic mb-3">
                {isSelf
                  ? "Personne ne gère vos droits à votre place en tant que dirigeant ou PDG — vous pouvez vous auto-restreindre ici (RP)."
                  : isLoan
                  ? "Ces restrictions s'appliquent tant que le détachement est en cours ici."
                  : "Ces restrictions s'appliquent tant que l'employé travaille dans cette entreprise."}
              </p>
              {SERF_RIGHTS_LIST.map(({ key, icon, label, desc }) => (
                <div key={key} className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-xs font-bold text-stone-700">{icon} {label}</div>
                    <div className="text-[10px] text-stone-400">{desc}</div>
                  </div>
                  <button
                    onClick={() => {
                      if (isSelf) {
                        onSetSelfRights({ [key]: !sr[key] });
                      } else if (isLoan) {
                        onSetStaffLoanPermissions({ loanId: loan.id, permissions: { ...sr, [key]: !sr[key] } });
                      } else {
                        onSetEmployeeSerfRights({ companyId: myCompany.id, citizenId: empId, rights: { [key]: !sr[key] } });
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-3 ${sr[key] ? "bg-red-500" : "bg-stone-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${sr[key] ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              ))}

              {!isSelf && onSetCompanyMushtagramAccess && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mt-3">
                  <div>
                    <div className="text-xs font-bold text-emerald-800">🏢 Accès au compte Mushtagram de l'entreprise</div>
                    <div className="text-[10px] text-emerald-600">Autorise cet employé à publier au nom de l'entreprise</div>
                  </div>
                  <button
                    onClick={() => onSetCompanyMushtagramAccess({ companyId: myCompany.id, citizenId: empId, authorized: !hasMushtagramAccess })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-3 ${hasMushtagramAccess ? "bg-emerald-600" : "bg-stone-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${hasMushtagramAccess ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── ONGLET CONTRAT / DÉTACHEMENT ── */}
          {activeTab === "contract" && isLoan && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800">Prêté par</span>
                  <span className="text-sm font-black text-blue-900">{loan.fromCompanyName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800">Compte interne ici</span>
                  <span className="text-sm font-black text-blue-900">{fmtMoney(empBalance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800">Durée</span>
                  <span className="text-sm font-black text-blue-900">
                    {loan.durationType === "FIXED" ? `Jour ${loan.daysElapsed}/${loan.durationDays}` : "Indéterminée (rappelable)"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800">Exclusivité</span>
                  <span className="text-sm font-black text-blue-900">{loan.exclusive ? "Exclusif" : "Partagé (production 50/50)"}</span>
                </div>
              </div>
              <p className="text-[10px] text-stone-400 italic">
                Le contrat d'emploi reste géré par {loan.fromCompanyName}, l'employeur d'origine — mais {myCompany?.name || "l'entreprise emprunteuse"} peut
                vous verser un salaire ici même, via "Payer les salaires". Ce compte est reversé sur votre banque personnelle si le détachement prend fin.
              </p>
            </div>
          )}
          {activeTab === "contract" && !isLoan && (
            <div className="space-y-4">
              {/* Type (readonly) */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500">Type de contrat</span>
                {ctMeta ? (
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase ${ctMeta.badge}`}>{ctMeta.label}</span>
                ) : (
                  <span className="text-xs text-stone-400 italic">Non défini</span>
                )}
              </div>

              {/* Montant de rachat */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block">Montant de rachat (Écus)</label>
                <div className="flex gap-2">
                  <input
                    type="number" min={0} step={0.1}
                    className="flex-1 p-2 border rounded font-mono text-sm"
                    value={buyoutInput}
                    onChange={(e) => setBuyoutInput(e.target.value)}
                    placeholder="0 = libre"
                  />
                  <button
                    onClick={() => onUpdateEmployeeContract({ companyId: myCompany.id, citizenId: empId, updates: { buyoutAmount: parseFloat(buyoutInput) || 0 } })}
                    className="bg-stone-800 text-white px-3 py-2 rounded text-xs font-bold uppercase hover:bg-stone-700"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>

              {/* Corvée */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block">Corvée (jours/mois)</label>
                <div className="flex gap-2">
                  <input
                    type="number" min={0} max={30} step={1}
                    className="flex-1 p-2 border rounded font-mono text-sm"
                    value={corveeInput}
                    onChange={(e) => setCorveeInput(e.target.value)}
                    placeholder="0 = aucune"
                  />
                  <button
                    onClick={() => onUpdateEmployeeContract({ companyId: myCompany.id, citizenId: empId, updates: { corveeFreeDaysPerMonth: parseInt(corveeInput) || 0 } })}
                    className="bg-stone-800 text-white px-3 py-2 rounded text-xs font-bold uppercase hover:bg-stone-700"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>

              {/* Migration verrouillée */}
              <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                <div>
                  <div className="text-xs font-bold text-stone-700">Migration verrouillée</div>
                  <div className="text-[10px] text-stone-400">Interdit de changer d'employeur</div>
                </div>
                <button
                  onClick={() => onUpdateEmployeeContract({ companyId: myCompany.id, citizenId: empId, updates: { migrationLocked: !empContract.migrationLocked } })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-3 ${empContract.migrationLocked ? "bg-red-500" : "bg-stone-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${empContract.migrationLocked ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              {/* Clauses favorables au travailleur */}
              <div className="space-y-3 bg-emerald-50/60 border border-emerald-200 rounded-xl p-3">
                <div className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">Clauses favorables au travailleur</div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block">Participation aux bénéfices (%/jour)</label>
                  <div className="flex gap-2">
                    <input
                      type="number" min={0} max={100} step={0.5}
                      className="flex-1 p-2 border rounded font-mono text-sm bg-white"
                      value={profitShareInput}
                      onChange={(e) => setProfitShareInput(e.target.value)}
                      placeholder="0 = aucune"
                    />
                    <button
                      onClick={() => onUpdateEmployeeContract({ companyId: myCompany.id, citizenId: empId, updates: { profitSharePercent: parseFloat(profitShareInput) || 0 } })}
                      className="bg-emerald-700 text-white px-3 py-2 rounded text-xs font-bold uppercase hover:bg-emerald-600"
                    >
                      Sauvegarder
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block">Indemnité de licenciement (Écus)</label>
                  <div className="flex gap-2">
                    <input
                      type="number" min={0} step={0.1}
                      className="flex-1 p-2 border rounded font-mono text-sm bg-white"
                      value={severanceInput}
                      onChange={(e) => setSeveranceInput(e.target.value)}
                      placeholder="0 = aucune"
                    />
                    <button
                      onClick={() => onUpdateEmployeeContract({ companyId: myCompany.id, citizenId: empId, updates: { severanceAmount: parseFloat(severanceInput) || 0 } })}
                      className="bg-emerald-700 text-white px-3 py-2 rounded text-xs font-bold uppercase hover:bg-emerald-600"
                    >
                      Sauvegarder
                    </button>
                  </div>
                </div>
                {empContract.signingBonus > 0 && (
                  <div className="text-[10px] text-emerald-700">Prime d'embauche versée à la signature : <strong>{fmtMoney(empContract.signingBonus)}</strong></div>
                )}
              </div>

              {/* Durée du contrat (readonly) */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500">Durée du contrat</span>
                <span className="font-bold text-stone-700">{empContract.contractDurationDays ? `${empContract.contractDurationDays} jours RP` : "Indéterminée"}</span>
              </div>

              {/* Clauses personnalisées (readonly) */}
              {(empContract.customClauses || []).length > 0 && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-1">
                  <div className="text-[9px] font-black uppercase text-stone-400 tracking-wide">Clauses</div>
                  {(empContract.customClauses || []).map((cl, i) => (
                    <div key={i} className="text-[10px] text-stone-600 flex gap-1.5"><span className="text-stone-300 font-bold">·</span>{cl}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ONGLET GRADE ── */}
          {activeTab === "rank" && (
            <div className="space-y-4">
              {empRank?.title && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Star size={16} className="text-purple-500 flex-shrink-0" />
                  <div>
                    <div className="text-[9px] font-black uppercase text-purple-400 tracking-widest">Grade actuel</div>
                    <div className="font-black text-purple-800">{empRank.title}</div>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block">Titre du grade</label>
                <input
                  type="text"
                  maxLength={80}
                  className="w-full p-2 border rounded text-sm"
                  value={rankTitle}
                  onChange={(e) => setRankTitle(e.target.value)}
                  placeholder="Ex: Maître forgeron, Comptable en chef..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onSetEmployeeRank(myCompany.id, empId, { title: rankTitle, permissions: {} })}
                  disabled={!rankTitle.trim()}
                  className="flex-1 bg-stone-800 text-white py-2 rounded text-xs font-bold uppercase hover:bg-stone-700 disabled:opacity-50"
                >
                  Sauvegarder
                </button>
                {empRank?.title && (
                  <button
                    onClick={() => { onSetEmployeeRank(myCompany.id, empId, null); setRankTitle(""); }}
                    className="px-4 py-2 bg-stone-100 text-stone-600 rounded text-xs font-bold uppercase hover:bg-stone-200 border border-stone-200"
                  >
                    Retirer le grade
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── ONGLET SALAIRE ── */}
          {activeTab === "salary" && !isLoan && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-4 text-center">
                <div className="text-[10px] font-black uppercase text-yellow-600 tracking-widest mb-1">Solde salarial</div>
                <div className="text-3xl font-black font-mono text-yellow-800">{fmtMoney(empBalance)}</div>
              </div>
              <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs text-stone-500 italic text-center">
                Le retrait est effectué par l'employé lui-même depuis son espace personnel.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center px-5 py-4 border-t border-stone-100 gap-3 ${isSelf ? "justify-end" : "justify-between"}`}>
          {!isSelf && (
            <div>
              {!isLoan && empContract.corveeFreeDaysPerMonth > 0 && onClaimCorvee && (
                <button
                  onClick={() => { onClaimCorvee(myCompany.id, empId); onClose(); }}
                  className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 text-xs font-black uppercase px-4 py-2 rounded-lg"
                >
                  Réclamer corvée
                </button>
              )}
            </div>
          )}
          {isSelf ? (
            <button
              onClick={onClose}
              className="bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-black uppercase hover:bg-stone-700"
            >
              Fermer
            </button>
          ) : (
            <div>
              {!fireConfirm ? (
                <button
                  onClick={() => setFireConfirm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase hover:bg-red-500 flex items-center gap-1.5"
                >
                  🔴 {isLoan ? "Mettre fin au détachement" : "Licencier"}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-600">Confirmer ?</span>
                  <button
                    onClick={() => {
                      if (isLoan) { onEndStaffLoan(loan.id, "ENDED"); } else { onCompanyFire(myCompany.id, empId, "FIRE"); }
                      onClose();
                    }}
                    className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-black uppercase hover:bg-red-500"
                  >
                    Oui
                  </button>
                  <button
                    onClick={() => setFireConfirm(false)}
                    className="bg-stone-200 text-stone-700 px-3 py-1.5 rounded text-xs font-black uppercase hover:bg-stone-300"
                  >
                    Non
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MyCompanyView = ({
  user,
  companies,
  citizens,
  jobContracts = [],
  onCompanyTreasury,
  onSendJobOffer,
  onRespondJobOffer,
  onPaySalaries,
  onCompanyFire,
  onCustomizeCompany,
  onDeleteCompany,
  onQuitCompany,
  onSaveJobContract,
  onDeleteJobContract,
  onToggleJobContract,
  onWithdrawCompanySalary,
  globalLedger = [],
  onPostBulletin,
  onDeleteBulletin,
  onSetEmployeeRank,
  onSetEmployeeSerfRights,
  onUpdateEmployeeContract,
  onApplyToCompany,
  onRespondApplication,
  onUpdateEmployeeProfile,
  onCompanyInventoryAdd,
  onCompanyInventoryRemove,
  onCreateCompanyEvent,
  onDeleteCompanyEvent,
  onCreateSubcontract,
  staffLoans = [],
  onCreateStaffLoan,
  onEndStaffLoan,
  onSetStaffLoanPermissions,
  bourseListings = [],
  onBourseCreateListing,
  onBourseEditListing,
  onBoursePayDividends,
  onBourseCompanyOffer,
  onBourseDirectOffer,
  onBourseCancelOrder,
  boardProposals = [],
  dayCycle = 0,
  onCreateBoardProposal,
  onCastBoardVote,
  onCancelBoardProposal,
  onUpdateCompanyESPP,
  onEmployeeBuyShares,
  onPayBuyout,
  onClaimCorvee,
  onSetCompanyMushtagramAccess,
  onAppointCEO,
  onRevokeCEO,
  properties = [],
  onAssignEmployeeToProperty,
  onSetSelfRights,
  onSetMyMorale,
}) => {
  // Une personne peut être liée à plusieurs entreprises à la fois : dirigeante de l'une, et PDG
  // d'une autre (typiquement après avoir été détachée puis nommée PDG chez l'emprunteuse, cf.
  // onAssignEmployeeToProperty/onAppointCEO). Toutes doivent rester accessibles, pas seulement
  // la première trouvée.
  const myCompanies = (companies || []).filter((c) => c.ownerId === user.id || c.ceoId === user.id);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const myCompany = myCompanies.find((c) => c.id === selectedCompanyId) || myCompanies[0];
  const isTrueOwner = myCompany ? myCompany.ownerId === user.id : false;
  const isCeoView = myCompany ? myCompany.ceoId === user.id : false;
  // Dès qu'un PDG est en poste, le propriétaire délègue TOUTE la gestion opérationnelle (voir
  // isCompanyManager côté backend) — il ne garde que la révocation du PDG et la dissolution.
  const isDelegatedOwner = isTrueOwner && !!myCompany?.ceoId;
  // Une fois l'entreprise cotée en bourse, elle a des actionnaires — le propriétaire ne doit plus
  // pouvoir ponctionner la trésorerie sous couvert de "dividendes" personnels sans les partager ;
  // seul le vrai versement de dividendes par action (onglet Bourse) reste disponible.
  const myBourseListing = myCompany ? (bourseListings || []).find((l) => l.companyId === myCompany.id) : null;
  const employedAt = !myCompany
    ? (companies || []).find((c) =>
        (c.employees || []).includes(user.id)
      )
    : null;
  const slavedAt =
    !myCompany && !employedAt
      ? (companies || []).find((c) =>
          (c.slaves || []).includes(user.id)
        )
      : null;
  const myJobOffers = user.jobOffers || [];

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [hireTarget, setHireTarget] = useState("");
  const [activeTab, setActiveTab] = useState("hr");

  // Gestion des contrats (patron)
  const [contractForm, setContractForm] = useState(null);
  const [selectedContractId, setSelectedContractId] = useState(null);

  // Contrats d'emploi médiévaux
  const [hireContractTerms, setHireContractTerms] = useState(DEFAULT_CONTRACT);
  const [showContractForm, setShowContractForm] = useState(false);
  const [appContractTerms, setAppContractTerms] = useState(DEFAULT_CONTRACT);
  const [expandedAppId, setExpandedAppId] = useState(null);

  // Salaires individuels
  const [salaryMap, setSalaryMap] = useState({});

  // Personnalisation
  const [editDesc, setEditDesc] = useState("");
  const [editMotto, setEditMotto] = useState("");
  const [editColor, setEditColor] = useState("#8B5CF6");
  const [editHiring, setEditHiring] = useState(true);
  const [empWithdrawAmount, setEmpWithdrawAmount] = useState("");
  const [esppBuyQty, setEsppBuyQty] = useState(1);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  // Babillard
  const [bulletinMsg, setBulletinMsg] = useState("");

  // Gestion employé (modale multi-onglets)
  const [managingEmployee, setManagingEmployee] = useState(null);
  // Auto-gestion des droits (dirigeant/PDG) — même modale que pour gérer un employé, en mode
  // "self" (personne au-dessus d'eux dans l'entreprise pour le faire à leur place).
  const [managingSelf, setManagingSelf] = useState(false);

  // Grades
  const [rankEditTarget, setRankEditTarget] = useState(null);
  const [rankTitle, setRankTitle] = useState("");
  const [rankPerms, setRankPerms] = useState({});

  // Profil employé
  const [profileSkills, setProfileSkills] = useState(user.employeeProfile?.skills || "");
  const [profileExp, setProfileExp] = useState(user.employeeProfile?.experience || "");
  const [profileSeeking, setProfileSeeking] = useState(user.employeeProfile?.seeking || false);

  // Inventaire entreprise
  const [invItemName, setInvItemName] = useState("");
  const [invItemQty, setInvItemQty] = useState("");

  // Événements
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventDate, setEventDate] = useState("");

  // Sous-traitance
  const [subTargetCompany, setSubTargetCompany] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [subDesc, setSubDesc] = useState("");

  // PDG
  const [ceoTarget, setCeoTarget] = useState("");

  // Détachement de personnel
  const [loanForm, setLoanForm] = useState({
    employeeId: "", toCompanyId: "", signingBonus: "",
    exclusive: false, durationType: "FIXED", durationDays: "",
  });
  const [managingLoanId, setManagingLoanId] = useState(null);
  // Employé (CAS 1) : bascule entre l'entreprise employeuse et celle où il est détaché
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState(null);

  // Bourse
  const [bourseForm, setBourseForm] = useState({ symbol: "", totalShares: "", onMarket: "", price: "", desc: "", offerQty: "", offerPrice: "", dividend: "", showDividendForm: false, directTarget: "", directQty: "", directPrice: "" });
  const setBF = (patch) => setBourseForm((p) => ({ ...p, ...patch }));

  const mySlaves = (citizens || []).filter(
    (c) => c.ownerId === user.id && !c.isForSale
  );

  const openCustomize = () => {
    if (myCompany) {
      setEditDesc(myCompany.description || "");
      setEditMotto(myCompany.motto || "");
      setEditColor(myCompany.color || "#8B5CF6");
      setEditHiring(myCompany.hiringOpen !== false);
      setCustomizeOpen(true);
    }
  };

  const saveCustomize = () => {
    if (myCompany && onCustomizeCompany) {
      onCustomizeCompany(myCompany.id, {
        description: editDesc,
        motto: editMotto,
        color: editColor,
        hiringOpen: editHiring,
      });
      setCustomizeOpen(false);
    }
  };

  // --- CAS 1 : CITOYEN SANS ENTREPRISE (ni propriétaire, ni employé, ni esclave) ---
  if (!myCompany) {
    const homeCompany = employedAt || slavedAt;
    const isEmployee = !!employedAt;
    const isSlave = !!slavedAt;
    // Détaché ailleurs (comme salarié) : l'entreprise emprunteuse doit être visible au même titre
    // que l'entreprise employeuse, avec un sélecteur pour basculer entre les deux — un employé
    // détaché est un vrai membre de l'équipe côté emprunteur, pas juste une ligne dans un carnet.
    const myLoanAsWorker = getActiveStaffLoan(user.id, staffLoans);
    const loanedToCompany = myLoanAsWorker ? (companies || []).find((c) => c.id === myLoanAsWorker.toCompanyId) : null;
    const workplaces = [
      ...(homeCompany ? [{ company: homeCompany, kind: "home" }] : []),
      ...(loanedToCompany && loanedToCompany.id !== homeCompany?.id ? [{ company: loanedToCompany, kind: "loaned" }] : []),
    ];
    const selectedWorkplace = workplaces.find((w) => w.company.id === selectedWorkplaceId) || workplaces[0];
    const workerCompany = selectedWorkplace?.company;
    const viewingLoanedCompany = selectedWorkplace?.kind === "loaned";
    const workplaceSwitcher = workplaces.length > 1 && (
      <div className="flex gap-2 flex-wrap">
        {workplaces.map((w) => {
          const active = w.company.id === workerCompany.id;
          return (
            <button
              key={w.company.id}
              onClick={() => setSelectedWorkplaceId(w.company.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border transition-colors ${
                active ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: w.company.color || "#8B5CF6" }} />
              {w.company.name}
              <span className={`px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-stone-100"}`}>{w.kind === "home" ? "Employeur" : "Détaché"}</span>
            </button>
          );
        })}
      </div>
    );

    return (
      <div className="space-y-6 animate-fadeIn">
        {workplaceSwitcher}
        {/* FICHE EMPLOYÉ / ESCLAVE */}
        {workerCompany && (() => {
          const owner = citizens.find((c) => c.id === workerCompany.ownerId);
          const wRates = TYPE_RATES[workerCompany.type] || { emp: 10, slave: 8, label: workerCompany.type };
          const wEmpCount = (workerCompany.employees || []).length;
          const wSlaveCount = (workerCompany.slaves || []).length;
          const wLevel = workerCompany.level || 1;
          const colleagues = (workerCompany.employees || [])
            .filter((id) => id !== user.id)
            .map((id) => citizens.find((c) => c.id === id))
            .filter(Boolean);

          return (
            <div className="space-y-6">
              {/* Header entreprise */}
              <div
                className="bg-white border-l-8 p-6 rounded-r-xl shadow-lg"
                style={{ borderColor: workerCompany.color || "#8B5CF6" }}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="text-xs font-black uppercase text-stone-400 tracking-widest mb-1">
                      {viewingLoanedCompany ? "Détaché chez" : isEmployee ? "Employé chez" : "Affecté à"}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: workerCompany.color || "#8B5CF6" }}
                      />
                      <h1 className="text-3xl font-black font-serif text-stone-900">
                        {workerCompany.name}
                      </h1>
                    </div>
                    <div className="flex gap-3 mt-2 flex-wrap">
                      <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
                        {wRates.label}
                      </span>
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
                        Niveau {wLevel}
                      </span>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        viewingLoanedCompany
                          ? "bg-blue-100 text-blue-700"
                          : isEmployee
                          ? "bg-green-100 text-green-600"
                          : "bg-stone-200 text-stone-500"
                      }`}>
                        {viewingLoanedCompany ? "Personnel détaché" : isEmployee ? "Salarié" : "Esclave affecté"}
                      </span>
                      {workerCompany.frozen && (
                        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-[10px] font-bold uppercase">
                          Gelée
                        </span>
                      )}
                    </div>
                    {workerCompany.motto && (
                      <div className="text-xs italic text-stone-400 mt-2">
                        "{workerCompany.motto}"
                      </div>
                    )}
                    {workerCompany.description && (
                      <div className="text-xs text-stone-500 mt-1">
                        {workerCompany.description}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    <div className="text-right bg-stone-50 p-3 rounded-xl border border-stone-200">
                      <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">
                        Solde personnel
                      </div>
                      <div className="text-2xl font-mono font-black text-stone-800">
                        {formatMoney((user.balance || 0))}
                      </div>
                    </div>
                    <div className="text-right bg-yellow-50 p-3 rounded-xl border border-yellow-200">
                      <div className="text-[10px] font-black uppercase text-yellow-700 tracking-widest mb-1">
                        Compte entreprise
                      </div>
                      <div className="text-2xl font-mono font-black text-yellow-800">
                        {formatMoney((workerCompany.workerBalances || {})[user.id] || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Détachement en cours (si applicable) — masqué en vue "loaned", déjà couvert par la
                  carte "Mon détachement" plus bas dans ce cas. */}
              {!viewingLoanedCompany && (() => {
                const myLoan = getActiveStaffLoan(user.id, staffLoans);
                if (!myLoan) return null;
                return (
                  <div className="bg-purple-50 border-l-8 border-purple-400 p-4 rounded-r-xl flex items-center gap-3">
                    <ArrowLeftRight size={20} className="text-purple-600 shrink-0" />
                    <div className="text-sm text-purple-800">
                      <span className="font-black">Actuellement détaché</span> chez{" "}
                      <span className="font-bold">{myLoan.toCompanyName}</span>
                      {myLoan.exclusive ? " (exclusif)" : ""} — vous restez salarié de {workerCompany.name}.
                    </div>
                  </div>
                );
              })()}

              {/* Infos entreprise */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Informations" icon={Building2}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-stone-100">
                      <span className="text-xs text-stone-500">Propriétaire</span>
                      <span className="text-sm font-bold text-stone-800">
                        {owner ? owner.name : "Inconnu"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-stone-100">
                      <span className="text-xs text-stone-500">Employés</span>
                      <span className="text-sm font-bold text-stone-800">{wEmpCount}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-stone-100">
                      <span className="text-xs text-stone-500">Esclaves</span>
                      <span className="text-sm font-bold text-stone-800">{wSlaveCount}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-stone-100">
                      <span className="text-xs text-stone-500">Production / jour</span>
                      <span className="text-sm font-mono font-bold text-green-600">
                        {formatMoney(((wEmpCount * wRates.emp + wSlaveCount * wRates.slave) * wLevel))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs text-stone-500">Taxe</span>
                      <span className="text-sm font-bold text-stone-600">
                        {workerCompany.taxRate ?? 10}%
                      </span>
                    </div>
                  </div>
                </Card>

                <Card title="Membres" icon={Users}>
                  <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto">
                    {/* Dirigeant */}
                    {owner && (
                      <div className="py-2.5 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center text-[10px] font-bold text-yellow-700 flex-shrink-0 border border-yellow-300" style={{ width: 28, height: 28, minWidth: 28, minHeight: 28 }}>
                          {(owner.name || "?")[0]}
                        </div>
                        <span className="text-sm font-bold text-stone-700">{owner.name}</span>
                        <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-yellow-200">
                          Dirigeant
                        </span>
                      </div>
                    )}
                    {/* PDG */}
                    {workerCompany.ceoId && (() => {
                      const ceo = citizens.find((c) => c.id === workerCompany.ceoId);
                      return (
                        <div className="py-2.5 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-700 flex-shrink-0 border border-purple-300" style={{ width: 28, height: 28, minWidth: 28, minHeight: 28 }}>
                            {(ceo?.name || "?")[0]}
                          </div>
                          <span className="text-sm font-bold text-stone-700">{ceo?.name || workerCompany.ceoId}</span>
                          <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-purple-300 flex items-center gap-0.5">
                            <Crown size={9} /> PDG
                          </span>
                        </div>
                      );
                    })()}
                    {/* Collègues */}
                    {colleagues.filter((c) => c.id !== workerCompany.ceoId).map((c) => {
                      const cRank = (workerCompany.employeeRanks || {})[c.id];
                      return (
                        <div key={c.id} className="py-2.5 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-500 flex-shrink-0" style={{ width: 28, height: 28, minWidth: 28, minHeight: 28 }}>
                            {(c.name || "?")[0]}
                          </div>
                          <span className="text-sm font-bold text-stone-700">{c.name}</span>
                          {cRank?.title ? (
                            <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-purple-200">
                              {cRank.title}
                            </span>
                          ) : (
                            <span className="bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">
                              Employé
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {/* Personnel détaché reçu par cette entreprise — mêmes collègues qu'un employé classique */}
                    {(staffLoans || [])
                      .filter((l) => l.status === "ACTIVE" && String(l.toCompanyId) === String(workerCompany.id) && String(l.employeeId) !== String(user.id))
                      .map((l) => {
                        const lRank = (workerCompany.employeeRanks || {})[l.employeeId];
                        return (
                          <div key={l.id} className="py-2.5 flex items-center gap-2 flex-wrap">
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 flex-shrink-0" style={{ width: 28, height: 28, minWidth: 28, minHeight: 28 }}>
                              {(l.employeeName || "?")[0]}
                            </div>
                            <span className="text-sm font-bold text-stone-700">{l.employeeName}</span>
                            {lRank?.title && (
                              <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-purple-200">{lRank.title}</span>
                            )}
                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-blue-200 flex items-center gap-0.5">
                              <ArrowLeftRight size={9} /> Détaché — {l.fromCompanyName}
                            </span>
                          </div>
                        );
                      })}
                    {colleagues.length === 0 && !owner && !workerCompany.ceoId && (
                      <div className="text-center text-stone-400 italic py-4 text-xs">
                        Aucun autre membre.
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Mon détachement — vue "employé" du détachement en cours, uniquement quand on
                  consulte l'entreprise emprunteuse */}
              {viewingLoanedCompany && myLoanAsWorker && (
                <Card title="Mon Détachement" icon={ArrowLeftRight}>
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                      Vous êtes actuellement détaché ici par <span className="font-black">{myLoanAsWorker.fromCompanyName}</span>
                      {myLoanAsWorker.exclusive ? " (détachement exclusif)" : " (détachement partagé)"}
                      {myLoanAsWorker.durationType === "FIXED"
                        ? ` — jour ${myLoanAsWorker.daysElapsed}/${myLoanAsWorker.durationDays}`
                        : " — durée indéterminée, rappelable à tout moment"}
                      . {workerCompany.name} peut vous verser un salaire ici via son compte interne (voir ci-dessous), reversé sur votre banque
                      personnelle si le détachement prend fin.
                    </div>
                    {Object.values(myLoanAsWorker.permissions || {}).some(Boolean) && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                        <div className="text-[9px] font-black uppercase text-red-600 tracking-widest">Restrictions imposées ici</div>
                        {[
                          { key: "travelLocked", label: "Voyage bloqué" },
                          { key: "mushtagramLocked", label: "Mushtagram bloqué" },
                          { key: "bankLocked", label: "Compte bancaire bloqué" },
                          { key: "marketLocked", label: "Marché bloqué" },
                          { key: "postLocked", label: "Poste Impériale bloquée" },
                        ].filter((p) => myLoanAsWorker.permissions?.[p.key]).map((p) => (
                          <div key={p.key} className="text-[10px] text-red-700 font-bold">🚫 {p.label}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Retrait de salaire (employé) */}
              {(isEmployee || (viewingLoanedCompany && myLoanAsWorker)) && onWithdrawCompanySalary && (() => {
                const myCompanyBalance = (workerCompany.workerBalances || {})[user.id] || 0;
                return myCompanyBalance > 0 ? (
                  <Card title="Retrait de Salaire" icon={Wallet}>
                    <div className="space-y-3">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-stone-600">
                        Vous avez <span className="font-black text-yellow-800">{formatMoney(myCompanyBalance)}</span> disponibles
                        sur votre compte interne. Retirez-les pour les transférer sur votre solde personnel.
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number" step="0.1"
                          className="flex-1 p-2 border rounded font-mono text-sm"
                          placeholder="Montant..."
                          value={empWithdrawAmount}
                          onChange={(e) => setEmpWithdrawAmount(e.target.value)}
                          max={myCompanyBalance}
                        />
                        <button
                          onClick={() => {
                            onWithdrawCompanySalary(workerCompany.id, empWithdrawAmount);
                            setEmpWithdrawAmount("");
                          }}
                          disabled={!empWithdrawAmount || parseFloat(empWithdrawAmount) <= 0}
                          className="bg-yellow-500 text-stone-900 px-4 py-2 rounded font-bold uppercase text-xs hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Wallet size={14} /> Retirer
                        </button>
                        <button
                          onClick={() => {
                            onWithdrawCompanySalary(workerCompany.id, myCompanyBalance);
                            setEmpWithdrawAmount("");
                          }}
                          className="bg-stone-800 text-white px-3 py-2 rounded font-bold uppercase text-xs hover:bg-stone-700"
                        >
                          Tout
                        </button>
                      </div>
                    </div>
                  </Card>
                ) : null;
              })()}

              {/* ── Mon Contrat de Travail ── */}
              {isEmployee && !viewingLoanedCompany && (() => {
                const myContract = (workerCompany.employmentContracts || {})[user.id];
                const ctMeta = myContract ? CONTRACT_TYPE_META[myContract.type] : null;
                const seniority = (workerCompany.employeeSeniority || {})[user.id] || 0;
                const canQuit = !myContract || !myContract.buyoutAmount;
                return (
                  <Card title="Mon Contrat de Travail" icon={ScrollText}>
                    {myContract ? (
                      <div className="space-y-3">
                        {/* Type badge + durée */}
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${ctMeta?.badge || "bg-stone-100 text-stone-600 border-stone-200"}`}>
                            {ctMeta?.label || myContract.type}
                          </span>
                          {myContract.contractDurationDays ? (
                            <div className="flex-1">
                              <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                                <span>Durée : Jour {seniority} / {myContract.contractDurationDays}</span>
                                <span>{Math.round(seniority / myContract.contractDurationDays * 100)}%</span>
                              </div>
                              <div className="w-full bg-stone-200 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${ctMeta?.badge?.includes("blue") ? "bg-blue-500" : ctMeta?.badge?.includes("green") ? "bg-green-500" : "bg-red-500"}`}
                                  style={{ width: `${Math.min(100, Math.round(seniority / myContract.contractDurationDays * 100))}%` }} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-stone-400">Durée indéterminée</span>
                          )}
                        </div>
                        {/* Clauses actives */}
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          {myContract.dimePercent > 0 && (
                            <div className="bg-red-50 border border-red-100 rounded px-2 py-1.5">
                              <div className="font-black text-red-700 uppercase tracking-wide">Dîme</div>
                              <div className="text-stone-600">{myContract.dimePercent}% de votre compte/jour</div>
                            </div>
                          )}
                          {myContract.corveeFreeDaysPerMonth > 0 && (
                            <div className="bg-amber-50 border border-amber-100 rounded px-2 py-1.5">
                              <div className="font-black text-amber-700 uppercase tracking-wide">Corvée</div>
                              <div className="text-stone-600">{myContract.corveeFreeDaysPerMonth} jour(s)/mois réclamables</div>
                            </div>
                          )}
                          {myContract.migrationLocked && (
                            <div className="bg-stone-100 border border-stone-200 rounded px-2 py-1.5">
                              <div className="font-black text-stone-700 uppercase tracking-wide flex items-center gap-1"><Lock size={10} /> Migration</div>
                              <div className="text-stone-600">Interdit de changer d'employeur</div>
                            </div>
                          )}
                          {myContract.buyoutAmount > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                              <div className="font-black text-amber-700 uppercase tracking-wide">Rachat</div>
                              <div className="text-stone-600">{formatMoney(myContract.buyoutAmount)} pour rompre le lien</div>
                            </div>
                          )}
                        </div>
                        {/* Clauses libres */}
                        {myContract.customClauses?.length > 0 && (
                          <div className="bg-stone-50 border border-stone-200 rounded p-2 space-y-1">
                            <div className="text-[9px] font-black uppercase text-stone-400 tracking-wide">Clauses</div>
                            {myContract.customClauses.map((cl, i) => (
                              <div key={i} className="text-[10px] text-stone-600 flex gap-1.5"><span className="text-stone-300 font-bold">·</span>{cl}</div>
                            ))}
                          </div>
                        )}
                        {/* Bouton rachat de liberté */}
                        {myContract.buyoutAmount > 0 && onPayBuyout && (
                          <button
                            onClick={() => onPayBuyout(workerCompany.id)}
                            className="w-full bg-amber-500 text-white py-2 rounded font-black uppercase text-xs hover:bg-amber-400 flex items-center justify-center gap-2"
                          >
                            <Lock size={13} /> Payer ma liberté — {formatMoney(myContract.buyoutAmount)}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-stone-400 italic text-xs py-3">Aucun contrat formalisé.</div>
                    )}
                  </Card>
                );
              })()}

              {/* ── Plan d'Actionnariat Salarié (ESPP) ── */}
              {isEmployee && !viewingLoanedCompany && (() => {
                const espp = workerCompany.espp || {};
                if (!espp.enabled) return null;
                const listing = bourseListings.find((l) => l.companyId === workerCompany.id && l.isActive);
                if (!listing) return null;
                const discount = Math.min(Math.max(parseFloat(espp.discountPercent) || 0, 0), 90);
                const marketPrice = listing.lastPrice || listing.initialPrice;
                const discountedPrice = Math.round(marketPrice * (1 - discount / 100) * 10) / 10;
                const companyFloat = (listing.sellOrders || []).filter((o) => o.citizenId === "COMPANY").reduce((s, o) => s + o.qty, 0);
                const maxPerPurchase = parseInt(espp.maxSharesPerPurchase) || 0;
                const myCompanyBal = (workerCompany.workerBalances || {})[user.id] || 0;
                const maxAffordable = discountedPrice > 0 ? Math.floor(myCompanyBal / discountedPrice) : 0;
                const qty = Math.max(1, parseInt(esppBuyQty) || 1);
                const totalCost = Math.round(qty * discountedPrice * 10) / 10;
                const canBuy = myCompanyBal >= totalCost && companyFloat >= qty && (maxPerPurchase <= 0 || qty <= maxPerPurchase);
                const now = Date.now();
                const activeLocks = (user.esppLocks || []).filter((l) => l.listingId === listing.id && l.unlocksAt > now);
                const totalLocked = activeLocks.reduce((sum, l) => sum + l.qty, 0);
                const totalHeld = (user.stockholdings || {})[listing.id] || 0;
                return (
                  <Card title="Actionnariat Salarié" icon={TrendingUp}>
                    <div className="space-y-4">
                      {/* Info remise */}
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            −{discount}% salarié
                          </span>
                          <span className="text-xs font-bold text-stone-700">{listing.symbol} — {listing.companyName}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div className="text-center">
                            <div className="text-[9px] text-stone-400 uppercase font-black">Prix marché</div>
                            <div className="font-mono font-black text-stone-500 line-through text-sm">{formatMoney(marketPrice)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[9px] text-emerald-600 uppercase font-black">Prix salarié</div>
                            <div className="font-mono font-black text-emerald-700 text-lg">{formatMoney(discountedPrice)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[9px] text-stone-400 uppercase font-black">Disponibles</div>
                            <div className="font-mono font-black text-stone-700 text-sm">{companyFloat.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                      {/* Compte entreprise disponible */}
                      <div className="flex items-center justify-between text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <span className="text-stone-500">Compte entreprise disponible</span>
                        <span className="font-black font-mono text-amber-700">{formatMoney(myCompanyBal)}</span>
                      </div>
                      {maxAffordable > 0 && (
                        <div className="text-[10px] text-stone-400 text-center">
                          Vous pouvez acheter jusqu'à <span className="font-black text-stone-600">{maxAffordable}</span> action(s)
                          {maxPerPurchase > 0 && <> (max {maxPerPurchase}/achat)</>}
                        </div>
                      )}
                      {/* Formulaire d'achat */}
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          max={Math.min(maxAffordable, companyFloat, maxPerPurchase > 0 ? maxPerPurchase : Infinity)}
                          value={esppBuyQty}
                          onChange={(e) => setEsppBuyQty(e.target.value)}
                          className="w-24 p-2 border rounded font-mono text-sm text-center font-bold"
                          placeholder="Qté"
                        />
                        <span className="text-xs text-stone-400 flex-1">
                          = <span className="font-black text-stone-700">{formatMoney(totalCost)}</span> depuis compte entreprise
                        </span>
                        <button
                          onClick={() => { if (canBuy) { onEmployeeBuyShares(workerCompany.id, listing.id, qty); setEsppBuyQty(1); } }}
                          disabled={!canBuy || !onEmployeeBuyShares}
                          className="bg-emerald-600 text-white px-4 py-2 rounded font-bold uppercase text-xs hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <TrendingUp size={13} /> Acheter
                        </button>
                      </div>
                      {!canBuy && myCompanyBal < totalCost && (
                        <div className="text-[10px] text-red-500 font-bold text-center">
                          Solde entreprise insuffisant ({formatMoney(myCompanyBal)} / {formatMoney(totalCost)})
                        </div>
                      )}
                      {/* Actions bloquées par période de blocage ESPP */}
                      {activeLocks.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Lock size={13} className="text-amber-600" />
                            <span className="text-[11px] font-black text-amber-700 uppercase tracking-wide">Actions bloquées — période de rétention</span>
                          </div>
                          <div className="text-[10px] text-stone-500">
                            Vous détenez <span className="font-black text-stone-700">{totalHeld}</span> action(s) au total, dont <span className="font-black text-amber-700">{totalLocked}</span> bloquée(s) (non vendables).
                          </div>
                          <div className="space-y-1">
                            {activeLocks.map((lock) => (
                              <div key={lock.id} className="flex justify-between items-center text-[10px] bg-white border border-amber-100 rounded px-2 py-1">
                                <span className="text-stone-600">{lock.qty} action(s) via ESPP</span>
                                <span className="font-black text-amber-600">Débloqué le {new Date(lock.unlocksAt).toLocaleDateString("fr-FR")}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })()}

              {/* Historique des paies */}
              {isEmployee && !viewingLoanedCompany && (() => {
                const salaryHistory = globalLedger.filter(
                  (e) => (e.type === "SALARY" || e.type === "SALARY_WITHDRAW") && (e.toName === user.name || e.fromName === workerCompany.name && e.toName === user.name)
                ).slice(0, 20);
                return salaryHistory.length > 0 ? (
                  <Card title="Historique des Paies" icon={History}>
                    <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto">
                      {salaryHistory.map((entry) => (
                        <div key={entry.id} className="py-2.5 flex justify-between items-center">
                          <div>
                            <div className="text-xs font-bold text-stone-700">
                              {entry.type === "SALARY" ? "Salaire reçu" : "Retrait vers solde perso."}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              {entry.reason || ""} — {new Date(entry.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                          <span className={`font-mono font-bold text-sm ${entry.type === "SALARY" ? "text-green-600" : "text-teal-600"}`}>
                            {entry.type === "SALARY" ? "+" : ""}{formatMoney(entry.amount || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : null;
              })()}

              {/* Contrats visibles (employé bénéficiaire) */}
              {isEmployee && (() => {
                const myContracts = jobContracts.filter(
                  (c) => c.source?.id === workerCompany.id && (c.recipients || []).some((r) => r.id === user.id)
                );
                return myContracts.length > 0 ? (
                  <Card title="Mes Contrats" icon={FileText}>
                    <div className="space-y-3">
                      {myContracts.map((c) => {
                        const myShare = (c.recipients || []).find((r) => r.id === user.id);
                        const freq = CONTRACT_FREQUENCIES.find((f) => f.value === c.frequency);
                        return (
                          <div key={c.id} className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-bold text-sm text-stone-800">{c.name || "Sans nom"}</div>
                                <div className="text-[10px] text-stone-500 mt-0.5">
                                  {freq?.label || c.frequency}
                                  {c.frequency !== "par_tache" && ` · ${formatMoney(c.amount || 0)} total`}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${c.active ? "bg-green-100 text-green-600" : "bg-stone-200 text-stone-500"}`}>
                                  {c.active ? "Actif" : "Inactif"}
                                </span>
                              </div>
                            </div>
                            {myShare && (
                              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-yellow-700 uppercase">Ma part</span>
                                <span className="font-mono font-bold text-sm text-yellow-800">
                                  {myShare.percent}%
                                  {c.frequency !== "par_tache" && ` = ${formatMoney(Math.floor((c.amount || 0) * myShare.percent / 100))}`}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ) : null;
              })()}

              {/* Babillard d'entreprise */}
              {(() => {
                const bulletin = workerCompany.bulletinBoard || [];
                return bulletin.length > 0 ? (
                  <Card title="Babillard" icon={Megaphone}>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {bulletin.map((b) => {
                        const author = citizens.find((c) => c.id === b.authorId);
                        return (
                          <div key={b.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="text-sm text-stone-800 whitespace-pre-wrap">{b.message}</div>
                            <div className="text-[10px] text-stone-400 mt-1.5 flex items-center gap-2">
                              <span className="font-bold">{author?.name || "Dirigeant"}</span>
                              <span>·</span>
                              <span>{new Date(b.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ) : null;
              })()}

              {/* Grade affiché */}
              {(() => {
                const myRank = (workerCompany.employeeRanks || {})[user.id];
                return myRank?.title ? (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
                    <Star size={20} className="text-purple-500 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] font-black uppercase text-purple-400 tracking-widest">Mon Grade</div>
                      <div className="text-lg font-black text-purple-800">{myRank.title}</div>
                      {myRank.permissions && Object.keys(myRank.permissions).filter((k) => myRank.permissions[k]).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(myRank.permissions).filter(([, v]) => v).map(([perm]) => (
                            <span key={perm} className="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">
                              {perm === "payroll" ? "Paie" : perm === "hire" ? "Recrutement" : perm === "bulletin" ? "Babillard" : perm === "contracts" ? "Contrats" : perm}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Ancienneté */}
              {(() => {
                const days = (workerCompany.employeeSeniority || {})[user.id] || 0;
                return days > 0 ? (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-center gap-3">
                    <Clock size={20} className="text-stone-400 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Ancienneté</div>
                      <div className="text-lg font-black text-stone-700">
                        {days} jour{days > 1 ? "s" : ""} RP
                        {days >= 30 && <span className="text-xs font-normal text-stone-400 ml-2">({Math.floor(days / 30)} mois)</span>}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Événements d'entreprise */}
              {(() => {
                const events = workerCompany.companyEvents || [];
                return events.length > 0 ? (
                  <Card title="Événements" icon={Calendar}>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {events.map((evt) => (
                        <div key={evt.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="font-bold text-sm text-stone-800">{evt.title}</div>
                            {evt.date && <span className="text-[10px] font-mono text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">{evt.date}</span>}
                          </div>
                          {evt.description && <div className="text-xs text-stone-500 mt-1">{evt.description}</div>}
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : null;
              })()}

              {/* Inventaire d'entreprise (lecture seule pour employé) */}
              {(() => {
                const inv = workerCompany.companyInventory || [];
                return inv.length > 0 ? (
                  <Card title="Stock de l'Entreprise" icon={Package}>
                    <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto">
                      {inv.map((item) => (
                        <div key={item.id} className="py-2 flex justify-between items-center">
                          <span className="text-sm font-bold text-stone-700">{item.name}</span>
                          <span className="font-mono text-sm font-bold text-stone-500">{item.quantity}x</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : null;
              })()}

              {/* Profil employé / CV — profil personnel, pas spécifique à une entreprise, affiché
                  une seule fois (sous l'identité d'emploi réelle) */}
              {isEmployee && !viewingLoanedCompany && (
                <Card title="Mon Profil Employé" icon={FileText}>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Compétences</label>
                      <input
                        className="w-full p-2 border rounded text-sm"
                        value={profileSkills}
                        onChange={(e) => setProfileSkills(e.target.value)}
                        placeholder="Ex: Forgeron, Comptable, Maçon..."
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Expérience</label>
                      <textarea
                        className="w-full p-2 border rounded text-sm resize-none"
                        rows={2}
                        value={profileExp}
                        onChange={(e) => setProfileExp(e.target.value)}
                        placeholder="Décrivez votre parcours..."
                        maxLength={200}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setProfileSeeking(!profileSeeking)}
                        className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase border ${
                          profileSeeking ? "bg-green-100 text-green-700 border-green-300" : "bg-stone-100 text-stone-500 border-stone-200"
                        }`}
                      >
                        {profileSeeking ? "En recherche d'emploi" : "Pas en recherche"}
                      </button>
                    </div>
                    <button
                      onClick={() => onUpdateEmployeeProfile && onUpdateEmployeeProfile({ skills: profileSkills, experience: profileExp, seeking: profileSeeking })}
                      className="bg-stone-800 text-white px-4 py-2 rounded font-bold uppercase text-xs hover:bg-stone-700 flex items-center gap-1"
                    >
                      <Check size={12} /> Enregistrer
                    </button>
                  </div>
                </Card>
              )}

              {/* Moral auto-déclaré — le joueur seul décide de son moral et de s'il le partage
                  avec son employeur. Aucune conséquence automatique n'en découle jamais. */}
              {isEmployee && !viewingLoanedCompany && onSetMyMorale && (
                <Card title="Mon Moral" icon={Smile}>
                  <div className="space-y-3">
                    <div className="text-xs text-stone-500 italic bg-stone-50 p-2 rounded">
                      Vous seul(e) décidez de votre moral, et de le partager ou non avec {workerCompany.name}. Aucune conséquence automatique n'en découle.
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {MORALE_OPTIONS.map((opt) => {
                        const active = user.morale?.status === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => onSetMyMorale({ status: opt.id, visibleToEmployer: !!user.morale?.visibleToEmployer })}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                              active ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                            }`}
                          >
                            <span>{opt.emoji}</span> {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    {user.morale?.status && (
                      <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                        <div>
                          <div className="text-xs font-bold text-stone-700">Partager avec mon employeur</div>
                          <div className="text-[10px] text-stone-500">Si activé, {workerCompany.name} pourra voir votre moral déclaré.</div>
                        </div>
                        <button
                          onClick={() => onSetMyMorale({ status: user.morale.status, visibleToEmployer: !user.morale.visibleToEmployer })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-3 ${user.morale.visibleToEmployer ? "bg-stone-800" : "bg-stone-300"}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${user.morale.visibleToEmployer ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Démission (seulement employé, pas esclave, et pas depuis l'entreprise emprunteuse
                  — un détaché n'y est pas réellement employé, sa relation contractuelle reste
                  avec son entreprise d'origine, voir "Mon Détachement" ci-dessus) */}
              {isEmployee && !viewingLoanedCompany && onQuitCompany && (() => {
                const myQuitContract = (workerCompany.employmentContracts || {})[user.id];
                const isBlocked = myQuitContract && myQuitContract.buyoutAmount > 0;
                return (
                <Card title="Démission" icon={Briefcase}>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div>
                      {isBlocked ? (
                        <p className="text-xs text-amber-700 font-bold flex items-center gap-1.5">
                          <Lock size={13} /> Vous ne pouvez pas partir : un rachat de {formatMoney(myQuitContract.buyoutAmount)} est requis.
                        </p>
                      ) : (
                        <p className="text-xs text-stone-600">
                          Vous pouvez démissionner de votre poste. Cette action est immédiate.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (!isBlocked && window.confirm(`Voulez-vous vraiment quitter ${workerCompany.name} ?`)) {
                          onQuitCompany(workerCompany.id);
                        }
                      }}
                      disabled={isBlocked}
                      className="bg-red-600 text-white px-4 py-2 rounded text-[10px] font-bold uppercase tracking-wide hover:bg-red-500 flex-shrink-0 disabled:opacity-40"
                    >
                      Démissionner
                    </button>
                  </div>
                </Card>
                );
              })() }
            </div>
          );
        })()}

        {/* Si ni propriétaire, ni employé, ni esclave → message vide */}
        {!workerCompany && (
          <div className="h-[30vh] flex flex-col items-center justify-center text-stone-400 p-8 text-center border-2 border-dashed border-stone-300 rounded-xl">
            <Building2 size={64} className="mb-4 text-stone-300" />
            <h3 className="text-xl font-bold text-stone-600 mb-2">
              Aucune Entreprise
            </h3>
            <p className="text-sm max-w-md">
              Vous ne possédez pas de charte commerciale et n'êtes employé
              nulle part. Rapprochez-vous de l'administration pour en fonder
              une, ou attendez une offre d'emploi.
            </p>
          </div>
        )}

        {/* Offres d'emploi (toujours visible) */}
        <Card
          title={`Offres d'Emploi (${myJobOffers.length})`}
          icon={Briefcase}
        >
          {myJobOffers.length === 0 ? (
            <div className="text-center text-stone-400 italic py-4 text-sm">
              Aucune proposition en attente.
            </div>
          ) : (
            <div className="space-y-3">
              {myJobOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white border border-stone-200 p-4 rounded-lg flex justify-between items-center shadow-sm"
                >
                  <div>
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      Proposition d'Embauche
                    </div>
                    <div className="font-bold text-stone-800 text-sm">
                      Rejoindre {offer.companyName}
                    </div>
                    <div className="text-[10px] text-stone-400 italic mt-1">
                      Reçu le {new Date(offer.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRespondJobOffer(offer.id, true)}
                      className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded text-[10px] font-bold hover:bg-green-500 uppercase tracking-wide"
                    >
                      <CheckCircle size={14} /> Accepter
                    </button>
                    <button
                      onClick={() => onRespondJobOffer(offer.id, false)}
                      className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-2 rounded text-[10px] font-bold hover:bg-red-200 uppercase tracking-wide"
                    >
                      <XCircle size={14} /> Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Candidature spontanée (si pas employé et pas propriétaire) */}
        {!workerCompany && onApplyToCompany && (() => {
          const hiringCompanies = (companies || []).filter(
            (c) => c.hiringOpen !== false && c.ownerId !== user.id && !(c.employees || []).includes(user.id) && !(c.applications || []).some((a) => a.citizenId === user.id)
          );
          return hiringCompanies.length > 0 ? (
            <Card title="Entreprises qui recrutent" icon={UserPlus}>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {hiringCompanies.map((c) => {
                  const cOwner = citizens.find((ci) => ci.id === c.ownerId);
                  return (
                    <div key={c.id} className="bg-white border border-stone-200 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color || "#8B5CF6" }} />
                          <span className="font-bold text-sm text-stone-800">{c.name}</span>
                          <span className="text-[9px] text-stone-400">Niv. {c.level || 1}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5 ml-5">
                          Dirigeant : {cOwner?.name || "Inconnu"} · {(c.employees || []).length} employé(s)
                        </div>
                      </div>
                      <button
                        onClick={() => onApplyToCompany(c.id)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:bg-green-500 flex items-center gap-1"
                      >
                        <Send size={12} /> Postuler
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : null;
        })()}

        {/* Profil employé / CV (toujours accessible) */}
        {!workerCompany && onUpdateEmployeeProfile && (
          <Card title="Mon Profil Employé" icon={FileText}>
            <div className="space-y-3">
              <div className="text-xs text-stone-500 italic bg-stone-50 p-2 rounded">
                Votre profil est visible par les dirigeants d'entreprise.
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Compétences</label>
                <input
                  className="w-full p-2 border rounded text-sm"
                  value={profileSkills}
                  onChange={(e) => setProfileSkills(e.target.value)}
                  placeholder="Ex: Forgeron, Comptable, Maçon..."
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Expérience</label>
                <textarea
                  className="w-full p-2 border rounded text-sm resize-none"
                  rows={2}
                  value={profileExp}
                  onChange={(e) => setProfileExp(e.target.value)}
                  placeholder="Décrivez votre parcours..."
                  maxLength={200}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setProfileSeeking(!profileSeeking)}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase border ${
                    profileSeeking ? "bg-green-100 text-green-700 border-green-300" : "bg-stone-100 text-stone-500 border-stone-200"
                  }`}
                >
                  {profileSeeking ? "En recherche d'emploi" : "Pas en recherche"}
                </button>
              </div>
              <button
                onClick={() => onUpdateEmployeeProfile({ skills: profileSkills, experience: profileExp, seeking: profileSeeking })}
                className="bg-stone-800 text-white px-4 py-2 rounded font-bold uppercase text-xs hover:bg-stone-700 flex items-center gap-1"
              >
                <Check size={12} /> Enregistrer
              </button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // --- CAS 2 : PROPRIÉTAIRE D'ENTREPRISE ---
  const rates = TYPE_RATES[myCompany.type] || { emp: 10, slave: 8, label: myCompany.type };
  // Personnel détaché reçu d'une autre entreprise (voir onglet "Détachement") — doit apparaître
  // dans l'effectif principal comme un travailleur à part entière, pas seulement dans un onglet séparé.
  const borrowedInLoans = (staffLoans || []).filter(
    (l) => l.status === "ACTIVE" && String(l.toCompanyId) === String(myCompany.id)
  );
  const empCount = (myCompany.employees || []).length;
  const slaveCount = (myCompany.slaves || []).length;
  // L'estimation affichée doit refléter le même calcul que le versement réel de production
  // (onPassDay, useGameActions.js) : un détachement exclusif transfère 100% de la contribution du
  // salarié à l'emprunteuse, un détachement non-exclusif la partage moitié-moitié entre les deux.
  const lentOutWeight = (staffLoans || [])
    .filter((l) => l.status === "ACTIVE" && String(l.fromCompanyId) === String(myCompany.id) && !l.isOwnerLoan)
    .reduce((sum, l) => sum + (l.exclusive ? 1 : 0.5), 0);
  const borrowedInWeight = borrowedInLoans.reduce((sum, l) => sum + (l.exclusive ? 1 : 0.5), 0);
  const effectiveEmpCount = Math.max(0, empCount - lentOutWeight) + borrowedInWeight;
  const level = myCompany.level || 1;
  const taxRate = (myCompany.taxRate ?? 10) / 100;
  const dailyRevenue = (effectiveEmpCount * rates.emp + slaveCount * rates.slave) * level;
  const dailyTax = Math.floor(dailyRevenue * taxRate);
  const dailyNet = dailyRevenue - dailyTax;

  const totalSalary = Object.values(salaryMap).reduce(
    (sum, v) => sum + (parseInt(v) || 0),
    0
  );

  // Sélecteur d'entreprise, affiché uniquement si la personne est liée à plusieurs (dirigeant de
  // l'une, PDG d'une autre par exemple) — permet de basculer sans perdre l'accès à aucune des deux.
  const companySwitcher = myCompanies.length > 1 && (
    <div className="flex gap-2 flex-wrap">
      {myCompanies.map((c) => {
        const role = c.ownerId === user.id ? "Dirigeant" : "PDG";
        const active = c.id === myCompany.id;
        return (
          <button
            key={c.id}
            onClick={() => setSelectedCompanyId(c.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border transition-colors ${
              active ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || "#8B5CF6" }} />
            {c.name}
            <span className={`px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-stone-100"}`}>{role}</span>
          </button>
        );
      })}
    </div>
  );

  // Dès qu'un PDG est en poste, le propriétaire n'a plus la main sur la gestion opérationnelle
  // (voir isCompanyManager, backend) — sa vue se limite à la révocation et à la dissolution,
  // au lieu d'afficher des onglets opérationnels dont les actions seraient de toute façon rejetées.
  if (isDelegatedOwner) {
    return (
      <div className="space-y-6 animate-fadeIn pb-10">
        {companySwitcher}
        <div
          className="bg-white border-l-8 p-6 rounded-r-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          style={{ borderColor: myCompany.color || "#8B5CF6" }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-stone-400 tracking-widest mb-1">
              Société Privée
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[9px] font-black border border-yellow-300">
                👔 Propriétaire
              </span>
            </div>
            <h1 className="text-3xl font-black font-serif text-stone-900">{myCompany.name}</h1>
          </div>
          <div className="text-right bg-stone-50 p-4 rounded-xl border border-stone-200 min-w-[200px]">
            <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Trésorerie</div>
            <div className="text-4xl font-mono font-black text-stone-800">{formatMoney(myCompany.balance || 0)}</div>
          </div>
        </div>

        <Card title="Gestion déléguée" icon={Crown}>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              Vous avez délégué l'intégralité de la gestion opérationnelle de {myCompany.name} à{" "}
              <span className="font-black">{citizens.find((c) => c.id === myCompany.ceoId)?.name || myCompany.ceoId}</span>,
              votre PDG. Vous restez seul propriétaire légal : révocation du PDG et dissolution vous restent réservées, mais
              le recrutement, les salaires, les contrats, l'inventaire et les biens de l'entreprise sont désormais gérés par
              le PDG.
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onRevokeCEO && onRevokeCEO(myCompany.id)}
                className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-wide border border-red-200 px-3 py-2 rounded hover:bg-red-50"
              >
                Révoquer le PDG et reprendre la gestion
              </button>
              {onSetSelfRights && (
                <button
                  onClick={() => setManagingSelf(true)}
                  className="text-stone-600 hover:text-stone-800 text-[10px] font-black uppercase tracking-wide border border-stone-300 px-3 py-2 rounded hover:bg-stone-50"
                >
                  Gérer mes droits
                </button>
              )}
            </div>
          </div>
        </Card>

        {onDeleteCompany && (
          <Card title="Zone Dangereuse" icon={Trash2}>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-xs text-red-600 mb-3">
                La dissolution est irréversible. Le solde restant sera restitué à votre compte personnel.
                Tous les employés seront licenciés.
              </p>
              <SecureDeleteButton
                onClick={() => onDeleteCompany(myCompany.id)}
                label="Dissoudre mon entreprise"
              />
            </div>
          </Card>
        )}

        {managingSelf && (
          <EmployeeManagementModal
            emp={user}
            empId={user.id}
            myCompany={myCompany}
            selfMode
            selfRights={user.selfLockedRights}
            onSetSelfRights={onSetSelfRights}
            onClose={() => setManagingSelf(false)}
            formatMoney={formatMoney}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {companySwitcher}
      {/* HEADER */}
      <div
        className="bg-white border-l-8 p-6 rounded-r-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style={{ borderColor: myCompany.color || "#8B5CF6" }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-stone-400 tracking-widest mb-1">
            Société Privée
            <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[9px] font-black border border-yellow-300">
              👔 Dirigeant
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: myCompany.color || "#8B5CF6" }}
            />
            <h1 className="text-3xl font-black font-serif text-stone-900">
              {myCompany.name}
            </h1>
          </div>
          <div className="flex gap-3 mt-2 flex-wrap">
            <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
              {rates.label}
            </span>
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
              Niveau {level}
            </span>
            <span className="bg-stone-100 text-stone-500 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
              Taxe: {myCompany.taxRate ?? 10}%
            </span>
            {myCompany.frozen && (
              <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-[10px] font-bold uppercase">
                Gelée
              </span>
            )}
            <span
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                myCompany.hiringOpen !== false
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-500"
              }`}
            >
              {myCompany.hiringOpen !== false
                ? "Recrutement ouvert"
                : "Recrutement fermé"}
            </span>
          </div>
          {myCompany.motto && (
            <div className="text-xs italic text-stone-400 mt-2">
              "{myCompany.motto}"
            </div>
          )}
          {myCompany.description && (
            <div className="text-xs text-stone-500 mt-1">
              {myCompany.description}
            </div>
          )}
        </div>
        <div className="text-right bg-stone-50 p-4 rounded-xl border border-stone-200 min-w-[200px]">
          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">
            Trésorerie
          </div>
          <div className="text-4xl font-mono font-black text-stone-800">
            {formatMoney(myCompany.balance || 0)}
          </div>
        </div>
      </div>

      {/* Détachement en cours en tant que dirigeant (si applicable) */}
      {(() => {
        const myLoanAsOwner = getActiveStaffLoan(user.id, staffLoans);
        if (!myLoanAsOwner) return null;
        const isSameCompany = String(myLoanAsOwner.toCompanyId) === String(myCompany.id);
        return (
          <div className="bg-purple-50 border-l-8 border-purple-400 p-4 rounded-r-xl flex items-center gap-3">
            <ArrowLeftRight size={20} className="text-purple-600 shrink-0" />
            <div className="text-sm text-purple-800">
              {isSameCompany ? (
                <>
                  <span className="font-black">Vous êtes actuellement détaché ici</span>{" "}
                  depuis <span className="font-bold">{(myLoanAsOwner.fromCompanyName || "").trim()}</span>
                  {myLoanAsOwner.exclusive ? " (exclusif)" : ""} en tant que dirigeant.
                </>
              ) : (
                <>
                  <span className="font-black">Vous êtes actuellement détaché</span> chez{" "}
                  <span className="font-bold">{(myLoanAsOwner.toCompanyName || "").trim()}</span>
                  {myLoanAsOwner.exclusive ? " (exclusif)" : ""} en tant que dirigeant, en plus de la gestion de {(myCompany.name || "").trim()}.
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ONGLETS */}
      <div className="flex gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        {[
          { id: "hr", label: "Personnel", badge: (myCompany.applications || []).length || null },
          { id: "finance", label: "Banque & Salaires" },
          { id: "contracts", label: "Contrats" },
          { id: "loans", label: "Détachement", badge: (staffLoans || []).filter((l) => l.status === "ACTIVE" && (l.fromCompanyId === myCompany.id || l.toCompanyId === myCompany.id)).length || null },
          { id: "management", label: "Gestion" },
          { id: "bourse", label: "Bourse" },
          { id: "customize", label: "Personnalisation" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-stone-800 text-white"
                : "text-stone-500 hover:bg-stone-100"
            }`}
          >
            {tab.label}
            {tab.badge ? <span className="ml-1 bg-red-500 text-white rounded-full text-[9px] font-black px-1.5 py-0.5">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* ONGLET PERSONNEL */}
      {activeTab === "hr" && (
        <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Recrutement" icon={Users}>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase text-stone-400 mb-1 block">
                      Proposer un contrat
                    </label>
                    <UserSearchSelect
                      users={citizens}
                      onSelect={setHireTarget}
                      placeholder="Rechercher un citoyen..."
                      excludeIds={[user.id, ...(myCompany.employees || [])]}
                    />
                  </div>
                  <button
                    onClick={() => setShowContractForm((v) => !v)}
                    className={`text-[10px] font-black uppercase px-3 py-2.5 rounded border mb-[1px] ${showContractForm ? "bg-stone-700 text-white border-stone-700" : "bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400"}`}
                  >
                    <ScrollText size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (hireTarget) {
                        onSendJobOffer(myCompany.id, hireTarget, normalizeContractTerms(hireContractTerms));
                        setHireTarget("");
                      }
                    }}
                    disabled={!hireTarget}
                    className="bg-stone-800 text-white px-4 py-2.5 rounded font-bold uppercase text-xs hover:bg-stone-700 disabled:opacity-50 flex items-center gap-2 mb-[1px]"
                  >
                    <Send size={14} /> Envoyer
                  </button>
                </div>
                {showContractForm && (
                  <ContractTermsForm terms={hireContractTerms} onChange={setHireContractTerms} />
                )}
              </div>

              <div className="border-t border-stone-100 pt-2">
                <div className="text-[10px] font-black uppercase text-stone-400 mb-2">
                  Effectifs ({empCount + 1 + borrowedInLoans.length})
                </div>
                <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto">
                  {/* Dirigeant — cliquable pour gérer ses propres droits uniquement si c'est vous
                      (un PDG consultant les Effectifs ne peut pas gérer les droits du propriétaire) */}
                  <div className="py-3 flex justify-between items-center">
                    <div
                      className={`flex items-center gap-2 ${isTrueOwner ? "cursor-pointer hover:opacity-75" : ""}`}
                      onClick={() => isTrueOwner && setManagingSelf(true)}
                    >
                      <span className="font-bold text-stone-700 text-sm">
                        {citizens.find((c) => c.id === myCompany.ownerId)?.name || (isTrueOwner ? user.name : myCompany.ownerId)}
                      </span>
                      <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-yellow-200">
                        Dirigeant
                      </span>
                    </div>
                    {isTrueOwner && (
                      <button onClick={() => setManagingSelf(true)}
                        className="text-stone-500 border border-stone-300 hover:border-stone-500 hover:text-stone-700 text-[9px] font-black uppercase px-2 py-1 rounded">
                        Gérer
                      </button>
                    )}
                  </div>
                  {/* PDG — toujours affiché à part avec son propre tag, qu'il vienne des salariés ou d'un détachement */}
                  {myCompany.ceoId && (
                    <div className="py-3 flex justify-between items-center">
                      <div
                        className={`flex items-center gap-2 ${isCeoView ? "cursor-pointer hover:opacity-75" : ""}`}
                        onClick={() => isCeoView && setManagingSelf(true)}
                      >
                        <span className="font-bold text-stone-700 text-sm">
                          {citizens.find((c) => c.id === myCompany.ceoId)?.name || myCompany.ceoId}
                        </span>
                        <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-purple-300 flex items-center gap-0.5">
                          <Crown size={9} /> PDG
                        </span>
                        {borrowedInLoans.some((l) => String(l.employeeId) === String(myCompany.ceoId)) && (
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-blue-200">Détaché</span>
                        )}
                      </div>
                      {isCeoView && (
                        <button onClick={() => setManagingSelf(true)}
                          className="text-stone-500 border border-stone-300 hover:border-stone-500 hover:text-stone-700 text-[9px] font-black uppercase px-2 py-1 rounded">
                          Gérer
                        </button>
                      )}
                    </div>
                  )}
                  {(myCompany.employees || []).filter((empId) => String(empId) !== String(myCompany.ceoId)).map((empId) => {
                    const emp = citizens.find((c) => c.id === empId);
                    const empRank = (myCompany.employeeRanks || {})[empId];
                    const empDays = (myCompany.employeeSeniority || {})[empId] || 0;
                    const empContract = (myCompany.employmentContracts || {})[empId];
                    const ctMeta = empContract ? CONTRACT_TYPE_META[empContract.type] : null;
                    const sr = empContract?.serfRights || {};
                    return (
                      <div key={empId} className="py-2 border-b border-stone-100 last:border-0">
                        <div className="flex justify-between items-center">
                          <div
                            className="flex items-center gap-2 flex-wrap cursor-pointer hover:opacity-75"
                            onClick={() => setManagingEmployee(empId)}
                          >
                            <span className="font-bold text-stone-700 text-sm">{emp ? emp.name : "Inconnu"}</span>
                            {empRank?.title && (
                              <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-purple-200">{empRank.title}</span>
                            )}
                            {ctMeta && (
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${ctMeta.badge}`}>{ctMeta.shortLabel}</span>
                            )}
                            {empContract?.contractDurationDays ? (
                              <span className="text-[9px] text-stone-400 font-mono">J{empDays}/{empContract.contractDurationDays}</span>
                            ) : empDays > 0 ? (
                              <span className="text-[9px] text-stone-400 font-mono">{empDays}j</span>
                            ) : null}
                            {empContract?.buyoutAmount > 0 && (
                              <span className="text-[8px] text-amber-600 font-black flex items-center gap-0.5"><Lock size={9} />{formatMoney(empContract.buyoutAmount)}</span>
                            )}
                            {emp?.morale?.visibleToEmployer && emp.morale.status && (() => {
                              const moraleOpt = MORALE_OPTIONS.find((o) => o.id === emp.morale.status);
                              return moraleOpt ? (
                                <span
                                  className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded text-[8px] font-bold border border-stone-200"
                                  title="Moral partagé volontairement par l'employé"
                                >
                                  {moraleOpt.emoji} {moraleOpt.label}
                                </span>
                              ) : null;
                            })()}
                            {Object.values(sr).some(Boolean) && (
                              <span className="text-[8px] text-red-500 font-black flex items-center gap-0.5"><Shield size={9} />Droits restreints</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setManagingEmployee(empId)}
                              className="text-stone-500 border border-stone-300 hover:border-stone-500 hover:text-stone-700 text-[9px] font-black uppercase px-2 py-1 rounded">
                              Gérer
                            </button>
                            <button onClick={() => onCompanyFire(myCompany.id, empId, "FIRE")}
                              className="text-red-400 hover:text-red-600 text-[10px] font-black uppercase tracking-wide border border-red-200 px-2 py-1 rounded hover:bg-red-50">
                              Licencier
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {borrowedInLoans.filter((loan) => String(loan.employeeId) !== String(myCompany.ceoId)).map((loan) => {
                    const loanRank = (myCompany.employeeRanks || {})[loan.employeeId];
                    return (
                      <div key={loan.id} className="py-2 border-b border-stone-100 last:border-0">
                        <div className="flex justify-between items-center">
                          <div
                            className="flex items-center gap-2 flex-wrap cursor-pointer hover:opacity-75"
                            onClick={() => setManagingLoanId(loan.id)}
                          >
                            <span className="font-bold text-stone-700 text-sm">{loan.employeeName}</span>
                            {loanRank?.title && (
                              <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-purple-200">{loanRank.title}</span>
                            )}
                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-blue-200 flex items-center gap-0.5">
                              <ArrowLeftRight size={9} /> Détaché — {loan.fromCompanyName}
                            </span>
                            {(myCompany.workerBalances || {})[loan.employeeId] > 0 && (
                              <span className="text-[9px] text-stone-400 font-mono">Compte: {formatMoney((myCompany.workerBalances || {})[loan.employeeId])}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setManagingLoanId(loan.id)}
                              className="text-stone-500 border border-stone-300 hover:border-stone-500 hover:text-stone-700 text-[9px] font-black uppercase px-2 py-1 rounded">
                              Gérer
                            </button>
                            <button onClick={() => onEndStaffLoan && onEndStaffLoan(loan.id, "ENDED")}
                              className="text-red-400 hover:text-red-600 text-[10px] font-black uppercase tracking-wide border border-red-200 px-2 py-1 rounded hover:bg-red-50">
                              Mettre fin
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Esclaves" icon={AlertCircle}>
            <div className="space-y-4">
              <div className="text-xs text-stone-500 italic bg-stone-50 p-3 rounded">
                Vos esclaves personnels peuvent être affectés à l'entreprise
                pour augmenter la production sans coût salarial.
              </div>
              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                {mySlaves.length === 0 && (
                  <div className="text-center text-stone-400 italic text-xs py-2">
                    Vous ne possédez aucun esclave.
                  </div>
                )}
                {mySlaves.map((slave) => {
                  const isAssigned = (myCompany.slaves || []).includes(
                    slave.id
                  );
                  return (
                    <div
                      key={slave.id}
                      className="flex justify-between items-center bg-white border border-stone-200 p-3 rounded-lg"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-stone-800">
                          {slave.name}
                        </span>
                        <span className="text-[9px] text-stone-400 uppercase tracking-widest">
                          Matricule {slave.id}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          onCompanyFire(
                            myCompany.id,
                            slave.id,
                            isAssigned ? "REMOVE_SLAVE" : "ASSIGN_SLAVE"
                          )
                        }
                        className={`text-[9px] font-black uppercase px-3 py-1.5 rounded transition-colors ${
                          isAssigned
                            ? "bg-red-100 text-red-600 hover:bg-red-200"
                            : "bg-green-100 text-green-600 hover:bg-green-200"
                        }`}
                      >
                        {isAssigned ? "Retirer" : "Affecter"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

          {/* Biens de l'entreprise — affectation du personnel */}
          {(() => {
            const myProperties = properties.filter(
              (p) => p.ownerType === "COMPANY" && String(p.ownerId) === String(myCompany.id)
            );
            if (myProperties.length === 0) return null;
            const isManager = isTrueOwner || isCeoView;
            const allWorkerIds = [...(myCompany.employees || []), ...(myCompany.slaves || []), ...borrowedInLoans.map((l) => l.employeeId)];
            const loanedIds = new Set(borrowedInLoans.map((l) => String(l.employeeId)));
            const assignments = myCompany.employeeAssignments || {};
            return (
              <Card title="Biens de l'entreprise" icon={Building2}>
                <div className="text-xs text-stone-500 italic bg-stone-50 p-3 rounded mb-3">
                  Affectez du personnel (salarié, esclave ou détaché reçu d'une autre entreprise) à un bien
                  pour augmenter son revenu quotidien : chaque membre affecté ajoute +8% (jusqu'à 4 affectés,
                  soit +32% maximum).
                </div>
                <div className="space-y-3">
                  {myProperties.map((prop) => {
                    const assignedIds = allWorkerIds.filter((id) => String(assignments[id]) === String(prop.id));
                    const bonusStaff = Math.min(assignedIds.length, 4);
                    const effectiveIncome = Math.round((prop.income || 0) * (1 + bonusStaff * 0.08) * 10) / 10;
                    const availableIds = allWorkerIds.filter((id) => String(assignments[id]) !== String(prop.id));
                    return (
                      <div key={prop.id} className="bg-white border border-stone-200 rounded-lg p-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="font-bold text-sm text-stone-800">{prop.name}</div>
                            <div className="text-[9px] text-stone-400 uppercase tracking-widest">{prop.type}</div>
                          </div>
                          {(prop.income || 0) > 0 && (
                            <div className="text-right shrink-0">
                              <div className="text-sm font-black font-mono text-green-600">+{formatMoney(effectiveIncome)}/j</div>
                              {bonusStaff > 0 && (
                                <div className="text-[9px] text-green-500">base {formatMoney(prop.income)} +{bonusStaff * 8}%</div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {assignedIds.length === 0 && (
                            <span className="text-[10px] text-stone-400 italic">Aucun personnel affecté.</span>
                          )}
                          {assignedIds.map((id) => {
                            const worker = citizens.find((c) => c.id === id);
                            return (
                              <span key={id} className="flex items-center gap-1 bg-stone-100 border border-stone-200 rounded-full pl-2 pr-1 py-0.5 text-[10px] font-bold text-stone-600">
                                {worker?.name || id}
                                {loanedIds.has(String(id)) && (
                                  <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded-full text-[8px] font-black uppercase border border-blue-200">Détaché</span>
                                )}
                                {isManager && onAssignEmployeeToProperty && (
                                  <button
                                    onClick={() => onAssignEmployeeToProperty({ companyId: myCompany.id, employeeId: id, propertyId: null })}
                                    className="text-stone-400 hover:text-red-500"
                                    title="Retirer l'affectation"
                                  >
                                    <X size={10} />
                                  </button>
                                )}
                              </span>
                            );
                          })}
                        </div>
                        {isManager && onAssignEmployeeToProperty && availableIds.length > 0 && (
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (!e.target.value) return;
                              onAssignEmployeeToProperty({ companyId: myCompany.id, employeeId: e.target.value, propertyId: prop.id });
                              e.target.value = "";
                            }}
                            className="mt-2 w-full text-[10px] border border-stone-200 rounded px-2 py-1.5 text-stone-600 bg-stone-50"
                          >
                            <option value="">+ Affecter un membre du personnel...</option>
                            {availableIds.map((id) => {
                              const worker = citizens.find((c) => c.id === id);
                              const elsewhere = assignments[id] && String(assignments[id]) !== String(prop.id)
                                ? properties.find((p) => p.id === assignments[id])
                                : null;
                              return (
                                <option key={id} value={id}>
                                  {worker?.name || id}{loanedIds.has(String(id)) ? " (détaché)" : ""}{elsewhere ? ` (actuellement à ${elsewhere.name})` : ""}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })()}

          {/* Candidatures reçues */}
          <Card title={`Candidatures (${(myCompany.applications || []).length})`} icon={UserPlus}>
            {(myCompany.applications || []).length === 0 ? (
              <div className="text-center text-stone-400 italic py-4 text-xs">
                Aucune candidature en attente.
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto">
                {(myCompany.applications || []).map((app) => {
                  const applicant = citizens.find((c) => c.id === app.citizenId);
                  const profile = applicant?.employeeProfile;
                  const isExpanded = expandedAppId === app.id;
                  return (
                    <div key={app.id} className="bg-white border border-stone-200 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-sm text-stone-800">{app.citizenName}</div>
                          <div className="text-[10px] text-stone-400">Reçu le {new Date(app.date).toLocaleDateString()}</div>
                          {profile?.skills && (<div className="text-[10px] text-stone-500 mt-1"><span className="font-bold">Compétences :</span> {profile.skills}</div>)}
                          {profile?.experience && (<div className="text-[10px] text-stone-500"><span className="font-bold">Expérience :</span> {profile.experience}</div>)}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => { setExpandedAppId(isExpanded ? null : app.id); setAppContractTerms(DEFAULT_CONTRACT); }}
                            className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase border ${isExpanded ? "bg-stone-700 text-white border-stone-700" : "bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400"}`}
                            title="Définir les clauses du contrat"
                          >
                            <ScrollText size={12} />
                          </button>
                          <button
                            onClick={() => { onRespondApplication && onRespondApplication(myCompany.id, app.id, true, normalizeContractTerms(isExpanded ? appContractTerms : DEFAULT_CONTRACT)); setExpandedAppId(null); }}
                            className="bg-green-600 text-white px-2.5 py-1.5 rounded text-[10px] font-bold uppercase hover:bg-green-500"
                          >Embaucher</button>
                          <button
                            onClick={() => onRespondApplication && onRespondApplication(myCompany.id, app.id, false)}
                            className="bg-red-100 text-red-600 px-2.5 py-1.5 rounded text-[10px] font-bold uppercase hover:bg-red-200"
                          >Refuser</button>
                        </div>
                      </div>
                      {isExpanded && (
                        <ContractTermsForm terms={appContractTerms} onChange={setAppContractTerms} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ONGLET FINANCE */}
      {activeTab === "finance" && (
        <div className="space-y-6">
          {/* Dernière production */}
          {myCompany.lastProduction && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-1.5">
                  <TrendingUp size={12} /> Dernière production ({myCompany.lastProduction.date})
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-black font-mono text-stone-700">{myCompany.lastProduction.gross?.toLocaleString()}</div>
                  <div className="text-[9px] uppercase text-stone-400 font-bold">Brut</div>
                </div>
                <div>
                  <div className="text-lg font-black font-mono text-red-500">-{myCompany.lastProduction.tax?.toLocaleString()}</div>
                  <div className="text-[9px] uppercase text-stone-400 font-bold">Taxe</div>
                </div>
                <div>
                  <div className="text-lg font-black font-mono text-green-600">+{myCompany.lastProduction.net?.toLocaleString()}</div>
                  <div className="text-[9px] uppercase text-stone-400 font-bold">Net (→ trésorerie)</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Injection Capital" icon={ArrowDownLeft}>
              <div className="flex gap-2">
                <input
                  type="number" step="0.1"
                  className="flex-1 p-2 border rounded font-mono text-sm"
                  placeholder="Montant..."
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
                <button
                  onClick={() => {
                    onCompanyTreasury(myCompany.id, depositAmount, "DEPOSIT");
                    setDepositAmount("");
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded font-bold uppercase text-xs hover:bg-green-500"
                >
                  Déposer
                </button>
              </div>
            </Card>
            <Card title="Retrait Dividendes" icon={ArrowUpRight}>
              {myBourseListing ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 space-y-1">
                  <p className="font-bold">Entreprise cotée en bourse — retrait personnel désactivé.</p>
                  <p>
                    Depuis l'introduction en bourse, la trésorerie appartient aussi à vos actionnaires.
                    Utilisez le versement de dividendes par action, dans l'onglet Bourse, pour distribuer
                    les bénéfices à tous les détenteurs — vous y compris si vous détenez des actions.
                  </p>
                  <button onClick={() => setActiveTab("bourse")}
                    className="mt-1 text-[10px] font-black uppercase text-amber-800 underline hover:text-amber-900">
                    Aller à l'onglet Bourse
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="number" step="0.1"
                      className="flex-1 p-2 border rounded font-mono text-sm"
                      placeholder="Montant..."
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        onCompanyTreasury(
                          myCompany.id,
                          withdrawAmount,
                          "WITHDRAW"
                        );
                        setWithdrawAmount("");
                      }}
                      className="bg-stone-800 text-white px-4 py-2 rounded font-bold uppercase text-xs hover:bg-stone-700"
                    >
                      Retirer
                    </button>
                  </div>
                  {withdrawAmount && parseFloat(withdrawAmount) > (myCompany.balance || 0) && (
                    <div className="mt-2 text-xs font-bold text-red-500">
                      Fonds insuffisants — la trésorerie ne contient que {formatMoney(myCompany.balance || 0)}.
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>

          <Card title="Production & Rendement" icon={TrendingUp}>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-lg font-black text-green-700 font-mono">
                    {dailyNet.toLocaleString()}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-green-500 tracking-widest">
                    Revenu Net / Jour
                  </div>
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                  <div className="text-lg font-black text-stone-700 font-mono">
                    {dailyTax.toLocaleString()}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-stone-400 tracking-widest">
                    Taxe / Jour ({myCompany.taxRate ?? 10}%)
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-lg font-black text-yellow-700 font-mono">
                    Niv. {level}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-yellow-500 tracking-widest">
                    Niveau
                  </div>
                </div>
              </div>
              <div className="bg-stone-50 rounded-lg p-3 border border-stone-200 text-xs text-stone-600 space-y-1">
                <div className="flex justify-between">
                  <span>
                    Employés ({empCount}{effectiveEmpCount !== empCount ? ` → ${effectiveEmpCount} avec détachements` : ""}) x {formatMoney(rates.emp)} x Niv.{level}
                  </span>
                  <span className="font-mono font-bold">
                    {(effectiveEmpCount * rates.emp * level).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Esclaves ({slaveCount}) x {formatMoney(rates.slave)} x Niv.{level}
                  </span>
                  <span className="font-mono font-bold">
                    {(slaveCount * rates.slave * level).toLocaleString()}
                  </span>
                </div>
              </div>
              {(() => {
                // Le personnel détaché reçu (borrowedInLoans) compte pour le passage de niveau au
                // même titre que les salariés/esclaves propres — cohérent avec onPassDay (useGameActions.js).
                const totalWorkers = empCount + slaveCount + borrowedInLoans.length;
                const requiredWorkers = level * 2;
                const requiredFunds = level * 500;
                const workerPct = Math.min(100, Math.round((totalWorkers / requiredWorkers) * 100));
                const fundsPct = Math.min(100, Math.round(((myCompany.balance || 0) / requiredFunds) * 100));
                const canLevelUp = totalWorkers >= requiredWorkers && (myCompany.balance || 0) >= requiredFunds;
                return (
                  <div className={`rounded-lg p-4 border text-xs ${canLevelUp ? "bg-green-50 border-green-300" : "bg-stone-50 border-stone-200"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] uppercase font-black tracking-widest text-stone-600">
                        Progression niveau {level} → {level + 1}
                      </div>
                      {canLevelUp && (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[9px] font-black uppercase border border-green-300 animate-pulse">
                          Prêt !
                        </span>
                      )}
                    </div>
                    {/* Barre travailleurs */}
                    <div className="mb-3">
                      <div className="flex justify-between mb-1 text-stone-600">
                        <span className="flex items-center gap-1"><Users size={10} /> Travailleurs</span>
                        <span className={`font-bold ${totalWorkers >= requiredWorkers ? "text-green-600" : "text-red-500"}`}>
                          {totalWorkers} / {requiredWorkers}
                        </span>
                      </div>
                      <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${totalWorkers >= requiredWorkers ? "bg-green-500" : "bg-amber-500"}`}
                          style={{ width: `${workerPct}%` }}
                        />
                      </div>
                    </div>
                    {/* Barre fonds */}
                    <div className="mb-3">
                      <div className="flex justify-between mb-1 text-stone-600">
                        <span className="flex items-center gap-1"><Wallet size={10} /> Trésorerie requise</span>
                        <span className={`font-bold ${(myCompany.balance || 0) >= requiredFunds ? "text-green-600" : "text-red-500"}`}>
                          {formatMoney((myCompany.balance || 0))} / {formatMoney(requiredFunds)}
                        </span>
                      </div>
                      <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${(myCompany.balance || 0) >= requiredFunds ? "bg-green-500" : "bg-amber-500"}`}
                          style={{ width: `${fundsPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-[9px] text-stone-400 italic">
                      {canLevelUp
                        ? `La montée de niveau aura lieu au prochain 1er du mois RP. ${formatMoney(requiredFunds)} seront prélevés de la trésorerie.`
                        : "La montée de niveau est vérifiée automatiquement le 1er de chaque mois RP."}
                    </div>
                  </div>
                );
              })()}
            </div>
          </Card>

          {/* SALAIRES INDIVIDUELS */}
          <Card title="Versement des Salaires" icon={Wallet}>
            {empCount === 0 && (myCompany.slaves || []).length === 0 ? (
              <div className="text-center text-stone-400 italic py-4 text-sm">
                Aucun travailleur à payer.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Employés */}
                {empCount > 0 && (
                  <div>
                    <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-2">
                      Employés
                    </div>
                    <div className="divide-y divide-stone-100">
                      {(myCompany.employees || []).map((empId) => {
                        const emp = citizens.find((c) => c.id === empId);
                        const empCompBal = (myCompany.workerBalances || {})[empId] || 0;
                        return (
                          <div
                            key={empId}
                            className="py-3 flex justify-between items-center gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-stone-700 text-sm truncate block">
                                {emp ? emp.name : empId}
                              </span>
                              {empCompBal > 0 && (
                                <span className="text-[9px] font-mono text-yellow-600">
                                  Compte interne : {formatMoney(empCompBal)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="number" step="0.1"
                                className="w-24 p-2 border rounded font-mono text-sm text-right"
                                placeholder="0"
                                value={salaryMap[empId] || ""}
                                onChange={(e) =>
                                  setSalaryMap({
                                    ...salaryMap,
                                    [empId]: e.target.value,
                                  })
                                }
                              />
                              <span className="text-[10px] font-bold text-stone-400">
                                Écus
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Esclaves */}
                {(myCompany.slaves || []).length > 0 && (
                  <div>
                    <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-2 flex items-center gap-2">
                      Esclaves
                      <span className="text-[8px] font-normal normal-case tracking-normal italic opacity-60">
                        (salaire optionnel)
                      </span>
                    </div>
                    <div className="divide-y divide-stone-100">
                      {(myCompany.slaves || []).map((slaveId) => {
                        const slave = citizens.find((c) => c.id === slaveId);
                        return (
                          <div
                            key={slaveId}
                            className="py-3 flex justify-between items-center gap-3"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase flex-shrink-0">
                                Escl.
                              </span>
                              <span className="font-bold text-stone-700 text-sm truncate">
                                {slave ? slave.name : slaveId}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="number" step="0.1"
                                className="w-24 p-2 border rounded font-mono text-sm text-right"
                                placeholder="0"
                                value={salaryMap[slaveId] || ""}
                                onChange={(e) =>
                                  setSalaryMap({
                                    ...salaryMap,
                                    [slaveId]: e.target.value,
                                  })
                                }
                              />
                              <span className="text-[10px] font-bold text-stone-400">
                                Écus
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Détachés reçus d'une autre entreprise — leur contrat/salaire d'origine reste
                    géré par leur employeur, mais l'emprunteuse peut désormais aussi les payer
                    directement sur un compte interne dédié ici. */}
                {borrowedInLoans.length > 0 && (
                  <div>
                    <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-2 flex items-center gap-2">
                      Détachés
                      <span className="text-[8px] font-normal normal-case tracking-normal italic opacity-60">
                        (compte interne dédié, reversé s'il repart)
                      </span>
                    </div>
                    <div className="divide-y divide-stone-100">
                      {borrowedInLoans.map((loan) => {
                        const empCompBal = (myCompany.workerBalances || {})[loan.employeeId] || 0;
                        return (
                          <div
                            key={loan.employeeId}
                            className="py-3 flex justify-between items-center gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase flex-shrink-0">
                                  Détaché
                                </span>
                                <span className="font-bold text-stone-700 text-sm truncate">
                                  {loan.employeeName}
                                </span>
                              </div>
                              {empCompBal > 0 && (
                                <span className="text-[9px] font-mono text-yellow-600">
                                  Compte interne : {formatMoney(empCompBal)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="number" step="0.1"
                                className="w-24 p-2 border rounded font-mono text-sm text-right"
                                placeholder="0"
                                value={salaryMap[loan.employeeId] || ""}
                                onChange={(e) =>
                                  setSalaryMap({
                                    ...salaryMap,
                                    [loan.employeeId]: e.target.value,
                                  })
                                }
                              />
                              <span className="text-[10px] font-bold text-stone-400">
                                Écus
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-stone-200">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      Coût Total
                    </span>
                    <span className="ml-2 text-sm font-mono font-bold text-stone-700">
                      {formatMoney(totalSalary)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (totalSalary > 0) {
                        onPaySalaries(myCompany.id, salaryMap);
                        setSalaryMap({});
                      }
                    }}
                    disabled={totalSalary <= 0}
                    className="bg-yellow-500 text-stone-900 px-6 py-2.5 rounded-lg font-black uppercase text-xs shadow hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Wallet size={14} /> Verser
                  </button>
                </div>
              </div>
            )}
          </Card>

          {globalLedger.filter(e => e.fromId === myCompany.id || e.toId === myCompany.id || e.companyId === myCompany.id || e.fromName === myCompany.name || e.toName === myCompany.name).length > 0 && (
            <Card title="Historique des Transactions" icon={History}>
              <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
                {globalLedger
                  .filter(e => e.fromId === myCompany.id || e.toId === myCompany.id || e.companyId === myCompany.id || e.fromName === myCompany.name || e.toName === myCompany.name)
                  .slice(0, 30)
                  .map(entry => {
                    const isOut = entry.fromId === myCompany.id || entry.fromName === myCompany.name;
                    return (
                      <div key={entry.id} className="py-2.5 flex justify-between items-center">
                        <div>
                          <div className="text-xs font-bold text-stone-700">{entry.reason || entry.type || "Transaction"}</div>
                          <div className="text-[10px] text-stone-400">
                            {isOut ? `→ ${entry.toName || "?"}` : `← ${entry.fromName || "?"}`} · {new Date(entry.timestamp).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                        <span className={`font-mono font-bold text-sm ${isOut ? "text-red-500" : "text-green-600"}`}>
                          {isOut ? "-" : "+"}{formatMoney(entry.amount || 0)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ONGLET CONTRATS */}
      {activeTab === "contracts" && (() => {
        const companyContracts = jobContracts.filter(
          (c) => c.source?.id === myCompany.id
        );

        // Pool des destinataires disponibles : dirigeant + employés + esclaves + personnel détaché
        // reçu + entreprises prêteuses (pour leur reverser une part) + trésorerie.
        const ownerCitizen = citizens.find((x) => x.id === myCompany.ownerId);
        const lendingCompanyIds = [...new Set(borrowedInLoans.map((l) => l.fromCompanyId))];
        const workerPool = [
          { id: myCompany.ownerId, type: "CITIZEN", name: (ownerCitizen ? ownerCitizen.name : myCompany.ownerId) + " (dirigeant)" },
          ...(myCompany.employees || []).filter((id) => String(id) !== String(myCompany.ceoId)).map((id) => {
            const c = citizens.find((x) => x.id === id);
            return { id, type: "CITIZEN", name: (c ? c.name : id) + " (employé)" };
          }),
          ...(myCompany.ceoId ? [{ id: myCompany.ceoId, type: "CITIZEN", name: (citizens.find((x) => x.id === myCompany.ceoId)?.name || myCompany.ceoId) + " (PDG)" }] : []),
          ...(myCompany.slaves || []).map((id) => {
            const c = citizens.find((x) => x.id === id);
            return { id, type: "CITIZEN", name: (c ? c.name : id) + " (esclave)" };
          }),
          ...borrowedInLoans.map((l) => ({ id: l.employeeId, type: "CITIZEN", name: `${l.employeeName} (détaché — ${l.fromCompanyName})` })),
          ...lendingCompanyIds.map((cid) => {
            const c = (companies || []).find((x) => x.id === cid);
            return { id: cid, type: "COMPANY", name: (c ? c.name : cid) + " (entreprise prêteuse)" };
          }),
          { id: myCompany.id, type: "COMPANY", name: myCompany.name + " (trésorerie)" },
        ];

        const form = contractForm;
        const isParTache = form?.frequency === "par_tache";
        const totalPct = (form?.recipients || []).reduce((s, r) => s + (r.percent || 0), 0);
        const isValid =
          form &&
          form.name.trim() &&
          (isParTache || form.amount > 0) &&
          form.recipients.length > 0 &&
          totalPct === 100;

        const openNew = () => {
          setContractForm(emptyContractForm(myCompany.id, myCompany.name));
          setSelectedContractId(null);
        };

        const openEdit = (contract) => {
          setContractForm(JSON.parse(JSON.stringify(contract)));
          setSelectedContractId(contract.id);
        };

        const handleSave = () => {
          if (!isValid || !onSaveJobContract) return;
          onSaveJobContract(form);
          setContractForm(null);
          setSelectedContractId(null);
        };

        const handleDelete = (id) => {
          if (!window.confirm("Supprimer ce contrat ?")) return;
          if (onDeleteJobContract) onDeleteJobContract(id);
          if (selectedContractId === id) { setContractForm(null); setSelectedContractId(null); }
        };

        const addRecipient = (worker) => {
          if (!form) return;
          if (form.recipients.some((r) => r.id === worker.id)) return;
          const existing = form.recipients.reduce((s, r) => s + (r.percent || 0), 0);
          setContractForm((f) => ({
            ...f,
            recipients: [...f.recipients, { ...worker, percent: Math.max(0, 100 - existing) }],
          }));
        };

        const updatePct = (id, val) => {
          const num = Math.min(100, Math.max(0, parseInt(val) || 0));
          setContractForm((f) => ({
            ...f,
            recipients: f.recipients.map((r) => (r.id === id ? { ...r, percent: num } : r)),
          }));
        };

        const removeRecipient = (id) => {
          setContractForm((f) => ({ ...f, recipients: f.recipients.filter((r) => r.id !== id) }));
        };

        return (
          <div className="flex flex-col md:flex-row gap-6 min-h-0">
            {/* Liste des contrats */}
            <div className="w-full md:w-72 shrink-0 bg-[#fdf6e3] rounded-xl border border-stone-300 flex flex-col overflow-hidden shadow-md">
              <div className="p-3 bg-stone-100 border-b flex justify-between items-center font-bold uppercase text-[10px] tracking-widest text-stone-500">
                <span>Contrats ({companyContracts.length})</span>
                <button
                  onClick={openNew}
                  className="bg-stone-800 text-white w-6 h-6 rounded-lg flex items-center justify-center hover:bg-stone-700 shadow-md"
                >
                  <Plus size={13} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {companyContracts.length === 0 && (
                  <div className="text-center text-stone-400 italic text-xs py-8">
                    Aucun contrat.<br />
                    <span className="text-[10px]">Cliquez sur + pour en créer un.</span>
                  </div>
                )}
                {companyContracts.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => openEdit(c)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedContractId === c.id
                        ? "bg-stone-800 text-white border-yellow-600 shadow-xl"
                        : "bg-white/70 border-stone-200 hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-sm truncate">{c.name || "Sans nom"}</div>
                        <div className={`text-[10px] mt-0.5 ${selectedContractId === c.id ? "text-stone-300" : "text-stone-500"}`}>
                          {c.frequency !== "par_tache" && `${formatMoney(c.amount || 0)} · `}
                          {CONTRACT_FREQUENCIES.find((f) => f.value === c.frequency)?.label || c.frequency}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); if (onToggleJobContract) onToggleJobContract(c.id); }}
                          className={`p-1 rounded ${c.active ? "text-green-500" : "text-stone-400"}`}
                        >
                          {c.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                          className="p-1 text-red-400 hover:text-red-600 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(c.recipients || []).map((r) => (
                        <span key={r.id} className={`px-1 py-0.5 rounded text-[8px] font-bold ${selectedContractId === c.id ? "bg-stone-700 text-stone-200" : "bg-stone-100 text-stone-600"}`}>
                          {r.name} {r.percent}%
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulaire */}
            <div className="flex-1 min-h-0">
              {!form ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-300 gap-4 italic min-h-[200px]">
                  <ScrollText size={60} className="opacity-10" />
                  <p className="text-lg tracking-widest opacity-30 uppercase font-serif text-sm">Contrats d'Emploi</p>
                </div>
              ) : (
                <div className="space-y-4 pb-10">
                  {/* Header */}
                  <div className="bg-stone-900 text-stone-100 rounded-xl p-4 flex items-center justify-between shadow-lg">
                    <div>
                      <div className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">
                        {selectedContractId ? "Modifier" : "Nouveau contrat"}
                      </div>
                      <div className="font-black">{form.name || "Sans nom"}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setContractForm(null); setSelectedContractId(null); }}
                        className="px-3 py-1.5 bg-stone-700 text-stone-300 rounded-lg text-[10px] font-bold uppercase hover:bg-stone-600"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={!isValid}
                        className="px-3 py-1.5 bg-yellow-500 text-stone-900 rounded-lg text-[10px] font-black uppercase hover:bg-yellow-400 disabled:opacity-40 flex items-center gap-1"
                      >
                        <Check size={13} /> Sauvegarder
                      </button>
                    </div>
                  </div>

                  {/* Identité */}
                  <Card title="Identité du Contrat" icon={ScrollText}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Nom</label>
                        <input
                          className="w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none focus:border-stone-800 font-bold"
                          value={form.name}
                          onChange={(e) => setContractForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Ex : Salaire mensuel, Prime de production…"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">
                          {isParTache ? "Montant / session (info)" : "Montant total (Écus)"}
                        </label>
                        <input
                          type="number" step="0.1" min={0}
                          className="w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none focus:border-stone-800 font-bold font-mono"
                          value={form.amount || ""}
                          onChange={(e) => setContractForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Fréquence</label>
                        <select
                          className="w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none font-bold"
                          value={form.frequency}
                          onChange={(e) => setContractForm((f) => ({ ...f, frequency: e.target.value }))}
                        >
                          {CONTRACT_FREQUENCIES.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2 flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <button
                          onClick={() => setContractForm((f) => ({ ...f, active: !f.active }))}
                          className={`text-2xl transition-colors ${form.active ? "text-green-500" : "text-stone-300"}`}
                        >
                          {form.active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                        </button>
                        <span className="text-sm font-bold text-stone-700">
                          {form.active ? "Actif — sera exécuté au prochain passage de jour" : "Inactif"}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Source */}
                  <div className="flex items-center gap-2 p-3 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-600 font-bold">
                    <Building2 size={14} /> Source : Trésorerie de <span className="text-stone-800 ml-1">{myCompany.name}</span>
                  </div>

                  {/* Bénéficiaires */}
                  <Card title="Répartition entre Bénéficiaires" icon={Users}>
                    <div className="space-y-4">
                      {/* Indicateur total % */}
                      <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
                        totalPct === 100 ? "bg-green-50 border-green-200" : totalPct > 100 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                      }`}>
                        <div className="flex items-center gap-2">
                          <RefreshCw size={13} className={totalPct === 100 ? "text-green-600" : "text-amber-500"} />
                          <span className="text-xs font-black uppercase text-stone-600">Total</span>
                        </div>
                        <span className={`font-black font-mono ${totalPct === 100 ? "text-green-700" : totalPct > 100 ? "text-red-700" : "text-amber-700"}`}>
                          {totalPct}%
                          {totalPct !== 100 && (
                            <span className="text-[10px] font-bold ml-1">
                              {totalPct < 100 ? `(manque ${100 - totalPct}%)` : `(excède de ${totalPct - 100}%)`}
                            </span>
                          )}
                        </span>
                      </div>

                      {totalPct !== 100 && form.recipients.length > 0 && (
                        <div className="flex items-center gap-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                          <AlertTriangle size={11} /> Le total doit être 100% pour sauvegarder.
                        </div>
                      )}

                      {/* Liste des bénéficiaires */}
                      {form.recipients.length === 0 ? (
                        <p className="text-xs text-stone-400 italic text-center py-3">Aucun bénéficiaire ajouté.</p>
                      ) : (
                        <div className="space-y-2">
                          {form.recipients.map((r) => {
                            const share = Math.floor((form.amount || 0) * r.percent / 100);
                            return (
                              <div key={r.id} className="flex items-center gap-3 p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-sm text-stone-800 truncate">{r.name}</div>
                                  {!isParTache && (
                                    <div className="text-[10px] text-stone-400 font-mono">
                                      = {formatMoney(share)} / versement
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number" min={0} max={100}
                                    className="w-14 p-1.5 border-2 border-stone-200 rounded-lg text-center font-black outline-none focus:border-stone-600 font-mono text-sm"
                                    value={r.percent}
                                    onChange={(e) => updatePct(r.id, e.target.value)}
                                  />
                                  <span className="text-xs font-bold text-stone-500">%</span>
                                  <button onClick={() => removeRecipient(r.id)} className="p-1 text-red-400 hover:text-red-600">
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Ajouter un bénéficiaire */}
                      <div className="border-t border-stone-200 pt-3">
                        <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-2">
                          Ajouter un bénéficiaire
                        </label>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {workerPool
                            .filter((w) => !form.recipients.some((r) => r.id === w.id))
                            .map((w) => (
                              <button
                                key={w.id}
                                onClick={() => addRecipient(w)}
                                className="w-full text-left p-2.5 rounded-lg hover:bg-stone-100 flex items-center gap-2 transition-colors border border-stone-100"
                              >
                                {w.type === "COMPANY" ? <Building2 size={12} className="text-stone-400 shrink-0" /> : <Users size={12} className="text-stone-400 shrink-0" />}
                                <span className="font-bold text-sm text-stone-800 truncate">{w.name}</span>
                                <Plus size={12} className="text-stone-400 ml-auto shrink-0" />
                              </button>
                            ))}
                          {workerPool.filter((w) => !form.recipients.some((r) => r.id === w.id)).length === 0 && (
                            <p className="text-xs text-stone-400 italic text-center py-2">Tous les travailleurs sont déjà ajoutés.</p>
                          )}
                        </div>
                      </div>

                      {/* Simulation */}
                      {!isParTache && form.amount > 0 && form.recipients.length > 0 && totalPct === 100 && (
                        <div className="bg-stone-900 rounded-xl p-3 text-stone-200">
                          <div className="text-[9px] uppercase tracking-widest text-stone-400 mb-2 font-black">
                            Simulation — par versement
                          </div>
                          <div className="space-y-1">
                            {form.recipients.map((r) => (
                              <div key={r.id} className="flex justify-between text-sm">
                                <span className="text-stone-300 truncate">{r.name}</span>
                                <span className="font-black font-mono text-yellow-400 shrink-0 ml-2">
                                  +{formatMoney(Math.floor(form.amount * r.percent / 100))}
                                </span>
                              </div>
                            ))}
                            <div className="border-t border-stone-700 pt-1.5 mt-1.5 flex justify-between text-xs font-black">
                              <span className="text-stone-400 uppercase tracking-widest">Total prélevé</span>
                              <span className="text-white font-mono">{formatMoney(form.amount)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ONGLET DÉTACHEMENT DE PERSONNEL */}
      {activeTab === "loans" && (() => {
        const allWorkers = [...(myCompany.employees || []), ...(myCompany.slaves || []), myCompany.ownerId, ...(myCompany.ceoId ? [myCompany.ceoId] : [])];
        const loanedOutIds = new Set(staffLoans.filter((l) => l.status === "ACTIVE").map((l) => String(l.employeeId)));
        const availableWorkers = allWorkers.filter((id) => !loanedOutIds.has(String(id)));
        const lentOut = staffLoans.filter((l) => l.status === "ACTIVE" && l.fromCompanyId === myCompany.id);
        const borrowedIn = staffLoans.filter((l) => l.status === "ACTIVE" && l.toCompanyId === myCompany.id);
        const history = staffLoans
          .filter((l) => l.status !== "ACTIVE" && (l.fromCompanyId === myCompany.id || l.toCompanyId === myCompany.id))
          .sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0))
          .slice(0, 8);
        const otherCompanies = (companies || []).filter((c) => c.id !== myCompany.id);

        return (
          <div className="space-y-6">
            <Card title="Détacher un salarié" icon={ArrowLeftRight}>
              <div className="space-y-4">
                <div className="text-xs text-stone-500 italic bg-stone-50 p-3 rounded border border-stone-200">
                  Prêtez temporairement un salarié — ou vous-même en tant que dirigeant — à une autre entreprise. La
                  personne détachée reste rattachée chez vous (salaire, ancienneté, contrat inchangés, ou statut de
                  dirigeant conservé) mais travaille pour l'emprunteuse, qui vous verse un tarif journalier et, si vous
                  le souhaitez, une prime immédiate. En détachement exclusif, elle ne compte plus dans votre production
                  le temps du prêt ; sinon, la production est partagée moitié-moitié entre les deux entreprises.
                </div>
                {availableWorkers.length === 0 ? (
                  <div className="text-center text-stone-400 italic py-3 text-xs">
                    Aucun salarié disponible (déjà détaché ou aucun effectif).
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Salarié</label>
                      <select
                        className="w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none font-bold text-sm"
                        value={loanForm.employeeId}
                        onChange={(e) => setLoanForm((f) => ({ ...f, employeeId: e.target.value }))}
                      >
                        <option value="">— Choisir —</option>
                        {availableWorkers.map((id) => {
                          const c = citizens.find((ci) => ci.id === id);
                          const isOwnerOpt = String(id) === String(myCompany.ownerId);
                          const isCeoOpt = !isOwnerOpt && String(id) === String(myCompany.ceoId);
                          const suffix = isOwnerOpt ? " (Dirigeant)" : isCeoOpt ? " (PDG)" : "";
                          return <option key={id} value={id}>{c?.name || id}{suffix}</option>;
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Entreprise emprunteuse</label>
                      <select
                        className="w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none font-bold text-sm"
                        value={loanForm.toCompanyId}
                        onChange={(e) => setLoanForm((f) => ({ ...f, toCompanyId: e.target.value }))}
                      >
                        <option value="">— Choisir —</option>
                        {otherCompanies.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Prime immédiate (optionnel)</label>
                      <input
                        type="number" step="0.1" min={0}
                        className="w-full p-2 border rounded font-mono text-sm"
                        value={loanForm.signingBonus}
                        onChange={(e) => setLoanForm((f) => ({ ...f, signingBonus: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Durée</label>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none font-bold text-sm"
                          value={loanForm.durationType}
                          onChange={(e) => setLoanForm((f) => ({ ...f, durationType: e.target.value }))}
                        >
                          <option value="FIXED">Durée fixe</option>
                          <option value="INDEFINITE">Indéterminée (rappelable)</option>
                        </select>
                        {loanForm.durationType === "FIXED" && (
                          <input
                            type="number" min={1}
                            className="w-24 p-2 border rounded font-mono text-sm"
                            value={loanForm.durationDays}
                            onChange={(e) => setLoanForm((f) => ({ ...f, durationDays: e.target.value }))}
                            placeholder="jours"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => setLoanForm((f) => ({ ...f, exclusive: !f.exclusive }))}
                        className={`w-full px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-colors flex items-center justify-center gap-2 ${
                          loanForm.exclusive
                            ? "bg-purple-100 text-purple-700 border-purple-300"
                            : "bg-white text-stone-400 border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <Lock size={12} /> {loanForm.exclusive ? "Exclusif" : "Non exclusif"}
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-stone-400 italic">
                  Sans tarif fixe : l'entreprise emprunteuse pourra verser un salaire au détaché via "Payer les salaires",
                  sur un compte interne dédié, reversé sur sa banque personnelle à la fin du détachement.
                </p>
                <button
                  onClick={() => {
                    if (!loanForm.employeeId || !loanForm.toCompanyId || !onCreateStaffLoan) return;
                    onCreateStaffLoan({
                      employeeId: loanForm.employeeId,
                      fromCompanyId: myCompany.id,
                      toCompanyId: loanForm.toCompanyId,
                      durationType: loanForm.durationType,
                      durationDays: loanForm.durationDays,
                      signingBonus: loanForm.signingBonus,
                      exclusive: loanForm.exclusive,
                    });
                    setLoanForm({ employeeId: "", toCompanyId: "", signingBonus: "", exclusive: false, durationType: "FIXED", durationDays: "" });
                  }}
                  disabled={!loanForm.employeeId || !loanForm.toCompanyId || (loanForm.durationType === "FIXED" && !loanForm.durationDays)}
                  className="bg-yellow-500 text-stone-900 px-4 py-2.5 rounded-lg font-black uppercase text-xs hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-2"
                >
                  <ArrowLeftRight size={14} /> Détacher
                </button>
              </div>
            </Card>

            <Card title={`Personnel prêté (${lentOut.length})`} icon={Users}>
              {lentOut.length === 0 ? (
                <div className="text-center text-stone-400 italic py-3 text-xs">Aucun salarié actuellement prêté.</div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {lentOut.map((loan) => (
                    <div key={loan.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-stone-700 flex items-center gap-2">
                          {loan.employeeName}
                          {loan.isOwnerLoan && (
                            <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-yellow-300">Dirigeant</span>
                          )}
                          {loan.exclusive && (
                            <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-purple-200">Exclusif</span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          Chez <span className="font-bold text-stone-500">{loan.toCompanyName}</span>
                          {loan.durationType === "FIXED" ? ` — J${loan.daysElapsed}/${loan.durationDays}` : " — indéterminé"}
                        </div>
                      </div>
                      <button
                        onClick={() => onEndStaffLoan && onEndStaffLoan(loan.id, "RECALLED")}
                        className="text-red-400 hover:text-red-600 text-[10px] font-black uppercase tracking-wide border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                      >
                        Rappeler
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title={`Personnel emprunté (${borrowedIn.length})`} icon={UserPlus}>
              {borrowedIn.length === 0 ? (
                <div className="text-center text-stone-400 italic py-3 text-xs">Aucun salarié actuellement emprunté.</div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {borrowedIn.map((loan) => (
                    <div key={loan.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-stone-700 flex items-center gap-2">
                          {loan.employeeName}
                          {loan.isOwnerLoan && (
                            <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-yellow-300">Dirigeant</span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          Prêté par <span className="font-bold text-stone-500">{loan.fromCompanyName}</span>
                          {(myCompany.workerBalances || {})[loan.employeeId] > 0 && ` — Compte: ${formatMoney((myCompany.workerBalances || {})[loan.employeeId])}`}
                          {loan.durationType === "FIXED" ? ` — J${loan.daysElapsed}/${loan.durationDays}` : " — indéterminé"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setManagingLoanId(loan.id)}
                          className="text-stone-500 border border-stone-300 hover:border-stone-500 hover:text-stone-700 text-[9px] font-black uppercase px-2 py-1 rounded"
                        >
                          Gérer
                        </button>
                        <button
                          onClick={() => onEndStaffLoan && onEndStaffLoan(loan.id, "ENDED")}
                          className="text-red-400 hover:text-red-600 text-[10px] font-black uppercase tracking-wide border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                        >
                          Mettre fin
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {history.length > 0 && (
              <Card title="Historique récent" icon={Clock}>
                <div className="divide-y divide-stone-100">
                  {history.map((loan) => (
                    <div key={loan.id} className="py-2 flex items-center justify-between text-xs">
                      <span className="text-stone-500">
                        {loan.employeeName} — {loan.fromCompanyName} → {loan.toCompanyName}
                      </span>
                      <span className="text-[9px] font-black uppercase text-stone-400">
                        {loan.status === "RECALLED" ? "Rappelé" : "Terminé"}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        );
      })()}

      {/* ONGLET GESTION (Babillard + Grades) */}
      {activeTab === "management" && (
        <div className="space-y-6">
          {/* Babillard d'entreprise */}
          <Card title="Babillard d'Entreprise" icon={Megaphone}>
            <div className="space-y-4">
              <div className="flex gap-2">
                <textarea
                  className="flex-1 p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none focus:border-stone-800 text-sm resize-none"
                  rows={2}
                  value={bulletinMsg}
                  onChange={(e) => setBulletinMsg(e.target.value)}
                  placeholder="Publier une annonce pour vos employés..."
                  maxLength={500}
                />
                <button
                  onClick={() => {
                    if (bulletinMsg.trim() && onPostBulletin) {
                      onPostBulletin(myCompany.id, bulletinMsg);
                      setBulletinMsg("");
                    }
                  }}
                  disabled={!bulletinMsg.trim()}
                  className="bg-stone-800 text-white px-4 rounded-xl font-bold uppercase text-xs hover:bg-stone-700 disabled:opacity-50 flex items-center gap-1 self-end"
                >
                  <Send size={14} /> Publier
                </button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(myCompany.bulletinBoard || []).length === 0 ? (
                  <div className="text-center text-stone-400 italic py-4 text-xs">
                    Aucune annonce publiée.
                  </div>
                ) : (
                  (myCompany.bulletinBoard || []).map((b) => (
                    <div key={b.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="text-sm text-stone-800 whitespace-pre-wrap">{b.message}</div>
                        <div className="text-[10px] text-stone-400 mt-1">
                          {new Date(b.date).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteBulletin && onDeleteBulletin(myCompany.id, b.id)}
                        className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Auto-autorisation à publier au nom de l'entreprise sur Mushtagram — le dirigeant/PDG
              y a accès par défaut ; ce toggle sert à s'en retirer soi-même si voulu, sans avoir à
              passer par quelqu'un d'autre. Liste dédiée (mushtagramManagerRevokedIds) car "absent
              de la liste" doit signifier "autorisé" pour un dirigeant/PDG, contrairement à un
              salarié classique (mushtagramAuthorizedIds, opt-in). */}
          {onSetCompanyMushtagramAccess && (() => {
            const isRevoked = (myCompany.mushtagramManagerRevokedIds || []).map(String).includes(String(user.id));
            return (
              <Card title="Mon accès Mushtagram" icon={Users}>
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-xs font-bold text-emerald-800">🏢 Publier au nom de {myCompany.name}</div>
                    <div className="text-[10px] text-emerald-600">Vous autoriser (ou non) à publier sur Mushtagram au nom de l'entreprise</div>
                  </div>
                  <button
                    onClick={() => onSetCompanyMushtagramAccess({ companyId: myCompany.id, citizenId: user.id, authorized: isRevoked })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-3 ${!isRevoked ? "bg-emerald-600" : "bg-stone-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${!isRevoked ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </Card>
            );
          })()}

          {/* Grades personnalisés */}
          <Card title="Grades & Rangs" icon={Shield}>
            <div className="space-y-4">
              <div className="text-xs text-stone-500 italic bg-stone-50 p-3 rounded border border-stone-200">
                Attribuez des grades personnalisés à vos employés, y compris le personnel détaché reçu d'une autre
                entreprise. Les grades peuvent inclure des permissions spéciales.
              </div>
              <div className="divide-y divide-stone-100">
                {[
                  ...(myCompany.employees || []).map((empId) => ({ id: empId, loaned: false })),
                  ...borrowedInLoans.map((l) => ({ id: l.employeeId, loaned: true, loan: l })),
                ].map(({ id: empId, loaned, loan }) => {
                  const emp = citizens.find((c) => c.id === empId);
                  const currentRank = (myCompany.employeeRanks || {})[empId];
                  const isEditing = rankEditTarget === empId;
                  return (
                    <div key={empId} className="py-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-stone-700">{emp?.name || loan?.employeeName || empId}</span>
                          {loaned && (
                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-blue-200 flex items-center gap-0.5">
                              <ArrowLeftRight size={9} /> Détaché
                            </span>
                          )}
                          {currentRank?.title && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-purple-200">
                              {currentRank.title}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (isEditing) {
                              setRankEditTarget(null);
                            } else {
                              setRankEditTarget(empId);
                              setRankTitle(currentRank?.title || "");
                              setRankPerms(currentRank?.permissions || {});
                            }
                          }}
                          className="text-[10px] font-bold uppercase text-stone-500 hover:text-stone-800 border border-stone-200 px-2 py-1 rounded hover:bg-stone-50"
                        >
                          {isEditing ? "Annuler" : currentRank?.title ? "Modifier" : "Attribuer"}
                        </button>
                      </div>
                      {isEditing && (
                        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-3">
                          <div>
                            <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Titre du grade</label>
                            <input
                              className="w-full p-2 border rounded text-sm font-bold"
                              value={rankTitle}
                              onChange={(e) => setRankTitle(e.target.value)}
                              placeholder="Ex: Contremaître, Intendant, Apprenti..."
                              maxLength={30}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Permissions</label>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { key: "payroll", label: "Paie", desc: "Verser les salaires" },
                                { key: "hire", label: "Recrutement", desc: "Envoyer des offres" },
                                { key: "bulletin", label: "Babillard", desc: "Publier des annonces" },
                                { key: "contracts", label: "Contrats", desc: "Voir les contrats" },
                              ].map((p) => (
                                <button
                                  key={p.key}
                                  onClick={() => setRankPerms((prev) => ({ ...prev, [p.key]: !prev[p.key] }))}
                                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-colors ${
                                    rankPerms[p.key]
                                      ? "bg-purple-100 text-purple-700 border-purple-300"
                                      : "bg-white text-stone-400 border-stone-200 hover:border-stone-300"
                                  }`}
                                  title={p.desc}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => {
                                if (onSetEmployeeRank) {
                                  onSetEmployeeRank(myCompany.id, empId, rankTitle.trim() ? { title: rankTitle.trim(), permissions: rankPerms } : null);
                                }
                                setRankEditTarget(null);
                              }}
                              className="bg-stone-800 text-white px-4 py-2 rounded text-[10px] font-bold uppercase hover:bg-stone-700 flex items-center gap-1"
                            >
                              <Check size={12} /> Enregistrer
                            </button>
                            {currentRank?.title && (
                              <button
                                onClick={() => {
                                  if (onSetEmployeeRank) onSetEmployeeRank(myCompany.id, empId, null);
                                  setRankEditTarget(null);
                                }}
                                className="text-red-500 hover:text-red-700 px-3 py-2 rounded text-[10px] font-bold uppercase border border-red-200 hover:bg-red-50"
                              >
                                Retirer le grade
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {(myCompany.employees || []).length === 0 && borrowedInLoans.length === 0 && (
                  <div className="text-center text-stone-400 italic py-4 text-xs">
                    Aucun employé à qui attribuer un grade.
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Inventaire d'entreprise */}
          <Card title="Stock & Inventaire" icon={Package}>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  className="flex-1 p-2 border rounded text-sm"
                  value={invItemName}
                  onChange={(e) => setInvItemName(e.target.value)}
                  placeholder="Nom de l'article..."
                  maxLength={50}
                />
                <input
                  type="number"
                  className="w-20 p-2 border rounded text-sm font-mono text-right"
                  value={invItemQty}
                  onChange={(e) => setInvItemQty(e.target.value)}
                  placeholder="Qté"
                  min={1}
                />
                <button
                  onClick={() => {
                    if (invItemName.trim() && invItemQty && onCompanyInventoryAdd) {
                      onCompanyInventoryAdd(myCompany.id, invItemName, parseInt(invItemQty));
                      setInvItemName("");
                      setInvItemQty("");
                    }
                  }}
                  disabled={!invItemName.trim() || !invItemQty || parseInt(invItemQty) <= 0}
                  className="bg-stone-800 text-white px-3 rounded font-bold uppercase text-xs hover:bg-stone-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus size={12} /> Ajouter
                </button>
              </div>
              <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto">
                {(myCompany.companyInventory || []).length === 0 ? (
                  <div className="text-center text-stone-400 italic py-4 text-xs">
                    Stock vide.
                  </div>
                ) : (
                  (myCompany.companyInventory || []).map((item) => (
                    <div key={item.id} className="py-2.5 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-stone-400" />
                        <span className="text-sm font-bold text-stone-700">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-stone-500">{item.quantity}x</span>
                        <button
                          onClick={() => onCompanyInventoryRemove && onCompanyInventoryRemove(myCompany.id, item.id, 1)}
                          className="text-red-400 hover:text-red-600 p-1"
                          title="Retirer 1"
                        >
                          <X size={13} />
                        </button>
                        <button
                          onClick={() => onCompanyInventoryRemove && onCompanyInventoryRemove(myCompany.id, item.id, item.quantity)}
                          className="text-red-400 hover:text-red-600 p-1"
                          title="Tout retirer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Événements d'entreprise */}
          <Card title="Événements" icon={Calendar}>
            <div className="space-y-4">
              <div className="space-y-2">
                <input
                  className="w-full p-2 border rounded text-sm font-bold"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Titre de l'événement..."
                  maxLength={60}
                />
                <div className="flex gap-2">
                  <input
                    className="flex-1 p-2 border rounded text-sm"
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="Description (optionnel)..."
                    maxLength={200}
                  />
                  <input
                    className="w-32 p-2 border rounded text-sm font-mono"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="Date RP..."
                    maxLength={20}
                  />
                </div>
                <button
                  onClick={() => {
                    if (eventTitle.trim() && onCreateCompanyEvent) {
                      onCreateCompanyEvent(myCompany.id, { title: eventTitle, description: eventDesc, date: eventDate });
                      setEventTitle("");
                      setEventDesc("");
                      setEventDate("");
                    }
                  }}
                  disabled={!eventTitle.trim()}
                  className="bg-stone-800 text-white px-4 py-2 rounded font-bold uppercase text-xs hover:bg-stone-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus size={12} /> Créer l'événement
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(myCompany.companyEvents || []).length === 0 ? (
                  <div className="text-center text-stone-400 italic py-4 text-xs">
                    Aucun événement planifié.
                  </div>
                ) : (
                  (myCompany.companyEvents || []).map((evt) => {
                    const isAuto = evt.source === "AUTO";
                    const isPositive = (evt.effectAmount || 0) >= 0;
                    return (
                      <div
                        key={evt.id}
                        className={`rounded-lg p-3 flex justify-between items-start border ${
                          isAuto
                            ? isPositive ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
                            : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <div className="font-bold text-sm text-stone-800">{evt.title}</div>
                            {isAuto && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-stone-800 text-white">
                                Auto
                              </span>
                            )}
                          </div>
                          {evt.date && (
                            <span className={`text-[10px] font-mono ${isAuto ? (isPositive ? "text-green-600" : "text-orange-600") : "text-blue-600"}`}>
                              {evt.date}
                            </span>
                          )}
                          {evt.description && <div className="text-xs text-stone-500 mt-1">{evt.description}</div>}
                          {isAuto && evt.effectAmount !== 0 && (
                            <div className={`text-xs font-bold mt-1 ${isPositive ? "text-green-700" : "text-orange-700"}`}>
                              {isPositive ? "+" : ""}{formatMoney(evt.effectAmount)}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => onDeleteCompanyEvent && onDeleteCompanyEvent(myCompany.id, evt.id)}
                          className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Card>

          {/* Sous-traitance */}
          <Card title="Sous-traitance" icon={Handshake}>
            <div className="space-y-4">
              <div className="text-xs text-stone-500 italic bg-stone-50 p-3 rounded border border-stone-200">
                Transférez des fonds de votre trésorerie vers une autre entreprise pour un service ou un contrat de sous-traitance.
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Entreprise destinataire</label>
                  <select
                    className="w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none font-bold text-sm"
                    value={subTargetCompany}
                    onChange={(e) => setSubTargetCompany(e.target.value)}
                  >
                    <option value="">— Choisir —</option>
                    {(companies || []).filter((c) => c.id !== myCompany.id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Montant (Écus)</label>
                    <input
                      type="number" step="0.1"
                      className="w-full p-2 border rounded font-mono text-sm"
                      value={subAmount}
                      onChange={(e) => setSubAmount(e.target.value)}
                      placeholder="0"
                      min={1}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Motif</label>
                    <input
                      className="w-full p-2 border rounded text-sm"
                      value={subDesc}
                      onChange={(e) => setSubDesc(e.target.value)}
                      placeholder="Ex: Fourniture de matériaux..."
                      maxLength={100}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (subTargetCompany && subAmount && onCreateSubcontract) {
                      onCreateSubcontract(myCompany.id, subTargetCompany, parseFloat(subAmount), subDesc);
                      setSubTargetCompany("");
                      setSubAmount("");
                      setSubDesc("");
                    }
                  }}
                  disabled={!subTargetCompany || !subAmount || parseFloat(subAmount) <= 0}
                  className="bg-yellow-500 text-stone-900 px-4 py-2.5 rounded-lg font-black uppercase text-xs hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={14} /> Transférer
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}


      {/* ONGLET BOURSE */}
      {activeTab === "bourse" && (() => {
        const myListing = bourseListings.find((l) => l.companyId === myCompany.id);
        const price = myListing ? (myListing.lastPrice || myListing.initialPrice) : 0;
        const shareholders = myListing
          ? (citizens || []).filter((c) => (c.stockholdings || {})[myListing.id] > 0).map((c) => ({
              ...c, shares: (c.stockholdings || {})[myListing.id],
              value: (c.stockholdings || {})[myListing.id] * price,
            }))
          : [];
        const totalHeld = shareholders.reduce((s, c) => s + c.shares, 0);
        const companyFloat = myListing ? (myListing.sellOrders || []).filter((o) => o.citizenId === "COMPANY").reduce((s, o) => s + o.qty, 0) : 0;
        const pctChange = myListing && myListing.initialPrice ? ((price - myListing.initialPrice) / myListing.initialPrice) * 100 : 0;

        if (!myListing) {
          // === PAS ENCORE COTÉE : formulaire IPO ===
          const previewCap = parseInt(bourseForm.totalShares) * parseFloat(bourseForm.price) || 0;
          return (
            <div className="space-y-6">
              <Card title="Introduction en Bourse (IPO)" icon={TrendingUp}>
                <div className="space-y-4">
                  <p className="text-xs text-stone-500">
                    Coter votre société en bourse vous permet d'émettre des actions et d'attirer des investisseurs.
                    Le cours se forme ensuite librement selon les échanges entre citoyens ; vous versez les dividendes manuellement.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Symbole boursier * (3-5 lettres)</label>
                      <input className="w-full border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-stone-400 bg-stone-50"
                        value={bourseForm.symbol} onChange={(e) => setBF({ symbol: e.target.value.toUpperCase().slice(0, 5) })} maxLength={5}
                        placeholder={myCompany.name.substring(0, 4).toUpperCase()} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Prix initial par action (Écus) *</label>
                      <input type="number" className="w-full border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-stone-400 bg-stone-50"
                        value={bourseForm.price} onChange={(e) => setBF({ price: e.target.value })} placeholder="ex: 100" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Nombre total d'actions émises *</label>
                      <input type="number" className="w-full border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-stone-400 bg-stone-50"
                        value={bourseForm.totalShares} onChange={(e) => setBF({ totalShares: e.target.value })} placeholder="ex: 1000" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Actions mises en vente (≤ total)</label>
                      <input type="number" className="w-full border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-stone-400 bg-stone-50"
                        value={bourseForm.onMarket} onChange={(e) => setBF({ onMarket: e.target.value })} placeholder="Défaut = total" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Prospectus / Description</label>
                    <textarea className="w-full border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-stone-400 bg-stone-50 resize-none"
                      rows={2} value={bourseForm.desc} onChange={(e) => setBF({ desc: e.target.value })}
                      placeholder="Activité, perspectives de rendement…" />
                  </div>
                  {bourseForm.totalShares && bourseForm.price && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm space-y-1">
                      <div className="text-[9px] font-black uppercase text-amber-600 tracking-widest">Récapitulatif IPO</div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Capitalisation initiale</span>
                        <span className="font-black font-mono text-amber-700">{formatMoney(previewCap)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Actions en vente</span>
                        <span className="font-bold">{bourseForm.onMarket || bourseForm.totalShares} / {bourseForm.totalShares}</span>
                      </div>
                    </div>
                  )}
                  <button
                    disabled={!bourseForm.symbol || !bourseForm.totalShares || !bourseForm.price}
                    onClick={() => {
                      onBourseCreateListing({
                        companyId: myCompany.id, symbol: bourseForm.symbol,
                        totalShares: bourseForm.totalShares, sharesOnMarket: bourseForm.onMarket || bourseForm.totalShares,
                        pricePerShare: bourseForm.price, description: bourseForm.desc || myCompany.description,
                      });
                      setBF({ symbol: "", totalShares: "", onMarket: "", price: "", desc: "" });
                    }}
                    className="w-full py-2.5 bg-stone-800 text-amber-400 font-black uppercase tracking-widest text-xs rounded-lg hover:bg-stone-700 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-center gap-2"
                  >
                    <TrendingUp size={14} /> Introduire en bourse
                  </button>
                </div>
              </Card>
            </div>
          );
        }

        // === DÉJÀ COTÉE : panel de gestion ===
        return (
          <div className="space-y-6">
            {/* En-tête cotation */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-stone-800 text-amber-300 font-black font-mono text-lg px-4 py-2 rounded-lg shrink-0">
                  {myListing.symbol}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-stone-800">{myCompany.name}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${myListing.isActive ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-500 border-red-200"}`}>
                      {myListing.isActive ? "Active" : "Suspendue"}
                    </span>
                    <span className="text-[9px] text-stone-500">depuis le {new Date(myListing.launchedAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black font-mono text-stone-800">{formatMoney(price)}</div>
                  <div className={`text-xs font-black flex items-center justify-end gap-1 ${pctChange > 0 ? "text-green-600" : pctChange < 0 ? "text-red-500" : "text-stone-400"}`}>
                    {pctChange > 0 ? <TrendingUp size={11} /> : pctChange < 0 ? <TrendingDown size={11} /> : null}
                    {pctChange !== 0 ? `${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(1)}% vs IPO` : "Cours stable"}
                  </div>
                </div>
                <button
                  onClick={() => onBourseEditListing(myListing.id, { isActive: !myListing.isActive })}
                  className="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-white shrink-0"
                >
                  {myListing.isActive ? "Suspendre" : "Réactiver"}
                </button>
              </div>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Capital total", value: formatMoney(myListing.totalShares * price), sub: myListing.totalShares.toLocaleString() + " actions" },
                { label: "Offre société", value: companyFloat.toLocaleString(), sub: `${myListing.totalShares > 0 ? ((companyFloat / myListing.totalShares) * 100).toFixed(1) : 0}% du capital` },
                { label: "Actionnaires", value: shareholders.length, sub: totalHeld.toLocaleString() + " actions détenues" },
                { label: "Prix IPO", value: formatMoney(myListing.initialPrice), sub: "prix d'introduction" },
              ].map((s, i) => (
                <div key={i} className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5">
                  <div className="text-[8px] font-black uppercase text-stone-400 tracking-widest">{s.label}</div>
                  <div className="text-sm font-black text-stone-800 mt-0.5">{s.value}</div>
                  <div className="text-[9px] text-stone-400">{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Offrir des titres */}
              <Card title="Offrir des titres au marché" icon={BarChart2}>
                <div className="space-y-3">
                  <p className="text-[10px] text-stone-400">
                    Le cours n'est plus modifiable à la main — il se forme par les échanges. Vous pouvez proposer de nouveaux titres à la vente,
                    au prix de votre choix (dans le plafond de variation journalier).
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-1">Quantité</label>
                      <input type="number" min={1} className="w-full border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-stone-400 bg-stone-50 font-mono"
                        value={bourseForm.offerQty} onChange={(e) => setBF({ offerQty: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-1">Prix / action</label>
                      <input type="number" step="0.1" className="w-full border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-stone-400 bg-stone-50 font-mono"
                        placeholder={price} value={bourseForm.offerPrice} onChange={(e) => setBF({ offerPrice: e.target.value })} />
                    </div>
                  </div>
                  <button
                    disabled={!bourseForm.offerQty || parseInt(bourseForm.offerQty) <= 0 || !bourseForm.offerPrice || parseFloat(bourseForm.offerPrice) <= 0}
                    onClick={() => {
                      onBourseCompanyOffer({ listingId: myListing.id, qty: parseInt(bourseForm.offerQty), price: parseFloat(bourseForm.offerPrice) });
                      setBF({ offerQty: "", offerPrice: "" });
                    }}
                    className="w-full py-2 bg-stone-800 text-amber-400 text-xs font-black uppercase rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors">
                    Mettre en vente
                  </button>
                  <div className="pt-2 border-t border-stone-100">
                    <OrderBookDepth buyOrders={myListing.buyOrders} sellOrders={myListing.sellOrders} myId={user.id} ownerId={myListing.ownerId} onCancel={onBourseCancelOrder ? (orderId, side) => onBourseCancelOrder({ listingId: myListing.id, orderId, side }) : undefined} />
                  </div>
                </div>
              </Card>

              {/* Cession directe à un citoyen choisi — hors marché public, n'importe qui (pas
                  seulement les employés comme pour l'ESPP) */}
              <Card title="Offrir des titres à un citoyen" icon={UserPlus}>
                <div className="space-y-3">
                  <p className="text-[10px] text-stone-400">
                    Cédez des actions directement à n'importe quel citoyen, hors carnet d'ordres. Prix à 0 = don pur ;
                    sinon le montant est prélevé immédiatement sur son compte.
                  </p>
                  <div>
                    <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-1">Destinataire</label>
                    <UserSearchSelect
                      users={citizens}
                      onSelect={(id) => setBF({ directTarget: id })}
                      placeholder="Rechercher un citoyen..."
                      excludeIds={[]}
                      value={bourseForm.directTarget}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-1">Quantité</label>
                      <input type="number" min={1} className="w-full border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-stone-400 bg-stone-50 font-mono"
                        value={bourseForm.directQty} onChange={(e) => setBF({ directQty: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-1">Prix / action (0 = don)</label>
                      <input type="number" step="0.1" min={0} className="w-full border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-stone-400 bg-stone-50 font-mono"
                        placeholder="0" value={bourseForm.directPrice} onChange={(e) => setBF({ directPrice: e.target.value })} />
                    </div>
                  </div>
                  <button
                    disabled={!bourseForm.directTarget || !bourseForm.directQty || parseInt(bourseForm.directQty) <= 0}
                    onClick={() => {
                      onBourseDirectOffer && onBourseDirectOffer({
                        listingId: myListing.id,
                        citizenId: bourseForm.directTarget,
                        qty: parseInt(bourseForm.directQty),
                        price: parseFloat(bourseForm.directPrice) || 0,
                      });
                      setBF({ directTarget: "", directQty: "", directPrice: "" });
                    }}
                    className="w-full py-2 bg-stone-800 text-amber-400 text-xs font-black uppercase rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors">
                    Céder les titres
                  </button>
                </div>
              </Card>

              {/* Dividendes */}
              <Card title="Dividendes" icon={Coins}>
                <div className="space-y-3">
                  {shareholders.length === 0 ? (
                    <p className="text-xs text-stone-400 italic text-center py-4">Aucun actionnaire pour le moment.</p>
                  ) : (
                    <>
                      <div className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-stone-500">Actionnaires</span>
                          <span className="font-bold">{shareholders.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Actions détenues</span>
                          <span className="font-bold">{totalHeld.toLocaleString()}</span>
                        </div>
                        {bourseForm.dividend && parseFloat(bourseForm.dividend) > 0 && (
                          <div className="flex justify-between border-t border-stone-200 pt-1 mt-1">
                            <span className="text-amber-600 font-bold">Total à distribuer</span>
                            <span className="font-black font-mono text-amber-700">{formatMoney(parseFloat(bourseForm.dividend) * totalHeld)}</span>
                          </div>
                        )}
                      </div>
                      {!bourseForm.showDividendForm ? (
                        <button onClick={() => setBF({ showDividendForm: true })}
                          className="w-full py-2.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black uppercase rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5">
                          <Coins size={13} /> Verser un dividende
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest block">Montant par action (Écus)</label>
                          <div className="flex gap-2">
                            <input type="number" step="0.1" className="flex-1 border border-amber-200 rounded-lg p-2.5 text-sm outline-none focus:border-amber-400 bg-amber-50 font-mono"
                              placeholder="ex: 5" value={bourseForm.dividend} onChange={(e) => setBF({ dividend: e.target.value })} />
                            <button
                              disabled={!bourseForm.dividend || parseFloat(bourseForm.dividend) <= 0}
                              onClick={() => { onBoursePayDividends(myListing.id, bourseForm.dividend); setBF({ dividend: "", showDividendForm: false }); }}
                              className="px-4 py-2 bg-amber-600 text-white text-xs font-black uppercase rounded-lg hover:bg-amber-500 disabled:opacity-40 transition-colors">
                              Distribuer
                            </button>
                            <button onClick={() => setBF({ showDividendForm: false, dividend: "" })}
                              className="px-3 py-2 text-stone-400 hover:text-stone-600 text-xs">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {(myListing.dividendHistory || []).length > 0 && (
                    <div className="border-t border-stone-100 pt-3 space-y-1">
                      <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Historique</div>
                      {myListing.dividendHistory.slice(0, 4).map((d, i) => (
                        <div key={i} className="flex justify-between text-[10px]">
                          <span className="text-stone-400">{new Date(d.timestamp).toLocaleDateString("fr-FR")}</span>
                          <span className="font-mono text-amber-600 font-bold">{d.amount} Écu/action — {formatMoney(d.totalPaid || 0)}{d.partial ? " (partiel)" : ""}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Conseil d'administration — mêmes propositions/votes que côté actionnaire (Bourse) */}
            <BoardVotingPanel
              listing={myListing}
              company={myCompany}
              citizens={citizens}
              staffLoans={staffLoans}
              myId={user.id}
              dayCycle={dayCycle}
              proposals={boardProposals}
              onCreateBoardProposal={onCreateBoardProposal}
              onCastBoardVote={onCastBoardVote}
              onCancelBoardProposal={onCancelBoardProposal}
            />

            {/* ── Plan d'Actionnariat Salarié (ESPP) — config patron ── */}
            {myListing && onUpdateCompanyESPP && (
              <ESPPConfigCard
                key={myCompany.id}
                myCompany={myCompany}
                myListing={myListing}
                onUpdateCompanyESPP={onUpdateCompanyESPP}
              />
            )}

            {/* Actionnaires */}
            <Card title={`Actionnaires (${shareholders.length})`} icon={Users}>
              {shareholders.length === 0 ? (
                <p className="text-xs text-stone-400 italic text-center py-6">Aucun actionnaire pour le moment. Les actions sont disponibles à l'achat sur la Bourse.</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-12 gap-2 px-2 text-[8px] font-black uppercase text-stone-400 tracking-widest pb-1 border-b border-stone-100">
                    <div className="col-span-5">Citoyen</div>
                    <div className="col-span-3 text-right">Actions</div>
                    <div className="col-span-2 text-right">% du capital</div>
                    <div className="col-span-2 text-right">Valeur</div>
                  </div>
                  {shareholders.sort((a, b) => b.shares - a.shares).map((c) => (
                    <div key={c.id} className="grid grid-cols-12 gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-50 items-center">
                      <div className="col-span-5 flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 bg-stone-200 rounded-full flex items-center justify-center text-[10px] font-black text-stone-500 shrink-0">
                          {(c.firstName || c.name || "?")[0].toUpperCase()}
                        </div>
                        <span className="text-xs text-stone-700 font-bold truncate">
                          {c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : c.name}
                        </span>
                      </div>
                      <div className="col-span-3 text-right text-xs font-mono font-bold text-stone-700">{c.shares.toLocaleString()}</div>
                      <div className="col-span-2 text-right text-[10px] text-stone-400">
                        {myListing.totalShares > 0 ? ((c.shares / myListing.totalShares) * 100).toFixed(1) : 0}%
                      </div>
                      <div className="col-span-2 text-right text-[10px] font-mono font-bold text-amber-600">{formatMoney(c.value)}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Historique des prix */}
            {(myListing.priceHistory || []).length > 1 && (
              <Card title="Historique des cours (transactions réelles)" icon={History}>
                <div className="mb-3">
                  <PriceHistoryChart history={myListing.priceHistory} />
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {myListing.priceHistory.slice(0, 15).map((h, i) => (
                    <div key={i} className="flex items-center justify-between px-2 py-1 rounded hover:bg-stone-50 text-xs">
                      <span className="text-stone-400 text-[10px]">{new Date(h.timestamp).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                      <span className={`font-black font-mono ${i === 0 ? "text-amber-600" : "text-stone-500"}`}>{formatMoney(h.price)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        );
      })()}

      {/* ONGLET PERSONNALISATION */}
      {activeTab === "customize" && (
        <div className="space-y-6">
          <Card title="Identité de l'Entreprise" icon={Palette}>
            {!customizeOpen ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                    <div className="text-[9px] font-bold uppercase text-stone-400 tracking-widest mb-1">
                      Devise
                    </div>
                    <div className="text-sm font-bold text-stone-700 italic">
                      {myCompany.motto || "(aucune)"}
                    </div>
                  </div>
                  <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                    <div className="text-[9px] font-bold uppercase text-stone-400 tracking-widest mb-1">
                      Couleur
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full border border-stone-300"
                        style={{
                          backgroundColor: myCompany.color || "#8B5CF6",
                        }}
                      />
                      <span className="text-xs font-mono text-stone-500">
                        {myCompany.color || "#8B5CF6"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                  <div className="text-[9px] font-bold uppercase text-stone-400 tracking-widest mb-1">
                    Description
                  </div>
                  <div className="text-sm text-stone-600">
                    {myCompany.description || "(aucune description)"}
                  </div>
                </div>
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                  <div className="text-[9px] font-bold uppercase text-stone-400 tracking-widest mb-1">
                    Statut du recrutement
                  </div>
                  <div
                    className={`text-sm font-bold ${myCompany.hiringOpen !== false ? "text-green-600" : "text-red-500"}`}
                  >
                    {myCompany.hiringOpen !== false ? "Ouvert" : "Fermé"}
                  </div>
                </div>
                <button
                  onClick={openCustomize}
                  className="w-full bg-stone-800 text-white py-3 rounded font-bold uppercase text-xs tracking-widest hover:bg-stone-700 flex items-center justify-center gap-2"
                >
                  <Palette size={14} /> Modifier l'identité
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">
                    Devise / Slogan
                  </label>
                  <input
                    className="w-full p-2 border rounded text-sm"
                    value={editMotto}
                    onChange={(e) => setEditMotto(e.target.value)}
                    placeholder="Ex: L'excellence au service de l'Empire..."
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full p-2 border rounded text-sm resize-none"
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Décrivez votre entreprise..."
                    maxLength={300}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">
                      Couleur
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <div className="flex gap-1 flex-wrap">
                        {[
                          "#8B5CF6",
                          "#EF4444",
                          "#F59E0B",
                          "#10B981",
                          "#3B82F6",
                          "#EC4899",
                          "#6366F1",
                          "#14B8A6",
                        ].map((c) => (
                          <button
                            key={c}
                            onClick={() => setEditColor(c)}
                            className={`w-6 h-6 rounded-full border-2 ${editColor === c ? "border-stone-800 scale-110" : "border-transparent"}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">
                      Recrutement
                    </label>
                    <button
                      onClick={() => setEditHiring(!editHiring)}
                      className={`w-full p-2 rounded font-bold text-xs uppercase ${
                        editHiring
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-red-100 text-red-600 border border-red-300"
                      }`}
                    >
                      {editHiring ? "Ouvert" : "Fermé"}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-stone-200">
                  <button
                    onClick={saveCustomize}
                    className="flex-1 bg-stone-900 text-yellow-400 py-2.5 rounded font-black uppercase text-xs hover:bg-stone-700"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setCustomizeOpen(false)}
                    className="px-4 py-2.5 border border-stone-300 rounded text-xs font-bold text-stone-500 hover:bg-stone-100"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* PDG — délégation de gestion. Note : si un PDG est déjà en poste, isDelegatedOwner
              intercepte le rendu bien plus haut (vue "Gestion déléguée") — ce bloc n'est donc
              atteint par le vrai propriétaire que tant qu'aucun PDG n'est nommé. */}
          {isTrueOwner && (() => {
            // Le PDG doit être choisi parmi le personnel de l'entreprise : salariés en poste
            // ou salariés actuellement détachés vers cette entreprise (staffLoans, toCompanyId).
            const borrowedInIds = new Set(
              staffLoans.filter((l) => l.status === "ACTIVE" && l.toCompanyId === myCompany.id).map((l) => String(l.employeeId))
            );
            const eligibleIds = new Set([
              ...((myCompany.employees || []).map(String)),
              ...borrowedInIds,
            ]);
            const eligibleCitizens = citizens.filter((c) => eligibleIds.has(String(c.id)) && c.id !== user.id);
            return (
              <Card title="PDG" icon={Crown}>
                <div className="space-y-4">
                  <div className="text-xs text-stone-500 italic bg-stone-50 p-3 rounded border border-stone-200">
                    Déléguez la gestion opérationnelle de l'entreprise à un PDG (RH, trésorerie, Bourse,
                    personnalisation...) : dès sa nomination, vous n'aurez plus la main dessus vous-même. Seules la
                    révocation du PDG et la dissolution vous resteront réservées. Si l'entreprise est cotée en bourse,
                    VOUS devenez actionnaire majoritaire : vous recevez gratuitement toutes les actions du flottant
                    jamais vendues à un investisseur.
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold uppercase text-stone-400 mb-1 block">
                          Nommer un PDG (parmi les salariés ou salariés détachés)
                        </label>
                        <UserSearchSelect
                          users={eligibleCitizens}
                          onSelect={setCeoTarget}
                          placeholder="Rechercher parmi le personnel..."
                          excludeIds={[user.id]}
                          value={ceoTarget}
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!ceoTarget || !onAppointCEO) return;
                          onAppointCEO({ companyId: myCompany.id, citizenId: ceoTarget });
                          setCeoTarget("");
                        }}
                        disabled={!ceoTarget}
                        className="bg-yellow-500 text-stone-900 px-4 py-2.5 rounded-lg font-black uppercase text-xs hover:bg-yellow-400 disabled:opacity-50"
                      >
                        Nommer
                      </button>
                    </div>
                    {eligibleCitizens.length === 0 && (
                      <div className="text-[10px] text-stone-400 italic">
                        Aucun salarié ou salarié détaché disponible — recrutez ou faites-vous détacher du personnel avant de nommer un PDG.
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })()}
          {isCeoView && (
            <Card title="PDG" icon={Crown}>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <span className="font-black">Vous êtes PDG</span> de {myCompany.name}, avec délégation de gestion
                du propriétaire ({citizens.find((c) => c.id === myCompany.ownerId)?.name || "Inconnu"}).
              </div>
            </Card>
          )}

          {/* DISSOLUTION */}
          {onDeleteCompany && isTrueOwner && (
            <Card title="Zone Dangereuse" icon={Trash2}>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-xs text-red-600 mb-3">
                  La dissolution est irréversible. Le solde restant sera
                  restitué à votre compte personnel. Tous les employés seront
                  licenciés.
                </p>
                <SecureDeleteButton
                  onClick={() => onDeleteCompany(myCompany.id)}
                  label="Dissoudre mon entreprise"
                />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Modale de gestion d'employé */}
      {managingEmployee && (() => {
        const emp = citizens.find(c => c.id === managingEmployee);
        return (
          <EmployeeManagementModal
            emp={emp}
            empId={managingEmployee}
            myCompany={myCompany}
            onClose={() => setManagingEmployee(null)}
            onSetEmployeeSerfRights={onSetEmployeeSerfRights}
            onSetEmployeeRank={onSetEmployeeRank}
            onUpdateEmployeeContract={onUpdateEmployeeContract}
            onCompanyFire={onCompanyFire}
            onClaimCorvee={onClaimCorvee}
            onSetCompanyMushtagramAccess={onSetCompanyMushtagramAccess}
            formatMoney={formatMoney}
          />
        );
      })()}

      {/* Modale de gestion d'un salarié détaché — même modale que pour un employé classique
          (Restrictions/Détachement/Grade), utilisée aussi bien depuis les Effectifs que depuis
          l'onglet Détachement lui-même. */}
      {managingLoanId && (() => {
        const loan = (staffLoans || []).find((l) => l.id === managingLoanId);
        if (!loan) return null;
        const emp = citizens.find((c) => c.id === loan.employeeId);
        return (
          <EmployeeManagementModal
            emp={emp}
            empId={loan.employeeId}
            myCompany={myCompany}
            loan={loan}
            onClose={() => setManagingLoanId(null)}
            onSetEmployeeRank={onSetEmployeeRank}
            onSetCompanyMushtagramAccess={onSetCompanyMushtagramAccess}
            onSetStaffLoanPermissions={onSetStaffLoanPermissions}
            onEndStaffLoan={onEndStaffLoan}
            formatMoney={formatMoney}
          />
        );
      })()}

      {/* Modale d'auto-gestion des droits (dirigeant/PDG) — même modale que pour un employé,
          en mode "self" : personne au-dessus d'eux dans l'entreprise pour le faire à leur place. */}
      {managingSelf && (
        <EmployeeManagementModal
          emp={user}
          empId={user.id}
          myCompany={myCompany}
          selfMode
          selfRights={user.selfLockedRights}
          onSetSelfRights={onSetSelfRights}
          onClose={() => setManagingSelf(false)}
          formatMoney={formatMoney}
        />
      )}
    </div>
  );
};

export default MyCompanyView;
