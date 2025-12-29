import React, { useState } from "react";
import {
  Building2,
  TrendingUp,
  Users,
  Package,
  AlertCircle,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Pickaxe,
} from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";

const MyCompanyView = ({
  user,
  companies,
  citizens,
  onCompanyTreasury,
  onCompanyHireFire,
  onCompanyProduce,
}) => {
  const myCompany = (companies || []).find((c) => c.ownerId === user.id);

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [hireTarget, setHireTarget] = useState("");
  const [activeTab, setActiveTab] = useState("ops");

  // Esclaves appartenant au joueur qu'il peut affecter
  const mySlaves = (citizens || []).filter(
    (c) => c.ownerId === user.id && !c.isForSale
  );

  if (!myCompany) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center text-stone-400 p-8 text-center border-2 border-dashed border-stone-300 rounded-xl">
        <Building2 size={64} className="mb-4 text-stone-300" />
        <h3 className="text-xl font-bold text-stone-600 mb-2">
          Aucune Entreprise
        </h3>
        <p className="text-sm max-w-md">
          Vous ne possédez pas encore de charte commerciale. Rapprochez-vous
          d'un administrateur ou de votre gouverneur pour fonder votre société.
        </p>
      </div>
    );
  }

  // Calculs pour la production
  const employeeCount = (myCompany.employees || []).length;
  const slaveCount = (myCompany.slaves || []).length;
  const prodValue =
    myCompany.level * 100 + employeeCount * 50 + slaveCount * 20;
  const prodCost = Math.floor(prodValue * 0.2);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Header Entreprise */}
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

      {/* Navigation Interne */}
      <div className="flex gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("ops")}
          className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest ${
            activeTab === "ops"
              ? "bg-stone-800 text-white"
              : "text-stone-500 hover:bg-stone-100"
          }`}
        >
          Opérations
        </button>
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
          Banque
        </button>
      </div>

      {/* --- ONGLET OPERATIONS (PRODUCTION) --- */}
      {activeTab === "ops" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Chaîne de Production" icon={Package}>
            <div className="space-y-6">
              <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase text-stone-500">
                    Capacité de Production
                  </span>
                  <span className="text-xs font-black bg-stone-200 px-2 py-1 rounded">
                    {employeeCount + slaveCount} Travailleurs
                  </span>
                </div>
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 h-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (employeeCount + slaveCount) * 10
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div>
                  <div className="text-xs font-bold uppercase text-yellow-700 mb-1">
                    Estimation Revenus
                  </div>
                  <div className="text-2xl font-black text-stone-900">
                    ~{prodValue} Écus
                  </div>
                  <div className="text-[10px] text-stone-500">
                    Coût d'exploitation : {prodCost} Écus
                  </div>
                </div>
                <button
                  onClick={() => onCompanyProduce(myCompany.id)}
                  disabled={myCompany.balance < prodCost}
                  className="bg-stone-900 text-yellow-500 px-6 py-3 rounded-lg font-black uppercase text-xs shadow-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Pickaxe size={16} /> Lancer Cycle
                </button>
              </div>
            </div>
          </Card>
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-sm text-blue-900">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <AlertCircle size={16} /> Guide du Patron
            </h4>
            <p className="mb-2">Pour augmenter vos profits :</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>
                Embauchez plus de <strong>salariés</strong> (Production x50).
              </li>
              <li>
                Affectez vos <strong>esclaves</strong> (Production x20, coût
                nul).
              </li>
              <li>
                Demandez une <strong>amélioration de niveau</strong> à
                l'administration.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* --- ONGLET RESSOURCES HUMAINES --- */}
      {activeTab === "hr" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Salariés" icon={Users}>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <UserSearchSelect
                    users={citizens}
                    onSelect={setHireTarget}
                    placeholder="Rechercher un citoyen..."
                    excludeIds={[user.id, ...(myCompany.employees || [])]}
                  />
                </div>
                <button
                  onClick={() => {
                    if (hireTarget)
                      onCompanyHireFire(myCompany.id, hireTarget, "HIRE");
                    setHireTarget("");
                  }}
                  disabled={!hireTarget}
                  className="bg-green-600 text-white px-3 rounded font-bold uppercase text-xs hover:bg-green-500 disabled:opacity-50"
                >
                  Embaucher
                </button>
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
                          onCompanyHireFire(myCompany.id, empId, "FIRE")
                        }
                        className="text-red-400 hover:text-red-600 text-[10px] font-black uppercase"
                      >
                        Licencier
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card title="Main d'Œuvre Servile" icon={AlertCircle}>
            <div className="space-y-4">
              <div className="bg-stone-100 p-3 rounded text-xs text-stone-500 italic mb-2">
                Vous pouvez affecter vos propres esclaves pour travailler
                gratuitement dans l'entreprise.
              </div>

              {/* Liste des esclaves affectés */}
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase text-stone-400">
                  Affectés ({(myCompany.slaves || []).length})
                </div>
                {(myCompany.slaves || []).map((slaveId) => {
                  const slave = citizens.find((c) => c.id === slaveId);
                  return (
                    <div
                      key={slaveId}
                      className="flex justify-between items-center bg-white p-2 rounded border border-stone-200"
                    >
                      <span className="font-bold text-stone-800 text-xs">
                        {slave ? slave.name : "Inconnu"}
                      </span>
                      <button
                        onClick={() =>
                          onCompanyHireFire(
                            myCompany.id,
                            slaveId,
                            "REMOVE_SLAVE"
                          )
                        }
                        className="text-red-500 font-bold text-[10px]"
                      >
                        Retirer
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Liste des esclaves disponibles */}
              <div className="space-y-2 pt-4 border-t border-stone-200">
                <div className="text-[10px] font-black uppercase text-stone-400">
                  Vos Esclaves Disponibles
                </div>
                {mySlaves.filter(
                  (s) => !(myCompany.slaves || []).includes(s.id)
                ).length === 0 && (
                  <div className="text-xs italic text-stone-400">
                    Aucun esclave disponible.
                  </div>
                )}
                {mySlaves
                  .filter((s) => !(myCompany.slaves || []).includes(s.id))
                  .map((slave) => (
                    <div
                      key={slave.id}
                      className="flex justify-between items-center bg-stone-50 p-2 rounded border border-stone-200"
                    >
                      <span className="font-bold text-stone-600 text-xs">
                        {slave.name}
                      </span>
                      <button
                        onClick={() =>
                          onCompanyHireFire(
                            myCompany.id,
                            slave.id,
                            "ASSIGN_SLAVE"
                          )
                        }
                        className="text-green-600 font-bold text-[10px]"
                      >
                        Affecter
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* --- ONGLET FINANCE --- */}
      {activeTab === "finance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Injection de Capital" icon={ArrowDownLeft}>
            <div className="space-y-4">
              <p className="text-xs text-stone-500">
                Transférez vos fonds personnels vers l'entreprise.
              </p>
              <div className="relative">
                <input
                  type="number"
                  className="w-full p-3 pl-4 bg-stone-50 border border-stone-300 rounded font-mono font-bold"
                  placeholder="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-stone-400">
                  ÉCUS
                </span>
              </div>
              <button
                onClick={() => {
                  onCompanyTreasury(myCompany.id, depositAmount, "DEPOSIT");
                  setDepositAmount("");
                }}
                className="w-full bg-stone-800 text-white py-3 rounded font-bold uppercase text-xs tracking-widest hover:bg-stone-700"
              >
                Déposer
              </button>
            </div>
          </Card>

          <Card title="Retrait de Dividendes" icon={ArrowUpRight}>
            <div className="space-y-4">
              <p className="text-xs text-stone-500">
                Récupérez les bénéfices vers votre compte personnel.
              </p>
              <div className="relative">
                <input
                  type="number"
                  className="w-full p-3 pl-4 bg-stone-50 border border-stone-300 rounded font-mono font-bold"
                  placeholder="0"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-stone-400">
                  ÉCUS
                </span>
              </div>
              <button
                onClick={() => {
                  onCompanyTreasury(myCompany.id, withdrawAmount, "WITHDRAW");
                  setWithdrawAmount("");
                }}
                className="w-full bg-stone-200 text-stone-800 py-3 rounded font-bold uppercase text-xs tracking-widest hover:bg-stone-300"
              >
                Retirer
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MyCompanyView;
