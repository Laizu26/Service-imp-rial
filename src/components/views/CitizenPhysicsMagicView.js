import React, { useState } from "react";
import {
  Zap,
  Shield,
  Wind,
  Flame,
  Snowflake,
  Droplets,
  Sun,
  Moon,
  Leaf,
  Sparkles,
  Star,
  Lock,
  ChevronRight,
  HeartPulse,
  Info,
} from "lucide-react";

// ===== ZONES DU CORPS =====
const BODY_ZONES = [
  { id: "tete",         label: "Tête",              desc: "Crâne, mâchoire, cerveau, yeux" },
  { id: "cou",          label: "Cou",               desc: "Vertèbres cervicales, gorge, artères" },
  { id: "torse",        label: "Torse",             desc: "Côtes, sternum, poumons, cœur" },
  { id: "abdomen",      label: "Abdomen",           desc: "Estomac, foie, organes abdominaux" },
  { id: "bassin",       label: "Bassin",            desc: "Os iliaque, hanches, lombaires" },
  { id: "bras_g",       label: "Bras gauche",       desc: "Épaule, biceps, humérus" },
  { id: "bras_d",       label: "Bras droit",        desc: "Épaule, biceps, humérus" },
  { id: "avant_bras_g", label: "Avant-bras G.",     desc: "Radius, cubitus, poignet" },
  { id: "avant_bras_d", label: "Avant-bras D.",     desc: "Radius, cubitus, poignet" },
  { id: "main_g",       label: "Main gauche",       desc: "Métacarpe, phalanges, cheville" },
  { id: "main_d",       label: "Main droite",       desc: "Métacarpe, phalanges, cheville" },
  { id: "cuisse_g",     label: "Cuisse gauche",     desc: "Fémur, quadriceps, ischio-jambiers" },
  { id: "cuisse_d",     label: "Cuisse droite",     desc: "Fémur, quadriceps, ischio-jambiers" },
  { id: "jambe_g",      label: "Jambe gauche",      desc: "Tibia, péroné, genou, mollet" },
  { id: "jambe_d",      label: "Jambe droite",      desc: "Tibia, péroné, genou, mollet" },
  { id: "pied_g",       label: "Pied gauche",       desc: "Cheville, métatarse, orteils" },
  { id: "pied_d",       label: "Pied droit",        desc: "Cheville, métatarse, orteils" },
];

// ===== ÉTATS DE BLESSURE =====
const INJURY_STATES = [
  { id: "sain",            label: "Sain",           fill: "#d1fae5", stroke: "#059669", textColor: "#065f46", dot: "bg-emerald-500",  badge: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { id: "contusion",       label: "Contusion",      fill: "#fef9c3", stroke: "#b45309", textColor: "#78350f", dot: "bg-amber-400",    badge: "bg-amber-100 text-amber-800 border-amber-300"     },
  { id: "blessure_legere", label: "Blessé léger",   fill: "#fed7aa", stroke: "#c2410c", textColor: "#9a3412", dot: "bg-orange-500",   badge: "bg-orange-100 text-orange-700 border-orange-300"  },
  { id: "blessure_grave",  label: "Blessé grave",   fill: "#fecaca", stroke: "#b91c1c", textColor: "#991b1b", dot: "bg-red-500",      badge: "bg-red-100 text-red-700 border-red-300"           },
  { id: "fracture",        label: "Fracture",       fill: "#ede9fe", stroke: "#6d28d9", textColor: "#5b21b6", dot: "bg-violet-500",   badge: "bg-violet-100 text-violet-700 border-violet-300"  },
  { id: "critique",        label: "État critique",  fill: "#1e293b", stroke: "#94a3b8", textColor: "#f1f5f9", dot: "bg-slate-700",    badge: "bg-slate-800 text-slate-200 border-slate-600"     },
];

const getInjuryState = (id) => INJURY_STATES.find((s) => s.id === id) || INJURY_STATES[0];

const getOverallHealth = (injuries) => {
  const vals = Object.values(injuries || {}).filter(Boolean);
  if (vals.includes("critique"))        return { label: "État critique",         color: "text-slate-700",   bg: "bg-slate-100 border-slate-400"       };
  if (vals.includes("fracture"))        return { label: "Gravement blessé",      color: "text-violet-700",  bg: "bg-violet-50 border-violet-300"      };
  if (vals.includes("blessure_grave"))  return { label: "Sérieusement blessé",   color: "text-red-700",     bg: "bg-red-50 border-red-300"            };
  if (vals.includes("blessure_legere")) return { label: "Légèrement blessé",     color: "text-orange-700",  bg: "bg-orange-50 border-orange-300"      };
  if (vals.includes("contusion"))       return { label: "Quelques contusions",   color: "text-amber-700",   bg: "bg-amber-50 border-amber-300"        };
  return                                       { label: "En pleine forme",        color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-300"    };
};

// ===== SCHÉMA CORPOREL SVG =====
const BodySVG = ({ injuries, selectedZone, hoveredZone, onSelect, onHover }) => {
  const getP = (id) => {
    const st = getInjuryState(injuries[id] || "sain");
    const sel = selectedZone === id;
    const hov = hoveredZone === id;
    return {
      fill:        st.fill,
      stroke:      sel ? "#0f172a" : st.stroke,
      strokeWidth: sel ? "2.5" : hov ? "2" : "1.3",
      opacity:     sel || hov ? "1" : "0.9",
      style:       { cursor: "pointer", transition: "all 0.15s" },
      onClick:     () => onSelect(selectedZone === id ? null : id),
      onMouseEnter:() => onHover(id),
      onMouseLeave:() => onHover(null),
    };
  };

  return (
    <svg viewBox="0 0 200 490" className="w-full h-full">

      {/* ── TÊTE ── */}
      <ellipse cx="100" cy="40" rx="24" ry="28" {...getP("tete")} />

      {/* ── COU ── */}
      <rect x="91" y="66" width="18" height="17" rx="4" {...getP("cou")} />

      {/* ── TORSE ── */}
      <path d="M 74 83 L 126 83 L 131 180 L 69 180 Z" {...getP("torse")} />

      {/* ── ABDOMEN ── */}
      <path d="M 69 180 L 67 248 L 133 248 L 131 180 Z" {...getP("abdomen")} />

      {/* ── BASSIN ── */}
      <path d="M 67 248 Q 59 266 67 276 L 85 286 L 115 286 L 133 276 Q 141 266 133 248 Z" {...getP("bassin")} />

      {/* ── BRAS GAUCHE ── */}
      <path d="M 74 85 Q 54 85 44 100 Q 36 118 43 137 Q 49 150 62 148 Q 73 146 74 131 Z" {...getP("bras_g")} />

      {/* ── BRAS DROIT ── */}
      <path d="M 126 85 Q 146 85 156 100 Q 164 118 157 137 Q 151 150 138 148 Q 127 146 126 131 Z" {...getP("bras_d")} />

      {/* ── AVANT-BRAS GAUCHE ── */}
      <path d="M 43 137 Q 34 157 34 180 Q 34 196 44 200 Q 57 204 67 198 Q 75 192 74 171 L 74 131 Q 62 148 43 137 Z" {...getP("avant_bras_g")} />

      {/* ── AVANT-BRAS DROIT ── */}
      <path d="M 157 137 Q 166 157 166 180 Q 166 196 156 200 Q 143 204 133 198 Q 125 192 126 171 L 126 131 Q 138 148 157 137 Z" {...getP("avant_bras_d")} />

      {/* ── MAIN GAUCHE ── */}
      <ellipse cx="50" cy="212" rx="10" ry="13" {...getP("main_g")} />

      {/* ── MAIN DROITE ── */}
      <ellipse cx="150" cy="212" rx="10" ry="13" {...getP("main_d")} />

      {/* ── CUISSE GAUCHE ── */}
      <path d="M 85 286 L 79 380 L 100 382 L 106 286 Z" {...getP("cuisse_g")} />

      {/* ── CUISSE DROITE ── */}
      <path d="M 115 286 L 94 286 L 100 382 L 121 380 Z" {...getP("cuisse_d")} />

      {/* ── JAMBE GAUCHE ── */}
      <path d="M 79 380 L 77 462 L 96 464 L 100 382 Z" {...getP("jambe_g")} />

      {/* ── JAMBE DROITE ── */}
      <path d="M 100 382 L 104 464 L 123 462 L 121 380 Z" {...getP("jambe_d")} />

      {/* ── PIED GAUCHE ── */}
      <ellipse cx="85" cy="469" rx="18" ry="9" {...getP("pied_g")} />

      {/* ── PIED DROIT ── */}
      <ellipse cx="115" cy="469" rx="18" ry="9" {...getP("pied_d")} />
    </svg>
  );
};

// ===== AFFINITÉS MAGIQUES =====
const MAGIC_AFFINITIES = [
  { id: "feu",     label: "Feu",      emoji: "🔥", icon: Flame,     color: "orange", desc: "Maîtrise des flammes. Puissante en attaque, ravageuse en combat." },
  { id: "eau",     label: "Eau",      emoji: "💧", icon: Droplets,  color: "blue",   desc: "Contrôle de l'eau. Soins, fluidité et protection." },
  { id: "vent",    label: "Vent",     emoji: "💨", icon: Wind,      color: "cyan",   desc: "Domination des courants d'air. Rapidité et tranchant invisible." },
  { id: "foudre",  label: "Foudre",   emoji: "⚡", icon: Zap,       color: "yellow", desc: "Canalisation de l'électricité. Paralysie et précision foudroyante." },
  { id: "glace",   label: "Glace",    emoji: "❄️", icon: Snowflake, color: "sky",    desc: "Emprise du froid. Ralentissement, piège et barrières cristallines." },
  { id: "ombre",   label: "Ombre",    emoji: "🌑", icon: Moon,      color: "violet", desc: "Manipulation des ténèbres. Illusions et dissimulation." },
  { id: "lumiere", label: "Lumière",  emoji: "✨", icon: Sun,       color: "amber",  desc: "Rayonnement divin. Purification, révélation et guérison sacrée." },
  { id: "nature",  label: "Nature",   emoji: "🌿", icon: Leaf,      color: "emerald",desc: "Communion avec le vivant. Soins profonds et métamorphose." },
  { id: "arcane",  label: "Arcane",   emoji: "🔮", icon: Sparkles,  color: "purple", desc: "Magie pure universelle. Polyvalente mais difficile à maîtriser." },
  { id: "none",    label: "Aucune",   emoji: "🚫", icon: Shield,    color: "stone",  desc: "Aucune affinité magique. Résistance naturelle aux sorts ennemis." },
];

const COLOR_CLASSES = {
  orange:  { text: "text-orange-600",  border: "border-orange-300",  bg: "bg-orange-50",  badge: "bg-orange-100 text-orange-800 border-orange-300"  },
  blue:    { text: "text-blue-600",    border: "border-blue-300",    bg: "bg-blue-50",    badge: "bg-blue-100 text-blue-800 border-blue-300"        },
  cyan:    { text: "text-cyan-600",    border: "border-cyan-300",    bg: "bg-cyan-50",    badge: "bg-cyan-100 text-cyan-800 border-cyan-300"        },
  yellow:  { text: "text-yellow-600",  border: "border-yellow-300",  bg: "bg-yellow-50",  badge: "bg-yellow-100 text-yellow-800 border-yellow-300"  },
  sky:     { text: "text-sky-600",     border: "border-sky-300",     bg: "bg-sky-50",     badge: "bg-sky-100 text-sky-800 border-sky-300"           },
  violet:  { text: "text-violet-600",  border: "border-violet-300",  bg: "bg-violet-50",  badge: "bg-violet-100 text-violet-800 border-violet-300"  },
  amber:   { text: "text-amber-600",   border: "border-amber-300",   bg: "bg-amber-50",   badge: "bg-amber-100 text-amber-800 border-amber-300"     },
  emerald: { text: "text-emerald-600", border: "border-emerald-300", bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-800 border-emerald-300"},
  purple:  { text: "text-purple-600",  border: "border-purple-300",  bg: "bg-purple-50",  badge: "bg-purple-100 text-purple-800 border-purple-300"  },
  stone:   { text: "text-stone-500",   border: "border-stone-300",   bg: "bg-stone-50",   badge: "bg-stone-100 text-stone-700 border-stone-300"     },
};

// ===== COMPOSANT PRINCIPAL =====
const CitizenPhysicsMagicView = ({ user, onUpdateUser }) => {
  const magStats = user?.magicStats || {};

  const [activeSection, setActiveSection] = useState("physique");
  const [selectedZone,  setSelectedZone]  = useState(null);
  const [hoveredZone,   setHoveredZone]   = useState(null);
  const [chosenAffinity,setChosenAffinity]= useState(null);
  const [confirmOpen,   setConfirmOpen]   = useState(false);

  // ── Données corporelles ──
  const injuries = user?.physicalStats?.injuries || {};
  const overallHealth = getOverallHealth(injuries);
  const selectedMeta  = BODY_ZONES.find((z) => z.id === selectedZone);
  const selectedState = selectedZone ? getInjuryState(injuries[selectedZone] || "sain") : null;

  // ── Données magiques ──
  const magic = {
    mana:      magStats.mana      ?? 50,
    manaMax:   magStats.manaMax   ?? 100,
    niveau:    magStats.niveau    ?? 1,
    affinite:  magStats.affinite  ?? null,
    sortConnu: magStats.sortConnu ?? null,
  };
  const affinityLocked   = !!magic.affinite;
  const currentAffinity  = MAGIC_AFFINITIES.find((a) => a.id === magic.affinite);
  const manaPct          = Math.min(100, Math.round((magic.mana / Math.max(magic.manaMax, 1)) * 100));
  const chosen           = MAGIC_AFFINITIES.find((a) => a.id === chosenAffinity);

  const injuredCount = BODY_ZONES.filter(
    (z) => injuries[z.id] && injuries[z.id] !== "sain"
  ).length;

  const handleConfirm = () => {
    if (!chosenAffinity || !onUpdateUser) return;
    onUpdateUser({ ...user, magicStats: { ...(user.magicStats || {}), affinite: chosenAffinity } });
    setConfirmOpen(false);
    setChosenAffinity(null);
  };

  return (
    <div className="bg-[#fdf6e3] text-stone-900 rounded-lg shadow-2xl border-t-8 border-stone-500 overflow-hidden">

      {/* ── EN-TÊTE ── */}
      <div className="px-6 md:px-8 py-5 border-b border-stone-200 flex items-center gap-4">
        <div className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center shadow-lg shrink-0">
          <Star size={22} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-stone-800 font-serif">
            Physique & Magie
          </h2>
          <p className="text-xs text-stone-500 italic mt-0.5">
            Attributs personnels de {user?.name || "le citoyen"}
          </p>
        </div>
      </div>

      {/* ── ONGLETS INTERNES ── */}
      <div className="flex border-b border-stone-200 bg-stone-50">
        {[
          { id: "physique", label: "Corps & Blessures", icon: HeartPulse },
          { id: "magie",    label: "Système Magique",   icon: Sparkles    },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              activeSection === id
                ? "border-stone-700 text-stone-900 bg-[#fdf6e3]"
                : "border-transparent text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="p-5 md:p-7 space-y-5">

        {/* ══════════════════════════════════
            SECTION PHYSIQUE — SCHÉMA CORPOREL
            ══════════════════════════════════ */}
        {activeSection === "physique" && (
          <>
            {/* Bandeau état de santé global */}
            <div className={`rounded-xl border-2 px-5 py-3 flex items-center gap-3 ${overallHealth.bg}`}>
              <HeartPulse size={18} className={overallHealth.color} />
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 block">
                  Condition générale
                </span>
                <span className={`text-sm font-black ${overallHealth.color}`}>
                  {overallHealth.label}
                </span>
              </div>
              {injuredCount > 0 && (
                <span className="ml-auto text-xs font-bold text-stone-500">
                  {injuredCount} zone{injuredCount > 1 ? "s" : ""} touchée{injuredCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Corps + Panneau détail */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

              {/* ── Schéma SVG ── */}
              <div className="flex flex-col items-center">
                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-3 flex items-center gap-1">
                  <Info size={10} /> Cliquez sur une zone
                </p>
                <div className="w-full max-w-[220px]">
                  <BodySVG
                    injuries={injuries}
                    selectedZone={selectedZone}
                    hoveredZone={hoveredZone}
                    onSelect={setSelectedZone}
                    onHover={setHoveredZone}
                  />
                </div>
              </div>

              {/* ── Panneau de détail ── */}
              <div className="space-y-4">

                {/* Zone sélectionnée */}
                {selectedMeta && selectedState ? (
                  <div className={`rounded-xl border-2 p-5 transition-all`}
                    style={{ borderColor: selectedState.stroke, backgroundColor: selectedState.fill + "cc" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: selectedState.stroke }}
                      />
                      <div>
                        <div className="text-base font-black text-stone-800 uppercase tracking-widest">
                          {selectedMeta.label}
                        </div>
                        <div
                          className="text-xs font-black uppercase tracking-widest mt-0.5"
                          style={{ color: selectedState.textColor }}
                        >
                          {selectedState.label}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 italic border-t border-stone-200 pt-3 mt-1">
                      {selectedMeta.desc}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-stone-300 p-5 text-center text-stone-400 text-sm italic">
                    Sélectionnez une zone du corps pour voir son état.
                  </div>
                )}

                {/* Liste de toutes les zones touchées */}
                {injuredCount > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
                      Zones blessées
                    </h4>
                    <div className="space-y-1.5">
                      {BODY_ZONES.filter(
                        (z) => injuries[z.id] && injuries[z.id] !== "sain"
                      ).map((z) => {
                        const st = getInjuryState(injuries[z.id]);
                        return (
                          <button
                            key={z.id}
                            onClick={() => setSelectedZone(z.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all hover:scale-[1.01] ${
                              selectedZone === z.id
                                ? "ring-2 ring-stone-700"
                                : "hover:shadow-sm"
                            }`}
                            style={{ borderColor: st.stroke, backgroundColor: st.fill }}
                          >
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: st.stroke }} />
                            <span className="text-xs font-bold text-stone-800">{z.label}</span>
                            <span className="ml-auto text-[10px] font-black uppercase tracking-widest" style={{ color: st.textColor }}>
                              {st.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {injuredCount === 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <div className="text-2xl mb-1">💪</div>
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                      Aucune blessure déclarée
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Légende */}
            <div className="pt-3 border-t border-stone-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Légende</p>
              <div className="flex flex-wrap gap-2">
                {INJURY_STATES.map((st) => (
                  <div key={st.id} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: st.fill, borderColor: st.stroke }} />
                    <span className="text-[10px] text-stone-500 font-bold">{st.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-[10px] text-stone-400 flex items-center gap-2">
              <Lock size={10} className="shrink-0" />
              Les blessures sont enregistrées par les administrateurs. Contactez un responsable pour toute mise à jour.
            </div>
          </>
        )}

        {/* ══════════════════════
            SECTION MAGIE
            ══════════════════════ */}
        {activeSection === "magie" && (
          <>
            {/* Mana + Niveau */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Mana */}
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} className="text-violet-600" />
                  <span className="text-xs font-black uppercase tracking-widest text-violet-700">Réserve de Mana</span>
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-3xl font-black text-violet-700">{magic.mana}</span>
                  <span className="text-stone-400 text-sm mb-1">/ {magic.manaMax}</span>
                </div>
                <div className="w-full h-3 bg-violet-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${manaPct}%` }} />
                </div>
                <p className="text-[10px] text-violet-400 italic mt-2">Énergie magique disponible pour lancer des sorts.</p>
              </div>

              {/* Niveau magique */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={16} className="text-amber-600" />
                  <span className="text-xs font-black uppercase tracking-widest text-amber-700">Niveau Magique</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl font-black text-amber-700">{magic.niveau}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(magic.niveau, 5) }).map((_, i) => (
                      <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                  {magic.niveau <= 1 ? "Apprenti" : magic.niveau <= 3 ? "Initié" : magic.niveau <= 5 ? "Mage" : magic.niveau <= 8 ? "Archimage" : "Légendaire"}
                </p>
                {magic.sortConnu && (
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 block mb-1">Sort maîtrisé</span>
                    <span className="text-sm font-bold text-amber-800">{magic.sortConnu}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Affinité */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
                <Sparkles size={13} /> Affinité Élémentaire
              </h3>

              {affinityLocked && currentAffinity ? (
                <div className={`rounded-xl border-2 p-5 ${COLOR_CLASSES[currentAffinity.color]?.border} ${COLOR_CLASSES[currentAffinity.color]?.bg}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{currentAffinity.emoji}</span>
                    <div>
                      <div className={`text-lg font-black uppercase tracking-widest ${COLOR_CLASSES[currentAffinity.color]?.text}`}>
                        {currentAffinity.label}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">
                        <Lock size={9} /> Affinité scellée
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-stone-600 italic">{currentAffinity.desc}</p>
                </div>
              ) : (
                <>
                  <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-xs text-stone-600 mb-4 flex items-start gap-2">
                    <Sparkles size={12} className="mt-0.5 shrink-0 text-stone-400" />
                    Vous n'avez pas encore éveillé votre affinité magique. Ce choix est <strong className="ml-1">définitif</strong> — réfléchissez bien.
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {MAGIC_AFFINITIES.map((aff) => {
                      const cls = COLOR_CLASSES[aff.color] || COLOR_CLASSES.stone;
                      const Icon = aff.icon;
                      return (
                        <button
                          key={aff.id}
                          onClick={() => { setChosenAffinity(aff.id); setConfirmOpen(true); }}
                          className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${cls.border} ${cls.bg} hover:shadow-lg hover:scale-105`}
                        >
                          <span className="text-2xl">{aff.emoji}</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${cls.text}`}>{aff.label}</span>
                          <ChevronRight size={9} className={`${cls.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-stone-900 text-stone-200 text-[10px] rounded-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none z-10 shadow-xl text-left leading-relaxed">
                            {aff.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── MODAL DE CONFIRMATION D'AFFINITÉ ── */}
      {confirmOpen && chosen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fdf6e3] rounded-2xl shadow-2xl border-t-8 border-stone-500 max-w-md w-full p-8 text-center">
            <div className="text-5xl mb-4">{chosen.emoji}</div>
            <h3 className="text-lg font-black uppercase tracking-widest text-stone-800 mb-2">
              Choisir : {chosen.label} ?
            </h3>
            <p className="text-sm text-stone-600 italic mb-6">{chosen.desc}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 mb-6 font-bold uppercase tracking-widest">
              Ce choix est définitif et ne pourra être annulé que par un administrateur.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmOpen(false); setChosenAffinity(null); }}
                className="flex-1 py-3 rounded-xl border-2 border-stone-300 text-stone-600 font-black uppercase tracking-widest text-xs hover:bg-stone-100 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-xl bg-stone-800 text-stone-100 font-black uppercase tracking-widest text-xs hover:bg-stone-700 transition-all shadow-lg"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenPhysicsMagicView;
