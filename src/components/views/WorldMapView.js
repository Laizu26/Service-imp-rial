import React, { useState } from "react";
import {
  Crown, Building2, Tent, Anchor, Shield, Trees, Mountain, MapPin, Landmark,
  Home, Castle, ShoppingBag, Wheat, Hammer, Utensils, Ship, Users, Compass,
  Plane, Lock, User,
} from "lucide-react";
import { formatMoney } from "../../lib/gameUtils";

// Types de région — même typologie que GeopoliticsView.js (non exportée de là-bas, dupliquée
// ici comme le reste des tables d'icônes du jeu, ex. PROPERTY_TYPES dans PropertiesAdminView.js
// et CitizenLayout.js).
const REGION_TYPES = {
  capitale:   { label: "Capitale",    icon: Crown,     color: "#d97706" },
  ville:      { label: "Ville",       icon: Building2, color: "#57534e" },
  village:    { label: "Village",     icon: Tent,      color: "#65a30d" },
  port:       { label: "Port",        icon: Anchor,    color: "#0284c7" },
  forteresse: { label: "Forteresse",  icon: Shield,    color: "#7f1d1d" },
  foret:      { label: "Forêt",       icon: Trees,     color: "#166534" },
  montagne:   { label: "Montagne",    icon: Mountain,  color: "#44403c" },
  plaine:     { label: "Plaine",      icon: MapPin,    color: "#a16207" },
  temple:     { label: "Temple",      icon: Landmark,  color: "#7c3aed" },
};
const getRegionType = (type) => REGION_TYPES[type] || REGION_TYPES.ville;

const PROPERTY_TYPE_ICONS = {
  MAISON: Home, DOMAINE: Castle, TERRAIN: MapPin, COMMERCE: ShoppingBag,
  FERME: Wheat, MANOIR: Castle, ATELIER: Hammer, AUBERGE: Utensils, BATEAU: Ship,
};

const WorldMapView = ({
  user,
  citizens = [],
  countries = [],
  properties = [],
  canTravel,
  onInternalTravel,
  onNavigateToTravel,
  onSelectProperty,
  canManageProperties = true,
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState(null);

  const myCountryId = user?.locationCountryId || user?.countryId;
  const myCountry = countries.find((c) => c.id === myCountryId);

  if (!user || !myCountry) {
    return (
      <div className="text-center py-16">
        <Compass size={48} className="mx-auto mb-3 text-stone-300" />
        <div className="text-stone-400 italic">Votre position est inconnue pour le moment.</div>
      </div>
    );
  }

  const regions = myCountry.regions || [];
  const capitalRegion = regions.find((r) => r.type === "capitale") || regions.find((r) => r.name === "Capitale") || regions[0] || null;
  const currentRegion = regions.find((r) => r.name === user.currentPosition) || capitalRegion;
  const otherRegions = regions.filter((r) => r.id !== currentRegion?.id);

  // Bâtiments présents à l'emplacement actuel
  const buildingsHere = currentRegion
    ? properties.filter((p) => p.countryId === myCountry.id && p.regionId === currentRegion.id)
    : [];

  // Autres citoyens présents à l'emplacement actuel (même pays physique + même région)
  const citizensHere = citizens.filter((c) =>
    c.id !== user.id &&
    (c.locationCountryId || c.countryId) === myCountryId &&
    (c.currentPosition || "") === (user.currentPosition || "")
  );

  const selectedRegion = otherRegions.find((r) => r.id === selectedRegionId) || null;

  // ── Positions radiales des régions autour de la capitale (aucune coordonnée réelle
  // n'existe dans le modèle de données — layout généré à l'affichage) ──
  const cx = 220, cy = 150, radius = 118;
  const nodePositions = otherRegions.map((r, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, otherRegions.length) - Math.PI / 2;
    return { region: r, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) * 0.78 };
  });

  const RegionNode = ({ region, x, y, isCurrent }) => {
    const meta = getRegionType(region.type);
    const Icon = meta.icon;
    return (
      <g
        transform={`translate(${x}, ${y})`}
        onClick={() => !isCurrent && setSelectedRegionId(selectedRegionId === region.id ? null : region.id)}
        style={{ cursor: isCurrent ? "default" : "pointer" }}
      >
        {isCurrent && <circle r={22} fill="none" stroke="#d97706" strokeWidth={2} opacity={0.5}>
          <animate attributeName="r" values="18;26;18" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2.2s" repeatCount="indefinite" />
        </circle>}
        <circle r={16} fill={meta.color} stroke={isCurrent ? "#d97706" : "#ffffff"} strokeWidth={isCurrent ? 3 : 2} />
        <foreignObject x={-9} y={-9} width={18} height={18}>
          <Icon size={18} color="#ffffff" strokeWidth={2.5} />
        </foreignObject>
        <text y={32} textAnchor="middle" fontSize={11} fontWeight={800} fill={isCurrent ? "#d97706" : "#57534e"}>
          {region.name}{isCurrent ? " · Vous" : ""}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* En-tête — position actuelle */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-700 bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/20 p-5">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-8xl opacity-5 select-none">🗺️</div>
        <div className="relative flex items-center gap-3">
          <Compass size={26} className="text-amber-400" />
          <div>
            <h2 className="text-xl font-black font-serif text-stone-100">Où je suis</h2>
            <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1.5">
              <span className="text-amber-300 font-bold">{currentRegion?.name || "Position inconnue"}</span>
              <span>·</span>
              <span>{myCountry.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Carte du royaume */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Carte de {myCountry.name}</div>
        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 440 320" className="w-full min-w-[380px] max-w-2xl mx-auto">
            {/* Routes décoratives reliant chaque région à la région actuelle */}
            {nodePositions.map(({ region, x, y }) => (
              <line key={`road_${region.id}`} x1={cx} y1={cy} x2={x} y2={y} stroke="#e7e5e4" strokeWidth={2} strokeDasharray="4 3" />
            ))}
            {currentRegion && <RegionNode region={currentRegion} x={cx} y={cy} isCurrent />}
            {nodePositions.map(({ region, x, y }) => (
              <RegionNode key={region.id} region={region} x={x} y={y} isCurrent={false} />
            ))}
          </svg>
        </div>

        {selectedRegion && (
          <div className="mt-3 bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {(() => { const M = getRegionType(selectedRegion.type); const I = M.icon; return <I size={16} style={{ color: M.color }} />; })()}
              <div>
                <div className="text-sm font-bold text-stone-800">{selectedRegion.name}</div>
                <div className="text-[10px] text-stone-400">{getRegionType(selectedRegion.type).label}</div>
              </div>
            </div>
            {canTravel ? (
              <button
                onClick={() => { onInternalTravel && onInternalTravel(selectedRegion.name); setSelectedRegionId(null); }}
                className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-500 transition-colors"
              >
                <Plane size={12} /> Se déplacer ici
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-stone-400 text-[10px] font-bold uppercase">
                <Lock size={12} /> Voyage restreint
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bâtiments ici */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-1.5">
            <Building2 size={12} /> Bâtiments ici
          </div>
          <div className="space-y-2">
            {buildingsHere.length === 0 && (
              <p className="text-xs text-stone-400 italic">Aucun bâtiment connu à cet endroit.</p>
            )}
            {buildingsHere.map((p) => {
              const Icon = PROPERTY_TYPE_ICONS[p.type] || Home;
              return (
                <button
                  key={p.id}
                  onClick={() => canManageProperties && onSelectProperty && onSelectProperty(p.id)}
                  disabled={!canManageProperties}
                  className="w-full flex items-center gap-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl px-3 py-2.5 text-left transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="w-9 h-9 rounded-lg bg-stone-200 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-stone-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-stone-800 truncate">{p.name}</div>
                    <div className="text-[10px] text-stone-400">
                      {p.ownerName ? `Propriétaire : ${p.ownerName}` : "Disponible"}
                      {(p.price || 0) > 0 && !p.ownerId && ` · ${formatMoney(p.price)}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Citoyens présents */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-1.5">
            <Users size={12} /> Citoyens présents
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {citizensHere.length === 0 && (
              <p className="text-xs text-stone-400 italic">Personne d'autre en vue pour l'instant.</p>
            )}
            {citizensHere.map((c) => (
              <div key={c.id} className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                {c.avatarUrl ? (
                  <img src={c.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
                    <User size={14} className="text-stone-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-bold text-stone-800 truncate">{c.name}</div>
                  {c.occupation && <div className="text-[10px] text-stone-400 truncate">{c.occupation}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Autres royaumes */}
      {countries.filter((c) => c.id !== myCountry.id).length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-1.5">
            <Plane size={12} /> Voyager vers un autre royaume
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {countries.filter((c) => c.id !== myCountry.id).map((c) => (
              <button
                key={c.id}
                onClick={() => onNavigateToTravel && onNavigateToTravel(c.id)}
                className="shrink-0 w-40 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl p-3 text-left transition-colors"
              >
                <div className="font-bold text-sm text-stone-800 truncate">{c.name}</div>
                <div className="text-[10px] text-stone-400 truncate">{c.rulerName || "Souverain inconnu"}</div>
                <div className="mt-2 text-[9px] font-black uppercase text-emerald-600 flex items-center gap-1">
                  <Plane size={10} /> Demander un visa
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldMapView;
