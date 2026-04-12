import React, { useState, useEffect } from "react";
import {
  Book,
  Gavel,
  Scroll,
  Bookmark,
  Globe,
  Library,
  Search,
  Pin,
  Tag,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatMoney } from "../../lib/gameUtils";

const LibraryView = ({ countries, session }) => {
  const [activeTab, setActiveTab] = useState("codes");
  const [viewingCountryId, setViewingCountryId] = useState(
    session?.countryId
  );
  const [search, setSearch] = useState("");
  const [readingBook, setReadingBook] = useState(null);   // null | book object
  const [expandedDecreeId, setExpandedDecreeId] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  const safeCountries = Array.isArray(countries) ? countries : [];

  const currentCountry =
    safeCountries.find((c) => c.id === viewingCountryId) || safeCountries[0];

  useEffect(() => {
    if (!viewingCountryId && session?.countryId) {
      setViewingCountryId(session.countryId);
    }
  }, [session, viewingCountryId]);

  // Réinitialiser la recherche et la lecture quand on change de pays ou d'onglet
  useEffect(() => {
    setSearch("");
    setReadingBook(null);
    setExpandedDecreeId(null);
  }, [viewingCountryId, activeTab]);

  if (!currentCountry)
    return (
      <div className="p-8 text-center italic text-stone-500">
        Chargement des archives…
      </div>
    );

  // --- GÉNÉRATEUR DE TEXTE JURIDIQUE ---
  const generateLegalCode = () => {
    const laws = currentCountry.laws || {};
    const articles = [];
    let count = 1;
    const addArt = (text) =>
      articles.push(`ARTICLE ${toRoman(count++)} : ${text}`);

    if (laws.closeBorders)
      addArt(
        "Fermeture totale des frontières. Aucun visa d'entrée ne sera délivré jusqu'à nouvel ordre."
      );
    else
      addArt(
        "La libre circulation est autorisée sous réserve d'obtention d'un visa valide."
      );

    if (laws.forbidExit)
      addArt(
        "Il est strictement interdit aux citoyens de quitter le territoire national (Visa de sortie suspendu)."
      );

    if (laws.entryVisaFee > 0)
      addArt(
        `Tout étranger souhaitant pénétrer sur le territoire devra s'acquitter d'une taxe douanière de ${formatMoney(laws.entryVisaFee)}.`
      );

    if (laws.allowWeapons === false)
      addArt(
        "La possession d'armes est strictement prohibée (Classe A). Tout contrevenant s'expose à une confiscation immédiate."
      );
    else
      addArt(
        "Le port d'arme est autorisé pour les citoyens libres disposant de leurs droits civiques."
      );

    if (laws.closedCurrency)
      addArt(
        "Protectionnisme Monétaire : La monnaie nationale est fermée. Les transferts entrants depuis l'étranger sont bloqués."
      );

    if (laws.taxForeignTransfers)
      addArt(
        "Loi de Protection Économique : Tout transfert financier provenant de l'étranger est soumis à une taxe impériale de 10%."
      );

    if (laws.freezeAssets)
      addArt(
        "État d'Urgence Financière : Les avoirs bancaires sont gelés. Aucun retrait ni virement sortant n'est autorisé."
      );

    if (laws.allowExternalDebits)
      addArt(
        "Accords de Recouvrement : Les entités étrangères accréditées sont autorisées à effectuer des prélèvements sur les comptes nationaux."
      );

    if (laws.allowLocalConfiscation)
      addArt(
        "Droit de Réquisition : L'Administration locale se réserve le droit de confisquer les biens et fonds pour l'intérêt supérieur de la Nation."
      );

    if (laws.allowLocalSales === false)
      addArt(
        "Le commerce entre particuliers est suspendu. Seules les transactions d'État sont autorisées."
      );

    if (laws.requireRulerApprovalForSales)
      addArt(
        "Contrôle des Marchés : Toute mise en vente de biens ou de contrats nécessite l'approbation du sceau royal."
      );

    if (laws.militaryServitude)
      addArt(
        "Mobilisation Servile : La population servile (esclaves) est réquisitionnée pour l'effort de guerre et la sécurité."
      );

    if (laws.banPublicSlaveMarket)
      addArt(
        "Éthique Commerciale : La vente publique d'êtres humains est interdite sur les places de marché."
      );

    if (laws.allowSelfManumission)
      addArt(
        "Droit de Rachat : Tout esclave disposant des fonds nécessaires a le droit légal d'acheter sa propre liberté (Auto-affranchissement)."
      );
    else
      addArt(
        "Perpétuité : L'affranchissement par rachat personnel est interdit. Seul le maître peut octroyer la liberté."
      );

    if (laws.mailCensorship)
      addArt(
        "Loi de Vigilance : La Poste Impériale est mandatée pour inspecter et censurer toute correspondance jugée subversive."
      );

    return articles;
  };

  const toRoman = (num) => {
    const lookup = {
      M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90,
      L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1,
    };
    let roman = "", i;
    for (i in lookup) {
      while (num >= lookup[i]) { roman += i; num -= lookup[i]; }
    }
    return roman;
  };

  const isNew = (dateStr) =>
    dateStr && Date.now() - new Date(dateStr).getTime() < 7 * 24 * 3600 * 1000;

  const legalCode = generateLegalCode();

  const allDecrees = currentCountry.decrees || [];
  const pinnedDecrees = allDecrees.filter((d) => d.pinned);
  const unpinnedDecrees = allDecrees.filter((d) => !d.pinned);
  const sortedDecrees = [...pinnedDecrees, ...unpinnedDecrees];

  const filteredDecrees = sortedDecrees.filter(
    (d) =>
      !search ||
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.content?.toLowerCase().includes(search.toLowerCase())
  );

  const allBooks = currentCountry.books || [];
  const filteredBooks = allBooks.filter(
    (b) =>
      !search ||
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.author?.toLowerCase().includes(search.toLowerCase()) ||
      b.category?.toLowerCase().includes(search.toLowerCase())
  );

  // Catégories utilisées pour les filtres-rapides livres
  const bookCategories = [
    ...new Set(allBooks.map((b) => b.category).filter(Boolean)),
  ];
  const displayedBooks = activeCategory
    ? filteredBooks.filter((b) => b.category === activeCategory)
    : filteredBooks;

  // --- VUE LECTURE DE LIVRE ---
  if (readingBook) {
    return (
      <div className="h-full flex flex-col font-serif bg-[#fdf6e3] rounded-2xl shadow-xl overflow-hidden border border-stone-300">
        {/* HEADER lecture */}
        <div className="bg-stone-900 text-stone-200 px-6 py-4 flex items-center gap-4 shrink-0 border-b-4 border-yellow-600">
          <button
            onClick={() => setReadingBook(null)}
            className="flex items-center gap-2 text-stone-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={16} /> Retour aux ouvrages
          </button>
          <div className="w-px h-6 bg-stone-700" />
          <div className="flex-1 min-w-0">
            <span className="text-white font-black text-sm uppercase tracking-widest truncate">{readingBook.title}</span>
            {readingBook.author && (
              <span className="text-stone-400 text-xs ml-2 italic">par {readingBook.author}</span>
            )}
          </div>
          {readingBook.category && (
            <span className="text-[9px] font-black uppercase tracking-widest bg-stone-700 text-stone-300 px-2 py-1 rounded-full flex items-center gap-1">
              <Tag size={9} /> {readingBook.category}
            </span>
          )}
        </div>
        {/* CONTENU LECTURE */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12">
          <div className="max-w-3xl mx-auto bg-white/90 p-8 md:p-16 shadow-2xl border border-stone-200 relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-stone-300 border-l border-dashed border-stone-400" />
            <div className="pl-8">
              <h1 className="text-3xl md:text-4xl font-black text-stone-900 mb-2 font-serif border-b-2 border-stone-300 pb-4">
                {readingBook.title}
              </h1>
              {readingBook.author && (
                <p className="text-sm italic text-stone-500 mb-8 font-serif">par {readingBook.author}</p>
              )}
              <div className="font-serif text-lg leading-loose text-stone-800 whitespace-pre-line text-justify">
                {readingBook.content}
              </div>
              <div className="mt-16 pt-6 border-t border-stone-200 text-right text-[10px] uppercase font-bold text-stone-400 tracking-widest">
                Archivé le {new Date(readingBook.date || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-serif bg-[#fdf6e3] rounded-2xl shadow-xl overflow-hidden border border-stone-300 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="bg-stone-900 text-stone-200 p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 border-b-4 border-yellow-600 shadow-lg z-20">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-3 bg-stone-800 rounded-full border border-stone-600 shadow-lg">
            <Library size={24} className="text-yellow-600" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-[0.2em] text-white leading-none">
              Bibliothèque
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Globe size={12} className="text-stone-400" />
              <select
                className="bg-transparent text-xs uppercase font-bold text-yellow-500 border-none outline-none cursor-pointer hover:text-yellow-400 transition-colors"
                value={viewingCountryId || ""}
                onChange={(e) => setViewingCountryId(e.target.value)}
              >
                {safeCountries.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    className="bg-stone-800 text-stone-200"
                  >
                    Archives : {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-stone-800 rounded-lg p-1 gap-1 border border-stone-700 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("codes")}
            className={`flex-1 md:flex-none px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === "codes"
                ? "bg-[#fdf6e3] text-stone-900 shadow-md"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            <Gavel size={14} /> <span className="hidden md:inline">Code</span> Lois
          </button>
          <button
            onClick={() => setActiveTab("decrees")}
            className={`flex-1 md:flex-none px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === "decrees"
                ? "bg-[#fdf6e3] text-stone-900 shadow-md"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            <Scroll size={14} /> Décrets
            {allDecrees.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeTab === "decrees" ? "bg-stone-800 text-white" : "bg-stone-700 text-stone-300"}`}>
                {allDecrees.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("books")}
            className={`flex-1 md:flex-none px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === "books"
                ? "bg-[#fdf6e3] text-stone-900 shadow-md"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            <Book size={14} /> Ouvrages
            {allBooks.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeTab === "books" ? "bg-stone-800 text-white" : "bg-stone-700 text-stone-300"}`}>
                {allBooks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* BARRE DE RECHERCHE (décrets & ouvrages) */}
      {(activeTab === "decrees" || activeTab === "books") && (
        <div className="bg-stone-800/50 px-6 py-3 flex items-center gap-3 border-b border-stone-700/50 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              className="w-full pl-9 pr-4 py-2 bg-stone-900/70 text-white text-sm rounded-lg border border-stone-600 outline-none placeholder-stone-500 focus:border-yellow-500 transition-colors font-sans"
              placeholder={activeTab === "decrees" ? "Chercher dans les décrets…" : "Chercher un ouvrage…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white transition-colors text-xs"
              >
                ✕
              </button>
            )}
          </div>
          {activeTab === "books" && bookCategories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto">
              {bookCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`flex-shrink-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                    activeCategory === cat
                      ? "bg-yellow-500 text-stone-900 border-yellow-400"
                      : "bg-stone-700 text-stone-300 border-stone-600 hover:border-stone-400"
                  }`}
                >
                  <Tag size={8} /> {cat}
                </button>
              ))}
            </div>
          )}
          {(search || activeCategory) && (
            <span className="text-[10px] text-stone-400 shrink-0">
              {activeTab === "decrees" ? filteredDecrees.length : displayedBooks.length} résultat{(activeTab === "decrees" ? filteredDecrees.length : displayedBooks.length) !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* CONTENU */}
      <div className="flex-1 overflow-hidden flex relative bg-[#fdf6e3]">
        {/* Texture papier */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2z' fill='%2357534e' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="flex-1 p-6 md:p-12 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-400 scrollbar-track-transparent z-10">
          <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-md p-8 md:p-16 shadow-2xl min-h-[600px] border border-stone-200 relative">
            {/* Reliure décorative */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-stone-300 border-l border-dashed border-stone-400" />

            {/* --- ONGLET 1 : CODE CIVIL --- */}
            {activeTab === "codes" && (
              <div className="pl-8 animate-fadeIn">
                <div className="text-center border-b-2 border-stone-900 pb-6 mb-8">
                  <h1 className="text-3xl md:text-4xl font-black text-stone-900 mb-2 uppercase font-serif tracking-tight">
                    Code Légal
                  </h1>
                  <div className="text-sm italic text-stone-500 font-serif">
                    Lois fondamentales de {currentCountry.name}
                  </div>
                </div>
                <div className="space-y-8 text-justify leading-relaxed text-lg text-stone-800 font-serif">
                  {legalCode.length > 0 ? (
                    legalCode.map((law, idx) => (
                      <div
                        key={idx}
                        className="relative hover:bg-yellow-50/50 p-2 rounded transition-colors"
                      >
                        <p className="first-letter:text-4xl first-letter:font-black first-letter:mr-2 first-letter:float-left first-letter:leading-none text-stone-900">
                          {law}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="italic text-center text-stone-400 mt-20">
                      Aucune restriction légale majeure recensée à ce jour.
                    </p>
                  )}
                </div>
                <div className="mt-20 pt-6 border-t border-stone-200 text-center text-[10px] uppercase font-bold text-stone-400 tracking-widest">
                  Document officiel du Ministère de la Justice
                </div>
              </div>
            )}

            {/* --- ONGLET 2 : DÉCRETS --- */}
            {activeTab === "decrees" && (
              <div className="pl-8 animate-fadeIn">
                <div className="text-center border-b-2 border-stone-900 pb-6 mb-8">
                  <h1 className="text-3xl md:text-4xl font-black text-stone-900 mb-2 uppercase font-serif tracking-tight">
                    Recueil des Décrets
                  </h1>
                  <div className="text-sm italic text-stone-500 font-serif">
                    Proclamations officielles du Souverain {currentCountry.rulerName}
                  </div>
                </div>

                {allDecrees.length === 0 ? (
                  <div className="text-center py-20 text-stone-400 italic font-serif text-lg">
                    Le silence règne. Aucun décret spécifique n'a été proclamé.
                  </div>
                ) : filteredDecrees.length === 0 ? (
                  <div className="text-center py-20 text-stone-400 italic font-serif text-base">
                    Aucun décret ne correspond à « {search} ».
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredDecrees.map((d, i) => {
                      const expanded = expandedDecreeId === (d.id || i);
                      return (
                        <div
                          key={d.id || i}
                          className={`relative border-l-4 transition-colors rounded-r-sm ${
                            d.pinned ? "border-yellow-600/60" : "border-yellow-600/20 hover:border-yellow-600/40"
                          }`}
                        >
                          {/* En-tête cliquable */}
                          <button
                            onClick={() => setExpandedDecreeId(expanded ? null : (d.id || i))}
                            className="w-full text-left flex items-start justify-between gap-4 pl-8 pr-4 py-3 group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Bookmark
                                className="absolute -left-[13px] top-3 text-yellow-600 bg-[#fdf6e3] rounded-sm shrink-0"
                                size={20}
                                fill="#ca8a04"
                              />
                              {d.pinned && (
                                <Pin size={12} className="text-yellow-600 shrink-0" fill="#ca8a04" />
                              )}
                              <span className="font-bold text-sm text-stone-700 uppercase tracking-[0.2em] font-sans truncate">
                                {d.name || `Proclamation N°${i + 1}`}
                              </span>
                              {isNew(d.date) && (
                                <span className="text-[8px] font-black uppercase tracking-widest bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full shrink-0">
                                  Nouveau
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {d.date && (
                                <span className="text-[9px] text-stone-400 font-mono">
                                  {new Date(d.date).toLocaleDateString()}
                                </span>
                              )}
                              {expanded
                                ? <ChevronUp size={14} className="text-stone-400" />
                                : <ChevronDown size={14} className="text-stone-400" />
                              }
                            </div>
                          </button>

                          {/* Contenu */}
                          {expanded && (
                            <div className="pl-8 pr-4 pb-6">
                              <div className="text-lg text-stone-900 leading-loose font-serif whitespace-pre-line text-justify border-t border-stone-100 pt-4">
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
            )}

            {/* --- ONGLET 3 : OUVRAGES --- */}
            {activeTab === "books" && (
              <div className="pl-8 animate-fadeIn">
                <div className="text-center border-b-2 border-stone-900 pb-6 mb-8">
                  <h1 className="text-3xl md:text-4xl font-black text-stone-900 mb-2 uppercase font-serif tracking-tight">
                    Ouvrages & Histoire
                  </h1>
                  <div className="text-sm italic text-stone-500 font-serif">
                    Culture et Mémoire de {currentCountry.name}
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Livres statiques (toujours visibles si pas de recherche) */}
                  {!search && !activeCategory && (
                    <>
                      <div className="bg-[#fcfbf7] p-6 border border-stone-200 shadow-sm rounded-sm">
                        <h3 className="font-serif font-bold text-2xl text-stone-900 mb-4 flex items-center gap-3">
                          <Book className="text-stone-400" size={20} />
                          Chroniques de {currentCountry.name}
                        </h3>
                        <div className="font-serif text-lg leading-relaxed text-stone-700 italic border-l-2 border-stone-300 pl-4">
                          {currentCountry.description ||
                            "Aucune information historique n'est disponible sur cette contrée."}
                        </div>
                        {currentCountry.specialty && (
                          <div className="mt-4 pt-4 border-t border-stone-100 text-sm font-sans uppercase tracking-widest text-stone-500">
                            Spécialité Nationale :{" "}
                            <span className="text-stone-800 font-bold">
                              {currentCountry.specialty}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="bg-[#fcfbf7] p-6 border border-stone-200 shadow-sm rounded-sm">
                        <h3 className="font-serif font-bold text-2xl text-stone-900 mb-4 flex items-center gap-3">
                          <Book className="text-stone-400" size={20} />
                          Almanach de la Noblesse
                        </h3>
                        <p className="mb-4 font-serif text-stone-700">
                          Cette terre est actuellement sous la gouvernance de{" "}
                          <strong className="text-stone-900">
                            {currentCountry.rulerName}
                          </strong>
                          . Sa population s'élève à{" "}
                          <strong>{currentCountry.population || 0}</strong> âmes recensées.
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono border-t border-stone-200 pt-2">
                          <div>
                            <span className="block text-stone-400 uppercase">Stabilité</span>
                            <span className="font-bold text-lg">{currentCountry.stability}%</span>
                          </div>
                          <div>
                            <span className="block text-stone-400 uppercase">Sécurité</span>
                            <span className="font-bold text-lg">{currentCountry.security}%</span>
                          </div>
                          <div>
                            <span className="block text-stone-400 uppercase">Prospérité</span>
                            <span className="font-bold text-lg">{currentCountry.prosperity}%</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Livres ajoutés par l'admin */}
                  {allBooks.length === 0 && !search && !activeCategory ? null :
                    displayedBooks.length === 0 ? (
                      <div className="text-center py-12 text-stone-400 italic font-serif text-base">
                        {search || activeCategory
                          ? `Aucun ouvrage ne correspond à votre recherche.`
                          : "Aucun ouvrage référencé."}
                      </div>
                    ) : (
                      displayedBooks.map((book) => (
                        <div
                          key={book.id}
                          className="bg-[#fcfbf7] border border-stone-200 shadow-sm rounded-sm overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setReadingBook(book)}
                        >
                          {/* Marque-page déco */}
                          <div className="relative">
                            <div className="absolute top-0 right-8 w-6 h-10 bg-red-900 shadow-sm" />
                            <div className="p-6 md:p-8 pr-16">
                              <div className="flex items-start gap-3 mb-2">
                                <h3 className="font-serif font-bold text-2xl text-stone-900 flex-1">
                                  {book.title}
                                </h3>
                                {isNew(book.date) && (
                                  <span className="text-[8px] font-black uppercase tracking-widest bg-green-100 text-green-700 px-2 py-1 rounded-full shrink-0 mt-1">
                                    Nouveau
                                  </span>
                                )}
                              </div>
                              {book.category && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full mb-3">
                                  <Tag size={8} /> {book.category}
                                </span>
                              )}
                              {book.author && (
                                <p className="text-sm italic text-stone-500 mb-4 font-serif">
                                  par {book.author}
                                </p>
                              )}
                              <div className="font-serif text-base leading-relaxed text-stone-600 line-clamp-3">
                                {book.content}
                              </div>
                              <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center">
                                <span className="text-[10px] uppercase font-bold text-stone-400">
                                  Archivé le {new Date(book.date || Date.now()).toLocaleDateString()}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-stone-500 group-hover:text-stone-900 transition-colors tracking-widest">
                                  Lire →
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryView;
