import React from "react";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-imperial-700 text-white hover:bg-imperial-800 border border-imperial-800 shadow-card",
  secondary:
    "bg-surface text-ink border border-outline hover:bg-surface-hover shadow-card",
  ghost:
    "bg-transparent text-ink-soft hover:bg-surface-hover border border-transparent",
  danger:
    "bg-red-600 text-white hover:bg-red-700 border border-red-700 shadow-card",
  subtle:
    "bg-imperial-50 text-imperial-800 border border-imperial-200 hover:bg-imperial-100",
  link:
    "bg-transparent text-imperial-700 hover:text-imperial-900 underline-offset-2 hover:underline border border-transparent",
};

const SIZES = {
  sm: "px-2.5 py-1 text-[10px] gap-1.5",
  md: "px-4 py-2 text-xs gap-2",
  lg: "px-5 py-3 text-sm gap-2",
};

const ICON_SIZES = { sm: 12, md: 14, lg: 16 };

/**
 * Bouton unique.
 *   <Button variant="primary" size="md" icon={Send} loading onClick={...}>Envoyer</Button>
 */
const Button = React.forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    icon: Icon,
    iconPosition = "left",
    loading = false,
    disabled = false,
    fullWidth = false,
    type = "button",
    className = "",
    children,
    ...rest
  },
  ref
) {
  const iconSize = ICON_SIZES[size] || 14;
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center rounded-lg
        font-bold uppercase tracking-widest
        transition-all focus-ring
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${VARIANTS[variant] || VARIANTS.primary}
        ${SIZES[size] || SIZES.md}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : (
        Icon && iconPosition === "left" && <Icon size={iconSize} />
      )}
      {children}
      {!loading && Icon && iconPosition === "right" && <Icon size={iconSize} />}
    </button>
  );
});

export default Button;
