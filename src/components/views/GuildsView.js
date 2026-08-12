import React, { useState } from "react";
import {
  Users, Plus, Crown, LogOut, Coins, Settings, UserMinus, Trash2, Shield,
  Search, X, Check, ScrollText, UserPlus, ChevronUp, ChevronDown, Send,
} from "lucide-react";
import Card from "../ui/Card";
import { formatMoney } from "../../lib/gameUtils";
import { GUILD_TYPES, GUILD_RANKS } from "../../lib/constants";

const typeInfo = (id) => GUILD_TYPES.find((t) => t.id === id) || GUILD_TYPES[0];
const rankInfo = (id) => GUILD_RANKS.find((r) => r.id === id) || GUILD_RANKS[0];

// Le Chef est toujours porté par guild.leaderId, jamais par members[].rank (voir
// useGameActions.js) — cette fonction miroir côté UI sert à afficher/activer les bons boutons.
const myRankId = (guild, userId) => {
  if (String(guild?.leaderId) === String(userId)) return "CHEF";
  const m = (guild?.members || []).find((x) => String(x.id) === String(userId));
  return m?.rank === "OFFICIER" ? "OFFICIER" : "MEMBRE";
};
const OFFICIER_LEVEL = rankInfo("OFFICIER").level;

const fmtDate = (ts) => (ts ? new Date(ts).toLocaleDateString("fr-FR") : "");

const RankBadge = ({ rankId }) => {
  const r = rankInfo(rankId);
  const styles = {
    CHEF: "bg-yellow-100 text-yellow-700 border-yellow-200",
    OFFICIER: "bg-blue-50 text-blue-600 border-blue-200",
    MEMBRE: "bg-stone-100 text-stone-500 border-stone-200",
  };
  return (
    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 shrink-0 ${styles[r.id] || styles.MEMBRE}`}>
      {r.id === "CHEF" && <Crown size={9} />}
      {r.label}
    </span>
  );
};

const RecruitingBadge = ({ guild }) => {
  if (!guild.isRecruiting) return <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 border border-stone-200">Recrutement fermé</span>;
  if (guild.openJoin === false) return <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">Sur candidature</span>;
  return <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Recrute librement</span>;
};

// ── Tableau de bord de MA guilde ────────────────────────────────────────────
const MyGuildDashboard = ({
  guild, user,
  onEditGuild, onLeaveGuild, onKickGuildMember, onSetGuildMemberRank, onTransferGuildLeadership,
  onGuildDeposit, onGuildWithdraw, onRespondGuildApplication, onPostGuildBulletin, onDeleteGuildBulletin,
  onDissolveGuild,
}) => {
  const [tab, setTab] = useState("membres");
  const [depositAmt, setDepositAmt] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [bulletinMsg, setBulletinMsg] = useState("");
  const [settingsForm, setSettingsForm] = useState({
    motto: guild.motto || "", description: guild.description || "", type: guild.type || "GENERAL",
    emblem: guild.emblem || "🏛️", color: guild.color || "#8B5CF6",
  });

  const myLevel = rankInfo(myRankId(guild, user.id)).level;
  const isChef = guild.leaderId === user.id;
  const isOfficerPlus = myLevel >= OFFICIER_LEVEL;
  const members = guild.members || [];
  const applications = guild.applications || [];
  const t = typeInfo(guild.type);

  const TABS = [
    { id: "membres", label: "Membres", icon: Users },
    { id: "tresor", label: "Trésorerie", icon: Coins },
    ...(isOfficerPlus ? [{ id: "candidatures", label: `Candidatures${applications.length ? ` (${applications.length})` : ""}`, icon: UserPlus }] : []),
    { id: "babillard", label: "Babillard", icon: ScrollText },
    ...(isChef ? [{ id: "parametres", label: "Paramètres", icon: Settings }] : []),
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Bannière */}
      <div className="rounded-2xl overflow-hidden border-2 shadow-sm" style={{ borderColor: guild.color || "#8B5CF6" }}>
        <div className="p-5 flex flex-col md:flex-row md:items-center gap-4" style={{ backgroundColor: `${guild.color || "#8B5CF6"}14` }}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 border-2"
            style={{ backgroundColor: `${guild.color || "#8B5CF6"}22`, borderColor: guild.color || "#8B5CF6" }}
          >
            {guild.emblem || "🏛️"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black font-serif text-stone-800">{guild.name}</h2>
              <span className="bg-white/70 text-stone-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-stone-200">{t.emoji} {t.label}</span>
              <RankBadge rankId={myRankId(guild, user.id)} />
            </div>
            {guild.motto && <p className="text-sm italic text-stone-500 mt-0.5">"{guild.motto}"</p>}
            {guild.description && <p className="text-xs text-stone-500 mt-1">{guild.description}</p>}
            <div className="flex gap-4 mt-2 text-[10px] text-stone-500 flex-wrap items-center">
              <span className="flex items-center gap-1"><Users size={11} /> {members.length} membre{members.length > 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1 font-mono font-bold text-amber-700"><Coins size={11} /> {formatMoney(guild.balance || 0)}</span>
              <span>Chef : {guild.leaderName}</span>
              <RecruitingBadge guild={guild} />
            </div>
          </div>
          {!isChef && (
            <button
              onClick={() => { if (window.confirm(`Quitter "${guild.name}" ?`)) onLeaveGuild(guild.id); }}
              className="shrink-0 text-red-500 text-[10px] font-bold uppercase border border-red-200 bg-white px-3 py-2 rounded-lg hover:bg-red-50 flex items-center gap-1.5"
            >
              <LogOut size={12} /> Quitter
            </button>
          )}
        </div>

        {/* Onglets */}
        <div className="flex gap-1 overflow-x-auto bg-white border-t border-stone-200 px-2 pt-2">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wide border-b-2 -mb-px whitespace-nowrap transition-all ${
                tab === tb.id ? "border-stone-800 text-stone-800" : "border-transparent text-stone-400 hover:text-stone-600"
              }`}
            >
              <tb.icon size={12} /> {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* Onglet Membres */}
      {tab === "membres" && (
        <Card title="Membres" icon={Users}>
          <div className="space-y-1.5">
            {members.map((m) => {
              const rId = myRankId(guild, m.id);
              const rLevel = rankInfo(rId).level;
              const isSelf = m.id === user.id;
              return (
                <div key={m.id} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2 border border-stone-100 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-sm text-stone-700 truncate">{m.name}{isSelf ? " (vous)" : ""}</span>
                    <RankBadge rankId={rId} />
                    <span className="text-[9px] text-stone-400 hidden sm:inline">depuis le {fmtDate(m.joinedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isChef && !isSelf && (
                      <button
                        onClick={() => onSetGuildMemberRank(guild.id, m.id, rId === "OFFICIER" ? "MEMBRE" : "OFFICIER")}
                        title={rId === "OFFICIER" ? "Rétrograder Membre" : "Promouvoir Officier"}
                        className="text-blue-500 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50"
                      >
                        {rId === "OFFICIER" ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                      </button>
                    )}
                    {isChef && !isSelf && (
                      <button
                        onClick={() => { if (window.confirm(`Transférer la direction à ${m.name} ?`)) onTransferGuildLeadership(guild.id, m.id); }}
                        title="Transférer la direction"
                        className="text-yellow-600 hover:text-yellow-500 p-1.5 rounded hover:bg-yellow-50"
                      >
                        <Crown size={13} />
                      </button>
                    )}
                    {isOfficerPlus && !isSelf && rLevel < myLevel && (
                      <button
                        onClick={() => { if (window.confirm(`Exclure ${m.name} de la guilde ?`)) onKickGuildMember(guild.id, m.id); }}
                        title="Exclure"
                        className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                      >
                        <UserMinus size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Onglet Trésorerie */}
      {tab === "tresor" && (
        <Card title={`Trésorerie — ${formatMoney(guild.balance || 0)}`} icon={Coins}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest w-full sm:w-auto">Déposer</span>
              <input type="number" step="0.1" min="0" className="w-32 p-2 border rounded-lg text-sm font-mono" placeholder="Montant" value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)} />
              <button
                onClick={() => { if (depositAmt) { onGuildDeposit(guild.id, depositAmt); setDepositAmt(""); } }}
                className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5"
              >
                <Coins size={12} /> Déposer
              </button>
            </div>
            {isOfficerPlus && (
              <div className="flex flex-wrap gap-2 items-center pt-3 border-t border-stone-100">
                <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest w-full sm:w-auto">Retirer (officier+)</span>
                <input type="number" step="0.1" min="0" className="w-32 p-2 border rounded-lg text-sm font-mono" placeholder="Montant" value={withdrawAmt} onChange={(e) => setWithdrawAmt(e.target.value)} />
                <button
                  onClick={() => { if (withdrawAmt) { onGuildWithdraw(guild.id, withdrawAmt); setWithdrawAmt(""); } }}
                  className="bg-amber-500 hover:bg-amber-400 text-stone-900 px-3 py-2 rounded-lg text-[10px] font-bold uppercase"
                >
                  Retirer
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Onglet Candidatures (officier+) */}
      {tab === "candidatures" && isOfficerPlus && (
        <Card title="Candidatures en attente" icon={UserPlus}>
          {applications.length === 0 ? (
            <p className="text-xs text-stone-400 italic text-center py-6">Aucune candidature en attente.</p>
          ) : (
            <div className="space-y-2">
              {applications.map((a) => (
                <div key={a.citizenId} className="bg-stone-50 rounded-lg border border-stone-100 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-stone-700">{a.citizenName}</span>
                    <span className="text-[9px] text-stone-400">{fmtDate(a.timestamp)}</span>
                  </div>
                  {a.message && <p className="text-xs text-stone-500 italic">"{a.message}"</p>}
                  <div className="flex gap-2">
                    <button onClick={() => onRespondGuildApplication(guild.id, a.citizenId, true)} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-1.5 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1">
                      <Check size={12} /> Accepter
                    </button>
                    <button onClick={() => onRespondGuildApplication(guild.id, a.citizenId, false)} className="flex-1 bg-white border border-stone-200 text-stone-500 hover:text-red-500 py-1.5 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1">
                      <X size={12} /> Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Onglet Babillard */}
      {tab === "babillard" && (
        <Card title="Babillard de la guilde" icon={ScrollText}>
          <div className="space-y-4">
            {isOfficerPlus && (
              <div className="flex gap-2">
                <input
                  className="flex-1 p-2 border rounded-lg text-sm"
                  placeholder="Écrire un message pour tous les membres…"
                  value={bulletinMsg}
                  maxLength={500}
                  onChange={(e) => setBulletinMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && bulletinMsg.trim()) { onPostGuildBulletin(guild.id, bulletinMsg); setBulletinMsg(""); } }}
                />
                <button
                  onClick={() => { if (bulletinMsg.trim()) { onPostGuildBulletin(guild.id, bulletinMsg); setBulletinMsg(""); } }}
                  disabled={!bulletinMsg.trim()}
                  className="bg-stone-800 hover:bg-stone-700 text-white px-3 py-2 rounded-lg disabled:opacity-40"
                >
                  <Send size={14} />
                </button>
              </div>
            )}
            {(guild.bulletins || []).length === 0 ? (
              <p className="text-xs text-stone-400 italic text-center py-6">Aucun message pour l'instant.</p>
            ) : (
              <div className="space-y-2">
                {(guild.bulletins || []).map((b) => (
                  <div key={b.id} className="bg-stone-50 rounded-lg border border-stone-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-stone-700">{b.authorName}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] text-stone-400">{fmtDate(b.timestamp)}</span>
                        {(b.authorId === user.id || isChef) && (
                          <button onClick={() => onDeleteGuildBulletin(guild.id, b.id)} className="text-stone-300 hover:text-red-500">
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-stone-600 mt-1 whitespace-pre-line">{b.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Onglet Paramètres (chef) */}
      {tab === "parametres" && isChef && (
        <Card title="Paramètres de la guilde" icon={Settings}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1">Emblème</div>
                <input className="w-full p-2 border rounded-lg text-2xl text-center" maxLength={2} value={settingsForm.emblem} onChange={(e) => setSettingsForm({ ...settingsForm, emblem: e.target.value })} />
              </div>
              <div>
                <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1">Couleur</div>
                <input type="color" className="w-full h-10 border rounded-lg" value={settingsForm.color} onChange={(e) => setSettingsForm({ ...settingsForm, color: e.target.value })} />
              </div>
              <div>
                <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1">Vocation</div>
                <select className="w-full p-2 border rounded-lg text-sm bg-white h-10" value={settingsForm.type} onChange={(e) => setSettingsForm({ ...settingsForm, type: e.target.value })}>
                  {GUILD_TYPES.map((gt) => <option key={gt.id} value={gt.id}>{gt.emoji} {gt.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1">Devise</div>
              <input className="w-full p-2 border rounded-lg text-sm" value={settingsForm.motto} onChange={(e) => setSettingsForm({ ...settingsForm, motto: e.target.value })} placeholder="Devise de la guilde…" />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1">Description</div>
              <textarea className="w-full p-2 border rounded-lg text-sm" rows={2} value={settingsForm.description} onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })} />
            </div>
            <button
              onClick={() => onEditGuild(guild.id, settingsForm)}
              className="bg-stone-800 hover:bg-stone-700 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest"
            >
              Enregistrer
            </button>

            <div className="flex flex-wrap gap-2 pt-3 border-t border-stone-100">
              <button onClick={() => onEditGuild(guild.id, { isRecruiting: !guild.isRecruiting })} className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded border ${guild.isRecruiting ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}`}>
                {guild.isRecruiting ? "Recrutement ouvert" : "Recrutement fermé"}
              </button>
              <button onClick={() => onEditGuild(guild.id, { openJoin: guild.openJoin === false })} className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded border ${guild.openJoin === false ? "border-blue-300 text-blue-700 bg-blue-50" : "border-stone-200 text-stone-500 bg-white"}`}>
                {guild.openJoin === false ? "Adhésion sur candidature" : "Adhésion libre"}
              </button>
            </div>

            <div className="pt-3 border-t border-stone-100">
              <button
                onClick={() => { if (window.confirm("Dissoudre la guilde ? Le solde vous sera restitué et tous les membres seront libérés.")) onDissolveGuild(guild.id); }}
                className="text-red-500 text-[10px] font-bold uppercase border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 flex items-center gap-1.5"
              >
                <Trash2 size={12} /> Dissoudre la guilde
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// ── Annuaire (pas de guilde) ────────────────────────────────────────────────
const GuildDirectory = ({ guilds, user, myApplications, onCreateGuild, onJoinGuild, onApplyToGuild, onCancelGuildApplication }) => {
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("GENERAL");
  const [newEmblem, setNewEmblem] = useState("🏛️");
  const [newColor, setNewColor] = useState("#8B5CF6");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [applyingId, setApplyingId] = useState(null);
  const [applyMsg, setApplyMsg] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateGuild({ name: newName.trim(), description: newDesc.trim(), type: newType, emblem: newEmblem, color: newColor });
    setNewName(""); setNewDesc(""); setNewType("GENERAL"); setNewEmblem("🏛️"); setNewColor("#8B5CF6");
  };

  const filtered = guilds
    .filter((g) => filterType === "ALL" || g.type === filterType)
    .filter((g) => !search || g.name.toLowerCase().includes(search.toLowerCase()) || (g.description || "").toLowerCase().includes(search.toLowerCase()));

  const applicationFor = (guildId) => myApplications.find((a) => a.guildId === guildId);

  return (
    <div className="space-y-6">
      {/* Fonder une guilde */}
      <Card title="Fonder une Guilde" icon={Plus}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input className="p-2 border rounded-lg font-bold text-stone-800 md:col-span-2" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom de la guilde" />
            <select className="p-2 border rounded-lg text-sm bg-white" value={newType} onChange={(e) => setNewType(e.target.value)}>
              {GUILD_TYPES.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
            </select>
            <input className="p-2 border rounded-lg text-2xl text-center" maxLength={2} value={newEmblem} onChange={(e) => setNewEmblem(e.target.value)} title="Emblème" />
          </div>
          <div className="flex gap-3 items-center">
            <input type="color" className="h-9 w-14 border rounded-lg shrink-0" value={newColor} onChange={(e) => setNewColor(e.target.value)} title="Couleur" />
            <textarea className="flex-1 p-2 border rounded-lg text-sm" rows={1} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optionnel)" />
          </div>
          <button onClick={handleCreate} disabled={!newName.trim()} className="w-full bg-stone-900 text-yellow-500 py-2.5 rounded-lg font-black uppercase text-xs tracking-widest hover:bg-stone-700 disabled:opacity-50 flex items-center justify-center gap-2">
            <Plus size={14} /> Fonder
          </button>
        </div>
      </Card>

      {/* Candidatures envoyées */}
      {myApplications.length > 0 && (
        <Card title="Mes candidatures en attente" icon={UserPlus}>
          <div className="space-y-2">
            {myApplications.map((a) => (
              <div key={a.guildId} className="flex items-center justify-between bg-stone-50 rounded-lg border border-stone-100 px-3 py-2">
                <span className="font-bold text-sm text-stone-700">{a.guildName}</span>
                <button onClick={() => onCancelGuildApplication(a.guildId)} className="text-[10px] font-bold uppercase text-red-500 hover:text-red-600 flex items-center gap-1">
                  <X size={11} /> Annuler
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Annuaire */}
      <div>
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une guilde…" className="w-full bg-white border border-stone-200 rounded-full pl-8 pr-3 py-2 text-xs outline-none focus:border-stone-400" />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setFilterType("ALL")} className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${filterType === "ALL" ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-500 border-stone-200"}`}>Toutes</button>
            {GUILD_TYPES.map((t) => (
              <button key={t.id} onClick={() => setFilterType(t.id)} className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${filterType === t.id ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-500 border-stone-200"}`}>{t.emoji} {t.label}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users size={48} className="mx-auto mb-3 text-stone-300" />
            <div className="text-stone-400 italic">{guilds.length === 0 ? "Aucune guilde n'a encore été fondée." : "Aucune guilde ne correspond à la recherche."}</div>
            {guilds.length === 0 && <div className="text-[10px] text-stone-300 mt-1">Créez la première guilde ci-dessus.</div>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((guild) => {
              const t = typeInfo(guild.type);
              const myApp = applicationFor(guild.id);
              const requiresApplication = guild.openJoin === false;
              return (
                <div key={guild.id} className="bg-white border-2 rounded-xl p-4" style={{ borderColor: `${guild.color || "#8B5CF6"}55` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border-2" style={{ backgroundColor: `${guild.color || "#8B5CF6"}22`, borderColor: guild.color || "#8B5CF6" }}>
                      {guild.emblem || "🏛️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-stone-800">{guild.name}</span>
                        <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{t.emoji} {t.label}</span>
                      </div>
                      {guild.motto && <p className="text-xs italic text-stone-400">"{guild.motto}"</p>}
                      {guild.description && <p className="text-xs text-stone-500 mt-1">{guild.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3 text-[10px] text-stone-400 items-center flex-wrap">
                    <span>{(guild.members || []).length} membre{(guild.members || []).length > 1 ? "s" : ""}</span>
                    <span>Chef : {guild.leaderName}</span>
                    <RecruitingBadge guild={guild} />
                  </div>

                  {guild.isRecruiting && !requiresApplication && (
                    <button onClick={() => onJoinGuild(guild.id)} className="mt-3 w-full bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase hover:bg-green-500 flex items-center justify-center gap-1.5">
                      <Shield size={12} /> Rejoindre
                    </button>
                  )}

                  {guild.isRecruiting && requiresApplication && !myApp && applyingId !== guild.id && (
                    <button onClick={() => { setApplyingId(guild.id); setApplyMsg(""); }} className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase hover:bg-blue-500 flex items-center justify-center gap-1.5">
                      <UserPlus size={12} /> Postuler
                    </button>
                  )}

                  {applyingId === guild.id && !myApp && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        autoFocus
                        className="w-full p-2 border rounded-lg text-xs"
                        rows={2}
                        maxLength={300}
                        placeholder="Message de candidature (optionnel)…"
                        value={applyMsg}
                        onChange={(e) => setApplyMsg(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { onApplyToGuild(guild.id, applyMsg); setApplyingId(null); }}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded text-[10px] font-bold uppercase"
                        >
                          Envoyer
                        </button>
                        <button onClick={() => setApplyingId(null)} className="px-3 bg-white border border-stone-200 text-stone-400 rounded text-[10px] font-bold uppercase">
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}

                  {myApp && (
                    <div className="mt-3 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <span className="text-[10px] font-bold text-blue-700 uppercase">Candidature envoyée</span>
                      <button onClick={() => onCancelGuildApplication(guild.id)} className="text-[10px] font-bold uppercase text-red-500 hover:text-red-600">Annuler</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Composant principal ─────────────────────────────────────────────────────
const GuildsView = ({
  guilds = [],
  user,
  onCreateGuild,
  onEditGuild,
  onJoinGuild,
  onApplyToGuild,
  onCancelGuildApplication,
  onRespondGuildApplication,
  onLeaveGuild,
  onKickGuildMember,
  onSetGuildMemberRank,
  onTransferGuildLeadership,
  onGuildDeposit,
  onGuildWithdraw,
  onPostGuildBulletin,
  onDeleteGuildBulletin,
  onDissolveGuild,
}) => {
  // Une seule guilde à la fois — guildId dénormalisé sur le citoyen fait foi ; on retombe sur un
  // scan de members[] pour les comptes créés avant l'introduction de ce champ.
  const myGuild = user.guildId
    ? guilds.find((g) => g.id === user.guildId)
    : guilds.find((g) => (g.members || []).some((m) => m.id === user.id));

  const myApplications = guilds
    .filter((g) => (g.applications || []).some((a) => String(a.citizenId) === String(user.id)))
    .map((g) => ({ guildId: g.id, guildName: g.name }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        <Users size={24} className="text-stone-400" />
        <h2 className="text-2xl font-black font-serif text-stone-800">Guildes & Associations</h2>
      </div>

      {myGuild ? (
        <MyGuildDashboard
          guild={myGuild}
          user={user}
          onEditGuild={onEditGuild}
          onLeaveGuild={onLeaveGuild}
          onKickGuildMember={onKickGuildMember}
          onSetGuildMemberRank={onSetGuildMemberRank}
          onTransferGuildLeadership={onTransferGuildLeadership}
          onGuildDeposit={onGuildDeposit}
          onGuildWithdraw={onGuildWithdraw}
          onRespondGuildApplication={onRespondGuildApplication}
          onPostGuildBulletin={onPostGuildBulletin}
          onDeleteGuildBulletin={onDeleteGuildBulletin}
          onDissolveGuild={onDissolveGuild}
        />
      ) : (
        <GuildDirectory
          guilds={guilds}
          user={user}
          myApplications={myApplications}
          onCreateGuild={onCreateGuild}
          onJoinGuild={onJoinGuild}
          onApplyToGuild={onApplyToGuild}
          onCancelGuildApplication={onCancelGuildApplication}
        />
      )}
    </div>
  );
};

export default GuildsView;
