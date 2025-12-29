import React, { useState, useMemo } from "react";
import {
  Box,
  Plus,
  Eye,
  EyeOff,
  Search,
  Filter,
  Trash2,
  Save,
  X,
  PackageOpen,
  Tag,
  Scale,
  Coins,
  ImageIcon,
} from "lucide-react";
import Card from "../ui/Card";
import SecureDeleteButton from "../ui/SecureDeleteButton";
import { ROLES } from "../../lib/constants";

// Helper pour les couleurs de rareté
const getRarityColor = (rarity) => {
  switch (rarity) {
    case "Commun":
      return "border-stone-300 bg-stone-100 text-stone-600";
    case "Atypique":
      return "border-green-300 bg-green-50 text-green-700";
    case "Rare":
      return "border-blue-300 bg-blue-50 text-blue-700";
    case "Épique":
      return "border-purple-300 bg-purple-50 text-purple-700";
    case "Légendaire":
      return "border-yellow-400 bg-yellow-50 text-yellow-800";
    case "Unique":
      return "border-red-400 bg-red-50 text-red-800";
    default:
      return "border-stone-200 bg-white text-stone-500";
  }
};

const InventoryView = ({ items, onUpdate, session, roleInfo }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRarity, setFilterRarity] = useState("ALL");

  const canEdit = (ROLES[session?.role]?.level || 0) >= 90;
  const safeItems = Array.isArray(items) ? items : [];

  const selected = safeItems.find((i) => i.id === selectedId);

  // Filtrage
  const filteredItems = useMemo(() => {
    return safeItems.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRarity =
        filterRarity === "ALL" || item.rarity === filterRarity;
      return matchSearch && matchRarity;
    });
  }, [safeItems, searchTerm, filterRarity]);

  // Actions
  const handleCreate = () => {
    const newId = "i" + Date.now();
    const newItem = {
      id: newId,
      name: "Nouvel Objet",
      description: "Description...",
      rarity: "Commun",
      price: 10,
      weight: 0.1,
      type: "Divers",
      imageUrl: "",
      hidden: true,
    };
    onUpdate([...safeItems, newItem]);
    setSelectedId(newId);
    setEditForm(newItem);
  };

  const handleSave = () => {
    if (!editForm) return;
    const updatedItems = safeItems.map((i) =>
      i.id === editForm.id ? editForm : i
    );
    onUpdate(updatedItems);
    setEditForm(null);
  };

  return (
    <div className="flex flex-col h-full font-sans gap-4">
      {/* HEADER & FILTRES */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-stone-100 p-4 rounded-xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-stone-800 flex items-center gap-2">
            <PackageOpen size={24} className="text-yellow-600" /> Catalogue
            Impérial
          </h2>
          <p className="text-[10px] uppercase text-stone-500 font-bold mt-1 ml-1">
            {filteredItems.length} Artefacts répertoriés
          </p>
        </div>

        <div className="flex gap-2 flex-1 w-full md:w-auto justify-end">
          <div className="relative flex-1 max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold outline-none focus:border-stone-500"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold outline-none"
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value)}
          >
            <option value="ALL">Toutes Raretés</option>
            <option value="Commun">Commun</option>
            <option value="Atypique">Atypique</option>
            <option value="Rare">Rare</option>
            <option value="Épique">Épique</option>
            <option value="Légendaire">Légendaire</option>
          </select>
          {canEdit && (
            <button
              onClick={handleCreate}
              className="bg-stone-900 text-white px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2 hover:bg-stone-700 transition-all shadow-lg"
            >
              <Plus size={14} /> Créer
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-6">
        {/* GRILLE D'OBJETS (GAUCHE) */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  setEditForm(null);
                }}
                className={`group relative p-3 rounded-xl border-2 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg bg-white flex gap-3 items-center ${
                  selectedId === item.id
                    ? "border-stone-800 ring-2 ring-stone-200"
                    : "border-stone-100 hover:border-stone-300"
                }`}
              >
                {/* Image Miniature */}
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden border flex-shrink-0 ${getRarityColor(
                    item.rarity
                  )}`}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <Box size={20} className="opacity-50" />
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-stone-800 text-sm truncate flex items-center gap-2">
                    {item.name}
                    {item.hidden && (
                      <EyeOff size={10} className="text-red-400" />
                    )}
                  </div>
                  <div className="text-[9px] uppercase font-black text-stone-400 tracking-wider flex items-center gap-1">
                    <Tag size={8} /> {item.type}
                  </div>
                  <div className="text-[10px] font-bold text-yellow-700 mt-0.5">
                    {item.price} ¢
                  </div>
                </div>

                {/* Badge Rareté (visible au hover) */}
                <div
                  className={`absolute top-2 right-2 w-2 h-2 rounded-full ${getRarityColor(
                    item.rarity
                  )
                    .split(" ")[1]
                    .replace("bg-", "bg-")}`}
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* PANNEAU DÉTAIL / ÉDITION (DROITE) */}
        {(selected || editForm) && (
          <div className="w-full md:w-[400px] bg-white border border-stone-200 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Image Header */}
            <div className="h-48 bg-stone-100 relative group overflow-hidden">
              {(editForm || selected).imageUrl ? (
                <img
                  src={(editForm || selected).imageUrl}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
                  <ImageIcon size={64} />
                </div>
              )}
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                {canEdit && !editForm && (
                  <button
                    onClick={() => setEditForm({ ...selected })}
                    className="bg-white text-stone-900 px-4 py-2 rounded-full font-bold text-xs uppercase hover:scale-105 transition-transform"
                  >
                    Modifier
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedId(null);
                  setEditForm(null);
                }}
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/50 text-white p-1 rounded-full backdrop-blur-md"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenu Formulaire ou Détail */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {editForm ? (
                /* MODE ÉDITION */
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">
                      Nom de l'objet
                    </label>
                    <input
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded font-bold text-sm focus:border-stone-800 outline-none"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">
                        Type
                      </label>
                      <input
                        className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-xs font-bold outline-none"
                        value={editForm.type}
                        onChange={(e) =>
                          setEditForm({ ...editForm, type: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">
                        Rareté
                      </label>
                      <select
                        className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-xs font-bold outline-none"
                        value={editForm.rarity}
                        onChange={(e) =>
                          setEditForm({ ...editForm, rarity: e.target.value })
                        }
                      >
                        <option>Commun</option>
                        <option>Atypique</option>
                        <option>Rare</option>
                        <option>Épique</option>
                        <option>Légendaire</option>
                        <option>Unique</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">
                        Prix
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-xs font-bold outline-none"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              price: parseInt(e.target.value),
                            })
                          }
                        />
                        <Coins
                          size={12}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">
                        Poids (kg)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-xs font-bold outline-none"
                          value={editForm.weight}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              weight: parseFloat(e.target.value),
                            })
                          }
                        />
                        <Scale
                          size={12}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">
                      Image URL
                    </label>
                    <input
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-xs text-stone-600 outline-none"
                      value={editForm.imageUrl}
                      onChange={(e) =>
                        setEditForm({ ...editForm, imageUrl: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-sm italic min-h-[100px] outline-none"
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                    <input
                      type="checkbox"
                      id="hidden"
                      checked={editForm.hidden}
                      onChange={(e) =>
                        setEditForm({ ...editForm, hidden: e.target.checked })
                      }
                      className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                    />
                    <label
                      htmlFor="hidden"
                      className="text-xs font-bold text-stone-600"
                    >
                      Cacher du marché public
                    </label>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => setEditForm(null)}
                      className="flex-1 py-3 text-xs font-bold uppercase text-stone-500 hover:bg-stone-50 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 py-3 bg-stone-900 text-white text-xs font-black uppercase rounded-lg hover:bg-stone-700 shadow-lg flex items-center justify-center gap-2"
                    >
                      <Save size={14} /> Sauvegarder
                    </button>
                  </div>
                </div>
              ) : (
                /* MODE LECTURE */
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-black font-serif text-stone-900 uppercase leading-none mb-2">
                      {selected.name}
                    </h3>
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${getRarityColor(
                        selected.rarity
                      )}`}
                    >
                      {selected.rarity}
                    </div>
                    {selected.hidden && (
                      <span className="ml-2 text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-2 py-1 rounded border border-red-100">
                        Caché
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <div className="text-center">
                      <div className="text-[9px] uppercase font-black text-stone-400">
                        Type
                      </div>
                      <div className="font-bold text-stone-700 text-xs mt-1">
                        {selected.type}
                      </div>
                    </div>
                    <div className="text-center border-l border-stone-200">
                      <div className="text-[9px] uppercase font-black text-stone-400">
                        Poids
                      </div>
                      <div className="font-bold text-stone-700 text-xs mt-1">
                        {selected.weight || 0} kg
                      </div>
                    </div>
                    <div className="text-center border-l border-stone-200">
                      <div className="text-[9px] uppercase font-black text-stone-400">
                        Prix
                      </div>
                      <div className="font-black text-yellow-600 text-xs mt-1">
                        {selected.price} ¢
                      </div>
                    </div>
                  </div>

                  <div className="prose prose-sm">
                    <p className="italic text-stone-600 text-sm leading-relaxed border-l-4 border-stone-200 pl-4">
                      {selected.description ||
                        "Aucune description disponible pour cet artefact."}
                    </p>
                  </div>

                  {canEdit && (
                    <div className="pt-10 mt-auto border-t border-stone-100">
                      <SecureDeleteButton
                        onClick={() => {
                          onUpdate(
                            safeItems.filter((x) => x.id !== selected.id)
                          );
                          setSelectedId(null);
                        }}
                        label="Détruire cet objet"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryView;
