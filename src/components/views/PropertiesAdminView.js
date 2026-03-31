import React, { useState } from "react";
import { Plus, Trash2, Edit3, MapPin, Check, X } from "lucide-react";

export default function PropertiesAdminView({
  properties = [],
  onCreateProperty,
  onDeleteProperty,
  onEditProperty,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreateProperty({ name: name.trim(), description: description.trim(), price, location: location.trim() });
    setName("");
    setDescription("");
    setPrice("");
    setLocation("");
  };

  const startEdit = (prop) => {
    setEditingId(prop.id);
    setEditForm({ name: prop.name, description: prop.description || "", price: prop.price, location: prop.location || "" });
  };

  const saveEdit = () => {
    onEditProperty(editingId, {
      name: editForm.name,
      description: editForm.description,
      price: parseInt(editForm.price) || 0,
      location: editForm.location,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <MapPin size={20} /> Gestion Immobilière
      </h2>

      {/* Formulaire de création */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-sm text-amber-300">Nouvelle propriété</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm"
            placeholder="Nom de la propriété"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm"
            placeholder="Localisation"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <input
            className="bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm"
            placeholder="Prix (Écus)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <textarea
          className="w-full bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm"
          placeholder="Description (optionnel)"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded"
        >
          <Plus size={14} /> Créer la propriété
        </button>
      </div>

      {/* Liste des propriétés */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-amber-300">
          Propriétés existantes ({properties.length})
        </h3>
        {properties.length === 0 && (
          <p className="text-white/40 text-sm italic">Aucune propriété créée.</p>
        )}
        {properties.map((prop) => (
          <div
            key={prop.id}
            className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-start justify-between gap-3"
          >
            {editingId === prop.id ? (
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                  <input
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  />
                  <input
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  />
                </div>
                <textarea
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1">
                    <Check size={14} /> Sauvegarder
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
                    <X size={14} /> Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{prop.name}</span>
                  {prop.location && (
                    <span className="text-xs text-white/50">({prop.location})</span>
                  )}
                  <span className="text-xs bg-amber-600/30 text-amber-300 px-1.5 py-0.5 rounded">
                    {prop.price} Écus
                  </span>
                </div>
                {prop.description && (
                  <p className="text-xs text-white/60 mt-1">{prop.description}</p>
                )}
                <p className="text-xs text-white/40 mt-1">
                  {prop.ownerId
                    ? `Propriétaire : ${prop.ownerName}${prop.forSale ? ` (en vente : ${prop.salePrice} Écus)` : ""}`
                    : "Disponible à l'achat"}
                </p>
              </div>
            )}
            <div className="flex gap-1">
              {editingId !== prop.id && (
                <button
                  onClick={() => startEdit(prop)}
                  className="text-blue-400 hover:text-blue-300 p-1"
                  title="Modifier"
                >
                  <Edit3 size={14} />
                </button>
              )}
              <button
                onClick={() => onDeleteProperty(prop.id)}
                className="text-red-400 hover:text-red-300 p-1"
                title="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
