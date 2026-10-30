import React from "react";

const Card = ({ title, icon: Icon, children, className = "", actions, noPadding = false }) => (
  <div className={`bg-white rounded-xl border border-stone-200 shadow-sm ${className}`}>
    {title && (
      <div className="bg-stone-800 text-white rounded-t-xl px-4 py-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
          {Icon && <Icon size={14} />}
          {title}
        </h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={noPadding ? "" : "p-4"}>{children}</div>
  </div>
);

export default Card;
