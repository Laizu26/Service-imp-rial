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
} from "lucide-react";
import SecureDeleteButton from "../ui/SecureDeleteButton";

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
  const [importContent, setImportContent] = useState("");
  const [gDocUrl, setGDocUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Édition
  const [editingId, setEditingId] = useState(null);

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
    setImportContent("");
    setGDocUrl("");
    setEditingId(null);
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
      setImportContent(entry.content || "");
    }
  };

  // --- SUPPRESSION TOTALE (FIX : ne touche PAS à laws) ---
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

    // Si mode GDoc, récupérer le contenu
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
        // Édition
        const updated = currentDecrees.map((d) =>
          d.id === editingId
            ? { ...d, name: importTitle, content: content }
            : d
        );
        updateCountry({ decrees: updated });
      } else {
        // Création
        const newDecree = {
          id: Date.now(),
          name: importTitle,
          content: content,
          date: new Date().toISOString(),
        };
        updateCountry({ decrees: [newDecree, ...currentDecrees] });
      }
    } else {
      const currentBooks = selectedCountry.books || [];

      if (editingId) {
        // Édition
        const updated = currentBooks.map((b) =>
          b.id === editingId
            ? {
                ...b,
                title: importTitle,
                author: importAuthor,
                content: content,
              }
            : b
        );
        updateCountry({ books: updated });
      } else {
        // Création
        const newBook = {
          id: Date.now(),
          title: importTitle,
          author: importAuthor,
          content: content,
          date: new Date().toISOString(),
        };
        updateCountry({ books: [newBook, ...currentBooks] });
      }
    }

    resetForm();
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
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab("decrees");
              resetForm();
            }}
            className={`px-6 py-3 rounded-t-lg font-bold uppercase text-xs tracking-widest flex items-center gap-2 transition-colors ${
              activeTab === "decrees"
                ? "bg-stone-100 text-stone-900"
                : "bg-stone-800 text-stone-500 hover:text-white"
            }`}
          >
            <Scroll size={16} /> Gestion des Décrets
          </button>
          <button
            onClick={() => {
              setActiveTab("books");
              resetForm();
            }}
            className={`px-6 py-3 rounded-t-lg font-bold uppercase text-xs tracking-widest flex items-center gap-2 transition-colors ${
              activeTab === "books"
                ? "bg-stone-100 text-stone-900"
                : "bg-stone-800 text-stone-500 hover:text-white"
            }`}
          >
            <Book size={16} /> Édition de Livres
          </button>
        </div>
      </div>

      {/* CONTENU */}
      <div className="flex-1 overflow-y-auto p-8">
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

            {/* AUTEUR (livres uniquement) */}
            {activeTab === "books" && (
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
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-sm font-black uppercase text-stone-400 tracking-widest">
              Archives Actuelles ({selectedCountry.name})
            </h3>

            {activeTab === "decrees" &&
              (selectedCountry.decrees || []).length > 0 && (
                <button
                  onClick={handleClearAllDecrees}
                  className="text-[10px] font-bold uppercase text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded flex items-center gap-1 transition-colors"
                >
                  <AlertTriangle size={12} /> Tout effacer
                </button>
              )}
          </div>

          {/* LISTE DES DÉCRETS */}
          {activeTab === "decrees" && (
            <div className="space-y-2">
              {(selectedCountry.decrees || []).map((decree, idx) => (
                <div
                  key={decree.id || idx}
                  className={`bg-white p-4 rounded-lg border flex justify-between items-center group transition-colors ${
                    editingId === decree.id
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-stone-200"
                  }`}
                >
                  <div className="flex flex-col flex-1 min-w-0 mr-4">
                    <span className="font-bold text-stone-800">
                      {decree.name}
                    </span>
                    {decree.content && (
                      <span className="text-[10px] text-stone-400 italic truncate">
                        {decree.content.substring(0, 80)}...
                      </span>
                    )}
                    {decree.date && (
                      <span className="text-[9px] text-stone-300 font-mono mt-1">
                        {new Date(decree.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center shrink-0">
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
              ))}
              {(selectedCountry.decrees || []).length === 0 && (
                <p className="text-stone-400 italic text-sm">
                  Aucun décret.
                </p>
              )}
            </div>
          )}

          {/* LISTE DES LIVRES */}
          {activeTab === "books" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(selectedCountry.books || []).map((book, idx) => (
                <div
                  key={book.id || idx}
                  className={`bg-white p-6 rounded-lg border shadow-sm flex flex-col justify-between group h-52 transition-colors ${
                    editingId === book.id
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-stone-200"
                  }`}
                >
                  <div>
                    <h4 className="font-serif font-bold text-xl text-stone-900 mb-1 line-clamp-2">
                      {book.title}
                    </h4>
                    {book.author && (
                      <p className="text-xs text-stone-500 font-medium mb-2">
                        par {book.author}
                      </p>
                    )}
                    <p className="text-xs text-stone-500 line-clamp-3 font-serif italic">
                      {(book.content || "").substring(0, 150)}...
                    </p>
                  </div>
                  <div className="flex justify-between items-end mt-4 pt-4 border-t border-stone-100">
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      {new Date(book.date || Date.now()).toLocaleDateString()}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryAdminView;
