import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "service_imperial_ui_settings";

const DEFAULT_SETTINGS = {
  theme: "light", // "light" | "dark" | "auto"
  fontSize: "normal", // "small" | "normal" | "large"
  compact: false,
  animations: true,
  sidebarCollapsed: false,
};

export const useSettings = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
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

  // Apply theme class + font size + compact to document
  useEffect(() => {
    const root = document.documentElement;

    // Theme
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Font size
    root.classList.remove("text-sm", "text-base", "text-lg");
    if (settings.fontSize === "small") root.classList.add("text-sm");
    else if (settings.fontSize === "large") root.classList.add("text-lg");
    else root.classList.add("text-base");

    // Compact
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
  }, [resolvedTheme, settings.fontSize, settings.compact, settings.animations]);

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
