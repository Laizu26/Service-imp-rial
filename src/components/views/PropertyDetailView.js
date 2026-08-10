import React, { useState } from "react";
import {
  MapPin, Shield, Users, MessageSquare, Lock, Home, Utensils, Eye,
  Package, Hammer, ShoppingBag, Calendar, Plus, Trash2, X, ArrowLeft,
  Coins, Crown, UserPlus, Pencil, Save, Building2, Tag, Key, Banknote,
  Image as ImageIcon, Sparkles, Vote, Gift, Ticket,
} from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";
import { formatMoney, getActiveDrunkTiers } from "../../lib/gameUtils";

// Pool d'articles types pour la génération procédurale du menu d'une auberge — évite à
// l'aubergiste de partir d'une page blanche, propose un article plausible qu'il peut ensuite
// ajuster librement (nom, description, prix, catégorie restent tous éditables après génération).
const MENU_ITEM_POOL = {
  "Plats": [
    { itemName: "Ragoût de sanglier", description: "Mijoté toute la nuit avec racines et herbes des bois.", priceRange: [4, 7] },
    { itemName: "Pâté en croûte", description: "Viande hachée et épices, enfermées dans une croûte dorée.", priceRange: [3, 5] },
    { itemName: "Poule au pot", description: "Bouillon parfumé et volaille tendre, servis avec légumes racines.", priceRange: [3, 6] },
    { itemName: "Anguille fumée", description: "Pêchée dans la rivière voisine, fumée au bois de hêtre.", priceRange: [4, 6] },
    { itemName: "Fromage de chèvre grillé", description: "Servi sur une tranche de pain de campagne.", priceRange: [2, 4] },
  ],
  "Boissons": [
    { itemName: "Chope de bière brune", description: "Brassée dans les caves de l'auberge.", priceRange: [1, 2] },
    { itemName: "Hydromel doré", description: "Miel fermenté, doux et capiteux.", priceRange: [2, 4] },
    { itemName: "Vin épicé chaud", description: "Réchauffe le corps et l'âme les soirs d'hiver.", priceRange: [2, 3] },
    { itemName: "Cidre pétillant", description: "Pommes locales pressées et fermentées.", priceRange: [1, 3] },
    { itemName: "Eau-de-vie de prune", description: "Forte et parfumée, à consommer avec modération.", priceRange: [3, 5] },
  ],
  "Entrées": [
    { itemName: "Soupe à l'oignon", description: "Servie brûlante, gratinée de fromage.", priceRange: [1, 3] },
    { itemName: "Tourte aux champignons", description: "Cueillis dans la forêt voisine ce matin.", priceRange: [2, 4] },
    { itemName: "Terrine de campagne", description: "Recette secrète transmise de tavernier en tavernier.", priceRange: [2, 4] },
  ],
  "Desserts": [
    { itemName: "Tarte aux pommes", description: "Croustillante, saupoudrée de cannelle.", priceRange: [2, 3] },
    { itemName: "Flan au miel", description: "Doux et onctueux, parfumé au miel local.", priceRange: [2, 3] },
    { itemName: "Beignets de fête", description: "Frits à la minute, roulés dans le sucre.", priceRange: [1, 3] },
  ],
  "Spécialités": [
    { itemName: "Plat du jour du tavernier", description: "La spécialité maison, différente chaque jour.", priceRange: [3, 6] },
    { itemName: "Assiette du voyageur", description: "Un peu de tout ce que la cuisine a à offrir.", priceRange: [4, 7] },
  ],
};
const MENU_CATEGORIES = Object.keys(MENU_ITEM_POOL);

const generateMenuItem = (category) => {
  const cat = category && MENU_ITEM_POOL[category] ? category : MENU_CATEGORIES[Math.floor(Math.random() * MENU_CATEGORIES.length)];
  const pool = MENU_ITEM_POOL[cat];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const [min, max] = pick.priceRange;
  const price = Math.round((min + Math.random() * (max - min)) * 10) / 10;
  return { itemName: pick.itemName, description: pick.description, category: cat, price };
};

const PROP_TYPES = {
  MAISON: "Maison", DOMAINE: "Domaine", TERRAIN: "Terrain",
  COMMERCE: "Local Commercial", FERME: "Ferme",
  MANOIR: "Manoir / Château", ATELIER: "Atelier", AUBERGE: "Auberge / Taverne",
  BATEAU: "Bateau",
};

/* ── Bloc financier : prix, vente, location — jusque-là absent de cette fiche détail,
   on devait retourner au Registre Foncier pour voir/agir sur ces informations. ── */
const FinancialPanel = ({ prop, user, isOwner, ownerCompany,
  onSellProperty, onCancelPropertySale, onBuyPropertyFromPlayer,
  onListPropertyForRent, onCancelPropertyRental, onEvictTenant,
  onRentProperty, onLeaveTenancy,
}) => {
  const [salePrice, setSalePrice] = useState(prop.salePrice || "");
  const [rentRate, setRentRate] = useState(prop.rental?.dailyRate || "");
  const isTenant = prop.rental && String(prop.rental.tenantId) === String(user?.id);

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Valeur estimée</div>
          <div className="text-xl font-black font-mono text-amber-700">{formatMoney(prop.price || 0)}</div>
        </div>
        {(prop.income || 0) > 0 && (
          <div>
            <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Revenu</div>
            <div className="text-xl font-black font-mono text-green-600">+{formatMoney(prop.income)}/j</div>
          </div>
        )}
        {ownerCompany && (
          <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-bold text-indigo-700">
            <Building2 size={12} /> Détenu par {ownerCompany.name}
          </div>
        )}
      </div>

      {isOwner ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
          {/* Vente */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
            <div className="text-[9px] font-black uppercase text-stone-500 tracking-widest flex items-center gap-1"><Tag size={10} /> Vente</div>
            {prop.forSale ? (
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-amber-700">{formatMoney(prop.salePrice)}</span>
                <button onClick={() => onCancelPropertySale?.(prop.id)} className="text-red-500 text-[10px] font-black uppercase border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Retirer</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="number" step="0.1" className="flex-1 p-1.5 border rounded-lg text-xs font-mono" placeholder="Prix" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
                <button onClick={() => onSellProperty?.(prop.id, salePrice)} disabled={!parseFloat(salePrice)} className="bg-amber-500 text-stone-900 px-3 rounded-lg text-[10px] font-black uppercase disabled:opacity-40">Mettre en vente</button>
              </div>
            )}
          </div>
          {/* Location */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
            <div className="text-[9px] font-black uppercase text-stone-500 tracking-widest flex items-center gap-1"><Key size={10} /> Location</div>
            {prop.rental && prop.rental.tenantId ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-sky-700 font-bold">{prop.rental.tenantName} — {formatMoney(prop.rental.dailyRate)}/j</span>
                <button onClick={() => onEvictTenant?.(prop.id)} className="text-red-500 text-[10px] font-black uppercase border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Expulser</button>
              </div>
            ) : prop.rental ? (
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-sky-700">{formatMoney(prop.rental.dailyRate)}/j</span>
                <button onClick={() => onCancelPropertyRental?.(prop.id)} className="text-red-500 text-[10px] font-black uppercase border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Retirer</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="number" step="0.1" className="flex-1 p-1.5 border rounded-lg text-xs font-mono" placeholder="Tarif/jour" value={rentRate} onChange={(e) => setRentRate(e.target.value)} />
                <button onClick={() => onListPropertyForRent?.(prop.id, rentRate)} disabled={!parseFloat(rentRate)} className="bg-sky-600 text-white px-3 rounded-lg text-[10px] font-black uppercase disabled:opacity-40">Louer</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
          {prop.forSale && (
            <button onClick={() => onBuyPropertyFromPlayer?.(prop.id)} disabled={(user?.balance || 0) < prop.salePrice}
              className="flex items-center gap-1.5 bg-amber-500 text-stone-900 px-4 py-2 rounded-lg font-black text-[10px] uppercase disabled:opacity-40 hover:bg-amber-400 transition-colors">
              <Coins size={12} /> Acheter pour {formatMoney(prop.salePrice)}
            </button>
          )}
          {isTenant ? (
            <button onClick={() => onLeaveTenancy?.(prop.id)} className="flex items-center gap-1.5 text-red-500 border border-red-200 px-4 py-2 rounded-lg font-black text-[10px] uppercase hover:bg-red-50 transition-colors">
              Quitter la location
            </button>
          ) : prop.rental && !prop.rental.tenantId ? (
            <button onClick={() => onRentProperty?.(prop.id)} disabled={(user?.balance || 0) < prop.rental.dailyRate}
              className="flex items-center gap-1.5 bg-sky-600 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase disabled:opacity-40 hover:bg-sky-500 transition-colors">
              <Banknote size={12} /> Louer pour {formatMoney(prop.rental.dailyRate)}/j
            </button>
          ) : null}
          {!prop.forSale && !prop.rental && <span className="text-xs text-stone-400 italic">Ce bien n'est ni à vendre, ni à louer.</span>}
        </div>
      )}
    </div>
  );
};

const PropertyDetailView = ({
  property,
  citizens = [],
  companies = [],
  countries = [],
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
  onGrantFreeMenuItem, onGrantFreePass, onRevokeFreePass, onPayRound, gameDate,
  onCreateTavernPoll, onVoteTavernPoll, onCloseTavernPoll,
  onAddPropertyStaff, onRemovePropertyStaff, onUpdatePropertyStaff,
  onAddPropertyGuest, onRemovePropertyGuest,
  onAddPropertyEvent, onRemovePropertyEvent,
  onSellProperty, onCancelPropertySale, onBuyPropertyFromPlayer,
  onListPropertyForRent, onCancelPropertyRental, onEvictTenant,
  onRentProperty, onLeaveTenancy,
  onBack,
}) => {
  const prop = property;

  // Local state pour formulaires (doit être avant tout return conditionnel)
  const [staffCitizenId, setStaffCitizenId] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [staffSalary, setStaffSalary] = useState("");
  const [guestCitizenId, setGuestCitizenId] = useState("");
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editStaffRole, setEditStaffRole] = useState("");
  const [editStaffSalary, setEditStaffSalary] = useState("");
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
  const [menuFilterCategory, setMenuFilterCategory] = useState("");
  const [menuItemName, setMenuItemName] = useState("");
  const [menuItemDesc, setMenuItemDesc] = useState("");
  const [menuItemCategory, setMenuItemCategory] = useState("");
  const [menuItemImage, setMenuItemImage] = useState("");
  const [menuItemPrice, setMenuItemPrice] = useState("");
  const [menuItemStock, setMenuItemStock] = useState("");
  const [menuItemAlcoholic, setMenuItemAlcoholic] = useState(false);
  const [editingMenuIdx, setEditingMenuIdx] = useState(null);
  const [editMenuName, setEditMenuName] = useState("");
  const [editMenuDesc, setEditMenuDesc] = useState("");
  const [editMenuCategory, setEditMenuCategory] = useState("");
  const [editMenuImage, setEditMenuImage] = useState("");
  const [editMenuPrice, setEditMenuPrice] = useState("");
  const [editMenuStock, setEditMenuStock] = useState("");
  const [editMenuAlcoholic, setEditMenuAlcoholic] = useState(false);
  // Sondage de taverne
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  // Offrir une consommation gratuite
  const [grantCitizenId, setGrantCitizenId] = useState("");
  const [grantItemKey, setGrantItemKey] = useState("");
  // Payer sa tournée
  const [roundItemKey, setRoundItemKey] = useState("");
  // Pass gratuit illimité
  const [passCitizenId, setPassCitizenId] = useState("");

  if (!prop) return null;

  const type = prop.type || "MAISON";
  const isChateau = type === "MANOIR";
  const isAuberge = type === "AUBERGE";
  const isFerme = type === "FERME";
  const isAtelier = type === "ATELIER";
  const isCommerce = type === "COMMERCE";
  const gd = gameDate || { day: 1, month: 1, year: 1200 };
  const todayKey = `${gd.day}/${gd.month}/${gd.year}`;
  const todayConsumers = prop.dailyConsumersDay === todayKey ? (prop.dailyConsumers || []) : [];
  const myDrunkPercent = user?.drunkenness?.day === todayKey ? (user.drunkenness.percent || 0) : 0;
  const myDrunkTiers = getActiveDrunkTiers(myDrunkPercent);
  const isBateau = type === "BATEAU";

  const ownerCompany = prop.ownerType === "COMPANY" ? companies.find((c) => c.id === prop.ownerId) : null;
  const country = countries.find((c) => c.id === prop.countryId);
  const region = country ? (country.regions || []).find((r) => String(r.id) === String(prop.regionId)) : null;
  const location = country ? (region ? `${region.name}, ${country.name}` : country.name) : prop.location;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* En-tête */}
      <div className="bg-gradient-to-br from-stone-900 to-amber-950/30 border border-amber-900/40 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-8xl opacity-5 select-none">🏛️</div>
        <div className="relative">
          <button onClick={onBack} className="flex items-center gap-1.5 text-stone-400 hover:text-amber-300 text-[10px] font-black uppercase tracking-widest mb-3 transition-colors">
            <ArrowLeft size={14} /> Retour au Registre
          </button>
          <div className="flex items-start gap-3">
            <MapPin size={24} className="text-amber-400 shrink-0 mt-1" />
            <div className="min-w-0">
              <h2 className="text-2xl font-black font-serif text-stone-100 truncate">{prop.name}</h2>
              <div className="flex items-center gap-2 text-xs text-stone-400 flex-wrap mt-1">
                <span className="bg-amber-900/30 border border-amber-800/40 text-amber-300 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{PROP_TYPES[type] || type}</span>
                {location && <span>{location}</span>}
                {prop.ownerName && <span>· Propriétaire : {prop.ownerName}{prop.ownerType === "COMPANY" ? " (Entreprise)" : ""}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {prop.description && <p className="text-sm text-stone-600 bg-stone-50 border border-stone-200 rounded-lg p-3">{prop.description}</p>}

      <FinancialPanel
        prop={prop} user={user} isOwner={isOwner} ownerCompany={ownerCompany}
        onSellProperty={onSellProperty} onCancelPropertySale={onCancelPropertySale} onBuyPropertyFromPlayer={onBuyPropertyFromPlayer}
        onListPropertyForRent={onListPropertyForRent} onCancelPropertyRental={onCancelPropertyRental} onEvictTenant={onEvictTenant}
        onRentProperty={onRentProperty} onLeaveTenancy={onLeaveTenancy}
      />

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

      {/* === CHÂTEAU / BATEAU : Cachot (ou cale, pour un navire) === */}
      {(isChateau || isBateau) && (
        <Card title={isBateau ? "Cale — Prisonniers" : "Cachot"} icon={Lock}>
          <div className="space-y-2">
            {(prop.dungeon || []).length === 0 && <p className="text-stone-400 text-xs italic">{isBateau ? "La cale est vide." : "Le cachot est vide."}</p>}
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
      )}

      {/* === AUBERGE / TAVERNE === */}
      {isAuberge && (
        <>
          {/* Sondage de taverne — en tête de l'établissement pour rester bien visible dès
              l'arrivée. Voter exige d'avoir pris une consommation depuis le lancement du
              sondage en cours ; lancer un nouveau sondage réinitialise ce droit pour tout
              le monde. */}
          <Card title="Sondage" icon={Vote}>
            {prop.activePoll ? (() => {
              const poll = prop.activePoll;
              const isEligible = (poll.eligibleVoters || []).map(String).includes(String(user?.id));
              const myVote = (poll.votes || {})[user?.id];
              const totalVotes = Object.keys(poll.votes || {}).length;
              return (
                <div className="space-y-3">
                  <div className="font-bold text-stone-800 text-sm">{poll.question}</div>
                  <div className="space-y-2">
                    {poll.options.map((o) => {
                      const count = Object.values(poll.votes || {}).filter((v) => v === o.id).length;
                      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                      const isMine = myVote === o.id;
                      return (
                        <button
                          key={o.id}
                          onClick={() => isEligible && onVoteTavernPoll && onVoteTavernPoll({ propertyId: prop.id, optionId: o.id })}
                          disabled={!isEligible}
                          className={`w-full text-left p-2.5 rounded-lg border relative overflow-hidden transition-colors ${
                            isMine ? "border-amber-400 bg-amber-50" : "border-stone-200"
                          } ${!isEligible ? "opacity-60 cursor-not-allowed" : "hover:border-amber-300"}`}
                        >
                          <div className="absolute inset-y-0 left-0 bg-amber-100/70" style={{ width: `${pct}%` }} />
                          <div className="relative flex items-center justify-between text-sm">
                            <span className="font-bold text-stone-800">{o.text} {isMine && "✓"}</span>
                            <span className="text-[10px] text-stone-500 font-mono">{count} ({pct}%)</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {!isEligible && (
                    <p className="text-xs text-amber-700 italic flex items-center gap-1.5">
                      <Utensils size={12} /> Prenez une consommation au menu pour pouvoir voter à ce sondage.
                    </p>
                  )}
                  <p className="text-[10px] text-stone-400">{totalVotes} vote{totalVotes > 1 ? "s" : ""}</p>
                  {isOwner && (
                    <button
                      onClick={() => onCloseTavernPoll && onCloseTavernPoll({ propertyId: prop.id })}
                      className="text-[10px] text-red-400 hover:text-red-600 underline"
                    >
                      Clore le sondage
                    </button>
                  )}
                </div>
              );
            })() : (
              <p className="text-stone-400 text-xs italic">Aucun sondage en cours.</p>
            )}

            {isOwner && !prop.activePoll && (
              <div className="mt-3 space-y-2 border-t border-stone-100 pt-3">
                <input
                  className="w-full p-1.5 border rounded text-xs"
                  placeholder="Question du sondage"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                />
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="flex-1 p-1.5 border rounded text-xs"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => { const next = [...pollOptions]; next[i] = e.target.value; setPollOptions(next); }}
                    />
                    {pollOptions.length > 2 && (
                      <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-stone-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => setPollOptions([...pollOptions, ""])} className="text-[10px] text-stone-500 hover:text-stone-700 flex items-center gap-1">
                  <Plus size={10} /> Ajouter une option
                </button>
                <button
                  onClick={() => {
                    if (!pollQuestion.trim() || !onCreateTavernPoll) return;
                    onCreateTavernPoll({ propertyId: prop.id, question: pollQuestion, options: pollOptions });
                    setPollQuestion(""); setPollOptions(["", ""]);
                  }}
                  className="w-full bg-stone-800 text-white py-1.5 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1"
                >
                  <Vote size={12} /> Lancer le sondage
                </button>
              </div>
            )}
          </Card>

          {/* Chambres */}
          <Card title="Chambres" icon={Home}>
            <div className="space-y-2">
              {(prop.rooms || []).map((r) => (
                <div key={r.id} className="bg-stone-50 rounded-lg border border-stone-100 px-3 py-2">
                  {editingRoomId === r.id ? (
                    /* Mode édition */
                    <div className="flex items-center gap-2">
                      <input className="flex-1 p-1.5 border rounded text-xs font-bold" value={editRoomName} onChange={(e) => setEditRoomName(e.target.value)} />
                      <input className="w-20 p-1.5 border rounded text-xs font-mono" type="number" step="0.1" value={editRoomPrice} onChange={(e) => setEditRoomPrice(e.target.value)} />
                      <button onClick={() => {
                        const rooms = (prop.rooms || []).map((rm) => rm.id === r.id ? { ...rm, name: editRoomName.trim() || rm.name, pricePerNight: parseFloat(editRoomPrice) || 0 } : rm);
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
                        <span className="ml-2 font-mono text-yellow-700 text-xs">{formatMoney(r.pricePerNight)}/nuit</span>
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
                  <input className="w-20 p-1.5 border rounded text-xs font-mono" type="number" step="0.1" placeholder="Prix/nuit" value={newRoomPrice} onChange={(e) => setNewRoomPrice(e.target.value)} />
                  <button onClick={() => { if (newRoomName.trim()) { const rooms = [...(prop.rooms || []), { id: Date.now(), name: newRoomName.trim(), pricePerNight: parseFloat(newRoomPrice) || 0, tenantId: null, tenantName: null }]; onSetupRooms(prop.id, rooms); setNewRoomName(""); setNewRoomPrice(""); } }} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase"><Plus size={12} /></button>
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
            <datalist id="menu-categories">
              {[...new Set([...MENU_CATEGORIES, ...(prop.menu || []).map((m) => m.category).filter(Boolean)])].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <div className="space-y-4">
              {(prop.freePassIds || []).map(String).includes(String(user?.id)) && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs font-bold text-purple-700">
                  <Ticket size={14} /> Vous avez un pass gratuit illimité ici — tout est offert.
                </div>
              )}
              {myDrunkPercent > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
                    <span className="text-base shrink-0">🍺</span>
                    Ivresse — {myDrunkPercent}% {myDrunkPercent >= 100 ? "(bourré(e))" : ""}
                  </div>
                  <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, myDrunkPercent)}%` }} />
                  </div>
                  {myDrunkTiers.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {myDrunkTiers.map((t) => (
                        <li key={t.threshold} className="text-[10px] text-purple-800 italic">• {t.desc}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {(prop.menu || []).length === 0 && <p className="text-stone-400 text-xs italic">Le menu est vide.</p>}

              {(() => {
                const menuWithIdx = (prop.menu || []).map((m, i) => ({ ...m, _idx: i }));
                const myFreePass = (prop.freePassIds || []).map(String).includes(String(user?.id));
                const presentCategories = [...new Set(menuWithIdx.map((m) => m.category || "Autres"))];
                const filtered = menuFilterCategory ? menuWithIdx.filter((m) => (m.category || "Autres") === menuFilterCategory) : menuWithIdx;
                const editingItem = editingMenuIdx !== null ? menuWithIdx.find((m) => m._idx === editingMenuIdx) : null;

                return (
                  <>
                    {presentCategories.length > 1 && (
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => setMenuFilterCategory("")}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${!menuFilterCategory ? "bg-amber-600 text-white border-amber-600" : "bg-white text-amber-700 border-amber-200 hover:border-amber-400"}`}
                        >
                          Tout
                        </button>
                        {presentCategories.map((c) => (
                          <button
                            key={c}
                            onClick={() => setMenuFilterCategory(c)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${menuFilterCategory === c ? "bg-amber-600 text-white border-amber-600" : "bg-white text-amber-700 border-amber-200 hover:border-amber-400"}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}

                    {editingItem && isOwner && (
                      <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input className="flex-1 p-1.5 border rounded text-xs font-bold" value={editMenuName} onChange={(e) => setEditMenuName(e.target.value)} placeholder="Plat" />
                          <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" step="0.1" value={editMenuPrice} onChange={(e) => setEditMenuPrice(e.target.value)} placeholder="Prix" />
                          <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" value={editMenuStock} onChange={(e) => setEditMenuStock(e.target.value)} placeholder="Stock (-1=∞)" />
                        </div>
                        <div className="flex items-center gap-2">
                          <input className="w-32 p-1.5 border rounded text-xs" list="menu-categories" placeholder="Catégorie" value={editMenuCategory} onChange={(e) => setEditMenuCategory(e.target.value)} />
                          <input className="flex-1 p-1.5 border rounded text-xs" placeholder="URL de l'image (optionnel)" value={editMenuImage} onChange={(e) => setEditMenuImage(e.target.value)} />
                        </div>
                        <textarea className="w-full p-1.5 border rounded text-xs resize-none" rows={2} placeholder="Description (optionnel)" value={editMenuDesc} onChange={(e) => setEditMenuDesc(e.target.value)} />
                        <label className="flex items-center gap-1.5 text-xs text-stone-600">
                          <input type="checkbox" checked={editMenuAlcoholic} onChange={(e) => setEditMenuAlcoholic(e.target.checked)} />
                          🍺 Alcoolisé
                        </label>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingMenuIdx(null)} className="text-stone-400 hover:text-stone-600 p-1"><X size={14} /></button>
                          <button onClick={() => {
                            const newMenu = (prop.menu || []).map((item, idx) => idx === editingMenuIdx ? {
                              ...item, itemName: editMenuName.trim() || item.itemName, description: editMenuDesc.trim(),
                              category: editMenuCategory.trim() || "Autres", imageUrl: editMenuImage.trim(),
                              price: parseFloat(editMenuPrice) || 0, stock: parseInt(editMenuStock), isAlcoholic: editMenuAlcoholic,
                            } : item);
                            onUpdatePropertyFeature(prop.id, "menu", newMenu);
                            setEditingMenuIdx(null);
                          }} className="text-green-600 hover:text-green-500 p-1"><Save size={14} /></button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filtered.filter((m) => m._idx !== editingMenuIdx).map((m) => {
                        const i = m._idx;
                        const infinite = m.stock === -1;
                        const available = infinite || m.stock > 0;
                        return (
                          <div key={i} className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="relative aspect-square bg-amber-50">
                              {m.imageUrl ? (
                                <img src={m.imageUrl} alt={m.itemName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Utensils size={28} className="text-amber-300" />
                                </div>
                              )}
                              {!available && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="text-white text-[10px] font-black uppercase tracking-widest">Épuisé</span>
                                </div>
                              )}
                              {isOwner && (
                                <div className="absolute top-1 right-1 flex gap-1">
                                  <button onClick={() => {
                                    setEditingMenuIdx(i); setEditMenuName(m.itemName); setEditMenuDesc(m.description || "");
                                    setEditMenuCategory(m.category || ""); setEditMenuImage(m.imageUrl || "");
                                    setEditMenuPrice(String(m.price)); setEditMenuStock(String(m.stock)); setEditMenuAlcoholic(!!m.isAlcoholic);
                                  }} className="bg-white/90 rounded-full p-1 text-stone-500 hover:text-stone-800 shadow" title="Modifier"><Pencil size={11} /></button>
                                  <button onClick={() => { onUpdatePropertyFeature(prop.id, "menu", (prop.menu || []).filter((_, idx) => idx !== i)); }} className="bg-white/90 rounded-full p-1 text-red-400 hover:text-red-600 shadow" title="Supprimer"><Trash2 size={11} /></button>
                                </div>
                              )}
                              {!infinite && available && (
                                <span className="absolute bottom-1 right-1 bg-white/90 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-stone-500 shadow">×{m.stock}</span>
                              )}
                            </div>
                            <div className="p-2.5 flex flex-col flex-1">
                              <div className="font-bold text-stone-800 text-sm leading-tight break-words">
                                {m.itemName} {m.isAlcoholic && <span title="Alcoolisé">🍺</span>}
                              </div>
                              {m.description && <p className="text-[10px] text-stone-500 italic mt-0.5 break-words">{m.description}</p>}
                              <div className="mt-auto pt-2 flex items-center justify-between">
                                {myFreePass ? (
                                  <span className="font-mono text-purple-700 text-xs font-bold flex items-center gap-1"><Ticket size={11} /> Gratuit</span>
                                ) : (
                                  <span className="font-mono text-yellow-700 text-xs font-bold">{formatMoney(m.price)}</span>
                                )}
                                {infinite && <span className="text-[9px] text-stone-400">∞</span>}
                              </div>
                              <button
                                onClick={() => onBuyFromMenu(prop.id, m.id || m.itemName)}
                                disabled={!available || (!myFreePass && (user?.balance || 0) < m.price)}
                                className="mt-2 w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white py-1.5 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1"
                                title={myFreePass ? "Pass gratuit illimité — aucun paiement." : isOwner ? "Payer votre propre consommation, comme n'importe quel client." : "Consommé sur place — n'entre pas dans l'inventaire"}
                              >
                                <Utensils size={10} /> {available ? "Commander" : "Indisponible"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}

              {isOwner && (
                <div className="border border-dashed border-amber-300 rounded-lg p-3 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Nouvel article</span>
                    <button
                      onClick={() => { const g = generateMenuItem(menuItemCategory); setMenuItemName(g.itemName); setMenuItemDesc(g.description); setMenuItemCategory(g.category); setMenuItemPrice(String(g.price)); }}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase text-amber-700 hover:text-amber-900"
                      title="Générer un article procéduralement"
                    >
                      <Sparkles size={12} /> Générer
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Nom du plat" value={menuItemName} onChange={(e) => setMenuItemName(e.target.value)} />
                    <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" step="0.1" placeholder="Prix" value={menuItemPrice} onChange={(e) => setMenuItemPrice(e.target.value)} />
                    <input className="w-20 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Stock (-1=∞)" value={menuItemStock} onChange={(e) => setMenuItemStock(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <input className="w-32 p-1.5 border rounded text-xs" list="menu-categories" placeholder="Catégorie" value={menuItemCategory} onChange={(e) => setMenuItemCategory(e.target.value)} />
                    <input className="flex-1 p-1.5 border rounded text-xs" placeholder="URL de l'image (optionnel)" value={menuItemImage} onChange={(e) => setMenuItemImage(e.target.value)} />
                  </div>
                  <textarea className="w-full p-1.5 border rounded text-xs resize-none" rows={2} placeholder="Description (optionnel)" value={menuItemDesc} onChange={(e) => setMenuItemDesc(e.target.value)} />
                  {menuItemImage && (
                    <div className="flex items-center gap-2 text-[10px] text-stone-400">
                      <ImageIcon size={12} /> Aperçu :
                      <img src={menuItemImage} alt="" className="w-8 h-8 rounded object-cover border border-stone-200" onError={(e) => { e.target.style.display = "none"; }} />
                    </div>
                  )}
                  <label className="flex items-center gap-1.5 text-xs text-stone-600">
                    <input type="checkbox" checked={menuItemAlcoholic} onChange={(e) => setMenuItemAlcoholic(e.target.checked)} />
                    🍺 Alcoolisé
                  </label>
                  <button
                    onClick={() => {
                      if (!menuItemName.trim()) return;
                      onUpdatePropertyFeature(prop.id, "menu", [...(prop.menu || []), {
                        id: `menu_${Date.now()}`, itemName: menuItemName.trim(), description: menuItemDesc.trim(),
                        category: menuItemCategory.trim() || "Autres", imageUrl: menuItemImage.trim(),
                        price: parseFloat(menuItemPrice) || 0, stock: parseInt(menuItemStock) ?? 0, isAlcoholic: menuItemAlcoholic,
                      }]);
                      setMenuItemName(""); setMenuItemDesc(""); setMenuItemCategory(""); setMenuItemImage(""); setMenuItemPrice(""); setMenuItemStock(""); setMenuItemAlcoholic(false);
                    }}
                    className="w-full bg-stone-800 text-white py-1.5 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1"
                  >
                    <Plus size={12} /> Ajouter au menu
                  </button>
                </div>
              )}
              {(prop.menu || []).length > 0 && (() => {
                const grantItem = (prop.menu || []).find((m) => (m.id || m.itemName) === grantItemKey);
                return (
                  <div className="border border-dashed border-emerald-300 rounded-lg p-3 space-y-2 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Offrir une consommation</span>
                    <p className="text-[10px] text-stone-400 italic">
                      Vous payez, l'article est offert au citoyen choisi — comme "je t'offre un verre".
                    </p>
                    <UserSearchSelect users={citizens} onSelect={setGrantCitizenId} value={grantCitizenId} placeholder="Choisir un citoyen..." />
                    <select
                      className="w-full p-1.5 border rounded text-xs"
                      value={grantItemKey}
                      onChange={(e) => setGrantItemKey(e.target.value)}
                    >
                      <option value="">— Choisir un article —</option>
                      {(prop.menu || []).filter((m) => m.stock === -1 || m.stock > 0).map((m) => (
                        <option key={m.id || m.itemName} value={m.id || m.itemName}>{m.itemName} — {formatMoney(m.price)}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (!grantCitizenId || !grantItemKey || !onGrantFreeMenuItem) return;
                        onGrantFreeMenuItem({ propertyId: prop.id, citizenId: grantCitizenId, itemKey: grantItemKey });
                        setGrantCitizenId(""); setGrantItemKey("");
                      }}
                      disabled={!grantCitizenId || !grantItemKey || (grantItem && (user?.balance || 0) < grantItem.price)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white py-1.5 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1"
                    >
                      <Gift size={12} /> Offrir{grantItem ? ` — ${formatMoney(grantItem.price)}` : ""}
                    </button>
                  </div>
                );
              })()}
              {(prop.menu || []).length > 0 && (() => {
                const roundItem = (prop.menu || []).find((m) => (m.id || m.itemName) === roundItemKey);
                const roundCost = roundItem ? Math.round(roundItem.price * todayConsumers.length * 10) / 10 : 0;
                return (
                  <div className="border border-dashed border-amber-300 rounded-lg p-3 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Payer une tournée</span>
                      <span className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Users size={11} /> {todayConsumers.length} aujourd'hui
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 italic">
                      Vous payez l'article choisi pour tout le monde ayant pris une consommation aujourd'hui.
                    </p>
                    <select
                      className="w-full p-1.5 border rounded text-xs"
                      value={roundItemKey}
                      onChange={(e) => setRoundItemKey(e.target.value)}
                    >
                      <option value="">— Choisir un article —</option>
                      {(prop.menu || []).filter((m) => m.stock === -1 || m.stock > 0).map((m) => (
                        <option key={m.id || m.itemName} value={m.id || m.itemName}>{m.itemName} — {formatMoney(m.price)}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (!roundItemKey || !onPayRound) return;
                        onPayRound({ propertyId: prop.id, itemKey: roundItemKey });
                        setRoundItemKey("");
                      }}
                      disabled={!roundItemKey || todayConsumers.length === 0 || (user?.balance || 0) < roundCost}
                      className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white py-1.5 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1"
                    >
                      <Users size={12} /> Payer la tournée{roundItem ? ` — ${formatMoney(roundCost)}` : ""}
                    </button>
                  </div>
                );
              })()}
              {isOwner && (
                <div className="border border-dashed border-purple-300 rounded-lg p-3 space-y-2 mt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Pass gratuit illimité</span>
                  <p className="text-[10px] text-stone-400 italic">
                    Le titulaire ne paie plus jamais rien au menu ici, jusqu'à révocation.
                  </p>
                  {(prop.freePassIds || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(prop.freePassIds || []).map((cid) => {
                        const holder = citizens.find((c) => c.id === cid);
                        return (
                          <span key={cid} className="flex items-center gap-1 bg-purple-50 border border-purple-200 rounded-full pl-2 pr-1 py-0.5 text-[10px] font-bold text-purple-700">
                            <Ticket size={10} /> {holder?.name || cid}
                            <button
                              onClick={() => onRevokeFreePass && onRevokeFreePass({ propertyId: prop.id, citizenId: cid })}
                              className="text-purple-400 hover:text-red-500"
                              title="Révoquer"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <UserSearchSelect users={citizens} onSelect={setPassCitizenId} value={passCitizenId} placeholder="Choisir un citoyen..." />
                    </div>
                    <button
                      onClick={() => {
                        if (!passCitizenId || !onGrantFreePass) return;
                        onGrantFreePass({ propertyId: prop.id, citizenId: passCitizenId });
                        setPassCitizenId("");
                      }}
                      disabled={!passCitizenId}
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white px-3 rounded text-[10px] font-bold uppercase flex items-center gap-1"
                    >
                      <Ticket size={12} /> Accorder
                    </button>
                  </div>
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
            <p className="text-[10px] text-stone-400 -mt-1 mb-1">Recettes indicatives — la production reste à organiser en jeu (RP), aucune transformation automatique n'a lieu.</p>
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
                <div><span className="font-bold text-stone-700">{s.itemName}</span> <span className="font-mono text-yellow-700 ml-2">{formatMoney(s.price)}</span> <span className="text-stone-400 text-xs ml-1">(stock: {s.qty})</span></div>
                {!isOwner && s.qty > 0 && <button onClick={() => onBuyFromShop(prop.id, s.itemName)} disabled={(user?.balance || 0) < s.price} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase disabled:opacity-50">Acheter</button>}
              </div>
            ))}
            {isOwner && (
              <div className="flex gap-2 mt-2">
                <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Article" value={shopItemName} onChange={(e) => setShopItemName(e.target.value)} />
                <input className="w-14 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Qté" value={shopItemQty} onChange={(e) => setShopItemQty(e.target.value)} />
                <input className="w-14 p-1.5 border rounded text-xs font-mono" type="number" step="0.1" placeholder="Prix" value={shopItemPrice} onChange={(e) => setShopItemPrice(e.target.value)} />
                <button onClick={() => { if (shopItemName.trim()) { onUpdatePropertyFeature(prop.id, "shopStock", [...(prop.shopStock || []), { itemName: shopItemName.trim(), qty: parseInt(shopItemQty) || 0, price: parseFloat(shopItemPrice) || 0 }]); setShopItemName(""); setShopItemQty(""); setShopItemPrice(""); } }} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase"><Plus size={12} /></button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* === COMMUN: Personnel / Équipage === */}
      <Card title={isBateau ? "Équipage" : "Personnel"} icon={UserPlus}>
        <div className="space-y-2">
          {(prop.staff || []).length === 0 && <p className="text-stone-400 text-xs italic">{isBateau ? "Aucun membre d'équipage." : "Aucun personnel."}</p>}
          {(prop.staff || []).map((s) => (
            editingStaffId === s.id ? (
              <div key={s.id} className="flex items-center gap-2 bg-stone-100 rounded px-3 py-2">
                <input className="w-24 p-1.5 border rounded text-xs" placeholder="Rôle" value={editStaffRole} onChange={(e) => setEditStaffRole(e.target.value)} />
                <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" step="0.1" placeholder="Salaire" value={editStaffSalary} onChange={(e) => setEditStaffSalary(e.target.value)} />
                <button
                  onClick={() => { onUpdatePropertyStaff(prop.id, s.id, { role: editStaffRole, salary: editStaffSalary }); setEditingStaffId(null); }}
                  className="text-green-600 hover:text-green-500"
                ><Save size={14} /></button>
                <button onClick={() => setEditingStaffId(null)} className="text-stone-400 hover:text-stone-600"><X size={14} /></button>
              </div>
            ) : (
              <div key={s.id} className="flex items-center justify-between bg-stone-50 rounded px-3 py-2 text-sm">
                <div>
                  <span className="font-bold text-stone-700">{s.name}</span>
                  <span className="text-xs text-stone-400 ml-2">{s.role}</span>
                  {s.salary > 0 && <span className="ml-2 font-mono text-yellow-700 text-xs">{formatMoney(s.salary)}/jour</span>}
                </div>
                {isOwner && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setEditingStaffId(s.id); setEditStaffRole(s.role || ""); setEditStaffSalary(s.salary || ""); }}
                      className="text-stone-400 hover:text-stone-700"
                    ><Pencil size={12} /></button>
                    <button onClick={() => onRemovePropertyStaff(prop.id, s.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                  </div>
                )}
              </div>
            )
          ))}
          {isOwner && (
            <div className="flex gap-2 mt-2">
              <div className="flex-1"><UserSearchSelect users={citizens} onSelect={setStaffCitizenId} value={staffCitizenId} placeholder={isBateau ? "Enrôler..." : "Embaucher..."} /></div>
              <input className="w-24 p-1.5 border rounded text-xs" placeholder="Rôle" value={staffRole} onChange={(e) => setStaffRole(e.target.value)} />
              <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" step="0.1" placeholder="Salaire" value={staffSalary} onChange={(e) => setStaffSalary(e.target.value)} />
              <button onClick={() => { if (staffCitizenId) { onAddPropertyStaff(prop.id, staffCitizenId, staffRole || "Employé", staffSalary); setStaffCitizenId(""); setStaffRole(""); setStaffSalary(""); } }} disabled={!staffCitizenId} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase disabled:opacity-50"><Plus size={12} /></button>
            </div>
          )}
        </div>
      </Card>

      {/* === BATEAU: Invités === */}
      {isBateau && (
        <Card title="Invités" icon={Users}>
          <p className="text-[10px] text-stone-400 -mt-1 mb-2">Seuls l'équipage et les invités peuvent visiter ce bateau.</p>
          <div className="space-y-2">
            {(prop.guestList || []).length === 0 && <p className="text-stone-400 text-xs italic">Aucun invité.</p>}
            {(prop.guestList || []).map((g) => (
              <div key={g.id} className="flex items-center justify-between bg-stone-50 rounded px-3 py-2 text-sm">
                <span className="font-bold text-stone-700">{g.name}</span>
                {isOwner && <button onClick={() => onRemovePropertyGuest(prop.id, g.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>}
              </div>
            ))}
            {isOwner && (
              <div className="flex gap-2 mt-2">
                <div className="flex-1"><UserSearchSelect users={citizens} onSelect={setGuestCitizenId} value={guestCitizenId} placeholder="Inviter..." /></div>
                <button onClick={() => { if (guestCitizenId) { onAddPropertyGuest(prop.id, guestCitizenId); setGuestCitizenId(""); } }} disabled={!guestCitizenId} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase disabled:opacity-50"><Plus size={12} /></button>
              </div>
            )}
          </div>
        </Card>
      )}

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
