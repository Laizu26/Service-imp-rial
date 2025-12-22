import React, { useState } from "react";
import {
  Box,
  Plus,
  EyeOff,
  ArrowLeft,
  ShoppingBag,
  Gift,
  Eye,
} from "lucide-react";
import Card from "../ui/Card";
import SecureDeleteButton from "../ui/SecureDeleteButton";
import { ROLES } from "../../lib/constants";

const InventoryView = ({ items, onUpdate, session, roleInfo }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const canEdit = (ROLES[session?.role]?.level || 0) >= 90;
  const safeItems = Array.isArray(items) ? items : [];
  const selected = safeItems.find((i) => i.id === selectedId);

  const handleSave = () => {
    if (!editForm) return;
    const updatedItems = safeItems.map((i) =>
      i.id === editForm.id ? editForm : i
    );
    onUpdate(updatedItems);
    setEditForm(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 font-sans">
      <div
        className={`w-full md:w-1/3 bg-[#fdf6e3] rounded-2xl border border-stone-300 flex flex-col shadow-md overflow-hidden ${
          selected ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 bg-stone-100 border-b flex justify-between items-center font-bold uppercase text-[11px] tracking-[0.2em] text-stone-500 font-sans">
          <span className="flex items-center gap-2">
            <Box size={14} /> Catalogue Impérial
          </span>
          {canEdit && (
            <button
              onClick={() => {
                const newId = "i" + Date.now();
                onUpdate([
                  ...safeItems,
                  {
                    id: newId,
                    name: "Nouvel Artefact",
                    description: "...",
                    rarity: "Commun",
                    price: 0,
                    weight: 0,
                    type: "Divers",
                    imageUrl: "",
                    hidden: false,
                  },
                ]);
                setSelectedId(newId);
              }}
              className="bg-stone-800 text-white p-1 rounded-lg hover:bg-stone-700 transition-all shadow-sm"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {safeItems.map((i) => (
            <div
              key={i.id}
              onClick={() => {
                setSelectedId(i.id);
                setEditForm(null);
              }}
              className={`p-4 rounded-xl border flex justify-between items-center transition-all cursor-pointer ${
                selectedId === i.id
                  ? "bg-stone-800 text-white shadow-xl border-stone-900 translate-x-1"
                  : "bg-white hover:border-stone-400 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {i.imageUrl ? (
                  <img
                    src={i.imageUrl}
                    className="w-8 h-8 rounded object-cover border border-stone-200"
                    alt=""
                    onError={(e) => (e.target.style.display = "none")}
                  />
                ) : (
                  <Box size={24} className="opacity-30 flex-shrink-0" />
                )}
                <div className="overflow-hidden">
                  <div className="font-bold text-sm uppercase truncate flex items-center gap-2">
                    {i.name}
                    {i.hidden && (
                      <EyeOff size={10} className="text-stone-400" />
                    )}
                  </div>
                  <div className="text-[9px] uppercase opacity-70 tracking-widest mt-1 font-bold font-sans">
                    {i.rarity} — {i.type}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 font-sans">
                <div className="font-bold text-yellow-700 text-xs">
                  {i.price} Écus
                </div>
                {canEdit && (
                  <SecureDeleteButton
                    onClick={() =>
                      onUpdate(safeItems.filter((x) => x.id !== i.id))
                    }
                    className="p-1 shadow-none"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className={`flex-1 bg-[#fdf6e3] rounded-xl border border-stone-300 p-6 md:p-10 overflow-auto relative shadow-inner font-sans ${
          selected ? "flex flex-col" : "hidden md:flex flex-col"
        }`}
      >
        <button
          onClick={() => {
            setSelectedId(null);
            setEditForm(null);
          }}
          className="md:hidden flex items-center gap-2 text-stone-500 font-bold uppercase text-[10px] mb-8 border-b-2 border-stone-200 pb-3 font-sans"
        >
          <ArrowLeft size={16} /> Retour au Catalogue
        </button>
        {selected || editForm ? (
          <div className="max-w-2xl mx-auto w-full font-serif animate-fadeIn">
            <div className="flex justify-between items-start mb-10 border-b-4 border-stone-800 pb-6 font-serif">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-4 text-stone-900">
                {(editForm || selected).imageUrl ? (
                  <img
                    src={(editForm || selected).imageUrl}
                    className="w-16 h-16 rounded-lg object-cover border-2 border-stone-800 shadow-md"
                    alt=""
                  />
                ) : (
                  <Box size={40} className="text-yellow-700" />
                )}
                {(editForm || selected).name}
              </h2>
              <div className="flex gap-3">
                {canEdit && !editForm && (
                  <button
                    onClick={() => setEditForm({ ...selected })}
                    className="bg-white border-2 border-stone-300 px-6 py-2 rounded-lg text-[10px] font-bold uppercase shadow-sm hover:bg-stone-50"
                  >
                    Modifier
                  </button>
                )}
                {editForm && (
                  <>
                    <button
                      onClick={() => setEditForm(null)}
                      className="text-stone-500 font-bold uppercase text-[10px] px-4 hover:text-red-500"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      className="bg-stone-800 text-white px-6 py-2 rounded-lg text-[10px] font-bold uppercase shadow-lg hover:bg-green-700"
                    >
                      Enregistrer
                    </button>
                  </>
                )}
              </div>
            </div>

            {editForm ? (
              <div className="space-y-6 bg-white p-6 rounded-xl border border-stone-200 shadow-sm font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                      Nom de l'objet
                    </label>
                    <input
                      className="w-full p-2 border rounded font-bold"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                      Type
                    </label>
                    <input
                      className="w-full p-2 border rounded font-bold"
                      value={editForm.type}
                      onChange={(e) =>
                        setEditForm({ ...editForm, type: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                      Rareté
                    </label>
                    <select
                      className="w-full p-2 border rounded font-bold bg-white"
                      value={editForm.rarity}
                      onChange={(e) =>
                        setEditForm({ ...editForm, rarity: e.target.value })
                      }
                    >
                      <option>Commun</option>
                      <option>Rare</option>
                      <option>Épique</option>
                      <option>Légendaire</option>
                      <option>Unique</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                      Prix (Écus)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded font-bold"
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          price: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                      Poids (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-2 border rounded font-bold"
                      value={editForm.weight || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          weight: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                      Image (URL)
                    </label>
                    <input
                      className="w-full p-2 border rounded text-xs"
                      value={editForm.imageUrl || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, imageUrl: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full p-2 border rounded text-sm italic min-h-[80px]"
                      value={editForm.description || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2 pt-4 border-t mt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-gray-300 text-stone-800 focus:ring-stone-800"
                        checked={editForm.hidden || false}
                        onChange={(e) =>
                          setEditForm({ ...editForm, hidden: e.target.checked })
                        }
                      />
                      <span className="font-bold text-stone-700 group-hover:text-red-600 transition-colors flex items-center gap-2">
                        <EyeOff size={16} /> Retirer du Marché Public (Caché)
                      </span>
                    </label>
                    <p className="text-[10px] text-stone-400 mt-1 ml-8">
                      Si coché, cet objet ne sera pas visible pour les citoyens
                      dans le marché.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 font-sans">
                <Card title="Détails de l'Objet">
                  <div className="p-6 bg-white/50 rounded-xl space-y-4 font-sans relative">
                    {selected.hidden && (
                      <div className="absolute top-4 right-4 bg-red-100 text-red-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <EyeOff size={12} /> Non Listé
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        {" "}
                        <span className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                          Type
                        </span>
                        <span className="font-bold text-stone-800">
                          {selected.type}
                        </span>
                      </div>
                      <div>
                        {" "}
                        <span className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                          Valeur
                        </span>
                        <span className="font-bold text-yellow-700">
                          {selected.price} Écus
                        </span>
                      </div>
                      <div>
                        {" "}
                        <span className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                          Poids
                        </span>
                        <span className="font-bold text-stone-600">
                          {selected.weight || 0} kg
                        </span>
                      </div>
                      <div>
                        {" "}
                        <span className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                          Rareté
                        </span>
                        <span className="font-bold text-stone-800">
                          {selected.rarity}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 p-6 bg-white border border-stone-200 rounded-lg italic font-serif text-stone-700 leading-relaxed">
                      "{selected.description || "Aucune archive."}"
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-stone-300 italic flex-col gap-8 font-serif uppercase tracking-widest">
            <Box size={100} className="opacity-10 animate-bounce" />
            <p className="text-2xl tracking-[0.4em] opacity-30">
              Archives d'Objets
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryView;
