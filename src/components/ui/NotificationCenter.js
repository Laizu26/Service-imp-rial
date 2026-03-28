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
  Messages: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
  Emploi: { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-500" },
  "Vie Civile": { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-500" },
  "Main d'Oeuvre": { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  Finances: { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-500" },
  Gazette: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
};

const NotificationCenter = ({ grouped, unreadCount, onNavigate, onDismiss, onDismissAll, onOpenFull }) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Fermer quand on clique dehors
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
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-black rounded-full px-1 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau de notifications */}
      {open && (
        <div className="absolute right-0 top-full mt-3 w-80 md:w-96 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-950">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-yellow-500" />
              <span className="text-xs font-black uppercase tracking-widest text-stone-300">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => onDismissAll && onDismissAll()}
                  className="text-[9px] font-bold uppercase text-stone-500 hover:text-yellow-400 px-2 py-1 rounded transition-colors flex items-center gap-1"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck size={12} /> Tout lire
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-stone-500 hover:text-white p-1 rounded transition-colors"
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
                <div className="text-sm text-stone-500 font-bold">
                  Aucune notification
                </div>
                <div className="text-[10px] text-stone-600 mt-1">
                  Vous êtes à jour.
                </div>
              </div>
            ) : (
              categories.map((category) => {
                const notifs = grouped[category];
                if (!notifs || notifs.length === 0) return null;
                const colors = CATEGORY_COLORS[category] || {
                  bg: "bg-stone-500/10",
                  text: "text-stone-400",
                  dot: "bg-stone-500",
                };

                return (
                  <div key={category}>
                    {/* Header catégorie */}
                    <div className="px-4 py-2 bg-stone-800/50 border-b border-stone-800 flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest ${colors.text}`}
                      >
                        {category}
                      </span>
                      <span className="text-[9px] text-stone-600 font-mono">
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
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all border-b border-stone-800/50 group ${
                            notif.isRead
                              ? "opacity-50 hover:opacity-80"
                              : "hover:bg-stone-800/50"
                          }`}
                        >
                          <div
                            className={`shrink-0 w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center mt-0.5`}
                          >
                            <IconComp size={14} className={colors.text} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {!notif.isRead && (
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                              )}
                              <span
                                className={`text-xs font-bold truncate ${
                                  notif.isRead
                                    ? "text-stone-500"
                                    : "text-stone-200"
                                }`}
                              >
                                {notif.title}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-500 truncate mt-0.5">
                              {notif.description}
                            </div>
                          </div>
                          <ChevronRight
                            size={14}
                            className="text-stone-600 group-hover:text-stone-300 mt-1 shrink-0 transition-colors"
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
              className="w-full px-4 py-3 border-t border-stone-800 text-[9px] font-black uppercase tracking-widest text-stone-500 hover:text-yellow-400 hover:bg-stone-800/50 transition-all flex items-center justify-center gap-2"
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
