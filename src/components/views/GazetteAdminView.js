import React, { useState, useMemo } from "react";
import {
  Newspaper, Save, X, Edit3, Trash2,
  Eye, EyeOff, Calendar, Search, Pin,
} from "lucide-react";
import { GAZETTE_CATEGORY_LABELS } from "../../lib/gazetteConstants";

/* ── Catégories ── */
export const GAZETTE_CATEGORIES = [
  { id: "DÉCRET",     label: GAZETTE_CATEGORY_LABELS.DÉCRET,     color: "text-red-600",    bg: "bg-red-50",     border: "border-red-200",    dot: "#dc2626" },
  { id: "ANNONCE",    label: GAZETTE_CATEGORY_LABELS.ANNONCE,    color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  dot: "#d4af37" },
  { id: "CHRONIQUE",  label: GAZETTE_CATEGORY_LABELS.CHRONIQUE,  color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200",   dot: "#3b82f6" },
  { id: "NÉCROLOGIE", label: GAZETTE_CATEGORY_LABELS.NÉCROLOGIE, color: "text-stone-600",  bg: "bg-stone-100",  border: "border-stone-300",  dot: "#78716c" },
  { id: "AVIS",       label: GAZETTE_CATEGORY_LABELS.AVIS,       color: "text-orange-600", bg: "bg-orange-50",  border: "border-orange-200", dot: "#f97316" },
  { id: "COMMUNIQUÉ", label: GAZETTE_CATEGORY_LABELS.COMMUNIQUÉ, color: "text-green-600",  bg: "bg-green-50",   border: "border-green-200",  dot: "#22c55e" },
];

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  content: "",
  category: "ANNONCE",
  imageEmoji: "",
  pinned: false,
};

const catInfo = (catId) => GAZETTE_CATEGORIES.find((c) => c.id === catId) || GAZETTE_CATEGORIES.find((c) => c.id === "ANNONCE");

/* ── Preview card (papier parchemin) ── */
const PreviewCard = ({ form, author, authorRole, date, isGlobal }) => {
  const cat = catInfo(form.category);
  return (
    <div className="bg-[#fdf6e3] rounded-xl p-5 font-serif text-stone-800 space-y-3 border border-stone-300">
      <div className="flex items-center gap-2 flex-wrap">
        {form.pinned && <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">📌 La Une</span>}
        <span className="text-[9px] font-black uppercase bg-stone-100 border border-stone-300 text-stone-600 px-2 py-0.5 rounded-full">
          {form.imageEmoji ? `${form.imageEmoji} ` : ""}{cat.label}
        </span>
        <span className={`text-[9px] font-bold ${isGlobal ? "text-yellow-600" : "text-blue-600"}`}>
          {isGlobal ? "⚜️ Impérial" : "🏴 Local"}
        </span>
        <span className="ml-auto text-[9px] text-stone-400">{date}</span>
      </div>
      <h3 className="text-xl font-black font-serif text-stone-900 leading-tight">{form.title || "Titre de l'article"}</h3>
      {form.subtitle && <p className="text-sm italic text-stone-500 font-serif">{form.subtitle}</p>}
      <div className="text-sm leading-relaxed text-stone-700 font-serif text-justify whitespace-pre-line border-l-2 border-stone-200 pl-4">
        {form.content || "Corps de l'article…"}
      </div>
      <div className="flex justify-end border-t border-stone-200 pt-3 text-right">
        <div>
          <div className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Signé</div>
          <div className="text-sm font-black text-stone-800">{author}</div>
          <div className="text-xs text-stone-500">{authorRole}</div>
        </div>
      </div>
    </div>
  );
};

/* ── Composant principal ── */
const GazetteAdminView = ({ state, roleInfo, session, onUpdateState, notify }) => {
  const safeGazette = Array.isArray(state.gazette) ? state.gazette : [];
  const isGlobal = roleInfo.scope === "GLOBAL";
  const currentDate = state.gameDate || { day: 1, month: 1, year: 1200 };

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("ALL");
  const [showPreview, setShowPreview] = useState(false);

  const visibleArticles = useMemo(() => {
    return safeGazette.filter((n) => isGlobal || n.scope === "GLOBAL" || n.countryId === session.countryId);
  }, [safeGazette, isGlobal, session.countryId]);

  const filtered = useMemo(() => {
    return visibleArticles
      .filter((a) => filterCat === "ALL" || a.category === filterCat)
      .filter((a) => !search || a.title.toLowerCase().includes(search.toLowerCase()) || (a.content || "").toLowerCase().includes(search.toLowerCase()));
  }, [visibleArticles, filterCat, search]);

  const stats = useMemo(() => {
    const byCategory = {};
    GAZETTE_CATEGORIES.forEach((c) => { byCategory[c.id] = 0; });
    visibleArticles.forEach((a) => { if (a.category && byCategory[a.category] !== undefined) byCategory[a.category]++; });
    return { total: visibleArticles.length, pinned: visibleArticles.filter((a) => a.pinned).length, byCategory };
  }, [visibleArticles]);

  const openEdit = (article) => {
    setForm({
      title: article.title || "",
      subtitle: article.subtitle || "",
      content: article.content || "",
      category: article.category || "ANNONCE",
      imageEmoji: article.imageEmoji || "",
      pinned: article.pinned || false,
    });
    setEditingId(article.id);
    setShowPreview(false);
  };

  const cancelEdit = () => { setForm(EMPTY_FORM); setEditingId(null); setShowPreview(false); };

  const handlePublish = () => {
    if (!form.title.trim() || !form.content.trim()) { notify("Titre et contenu obligatoires.", "error"); return; }
    const dateStr = `Le ${currentDate.day}/${currentDate.month}/${currentDate.year}`;
    if (editingId) {
      onUpdateState({
        ...state,
        gazette: safeGazette.map((a) => a.id === editingId
          ? { ...a, title: form.title, subtitle: form.subtitle, content: form.content, category: form.category, imageEmoji: form.imageEmoji, pinned: form.pinned }
          : a),
      });
      notify("Article modifié.", "success");
    } else {
      const article = {
        id: Date.now(),
        date: dateStr,
        rpDate: { ...currentDate },
        author: session?.name || "Administrateur",
        authorRole: roleInfo.label,
        title: form.title,
        subtitle: form.subtitle,
        content: form.content,
        category: form.category,
        imageEmoji: form.imageEmoji,
        pinned: form.pinned,
        scope: isGlobal ? "GLOBAL" : "LOCAL",
        countryId: isGlobal ? null : session.countryId,
      };
      onUpdateState({ ...state, gazette: [article, ...safeGazette] });
      notify("Article publié.", "success");
    }
    cancelEdit();
  };

  const deleteArticle = (id, title) => {
    if (!window.confirm(`Supprimer « ${title} » ?`)) return;
    onUpdateState({ ...state, gazette: safeGazette.filter((a) => a.id !== id) });
    notify("Article supprimé.", "info");
    if (editingId === id) cancelEdit();
  };

  const togglePin = (id) => {
    onUpdateState({ ...state, gazette: safeGazette.map((a) => a.id === id ? { ...a, pinned: !a.pinned } : a) });
  };

  const dateStr = `Le ${currentDate.day}/${currentDate.month}/${currentDate.year}`;

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-700 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 p-5">
        <Newspaper size={110} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5 text-stone-400 select-none pointer-events-none" />
        <div className="relative flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-[0.3em] text-stone-500 mb-1">Chancellerie Impériale</div>
            <h2 className="text-2xl font-black font-serif text-stone-100 flex items-center gap-2">
              <Newspaper size={20} className="text-amber-400" /> Gazette Impériale — Rédaction
            </h2>
          </div>
          <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border shrink-0 ${isGlobal ? "bg-yellow-900/20 text-yellow-400 border-yellow-800/40" : "bg-blue-900/20 text-blue-400 border-blue-800/40"}`}>
            {isGlobal ? "⚜️ Portée Impériale" : "🏴 Portée Locale"}
          </span>
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3">
          <div className="text-[8px] text-stone-400 uppercase font-black tracking-widest">Articles</div>
          <div className="text-2xl font-black text-stone-800 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3">
          <div className="text-[8px] text-stone-400 uppercase font-black tracking-widest">Épinglés</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.pinned}</div>
        </div>
        {GAZETTE_CATEGORIES.filter((c) => stats.byCategory[c.id] > 0).slice(0, 2).map((c) => (
          <div key={c.id} className="bg-white border border-stone-200 rounded-xl px-4 py-3">
            <div className="text-[8px] text-stone-400 uppercase font-black tracking-widest truncate">{c.label}</div>
            <div className={`text-2xl font-black mt-1 ${c.color}`}>{stats.byCategory[c.id]}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* ── Éditeur ── */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-[9px] font-black uppercase tracking-widest text-stone-400">
              {editingId ? "✏️ Modifier l'article" : "✍️ Rédiger un article"}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-lg border transition-all ${showPreview ? "bg-amber-50 border-amber-300 text-amber-700" : "border-stone-200 text-stone-500 hover:text-stone-700 hover:border-stone-300"}`}>
                {showPreview ? <Eye size={10} /> : <EyeOff size={10} />} Aperçu
              </button>
              {editingId && (
                <button onClick={cancelEdit} className="text-stone-400 hover:text-red-500 transition-colors p-1"><X size={14} /></button>
              )}
            </div>
          </div>

          {showPreview ? (
            <PreviewCard form={form} author={session.name} authorRole={roleInfo.label} date={dateStr} isGlobal={isGlobal} />
          ) : (
            <div className="space-y-3">

              {/* Catégorie */}
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-2">Catégorie *</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {GAZETTE_CATEGORIES.map((c) => (
                    <button key={c.id} onClick={() => setForm({ ...form, category: c.id })}
                      className={`px-2 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all ${form.category === c.id ? `${c.bg} ${c.border} ${c.color}` : "border-stone-200 text-stone-400 hover:text-stone-600 hover:border-stone-300"}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Titre + Emoji */}
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm font-bold text-stone-800 outline-none focus:border-amber-400 font-serif placeholder:text-stone-400"
                  placeholder="Titre de l'article *"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <input
                  className="w-14 bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-2xl text-center outline-none focus:border-amber-400"
                  placeholder="🖋"
                  value={form.imageEmoji}
                  onChange={(e) => setForm({ ...form, imageEmoji: e.target.value })}
                  title="Emoji décoratif (optionnel)"
                  maxLength={2}
                />
              </div>

              {/* Sous-titre */}
              <input
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-600 outline-none focus:border-amber-400 italic placeholder:text-stone-400"
                placeholder="Sous-titre ou accroche (optionnel)"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />

              {/* Contenu */}
              <div>
                <textarea
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm text-stone-800 outline-none focus:border-amber-400 resize-none font-serif placeholder:text-stone-400"
                  placeholder={"Corps de l'article…\n\nUtilisez des sauts de ligne pour créer des paragraphes.\n\nVous pouvez rédiger un texte long et détaillé."}
                  rows={10}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
                <div className="flex items-center justify-between mt-0.5">
                  <div className="text-[9px] text-stone-400 italic">Sauts de ligne préservés à l'affichage</div>
                  <div className={`text-[9px] font-mono ${form.content.length > 2000 ? "text-orange-500" : "text-stone-400"}`}>{form.content.length} car.</div>
                </div>
              </div>

              {/* Épingler */}
              <div className="flex items-center justify-between pt-1">
                <button type="button" onClick={() => setForm({ ...form, pinned: !form.pinned })} className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${form.pinned ? "bg-amber-500" : "bg-stone-200"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.pinned ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest select-none">
                    📌 Épingler en Une
                  </span>
                </button>
              </div>

              <button
                onClick={handlePublish}
                disabled={!form.title.trim() || !form.content.trim()}
                className="w-full py-2.5 bg-amber-500 text-stone-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {editingId ? <><Save size={13} /> Mettre à jour</> : <><Newspaper size={13} /> Publier l'article</>}
              </button>
            </div>
          )}
        </div>

        {/* ── Liste des articles ── */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Chercher un article…"
                className="w-full bg-white border border-stone-200 rounded-xl pl-8 pr-8 py-2.5 text-xs text-stone-800 outline-none focus:border-amber-400"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                  <X size={11} />
                </button>
              )}
            </div>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
              className="bg-white border border-stone-200 rounded-xl px-2 py-2.5 text-xs text-stone-700 outline-none focus:border-amber-400 shrink-0">
              <option value="ALL">Toutes</option>
              {GAZETTE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-transparent">
            {filtered.length === 0 ? (
              <div className="text-xs text-stone-400 text-center py-12 italic border border-dashed border-stone-200 rounded-xl">
                Aucun article publié
              </div>
            ) : filtered.map((a) => {
              const cat = catInfo(a.category);
              return (
                <div key={a.id} className={`bg-white border rounded-xl p-3 group hover:border-stone-300 transition-all shadow-sm ${a.pinned ? "border-amber-300" : "border-stone-200"} ${editingId === a.id ? "ring-2 ring-amber-400/50" : ""}`}>
                  <div className="flex items-start gap-2">
                    {a.imageEmoji && <span className="text-xl shrink-0 mt-0.5">{a.imageEmoji}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {a.pinned && <span className="text-[8px] font-black uppercase text-amber-600 flex items-center gap-0.5"><Pin size={8} /> Une</span>}
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${cat.bg} ${cat.border} ${cat.color}`}>{cat.label}</span>
                        <span className={`text-[8px] ${a.scope === "GLOBAL" ? "text-yellow-600" : "text-blue-500"}`}>{a.scope === "GLOBAL" ? "⚜️" : "🏴"}</span>
                      </div>
                      <div className="text-xs font-black text-stone-800 font-serif leading-snug line-clamp-2">{a.title}</div>
                      {a.subtitle && <div className="text-[10px] text-stone-400 italic truncate mt-0.5">{a.subtitle}</div>}
                      <div className="text-[9px] text-stone-400 mt-1 flex items-center gap-1">
                        <Calendar size={9} /> {a.date} · {a.author}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                      <button onClick={() => togglePin(a.id)} title={a.pinned ? "Désépingler" : "Épingler"}
                        className={`p-1.5 rounded-lg transition-colors ${a.pinned ? "text-amber-500 hover:text-amber-600" : "text-stone-300 hover:text-amber-500"}`}>
                        <Pin size={12} />
                      </button>
                      <button onClick={() => openEdit(a)} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors">
                        <Edit3 size={12} />
                      </button>
                      <button onClick={() => deleteArticle(a.id, a.title)} className="p-1.5 text-stone-300 hover:text-red-500 rounded-lg transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GazetteAdminView;
