import React, { useState } from "react";
import { Shield, Key, User, ArrowRight, LogIn, X } from "lucide-react";

const LoginScreen = ({ onLogin, users, loading, notify, connectedAccounts = [], onSwitchAccount, onLogoutAccount }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      notify("Veuillez remplir tous les champs.", "error");
      return;
    }
    await onLogin({ u: username, p: password }, users);
  };

  const hasConnected = connectedAccounts.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 opacity-90"></div>

      <div className="relative z-10 w-full max-w-md p-6 space-y-4">

        {/* ── COMPTES MÉMORISÉS ── */}
        {hasConnected && (
          <div className="bg-stone-900/80 backdrop-blur rounded-2xl border border-stone-800 shadow-2xl overflow-hidden">
            <div className="px-6 pt-5 pb-3">
              <div className="text-[9px] font-black uppercase tracking-[0.25em] text-stone-500 mb-4 flex items-center gap-2">
                <User size={10} /> Comptes mémorisés
              </div>
              <div className="grid grid-cols-2 gap-3">
                {connectedAccounts.map((account) => (
                  <div key={account.id} className="relative group">
                    <button
                      onClick={() => onSwitchAccount && onSwitchAccount(account.id)}
                      className="w-full flex flex-col items-center gap-2 p-3 rounded-xl bg-stone-800 border border-stone-700 hover:border-yellow-600/50 hover:bg-stone-750 transition-all duration-200 group-hover:shadow-lg"
                    >
                      {account.avatarUrl ? (
                        <img
                          src={account.avatarUrl}
                          alt={account.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-stone-600 group-hover:border-yellow-600/50 transition-colors"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-stone-700 border-2 border-stone-600 group-hover:border-yellow-600/50 flex items-center justify-center transition-colors">
                          <span className="text-xl font-black text-stone-300 uppercase select-none">
                            {(account.name || account.id || "?")[0]}
                          </span>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-[10px] font-black text-stone-200 uppercase tracking-wide leading-tight truncate w-full max-w-[90px]">
                          {account.name || account.id}
                        </div>
                        {account.occupation && (
                          <div className="text-[8px] text-stone-500 italic mt-0.5 truncate w-full max-w-[90px]">
                            {account.occupation}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-yellow-600/70 group-hover:text-yellow-500 transition-colors">
                        <LogIn size={9} /> Connexion
                      </div>
                    </button>
                    {/* Bouton oublier */}
                    {onLogoutAccount && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onLogoutAccount(account.id); }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-stone-700 text-stone-500 hover:text-red-400 hover:bg-stone-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        title="Oublier ce compte"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Séparateur */}
            <div className="flex items-center gap-3 px-6 py-3">
              <div className="flex-1 h-px bg-stone-800"></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-stone-600">ou</span>
              <div className="flex-1 h-px bg-stone-800"></div>
            </div>

            {/* Formulaire compact quand des comptes sont affichés */}
            <div className="px-6 pb-5">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 bg-stone-800 border border-stone-700 rounded-xl font-bold text-stone-200 outline-none focus:border-yellow-600/50 transition-all text-xs uppercase placeholder:normal-case placeholder:text-stone-600"
                      placeholder="Identifiant"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Key size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 bg-stone-800 border border-stone-700 rounded-xl font-bold text-stone-200 outline-none focus:border-yellow-600/50 transition-all text-xs placeholder:text-stone-600"
                      placeholder="Mot de passe"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-stone-800 hover:bg-stone-700 text-yellow-500 font-black uppercase py-2.5 rounded-xl tracking-[0.15em] shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[10px] border border-stone-700 hover:border-yellow-600/30"
                >
                  {loading ? "Vérification..." : <><ArrowRight size={13} /> Nouveau compte</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── ÉCRAN STANDARD (sans comptes mémorisés) ── */}
        {!hasConnected && (
          <div className="bg-[#e6e2d6] rounded-2xl shadow-2xl overflow-hidden border-4 border-stone-800 transform transition-all hover:scale-[1.01] duration-500">
            <div className="bg-stone-900 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-stone-700 shadow-xl">
                  <Shield className="text-yellow-500" size={40} />
                </div>
                <h1 className="text-2xl font-black uppercase text-stone-100 tracking-[0.2em] font-serif leading-tight">
                  Service Impérial
                </h1>
                <p className="text-[10px] text-stone-500 uppercase tracking-[0.3em] mt-2 font-bold">
                  Accès Restreint
                </p>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-600/20 blur-3xl rounded-full"></div>
            </div>

            <div className="p-8 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1 group">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-2 group-focus-within:text-yellow-700 transition-colors">
                    <User size={12} /> Matricule / Identifiant
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-4 bg-stone-50 border-2 border-stone-300 rounded-xl font-bold text-stone-800 outline-none focus:border-stone-800 focus:bg-white transition-all uppercase placeholder:normal-case placeholder:text-stone-300"
                    placeholder="ID..."
                    autoFocus
                  />
                </div>

                <div className="space-y-1 group">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-2 group-focus-within:text-yellow-700 transition-colors">
                    <Key size={12} /> Sceau de Sécurité
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 bg-stone-50 border-2 border-stone-300 rounded-xl font-bold text-stone-800 outline-none focus:border-stone-800 focus:bg-white transition-all placeholder:text-stone-300"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-yellow-500 font-black uppercase py-4 rounded-xl tracking-[0.2em] shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-3 group"
                >
                  {loading ? (
                    "Vérification..."
                  ) : (
                    <>
                      Présenter Papiers{" "}
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
            <div className="bg-stone-200/50 p-4 text-center border-t border-stone-300">
              <p className="text-[9px] text-stone-400 uppercase font-black tracking-widest opacity-70">
                Système de Gestion Centralisé v4.0
              </p>
            </div>
          </div>
        )}

        {/* Pied de page */}
        <div className="text-center">
          <p className="text-[8px] text-stone-700 uppercase font-black tracking-widests">
            Système de Gestion Centralisé v4.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
