import React, { useState, useMemo } from "react";
import { Plus, MapPin, Pencil, X, Save, Home, User, Globe, Key, UserX } from "lucide-react";
import Card from "../ui/Card";
import SecureDeleteButton from "../ui/SecureDeleteButton";
import UserSearchSelect from "../ui/UserSearchSelect";

const PROPERTY_TYPES = {
  MAISON: "Maison",
  DOMAINE: "Domaine",
  TERRAIN: "Terrain",
  COMMERCE: "Local Commercial",
  FERME: "Ferme",
  MANOIR: "Manoir / Château",
  ATELIER: "Atelier",
};

const PropertiesAdminView = ({
  properties = [],
  countries = [],
  citizens = [],
  onCreateProperty,
  onDeleteProperty,
  onEditProperty,
}) => {
  // Création
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("MAISON");
  const [newCountryId, setNewCountryId] = useState("");
  const [newRegionId, setNewRegionId] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newIncome, setNewIncome] = useState("0");
  const [newDescription, setNewDescription] = useState("");

  // Édition
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Régions du pays sélectionné (création)
  const newRegions = useMemo(() => {
    const c = countries.find((c) => c.id === newCountryId);
    return c?.regions || [];
  }, [countries, newCountryId]);

  // Régions du pays sélectionné (édition)
  const editRegions = useMemo(() => {
    if (!editForm.countryId) return [];
    const c = countries.find((c) => c.id === editForm.countryId);
    return c?.regions || [];
  }, [countries, editForm.countryId]);

  // Helper pour obtenir le nom de localisation
  const getLocationLabel = (prop) => {
    const country = countries.find((c) => c.id === prop.countryId);
    if (!country) return prop.location || "—";
    const region = (country.regions || []).find((r) => r.id === prop.regionId);
    return region ? `${region.name}, ${country.name}` : country.name;
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateProperty({
      name: newName.trim(),
      type: newType,
      description: newDescription.trim(),
      price: parseInt(newPrice) || 0,
      income: parseInt(newIncome) || 0,
      countryId: newCountryId || null,
      regionId: newRegionId || null,
      location: (() => {
        const c = countries.find((c) => c.id === newCountryId);
        if (!c) return "";
        const r = (c.regions || []).find((r) => r.id === newRegionId);
        return r ? `${r.name}, ${c.name}` : c.name;
      })(),
    });
    setNewName("");
    setNewType("MAISON");
    setNewCountryId("");
    setNewRegionId("");
    setNewPrice("");
    setNewIncome("0");
    setNewDescription("");
  };

  const startEdit = (prop) => {
    setEditingId(prop.id);
    setEditForm({
      name: prop.name || "",
      type: prop.type || "MAISON",
      description: prop.description || "",
      price: prop.price || 0,
      income: prop.income || 0,
      countryId: prop.countryId || "",
      regionId: prop.regionId || "",
      ownerId: prop.ownerId || "",
    });
  };

  const saveEdit = () => {
    const country = countries.find((c) => c.id === editForm.countryId);
    const region = country ? (country.regions || []).find((r) => r.id === editForm.regionId) : null;
    const newOwner = editForm.ownerId ? citizens.find((c) => c.id === editForm.ownerId) : null;
    onEditProperty(editingId, {
      ...editForm,
      price: parseInt(editForm.price) || 0,
      income: parseInt(editForm.income) || 0,
      ownerId: editForm.ownerId || null,
      ownerName: newOwner ? newOwner.name : null,
      location: country ? (region ? `${region.name}, ${country.name}` : country.name) : "",
    });
    setEditingId(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de création */}
        <div className="lg:col-span-1">
          <Card title="Enregistrer un Bien" icon={Home}>
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                  Nom du bien
                </label>
                <input
                  className="w-full p-2 border rounded font-bold text-stone-800"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Villa des Orangers..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                    Type de bien
                  </label>
                  <select
                    className="w-full p-2 border rounded text-sm bg-white"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    {Object.entries(PROPERTY_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                    Prix d'achat (Écus)
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded font-mono"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                  Pays
                </label>
                <select
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newCountryId}
                  onChange={(e) => { setNewCountryId(e.target.value); setNewRegionId(""); }}
                >
                  <option value="">-- Sélectionner un pays --</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {newRegions.length > 0 && (
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                    Région
                  </label>
                  <select
                    className="w-full p-2 border rounded text-sm bg-white"
                    value={newRegionId}
                    onChange={(e) => setNewRegionId(e.target.value)}
                  >
                    <option value="">-- Toute la juridiction --</option>
                    {newRegions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                  Revenu journalier (Écus / jour RP)
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded font-mono"
                  value={newIncome}
                  onChange={(e) => setNewIncome(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                  Description
                </label>
                <textarea
                  className="w-full p-2 border rounded text-sm text-stone-800"
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description du bien immobilier..."
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="w-full bg-stone-900 text-yellow-500 py-3 rounded font-black uppercase text-xs tracking-widest hover:bg-stone-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus size={14} /> Enregistrer le Bien
              </button>
            </div>
          </Card>
        </div>

        {/* Liste des propriétés */}
        <div className="lg:col-span-2">
          <Card title="Registre Foncier" icon={MapPin}>
            <div className="space-y-3">
              {properties.length === 0 && (
                <div className="p-6 text-center text-stone-400 italic">
                  Aucun bien immobilier enregistré.
                </div>
              )}
              {properties.map((prop) => {
                const owner = citizens.find((c) => c.id === prop.ownerId);
                const isEditing = editingId === prop.id;

                if (isEditing) {
                  return (
                    <div
                      key={prop.id}
                      className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5 space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-black text-stone-800 uppercase text-xs tracking-widest">
                          Modifier le bien
                        </h3>
                        <button onClick={cancelEdit} className="text-stone-400 hover:text-stone-600">
                          <X size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Nom</label>
                          <input
                            className="w-full p-2 border rounded text-sm"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Type</label>
                          <select
                            className="w-full p-2 border rounded text-sm bg-white"
                            value={editForm.type}
                            onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          >
                            {Object.entries(PROPERTY_TYPES).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Prix</label>
                          <input
                            type="number"
                            className="w-full p-2 border rounded font-mono text-sm"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Revenu / jour</label>
                          <input
                            type="number"
                            className="w-full p-2 border rounded font-mono text-sm"
                            value={editForm.income}
                            onChange={(e) => setEditForm({ ...editForm, income: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Pays</label>
                          <select
                            className="w-full p-2 border rounded text-sm bg-white"
                            value={editForm.countryId}
                            onChange={(e) => setEditForm({ ...editForm, countryId: e.target.value, regionId: "" })}
                          >
                            <option value="">-- Aucun --</option>
                            {countries.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        {editRegions.length > 0 && (
                          <div>
                            <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Région</label>
                            <select
                              className="w-full p-2 border rounded text-sm bg-white"
                              value={editForm.regionId}
                              onChange={(e) => setEditForm({ ...editForm, regionId: e.target.value })}
                            >
                              <option value="">-- Toute la juridiction --</option>
                              {editRegions.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Propriétaire</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <UserSearchSelect
                              users={citizens}
                              onSelect={(id) => setEditForm({ ...editForm, ownerId: id })}
                              value={editForm.ownerId}
                              placeholder="Aucun (disponible à l'achat)"
                            />
                          </div>
                          {editForm.ownerId && (
                            <button
                              onClick={() => setEditForm({ ...editForm, ownerId: "" })}
                              className="text-red-400 hover:text-red-600 p-1"
                              title="Retirer le propriétaire"
                            >
                              <UserX size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Description</label>
                        <textarea
                          className="w-full p-2 border rounded text-sm"
                          rows={2}
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="bg-stone-900 text-yellow-500 px-4 py-2 rounded font-bold text-xs uppercase flex items-center gap-1 hover:bg-stone-700"
                        >
                          <Save size={14} /> Sauvegarder
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-stone-200 text-stone-600 px-4 py-2 rounded font-bold text-xs uppercase hover:bg-stone-300"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={prop.id}
                    className="bg-white border border-stone-200 rounded-xl p-4 flex items-start justify-between gap-3 hover:border-stone-400 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-stone-800">{prop.name}</span>
                        <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                          {PROPERTY_TYPES[prop.type] || prop.type || "Bien"}
                        </span>
                        <span className="font-mono text-yellow-700 text-sm font-bold">
                          {prop.price} Écus
                        </span>
                      </div>

                      {prop.description && (
                        <p className="text-xs text-stone-500 mt-1">{prop.description}</p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-[10px] text-stone-400">
                        <span className="flex items-center gap-1">
                          <Globe size={10} /> {getLocationLabel(prop)}
                        </span>
                        {(prop.income || 0) > 0 && (
                          <span className="text-green-600 font-mono font-bold">
                            +{prop.income} Écus/jour
                          </span>
                        )}
                      </div>

                      {/* Propriétaire */}
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <Key size={11} className="text-stone-400" />
                        {owner ? (
                          <span className="font-bold text-stone-700">{owner.name}</span>
                        ) : prop.ownerId ? (
                          <span className="text-stone-400">{prop.ownerName}</span>
                        ) : (
                          <span className="italic text-stone-400">Aucun propriétaire — Disponible</span>
                        )}
                        {prop.forSale && (
                          <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                            En vente {prop.salePrice} Écus
                          </span>
                        )}
                        {prop.rental && !prop.rental.tenantId && (
                          <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                            En location {prop.rental.dailyRate} Écus/jour
                          </span>
                        )}
                      </div>

                      {/* Locataire */}
                      {prop.rental && prop.rental.tenantId && (() => {
                        const tenant = citizens.find((c) => c.id === prop.rental.tenantId);
                        return (
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <User size={11} className="text-blue-500" />
                            <span className="text-blue-700 font-bold">
                              Locataire : {tenant ? tenant.name : prop.rental.tenantName}
                            </span>
                            <span className="font-mono text-blue-500">{prop.rental.dailyRate} Écus/jour</span>
                            {prop.rental.startDate && (
                              <span className="text-stone-400">depuis le {prop.rental.startDate}</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(prop)}
                        className="text-stone-400 hover:text-stone-700 p-1.5 rounded hover:bg-stone-100"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      <SecureDeleteButton
                        onClick={() => onDeleteProperty(prop.id)}
                      />
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

export default PropertiesAdminView;
