import React, { useState } from "react";
import {
  Building2,
  Users,
  Package,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  CheckCircle,
  XCircle,
  Send,
  Briefcase,
} from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";

const MyCompanyView = ({
  user,
  companies,
  citizens,
  onCompanyTreasury,
  onSendJobOffer,
  onRespondJobOffer,
  onPaySalaries,
  onCompanyFire,
}) => {
  const myCompany = (companies || []).find((c) => c.ownerId === user.id);
  const myJobOffers = user.jobOffers || [];

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [hireTarget, setHireTarget] = useState("");
  const [activeTab, setActiveTab] = useState("hr");

  const mySlaves = (citizens || []).filter(
    (c) => c.ownerId === user.id && !c.isForSale
  );

  // --- CAS 1 : CITOYEN SANS ENTREPRISE (CHÔMEUR OU SALARIÉ) ---
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
  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="bg-white border-l-8 border-stone-800 p-6 rounded-r-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-xs font-black uppercase text-stone-400 tracking-widest mb-1">
            Société Privée
          </div>
          <h1 className="text-3xl font-black font-serif text-stone-900">
            {myCompany.name}
          </h1>
          <div className="flex gap-4 mt-2">
            <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
              {myCompany.type}
            </span>
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
              Niveau {myCompany.level}
            </span>
          </div>
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

      <div className="flex gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("hr")}
          className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest ${
            activeTab === "hr"
              ? "bg-stone-800 text-white"
              : "text-stone-500 hover:bg-stone-100"
          }`}
        >
          Personnel
        </button>
        <button
          onClick={() => setActiveTab("finance")}
          className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest ${
            activeTab === "finance"
              ? "bg-stone-800 text-white"
              : "text-stone-500 hover:bg-stone-100"
          }`}
        >
          Banque & Salaires
        </button>
      </div>

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
                  Effectifs Actuels ({(myCompany.employees || []).length})
                </div>
                <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto">
                  {(myCompany.employees || []).length === 0 && (
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
                    onCompanyTreasury(myCompany.id, withdrawAmount, "WITHDRAW");
                    setWithdrawAmount("");
                  }}
                  className="bg-stone-800 text-white px-4 py-2 rounded font-bold uppercase text-xs hover:bg-stone-700"
                >
                  Retirer
                </button>
              </div>
            </Card>
          </div>

          <Card title="Versement des Salaires" icon={Wallet}>
            <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 flex flex-col md:flex-row items-end gap-6">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-black uppercase text-stone-400 mb-2 block tracking-widest">
                  Montant de la Prime (Par Employé)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full p-3 pl-4 bg-white border border-stone-300 rounded-lg font-mono font-bold text-stone-800"
                    placeholder="Ex: 50"
                    value={salaryAmount}
                    onChange={(e) => setSalaryAmount(e.target.value)}
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-bold text-stone-400">
                    ÉCUS
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  onPaySalaries(myCompany.id, salaryAmount);
                  setSalaryAmount("");
                }}
                className="bg-yellow-500 text-stone-900 px-8 py-3.5 rounded-lg font-black uppercase text-xs shadow-lg hover:bg-yellow-400 active:scale-95 transition-all w-full md:w-auto flex items-center justify-center gap-2"
              >
                <Wallet size={16} /> Verser aux{" "}
                {(myCompany.employees || []).length} salariés
              </button>
            </div>
            <div className="mt-3 flex justify-between items-center px-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Coût Total Estimé
              </span>
              <span className="text-sm font-mono font-bold text-stone-600">
                {(
                  (parseInt(salaryAmount) || 0) *
                  (myCompany.employees || []).length
                ).toLocaleString()}{" "}
                Écus
              </span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MyCompanyView;
