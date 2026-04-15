import React, { useState, useMemo } from "react";
import { Newspaper, Calendar, Search } from "lucide-react";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/* ── Styles par catégorie ── */
const CAT_META = {
  DÉCRET:     { label: "Décret Impérial",   dot: "bg-red-500",    badge: "bg-red-50 text-red-700 border-red-200",          bar: "bg-red-600",    tab: "text-red-700 border-red-600" },
  ANNONCE:    { label: "Annonce Officielle", dot: "bg-amber-500",  badge: "bg-amber-50 text-amber-700 border-amber-200",    bar: "bg-amber-500",  tab: "text-amber-700 border-amber-600" },
  CHRONIQUE:  { label: "Chronique",         dot: "bg-blue-500",   badge: "bg-blue-50 text-blue-700 border-blue-200",       bar: "bg-blue-500",   tab: "text-blue-700 border-blue-600" },
  NÉCROLOGIE: { label: "Nécrologie",        dot: "bg-stone-400",  badge: "bg-stone-100 text-stone-600 border-stone-300",   bar: "bg-stone-500",  tab: "text-stone-600 border-stone-500" },
  AVIS:       { label: "Avis de Recherche", dot: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200", bar: "bg-orange-500", tab: "text-orange-700 border-orange-600" },
  COMMUNIQUÉ: { label: "Communiqué",        dot: "bg-green-500",  badge: "bg-green-50 text-green-700 border-green-200",    bar: "bg-green-500",  tab: "text-green-700 border-green-600" },
};

const getCat = (catId) => CAT_META[catId] || { label: catId || "Annonce", dot: "bg-stone-400", badge: "bg-stone-100 text-stone-600 border-stone-200", bar: "bg-stone-400", tab: "text-stone-600 border-stone-400" };

const FILTER_TABS = [
  { id: "ALL", label: "Tout" },
  { id: "DÉCRET", label: "Décrets" },
  { id: "ANNONCE", label: "Annonces" },
  { id: "CHRONIQUE", label: "Chroniques" },
  { id: "NÉCROLOGIE", label: "Nécrologies" },
  { id: "AVIS", label: "Avis" },
  { id: "COMMUNIQUÉ", label: "Communiqués" },
];

const GazetteView = ({ gazette, gameDate, userCountryId }) => {
  const safeGazette = gazette || [];
  const gd = gameDate || { day: 1, month: 1, year: 1200 };
  const rpDateStr = `${gd.day} ${MONTHS[(gd.month - 1) % 12]} ${gd.year}`;

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(new Set());

  /* Articles visibles par ce citoyen */
  const visibleArticles = useMemo(() => {
    return safeGazette.filter(
      (a) => a.scope === "GLOBAL" || !userCountryId || a.countryId === userCountryId
    );
  }, [safeGazette, userCountryId]);

  /* Articles épinglés (La Une) */
  const pinnedArticles = useMemo(() => visibleArticles.filter((a) => a.pinned), [visibleArticles]);

  /* Articles filtrés pour la grille principale */
  const filteredArticles = useMemo(() => {
    return visibleArticles
      .filter((a) => {
        // En mode ALL sans recherche : les épinglés sont dans la section Une → ne pas les répéter
        if (activeCategory === "ALL" && !search && a.pinned) return false;
        return true;
      })
      .filter((a) => activeCategory === "ALL" || a.category === activeCategory)
      .filter((a) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          a.title?.toLowerCase().includes(q) ||
          a.subtitle?.toLowerCase().includes(q) ||
          a.content?.toLowerCase().includes(q) ||
          a.author?.toLowerCase().includes(q)
        );
      });
  }, [visibleArticles, activeCategory, search]);

  /* Onglets de catégories présents dans les articles visibles */
  const presentCategories = useMemo(() => {
    const cats = new Set(visibleArticles.map((a) => a.category).filter(Boolean));
    return FILTER_TABS.filter((t) => t.id === "ALL" || cats.has(t.id));
  }, [visibleArticles]);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const editionNum = Math.max(1, visibleArticles.length);

  /* ── Article card ── */
  const renderArticle = (article, featured = false) => {
    const cat = getCat(article.category);
    const isExpanded = expanded.has(article.id);
    const MAX_CHARS = featured ? 500 : 300;
    const isLong = article.content && article.content.length > MAX_CHARS;
    const displayContent = isLong && !isExpanded
      ? article.content.slice(0, MAX_CHARS) + "…"
      : (article.content || "");

    return (
      <div
        key={article.id}
        className={`bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden ${featured ? "p-7" : "p-5"}`}
      >
        {/* Barre colorée gauche */}
        <div className={`absolute top-0 left-0 w-1.5 h-full ${cat.bar}`} />

        <div className="pl-4">
          {/* Méta : catégorie, scope, date */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {article.pinned && (
              <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                📌 La Une
              </span>
            )}
            {article.category && (
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${cat.badge}`}>
                {article.imageEmoji ? `${article.imageEmoji} ` : ""}{cat.label}
              </span>
            )}
            <span className={`text-[9px] font-bold ${article.scope === "GLOBAL" ? "text-yellow-600" : "text-blue-600"}`}>
              {article.scope === "GLOBAL" ? "⚜️ Impérial" : "🏴 Local"}
            </span>
            <div className="ml-auto flex items-center gap-1 text-stone-400">
              <Calendar size={11} />
              <span className="font-bold uppercase tracking-widest text-[10px]">{article.date}</span>
            </div>
          </div>

          {/* Titre */}
          <h3 className={`font-black font-serif text-stone-900 leading-tight mb-2 ${featured ? "text-2xl" : "text-lg"}`}>
            {article.title}
          </h3>

          {/* Sous-titre */}
          {article.subtitle && (
            <p className="text-sm italic text-stone-500 mb-3 font-serif">{article.subtitle}</p>
          )}

          {/* Séparateur ornemental */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-stone-100" />
            <span className="text-stone-300 text-xs">✦</span>
            <div className="flex-1 h-px bg-stone-100" />
          </div>

          {/* Contenu */}
          <div className="text-stone-700 leading-relaxed font-serif text-sm text-justify whitespace-pre-line mb-3">
            {displayContent}
          </div>

          {isLong && (
            <button
              onClick={() => toggleExpand(article.id)}
              className="text-[10px] font-black uppercase text-stone-400 hover:text-stone-700 underline decoration-dotted mb-3 transition-colors"
            >
              {isExpanded ? "▲ Réduire" : "▼ Lire la suite"}
            </button>
          )}

          {/* Signature */}
          <div className="flex justify-between items-end border-t border-stone-100 pt-3">
            <div className="text-[9px] text-stone-400 italic font-serif">
              {article.scope === "GLOBAL" ? "Gazette Impériale" : "Édition Locale"}
            </div>
            <div className="text-right">
              <div className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Signé</div>
              <div className="text-sm font-black text-stone-800">{article.author}</div>
              <div className="text-xs text-stone-500">{article.authorRole}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-[#fdf6e3] rounded-2xl border border-stone-300 overflow-auto font-sans shadow-inner">

      {/* ── Manchette ── */}
      <div className="sticky top-0 z-10 bg-[#fdf6e3] border-b-4 border-stone-900 px-6 pt-6 pb-4">
        <div className="text-center mb-3">
          <div className="text-[9px] font-black uppercase tracking-[0.5em] text-stone-400 mb-1">
            — Édition N°{editionNum} —
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-serif text-stone-900 uppercase tracking-tight leading-none">
            La Gazette Impériale
          </h1>
          <p className="text-[9px] text-stone-400 uppercase tracking-[0.4em] font-bold mt-1">
            Décrets • Annonces • Chroniques • Avis Officiels
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-stone-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={13} className="text-stone-400" /> {rpDateStr}
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="bg-stone-100 border border-stone-300 rounded-full pl-7 pr-3 py-1.5 text-xs outline-none focus:border-stone-500 w-36 md:w-48 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Onglets catégories */}
        {presentCategories.length > 1 && !search && (
          <div className="flex gap-0 overflow-x-auto mt-3 border-b border-stone-200 -mb-4 pb-0">
            {presentCategories.map((tab) => {
              const catM = tab.id !== "ALL" ? getCat(tab.id) : null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`flex items-center gap-1 px-3 py-2 text-[9px] font-black uppercase tracking-widest border-b-2 -mb-px whitespace-nowrap transition-all ${
                    activeCategory === tab.id
                      ? "border-stone-900 text-stone-800"
                      : "border-transparent text-stone-400 hover:text-stone-600"
                  }`}
                >
                  {catM && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${catM.dot}`} />}
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Corps ── */}
      <div className="px-6 py-8 max-w-5xl mx-auto space-y-10">

        {/* État vide */}
        {visibleArticles.length === 0 && (
          <div className="text-center py-24 text-stone-400 italic font-serif text-xl">
            L'encre est sèche. Aucune nouvelle pour le moment.
          </div>
        )}

        {/* Résultats de recherche */}
        {search && (
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2">
              <div className="flex-1 h-px bg-stone-300" />
              {filteredArticles.length} résultat{filteredArticles.length !== 1 ? "s" : ""} pour « {search} »
              <div className="flex-1 h-px bg-stone-300" />
            </div>
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12 text-stone-400 italic font-serif">Aucun article correspondant.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredArticles.map((a) => renderArticle(a, false))}
              </div>
            )}
          </div>
        )}

        {/* Section La Une (épinglés) */}
        {!search && activeCategory === "ALL" && pinnedArticles.length > 0 && (
          <section>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 mb-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-300" />
              <span className="flex items-center gap-1.5">
                <Newspaper size={12} /> La Une — Articles Épinglés
              </span>
              <div className="flex-1 h-px bg-stone-300" />
            </div>
            <div className="space-y-6">
              {pinnedArticles.map((a) => renderArticle(a, true))}
            </div>
          </section>
        )}

        {/* Articles ordinaires / filtrés */}
        {!search && filteredArticles.length > 0 && (
          <section>
            {activeCategory === "ALL" && pinnedArticles.length > 0 && (
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 mb-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-stone-300" />
                <span>Dernières nouvelles</span>
                <div className="flex-1 h-px bg-stone-300" />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredArticles.map((a) => renderArticle(a, false))}
            </div>
          </section>
        )}

        {/* Aucun article dans cette catégorie */}
        {!search && filteredArticles.length === 0 && activeCategory !== "ALL" && (
          <div className="text-center py-12 text-stone-400 italic font-serif">
            Aucune publication dans cette rubrique pour le moment.
          </div>
        )}

        {/* Pied de gazette */}
        {visibleArticles.length > 0 && (
          <div className="text-center pt-6 border-t-2 border-stone-300 text-[10px] text-stone-400 uppercase tracking-[0.4em] font-bold font-serif">
            ✦ Fin de l'édition N°{editionNum} — La Gazette Impériale ✦
          </div>
        )}
      </div>
    </div>
  );
};

export default GazetteView;
