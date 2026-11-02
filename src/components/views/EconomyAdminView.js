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
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📦</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Commerce Impérial</h1>
          <p className="text-sm text-gray-500">Cycle {settings.cycleCount ?? 0} · {settings.cycleLabel || "Semaine"}</p>
        </div>
        <button
          onClick={onRunEconomyCycle}
          className="ml-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium"
        >
          ▶ Lancer un cycle
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === t.id
                ? "bg-white dark:bg-gray-800 border border-b-white dark:border-gray-700 dark:border-b-gray-800 text-amber-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
  const producerCount = (companies || []).filter((c) => (c.productions || []).length > 0).length;

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
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Ressources", value: resources.length, emoji: "📦" },
          { label: "Producteurs", value: producerCount, emoji: "🏭" },
          { label: "Contrats actifs", value: tradeContracts.filter((c) => c.status === "active").length, emoji: "📜" },
          { label: "Événements actifs", value: activeEvents.length, emoji: "⚡" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-2xl mb-1">{stat.emoji}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Active events alert */}
      {activeEvents.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
          <p className="font-semibold text-amber-800 dark:text-amber-300 mb-2">⚡ Événements de marché actifs</p>
          <div className="space-y-1">
            {activeEvents.map((e) => (
              <div key={e.id} className="text-sm text-amber-700 dark:text-amber-400">
                • {e.label} — ×{e.modifier} {e.resourceId ? `(${e.resourceId})` : "(global)"}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top producers */}
      {topProduced.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-3">🏆 Ressources les plus produites</p>
          <div className="space-y-2">
            {topProduced.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="text-lg w-7">{r.emoji}</span>
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{r.label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.supply}/cycle</span>
                <span className="text-sm text-amber-600">{r.currentPrice ?? r.basePrice} 🪙</span>
              </div>
            ))}
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
    <div className="mb-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-1">
        {list.map((r) => (
          <div key={r.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2">
            <span className="text-lg w-7">{r.emoji}</span>
            <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{r.label}</span>
            <span className="text-xs text-gray-400 mr-2">prix de base</span>
            <input
              type="number"
              className="w-20 text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={editPrices[r.id] !== undefined ? editPrices[r.id] : (r.basePrice ?? 0)}
              onChange={(e) => setEditPrices({ ...editPrices, [r.id]: e.target.value })}
              onBlur={(e) => { handlePriceBlur(r.id, e.target.value); setEditPrices((p) => { const n = { ...p }; delete n[r.id]; return n; }); }}
              min={0}
            />
            <span className="text-xs text-gray-400">🪙</span>
            {r.currentPrice != null && (
              <span className="text-xs text-amber-600 ml-2">→ {r.currentPrice} 🪙</span>
            )}
            {r.isCustom && (
              <button onClick={() => onDeleteEconomyResource(r.id)} className="ml-2 text-red-400 hover:text-red-600 text-xs">✕</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Sensitivity slider */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sensibilité des prix (K = {settings.priceSensitivity ?? 0.3})
        </label>
        <input
          type="range" min={0} max={1} step={0.05}
          value={settings.priceSensitivity ?? 0.3}
          onChange={(e) => onUpdateEconomy({ settings: { ...settings, priceSensitivity: parseFloat(e.target.value) } })}
          className="w-full mt-2"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Prix fixes</span><span>Très volatils</span></div>
      </div>

      <ResourceSection title="Ressources de base" list={base} />
      <ResourceSection title="Ressources dérivées" list={derived} />
      <ResourceSection title="Ressources personnalisées" list={custom} />

      {/* Add custom resource */}
      {showNewResource ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 space-y-3">
          <p className="font-semibold text-amber-800 dark:text-amber-300">Nouvelle ressource</p>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Nom" value={newRes.label} onChange={(e) => setNewRes({ ...newRes, label: e.target.value })}
              className="col-span-2 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            <input placeholder="Emoji" value={newRes.emoji} onChange={(e) => setNewRes({ ...newRes, emoji: e.target.value })}
              className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          </div>
          <input type="number" placeholder="Prix de base" value={newRes.basePrice} onChange={(e) => setNewRes({ ...newRes, basePrice: parseFloat(e.target.value) || 10 })}
            className="w-full border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          <div className="flex gap-2">
            <button onClick={handleAddResource} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm">Ajouter</button>
            <button onClick={() => setShowNewResource(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">Annuler</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowNewResource(true)} className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-colors">
          + Créer une ressource personnalisée
        </button>
      )}

      {/* Recipes */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recettes de transformation</p>
        <div className="space-y-1 mb-3">
          {recipes.map((r) => (
            <div key={r.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2">
              <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{r.label}</span>
              <span className="text-xs text-gray-400">{r.companyType}</span>
              <span className="text-xs text-gray-500 ml-2">→ {r.outputQty}× {r.outputResourceId}</span>
              <button onClick={() => onDeleteEconomyRecipe(r.id)} className="ml-2 text-red-400 hover:text-red-600 text-xs">✕</button>
            </div>
          ))}
        </div>
        {showNewRecipe ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 space-y-3">
            <p className="font-semibold text-blue-800 dark:text-blue-300">Nouvelle recette</p>
            <input placeholder="Nom de la recette" value={newRecipe.label} onChange={(e) => setNewRecipe({ ...newRecipe, label: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            <input placeholder="Type d'entreprise (ex: Forge)" value={newRecipe.companyType} onChange={(e) => setNewRecipe({ ...newRecipe, companyType: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            <div className="grid grid-cols-2 gap-3">
              <select value={newRecipe.outputResourceId} onChange={(e) => setNewRecipe({ ...newRecipe, outputResourceId: e.target.value })}
                className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="">Ressource produite…</option>
                {resources.map((r) => <option key={r.id} value={r.id}>{r.emoji} {r.label}</option>)}
              </select>
              <input type="number" placeholder="Quantité" min={1} value={newRecipe.outputQty} onChange={(e) => setNewRecipe({ ...newRecipe, outputQty: parseInt(e.target.value) || 1 })}
                className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddRecipe} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">Ajouter</button>
              <button onClick={() => setShowNewRecipe(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">Annuler</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowNewRecipe(true)} className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
            + Créer une recette
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
        <p className="text-sm text-gray-500 text-center py-8">Aucune entreprise enregistrée.</p>
      )}
      {(companies || []).map((company) => {
        const draft = getDraft(company);
        const isOpen = expanded === company.id;
        const hasDraft = !!drafts[company.id];
        return (
          <div key={company.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => toggle(company.id)}>
              <span className="text-lg">{company.emoji || "🏭"}</span>
              <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{company.name}</span>
              <span className="text-xs text-gray-400">{company.type}</span>
              {(company.productions || []).length > 0 && (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">{company.productions.length} prod.</span>
              )}
              <span className="text-gray-400 ml-2">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Productions par cycle</p>
                {draft.productions.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={p.resourceId}
                      onChange={(e) => {
                        const prods = draft.productions.map((pr, i) => i === idx ? { ...pr, resourceId: e.target.value } : pr);
                        setDraft(company.id, { productions: prods });
                      }}
                      className="flex-1 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                      className="w-20 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <button onClick={() => setDraft(company.id, { productions: draft.productions.filter((_, i) => i !== idx) })} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                  </div>
                ))}
                <button
                  onClick={() => setDraft(company.id, { productions: [...draft.productions, { resourceId: "", outputPerCycle: 1 }] })}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  + Ajouter une production
                </button>

                {hasDraft && (
                  <button onClick={() => save(company.id)} className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
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
        <p className="text-sm text-gray-500 text-center py-8">Aucun événement de marché.</p>
      )}

      {active.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Événements actifs</p>
          <div className="space-y-2">
            {active.map((e) => (
              <div key={e.id} className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">⚡ {e.label}</p>
                  {e.description && <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{e.description}</p>}
                  <p className="text-xs text-amber-500 mt-1">
                    ×{e.modifier} · {e.resourceId ? resources.find((r) => r.id === e.resourceId)?.label || e.resourceId : "Toutes les ressources"}
                  </p>
                </div>
                <button onClick={() => onRemoveMarketEvent(e.id)} className="px-3 py-1.5 bg-amber-100 dark:bg-amber-800 hover:bg-amber-200 dark:hover:bg-amber-700 text-amber-700 dark:text-amber-300 rounded-lg text-xs">
                  Désactiver
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Événements passés</p>
          <div className="space-y-1">
            {inactive.map((e) => (
              <div key={e.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2 opacity-60">
                <p className="flex-1 text-sm text-gray-600 dark:text-gray-400">{e.label}</p>
                <span className="text-xs text-gray-400">×{e.modifier}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNew ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 space-y-3">
          <p className="font-semibold text-green-800 dark:text-green-300">Nouvel événement de marché</p>
          <input placeholder="Nom de l'événement" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="w-full border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          <input placeholder="Description (optionnel)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Multiplicateur de prix</label>
              <input type="number" step={0.1} min={0.1} max={10} value={form.modifier} onChange={(e) => setForm({ ...form, modifier: e.target.value })}
                className="w-full border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Ressource ciblée (optionnel)</label>
              <select value={form.resourceId} onChange={(e) => setForm({ ...form, resourceId: e.target.value })}
                className="w-full border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="">Toutes les ressources</option>
                {resources.map((r) => <option key={r.id} value={r.id}>{r.emoji} {r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">Créer l'événement</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">Annuler</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowNew(true)} className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
          + Créer un événement de marché
        </button>
      )}
    </div>
  );
}

// ─── Contracts ───────────────────────────────────────────────────────────────

function ContractsTab({ tradeContracts, resources, onAcceptTradeContract, onCancelTradeContract }) {
  const statusColors = { pending: "bg-amber-100 text-amber-800", active: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800", completed: "bg-gray-100 text-gray-600" };
  const statusLabel = { pending: "En attente", active: "Actif", cancelled: "Annulé", completed: "Terminé" };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-gray-700 dark:text-gray-200">Contrats commerciaux ({tradeContracts.length})</h2>
      {tradeContracts.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">Aucun contrat.</p>
      ) : (
        <div className="space-y-2">
          {tradeContracts.map((c) => {
            const resource = resources.find((r) => r.id === c.resourceId);
            return (
              <div key={c.id} className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusColors[c.status] || "bg-gray-100 text-gray-600"}`}>{statusLabel[c.status] || c.status}</span>
                <span className="text-sm flex-1 text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">{resource?.emoji} {resource?.label || c.resourceId}</span>
                  {" — "}{c.quantity}/cycle
                  {c.fixedPrice ? ` @ ${c.fixedPrice} ₵` : " (prix marché)"}
                  <span className="text-gray-400"> · {c.sellerCompanyName} → {c.buyerCompanyName}</span>
                </span>
                <div className="flex gap-2 shrink-0">
                  {c.status === "pending" && (
                    <button onClick={() => onAcceptTradeContract && onAcceptTradeContract(c.id)} className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold">Activer</button>
                  )}
                  {(c.status === "pending" || c.status === "active") && (
                    <button onClick={() => onCancelTradeContract && onCancelTradeContract(c.id)} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold">Annuler</button>
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
    <div className="space-y-6">
      {/* Embargos actifs */}
      <div>
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Embargos actifs ({embargoes.length})</h2>
        {embargoes.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun embargo en vigueur.</p>
        ) : (
          <div className="space-y-2">
            {embargoes.map((e) => (
              <div key={e.id} className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <span className="text-sm flex-1 text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">🚫 {e.fromCountryName}</span>
                  {" ↔ "}
                  <span className="font-semibold">{e.toCountryName}</span>
                  {e.label && <span className="text-gray-500"> — {e.label}</span>}
                </span>
                <button onClick={() => onRemoveEmbargo && onRemoveEmbargo(e.id)} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-xs font-bold text-gray-700 dark:text-gray-200">
                  Lever
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Déclarer un embargo */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 text-sm">Déclarer un embargo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Pays 1</label>
            <select value={fromCountryId} onChange={(e) => setFromCountryId(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200">
              <option value="">— Choisir —</option>
              {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Pays 2</label>
            <select value={toCountryId} onChange={(e) => setToCountryId(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200">
              <option value="">— Choisir —</option>
              {countries.filter((c) => c.id !== fromCountryId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Motif (optionnel)</label>
            <input value={embargoLabel} onChange={(e) => setEmbargoLabel(e.target.value)} placeholder="Ex: Représailles" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200" />
          </div>
        </div>
        <button
          onClick={() => {
            if (!fromCountryId || !toCountryId) return;
            onAddEmbargo && onAddEmbargo(fromCountryId, toCountryId, embargoLabel);
            setFromCountryId(""); setToCountryId(""); setEmbargoLabel("");
          }}
          disabled={!fromCountryId || !toCountryId}
          className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium"
        >
          Déclarer l'embargo
        </button>
      </div>

      {/* Routes commerciales actives */}
      <div>
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 text-sm">Routes commerciales inter-pays actives</h3>
        {routeList.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune route commerciale inter-pays active.</p>
        ) : (
          <div className="space-y-2">
            {routeList.map((r) => {
              const cA = countries.find((c) => c.id === r.sellerCN);
              const cB = countries.find((c) => c.id === r.buyerCN);
              const isEmbargoed = embargoes.some((e) => (e.fromCountryId === r.sellerCN && e.toCountryId === r.buyerCN) || (e.fromCountryId === r.buyerCN && e.toCountryId === r.sellerCN));
              return (
                <div key={r.key} className={`flex items-center gap-3 border rounded-lg p-3 ${isEmbargoed ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}>
                  <span className="text-sm flex-1">{cA?.name || r.sellerCN} ↔ {cB?.name || r.buyerCN}</span>
                  <span className="text-xs text-gray-500">{r.count} contrat{r.count > 1 ? "s" : ""}</span>
                  {isEmbargoed && <span className="text-xs font-bold text-red-600">🚫 EMBARGUÉ</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
