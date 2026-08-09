import React, { useState, useMemo } from "react";
import {
  TrendingUp, Plus, X, Trash2, Coins,
  BarChart2, History, Search, ChevronDown,
  Users,
} from "lucide-react";
import { formatMoney } from "../../lib/gameUtils";
import { PriceSparkline, PriceHistoryChart, PriceChangeBadge, BourseTicker, OrderBookDepth } from "../ui/BourseWidgets";

/* ── Formulaire IPO ── */
const IPOForm = ({ companies, listings, onCreateListing, onCancel }) => {
  const [companyId, setCompanyId] = useState("");
  const [symbol, setSymbol] = useState("");
  const [totalShares, setTotalShares] = useState("");
  const [sharesOnMarket, setSharesOnMarket] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [description, setDescription] = useState("");

  const listedIds = new Set(listings.map((l) => l.companyId));
  const availableCompanies = companies.filter((c) => !listedIds.has(c.id));

  const handleCompanyChange = (id) => {
    setCompanyId(id);
    const co = companies.find((c) => c.id === id);
    if (co && !symbol) setSymbol(co.name.substring(0, 4).toUpperCase());
    if (co && !description) setDescription(co.description || "");
  };

  const handleSubmit = () => {
    onCreateListing({ companyId, symbol, totalShares, sharesOnMarket: sharesOnMarket || totalShares, pricePerShare, description });
  };

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center gap-3 pb-2 border-b border-stone-200">
        <button onClick={onCancel} className="text-stone-400 hover:text-stone-700 p-1"><X size={16} /></button>
        <h3 className="text-sm font-black uppercase tracking-widest text-stone-800 flex items-center gap-2">
          <TrendingUp size={16} className="text-amber-500" /> Introduction en Bourse (IPO)
        </h3>
      </div>

      <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Entreprise à coter *</label>
          <select value={companyId} onChange={(e) => handleCompanyChange(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-sm text-stone-800 outline-none focus:border-amber-400">
            <option value="">— Choisir une entreprise —</option>
            {availableCompanies.map((c) => (
              <option key={c.id} value={c.id}>{c.name} (solde: {formatMoney(c.balance || 0)})</option>
            ))}
          </select>
          {availableCompanies.length === 0 && (
            <div className="text-[9px] text-red-500 mt-1">Toutes les entreprises sont déjà cotées.</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Symbole boursier * (3-5 lettres)</label>
            <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase().slice(0, 5))} placeholder="ex: LARI" maxLength={5}
              className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Prix initial par action (Écus) *</label>
            <input type="number" step="0.1" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} placeholder="ex: 100"
              className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-amber-400" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Nombre total d'actions émises *</label>
            <input type="number" value={totalShares} onChange={(e) => setTotalShares(e.target.value)} placeholder="ex: 1000"
              className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Actions mises en vente (≤ total)</label>
            <input type="number" value={sharesOnMarket} onChange={(e) => setSharesOnMarket(e.target.value)} placeholder="Défaut = total"
              className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-amber-400" />
          </div>
        </div>

        <div>
          <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">Description / prospectus</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="Activité, perspectives de rendement…"
            className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-amber-400 resize-none" />
        </div>

        {companyId && totalShares && pricePerShare && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[10px] text-amber-700 space-y-0.5">
            <div>Capitalisation initiale : <span className="font-black font-mono">{formatMoney(parseInt(totalShares) * parseFloat(pricePerShare) || 0)}</span></div>
            <div>Actions en vente : <span className="font-black">{sharesOnMarket || totalShares} / {totalShares}</span></div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={handleSubmit} disabled={!companyId || !symbol || !totalShares || !pricePerShare}
            className="flex-1 py-2.5 px-4 bg-stone-800 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-stone-700 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none">
            <TrendingUp size={14} /> Introduire en bourse
          </button>
          <button onClick={onCancel} className="px-4 py-2 bg-white border border-stone-200 text-stone-500 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-stone-50 transition-all">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Fiche détail d'une cotation (admin) ── */
const ListingDetail = ({ listing, citizens, onEdit, onDelete, onPayDividends, onCompanyOffer, onCancelOrder, onClose }) => {
  const [offerQty, setOfferQty] = useState("");
  const [offerPrice, setOfferPrice] = useState(listing.lastPrice || listing.initialPrice);
  const [divAmount, setDivAmount] = useState("");
  const [showDivForm, setShowDivForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const shareholders = citizens.filter((c) => (c.stockholdings || {})[listing.id] > 0).map((c) => ({
    ...c, shares: (c.stockholdings || {})[listing.id],
    value: (c.stockholdings || {})[listing.id] * (listing.lastPrice || listing.initialPrice),
  }));
  const totalHeld = shareholders.reduce((s, c) => s + c.shares, 0);
  const companyFloat = (listing.sellOrders || []).filter((o) => o.citizenId === "COMPANY").reduce((s, o) => s + o.qty, 0);
  const floatPct = listing.totalShares > 0 ? ((companyFloat / listing.totalShares) * 100).toFixed(1) : 0;
  const heldPct = listing.totalShares > 0 ? ((totalHeld / listing.totalShares) * 100).toFixed(1) : 0;
  const price = listing.lastPrice || listing.initialPrice;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-stone-200">
        <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1"><X size={16} /></button>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg font-black font-mono text-amber-600">{listing.symbol}</span>
          <span className="text-stone-500 text-sm">— {listing.companyName}</span>
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ml-1 ${listing.isActive ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-500 border-red-200"}`}>
            {listing.isActive ? "Active" : "Suspendue"}
          </span>
        </div>
        <button
          onClick={() => onEdit(listing.id, { isActive: !listing.isActive })}
          className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50"
        >
          {listing.isActive ? "Suspendre" : "Réactiver"}
        </button>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"><Trash2 size={14} /></button>
        ) : (
          <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
            <span className="text-[9px] text-red-600 font-bold">Confirmer ?</span>
            <button onClick={() => onDelete(listing.id)} className="text-[9px] font-black text-red-600 uppercase px-2 py-1 bg-red-100 rounded hover:bg-red-200">Oui</button>
            <button onClick={() => setConfirmDelete(false)} className="text-[9px] text-stone-500 uppercase px-1">Non</button>
          </div>
        )}
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Cours", value: formatMoney(price) },
          { label: "Capital total", value: formatMoney(listing.totalShares * price), sub: `${listing.totalShares.toLocaleString()} actions` },
          { label: "Offre société", value: companyFloat.toLocaleString(), sub: `${floatPct}% du capital` },
          { label: "Actionnaires", value: shareholders.length, sub: `${heldPct}% détenu` },
        ].map((s, i) => (
          <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
            <div className="text-[8px] text-stone-400 uppercase font-black tracking-widest">{s.label}</div>
            <div className="text-sm font-black text-stone-800 mt-0.5">{s.value}</div>
            {s.sub && <div className="text-[9px] mt-0.5 text-stone-400">{s.sub}</div>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <PriceChangeBadge current={price} reference={listing.initialPrice} size="lg" />
        <span className="text-[10px] text-stone-400">depuis l'IPO ({formatMoney(listing.initialPrice)})</span>
      </div>

      {listing.description && <p className="text-xs text-stone-500 italic">{listing.description}</p>}

      {/* Carnet d'ordres */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
        <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1.5">
          <BarChart2 size={11} /> Carnet d'ordres
        </div>
        <OrderBookDepth buyOrders={listing.buyOrders} sellOrders={listing.sellOrders} ownerId={listing.ownerId} onCancel={(orderId, side) => onCancelOrder({ listingId: listing.id, orderId, side })} maxRows={8} />
      </div>

      {/* Offre de titres au nom de la société */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
        <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1.5">
          <Plus size={11} /> Offrir des titres au nom de la société
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">Quantité</label>
            <input type="number" min={1} value={offerQty} onChange={(e) => setOfferQty(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm font-mono outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">Prix / action</label>
            <input type="number" step="0.1" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm font-mono outline-none focus:border-amber-400" />
          </div>
        </div>
        <button
          disabled={!offerQty || parseInt(offerQty) <= 0 || !offerPrice || parseFloat(offerPrice) <= 0}
          onClick={() => { onCompanyOffer({ listingId: listing.id, qty: parseInt(offerQty), price: parseFloat(offerPrice) }); setOfferQty(""); }}
          className="w-full py-2 bg-stone-800 text-amber-400 text-xs font-black uppercase rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors"
        >
          Mettre en vente
        </button>
      </div>

      {/* Dividendes */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1.5">
            <Coins size={11} /> Dividendes
          </div>
          {!showDivForm && (
            <button onClick={() => setShowDivForm(true)} className="text-amber-600 text-[10px] font-black uppercase hover:text-amber-500">
              + Verser un dividende
            </button>
          )}
        </div>
        {showDivForm && (
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase text-stone-400 block">Montant par action (Écus)</label>
            <div className="flex gap-2">
              <input type="number" step="0.1" value={divAmount} onChange={(e) => setDivAmount(e.target.value)} placeholder="ex: 5"
                className="flex-1 bg-white border border-stone-200 rounded-lg p-2 text-sm font-mono outline-none focus:border-amber-400" />
              <button
                onClick={() => { onPayDividends(listing.id, divAmount); setDivAmount(""); setShowDivForm(false); }}
                disabled={!divAmount || parseFloat(divAmount) <= 0}
                className="flex-1 py-2 bg-amber-500 text-white text-xs font-black uppercase rounded-lg hover:bg-amber-400 disabled:opacity-40 transition-colors">
                Distribuer
              </button>
              <button onClick={() => { setShowDivForm(false); setDivAmount(""); }} className="px-3 text-stone-400 hover:text-stone-600"><X size={14} /></button>
            </div>
            {divAmount && totalHeld > 0 && (
              <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                Total à distribuer : <span className="font-black font-mono">{formatMoney(parseFloat(divAmount) * totalHeld)}</span> pour {shareholders.length} actionnaire(s)
              </div>
            )}
          </div>
        )}
        {(listing.dividendHistory || []).length > 0 ? (
          <div className="space-y-1">
            {listing.dividendHistory.slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] border-t border-stone-100 pt-1">
                <span className="text-stone-400">{new Date(d.timestamp).toLocaleDateString("fr-FR")}</span>
                <span className="font-mono font-bold text-amber-600">
                  {formatMoney(d.amount)}/action — {formatMoney(d.totalPaid || 0)} distribués{d.partial ? " (partiel)" : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-stone-400 italic">Aucun dividende versé</div>
        )}
      </div>

      {/* Actionnaires */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
        <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1.5">
          <Users size={11} /> Actionnaires ({shareholders.length})
        </div>
        {shareholders.length === 0 ? (
          <div className="text-xs text-stone-400 italic text-center py-4">Aucun actionnaire pour le moment</div>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {shareholders.sort((a, b) => b.shares - a.shares).map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-stone-50">
                <div className="w-6 h-6 bg-stone-200 rounded flex items-center justify-center text-[10px] font-black text-stone-500 shrink-0">
                  {(c.firstName || c.name || "?")[0].toUpperCase()}
                </div>
                <span className="text-xs text-stone-700 font-bold flex-1 truncate flex items-center gap-1.5">
                  {c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : c.name}
                  {String(c.id) === String(listing.ownerId) && (
                    <span className="text-[8px] font-black uppercase bg-amber-100 text-amber-700 px-1 rounded shrink-0" title="Dirigeant de la société">Dir.</span>
                  )}
                </span>
                <span className="text-[10px] font-mono text-stone-400 shrink-0">{c.shares.toLocaleString()} actions</span>
                <span className="text-[10px] font-mono text-amber-600 shrink-0">{formatMoney(c.value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historique des prix */}
      {(listing.priceHistory || []).length > 1 && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
          <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1.5">
            <BarChart2 size={11} /> Historique des cours (transactions réelles)
          </div>
          <PriceHistoryChart history={listing.priceHistory} />
          <div className="flex items-center gap-2">
            <PriceSparkline history={listing.priceHistory} width={80} height={26} />
            <div className="space-y-0.5">
              {listing.priceHistory.slice(0, 5).map((h, i) => (
                <div key={i} className="flex items-center gap-3 text-[9px]">
                  <span className="text-stone-400 w-24 shrink-0">{new Date(h.timestamp).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className={`font-mono font-black ${i === 0 ? "text-amber-600" : "text-stone-400"}`}>{formatMoney(h.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Composant principal ── */
const BourseView = ({
  companies = [],
  citizens = [],
  bourseListings = [],
  globalLedger = [],
  onBourseCreateListing,
  onBourseEditListing,
  onBourseDeleteListing,
  onBoursePayDividends,
  onBourseCompanyOffer,
  onBourseCancelOrder,
}) => {
  const [tab, setTab] = useState("market"); // "market" | "ipo" | "history"
  const [detailId, setDetailId] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("symbol");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bourseListings.filter((l) =>
      l.symbol.toLowerCase().includes(q) || l.companyName.toLowerCase().includes(q)
    );
  }, [bourseListings, search]);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const pa = a.lastPrice || a.initialPrice, pb = b.lastPrice || b.initialPrice;
      if (sortBy === "price") return pb - pa;
      if (sortBy === "variation") {
        const va = a.initialPrice ? (pa - a.initialPrice) / a.initialPrice : 0;
        const vb = b.initialPrice ? (pb - b.initialPrice) / b.initialPrice : 0;
        return vb - va;
      }
      return a.symbol.localeCompare(b.symbol);
    });
  }, [filtered, sortBy]);

  const bourseHistory = useMemo(() =>
    (globalLedger || []).filter((e) => ["BOURSE_TRADE", "BOURSE_IPO", "BOURSE_DIVIDEND", "ESPP_BUY"].includes(e.type)).slice(0, 100),
    [globalLedger]
  );

  const detailListing = bourseListings.find((l) => l.id === detailId);

  const shareholderCounts = useMemo(() => {
    const counts = {};
    citizens.forEach((c) => {
      Object.entries(c.stockholdings || {}).forEach(([lid, qty]) => {
        if (qty > 0) counts[lid] = (counts[lid] || 0) + 1;
      });
    });
    return counts;
  }, [citizens]);

  const histTypeLabel = (t) => ({ BOURSE_TRADE: "Échange", BOURSE_IPO: "IPO", BOURSE_DIVIDEND: "Dividende", ESPP_BUY: "ESPP" }[t] || t);
  const histTypeColor = (t) => ({ BOURSE_TRADE: "text-blue-600 bg-blue-50 border-blue-200", BOURSE_IPO: "text-amber-600 bg-amber-50 border-amber-200", BOURSE_DIVIDEND: "text-emerald-600 bg-emerald-50 border-emerald-200", ESPP_BUY: "text-purple-600 bg-purple-50 border-purple-200" }[t] || "text-stone-500 bg-stone-50 border-stone-200");

  const totalCapitalization = bourseListings.reduce((s, l) => s + l.totalShares * (l.lastPrice || l.initialPrice), 0);

  if (tab === "ipo" && !detailId) {
    return (
      <IPOForm
        companies={companies}
        listings={bourseListings}
        onCreateListing={(data) => { onBourseCreateListing(data); setTab("market"); }}
        onCancel={() => setTab("market")}
      />
    );
  }

  if (detailId && detailListing) {
    return (
      <ListingDetail
        listing={detailListing}
        citizens={citizens}
        onEdit={onBourseEditListing}
        onDelete={(id) => { onBourseDeleteListing(id); setDetailId(null); }}
        onPayDividends={onBoursePayDividends}
        onCompanyOffer={onBourseCompanyOffer}
        onCancelOrder={onBourseCancelOrder}
        onClose={() => setDetailId(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-700 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 p-5">
        <TrendingUp size={110} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5 text-stone-400 select-none pointer-events-none" />
        <div className="relative flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-[0.3em] text-stone-500 mb-1">Marchés financiers de l'Empire</div>
            <h2 className="text-2xl font-black font-serif text-stone-100 flex items-center gap-2">
              <TrendingUp size={20} className="text-amber-400" /> Bourse Impériale
            </h2>
          </div>
          <button onClick={() => setTab("ipo")}
            className="px-4 py-2 bg-amber-500 text-stone-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-all flex items-center gap-2 shrink-0">
            <Plus size={14} /> Nouvelle cotation
          </button>
        </div>
      </div>

      {/* Métriques globales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3">
          <div className="text-[8px] text-stone-400 uppercase font-black tracking-widest">Sociétés cotées</div>
          <div className="text-2xl font-black text-stone-800 mt-1">{bourseListings.length}</div>
          <div className="text-[9px] text-stone-400">{bourseListings.filter((l) => l.isActive).length} actives</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3">
          <div className="text-[8px] text-stone-400 uppercase font-black tracking-widest">Capitalisation totale</div>
          <div className="text-lg font-black font-mono text-amber-600 mt-1">{formatMoney(totalCapitalization)}</div>
          <div className="text-[9px] text-stone-400">Écus</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3">
          <div className="text-[8px] text-stone-400 uppercase font-black tracking-widest">Transactions bourse</div>
          <div className="text-2xl font-black text-stone-800 mt-1">{bourseHistory.length}</div>
          <div className="text-[9px] text-stone-400">dans le registre</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200">
        {[
          { id: "market", label: "Marché", icon: <TrendingUp size={12} /> },
          { id: "history", label: "Transactions", icon: <History size={12} /> },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 -mb-px transition-all ${
              tab === t.id ? "border-amber-500 text-amber-600" : "border-transparent text-stone-400 hover:text-stone-600"
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* === MARCHÉ === */}
      {tab === "market" && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Chercher un symbole ou une société…"
              className="w-full bg-white border border-stone-200 rounded-lg pl-8 pr-3 py-2 text-xs text-stone-800 outline-none focus:border-amber-400" />
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-300 gap-3 border border-dashed border-stone-200 rounded-xl">
              <TrendingUp size={36} className="opacity-40" />
              <div className="text-xs font-bold uppercase tracking-widest text-stone-400">Aucune société cotée</div>
              <button onClick={() => setTab("ipo")} className="text-amber-600 text-xs underline">Introduire une société</button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-end mb-1">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-[10px] text-stone-600 outline-none">
                  <option value="symbol">Trier : Symbole</option>
                  <option value="price">Trier : Cours</option>
                  <option value="variation">Trier : Variation</option>
                </select>
              </div>
              {sortedFiltered.map((listing) => {
                const price = listing.lastPrice || listing.initialPrice;
                const shareholders = shareholderCounts[listing.id] || 0;
                return (
                  <button key={listing.id} onClick={() => setDetailId(listing.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left hover:border-stone-300 ${
                      listing.isActive ? "bg-white border-stone-200" : "bg-stone-50 border-stone-200 opacity-60"
                    }`}
                  >
                    <BourseTicker symbol={listing.symbol} />
                    {!listing.isActive && <span className="text-[8px] text-red-500 font-black uppercase shrink-0">Suspendue</span>}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-stone-800 font-bold truncate">{listing.companyName}</div>
                      <div className="text-[9px] text-stone-400">{shareholders} actionnaire(s)</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black font-mono text-sm text-stone-800">{formatMoney(price)}</div>
                      <PriceChangeBadge current={price} reference={listing.initialPrice} />
                    </div>
                    <PriceSparkline history={listing.priceHistory} />
                    <ChevronDown size={14} className="text-stone-300 -rotate-90 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === TRANSACTIONS === */}
      {tab === "history" && (
        <div className="space-y-2">
          {bourseHistory.length === 0 ? (
            <div className="text-xs text-stone-400 italic text-center py-12">Aucune transaction boursière enregistrée</div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto space-y-1">
              {bourseHistory.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-stone-200 hover:border-stone-300 transition-colors">
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${histTypeColor(e.type)}`}>
                    {histTypeLabel(e.type)}
                  </span>
                  <div className="flex-1 min-w-0 text-xs text-stone-600 truncate">
                    <span className="text-stone-400">{e.fromName}</span> → <span className="text-stone-700 font-bold">{e.toName}</span>
                  </div>
                  <div className="font-mono text-xs font-bold text-amber-600 shrink-0">
                    {e.amount > 0 ? formatMoney(e.amount) : "—"}
                  </div>
                  <div className="text-[9px] text-stone-400 shrink-0">
                    {new Date(e.timestamp).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BourseView;
