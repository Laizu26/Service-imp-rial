import React, { useState } from "react";
import { FlaskConical, Search, Check, Clock, History, Coins, HeartHandshake } from "lucide-react";
import { formatMoney, getApothecaryOffer } from "../../lib/gameUtils";

const STATUS_LABELS = { PENDING: "En attente", COMPLETED: "Soigné", DECLINED: "Refusée", CANCELLED: "Annulée" };
const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
  CANCELLED: "bg-stone-200 text-stone-600",
};

const formatDate = (ts) => (ts ? new Date(ts).toLocaleDateString("fr-FR") : "");

const ApothecaryView = ({
  user,
  citizens = [],
  illnessConfig,
  careRequests = [],
  onSetApothecaryOffer,
  onRequestTreatment,
  onCancelTreatmentRequest,
  onRespondTreatmentRequest,
  onSelfTreat,
}) => {
  const isApothicaire = (user?.occupation || "").trim().toLowerCase() === "apothicaire";
  const treatments = illnessConfig?.treatments || [];
  const myIllness = user?.illness;

  const [tab, setTab] = useState("demandes");
  const [search, setSearch] = useState("");
  const [selectedApothecaryId, setSelectedApothecaryId] = useState("");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [priceDrafts, setPriceDrafts] = useState({});
  const [declineDraft, setDeclineDraft] = useState({});

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
  const selectedApothecary = apothecaries.find((a) => a.id === selectedApothecaryId);
  const offersFor = (apothecary) => treatments.map((t) => ({ ...t, offer: getApothecaryOffer(apothecary, t) })).filter((t) => t.offer.active);
  const selectedOffers = selectedApothecary ? offersFor(selectedApothecary) : [];
  const selectedTreatment = selectedOffers.find((t) => t.id === selectedTreatmentId);

  const myOffers = treatments.map((t) => ({ ...t, offer: getApothecaryOffer(user, t) }));

  const TABS = [
    { id: "demandes", label: `Demandes reçues${incomingRequests.length > 0 ? ` (${incomingRequests.length})` : ""}` },
    { id: "tarifs", label: "Mes tarifs" },
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
            {myOffers.filter((t) => t.offer.active).map((t) => (
              <button key={t.id} onClick={() => onSelfTreat(t.id)}
                className="flex items-center gap-1.5 bg-white border border-emerald-300 rounded-lg px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors">
                <span>{t.icon}</span> {t.name}
              </button>
            ))}
            {myOffers.filter((t) => t.offer.active).length === 0 && (
              <p className="text-xs text-stone-400 italic">Aucun soin actif dans votre offre.</p>
            )}
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
                {incomingRequests.map((r) => (
                  <div key={r.id} className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-stone-800 text-sm">{r.patientName}</div>
                      <div className="text-[10px] text-stone-400">{formatDate(r.requestedAt)}</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>{r.treatmentSnapshot.icon}</span>
                      <span className="font-bold text-stone-700">{r.treatmentSnapshot.name}</span>
                      <span className="text-emerald-700 font-bold text-xs ml-auto">{formatMoney(r.treatmentSnapshot.price)}</span>
                    </div>
                    {r.note && <p className="text-xs text-stone-500 italic bg-white rounded-lg border border-stone-100 p-2">{r.note}</p>}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button onClick={() => onRespondTreatmentRequest(r.id, true)}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase">
                        <Check size={12} /> Accepter et soigner
                      </button>
                      <input
                        className="flex-1 min-w-32 p-2 border border-stone-200 rounded-lg text-xs outline-none"
                        placeholder="Motif du refus (optionnel)..."
                        value={declineDraft[r.id] || ""}
                        onChange={(e) => setDeclineDraft({ ...declineDraft, [r.id]: e.target.value })}
                      />
                      <button onClick={() => onRespondTreatmentRequest(r.id, false, declineDraft[r.id])}
                        className="text-red-500 text-[10px] font-bold uppercase border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50">
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {tab === "tarifs" && (
              <>
                {treatments.length === 0 ? (
                  <p className="text-sm text-stone-400 italic text-center py-6">Aucun traitement défini par l'administration.</p>
                ) : (
                  <div className="space-y-2">
                    {myOffers.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                        <span className="text-lg shrink-0">{t.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-stone-800">{t.name}</div>
                          {t.description && <div className="text-[10px] text-stone-400 italic truncate">{t.description}</div>}
                        </div>
                        <input
                          type="number" step="0.1"
                          className="w-24 p-1.5 border border-stone-200 rounded-lg text-sm font-mono outline-none focus:border-emerald-400"
                          placeholder={String(t.price || 0)}
                          value={priceDrafts[t.id] ?? t.offer.price}
                          onChange={(e) => setPriceDrafts({ ...priceDrafts, [t.id]: e.target.value })}
                          onBlur={(e) => onSetApothecaryOffer(t.id, { price: e.target.value })}
                        />
                        <button
                          onClick={() => onSetApothecaryOffer(t.id, { active: !t.offer.active })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${t.offer.active ? "bg-emerald-500" : "bg-stone-300"}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${t.offer.active ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "historique" && (
              <>
                {myGivenHistory.length === 0 && <p className="text-sm text-stone-400 italic text-center py-6">Aucun soin prodigué pour le moment.</p>}
                {myGivenHistory.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-stone-800 truncate">{r.patientName} — {r.treatmentSnapshot.name}</div>
                      <div className="text-[10px] text-stone-400">{formatDate(r.respondedAt || r.requestedAt)}{r.declineReason ? ` — ${r.declineReason}` : ""}</div>
                    </div>
                    {r.status === "COMPLETED" && <span className="text-emerald-700 font-bold text-xs shrink-0">{formatMoney(r.treatmentSnapshot.price)}</span>}
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
              <span className="text-lg">{myPendingRequest.treatmentSnapshot.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-sm text-stone-800">{myPendingRequest.treatmentSnapshot.name}</div>
                <div className="text-xs text-stone-500">Auprès de {myPendingRequest.apothecaryName} — {formatMoney(myPendingRequest.treatmentSnapshot.price)}</div>
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
              Vous êtes malade ({myIllness.name || "maladie"}) — demander un soin
            </div>
            {!selectedApothecary ? (
              <>
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
                      <button key={a.id} onClick={() => setSelectedApothecaryId(a.id)}
                        className="w-full text-left bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl p-3 transition-colors">
                        <div className="font-bold text-sm text-stone-800">{a.name}</div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {offers.length === 0 ? "Aucun soin proposé actuellement" : `${offers.length} soin${offers.length > 1 ? "s" : ""} proposé${offers.length > 1 ? "s" : ""} — à partir de ${formatMoney(Math.min(...offers.map((o) => o.offer.price)))}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <button onClick={() => { setSelectedApothecaryId(""); setSelectedTreatmentId(""); }} className="text-[10px] font-bold uppercase text-stone-400 hover:text-stone-600">
                  ← Changer d'apothicaire
                </button>
                <div className="font-bold text-stone-800">{selectedApothecary.name}</div>
                {selectedOffers.length === 0 ? (
                  <p className="text-sm text-stone-400 italic">Cet apothicaire ne propose aucun soin actuellement.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedOffers.map((t) => (
                      <button key={t.id} onClick={() => setSelectedTreatmentId(t.id)}
                        className={`text-left p-3 rounded-xl border-2 transition-colors ${
                          selectedTreatmentId === t.id ? "border-emerald-400 bg-emerald-50" : "border-stone-200 hover:border-stone-300"
                        }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{t.icon}</span>
                          <span className="font-bold text-sm text-stone-800">{t.name}</span>
                        </div>
                        {t.description && <p className="text-[11px] text-stone-500 italic mt-1">{t.description}</p>}
                        <div className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1"><Coins size={10} /> {formatMoney(t.offer.price)}</div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedTreatment && (
                  <>
                    <input className="w-full p-2.5 border border-stone-200 rounded-xl text-sm outline-none"
                      placeholder="Message pour l'apothicaire (optionnel)..." value={requestNote} onChange={(e) => setRequestNote(e.target.value)} />
                    <button
                      onClick={() => { onRequestTreatment(selectedApothecary.id, selectedTreatment.id, requestNote); setSelectedApothecaryId(""); setSelectedTreatmentId(""); setRequestNote(""); }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black uppercase text-sm flex items-center justify-center gap-2"
                    >
                      <FlaskConical size={16} /> Envoyer la demande
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )
      ) : (
        !isApothicaire && (
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-sm text-stone-500">
            Vous n'êtes pas malade actuellement. Si vous tombez malade, vous pourrez demander un soin à un apothicaire ici.
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
                  <div className="font-bold text-sm text-stone-800 truncate">{r.apothecaryName} — {r.treatmentSnapshot.name}</div>
                  <div className="text-[10px] text-stone-400">{formatDate(r.respondedAt || r.requestedAt)}{r.declineReason ? ` — ${r.declineReason}` : ""}</div>
                </div>
                {r.status === "COMPLETED" && <span className="text-red-600 font-bold text-xs shrink-0">−{formatMoney(r.treatmentSnapshot.price)}</span>}
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
