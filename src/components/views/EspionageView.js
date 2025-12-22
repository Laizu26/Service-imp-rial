import React, { useState, useMemo } from "react";
import { EyeOff, Search, Stamp, ArrowRight, ArrowLeft } from "lucide-react";

const EspionageView = ({ citizens, session, roleInfo }) => {
  const [selectedMsgId, setSelectedMsgId] = useState(null);
  const [search, setSearch] = useState("");

  const interceptedMessages = useMemo(() => {
    let allMsgs = [];
    const isGlobal = roleInfo.scope === "GLOBAL";
    const myCountryId = session.countryId;
    (citizens || []).forEach((recipient) => {
      if (
        recipient &&
        recipient.messages &&
        Array.isArray(recipient.messages)
      ) {
        recipient.messages.forEach((msg) => {
          const sender = (citizens || []).find((c) => c.id === msg.fromId);
          const senderCountry = sender ? sender.countryId : null;
          const recipientCountry = recipient.countryId;
          if (
            isGlobal ||
            senderCountry === myCountryId ||
            recipientCountry === myCountryId
          ) {
            allMsgs.push({
              ...msg,
              toName: recipient.name || "Inconnu",
              uniqueId: `${recipient.id}-${msg.id}`,
            });
          }
        });
      }
    });
    return allMsgs.sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [citizens, roleInfo, session]);

  const filtered = interceptedMessages.filter(
    (m) =>
      (m.subject || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.from || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.toName || "").toLowerCase().includes(search.toLowerCase())
  );
  const selected = filtered.find((m) => m.uniqueId === selectedMsgId);

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 font-serif">
      <div
        className={`w-full md:w-1/3 bg-[#fdf6e3] rounded-xl border border-stone-300 flex flex-col shadow-md ${
          selected ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-3 border-b border-stone-300 font-bold uppercase text-[10px] tracking-widest flex justify-between items-center bg-stone-100 text-stone-600 font-sans">
          <span className="flex items-center gap-2 font-sans">
            <EyeOff size={14} className="text-red-500 font-sans" /> Cabinet Noir
          </span>
          <span className="bg-red-500 text-white px-1.5 rounded text-[9px] font-sans">
            {filtered.length}
          </span>
        </div>

        <div className="p-2 border-b border-stone-300 font-sans">
          <div className="relative font-sans">
            <Search
              size={12}
              className="absolute left-2 top-2.5 text-stone-500 font-sans"
            />
            <input
              className="w-full p-2 pl-7 bg-white border border-stone-300 rounded text-xs focus:border-red-500 outline-none placeholder-stone-400 font-sans"
              placeholder="Rechercher une cible..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-2 space-y-2 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] font-sans">
          {filtered.map((m) => (
            <div
              key={m.uniqueId}
              onClick={() => setSelectedMsgId(m.uniqueId)}
              className={`p-3 rounded border cursor-pointer transition-colors relative overflow-hidden ${
                selectedMsgId === m.uniqueId
                  ? "bg-red-50 border-red-500 shadow-md"
                  : "bg-white border-stone-200 hover:border-red-300"
              }`}
            >
              <div className="absolute top-1 right-1 opacity-20 transform rotate-12 text-red-800 font-sans">
                <Stamp size={32} />
              </div>
              <div className="flex justify-between mb-1 relative z-10 font-sans">
                <span className="font-bold text-stone-900 text-xs truncate w-2/3 uppercase font-sans">
                  {m.subject || "Sans objet"}
                </span>
                <span className="text-[9px] text-stone-500 font-mono font-sans">
                  {m.date}
                </span>
              </div>
              <div className="flex justify-between items-center text-[9px] uppercase tracking-wide relative z-10 font-bold font-sans">
                <span className="text-stone-700 font-sans">
                  De: {(m.from || "").split("(")[0]}
                </span>
                <ArrowRight size={8} className="text-red-500 font-sans" />
                <span className="text-blue-800 font-sans truncate">
                  À: {m.toName}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-stone-400 text-xs italic font-sans">
              Aucune correspondance interceptée.
            </div>
          )}
        </div>
      </div>

      <div
        className={`flex-1 bg-[#fdf6e3] rounded-xl border border-stone-300 p-6 md:p-8 overflow-auto relative ${
          selected ? "flex flex-col" : "hidden md:flex flex-col"
        }`}
      >
        <button
          onClick={() => {
            setSelectedMsgId(null);
          }}
          className="md:hidden flex items-center gap-2 text-stone-500 font-bold uppercase text-[10px] mb-6 border-b pb-2 font-sans"
        >
          <ArrowLeft size={14} /> Retour
        </button>

        {selected ? (
          <div className="max-w-xl mx-auto w-full font-serif relative bg-white p-6 md:p-10 shadow-lg border border-stone-200 font-sans">
            <div className="absolute top-4 right-4 border-4 border-red-600 text-red-600 font-sans font-black text-xl md:text-3xl uppercase p-2 -rotate-12 pointer-events-none opacity-40 font-sans">
              Intercepté
            </div>

            <div className="border-b-2 border-stone-800 pb-4 mb-6 font-sans">
              <div className="flex justify-between items-end mb-2 font-sans">
                <h2 className="text-xl md:text-2xl font-bold text-stone-900 font-sans">
                  {selected.subject}
                </h2>
                <div className="text-xs font-mono text-stone-500 font-sans">
                  {selected.date}
                </div>
              </div>
              <div className="flex justify-between text-sm font-sans tracking-tight font-sans">
                <div>
                  <span className="font-bold uppercase text-[10px] text-stone-400 block tracking-widest font-sans">
                    Expéditeur
                  </span>
                  <span className="text-stone-800 font-bold font-sans">
                    {selected.from}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold uppercase text-[10px] text-stone-400 block tracking-widest font-sans">
                    Destinataire
                  </span>
                  <span className="text-stone-800 font-bold font-sans">
                    {selected.toName}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-stone-800 leading-relaxed italic whitespace-pre-wrap text-base md:text-lg font-sans">
              "{selected.content}"
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-stone-300 italic flex-col gap-4 font-serif">
            <EyeOff size={64} className="opacity-20 font-serif" />
            <p className="font-serif">Cabinet Noir</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EspionageView;
