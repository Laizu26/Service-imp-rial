import React, { useState } from "react";
import { Save, Trash2, MapPin, ImageIcon, Star, Users } from "lucide-react";
import UserSearchSelect from "../ui/UserSearchSelect";

const MaisonDeAsiaAdmin = ({
  citizens,
  countries,
  houseRegistry,
  onUpdateRegistry,
}) => {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [formData, setFormData] = useState({
    citizenId: "",
    description: "",
    images: "",
    price: 0,
    specialties: "",
    status: "Disponible",
  });

  const linkedCitizen = citizens.find((c) => c.id === formData.citizenId);
  const locationName = linkedCitizen
    ? countries.find((c) => c.id === linkedCitizen.countryId)?.name
    : "Inconnu";

  const handleSave = () => {
    if (!formData.citizenId) return;
    const newEntry = {
      id: selectedEntry ? selectedEntry.id : Date.now(),
      ...formData,
      images: formData.images.split("\n").filter((url) => url.length > 5),
    };
    let newRegistry;
    if (selectedEntry) {
      newRegistry = houseRegistry.map((item) =>
        item.id === selectedEntry.id ? newEntry : item
      );
    } else {
      newRegistry = [...houseRegistry, newEntry];
    }
    onUpdateRegistry(newRegistry);
    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm("Retirer ce membre ?")) {
      onUpdateRegistry(houseRegistry.filter((item) => item.id !== id));
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedEntry(null);
    setFormData({
      citizenId: "",
      description: "",
      images: "",
      price: 0,
      specialties: "",
      status: "Disponible",
    });
  };

  const loadEntry = (entry) => {
    setSelectedEntry(entry);
    setFormData({
      ...entry,
      images: Array.isArray(entry.images)
        ? entry.images.join("\n")
        : entry.images,
    });
  };

  return (
    <div className="flex h-full gap-6 font-sans">
      <div className="w-1/3 bg-[#fdf6e3] rounded-xl border border-stone-300 flex flex-col overflow-hidden shadow-md">
        <div className="p-4 bg-stone-100 border-b font-bold uppercase text-[11px] tracking-[0.2em] text-stone-500 flex justify-between items-center">
          <span>Effectif</span>
          <button
            onClick={resetForm}
            className="bg-stone-800 text-white px-2 py-1 rounded"
          >
            + Nouveau
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {houseRegistry.map((entry) => {
            const cit = citizens.find((c) => c.id === entry.citizenId);
            if (!cit) return null;
            return (
              <div
                key={entry.id}
                onClick={() => loadEntry(entry)}
                className="p-3 border rounded-lg cursor-pointer bg-white hover:bg-stone-50"
              >
                <div className="font-bold text-xs uppercase">{cit.name}</div>
                <div className="text-[10px] opacity-70">{entry.status}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex-1 bg-white p-6 rounded-xl border border-stone-200 shadow-xl overflow-y-auto">
        <h2 className="text-xl font-black uppercase text-stone-800 mb-6 flex items-center gap-2">
          <Star className="text-yellow-600" /> Fiche Membre
        </h2>
        <div className="space-y-4 max-w-xl">
          <UserSearchSelect
            users={citizens}
            value={formData.citizenId}
            onSelect={(id) => setFormData({ ...formData, citizenId: id })}
            placeholder="Rechercher..."
          />
          {linkedCitizen && (
            <div className="text-xs bg-yellow-50 p-2 border border-yellow-200">
              Actuellement à : {locationName}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Prix"
              className="p-2 border rounded"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: parseInt(e.target.value) })
              }
            />
            <select
              className="p-2 border rounded"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option>Disponible</option>
              <option>Occupé</option>
              <option>Repos</option>
            </select>
          </div>
          <input
            className="w-full p-2 border rounded"
            placeholder="Spécialités"
            value={formData.specialties}
            onChange={(e) =>
              setFormData({ ...formData, specialties: e.target.value })
            }
          />
          <textarea
            className="w-full p-2 border rounded h-20"
            placeholder="URLs images (une par ligne)"
            value={formData.images}
            onChange={(e) =>
              setFormData({ ...formData, images: e.target.value })
            }
          />
          <textarea
            className="w-full p-2 border rounded h-20"
            placeholder="Description publique..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <button
            onClick={handleSave}
            className="w-full bg-stone-900 text-yellow-500 py-3 rounded font-bold uppercase"
          >
            Enregistrer
          </button>
          {selectedEntry && (
            <button
              onClick={() => handleDelete(selectedEntry.id)}
              className="w-full mt-2 text-red-500 text-xs uppercase"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default MaisonDeAsiaAdmin;
