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
} from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";
import SecureDeleteButton from "../ui/SecureDeleteButton";

const TYPE_RATES = {
  SERVICE: { emp: 12, slave: 9, label: "Services / Commerce" },
  MANUFACTURE: { emp: 10, slave: 8, label: "Manufacture / Artisanat" },
  EXTRACTION: { emp: 8, slave: 7, label: "Extraction / Ferme" },
};

const MyCompanyView = ({
  user,
  companies,
  citizens,
  onCompanyTreasury,
  onSendJobOffer,
  onRespondJobOffer,
  onPaySalaries,
  onCompanyFire,
  onCustomizeCompany,
  onDeleteCompany,
}) => {
  const myCompany = (companies || []).find((c) => c.ownerId === user.id);
  const myJobOffers = user.jobOffers || [];

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [hireTarget, setHireTarget] = useState("");
  const [activeTab, setActiveTab] = useState("hr");

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

  // --- CAS 1 : CITOYEN SANS ENTREPRISE ---
  if (!myCompany) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="h-[30vh] flex flex-col items-center justify-center text-stone-400 p-8 text-center border-2 border-dashed border-stone-300 rounded-xl">
          <Building2 size={64} className="mb-4 text-stone-300" />
          <h3 className="text-xl font-bold text-stone-600 mb-2">
            Aucune Entreprise
          </h3>
          <p className="text-sm max-w-md">
            Vous ne possédez pas de charte commerciale. Rapprochez-vous de
            l'administration pour en fonder une.
          </p>
        </div>

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
