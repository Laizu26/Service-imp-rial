import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Heart, MessageCircle, Send, Search, Trash2, ArrowLeft,
  X, Edit3, Hash, ImageIcon, AtSign, Plus,
} from "lucide-react";
import { ROLES } from "../../lib/constants";

/* ── helpers ─────────────────────────────────────────────────────────────── */

const AVATAR_COLORS = [
  "bg-rose-600", "bg-violet-600", "bg-blue-600", "bg-emerald-600",
  "bg-amber-600", "bg-pink-600", "bg-cyan-600", "bg-indigo-600",
];
const avatarBg = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const Ava = ({ citizen, size = "md", className = "" }) => {
  const name = citizen?.name || "?";
  const emoji = citizen?.mushtagramAvatar;
  const sizeMap = { sm: "w-7 h-7 text-sm", md: "w-10 h-10 text-base", lg: "w-14 h-14 text-2xl" };
  return (
    <div className={`${sizeMap[size]} rounded-full flex items-center justify-center shrink-0 overflow-hidden ${emoji ? "bg-stone-100 text-lg" : `${avatarBg(name)} text-white font-black text-xs`} ${className}`}>
      {emoji || name[0]?.toUpperCase()}
    </div>
  );
};

/* ── composant principal ─────────────────────────────────────────────────── */

export default function MushtagramView({
  session, citizens = [],
  mushtagramPosts = [], mushtagramDMs = [],
  onPostMushtagram, onDeleteMushtagramPost,
  onToggleMushtagramLike, onAddMushtagramComment, onDeleteMushtagramComment,
  onUpdateMushtagramProfile, onSendMushtagramDM, onMarkMushtagramDMsRead,
  notify,
}) {
  const [tab, setTab] = useState("feed");

  // Feed
  const [postContent, setPostContent]   = useState("");
  const [postImage, setPostImage]       = useState("");
  const [showImgInput, setShowImgInput] = useState(false);
  const [search, setSearch]             = useState("");
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInput, setCommentInput] = useState({});

  // Messages
  const [selConv, setSelConv]       = useState(null);
  const [dmInput, setDmInput]       = useState("");
  const [dmSearch, setDmSearch]     = useState("");
  const messagesEndRef               = useRef(null);

  // Profil
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft]     = useState({ bio: "", avatar: "", handle: "", banner: "", photo: "" });

  const myId      = String(session?.id ?? "");
  const myCitizen = useMemo(() => citizens.find(c => String(c.id) === myId) || session, [citizens, myId, session]);
  const myRole    = ROLES[session?.role];
  const isAdmin   = (myRole?.level ?? 0) >= 90;

  /* ── feed ────────────────────────────────────────────────────────────── */
  const sortedPosts = useMemo(() =>
    [...mushtagramPosts].sort((a, b) => b.timestamp - a.timestamp),
  [mushtagramPosts]);

  const filteredPosts = useMemo(() => {
    if (!search) return sortedPosts;
    const q = search.toLowerCase();
    return sortedPosts.filter(p =>
      p.content?.toLowerCase().includes(q) ||
      p.authorName?.toLowerCase().includes(q) ||
      (p.hashtags || []).some(h => h.toLowerCase().includes(q))
    );
  }, [sortedPosts, search]);

  const submitPost = () => {
    if (!postContent.trim()) return;
    const hashtags = [...new Set((postContent.match(/#[\wÀ-ɏ]+/g) || []).map(h => h.toLowerCase().slice(1)))];
    onPostMushtagram({ content: postContent.trim(), imageUrl: postImage.trim(), hashtags });
    setPostContent(""); setPostImage(""); setShowImgInput(false);
    notify("Publication envoyée !", "success");
  };

  /* ── messages ────────────────────────────────────────────────────────── */
  const myDMs = useMemo(() =>
    mushtagramDMs.filter(d => String(d.fromId) === myId || String(d.toId) === myId),
  [mushtagramDMs, myId]);

  const conversations = useMemo(() => {
    const map = {};
    myDMs.forEach(dm => {
      const otherId   = String(dm.fromId) === myId ? String(dm.toId)   : String(dm.fromId);
      const otherName = String(dm.fromId) === myId ?       dm.toName   :       dm.fromName;
      if (!map[otherId]) map[otherId] = { id: otherId, name: otherName, messages: [], unread: 0 };
      map[otherId].messages.push(dm);
      if (!dm.read && String(dm.toId) === myId) map[otherId].unread++;
    });
    return Object.values(map).sort((a, b) => {
      const la = a.messages.at(-1)?.timestamp ?? 0;
      const lb = b.messages.at(-1)?.timestamp ?? 0;
      return lb - la;
    });
  }, [myDMs, myId]);

  const convMessages = useMemo(() => {
    if (!selConv) return [];
    return myDMs
      .filter(d => String(d.fromId) === selConv || String(d.toId) === selConv)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [myDMs, selConv]);

  const totalUnread = useMemo(() => conversations.reduce((s, c) => s + c.unread, 0), [conversations]);

  const openConversation = (id) => {
    setSelConv(id);
    const unreadIds = myDMs.filter(d => String(d.fromId) === id && !d.read).map(d => d.id);
    if (unreadIds.length > 0 && onMarkMushtagramDMsRead) onMarkMushtagramDMsRead(id);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages.length]);

  const sendDM = () => {
    if (!dmInput.trim() || !selConv) return;
    onSendMushtagramDM({ toId: selConv, content: dmInput.trim() });
    setDmInput("");
  };

  /* ── profil ──────────────────────────────────────────────────────────── */
  const startEdit = () => {
    setProfileDraft({
      bio:    myCitizen?.mushtagramBio     || "",
      avatar: myCitizen?.mushtagramAvatar  || "",
      handle: myCitizen?.mushtagramHandle  || "",
      banner: myCitizen?.mushtagramBanner  || "",
      photo:  myCitizen?.mushtagramPhoto   || "",
    });
    setEditingProfile(true);
  };

  const saveProfile = () => {
    onUpdateMushtagramProfile(profileDraft);
    setEditingProfile(false);
    notify("Profil mis à jour.", "success");
  };

  const myPosts = useMemo(() => sortedPosts.filter(p => String(p.authorId) === myId), [sortedPosts, myId]);

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">

      {/* ─ En-tête ─ */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center shrink-0">
          <Hash size={18} className="text-white" strokeWidth={3} />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-white">Mushtagram</h1>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest">Réseau social de l'Empire</p>
        </div>
      </div>

      {/* ─ Onglets ─ */}
      <div className="flex gap-1 bg-stone-200 rounded-xl p-1">
        {[
          { id: "feed",     label: "Fil" },
          { id: "messages", label: "Messages", badge: totalUnread },
          { id: "profile",  label: "Profil" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tab === t.id ? "bg-white text-stone-900 shadow-md" : "text-stone-500 hover:text-stone-800"}`}>
            {t.label}
            {t.badge > 0 && (
              <span className="bg-rose-600 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════ FIL ══════════════════════ */}
      {tab === "feed" && (
        <div className="space-y-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une publication…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-300/30 focus:border-rose-300" />
          </div>

          {/* Rédaction */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
            <div className="flex gap-3">
              <Ava citizen={myCitizen} size="md" />
              <div className="flex-1 space-y-2">
                <textarea value={postContent} onChange={e => setPostContent(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) submitPost(); }}
                  placeholder="Partagez quelque chose avec l'Empire… (Ctrl+Entrée pour publier)"
                  rows={3}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 resize-none outline-none focus:ring-2 focus:ring-rose-300/30 focus:bg-white transition-all" />
                {showImgInput && (
                  <div className="flex items-center gap-2">
                    <ImageIcon size={13} className="text-stone-400 shrink-0" />
                    <input value={postImage} onChange={e => setPostImage(e.target.value)}
                      placeholder="URL de l'image…"
                      className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 text-stone-900 placeholder:text-stone-400 outline-none focus:border-rose-300" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <button onClick={() => setShowImgInput(v => !v)}
                    className={`flex items-center gap-1 text-xs font-bold transition-all ${showImgInput ? "text-rose-500" : "text-stone-400 hover:text-rose-400"}`}>
                    <ImageIcon size={13} /> Image
                  </button>
                  <button onClick={submitPost} disabled={!postContent.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-rose-500 to-violet-600 text-white text-xs font-black rounded-lg hover:opacity-90 disabled:opacity-40 transition-all">
                    <Send size={11} /> Publier
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-14 text-stone-400 italic">Aucune publication pour l'instant</div>
          ) : filteredPosts.map(post => {
            const isLiked      = (post.likes || []).includes(myId);
            const author       = citizens.find(c => String(c.id) === String(post.authorId));
            const canDelete    = String(post.authorId) === myId || isAdmin;
            const showCmt      = expandedComments[post.id];
            const cmtCount     = (post.comments || []).length;
            const likeCount    = (post.likes || []).length;

            return (
              <div key={post.id} className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                {/* En-tête post */}
                <div className="flex items-start gap-3 p-4 pb-2">
                  <Ava citizen={author || { name: post.authorName }} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-sm font-black text-stone-900">{post.authorName}</span>
                      {(author?.mushtagramHandle) && (
                        <span className="text-[10px] text-stone-400">@{author.mushtagramHandle}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-400">{post.rpDate || ""}</div>
                  </div>
                  {canDelete && (
                    <button onClick={() => onDeleteMushtagramPost(post.id)}
                      className="p-1 rounded hover:bg-red-50 text-stone-300 hover:text-red-500 transition-all shrink-0">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Contenu */}
                <div className="px-4 pb-3">
                  <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  {(post.hashtags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {post.hashtags.map(h => (
                        <span key={h} className="text-[10px] text-violet-600 font-bold hover:underline cursor-pointer"
                          onClick={() => setSearch(h)}>#{h}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image */}
                {post.imageUrl && (
                  <div className="mx-4 mb-3 rounded-xl overflow-hidden border border-stone-100">
                    <img src={post.imageUrl} alt=""
                      className="w-full max-h-72 object-cover"
                      onError={e => { e.target.style.display = "none"; }} />
                  </div>
                )}

                {/* Barre actions */}
                <div className="px-4 py-2 border-t border-stone-100 flex items-center gap-5">
                  <button onClick={() => onToggleMushtagramLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-all ${isLiked ? "text-rose-500" : "text-stone-400 hover:text-rose-400"}`}>
                    <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                    {likeCount > 0 && <span>{likeCount}</span>}
                  </button>
                  <button onClick={() => setExpandedComments(p => ({ ...p, [post.id]: !p[post.id] }))}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-all ${showCmt ? "text-blue-500" : "text-stone-400 hover:text-blue-400"}`}>
                    <MessageCircle size={14} />
                    {cmtCount > 0 && <span>{cmtCount}</span>}
                  </button>
                </div>

                {/* Commentaires */}
                {showCmt && (
                  <div className="px-4 pb-4 space-y-2 border-t border-stone-100">
                    {(post.comments || []).map(c => {
                      const cAuthor = citizens.find(x => String(x.id) === String(c.authorId));
                      const canDelCmt = String(c.authorId) === myId || isAdmin;
                      return (
                        <div key={c.id} className="flex items-start gap-2 pt-2">
                          <Ava citizen={cAuthor || { name: c.authorName }} size="sm" />
                          <div className="flex-1 bg-stone-50 rounded-2xl rounded-tl-sm px-3 py-2">
                            <span className="text-[10px] font-black text-stone-600">{c.authorName} </span>
                            <span className="text-[11px] text-stone-700">{c.content}</span>
                          </div>
                          {canDelCmt && (
                            <button onClick={() => onDeleteMushtagramComment(post.id, c.id)}
                              className="p-0.5 rounded hover:bg-red-50 text-stone-300 hover:text-red-400 transition-all shrink-0 mt-2">
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <div className="flex gap-2 pt-1">
                      <Ava citizen={myCitizen} size="sm" />
                      <div className="flex-1 flex gap-1.5">
                        <input
                          value={commentInput[post.id] || ""}
                          onChange={e => setCommentInput(p => ({ ...p, [post.id]: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === "Enter" && commentInput[post.id]?.trim()) {
                              onAddMushtagramComment(post.id, commentInput[post.id].trim());
                              setCommentInput(p => ({ ...p, [post.id]: "" }));
                            }
                          }}
                          placeholder="Ajouter un commentaire… (Entrée)"
                          className="flex-1 px-3 py-1.5 bg-stone-100 rounded-full text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:bg-white focus:ring-2 focus:ring-stone-200 transition-all" />
                        <button
                          onClick={() => {
                            if (commentInput[post.id]?.trim()) {
                              onAddMushtagramComment(post.id, commentInput[post.id].trim());
                              setCommentInput(p => ({ ...p, [post.id]: "" }));
                            }
                          }}
                          disabled={!commentInput[post.id]?.trim()}
                          className="p-1.5 rounded-full bg-gradient-to-r from-rose-500 to-violet-600 text-white hover:opacity-90 disabled:opacity-40 transition-all">
                          <Send size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════ MESSAGES ══════════════════════ */}
      {tab === "messages" && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden" style={{ minHeight: 520 }}>
          {selConv ? (
            <div className="flex flex-col" style={{ minHeight: 520 }}>
              {/* Header conversation */}
              {(() => {
                const other = citizens.find(c => String(c.id) === selConv) || { name: conversations.find(c => c.id === selConv)?.name || "?" };
                return (
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 shrink-0">
                    <button onClick={() => setSelConv(null)}
                      className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-all">
                      <ArrowLeft size={16} />
                    </button>
                    <Ava citizen={other} size="sm" />
                    <div>
                      <div className="text-sm font-black text-stone-900">{other.name}</div>
                      {other.mushtagramHandle && <div className="text-[9px] text-stone-400">@{other.mushtagramHandle}</div>}
                    </div>
                  </div>
                );
              })()}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ maxHeight: 380 }}>
                {convMessages.length === 0 && (
                  <div className="text-center text-stone-400 italic text-sm py-8">Commencez la conversation !</div>
                )}
                {convMessages.map(dm => {
                  const isMine = String(dm.fromId) === myId;
                  const author = isMine
                    ? (myCitizen || session)
                    : (citizens.find(c => String(c.id) === String(dm.fromId)) || { name: dm.fromName || "?" });
                  return (
                    <div key={dm.id} className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                      {!isMine && <Ava citizen={author} size="sm" className="shrink-0 mb-0.5" />}
                      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[72%]`}>
                        <span className="text-[10px] font-bold text-stone-400 px-1 mb-0.5">
                          {isMine ? "Vous" : author.name}
                        </span>
                        <div className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          isMine
                            ? "bg-gradient-to-r from-rose-500 to-violet-600 text-white rounded-br-sm"
                            : "bg-stone-100 text-stone-800 rounded-bl-sm"
                        }`}>
                          {dm.content}
                        </div>
                      </div>
                      {isMine && <Ava citizen={author} size="sm" className="shrink-0 mb-0.5" />}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Saisie */}
              <div className="p-3 border-t border-stone-100 flex gap-2 shrink-0">
                <input value={dmInput} onChange={e => setDmInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendDM()}
                  placeholder="Votre message…"
                  className="flex-1 px-4 py-2 bg-stone-100 rounded-full text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rose-300/30 transition-all" />
                <button onClick={sendDM} disabled={!dmInput.trim()}
                  className="p-2.5 rounded-full bg-gradient-to-r from-rose-500 to-violet-600 text-white hover:opacity-90 disabled:opacity-40 transition-all">
                  <Send size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Chercher / Nouvelle conversation */}
              <div className="p-4 border-b border-stone-100 space-y-1">
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-2">Nouvelle conversation</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={12} />
                  <input value={dmSearch} onChange={e => setDmSearch(e.target.value)}
                    placeholder="Chercher un citoyen…"
                    className="w-full pl-8 pr-4 py-2 bg-stone-100 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-200/40" />
                </div>
                {dmSearch && (
                  <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-lg max-h-36 overflow-y-auto mt-1">
                    {citizens
                      .filter(c => String(c.id) !== myId && c.name?.toLowerCase().includes(dmSearch.toLowerCase()))
                      .slice(0, 7)
                      .map(c => (
                        <button key={c.id}
                          onClick={() => { openConversation(String(c.id)); setDmSearch(""); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 text-left transition-colors border-b border-stone-50">
                          <Ava citizen={c} size="sm" />
                          <div>
                            <div className="text-sm font-semibold text-stone-800">{c.name}</div>
                            {c.mushtagramHandle && <div className="text-[9px] text-stone-400">@{c.mushtagramHandle}</div>}
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Liste conversations */}
              {conversations.length === 0 ? (
                <div className="text-center py-14 text-stone-400 italic text-sm">Aucune conversation — cherchez un citoyen ci-dessus</div>
              ) : conversations.map(conv => {
                const other = citizens.find(c => String(c.id) === conv.id);
                const lastMsg = conv.messages.at(-1);
                return (
                  <button key={conv.id} onClick={() => openConversation(conv.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-stone-50 hover:bg-stone-50 transition-colors text-left">
                    <Ava citizen={other || { name: conv.name }} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate ${conv.unread > 0 ? "font-black text-stone-900" : "font-semibold text-stone-700"}`}>
                          {conv.name}
                        </span>
                        {conv.unread > 0 && (
                          <span className="ml-2 w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shrink-0">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400 truncate">{lastMsg?.content || ""}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ PROFIL ══════════════════════ */}
      {tab === "profile" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Bannière + avatar superposé */}
            <div className="relative h-32">
              {myCitizen?.mushtagramBanner ? (
                <img src={myCitizen.mushtagramBanner} alt="bannière"
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = "none"; e.target.parentNode.classList.add("bg-gradient-to-r","from-rose-400","via-purple-500","to-violet-600"); }} />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-rose-400 via-purple-500 to-violet-600" />
              )}
              {/* Avatar positionné en absolu sur la bannière */}
              <div className="absolute -bottom-10 left-5 w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center bg-stone-100 text-3xl z-10">
                {myCitizen?.mushtagramPhoto ? (
                  <img src={myCitizen.mushtagramPhoto} alt="avatar"
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = "none"; }} />
                ) : myCitizen?.mushtagramAvatar ? (
                  <span>{myCitizen.mushtagramAvatar}</span>
                ) : (
                  <div className={`w-full h-full flex items-center justify-center font-black text-white text-2xl ${avatarBg(myCitizen?.name || "")}`}>
                    {(myCitizen?.name || "?")[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 pb-5 pt-12">
              {/* Bouton modifier */}
              <div className="flex justify-end mb-3">
                {!editingProfile && (
                  <button onClick={startEdit}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 to-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-wide hover:opacity-90 shadow transition-all">
                    <Edit3 size={12} /> Modifier le profil
                  </button>
                )}
              </div>

              {editingProfile ? (
                <div className="space-y-3 mt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-1">
                        <ImageIcon size={8} className="inline mr-0.5" /> Photo de profil (URL)
                      </label>
                      <input value={profileDraft.photo} onChange={e => setProfileDraft(p => ({ ...p, photo: e.target.value }))}
                        placeholder="https://…"
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:border-rose-300" />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-1">
                        Avatar emoji (si pas de photo)
                      </label>
                      <input value={profileDraft.avatar} onChange={e => setProfileDraft(p => ({ ...p, avatar: e.target.value }))}
                        placeholder="🏰 🌹 ⚔️ 🦁…"
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-base text-stone-900 placeholder:text-stone-400 outline-none focus:border-rose-300" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-1">
                      <ImageIcon size={8} className="inline mr-0.5" /> Bannière (URL image)
                    </label>
                    <input value={profileDraft.banner} onChange={e => setProfileDraft(p => ({ ...p, banner: e.target.value }))}
                      placeholder="https://…"
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:border-rose-300" />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-1">
                      <AtSign size={8} className="inline mr-0.5" /> Identifiant
                    </label>
                    <input value={profileDraft.handle}
                      onChange={e => setProfileDraft(p => ({ ...p, handle: e.target.value.replace(/[^a-zA-Z0-9_À-ɏ]/g, "").toLowerCase() }))}
                      placeholder="mon_identifiant"
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-rose-300" />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-1">
                      Biographie
                    </label>
                    <textarea value={profileDraft.bio} onChange={e => setProfileDraft(p => ({ ...p, bio: e.target.value }))}
                      rows={3} placeholder="Présentez-vous en quelques mots…"
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 resize-none text-stone-900 placeholder:text-stone-400 outline-none focus:border-rose-300" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditingProfile(false)}
                      className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-all border border-stone-200">
                      Annuler
                    </button>
                    <button onClick={saveProfile}
                      className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-violet-600 text-white text-xs font-black rounded-xl hover:opacity-90 shadow transition-all">
                      Sauvegarder
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-black text-stone-900">{myCitizen?.name}</h2>
                  {myCitizen?.mushtagramHandle && (
                    <p className="text-sm text-stone-400">@{myCitizen.mushtagramHandle}</p>
                  )}
                  {myCitizen?.mushtagramBio ? (
                    <p className="text-sm text-stone-600 mt-2 leading-relaxed">{myCitizen.mushtagramBio}</p>
                  ) : (
                    <p className="text-xs text-stone-400 italic mt-2">Aucune biographie — cliquez sur "Modifier le profil"</p>
                  )}
                  <div className="flex gap-4 mt-3">
                    <span className="text-xs text-stone-500">
                      <strong className="text-stone-800">{myPosts.length}</strong> publication{myPosts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mes publications */}
          {myPosts.length > 0 && (
            <div className="space-y-3">
              <div className="text-[9px] font-black uppercase tracking-widest text-stone-500">Mes publications</div>
              {myPosts.map(post => (
                <div key={post.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-stone-800 leading-relaxed">{post.content}</p>
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt="" className="mt-2 rounded-lg max-h-32 object-cover"
                      onError={e => { e.target.style.display = "none"; }} />
                  )}
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-stone-400">
                    <span>❤ {(post.likes || []).length}</span>
                    <span>💬 {(post.comments || []).length}</span>
                    <span className="ml-auto">{post.rpDate || ""}</span>
                    <button onClick={() => onDeleteMushtagramPost(post.id)}
                      className="text-stone-300 hover:text-red-400 transition-all">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
