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
  const [newCName, setNewCName] = useState("");
  const [renameBuf, setRenameBuf] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [newRegionName, setNewRegionName] = useState("");

  // Custom Roles States
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleType, setNewRoleType] = useState("ROLE"); // ROLE or STATUS
  const [newRoleLevel, setNewRoleLevel] = useState(10); // For permissions, default to 10
  const [isRestrictedStatus, setIsRestrictedStatus] = useState(false); // For statuses

  const isGlobal = roleInfo.scope === "GLOBAL";
  const safeCountries = Array.isArray(countries) ? countries : [];
  const safeCitizens = Array.isArray(citizens) ? citizens : [];
  const selectedCountry = safeCountries.find((c) => c.id === selectedId);

  // Permissions: Emperor OR (King/Intendant of that country)
  const canEdit =
    isGlobal || (session?.countryId === selectedId && roleInfo.level >= 40);

  const updateSelected = (updates) =>
    onUpdate(
      safeCountries.map((c) => (c.id === selectedId ? { ...c, ...updates } : c))
    );

  const ruler = selectedCountry
    ? safeCitizens.find(
        (c) =>
          c.countryId === selectedCountry.id &&
          (c.role === "ROI" || c.role === "EMPEREUR")
      )
    : null;
  const rulerName = ruler ? ruler.name : "Trône Vacant";
  const displayedCountries = safeCountries.filter(
    (c) => isGlobal || c.id === session.countryId
  );

  // Custom Roles Helpers
  const addCustomRole = () => {
    if (!newRoleName) return;
    // Empêcher de créer un rôle plus puissant que soi-même
    const maxLevel = roleInfo.level - 1;
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
      <div
        className={`w-full md:w-1/3 bg-[#fdf6e3] rounded-2xl border border-stone-300 flex flex-col shadow-md overflow-hidden ${
          selectedCountry ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 bg-stone-100 border-b flex justify-between items-center font-bold uppercase text-[11px] tracking-[0.2em] text-stone-500 font-sans">
          <span className="flex items-center gap-2">
            <Map size={14} /> Atlas Impérial
          </span>
          {isGlobal && (
            <button
              onClick={() => {
                if (newCName) {
                  onUpdate([
                    ...safeCountries,
                    {
                      id: "C-" + Date.now(),
                      name: newCName,
                      treasury: 0,
                      stability: 50,
                      security: 50,
                      prosperity: 50,
                      laws: [],
                      regions: [],
                      customRoles: [],
                      color: "bg-stone-50",
                      rulerName: "Gouverneur",
                      description: "Nouvelle contrée.",
                      population: 1000,
                      specialty: "Aucune",
                    },
                  ]);
                  setNewCName("");
                }
              }}
              className="bg-stone-800 text-white p-1 rounded hover:bg-stone-700 transition-colors shadow-sm"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
        {isGlobal && (
          <div className="p-3 border-b bg-white/50">
            <input
              className="w-full p-2 border rounded-xl text-xs outline-none focus:border-stone-500 shadow-inner font-sans"
              placeholder="Nom du territoire..."
              value={newCName}
              onChange={(e) => setNewCName(e.target.value)}
            />
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-3 space-y-2 font-sans">
          {displayedCountries.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`p-5 rounded-xl border transition-all cursor-pointer ${
                selectedId === c.id
                  ? "bg-stone-800 text-white shadow-xl border-stone-900 translate-x-1"
                  : `bg-white hover:border-stone-400 shadow-sm`
              }`}
            >
              <div className="font-bold flex justify-between items-center text-sm uppercase tracking-tight">
                <span className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full border border-stone-300 shadow-sm ${
                      c.color || "bg-stone-100"
                    }`}
                  />{" "}
                  {c.name}
                </span>
                <Flag
                  size={14}
                  className={
                    selectedId === c.id ? "text-yellow-500" : "text-stone-300"
                  }
                />
              </div>
              <div className="text-[10px] mt-2 opacity-70 flex flex-col gap-1 uppercase tracking-widest font-medium font-sans">
                <span>
                  {safeCitizens.find(
                    (u) =>
                      u.countryId === c.id &&
                      (u.role === "ROI" || u.role === "EMPEREUR")
                  )?.name || "Trône Vacant"}
                </span>
                <span className="flex justify-between font-mono">
                  <span>{(c.population || 0).toLocaleString()} âmes</span>
                  <span>{c.treasury} Écus</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selectedCountry ? (
        <div
          className={`flex-1 rounded-2xl border border-stone-300 overflow-y-auto relative shadow-inner flex flex-col ${
            selectedCountry.color || "bg-[#fdf6e3]"
          }`}
        >
          <div className="p-4 md:p-8 border-b border-black/5 bg-white/70 backdrop-blur-md sticky top-0 z-10 shadow-sm flex justify-between items-center font-serif">
            <div className="flex-1">
              {isRenaming && canEdit ? (
                <div className="flex gap-4">
                  <input
                    className="text-3xl font-bold p-2 w-full bg-white/80 rounded-xl border-2 border-stone-800 outline-none shadow-xl font-serif"
                    value={renameBuf}
                    onChange={(e) => setRenameBuf(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      updateSelected({ name: renameBuf });
                      setIsRenaming(false);
                    }}
                    className="bg-green-600 text-white px-8 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-green-500 font-sans"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <h2
                  className="text-2xl md:text-4xl font-black text-stone-800 cursor-pointer flex items-center gap-4 font-serif"
                  onClick={() => {
                    if (canEdit) {
                      setRenameBuf(selectedCountry.name);
                      setIsRenaming(true);
                    }
                  }}
                >
                  {selectedCountry.name}{" "}
                  {canEdit && (
                    <Edit3
                      size={20}
                      className="opacity-10 hover:opacity-100 transition-opacity"
                    />
                  )}
                </h2>
              )}
            </div>
            <div className="flex gap-4 items-center font-sans">
              <button
                onClick={() => setSelectedId(null)}
                className="md:hidden bg-stone-200 p-2 rounded-full hover:bg-stone-300 transition-all shadow-sm"
              >
                <X size={20} />
              </button>
              {isGlobal && (
                <SecureDeleteButton
                  onClick={() => {
                    onUpdate(safeCountries.filter((c) => c.id !== selectedId));
                    setSelectedId(null);
                  }}
                />
              )}
            </div>
          </div>

          {/* NAVIGATION TABS */}
          <div className="flex bg-white/40 border-b border-black/5 p-2 gap-2 shadow-inner font-sans font-bold uppercase text-[11px] overflow-x-auto">
            {["info", "laws", "regions", "ranks"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[100px] py-3 rounded-lg tracking-[0.2em] transition-all shadow-sm whitespace-nowrap ${
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

          <div className="p-4 md:p-10 space-y-8 pb-24 font-sans">
            {activeTab === "info" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Souverain de Sang" icon={Crown}>
                    <div className="font-serif font-black text-2xl text-stone-900 tracking-tight">
                      {rulerName}
                    </div>
                    {ruler && (
                      <div className="text-[10px] text-stone-500 uppercase tracking-[0.3em] mt-2 font-bold">
                        {ROLES[ruler.role].label}
                      </div>
                    )}
                  </Card>
                  <Card title="Vocation Nationale" icon={Briefcase}>
                    {canEdit ? (
                      <input
                        className="w-full bg-transparent border-b-2 border-stone-400 outline-none text-lg font-bold p-1 focus:border-stone-800 transition-colors"
                        value={selectedCountry.specialty || ""}
                        onChange={(e) =>
                          updateSelected({ specialty: e.target.value })
                        }
                        placeholder="Ex: Commerce Royal"
                      />
                    ) : (
                      <div className="text-lg font-bold text-stone-800">
                        {selectedCountry.specialty || "Aucune spécialité"}
                      </div>
                    )}
                  </Card>
                  <Card title="Nombre de Sujets" icon={Users}>
                    <div className="font-mono text-2xl font-bold">
                      {(selectedCountry.population || 0).toLocaleString()}
                    </div>
                  </Card>
                  <Card
                    title="Trésorerie d'État"
                    icon={Coins}
                    className="bg-yellow-50 shadow-inner border-yellow-200"
                  >
                    <div className="text-3xl font-black text-yellow-800 font-mono tracking-tighter">
                      {selectedCountry.treasury} Écus
                    </div>
                  </Card>
                </div>
                <Card title="État des Lieux" icon={Activity}>
                  <div className="grid grid-cols-3 gap-3 md:gap-6 text-center">
                    {[
                      { k: "stability", l: "Stabilité", i: "⚖️" },
                      { k: "security", l: "Sécurité", i: "🛡️" },
                      { k: "prosperity", l: "Prospérité", i: "📈" },
                    ].map((stat) => (
                      <div
                        key={stat.k}
                        className="bg-white/60 p-2 md:p-4 rounded-xl border border-black/5 shadow-sm"
                      >
                        <div className="text-[8px] md:text-[10px] uppercase font-bold text-stone-500 mb-3 tracking-tighter truncate">
                          {stat.i} {stat.l}
                        </div>
                        <div className="text-xl md:text-2xl font-black font-mono text-stone-800">
                          {selectedCountry[stat.k] || 50}%
                        </div>
                        {canEdit && (
                          <div className="flex justify-center gap-2 mt-3">
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-stone-200 rounded-lg text-sm font-bold hover:bg-stone-300 transition-all"
                              onClick={() =>
                                updateSelected({
                                  [stat.k]: Math.max(
                                    0,
                                    (selectedCountry[stat.k] || 50) - 5
                                  ),
                                })
                              }
                            >
                              -
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-stone-200 rounded-lg text-sm font-bold hover:bg-stone-300 transition-all"
                              onClick={() =>
                                updateSelected({
                                  [stat.k]: Math.min(
                                    100,
                                    (selectedCountry[stat.k] || 50) + 5
                                  ),
                                })
                              }
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
            {activeTab === "laws" && (
              <Card title="Décrets et Édits Impériaux" icon={Gavel}>
                {canEdit && (
                  <button
                    className="w-full bg-stone-800 text-white py-3 rounded-xl mb-6 font-bold uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-stone-700 transition-all"
                    onClick={() => {
                      updateSelected({
                        laws: [
                          ...(selectedCountry.laws || []),
                          {
                            id: Date.now(),
                            name: "Nouvel Édit de la Couronne",
                            active: true,
                          },
                        ],
                      });
                    }}
                  >
                    + Proclamer un Décret
                  </button>
                )}
                <div className="space-y-3">
                  {(selectedCountry.laws || []).map((l) => (
                    <div
                      key={l.id}
                      className="flex justify-between items-center p-4 bg-white border border-stone-100 rounded-xl shadow-md transition-all hover:shadow-lg"
                    >
                      {canEdit ? (
                        <input
                          className="font-bold text-base bg-transparent border-b border-dashed border-stone-300 w-full mr-6 outline-none focus:border-stone-800"
                          value={l.name}
                          onChange={(e) => {
                            const nl = selectedCountry.laws.map((x) =>
                              x.id === l.id ? { ...x, name: e.target.value } : x
                            );
                            updateSelected({ laws: nl });
                          }}
                        />
                      ) : (
                        <span className="font-bold text-base text-stone-800">
                          📜 {l.name}
                        </span>
                      )}
                      {canEdit && (
                        <SecureDeleteButton
                          onClick={() =>
                            updateSelected({
                              laws: selectedCountry.laws.filter(
                                (x) => x.id !== l.id
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
            {activeTab === "regions" && (
              <Card title="Territoires et Régions" icon={Map}>
                {canEdit && (
                  <div className="flex gap-2 mb-4">
                    <input
                      className="flex-1 p-3 border rounded-lg text-xs"
                      placeholder="Nom du territoire..."
                      value={newRegionName}
                      onChange={(e) => setNewRegionName(e.target.value)}
                    />
                    <button
                      className="bg-stone-800 text-white px-4 rounded-lg font-bold uppercase text-[10px]"
                      onClick={() => {
                        if (newRegionName) {
                          updateSelected({
                            regions: [
                              ...(selectedCountry.regions || []),
                              {
                                id: Date.now(),
                                name: newRegionName,
                                status: "Calme",
                              },
                            ],
                          });
                          setNewRegionName("");
                        }
                      }}
                    >
                      Ajouter
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-2">
                  {(selectedCountry.regions || []).map((r) => (
                    <div
                      key={r.id}
                      className="flex justify-between items-center p-3 bg-stone-50 rounded border border-stone-200"
                    >
                      <span className="font-bold text-stone-800">
                        📍 {r.name}
                      </span>
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

            {/* --- ONGLET HIÉRARCHIE --- */}
            {activeTab === "ranks" && (
              <div className="space-y-6">
                {canEdit && (
                  <div className="bg-stone-100 border border-stone-300 rounded-xl p-6 shadow-sm">
                    <div className="text-xs font-black uppercase text-stone-500 mb-4 tracking-widest flex items-center gap-2">
                      <Plus size={16} /> Créer une Distinction
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">
                            Nom du Rang / Statut
                          </label>
                          <input
                            className="w-full p-3 border-2 border-stone-200 rounded-lg font-bold text-sm outline-none focus:border-stone-800"
                            placeholder="Ex: Grand Duc, Exilé..."
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                          />
                        </div>
                        <div className="w-1/3">
                          <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">
                            Catégorie
                          </label>
                          <select
                            className="w-full p-3 border-2 border-stone-200 rounded-lg font-bold text-sm outline-none"
                            value={newRoleType}
                            onChange={(e) => setNewRoleType(e.target.value)}
                          >
                            <option value="ROLE">Titre (Pouvoir)</option>
                            <option value="STATUS">Statut (État)</option>
                          </select>
                        </div>
                      </div>

                      {/* Paramètres Spécifiques */}
                      {newRoleType === "ROLE" && (
                        <div className="bg-white p-3 rounded-lg border border-stone-200">
                          <label className="text-[9px] font-bold uppercase text-stone-400 block mb-2 flex justify-between">
                            <span>Niveau d'Accréditation</span>
                            <span className="text-stone-800 font-mono text-sm">
                              {newRoleLevel} / {roleInfo.level - 1}
                            </span>
                          </label>
                          <input
                            type="range"
                            className="w-full accent-stone-800"
                            min="0"
                            max={Math.max(0, roleInfo.level - 1)}
                            value={newRoleLevel}
                            onChange={(e) => setNewRoleLevel(e.target.value)}
                          />
                          <p className="text-[9px] text-stone-500 mt-1 italic">
                            Définit l'accès aux outils administratifs (0 =
                            Citoyen, 20 = Postière, 30 = Fonctionnaire, 40+ =
                            Grand Fonctionnaire).
                          </p>
                        </div>
                      )}

                      {newRoleType === "STATUS" && (
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200 flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="restrict"
                            className="w-5 h-5 accent-red-600"
                            checked={isRestrictedStatus}
                            onChange={(e) =>
                              setIsRestrictedStatus(e.target.checked)
                            }
                          />
                          <label
                            htmlFor="restrict"
                            className="text-xs font-bold text-red-800 cursor-pointer flex-1"
                          >
                            Restreindre les Libertés (Comme un Prisonnier)
                          </label>
                          <ShieldAlert size={16} className="text-red-500" />
                        </div>
                      )}

                      <button
                        onClick={addCustomRole}
                        disabled={!newRoleName}
                        className={`w-full py-3 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-md transition-all ${
                          !newRoleName
                            ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                            : "bg-stone-800 text-white hover:bg-stone-700 active:scale-95"
                        }`}
                      >
                        Enregistrer la Distinction
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Titres Honorifiques & Rangs" icon={Award}>
                    <div className="space-y-2">
                      {(selectedCountry.customRoles || []).filter(
                        (r) => r.type === "ROLE"
                      ).length === 0 && (
                        <div className="text-stone-400 italic text-xs text-center py-4">
                          Aucun titre défini.
                        </div>
                      )}
                      {(selectedCountry.customRoles || [])
                        .filter((r) => r.type === "ROLE")
                        .sort((a, b) => (b.level || 0) - (a.level || 0))
                        .map((r) => (
                          <div
                            key={r.id}
                            className="flex justify-between items-center p-3 bg-white border border-stone-200 rounded-lg shadow-sm"
                          >
                            <div>
                              <div className="font-bold text-stone-800 text-sm">
                                🎖️ {r.name}
                              </div>
                              <div className="text-[9px] uppercase font-bold text-stone-400 tracking-widest">
                                Niveau {r.level}
                              </div>
                            </div>
                            {canEdit && (
                              <SecureDeleteButton
                                onClick={() => removeCustomRole(r.id)}
                              />
                            )}
                          </div>
                        ))}
                    </div>
                  </Card>

                  <Card title="Statuts & Conditions" icon={Activity}>
                    <div className="space-y-2">
                      {(selectedCountry.customRoles || []).filter(
                        (r) => r.type === "STATUS"
                      ).length === 0 && (
                        <div className="text-stone-400 italic text-xs text-center py-4">
                          Aucun statut défini.
                        </div>
                      )}
                      {(selectedCountry.customRoles || [])
                        .filter((r) => r.type === "STATUS")
                        .map((r) => (
                          <div
                            key={r.id}
                            className={`flex justify-between items-center p-3 rounded-lg shadow-sm border ${
                              r.isRestricted
                                ? "bg-red-50 border-red-200"
                                : "bg-white border-stone-200"
                            }`}
                          >
                            <div>
                              <div
                                className={`font-bold text-sm ${
                                  r.isRestricted
                                    ? "text-red-800"
                                    : "text-stone-800"
                                }`}
                              >
                                ⚠️ {r.name}
                              </div>
                              {r.isRestricted && (
                                <div className="text-[9px] uppercase font-bold text-red-500 tracking-widest flex items-center gap-1">
                                  <Lock size={8} /> Liberté Restreinte
                                </div>
                              )}
                            </div>
                            {canEdit && (
                              <SecureDeleteButton
                                onClick={() => removeCustomRole(r.id)}
                              />
                            )}
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-stone-300 flex-col gap-6 font-serif italic uppercase">
          <Globe size={80} className="opacity-10 animate-pulse" />
          <p className="text-xl tracking-widest opacity-40">Atlas Impérial</p>
        </div>
      )}
    </div>
  );
};

export default GeopoliticsView;
