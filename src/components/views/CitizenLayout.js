import React, { useState } from "react";
import {
  User,
  Lock,
  Shield,
  LogOut,
  Mail,
  Gem,
  Users,
  PlusCircle,
  ChevronDown,
  Trash2,
} from "lucide-react";

// UI Components
import Card from "../ui/Card";

// Views
import PostView from "../views/PostView";
import SlaveManagementView from "../views/SlaveManagementView";
import GazetteView from "../views/GazetteView";
import CitizenBankView from "../views/CitizenBankView";
import CitizenInventoryView from "../views/CitizenInventoryView";
import MaisonDeAsiaCitizen from "../views/MaisonDeAsiaCitizen";

const CitizenLayout = (props) => {
  const [active, setActive] = useState("gazette");
  // State pour le menu déroulant
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

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
    // --- PROPS MULTI-COMPTES ---
    connectedAccounts = [],
    onSwitchAccount,
    onAddAccount,
    onLogoutAccount,
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

  return (
    <div
      className={`flex flex-col font-serif text-stone-200 min-h-screen ${
        isSlave ? "bg-stone-950 border-8 border-stone-800" : "bg-stone-950"
      }`}
    >
      {/* HEADER */}
      <header className="h-16 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-4 md:px-6 shadow-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center border border-stone-700 overflow-hidden relative shrink-0">
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
          <div className="font-sans hidden sm:block">
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
          {/* --- C'EST CE BLOC QUI MANQUAIT DANS VOTRE FICHIER --- */}
          <div className="relative">
            <button
              className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border px-3 py-1.5 rounded transition-all ${
                isAccountMenuOpen
                  ? "bg-stone-800 text-white border-stone-600"
                  : "text-stone-400 border-stone-700 hover:text-white hover:bg-stone-800"
              }`}
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            >
              <Users size={14} />
              <span className="hidden md:inline">
                Comptes ({connectedAccounts.length})
              </span>
              <ChevronDown size={12} />
            </button>

            {isAccountMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsAccountMenuOpen(false)}
                ></div>

                <div className="absolute right-0 top-full mt-2 w-64 bg-stone-900 border border-stone-700 rounded-lg shadow-2xl overflow-hidden z-50">
                  <div className="py-2 px-4 text-[9px] uppercase font-black text-stone-500 border-b border-stone-800">
                    Changer d'identité
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {connectedAccounts.length > 0 ? (
                      connectedAccounts.map((acc) => (
                        <div
                          key={acc.id}
                          className="flex items-center group hover:bg-stone-800 transition-colors border-b border-stone-800/50 last:border-0"
                        >
                          <button
                            onClick={() => {
                              if (onSwitchAccount) onSwitchAccount(acc.id);
                              setIsAccountMenuOpen(false);
                            }}
                            className="flex-1 text-left px-4 py-3 flex items-center gap-3"
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border-2 shrink-0 ${
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
                                <User size={14} className="text-stone-400" />
                              )}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span
                                className={`text-xs font-bold truncate ${
                                  acc.id === user.id
                                    ? "text-yellow-500"
                                    : "text-stone-200"
                                }`}
                              >
                                {acc.name}
                              </span>
                              <span className="text-[9px] text-stone-500 font-mono">
                                {acc.role}
                              </span>
                            </div>
                          </button>
                          {acc.id !== user.id && (
                            <button
                              onClick={() => {
                                if (onLogoutAccount) onLogoutAccount(acc.id);
                              }}
                              className="p-3 text-stone-600 hover:text-red-500 transition-colors"
                              title="Oublier"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-stone-500 italic text-center">
                        Aucun autre compte mémorisé
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      if (onAddAccount) onAddAccount();
                    }}
                    className="w-full text-left px-4 py-3 text-xs font-bold uppercase text-green-500 hover:bg-stone-800 flex items-center gap-2 border-t border-stone-700 transition-colors"
                  >
                    <PlusCircle size={14} /> Connecter un autre personnage
                  </button>
                </div>
              </>
            )}
          </div>
          {/* ---------------------------------------------------- */}

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
            className="text-stone-500 hover:text-red-500 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-transparent hover:border-red-900/30 px-2 py-1.5 rounded"
            title="Déconnexion"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {isSlave && (
        <div className="bg-stone-800 text-stone-400 text-xs p-2 text-center uppercase tracking-widest font-black flex items-center justify-center gap-2 border-b border-stone-700 shadow-inner">
          <Lock size={12} /> Propriété de :{" "}
          {owner ? owner.name : "L'État (Sans maître)"}
        </div>
      )}

      <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-5xl mx-auto w-full font-sans pb-20 md:pb-10">
        {/* Navigation Tabs */}
        <div className="flex mb-8 bg-stone-900/80 backdrop-blur-sm p-1.5 rounded-2xl border border-stone-800 shadow-xl overflow-x-auto scrollbar-hide">
          {[
            { id: "gazette", label: "Gazette", icon: null },
            { id: "profil", label: "Registre", icon: null },
            { id: "inventory", label: "Inventaire", icon: null },
            canUseBank && { id: "bank", label: "Banque", icon: null },
            !isBanned &&
              canUsePost && { id: "msg", label: "Poste", icon: null },
            !isBanned &&
              !isPrisoner &&
              canUseTravel && { id: "travel", label: "Voyage", icon: null },
            {
              id: "asia",
              label: "Asia",
              icon: <Gem size={12} className="inline mr-1 -mt-0.5" />,
            },
            mySlaves.length > 0 && {
              id: "slaves",
              label: "Main d'Œuvre",
              icon: null,
            },
          ]
            .filter(Boolean)
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`flex-1 py-2.5 px-5 text-[10px] font-black uppercase rounded-xl transition-all whitespace-nowrap tracking-widest ${
                  active === tab.id
                    ? "bg-[#e6dcc3] text-stone-900 shadow-md transform scale-105"
                    : "text-stone-500 hover:text-stone-300 hover:bg-stone-800/50"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
        </div>

        {/* VUES */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {active === "gazette" && <GazetteView gazette={gazette} />}

          {active === "bank" && (
            <CitizenBankView
              user={user}
              users={users}
              globalLedger={globalLedger}
              debtRegistry={debtRegistry}
              onTransfer={onTransfer}
              onProposeDebt={onProposeDebt}
              onSignDebt={onSignDebt}
              onCreateDebt={onCreateDebt}
              onPayDebt={onPayDebt}
              onCancelDebt={onCancelDebt}
              canUseBank={canUseBank}
              isBanned={isBanned}
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
            <div className="bg-[#fdf6e3] text-stone-900 p-6 md:p-8 rounded-2xl shadow-2xl border border-stone-300 space-y-6 max-w-2xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-stone-400 to-stone-600"></div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-stone-800 mb-4 font-serif">
                Laissez-passer Impérial
              </h3>

              {myPendingRequests.length > 0 ? (
                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 text-sm shadow-inner">
                  <div className="font-bold text-yellow-800 mb-2 flex items-center gap-2 text-lg">
                    ⏳ Traitement en cours...
                  </div>
                  <div className="text-stone-700">
                    Destination demandée :{" "}
                    <span className="font-black">
                      {
                        countries.find(
                          (c) => c.id === myPendingRequests[0].toCountry
                        )?.name
                      }
                    </span>
                  </div>
                  <div className="text-[10px] uppercase mt-4 tracking-widest font-bold text-stone-400 border-t border-yellow-200 pt-2">
                    Statut administratif : {myPendingRequests[0].status}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">
                        Destination
                      </label>
                      <select
                        className="w-full p-4 border-2 border-stone-200 rounded-xl bg-white text-sm font-bold focus:border-stone-500 outline-none transition-colors"
                        value={travelDestCountry}
                        onChange={(e) => setTravelDestCountry(e.target.value)}
                      >
                        <option value="">-- Choisir un pays --</option>
                        {countries
                          .filter((c) => c.id !== user.countryId)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        <option value={user.countryId}>Voyage Intérieur</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">
                        Région
                      </label>
                      <select
                        className="w-full p-4 border-2 border-stone-200 rounded-xl bg-white text-sm font-bold focus:border-stone-500 outline-none transition-colors disabled:opacity-50"
                        value={travelDestRegion}
                        onChange={(e) => setTravelDestRegion(e.target.value)}
                        disabled={!travelDestCountry}
                      >
                        <option value="">-- Choisir une région --</option>
                        {(
                          countries.find((c) => c.id === travelDestCountry)
                            ?.regions || []
                        ).map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                        <option value="Frontière">Zone Frontalière</option>
                      </select>
                    </div>
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
                    className={`w-full py-4 rounded-xl uppercase font-black text-xs tracking-[0.2em] transition-all shadow-lg active:scale-95 ${
                      travelDestCountry
                        ? "bg-stone-900 text-white hover:bg-stone-800"
                        : "bg-stone-200 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    Soumettre la demande
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
            <div className="bg-[#fdf6e3] text-stone-900 rounded-2xl shadow-2xl border border-stone-300 overflow-hidden max-w-3xl mx-auto">
              <div className="bg-stone-100 p-6 border-b border-stone-200 flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-widest text-stone-800 font-serif">
                  Dossier Administratif
                </h2>
                <span className="bg-stone-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {user.status}
                </span>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                      Identité
                    </label>
                    <div className="text-lg font-bold text-stone-900">
                      {user.name}{" "}
                      <span className="text-stone-400 text-sm font-mono ml-1">
                        #{user.id}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                      Localisation
                    </label>
                    <div className="text-lg font-bold text-stone-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      {user.currentPosition || "Non localisé"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                      Occupation
                    </label>
                    <input
                      className="w-full bg-white border border-stone-300 p-2 rounded font-bold text-stone-800"
                      value={editOccupation}
                      onChange={(e) => setEditOccupation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                      Avatar (URL)
                    </label>
                    <input
                      className="w-full bg-white border border-stone-300 p-2 rounded text-xs text-stone-600"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                    Biographie
                  </label>
                  <textarea
                    className="w-full bg-white border border-stone-300 p-3 rounded-xl text-sm italic font-serif text-stone-600 min-h-[100px]"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                  />
                </div>

                <div className="pt-6 border-t border-stone-200 flex justify-end">
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
                    className="bg-stone-900 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-stone-800 shadow-lg active:scale-95 transition-all"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CitizenLayout;
