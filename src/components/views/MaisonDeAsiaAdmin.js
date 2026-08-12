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
  ScrollText,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Layers,
  Wrench,
  ShieldCheck,
  ShieldOff,
  Crown,
  Search,
  History,
  ArrowUpDown,
  CalendarDays,
} from "lucide-react";
import SecureDeleteButton from "../ui/SecureDeleteButton";
import Card from "../ui/Card";
import { formatMoney } from "../../lib/gameUtils";
import { getMaisonVipRank } from "../../hooks/useGameActions";

const PRESET_COLORS = ["#a855f7","#ec4899","#ef4444","#f59e0b","#10b981","#3b82f6","#6366f1","#64748b"];

const VipBadge = ({ citizenId, maisonHistory }) => {
  const vip = getMaisonVipRank(citizenId, maisonHistory);
  if (!vip) return null;
  return (
    <span title={`VIP ${vip.label} — ${vip.visits} visite(s)`} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black border ${vip.bg}`}>
      <Crown size={8} /> {vip.label}
    </span>
  );
};


/* ───────────── Constantes contrats ───────────── */
const CONTRACT_FREQUENCIES = [
  { value: "daily", label: "Chaque jour RP" },
  { value: "weekly", label: "Chaque semaine RP (7 jours)" },
  { value: "monthly", label: "Chaque mois RP (1er du mois)" },
  { value: "par_tache", label: "À la tâche (paiement immédiat)" },
];

const emptyContractForm = (maisonId, maisonName) => ({
  id: "JOB-" + Date.now().toString().slice(-6),
  name: "",
  active: true,
  amount: 0,
  frequency: "monthly",
  source: { type: "COMPANY", id: maisonId },
  sourceName: maisonName,
  recipients: [],
});

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
// Éditeur de galerie générique (ajout/suppression d'images par URL) — réutilisé aussi bien
// pour la création d'un membre du personnel que pour l'édition de sa galerie existante,
// auparavant deux implémentations quasi identiques dupliquées côte à côte.
const GalleryEditor = ({ gallery = [], onAdd, onRemove, variant = "flex" }) => {
  const [url, setUrl] = useState("");
  const submit = () => {
    if (!url.trim()) return;
    onAdd(url.trim());
    setUrl("");
  };

  return (
    <>
      {gallery.length > 0 && (
        variant === "grid" ? (
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
          <div className="flex flex-wrap gap-2 mb-2">
            {gallery.map((img, i) => (
              <div key={i} className="relative group/img">
                <img src={img} alt="" className="w-14 h-14 rounded-lg object-cover border border-stone-200" />
                <button
                  onClick={() => onRemove(i)}
                  className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                >
                  <X size={8} />
                </button>
              </div>
            ))}
          </div>
        )
      )}
      <div className="flex gap-2">
        <input
          className="flex-1 p-2 border rounded-lg text-xs bg-white outline-none focus:border-fuchsia-500"
          placeholder="URL de l'image..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!url.trim()}
          className="px-3 py-2 bg-fuchsia-900 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-fuchsia-800 disabled:opacity-50 flex items-center gap-1"
        >
          <ImagePlus size={12} /> Ajouter
        </button>
      </div>
    </>
  );
};

const GalleryPanel = ({ member, onAdd, onRemove, onClose }) => {
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
      {gallery.length === 0 && (
        <p className="text-xs text-stone-400 italic mb-3">Aucune photo dans la galerie.</p>
      )}
      <GalleryEditor gallery={gallery} onAdd={onAdd} onRemove={onRemove} variant="grid" />
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
  maisonServiceCategories = [],
  maisonSubscriptions = [],
  maisonSubscriptionPrice = 50,
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
  onToggleMaisonStaffAvailability,
  onAddMaisonService,
  onUpdateMaisonService,
  onRemoveMaisonService,
  onSaveMaisonCategory,
  onDeleteMaisonCategory,
  onSetMaisonSubscriptionPrice,
  onAdminRemoveFromQueue,
}) => {
  const [activeTab, setActiveTab] = useState("staff");

  // Formulaire ajout staff
  const [selectedSlaveId, setSelectedSlaveId] = useState("");
  const [newStaffSpecialty, setNewStaffSpecialty] = useState("");
  const [newStaffPrice, setNewStaffPrice] = useState(50);
  const [newStaffDuration, setNewStaffDuration] = useState("");
  const [newStaffDescription, setNewStaffDescription] = useState("");
  // Galerie images (ajout)
  const [newStaffGallery, setNewStaffGallery] = useState([]);

  // Édition d'un membre existant
  const [editingId, setEditingId] = useState(null);
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editGallery, setEditGallery] = useState([]);

  // Gestion onglet Contrats
  const [contractForm, setContractForm] = useState(null);
  const [selectedContractId, setSelectedContractId] = useState(null);

  // Gestion galerie séparée (en dehors du mode edit)
  const [galleryMemberId, setGalleryMemberId] = useState(null);

  // Durée par défaut (local)
  const [draftDefaultDuration, setDraftDefaultDuration] = useState(
    String(maisonDefaultDuration)
  );

  // Filtre avis
  const [reviewFilter, setReviewFilter] = useState("all");

  // Catégories
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#a855f7");

  // Services par staff
  const [serviceExpandedId, setServiceExpandedId] = useState(null);
  const [newSvcForm, setNewSvcForm] = useState({ name: "", categoryId: "", price: "", duration: "", description: "" });
  const [editingSvcId, setEditingSvcId] = useState(null);
  const [editingSvcForm, setEditingSvcForm] = useState({});

  // Abonnement
  const [draftSubPrice, setDraftSubPrice] = useState(String(maisonSubscriptionPrice));

  // Staff search + sort
  const [staffSearch, setStaffSearch] = useState("");
  const [staffSort, setStaffSort] = useState("name"); // name | rating | visits | price

  // Historique
  const [histStaffFilter, setHistStaffFilter] = useState("all");
  const [histSearch, setHistSearch] = useState("");

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
      price: parseFloat(newStaffPrice),
      sessionDuration: newStaffDuration ? parseInt(newStaffDuration) : undefined,
      specialtyDescription: newStaffDescription || "",
      gallery: newStaffGallery.length > 0 ? [...newStaffGallery] : [],
      isBusy: false,
      isAvailable: true,
      services: [],
    };

    onUpdateStaff([...staff, newWorker]);
    setSelectedSlaveId("");
    setNewStaffSpecialty("");
    setNewStaffPrice(50);
    setNewStaffDuration("");
    setNewStaffDescription("");
    setNewStaffGallery([]);
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
            price: parseFloat(editPrice) || 0,
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
    { id: "categories", label: "Catégories", icon: Layers, count: maisonServiceCategories.length || undefined },
    { id: "clients", label: "Clients", icon: Users, count: houseRegistry.length },
    { id: "history", label: "Historique", icon: History, count: maisonHistory.length || undefined },
    { id: "reviews", label: "Avis", icon: MessageSquare, count: maisonReviews.length },
    { id: "finances", label: "Finances", icon: Wallet },
    {
      id: "contracts",
      label: "Contrats",
      icon: ScrollText,
      count: (jobs || []).filter((c) => c.source?.id === maisonCompanyId).length || undefined,
    },
  ];

  return (
    <div className="h-full flex flex-col bg-stone-100 rounded-xl overflow-hidden border border-stone-300 font-sans">
      {/* HEADER */}
      <div className="bg-fuchsia-900 text-white shadow-md z-10">
        <div className="px-6 pt-5 pb-3 flex justify-between items-center">
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
          <button
            onClick={handlePurge}
            className="px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all text-red-300 hover:text-white hover:bg-red-600/50"
            title="Purger toutes les données de la Maison"
          >
            <Trash2 size={14} /> Purger
          </button>
        </div>

        {/* TABS — full width, flex-wrap sur mobile */}
        <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-1 bg-fuchsia-950/50 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-0 px-2 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-fuchsia-900 shadow"
                    : "text-fuchsia-300 hover:text-white"
                }`}
              >
                <tab.icon size={13} />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] ${
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
          </div>
        </div>
      </div>

      {/* KPI BAR */}
      <div className="bg-fuchsia-950/40 border-b border-fuchsia-800/50 px-6 py-2 flex flex-wrap gap-4 text-[11px]">
        {[
          { label: "Disponibles", value: staff.filter((s) => s.isAvailable !== false && !houseRegistry.find((r) => r.staffId === s.id)).length, color: "text-green-300" },
          { label: "Occupés", value: houseRegistry.length, color: "text-red-300" },
          { label: "En attente", value: maisonQueue.length, color: "text-amber-300" },
          { label: "Total visites", value: maisonHistory.length, color: "text-fuchsia-300" },
          ...(stats.totalReviews > 0 ? [{ label: "Note moy.", value: `★ ${stats.avgRating.toFixed(1)}`, color: "text-yellow-300" }] : []),
          { label: "Abonnés actifs", value: (maisonSubscriptions || []).filter((s) => s.expiresAt > Date.now()).length, color: "text-sky-300" },
        ].map((kpi) => (
          <div key={kpi.label} className="flex items-center gap-1.5">
            <span className="text-fuchsia-400/60">{kpi.label}</span>
            <span className={`font-black ${kpi.color}`}>{kpi.value}</span>
          </div>
        ))}
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
                    type="number" step="0.1"
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
                <GalleryEditor
                  gallery={newStaffGallery}
                  onAdd={(url) => setNewStaffGallery([...newStaffGallery, url])}
                  onRemove={(idx) => setNewStaffGallery(newStaffGallery.filter((_, i) => i !== idx))}
                />
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

            {/* Barre de recherche + tri du staff */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-3 text-stone-400" />
                <input
                  className="w-full p-2.5 pl-9 border rounded-xl text-sm bg-white outline-none focus:border-fuchsia-500"
                  placeholder="Rechercher un pensionnaire..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                />
                {staffSearch && (
                  <button onClick={() => setStaffSearch("")} className="absolute right-3 top-3 text-stone-400 hover:text-stone-600">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown size={13} className="text-stone-400" />
                <select
                  className="p-2.5 border rounded-xl text-sm bg-white outline-none focus:border-fuchsia-500"
                  value={staffSort}
                  onChange={(e) => setStaffSort(e.target.value)}
                >
                  <option value="name">Trier par nom</option>
                  <option value="rating">Trier par note</option>
                  <option value="visits">Trier par visites</option>
                  <option value="price">Trier par prix</option>
                  <option value="available">Disponibles en tête</option>
                </select>
              </div>
            </div>

            {/* Liste du Staff */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                const staffReviewMap = {};
                const staffVisitMap = {};
                maisonReviews.forEach((r) => {
                  if (!staffReviewMap[r.staffId]) staffReviewMap[r.staffId] = [];
                  staffReviewMap[r.staffId].push(r.rating);
                });
                maisonHistory.forEach((h) => {
                  staffVisitMap[h.staffId] = (staffVisitMap[h.staffId] || 0) + 1;
                });
                const avg = (sid) => {
                  const ratings = staffReviewMap[sid] || [];
                  return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : -1;
                };
                const sortedFiltered = [...staff]
                  .filter((s) => {
                    if (!staffSearch) return true;
                    const q = staffSearch.toLowerCase();
                    return (s.name || "").toLowerCase().includes(q) || (s.specialty || "").toLowerCase().includes(q);
                  })
                  .sort((a, b) => {
                    if (staffSort === "rating") return avg(b.id) - avg(a.id);
                    if (staffSort === "visits") return (staffVisitMap[b.id] || 0) - (staffVisitMap[a.id] || 0);
                    if (staffSort === "price") return (b.price || 0) - (a.price || 0);
                    if (staffSort === "available") {
                      const aBusy = houseRegistry.some((r) => r.staffId === a.id) ? 1 : 0;
                      const bBusy = houseRegistry.some((r) => r.staffId === b.id) ? 1 : 0;
                      return aBusy - bBusy;
                    }
                    return (a.name || "").localeCompare(b.name || "");
                  });
                return sortedFiltered.map((member) => {
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
                                type="number" step="0.1"
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs text-fuchsia-600 font-medium">
                              {member.specialty}
                            </p>
                            {member.isAvailable === false && (
                              <span className="text-[9px] bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                                <ShieldOff size={8} /> Indisponible
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-stone-400 font-mono">
                              {formatMoney(member.price)}
                            </span>
                            <span className="text-[10px] text-stone-400 flex items-center gap-1">
                              <Clock size={10} /> {effectiveDuration} min
                            </span>
                            {(member.services || []).length > 0 && (
                              <span className="text-[9px] bg-fuchsia-100 text-fuchsia-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                <Wrench size={8} /> {member.services.length} svc
                              </span>
                            )}
                          </div>
                          {/* Contrat lié */}
                          {member.contractId && (
                            <div className="text-[9px] text-fuchsia-600 font-bold mt-0.5 truncate">
                              📄 {jobs.find((j) => j.id === member.contractId)?.name || member.contractId}
                            </div>
                          )}
                          {/* Propriétaire */}
                          {(() => {
                            const citizenProfile = citizens.find((c) => c.id === member.id);
                            const owner = citizenProfile?.ownerId ? citizens.find((c) => c.id === citizenProfile.ownerId) : null;
                            if (!owner) return null;
                            return (
                              <div className="text-[9px] text-stone-400 mt-0.5 truncate">
                                Propriétaire : <span className="font-bold text-stone-500">{owner.name}</span>
                              </div>
                            );
                          })()}
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
                          onClick={() => onToggleMaisonStaffAvailability && onToggleMaisonStaffAvailability(member.id)}
                          className={`p-1.5 rounded transition-colors ${member.isAvailable === false ? "bg-stone-200 text-stone-400 hover:bg-green-100 hover:text-green-700" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}
                          title={member.isAvailable === false ? "Marquer disponible" : "Marquer indisponible"}
                        >
                          {member.isAvailable === false ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
                        </button>
                        <button
                          onClick={() => setServiceExpandedId(serviceExpandedId === member.id ? null : member.id)}
                          className="p-1.5 bg-stone-100 text-stone-500 rounded hover:bg-fuchsia-100 hover:text-fuchsia-700 transition-colors"
                          title="Gérer les services"
                        >
                          <Wrench size={12} />
                        </button>
                        <button
                          onClick={() => setGalleryMemberId(galleryMemberId === member.id ? null : member.id)}
                          className="p-1.5 bg-stone-100 text-stone-500 rounded hover:bg-fuchsia-100 hover:text-fuchsia-700 transition-colors relative"
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
                            style={{ width: 24, height: 24, minWidth: 24, minHeight: 24, objectFit: "cover" }}
                          />
                        ))}
                        {member.gallery.length > 3 && (
                          <span className="w-6 h-6 rounded-full bg-fuchsia-200 text-fuchsia-700 flex items-center justify-center text-[8px] font-bold border border-white" style={{ width: 24, height: 24, minWidth: 24, minHeight: 24 }}>
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

                  {/* Panneau services */}
                  {serviceExpandedId === member.id && (
                    <div className="col-span-full bg-stone-50 rounded-xl border border-fuchsia-200 p-4 shadow-inner">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-black uppercase text-fuchsia-700 tracking-widest flex items-center gap-2">
                          <Wrench size={14} /> Services — {member.name} ({(member.services || []).length})
                        </h4>
                        <button onClick={() => setServiceExpandedId(null)} className="text-stone-400 hover:text-stone-600"><X size={16} /></button>
                      </div>

                      {/* Liste services existants */}
                      {(member.services || []).length === 0 ? (
                        <p className="text-xs text-stone-400 italic mb-3">Aucun service spécifique. Le prix par défaut du pensionnaire est utilisé.</p>
                      ) : (
                        <div className="space-y-2 mb-3">
                          {member.services.map((svc) => {
                            const isEditingSvc = editingSvcId === svc.id;
                            const cat = maisonServiceCategories.find((c) => c.id === svc.categoryId);
                            return (
                              <div key={svc.id} className="bg-white rounded-lg border border-stone-200 p-3">
                                {isEditingSvc ? (
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <input className="p-1.5 border rounded text-xs outline-none focus:border-fuchsia-500" value={editingSvcForm.name || ""} onChange={(e) => setEditingSvcForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nom du service" />
                                      <select className="p-1.5 border rounded text-xs outline-none focus:border-fuchsia-500" value={editingSvcForm.categoryId || ""} onChange={(e) => setEditingSvcForm((f) => ({ ...f, categoryId: e.target.value || null }))}>
                                        <option value="">Aucune catégorie</option>
                                        {maisonServiceCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                      </select>
                                      <input type="number" step="0.1" className="p-1.5 border rounded text-xs font-mono outline-none focus:border-fuchsia-500" value={editingSvcForm.price || ""} onChange={(e) => setEditingSvcForm((f) => ({ ...f, price: e.target.value }))} placeholder="Prix" />
                                      <input type="number" className="p-1.5 border rounded text-xs font-mono outline-none focus:border-fuchsia-500" value={editingSvcForm.duration || ""} onChange={(e) => setEditingSvcForm((f) => ({ ...f, duration: e.target.value }))} placeholder={`Durée (défaut: ${effectiveDuration} min)`} />
                                    </div>
                                    <input className="w-full p-1.5 border rounded text-xs outline-none focus:border-fuchsia-500" value={editingSvcForm.description || ""} onChange={(e) => setEditingSvcForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description courte" />
                                    <div className="flex gap-1.5">
                                      <button onClick={() => { if (onUpdateMaisonService) onUpdateMaisonService(member.id, svc.id, { name: editingSvcForm.name, categoryId: editingSvcForm.categoryId || null, price: parseFloat(editingSvcForm.price) || 0, duration: editingSvcForm.duration ? parseInt(editingSvcForm.duration) : null, description: editingSvcForm.description || "" }); setEditingSvcId(null); }} className="flex-1 bg-fuchsia-900 text-white py-1 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1 hover:bg-fuchsia-800"><Check size={10} /> OK</button>
                                      <button onClick={() => setEditingSvcId(null)} className="px-2 py-1 bg-stone-100 text-stone-500 rounded text-[10px] hover:bg-stone-200"><X size={10} /></button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-sm text-stone-800">{svc.name}</span>
                                        {cat && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: cat.color }}>{cat.name}</span>}
                                      </div>
                                      <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-xs text-stone-400 font-mono">{formatMoney(svc.price || 0)}</span>
                                        {svc.duration && <span className="text-[10px] text-stone-400 flex items-center gap-0.5"><Clock size={9} /> {svc.duration} min</span>}
                                        {svc.description && <span className="text-[10px] text-stone-500 italic truncate">{svc.description}</span>}
                                      </div>
                                    </div>
                                    <button onClick={() => { setEditingSvcId(svc.id); setEditingSvcForm({ name: svc.name, categoryId: svc.categoryId || "", price: String(svc.price || ""), duration: svc.duration ? String(svc.duration) : "", description: svc.description || "" }); }} className="p-1 text-stone-400 hover:text-fuchsia-600"><Pencil size={12} /></button>
                                    <button onClick={() => onRemoveMaisonService && onRemoveMaisonService(member.id, svc.id)} className="p-1 text-stone-400 hover:text-red-600"><Trash2 size={12} /></button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Formulaire ajout service */}
                      <div className="border-t border-fuchsia-200 pt-3">
                        <div className="text-[10px] font-black uppercase text-fuchsia-600 tracking-widest mb-2">Ajouter un service</div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input className="p-2 border rounded text-xs outline-none focus:border-fuchsia-500" value={newSvcForm.name} onChange={(e) => setNewSvcForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nom du service *" />
                          <select className="p-2 border rounded text-xs outline-none focus:border-fuchsia-500" value={newSvcForm.categoryId} onChange={(e) => setNewSvcForm((f) => ({ ...f, categoryId: e.target.value }))}>
                            <option value="">Aucune catégorie</option>
                            {maisonServiceCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <input type="number" step="0.1" className="p-2 border rounded text-xs font-mono outline-none focus:border-fuchsia-500" value={newSvcForm.price} onChange={(e) => setNewSvcForm((f) => ({ ...f, price: e.target.value }))} placeholder="Prix *" />
                          <input type="number" className="p-2 border rounded text-xs font-mono outline-none focus:border-fuchsia-500" value={newSvcForm.duration} onChange={(e) => setNewSvcForm((f) => ({ ...f, duration: e.target.value }))} placeholder="Durée min (optionnel)" />
                        </div>
                        <input className="w-full p-2 border rounded text-xs mb-2 outline-none focus:border-fuchsia-500" value={newSvcForm.description} onChange={(e) => setNewSvcForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description courte (optionnel)" />
                        <button
                          onClick={() => {
                            if (!newSvcForm.name.trim() || !newSvcForm.price) return;
                            if (onAddMaisonService) onAddMaisonService(member.id, { name: newSvcForm.name.trim(), categoryId: newSvcForm.categoryId || null, price: parseFloat(newSvcForm.price) || 0, duration: newSvcForm.duration ? parseInt(newSvcForm.duration) : null, description: newSvcForm.description || "" });
                            setNewSvcForm({ name: "", categoryId: "", price: "", duration: "", description: "" });
                          }}
                          disabled={!newSvcForm.name.trim() || !newSvcForm.price}
                          className="w-full bg-fuchsia-900 text-white py-2 rounded text-[10px] font-bold uppercase hover:bg-fuchsia-800 disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <Plus size={12} /> Ajouter ce service
                        </button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
                );
              });
              })()}
              {staff.length === 0 && (
                <div className="col-span-full text-center py-10 text-stone-400 italic">
                  Aucun personnel enregistré.
                </div>
              )}
              {staff.length > 0 && staffSearch && (
                <p className="col-span-full text-xs text-stone-400 italic text-center pt-2">
                  {staff.filter((s) => (s.name || "").toLowerCase().includes(staffSearch.toLowerCase()) || (s.specialty || "").toLowerCase().includes(staffSearch.toLowerCase())).length === 0
                    ? "Aucun pensionnaire ne correspond à la recherche."
                    : null}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ════════════════ ONGLET CATÉGORIES ════════════════ */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            {/* Formulaire ajout */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="text-xs font-black uppercase text-stone-400 mb-4 flex items-center gap-2">
                <Plus size={14} /> Nouvelle catégorie
              </h3>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Nom</label>
                  <input
                    className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-fuchsia-500"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Ex: Massage, Danse, Soins..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Couleur</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCatColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${catColor === c ? "border-stone-800 scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!catName.trim()) return;
                    if (onSaveMaisonCategory) onSaveMaisonCategory({ name: catName.trim(), color: catColor });
                    setCatName("");
                  }}
                  disabled={!catName.trim()}
                  className="px-4 py-2.5 bg-fuchsia-900 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-fuchsia-800 disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus size={12} /> Créer
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {maisonServiceCategories.length === 0 ? (
                <div className="col-span-full text-center py-10 text-stone-400 italic">
                  Aucune catégorie. Créez-en une pour organiser les services de vos pensionnaires.
                </div>
              ) : (
                maisonServiceCategories.map((cat) => {
                  const svcCount = staff.reduce((sum, s) => sum + (s.services || []).filter((sv) => sv.categoryId === cat.id).length, 0);
                  return (
                    <div key={cat.id} className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-4 shadow-sm">
                      <div className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-white shadow" style={{ backgroundColor: cat.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-stone-800">{cat.name}</div>
                        <div className="text-[10px] text-stone-400">{svcCount} service{svcCount !== 1 ? "s" : ""}</div>
                      </div>
                      <SecureDeleteButton onClick={() => onDeleteMaisonCategory && onDeleteMaisonCategory(cat.id)} />
                    </div>
                  );
                })
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {client.name}
                              <VipBadge citizenId={record.citizenId} maisonHistory={maisonHistory} />
                            </div>
                            {record.note && (
                              <div className="text-[10px] font-normal text-stone-500 italic mt-0.5 flex items-start gap-1 max-w-xs">
                                <MessageSquare size={10} className="shrink-0 mt-0.5" /> « {record.note} »
                              </div>
                            )}
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
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {maisonQueue.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {client.name}
                                <VipBadge citizenId={q.citizenId} maisonHistory={maisonHistory} />
                              </div>
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
                            <td className="p-4 text-right">
                              <SecureDeleteButton
                                label="Retirer"
                                icon={X}
                                onClick={() => onAdminRemoveFromQueue && onAdminRemoveFromQueue(q.citizenId, q.staffId)}
                              />
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

        {/* ════════════════ ONGLET HISTORIQUE ════════════════ */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* Filtres */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-3 text-stone-400" />
                <input
                  className="w-full p-2.5 pl-9 border rounded-xl text-sm bg-white outline-none focus:border-fuchsia-500"
                  placeholder="Rechercher un client..."
                  value={histSearch}
                  onChange={(e) => setHistSearch(e.target.value)}
                />
                {histSearch && (
                  <button onClick={() => setHistSearch("")} className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"><X size={14} /></button>
                )}
              </div>
              <select
                className="p-2.5 border rounded-xl text-sm bg-white outline-none focus:border-fuchsia-500"
                value={histStaffFilter}
                onChange={(e) => setHistStaffFilter(e.target.value)}
              >
                <option value="all">Tous les pensionnaires</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Table historique */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest flex items-center gap-2">
                  <History size={14} /> Sessions passées ({maisonHistory.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-100 text-stone-500 uppercase text-[10px] tracking-widest font-black">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Client</th>
                      <th className="p-4">Pensionnaire</th>
                      <th className="p-4 text-center">Durée</th>
                      <th className="p-4 text-right">Prix payé</th>
                      <th className="p-4 text-center">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(() => {
                      const filtered = [...maisonHistory]
                        .filter((h) => {
                          const matchStaff = histStaffFilter === "all" || h.staffId === histStaffFilter;
                          const matchSearch = !histSearch || (h.citizenName || "").toLowerCase().includes(histSearch.toLowerCase());
                          return matchStaff && matchSearch;
                        })
                        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan="6" className="p-8 text-center text-stone-400 italic">
                              {maisonHistory.length === 0 ? "Aucune session enregistrée." : "Aucun résultat pour ces filtres."}
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((h) => {
                        const review = maisonReviews.find((r) => r.citizenId === h.citizenId && r.staffId === h.staffId && Math.abs((r.timestamp || 0) - (h.timestamp || 0)) < 86400000);
                        const citizenProfile = citizens.find((c) => c.id === h.citizenId);
                        return (
                          <tr key={h.id || `${h.citizenId}-${h.timestamp}`} className="hover:bg-stone-50">
                            <td className="p-4 text-xs text-stone-500 font-mono whitespace-nowrap">
                              {h.timestamp
                                ? new Date(h.timestamp).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
                                : "—"}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {(citizenProfile?.avatarUrl || h.citizenAvatarUrl) && (
                                  <img src={citizenProfile?.avatarUrl || h.citizenAvatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-stone-200" style={{ width: 28, height: 28, minWidth: 28, minHeight: 28, objectFit: "cover" }} />
                                )}
                                <div>
                                  <div className="font-bold text-stone-800 flex items-center gap-1.5 flex-wrap">
                                    {h.citizenName || "Inconnu"}
                                    <VipBadge citizenId={h.citizenId} maisonHistory={maisonHistory} />
                                  </div>
                                  {h.note && (
                                    <div className="text-[10px] text-stone-500 italic mt-0.5 flex items-start gap-1 max-w-xs">
                                      <MessageSquare size={9} className="shrink-0 mt-0.5" /> « {h.note} »
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-fuchsia-700 font-medium">{h.staffName || "—"}</td>
                            <td className="p-4 text-center text-xs text-stone-500 font-mono">
                              {h.duration ? `${h.duration} min` : "—"}
                            </td>
                            <td className="p-4 text-right font-mono font-bold text-green-700">
                              {h.pricePaid != null ? formatMoney(h.pricePaid) : "—"}
                            </td>
                            <td className="p-4 text-center">
                              {review ? (
                                <span className="flex items-center justify-center gap-1" title={review.comment || ""}>
                                  <Stars rating={review.rating} size={10} />
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-300 italic">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ ONGLET 3 : AVIS ════════════════ */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            {/* Histogramme des notes */}
            {maisonReviews.length > 0 && (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
                <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3 flex items-center gap-2">
                  <BarChart3 size={12} /> Distribution des notes
                </div>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = maisonReviews.filter((r) => Math.round(r.rating) === star).length;
                    const pct = maisonReviews.length > 0 ? (count / maisonReviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <div className="flex items-center gap-0.5 w-14 shrink-0">
                          {[...Array(star)].map((_, i) => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
                        </div>
                        <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-stone-500 font-mono w-14 shrink-0 text-right">
                          {count} ({Math.round(pct)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

            const now = Date.now();
            const activeSubsCount = (maisonSubscriptions || []).filter((s) => s.expiresAt > now).length;

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
                            {formatMoney((c.balance || 0))})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Abonnements */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                  <h3 className="text-xs font-black uppercase text-stone-400 mb-4 flex items-center gap-2">
                    <Crown size={14} /> Abonnements VIP
                  </h3>
                  <div className="flex flex-wrap gap-6 items-end">
                    <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-200">
                      <div className="text-[10px] font-black uppercase text-fuchsia-500 tracking-widest mb-1">Abonnés actifs</div>
                      <div className="text-2xl font-black text-fuchsia-800">{activeSubsCount}</div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Prix de l'abonnement (Écus / 30 jours)</label>
                      <div className="flex gap-2">
                        <input
                          type="number" step="0.1" min="1"
                          className="flex-1 p-2.5 border rounded-lg text-sm font-mono outline-none focus:border-fuchsia-500"
                          value={draftSubPrice}
                          onChange={(e) => setDraftSubPrice(e.target.value)}
                        />
                        <button
                          onClick={() => { if (onSetMaisonSubscriptionPrice) onSetMaisonSubscriptionPrice(draftSubPrice); }}
                          className="px-3 py-2 bg-fuchsia-900 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-fuchsia-800 flex items-center gap-1"
                        >
                          <Check size={12} /> OK
                        </button>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">Les abonnés bénéficient de -10% sur toutes les réservations.</p>
                    </div>
                  </div>

                  {/* Liste des abonnés */}
                  {(maisonSubscriptions || []).length > 0 && (
                    <div className="mt-4 border-t border-stone-200 pt-4">
                      <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3 flex items-center gap-2">
                        <Users size={12} /> Liste des abonnés ({(maisonSubscriptions || []).length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {[...(maisonSubscriptions || [])]
                          .sort((a, b) => (b.expiresAt || 0) - (a.expiresAt || 0))
                          .map((sub) => {
                            const citizen = citizens.find((c) => c.id === sub.citizenId);
                            const isActive = sub.expiresAt > Date.now();
                            const expiresDate = new Date(sub.expiresAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
                            return (
                              <div key={sub.citizenId} className={`flex items-center gap-3 p-3 rounded-lg border ${isActive ? "bg-fuchsia-50 border-fuchsia-200" : "bg-stone-50 border-stone-200 opacity-60"}`}>
                                {citizen?.avatarUrl && <img src={citizen.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-fuchsia-200 shrink-0" style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, objectFit: "cover" }} />}
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-sm text-stone-800 truncate">{citizen?.name || sub.citizenId}</div>
                                  <div className="flex items-center gap-1.5">
                                    <CalendarDays size={9} className={isActive ? "text-fuchsia-400" : "text-stone-400"} />
                                    <span className={`text-[10px] font-mono ${isActive ? "text-fuchsia-600" : "text-stone-400"}`}>
                                      {isActive ? `Expire le ${expiresDate}` : `Expiré le ${expiresDate}`}
                                    </span>
                                  </div>
                                </div>
                                {isActive && <Crown size={12} className="text-fuchsia-400 shrink-0" />}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
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
                        <div className="text-2xl font-mono font-black text-fuchsia-800">
                          {formatMoney(linkedCompany.balance || 0)}
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
                          {formatMoney(Math.floor(totalStaffPrices * 0.8))}
                        </div>
                        <div className="text-[9px] text-stone-400">
                          (80% de {formatMoney(totalStaffPrices)})
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
                                    {formatMoney(Math.floor(
                                      (data.revenue || 0) * 0.8
                                    ))}
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
        {activeTab === "contracts" && (() => {
          const linkedCompany = maisonCompanyId
            ? companies.find((c) => c.id === maisonCompanyId)
            : null;

          const maisonContracts = (jobs || []).filter(
            (c) => c.source?.id === maisonCompanyId
          );

          // Pool des bénéficiaires : pensionnaires en tête, puis tous les
          // citoyens, puis toutes les entreprises (propriétaires externes inclus)
          const staffIds = new Set(staff.map((s) => s.id));
          const workerPool = [
            // Pensionnaires en premier
            ...staff.map((s) => ({ id: s.id, type: "CITIZEN", name: s.name + " (pensionnaire)" })),
            // Tous les autres citoyens
            ...(citizens || [])
              .filter((c) => !staffIds.has(c.id))
              .map((c) => ({ id: c.id, type: "CITIZEN", name: c.name })),
            // Toutes les entreprises
            ...(companies || []).map((c) => ({
              id: c.id,
              type: "COMPANY",
              name: c.id === maisonCompanyId
                ? c.name + " (trésorerie Maison)"
                : c.name + " (entreprise)",
            })),
          ];

          const form = contractForm;
          const isParTache = form?.frequency === "par_tache";
          const totalPct = (form?.recipients || []).reduce((s, r) => s + (r.percent || 0), 0);
          const isValid =
            form &&
            form.name.trim() &&
            (isParTache || form.amount > 0) &&
            form.recipients.length > 0 &&
            totalPct === 100;

          const openNew = () => {
            if (!maisonCompanyId) return;
            setContractForm(emptyContractForm(maisonCompanyId, linkedCompany?.name || "Maison Asia"));
            setSelectedContractId(null);
          };

          const openEdit = (contract) => {
            setContractForm(JSON.parse(JSON.stringify(contract)));
            setSelectedContractId(contract.id);
          };

          const handleSave = () => {
            if (!isValid || !onSaveJobContract) return;
            onSaveJobContract(form);
            setContractForm(null);
            setSelectedContractId(null);
          };

          const handleDelete = (id) => {
            if (!window.confirm("Supprimer ce contrat ?")) return;
            if (onDeleteJobContract) onDeleteJobContract(id);
            if (selectedContractId === id) { setContractForm(null); setSelectedContractId(null); }
          };

          const addRecipient = (worker) => {
            if (!form) return;
            if (form.recipients.some((r) => r.id === worker.id)) return;
            const existing = form.recipients.reduce((s, r) => s + (r.percent || 0), 0);
            setContractForm((f) => ({
              ...f,
              recipients: [...f.recipients, { ...worker, percent: Math.max(0, 100 - existing) }],
            }));
          };

          const updatePct = (id, val) => {
            const num = Math.min(100, Math.max(0, parseInt(val) || 0));
            setContractForm((f) => ({
              ...f,
              recipients: f.recipients.map((r) => (r.id === id ? { ...r, percent: num } : r)),
            }));
          };

          const removeRecipient = (id) => {
            setContractForm((f) => ({ ...f, recipients: f.recipients.filter((r) => r.id !== id) }));
          };

          return (
            <div className="space-y-4">
              {!maisonCompanyId && (
                <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-bold">
                  <AlertTriangle size={16} /> Aucune entreprise liée à la Maison. Configurez-en une dans l'onglet Finances pour gérer les contrats.
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-6 min-h-0">
                {/* Liste des contrats */}
                <div className="w-full md:w-72 shrink-0 bg-[#fdf6e3] rounded-xl border border-stone-300 flex flex-col overflow-hidden shadow-md">
                  <div className="p-3 bg-fuchsia-900 border-b border-fuchsia-800 flex justify-between items-center font-bold uppercase text-[10px] tracking-widest text-fuchsia-200">
                    <span>Contrats ({maisonContracts.length})</span>
                    <button
                      onClick={openNew}
                      disabled={!maisonCompanyId}
                      className="bg-fuchsia-700 text-white w-6 h-6 rounded-lg flex items-center justify-center hover:bg-fuchsia-600 shadow-md disabled:opacity-40"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {maisonContracts.length === 0 && (
                      <div className="text-center text-stone-400 italic text-xs py-8">
                        Aucun contrat.<br />
                        <span className="text-[10px]">Cliquez sur + pour en créer un.</span>
                      </div>
                    )}
                    {maisonContracts.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => openEdit(c)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedContractId === c.id
                            ? "bg-fuchsia-900 text-white border-fuchsia-600 shadow-xl"
                            : "bg-white/70 border-stone-200 hover:bg-white hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-black text-sm truncate">{c.name || "Sans nom"}</div>
                            <div className={`text-[10px] mt-0.5 ${selectedContractId === c.id ? "text-fuchsia-300" : "text-stone-500"}`}>
                              {c.frequency !== "par_tache" && `${formatMoney(c.amount || 0)} · `}
                              {CONTRACT_FREQUENCIES.find((f) => f.value === c.frequency)?.label || c.frequency}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); if (onToggleJobContract) onToggleJobContract(c.id); }}
                              className={`p-1 rounded ${c.active ? "text-green-500" : "text-stone-400"}`}
                            >
                              {c.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                              className="p-1 text-red-400 hover:text-red-600 rounded"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(c.recipients || []).map((r) => (
                            <span key={r.id} className={`px-1 py-0.5 rounded text-[8px] font-bold ${selectedContractId === c.id ? "bg-fuchsia-800 text-fuchsia-200" : "bg-stone-100 text-stone-600"}`}>
                              {r.name} {r.percent}%
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formulaire */}
                <div className="flex-1 min-h-0">
                  {!form ? (
                    <div className="h-full flex flex-col items-center justify-center text-stone-300 gap-4 italic min-h-[200px]">
                      <ScrollText size={60} className="opacity-10" />
                      <p className="text-lg tracking-widest opacity-30 uppercase font-serif text-sm">Contrats d'Emploi</p>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-10">
                      {/* Header */}
                      <div className="bg-fuchsia-900 text-white rounded-xl p-4 flex items-center justify-between shadow-lg">
                        <div>
                          <div className="text-[9px] uppercase tracking-widest text-fuchsia-400 mb-1">
                            {selectedContractId ? "Modifier" : "Nouveau contrat"}
                          </div>
                          <div className="font-black">{form.name || "Sans nom"}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setContractForm(null); setSelectedContractId(null); }}
                            className="px-3 py-1.5 bg-fuchsia-800 text-fuchsia-300 rounded-lg text-[10px] font-bold uppercase hover:bg-fuchsia-700"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={!isValid}
                            className="px-3 py-1.5 bg-fuchsia-400 text-fuchsia-950 rounded-lg text-[10px] font-black uppercase hover:bg-fuchsia-300 disabled:opacity-40 flex items-center gap-1"
                          >
                            <Check size={13} /> Sauvegarder
                          </button>
                        </div>
                      </div>

                      {/* Identité */}
                      <Card title="Identité du Contrat" icon={ScrollText}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Nom</label>
                            <input
                              className="w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none focus:border-fuchsia-500 font-bold"
                              value={form.name}
                              onChange={(e) => setContractForm((f) => ({ ...f, name: e.target.value }))}
                              placeholder="Ex : Rétribution mensuelle, Prime de prestation…"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">
                              {isParTache ? "Montant / session (info)" : "Montant total (Écus)"}
                            </label>
                            <input
                              type="number" step="0.1" min={0}
                              className="w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none focus:border-fuchsia-500 font-bold font-mono"
                              value={form.amount || ""}
                              onChange={(e) => setContractForm((f) => ({ ...f, amount: parseInt(e.target.value) || 0 }))}
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Fréquence</label>
                            <select
                              className="w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none font-bold"
                              value={form.frequency}
                              onChange={(e) => setContractForm((f) => ({ ...f, frequency: e.target.value }))}
                            >
                              {CONTRACT_FREQUENCIES.map((f) => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-2 flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                            <button
                              onClick={() => setContractForm((f) => ({ ...f, active: !f.active }))}
                              className={`text-2xl transition-colors ${form.active ? "text-green-500" : "text-stone-300"}`}
                            >
                              {form.active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                            </button>
                            <span className="text-sm font-bold text-stone-700">
                              {form.active ? "Actif — sera exécuté au prochain passage de jour" : "Inactif"}
                            </span>
                          </div>
                        </div>
                      </Card>

                      {/* Source */}
                      <div className="flex items-center gap-2 p-3 bg-fuchsia-50 border border-fuchsia-200 rounded-xl text-xs text-fuchsia-700 font-bold">
                        <Gem size={14} /> Source : Trésorerie de <span className="text-fuchsia-900 ml-1">{linkedCompany?.name || "Maison Asia"}</span>
                      </div>

                      {/* Bénéficiaires */}
                      <Card title="Répartition entre Bénéficiaires" icon={Users}>
                        <div className="space-y-4">
                          {/* Indicateur total % */}
                          <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
                            totalPct === 100 ? "bg-green-50 border-green-200" : totalPct > 100 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                          }`}>
                            <div className="flex items-center gap-2">
                              <RefreshCw size={13} className={totalPct === 100 ? "text-green-600" : "text-amber-500"} />
                              <span className="text-xs font-black uppercase text-stone-600">Total</span>
                            </div>
                            <span className={`font-black font-mono ${totalPct === 100 ? "text-green-700" : totalPct > 100 ? "text-red-700" : "text-amber-700"}`}>
                              {totalPct}%
                              {totalPct !== 100 && (
                                <span className="text-[10px] font-bold ml-1">
                                  {totalPct < 100 ? `(manque ${100 - totalPct}%)` : `(excède de ${totalPct - 100}%)`}
                                </span>
                              )}
                            </span>
                          </div>

                          {totalPct !== 100 && form.recipients.length > 0 && (
                            <div className="flex items-center gap-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                              <AlertTriangle size={11} /> Le total doit être 100% pour sauvegarder.
                            </div>
                          )}

                          {/* Liste des bénéficiaires */}
                          {form.recipients.length === 0 ? (
                            <p className="text-xs text-stone-400 italic text-center py-3">Aucun bénéficiaire ajouté.</p>
                          ) : (
                            <div className="space-y-2">
                              {form.recipients.map((r) => {
                                const share = Math.floor((form.amount || 0) * r.percent / 100);
                                return (
                                  <div key={r.id} className="flex items-center gap-3 p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-sm text-stone-800 truncate">{r.name}</div>
                                      {!isParTache && (
                                        <div className="text-[10px] text-stone-400 font-mono">
                                          = {formatMoney(share)} / versement
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number" min={0} max={100}
                                        className="w-14 p-1.5 border-2 border-stone-200 rounded-lg text-center font-black outline-none focus:border-fuchsia-500 font-mono text-sm"
                                        value={r.percent}
                                        onChange={(e) => updatePct(r.id, e.target.value)}
                                      />
                                      <span className="text-xs font-bold text-stone-500">%</span>
                                      <button onClick={() => removeRecipient(r.id)} className="p-1 text-red-400 hover:text-red-600">
                                        <X size={13} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Ajouter un bénéficiaire */}
                          <div className="border-t border-stone-200 pt-3">
                            <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-2">
                              Ajouter un bénéficiaire
                            </label>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {workerPool
                                .filter((w) => !form.recipients.some((r) => r.id === w.id))
                                .map((w) => (
                                  <button
                                    key={w.id}
                                    onClick={() => addRecipient(w)}
                                    className="w-full text-left p-2.5 rounded-lg hover:bg-fuchsia-50 flex items-center gap-2 transition-colors border border-stone-100"
                                  >
                                    {w.type === "COMPANY"
                                      ? <Building2 size={12} className="text-fuchsia-400 shrink-0" />
                                      : <Heart size={12} className="text-fuchsia-400 shrink-0" />}
                                    <span className="font-bold text-sm text-stone-800 truncate">{w.name}</span>
                                    <Plus size={12} className="text-stone-400 ml-auto shrink-0" />
                                  </button>
                                ))}
                              {workerPool.filter((w) => !form.recipients.some((r) => r.id === w.id)).length === 0 && (
                                <p className="text-xs text-stone-400 italic text-center py-2">Tous les bénéficiaires disponibles sont déjà ajoutés.</p>
                              )}
                            </div>
                          </div>

                          {/* Simulation */}
                          {!isParTache && form.amount > 0 && form.recipients.length > 0 && totalPct === 100 && (
                            <div className="bg-fuchsia-900 rounded-xl p-3 text-fuchsia-100">
                              <div className="text-[9px] uppercase tracking-widest text-fuchsia-400 mb-2 font-black">
                                Simulation — par versement
                              </div>
                              <div className="space-y-1">
                                {form.recipients.map((r) => (
                                  <div key={r.id} className="flex justify-between text-sm">
                                    <span className="text-fuchsia-300 truncate">{r.name}</span>
                                    <span className="font-black font-mono text-fuchsia-200 shrink-0 ml-2">
                                      +{formatMoney(Math.floor(form.amount * r.percent / 100))}
                                    </span>
                                  </div>
                                ))}
                                <div className="border-t border-fuchsia-800 pt-1.5 mt-1.5 flex justify-between text-xs font-black">
                                  <span className="text-fuchsia-400 uppercase tracking-widest">Total prélevé</span>
                                  <span className="text-white font-mono">{formatMoney(form.amount)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
};

export default MaisonDeAsiaAdmin;
