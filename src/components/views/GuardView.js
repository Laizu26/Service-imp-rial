import React, { useState } from "react";
import {
  Shield, ChevronDown, Check, Lock, Unlock, AlertTriangle,
  Inbox, LogOut, Send,
} from "lucide-react";

const RANK_COLORS_CIT = {
  stone: "bg-stone-100 text-stone-700 border-stone-300",
  amber: "bg-amber-100 text-amber-800 border-amber-300",
  red: "bg-red-100 text-red-800 border-red-300",
  blue: "bg-blue-100 text-blue-800 border-blue-300",
  green: "bg-green-100 text-green-800 border-green-300",
  purple: "bg-purple-100 text-purple-800 border-purple-300",
  black: "bg-stone-800 text-stone-100 border-stone-600",
};

const GuardView = ({
  user,
  guard = {},
  isMember,
  myRank,
  myMember,
  citizens = [],
  onGuardApply,
  onGuardWithdrawApplication,
  onGuardAcceptApplication,
  onGuardRejectApplication,
  onGuardLeave,
  onGuardIssueOrder,
  onGuardCompleteOrder,
  onGuardImprison,
  onGuardRelease,
}) => {
  const [tab, setTab] = useState("ordres");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderTitle, setOrderTitle] = useState("");
  const [orderContent, setOrderContent] = useState("");
  const [orderMinLevel, setOrderMinLevel] = useState(1);
  const [orderUrgent, setOrderUrgent] = useState(false);
  const [reportOrderId, setReportOrderId] = useState(null);
  const [reportText, setReportText] = useState("");
  const [prisonCitizenId, setPrisonCitizenId] = useState("");
  const [prisonReason, setPrisonReason] = useState("");
  const [prisonSentence, setPrisonSentence] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applicationRankId, setApplicationRankId] = useState({});

  const ranks = guard.ranks || [];
  const allMembers = guard.members || [];
  const applications = guard.applications || [];
  const prison = guard.prison || [];
  const canOrder = myRank?.canOrder || false;
  const canManage = myRank?.canManage || false;
  const rankBadge = myRank ? (RANK_COLORS_CIT[myRank.color] || RANK_COLORS_CIT.stone) : RANK_COLORS_CIT.stone;

  const myApplication = applications.find((a) => a.citizenId === user.id);

  // ── Pas encore membre : écran de candidature ──
  if (!isMember) {
    if (!guard.name) {
      return (
        <div className="text-center py-16 animate-fadeIn">
          <Shield size={48} className="mx-auto mb-3 text-stone-300" />
          <div className="text-stone-400 italic">Aucune garde n'est établie dans ce pays.</div>
        </div>
      );
    }
    return (
      <div className="max-w-xl mx-auto space-y-4 animate-fadeIn">
        <div className="bg-stone-800 text-white rounded-2xl p-6 text-center">
          <Shield size={32} className="mx-auto mb-2 text-stone-300" />
          <div className="text-xl font-black font-serif">{guard.name}</div>
          <div className="text-xs text-stone-400 mt-1">{allMembers.length} membre{allMembers.length !== 1 ? "s" : ""}</div>
        </div>
        {guard.description && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 text-sm text-stone-600 italic">{guard.description}</div>
        )}
        {myApplication ? (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3 text-center">
            <div className="text-sm font-bold text-amber-700">Candidature en attente de réponse.</div>
            {myApplication.message && <p className="text-xs text-stone-600 italic">"{myApplication.message}"</p>}
            <button
              onClick={() => onGuardWithdrawApplication && onGuardWithdrawApplication(user.countryId)}
              className="text-red-500 text-[10px] font-bold uppercase border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50">
              Retirer ma candidature
            </button>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
            <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Postuler</div>
            <textarea
              className="w-full p-2.5 border rounded-lg text-sm outline-none resize-none focus:border-stone-400"
              rows={3}
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
              placeholder="Motivez votre candidature (optionnel)..."
            />
            <button
              onClick={() => { onGuardApply && onGuardApply(user.countryId, applicationMessage.trim()); setApplicationMessage(""); }}
              className="w-full bg-stone-900 text-yellow-500 py-3 rounded-lg font-black uppercase text-xs tracking-widest hover:bg-stone-700 flex items-center justify-center gap-2">
              <Send size={14} /> Envoyer ma candidature
            </button>
          </div>
        )}
      </div>
    );
  }

  const eligibleOrders = (guard.orders || []).filter((o) => (myRank?.level || 0) >= (o.minRankLevel || 1));
  const visibleMembers = allMembers.filter((m) => {
    if (canManage) return true;
    const mRank = ranks.find((r) => r.id === m.rankId);
    return (mRank?.level || 0) <= (myRank?.level || 0);
  });

  const GTABS = [
    { id: "ordres", label: "Ordres", icon: Shield },
    { id: "membres", label: "Membres", icon: Shield },
    ...(canManage ? [{ id: "candidatures", label: `Candidatures${applications.length > 0 ? ` (${applications.length})` : ""}`, icon: Inbox }] : []),
    ...(canManage ? [{ id: "prison", label: `Prison${prison.length > 0 ? ` (${prison.length})` : ""}`, icon: Lock }] : []),
    ...(canOrder ? [{ id: "emettre", label: "Émettre un ordre", icon: Send }] : []),
  ];

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-stone-800 text-white rounded-2xl p-5 flex items-center gap-4">
        <div className="p-3 bg-white/10 rounded-xl"><Shield size={28} /></div>
        <div>
          <div className="text-xs uppercase tracking-widest text-stone-400 font-bold">{guard.name || "Corps de Garde"}</div>
          <div className="text-xl font-black font-serif">{user.name}</div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {myRank ? (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${rankBadge}`}>{myRank.name}</span>
            ) : (
              <span className="text-xs text-stone-400 italic">Grade non assigné</span>
            )}
            {myMember?.note && <span className="text-xs text-stone-400 italic">{myMember.note}</span>}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-stone-400 mb-2">
            <div className="font-black text-white text-lg">{allMembers.length}</div>
            <div>membres</div>
          </div>
          <button
            onClick={() => { if (window.confirm("Quitter la garde ?")) onGuardLeave && onGuardLeave(user.countryId); }}
            className="flex items-center gap-1 text-[9px] font-bold uppercase text-stone-400 hover:text-red-400 border border-stone-600 hover:border-red-400 px-2 py-1 rounded-lg transition-all">
            <LogOut size={10} /> Quitter
          </button>
        </div>
      </div>
      {guard.description && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm text-stone-600 italic">{guard.description}</div>
      )}
      <div className="flex gap-1 border-b border-stone-200 overflow-x-auto">
        {GTABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-t-lg border-b-2 whitespace-nowrap transition-all ${
              tab === t.id ? "border-stone-800 text-stone-800 bg-white" : "border-transparent text-stone-400 hover:text-stone-600"
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === "ordres" && (
        <div className="space-y-2">
          {eligibleOrders.length === 0 && <p className="text-stone-400 italic text-sm text-center py-8">Aucun ordre en cours.</p>}
          {eligibleOrders.map((o) => {
            const isDone = o.status === "done";
            return (
              <div key={o.id} className={`bg-white rounded-xl border overflow-hidden ${isDone ? "border-green-200 opacity-70" : o.urgent ? "border-red-300" : "border-stone-200"}`}>
                <button onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left">
                  {isDone
                    ? <span className="text-green-600 font-black text-[9px] uppercase bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1"><Check size={10} /> Terminé</span>
                    : o.urgent && <span className="text-red-500 font-black text-[9px] uppercase bg-red-50 px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1"><AlertTriangle size={10} /> Urgent</span>
                  }
                  <span className={`font-bold flex-1 ${isDone ? "line-through text-stone-400" : "text-stone-800"}`}>{o.title}</span>
                  <span className="text-[10px] text-stone-400 shrink-0">{o.author} · {o.date ? new Date(o.date).toLocaleDateString("fr-FR") : ""}</span>
                  <ChevronDown size={13} className={`text-stone-400 transition-transform ${expandedOrder === o.id ? "" : "-rotate-90"}`} />
                </button>
                {expandedOrder === o.id && (
                  <div className="px-4 pb-4 border-t border-stone-100 bg-stone-50 space-y-3">
                    {o.content && <p className="text-sm text-stone-600 mt-3 leading-relaxed whitespace-pre-wrap">{o.content}</p>}
                    {(o.reports || []).length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Rapports de mission</div>
                        {(o.reports || []).map((r) => (
                          <div key={r.id} className="bg-white rounded-lg border border-stone-200 p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-black text-stone-700">{r.author}</span>
                              <span className="text-[9px] text-stone-400">{r.date ? new Date(r.date).toLocaleDateString("fr-FR") : ""}</span>
                            </div>
                            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{r.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isDone && onGuardCompleteOrder && (
                      reportOrderId === o.id ? (
                        <div className="space-y-2 mt-2">
                          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Rapport de mission</div>
                          <textarea
                            className="w-full p-2.5 border rounded-lg text-sm outline-none resize-none focus:border-stone-400 bg-white"
                            rows={4}
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            placeholder="Décrivez le déroulement de la mission, les résultats, les incidents..."
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => { setReportOrderId(null); setReportText(""); }}
                              className="px-3 py-1.5 rounded-lg bg-stone-100 text-[10px] font-bold uppercase">Annuler</button>
                            <button onClick={() => {
                              onGuardCompleteOrder(user.countryId, o.id, reportText.trim());
                              setReportOrderId(null); setReportText("");
                            }}
                              className="px-4 py-1.5 rounded-lg bg-green-600 text-white text-[10px] font-bold uppercase flex items-center gap-1.5">
                              <Check size={11} /> Soumettre et terminer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setReportOrderId(o.id); setReportText(""); setExpandedOrder(o.id); }}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-all">
                          <Check size={11} /> Marquer terminé + rapport
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "membres" && (
        <div className="space-y-2">
          {visibleMembers.length === 0 && <p className="text-stone-400 italic text-sm text-center py-8">Aucun membre visible.</p>}
          {visibleMembers.map((m) => {
            const mRank = ranks.find((r) => r.id === m.rankId);
            const mBadge = mRank ? (RANK_COLORS_CIT[mRank.color] || RANK_COLORS_CIT.stone) : RANK_COLORS_CIT.stone;
            return (
              <div key={m.citizenId} className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center font-black text-stone-600 text-sm shrink-0">
                  {(m.citizenName || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-stone-800 text-sm">
                    {m.citizenName}{m.citizenId === user.id && <span className="ml-2 text-[9px] text-stone-400">(vous)</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {mRank && <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${mBadge}`}>{mRank.name}</span>}
                    {m.note && <span className="text-[10px] text-stone-400 italic truncate">{m.note}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "candidatures" && canManage && (
        <div className="space-y-2">
          {applications.length === 0 && <p className="text-stone-400 italic text-sm text-center py-8">Aucune candidature en attente.</p>}
          {applications.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
              <div>
                <div className="font-black text-stone-800 text-sm">{a.citizenName}</div>
                <div className="text-[10px] text-stone-400">{a.appliedAt ? new Date(a.appliedAt).toLocaleDateString("fr-FR") : ""}</div>
              </div>
              {a.message && <p className="text-sm text-stone-600 italic bg-stone-50 rounded-lg p-3 border border-stone-100">{a.message}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                <select className="p-2 border rounded-lg text-sm bg-white outline-none focus:border-stone-400"
                  value={applicationRankId[a.citizenId] || ""}
                  onChange={(e) => setApplicationRankId({ ...applicationRankId, [a.citizenId]: e.target.value })}>
                  <option value="">— Grade —</option>
                  {ranks.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <button
                  onClick={() => onGuardAcceptApplication(user.countryId, a.citizenId, applicationRankId[a.citizenId] || "")}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-green-500 flex items-center gap-1.5">
                  <Check size={12} /> Accepter
                </button>
                <button
                  onClick={() => onGuardRejectApplication(user.countryId, a.citizenId)}
                  className="text-red-500 text-[10px] font-bold uppercase border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50">
                  Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "prison" && canManage && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
            <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-1.5"><Lock size={10} /> Incarcérer un citoyen</div>
            <select className="w-full p-2.5 border rounded-lg text-sm bg-white outline-none focus:border-stone-400"
              value={prisonCitizenId} onChange={(e) => setPrisonCitizenId(e.target.value)}>
              <option value="">— Sélectionner un citoyen —</option>
              {citizens.filter((c) => !prison.some((p) => p.citizenId === c.id)).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-stone-400"
              placeholder="Motif d'incarcération..." value={prisonReason}
              onChange={(e) => setPrisonReason(e.target.value)} />
            <input className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-stone-400"
              placeholder="Durée de la peine (ex: 3 jours RP, indéterminée...)" value={prisonSentence}
              onChange={(e) => setPrisonSentence(e.target.value)} />
            <button onClick={() => {
              if (!prisonCitizenId || !onGuardImprison) return;
              onGuardImprison(user.countryId, prisonCitizenId, prisonReason, prisonSentence);
              setPrisonCitizenId(""); setPrisonReason(""); setPrisonSentence("");
            }} disabled={!prisonCitizenId}
              className="w-full bg-red-700 hover:bg-red-800 text-white py-2.5 rounded-lg text-[10px] font-black uppercase disabled:opacity-40 flex items-center justify-center gap-1.5">
              <Lock size={12} /> Incarcérer
            </button>
          </div>
          {prison.length === 0 ? (
            <p className="text-stone-400 italic text-sm text-center py-8">La prison est vide.</p>
          ) : (
            <div className="space-y-2">
              {prison.map((p) => (
                <div key={p.id} className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg shrink-0 mt-0.5"><Lock size={14} className="text-red-600" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-stone-800 text-sm">{p.citizenName}</div>
                    <div className="text-xs text-red-700 mt-0.5">{p.reason}</div>
                    {p.sentence && <div className="text-[10px] text-stone-500 mt-0.5">Peine : {p.sentence}</div>}
                    <div className="text-[10px] text-stone-400 mt-1">Arrêté par {p.guardName} · {p.since ? new Date(p.since).toLocaleDateString("fr-FR") : ""}</div>
                  </div>
                  <button onClick={() => onGuardRelease && onGuardRelease(user.countryId, p.citizenId)}
                    className="shrink-0 flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-800 border border-green-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all">
                    <Unlock size={11} /> Libérer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "emettre" && canOrder && (
        <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
          <input className="w-full p-2.5 border rounded-lg text-sm font-bold outline-none focus:border-stone-400"
            value={orderTitle} onChange={(e) => setOrderTitle(e.target.value)} placeholder="Titre de l'ordre..." />
          <textarea className="w-full p-2.5 border rounded-lg text-sm outline-none resize-none focus:border-stone-400" rows={4}
            value={orderContent} onChange={(e) => setOrderContent(e.target.value)} placeholder="Contenu..." />
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500">Visible dès niveau :</span>
              <select className="p-2 border rounded-lg text-sm bg-white outline-none"
                value={orderMinLevel} onChange={(e) => setOrderMinLevel(parseInt(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>Niv. {n}+</option>)}
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-red-700 cursor-pointer">
              <input type="checkbox" checked={orderUrgent} onChange={(e) => setOrderUrgent(e.target.checked)} />
              <AlertTriangle size={12} /> Urgent
            </label>
            <button onClick={() => {
              if (!orderTitle.trim() || !onGuardIssueOrder) return;
              onGuardIssueOrder(user.countryId, { id: `ord-${Date.now()}`, title: orderTitle.trim(), content: orderContent.trim(), minRankLevel: orderMinLevel, urgent: orderUrgent, author: user.name, date: Date.now() });
              setOrderTitle(""); setOrderContent(""); setOrderMinLevel(1); setOrderUrgent(false);
              setTab("ordres");
            }} disabled={!orderTitle.trim()}
              className="ml-auto bg-stone-800 text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase disabled:opacity-40">
              Émettre
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardView;
