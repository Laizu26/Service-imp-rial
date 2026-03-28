import React, { useState, useMemo } from "react";
import {
  Bell,
  Mail,
  Briefcase,
  Heart,
  ShieldAlert,
  Coins,
  Scroll,
  CheckCheck,
  Trash2,
  Filter,
  ChevronRight,
  Eye,
  EyeOff,
  Inbox,
  SortDesc,
  SortAsc,
} from "lucide-react";

const ICON_MAP = { Mail, Briefcase, Heart, ShieldAlert, Coins, Scroll };

const CATEGORY_COLORS = {
  Messages:        { bg: "bg-blue-500/10",    text: "text-blue-400",    dot: "bg-blue-500",    border: "border-blue-500/30" },
  Emploi:          { bg: "bg-purple-500/10",  text: "text-purple-400",  dot: "bg-purple-500",  border: "border-purple-500/30" },
  "Liens & Unions":{ bg: "bg-rose-500/10",    text: "text-rose-400",    dot: "bg-rose-500",    border: "border-rose-500/30" },
  "Main d'Oeuvre": { bg: "bg-red-500/10",     text: "text-red-400",     dot: "bg-red-500",     border: "border-red-500/30" },
  Finances:        { bg: "bg-yellow-500/10",  text: "text-yellow-400",  dot: "bg-yellow-500",  border: "border-yellow-500/30" },
  Gazette:         { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-500/30" },
};

const DEFAULT_COLORS = { bg: "bg-stone-500/10", text: "text-stone-400", dot: "bg-stone-500", border: "border-stone-500/30" };

const NotificationCenterView = ({
  allWithStatus,
  grouped,
  categories,
  unreadCount,
  onNavigate,
  onDismiss,
  onDismissAll,
  onDismissCategory,
  onUndismiss,
}) => {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [showRead, setShowRead] = useState(true);
  const [sortOrder, setSortOrder] = useState("desc");

  // Filtrage
  const displayed = useMemo(() => {
    let list = allWithStatus || [];

    // Filtre par catégorie
    if (activeFilter !== "ALL" && activeFilter !== "UNREAD") {
      list = list.filter((n) => n.category === activeFilter);
    }

    // Filtre non-lues uniquement
    if (activeFilter === "UNREAD" || !showRead) {
      list = list.filter((n) => !n.isRead);
    }

    // Tri
    list = [...list].sort((a, b) =>
      sortOrder === "desc"
        ? (b.timestamp || 0) - (a.timestamp || 0)
        : (a.timestamp || 0) - (b.timestamp || 0)
    );

    return list;
  }, [allWithStatus, activeFilter, showRead, sortOrder]);

  const totalCount = (allWithStatus || []).length;

  // Stats par catégorie
  const categoryStats = useMemo(() => {
    const stats = {};
    (allWithStatus || []).forEach((n) => {
      if (!stats[n.category]) stats[n.category] = { total: 0, unread: 0 };
      stats[n.category].total++;
      if (!n.isRead) stats[n.category].unread++;
    });
    return stats;
  }, [allWithStatus]);

  const formatTimestamp = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* EN-TÊTE */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-stone-200 flex items-center gap-2">
            <Bell size={16} className="text-yellow-500" />
            Centre de Notifications
          </h2>
          <p className="text-[9px] text-stone-500 mt-0.5 uppercase tracking-widest">
            {unreadCount} non lue{unreadCount > 1 ? "s" : ""} · {totalCount} au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onDismissAll}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-yellow-400 hover:border-yellow-600/30 transition-all"
            >
              <CheckCheck size={12} /> Tout marquer lu
            </button>
          )}
        </div>
      </div>

      {/* BARRE DE FILTRES */}
      <div className="bg-stone-800/40 border border-stone-700 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={10} className="text-stone-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">Filtrer</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Tous */}
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
              activeFilter === "ALL"
                ? "bg-stone-700 text-stone-200 border-stone-500"
                : "bg-stone-800/50 text-stone-500 border-stone-700 hover:text-stone-300"
            }`}
          >
            Toutes ({totalCount})
          </button>
          {/* Non lues */}
          <button
            onClick={() => setActiveFilter("UNREAD")}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-1.5 ${
              activeFilter === "UNREAD"
                ? "bg-yellow-900/30 text-yellow-400 border-yellow-700/50"
                : "bg-stone-800/50 text-stone-500 border-stone-700 hover:text-stone-300"
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            Non lues ({unreadCount})
          </button>
          {/* Par catégorie */}
          {(categories || []).map((cat) => {
            const colors = CATEGORY_COLORS[cat] || DEFAULT_COLORS;
            const stats = categoryStats[cat] || { total: 0, unread: 0 };
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-1.5 ${
                  activeFilter === cat
                    ? `${colors.bg} ${colors.text} ${colors.border}`
                    : "bg-stone-800/50 text-stone-500 border-stone-700 hover:text-stone-300"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                {cat} ({stats.total})
                {stats.unread > 0 && (
                  <span className="bg-red-500/20 text-red-400 text-[8px] px-1 rounded-full ml-0.5">
                    {stats.unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Contrôles supplémentaires */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-700/50">
          <button
            onClick={() => setShowRead(!showRead)}
            className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-stone-500 hover:text-stone-300 transition-colors"
          >
            {showRead ? <Eye size={10} /> : <EyeOff size={10} />}
            {showRead ? "Masquer lues" : "Afficher lues"}
          </button>
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-stone-500 hover:text-stone-300 transition-colors"
          >
            {sortOrder === "desc" ? <SortDesc size={10} /> : <SortAsc size={10} />}
            {sortOrder === "desc" ? "Plus récentes" : "Plus anciennes"}
          </button>
          {activeFilter !== "ALL" && activeFilter !== "UNREAD" && (
            <button
              onClick={() => onDismissCategory && onDismissCategory(activeFilter)}
              className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-stone-500 hover:text-yellow-400 transition-colors ml-auto"
            >
              <CheckCheck size={10} /> Marquer « {activeFilter} » comme lu
            </button>
          )}
        </div>
      </div>

      {/* LISTE DES NOTIFICATIONS */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-stone-600 gap-3 border border-dashed border-stone-700 rounded-xl">
          <Inbox size={40} className="opacity-30" />
          <div className="text-xs font-bold uppercase tracking-widest">
            {activeFilter === "UNREAD"
              ? "Aucune notification non lue"
              : activeFilter !== "ALL"
              ? `Aucune notification dans « ${activeFilter} »`
              : "Aucune notification"}
          </div>
          <div className="text-[10px] text-stone-600">Vous êtes à jour.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((notif) => {
            const IconComp = ICON_MAP[notif.icon] || Bell;
            const colors = CATEGORY_COLORS[notif.category] || DEFAULT_COLORS;

            return (
              <div
                key={notif.id}
                className={`bg-stone-800/40 border rounded-xl overflow-hidden transition-all ${
                  notif.isRead
                    ? "border-stone-700/50 opacity-60 hover:opacity-80"
                    : `${colors.border} hover:bg-stone-800/60`
                }`}
              >
                <div className="flex items-start gap-3 p-4">
                  {/* Icône */}
                  <div className={`shrink-0 w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                    <IconComp size={16} className={colors.text} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                      )}
                      <span className={`text-xs font-bold ${notif.isRead ? "text-stone-500" : "text-stone-200"}`}>
                        {notif.title}
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                        {notif.category}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      {notif.description}
                    </div>
                    <div className="text-[9px] text-stone-600 mt-1">
                      {formatTimestamp(notif.timestamp)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {notif.isRead ? (
                      <button
                        onClick={() => onUndismiss && onUndismiss(notif.id)}
                        className="p-1.5 rounded-lg text-stone-600 hover:text-stone-300 hover:bg-stone-700/50 transition-all"
                        title="Marquer non lue"
                      >
                        <EyeOff size={12} />
                      </button>
                    ) : (
                      <button
                        onClick={() => onDismiss && onDismiss(notif.id)}
                        className="p-1.5 rounded-lg text-stone-600 hover:text-yellow-400 hover:bg-stone-700/50 transition-all"
                        title="Marquer comme lue"
                      >
                        <CheckCheck size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (onDismiss) onDismiss(notif.id);
                        if (onNavigate) onNavigate(notif.route);
                      }}
                      className="p-1.5 rounded-lg text-stone-600 hover:text-stone-200 hover:bg-stone-700/50 transition-all"
                      title="Ouvrir"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationCenterView;
