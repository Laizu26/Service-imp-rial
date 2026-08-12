import React, { useState } from "react";
import {
  MapPin, Shield, Users, MessageSquare, Lock, Home, Utensils, Eye,
  Package, Hammer, ShoppingBag, Calendar, Plus, Trash2, X, ArrowLeft,
  Coins, Crown, Pencil, Save, Clock, Bed, Coffee, CheckCircle,
  Wheat, Castle, Store, Axe,
} from "lucide-react";
import { formatMoney } from "../../lib/gameUtils";
import UserSearchSelect from "../ui/UserSearchSelect";

const TYPE_META = {
  MAISON:  { label: "Maison",           icon: Home,        hero: "from-stone-700 to-stone-900",   badge: "bg-stone-200 text-stone-700",   accent: "text-stone-600" },
  DOMAINE: { label: "Domaine",          icon: Castle,      hero: "from-purple-900 to-stone-900",  badge: "bg-purple-100 text-purple-800", accent: "text-purple-700" },
  TERRAIN: { label: "Terrain",          icon: MapPin,      hero: "from-green-800 to-stone-900",   badge: "bg-green-100 text-green-800",   accent: "text-green-700" },
  COMMERCE:{ label: "Local Commercial", icon: Store,       hero: "from-cyan-800 to-stone-900",    badge: "bg-cyan-100 text-cyan-800",     accent: "text-cyan-700" },
  FERME:   { label: "Ferme",            icon: Wheat,       hero: "from-amber-700 to-stone-900",   badge: "bg-amber-100 text-amber-800",   accent: "text-amber-700" },
  MANOIR:  { label: "Manoir / Château", icon: Castle,      hero: "from-yellow-700 to-stone-900",  badge: "bg-yellow-100 text-yellow-800", accent: "text-yellow-700" },
  ATELIER: { label: "Atelier",          icon: Axe,         hero: "from-orange-800 to-stone-900",  badge: "bg-orange-100 text-orange-800", accent: "text-orange-700" },
  AUBERGE: { label: "Auberge / Taverne",icon: Coffee,      hero: "from-rose-900 to-stone-900",    badge: "bg-rose-100 text-rose-800",     accent: "text-rose-700" },
};

const SectionTitle = ({ children, icon: Icon, accent = "text-stone-600" }) => (
  <div className={`flex items-center gap-2 mb-4 ${accent}`}>
    {Icon && <Icon size={14} />}
    <span className="font-black text-xs uppercase tracking-widest">{children}</span>
    <div className="flex-1 border-t border-stone-200 ml-2" />
  </div>
);

const EmptyState = ({ text }) => (
  <p className="text-stone-400 text-xs italic text-center py-5">{text}</p>
);

const PropertyDetailView = ({
  property, citizens = [], user, session, isOwner,
  onUpdatePropertyFeature,
  onAddGarrison, onRemoveGarrison,
  onImprison, onReleasePrisoner,
  onRequestAudience, onRespondAudience,
  onSetupRooms, onBookRoom, onCheckoutRoom,
  onPostTavernMessage, onPostRumor, onDeleteRumor,
  onBuyFromMenu, onBuyFromShop,
  onAddPropertyStaff, onRemovePropertyStaff,
  onAddPropertyEvent, onRemovePropertyEvent,
  onBack,
}) => {
  const prop = property;

  const [staffCitizenId, setStaffCitizenId] = useState("");
  const [staffRole, setStaffRole]           = useState("");
  const [staffSalary, setStaffSalary]       = useState("");
  const [eventTitle, setEventTitle]         = useState("");
  const [eventDesc, setEventDesc]           = useState("");
  const [eventDate, setEventDate]           = useState("");
  const [tavernMsg, setTavernMsg]           = useState("");
  const [rumorText, setRumorText]           = useState("");
  const [audienceSubject, setAudienceSubject] = useState("");
  const [audienceText, setAudienceText]     = useState("");
  const [prisonCitizen, setPrisonCitizen]   = useState("");
  const [prisonReason, setPrisonReason]     = useState("");
  const [garrisonCitizen, setGarrisonCitizen] = useState("");
  const [newRoomName, setNewRoomName]       = useState("");
  const [newRoomPrice, setNewRoomPrice]     = useState("");
  const [editingRoomId, setEditingRoomId]   = useState(null);
  const [editRoomName, setEditRoomName]     = useState("");
  const [editRoomPrice, setEditRoomPrice]   = useState("");
  const [prodItem, setProdItem]             = useState(prop?.production?.itemName || "");
  const [prodQty, setProdQty]               = useState(prop?.production?.qtyPerDay || "");
  const [shopItemName, setShopItemName]     = useState("");
  const [shopItemQty, setShopItemQty]       = useState("");
  const [shopItemPrice, setShopItemPrice]   = useState("");
  const [editingShopIdx, setEditingShopIdx] = useState(null);
  const [editShopName, setEditShopName]     = useState("");
  const [editShopQty, setEditShopQty]       = useState("");
  const [editShopPrice, setEditShopPrice]   = useState("");
  const [menuItemName, setMenuItemName]     = useState("");
  const [menuItemPrice, setMenuItemPrice]   = useState("");
  const [menuItemStock, setMenuItemStock]   = useState("");
  const [editingMenuIdx, setEditingMenuIdx] = useState(null);
  const [editMenuName, setEditMenuName]     = useState("");
  const [editMenuPrice, setEditMenuPrice]   = useState("");
  const [editMenuStock, setEditMenuStock]   = useState("");
  const [craftIn, setCraftIn]               = useState("");
  const [craftInQty, setCraftInQty]         = useState("");
  const [craftOut, setCraftOut]             = useState("");
  const [craftOutQty, setCraftOutQty]       = useState("");

  if (!prop) return null;

  const type = prop.type || "MAISON";
  const meta = TYPE_META[type] || TYPE_META.MAISON;
  const HeroIcon = meta.icon;
  const isChateau  = type === "MANOIR";
  const isAuberge  = type === "AUBERGE";
  const isFerme    = type === "FERME";
  const isAtelier  = type === "ATELIER";
  const isCommerce = type === "COMMERCE";
  const userBalance = user?.balance || session?.balance || 0;

  return (
    <div className="space-y-5 animate-fadeIn pb-16">

      {/* ── Hero Banner ───────────────────────────────────────── */}
      <div className={`relative bg-gradient-to-br ${meta.hero} rounded-2xl overflow-hidden shadow-2xl`}>
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <HeroIcon size={280} className="absolute -right-12 -bottom-12 text-white" />
        </div>
        <div className="relative z-10 p-6">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest mb-5 transition-colors">
            <ArrowLeft size={14} /> Retour
          </button>
          <div className="flex items-start gap-5">
            <div className="bg-white/10 rounded-xl p-4 shrink-0 backdrop-blur-sm border border-white/20">
              <HeroIcon size={34} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`${meta.badge} px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest`}>{meta.label}</span>
                {isOwner && <span className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-2 py-0.5 rounded text-[9px] font-black uppercase">Propriétaire</span>}
                {prop.forSale && <span className="bg-green-400/20 text-green-300 border border-green-400/30 px-2 py-0.5 rounded text-[9px] font-black uppercase">En vente</span>}
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white font-serif leading-tight">{prop.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-white/60 text-xs">
                {prop.location && <span className="flex items-center gap-1"><MapPin size={11} />{prop.location}</span>}
                {prop.ownerName && <span className="flex items-center gap-1"><Crown size={11} />{prop.ownerName}{prop.ownerType === "COMPANY" ? " (entreprise)" : ""}</span>}
                {(prop.income || 0) > 0 && <span className="flex items-center gap-1 text-green-300 font-bold font-mono"><Coins size={11} />+{formatMoney(prop.income)}/jour</span>}
              </div>
              {prop.description && <p className="text-white/70 text-sm mt-3 leading-relaxed font-serif italic">{prop.description}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── MANOIR ─────────────────────────────────────────────── */}
      {isChateau && (
        <>
          {/* Garnison */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <SectionTitle icon={Shield} accent="text-yellow-700">Garnison</SectionTitle>
            {(prop.garrison || []).length === 0 && <EmptyState text="Aucun garde assigné." />}
            <div className="space-y-2">
              {(prop.garrison || []).map((g) => (
                <div key={g.id} className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center"><Shield size={14} className="text-yellow-700" /></div>
                    <span className="font-bold text-stone-800 text-sm">{g.name}</span>
                  </div>
                  {isOwner && <button onClick={() => onRemoveGarrison(prop.id, g.id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>}
                </div>
              ))}
            </div>
            {isOwner && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100">
                <div className="flex-1"><UserSearchSelect users={citizens} onSelect={setGarrisonCitizen} value={garrisonCitizen} placeholder="Recruter un garde…" /></div>
                <button onClick={() => { if (garrisonCitizen) { onAddGarrison(prop.id, garrisonCitizen); setGarrisonCitizen(""); } }} disabled={!garrisonCitizen}
                  className="bg-yellow-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase disabled:opacity-40 hover:bg-yellow-500 transition-colors">Recruter</button>
              </div>
            )}
          </div>

          {/* Cachot */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <SectionTitle icon={Lock} accent="text-red-700">Cachot</SectionTitle>
            {(prop.dungeon || []).length === 0 && <EmptyState text="Le cachot est vide." />}
            <div className="space-y-2">
              {(prop.dungeon || []).map((d) => (
                <div key={d.citizenId} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><Lock size={14} className="text-red-600" /></div>
                    <div>
                      <div className="font-bold text-red-800 text-sm">{d.citizenName}</div>
                      {d.reason && <div className="text-red-500 text-[10px]">{d.reason}</div>}
                    </div>
                  </div>
                  {isOwner && <button onClick={() => onReleasePrisoner(prop.id, d.citizenId)} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors">Libérer</button>}
                </div>
              ))}
            </div>
            {isOwner && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100">
                <div className="flex-1"><UserSearchSelect users={citizens} onSelect={setPrisonCitizen} value={prisonCitizen} placeholder="Emprisonner un citoyen…" /></div>
                <input className="w-36 p-2.5 border border-stone-300 rounded-xl text-sm font-bold outline-none" placeholder="Motif" value={prisonReason} onChange={(e) => setPrisonReason(e.target.value)} />
                <button onClick={() => { if (prisonCitizen) { onImprison(prop.id, prisonCitizen, prisonReason); setPrisonCitizen(""); setPrisonReason(""); } }} disabled={!prisonCitizen}
                  className="bg-red-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase disabled:opacity-40 hover:bg-red-600 transition-colors">Enfermer</button>
              </div>
            )}
          </div>

          {/* Audiences */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <SectionTitle icon={Crown} accent="text-yellow-700">Salle du Trône — Audiences</SectionTitle>
            {(prop.audiences || []).filter((a) => a.status === "PENDING").length === 0 && <EmptyState text="Aucune audience en attente." />}
            <div className="space-y-3">
              {(prop.audiences || []).filter((a) => a.status === "PENDING").map((a) => (
                <div key={a.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-stone-800 text-sm">{a.from}</div>
                    <div className="text-yellow-700 font-bold text-xs mt-0.5">{a.subject}</div>
                    {a.text && <p className="text-stone-600 text-xs mt-2 leading-relaxed">{a.text}</p>}
                  </div>
                  {isOwner && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => onRespondAudience(prop.id, a.id, "ACCEPTED")} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-green-500 transition-colors flex items-center gap-1"><CheckCircle size={10} />Accepter</button>
                      <button onClick={() => onRespondAudience(prop.id, a.id, "REFUSED")} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-red-500 transition-colors flex items-center gap-1"><X size={10} />Refuser</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!isOwner && (
              <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
                <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Demander une audience</div>
                <input className="w-full p-3 border-2 border-stone-200 rounded-xl text-sm font-bold outline-none focus:border-yellow-400 transition-colors" placeholder="Sujet de l'audience…" value={audienceSubject} onChange={(e) => setAudienceSubject(e.target.value)} />
                <textarea className="w-full p-3 border-2 border-stone-200 rounded-xl text-sm outline-none focus:border-yellow-400 transition-colors resize-none" rows={3} placeholder="Votre requête…" value={audienceText} onChange={(e) => setAudienceText(e.target.value)} />
                <button onClick={() => { if (audienceSubject.trim()) { onRequestAudience(prop.id, audienceSubject, audienceText); setAudienceSubject(""); setAudienceText(""); } }} disabled={!audienceSubject.trim()}
                  className="bg-yellow-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase disabled:opacity-40 hover:bg-yellow-500 transition-colors">Soumettre la requête</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── AUBERGE ────────────────────────────────────────────── */}
      {isAuberge && (
        <>
          {/* Chambres */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <SectionTitle icon={Bed} accent="text-rose-700">Chambres</SectionTitle>
            {(prop.rooms || []).length === 0 && <EmptyState text="Aucune chambre disponible." />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(prop.rooms || []).map((r) => {
                const occupied = !!r.tenantId;
                if (editingRoomId === r.id) return (
                  <div key={r.id} className="border-2 border-rose-300 rounded-xl p-3 space-y-2 bg-rose-50">
                    <input className="w-full p-2.5 border border-stone-300 rounded-lg text-sm font-bold outline-none" value={editRoomName} onChange={(e) => setEditRoomName(e.target.value)} placeholder="Nom" />
                    <div className="flex gap-2">
                      <input className="flex-1 p-2.5 border border-stone-300 rounded-lg text-sm font-mono outline-none" type="number" step="0.1" value={editRoomPrice} onChange={(e) => setEditRoomPrice(e.target.value)} placeholder="Prix/nuit" />
                      <button onClick={() => { const rooms = (prop.rooms || []).map((rm) => rm.id === r.id ? { ...rm, name: editRoomName.trim() || rm.name, pricePerNight: parseFloat(editRoomPrice) || 0 } : rm); onSetupRooms(prop.id, rooms); setEditingRoomId(null); }} className="bg-green-600 text-white px-3 rounded-lg"><Save size={13} /></button>
                      <button onClick={() => setEditingRoomId(null)} className="bg-stone-200 text-stone-600 px-3 rounded-lg"><X size={13} /></button>
                    </div>
                  </div>
                );
                return (
                  <div key={r.id} className={`rounded-xl border-2 overflow-hidden ${occupied ? "border-rose-200" : "border-green-200"}`}>
                    <div className={`px-4 py-2.5 flex items-center justify-between ${occupied ? "bg-rose-50" : "bg-green-50"}`}>
                      <div className="flex items-center gap-2">
                        <Bed size={14} className={occupied ? "text-rose-600" : "text-green-600"} />
                        <span className="font-black text-stone-800 text-sm">{r.name}</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${occupied ? "bg-rose-200 text-rose-700" : "bg-green-200 text-green-700"}`}>
                        {occupied ? "Occupée" : "Libre"}
                      </span>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between bg-white">
                      <div>
                        <span className="font-black text-yellow-700 font-mono text-sm">{formatMoney(r.pricePerNight)}</span>
                        <span className="text-stone-400 text-[10px] font-normal ml-1">/nuit</span>
                        {occupied && <div className="text-xs text-rose-600 font-bold mt-0.5">{r.tenantName}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        {!occupied && !isOwner && <button onClick={() => onBookRoom(prop.id, r.id)} disabled={userBalance < r.pricePerNight} className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase disabled:opacity-40 hover:bg-rose-500 transition-colors">Réserver</button>}
                        {occupied && (isOwner || r.tenantId === user?.id) && <button onClick={() => onCheckoutRoom(prop.id, r.id)} className="bg-stone-200 text-stone-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-stone-300 transition-colors">Libérer</button>}
                        {isOwner && (
                          <>
                            <button onClick={() => { setEditingRoomId(r.id); setEditRoomName(r.name); setEditRoomPrice(String(r.pricePerNight || 0)); }} className="text-stone-400 hover:text-stone-700 p-1.5 hover:bg-stone-100 rounded-lg transition-colors"><Pencil size={12} /></button>
                            <button onClick={() => { if (!r.tenantId) { onSetupRooms(prop.id, (prop.rooms || []).filter((rm) => rm.id !== r.id)); } }} className={`p-1.5 rounded-lg transition-colors ${r.tenantId ? "text-stone-200 cursor-not-allowed" : "text-red-400 hover:text-red-600 hover:bg-red-50"}`}><Trash2 size={12} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {isOwner && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100">
                <input className="flex-1 p-2.5 border border-stone-300 rounded-xl text-sm font-bold outline-none focus:border-rose-400" placeholder="Nom de la chambre" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
                <input className="w-24 p-2.5 border border-stone-300 rounded-xl text-sm font-mono outline-none focus:border-rose-400" type="number" step="0.1" placeholder="Prix/nuit" value={newRoomPrice} onChange={(e) => setNewRoomPrice(e.target.value)} />
                <button onClick={() => { if (newRoomName.trim()) { onSetupRooms(prop.id, [...(prop.rooms || []), { id: Date.now(), name: newRoomName.trim(), pricePerNight: parseFloat(newRoomPrice) || 0, tenantId: null, tenantName: null }]); setNewRoomName(""); setNewRoomPrice(""); } }}
                  className="bg-rose-600 text-white px-4 rounded-xl text-[10px] font-black uppercase hover:bg-rose-500 transition-colors"><Plus size={14} /></button>
              </div>
            )}
          </div>

          {/* Menu */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <SectionTitle icon={Utensils} accent="text-amber-700">Menu & Restauration</SectionTitle>
            {(prop.menu || []).length === 0 && <EmptyState text="Le menu est vide." />}
            <div className="space-y-2">
              {(prop.menu || []).map((m, i) => {
                const infinite = m.stock === -1;
                const available = infinite || m.stock > 0;
                if (editingMenuIdx === i && isOwner) return (
                  <div key={i} className="flex flex-wrap items-center gap-2 bg-amber-50 border-2 border-amber-300 rounded-xl px-3 py-2">
                    <input className="flex-1 p-2 border border-stone-300 rounded-lg text-xs font-bold min-w-[120px]" value={editMenuName} onChange={(e) => setEditMenuName(e.target.value)} placeholder="Plat" />
                    <input className="w-20 p-2 border border-stone-300 rounded-lg text-xs font-mono" type="number" step="0.1" value={editMenuPrice} onChange={(e) => setEditMenuPrice(e.target.value)} placeholder="Prix" />
                    <input className="w-20 p-2 border border-stone-300 rounded-lg text-xs font-mono" type="number" value={editMenuStock} onChange={(e) => setEditMenuStock(e.target.value)} placeholder="Stock(-1=∞)" />
                    <button onClick={() => { const nm = (prop.menu || []).map((x, idx) => idx === i ? { ...x, itemName: editMenuName.trim() || x.itemName, price: parseFloat(editMenuPrice) || 0, stock: parseInt(editMenuStock) } : x); onUpdatePropertyFeature(prop.id, "menu", nm); setEditingMenuIdx(null); }} className="text-green-600 p-1.5"><Save size={14} /></button>
                    <button onClick={() => setEditingMenuIdx(null)} className="text-stone-400 p-1.5"><X size={14} /></button>
                  </div>
                );
                return (
                  <div key={i} className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${!available ? "bg-stone-50 border-stone-100 opacity-60" : "bg-amber-50/60 border-amber-100 hover:border-amber-200"}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0"><Utensils size={14} className="text-amber-700" /></div>
                      <div className="min-w-0">
                        <div className="font-black text-stone-800 text-sm truncate">{m.itemName}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-yellow-700 font-bold text-xs">{formatMoney(m.price)}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${infinite ? "bg-blue-100 text-blue-700" : !available ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                            {infinite ? "∞ illimité" : !available ? "Épuisé" : `×${m.stock}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isOwner && available && <button onClick={() => onBuyFromMenu(prop.id, m.itemName)} disabled={userBalance < m.price} className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase disabled:opacity-40 hover:bg-amber-500 transition-colors flex items-center gap-1"><Coffee size={10} />Commander</button>}
                      {isOwner && (
                        <>
                          <button onClick={() => { setEditingMenuIdx(i); setEditMenuName(m.itemName); setEditMenuPrice(String(m.price)); setEditMenuStock(String(m.stock)); }} className="text-stone-400 hover:text-stone-700 p-1.5 hover:bg-stone-100 rounded-lg transition-colors"><Pencil size={12} /></button>
                          <button onClick={() => onUpdatePropertyFeature(prop.id, "menu", (prop.menu || []).filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {isOwner && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-stone-100">
                  <input className="flex-1 p-2.5 border border-stone-300 rounded-xl text-sm outline-none focus:border-amber-400 min-w-[140px]" placeholder="Plat ou boisson" value={menuItemName} onChange={(e) => setMenuItemName(e.target.value)} />
                  <input className="w-24 p-2.5 border border-stone-300 rounded-xl text-sm font-mono outline-none focus:border-amber-400" type="number" step="0.1" placeholder="Prix" value={menuItemPrice} onChange={(e) => setMenuItemPrice(e.target.value)} />
                  <input className="w-28 p-2.5 border border-stone-300 rounded-xl text-sm font-mono outline-none focus:border-amber-400" type="number" placeholder="Stock (-1=∞)" value={menuItemStock} onChange={(e) => setMenuItemStock(e.target.value)} />
                  <button onClick={() => { if (menuItemName.trim()) { onUpdatePropertyFeature(prop.id, "menu", [...(prop.menu || []), { itemName: menuItemName.trim(), price: parseFloat(menuItemPrice) || 0, stock: parseInt(menuItemStock) ?? -1 }]); setMenuItemName(""); setMenuItemPrice(""); setMenuItemStock(""); } }}
                    className="bg-amber-600 text-white px-4 rounded-xl text-[10px] font-black uppercase hover:bg-amber-500 transition-colors"><Plus size={14} /></button>
                </div>
              )}
            </div>
          </div>

          {/* Taverne */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <SectionTitle icon={MessageSquare} accent="text-rose-700">L'Estaminet — Bavardages</SectionTitle>
            <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200 mb-3 pr-1">
              {(prop.tavernMessages || []).length === 0 && <EmptyState text="La taverne est silencieuse… commencez à parler !" />}
              {(prop.tavernMessages || []).slice().reverse().map((m) => (
                <div key={m.id} className="flex items-start gap-3 py-2 border-b border-stone-50 last:border-0">
                  <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-rose-700">
                    {(m.authorName || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-stone-800 text-xs">{m.authorName}</span>
                      {m.timestamp && <span className="text-stone-400 text-[9px]">{new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                    </div>
                    <p className="text-stone-600 text-sm mt-0.5 leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="flex-1 p-3 border-2 border-stone-200 rounded-xl text-sm outline-none focus:border-rose-400 transition-colors" placeholder="Dire quelque chose…" value={tavernMsg} onChange={(e) => setTavernMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && tavernMsg.trim()) { onPostTavernMessage(prop.id, tavernMsg.trim()); setTavernMsg(""); } }} />
              <button onClick={() => { if (tavernMsg.trim()) { onPostTavernMessage(prop.id, tavernMsg.trim()); setTavernMsg(""); } }}
                className="bg-rose-700 text-white px-4 rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 transition-colors"><MessageSquare size={14} /></button>
            </div>
          </div>

          {/* Rumeurs */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <SectionTitle icon={Eye} accent="text-stone-600">Tableau des Rumeurs</SectionTitle>
            <div className="space-y-2 mb-3">
              {(prop.rumors || []).length === 0 && <EmptyState text="Aucune rumeur ne circule ici… pour l'instant." />}
              {(prop.rumors || []).map((r) => (
                <div key={r.id} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
                  <p className="text-sm text-stone-700 italic font-serif leading-relaxed">« {r.text} »</p>
                  {isOwner && <button onClick={() => onDeleteRumor(prop.id, r.id)} className="text-red-400 hover:text-red-600 shrink-0 p-1.5 hover:bg-red-50 rounded transition-colors"><Trash2 size={12} /></button>}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="flex-1 p-2.5 border-2 border-stone-200 rounded-xl text-sm outline-none focus:border-amber-400 italic" placeholder="Poster une rumeur anonyme…" value={rumorText} onChange={(e) => setRumorText(e.target.value)} />
              <button onClick={() => { if (rumorText.trim()) { onPostRumor(prop.id, rumorText.trim()); setRumorText(""); } }}
                className="bg-amber-500 text-stone-900 px-4 rounded-xl text-[10px] font-black uppercase hover:bg-amber-400 transition-colors">Afficher</button>
            </div>
          </div>
        </>
      )}

      {/* ── FERME ──────────────────────────────────────────────── */}
      {isFerme && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
          <SectionTitle icon={Wheat} accent="text-amber-700">Production Agricole</SectionTitle>
          {prop.production?.itemName ? (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 flex items-center gap-5">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center"><Wheat size={28} className="text-amber-600" /></div>
              <div className="flex-1">
                <div className="font-black text-xl text-stone-800">{prop.production.itemName}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-black">+{prop.production.qtyPerDay}/jour RP</span>
                  {prop.production.lastProduced && <span className="text-stone-400 text-[10px] flex items-center gap-1"><Clock size={10} />Dernière prod. : {prop.production.lastProduced}</span>}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState text="Aucune production configurée." />
          )}
          {isOwner && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100">
              <input className="flex-1 p-2.5 border border-stone-300 rounded-xl text-sm font-bold outline-none focus:border-amber-400" placeholder="Culture (Blé, Vin, Bois…)" value={prodItem} onChange={(e) => setProdItem(e.target.value)} />
              <input className="w-24 p-2.5 border border-stone-300 rounded-xl text-sm font-mono outline-none focus:border-amber-400" type="number" placeholder="Qté/j" value={prodQty} onChange={(e) => setProdQty(e.target.value)} />
              <button onClick={() => { if (prodItem.trim()) { onUpdatePropertyFeature(prop.id, "production", { itemName: prodItem.trim(), qtyPerDay: parseInt(prodQty) || 1, lastProduced: prop.production?.lastProduced }); } }}
                className="bg-amber-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-amber-500 transition-colors">Configurer</button>
            </div>
          )}
        </div>
      )}

      {/* ── ATELIER ────────────────────────────────────────────── */}
      {isAtelier && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
          <SectionTitle icon={Hammer} accent="text-orange-700">Recettes de Fabrication</SectionTitle>
          {(prop.craftRecipes || []).length === 0 && <EmptyState text="Aucune recette configurée." />}
          <div className="space-y-3">
            {(prop.craftRecipes || []).map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-center">
                    <div className="font-black text-stone-700 text-sm">{r.inputItem}</div>
                    <div className="text-[10px] text-stone-400">×{r.inputQty}</div>
                  </div>
                  <div className="text-orange-400 font-black text-xl mx-2">→</div>
                  <div className="text-center">
                    <div className="font-black text-orange-800 text-sm">{r.outputItem}</div>
                    <div className="text-[10px] text-orange-600 font-bold">×{r.outputQty}</div>
                  </div>
                </div>
                {isOwner && <button onClick={() => onUpdatePropertyFeature(prop.id, "craftRecipes", (prop.craftRecipes || []).filter((x) => x.id !== r.id))} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button>}
              </div>
            ))}
            {isOwner && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3 mt-2">
                <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Ajouter une recette</div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[9px] font-black uppercase text-stone-400 block mb-1">Matière première</label><input className="w-full p-2.5 border border-stone-300 rounded-lg text-sm font-bold outline-none" value={craftIn} onChange={(e) => setCraftIn(e.target.value)} placeholder="Ex : Fer brut" /></div>
                  <div><label className="text-[9px] font-black uppercase text-stone-400 block mb-1">Quantité entrée</label><input className="w-full p-2.5 border border-stone-300 rounded-lg text-sm font-mono outline-none" type="number" value={craftInQty} onChange={(e) => setCraftInQty(e.target.value)} placeholder="3" /></div>
                  <div><label className="text-[9px] font-black uppercase text-stone-400 block mb-1">Produit fini</label><input className="w-full p-2.5 border border-stone-300 rounded-lg text-sm font-bold outline-none" value={craftOut} onChange={(e) => setCraftOut(e.target.value)} placeholder="Ex : Épée" /></div>
                  <div><label className="text-[9px] font-black uppercase text-stone-400 block mb-1">Quantité sortie</label><input className="w-full p-2.5 border border-stone-300 rounded-lg text-sm font-mono outline-none" type="number" value={craftOutQty} onChange={(e) => setCraftOutQty(e.target.value)} placeholder="1" /></div>
                </div>
                <button onClick={() => { if (craftIn.trim() && craftOut.trim()) { onUpdatePropertyFeature(prop.id, "craftRecipes", [...(prop.craftRecipes || []), { id: Date.now(), inputItem: craftIn.trim(), inputQty: parseInt(craftInQty) || 1, outputItem: craftOut.trim(), outputQty: parseInt(craftOutQty) || 1 }]); setCraftIn(""); setCraftInQty(""); setCraftOut(""); setCraftOutQty(""); } }}
                  className="w-full bg-orange-600 text-white py-2.5 rounded-lg text-[10px] font-black uppercase hover:bg-orange-500 transition-colors">Ajouter la recette</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── COMMERCE ───────────────────────────────────────────── */}
      {isCommerce && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
          <SectionTitle icon={ShoppingBag} accent="text-cyan-700">Articles en vente</SectionTitle>
          {(prop.shopStock || []).length === 0 && <EmptyState text="L'étal est vide." />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(prop.shopStock || []).map((s, i) => {
              const outOfStock = s.qty <= 0;
              if (editingShopIdx === i && isOwner) return (
                <div key={i} className="border-2 border-cyan-300 rounded-xl p-3 bg-cyan-50 space-y-2">
                  <input className="w-full p-2.5 border border-stone-300 rounded-lg text-sm font-bold outline-none" value={editShopName} onChange={(e) => setEditShopName(e.target.value)} placeholder="Article" />
                  <div className="flex gap-2">
                    <input className="flex-1 p-2.5 border border-stone-300 rounded-lg text-sm font-mono outline-none" type="number" value={editShopQty} onChange={(e) => setEditShopQty(e.target.value)} placeholder="Stock" />
                    <input className="flex-1 p-2.5 border border-stone-300 rounded-lg text-sm font-mono outline-none" type="number" step="0.1" value={editShopPrice} onChange={(e) => setEditShopPrice(e.target.value)} placeholder="Prix" />
                    <button onClick={() => { const ns = (prop.shopStock || []).map((x, idx) => idx === i ? { ...x, itemName: editShopName.trim() || x.itemName, qty: parseInt(editShopQty) || 0, price: parseFloat(editShopPrice) || 0 } : x); onUpdatePropertyFeature(prop.id, "shopStock", ns); setEditingShopIdx(null); }} className="bg-green-600 text-white px-3 rounded-lg"><Save size={13} /></button>
                    <button onClick={() => setEditingShopIdx(null)} className="bg-stone-200 text-stone-600 px-3 rounded-lg"><X size={13} /></button>
                  </div>
                </div>
              );
              return (
                <div key={i} className={`rounded-xl border-2 overflow-hidden transition-all ${outOfStock ? "border-stone-200 opacity-60" : "border-cyan-100 hover:border-cyan-200 hover:shadow-sm"}`}>
                  <div className={`px-4 py-2.5 flex items-center justify-between ${outOfStock ? "bg-stone-50" : "bg-cyan-50"}`}>
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} className={outOfStock ? "text-stone-400" : "text-cyan-600"} />
                      <span className="font-black text-stone-800 text-sm">{s.itemName}</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${outOfStock ? "bg-stone-200 text-stone-500" : "bg-cyan-200 text-cyan-700"}`}>
                      {outOfStock ? "Épuisé" : `×${s.qty} en stock`}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between bg-white">
                    <div className="font-black text-yellow-700 font-mono text-lg">{formatMoney(s.price)}</div>
                    <div className="flex items-center gap-2">
                      {!isOwner && !outOfStock && <button onClick={() => onBuyFromShop(prop.id, s.itemName)} disabled={userBalance < s.price} className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase disabled:opacity-40 hover:bg-cyan-500 transition-colors flex items-center gap-1"><Coins size={10} />Acheter</button>}
                      {isOwner && (
                        <>
                          <button onClick={() => { setEditingShopIdx(i); setEditShopName(s.itemName); setEditShopQty(String(s.qty)); setEditShopPrice(String(s.price)); }} className="text-stone-400 hover:text-stone-700 p-1.5 hover:bg-stone-100 rounded-lg transition-colors"><Pencil size={12} /></button>
                          <button onClick={() => onUpdatePropertyFeature(prop.id, "shopStock", (prop.shopStock || []).filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {isOwner && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-stone-100">
              <input className="flex-1 p-2.5 border border-stone-300 rounded-xl text-sm font-bold outline-none focus:border-cyan-400 min-w-[140px]" placeholder="Nom de l'article" value={shopItemName} onChange={(e) => setShopItemName(e.target.value)} />
              <input className="w-24 p-2.5 border border-stone-300 rounded-xl text-sm font-mono outline-none focus:border-cyan-400" type="number" placeholder="Qté" value={shopItemQty} onChange={(e) => setShopItemQty(e.target.value)} />
              <input className="w-24 p-2.5 border border-stone-300 rounded-xl text-sm font-mono outline-none focus:border-cyan-400" type="number" step="0.1" placeholder="Prix" value={shopItemPrice} onChange={(e) => setShopItemPrice(e.target.value)} />
              <button onClick={() => { if (shopItemName.trim()) { onUpdatePropertyFeature(prop.id, "shopStock", [...(prop.shopStock || []), { itemName: shopItemName.trim(), qty: parseInt(shopItemQty) || 0, price: parseFloat(shopItemPrice) || 0 }]); setShopItemName(""); setShopItemQty(""); setShopItemPrice(""); } }}
                className="bg-cyan-600 text-white px-4 rounded-xl text-[10px] font-black uppercase hover:bg-cyan-500 transition-colors"><Plus size={14} /></button>
            </div>
          )}
        </div>
      )}

      {/* ── Personnel ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
        <SectionTitle icon={Users} accent="text-stone-600">Personnel</SectionTitle>
        {(prop.staff || []).length === 0 && <EmptyState text="Aucun employé." />}
        <div className="space-y-2">
          {(prop.staff || []).map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-stone-200 rounded-full flex items-center justify-center font-black text-stone-600 text-sm">{(s.name || "?")[0].toUpperCase()}</div>
                <div>
                  <div className="font-bold text-stone-800 text-sm">{s.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-stone-400 uppercase font-bold">{s.role || "Employé"}</span>
                    {s.salary > 0 && <span className="font-mono text-yellow-700 text-[10px] font-bold">{formatMoney(s.salary)}/jour</span>}
                  </div>
                </div>
              </div>
              {isOwner && <button onClick={() => onRemovePropertyStaff(prop.id, s.id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>}
            </div>
          ))}
        </div>
        {isOwner && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-stone-100">
            <div className="flex-1 min-w-[180px]"><UserSearchSelect users={citizens} onSelect={setStaffCitizenId} value={staffCitizenId} placeholder="Embaucher un citoyen…" /></div>
            <input className="w-28 p-2.5 border border-stone-300 rounded-xl text-sm outline-none" placeholder="Rôle" value={staffRole} onChange={(e) => setStaffRole(e.target.value)} />
            <input className="w-24 p-2.5 border border-stone-300 rounded-xl text-sm font-mono outline-none" type="number" step="0.1" placeholder="Salaire" value={staffSalary} onChange={(e) => setStaffSalary(e.target.value)} />
            <button onClick={() => { if (staffCitizenId) { onAddPropertyStaff(prop.id, staffCitizenId, staffRole || "Employé", staffSalary); setStaffCitizenId(""); setStaffRole(""); setStaffSalary(""); } }} disabled={!staffCitizenId}
              className="bg-stone-800 text-white px-4 rounded-xl text-[10px] font-black uppercase disabled:opacity-40 hover:bg-stone-700 transition-colors"><Plus size={14} /></button>
          </div>
        )}
      </div>

      {/* ── Événements ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
        <SectionTitle icon={Calendar} accent="text-stone-600">Événements</SectionTitle>
        {(prop.propertyEvents || []).length === 0 && <EmptyState text="Aucun événement prévu." />}
        <div className="space-y-3">
          {(prop.propertyEvents || []).map((e) => (
            <div key={e.id} className="flex items-start justify-between gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 bg-stone-200 rounded-lg flex items-center justify-center shrink-0"><Calendar size={14} className="text-stone-600" /></div>
                <div className="min-w-0">
                  <div className="font-black text-stone-800 text-sm flex items-center gap-2 flex-wrap">
                    {e.title}
                    {e.date && <span className="text-stone-400 text-[10px] font-normal flex items-center gap-1"><Clock size={10} />{e.date}</span>}
                  </div>
                  {e.desc && <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">{e.desc}</p>}
                </div>
              </div>
              {isOwner && <button onClick={() => onRemovePropertyEvent(prop.id, e.id)} className="text-red-400 hover:text-red-600 shrink-0 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button>}
            </div>
          ))}
        </div>
        {isOwner && (
          <div className="space-y-2 mt-4 pt-4 border-t border-stone-100">
            <div className="flex gap-2">
              <input className="flex-1 p-2.5 border border-stone-300 rounded-xl text-sm font-bold outline-none focus:border-stone-400" placeholder="Titre de l'événement" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
              <input className="w-32 p-2.5 border border-stone-300 rounded-xl text-sm outline-none focus:border-stone-400" placeholder="Date RP" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <input className="flex-1 p-2.5 border border-stone-300 rounded-xl text-sm outline-none focus:border-stone-400" placeholder="Description" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} />
              <button onClick={() => { if (eventTitle.trim()) { onAddPropertyEvent(prop.id, { title: eventTitle.trim(), desc: eventDesc, date: eventDate }); setEventTitle(""); setEventDesc(""); setEventDate(""); } }}
                className="bg-stone-800 text-white px-4 rounded-xl text-[10px] font-black uppercase hover:bg-stone-700 transition-colors"><Plus size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyDetailView;
