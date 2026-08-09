import React, { useState } from "react";
import { TrendingUp, BarChart2, History, Search, X, ChevronDown, ChevronUp, ListOrdered } from "lucide-react";
import { formatMoney } from "../../lib/gameUtils";
import { PriceSparkline, PriceHistoryChart, PriceChangeBadge, BourseTicker, OrderBookDepth } from "../ui/BourseWidgets";

const BOURSE_DAILY_CAP = 0.3;

/* ── Formulaire de placement d'ordre (achat ou vente) ── */
const OrderForm = ({ listing, user, side, onSubmit, onCancel }) => {
  const bestOpposite = side === "buy"
    ? [...(listing.sellOrders || [])].sort((a, b) => a.price - b.price)[0]
    : [...(listing.buyOrders || [])].sort((a, b) => b.price - a.price)[0];
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(bestOpposite?.price ?? listing.lastPrice ?? listing.initialPrice);

  const capBase = listing.dayOpenPrice || listing.lastPrice || listing.initialPrice;
  const minAllowed = Math.round(capBase * (1 - BOURSE_DAILY_CAP) * 10) / 10;
  const maxAllowed = Math.round(capBase * (1 + BOURSE_DAILY_CAP) * 10) / 10;
  const priceNum = parseFloat(price) || 0;
  const priceValid = priceNum >= minAllowed && priceNum <= maxAllowed;
  const qtyNum = parseInt(qty) || 0;
  const cost = qtyNum * priceNum;
  const canAfford = side === "sell" || (user.balance || 0) >= cost;

  const now = Date.now();
  const lockedQty = (user.esppLocks || []).filter((l) => l.listingId === listing.id && l.unlocksAt > now).reduce((s, l) => s + l.qty, 0);
  const openSellQty = (listing.sellOrders || []).filter((o) => o.citizenId === user.id).reduce((s, o) => s + o.qty, 0);
  const held = (user.stockholdings || {})[listing.id] || 0;
  const sellable = Math.max(0, held - lockedQty - openSellQty);
  const canSell = side === "buy" || qtyNum <= sellable;

  return (
    <div className={`rounded-xl p-3 space-y-2 ${side === "buy" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-black uppercase tracking-widest ${side === "buy" ? "text-green-700" : "text-red-600"}`}>
          Ordre {side === "buy" ? "d'achat" : "de vente"} — {listing.symbol}
        </span>
        <button onClick={onCancel} className="text-stone-400 hover:text-stone-600"><X size={13} /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] font-bold uppercase text-stone-500 block mb-0.5">Quantité</label>
          <input type="number" min={1} max={side === "sell" ? sellable : undefined} value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full p-1.5 border border-stone-200 rounded font-mono text-sm text-center bg-white outline-none focus:border-stone-400" />
        </div>
        <div>
          <label className="text-[9px] font-bold uppercase text-stone-500 block mb-0.5">Prix limite / action</label>
          <input type="number" step="0.1" value={price} onChange={(e) => setPrice(e.target.value)}
            className="w-full p-1.5 border border-stone-200 rounded font-mono text-sm text-center bg-white outline-none focus:border-stone-400" />
        </div>
      </div>
      <div className="text-[9px] text-stone-500">
        Plafond du jour : {formatMoney(minAllowed)} – {formatMoney(maxAllowed)}
        {side === "sell" && <span className="ml-2">· Cessibles : {sellable}</span>}
      </div>
      {side === "buy" && (
        <div className="text-[10px] text-stone-600">
          Coût maximum réservé : <span className="font-black">{formatMoney(cost)}</span> (remboursé si exécuté à un prix inférieur)
        </div>
      )}
      {!priceValid && <div className="text-[10px] text-red-600 font-bold">Prix hors plafond journalier.</div>}
      {side === "buy" && !canAfford && <div className="text-[10px] text-red-600 font-bold">Fonds insuffisants.</div>}
      {side === "sell" && !canSell && <div className="text-[10px] text-red-600 font-bold">Quantité supérieure à ce que vous pouvez vendre.</div>}
      <button
        disabled={qtyNum <= 0 || !priceValid || !canAfford || !canSell}
        onClick={() => onSubmit({ listingId: listing.id, side, qty: qtyNum, price: priceNum })}
        className={`w-full py-2 text-xs font-black uppercase rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          side === "buy" ? "bg-green-600 text-white hover:bg-green-500" : "bg-red-500 text-white hover:bg-red-400"
        }`}>
        Placer l'ordre
      </button>
    </div>
  );
};

const CitizenBourseView = ({ user, citizens = [], bourseListings = [], onBoursePlaceOrder, onBourseCancelOrder, globalLedger = [] }) => {
  const [bourseTab, setBourseTab] = useState("market");
  const [bourseSearch, setBourseSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [formSide, setFormSide] = useState(null); // "buy" | "sell" | null

  const activeListings = bourseListings.filter((l) => l.isActive);
  const myHoldings = Object.entries(user.stockholdings || {}).filter(([lid, qty]) =>
    qty > 0 && bourseListings.some((l) => l.id === lid)
  );
  const portfolioValue = myHoldings.reduce((sum, [lid, qty]) => {
    const l = bourseListings.find((x) => x.id === lid);
    return sum + (l ? (l.lastPrice || l.initialPrice) * qty : 0);
  }, 0);

  const myOpenOrders = bourseListings.flatMap((l) => [
    ...(l.buyOrders || []).filter((o) => o.citizenId === user.id).map((o) => ({ ...o, side: "buy", listing: l })),
    ...(l.sellOrders || []).filter((o) => o.citizenId === user.id).map((o) => ({ ...o, side: "sell", listing: l })),
  ]);

  const filteredListings = activeListings.filter((l) => {
    const q = bourseSearch.toLowerCase();
    return !q || l.symbol.toLowerCase().includes(q) || l.companyName.toLowerCase().includes(q);
  });

  const toggleExpand = (id) => {
    setExpandedId((cur) => (cur === id ? null : id));
    setFormSide(null);
  };

  const submitOrder = (payload) => {
    onBoursePlaceOrder(payload);
    setFormSide(null);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* En-tête */}
      <div className="bg-gradient-to-br from-stone-900 to-emerald-950/30 border border-emerald-900/40 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-8xl opacity-5 select-none">📈</div>
        <div className="relative">
          <h2 className="text-2xl font-black font-serif text-stone-100 flex items-center gap-2">
            <TrendingUp size={22} className="text-emerald-400" /> Bourse Impériale
          </h2>
          <p className="text-xs text-stone-400 mt-1">Placez des ordres d'achat et de vente — le cours se forme par les échanges entre citoyens.</p>
          <div className="flex gap-3 mt-3 flex-wrap">
            <div className="bg-emerald-900/30 border border-emerald-800/40 rounded-lg px-3 py-1.5">
              <div className="text-[8px] text-emerald-500 uppercase font-black">Sociétés cotées</div>
              <div className="text-lg font-black text-emerald-300">{activeListings.length}</div>
            </div>
            <div className="bg-amber-900/30 border border-amber-800/40 rounded-lg px-3 py-1.5">
              <div className="text-[8px] text-amber-500 uppercase font-black">Mon portefeuille</div>
              <div className="text-lg font-black font-mono text-amber-300">{formatMoney(portfolioValue)}</div>
            </div>
            <div className="bg-stone-800/40 border border-stone-700 rounded-lg px-3 py-1.5">
              <div className="text-[8px] text-stone-500 uppercase font-black">Mes lignes</div>
              <div className="text-lg font-black text-stone-200">{myHoldings.length}</div>
            </div>
            <div className="bg-blue-900/30 border border-blue-800/40 rounded-lg px-3 py-1.5">
              <div className="text-[8px] text-blue-400 uppercase font-black">Ordres en attente</div>
              <div className="text-lg font-black text-blue-300">{myOpenOrders.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200">
        {[
          { id: "market", label: "Marché", icon: <TrendingUp size={12} /> },
          { id: "portfolio", label: "Mon Portefeuille", icon: <BarChart2 size={12} /> },
          { id: "orders", label: "Mes Ordres", icon: <ListOrdered size={12} /> },
          { id: "history", label: "Mes Transactions", icon: <History size={12} /> },
        ].map((t) => (
          <button key={t.id} onClick={() => setBourseTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 -mb-px transition-all ${
              bourseTab === t.id ? "border-emerald-500 text-emerald-700" : "border-transparent text-stone-400 hover:text-stone-600"
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* === MARCHÉ === */}
      {bourseTab === "market" && (
        <div className="space-y-2">
          {activeListings.length === 0 ? (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center">
              <TrendingUp size={36} className="mx-auto text-stone-300 mb-3" />
              <p className="text-sm text-stone-500">Aucune société n'est cotée pour le moment.</p>
            </div>
          ) : (
            <>
              <div className="relative mb-1">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input value={bourseSearch} onChange={(e) => setBourseSearch(e.target.value)}
                  placeholder="Rechercher un symbole ou une société..."
                  className="w-full pl-8 pr-3 py-2 border border-stone-200 rounded-lg text-xs bg-white outline-none focus:border-emerald-400" />
              </div>
              {filteredListings.length === 0 && (
                <div className="text-center text-stone-400 italic text-xs py-6">Aucun résultat pour "{bourseSearch}"</div>
              )}
              {filteredListings.map((listing) => {
                const myShares = (user.stockholdings || {})[listing.id] || 0;
                const isExpanded = expandedId === listing.id;
                const bestBid = [...(listing.buyOrders || [])].sort((a, b) => b.price - a.price)[0];
                const bestAsk = [...(listing.sellOrders || [])].sort((a, b) => a.price - b.price)[0];
                // Actions en circulation (détenues par un citoyen), en réserve chez la société
                // (offertes sur le marché mais pas encore achetées), et jamais émises du tout —
                // pour clarifier l'écart entre le capital total et ce qui s'échange vraiment.
                const totalHeld = citizens.reduce((s, c) => s + ((c.stockholdings || {})[listing.id] || 0), 0);
                const companyFloat = (listing.sellOrders || []).filter((o) => o.citizenId === "COMPANY").reduce((s, o) => s + o.qty, 0);
                const unissued = Math.max(0, (listing.totalShares || 0) - totalHeld - companyFloat);
                return (
                  <div key={listing.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                    <button onClick={() => toggleExpand(listing.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-left">
                      <BourseTicker symbol={listing.symbol} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-stone-800 text-sm truncate">{listing.companyName}</div>
                        {listing.description && <div className="text-[10px] text-stone-400 truncate">{listing.description}</div>}
                      </div>
                      <PriceSparkline history={listing.priceHistory} />
                      {isExpanded ? <ChevronUp size={14} className="text-stone-400 shrink-0" /> : <ChevronDown size={14} className="text-stone-400 shrink-0" />}
                    </button>
                    {/* Dernier / Achat / Vente — même poids visuel, pour ne pas laisser croire
                        que le "dernier prix" est ce qu'on peut réellement obtenir tout de suite. */}
                    <div className="grid grid-cols-3 divide-x divide-stone-100 border-t border-stone-100 bg-stone-50/50">
                      <div className="px-3 py-2 text-center">
                        <div className="text-[8px] font-black uppercase tracking-widest text-stone-400">Dernier</div>
                        <div className="font-black font-mono text-stone-800 text-sm">{formatMoney(listing.lastPrice || listing.initialPrice)}</div>
                        <PriceChangeBadge current={listing.lastPrice || listing.initialPrice} reference={listing.initialPrice} />
                      </div>
                      <div className="px-3 py-2 text-center">
                        <div className="text-[8px] font-black uppercase tracking-widest text-green-600">Meilleur achat</div>
                        <div className="font-black font-mono text-green-700 text-sm">{bestBid ? formatMoney(bestBid.price) : "—"}</div>
                        <div className="text-[8px] text-stone-400">{bestBid ? `${bestBid.qty} en attente` : "aucun ordre"}</div>
                      </div>
                      <div className="px-3 py-2 text-center">
                        <div className="text-[8px] font-black uppercase tracking-widest text-red-500">Meilleure vente</div>
                        <div className="font-black font-mono text-red-600 text-sm">{bestAsk ? formatMoney(bestAsk.price) : "—"}</div>
                        <div className="text-[8px] text-stone-400">{bestAsk ? `${bestAsk.qty} en attente` : "aucun ordre"}</div>
                      </div>
                    </div>
                    {myShares > 0 && (
                      <div className="px-4 py-1.5 border-t border-stone-100 text-[9px] text-amber-600 font-bold text-center">
                        Vous détenez : {myShares} action{myShares > 1 ? "s" : ""}
                      </div>
                    )}
                    {isExpanded && (
                      <div className="px-4 py-3 border-t border-stone-100 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap text-[9px] text-stone-500 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
                          <span>Capital total : <strong className="text-stone-700">{listing.totalShares || 0}</strong></span>
                          <span className="text-stone-300">|</span>
                          <span>En circulation : <strong className="text-stone-700">{totalHeld}</strong></span>
                          <span className="text-stone-300">|</span>
                          <span>Offertes sur le marché : <strong className="text-stone-700">{companyFloat}</strong></span>
                          {unissued > 0 && (
                            <>
                              <span className="text-stone-300">|</span>
                              <span>En réserve (non émises) : <strong className="text-stone-700">{unissued}</strong></span>
                            </>
                          )}
                        </div>
                        <OrderBookDepth buyOrders={listing.buyOrders} sellOrders={listing.sellOrders} myId={user.id} ownerId={listing.ownerId} onCancel={(orderId, side) => onBourseCancelOrder({ listingId: listing.id, orderId, side })} />
                        {(listing.priceHistory || []).length > 1 && (
                          <div className="bg-stone-50 border border-stone-100 rounded-lg p-3">
                            <PriceHistoryChart history={listing.priceHistory} />
                          </div>
                        )}
                        {(listing.priceHistory || []).length > 1 && (
                          <details className="bg-stone-50 border border-stone-100 rounded-lg">
                            <summary className="px-3 py-2 cursor-pointer text-[9px] font-black uppercase tracking-widest text-stone-500 select-none hover:text-stone-700">
                              Historique des cours ({listing.priceHistory.length})
                            </summary>
                            <div className="px-3 pb-2 max-h-40 overflow-y-auto space-y-1">
                              {listing.priceHistory.map((h, i) => (
                                <div key={i} className="flex items-center justify-between text-[10px]">
                                  <span className="text-stone-400">{new Date(h.timestamp).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                  <span className="font-mono font-bold text-stone-700">{formatMoney(h.price)}</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                        {formSide && expandedId === listing.id ? (
                          <OrderForm listing={listing} user={user} side={formSide} onSubmit={submitOrder} onCancel={() => setFormSide(null)} />
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => setFormSide("buy")} className="flex-1 py-2 bg-green-600 text-white text-xs font-black uppercase rounded-lg hover:bg-green-500 transition-colors">Acheter</button>
                            <button onClick={() => setFormSide("sell")} disabled={myShares <= 0} className="flex-1 py-2 bg-red-500 text-white text-xs font-black uppercase rounded-lg hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Vendre</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* === PORTEFEUILLE === */}
      {bourseTab === "portfolio" && (
        <div className="space-y-3">
          {myHoldings.length === 0 ? (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center">
              <BarChart2 size={36} className="mx-auto text-stone-300 mb-3" />
              <p className="text-sm text-stone-500">Vous ne possédez aucune action.</p>
              <button onClick={() => setBourseTab("market")} className="text-emerald-600 text-xs underline mt-2">Aller au marché</button>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
                <div className="text-[10px] text-amber-600 uppercase font-black tracking-widest">Valeur totale du portefeuille</div>
                <div className="text-3xl font-black font-mono text-amber-700 mt-1">{formatMoney(portfolioValue)}</div>
                <div className="text-xs text-amber-500 mt-0.5">{myHoldings.length} ligne(s) — solde personnel : {formatMoney(user.balance || 0)}</div>
              </div>
              {myHoldings.map(([lid, qty]) => {
                const listing = bourseListings.find((l) => l.id === lid);
                if (!listing) return null;
                const price = listing.lastPrice || listing.initialPrice;
                const value = price * qty;
                const now = Date.now();
                const lockedQty = (user.esppLocks || []).filter((l) => l.listingId === lid && l.unlocksAt > now).reduce((s, l) => s + l.qty, 0);
                const openSellQty = (listing.sellOrders || []).filter((o) => o.citizenId === user.id).reduce((s, o) => s + o.qty, 0);
                const isExpanded = expandedId === lid;
                return (
                  <div key={lid} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                    <button onClick={() => toggleExpand(lid)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-left">
                      <BourseTicker symbol={listing.symbol} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-stone-800 text-sm truncate">{listing.companyName}</div>
                        <div className="text-[10px] text-stone-500">{qty.toLocaleString()} action(s) × {formatMoney(price)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black font-mono text-stone-800 text-base">{formatMoney(value)}</div>
                        <PriceChangeBadge current={price} reference={listing.initialPrice} />
                      </div>
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-stone-50 border-t border-stone-100 text-[9px] flex-wrap">
                      {lockedQty > 0 && <span className="text-amber-600 font-bold">🔒 {lockedQty} bloquée(s) ESPP</span>}
                      {openSellQty > 0 && <span className="text-red-500 font-bold">{openSellQty} en ordre de vente</span>}
                    </div>
                    {isExpanded && (
                      <div className="px-4 py-3 border-t border-stone-100 space-y-3">
                        {formSide ? (
                          <OrderForm listing={listing} user={user} side={formSide} onSubmit={submitOrder} onCancel={() => setFormSide(null)} />
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => setFormSide("sell")} className="flex-1 py-2 bg-red-500 text-white text-xs font-black uppercase rounded-lg hover:bg-red-400 transition-colors">Vendre</button>
                            <button onClick={() => setFormSide("buy")} className="flex-1 py-2 bg-green-600 text-white text-xs font-black uppercase rounded-lg hover:bg-green-500 transition-colors">Acheter plus</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* === MES ORDRES === */}
      {bourseTab === "orders" && (
        <div className="space-y-2">
          {myOpenOrders.length === 0 ? (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center text-stone-400 italic text-xs">
              Aucun ordre en attente.
            </div>
          ) : (
            myOpenOrders.sort((a, b) => b.timestamp - a.timestamp).map((o) => (
              <div key={o.id} className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <BourseTicker symbol={o.listing.symbol} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-stone-700">
                    {o.side === "buy" ? "Achat" : "Vente"} · {o.qty} action(s) à {formatMoney(o.price)}
                  </div>
                  <div className="text-[9px] text-stone-400">{new Date(o.timestamp).toLocaleString("fr-FR")}</div>
                </div>
                <button
                  onClick={() => onBourseCancelOrder({ listingId: o.listing.id, orderId: o.id, side: o.side })}
                  className="px-3 py-1.5 bg-white border border-stone-300 text-stone-500 text-[10px] font-black uppercase rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">
                  Annuler
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* === HISTORIQUE === */}
      {bourseTab === "history" && (() => {
        const myBourseHistory = (globalLedger || [])
          .filter((e) => ["BOURSE_TRADE", "BOURSE_DIVIDEND", "ESPP_BUY"].includes(e.type) && (e.fromName === user.name || e.toName === user.name))
          .slice(0, 40);
        const typeLabel = { BOURSE_TRADE: "Échange", BOURSE_DIVIDEND: "Dividende", ESPP_BUY: "ESPP" };
        const typeColor = { BOURSE_TRADE: "text-blue-600 bg-blue-50 border-blue-200", BOURSE_DIVIDEND: "text-amber-600 bg-amber-50 border-amber-200", ESPP_BUY: "text-emerald-600 bg-emerald-50 border-emerald-200" };
        return myBourseHistory.length === 0 ? (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center text-stone-400 italic text-xs">
            Aucune transaction boursière enregistrée.
          </div>
        ) : (
          <div className="space-y-2">
            {myBourseHistory.map((e) => {
              const isIn = e.toName === user.name;
              return (
                <div key={e.id} className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${typeColor[e.type] || "text-stone-600 bg-stone-50 border-stone-200"}`}>
                    {typeLabel[e.type] || e.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-stone-700 truncate">{e.reason || "Transaction"}</div>
                    <div className="text-[9px] text-stone-400">{new Date(e.timestamp).toLocaleDateString("fr-FR")}</div>
                  </div>
                  <span className={`font-mono font-black text-sm shrink-0 ${isIn ? "text-green-600" : "text-red-500"}`}>
                    {isIn ? "+" : "-"}{formatMoney(e.amount || 0)}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};

export default CitizenBourseView;
