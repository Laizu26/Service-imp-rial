import React, { useState, useMemo } from "react";
import {
  GraduationCap, Plus, Trash2, ChevronUp, ChevronDown,
  BookOpen, Globe, Edit3, CheckCircle, Clock, XCircle,
  AlertTriangle, Eye, EyeOff, ImageIcon, AlignLeft,
} from "lucide-react";
import RichTextEditor from "../ui/RichTextEditor";
import { isHtml, sanitizeHtml } from "../../lib/richText";

const CATEGORIES = ["Sciences", "Histoire", "Arts", "Philosophie", "Magie", "Droit", "Géographie", "Médecine", "Théologie"];

function formatMoney(n) {
  return n?.toLocaleString("fr-FR") + " écus";
}

function totalWords(chapters) {
  return (chapters || []).reduce((s, c) => s + (c.content || "").trim().split(/\s+/).filter(Boolean).length, 0);
}

function ChapterEditor({ chapter, idx, total, onChange, onDelete, onMoveUp, onMoveDown }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-stone-50 border-b border-stone-200 px-4 py-2 flex items-center gap-3">
        <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Chapitre {idx + 1}</span>
        <input
          className="flex-1 bg-transparent text-sm font-bold text-stone-800 outline-none placeholder:text-stone-300"
          placeholder={`Titre du chapitre ${idx + 1}…`}
          value={chapter.title}
          onChange={e => onChange({ ...chapter, title: e.target.value })}
        />
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onMoveUp} disabled={idx === 0} className="p-1 rounded hover:bg-stone-200 disabled:opacity-30 text-stone-500 hover:text-stone-800 transition-colors">
            <ChevronUp size={13} />
          </button>
          <button onClick={onMoveDown} disabled={idx === total - 1} className="p-1 rounded hover:bg-stone-200 disabled:opacity-30 text-stone-500 hover:text-stone-800 transition-colors">
            <ChevronDown size={13} />
          </button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-100 text-stone-400 hover:text-red-600 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <RichTextEditor
        value={chapter.content}
        onChange={val => onChange({ ...chapter, content: val })}
        placeholder="Rédigez le contenu de ce chapitre…"
        minHeight={220}
      />
      <div className="px-4 py-1.5 bg-stone-50 border-t border-stone-100 text-[9px] text-stone-400">
        {(chapter.content || "").replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length} mots
      </div>
    </div>
  );
}

export default function EruditView({
  user, countries = [], eruditRequests = [], eruditResearch = [],
  onRequestEruditValidation, onWithdrawEruditFromCountry,
  onSaveEruditResearch, onPublishEruditResearch, onUnpublishEruditResearch,
  onDeleteEruditResearch, onSetEruditResearchAccess,
}) {
  const [tab, setTab] = useState("reconnaissances"); // reconnaissances | oeuvres | editeur
  const [editingId, setEditingId] = useState(null);

  // Champs de l'éditeur
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [category, setCategory] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [chapters, setChapters] = useState([{ id: `ch_${Date.now()}`, title: "", content: "" }]);

  // Accès pays
  const [accessMode, setAccessMode] = useState("all"); // "all" | "select"
  const [selectedCountries, setSelectedCountries] = useState([]);

  // Lecture d'une œuvre
  const [readingId, setReadingId] = useState(null);
  const [readingChapter, setReadingChapter] = useState(0);

  // Confirmation retrait
  const [withdrawConfirm, setWithdrawConfirm] = useState(null);

  const myRequests = useMemo(() =>
    eruditRequests.filter(r => String(r.citizenId) === String(user?.id)),
    [eruditRequests, user?.id]
  );

  const myWorks = useMemo(() =>
    [...eruditResearch.filter(r => String(r.authorId) === String(user?.id))]
      .sort((a, b) => String(b.id).localeCompare(String(a.id))),
    [eruditResearch, user?.id]
  );

  const approvedCountryIds = useMemo(() =>
    myRequests.filter(r => r.status === "APPROVED").map(r => r.countryId),
    [myRequests]
  );

  const startEdit = (res = null) => {
    if (res) {
      setEditingId(res.id);
      setTitle(res.title || "");
      setSubtitle(res.subtitle || "");
      setAbstract(res.abstract || "");
      setCategory(res.category || "");
      setCoverUrl(res.coverUrl || "");
      setChapters(res.chapters?.length ? res.chapters : [{ id: `ch_${Date.now()}`, title: "", content: "" }]);
      if (res.accessCountries === null) {
        setAccessMode("all"); setSelectedCountries([]);
      } else {
        setAccessMode("select"); setSelectedCountries(res.accessCountries || []);
      }
    } else {
      setEditingId(null);
      setTitle(""); setSubtitle(""); setAbstract(""); setCategory(""); setCoverUrl("");
      setChapters([{ id: `ch_${Date.now()}`, title: "", content: "" }]);
      setAccessMode("all"); setSelectedCountries([]);
    }
    setTab("editeur");
  };

  const saveWork = () => {
    if (!title.trim()) return;
    onSaveEruditResearch && onSaveEruditResearch({
      id: editingId || null,
      title: title.trim(),
      subtitle: subtitle.trim(),
      abstract: abstract.trim(),
      chapters,
      category: category.trim(),
      coverUrl: coverUrl.trim(),
      accessCountries: accessMode === "all" ? null : selectedCountries,
    });
    setTab("oeuvres");
  };

  const addChapter = () => {
    setChapters(prev => [...prev, { id: `ch_${Date.now()}`, title: "", content: "" }]);
  };

  const updateChapter = (idx, updated) => {
    setChapters(prev => prev.map((c, i) => i === idx ? updated : c));
  };

  const deleteChapter = (idx) => {
    if (chapters.length <= 1) return;
    setChapters(prev => prev.filter((_, i) => i !== idx));
  };

  const moveChapter = (idx, dir) => {
    setChapters(prev => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  const toggleCountry = (cid) => {
    setSelectedCountries(prev =>
      prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]
    );
  };

  // Reading mode
  const readingWork = readingId ? myWorks.find(r => r.id === readingId) : null;

  if (readingWork) {
    const chaps = readingWork.chapters || [];
    const ch = chaps[readingChapter];
    return (
      <div className="bg-[#fdf6e3] rounded-xl border border-stone-200 shadow-lg overflow-hidden animate-in fade-in">
        {/* Book header */}
        <div className="bg-gradient-to-r from-purple-900 to-stone-900 px-6 py-5 text-white">
          <button onClick={() => setReadingId(null)} className="text-[9px] font-black uppercase tracking-widest text-purple-300 hover:text-white mb-3 flex items-center gap-1">
            ← Retour à mes œuvres
          </button>
          {readingWork.coverUrl && (
            <img src={readingWork.coverUrl} alt="" className="w-full max-h-40 object-cover rounded-lg mb-4 opacity-80" onError={e => e.target.style.display="none"} />
          )}
          <h1 className="text-2xl font-black font-serif">{readingWork.title}</h1>
          {readingWork.subtitle && <p className="text-purple-200 italic font-serif mt-1">{readingWork.subtitle}</p>}
          {readingWork.abstract && (
            <p className="text-stone-300 text-sm leading-relaxed mt-3 font-serif border-l-2 border-purple-500 pl-3">{readingWork.abstract}</p>
          )}
          <div className="flex items-center gap-3 mt-3 text-[10px] text-purple-300">
            {readingWork.category && <span className="bg-purple-800/50 px-2 py-0.5 rounded">{readingWork.category}</span>}
            <span>{totalWords(chaps)} mots · {chaps.length} chapitre{chaps.length > 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Table of contents / chapter nav */}
        {chaps.length > 1 && (
          <div className="bg-stone-50 border-b border-stone-200 px-4 py-2 flex gap-1 overflow-x-auto scrollbar-hide">
            {chaps.map((c, i) => (
              <button key={c.id} onClick={() => setReadingChapter(i)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${readingChapter === i ? "bg-purple-700 text-white" : "text-stone-500 hover:bg-stone-200"}`}>
                {c.title || `Chapitre ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* Chapter content */}
        <div className="px-6 md:px-12 py-8 max-w-2xl mx-auto">
          {ch && (
            <>
              {ch.title && <h2 className="text-xl font-black font-serif text-stone-800 mb-6 pb-3 border-b border-stone-200">{ch.title}</h2>}
              {isHtml(ch.content) ? (
                <div className="erudit-reading text-[15px]" dangerouslySetInnerHTML={{ __html: sanitizeHtml(ch.content) }} />
              ) : (
                <div className="text-stone-800 font-serif leading-[1.9] text-[15px] whitespace-pre-wrap">{ch.content}</div>
              )}
            </>
          )}
          {/* Chapter navigation */}
          {chaps.length > 1 && (
            <div className="flex justify-between mt-10 pt-4 border-t border-stone-200">
              <button disabled={readingChapter === 0} onClick={() => setReadingChapter(p => p - 1)}
                className="text-[10px] font-black uppercase text-stone-500 hover:text-stone-800 disabled:opacity-30 transition-colors">
                ← Chapitre précédent
              </button>
              <span className="text-[9px] text-stone-400">{readingChapter + 1} / {chaps.length}</span>
              <button disabled={readingChapter === chaps.length - 1} onClick={() => setReadingChapter(p => p + 1)}
                className="text-[10px] font-black uppercase text-stone-500 hover:text-stone-800 disabled:opacity-30 transition-colors">
                Chapitre suivant →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-stone-900 rounded-xl p-5 text-white flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-800/50 flex items-center justify-center shrink-0">
          <GraduationCap size={24} className="text-purple-200" />
        </div>
        <div>
          <h2 className="text-lg font-black uppercase tracking-widest font-serif">Statut Érudit</h2>
          <p className="text-[10px] text-purple-300 uppercase tracking-widest mt-0.5">
            {myWorks.filter(r => r.published).length} œuvres publiées · {approvedCountryIds.length} pays reconnu{approvedCountryIds.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-200 rounded-xl p-1">
        {[
          { id: "reconnaissances", label: "Reconnaissances" },
          { id: "oeuvres", label: `Mes œuvres (${myWorks.length})` },
          { id: "editeur", label: editingId ? "Modifier" : "Rédiger" },
        ].map(t => (
          <button key={t.id} onClick={() => { if (t.id !== "editeur") setTab(t.id); else startEdit(); }}
            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tab === t.id ? "bg-white text-stone-900 shadow-md" : "text-stone-500 hover:text-stone-800"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* RECONNAISSANCES */}
      {tab === "reconnaissances" && (
        <div className="space-y-2">
          {countries.map(country => {
            const myReqs = myRequests.filter(r => r.countryId === country.id);
            const latest = [...myReqs].sort((a, b) => String(b.id).localeCompare(String(a.id)))[0];
            const salary = country.laws?.eruditSalary || 0;
            const isPending = latest?.status === "PENDING";
            const isApproved = latest?.status === "APPROVED";
            const isRejected = latest?.status === "REJECTED";
            const isExpelled = latest?.status === "EXPELLED";
            const isWithdrawn = latest?.status === "WITHDRAWN";

            return (
              <div key={country.id} className="bg-white border border-stone-200 rounded-xl p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-black text-stone-800">{country.name}</div>
                  {salary > 0 && <div className="text-[10px] text-purple-600 font-bold mt-0.5">Rémunération : {formatMoney(salary)} / jour</div>}
                  {latest && (
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      {isApproved && `Reconnu depuis le ${latest.responseDate} (validé par ${latest.respondedBy})`}
                      {isPending && `En attente depuis le ${latest.requestDate}`}
                      {isRejected && `Refusé le ${latest.responseDate}${latest.note ? ` — ${latest.note}` : ""}`}
                      {isExpelled && `Radié le ${latest.expelledDate} par ${latest.expelledBy}${latest.expelNote ? ` — ${latest.expelNote}` : ""}`}
                      {isWithdrawn && `Retiré le ${latest.withdrawnDate}`}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0 items-end">
                  {isApproved && (
                    <>
                      <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-full bg-green-100 text-green-700 border border-green-300">✓ Reconnu</span>
                      {withdrawConfirm === country.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => { onWithdrawEruditFromCountry && onWithdrawEruditFromCountry(country.id); setWithdrawConfirm(null); }}
                            className="text-[8px] px-2 py-1 rounded bg-red-600 text-white font-black uppercase hover:bg-red-500 transition-colors">Confirmer</button>
                          <button onClick={() => setWithdrawConfirm(null)} className="text-[8px] px-2 py-1 rounded bg-stone-200 text-stone-600 font-black uppercase">Annuler</button>
                        </div>
                      ) : (
                        <button onClick={() => setWithdrawConfirm(country.id)}
                          className="text-[8px] font-black uppercase px-2 py-1.5 rounded-lg border border-stone-300 text-stone-500 hover:text-red-600 hover:border-red-300 transition-colors">
                          Se retirer
                        </button>
                      )}
                    </>
                  )}
                  {isPending && <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">⏳ En attente</span>}
                  {isExpelled && <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-full bg-red-100 text-red-700 border border-red-300">⛔ Radié</span>}
                  {isWithdrawn && <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-full bg-stone-100 text-stone-500 border border-stone-300">Retiré</span>}
                  {(!latest || isRejected || isExpelled || isWithdrawn) && (
                    <button onClick={() => onRequestEruditValidation && onRequestEruditValidation(country.id)}
                      className="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg bg-stone-800 text-stone-200 hover:bg-stone-700 transition-colors">
                      {isRejected || isExpelled || isWithdrawn ? "Re-soumettre" : "Demander"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OEUVRES */}
      {tab === "oeuvres" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => startEdit()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
              <Plus size={14} /> Nouvelle œuvre
            </button>
          </div>
          {myWorks.length === 0 && (
            <div className="text-center py-12 text-stone-400 italic text-sm">Aucune œuvre. Cliquez sur <strong>Nouvelle œuvre</strong> pour commencer.</div>
          )}
          {myWorks.map(res => {
            const words = totalWords(res.chapters);
            const chaps = res.chapters?.length || 0;
            return (
              <div key={res.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-start gap-4 p-4">
                  {res.coverUrl && (
                    <img src={res.coverUrl} alt="" className="w-14 h-20 object-cover rounded-lg shrink-0 border border-stone-200" onError={e => e.target.style.display="none"} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-stone-800 text-base font-serif">{res.title}</span>
                      {res.published
                        ? <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">Publié</span>
                        : <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500 border border-stone-200">Brouillon</span>
                      }
                      {res.category && <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-400">{res.category}</span>}
                    </div>
                    {res.subtitle && <p className="text-xs text-stone-500 italic font-serif mt-0.5">{res.subtitle}</p>}
                    {res.abstract && <p className="text-xs text-stone-500 leading-relaxed mt-1 line-clamp-2 font-serif">{res.abstract}</p>}
                    <div className="flex items-center gap-3 mt-2 text-[9px] text-stone-400">
                      <span>{chaps} chapitre{chaps > 1 ? "s" : ""}</span>
                      <span>{words} mots</span>
                      <span>Modifié le {res.updatedDate}</span>
                    </div>
                    {/* Accès pays */}
                    <div className="mt-1.5 text-[9px] text-stone-400">
                      {res.accessCountries === null || res.accessCountries === undefined
                        ? "Accès : tous les pays"
                        : `Accès : ${res.accessCountries.length === 0 ? "aucun pays" : res.accessCountries.map(id => countries.find(c => c.id === id)?.name || id).join(", ")}`
                      }
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => { setReadingId(res.id); setReadingChapter(0); }}
                      className="text-[8px] font-black uppercase px-2 py-1.5 rounded-lg bg-stone-100 border border-stone-300 text-stone-600 hover:bg-stone-200 transition-colors text-center flex items-center gap-1">
                      <BookOpen size={10} /> Lire
                    </button>
                    <button onClick={() => startEdit(res)}
                      className="text-[8px] font-black uppercase px-2 py-1.5 rounded-lg bg-stone-100 border border-stone-300 text-stone-600 hover:bg-stone-200 transition-colors text-center">
                      Modifier
                    </button>
                    {res.published
                      ? <button onClick={() => onUnpublishEruditResearch && onUnpublishEruditResearch(res.id)}
                          className="text-[8px] font-black uppercase px-2 py-1.5 rounded-lg bg-stone-100 border border-stone-300 text-stone-600 hover:bg-stone-200 transition-colors text-center">
                          Dépublier
                        </button>
                      : <button disabled={!canPublishWork(res)} onClick={() => onPublishEruditResearch && onPublishEruditResearch(res.id)}
                          className="text-[8px] font-black uppercase px-2 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white transition-colors text-center">
                          Publier
                        </button>
                    }
                    <button onClick={() => onDeleteEruditResearch && onDeleteEruditResearch(res.id)}
                      className="text-[8px] font-black uppercase px-2 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors text-center">
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ÉDITEUR */}
      {tab === "editeur" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{editingId ? "Modifier l'œuvre" : "Nouvelle œuvre"}</span>
            <button onClick={() => setTab("oeuvres")} className="text-xs text-stone-400 hover:text-stone-700 font-bold">Annuler</button>
          </div>

          {/* Métadonnées */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
            <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2">Informations de l'œuvre</div>
            <input className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-lg font-black font-serif text-stone-800 outline-none focus:border-purple-400 placeholder:text-stone-300"
              placeholder="Titre de l'œuvre…" value={title} onChange={e => setTitle(e.target.value)} />
            <input className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm italic font-serif text-stone-600 outline-none focus:border-purple-400 placeholder:text-stone-300"
              placeholder="Sous-titre (optionnel)…" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
            <textarea className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm font-serif text-stone-700 outline-none focus:border-purple-400 resize-none leading-relaxed placeholder:text-stone-300"
              rows={3} placeholder="Résumé / introduction (optionnel)…" value={abstract} onChange={e => setAbstract(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-1">Catégorie</label>
                <input list="erudit-cats" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-700 outline-none focus:border-purple-400 placeholder:text-stone-300"
                  placeholder="Sciences, Histoire…" value={category} onChange={e => setCategory(e.target.value)} />
                <datalist id="erudit-cats">{CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-1">Image de couverture (URL)</label>
                <input className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-700 outline-none focus:border-purple-400 placeholder:text-stone-300"
                  placeholder="https://…" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Chapitres */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[9px] font-black uppercase tracking-widest text-stone-500">
                Chapitres ({chapters.length}) · {totalWords(chapters)} mots au total
              </div>
              <button onClick={addChapter}
                className="flex items-center gap-1.5 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg bg-stone-800 text-stone-200 hover:bg-stone-700 transition-colors">
                <Plus size={11} /> Ajouter un chapitre
              </button>
            </div>
            {chapters.map((ch, idx) => (
              <ChapterEditor
                key={ch.id} chapter={ch} idx={idx} total={chapters.length}
                onChange={updated => updateChapter(idx, updated)}
                onDelete={() => deleteChapter(idx)}
                onMoveUp={() => moveChapter(idx, -1)}
                onMoveDown={() => moveChapter(idx, 1)}
              />
            ))}
          </div>

          {/* Accès pays */}
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-3">Visibilité par pays</div>
            <div className="flex gap-3 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={accessMode === "all"} onChange={() => setAccessMode("all")} className="accent-purple-600" />
                <span className="text-xs font-bold text-stone-700">Tous les pays</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={accessMode === "select"} onChange={() => setAccessMode("select")} className="accent-purple-600" />
                <span className="text-xs font-bold text-stone-700">Pays spécifiques</span>
              </label>
            </div>
            {accessMode === "select" && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {countries.map(c => (
                  <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer">
                    <input type="checkbox" checked={selectedCountries.includes(c.id)} onChange={() => toggleCountry(c.id)} className="accent-purple-600" />
                    <span className="text-xs text-stone-700">{c.name}</span>
                    {approvedCountryIds.includes(c.id) && <span className="text-[8px] text-green-600 font-bold">✓ Reconnu</span>}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3">
            <button onClick={() => setTab("oeuvres")} className="px-4 py-2.5 rounded-xl text-xs font-black uppercase text-stone-500 hover:text-stone-800 transition-colors">
              Annuler
            </button>
            <button disabled={!title.trim()} onClick={saveWork}
              className="px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-white text-xs font-black uppercase tracking-widest transition-colors">
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function canPublishWork(res) {
  return (res.title || "").trim().length >= 3 &&
    (res.chapters || []).some(c => (c.content || "").trim().length >= 100);
}
