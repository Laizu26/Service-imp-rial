import React from "react";

const VARIANTS = {
  default: "text-ink-soft hover:bg-surface-hover hover:text-ink",
  danger: "text-red-500 hover:bg-red-50 hover:text-red-700",
  primary: "text-imperial-700 hover:bg-imperial-50",
  ghost: "text-ink-mute hover:text-ink",
};

const SIZES = {
  sm: { btn: "p-1", icon: 12 },
  md: { btn: "p-1.5", icon: 14 },
  lg: { btn: "p-2", icon: 18 },
};

/**
 * Bouton icône-only. `aria-label` est REQUIS.
 *   <IconButton icon={X} aria-label="Fermer" variant="danger" onClick={...} />
 */
const IconButton = React.forwardRef(function IconButton(
  {
    icon: Icon,
    "aria-label": ariaLabel,
    variant = "default",
    size = "md",
    className = "",
    disabled = false,
    ...rest
  },
  ref
) {
  if (!ariaLabel && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn("IconButton: aria-label is required");
  }
  const s = SIZES[size] || SIZES.md;
  return (
    <button
      ref={ref}
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center rounded-lg
        transition-all focus-ring
        disabled:opacity-40 disabled:cursor-not-allowed
        ${VARIANTS[variant] || VARIANTS.default}
        ${s.btn}
        ${className}
      `}
      {...rest}
    >
      <Icon size={s.icon} />
    </button>
  );
});

export default IconButton;
