import React, { useState, useMemo } from "react";
import {
  Crown, Building2, Tent, Anchor, Shield, Trees, Mountain, MapPin, Landmark,
  Home, Castle, ShoppingBag, Wheat, Hammer, Utensils, Ship, Users, Compass,
  Plane, Lock, User, Globe2, Flag,
} from "lucide-react";
import { formatMoney } from "../../lib/gameUtils";

// Types de région — même typologie que GeopoliticsView.js (dupliquée ici comme le reste des
// tables d'icônes du jeu). Palette volontairement sobre (tons de terre) pour que la carte se
// lise comme une carte, pas comme une mosaïque de couleurs criardes.
const REGION_TYPES = {
  capitale:   { label: "Capitale",   icon: Crown,     fill: "#e9c46a" },
  ville:      { label: "Ville",      icon: Building2, fill: "#c9ada7" },
  village:    { label: "Village",    icon: Tent,      fill: "#a3b18a" },
  port:       { label: "Port",       icon: Anchor,    fill: "#6fa8bf" },
  forteresse: { label: "Forteresse", icon: Shield,    fill: "#9d6b53" },
  foret:      { label: "Forêt",      icon: Trees,     fill: "#588157" },
  montagne:   { label: "Montagne",   icon: Mountain,  fill: "#8d99ae" },
  plaine:     { label: "Plaine",     icon: MapPin,    fill: "#ddb892" },
  temple:     { label: "Temple",     icon: Landmark,  fill: "#b5838d" },
};
const getRegionType = (type) => REGION_TYPES[type] || REGION_TYPES.ville;
const COUNTRY_PALETTE = ["#c9ada7", "#a3b18a", "#8d99ae", "#e9c46a", "#6fa8bf", "#9d6b53", "#b5838d", "#588157"];

const PROPERTY_TYPE_ICONS = {
  MAISON: Home, DOMAINE: Castle, TERRAIN: MapPin, COMMERCE: ShoppingBag,
  FERME: Wheat, MANOIR: Castle, ATELIER: Hammer, AUBERGE: Utensils, BATEAU: Ship,
};

// ── Grille hexagonale (coordonnées axiales, hexagones "flat-top") — aucune coordonnée réelle
// n'existe en base : la position de chaque territoire est calculée à l'affichage via une
// spirale de tuiles adjacentes autour du territoire actuel, standard pour ce type de grille. ──
const HEX_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
function hexRing(radius) {
  if (radius === 0) return [[0, 0]];
  const results = [];
  let hex = [HEX_DIRS[4][0] * radius, HEX_DIRS[4][1] * radius];
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < radius; j++) {
      results.push(hex);
      hex = [hex[0] + HEX_DIRS[i][0], hex[1] + HEX_DIRS[i][1]];
    }
  }
  return results;
}
function hexSpiral(n) {
  const coords = [[0, 0]];
  let radius = 1;
  while (coords.length < n) { coords.push(...hexRing(radius)); radius++; }
  return coords.slice(0, Math.max(n, 1));
}
function axialToPixel(q, r, size) {
  return [size * 1.5 * q, size * Math.sqrt(3) * (r + q / 2)];
}
function hexPoints(cx, cy, size) {
  return Array.from({ length: 6 }, (_, i) => {
    const rad = (Math.PI / 180) * (60 * i);
    return `${(cx + size * Math.cos(rad)).toFixed(1)},${(cy + size * Math.sin(rad)).toFixed(1)}`;
  }).join(" ");
}

const HEX_SIZE = 46;

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
  const [viewMode, setViewMode] = useState("region"); // "region" | "world"
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [selectedCountryId, setSelectedCountryId] = useState(null);

  const myCountryId = user?.locationCountryId || user?.countryId;
  const myCountry = countries.find((c) => c.id === myCountryId);

  const regions = useMemo(() => myCountry?.regions || [], [myCountry]);
  const capitalRegion = regions.find((r) => r.type === "capitale") || regions.find((r) => r.name === "Capitale") || regions[0] || null;
  const currentRegion = regions.find((r) => r.name === user?.currentPosition) || capitalRegion;

  // Propriétés par région — comparaison normalisée en chaîne : region.id peut être un nombre
  // (Date.now() côté création de région) alors que property.regionId vient toujours d'un
  // <select> HTML, donc toujours une chaîne — une comparaison stricte === échouait silencieusement.
  const propsByRegion = useMemo(() => {
    const map = new Map();
    if (!myCountry) return map;
    regions.forEach((r) => {
      map.set(r.id, properties.filter((p) => String(p.countryId) === String(myCountry.id) && String(p.regionId) === String(r.id)));
    });
    return map;
  }, [regions, properties, myCountry]);

  const citizensInRegion = (region) => citizens.filter((c) =>
    c.id !== user?.id &&
    (c.locationCountryId || c.countryId) === myCountryId &&
    (c.currentPosition || "") === (region?.name || "")
  );

  const otherCountries = countries.filter((c) => c.id !== myCountryId);

  if (!user || !myCountry) {
    return (
      <div className="text-center py-16">
        <Compass size={48} className="mx-auto mb-3 text-stone-300" />
        <div className="text-stone-400 italic">Votre position est inconnue pour le moment.</div>
      </div>
    );
  }

  const activeRegion = regions.find((r) => r.id === selectedRegionId) || currentRegion;
  const activeCountry = countries.find((c) => c.id === selectedCountryId) || myCountry;

  // ── Disposition des tuiles : le territoire/pays "actuel" occupe le centre, les autres
  // s'enroulent en spirale de tuiles hexagonales adjacentes autour de lui ──
  const isWorld = viewMode === "world";
  const orderedRegions = currentRegion ? [currentRegion, ...regions.filter((r) => r.id !== currentRegion.id)] : regions;
  const orderedCountries = [myCountry, ...otherCountries];
  const tiles = isWorld
    ? orderedCountries.map((c, i) => ({ kind: "country", data: c, coord: hexSpiral(orderedCountries.length)[i] }))
    : orderedRegions.map((r, i) => ({ kind: "region", data: r, coord: hexSpiral(orderedRegions.length)[i] }));

  const nodes = tiles.map((t) => {
    const [x, y] = axialToPixel(t.coord[0], t.coord[1], HEX_SIZE);
    return { ...t, x, y };
  });
  const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
  const pad = HEX_SIZE * 1.5;
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;

  const HexTile = ({ node }) => {
    const { kind, data, x, y } = node;
    const isCurrent = kind === "region" ? data.id === currentRegion?.id : data.id === myCountry.id;
    const isSelected = kind === "region" ? data.id === activeRegion?.id : data.id === activeCountry?.id;
    const meta = kind === "region" ? getRegionType(data.type) : null;
    const fill = kind === "region" ? meta.fill : COUNTRY_PALETTE[nodes.findIndex((n) => n.data.id === data.id) % COUNTRY_PALETTE.length];
    const Icon = kind === "region" ? meta.icon : Flag;
    const built = kind === "region" ? (propsByRegion.get(data.id) || []) : [];
    const points = hexPoints(x, y, HEX_SIZE - 1.5);

    return (
      <g
        onClick={() => (kind === "region" ? setSelectedRegionId(data.id) : setSelectedCountryId(data.id))}
        style={{ cursor: "pointer" }}
      >
        <polygon points={points} fill={fill} stroke="#3f3a34" strokeWidth={1.4} opacity={isCurrent ? 1 : 0.92} />
        {isSelected && <polygon points={points} fill="none" stroke="#1c1917" strokeWidth={2.5} strokeDasharray="5 3" />}
        {isCurrent && (
          <polygon points={hexPoints(x, y, HEX_SIZE + 4)} fill="none" stroke="#d97706" strokeWidth={3}>
            <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2.2s" repeatCount="indefinite" />
          </polygon>
        )}

        <foreignObject x={x - 11} y={y - (built.length > 0 ? 20 : 11)} width={22} height={22}>
          <Icon size={22} color="#1c1917" strokeWidth={2} opacity={0.85} />
        </foreignObject>

        {built.length > 0 && (
          <g transform={`translate(${x}, ${y + 15})`}>
            <rect x={-17} y={-10} width={34} height={19} rx={9.5} fill="#1c1917" opacity={0.88} />
            <text x={0} y={4} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff">×{built.length}</text>
          </g>
        )}

        <text x={x} y={y + HEX_SIZE - 3} textAnchor="middle" fontSize={10.5} fontWeight={800} fill="#fff"
          style={{ paintOrder: "stroke", stroke: "#1c1917", strokeWidth: 3 }}>
          {data.name}
        </text>
      </g>
    );
  };

  const activeBuildings = activeRegion ? (propsByRegion.get(activeRegion.id) || []) : [];
  const activeCitizens = activeRegion ? citizensInRegion(activeRegion) : [];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-700 bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/20 p-4">
        <div className="relative flex items-center gap-3">
          <Compass size={24} className="text-amber-400" />
          <div>
            <h2 className="text-lg font-black font-serif text-stone-100">Où je suis</h2>
            <p className="text-[11px] text-stone-400">Cliquez sur un territoire pour l'explorer.</p>
          </div>
        </div>
      </div>

      {/* Carte unifiée */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {/* Barre de mode */}
        <div className="flex items-center gap-2 p-3 border-b border-stone-100">
          <button
            onClick={() => setViewMode("region")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${!isWorld ? "bg-stone-900 text-amber-400" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}
          >
            <Compass size={12} /> {myCountry.name}
          </button>
          <button
            onClick={() => setViewMode("world")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${isWorld ? "bg-stone-900 text-amber-400" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}
          >
            <Globe2 size={12} /> Monde
          </button>
        </div>

        <div style={{ background: "radial-gradient(ellipse at 50% 35%, #f7f0dc 0%, #e6d6a8 100%)" }}>
          <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} className="w-full" style={{ maxHeight: 420 }}>
            {nodes.map((n) => <HexTile key={n.data.id} node={n} />)}
          </svg>
        </div>

        {/* Panneau contextuel — un seul panneau qui réagit à la tuile sélectionnée */}
        <div className="p-4 border-t border-stone-100">
          {!isWorld ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(() => { const M = getRegionType(activeRegion?.type); const I = M.icon; return <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: M.fill }}><I size={16} color="#1c1917" /></div>; })()}
                  <div>
                    <div className="text-sm font-black text-stone-800 flex items-center gap-1.5">
                      {activeRegion?.name}
                      {activeRegion?.id === currentRegion?.id && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black uppercase">Vous êtes ici</span>}
                    </div>
                    <div className="text-[10px] text-stone-400">{getRegionType(activeRegion?.type).label}</div>
                  </div>
                </div>
                {activeRegion?.id !== currentRegion?.id && (
                  canTravel ? (
                    <button
                      onClick={() => onInternalTravel && onInternalTravel(activeRegion.name)}
                      className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-500 transition-colors shrink-0"
                    >
                      <Plane size={12} /> Se déplacer ici
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-stone-400 text-[10px] font-bold uppercase shrink-0">
                      <Lock size={12} /> Voyage restreint
                    </span>
                  )
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5 flex items-center gap-1"><Building2 size={10} /> Bâtiments</div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {activeBuildings.length === 0 && <p className="text-[11px] text-stone-400 italic">Aucun bâtiment connu ici.</p>}
                    {activeBuildings.map((p) => {
                      const Icon = PROPERTY_TYPE_ICONS[p.type] || Home;
                      return (
                        <button
                          key={p.id}
                          onClick={() => canManageProperties && onSelectProperty && onSelectProperty(p.id)}
                          disabled={!canManageProperties}
                          className="w-full flex items-center gap-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg px-2.5 py-1.5 text-left transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Icon size={13} className="text-stone-500 shrink-0" />
                          <span className="text-xs font-bold text-stone-700 truncate flex-1">{p.name}</span>
                          <span className="text-[9px] text-stone-400 shrink-0">{p.ownerName ? "" : formatMoney(p.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5 flex items-center gap-1"><Users size={10} /> Citoyens présents</div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {activeCitizens.length === 0 && <p className="text-[11px] text-stone-400 italic">Personne d'autre en vue.</p>}
                    {activeCitizens.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5">
                        {c.avatarUrl ? <img src={c.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" /> : <User size={13} className="text-stone-400 shrink-0" />}
                        <span className="text-xs font-bold text-stone-700 truncate">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-stone-800 flex items-center gap-1.5">
                  {activeCountry?.name || "—"}
                  {activeCountry?.id === myCountry.id && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black uppercase">Vous êtes ici</span>}
                </div>
                <div className="text-[10px] text-stone-400">{activeCountry?.rulerName || "Souverain inconnu"} · {(activeCountry?.regions || []).length} territoire(s)</div>
              </div>
              {activeCountry && activeCountry.id !== myCountry.id && (
                <button
                  onClick={() => onNavigateToTravel && onNavigateToTravel(activeCountry.id)}
                  className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-500 transition-colors shrink-0"
                >
                  <Plane size={12} /> Demander un visa
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorldMapView;
