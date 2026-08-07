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

    const embeds = [];

    // --- Nouveaux articles de Gazette ---
    const beforeGazetteIds = new Set((before.gazette || []).map((g) => g.id));
    (after.gazette || []).forEach((g) => {
      if (beforeGazetteIds.has(g.id)) return;
      embeds.push({
        title: "📜 Nouvelle publication — Gazette Impériale",
        description: g.title || "Nouvelle publication",
        color: COLORS.gazette,
        footer: { text: g.author || "Chancellerie" },
      });
    });

    // --- Nouveaux posts Mushtagram (comptes publics uniquement) ---
    const beforeMushIds = new Set((before.mushtagramPosts || []).map((p) => p.id));
    (after.mushtagramPosts || []).forEach((p) => {
      if (beforeMushIds.has(p.id) || p.isAnonymous) return;
      embeds.push({
        title: "📸 Nouveau post Mushtagram",
        description: (p.content || "(publication sans texte)").slice(0, 200),
        color: COLORS.mushtagram,
        footer: { text: p.authorName || "Citoyen" },
      });
    });

    // --- Nouvelles cotations en Bourse (IPO) ---
    const beforeListingIds = new Set((before.bourseListings || []).map((l) => l.id));
    (after.bourseListings || []).forEach((l) => {
      if (beforeListingIds.has(l.id)) return;
      embeds.push({
        title: "📈 Nouvelle cotation en Bourse",
        description: `${l.companyName} entre en bourse sous le symbole **${l.symbol}** à ${l.initialPrice} écus/action.`,
        color: COLORS.bourse,
      });
    });

    if (embeds.length === 0) return;

    // Discord limite à 10 embeds par message — on regroupe par paquets de 10.
    for (let i = 0; i < embeds.length; i += 10) {
      await postToDiscord(webhookUrl, embeds.slice(i, i + 10));
    }
  }
);
