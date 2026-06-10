import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Heart, MessageCircle, Send, Search, Trash2, ArrowLeft,
  X, Edit3, Hash, ImageIcon, AtSign, Plus, Flag, Repeat2,
  UserPlus, UserMinus, VolumeX, Crown, BarChart2, TrendingUp, Pin, Lock, Settings, Bell,
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

const AVA_PX = { xs: 20, sm: 28, md: 40, lg: 56, xl: 80 };
const AVA_TEXT = { xs: "9px", sm: "13px", md: "14px", lg: "22px", xl: "28px" };

const Ava = ({ citizen, size = "md", className = "", onClick }) => {
  const name  = citizen?.name || "?";
  const photo = citizen?.mushtagramPhoto;
  const emoji = citizen?.mushtagramAvatar;
  const px    = AVA_PX[size] || 40;
  return (
    <div
      onClick={onClick}
      style={{ width: px, height: px, minWidth: px, minHeight: px, fontSize: AVA_TEXT[size] }}
      className={`rounded-full flex items-center justify-center overflow-hidden
        ${!photo && !emoji ? `${avatarBg(name)} text-white font-black` : "bg-stone-100"}
        ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
        ${className}`}
    >
      {photo ? (
        <img src={photo} alt={name} style={{ width: px, height: px, objectFit: "cover" }}
          onError={e => { e.target.style.display = "none"; }} />
      ) : emoji ? (
        <span style={{ lineHeight: 1 }}>{emoji}</span>
      ) : (
        name[0]?.toUpperCase()
      )}
    </div>
  );
};

const REACTION_EMOJIS = ["❤", "👑", "🗡️", "🔥", "😮"];

/* ── ProfileModal ───────────────────────────────────────────────────────── */

function ProfileModal({ citizen, myId, myFollowing, posts, citizens, onFollow, onUnfollow, onClose, onOpenDM }) {
  if (!citizen) return null;
  const citizenId = String(citizen.id);
  const isMe = citizenId === myId;
  const isFollowing = (myFollowing || []).includes(citizenId);
  const citizenPosts = (posts || []).filter(p => String(p.authorId) === citizenId)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 10);
  const followerCount = (citizens || []).filter(c => (c.mushtagramFollowing||[]).map(String).includes(citizenId)).length;
  const followingCount = (citizen.mushtagramFollowing||[]).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        {/* Banner */}
        <div className="relative h-28 shrink-0">
          {citizen.mushtagramBanner ? (
            <img src={citizen.mushtagramBanner} alt="" className="w-full h-full object-cover"
              onError={e => { e.target.style.display = "none"; e.target.parentNode.classList.add("bg-gradient-to-r","from-rose-400","via-purple-500","to-violet-600"); }} />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-rose-400 via-purple-500 to-violet-600" />
          )}
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/30 rounded-full p-1 text-white hover:bg-black/50 transition-all">
            <X size={14} />
          </button>
          <div className="absolute -bottom-8 left-4 w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden">
            {citizen.mushtagramPhoto ? (
              <img src={citizen.mushtagramPhoto} alt="" className="w-full h-full object-cover"
                onError={e => { e.target.style.display = "none"; }} />
            ) : citizen.mushtagramAvatar ? (
              <div className="w-full h-full flex items-center justify-center bg-stone-100 text-2xl">
                {citizen.mushtagramAvatar}
              </div>
            ) : (
              <div className={`w-full h-full flex items-center justify-center font-black text-white text-xl ${avatarBg(citizen.name || "")}`}>
                {(citizen.name || "?")[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pt-10 pb-3 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-base font-black text-stone-900">{citizen.name}</div>
              {citizen.mushtagramHandle && (
                <div className="text-xs text-stone-400">@{citizen.mushtagramHandle}</div>
              )}
            </div>
            {!isMe && (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => isFollowing ? onUnfollow(citizenId) : onFollow(citizenId)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${isFollowing ? "bg-stone-100 text-stone-600 hover:bg-red-50 hover:text-red-500" : "bg-gradient-to-r from-rose-500 to-violet-600 text-white hover:opacity-90"}`}>
                  {isFollowing ? <><UserMinus size={11} /> Suivi</> : <><UserPlus size={11} /> Suivre</>}
                </button>
                {onOpenDM && (
                  <button onClick={() => onOpenDM(citizenId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all">
                    <MessageCircle size={11} /> Message
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {citizen.mushtagramPublicPersonality === true || citizen.mushtagramPublicPersonality === "approved" ? (
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-300 rounded-full px-2 py-0.5">
                <Crown size={9} /> Personnalité Publique
              </span>
            ) : null}
            {citizen.mushtagramPrivate ? (
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-300 rounded-full px-2 py-0.5">
                <Lock size={9} /> Compte Privé
              </span>
            ) : null}
          </div>
          {citizen.mushtagramBio && (
            <p className="text-sm text-stone-600 mt-2 leading-relaxed whitespace-pre-wrap">{citizen.mushtagramBio}</p>
          )}
          <div className="flex gap-4 mt-2 flex-wrap text-xs text-stone-400">
            <span><strong className="text-stone-700">{citizenPosts.length}</strong> publication{citizenPosts.length !== 1 ? "s" : ""}</span>
            <span><strong className="text-stone-700">{followerCount}</strong> abonné{followerCount !== 1 ? "s" : ""}</span>
            <span><strong className="text-stone-700">{followingCount}</strong> abonnement{followingCount !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Posts list */}
        <div className="overflow-y-auto flex-1 border-t border-stone-100 divide-y divide-stone-50">
          {citizenPosts.length === 0 ? (
            <div className="text-center text-stone-400 italic text-sm py-8">Aucune publication</div>
          ) : citizenPosts.map(p => (
            <div key={p.id} className="px-4 py-3">
              {p.isOfficial && (
                <div className="flex items-center gap-1 text-amber-600 text-[9px] font-black uppercase mb-1">
                  <Crown size={10} /> Proclamation Officielle
                </div>
              )}
              <p className="text-xs text-stone-700 leading-relaxed">{p.content || (p.repostOf ? `(Republication de ${p.repostOf.authorName})` : "")}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[9px] text-stone-400">
                <span>❤ {(p.likes||[]).length}</span>
                <span>💬 {(p.comments||[]).length}</span>
                <span className="ml-auto">{p.rpDate || p.date || ""}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── StoryViewer ────────────────────────────────────────────────────────── */

function StoryViewer({ story, myId, isAdmin, citizens, onDelete, onLike, onClose }) {
  if (!story) return null;
  const canDelete = String(story.authorId) === myId || isAdmin;
  const author = (citizens || []).find(c => String(c.id) === String(story.authorId));
  const isLiked = (story.likes || []).map(String).includes(myId);
  const likeCount = (story.likes || []).length;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}>
      {/* Story card — portrait 9:16, up to 90vh tall */}
      <div
        className="relative bg-stone-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          height: "min(90vh, 90vw * 16 / 9)",
          width: "min(calc(90vh * 9 / 16), min(420px, 92vw))",
        }}
        onClick={e => e.stopPropagation()}>

        {/* Progress bar (decorative) */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-stone-700 z-10">
          <div className="h-full bg-white/80 w-full" />
        </div>

        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 pt-3 pb-8"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" }}>
          <Ava citizen={author || { name: story.authorName }} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-white drop-shadow">{story.authorName}</div>
            <div className="text-[9px] text-white/60">{story.date || ""}</div>
          </div>
          <div className="flex items-center gap-1">
            {canDelete && (
              <button onClick={() => { onDelete(story.id); onClose(); }}
                className="p-1.5 rounded-full bg-black/30 text-white/70 hover:text-red-400 transition-all">
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={onClose}
              className="p-1.5 rounded-full bg-black/30 text-white/70 hover:text-white transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Image — fills entire card */}
        {story.imageUrl ? (
          <img src={story.imageUrl} alt=""
            className="absolute inset-0 w-full h-full object-contain"
            onError={e => { e.target.style.display = "none"; }} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rose-900 via-stone-900 to-violet-900" />
        )}

        {/* Bottom overlay: text + like */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pt-16 pb-5"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.80) 0%, transparent 100%)" }}>
          {story.content && (
            <p className="text-white text-base leading-relaxed whitespace-pre-wrap drop-shadow-lg font-medium mb-4">
              {story.content}
            </p>
          )}
          {/* Like button */}
          <div className="flex items-center justify-end">
            <button
              onClick={() => onLike && onLike(story.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm transition-all ${
                isLiked
                  ? "bg-rose-500/80 text-white"
                  : "bg-black/30 text-white/70 hover:bg-rose-500/60 hover:text-white"
              }`}>
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              {likeCount > 0 && <span className="text-sm font-black">{likeCount}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Click hint */}
      <p className="absolute bottom-4 text-white/30 text-xs">Cliquez en dehors pour fermer</p>
    </div>
  );
}

/* ── StoriesBar ─────────────────────────────────────────────────────────── */

function StoriesBar({ stories, myId, myCitizen, isAdmin, citizens, onPostStory, onDeleteStory, onLikeStory }) {
  const [composing, setComposing] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [storyImage, setStoryImage] = useState("");
  const [viewing, setViewing] = useState(null);

  const activeStories = (stories || []).filter(s => (s.createdAt || 0) + 86_400_000 > Date.now());

  const submitStory = () => {
    if (!storyText.trim() && !storyImage.trim()) return;
    onPostStory({ content: storyText.trim(), imageUrl: storyImage.trim() || null });
    setStoryText(""); setStoryImage(""); setComposing(false);
  };

  return (
    <>
      <div className="bg-white border border-stone-200 rounded-2xl p-3 shadow-sm overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {/* My story slot */}
          <button onClick={() => setComposing(true)}
            className="flex flex-col items-center gap-1.5 group">
            <div className="relative">
              <Ava citizen={myCitizen} size="lg" className="ring-2 ring-stone-200 group-hover:ring-rose-400 transition-all" />
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-r from-rose-500 to-violet-600 flex items-center justify-center border-2 border-white">
                <Plus size={9} className="text-white" strokeWidth={3} />
              </div>
            </div>
            <span className="text-[9px] font-bold text-stone-400 group-hover:text-stone-600 transition-all max-w-[60px] truncate">Votre story</span>
          </button>

          {/* Active stories */}
          {activeStories.map(story => {
            const author = citizens.find(c => String(c.id) === String(story.authorId)) || { name: story.authorName };
            return (
              <button key={story.id} onClick={() => setViewing(story)}
                className="flex flex-col items-center gap-1.5 group">
                <div className="relative">
                  <Ava citizen={author} size="lg"
                    className="ring-2 ring-rose-400 ring-offset-2 group-hover:ring-violet-500 transition-all" />
                </div>
                <span className="text-[9px] font-bold text-stone-500 group-hover:text-stone-700 transition-all max-w-[60px] truncate">{story.authorName}</span>
              </button>
            );
          })}

          {activeStories.length === 0 && (
            <div className="flex items-center pl-2 text-xs text-stone-400 italic">Aucune story active</div>
          )}
        </div>
      </div>

      {/* Compose overlay */}
      {composing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setComposing(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm space-y-3"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">Nouvelle Story</h3>
              <button onClick={() => setComposing(false)}><X size={16} className="text-stone-400" /></button>
            </div>
            <textarea value={storyText} onChange={e => setStoryText(e.target.value)}
              rows={3} placeholder="Partagez un moment éphémère…"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 resize-none outline-none focus:ring-2 focus:ring-rose-300/30 focus:bg-white" />
            <input value={storyImage} onChange={e => setStoryImage(e.target.value)}
              placeholder="URL image (optionnel)"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:border-rose-300" />
            <button onClick={submitStory} disabled={!storyText.trim() && !storyImage.trim()}
              className="w-full py-2 bg-gradient-to-r from-rose-500 to-violet-600 text-white text-xs font-black rounded-xl hover:opacity-90 disabled:opacity-40 transition-all">
              Publier la Story
            </button>
          </div>
        </div>
      )}

      {/* Story viewer */}
      {viewing && (() => {
        const liveStory = activeStories.find(s => s.id === viewing.id) || viewing;
        return (
          <StoryViewer
            story={liveStory}
            myId={myId}
            isAdmin={isAdmin}
            citizens={citizens}
            onDelete={onDeleteStory}
            onLike={onLikeStory}
            onClose={() => setViewing(null)}
          />
        );
      })()}
    </>
  );
}

/* ── ReactionPicker ─────────────────────────────────────────────────────── */

function ReactionPicker({ postId, reactions, myId, onReact }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Find my current reaction
  const myReaction = REACTION_EMOJIS.find(e => ((reactions || {})[e] || []).includes(myId));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1 text-xs font-bold transition-all ${myReaction ? "text-rose-500" : "text-stone-400 hover:text-rose-400"}`}>
        {myReaction ? <span className="text-sm">{myReaction}</span> : <Heart size={14} />}
        {Object.values(reactions || {}).reduce((s, arr) => s + (arr || []).length, 0) > 0 && (
          <span>{Object.values(reactions || {}).reduce((s, arr) => s + (arr || []).length, 0)}</span>
        )}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 bg-white border border-stone-200 rounded-2xl shadow-xl p-2 flex gap-1 z-20">
          {REACTION_EMOJIS.map(e => {
            const count = ((reactions || {})[e] || []).length;
            const isSelected = ((reactions || {})[e] || []).includes(myId);
            return (
              <button key={e}
                onClick={() => { onReact(postId, e); setOpen(false); }}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-lg transition-all hover:bg-stone-100 ${isSelected ? "ring-2 ring-rose-400 bg-rose-50" : ""}`}>
                <span>{e}</span>
                {count > 0 && <span className="text-[8px] text-stone-500 font-bold">{count}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── PollDisplay ────────────────────────────────────────────────────────── */

function PollDisplay({ poll, postId, myId, onVote }) {
  if (!poll?.options) return null;
  const totalVotes = poll.options.reduce((s, o) => s + (o.votes || []).length, 0);
  const myVoteIdx = poll.options.findIndex(o => (o.votes || []).includes(myId));

  return (
    <div className="mx-4 mb-3 space-y-2">
      {poll.question && <p className="text-xs font-bold text-stone-600">{poll.question}</p>}
      {poll.options.map((opt, i) => {
        const count = (opt.votes || []).length;
        const pct = totalVotes > 0 ? Math.round(count / totalVotes * 100) : 0;
        const isMyVote = myVoteIdx === i;
        return (
          <button key={i} onClick={() => onVote(postId, i)}
            className={`w-full relative rounded-xl border text-left overflow-hidden transition-all ${isMyVote ? "border-rose-400" : "border-stone-200 hover:border-stone-300"}`}>
            <div
              className={`absolute inset-y-0 left-0 ${isMyVote ? "bg-rose-100" : "bg-stone-100"} transition-all`}
              style={{ width: `${pct}%` }} />
            <div className="relative flex items-center justify-between px-3 py-2">
              <span className="text-xs font-bold text-stone-700">{opt.text}</span>
              <span className="text-[10px] text-stone-500 shrink-0 ml-2">{pct}% ({count})</span>
            </div>
          </button>
        );
      })}
      <div className="text-[9px] text-stone-400 text-right">{totalVotes} vote{totalVotes !== 1 ? "s" : ""} total</div>
    </div>
  );
}

/* ── PostCard ───────────────────────────────────────────────────────────── */

function PostCard({
  post, myId, isAdmin, citizens, myCitizen,
  myFollowing, mutedSet,
  expandedComments, commentInput,
  onDelete, onToggleLike, onAddComment, onDeleteComment, onLikeComment,
  onPinComment,
  onReact, onRepost, onVotePoll, onPin, onReport, onMute,
  onFollow, onUnfollow,
  onViewProfile,
  myRepostedIds,
  setExpandedComments, setCommentInput,
}) {
  const [replyingTo, setReplyingTo] = React.useState(null); // { commentId, authorName }
  const author = citizens.find(c => String(c.id) === String(post.authorId));
  const authorId = String(post.authorId);
  const isMe = authorId === myId;
  const canDelete = isMe || isAdmin;
  const isFollowing = (myFollowing || []).includes(authorId);
  const showCmt = expandedComments[post.id];
  const cmtCount = (post.comments || []).length;
  const likeCount = (post.likes || []).length;
  const isLiked = (post.likes || []).includes(myId);
  const isPinned = myCitizen?.mushtagramPinned === post.id;
  const isOfficial = !!post.isOfficial;
  const alreadyReposted = myRepostedIds?.has(post.id);

  if (mutedSet.has(authorId) && !isMe) return null;

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden ${isOfficial ? "border-2 border-amber-300" : "border border-stone-200"}`}>
      {/* Official banner */}
      {isOfficial && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200">
          <Crown size={13} className="text-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Proclamation Officielle</span>
        </div>
      )}

      {/* Repost banner */}
      {post.repostOf && (
        <div className="flex items-start gap-2 px-4 pt-3 pb-0">
          <Repeat2 size={12} className="text-stone-400 mt-0.5 shrink-0" />
          <div className="flex-1 bg-stone-50 rounded-xl px-3 py-2 border border-stone-100 space-y-1.5">
            <div className="text-[9px] font-black text-stone-500">Republication de {post.repostOf.authorName}</div>
            {post.repostOf.content && (
              <p className="text-xs text-stone-600 line-clamp-3">{post.repostOf.content}</p>
            )}
            {post.repostOf.imageUrl && (
              <div className="rounded-lg overflow-hidden border border-stone-200 bg-stone-100">
                <img src={post.repostOf.imageUrl} alt=""
                  className="w-full max-h-40 object-contain"
                  onError={e => { e.target.style.display = "none"; }} />
              </div>
            )}
            {post.repostOf.poll?.options && (
              <div className="space-y-1">
                {post.repostOf.poll.question && (
                  <p className="text-[10px] font-bold text-stone-500">{post.repostOf.poll.question}</p>
                )}
                {post.repostOf.poll.options.map((opt, i) => (
                  <div key={i} className="text-[10px] text-stone-500 bg-stone-100 rounded px-2 py-1">
                    {opt.text} · {(opt.votes || []).length} vote{(opt.votes || []).length !== 1 ? "s" : ""}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-2">
        <Ava citizen={author || { name: post.authorName }} size="md"
          onClick={() => onViewProfile(author || { name: post.authorName, id: post.authorId })} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <button onClick={() => onViewProfile(author || { name: post.authorName, id: post.authorId })}
              className="text-sm font-black text-stone-900 hover:text-rose-600 transition-colors">
              {post.authorName}
            </button>
            {author?.mushtagramPublicPersonality === "approved" && (
              <span title="Personnalité publique vérifiée" style={{color:"#3b82f6", fontSize:"0.75rem", marginLeft:"3px"}}>✓</span>
            )}
            {(author?.mushtagramHandle) && (
              <span className="text-[10px] text-stone-400">@{author.mushtagramHandle}</span>
            )}
            {post.followersOnly && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-violet-500 bg-violet-50 border border-violet-200 rounded-full px-1.5 py-0.5" title="Abonnés uniquement">
                <Lock size={8} /> Abonnés
              </span>
            )}
            {!isMe && !isFollowing && (
              <button onClick={() => onFollow(authorId)}
                className="text-[9px] font-black text-rose-500 hover:text-rose-700 transition-colors ml-1 flex items-center gap-0.5">
                <UserPlus size={9} /> Suivre
              </button>
            )}
          </div>
          {author?.mushtagramOfficialTitle && (
            <div className="text-[10px] text-stone-400 italic">{author.mushtagramOfficialTitle}</div>
          )}
          <div className="text-[10px] text-stone-400">{post.rpDate || post.date || ""}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isMe && (
            <button onClick={() => onPin(post.id)}
              title={isPinned ? "Désépingler" : "Épingler"}
              className={`p-1 rounded hover:bg-amber-50 transition-all ${isPinned ? "text-amber-500" : "text-stone-300 hover:text-amber-400"}`}>
              <Pin size={13} />
            </button>
          )}
          {!isMe && (
            <>
              <button onClick={() => onReport(post.id)}
                className="p-1 rounded hover:bg-red-50 text-stone-300 hover:text-red-400 transition-all"
                title="Signaler">
                <Flag size={13} />
              </button>
              <button onClick={() => onMute(authorId)}
                className="p-1 rounded hover:bg-stone-100 text-stone-300 hover:text-stone-500 transition-all"
                title="Silencer">
                <VolumeX size={13} />
              </button>
            </>
          )}
          {canDelete && (
            <button onClick={() => onDelete(post.id)}
              className="p-1 rounded hover:bg-red-50 text-stone-300 hover:text-red-500 transition-all">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-2">
          <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {/* Hashtags */}
      {(post.hashtags || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {post.hashtags.map(h => (
            <span key={h} className="text-[10px] text-violet-600 font-bold hover:underline cursor-pointer">#{h}</span>
          ))}
        </div>
      )}

      {/* Image */}
      {post.imageUrl && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden border border-stone-100 bg-stone-50">
          <img src={post.imageUrl} alt=""
            className="w-full max-h-[520px] object-contain"
            onError={e => { e.target.style.display = "none"; }} />
        </div>
      )}

      {/* Poll */}
      {post.poll && (
        <PollDisplay poll={post.poll} postId={post.id} myId={myId} onVote={onVotePoll} />
      )}

      {/* Actions bar */}
      <div className="px-4 py-2 border-t border-stone-100 flex items-center gap-4">
        <button onClick={() => onToggleLike(post.id)}
          className={`flex items-center gap-1.5 text-xs font-bold transition-all ${isLiked ? "text-rose-500" : "text-stone-400 hover:text-rose-400"}`}>
          <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button onClick={() => setExpandedComments(p => ({ ...p, [post.id]: !p[post.id] }))}
          className={`flex items-center gap-1.5 text-xs font-bold transition-all ${showCmt ? "text-blue-500" : "text-stone-400 hover:text-blue-400"}`}>
          <MessageCircle size={14} />
          {cmtCount > 0 && <span>{cmtCount}</span>}
        </button>
        <button onClick={() => !alreadyReposted && onRepost(post.id)}
          title={alreadyReposted ? "Déjà republié" : "Republier"}
          className={`flex items-center gap-1.5 text-xs font-bold transition-all ${alreadyReposted ? "text-emerald-500 cursor-default" : "text-stone-400 hover:text-emerald-500"}`}>
          <Repeat2 size={14} />
          {alreadyReposted && <span className="text-[10px]">Republié</span>}
        </button>
      </div>

      {/* Comments */}
      {showCmt && (
        <div className="px-4 pb-4 space-y-1 border-t border-stone-100 pt-2">
          {[...(post.comments || [])].sort((a, b) =>
            a.id === post.pinnedCommentId ? -1 : b.id === post.pinnedCommentId ? 1 : 0
          ).map(c => {
            const cAuthor = citizens.find(x => String(x.id) === String(c.authorId));
            const canDelCmt = String(c.authorId) === myId || isAdmin;
            const cmtLiked = (c.likes || []).map(String).includes(myId);
            const cmtLikeCount = (c.likes || []).length;
            const isReplyingToThis = replyingTo?.commentId === c.id;
            const isPinnedCmt = post.pinnedCommentId === c.id;
            const authorLikedCmt = (c.likes || []).map(String).includes(String(post.authorId));
            return (
              <div key={c.id} className={`flex items-start gap-2 pt-1.5 ${isPinnedCmt ? "bg-amber-50 -mx-1 px-1 rounded-xl" : ""}`}>
                <Ava citizen={cAuthor || { name: c.authorName }} size="xs" className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  {/* Reply context */}
                  {c.replyTo && (
                    <div className="text-[9px] text-stone-400 mb-0.5 flex items-center gap-1">
                      <ArrowLeft size={8} /> Réponse à <strong>{c.replyTo.authorName}</strong>
                    </div>
                  )}
                  {isPinnedCmt && (
                    <div className="text-[8px] font-black uppercase text-amber-600 mb-0.5 flex items-center gap-1">📌 Épinglé</div>
                  )}
                  <div className="relative inline-block max-w-full">
                    <div className="bg-stone-50 rounded-2xl rounded-tl-sm px-3 py-1.5">
                      <span className="text-[10px] font-black text-stone-700">{c.authorName} </span>
                      <span className="text-[11px] text-stone-700">{c.content}</span>
                    </div>
                    {authorLikedCmt && (
                      <div className="absolute -bottom-2 -right-1 flex items-center bg-white rounded-full shadow-sm border border-stone-100 px-1 py-0.5 gap-0.5">
                        <Ava citizen={author} size="xs" className="w-3 h-3 text-[6px]" />
                        <Heart size={8} className="text-rose-500" fill="currentColor" />
                      </div>
                    )}
                  </div>
                  {/* Comment actions */}
                  <div className={`flex items-center gap-3 pl-1 ${authorLikedCmt ? "mt-3" : "mt-0.5"}`}>
                    <button onClick={() => onLikeComment && onLikeComment(post.id, c.id)}
                      className={`flex items-center gap-0.5 text-[9px] font-bold transition-colors ${cmtLiked ? "text-rose-500" : "text-stone-400 hover:text-rose-400"}`}>
                      <Heart size={9} fill={cmtLiked ? "currentColor" : "none"} />
                      {cmtLikeCount > 0 && <span>{cmtLikeCount}</span>}
                    </button>
                    <button
                      onClick={() => setReplyingTo(isReplyingToThis ? null : { commentId: c.id, authorName: c.authorName })}
                      className={`text-[9px] font-bold transition-colors ${isReplyingToThis ? "text-blue-500" : "text-stone-400 hover:text-blue-400"}`}>
                      Répondre
                    </button>
                    {isMe && onPinComment && (
                      <button
                        onClick={() => onPinComment({ postId: post.id, commentId: c.id })}
                        className={`text-[9px] font-bold transition-colors ${isPinnedCmt ? "text-amber-500 hover:text-stone-400" : "text-stone-300 hover:text-amber-500"}`}>
                        {isPinnedCmt ? "📌 Désépingler" : "📌"}
                      </button>
                    )}
                    {canDelCmt && (
                      <button onClick={() => onDeleteComment({ postId: post.id, commentId: c.id })}
                        className="text-[9px] text-stone-300 hover:text-red-400 transition-colors">
                        Supprimer
                      </button>
                    )}
                    {isMe && myCitizen?.mushtagramPublicPersonality === "approved" && !canDelCmt && (
                      <button
                        onClick={() => onDeleteComment({ postId: post.id, commentId: c.id })}
                        title="Supprimer ce commentaire (modération PP)"
                        style={{opacity: 0.5, transition: "opacity 0.2s"}}
                        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}
                        className="text-[9px] text-stone-300 hover:text-red-400 transition-colors">
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Comment input */}
          <div className="flex gap-2 pt-2">
            <Ava citizen={myCitizen} size="sm" />
            <div className="flex-1 flex flex-col gap-1">
              {replyingTo && (
                <div className="flex items-center gap-1 text-[9px] text-blue-500 font-bold">
                  <ArrowLeft size={8} /> Réponse à {replyingTo.authorName}
                  <button onClick={() => setReplyingTo(null)} className="ml-1 text-stone-400 hover:text-stone-600">
                    <X size={9} />
                  </button>
                </div>
              )}
              <div className="flex gap-1.5">
                <input
                  value={commentInput[post.id] || ""}
                  onChange={e => setCommentInput(p => ({ ...p, [post.id]: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === "Enter" && commentInput[post.id]?.trim()) {
                      onAddComment(post.id, commentInput[post.id].trim(), replyingTo);
                      setCommentInput(p => ({ ...p, [post.id]: "" }));
                      setReplyingTo(null);
                    }
                  }}
                  placeholder={replyingTo ? `Répondre à ${replyingTo.authorName}…` : "Ajouter un commentaire… (Entrée)"}
                  className="flex-1 px-3 py-1.5 bg-stone-100 rounded-full text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:bg-white focus:ring-2 focus:ring-stone-200 transition-all" />
                <button
                  onClick={() => {
                    if (commentInput[post.id]?.trim()) {
                      onAddComment(post.id, commentInput[post.id].trim(), replyingTo);
                      setCommentInput(p => ({ ...p, [post.id]: "" }));
                      setReplyingTo(null);
                    }
                  }}
                  disabled={!commentInput[post.id]?.trim()}
                  className="p-1.5 rounded-full bg-gradient-to-r from-rose-500 to-violet-600 text-white hover:opacity-90 disabled:opacity-40 transition-all">
                  <Send size={10} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── composant principal ─────────────────────────────────────────────────── */

export default function MushtagramView({
  session, citizens = [],
  mushtagramPosts = [], mushtagramDMs = [], mushtagramStories = [], mushtagramNotifs = [],
  onPostMushtagram, onDeleteMushtagramPost,
  onToggleMushtagramLike, onAddMushtagramComment, onDeleteMushtagramComment, onLikeMushtagramComment, onPinMushtagramComment,
  onUpdateMushtagramProfile, onSendMushtagramDM, onMarkMushtagramDMsRead,
  onFollowMushtagram, onUnfollowMushtagram,
  onReactMushtagram, onRepostMushtagram,
  onVoteMushtagramPoll, onPinMushtagramPost,
  onReportMushtagramPost,
  onPostMushtagramStory, onDeleteMushtagramStory, onLikeMushtagramStory,
  onUpdateMushtagramSettings, onRequestPublicPersonality,
  onMarkMushtagramNotifsRead,
  onBroadcastMushtagram,
  notify,
}) {
  const [tab, setTab] = useState("feed");
  const [feedFilter, setFeedFilter] = useState("tous"); // "tous" | "abonnements"

  // Feed
  const [postContent, setPostContent]   = useState("");
  const [postImage, setPostImage]       = useState("");
  const [showImgInput, setShowImgInput] = useState(false);
  const [search, setSearch]             = useState("");
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInput, setCommentInput] = useState({});

  // Poll compose
  const [showPoll, setShowPoll]         = useState(false);
  const [pollOptions, setPollOptions]   = useState(["", ""]);
  const [pollQuestion, setPollQuestion] = useState("");

  // Official
  const [isOfficial, setIsOfficial]     = useState(false);

  // Followers-only post (PP feature)
  const [followersOnly, setFollowersOnly] = useState(false);

  // Broadcast (PP feature)
  const [broadcastInput, setBroadcastInput] = useState("");

  // Muted users (local state, not persisted)
  const [mutedSet, setMutedSet]         = useState(new Set());

  // Profile modal
  const [viewingProfile, setViewingProfile] = useState(null);

  // Profile sub-tab
  const [profileSubTab, setProfileSubTab] = useState("publications");

  // Followers / Following list modal
  const [followListMode, setFollowListMode] = useState(null); // null | "followers" | "following"

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
  const myFollowing = useMemo(() => (myCitizen?.mushtagramFollowing || []), [myCitizen]);
  const isPP = myCitizen?.mushtagramPublicPersonality === "approved";

  /* ── notifications ──────────────────────────────────────────────────── */
  const myNotifs = useMemo(() =>
    [...(mushtagramNotifs || [])]
      .filter(n => String(n.toId) === myId)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
    [mushtagramNotifs, myId]
  );
  const unreadNotifsCount = useMemo(() => myNotifs.filter(n => !n.read).length, [myNotifs]);

  useEffect(() => {
    if (tab === "notifs" && unreadNotifsCount > 0 && onMarkMushtagramNotifsRead) {
      onMarkMushtagramNotifsRead(myNotifs.filter(n => !n.read).map(n => n.id));
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── follow helpers ────────────────────────────────────────────────── */
  const handleMute = (authorId) => {
    setMutedSet(prev => {
      const next = new Set(prev);
      if (next.has(authorId)) next.delete(authorId);
      else next.add(authorId);
      return next;
    });
  };

  /* ── feed ────────────────────────────────────────────────────────── */
  const sortedPosts = useMemo(() => {
    const official = mushtagramPosts.filter(p => p.isOfficial).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const normal   = mushtagramPosts.filter(p => !p.isOfficial).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return [...official, ...normal];
  }, [mushtagramPosts]);

  const filteredPosts = useMemo(() => {
    let base = sortedPosts;
    if (feedFilter === "abonnements") {
      base = base.filter(p => (myFollowing || []).includes(String(p.authorId)) || String(p.authorId) === myId);
    }
    // Hide reposts from others if mushtagramHideReposts is true
    if (myCitizen?.mushtagramHideReposts) {
      base = base.filter(p => !p.repostOf || String(p.authorId) === myId);
    }
    // Hide followers-only posts for non-followers (unless it's my own post or I'm admin)
    base = base.filter(p => {
      if (!p.followersOnly) return true;
      if (String(p.authorId) === myId) return true;
      if (isAdmin) return true;
      return (myFollowing || []).includes(String(p.authorId));
    });
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(p =>
      p.content?.toLowerCase().includes(q) ||
      p.authorName?.toLowerCase().includes(q) ||
      (p.hashtags || []).some(h => h.toLowerCase().includes(q))
    );
  }, [sortedPosts, feedFilter, myFollowing, myId, search, myCitizen, isAdmin]);

  const filteredProfiles = useMemo(() => {
    if (!search || search.length < 2) return [];
    const q = search.toLowerCase();
    return citizens.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.mushtagramHandle?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [citizens, search]);

  /* ── trending hashtags ───────────────────────────────────────────── */
  const trendingHashtags = useMemo(() => {
    const map = {};
    mushtagramPosts.forEach(p => {
      (p.hashtags || []).forEach(h => {
        map[h] = (map[h] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [mushtagramPosts]);

  /* ── follow suggestions ───────────────────────────────────────────── */
  const followSuggestions = useMemo(() => {
    return citizens
      .filter(c => String(c.id) !== myId && !(myFollowing || []).includes(String(c.id)))
      .slice(0, 5);
  }, [citizens, myId, myFollowing]);

  const submitPost = () => {
    if (!postContent.trim() && !(showPoll && pollOptions.some(o => o.trim()))) return;
    const hashtags = [...new Set((postContent.match(/#[\wÀ-ɏ]+/g) || []).map(h => h.toLowerCase().slice(1)))];
    const pollData = showPoll && pollOptions.filter(o => o.trim()).length >= 2
      ? { question: pollQuestion.trim(), options: pollOptions.filter(o => o.trim()).map(o => ({ text: o, votes: [] })) }
      : null;
    onPostMushtagram({ content: postContent.trim(), imageUrl: postImage.trim(), hashtags, poll: pollData, isOfficial: isAdmin && isOfficial, followersOnly: isPP && followersOnly });
    setPostContent(""); setPostImage(""); setShowImgInput(false);
    setShowPoll(false); setPollOptions(["", ""]); setPollQuestion(""); setIsOfficial(false);
    setFollowersOnly(false);
    notify("Publication envoyée !", "success");
  };

  /* ── messages ────────────────────────────────────────────────────── */
  const myDMs = useMemo(() =>
    mushtagramDMs.filter(d => String(d.fromId) === myId || String(d.toId) === myId),
  [mushtagramDMs, myId]);

  const conversations = useMemo(() => {
    const map = {};
    myDMs.forEach(dm => {
      const otherId   = String(dm.fromId) === myId ? String(dm.toId)   : String(dm.fromId);
      const otherName = String(dm.fromId) === myId ? (dm.toName || citizens.find(c => String(c.id) === String(dm.toId))?.name) : dm.fromName;
      if (!map[otherId]) map[otherId] = { id: otherId, name: otherName, messages: [], unread: 0 };
      if (!map[otherId].name && otherName) map[otherId].name = otherName;
      map[otherId].messages.push(dm);
      if (!dm.read && !dm.readByRecipient && String(dm.toId) === myId) map[otherId].unread++;
    });
    return Object.values(map).sort((a, b) => {
      const la = a.messages.at(-1)?.timestamp ?? a.messages.at(-1)?.createdAt ?? 0;
      const lb = b.messages.at(-1)?.timestamp ?? b.messages.at(-1)?.createdAt ?? 0;
      return lb - la;
    });
  }, [myDMs, myId]);

  const convMessages = useMemo(() => {
    if (!selConv) return [];
    return myDMs
      .filter(d => String(d.fromId) === selConv || String(d.toId) === selConv)
      .sort((a, b) => (a.createdAt || a.timestamp || 0) - (b.createdAt || b.timestamp || 0));
  }, [myDMs, selConv]);

  const totalUnread = useMemo(() => conversations.reduce((s, c) => s + c.unread, 0), [conversations]);

  const openConversation = (id) => {
    setSelConv(id);
    const unreadIds = myDMs.filter(d => String(d.fromId) === id && !d.read && !d.readByRecipient).map(d => d.id);
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

  /* ── profil ──────────────────────────────────────────────────────── */
  const startEdit = () => {
    setProfileDraft({
      bio:           myCitizen?.mushtagramBio            || "",
      avatar:        myCitizen?.mushtagramAvatar         || "",
      handle:        myCitizen?.mushtagramHandle         || "",
      banner:        myCitizen?.mushtagramBanner         || "",
      photo:         myCitizen?.mushtagramPhoto          || "",
      officialTitle: myCitizen?.mushtagramOfficialTitle  || "",
      externalLink:  myCitizen?.mushtagramExternalLink   || "",
    });
    setEditingProfile(true);
  };

  const saveProfile = () => {
    onUpdateMushtagramProfile(profileDraft);
    setEditingProfile(false);
  };

  const myPosts = useMemo(() => sortedPosts.filter(p => String(p.authorId) === myId), [sortedPosts, myId]);

  const myRepostedIds = useMemo(() =>
    new Set(mushtagramPosts.filter(p => String(p.authorId) === myId && p.repostOf?.postId).map(p => p.repostOf.postId)),
  [mushtagramPosts, myId]);

  const followersList = useMemo(() =>
    citizens.filter(c => (c.mushtagramFollowing || []).map(String).includes(String(myId))),
  [citizens, myId]);

  const followingList = useMemo(() =>
    citizens.filter(c => (myFollowing || []).map(String).includes(String(c.id))),
  [citizens, myFollowing]);

  const followerCount = followersList.length;
  const followingCount = followingList.length;

  const pinnedPost = useMemo(() => {
    if (!myCitizen?.mushtagramPinned) return null;
    return mushtagramPosts.find(p => p.id === myCitizen.mushtagramPinned) || null;
  }, [myCitizen, mushtagramPosts]);

  /* ── render ──────────────────────────────────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-8">

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
          { id: "notifs",   label: "Notifs", badge: unreadNotifsCount },
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
          {/* Stories bar */}
          <StoriesBar
            stories={mushtagramStories}
            myId={myId}
            myCitizen={myCitizen}
            isAdmin={isAdmin}
            citizens={citizens}
            onPostStory={onPostMushtagramStory}
            onDeleteStory={onDeleteMushtagramStory}
            onLikeStory={onLikeMushtagramStory}
          />

          {/* Layout: main + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
            {/* Left column */}
            <div className="space-y-4">
              {/* Recherche + filtre */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher une publication…"
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-300/30 focus:border-rose-300 text-stone-900 placeholder:text-stone-400" />
                </div>
                <div className="flex gap-1 bg-white border border-stone-200 rounded-xl p-1">
                  {["tous", "abonnements"].map(f => (
                    <button key={f} onClick={() => setFeedFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all capitalize ${feedFilter === f ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-600"}`}>
                      {f === "tous" ? "Tous" : "Abonnements"}
                    </button>
                  ))}
                </div>
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
                          className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:border-rose-300" />
                      </div>
                    )}

                    {showPoll && (
                      <div className="space-y-2 bg-stone-50 rounded-xl p-3 border border-stone-200">
                        <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1">
                          <BarChart2 size={10} /> Sondage
                        </div>
                        <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)}
                          placeholder="Question du sondage (optionnel)"
                          className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:border-rose-300" />
                        {pollOptions.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <input value={opt} onChange={e => setPollOptions(p => p.map((o, j) => j === i ? e.target.value : o))}
                              placeholder={`Option ${i + 1}`}
                              className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:border-rose-300" />
                            {pollOptions.length > 2 && (
                              <button onClick={() => setPollOptions(p => p.filter((_, j) => j !== i))}
                                className="text-stone-300 hover:text-red-400 transition-all">
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                        {pollOptions.length < 4 && (
                          <button onClick={() => setPollOptions(p => [...p, ""])}
                            className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-stone-600 transition-all font-bold">
                            <Plus size={10} /> Ajouter une option
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowImgInput(v => !v)}
                          className={`flex items-center gap-1 text-xs font-bold transition-all ${showImgInput ? "text-rose-500" : "text-stone-400 hover:text-rose-400"}`}>
                          <ImageIcon size={13} /> Image
                        </button>
                        <button onClick={() => setShowPoll(v => !v)}
                          className={`flex items-center gap-1 text-xs font-bold transition-all ${showPoll ? "text-blue-500" : "text-stone-400 hover:text-blue-400"}`}>
                          <BarChart2 size={13} /> Sondage
                        </button>
                        {isAdmin && (
                          <button onClick={() => setIsOfficial(v => !v)}
                            className={`flex items-center gap-1 text-xs font-bold transition-all ${isOfficial ? "text-amber-500" : "text-stone-400 hover:text-amber-400"}`}>
                            <Crown size={13} /> Officiel
                          </button>
                        )}
                        {isPP && (
                          <button onClick={() => setFollowersOnly(v => !v)}
                            className={`flex items-center gap-1 text-xs font-bold transition-all ${followersOnly ? "text-violet-600" : "text-stone-400 hover:text-violet-400"}`}>
                            <Lock size={13} /> Abonnés uniquement
                          </button>
                        )}
                      </div>
                      <button onClick={submitPost} disabled={!postContent.trim() && !(showPoll && pollOptions.filter(o => o.trim()).length >= 2)}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-rose-500 to-violet-600 text-white text-xs font-black rounded-lg hover:opacity-90 disabled:opacity-40 transition-all">
                        <Send size={11} /> Publier
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Résultats profils */}
              {filteredProfiles.length > 0 && (
                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-2 border-b border-stone-100 flex items-center gap-2">
                    <Search size={11} className="text-stone-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                      Profils ({filteredProfiles.length})
                    </span>
                  </div>
                  {filteredProfiles.map(c => {
                    const isFollowing = (myFollowing || []).includes(String(c.id));
                    return (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                        <Ava citizen={c} size="md" onClick={() => setViewingProfile(c)} />
                        <div className="flex-1 min-w-0">
                          <button onClick={() => setViewingProfile(c)}
                            className="text-sm font-black text-stone-900 hover:text-rose-600 transition-colors">
                            {c.name}
                          </button>
                          {c.mushtagramHandle && <div className="text-[10px] text-stone-400">@{c.mushtagramHandle}</div>}
                          {c.mushtagramBio && <div className="text-[10px] text-stone-500 truncate mt-0.5">{c.mushtagramBio}</div>}
                        </div>
                        {String(c.id) !== myId && (
                          <button
                            onClick={() => isFollowing ? onUnfollowMushtagram && onUnfollowMushtagram(String(c.id)) : onFollowMushtagram && onFollowMushtagram(String(c.id))}
                            className={`text-[9px] font-black px-3 py-1.5 rounded-lg transition-all shrink-0 ${isFollowing ? "bg-stone-100 text-stone-600 hover:bg-stone-200" : "bg-gradient-to-r from-rose-500 to-violet-600 text-white hover:opacity-90"}`}>
                            {isFollowing ? "Suivi" : "Suivre"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Posts */}
              {filteredPosts.length === 0 ? (
                <div className="text-center py-14 text-stone-400 italic">Aucune publication pour l'instant</div>
              ) : filteredPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  myId={myId}
                  isAdmin={isAdmin}
                  citizens={citizens}
                  myCitizen={myCitizen}
                  myFollowing={myFollowing}
                  mutedSet={mutedSet}
                  expandedComments={expandedComments}
                  commentInput={commentInput}
                  onDelete={onDeleteMushtagramPost}
                  onToggleLike={onToggleMushtagramLike}
                  onAddComment={onAddMushtagramComment}
                  onDeleteComment={onDeleteMushtagramComment}
                  onLikeComment={onLikeMushtagramComment}
                  onPinComment={onPinMushtagramComment}
                  onReact={onReactMushtagram}
                  onRepost={onRepostMushtagram}
                  onVotePoll={onVoteMushtagramPoll}
                  onPin={onPinMushtagramPost}
                  onReport={onReportMushtagramPost}
                  onMute={handleMute}
                  onFollow={onFollowMushtagram}
                  onUnfollow={onUnfollowMushtagram}
                  onViewProfile={setViewingProfile}
                  myRepostedIds={myRepostedIds}
                  setExpandedComments={setExpandedComments}
                  setCommentInput={setCommentInput}
                />
              ))}
            </div>

            {/* Right column: sidebar */}
            <div className="space-y-4 lg:sticky lg:top-4">
              {/* Trending hashtags */}
              {trendingHashtags.length > 0 && (
                <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} className="text-violet-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Hashtags Tendances</span>
                  </div>
                  <div className="space-y-1.5">
                    {trendingHashtags.map(([tag, count]) => (
                      <button key={tag}
                        onClick={() => setSearch(tag)}
                        className="w-full flex items-center justify-between text-left px-2 py-1 rounded-lg hover:bg-stone-50 transition-colors group">
                        <span className="text-sm text-violet-600 font-bold group-hover:text-violet-700">#{tag}</span>
                        <span className="text-[10px] text-stone-400">{count} post{count !== 1 ? "s" : ""}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow suggestions */}
              {followSuggestions.length > 0 && (
                <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <UserPlus size={14} className="text-rose-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Suggestions</span>
                  </div>
                  <div className="space-y-2">
                    {followSuggestions.map(c => (
                      <div key={c.id} className="flex items-center gap-2">
                        <Ava citizen={c} size="sm" onClick={() => setViewingProfile(c)} />
                        <div className="flex-1 min-w-0">
                          <button onClick={() => setViewingProfile(c)}
                            className="text-xs font-bold text-stone-700 hover:text-rose-600 transition-colors truncate block">
                            {c.name}
                          </button>
                          {c.mushtagramHandle && (
                            <div className="text-[9px] text-stone-400 truncate">@{c.mushtagramHandle}</div>
                          )}
                        </div>
                        <button onClick={() => onFollowMushtagram(String(c.id))}
                          className="text-[9px] font-black text-rose-500 hover:text-rose-700 border border-rose-200 hover:border-rose-400 px-2 py-1 rounded-lg transition-all shrink-0">
                          Suivre
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ NOTIFICATIONS ══════════════════════ */}
      {tab === "notifs" && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden" style={{ minHeight: 400 }}>
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-rose-500" />
              <span className="text-xs font-black uppercase tracking-widest text-stone-700">Notifications</span>
            </div>
            {myNotifs.length > 0 && (
              <button onClick={() => onMarkMushtagramNotifsRead && onMarkMushtagramNotifsRead(myNotifs.map(n => n.id))}
                className="text-[10px] text-stone-400 hover:text-rose-500 font-bold transition-colors">
                Tout marquer comme lu
              </button>
            )}
          </div>
          {myNotifs.length === 0 ? (
            <div className="text-center py-14 text-stone-400 italic text-sm">Aucune notification</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {myNotifs.map(notif => {
                const sender = citizens.find(c => String(c.id) === String(notif.fromId));
                const typeLabel = {
                  like:    "a aimé votre publication",
                  comment: "a commenté votre publication",
                  reply:   "a répondu à votre commentaire",
                  repost:  "a republié votre publication",
                  follow:  "vous suit maintenant",
                  dm:      "vous a envoyé un message",
                }[notif.type] || "vous a notifié";
                const isHigh = notif.priority === "high";
                return (
                  <div key={notif.id} className={`flex items-start gap-3 px-4 py-3 transition-colors ${!notif.read ? "bg-rose-50/60" : "hover:bg-stone-50"}`}>
                    <Ava citizen={sender || { name: notif.fromName }} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone-800 leading-snug">
                        <span className="font-black">{notif.fromName}</span>{" "}
                        <span className={isHigh ? "text-rose-600 font-semibold" : ""}>{typeLabel}</span>
                        {notif.content && <span className="text-stone-400"> — "{notif.content}"</span>}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">{new Date(notif.timestamp).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}</p>
                    </div>
                    {isHigh && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" title="Prioritaire" />}
                  </div>
                );
              })}
            </div>
          )}
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
                    <Ava citizen={other} size="sm" onClick={() => other.id && setViewingProfile(other)} />
                    <div>
                      <button onClick={() => other.id && setViewingProfile(other)}
                        className="text-sm font-black text-stone-900 hover:text-rose-600 transition-colors">
                        {other.name}
                      </button>
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
                  className="flex-1 px-4 py-2 bg-stone-100 rounded-full text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:bg-white focus:ring-2 focus:ring-rose-300/30 transition-all" />
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
                    className="w-full pl-8 pr-4 py-2 bg-stone-100 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-rose-200/40" />
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
                    <textarea value={profileDraft.bio} onChange={e => setProfileDraft(p => ({ ...p, bio: e.target.value.slice(0, 300) }))}
                      rows={3} placeholder="Présentez-vous en quelques mots…"
                      maxLength={300}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 resize-none outline-none focus:border-rose-300" />
                    <div className="text-right text-[9px] text-stone-400 mt-0.5">{(profileDraft.bio || "").length}/300</div>
                  </div>
                  {isPP && (
                    <>
                      <div>
                        <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-1">
                          Titre officiel
                        </label>
                        <input value={profileDraft.officialTitle || ""} onChange={e => setProfileDraft(p => ({ ...p, officialTitle: e.target.value.slice(0, 80) }))}
                          placeholder="ex: Gouverneur de l'Est"
                          maxLength={80}
                          className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-rose-300" />
                        <div className="text-right text-[9px] text-stone-400 mt-0.5">{(profileDraft.officialTitle || "").length}/80</div>
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-1">
                          Lien externe
                        </label>
                        <input value={profileDraft.externalLink || ""} onChange={e => setProfileDraft(p => ({ ...p, externalLink: e.target.value.slice(0, 200) }))}
                          placeholder="https://…"
                          maxLength={200}
                          className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-rose-300" />
                      </div>
                    </>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditingProfile(false)}
                      className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-all border border-stone-200">
                      Annuler
                    </button>
                    <button onClick={saveProfile}
                      className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-violet-600 text-white text-xs font-black rounded-xl hover:opacity-90 shadow transition-all">
                      Enregistrer le profil
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    <h2 className="text-lg font-black text-stone-900">{myCitizen?.name}</h2>
                    {isPP && (
                      <span title="Personnalité publique vérifiée" style={{color:"#3b82f6", fontSize:"0.85rem", marginLeft:"3px"}}>✓</span>
                    )}
                  </div>
                  {myCitizen?.mushtagramHandle && (
                    <p className="text-sm text-stone-400">@{myCitizen.mushtagramHandle}</p>
                  )}
                  {isPP && myCitizen?.mushtagramOfficialTitle && (
                    <p className="text-xs text-stone-400 italic mt-0.5">{myCitizen.mushtagramOfficialTitle}</p>
                  )}
                  {isPP && myCitizen?.mushtagramExternalLink && (
                    <a href={myCitizen.mushtagramExternalLink} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline mt-0.5 block truncate">
                      {myCitizen.mushtagramExternalLink}
                    </a>
                  )}
                  {myCitizen?.mushtagramBio ? (
                    <p className="text-sm text-stone-600 mt-2 leading-relaxed whitespace-pre-wrap">{myCitizen.mushtagramBio}</p>
                  ) : (
                    <p className="text-xs text-stone-400 italic mt-2">Aucune biographie — cliquez sur "Modifier le profil"</p>
                  )}
                  <div className="flex gap-4 mt-3 flex-wrap">
                    <span className="text-xs text-stone-500">
                      <strong className="text-stone-800">{myPosts.length}</strong> publication{myPosts.length !== 1 ? "s" : ""}
                    </span>
                    <button onClick={() => setFollowListMode("followers")}
                      className="text-xs text-stone-500 hover:text-rose-600 transition-colors">
                      <strong className="text-stone-800">{followerCount}</strong> abonné{followerCount !== 1 ? "s" : ""}
                    </button>
                    <button onClick={() => setFollowListMode("following")}
                      className="text-xs text-stone-500 hover:text-rose-600 transition-colors">
                      <strong className="text-stone-800">{followingCount}</strong> abonnement{followingCount !== 1 ? "s" : ""}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-1 bg-stone-100 rounded-xl p-1 flex-wrap">
            {[
              { id: "publications", label: "Publications" },
              { id: "likes",        label: "J'aime" },
              { id: "reposts",      label: "Republications" },
              ...(isPP ? [{ id: "stats", label: "Statistiques" }] : []),
              { id: "settings",     label: "Paramètres" },
            ].map(t => (
              <button key={t.id} onClick={() => setProfileSubTab(t.id)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${profileSubTab === t.id ? "bg-white text-stone-900 shadow" : "text-stone-500 hover:text-stone-700"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Publications ── */}
          {profileSubTab === "publications" && (
            <>
              {/* Post épinglé */}
              {pinnedPost && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-amber-600">
                    <Pin size={10} /> Post épinglé
                  </div>
                  <PostCard
                    post={pinnedPost}
                    myId={myId}
                    isAdmin={isAdmin}
                    citizens={citizens}
                    myCitizen={myCitizen}
                    myFollowing={myFollowing}
                    mutedSet={new Set()}
                    expandedComments={expandedComments}
                    commentInput={commentInput}
                    onDelete={onDeleteMushtagramPost}
                    onToggleLike={onToggleMushtagramLike}
                    onAddComment={onAddMushtagramComment}
                    onDeleteComment={onDeleteMushtagramComment}
                    onLikeComment={onLikeMushtagramComment}
                    onPinComment={onPinMushtagramComment}
                    onReact={onReactMushtagram}
                    onRepost={onRepostMushtagram}
                    onVotePoll={onVoteMushtagramPoll}
                    onPin={onPinMushtagramPost}
                    onReport={onReportMushtagramPost}
                    onMute={handleMute}
                    onFollow={onFollowMushtagram}
                    onUnfollow={onUnfollowMushtagram}
                    onViewProfile={setViewingProfile}
                    myRepostedIds={myRepostedIds}
                    setExpandedComments={setExpandedComments}
                    setCommentInput={setCommentInput}
                  />
                </div>
              )}

              {/* Mes publications */}
              {myPosts.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-[9px] font-black uppercase tracking-widest text-stone-500">Mes publications</div>
                  {myPosts.map(post => (
                    <div key={post.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                      {post.isOfficial && (
                        <div className="flex items-center gap-1 text-amber-600 text-[9px] font-black uppercase mb-1">
                          <Crown size={10} /> Proclamation Officielle
                        </div>
                      )}
                      {post.repostOf && (
                        <div className="flex items-center gap-1 text-stone-400 text-[9px] font-bold mb-1">
                          <Repeat2 size={9} /> Republication de {post.repostOf.authorName}
                        </div>
                      )}
                      <p className="text-sm text-stone-800 leading-relaxed">{post.content}</p>
                      {post.imageUrl && (
                        <img src={post.imageUrl} alt="" className="mt-2 rounded-lg max-h-48 object-contain bg-stone-50 w-full"
                          onError={e => { e.target.style.display = "none"; }} />
                      )}
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-stone-400">
                        <span>❤ {(post.likes || []).length}</span>
                        <span>💬 {(post.comments || []).length}</span>
                        {myCitizen?.mushtagramPinned === post.id && (
                          <span className="text-amber-500 flex items-center gap-0.5"><Pin size={9} /> Épinglé</span>
                        )}
                        <span className="ml-auto">{post.rpDate || post.date || ""}</span>
                        <button onClick={() => onDeleteMushtagramPost(post.id)}
                          className="text-stone-300 hover:text-red-400 transition-all">
                          <Trash2 size={11} />
                        </button>
                      </div>
                      {/* Stats panel for PP */}
                      {isPP && (() => {
                        const likeCount = (post.likes || []).length;
                        const cmtCount = (post.comments || []).length;
                        const repostCount = mushtagramPosts.filter(p => p.repostOf?.postId === post.id).length;
                        const reach = likeCount + cmtCount * 2 + repostCount * 3;
                        return (
                          <div className="mt-3 pt-3 border-t border-stone-100 bg-stone-50 rounded-lg px-3 py-2 space-y-1">
                            <div className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-1.5">Statistiques</div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div>
                                <div className="text-sm font-black text-rose-500">{likeCount}</div>
                                <div className="text-[8px] text-stone-400">
                                  Likes {likeCount > 5 ? "🔥 Populaire" : ""}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-black text-blue-500">{cmtCount}</div>
                                <div className="text-[8px] text-stone-400">Commentaires</div>
                              </div>
                              <div>
                                <div className="text-sm font-black text-emerald-500">{repostCount}</div>
                                <div className="text-[8px] text-stone-400">Reposts</div>
                              </div>
                              <div>
                                <div className="text-sm font-black text-violet-500">{reach}</div>
                                <div className="text-[8px] text-stone-400">Portée</div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-stone-400 italic text-sm">Aucune publication</div>
              )}
            </>
          )}

          {/* ── J'aime ── */}
          {profileSubTab === "likes" && (() => {
            const likedPosts = mushtagramPosts.filter(p => (p.likes || []).map(String).includes(myId));
            return likedPosts.length === 0 ? (
              <div className="text-center py-10 text-stone-400 italic text-sm">Vous n'avez aimé aucune publication.</div>
            ) : (
              <div className="space-y-3">
                {likedPosts.map(post => (
                  <div key={post.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Ava citizen={citizens.find(c => String(c.id) === String(post.authorId)) || { name: post.authorName }} size="sm" />
                      <span className="text-xs font-black text-stone-700">{post.authorName}</span>
                      <span className="text-[10px] text-stone-400 ml-auto">{post.rpDate || post.date || ""}</span>
                    </div>
                    <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-stone-400">
                      <span>❤ {(post.likes || []).length}</span>
                      <span>💬 {(post.comments || []).length}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── Republications ── */}
          {profileSubTab === "reposts" && (() => {
            const myReposts = myPosts.filter(p => p.repostOf);
            return myReposts.length === 0 ? (
              <div className="text-center py-10 text-stone-400 italic text-sm">Aucune republication.</div>
            ) : (
              <div className="space-y-3">
                {myReposts.map(post => (
                  <div key={post.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-1 text-stone-400 text-[9px] font-bold mb-2">
                      <Repeat2 size={9} /> Republication de {post.repostOf.authorName}
                    </div>
                    {post.repostOf.content && (
                      <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 rounded-lg px-3 py-2 border border-stone-100">{post.repostOf.content}</p>
                    )}
                    {post.content && (
                      <p className="text-sm text-stone-800 leading-relaxed mt-2 whitespace-pre-wrap">{post.content}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-stone-400">
                      <span>❤ {(post.likes || []).length}</span>
                      <span>{post.rpDate || post.date || ""}</span>
                      <button onClick={() => onDeleteMushtagramPost(post.id)}
                        className="ml-auto text-stone-300 hover:text-red-400 transition-all">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── Paramètres ── */}
          {profileSubTab === "settings" && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-6">

              {/* Section Confidentialité */}
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-3">Confidentialité</div>
                <div className="space-y-3">
                  {/* Compte Privé */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-stone-800">Compte Privé</div>
                      <div className="text-[10px] text-stone-400">Seuls vos abonnés voient vos publications complètes</div>
                    </div>
                    <button
                      onClick={() => onUpdateMushtagramSettings && onUpdateMushtagramSettings({
                        isPrivate: !(myCitizen?.mushtagramPrivate ?? false),
                        isAnonymous: myCitizen?.mushtagramAnonymous ?? false,
                        hideReposts: myCitizen?.mushtagramHideReposts ?? false,
                      })}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${myCitizen?.mushtagramPrivate ? "bg-rose-500" : "bg-stone-300"}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${myCitizen?.mushtagramPrivate ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  {/* Mode Anonyme */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-stone-800">Mode Anonyme</div>
                      <div className="text-[10px] text-stone-400">Votre vrai nom est masqué sur vos publications</div>
                    </div>
                    <button
                      onClick={() => onUpdateMushtagramSettings && onUpdateMushtagramSettings({
                        isPrivate: myCitizen?.mushtagramPrivate ?? false,
                        isAnonymous: !(myCitizen?.mushtagramAnonymous ?? false),
                        hideReposts: myCitizen?.mushtagramHideReposts ?? false,
                      })}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${myCitizen?.mushtagramAnonymous ? "bg-rose-500" : "bg-stone-300"}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${myCitizen?.mushtagramAnonymous ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section Personnalité Publique */}
              <div className="border-t border-stone-100 pt-5">
                <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-3">Personnalité Publique</div>
                {myCitizen?.mushtagramPublicPersonality === "approved" || myCitizen?.mushtagramPublicPersonality === true ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-black">
                    <Crown size={14} className="text-amber-500" /> ✓ Personnalité Publique reconnue
                  </div>
                ) : myCitizen?.mushtagramPublicPersonality === "pending" ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-500 text-xs">
                    ⏳ Demande en attente de validation
                  </div>
                ) : (
                  <button
                    onClick={() => onRequestPublicPersonality && onRequestPublicPersonality()}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-black rounded-xl hover:opacity-90 transition-all shadow">
                    Demander le statut Personnalité Publique
                  </button>
                )}
              </div>

              {/* Section Préférences d'affichage */}
              <div className="border-t border-stone-100 pt-5">
                <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-3">Mes préférences d'affichage</div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-stone-800">Afficher les reposts dans le fil</div>
                    <div className="text-[10px] text-stone-400">Masquer les republications des autres dans votre fil</div>
                  </div>
                  <button
                    onClick={() => onUpdateMushtagramSettings && onUpdateMushtagramSettings({
                      isPrivate: myCitizen?.mushtagramPrivate ?? false,
                      isAnonymous: myCitizen?.mushtagramAnonymous ?? false,
                      hideReposts: !(myCitizen?.mushtagramHideReposts ?? false),
                    })}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${myCitizen?.mushtagramHideReposts ? "bg-rose-500" : "bg-stone-300"}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${myCitizen?.mushtagramHideReposts ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Followers / Following list modal */}
      {followListMode && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setFollowListMode(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
                <button onClick={() => setFollowListMode("followers")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${followListMode === "followers" ? "bg-white text-stone-900 shadow" : "text-stone-500"}`}>
                  Abonnés <span className="ml-1 text-stone-400">{followerCount}</span>
                </button>
                <button onClick={() => setFollowListMode("following")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${followListMode === "following" ? "bg-white text-stone-900 shadow" : "text-stone-500"}`}>
                  Abonnements <span className="ml-1 text-stone-400">{followingCount}</span>
                </button>
              </div>
              <button onClick={() => setFollowListMode(null)} className="text-stone-400 hover:text-stone-700 transition-colors">
                <X size={18} />
              </button>
            </div>
            {/* List */}
            <div className="overflow-y-auto flex-1 divide-y divide-stone-50">
              {(followListMode === "followers" ? followersList : followingList).length === 0 ? (
                <p className="text-center text-xs text-stone-400 py-10 italic">
                  {followListMode === "followers" ? "Personne ne vous suit encore." : "Vous ne suivez personne."}
                </p>
              ) : (
                (followListMode === "followers" ? followersList : followingList).map(c => {
                  const isFollowingThem = (myFollowing || []).map(String).includes(String(c.id));
                  const isMe = String(c.id) === myId;
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors">
                      <button onClick={() => { setViewingProfile(c); setFollowListMode(null); }}>
                        <Ava citizen={c} size="md" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <button onClick={() => { setViewingProfile(c); setFollowListMode(null); }}
                          className="font-bold text-sm text-stone-900 hover:text-rose-600 transition-colors truncate block text-left">
                          {c.name}
                        </button>
                        {c.mushtagramHandle && (
                          <p className="text-xs text-stone-400 truncate">@{c.mushtagramHandle}</p>
                        )}
                      </div>
                      {!isMe && (
                        <button
                          onClick={() => isFollowingThem ? onUnfollowMushtagram(String(c.id)) : onFollowMushtagram(String(c.id))}
                          className={`shrink-0 text-[10px] font-black px-3 py-1.5 rounded-lg transition-all ${isFollowingThem ? "bg-stone-100 text-stone-600 hover:bg-red-50 hover:text-red-500" : "bg-gradient-to-r from-rose-500 to-violet-600 text-white hover:opacity-90"}`}>
                          {isFollowingThem ? <><UserMinus size={10} className="inline mr-0.5" /> Suivi</> : <><UserPlus size={10} className="inline mr-0.5" /> Suivre</>}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile modal */}
      {viewingProfile && (
        <ProfileModal
          citizen={viewingProfile}
          myId={myId}
          myFollowing={myFollowing}
          posts={mushtagramPosts}
          citizens={citizens}
          onFollow={onFollowMushtagram}
          onUnfollow={onUnfollowMushtagram}
          onClose={() => setViewingProfile(null)}
          onOpenDM={(id) => {
            openConversation(id);
            setTab("messages");
            setViewingProfile(null);
          }}
        />
      )}
    </div>
  );
}
