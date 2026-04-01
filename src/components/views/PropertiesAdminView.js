import React, { useState, useMemo } from "react";
import {
  Plus, MapPin, Pencil, X, Save, Home, User, Globe, Key, UserX,
  Search, Filter, Building2, Coins, TrendingUp, ChevronDown, ChevronUp,
  ShieldAlert, DoorOpen, Ban, Tag, RotateCcw, Eye, Users as UsersIcon,
  Hammer, ShoppingBag, Utensils, Wheat, Castle,
} from "lucide-react";
import Card from "../ui/Card";
import SecureDeleteButton from "../ui/SecureDeleteButton";
import UserSearchSelect from "../ui/UserSearchSelect";

const PROPERTY_TYPES = {
  MAISON: { label: "Maison", icon: Home, color: "bg-stone-100 text-stone-600" },
  DOMAINE: { label: "Domaine", icon: Castle, color: "bg-purple-100 text-purple-600" },
  TERRAIN: { label: "Terrain", icon: MapPin, color: "bg-green-100 text-green-600" },
  COMMERCE: { label: "Local Commercial", icon: ShoppingBag, color: "bg-cyan-100 text-cyan-600" },
  FERME: { label: "Ferme", icon: Wheat, color: "bg-amber-100 text-amber-600" },
  MANOIR: { label: "Manoir / Château", icon: Castle, color: "bg-yellow-100 text-yellow-700" },
  ATELIER: { label: "Atelier", icon: Hammer, color: "bg-orange-100 text-orange-600" },
  AUBERGE: { label: "Auberge / Taverne", icon: Utensils, color: "bg-rose-100 text-rose-600" },
};

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-3 shadow-sm">
    <div className={`p-2.5 rounded-lg ${color}`}><Icon size={18} /></div>
    <div className="min-w-0">
      <div className="text-[9px] uppercase font-black tracking-widest text-stone-400">{label}</div>
      <div className="text-xl font-black font-mono text-stone-800">{value}</div>
      {sub && <div className="text-[9px] text-stone-400">{sub}</div>}
    </div>
  </div>
);

const Badge = ({ children, color = "bg-stone-100 text-stone-600" }) => (
  <span className={`${color} px-2 py-0.5 rounded text-[9px] font-bold uppercase inline-flex items-center gap-1`}>
    {children}
  </span>
);

const Label = ({ children }) => (
  <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-1">{children}</label>
);

const PropertiesAdminView = ({
  properties = [],
  countries = [],
  citizens = [],
  companies = [],
  onCreateProperty,
  onDeleteProperty,
  onEditProperty,
}) => {
  // Création
  const [showCreate, setShowCreate] = useState(false);
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

  // Panneau détail
  const [expandedId, setExpandedId] = useState(null);

  // Filtres
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, OWNED, AVAILABLE, RENTED, FOR_SALE, COMPANY

  // Régions du pays sélectionné
  const newRegions = useMemo(() => {
    const c = countries.find((c) => c.id === newCountryId);
    return c?.regions || [];
  }, [countries, newCountryId]);

  const editRegions = useMemo(() => {
    if (!editForm.countryId) return [];
    const c = countries.find((c) => c.id === editForm.countryId);
    return c?.regions || [];
  }, [countries, editForm.countryId]);

  // Stats
  const stats = useMemo(() => {
    const total = properties.length;
    const owned = properties.filter((p) => p.ownerId).length;
    const available = total - owned;
    const totalValue = properties.reduce((s, p) => s + (p.price || 0), 0);
    const rented = properties.filter((p) => p.rental && p.rental.tenantId).length;
    const forSale = properties.filter((p) => p.forSale).length;
    const companyOwned = properties.filter((p) => p.ownerType === "COMPANY").length;
    return { total, owned, available, totalValue, rented, forSale, companyOwned };
  }, [properties]);

  // Filtrage
  const filtered = useMemo(() => {
    let result = [...properties];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.ownerName || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.location || "").toLowerCase().includes(q)
      );
    }
    if (filterType !== "ALL") result = result.filter((p) => p.type === filterType);
    if (filterStatus === "OWNED") result = result.filter((p) => p.ownerId && p.ownerType !== "COMPANY");
    if (filterStatus === "AVAILABLE") result = result.filter((p) => !p.ownerId);
    if (filterStatus === "RENTED") result = result.filter((p) => p.rental && p.rental.tenantId);
    if (filterStatus === "FOR_SALE") result = result.filter((p) => p.forSale);
    if (filterStatus === "COMPANY") result = result.filter((p) => p.ownerType === "COMPANY");
    return result;
  }, [properties, search, filterType, filterStatus]);

  const getLocationLabel = (prop) => {
    const country = countries.find((c) => c.id === prop.countryId);
    if (!country) return prop.location || "—";
    const region = (country.regions || []).find((r) => r.id === prop.regionId);
    return region ? `${region.name}, ${country.name}` : country.name;
  };

  const getOwnerDisplay = (prop) => {
    if (prop.ownerType === "COMPANY") {
      const comp = companies.find((c) => c.id === prop.ownerId);
      return { name: comp ? comp.name : prop.ownerName || "?", type: "COMPANY", owner: comp };
    }
    if (prop.ownerId) {
      const cit = citizens.find((c) => c.id === prop.ownerId);
      return { name: cit ? cit.name : prop.ownerName || "?", type: "CITIZEN", owner: cit };
    }
    return { name: null, type: null, owner: null };
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
    setNewName(""); setNewType("MAISON"); setNewCountryId(""); setNewRegionId("");
    setNewPrice(""); setNewIncome("0"); setNewDescription(""); setShowCreate(false);
  };

  const startEdit = (prop) => {
    setEditingId(prop.id);
    setEditForm({
      name: prop.name || "", type: prop.type || "MAISON",
      description: prop.description || "", price: prop.price || 0,
      income: prop.income || 0, countryId: prop.countryId || "",
      regionId: prop.regionId || "", ownerId: prop.ownerId || "",
      ownerType: prop.ownerType || "CITIZEN",
    });
  };

  const saveEdit = () => {
    const country = countries.find((c) => c.id === editForm.countryId);
    const region = country ? (country.regions || []).find((r) => r.id === editForm.regionId) : null;
    let ownerName = null;
    let ownerType = null;
    if (editForm.ownerId) {
      if (editForm.ownerType === "COMPANY") {
        const comp = companies.find((c) => c.id === editForm.ownerId);
        ownerName = comp ? comp.name : null;
        ownerType = "COMPANY";
      } else {
        const cit = citizens.find((c) => c.id === editForm.ownerId);
        ownerName = cit ? cit.name : null;
        ownerType = "CITIZEN";
      }
    }
    onEditProperty(editingId, {
      ...editForm,
      price: parseInt(editForm.price) || 0,
      income: parseInt(editForm.income) || 0,
      ownerId: editForm.ownerId || null,
      ownerName, ownerType,
      location: country ? (region ? `${region.name}, ${country.name}` : country.name) : "",
    });
    setEditingId(null); setEditForm({});
  };

  // Actions admin rapides (via onEditProperty)
  const adminRemoveOwner = (propId) => {
    onEditProperty(propId, {
      ownerId: null, ownerName: null, ownerType: null,
      forSale: false, salePrice: 0, rental: null,
    });
  };

  const adminCancelSale = (propId) => {
    onEditProperty(propId, { forSale: false, salePrice: 0 });
  };

  const adminCancelRental = (propId) => {
    onEditProperty(propId, { rental: null });
  };

  const adminEvictTenant = (propId) => {
    const prop = properties.find((p) => p.id === propId);
    if (!prop || !prop.rental) return;
    onEditProperty(propId, {
      rental: { ...prop.rental, tenantId: null, tenantName: null, startDate: null },
    });
  };

  const TypeIcon = ({ type, size = 14 }) => {
    const t = PROPERTY_TYPES[type];
    if (!t) return <Home size={size} />;
    const Ic = t.icon;
    return <Ic size={size} />;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* --- Stats --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard icon={Home} label="Total" value={stats.total} color="bg-stone-100 text-stone-600" />
        <StatCard icon={Key} label="Possédées" value={stats.owned} color="bg-blue-100 text-blue-600" />
        <StatCard icon={Tag} label="Disponibles" value={stats.available} color="bg-green-100 text-green-600" />
        <StatCard icon={Coins} label="Valeur totale" value={`${stats.totalValue.toLocaleString()}`} color="bg-yellow-100 text-yellow-700" sub="Écus" />
        <StatCard icon={DoorOpen} label="En location" value={stats.rented} color="bg-sky-100 text-sky-600" />
        <StatCard icon={TrendingUp} label="En vente" value={stats.forSale} color="bg-rose-100 text-rose-600" />
        <StatCard icon={Building2} label="Entreprises" value={stats.companyOwned} color="bg-indigo-100 text-indigo-600" />
      </div>

      {/* --- Barre d'action --- */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs uppercase transition-all ${
            showCreate
              ? "bg-stone-800 text-yellow-400 shadow-lg"
              : "bg-stone-900 text-yellow-500 hover:bg-stone-700"
          }`}
        >
          {showCreate ? <X size={14} /> : <Plus size={14} />}
          {showCreate ? "Fermer" : "Nouveau bien"}
        </button>

        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="w-full pl-9 pr-3 py-2.5 border border-stone-200 rounded-lg text-sm bg-white focus:border-stone-400 outline-none"
            placeholder="Rechercher par nom, propriétaire, lieu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-stone-400" />
          <select
            className="p-2 border rounded-lg text-xs bg-white font-bold text-stone-600"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">Tous types</option>
            {Object.entries(PROPERTY_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            className="p-2 border rounded-lg text-xs bg-white font-bold text-stone-600"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Tous statuts</option>
            <option value="OWNED">Possédées (citoyens)</option>
            <option value="COMPANY">Possédées (entreprises)</option>
            <option value="AVAILABLE">Disponibles</option>
            <option value="RENTED">En location</option>
            <option value="FOR_SALE">En vente</option>
          </select>
        </div>
      </div>

      {/* --- Formulaire création --- */}
      {showCreate && (
        <Card title="Enregistrer un nouveau bien" icon={Home}>
          <div className="bg-stone-50 p-5 rounded-lg border border-stone-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nom du bien</Label>
                <input className="w-full p-2.5 border rounded-lg font-bold text-stone-800" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Villa des Orangers..." />
              </div>
              <div>
                <Label>Type de bien</Label>
                <select className="w-full p-2.5 border rounded-lg text-sm bg-white" value={newType} onChange={(e) => setNewType(e.target.value)}>
                  {Object.entries(PROPERTY_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Prix d'achat (Écus)</Label>
                <input type="number" className="w-full p-2.5 border rounded-lg font-mono" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Revenu journalier (Écus / jour)</Label>
                <input type="number" className="w-full p-2.5 border rounded-lg font-mono" value={newIncome} onChange={(e) => setNewIncome(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Pays</Label>
                <select className="w-full p-2.5 border rounded-lg text-sm bg-white" value={newCountryId} onChange={(e) => { setNewCountryId(e.target.value); setNewRegionId(""); }}>
                  <option value="">-- Sélectionner un pays --</option>
                  {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {newRegions.length > 0 && (
                <div>
                  <Label>Région</Label>
                  <select className="w-full p-2.5 border rounded-lg text-sm bg-white" value={newRegionId} onChange={(e) => setNewRegionId(e.target.value)}>
                    <option value="">-- Toute la juridiction --</option>
                    {newRegions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div>
              <Label>Description</Label>
              <textarea className="w-full p-2.5 border rounded-lg text-sm" rows={2} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description du bien..." />
            </div>
            <button onClick={handleCreate} disabled={!newName.trim()} className="bg-stone-900 text-yellow-500 px-6 py-3 rounded-lg font-black uppercase text-xs tracking-widest hover:bg-stone-700 transition-all flex items-center gap-2 disabled:opacity-50">
              <Plus size={14} /> Enregistrer
            </button>
          </div>
        </Card>
      )}

      {/* --- Liste des propriétés --- */}
      <Card title={`Registre Foncier — ${filtered.length} bien${filtered.length > 1 ? "s" : ""}`} icon={MapPin}>
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-stone-400 italic">
              {properties.length === 0 ? "Aucun bien immobilier enregistré." : "Aucun résultat pour ces filtres."}
            </div>
          )}
          {filtered.map((prop) => {
            const { name: ownerDisplayName, type: ownerDisplayType, owner: ownerObj } = getOwnerDisplay(prop);
            const isExpanded = expandedId === prop.id;
            const isEditing = editingId === prop.id;
            const typeInfo = PROPERTY_TYPES[prop.type] || PROPERTY_TYPES.MAISON;
            const hasTenant = prop.rental && prop.rental.tenantId;
            const tenant = hasTenant ? citizens.find((c) => c.id === prop.rental.tenantId) : null;
            const staffCount = (prop.staff || []).length;

            if (isEditing) {
              return (
                <div key={prop.id} className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-stone-800 uppercase text-xs tracking-widest flex items-center gap-2">
                      <Pencil size={14} /> Modifier : {prop.name}
                    </h3>
                    <button onClick={() => { setEditingId(null); setEditForm({}); }} className="text-stone-400 hover:text-stone-600"><X size={18} /></button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div><Label>Nom</Label><input className="w-full p-2 border rounded text-sm" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
                    <div><Label>Type</Label>
                      <select className="w-full p-2 border rounded text-sm bg-white" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                        {Object.entries(PROPERTY_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div><Label>Prix</Label><input type="number" className="w-full p-2 border rounded font-mono text-sm" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} /></div>
                    <div><Label>Revenu / jour</Label><input type="number" className="w-full p-2 border rounded font-mono text-sm" value={editForm.income} onChange={(e) => setEditForm({ ...editForm, income: e.target.value })} /></div>
                    <div><Label>Pays</Label>
                      <select className="w-full p-2 border rounded text-sm bg-white" value={editForm.countryId} onChange={(e) => setEditForm({ ...editForm, countryId: e.target.value, regionId: "" })}>
                        <option value="">-- Aucun --</option>
                        {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    {editRegions.length > 0 && (
                      <div><Label>Région</Label>
                        <select className="w-full p-2 border rounded text-sm bg-white" value={editForm.regionId} onChange={(e) => setEditForm({ ...editForm, regionId: e.target.value })}>
                          <option value="">-- Toute la juridiction --</option>
                          {editRegions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Propriétaire */}
                  <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
                    <div className="text-[10px] font-black uppercase text-stone-500 tracking-widest flex items-center gap-1"><Key size={12} /> Propriétaire</div>
                    <div className="flex items-center gap-3">
                      <select className="p-2 border rounded text-xs bg-white font-bold" value={editForm.ownerType || "CITIZEN"} onChange={(e) => setEditForm({ ...editForm, ownerType: e.target.value, ownerId: "" })}>
                        <option value="CITIZEN">Citoyen</option>
                        <option value="COMPANY">Entreprise</option>
                      </select>
                      {editForm.ownerType === "COMPANY" ? (
                        <select className="flex-1 p-2 border rounded text-sm bg-white" value={editForm.ownerId || ""} onChange={(e) => setEditForm({ ...editForm, ownerId: e.target.value })}>
                          <option value="">-- Aucune entreprise --</option>
                          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <div className="flex-1">
                          <UserSearchSelect users={citizens} onSelect={(id) => setEditForm({ ...editForm, ownerId: id })} value={editForm.ownerId} placeholder="Aucun (disponible)" />
                        </div>
                      )}
                      {editForm.ownerId && (
                        <button onClick={() => setEditForm({ ...editForm, ownerId: "" })} className="text-red-400 hover:text-red-600 p-2 rounded hover:bg-red-50" title="Retirer le propriétaire">
                          <UserX size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div><Label>Description</Label>
                    <textarea className="w-full p-2 border rounded text-sm" rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-yellow-200">
                    <button onClick={saveEdit} className="bg-stone-900 text-yellow-500 px-5 py-2.5 rounded-lg font-bold text-xs uppercase flex items-center gap-2 hover:bg-stone-700 transition-all">
                      <Save size={14} /> Sauvegarder
                    </button>
                    <button onClick={() => { setEditingId(null); setEditForm({}); }} className="bg-stone-200 text-stone-600 px-4 py-2.5 rounded-lg font-bold text-xs uppercase hover:bg-stone-300 transition-all">
                      Annuler
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={prop.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${isExpanded ? "border-stone-400 shadow-md" : "border-stone-200 hover:border-stone-300"}`}>
                {/* Ligne principale */}
                <div
                  className="p-4 flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : prop.id)}
                >
                  {/* Icône type */}
                  <div className={`p-2 rounded-lg shrink-0 ${typeInfo.color}`}>
                    <TypeIcon type={prop.type} size={16} />
                  </div>

                  {/* Infos principales */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-stone-800">{prop.name}</span>
                      <Badge color={typeInfo.color}>{typeInfo.label}</Badge>
                      {prop.forSale && <Badge color="bg-yellow-100 text-yellow-700"><Tag size={8} /> En vente</Badge>}
                      {hasTenant && <Badge color="bg-blue-100 text-blue-700"><DoorOpen size={8} /> Loué</Badge>}
                      {prop.rental && !hasTenant && <Badge color="bg-sky-100 text-sky-600">À louer</Badge>}
                      {staffCount > 0 && <Badge color="bg-stone-100 text-stone-500"><UsersIcon size={8} /> {staffCount}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-stone-400">
                      <span className="flex items-center gap-1"><Globe size={9} /> {getLocationLabel(prop)}</span>
                      <span className="font-mono font-bold text-yellow-700">{(prop.price || 0).toLocaleString()} Écus</span>
                      {(prop.income || 0) > 0 && <span className="font-mono font-bold text-green-600">+{prop.income}/j</span>}
                    </div>
                  </div>

                  {/* Propriétaire résumé */}
                  <div className="text-right shrink-0 min-w-[120px]">
                    {ownerDisplayType === "COMPANY" ? (
                      <div className="flex items-center gap-1 justify-end">
                        <Building2 size={12} className="text-indigo-500" />
                        <span className="text-xs font-bold text-indigo-700 truncate max-w-[100px]">{ownerDisplayName}</span>
                      </div>
                    ) : ownerDisplayType === "CITIZEN" ? (
                      <div className="flex items-center gap-1 justify-end">
                        <User size={12} className="text-stone-500" />
                        <span className="text-xs font-bold text-stone-700 truncate max-w-[100px]">{ownerDisplayName}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] italic text-green-500 font-bold uppercase">Disponible</span>
                    )}
                  </div>

                  {/* Chevron */}
                  <div className="text-stone-300 shrink-0">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Panneau détail étendu */}
                {isExpanded && (
                  <div className="border-t border-stone-100 bg-stone-50/50 p-4 space-y-4">
                    {/* Description */}
                    {prop.description && (
                      <p className="text-sm text-stone-500 italic">{prop.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Bloc Propriétaire */}
                      <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-3">
                        <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-1">
                          <Key size={11} /> Propriétaire
                        </div>
                        {ownerDisplayType === "COMPANY" ? (
                          <div className="flex items-center gap-2">
                            <div className="bg-indigo-100 p-2 rounded-lg"><Building2 size={16} className="text-indigo-600" /></div>
                            <div>
                              <div className="font-bold text-indigo-700 text-sm">{ownerDisplayName}</div>
                              <div className="text-[10px] text-indigo-400 uppercase font-bold">Entreprise</div>
                              {ownerObj && ownerObj.ownerId && (() => {
                                const boss = citizens.find((c) => c.id === ownerObj.ownerId);
                                return boss ? <div className="text-[10px] text-stone-400">Patron : {boss.name}</div> : null;
                              })()}
                            </div>
                          </div>
                        ) : ownerDisplayType === "CITIZEN" ? (
                          <div className="flex items-center gap-2">
                            <div className="bg-stone-100 p-2 rounded-lg"><User size={16} className="text-stone-600" /></div>
                            <div>
                              <div className="font-bold text-stone-700 text-sm">{ownerDisplayName}</div>
                              <div className="text-[10px] text-stone-400 uppercase font-bold">Citoyen</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-green-600 font-bold italic">Aucun propriétaire — Bien disponible</div>
                        )}
                        {prop.ownerId && (
                          <button
                            onClick={() => adminRemoveOwner(prop.id)}
                            className="w-full flex items-center justify-center gap-2 text-red-500 border border-red-200 rounded-lg py-2 text-[10px] font-bold uppercase hover:bg-red-50 transition-colors"
                          >
                            <UserX size={12} /> Retirer le propriétaire
                          </button>
                        )}
                      </div>

                      {/* Bloc Locataire */}
                      <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-3">
                        <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-1">
                          <DoorOpen size={11} /> Location
                        </div>
                        {hasTenant ? (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="bg-blue-100 p-2 rounded-lg"><User size={16} className="text-blue-600" /></div>
                              <div>
                                <div className="font-bold text-blue-700 text-sm">{tenant ? tenant.name : prop.rental.tenantName}</div>
                                <div className="text-[10px] text-blue-400">Loyer : <span className="font-mono font-bold">{prop.rental.dailyRate} Écus/jour</span></div>
                                {prop.rental.startDate && <div className="text-[10px] text-stone-400">Depuis le {prop.rental.startDate}</div>}
                              </div>
                            </div>
                            <button
                              onClick={() => adminEvictTenant(prop.id)}
                              className="w-full flex items-center justify-center gap-2 text-orange-600 border border-orange-200 rounded-lg py-2 text-[10px] font-bold uppercase hover:bg-orange-50 transition-colors"
                            >
                              <Ban size={12} /> Expulser le locataire
                            </button>
                          </>
                        ) : prop.rental ? (
                          <>
                            <div className="text-sm text-sky-600 font-bold">
                              En attente de locataire — <span className="font-mono">{prop.rental.dailyRate} Écus/jour</span>
                            </div>
                            <button
                              onClick={() => adminCancelRental(prop.id)}
                              className="w-full flex items-center justify-center gap-2 text-stone-500 border border-stone-200 rounded-lg py-2 text-[10px] font-bold uppercase hover:bg-stone-100 transition-colors"
                            >
                              <RotateCcw size={12} /> Annuler la mise en location
                            </button>
                          </>
                        ) : (
                          <div className="text-sm text-stone-400 italic">Pas de location en cours</div>
                        )}
                      </div>
                    </div>

                    {/* Vente */}
                    {prop.forSale && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-bold text-yellow-700">En vente</span>
                          <span className="font-mono font-bold text-yellow-800 ml-2">{prop.salePrice} Écus</span>
                        </div>
                        <button
                          onClick={() => adminCancelSale(prop.id)}
                          className="flex items-center gap-1 text-yellow-700 border border-yellow-300 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-yellow-100 transition-colors"
                        >
                          <RotateCcw size={12} /> Annuler la vente
                        </button>
                      </div>
                    )}

                    {/* Infos supplémentaires */}
                    {((prop.staff || []).length > 0 || (prop.propertyEvents || []).length > 0 || (prop.garrison || []).length > 0 || (prop.dungeon || []).length > 0 || (prop.rooms || []).length > 0) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(prop.staff || []).length > 0 && (
                          <div className="bg-white border border-stone-200 rounded-lg p-3">
                            <div className="text-[9px] font-black uppercase text-stone-400 mb-1">Personnel</div>
                            {prop.staff.map((s) => (
                              <div key={s.id} className="text-xs text-stone-600">{s.name} <span className="text-stone-400">({s.role})</span></div>
                            ))}
                          </div>
                        )}
                        {(prop.garrison || []).length > 0 && (
                          <div className="bg-white border border-stone-200 rounded-lg p-3">
                            <div className="text-[9px] font-black uppercase text-stone-400 mb-1">Garnison</div>
                            {prop.garrison.map((g) => (
                              <div key={g.id} className="text-xs text-stone-600">{g.name}</div>
                            ))}
                          </div>
                        )}
                        {(prop.dungeon || []).length > 0 && (
                          <div className="bg-white border border-stone-200 rounded-lg p-3">
                            <div className="text-[9px] font-black uppercase text-stone-400 mb-1">Prisonniers</div>
                            {prop.dungeon.map((d) => (
                              <div key={d.citizenId} className="text-xs text-red-600">{d.citizenName}</div>
                            ))}
                          </div>
                        )}
                        {(prop.rooms || []).length > 0 && (
                          <div className="bg-white border border-stone-200 rounded-lg p-3">
                            <div className="text-[9px] font-black uppercase text-stone-400 mb-1">Chambres</div>
                            <div className="text-xs text-stone-600">{prop.rooms.filter((r) => r.tenantId).length}/{prop.rooms.length} occupées</div>
                          </div>
                        )}
                        {(prop.propertyEvents || []).length > 0 && (
                          <div className="bg-white border border-stone-200 rounded-lg p-3">
                            <div className="text-[9px] font-black uppercase text-stone-400 mb-1">Événements</div>
                            <div className="text-xs text-stone-600">{prop.propertyEvents.length} actif(s)</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Boutons d'action */}
                    <div className="flex items-center gap-2 pt-3 border-t border-stone-200">
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(prop); }}
                        className="flex items-center gap-1.5 bg-stone-100 text-stone-600 px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-stone-200 transition-colors"
                      >
                        <Pencil size={12} /> Modifier
                      </button>
                      <SecureDeleteButton onClick={() => onDeleteProperty(prop.id)} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default PropertiesAdminView;
