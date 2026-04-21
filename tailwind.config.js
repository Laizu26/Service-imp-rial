/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        app: "var(--bg-app)",
        surface: "var(--bg-card)",
        "surface-2": "var(--bg-card-alt)",
        "surface-hover": "var(--bg-hover)",
        sidebar: "var(--bg-sidebar)",
        "sidebar-active": "var(--sidebar-active)",
        header: "var(--bg-header)",
        ink: "var(--text-primary)",
        "ink-soft": "var(--text-secondary)",
        "ink-mute": "var(--text-muted)",
        "ink-sidebar": "var(--text-sidebar)",
        hairline: "var(--border-light)",
        outline: "var(--border-main)",
        imperial: {
          50: "#fdf6e3",
          100: "#f5ecc8",
          200: "#ebd99a",
          300: "#e0c26a",
          400: "#d4a847",
          500: "#c28a2a",
          600: "#a76e1f",
          700: "#85541b",
          800: "#5f3c15",
          900: "#3a2510",
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "Cambria", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px var(--shadow-color)",
        elev: "0 4px 12px var(--shadow-color)",
        imperial:
          "0 0 0 1px rgba(180,140,60,0.25), 0 8px 24px rgba(0,0,0,0.12)",
        "focus-ring": "0 0 0 3px rgba(194,138,42,0.35)",
      },
      borderRadius: {
        tile: "0.875rem",
      },
      ringColor: {
        imperial: "#c28a2a",
      },
    },
  },
  plugins: [],
};
