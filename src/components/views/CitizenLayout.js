import React, { useState, useMemo } from "react";
import {
  User,
  Globe,
  ShoppingBag,
  Flame,
  LogOut,
  MapPin,
  Mail,
  Users,
  Shield,
  Coins,
  X,
  ShoppingCart,
  Eye,
  Unlock,
  Gem, // Icône pour la Maison de Asia
} from "lucide-react";

// Import sécurisé (si le fichier n'existe pas, on gère l'erreur plus bas)
// Assurez-vous que src/components/views/MaisonDeAsiaCitizen.js existe !
import MaisonDeAsiaCitizen from "../views/MaisonDeAsiaCitizen";

// --- 1. COMPOSANT TINDER (ACHAT ESCLAVES) ---
const MarketTab = ({ users, currentUserId, onBuySlave }) => {
  const availableSlaves = useMemo(
    () =>
      users.filter(
        (u) => u.status === "Esclave" && u.isForSale && u.id !== currentUserId
      ),
    [users, currentUserId]
  );
  const [idx, setIdx] = useState(0);

  if (availableSlaves.length === 0)
    return (
      <div className="p-10 text-center text-stone-400 font-bold uppercase text-xs">
        Le marché est vide.
      </div>
    );
  if (idx >= availableSlaves.length)
    return (
      <div
        className="p-10 text-center text-stone-400 font-bold uppercase text-xs cursor-pointer"
        onClick={() => setIdx(0)}
      >
        Revoir les profils
      </div>
    );

  const s = availableSlaves[idx];
  const swipe = (buy) => {
    if (buy && window.confirm(`Acheter ${s.name} pour ${s.salePrice} ¢ ?`))
      onBuySlave(s.id, s.salePrice);
    setIdx((prev) => prev + 1);
  };

  return (
    <div className="h-full flex flex-col p-4 animate-in fade-in zoom-in">
      <div className="flex-1 bg-stone-800 rounded-t-3xl relative overflow-hidden">
        {s.image ? (
          <img
            src={s.image}
            className="w-full h-full object-cover opacity-80"
            alt={s.name}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-600">
            <User size={64} />
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 p-6">
          <h2 className="text-3xl font-black text-white">
            {s.name}{" "}
            <span className="text-lg opacity-70 font-normal">{s.age}</span>
          </h2>
          <p className="text-white/80 text-sm mt-2 line-clamp-3">
            {s.description || "Aucune description."}
          </p>
        </div>
      </div>
      <div className="bg-white p-4 rounded-b-3xl shadow-xl flex flex-col gap-4">
        <div className="text-center font-black text-2xl text-stone-800">
          {s.salePrice} ¢
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => swipe(false)}
            className="w-14 h-14 rounded-full border border-stone-200 text-stone-400 flex items-center justify-center hover:bg-stone-50"
          >
            <X />
          </button>
          <button
            onClick={() => swipe(true)}
            className="w-16 h-16 rounded-full bg-rose-600 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          >
            <Flame fill="white" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 2. COMPOSANT GESTION (VOS SUJETS) ---
const MySlavesTab = ({ mySlaves, onUpdateCitizen, notify, catalog }) => {
  const [selected, setSelected] = useState(null);
  const [price, setPrice] = useState("");
  const [position, setPosition] = useState("");
  const [editingPosition, setEditingPosition] = useState(false);

  const update = (s, data) => {
    const updated = { ...s, ...data };
    onUpdateCitizen(updated);
    if (selected?.id === s.id) {
      setSelected(updated);
      setPosition(updated.currentPosition || "");
    }
  };

  const togglePerm = (perm) => {
    const p = selected.permissions || {};
    update(selected, { permissions: { ...p, [perm]: !p[perm] } });
  };

  return (
    <div className="flex flex-col h-full bg-stone-100">
      {/* LISTE HAUT */}
      <div className="h-1/3 overflow-y-auto p-4 space-y-2 border-b border-stone-200">
        <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2">
          Vos Sujets ({mySlaves.length})
        </h3>
        {mySlaves.length === 0 && (
          <div className="text-center text-xs text-stone-400 italic">
            Aucun sujet possédé.
          </div>
        )}
        {mySlaves.map((s) => (
          <div
            key={s.id}
            onClick={() => {
              setSelected(s);
              setPrice(s.salePrice || "");
              setPosition(s.currentPosition || "");
            }}
            className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
              selected?.id === s.id
                ? "bg-stone-800 text-white border-stone-800"
                : "bg-white border-stone-200 hover:border-stone-400"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden shrink-0">
              {s.image ? (
                <img
                  src={s.image}
                  className="w-full h-full object-cover"
                  alt={s.name}
                />
              ) : (
                <User size={14} className="text-stone-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs truncate">{s.name}</div>
              <div className="text-[9px] opacity-60 truncate">
                Solde: {s.balance} ¢
              </div>
            </div>
            {s.isForSale && (
              <ShoppingCart size={14} className="text-yellow-500" />
            )}
          </div>
        ))}
      </div>

      {/* DÉTAIL BAS */}
      <div className="flex-1 bg-white p-4 overflow-y-auto">
        {selected ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black font-serif uppercase">
                {selected.name}
              </h2>
              <button
                onClick={() => {
                  if (window.confirm(`Affranchir ${selected.name} ?`)) {
                    update(selected, {
                      status: "Actif",
                      ownerId: null,
                      permissions: {},
                      isForSale: false,
                    });
                    setSelected(null);
                    setPosition("");
                    notify("Sujet affranchi.", "success");
                  }
                }}
                className="text-xs text-red-500 font-bold uppercase flex items-center gap-1 border border-red-200 px-2 py-1 rounded hover:bg-red-50"
              >
                <Unlock size={12} /> Affranchir
              </button>
            </div>

            {/* POSITION */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
              <h4 className="text-[10px] font-black uppercase text-stone-400 mb-3 flex items-center gap-2">
                <MapPin size={12} /> Position actuelle
              </h4>
              {!editingPosition ? (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-stone-700">
                    {selected.currentPosition || "Aucune"}
                  </div>
                  <button
                    onClick={() => setEditingPosition(true)}
                    className="px-3 py-1 bg-white border border-stone-200 rounded text-xs"
                  >
                    Éditer
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="flex-1 p-2 text-sm border rounded"
                    placeholder="Ex: Rue du Marché, Rivière..."
                  />
                  <button
                    onClick={() => {
                      update(selected, { currentPosition: position || "" });
                      setEditingPosition(false);
                      notify("Position mise à jour.", "success");
                    }}
                    className="bg-stone-800 text-white px-4 text-xs font-bold uppercase rounded"
                  >
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => {
                      setPosition(selected.currentPosition || "");
                      setEditingPosition(false);
                    }}
                    className="px-3 bg-white border border-stone-300 rounded"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>

            {/* PERMISSIONS */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
              <h4 className="text-[10px] font-black uppercase text-stone-400 mb-3 flex items-center gap-2">
                <Shield size={12} /> Permissions
              </h4>
              <div className="space-y-2">
                {["post", "bank", "travel"].map((p) => (
                  <div
                    key={p}
                    className="flex justify-between items-center bg-white p-2 rounded border border-stone-100"
                  >
                    <span className="text-xs font-bold uppercase text-stone-600">
                      {p}
                    </span>
                    <input
                      type="checkbox"
                      checked={selected.permissions?.[p] || false}
                      onChange={() => togglePerm(p)}
                      className="accent-stone-800 scale-125"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ARGENT */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[10px] font-black uppercase text-stone-400 flex items-center gap-2">
                  <Coins size={12} /> Finances
                </h4>
                <span className="text-xl font-black text-stone-800">
                  {selected.balance} ¢
                </span>
              </div>
              <button
                disabled={!selected.balance}
                onClick={() => {
                  update(selected, { balance: 0 });
                  notify(`Fonds confisqués (${selected.balance}¢)`, "success");
                }}
                className="w-full py-2 bg-stone-900 text-yellow-500 text-xs font-black uppercase rounded hover:bg-stone-800 disabled:opacity-50"
              >
                Confisquer
              </button>
            </div>

            {/* VENTE */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
              <h4 className="text-[10px] font-black uppercase text-stone-400 mb-3 flex items-center gap-2">
                <ShoppingCart size={12} /> Marché
              </h4>
              {selected.isForSale ? (
                <div className="flex gap-2">
                  <div className="flex-1 bg-yellow-100 text-yellow-800 p-2 rounded text-center font-bold text-xs border border-yellow-200">
                    En vente: {selected.salePrice}¢
                  </div>
                  <button
                    onClick={() =>
                      update(selected, { isForSale: false, salePrice: 0 })
                    }
                    className="px-3 bg-white border border-stone-300 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Prix"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="flex-1 p-2 text-sm border rounded"
                  />
                  <button
                    onClick={() => {
                      if (price > 0)
                        update(selected, {
                          isForSale: true,
                          salePrice: parseInt(price),
                        });
                    }}
                    className="bg-stone-800 text-white px-4 text-xs font-bold uppercase rounded"
                  >
                    Vendre
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-stone-300">
            <Eye size={48} className="mb-2 opacity-50" />
            <p className="text-xs font-bold uppercase tracking-widest">
              Sélectionnez un sujet
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 4. COMPOSANT VOYAGE ---
const TravelTab = ({ user, countries, travelRequests, onRequestTravel }) => {
  const [travelDestCountry, setTravelDestCountry] = useState("");
  const [travelDestRegion, setTravelDestRegion] = useState("");
  // Protection contre le crash si countries est undefined
  const safeCountries = countries || [];

  const myPendingRequests = (travelRequests || []).filter(
    (r) => r.citizenId === user.id && r.status === "PENDING"
  );

  return (
    <div className="p-5 h-full overflow-y-auto animate-in fade-in zoom-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <h2 className="text-xl font-black uppercase text-stone-800 mb-6 flex items-center gap-3">
          <MapPin className="text-yellow-600" /> Bureau des Visas
        </h2>
        {myPendingRequests.length > 0 ? (
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-sm mb-4">
            <div className="font-bold text-yellow-800 mb-2 uppercase text-xs tracking-wider">
              Demande en cours...
            </div>
            <div className="font-serif text-lg font-bold text-stone-800">
              Vers :{" "}
              {safeCountries.find(
                (c) => c.id === myPendingRequests[0].toCountry
              )?.name || "Inconnu"}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <select
              className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 text-sm font-bold text-stone-700"
              value={travelDestCountry}
              onChange={(e) => setTravelDestCountry(e.target.value)}
            >
              <option value="">— Sélectionner —</option>
              {safeCountries
                .filter((c) => c.id !== user.countryId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              <option value={user.countryId}>Voyage Intérieur</option>
            </select>
            {travelDestCountry && (
              <select
                className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 text-sm font-bold text-stone-700"
                value={travelDestRegion}
                onChange={(e) => setTravelDestRegion(e.target.value)}
              >
                <option value="">— Région —</option>
                {(
                  safeCountries.find((c) => c.id === travelDestCountry)
                    ?.regions || []
                ).map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
                <option value="Frontière">Zone Frontalière</option>
              </select>
            )}
            <button
              onClick={() => {
                if (travelDestCountry)
                  onRequestTravel(
                    travelDestCountry,
                    travelDestRegion || "Frontière"
                  );
              }}
              disabled={!travelDestCountry}
              className="w-full py-4 bg-stone-900 text-white rounded-xl uppercase font-black text-xs tracking-widest mt-4 hover:bg-stone-800"
            >
              Soumettre la demande
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 5. LAYOUT PRINCIPAL ---
export default function CitizenLayout({
  user,
  users,
  onLogout,
  onBuySlave,
  onUpdateCitizen,
  notify,
  catalog,
  isGraded,
  onSwitchBack,
  countries,
  travelRequests,
  onRequestTravel,
  // --- NOUVELLES PROPS MAISON DE ASIA ---
  houseRegistry,
  onBookMaison,
}) {
  const [tab, setTab] = useState("home");
  const mySlaves = useMemo(
    () => users.filter((u) => u.ownerId === user.id),
    [users, user.id]
  );

  return (
    <div className="flex flex-col h-screen bg-[#f7f5f0] w-full md:max-w-md md:mx-auto md:border-x md:border-stone-200 md:shadow-2xl overflow-hidden font-sans text-stone-900">
      {/* HEADER */}
      <header className="h-14 bg-white/80 backdrop-blur border-b border-stone-200 flex items-center justify-between px-4 shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200 overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                className="w-full h-full object-cover"
                alt="Avatar"
              />
            ) : (
              <User size={18} className="text-stone-400" />
            )}
          </div>
          <div>
            <div className="text-sm font-bold text-stone-800 leading-none">
              {user.name}
            </div>
            <div className="text-[10px] text-stone-500 font-mono mt-0.5">
              {user.balance} Écus
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isGraded && (
            <button
              onClick={onSwitchBack}
              className="p-2 text-stone-400 hover:text-stone-800"
            >
              <LogOut size={18} className="rotate-180" />
            </button>
          )}
          <button
            onClick={onLogout}
            className="p-2 text-stone-400 hover:text-red-500"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* CONTENU */}
      <main className="flex-1 overflow-hidden relative bg-[#f5f5f0]">
        {tab === "home" && (
          <div className="p-5 space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 relative overflow-hidden">
              <Globe
                size={100}
                className="absolute top-0 right-0 p-4 opacity-5 text-stone-900"
              />
              <h2 className="text-sm font-black uppercase tracking-widest text-stone-400 mb-4">
                Identité
              </h2>
              <div className="text-2xl font-black text-stone-800 font-serif">
                {user.name}
              </div>
              <div className="text-sm font-medium text-stone-500 flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-stone-100 rounded text-xs uppercase tracking-wider">
                  {user.status}
                </span>
                <span>• {user.age || 25} Ans</span>
              </div>
              <div className="text-sm text-stone-600 mt-2 flex items-center gap-2">
                <MapPin size={14} />
                <div>{user.currentPosition || "Aucune"}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl shadow-sm flex flex-col items-center gap-2 border border-stone-100 text-stone-400">
                <ShoppingBag size={24} />{" "}
                <span className="text-xs font-bold uppercase">Sac</span>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm flex flex-col items-center gap-2 border border-stone-100 text-stone-400">
                <Mail size={24} />{" "}
                <span className="text-xs font-bold uppercase">Poste</span>
              </div>
            </div>
          </div>
        )}

        {tab === "market" && (
          <MarketTab
            users={users}
            currentUserId={user.id}
            onBuySlave={onBuySlave}
          />
        )}
        {tab === "slaves" && (
          <MySlavesTab
            mySlaves={mySlaves}
            onUpdateCitizen={onUpdateCitizen}
            notify={notify}
            catalog={catalog}
          />
        )}
        {tab === "travel" && (
          <TravelTab
            user={user}
            countries={countries}
            travelRequests={travelRequests}
            onRequestTravel={onRequestTravel}
          />
        )}

        {/* --- VUE MAISON DE ASIA (CITOYEN) --- */}
        {tab === "asia" &&
          (MaisonDeAsiaCitizen ? (
            <MaisonDeAsiaCitizen
              citizens={users}
              countries={countries}
              houseRegistry={houseRegistry}
              onBook={onBookMaison}
              userBalance={user.balance}
            />
          ) : (
            <div className="p-10 text-center text-red-500 font-bold uppercase text-xs">
              Module Maison de Asia non chargé.
            </div>
          ))}
      </main>

      {/* NAVIGATION BAS */}
      <nav className="h-16 bg-white border-t border-stone-200 flex justify-around items-center pb-safe z-30">
        <button
          onClick={() => setTab("home")}
          className={`flex flex-col items-center gap-1 p-2 w-14 ${
            tab === "home" ? "text-stone-900" : "text-stone-400"
          }`}
        >
          <User size={20} />
          <span className="text-[9px] font-black uppercase">Profil</span>
        </button>
        <button
          onClick={() => setTab("slaves")}
          className={`flex flex-col items-center gap-1 p-2 w-14 ${
            tab === "slaves" ? "text-stone-900" : "text-stone-400"
          }`}
        >
          <Users size={20} />
          <span className="text-[9px] font-black uppercase">Sujets</span>
        </button>
        <button
          onClick={() => setTab("travel")}
          className={`flex flex-col items-center gap-1 p-2 w-14 ${
            tab === "travel" ? "text-stone-900" : "text-stone-400"
          }`}
        >
          <MapPin size={20} />
          <span className="text-[9px] font-black uppercase">Voyage</span>
        </button>

        {/* --- BOUTON MAISON ASIA --- */}
        <button
          onClick={() => setTab("asia")}
          className={`flex flex-col items-center gap-1 p-2 w-14 ${
            tab === "asia" ? "text-yellow-600 scale-110" : "text-stone-400"
          }`}
        >
          <Gem size={20} />
          <span className="text-[9px] font-black uppercase">Asia</span>
        </button>

        <button
          onClick={() => setTab("market")}
          className={`flex flex-col items-center gap-1 p-2 w-14 ${
            tab === "market" ? "text-rose-500" : "text-stone-400"
          }`}
        >
          <Flame size={20} />
          <span className="text-[9px] font-black uppercase">Marché</span>
        </button>
      </nav>
    </div>
  );
}
