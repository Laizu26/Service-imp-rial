import { useMemo, useState, useCallback, useEffect } from "react";

/**
 * Hook qui agrège toutes les sources de notifications pour un citoyen.
 * Chaque notification a : { id, type, category, title, description, timestamp, route, icon }
 */
export const useNotifications = (user, users, state, notifPrefs, gameDate) => {
  const prefs = notifPrefs || {};
  const [dismissed, setDismissed] = useState([]);

  // Charger depuis localStorage à chaque changement d'utilisateur
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`notif_dismissed_${user?.id}`);
      setDismissed(stored ? JSON.parse(stored) : []);
    } catch {
      setDismissed([]);
    }
  }, [user?.id]);

  const saveDismissed = useCallback(
    (ids) => {
      try {
        localStorage.setItem(
          `notif_dismissed_${user?.id}`,
          JSON.stringify(ids.slice(-500))
        );
      } catch {}
    },
    [user?.id]
  );

  const dismiss = useCallback(
    (id) => {
      setDismissed((prev) => {
        const next = [...prev, id];
        saveDismissed(next);
        return next;
      });
    },
    [saveDismissed]
  );

  const dismissAll = useCallback(() => {
    setDismissed((prev) => {
      const allIds = notifications.map((n) => n.id);
      const next = [...new Set([...prev, ...allIds])];
      saveDismissed(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, saveDismissed]);

  const dismissCategory = useCallback(
    (category) => {
      setDismissed((prev) => {
        const catIds = notifications
          .filter((n) => n.category === category)
          .map((n) => n.id);
        const next = [...new Set([...prev, ...catIds])];
        saveDismissed(next);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, saveDismissed]
  );

  const undismiss = useCallback(
    (id) => {
      setDismissed((prev) => {
        const next = prev.filter((x) => x !== id);
        saveDismissed(next);
        return next;
      });
    },
    [saveDismissed]
  );

  const clearAll = useCallback(() => {
    setDismissed((prev) => {
      const allIds = notifications.map((n) => n.id);
      const next = [...new Set([...prev, ...allIds])];
      saveDismissed(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, saveDismissed]);

  const notifications = useMemo(() => {
    if (!user) return [];
    const notifs = [];
    const gd = gameDate || { day: 1, month: 1, year: 1200 };
    const rpDateStr = `${gd.day}/${gd.month}/${gd.year}`;

    // --- Messages non lus ---
    if (prefs.messages !== false) {
      (user.messages || []).forEach((msg) => {
        if (!msg.read) {
          notifs.push({
            id: `msg_${msg.id || msg.date}`,
            type: "message",
            category: "Messages",
            title: msg.subject || "Nouveau message",
            description: `De ${msg.from || msg.fromName || "Inconnu"}`,
            timestamp: msg.id || Date.now(),
            route: "msg",
            icon: "Mail",
            rpDate: rpDateStr,
          });
        }
      });
    }

    // --- Offres d'emploi ---
    if (prefs.emploi !== false) {
      (user.jobOffers || []).forEach((offer) => {
        notifs.push({
          id: `job_${offer.id}`,
          type: "job_offer",
          category: "Emploi",
          title: "Offre d'embauche",
          description: offer.companyName || "Entreprise inconnue",
          timestamp: offer.date || Date.now(),
          rpDate: rpDateStr,
          route: "my_company",
          icon: "Briefcase",
        });
      });
    }

    // --- Propositions d'union ---
    if (prefs.unions !== false) {
      (user.marriageProposals || []).forEach((p) => {
        notifs.push({
          id: `marry_${p.fromId}`,
          type: "marriage",
          category: "Liens & Unions",
          title: "Proposition d'union",
          description: `De ${p.fromName || "Inconnu"}`,
          timestamp: p.timestamp || Date.now(),
          rpDate: rpDateStr,
          route: "profil",
          icon: "Heart",
        });
      });
    }

    // --- Alertes esclaves ---
    if (prefs.esclaves !== false) {
      (user.slaveAlerts || []).forEach((alert) => {
        notifs.push({
          id: `slave_${alert.id}`,
          type: "slave_alert",
          category: "Main d'Oeuvre",
          title: "Activité suspecte",
          description: `${alert.slaveName || "Esclave"} — ${alert.amount || 0} Écus dissimulés`,
          timestamp: alert.timestamp || Date.now(),
          rpDate: rpDateStr,
          route: "slaves",
          icon: "ShieldAlert",
        });
      });
    }

    // --- Dettes en attente (où l'user est débiteur) ---
    if (prefs.finances !== false) {
      (state?.debtRegistry || [])
        .filter((d) => d.debtorId === user.id && d.status === "PENDING")
        .forEach((d) => {
          const creditor = (users || []).find((u) => u.id === d.creditorId);
          notifs.push({
            id: `debt_${d.id}`,
            type: "debt",
            category: "Finances",
            title: "Contrat de dette",
            description: `${d.total || d.amount} Écus — ${creditor?.name || "Créancier"}`,
            timestamp: d.createdAt || Date.now(),
            rpDate: rpDateStr,
            route: "bank",
            icon: "Coins",
          });
        });
    }

    // --- Gazette récente (max 3) ---
    if (prefs.gazette !== false) {
      const gazette = state?.gazette || [];
      gazette.slice(0, 3).forEach((g) => {
        notifs.push({
          id: `gaz_${g.id}`,
          type: "gazette",
          category: "Gazette",
          title: g.title || "Nouvelle publication",
          description: g.author || "Chancellerie",
          timestamp: g.id || Date.now(),
          rpDate: g.date || rpDateStr,
          route: "gazette",
          icon: "Scroll",
        });
      });
    }

    // Trier par timestamp desc
    notifs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return notifs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, users, state?.debtRegistry, state?.gazette, prefs, gameDate]);

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !dismissed.includes(n.id)),
    [notifications, dismissed]
  );

  const unreadCount = unreadNotifications.length;

  // Grouper par catégorie (toutes les notifs, avec isRead)
  const grouped = useMemo(() => {
    const groups = {};
    notifications.forEach((n) => {
      if (!groups[n.category]) groups[n.category] = [];
      groups[n.category].push({ ...n, isRead: dismissed.includes(n.id) });
    });
    return groups;
  }, [notifications, dismissed]);

  // Liste plate avec isRead
  const allWithStatus = useMemo(
    () =>
      notifications.map((n) => ({
        ...n,
        isRead: dismissed.includes(n.id),
      })),
    [notifications, dismissed]
  );

  // Catégories disponibles
  const categories = useMemo(
    () => [...new Set(notifications.map((n) => n.category))],
    [notifications]
  );

  return {
    notifications,
    allWithStatus,
    unreadNotifications,
    unreadCount,
    grouped,
    categories,
    dismiss,
    dismissAll,
    dismissCategory,
    undismiss,
    clearAll,
  };
};
