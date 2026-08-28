import React, { useState } from "react";
import { FlaskConical, Search, Clock, History, Coins, HeartHandshake, ClipboardList, Beaker, Pencil, Check as CheckIcon, X as XIcon } from "lucide-react";
import { formatMoney, getApothecaryOffer, getApothecaryTreatments, getResearchCost, HANGOVER_INFO } from "../../lib/gameUtils";

const EFFECT_OPTIONS = [
  { id: "CURE", label: "Guérison immédiate" },
  { id: "REDUCE_DAYS", label: "Réduit la durée restante (jours)", min: 1, max: 10 },
  { id: "REDUCE_PENALTY", label: "Réduit la pénalité de production (%)", min: 5, max: 90 },
  { id: "STATUS", label: "Autre — ajoute/retire des effets" },
];

const STATUS_LABELS = { PENDING: "En attente", COMPLETED: "Soigné", DECLINED: "Refusée", CANCELLED: "Annulée" };
const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
  CANCELLED: "bg-stone-200 text-stone-600",
};

// Reprend les identifiants d'états physiques/magiques définis dans CitizenPhysicsMagicView.js
// (et configurés côté MJ dans GameMasterView.js) — dupliqué localement comme le reste du site
// pour un affichage compact dans la fiche de santé, sans dépendre de ces vues.
const STATUS_EFFECT_LABELS = {
  fatigue_legere: { label: "Fatigué(e)", icon: "😴" },
  emeche: { label: "Éméché(e)", icon: "🍷" },
  alcoolise: { label: "Alcoolisé(e)", icon: "🍺" },
  ovulation: { label: "En ovulation", icon: "🌸" },
  enceinte: { label: "Enceinte", icon: "🤰" },
  enrhume: { label: "Enrhumé(e)", icon: "🤧" },
  fievre: { label: "Fièvre", icon: "🌡️" },
  empoisonne: { label: "Empoisonné(e)", icon: "☠️" },
  sous_drogue: { label: "Sous substance", icon: "💊" },
  affaibli: { label: "Affaibli(e)", icon: "😓" },
  en_rut: { label: "En rut / en chaleur", icon: "🔥" },
  blessure_cachee: { label: "Blessure interne", icon: "🩸" },
  paralysie: { label: "Paralysé(e)", icon: "🧊" },
  sous_charme: { label: "Sous charme", icon: "✨" },
  envoute: { label: "Envoûté(e)", icon: "🔮" },
  malediction: { label: "Sous malédiction", icon: "💀" },
  beni: { label: "Béni(e)", icon: "⭐" },
  transformation: { label: "En transformation", icon: "🐺" },
  possede: { label: "Possédé(e)", icon: "👻" },
  lien_magique: { label: "Lié(e) magiquement", icon: "🔗" },
  surcharge_mana: { label: "Surcharge de mana", icon: "⚡" },
  manque_mana: { label: "Manque de mana", icon: "🌑" },
  vision_magique: { label: "Vision altérée (magie)", icon: "👁️" },
};

const formatDate = (ts) => (ts ? new Date(ts).toLocaleDateString("fr-FR") : "");

// Fiche de santé complète d'un patient, telle que consultée en direct par l'apothicaire désigné —
// pas un instantané figé : reflète l'état du citoyen au moment où l'apothicaire la consulte.
const HealthFile = ({ patient, gameDate }) => {
  if (!patient) return <p className="text-xs text-stone-400 italic">Patient introuvable.</p>;
  const gd = gameDate || { day: 1, month: 1, year: 1200 };
  const todayKey = `${gd.day}/${gd.month}/${gd.year}`;
  const drunkPercent = patient.drunkenness?.day === todayKey ? (patient.drunkenness.percent || 0) : 0;
  const hasHangover = patient.hangover?.day === todayKey;
  const activeEffects = (patient.statusEffects || []).map((id) => STATUS_EFFECT_LABELS[id]).filter(Boolean);
  const injuries = Object.entries(patient.physicalStats?.injuries || {}).filter(([, st]) => st && st !== "sain");

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-3 space-y-2">
      {patient.illness && (
        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
          <span className="text-lg shrink-0">{patient.illness.icon || "🤒"}</span>
          <div>
            <div className="font-bold text-xs text-yellow-900">{patient.illness.name || "Maladie"}</div>
            {patient.illness.description && <div className="text-[11px] text-yellow-800 italic">{patient.illness.description}</div>}
            <div className="text-[10px] text-yellow-700 mt-0.5">
              {Math.max(0, (patient.illness.durationDays || 0) - (patient.illness.daysElapsed || 0))} jour(s) avant guérison estimée
              {patient.illness.productionPenaltyPercent ? ` — malus de production ${patient.illness.productionPenaltyPercent}%` : ""}
            </div>
          </div>
        </div>
      )}
      {drunkPercent > 0 && (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">🍺 Ivresse : {Math.round(drunkPercent)}%</div>
      )}
      {hasHangover && (
        <div className="text-[11px] text-stone-600 bg-stone-100 border border-stone-200 rounded-lg px-2 py-1">🤕 {HANGOVER_INFO.label} — {HANGOVER_INFO.desc}</div>
      )}
      {activeEffects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {activeEffects.map((e, i) => (
            <span key={i} className="text-[10px] bg-stone-100 border border-stone-200 rounded-full px-2 py-0.5">{e.icon} {e.label}</span>
          ))}
        </div>
      )}
      {injuries.length > 0 && (
        <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
          🩹 {injuries.length} blessure{injuries.length > 1 ? "s" : ""} visible{injuries.length > 1 ? "s" : ""}
        </div>
      )}
      {!patient.illness && drunkPercent === 0 && !hasHangover && activeEffects.length === 0 && injuries.length === 0 && (
        <p className="text-[11px] text-stone-400 italic">Aucun état de santé notable relevé.</p>
      )}
    </div>
  );
};

const ApothecaryView = ({
  user,
  citizens = [],
  illnessConfig,
  careRequests = [],
  gameDate,
  onSetApothecaryOffer,
  onRequestTreatment,
  onCancelTreatmentRequest,
  onDeclineTreatmentRequest,
  onAdministerRequestedTreatment,
  onSelfTreat,
  onResearchTreatment,
  onEditResearchedTreatment,
}) => {
  const isApothicaire = (user?.occupation || "").trim().toLowerCase() === "apothicaire";
  const myTreatments = getApothecaryTreatments(user, illnessConfig);
  const myIllness = user?.illness;

  const [tab, setTab] = useState("demandes");
  const [search, setSearch] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [priceDrafts, setPriceDrafts] = useState({});
  const [declineDraft, setDeclineDraft] = useState({});
  const [treatmentChoice, setTreatmentChoice] = useState({});
  const [researchForm, setResearchForm] = useState({ name: "", icon: "", description: "", effect: "REDUCE_PENALTY", value: 15, addEffects: [], removeEffects: [] });
  const [baseId, setBaseId] = useState("");
  const [editingResearchId, setEditingResearchId] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: "", icon: "" });

  // Partir d'une base déjà créée (catalogue MJ ou une de mes propres inventions) pour préremplir
  // le formulaire et gagner du temps sur une variante — n'affecte pas l'original, une nouvelle
  // recherche (et son coût) reste nécessaire pour la valider.
  const applyBase = (id) => {
    setBaseId(id);
    if (!id) return;
    const base = myTreatments.find((t) => t.id === id);
    if (!base) return;
    setResearchForm({
      name: `${base.name} (variante)`,
      icon: base.icon || "",
      description: base.description || "",
      effect: base.effect,
      value: base.value || (EFFECT_OPTIONS.find((e) => e.id === base.effect)?.min || 0),
      addEffects: base.addEffects ? [...base.addEffects] : [],
      removeEffects: base.removeEffects ? [...base.removeEffects] : [],
    });
  };

  const myPendingRequest = careRequests.find((r) => r.patientId === user.id && r.status === "PENDING");
  const myRequestHistory = careRequests
    .filter((r) => r.patientId === user.id && r.status !== "PENDING")
    .sort((a, b) => (b.respondedAt || b.requestedAt || 0) - (a.respondedAt || a.requestedAt || 0));

  const incomingRequests = isApothicaire
    ? careRequests.filter((r) => r.apothecaryId === user.id && r.status === "PENDING").sort((a, b) => b.requestedAt - a.requestedAt)
    : [];
  const myGivenHistory = isApothicaire
    ? careRequests.filter((r) => r.apothecaryId === user.id && r.status !== "PENDING")
        .sort((a, b) => (b.respondedAt || b.requestedAt || 0) - (a.respondedAt || a.requestedAt || 0))
    : [];

  const apothecaries = citizens.filter((c) => c.id !== user.id && (c.occupation || "").trim().toLowerCase() === "apothicaire");
  const filteredApothecaries = apothecaries.filter((a) => !search.trim() || (a.name || "").toLowerCase().includes(search.trim().toLowerCase()));
  const offersFor = (apothecary) => getApothecaryTreatments(apothecary, illnessConfig).map((t) => ({ ...t, offer: getApothecaryOffer(apothecary, t) })).filter((t) => t.offer.active);

  const myOffers = myTreatments.map((t) => ({ ...t, offer: getApothecaryOffer(user, t) })).filter((t) => t.offer.active);

  const researchEffect = EFFECT_OPTIONS.find((e) => e.id === researchForm.effect);
  const researchCost = getResearchCost(researchForm);
  const canAffordResearch = (user?.balance || 0) >= researchCost;
  const hasStatusSelection = researchForm.addEffects.length > 0 || researchForm.removeEffects.length > 0;
  const canSubmitResearch = researchForm.name.trim() && canAffordResearch && (researchForm.effect !== "STATUS" || hasStatusSelection);

  const toggleStatusEffect = (list, id) => {
    const current = researchForm[list];
    const otherList = list === "addEffects" ? "removeEffects" : "addEffects";
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    setResearchForm({ ...researchForm, [list]: next, [otherList]: researchForm[otherList].filter((x) => x !== id) });
  };

  const TABS = [
    { id: "demandes", label: `Demandes reçues${incomingRequests.length > 0 ? ` (${incomingRequests.length})` : ""}` },
    { id: "tarifs", label: "Mes tarifs" },
    { id: "recherche", label: "Recherche" },
    { id: "historique", label: "Historique" },
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <FlaskConical size={22} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-black text-stone-800">Apothicaire</h2>
            <p className="text-xs text-stone-400">Soins et traitements</p>
          </div>
        </div>
      </div>

      {/* ── Auto-soin (apothicaire malade) ── */}
      {isApothicaire && myIllness && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
          <div className="text-[10px] font-black uppercase text-emerald-700 tracking-widest flex items-center gap-1.5">
            <HeartHandshake size={12} /> Vous êtes malade ({myIllness.name || "maladie"}) — auto-soin
          </div>
          <div className="flex flex-wrap gap-2">
            {myOffers.map((t) => (
              <button key={t.id} onClick={() => onSelfTreat(t.id)}
                className="flex items-center gap-1.5 bg-white border border-emerald-300 rounded-lg px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors">
                <span>{t.icon}</span> {t.name}
              </button>
            ))}
            {myOffers.length === 0 && <p className="text-xs text-stone-400 italic">Aucun soin actif dans votre offre.</p>}
          </div>
        </div>
      )}

      {/* ── VOLET APOTHICAIRE ── */}
      {isApothicaire && (
        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
          <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-t-lg border-b-2 whitespace-nowrap transition-all ${
                  tab === t.id ? "border-emerald-500 text-emerald-700 bg-white" : "border-transparent text-stone-400 hover:text-stone-600"
                }`}>{t.label}</button>
            ))}
          </div>
          <div className="p-5 space-y-3">
            {tab === "demandes" && (
              <>
                {incomingRequests.length === 0 && <p className="text-sm text-stone-400 italic text-center py-6">Aucune demande en attente.</p>}
                {incomingRequests.map((r) => {
                  const patient = citizens.find((c) => c.id === r.patientId);
                  const availableOffers = patient ? myOffers : [];
                  const chosenId = treatmentChoice[r.id];
                  return (
                    <div key={r.id} className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-stone-800 text-sm">{r.patientName}</div>
                        <div className="text-[10px] text-stone-400">{formatDate(r.requestedAt)}</div>
                      </div>
                      {r.note && <p className="text-xs text-stone-500 italic bg-white rounded-lg border border-stone-100 p-2">{r.note}</p>}

                      <div>
                        <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1.5 flex items-center gap-1"><ClipboardList size={10} /> Fiche de santé</div>
                        <HealthFile patient={patient} gameDate={gameDate} />
                      </div>

                      <div>
                        <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1.5">Administrer un traitement</div>
                        {availableOffers.length === 0 ? (
                          <p className="text-xs text-stone-400 italic">Aucun soin actif dans votre offre.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {availableOffers.map((t) => (
                              <button key={t.id} onClick={() => setTreatmentChoice({ ...treatmentChoice, [r.id]: t.id })}
                                className={`text-left p-2.5 rounded-lg border-2 transition-colors ${
                                  chosenId === t.id ? "border-emerald-400 bg-emerald-50" : "border-stone-200 bg-white hover:border-stone-300"
                                }`}>
                                <div className="flex items-center gap-1.5 text-sm">
                                  <span>{t.icon}</span>
                                  <span className="font-bold text-stone-800">{t.name}</span>
                                </div>
                                <div className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1"><Coins size={9} /> {formatMoney(t.offer.price)}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          onClick={() => { if (chosenId) { onAdministerRequestedTreatment(r.id, chosenId); setTreatmentChoice({ ...treatmentChoice, [r.id]: undefined }); } }}
                          disabled={!chosenId}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase">
                          <FlaskConical size={12} /> Administrer et facturer
                        </button>
                        <input
                          className="flex-1 min-w-32 p-2 border border-stone-200 rounded-lg text-xs outline-none"
                          placeholder="Motif du refus (optionnel)..."
                          value={declineDraft[r.id] || ""}
                          onChange={(e) => setDeclineDraft({ ...declineDraft, [r.id]: e.target.value })}
                        />
                        <button onClick={() => onDeclineTreatmentRequest(r.id, declineDraft[r.id])}
                          className="text-red-500 text-[10px] font-bold uppercase border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50">
                          Refuser
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {tab === "tarifs" && (
              <>
                {myTreatments.length === 0 ? (
                  <p className="text-sm text-stone-400 italic text-center py-6">Aucun traitement disponible — définissez-en un par recherche ou attendez que l'administration en configure.</p>
                ) : (
                  <div className="space-y-2">
                    {myTreatments.map((t) => {
                      const offer = getApothecaryOffer(user, t);
                      return (
                        <div key={t.id} className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                          <span className="text-lg shrink-0">{t.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-stone-800 flex items-center gap-1.5">
                              {t.name}
                              {t.researchedAt && <span className="text-[8px] font-black uppercase bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full shrink-0">Inventé</span>}
                            </div>
                            {t.description && <div className="text-[10px] text-stone-400 italic truncate">{t.description}</div>}
                          </div>
                          <input
                            type="number" step="0.1"
                            className="w-24 p-1.5 border border-stone-200 rounded-lg text-sm font-mono outline-none focus:border-emerald-400"
                            placeholder={String(t.price || 0)}
                            value={priceDrafts[t.id] ?? offer.price}
                            onChange={(e) => setPriceDrafts({ ...priceDrafts, [t.id]: e.target.value })}
                            onBlur={(e) => onSetApothecaryOffer(t.id, { price: e.target.value })}
                          />
                          <button
                            onClick={() => onSetApothecaryOffer(t.id, { active: !offer.active })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${offer.active ? "bg-emerald-500" : "bg-stone-300"}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${offer.active ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {tab === "recherche" && (
              <div className="space-y-5">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                  <div className="text-[10px] font-black uppercase text-purple-700 tracking-widest flex items-center gap-1.5">
                    <Beaker size={12} /> Inventer un nouveau traitement
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Ce traitement vous sera propre — les autres apothicaires ne le verront pas dans leur offre.
                  </p>
                  {myTreatments.length > 0 && (
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-1">Partir d'une base (optionnel)</label>
                      <select className="w-full p-2 border border-stone-200 rounded-lg text-sm bg-white outline-none"
                        value={baseId} onChange={(e) => applyBase(e.target.value)}>
                        <option value="">— Partir de zéro —</option>
                        {myTreatments.map((t) => (
                          <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input className="sm:col-span-2 p-2 border border-stone-200 rounded-lg text-sm outline-none"
                      placeholder="Nom du traitement..." value={researchForm.name}
                      onChange={(e) => setResearchForm({ ...researchForm, name: e.target.value })} />
                    <input className="p-2 border border-stone-200 rounded-lg text-sm outline-none text-center"
                      placeholder="⚗️" maxLength={2} value={researchForm.icon}
                      onChange={(e) => setResearchForm({ ...researchForm, icon: e.target.value })} />
                  </div>
                  <textarea className="w-full p-2 border border-stone-200 rounded-lg text-sm outline-none resize-none" rows={2}
                    placeholder="Description (optionnelle)..." value={researchForm.description}
                    onChange={(e) => setResearchForm({ ...researchForm, description: e.target.value })} />
                  <div className="flex flex-wrap gap-2">
                    {EFFECT_OPTIONS.map((e) => (
                      <button key={e.id} onClick={() => setResearchForm({ ...researchForm, effect: e.id, value: e.min || 0, addEffects: [], removeEffects: [] })}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border-2 transition-colors ${
                          researchForm.effect === e.id ? "border-purple-400 bg-purple-100 text-purple-800" : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                        }`}>{e.label}</button>
                    ))}
                  </div>
                  {researchEffect?.min !== undefined && (
                    <div className="flex items-center gap-2">
                      <input type="range" min={researchEffect.min} max={researchEffect.max} value={researchForm.value}
                        onChange={(e) => setResearchForm({ ...researchForm, value: Number(e.target.value) })}
                        className="flex-1" />
                      <span className="text-xs font-mono font-bold text-stone-700 w-16 text-right">{researchForm.value} {researchEffect.id === "REDUCE_PENALTY" ? "%" : "j."}</span>
                    </div>
                  )}
                  {researchForm.effect === "STATUS" && (
                    <div className="space-y-2">
                      <div>
                        <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1">Effets à ajouter</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(STATUS_EFFECT_LABELS).map(([id, e]) => (
                            <button key={id} onClick={() => toggleStatusEffect("addEffects", id)}
                              className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                                researchForm.addEffects.includes(id) ? "bg-green-100 border-green-300 text-green-800" : "bg-white border-stone-200 text-stone-500 hover:border-stone-300"
                              }`}>{e.icon} {e.label}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1">Effets à retirer</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(STATUS_EFFECT_LABELS).map(([id, e]) => (
                            <button key={id} onClick={() => toggleStatusEffect("removeEffects", id)}
                              className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                                researchForm.removeEffects.includes(id) ? "bg-red-100 border-red-300 text-red-800" : "bg-white border-stone-200 text-stone-500 hover:border-stone-300"
                              }`}>{e.icon} {e.label}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between bg-white border border-stone-200 rounded-lg px-3 py-2">
                    <span className="text-xs text-stone-500">Coût de la recherche</span>
                    <span className={`font-black font-mono text-sm ${canAffordResearch ? "text-purple-700" : "text-red-600"}`}>{formatMoney(researchCost)}</span>
                  </div>
                  <button
                    onClick={() => { onResearchTreatment(researchForm); setResearchForm({ name: "", icon: "", description: "", effect: "REDUCE_PENALTY", value: 15, addEffects: [], removeEffects: [] }); setBaseId(""); }}
                    disabled={!canSubmitResearch}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white py-2.5 rounded-lg font-black uppercase text-xs flex items-center justify-center gap-2">
                    <Beaker size={14} /> Lancer la recherche
                  </button>
                </div>

                <div>
                  <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-2">Mes inventions ({(user.apothecaryResearch || []).length})</div>
                  {(user.apothecaryResearch || []).length === 0 ? (
                    <p className="text-sm text-stone-400 italic text-center py-4">Aucune recherche aboutie pour le moment.</p>
                  ) : (
                    <div className="space-y-2">
                      {[...(user.apothecaryResearch || [])].reverse().map((r) => (
                        editingResearchId === r.id ? (
                          <div key={r.id} className="flex items-center gap-2 bg-white border-2 border-purple-300 rounded-xl px-3 py-2">
                            <input className="w-14 p-1.5 border border-stone-200 rounded-lg text-sm outline-none text-center"
                              maxLength={2} value={editDraft.icon} onChange={(e) => setEditDraft({ ...editDraft, icon: e.target.value })} />
                            <input className="flex-1 p-1.5 border border-stone-200 rounded-lg text-sm outline-none"
                              value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} />
                            <button onClick={() => { onEditResearchedTreatment(r.id, editDraft); setEditingResearchId(null); }}
                              className="shrink-0 p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><CheckIcon size={14} /></button>
                            <button onClick={() => setEditingResearchId(null)}
                              className="shrink-0 p-1.5 bg-stone-100 text-stone-500 rounded-lg hover:bg-stone-200"><XIcon size={14} /></button>
                          </div>
                        ) : (
                          <div key={r.id} className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                            <span className="text-lg shrink-0">{r.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-stone-800">{r.name}</div>
                              <div className="text-[10px] text-stone-400">
                                {formatDate(r.researchedAt)} — investi {formatMoney(r.cost)}
                                {r.effect === "STATUS" && (r.addEffects?.length || r.removeEffects?.length) ? (
                                  <>
                                    {r.addEffects?.length > 0 && ` — ajoute : ${r.addEffects.map((id) => STATUS_EFFECT_LABELS[id]?.label || id).join(", ")}`}
                                    {r.removeEffects?.length > 0 && ` — retire : ${r.removeEffects.map((id) => STATUS_EFFECT_LABELS[id]?.label || id).join(", ")}`}
                                  </>
                                ) : null}
                              </div>
                            </div>
                            <button onClick={() => { setEditingResearchId(r.id); setEditDraft({ name: r.name, icon: r.icon }); }}
                              className="shrink-0 p-1.5 text-stone-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"><Pencil size={13} /></button>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "historique" && (
              <>
                {myGivenHistory.length === 0 && <p className="text-sm text-stone-400 italic text-center py-6">Aucune consultation pour le moment.</p>}
                {myGivenHistory.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-stone-800 truncate">{r.patientName}{r.treatmentSnapshot ? ` — ${r.treatmentSnapshot.name}` : ""}</div>
                      <div className="text-[10px] text-stone-400">{formatDate(r.respondedAt || r.requestedAt)}{r.declineReason ? ` — ${r.declineReason}` : ""}</div>
                    </div>
                    {r.status === "COMPLETED" && r.treatmentSnapshot && <span className="text-emerald-700 font-bold text-xs shrink-0">{formatMoney(r.treatmentSnapshot.price)}</span>}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── VOLET PATIENT ── */}
      {myIllness ? (
        myPendingRequest ? (
          <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 space-y-3">
            <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-1.5"><Clock size={12} /> Demande en cours</div>
            <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <span className="text-lg">🩺</span>
              <div className="flex-1">
                <div className="font-bold text-sm text-stone-800">En attente que {myPendingRequest.apothecaryName} vous reçoive</div>
                <div className="text-xs text-stone-500">Il/elle a accès à votre fiche de santé et choisira le traitement adapté.</div>
              </div>
            </div>
            <button onClick={() => onCancelTreatmentRequest(myPendingRequest.id)}
              className="text-red-500 text-[10px] font-bold uppercase border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50">
              Annuler la demande
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 space-y-4">
            <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">
              Vous êtes malade ({myIllness.name || "maladie"}) — choisir un apothicaire
            </div>
            <p className="text-xs text-stone-400 -mt-2">
              L'apothicaire choisi recevra votre fiche de santé complète et déterminera lui-même le traitement à administrer. Vous payez une fois le soin reçu.
            </p>
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
              <Search size={13} className="text-stone-400" />
              <input className="flex-1 text-sm outline-none bg-transparent" placeholder="Chercher un apothicaire..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredApothecaries.length === 0 && <p className="text-sm text-stone-400 italic text-center py-4">Aucun apothicaire disponible.</p>}
              {filteredApothecaries.map((a) => {
                const offers = offersFor(a);
                return (
                  <div key={a.id} className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm text-stone-800">{a.name}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {offers.length === 0 ? "Aucun soin proposé actuellement" : `${offers.length} soin${offers.length > 1 ? "s" : ""} — à partir de ${formatMoney(Math.min(...offers.map((o) => o.offer.price)))}`}
                      </div>
                    </div>
                    <button
                      onClick={() => { onRequestTreatment(a.id, requestNote); setRequestNote(""); }}
                      disabled={offers.length === 0}
                      className="shrink-0 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase">
                      Consulter
                    </button>
                  </div>
                );
              })}
            </div>
            <input className="w-full p-2.5 border border-stone-200 rounded-xl text-sm outline-none"
              placeholder="Message pour l'apothicaire (optionnel)..." value={requestNote} onChange={(e) => setRequestNote(e.target.value)} />
          </div>
        )
      ) : (
        !isApothicaire && (
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-sm text-stone-500">
            Vous n'êtes pas malade actuellement. Si vous tombez malade, vous pourrez choisir un apothicaire ici.
          </div>
        )
      )}

      {/* ── Historique des soins reçus (patient) ── */}
      {myRequestHistory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 space-y-3">
          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-1.5"><History size={12} /> Historique de mes soins</div>
          <div className="space-y-2">
            {myRequestHistory.map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-stone-800 truncate">{r.apothecaryName}{r.treatmentSnapshot ? ` — ${r.treatmentSnapshot.name}` : ""}</div>
                  <div className="text-[10px] text-stone-400">{formatDate(r.respondedAt || r.requestedAt)}{r.declineReason ? ` — ${r.declineReason}` : ""}</div>
                </div>
                {r.status === "COMPLETED" && r.treatmentSnapshot && <span className="text-red-600 font-bold text-xs shrink-0">−{formatMoney(r.treatmentSnapshot.price)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isApothicaire && (
        <p className="text-[10px] text-stone-400 italic text-center">
          Seuls les citoyens dont l'occupation est "Apothicaire" (définie par l'administration) peuvent soigner.
        </p>
      )}
    </div>
  );
};

export default ApothecaryView;
