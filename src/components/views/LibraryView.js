import React, { useState, useMemo, useEffect } from "react";
import {
  Book,
  Gavel,
  Scroll,
  Bookmark,
  Globe,
  Library,
  Pin,
  Tag,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Star,
  PenLine,
  Eye,
  Clock,
  Lock,
  Check,
  Send,
  X,
} from "lucide-react";
import { formatMoney, toRoman, isNewEntry } from "../../lib/gameUtils";
import SearchInput from "../ui/SearchInput";
import { ROLES } from "../../lib/constants";

// ── Helper functions ──────────────────────────────────────────────────────────

function canAccess(book, session) {
  if (!book.access || book.access === "public") return true;
  if (book.access === "country") return (book.accessCountryIds || []).includes(session?.countryId);
  if (book.access === "roles") return (book.accessRoles || []).includes(session?.role);
  if (book.access === "citizens") return (book.accessCitizenIds || []).includes(session?.id);
  return true;
}

function readingTime(content) {
  const words = (content || "").split(/\s+/).filter(Boolean).length;
  const mins = Math.ceil(words / 200);
  return mins <= 1 ? "< 1 min" : `${mins} min`;
}

function generateLegalCode(laws) {
  const articles = [];
  let count = 1;
  const addArt = (text) => articles.push(`ARTICLE ${toRoman(count++)} : ${text}`);
  if (laws.closeBorders)
    addArt("Fermeture totale des frontières. Aucun visa d'entrée ne sera délivré jusqu'à nouvel ordre.");
  else
    addArt("La libre circulation est autorisée sous réserve d'obtention d'un visa valide.");
  if (laws.forbidExit)
    addArt("Il est strictement interdit aux citoyens de quitter le territoire national (Visa de sortie suspendu).");
  if (laws.entryVisaFee > 0)
    addArt(`Tout étranger souhaitant pénétrer sur le territoire devra s'acquitter d'une taxe douanière de ${formatMoney(laws.entryVisaFee)}.`);
  if (laws.allowWeapons === false)
    addArt("La possession d'armes est strictement prohibée (Classe A). Tout contrevenant s'expose à une confiscation immédiate.");
  else
    addArt("Le port d'arme est autorisé pour les citoyens libres disposant de leurs droits civiques.");
  if (laws.closedCurrency)
    addArt("Protectionnisme Monétaire : La monnaie nationale est fermée. Les transferts entrants depuis l'étranger sont bloqués.");
  if (laws.taxForeignTransfers)
    addArt("Loi de Protection Économique : Tout transfert financier provenant de l'étranger est soumis à une taxe impériale de 10%.");
  if (laws.freezeAssets)
    addArt("État d'Urgence Financière : Les avoirs bancaires sont gelés. Aucun retrait ni virement sortant n'est autorisé.");
  if (laws.allowExternalDebits)
    addArt("Accords de Recouvrement : Les entités étrangères accréditées sont autorisées à effectuer des prélèvements sur les comptes nationaux.");
  if (laws.allowLocalConfiscation)
    addArt("Droit de Réquisition : L'Administration locale se réserve le droit de confisquer les biens et fonds pour l'intérêt supérieur de la Nation.");
  if (laws.allowLocalSales === false)
    addArt("Le commerce entre particuliers est suspendu. Seules les transactions d'État sont autorisées.");
  if (laws.requireRulerApprovalForSales)
    addArt("Contrôle des Marchés : Toute mise en vente de biens ou de contrats nécessite l'approbation du sceau royal.");
  if (laws.militaryServitude)
    addArt("Mobilisation Servile : La population servile (esclaves) est réquisitionnée pour l'effort de guerre et la sécurité.");
  if (laws.banPublicSlaveMarket)
    addArt("Éthique Commerciale : La vente publique d'êtres humains est interdite sur les places de marché.");
  if (laws.allowSelfManumission)
    addArt("Droit de Rachat : Tout esclave disposant des fonds nécessaires a le droit légal d'acheter sa propre liberté (Auto-affranchissement).");
  else
    addArt("Perpétuité : L'affranchissement par rachat personnel est interdit. Seul le maître peut octroyer la liberté.");
  if (laws.mailCensorship)
    addArt("Loi de Vigilance : La Poste Impériale est mandatée pour inspecter et censurer toute correspondance jugée subversive.");
  return articles;
}

function getLawGrid(laws = {}) {
  return [
    { icon: "🌍", ok: !laws.closeBorders, okLabel: "Frontières ouvertes", koLabel: "Frontières fermées" },
    { icon: "🚪", ok: !laws.forbidExit, okLabel: "Sortie libre", koLabel: "Sortie interdite" },
    { icon: "⚔️", ok: laws.allowWeapons !== false, okLabel: "Port d'arme autorisé", koLabel: "Armes interdites" },
    { icon: "💰", ok: !laws.closedCurrency, okLabel: "Monnaie ouverte", koLabel: "Monnaie fermée" },
    { icon: "🏦", ok: !laws.freezeAssets, okLabel: "Avoirs libres", koLabel: "Avoirs gelés" },
    { icon: "🔓", ok: !!laws.allowSelfManumission, okLabel: "Affranchissement possible", koLabel: "Affranchissement interdit" },
    { icon: "✉️", ok: !laws.mailCensorship, okLabel: "Courrier libre", koLabel: "Censure postale" },
    { icon: "🛒", ok: laws.allowLocalSales !== false, okLabel: "Commerce libre", koLabel: "Commerce suspendu" },
  ];
}

function AccessBadge({ book, countries }) {
  if (!book.access || book.access === "public") return null;
  if (book.access === "country") {
    const names = (book.accessCountryIds || [])
      .map((id) => (countries || []).find((c) => c.id === id)?.name || id)
      .join(", ");
    return (
      <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">
        <Lock size={7} /> {names}
      </span>
    );
  }
  if (book.access === "roles") {
    const names = (book.accessRoles || []).map((r) => ROLES[r]?.label || r).join(", ");
    return (
      <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full">
        <Lock size={7} /> {names}
      </span>
    );
  }
  if (book.access === "citizens") {
    return (
      <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-full">
        <Lock size={7} /> Accès restreint
      </span>
    );
  }
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

const LibraryView = ({ countries, session, users = [], onSubmitBook, bookmarks: cloudBookmarks, onBookmarksChange }) => {
  const [activeTab, setActiveTab] = useState("empire");
  const [viewingCountryId, setViewingCountryId] = useState(session?.countryId);
  const [search, setSearch] = useState("");
  const [readingItem, setReadingItem] = useState(null);
  const [expandedDecreeId, setExpandedDecreeId] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortBooks, setSortBooks] = useState("date");

  // Signets : cloud en priorité, localStorage en fallback
  const [bookmarks, setBookmarks] = useState(() => {
    if (Array.isArray(cloudBookmarks)) return new Set(cloudBookmarks.map(String));
    try {
      return new Set(JSON.parse(localStorage.getItem("imperial_bookmarks") || "[]"));
    } catch {
      return new Set();
    }
  });

  // Sync depuis le cloud si les signets changent sur un autre appareil
  useEffect(() => {
    if (!Array.isArray(cloudBookmarks)) return;
    setBookmarks(new Set(cloudBookmarks.map(String)));
  }, [cloudBookmarks]);

  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [writeCategory, setWriteCategory] = useState("");
  const [writeSubmitted, setWriteSubmitted] = useState(false);
  const [legalCodeExpanded, setLegalCodeExpanded] = useState(false);

  const safeCountries = useMemo(() => (Array.isArray(countries) ? countries : []), [countries]);
  const currentCountry = useMemo(
    () => safeCountries.find((c) => c.id === viewingCountryId) || safeCountries[0],
    [safeCountries, viewingCountryId]
  );

  const toggleBookmark = (id) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(String(id))) next.delete(String(id));
      else next.add(String(id));
      const arr = [...next];
      if (onBookmarksChange) {
        onBookmarksChange(arr);
      } else {
        localStorage.setItem("imperial_bookmarks", JSON.stringify(arr));
      }
      return next;
    });
  };

  // ── Empire-wide new items count ──
  const empireNewItems = useMemo(() => {
    let count = 0;
    safeCountries.forEach((c) => {
      (c.books || []).forEach((b) => {
        if (canAccess(b, session) && isNewEntry(b.date, 14)) count++;
      });
      (c.decrees || []).forEach((d) => {
        if (isNewEntry(d.date, 14)) count++;
      });
    });
    return count;
  }, [safeCountries, session]);

  // ── Current country accessible books ──
  const accessibleBooks = useMemo(() => {
    if (!currentCountry) return [];
    return (currentCountry.books || []).filter((b) => canAccess(b, session));
  }, [currentCountry, session]);

  // ── Legal code ──
  const legalCode = useMemo(
    () => generateLegalCode(currentCountry?.laws || {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentCountry?.laws]
  );

  const lawGrid = useMemo(() => getLawGrid(currentCountry?.laws || {}), [currentCountry?.laws]);

  // ── Decrees ──
  const sortedDecrees = useMemo(() => {
    const all = currentCountry?.decrees || [];
    return [...all.filter((d) => d.pinned), ...all.filter((d) => !d.pinned)];
  }, [currentCountry]);

  const filteredDecrees = useMemo(() => {
    if (!search) return sortedDecrees;
    const q = search.toLowerCase();
    return sortedDecrees.filter(
      (d) => d.name?.toLowerCase().includes(q) || d.content?.toLowerCase().includes(q)
    );
  }, [sortedDecrees, search]);

  // ── Books ──
  const bookCategories = useMemo(
    () => [...new Set(accessibleBooks.map((b) => b.category).filter(Boolean))],
    [accessibleBooks]
  );

  const filteredBooks = useMemo(() => {
    let books = accessibleBooks;
    if (search) {
      const q = search.toLowerCase();
      books = books.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q) ||
          b.category?.toLowerCase().includes(q) ||
          b.content?.toLowerCase().includes(q)
      );
    }
    if (activeCategory) books = books.filter((b) => b.category === activeCategory);
    if (sortBooks === "alpha") books = [...books].sort((a, b) => (a.title || "").localeCompare(b.title || "", "fr"));
    else if (sortBooks === "author") books = [...books].sort((a, b) => (a.author || "").localeCompare(b.author || "", "fr"));
    else books = [...books].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return books;
  }, [accessibleBooks, search, activeCategory, sortBooks]);

  // ── Bookmarked items ──
  const bookmarkedItems = useMemo(() => {
    const items = [];
    safeCountries.forEach((c) => {
      (c.books || []).forEach((b) => {
        if (bookmarks.has(String(b.id))) items.push({ ...b, _type: "book", _countryName: c.name });
      });
      (c.decrees || []).forEach((d) => {
        if (bookmarks.has(String(d.id))) items.push({ ...d, _type: "decree", _countryName: c.name });
      });
    });
    return items;
  }, [safeCountries, bookmarks]);

  // ── Empire feed ──
  const empireFeed = useMemo(() => {
    const items = [];
    safeCountries.forEach((c) => {
      (c.books || []).forEach((b) => {
        if (canAccess(b, session) && isNewEntry(b.date, 14)) {
          items.push({ ...b, _type: "book", _countryName: c.name, _countryId: c.id });
        }
      });
      (c.decrees || []).forEach((d) => {
        if (isNewEntry(d.date, 14)) {
          items.push({ ...d, _type: "decree", _countryName: c.name, _countryId: c.id });
        }
      });
    });
    return items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [safeCountries, session]);

  // ── Write form ──
  const writeWordCount = writeContent.split(/\s+/).filter(Boolean).length;
  const writeCanSubmit = writeTitle.trim().length > 0 && writeContent.length >= 100;

  const handleWriteSubmit = () => {
    if (!writeCanSubmit) return;
    if (onSubmitBook) {
      onSubmitBook(session?.countryId, {
        title: writeTitle.trim(),
        category: writeCategory.trim(),
        content: writeContent,
      });
      setWriteSubmitted(true);
      setWriteTitle("");
      setWriteContent("");
      setWriteCategory("");
    }
  };

  // ── Paper texture background ──
  const paperTextureBg = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2z' fill='%2357534e' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C%2Fsvg%3E")`,
  };

  // ── Reading view ──────────────────────────────────────────────────────────
  if (readingItem) {
    const isBook = readingItem._type !== "decree";
    const itemId = readingItem.id;
    const isBookmarked = bookmarks.has(String(itemId));
    return (
      <div className="h-full flex flex-col font-serif bg-[#fdf6e3] rounded-2xl shadow-xl overflow-hidden border border-stone-300">
        <div className="bg-stone-900 text-stone-200 px-6 py-4 flex items-center gap-4 shrink-0 border-b-4 border-yellow-600">
          <button
            onClick={() => setReadingItem(null)}
            className="flex items-center gap-2 text-stone-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={16} /> Retour
          </button>
          <div className="w-px h-6 bg-stone-700" />
          <div className="flex-1 min-w-0">
            <span className="text-white font-black text-sm uppercase tracking-widest truncate block">
              {isBook ? readingItem.title : readingItem.name}
            </span>
            {isBook && readingItem.author && (
              <span className="text-stone-400 text-xs italic">par {readingItem.author}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isBook && (
              <span className="text-[9px] font-mono text-stone-400 flex items-center gap-1">
                <Clock size={10} /> {readingTime(readingItem.content)}
              </span>
            )}
            {isBook && readingItem.category && (
              <span className="text-[9px] font-black uppercase tracking-widest bg-stone-700 text-stone-300 px-2 py-1 rounded-full flex items-center gap-1">
                <Tag size={9} /> {readingItem.category}
              </span>
            )}
            <AccessBadge book={readingItem} countries={safeCountries} />
            <button
              onClick={() => toggleBookmark(itemId)}
              className={`p-2 rounded-full transition-colors ${isBookmarked ? "text-yellow-400 bg-stone-700" : "text-stone-500 hover:text-yellow-400 hover:bg-stone-700"}`}
              title={isBookmarked ? "Retirer des signets" : "Ajouter aux signets"}
            >
              <Star size={16} fill={isBookmarked ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-[#fdf6e3]" style={paperTextureBg}>
          <div className="max-w-3xl mx-auto bg-white/90 p-8 md:p-16 shadow-2xl border border-stone-200 relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-stone-300 border-l border-dashed border-stone-400" />
            <div className="pl-8">
              <h1 className="text-3xl md:text-4xl font-black text-stone-900 mb-2 font-serif border-b-2 border-stone-300 pb-4">
                {isBook ? readingItem.title : readingItem.name}
              </h1>
              {isBook && readingItem.author && (
                <p className="text-sm italic text-stone-500 mb-2 font-serif">par {readingItem.author}</p>
              )}
              {readingItem.date && (
                <p className="text-[10px] uppercase text-stone-400 font-bold tracking-widest mb-8">
                  {new Date(readingItem.date).toLocaleDateString("fr-FR")}
                </p>
              )}
              <div className="font-serif text-lg leading-loose text-stone-800 whitespace-pre-line text-justify">
                {isBook ? readingItem.content : readingItem.content}
              </div>
              <div className="mt-16 pt-6 border-t border-stone-200 text-right text-[10px] uppercase font-bold text-stone-400 tracking-widest">
                Archivé le {new Date(readingItem.date || Date.now()).toLocaleDateString("fr-FR")}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col font-serif bg-[#fdf6e3] rounded-2xl shadow-xl overflow-hidden border border-stone-300">
      {/* HEADER */}
      <div className="bg-stone-900 text-stone-200 px-4 py-3 flex flex-col gap-3 shrink-0 border-b-4 border-yellow-600 shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-stone-800 rounded-full border border-stone-600 shadow">
            <Library size={20} className="text-yellow-600" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white">Bibliothèque Impériale</h2>
        </div>

        {/* TABS */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {/* Nouveautés */}
          <button
            onClick={() => { setActiveTab("empire"); setSearch(""); setReadingItem(null); }}
            className={`flex-shrink-0 px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${
              activeTab === "empire" ? "bg-[#fdf6e3] text-stone-900 shadow-md" : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            }`}
          >
            <Globe size={13} /> Nouveautés
            {empireNewItems > 0 && (
              <span className={`text-[8px] px-1 py-0.5 rounded-full font-black ${activeTab === "empire" ? "bg-green-600 text-white" : "bg-green-700 text-green-100"}`}>
                {empireNewItems}
              </span>
            )}
          </button>

          {/* Législation */}
          <button
            onClick={() => { setActiveTab("laws"); setSearch(""); setReadingItem(null); setExpandedDecreeId(null); }}
            className={`flex-shrink-0 px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${
              activeTab === "laws" ? "bg-[#fdf6e3] text-stone-900 shadow-md" : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            }`}
          >
            <Gavel size={13} /> Législation
          </button>

          {/* Ouvrages */}
          <button
            onClick={() => { setActiveTab("books"); setSearch(""); setActiveCategory(null); setReadingItem(null); }}
            className={`flex-shrink-0 px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${
              activeTab === "books" ? "bg-[#fdf6e3] text-stone-900 shadow-md" : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            }`}
          >
            <Book size={13} /> Ouvrages
            {accessibleBooks.length > 0 && (
              <span className={`text-[8px] px-1 py-0.5 rounded-full font-black ${activeTab === "books" ? "bg-stone-800 text-white" : "bg-stone-700 text-stone-300"}`}>
                {accessibleBooks.length}
              </span>
            )}
          </button>

          {/* Signets */}
          <button
            onClick={() => { setActiveTab("bookmarks"); setSearch(""); setReadingItem(null); }}
            className={`flex-shrink-0 px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${
              activeTab === "bookmarks" ? "bg-[#fdf6e3] text-stone-900 shadow-md" : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            }`}
          >
            <Bookmark size={13} /> Signets
            {bookmarks.size > 0 && (
              <span className={`text-[8px] px-1 py-0.5 rounded-full font-black ${activeTab === "bookmarks" ? "bg-amber-600 text-white" : "bg-amber-700 text-amber-100"}`}>
                {bookmarks.size}
              </span>
            )}
          </button>

          {/* Écrire */}
          <button
            onClick={() => { setActiveTab("write"); setWriteSubmitted(false); }}
            className={`flex-shrink-0 px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${
              activeTab === "write" ? "bg-[#fdf6e3] text-stone-900 shadow-md" : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            }`}
          >
            <PenLine size={13} /> Écrire
          </button>
        </div>
      </div>

      {/* COUNTRY SELECTOR (laws + books tabs) */}
      {(activeTab === "laws" || activeTab === "books") && (
        <div className="bg-stone-800/70 px-4 py-2 flex gap-2 overflow-x-auto shrink-0 border-b border-stone-700">
          {safeCountries.map((c) => (
            <button
              key={c.id}
              onClick={() => setViewingCountryId(c.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                viewingCountryId === c.id
                  ? "bg-amber-500 text-stone-900 border-amber-400 shadow"
                  : "bg-stone-700 text-stone-400 border-stone-600 hover:text-stone-200 hover:border-stone-500"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto relative bg-[#fdf6e3]">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={paperTextureBg} />

        <div className="relative z-10 p-4 md:p-8">

          {/* ── TAB: EMPIRE (Nouveautés) ── */}
          {activeTab === "empire" && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <Globe size={18} className="text-stone-400" />
                <h3 className="font-black uppercase text-xs tracking-widest text-stone-500">
                  Actualités Impériales — 14 derniers jours
                </h3>
              </div>

              {empireFeed.length === 0 ? (
                <div className="bg-white/80 rounded-xl p-12 text-center border border-stone-200 shadow-sm">
                  <Globe size={32} className="mx-auto text-stone-300 mb-3" />
                  <p className="italic text-stone-400 font-serif">Aucune nouveauté récente dans l'Empire.</p>
                </div>
              ) : (
                empireFeed.map((item, idx) => {
                  const isDecree = item._type === "decree";
                  return (
                    <div
                      key={item.id || idx}
                      className={`bg-white/90 rounded-lg border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                        isDecree ? "border-l-4 border-l-amber-500 border-stone-200" : "border-l-4 border-l-stone-400 border-stone-200"
                      }`}
                      onClick={() => setReadingItem({ ...item, _type: isDecree ? "decree" : "book" })}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isDecree ? "bg-amber-100" : "bg-stone-100"}`}>
                            {isDecree ? <Scroll size={14} className="text-amber-700" /> : <Book size={14} className="text-stone-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <h4 className="font-bold text-stone-900 text-sm">
                                {isDecree ? item.name : item.title}
                              </h4>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[8px] font-black uppercase tracking-widest bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                  Nouveau
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-stone-400 font-mono">
                                {item._countryName}
                              </span>
                              {item.date && (
                                <span className="text-[10px] text-stone-300 font-mono">
                                  · {new Date(item.date).toLocaleDateString("fr-FR")}
                                </span>
                              )}
                              {!isDecree && item.author && (
                                <span className="text-[10px] italic text-stone-400">par {item.author}</span>
                              )}
                              {!isDecree && (
                                <span className="text-[9px] text-stone-400 flex items-center gap-0.5">
                                  <Clock size={9} /> {readingTime(item.content)}
                                </span>
                              )}
                            </div>
                            {!isDecree && item.category && (
                              <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full mt-1">
                                <Tag size={7} /> {item.category}
                              </span>
                            )}
                            <p className="text-xs text-stone-500 mt-2 line-clamp-2 font-serif italic">
                              {(item.content || "").substring(0, 100)}…
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── TAB: LÉGISLATION ── */}
          {activeTab === "laws" && currentCountry && (
            <div className="max-w-3xl mx-auto space-y-6">

              {/* Law grid summary */}
              <div className="bg-white/90 rounded-xl border border-stone-200 shadow-sm p-6">
                <h3 className="font-black uppercase text-xs tracking-widest text-stone-500 mb-4 flex items-center gap-2">
                  <Gavel size={14} /> Résumé des Lois — {currentCountry.name}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {lawGrid.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border ${
                        item.ok
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="leading-tight">{item.ok ? item.okLabel : item.koLabel}</span>
                    </div>
                  ))}
                </div>

                {/* Collapsible full legal text */}
                <div className="mt-4 border-t border-stone-100 pt-4">
                  <button
                    onClick={() => setLegalCodeExpanded((v) => !v)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500 hover:text-stone-800 transition-colors"
                  >
                    {legalCodeExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    Texte officiel complet
                  </button>
                  {legalCodeExpanded && (
                    <div className="mt-4 space-y-3 font-serif text-sm text-stone-700 leading-relaxed">
                      {legalCode.map((art, i) => (
                        <p key={i} className="border-l-2 border-stone-200 pl-3">{art}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Country info strip */}
              <div className="bg-white/90 rounded-xl border border-stone-200 shadow-sm p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-stone-600">
                    Souverain : <span className="text-stone-900">{currentCountry.rulerName || "Vacant"}</span>
                  </span>
                  <span className="text-xs font-bold text-stone-600">
                    Population : <span className="text-stone-900">{(currentCountry.population || 0).toLocaleString("fr-FR")}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    Stabilité {currentCountry.stability ?? "—"}%
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-green-100 text-green-700">
                    Sécurité {currentCountry.security ?? "—"}%
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                    Prospérité {currentCountry.prosperity ?? "—"}%
                  </span>
                </div>
              </div>

              {/* Decrees */}
              <div className="bg-white/90 rounded-xl border border-stone-200 shadow-sm p-6">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <h3 className="font-black uppercase text-xs tracking-widest text-stone-500 flex items-center gap-2">
                    <Scroll size={14} /> Décrets Royaux
                    {(currentCountry.decrees || []).length > 0 && (
                      <span className="bg-stone-200 text-stone-600 text-[8px] px-1.5 py-0.5 rounded-full font-black">
                        {(currentCountry.decrees || []).length}
                      </span>
                    )}
                  </h3>
                  <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Chercher un décret…"
                    className="max-w-xs"
                  />
                </div>

                {(currentCountry.decrees || []).length === 0 ? (
                  <p className="italic text-stone-400 text-sm font-serif text-center py-6">
                    Le silence règne. Aucun décret n'a été proclamé.
                  </p>
                ) : filteredDecrees.length === 0 ? (
                  <p className="italic text-stone-400 text-sm font-serif text-center py-6">
                    Aucun décret ne correspond à « {search} ».
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredDecrees.map((d, i) => {
                      const expanded = expandedDecreeId === (d.id || i);
                      return (
                        <div
                          key={d.id || i}
                          className={`border-l-4 rounded-r-lg transition-colors ${
                            d.pinned ? "border-amber-500 bg-amber-50" : "border-stone-300 bg-stone-50 hover:border-stone-400"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 px-4 py-3">
                            <button
                              onClick={() => setExpandedDecreeId(expanded ? null : (d.id || i))}
                              className="flex items-start gap-2 flex-1 text-left group min-w-0"
                            >
                              <div className="shrink-0 mt-0.5">
                                {d.pinned
                                  ? <Pin size={13} className="text-amber-600" fill="#d97706" />
                                  : <Scroll size={13} className="text-stone-400" />
                                }
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-stone-800 group-hover:text-stone-900">
                                    {d.name || `Proclamation N°${i + 1}`}
                                  </span>
                                  {d.pinned && (
                                    <span className="text-[8px] font-black uppercase tracking-widest bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">
                                      📌 Épinglé
                                    </span>
                                  )}
                                  {isNewEntry(d.date) && (
                                    <span className="text-[8px] font-black uppercase tracking-widest bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                      Nouveau
                                    </span>
                                  )}
                                </div>
                                {!expanded && d.content && (
                                  <p className="text-xs text-stone-500 italic mt-0.5 truncate">
                                    {d.content.substring(0, 80)}…
                                  </p>
                                )}
                                {d.date && (
                                  <span className="text-[9px] text-stone-300 font-mono">
                                    {new Date(d.date).toLocaleDateString("fr-FR")}
                                  </span>
                                )}
                              </div>
                            </button>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setReadingItem({ ...d, _type: "decree" })}
                                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                                title="Lire en plein écran"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                onClick={() => setExpandedDecreeId(expanded ? null : (d.id || i))}
                                className="p-1.5 text-stone-400 hover:text-stone-600 rounded transition-colors"
                              >
                                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </button>
                            </div>
                          </div>
                          {expanded && (
                            <div className="px-4 pb-4 pt-1 border-t border-stone-200">
                              <div className="font-serif text-sm text-stone-800 leading-loose whitespace-pre-line text-justify">
                                {d.content}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: OUVRAGES ── */}
          {activeTab === "books" && currentCountry && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Search + filters */}
              <div className="bg-white/90 rounded-xl border border-stone-200 shadow-sm p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Chercher un ouvrage…"
                    className="flex-1 min-w-[160px]"
                  />
                  <div className="flex bg-stone-100 rounded-lg p-0.5 gap-0.5 shrink-0">
                    {[
                      { key: "date", label: "Date" },
                      { key: "alpha", label: "A-Z" },
                      { key: "author", label: "Auteur" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setSortBooks(opt.key)}
                        className={`px-2.5 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-colors ${
                          sortBooks === opt.key ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {bookCategories.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {bookCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                        className={`flex-shrink-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                          activeCategory === cat
                            ? "bg-amber-500 text-stone-900 border-amber-400"
                            : "bg-stone-100 text-stone-500 border-stone-200 hover:border-stone-400"
                        }`}
                      >
                        <Tag size={8} /> {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Country static info (only when no search/filter) */}
              {!search && !activeCategory && currentCountry.description && (
                <>
                  <div className="bg-white/90 rounded-xl border border-stone-200 shadow-sm p-6">
                    <h3 className="font-serif font-bold text-xl text-stone-900 mb-3 flex items-center gap-2">
                      <Book size={16} className="text-stone-400" />
                      Chroniques de {currentCountry.name}
                    </h3>
                    <div className="font-serif text-base leading-relaxed text-stone-700 italic border-l-2 border-stone-300 pl-4">
                      {currentCountry.description}
                    </div>
                    {currentCountry.specialty && (
                      <div className="mt-4 pt-4 border-t border-stone-100 text-xs font-sans uppercase tracking-widest text-stone-500">
                        Spécialité Nationale :{" "}
                        <span className="text-stone-800 font-bold">{currentCountry.specialty}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/90 rounded-xl border border-stone-200 shadow-sm p-6">
                    <h3 className="font-serif font-bold text-xl text-stone-900 mb-3 flex items-center gap-2">
                      <Book size={16} className="text-stone-400" />
                      Almanach de la Noblesse
                    </h3>
                    <p className="font-serif text-stone-700 mb-4">
                      Cette terre est actuellement sous la gouvernance de{" "}
                      <strong className="text-stone-900">{currentCountry.rulerName}</strong>. Sa population s'élève à{" "}
                      <strong>{(currentCountry.population || 0).toLocaleString("fr-FR")}</strong> âmes recensées.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono border-t border-stone-200 pt-3">
                      <div>
                        <span className="block text-stone-400 uppercase text-[9px] mb-1">Stabilité</span>
                        <span className="font-bold text-lg">{currentCountry.stability ?? "—"}%</span>
                      </div>
                      <div>
                        <span className="block text-stone-400 uppercase text-[9px] mb-1">Sécurité</span>
                        <span className="font-bold text-lg">{currentCountry.security ?? "—"}%</span>
                      </div>
                      <div>
                        <span className="block text-stone-400 uppercase text-[9px] mb-1">Prospérité</span>
                        <span className="font-bold text-lg">{currentCountry.prosperity ?? "—"}%</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Book grid */}
              {accessibleBooks.length === 0 ? (
                <div className="bg-white/80 rounded-xl p-12 text-center border border-stone-200 shadow-sm">
                  <Book size={32} className="mx-auto text-stone-300 mb-3" />
                  <p className="italic text-stone-400 font-serif">Aucun ouvrage disponible dans cette bibliothèque.</p>
                </div>
              ) : filteredBooks.length === 0 ? (
                <div className="bg-white/80 rounded-xl p-8 text-center border border-stone-200 shadow-sm">
                  <p className="italic text-stone-400 font-serif">Aucun ouvrage ne correspond à votre recherche.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBooks.map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => setReadingItem({ ...book, _type: "book" })}
                      className="bg-white/90 border border-stone-200 shadow-sm rounded-xl overflow-hidden group hover:shadow-md transition-shadow text-left"
                    >
                      <div className="relative p-5 pr-14">
                        {/* bookmark decoration */}
                        <div className="absolute top-0 right-8 w-5 h-8 bg-red-800 shadow-sm" />
                        <div className="flex items-start gap-2 mb-2">
                          <h3 className="font-serif font-bold text-lg text-stone-900 flex-1 line-clamp-2 leading-tight">
                            {book.title}
                          </h3>
                          {isNewEntry(book.date) && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full shrink-0 mt-1">
                              Nouveau
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {book.category && (
                            <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">
                              <Tag size={7} /> {book.category}
                            </span>
                          )}
                          <AccessBadge book={book} countries={safeCountries} />
                        </div>
                        {book.author && (
                          <p className="text-xs italic text-stone-500 mb-2 font-serif">par {book.author}</p>
                        )}
                        <div className="font-serif text-sm leading-relaxed text-stone-600 line-clamp-3 mb-3">
                          {book.content}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                          <span className="text-[9px] text-stone-400 flex items-center gap-1">
                            <Clock size={9} /> {readingTime(book.content)}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-stone-300">
                            {new Date(book.date || Date.now()).toLocaleDateString("fr-FR")}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-stone-500 group-hover:text-stone-900 transition-colors tracking-widest">
                            Lire →
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: SIGNETS ── */}
          {activeTab === "bookmarks" && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Star size={16} className="text-amber-500" fill="currentColor" />
                <h3 className="font-black uppercase text-xs tracking-widest text-stone-500">
                  Votre liste de lecture ({bookmarks.size} signet{bookmarks.size !== 1 ? "s" : ""})
                </h3>
              </div>

              {bookmarkedItems.length === 0 ? (
                <div className="bg-white/80 rounded-xl p-12 text-center border border-stone-200 shadow-sm">
                  <Bookmark size={32} className="mx-auto text-stone-300 mb-3" />
                  <p className="italic text-stone-400 font-serif">Votre liste de lecture est vide.</p>
                  <p className="text-xs text-stone-400 mt-2">Ajoutez des signets en lisant un ouvrage ou un décret.</p>
                </div>
              ) : (
                bookmarkedItems.map((item, idx) => {
                  const isDecree = item._type === "decree";
                  return (
                    <div
                      key={item.id || idx}
                      className={`bg-white/90 rounded-xl border shadow-sm overflow-hidden ${
                        isDecree ? "border-l-4 border-l-amber-400 border-stone-200" : "border-l-4 border-l-stone-400 border-stone-200"
                      }`}
                    >
                      <div className="p-4 flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${isDecree ? "bg-amber-100" : "bg-stone-100"}`}>
                          {isDecree ? <Scroll size={14} className="text-amber-700" /> : <Book size={14} className="text-stone-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => setReadingItem(item)}
                            className="text-left w-full group"
                          >
                            <h4 className="font-bold text-stone-900 group-hover:underline text-sm">
                              {isDecree ? item.name : item.title}
                            </h4>
                          </button>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[9px] text-stone-400">{item._countryName}</span>
                            {!isDecree && item.author && (
                              <span className="text-[9px] italic text-stone-400">par {item.author}</span>
                            )}
                            {!isDecree && item.category && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">
                                <Tag size={7} /> {item.category}
                              </span>
                            )}
                            {item.date && (
                              <span className="text-[9px] text-stone-300 font-mono">
                                {new Date(item.date).toLocaleDateString("fr-FR")}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleBookmark(item.id)}
                          className="shrink-0 text-[9px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded border border-red-200 transition-colors flex items-center gap-1"
                          title="Retirer des signets"
                        >
                          <X size={10} /> Retirer
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── TAB: ÉCRIRE ── */}
          {activeTab === "write" && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/90 rounded-xl border border-stone-200 shadow-sm p-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="p-2 bg-stone-100 rounded-lg">
                    <PenLine size={18} className="text-stone-600" />
                  </div>
                  <div>
                    <h3 className="font-black uppercase text-sm tracking-widest text-stone-800">
                      Soumettre un texte à la Bibliothèque
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 font-serif italic">
                      Votre texte sera examiné par l'administration avant publication.
                    </p>
                  </div>
                </div>

                {!onSubmitBook ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-amber-700 font-serif italic">Fonctionnalité non disponible.</p>
                  </div>
                ) : writeSubmitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                    <Check size={32} className="mx-auto text-green-500 mb-3" />
                    <h4 className="font-bold text-green-800 mb-2">Texte soumis avec succès !</h4>
                    <p className="text-sm text-green-700 font-serif italic mb-4">
                      Votre texte a été transmis à l'administration pour examen.
                    </p>
                    <button
                      onClick={() => { setWriteSubmitted(false); }}
                      className="px-4 py-2 bg-green-700 text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-green-800 transition-colors"
                    >
                      Soumettre un autre texte
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1 block">
                        Titre <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="w-full p-3 border border-stone-300 rounded-lg font-serif font-bold text-base outline-none focus:border-stone-700 focus:ring-1 focus:ring-stone-300 transition"
                        placeholder="Titre de votre texte…"
                        value={writeTitle}
                        onChange={(e) => setWriteTitle(e.target.value)}
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1 block">
                        Catégorie <span className="text-stone-300 text-[9px] normal-case font-normal">(optionnel)</span>
                      </label>
                      <input
                        className="w-full p-3 border border-stone-300 rounded-lg text-sm outline-none focus:border-stone-700 transition"
                        placeholder="Ex: Histoire, Poésie, Mémoires…"
                        value={writeCategory}
                        onChange={(e) => setWriteCategory(e.target.value)}
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1 block">
                        Contenu <span className="text-red-500">*</span>
                        <span className="text-stone-300 text-[9px] normal-case font-normal ml-1">(minimum 100 caractères)</span>
                      </label>
                      <textarea
                        className="w-full p-4 border border-stone-300 rounded-lg text-sm font-serif leading-relaxed outline-none focus:border-stone-700 transition min-h-[200px] resize-y"
                        placeholder="Rédigez votre texte ici…"
                        value={writeContent}
                        onChange={(e) => setWriteContent(e.target.value)}
                      />
                      <div className="flex justify-between mt-1">
                        <span className={`text-[9px] font-bold ${writeContent.length < 100 ? "text-red-400" : "text-green-600"}`}>
                          {writeContent.length} caractères
                          {writeContent.length < 100 && ` (encore ${100 - writeContent.length} requis)`}
                        </span>
                        <span className="text-[9px] text-stone-400">{writeWordCount} mots</span>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleWriteSubmit}
                      disabled={!writeCanSubmit}
                      className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow"
                    >
                      <Send size={14} /> Soumettre pour examen
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LibraryView;
