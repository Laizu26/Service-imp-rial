import React from "react";
import { X, Sun, Moon, Monitor, Type, Minimize2, Zap, RotateCcw } from "lucide-react";

const SettingsPanel = ({ settings, isDark, updateSetting, resetSettings, onClose }) => {
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
          style={{ borderColor: isDark ? "#44403c" : "#e7e5e4" }}
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
        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* === THEME === */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-3">
              Thème
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
                      settings.theme === id
                        ? "#eab308"
                        : isDark
                          ? "#44403c"
                          : "#e7e5e4",
                    backgroundColor:
                      settings.theme === id
                        ? isDark
                          ? "#eab30815"
                          : "#eab30815"
                        : "transparent",
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

          {/* === TAILLE POLICE === */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-3">
              <Type size={12} className="inline mr-1" />
              Taille du texte
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "small", label: "Petit", size: "13px" },
                { id: "normal", label: "Normal", size: "16px" },
                { id: "large", label: "Grand", size: "18px" },
              ].map(({ id, label, size }) => (
                <button
                  key={id}
                  onClick={() => updateSetting("fontSize", id)}
                  className="p-3 rounded-xl border-2 transition-all font-bold uppercase tracking-wide text-center"
                  style={{
                    fontSize: size,
                    borderColor:
                      settings.fontSize === id
                        ? "#eab308"
                        : isDark
                          ? "#44403c"
                          : "#e7e5e4",
                    backgroundColor:
                      settings.fontSize === id
                        ? isDark
                          ? "#eab30815"
                          : "#eab30815"
                        : "transparent",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* === TOGGLES === */}
          <div className="space-y-3">
            {/* Compact Mode */}
            <ToggleOption
              icon={Minimize2}
              label="Mode compact"
              description="Réduit les espacements pour plus de contenu"
              checked={settings.compact}
              onChange={(v) => updateSetting("compact", v)}
              isDark={isDark}
            />

            {/* Animations */}
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
            style={{ borderColor: isDark ? "#44403c" : "#e7e5e4" }}
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

const ToggleOption = ({ icon: Icon, label, description, checked, onChange, isDark }) => (
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
        backgroundColor: checked ? "#eab308" : isDark ? "#44403c" : "#d6d3d1",
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
