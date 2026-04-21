import React from "react";

/**
 * Entête unique pour toute vue citoyenne.
 *   <PageHeader icon={Landmark} title="Banque" subtitle="…" actions={<Button>…</Button>} />
 */
const PageHeader = ({
  icon: Icon,
  title,
  subtitle,
  actions,
  accent = "text-imperial-600",
}) => (
  <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-hairline">
    <div className="flex items-center gap-3 min-w-0">
      {Icon && (
        <div className="p-2.5 rounded-tile bg-surface border border-hairline shadow-card shrink-0">
          <Icon size={22} className={accent} />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-ink-mute mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
    {actions && (
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {actions}
      </div>
    )}
  </header>
);

export default PageHeader;
