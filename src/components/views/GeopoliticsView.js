import React, { useState } from "react";
import {
  Map,
  Plus,
  Flag,
  Edit3,
  X,
  Crown,
  Briefcase,
  Users,
  Coins,
  Activity,
  Gavel,
  Lock,
  ShieldAlert,
  Award,
  Globe,
  Scroll,
  Link,
  DownloadCloud,
} from "lucide-react";
import Card from "../ui/Card";
import SecureDeleteButton from "../ui/SecureDeleteButton";
import { ROLES } from "../../lib/constants";

const GeopoliticsView = ({
  countries,
  citizens,
  onUpdate,
  session,
  roleInfo,
}) => {
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [isCreating, setIsCreating] = useState(false);
  const [newCountryName, setNewCountryName] = useState("");
  const [renameBuf, setRenameBuf] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [newRegionName, setNewRegionName] = useState("");

  // Custom Roles States
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleType, setNewRoleType] = useState("ROLE"); // ROLE or STATUS
  const [newRoleLevel, setNewRoleLevel] = useState(10); // Pour les permissions
  const [isRestrictedStatus, setIsRestrictedStatus] = useState(false); // Pour les statuts (prisonnier etc)

  // États pour l'import GDoc
  const [gDocUrl, setGDocUrl] = useState("");
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);

  // SÉCURITÉS
  const safeCountries = Array.isArray(countries) ? countries : [];
  const safeCitizens = Array.isArray(citizens) ? citizens : [];
  const safeRoleInfo = roleInfo || {
    level: 0,
    scope: "LOCAL",
    role: "CITOYEN",
  };
  const isGlobal = safeRoleInfo.scope === "GLOBAL";

  const selectedCountry = safeCountries.find((c) => c.id === selectedId);

  // Permissions
  const canEdit =
    isGlobal || (session?.countryId === selectedId && safeRoleInfo.level >= 40);

  const canManageCountries =
    safeRoleInfo.level >= 90 || safeRoleInfo.scope === "GLOBAL";

  const updateSelected = (updates) =>
    onUpdate(
      safeCountries.map((c) => (c.id === selectedId ? { ...c, ...updates } : c))
    );

  // Migration helper
  const migrateSelectedCountry = () => {
    if (!selectedCountry || !Array.isArray(selectedCountry.laws)) return;
    if (!canEdit) return;
    if (
      !window.confirm(
        "Confirmer la migration ? Cette opération est irréversible."
      )
    )
      return;

    const defaultStructured = {
      allowExternalDebits: false,
      allowLocalConfiscation: true,
      allowLocalSales: true,
      allowPermissionEditsByLocalAdmins: true,
      requireRulerApprovalForSales: false,
    };

    const decrees = (selectedCountry.laws || []).map((d) => ({ ...d }));
    updateSelected({ laws: defaultStructured, decrees });
  };

  // --- IMPORT GDOC ---
  const handleImportGDoc = async () => {
    if (!gDocUrl) return;
    setIsLoadingDoc(true);

    try {
      const match = gDocUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match || !match[1]) {
        throw new Error("Lien invalide. Vérifiez le format Google Doc.");
      }
      const docId = match[1];
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        exportUrl
      )}`;

      const response = await fetch(proxyUrl);
      if (!response.ok)
        throw new Error("Impossible de lire le document. Est-il public ?");

      const text = await response.text();
      // On importe tout le texte comme un seul décret
      const newDecree = {
        id: Date.now(),
        name: "Décret Importé (Sans titre)",
        content: text, // Contenu riche
        date: new Date().toISOString(),
      };

      if (Array.isArray(selectedCountry.laws)) {
        updateSelected({
          laws: [...(selectedCountry.laws || []), newDecree],
        });
      } else {
        updateSelected({
          decrees: [...(selectedCountry.decrees || []), newDecree],
        });
      }

      setGDocUrl("");
      alert(`Décret importé avec succès !`);
    } catch (err) {
      alert("Erreur Import : " + err.message);
    } finally {
      setIsLoadingDoc(false);
    }
  };

  const ruler = selectedCountry
    ? safeCitizens.find(
        (c) =>
          c.countryId === selectedCountry.id &&
          (c.role === "ROI" || c.role === "EMPEREUR")
      )
    : null;
  const rulerName = ruler ? ruler.name : "Trône Vacant";

  const displayedCountries = safeCountries.filter(
    (c) => isGlobal || c.id === session?.countryId
  );

  // --- HANDLERS CREATION ---
  const handleStartCreation = () => {
    setSelectedId(null);
    setIsCreating(true);
    setNewCountryName("");
  };

  const handleCancelCreation = () => {
    setIsCreating(false);
    setNewCountryName("");
  };

  const handleAddCountry = () => {
    if (!newCountryName.trim()) return;
    const newCountry = {
      id: `C-${Date.now()}`,
      name: newCountryName.trim(),
      treasury: 1000,
      population: 0,
      stability: 50,
      security: 50,
      prosperity: 50,
      laws: [],
      regions: [{ id: 1, name: "Capitale", type: "Ville" }],
      customRoles: [],
      color: "bg-stone-50",
      rulerName: "Gouverneur",
      description: "Nouvelle contrée.",
      specialty: "Aucune",
    };
    onUpdate([...safeCountries, newCountry]);
    handleCancelCreation();
  };

  const handleDeleteCountry = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir dissoudre ce territoire ?")) {
      onUpdate(safeCountries.filter((c) => c.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  const addCustomRole = () => {
    if (!newRoleName) return;
    const maxLevel = safeRoleInfo.level - 1;
    const safeLevel = Math.min(
      Math.max(0, parseInt(newRoleLevel) || 0),
      maxLevel
    );

    const newRole = {
      id: `cr-${Date.now()}`,
      name: newRoleName,
      type: newRoleType,
      level: newRoleType === "ROLE" ? safeLevel : 0,
      isRestricted: newRoleType === "STATUS" ? isRestrictedStatus : false,
    };
    updateSelected({
      customRoles: [...(selectedCountry.customRoles || []), newRole],
    });
    setNewRoleName("");
    setNewRoleLevel(10);
    setIsRestrictedStatus(false);
  };

  const removeCustomRole = (roleId) => {
    updateSelected({
      customRoles: (selectedCountry.customRoles || []).filter(
        (r) => r.id !== roleId
      ),
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 font-sans">
      {/* --- COLONNE GAUCHE : LISTE --- */}
      <div className="w-full md:w-1/3 bg-[#fdf6e3] rounded-xl border border-stone-300 flex flex-col overflow-hidden shadow-md">
        <div className="p-4 bg-stone-100 border-b border-stone-200 flex justify-between items-center">
          <div className="font-bold uppercase text-[11px] tracking-[0.2em] text-stone-500 flex items-center gap-2">
            <Globe size={14} /> Atlas Impérial
          </div>
          {canManageCountries && (
            <button
              onClick={handleStartCreation}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-sm ${
                isCreating
                  ? "bg-stone-800 text-white"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-3 space-y-3">
          {displayedCountries.length === 0 && (
            <div className="text-center p-10 text-stone-400 italic text-xs">
              L'Empire est vide.
            </div>
          )}

          {displayedCountries.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setSelectedId(c.id);
                setIsCreating(false);
              }}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all relative group ${
                selectedId === c.id
                  ? "bg-white border-stone-800 shadow-md transform translate-x-1"
                  : "bg-white/50 border-stone-200 hover:border-stone-400 hover:bg-white"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      selectedId === c.id
                        ? "bg-stone-900 text-yellow-500"
                        : "bg-stone-100 text-stone-400"
                    }`}
                  >
                    <Flag size={16} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase text-stone-800 font-serif tracking-wide">
                      {c.name}
                    </h4>
                    <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                      {
                        (safeCitizens || []).filter((u) => u.countryId === c.id)
                          .length
                      }{" "}
                      Citoyens
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-stone-900 text-xs">
                    {c.treasury.toLocaleString()}{" "}
                    <span className="text-[9px] text-stone-400">Écus</span>
                  </div>
                </div>
              </div>
              {selectedId === c.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-stone-900 rounded-l-xl"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* --- COLONNE DROITE : CONTENU --- */}
      <div className="flex-1 bg-[#e6e2d6] rounded-xl border border-stone-300 p-0 overflow-hidden shadow-inner relative flex flex-col">
        {isCreating ? (
          <div className="w-full h-full flex flex-col justify-center items-center p-8 animate-fadeIn">
            <div className="w-full max-w-lg p-8 bg-[#fdf6e3] rounded-xl border-4 border-stone-800 shadow-2xl">
              <div className="text-center mb-8 border-b-2 border-stone-200 pb-6">
                <div className="inline-flex p-4 bg-stone-900 text-yellow-500 rounded-full mb-4 shadow-lg">
                  <Crown size={32} />
                </div>
                <h2 className="text-3xl font-black font-serif uppercase tracking-tight text-stone-900">
                  Décret d'Annexion
                </h2>
              </div>
              <div className="space-y-6">
                <input
                  autoFocus
                  className="w-full p-4 bg-white border-2 border-stone-300 rounded-xl font-serif font-bold text-xl outline-none focus:border-stone-900"
                  placeholder="Nom du pays..."
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelCreation}
                    className="flex-1 py-4 rounded-xl font-bold uppercase text-[10px] text-stone-500 hover:bg-stone-200"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddCountry}
                    disabled={!newCountryName.trim()}
                    className="flex-[2] bg-stone-900 text-yellow-500 py-4 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-stone-800 disabled:opacity-50"
                  >
                    Créer
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : selectedCountry ? (
          <div
            className={`flex flex-col h-full ${
              selectedCountry.color || "bg-[#fdf6e3]"
            }`}
          >
            {/* Header */}
            <div className="p-4 md:p-8 border-b border-black/5 bg-white/70 backdrop-blur-md sticky top-0 z-10 shadow-sm flex justify-between items-center font-serif">
              <div className="flex-1">
                {isRenaming && canEdit ? (
                  <div className="flex gap-4">
                    <input
                      className="text-3xl font-bold p-2 w-full bg-white/80 rounded-xl border-2 border-stone-800 outline-none"
                      value={renameBuf}
                      onChange={(e) => setRenameBuf(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        updateSelected({ name: renameBuf });
                        setIsRenaming(false);
                      }}
                      className="bg-green-600 text-white px-8 rounded-xl text-xs font-bold uppercase"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <h2
                    className="text-2xl md:text-4xl font-black text-stone-800 cursor-pointer flex items-center gap-4"
                    onClick={() => {
                      if (canEdit) {
                        setRenameBuf(selectedCountry.name);
                        setIsRenaming(true);
                      }
                    }}
                  >
                    {selectedCountry.name}
                    {canEdit && (
                      <Edit3
                        size={20}
                        className="opacity-10 hover:opacity-100"
                      />
                    )}
                  </h2>
                )}
              </div>
              {canManageCountries && (
                <SecureDeleteButton
                  onClick={() => handleDeleteCountry(selectedCountry.id)}
                />
              )}
            </div>

            {/* Tabs */}
            <div className="flex bg-white/40 border-b border-black/5 p-2 gap-2 font-sans font-bold uppercase text-[11px] overflow-x-auto shrink-0">
              {["info", "laws", "regions", "ranks"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 min-w-[100px] py-3 rounded-lg tracking-[0.2em] transition-all ${
                    activeTab === tab
                      ? "bg-stone-800 text-white shadow-md"
                      : "hover:bg-white/60 text-stone-600"
                  }`}
                >
                  {tab === "info"
                    ? "Gouvernance"
                    : tab === "laws"
                    ? "Législation"
                    : tab === "regions"
                    ? "Territoires"
                    : "Hiérarchie"}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 md:p-10 space-y-8 pb-24 font-sans overflow-y-auto flex-1">
              {/* --- ONGLET INFO --- */}
              {activeTab === "info" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Souverain" icon={Crown}>
                    <div className="text-2xl font-black font-serif">
                      {rulerName}
                    </div>
                  </Card>
                  <Card title="Trésorerie" icon={Coins}>
                    <div className="text-3xl font-black text-yellow-800 font-mono">
                      {selectedCountry.treasury}{" "}
                      <span className="text-sm">Écus</span>
                    </div>
                  </Card>
                  <Card title="Population" icon={Users}>
                    <div className="text-2xl font-mono font-bold">
                      {(selectedCountry.population || 0).toLocaleString()}
                    </div>
                  </Card>
                  <Card title="État" icon={Activity}>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { k: "stability", l: "Stabilité" },
                        { k: "security", l: "Sécurité" },
                        { k: "prosperity", l: "Prospérité" },
                      ].map((s) => (
                        <div key={s.k}>
                          <div className="text-[10px] uppercase font-bold text-stone-500">
                            {s.l}
                          </div>
                          <div className="text-xl font-black">
                            {selectedCountry[s.k] || 50}%
                          </div>
                          {canEdit && (
                            <div className="flex justify-center gap-1 mt-1">
                              <button
                                onClick={() =>
                                  updateSelected({
                                    [s.k]: Math.max(
                                      0,
                                      (selectedCountry[s.k] || 50) - 5
                                    ),
                                  })
                                }
                                className="px-2 bg-stone-200 rounded"
                              >
                                -
                              </button>
                              <button
                                onClick={() =>
                                  updateSelected({
                                    [s.k]: Math.min(
                                      100,
                                      (selectedCountry[s.k] || 50) + 5
                                    ),
                                  })
                                }
                                className="px-2 bg-stone-200 rounded"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* --- ONGLET LOIS (LEGISLATION) --- */}
              {activeTab === "laws" && (
                <Card title="Législation & Décrets" icon={Gavel}>
                  <div className="space-y-4">
                    {/* RESTAURATION DES CHECKBOXES DE LOIS */}
                    {selectedCountry.laws &&
                    !Array.isArray(selectedCountry.laws) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            key: "allowExternalDebits",
                            label: "Autoriser prélèvements externes",
                          },
                          {
                            key: "allowLocalConfiscation",
                            label: "Autoriser confiscations locales",
                          },
                          {
                            key: "allowLocalSales",
                            label: "Autoriser ventes locales",
                          },
                          {
                            key: "allowPermissionEditsByLocalAdmins",
                            label: "Admin: Edit Permissions",
                          },
                          {
                            key: "requireRulerApprovalForSales",
                            label: "Ventes: Approbation requise",
                          },
                          {
                            key: "taxForeignTransfers",
                            label: "Taxe transferts étrangers (10%)",
                          },
                          {
                            key: "freezeAssets",
                            label: "Geler les avoirs (Banque)",
                          },
                          {
                            key: "closedCurrency",
                            label: "Fermer la monnaie (Isolation)",
                          },
                          {
                            key: "closeBorders",
                            label: "Fermer les frontières",
                          },
                          { key: "forbidExit", label: "Interdire les sorties" },
                          {
                            key: "allowSelfManumission",
                            label: "Droit d'auto-rachat (Esclave)",
                          },
                          {
                            key: "militaryServitude",
                            label: "Servitude Martiale",
                          },
                          {
                            key: "banPublicSlaveMarket",
                            label: "Interdire marché esclaves",
                          },
                          {
                            key: "allowWeapons",
                            label: "Autoriser le port d'armes",
                          },
                          { key: "mailCensorship", label: "Censure Postale" },
                        ].map((f) => (
                          <div
                            key={f.key}
                            className="flex justify-between items-center p-3 bg-white border rounded"
                          >
                            <span className="text-xs font-bold text-stone-700">
                              {f.label}
                            </span>
                            {canEdit ? (
                              <label className="switch">
                                <input
                                  type="checkbox"
                                  checked={!!selectedCountry.laws[f.key]}
                                  onChange={() =>
                                    updateSelected({
                                      laws: {
                                        ...selectedCountry.laws,
                                        [f.key]: !selectedCountry.laws[f.key],
                                      },
                                    })
                                  }
                                />
                              </label>
                            ) : (
                              <span className="text-xs">
                                {selectedCountry.laws[f.key] ? "OUI" : "NON"}
                              </span>
                            )}
                          </div>
                        ))}
                        {/* Cas Spécial : Frais de Visa */}
                        <div className="flex justify-between items-center p-3 bg-white border rounded">
                          <span className="text-xs font-bold text-stone-700">
                            Frais Visa Entrée
                          </span>
                          {canEdit ? (
                            <input
                              type="number"
                              className="w-20 p-1 border rounded text-xs"
                              value={selectedCountry.laws.entryVisaFee || 0}
                              onChange={(e) =>
                                updateSelected({
                                  laws: {
                                    ...selectedCountry.laws,
                                    entryVisaFee: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                            />
                          ) : (
                            <span className="text-xs">
                              {selectedCountry.laws.entryVisaFee || 0} Écus
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-stone-500 italic">
                        Format ancien.{" "}
                        <button
                          onClick={migrateSelectedCountry}
                          className="underline text-blue-600"
                        >
                          Migrer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SECTION IMPORT & LISTE DECRETS */}
                  <div className="mt-6 pt-6 border-t border-stone-200">
                    <h3 className="font-black uppercase text-xs mb-4 text-stone-400">
                      Décrets Spéciaux
                    </h3>
                    {canEdit && (
                      <div className="mb-6 p-4 bg-stone-100 border border-stone-300 rounded-xl shadow-inner">
                        <div className="text-[10px] font-black uppercase text-stone-500 tracking-widest mb-2 flex items-center gap-2">
                          <Link size={12} /> Importer GDoc
                        </div>
                        <div className="flex gap-2">
                          <input
                            className="flex-1 p-2 border border-stone-300 rounded text-xs"
                            placeholder="Lien public..."
                            value={gDocUrl}
                            onChange={(e) => setGDocUrl(e.target.value)}
                          />
                          <button
                            onClick={handleImportGDoc}
                            disabled={isLoadingDoc || !gDocUrl}
                            className="bg-stone-800 text-white px-4 rounded text-[10px] font-bold uppercase"
                          >
                            {isLoadingDoc ? "..." : <DownloadCloud size={14} />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {(
                        (Array.isArray(selectedCountry.laws)
                          ? selectedCountry.laws
                          : selectedCountry.decrees) || []
                      ).map((l) => (
                        <div
                          key={l.id}
                          className="flex justify-between items-center p-4 bg-white border border-stone-100 rounded-xl shadow-md"
                        >
                          <span className="font-bold text-stone-800 text-sm">
                            📜 {l.name}
                          </span>
                          {canEdit && (
                            <SecureDeleteButton
                              onClick={() => {
                                if (Array.isArray(selectedCountry.laws)) {
                                  updateSelected({
                                    laws: selectedCountry.laws.filter(
                                      (x) => x.id !== l.id
                                    ),
                                  });
                                } else {
                                  updateSelected({
                                    decrees: (
                                      selectedCountry.decrees || []
                                    ).filter((x) => x.id !== l.id),
                                  });
                                }
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* --- ONGLET TERRITOIRES --- */}
              {activeTab === "regions" && (
                <Card title="Territoires" icon={Map}>
                  {canEdit && (
                    <div className="flex gap-2 mb-4">
                      <input
                        className="flex-1 p-2 border rounded text-xs"
                        placeholder="Nom..."
                        value={newRegionName}
                        onChange={(e) => setNewRegionName(e.target.value)}
                      />
                      <button
                        onClick={() => {
                          if (newRegionName) {
                            updateSelected({
                              regions: [
                                ...(selectedCountry.regions || []),
                                { id: Date.now(), name: newRegionName },
                              ],
                            });
                            setNewRegionName("");
                          }
                        }}
                        className="bg-stone-800 text-white px-3 rounded uppercase text-[10px]"
                      >
                        Ajouter
                      </button>
                    </div>
                  )}
                  <div className="grid gap-2">
                    {(selectedCountry.regions || []).map((r) => (
                      <div
                        key={r.id}
                        className="flex justify-between p-3 bg-stone-50 rounded border"
                      >
                        <span className="font-bold">📍 {r.name}</span>
                        {canEdit && (
                          <SecureDeleteButton
                            onClick={() =>
                              updateSelected({
                                regions: selectedCountry.regions.filter(
                                  (x) => x.id !== r.id
                                ),
                              })
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* --- ONGLET HIERARCHIE (RANGS & STATUTS) --- */}
              {activeTab === "ranks" && (
                <div className="space-y-6">
                  {canEdit && (
                    <div className="bg-stone-100 p-4 rounded-xl border border-stone-300 shadow-sm">
                      <div className="text-[10px] uppercase font-black mb-2 text-stone-500">
                        Ajouter un rang / statut
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <input
                            className="flex-1 p-2 border rounded text-xs"
                            placeholder="Nom (ex: Duc, Banni...)"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                          />
                          <select
                            className="p-2 border rounded text-xs font-bold"
                            value={newRoleType}
                            onChange={(e) => setNewRoleType(e.target.value)}
                          >
                            <option value="ROLE">Titre</option>
                            <option value="STATUS">Statut</option>
                          </select>
                        </div>

                        {/* RESTAURATION : CONFIGURATION DES RÔLES/STATUTS */}
                        {newRoleType === "ROLE" && (
                          <div className="bg-white p-2 rounded border">
                            <label className="text-[9px] uppercase font-bold block mb-1">
                              Niveau accréditation: {newRoleLevel}
                            </label>
                            <input
                              type="range"
                              min="0"
                              max={Math.max(0, safeRoleInfo.level - 1)}
                              value={newRoleLevel}
                              onChange={(e) => setNewRoleLevel(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        )}
                        {newRoleType === "STATUS" && (
                          <label className="flex items-center gap-2 text-xs font-bold text-red-800 bg-red-50 p-2 rounded border border-red-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isRestrictedStatus}
                              onChange={(e) =>
                                setIsRestrictedStatus(e.target.checked)
                              }
                            />
                            <Lock size={12} /> Restreindre les libertés
                            (Prisonnier/Esclave)
                          </label>
                        )}

                        <button
                          onClick={addCustomRole}
                          disabled={!newRoleName}
                          className="w-full bg-stone-800 text-white py-2 rounded text-[10px] uppercase font-bold hover:bg-stone-700"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  )}
                  <Card title="Rangs & Statuts Définis" icon={Award}>
                    {(selectedCountry.customRoles || []).map((r) => (
                      <div
                        key={r.id}
                        className={`flex justify-between items-center p-3 border-b last:border-0 ${
                          r.isRestricted ? "bg-red-50" : ""
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-sm flex items-center gap-2">
                            {r.type === "STATUS" ? "⚠️" : "🎖️"} {r.name}
                          </span>
                          <span className="text-[9px] text-stone-400 uppercase">
                            {r.type === "ROLE"
                              ? `Niveau ${r.level}`
                              : r.isRestricted
                              ? "Restreint"
                              : "Libre"}
                          </span>
                        </div>
                        {canEdit && (
                          <SecureDeleteButton
                            onClick={() => removeCustomRole(r.id)}
                          />
                        )}
                      </div>
                    ))}
                  </Card>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-stone-400 italic">
            Sélectionnez un territoire dans l'Atlas.
          </div>
        )}
      </div>
    </div>
  );
};

export default GeopoliticsView;
