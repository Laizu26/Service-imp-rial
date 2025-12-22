import React from "react";
import {
  Crown,
  Moon,
  AlertCircle,
  ServerCrash,
  Coins,
  Users,
  Plus,
} from "lucide-react";

const DashboardView = ({
  state,
  roleInfo,
  onPassDay,
  dbError,
  onForceInit,
  onAddTreasury,
}) => (
  <div className="space-y-6 font-serif pb-20">
    {dbError && (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm flex justify-between items-center animate-bounce font-sans">
        <div className="flex items-center gap-3 text-red-700 font-bold text-xs uppercase tracking-widest">
          <AlertCircle size={18} /> Erreur Base de Données: {String(dbError)}
        </div>
        <button
          onClick={onForceInit}
          className="bg-red-700 text-white px-4 py-1 rounded text-[9px] font-black uppercase hover:bg-red-600 transition-colors"
        >
          Réparer
        </button>
      </div>
    )}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#fdf6e3] p-6 md:p-8 rounded-2xl border border-stone-300 shadow-md gap-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-4 font-serif">
          <Crown className="text-yellow-700" size={32} /> Salle du Trône
        </h2>
        <p className="text-[11px] text-stone-500 uppercase tracking-[0.3em] mt-2 ml-1 font-sans">
          Gestion des Cycles Mondiaux
        </p>
      </div>
      {roleInfo.level >= 50 && (
        <button
          onClick={onPassDay}
          className="w-full md:w-auto bg-stone-800 text-yellow-500 px-8 py-4 rounded-xl font-bold uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:bg-stone-700 active:scale-95 transition-all border-b-4 border-stone-950 flex items-center justify-center gap-4 font-sans"
        >
          <Moon size={16} /> Terminer la Journée
        </button>
      )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center font-sans">
      <div className="bg-[#fdf6e3] p-6 md:p-10 rounded-2xl border border-stone-200 shadow-lg relative overflow-hidden group">
        <Coins
          className="absolute -right-6 -bottom-6 text-yellow-600 opacity-[0.04] group-hover:scale-110 duration-700 transition-all font-sans"
          size={220}
        />
        <div className="text-[11px] font-bold text-stone-400 uppercase tracking-[0.3em] mb-4 tracking-widest font-sans font-sans">
          Trésor Impérial Global
        </div>
        <div className="text-4xl md:text-6xl font-black text-yellow-800 leading-none flex items-center justify-center gap-6 font-mono font-sans flex-wrap">
          <span>{Number(state.treasury || 0).toLocaleString()}</span>{" "}
          <span className="text-xs text-stone-400 font-normal uppercase tracking-widest font-sans">
            Écus
          </span>
          {roleInfo.role === "EMPEREUR" && (
            <button
              onClick={onAddTreasury}
              className="bg-yellow-100 text-yellow-800 p-2 rounded-full hover:bg-yellow-200 shadow-sm transition-all font-sans"
              title="Injecter des fonds"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>
      <div className="bg-[#fdf6e3] p-6 md:p-10 rounded-2xl border border-stone-200 shadow-lg relative overflow-hidden group">
        <Users
          className="absolute -right-6 -bottom-6 text-stone-800 opacity-[0.04] group-hover:scale-110 duration-700 transition-all font-sans"
          size={220}
        />
        <div className="text-[11px] font-bold text-stone-400 uppercase tracking-[0.3em] mb-4 tracking-widest font-sans">
          Sujets Enregistrés
        </div>
        <div className="text-4xl md:text-6xl font-black text-stone-800 leading-none font-mono font-sans">
          {(state.citizens || []).length}
        </div>
      </div>
    </div>
  </div>
);

export default DashboardView;
