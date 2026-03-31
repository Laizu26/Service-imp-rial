import React, { useState } from "react";
import { Scale, Plus, Gavel, User, MessageSquare, X, ChevronDown, ChevronUp, Trash2, AlertTriangle } from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";
import SecureDeleteButton from "../ui/SecureDeleteButton";

const STATUS_LABELS = { PENDING: "En attente", IN_PROGRESS: "En cours", VERDICT: "Jugé" };
const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  VERDICT: "bg-stone-200 text-stone-700",
};
const VERDICT_LABELS = { GUILTY: "Coupable", NOT_GUILTY: "Non coupable", DISMISSED: "Classé sans suite" };
const SENTENCE_TYPES = { FINE: "Amende", PRISON: "Emprisonnement", EXILE: "Exil", CUSTOM: "Autre" };

const TribunalAdminView = ({
  trials = [],
  citizens = [],
  onCreateTrial,
  onAssignTrialRole,
  onAddTrialArgument,
  onRenderVerdict,
  onDeleteTrial,
}) => {
  const [charge, setCharge] = useState("");
  const [accusedId, setAccusedId] = useState("");
  const [plaintiff, setPlaintiff] = useState("");
  const [desc, setDesc] = useState("");
  const [expanded, setExpanded] = useState(null);

  // Verdict form
  const [verdictForm, setVerdictForm] = useState({});
  // Argument form
  const [argForm, setArgForm] = useState({});
  // Assign form
  const [assignForm, setAssignForm] = useState({});

  const handleCreate = () => {
    if (!accusedId || !charge.trim()) return;
    onCreateTrial({ accusedId, plaintiff: plaintiff.trim() || "Le Ministère Public", charge: charge.trim(), description: desc.trim() });
    setCharge(""); setAccusedId(""); setPlaintiff(""); setDesc("");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire ouverture de procès */}
        <div className="lg:col-span-1">
          <Card title="Ouvrir un Procès" icon={Scale}>
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Accusé</label>
                <UserSearchSelect users={citizens} onSelect={setAccusedId} value={accusedId} placeholder="Choisir l'accusé..." />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Plaignant</label>
                <input className="w-full p-2 border rounded text-sm" value={plaintiff} onChange={(e) => setPlaintiff(e.target.value)} placeholder="Le Ministère Public (par défaut)" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Chef d'accusation</label>
                <input className="w-full p-2 border rounded font-bold text-stone-800" value={charge} onChange={(e) => setCharge(e.target.value)} placeholder="Ex: Vol, Trahison, Hérésie..." />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">Description des faits</label>
                <textarea className="w-full p-2 border rounded text-sm" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Détails de l'affaire..." />
              </div>
              <button onClick={handleCreate} disabled={!accusedId || !charge.trim()} className="w-full bg-stone-900 text-yellow-500 py-3 rounded font-black uppercase text-xs tracking-widest hover:bg-stone-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <Plus size={14} /> Ouvrir le Procès
              </button>
            </div>
          </Card>
        </div>

        {/* Liste des procès */}
        <div className="lg:col-span-2">
          <Card title="Registre des Procès" icon={Gavel}>
            <div className="space-y-3">
              {trials.length === 0 && <div className="p-6 text-center text-stone-400 italic">Aucun procès en cours.</div>}
              {trials.map((trial) => {
                const isExpanded = expanded === trial.id;
                return (
                  <div key={trial.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                    {/* En-tête */}
                    <div className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-stone-50" onClick={() => setExpanded(isExpanded ? null : trial.id)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${STATUS_COLORS[trial.status]}`}>
                            {STATUS_LABELS[trial.status]}
                          </span>
                          <span className="font-black text-stone-800">{trial.charge}</span>
                        </div>
                        <div className="text-xs text-stone-500 mt-1">
                          <span className="font-bold">{trial.plaintiff}</span> c/ <span className="font-bold text-red-600">{trial.accusedName}</span>
                        </div>
                        <div className="flex gap-4 mt-1 text-[10px] text-stone-400">
                          {trial.judgeName && <span>Juge : {trial.judgeName}</span>}
                          {trial.lawyerDefenseName && <span>Défense : {trial.lawyerDefenseName}</span>}
                          {trial.lawyerProsecutionName && <span>Procureur : {trial.lawyerProsecutionName}</span>}
                        </div>
                        {trial.verdict && (
                          <div className={`mt-1 text-xs font-bold ${trial.verdict === "GUILTY" ? "text-red-600" : "text-green-600"}`}>
                            Verdict : {VERDICT_LABELS[trial.verdict]}
                            {trial.sentence && ` — ${SENTENCE_TYPES[trial.sentence.type]}${trial.sentence.amount ? ` : ${trial.sentence.amount} Écus` : ""}${trial.sentence.text ? ` (${trial.sentence.text})` : ""}`}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <SecureDeleteButton onClick={() => onDeleteTrial(trial.id)} />
                        {isExpanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                      </div>
                    </div>

                    {/* Détails */}
                    {isExpanded && (
                      <div className="border-t border-stone-200 p-4 space-y-4 bg-stone-50">
                        {trial.description && <p className="text-sm text-stone-600">{trial.description}</p>}

                        {/* Assigner rôles */}
                        {trial.status !== "VERDICT" && (
                          <div className="bg-white border border-stone-200 rounded-lg p-3 space-y-3">
                            <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Assigner les rôles</div>
                            {["judge", "defense", "prosecution"].map((role) => (
                              <div key={role} className="flex items-center gap-2">
                                <span className="text-xs font-bold text-stone-600 w-24">{role === "judge" ? "Juge" : role === "defense" ? "Défense" : "Procureur"} :</span>
                                <div className="flex-1">
                                  <UserSearchSelect
                                    users={citizens}
                                    onSelect={(id) => setAssignForm({ ...assignForm, [trial.id + role]: id })}
                                    value={assignForm[trial.id + role] || ""}
                                    placeholder="Choisir..."
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    const cId = assignForm[trial.id + role];
                                    if (cId) onAssignTrialRole(trial.id, role, cId);
                                  }}
                                  disabled={!assignForm[trial.id + role]}
                                  className="bg-stone-800 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase disabled:opacity-50 hover:bg-stone-600"
                                >
                                  Assigner
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Arguments */}
                        <div className="bg-white border border-stone-200 rounded-lg p-3 space-y-3">
                          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Dossier — Arguments ({(trial.arguments || []).length})</div>
                          {(trial.arguments || []).map((arg) => (
                            <div key={arg.id} className={`p-2 rounded text-xs border-l-4 ${arg.side === "defense" ? "border-blue-400 bg-blue-50" : arg.side === "prosecution" ? "border-red-400 bg-red-50" : "border-stone-400 bg-stone-50"}`}>
                              <span className="font-bold">{arg.authorName}</span>
                              <span className="text-stone-400 ml-2">({arg.side === "defense" ? "Défense" : arg.side === "prosecution" ? "Accusation" : "Tribunal"})</span>
                              <p className="mt-1 text-stone-700">{arg.text}</p>
                            </div>
                          ))}
                          {trial.status !== "VERDICT" && (
                            <div className="flex gap-2">
                              <input
                                className="flex-1 p-2 border rounded text-sm"
                                placeholder="Ajouter un argument..."
                                value={argForm[trial.id]?.text || ""}
                                onChange={(e) => setArgForm({ ...argForm, [trial.id]: { ...argForm[trial.id], text: e.target.value } })}
                              />
                              <select
                                className="p-2 border rounded text-xs bg-white"
                                value={argForm[trial.id]?.side || "prosecution"}
                                onChange={(e) => setArgForm({ ...argForm, [trial.id]: { ...argForm[trial.id], side: e.target.value } })}
                              >
                                <option value="prosecution">Accusation</option>
                                <option value="defense">Défense</option>
                                <option value="court">Tribunal</option>
                              </select>
                              <button
                                onClick={() => {
                                  const af = argForm[trial.id];
                                  if (af?.text?.trim()) {
                                    onAddTrialArgument(trial.id, { authorName: af.authorName || "Le Tribunal", side: af.side || "court", text: af.text.trim() });
                                    setArgForm({ ...argForm, [trial.id]: { text: "", side: "prosecution" } });
                                  }
                                }}
                                className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase hover:bg-stone-600"
                              >
                                <MessageSquare size={12} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Rendre verdict */}
                        {trial.status !== "VERDICT" && (
                          <div className="bg-white border-2 border-red-200 rounded-lg p-3 space-y-3">
                            <div className="text-[10px] font-black uppercase text-red-400 tracking-widest flex items-center gap-1"><AlertTriangle size={12} /> Rendre le Verdict</div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">Verdict</label>
                                <select className="w-full p-2 border rounded text-sm bg-white" value={verdictForm[trial.id]?.verdict || ""} onChange={(e) => setVerdictForm({ ...verdictForm, [trial.id]: { ...verdictForm[trial.id], verdict: e.target.value } })}>
                                  <option value="">--</option>
                                  <option value="GUILTY">Coupable</option>
                                  <option value="NOT_GUILTY">Non coupable</option>
                                  <option value="DISMISSED">Classé sans suite</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">Peine</label>
                                <select className="w-full p-2 border rounded text-sm bg-white" value={verdictForm[trial.id]?.sentenceType || ""} onChange={(e) => setVerdictForm({ ...verdictForm, [trial.id]: { ...verdictForm[trial.id], sentenceType: e.target.value } })}>
                                  <option value="">Aucune</option>
                                  <option value="FINE">Amende</option>
                                  <option value="PRISON">Emprisonnement</option>
                                  <option value="EXILE">Exil</option>
                                  <option value="CUSTOM">Autre</option>
                                </select>
                              </div>
                            </div>
                            {verdictForm[trial.id]?.sentenceType === "FINE" && (
                              <input type="number" className="w-full p-2 border rounded font-mono text-sm" placeholder="Montant de l'amende (Écus)" value={verdictForm[trial.id]?.amount || ""} onChange={(e) => setVerdictForm({ ...verdictForm, [trial.id]: { ...verdictForm[trial.id], amount: e.target.value } })} />
                            )}
                            {(verdictForm[trial.id]?.sentenceType === "PRISON" || verdictForm[trial.id]?.sentenceType === "CUSTOM") && (
                              <input className="w-full p-2 border rounded text-sm" placeholder="Détails de la peine..." value={verdictForm[trial.id]?.text || ""} onChange={(e) => setVerdictForm({ ...verdictForm, [trial.id]: { ...verdictForm[trial.id], text: e.target.value } })} />
                            )}
                            <button
                              onClick={() => {
                                const vf = verdictForm[trial.id];
                                if (!vf?.verdict) return;
                                const sentence = vf.sentenceType ? {
                                  type: vf.sentenceType,
                                  amount: parseInt(vf.amount) || 0,
                                  text: vf.text || "",
                                } : null;
                                onRenderVerdict(trial.id, { verdict: vf.verdict, sentence });
                              }}
                              disabled={!verdictForm[trial.id]?.verdict}
                              className="w-full bg-red-700 text-white py-2 rounded font-black uppercase text-xs tracking-widest hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <Gavel size={14} /> Prononcer le Verdict
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TribunalAdminView;
