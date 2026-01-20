import React, { useState, useMemo } from "react";
import {
  Mail,
  Send,
  Inbox,
  PenTool,
  Search,
  Trash2,
  Reply,
  AlertOctagon,
  Star,
  X,
  User,
  Stamp,
  ChevronLeft,
  FileText,
} from "lucide-react";

/* --- SELECTEUR DE CITOYEN (CORRIGÉ Z-INDEX) --- */
const CitizenSelect = ({
  users,
  value,
  onChange,
  isMulti = false,
  label = "Destinataire",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const safeUsers = Array.isArray(users) ? users : [];

  // Filtrage
  const filteredUsers = safeUsers.filter((u) =>
    (u.name || "Inconnu").toLowerCase().includes(search.toLowerCase())
  );

  // Gestion de la sélection
  const handleSelect = (id) => {
    if (isMulti) {
      const current = Array.isArray(value) ? value : [];
      if (current.includes(id)) {
        onChange(current.filter((x) => x !== id));
      } else {
        onChange([...current, id]);
      }
    } else {
      onChange(id);
      setIsOpen(false);
      setSearch("");
    }
  };

  return (
    // CORRECTION ICI : Si ouvert, on passe en z-100 (très haut), sinon z-10 (bas)
    <div className={`relative mb-4 ${isOpen ? "z-[100]" : "z-10"}`}>
      <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest mb-1 block">
        {label}
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-stone-300 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-stone-500 transition-colors shadow-sm"
      >
        <span
          className={
            (!isMulti && value) || (isMulti && value?.length > 0)
              ? "text-stone-900 font-bold"
              : "text-stone-400 italic"
          }
        >
          {!isMulti && safeUsers.find((u) => u.id === value) ? (
            <span className="flex items-center gap-2">
              <User size={14} /> {safeUsers.find((u) => u.id === value).name}
              <span className="text-xs font-normal opacity-50 ml-1">
                ({safeUsers.find((u) => u.id === value).role || "Citoyen"})
              </span>
            </span>
          ) : isMulti && value?.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {value.map((id) => {
                const u = safeUsers.find((x) => x.id === id);
                return (
                  <span
                    key={id}
                    className="bg-stone-200 text-stone-700 px-2 py-0.5 rounded text-xs flex items-center gap-1"
                  >
                    {u ? u.name : "Inconnu"}
                    <span
                      className="cursor-pointer hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(id);
                      }}
                    >
                      ×
                    </span>
                  </span>
                );
              })}
            </span>
          ) : isMulti ? (
            "Ajouter des témoins (CC)..."
          ) : (
            "Choisir un destinataire..."
          )}
        </span>
        <span className="text-xs text-stone-400">▼</span>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-2 w-full bg-stone-800 text-stone-200 rounded-xl shadow-2xl border border-stone-700 max-h-60 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-stone-700">
              <input
                autoFocus
                className="w-full bg-stone-900 border border-stone-600 rounded p-2 text-xs text-white outline-none focus:border-yellow-600"
                placeholder="Rechercher un nom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="overflow-y-auto flex-1 p-1">
              {filteredUsers.length === 0 ? (
                <div className="p-3 text-xs text-stone-500 text-center">
                  Aucun résultat
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = isMulti
                    ? (value || []).includes(user.id)
                    : value === user.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleSelect(user.id)}
                      className={`p-2 cursor-pointer rounded flex items-center gap-3 transition-colors border-b border-white/5 last:border-0 ${
                        isSelected
                          ? "bg-yellow-600 text-stone-900 font-bold"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isSelected
                            ? "bg-stone-900 text-yellow-500"
                            : "bg-stone-700"
                        }`}
                      >
                        {(user.name || "?").substring(0, 1)}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-sm truncate">{user.name}</span>
                        <span
                          className={`text-[10px] uppercase ${
                            isSelected ? "text-stone-800" : "text-stone-500"
                          }`}
                        >
                          {user.role || "Sans grade"}
                        </span>
                      </div>
                      {isSelected && <span className="ml-auto text-xs">✓</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* --- VUE PRINCIPALE --- */
const PostView = ({ users, session, onSend, onUpdateUser, notify }) => {
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [draft, setDraft] = useState({
    to: "",
    cc: [],
    subject: "",
    heading: "",
    content: "",
    seal: "NORMAL",
    tags: "",
    alias: "",
  });

  // --- DONNEES ---
  const rawMessages = useMemo(() => session?.messages || [], [session]);

  const processedMessages = useMemo(() => {
    return rawMessages.map((m) => ({
      ...m,
      isSpam: m.isSpam || false,
      isStarred: m.isStarred || false,
      tags: m.tags || [],
    }));
  }, [rawMessages]);

  const inboxMessages = useMemo(
    () => processedMessages.filter((m) => !m.isSpam),
    [processedMessages]
  );
  const starredMessages = useMemo(
    () => processedMessages.filter((m) => m.isStarred),
    [processedMessages]
  );
  const spamMessages = useMemo(
    () => processedMessages.filter((m) => m.isSpam),
    [processedMessages]
  );

  const sentMessages = useMemo(() => {
    let sent = [];
    const safeUsers = Array.isArray(users) ? users : [];
    safeUsers.forEach((u) => {
      if (u.messages) {
        const mySent = u.messages.filter((m) => m.fromId === session.id);
        const enriched = mySent.map((m) => ({
          ...m,
          toName: u.name,
          folder: "sent",
        }));
        sent = [...sent, ...enriched];
      }
    });
    return sent.sort((a, b) => b.id - a.id);
  }, [users, session.id]);

  const displayedMessages = useMemo(() => {
    let source = [];
    switch (activeFolder) {
      case "inbox":
        source = inboxMessages;
        break;
      case "sent":
        source = sentMessages;
        break;
      case "starred":
        source = starredMessages;
        break;
      case "spam":
        source = spamMessages;
        break;
      default:
        source = inboxMessages;
    }
    return source.filter(
      (m) =>
        m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.from && m.from.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [
    activeFolder,
    inboxMessages,
    sentMessages,
    starredMessages,
    spamMessages,
    searchTerm,
  ]);

  const isReadingOrWriting = isComposing || selectedMsg !== null;

  // --- ACTIONS ---
  const handleCompose = () => {
    setSelectedMsg(null);
    setDraft({
      to: "",
      cc: [],
      subject: "",
      heading: "",
      content: "",
      seal: "NORMAL",
      tags: "",
      alias: "",
    });
    setIsComposing(true);
  };

  const handleBackToList = () => {
    setSelectedMsg(null);
    setIsComposing(false);
  };

  const handleReply = (msg) => {
    if (!msg.fromId) return notify("Expéditeur inconnu.", "error");
    setDraft({
      to: msg.fromId,
      cc: [],
      subject: `Re: ${msg.subject}`,
      heading: "",
      content: `\n\n\n------------------------------\nLe ${msg.date}, ${
        msg.from
      } écrivait :\n> ${msg.content.substring(0, 150)}...`,
      seal: "NORMAL",
      tags: "",
      alias: "",
    });
    setIsComposing(true);
  };

  const handleSend = () => {
    if (!draft.to) return notify("Destinataire manquant.", "error");
    if (!draft.subject.trim()) return notify("Objet vide.", "error");
    if (!draft.content.trim()) return notify("Contenu vide.", "error");

    const tagsArray = draft.tags
      ? draft.tags.split(",").map((t) => t.trim())
      : [];

    // CONSTRUCTION DU MESSAGE FINAL
    let finalContent = "";
    if (draft.heading && draft.heading.trim() !== "") {
      finalContent += `== ${draft.heading.toUpperCase()} ==\n\n`;
    }
    finalContent += draft.content;
    if (draft.alias && draft.alias.trim() !== "") {
      finalContent += `\n\n[Signé : ${draft.alias}]`;
    }

    if (typeof onSend === "function") {
      try {
        onSend(
          draft.to,
          draft.subject,
          finalContent,
          draft.cc,
          draft.seal,
          tagsArray
        );
        notify("Envoyé avec succès.", "success");
        setIsComposing(false);
        setActiveFolder("sent");
        setDraft({
          to: "",
          cc: [],
          subject: "",
          heading: "",
          content: "",
          seal: "NORMAL",
          tags: "",
          alias: "",
        });
      } catch (e) {
        console.error(e);
        notify("Erreur technique lors de l'envoi.", "error");
      }
    } else {
      notify("Erreur : Fonction d'envoi introuvable.", "error");
    }
  };

  const handleUpdateMsg = (msgId, updates) => {
    if (!onUpdateUser) return;
    const newMessages = rawMessages.map((m) =>
      m.id === msgId ? { ...m, ...updates } : m
    );
    onUpdateUser({ ...session, messages: newMessages });
    if (selectedMsg && selectedMsg.id === msgId)
      setSelectedMsg({ ...selectedMsg, ...updates });
  };

  const getSealStyle = (seal) => {
    switch (seal) {
      case "URGENT":
        return "bg-red-700 text-white border-red-900";
      case "OFFICIAL":
        return "bg-blue-800 text-white border-blue-950";
      case "SECRET":
        return "bg-stone-900 text-stone-200 border-black";
      default:
        return "bg-[#b8860b] text-white border-[#8b6508]";
    }
  };

  return (
    <div className="flex w-full h-full bg-[#e6e2d6] rounded-xl overflow-hidden border border-stone-400 shadow-2xl font-sans text-stone-800">
      {/* 1. SIDEBAR */}
      <div className="w-16 md:w-64 bg-stone-900 text-stone-400 flex flex-col border-r border-stone-800 shrink-0 z-20">
        <div className="p-4 md:p-6 border-b border-stone-800">
          <button
            onClick={handleCompose}
            className="w-full bg-[#b8860b] hover:bg-[#d4a017] text-stone-900 py-3 rounded-lg font-black uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 group"
          >
            <PenTool size={16} />{" "}
            <span className="hidden md:inline">Écrire</span>
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            {
              id: "inbox",
              label: "Boîte de Réception",
              icon: Inbox,
              count: inboxMessages.length,
            },
            { id: "sent", label: "Archives d'Envoi", icon: Send, count: 0 },
            {
              id: "starred",
              label: "Prioritaires",
              icon: Star,
              count: starredMessages.length,
            },
            {
              id: "spam",
              label: "Rebuts",
              icon: AlertOctagon,
              count: spamMessages.length,
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveFolder(item.id);
                handleBackToList();
              }}
              className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${
                activeFolder === item.id
                  ? "bg-stone-800 text-[#b8860b] shadow-inner translate-x-1"
                  : "hover:bg-stone-800/50 hover:text-stone-200"
              }`}
            >
              <item.icon
                size={20}
                className={activeFolder === item.id ? "fill-current" : ""}
              />
              <span className="hidden md:flex flex-1 justify-between items-center text-xs font-bold uppercase tracking-wide">
                {item.label}
                {item.count > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                      activeFolder === item.id
                        ? "bg-[#b8860b] text-stone-900"
                        : "bg-stone-700 text-stone-400"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* 2. LISTE */}
      <div
        className={`${
          isReadingOrWriting ? "hidden" : "flex"
        } flex-1 bg-[#f0eee6] flex-col relative z-10 w-full`}
      >
        <div className="p-4 border-b border-stone-300 bg-[#e6e2d6]">
          <div className="relative">
            <input
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-300 rounded-lg text-sm shadow-sm outline-none focus:border-[#b8860b]"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              className="absolute left-3 top-3.5 text-stone-400"
              size={16}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {displayedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-400 opacity-60">
              <Inbox size={48} className="mb-4" />
              <span className="text-sm">Aucun message</span>
            </div>
          ) : (
            displayedMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedMsg(msg);
                  setIsComposing(false);
                }}
                className="p-5 border-b border-stone-200 cursor-pointer transition-all hover:bg-white relative bg-transparent"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm font-bold truncate pr-2 text-stone-700">
                    {activeFolder === "sent"
                      ? `À: ${msg.toName || "Inconnu"}`
                      : msg.from}
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono whitespace-nowrap pt-1">
                    {msg.date}
                  </div>
                </div>
                <div className="text-xs font-bold text-[#b8860b] mb-1 truncate font-serif tracking-wide">
                  {msg.subject}
                </div>
                <div className="text-[10px] text-stone-500 opacity-70 truncate">
                  {msg.content.substring(0, 50)}...
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. LECTURE / ECRITURE */}
      <div
        className={`${
          isReadingOrWriting ? "flex" : "hidden"
        } flex-1 bg-[#fdfbf7] flex-col relative shadow-inner w-full min-w-0`}
      >
        {/* A. ECRITURE */}
        {isComposing && (
          <div className="flex-1 flex flex-col h-full z-10 animate-fadeIn">
            <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-white/50 backdrop-blur-sm">
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 text-stone-600 font-bold hover:text-[#b8860b] transition-colors"
              >
                <ChevronLeft size={20} />{" "}
                <span className="text-xs uppercase tracking-widest">
                  Retour
                </span>
              </button>
              <h3 className="font-black uppercase text-xs text-stone-800 tracking-[0.2em]">
                Nouvelle Missive
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-stone-200">
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {/* DESTINATAIRE */}
                  <CitizenSelect
                    users={users}
                    value={draft.to}
                    onChange={(id) => setDraft({ ...draft, to: id })}
                    label="Destinataire Principal"
                  />

                  {/* COPIES (CC) */}
                  <CitizenSelect
                    users={users}
                    value={draft.cc}
                    onChange={(ids) => setDraft({ ...draft, cc: ids })}
                    isMulti={true}
                    label="Mettre en Copie (CC)"
                  />

                  {/* OBJET (SUBJECT) */}
                  <div className="mt-2">
                    <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest mb-1 block">
                      Objet (Liste)
                    </label>
                    <input
                      className="w-full p-3 border-b-2 border-stone-200 bg-transparent text-sm font-bold text-stone-800 placeholder-stone-300 outline-none focus:border-[#b8860b]"
                      value={draft.subject}
                      onChange={(e) =>
                        setDraft({ ...draft, subject: e.target.value })
                      }
                      placeholder="Ex: Demande de RDV..."
                    />
                  </div>

                  {/* INTITULÉ (HEADING) */}
                  <div className="mt-2">
                    <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest mb-1 block">
                      Intitulé du document (En-tête)
                    </label>
                    <div className="relative">
                      <FileText
                        className="absolute left-3 top-2.5 text-stone-400"
                        size={16}
                      />
                      <input
                        className="w-full pl-10 p-2 bg-stone-50 border border-stone-200 rounded text-sm font-black uppercase tracking-widest text-stone-800 outline-none focus:border-[#b8860b]"
                        value={draft.heading}
                        onChange={(e) =>
                          setDraft({ ...draft, heading: e.target.value })
                        }
                        placeholder="Ex: ACTE DE CESSION"
                      />
                    </div>
                  </div>

                  {/* ALIAS / SIGNATURE */}
                  <div className="mt-2">
                    <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest mb-1 block">
                      Signature (Alias)
                    </label>
                    <input
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-sm text-stone-800 outline-none focus:border-[#b8860b]"
                      value={draft.alias}
                      onChange={(e) =>
                        setDraft({ ...draft, alias: e.target.value })
                      }
                      placeholder="Laisser vide pour votre nom..."
                    />
                  </div>

                  <div className="mt-4">
                    <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest mb-2 block">
                      Sceau
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["NORMAL", "URGENT", "OFFICIAL", "SECRET"].map(
                        (seal) => (
                          <button
                            key={seal}
                            onClick={() => setDraft({ ...draft, seal })}
                            className={`px-3 py-1 text-[10px] font-black uppercase rounded shadow-sm border transition-all ${
                              draft.seal === seal
                                ? getSealStyle(seal)
                                : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"
                            }`}
                          >
                            {seal}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="min-h-[200px] flex flex-col">
                  <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest mb-2 block">
                    Contenu
                  </label>
                  <textarea
                    className="flex-1 w-full p-4 bg-[#fcfaf5] border border-stone-200 rounded-lg font-serif text-stone-800 leading-loose resize-none outline-none focus:bg-white focus:shadow-inner text-base"
                    placeholder="Écrivez votre message ici..."
                    value={draft.content}
                    onChange={(e) =>
                      setDraft({ ...draft, content: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-stone-100">
                  <button
                    onClick={handleSend}
                    className="bg-stone-900 text-[#b8860b] px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-black transition-all"
                  >
                    <Send size={14} /> Envoyer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* B. LECTURE */}
        {!isComposing && selectedMsg && (
          <div className="flex-1 flex flex-col h-full z-10 animate-fadeIn overflow-y-auto">
            <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-white/80 backdrop-blur sticky top-0 z-20">
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 text-stone-600 font-bold hover:text-[#b8860b] transition-colors"
              >
                <ChevronLeft size={20} />{" "}
                <span className="text-xs uppercase tracking-widest">
                  Retour
                </span>
              </button>
              <div className="flex gap-2">
                {activeFolder !== "sent" && (
                  <button
                    onClick={() => handleReply(selectedMsg)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 p-2 rounded-full"
                    title="Répondre"
                  >
                    <Reply size={16} />
                  </button>
                )}
                <button
                  onClick={() =>
                    handleUpdateMsg(selectedMsg.id, {
                      isStarred: !selectedMsg.isStarred,
                    })
                  }
                  className={`p-2 rounded-full ${
                    selectedMsg.isStarred
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-stone-100 text-stone-400"
                  }`}
                >
                  <Star
                    size={16}
                    fill={selectedMsg.isStarred ? "currentColor" : "none"}
                  />
                </button>
                <button
                  onClick={() =>
                    handleUpdateMsg(selectedMsg.id, {
                      isSpam: !selectedMsg.isSpam,
                    })
                  }
                  className={`p-2 rounded-full ${
                    selectedMsg.isSpam
                      ? "bg-red-100 text-red-600"
                      : "bg-stone-100 text-stone-400"
                  }`}
                >
                  <AlertOctagon size={16} />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-10 relative">
              <div className="max-w-3xl mx-auto bg-white shadow-2xl min-h-[500px] relative p-8 border border-stone-100">
                <div className="flex justify-between items-start border-b-2 border-stone-800 pb-6 mb-6 relative">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-lg border-4 border-white ${
                        getSealStyle(selectedMsg.seal).split(" ")[0]
                      }`}
                    >
                      <Mail size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black font-serif text-stone-900 leading-tight mb-1">
                        {selectedMsg.subject}
                      </h2>
                      <div className="flex flex-col text-xs text-stone-500 font-mono uppercase tracking-widest">
                        <span>
                          De :{" "}
                          <strong className="text-stone-900">
                            {selectedMsg.from}
                          </strong>
                        </span>
                        <span className="mt-1">Date : {selectedMsg.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-center justify-center border-4 border-stone-200 text-stone-300 w-24 h-24 rounded-full absolute right-0 top-0 rotate-[-12deg] opacity-70 pointer-events-none mix-blend-multiply">
                    <Stamp size={32} />
                    <span className="font-black uppercase text-[10px] tracking-widest mt-1">
                      Reçu
                    </span>
                  </div>
                </div>

                <div className="font-serif text-lg text-stone-800 leading-loose whitespace-pre-wrap text-justify relative z-10">
                  {selectedMsg.content}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostView;
