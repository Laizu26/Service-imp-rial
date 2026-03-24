import React, { useState } from "react";
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
} from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";
import SecureDeleteButton from "../ui/SecureDeleteButton";

const TYPE_RATES = {
  SERVICE: { emp: 12, slave: 9, label: "Services / Commerce" },
  MANUFACTURE: { emp: 10, slave: 8, label: "Manufacture / Artisanat" },
  EXTRACTION: { emp: 8, slave: 7, label: "Extraction / Ferme" },
};

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
}) => {
  const myCompany = (companies || []).find((c) => c.ownerId === user.id);
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

  // Salaires individuels
  const [salaryMap, setSalaryMap] = useState({});

  // Personnalisation
  const [editDesc, setEditDesc] = useState("");
  const [editMotto, setEditMotto] = useState("");
  const [editColor, setEditColor] = useState("#8B5CF6");
  const [editHiring, setEditHiring] = useState(true);
  const [customizeOpen, setCustomizeOpen] = useState(false);

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
    const workerCompany = employedAt || slavedAt;
    const isEmployee = !!employedAt;
    const isSlave = !!slavedAt;

    return (
      <div className="space-y-6 animate-fadeIn">
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
                      {isEmployee ? "Employé chez" : "Affecté à"}
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
                        isEmployee
                          ? "bg-green-100 text-green-600"
                          : "bg-stone-200 text-stone-500"
                      }`}>
                        {isEmployee ? "Salarié" : "Esclave"}
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
                  <div className="text-right bg-stone-50 p-4 rounded-xl border border-stone-200 min-w-[160px]">
                    <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">
                      Votre solde
                    </div>
                    <div className="text-3xl font-mono font-black text-stone-800">
                      {(user.balance || 0).toLocaleString()}{" "}
                      <span className="text-sm">Écus</span>
                    </div>
                  </div>
                </div>
              </div>

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
                        {((wEmpCount * wRates.emp + wSlaveCount * wRates.slave) * wLevel).toLocaleString()} Écus
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

                <Card title="Collègues" icon={Users}>
                  {colleagues.length === 0 ? (
                    <div className="text-center text-stone-400 italic py-4 text-xs">
                      Aucun autre employé.
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto">
                      {colleagues.map((c) => (
                        <div key={c.id} className="py-2.5 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-500 flex-shrink-0">
                            {(c.name || "?")[0]}
                          </div>
                          <span className="text-sm font-bold text-stone-700">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Démission (seulement employé, pas esclave) */}
              {isEmployee && onQuitCompany && (
                <Card title="Contrat de travail" icon={Briefcase}>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-stone-600">
                        Vous pouvez démissionner de votre poste. Cette action est immédiate.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm(`Voulez-vous vraiment quitter ${workerCompany.name} ?`)) {
                          onQuitCompany(workerCompany.id);
                        }
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded text-[10px] font-bold uppercase tracking-wide hover:bg-red-500 flex-shrink-0"
                    >
                      Démissionner
                    </button>
                  </div>
                </Card>
              )}
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
      </div>
    );
  }

  // --- CAS 2 : PROPRIÉTAIRE D'ENTREPRISE ---
  const rates = TYPE_RATES[myCompany.type] || { emp: 10, slave: 8, label: myCompany.type };
  const empCount = (myCompany.employees || []).length;
  const slaveCount = (myCompany.slaves || []).length;
  const level = myCompany.level || 1;
  const taxRate = (myCompany.taxRate ?? 10) / 100;
  const dailyRevenue = (empCount * rates.emp + slaveCount * rates.slave) * level;
  const dailyTax = Math.floor(dailyRevenue * taxRate);
  const dailyNet = dailyRevenue - dailyTax;

  const totalSalary = Object.values(salaryMap).reduce(
    (sum, v) => sum + (parseInt(v) || 0),
    0
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* HEADER */}
      <div
        className="bg-white border-l-8 p-6 rounded-r-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style={{ borderColor: myCompany.color || "#8B5CF6" }}
      >
        <div className="flex-1">
          <div className="text-xs font-black uppercase text-stone-400 tracking-widest mb-1">
            Société Privée
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
            {myCompany.balance?.toLocaleString()}{" "}
            <span className="text-sm">Écus</span>
          </div>
        </div>
      </div>

      {/* ONGLETS */}
      <div className="flex gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        {[
          { id: "hr", label: "Personnel" },
          { id: "finance", label: "Banque & Salaires" },
          { id: "contracts", label: "Contrats", icon: ScrollText },
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
          </button>
        ))}
      </div>

      {/* ONGLET PERSONNEL */}
      {activeTab === "hr" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Recrutement" icon={Users}>
            <div className="space-y-4">
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
                  onClick={() => {
                    if (hireTarget) {
                      onSendJobOffer(myCompany.id, hireTarget);
                      setHireTarget("");
                    }
                  }}
                  disabled={!hireTarget}
                  className="bg-stone-800 text-white px-4 py-2.5 rounded font-bold uppercase text-xs hover:bg-stone-700 disabled:opacity-50 flex items-center gap-2 mb-[1px]"
                >
                  <Send size={14} /> Envoyer
                </button>
              </div>

              <div className="border-t border-stone-100 pt-2">
                <div className="text-[10px] font-black uppercase text-stone-400 mb-2">
                  Effectifs Actuels ({empCount})
                </div>
                <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto">
                  {empCount === 0 && (
                    <div className="py-4 text-center text-stone-400 italic text-xs">
                      Aucun salarié.
                    </div>
                  )}
                  {(myCompany.employees || []).map((empId) => {
                    const emp = citizens.find((c) => c.id === empId);
                    return (
                      <div
                        key={empId}
                        className="py-3 flex justify-between items-center"
                      >
                        <span className="font-bold text-stone-700 text-sm">
                          {emp ? emp.name : "Inconnu"}
                        </span>
                        <button
                          onClick={() =>
                            onCompanyFire(myCompany.id, empId, "FIRE")
                          }
                          className="text-red-400 hover:text-red-600 text-[10px] font-black uppercase tracking-wide border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                        >
                          Licencier
                        </button>
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
      )}

      {/* ONGLET FINANCE */}
      {activeTab === "finance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Injection Capital" icon={ArrowDownLeft}>
              <div className="flex gap-2">
                <input
                  type="number"
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
              <div className="flex gap-2">
                <input
                  type="number"
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
                    Employés ({empCount}) x {rates.emp} Écus x Niv.{level}
                  </span>
                  <span className="font-mono font-bold">
                    {(empCount * rates.emp * level).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Esclaves ({slaveCount}) x {rates.slave} Écus x Niv.{level}
                  </span>
                  <span className="font-mono font-bold">
                    {(slaveCount * rates.slave * level).toLocaleString()}
                  </span>
                </div>
              </div>
              {(() => {
                const totalWorkers = empCount + slaveCount;
                const requiredWorkers = level * 2;
                const requiredFunds = level * 500;
                return (
                  <div className="bg-stone-50 rounded-lg p-3 border border-stone-200 text-xs text-stone-500">
                    <div className="text-[9px] uppercase font-bold tracking-widest mb-2">
                      Progression niveau {level} &rarr; {level + 1}
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Travailleurs</span>
                      <span
                        className={`font-bold ${totalWorkers >= requiredWorkers ? "text-green-600" : "text-red-500"}`}
                      >
                        {totalWorkers} / {requiredWorkers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trésorerie requise</span>
                      <span
                        className={`font-bold ${(myCompany.balance || 0) >= requiredFunds ? "text-green-600" : "text-red-500"}`}
                      >
                        {(myCompany.balance || 0).toLocaleString()} /{" "}
                        {requiredFunds.toLocaleString()}
                      </span>
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
                        return (
                          <div
                            key={empId}
                            className="py-3 flex justify-between items-center gap-3"
                          >
                            <span className="font-bold text-stone-700 text-sm flex-1 truncate">
                              {emp ? emp.name : empId}
                            </span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
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
                                type="number"
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

                <div className="flex justify-between items-center pt-3 border-t border-stone-200">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      Coût Total
                    </span>
                    <span className="ml-2 text-sm font-mono font-bold text-stone-700">
                      {totalSalary.toLocaleString()} Écus
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
        </div>
      )}

      {/* ONGLET CONTRATS */}
      {activeTab === "contracts" && (() => {
        const companyContracts = jobContracts.filter(
          (c) => c.source?.id === myCompany.id
        );

        // Pool des destinataires disponibles : employés + esclaves de l'entreprise
        const workerPool = [
          ...(myCompany.employees || []).map((id) => {
            const c = citizens.find((x) => x.id === id);
            return { id, type: "CITIZEN", name: c ? c.name : id };
          }),
          ...(myCompany.slaves || []).map((id) => {
            const c = citizens.find((x) => x.id === id);
            return { id, type: "CITIZEN", name: (c ? c.name : id) + " (esclave)" };
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
                          {c.frequency !== "par_tache" && `${c.amount?.toLocaleString()} Écus · `}
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
                          type="number" min={0}
                          className="w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none focus:border-stone-800 font-bold font-mono"
                          value={form.amount || ""}
                          onChange={(e) => setContractForm((f) => ({ ...f, amount: parseInt(e.target.value) || 0 }))}
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
                                      = {share.toLocaleString()} Écus / versement
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
                                  +{Math.floor(form.amount * r.percent / 100).toLocaleString()} Écus
                                </span>
                              </div>
                            ))}
                            <div className="border-t border-stone-700 pt-1.5 mt-1.5 flex justify-between text-xs font-black">
                              <span className="text-stone-400 uppercase tracking-widest">Total prélevé</span>
                              <span className="text-white font-mono">{form.amount.toLocaleString()} Écus</span>
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

          {/* DISSOLUTION */}
          {onDeleteCompany && (
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
    </div>
  );
};

export default MyCompanyView;
