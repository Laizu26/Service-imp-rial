import React, { useState } from "react";
import { FileText, Plus, Check, X, AlertTriangle, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";

const STATUS_LABELS = { PENDING: "En attente", ACTIVE: "Actif", COMPLETED: "Accompli", CANCELLED: "Résilié", BREACHED: "Rompu" };
const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-stone-200 text-stone-600",
  BREACHED: "bg-red-100 text-red-700",
};

const ContractsView = ({
  contracts = [],
  citizens = [],
  user,
  onCreateContract,
  onSignContract,
  onCancelContract,
  onCompleteContract,
  onBreachContract,
  onDeleteContract,
}) => {
  const [title, setTitle] = useState("");
  const [parties, setParties] = useState([]);
  const [clauseText, setClauseText] = useState("");
  const [clauses, setClauses] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [addPartyId, setAddPartyId] = useState("");

  const myContracts = contracts.filter((c) => (c.parties || []).some((p) => p.id === user.id));
  const otherContracts = contracts.filter((c) => !(c.parties || []).some((p) => p.id === user.id));

  const handleCreate = () => {
    if (!title.trim() || parties.length === 0) return;
    onCreateContract({ title: title.trim(), parties, clauses });
    setTitle(""); setParties([]); setClauses([]); setClauseText("");
  };

  const addParty = () => {
    if (addPartyId && !parties.includes(addPartyId)) {
      setParties([...parties, addPartyId]);
      setAddPartyId("");
    }
  };

  const addClause = () => {
    if (clauseText.trim()) {
      setClauses([...clauses, clauseText.trim()]);
      setClauseText("");
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("fr-FR");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        <FileText size={24} className="text-stone-400" />
        <h2 className="text-2xl font-black font-serif text-stone-800">Contrats Notariés</h2>
      </div>

      {/* Rédiger un contrat */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
        <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Rédiger un Contrat</div>
        <input className="w-full p-2 border rounded font-bold text-stone-800" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du contrat (ex: Accord commercial, Bail, Alliance...)" />

        {/* Parties */}
        <div>
          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Parties prenantes</div>
          <div className="flex flex-wrap gap-1 mb-2">
            {parties.map((pId) => {
              const c = citizens.find((c) => c.id === pId);
              return (
                <span key={pId} className="bg-stone-100 text-stone-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                  {c ? c.name : pId}
                  <button onClick={() => setParties(parties.filter((id) => id !== pId))} className="text-red-400 hover:text-red-600"><X size={10} /></button>
                </span>
              );
            })}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <UserSearchSelect users={citizens} onSelect={setAddPartyId} value={addPartyId} placeholder="Ajouter un signataire..." />
            </div>
            <button onClick={addParty} disabled={!addPartyId} className="bg-stone-800 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase disabled:opacity-50 hover:bg-stone-600">
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Clauses */}
        <div>
          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Clauses</div>
          {clauses.length > 0 && (
            <ol className="list-decimal list-inside space-y-1 mb-2">
              {clauses.map((c, i) => (
                <li key={i} className="text-sm text-stone-700 flex items-start gap-2">
                  <span className="flex-1">{c}</span>
                  <button onClick={() => setClauses(clauses.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 shrink-0"><X size={12} /></button>
                </li>
              ))}
            </ol>
          )}
          <div className="flex gap-2">
            <input className="flex-1 p-2 border rounded text-sm" value={clauseText} onChange={(e) => setClauseText(e.target.value)} placeholder="Ajouter une clause..." onKeyDown={(e) => { if (e.key === "Enter") addClause(); }} />
            <button onClick={addClause} disabled={!clauseText.trim()} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase disabled:opacity-50 hover:bg-stone-600">
              <Plus size={12} />
            </button>
          </div>
        </div>

        <button onClick={handleCreate} disabled={!title.trim() || parties.length === 0} className="w-full bg-stone-900 text-yellow-500 py-3 rounded font-black uppercase text-xs tracking-widest hover:bg-stone-700 disabled:opacity-50 flex items-center justify-center gap-2">
          <FileText size={14} /> Établir le Contrat
        </button>
      </div>

      {/* Mes contrats */}
      {myContracts.length > 0 && (
        <div>
          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3">Mes Contrats</div>
          <div className="space-y-3">
            {myContracts.map((contract) => {
              const isExpanded = expanded === contract.id;
              const isCreator = contract.creatorId === user.id;
              const myParty = (contract.parties || []).find((p) => p.id === user.id);
              const iHaveSigned = myParty?.signed;
              return (
                <div key={contract.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                  <div className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-stone-50" onClick={() => setExpanded(isExpanded ? null : contract.id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${STATUS_COLORS[contract.status]}`}>{STATUS_LABELS[contract.status]}</span>
                        <span className="font-black text-stone-800">{contract.title}</span>
                      </div>
                      <div className="text-[10px] text-stone-400 mt-1">
                        Par {contract.creatorName} — {formatDate(contract.createdAt)}
                        {" — "}{(contract.parties || []).length} parties
                        {" — "}{(contract.parties || []).filter((p) => p.signed).length}/{(contract.parties || []).length} signatures
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-stone-200 p-4 space-y-4 bg-stone-50">
                      {/* Parties + signatures */}
                      <div>
                        <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2">Signataires</div>
                        <div className="space-y-1">
                          {(contract.parties || []).map((p) => (
                            <div key={p.id} className="flex items-center gap-2 text-sm">
                              {p.signed ? (
                                <Check size={14} className="text-green-600" />
                              ) : (
                                <X size={14} className="text-stone-300" />
                              )}
                              <span className={`font-bold ${p.signed ? "text-stone-700" : "text-stone-400"}`}>{p.name}</span>
                              {p.signed && p.signedAt && <span className="text-[10px] text-stone-400">(signé le {formatDate(p.signedAt)})</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Clauses */}
                      {(contract.clauses || []).length > 0 && (
                        <div>
                          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2">Clauses</div>
                          <ol className="list-decimal list-inside space-y-1 bg-white rounded-lg border border-stone-200 p-3">
                            {contract.clauses.map((c, i) => (
                              <li key={i} className="text-sm text-stone-700">{c}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Breach reason */}
                      {contract.status === "BREACHED" && contract.breachReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                          <span className="font-bold flex items-center gap-1"><AlertTriangle size={12} /> Motif de rupture :</span> {contract.breachReason}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {contract.status === "PENDING" && !iHaveSigned && (
                          <button onClick={() => onSignContract(contract.id)} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-xs uppercase hover:bg-green-500 flex items-center gap-1">
                            <Check size={12} /> Signer
                          </button>
                        )}
                        {contract.status === "ACTIVE" && isCreator && (
                          <button onClick={() => onCompleteContract(contract.id)} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-xs uppercase hover:bg-blue-500 flex items-center gap-1">
                            <Check size={12} /> Marquer accompli
                          </button>
                        )}
                        {(contract.status === "PENDING" || contract.status === "ACTIVE") && (
                          <button onClick={() => onCancelContract(contract.id)} className="text-red-500 text-[10px] font-bold uppercase border border-red-200 px-3 py-2 rounded hover:bg-red-50">
                            Résilier
                          </button>
                        )}
                        {contract.status === "ACTIVE" && (
                          <button onClick={() => {
                            const reason = window.prompt("Motif de la rupture :");
                            if (reason) onBreachContract(contract.id, reason);
                          }} className="text-red-700 text-[10px] font-bold uppercase border border-red-300 px-3 py-2 rounded hover:bg-red-50 flex items-center gap-1">
                            <AlertTriangle size={12} /> Déclarer rupture
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contrats publics (où je ne suis pas partie) */}
      {otherContracts.length > 0 && (
        <div>
          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3">Contrats publics</div>
          <div className="space-y-2">
            {otherContracts.map((contract) => (
              <div key={contract.id} className="bg-white border border-stone-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${STATUS_COLORS[contract.status]}`}>{STATUS_LABELS[contract.status]}</span>
                    <span className="font-bold text-stone-800 text-sm">{contract.title}</span>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    {(contract.parties || []).map((p) => p.name).join(", ")} — {formatDate(contract.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {contracts.length === 0 && (
        <div className="text-center py-16">
          <FileText size={48} className="mx-auto mb-3 text-stone-300" />
          <div className="text-stone-400 italic">Aucun contrat enregistré.</div>
        </div>
      )}
    </div>
  );
};

export default ContractsView;
