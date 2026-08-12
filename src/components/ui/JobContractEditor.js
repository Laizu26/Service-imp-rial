import React, { useState } from "react";
import {
  Plus, Trash2, Check, X, ToggleLeft, ToggleRight, ScrollText, Users,
  RefreshCw, AlertTriangle, Building2,
} from "lucide-react";
import Card from "./Card";
import { formatMoney } from "../../lib/gameUtils";

// Éditeur de contrat d'emploi partagé — utilisé par MyCompanyView (contrats d'une entreprise)
// et MaisonDeAsiaAdmin (contrats de la Maison), auparavant deux implémentations dupliquées
// mot pour mot (mêmes actions, même validation, mêmes fréquences) qui ne différaient que par
// la palette de couleurs et le pool de destinataires éligibles à la répartition — c'est
// exactement ce que les props `theme`/`recipientPool` ci-dessous paramétrisent, le reste
// (sauvegarde, suppression, activation, simulation de versement) est unique et partagé.

export const CONTRACT_FREQUENCIES = [
  { value: "daily", label: "Chaque jour RP" },
  { value: "weekly", label: "Chaque semaine RP (7 jours)" },
  { value: "monthly", label: "Chaque mois RP (1er du mois)" },
  { value: "par_tache", label: "À la tâche (paiement immédiat)" },
];

const emptyContractForm = (sourceId, sourceName) => ({
  id: "JOB-" + Date.now().toString().slice(-6),
  name: "",
  active: true,
  amount: 0,
  frequency: "monthly",
  source: { type: "COMPANY", id: sourceId },
  sourceName,
  recipients: [],
});

const DEFAULT_THEME = {
  headerBar: "bg-stone-100 border-b border-stone-200 text-stone-500",
  newButton: "bg-stone-800 hover:bg-stone-700",
  selectedCard: "bg-stone-800 text-white border-yellow-600",
  chip: "bg-stone-700 text-stone-200",
  formHeader: "bg-stone-900 text-stone-100",
  formHeaderLabel: "text-stone-400",
  cancelButton: "bg-stone-700 text-stone-300 hover:bg-stone-600",
  saveButton: "bg-yellow-500 text-stone-900 hover:bg-yellow-400",
  focusBorder: "focus:border-stone-800",
  focusBorderAlt: "focus:border-stone-600",
  sourceBanner: "bg-stone-100 border-stone-200 text-stone-600",
  sourceBannerName: "text-stone-800",
  simBox: "bg-stone-900 text-stone-200",
  simLabel: "text-stone-400",
  simAmount: "text-yellow-400",
  simDivider: "border-stone-700",
  pickerHover: "hover:bg-stone-100",
  SourceIcon: Building2,
  CitizenIcon: Users,
};

/**
 * Props :
 * - contracts : contrats déjà filtrés par la source appelante
 * - sourceId, sourceName : identité utilisée pour les nouveaux contrats et la bannière "Source"
 * - recipientPool : [{ id, type: "CITIZEN"|"COMPANY", name }] — calculé par l'appelant, c'est
 *   ici que vivent les spécificités de chaque contexte (personnel d'une entreprise vs
 *   pensionnaires+trésorerie de la Maison)
 * - onSaveJobContract, onDeleteJobContract, onToggleJobContract : actions partagées
 * - disabled, disabledMessage : pour le cas "aucune source configurée" (Maison sans entreprise liée)
 * - theme : surcharge partielle de DEFAULT_THEME
 * - namePlaceholder : texte d'exemple du champ Nom (spécifique à chaque contexte)
 */
const JobContractEditor = ({
  contracts = [],
  sourceId,
  sourceName,
  recipientPool = [],
  onSaveJobContract,
  onDeleteJobContract,
  onToggleJobContract,
  disabled = false,
  disabledMessage,
  theme,
  namePlaceholder = "Ex : Salaire mensuel, Prime de production…",
}) => {
  const t = { ...DEFAULT_THEME, ...(theme || {}) };
  const [contractForm, setContractForm] = useState(null);
  const [selectedContractId, setSelectedContractId] = useState(null);

  const form = contractForm;
  const isParTache = form?.frequency === "par_tache";
  const totalPct = (form?.recipients || []).reduce((s, r) => s + (r.percent || 0), 0);
  const isValid =
    form &&
    form.name.trim() &&
    (isParTache || form.amount > 0) &&
    form.recipients.length > 0 &&
    totalPct === 100;

  const openNew = () => {
    if (disabled) return;
    setContractForm(emptyContractForm(sourceId, sourceName));
    setSelectedContractId(null);
  };

  const openEdit = (contract) => {
    setContractForm(JSON.parse(JSON.stringify(contract)));
    setSelectedContractId(contract.id);
  };

  const closeForm = () => { setContractForm(null); setSelectedContractId(null); };

  const handleSave = () => {
    if (!isValid || !onSaveJobContract) return;
    onSaveJobContract(form);
    closeForm();
  };

  const handleDelete = (id) => {
    if (!window.confirm("Supprimer ce contrat ?")) return;
    if (onDeleteJobContract) onDeleteJobContract(id);
    if (selectedContractId === id) closeForm();
  };

  const addRecipient = (worker) => {
    if (!form) return;
    if (form.recipients.some((r) => r.id === worker.id)) return;
    const existing = form.recipients.reduce((s, r) => s + (r.percent || 0), 0);
    setContractForm((f) => ({
      ...f,
      recipients: [...f.recipients, { ...worker, percent: Math.max(0, 100 - existing) }],
    }));
  };

  const updatePct = (id, val) => {
    const num = Math.min(100, Math.max(0, parseInt(val) || 0));
    setContractForm((f) => ({
      ...f,
      recipients: f.recipients.map((r) => (r.id === id ? { ...r, percent: num } : r)),
    }));
  };

  const removeRecipient = (id) => {
    setContractForm((f) => ({ ...f, recipients: f.recipients.filter((r) => r.id !== id) }));
  };

  const availableRecipients = recipientPool.filter((w) => !form?.recipients.some((r) => r.id === w.id));

  return (
    <div className="space-y-4">
      {disabled && disabledMessage && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-bold">
          <AlertTriangle size={16} /> {disabledMessage}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 min-h-0">
        {/* Liste des contrats */}
        <div className="w-full md:w-72 shrink-0 bg-[#fdf6e3] rounded-xl border border-stone-300 flex flex-col overflow-hidden shadow-md">
          <div className={`p-3 flex justify-between items-center font-bold uppercase text-[10px] tracking-widest ${t.headerBar}`}>
            <span>Contrats ({contracts.length})</span>
            <button
              onClick={openNew}
              disabled={disabled}
              className={`text-white w-6 h-6 rounded-lg flex items-center justify-center shadow-md disabled:opacity-40 ${t.newButton}`}
            >
              <Plus size={13} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {contracts.length === 0 && (
              <div className="text-center text-stone-400 italic text-xs py-8">
                Aucun contrat.<br />
                <span className="text-[10px]">Cliquez sur + pour en créer un.</span>
              </div>
            )}
            {contracts.map((c) => (
              <div
                key={c.id}
                onClick={() => openEdit(c)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedContractId === c.id
                    ? `shadow-xl ${t.selectedCard}`
                    : "bg-white/70 border-stone-200 hover:bg-white hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-sm truncate">{c.name || "Sans nom"}</div>
                    <div className={`text-[10px] mt-0.5 ${selectedContractId === c.id ? "opacity-80" : "text-stone-500"}`}>
                      {c.frequency !== "par_tache" && `${formatMoney(c.amount || 0)} · `}
                      {CONTRACT_FREQUENCIES.find((f) => f.value === c.frequency)?.label || c.frequency}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); if (onToggleJobContract) onToggleJobContract(c.id); }}
                      className={`p-1 rounded ${c.active ? "text-green-500" : "text-stone-400"}`}
                    >
                      {c.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                      className="p-1 text-red-400 hover:text-red-600 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(c.recipients || []).map((r) => (
                    <span key={r.id} className={`px-1 py-0.5 rounded text-[8px] font-bold ${selectedContractId === c.id ? t.chip : "bg-stone-100 text-stone-600"}`}>
                      {r.name} {r.percent}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulaire */}
        <div className="flex-1 min-h-0">
          {!form ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-300 gap-4 italic min-h-[200px]">
              <ScrollText size={60} className="opacity-10" />
              <p className="text-lg tracking-widest opacity-30 uppercase font-serif text-sm">Contrats d'Emploi</p>
            </div>
          ) : (
            <div className="space-y-4 pb-10">
              {/* Header */}
              <div className={`rounded-xl p-4 flex items-center justify-between shadow-lg ${t.formHeader}`}>
                <div>
                  <div className={`text-[9px] uppercase tracking-widest mb-1 ${t.formHeaderLabel}`}>
                    {selectedContractId ? "Modifier" : "Nouveau contrat"}
                  </div>
                  <div className="font-black">{form.name || "Sans nom"}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={closeForm}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase ${t.cancelButton}`}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!isValid}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-1 ${t.saveButton}`}
                  >
                    <Check size={13} /> Sauvegarder
                  </button>
                </div>
              </div>

              {/* Identité */}
              <Card title="Identité du Contrat" icon={ScrollText}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Nom</label>
                    <input
                      className={`w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none font-bold ${t.focusBorder}`}
                      value={form.name}
                      onChange={(e) => setContractForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder={namePlaceholder}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">
                      {isParTache ? "Montant / session (info)" : "Montant total (Écus)"}
                    </label>
                    <input
                      type="number" step="0.1" min={0}
                      className={`w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none font-bold font-mono ${t.focusBorder}`}
                      value={form.amount || ""}
                      onChange={(e) => setContractForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Fréquence</label>
                    <select
                      className="w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none font-bold"
                      value={form.frequency}
                      onChange={(e) => setContractForm((f) => ({ ...f, frequency: e.target.value }))}
                    >
                      {CONTRACT_FREQUENCIES.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <button
                      onClick={() => setContractForm((f) => ({ ...f, active: !f.active }))}
                      className={`text-2xl transition-colors ${form.active ? "text-green-500" : "text-stone-300"}`}
                    >
                      {form.active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                    <span className="text-sm font-bold text-stone-700">
                      {form.active ? "Actif — sera exécuté au prochain passage de jour" : "Inactif"}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Source */}
              <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border ${t.sourceBanner}`}>
                <t.SourceIcon size={14} /> Source : Trésorerie de <span className={`ml-1 ${t.sourceBannerName}`}>{sourceName}</span>
              </div>

              {/* Bénéficiaires */}
              <Card title="Répartition entre Bénéficiaires" icon={Users}>
                <div className="space-y-4">
                  {/* Indicateur total % */}
                  <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
                    totalPct === 100 ? "bg-green-50 border-green-200" : totalPct > 100 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                  }`}>
                    <div className="flex items-center gap-2">
                      <RefreshCw size={13} className={totalPct === 100 ? "text-green-600" : "text-amber-500"} />
                      <span className="text-xs font-black uppercase text-stone-600">Total</span>
                    </div>
                    <span className={`font-black font-mono ${totalPct === 100 ? "text-green-700" : totalPct > 100 ? "text-red-700" : "text-amber-700"}`}>
                      {totalPct}%
                      {totalPct !== 100 && (
                        <span className="text-[10px] font-bold ml-1">
                          {totalPct < 100 ? `(manque ${100 - totalPct}%)` : `(excède de ${totalPct - 100}%)`}
                        </span>
                      )}
                    </span>
                  </div>

                  {totalPct !== 100 && form.recipients.length > 0 && (
                    <div className="flex items-center gap-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      <AlertTriangle size={11} /> Le total doit être 100% pour sauvegarder.
                    </div>
                  )}

                  {/* Liste des bénéficiaires */}
                  {form.recipients.length === 0 ? (
                    <p className="text-xs text-stone-400 italic text-center py-3">Aucun bénéficiaire ajouté.</p>
                  ) : (
                    <div className="space-y-2">
                      {form.recipients.map((r) => {
                        const share = Math.floor((form.amount || 0) * r.percent / 100);
                        return (
                          <div key={r.id} className="flex items-center gap-3 p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-stone-800 truncate">{r.name}</div>
                              {!isParTache && (
                                <div className="text-[10px] text-stone-400 font-mono">
                                  = {formatMoney(share)} / versement
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number" min={0} max={100}
                                className={`w-14 p-1.5 border-2 border-stone-200 rounded-lg text-center font-black outline-none font-mono text-sm ${t.focusBorderAlt}`}
                                value={r.percent}
                                onChange={(e) => updatePct(r.id, e.target.value)}
                              />
                              <span className="text-xs font-bold text-stone-500">%</span>
                              <button onClick={() => removeRecipient(r.id)} className="p-1 text-red-400 hover:text-red-600">
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Ajouter un bénéficiaire */}
                  <div className="border-t border-stone-200 pt-3">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-2">
                      Ajouter un bénéficiaire
                    </label>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {availableRecipients.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => addRecipient(w)}
                          className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2 transition-colors border border-stone-100 ${t.pickerHover}`}
                        >
                          {w.type === "COMPANY"
                            ? <Building2 size={12} className="text-stone-400 shrink-0" />
                            : <t.CitizenIcon size={12} className="text-stone-400 shrink-0" />}
                          <span className="font-bold text-sm text-stone-800 truncate">{w.name}</span>
                          <Plus size={12} className="text-stone-400 ml-auto shrink-0" />
                        </button>
                      ))}
                      {availableRecipients.length === 0 && (
                        <p className="text-xs text-stone-400 italic text-center py-2">Tous les bénéficiaires disponibles sont déjà ajoutés.</p>
                      )}
                    </div>
                  </div>

                  {/* Simulation */}
                  {!isParTache && form.amount > 0 && form.recipients.length > 0 && totalPct === 100 && (
                    <div className={`rounded-xl p-3 ${t.simBox}`}>
                      <div className={`text-[9px] uppercase tracking-widest mb-2 font-black ${t.simLabel}`}>
                        Simulation — par versement
                      </div>
                      <div className="space-y-1">
                        {form.recipients.map((r) => (
                          <div key={r.id} className="flex justify-between text-sm">
                            <span className="opacity-80 truncate">{r.name}</span>
                            <span className={`font-black font-mono shrink-0 ml-2 ${t.simAmount}`}>
                              +{formatMoney(Math.floor(form.amount * r.percent / 100))}
                            </span>
                          </div>
                        ))}
                        <div className={`border-t pt-1.5 mt-1.5 flex justify-between text-xs font-black ${t.simDivider}`}>
                          <span className={`uppercase tracking-widest ${t.simLabel}`}>Total prélevé</span>
                          <span className="text-white font-mono">{formatMoney(form.amount)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobContractEditor;
