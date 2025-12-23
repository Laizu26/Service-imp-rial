import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import UserSearchSelect from "../ui/UserSearchSelect";

const CitizenInventoryView = ({
  user,
  users,
  catalog,
  onBuyItem,
  onGiveItem,
  onBuySlave,
}) => {
  const [activeTab, setActiveTab] = useState("bag"); // 'bag' | 'market'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState(null); // 'BUY' | 'GIVE' | 'BUY_SLAVE'

  const [quantity, setQuantity] = useState(1);
  const [targetUserId, setTargetUserId] = useState("");

  // 1. Inventaire Personnel
  const myInventory = useMemo(() => {
    return (user.inventory || [])
      .map((slot) => {
        const itemDef = catalog.find((i) => i.id === slot.itemId);
        return itemDef ? { ...itemDef, qty: slot.qty } : null;
      })
      .filter(
        (i) => i && i.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [user.inventory, catalog, searchTerm]);

  // 2. Marché Global (Objets + Esclaves)
  const marketItems = useMemo(() => {
    // A. Les objets classiques
    const items = catalog
      .filter((i) => !i.hidden)
      .map((i) => ({ ...i, type: "ITEM" }));

    // B. Les esclaves en vente (C'est ici que ça se joue !)
    const safeUsers = Array.isArray(users) ? users : [];
    const slavesForSale = safeUsers
      .filter((u) => u.isForSale === true && u.id !== user.id) // On exclut l'utilisateur lui-même
      .map((u) => ({
        id: u.id,
        name: u.name,
        price: u.salePrice,
        description: `Esclave - ${u.age || "?"} ans - ${
          u.occupation || "Sans métier"
        }`,
        imageUrl: u.avatarUrl,
        type: "SLAVE", // Marqueur important
        ownerId: u.ownerId, // Pour savoir si c'est le nôtre
      }));

    // C. Fusion et Filtrage
    return [...slavesForSale, ...items].filter((i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [catalog, users, searchTerm, user.id]);

  // --- ACTIONS ---

  const openAction = (item, type) => {
    setSelectedItem(item);
    // Si c'est un esclave, on force le type 'BUY_SLAVE'
    if (item.type === "SLAVE" && type === "BUY") {
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
      onBuySlave(selectedItem.id, selectedItem.price); // Pas de quantité pour un humain
    } else if (actionType === "GIVE") {
      if (!targetUserId) return;
      onGiveItem(targetUserId, selectedItem.id, parseInt(quantity));
    }
    closeAction();
  };

  // Calcul du prix
  const finalPrice =
    actionType === "BUY_SLAVE"
      ? selectedItem?.price
      : selectedItem?.price * quantity;
  const canAfford = user.balance >= finalPrice;

  return (
    <div className="h-full flex flex-col font-sans animate-fadeIn relative">
      {/* --- EN-TÊTE --- */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 pb-4 border-b border-stone-300 gap-4">
        <div>
          <h2 className="text-3xl font-black font-serif uppercase text-stone-900 tracking-tight flex items-center gap-3">
            {activeTab === "bag" ? (
              <Package size={32} className="text-stone-600" />
            ) : (
              <ShoppingCart size={32} className="text-yellow-600" />
            )}
            {activeTab === "bag" ? "Logistique" : "Comptoir Marchand"}
          </h2>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">
            {activeTab === "bag"
              ? "Gestion de vos biens"
              : "Marchandises & Main d'Œuvre"}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-200 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("bag")}
            className={`px-4 py-2 rounded-md text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === "bag"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Box size={14} /> Havresac
          </button>
          <button
            onClick={() => setActiveTab("market")}
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

      {/* --- BARRE DE RECHERCHE --- */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Rechercher..."
          className="w-full p-4 pl-12 bg-white border border-stone-300 rounded-xl shadow-sm outline-none focus:border-stone-500 transition-colors font-serif"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400"
          size={20}
        />
      </div>

      {/* --- GRILLE --- */}
      <div className="flex-1 overflow-y-auto pr-2">
        {/* VUE INVENTAIRE */}
        {activeTab === "bag" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myInventory.length === 0 && (
              <div className="col-span-full text-center py-20 opacity-50 italic">
                Votre sac est vide.
              </div>
            )}
            {myInventory.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex gap-4 relative group"
              >
                <div className="w-16 h-16 bg-stone-100 rounded-lg flex-shrink-0 flex items-center justify-center border border-stone-100 overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Box className="text-stone-300" />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="font-bold text-stone-800 font-serif">
                    {item.name}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-[10px] font-black uppercase">
                      x{item.qty}
                    </span>
                    <button
                      onClick={() => openAction(item, "GIVE")}
                      className="text-stone-400 hover:text-stone-800 p-2"
                    >
                      <Gift size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VUE MARCHÉ (OBJETS + ESCLAVES) */}
        {activeTab === "market" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketItems.map((item) => {
              const isMyOwnSale = item.ownerId === user.id; // C'est mon esclave que je vends

              return (
                <div
                  key={item.id}
                  className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col relative group ${
                    item.type === "SLAVE"
                      ? "border-yellow-300 bg-yellow-50/40"
                      : "border-stone-200"
                  }`}
                >
                  <div className="flex gap-4 mb-3">
                    <div className="w-16 h-16 bg-stone-100 rounded-lg flex-shrink-0 flex items-center justify-center border border-stone-100 overflow-hidden relative">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : item.type === "SLAVE" ? (
                        <User className="text-stone-400" />
                      ) : (
                        <Box className="text-stone-300" />
                      )}
                      {item.type === "SLAVE" && (
                        <div className="absolute bottom-0 w-full bg-black/60 text-white text-[8px] text-center uppercase py-0.5 tracking-wider font-bold">
                          <Lock size={8} className="inline mr-0.5" /> Esclave
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-800 font-serif text-lg">
                        {item.name}
                      </h4>
                      <div className="text-yellow-600 font-black font-mono text-sm flex items-center gap-1">
                        {item.price} <Coins size={12} />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-stone-500 line-clamp-2 italic mb-4 flex-1">
                    {item.description}
                  </p>

                  {isMyOwnSale ? (
                    <button
                      disabled
                      className="w-full bg-stone-100 text-stone-400 py-3 rounded-lg font-black uppercase text-[10px] tracking-widest cursor-not-allowed"
                    >
                      Votre Offre
                    </button>
                  ) : (
                    <button
                      onClick={() => openAction(item, "BUY")}
                      className="w-full bg-stone-900 text-yellow-500 py-3 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-stone-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <ShoppingCart size={14} /> Acheter
                    </button>
                  )}
                </div>
              );
            })}
            {marketItems.length === 0 && (
              <div className="col-span-full text-center py-20 text-stone-400 italic">
                Le marché est vide pour le moment.
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- MODAL DE CONFIRMATION --- */}
      {selectedItem && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#fdf6e3] w-full max-w-md rounded-xl border-4 border-stone-800 shadow-2xl p-6 relative">
            <button
              onClick={closeAction}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900"
            >
              <X size={24} />
            </button>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black font-serif uppercase tracking-tight text-stone-900">
                {selectedItem.name}
              </h3>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">
                {actionType === "BUY_SLAVE"
                  ? "Achat de Main d'Œuvre"
                  : actionType === "BUY"
                  ? "Achat Marchandise"
                  : "Don"}
              </p>
            </div>

            <div className="space-y-6">
              {/* Quantité (Sauf pour esclave) */}
              {actionType !== "BUY_SLAVE" && (
                <div className="bg-white p-4 rounded-xl border border-stone-200 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-stone-500 tracking-widest">
                    Quantité
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 bg-stone-100 rounded font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-xl w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => {
                        if (
                          actionType === "GIVE" &&
                          quantity >= selectedItem.qty
                        )
                          return;
                        setQuantity(quantity + 1);
                      }}
                      className="w-8 h-8 bg-stone-100 rounded font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Prix */}
              {(actionType === "BUY" || actionType === "BUY_SLAVE") && (
                <div className="text-center">
                  <div className="flex justify-between items-center px-2 py-2 border-t border-stone-300">
                    <span className="font-bold text-stone-800 uppercase text-sm">
                      Total à payer
                    </span>
                    <span
                      className={`font-mono font-black text-xl ${
                        canAfford ? "text-stone-900" : "text-red-600"
                      }`}
                    >
                      {finalPrice} Écus
                    </span>
                  </div>
                  {!canAfford && (
                    <div className="text-red-500 text-xs font-bold mt-2">
                      Fonds insuffisants !
                    </div>
                  )}
                  {actionType === "BUY_SLAVE" && (
                    <div className="text-[10px] text-stone-400 mt-2 italic">
                      Achat unique - Transfert de propriété immédiat.
                    </div>
                  )}
                </div>
              )}

              {/* Destinataire (Don) */}
              {actionType === "GIVE" && (
                <UserSearchSelect
                  users={users}
                  excludeIds={[user.id]}
                  onSelect={setTargetUserId}
                  placeholder="Choisir un citoyen..."
                />
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
                ) : (
                  <Coins size={18} />
                )}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenInventoryView;
