import React, { useState } from "react";
import {
  Book,
  Scroll,
  DownloadCloud,
  Link,
  Library,
  AlertTriangle,
  Pencil,
  FileText,
  Pin,
  ChevronUp,
  ChevronDown,
  Search,
  Tag,
  PenLine,
  CheckCircle,
} from "lucide-react";
import SecureDeleteButton from "../ui/SecureDeleteButton";
import { isNewEntry } from "../../lib/gameUtils";
import { ROLES } from "../../lib/constants";

const LibraryAdminView = ({ countries, onUpdate }) => {
  const [selectedCountryId, setSelectedCountryId] = useState(
    countries[0]?.id
  );
  const [activeTab, setActiveTab] = useState("decrees");

  // Mode d'entrée : "direct" ou "gdoc"
  const [inputMode, setInputMode] = useState("direct");

  // Formulaire
  const [importTitle, setImportTitle] = useState("");
  const [importAuthor, setImportAuthor] = useState("");
  const [importCategory, setImportCategory] = useState("");
  const [importContent, setImportContent] = useState("");
  const [gDocUrl, setGDocUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Édition
  const [editingId, setEditingId] = useState(null);

  // Recherche dans la liste existante
  const [listSearch, setListSearch] = useState("");

  // Access control
  const [bookAccess, setBookAccess] = useState("public");
  const [bookAccessCountries, setBookAccessCountries] = useState([]);
  const [bookAccessRoles, setBookAccessRoles] = useState([]);
  const [bookAccessCitizens, setBookAccessCitizens] = useState("");

  const selectedCountry =
    countries.find((c) => c.id === selectedCountryId) || countries[0];

  const updateCountry = (updates) => {
    onUpdate(
      countries.map((c) =>
        c.id === selectedCountryId ? { ...c, ...updates } : c
      )
    );
  };

  // --- RESET FORMULAIRE ---
  const resetForm = () => {
    setImportTitle("");
    setImportAuthor("");
    setImportCategory("");
    setImportContent("");
    setGDocUrl("");
    setEditingId(null);
    setBookAccess("public");
    setBookAccessCountries([]);
    setBookAccessRoles([]);
    setBookAccessCitizens("");
  };

  // --- CHARGER UN ENTRY POUR ÉDITION ---
  const startEditing = (entry) => {
    setInputMode("direct");
    setEditingId(entry.id);
    if (activeTab === "decrees") {
      setImportTitle(entry.name || "");
      setImportContent(entry.content || "");
    } else {
      setImportTitle(entry.title || "");
      setImportAuthor(entry.author || "");
      setImportCategory(entry.category || "");
      setImportContent(entry.content || "");
      setBookAccess(entry.access || "public");
      setBookAccessCountries(entry.accessCountryIds || []);
      setBookAccessRoles(entry.accessRoles || []);
      setBookAccessCitizens((entry.accessCitizenIds || []).join(", "));
    }
  };

  // --- SUPPRESSION TOTALE ---
  const handleClearAllDecrees = () => {
    const confirm1 = window.confirm(
      `ATTENTION : Vous allez supprimer TOUS les décrets de ${selectedCountry.name}.`
    );
    if (!confirm1) return;
    const confirm2 = window.confirm(
      "Êtes-vous vraiment sûr ? Cette action est irréversible."
    );
    if (confirm2) {
      updateCountry({ decrees: [] });
    }
  };

  // --- ÉPINGLER / DÉSÉPINGLER UN DÉCRET ---
  const handleTogglePin = (decreeId) => {
    const updated = (selectedCountry.decrees || []).map((d) =>
      d.id === decreeId ? { ...d, pinned: !d.pinned } : d
    );
    updateCountry({ decrees: updated });
  };

  // --- RÉORDONNER LES DÉCRETS ---
  const handleMove = (idx, direction) => {
    const decrees = [...(selectedCountry.decrees || [])];
    const target = idx + direction;
    if (target < 0 || target >= decrees.length) return;
    [decrees[idx], decrees[target]] = [decrees[target], decrees[idx]];
    updateCountry({ decrees });
  };

  // --- IMPORT GDOC ---
  const fetchGDocContent = async (url) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) throw new Error("Lien GDoc invalide.");
    const docId = match[1];
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
      exportUrl
    )}`;
    const response = await fetch(proxyUrl);
    if (!response.ok)
      throw new Error(
        "Impossible de lire le GDoc (Vérifiez qu'il est Public)."
      );
    return await response.text();
  };

  // --- SAUVEGARDER (CRÉER OU ÉDITER) ---
  const handleSave = async () => {
    if (!importTitle) return;

    let content = importContent;

    if (inputMode === "gdoc") {
      if (!gDocUrl) return;
      setIsLoading(true);
      try {
        content = await fetchGDocContent(gDocUrl);
      } catch (err) {
        alert("Erreur : " + err.message);
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    if (!content) {
      alert("Le contenu ne peut pas être vide.");
      return;
    }

    if (activeTab === "decrees") {
      const currentDecrees = selectedCountry.decrees || [];

      if (editingId) {
        const updated = currentDecrees.map((d) =>
          d.id === editingId
            ? { ...d, name: importTitle, content: content }
            : d
        );
        updateCountry({ decrees: updated });
      } else {
        const newDecree = {
          id: Date.now(),
          name: importTitle,
          content: content,
          date: new Date().toISOString(),
          pinned: false,
        };
        updateCountry({ decrees: [newDecree, ...currentDecrees] });
      }
    } else {
      const currentBooks = selectedCountry.books || [];

      if (editingId) {
        const updated = currentBooks.map((b) =>
          b.id === editingId
            ? {
                ...b,
                title: importTitle,
                author: importAuthor,
                category: importCategory,
                content: content,
                access: bookAccess,
                accessCountryIds: bookAccess === "country" ? bookAccessCountries : [],
                accessRoles: bookAccess === "roles" ? bookAccessRoles : [],
                accessCitizenIds: bookAccess === "citizens" ? bookAccessCitizens.split(",").map((s) => s.trim()).filter(Boolean) : [],
              }
            : b
        );
        updateCountry({ books: updated });
      } else {
        const newBook = {
          id: Date.now(),
          title: importTitle,
          author: importAuthor,
          category: importCategory,
          content: content,
          date: new Date().toISOString(),
          access: bookAccess,
          accessCountryIds: bookAccess === "country" ? bookAccessCountries : [],
          accessRoles: bookAccess === "roles" ? bookAccessRoles : [],
          accessCitizenIds: bookAccess === "citizens" ? bookAccessCitizens.split(",").map((s) => s.trim()).filter(Boolean) : [],
        };
        updateCountry({ books: [newBook, ...currentBooks] });
      }
    }

    resetForm();
  };

  // --- APPROVE/REJECT PENDING ---
  const handleApprovePending = (submission) => {
    const currentBooks = selectedCountry.books || [];
    const remainingPending = (selectedCountry.pendingBooks || []).filter(
      (p) => p.id !== submission.id
    );
    const approvedBook = {
      id: Date.now(),
      title: submission.title,
      author: submission.authorName || "",
      category: submission.category || "",
      content: submission.content,
      date: new Date().toISOString(),
      access: "public",
      accessCountryIds: [],
      accessRoles: [],
      accessCitizenIds: [],
    };
    updateCountry({ books: [approvedBook, ...currentBooks], pendingBooks: remainingPending });
  };

  const handleRejectPending = (submission) => {
    const remainingPending = (selectedCountry.pendingBooks || []).filter(
      (p) => p.id !== submission.id
    );
    updateCountry({ pendingBooks: remainingPending });
  };

  // Filtrage de la liste
  const filteredDecrees = (selectedCountry.decrees || []).filter(
    (d) =>
      !listSearch ||
      d.name?.toLowerCase().includes(listSearch.toLowerCase()) ||
      d.content?.toLowerCase().includes(listSearch.toLowerCase())
  );

  const filteredBooks = (selectedCountry.books || []).filter(
    (b) =>
      !listSearch ||
      b.title?.toLowerCase().includes(listSearch.toLowerCase()) ||
      b.author?.toLowerCase().includes(listSearch.toLowerCase()) ||
      b.category?.toLowerCase().includes(listSearch.toLowerCase())
  );

  // Décrets épinglés en premier
  const sortedDecrees = [
    ...filteredDecrees.filter((d) => d.pinned),
    ...filteredDecrees.filter((d) => !d.pinned),
  ];

  // Catégories utilisées (pour le datalist)
  const usedCategories = [
    ...new Set((selectedCountry.books || []).map((b) => b.category).filter(Boolean)),
  ];

  const pendingBooks = selectedCountry.pendingBooks || [];

  // Helper: toggle checkbox array
  const toggleArrayItem = (arr, setArr, item) => {
    if (arr.includes(item)) setArr(arr.filter((x) => x !== item));
    else setArr([...arr, item]);
  };

  return (
    <div className="h-full flex flex-col bg-stone-100 rounded-xl overflow-hidden border border-stone-300">
      {/* HEADER */}
      <div className="bg-stone-900 text-white p-6 shadow-md z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Library size={28} className="text-yellow-500" />
            <h2 className="text-2xl font-black uppercase tracking-widest">
              Administration des Archives
            </h2>
          </div>

          <select
            className="bg-stone-800 border border-stone-600 text-white p-2 rounded text-sm font-bold uppercase tracking-wide outline-none focus:border-yellow-500"
            value={selectedCountryId}
            onChange={(e) => {
              setSelectedCountryId(e.target.value);
              resetForm();
              setListSearch("");
            }}
          >
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* TABS */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setActiveTab("decrees");
              resetForm();
              setListSearch("");
            }}
            className={`px-6 py-3 rounded-t-lg font-bold uppercase text-xs tracking-widest flex items-center gap-2 transition-colors ${
              activeTab === "decrees"
                ? "bg-stone-100 text-stone-900"
                : "bg-stone-800 text-stone-500 hover:text-white"
            }`}
          >
            <Scroll size={16} /> Gestion des Décrets
            {(selectedCountry.decrees || []).length > 0 && (
              <span className="bg-stone-600 text-stone-200 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {(selectedCountry.decrees || []).length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("books");
              resetForm();
              setListSearch("");
            }}
            className={`px-6 py-3 rounded-t-lg font-bold uppercase text-xs tracking-widest flex items-center gap-2 transition-colors ${
              activeTab === "books"
                ? "bg-stone-100 text-stone-900"
                : "bg-stone-800 text-stone-500 hover:text-white"
            }`}
          >
            <Book size={16} /> Édition de Livres
            {(selectedCountry.books || []).length > 0 && (
              <span className="bg-stone-600 text-stone-200 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {(selectedCountry.books || []).length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab("pending"); resetForm(); setListSearch(""); }}
            className={`px-6 py-3 rounded-t-lg font-bold uppercase text-xs tracking-widest flex items-center gap-2 transition-colors ${
              activeTab === "pending"
                ? "bg-stone-100 text-stone-900"
                : "bg-stone-800 text-stone-500 hover:text-white"
            }`}
          >
            <PenLine size={16} /> Soumissions
            {pendingBooks.length > 0 && (
              <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {pendingBooks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CONTENU */}
      <div className="flex-1 overflow-y-auto p-8">

        {/* ── PENDING TAB ── */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <PenLine size={16} className="text-stone-500" />
              <h3 className="text-sm font-black uppercase text-stone-400 tracking-widest">
                Soumissions citoyennes — {selectedCountry.name}
              </h3>
            </div>

            {pendingBooks.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-stone-200 shadow-sm">
                <CheckCircle size={32} className="mx-auto text-stone-300 mb-3" />
                <p className="text-stone-400 italic text-sm">Aucune soumission en attente.</p>
              </div>
            ) : (
              pendingBooks.map((sub, idx) => {
                const wordCount = (sub.content || "").split(/\s+/).filter(Boolean).length;
                return (
                  <div
                    key={sub.id || idx}
                    className="bg-white rounded-xl border border-stone-200 shadow-sm p-6"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap mb-1">
                          <h4 className="font-serif font-bold text-lg text-stone-900">
                            {sub.title}
                          </h4>
                          {sub.category && (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full mt-1">
                              {sub.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-stone-400 mb-3 flex-wrap">
                          <span>par <strong className="text-stone-600">{sub.authorName || "Anonyme"}</strong></span>
                          {sub.date && (
                            <span>{new Date(sub.date).toLocaleDateString("fr-FR")}</span>
                          )}
                          <span>{wordCount} mots</span>
                        </div>
                        <p className="text-sm text-stone-600 italic font-serif line-clamp-3 border-l-2 border-stone-200 pl-3">
                          {(sub.content || "").substring(0, 150)}…
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => handleApprovePending(sub)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle size={13} /> Approuver
                        </button>
                        <button
                          onClick={() => handleRejectPending(sub)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-widest rounded hover:bg-red-200 border border-red-200 transition-colors"
                        >
                          ✕ Refuser
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── DECREES & BOOKS TABS ── */}
        {(activeTab === "decrees" || activeTab === "books") && (
          <>
            {/* ZONE DE SAISIE */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                  {editingId ? (
                    <>
                      <Pencil size={16} />{" "}
                      {activeTab === "decrees"
                        ? "Modifier le décret"
                        : "Modifier l'ouvrage"}
                    </>
                  ) : (
                    <>
                      {activeTab === "decrees"
                        ? "Nouvelle Proclamation"
                        : "Nouvel Ouvrage"}
                    </>
                  )}
                </h3>

                {/* TOGGLE MODE */}
                {!editingId && (
                  <div className="flex bg-stone-100 rounded-lg p-1 gap-1">
                    <button
                      onClick={() => setInputMode("direct")}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors ${
                        inputMode === "direct"
                          ? "bg-white text-stone-900 shadow-sm"
                          : "text-stone-400 hover:text-stone-600"
                      }`}
                    >
                      <FileText size={12} /> Saisie directe
                    </button>
                    <button
                      onClick={() => setInputMode("gdoc")}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors ${
                        inputMode === "gdoc"
                          ? "bg-white text-stone-900 shadow-sm"
                          : "text-stone-400 hover:text-stone-600"
                      }`}
                    >
                      <DownloadCloud size={12} /> Google Docs
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {/* TITRE */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-stone-500 mb-1 block">
                    {activeTab === "decrees"
                      ? "Titre de la Proclamation"
                      : "Titre de l'Ouvrage"}
                  </label>
                  <input
                    className="w-full p-3 border border-stone-300 rounded-lg font-serif font-bold text-lg outline-none focus:border-stone-800"
                    placeholder={
                      activeTab === "decrees"
                        ? "Ex: Ordonnance de Sécurité..."
                        : "Ex: Histoire de l'Empire..."
                    }
                    value={importTitle}
                    onChange={(e) => setImportTitle(e.target.value)}
                  />
                </div>

                {/* AUTEUR + CATÉGORIE (livres uniquement) */}
                {activeTab === "books" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-stone-500 mb-1 block">
                        Auteur
                      </label>
                      <input
                        className="w-full p-3 border border-stone-300 rounded-lg text-sm outline-none focus:border-stone-800"
                        placeholder="Ex: Chroniqueur Royal Théodore..."
                        value={importAuthor}
                        onChange={(e) => setImportAuthor(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-stone-500 mb-1 flex items-center gap-1">
                        <Tag size={10} /> Catégorie / Genre
                      </label>
                      <input
                        list="category-suggestions"
                        className="w-full p-3 border border-stone-300 rounded-lg text-sm outline-none focus:border-stone-800"
                        placeholder="Ex: Histoire, Loi, Roman, Poésie..."
                        value={importCategory}
                        onChange={(e) => setImportCategory(e.target.value)}
                      />
                      <datalist id="category-suggestions">
                        {usedCategories.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                )}

                {/* ACCESS CONTROL (livres uniquement) */}
                {activeTab === "books" && (
                  <div className="border border-stone-200 rounded-lg p-4 bg-stone-50">
                    <label className="text-[10px] font-bold uppercase text-stone-500 mb-2 block">
                      Accès à l'ouvrage
                    </label>
                    <select
                      className="w-full p-2.5 border border-stone-300 rounded-lg text-sm outline-none focus:border-stone-800 bg-white mb-3"
                      value={bookAccess}
                      onChange={(e) => {
                        setBookAccess(e.target.value);
                        setBookAccessCountries([]);
                        setBookAccessRoles([]);
                        setBookAccessCitizens("");
                      }}
                    >
                      <option value="public">🌍 Public — Accessible à tous</option>
                      <option value="country">🏰 Pays — Réservé à certains pays</option>
                      <option value="roles">🎭 Rôles — Réservé à certains rôles</option>
                      <option value="citizens">🔒 Citoyens — Accès restreint par ID</option>
                    </select>

                    {bookAccess === "country" && (
                      <div>
                        <p className="text-[10px] text-stone-500 mb-2 font-bold uppercase">Pays autorisés :</p>
                        <div className="grid grid-cols-2 gap-1">
                          {countries.map((c) => (
                            <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white rounded px-2 py-1">
                              <input
                                type="checkbox"
                                checked={bookAccessCountries.includes(c.id)}
                                onChange={() => toggleArrayItem(bookAccessCountries, setBookAccessCountries, c.id)}
                                className="rounded"
                              />
                              {c.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {bookAccess === "roles" && (
                      <div>
                        <p className="text-[10px] text-stone-500 mb-2 font-bold uppercase">Rôles autorisés :</p>
                        <div className="grid grid-cols-2 gap-1">
                          {Object.entries(ROLES).map(([key, val]) => (
                            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white rounded px-2 py-1">
                              <input
                                type="checkbox"
                                checked={bookAccessRoles.includes(key)}
                                onChange={() => toggleArrayItem(bookAccessRoles, setBookAccessRoles, key)}
                                className="rounded"
                              />
                              {val.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {bookAccess === "citizens" && (
                      <div>
                        <p className="text-[10px] text-stone-500 mb-2 font-bold uppercase">IDs citoyens autorisés (séparés par virgules) :</p>
                        <textarea
                          className="w-full p-2.5 border border-stone-300 rounded-lg text-sm font-mono outline-none focus:border-stone-800 min-h-[60px] resize-y"
                          placeholder="id1, id2, id3..."
                          value={bookAccessCitizens}
                          onChange={(e) => setBookAccessCitizens(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* CONTENU : MODE DIRECT */}
                {inputMode === "direct" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-stone-500 mb-1 block">
                      Contenu
                    </label>
                    <textarea
                      className="w-full p-4 border border-stone-300 rounded-lg text-sm font-serif leading-relaxed outline-none focus:border-stone-800 min-h-[200px] resize-y"
                      placeholder="Rédigez le contenu ici..."
                      value={importContent}
                      onChange={(e) => setImportContent(e.target.value)}
                    />
                    {importContent && (
                      <div className="text-[9px] text-stone-400 mt-1 text-right">
                        {importContent.length} caractères · {importContent.split(/\s+/).filter(Boolean).length} mots
                      </div>
                    )}
                  </div>
                )}

                {/* CONTENU : MODE GDOC */}
                {inputMode === "gdoc" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-stone-500 mb-1 block">
                      Lien Google Docs (Public)
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Link
                          size={16}
                          className="absolute left-3 top-3.5 text-stone-400"
                        />
                        <input
                          className="w-full p-3 pl-10 border border-stone-300 rounded-lg text-sm outline-none focus:border-stone-800 font-mono text-stone-600"
                          placeholder="https://docs.google.com/document/d/..."
                          value={gDocUrl}
                          onChange={(e) => setGDocUrl(e.target.value)}
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-stone-400 italic mt-1">
                      * Le document doit être en mode "Public". Tout le contenu sera
                      importé tel quel.
                    </p>
                  </div>
                )}

                {/* BOUTONS ACTION */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={
                      isLoading ||
                      !importTitle ||
                      (inputMode === "direct" && !importContent) ||
                      (inputMode === "gdoc" && !gDocUrl)
                    }
                    className="flex-1 bg-stone-900 text-white py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  >
                    {isLoading
                      ? "Chargement..."
                      : editingId
                      ? "Sauvegarder les modifications"
                      : activeTab === "decrees"
                      ? "Publier le décret"
                      : "Ajouter à la bibliothèque"}
                  </button>

                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="px-6 py-3 bg-stone-200 text-stone-600 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-stone-300 transition-colors"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* LISTE DU CONTENU EXISTANT */}
            <div className="grid gap-4">
              <div className="flex flex-wrap justify-between items-end gap-3 mb-2">
                <h3 className="text-sm font-black uppercase text-stone-400 tracking-widest">
                  Archives Actuelles ({selectedCountry.name})
                </h3>
                <div className="flex items-center gap-2">
                  {/* BARRE DE RECHERCHE */}
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input
                      className="pl-8 pr-3 py-1.5 border border-stone-300 rounded-lg text-[11px] font-medium outline-none bg-white focus:border-stone-600 w-44"
                      placeholder="Chercher..."
                      value={listSearch}
                      onChange={(e) => setListSearch(e.target.value)}
                    />
                  </div>
                  {activeTab === "decrees" &&
                    (selectedCountry.decrees || []).length > 0 && (
                      <button
                        onClick={handleClearAllDecrees}
                        className="text-[10px] font-bold uppercase text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded flex items-center gap-1 transition-colors border border-red-200"
                      >
                        <AlertTriangle size={12} /> Tout effacer
                      </button>
                    )}
                </div>
              </div>

              {/* LISTE DES DÉCRETS */}
              {activeTab === "decrees" && (
                <div className="space-y-2">
                  {sortedDecrees.map((decree, displayIdx) => {
                    const realIdx = (selectedCountry.decrees || []).findIndex(
                      (d) => d.id === decree.id
                    );
                    return (
                      <div
                        key={decree.id || displayIdx}
                        className={`bg-white p-4 rounded-lg border flex justify-between items-center group transition-colors ${
                          editingId === decree.id
                            ? "border-yellow-500 bg-yellow-50"
                            : decree.pinned
                            ? "border-stone-400 bg-stone-50"
                            : "border-stone-200"
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0 mr-4">
                          {decree.pinned && (
                            <Pin size={14} className="text-yellow-600 mt-1 shrink-0" fill="#ca8a04" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-stone-800">
                                {decree.name}
                              </span>
                              {isNewEntry(decree.date) && (
                                <span className="text-[8px] font-black uppercase tracking-widest bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                  Nouveau
                                </span>
                              )}
                            </div>
                            {decree.content && (
                              <span className="text-[10px] text-stone-400 italic truncate block">
                                {decree.content.substring(0, 90)}…
                              </span>
                            )}
                            {decree.date && (
                              <span className="text-[9px] text-stone-300 font-mono mt-1 block">
                                {new Date(decree.date).toLocaleDateString("fr-FR")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 items-center shrink-0">
                          {/* Reorder */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => handleMove(realIdx, -1)}
                              disabled={realIdx === 0}
                              className="p-1 text-stone-300 hover:text-stone-600 disabled:opacity-20 transition-colors"
                              title="Monter"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              onClick={() => handleMove(realIdx, 1)}
                              disabled={realIdx === (selectedCountry.decrees || []).length - 1}
                              className="p-1 text-stone-300 hover:text-stone-600 disabled:opacity-20 transition-colors"
                              title="Descendre"
                            >
                              <ChevronDown size={13} />
                            </button>
                          </div>
                          {/* Épingler */}
                          <button
                            onClick={() => handleTogglePin(decree.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              decree.pinned
                                ? "text-yellow-600 hover:text-yellow-800 bg-yellow-50"
                                : "text-stone-300 hover:text-stone-600 hover:bg-stone-100"
                            }`}
                            title={decree.pinned ? "Désépingler" : "Épingler"}
                          >
                            <Pin size={14} />
                          </button>
                          <button
                            onClick={() => startEditing(decree)}
                            className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={14} />
                          </button>
                          <SecureDeleteButton
                            onClick={() => {
                              const newDecrees = (
                                selectedCountry.decrees || []
                              ).filter((d) => d.id !== decree.id);
                              updateCountry({ decrees: newDecrees });
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {(selectedCountry.decrees || []).length === 0 && (
                    <p className="text-stone-400 italic text-sm">
                      Aucun décret.
                    </p>
                  )}
                  {(selectedCountry.decrees || []).length > 0 && filteredDecrees.length === 0 && (
                    <p className="text-stone-400 italic text-sm">
                      Aucun résultat pour « {listSearch} ».
                    </p>
                  )}
                </div>
              )}

              {/* LISTE DES LIVRES */}
              {activeTab === "books" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBooks.map((book, idx) => (
                    <div
                      key={book.id || idx}
                      className={`bg-white p-6 rounded-lg border shadow-sm flex flex-col justify-between group transition-colors ${
                        editingId === book.id
                          ? "border-yellow-500 bg-yellow-50"
                          : "border-stone-200"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-serif font-bold text-xl text-stone-900 line-clamp-2 flex-1">
                            {book.title}
                            {book.access && book.access !== "public" && (
                              <span className="text-[8px] font-black uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full ml-1">
                                {book.access === "country" ? "🏰 Pays" : book.access === "roles" ? "🎭 Rôles" : "🔒 Restreint"}
                              </span>
                            )}
                          </h4>
                          {isNewEntry(book.date) && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full shrink-0 mt-1">
                              Nouveau
                            </span>
                          )}
                        </div>
                        {book.category && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full mb-2">
                            <Tag size={8} /> {book.category}
                          </span>
                        )}
                        {book.author && (
                          <p className="text-xs text-stone-500 font-medium mb-2">
                            par {book.author}
                          </p>
                        )}
                        <p className="text-xs text-stone-500 line-clamp-3 font-serif italic">
                          {(book.content || "").substring(0, 150)}…
                        </p>
                      </div>
                      <div className="flex justify-between items-end mt-4 pt-4 border-t border-stone-100">
                        <span className="text-[10px] uppercase font-bold text-stone-400">
                          {new Date(book.date || Date.now()).toLocaleDateString("fr-FR")}
                        </span>
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => startEditing(book)}
                            className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={14} />
                          </button>
                          <SecureDeleteButton
                            onClick={() => {
                              const newBooks = (
                                selectedCountry.books || []
                              ).filter((b) => b.id !== book.id);
                              updateCountry({ books: newBooks });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {(selectedCountry.books || []).length === 0 && (
                    <p className="text-stone-400 italic text-sm col-span-2">
                      Aucun ouvrage dans la bibliothèque.
                    </p>
                  )}
                  {(selectedCountry.books || []).length > 0 && filteredBooks.length === 0 && (
                    <p className="text-stone-400 italic text-sm col-span-2">
                      Aucun résultat pour « {listSearch} ».
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LibraryAdminView;
