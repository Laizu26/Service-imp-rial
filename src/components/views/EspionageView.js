import React, { useState, useMemo } from "react";
import {
  Eye,
  Search,
  AlertTriangle,
  FileText,
  ShieldAlert,
  MapPin,
  User,
  Lock,
  Flag,
  CheckCircle,
  XCircle,
} from "lucide-react";

// Liste des mots-clés surveillés par l'Empire
const RISKY_KEYWORDS = [
  "révolte",
  "arme",
  "tuer",
  "mort",
  "complot",
  "renverser",
  "argent",
  "fuite",
  "secret",
  "attaquer",
  "empereur",
  "voler",
];

const EspionageView = ({ citizens, session, roleInfo, onUpdateCitizen }) => {
  const [selectedMail, setSelectedMail] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("ALL"); // ALL, HIGH, MEDIUM

  // 1. APLATIR ET ANALYSER TOUS LES MESSAGES
  const allIntercepts = useMemo(() => {
    let intercepts = [];
    (citizens || []).forEach((citizen) => {
      if (citizen.messages && Array.isArray(citizen.messages)) {
        citizen.messages.forEach((msg) => {
          // Analyse de risque automatique
          let autoRiskScore = 0;
          const contentLower = (msg.content || "").toLowerCase();
          const subjectLower = (msg.subject || "").toLowerCase();
          const detectedKeywords = [];

          RISKY_KEYWORDS.forEach((word) => {
            if (contentLower.includes(word) || subjectLower.includes(word)) {
              autoRiskScore += 1;
              detectedKeywords.push(word);
            }
          });

          // Détermination du statut (Manuel > Auto)
          let status = "SAFE";
          if (msg.manualStatus) {
            status = msg.manualStatus;
          } else {
            status =
              autoRiskScore > 1
                ? "CRITICAL"
                : autoRiskScore > 0
                ? "WARNING"
                : "SAFE";
          }

          // Calcul du score final pour le tri
          let finalScore = autoRiskScore;
          if (status === "CRITICAL") finalScore = Math.max(finalScore, 2);
          if (status === "WARNING") finalScore = Math.max(finalScore, 1);
          if (status === "SAFE") finalScore = 0;

          intercepts.push({
            ...msg,
            targetId: citizen.id,
            targetName: citizen.name,
            riskScore: finalScore,
            detectedKeywords,
            status: status,
          });
        });
      }
    });
    // Tri par date
    return intercepts.sort((a, b) => b.id - a.id);
  }, [citizens]);

  // 2. FILTRAGE
  const filteredIntercepts = allIntercepts.filter((mail) => {
    const matchesSearch =
      mail.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mail.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mail.content.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterRisk === "HIGH") return mail.status === "CRITICAL";
    if (filterRisk === "MEDIUM") return mail.status === "WARNING";
    return true;
  });

  // --- ACTIONS ---
  const handleSetStatus = (newStatus) => {
    if (!selectedMail || !onUpdateCitizen) return;

    // 1. Trouver le citoyen propriétaire du message
    const targetCitizen = citizens.find((c) => c.id === selectedMail.targetId);
    if (!targetCitizen) return;

    // 2. Mettre à jour le message spécifique
    const newMessages = (targetCitizen.messages || []).map((msg) =>
      msg.id === selectedMail.id ? { ...msg, manualStatus: newStatus } : msg
    );

    // 3. Sauvegarder
    onUpdateCitizen({ ...targetCitizen, messages: newMessages });

    // 4. Mettre à jour l'affichage local
    setSelectedMail((prev) => ({
      ...prev,
      status: newStatus,
      manualStatus: newStatus,
    }));
  };

  // Stats pour le Header
  const totalThreats = allIntercepts.filter(
    (m) => m.status === "WARNING"
  ).length;
  const criticalThreats = allIntercepts.filter(
    (m) => m.status === "CRITICAL"
  ).length;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col font-sans animate-in fade-in bg-stone-100 rounded-xl overflow-hidden border border-stone-300 shadow-2xl">
      {/* HEADER TACTIQUE */}
      <div className="bg-stone-900 text-stone-300 p-4 flex justify-between items-center border-b border-stone-700 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-stone-800 rounded-lg border border-stone-600">
            <EyeOff size={24} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white">
              Cabinet Noir
            </h2>
            <div className="flex gap-4 text-[10px] uppercase font-bold tracking-widest text-stone-500">
              <span className="flex items-center gap-1">
                <FileText size={10} /> {allIntercepts.length}
              </span>
              <span className="flex items-center gap-1 text-orange-400">
                <AlertTriangle size={10} /> {totalThreats} Suspects
              </span>
              <span className="flex items-center gap-1 text-red-500 animate-pulse">
                <ShieldAlert size={10} /> {criticalThreats} Critiques
              </span>
            </div>
          </div>
        </div>

        {/* BARRE DE RECHERCHE */}
        <div className="flex items-center gap-2 bg-stone-800 p-1 rounded-lg border border-stone-700 w-1/3">
          <Search size={16} className="text-stone-500 ml-2" />
          <input
            className="bg-transparent border-none outline-none text-sm text-stone-200 w-full placeholder-stone-600 font-medium"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")}>
              <XCircle
                size={14}
                className="text-stone-500 hover:text-stone-300"
              />
            </button>
          )}
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="flex flex-1 overflow-hidden">
        {/* COLONNE GAUCHE : LISTE */}
        <div className="w-1/3 bg-stone-200 border-r border-stone-300 flex flex-col">
          {/* Filtres Rapides */}
          <div className="p-2 flex gap-2 border-b border-stone-300 bg-stone-100">
            <button
              onClick={() => setFilterRisk("ALL")}
              className={`flex-1 py-1 text-[10px] font-black uppercase tracking-wider rounded ${
                filterRisk === "ALL"
                  ? "bg-stone-800 text-white"
                  : "bg-stone-200 text-stone-500 hover:bg-stone-300"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterRisk("MEDIUM")}
              className={`flex-1 py-1 text-[10px] font-black uppercase tracking-wider rounded ${
                filterRisk === "MEDIUM"
                  ? "bg-orange-600 text-white"
                  : "bg-stone-200 text-orange-700 hover:bg-orange-100"
              }`}
            >
              Suspects
            </button>
            <button
              onClick={() => setFilterRisk("HIGH")}
              className={`flex-1 py-1 text-[10px] font-black uppercase tracking-wider rounded ${
                filterRisk === "HIGH"
                  ? "bg-red-700 text-white"
                  : "bg-stone-200 text-red-700 hover:bg-red-100"
              }`}
            >
              Critiques
            </button>
          </div>

          {/* Liste Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {filteredIntercepts.map((mail) => (
              <div
                key={mail.id}
                onClick={() => setSelectedMail(mail)}
                className={`p-4 border-b border-stone-300 cursor-pointer transition-all hover:bg-white group relative ${
                  selectedMail?.id === mail.id
                    ? "bg-white border-l-4 border-l-stone-800"
                    : "bg-stone-50/50"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                      mail.status === "CRITICAL"
                        ? "bg-red-100 text-red-700"
                        : mail.status === "WARNING"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {mail.status === "SAFE"
                      ? "SÛR"
                      : mail.status === "CRITICAL"
                      ? "CRITIQUE"
                      : "SUSPECT"}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {mail.date}
                  </span>
                </div>
                <div className="font-bold text-stone-800 text-sm truncate pr-4">
                  {mail.subject}
                </div>
                <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                  <User size={12} />
                  <span className="truncate max-w-[100px]">{mail.from}</span>
                  <span className="text-stone-300">➔</span>
                  <span className="font-bold text-stone-700 truncate">
                    {mail.targetName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLONNE DROITE : LECTURE & ACTION */}
        <div className="flex-1 bg-[#e6e2d6] relative flex flex-col">
          {selectedMail ? (
            <div className="h-full flex flex-col">
              {/* Toolbar Actions */}
              <div className="h-14 bg-[#dcd8c8] border-b border-[#c8c4b4] flex items-center px-4 justify-between shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4 text-stone-600 text-xs font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <MapPin size={14} /> {selectedMail.targetName}
                  </span>
                  <span className="w-px h-4 bg-stone-400"></span>
                  <span className="flex items-center gap-2">
                    <Lock size={14} /> Sceau: {selectedMail.seal || "Brisé"}
                  </span>
                </div>

                {/* BOUTONS D'ACTION FONCTIONNELS */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSetStatus("SAFE")}
                    className={`px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-2 transition-colors ${
                      selectedMail.status === "SAFE"
                        ? "bg-green-600 text-white"
                        : "bg-stone-300 text-stone-600 hover:bg-green-200"
                    }`}
                    title="Marquer comme sans danger"
                  >
                    <CheckCircle size={14} /> Sûr
                  </button>
                  <button
                    onClick={() => handleSetStatus("WARNING")}
                    className={`px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-2 transition-colors ${
                      selectedMail.status === "WARNING"
                        ? "bg-orange-600 text-white"
                        : "bg-stone-300 text-stone-600 hover:bg-orange-200"
                    }`}
                    title="Marquer comme suspect"
                  >
                    <Flag size={14} /> Suspect
                  </button>
                  <button
                    onClick={() => handleSetStatus("CRITICAL")}
                    className={`px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-2 transition-colors ${
                      selectedMail.status === "CRITICAL"
                        ? "bg-red-700 text-white"
                        : "bg-stone-300 text-stone-600 hover:bg-red-200"
                    }`}
                    title="Marquer comme critique"
                  >
                    <ShieldAlert size={14} /> Critique
                  </button>
                </div>
              </div>

              {/* Contenu Lettre */}
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-2xl mx-auto bg-[#fdf6e3] shadow-2xl p-8 md:p-12 min-h-[500px] relative transform rotate-[0.5deg]">
                  {/* Tampon Statut */}
                  {selectedMail.status !== "SAFE" && (
                    <div
                      className={`absolute top-6 right-8 w-24 h-24 border-4 rounded-full flex items-center justify-center transform -rotate-12 pointer-events-none opacity-80 ${
                        selectedMail.status === "CRITICAL"
                          ? "border-red-800 text-red-800"
                          : "border-orange-600 text-orange-600"
                      }`}
                    >
                      <span className="font-black uppercase text-xs text-center leading-tight">
                        Service
                        <br />
                        Impérial
                        <br />
                        {selectedMail.status === "CRITICAL"
                          ? "CRITIQUE"
                          : "SUSPECT"}
                      </span>
                    </div>
                  )}

                  <div className="border-b border-stone-800/10 pb-6 mb-6 font-serif">
                    <div className="flex justify-between text-stone-800 mb-2">
                      <span className="italic">
                        De :{" "}
                        <span className="font-bold not-italic">
                          {selectedMail.from}
                        </span>
                      </span>
                      <span className="font-mono text-sm text-stone-500">
                        {selectedMail.date}
                      </span>
                    </div>
                    <div className="text-stone-800">
                      <span className="italic">
                        Pour :{" "}
                        <span className="font-bold not-italic">
                          {selectedMail.targetName}
                        </span>
                      </span>
                    </div>
                    <div className="mt-6 text-xl font-bold text-stone-900 uppercase tracking-wide">
                      OBJ: {selectedMail.subject}
                    </div>
                  </div>

                  <div className="font-serif text-stone-800 leading-relaxed text-lg whitespace-pre-wrap">
                    {selectedMail.content.split(" ").map((word, i) => {
                      const cleanWord = word
                        .toLowerCase()
                        .replace(/[^a-z0-9éèà]/g, "");
                      if (RISKY_KEYWORDS.includes(cleanWord)) {
                        return (
                          <span
                            key={i}
                            className="bg-red-200 text-red-900 border-b-2 border-red-500 px-0.5 mx-0.5 rounded-sm font-bold cursor-help"
                            title="Terme Suspect"
                          >
                            {word}{" "}
                          </span>
                        );
                      }
                      return word + " ";
                    })}
                  </div>

                  <div className="mt-12 pt-6 border-t border-stone-800/10 text-center">
                    <span className="font-script text-3xl text-stone-600 opacity-70 transform -rotate-2 inline-block">
                      {selectedMail.from.split(" ")[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-60">
              <Search size={64} className="mb-4 text-stone-300" />
              <div className="text-2xl font-serif font-bold text-stone-500">
                Aucun dossier sélectionné
              </div>
              <p className="text-sm mt-2 uppercase tracking-widest">
                Sélectionnez une missive pour analyse.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Icone personnalisée
const EyeOff = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

export default EspionageView;
