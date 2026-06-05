import React, { useState, useMemo, useCallback } from "react";
import {
  Mail, Send, Inbox, PenTool, Search, Reply, AlertOctagon,
  Star, User, Stamp, ChevronLeft, FileText, Trash2,
  CornerUpRight, CheckCheck, X, MailOpen, Archive, Plus,
} from "lucide-react";

/* ─── UTILITAIRES ─────────────────────────────────────────────────────────── */

const AVATAR_COLORS = [
  "bg-amber-700", "bg-stone-700", "bg-red-800", "bg-blue-800",
  "bg-emerald-800", "bg-violet-800", "bg-rose-800", "bg-teal-700",
];

const avatarColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const SEAL_META = {
  URGENT:   { label: "URGENT",   bg: "bg-red-700",    text: "text-white",        dot: "bg-red-500" },
  OFFICIAL: { label: "OFFICIEL", bg: "bg-blue-800",   text: "text-white",        dot: "bg-blue-400" },
  SECRET:   { label: "SECRET",   bg: "bg-stone-900",  text: "text-stone-200",    dot: "bg-stone-400" },
  NORMAL:   { label: "",         bg: "bg-[#b8860b]",  text: "text-stone-900",    dot: "" },
};

/* ─── SÉLECTEUR DE CITOYEN ────────────────────────────────────────────────── */
const CitizenSelect = ({ users, value, onChange, isMulti = false, label = "Destinataire" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const safeUsers = Array.isArray(users) ? users : [];
  const filtered = safeUsers.filter((u) =>
    (u.name || "").toLowerCase().includes(search.toLowerCase())
  );
  const handleSelect = (id) => {
    if (isMulti) {
      const cur = Array.isArray(value) ? value : [];
      onChange(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
    } else {
      onChange(id); setIsOpen(false); setSearch("");
    }
  };
  const selected = isMulti
    ? (value || []).map((id) => safeUsers.find((u) => u.id === id)).filter(Boolean)
    : safeUsers.find((u) => u.id === value);

  return (
    <div className={`relative ${isOpen ? "z-[100]" : "z-10"}`}>
      <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1 block">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 flex items-center gap-2 cursor-pointer hover:border-[#b8860b] transition-colors min-h-[38px]"
      >
        {isMulti ? (
          selected.length > 0 ? (
            <div className="flex flex-wrap gap-1 flex-1">
              {selected.map((u) => (
                <span key={u.id} className="bg-stone-200 text-stone-700 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                  {u.name}
                  <span className="cursor-pointer hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleSelect(u.id); }}>×</span>
                </span>
              ))}
            </div>
          ) : <span className="text-stone-400 text-xs italic flex-1">En copie (optionnel)…</span>
        ) : selected ? (
          <span className="flex items-center gap-2 flex-1 text-sm font-semibold text-stone-800">
            <span className={`w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center ${avatarColor(selected.name)}`}>
              {selected.name[0]?.toUpperCase()}
            </span>
            {selected.name}
          </span>
        ) : <span className="text-stone-400 text-xs italic flex-1">Choisir un destinataire…</span>}
        <span className="text-stone-400 text-xs shrink-0">▼</span>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 mt-1 w-full bg-stone-900 rounded-xl shadow-2xl border border-stone-700 max-h-56 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-stone-700">
              <input autoFocus className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-[#b8860b]"
                placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0
                ? <div className="p-3 text-xs text-stone-500 text-center">Aucun résultat</div>
                : filtered.map((u) => {
                  const isSel = isMulti ? (value || []).includes(u.id) : value === u.id;
                  return (
                    <div key={u.id} onClick={() => handleSelect(u.id)}
                      className={`px-3 py-2 cursor-pointer flex items-center gap-3 transition-colors ${isSel ? "bg-[#b8860b]/20 text-[#b8860b]" : "hover:bg-white/10 text-stone-200"}`}>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white ${avatarColor(u.name)}`}>
                        {u.name[0]?.toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{u.name}</div>
                        <div className="text-[10px] text-stone-500 uppercase">{u.role || "Citoyen"}</div>
                      </div>
                      {isSel && <span className="text-[#b8860b] text-xs">✓</span>}
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────── */
const PostView = ({ users, session, onSend, onUpdateUser, notify }) => {
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [hoverMsgId, setHoverMsgId] = useState(null);

  const [draft, setDraft] = useState({
    to: "", cc: [], subject: "", heading: "", content: "", seal: "NORMAL", alias: "",
  });

  /* ── données ── */
  const safeUsers = useMemo(() => Array.isArray(users) ? users : [], [users]);
  const rawMessages = useMemo(() => session?.messages || [], [session]);

  const processedMessages = useMemo(() =>
    rawMessages.map((m) => ({
      ...m,
      isSpam: !!m.isSpam,
      isStarred: !!m.isStarred,
      isRead: !!m.isRead,
      tags: m.tags || [],
      cc: m.cc || [],
    })),
  [rawMessages]);

  const inboxMessages  = useMemo(() => processedMessages.filter((m) => !m.isSpam), [processedMessages]);
  const starredMessages = useMemo(() => processedMessages.filter((m) => m.isStarred && !m.isSpam), [processedMessages]);
  const spamMessages   = useMemo(() => processedMessages.filter((m) => m.isSpam), [processedMessages]);

  const sentMessages = useMemo(() => {
    let sent = [];
    safeUsers.forEach((u) => {
      (u.messages || []).forEach((m) => {
        if (String(m.fromId) === String(session?.id)) {
          sent.push({ ...m, toName: u.name, toId: u.id, isRead: true, isSpam: false, isStarred: false, cc: m.cc || [], tags: m.tags || [], folder: "sent" });
        }
      });
    });
    return sent.sort((a, b) => b.id - a.id);
  }, [safeUsers, session?.id]);

  const unreadCount = useMemo(() => inboxMessages.filter((m) => !m.isRead).length, [inboxMessages]);

  const displayedMessages = useMemo(() => {
    const src = { inbox: inboxMessages, sent: sentMessages, starred: starredMessages, spam: spamMessages }[activeFolder] || inboxMessages;
    const q = searchTerm.toLowerCase();
    if (!q) return src;
    return src.filter((m) =>
      m.subject?.toLowerCase().includes(q) ||
      m.from?.toLowerCase().includes(q) ||
      m.toName?.toLowerCase().includes(q) ||
      m.content?.toLowerCase().includes(q)
    );
  }, [activeFolder, inboxMessages, sentMessages, starredMessages, spamMessages, searchTerm]);

  const folders = useMemo(() => [
    { id: "inbox",   label: "Réception",   icon: Inbox,        badge: unreadCount,         badgeStyle: "bg-red-600 text-white" },
    { id: "starred", label: "Prioritaires",icon: Star,         badge: starredMessages.length, badgeStyle: "bg-[#b8860b] text-stone-900" },
    { id: "sent",    label: "Envoyés",     icon: Send,         badge: 0,                   badgeStyle: "" },
    { id: "spam",    label: "Rebuts",      icon: AlertOctagon, badge: spamMessages.length, badgeStyle: "bg-stone-600 text-stone-200" },
  ], [unreadCount, starredMessages.length, spamMessages.length]);

  /* ── actions ── */
  const handleUpdateMsg = useCallback((msgId, updates) => {
    if (!onUpdateUser) return;
    const newMessages = rawMessages.map((m) =>
      String(m.id) === String(msgId) ? { ...m, ...updates } : m
    );
    onUpdateUser({ ...session, messages: newMessages });
    if (selectedMsg && String(selectedMsg.id) === String(msgId))
      setSelectedMsg((prev) => prev ? { ...prev, ...updates } : prev);
  }, [rawMessages, session, onUpdateUser, selectedMsg]);

  const handleCompose = (prefill = null) => {
    setSelectedMsg(null);
    setDraft(prefill ?? { to: "", cc: [], subject: "", heading: "", content: "", seal: "NORMAL", alias: "" });
    setIsComposing(true);
  };

  const handleReply = (msg) => {
    if (!msg.fromId) return notify("Expéditeur inconnu.", "error");
    const quote = msg.content.substring(0, 300) + (msg.content.length > 300 ? "…" : "");
    handleCompose({
      to: msg.fromId, cc: [],
      subject: msg.subject.startsWith("Re: ") ? msg.subject : `Re: ${msg.subject}`,
      heading: "", alias: "", seal: "NORMAL",
      content: `\n\n\n— Le ${msg.date}, ${msg.from} écrivait :\n> ${quote}`,
    });
  };

  const handleForward = (msg) => {
    handleCompose({
      to: "", cc: [],
      subject: msg.subject.startsWith("Fwd: ") ? msg.subject : `Fwd: ${msg.subject}`,
      heading: "", alias: "", seal: msg.seal || "NORMAL",
      content: `\n\n\n— Transmis de ${msg.from} (${msg.date}) :\n\n${msg.content}`,
    });
  };

  const handleSend = () => {
    if (!draft.to) return notify("Destinataire manquant.", "error");
    if (!draft.subject.trim()) return notify("Objet vide.", "error");
    if (!draft.content.trim()) return notify("Contenu vide.", "error");
    let finalContent = draft.heading?.trim() ? `== ${draft.heading.toUpperCase()} ==\n\n` : "";
    finalContent += draft.content;
    if (draft.alias?.trim()) finalContent += `\n\n[Signé : ${draft.alias}]`;
    try {
      onSend(draft.to, draft.subject, finalContent, draft.cc, draft.seal, []);
      notify("Envoyé.", "success");
      setIsComposing(false);
      setActiveFolder("sent");
      setDraft({ to: "", cc: [], subject: "", heading: "", content: "", seal: "NORMAL", alias: "" });
    } catch (e) {
      notify("Erreur technique.", "error");
    }
  };

  const handleDeleteMsg = (msgId) => setDeleteConfirmId(String(msgId));
  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    const newMessages = rawMessages.filter((m) => String(m.id) !== deleteConfirmId);
    onUpdateUser({ ...session, messages: newMessages });
    setDeleteConfirmId(null);
    setSelectedMsg(null);
    notify("Message supprimé.", "info");
  };

  const handleMarkAllRead = () => {
    if (!onUpdateUser) return;
    onUpdateUser({ ...session, messages: rawMessages.map((m) => ({ ...m, isRead: true })) });
    notify("Tous les messages marqués comme lus.", "info");
  };

  const openMsg = (msg) => {
    setSelectedMsg(msg);
    setIsComposing(false);
    if (!msg.isRead) handleUpdateMsg(msg.id, { isRead: true });
  };

  const getSealStyle = (seal) => {
    const m = SEAL_META[seal] || SEAL_META.NORMAL;
    return `${m.bg} ${m.text}`;
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const showList   = !isMobile || (!selectedMsg && !isComposing);
  const showPane   = !isMobile || selectedMsg || isComposing;

  /* ─── RENDER ────────────────────────────────────────────────────────────── */
  return (
    <div className="flex w-full h-full bg-stone-100 rounded-xl overflow-hidden border border-stone-300 shadow-2xl font-sans text-stone-800 relative">

      {/* ── MODAL DELETE ── */}
      {deleteConfirmId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <p className="font-black text-stone-900 text-sm">Supprimer ce message ?</p>
                <p className="text-xs text-stone-500">Action irréversible</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors">Annuler</button>
              <button onClick={confirmDelete} className="px-4 py-2 text-xs font-black bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── COLONNE 1 : SIDEBAR ── */}
      <aside className="w-14 md:w-56 bg-stone-950 flex flex-col shrink-0 border-r border-stone-800">
        {/* Logo / titre */}
        <div className="px-3 md:px-4 pt-5 pb-4 border-b border-stone-800">
          <button
            onClick={() => handleCompose()}
            className="w-full bg-[#b8860b] hover:bg-[#d4a017] text-stone-950 font-black text-xs uppercase tracking-widest rounded-xl py-2.5 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
          >
            <PenTool size={14} />
            <span className="hidden md:inline">Rédiger</span>
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => { setActiveFolder(f.id); setSelectedMsg(null); setIsComposing(false); }}
              className={`w-full flex items-center gap-3 px-2.5 md:px-3 py-2.5 rounded-lg transition-all text-left group ${
                activeFolder === f.id
                  ? "bg-stone-800 text-[#b8860b]"
                  : "text-stone-400 hover:bg-stone-900 hover:text-stone-200"
              }`}
            >
              <f.icon size={16} className="shrink-0" />
              <span className="hidden md:flex flex-1 items-center justify-between text-xs font-bold uppercase tracking-wide truncate">
                {f.label}
                {f.badge > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${f.badgeStyle || "bg-stone-700 text-stone-300"}`}>
                    {f.badge}
                  </span>
                )}
              </span>
              {/* Mobile: dot badge */}
              {f.badge > 0 && (
                <span className="md:hidden w-2 h-2 rounded-full bg-[#b8860b] shrink-0" />
              )}
            </button>
          ))}
        </nav>

        {/* Pied sidebar */}
        <div className="p-3 border-t border-stone-800">
          <div className="hidden md:flex items-center gap-2 px-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0 ${avatarColor(session?.name || "")}`}>
              {(session?.name || "?")[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-stone-300 truncate">{session?.name || "Inconnu"}</div>
              <div className="text-[9px] text-stone-600 uppercase">{session?.role || "Citoyen"}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── COLONNE 2 : LISTE ── */}
      {showList && (
        <div className="w-full md:w-80 border-r border-stone-200 flex flex-col bg-white shrink-0">
          {/* Barre de recherche */}
          <div className="px-3 py-3 border-b border-stone-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={13} />
              <input
                className="w-full pl-8 pr-8 py-2 bg-stone-100 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#b8860b]/30 transition-all"
                placeholder="Rechercher…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
                  <X size={13} />
                </button>
              )}
            </div>
            {activeFolder === "inbox" && unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                className="w-full flex items-center justify-center gap-1.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors">
                <CheckCheck size={12} /> Tout marquer comme lu ({unreadCount})
              </button>
            )}
          </div>

          {/* En-tête dossier */}
          <div className="px-4 py-2 flex items-center justify-between border-b border-stone-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">
              {folders.find((f) => f.id === activeFolder)?.label}
              {" "}<span className="text-stone-300">{displayedMessages.length}</span>
            </span>
          </div>

          {/* Liste des messages */}
          <div className="flex-1 overflow-y-auto">
            {displayedMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-stone-300 gap-3 pb-10">
                <Inbox size={36} className="opacity-40" />
                <span className="text-xs">Aucune missive</span>
              </div>
            ) : (
              displayedMessages.map((msg) => {
                const isSent = activeFolder === "sent";
                const displayName = isSent ? `À : ${msg.toName || "Inconnu"}` : (msg.from || "Inconnu");
                const isUnread = !msg.isRead && !isSent;
                const isSelected = selectedMsg && String(selectedMsg.id) === String(msg.id);
                const seal = SEAL_META[msg.seal] || SEAL_META.NORMAL;
                return (
                  <div
                    key={String(msg.id)}
                    onClick={() => openMsg(msg)}
                    onMouseEnter={() => setHoverMsgId(String(msg.id))}
                    onMouseLeave={() => setHoverMsgId(null)}
                    className={`relative px-4 py-3 border-b border-stone-100 cursor-pointer transition-all ${
                      isSelected ? "bg-amber-50 border-l-2 border-l-[#b8860b]" :
                      isUnread ? "bg-amber-50/40 hover:bg-amber-50" :
                      "hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5 ${avatarColor(isSent ? (msg.toName || "") : (msg.from || ""))}`}>
                        {(isSent ? (msg.toName || "?") : (msg.from || "?"))[0]?.toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Ligne 1: nom + date */}
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-xs truncate ${isUnread ? "font-black text-stone-900" : "font-semibold text-stone-700"}`}>
                            {displayName}
                          </span>
                          <span className="text-[9px] text-stone-400 font-mono shrink-0 whitespace-nowrap">{msg.date}</span>
                        </div>
                        {/* Ligne 2: sujet + badge seal */}
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {(msg.subject?.startsWith("Re: ") || msg.subject?.startsWith("Fwd: ")) && (
                            <span className="text-[8px] font-black bg-stone-200 text-stone-500 px-1 rounded shrink-0">
                              {msg.subject.startsWith("Fwd: ") ? "Fwd" : "Re"}
                            </span>
                          )}
                          <span className={`text-xs truncate ${isUnread ? "font-bold text-stone-900" : "text-stone-600"}`}>
                            {msg.subject?.replace(/^(Re|Fwd): /, "") || "(sans objet)"}
                          </span>
                          {msg.seal && msg.seal !== "NORMAL" && (
                            <span className={`text-[7px] font-black px-1 py-0.5 rounded uppercase shrink-0 ${seal.bg} ${seal.text}`}>
                              {seal.label}
                            </span>
                          )}
                        </div>
                        {/* Ligne 3: aperçu */}
                        <div className="text-[10px] text-stone-400 truncate">{msg.content?.substring(0, 55)}…</div>
                      </div>

                      {/* Indicateur non lu */}
                      {isUnread && <div className="w-2 h-2 rounded-full bg-[#b8860b] shrink-0 mt-1.5" />}
                    </div>

                    {/* Actions rapides au survol */}
                    {hoverMsgId === String(msg.id) && !isSent && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-stone-200 rounded-lg shadow-md px-1 py-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUpdateMsg(msg.id, { isStarred: !msg.isStarred }); }}
                          className={`p-1 rounded hover:bg-stone-100 transition-colors ${msg.isStarred ? "text-[#b8860b]" : "text-stone-400"}`}
                          title="Prioritaire"
                        >
                          <Star size={12} fill={msg.isStarred ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUpdateMsg(msg.id, { isRead: !msg.isRead }); }}
                          className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                          title={msg.isRead ? "Marquer non lu" : "Marquer lu"}
                        >
                          <MailOpen size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUpdateMsg(msg.id, { isSpam: !msg.isSpam }); }}
                          className={`p-1 rounded hover:bg-stone-100 transition-colors ${msg.isSpam ? "text-red-500" : "text-stone-400"}`}
                          title="Rebut"
                        >
                          <AlertOctagon size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteMsg(msg.id); }}
                          className="p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── COLONNE 3 : PANNEAU LECTURE / RÉDACTION ── */}
      {showPane && (
        <div className="flex-1 flex flex-col min-w-0 bg-[#fdfbf7]">

          {/* ── VIDE ── */}
          {!isComposing && !selectedMsg && (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-300 gap-4">
              <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center">
                <Mail size={32} className="opacity-40" />
              </div>
              <p className="text-sm font-bold text-stone-400">Sélectionner une missive</p>
              <button onClick={() => handleCompose()} className="flex items-center gap-2 px-4 py-2 bg-[#b8860b] text-stone-900 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#d4a017] transition-all">
                <PenTool size={13} /> Rédiger
              </button>
            </div>
          )}

          {/* ── LECTURE ── */}
          {!isComposing && selectedMsg && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="px-4 py-2.5 border-b border-stone-200 bg-white flex items-center gap-2 shrink-0">
                <button onClick={() => setSelectedMsg(null)} className="md:hidden flex items-center gap-1 text-stone-500 hover:text-stone-800 mr-1">
                  <ChevronLeft size={16} />
                </button>
                <div className="flex-1" />
                {/* Actions toolbar */}
                {activeFolder !== "sent" && (
                  <ActionBtn onClick={() => handleReply(selectedMsg)} title="Répondre"><Reply size={15} /></ActionBtn>
                )}
                <ActionBtn onClick={() => handleForward(selectedMsg)} title="Transférer"><CornerUpRight size={15} /></ActionBtn>
                {activeFolder !== "sent" && (
                  <ActionBtn
                    onClick={() => handleUpdateMsg(selectedMsg.id, { isStarred: !selectedMsg.isStarred })}
                    active={selectedMsg.isStarred}
                    activeClass="bg-amber-50 text-[#b8860b]"
                    title="Prioritaire"
                  >
                    <Star size={15} fill={selectedMsg.isStarred ? "currentColor" : "none"} />
                  </ActionBtn>
                )}
                {activeFolder !== "sent" && (
                  <ActionBtn
                    onClick={() => handleUpdateMsg(selectedMsg.id, { isRead: !selectedMsg.isRead })}
                    title={selectedMsg.isRead ? "Marquer non lu" : "Marquer lu"}
                  >
                    <MailOpen size={15} />
                  </ActionBtn>
                )}
                {activeFolder !== "sent" && (
                  <ActionBtn
                    onClick={() => handleUpdateMsg(selectedMsg.id, { isSpam: !selectedMsg.isSpam })}
                    active={selectedMsg.isSpam}
                    activeClass="bg-red-50 text-red-600"
                    title={selectedMsg.isSpam ? "Retirer des rebuts" : "Rebut"}
                  >
                    <AlertOctagon size={15} />
                  </ActionBtn>
                )}
                {activeFolder !== "sent" && (
                  <ActionBtn onClick={() => handleDeleteMsg(selectedMsg.id)} hoverClass="hover:bg-red-50 hover:text-red-600" title="Supprimer">
                    <Trash2 size={15} />
                  </ActionBtn>
                )}
              </div>

              {/* Corps du message */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10">
                <div className="max-w-2xl mx-auto">
                  {/* En-tête lettre */}
                  <div className="mb-8">
                    {/* Sceau badge */}
                    {selectedMsg.seal && selectedMsg.seal !== "NORMAL" && (
                      <div className="mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getSealStyle(selectedMsg.seal)}`}>
                          <Stamp size={10} />
                          {SEAL_META[selectedMsg.seal]?.label || selectedMsg.seal}
                        </span>
                      </div>
                    )}
                    <h1 className="text-2xl font-black font-serif text-stone-900 leading-tight mb-4">
                      {selectedMsg.subject}
                    </h1>
                    <div className="flex items-start gap-3 pb-5 border-b-2 border-stone-200">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0 ${avatarColor(activeFolder === "sent" ? (selectedMsg.toName || "") : (selectedMsg.from || ""))}`}>
                        {(activeFolder === "sent" ? (selectedMsg.toName || "?") : (selectedMsg.from || "?"))[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-stone-900 text-sm">
                            {activeFolder === "sent" ? `À : ${selectedMsg.toName || "Inconnu"}` : selectedMsg.from}
                          </span>
                          <span className="text-stone-400 text-xs">·</span>
                          <span className="text-stone-500 text-xs font-mono">{selectedMsg.date}</span>
                        </div>
                        {selectedMsg.cc?.length > 0 && (
                          <div className="text-xs text-stone-500 mt-0.5">
                            CC : {selectedMsg.cc.map((id) => {
                              const u = safeUsers.find((x) => String(x.id) === String(id));
                              return u?.name || id;
                            }).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Corps */}
                  <div className="font-serif text-base text-stone-800 leading-relaxed whitespace-pre-wrap">
                    {selectedMsg.content}
                  </div>

                  {/* Boutons bas */}
                  {activeFolder !== "sent" && (
                    <div className="mt-10 pt-6 border-t border-stone-200 flex gap-3 flex-wrap">
                      <button onClick={() => handleReply(selectedMsg)}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-[#b8860b] rounded-lg text-xs font-black uppercase tracking-wide hover:bg-black transition-all">
                        <Reply size={13} /> Répondre
                      </button>
                      <button onClick={() => handleForward(selectedMsg)}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-black uppercase tracking-wide hover:bg-stone-200 transition-all">
                        <CornerUpRight size={13} /> Transférer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── RÉDACTION ── */}
          {isComposing && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Toolbar compose */}
              <div className="px-4 py-2.5 border-b border-stone-200 bg-white flex items-center gap-3 shrink-0">
                <button onClick={() => setIsComposing(false)} className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 text-xs font-bold">
                  <X size={15} /> Annuler
                </button>
                <span className="text-xs font-black uppercase tracking-widest text-stone-400 flex-1 text-center">Nouvelle missive</span>
                <button onClick={handleSend}
                  className="flex items-center gap-2 px-4 py-1.5 bg-stone-900 text-[#b8860b] rounded-lg text-xs font-black uppercase tracking-widest hover:bg-black transition-all">
                  <Send size={13} /> Envoyer
                </button>
              </div>

              {/* Formulaire */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Destinataire + CC */}
                  <div className="bg-white rounded-xl border border-stone-200 overflow-visible p-4 space-y-4">
                    <CitizenSelect users={users} value={draft.to} onChange={(id) => setDraft({ ...draft, to: id })} label="Destinataire" />
                    <CitizenSelect users={users} value={draft.cc} onChange={(ids) => setDraft({ ...draft, cc: ids })} isMulti label="Copie (CC)" />

                    {/* Objet */}
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1 block">Objet</label>
                      <input
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-semibold outline-none focus:border-[#b8860b] focus:bg-white transition-colors"
                        value={draft.subject}
                        onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                        placeholder="Sujet de la missive…"
                      />
                    </div>

                    {/* Sceau */}
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-2 block">Sceau</label>
                      <div className="flex flex-wrap gap-2">
                        {["NORMAL", "URGENT", "OFFICIAL", "SECRET"].map((seal) => {
                          const m = SEAL_META[seal];
                          return (
                            <button key={seal} onClick={() => setDraft({ ...draft, seal })}
                              className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg border transition-all ${
                                draft.seal === seal ? `${m.bg} ${m.text} border-transparent shadow-sm` : "bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400"
                              }`}>
                              {seal === "NORMAL" ? "Normal" : seal === "URGENT" ? "Urgent" : seal === "OFFICIAL" ? "Officiel" : "Secret"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Options avancées (collapsibles) */}
                  <details className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                    <summary className="px-4 py-3 cursor-pointer text-[10px] font-black uppercase tracking-widest text-stone-400 select-none hover:text-stone-600">
                      Options avancées (en-tête · signature)
                    </summary>
                    <div className="px-4 pb-4 space-y-3">
                      <div>
                        <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1 block">En-tête du document</label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-2.5 text-stone-400" size={13} />
                          <input className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-black uppercase tracking-widest outline-none focus:border-[#b8860b]"
                            value={draft.heading} onChange={(e) => setDraft({ ...draft, heading: e.target.value })} placeholder="Ex: ACTE DE CESSION" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1 block">Signature (alias)</label>
                        <input className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs outline-none focus:border-[#b8860b]"
                          value={draft.alias} onChange={(e) => setDraft({ ...draft, alias: e.target.value })} placeholder="Laisser vide pour votre nom…" />
                      </div>
                    </div>
                  </details>

                  {/* Zone de texte */}
                  <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                    <textarea
                      className="w-full p-4 font-serif text-stone-800 text-sm leading-relaxed resize-none outline-none bg-transparent min-h-[220px]"
                      placeholder="Rédigez votre missive ici…"
                      value={draft.content}
                      onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                    />
                    <div className="px-4 py-2 border-t border-stone-100 flex justify-between text-[10px] text-stone-400">
                      <span>{draft.content.length} caractère{draft.content.length !== 1 ? "s" : ""}</span>
                      {draft.content.length > 2000 && <span className="text-amber-600 font-bold">Message long</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── BOUTON ACTION (toolbar lecture) ───────────────────────────────────────── */
const ActionBtn = ({ onClick, children, title, active, activeClass = "", hoverClass = "hover:bg-stone-100 hover:text-stone-800" }) => (
  <button
    onClick={onClick}
    title={title}
    className={`w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 transition-all ${active ? activeClass : ""} ${hoverClass}`}
  >
    {children}
  </button>
);

export default PostView;
