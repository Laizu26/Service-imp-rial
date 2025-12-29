import React, { useState } from "react";
import { Briefcase, Building2, User, Globe, Plus } from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";

const CompaniesAdminView = ({
  companies,
  citizens,
  countries,
  onCreateCompany,
}) => {
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("SERVICE");
  const [newOwner, setNewOwner] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [startBalance, setStartBalance] = useState("1000");

  const handleCreate = () => {
    if (newName && newOwner) {
      onCreateCompany(newName, newType, newOwner, newCountry, startBalance);
      setNewName("");
      setNewOwner("");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de Création (Charte) */}
        <div className="lg:col-span-1">
          <Card title="Délivrer une Charte" icon={Briefcase}>
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                  Nom de l'Entreprise
                </label>
                <input
                  className="w-full p-2 border rounded font-bold text-stone-800"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Compagnie des Indes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                    Type d'activité
                  </label>
                  <select
                    className="w-full p-2 border rounded text-sm bg-white"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    <option value="SERVICE">Services / Commerce</option>
                    <option value="MANUFACTURE">Manufacture / Artisanat</option>
                    <option value="EXTRACTION">Extraction / Ferme</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                    Fonds de départ
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded font-mono"
                    value={startBalance}
                    onChange={(e) => setStartBalance(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                  Propriétaire (PDG)
                </label>
                <UserSearchSelect
                  users={citizens}
                  onSelect={setNewOwner}
                  value={newOwner}
                  placeholder="Choisir un citoyen..."
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                  Juridiction (Pays)
                </label>
                <select
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                >
                  <option value="">-- Territoire Impérial --</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCreate}
                disabled={!newName || !newOwner}
                className="w-full bg-stone-900 text-yellow-500 py-3 rounded font-black uppercase text-xs tracking-widest hover:bg-stone-700 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Signer la Charte
              </button>
            </div>
          </Card>
        </div>

        {/* Liste des Entreprises */}
        <div className="lg:col-span-2">
          <Card title="Registre du Commerce" icon={Building2}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-100 text-stone-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Entreprise</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Propriétaire</th>
                    <th className="p-3">Localisation</th>
                    <th className="p-3 text-right">Trésorerie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(companies || []).length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-6 text-center text-stone-400 italic"
                      >
                        Aucune entreprise enregistrée.
                      </td>
                    </tr>
                  )}
                  {(companies || []).map((comp) => {
                    const owner = citizens.find((c) => c.id === comp.ownerId);
                    const country = countries.find(
                      (c) => c.id === comp.countryId
                    );
                    return (
                      <tr key={comp.id} className="hover:bg-stone-50">
                        <td className="p-3 font-bold text-stone-800">
                          {comp.name}
                        </td>
                        <td className="p-3 text-xs">
                          <span className="bg-stone-200 px-2 py-1 rounded text-stone-600 font-bold text-[9px] uppercase">
                            {comp.type}
                          </span>
                        </td>
                        <td className="p-3 flex items-center gap-2">
                          <User size={12} className="text-stone-400" />{" "}
                          {owner ? owner.name : "Inconnu"}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-stone-500">
                            <Globe size={12} />{" "}
                            {country ? country.name : "Empire"}
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-stone-700">
                          {comp.balance?.toLocaleString()} ¢
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompaniesAdminView;
