import React, { useState } from "react";
import { Users, Shield, User } from "lucide-react";

const UserManagementView = () => {
  const [subTab, setSubTab] = useState("citoyen");

  return (
    <div className="bg-[#fdf6e3] text-stone-900 rounded-lg shadow-2xl border-t-8 border-stone-500 overflow-hidden">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-stone-300">
        <h2 className="text-xl font-black uppercase text-stone-800 tracking-widest font-serif flex items-center gap-3">
          <Users size={22} /> Gestion Corps Utilisateur
        </h2>
        <p className="text-xs text-stone-500 mt-2">
          Gestion et administration des corps d'utilisateurs.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-stone-300">
        <button
          onClick={() => setSubTab("citoyen")}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-[11px] font-black uppercase tracking-widest transition-all ${
            subTab === "citoyen"
              ? "bg-white text-stone-900 border-b-4 border-stone-800 shadow-inner"
              : "bg-stone-100 text-stone-400 hover:bg-stone-50 hover:text-stone-600"
          }`}
        >
          <User size={16} /> Citoyen
        </button>
        <button
          onClick={() => setSubTab("admin")}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-[11px] font-black uppercase tracking-widest transition-all ${
            subTab === "admin"
              ? "bg-white text-stone-900 border-b-4 border-stone-800 shadow-inner"
              : "bg-stone-100 text-stone-400 hover:bg-stone-50 hover:text-stone-600"
          }`}
        >
          <Shield size={16} /> Admin
        </button>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 min-h-[300px] flex items-center justify-center">
        {subTab === "citoyen" && (
          <div className="text-center text-stone-400">
            <User size={48} className="mx-auto mb-4 text-stone-300" />
            <p className="text-sm font-bold uppercase tracking-widest">
              Espace Citoyen
            </p>
            <p className="text-xs mt-2 text-stone-400">
              Contenu à venir...
            </p>
          </div>
        )}
        {subTab === "admin" && (
          <div className="text-center text-stone-400">
            <Shield size={48} className="mx-auto mb-4 text-stone-300" />
            <p className="text-sm font-bold uppercase tracking-widest">
              Espace Admin
            </p>
            <p className="text-xs mt-2 text-stone-400">
              Contenu à venir...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementView;
