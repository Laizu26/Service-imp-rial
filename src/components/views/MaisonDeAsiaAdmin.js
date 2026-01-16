import React, { useState, useMemo } from "react";
import {
  Gem,
  Users,
  LogOut,
  Plus,
  Trash2,
  Heart,
  DollarSign,
  UserPlus,
} from "lucide-react";
import SecureDeleteButton from "../ui/SecureDeleteButton";

const MaisonDeAsiaAdmin = ({
  citizens = [],
  houseRegistry = [],
  staff = [],
  onUpdateRegistry,
  onUpdateStaff,
}) => {
  const [activeTab, setActiveTab] = useState("staff");

  // Formulaire simplifié (plus besoin de nom/photo, on prend ceux du citoyen)
  const [selectedSlaveId, setSelectedSlaveId] = useState("");
  const [newStaffSpecialty, setNewStaffSpecialty] = useState("");
  const [newStaffPrice, setNewStaffPrice] = useState(50);

  // --- FILTRER LES ESCLAVES DISPONIBLES (CORRIGÉ & ROBUSTE) ---
  const availableSlaves = useMemo(() => {
    if (!citizens) return [];

    return citizens.filter((c) => {
      // 1. Nettoyage du statut (minuscule + sans espace inutile) pour éviter les erreurs de saisie
      const status = (c.status || "").toLowerCase().trim();

      // 2. On accepte "esclave", "servitude", ou tout ce qui contient "esclave" (ex: "Esclave de luxe")
      const isSlaveStatus =
        status.includes("esclave") || status === "servitude";

      // 3. Vérifie s'il est déjà dans le staff (Conversion en String pour éviter les bugs d'ID number vs string)
      const alreadyInStaff = staff.some((s) => String(s.id) === String(c.id));

      return isSlaveStatus && !alreadyInStaff;
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
    onUpdateStaff(staff.filter((s) => s.id !== id));
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
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex gap-4 items-center group relative"
                >
                  <img
                    src={member.avatarUrl || "https://i.pravatar.cc/150?img=5"}
                    alt={member.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-fuchsia-100"
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-stone-800">{member.name}</h4>
                    <p className="text-xs text-fuchsia-600 font-medium">
                      {member.specialty}
                    </p>
                    <p className="text-xs text-stone-400 mt-1 font-mono">
                      {member.price} Écus
                    </p>
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

                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <SecureDeleteButton
                      onClick={() => handleRemoveStaff(member.id)}
                    />
                  </div>
                </div>
              ))}
              {staff.length === 0 && (
                <div className="col-span-full text-center py-10 text-stone-400 italic">
                  Aucun personnel enregistré.
                </div>
              )}
            </div>
          </div>
        )}

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
