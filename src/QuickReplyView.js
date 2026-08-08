import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAuth } from "./hooks/useAuth";
import { useGameEngine } from "./hooks/useGameEngine";
import { formatRPDate } from "./lib/gameUtils";

const noop = () => {};

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Session "de secours" si le paramètre asId n'est pas fourni : reprend le premier compte
// connecté localement (même mécanisme que le multi-compte du site, voir useAuth.js).
function fallbackAccountId() {
  try {
    const raw = localStorage.getItem("service_imperial_accounts");
    const accounts = raw ? JSON.parse(raw) : [];
    return accounts[0]?.id || null;
  } catch {
    return null;
  }
}

/**
 * Vue ultra-légère, montée seule (voir src/index.js) dans la WebView de la bulle Android
 * (BubbleActivity) — juste un fil de discussion Mushtagram et un champ de réponse, pour
 * répondre à un message privé sans ouvrir l'application complète.
 */
const QuickReplyView = () => {
  const dmPartnerId = getQueryParam("dm");
  const partnerNameParam = getQueryParam("name") || "";
  const asId = getQueryParam("asId") || fallbackAccountId();

  const { firebaseUser } = useAuth(noop);
  const { state, saveState, connection } = useGameEngine(firebaseUser, noop);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const me = useMemo(
    () => (asId ? (state.citizens || []).find((c) => String(c.id) === String(asId)) || null : null),
    [state.citizens, asId]
  );
  const partner = useMemo(
    () => (state.citizens || []).find((c) => String(c.id) === String(dmPartnerId)) || null,
    [state.citizens, dmPartnerId]
  );

  const thread = useMemo(() => {
    if (!me || !dmPartnerId) return [];
    return (state.mushtagramDMs || [])
      .filter(
        (dm) =>
          (String(dm.fromId) === String(me.id) && String(dm.toId) === String(dmPartnerId)) ||
          (String(dm.fromId) === String(dmPartnerId) && String(dm.toId) === String(me.id))
      )
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .slice(-25);
  }, [state.mushtagramDMs, me, dmPartnerId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [thread.length]);

  // Marque les messages du partenaire comme lus à l'ouverture de la bulle.
  useEffect(() => {
    if (!me || !dmPartnerId) return;
    const dms = state.mushtagramDMs || [];
    const hasUnread = dms.some(
      (dm) => String(dm.fromId) === String(dmPartnerId) && String(dm.toId) === String(me.id) && !dm.readByRecipient
    );
    if (!hasUnread) return;
    const updated = dms.map((dm) =>
      String(dm.fromId) === String(dmPartnerId) && String(dm.toId) === String(me.id)
        ? { ...dm, readByRecipient: true }
        : dm
    );
    saveState({ ...state, mushtagramDMs: updated });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, dmPartnerId, state.mushtagramDMs]);

  const send = useCallback(() => {
    if (!me || !dmPartnerId || !text.trim() || sending) return;
    setSending(true);
    const gd = state.gameDate || { day: 1, month: 1, year: 1200 };
    const dm = {
      id: `mdm_${Date.now()}`,
      fromId: me.id,
      fromName: me.name,
      toId: dmPartnerId,
      toName: partner?.name || partnerNameParam || String(dmPartnerId),
      content: text.trim(),
      date: formatRPDate(gd),
      createdAt: Date.now(),
      readByRecipient: false,
    };
    const dmNotif = {
      id: `mnotif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      toId: String(dmPartnerId),
      type: "dm",
      fromId: String(me.id),
      fromName: me.name,
      content: text.trim().slice(0, 60),
      timestamp: Date.now(),
      read: false,
      priority: "high",
    };
    saveState({
      ...state,
      mushtagramDMs: [...(state.mushtagramDMs || []), dm],
      mushtagramNotifs: [...(state.mushtagramNotifs || []), dmNotif],
    });
    setText("");
    setSending(false);
  }, [me, dmPartnerId, text, sending, state, partner, partnerNameParam, saveState]);

  if (!dmPartnerId || !asId) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#151f19] text-stone-400 text-xs text-center p-6">
        Ouvrez d'abord l'application pour vous connecter.
      </div>
    );
  }
  if (!me || connection === "connecting") {
    return (
      <div className="h-screen flex items-center justify-center bg-[#151f19] text-stone-400 text-xs">
        Chargement…
      </div>
    );
  }

  const displayName = partner?.name || partnerNameParam || "Conversation";

  return (
    <div className="h-screen flex flex-col bg-[#151f19] font-sans">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-stone-900 border-b border-stone-800 shrink-0">
        <div className="w-7 h-7 rounded-full bg-[#e1306c] text-white flex items-center justify-center font-black text-xs shrink-0">
          {(displayName[0] || "?").toUpperCase()}
        </div>
        <div className="text-stone-100 font-bold text-sm truncate">{displayName}</div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {thread.length === 0 ? (
          <div className="text-center text-stone-500 italic text-[11px] mt-6">Aucun message pour l'instant.</div>
        ) : (
          thread.map((dm) => {
            const mine = String(dm.fromId) === String(me.id);
            return (
              <div key={dm.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-[13px] leading-snug break-words ${
                    mine ? "bg-amber-500 text-stone-900" : "bg-stone-800 text-stone-100"
                  }`}
                >
                  {dm.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-1.5 p-2 bg-stone-900 border-t border-stone-800 shrink-0">
        <input
          className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-[13px] text-stone-100 outline-none focus:border-amber-500/50 placeholder:text-stone-500"
          value={text}
          placeholder="Votre message…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="bg-amber-500 text-stone-900 text-[10px] font-black uppercase tracking-widest rounded-xl px-3.5 py-2.5 disabled:opacity-40 disabled:pointer-events-none"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
};

export default QuickReplyView;
