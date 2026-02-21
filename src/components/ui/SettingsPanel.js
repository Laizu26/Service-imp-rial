import React from "react";
import {
  X,
  Sun,
  Moon,
  Monitor,
  Type,
  Minimize2,
  Zap,
  RotateCcw,
  Palette,
  Check,
} from "lucide-react";

// Métadonnées visuelles des palettes (pour l'aperçu dans le panel)
const PALETTE_META = [
  {
    id: "sand",
    label: "Parchemin",
    bg: "#e6e2d6",
    active: "#e6dcc3",
    accent: "#c9b99a",
  },
  {
    id: "marble",
    label: "Marbre",
    bg: "#ebebeb",
    active: "#d8d8d8",
    accent: "#b0b0b0",
  },
  {
    id: "slate",
    label: "Ardoise",
    bg: "#dce3ed",
    active: "#c4d4e8",
    accent: "#7a9cbf",
  },
  {
    id: "forest",
    label: "Forêt",
    bg: "#d6e4d6",
    active: "#bfd4bf",
    accent: "#6a9e6a",
  },
  {
    id: "crimson",
    label: "Pourpre",
    bg: "#eddada",
    active: "#dfc4c4",
    accent: "#c07070",
  },
];

const SettingsPanel = ({
  settings,
  isDark,
  updateSetting,
  resetSettings,
  onClose,
}) => {
  const border = isDark ? "#44403c" : "#e7e5e4";
  const selected = settings.colorTheme || "sand";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: isDark ? "#292524" : "#ffffff",
          color: isDark ? "#e7e5e4" : "#1c1917",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: border }}
        >
          <h2 className="text-lg font-black uppercase tracking-widest">
            Paramètres
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:opacity-70 transition-opacity"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* === THÈME CLAIR/SOMBRE === */}
          <div>
            <label
              className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-3"
            >
              Mode d'affichage
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "light", label: "Clair", icon: Sun },
                { id: "dark", label: "Sombre", icon: Moon },
                { id: "auto", label: "Auto", icon: Monitor },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => updateSetting("theme", id)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-wide"
                  style={{
                    borderColor:
                      settings.theme === id ? "#eab308" : border,
                    backgroundColor:
                      settings.theme === id ? "#eab30815" : "transparent",
                  }}
                >
                  <Icon
                    size={20}
                    style={{
                      color: settings.theme === id ? "#eab308" : "inherit",
                    }}
                  />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* === PALETTE DE COULEURS === */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-3 flex items-center gap-1.5">
              <Palette size={11} />
              Palette de couleurs
            </label>

            <div className="grid grid-cols-5 gap-2">
              {PALETTE_META.map(({ id, label, bg, active, accent }) => {
                const isActive = selected === id;
                return (
                  <button
                    key={id}
                    onClick={() => updateSetting("colorTheme", id)}
                    title={label}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all group"
                    style={{
                      borderColor: isActive ? "#eab308" : border,
                      backgroundColor: isActive
                        ? "#eab30815"
                        : "transparent",
                    }}
                  >
                    {/* Aperçu de la palette */}
                    <div
                      className="relative w-9 h-9 rounded-lg overflow-hidden shadow-md"
                      style={{ backgroundColor: bg }}
                    >
                      {/* Bande sidebar */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2"
                        style={{
                          backgroundColor: isDark ? "#1c1917" : "#1c1917",
                          opacity: 0.85,
                        }}
                      />
                      {/* Bande active */}
                      <div
                        className="absolute left-2 bottom-0 right-0 h-2"
                        style={{ backgroundColor: active, opacity: 0.9 }}
                      />
                      {/* Accent dot */}
                      <div
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: accent }}
                      />
                      {/* Checkmark si sélectionné */}
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                          <Check size={14} className="text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                    <span
                      className="text-[8px] font-bold uppercase tracking-wide text-center leading-tight w-full"
                      style={{ opacity: isActive ? 1 : 0.5 }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Aperçu en direct */}
            <div
              className="mt-3 p-3 rounded-xl border text-[10px]"
              style={{
                borderColor: border,
                backgroundColor: isDark ? "#1c191720" : "#00000008",
              }}
            >
              <div className="flex items-center gap-2 opacity-60 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                <span className="font-bold uppercase tracking-widest text-[9px]">
                  Aperçu — {PALETTE_META.find((p) => p.id === selected)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Mini sidebar */}
                <div
                  className="w-8 h-12 rounded-lg flex flex-col items-center justify-center gap-1"
                  style={{ backgroundColor: "#1c1917" }}
                >
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-5 h-1 rounded-full"
                      style={{
                        backgroundColor:
                          i === 1
                            ? PALETTE_META.find((p) => p.id === selected)
                                ?.active
                            : "#44403c",
                        opacity: i === 1 ? 1 : 0.5,
                      }}
                    />
                  ))}
                </div>
                {/* Mini content */}
                <div
                  className="flex-1 h-12 rounded-lg p-2 flex flex-col justify-center gap-1"
                  style={{
                    backgroundColor: isDark
                      ? "#1c1917"
                      : PALETTE_META.find((p) => p.id === selected)?.bg,
                  }}
                >
                  <div
                    className="h-1.5 w-3/4 rounded-full"
                    style={{ backgroundColor: isDark ? "#44403c" : "#d6d3d1" }}
                  />
                  <div
                    className="h-1 w-1/2 rounded-full"
                    style={{ backgroundColor: isDark ? "#44403c" : "#e7e5e4" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* === TAILLE POLICE === */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-3 flex items-center gap-1.5">
              <Type size={11} />
              Taille du texte
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "small", label: "Petit", size: "12px" },
                { id: "normal", label: "Normal", size: "14px" },
                { id: "large", label: "Grand", size: "16px" },
              ].map(({ id, label, size }) => (
                <button
                  key={id}
                  onClick={() => updateSetting("fontSize", id)}
                  className="p-3 rounded-xl border-2 transition-all font-bold uppercase tracking-wide text-center"
                  style={{
                    fontSize: size,
                    borderColor:
                      settings.fontSize === id ? "#eab308" : border,
                    backgroundColor:
                      settings.fontSize === id ? "#eab30815" : "transparent",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* === TOGGLES === */}
          <div className="space-y-3">
            <ToggleOption
              icon={Minimize2}
              label="Mode compact"
              description="Réduit les espacements pour plus de contenu"
              checked={settings.compact}
              onChange={(v) => updateSetting("compact", v)}
              isDark={isDark}
            />
            <ToggleOption
              icon={Zap}
              label="Animations"
              description="Active les transitions et animations"
              checked={settings.animations}
              onChange={(v) => updateSetting("animations", v)}
              isDark={isDark}
            />
          </div>

          {/* === RESET === */}
          <div
            className="pt-4 border-t"
            style={{ borderColor: border }}
          >
            <button
              onClick={resetSettings}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
              style={{
                backgroundColor: isDark ? "#44403c" : "#f5f5f4",
                color: isDark ? "#a8a29e" : "#78716c",
              }}
            >
              <RotateCcw size={14} /> Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleOption = ({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  isDark,
}) => (
  <div
    className="flex items-center justify-between p-3 rounded-xl border"
    style={{
      borderColor: isDark ? "#44403c" : "#e7e5e4",
      backgroundColor: isDark ? "#1c1917" : "#fafaf9",
    }}
  >
    <div className="flex items-center gap-3">
      <Icon size={16} className="opacity-50" />
      <div>
        <div className="text-xs font-bold">{label}</div>
        <div className="text-[10px] opacity-50">{description}</div>
      </div>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
      style={{
        backgroundColor: checked
          ? "#eab308"
          : isDark
          ? "#44403c"
          : "#d6d3d1",
      }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform"
        style={{
          transform: checked ? "translateX(22px)" : "translateX(2px)",
        }}
      />
    </button>
  </div>
);

export default SettingsPanel;
