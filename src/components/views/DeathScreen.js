import React from "react";
import { Skull } from "lucide-react";

const DeathScreen = ({ onLogout }) => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center animate-fadeIn duration-1000">
    <Skull size={120} className="text-stone-800 mb-8 animate-pulse" />
    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-[0.3em] text-red-900 mb-6 font-serif">
      Vous êtes mort
    </h1>
    <p className="text-stone-600 max-w-md mx-auto mb-12 font-serif italic text-lg">
      Votre nom a été effacé du livre des vivants. Votre voyage dans cet Empire
      s'achève ici.
    </p>
    <button
      onClick={onLogout}
      className="border border-stone-800 text-stone-500 px-8 py-3 rounded uppercase text-xs tracking-widest hover:bg-stone-900 hover:text-stone-300 transition-all"
    >
      Quitter ce monde
    </button>
  </div>
);

export default DeathScreen;
