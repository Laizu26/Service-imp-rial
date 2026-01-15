import React, { useState } from "react";
import {
  Book,
  Scroll,
  DownloadCloud,
  Trash2,
  Link,
  Library,
  AlertTriangle,
} from "lucide-react";
import SecureDeleteButton from "../ui/SecureDeleteButton";

const LibraryAdminView = ({ countries, onUpdate }) => {
  const [selectedCountryId, setSelectedCountryId] = useState(countries[0]?.id);
  const [activeTab, setActiveTab] = useState("decrees"); // decrees, books

  // États pour les formulaires
  const [gDocUrl, setGDocUrl] = useState("");
  const [importTitle, setImportTitle] = useState(""); // Renommé pour être générique
  const [isLoading, setIsLoading] = useState(false);

  const selectedCountry =
    countries.find((c) => c.id === selectedCountryId) || countries[0];

  const updateCountry = (updates) => {
    onUpdate(
      countries.map((c) =>
        c.id === selectedCountryId ? { ...c, ...updates } : c
      )
    );
  };

  // --- FONCTION DE SUPPRESSION TOTALE ---
  const handleClearAllDecrees = () => {
    const confirm1 = window.confirm(
      `ATTENTION : Vous allez supprimer TOUS les décrets de ${selectedCountry.name}.`
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      "Êtes-vous vraiment sûr ? Cette action est irréversible."
    );
    if (confirm2) {
      updateCountry({ decrees: [], laws: [] }); // On vide les deux pour être sûr (nouveau et ancien format)
    }
  };

  // --- FONCTION D'IMPORT GDOC ---
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

  const handleImport = async () => {
    if (!gDocUrl || !importTitle) return; // Titre obligatoire maintenant
    setIsLoading(true);

    try {
      const text = await fetchGDocContent(gDocUrl);

      if (activeTab === "decrees") {
        // NOUVELLE LOGIQUE : 1 GDoc = 1 Décret complet
        const newDecree = {
          id: Date.now(),
          name: importTitle, // Le titre sert de "Nom" au décret
          content: text, // Le contenu entier du GDoc
          date: new Date().toISOString(),
        };

        // Fusion avec existant (Gestion compatibilité ancien format array vs objet)
        const currentDecrees = Array.isArray(selectedCountry.laws)
          ? []
          : selectedCountry.decrees || [];

        updateCountry({ decrees: [newDecree, ...currentDecrees] }); // Ajout au début
        alert("Proclamation officielle enregistrée !");
      } else if (activeTab === "books") {
        // Logique Livres
        const newBook = {
          id: Date.now(),
          title: importTitle,
          content: text,
          date: new Date().toISOString(),
        };

        const currentBooks = selectedCountry.books || [];
        updateCountry({ books: [newBook, ...currentBooks] });
        alert("Livre ajouté à la bibliothèque !");
      }

      setGDocUrl("");
      setImportTitle("");
    } catch (err) {
      alert("Erreur : " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-stone-100 rounded-xl overflow-hidden border border-stone-300">
      {/* HEADER ADMIN */}
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
            onChange={(e) => setSelectedCountryId(e.target.value)}
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
            onClick={() => setActiveTab("decrees")}
            className={`px-6 py-3 rounded-t-lg font-bold uppercase text-xs tracking-widest flex items-center gap-2 transition-colors ${
              activeTab === "decrees"
                ? "bg-stone-100 text-stone-900"
                : "bg-stone-800 text-stone-500 hover:text-white"
            }`}
          >
            <Scroll size={16} /> Gestion des Décrets
          </button>
          <button
            onClick={() => setActiveTab("books")}
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
        {/* ZONE D'IMPORTATION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 mb-8">
          <h3 className="text-sm font-black uppercase text-stone-400 tracking-widest mb-4 flex items-center gap-2">
            <DownloadCloud size={16} /> Importer depuis Google Docs
          </h3>

          <div className="flex flex-col gap-4">
            {/* CHAMP TITRE */}
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

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Link
                  size={16}
                  className="absolute left-3 top-3.5 text-stone-400"
                />
                <input
                  className="w-full p-3 pl-10 border border-stone-300 rounded-lg text-sm outline-none focus:border-stone-800 font-mono text-stone-600"
                  placeholder="Collez le lien public (https://docs.google.com/document/d/...)"
                  value={gDocUrl}
                  onChange={(e) => setGDocUrl(e.target.value)}
                />
              </div>
              <button
                onClick={handleImport}
                disabled={isLoading || !gDocUrl || !importTitle}
                className="bg-stone-900 text-white px-6 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {isLoading ? "Chargement..." : "Importer le contenu"}
              </button>
            </div>
            <p className="text-[10px] text-stone-400 italic">
              * Le document doit être en mode "Public". Tout le contenu sera
              importé tel quel.
            </p>
          </div>
        </div>

        {/* LISTE DU CONTENU EXISTANT */}
        <div className="grid gap-4">
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-sm font-black uppercase text-stone-400 tracking-widest">
              Archives Actuelles ({selectedCountry.name})
            </h3>

            {/* BOUTON CLEAR ALL (Uniquement pour les décrets ici, mais adaptable) */}
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

          {activeTab === "decrees" && (
            <div className="space-y-2">
              {(selectedCountry.decrees || []).map((decree, idx) => (
                <div
                  key={decree.id || idx}
                  className="bg-white p-4 rounded-lg border border-stone-200 flex justify-between items-center group"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-stone-800">
                      {decree.name}
                    </span>
                    {/* Petit aperçu du contenu si disponible */}
                    {decree.content && (
                      <span className="text-[10px] text-stone-400 italic truncate max-w-md">
                        {decree.content.substring(0, 50)}...
                      </span>
                    )}
                  </div>
                  <SecureDeleteButton
                    onClick={() => {
                      const newDecrees = (selectedCountry.decrees || []).filter(
                        (d) => d.id !== decree.id
                      );
                      updateCountry({ decrees: newDecrees });
                    }}
                  />
                </div>
              ))}
              {(selectedCountry.decrees || []).length === 0 && (
                <p className="text-stone-400 italic text-sm">Aucun décret.</p>
              )}
            </div>
          )}

          {activeTab === "books" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(selectedCountry.books || []).map((book, idx) => (
                <div
                  key={book.id || idx}
                  className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm flex flex-col justify-between group h-48"
                >
                  <div>
                    <h4 className="font-serif font-bold text-xl text-stone-900 mb-2 line-clamp-2">
                      {book.title}
                    </h4>
                    <p className="text-xs text-stone-500 line-clamp-3 font-serif italic">
                      {book.content.substring(0, 150)}...
                    </p>
                  </div>
                  <div className="flex justify-between items-end mt-4 pt-4 border-t border-stone-100">
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      Ajouté le{" "}
                      {new Date(book.date || Date.now()).toLocaleDateString()}
                    </span>
                    <SecureDeleteButton
                      onClick={() => {
                        const newBooks = (selectedCountry.books || []).filter(
                          (b) => b.id !== book.id
                        );
                        updateCountry({ books: newBooks });
                      }}
                    />
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
