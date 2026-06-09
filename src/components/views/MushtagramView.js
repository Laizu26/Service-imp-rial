import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Heart, MessageCircle, Send, Search, Trash2, ArrowLeft,
  X, Edit3, Hash, ImageIcon, AtSign, Plus, Flag, Repeat2,
  UserPlus, UserMinus, VolumeX, Crown, BarChart2, TrendingUp, Pin,
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

function ProfileModal({ citizen, myId, myFollowing, posts, onFollow, onUnfollow, onClose, onOpenDM }) {
  if (!citizen) return null;
  const citizenId = String(citizen.id);
  const isMe = citizenId === myId;
  const isFollowing = (myFollowing || []).includes(citizenId);
  const citizenPosts = (posts || []).filter(p => String(p.authorId) === citizenId)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 10);

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
          {citizen.mushtagramBio && (
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">{citizen.mushtagramBio}</p>
          )}
          <div className="text-xs text-stone-400 mt-1">{citizenPosts.length} publication{citizenPosts.length !== 1 ? "s" : ""}</div>
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

function StoryViewer({ story, myId, isAdmin, onDelete, onClose }) {
  if (!story) return null;
  const canDelete = String(story.authorId) === myId || isAdmin;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className="relative bg-stone-900 rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-stone-700">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <div className={`w-full h-full flex items-center justify-center font-black text-white text-sm ${avatarBg(story.authorName || "")}`}>
              {(story.authorName || "?")[0]?.toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-sm font-black text-stone-100">{story.authorName}</div>
            <div className="text-[9px] text-stone-500">{story.date || ""}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {canDelete && (
              <button onClick={() => { onDelete(story.id); onClose(); }}
                className="p-1 rounded hover:bg-red-900/30 text-stone-500 hover:text-red-400 transition-all">
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded hover:bg-stone-700 text-stone-400 hover:text-stone-100 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="p-5">
          {story.imageUrl && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img src={story.imageUrl} alt="" className="w-full max-h-72 object-contain bg-stone-900/20 rounded-xl"
                onError={e => { e.target.style.display = "none"; }} />
            </div>
          )}
          {story.content && (
            <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-wrap">{story.content}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── StoriesBar ─────────────────────────────────────────────────────────── */

function StoriesBar({ stories, myId, myCitizen, isAdmin, citizens, onPostStory, onDeleteStory }) {
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
      {viewing && (
        <StoryViewer
          story={viewing}
          myId={myId}
          isAdmin={isAdmin}
          onDelete={onDeleteStory}
          onClose={() => setViewing(null)}
        />
      )}
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
  onDelete, onToggleLike, onAddComment, onDeleteComment,
  onReact, onRepost, onVotePoll, onPin, onReport, onMute,
  onFollow, onUnfollow,
  onViewProfile,
  setExpandedComments, setCommentInput,
}) {
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
          <div className="flex-1 bg-stone-50 rounded-xl px-3 py-2 border border-stone-100">
            <div className="text-[9px] font-black text-stone-500 mb-0.5">Republication de {post.repostOf.authorName}</div>
            <p className="text-xs text-stone-600 line-clamp-2">{post.repostOf.content}</p>
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
            {(author?.mushtagramHandle) && (
              <span className="text-[10px] text-stone-400">@{author.mushtagramHandle}</span>
            )}
            {!isMe && !isFollowing && (
              <button onClick={() => onFollow(authorId)}
                className="text-[9px] font-black text-rose-500 hover:text-rose-700 transition-colors ml-1 flex items-center gap-0.5">
                <UserPlus size={9} /> Suivre
              </button>
            )}
          </div>
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

      {/* Reactions bar summary */}
      {Object.keys(post.reactions || {}).some(e => (post.reactions[e] || []).length > 0) && (
        <div className="flex flex-wrap gap-1 px-4 pb-2">
          {REACTION_EMOJIS.filter(e => ((post.reactions || {})[e] || []).length > 0).map(e => {
            const count = (post.reactions[e] || []).length;
            return (
              <span key={e} className="flex items-center gap-0.5 bg-stone-50 border border-stone-100 rounded-full px-2 py-0.5 text-xs">
                {e} <span className="text-[10px] text-stone-500 font-bold">{count}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* Actions bar */}
      <div className="px-4 py-2 border-t border-stone-100 flex items-center gap-4">
        <ReactionPicker postId={post.id} reactions={post.reactions || {}} myId={myId} onReact={onReact} />
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
        <button onClick={() => onRepost(post.id)}
          className="flex items-center gap-1.5 text-xs font-bold text-stone-400 hover:text-emerald-500 transition-all">
          <Repeat2 size={14} />
        </button>
      </div>

      {/* Comments */}
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
                  <button onClick={() => onDeleteComment(post.id, c.id)}
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
                    onAddComment(post.id, commentInput[post.id].trim());
                    setCommentInput(p => ({ ...p, [post.id]: "" }));
                  }
                }}
                placeholder="Ajouter un commentaire… (Entrée)"
                className="flex-1 px-3 py-1.5 bg-stone-100 rounded-full text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:bg-white focus:ring-2 focus:ring-stone-200 transition-all" />
              <button
                onClick={() => {
                  if (commentInput[post.id]?.trim()) {
                    onAddComment(post.id, commentInput[post.id].trim());
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
}

/* ── composant principal ─────────────────────────────────────────────────── */

export default function MushtagramView({
  session, citizens = [],
  mushtagramPosts = [], mushtagramDMs = [], mushtagramStories = [],
  onPostMushtagram, onDeleteMushtagramPost,
  onToggleMushtagramLike, onAddMushtagramComment, onDeleteMushtagramComment,
  onUpdateMushtagramProfile, onSendMushtagramDM, onMarkMushtagramDMsRead,
  onFollowMushtagram, onUnfollowMushtagram,
  onReactMushtagram, onRepostMushtagram,
  onVoteMushtagramPoll, onPinMushtagramPost,
  onReportMushtagramPost,
  onPostMushtagramStory, onDeleteMushtagramStory,
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

  // Muted users (local state, not persisted)
  const [mutedSet, setMutedSet]         = useState(new Set());

  // Profile modal
  const [viewingProfile, setViewingProfile] = useState(null);

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
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(p =>
      p.content?.toLowerCase().includes(q) ||
      p.authorName?.toLowerCase().includes(q) ||
      (p.hashtags || []).some(h => h.toLowerCase().includes(q))
    );
  }, [sortedPosts, feedFilter, myFollowing, myId, search]);

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
    onPostMushtagram({ content: postContent.trim(), imageUrl: postImage.trim(), hashtags, poll: pollData, isOfficial: isAdmin && isOfficial });
    setPostContent(""); setPostImage(""); setShowImgInput(false);
    setShowPoll(false); setPollOptions(["", ""]); setPollQuestion(""); setIsOfficial(false);
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
      const otherName = String(dm.fromId) === myId ?       dm.toName   :       dm.fromName;
      if (!map[otherId]) map[otherId] = { id: otherId, name: otherName, messages: [], unread: 0 };
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
                  onReact={onReactMushtagram}
                  onRepost={onRepostMushtagram}
                  onVotePoll={onVoteMushtagramPoll}
                  onPin={onPinMushtagramPost}
                  onReport={onReportMushtagramPost}
                  onMute={handleMute}
                  onFollow={onFollowMushtagram}
                  onUnfollow={onUnfollowMushtagram}
                  onViewProfile={setViewingProfile}
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
                    <textarea value={profileDraft.bio} onChange={e => setProfileDraft(p => ({ ...p, bio: e.target.value }))}
                      rows={3} placeholder="Présentez-vous en quelques mots…"
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 resize-none outline-none focus:border-rose-300" />
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
                onReact={onReactMushtagram}
                onRepost={onRepostMushtagram}
                onVotePoll={onVoteMushtagramPoll}
                onPin={onPinMushtagramPost}
                onReport={onReportMushtagramPost}
                onMute={handleMute}
                onFollow={onFollowMushtagram}
                onUnfollow={onUnfollowMushtagram}
                onViewProfile={setViewingProfile}
                setExpandedComments={setExpandedComments}
                setCommentInput={setCommentInput}
              />
            </div>
          )}

          {/* Mes publications */}
          {myPosts.length > 0 && (
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
                </div>
              ))}
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
