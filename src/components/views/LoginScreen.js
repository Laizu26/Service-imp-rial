import React, { useState } from "react";
import { Shield, Loader } from "lucide-react";

const LoginScreen = ({ onLogin, users, loading, notify }) => {
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4 font-serif text-center">
      <div className="bg-[#fdf6e3] p-6 md:p-12 rounded-2xl border-4 border-stone-800 shadow-2xl max-w-sm w-full relative overflow-hidden flex flex-col items-center">
        <div className="absolute -top-10 -right-10 opacity-5 transform rotate-12 pointer-events-none">
          <Shield size={200} />
        </div>
        <Shield size={72} className="mb-8 text-stone-800 relative z-10" />

        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-widest text-stone-800 mb-8 border-b-4 border-stone-800 pb-6 relative z-10 w-full text-center leading-tight">
          Service Impérial
        </h1>

        {loading ? (
          <div className="text-stone-500 flex justify-center items-center gap-3 font-bold animate-pulse py-12 text-sm font-sans">
            <Loader className="animate-spin" /> Authentification...
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onLogin({ u, p }, users);
            }}
            className="space-y-6 relative z-10 font-sans w-full"
          >
            <input
              className="w-full p-4 border-2 border-stone-200 rounded-xl font-bold text-center outline-none focus:border-stone-800 bg-white"
              placeholder="MATRICULE"
              value={u}
              onChange={(e) => setU(e.target.value)}
            />
            <input
              className="w-full p-4 border-2 border-stone-200 rounded-xl font-bold text-center outline-none focus:border-stone-800 bg-white"
              type="password"
              placeholder="SCEAU"
              value={p}
              onChange={(e) => setP(e.target.value)}
            />
            <button className="w-full bg-stone-800 text-white py-5 rounded-xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-stone-700 transition-all border-b-4 border-black active:translate-y-1 shadow-xl">
              Accéder au Système
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
