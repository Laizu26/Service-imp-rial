import React, { useState } from "react";
import { Sparkles, Star, HeartPulse, Info, Lock, AlertTriangle, Link2 } from "lucide-react";
import { hashCode, getEffectiveMagicHue, getActiveDrunkTiers, HANGOVER_INFO } from "../../lib/gameUtils";

// ===== CONDITIONS LIÉES À LA BAGUE (source cachée) =====
const BAGUE_CONDITIONS = [
  {
    id: "malade",
    label: "Maladie chronique inexpliquée",
    desc: "État maladif persistant dont l'origine demeure indéterminée. Aucune cause organique identifiée à ce stade.",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: "🤒",
  },
  {
    id: "incontinent",
    label: "Troubles vésicaux chroniques",
    desc: "Incontinence persistante sans étiologie claire. Les examens pratiqués n'ont révélé aucune lésion physique apparente.",
    badge: "bg-orange-100 text-orange-800 border-orange-300",
    icon: "💧",
  },
  {
    id: "impuissant",
    label: "Défaillance organique intime",
    desc: "Dysfonction d'origine inconnue. Les traitements conventionnels se sont révélés sans effet.",
    badge: "bg-red-100 text-red-800 border-red-300",
    icon: "⚠️",
  },
  {
    id: "fatigue",
    label: "Fatigue chronique sévère",
    desc: "Épuisement profond et persistant résistant au repos. Origine indéterminée.",
    badge: "bg-stone-100 text-stone-700 border-stone-300",
    icon: "😔",
  },
  {
    id: "douleurs",
    label: "Douleurs diffuses inexpliquées",
    desc: "Douleurs corporelles sans traumatisme apparent, fluctuantes et sans localisation précise.",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
    icon: "🔴",
  },
];

// ===== ÉTATS DU PERSONNAGE (physique + magique) =====
const STATUS_EFFECTS = {
  physique: [
    { id: "fatigue_legere",  label: "Fatigué(e)",            icon: "😴", badge: "bg-stone-100 text-stone-700 border-stone-300" },
    { id: "emeche",          label: "Éméché(e)",             icon: "🍷", badge: "bg-rose-100 text-rose-700 border-rose-300" },
    { id: "alcoolise",       label: "Alcoolisé(e)",          icon: "🍺", badge: "bg-amber-100 text-amber-800 border-amber-300" },
    { id: "ovulation",       label: "En ovulation",          icon: "🌸", badge: "bg-pink-100 text-pink-700 border-pink-300" },
    { id: "enceinte",        label: "Enceinte",              icon: "🤰", badge: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300" },
    { id: "enrhume",         label: "Enrhumé(e)",            icon: "🤧", badge: "bg-blue-100 text-blue-700 border-blue-300" },
    { id: "fievre",          label: "Fièvre",                icon: "🌡️", badge: "bg-orange-100 text-orange-800 border-orange-300" },
    { id: "empoisonne",      label: "Empoisonné(e)",         icon: "☠️", badge: "bg-green-100 text-green-800 border-green-300" },
    { id: "sous_drogue",     label: "Sous substance",        icon: "💊", badge: "bg-violet-100 text-violet-800 border-violet-300" },
    { id: "affaibli",        label: "Affaibli(e)",           icon: "😓", badge: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    { id: "en_rut",          label: "En rut / en chaleur",   icon: "🔥", badge: "bg-red-100 text-red-700 border-red-300" },
    { id: "blessure_cachee", label: "Blessure interne",      icon: "🩸", badge: "bg-red-100 text-red-800 border-red-300" },
    { id: "paralysie",       label: "Paralysé(e)",           icon: "🧊", badge: "bg-cyan-100 text-cyan-800 border-cyan-300" },
  ],
  magique: [
    { id: "sous_charme",     label: "Sous charme",           icon: "✨", badge: "bg-pink-100 text-pink-700 border-pink-300" },
    { id: "envoute",         label: "Envoûté(e)",            icon: "🔮", badge: "bg-purple-100 text-purple-800 border-purple-300" },
    { id: "malediction",     label: "Sous malédiction",      icon: "💀", badge: "bg-slate-100 text-slate-800 border-slate-300" },
    { id: "beni",            label: "Béni(e)",               icon: "⭐", badge: "bg-amber-100 text-amber-700 border-amber-300" },
    { id: "transformation",  label: "En transformation",     icon: "🐺", badge: "bg-orange-100 text-orange-800 border-orange-300" },
    { id: "possede",         label: "Possédé(e)",            icon: "👻", badge: "bg-indigo-100 text-indigo-800 border-indigo-300" },
    { id: "lien_magique",    label: "Lié(e) magiquement",    icon: "🔗", badge: "bg-teal-100 text-teal-800 border-teal-300" },
    { id: "surcharge_mana",  label: "Surcharge de mana",     icon: "⚡", badge: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    { id: "manque_mana",     label: "Manque de mana",        icon: "🌑", badge: "bg-gray-100 text-gray-700 border-gray-300" },
    { id: "vision_magique",  label: "Vision altérée (magie)",icon: "👁️", badge: "bg-violet-100 text-violet-700 border-violet-300" },
  ],
};

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
  { id: "main_g",       label: "Main gauche",       desc: "Métacarpe, phalanges" },
  { id: "main_d",       label: "Main droite",       desc: "Métacarpe, phalanges" },
  { id: "cuisse_g",     label: "Cuisse gauche",     desc: "Fémur, quadriceps, ischio-jambiers" },
  { id: "cuisse_d",     label: "Cuisse droite",     desc: "Fémur, quadriceps, ischio-jambiers" },
  { id: "jambe_g",      label: "Jambe gauche",      desc: "Tibia, péroné, genou, mollet" },
  { id: "jambe_d",      label: "Jambe droite",      desc: "Tibia, péroné, genou, mollet" },
  { id: "pied_g",       label: "Pied gauche",       desc: "Cheville, métatarse, orteils" },
  { id: "pied_d",       label: "Pied droit",        desc: "Cheville, métatarse, orteils" },
];

// ===== ÉTATS DE BLESSURE =====
const INJURY_STATES = [
  { id: "sain",            label: "Sain",          fill: "#e8e4dc", stroke: "#a8a29e", textColor: "#44403c", dot: "bg-stone-400",   badge: "bg-stone-100 text-stone-700 border-stone-300"    },
  { id: "contusion",       label: "Contusion",     fill: "#fef9c3", stroke: "#b45309", textColor: "#78350f", dot: "bg-amber-400",   badge: "bg-amber-100 text-amber-800 border-amber-300"    },
  { id: "blessure_legere", label: "Blessé léger",  fill: "#fed7aa", stroke: "#c2410c", textColor: "#9a3412", dot: "bg-orange-500",  badge: "bg-orange-100 text-orange-700 border-orange-300" },
  { id: "blessure_grave",  label: "Blessé grave",  fill: "#fecaca", stroke: "#b91c1c", textColor: "#991b1b", dot: "bg-red-500",     badge: "bg-red-100 text-red-700 border-red-300"          },
  { id: "fracture",        label: "Fracture",      fill: "#ede9fe", stroke: "#6d28d9", textColor: "#5b21b6", dot: "bg-violet-500",  badge: "bg-violet-100 text-violet-700 border-violet-300" },
  { id: "critique",        label: "État critique", fill: "#1e293b", stroke: "#94a3b8", textColor: "#f1f5f9", dot: "bg-slate-700",   badge: "bg-slate-800 text-slate-200 border-slate-600"    },
];

const getInjuryState = (id) => INJURY_STATES.find((s) => s.id === id) || INJURY_STATES[0];

const getOverallHealth = (injuries) => {
  const vals = Object.values(injuries || {}).filter(Boolean);
  if (vals.includes("critique"))        return { label: "État critique",       color: "text-slate-700",   bg: "bg-slate-100 border-slate-400"    };
  if (vals.includes("fracture"))        return { label: "Gravement blessé",    color: "text-violet-700",  bg: "bg-violet-50 border-violet-300"   };
  if (vals.includes("blessure_grave"))  return { label: "Sérieusement blessé", color: "text-red-700",     bg: "bg-red-50 border-red-300"         };
  if (vals.includes("blessure_legere")) return { label: "Légèrement blessé",   color: "text-orange-700",  bg: "bg-orange-50 border-orange-300"   };
  if (vals.includes("contusion"))       return { label: "Quelques contusions", color: "text-amber-700",   bg: "bg-amber-50 border-amber-300"     };
  return                                       { label: "En pleine forme",     color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-300" };
};

// ===== SCHÉMA CORPOREL SVG — COURBES DE BÉZIER =====
const BodySVG = ({ injuries, selectedZone, hoveredZone, onSelect, onHover }) => {
  const p = (id) => {
    const st  = getInjuryState(injuries[id] || "sain");
    const sel = selectedZone === id;
    const hov = hoveredZone === id;
    return {
      fill:        st.fill,
      stroke:      sel ? "#0f172a" : st.stroke,
      strokeWidth: sel ? "2.5" : hov ? "2" : "1.2",
      opacity:     sel || hov ? "1" : "0.92",
      style:       { cursor: "pointer", transition: "all 0.15s ease" },
      onClick:     () => onSelect(selectedZone === id ? null : id),
      onMouseEnter:() => onHover(id),
      onMouseLeave:() => onHover(null),
      filter:      sel ? "url(#sel)" : "none",
    };
  };

  return (
    <svg viewBox="0 0 200 496" className="w-full h-full" style={{ maxHeight: 480 }}>
      <defs>
        <filter id="sel" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* ── TÊTE ── */}
      <ellipse cx="100" cy="34" rx="20" ry="25" {...p("tete")} />

      {/* ── COU ── */}
      <path d="M 91 57 L 109 57 L 112 72 L 88 72 Z" {...p("cou")} />

      {/* ── TORSE : épaules à taille, attache directement au bord des épaules ── */}
      <path
        d="M 56 74
           C 50 96 51 120 56 142
           C 59 154 64 163 72 168
           L 128 168
           C 136 163 141 154 144 142
           C 149 120 150 96 144 74
           C 132 68 118 66 100 66
           C 82 66 68 68 56 74
           Z"
        {...p("torse")}
      />

      {/* ── ABDOMEN ── */}
      <path
        d="M 72 168 L 128 168
           C 132 178 134 190 134 200
           C 134 208 132 214 128 218
           L 72 218
           C 68 214 66 208 66 200
           C 66 190 68 178 72 168
           Z"
        {...p("abdomen")}
      />

      {/* ── BASSIN ── */}
      <path
        d="M 66 218 L 134 218
           C 140 226 146 234 147 243
           C 148 252 144 259 136 264
           L 108 264
           C 105 260 103 258 100 258
           C 97 258 95 260 92 264
           L 64 264
           C 56 259 52 252 53 243
           C 54 234 60 226 66 218
           Z"
        {...p("bassin")}
      />

      {/* ── BRAS GAUCHE : attache à l'épaule (bord du torse), pas au centre du buste ── */}
      <path
        d="M 32 78
           C 27 98 25 120 25 142
           C 25 156 27 168 32 176
           C 35 181 41 183 46 181
           C 51 179 53 173 53 165
           C 53 144 52 116 53 92
           C 54 84 54 80 56 76
           C 48 74 40 75 32 78
           Z"
        {...p("bras_g")}
      />

      {/* ── BRAS DROIT (miroir) ── */}
      <path
        d="M 168 78
           C 173 98 175 120 175 142
           C 175 156 173 168 168 176
           C 165 181 159 183 154 181
           C 149 179 147 173 147 165
           C 147 144 148 116 147 92
           C 146 84 146 80 144 76
           C 152 74 160 75 168 78
           Z"
        {...p("bras_d")}
      />

      {/* ── AVANT-BRAS GAUCHE ── */}
      <path
        d="M 28 178
           C 24 196 22 216 23 236
           C 23 248 26 258 32 263
           C 37 267 44 266 48 261
           C 52 256 53 248 52 238
           C 51 220 50 200 50 182
           C 44 184 34 183 28 178
           Z"
        {...p("avant_bras_g")}
      />

      {/* ── AVANT-BRAS DROIT (miroir) ── */}
      <path
        d="M 172 178
           C 176 196 178 216 177 236
           C 177 248 174 258 168 263
           C 163 267 156 266 152 261
           C 148 256 147 248 148 238
           C 149 220 150 200 150 182
           C 156 184 166 183 172 178
           Z"
        {...p("avant_bras_d")}
      />

      {/* ── MAIN GAUCHE ── */}
      <ellipse cx="38" cy="274" rx="11" ry="15" {...p("main_g")} />

      {/* ── MAIN DROITE ── */}
      <ellipse cx="162" cy="274" rx="11" ry="15" {...p("main_d")} />

      {/* ── CUISSE GAUCHE ── */}
      <path
        d="M 64 264
           C 58 284 55 306 56 326
           C 57 340 61 350 70 354
           C 78 358 87 355 92 348
           C 96 342 97 332 97 320
           C 97 300 97 280 98 264
           Z"
        {...p("cuisse_g")}
      />

      {/* ── CUISSE DROITE (miroir) ── */}
      <path
        d="M 136 264
           C 142 284 145 306 144 326
           C 143 340 139 350 130 354
           C 122 358 113 355 108 348
           C 104 342 103 332 103 320
           C 103 300 103 280 102 264
           Z"
        {...p("cuisse_d")}
      />

      {/* ── JAMBE GAUCHE ── */}
      <path
        d="M 57 352
           C 52 372 50 394 51 414
           C 52 428 56 438 64 442
           C 71 445 79 443 84 437
           C 88 431 89 421 88 408
           C 87 388 87 368 90 351
           C 83 356 74 358 66 355
           C 63 354 60 353 57 352
           Z"
        {...p("jambe_g")}
      />

      {/* ── JAMBE DROITE (miroir) ── */}
      <path
        d="M 143 352
           C 148 372 150 394 149 414
           C 148 428 144 438 136 442
           C 129 445 121 443 116 437
           C 112 431 111 421 112 408
           C 113 388 113 368 110 351
           C 117 356 126 358 134 355
           C 137 354 140 353 143 352
           Z"
        {...p("jambe_d")}
      />

      {/* ── PIED GAUCHE ── */}
      <ellipse cx="66" cy="450" rx="21" ry="9" {...p("pied_g")} />

      {/* ── PIED DROIT ── */}
      <ellipse cx="134" cy="450" rx="21" ry="9" {...p("pied_d")} />
    </svg>
  );
};

// ===== COULEUR D'AURA — déterministe par utilisateur =====
// La teinte (hue) est la seule composante affectée par un pacte arcanique (voir
// bondMagicTraces dans gameUtils.js) : saturation et luminosité restent propres à chaque
// citoyen, ce qui garde les auras des conjoints reconnaissables l'une de l'autre même
// rapprochées — "similaires sans être exactement pareilles".
const getUserAura = (user) => {
  const seed  = String(user?.id ?? user?.name ?? "default");
  const hash  = hashCode(seed);
  const hue   = getEffectiveMagicHue(user);
  const sat   = 60 + (hash % 25);          // 60–85 %
  const light = 44 + ((hash >> 4) % 14);   // 44–58 %
  return {
    color:      `hsl(${hue}, ${sat}%, ${light}%)`,
    colorLight: `hsl(${hue}, ${sat}%, ${light + 28}%)`,
    colorDark:  `hsl(${hue}, ${sat}%, ${light - 12}%)`,
    colorGlow:  `hsl(${hue}, ${sat}%, ${light + 20}%)`,
  };
};

// ===== COMPOSANT PRINCIPAL =====
const CitizenPhysicsMagicView = ({ user, gameDate }) => {
  const [activeSection, setActiveSection] = useState("physique");
  const [selectedZone,  setSelectedZone]  = useState(null);
  const [hoveredZone,   setHoveredZone]   = useState(null);

  const injuries      = user?.physicalStats?.injuries || {};
  const overallHealth = getOverallHealth(injuries);
  const selectedMeta  = BODY_ZONES.find((z) => z.id === selectedZone);
  const selectedState = selectedZone ? getInjuryState(injuries[selectedZone] || "sain") : null;
  const injuredCount  = BODY_ZONES.filter((z) => injuries[z.id] && injuries[z.id] !== "sain").length;

  // Ivresse du jour (consommations d'alcool en auberge) — purement informationnel, remis à zéro
  // dès que la date RP change (voir addDrunkenness, gameUtils.js).
  const gd = gameDate || { day: 1, month: 1, year: 1200 };
  const todayKey = `${gd.day}/${gd.month}/${gd.year}`;
  const drunkPercent = user?.drunkenness?.day === todayKey ? (user.drunkenness.percent || 0) : 0;
  const activeDrunkTiers = getActiveDrunkTiers(drunkPercent);
  const hasHangover = user?.hangover?.day === todayKey;

  const activeStatusIds   = user?.statusEffects || [];
  const activePhysical    = STATUS_EFFECTS.physique.filter((e) => activeStatusIds.includes(e.id));
  const activeMagical     = STATUS_EFFECTS.magique.filter((e) => activeStatusIds.includes(e.id));

  // Restrictions bague (source volontairement masquée)
  const bagueRestrictions = user?.bagueRestrictions || [];
  const magieCoupee = bagueRestrictions.includes("magie_coupee");
  const activeConditions = BAGUE_CONDITIONS.filter((c) => bagueRestrictions.includes(c.id));

  const aura = getUserAura(user);

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
          { id: "magie",    label: "Système Magique",   icon: Sparkles   },
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

        {/* ══════════════════════════════
            SECTION PHYSIQUE
            ══════════════════════════════ */}
        {activeSection === "physique" && (
          <>
            {/* Maladie en cours (système de maladies aléatoires, configuré par les GM) */}
            {user?.illness && (
              <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50 px-5 py-3 flex items-start gap-3">
                <span className="text-xl shrink-0">{user.illness.icon || "🤒"}</span>
                <div className="flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-yellow-700 block">
                    Malade — {user.illness.name || user.illness.severityLabel || "Maladie"}
                  </span>
                  {user.illness.description && (
                    <p className="text-xs text-yellow-800 italic mt-0.5">{user.illness.description}</p>
                  )}
                  <span className="text-xs text-yellow-800 block mt-0.5">
                    {Math.max(0, (user.illness.durationDays || 0) - (user.illness.daysElapsed || 0))} jour
                    {Math.max(0, (user.illness.durationDays || 0) - (user.illness.daysElapsed || 0)) > 1 ? "s" : ""} avant guérison estimée
                  </span>
                </div>
              </div>
            )}

            {/* Ivresse du jour (consommations d'alcool en auberge) — purement informationnel :
                le jeu ne roleplay jamais à la place du joueur, il affiche juste le taux et les
                indications de jeu de rôle correspondantes, à incarner soi-même. */}
            {drunkPercent > 0 && (
              <div className="rounded-xl border-2 border-purple-300 bg-purple-50 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">🍺</span>
                  <div className="flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 block">
                      Ivresse — {drunkPercent}% {drunkPercent >= 100 ? "(bourré(e))" : ""}
                    </span>
                    <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, drunkPercent)}%` }} />
                    </div>
                  </div>
                </div>
                {activeDrunkTiers.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {activeDrunkTiers.map((t) => (
                      <li key={t.threshold} className="text-xs text-purple-800 italic flex items-start gap-1.5">
                        <span className="shrink-0">•</span> {t.desc}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Gueule de bois (voir onPassDay, useGameActions.js) — purement informationnel :
                indication RP pour la journée, à incarner soi-même. */}
            {hasHangover && (
              <div className="rounded-xl border-2 border-stone-300 bg-stone-100 px-5 py-3 flex items-start gap-3">
                <span className="text-xl shrink-0">🤕</span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-600 block">
                    {HANGOVER_INFO.label}
                  </span>
                  <p className="text-xs text-stone-600 italic mt-0.5">{HANGOVER_INFO.desc}</p>
                </div>
              </div>
            )}

            {/* Bandeau santé globale */}
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
                <span className="ml-auto text-xs font-bold text-stone-400">
                  {injuredCount} zone{injuredCount > 1 ? "s" : ""} touchée{injuredCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Corps + panneau détail */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

              {/* Schéma corporel */}
              <div className="flex flex-col items-center">
                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-1">
                  <Info size={10} /> Cliquez sur une zone
                </p>
                <div className="w-full max-w-[200px]">
                  <BodySVG
                    injuries={injuries}
                    selectedZone={selectedZone}
                    hoveredZone={hoveredZone}
                    onSelect={setSelectedZone}
                    onHover={setHoveredZone}
                  />
                </div>
              </div>

              {/* Panneau détail */}
              <div className="space-y-4">

                {selectedMeta && selectedState ? (
                  <div
                    className="rounded-xl border-2 p-5 transition-all"
                    style={{ borderColor: selectedState.stroke, backgroundColor: selectedState.fill + "cc" }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedState.stroke }} />
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
                    <p className="text-xs text-stone-500 italic border-t border-stone-200 pt-3">
                      {selectedMeta.desc}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-stone-300 p-6 text-center text-stone-400 text-sm italic">
                    Sélectionnez une zone du corps pour voir son état de santé.
                  </div>
                )}

                {/* Zones blessées */}
                {injuredCount > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
                      Zones blessées
                    </h4>
                    <div className="space-y-1.5">
                      {BODY_ZONES.filter((z) => injuries[z.id] && injuries[z.id] !== "sain").map((z) => {
                        const st = getInjuryState(injuries[z.id]);
                        return (
                          <button
                            key={z.id}
                            onClick={() => setSelectedZone(z.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all hover:scale-[1.01] ${
                              selectedZone === z.id ? "ring-2 ring-stone-700" : "hover:shadow-sm"
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

                {injuredCount === 0 && activeConditions.length === 0 && (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-center">
                    <div className="text-2xl mb-1">💪</div>
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                      Aucune blessure déclarée
                    </p>
                  </div>
                )}

                {/* Affections chroniques (source masquée) */}
                {activeConditions.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-1">
                      <AlertTriangle size={10} /> Affections chroniques
                    </h4>
                    <div className="space-y-2">
                      {activeConditions.map((cond) => (
                        <div
                          key={cond.id}
                          className={`rounded-lg border px-3 py-2.5 text-left ${cond.badge}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span>{cond.icon}</span>
                            <span className="text-xs font-black uppercase tracking-widest">{cond.label}</span>
                          </div>
                          <p className="text-[10px] italic opacity-80">{cond.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* États physiques actifs */}
            {activePhysical.length > 0 && (
              <div className="pt-3 border-t border-stone-200">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-1">
                  <span>💪</span> États physiques
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activePhysical.map((eff) => (
                    <span key={eff.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${eff.badge}`}>
                      <span>{eff.icon}</span>
                      {eff.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Légende */}
            <div className="pt-3 border-t border-stone-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Légende</p>
              <div className="flex flex-wrap gap-3">
                {INJURY_STATES.map((st) => (
                  <div key={st.id} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: st.fill, borderColor: st.stroke }} />
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
          <div className="flex flex-col items-center justify-center py-16 gap-8">
            {/* Orbe lumineux — éteint si flux bloqué */}
            <div className="relative flex items-center justify-center">
              {/* Halo extérieur flou */}
              <div
                className="absolute rounded-full blur-2xl"
                style={{
                  width: 200, height: 200,
                  background: magieCoupee ? "#374151" : aura.colorGlow,
                  opacity: magieCoupee ? 0.2 : 0.35,
                }}
              />
              {/* Anneau intermédiaire */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 164, height: 164,
                  background: magieCoupee
                    ? "radial-gradient(circle, #1f293722 0%, #11182718 60%, transparent 100%)"
                    : `radial-gradient(circle, ${aura.colorLight}22 0%, ${aura.color}18 60%, transparent 100%)`,
                  border: magieCoupee ? "1.5px solid #37415140" : `1.5px solid ${aura.color}40`,
                }}
              />
              {/* Cercle principal */}
              <div
                className="relative rounded-full shadow-2xl"
                style={{
                  width: 128, height: 128,
                  background: magieCoupee
                    ? "radial-gradient(circle at 38% 35%, #4b5563, #1f2937 55%, #111827)"
                    : `radial-gradient(circle at 38% 35%, ${aura.colorLight}, ${aura.color} 55%, ${aura.colorDark})`,
                  boxShadow: magieCoupee
                    ? "0 0 12px 2px #1f293760, 0 4px 24px 0 #11182760"
                    : `0 0 32px 6px ${aura.color}70, 0 4px 24px 0 ${aura.colorDark}60`,
                }}
              >
                {magieCoupee && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock size={28} className="text-slate-500 opacity-70" />
                  </div>
                )}
              </div>
            </div>

            {/* Légende */}
            <div className="text-center space-y-1">
              {magieCoupee ? (
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Flux Magique Perturbé
                  </p>
                  <p className="text-[10px] text-slate-500 italic">
                    Le flux magique de {user?.name || "ce citoyen"} semble bloqué ou supprimé. Cause indéterminée.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                    Aura Magique
                  </p>
                  <p className="text-[10px] text-stone-400 italic">
                    Signature unique et permanente de {user?.name || "ce citoyen"}
                  </p>
                  {(user?.magicBond?.linkedSpouses || []).length > 0 && (
                    <p className="text-[10px] text-purple-500 italic flex items-center justify-center gap-1 mt-1">
                      <Link2 size={10} />
                      Liée par pacte arcanique à {user.magicBond.linkedSpouses.map((s) => s.name).join(", ")}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* États magiques actifs */}
            {activeMagical.length > 0 && (
              <div className="w-full max-w-sm px-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2 text-center flex items-center justify-center gap-1">
                  <Sparkles size={10} /> États magiques
                </h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {activeMagical.map((eff) => (
                    <span key={eff.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${eff.badge}`}>
                      <span>{eff.icon}</span>
                      {eff.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenPhysicsMagicView;
