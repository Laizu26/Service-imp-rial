import React from "react";

const SIZES = {
  xs: "w-6 h-6 text-[9px]",
  sm: "w-8 h-8 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-16 h-16 text-base",
};

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase() || "?";

/**
 * Avatar rond avec fallback initiales.
 *   <Avatar name="Marc" src={url} size="md" />
 */
const Avatar = ({
  name = "",
  src,
  size = "md",
  ring,
  className = "",
  onClick,
}) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`
        inline-flex items-center justify-center rounded-full
        bg-imperial-100 text-imperial-800 font-black uppercase
        overflow-hidden shrink-0
        ${SIZES[size] || SIZES.md}
        ${ring ? `ring-2 ${ring}` : ""}
        ${onClick ? "cursor-pointer focus-ring" : ""}
        ${className}
      `}
      aria-label={name}
    >
      {src ? (
        // eslint-disable-next-line jsx-a11y/img-redundant-alt
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials(name)
      )}
    </Tag>
  );
};

export default Avatar;
