import React, { useState } from "react";
import {
  User,
  Plus,
  ArrowLeft,
  Scroll,
  Coins,
  BookOpen,
  Lock,
  ImageIcon,
} from "lucide-react";
import Card from "../ui/Card";
import SecureDeleteButton from "../ui/SecureDeleteButton";
import { ROLES, BASE_STATUSES } from "../../lib/constants";

const RegistryView = ({
  citizens,
  countries,
  catalog,
  session,
  onSave,
  onDelete,
  roleInfo,
}) => {
  const [selectedId, setSelectedId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [search, setSearch] = useState("");
  const isGlobal = roleInfo.scope === "GLOBAL";
  const safeCitizens = Array.isArray(citizens) ? citizens : [];
  const safeCountries = Array.isArray(countries) ? countries : [];
  const filtered = safeCitizens.filter(
    (c) =>
      (isGlobal || c.countryId === session.countryId) &&
      ((c.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.id || "").includes(search))
  );
  const selected = safeCitizens.find((c) => c.id === selectedId);
  const canCreate = isGlobal || roleInfo.level >= 40;
  const canDelete = isGlobal || roleInfo.level >= 50;

  // Custom Roles Logic for Edit Form
  const targetCountry = editForm
    ? safeCountries.find((c) => c.id === editForm.countryId)
    : null;
  const customRoles = targetCountry
    ? (targetCountry.customRoles || []).filter((r) => r.type === "ROLE")
    : [];
  const customStatuses = targetCountry
    ? (targetCountry.customRoles || []).filter((r) => r.type === "STATUS")
    : [];

  const canManageRoles =
    isGlobal ||
    (roleInfo.level >= 50 && editForm?.countryId === session.countryId);
  const availableRoles = Object.entries(ROLES).filter(
    ([key, val]) => isGlobal || val.level < roleInfo.level
  );

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 font-sans">
      <div
        className={`w-full md:w-1/3 bg-[#fdf6e3] rounded-xl border border-stone-300 flex flex-col overflow-hidden shadow-md font-sans ${
          selectedId || editForm ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 bg-stone-100 border-b flex justify-between items-center font-bold uppercase text-[11px] tracking-[0.2em] text-stone-500 font-sans">
          <span>Registre de Population</span>
          {canCreate && (
            <button
              onClick={() =>
                setEditForm({
                  id: "EMP-" + Date.now().toString().slice(-4),
                  name: "Nouveau Sujet",
                  age: 20,
                  balance: 0,
                  role: "CITOYEN",
                  countryId: session.countryId || "C1",
                  password: "123",
                  occupation: "Citoyen",
                  bio: "",
                  status: "Actif",
                  avatarUrl: "",
                  inventory: [],
                })
              }
              className="bg-stone-800 text-white w-7 h-7 rounded-lg flex items-center justify-center hover:bg-stone-700 shadow-md transition-all active:scale-90"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
        <div className="p-3 border-b bg-white/50">
          <input
            className="w-full p-3 border-2 border-stone-200 rounded-xl text-xs outline-none bg-white focus:border-stone-500 shadow-inner transition-colors font-medium font-sans"
            placeholder="Filtrer un sujet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`p-5 border-b border-stone-50 cursor-pointer hover:bg-white rounded-xl transition-all flex items-center gap-4 ${
                selectedId === c.id
                  ? "bg-stone-800 text-white shadow-xl border-l-8 border-yellow-600 translate-x-1"
                  : "bg-white/40 shadow-sm"
              }`}
            >
              {c.avatarUrl ? (
                <img
                  src={c.avatarUrl}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                  alt=""
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <User size={20} />
                </div>
              )}
              <div className="overflow-hidden">
                <div className="font-black text-sm uppercase truncate font-sans">
                  {c.name}
                </div>
                <div className="text-[10px] mt-1 tracking-[0.2em] font-bold font-mono opacity-60 font-sans">
                  {c.id} — {ROLES[c.role]?.label || c.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className={`flex-1 bg-[#fdf6e3] rounded-xl border border-stone-300 p-6 md:p-10 overflow-auto relative shadow-2xl font-sans ${
          selectedId || editForm ? "flex flex-col" : "hidden md:flex flex-col"
        }`}
      >
        <button
          onClick={() => {
            setSelectedId(null);
            setEditForm(null);
          }}
          className="md:hidden flex items-center gap-2 text-stone-500 font-bold uppercase text-[10px] mb-8 border-b-2 border-stone-200 pb-3 font-sans"
        >
          <ArrowLeft size={16} /> Retour aux Archives
        </button>
        {editForm || selected ? (
          <div className="max-w-2xl mx-auto w-full pb-20 font-sans animate-fadeIn">
            <div className="flex justify-between items-start mb-10 border-b-4 border-stone-800 pb-6 font-serif">
              <div className="flex items-center gap-6">
                {editForm?.avatarUrl || selected?.avatarUrl ? (
                  <img
                    src={editForm?.avatarUrl || selected?.avatarUrl}
                    className="w-24 h-24 rounded-xl object-cover border-4 border-stone-800 shadow-lg"
                    alt=""
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-stone-200 flex items-center justify-center border-4 border-stone-300">
                    <User size={48} className="text-stone-400" />
                  </div>
                )}
                <div>
                  <h2 className="text-3xl md:text-4xl font-black font-serif uppercase tracking-tight text-stone-900 font-serif">
                    {(editForm || selected).name}
                  </h2>
                  <div className="text-[10px] uppercase font-black tracking-[0.3em] text-stone-400 mt-3 pl-1 font-sans font-sans">
                    Matricule: {(editForm || selected).id}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 font-sans">
                {canDelete && (
                  <SecureDeleteButton
                    onClick={() => {
                      onDelete(editForm || selected);
                      setEditForm(null);
                      setSelectedId(null);
                    }}
                    className="font-sans"
                  />
                )}
                {editForm ? (
                  <button
                    onClick={() => {
                      onSave(editForm);
                      setEditForm(null);
                    }}
                    className="bg-stone-900 text-yellow-500 px-10 py-3 rounded-xl text-[11px] font-black uppercase shadow-2xl hover:bg-stone-800 transition-all active:scale-95 tracking-widest font-sans"
                  >
                    Archiver
                  </button>
                ) : (
                  roleInfo.level >= 30 && (
                    <button
                      onClick={() => setEditForm({ ...selected })}
                      className="bg-white border-2 border-stone-300 px-8 py-3 rounded-xl text-[11px] font-black uppercase flex items-center gap-3 shadow-md hover:bg-stone-50 transition-all active:scale-95 tracking-widest font-sans"
                    >
                      Modifier
                    </button>
                  )
                )}
              </div>
            </div>
            {editForm ? (
              <div className="space-y-8 font-sans">
                <Card title="Dossier Civil" icon={User}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1 font-sans">
                        Portrait (URL)
                      </label>
                      <div className="flex gap-2">
                        <input
                          className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm focus:border-stone-800 transition-all font-bold"
                          value={editForm.avatarUrl || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              avatarUrl: e.target.value,
                            })
                          }
                          placeholder="https://..."
                        />
                        <div className="w-12 h-12 bg-stone-100 rounded-lg flex-shrink-0 border border-stone-200 overflow-hidden flex items-center justify-center">
                          {editForm.avatarUrl ? (
                            <img
                              src={editForm.avatarUrl}
                              className="w-full h-full object-cover"
                              alt=""
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          ) : (
                            <ImageIcon size={20} className="text-stone-300" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1 font-sans">
                        Nom Complet
                      </label>
                      <input
                        className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm focus:border-stone-800 transition-all font-bold"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1 font-sans">
                        Âge
                      </label>
                      <input
                        type="number"
                        className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm focus:border-stone-800 transition-all font-bold"
                        value={editForm.age}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            age: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1 font-sans">
                        Statut
                      </label>
                      <select
                        className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm font-bold"
                        value={editForm.status || "Actif"}
                        onChange={(e) =>
                          setEditForm({ ...editForm, status: e.target.value })
                        }
                      >
                        <optgroup label="Standards">
                          {BASE_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </optgroup>
                        {customStatuses.length > 0 && (
                          <optgroup
                            label={`Spéciaux (${
                              targetCountry?.name || "Local"
                            })`}
                          >
                            {customStatuses.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1 font-sans">
                        Occupation
                      </label>
                      <input
                        className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm focus:border-stone-800 transition-all font-bold"
                        value={editForm.occupation}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            occupation: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1 font-sans">
                        Nation d'Allégeance
                      </label>
                      <select
                        className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm font-bold"
                        value={editForm.countryId}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            countryId: e.target.value,
                          })
                        }
                        disabled={!isGlobal}
                      >
                        {safeCountries.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* AJOUT : Champ Propriétaire (Esclave) */}
                    <div className="col-span-1 md:col-span-2 space-y-1 bg-stone-50 p-3 rounded border border-stone-200">
                      <label className="text-[10px] font-bold text-stone-500 uppercase block tracking-widest ml-1">
                        Propriétaire (Si Esclave)
                      </label>
                      <select
                        className="w-full p-2 border rounded font-bold text-xs"
                        value={editForm.ownerId || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            ownerId:
                              e.target.value === "" ? null : e.target.value,
                          })
                        }
                      >
                        <option value="">-- Aucun (Homme Libre) --</option>
                        {safeCitizens
                          .filter((c) => c.id !== editForm.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.id})
                            </option>
                          ))}
                      </select>
                      <p className="text-[9px] text-stone-400 italic ml-1">
                        Assigner un propriétaire basculera automatiquement le
                        statut si nécessaire.
                      </p>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1 font-sans">
                        Biographie / Notes
                      </label>
                      <textarea
                        className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm focus:border-stone-800 transition-all font-bold min-h-[100px]"
                        value={editForm.bio}
                        onChange={(e) =>
                          setEditForm({ ...editForm, bio: e.target.value })
                        }
                        placeholder="Histoire du personnage..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1 font-sans">
                        Rang Impérial
                      </label>
                      <select
                        className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm font-bold"
                        value={editForm.role || "CITOYEN"}
                        onChange={(e) =>
                          setEditForm({ ...editForm, role: e.target.value })
                        }
                        disabled={!canManageRoles}
                      >
                        <optgroup label="Hiérarchie Impériale">
                          {availableRoles.map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.label}
                            </option>
                          ))}
                        </optgroup>
                        {customRoles.length > 0 && (
                          <optgroup
                            label={`Titres Locaux (${
                              targetCountry?.name || "Local"
                            })`}
                          >
                            {customRoles.map((r) => (
                              <option key={r.id} value={r.name}>
                                {r.name} (Niv. {r.level})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  </div>
                </Card>
                <Card title="Contrôle d'Accès" icon={Lock}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 block mb-2 uppercase tracking-widest">
                        Sceau (Mot de Passe)
                      </label>
                      <input
                        className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm font-mono text-center"
                        value={editForm.password}
                        onChange={(e) =>
                          setEditForm({ ...editForm, password: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="space-y-8 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                  <Card title="Informations Administratives" icon={Scroll}>
                    <div className="space-y-4 text-sm font-sans">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-stone-400 uppercase text-[9px] font-black block mb-1 tracking-widest font-sans">
                            Occupation
                          </span>
                          <span className="text-stone-900 font-bold text-lg uppercase font-sans">
                            {selected.occupation || "Citoyen"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-stone-400 uppercase text-[9px] font-black block mb-1 tracking-widest font-sans">
                            Âge
                          </span>
                          <span className="text-stone-900 font-bold text-lg uppercase font-sans">
                            {selected.age || "Inconnu"} ans
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-stone-400 uppercase text-[9px] font-black block mb-1 tracking-widest font-sans">
                          Nation d'Allégeance
                        </span>
                        <span className="text-stone-900 font-bold text-lg uppercase font-sans">
                          {safeCountries.find(
                            (c) => c.id === selected.countryId
                          )?.name || "Empire"}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 uppercase text-[9px] font-black block mb-1 tracking-widest font-sans">
                          Statut
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                            selected.status === "Décédé"
                              ? "bg-stone-800 text-white"
                              : selected.status === "Malade"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {selected.status || "Actif"}
                        </span>
                      </div>
                    </div>
                  </Card>
                  <Card
                    title="Avoirs Impériaux"
                    icon={Coins}
                    className="bg-stone-900 text-yellow-500 shadow-2xl flex flex-col justify-center items-center relative overflow-hidden font-serif font-sans p-10"
                  >
                    <Coins
                      size={100}
                      className="absolute -right-6 -bottom-6 opacity-10 font-sans"
                    />
                    <div className="text-6xl font-black relative z-10 font-serif">
                      {Number(selected.balance || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] uppercase font-black tracking-[0.4em] mt-3 opacity-50 relative z-10 font-sans">
                      Écus
                    </div>
                  </Card>
                </div>
                <Card title="Biographie & Archives" icon={BookOpen}>
                  <div className="p-4 italic text-stone-600 bg-white/50 rounded-lg border border-stone-100 leading-relaxed text-sm font-serif">
                    {selected.bio
                      ? selected.bio
                      : "Aucune archive biographique disponible pour ce sujet."}
                  </div>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-stone-300 italic flex-col gap-8 font-serif uppercase tracking-widest">
            <User size={100} className="opacity-10 animate-pulse" />
            <p className="text-2xl tracking-[0.4em] opacity-30 font-serif">
              Consultation des Registres
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistryView;
