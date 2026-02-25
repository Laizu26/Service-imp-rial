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
  Activity,
  Heart,
  Eye,
  Swords,
  Star,
  Lock,
  ChevronRight,
} from "lucide-react";

// --- Définition des attributs physiques ---
const PHYSICAL_ATTRS = [
  { key: "force",       label: "Force",        icon: Swords,   color: "red",    desc: "Puissance physique brute, détermine les dommages au corps à corps." },
  { key: "agilite",     label: "Agilité",      icon: Wind,     color: "sky",    desc: "Vitesse et précision des mouvements, esquive et discrétion." },
  { key: "endurance",   label: "Endurance",    icon: Activity, color: "green",  desc: "Résistance à l'effort prolongé et aux blessures mineures." },
  { key: "constitution",label: "Constitution", icon: Heart,    color: "rose",   desc: "Solidité du corps, résistance aux maladies et aux poisons." },
  { key: "perception",  label: "Perception",   icon: Eye,      color: "amber",  desc: "Acuité des sens, détection des dangers et lecture de l'environnement." },
];

// --- Définition des affinités magiques ---
const MAGIC_AFFINITIES = [
  { id: "feu",       label: "Feu",       emoji: "🔥", icon: Flame,     color: "orange", desc: "Maîtrise des flammes et de la chaleur. Puissante en attaque, ravageuse en combat." },
  { id: "eau",       label: "Eau",       emoji: "💧", icon: Droplets,  color: "blue",   desc: "Contrôle de l'eau et des liquides. Soins, fluidité et protection." },
  { id: "vent",      label: "Vent",      emoji: "💨", icon: Wind,      color: "cyan",   desc: "Domination des courants d'air. Rapidité, invisibilité et tranchant invisible." },
  { id: "foudre",    label: "Foudre",    emoji: "⚡", icon: Zap,       color: "yellow", desc: "Canalisation de l'électricité. Paralysie, vitesse extrême et précision foudroyante." },
  { id: "glace",     label: "Glace",     emoji: "❄️", icon: Snowflake, color: "sky",    desc: "Emprise du froid et du gel. Ralentissement, piège et barrières cristallines." },
  { id: "ombre",     label: "Ombre",     emoji: "🌑", icon: Moon,      color: "violet", desc: "Manipulation des ténèbres. Illusions, dissimulation et magie noire." },
  { id: "lumiere",   label: "Lumière",   emoji: "✨", icon: Sun,       color: "amber",  desc: "Rayonnement de la lumière divine. Purification, révélation et guérison sacrée." },
  { id: "nature",    label: "Nature",    emoji: "🌿", icon: Leaf,      color: "emerald",desc: "Communion avec le monde vivant. Soins profonds, croissance et métamorphose." },
  { id: "arcane",    label: "Arcane",    emoji: "🔮", icon: Sparkles,  color: "purple", desc: "Magie pure et universelle. Polyvalente mais difficile à maîtriser." },
  { id: "none",      label: "Aucune",    emoji: "🚫", icon: Shield,    color: "stone",  desc: "Pas d'affinité magique. Résistance naturelle aux sorts ennemis." },
];

// --- Couleurs Tailwind par clé ---
const COLOR_CLASSES = {
  red:     { bar: "bg-red-500",     text: "text-red-600",     border: "border-red-300",     bg: "bg-red-50",     badge: "bg-red-100 text-red-800 border-red-300" },
  sky:     { bar: "bg-sky-500",     text: "text-sky-600",     border: "border-sky-300",     bg: "bg-sky-50",     badge: "bg-sky-100 text-sky-800 border-sky-300" },
  green:   { bar: "bg-green-500",   text: "text-green-600",   border: "border-green-300",   bg: "bg-green-50",   badge: "bg-green-100 text-green-800 border-green-300" },
  rose:    { bar: "bg-rose-500",    text: "text-rose-600",    border: "border-rose-300",    bg: "bg-rose-50",    badge: "bg-rose-100 text-rose-800 border-rose-300" },
  amber:   { bar: "bg-amber-500",   text: "text-amber-600",   border: "border-amber-300",   bg: "bg-amber-50",   badge: "bg-amber-100 text-amber-800 border-amber-300" },
  orange:  { bar: "bg-orange-500",  text: "text-orange-600",  border: "border-orange-300",  bg: "bg-orange-50",  badge: "bg-orange-100 text-orange-800 border-orange-300" },
  blue:    { bar: "bg-blue-500",    text: "text-blue-600",    border: "border-blue-300",    bg: "bg-blue-50",    badge: "bg-blue-100 text-blue-800 border-blue-300" },
  cyan:    { bar: "bg-cyan-500",    text: "text-cyan-600",    border: "border-cyan-300",    bg: "bg-cyan-50",    badge: "bg-cyan-100 text-cyan-800 border-cyan-300" },
  yellow:  { bar: "bg-yellow-400",  text: "text-yellow-600",  border: "border-yellow-300",  bg: "bg-yellow-50",  badge: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  violet:  { bar: "bg-violet-500",  text: "text-violet-600",  border: "border-violet-300",  bg: "bg-violet-50",  badge: "bg-violet-100 text-violet-800 border-violet-300" },
  emerald: { bar: "bg-emerald-500", text: "text-emerald-600", border: "border-emerald-300", bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  purple:  { bar: "bg-purple-500",  text: "text-purple-600",  border: "border-purple-300",  bg: "bg-purple-50",  badge: "bg-purple-100 text-purple-800 border-purple-300" },
  stone:   { bar: "bg-stone-400",   text: "text-stone-600",   border: "border-stone-300",   bg: "bg-stone-50",   badge: "bg-stone-100 text-stone-700 border-stone-300" },
};

// --- Qualificatifs selon valeur (1-10) ---
const getStatLabel = (val) => {
  if (val <= 2) return "Médiocre";
  if (val <= 4) return "Faible";
  if (val <= 6) return "Ordinaire";
  if (val <= 8) return "Notable";
  if (val <= 9) return "Remarquable";
  return "Légendaire";
};

// --- Barre de stat ---
const StatBar = ({ label, value, max = 10, icon: Icon, color, desc }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const cls = COLOR_CLASSES[color] || COLOR_CLASSES.stone;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon size={14} className={cls.text} />
          <span className="text-sm font-black uppercase tracking-widest text-stone-700">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${cls.badge}`}>
            {getStatLabel(value)}
          </span>
          <span className={`text-sm font-black ${cls.text}`}>{value}<span className="text-stone-400 text-xs font-normal">/{max}</span></span>
        </div>
      </div>
      <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${cls.bar} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-stone-400 italic mt-1 hidden group-hover:block transition-all">
        {desc}
      </p>
    </div>
  );
};

// === COMPOSANT PRINCIPAL ===
const CitizenPhysicsMagicView = ({ user, onUpdateUser }) => {
  const physStats = user?.physicalStats || {};
  const magStats  = user?.magicStats  || {};

  const [chosenAffinity, setChosenAffinity] = useState(null);
  const [confirmOpen, setConfirmOpen]       = useState(false);
  const [activeSection, setActiveSection]   = useState("physique");

  // Valeurs par défaut
  const stats = {
    force:        physStats.force        ?? 5,
    agilite:      physStats.agilite      ?? 5,
    endurance:    physStats.endurance    ?? 5,
    constitution: physStats.constitution ?? 5,
    perception:   physStats.perception   ?? 5,
  };

  const magic = {
    mana:      magStats.mana      ?? 50,
    manaMax:   magStats.manaMax   ?? 100,
    niveau:    magStats.niveau    ?? 1,
    affinite:  magStats.affinite  ?? null,
    sortConnu: magStats.sortConnu ?? null,
  };

  const affinityLocked = !!magic.affinite;
  const currentAffinity = MAGIC_AFFINITIES.find((a) => a.id === magic.affinite);
  const manaPct = Math.min(100, Math.round((magic.mana / Math.max(magic.manaMax, 1)) * 100));

  const handleChooseAffinity = (affId) => {
    if (affinityLocked) return;
    setChosenAffinity(affId);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!chosenAffinity || !onUpdateUser) return;
    onUpdateUser({
      ...user,
      magicStats: {
        ...(user.magicStats || {}),
        affinite: chosenAffinity,
      },
    });
    setConfirmOpen(false);
    setChosenAffinity(null);
  };

  const chosen = MAGIC_AFFINITIES.find((a) => a.id === chosenAffinity);

  return (
    <div className="bg-[#fdf6e3] text-stone-900 rounded-lg shadow-2xl border-t-8 border-stone-500 overflow-hidden">
      {/* En-tête */}
      <div className="px-6 md:px-8 py-6 border-b border-stone-200 flex items-center gap-4">
        <div className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center shadow-lg">
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

      {/* Onglets internes */}
      <div className="flex border-b border-stone-200 bg-stone-50">
        {[
          { id: "physique", label: "Attributs Physiques", icon: Shield },
          { id: "magie",    label: "Système Magique",     icon: Sparkles },
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

      <div className="p-6 md:p-8 space-y-6">

        {/* ===== SECTION PHYSIQUE ===== */}
        {activeSection === "physique" && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
              <Lock size={12} className="mt-0.5 shrink-0 text-amber-600" />
              <span>
                Les attributs physiques sont déterminés par votre naissance, vos entraînements et les décisions impériales.
                Ils ne peuvent être modifiés que par un administrateur.
              </span>
            </div>

            <div className="space-y-5">
              {PHYSICAL_ATTRS.map((attr) => (
                <StatBar
                  key={attr.key}
                  label={attr.label}
                  value={stats[attr.key]}
                  icon={attr.icon}
                  color={attr.color}
                  desc={attr.desc}
                />
              ))}
            </div>

            {/* Score global */}
            <div className="mt-6 pt-6 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-stone-500">
                  Score physique global
                </span>
                <div className="flex items-center gap-2">
                  {(() => {
                    const total = Object.values(stats).reduce((a, b) => a + b, 0);
                    const max   = PHYSICAL_ATTRS.length * 10;
                    const pct   = Math.round((total / max) * 100);
                    return (
                      <>
                        <div className="w-32 h-3 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-stone-700 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-black text-stone-700">
                          {total}<span className="text-stone-400 text-xs font-normal">/{max}</span>
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== SECTION MAGIE ===== */}
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
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all duration-700"
                    style={{ width: `${manaPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-violet-400 italic mt-2">
                  Énergie magique disponible pour lancer des sorts.
                </p>
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
                      <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-amber-400 italic">
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

            {/* Affinité actuelle ou choix */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
                <Sparkles size={13} /> Affinité Élémentaire
              </h3>

              {affinityLocked && currentAffinity ? (
                /* Affinité déjà choisie : affichage */
                <div className={`rounded-xl border-2 p-5 ${COLOR_CLASSES[currentAffinity.color]?.border} ${COLOR_CLASSES[currentAffinity.color]?.bg}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{currentAffinity.emoji}</span>
                    <div>
                      <div className={`text-lg font-black uppercase tracking-widest ${COLOR_CLASSES[currentAffinity.color]?.text}`}>
                        {currentAffinity.label}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">
                        <Lock size={10} /> Affinité scellée
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-stone-600 italic">{currentAffinity.desc}</p>
                </div>
              ) : (
                /* Choix de l'affinité */
                <>
                  <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-xs text-stone-600 mb-4 flex items-start gap-2">
                    <Sparkles size={12} className="mt-0.5 shrink-0 text-stone-400" />
                    <span>
                      Vous n'avez pas encore éveillé votre affinité magique. Ce choix est <strong>définitif</strong> — réfléchissez bien avant de vous engager.
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {MAGIC_AFFINITIES.map((aff) => {
                      const cls = COLOR_CLASSES[aff.color] || COLOR_CLASSES.stone;
                      const Icon = aff.icon;
                      return (
                        <button
                          key={aff.id}
                          onClick={() => handleChooseAffinity(aff.id)}
                          className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${cls.border} ${cls.bg} hover:shadow-lg hover:scale-105`}
                        >
                          <span className="text-2xl">{aff.emoji}</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${cls.text}`}>
                            {aff.label}
                          </span>
                          <ChevronRight size={10} className={`${cls.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-stone-900 text-stone-200 text-[10px] rounded-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-xl text-left leading-relaxed">
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

      {/* Modal de confirmation d'affinité */}
      {confirmOpen && chosen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fdf6e3] rounded-2xl shadow-2xl border-t-8 border-stone-500 max-w-md w-full p-8 text-center">
            <div className="text-5xl mb-4">{chosen.emoji}</div>
            <h3 className="text-lg font-black uppercase tracking-widest text-stone-800 mb-2">
              Choisir : {chosen.label} ?
            </h3>
            <p className="text-sm text-stone-600 italic mb-6">{chosen.desc}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 mb-6 font-bold uppercase tracking-widest">
              Attention : ce choix est définitif et ne pourra être annulé que par un administrateur.
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
