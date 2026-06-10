import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { formatMoney } from "../lib/gameUtils";
import { ROLES } from "../lib/constants";

/**
 * Hook qui agrège toutes les sources de notifications pour un citoyen.
 * Chaque notification a : { id, type, category, title, description, timestamp, route, icon }
 *
 * onDismissedChange(ids) — callback appelé quand la liste des IDs rejetés change.
 * Si fourni, les IDs sont persistés dans le citoyen (Firestore) plutôt qu'en localStorage.
 */
export const useNotifications = (user, users, state, notifPrefs, gameDate, onDismissedChange) => {
  const prefs = useMemo(() => notifPrefs || {}, [notifPrefs]);
  const [dismissed, setDismissed] = useState([]);

  // Seed depuis le citoyen Firestore (ou localStorage en fallback)
  useEffect(() => {
    if (!user?.id) { setDismissed([]); return; }

    if (Array.isArray(user.dismissedNotifs)) {
      // Migration one-shot : fusionner avec localStorage s'il reste des données
      try {
        const lsKey = `notif_dismissed_${user.id}`;
        const stored = localStorage.getItem(lsKey);
        if (stored) {
          const lsIds = JSON.parse(stored);
          if (lsIds.length > 0) {
            const merged = [...new Set([...user.dismissedNotifs, ...lsIds])].slice(-500);
            setDismissed(merged);
            if (onDismissedChange) onDismissedChange(merged);
            localStorage.removeItem(lsKey);
            return;
          }
          localStorage.removeItem(lsKey);
        }
      } catch {}
      setDismissed(user.dismissedNotifs);
    } else {
      // Fallback localStorage (compte sans cloud ou hors ligne)
      try {
        const stored = localStorage.getItem(`notif_dismissed_${user.id}`);
        setDismissed(stored ? JSON.parse(stored) : []);
      } catch {
        setDismissed([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Sync temps réel depuis un autre appareil : merge quand le cloud reçoit de nouvelles entrées
  const cloudKeyRef = useRef("");
  useEffect(() => {
    if (!Array.isArray(user?.dismissedNotifs) || !onDismissedChange) return;
    const key = user.dismissedNotifs.join(",");
    if (key === cloudKeyRef.current) return;
    cloudKeyRef.current = key;
    setDismissed((prev) => {
      const newItems = user.dismissedNotifs.filter((id) => !prev.includes(id));
      if (newItems.length === 0) return prev;
      return [...new Set([...prev, ...user.dismissedNotifs])].slice(-500);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.dismissedNotifs]);

  const saveDismissed = useCallback(
    (ids) => {
      if (onDismissedChange) {
        onDismissedChange(ids.slice(-500));
      } else {
        try {
          localStorage.setItem(
            `notif_dismissed_${user?.id}`,
            JSON.stringify(ids.slice(-500))
          );
        } catch {}
      }
    },
    [user?.id, onDismissedChange]
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
          description: `${alert.slaveName || "Esclave"} — ${formatMoney(alert.amount || 0)} dissimulés`,
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
            description: `${formatMoney(d.total || d.amount)} — ${creditor?.name || "Créancier"}`,
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

    // --- Alertes bureau de poste (admins uniquement, niveau >= 20) ---
    const roleLevel = ROLES[user?.role]?.level || 0;
    const isGlobal = ROLES[user?.role]?.scope === "GLOBAL";
    if (roleLevel >= 20) {
      (state?.postalAlerts || []).forEach((alert) => {
        const relevant = isGlobal
          || alert.registeredCountryId === user.countryId
          || alert.claimedCountryId === user.countryId;
        if (!relevant) return;
        const loc = alert.registeredRegion
          ? `${alert.registeredRegion} (${alert.registeredCountryName})`
          : alert.registeredCountryName;
        const claimed = alert.claimedRegion
          ? `${alert.claimedRegion} (${alert.claimedCountryName})`
          : alert.claimedCountryName;
        notifs.push({
          id: `postal_${alert.id}`,
          type: "postal_alert",
          category: "Bureau de Poste",
          title: `${alert.citizenName || "Citoyen"} — Position incohérente`,
          description: `Déclaré à ${claimed}, enregistré à ${loc}`,
          timestamp: alert.timestamp || Date.now(),
          rpDate: rpDateStr,
          route: "registry",
          icon: "MapPin",
        });
      });
    }

    // --- Mushtagram (prioritaires → remontée globale) ---
    (state?.mushtagramNotifs || [])
      .filter(n => String(n.toId) === String(user.id) && n.priority === "high" && !n.read)
      .forEach(n => {
        const label = n.type === "follow"
          ? { title: "Nouvel abonné Mushtagram", icon: "UserPlus" }
          : n.type === "dm"
            ? { title: "Message Mushtagram", icon: "MessageCircle" }
            : { title: "Notification Mushtagram", icon: "Bell" };
        notifs.push({
          id: `mushnotif_${n.id}`,
          type: `mush_${n.type}`,
          category: "Mushtagram",
          title: label.title,
          description: `De ${n.fromName}`,
          timestamp: n.timestamp,
          route: "mushtagram",
          icon: label.icon,
          rpDate: rpDateStr,
        });
      });

    notifs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return notifs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, users, state?.debtRegistry, state?.gazette, state?.postalAlerts, state?.mushtagramNotifs, prefs, gameDate]);

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !dismissed.includes(n.id)),
    [notifications, dismissed]
  );

  const unreadCount = unreadNotifications.length;

  const grouped = useMemo(() => {
    const groups = {};
    notifications.forEach((n) => {
      if (!groups[n.category]) groups[n.category] = [];
      groups[n.category].push({ ...n, isRead: dismissed.includes(n.id) });
    });
    return groups;
  }, [notifications, dismissed]);

  const allWithStatus = useMemo(
    () =>
      notifications.map((n) => ({
        ...n,
        isRead: dismissed.includes(n.id),
      })),
    [notifications, dismissed]
  );

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
