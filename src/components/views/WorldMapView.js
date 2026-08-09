import React, { useState } from "react";
import {
  Crown, Building2, Tent, Anchor, Shield, Trees, Mountain, MapPin, Landmark,
  Home, Castle, ShoppingBag, Wheat, Hammer, Utensils, Ship, Users, Compass,
  Plane, Lock, User, Globe2, Flag, X, Coins, ChevronRight, Ban,
} from "lucide-react";
import { formatMoney, getFallbackPosition } from "../../lib/gameUtils";

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

// Canvas commun aux 3 strates — les positions (x,y en %, définies dans l'Atlas ou, à défaut,
// haché de façon stable via getFallbackPosition) sont converties en pixels sur ce repère fixe.
const CANVAS_W = 680, CANVAS_H = 380;
const toPixel = (x, y) => [(x / 100) * CANVAS_W, (y / 100) * CANVAS_H];
const positionOf = (entity, xKey = "x", yKey = "y") => {
  const px = entity?.[xKey], py = entity?.[yKey];
  if (typeof px === "number" && typeof py === "number") return { x: px, y: py };
  return getFallbackPosition(entity?.id);
};

// ── Aperçu intégré d'un bâtiment — s'ouvre sans quitter la Carte. La gestion avancée (personnel,
// chambres, garnison...) reste dans la fiche complète, mais l'achat/la location, la description
// et le prix sont directement accessibles ici via onOpenFullProperty comme échappatoire explicite.
const BuildingModal = ({ property, user, onClose, onBuyProperty, onBuyPropertyFromPlayer, onRentProperty, onOpenFullProperty, canManageProperties }) => {
  const Icon = PROPERTY_TYPE_ICONS[property.type] || Home;
  const isMine = String(property.ownerId) === String(user?.id);
  const balance = user?.balance || 0;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-stone-100 bg-stone-50">
          <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
            <Icon size={18} className="text-stone-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-base text-stone-900 truncate">{property.name}</div>
            <div className="text-[10px] text-stone-500">{property.ownerName ? `Propriétaire : ${property.ownerName}` : "Disponible"}</div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 shrink-0 p-1 rounded"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          {property.description && <p className="text-xs text-stone-600 leading-relaxed">{property.description}</p>}

          <div className="flex items-center gap-4">
            {(property.price || 0) > 0 && (
              <div>
                <div className="text-[9px] font-black uppercase text-stone-400">Valeur</div>
                <div className="font-mono font-bold text-amber-700 flex items-center gap-1"><Coins size={11} /> {formatMoney(property.price)}</div>
              </div>
            )}
            {(property.income || 0) > 0 && (
              <div>
                <div className="text-[9px] font-black uppercase text-stone-400">Revenu</div>
                <div className="font-mono font-bold text-green-600">+{formatMoney(property.income)}/j</div>
              </div>
            )}
          </div>

          {!canManageProperties ? (
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-center text-xs font-bold text-stone-400 flex items-center justify-center gap-1.5">
              <Lock size={12} /> Accès aux biens restreint
            </div>
          ) : isMine ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-center text-xs font-bold text-amber-700">C'est votre bien</div>
          ) : !property.ownerId ? (
            <button
              onClick={() => onBuyProperty && onBuyProperty(property.id)}
              disabled={balance < property.price}
              className="w-full py-2.5 bg-emerald-600 text-white text-xs font-black uppercase rounded-xl hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Acheter pour {formatMoney(property.price)}
            </button>
          ) : property.forSale ? (
            <button
              onClick={() => onBuyPropertyFromPlayer && onBuyPropertyFromPlayer(property.id)}
              disabled={balance < property.salePrice}
              className="w-full py-2.5 bg-amber-500 text-stone-900 text-xs font-black uppercase rounded-xl hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Acheter pour {formatMoney(property.salePrice)}
            </button>
          ) : property.rental && !property.rental.tenantId ? (
            <button
              onClick={() => onRentProperty && onRentProperty(property.id)}
              disabled={balance < property.rental.dailyRate}
              className="w-full py-2.5 bg-sky-600 text-white text-xs font-black uppercase rounded-xl hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Louer pour {formatMoney(property.rental.dailyRate)}/j
            </button>
          ) : null}

          {canManageProperties && (
            <button
              onClick={() => onOpenFullProperty && onOpenFullProperty(property.id)}
              className="w-full py-2 text-stone-500 text-[10px] font-bold uppercase hover:text-stone-700 transition-colors"
            >
              {isMine ? "Gérer en détail →" : "Voir en détail →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Marqueur "pays" (strate Empire) ou "région" (strate Pays) — cercle à sa position réelle,
// définie dans l'Atlas ou, à défaut, une position stable dérivée de son id. ──
const PinMarker = ({ x, y, fill, Icon, label, isCurrent, badge, onClick }) => {
  const [px, py] = toPixel(x, y);
  const r = 20;
  return (
    <g onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }} transform={`translate(${px}, ${py})`}>
      {isCurrent && (
        <circle r={r + 6} fill="none" stroke="#d97706" strokeWidth={3}>
          <animate attributeName="opacity" values="0.9;0.25;0.9" dur="2.2s" repeatCount="indefinite" />
        </circle>
      )}
      <circle r={r} fill={fill} stroke="#3f3a34" strokeWidth={1.4} />
      <foreignObject x={-11} y={-11} width={22} height={22}>
        <Icon size={22} color="#1c1917" strokeWidth={2} opacity={0.85} />
      </foreignObject>
      {badge > 0 && (
        <g transform={`translate(0, ${r - 5})`}>
          <rect x={-16} y={-9} width={32} height={18} rx={9} fill="#1c1917" opacity={0.88} />
          <text x={0} y={4} textAnchor="middle" fontSize={10.5} fontWeight={800} fill="#fff">×{badge}</text>
        </g>
      )}
      <text y={r + 14} textAnchor="middle" fontSize={11} fontWeight={800} fill="#292524"
        style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 3 }}>
        {label}
      </text>
    </g>
  );
};

// ── Marqueur bâtiment (strate Ville) — plus petit, cliquable, ouvre BuildingModal ──
const BuildingPin = ({ property, onClick }) => {
  const { x, y } = positionOf(property, "cityX", "cityY");
  const [px, py] = toPixel(x, y);
  const Icon = PROPERTY_TYPE_ICONS[property.type] || Home;
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }} transform={`translate(${px}, ${py})`}>
      <circle r={13} fill="#fffbeb" stroke="#78716c" strokeWidth={1.2} />
      <foreignObject x={-8} y={-8} width={16} height={16}>
        <Icon size={16} color="#44403c" strokeWidth={2.2} />
      </foreignObject>
    </g>
  );
};

// ── Point "citoyen présent" (strate Ville) — position décorative stable, pas une vraie
// coordonnée individuelle (non demandée), juste une présence visible sur la carte. ──
const CitizenDot = ({ citizen, isSelf }) => {
  const base = getFallbackPosition(citizen.id);
  const x = 8 + (base.x / 100) * 84, y = 8 + (base.y / 100) * 84; // marge pour rester dans le canvas
  const [px, py] = toPixel(x, y);
  return (
    <g transform={`translate(${px}, ${py})`}>
      <title>{citizen.name}</title>
      <circle r={5} fill={isSelf ? "#d97706" : "#57534e"} stroke="#fff" strokeWidth={1.5} />
    </g>
  );
};

const Breadcrumb = ({ level, countryName, regionName, onEmpire, onCountry }) => (
  <div className="flex items-center gap-1.5 px-3 py-2 border-b border-stone-100 text-[10px] font-black uppercase tracking-widest">
    <button onClick={onEmpire} className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${level === "empire" ? "bg-stone-900 text-amber-400" : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"}`}>
      <Globe2 size={12} /> Empire
    </button>
    {countryName && (
      <>
        <ChevronRight size={11} className="text-stone-300 shrink-0" />
        <button onClick={onCountry} className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${level === "country" ? "bg-stone-900 text-amber-400" : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"}`}>
          <Compass size={12} /> {countryName}
        </button>
      </>
    )}
    {regionName && (
      <>
        <ChevronRight size={11} className="text-stone-300 shrink-0" />
        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-900 text-amber-400">
          <MapPin size={12} /> {regionName}
        </span>
      </>
    )}
  </div>
);

const WorldMapView = ({
  user,
  citizens = [],
  countries = [],
  properties = [],
  travelRequests = [],
  canTravel,
  onInternalTravel,
  onRequestTravel,
  onCancelTravelRequest,
  onOpenFullProperty,
  canManageProperties = true,
  onBuyProperty,
  onBuyPropertyFromPlayer,
  onRentProperty,
}) => {
  const [zoomLevel, setZoomLevel] = useState("country"); // "empire" | "country" | "city"
  const [viewCountryId, setViewCountryId] = useState(null);
  const [viewRegionId, setViewRegionId] = useState(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);

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

  const displayCountryId = viewCountryId || myCountryId;
  const displayCountry = countries.find((c) => c.id === displayCountryId) || myCountry;
  const regions = displayCountry.regions || [];
  const capitalRegion = regions.find((r) => r.type === "capitale") || regions.find((r) => r.name === "Capitale") || regions[0] || null;
  const myCurrentRegion = (myCountry.regions || []).find((r) => r.name === user?.currentPosition) || null;
  const displayRegion = regions.find((r) => r.id === viewRegionId) || capitalRegion;

  const propertiesInRegion = (countryId, region) => region
    ? properties.filter((p) => String(p.countryId) === String(countryId) && String(p.regionId) === String(region.id))
    : [];
  const citizensInRegion = (countryId, region) => citizens.filter((c) =>
    c.id !== user?.id &&
    (c.locationCountryId || c.countryId) === countryId &&
    (c.currentPosition || "") === (region?.name || "")
  );

  const goEmpire = () => setZoomLevel("empire");
  const goCountry = (countryId) => { setViewCountryId(countryId); setZoomLevel("country"); };
  const goCity = (regionId) => { setViewRegionId(regionId); setZoomLevel("city"); };

  const pendingRequestTo = (countryId) => travelRequests.find((r) => String(r.citizenId) === String(user.id) && String(r.toCountry) === String(countryId) && r.status === "PENDING");

  const cityBuildings = zoomLevel === "city" ? propertiesInRegion(displayCountry.id, displayRegion) : [];
  const cityCitizens = zoomLevel === "city" ? citizensInRegion(displayCountry.id, displayRegion) : [];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-700 bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/20 p-4">
        <div className="relative flex items-center gap-3">
          <Compass size={24} className="text-amber-400" />
          <div>
            <h2 className="text-lg font-black font-serif text-stone-100">Où je suis</h2>
            <p className="text-[11px] text-stone-400">Empire → Pays → Ville. Cliquez sur un territoire pour l'explorer.</p>
          </div>
        </div>
      </div>

      {/* Carte unifiée */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        <Breadcrumb
          level={zoomLevel}
          countryName={zoomLevel !== "empire" ? displayCountry.name : null}
          regionName={zoomLevel === "city" ? displayRegion?.name : null}
          onEmpire={goEmpire}
          onCountry={() => goCountry(displayCountry.id)}
        />

        <div style={{ background: "radial-gradient(ellipse at 50% 35%, #f7f0dc 0%, #e6d6a8 100%)" }}>
          <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} className="w-full" style={{ maxHeight: 420 }}>
            {zoomLevel === "empire" && countries.map((c, i) => {
              const pos = positionOf(c);
              return (
                <PinMarker
                  key={c.id}
                  x={pos.x} y={pos.y}
                  fill={COUNTRY_PALETTE[i % COUNTRY_PALETTE.length]}
                  Icon={Flag}
                  label={c.name}
                  isCurrent={c.id === myCountryId}
                  onClick={() => goCountry(c.id)}
                />
              );
            })}

            {zoomLevel === "country" && regions.map((r) => {
              const pos = positionOf(r);
              const meta = getRegionType(r.type);
              const built = propertiesInRegion(displayCountry.id, r);
              return (
                <PinMarker
                  key={r.id}
                  x={pos.x} y={pos.y}
                  fill={meta.fill}
                  Icon={meta.icon}
                  label={r.name}
                  badge={built.length}
                  isCurrent={displayCountry.id === myCountryId && r.id === myCurrentRegion?.id}
                  onClick={() => goCity(r.id)}
                />
              );
            })}

            {zoomLevel === "city" && (
              <>
                {cityBuildings.map((p) => (
                  <BuildingPin key={p.id} property={p} onClick={() => setSelectedBuildingId(p.id)} />
                ))}
                {cityCitizens.map((c) => <CitizenDot key={c.id} citizen={c} />)}
                {displayCountry.id === myCountryId && displayRegion?.id === myCurrentRegion?.id && (
                  <CitizenDot citizen={user} isSelf />
                )}
              </>
            )}
          </svg>
        </div>

        {/* Panneau contextuel — réagit à la strate affichée */}
        <div className="p-4 border-t border-stone-100 space-y-3">
          {zoomLevel === "empire" && (
            <p className="text-[11px] text-stone-400 italic text-center py-2">Cliquez sur un royaume pour voir ses territoires.</p>
          )}

          {zoomLevel === "country" && (
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-stone-800 flex items-center gap-1.5">
                  {displayCountry.name}
                  {displayCountry.id === myCountryId && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black uppercase">Votre royaume</span>}
                </div>
                <div className="text-[10px] text-stone-400">{displayCountry.rulerName || "Souverain inconnu"} · {regions.length} territoire(s)</div>
              </div>
              {displayCountry.id !== myCountryId && (
                pendingRequestTo(displayCountry.id) ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-amber-600 font-bold uppercase">Visa en attente</span>
                    <button
                      onClick={() => onCancelTravelRequest && onCancelTravelRequest(pendingRequestTo(displayCountry.id).id)}
                      className="flex items-center gap-1.5 text-red-500 border border-red-200 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-red-50 transition-colors"
                    >
                      <Ban size={11} /> Annuler
                    </button>
                  </div>
                ) : canTravel ? (
                  <button
                    onClick={() => { onRequestTravel && onRequestTravel(displayCountry.id, "Frontière"); }}
                    className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-500 transition-colors shrink-0"
                  >
                    <Plane size={12} /> Demander un visa
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-stone-400 text-[10px] font-bold uppercase shrink-0">
                    <Lock size={12} /> Voyage restreint
                  </span>
                )
              )}
            </div>
          )}

          {zoomLevel === "city" && displayRegion && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(() => { const M = getRegionType(displayRegion.type); const I = M.icon; return <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: M.fill }}><I size={16} color="#1c1917" /></div>; })()}
                  <div>
                    <div className="text-sm font-black text-stone-800 flex items-center gap-1.5">
                      {displayRegion.name}
                      {displayCountry.id === myCountryId && displayRegion.id === myCurrentRegion?.id && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black uppercase">Vous êtes ici</span>}
                    </div>
                    <div className="text-[10px] text-stone-400">{getRegionType(displayRegion.type).label}</div>
                  </div>
                </div>
                {displayCountry.id === myCountryId && displayRegion.id !== myCurrentRegion?.id && (
                  canTravel ? (
                    <button
                      onClick={() => onInternalTravel && onInternalTravel(displayRegion.name)}
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
                    {cityBuildings.length === 0 && <p className="text-[11px] text-stone-400 italic">Aucun bâtiment connu ici.</p>}
                    {cityBuildings.map((p) => {
                      const Icon = PROPERTY_TYPE_ICONS[p.type] || Home;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedBuildingId(p.id)}
                          className="w-full flex items-center gap-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg px-2.5 py-1.5 text-left transition-colors"
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
                    {cityCitizens.length === 0 && <p className="text-[11px] text-stone-400 italic">Personne d'autre en vue.</p>}
                    {cityCitizens.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5">
                        {c.avatarUrl ? <img src={c.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" /> : <User size={13} className="text-stone-400 shrink-0" />}
                        <span className="text-xs font-bold text-stone-700 truncate">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedBuildingId && (() => {
        const property = properties.find((p) => p.id === selectedBuildingId);
        if (!property) return null;
        return (
          <BuildingModal
            property={property}
            user={user}
            onClose={() => setSelectedBuildingId(null)}
            onBuyProperty={onBuyProperty}
            onBuyPropertyFromPlayer={onBuyPropertyFromPlayer}
            onRentProperty={onRentProperty}
            onOpenFullProperty={onOpenFullProperty}
            canManageProperties={canManageProperties}
          />
        );
      })()}
    </div>
  );
};

export default WorldMapView;
