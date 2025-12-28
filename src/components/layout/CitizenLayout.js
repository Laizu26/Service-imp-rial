import React, { useState } from "react";
import { User, Lock, Shield, LogOut, Mail, Gem } from "lucide-react";

// UI Components
import Card from "../ui/Card";

// Views
import PostView from "../views/PostView";
import SlaveManagementView from "../views/SlaveManagementView";
import GazetteView from "../views/GazetteView";
import CitizenBankView from "../views/CitizenBankView";
import CitizenInventoryView from "../views/CitizenInventoryView"; // <--- NOUVEL IMPORT
import MaisonDeAsiaCitizen from "../views/MaisonDeAsiaCitizen";

const CitizenLayout = (props) => {
  const [active, setActive] = useState("gazette");
  const {
    user,
    users,
    countries,
    globalLedger,
    debtRegistry,
    catalog,
    gazette,
    onLogout,
    onUpdateUser,
    onSend,
    onRequestTravel,
    onTransfer,
    onCreateDebt,
    onPayDebt,
    onCancelDebt,
    onBuyItem,
    onGiveItem,
    onBuySlave,
    onSelfManumit,
    notify,
    isGraded,
    onSwitchBack,
    travelRequests,
    houseRegistry,
    onBookMaison,
    isBanned,
    isPrisoner,
  } = props;

  // --- LOGIQUE ESCLAVE ---
  const isSlave = user.status === "Esclave";
  const owner =
    isSlave && user.ownerId ? users.find((u) => u.id === user.ownerId) : null;
  const permissions = user.permissions || {};

  const canUsePost = !isSlave || permissions.post;
  const canUseBank = !isSlave || permissions.bank;
  const canUseTravel = !isSlave || permissions.travel;
  const mySlaves = users.filter((u) => u.ownerId === user.id);

  // States locaux
  const [editOccupation, setEditOccupation] = useState(user?.occupation || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editAvatar, setEditAvatar] = useState(user?.avatarUrl || "");
  const [np, setNp] = useState("");
  const [travelDestCountry, setTravelDestCountry] = useState("");
  const [travelDestRegion, setTravelDestRegion] = useState("");

  const safeCountries = Array.isArray(countries) ? countries : [];
  const myPendingRequests = (travelRequests || []).filter(
    (r) => r.citizenId === user.id && r.status === "PENDING"
  );

  return (
    <div
      className={`flex flex-col font-serif text-stone-200 min-h-screen ${
        isSlave ? "bg-stone-950 border-8 border-stone-800" : "bg-stone-950"
      }`}
    >
      {/* HEADER */}
      <header className="h-16 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-4 md:px-6 shadow-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center border border-stone-700 overflow-hidden relative">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                className="w-full h-full object-cover"
                alt=""
              />
            ) : (
              <User className="text-yellow-600" size={20} />
            )}
            {isSlave && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Lock size={16} className="text-white" />
              </div>
            )}
          </div>
          <div className="font-sans">
            <div className="font-bold text-sm md:text-base flex items-center gap-2">
              {user?.name}
              {isSlave && (
                <span className="bg-red-900 text-white text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest">
                  Esclave
                </span>
              )}
            </div>
            <div className="text-[9px] md:text-[10px] text-stone-500 uppercase tracking-widest">
              Mat: {user?.id}
            </div>
          </div>
        </div>
        <div className="flex gap-4 items-center font-sans">
          {isGraded && (
            <button
              onClick={onSwitchBack}
              className="bg-yellow-600 hover:bg-yellow-500 text-stone-950 px-3 md:px-4 py-1.5 rounded-lg font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
            >
              <Shield size={14} />{" "}
              <span className="hidden md:inline">Retour Admin</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="text-stone-500 hover:text-red-500 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          >
            <LogOut size={16} />{" "}
            <span className="hidden md:inline">Sortir</span>
          </button>
        </div>
      </header>

      {isSlave && (
        <div className="bg-stone-800 text-stone-400 text-xs p-2 text-center uppercase tracking-widest font-black flex items-center justify-center gap-2 border-b border-stone-700">
          <Lock size={12} /> Propriété de :{" "}
          {owner ? owner.name : "L'État (Sans maître)"}
        </div>
      )}

      <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-2xl mx-auto w-full font-sans pb-20 md:pb-6">
        {/* NAV BAR */}
        <div className="flex mb-6 bg-stone-900 p-1 rounded-full border border-stone-800 shadow-inner overflow-x-auto">
          <button
            onClick={() => setActive("gazette")}
            className={`flex-1 py-2 px-4 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${
              active === "gazette"
                ? "bg-[#e6dcc3] text-stone-900 shadow-md"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            Gazette
          </button>
          <button
            onClick={() => setActive("profil")}
            className={`flex-1 py-2 px-4 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${
              active === "profil"
                ? "bg-[#e6dcc3] text-stone-900 shadow-md"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            Registre
          </button>
          <button
            onClick={() => setActive("inventory")}
            className={`flex-1 py-2 px-4 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${
              active === "inventory"
                ? "bg-[#e6dcc3] text-stone-900 shadow-md"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            Inventaire
          </button>
          {canUseBank && (
            <button
              onClick={() => setActive("bank")}
              className={`flex-1 py-2 px-4 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${
                active === "bank"
                  ? "bg-[#e6dcc3] text-stone-900 shadow-md"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              Banque
            </button>
          )}
          {!isBanned && canUsePost && (
            <button
              onClick={() => setActive("msg")}
              className={`flex-1 py-2 px-4 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${
                active === "msg"
                  ? "bg-[#e6dcc3] text-stone-900 shadow-md"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              Poste
            </button>
          )}
          {!isBanned && !isPrisoner && canUseTravel && (
            <button
              onClick={() => setActive("travel")}
              className={`flex-1 py-2 px-4 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${
                active === "travel"
                  ? "bg-[#e6dcc3] text-stone-900 shadow-md"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              Voyage
            </button>
          )}

          {/* Asia button */}
          <button
            onClick={() => setActive("asia")}
            className={`flex-1 py-2 px-4 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${
              active === "asia"
                ? "bg-[#e6dcc3] text-stone-900 shadow-md"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            <Gem size={12} className="inline mr-2" /> Asia
          </button>
          {mySlaves.length > 0 && (
            <button
              onClick={() => setActive("slaves")}
              className={`flex-1 py-2 px-4 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${
                active === "slaves"
                  ? "bg-[#e6dcc3] text-stone-900 shadow-md"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              Main d'Œuvre
            </button>
          )}
        </div>

        {/* --- VUES --- */}
        {active === "gazette" && <GazetteView gazette={gazette} />}

        {active === "bank" && (
          <CitizenBankView
            user={user}
            users={users}
            globalLedger={globalLedger}
            debtRegistry={debtRegistry}
            onTransfer={onTransfer}
            onCreateDebt={onCreateDebt}
            onPayDebt={onPayDebt}
            onCancelDebt={onCancelDebt}
            canUseBank={canUseBank}
            isBanned={isBanned}
          />
        )}

        {/* INVENTORY - UTILISATION DU NOUVEAU COMPOSANT */}
        {active === "inventory" && (
          <CitizenInventoryView
            user={user}
            users={users}
            catalog={catalog}
            onBuyItem={onBuyItem}
            onGiveItem={onGiveItem}
            onBuySlave={onBuySlave}
          />
        )}

        {active === "msg" && !isBanned && canUsePost && (
          <PostView
            users={users}
            session={user}
            onSend={onSend}
            onUpdateUser={onUpdateUser}
            notify={notify}
          />
        )}

        {active === "travel" && !isBanned && !isPrisoner && canUseTravel && (
          <div className="bg-[#fdf6e3] text-stone-900 p-6 md:p-8 rounded-lg shadow-2xl border-t-8 border-stone-500 space-y-6">
            <h3 className="text-xl font-bold uppercase tracking-widest text-stone-800 border-b pb-4 mb-4 font-serif">
              Demande de Laissez-passer
            </h3>
            {myPendingRequests.length > 0 ? (
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-sm">
                <div className="font-bold text-yellow-800 mb-2">
                  En cours...
                </div>
                <div>
                  Destination:{" "}
                  {
                    countries.find(
                      (c) => c.id === myPendingRequests[0].toCountry
                    )?.name
                  }
                </div>
                <div className="text-[10px] uppercase mt-2 tracking-widest font-bold text-stone-400">
                  Status: {myPendingRequests[0].status}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <select
                  className="w-full p-3 border rounded bg-white text-sm"
                  value={travelDestCountry}
                  onChange={(e) => setTravelDestCountry(e.target.value)}
                >
                  <option value="">— Destination —</option>
                  {countries
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
                    className="w-full p-3 border rounded bg-white text-sm"
                    value={travelDestRegion}
                    onChange={(e) => setTravelDestRegion(e.target.value)}
                  >
                    <option value="">— Région —</option>
                    {(
                      countries.find((c) => c.id === travelDestCountry)
                        ?.regions || []
                    ).map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
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
                  className={`w-full py-3 rounded uppercase font-bold text-[10px] tracking-widest transition-all ${
                    travelDestCountry
                      ? "bg-stone-800 text-white hover:bg-stone-700"
                      : "bg-stone-200 text-stone-400"
                  }`}
                >
                  Soumettre
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- VUE MAISON DE ASIA (CITOYEN) --- */}
        {active === "asia" && (
          <MaisonDeAsiaCitizen
            citizens={users}
            countries={countries}
            houseRegistry={houseRegistry}
            onBook={onBookMaison}
            userBalance={user.balance}
          />
        )}

        {active === "slaves" && (
          <SlaveManagementView
            slaves={mySlaves}
            onUpdateCitizen={onUpdateUser}
            onBuySlave={onBuySlave}
            onSelfManumit={onSelfManumit}
            notify={notify}
            catalog={catalog}
            session={user}
            countries={countries}
          />
        )}

        {active === "profil" && (
          <div className="bg-[#fdf6e3] text-stone-900 rounded-lg shadow-2xl border-t-8 border-yellow-600 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-stone-300">
              <div className="flex justify-between items-start mb-6 border-b border-stone-200/50 pb-4">
                <h2 className="text-xl font-black uppercase text-stone-800 tracking-widest font-serif flex items-center gap-3">
                  <User size={20} /> Dossier Civil
                </h2>
                <span
                  className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                    user.status === "Esclave"
                      ? "bg-stone-800 text-white"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {user.status || "Actif"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-6">
                <div>
                  <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">
                    Nom & Matricule
                  </span>
                  <div className="font-bold text-lg text-stone-800">
                    {user.name}{" "}
                    <span className="text-xs text-stone-400 font-mono ml-2">
                      #{user.id}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">
                    Nation
                  </span>
                  <div className="font-bold text-lg text-stone-800">
                    {safeCountries.find((c) => c.id === user?.countryId)
                      ?.name || "Empire"}
                  </div>
                </div>
                <div>
                  <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">
                    Occupation
                  </span>
                  <input
                    className="w-full bg-stone-50 border-b-2 border-stone-300 font-bold text-stone-800 outline-none p-1"
                    value={editOccupation}
                    onChange={(e) => setEditOccupation(e.target.value)}
                    placeholder="Métier..."
                  />
                </div>
                <div>
                  <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">
                    Âge
                  </span>
                  <div className="font-bold text-lg text-stone-800">
                    {user.age || "?"} Ans
                  </div>
                </div>
                {isSlave && owner && (
                  <div className="col-span-2 bg-stone-200 p-2 rounded border border-stone-300">
                    <span className="block text-stone-500 uppercase font-bold text-[9px] mb-1 tracking-widest flex items-center gap-2">
                      <Lock size={10} /> Propriétaire
                    </span>
                    <div className="font-bold text-stone-900">{owner.name}</div>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">
                    Portrait (URL)
                  </span>
                  <input
                    className="w-full bg-stone-50 border-b-2 border-stone-300 font-bold text-stone-800 outline-none p-1"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                  />
                </div>
              </div>
              <textarea
                className="w-full bg-white/50 border-2 border-stone-200 rounded-lg p-3 text-sm italic font-serif text-stone-700 min-h-[100px] mb-6"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Biographie..."
              />
              <button
                onClick={() => {
                  onUpdateUser({
                    ...user,
                    occupation: editOccupation,
                    bio: editBio,
                    avatarUrl: editAvatar,
                  });
                  notify("Dossier mis à jour.", "success");
                }}
                className="w-full bg-stone-800 text-white py-3 rounded uppercase font-bold text-[10px] tracking-widest hover:bg-stone-700 transition-all shadow-md active:scale-95"
              >
                Mettre à jour
              </button>
            </div>
            <div className="p-6 md:p-8 bg-stone-100/50">
              <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest mb-4 flex items-center gap-2">
                <Lock size={16} /> Sceau de Sécurité
              </h3>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={np}
                  onChange={(e) => setNp(e.target.value)}
                  className="flex-1 p-3 bg-white border border-stone-200 rounded text-sm outline-none"
                  placeholder="Nouveau mot de passe..."
                />
                <button
                  onClick={() => {
                    if (np.length > 2) {
                      onUpdateUser({ ...user, password: np });
                      setNp("");
                      notify("Sceau modifié.", "success");
                    }
                  }}
                  className="bg-stone-800 text-white px-6 py-2 rounded text-[10px] font-bold uppercase hover:bg-stone-700"
                >
                  Changer
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CitizenLayout;
