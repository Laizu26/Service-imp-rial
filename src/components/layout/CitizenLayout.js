import React, { useState } from "react";
import {
  User,
  Lock,
  Shield,
  LogOut,
  Gem,
  Users,
  PlusCircle,
  ChevronDown,
  Trash2,
  Scroll,
  Box,
  Landmark,
  Mail,
  Map,
  Gavel,
  Briefcase,
} from "lucide-react";

import PostView from "../views/PostView";
import SlaveManagementView from "../views/SlaveManagementView";
import GazetteView from "../views/GazetteView";
import CitizenBankView from "../views/CitizenBankView";
import CitizenInventoryView from "../views/CitizenInventoryView";
import MaisonDeAsiaCitizen from "../views/MaisonDeAsiaCitizen";
import MyCompanyView from "../views/MyCompanyView";

const CitizenLayout = (props) => {
  const [active, setActive] = useState("gazette");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  // --- DESTRUCTURATION DES PROPS ---
  const {
    user,
    users, // Liste des citoyens (Indispensable pour l'embauche !)
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
    onProposeDebt,
    onSignDebt,
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
    connectedAccounts = [],
    onSwitchAccount,
    onAddAccount,
    onLogoutAccount,
    companies = [],
    // --- CES 3 FONCTIONS SONT OBLIGATOIRES POUR L'ENTREPRISE ---
    onCompanyTreasury,
    onCompanyHireFire, // <--- VÉRIFIEZ QU'ELLE EST ICI
    onCompanyProduce,
    // -----------------------------------------------------------
  } = props;

  const isSlave = user.status === "Esclave";
  const owner =
    isSlave && user.ownerId ? users.find((u) => u.id === user.ownerId) : null;
  const permissions = user.permissions || {};

  const canUsePost = !isSlave || permissions.post;
  const canUseBank = !isSlave || permissions.bank;
  const canUseTravel = !isSlave || permissions.travel;
  const mySlaves = users.filter((u) => u.ownerId === user.id);

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

  const menuItems = [
    { id: "gazette", label: "Gazette", icon: Scroll },
    { id: "profil", label: "Mon Registre", icon: User },
    { id: "my_company", label: "Mon Entreprise", icon: Briefcase },
    { id: "inventory", label: "Inventaire", icon: Box },
    canUseBank && { id: "bank", label: "Banque", icon: Landmark },
    !isBanned &&
      canUsePost && { id: "msg", label: "Poste Impériale", icon: Mail },
    !isBanned &&
      !isPrisoner &&
      canUseTravel && { id: "travel", label: "Voyage", icon: Map },
    { id: "asia", label: "Maison Asia", icon: Gem },
    mySlaves.length > 0 && { id: "slaves", label: "Main d'Œuvre", icon: Gavel },
  ].filter(Boolean);

  return (
    <div
      className={`flex h-screen font-serif text-stone-200 overflow-hidden ${
        isSlave ? "bg-stone-950" : "bg-stone-950"
      }`}
    >
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-stone-900 border-r border-stone-800 z-30 shrink-0 shadow-2xl relative">
        <div className="p-8 pb-4 flex flex-col items-center border-b border-stone-800/50 bg-stone-900/50">
          <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center border-2 border-yellow-600/30 mb-4 shadow-[0_0_15px_rgba(202,138,4,0.1)] overflow-hidden">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                className="w-full h-full object-cover"
                alt=""
              />
            ) : (
              <User className="text-yellow-600" size={32} />
            )}
          </div>
          <h2 className="text-lg font-black uppercase tracking-widest text-stone-100 text-center leading-tight">
            {user?.name}
          </h2>
          <div className="text-[10px] text-stone-500 font-mono mt-1 tracking-widest uppercase">
            Matricule: {user?.id}
          </div>
          {isSlave && (
            <span className="mt-2 bg-red-900/50 text-red-200 text-[9px] px-2 py-0.5 rounded border border-red-900 uppercase tracking-widest">
              Esclave
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                active === item.id
                  ? "bg-[#e6dcc3] text-stone-900 shadow-[0_4px_12px_rgba(0,0,0,0.3)] translate-x-1"
                  : "text-stone-400 hover:bg-stone-800 hover:text-stone-100 hover:translate-x-1"
              }`}
            >
              <item.icon
                size={18}
                className={`transition-colors ${
                  active === item.id
                    ? "text-stone-900"
                    : "text-stone-500 group-hover:text-stone-300"
                }`}
              />
              <span className="text-xs font-black uppercase tracking-widest">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-800 text-center opacity-30">
          <Shield className="mx-auto mb-2 text-stone-600" size={24} />
          <div className="text-[9px] uppercase tracking-[0.2em] font-black">
            Service Impérial
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#e6e2d6]/5 relative">
        <header className="h-16 bg-stone-900/95 backdrop-blur border-b border-stone-800 flex items-center justify-between px-4 md:px-8 shadow-xl sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-3 md:invisible">
            <div className="w-9 h-9 bg-stone-800 rounded-full flex items-center justify-center border border-stone-700 overflow-hidden relative shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <User className="text-yellow-600" size={18} />
              )}
              {isSlave && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Lock size={12} className="text-white" />
                </div>
              )}
            </div>
            <div className="font-sans">
              <div className="font-bold text-sm text-stone-200">
                {user?.name}
              </div>
            </div>
          </div>
          <div className="hidden md:block"></div>
          <div className="flex gap-3 items-center font-sans">
            <div className="relative">
              <button
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-all border shadow-lg ${
                  isAccountMenuOpen
                    ? "bg-stone-700 text-white border-stone-500"
                    : "bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700 hover:text-white"
                }`}
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              >
                <Users size={16} className="text-yellow-600" />{" "}
                <span className="hidden sm:inline">
                  Comptes ({connectedAccounts.length})
                </span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    isAccountMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isAccountMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setIsAccountMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 top-full mt-3 w-72 bg-stone-900 border border-stone-600 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-3 px-4 text-[9px] uppercase font-black text-stone-500 border-b border-stone-800 bg-stone-950">
                      Identités Mémorisées
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-hide">
                      {connectedAccounts.length > 0 ? (
                        connectedAccounts.map((acc) => (
                          <div
                            key={acc.id}
                            className="flex items-center group hover:bg-stone-800 transition-colors border-b border-stone-800 last:border-0 relative"
                          >
                            <button
                              onClick={() => {
                                if (onSwitchAccount) onSwitchAccount(acc.id);
                                setIsAccountMenuOpen(false);
                              }}
                              className="flex-1 text-left px-4 py-3 flex items-center gap-3 w-full"
                            >
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border-2 shrink-0 ${
                                  acc.id === user.id
                                    ? "border-yellow-500"
                                    : "border-stone-600"
                                }`}
                              >
                                {acc.avatarUrl ? (
                                  <img
                                    src={acc.avatarUrl}
                                    className="w-full h-full object-cover"
                                    alt=""
                                  />
                                ) : (
                                  <User size={16} className="text-stone-400" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span
                                  className={`text-xs font-bold truncate ${
                                    acc.id === user.id
                                      ? "text-yellow-500"
                                      : "text-stone-200"
                                  }`}
                                >
                                  {acc.name}
                                </span>
                                <span className="text-[9px] text-stone-500 font-mono truncate">
                                  {acc.role || "Citoyen"}
                                </span>
                              </div>
                              {acc.id === user.id && (
                                <div className="w-2 h-2 bg-yellow-500 rounded-full ml-auto shadow-[0_0_10px_#eab308]"></div>
                              )}
                            </button>
                            {acc.id !== user.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onLogoutAccount) onLogoutAccount(acc.id);
                                }}
                                className="p-3 text-stone-600 hover:text-red-500 hover:bg-stone-950/50 transition-colors absolute right-0 h-full border-l border-stone-800"
                                title="Oublier"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-stone-500 text-xs italic">
                          Aucun autre compte.
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        if (onAddAccount) onAddAccount();
                      }}
                      className="w-full text-left px-4 py-4 text-xs font-bold uppercase text-green-500 hover:bg-stone-800 hover:text-green-400 flex items-center justify-center gap-2 border-t border-stone-700 transition-colors bg-stone-900"
                    >
                      <PlusCircle size={16} /> Ajouter un compte
                    </button>
                  </div>
                </>
              )}
            </div>
            {isGraded && (
              <button
                onClick={onSwitchBack}
                className="bg-yellow-600 hover:bg-yellow-500 text-stone-900 px-3 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <Shield size={16} />{" "}
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            <button
              onClick={onLogout}
              className="bg-stone-800 hover:bg-red-900/80 text-stone-400 hover:text-white transition-all flex items-center justify-center w-9 h-9 rounded-lg border border-stone-700 shadow-md"
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-stone-900">
          <div className="md:hidden flex mb-6 bg-stone-900/80 backdrop-blur-sm p-1.5 rounded-2xl border border-stone-800 shadow-xl overflow-x-auto scrollbar-hide snap-x">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`flex-1 py-2.5 px-5 text-[10px] font-black uppercase rounded-xl transition-all whitespace-nowrap tracking-widest snap-center ${
                  active === item.id
                    ? "bg-[#e6dcc3] text-stone-900 shadow-md transform scale-105"
                    : "text-stone-500 hover:text-stone-300 hover:bg-stone-800/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
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
                onProposeDebt={onProposeDebt}
                onSignDebt={onSignDebt}
              />
            )}
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

            {/* --- VÉRIFIEZ BIEN CE BLOC --- */}
            {active === "my_company" && (
              <MyCompanyView
                user={user}
                companies={companies}
                citizens={users} // On passe bien 'users' ici, renommé en 'citizens' dans MyCompanyView
                onCompanyTreasury={onCompanyTreasury}
                onCompanyHireFire={onCompanyHireFire} // INDISPENSABLE
                onCompanyProduce={onCompanyProduce}
              />
            )}
            {/* ------------------------------ */}

            {active === "msg" && !isBanned && canUsePost && (
              <PostView
                users={users}
                session={user}
                onSend={onSend}
                onUpdateUser={onUpdateUser}
                notify={notify}
              />
            )}
            {active === "travel" &&
              !isBanned &&
              !isPrisoner &&
              canUseTravel && (
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <option value={user.countryId}>
                            Voyage Intérieur
                          </option>
                        </select>
                        {travelDestCountry && (
                          <select
                            className="w-full p-3 border rounded bg-white text-sm"
                            value={travelDestRegion}
                            onChange={(e) =>
                              setTravelDestRegion(e.target.value)
                            }
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
                      </div>
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default CitizenLayout;
