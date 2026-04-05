import React, { useState } from "react";
import {
  Briefcase,
  Building2,
  User,
  Globe,
  Plus,
  Pencil,
  X,
  Save,
  Snowflake,
  Play,
} from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";
import SecureDeleteButton from "../ui/SecureDeleteButton";

const CompaniesAdminView = ({
  companies,
  citizens,
  countries,
  onCreateCompany,
  onDeleteCompany,
  onEditCompany,
}) => {
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("SERVICE");
  const [newOwner, setNewOwner] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [startBalance, setStartBalance] = useState("1000");

  // État édition
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleCreate = () => {
    if (newName && newOwner) {
      onCreateCompany(newName, newType, newOwner, newCountry, startBalance);
      setNewName("");
      setNewOwner("");
    }
  };

  const startEdit = (comp) => {
    setEditingId(comp.id);
    setEditForm({
      name: comp.name || "",
      type: comp.type || "SERVICE",
      level: comp.level || 1,
      balance: comp.balance || 0,
      ownerId: comp.ownerId || "",
      countryId: comp.countryId || "",
      taxRate: comp.taxRate ?? 10,
      frozen: comp.frozen || false,
    });
  };

  const saveEdit = () => {
    if (editingId && onEditCompany) {
      onEditCompany(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const TYPE_LABELS = {
    SERVICE: "Services / Commerce",
    MANUFACTURE: "Manufacture / Artisanat",
    EXTRACTION: "Extraction / Ferme",
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
                    <option value="MANUFACTURE">
                      Manufacture / Artisanat
                    </option>
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
            <div className="space-y-3">
              {(companies || []).length === 0 && (
                <div className="p-6 text-center text-stone-400 italic">
                  Aucune entreprise enregistrée.
                </div>
              )}
              {(companies || []).map((comp) => {
                const owner = citizens.find((c) => c.id === comp.ownerId);
                const country = countries.find(
                  (c) => c.id === comp.countryId
                );
                const isEditing = editingId === comp.id;

                if (isEditing) {
                  return (
                    <div
                      key={comp.id}
                      className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5 space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-black text-stone-800 uppercase text-xs tracking-widest">
                          Modifier l'entreprise
                        </h3>
                        <button
                          onClick={cancelEdit}
                          className="text-stone-400 hover:text-stone-600"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">
                            Nom
                          </label>
                          <input
                            className="w-full p-2 border rounded text-sm font-bold"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">
                            Type
                          </label>
                          <select
                            className="w-full p-2 border rounded text-sm bg-white"
                            value={editForm.type}
                            onChange={(e) =>
                              setEditForm({ ...editForm, type: e.target.value })
                            }
                          >
                            <option value="SERVICE">Services</option>
                            <option value="MANUFACTURE">Manufacture</option>
                            <option value="EXTRACTION">Extraction</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">
                            Niveau
                          </label>
                          <input
                            type="number"
                            min="1"
                            className="w-full p-2 border rounded text-sm font-mono"
                            value={editForm.level}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                level: parseInt(e.target.value) || 1,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">
                            Trésorerie
                          </label>
                          <div className="w-full p-2 border rounded text-sm font-mono text-stone-400 bg-stone-50 cursor-not-allowed select-none">
                            {(editForm.balance || 0).toLocaleString()} Écus — frappe impériale
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">
                            Taxe (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-full p-2 border rounded text-sm font-mono"
                            value={editForm.taxRate}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                taxRate: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">
                            Propriétaire (PDG)
                          </label>
                          <UserSearchSelect
                            users={citizens}
                            onSelect={(id) =>
                              setEditForm({ ...editForm, ownerId: id })
                            }
                            value={editForm.ownerId}
                            placeholder="Choisir..."
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">
                            Juridiction
                          </label>
                          <select
                            className="w-full p-2 border rounded text-sm bg-white"
                            value={editForm.countryId}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                countryId: e.target.value,
                              })
                            }
                          >
                            <option value="">Territoire Impérial</option>
                            {countries.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.frozen}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                frozen: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          <span className="text-xs font-bold text-stone-600 flex items-center gap-1">
                            <Snowflake size={12} /> Entreprise gelée
                          </span>
                        </label>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-yellow-200">
                        <button
                          onClick={saveEdit}
                          className="flex-1 bg-stone-900 text-yellow-400 py-2.5 rounded font-black uppercase text-xs tracking-widest hover:bg-stone-700 flex items-center justify-center gap-2"
                        >
                          <Save size={14} /> Enregistrer
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2.5 border border-stone-300 rounded text-xs font-bold text-stone-500 hover:bg-stone-100"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={comp.id}
                    className={`bg-white border rounded-xl p-4 hover:shadow-md transition-shadow ${comp.frozen ? "border-blue-300 bg-blue-50/30" : "border-stone-200"}`}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: comp.color || "#8B5CF6",
                            }}
                          />
                          <h3 className="font-black text-stone-800 truncate">
                            {comp.name}
                          </h3>
                          <span className="bg-stone-200 px-2 py-0.5 rounded text-stone-600 font-bold text-[9px] uppercase">
                            {TYPE_LABELS[comp.type] || comp.type}
                          </span>
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[9px] font-bold">
                            Niv. {comp.level || 1}
                          </span>
                          {comp.frozen && (
                            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1">
                              <Snowflake size={10} /> Gelée
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
                          <span className="flex items-center gap-1">
                            <User size={11} />{" "}
                            {owner ? owner.name : "Inconnu"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe size={11} />{" "}
                            {country ? country.name : "Empire"}
                          </span>
                          <span className="font-mono font-bold text-stone-700">
                            {(comp.balance || 0).toLocaleString()} ¢
                          </span>
                          <span className="text-stone-400">
                            Taxe: {comp.taxRate ?? 10}%
                          </span>
                          <span className="text-stone-400">
                            {(comp.employees || []).length} emp.
                            {(comp.slaves || []).length > 0 &&
                              ` / ${(comp.slaves || []).length} esc.`}
                          </span>
                        </div>
                        {comp.motto && (
                          <div className="text-[10px] italic text-stone-400 mt-1">
                            "{comp.motto}"
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {onEditCompany && (
                          <button
                            onClick={() => startEdit(comp)}
                            className="flex items-center gap-1 bg-stone-100 text-stone-600 px-3 py-2 rounded text-[10px] font-bold hover:bg-stone-200 uppercase tracking-wide"
                          >
                            <Pencil size={12} /> Modifier
                          </button>
                        )}
                        {onEditCompany && (
                          <button
                            onClick={() =>
                              onEditCompany(comp.id, {
                                frozen: !comp.frozen,
                              })
                            }
                            className={`flex items-center gap-1 px-3 py-2 rounded text-[10px] font-bold uppercase tracking-wide ${
                              comp.frozen
                                ? "bg-green-100 text-green-600 hover:bg-green-200"
                                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                            }`}
                          >
                            {comp.frozen ? (
                              <>
                                <Play size={12} /> Dégeler
                              </>
                            ) : (
                              <>
                                <Snowflake size={12} /> Geler
                              </>
                            )}
                          </button>
                        )}
                        {onDeleteCompany && (
                          <SecureDeleteButton
                            onClick={() => onDeleteCompany(comp.id)}
                            label="Dissoudre"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompaniesAdminView;
