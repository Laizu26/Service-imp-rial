import React from "react";

const COLORS = {
  default: "bg-stone-100 text-stone-600 border-stone-200",
  amber:   "bg-amber-100 text-amber-700 border-amber-200",
  green:   "bg-green-100 text-green-700 border-green-200",
  red:     "bg-red-100 text-red-700 border-red-200",
  blue:    "bg-blue-100 text-blue-700 border-blue-200",
  purple:  "bg-purple-100 text-purple-700 border-purple-200",
  dark:    "bg-stone-800 text-white border-stone-700",
};

const Badge = ({ children, color = "default", className = "" }) => (
  <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${COLORS[color] || COLORS.default} ${className}`}>
    {children}
  </span>
);

export default Badge;
