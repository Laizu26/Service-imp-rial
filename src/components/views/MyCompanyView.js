import React from "react";
import { Building2, Users, Package, AlertCircle } from "lucide-react";
import Card from "../ui/Card";

const MyCompanyView = ({ user, companies }) => {
  const myCompany = (companies || []).find((c) => c.ownerId === user.id);

  if (!myCompany) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center text-stone-400 p-8 text-center border-2 border-dashed border-stone-300 rounded-xl">
        <Building2 size={64} className="mb-4 text-stone-300" />
        <h3 className="text-xl font-bold text-stone-600 mb-2">
          Aucune Entreprise
        </h3>
        <p className="text-sm max-w-md">
          Vous ne possédez pas encore de charte commerciale. Rapprochez-vous
          d'un administrateur ou de votre gouverneur pour fonder votre société.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Entreprise */}
      <div className="bg-white border-l-8 border-stone-800 p-6 rounded-r-xl shadow-lg flex justify-between items-center">
        <div>
          <div className="text-xs font-black uppercase text-stone-400 tracking-widest mb-1">
            Société Privée
          </div>
          <h1 className="text-3xl font-black font-serif text-stone-900">
            {myCompany.name}
          </h1>
          <div className="flex gap-4 mt-2">
            <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
              {myCompany.type}
            </span>
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
              Niveau {myCompany.level}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">
            Trésorerie
          </div>
          <div className="text-4xl font-mono font-black text-stone-800">
            {myCompany.balance?.toLocaleString()}{" "}
            <span className="text-sm">Écus</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne Gauche : Gestion */}
        <div className="md:col-span-2 space-y-6">
          <Card title="Gestion des Ressources" icon={Package}>
            <div className="p-8 text-center text-stone-400 italic text-sm bg-stone-50 rounded-lg">
              <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
              Le module de gestion des stocks et de production est en cours de
              construction par les architectes impériaux.
            </div>
          </Card>
        </div>

        {/* Colonne Droite : Staff */}
        <div className="md:col-span-1">
          <Card title="Personnel" icon={Users}>
            <div className="space-y-4">
              <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                <div className="text-xs font-bold uppercase text-stone-500 mb-2">
                  Salariés
                </div>
                {(!myCompany.employees || myCompany.employees.length === 0) && (
                  <div className="text-xs italic text-stone-400">
                    Aucun employé.
                  </div>
                )}
              </div>
              <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                <div className="text-xs font-bold uppercase text-stone-500 mb-2">
                  Main d'œuvre servile
                </div>
                <div className="text-xs italic text-stone-400">
                  0 Esclave affecté
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyCompanyView;
