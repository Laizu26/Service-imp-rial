import React, { useState } from "react";
import {
  Shield, Plus, Trash2, Edit3, Save, X, Users, ScrollText,
  ChevronDown, AlertTriangle, Crown, Star, UserCheck,
  UserMinus, Search, CheckCircle2, Clock, FileText, Lock, Unlock,
} from "lucide-react";
import UserSearchSelect from "../ui/UserSearchSelect";

// Couleurs de grade
const RANK_COLORS = [
  { id: "stone",  label: "Gris",    dot: "bg-stone-400",    badge: "bg-stone-100 text-stone-700 border-stone-300" },
  { id: "amber",  label: "Or",      dot: "bg-amber-400",    badge: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "red",    label: "Écarlate",dot: "bg-red-500",      badge: "bg-red-100 text-red-800 border-red-300" },
  { id: "blue",   label: "Azur",    dot: "bg-blue-500",     badge: "bg-blue-100 text-blue-800 border-blue-300" },
  { id: "green",  label: "Vert",    dot: "bg-green-500",    badge: "bg-green-100 text-green-800 border-green-300" },
  { id: "purple", label: "Pourpre", dot: "bg-purple-500",   badge: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "black",  label: "Noir",    dot: "bg-stone-900",    badge: "bg-stone-800 text-stone-100 border-stone-600" },
];
const getColor = (id) => RANK_COLORS.find((c) => c.id === id) || RANK_COLORS[0];

const GuardAdminView = ({
  countries = [],
  citizens = [],
  session,
  roleInfo,
  onGuardUpdateInfo,
  onGuardAddRank,
  onGuardRemoveRank,
  onGuardAddMember,
  onGuardUpdateMember,
  onGuardRemoveMember,
  onGuardIssueOrder,
  onGuardDeleteOrder,
  onGuardCompleteOrder,
  onGuardImprison,
  onGuardRelease,
}) => {
  const safeRoleInfo = roleInfo || { level: 0, scope: "LOCAL" };
  const isGlobal = safeRoleInfo.scope === "GLOBAL";

  // Pays visibles selon le rôle
  const visibleCountries = isGlobal
    ? countries
    : countries.filter((c) => c.id === session?.countryId);

  const [selectedCountryId, setSelectedCountryId] = useState(visibleCountries[0]?.id || null);
  const [tab, setTab] = useState("corps");
  const [memberSearch, setMemberSearch] = useState("");

  // Formulaires
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  const [newRankName, setNewRankName] = useState("");
  const [newRankLevel, setNewRankLevel] = useState(1);
  const [newRankColor, setNewRankColor] = useState("stone");
  const [newRankCanOrder, setNewRankCanOrder] = useState(false);
  const [newRankCanManage, setNewRankCanManage] = useState(false);

  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRankId, setNewMemberRankId] = useState("");

  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editMemberRankId, setEditMemberRankId] = useState("");
  const [editMemberNote, setEditMemberNote] = useState("");

  const [orderTitle, setOrderTitle] = useState("");
  const [orderContent, setOrderContent] = useState("");
  const [orderMinLevel, setOrderMinLevel] = useState(1);
  const [orderUrgent, setOrderUrgent] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderFilter, setOrderFilter] = useState("active");

  // Prison
  const [prisonCitizenId, setPrisonCitizenId] = useState("");
  const [prisonReason, setPrisonReason] = useState("");
  const [prisonSentence, setPrisonSentence] = useState("");

  const country = countries.find((c) => c.id === selectedCountryId);
  const guard = country?.guard || {};
  const ranks = guard.ranks || [];
  const members = (guard.members || []).filter((m) =>
    !memberSearch || (m.citizenName || "").toLowerCase().includes(memberSearch.toLowerCase())
  );

  const canEdit = isGlobal || safeRoleInfo.level >= 40;

  const getRank = (rankId) => ranks.find((r) => r.id === rankId);

  if (!country) return (
    <div className="flex items-center justify-center h-64 text-stone-400 italic text-sm">
      Aucun pays disponible.
    </div>
  );

  const prisonCount = (guard.prison || []).length;

  const TABS = [
    { id: "corps",   label: "Corps",   icon: Shield    },
    { id: "grades",  label: "Grades",  icon: Star      },
    { id: "membres", label: "Membres", icon: Users     },
    { id: "ordres",  label: "Ordres",  icon: ScrollText },
    { id: "prison",  label: `Prison${prisonCount > 0 ? ` (${prisonCount})` : ""}`, icon: Lock },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full font-sans">

      {/* ── Panneau gauche : sélection pays (si global) ── */}
      {isGlobal && (
        <div className="w-full md:w-56 shrink-0 bg-[#fdf6e3] rounded-2xl border border-stone-300 flex flex-col overflow-hidden shadow-md">
          <div className="p-4 border-b border-stone-200">
            <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-2">
              <Crown size={12} /> Pays
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {visibleCountries.map((c) => {
              const g = c.guard || {};
              const mCount = (g.members || []).length;
              return (
                <button key={c.id}
                  onClick={() => { setSelectedCountryId(c.id); setTab("corps"); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                    selectedCountryId === c.id
                      ? "bg-stone-800 text-white"
                      : "hover:bg-stone-100 text-stone-700"
                  }`}>
                  <div className="font-bold text-sm font-serif">{c.name}</div>
                  <div className={`text-[10px] mt-0.5 ${selectedCountryId === c.id ? "text-stone-300" : "text-stone-400"}`}>
                    {g.name || "Garde non configurée"} · {mCount} membre{mCount !== 1 ? "s" : ""}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Panneau principal ── */}
      <div className="flex-1 bg-[#fdf6e3] rounded-2xl border border-stone-300 flex flex-col overflow-hidden shadow-md">

        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-stone-800 rounded-xl text-white"><Shield size={18} /></div>
            <div>
              <h2 className="font-black text-lg font-serif text-stone-800">{guard.name || "Garde non configurée"}</h2>
              <div className="text-xs text-stone-400">{country.name} · {(guard.members || []).length} membre{(guard.members || []).length !== 1 ? "s" : ""} · {ranks.length} grade{ranks.length !== 1 ? "s" : ""}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 bg-white/40 px-4 pt-2 gap-1 overflow-x-auto shrink-0">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${
                tab === t.id ? "bg-white border-stone-800 text-stone-800" : "border-transparent text-stone-400 hover:text-stone-700"
              }`}>
              <t.icon size={11} />{t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ══ CORPS ══ */}
          {tab === "corps" && (
            <div className="space-y-4">
              {isEditingInfo ? (
                <div className="bg-white rounded-xl border-2 border-stone-400 p-5 space-y-3">
                  <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Modifier le corps</div>
                  <input className="w-full p-2.5 border rounded-lg text-sm font-bold outline-none focus:border-stone-600"
                    value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nom du corps de garde..." />
                  <textarea className="w-full p-2.5 border rounded-lg text-sm outline-none resize-none focus:border-stone-600" rows={3}
                    value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description, mission, histoire..." />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { onGuardUpdateInfo(country.id, { name: editName, description: editDesc }); setIsEditingInfo(false); }}
                      className="bg-stone-800 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5"><Save size={12} /> Enregistrer</button>
                    <button onClick={() => setIsEditingInfo(false)} className="bg-stone-100 px-4 py-2 rounded-lg text-[10px] font-bold uppercase"><X size={12} /></button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-xl font-serif text-stone-800">{guard.name || <span className="italic text-stone-400">Nom non défini</span>}</h3>
                      <p className="text-sm text-stone-500 mt-1 leading-relaxed">{guard.description || <span className="italic">Aucune description.</span>}</p>
                    </div>
                    {canEdit && (
                      <button onClick={() => { setEditName(guard.name || ""); setEditDesc(guard.description || ""); setIsEditingInfo(true); }}
                        className="p-2 hover:bg-stone-100 rounded-lg text-stone-400"><Edit3 size={14} /></button>
                    )}
                  </div>
                </div>
              )}

              {/* Stats rapides */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Membres", value: (guard.members || []).length, icon: Users },
                  { label: "Grades",  value: ranks.length,                 icon: Star },
                  { label: "Ordres",  value: (guard.orders || []).length,  icon: ScrollText },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl border border-stone-200 p-4 text-center">
                    <s.icon size={16} className="mx-auto text-stone-400 mb-1" />
                    <div className="font-black text-xl text-stone-800">{s.value}</div>
                    <div className="text-[10px] uppercase text-stone-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ GRADES ══ */}
          {tab === "grades" && (
            <div className="space-y-4">
              {canEdit && (
                <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
                  <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Nouveau grade</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input className="p-2.5 border rounded-lg text-sm outline-none focus:border-stone-400"
                      value={newRankName} onChange={(e) => setNewRankName(e.target.value)} placeholder="Nom (ex: Recrue, Capitaine...)" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500 whitespace-nowrap">Niveau hiérarc.</span>
                      <input type="number" min={1} max={10}
                        className="w-16 p-2.5 border rounded-lg text-sm font-mono text-center outline-none focus:border-stone-400"
                        value={newRankLevel} onChange={(e) => setNewRankLevel(parseInt(e.target.value) || 1)} />
                      <span className="text-[9px] text-stone-400">(1 = bas)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {RANK_COLORS.map((c) => (
                      <button key={c.id} title={c.label} onClick={() => setNewRankColor(c.id)}
                        className={`w-6 h-6 rounded-full ${c.dot} border-2 transition-all ${newRankColor === c.id ? "border-stone-900 scale-125" : "border-white"}`} />
                    ))}
                    <label className="flex items-center gap-1.5 text-xs font-bold text-stone-600 ml-3 cursor-pointer">
                      <input type="checkbox" checked={newRankCanOrder} onChange={(e) => setNewRankCanOrder(e.target.checked)} />
                      Peut émettre des ordres
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-stone-600 cursor-pointer">
                      <input type="checkbox" checked={newRankCanManage} onChange={(e) => setNewRankCanManage(e.target.checked)} />
                      Peut gérer les inférieurs
                    </label>
                  </div>
                  <button
                    onClick={() => {
                      if (!newRankName.trim()) return;
                      onGuardAddRank(country.id, { id: `rank-${Date.now()}`, name: newRankName.trim(), level: newRankLevel, color: newRankColor, canOrder: newRankCanOrder, canManage: newRankCanManage });
                      setNewRankName(""); setNewRankLevel(1); setNewRankColor("stone"); setNewRankCanOrder(false); setNewRankCanManage(false);
                    }}
                    disabled={!newRankName.trim()}
                    className="bg-stone-800 text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase disabled:opacity-40 flex items-center gap-1.5">
                    <Plus size={12} /> Créer le grade
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {ranks.length === 0 && <p className="text-stone-400 italic text-sm text-center py-8">Aucun grade défini.</p>}
                {[...ranks].sort((a, b) => b.level - a.level).map((r) => {
                  const cc = getColor(r.color);
                  return (
                    <div key={r.id} className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getColor(r.color).dot} shrink-0`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-stone-800">{r.name}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cc.badge}`}>Niv. {r.level}</span>
                          {r.canOrder   && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-300">Ordres</span>}
                          {r.canManage  && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">Gestion</span>}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {(guard.members || []).filter((m) => m.rankId === r.id).length} membre{(guard.members || []).filter((m) => m.rankId === r.id).length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      {canEdit && (
                        <button onClick={() => onGuardRemoveRank(country.id, r.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-stone-300 hover:text-red-500"><Trash2 size={13} /></button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ MEMBRES ══ */}
          {tab === "membres" && (
            <div className="space-y-4">
              {canEdit && (
                <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
                  <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Recruter un membre</div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="flex-1 min-w-40">
                      <UserSearchSelect users={citizens} onSelect={setNewMemberId} value={newMemberId} placeholder="Chercher un citoyen..." />
                    </div>
                    <select className="p-2 border rounded-lg text-sm bg-white outline-none focus:border-stone-400"
                      value={newMemberRankId} onChange={(e) => setNewMemberRankId(e.target.value)}>
                      <option value="">— Grade —</option>
                      {ranks.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <button onClick={() => { if (newMemberId && newMemberRankId) { onGuardAddMember(country.id, newMemberId, newMemberRankId); setNewMemberId(""); setNewMemberRankId(""); } }}
                      disabled={!newMemberId || !newMemberRankId}
                      className="bg-stone-800 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase disabled:opacity-40 flex items-center gap-1.5">
                      <UserCheck size={12} /> Recruter
                    </button>
                  </div>
                </div>
              )}

              {/* Barre de recherche */}
              <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2">
                <Search size={13} className="text-stone-400" />
                <input className="flex-1 text-sm outline-none text-stone-700 placeholder:text-stone-300"
                  placeholder="Rechercher un membre..."
                  value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
              </div>

              <div className="space-y-2">
                {members.length === 0 && <p className="text-stone-400 italic text-sm text-center py-8">{memberSearch ? "Aucun résultat." : "Aucun membre dans la garde."}</p>}
                {members.map((m) => {
                  const rank = getRank(m.rankId);
                  const cc   = rank ? getColor(rank.color) : getColor("stone");
                  if (editingMemberId === m.citizenId) return (
                    <div key={m.citizenId} className="bg-white rounded-xl border-2 border-stone-400 p-4 space-y-2">
                      <select className="w-full p-2 border rounded-lg text-sm bg-white outline-none"
                        value={editMemberRankId} onChange={(e) => setEditMemberRankId(e.target.value)}>
                        <option value="">— Grade —</option>
                        {ranks.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                      <input className="w-full p-2 border rounded-lg text-sm outline-none"
                        value={editMemberNote} onChange={(e) => setEditMemberNote(e.target.value)}
                        placeholder="Note (optionnelle)..." />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { onGuardUpdateMember(country.id, m.citizenId, { rankId: editMemberRankId || m.rankId, note: editMemberNote }); setEditingMemberId(null); }}
                          className="bg-stone-800 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase">Enregistrer</button>
                        <button onClick={() => setEditingMemberId(null)} className="bg-stone-100 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase">Annuler</button>
                      </div>
                    </div>
                  );
                  return (
                    <div key={m.citizenId} className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center font-black text-stone-600 shrink-0`}>
                        {(m.citizenName || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-stone-800 text-sm">{m.citizenName}</div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {rank && <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cc.badge}`}>{rank.name}</span>}
                          {m.note && <span className="text-[10px] text-stone-400 italic truncate">{m.note}</span>}
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => { setEditingMemberId(m.citizenId); setEditMemberRankId(m.rankId); setEditMemberNote(m.note || ""); }}
                            className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400"><Edit3 size={13} /></button>
                          <button onClick={() => onGuardRemoveMember(country.id, m.citizenId)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-stone-300 hover:text-red-500"><UserMinus size={13} /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ ORDRES ══ */}
          {tab === "ordres" && (
            <div className="space-y-4">
              {canEdit && (
                <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
                  <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Émettre un ordre</div>
                  <input className="w-full p-2.5 border rounded-lg text-sm font-bold outline-none focus:border-stone-400"
                    value={orderTitle} onChange={(e) => setOrderTitle(e.target.value)} placeholder="Titre de l'ordre..." />
                  <textarea className="w-full p-2.5 border rounded-lg text-sm outline-none resize-none focus:border-stone-400" rows={3}
                    value={orderContent} onChange={(e) => setOrderContent(e.target.value)} placeholder="Contenu de l'ordre..." />
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">Visible dès niveau :</span>
                      <select className="p-2 border rounded-lg text-sm bg-white outline-none"
                        value={orderMinLevel} onChange={(e) => setOrderMinLevel(parseInt(e.target.value))}>
                        {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>Niv. {n}+</option>)}
                      </select>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-red-700 cursor-pointer">
                      <input type="checkbox" checked={orderUrgent} onChange={(e) => setOrderUrgent(e.target.checked)} />
                      <AlertTriangle size={12} /> Urgent
                    </label>
                    <button
                      onClick={() => {
                        if (!orderTitle.trim()) return;
                        const user = citizens.find((c) => c.id === session?.id);
                        onGuardIssueOrder(country.id, {
                          id: `ord-${Date.now()}`, title: orderTitle.trim(), content: orderContent.trim(),
                          minRankLevel: orderMinLevel, urgent: orderUrgent,
                          author: user?.name || "Inconnu", date: Date.now(),
                        });
                        setOrderTitle(""); setOrderContent(""); setOrderMinLevel(1); setOrderUrgent(false);
                      }}
                      disabled={!orderTitle.trim()}
                      className="ml-auto bg-stone-800 text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase disabled:opacity-40 flex items-center gap-1.5">
                      <ScrollText size={12} /> Émettre
                    </button>
                  </div>
                </div>
              )}

              {/* Filtre actif / terminé */}
              <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-fit">
                {[{ id: "active", label: "En cours", icon: Clock }, { id: "done", label: "Terminés", icon: CheckCircle2 }].map((f) => (
                  <button key={f.id} onClick={() => setOrderFilter(f.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      orderFilter === f.id ? "bg-white shadow text-stone-800" : "text-stone-400 hover:text-stone-600"
                    }`}>
                    <f.icon size={11} />{f.label}
                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${orderFilter === f.id ? "bg-stone-100" : "bg-stone-200"}`}>
                      {(guard.orders || []).filter((o) => f.id === "done" ? o.status === "done" : o.status !== "done").length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {(guard.orders || []).filter((o) => orderFilter === "done" ? o.status === "done" : o.status !== "done").length === 0 && (
                  <p className="text-stone-400 italic text-sm text-center py-8">Aucun ordre {orderFilter === "done" ? "terminé" : "en cours"}.</p>
                )}
                {(guard.orders || []).filter((o) => orderFilter === "done" ? o.status === "done" : o.status !== "done").map((o) => (
                  <div key={o.id} className={`bg-white rounded-xl border overflow-hidden ${o.status === "done" ? "border-green-200" : o.urgent ? "border-red-300" : "border-stone-200"}`}>
                    <div className="flex items-center px-4 py-3 gap-3">
                      {o.status === "done"
                        ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                        : o.urgent && <AlertTriangle size={14} className="text-red-500 shrink-0" />
                      }
                      <button onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                        className="flex-1 text-left flex items-center gap-2">
                        <ChevronDown size={13} className={`text-stone-400 transition-transform ${expandedOrder === o.id ? "" : "-rotate-90"}`} />
                        <span className={`font-bold text-sm ${o.status === "done" ? "text-stone-400 line-through" : "text-stone-800"}`}>{o.title}</span>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] text-stone-400">Niv. {o.minRankLevel}+ · {o.author} · {o.date ? new Date(o.date).toLocaleDateString("fr-FR") : ""}</span>
                        {(o.reports || []).length > 0 && (
                          <span className="flex items-center gap-0.5 text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                            <FileText size={9} /> {(o.reports || []).length}
                          </span>
                        )}
                        {canEdit && (
                          <button onClick={() => onGuardDeleteOrder(country.id, o.id)}
                            className="p-1 hover:bg-red-50 rounded text-stone-300 hover:text-red-500"><Trash2 size={12} /></button>
                        )}
                      </div>
                    </div>
                    {expandedOrder === o.id && (
                      <div className="px-4 pb-4 border-t border-stone-100 bg-stone-50 space-y-3">
                        {o.content && <p className="text-sm text-stone-600 mt-3 leading-relaxed whitespace-pre-wrap">{o.content}</p>}
                        {(o.reports || []).length > 0 && (
                          <div className="space-y-2 mt-2">
                            <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-1.5"><FileText size={10} /> Rapports de mission</div>
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ PRISON ══ */}
          {tab === "prison" && (
            <div className="space-y-4">
              {canEdit && (
                <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
                  <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-1.5"><Lock size={10} /> Incarcérer un citoyen</div>
                  <UserSearchSelect
                    users={citizens.filter((c) => !(guard.prison || []).some((p) => p.citizenId === c.id))}
                    onSelect={setPrisonCitizenId}
                    value={prisonCitizenId}
                    placeholder="Chercher un citoyen..."
                  />
                  <input
                    className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-stone-400"
                    placeholder="Motif d'incarcération..."
                    value={prisonReason}
                    onChange={(e) => setPrisonReason(e.target.value)}
                  />
                  <input
                    className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-stone-400"
                    placeholder="Durée de la peine (ex: 3 jours RP, indéterminée...)"
                    value={prisonSentence}
                    onChange={(e) => setPrisonSentence(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (!prisonCitizenId) return;
                      onGuardImprison(country.id, prisonCitizenId, prisonReason, prisonSentence);
                      setPrisonCitizenId(""); setPrisonReason(""); setPrisonSentence("");
                    }}
                    disabled={!prisonCitizenId}
                    className="w-full bg-red-700 hover:bg-red-800 text-white py-2.5 rounded-lg text-[10px] font-black uppercase disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <Lock size={12} /> Incarcérer
                  </button>
                </div>
              )}

              {/* Liste des prisonniers */}
              {(guard.prison || []).length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <Unlock size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="italic text-sm">La prison est vide.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(guard.prison || []).map((p) => (
                    <div key={p.id} className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-4">
                      <div className="p-2 bg-red-100 rounded-lg shrink-0 mt-0.5"><Lock size={14} className="text-red-600" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-stone-800 text-sm">{p.citizenName}</div>
                        <div className="text-xs text-red-700 mt-0.5 font-medium">{p.reason}</div>
                        {p.sentence && <div className="text-[10px] text-stone-500 mt-0.5">Peine : {p.sentence}</div>}
                        <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-3">
                          <span>Arrêté par {p.guardName}</span>
                          <span>{p.since ? new Date(p.since).toLocaleDateString("fr-FR") : ""}</span>
                        </div>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => onGuardRelease(country.id, p.citizenId)}
                          className="shrink-0 flex items-center gap-1.5 bg-green-100 hover:bg-green-200 text-green-800 border border-green-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all"
                        >
                          <Unlock size={11} /> Libérer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default GuardAdminView;
