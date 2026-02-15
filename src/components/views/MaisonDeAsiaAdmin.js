import React, { useState, useMemo } from "react";
import {
  Gem,
  Users,
  LogOut,
  Plus,
  Heart,
  DollarSign,
  UserPlus,
  Trash2,
  Wallet,
  Building2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import SecureDeleteButton from "../ui/SecureDeleteButton";

const MaisonDeAsiaAdmin = ({
  citizens = [],
  companies = [],
  houseRegistry = [],
  staff = [],
  maisonCompanyId,
  onUpdateRegistry,
  onUpdateStaff,
  onRemoveStaff,
  onPurgeMaison,
  onSetMaisonCompany,
}) => {
  const [activeTab, setActiveTab] = useState("staff");

  // Formulaire simplifié (plus besoin de nom/photo, on prend ceux du citoyen)
  const [selectedSlaveId, setSelectedSlaveId] = useState("");
  const [newStaffSpecialty, setNewStaffSpecialty] = useState("");
  const [newStaffPrice, setNewStaffPrice] = useState(50);

  // Édition d'un membre existant
  const [editingId, setEditingId] = useState(null);
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editPrice, setEditPrice] = useState("");

  // --- FILTRER LES ESCLAVES DISPONIBLES (CORRIGÉ & ROBUSTE) ---
  const availableSlaves = useMemo(() => {
    if (!citizens) return [];

    return citizens.filter((c) => {
      // 1. Nettoyage du statut (minuscule + sans espace inutile) pour éviter les erreurs de saisie
      const status = (c.status || "").toLowerCase().trim();

      // 2. On accepte "esclave", "servitude", ou tout ce qui contient "esclave" (ex: "Esclave de luxe")
      const isSlaveStatus =
        status.includes("esclave") || status === "servitude";

      // 3. Aussi détecter les citoyens avec un propriétaire (esclave de fait)
      const hasOwner = !!c.ownerId;

      // 4. Vérifie s'il est déjà dans le staff (Conversion en String pour éviter les bugs d'ID number vs string)
      const alreadyInStaff = staff.some((s) => String(s.id) === String(c.id));

      return (isSlaveStatus || hasOwner) && !alreadyInStaff;
    });
  }, [citizens, staff]);

  // --- GESTION DU STAFF ---
  const handleAddStaff = () => {
    if (!selectedSlaveId || !newStaffSpecialty) return;

    // On retrouve les infos du citoyen sélectionné
    const slaveProfile = citizens.find((c) => c.id === selectedSlaveId);
    if (!slaveProfile) return;

    const newWorker = {
      id: slaveProfile.id, // On garde le même ID pour lier les systèmes
      name: slaveProfile.name,
      avatarUrl: slaveProfile.avatarUrl,
      specialty: newStaffSpecialty,
      price: parseInt(newStaffPrice),
      isBusy: false,
    };

    onUpdateStaff([...staff, newWorker]);

    // Reset form
    setSelectedSlaveId("");
    setNewStaffSpecialty("");
    setNewStaffPrice(50);
  };

  const handleRemoveStaff = (id) => {
    if (typeof onRemoveStaff === "function") {
      onRemoveStaff(id);
    } else {
      onUpdateStaff(staff.filter((s) => s.id !== id));
    }
  };

  const startEdit = (member) => {
    setEditingId(member.id);
    setEditSpecialty(member.specialty || "");
    setEditPrice(String(member.price || 0));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditSpecialty("");
    setEditPrice("");
  };

  const saveEdit = (id) => {
    const updated = staff.map((s) =>
      s.id === id
        ? { ...s, specialty: editSpecialty, price: parseInt(editPrice) || 0 }
        : s
    );
    onUpdateStaff(updated);
    setEditingId(null);
  };

  // --- PURGE COMPLÈTE ---
  const handlePurge = () => {
    if (
      !window.confirm(
        "PURGER la Maison de Asia ?\n\nCela supprimera TOUT le personnel et TOUTES les réservations. Cette action est irréversible."
      )
    )
      return;
    if (typeof onPurgeMaison === "function") {
      onPurgeMaison();
    } else {
      onUpdateStaff([]);
      onUpdateRegistry([]);
    }
  };

  // --- GESTION DES CLIENTS ---
  const handleEvict = (citizenId) => {
    const newRegistry = houseRegistry.filter((r) => r.citizenId !== citizenId);
    onUpdateRegistry(newRegistry);
  };

  return (
    <div className="h-full flex flex-col bg-stone-100 rounded-xl overflow-hidden border border-stone-300 font-sans">
      {/* HEADER */}
      <div className="bg-fuchsia-900 text-white p-6 shadow-md z-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-fuchsia-800 rounded-lg border border-fuchsia-600 shadow-inner">
            <Gem size={24} className="text-fuchsia-200" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-white">
              Maison Asia
            </h2>
            <p className="text-xs text-fuchsia-300 font-mono">Administration</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-fuchsia-950/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("staff")}
            className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${
              activeTab === "staff"
                ? "bg-white text-fuchsia-900 shadow"
                : "text-fuchsia-300 hover:text-white"
            }`}
          >
            <Heart size={14} /> Les Pensionnaires
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${
              activeTab === "clients"
                ? "bg-white text-fuchsia-900 shadow"
                : "text-fuchsia-300 hover:text-white"
            }`}
          >
            <Users size={14} /> Clients ({houseRegistry.length})
          </button>
          <button
            onClick={() => setActiveTab("finances")}
            className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${
              activeTab === "finances"
                ? "bg-white text-fuchsia-900 shadow"
                : "text-fuchsia-300 hover:text-white"
            }`}
          >
            <Wallet size={14} /> Finances
          </button>
          <button
            onClick={handlePurge}
            className="px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all text-red-300 hover:text-white hover:bg-red-600/50 ml-2"
            title="Purger toutes les données de la Maison"
          >
            <Trash2 size={14} /> Purger
          </button>
        </div>
      </div>

      {/* CONTENU */}
      <div className="flex-1 overflow-y-auto p-6 bg-stone-50">
        {/* --- ONGLET 1 : GESTION DU STAFF --- */}
        {activeTab === "staff" && (
          <div className="space-y-8">
            {/* Formulaire d'ajout */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="text-xs font-black uppercase text-stone-400 mb-4 flex items-center gap-2">
                <UserPlus size={14} /> Affecter un esclave au service
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* SELECTEUR D'ESCLAVES */}
                <select
                  className="p-3 border rounded-lg text-sm bg-stone-50 outline-none focus:border-fuchsia-500"
                  value={selectedSlaveId}
                  onChange={(e) => setSelectedSlaveId(e.target.value)}
                >
                  <option value="">-- Choisir un esclave --</option>
                  {availableSlaves.map((slave) => (
                    <option key={slave.id} value={slave.id}>
                      {slave.name} (Propriétaire:{" "}
                      {citizens.find((c) => c.id === slave.ownerId)?.name ||
                        "État"}
                      )
                    </option>
                  ))}
                  {availableSlaves.length === 0 && (
                    <option disabled>Aucun esclave disponible</option>
                  )}
                </select>

                <input
                  className="p-3 border rounded-lg text-sm bg-stone-50"
                  placeholder="Spécialité (ex: Massage, Danse...)"
                  value={newStaffSpecialty}
                  onChange={(e) => setNewStaffSpecialty(e.target.value)}
                />

                <div className="relative">
                  <DollarSign
                    size={14}
                    className="absolute left-3 top-3.5 text-stone-400"
                  />
                  <input
                    type="number"
                    className="p-3 pl-8 w-full border rounded-lg text-sm bg-stone-50"
                    placeholder="Prix"
                    value={newStaffPrice}
                    onChange={(e) => setNewStaffPrice(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={handleAddStaff}
                disabled={!selectedSlaveId || !newStaffSpecialty}
                className="mt-4 w-full bg-fuchsia-900 text-white py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-fuchsia-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Ajouter au catalogue
              </button>

              {availableSlaves.length === 0 && (
                <p className="text-[10px] text-stone-400 mt-2 italic text-center">
                  * Il n'y a plus d'esclaves disponibles dans le registre pour
                  être ajoutés ici. (Vérifiez qu'ils ont bien le statut
                  "Esclave")
                </p>
              )}
            </div>

            {/* Liste du Staff */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map((member) => {
                const isEditing = editingId === member.id;

                return (
                  <div
                    key={member.id}
                    className={`bg-white p-4 rounded-xl shadow-sm border flex gap-4 items-start group relative ${
                      isEditing
                        ? "border-fuchsia-400 ring-2 ring-fuchsia-200"
                        : "border-stone-200"
                    }`}
                  >
                    <img
                      src={member.avatarUrl || "https://i.pravatar.cc/150?img=5"}
                      alt={member.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-fuchsia-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-stone-800">{member.name}</h4>

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <input
                            className="w-full p-1.5 border rounded text-xs bg-stone-50 outline-none focus:border-fuchsia-500"
                            value={editSpecialty}
                            onChange={(e) => setEditSpecialty(e.target.value)}
                            placeholder="Spécialité..."
                          />
                          <div className="relative">
                            <input
                              type="number"
                              className="w-full p-1.5 pl-6 border rounded text-xs bg-stone-50 outline-none focus:border-fuchsia-500 font-mono"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              placeholder="Prix"
                            />
                            <DollarSign
                              size={12}
                              className="absolute left-2 top-2 text-stone-400"
                            />
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => saveEdit(member.id)}
                              className="flex-1 bg-fuchsia-900 text-white py-1.5 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1 hover:bg-fuchsia-800"
                            >
                              <Check size={12} /> OK
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 bg-stone-100 text-stone-500 rounded text-[10px] font-bold uppercase hover:bg-stone-200 flex items-center gap-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-fuchsia-600 font-medium">
                            {member.specialty}
                          </p>
                          <p className="text-xs text-stone-400 mt-1 font-mono">
                            {member.price} Écus
                          </p>
                        </>
                      )}
                    </div>

                    {/* Badge de statut */}
                    {houseRegistry.find((r) => r.staffId === member.id) ? (
                      <span
                        className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"
                        title="Occupée"
                      ></span>
                    ) : (
                      <span
                        className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"
                        title="Disponible"
                      ></span>
                    )}

                    {!isEditing && (
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                        <button
                          onClick={() => startEdit(member)}
                          className="p-1.5 bg-stone-100 text-stone-500 rounded hover:bg-fuchsia-100 hover:text-fuchsia-700 transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={12} />
                        </button>
                        <SecureDeleteButton
                          onClick={() => handleRemoveStaff(member.id)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              {staff.length === 0 && (
                <div className="col-span-full text-center py-10 text-stone-400 italic">
                  Aucun personnel enregistré.
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- ONGLET 3 : FINANCES (Entreprise Maison d'Asia) --- */}
        {activeTab === "finances" && (() => {
          const linkedCompany = maisonCompanyId
            ? companies.find((c) => c.id === maisonCompanyId)
            : null;

          // Calculer les revenus potentiels par jour
          const totalStaffPrices = staff.reduce(
            (sum, s) => sum + (s.price || 0),
            0
          );

          return (
            <div className="space-y-6">
              {/* Sélection de l'entreprise liée */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <h3 className="text-xs font-black uppercase text-stone-400 mb-4 flex items-center gap-2">
                  <Building2 size={14} /> Entreprise liée
                </h3>
                <p className="text-xs text-stone-500 mb-3">
                  80% des revenus de la Maison seront versés à cette entreprise. Les 20% restants iront au Trésor Impérial.
                </p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <select
                      className="w-full p-3 border rounded-lg text-sm bg-stone-50 outline-none focus:border-fuchsia-500"
                      value={maisonCompanyId || ""}
                      onChange={(e) => onSetMaisonCompany(e.target.value || null)}
                    >
                      <option value="">-- Aucune entreprise --</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Solde : {(c.balance || 0).toLocaleString()} Écus)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Fiche de l'entreprise liée */}
              {linkedCompany ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-fuchsia-200 border-l-8 border-l-fuchsia-600">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <div className="text-[10px] font-black uppercase text-fuchsia-400 tracking-widest mb-1">
                        Trésorerie de la Maison
                      </div>
                      <h2 className="text-2xl font-black text-stone-900">
                        {linkedCompany.name}
                      </h2>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          {linkedCompany.type || "SERVICE"}
                        </span>
                        <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          Niveau {linkedCompany.level || 1}
                        </span>
                      </div>
                    </div>
                    <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-200 text-right min-w-[180px]">
                      <div className="text-[10px] font-black uppercase text-fuchsia-400 tracking-widest mb-1">
                        Solde actuel
                      </div>
                      <div className="text-3xl font-mono font-black text-fuchsia-800">
                        {(linkedCompany.balance || 0).toLocaleString()}{" "}
                        <span className="text-sm">Écus</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                      <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">
                        Personnel actif
                      </div>
                      <div className="text-xl font-black text-stone-800">
                        {staff.length}
                      </div>
                    </div>
                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                      <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">
                        Clients en cours
                      </div>
                      <div className="text-xl font-black text-stone-800">
                        {houseRegistry.length}
                      </div>
                    </div>
                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                      <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">
                        Revenu max / session
                      </div>
                      <div className="text-xl font-mono font-black text-green-600">
                        {Math.floor(totalStaffPrices * 0.8).toLocaleString()} Écus
                      </div>
                      <div className="text-[9px] text-stone-400">
                        (80% de {totalStaffPrices.toLocaleString()})
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 p-8 rounded-xl border-2 border-dashed border-stone-300 text-center">
                  <Building2
                    size={48}
                    className="mx-auto mb-3 text-stone-300"
                  />
                  <h3 className="font-bold text-stone-500 mb-1">
                    Aucune entreprise liée
                  </h3>
                  <p className="text-xs text-stone-400 max-w-md mx-auto">
                    Sélectionnez une entreprise ci-dessus pour y verser
                    automatiquement 80% des revenus de la Maison.
                    En attendant, tous les revenus iront au Trésor Impérial.
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* --- ONGLET 2 : CLIENTS --- */}
        {activeTab === "clients" && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-stone-500 uppercase text-[10px] tracking-widest font-black">
                <tr>
                  <th className="p-4">Client</th>
                  <th className="p-4">Compagnie</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {houseRegistry.length === 0 ? (
                  <tr>
                    <td
                      colSpan="3"
                      className="p-8 text-center text-stone-400 italic"
                    >
                      Le salon est vide.
                    </td>
                  </tr>
                ) : (
                  houseRegistry.map((record) => {
                    const client = citizens.find(
                      (c) => c.id === record.citizenId
                    ) || { name: "Inconnu" };
                    const worker = staff.find(
                      (s) => s.id === record.staffId
                    ) || { name: "Service Inconnu" };

                    return (
                      <tr key={record.citizenId} className="hover:bg-stone-50">
                        <td className="p-4 font-bold text-stone-800">
                          {client.name}
                        </td>
                        <td className="p-4 text-fuchsia-700 font-medium flex items-center gap-2">
                          <Heart size={12} /> {worker.name}
                        </td>
                        <td className="p-4 text-right">
                          <SecureDeleteButton
                            label="Expulser"
                            icon={LogOut}
                            onClick={() => handleEvict(record.citizenId)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaisonDeAsiaAdmin;
