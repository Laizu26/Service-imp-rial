import React from "react";
import { getRoleTheme } from "../tokens";
import { ROLES } from "../../../lib/constants";

/**
 * Badge de rôle citoyen piloté par ROLES + ROLE_COLORS.
 *   <RoleBadge role="EMPEREUR" />
 */
const RoleBadge = ({ role, className = "" }) => {
  const theme = getRoleTheme(role);
  const info = ROLES[role] || ROLES.CITOYEN;
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full
        text-[10px] font-bold uppercase tracking-wider border
        ${theme.badge} ${className}
      `}
    >
      {info.label}
    </span>
  );
};

export default RoleBadge;
