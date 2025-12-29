import React, { useState } from "react";
import { Shield, Key, User, ArrowRight } from "lucide-react";

const LoginScreen = ({ onLogin, users, loading, notify }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    // --- INDISPENSABLE POUR LE MULTI-COMPTE ---
    e.preventDefault();
    // -----------------------------------------

    if (!username || !password) {
      notify("Veuillez remplir tous les champs.", "error");
      return;
    }
    onLogin({ u: username, p: password }, users);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 opacity-90"></div>

      <div className="relative z-10 w-full max-w-md p-6">
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
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
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
      </div>
    </div>
  );
};

export default LoginScreen;
