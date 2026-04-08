import React, { useState } from "react";
import { Users, Plus, Crown, LogOut, Coins, Settings, UserMinus, ChevronDown, ChevronUp, Trash2, Shield } from "lucide-react";
import Card from "../ui/Card";
import { formatMoney } from "../../lib/gameUtils";

const GUILD_TYPES = {
  GENERAL: "Générale",
  COMMERCE: "Commerce",
  MILITAIRE: "Militaire",
  RELIGIEUX: "Religieux",
  ARTISAN: "Artisanat",
};

const GuildsView = ({
  guilds = [],
  user,
  onCreateGuild,
  onEditGuild,
  onJoinGuild,
  onLeaveGuild,
  onKickGuildMember,
  onSetGuildMemberRole,
  onTransferGuildLeadership,
  onGuildDeposit,
  onGuildWithdraw,
  onDissolveGuild,
}) => {
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("GENERAL");
  const [expanded, setExpanded] = useState(null);
  const [depositAmt, setDepositAmt] = useState({});
  const [withdrawAmt, setWithdrawAmt] = useState({});
  const [editMotto, setEditMotto] = useState({});
  const [roleEdit, setRoleEdit] = useState({});

  const myGuilds = guilds.filter((g) => (g.members || []).some((m) => m.id === user.id));
  const otherGuilds = guilds.filter((g) => !(g.members || []).some((m) => m.id === user.id));

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateGuild({ name: newName.trim(), description: newDesc.trim(), type: newType });
    setNewName(""); setNewDesc(""); setNewType("GENERAL");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        <Users size={24} className="text-stone-400" />
        <h2 className="text-2xl font-black font-serif text-stone-800">Guildes & Associations</h2>
      </div>

      {/* Fonder une guilde */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
        <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Fonder une Guilde</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="p-2 border rounded font-bold text-stone-800" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom de la guilde" />
          <select className="p-2 border rounded text-sm bg-white" value={newType} onChange={(e) => setNewType(e.target.value)}>
            {Object.entries(GUILD_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={handleCreate} disabled={!newName.trim()} className="bg-stone-900 text-yellow-500 py-2 rounded font-black uppercase text-xs tracking-widest hover:bg-stone-700 disabled:opacity-50 flex items-center justify-center gap-2">
            <Plus size={14} /> Fonder
          </button>
        </div>
        <textarea className="w-full p-2 border rounded text-sm" rows={2} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optionnel)" />
      </div>

      {/* Mes guildes */}
      {myGuilds.length > 0 && (
        <div>
          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3">Mes Guildes</div>
          <div className="space-y-3">
            {myGuilds.map((guild) => {
              const isLeader = guild.leaderId === user.id;
              const isExpanded = expanded === guild.id;
              const myMember = (guild.members || []).find((m) => m.id === user.id);
              return (
                <div key={guild.id} className={`bg-white border-2 ${isLeader ? "border-yellow-300" : "border-stone-200"} rounded-xl overflow-hidden`}>
                  <div className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-stone-50" onClick={() => setExpanded(isExpanded ? null : guild.id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-stone-800 text-lg">{guild.name}</span>
                        <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{GUILD_TYPES[guild.type] || guild.type}</span>
                        {isLeader && <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1"><Crown size={10} /> Chef</span>}
                        {!isLeader && myMember && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{myMember.role}</span>}
                      </div>
                      {guild.description && <p className="text-xs text-stone-500 mt-1">{guild.description}</p>}
                      {guild.motto && <p className="text-xs italic text-stone-400 mt-0.5">"{guild.motto}"</p>}
                      <div className="flex gap-4 mt-1 text-[10px] text-stone-400">
                        <span>{(guild.members || []).length} membre{(guild.members || []).length > 1 ? "s" : ""}</span>
                        <span className="font-mono font-bold text-yellow-700">{formatMoney((guild.balance || 0))}</span>
                        <span>Chef : {guild.leaderName}</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-stone-200 p-4 space-y-4 bg-stone-50">
                      {/* Membres */}
                      <div>
                        <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2">Membres</div>
                        <div className="space-y-1">
                          {(guild.members || []).map((m) => (
                            <div key={m.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-stone-100">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-stone-700">{m.name}</span>
                                <span className="text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded uppercase font-bold">{m.role}</span>
                                {m.id === guild.leaderId && <Crown size={12} className="text-yellow-500" />}
                              </div>
                              {isLeader && m.id !== user.id && (
                                <div className="flex items-center gap-1">
                                  <input
                                    className="w-20 px-1.5 py-1 border rounded text-[10px]"
                                    placeholder="Rôle"
                                    value={roleEdit[guild.id + m.id] ?? m.role}
                                    onChange={(e) => setRoleEdit({ ...roleEdit, [guild.id + m.id]: e.target.value })}
                                    onBlur={() => {
                                      const val = roleEdit[guild.id + m.id];
                                      if (val && val !== m.role) onSetGuildMemberRole(guild.id, m.id, val);
                                    }}
                                  />
                                  <button onClick={() => onTransferGuildLeadership(guild.id, m.id)} className="text-yellow-600 hover:text-yellow-500 p-1" title="Transférer la direction">
                                    <Crown size={12} />
                                  </button>
                                  <button onClick={() => onKickGuildMember(guild.id, m.id)} className="text-red-400 hover:text-red-600 p-1" title="Exclure">
                                    <UserMinus size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Trésorerie */}
                      <div className="bg-white rounded-lg border border-stone-200 p-3">
                        <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2">Trésorerie — {formatMoney((guild.balance || 0))}</div>
                        <div className="flex gap-2">
                          <input type="number" className="w-28 p-1.5 border rounded text-sm font-mono" placeholder="Montant" value={depositAmt[guild.id] || ""} onChange={(e) => setDepositAmt({ ...depositAmt, [guild.id]: e.target.value })} />
                          <button onClick={() => { if (depositAmt[guild.id]) { onGuildDeposit(guild.id, depositAmt[guild.id]); setDepositAmt({ ...depositAmt, [guild.id]: "" }); } }} className="bg-green-600 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:bg-green-500">
                            <Coins size={12} /> Déposer
                          </button>
                          {isLeader && (
                            <>
                              <input type="number" className="w-28 p-1.5 border rounded text-sm font-mono" placeholder="Montant" value={withdrawAmt[guild.id] || ""} onChange={(e) => setWithdrawAmt({ ...withdrawAmt, [guild.id]: e.target.value })} />
                              <button onClick={() => { if (withdrawAmt[guild.id]) { onGuildWithdraw(guild.id, withdrawAmt[guild.id]); setWithdrawAmt({ ...withdrawAmt, [guild.id]: "" }); } }} className="bg-yellow-500 text-stone-900 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:bg-yellow-400">
                                Retirer
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions chef */}
                      {isLeader && (
                        <div className="bg-white rounded-lg border border-stone-200 p-3 space-y-3">
                          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Gestion</div>
                          <div className="flex gap-2 items-center">
                            <input className="flex-1 p-1.5 border rounded text-sm" placeholder="Devise de la guilde..." value={editMotto[guild.id] ?? guild.motto ?? ""} onChange={(e) => setEditMotto({ ...editMotto, [guild.id]: e.target.value })} />
                            <button onClick={() => onEditGuild(guild.id, { motto: editMotto[guild.id] || "" })} className="bg-stone-800 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:bg-stone-600">
                              <Settings size={12} />
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => onEditGuild(guild.id, { isRecruiting: !guild.isRecruiting })} className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded border ${guild.isRecruiting ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}`}>
                              {guild.isRecruiting ? "Recrutement ouvert" : "Recrutement fermé"}
                            </button>
                            <button onClick={() => { if (window.confirm("Dissoudre la guilde ? Le solde vous sera restitué.")) onDissolveGuild(guild.id); }} className="text-red-500 text-[10px] font-bold uppercase border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 flex items-center gap-1">
                              <Trash2 size={12} /> Dissoudre
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Quitter */}
                      {!isLeader && (
                        <button onClick={() => onLeaveGuild(guild.id)} className="text-red-500 text-[10px] font-bold uppercase border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 flex items-center gap-1">
                          <LogOut size={12} /> Quitter la guilde
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Autres guildes */}
      {otherGuilds.length > 0 && (
        <div>
          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3">Guildes existantes</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {otherGuilds.map((guild) => (
              <div key={guild.id} className="bg-white border border-stone-200 rounded-xl p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-stone-800">{guild.name}</span>
                  <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{GUILD_TYPES[guild.type] || guild.type}</span>
                  {guild.isRecruiting && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Recrute</span>}
                </div>
                {guild.description && <p className="text-xs text-stone-500 mt-1">{guild.description}</p>}
                {guild.motto && <p className="text-xs italic text-stone-400">"{guild.motto}"</p>}
                <div className="flex gap-4 mt-2 text-[10px] text-stone-400">
                  <span>{(guild.members || []).length} membre{(guild.members || []).length > 1 ? "s" : ""}</span>
                  <span>Chef : {guild.leaderName}</span>
                </div>
                {guild.isRecruiting && (
                  <button onClick={() => onJoinGuild(guild.id)} className="mt-3 bg-green-600 text-white px-4 py-2 rounded font-bold text-xs uppercase hover:bg-green-500 flex items-center gap-1">
                    <Shield size={12} /> Rejoindre
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {guilds.length === 0 && (
        <div className="text-center py-16">
          <Users size={48} className="mx-auto mb-3 text-stone-300" />
          <div className="text-stone-400 italic">Aucune guilde n'a encore été fondée.</div>
          <div className="text-[10px] text-stone-300 mt-1">Créez la première guilde ci-dessus.</div>
        </div>
      )}
    </div>
  );
};

export default GuildsView;
