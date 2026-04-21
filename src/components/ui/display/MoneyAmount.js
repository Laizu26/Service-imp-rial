import React from "react";
import { formatMoney, formatMoneyShort } from "../../../lib/gameUtils";

/**
 * Affiche un montant monétaire (écus/liards) avec style unifié.
 *   <MoneyAmount value={12.5} />              → "12 Écus 5 Liards"
 *   <MoneyAmount value={12.5} short />        → "12 É 5 L"
 *   <MoneyAmount value={12.5} tone="positive" /> → vert
 *   <MoneyAmount value={12.5} tone="negative" /> → rouge
 *   <MoneyAmount value={12.5} signed="+" />   → "+12 Écus…"
 */
const TONES = {
  default: "text-ink",
  positive: "text-green-600",
  negative: "text-red-600",
  muted: "text-ink-mute",
  imperial: "text-imperial-700",
};

const MoneyAmount = ({
  value = 0,
  short = false,
  signed,
  tone = "default",
  size = "md",
  bold = true,
  className = "",
}) => {
  const formatted = short ? formatMoneyShort(value) : formatMoney(value);
  const sizeClass =
    size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : "text-sm";
  return (
    <span
      className={`
        text-numeric inline-block whitespace-nowrap
        ${bold ? "font-black" : ""}
        ${sizeClass}
        ${TONES[tone] || TONES.default}
        ${className}
      `}
    >
      {signed && value !== 0 ? signed : ""}
      {formatted}
    </span>
  );
};

export default MoneyAmount;
