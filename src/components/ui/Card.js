import React from "react";

const Card = ({ title, icon: Icon, children, className = "" }) => (
  <div
    className={`bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden ${className}`}
  >
    {title && (
      <div className="p-3 border-b bg-stone-50 flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 flex items-center gap-2 font-sans">
          {Icon && <Icon size={14} />} {title}
        </h3>
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

export default Card;
