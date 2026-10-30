import React from "react";

const VARIANTS = {
  primary:   "bg-stone-800 text-white hover:bg-stone-700 border-transparent",
  secondary: "bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200",
  amber:     "bg-amber-700 text-white hover:bg-amber-600 border-transparent",
  danger:    "bg-red-700 text-white hover:bg-red-600 border-transparent",
  ghost:     "bg-white text-stone-600 hover:bg-stone-50 border-stone-200",
  success:   "bg-green-700 text-white hover:bg-green-600 border-transparent",
};

const SIZES = {
  xs: "px-2.5 py-1 text-[9px]",
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

const Button = ({
  children,
  variant = "primary",
  size = "sm",
  className = "",
  disabled,
  onClick,
  type = "button",
  icon: Icon,
}) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={`font-black uppercase tracking-wide rounded-lg border transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.sm} ${className}`}
  >
    {Icon && <Icon size={size === "xs" ? 10 : 12} />}
    {children}
  </button>
);

export default Button;
