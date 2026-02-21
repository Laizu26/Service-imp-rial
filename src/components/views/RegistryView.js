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
  MapPin,
  Flag,
  Package,
  Search,
  Trash2,
} from "lucide-react";
import Card from "../ui/Card";
import SecureDeleteButton from "../ui/SecureDeleteButton";
import { ROLES, BASE_STATUSES } from "../../lib/constants";
import { getCitizenAge, ageToBirthDate, formatRPDate } from "../../lib/gameUtils";

const RegistryView = ({
  citizens,
  countries,
  catalog,
  session,
  onSave,
  onDelete,
  roleInfo,
  gameDate,
}) => {
  const gd = gameDate || { day: 1, month: 1, year: 1200 };
  const [selectedId, setSelectedId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [search, setSearch] = useState("");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const isGlobal = roleInfo.scope === "GLOBAL";
  const safeCitizens = Array.isArray(citizens) ? citizens : [];
  const safeCountries = Array.isArray(countries) ? countries : [];

  // Diplomate : accès étendu aux citoyens du pays visité
  const isDiplomat = session?.status === "Diplomate";
  const diplomatHostCountryId =
    isDiplomat &&
    session?.locationCountryId &&
    session.locationCountryId !== session.countryId
      ? session.locationCountryId
      : null;

  const filtered = safeCitizens.filter(
    (c) =>
      (isGlobal ||
        c.countryId === session.countryId ||
        (diplomatHostCountryId && c.countryId === diplomatHostCountryId)) &&
      ((c.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.id || "").includes(search))
  );
  const selected = safeCitizens.find((c) => c.id === selectedId);
  const canCreate = isGlobal || roleInfo.level >= 40;
  const canDelete = isGlobal || roleInfo.level >= 50;

  // --- LOGIQUE POUR LISTES DÉROULANTES ---
  // Allégeance = countryId (nationalité politique)
  const allegianceCountry = editForm
    ? safeCountries.find((c) => c.id === editForm.countryId)
    : null;
  const customRoles = allegianceCountry
    ? (allegianceCountry.customRoles || []).filter((r) => r.type === "ROLE")
    : [];
  const customStatuses = allegianceCountry
    ? (allegianceCountry.customRoles || []).filter((r) => r.type === "STATUS")
    : [];
  // Localisation = locationCountryId (pays physique, indépendant de l'allégeance)
  const locationCountry = editForm
    ? safeCountries.find(
        (c) => c.id === (editForm.locationCountryId || editForm.countryId)
      )
    : null;
  const availableRegions = locationCountry
    ? locationCountry.regions || []
    : [];

  const canManageRoles =
    isGlobal ||
    (roleInfo.level >= 50 && editForm?.countryId === session.countryId);
  const availableRoles = Object.entries(ROLES).filter(
    ([key, val]) => isGlobal || val.level < roleInfo.level
  );

  // Niveau du citoyen en cours d'édition (pour filtrer les statuts réservés)
  const editedCitizenRoleLevel = (() => {
    if (!editForm) return 0;
    if (ROLES[editForm.role]) return ROLES[editForm.role].level;
    const cc = safeCountries.find((c) => c.id === editForm.countryId);
    const custom = (cc?.customRoles || []).find(
      (r) => r.type === "ROLE" && (r.id === editForm.role || r.name === editForm.role)
    );
    return custom?.level || 0;
  })();
  const availableStatuses = BASE_STATUSES.filter(
    (s) => s !== "Diplomate" || editedCitizenRoleLevel >= 40
  );

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 font-sans min-h-0">
      {/* --- SIDEBAR LIST --- */}
      <div
        className={`w-full md:w-1/3 bg-[#fdf6e3] rounded-xl border border-stone-300 flex flex-col overflow-hidden shadow-md font-sans min-h-0 ${
          selectedId || editForm ? "hidden md:flex" : "flex"
        }`}
      >
        {diplomatHostCountryId && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-[9px] font-black uppercase tracking-widest text-blue-700 flex items-center gap-2">
            🎖️ Accès diplomatique —{" "}
            {safeCountries.find((c) => c.id === diplomatHostCountryId)?.name || diplomatHostCountryId}
          </div>
        )}
        <div className="p-4 bg-stone-100 border-b flex justify-between items-center font-bold uppercase text-[11px] tracking-[0.2em] text-stone-500 font-sans">
          <span>Registre de Population</span>
          {canCreate && (
            <button
              onClick={() =>
                setEditForm({
                  id: "EMP-" + Date.now().toString().slice(-4),
                  name: "Nouveau Sujet",
                  birthDate: { day: 1, month: 1, year: gd.year - 20 },
                  balance: 0,
                  role: "CITOYEN",
                  countryId: session.countryId || "C1",
                  locationCountryId: session.countryId || "C1",
                  password: "123",
                  occupation: "Citoyen",
                  bio: "",
                  status: "Actif",
                  avatarUrl: "",
                  inventory: [],
                  currentPosition: "",
                  motto: "",
                  title: "",
                  religion: "",
                  origin: "",
                  sexe: "",
                  race: "",
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
                <div className="text-[11px] mt-1 text-stone-500 truncate">
                  {safeCountries.find(
                    (ct) =>
                      ct.id ===
                      (c.locationCountryId || c.countryId)
                  )?.name || ""}{" "}
                  {c.currentPosition
                    ? `— ${c.currentPosition}`
                    : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div
        className={`flex-1 min-h-0 bg-[#fdf6e3] rounded-xl border border-stone-300 p-6 md:p-10 overflow-y-auto relative shadow-2xl font-sans ${
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
            {/* EN-TÊTE FICHE */}
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
                  <div className="text-sm text-stone-600 mt-2 flex items-center gap-2">
                    <MapPin size={14} />
                    <div>
                      {safeCountries.find(
                        (ct) =>
                          ct.id ===
                          ((editForm || selected).locationCountryId ||
                            (editForm || selected).countryId)
                      )?.name || ""}{" "}
                      {(editForm || selected).currentPosition
                        ? `— ${(editForm || selected).currentPosition}`
                        : ""}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 font-sans">
                {canDelete && !(session.status === "Esclave" && (selected.id === session.id || selected.id === session.ownerId)) && (
                  <SecureDeleteButton
                    onClick={() => {
                      onDelete(editForm || selected);
                      setEditForm(null);
                      setSelectedId(null);
                    }}
                    className="font-sans"
                  />
                )}
                {session.status === "Esclave" && (selected.id === session.id || selected.id === session.ownerId) && (
                  <div className="flex items-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest bg-red-50 border border-red-200 px-4 py-2 rounded-xl">
                    <Lock size={14} /> {selected.id === session.id ? "Votre dossier" : "Dossier de votre maître"} — Modification interdite
                  </div>
                )}
                {editForm ? (
                  <button
                    onClick={() => {
                      const toSave = { ...editForm };
                      // Convertir les champs birthDay/Month/Year en birthDate
                      if (toSave.birthDay != null || toSave.birthMonth != null || toSave.birthYear != null) {
                        toSave.birthDate = {
                          day: parseInt(toSave.birthDay) || toSave.birthDate?.day || 1,
                          month: parseInt(toSave.birthMonth) || toSave.birthDate?.month || 1,
                          year: parseInt(toSave.birthYear) || toSave.birthDate?.year || (gd.year - 20),
                        };
                        delete toSave.birthDay;
                        delete toSave.birthMonth;
                        delete toSave.birthYear;
                      }
                      onSave(toSave);
                      setEditForm(null);
                    }}
                    className="bg-stone-900 text-yellow-500 px-10 py-3 rounded-xl text-[11px] font-black uppercase shadow-2xl hover:bg-stone-800 transition-all active:scale-95 tracking-widest font-sans"
                  >
                    Archiver
                  </button>
                ) : (
                  roleInfo.level >= 30 &&
                  !(session.status === "Esclave" && (selected.id === session.id || selected.id === session.ownerId)) && (
                    <button
                      onClick={() => {
                        const ef = { ...selected };
                        if (!ef.birthDate && ef.age) {
                          ef.birthDate = ageToBirthDate(ef.age, gd);
                        }
                        setEditForm(ef);
                      }}
                      className="bg-white border-2 border-stone-300 px-8 py-3 rounded-xl text-[11px] font-black uppercase flex items-center gap-3 shadow-md hover:bg-stone-50 transition-all active:scale-95 tracking-widest font-sans"
                    >
                      Modifier
                    </button>
                  )
                )}
              </div>
            </div>

            {/* FORMULAIRE D'ÉDITION */}
            {editForm ? (
              <div className="space-y-8 font-sans">
                <Card title="Dossier Civil" icon={User}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Portrait */}
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

                    {/* Nom Complet */}
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

                    {/* --- BLOC ALLÉGEANCE (Nationalité politique) --- */}
                    <div className="col-span-1 md:col-span-2 bg-stone-50 p-5 rounded-xl border border-stone-200">
                      <h4 className="text-xs font-black uppercase text-stone-400 mb-4 flex items-center gap-2 tracking-widest">
                        <Flag size={12} /> Allégeance
                      </h4>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1">
                          Nation d'Allégeance
                        </label>
                        <div className="relative">
                          <Flag
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                          />
                          <select
                            className="w-full p-3 pl-9 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm font-bold disabled:opacity-50"
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
                      </div>
                    </div>

                    {/* --- BLOC LOCALISATION (Position physique, lié au voyage) --- */}
                    <div className="col-span-1 md:col-span-2 bg-amber-50 p-5 rounded-xl border border-amber-200">
                      <h4 className="text-xs font-black uppercase text-amber-600 mb-4 flex items-center gap-2 tracking-widest">
                        <MapPin size={12} /> Localisation Physique
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* PAYS DE LOCALISATION */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1">
                            Pays actuel
                          </label>
                          <div className="relative">
                            <MapPin
                              size={14}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500"
                            />
                            <select
                              className="w-full p-3 pl-9 border-2 border-amber-200 rounded-xl bg-white outline-none shadow-sm font-bold disabled:opacity-50"
                              value={
                                editForm.locationCountryId ||
                                editForm.countryId
                              }
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  locationCountryId: e.target.value,
                                  currentPosition: "",
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
                        </div>

                        {/* RÉGION / POSITION */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1">
                            Région
                          </label>
                          <select
                            className="w-full p-3 border-2 border-amber-200 rounded-xl bg-white outline-none shadow-sm font-bold disabled:opacity-50"
                            value={editForm.currentPosition || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                currentPosition: e.target.value,
                              })
                            }
                            disabled={
                              !editForm.locationCountryId &&
                              !editForm.countryId
                            }
                          >
                            <option value="">-- Non définie --</option>
                            <option value="Frontière">Frontière</option>
                            {availableRegions.map((r) => (
                              <option key={r.id || r.name} value={r.name}>
                                {r.name}
                              </option>
                            ))}
                            {!availableRegions.find(
                              (r) => r.name === editForm.currentPosition
                            ) &&
                              editForm.currentPosition &&
                              editForm.currentPosition !== "Frontière" && (
                                <option value={editForm.currentPosition}>
                                  {editForm.currentPosition} (Hors liste)
                                </option>
                              )}
                          </select>
                        </div>
                      </div>
                      <p className="text-[9px] text-amber-600 mt-3 italic">
                        La localisation change via le système de voyage. Modification manuelle réservée aux administrateurs globaux.
                      </p>
                    </div>

                    {/* Date de naissance */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1 font-sans">
                        Date de naissance (RP)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm focus:border-stone-800 transition-all font-bold"
                          value={editForm.birthDay ?? (editForm.birthDate?.day || 1)}
                          onChange={(e) => setEditForm({ ...editForm, birthDay: parseInt(e.target.value) || 1 })}
                          min="1" max="30" placeholder="Jour"
                        />
                        <select
                          className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm focus:border-stone-800 transition-all font-bold"
                          value={editForm.birthMonth ?? (editForm.birthDate?.month || 1)}
                          onChange={(e) => setEditForm({ ...editForm, birthMonth: parseInt(e.target.value) || 1 })}
                        >
                          {["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <input
                          type="number"
                          className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm focus:border-stone-800 transition-all font-bold"
                          value={editForm.birthYear ?? (editForm.birthDate?.year || gd.year - 20)}
                          onChange={(e) => setEditForm({ ...editForm, birthYear: parseInt(e.target.value) || (gd.year - 20) })}
                          placeholder="Année"
                        />
                      </div>
                      <div className="text-[9px] text-stone-400 mt-1">
                        Âge : {getCitizenAge({ birthDate: { day: editForm.birthDay ?? (editForm.birthDate?.day || 1), month: editForm.birthMonth ?? (editForm.birthDate?.month || 1), year: editForm.birthYear ?? (editForm.birthDate?.year || gd.year - 20) } }, gd)} ans
                      </div>
                    </div>

                    {/* Sexe */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1 font-sans">
                        Sexe
                      </label>
                      <select
                        className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm font-bold"
                        value={editForm.sexe || ""}
                        onChange={(e) => setEditForm({ ...editForm, sexe: e.target.value })}
                      >
                        <option value="">-- Non défini --</option>
                        <option value="Masculin">Masculin</option>
                        <option value="Féminin">Féminin</option>
                        <option value="Non-binaire">Non-binaire</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>

                    {/* Race */}
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase block tracking-widest ml-1 font-sans">
                        Race / Espèce
                      </label>
                      <input
                        className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none shadow-sm focus:border-stone-800 transition-all font-bold"
                        value={editForm.race || ""}
                        onChange={(e) => setEditForm({ ...editForm, race: e.target.value })}
                        placeholder="Ex : Humain, Elfe, Nain, Orc…"
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
                          {availableStatuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </optgroup>
                        {customStatuses.length > 0 && (
                          <optgroup
                            label={`Spéciaux (${
                              allegianceCountry?.name || "Local"
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

                    {/* Propriétaire (Pour les esclaves) — champ de recherche */}
                    <div className="col-span-1 md:col-span-2 space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
                      <label className="text-[10px] font-bold text-stone-500 uppercase block tracking-widest ml-1">
                        Propriétaire (Si Esclave)
                      </label>
                      {editForm.ownerId ? (
                        <div className="flex items-center gap-3 p-3 bg-white border-2 border-stone-200 rounded-xl">
                          <User size={14} className="text-stone-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-sm text-stone-800">
                              {safeCitizens.find((c) => c.id === editForm.ownerId)?.name || editForm.ownerId}
                            </div>
                            <div className="text-[9px] font-mono text-stone-400">{editForm.ownerId}</div>
                          </div>
                          <button
                            onClick={() => { setEditForm({ ...editForm, ownerId: null }); setOwnerSearch(""); }}
                            className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="flex items-center gap-2 border-2 border-stone-200 rounded-xl bg-white px-3">
                            <Search size={14} className="text-stone-400 shrink-0" />
                            <input
                              className="flex-1 p-2.5 outline-none text-sm font-bold bg-transparent"
                              placeholder="Rechercher un citoyen par nom ou ID…"
                              value={ownerSearch}
                              onChange={(e) => { setOwnerSearch(e.target.value); setShowOwnerDropdown(true); }}
                              onFocus={() => setShowOwnerDropdown(true)}
                            />
                          </div>
                          {showOwnerDropdown && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto border border-stone-200 rounded-xl bg-white shadow-xl p-2 space-y-1">
                              <button
                                onClick={() => { setEditForm({ ...editForm, ownerId: null }); setOwnerSearch(""); setShowOwnerDropdown(false); }}
                                className="w-full text-left p-2 rounded-lg text-xs text-stone-400 italic hover:bg-stone-50"
                              >
                                — Aucun (Homme Libre)
                              </button>
                              {safeCitizens
                                .filter((c) =>
                                  c.id !== editForm.id &&
                                  (!ownerSearch ||
                                    c.name?.toLowerCase().includes(ownerSearch.toLowerCase()) ||
                                    c.id?.includes(ownerSearch))
                                )
                                .slice(0, 10)
                                .map((c) => (
                                  <button
                                    key={c.id}
                                    onClick={() => {
                                      setEditForm({ ...editForm, ownerId: c.id });
                                      setOwnerSearch("");
                                      setShowOwnerDropdown(false);
                                    }}
                                    className="w-full text-left p-2 rounded-lg hover:bg-stone-100 flex items-center gap-2 transition-colors"
                                  >
                                    {c.avatarUrl ? (
                                      <img src={c.avatarUrl} className="w-6 h-6 rounded-full object-cover border border-stone-200" alt="" />
                                    ) : (
                                      <User size={12} className="text-stone-400 shrink-0" />
                                    )}
                                    <span className="font-bold text-sm text-stone-800 truncate">{c.name}</span>
                                    <span className="text-[9px] text-stone-400 ml-auto shrink-0 font-mono">{c.id}</span>
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
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
                              allegianceCountry?.name || "Local"
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

                {/* GESTION INVENTAIRE */}
                <Card title="Inventaire" icon={Package}>
                  <div className="space-y-3">
                    {/* Liste des items actuels */}
                    {(editForm.inventory || []).length === 0 ? (
                      <p className="text-xs text-stone-400 italic text-center py-3">Inventaire vide.</p>
                    ) : (
                      <div className="space-y-2">
                        {(editForm.inventory || []).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                            <Package size={14} className="text-stone-400 shrink-0" />
                            <span className="flex-1 font-bold text-sm text-stone-800 truncate">{item.name || item}</span>
                            <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                              ×{item.quantity || 1}
                            </span>
                            <button
                              onClick={() =>
                                setEditForm({
                                  ...editForm,
                                  inventory: editForm.inventory.filter((_, i) => i !== idx),
                                })
                              }
                              className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ajouter un item depuis le catalogue */}
                    <div className="border-t border-stone-200 pt-3 space-y-2">
                      <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">
                        Ajouter depuis le catalogue
                      </label>
                      <div className="flex items-center gap-2 border-2 border-stone-200 rounded-xl bg-white px-3">
                        <Search size={14} className="text-stone-400 shrink-0" />
                        <input
                          className="flex-1 p-2.5 outline-none text-sm font-bold bg-transparent"
                          placeholder="Rechercher un objet…"
                          value={itemSearch}
                          onChange={(e) => setItemSearch(e.target.value)}
                        />
                      </div>
                      {itemSearch && (
                        <div className="max-h-40 overflow-y-auto border border-stone-200 rounded-xl bg-white shadow p-2 space-y-1">
                          {(catalog || [])
                            .filter((item) => item.name?.toLowerCase().includes(itemSearch.toLowerCase()))
                            .slice(0, 8)
                            .map((item) => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  const existing = (editForm.inventory || []).findIndex((i) => (i.id || i) === item.id);
                                  let newInv;
                                  if (existing !== -1) {
                                    newInv = editForm.inventory.map((i, idx) =>
                                      idx === existing ? { ...i, quantity: (i.quantity || 1) + 1 } : i
                                    );
                                  } else {
                                    newInv = [...(editForm.inventory || []), { id: item.id, name: item.name, quantity: 1 }];
                                  }
                                  setEditForm({ ...editForm, inventory: newInv });
                                  setItemSearch("");
                                }}
                                className="w-full text-left p-2 rounded-lg hover:bg-stone-100 flex items-center gap-2 transition-colors"
                              >
                                <Package size={12} className="text-stone-400 shrink-0" />
                                <span className="font-bold text-sm text-stone-800 truncate">{item.name}</span>
                                {item.price != null && (
                                  <span className="text-[9px] text-stone-400 ml-auto shrink-0">{item.price} Écus</span>
                                )}
                              </button>
                            ))}
                          {(catalog || []).filter((item) => item.name?.toLowerCase().includes(itemSearch.toLowerCase())).length === 0 && (
                            <div className="text-xs text-stone-400 italic text-center py-2">Aucun objet trouvé.</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              // --- VUE DÉTAILLÉE (LECTURE SEULE) ---
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
                            {getCitizenAge(selected, gd) || "Inconnu"} ans
                          </span>
                          {selected.birthDate && (
                            <span className="text-stone-400 text-[9px] font-normal block mt-0.5">
                              Né(e) le {formatRPDate(selected.birthDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-stone-400 uppercase text-[9px] font-black block mb-1 tracking-widest font-sans">
                          Allégeance
                        </span>
                        <span className="text-stone-900 font-bold text-lg uppercase font-sans">
                          {safeCountries.find(
                            (c) => c.id === selected.countryId
                          )?.name || "Empire"}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 uppercase text-[9px] font-black block mb-1 tracking-widest font-sans">
                          Localisation
                        </span>
                        <span className="text-stone-900 font-bold text-lg uppercase font-sans">
                          {safeCountries.find(
                            (c) =>
                              c.id ===
                              (selected.locationCountryId ||
                                selected.countryId)
                          )?.name || "Empire"}{" "}
                          —{" "}
                          <span className="text-stone-500 text-sm">
                            {selected.currentPosition || "Inconnue"}
                          </span>
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
                      {(selected.sexe || selected.race) && (
                        <div className="flex gap-6 pt-1">
                          {selected.sexe && (
                            <div>
                              <span className="text-stone-400 uppercase text-[9px] font-black block mb-1 tracking-widest font-sans">Sexe</span>
                              <span className="text-stone-900 font-bold uppercase font-sans">{selected.sexe}</span>
                            </div>
                          )}
                          {selected.race && (
                            <div>
                              <span className="text-stone-400 uppercase text-[9px] font-black block mb-1 tracking-widest font-sans">Race</span>
                              <span className="text-stone-900 font-bold uppercase font-sans">{selected.race}</span>
                            </div>
                          )}
                        </div>
                      )}
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

                {/* Inventaire en lecture */}
                {(selected.inventory || []).length > 0 && (
                  <Card title="Inventaire" icon={Package}>
                    <div className="space-y-2">
                      {selected.inventory.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                          <Package size={14} className="text-stone-400 shrink-0" />
                          <span className="flex-1 font-bold text-sm text-stone-800">{item.name || item}</span>
                          <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                            ×{item.quantity || 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
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
