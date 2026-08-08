const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const DISCORD_WEBHOOK_URL = defineSecret("DISCORD_WEBHOOK_URL");

// Doit correspondre exactement à SYSTEM_CONFIG.dbPath dans src/lib/constants.js du site :
// tout l'état du jeu vit dans ce document unique, pas dans des collections séparées.
const GAME_STATE_DOC = "artifacts/empire-prod-v1/public/data/gamestate/core";

const COLORS = {
  gazette: 0xd4af37,
  mushtagram: 0xe1306c,
  bourse: 0x10b981,
};

// Couleur d'accent de l'icône de notification côté Android (voir sendPush) — reprend la
// palette utilisée par la cloche de notification in-app (src/lib/notificationTheme.js) pour
// que le style reste cohérent entre le site et les notifications push.
const PUSH_COLORS = {
  gazette: "#d4af37",
  mushtagram: "#e1306c",
  bourse: "#10b981",
  messages: "#3b82f6",
  emploi: "#a855f7",
  union: "#f43f5e",
  finances: "#eab308",
};

// Doit rester en phase avec src/lib/gazetteConstants.js (GAZETTE_CATEGORY_LABELS) et les
// couleurs de src/components/views/GazetteAdminView.js (GAZETTE_CATEGORIES).
const GAZETTE_CATEGORY_LABELS = {
  DÉCRET: "Décret Impérial",
  ANNONCE: "Annonce Officielle",
  CHRONIQUE: "Chronique",
  NÉCROLOGIE: "Nécrologie",
  AVIS: "Avis de Recherche",
  COMMUNIQUÉ: "Communiqué",
};
const GAZETTE_CATEGORY_COLORS = {
  DÉCRET: 0xdc2626,
  ANNONCE: 0xd4af37,
  CHRONIQUE: 0x3b82f6,
  NÉCROLOGIE: 0x78716c,
  AVIS: 0xf97316,
  COMMUNIQUÉ: 0x22c55e,
};

function excerpt(text, max) {
  if (!text) return "";
  const clean = String(text).trim();
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
}

async function postToDiscord(webhookUrl, embeds) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds }),
  });
  if (!res.ok) {
    console.error("Échec envoi Discord :", res.status, await res.text());
  }
}

exports.notifyDiscord = onDocumentUpdated(
  { document: GAME_STATE_DOC, secrets: [DISCORD_WEBHOOK_URL] },
  async (event) => {
    const before = event.data?.before?.data() || {};
    const after = event.data?.after?.data() || {};
    const webhookUrl = DISCORD_WEBHOOK_URL.value();
    if (!webhookUrl) return;

    const timestamp = new Date().toISOString();
    const embeds = [];

    // --- Nouveaux articles de Gazette ---
    const beforeGazetteIds = new Set((before.gazette || []).map((g) => g.id));
    (after.gazette || []).forEach((g) => {
      if (beforeGazetteIds.has(g.id)) return;
      embeds.push({
        author: { name: "Gazette Impériale" },
        title: `📜 ${g.title || "Nouvelle publication"}`,
        description: [
          g.subtitle ? `*${g.subtitle}*` : null,
          excerpt(g.content, 300),
        ].filter(Boolean).join("\n\n") || undefined,
        color: GAZETTE_CATEGORY_COLORS[g.category] ?? COLORS.gazette,
        fields: [
          { name: "Catégorie", value: GAZETTE_CATEGORY_LABELS[g.category] || "Annonce Officielle", inline: true },
        ],
        footer: { text: [g.author, g.authorRole].filter(Boolean).join(" · ") || "Chancellerie Impériale" },
        timestamp,
      });
    });

    // --- Nouveaux posts Mushtagram réellement publics ---
    // Exclus : anonymes, verrouillés (PPV), réservés aux abonnés payants ou aux followers —
    // ces contenus ne doivent pas être diffusés gratuitement en dehors du site.
    const beforeMushIds = new Set((before.mushtagramPosts || []).map((p) => p.id));
    (after.mushtagramPosts || []).forEach((p) => {
      if (beforeMushIds.has(p.id)) return;
      if (p.isAnonymous || p.locked || p.subscribersOnly || p.followersOnly) return;
      embeds.push({
        author: { name: "Mushtagram" },
        title: `📸 Nouveau post de ${p.authorName || "un citoyen"}`,
        description: excerpt(p.content, 300) || "(publication sans texte)",
        color: COLORS.mushtagram,
        image: p.imageUrl ? { url: p.imageUrl } : undefined,
        fields: (p.hashtags || []).length
          ? [{ name: "Hashtags", value: p.hashtags.map((h) => `#${h}`).join(" ") }]
          : undefined,
        footer: { text: "Mushtagram" },
        timestamp,
      });
    });

    // --- Nouvelles cotations en Bourse (IPO) ---
    const beforeListingIds = new Set((before.bourseListings || []).map((l) => l.id));
    (after.bourseListings || []).forEach((l) => {
      if (beforeListingIds.has(l.id)) return;
      embeds.push({
        author: { name: "Bourse Impériale" },
        title: `📈 ${l.companyName} entre en bourse`,
        description: l.description ? excerpt(l.description, 250) : `Introduction en bourse sous le symbole **${l.symbol}**.`,
        color: COLORS.bourse,
        fields: [
          { name: "Symbole", value: l.symbol || "—", inline: true },
          { name: "Prix initial", value: `${l.initialPrice ?? "—"} écus`, inline: true },
          { name: "Actions émises", value: `${l.totalShares ?? "—"}`, inline: true },
        ],
        footer: { text: "Bourse Impériale" },
        timestamp,
      });
    });

    if (embeds.length === 0) return;

    // Discord limite à 10 embeds par message — on regroupe par paquets de 10.
    for (let i = 0; i < embeds.length; i += 10) {
      await postToDiscord(webhookUrl, embeds.slice(i, i + 10));
    }
  }
);

// Envoie une notification à un lot de tokens FCM. Les échecs individuels (token invalide,
// app désinstallée) ne font pas planter le lot — un token mort n'est pas nettoyé ici pour
// éviter d'écrire sur le document déclencheur (donc de retrigger la fonction) ; les tokens
// morts échouent simplement à chaque envoi, sans coût fonctionnel notable.
async function sendPush(tokens, notification, opts = {}) {
  if (!tokens || tokens.length === 0) {
    console.log(`Push ignoré (aucun token) : ${notification.title}`);
    return;
  }
  const message = { tokens, notification: { ...notification } };
  if (opts.imageUrl) message.notification.imageUrl = opts.imageUrl;
  if (opts.color) message.android = { notification: { color: opts.color } };
  try {
    const res = await getMessaging().sendEachForMulticast(message);
    console.log(`Push "${notification.title}" : ${res.successCount} succès / ${res.failureCount} échec(s) sur ${tokens.length} token(s)`);
    res.responses.forEach((r, i) => {
      if (!r.success) console.log(`  token ${i} échoué : ${r.error?.code} — ${r.error?.message}`);
    });
  } catch (e) {
    console.error("Échec envoi push :", e);
  }
}

exports.notifyPush = onDocumentUpdated(
  { document: GAME_STATE_DOC },
  async (event) => {
    const before = event.data?.before?.data() || {};
    const after = event.data?.after?.data() || {};

    const citizensWithTokens = (after.citizens || []).filter((c) => (c.pushTokens || []).length > 0);
    console.log(`notifyPush : ${citizensWithTokens.length} citoyen(s) avec au moins un token enregistré (sur ${(after.citizens || []).length} au total)`);

    // === DIFFUSION : Gazette / Mushtagram public / IPO Bourse, vers tous les appareils ===
    const broadcastNotifs = [];

    const beforeGazetteIds = new Set((before.gazette || []).map((g) => g.id));
    (after.gazette || []).forEach((g) => {
      if (beforeGazetteIds.has(g.id)) return;
      broadcastNotifs.push({ notif: { title: "📜 Gazette Impériale", body: g.title || "Nouvelle publication" }, color: PUSH_COLORS.gazette });
    });

    const beforeMushIds = new Set((before.mushtagramPosts || []).map((p) => p.id));
    (after.mushtagramPosts || []).forEach((p) => {
      if (beforeMushIds.has(p.id)) return;
      if (p.isAnonymous || p.locked || p.subscribersOnly || p.followersOnly) return;
      broadcastNotifs.push({
        notif: {
          title: `📸 ${p.authorName || "Un citoyen"} a publié sur Mushtagram`,
          body: excerpt(p.content, 120) || "Nouvelle publication",
        },
        color: PUSH_COLORS.mushtagram,
        imageUrl: p.imageUrl || undefined,
      });
    });

    const beforeListingIds = new Set((before.bourseListings || []).map((l) => l.id));
    (after.bourseListings || []).forEach((l) => {
      if (beforeListingIds.has(l.id)) return;
      broadcastNotifs.push({ notif: { title: "📈 Nouvelle cotation en Bourse", body: `${l.companyName} — symbole ${l.symbol}` }, color: PUSH_COLORS.bourse });
    });

    if (broadcastNotifs.length > 0) {
      const allTokens = [...new Set((after.citizens || []).flatMap((c) => c.pushTokens || []))];
      for (const { notif, color, imageUrl } of broadcastNotifs) {
        await sendPush(allTokens, notif, { color, imageUrl });
      }
    }

    // === PERSONNEL : uniquement au citoyen concerné ===
    const beforeCitizens = new Map((before.citizens || []).map((c) => [c.id, c]));

    for (const citizen of after.citizens || []) {
      const tokens = citizen.pushTokens || [];
      if (tokens.length === 0) continue;
      const prev = beforeCitizens.get(citizen.id) || {};
      const personalNotifs = [];

      // Nouveau message reçu
      const prevMsgIds = new Set((prev.messages || []).map((m) => m.id || m.date));
      (citizen.messages || []).forEach((m) => {
        if (m.read || prevMsgIds.has(m.id || m.date)) return;
        personalNotifs.push({ notif: { title: "✉️ Nouveau message", body: `De ${m.from || m.fromName || "Inconnu"}${m.subject ? ` — ${m.subject}` : ""}` }, color: PUSH_COLORS.messages });
      });

      // Nouvelle proposition d'union
      const prevProposalIds = new Set((prev.marriageProposals || []).map((p) => p.fromId));
      (citizen.marriageProposals || []).forEach((p) => {
        if (prevProposalIds.has(p.fromId)) return;
        personalNotifs.push({ notif: { title: "💍 Proposition d'union", body: `De ${p.fromName || "un citoyen"}` }, color: PUSH_COLORS.union });
      });

      // Nouvelle offre d'embauche
      const prevOfferIds = new Set((prev.jobOffers || []).map((o) => o.id));
      (citizen.jobOffers || []).forEach((o) => {
        if (prevOfferIds.has(o.id)) return;
        personalNotifs.push({ notif: { title: "💼 Offre d'embauche", body: o.companyName || "Une entreprise vous propose un poste" }, color: PUSH_COLORS.emploi });
      });

      for (const { notif, color, imageUrl } of personalNotifs) {
        await sendPush(tokens, notif, { color, imageUrl });
      }
    }

    // Alertes déjà ciblées par toId (Bourse, propriétés) — indépendantes de la boucle
    // ci-dessus puisqu'elles ne vivent pas sur le citoyen mais dans des tableaux à part.
    const citizensById = new Map((after.citizens || []).map((c) => [c.id, c]));

    const beforeBourseAlertIds = new Set((before.bourseAlerts || []).map((a) => a.id));
    for (const a of after.bourseAlerts || []) {
      if (beforeBourseAlertIds.has(a.id)) continue;
      const tokens = citizensById.get(a.toId)?.pushTokens || [];
      if (tokens.length === 0) continue;
      if (a.type === "dividend") {
        await sendPush(tokens, { title: "💰 Dividende reçu", body: `${a.amount} écus — ${a.symbol}` }, { color: PUSH_COLORS.bourse });
      } else if (a.type === "trade_filled") {
        await sendPush(tokens, { title: "📈 Ordre exécuté", body: `${a.qty} action(s) ${a.symbol} ${a.side === "buy" ? "achetée(s)" : "vendue(s)"} à ${a.price} écus` }, { color: PUSH_COLORS.bourse });
      }
    }

    const beforePropertyAlertIds = new Set((before.propertyAlerts || []).map((a) => a.id));
    for (const a of after.propertyAlerts || []) {
      if (beforePropertyAlertIds.has(a.id)) continue;
      const tokens = citizensById.get(a.toId)?.pushTokens || [];
      if (tokens.length === 0) continue;
      await sendPush(tokens, { title: "🏠 Propriétés", body: a.propertyName ? `Concernant ${a.propertyName}` : "Un événement concerne une de vos propriétés" }, { color: PUSH_COLORS.finances });
    }

    // Mushtagram (DM, abonnés, pourboires, déverrouillages...) — même source et même
    // filtre "priority: high" que la cloche de notification in-app (voir useNotifications.js),
    // aussi ciblé par toId.
    const MUSH_NOTIF_LABELS = {
      dm: (n) => ({ title: "💬 Nouveau message Mushtagram", body: `De ${n.fromName || "un citoyen"}${n.content ? ` — ${n.content}` : ""}` }),
      follow: (n) => ({ title: "👤 Nouvel abonné Mushtagram", body: `${n.fromName || "Un citoyen"} s'est abonné à vous` }),
      subscribe: (n) => ({ title: "⭐ Nouvel abonnement payant", body: `${n.fromName || "Un citoyen"} s'est abonné — ${n.content || ""}`.trim() }),
      unlock: (n) => ({ title: "🔓 Publication déverrouillée", body: `${n.fromName || "Un citoyen"} a déverrouillé votre publication` }),
      tip: (n) => ({ title: "💸 Pourboire reçu", body: `${n.fromName || "Un citoyen"} vous a envoyé ${n.content || "un pourboire"}` }),
      new_paid_post: (n) => ({ title: "🔒 Nouvelle publication réservée", body: `${n.fromName || "Un créateur"} a publié un contenu exclusif` }),
    };
    const beforeMushNotifIds = new Set((before.mushtagramNotifs || []).map((n) => n.id));
    for (const n of after.mushtagramNotifs || []) {
      if (beforeMushNotifIds.has(n.id)) continue;
      if (n.priority !== "high") continue;
      const tokens = citizensById.get(String(n.toId))?.pushTokens || [];
      if (tokens.length === 0) continue;
      const build = MUSH_NOTIF_LABELS[n.type];
      if (!build) continue;
      await sendPush(tokens, build(n), { color: PUSH_COLORS.mushtagram });
    }
  }
);
