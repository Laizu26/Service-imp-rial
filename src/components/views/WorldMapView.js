import React, { useState } from "react";
import {
  Crown, Building2, Tent, Anchor, Shield, Trees, Mountain, MapPin, Landmark,
  Home, Castle, ShoppingBag, Wheat, Hammer, Utensils, Ship, Users, Compass,
  Plane, Lock, User, Globe2, Flag, X, Coins, ChevronRight, Ban, Move, Sparkles,
} from "lucide-react";
import { formatMoney, getFallbackHex, hexGrid, axialToPixel, hexPoints, getEffectiveMagicHue } from "../../lib/gameUtils";

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

const SIZE = 36; // taille des tuiles hexagonales, identique aux 3 strates pour rester "collées"
const CITY_RADIUS = 4; // grille complète de la Ville : 61 cellules

const posOf = (entity, qKey = "hexQ", rKey = "hexR") => {
  const q = entity?.[qKey], r = entity?.[rKey];
  if (typeof q === "number" && typeof r === "number") return { q, r };
  return getFallbackHex(entity?.id);
};

// ── Tuile hexagonale générique — pays (Empire), région (Pays) ou bâtiment/case vide (Ville) ──
// Icône + nom restent DANS les limites de la tuile (au lieu de déborder en dessous) : des
// hexagones collés ne laissent aucune marge pour du texte extérieur, tout chevauche sinon dès
// que deux voisins ont un nom un peu long.
const HexTile = ({ q, r, fill, stroke = "#3f3a34", Icon, label, badge, isCurrent, isSelected, onClick }) => {
  const [x, y] = axialToPixel(q, r, SIZE);
  const points = hexPoints(x, y, SIZE - 1.5);
  const contentSize = SIZE * 1.3;
  return (
    <g onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      {isCurrent && (
        <polygon points={hexPoints(x, y, SIZE - 1)} fill="none" stroke="#d97706" strokeWidth={2.5}>
          <animate attributeName="opacity" values="0.9;0.35;0.9" dur="2.2s" repeatCount="indefinite" />
        </polygon>
      )}
      <polygon points={points} fill={fill} stroke={isSelected ? "#1c1917" : stroke} strokeWidth={isSelected ? 2.6 : 1.2} />
      {(Icon || label) && (
        <foreignObject x={x - contentSize / 2} y={y - contentSize / 2} width={contentSize} height={contentSize} style={{ pointerEvents: "none" }}>
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, padding: "0 3px", overflow: "hidden" }}>
            {Icon && <Icon size={15} color="#1c1917" strokeWidth={2} style={{ opacity: 0.85, flexShrink: 0 }} />}
            {label && (
              <span style={{ fontSize: 7.5, lineHeight: 1.1, fontWeight: 800, color: isCurrent ? "#b45309" : "#292524", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                {label}
              </span>
            )}
          </div>
        </foreignObject>
      )}
      {badge > 0 && (
        <g transform={`translate(${x + SIZE * 0.6}, ${y - SIZE * 0.6})`}>
          <circle r={9} fill="#1c1917" opacity={0.9} />
          <text textAnchor="middle" dy="0.32em" fontSize={8.5} fontWeight={800} fill="#fff">{badge}</text>
        </g>
      )}
      {label && <title>{label}</title>}
    </g>
  );
};

// ── Point "citoyen" — coloré selon sa trace magique (même teinte que l'orbe de Physique &
// Magie), affiché sur la grille de la Ville. Cliquer son propre point permet de se déplacer
// (clic-clic) ; cliquer un autre citoyen ouvre un résumé de son registre. ──
const CitizenDot = ({ citizen, x, y, isSelf, isMoving, onClick }) => {
  const hue = getEffectiveMagicHue(citizen);
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      style={{ cursor: "pointer", pointerEvents: isMoving && !isSelf ? "none" : "auto" }}
    >
      {isSelf && (
        <circle r={11} fill="none" stroke="#1c1917" strokeWidth={1.5} strokeDasharray={isMoving ? "3 3" : "0"} opacity={0.6} />
      )}
      <circle r={7} fill={`hsl(${hue}, 70%, 48%)`} stroke="#fff" strokeWidth={2} />
      <title>{citizen.name}{isSelf ? " (vous)" : ""}</title>
    </g>
  );
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

// ── Résumé d'un citoyen rencontré sur la carte — sa fiche registre en bref, la couleur de son
// point et sa trace magique (même teinte que l'orbe de Physique & Magie). ──
const CitizenSummaryModal = ({ citizen, onClose }) => {
  const hue = getEffectiveMagicHue(citizen);
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-stone-100 bg-stone-50">
          {citizen.avatarUrl ? (
            <img src={citizen.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
              <User size={20} className="text-stone-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-black text-base text-stone-900 truncate">{citizen.name}</div>
            <div className="text-[10px] text-stone-500">{citizen.occupation || citizen.title || "Citoyen"}</div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 shrink-0 p-1 rounded"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-2.5">
              <div className="text-[9px] font-black uppercase text-stone-400">Statut</div>
              <div className="font-bold text-stone-700">{citizen.status || "Actif"}</div>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-2.5">
              <div className="text-[9px] font-black uppercase text-stone-400">Rôle</div>
              <div className="font-bold text-stone-700 truncate">{citizen.role || "Citoyen"}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-lg p-3">
            <div className="w-9 h-9 rounded-full shrink-0 border-2 border-white shadow" style={{ background: `hsl(${hue}, 70%, 48%)` }} />
            <div>
              <div className="text-[9px] font-black uppercase text-stone-400 flex items-center gap-1"><Sparkles size={9} /> Trace magique</div>
              <div className="text-xs font-bold text-stone-600">
                Couleur de son point sur la carte
                {(citizen.magicBond?.linkedSpouses || []).length > 0 && " · liée par pacte arcanique"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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

// ── Bascule "Mode édition" — repositionnement admin d'un pays/région/bâtiment directement sur
// la carte (clic sur la tuile puis clic sur sa nouvelle case), en plus de l'éditeur dans l'Atlas.
const EditToggleButton = ({ editMode, onToggle }) => (
  <button
    onClick={onToggle}
    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-colors shrink-0 ${editMode ? "bg-sky-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
  >
    <Move size={12} /> {editMode ? "Terminer" : "Mode édition"}
  </button>
);

const WorldMapView = ({
  user,
  citizens = [],
  countries = [],
  properties = [],
  travelRequests = [],
  canTravel,
  onInternalTravel,
  onSetCityPosition,
  onSetCountryPosition,
  onSetRegionPosition,
  onSetBuildingPosition,
  mapAuthority,
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
  const [selectedCitizenId, setSelectedCitizenId] = useState(null);
  const [movingSelf, setMovingSelf] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [movingTile, setMovingTile] = useState(null); // { kind: "country" | "region" | "building", id, label }

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
    (c.locationCountryId || c.countryId) === countryId &&
    (c.currentPosition || "") === (region?.name || "")
  );

  const goEmpire = () => { setZoomLevel("empire"); setMovingSelf(false); setEditMode(false); setMovingTile(null); };
  const goCountry = (countryId) => { setViewCountryId(countryId); setZoomLevel("country"); setMovingSelf(false); setEditMode(false); setMovingTile(null); };
  const goCity = (regionId) => { setViewRegionId(regionId); setZoomLevel("city"); setMovingSelf(false); setEditMode(false); setMovingTile(null); };

  const pendingRequestTo = (countryId) => travelRequests.find((r) => String(r.citizenId) === String(user.id) && String(r.toCountry) === String(countryId) && r.status === "PENDING");

  const cityBuildings = zoomLevel === "city" ? propertiesInRegion(displayCountry.id, displayRegion) : [];
  const cityCitizens = zoomLevel === "city" ? citizensInRegion(displayCountry.id, displayRegion) : [];
  const isMyCurrentCity = displayCountry.id === myCountryId && displayRegion?.id === myCurrentRegion?.id;

  // ── Autorité sur l'Atlas — un rôle à portée globale a autorité partout ; un officiel local
  // (niveau ≥ 40) sur son propre pays uniquement ; le propriétaire d'un bien sur son bâtiment.
  // Vérification purement indicative côté client : le serveur revérifie tout dans les actions.
  const hasEmpireAuthority = !!mapAuthority?.isGlobal;
  const hasCountryAuthority = (countryId) => !!mapAuthority?.isGlobal || (String(mapAuthority?.countryId) === String(countryId) && (mapAuthority?.level || 0) >= 40);
  const hasBuildingAuthority = (building) => hasCountryAuthority(building?.countryId) || String(building?.ownerId) === String(user.id);
  const canEditCurrentLevel =
    zoomLevel === "empire" ? hasEmpireAuthority :
    zoomLevel === "country" ? hasCountryAuthority(displayCountry.id) :
    zoomLevel === "city" ? (hasCountryAuthority(displayCountry.id) || cityBuildings.some((b) => String(b.ownerId) === String(user.id))) :
    false;

  // ── Positions + bornes du canvas selon la strate affichée — en mode édition, la grille
  // complète (destinations possibles) doit rester visible même si peu d'entités sont placées ──
  let tiles = [];
  if (zoomLevel === "empire") {
    tiles = countries.map((c) => posOf(c));
    if (editMode) tiles = tiles.concat(hexGrid(CITY_RADIUS).map(([q, r]) => ({ q, r })));
  } else if (zoomLevel === "country") {
    tiles = regions.map((r) => posOf(r));
    if (editMode) tiles = tiles.concat(hexGrid(CITY_RADIUS).map(([q, r]) => ({ q, r })));
  } else {
    tiles = hexGrid(CITY_RADIUS).map(([q, r]) => ({ q, r }));
  }
  const nodePx = tiles.map((t) => axialToPixel(t.q, t.r, SIZE));
  const xs = nodePx.map((p) => p[0]), ys = nodePx.map((p) => p[1]);
  const pad = SIZE * 1.6;
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;

  const buildingAtHex = (q, r) => cityBuildings.find((p) => {
    const pos = posOf(p, "cityHexQ", "cityHexR");
    return pos.q === q && pos.r === r;
  });

  // ── Repositionnement admin — premier clic sur une tuile autorisée pour la sélectionner,
  // second clic n'importe où sur la grille pour la déplacer à cet endroit. ──
  const handleMapClick = (kind, entity, q, r, authority) => {
    if (!editMode) return;
    if (!movingTile) {
      if (entity && authority) setMovingTile({ kind, id: entity.id, label: entity.name });
      return;
    }
    if (movingTile.kind === "country") onSetCountryPosition && onSetCountryPosition(movingTile.id, q, r);
    else if (movingTile.kind === "region") onSetRegionPosition && onSetRegionPosition(displayCountry.id, movingTile.id, q, r);
    else if (movingTile.kind === "building") onSetBuildingPosition && onSetBuildingPosition(movingTile.id, q, r);
    setMovingTile(null);
  };

  const handleCityTileClick = (q, r, building) => {
    if (movingSelf) {
      onSetCityPosition && onSetCityPosition(q, r);
      setMovingSelf(false);
      return;
    }
    if (editMode) {
      handleMapClick("building", building, q, r, building ? hasBuildingAuthority(building) : false);
      return;
    }
    if (building) setSelectedBuildingId(building.id);
  };

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

        {zoomLevel === "city" && movingSelf && (
          <div className="flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2">
            <span className="text-[10px] font-black uppercase text-amber-700 flex items-center gap-1.5"><Move size={12} /> Cliquez sur une case pour vous y déplacer</span>
            <button onClick={() => setMovingSelf(false)} className="text-[10px] font-bold uppercase text-amber-600 hover:text-amber-800">Annuler</button>
          </div>
        )}

        {editMode && (
          <div className="flex items-center justify-between gap-3 bg-sky-50 border-b border-sky-200 px-4 py-2">
            <span className="text-[10px] font-black uppercase text-sky-700 flex items-center gap-1.5">
              <Move size={12} />
              {movingTile ? `Cliquez une case pour y déplacer "${movingTile.label}"` : "Cliquez une tuile à déplacer"}
            </span>
            <button onClick={() => { setEditMode(false); setMovingTile(null); }} className="text-[10px] font-bold uppercase text-sky-600 hover:text-sky-800">Terminer</button>
          </div>
        )}

        <div style={{ background: "radial-gradient(ellipse at 50% 35%, #f7f0dc 0%, #e6d6a8 100%)" }}>
          <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} className="w-full" style={{ maxHeight: 460 }}>
            {zoomLevel === "empire" && (
              <>
                {editMode && hexGrid(CITY_RADIUS).map(([q, r]) => (
                  <HexTile key={`bg_${q}_${r}`} q={q} r={r} fill="#e9dfc4" stroke="#d8cba3" onClick={() => handleMapClick("country", null, q, r, false)} />
                ))}
                {countries.map((c, i) => {
                  const pos = posOf(c);
                  return (
                    <HexTile
                      key={c.id}
                      q={pos.q} r={pos.r}
                      fill={COUNTRY_PALETTE[i % COUNTRY_PALETTE.length]}
                      Icon={Flag}
                      label={c.name}
                      badge={(c.regions || []).length}
                      isCurrent={c.id === myCountryId}
                      isSelected={movingTile?.kind === "country" && movingTile.id === c.id}
                      onClick={() => (editMode ? handleMapClick("country", c, pos.q, pos.r, hasEmpireAuthority) : goCountry(c.id))}
                    />
                  );
                })}
              </>
            )}

            {zoomLevel === "country" && (
              <>
                {editMode && hexGrid(CITY_RADIUS).map(([q, r]) => (
                  <HexTile key={`bg_${q}_${r}`} q={q} r={r} fill="#e9dfc4" stroke="#d8cba3" onClick={() => handleMapClick("region", null, q, r, false)} />
                ))}
                {regions.map((r) => {
                  const pos = posOf(r);
                  const meta = getRegionType(r.type);
                  const built = propertiesInRegion(displayCountry.id, r);
                  return (
                    <HexTile
                      key={r.id}
                      q={pos.q} r={pos.r}
                      fill={meta.fill}
                      Icon={meta.icon}
                      label={r.name}
                      badge={built.length}
                      isCurrent={displayCountry.id === myCountryId && r.id === myCurrentRegion?.id}
                      isSelected={movingTile?.kind === "region" && movingTile.id === r.id}
                      onClick={() => (editMode ? handleMapClick("region", r, pos.q, pos.r, hasCountryAuthority(displayCountry.id)) : goCity(r.id))}
                    />
                  );
                })}
              </>
            )}

            {zoomLevel === "city" && (
              <>
                {/* Grille complète — cases vides praticables + bâtiments dessus */}
                {hexGrid(CITY_RADIUS).map(([q, r]) => {
                  const building = buildingAtHex(q, r);
                  const Icon = building ? (PROPERTY_TYPE_ICONS[building.type] || Home) : null;
                  return (
                    <HexTile
                      key={`${q}_${r}`}
                      q={q} r={r}
                      fill={building ? "#fffbeb" : "#e9dfc4"}
                      stroke={building ? "#78716c" : "#d8cba3"}
                      Icon={Icon}
                      label={building?.name}
                      isSelected={movingSelf || (movingTile?.kind === "building" && movingTile.id === building?.id)}
                      onClick={() => handleCityTileClick(q, r, building)}
                    />
                  );
                })}
                {(() => {
                  // Répartir les citoyens en cercle autour du centre de la case quand plusieurs
                  // partagent la même cellule — sinon leurs points se superposent exactement.
                  const groups = new Map();
                  cityCitizens.forEach((c) => {
                    const validPos = c.cityHexRegionId === displayRegion?.id;
                    const pos = validPos ? { q: c.cityHexQ, r: c.cityHexR } : getFallbackHex(`${c.id}_self`);
                    const key = `${pos.q}_${pos.r}`;
                    if (!groups.has(key)) groups.set(key, { pos, members: [] });
                    groups.get(key).members.push(c);
                  });
                  const dots = [];
                  groups.forEach(({ pos, members }) => {
                    const [cx, cy] = axialToPixel(pos.q, pos.r, SIZE);
                    members.forEach((c, i) => {
                      let dx = 0, dy = 0;
                      if (members.length > 1) {
                        const angle = (2 * Math.PI * i) / members.length - Math.PI / 2;
                        const spread = Math.min(16, 8 + members.length * 1.5);
                        dx = spread * Math.cos(angle);
                        dy = spread * Math.sin(angle);
                      }
                      dots.push({ citizen: c, x: cx + dx, y: cy + dy });
                    });
                  });
                  return dots.map(({ citizen: c, x, y }) => {
                    const isSelf = String(c.id) === String(user.id);
                    return (
                      <CitizenDot
                        key={c.id}
                        citizen={c}
                        x={x} y={y}
                        isSelf={isSelf}
                        isMoving={movingSelf}
                        onClick={() => {
                          if (isSelf) setMovingSelf((v) => !v);
                          else if (!movingSelf) setSelectedCitizenId(c.id);
                        }}
                      />
                    );
                  });
                })()}
              </>
            )}
          </svg>
        </div>

        {/* Panneau contextuel — réagit à la strate affichée */}
        <div className="p-4 border-t border-stone-100 space-y-3">
          {zoomLevel === "empire" && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-stone-400 italic">Cliquez sur un royaume pour voir ses territoires.</p>
              {hasEmpireAuthority && (
                <EditToggleButton editMode={editMode} onToggle={() => { setEditMode((v) => !v); setMovingTile(null); }} />
              )}
            </div>
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
              {hasCountryAuthority(displayCountry.id) && (
                <EditToggleButton editMode={editMode} onToggle={() => { setEditMode((v) => !v); setMovingTile(null); }} />
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
                      {isMyCurrentCity && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black uppercase">Vous êtes ici</span>}
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
                {isMyCurrentCity && (
                  <button
                    onClick={() => { setMovingSelf((v) => !v); setEditMode(false); setMovingTile(null); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-colors shrink-0 ${movingSelf ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
                  >
                    <Move size={12} /> {movingSelf ? "Annuler" : "Se positionner"}
                  </button>
                )}
                {canEditCurrentLevel && (
                  <EditToggleButton editMode={editMode} onToggle={() => { setEditMode((v) => !v); setMovingTile(null); setMovingSelf(false); }} />
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
                    {cityCitizens.length === 0 && <p className="text-[11px] text-stone-400 italic">Personne en vue.</p>}
                    {cityCitizens.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCitizenId(c.id)}
                        className="w-full flex items-center gap-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg px-2.5 py-1.5 text-left transition-colors"
                      >
                        {c.avatarUrl ? <img src={c.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" /> : <User size={13} className="text-stone-400 shrink-0" />}
                        <span className="text-xs font-bold text-stone-700 truncate flex-1">{c.name}{String(c.id) === String(user.id) ? " (vous)" : ""}</span>
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: `hsl(${getEffectiveMagicHue(c)}, 70%, 48%)` }} />
                      </button>
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
            onOpenFullProperty={(propId) => { setSelectedBuildingId(null); onOpenFullProperty && onOpenFullProperty(propId); }}
            canManageProperties={canManageProperties}
          />
        );
      })()}

      {selectedCitizenId && (() => {
        const c = citizens.find((c2) => c2.id === selectedCitizenId) || (String(user.id) === String(selectedCitizenId) ? user : null);
        if (!c) return null;
        return <CitizenSummaryModal citizen={c} onClose={() => setSelectedCitizenId(null)} />;
      })()}
    </div>
  );
};

export default WorldMapView;
