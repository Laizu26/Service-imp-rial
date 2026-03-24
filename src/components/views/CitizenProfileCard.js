import React from "react";
import {
  User,
  MapPin,
  Landmark,
  Building2,
  Briefcase,
  Church,
  Quote,
  Gavel,
  Lock,
  X,
} from "lucide-react";
import { ROLES } from "../../lib/constants";
import { getCitizenAge, formatRPDate } from "../../lib/gameUtils";

const getRoleTheme = (role) => {
  switch (role) {
    case "EMPEREUR":
      return { border: "border-yellow-500", badge: "bg-yellow-100 text-yellow-800 border-yellow-300" };
    case "ROI":
      return { border: "border-purple-500", badge: "bg-purple-100 text-purple-800 border-purple-300" };
    case "GRAND_FONC_GLOBAL":
    case "GRAND_FONC_LOCAL":
      return { border: "border-blue-500", badge: "bg-blue-100 text-blue-800 border-blue-300" };
    case "INTENDANT":
      return { border: "border-emerald-500", badge: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    case "FONCTIONNAIRE":
    case "POSTIERE":
      return { border: "border-sky-500", badge: "bg-sky-100 text-sky-800 border-sky-300" };
    default:
      return { border: "border-stone-400", badge: "bg-stone-100 text-stone-700 border-stone-300" };
  }
};

const CitizenProfileCard = ({ citizen, countries = [], companies = [], users = [], onClose, gameDate }) => {
  const gd = gameDate || { day: 1, month: 1, year: 1200 };
  if (!citizen) return null;

  const theme = getRoleTheme(citizen.role);
  const roleInfo = ROLES[citizen.role] || ROLES.CITOYEN;
  const country = countries.find((c) => c.id === citizen.countryId);
  const locCountry = countries.find((c) => c.id === (citizen.locationCountryId || citizen.countryId));
  const isSlave = citizen.status === "Esclave";
  const owner = isSlave && citizen.ownerId ? users.find((u) => u.id === citizen.ownerId) : null;
  const safeCompanies = Array.isArray(companies) ? companies : [];
  const ownedCompany = safeCompanies.find((c) => c.ownerId === citizen.id);
  const employedCompany = safeCompanies.find(
    (c) => (c.employees || []).includes(citizen.id) || (c.slaves || []).includes(citizen.id)
  );
  const slaves = (users || []).filter((u) => u.ownerId === citizen.id);

  return (
    <div className={`bg-[#fdf6e3] text-stone-900 rounded-lg shadow-2xl border-t-8 ${theme.border} overflow-hidden`}>
      {/* Header */}
      <div className="p-6 border-b border-stone-300">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-4 items-start flex-1">
            <div className={`w-20 h-20 rounded-xl border-4 ${theme.border} bg-stone-100 overflow-hidden shadow-md shrink-0`}>
              {citizen.avatarUrl ? (
                <img src={citizen.avatarUrl} className="w-full h-full object-cover" alt="" onError={(e) => { e.target.style.display = "none"; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-stone-200">
                  <User size={32} className="text-stone-400" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black text-stone-800 font-serif">{citizen.name}</h3>
                <span className="text-xs text-stone-400 font-mono">#{citizen.id}</span>
              </div>
              {citizen.title && (
                <div className="text-sm font-bold text-stone-500 italic">« {citizen.title} »</div>
              )}
              {citizen.motto && (
                <div className="text-xs text-stone-400 italic flex items-center gap-1 mt-1">
                  <Quote size={10} /> {citizen.motto}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${theme.badge}`}>
                  {roleInfo.label}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                  citizen.status === "Esclave" ? "bg-red-900 text-white" :
                  citizen.status === "Prisonnier" ? "bg-orange-100 text-orange-800 border border-orange-300" :
                  citizen.status === "Malade" ? "bg-yellow-100 text-yellow-800 border border-yellow-300" :
                  citizen.status === "Banni" ? "bg-stone-800 text-white" :
                  citizen.status === "Décédé" ? "bg-stone-900 text-stone-400" :
                  "bg-green-100 text-green-800 border border-green-300"
                }`}>
                  {citizen.status || "Actif"}
                </span>
                {citizen.bagueImperiale && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-yellow-50 text-yellow-900 border border-yellow-500 flex items-center gap-1" title="Porteur de la Bague Impériale">
                    💍 Bague Impériale
                  </span>
                )}
                {ownedCompany && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <Building2 size={9} /> Patron
                  </span>
                )}
                {slaves.length > 0 && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-stone-200 text-stone-700 border border-stone-300 flex items-center gap-1">
                    <Gavel size={9} /> {slaves.length} esclave{slaves.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-stone-400 hover:text-stone-800 transition-colors p-1">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Informations publiques */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm border-b border-stone-200">
        <div>
          <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Allégeance</span>
          <div className="font-bold text-stone-800 flex items-center gap-1">
            <Landmark size={12} className="text-stone-400" />
            {country?.name || "Empire"}
          </div>
        </div>
        <div>
          <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Localisation</span>
          <div className="font-bold text-stone-800 flex items-center gap-1">
            <MapPin size={12} className="text-stone-400" />
            {locCountry?.name || "Empire"}
            {citizen.currentPosition && <span className="text-xs text-stone-500 font-normal ml-1">— {citizen.currentPosition}</span>}
          </div>
        </div>
        <div>
          <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Âge</span>
          <div className="font-bold text-stone-800">{getCitizenAge(citizen, gd) || "?"} ans</div>
          {citizen.birthDate && (
            <div className="text-[9px] text-stone-400 mt-0.5">Né(e) le {formatRPDate(citizen.birthDate)}</div>
          )}
        </div>
        {citizen.occupation && citizen.occupation !== "Citoyen" && (
          <div>
            <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Occupation</span>
            <div className="font-bold text-stone-800 flex items-center gap-1">
              <Briefcase size={12} className="text-stone-400" />
              {citizen.occupation}
            </div>
          </div>
        )}
        {employedCompany && (
          <div>
            <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Entreprise</span>
            <div className="font-bold text-stone-800 flex items-center gap-1">
              <Building2 size={12} className="text-stone-400" />
              {employedCompany.name}
            </div>
          </div>
        )}
        {isSlave && owner && (
          <div>
            <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Propriétaire</span>
            <div className="font-bold text-red-800 flex items-center gap-1">
              <Lock size={12} className="text-red-400" />
              {owner.name}
            </div>
          </div>
        )}
        {citizen.origin && (
          <div>
            <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Origine</span>
            <div className="font-bold text-stone-800">{citizen.origin}</div>
          </div>
        )}
        {citizen.religion && (
          <div>
            <span className="block text-stone-400 uppercase font-bold text-[9px] mb-1 tracking-widest">Religion</span>
            <div className="font-bold text-stone-800 flex items-center gap-1">
              <Church size={12} className="text-stone-400" />
              {citizen.religion}
            </div>
          </div>
        )}
      </div>

      {/* Biographie */}
      {citizen.bio && (
        <div className="p-6">
          <span className="block text-stone-400 uppercase font-bold text-[9px] mb-2 tracking-widest">Biographie</span>
          <p className="text-sm italic font-serif text-stone-600 whitespace-pre-wrap leading-relaxed">
            {citizen.bio}
          </p>
        </div>
      )}
    </div>
  );
};

export default CitizenProfileCard;
