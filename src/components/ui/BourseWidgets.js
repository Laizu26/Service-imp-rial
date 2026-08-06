import React from "react";
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
export const OrderBookDepth = ({ buyOrders = [], sellOrders = [], myId, onCancel, maxRows = 6 }) => {
  const buys = [...buyOrders].sort((a, b) => b.price - a.price).slice(0, maxRows);
  const sells = [...sellOrders].sort((a, b) => a.price - b.price).slice(0, maxRows);

  const Row = ({ o, side }) => {
    const isMine = o.citizenId === myId;
    const isCompany = o.citizenId === "COMPANY";
    return (
      <div className={`flex items-center justify-between px-2 py-1 rounded-lg text-[11px] ${side === "buy" ? "bg-green-50" : "bg-red-50"} ${isMine ? "ring-1 ring-amber-300" : ""}`}>
        <span className="font-mono font-bold text-stone-700">{o.qty}</span>
        <span className={`font-mono font-black ${side === "buy" ? "text-green-700" : "text-red-600"}`}>{formatMoney(o.price)}</span>
        {(isMine || (isCompany && onCancel)) && onCancel ? (
          <button
            onClick={() => onCancel(o.id, side)}
            className="text-[9px] text-stone-400 hover:text-red-500 font-bold uppercase ml-1"
            title="Annuler cet ordre"
          >
            ✕
          </button>
        ) : (
          <span className="text-[9px] text-stone-400 ml-1 truncate max-w-[70px]">{isCompany ? "Société" : (o.citizenName || "")}</span>
        )}
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
