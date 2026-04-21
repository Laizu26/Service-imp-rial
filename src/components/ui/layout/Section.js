import React from "react";

const VARIANTS = {
  default: "bg-surface border border-hairline",
  sunken: "bg-surface-2 border border-hairline",
  highlighted:
    "bg-gradient-to-br from-imperial-50 to-imperial-100/70 border border-imperial-200",
  danger: "bg-red-50/60 border border-red-200",
  dark: "bg-stone-900 text-ink-sidebar border border-stone-800",
};

/**
 * Carte/section unique. Toute "boîte" visible de l'app est une Section.
 *   <Section title="…" icon={Icon} actions={…} variant="default" footer={…}>
 */
const Section = ({
  title,
  icon: Icon,
  actions,
  children,
  footer,
  variant = "default",
  padded = true,
  className = "",
  headerAccent = "text-ink-mute",
}) => {
  const hasHeader = title || actions;
  return (
    <section
      className={`rounded-tile shadow-card overflow-hidden ${VARIANTS[variant] || VARIANTS.default} ${className}`}
    >
      {hasHeader && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-hairline">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon size={14} className={headerAccent} />}
            {title && (
              <h3 className="text-eyebrow truncate">{title}</h3>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </header>
      )}
      {padded ? <div className="p-4">{children}</div> : children}
      {footer && (
        <footer className="px-4 py-3 border-t border-hairline bg-surface-2/50">
          {footer}
        </footer>
      )}
    </section>
  );
};

export default Section;
