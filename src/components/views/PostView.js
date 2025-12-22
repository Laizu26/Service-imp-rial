import React, { useState } from "react";
import { PenTool, Inbox, Mail, Send } from "lucide-react";
import UserSearchSelect from "../ui/UserSearchSelect";
import MessageModal from "../ui/MessageModal";

const PostView = ({ users, onSend, session, notify }) => {
  const [tab, setTab] = useState("write");
  const [tgt, setTgt] = useState("");
  const [sub, setSub] = useState("");
  const [msg, setMsg] = useState("");
  const [ccList, setCcList] = useState([]);
  const [seal, setSeal] = useState("Normal");
  const [viewMsg, setViewMsg] = useState(null);
  const safeUsers = Array.isArray(users) ? users : [];
  const currentUser = safeUsers.find((u) => u.id === session.id) || session;

  const handleSend = () => {
    if (!tgt || !sub || !msg) return;
    onSend(tgt, sub, msg, ccList, seal);
    setTgt("");
    setCcList([]);
    setSub("");
    setMsg("");
    notify("Le pigeon a été lancé.", "success");
    setTab("inbox");
  };

  return (
    <div className="h-full bg-[#fdf6e3] rounded-2xl border border-stone-300 flex flex-col overflow-hidden relative shadow-md font-serif">
      {viewMsg && (
        <MessageModal message={viewMsg} onClose={() => setViewMsg(null)} />
      )}
      <div className="flex border-b border-stone-300 bg-stone-100 font-sans">
        <button
          onClick={() => setTab("write")}
          className={`flex-1 py-5 font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${
            tab === "write"
              ? "bg-[#fdf6e3] text-stone-900 shadow-inner ring-b-2 ring-stone-800"
              : "text-stone-500 hover:bg-stone-200"
          }`}
        >
          <PenTool size={16} /> Rédiger
        </button>
        <button
          onClick={() => setTab("inbox")}
          className={`flex-1 py-5 font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${
            tab === "inbox"
              ? "bg-[#fdf6e3] text-stone-900 shadow-inner ring-b-2 ring-stone-800"
              : "text-stone-500 hover:bg-stone-200"
          }`}
        >
          <Inbox size={16} /> Poste ({currentUser.messages?.length || 0})
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
        {tab === "write" ? (
          <div className="max-w-lg mx-auto text-center space-y-10 animate-fadeIn font-sans">
            <Mail
              size={56}
              className="mb-6 text-stone-300 mx-auto opacity-40 font-sans hidden md:block"
            />
            <h3 className="text-xl md:text-3xl font-black uppercase tracking-widest text-stone-800 border-b-2 border-stone-300 pb-6 font-sans">
              Correspondance Royale
            </h3>
            <div className="space-y-6 text-left font-sans font-sans">
              <div className="flex flex-col md:flex-row gap-4 font-sans">
                <div className="flex-1 border-2 border-stone-100 rounded-xl bg-white shadow-md font-sans">
                  <UserSearchSelect
                    users={safeUsers}
                    onSelect={setTgt}
                    placeholder="Destinataire principal..."
                    excludeIds={[currentUser.id]}
                    value={tgt}
                  />
                </div>
                <select
                  className="w-full md:w-1/3 p-3 border-2 border-stone-200 rounded-xl bg-white text-xs outline-none focus:border-stone-800 font-black tracking-widest font-sans"
                  value={seal}
                  onChange={(e) => setSeal(e.target.value)}
                >
                  <option>Normal</option>
                  <option>Urgent</option>
                  <option>Royal</option>
                  <option>Secret</option>
                </select>
              </div>
              <div className="flex gap-4 items-center font-sans">
                <div className="flex-1 border-2 border-stone-100 rounded-xl bg-white shadow-md font-sans">
                  <UserSearchSelect
                    users={safeUsers}
                    onSelect={(id) => {
                      if (!ccList.includes(id)) setCcList([...ccList, id]);
                    }}
                    placeholder="+ Ajouter une copie (CC)..."
                    excludeIds={[currentUser.id, tgt, ...ccList]}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 font-sans">
                {ccList.map((id) => (
                  <span
                    key={id}
                    className="bg-white text-[10px] px-3 py-1.5 rounded-lg border-2 border-stone-200 flex items-center gap-3 shadow-sm font-black text-stone-700 font-sans"
                  >
                    {safeUsers.find((u) => u.id === id)?.name}{" "}
                    <button
                      onClick={() => setCcList(ccList.filter((x) => x !== id))}
                      className="text-red-500 font-black hover:scale-150 transition-all font-sans"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                className="w-full p-4 border-2 border-stone-200 rounded-xl text-sm outline-none focus:border-stone-800 bg-white shadow-sm font-serif font-black text-lg font-sans"
                placeholder="Objet de l'envoi..."
                value={sub}
                onChange={(e) => setSub(e.target.value)}
              />
              <textarea
                className="w-full p-6 border-2 border-stone-200 rounded-xl h-48 text-sm outline-none focus:border-stone-800 bg-white shadow-sm font-serif leading-relaxed text-lg italic font-medium font-sans"
                placeholder="Votre message pour les autorités..."
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
              />
              <button
                onClick={handleSend}
                className="w-full bg-stone-800 text-white py-5 rounded-xl uppercase font-black text-[12px] tracking-[0.4em] hover:bg-stone-700 transition-all shadow-2xl active:scale-95 border-b-4 border-black font-sans"
              >
                <Send size={16} className="inline mr-2" /> Lancer le Pigeon
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn font-serif">
            {(currentUser.messages || []).length === 0 && (
              <div className="text-center italic text-stone-400 mt-20 py-24 border-4 border-dashed border-stone-200 rounded-3xl opacity-30 text-xl tracking-widest font-serif">
                Votre poste est vide.
              </div>
            )}
            {(currentUser.messages || []).map((m) => (
              <div
                key={m.id}
                onClick={() => setViewMsg(m)}
                className="bg-white p-6 md:p-8 rounded-2xl border-l-[12px] md:border-l-[16px] border-yellow-600 shadow-lg cursor-pointer hover:bg-yellow-50 transition-all group relative hover:-translate-y-1 font-serif"
              >
                <div className="flex justify-between text-[9px] md:text-[10px] text-stone-400 uppercase mb-4 border-b border-stone-100 pb-2 font-mono tracking-widest font-serif">
                  <span className="font-black text-stone-600 group-hover:text-stone-900 font-serif">
                    Provenance: {m.from}
                  </span>
                  <span>{m.date}</span>
                </div>
                <div className="font-black text-xl md:text-2xl mb-4 text-stone-800 group-hover:text-yellow-900 font-serif">
                  {m.subject}
                </div>
                <p className="text-stone-500 italic text-base md:text-lg leading-relaxed line-clamp-2 font-serif">
                  "{m.content}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostView;
