import React from "react";
import { Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { STATUS_COLORS } from "../tokens";

const DEFAULT_ICONS = {
  DRAFT: Clock,
  PENDING: Clock,
  ACTIVE: CheckCircle2,
  PAID: CheckCircle2,
  DONE: CheckCircle2,
  CANCELLED: XCircle,
  REJECTED: XCircle,
  EXPIRED: AlertTriangle,
};

/**
 * Badge de statut unique. Piloté par la map `STATUS_COLORS` (ui/tokens.js).
 *   <StatusBadge status="ACTIVE" />
 *   <StatusBadge status="DRAFT" label="Custom" icon={MyIcon} />
 */
const StatusBadge = ({ status, label, icon, size = "sm", className = "" }) => {
  const config = STATUS_COLORS[status] || STATUS_COLORS.ACTIVE;
  const Icon = icon || DEFAULT_ICONS[status] || CheckCircle2;
  const iconSize = size === "md" ? 12 : 10;
  const textSize = size === "md" ? "text-[10px]" : "text-[9px]";
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full
        font-black uppercase tracking-wider border
        ${textSize} ${config.bg} ${className}
      `}
    >
      <Icon size={iconSize} /> {label || config.label}
    </span>
  );
};

export default StatusBadge;
