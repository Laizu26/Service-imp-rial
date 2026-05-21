import React, { useState, useMemo } from "react";
import {
  Newspaper, Plus, Save, X, Edit3, Trash2, Search,
  Eye, EyeOff, Globe, Flag, Calendar,
} from "lucide-react";

/* ── Catégories ── */
export const GAZETTE_CATEGORIES = [
  { id: "DÉCRET",     label: "Décret Impérial",   color: "text-red-400",    bg: "bg-red-900/30",      border: "border-red-800/40" },
  { id: "ANNONCE",    label: "Annonce Officielle", color: "text-amber-400",  bg: "bg-amber-900/30",    border: "border-amber-800/40" },
  { id: "CHRONIQUE",  label: "Chronique",          color: "text-blue-400",   bg: "bg-blue-900/30",     border: "border-blue-800/40" },
  { id: "NÉCROLOGIE", label: "Nécrologie",         color: "text-stone-400",  bg: "bg-stone-700",       border: "border-stone-600" },
  { id: "AVIS",       label: "Avis de Recherche",  color: "text-orange-400", bg: "bg-orange-900/30",   border: "border-orange-800/40" },
  { id: "COMMUNIQUÉ", label: "Communiqué",         color: "text-green-400",  bg: "bg-green-900/30",    border: "border-green-800/40" },
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

/* ── Preview card (light theme) ── */
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-stone-200 flex items-center gap-2">
          <Newspaper size={16} className="text-amber-400" /> Gazette Impériale — Rédaction
        </h2>
        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${isGlobal ? "bg-yellow-900/20 text-yellow-400 border-yellow-800/40" : "bg-blue-900/20 text-blue-400 border-blue-800/40"}`}>
          {isGlobal ? "⚜️ Portée Impériale" : "🏴 Portée Locale"}
        </span>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 flex-wrap text-[10px] text-stone-400 bg-stone-800/30 border border-stone-700 rounded-xl px-4 py-2.5">
        <span>Total : <strong className="text-stone-200">{stats.total}</strong></span>
        <span>Épinglés : <strong className="text-amber-400">{stats.pinned}</strong></span>
        {GAZETTE_CATEGORIES.map((c) => stats.byCategory[c.id] > 0 && (
          <span key={c.id}>{c.label} : <strong className={c.color}>{stats.byCategory[c.id]}</strong></span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* ── Éditeur ── */}
        <div className="bg-stone-800/40 border border-stone-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[9px] font-black uppercase tracking-widest text-stone-400">
              {editingId ? "✏️ Modifier l'article" : "✍️ Rédiger un article"}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded border transition-all ${showPreview ? "bg-amber-900/30 border-amber-700 text-amber-400" : "border-stone-700 text-stone-500 hover:text-stone-300"}`}>
                {showPreview ? <Eye size={10} /> : <EyeOff size={10} />} Aperçu
              </button>
              {editingId && (
                <button onClick={cancelEdit} className="text-stone-500 hover:text-red-400 transition-colors p-1"><X size={14} /></button>
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
                      className={`px-2 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all ${form.category === c.id ? `${c.bg} ${c.border} ${c.color}` : "border-stone-700 text-stone-500 hover:text-stone-300 hover:border-stone-600"}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Titre + Emoji */}
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm font-bold text-stone-200 outline-none focus:border-amber-500/50 font-serif placeholder:text-stone-600"
                  placeholder="Titre de l'article *"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <input
                  className="w-14 bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-2xl text-center outline-none focus:border-amber-500/50"
                  placeholder="🖋"
                  value={form.imageEmoji}
                  onChange={(e) => setForm({ ...form, imageEmoji: e.target.value })}
                  title="Emoji décoratif (optionnel)"
                  maxLength={2}
                />
              </div>

              {/* Sous-titre */}
              <input
                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-xs text-stone-300 outline-none focus:border-amber-500/50 italic placeholder:text-stone-600"
                placeholder="Sous-titre ou accroche (optionnel)"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />

              {/* Contenu */}
              <div>
                <textarea
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 outline-none focus:border-amber-500/50 resize-none font-serif placeholder:text-stone-600"
                  placeholder={"Corps de l'article…\n\nUtilisez des sauts de ligne pour créer des paragraphes.\n\nVous pouvez rédiger un texte long et détaillé."}
                  rows={10}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
                <div className="flex items-center justify-between mt-0.5">
                  <div className="text-[9px] text-stone-600 italic">Sauts de ligne préservés à l'affichage</div>
                  <div className={`text-[9px] font-mono ${form.content.length > 2000 ? "text-orange-400" : "text-stone-600"}`}>{form.content.length} car.</div>
                </div>
              </div>

              {/* Épingler */}
              <div className="flex items-center justify-between pt-1">
                <button type="button" onClick={() => setForm({ ...form, pinned: !form.pinned })} className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${form.pinned ? "bg-amber-600" : "bg-stone-700"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.pinned ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest select-none">
                    📌 Épingler en Une
                  </span>
                </button>
              </div>

              <button
                onClick={handlePublish}
                disabled={!form.title.trim() || !form.content.trim()}
                className="w-full py-2.5 bg-amber-900/50 border border-amber-800/50 text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-900/70 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
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
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Chercher un article…"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-7 pr-3 py-2 text-xs text-stone-200 outline-none focus:border-amber-500/50" />
            </div>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
              className="bg-stone-800 border border-stone-700 rounded-lg px-2 py-2 text-xs text-stone-300 outline-none focus:border-amber-500/50 shrink-0">
              <option value="ALL">Toutes</option>
              {GAZETTE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent">
            {filtered.length === 0 ? (
              <div className="text-xs text-stone-600 text-center py-12 italic border border-dashed border-stone-700 rounded-xl">
                Aucun article publié
              </div>
            ) : filtered.map((a) => {
              const cat = catInfo(a.category);
              return (
                <div key={a.id} className={`bg-stone-800/40 border rounded-xl p-3 group hover:border-stone-600 transition-all ${a.pinned ? "border-amber-800/40" : "border-stone-700"} ${editingId === a.id ? "ring-1 ring-amber-600/50" : ""}`}>
                  <div className="flex items-start gap-2">
                    {a.imageEmoji && <span className="text-xl shrink-0 mt-0.5">{a.imageEmoji}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {a.pinned && <span className="text-[8px] font-black uppercase text-amber-400">📌 Une</span>}
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${cat.bg} ${cat.border} ${cat.color}`}>{cat.label}</span>
                        <span className={`text-[8px] ${a.scope === "GLOBAL" ? "text-yellow-600" : "text-blue-500"}`}>{a.scope === "GLOBAL" ? "⚜️" : "🏴"}</span>
                      </div>
                      <div className="text-xs font-black text-stone-200 font-serif leading-snug line-clamp-2">{a.title}</div>
                      {a.subtitle && <div className="text-[10px] text-stone-500 italic truncate mt-0.5">{a.subtitle}</div>}
                      <div className="text-[9px] text-stone-600 mt-1 flex items-center gap-1">
                        <Calendar size={9} /> {a.date} · {a.author}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                      <button onClick={() => togglePin(a.id)} title={a.pinned ? "Désépingler" : "Épingler"}
                        className={`p-1.5 rounded transition-colors ${a.pinned ? "text-amber-400 hover:text-amber-300" : "text-stone-600 hover:text-amber-400"}`}>
                        📌
                      </button>
                      <button onClick={() => openEdit(a)} className="p-1.5 text-stone-500 hover:text-stone-200 rounded transition-colors">
                        <Edit3 size={12} />
                      </button>
                      <button onClick={() => deleteArticle(a.id, a.title)} className="p-1.5 text-stone-600 hover:text-red-400 rounded transition-colors">
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
