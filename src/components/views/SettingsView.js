import React, { useState } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Type,
  Minimize2,
  Zap,
  RotateCcw,
  Palette,
  Check,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Layout,
  PanelLeftClose,
  Volume2,
  VolumeX,
  Shield,
  User,
  Clock,
  Info,
} from "lucide-react";

/* ── Palettes ── */
const PALETTE_META = [
  { id: "sand",    label: "Parchemin", bg: "#e6e2d6", active: "#e6dcc3", accent: "#c9b99a" },
  { id: "marble",  label: "Marbre",    bg: "#ebebeb", active: "#d8d8d8", accent: "#b0b0b0" },
  { id: "slate",   label: "Ardoise",   bg: "#dce3ed", active: "#c4d4e8", accent: "#7a9cbf" },
  { id: "forest",  label: "Forêt",     bg: "#d6e4d6", active: "#bfd4bf", accent: "#6a9e6a" },
  { id: "crimson", label: "Pourpre",   bg: "#eddada", active: "#dfc4c4", accent: "#c07070" },
];

/* ── Section wrapper ── */
const Section = ({ icon: Icon, title, description, children, isDark }) => (
  <div className="rounded-xl border overflow-hidden" style={{ borderColor: isDark ? "#44403c" : "#e7e5e4", backgroundColor: isDark ? "#1c191780" : "#ffffff" }}>
    <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: isDark ? "#44403c" : "#f5f5f4" }}>
      <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? "#44403c" : "#f5f5f4" }}>
        <Icon size={14} style={{ color: "#eab308" }} />
      </div>
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest">{title}</h3>
        {description && <p className="text-[9px] opacity-40 mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="p-5 space-y-5">{children}</div>
  </div>
);

/* ── Toggle réutilisable ── */
const Toggle = ({ icon: Icon, label, description, checked, onChange, isDark }) => (
  <div className="flex items-center justify-between p-3 rounded-xl border transition-colors" style={{
    borderColor: checked ? "#eab308" : isDark ? "#44403c" : "#e7e5e4",
    backgroundColor: checked ? (isDark ? "#eab30810" : "#fefce8") : (isDark ? "#1c1917" : "#fafaf9"),
  }}>
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <Icon size={14} style={{ color: checked ? "#eab308" : undefined, opacity: checked ? 1 : 0.4 }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold">{label}</span>
          <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full" style={{
            backgroundColor: checked ? "#eab308" : isDark ? "#44403c" : "#e7e5e4",
            color: checked ? "#1c1917" : isDark ? "#78716c" : "#a8a29e",
          }}>{checked ? "Actif" : "Inactif"}</span>
        </div>
        {description && <div className="text-[10px] opacity-50 mt-0.5">{description}</div>}
      </div>
    </div>
    <button onClick={() => onChange(!checked)} className="relative w-11 h-6 rounded-full flex-shrink-0 ml-3" style={{
      backgroundColor: checked ? "#eab308" : isDark ? "#44403c" : "#d6d3d1",
      transition: "background-color 150ms",
    }}>
      <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md" style={{
        transform: checked ? "translateX(22px)" : "translateX(2px)",
        transition: "transform 150ms",
      }} />
    </button>
  </div>
);

/* ── Sélecteur à N boutons ── */
const ButtonSelect = ({ options, value, onChange, isDark }) => (
  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
    {options.map(({ id, label, icon: Icon, preview }) => (
      <button key={id} onClick={() => onChange(id)}
        className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-wide"
        style={{
          borderColor: value === id ? "#eab308" : isDark ? "#44403c" : "#e7e5e4",
          backgroundColor: value === id ? "#eab30815" : "transparent",
        }}>
        {Icon && <Icon size={18} style={{ color: value === id ? "#eab308" : "inherit" }} />}
        {preview && preview}
        {label}
      </button>
    ))}
  </div>
);

/* ══════════════════════════════════════════ */
/* ══  COMPOSANT PRINCIPAL                 ══ */
/* ══════════════════════════════════════════ */

const SettingsView = ({ settings, isDark, updateSetting, resetSettings, user }) => {
  const [activeSection, setActiveSection] = useState("apparence");
  const border = isDark ? "#44403c" : "#e7e5e4";
  const selected = settings.colorTheme || "sand";

  const notifPrefs = settings.notifPrefs || {
    messages: true,
    emploi: true,
    unions: true,
    esclaves: true,
    finances: true,
    gazette: true,
    sound: false,
  };

  const updateNotifPref = (key, value) => {
    updateSetting("notifPrefs", { ...notifPrefs, [key]: value });
  };

  const sections = [
    { id: "apparence", label: "Apparence", icon: Palette },
    { id: "interface", label: "Interface", icon: Layout },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "compte", label: "Compte", icon: User },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6" style={{ color: isDark ? "#e7e5e4" : "#1c1917" }}>
      {/* EN-TÊTE */}
      <div>
        <h2 className="text-lg font-black uppercase tracking-widest" style={{ color: isDark ? "#e7e5e4" : "#1c1917" }}>
          Paramètres
        </h2>
        <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: isDark ? "#78716c" : "#a8a29e" }}>
          Personnalisation de l'interface impériale
        </p>
      </div>

      {/* ONGLETS */}
      <div className="flex gap-2 flex-wrap">
        {sections.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveSection(id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all"
            style={{
              borderColor: activeSection === id ? "#eab308" : border,
              backgroundColor: activeSection === id ? "#eab30815" : "transparent",
              color: activeSection === id ? "#eab308" : isDark ? "#a8a29e" : "#78716c",
            }}>
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* ═══ APPARENCE ═══ */}
      {activeSection === "apparence" && (
        <div className="space-y-5">
          <Section icon={Sun} title="Mode d'affichage" description="Choisir entre clair, sombre ou automatique" isDark={isDark}>
            <ButtonSelect
              value={settings.theme}
              onChange={(v) => updateSetting("theme", v)}
              isDark={isDark}
              options={[
                { id: "light", label: "Clair", icon: Sun },
                { id: "dark", label: "Sombre", icon: Moon },
                { id: "auto", label: "Auto", icon: Monitor },
              ]}
            />
          </Section>

          <Section icon={Palette} title="Palette de couleurs" description="Teinte générale de l'interface" isDark={isDark}>
            <div className="grid grid-cols-5 gap-2">
              {PALETTE_META.map(({ id, label, bg, active, accent }) => {
                const isActive = selected === id;
                return (
                  <button key={id} onClick={() => updateSetting("colorTheme", id)} title={label}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: isActive ? "#eab308" : border,
                      backgroundColor: isActive ? "#eab30815" : "transparent",
                    }}>
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-md" style={{ backgroundColor: bg }}>
                      <div className="absolute left-0 top-0 bottom-0 w-2.5" style={{ backgroundColor: "#1c1917", opacity: 0.85 }} />
                      <div className="absolute left-2.5 bottom-0 right-0 h-2.5" style={{ backgroundColor: active, opacity: 0.9 }} />
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Check size={16} className="text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wide" style={{ opacity: isActive ? 1 : 0.5 }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Aperçu */}
            <div className="p-3 rounded-xl border mt-2" style={{ borderColor: border, backgroundColor: isDark ? "#1c191720" : "#00000008" }}>
              <div className="flex items-center gap-2 opacity-60 mb-2">
                <Eye size={10} />
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  Aperçu — {PALETTE_META.find((p) => p.id === selected)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-14 rounded-lg flex flex-col items-center justify-center gap-1" style={{ backgroundColor: "#1c1917" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-6 h-1 rounded-full" style={{
                      backgroundColor: i === 1 ? PALETTE_META.find((p) => p.id === selected)?.active : "#44403c",
                      opacity: i === 1 ? 1 : 0.5,
                    }} />
                  ))}
                </div>
                <div className="flex-1 h-14 rounded-lg p-2 flex flex-col justify-center gap-1.5" style={{
                  backgroundColor: isDark ? "#1c1917" : PALETTE_META.find((p) => p.id === selected)?.bg,
                }}>
                  <div className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: isDark ? "#44403c" : "#d6d3d1" }} />
                  <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: isDark ? "#44403c" : "#e7e5e4" }} />
                  <div className="h-1 w-2/3 rounded-full" style={{ backgroundColor: isDark ? "#44403c" : "#e7e5e4" }} />
                </div>
              </div>
            </div>
          </Section>

          <Section icon={Type} title="Taille du texte" description="Ajuster la taille de la police" isDark={isDark}>
            <ButtonSelect
              value={settings.fontSize}
              onChange={(v) => updateSetting("fontSize", v)}
              isDark={isDark}
              options={[
                { id: "small", label: "Petit", preview: <span style={{ fontSize: "11px" }}>Aa</span> },
                { id: "normal", label: "Normal", preview: <span style={{ fontSize: "14px" }}>Aa</span> },
                { id: "large", label: "Grand", preview: <span style={{ fontSize: "17px" }}>Aa</span> },
              ]}
            />
          </Section>
        </div>
      )}

      {/* ═══ INTERFACE ═══ */}
      {activeSection === "interface" && (
        <div className="space-y-5">
          <Section icon={Layout} title="Disposition" description="Options d'affichage de l'interface" isDark={isDark}>
            <Toggle
              icon={Minimize2}
              label="Mode compact"
              description="Réduit les espacements pour afficher plus de contenu"
              checked={settings.compact}
              onChange={(v) => updateSetting("compact", v)}
              isDark={isDark}
            />
            <Toggle
              icon={PanelLeftClose}
              label="Barre latérale réduite"
              description="Réduit la barre de navigation latérale"
              checked={settings.sidebarCollapsed}
              onChange={(v) => updateSetting("sidebarCollapsed", v)}
              isDark={isDark}
            />
          </Section>

          <Section icon={Zap} title="Performances" description="Animations et effets visuels" isDark={isDark}>
            <Toggle
              icon={Zap}
              label="Animations"
              description="Active les transitions et effets visuels"
              checked={settings.animations}
              onChange={(v) => updateSetting("animations", v)}
              isDark={isDark}
            />
          </Section>
        </div>
      )}

      {/* ═══ NOTIFICATIONS ═══ */}
      {activeSection === "notifications" && (
        <div className="space-y-5">
          <Section icon={Bell} title="Catégories de notifications" description="Choisir quelles notifications recevoir" isDark={isDark}>
            <Toggle icon={Bell} label="Messages" description="Courrier reçu via la Poste Impériale"
              checked={notifPrefs.messages} onChange={(v) => updateNotifPref("messages", v)} isDark={isDark} />
            <Toggle icon={Bell} label="Emploi" description="Offres d'embauche et propositions"
              checked={notifPrefs.emploi} onChange={(v) => updateNotifPref("emploi", v)} isDark={isDark} />
            <Toggle icon={Bell} label="Liens & Unions" description="Propositions de mariage"
              checked={notifPrefs.unions} onChange={(v) => updateNotifPref("unions", v)} isDark={isDark} />
            <Toggle icon={Bell} label="Main d'Oeuvre" description="Alertes d'activité suspecte d'esclaves"
              checked={notifPrefs.esclaves} onChange={(v) => updateNotifPref("esclaves", v)} isDark={isDark} />
            <Toggle icon={Bell} label="Finances" description="Dettes et contrats financiers"
              checked={notifPrefs.finances} onChange={(v) => updateNotifPref("finances", v)} isDark={isDark} />
            <Toggle icon={Bell} label="Gazette" description="Nouvelles publications officielles"
              checked={notifPrefs.gazette} onChange={(v) => updateNotifPref("gazette", v)} isDark={isDark} />
          </Section>

          <Section icon={Volume2} title="Sons" description="Alertes sonores" isDark={isDark}>
            <Toggle
              icon={notifPrefs.sound ? Volume2 : VolumeX}
              label="Son de notification"
              description="Jouer un son lors de la réception d'une notification"
              checked={notifPrefs.sound}
              onChange={(v) => updateNotifPref("sound", v)}
              isDark={isDark}
            />
          </Section>
        </div>
      )}

      {/* ═══ COMPTE ═══ */}
      {activeSection === "compte" && (
        <div className="space-y-5">
          <Section icon={User} title="Informations du compte" description="Détails de votre session" isDark={isDark}>
            <div className="space-y-3">
              {[
                { label: "Nom", value: user?.name || "Inconnu", icon: User },
                { label: "Matricule", value: user?.id || "—", icon: Shield },
                { label: "Rôle", value: user?.role || "CITOYEN", icon: Shield },
                { label: "Statut", value: user?.status || "Actif", icon: Info },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-xl" style={{
                  backgroundColor: isDark ? "#1c1917" : "#fafaf9",
                  borderColor: border,
                }}>
                  <div className="flex items-center gap-2.5">
                    <Icon size={12} style={{ opacity: 0.4 }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ opacity: 0.5 }}>{label}</span>
                  </div>
                  <span className="text-xs font-bold font-mono">{value}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={Clock} title="Session" description="Informations de stockage" isDark={isDark}>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: isDark ? "#1c1917" : "#fafaf9" }}>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ opacity: 0.5 }}>Paramètres sauvegardés</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{
                  backgroundColor: isDark ? "#44403c" : "#e7e5e4",
                }}>localStorage</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: isDark ? "#1c1917" : "#fafaf9" }}>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ opacity: 0.5 }}>Notifications lues</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{
                  backgroundColor: isDark ? "#44403c" : "#e7e5e4",
                }}>localStorage</span>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ═══ RÉINITIALISER ═══ */}
      <div className="pt-2">
        <button onClick={resetSettings}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors border"
          style={{
            borderColor: border,
            backgroundColor: isDark ? "#44403c" : "#f5f5f4",
            color: isDark ? "#a8a29e" : "#78716c",
          }}>
          <RotateCcw size={14} /> Réinitialiser tous les paramètres
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
