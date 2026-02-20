import React, { useState } from "react";
import {
  Briefcase,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Coins,
  User,
  Building2,
  Globe,
  Flag,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import Card from "../ui/Card";

const FREQUENCIES = [
  { value: "daily", label: "Chaque jour RP" },
  { value: "weekly", label: "Chaque semaine RP (7 jours)" },
  { value: "monthly", label: "Chaque mois RP (1er du mois)" },
];

const SOURCE_TYPES = [
  { value: "COUNTRY", label: "Trésor du Pays", icon: Flag },
  { value: "GLOBAL", label: "Trésor Impérial", icon: Globe },
  { value: "CITIZEN", label: "Compte Citoyen", icon: User },
  { value: "COMPANY", label: "Trésor Entreprise", icon: Building2 },
];

const emptyJob = () => ({
  id: "JOB-" + Date.now().toString().slice(-6),
  name: "",
  active: true,
  amount: 0,
  frequency: "monthly",
  source: { type: "COUNTRY", id: "" },
  sourceName: "",
  recipients: [],
});

const JobsAdminView = ({
  jobs = [],
  citizens = [],
  countries = [],
  companies = [],
  session,
  roleInfo,
  onSaveJobContract,
  onDeleteJobContract,
  onToggleJobContract,
}) => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState(null);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientType, setRecipientType] = useState("CITIZEN");

  const isGlobal = roleInfo?.scope === "GLOBAL";

  // Filtrer les sources disponibles selon la portée de l'admin
  const availableCountries = isGlobal
    ? countries
    : countries.filter((c) => c.id === session?.countryId);
  const availableCompanies = isGlobal
    ? companies
    : companies.filter((c) => c.countryId === session?.countryId);
  const availableCitizens = isGlobal
    ? citizens
    : citizens.filter((c) => c.countryId === session?.countryId);

  const openNew = () => {
    const j = emptyJob();
    if (!isGlobal && availableCountries.length > 0) {
      j.source = { type: "COUNTRY", id: availableCountries[0].id };
      j.sourceName = availableCountries[0].name;
    }
    setForm(j);
    setSelectedJob(null);
  };

  const openEdit = (job) => {
    setForm(JSON.parse(JSON.stringify(job)));
    setSelectedJob(job.id);
  };

  const handleSourceTypeChange = (type) => {
    let id = "";
    let sourceName = "";
    if (type === "COUNTRY" && availableCountries.length > 0) {
      id = availableCountries[0].id;
      sourceName = availableCountries[0].name;
    } else if (type === "COMPANY" && availableCompanies.length > 0) {
      id = availableCompanies[0].id;
      sourceName = availableCompanies[0].name;
    } else if (type === "GLOBAL") {
      sourceName = "Trésor Impérial";
    }
    setForm((f) => ({ ...f, source: { type, id }, sourceName }));
  };

  const handleSourceIdChange = (id) => {
    let sourceName = "";
    if (form.source.type === "COUNTRY") {
      sourceName = countries.find((c) => c.id === id)?.name || id;
    } else if (form.source.type === "COMPANY") {
      sourceName = companies.find((c) => c.id === id)?.name || id;
    } else if (form.source.type === "CITIZEN") {
      sourceName = citizens.find((c) => c.id === id)?.name || id;
    }
    setForm((f) => ({ ...f, source: { ...f.source, id }, sourceName }));
  };

  const addRecipient = (type, entityId, entityName) => {
    const finalId = type === "GLOBAL" ? "GLOBAL" : entityId;
    if (!finalId) return;
    if (form.recipients.some((r) => r.id === finalId)) return;
    const existingTotal = form.recipients.reduce((s, r) => s + (r.percent || 0), 0);
    const remaining = Math.max(0, 100 - existingTotal);
    setForm((f) => ({
      ...f,
      recipients: [...f.recipients, { id: finalId, name: entityName, type, percent: remaining }],
    }));
    setRecipientSearch("");
  };

  const updatePercent = (citizenId, val) => {
    const num = Math.min(100, Math.max(0, parseInt(val) || 0));
    setForm((f) => ({
      ...f,
      recipients: f.recipients.map((r) => (r.id === citizenId ? { ...r, percent: num } : r)),
    }));
  };

  const removeRecipient = (citizenId) => {
    setForm((f) => ({ ...f, recipients: f.recipients.filter((r) => r.id !== citizenId) }));
  };

  const totalPercent = (form?.recipients || []).reduce((s, r) => s + (r.percent || 0), 0);
  const isValid =
    form &&
    form.name.trim() &&
    form.amount > 0 &&
    form.recipients.length > 0 &&
    totalPercent === 100 &&
    (form.source.type === "GLOBAL" || form.source.id);

  const handleSave = () => {
    if (!isValid || !onSaveJobContract) return;
    onSaveJobContract(form);
    setForm(null);
    setSelectedJob(null);
  };

  const handleDelete = (jobId) => {
    if (!window.confirm("Supprimer ce contrat d'emploi ?")) return;
    if (onDeleteJobContract) onDeleteJobContract(jobId);
    if (selectedJob === jobId) { setSelectedJob(null); setForm(null); }
  };

  // Résolution du nom de source pour affichage
  const resolveSourceLabel = (job) => {
    if (!job.source) return "—";
    if (job.source.type === "GLOBAL") return "🏛️ Trésor Impérial";
    if (job.source.type === "COUNTRY") return "🏴 " + (countries.find((c) => c.id === job.source.id)?.name || job.source.id);
    if (job.source.type === "CITIZEN") return "👤 " + (citizens.find((c) => c.id === job.source.id)?.name || job.source.id);
    if (job.source.type === "COMPANY") return "🏭 " + (companies.find((c) => c.id === job.source.id)?.name || job.source.id);
    return "—";
  };

  // Candidats selon le type sélectionné
  const filteredCandidates = (() => {
    const alreadyIn = (id) => (form?.recipients || []).some((r) => r.id === id);
    const q = recipientSearch.toLowerCase();
    if (recipientType === "CITIZEN") {
      return citizens.filter(
        (c) => c.status !== "Décédé" && !alreadyIn(c.id) &&
          (!q || c.name?.toLowerCase().includes(q) || c.id?.includes(recipientSearch))
      );
    }
    if (recipientType === "COUNTRY") {
      return countries.filter(
        (c) => !alreadyIn(c.id) && (!q || c.name?.toLowerCase().includes(q))
      );
    }
    if (recipientType === "COMPANY") {
      return companies.filter(
        (c) => !alreadyIn(c.id) && (!q || c.name?.toLowerCase().includes(q))
      );
    }
    return [];
  })();

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 font-sans min-h-0">
      {/* ── LISTE DES CONTRATS ── */}
      <div className="w-full md:w-1/3 bg-[#fdf6e3] rounded-xl border border-stone-300 flex flex-col overflow-hidden shadow-md min-h-0">
        {/* En-tête */}
        <div className="p-4 bg-stone-100 border-b flex justify-between items-center font-bold uppercase text-[11px] tracking-[0.2em] text-stone-500">
          <span>Contrats d'Emploi</span>
          <button
            onClick={openNew}
            className="bg-stone-800 text-white w-7 h-7 rounded-lg flex items-center justify-center hover:bg-stone-700 shadow-md transition-all active:scale-90"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Liste */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {jobs.length === 0 && (
            <div className="text-center text-stone-400 italic text-xs py-10">
              Aucun contrat défini.
              <br />
              <span className="text-[10px]">Cliquez sur + pour en créer un.</span>
            </div>
          )}
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedJob === job.id
                  ? "bg-stone-800 text-white border-yellow-600 shadow-xl translate-x-1"
                  : "bg-white/70 border-stone-200 hover:bg-white hover:shadow-sm"
              }`}
              onClick={() => openEdit(job)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-black text-sm truncate">{job.name || "Sans nom"}</div>
                  <div className={`text-[10px] mt-0.5 ${selectedJob === job.id ? "text-stone-300" : "text-stone-500"}`}>
                    {job.amount?.toLocaleString()} Écus · {FREQUENCIES.find((f) => f.value === job.frequency)?.label || job.frequency}
                  </div>
                  <div className={`text-[9px] truncate mt-0.5 ${selectedJob === job.id ? "text-stone-400" : "text-stone-400"}`}>
                    {resolveSourceLabel(job)}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); if (onToggleJobContract) onToggleJobContract(job.id); }}
                    className={`p-1 rounded transition-colors ${job.active ? "text-green-500 hover:text-green-700" : "text-stone-400 hover:text-stone-600"}`}
                    title={job.active ? "Actif — cliquer pour désactiver" : "Inactif — cliquer pour activer"}
                  >
                    {job.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(job.id); }}
                    className="p-1 text-red-400 hover:text-red-600 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {/* Bénéficiaires résumé */}
              <div className="flex flex-wrap gap-1 mt-2">
                {(job.recipients || []).map((r) => (
                  <span key={r.id} className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${selectedJob === job.id ? "bg-stone-700 text-stone-200" : "bg-stone-100 text-stone-600"}`}>
                    {r.name} {r.percent}%
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FORMULAIRE ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!form ? (
          <div className="h-full flex items-center justify-center text-stone-300 flex-col gap-6 italic">
            <Briefcase size={80} className="opacity-10" />
            <p className="text-xl tracking-widest opacity-30 uppercase font-serif">Contrats d'Emploi</p>
          </div>
        ) : (
          <div className="space-y-4 pb-10">
            {/* En-tête formulaire */}
            <div className="bg-stone-900 text-stone-100 rounded-xl p-5 flex items-center justify-between shadow-lg">
              <div>
                <div className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">
                  {selectedJob ? "Modifier le contrat" : "Nouveau contrat"}
                </div>
                <div className="font-black text-lg">{form.name || "Sans nom"}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setForm(null); setSelectedJob(null); }}
                  className="px-3 py-2 bg-stone-700 text-stone-300 rounded-lg text-[10px] font-bold uppercase hover:bg-stone-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isValid}
                  className="px-4 py-2 bg-yellow-500 text-stone-900 rounded-lg text-[10px] font-black uppercase hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Check size={14} /> Sauvegarder
                </button>
              </div>
            </div>

            {/* Section : Identité */}
            <Card title="Identité du Contrat" icon={Briefcase}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Nom du contrat</label>
                  <input
                    className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none focus:border-stone-800 font-bold"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ex : Salaire du Gouverneur, Pension royale…"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Montant total (Écus)</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none focus:border-stone-800 font-bold font-mono"
                    value={form.amount || ""}
                    onChange={(e) => setForm((f) => ({ ...f, amount: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Fréquence</label>
                  <select
                    className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none font-bold"
                    value={form.frequency}
                    onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <button
                    onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                    className={`text-2xl transition-colors ${form.active ? "text-green-500" : "text-stone-300"}`}
                  >
                    {form.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                  <span className="text-sm font-bold text-stone-700">
                    {form.active ? "Contrat actif — sera exécuté au prochain passage de jour" : "Contrat inactif — ne sera pas exécuté"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Section : Source */}
            <Card title="Source du Financement" icon={Coins}>
              <div className="space-y-4">
                {/* Type de source */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {SOURCE_TYPES.map((st) => {
                    const Icon = st.icon;
                    const disabled = !isGlobal && st.value === "GLOBAL";
                    return (
                      <button
                        key={st.value}
                        onClick={() => !disabled && handleSourceTypeChange(st.value)}
                        disabled={disabled}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all text-center ${
                          form.source.type === st.value
                            ? "border-stone-800 bg-stone-800 text-white"
                            : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
                        } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <Icon size={18} />
                        <span className="text-[9px] font-black uppercase tracking-wide leading-tight">{st.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sélecteur selon le type */}
                {form.source.type !== "GLOBAL" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">
                      {form.source.type === "COUNTRY" && "Pays"}
                      {form.source.type === "COMPANY" && "Entreprise"}
                      {form.source.type === "CITIZEN" && "Citoyen débiteur"}
                    </label>
                    <select
                      className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none font-bold"
                      value={form.source.id}
                      onChange={(e) => handleSourceIdChange(e.target.value)}
                    >
                      <option value="">— Sélectionner —</option>
                      {form.source.type === "COUNTRY" &&
                        availableCountries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      {form.source.type === "COMPANY" &&
                        availableCompanies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      {form.source.type === "CITIZEN" &&
                        availableCitizens.filter((c) => c.status !== "Décédé").map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                        ))}
                    </select>
                  </div>
                )}

                {form.source.type === "GLOBAL" && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-bold">
                    <Globe size={14} /> Les fonds seront prélevés sur le Trésor Impérial.
                  </div>
                )}
              </div>
            </Card>

            {/* Section : Bénéficiaires */}
            <Card title="Répartition entre Bénéficiaires" icon={User}>
              <div className="space-y-4">
                {/* Indicateur total % */}
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  totalPercent === 100
                    ? "bg-green-50 border-green-200"
                    : totalPercent > 100
                    ? "bg-red-50 border-red-200"
                    : "bg-amber-50 border-amber-200"
                }`}>
                  <div className="flex items-center gap-2">
                    <RefreshCw size={14} className={totalPercent === 100 ? "text-green-600" : "text-amber-500"} />
                    <span className="text-xs font-black uppercase text-stone-600">
                      Total réparti
                    </span>
                  </div>
                  <span className={`font-black text-lg font-mono ${
                    totalPercent === 100 ? "text-green-700" : totalPercent > 100 ? "text-red-700" : "text-amber-700"
                  }`}>
                    {totalPercent}%
                    {totalPercent !== 100 && (
                      <span className="text-[10px] font-bold ml-1">
                        {totalPercent < 100 ? `(manque ${100 - totalPercent}%)` : `(excède de ${totalPercent - 100}%)`}
                      </span>
                    )}
                  </span>
                </div>

                {/* Avertissement si total ≠ 100 */}
                {totalPercent !== 100 && form.recipients.length > 0 && (
                  <div className="flex items-center gap-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                    <AlertTriangle size={12} /> Le total doit être exactement 100% pour sauvegarder.
                  </div>
                )}

                {/* Liste des bénéficiaires */}
                {form.recipients.length === 0 ? (
                  <p className="text-xs text-stone-400 italic text-center py-4">Aucun bénéficiaire ajouté.</p>
                ) : (
                  <div className="space-y-2">
                    {form.recipients.map((r) => {
                      const share = Math.floor((form.amount || 0) * r.percent / 100);
                      const type = r.type || "CITIZEN";
                      const TypeIcon = type === "COUNTRY" ? Flag : type === "COMPANY" ? Building2 : type === "GLOBAL" ? Globe : User;
                      const typeLabel = type === "COUNTRY" ? "Pays" : type === "COMPANY" ? "Entreprise" : type === "GLOBAL" ? "Empire" : "Citoyen";
                      return (
                        <div key={r.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                          <TypeIcon size={14} className="text-stone-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-stone-800 truncate">{r.name}</div>
                            <div className="text-[10px] text-stone-400 font-mono flex items-center gap-2">
                              <span className="uppercase tracking-widest">{typeLabel}</span>
                              <span>·</span>
                              <span>= {share.toLocaleString()} Écus / versement</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              className="w-16 p-2 border-2 border-stone-200 rounded-lg text-center font-black text-stone-800 outline-none focus:border-stone-600 font-mono"
                              value={r.percent}
                              onChange={(e) => updatePercent(r.id, e.target.value)}
                            />
                            <span className="text-sm font-bold text-stone-500">%</span>
                            <button
                              onClick={() => removeRecipient(r.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 rounded transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Ajouter un bénéficiaire */}
                <div className="border-t border-stone-200 pt-3 space-y-3">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">
                    Ajouter un bénéficiaire
                  </label>

                  {/* Sélecteur de type */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { value: "CITIZEN", label: "Citoyen", icon: User },
                      { value: "COUNTRY", label: "Pays", icon: Flag },
                      { value: "COMPANY", label: "Entreprise", icon: Building2 },
                      { value: "GLOBAL", label: "Empire", icon: Globe },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => { setRecipientType(value); setRecipientSearch(""); }}
                        className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all text-center ${
                          recipientType === value
                            ? "border-stone-800 bg-stone-800 text-white"
                            : "border-stone-200 bg-white text-stone-500 hover:border-stone-400"
                        }`}
                      >
                        <Icon size={14} />
                        <span className="text-[8px] font-black uppercase tracking-wide leading-tight">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Trésor Impérial : bouton direct */}
                  {recipientType === "GLOBAL" && (
                    <button
                      onClick={() => addRecipient("GLOBAL", "GLOBAL", "Trésor Impérial")}
                      disabled={(form.recipients || []).some((r) => r.id === "GLOBAL")}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-stone-200 bg-white hover:border-stone-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Globe size={16} className="text-stone-500 shrink-0" />
                      <div className="text-left">
                        <div className="font-bold text-sm text-stone-800">Trésor Impérial</div>
                        <div className="text-[10px] text-stone-400">Les fonds seront versés dans le trésor central</div>
                      </div>
                      <Plus size={14} className="text-stone-400 ml-auto" />
                    </button>
                  )}

                  {/* Recherche citoyen / pays / entreprise */}
                  {recipientType !== "GLOBAL" && (
                    <div className="relative">
                      <input
                        className="w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none focus:border-stone-600 text-sm font-bold"
                        placeholder={
                          recipientType === "CITIZEN" ? "Filtrer par nom ou ID…" :
                          recipientType === "COUNTRY" ? "Filtrer par nom de pays…" :
                          "Filtrer par nom d'entreprise…"
                        }
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                      />
                      {(recipientSearch || recipientType !== "CITIZEN") && filteredCandidates.length > 0 && (
                        <div className={`${recipientType === "CITIZEN" && !recipientSearch ? "hidden" : ""} absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto space-y-1 border border-stone-200 rounded-xl bg-white p-2 shadow-xl`}>
                          {filteredCandidates.slice(0, 8).map((c) => {
                            const Icon = recipientType === "COUNTRY" ? Flag : recipientType === "COMPANY" ? Building2 : User;
                            return (
                              <button
                                key={c.id}
                                onClick={() => addRecipient(recipientType, c.id, c.name)}
                                className="w-full text-left p-2 rounded-lg hover:bg-stone-100 flex items-center gap-2 transition-colors"
                              >
                                <Icon size={12} className="text-stone-400 shrink-0" />
                                <span className="font-bold text-sm text-stone-800 truncate">{c.name}</span>
                                <span className="text-[9px] text-stone-400 ml-auto shrink-0">{c.id}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {recipientSearch && filteredCandidates.length === 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 border border-stone-200 rounded-xl bg-white p-3 shadow-xl">
                          <div className="text-xs text-stone-400 italic text-center">Aucun résultat.</div>
                        </div>
                      )}
                      {/* Affichage direct pour Pays/Entreprise sans recherche */}
                      {!recipientSearch && recipientType !== "CITIZEN" && filteredCandidates.length > 0 && (
                        <div className="mt-2 max-h-48 overflow-y-auto space-y-1 border border-stone-200 rounded-xl bg-white p-2">
                          {filteredCandidates.slice(0, 10).map((c) => {
                            const Icon = recipientType === "COUNTRY" ? Flag : Building2;
                            return (
                              <button
                                key={c.id}
                                onClick={() => addRecipient(recipientType, c.id, c.name)}
                                className="w-full text-left p-2 rounded-lg hover:bg-stone-100 flex items-center gap-2 transition-colors"
                              >
                                <Icon size={12} className="text-stone-400 shrink-0" />
                                <span className="font-bold text-sm text-stone-800 truncate">{c.name}</span>
                                <Plus size={12} className="text-stone-400 ml-auto" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Simulation */}
                {form.amount > 0 && form.recipients.length > 0 && totalPercent === 100 && (
                  <div className="bg-stone-900 rounded-xl p-4 text-stone-200">
                    <div className="text-[9px] uppercase tracking-widest text-stone-400 mb-3 font-black">
                      Simulation — par versement ({FREQUENCIES.find((f) => f.value === form.frequency)?.label})
                    </div>
                    <div className="space-y-1.5">
                      {form.recipients.map((r) => (
                        <div key={r.id} className="flex justify-between text-sm">
                          <span className="text-stone-300">{r.name}</span>
                          <span className="font-black font-mono text-yellow-400">
                            +{Math.floor(form.amount * r.percent / 100).toLocaleString()} Écus
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-stone-700 pt-2 mt-2 flex justify-between text-xs font-black">
                        <span className="text-stone-400 uppercase tracking-widest">Total prélevé</span>
                        <span className="text-white font-mono">{form.amount.toLocaleString()} Écus</span>
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
  );
};

export default JobsAdminView;
