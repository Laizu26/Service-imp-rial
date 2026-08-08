import React, { useState, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  Filter,
  ChevronRight,
  Eye,
  EyeOff,
  Inbox,
  SortDesc,
  SortAsc,
} from "lucide-react";
import { NOTIF_ICON_MAP, notifCategoryColors } from "../../lib/notificationTheme";

const dayBucket = (ts) => {
  if (!ts) return "Plus ancien";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "Plus ancien";
  const now = new Date();
  const startOf = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays <= 7) return "Cette semaine";
  return "Plus ancien";
};
const BUCKET_ORDER = ["Aujourd'hui", "Hier", "Cette semaine", "Plus ancien"];

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
  isDark,
}) => {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [showRead, setShowRead] = useState(true);
  const [sortOrder, setSortOrder] = useState("desc");

  // Theme colors
  const t = {
    textPrimary: isDark ? "#e7e5e4" : "#1c1917",
    textSecondary: isDark ? "#a8a29e" : "#57534e",
    textMuted: isDark ? "#78716c" : "#a8a29e",
    textFaint: isDark ? "#57534e" : "#d6d3d1",
    bgCard: isDark ? "#292524" : "#ffffff",
    bgCardAlt: isDark ? "#1c1917" : "#fafaf9",
    bgHover: isDark ? "#44403c" : "#f5f5f4",
    border: isDark ? "#44403c" : "#e7e5e4",
    borderLight: isDark ? "#44403c80" : "#f5f5f4",
  };

  // Filtrage
  const displayed = useMemo(() => {
    let list = allWithStatus || [];
    if (activeFilter !== "ALL" && activeFilter !== "UNREAD") {
      list = list.filter((n) => n.category === activeFilter);
    }
    if (activeFilter === "UNREAD" || !showRead) {
      list = list.filter((n) => !n.isRead);
    }
    list = [...list].sort((a, b) =>
      sortOrder === "desc"
        ? (b.timestamp || 0) - (a.timestamp || 0)
        : (a.timestamp || 0) - (b.timestamp || 0)
    );
    return list;
  }, [allWithStatus, activeFilter, showRead, sortOrder]);

  // Groupement par jour (uniquement pertinent en tri "plus récentes" ; en tri croissant
  // on affiche une liste plate pour éviter des groupes désordonnés).
  const buckets = useMemo(() => {
    if (sortOrder !== "desc") return null;
    const map = {};
    displayed.forEach((n) => {
      const b = dayBucket(n.timestamp);
      if (!map[b]) map[b] = [];
      map[b].push(n);
    });
    return BUCKET_ORDER.filter((b) => map[b]?.length).map((b) => [b, map[b]]);
  }, [displayed, sortOrder]);

  const totalCount = (allWithStatus || []).length;

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

  const catColor = (cat) => notifCategoryColors(cat);
  const catText = (cat) => isDark ? catColor(cat).textDark : catColor(cat).text;

  const NotifCard = ({ notif }) => {
    const IconComp = NOTIF_ICON_MAP[notif.icon] || Bell;
    const colors = catColor(notif.category);

    return (
      <div
        className="relative rounded-xl overflow-hidden transition-all"
        style={{
          backgroundColor: isDark ? "#29252460" : "#ffffff",
          border: `1px solid ${notif.isRead ? t.borderLight : colors.border}`,
          opacity: notif.isRead ? 0.65 : 1,
        }}
        onMouseEnter={(e) => { if (notif.isRead) e.currentTarget.style.opacity = "0.85"; }}
        onMouseLeave={(e) => { if (notif.isRead) e.currentTarget.style.opacity = "0.65"; }}
      >
        {!notif.isRead && (
          <span className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: colors.dot }} />
        )}
        <div className="flex items-start gap-3 p-4 pl-5">
          {/* Icône */}
          <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
            <IconComp size={16} style={{ color: catText(notif.category) }} />
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#eab308" }} />
              )}
              <span className="text-xs font-bold" style={{ color: notif.isRead ? t.textMuted : t.textPrimary }}>
                {notif.title}
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded" style={{
                backgroundColor: colors.bg,
                color: catText(notif.category),
              }}>
                {notif.category}
              </span>
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: t.textSecondary }}>
              {notif.description}
            </div>
            <div className="text-[9px] mt-1" style={{ color: t.textMuted }}>
              {notif.rpDate || formatTimestamp(notif.timestamp)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {notif.isRead ? (
              <button
                onClick={() => onUndismiss && onUndismiss(notif.id)}
                className="p-1.5 rounded-lg transition-all"
                style={{ color: t.textMuted }}
                onMouseEnter={(e) => (e.currentTarget.style.color = t.textSecondary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}
                title="Marquer non lue"
              >
                <EyeOff size={12} />
              </button>
            ) : (
              <button
                onClick={() => onDismiss && onDismiss(notif.id)}
                className="p-1.5 rounded-lg transition-all"
                style={{ color: t.textMuted }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#eab308")}
                onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}
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
              className="p-1.5 rounded-lg transition-all"
              style={{ color: t.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.color = t.textPrimary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}
              title="Ouvrir"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* EN-TÊTE */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: t.textPrimary }}>
            <Bell size={16} style={{ color: "#eab308" }} />
            Centre de Notifications
          </h2>
          <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: t.textMuted }}>
            {unreadCount} non lue{unreadCount > 1 ? "s" : ""} · {totalCount} au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onDismissAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
              style={{
                backgroundColor: t.bgCard,
                border: `1px solid ${t.border}`,
                color: t.textSecondary,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#eab308")}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.textSecondary)}
            >
              <CheckCheck size={12} /> Tout marquer lu
            </button>
          )}
        </div>
      </div>

      {/* BARRE DE FILTRES */}
      <div className="rounded-xl p-3" style={{ backgroundColor: isDark ? "#29252440" : "#f5f5f4", border: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-2 mb-3">
          <Filter size={10} style={{ color: t.textMuted }} />
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: t.textMuted }}>Filtrer</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Tous */}
          <button
            onClick={() => setActiveFilter("ALL")}
            className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
            style={{
              backgroundColor: activeFilter === "ALL" ? (isDark ? "#44403c" : "#e7e5e4") : "transparent",
              color: activeFilter === "ALL" ? t.textPrimary : t.textMuted,
              border: `1px solid ${activeFilter === "ALL" ? t.border : t.borderLight}`,
            }}
          >
            Toutes ({totalCount})
          </button>
          {/* Non lues */}
          <button
            onClick={() => setActiveFilter("UNREAD")}
            className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
            style={{
              backgroundColor: activeFilter === "UNREAD" ? "#eab30820" : "transparent",
              color: activeFilter === "UNREAD" ? (isDark ? "#fbbf24" : "#b45309") : t.textMuted,
              border: `1px solid ${activeFilter === "UNREAD" ? "#eab30840" : t.borderLight}`,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#eab308" }} />
            Non lues ({unreadCount})
          </button>
          {/* Par catégorie */}
          {(categories || []).map((cat) => {
            const colors = catColor(cat);
            const stats = categoryStats[cat] || { total: 0, unread: 0 };
            const isActive = activeFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                style={{
                  backgroundColor: isActive ? colors.bg : "transparent",
                  color: isActive ? catText(cat) : t.textMuted,
                  border: `1px solid ${isActive ? colors.border : t.borderLight}`,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.dot }} />
                {cat} ({stats.total})
                {stats.unread > 0 && (
                  <span className="text-[8px] px-1 rounded-full ml-0.5" style={{
                    backgroundColor: "#ef444430",
                    color: isDark ? "#f87171" : "#dc2626",
                  }}>
                    {stats.unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Contrôles supplémentaires */}
        <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${t.borderLight}` }}>
          <button
            onClick={() => setShowRead(!showRead)}
            className="flex items-center gap-1.5 text-[9px] font-bold uppercase transition-colors"
            style={{ color: t.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.color = t.textSecondary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}
          >
            {showRead ? <Eye size={10} /> : <EyeOff size={10} />}
            {showRead ? "Masquer lues" : "Afficher lues"}
          </button>
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="flex items-center gap-1.5 text-[9px] font-bold uppercase transition-colors"
            style={{ color: t.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.color = t.textSecondary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}
          >
            {sortOrder === "desc" ? <SortDesc size={10} /> : <SortAsc size={10} />}
            {sortOrder === "desc" ? "Plus récentes" : "Plus anciennes"}
          </button>
          {activeFilter !== "ALL" && activeFilter !== "UNREAD" && (
            <button
              onClick={() => onDismissCategory && onDismissCategory(activeFilter)}
              className="flex items-center gap-1.5 text-[9px] font-bold uppercase transition-colors ml-auto"
              style={{ color: t.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#eab308")}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}
            >
              <CheckCheck size={10} /> Marquer « {activeFilter} » comme lu
            </button>
          )}
        </div>
      </div>

      {/* LISTE DES NOTIFICATIONS */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl" style={{
          color: t.textMuted,
          border: `1px dashed ${t.border}`,
        }}>
          <Inbox size={40} style={{ opacity: 0.3 }} />
          <div className="text-xs font-bold uppercase tracking-widest">
            {activeFilter === "UNREAD"
              ? "Aucune notification non lue"
              : activeFilter !== "ALL"
              ? `Aucune notification dans « ${activeFilter} »`
              : "Aucune notification"}
          </div>
          <div className="text-[10px]" style={{ color: t.textMuted }}>Vous êtes à jour.</div>
        </div>
      ) : buckets ? (
        <div className="space-y-5">
          {buckets.map(([bucket, notifs]) => (
            <div key={bucket} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: t.textMuted }}>
                  {bucket}
                </span>
                <span className="text-[9px] font-mono" style={{ color: t.textFaint }}>
                  ({notifs.length})
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: t.borderLight }} />
              </div>
              <div className="space-y-2">
                {notifs.map((notif) => <NotifCard key={notif.id} notif={notif} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((notif) => <NotifCard key={notif.id} notif={notif} />)}
        </div>
      )}
    </div>
  );
};

export default NotificationCenterView;
