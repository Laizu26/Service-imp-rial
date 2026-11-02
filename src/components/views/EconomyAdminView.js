import { useState } from "react";
import { DEFAULT_ECONOMY } from "../../lib/constants";

const TABS = [
  { id: "dashboard",  label: "Tableau de bord" },
  { id: "resources",  label: "Ressources" },
  { id: "producers",  label: "Producteurs" },
  { id: "events",     label: "Événements" },
  { id: "contracts",  label: "Contrats" },
  { id: "diplomacy",  label: "Diplomatie" },
];

const inputCls = "p-1.5 border border-amber-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 w-full";
const btnPrimary = "flex items-center gap-1 bg-indigo-900 hover:bg-indigo-950 text-amber-300 px-4 py-1.5 rounded-lg text-xs font-bold uppercase disabled:opacity-50 transition-colors";
const btnSecondary = "px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold uppercase transition-colors";
const btnDanger = "text-red-500 hover:text-red-700 text-xs font-bold transition-colors";

export default function EconomyAdminView({
  economy,
  companies,
  onUpdateEconomy,
  onSetCompanyProductions,
  onAddEconomyResource,
  onUpdateEconomyResource,
  onDeleteEconomyResource,
  onAddEconomyRecipe,
  onDeleteEconomyRecipe,
  onAddMarketEvent,
  onRemoveMarketEvent,
  onRunEconomyCycle,
  countries = [],
  onAddEmbargo,
  onRemoveEmbargo,
  onAcceptTradeContract,
  onCancelTradeContract,
}) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [fromCountryId, setFromCountryId] = useState("");
  const [toCountryId, setToCountryId] = useState("");
  const [embargoLabel, setEmbargoLabel] = useState("");
  const eco = economy || DEFAULT_ECONOMY;
  const resources = eco.resources || [];
  const recipes = eco.recipes || [];
  const marketEvents = eco.marketEvents || [];
  const settings = eco.settings || {};
  const tradeContracts = eco.tradeContracts || [];
  const embargoes = eco.embargoes || [];

  return (
    <div className="p-3 max-w-6xl mx-auto space-y-3">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 px-5 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-400/15 border-2 border-amber-400/30 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">⚖️</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white tracking-wide leading-tight">Commerce Impérial</h1>
            <p className="text-[11px] text-indigo-300 italic mt-0.5">
              Cycle {settings.cycleCount ?? 0} · {settings.cycleLabel || "Semaine"}
              {settings.lastCycleDate ? ` · Dernier : ${settings.lastCycleDate}` : ""}
            </p>
          </div>
          <button
            onClick={onRunEconomyCycle}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors flex-shrink-0"
          >
            ▶ Lancer un cycle
          </button>
        </div>

        {/* Stats bar */}
        <div className="bg-indigo-950/60 px-5 py-2 flex gap-6 border-t border-white/5">
          {[
            { label: "Ressources", value: resources.length, emoji: "📦" },
            { label: "Producteurs", value: (companies || []).filter((c) => (c.productions || []).length > 0).length, emoji: "🏭" },
            { label: "Contrats actifs", value: tradeContracts.filter((c) => c.status === "active").length, emoji: "📜" },
            { label: "Événements", value: (marketEvents || []).filter((e) => e.active).length, emoji: "⚡" },
            { label: "Embargos", value: embargoes.length, emoji: "🚫" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-lg font-black text-white">{s.value}</div>
              <div className="text-[9px] text-indigo-300 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? "bg-stone-800 text-white"
                : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <DashboardTab eco={eco} companies={companies} />
      )}
      {activeTab === "resources" && (
        <ResourcesTab
          resources={resources}
          settings={settings}
          onUpdateEconomy={onUpdateEconomy}
          onAddEconomyResource={onAddEconomyResource}
          onUpdateEconomyResource={onUpdateEconomyResource}
          onDeleteEconomyResource={onDeleteEconomyResource}
          onAddEconomyRecipe={onAddEconomyRecipe}
          onDeleteEconomyRecipe={onDeleteEconomyRecipe}
          recipes={recipes}
        />
      )}
      {activeTab === "producers" && (
        <ProducersTab
          companies={companies}
          resources={resources}
          recipes={recipes}
          onSetCompanyProductions={onSetCompanyProductions}
        />
      )}
      {activeTab === "events" && (
        <EventsTab
          marketEvents={marketEvents}
          resources={resources}
          onAddMarketEvent={onAddMarketEvent}
          onRemoveMarketEvent={onRemoveMarketEvent}
        />
      )}
      {activeTab === "contracts" && (
        <ContractsTab
          tradeContracts={tradeContracts}
          resources={resources}
          onAcceptTradeContract={onAcceptTradeContract}
          onCancelTradeContract={onCancelTradeContract}
        />
      )}
      {activeTab === "diplomacy" && (
        <DiplomacyTab
          tradeContracts={tradeContracts}
          embargoes={embargoes}
          countries={countries}
          fromCountryId={fromCountryId}
          setFromCountryId={setFromCountryId}
          toCountryId={toCountryId}
          setToCountryId={setToCountryId}
          embargoLabel={embargoLabel}
          setEmbargoLabel={setEmbargoLabel}
          onAddEmbargo={onAddEmbargo}
          onRemoveEmbargo={onRemoveEmbargo}
        />
      )}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function DashboardTab({ eco, companies }) {
  const resources = eco.resources || [];
  const marketEvents = eco.marketEvents || [];
  const tradeContracts = eco.tradeContracts || [];
  const activeEvents = marketEvents.filter((e) => e.active);

  const topProduced = resources
    .map((r) => ({
      ...r,
      supply: (companies || []).reduce((sum, c) => {
        const p = (c.productions || []).find((pr) => pr.resourceId === r.id);
        return sum + (p ? p.outputPerCycle : 0);
      }, 0),
    }))
    .filter((r) => r.supply > 0)
    .sort((a, b) => b.supply - a.supply)
    .slice(0, 6);

  return (
    <div className="space-y-4">
      {activeEvents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">⚡ Événements de marché actifs</p>
          <div className="space-y-1">
            {activeEvents.map((e) => (
              <div key={e.id} className="text-xs text-amber-800">
                • <span className="font-bold">{e.label}</span> — ×{e.modifier}{e.resourceId ? ` (${e.resourceId})` : " (global)"}
              </div>
            ))}
          </div>
        </div>
      )}

      {topProduced.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">🏆 Ressources les plus produites</p>
          <div className="space-y-2">
            {topProduced.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="text-lg w-7">{r.emoji}</span>
                <span className="flex-1 text-xs text-stone-700">{r.label}</span>
                <span className="text-xs font-bold text-stone-900">{r.supply}/cycle</span>
                <span className="text-xs text-amber-700 font-mono">{r.currentPrice ?? r.basePrice} Écus</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topProduced.length === 0 && activeEvents.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-400 text-sm">
          Aucune production ni événement actif. Configurez des entreprises productrices dans l'onglet Producteurs.
        </div>
      )}

      {tradeContracts.filter((c) => c.status === "active").length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">📜 Contrats actifs récents</p>
          <div className="space-y-1">
            {tradeContracts.filter((c) => c.status === "active").slice(0, 5).map((c) => {
              const res = resources.find((r) => r.id === c.resourceId);
              return (
                <div key={c.id} className="flex items-center gap-2 text-xs text-stone-600">
                  <span>{res?.emoji}</span>
                  <span className="font-semibold">{res?.label || c.resourceId}</span>
                  <span className="text-stone-400">—</span>
                  <span>{c.sellerCompanyName} → {c.buyerCompanyName}</span>
                  <span className="text-stone-400 ml-auto">{c.quantity}/cycle</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Resources ───────────────────────────────────────────────────────────────

function ResourcesTab({ resources, settings, onUpdateEconomy, onAddEconomyResource, onUpdateEconomyResource, onDeleteEconomyResource, onAddEconomyRecipe, onDeleteEconomyRecipe, recipes }) {
  const [showNewResource, setShowNewResource] = useState(false);
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const [newRes, setNewRes] = useState({ label: "", emoji: "📦", basePrice: 10, category: "custom" });
  const [newRecipe, setNewRecipe] = useState({ label: "", companyType: "", outputResourceId: "", outputQty: 1, inputs: [] });
  const [editPrices, setEditPrices] = useState({});

  const base = resources.filter((r) => r.category === "base");
  const derived = resources.filter((r) => r.category === "derived");
  const custom = resources.filter((r) => r.isCustom);

  const handlePriceBlur = (id, val) => {
    const price = parseFloat(val);
    if (!isNaN(price) && price > 0) onUpdateEconomyResource(id, { basePrice: price });
  };

  const handleAddResource = () => {
    if (!newRes.label.trim()) return;
    onAddEconomyResource(newRes);
    setNewRes({ label: "", emoji: "📦", basePrice: 10, category: "custom" });
    setShowNewResource(false);
  };

  const handleAddRecipe = () => {
    if (!newRecipe.label.trim() || !newRecipe.outputResourceId) return;
    onAddEconomyRecipe(newRecipe);
    setNewRecipe({ label: "", companyType: "", outputResourceId: "", outputQty: 1, inputs: [] });
    setShowNewRecipe(false);
  };

  const ResourceSection = ({ title, list }) => (
    <div className="mb-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">{title}</p>
      <div className="space-y-1">
        {list.length === 0 && <p className="text-xs text-stone-400 italic">Aucune.</p>}
        {list.map((r) => (
          <div key={r.id} className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2">
            <span className="text-lg w-7">{r.emoji}</span>
            <span className="flex-1 text-xs text-stone-800 font-medium">{r.label}</span>
            <span className="text-[10px] text-stone-400 mr-1">prix de base</span>
            <input
              type="number"
              className="w-20 text-xs border border-amber-200 rounded px-2 py-1 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-400"
              value={editPrices[r.id] !== undefined ? editPrices[r.id] : (r.basePrice ?? 0)}
              onChange={(e) => setEditPrices({ ...editPrices, [r.id]: e.target.value })}
              onBlur={(e) => { handlePriceBlur(r.id, e.target.value); setEditPrices((p) => { const n = { ...p }; delete n[r.id]; return n; }); }}
              min={0}
            />
            <span className="text-[10px] text-stone-400">Écus</span>
            {r.currentPrice != null && (
              <span className="text-[10px] text-amber-700 font-mono ml-2">→ {r.currentPrice}</span>
            )}
            {r.isCustom && (
              <button onClick={() => onDeleteEconomyResource(r.id)} className="ml-2 text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white border border-stone-200 rounded-xl p-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">
          Sensibilité des prix (K = {settings.priceSensitivity ?? 0.3})
        </label>
        <input
          type="range" min={0} max={1} step={0.05}
          value={settings.priceSensitivity ?? 0.3}
          onChange={(e) => onUpdateEconomy({ settings: { ...settings, priceSensitivity: parseFloat(e.target.value) } })}
          className="w-full mt-1"
        />
        <div className="flex justify-between text-[10px] text-stone-400 mt-1"><span>Prix fixes</span><span>Très volatils</span></div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4">
        <ResourceSection title="Ressources de base" list={base} />
        <ResourceSection title="Ressources dérivées" list={derived} />
        <ResourceSection title="Ressources personnalisées" list={custom} />

        {showNewResource ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 mt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Nouvelle ressource personnalisée</p>
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="Nom" value={newRes.label} onChange={(e) => setNewRes({ ...newRes, label: e.target.value })}
                className={`col-span-2 ${inputCls.replace("w-full", "")}`} />
              <input placeholder="Emoji" value={newRes.emoji} onChange={(e) => setNewRes({ ...newRes, emoji: e.target.value })}
                className={inputCls.replace("w-full", "")} />
            </div>
            <input type="number" placeholder="Prix de base (Écus)" value={newRes.basePrice}
              onChange={(e) => setNewRes({ ...newRes, basePrice: parseFloat(e.target.value) || 10 })}
              className={inputCls} />
            <div className="flex gap-2">
              <button onClick={handleAddResource} className={btnPrimary}>Ajouter</button>
              <button onClick={() => setShowNewResource(false)} className={btnSecondary}>Annuler</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowNewResource(true)}
            className="w-full py-2.5 border-2 border-dashed border-stone-200 rounded-xl text-xs text-stone-400 hover:border-amber-400 hover:text-amber-600 transition-colors mt-2">
            + Créer une ressource personnalisée
          </button>
        )}
      </div>

      {/* Recettes */}
      <div className="bg-white border border-stone-200 rounded-xl p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Recettes de transformation</p>
        <div className="space-y-1 mb-3">
          {recipes.length === 0 && <p className="text-xs text-stone-400 italic">Aucune recette.</p>}
          {recipes.map((r) => (
            <div key={r.id} className="flex items-center gap-2 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
              <span className="flex-1 text-xs text-stone-800 font-medium">{r.label}</span>
              <span className="text-[10px] text-stone-400">{r.companyType}</span>
              <span className="text-[10px] text-stone-500 ml-2">→ {r.outputQty}× {r.outputResourceId}</span>
              <button onClick={() => onDeleteEconomyRecipe(r.id)} className="ml-2 text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
            </div>
          ))}
        </div>
        {showNewRecipe ? (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Nouvelle recette</p>
            <input placeholder="Nom de la recette" value={newRecipe.label} onChange={(e) => setNewRecipe({ ...newRecipe, label: e.target.value })}
              className={inputCls} />
            <input placeholder="Type d'entreprise requis (ex: Forge)" value={newRecipe.companyType} onChange={(e) => setNewRecipe({ ...newRecipe, companyType: e.target.value })}
              className={inputCls} />
            <div className="grid grid-cols-2 gap-2">
              <select value={newRecipe.outputResourceId} onChange={(e) => setNewRecipe({ ...newRecipe, outputResourceId: e.target.value })}
                className={inputCls}>
                <option value="">Ressource produite…</option>
                {resources.map((r) => <option key={r.id} value={r.id}>{r.emoji} {r.label}</option>)}
              </select>
              <input type="number" placeholder="Quantité" min={1} value={newRecipe.outputQty}
                onChange={(e) => setNewRecipe({ ...newRecipe, outputQty: parseInt(e.target.value) || 1 })}
                className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddRecipe} className={btnPrimary}>Ajouter</button>
              <button onClick={() => setShowNewRecipe(false)} className={btnSecondary}>Annuler</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowNewRecipe(true)}
            className="w-full py-2.5 border-2 border-dashed border-stone-200 rounded-xl text-xs text-stone-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
            + Créer une recette de transformation
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Producers ───────────────────────────────────────────────────────────────

function ProducersTab({ companies, resources, recipes, onSetCompanyProductions }) {
  const [expanded, setExpanded] = useState(null);
  const [drafts, setDrafts] = useState({});

  const toggle = (id) => setExpanded(expanded === id ? null : id);

  const getDraft = (company) => {
    if (drafts[company.id]) return drafts[company.id];
    return { productions: company.productions || [], transformations: company.transformations || [] };
  };

  const setDraft = (companyId, patch) => {
    setDrafts((prev) => ({ ...prev, [companyId]: { ...getDraft({ id: companyId, productions: [], transformations: [] }), ...patch } }));
  };

  const save = (companyId) => {
    const d = drafts[companyId];
    if (!d) return;
    onSetCompanyProductions(companyId, d.productions, d.transformations);
    setDrafts((prev) => { const n = { ...prev }; delete n[companyId]; return n; });
  };

  return (
    <div className="space-y-2">
      {(companies || []).length === 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-400 text-sm">Aucune entreprise enregistrée.</div>
      )}
      {(companies || []).map((company) => {
        const draft = getDraft(company);
        const isOpen = expanded === company.id;
        const hasDraft = !!drafts[company.id];
        return (
          <div key={company.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors" onClick={() => toggle(company.id)}>
              <span className="text-lg">{company.emoji || "🏭"}</span>
              <span className="flex-1 text-sm font-bold text-stone-900">{company.name}</span>
              <span className="text-[10px] text-stone-400 uppercase">{company.type}</span>
              {(company.productions || []).length > 0 && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{company.productions.length} prod.</span>
              )}
              <span className="text-stone-400 ml-2 text-xs">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
              <div className="border-t border-stone-100 px-4 py-3 space-y-3 bg-stone-50/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Productions par cycle</p>
                {draft.productions.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={p.resourceId}
                      onChange={(e) => {
                        const prods = draft.productions.map((pr, i) => i === idx ? { ...pr, resourceId: e.target.value } : pr);
                        setDraft(company.id, { productions: prods });
                      }}
                      className="flex-1 border border-amber-200 rounded px-2 py-1.5 text-xs bg-white text-stone-900"
                    >
                      <option value="">Ressource…</option>
                      {resources.map((r) => <option key={r.id} value={r.id}>{r.emoji} {r.label}</option>)}
                    </select>
                    <input
                      type="number" min={1} value={p.outputPerCycle}
                      onChange={(e) => {
                        const prods = draft.productions.map((pr, i) => i === idx ? { ...pr, outputPerCycle: parseInt(e.target.value) || 1 } : pr);
                        setDraft(company.id, { productions: prods });
                      }}
                      className="w-20 border border-amber-200 rounded px-2 py-1.5 text-xs bg-white text-stone-900"
                    />
                    <button onClick={() => setDraft(company.id, { productions: draft.productions.filter((_, i) => i !== idx) })}
                      className="text-red-400 hover:text-red-600 text-sm font-bold">✕</button>
                  </div>
                ))}
                <button
                  onClick={() => setDraft(company.id, { productions: [...draft.productions, { resourceId: "", outputPerCycle: 1 }] })}
                  className="text-xs text-indigo-700 hover:text-indigo-900 font-bold"
                >
                  + Ajouter une production
                </button>

                {hasDraft && (
                  <button onClick={() => save(company.id)}
                    className="mt-2 px-4 py-1.5 bg-indigo-900 hover:bg-indigo-950 text-amber-300 rounded-lg text-xs font-bold uppercase transition-colors">
                    Enregistrer
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Events ──────────────────────────────────────────────────────────────────

function EventsTab({ marketEvents, resources, onAddMarketEvent, onRemoveMarketEvent }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ label: "", modifier: 1.2, resourceId: "", description: "" });

  const handleAdd = () => {
    if (!form.label.trim()) return;
    onAddMarketEvent({ ...form, modifier: parseFloat(form.modifier) || 1 });
    setForm({ label: "", modifier: 1.2, resourceId: "", description: "" });
    setShowNew(false);
  };

  const active = marketEvents.filter((e) => e.active);
  const inactive = marketEvents.filter((e) => !e.active);

  return (
    <div className="space-y-4">
      {active.length === 0 && inactive.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-400 text-sm">Aucun événement de marché.</div>
      )}

      {active.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Événements actifs</p>
          <div className="space-y-2">
            {active.map((e) => (
              <div key={e.id} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-800">⚡ {e.label}</p>
                  {e.description && <p className="text-[10px] text-amber-600 mt-0.5">{e.description}</p>}
                  <p className="text-[10px] text-amber-600 mt-1">
                    ×{e.modifier} · {e.resourceId ? resources.find((r) => r.id === e.resourceId)?.label || e.resourceId : "Toutes les ressources"}
                    {e.createdAt ? ` · ${e.createdAt}` : ""}
                  </p>
                </div>
                <button onClick={() => onRemoveMarketEvent(e.id)}
                  className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-xs font-bold">
                  Désactiver
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Événements passés</p>
          <div className="space-y-1">
            {inactive.map((e) => (
              <div key={e.id} className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-lg px-4 py-2 opacity-60">
                <p className="flex-1 text-xs text-stone-600">{e.label}</p>
                <span className="text-[10px] text-stone-400">×{e.modifier}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNew ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Nouvel événement de marché</p>
          <input placeholder="Nom de l'événement" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="p-1.5 border border-amber-200 rounded-lg text-xs bg-white w-full" />
          <input placeholder="Description (optionnel)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="p-1.5 border border-amber-200 rounded-lg text-xs bg-white w-full" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-widest block mb-1">Multiplicateur de prix</label>
              <input type="number" step={0.1} min={0.1} max={10} value={form.modifier} onChange={(e) => setForm({ ...form, modifier: e.target.value })}
                className="p-1.5 border border-amber-200 rounded-lg text-xs bg-white w-full" />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-widest block mb-1">Ressource ciblée (optionnel)</label>
              <select value={form.resourceId} onChange={(e) => setForm({ ...form, resourceId: e.target.value })}
                className="p-1.5 border border-amber-200 rounded-lg text-xs bg-white w-full">
                <option value="">Toutes les ressources</option>
                {resources.map((r) => <option key={r.id} value={r.id}>{r.emoji} {r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex items-center gap-1 bg-indigo-900 hover:bg-indigo-950 text-amber-300 px-4 py-1.5 rounded-lg text-xs font-bold uppercase">Créer l'événement</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold uppercase">Annuler</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowNew(true)}
          className="w-full py-2.5 border-2 border-dashed border-stone-200 rounded-xl text-xs text-stone-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors">
          + Créer un événement de marché
        </button>
      )}
    </div>
  );
}

// ─── Contracts ───────────────────────────────────────────────────────────────

function ContractsTab({ tradeContracts, resources, onAcceptTradeContract, onCancelTradeContract }) {
  const statusColors = {
    pending: "bg-amber-100 text-amber-800",
    active: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-stone-100 text-stone-600",
  };
  const statusLabel = { pending: "En attente", active: "Actif", cancelled: "Annulé", completed: "Terminé" };

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Contrats commerciaux ({tradeContracts.length})</p>
      {tradeContracts.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-400 text-sm">Aucun contrat.</div>
      ) : (
        <div className="space-y-2">
          {tradeContracts.map((c) => {
            const resource = resources.find((r) => r.id === c.resourceId);
            return (
              <div key={c.id} className="flex items-center gap-3 bg-white border border-stone-200 rounded-lg p-3">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusColors[c.status] || "bg-stone-100 text-stone-600"}`}>
                  {statusLabel[c.status] || c.status}
                </span>
                <div className="flex-1 text-xs text-stone-700 min-w-0">
                  <span className="font-bold">{resource?.emoji} {resource?.label || c.resourceId}</span>
                  {" — "}{c.quantity}/cycle
                  {c.fixedPrice ? ` @ ${c.fixedPrice} Écus` : " (prix marché)"}
                  <span className="text-stone-400"> · {c.sellerCompanyName} → {c.buyerCompanyName}</span>
                  {c.createdAt && <span className="text-stone-400 ml-2">· {c.createdAt}</span>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {c.status === "pending" && (
                    <button onClick={() => onAcceptTradeContract && onAcceptTradeContract(c.id)}
                      className="px-2 py-1 bg-indigo-900 hover:bg-indigo-950 text-amber-300 rounded text-[10px] font-bold uppercase">Activer</button>
                  )}
                  {(c.status === "pending" || c.status === "active") && (
                    <button onClick={() => onCancelTradeContract && onCancelTradeContract(c.id)}
                      className="px-2 py-1 text-red-500 hover:text-red-700 rounded text-[10px] font-bold uppercase border border-red-200 hover:bg-red-50">Annuler</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Diplomacy ───────────────────────────────────────────────────────────────

function DiplomacyTab({ tradeContracts, embargoes, countries, fromCountryId, setFromCountryId, toCountryId, setToCountryId, embargoLabel, setEmbargoLabel, onAddEmbargo, onRemoveEmbargo }) {
  const routes = {};
  for (const c of tradeContracts.filter((c) => c.status === "active")) {
    if (!c.sellerCountryId || !c.buyerCountryId || c.sellerCountryId === c.buyerCountryId) continue;
    const key = [c.sellerCountryId, c.buyerCountryId].sort().join("↔");
    if (!routes[key]) routes[key] = { key, count: 0, sellerCN: c.sellerCountryId, buyerCN: c.buyerCountryId };
    routes[key].count++;
  }
  const routeList = Object.values(routes);

  return (
    <div className="space-y-4">
      {/* Embargos actifs */}
      <div className="bg-white border border-stone-200 rounded-xl p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Embargos actifs ({embargoes.length})</p>
        {embargoes.length === 0 ? (
          <p className="text-xs text-stone-400 italic">Aucun embargo en vigueur.</p>
        ) : (
          <div className="space-y-2">
            {embargoes.map((e) => (
              <div key={e.id} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <span className="text-sm flex-1 text-stone-800">
                  <span className="font-bold">🚫 {e.fromCountryName}</span>
                  {" ↔ "}
                  <span className="font-bold">{e.toCountryName}</span>
                  {e.label && <span className="text-stone-500 text-xs"> — {e.label}</span>}
                  {e.createdAt && <span className="text-stone-400 text-xs ml-2">· {e.createdAt}</span>}
                </span>
                <button onClick={() => onRemoveEmbargo && onRemoveEmbargo(e.id)}
                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded text-[10px] font-bold text-stone-700 uppercase">
                  Lever
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Déclarer un embargo */}
      <div className="bg-white border border-stone-200 rounded-xl p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Déclarer un embargo</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Pays 1</label>
            <select value={fromCountryId} onChange={(e) => setFromCountryId(e.target.value)}
              className="p-1.5 border border-amber-200 rounded-lg text-xs bg-white w-full">
              <option value="">— Choisir —</option>
              {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Pays 2</label>
            <select value={toCountryId} onChange={(e) => setToCountryId(e.target.value)}
              className="p-1.5 border border-amber-200 rounded-lg text-xs bg-white w-full">
              <option value="">— Choisir —</option>
              {countries.filter((c) => c.id !== fromCountryId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Motif (optionnel)</label>
            <input value={embargoLabel} onChange={(e) => setEmbargoLabel(e.target.value)} placeholder="Ex: Représailles"
              className="p-1.5 border border-amber-200 rounded-lg text-xs bg-white w-full" />
          </div>
        </div>
        <button
          onClick={() => {
            if (!fromCountryId || !toCountryId) return;
            onAddEmbargo && onAddEmbargo(fromCountryId, toCountryId, embargoLabel);
            setFromCountryId(""); setToCountryId(""); setEmbargoLabel("");
          }}
          disabled={!fromCountryId || !toCountryId}
          className="bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors"
        >
          🚫 Déclarer l'embargo
        </button>
      </div>

      {/* Routes commerciales */}
      <div className="bg-white border border-stone-200 rounded-xl p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Routes commerciales inter-pays actives</p>
        {routeList.length === 0 ? (
          <p className="text-xs text-stone-400 italic">Aucune route commerciale inter-pays active.</p>
        ) : (
          <div className="space-y-2">
            {routeList.map((r) => {
              const cA = countries.find((c) => c.id === r.sellerCN);
              const cB = countries.find((c) => c.id === r.buyerCN);
              const isEmbargoed = embargoes.some((e) =>
                (e.fromCountryId === r.sellerCN && e.toCountryId === r.buyerCN) ||
                (e.fromCountryId === r.buyerCN && e.toCountryId === r.sellerCN)
              );
              return (
                <div key={r.key} className={`flex items-center gap-3 border rounded-lg p-3 ${isEmbargoed ? "bg-red-50 border-red-200" : "bg-stone-50 border-stone-100"}`}>
                  <span className="text-xs flex-1 text-stone-700">{cA?.name || r.sellerCN} ↔ {cB?.name || r.buyerCN}</span>
                  <span className="text-[10px] text-stone-400">{r.count} contrat{r.count > 1 ? "s" : ""}</span>
                  {isEmbargoed && <span className="text-[10px] font-black text-red-600 uppercase">🚫 Embargué</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
