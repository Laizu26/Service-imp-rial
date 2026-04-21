import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Mail,
  Briefcase,
  Heart,
  ShieldAlert,
  Coins,
  Scroll,
  X,
  CheckCheck,
  ChevronRight,
} from "lucide-react";

const ICON_MAP = {
  Mail,
  Briefcase,
  Heart,
  ShieldAlert,
  Coins,
  Scroll,
};

const CATEGORY_COLORS = {
  Messages: { bg: "#3b82f620", text: "#60a5fa", dot: "#3b82f6" },
  Emploi: { bg: "#a855f720", text: "#c084fc", dot: "#a855f7" },
  "Vie Civile": { bg: "#f43f5e20", text: "#fb7185", dot: "#f43f5e" },
  "Main d'Oeuvre": { bg: "#ef444420", text: "#f87171", dot: "#ef4444" },
  Finances: { bg: "#eab30820", text: "#fbbf24", dot: "#eab308" },
  Gazette: { bg: "#10b98120", text: "#34d399", dot: "#10b981" },
};

const DEFAULT_COLORS = { bg: "#78716c20", text: "#a8a29e", dot: "#78716c" };

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
        className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-all border shadow-card ${
          open
            ? "bg-imperial-700 text-white border-imperial-800"
            : "bg-surface text-ink-soft border-outline hover:bg-surface-hover hover:text-ink"
        }`}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-black rounded-full px-1 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau de notifications — suit le thème actif */}
      {open && (
        <div className="absolute right-0 top-full mt-3 w-80 md:w-96 bg-surface border border-outline rounded-2xl shadow-elev overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-surface-2">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-imperial-600" />
              <span className="text-xs font-black uppercase tracking-widest text-ink">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => onDismissAll && onDismissAll()}
                  className="text-[9px] font-bold uppercase text-ink-mute hover:text-imperial-700 px-2 py-1 rounded transition-colors flex items-center gap-1"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck size={12} /> Tout lire
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-ink-mute hover:text-ink p-1 rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div className="max-h-[420px] overflow-y-auto">
            {totalNotifs === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto text-ink-mute/60 mb-3" />
                <div className="text-sm text-ink-soft font-bold">
                  Aucune notification
                </div>
                <div className="text-[10px] text-ink-mute mt-1">
                  Vous êtes à jour.
                </div>
              </div>
            ) : (
              categories.map((category) => {
                const notifs = grouped[category];
                if (!notifs || notifs.length === 0) return null;
                const colors = CATEGORY_COLORS[category] || DEFAULT_COLORS;

                return (
                  <div key={category}>
                    {/* Header catégorie */}
                    <div className="px-4 py-2 bg-surface-2/60 border-b border-hairline flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.dot }} />
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: colors.text }}>
                        {category}
                      </span>
                      <span className="text-[9px] text-ink-mute font-mono">
                        ({notifs.length})
                      </span>
                    </div>

                    {/* Notifications de cette catégorie */}
                    {notifs.map((notif) => {
                      const IconComp = ICON_MAP[notif.icon] || Bell;
                      return (
                        <button
                          key={notif.id}
                          onClick={() => handleClick(notif)}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all border-b border-hairline/60 group ${
                            notif.isRead
                              ? "opacity-60 hover:opacity-100"
                              : "hover:bg-surface-hover"
                          }`}
                        >
                          <div
                            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                            style={{ backgroundColor: colors.bg }}
                          >
                            <IconComp size={14} style={{ color: colors.text }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {!notif.isRead && (
                                <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-imperial-500" />
                              )}
                              <span
                                className={`text-xs font-bold truncate ${
                                  notif.isRead ? "text-ink-mute" : "text-ink"
                                }`}
                              >
                                {notif.title}
                              </span>
                            </div>
                            <div className="text-[10px] truncate mt-0.5 text-ink-soft">
                              {notif.description}
                            </div>
                          </div>
                          <ChevronRight
                            size={14}
                            className="mt-1 shrink-0 transition-colors text-ink-mute"
                          />
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
              className="w-full px-4 py-3 border-t border-hairline text-[9px] font-black uppercase tracking-widest text-ink-mute hover:text-imperial-700 hover:bg-surface-hover transition-all flex items-center justify-center gap-2"
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
