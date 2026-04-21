import React from "react";
import { Inbox } from "lucide-react";

/**
 * État vide avec icône, titre, description, action optionnelle.
 *   <EmptyState icon={Receipt} title="Aucun mouvement" description="…" action={<Button>…</Button>} />
 */
const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  size = "md",
  className = "",
}) => {
  const iconSize = size === "sm" ? 28 : size === "lg" ? 56 : 40;
  const pad = size === "sm" ? "py-6" : size === "lg" ? "py-16" : "py-12";
  return (
    <div className={`text-center ${pad} ${className}`}>
      <Icon
        size={iconSize}
        className="mx-auto mb-3 text-ink-mute opacity-50"
      />
      {title && (
        <div className="text-xs font-bold uppercase tracking-wider text-ink-soft">
          {title}
        </div>
      )}
      {description && (
        <div className="text-[11px] text-ink-mute mt-1 max-w-xs mx-auto">
          {description}
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
