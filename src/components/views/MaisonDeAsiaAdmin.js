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
  Star,
  Clock,
  MessageSquare,
  Timer,
  ListOrdered,
  BarChart3,
  AlertTriangle,
  ImagePlus,
  Images,
} from "lucide-react";
import SecureDeleteButton from "../ui/SecureDeleteButton";
import JobsAdminView from "./JobsAdminView";

/* ───────────── Petit composant étoiles (lecture seule) ───────────── */
const Stars = ({ rating, size = 12 }) => (
  <span className="inline-flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={size}
        className={
          i <= Math.round(rating)
            ? "text-amber-400 fill-amber-400"
            : "text-stone-300"
        }
      />
    ))}
  </span>
);

/* ───────────── Panneau galerie dépliable ───────────── */
const GalleryPanel = ({ member, onAdd, onRemove, onClose }) => {
  const [url, setUrl] = useState("");
  const gallery = member.gallery || [];

  return (
    <div className="col-span-full bg-stone-50 rounded-xl border border-fuchsia-200 p-4 shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-black uppercase text-fuchsia-700 tracking-widest flex items-center gap-2">
          <Images size={14} /> Galerie — {member.name} ({gallery.length} photo{gallery.length !== 1 ? "s" : ""})
        </h4>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
          <X size={16} />
        </button>
      </div>

      {/* Images existantes */}
      {gallery.length > 0 ? (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-3">
          {gallery.map((img, idx) => (
            <div key={idx} className="relative group/img aspect-square rounded-lg overflow-hidden border border-stone-200">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => onRemove(idx)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                title="Supprimer"
              >
                <X size={10} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center py-0.5">
                #{idx + 1}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-stone-400 italic mb-3">Aucune photo dans la galerie.</p>
      )}

      {/* Ajout d'image */}
      <div className="flex gap-2">
        <input
          className="flex-1 p-2 border rounded-lg text-xs bg-white outline-none focus:border-fuchsia-500"
          placeholder="URL de l'image..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && url.trim()) {
              onAdd(url.trim());
              setUrl("");
            }
          }}
        />
        <button
          onClick={() => {
            if (url.trim()) {
              onAdd(url.trim());
              setUrl("");
            }
          }}
          disabled={!url.trim()}
          className="px-3 py-2 bg-fuchsia-900 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-fuchsia-800 disabled:opacity-50 flex items-center gap-1"
        >
          <ImagePlus size={12} /> Ajouter
        </button>
      </div>
    </div>
  );
};

const MaisonDeAsiaAdmin = ({
  citizens = [],
  companies = [],
  countries = [],
  houseRegistry = [],
  staff = [],
  maisonCompanyId,
  maisonQueue = [],
  maisonHistory = [],
  maisonReviews = [],
  maisonDefaultDuration = 60,
  jobs = [],
  session,
  roleInfo,
  onUpdateRegistry,
  onUpdateStaff,
  onRemoveStaff,
  onPurgeMaison,
  onSetMaisonCompany,
  onDeleteReview,
  onSetDefaultDuration,
  onEvictMaison,
  onSaveJobContract,
  onDeleteJobContract,
  onToggleJobContract,
}) => {
  const [activeTab, setActiveTab] = useState("staff");

  // Formulaire ajout staff
  const [selectedSlaveId, setSelectedSlaveId] = useState("");
  const [newStaffSpecialty, setNewStaffSpecialty] = useState("");
  const [newStaffPrice, setNewStaffPrice] = useState(50);
  const [newStaffDuration, setNewStaffDuration] = useState("");
  const [newStaffDescription, setNewStaffDescription] = useState("");
  // Galerie images (ajout)
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newStaffGallery, setNewStaffGallery] = useState([]);

  // Édition d'un membre existant
  const [editingId, setEditingId] = useState(null);
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editGallery, setEditGallery] = useState([]);

  // Gestion galerie séparée (en dehors du mode edit)
  const [galleryMemberId, setGalleryMemberId] = useState(null);

  // Durée par défaut (local)
  const [draftDefaultDuration, setDraftDefaultDuration] = useState(
    String(maisonDefaultDuration)
  );

  // Filtre avis
  const [reviewFilter, setReviewFilter] = useState("all");

  // --- FILTRER LES ESCLAVES DISPONIBLES ---
  const availableSlaves = useMemo(() => {
    if (!citizens) return [];
    return citizens.filter((c) => {
      const status = (c.status || "").toLowerCase().trim();
      const isSlaveStatus =
        status.includes("esclave") || status === "servitude";
      const hasOwner = !!c.ownerId;
      const alreadyInStaff = staff.some((s) => String(s.id) === String(c.id));
      return (isSlaveStatus || hasOwner) && !alreadyInStaff;
    });
  }, [citizens, staff]);

  // --- STATS CALCULÉES ---
  const stats = useMemo(() => {
    const totalVisits = maisonHistory.length;
    const totalQueueSize = maisonQueue.length;
    const allRatings = maisonReviews.map((r) => r.rating || 0);
    const avgRating =
      allRatings.length > 0
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
        : 0;

    // Revenus par pensionnaire (depuis l'historique)
    const revenueByStaff = {};
    staff.forEach((s) => {
      revenueByStaff[s.id] = { name: s.name, visits: 0, revenue: 0 };
    });
    maisonHistory.forEach((h) => {
      if (!revenueByStaff[h.staffId]) {
        revenueByStaff[h.staffId] = {
          name: h.staffName || "Inconnu",
          visits: 0,
          revenue: 0,
        };
      }
      revenueByStaff[h.staffId].visits += 1;
      revenueByStaff[h.staffId].revenue += h.pricePaid || 0;
    });

    // Note moyenne par staff
    const ratingByStaff = {};
    maisonReviews.forEach((r) => {
      if (!ratingByStaff[r.staffId]) ratingByStaff[r.staffId] = [];
      ratingByStaff[r.staffId].push(r.rating);
    });

    Object.keys(revenueByStaff).forEach((sid) => {
      const ratings = ratingByStaff[sid] || [];
      revenueByStaff[sid].avgRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : null;
      revenueByStaff[sid].reviewCount = ratings.length;
    });

    return {
      totalVisits,
      totalQueueSize,
      avgRating,
      totalReviews: allRatings.length,
      revenueByStaff,
    };
  }, [staff, maisonHistory, maisonReviews, maisonQueue]);

  // --- GESTION DU STAFF ---
  const handleAddStaff = () => {
    if (!selectedSlaveId || !newStaffSpecialty) return;
    const slaveProfile = citizens.find((c) => c.id === selectedSlaveId);
    if (!slaveProfile) return;

    const newWorker = {
      id: slaveProfile.id,
      name: slaveProfile.name,
      avatarUrl: slaveProfile.avatarUrl,
      specialty: newStaffSpecialty,
      price: parseInt(newStaffPrice),
      sessionDuration: newStaffDuration
        ? parseInt(newStaffDuration)
        : undefined,
      specialtyDescription: newStaffDescription || "",
      gallery: newStaffGallery.length > 0 ? [...newStaffGallery] : [],
      isBusy: false,
    };

    onUpdateStaff([...staff, newWorker]);
    setSelectedSlaveId("");
    setNewStaffSpecialty("");
    setNewStaffPrice(50);
    setNewStaffDuration("");
    setNewStaffDescription("");
    setNewStaffGallery([]);
    setNewImageUrl("");
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
    setEditDuration(String(member.sessionDuration || ""));
    setEditDescription(member.specialtyDescription || "");
    setEditGallery([...(member.gallery || [])]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditSpecialty("");
    setEditPrice("");
    setEditDuration("");
    setEditDescription("");
    setEditGallery([]);
  };

  const saveEdit = (id) => {
    const updated = staff.map((s) =>
      s.id === id
        ? {
            ...s,
            specialty: editSpecialty,
            price: parseInt(editPrice) || 0,
            sessionDuration: editDuration ? parseInt(editDuration) : undefined,
            specialtyDescription: editDescription,
            gallery: editGallery,
          }
        : s
    );
    onUpdateStaff(updated);
    setEditingId(null);
  };

  // --- GESTION GALERIE (mode séparé, hors edit) ---
  const handleAddGalleryImage = (memberId, url) => {
    if (!url || !url.trim()) return;
    const updated = staff.map((s) =>
      s.id === memberId
        ? { ...s, gallery: [...(s.gallery || []), url.trim()] }
        : s
    );
    onUpdateStaff(updated);
  };

  const handleRemoveGalleryImage = (memberId, idx) => {
    const updated = staff.map((s) =>
      s.id === memberId
        ? { ...s, gallery: (s.gallery || []).filter((_, i) => i !== idx) }
        : s
    );
    onUpdateStaff(updated);
  };

  // --- PURGE ---
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

  // --- EVICTION (crée l'historique + gère la queue) ---
  const handleEvict = (citizenId) => {
    if (onEvictMaison) {
      onEvictMaison(citizenId);
    } else {
      const newRegistry = houseRegistry.filter((r) => r.citizenId !== citizenId);
      onUpdateRegistry(newRegistry);
    }
  };

  // --- DURÉE PAR DEFAUT ---
  const handleSaveDefaultDuration = () => {
    const val = parseInt(draftDefaultDuration);
    if (!val || val < 10 || val > 480) return;
    if (typeof onSetDefaultDuration === "function") {
      onSetDefaultDuration(val);
    }
  };

  // --- TABS DEFINITION ---
  const tabs = [
    { id: "staff", label: "Pensionnaires", icon: Heart, count: staff.length },
    {
      id: "clients",
      label: "Clients",
      icon: Users,
      count: houseRegistry.length,
    },
    {
      id: "reviews",
      label: "Avis",
      icon: MessageSquare,
      count: maisonReviews.length,
    },
    { id: "finances", label: "Finances", icon: Wallet },
    { id: "contrats", label: "Contrats", icon: Building2, count: jobs.length },
  ];

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
            <p className="text-xs text-fuchsia-300 font-mono">
              Administration
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-fuchsia-950/50 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? "bg-white text-fuchsia-900 shadow"
                  : "text-fuchsia-300 hover:text-white"
              }`}
            >
              <tab.icon size={14} /> {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${
                    activeTab === tab.id
                      ? "bg-fuchsia-100 text-fuchsia-700"
                      : "bg-fuchsia-800 text-fuchsia-300"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
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
        {/* ════════════════ ONGLET 1 : STAFF ════════════════ */}
        {activeTab === "staff" && (
          <div className="space-y-8">
            {/* Durée par défaut globale */}
            <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-200 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-fuchsia-800">
                <Timer size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Durée par défaut
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="480"
                  className="w-20 p-2 border border-fuchsia-300 rounded-lg text-sm bg-white text-center font-mono outline-none focus:border-fuchsia-500"
                  value={draftDefaultDuration}
                  onChange={(e) => setDraftDefaultDuration(e.target.value)}
                />
                <span className="text-xs text-fuchsia-600">min</span>
                <button
                  onClick={handleSaveDefaultDuration}
                  className="px-3 py-2 bg-fuchsia-900 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-fuchsia-800 flex items-center gap-1"
                >
                  <Check size={12} /> Sauver
                </button>
              </div>
              <span className="text-[10px] text-fuchsia-500 italic">
                Appliquée aux pensionnaires sans durée spécifique (actuel :{" "}
                {maisonDefaultDuration} min)
              </span>
            </div>

            {/* Formulaire d'ajout */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="text-xs font-black uppercase text-stone-400 mb-4 flex items-center gap-2">
                <UserPlus size={14} /> Affecter un esclave au service
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                <div className="relative">
                  <Clock
                    size={14}
                    className="absolute left-3 top-3.5 text-stone-400"
                  />
                  <input
                    type="number"
                    className="p-3 pl-8 w-full border rounded-lg text-sm bg-stone-50"
                    placeholder={`Durée (min, défaut: ${maisonDefaultDuration})`}
                    value={newStaffDuration}
                    onChange={(e) => setNewStaffDuration(e.target.value)}
                  />
                </div>
              </div>

              {/* Description détaillée */}
              <textarea
                className="mt-3 w-full p-3 border rounded-lg text-sm bg-stone-50 resize-none outline-none focus:border-fuchsia-500"
                rows={2}
                placeholder="Description détaillée (optionnel, visible sur le profil public)..."
                value={newStaffDescription}
                onChange={(e) => setNewStaffDescription(e.target.value)}
                maxLength={500}
              />

              {/* Galerie images */}
              <div className="mt-3 bg-stone-50 p-3 rounded-lg border border-stone-200">
                <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2 flex items-center gap-1">
                  <Images size={12} /> Galerie photos ({newStaffGallery.length})
                </div>
                {newStaffGallery.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newStaffGallery.map((img, i) => (
                      <div key={i} className="relative group/img">
                        <img src={img} alt="" className="w-14 h-14 rounded-lg object-cover border border-stone-200" />
                        <button
                          onClick={() => setNewStaffGallery(newStaffGallery.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    className="flex-1 p-2 border rounded text-xs bg-white outline-none focus:border-fuchsia-500"
                    placeholder="URL de l'image..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newImageUrl.trim()) {
                        setNewStaffGallery([...newStaffGallery, newImageUrl.trim()]);
                        setNewImageUrl("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        setNewStaffGallery([...newStaffGallery, newImageUrl.trim()]);
                        setNewImageUrl("");
                      }
                    }}
                    disabled={!newImageUrl.trim()}
                    className="px-3 py-1.5 bg-fuchsia-800 text-white rounded text-[10px] font-bold hover:bg-fuchsia-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <ImagePlus size={12} />
                  </button>
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
                const queueCount = maisonQueue.filter(
                  (q) => q.staffId === member.id
                ).length;
                const staffReviews = maisonReviews.filter(
                  (r) => r.staffId === member.id
                );
                const avgRating =
                  staffReviews.length > 0
                    ? staffReviews.reduce((s, r) => s + r.rating, 0) /
                      staffReviews.length
                    : null;
                const effectiveDuration =
                  member.sessionDuration || maisonDefaultDuration;

                return (
                  <React.Fragment key={member.id}>
                  <div
                    className={`bg-white p-4 rounded-xl shadow-sm border flex gap-4 items-start group relative ${
                      isEditing
                        ? "border-fuchsia-400 ring-2 ring-fuchsia-200"
                        : "border-stone-200"
                    }`}
                  >
                    <img
                      src={
                        member.avatarUrl || "https://i.pravatar.cc/150?img=5"
                      }
                      alt={member.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-fuchsia-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-stone-800">
                        {member.name}
                      </h4>

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <input
                            className="w-full p-1.5 border rounded text-xs bg-stone-50 outline-none focus:border-fuchsia-500"
                            value={editSpecialty}
                            onChange={(e) => setEditSpecialty(e.target.value)}
                            placeholder="Spécialité..."
                          />
                          <div className="grid grid-cols-2 gap-2">
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
                            <div className="relative">
                              <input
                                type="number"
                                className="w-full p-1.5 pl-6 border rounded text-xs bg-stone-50 outline-none focus:border-fuchsia-500 font-mono"
                                value={editDuration}
                                onChange={(e) => setEditDuration(e.target.value)}
                                placeholder={`Durée (${maisonDefaultDuration})`}
                              />
                              <Clock
                                size={12}
                                className="absolute left-2 top-2 text-stone-400"
                              />
                            </div>
                          </div>
                          <textarea
                            className="w-full p-1.5 border rounded text-xs bg-stone-50 outline-none focus:border-fuchsia-500 resize-none"
                            rows={2}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Description détaillée..."
                            maxLength={500}
                          />
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
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-stone-400 font-mono">
                              {member.price} Écus
                            </span>
                            <span className="text-[10px] text-stone-400 flex items-center gap-1">
                              <Clock size={10} /> {effectiveDuration} min
                            </span>
                          </div>
                          {/* Note moyenne + queue */}
                          <div className="flex items-center gap-3 mt-1.5">
                            {avgRating !== null && (
                              <span className="flex items-center gap-1">
                                <Stars rating={avgRating} size={10} />
                                <span className="text-[10px] text-stone-400">
                                  ({staffReviews.length})
                                </span>
                              </span>
                            )}
                            {queueCount > 0 && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                <ListOrdered size={10} /> {queueCount} en
                                attente
                              </span>
                            )}
                          </div>
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
                          onClick={() => setGalleryMemberId(galleryMemberId === member.id ? null : member.id)}
                          className="p-1.5 bg-stone-100 text-stone-500 rounded hover:bg-fuchsia-100 hover:text-fuchsia-700 transition-colors"
                          title="Galerie photos"
                        >
                          <Images size={12} />
                          {(member.gallery || []).length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-fuchsia-600 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                              {member.gallery.length}
                            </span>
                          )}
                        </button>
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

                    {/* Mini galerie preview */}
                    {(member.gallery || []).length > 0 && !isEditing && (
                      <div className="absolute bottom-2 left-2 flex -space-x-2">
                        {member.gallery.slice(0, 3).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover border border-white shadow-sm"
                          />
                        ))}
                        {member.gallery.length > 3 && (
                          <span className="w-6 h-6 rounded-full bg-fuchsia-200 text-fuchsia-700 flex items-center justify-center text-[8px] font-bold border border-white">
                            +{member.gallery.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Panneau galerie dépliable */}
                  {galleryMemberId === member.id && (
                    <GalleryPanel
                      member={member}
                      onAdd={(url) => { handleAddGalleryImage(member.id, url); }}
                      onRemove={(idx) => handleRemoveGalleryImage(member.id, idx)}
                      onClose={() => setGalleryMemberId(null)}
                    />
                  )}
                </React.Fragment>
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

        {/* ════════════════ ONGLET 2 : CLIENTS ════════════════ */}
        {activeTab === "clients" && (
          <div className="space-y-6">
            {/* Sessions actives */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="bg-stone-50 px-4 py-3 border-b border-stone-200">
                <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest flex items-center gap-2">
                  <Users size={14} /> Sessions en cours ({houseRegistry.length})
                </h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-100 text-stone-500 uppercase text-[10px] tracking-widest font-black">
                  <tr>
                    <th className="p-4">Client</th>
                    <th className="p-4">Compagnie</th>
                    <th className="p-4">Début</th>
                    <th className="p-4">Temps restant</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {houseRegistry.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
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

                      // Timer
                      const startTime = record.startTime || 0;
                      const duration =
                        record.duration || maisonDefaultDuration;
                      const endTime = startTime + duration * 60000;
                      const now = Date.now();
                      const remaining = endTime - now;
                      const isExpired = remaining <= 0;
                      const remainingMin = Math.max(
                        0,
                        Math.ceil(remaining / 60000)
                      );

                      return (
                        <tr
                          key={record.citizenId}
                          className={`hover:bg-stone-50 ${
                            isExpired ? "bg-red-50" : ""
                          }`}
                        >
                          <td className="p-4 font-bold text-stone-800">
                            {client.name}
                          </td>
                          <td className="p-4 text-fuchsia-700 font-medium flex items-center gap-2">
                            <Heart size={12} /> {worker.name}
                          </td>
                          <td className="p-4 text-xs text-stone-500 font-mono">
                            {startTime
                              ? new Date(startTime).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </td>
                          <td className="p-4">
                            {isExpired ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded animate-pulse">
                                <AlertTriangle size={12} /> Expirée
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-mono text-green-700 bg-green-50 px-2 py-1 rounded">
                                <Timer size={12} /> {remainingMin} min
                              </span>
                            )}
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

            {/* File d'attente */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="bg-amber-50 px-4 py-3 border-b border-amber-200">
                <h3 className="text-xs font-black uppercase text-amber-700 tracking-widest flex items-center gap-2">
                  <ListOrdered size={14} /> File d'attente ({maisonQueue.length})
                </h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-100 text-stone-500 uppercase text-[10px] tracking-widest font-black">
                  <tr>
                    <th className="p-4">Position</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Pour</th>
                    <th className="p-4">Depuis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {maisonQueue.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-6 text-center text-stone-400 italic"
                      >
                        Aucune file d'attente.
                      </td>
                    </tr>
                  ) : (
                    [...maisonQueue]
                      .sort((a, b) => (a.position || 0) - (b.position || 0))
                      .map((q, idx) => {
                        const client = citizens.find(
                          (c) => c.id === q.citizenId
                        ) || { name: "Inconnu" };
                        const worker = staff.find(
                          (s) => s.id === q.staffId
                        ) || { name: "Inconnue" };

                        return (
                          <tr key={`${q.citizenId}-${q.staffId}`} className="hover:bg-stone-50">
                            <td className="p-4">
                              <span className="inline-flex items-center justify-center w-7 h-7 bg-amber-100 text-amber-700 rounded-full font-bold text-xs">
                                #{idx + 1}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-stone-800">
                              {client.name}
                            </td>
                            <td className="p-4 text-fuchsia-700 font-medium">
                              {worker.name}
                            </td>
                            <td className="p-4 text-xs text-stone-500 font-mono">
                              {q.joinedAt
                                ? new Date(q.joinedAt).toLocaleTimeString(
                                    "fr-FR",
                                    { hour: "2-digit", minute: "2-digit" }
                                  )
                                : "—"}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════ ONGLET 3 : AVIS ════════════════ */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            {/* Filtre par staff */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                Filtrer par :
              </span>
              <select
                className="p-2 border rounded-lg text-sm bg-white outline-none focus:border-fuchsia-500"
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value)}
              >
                <option value="all">Tous les avis</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-stone-400 italic ml-auto">
                {maisonReviews.length} avis au total
              </span>
            </div>

            {/* Liste des avis */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-100 text-stone-500 uppercase text-[10px] tracking-widest font-black">
                  <tr>
                    <th className="p-4">Pensionnaire</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Note</th>
                    <th className="p-4">Commentaire</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(() => {
                    const filtered =
                      reviewFilter === "all"
                        ? maisonReviews
                        : maisonReviews.filter(
                            (r) => r.staffId === reviewFilter
                          );
                    const sorted = [...filtered].sort(
                      (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
                    );

                    if (sorted.length === 0) {
                      return (
                        <tr>
                          <td
                            colSpan="6"
                            className="p-8 text-center text-stone-400 italic"
                          >
                            Aucun avis
                            {reviewFilter !== "all" ? " pour ce filtre" : ""}.
                          </td>
                        </tr>
                      );
                    }

                    return sorted.map((review) => (
                      <tr key={review.id} className="hover:bg-stone-50">
                        <td className="p-4 font-medium text-fuchsia-700">
                          {review.staffName || "—"}
                        </td>
                        <td className="p-4 text-stone-800">
                          <div className="flex items-center gap-2">
                            {review.citizenAvatarUrl && (
                              <img
                                src={review.citizenAvatarUrl}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            )}
                            {review.citizenName || "Anonyme"}
                          </div>
                        </td>
                        <td className="p-4">
                          <Stars rating={review.rating} />
                        </td>
                        <td className="p-4 text-xs text-stone-600 max-w-[200px] truncate">
                          {review.comment || (
                            <span className="italic text-stone-400">
                              Sans commentaire
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-stone-500 font-mono whitespace-nowrap">
                          {review.timestamp
                            ? new Date(review.timestamp).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </td>
                        <td className="p-4 text-right">
                          {typeof onDeleteReview === "function" && (
                            <SecureDeleteButton
                              label="Supprimer"
                              onClick={() => onDeleteReview(review.id)}
                            />
                          )}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════ ONGLET 4 : FINANCES ════════════════ */}
        {activeTab === "finances" &&
          (() => {
            const linkedCompany = maisonCompanyId
              ? companies.find((c) => c.id === maisonCompanyId)
              : null;

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
                    80% des revenus de la Maison seront versés à cette
                    entreprise. Les 20% restants iront au Trésor Impérial.
                  </p>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <select
                        className="w-full p-3 border rounded-lg text-sm bg-stone-50 outline-none focus:border-fuchsia-500"
                        value={maisonCompanyId || ""}
                        onChange={(e) =>
                          onSetMaisonCompany(e.target.value || null)
                        }
                      >
                        <option value="">-- Aucune entreprise --</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (Solde :{" "}
                            {(c.balance || 0).toLocaleString()} Écus)
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

                    {/* Stats principales */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <div className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">
                          En file d'attente
                        </div>
                        <div className="text-xl font-black text-amber-700">
                          {stats.totalQueueSize}
                        </div>
                      </div>
                      <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                        <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">
                          Total visites
                        </div>
                        <div className="text-xl font-black text-stone-800">
                          {stats.totalVisits}
                        </div>
                      </div>
                      <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                        <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">
                          Revenu max / session
                        </div>
                        <div className="text-xl font-mono font-black text-green-600">
                          {Math.floor(totalStaffPrices * 0.8).toLocaleString()}{" "}
                          Écus
                        </div>
                        <div className="text-[9px] text-stone-400">
                          (80% de {totalStaffPrices.toLocaleString()})
                        </div>
                      </div>
                    </div>

                    {/* Note moyenne globale */}
                    {stats.totalReviews > 0 && (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6 flex items-center gap-4">
                        <div>
                          <div className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">
                            Note moyenne globale
                          </div>
                          <div className="flex items-center gap-2">
                            <Stars rating={stats.avgRating} size={16} />
                            <span className="text-lg font-black text-amber-700">
                              {stats.avgRating.toFixed(1)}
                            </span>
                            <span className="text-xs text-amber-500">
                              ({stats.totalReviews} avis)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tableau revenus par pensionnaire */}
                    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                      <div className="bg-stone-50 px-4 py-3 border-b border-stone-200">
                        <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest flex items-center gap-2">
                          <BarChart3 size={14} /> Revenus par pensionnaire
                        </h3>
                      </div>
                      <table className="w-full text-left text-sm">
                        <thead className="bg-stone-100 text-stone-500 uppercase text-[10px] tracking-widest font-black">
                          <tr>
                            <th className="p-3">Pensionnaire</th>
                            <th className="p-3 text-center">Visites</th>
                            <th className="p-3 text-right">Revenu total</th>
                            <th className="p-3 text-center">Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {Object.entries(stats.revenueByStaff).length === 0 ? (
                            <tr>
                              <td
                                colSpan="4"
                                className="p-6 text-center text-stone-400 italic"
                              >
                                Aucune donnée.
                              </td>
                            </tr>
                          ) : (
                            Object.entries(stats.revenueByStaff)
                              .sort(
                                ([, a], [, b]) =>
                                  (b.revenue || 0) - (a.revenue || 0)
                              )
                              .map(([sid, data]) => (
                                <tr key={sid} className="hover:bg-stone-50">
                                  <td className="p-3 font-medium text-fuchsia-700">
                                    {data.name}
                                  </td>
                                  <td className="p-3 text-center font-mono text-stone-600">
                                    {data.visits}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-green-700">
                                    {Math.floor(
                                      (data.revenue || 0) * 0.8
                                    ).toLocaleString()}{" "}
                                    Écus
                                  </td>
                                  <td className="p-3 text-center">
                                    {data.avgRating !== null ? (
                                      <span className="flex items-center justify-center gap-1">
                                        <Stars
                                          rating={data.avgRating}
                                          size={10}
                                        />
                                        <span className="text-[10px] text-stone-400">
                                          ({data.reviewCount})
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-stone-400 italic">
                                        —
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
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
                      automatiquement 80% des revenus de la Maison. En
                      attendant, tous les revenus iront au Trésor Impérial.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

        {/* ════════════════ ONGLET 5 : CONTRATS ════════════════ */}
        {activeTab === "contrats" && (
          <div className="h-full">
            <JobsAdminView
              jobs={jobs}
              citizens={citizens}
              countries={countries}
              companies={companies}
              session={session}
              roleInfo={roleInfo}
              onSaveJobContract={onSaveJobContract}
              onDeleteJobContract={onDeleteJobContract}
              onToggleJobContract={onToggleJobContract}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MaisonDeAsiaAdmin;
