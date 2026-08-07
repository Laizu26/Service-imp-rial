const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");

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
