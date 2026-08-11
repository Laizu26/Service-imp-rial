import React, { useState } from "react";
import { ArrowLeft, ArrowRight, User, Wand2, Scroll, Feather, Image as ImageIcon, Key, Globe2, Sparkles } from "lucide-react";
import { DEFAULT_RACE_CONFIG } from "../../lib/constants";

const SEXE_OPTIONS = ["Masculin", "Féminin", "Non-binaire", "Autre"];

const SectionDivider = ({ children }) => (
  <div className="flex items-center gap-3 my-2">
    <div className="flex-1 h-px bg-stone-700" />
    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-yellow-600/80 whitespace-nowrap">
      {children}
    </span>
    <div className="flex-1 h-px bg-stone-700" />
  </div>
);

const Field = ({ label, icon: Icon, children }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
      {Icon && <Icon size={12} />} {label}
    </label>
    {children}
  </div>
);

const inputClass =
  "w-full p-3 bg-stone-800 border-2 border-stone-700 rounded-xl font-bold text-stone-200 outline-none focus:border-yellow-600/60 focus:bg-stone-800/80 transition-all placeholder:text-stone-600";

const CharacterCreationView = ({ state, onCreateCharacter, notify, onBack }) => {
  const [form, setForm] = useState({
    firstName: "", lastName: "", age: "", sexe: "", race: "",
    power: "", story: "", physicalDescription: "", avatarUrl: "",
    countryId: state.countries?.[0]?.id || "", password: "", passwordConfirm: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const races = state.raceConfig?.races?.length ? state.raceConfig.races : DEFAULT_RACE_CONFIG.races;
  const countries = state.countries || [];

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      notify("Le nom et le prénom sont requis.", "error");
      return;
    }
    const age = parseInt(form.age, 10);
    if (!age || age < 1 || age > 900) {
      notify("Indique un âge valide.", "error");
      return;
    }
    if (!form.sexe) {
      notify("Choisis un sexe pour ton personnage.", "error");
      return;
    }
    if (!form.countryId) {
      notify("Choisis une nation de départ.", "error");
      return;
    }
    if (!form.password || form.password.length < 4) {
      notify("Le mot de passe doit faire au moins 4 caractères.", "error");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      notify("Les mots de passe ne correspondent pas.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await onCreateCharacter({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        age,
        sexe: form.sexe,
        race: form.race,
        power: form.power.trim(),
        story: form.story.trim(),
        physicalDescription: form.physicalDescription.trim(),
        avatarUrl: form.avatarUrl.trim(),
        countryId: form.countryId,
        password: form.password,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 font-sans relative overflow-hidden py-10 px-4">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 opacity-90"></div>

      <div className="relative z-10 w-full max-w-2xl bg-[#e6e2d6] rounded-2xl shadow-2xl overflow-hidden border-4 border-stone-800">
        <div className="bg-stone-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-stone-700 shadow-xl">
              <Wand2 className="text-yellow-500" size={30} />
            </div>
            <h1 className="text-xl font-black uppercase text-stone-100 tracking-[0.15em] font-serif leading-tight">
              《☆ — Personnage — ☆》
            </h1>
            <p className="text-[10px] text-stone-500 uppercase tracking-[0.25em] mt-2 font-bold">
              Fiche de création — Hors RP
            </p>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-600/20 blur-3xl rounded-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 bg-stone-950">
          <SectionDivider>◇ Identité</SectionDivider>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Prénom" icon={User}>
              <input className={inputClass} value={form.firstName} onChange={set("firstName")} placeholder="Prénom du personnage" autoFocus />
            </Field>
            <Field label="Nom" icon={User}>
              <input className={inputClass} value={form.lastName} onChange={set("lastName")} placeholder="Nom du personnage" />
            </Field>
            <Field label="Âge">
              <input type="number" min="1" max="900" className={inputClass} value={form.age} onChange={set("age")} placeholder="Ex : 24" />
            </Field>
            <Field label="Race / Espèce">
              <select className={inputClass} value={form.race} onChange={set("race")}>
                <option value="">-- Non défini --</option>
                {races.map((r) => (
                  <option key={r.id} value={r.name}>{r.icon ? `${r.icon} ` : ""}{r.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Pouvoir" icon={Sparkles}>
            <textarea
              className={`${inputClass} min-h-[70px] resize-none`}
              value={form.power}
              onChange={set("power")}
              placeholder="Décris la nature et les manifestations du pouvoir de ton personnage..."
            />
          </Field>

          <SectionDivider>♥ Sexe</SectionDivider>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SEXE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setForm((f) => ({ ...f, sexe: opt }))}
                className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                  form.sexe === opt
                    ? "bg-yellow-600/20 border-yellow-600 text-yellow-500"
                    : "bg-stone-800 border-stone-700 text-stone-400 hover:border-stone-600"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <SectionDivider>♧ Histoire</SectionDivider>
          <Field label="Histoire" icon={Scroll}>
            <textarea
              className={`${inputClass} min-h-[130px] resize-none`}
              value={form.story}
              onChange={set("story")}
              placeholder="Raconte le passé de ton personnage..."
            />
          </Field>

          <SectionDivider>Apparence</SectionDivider>
          <Field label="Description Physique" icon={Feather}>
            <textarea
              className={`${inputClass} min-h-[90px] resize-none`}
              value={form.physicalDescription}
              onChange={set("physicalDescription")}
              placeholder="Silhouette, traits, tenue habituelle..."
            />
          </Field>
          <Field label="Image du personnage (URL)" icon={ImageIcon}>
            <div className="flex items-center gap-3">
              {form.avatarUrl ? (
                <img
                  src={form.avatarUrl}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover border-2 border-stone-700 shrink-0"
                  style={{ width: 56, height: 56, minWidth: 56, minHeight: 56, objectFit: "cover" }}
                  onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                  onLoad={(e) => { e.currentTarget.style.visibility = "visible"; }}
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-stone-800 border-2 border-stone-700 flex items-center justify-center shrink-0" style={{ width: 56, height: 56, minWidth: 56, minHeight: 56 }}>
                  <ImageIcon size={18} className="text-stone-600" />
                </div>
              )}
              <input className={inputClass} value={form.avatarUrl} onChange={set("avatarUrl")} placeholder="https://..." />
            </div>
          </Field>

          <SectionDivider>Informations requises par le jeu</SectionDivider>
          <Field label="Nation de départ" icon={Globe2}>
            <select className={inputClass} value={form.countryId} onChange={set("countryId")}>
              <option value="">-- Choisir une nation --</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Mot de passe" icon={Key}>
              <input type="password" className={inputClass} value={form.password} onChange={set("password")} placeholder="••••••••" />
            </Field>
            <Field label="Confirmer le mot de passe" icon={Key}>
              <input type="password" className={inputClass} value={form.passwordConfirm} onChange={set("passwordConfirm")} placeholder="••••••••" />
            </Field>
          </div>
          <p className="text-[9px] text-stone-500 leading-relaxed">
            Tu pourras te reconnecter avec le nom complet de ton personnage (« Prénom Nom ») et ce mot de passe.
          </p>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white font-black uppercase text-[10px] tracking-widest rounded-xl border border-stone-700 transition-all"
            >
              <ArrowLeft size={14} /> Retour
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-stone-800 hover:bg-stone-700 text-yellow-500 font-black uppercase py-3.5 rounded-xl tracking-[0.15em] shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group border border-stone-700 hover:border-yellow-600/40"
            >
              {submitting ? "Création..." : <>Sceller mon personnage <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CharacterCreationView;
