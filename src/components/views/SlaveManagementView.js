import React, { useState } from "react";
import {
  User,
  Unlock,
  Coins,
  Hand,
  Box,
  Mail,
  Globe,
  Shield,
  Lock,
  Eye,
} from "lucide-react";
import Card from "../ui/Card";

const SlaveManagementView = ({ slaves, onUpdateCitizen, notify, catalog }) => {
  const [selectedSlave, setSelectedSlave] = useState(null);

  // Fonction pour basculer une permission
  const togglePermission = (slave, permission) => {
    const currentPermissions = slave.permissions || {};
    const newPermissions = {
      ...currentPermissions,
      [permission]: !currentPermissions[permission],
    };
    onUpdateCitizen({ ...slave, permissions: newPermissions });
    // Mise à jour locale pour l'affichage immédiat
    if (selectedSlave && selectedSlave.id === slave.id) {
      setSelectedSlave({ ...slave, permissions: newPermissions });
    }
  };

  const handleFree = (slave) => {
    if (window.confirm(`Voulez-vous vraiment affranchir ${slave.name} ?`)) {
      onUpdateCitizen({
        ...slave,
        status: "Actif",
        ownerId: null,
        permissions: {},
      });
      notify(`${slave.name} est désormais libre.`, "success");
      setSelectedSlave(null);
    }
  };

  const handleTakeMoney = (slave) => {
    if (!slave.balance || slave.balance <= 0) return;
    const amount = slave.balance;
    onUpdateCitizen({ ...slave, balance: 0 });
    // Note: Dans un vrai système, il faudrait ajouter cet argent au maître via onTransfer
    // Ici on simule la confiscation
    notify(`Vous avez confisqué ${amount} Écus à ${slave.name}.`, "info");
    if (selectedSlave) setSelectedSlave({ ...selectedSlave, balance: 0 });
  };

  // Résolution de l'inventaire
  const getInventoryItems = (inventory) => {
    if (!inventory) return [];
    return inventory
      .map((slot) => {
        const itemDef = catalog.find((i) => i.id === slot.itemId);
        return { ...slot, ...itemDef };
      })
      .filter((i) => i.name);
  };

  return (
    <div className="h-full flex gap-6 font-sans">
      {/* LISTE DES ESCLAVES (COLONNE GAUCHE) */}
      <div className="w-1/3 bg-[#fdf6e3] rounded-xl border border-stone-300 flex flex-col overflow-hidden shadow-md">
        <div className="p-4 bg-stone-100 border-b font-bold uppercase text-[11px] tracking-[0.2em] text-stone-500 flex items-center gap-2">
          <Hand size={14} /> Vos Sujets
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {slaves.length === 0 && (
            <div className="text-center p-4 text-xs text-stone-400 italic">
              Aucun esclave.
            </div>
          )}
          {slaves.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedSlave(s)}
              className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center gap-3 ${
                selectedSlave?.id === s.id
                  ? "bg-stone-800 text-white border-stone-900 shadow-md"
                  : "bg-white hover:bg-stone-50 border-stone-200"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-stone-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                {s.avatarUrl ? (
                  <img
                    src={s.avatarUrl}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                ) : (
                  <User size={16} className="text-stone-500" />
                )}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs truncate uppercase">
                  {s.name}
                </div>
                <div className="text-[9px] opacity-70">Mat: {s.id}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DÉTAIL DE L'ESCLAVE (COLONNE DROITE) */}
      <div className="flex-1 bg-[#fdf6e3] rounded-xl border border-stone-300 p-6 overflow-auto shadow-xl relative">
        {selectedSlave ? (
          <div className="space-y-6 animate-fadeIn">
            {/* EN-TÊTE FICHE */}
            <div className="flex justify-between items-start border-b-4 border-stone-800 pb-4">
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 bg-stone-200 rounded-xl border-4 border-stone-800 overflow-hidden shadow-lg">
                  {selectedSlave.avatarUrl ? (
                    <img
                      src={selectedSlave.avatarUrl}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={32} className="text-stone-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase font-serif text-stone-900">
                    {selectedSlave.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-red-900 text-white text-[9px] px-2 py-0.5 rounded uppercase tracking-widest font-bold">
                      Esclave
                    </span>
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                      Occupation: {selectedSlave.occupation || "Aucune"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleFree(selectedSlave)}
                className="bg-white border border-red-200 text-red-700 hover:bg-red-50 px-4 py-2 rounded text-[10px] font-black uppercase flex items-center gap-2 transition-all shadow-sm"
              >
                <Unlock size={14} /> Affranchir
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GESTION DROITS (PERMISSIONS) */}
              <Card title="Permissions & Droits" icon={Shield}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-stone-100 rounded text-stone-600">
                        <Mail size={16} />
                      </div>
                      <div className="text-xs font-bold uppercase text-stone-700">
                        Accès Poste
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={selectedSlave.permissions?.post || false}
                        onChange={() => togglePermission(selectedSlave, "post")}
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-white rounded border border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-stone-100 rounded text-stone-600">
                        <Coins size={16} />
                      </div>
                      <div className="text-xs font-bold uppercase text-stone-700">
                        Accès Banque
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={selectedSlave.permissions?.bank || false}
                        onChange={() => togglePermission(selectedSlave, "bank")}
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-white rounded border border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-stone-100 rounded text-stone-600">
                        <Globe size={16} />
                      </div>
                      <div className="text-xs font-bold uppercase text-stone-700">
                        Droit de Voyage
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={selectedSlave.permissions?.travel || false}
                        onChange={() =>
                          togglePermission(selectedSlave, "travel")
                        }
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              </Card>

              {/* FINANCES */}
              <Card title="Finances" icon={Coins}>
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="text-4xl font-black text-stone-800 font-serif mb-2">
                    {selectedSlave.balance || 0}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-stone-400 mb-4">
                    Écus Possédés
                  </div>
                  <button
                    onClick={() => handleTakeMoney(selectedSlave)}
                    disabled={!selectedSlave.balance}
                    className="w-full bg-stone-900 text-yellow-500 py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Confisquer les fonds
                  </button>
                </div>
              </Card>
            </div>

            {/* INVENTAIRE */}
            <Card title="Inventaire" icon={Box}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {getInventoryItems(selectedSlave.inventory).length === 0 && (
                  <div className="col-span-full text-center text-xs text-stone-400 italic py-4">
                    Inventaire vide.
                  </div>
                )}
                {getInventoryItems(selectedSlave.inventory).map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-2 rounded border border-stone-200 flex flex-col items-center text-center"
                  >
                    <div className="font-bold text-xs text-stone-800">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      x{item.qty}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-stone-300 opacity-50">
            <Eye size={64} className="mb-4" />
            <div className="uppercase font-black tracking-widest text-sm">
              Sélectionnez un sujet
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlaveManagementView;
