import React, { useState, useMemo } from "react";
import {
  Crown, Building2, Tent, Anchor, Shield, Trees, Mountain, MapPin, Landmark,
  Home, Castle, ShoppingBag, Wheat, Hammer, Utensils, Ship, Users, Compass,
  Plane, Lock, User,
} from "lucide-react";
import { formatMoney, hashCode } from "../../lib/gameUtils";

// Types de région — même typologie que GeopoliticsView.js (non exportée de là-bas, dupliquée
// ici comme le reste des tables d'icônes du jeu, ex. PROPERTY_TYPES dans PropertiesAdminView.js
// et CitizenLayout.js). `pattern` référence un motif de terrain défini dans <defs> plus bas.
const REGION_TYPES = {
  capitale:   { label: "Capitale",    icon: Crown,     pattern: "settlement", tint: "#fbbf24" },
  ville:      { label: "Ville",       icon: Building2, pattern: "settlement", tint: "#a8a29e" },
  village:    { label: "Village",     icon: Tent,      pattern: "settlement", tint: "#a3e635" },
  port:       { label: "Port",        icon: Anchor,    pattern: "port",       tint: "#38bdf8" },
  forteresse: { label: "Forteresse",  icon: Shield,    pattern: "settlement", tint: "#f87171" },
  foret:      { label: "Forêt",       icon: Trees,     pattern: "foret",      tint: "#4ade80" },
  montagne:   { label: "Montagne",    icon: Mountain,  pattern: "montagne",   tint: "#a8a29e" },
  plaine:     { label: "Plaine",      icon: MapPin,    pattern: "plaine",     tint: "#fde047" },
  temple:     { label: "Temple",      icon: Landmark,  pattern: "settlement", tint: "#c4b5fd" },
};
const getRegionType = (type) => REGION_TYPES[type] || REGION_TYPES.ville;

const PROPERTY_TYPE_ICONS = {
  MAISON: Home, DOMAINE: Castle, TERRAIN: MapPin, COMMERCE: ShoppingBag,
  FERME: Wheat, MANOIR: Castle, ATELIER: Hammer, AUBERGE: Utensils, BATEAU: Ship,
};

// ── Génération procédurale — la carte n'a aucune coordonnée réelle en base, tout est recalculé
// à l'affichage à partir de l'id de la région (forme du territoire) et des propriétés qui s'y
// trouvent réellement (nombre et type des icônes dispersées). Déterministe : deux rendus du
// même état de jeu produisent exactement la même carte. ──
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Contour organique (« blob ») — anneau de points à rayon bruité, lissé par des courbes
// quadratiques passant par les milieux de segments (technique classique de blob SVG).
function blobPath(seedStr, cx, cy, baseRadius) {
  const rng = mulberry32(hashCode(seedStr));
  const n = 9;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    const r = baseRadius * (0.72 + rng() * 0.5);
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M ${mid(pts[n - 1], pts[0])[0].toFixed(1)} ${mid(pts[n - 1], pts[0])[1].toFixed(1)} `;
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const m = mid(cur, next);
    d += `Q ${cur[0].toFixed(1)} ${cur[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)} `;
  }
  return d + "Z";
}

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

  const regions = useMemo(() => myCountry?.regions || [], [myCountry]);
  const capitalRegion = regions.find((r) => r.type === "capitale") || regions.find((r) => r.name === "Capitale") || regions[0] || null;
  const currentRegion = regions.find((r) => r.name === user?.currentPosition) || capitalRegion;
  const otherRegions = regions.filter((r) => r.id !== currentRegion?.id);

  // Propriétés — comparaison normalisée en chaîne : region.id peut être un nombre (Date.now()
  // côté création de région) alors que property.regionId vient toujours d'un <select> HTML,
  // donc toujours une chaîne — une comparaison stricte === échouait silencieusement.
  const propsByRegion = useMemo(() => {
    const map = new Map();
    if (!myCountry) return map;
    regions.forEach((r) => {
      map.set(r.id, properties.filter((p) => String(p.countryId) === String(myCountry.id) && String(p.regionId) === String(r.id)));
    });
    return map;
  }, [regions, properties, myCountry]);

  const buildingsHere = currentRegion ? (propsByRegion.get(currentRegion.id) || []) : [];

  const citizensHere = citizens.filter((c) =>
    c.id !== user?.id &&
    (c.locationCountryId || c.countryId) === myCountryId &&
    (c.currentPosition || "") === (user?.currentPosition || "")
  );

  const selectedRegion = otherRegions.find((r) => r.id === selectedRegionId) || null;

  if (!user || !myCountry) {
    return (
      <div className="text-center py-16">
        <Compass size={48} className="mx-auto mb-3 text-stone-300" />
        <div className="text-stone-400 italic">Votre position est inconnue pour le moment.</div>
      </div>
    );
  }

  // ── Positions radiales des territoires autour de la région actuelle (aucune coordonnée
  // réelle n'existe dans le modèle de données — layout généré à l'affichage) ──
  const cx = 280, cy = 190, radius = 148;
  const nodePositions = otherRegions.map((r, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, otherRegions.length) - Math.PI / 2;
    return { region: r, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) * 0.74 };
  });
  const allNodes = currentRegion ? [{ region: currentRegion, x: cx, y: cy, isCurrent: true }, ...nodePositions.map((n) => ({ ...n, isCurrent: false }))] : [];

  const RegionBlob = ({ region, x, y, isCurrent }) => {
    const meta = getRegionType(region.type);
    const Icon = meta.icon;
    const built = propsByRegion.get(region.id) || [];
    const baseRadius = 34 + Math.min(20, built.length * 2.5);
    const path = blobPath(`region_${region.id}`, x, y, baseRadius);
    const buildRng = mulberry32(hashCode(`buildings_${region.id}`));
    const shown = built.slice(0, 10);

    return (
      <g
        onClick={() => !isCurrent && setSelectedRegionId(selectedRegionId === region.id ? null : region.id)}
        style={{ cursor: isCurrent ? "default" : "pointer" }}
      >
        {isCurrent && (
          <path d={path} fill="none" stroke="#d97706" strokeWidth={3} opacity={0.7}>
            <animate attributeName="stroke-width" values="2;5;2" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.25;0.8" dur="2.4s" repeatCount="indefinite" />
          </path>
        )}
        <path d={path} fill={`url(#pat-${meta.pattern})`} stroke={isCurrent ? "#d97706" : "#78716c"} strokeWidth={isCurrent ? 2.5 : 1.3} opacity={0.95} />

        {/* Bâtiments réels de cette région, dispersés selon un semis déterministe */}
        {shown.map((p, i) => {
          const BIcon = PROPERTY_TYPE_ICONS[p.type] || Home;
          const angle = buildRng() * 2 * Math.PI;
          const r = baseRadius * (0.15 + buildRng() * 0.55);
          const bx = x + r * Math.cos(angle) - 6.5;
          const by = y + r * Math.sin(angle) * 0.9 - 6.5;
          return (
            <g key={p.id || i}>
              <circle cx={bx + 6.5} cy={by + 6.5} r={8.5} fill="#fffbeb" stroke="#78716c" strokeWidth={0.8} />
              <foreignObject x={bx} y={by} width={13} height={13}>
                <BIcon size={13} color="#44403c" strokeWidth={2.2} />
              </foreignObject>
            </g>
          );
        })}
        {built.length > shown.length && (
          <text x={x} y={y + baseRadius + 14} textAnchor="middle" fontSize={9} fontWeight={800} fill="#78716c">
            +{built.length - shown.length}
          </text>
        )}

        {/* Icône + nom du territoire */}
        <circle cx={x} cy={y - baseRadius - 2} r={11} fill={meta.tint} stroke="#ffffff" strokeWidth={1.5} />
        <foreignObject x={x - 7} y={y - baseRadius - 9} width={14} height={14}>
          <Icon size={14} color="#292524" strokeWidth={2.5} />
        </foreignObject>
        <text x={x} y={y + baseRadius + (built.length > shown.length ? 27 : 15)} textAnchor="middle" fontSize={12} fontWeight={800} fill={isCurrent ? "#b45309" : "#44403c"}>
          {region.name}{isCurrent ? " · Vous êtes ici" : ""}
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
        <div className="w-full overflow-x-auto rounded-xl border border-amber-900/10" style={{ background: "radial-gradient(ellipse at 50% 40%, #f7f0dc 0%, #ecdfb8 100%)" }}>
          <svg viewBox="0 0 560 380" className="w-full min-w-[460px] max-w-3xl mx-auto">
            <defs>
              <pattern id="pat-foret" width="14" height="14" patternUnits="userSpaceOnUse">
                <rect width="14" height="14" fill="#15803d" />
                <polygon points="7,2 11.5,11 2.5,11" fill="#166534" />
              </pattern>
              <pattern id="pat-montagne" width="22" height="18" patternUnits="userSpaceOnUse">
                <rect width="22" height="18" fill="#78716c" />
                <polygon points="4,17 9,4 14,17" fill="#57534e" />
                <polygon points="12,17 17,7 21,17" fill="#a8a29e" />
              </pattern>
              <pattern id="pat-port" width="18" height="12" patternUnits="userSpaceOnUse">
                <rect width="18" height="12" fill="#0284c7" />
                <path d="M0,6 Q4.5,2.5 9,6 T18,6" stroke="#7dd3fc" strokeWidth={1.3} fill="none" />
              </pattern>
              <pattern id="pat-plaine" width="13" height="13" patternUnits="userSpaceOnUse">
                <rect width="13" height="13" fill="#ca8a04" />
                <circle cx="3" cy="3.5" r="1.1" fill="#fde047" />
                <circle cx="9" cy="8.5" r="1.1" fill="#fde047" />
              </pattern>
              <pattern id="pat-settlement" width="12" height="12" patternUnits="userSpaceOnUse">
                <rect width="12" height="12" fill="#d6d3d1" />
                <rect x="1" y="1" width="4" height="4" fill="#e7e5e4" />
                <rect x="7" y="6" width="4" height="4" fill="#e7e5e4" />
              </pattern>
            </defs>

            {/* Routes décoratives reliant chaque territoire à la région actuelle */}
            {nodePositions.map(({ region, x, y }) => (
              <line key={`road_${region.id}`} x1={cx} y1={cy} x2={x} y2={y} stroke="#c4a76a" strokeWidth={2} strokeDasharray="1 6" strokeLinecap="round" opacity={0.7} />
            ))}

            {allNodes.map(({ region, x, y, isCurrent }) => (
              <RegionBlob key={region.id} region={region} x={x} y={y} isCurrent={isCurrent} />
            ))}
          </svg>
        </div>

        {selectedRegion && (
          <div className="mt-3 bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {(() => { const M = getRegionType(selectedRegion.type); const I = M.icon; return <I size={16} style={{ color: M.tint }} />; })()}
              <div>
                <div className="text-sm font-bold text-stone-800">{selectedRegion.name}</div>
                <div className="text-[10px] text-stone-400">
                  {getRegionType(selectedRegion.type).label} · {(propsByRegion.get(selectedRegion.id) || []).length} bâtiment(s)
                </div>
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
