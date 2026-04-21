import React from "react";

/**
 * Tuile statistique uniforme.
 *   <StatTile icon={Coins} label="Solde" value="1 200" sub="…" accent="bg-yellow-50 text-yellow-600" />
 */
const StatTile = ({
  icon: Icon,
  label,
  value,
  sub,
  accent = "bg-imperial-50 text-imperial-700",
  onClick,
  className = "",
}) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`
        bg-surface rounded-tile border border-hairline p-4
        flex items-center gap-4 shadow-card text-left w-full
        ${onClick ? "hover:shadow-elev transition-shadow focus-ring" : ""}
        ${className}
      `}
    >
      {Icon && (
        <div className={`p-3 rounded-lg shrink-0 ${accent}`}>
          <Icon size={20} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-eyebrow truncate">{label}</div>
        <div className="text-xl font-black text-numeric text-ink truncate">
          {value}
        </div>
        {sub && (
          <div className="text-[10px] text-ink-mute mt-0.5 truncate">{sub}</div>
        )}
      </div>
    </Tag>
  );
};

export default StatTile;
