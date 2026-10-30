import React from "react";

const TabBar = ({ tabs = [], active, onChange, size = "md", className = "" }) => {
  const base = size === "sm" ? "px-3 py-2 text-[9px]" : "px-4 py-2.5 text-[10px]";
  return (
    <div className={`flex border-b border-stone-200 overflow-x-auto scrollbar-none ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`${base} font-black uppercase tracking-wide whitespace-nowrap flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-stone-800 text-stone-900"
                : "border-transparent text-stone-400 hover:text-stone-600 hover:border-stone-300"
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
            {tab.badge > 0 && (
              <span className="bg-red-500 text-white text-[8px] font-black rounded-full px-1.5 min-w-[16px] text-center">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;
