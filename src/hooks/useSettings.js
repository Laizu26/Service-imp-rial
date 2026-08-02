import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "service_imperial_ui_settings";

const DEFAULT_SETTINGS = {
  theme: "light",       // "light" | "dark" | "auto"
  colorTheme: "sand",   // "sand" | "marble" | "slate" | "forest" | "crimson"
  fontSize: "normal",   // "small" | "normal" | "large"
  compact: false,
  animations: true,
  sidebarCollapsed: false,
  hiddenTabs: [],       // IDs des onglets masqués par le citoyen
};

// Palettes de couleurs — CSS variables appliquées sur <html>
const COLOR_THEMES = {
  sand: {
    "--bg-app": "#e6e2d6",
    "--bg-header": "#fdf6e3",
    "--bg-header-trans": "rgba(253,246,227,0.95)",
    "--sidebar-active": "#e6dcc3",
    "--bg-surface": "#f5f0dc",
  },
  marble: {
    "--bg-app": "#ebebeb",
    "--bg-header": "#f7f7f5",
    "--bg-header-trans": "rgba(247,247,245,0.95)",
    "--sidebar-active": "#d8d8d8",
    "--bg-surface": "#f0f0ee",
  },
  slate: {
    "--bg-app": "#dce3ed",
    "--bg-header": "#eef3fa",
    "--bg-header-trans": "rgba(238,243,250,0.95)",
    "--sidebar-active": "#c4d4e8",
    "--bg-surface": "#e6ecf5",
  },
  forest: {
    "--bg-app": "#d6e4d6",
    "--bg-header": "#edf5ed",
    "--bg-header-trans": "rgba(237,245,237,0.95)",
    "--sidebar-active": "#bfd4bf",
    "--bg-surface": "#e2eee2",
  },
  crimson: {
    "--bg-app": "#eddada",
    "--bg-header": "#faf0ef",
    "--bg-header-trans": "rgba(250,240,239,0.95)",
    "--sidebar-active": "#dfc4c4",
    "--bg-surface": "#f5e6e5",
  },
};

export const useSettings = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
        : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // silent fail
    }
  }, [settings]);

  // Préférence système (pour le mode "auto") — suivie comme un vrai état pour que
  // le changement de thème de l'OS re-rende proprement, sans écriture parasite
  // dans localStorage ni re-render forcé.
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
  );

  const resolvedTheme =
    settings.theme === "auto" ? (systemDark ? "dark" : "light") : settings.theme;

  // Apply dark/light, color palette, font size, compact, animations to document
  useEffect(() => {
    const root = document.documentElement;

    // Dark / light mode class
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Color palette — CSS variables inline sur <html>, UNIQUEMENT en mode clair.
    // Un style inline gagne toujours sur la feuille `.dark { --bg-app: … }` :
    // les appliquer en mode sombre forçait les fonds beiges de la palette claire
    // par-dessus le thème nuit (bug historique du mode sombre).
    const themeKey = settings.colorTheme || "sand";
    const themeVars = COLOR_THEMES[themeKey] || COLOR_THEMES.sand;
    // Remove all theme vars first to avoid stale values
    Object.keys(COLOR_THEMES.sand).forEach((k) =>
      root.style.removeProperty(k)
    );
    if (resolvedTheme !== "dark") {
      Object.entries(themeVars).forEach(([k, v]) =>
        root.style.setProperty(k, v)
      );
    }
    // data-theme attribute for potential CSS selectors
    root.setAttribute("data-theme", themeKey);

    // Font size
    root.classList.remove("text-sm", "text-base", "text-lg");
    if (settings.fontSize === "small") root.classList.add("text-sm");
    else if (settings.fontSize === "large") root.classList.add("text-lg");
    else root.classList.add("text-base");

    // Compact mode
    if (settings.compact) {
      root.classList.add("compact-mode");
    } else {
      root.classList.remove("compact-mode");
    }

    // Animations
    if (!settings.animations) {
      root.classList.add("no-animations");
    } else {
      root.classList.remove("no-animations");
    }
  }, [
    resolvedTheme,
    settings.colorTheme,
    settings.fontSize,
    settings.compact,
    settings.animations,
  ]);

  // Suivre les changements de préférence système (toujours actif : peu coûteux,
  // et évite un état obsolète si l'utilisateur passe en "auto" plus tard)
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    resolvedTheme,
    isDark: resolvedTheme === "dark",
    updateSetting,
    resetSettings,
  };
};
