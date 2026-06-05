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
  },
  marble: {
    "--bg-app": "#ebebeb",
    "--bg-header": "#f7f7f5",
    "--bg-header-trans": "rgba(247,247,245,0.95)",
    "--sidebar-active": "#d8d8d8",
  },
  slate: {
    "--bg-app": "#dce3ed",
    "--bg-header": "#eef3fa",
    "--bg-header-trans": "rgba(238,243,250,0.95)",
    "--sidebar-active": "#c4d4e8",
  },
  forest: {
    "--bg-app": "#d6e4d6",
    "--bg-header": "#edf5ed",
    "--bg-header-trans": "rgba(237,245,237,0.95)",
    "--sidebar-active": "#bfd4bf",
  },
  crimson: {
    "--bg-app": "#eddada",
    "--bg-header": "#faf0ef",
    "--bg-header-trans": "rgba(250,240,239,0.95)",
    "--sidebar-active": "#dfc4c4",
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

  // Resolve effective theme (auto = system preference)
  const resolvedTheme = (() => {
    if (settings.theme === "auto") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return settings.theme;
  })();

  // Apply dark/light, color palette, font size, compact, animations to document
  useEffect(() => {
    const root = document.documentElement;

    // Dark / light mode class
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Color palette — set CSS variables inline on <html>
    const themeKey = settings.colorTheme || "sand";
    const themeVars = COLOR_THEMES[themeKey] || COLOR_THEMES.sand;
    // Remove all theme vars first to avoid stale values
    Object.keys(COLOR_THEMES.sand).forEach((k) =>
      root.style.removeProperty(k)
    );
    // Apply selected theme vars
    Object.entries(themeVars).forEach(([k, v]) =>
      root.style.setProperty(k, v)
    );
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

  // Listen for system theme changes when auto
  useEffect(() => {
    if (settings.theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSettings((s) => ({ ...s })); // force re-render
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme]);

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
