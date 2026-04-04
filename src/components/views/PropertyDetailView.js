import React, { useState } from "react";
import {
  MapPin, Shield, Users, MessageSquare, Lock, Home, Utensils, Eye,
  Package, Hammer, ShoppingBag, Calendar, Plus, Trash2, X, ArrowLeft,
  Coins, Crown, UserPlus, Pencil, Save,
} from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";

const PROP_TYPES = {
  MAISON: "Maison", DOMAINE: "Domaine", TERRAIN: "Terrain",
  COMMERCE: "Local Commercial", FERME: "Ferme",
  MANOIR: "Manoir / Château", ATELIER: "Atelier", AUBERGE: "Auberge / Taverne",
};

const PropertyDetailView = ({
  property,
  citizens = [],
  user,
  session,
  isOwner,
  // Actions spéciales
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

  // Local state pour formulaires (doit être avant tout return conditionnel)
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
  // Rooms
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPrice, setNewRoomPrice] = useState("");
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [editRoomPrice, setEditRoomPrice] = useState("");
  // Production
  const [prodItem, setProdItem] = useState(prop?.production?.itemName || "");
  const [prodQty, setProdQty] = useState(prop?.production?.qtyPerDay || "");
  // Shop
  const [shopItemName, setShopItemName] = useState("");
  const [shopItemQty, setShopItemQty] = useState("");
  const [shopItemPrice, setShopItemPrice] = useState("");
  // Menu
  const [menuItemName, setMenuItemName] = useState("");
  const [menuItemPrice, setMenuItemPrice] = useState("");
  const [menuItemStock, setMenuItemStock] = useState("");
  const [editingMenuIdx, setEditingMenuIdx] = useState(null);
  const [editMenuName, setEditMenuName] = useState("");
  const [editMenuPrice, setEditMenuPrice] = useState("");
  const [editMenuStock, setEditMenuStock] = useState("");

  if (!prop) return null;

  const type = prop.type || "MAISON";
  const isChateau = type === "MANOIR";
  const isAuberge = type === "AUBERGE";
  const isFerme = type === "FERME";
  const isAtelier = type === "ATELIER";
  const isCommerce = type === "COMMERCE";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-stone-400 hover:text-stone-600 p-1"><ArrowLeft size={20} /></button>
        <MapPin size={24} className="text-stone-400" />
        <div>
          <h2 className="text-2xl font-black font-serif text-stone-800">{prop.name}</h2>
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{PROP_TYPES[type] || type}</span>
            {prop.location && <span>{prop.location}</span>}
            <span>Propriétaire : {prop.ownerName}{prop.ownerType === "COMPANY" ? " (Entreprise)" : ""}</span>
          </div>
        </div>
      </div>

      {prop.description && <p className="text-sm text-stone-600 bg-stone-50 border border-stone-200 rounded-lg p-3">{prop.description}</p>}

      {/* === CHÂTEAU / MANOIR === */}
      {isChateau && (
        <>
          {/* Garnison */}
          <Card title="Garnison" icon={Shield}>
            <div className="space-y-2">
              {(prop.garrison || []).length === 0 && <p className="text-stone-400 text-xs italic">Aucun garde assigné.</p>}
              {(prop.garrison || []).map((g) => (
                <div key={g.id} className="flex items-center justify-between bg-stone-50 rounded px-3 py-2 text-sm">
                  <span className="font-bold text-stone-700">{g.name}</span>
                  {isOwner && <button onClick={() => onRemoveGarrison(prop.id, g.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>}
                </div>
              ))}
              {isOwner && (
                <div className="flex gap-2 mt-2">
                  <div className="flex-1"><UserSearchSelect users={citizens} onSelect={setGarrisonCitizen} value={garrisonCitizen} placeholder="Ajouter un garde..." /></div>
                  <button onClick={() => { if (garrisonCitizen) { onAddGarrison(prop.id, garrisonCitizen); setGarrisonCitizen(""); } }} disabled={!garrisonCitizen} className="bg-stone-800 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase disabled:opacity-50"><Plus size={12} /></button>
                </div>
              )}
            </div>
          </Card>

          {/* Cachot */}
          <Card title="Cachot" icon={Lock}>
            <div className="space-y-2">
              {(prop.dungeon || []).length === 0 && <p className="text-stone-400 text-xs italic">Le cachot est vide.</p>}
              {(prop.dungeon || []).map((d) => (
                <div key={d.citizenId} className="flex items-center justify-between bg-red-50 border border-red-200 rounded px-3 py-2 text-xs">
                  <div><span className="font-bold text-red-700">{d.citizenName}</span> — <span className="text-red-500">{d.reason}</span></div>
                  {isOwner && <button onClick={() => onReleasePrisoner(prop.id, d.citizenId)} className="text-green-600 hover:text-green-500 text-[10px] font-bold uppercase">Libérer</button>}
                </div>
              ))}
              {isOwner && (
                <div className="flex gap-2 mt-2">
                  <div className="flex-1"><UserSearchSelect users={citizens} onSelect={setPrisonCitizen} value={prisonCitizen} placeholder="Emprisonner..." /></div>
                  <input className="w-32 p-1.5 border rounded text-xs" placeholder="Motif" value={prisonReason} onChange={(e) => setPrisonReason(e.target.value)} />
                  <button onClick={() => { if (prisonCitizen) { onImprison(prop.id, prisonCitizen, prisonReason); setPrisonCitizen(""); setPrisonReason(""); } }} disabled={!prisonCitizen} className="bg-red-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase disabled:opacity-50">Enfermer</button>
                </div>
              )}
            </div>
          </Card>

          {/* Audiences */}
          <Card title="Salle du Trône — Audiences" icon={Crown}>
            <div className="space-y-2">
              {(prop.audiences || []).filter((a) => a.status === "PENDING").map((a) => (
                <div key={a.id} className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs">
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
                <div className="space-y-2 mt-2">
                  <input className="w-full p-2 border rounded text-sm" placeholder="Sujet de l'audience" value={audienceSubject} onChange={(e) => setAudienceSubject(e.target.value)} />
                  <textarea className="w-full p-2 border rounded text-sm" rows={2} placeholder="Votre requête..." value={audienceText} onChange={(e) => setAudienceText(e.target.value)} />
                  <button onClick={() => { if (audienceSubject.trim()) { onRequestAudience(prop.id, audienceSubject, audienceText); setAudienceSubject(""); setAudienceText(""); } }} disabled={!audienceSubject.trim()} className="bg-stone-800 text-yellow-500 px-4 py-2 rounded text-xs font-bold uppercase disabled:opacity-50">Demander une audience</button>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* === AUBERGE / TAVERNE === */}
      {isAuberge && (
        <>
          {/* Chambres */}
          <Card title="Chambres" icon={Home}>
            <div className="space-y-2">
              {(prop.rooms || []).map((r) => (
                <div key={r.id} className="bg-stone-50 rounded-lg border border-stone-100 px-3 py-2">
                  {editingRoomId === r.id ? (
                    /* Mode édition */
                    <div className="flex items-center gap-2">
                      <input className="flex-1 p-1.5 border rounded text-xs font-bold" value={editRoomName} onChange={(e) => setEditRoomName(e.target.value)} />
                      <input className="w-20 p-1.5 border rounded text-xs font-mono" type="number" value={editRoomPrice} onChange={(e) => setEditRoomPrice(e.target.value)} />
                      <button onClick={() => {
                        const rooms = (prop.rooms || []).map((rm) => rm.id === r.id ? { ...rm, name: editRoomName.trim() || rm.name, pricePerNight: parseInt(editRoomPrice) || 0 } : rm);
                        onSetupRooms(prop.id, rooms);
                        setEditingRoomId(null);
                      }} className="text-green-600 hover:text-green-500 p-1"><Save size={14} /></button>
                      <button onClick={() => setEditingRoomId(null)} className="text-stone-400 hover:text-stone-600 p-1"><X size={14} /></button>
                    </div>
                  ) : (
                    /* Mode affichage */
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-stone-700 text-sm">{r.name}</span>
                        <span className="ml-2 font-mono text-yellow-700 text-xs">{r.pricePerNight} Écus/nuit</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.tenantId ? (
                          <>
                            <span className="text-xs text-blue-600 font-bold">{r.tenantName}</span>
                            {(isOwner || r.tenantId === user?.id) && <button onClick={() => onCheckoutRoom(prop.id, r.id)} className="text-red-400 text-[10px] font-bold uppercase">Libérer</button>}
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-green-600 italic">Libre</span>
                            {!isOwner && <button onClick={() => onBookRoom(prop.id, r.id)} disabled={(user?.balance || 0) < r.pricePerNight} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase disabled:opacity-50">Réserver</button>}
                          </>
                        )}
                        {isOwner && (
                          <>
                            <button onClick={() => { setEditingRoomId(r.id); setEditRoomName(r.name); setEditRoomPrice(String(r.pricePerNight || 0)); }} className="text-stone-400 hover:text-stone-600 p-1" title="Modifier"><Pencil size={12} /></button>
                            <button onClick={() => {
                              if (r.tenantId) return;
                              const rooms = (prop.rooms || []).filter((rm) => rm.id !== r.id);
                              onSetupRooms(prop.id, rooms);
                            }} className={`p-1 ${r.tenantId ? "text-stone-200 cursor-not-allowed" : "text-red-400 hover:text-red-600"}`} title={r.tenantId ? "Chambre occupée" : "Supprimer"}><Trash2 size={12} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isOwner && (
                <div className="flex gap-2 mt-2">
                  <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Nom de la chambre" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
                  <input className="w-20 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Prix/nuit" value={newRoomPrice} onChange={(e) => setNewRoomPrice(e.target.value)} />
                  <button onClick={() => { if (newRoomName.trim()) { const rooms = [...(prop.rooms || []), { id: Date.now(), name: newRoomName.trim(), pricePerNight: parseInt(newRoomPrice) || 0, tenantId: null, tenantName: null }]; onSetupRooms(prop.id, rooms); setNewRoomName(""); setNewRoomPrice(""); } }} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase"><Plus size={12} /></button>
                </div>
              )}
            </div>
          </Card>

          {/* Taverne */}
          <Card title="Taverne" icon={MessageSquare}>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(prop.tavernMessages || []).length === 0 && <p className="text-stone-400 text-xs italic">La taverne est silencieuse...</p>}
              {(prop.tavernMessages || []).map((m) => (
                <div key={m.id} className="text-xs"><span className="font-bold text-stone-700">{m.authorName} :</span> <span className="text-stone-600">{m.text}</span></div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <input className="flex-1 p-2 border rounded text-sm" placeholder="Dire quelque chose..." value={tavernMsg} onChange={(e) => setTavernMsg(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && tavernMsg.trim()) { onPostTavernMessage(prop.id, tavernMsg.trim()); setTavernMsg(""); } }} />
              <button onClick={() => { if (tavernMsg.trim()) { onPostTavernMessage(prop.id, tavernMsg.trim()); setTavernMsg(""); } }} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase"><MessageSquare size={12} /></button>
            </div>
          </Card>

          {/* Rumeurs */}
          <Card title="Tableau des Rumeurs" icon={Eye}>
            <div className="space-y-2">
              {(prop.rumors || []).map((r) => (
                <div key={r.id} className="bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-xs flex items-start justify-between">
                  <span className="italic text-stone-600">"{r.text}"</span>
                  {isOwner && <button onClick={() => onDeleteRumor(prop.id, r.id)} className="text-red-400 shrink-0"><Trash2 size={10} /></button>}
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Poster une rumeur anonyme..." value={rumorText} onChange={(e) => setRumorText(e.target.value)} />
                <button onClick={() => { if (rumorText.trim()) { onPostRumor(prop.id, rumorText.trim()); setRumorText(""); } }} className="bg-yellow-500 text-stone-900 px-3 rounded text-[10px] font-bold uppercase">Poster</button>
              </div>
            </div>
          </Card>

          {/* Menu */}
          <Card title="Menu / Restauration" icon={Utensils}>
            <div className="space-y-2">
              {(prop.menu || []).length === 0 && <p className="text-stone-400 text-xs italic">Le menu est vide.</p>}
              {(prop.menu || []).map((m, i) => {
                const infinite = m.stock === -1;
                const available = infinite || m.stock > 0;
                if (editingMenuIdx === i && isOwner) return (
                  <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
                    <input className="flex-1 p-1.5 border rounded text-xs font-bold" value={editMenuName} onChange={(e) => setEditMenuName(e.target.value)} placeholder="Plat" />
                    <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" value={editMenuPrice} onChange={(e) => setEditMenuPrice(e.target.value)} placeholder="Prix" />
                    <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" value={editMenuStock} onChange={(e) => setEditMenuStock(e.target.value)} placeholder="Stock (-1=∞)" />
                    <button onClick={() => {
                      const newMenu = (prop.menu || []).map((item, idx) => idx === i ? { ...item, itemName: editMenuName.trim() || item.itemName, price: parseInt(editMenuPrice) || 0, stock: parseInt(editMenuStock) } : item);
                      onUpdatePropertyFeature(prop.id, "menu", newMenu);
                      setEditingMenuIdx(null);
                    }} className="text-green-600 hover:text-green-500 p-1"><Save size={14} /></button>
                    <button onClick={() => setEditingMenuIdx(null)} className="text-stone-400 hover:text-stone-600 p-1"><X size={14} /></button>
                  </div>
                );
                return (
                  <div key={i} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2 text-sm border border-amber-100">
                    <div>
                      <span className="font-bold text-stone-800">{m.itemName}</span>
                      <span className="font-mono text-yellow-700 ml-2 text-xs">{m.price} Écus</span>
                      <span className={`text-xs ml-2 ${!available ? "text-red-400 font-bold" : "text-stone-400"}`}>
                        {infinite ? "∞ illimité" : !available ? "Épuisé" : `× ${m.stock} restant${m.stock > 1 ? "s" : ""}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isOwner && available && (
                        <button
                          onClick={() => onBuyFromMenu(prop.id, m.itemName)}
                          disabled={(user?.balance || 0) < m.price}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-[10px] font-bold uppercase disabled:opacity-40 flex items-center gap-1"
                          title="Consommé sur place — n'entre pas dans l'inventaire"
                        >
                          <Utensils size={10} /> Commander
                        </button>
                      )}
                      {!isOwner && !available && <span className="text-[10px] text-red-400 font-bold uppercase">Indisponible</span>}
                      {isOwner && (
                        <>
                          <button onClick={() => { setEditingMenuIdx(i); setEditMenuName(m.itemName); setEditMenuPrice(String(m.price)); setEditMenuStock(String(m.stock)); }} className="text-stone-400 hover:text-stone-600 p-1" title="Modifier"><Pencil size={12} /></button>
                          <button onClick={() => { onUpdatePropertyFeature(prop.id, "menu", (prop.menu || []).filter((_, idx) => idx !== i)); }} className="text-red-400 hover:text-red-600 p-1" title="Supprimer"><Trash2 size={12} /></button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {isOwner && (
                <div className="flex gap-2 mt-2">
                  <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Nom du plat" value={menuItemName} onChange={(e) => setMenuItemName(e.target.value)} />
                  <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Prix" value={menuItemPrice} onChange={(e) => setMenuItemPrice(e.target.value)} />
                  <input className="w-20 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Stock (-1=∞)" value={menuItemStock} onChange={(e) => setMenuItemStock(e.target.value)} />
                  <button onClick={() => { if (menuItemName.trim()) { onUpdatePropertyFeature(prop.id, "menu", [...(prop.menu || []), { itemName: menuItemName.trim(), price: parseInt(menuItemPrice) || 0, stock: parseInt(menuItemStock) ?? 0 }]); setMenuItemName(""); setMenuItemPrice(""); setMenuItemStock(""); } }} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase"><Plus size={12} /></button>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* === FERME === */}
      {isFerme && (
        <Card title="Production Agricole" icon={Package}>
          <div className="space-y-3">
            {prop.production?.itemName ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm font-bold text-green-700">Produit : {prop.production.itemName}</div>
                <div className="text-xs text-green-600 font-mono">+{prop.production.qtyPerDay} / jour RP</div>
                {prop.production.lastProduced && <div className="text-[10px] text-stone-400 mt-1">Dernière production : {prop.production.lastProduced}</div>}
              </div>
            ) : (
              <p className="text-stone-400 text-xs italic">Aucune production configurée.</p>
            )}
            {isOwner && (
              <div className="flex gap-2">
                <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Nom du produit (ex: Blé, Vin...)" value={prodItem} onChange={(e) => setProdItem(e.target.value)} />
                <input className="w-20 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Qté/j" value={prodQty} onChange={(e) => setProdQty(e.target.value)} />
                <button onClick={() => { if (prodItem.trim()) { onUpdatePropertyFeature(prop.id, "production", { itemName: prodItem.trim(), qtyPerDay: parseInt(prodQty) || 1, lastProduced: prop.production?.lastProduced }); } }} className="bg-green-600 text-white px-3 rounded text-[10px] font-bold uppercase">Configurer</button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* === ATELIER === */}
      {isAtelier && (
        <Card title="Atelier de Fabrication" icon={Hammer}>
          <div className="space-y-2">
            {(prop.craftRecipes || []).length === 0 && <p className="text-stone-400 text-xs italic">Aucune recette configurée.</p>}
            {(prop.craftRecipes || []).map((r) => (
              <div key={r.id} className="bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs">
                <span className="text-stone-500">{r.inputQty}x {r.inputItem}</span> → <span className="font-bold text-stone-700">{r.outputQty}x {r.outputItem}</span>
              </div>
            ))}
            {isOwner && (
              <div className="bg-stone-50 rounded p-3 space-y-2 mt-2">
                <div className="text-[10px] font-bold uppercase text-stone-400">Ajouter une recette</div>
                <div className="grid grid-cols-2 gap-2">
                  <input id="ri" className="p-1.5 border rounded text-xs" placeholder="Matière première" />
                  <input id="riq" className="p-1.5 border rounded text-xs font-mono" type="number" placeholder="Qté entrée" />
                  <input id="ro" className="p-1.5 border rounded text-xs" placeholder="Produit fini" />
                  <input id="roq" className="p-1.5 border rounded text-xs font-mono" type="number" placeholder="Qté sortie" />
                </div>
                <button onClick={() => {
                  const ri = document.getElementById("ri"), riq = document.getElementById("riq");
                  const ro = document.getElementById("ro"), roq = document.getElementById("roq");
                  if (ri.value && ro.value) {
                    onUpdatePropertyFeature(prop.id, "craftRecipes", [...(prop.craftRecipes || []), { id: Date.now(), inputItem: ri.value, inputQty: parseInt(riq.value) || 1, outputItem: ro.value, outputQty: parseInt(roq.value) || 1 }]);
                    ri.value = ""; riq.value = ""; ro.value = ""; roq.value = "";
                  }
                }} className="bg-stone-800 text-white px-4 py-1.5 rounded text-[10px] font-bold uppercase w-full">Ajouter recette</button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* === COMMERCE === */}
      {isCommerce && (
        <Card title="Étal / Boutique" icon={ShoppingBag}>
          <div className="space-y-2">
            {(prop.shopStock || []).length === 0 && <p className="text-stone-400 text-xs italic">Aucun article en stock.</p>}
            {(prop.shopStock || []).map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-stone-50 rounded px-3 py-2 text-sm border border-stone-100">
                <div><span className="font-bold text-stone-700">{s.itemName}</span> <span className="font-mono text-yellow-700 ml-2">{s.price} Écus</span> <span className="text-stone-400 text-xs ml-1">(stock: {s.qty})</span></div>
                {!isOwner && s.qty > 0 && <button onClick={() => onBuyFromShop(prop.id, s.itemName)} disabled={(user?.balance || 0) < s.price} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase disabled:opacity-50">Acheter</button>}
              </div>
            ))}
            {isOwner && (
              <div className="flex gap-2 mt-2">
                <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Article" value={shopItemName} onChange={(e) => setShopItemName(e.target.value)} />
                <input className="w-14 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Qté" value={shopItemQty} onChange={(e) => setShopItemQty(e.target.value)} />
                <input className="w-14 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Prix" value={shopItemPrice} onChange={(e) => setShopItemPrice(e.target.value)} />
                <button onClick={() => { if (shopItemName.trim()) { onUpdatePropertyFeature(prop.id, "shopStock", [...(prop.shopStock || []), { itemName: shopItemName.trim(), qty: parseInt(shopItemQty) || 0, price: parseInt(shopItemPrice) || 0 }]); setShopItemName(""); setShopItemQty(""); setShopItemPrice(""); } }} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase"><Plus size={12} /></button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* === COMMUN: Personnel === */}
      <Card title="Personnel" icon={UserPlus}>
        <div className="space-y-2">
          {(prop.staff || []).length === 0 && <p className="text-stone-400 text-xs italic">Aucun personnel.</p>}
          {(prop.staff || []).map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-stone-50 rounded px-3 py-2 text-sm">
              <div>
                <span className="font-bold text-stone-700">{s.name}</span>
                <span className="text-xs text-stone-400 ml-2">{s.role}</span>
                {s.salary > 0 && <span className="ml-2 font-mono text-yellow-700 text-xs">{s.salary} Écus/jour</span>}
              </div>
              {isOwner && <button onClick={() => onRemovePropertyStaff(prop.id, s.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>}
            </div>
          ))}
          {isOwner && (
            <div className="flex gap-2 mt-2">
              <div className="flex-1"><UserSearchSelect users={citizens} onSelect={setStaffCitizenId} value={staffCitizenId} placeholder="Embaucher..." /></div>
              <input className="w-24 p-1.5 border rounded text-xs" placeholder="Rôle" value={staffRole} onChange={(e) => setStaffRole(e.target.value)} />
              <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Salaire" value={staffSalary} onChange={(e) => setStaffSalary(e.target.value)} />
              <button onClick={() => { if (staffCitizenId) { onAddPropertyStaff(prop.id, staffCitizenId, staffRole || "Employé", staffSalary); setStaffCitizenId(""); setStaffRole(""); setStaffSalary(""); } }} disabled={!staffCitizenId} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase disabled:opacity-50"><Plus size={12} /></button>
            </div>
          )}
        </div>
      </Card>

      {/* === COMMUN: Événements === */}
      <Card title="Événements" icon={Calendar}>
        <div className="space-y-2">
          {(prop.propertyEvents || []).length === 0 && <p className="text-stone-400 text-xs italic">Aucun événement prévu.</p>}
          {(prop.propertyEvents || []).map((e) => (
            <div key={e.id} className="bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs flex items-start justify-between">
              <div>
                <div className="font-bold text-stone-700">{e.title} {e.date && <span className="text-stone-400 font-normal">— {e.date}</span>}</div>
                {e.desc && <p className="text-stone-500 mt-0.5">{e.desc}</p>}
              </div>
              {isOwner && <button onClick={() => onRemovePropertyEvent(prop.id, e.id)} className="text-red-400 shrink-0"><Trash2 size={10} /></button>}
            </div>
          ))}
          {isOwner && (
            <div className="space-y-2 mt-2">
              <div className="flex gap-2">
                <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Titre" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
                <input className="w-28 p-1.5 border rounded text-xs" placeholder="Date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Description" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} />
                <button onClick={() => { if (eventTitle.trim()) { onAddPropertyEvent(prop.id, { title: eventTitle.trim(), desc: eventDesc, date: eventDate }); setEventTitle(""); setEventDesc(""); setEventDate(""); } }} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase"><Plus size={12} /></button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PropertyDetailView;
