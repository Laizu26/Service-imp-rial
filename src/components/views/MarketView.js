import React, { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, FileText, Plus, History } from "lucide-react";
import { computeResourcePrice, computeSupplyDemand } from "../../lib/economyEngine";

const TABS = [
  { id: "prices",    label: "Tableau des Prix",  icon: TrendingUp },
  { id: "contracts", label: "Mes Contrats",       icon: FileText },
  { id: "propose",   label: "Proposer",           icon: Plus },
  { id: "history",   label: "Historique",         icon: History },
];

const CATEGORY_LABELS = { base: "Matières premières", derived: "Produits dérivés", custom: "Ressources spéciales" };

export default function MarketView({
  user,
  economy,
  companies,
  countries,
  gameDate,
  notify,
  onCreateTradeContract,
  onAcceptTradeContract,
  onCancelTradeContract,
}) {
  const [tab, setTab] = useState("prices");
  const [form, setForm] = useState({ resourceId: "", quantity: 1, fixedPrice: "", buyerCompanyId: "" });

  const eco = economy || {};
  const resources = eco.resources || [];
  const tradeContracts = eco.tradeContracts || [];

  const myCompany = (companies || []).find((c) => c.ownerId === user?.id);
  const activeEvents = (eco.marketEvents || []).filter((e) => e.active);

  const enrichedResources = useMemo(() => resources.map((r) => {
    const { supply, demand } = computeSupplyDemand(r.id, companies || [], tradeContracts);
    const price = r.currentPrice ?? computeResourcePrice(r, companies || [], tradeContracts, activeEvents, eco.settings);
    return { ...r, supply, demand, price };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [resources, companies, tradeContracts, activeEvents, eco.settings]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const r of enrichedResources) {
      const cat = r.category || "base";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    }
    return groups;
  }, [enrichedResources]);

  const myContracts = useMemo(() =>
    tradeContracts.filter((c) => c.sellerCompanyId === myCompany?.id || c.buyerCompanyId === myCompany?.id),
    [tradeContracts, myCompany]
  );

  const otherCompanies = (companies || []).filter((c) => c.id !== myCompany?.id);

  const handlePropose = (e) => {
    e.preventDefault();
    if (!myCompany) { notify("Vous n'avez pas d'entreprise.", "error"); return; }
    if (!form.resourceId || !form.buyerCompanyId) { notify("Remplissez tous les champs.", "error"); return; }
    const buyer = (companies || []).find((c) => c.id === form.buyerCompanyId);
    if (!buyer) return;
    const resource = resources.find((r) => r.id === form.resourceId);
    onCreateTradeContract({
      sellerCompanyId: myCompany.id,
      sellerCompanyName: myCompany.name,
      sellerOwnerId: user.id,
      sellerCountryId: myCompany.countryId || null,
      buyerCompanyId: buyer.id,
      buyerCompanyName: buyer.name,
      buyerOwnerId: buyer.ownerId || null,
      buyerCountryId: buyer.countryId || null,
      resourceId: form.resourceId,
      resourceLabel: resource?.label || form.resourceId,
      quantity: parseInt(form.quantity) || 1,
      fixedPrice: form.fixedPrice ? parseFloat(form.fixedPrice) : null,
    });
    setForm({ resourceId: "", quantity: 1, fixedPrice: "", buyerCompanyId: "" });
  };

  const statusColor = { pending: "text-amber-400", active: "text-emerald-400", cancelled: "text-red-400", completed: "text-stone-500" };
  const statusLabel = { pending: "En attente", active: "Actif", cancelled: "Annulé", completed: "Terminé" };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-widest text-amber-400">Marché Impérial</h1>
          <p className="text-stone-500 text-sm mt-1">Prix dynamiques · Contrats commerciaux · Commerce inter-pays</p>
        </div>

        <div className="flex gap-1 mb-6 bg-stone-900 rounded-xl p-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                tab === t.id ? "bg-amber-500 text-stone-900 shadow" : "text-stone-400 hover:text-stone-100 hover:bg-stone-800"
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "prices" && (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-3">{CATEGORY_LABELS[cat] || cat}</h2>
                <div className="overflow-x-auto rounded-xl border border-stone-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-stone-500 text-[10px] uppercase tracking-widest border-b border-stone-800">
                        <th className="px-4 py-3">Ressource</th>
                        <th className="px-4 py-3 text-right">Prix actuel</th>
                        <th className="px-4 py-3 text-right">Base</th>
                        <th className="px-4 py-3 text-right">Offre / cycle</th>
                        <th className="px-4 py-3 text-right">Demande / cycle</th>
                        <th className="px-4 py-3 text-center">Tendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((r) => {
                        const diff = r.price - r.basePrice;
                        const pct = r.basePrice > 0 ? ((diff / r.basePrice) * 100).toFixed(0) : 0;
                        const TrendIcon = diff > 0.5 ? TrendingUp : diff < -0.5 ? TrendingDown : Minus;
                        const trendColor = diff > 0.5 ? "text-red-400" : diff < -0.5 ? "text-emerald-400" : "text-stone-500";
                        return (
                          <tr key={r.id} className="border-b border-stone-800/50 hover:bg-stone-900/40 transition-colors">
                            <td className="px-4 py-3">
                              <span className="mr-2">{r.emoji}</span>
                              <span className="font-semibold">{r.label}</span>
                            </td>
                            <td className={`px-4 py-3 text-right font-mono font-bold ${diff > 0.5 ? "text-red-300" : diff < -0.5 ? "text-emerald-300" : "text-stone-200"}`}>
                              {r.price} ₵
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-stone-500">{r.basePrice} ₵</td>
                            <td className="px-4 py-3 text-right text-stone-400">{r.supply}</td>
                            <td className="px-4 py-3 text-right text-stone-400">{r.demand}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`flex items-center justify-center gap-1 ${trendColor} text-xs`}>
                                <TrendIcon size={14} />
                                {pct > 0 ? "+" : ""}{pct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {activeEvents.length > 0 && (
              <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-2">Événements de marché actifs</h3>
                <div className="space-y-1">
                  {activeEvents.map((ev) => (
                    <div key={ev.id} className="text-sm text-stone-300">
                      <span className="text-amber-300 font-semibold">{ev.name}</span>
                      {" — "}
                      {ev.description}
                      {" "}
                      <span className="text-stone-500 font-mono">×{ev.modifier}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "contracts" && (
          <div>
            {myContracts.length === 0 ? (
              <div className="text-center text-stone-500 py-16">Aucun contrat commercial</div>
            ) : (
              <div className="space-y-3">
                {myContracts.map((c) => {
                  const isSeller = c.sellerCompanyId === myCompany?.id;
                  const resource = resources.find((r) => r.id === c.resourceId);
                  const canAccept = c.status === "pending" && !isSeller;
                  const canCancel = c.status === "pending" || c.status === "active";
                  return (
                    <div key={c.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-black uppercase ${statusColor[c.status]}`}>{statusLabel[c.status]}</span>
                            <span className="text-stone-600">·</span>
                            <span className="text-xs text-stone-500">{isSeller ? "Vous vendez" : "Vous achetez"}</span>
                          </div>
                          <div className="text-stone-200 font-semibold">
                            {resource?.emoji} {resource?.label || c.resourceId}
                            {" — "}
                            {c.quantity} /cycle
                            {c.fixedPrice ? ` @ ${c.fixedPrice} ₵` : " (prix marché)"}
                          </div>
                          <div className="text-xs text-stone-500 mt-1">
                            {c.sellerCompanyName} → {c.buyerCompanyName}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {canAccept && (
                            <button
                              onClick={() => onAcceptTradeContract(c.id)}
                              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              Accepter
                            </button>
                          )}
                          {canCancel && (
                            <button
                              onClick={() => onCancelTradeContract(c.id)}
                              className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-200 rounded-lg text-xs font-bold transition-colors"
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "propose" && (
          <div className="max-w-xl">
            {!myCompany ? (
              <div className="text-center text-stone-500 py-16">Vous devez posséder une entreprise pour proposer un contrat.</div>
            ) : (
              <form onSubmit={handlePropose} className="bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-stone-300 mb-4">Nouveau contrat commercial</h2>
                <div>
                  <label className="block text-xs text-stone-500 mb-1 uppercase tracking-widest">Ressource vendue</label>
                  <select
                    value={form.resourceId}
                    onChange={(e) => setForm({ ...form, resourceId: e.target.value })}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 text-sm"
                    required
                  >
                    <option value="">— Choisir —</option>
                    {resources.map((r) => (
                      <option key={r.id} value={r.id}>{r.emoji} {r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1 uppercase tracking-widest">Acheteur (entreprise)</label>
                  <select
                    value={form.buyerCompanyId}
                    onChange={(e) => setForm({ ...form, buyerCompanyId: e.target.value })}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 text-sm"
                    required
                  >
                    <option value="">— Choisir —</option>
                    {otherCompanies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1 uppercase tracking-widest">Quantité / cycle</label>
                    <input
                      type="number"
                      min={1}
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1 uppercase tracking-widest">Prix fixe (optionnel)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      placeholder="Prix marché"
                      value={form.fixedPrice}
                      onChange={(e) => setForm({ ...form, fixedPrice: e.target.value })}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-xl text-sm font-black uppercase tracking-widest transition-colors"
                >
                  Proposer le contrat
                </button>
              </form>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="text-stone-400 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-amber-400">{eco.settings?.cycleCount ?? 0}</div>
                <div className="text-xs text-stone-500 uppercase tracking-widest mt-1">Cycles exécutés</div>
              </div>
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-emerald-400">{tradeContracts.filter((c) => c.status === "active").length}</div>
                <div className="text-xs text-stone-500 uppercase tracking-widest mt-1">Contrats actifs</div>
              </div>
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-stone-200">{resources.length}</div>
                <div className="text-xs text-stone-500 uppercase tracking-widest mt-1">Ressources</div>
              </div>
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-red-400">{activeEvents.length}</div>
                <div className="text-xs text-stone-500 uppercase tracking-widest mt-1">Événements actifs</div>
              </div>
            </div>
            {eco.settings?.lastCycleDate ? (
              <p className="text-stone-500 text-xs">Dernier cycle : {new Date(eco.settings.lastCycleDate).toLocaleString("fr-FR")}</p>
            ) : (
              <p className="text-stone-500 text-xs text-center py-8">Aucun cycle exécuté.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
