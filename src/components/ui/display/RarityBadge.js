import React from "react";
import { RARITY_COLORS } from "../tokens";

/**
 * Badge de rareté d'item.
 *   <RarityBadge rarity="Légendaire" />
 */
const RarityBadge = ({ rarity, className = "" }) => {
  const config = RARITY_COLORS[rarity] || RARITY_COLORS.Commun;
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full
        text-[9px] font-black uppercase tracking-wider border
        ${config.bg} ${className}
      `}
    >
      {config.label}
    </span>
  );
};

export default RarityBadge;
