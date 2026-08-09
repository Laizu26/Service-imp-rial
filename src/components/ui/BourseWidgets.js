import React, { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
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
