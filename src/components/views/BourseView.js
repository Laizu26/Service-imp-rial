import React, { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Plus, X, Edit3, Trash2, Coins,
  BarChart2, History, Search, ChevronDown, ChevronUp,
  ArrowUpRight, ArrowDownLeft, Zap, Building2, Users,
} from "lucide-react";

/* ── Helpers ── */
const Label = ({ children }) => (
  <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">{children}</label>
);
const Input = ({ className = "", ...props }) => (
  <input {...props} className={`w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-amber-500/50 ${className}`} />
);
const BtnPrimary = ({ children, onClick, disabled, className = "" }) => (
  <button onClick={onClick} disabled={disabled}
    className={`py-2.5 px-4 bg-amber-900/50 border border-amber-800/50 text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-900/70 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none ${className}`}>
    {children}
  </button>
);
const BtnSecondary = ({ children, onClick, className = "" }) => (
  <button onClick={onClick}
    className={`px-4 py-2 bg-stone-800 text-stone-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-stone-700 hover:text-stone-200 transition-all ${className}`}>
    {children}
  </button>
);

const priceChangeColor = (current, initial) => {
  if (!initial || current === initial) return "text-stone-400";
  return current > initial ? "text-green-400" : "text-red-400";
};
const priceChangeIcon = (current, initial) => {
  if (!initial || current === initial) return null;
  return current > initial
    ? <TrendingUp size={11} className="text-green-400" />
    : <TrendingDown size={11} className="text-red-400" />;
};
const priceChangePct = (current, initial) => {
  if (!initial) return "";
  const pct = ((current - initial) / initial) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
};

/* ── Composant ticker mini-graphe ── */
const PriceSparkline = ({ history }) => {
  if (!history || history.length < 2) return null;
  const prices = history.slice(0, 15).map((h) => h.price).reverse();
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 60, h = 20;
  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  const last = prices[prices.length - 1];
  const color = last >= prices[0] ? "#4ade80" : "#f87171";
  return (
    <svg width={w} height={h} className="shrink-0 opacity-80">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
};

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
      <div className="flex items-center gap-3 pb-2 border-b border-stone-700">
        <button onClick={onCancel} className="text-stone-500 hover:text-stone-300 p-1"><X size={16} /></button>
        <h3 className="text-sm font-black uppercase tracking-widest text-stone-200 flex items-center gap-2">
          <TrendingUp size={16} className="text-amber-400" /> Introduction en Bourse (IPO)
        </h3>
      </div>

      <div className="bg-stone-800/40 border border-stone-700 rounded-xl p-5 space-y-4">
        <div>
          <Label>Entreprise à coter *</Label>
          <select value={companyId} onChange={(e) => handleCompanyChange(e.target.value)}
            className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-amber-500/50">
            <option value="">— Choisir une entreprise —</option>
            {availableCompanies.map((c) => (
              <option key={c.id} value={c.id}>{c.name} (solde: {(c.balance || 0).toLocaleString()} Écus)</option>
            ))}
          </select>
          {availableCompanies.length === 0 && (
            <div className="text-[9px] text-red-400 mt-1">Toutes les entreprises sont déjà cotées.</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Symbole boursier * (3-5 lettres)</Label>
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase().slice(0, 5))} placeholder="ex: LARI" maxLength={5} />
          </div>
          <div>
            <Label>Prix initial par action (Écus) *</Label>
            <Input type="number" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} placeholder="ex: 100" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Nombre total d'actions émises *</Label>
            <Input type="number" value={totalShares} onChange={(e) => setTotalShares(e.target.value)} placeholder="ex: 1000" />
          </div>
          <div>
            <Label>Actions mises en vente (≤ total)</Label>
            <Input type="number" value={sharesOnMarket} onChange={(e) => setSharesOnMarket(e.target.value)} placeholder="Défaut = total" />
          </div>
        </div>

        <div>
          <Label>Description / prospectus</Label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="Activité, perspectives de rendement…"
            className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-amber-500/50 resize-none" />
        </div>

        {companyId && totalShares && pricePerShare && (
          <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg px-3 py-2 text-[10px] text-amber-300 space-y-0.5">
            <div>Capitalisation initiale : <span className="font-black font-mono">{(parseInt(totalShares) * parseFloat(pricePerShare) || 0).toLocaleString()} Écus</span></div>
            <div>Actions en vente : <span className="font-black">{sharesOnMarket || totalShares} / {totalShares}</span></div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <BtnPrimary onClick={handleSubmit} disabled={!companyId || !symbol || !totalShares || !pricePerShare} className="flex-1">
            <TrendingUp size={14} /> Introduire en bourse
          </BtnPrimary>
          <BtnSecondary onClick={onCancel}><X size={14} /></BtnSecondary>
        </div>
      </div>
    </div>
  );
};

/* ── Fiche détail d'une cotation (admin) ── */
const ListingDetail = ({ listing, citizens, onEdit, onDelete, onPayDividends, onClose }) => {
  const [editMode, setEditMode] = useState(false);
  const [newPrice, setNewPrice] = useState(listing.pricePerShare);
  const [newShares, setNewShares] = useState(listing.sharesOnMarket);
  const [newDesc, setNewDesc] = useState(listing.description || "");
  const [newActive, setNewActive] = useState(listing.isActive);
  const [divAmount, setDivAmount] = useState("");
  const [showDivForm, setShowDivForm] = useState(false);

  // Tous les actionnaires
  const shareholders = citizens.filter((c) => (c.stockholdings || {})[listing.id] > 0).map((c) => ({
    ...c, shares: (c.stockholdings || {})[listing.id],
    value: (c.stockholdings || {})[listing.id] * listing.pricePerShare,
  }));
  const totalHeld = shareholders.reduce((s, c) => s + c.shares, 0);
  const floatPct = listing.totalShares > 0 ? ((listing.sharesOnMarket / listing.totalShares) * 100).toFixed(1) : 0;
  const heldPct = listing.totalShares > 0 ? ((totalHeld / listing.totalShares) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-stone-700">
        <button onClick={onClose} className="text-stone-500 hover:text-stone-300 p-1"><X size={16} /></button>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg font-black font-mono text-amber-300">{listing.symbol}</span>
          <span className="text-stone-400 text-sm">— {listing.companyName}</span>
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ml-1 ${listing.isActive ? "bg-green-900/30 text-green-400 border-green-800/40" : "bg-red-900/30 text-red-400 border-red-800/40"}`}>
            {listing.isActive ? "Active" : "Suspendue"}
          </span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setEditMode(!editMode)} className="text-stone-500 hover:text-stone-300 p-1.5 rounded hover:bg-stone-800"><Edit3 size={13} /></button>
          <button onClick={() => onDelete(listing.id)} className="text-red-500/40 hover:text-red-400 p-1.5 rounded hover:bg-red-900/20"><Trash2 size={13} /></button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Cours", value: `${listing.pricePerShare.toLocaleString()} Écus`, sub: priceChangePct(listing.pricePerShare, listing.initialPrice), subColor: priceChangeColor(listing.pricePerShare, listing.initialPrice) },
          { label: "Capital total", value: `${(listing.totalShares * listing.pricePerShare).toLocaleString()} Écus`, sub: `${listing.totalShares.toLocaleString()} actions` },
          { label: "En vente", value: listing.sharesOnMarket.toLocaleString(), sub: `${floatPct}% du capital` },
          { label: "Actionnaires", value: shareholders.length, sub: `${heldPct}% détenu` },
        ].map((s, i) => (
          <div key={i} className="bg-stone-800/40 border border-stone-700 rounded-lg px-3 py-2">
            <div className="text-[8px] text-stone-500 uppercase font-black tracking-widest">{s.label}</div>
            <div className="text-sm font-black text-stone-200 mt-0.5">{s.value}</div>
            {s.sub && <div className={`text-[9px] mt-0.5 ${s.subColor || "text-stone-500"}`}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {listing.description && <p className="text-xs text-stone-400 italic">{listing.description}</p>}

      {/* Édition rapide */}
      {editMode && (
        <div className="bg-stone-800/60 border border-stone-600 rounded-xl p-4 space-y-3">
          <div className="text-[9px] font-black uppercase tracking-widest text-amber-500">Modifier la cotation</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cours (Écus)</Label>
              <Input type="number" value={newPrice} onChange={(e) => setNewPrice(parseFloat(e.target.value))} />
            </div>
            <div>
              <Label>Actions en vente</Label>
              <Input type="number" value={newShares} onChange={(e) => setNewShares(parseInt(e.target.value))} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-amber-500/50 resize-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={newActive} onChange={(e) => setNewActive(e.target.checked)} className="w-3 h-3" />
            <span className="text-xs text-stone-300">Valeur active (tradable)</span>
          </label>
          <div className="flex gap-2">
            <BtnPrimary onClick={() => { onEdit(listing.id, { pricePerShare: newPrice, sharesOnMarket: newShares, description: newDesc, isActive: newActive }); setEditMode(false); }} className="flex-1">
              <Edit3 size={13} /> Enregistrer
            </BtnPrimary>
            <BtnSecondary onClick={() => setEditMode(false)}><X size={13} /></BtnSecondary>
          </div>
        </div>
      )}

      {/* Dividendes */}
      <div className="bg-stone-800/40 border border-stone-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
            <Coins size={11} /> Dividendes
          </div>
          {!showDivForm && (
            <button onClick={() => setShowDivForm(true)} className="text-amber-400 text-[10px] font-black uppercase hover:text-amber-300">
              + Verser un dividende
            </button>
          )}
        </div>
        {showDivForm && (
          <div className="space-y-2">
            <div>
              <Label>Montant par action (Écus)</Label>
              <Input type="number" value={divAmount} onChange={(e) => setDivAmount(e.target.value)} placeholder="ex: 5" />
            </div>
            {divAmount && totalHeld > 0 && (
              <div className="text-[10px] text-amber-400 bg-amber-900/20 border border-amber-800/30 rounded px-2 py-1">
                Total à distribuer : <span className="font-black font-mono">{(parseFloat(divAmount) * totalHeld).toLocaleString()} Écus</span> pour {shareholders.length} actionnaire(s)
              </div>
            )}
            <div className="flex gap-2">
              <BtnPrimary onClick={() => { onPayDividends(listing.id, divAmount); setDivAmount(""); setShowDivForm(false); }} disabled={!divAmount || parseFloat(divAmount) <= 0} className="flex-1">
                <Coins size={13} /> Distribuer
              </BtnPrimary>
              <BtnSecondary onClick={() => { setShowDivForm(false); setDivAmount(""); }}><X size={13} /></BtnSecondary>
            </div>
          </div>
        )}
        {(listing.dividendHistory || []).length > 0 ? (
          <div className="space-y-1">
            {listing.dividendHistory.slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] border-t border-stone-700/40 pt-1">
                <span className="text-stone-400">{new Date(d.timestamp).toLocaleDateString("fr-FR")}</span>
                <span className="font-mono font-bold text-amber-300">{d.amount} Écus/action — {d.totalPaid?.toLocaleString()} Écus distribués</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-stone-600 italic">Aucun dividende versé</div>
        )}
      </div>

      {/* Actionnaires */}
      <div className="bg-stone-800/40 border border-stone-700 rounded-xl p-4 space-y-3">
        <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
          <Users size={11} /> Actionnaires ({shareholders.length})
        </div>
        {shareholders.length === 0 ? (
          <div className="text-xs text-stone-600 italic text-center py-4">Aucun actionnaire pour le moment</div>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {shareholders.sort((a, b) => b.shares - a.shares).map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-stone-800/50">
                <div className="w-6 h-6 bg-stone-700 rounded flex items-center justify-center text-[10px] font-black text-stone-400 shrink-0">
                  {(c.firstName || c.name || "?")[0].toUpperCase()}
                </div>
                <span className="text-xs text-stone-200 font-bold flex-1 truncate">
                  {c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : c.name}
                </span>
                <span className="text-[10px] font-mono text-stone-400 shrink-0">{c.shares.toLocaleString()} actions</span>
                <span className="text-[10px] font-mono text-amber-400 shrink-0">{c.value.toLocaleString()} Écus</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historique des prix */}
      {(listing.priceHistory || []).length > 1 && (
        <div className="bg-stone-800/40 border border-stone-700 rounded-xl p-4 space-y-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
            <BarChart2 size={11} /> Historique des cours
          </div>
          <div className="flex items-center gap-2">
            <PriceSparkline history={listing.priceHistory} />
            <div className="space-y-0.5">
              {listing.priceHistory.slice(0, 5).map((h, i) => (
                <div key={i} className="flex items-center gap-3 text-[9px]">
                  <span className="text-stone-500 w-24 shrink-0">{new Date(h.timestamp).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className={`font-mono font-black ${i === 0 ? "text-amber-300" : "text-stone-400"}`}>{h.price.toLocaleString()} Écus</span>
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
  state,
  session,
  companies = [],
  citizens = [],
  bourseListings = [],
  globalLedger = [],
  onBourseCreateListing,
  onBourseEditListing,
  onBourseDeleteListing,
  onBoursePayDividends,
}) => {
  const [tab, setTab] = useState("market"); // "market" | "ipo" | "history"
  const [detailId, setDetailId] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bourseListings.filter((l) =>
      l.symbol.toLowerCase().includes(q) || l.companyName.toLowerCase().includes(q)
    );
  }, [bourseListings, search]);

  const bourseHistory = useMemo(() =>
    (globalLedger || []).filter((e) => ["BOURSE_BUY", "BOURSE_SELL", "BOURSE_IPO", "BOURSE_DIVIDEND"].includes(e.type)).slice(0, 100),
    [globalLedger]
  );

  const detailListing = bourseListings.find((l) => l.id === detailId);

  const histTypeLabel = (t) => ({ BOURSE_BUY: "Achat", BOURSE_SELL: "Vente", BOURSE_IPO: "IPO", BOURSE_DIVIDEND: "Dividende" }[t] || t);
  const histTypeColor = (t) => ({ BOURSE_BUY: "text-green-400", BOURSE_SELL: "text-red-400", BOURSE_IPO: "text-amber-400", BOURSE_DIVIDEND: "text-blue-400" }[t] || "text-stone-400");

  // Statistiques globales
  const totalCapitalization = bourseListings.reduce((s, l) => s + l.totalShares * l.pricePerShare, 0);
  const totalHolders = new Set(citizens.flatMap((c) => Object.keys(c.stockholdings || {}))).size;

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
        onClose={() => setDetailId(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-stone-200 flex items-center gap-2">
            <TrendingUp size={16} className="text-amber-400" /> Bourse Impériale
          </h2>
          <p className="text-[9px] text-stone-500 mt-0.5 uppercase tracking-widest">Marchés financiers de l'Empire</p>
        </div>
        <BtnPrimary onClick={() => setTab("ipo")} className="shrink-0">
          <Plus size={14} /> Nouvelle cotation
        </BtnPrimary>
      </div>

      {/* Métriques globales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className="bg-stone-800/40 border border-stone-700 rounded-xl px-4 py-3">
          <div className="text-[8px] text-stone-500 uppercase font-black tracking-widest">Sociétés cotées</div>
          <div className="text-2xl font-black text-stone-200 mt-1">{bourseListings.length}</div>
          <div className="text-[9px] text-stone-500">{bourseListings.filter((l) => l.isActive).length} actives</div>
        </div>
        <div className="bg-stone-800/40 border border-stone-700 rounded-xl px-4 py-3">
          <div className="text-[8px] text-stone-500 uppercase font-black tracking-widest">Capitalisation totale</div>
          <div className="text-lg font-black font-mono text-amber-300 mt-1">{totalCapitalization.toLocaleString()}</div>
          <div className="text-[9px] text-stone-500">Écus</div>
        </div>
        <div className="bg-stone-800/40 border border-stone-700 rounded-xl px-4 py-3">
          <div className="text-[8px] text-stone-500 uppercase font-black tracking-widest">Transactions bourse</div>
          <div className="text-2xl font-black text-stone-200 mt-1">{bourseHistory.length}</div>
          <div className="text-[9px] text-stone-500">dans le registre</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-700">
        {[
          { id: "market", label: "Marché", icon: <TrendingUp size={12} /> },
          { id: "history", label: "Transactions", icon: <History size={12} /> },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 -mb-px transition-all ${
              tab === t.id ? "border-amber-500 text-amber-300" : "border-transparent text-stone-500 hover:text-stone-300"
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* === MARCHÉ === */}
      {tab === "market" && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Chercher un symbole ou une société…"
              className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-8 pr-3 py-2 text-xs text-stone-200 outline-none focus:border-amber-500/50" />
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-600 gap-3 border border-dashed border-stone-700 rounded-xl">
              <TrendingUp size={36} className="opacity-30" />
              <div className="text-xs font-bold uppercase tracking-widest">Aucune société cotée</div>
              <button onClick={() => setTab("ipo")} className="text-amber-500 text-xs underline">Introduire une société</button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* En-tête de colonne */}
              <div className="grid grid-cols-12 gap-2 px-3 text-[8px] font-black uppercase tracking-widest text-stone-600">
                <div className="col-span-2">Symbole</div>
                <div className="col-span-3">Société</div>
                <div className="col-span-2 text-right">Cours</div>
                <div className="col-span-2 text-right">Variation</div>
                <div className="col-span-2 text-right">En vente</div>
                <div className="col-span-1"></div>
              </div>
              {filtered.map((listing) => {
                const pctChange = listing.initialPrice
                  ? ((listing.pricePerShare - listing.initialPrice) / listing.initialPrice) * 100
                  : 0;
                const shareholders = citizens.filter((c) => (c.stockholdings || {})[listing.id] > 0).length;
                return (
                  <div key={listing.id}
                    className={`grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-xl border transition-all cursor-pointer hover:border-stone-600 ${
                      listing.isActive ? "bg-stone-800/40 border-stone-700" : "bg-stone-900/40 border-stone-800 opacity-60"
                    }`}
                    onClick={() => setDetailId(listing.id)}
                  >
                    <div className="col-span-2 flex items-center gap-1">
                      <span className="font-black font-mono text-amber-300 text-sm">{listing.symbol}</span>
                      {!listing.isActive && <span className="text-[8px] text-red-400 font-black">SUP</span>}
                    </div>
                    <div className="col-span-3 min-w-0">
                      <div className="text-xs text-stone-200 font-bold truncate">{listing.companyName}</div>
                      <div className="text-[9px] text-stone-500">{shareholders} actionnaire(s)</div>
                    </div>
                    <div className="col-span-2 text-right">
                      <div className="font-black font-mono text-sm text-stone-200">{listing.pricePerShare.toLocaleString()}</div>
                      <div className="text-[9px] text-stone-500">Écus</div>
                    </div>
                    <div className="col-span-2 text-right flex flex-col items-end gap-0.5">
                      <div className={`flex items-center gap-0.5 font-black text-xs ${priceChangeColor(listing.pricePerShare, listing.initialPrice)}`}>
                        {priceChangeIcon(listing.pricePerShare, listing.initialPrice)}
                        {pctChange !== 0 ? `${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(1)}%` : "—"}
                      </div>
                      <PriceSparkline history={listing.priceHistory} />
                    </div>
                    <div className="col-span-2 text-right">
                      <div className="text-xs font-mono text-stone-300">{listing.sharesOnMarket.toLocaleString()}</div>
                      <div className="text-[9px] text-stone-500">/ {listing.totalShares.toLocaleString()}</div>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <ChevronDown size={14} className="text-stone-600" />
                    </div>
                  </div>
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
            <div className="text-xs text-stone-600 italic text-center py-12">Aucune transaction boursière enregistrée</div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-2 px-3 text-[8px] font-black uppercase tracking-widest text-stone-600">
                <div className="col-span-2">Type</div>
                <div className="col-span-3">De</div>
                <div className="col-span-3">Vers</div>
                <div className="col-span-2 text-right">Montant</div>
                <div className="col-span-2 text-right">Date</div>
              </div>
              <div className="max-h-[500px] overflow-y-auto space-y-1">
                {bourseHistory.map((e) => (
                  <div key={e.id} className="grid grid-cols-12 gap-2 items-center px-3 py-2 rounded-lg bg-stone-800/40 hover:bg-stone-700/30 transition-colors">
                    <div className="col-span-2">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-current/20 ${histTypeColor(e.type)}`}>
                        {histTypeLabel(e.type)}
                      </span>
                    </div>
                    <div className="col-span-3 text-xs text-stone-400 truncate">{e.fromName}</div>
                    <div className="col-span-3 text-xs text-stone-300 truncate">{e.toName}</div>
                    <div className="col-span-2 text-right font-mono text-xs font-bold text-amber-300">
                      {e.amount > 0 ? `${e.amount.toLocaleString()} Écus` : "—"}
                    </div>
                    <div className="col-span-2 text-right text-[9px] text-stone-500">
                      {new Date(e.timestamp).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BourseView;
