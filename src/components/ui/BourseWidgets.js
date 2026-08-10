import React, { useState } from "react";
import { TrendingUp, TrendingDown, Landmark, X } from "lucide-react";
import { formatMoney } from "../../lib/gameUtils";

/* ── Mini-graphe d'historique de prix ── */
export const PriceSparkline = ({ history, width = 56, height = 18 }) => {
  if (!history || history.length < 2) return null;
  const prices = history.slice(0, 15).map((h) => h.price).reverse();
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const points = prices
    .map((p, i) => `${(i / (prices.length - 1)) * width},${height - ((p - min) / range) * height}`)
    .join(" ");
  const color = prices[prices.length - 1] >= prices[0] ? "#10b981" : "#ef4444";
  return (
    <svg width={width} height={height} className="opacity-80 shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
};

/* ── Graphe de cours avec sélecteur de période (jour / semaine / mois / tout) ── */
const HISTORY_RANGES = [
  { id: "day", label: "Jour", ms: 24 * 60 * 60 * 1000 },
  { id: "week", label: "Semaine", ms: 7 * 24 * 60 * 60 * 1000 },
  { id: "month", label: "Mois", ms: 30 * 24 * 60 * 60 * 1000 },
  { id: "all", label: "Tout", ms: Infinity },
];

export const PriceHistoryChart = ({ history = [], height = 110, defaultRange = "week" }) => {
  const [range, setRange] = useState(defaultRange);
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
  if (sorted.length < 2) {
    return <p className="text-xs text-stone-400 italic text-center py-4">Pas assez de transactions pour un graphique.</p>;
  }
  const rangeDef = HISTORY_RANGES.find((r) => r.id === range) || HISTORY_RANGES[1];
  const now = Date.now();
  const filtered = rangeDef.ms === Infinity ? sorted : sorted.filter((h) => now - h.timestamp <= rangeDef.ms);
  // Si trop peu de transactions sont tombées dans la période choisie, on retombe sur tout
  // l'historique disponible plutôt que d'afficher un graphique vide ou à un seul point.
  const tooSparse = filtered.length < 2;
  const points = tooSparse ? sorted : filtered;

  const width = 320;
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const spread = max - min || 1;
  const pad = 6;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = pad + (height - pad * 2) - ((p.price - min) / spread) * (height - pad * 2);
    return [x, y];
  });
  const linePoints = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const areaPoints = `0,${height} ${linePoints} ${width},${height}`;
  const trendUp = points[points.length - 1].price >= points[0].price;
  const color = trendUp ? "#10b981" : "#ef4444";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
        <div className="flex gap-1">
          {HISTORY_RANGES.map((r) => (
            <button key={r.id} onClick={() => setRange(r.id)}
              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide transition-colors ${
                range === r.id ? "bg-stone-800 text-amber-400" : "bg-stone-100 text-stone-400 hover:text-stone-600"
              }`}>
              {r.label}
            </button>
          ))}
        </div>
        <div className="text-[9px] text-stone-400">
          {points.length} point{points.length > 1 ? "s" : ""}{tooSparse && range !== "all" ? " (hors période, tout l'historique affiché)" : ""}
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="block">
        <polygon points={areaPoints} fill={color} opacity="0.08" />
        <polyline points={linePoints} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="flex items-center justify-between text-[9px] text-stone-400 font-mono">
        <span>{formatMoney(min)}</span>
        <span>{formatMoney(max)}</span>
      </div>
    </div>
  );
};

/* ── Variation % par rapport à un prix de référence (ex: cours d'IPO) ── */
export const pctChange = (current, reference) => {
  if (!reference) return 0;
  return ((current - reference) / reference) * 100;
};

export const PriceChangeBadge = ({ current, reference, size = "sm" }) => {
  const pct = pctChange(current, reference);
  const isUp = pct > 0, isDown = pct < 0;
  const sizeCls = size === "lg" ? "text-sm" : "text-[10px]";
  return (
    <div className={`flex items-center gap-0.5 font-black ${sizeCls} ${isUp ? "text-green-600" : isDown ? "text-red-500" : "text-stone-400"}`}>
      {isUp ? <TrendingUp size={size === "lg" ? 13 : 10} /> : isDown ? <TrendingDown size={size === "lg" ? 13 : 10} /> : null}
      {pct !== 0 ? `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%` : "—"}
    </div>
  );
};

/* ── Ticker : symbole + société, réutilisé dans les 3 vues Bourse ── */
export const BourseTicker = ({ symbol, className = "" }) => (
  <div className={`bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 min-w-[60px] text-center shrink-0 ${className}`}>
    <div className="font-black font-mono text-emerald-700 text-sm">{symbol}</div>
  </div>
);

/* ── Profondeur du carnet d'ordres : colonnes achat / vente ── */
// ownerId (optionnel) : dirigeant de la société cotée — ses propres ordres sont signalés d'un
// badge "Dir." dans le carnet, pour qu'un rachat massif de ses propres titres reste visible au
// lieu de se fondre anonymement parmi les autres ordres.
export const OrderBookDepth = ({ buyOrders = [], sellOrders = [], myId, ownerId, onCancel, maxRows = 6 }) => {
  const buys = [...buyOrders].sort((a, b) => b.price - a.price).slice(0, maxRows);
  const sells = [...sellOrders].sort((a, b) => a.price - b.price).slice(0, maxRows);

  const Row = ({ o, side }) => {
    const isMine = o.citizenId === myId;
    const isCompany = o.citizenId === "COMPANY";
    const isOwner = !isCompany && ownerId && String(o.citizenId) === String(ownerId);
    const canCancel = (isMine || (isCompany && onCancel)) && onCancel;
    return (
      <div className={`flex items-center justify-between px-2 py-1 rounded-lg text-[11px] ${side === "buy" ? "bg-green-50" : "bg-red-50"} ${isMine ? "ring-1 ring-amber-300" : ""}`}>
        <span className="font-mono font-bold text-stone-700">{o.qty}</span>
        <span className={`font-mono font-black ${side === "buy" ? "text-green-700" : "text-red-600"}`}>{formatMoney(o.price)}</span>
        <span className="flex items-center gap-1 ml-1 shrink-0">
          {isOwner && (
            <span className="text-[8px] font-black uppercase bg-amber-100 text-amber-700 px-1 rounded" title="Ordre du dirigeant de la société">Dir.</span>
          )}
          {canCancel ? (
            <button
              onClick={() => onCancel(o.id, side)}
              className="text-[9px] text-stone-400 hover:text-red-500 font-bold uppercase"
              title="Annuler cet ordre"
            >
              ✕
            </button>
          ) : (
            <span className="text-[9px] text-stone-400 truncate max-w-[70px]">{isCompany ? "Société" : (o.citizenName || "")}</span>
          )}
        </span>
      </div>
    );
  };

  if (buys.length === 0 && sells.length === 0) {
    return <p className="text-xs text-stone-400 italic text-center py-3">Aucun ordre en attente.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <div className="text-[9px] font-black uppercase text-green-600 tracking-widest px-1">Achat ({buys.length})</div>
        {buys.length === 0 ? <p className="text-[10px] text-stone-300 italic px-2">—</p> : buys.map((o) => <Row key={o.id} o={o} side="buy" />)}
      </div>
      <div className="space-y-1">
        <div className="text-[9px] font-black uppercase text-red-500 tracking-widest px-1">Vente ({sells.length})</div>
        {sells.length === 0 ? <p className="text-[10px] text-stone-300 italic px-2">—</p> : sells.map((o) => <Row key={o.id} o={o} side="sell" />)}
      </div>
    </div>
  );
};

/* ── Conseil d'administration : propositions et votes pondérés par actions ──
   Composant partagé entre CitizenBourseView (n'importe quel actionnaire) et l'onglet Bourse
   de MyCompanyView (dirigeant/PDG), pour n'avoir qu'une seule interface de vote. */
const BOARD_TYPE_META = {
  REVOKE_CEO: { label: "Révoquer le PDG", badge: "bg-red-100 text-red-700 border-red-200" },
  DIVIDEND: { label: "Dividende", badge: "bg-amber-100 text-amber-700 border-amber-200" },
  CUSTOM: { label: "Proposition", badge: "bg-stone-100 text-stone-600 border-stone-200" },
};
const BOARD_STATUS_META = {
  PASSED: { label: "Adoptée", cls: "bg-green-100 text-green-700 border-green-200" },
  REJECTED: { label: "Rejetée", cls: "bg-red-100 text-red-700 border-red-200" },
  EXPIRED: { label: "Expirée (quorum non atteint)", cls: "bg-stone-100 text-stone-500 border-stone-200" },
  CANCELLED: { label: "Annulée", cls: "bg-stone-100 text-stone-500 border-stone-200" },
};

export const BoardVotingPanel = ({
  listing, company, citizens = [], myId, dayCycle = 0,
  proposals = [], onCreateBoardProposal, onCastBoardVote, onCancelBoardProposal,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "CUSTOM", title: "", description: "", dividendPerShare: "", durationDays: "3" });

  const myShares = (citizens.find((c) => c.id === myId)?.stockholdings || {})[listing.id] || 0;
  const listingProposals = proposals.filter((p) => p.listingId === listing.id);
  const openProposals = listingProposals.filter((p) => p.status === "OPEN").sort((a, b) => a.deadlineDayCycle - b.deadlineDayCycle);
  const resolvedProposals = listingProposals.filter((p) => p.status !== "OPEN").sort((a, b) => (b.resolvedAt || 0) - (a.resolvedAt || 0)).slice(0, 5);

  const weightOf = (citizenId) => (citizens.find((c) => String(c.id) === String(citizenId))?.stockholdings || {})[listing.id] || 0;

  const submitProposal = () => {
    if (!onCreateBoardProposal || !form.title.trim()) return;
    onCreateBoardProposal({
      listingId: listing.id,
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      params: form.type === "DIVIDEND" ? { dividendPerShare: parseFloat(form.dividendPerShare) || 0 } : {},
      durationDays: parseInt(form.durationDays) || 3,
    });
    setForm({ type: "CUSTOM", title: "", description: "", dividendPerShare: "", durationDays: "3" });
    setShowForm(false);
  };

  return (
    <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-indigo-700 tracking-widest">
          <Landmark size={13} /> Conseil d'administration
        </div>
        {onCreateBoardProposal && myShares > 0 && (
          <button onClick={() => setShowForm((v) => !v)}
            className="text-[9px] font-black uppercase px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-500">
            {showForm ? "Annuler" : "+ Proposition"}
          </button>
        )}
      </div>

      {myShares === 0 && (
        <p className="text-[10px] text-stone-400 italic">Seuls les actionnaires de {listing.symbol} peuvent proposer ou voter ici.</p>
      )}

      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="p-2 border border-stone-200 rounded text-xs bg-white">
              <option value="CUSTOM">Proposition libre</option>
              {company?.ceoId && <option value="REVOKE_CEO">Révoquer le PDG</option>}
              <option value="DIVIDEND">Verser un dividende</option>
            </select>
            <select value={form.durationDays} onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
              className="p-2 border border-stone-200 rounded text-xs bg-white">
              {[1, 2, 3, 5, 7].map((d) => <option key={d} value={d}>{d} jour{d > 1 ? "s" : ""} de vote</option>)}
            </select>
          </div>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Titre de la proposition" maxLength={80}
            className="w-full p-2 border border-stone-200 rounded text-xs" />
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Détails (optionnel)" rows={2} maxLength={400}
            className="w-full p-2 border border-stone-200 rounded text-xs resize-none" />
          {form.type === "DIVIDEND" && (
            <input type="number" min={0} step={0.1} value={form.dividendPerShare}
              onChange={(e) => setForm((f) => ({ ...f, dividendPerShare: e.target.value }))}
              placeholder="Dividende par action (Écus)"
              className="w-full p-2 border border-stone-200 rounded text-xs font-mono" />
          )}
          <button onClick={submitProposal} disabled={!form.title.trim()}
            className="w-full bg-indigo-600 text-white py-2 rounded text-xs font-black uppercase hover:bg-indigo-500 disabled:opacity-40">
            Soumettre au vote
          </button>
        </div>
      )}

      {openProposals.length === 0 && resolvedProposals.length === 0 && !showForm && (
        <p className="text-[10px] text-stone-400 italic">Aucune proposition en cours.</p>
      )}

      {openProposals.map((p) => {
        const votes = p.votes || {};
        const forW = Object.entries(votes).filter(([, v]) => v === "FOR").reduce((s, [id]) => s + weightOf(id), 0);
        const againstW = Object.entries(votes).filter(([, v]) => v === "AGAINST").reduce((s, [id]) => s + weightOf(id), 0);
        const abstainW = Object.entries(votes).filter(([, v]) => v === "ABSTAIN").reduce((s, [id]) => s + weightOf(id), 0);
        const totalCast = forW + againstW + abstainW;
        const forPct = totalCast > 0 ? Math.round((forW / totalCast) * 100) : 0;
        const myVote = votes[myId];
        const daysLeft = Math.max(0, p.deadlineDayCycle - dayCycle);
        const typeMeta = BOARD_TYPE_META[p.type] || BOARD_TYPE_META.CUSTOM;
        return (
          <div key={p.id} className="bg-white border border-indigo-200 rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase ${typeMeta.badge}`}>{typeMeta.label}</span>
                  <span className="text-xs font-bold text-stone-800">{p.title}</span>
                </div>
                {p.description && <p className="text-[10px] text-stone-500 mt-0.5">{p.description}</p>}
                {p.type === "DIVIDEND" && p.params?.dividendPerShare > 0 && (
                  <p className="text-[10px] text-amber-700 font-bold mt-0.5">{formatMoney(p.params.dividendPerShare)}/action</p>
                )}
                <p className="text-[9px] text-stone-400 mt-0.5">Proposé par {p.proposedByName} — {daysLeft > 0 ? `${daysLeft} jour(s) restant(s)` : "clôture aujourd'hui"}</p>
              </div>
              {String(p.proposedBy) === String(myId) && onCancelBoardProposal && (
                <button onClick={() => onCancelBoardProposal(p.id)} className="text-stone-400 hover:text-red-500 shrink-0"><X size={14} /></button>
              )}
            </div>
            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${forPct}%` }} />
            </div>
            <div className="text-[9px] text-stone-400">{forPct}% pour ({totalCast.toLocaleString()} action(s) exprimée(s))</div>
            {myShares > 0 && onCastBoardVote && (
              <div className="flex gap-1.5">
                {[
                  { choice: "FOR", label: "Pour", active: "bg-green-600 text-white border-green-600", idle: "bg-white text-stone-500 border-stone-200 hover:border-green-300" },
                  { choice: "AGAINST", label: "Contre", active: "bg-red-600 text-white border-red-600", idle: "bg-white text-stone-500 border-stone-200 hover:border-red-300" },
                  { choice: "ABSTAIN", label: "Abstention", active: "bg-stone-600 text-white border-stone-600", idle: "bg-white text-stone-500 border-stone-200 hover:border-stone-400" },
                ].map(({ choice, label, active, idle }) => (
                  <button key={choice} onClick={() => onCastBoardVote({ proposalId: p.id, choice })}
                    className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase border transition-colors ${myVote === choice ? active : idle}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {resolvedProposals.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-indigo-200">
          <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Historique récent</div>
          {resolvedProposals.map((p) => {
            const statusMeta = BOARD_STATUS_META[p.status] || BOARD_STATUS_META.EXPIRED;
            return (
              <div key={p.id} className="flex items-center justify-between text-[10px] bg-white border border-stone-100 rounded px-2 py-1.5">
                <span className="text-stone-600 truncate">{p.title}</span>
                <span className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase shrink-0 ml-2 ${statusMeta.cls}`}>{statusMeta.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
