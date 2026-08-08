import React, { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCheck, ChevronRight } from "lucide-react";
import { NOTIF_ICON_MAP, notifCategoryColors } from "../../lib/notificationTheme";

const formatRelative = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "À l'instant";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} h`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

const NotificationCenter = ({ grouped, unreadCount, onNavigate, onDismiss, onDismissAll, onOpenFull }) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleClick = (notif) => {
    if (onDismiss) onDismiss(notif.id);
    if (onNavigate) onNavigate(notif.route);
    setOpen(false);
  };

  const categories = Object.keys(grouped);
  const totalNotifs = categories.reduce(
    (sum, cat) => sum + grouped[cat].length,
    0
  );

  return (
    <div className="relative" ref={panelRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setOpen(!open)}
        className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-all border shadow-md ${
          open
            ? "bg-stone-700 text-white border-stone-500"
            : "bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700 hover:text-white"
        }`}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60 animate-ping" />
            <span className="relative min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-black rounded-full px-1 shadow-[0_0_8px_rgba(239,68,68,0.5)]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Panneau de notifications — toujours en dark puisque dans le header */}
      {open && (
        <div className="fixed md:absolute left-2 right-2 md:left-auto md:right-0 top-[4.5rem] md:top-full md:mt-3 md:w-96 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Bandeau d'accent */}
          <div className="h-0.5 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-950">
            <div className="flex items-center gap-2">
              <Bell size={14} style={{ color: "#eab308" }} />
              <span className="text-xs font-black uppercase tracking-widest text-stone-200">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#ef444430", color: "#f87171" }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => onDismissAll && onDismissAll()}
                  className="text-[9px] font-bold uppercase text-stone-400 hover:text-yellow-400 px-2 py-1 rounded transition-colors flex items-center gap-1"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck size={12} /> Tout lire
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div className="max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent">
            {totalNotifs === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto text-stone-700 mb-3" />
                <div className="text-sm text-stone-400 font-bold">
                  Aucune notification
                </div>
                <div className="text-[10px] text-stone-500 mt-1">
                  Vous êtes à jour.
                </div>
              </div>
            ) : (
              categories.map((category) => {
                const notifs = grouped[category];
                if (!notifs || notifs.length === 0) return null;
                const colors = notifCategoryColors(category);

                return (
                  <div key={category}>
                    {/* Header catégorie */}
                    <div className="sticky top-0 px-4 py-2 bg-stone-800/90 backdrop-blur border-b border-stone-800 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.dot }} />
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: colors.textDark }}>
                        {category}
                      </span>
                      <span className="text-[9px] text-stone-500 font-mono">
                        ({notifs.length})
                      </span>
                    </div>

                    {/* Notifications de cette catégorie */}
                    {notifs.map((notif) => {
                      const IconComp = NOTIF_ICON_MAP[notif.icon] || Bell;
                      return (
                        <button
                          key={notif.id}
                          onClick={() => handleClick(notif)}
                          className={`relative w-full text-left pl-4 pr-3 py-3 flex items-start gap-3 transition-all border-b border-stone-800/50 group ${
                            notif.isRead
                              ? "opacity-60 hover:opacity-85"
                              : "hover:bg-stone-800/50"
                          }`}
                        >
                          {!notif.isRead && (
                            <span className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: colors.dot }} />
                          )}
                          <div
                            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                            style={{ backgroundColor: colors.bg }}
                          >
                            <IconComp size={14} style={{ color: colors.textDark }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {!notif.isRead && (
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#eab308" }} />
                              )}
                              <span
                                className="text-xs font-bold truncate"
                                style={{ color: notif.isRead ? "#a8a29e" : "#e7e5e4" }}
                              >
                                {notif.title}
                              </span>
                            </div>
                            <div className="text-[10px] truncate mt-0.5" style={{ color: "#a8a29e" }}>
                              {notif.description}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[9px] font-mono whitespace-nowrap" style={{ color: "#78716c" }}>
                              {formatRelative(notif.timestamp)}
                            </span>
                            <ChevronRight
                              size={12}
                              className="transition-colors opacity-0 group-hover:opacity-100"
                              style={{ color: "#a8a29e" }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* Voir tout */}
          {onOpenFull && (
            <button
              onClick={() => {
                onOpenFull();
                setOpen(false);
              }}
              className="w-full px-4 py-3 border-t border-stone-800 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-yellow-400 hover:bg-stone-800/50 transition-all flex items-center justify-center gap-2"
            >
              <Bell size={10} /> Centre de notifications
              <ChevronRight size={10} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
