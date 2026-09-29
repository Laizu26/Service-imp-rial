import React, { useState } from "react";
import {
  MapPin, Shield, Users, MessageSquare, Lock, Home, Utensils, Eye,
  Package, Hammer, ShoppingBag, Calendar, Plus, Trash2, X, ArrowLeft,
  Coins, Crown, UserPlus, Pencil, Save, TrendingUp, Building2,
} from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";

const PROP_TYPES = {
  MAISON: "Maison", DOMAINE: "Domaine", TERRAIN: "Terrain",
  COMMERCE: "Local Commercial", FERME: "Ferme",
  MANOIR: "Manoir / Château", ATELIER: "Atelier", AUBERGE: "Auberge / Taverne",
};

const TYPE_COLORS = {
  MAISON:   "#78716C",
  DOMAINE:  "#16A34A",
  TERRAIN:  "#F59E0B",
  COMMERCE: "#3B82F6",
  FERME:    "#22C55E",
  MANOIR:   "#EAB308",
  ATELIER:  "#F97316",
  AUBERGE:  "#EC4899",
};

const TYPE_TABS = {
  MANOIR:   ["garnison", "cachot", "audiences", "personnel", "evenements"],
  AUBERGE:  ["chambres", "taverne", "rumeurs", "menu", "personnel", "evenements"],
  FERME:    ["production", "personnel", "evenements"],
  ATELIER:  ["fabrication", "personnel", "evenements"],
  COMMERCE: ["boutique", "personnel", "evenements"],
  MAISON:   ["personnel", "evenements"],
  DOMAINE:  ["personnel", "evenements"],
  TERRAIN:  ["personnel", "evenements"],
};

const TAB_LABELS = {
  garnison:    "Garnison",
  cachot:      "Cachot",
  audiences:   "Audiences",
  chambres:    "Chambres",
  taverne:     "Taverne",
  rumeurs:     "Rumeurs",
  menu:        "Menu",
  production:  "Production",
  fabrication: "Fabrication",
  boutique:    "Boutique",
  personnel:   "Personnel",
  evenements:  "Événements",
};

const PropertyDetailView = ({
  property,
  citizens = [],
  user,
  session,
  isOwner,
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
  const type = prop?.type || "MAISON";
  const tabs = TYPE_TABS[type] || ["personnel", "evenements"];

  const [activeTab, setActiveTab] = useState(tabs[0]);

  // Formulaires
  const [staffCitizenId, setStaffCitizenId] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [staffSalary, setStaffSalary] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [tavernMsg, setTavernMsg] = useState("");
  const [rumorText, setRumorText] = useState("");
  const [audienceSubject, setAudienceSubject] = useState("");
  const [audienceText, setAudienceText] = useState("");
  const [prisonCitizen, setPrisonCitizen] = useState("");
  const [prisonReason, setPrisonReason] = useState("");
  const [garrisonCitizen, setGarrisonCitizen] = useState("");
  // Chambres
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPrice, setNewRoomPrice] = useState("");
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [editRoomPrice, setEditRoomPrice] = useState("");
  // Production
  const [prodItem, setProdItem] = useState(prop?.production?.itemName || "");
  const [prodQty, setProdQty] = useState(prop?.production?.qtyPerDay || "");
  // Boutique
  const [shopItemName, setShopItemName] = useState("");
  const [shopItemQty, setShopItemQty] = useState("");
  const [shopItemPrice, setShopItemPrice] = useState("");
  // Menu
  const [menuItemName, setMenuItemName] = useState("");
  const [menuItemPrice, setMenuItemPrice] = useState("");
  const [menuItemStock, setMenuItemStock] = useState("");
  // Atelier (state au lieu de getElementById)
  const [recipeInputItem, setRecipeInputItem] = useState("");
  const [recipeInputQty, setRecipeInputQty] = useState("");
  const [recipeOutputItem, setRecipeOutputItem] = useState("");
  const [recipeOutputQty, setRecipeOutputQty] = useState("");

  if (!prop) return null;

  const accentColor = TYPE_COLORS[type] || "#78716C";

  return (
    <div className="space-y-5 animate-fadeIn pb-10">

      {/* ── HEADER ── */}
      <div
        className="bg-white border-l-8 p-6 rounded-r-xl shadow-lg flex flex-col md:flex-row justify-between items-start gap-4"
        style={{ borderColor: accentColor }}
      >
        <div className="flex-1 min-w-0">
          {/* Retour + badge type */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={onBack}
              className="text-stone-400 hover:text-stone-700 transition-colors p-1 rounded hover:bg-stone-100"
            >
              <ArrowLeft size={18} />
            </button>
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ color: accentColor, backgroundColor: accentColor + "18" }}
            >
              {PROP_TYPES[type] || type}
            </span>
            {isOwner && (
              <span className="bg-yellow-100 text-yellow-800 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-yellow-200">
                Propriétaire
              </span>
            )}
          </div>

          {/* Nom */}
          <h1 className="text-3xl font-black font-serif text-stone-900 leading-tight">
            {prop.name}
          </h1>

          {/* Localisation + propriétaire */}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-stone-500">
            {prop.location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-stone-400" /> {prop.location}
              </span>
            )}
            {prop.ownerName && (
              <span className="flex items-center gap-1">
                <Building2 size={12} className="text-stone-400" />
                {prop.ownerName}{prop.ownerType === "COMPANY" ? " (Entreprise)" : ""}
              </span>
            )}
          </div>

          {/* Description */}
          {prop.description && (
            <p className="text-sm text-stone-500 mt-3 leading-relaxed max-w-lg italic">
              "{prop.description}"
            </p>
          )}
        </div>

        {/* Panneau stats */}
        {(prop.price > 0 || (prop.income || 0) > 0) && (
          <div className="flex flex-row md:flex-col gap-3 shrink-0">
            {prop.price > 0 && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-right min-w-[150px]">
                <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">
                  Valeur estimée
                </div>
                <div className="text-2xl font-mono font-black text-stone-800">
                  {prop.price.toLocaleString()} <span className="text-sm font-bold text-stone-500">Écus</span>
                </div>
              </div>
            )}
            {(prop.income || 0) > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-right min-w-[150px]">
                <div className="text-[10px] font-black uppercase text-green-500 tracking-widest mb-1 flex items-center justify-end gap-1">
                  <TrendingUp size={10} /> Revenu / jour
                </div>
                <div className="text-2xl font-mono font-black text-green-700">
                  +{prop.income} <span className="text-sm font-bold text-green-500">Écus</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BARRE D'ONGLETS ── */}
      <div className="flex gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-colors ${
              activeTab === tab
                ? "bg-stone-800 text-white"
                : "text-stone-500 hover:bg-stone-100"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* ── GARNISON ── */}
      {activeTab === "garnison" && (
        <Card title="Garnison" icon={Shield}>
          <div className="space-y-2">
            {(prop.garrison || []).length === 0 && (
              <p className="text-stone-400 text-xs italic">Aucun garde assigné.</p>
            )}
            {(prop.garrison || []).map((g) => (
              <div key={g.id} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2 text-sm border border-stone-100">
                <span className="font-bold text-stone-700">{g.name}</span>
                {isOwner && (
                  <button onClick={() => onRemoveGarrison(prop.id, g.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
            {isOwner && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                <div className="flex-1">
                  <UserSearchSelect users={citizens} onSelect={setGarrisonCitizen} value={garrisonCitizen} placeholder="Ajouter un garde..." />
                </div>
                <button
                  onClick={() => { if (garrisonCitizen) { onAddGarrison(prop.id, garrisonCitizen); setGarrisonCitizen(""); } }}
                  disabled={!garrisonCitizen}
                  className="bg-stone-800 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus size={12} /> Ajouter
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── CACHOT ── */}
      {activeTab === "cachot" && (
        <Card title="Cachot" icon={Lock}>
          <div className="space-y-2">
            {(prop.dungeon || []).length === 0 && (
              <p className="text-stone-400 text-xs italic">Le cachot est vide.</p>
            )}
            {(prop.dungeon || []).map((d) => (
              <div key={d.citizenId} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs">
                <div>
                  <span className="font-bold text-red-700">{d.citizenName}</span>
                  {d.reason && <span className="text-red-500 ml-2">— {d.reason}</span>}
                </div>
                {isOwner && (
                  <button
                    onClick={() => onReleasePrisoner(prop.id, d.citizenId)}
                    className="text-green-700 text-[10px] font-bold uppercase border border-green-200 bg-green-50 px-2 py-1 rounded hover:bg-green-100"
                  >
                    Libérer
                  </button>
                )}
              </div>
            ))}
            {isOwner && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                <div className="flex-1">
                  <UserSearchSelect users={citizens} onSelect={setPrisonCitizen} value={prisonCitizen} placeholder="Emprisonner..." />
                </div>
                <input className="w-32 p-1.5 border rounded text-xs" placeholder="Motif" value={prisonReason} onChange={(e) => setPrisonReason(e.target.value)} />
                <button
                  onClick={() => { if (prisonCitizen) { onImprison(prop.id, prisonCitizen, prisonReason); setPrisonCitizen(""); setPrisonReason(""); } }}
                  disabled={!prisonCitizen}
                  className="bg-red-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase disabled:opacity-50"
                >
                  Enfermer
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── AUDIENCES ── */}
      {activeTab === "audiences" && (
        <Card title="Salle du Trône — Audiences" icon={Crown}>
          <div className="space-y-3">
            {(prop.audiences || []).filter((a) => a.status === "PENDING").length === 0 && (
              <p className="text-stone-400 text-xs italic">Aucune audience en attente.</p>
            )}
            {(prop.audiences || []).filter((a) => a.status === "PENDING").map((a) => (
              <div key={a.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
                <div className="font-bold text-stone-700">{a.from} — {a.subject}</div>
                {a.text && <p className="text-stone-600 mt-1">{a.text}</p>}
                {isOwner && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => onRespondAudience(prop.id, a.id, "ACCEPTED")} className="bg-green-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase">Accepter</button>
                    <button onClick={() => onRespondAudience(prop.id, a.id, "REFUSED")} className="bg-red-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase">Refuser</button>
                  </div>
                )}
              </div>
            ))}
            {!isOwner && (
              <div className="space-y-2 pt-3 border-t border-stone-100">
                <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2">Soumettre une requête</div>
                <input className="w-full p-2 border rounded text-sm" placeholder="Sujet de l'audience" value={audienceSubject} onChange={(e) => setAudienceSubject(e.target.value)} />
                <textarea className="w-full p-2 border rounded text-sm" rows={2} placeholder="Votre requête..." value={audienceText} onChange={(e) => setAudienceText(e.target.value)} />
                <button
                  onClick={() => { if (audienceSubject.trim()) { onRequestAudience(prop.id, audienceSubject, audienceText); setAudienceSubject(""); setAudienceText(""); } }}
                  disabled={!audienceSubject.trim()}
                  className="bg-stone-800 text-yellow-500 px-4 py-2 rounded text-xs font-bold uppercase disabled:opacity-50"
                >
                  Demander une audience
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── CHAMBRES ── */}
      {activeTab === "chambres" && (
        <Card title="Chambres" icon={Home}>
          <div className="space-y-2">
            {(prop.rooms || []).length === 0 && (
              <p className="text-stone-400 text-xs italic">Aucune chambre configurée.</p>
            )}
            {(prop.rooms || []).map((r) => (
              <div key={r.id} className="bg-stone-50 rounded-lg border border-stone-100 px-3 py-2">
                {editingRoomId === r.id ? (
                  <div className="flex items-center gap-2">
                    <input className="flex-1 p-1.5 border rounded text-xs font-bold" value={editRoomName} onChange={(e) => setEditRoomName(e.target.value)} />
                    <input className="w-20 p-1.5 border rounded text-xs font-mono" type="number" value={editRoomPrice} onChange={(e) => setEditRoomPrice(e.target.value)} />
                    <button
                      onClick={() => {
                        const rooms = (prop.rooms || []).map((rm) =>
                          rm.id === r.id ? { ...rm, name: editRoomName.trim() || rm.name, pricePerNight: parseInt(editRoomPrice) || 0 } : rm
                        );
                        onSetupRooms(prop.id, rooms);
                        setEditingRoomId(null);
                      }}
                      className="text-green-600 hover:text-green-500 p-1"
                    >
                      <Save size={14} />
                    </button>
                    <button onClick={() => setEditingRoomId(null)} className="text-stone-400 hover:text-stone-600 p-1">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-700 text-sm">{r.name}</span>
                      <span className="ml-2 font-mono text-yellow-700 text-xs">{r.pricePerNight} Écus/nuit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.tenantId ? (
                        <>
                          <span className="text-xs text-blue-600 font-bold">{r.tenantName}</span>
                          {(isOwner || r.tenantId === user?.id) && (
                            <button onClick={() => onCheckoutRoom(prop.id, r.id)} className="text-red-400 text-[10px] font-bold uppercase border border-red-200 px-2 py-0.5 rounded hover:bg-red-50">
                              Libérer
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-green-600 italic">Libre</span>
                          {!isOwner && (
                            <button
                              onClick={() => onBookRoom(prop.id, r.id)}
                              disabled={(user?.balance || 0) < r.pricePerNight}
                              className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase disabled:opacity-50"
                            >
                              Réserver
                            </button>
                          )}
                        </>
                      )}
                      {isOwner && (
                        <>
                          <button
                            onClick={() => { setEditingRoomId(r.id); setEditRoomName(r.name); setEditRoomPrice(String(r.pricePerNight || 0)); }}
                            className="text-stone-400 hover:text-stone-600 p-1"
                            title="Modifier"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => {
                              if (r.tenantId) return;
                              onSetupRooms(prop.id, (prop.rooms || []).filter((rm) => rm.id !== r.id));
                            }}
                            className={`p-1 ${r.tenantId ? "text-stone-200 cursor-not-allowed" : "text-red-400 hover:text-red-600"}`}
                            title={r.tenantId ? "Chambre occupée" : "Supprimer"}
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isOwner && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Nom de la chambre" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
                <input className="w-20 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Prix/nuit" value={newRoomPrice} onChange={(e) => setNewRoomPrice(e.target.value)} />
                <button
                  onClick={() => {
                    if (newRoomName.trim()) {
                      onSetupRooms(prop.id, [...(prop.rooms || []), { id: Date.now(), name: newRoomName.trim(), pricePerNight: parseInt(newRoomPrice) || 0, tenantId: null, tenantName: null }]);
                      setNewRoomName(""); setNewRoomPrice("");
                    }
                  }}
                  className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase flex items-center gap-1"
                >
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── TAVERNE ── */}
      {activeTab === "taverne" && (
        <Card title="Taverne" icon={MessageSquare}>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {(prop.tavernMessages || []).length === 0 && (
              <p className="text-stone-400 text-xs italic">La taverne est silencieuse...</p>
            )}
            {(prop.tavernMessages || []).map((m) => (
              <div key={m.id} className="bg-stone-50 rounded-lg px-3 py-2 text-xs border border-stone-100">
                <span className="font-bold text-stone-700">{m.authorName}</span>
                <span className="text-stone-400 mx-1">·</span>
                <span className="text-stone-600">{m.text}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
            <input
              className="flex-1 p-2 border rounded text-sm"
              placeholder="Dire quelque chose..."
              value={tavernMsg}
              onChange={(e) => setTavernMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && tavernMsg.trim()) { onPostTavernMessage(prop.id, tavernMsg.trim()); setTavernMsg(""); } }}
            />
            <button
              onClick={() => { if (tavernMsg.trim()) { onPostTavernMessage(prop.id, tavernMsg.trim()); setTavernMsg(""); } }}
              className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase"
            >
              <MessageSquare size={13} />
            </button>
          </div>
        </Card>
      )}

      {/* ── RUMEURS ── */}
      {activeTab === "rumeurs" && (
        <Card title="Tableau des Rumeurs" icon={Eye}>
          <div className="space-y-2">
            {(prop.rumors || []).length === 0 && (
              <p className="text-stone-400 text-xs italic">Aucune rumeur affichée.</p>
            )}
            {(prop.rumors || []).map((r) => (
              <div key={r.id} className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs flex items-start justify-between gap-2">
                <span className="italic text-stone-600">"{r.text}"</span>
                {isOwner && (
                  <button onClick={() => onDeleteRumor(prop.id, r.id)} className="text-red-400 shrink-0 hover:text-red-600">
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
            <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
              <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Poster une rumeur anonyme..." value={rumorText} onChange={(e) => setRumorText(e.target.value)} />
              <button
                onClick={() => { if (rumorText.trim()) { onPostRumor(prop.id, rumorText.trim()); setRumorText(""); } }}
                className="bg-yellow-500 text-stone-900 px-3 rounded text-[10px] font-bold uppercase"
              >
                Poster
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* ── MENU ── */}
      {activeTab === "menu" && (
        <Card title="Menu / Restauration" icon={Utensils}>
          <div className="space-y-2">
            {(prop.menu || []).length === 0 && (
              <p className="text-stone-400 text-xs italic">Aucun article au menu.</p>
            )}
            {(prop.menu || []).map((m, i) => (
              <div key={i} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2 text-sm border border-stone-100">
                <div>
                  <span className="font-bold text-stone-700">{m.itemName}</span>
                  <span className="font-mono text-yellow-700 ml-2 text-xs">{m.price} Écus</span>
                  <span className="text-stone-400 text-xs ml-1">(stock : {m.stock})</span>
                </div>
                {!isOwner && m.stock > 0 && (
                  <button
                    onClick={() => onBuyFromMenu(prop.id, m.itemName)}
                    disabled={(user?.balance || 0) < m.price}
                    className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase disabled:opacity-50"
                  >
                    Acheter
                  </button>
                )}
              </div>
            ))}
            {isOwner && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Article" value={menuItemName} onChange={(e) => setMenuItemName(e.target.value)} />
                <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Prix" value={menuItemPrice} onChange={(e) => setMenuItemPrice(e.target.value)} />
                <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Stock" value={menuItemStock} onChange={(e) => setMenuItemStock(e.target.value)} />
                <button
                  onClick={() => {
                    if (menuItemName.trim()) {
                      onUpdatePropertyFeature(prop.id, "menu", [...(prop.menu || []), { itemName: menuItemName.trim(), price: parseInt(menuItemPrice) || 0, stock: parseInt(menuItemStock) || 0 }]);
                      setMenuItemName(""); setMenuItemPrice(""); setMenuItemStock("");
                    }
                  }}
                  className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase"
                >
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── PRODUCTION AGRICOLE ── */}
      {activeTab === "production" && (
        <Card title="Production Agricole" icon={Package}>
          <div className="space-y-4">
            {prop.production?.itemName ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="text-[10px] font-black uppercase text-green-500 tracking-widest mb-2">Production active</div>
                <div className="text-lg font-bold text-green-800">{prop.production.itemName}</div>
                <div className="font-mono text-green-600 font-bold">
                  +{prop.production.qtyPerDay} unité{prop.production.qtyPerDay > 1 ? "s" : ""} / jour RP
                </div>
                {prop.production.lastProduced && (
                  <div className="text-[10px] text-stone-400 mt-2">Dernière production : {prop.production.lastProduced}</div>
                )}
              </div>
            ) : (
              <p className="text-stone-400 text-xs italic">Aucune production configurée.</p>
            )}
            {isOwner && (
              <div className="flex gap-2 pt-3 border-t border-stone-100">
                <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Nom du produit (ex : Blé, Vin...)" value={prodItem} onChange={(e) => setProdItem(e.target.value)} />
                <input className="w-20 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Qté/j" value={prodQty} onChange={(e) => setProdQty(e.target.value)} />
                <button
                  onClick={() => { if (prodItem.trim()) { onUpdatePropertyFeature(prop.id, "production", { itemName: prodItem.trim(), qtyPerDay: parseInt(prodQty) || 1, lastProduced: prop.production?.lastProduced }); } }}
                  className="bg-green-600 text-white px-3 rounded text-[10px] font-bold uppercase"
                >
                  Configurer
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── FABRICATION ── */}
      {activeTab === "fabrication" && (
        <Card title="Atelier de Fabrication" icon={Hammer}>
          <div className="space-y-2">
            {(prop.craftRecipes || []).length === 0 && (
              <p className="text-stone-400 text-xs italic">Aucune recette configurée.</p>
            )}
            {(prop.craftRecipes || []).map((r) => (
              <div key={r.id} className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
                <span className="text-stone-500">{r.inputQty}× {r.inputItem}</span>
                <span className="text-stone-400">→</span>
                <span className="font-bold text-stone-700">{r.outputQty}× {r.outputItem}</span>
              </div>
            ))}
            {isOwner && (
              <div className="bg-stone-50 rounded-lg p-3 space-y-2 mt-2 border border-stone-200">
                <div className="text-[10px] font-bold uppercase text-stone-400">Ajouter une recette</div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="p-1.5 border rounded text-xs" placeholder="Matière première" value={recipeInputItem} onChange={(e) => setRecipeInputItem(e.target.value)} />
                  <input className="p-1.5 border rounded text-xs font-mono" type="number" placeholder="Qté entrée" value={recipeInputQty} onChange={(e) => setRecipeInputQty(e.target.value)} />
                  <input className="p-1.5 border rounded text-xs" placeholder="Produit fini" value={recipeOutputItem} onChange={(e) => setRecipeOutputItem(e.target.value)} />
                  <input className="p-1.5 border rounded text-xs font-mono" type="number" placeholder="Qté sortie" value={recipeOutputQty} onChange={(e) => setRecipeOutputQty(e.target.value)} />
                </div>
                <button
                  onClick={() => {
                    if (recipeInputItem && recipeOutputItem) {
                      onUpdatePropertyFeature(prop.id, "craftRecipes", [
                        ...(prop.craftRecipes || []),
                        { id: Date.now(), inputItem: recipeInputItem, inputQty: parseInt(recipeInputQty) || 1, outputItem: recipeOutputItem, outputQty: parseInt(recipeOutputQty) || 1 },
                      ]);
                      setRecipeInputItem(""); setRecipeInputQty(""); setRecipeOutputItem(""); setRecipeOutputQty("");
                    }
                  }}
                  className="bg-stone-800 text-white px-4 py-1.5 rounded text-[10px] font-bold uppercase w-full"
                >
                  Ajouter recette
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── BOUTIQUE ── */}
      {activeTab === "boutique" && (
        <Card title="Étal / Boutique" icon={ShoppingBag}>
          <div className="space-y-2">
            {(prop.shopStock || []).length === 0 && (
              <p className="text-stone-400 text-xs italic">Aucun article en stock.</p>
            )}
            {(prop.shopStock || []).map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2 text-sm border border-stone-100">
                <div>
                  <span className="font-bold text-stone-700">{s.itemName}</span>
                  <span className="font-mono text-yellow-700 ml-2 text-xs">{s.price} Écus</span>
                  <span className="text-stone-400 text-xs ml-1">(stock : {s.qty})</span>
                </div>
                {!isOwner && s.qty > 0 && (
                  <button
                    onClick={() => onBuyFromShop(prop.id, s.itemName)}
                    disabled={(user?.balance || 0) < s.price}
                    className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase disabled:opacity-50"
                  >
                    Acheter
                  </button>
                )}
              </div>
            ))}
            {isOwner && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Article" value={shopItemName} onChange={(e) => setShopItemName(e.target.value)} />
                <input className="w-14 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Qté" value={shopItemQty} onChange={(e) => setShopItemQty(e.target.value)} />
                <input className="w-14 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Prix" value={shopItemPrice} onChange={(e) => setShopItemPrice(e.target.value)} />
                <button
                  onClick={() => {
                    if (shopItemName.trim()) {
                      onUpdatePropertyFeature(prop.id, "shopStock", [...(prop.shopStock || []), { itemName: shopItemName.trim(), qty: parseInt(shopItemQty) || 0, price: parseInt(shopItemPrice) || 0 }]);
                      setShopItemName(""); setShopItemQty(""); setShopItemPrice("");
                    }
                  }}
                  className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase"
                >
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── PERSONNEL ── */}
      {activeTab === "personnel" && (
        <Card title={`Personnel${(prop.staff || []).length > 0 ? ` (${prop.staff.length})` : ""}`} icon={UserPlus}>
          <div className="space-y-2">
            {(prop.staff || []).length === 0 && (
              <p className="text-stone-400 text-xs italic">Aucun personnel.</p>
            )}
            {(prop.staff || []).map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2 text-sm border border-stone-100">
                <div>
                  <span className="font-bold text-stone-700">{s.name}</span>
                  <span className="text-xs text-stone-400 ml-2">{s.role}</span>
                  {s.salary > 0 && (
                    <span className="ml-2 font-mono text-yellow-700 text-xs">{s.salary} Écus/jour</span>
                  )}
                </div>
                {isOwner && (
                  <button onClick={() => onRemovePropertyStaff(prop.id, s.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
            {isOwner && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                <div className="flex-1">
                  <UserSearchSelect users={citizens} onSelect={setStaffCitizenId} value={staffCitizenId} placeholder="Embaucher..." />
                </div>
                <input className="w-24 p-1.5 border rounded text-xs" placeholder="Rôle" value={staffRole} onChange={(e) => setStaffRole(e.target.value)} />
                <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Salaire" value={staffSalary} onChange={(e) => setStaffSalary(e.target.value)} />
                <button
                  onClick={() => { if (staffCitizenId) { onAddPropertyStaff(prop.id, staffCitizenId, staffRole || "Employé", staffSalary); setStaffCitizenId(""); setStaffRole(""); setStaffSalary(""); } }}
                  disabled={!staffCitizenId}
                  className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── ÉVÉNEMENTS ── */}
      {activeTab === "evenements" && (
        <Card title={`Événements${(prop.propertyEvents || []).length > 0 ? ` (${prop.propertyEvents.length})` : ""}`} icon={Calendar}>
          <div className="space-y-2">
            {(prop.propertyEvents || []).length === 0 && (
              <p className="text-stone-400 text-xs italic">Aucun événement prévu.</p>
            )}
            {(prop.propertyEvents || []).map((e) => (
              <div key={e.id} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-stone-700 flex items-center gap-2">
                    {e.title}
                    {e.date && (
                      <span className="text-[10px] font-mono text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">{e.date}</span>
                    )}
                  </div>
                  {e.desc && <p className="text-stone-500 mt-0.5">{e.desc}</p>}
                </div>
                {isOwner && (
                  <button onClick={() => onRemovePropertyEvent(prop.id, e.id)} className="text-red-400 shrink-0 hover:text-red-600">
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
            {isOwner && (
              <div className="space-y-2 mt-3 pt-3 border-t border-stone-100">
                <div className="flex gap-2">
                  <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Titre" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
                  <input className="w-28 p-1.5 border rounded text-xs" placeholder="Date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Description" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} />
                  <button
                    onClick={() => { if (eventTitle.trim()) { onAddPropertyEvent(prop.id, { title: eventTitle.trim(), desc: eventDesc, date: eventDate }); setEventTitle(""); setEventDesc(""); setEventDate(""); } }}
                    className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase flex items-center gap-1"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

    </div>
  );
};

export default PropertyDetailView;
