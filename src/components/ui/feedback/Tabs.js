import React from "react";

/**
 * Onglets unifiés. `tabs` : [{ id, label, icon, badge }]
 *   <Tabs tabs={tabs} active={active} onChange={setActive} variant="pills" />
 *
 * Variants:
 *   - "pills": onglets arrondis, fond pilule actif (style BankView/Inventaire)
 *   - "underline": entête avec soulignage (style plus discret)
 */
const Tabs = ({
  tabs = [],
  active,
  onChange,
  variant = "pills",
  className = "",
}) => {
  if (variant === "underline") {
    return (
      <div
        className={`flex gap-1 border-b border-hairline overflow-x-auto ${className}`}
      >
        {tabs.map((t) => {
          const isActive = t.id === active;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange && onChange(t.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-xs uppercase font-bold tracking-wider
                border-b-2 -mb-px transition-colors whitespace-nowrap focus-ring
                ${
                  isActive
                    ? "border-imperial-600 text-imperial-700"
                    : "border-transparent text-ink-mute hover:text-ink"
                }
              `}
            >
              {Icon && <Icon size={14} />}
              {t.label}
              {t.badge > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-mono">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {tabs.map((t) => {
        const isActive = t.id === active;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange && onChange(t.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg
              text-[10px] font-black uppercase tracking-widest transition-all focus-ring
              ${
                isActive
                  ? "bg-stone-900 text-imperial-400 shadow-card"
                  : "bg-surface-2 text-ink-mute hover:bg-surface-hover hover:text-ink"
              }
            `}
          >
            {Icon && <Icon size={14} />}
            {t.label}
            {t.badge > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse font-mono">
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
