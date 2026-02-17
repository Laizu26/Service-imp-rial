import React, { useState, useMemo } from "react";
import ReactDOM from "react-dom";
import {
  Box,
  ShoppingCart,
  Search,
  Gift,
  X,
  Coins,
  Package,
  User,
  Lock,
  ShieldCheck,
  Tag,
  Scale,
  Zap,
  Archive,
  Eye,
} from "lucide-react";
import UserSearchSelect from "../ui/UserSearchSelect";

// Couleurs de rareté
const RARITY_COLORS = {
  Commun: { bg: "bg-stone-100", border: "border-stone-300", text: "text-stone-600", badge: "bg-stone-200 text-stone-700" },
  Atypique: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", badge: "bg-green-100 text-green-700" },
  Rare: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
  Épique: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", badge: "bg-purple-100 text-purple-700" },
  Légendaire: { bg: "bg-yellow-50", border: "border-yellow-400", text: "text-yellow-800", badge: "bg-yellow-100 text-yellow-800", glow: "shadow-md shadow-yellow-100" },
  Unique: { bg: "bg-red-50", border: "border-red-400", text: "text-red-800", badge: "bg-red-100 text-red-800", glow: "shadow-md shadow-red-100" },
};

const getRarity = (r) => RARITY_COLORS[r] || RARITY_COLORS.Commun;

const CitizenInventoryView = ({
  user,
  users,
  catalog,
  onBuyItem,
  onGiveItem,
  onBuySlave,
}) => {
  const [activeTab, setActiveTab] = useState("bag");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [targetUserId, setTargetUserId] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");

  // Inventaire Personnel
  const myInventory = useMemo(() => {
    return (user.inventory || [])
      .map((slot) => {
        const itemDef = catalog.find((i) => i.id === slot.itemId);
        return itemDef
          ? { ...itemDef, qty: slot.quantity || slot.qty || 0 }
          : null;
      })
      .filter((i) => i && (i.name || "").toLowerCase().includes(searchTerm.toLowerCase()));
  }, [user.inventory, catalog, searchTerm]);

  // Poids total
  const totalWeight = useMemo(() => {
    return myInventory.reduce((s, i) => s + (i.weight || 0) * i.qty, 0);
  }, [myInventory]);

  // Catégories du marché
  const marketCategories = useMemo(() => {
    const cats = new Set(catalog.filter((i) => !i.hidden).map((i) => i.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [catalog]);

  // Marché Global (Objets + Esclaves)
  const marketItems = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const items = catalog
      .filter((i) => !i.hidden)
      .filter((i) => (i.stock === undefined || i.stock === -1 || i.stock > 0))
      .map((i) => ({ ...i, marketType: "ITEM" }));

    const safeUsers = Array.isArray(users) ? users : [];
    const slavesForSale = safeUsers
      .filter((u) => u.isForSale === true && u.id !== user.id)
      .map((u) => ({
        id: u.id,
        name: u.name,
        price: u.salePrice,
        description: `Esclave - ${u.age || "?"} ans - ${u.occupation || "Sans métier"}`,
        imageUrl: u.avatarUrl,
        marketType: "SLAVE",
        ownerId: u.ownerId,
        rarity: "Unique",
        category: "Esclave",
      }));

    return [...slavesForSale, ...items].filter((i) => {
      const matchSearch = (i.name || "").toLowerCase().includes(q) ||
        (i.description || "").toLowerCase().includes(q);
      const matchCat = filterCategory === "ALL" || i.category === filterCategory ||
        (filterCategory === "Esclave" && i.marketType === "SLAVE");
      return matchSearch && matchCat;
    });
  }, [catalog, users, searchTerm, user.id, filterCategory]);

  // Actions
  const openAction = (item, type) => {
    setSelectedItem(item);
    if (item.marketType === "SLAVE" && type === "BUY") {
      setActionType("BUY_SLAVE");
    } else {
      setActionType(type);
    }
    setQuantity(1);
    setTargetUserId("");
  };

  const closeAction = () => {
    setSelectedItem(null);
    setActionType(null);
  };

  const handleConfirm = () => {
    if (!selectedItem) return;
    if (actionType === "BUY") {
      onBuyItem(selectedItem.id, parseInt(quantity));
    } else if (actionType === "BUY_SLAVE") {
      onBuySlave(selectedItem.id, selectedItem.price);
    } else if (actionType === "GIVE") {
      if (!targetUserId) return;
      onGiveItem(targetUserId, selectedItem.id, parseInt(quantity));
    }
    closeAction();
  };

  const finalPrice =
    actionType === "BUY_SLAVE"
      ? selectedItem?.price
      : (selectedItem?.price || 0) * quantity;
  const canAfford = user.balance >= finalPrice;

  // Modal détail objet
  const DetailModal = ({ item, onClose }) => {
    if (!item) return null;
    const rs = getRarity(item.rarity);

    return ReactDOM.createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-3 right-3 text-stone-400 hover:text-stone-700 z-10">
            <X size={20} />
          </button>

          {/* Image */}
          <div className={`h-48 ${rs.bg} relative flex items-center justify-center overflow-hidden`}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Box size={64} className={`opacity-30 ${rs.text}`} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            <span className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-black uppercase border ${rs.border} ${rs.bg} ${rs.text}`}>
              {item.rarity || "Commun"}
            </span>
          </div>

          <div className="p-6 -mt-8 relative">
            <h3 className="text-xl font-black text-stone-900 font-serif uppercase mb-1">{item.name}</h3>

            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-[10px] font-bold text-stone-500 uppercase bg-stone-100 px-2 py-0.5 rounded flex items-center gap-0.5">
                <Tag size={9} /> {item.type || "Divers"}
              </span>
              {item.category && (
                <span className="text-[10px] font-bold text-stone-500 uppercase bg-stone-100 px-2 py-0.5 rounded">
                  {item.category}
                </span>
              )}
              {item.usable && (
                <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-0.5">
                  <Zap size={9} /> Utilisable
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100 mb-4">
              <div className="text-center">
                <div className="text-[9px] uppercase font-black text-stone-400">Prix</div>
                <div className="font-black text-yellow-600 text-sm mt-0.5 flex items-center justify-center gap-0.5">
                  <Coins size={11} /> {item.price}
                </div>
              </div>
              <div className="text-center border-l border-stone-200">
                <div className="text-[9px] uppercase font-black text-stone-400">Poids</div>
                <div className="font-bold text-stone-700 text-xs mt-0.5">{item.weight || 0} kg</div>
              </div>
              <div className="text-center border-l border-stone-200">
                <div className="text-[9px] uppercase font-black text-stone-400">Stock</div>
                <div className="font-bold text-stone-700 text-xs mt-0.5">
                  {item.stock === -1 || item.stock === undefined ? "Illimité" : item.stock === 0 ? <span className="text-red-600">Épuisé</span> : item.stock}
                </div>
              </div>
            </div>

            {item.description && (
              <p className="italic text-stone-600 text-sm leading-relaxed border-l-4 border-stone-200 pl-3 mb-4">
                {item.description}
              </p>
            )}

            {item.qty !== undefined && (
              <div className="bg-stone-100 p-3 rounded-lg text-center">
                <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest">Possédé</span>
                <div className="text-2xl font-black text-stone-800 font-mono">x{item.qty}</div>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="h-full flex flex-col font-sans relative">
      {/* EN-TÊTE */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-4 pb-4 border-b border-stone-300 gap-4">
        <div>
          <h2 className="text-2xl font-black font-serif uppercase text-stone-900 tracking-tight flex items-center gap-3">
            {activeTab === "bag" ? (
              <Package size={28} className="text-stone-600" />
            ) : (
              <ShoppingCart size={28} className="text-yellow-600" />
            )}
            {activeTab === "bag" ? "Havresac" : "Comptoir Marchand"}
          </h2>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">
            {activeTab === "bag"
              ? `${myInventory.length} objet(s) — ${totalWeight.toFixed(1)} kg`
              : `${marketItems.length} articles disponibles`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Solde */}
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2 flex items-center gap-2">
            <Coins size={16} className="text-yellow-600" />
            <span className="font-black font-mono text-yellow-800">{(user.balance || 0).toLocaleString()}</span>
            <span className="text-[10px] text-yellow-600 font-bold">Écus</span>
          </div>

          {/* Tabs */}
          <div className="flex bg-stone-200 p-1 rounded-lg">
            <button
              onClick={() => { setActiveTab("bag"); setFilterCategory("ALL"); }}
              className={`px-4 py-2 rounded-md text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === "bag"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <Box size={14} /> Havresac
              {myInventory.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                  activeTab === "bag" ? "bg-stone-200 text-stone-600" : "bg-stone-300 text-stone-500"
                }`}>{myInventory.length}</span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab("market"); setFilterCategory("ALL"); }}
              className={`px-4 py-2 rounded-md text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === "market"
                  ? "bg-white text-yellow-700 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <ShoppingCart size={14} /> Marché
            </button>
          </div>
        </div>
      </div>

      {/* RECHERCHE + FILTRES */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full p-3 pl-11 bg-white border border-stone-300 rounded-xl shadow-sm outline-none focus:border-stone-500 transition-colors text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {activeTab === "market" && marketCategories.length > 0 && (
          <select
            className="px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold outline-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="ALL">Toutes catégories</option>
            <option value="Esclave">Esclaves</option>
            {marketCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* GRILLE */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* INVENTAIRE */}
        {activeTab === "bag" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myInventory.length === 0 && (
              <div className="col-span-full text-center py-20 text-stone-400 italic">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                Votre havresac est vide.
              </div>
            )}
            {myInventory.map((item) => {
              const rs = getRarity(item.rarity);
              return (
                <div
                  key={item.id}
                  className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex gap-4 relative group cursor-pointer ${rs.border} ${rs.glow || ""}`}
                  onClick={() => setDetailItem(item)}
                >
                  <div className={`w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border ${rs.border} ${rs.bg}`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Box size={24} className={`opacity-40 ${rs.text}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-stone-800 font-serif truncate">{item.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${rs.badge}`}>
                          {item.rarity}
                        </span>
                        <span className="text-[9px] text-stone-400 flex items-center gap-0.5">
                          <Scale size={8} /> {(item.weight || 0) * item.qty} kg
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded font-black text-sm font-mono">
                        x{item.qty}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); openAction(item, "GIVE"); }}
                        className="text-stone-400 hover:text-stone-800 p-2 rounded-lg hover:bg-stone-100 transition-colors"
                        title="Donner"
                      >
                        <Gift size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Prix de revente */}
                  <div className="absolute top-2 right-2 text-[10px] font-bold text-yellow-600 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Coins size={9} /> {item.price}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MARCHÉ */}
        {activeTab === "market" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketItems.map((item) => {
              const isMyOwnSale = item.ownerId === user.id;
              const isSlave = item.marketType === "SLAVE";
              const rs = getRarity(item.rarity);
              const outOfStock = item.stock === 0;

              return (
                <div
                  key={item.id}
                  className={`bg-white border-2 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col relative group ${
                    isSlave
                      ? "border-yellow-300"
                      : outOfStock
                      ? "border-stone-200 opacity-60"
                      : `${rs.border}`
                  } ${rs.glow || ""}`}
                >
                  {/* Image */}
                  <div className={`h-32 ${rs.bg} relative flex items-center justify-center overflow-hidden`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : isSlave ? (
                      <User size={40} className="text-stone-400 opacity-50" />
                    ) : (
                      <Box size={40} className={`opacity-30 ${rs.text}`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />

                    {/* Badges */}
                    <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${rs.badge}`}>
                      {item.rarity || "Commun"}
                    </span>
                    {isSlave && (
                      <span className="absolute top-2 right-2 bg-black/70 text-white text-[8px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-0.5">
                        <Lock size={8} /> Esclave
                      </span>
                    )}
                    {outOfStock && (
                      <span className="absolute top-2 right-2 bg-red-600 text-white text-[8px] font-bold uppercase px-2 py-0.5 rounded">
                        Épuisé
                      </span>
                    )}
                    {item.stock !== undefined && item.stock !== -1 && item.stock > 0 && (
                      <span className="absolute bottom-2 right-2 bg-stone-800/70 text-white text-[8px] font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Archive size={8} /> {item.stock}
                      </span>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h4 className="font-bold text-stone-800 font-serif text-base truncate">{item.name}</h4>
                    {item.category && !isSlave && (
                      <span className="text-[9px] text-stone-400 uppercase font-bold mt-0.5">{item.category}</span>
                    )}
                    <p className="text-xs text-stone-500 line-clamp-2 italic mt-1 flex-1">
                      {item.description || "Aucune description."}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                      <div className="text-yellow-700 font-black font-mono text-lg flex items-center gap-1">
                        {(item.price || 0).toLocaleString()} <Coins size={14} />
                      </div>
                      {item.weight !== undefined && !isSlave && (
                        <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                          <Scale size={10} /> {item.weight} kg
                        </span>
                      )}
                    </div>

                    {/* Bouton détail */}
                    {!isSlave && (
                      <button
                        onClick={() => setDetailItem(item)}
                        className="w-full mt-2 py-1.5 text-[10px] font-bold uppercase text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye size={10} /> Détails
                      </button>
                    )}

                    {/* Bouton d'achat */}
                    {isMyOwnSale ? (
                      <div className="mt-2 w-full bg-stone-100 text-stone-400 py-2.5 rounded-lg font-black uppercase text-[10px] tracking-widest text-center">
                        Votre Offre
                      </div>
                    ) : outOfStock ? (
                      <div className="mt-2 w-full bg-red-50 text-red-400 py-2.5 rounded-lg font-black uppercase text-[10px] tracking-widest text-center border border-red-200">
                        Épuisé
                      </div>
                    ) : (
                      <button
                        onClick={() => openAction(item, "BUY")}
                        className="mt-2 w-full bg-stone-900 text-yellow-500 py-2.5 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-stone-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <ShoppingCart size={14} /> Acheter
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {marketItems.length === 0 && (
              <div className="col-span-full text-center py-20 text-stone-400 italic">
                <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                Le marché est vide pour le moment.
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMATION */}
      {selectedItem && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-[#fdf6e3] w-full max-w-md rounded-xl border-4 border-stone-800 shadow-2xl p-6 relative">
            <button onClick={closeAction} className="absolute top-4 right-4 text-stone-400 hover:text-stone-900">
              <X size={24} />
            </button>
            <div className="text-center mb-6">
              {/* Mini image */}
              {selectedItem.imageUrl && (
                <div className="w-16 h-16 mx-auto mb-3 rounded-lg overflow-hidden border-2 border-stone-300 shadow-sm">
                  <img src={selectedItem.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <h3 className="text-2xl font-black font-serif uppercase tracking-tight text-stone-900">
                {selectedItem.name}
              </h3>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">
                {actionType === "BUY_SLAVE"
                  ? "Achat de Main d'Œuvre"
                  : actionType === "BUY"
                  ? "Achat Marchandise"
                  : "Don d'objet"}
              </p>
              {selectedItem.rarity && (
                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-black uppercase ${getRarity(selectedItem.rarity).badge}`}>
                  {selectedItem.rarity}
                </span>
              )}
            </div>

            <div className="space-y-5">
              {/* Quantité */}
              {actionType !== "BUY_SLAVE" && (
                <div className="bg-white p-4 rounded-xl border border-stone-200 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-stone-500 tracking-widest">
                    Quantité
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 bg-stone-100 rounded-lg font-bold text-lg hover:bg-stone-200 transition-colors"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-xl w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => {
                        if (actionType === "GIVE" && quantity >= (selectedItem.qty || 1)) return;
                        if (actionType === "BUY" && selectedItem.stock !== undefined && selectedItem.stock !== -1 && quantity >= selectedItem.stock) return;
                        setQuantity(quantity + 1);
                      }}
                      className="w-9 h-9 bg-stone-100 rounded-lg font-bold text-lg hover:bg-stone-200 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Prix */}
              {(actionType === "BUY" || actionType === "BUY_SLAVE") && (
                <div className="text-center">
                  <div className="flex justify-between items-center px-2 py-3 border-t border-b border-stone-300">
                    <span className="font-bold text-stone-800 uppercase text-sm">
                      Total à payer
                    </span>
                    <span className={`font-mono font-black text-xl flex items-center gap-1 ${canAfford ? "text-stone-900" : "text-red-600"}`}>
                      {(finalPrice || 0).toLocaleString()} <Coins size={14} className="text-yellow-600" />
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-2">
                    Solde actuel : <span className="font-mono font-bold">{(user.balance || 0).toLocaleString()}</span> Écus
                    {canAfford && (
                      <span className="ml-1">(reste : {((user.balance || 0) - finalPrice).toLocaleString()})</span>
                    )}
                  </div>
                  {!canAfford && (
                    <div className="text-red-500 text-xs font-bold mt-2">
                      Fonds insuffisants !
                    </div>
                  )}
                  {actionType === "BUY_SLAVE" && (
                    <div className="text-[10px] text-stone-400 mt-2 italic">
                      Achat unique — Transfert de propriété immédiat.
                    </div>
                  )}
                </div>
              )}

              {/* Destinataire (Don) */}
              {actionType === "GIVE" && (
                <div>
                  <span className="text-xs font-bold uppercase text-stone-500 tracking-widest block mb-2">
                    Destinataire
                  </span>
                  <UserSearchSelect
                    users={users}
                    excludeIds={[user.id]}
                    onSelect={setTargetUserId}
                    placeholder="Choisir un citoyen..."
                  />
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={
                  (actionType !== "GIVE" && !canAfford) ||
                  (actionType === "GIVE" && !targetUserId)
                }
                className="w-full bg-stone-900 text-yellow-500 py-4 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-stone-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-3"
              >
                {actionType === "BUY_SLAVE" ? (
                  <ShieldCheck size={18} />
                ) : actionType === "GIVE" ? (
                  <Gift size={18} />
                ) : (
                  <Coins size={18} />
                )}
                Confirmer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal détail */}
      {detailItem && <DetailModal item={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  );
};

export default CitizenInventoryView;
