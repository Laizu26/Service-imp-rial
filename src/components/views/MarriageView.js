import React, { useState } from "react";
import {
  Heart,
  HeartOff,
  User,
  Search,
  Coins,
  Shield,
  Baby,
  Trash2,
  UserPlus,
  Lock,
  X,
  Edit3,
  Gift,
  Target,
  BookHeart,
} from "lucide-react";
import {
  MARRIAGE_STRUCTURES,
  MARRIAGE_CONTRACT_TYPES,
  MARRIAGE_REGIMES,
  MARRIAGE_DOT_TYPES,
  MARRIAGE_DOMINANCE,
  MARRIAGE_INDISSOLUBLE_TYPES,
  FILIATION_TYPES,
  CHILD_RIGHTS_LIST,
} from "../../lib/constants";
import { getCitizenAge, formatRPDate, formatMoney } from "../../lib/gameUtils";

// Droits pouvant être restreints par le conjoint dominant — même principe que
// le contrat de servage utilisé pour les employés d'une entreprise.
const SPOUSE_RIGHTS_LIST = [
  { key: "travelLocked",     icon: "🚫", label: "Bloquer le voyage",             desc: "Empêche tout déplacement inter-pays" },
  { key: "mushtagramLocked", icon: "📵", label: "Bloquer Mushtagram",            desc: "Interdit l'accès au réseau social" },
  { key: "bankLocked",       icon: "🏦", label: "Bloquer le compte bancaire",    desc: "Interdit les opérations bancaires" },
  { key: "marketLocked",     icon: "🛒", label: "Bloquer le marché",             desc: "Interdit les échanges commerciaux (Bourse)" },
  { key: "creditLocked",     icon: "📄", label: "Bloquer les emprunts",          desc: "Interdit de signer un contrat de dette en tant que débiteur" },
  { key: "postLocked",       icon: "✉️", label: "Bloquer la Poste Impériale",    desc: "Interdit l'envoi et la réception de courrier" },
  { key: "maisonLocked",     icon: "💋", label: "Bloquer la Maison de Asia",     desc: "Interdit l'accès à la maison de plaisir" },
  { key: "workLocked",       icon: "⛔", label: "Interdiction de travailler",    desc: "Démission forcée de son emploi actuel et blocage de l'onglet Mon Entreprise" },
  { key: "workConditional",  icon: "🗝️", label: "Travail sous condition",       desc: "Bloque l'onglet Mon Entreprise et transfère la gestion de son entreprise à vous, dans votre propre onglet" },
];

// ── Modale de gestion des droits du conjoint dominé ─────────────────────────
function SpouseRightsModal({ spouse, spouseUser, onClose, onSetSpouseRights }) {
  const rights = spouse.spouseRights || {};
  const name = spouseUser?.name || spouse.name || "votre conjoint";
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-stone-100 bg-purple-50">
          <div className="w-10 h-10 rounded-full bg-purple-100 border-2 border-purple-200 flex items-center justify-center flex-shrink-0">
            <Lock size={16} className="text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-base text-stone-900 truncate">Droits de {name}</div>
            <div className="text-[10px] text-stone-500">En tant que conjoint(e) dominant(e), vous pouvez restreindre son accès.</div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 flex-shrink-0 p-1 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-2">
          {SPOUSE_RIGHTS_LIST.map(({ key, icon, label, desc }) => (
            <div key={key} className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
              <div>
                <div className="text-xs font-bold text-stone-700">{icon} {label}</div>
                <div className="text-[10px] text-stone-400">{desc}</div>
              </div>
              <button
                onClick={() => onSetSpouseRights({ spouseId: spouse.id, rights: { [key]: !rights[key] } })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-3 ${rights[key] ? "bg-red-500" : "bg-stone-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${rights[key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Modale de gestion des droits de tutelle sur un enfant ──────────────────
function ChildRightsModal({ child, onClose, onSetChildRights }) {
  const rights = child.guardianship?.rights || {};
  const name = child.name || "votre enfant";
  const [limitInput, setLimitInput] = useState(rights.bankLimit ? String(rights.bankLimit) : "");
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-stone-100 bg-amber-50">
          <div className="w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center flex-shrink-0">
            <Lock size={16} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-base text-stone-900 truncate">Tutelle sur {name}</div>
            <div className="text-[10px] text-stone-500">En tant que tuteur légal, vous pouvez restreindre son accès.</div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 flex-shrink-0 p-1 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-2">
          {CHILD_RIGHTS_LIST.map(({ key, icon, label, desc }) => (
            <div key={key} className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
              <div>
                <div className="text-xs font-bold text-stone-700">{icon} {label}</div>
                <div className="text-[10px] text-stone-400">{desc}</div>
              </div>
              <button
                onClick={() => onSetChildRights({ childId: child.id, rights: { [key]: !rights[key] } })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-3 ${rights[key] ? "bg-red-500" : "bg-stone-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${rights[key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
          <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 space-y-2">
            <div>
              <div className="text-xs font-bold text-stone-700">💰 Plafond de virement</div>
              <div className="text-[10px] text-stone-400">Montant maximum que {name} peut virer par jour à un même bénéficiaire, même en plusieurs virements (les dépôts et réceptions restent libres)</div>
            </div>
            <div className="flex gap-2">
              <input type="number" min="0" value={limitInput} onChange={(e) => setLimitInput(e.target.value)}
                placeholder="Aucun plafond"
                className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-300" />
              <button
                onClick={() => onSetChildRights({ childId: child.id, rights: { bankLimit: parseFloat(limitInput) || null } })}
                className="px-3 py-1.5 bg-amber-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-amber-500 shrink-0"
              >
                Définir
              </button>
              {rights.bankLimit ? (
                <button
                  onClick={() => { setLimitInput(""); onSetChildRights({ childId: child.id, rights: { bankLimit: null } }); }}
                  className="px-3 py-1.5 bg-white border border-stone-200 text-stone-400 text-[10px] font-black uppercase rounded-lg hover:text-red-500 shrink-0"
                >
                  Retirer
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modale d'édition d'un enfant NPC (nom + date de naissance) ─────────────
function EditChildModal({ child, gameDate, onClose, onSave }) {
  const [name, setName] = useState(child.name || "");
  const [day, setDay] = useState(child.birthDate?.day || "");
  const [month, setMonth] = useState(child.birthDate?.month || "");
  const [year, setYear] = useState(child.birthDate?.year || "");
  const gd = gameDate || { day: 1, month: 1, year: 1200 };

  const save = () => {
    const birthDate = (day && month && year)
      ? { day: parseInt(day) || 1, month: parseInt(month) || 1, year: parseInt(year) }
      : null;
    onSave({ name: name.trim(), birthDate });
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-stone-100 bg-amber-50">
          <div className="w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center flex-shrink-0">
            <Baby size={16} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-base text-stone-900 truncate">Modifier {child.name}</div>
            <div className="text-[10px] text-stone-500">Modifiable tant que l'enfant reste un personnage (NPC).</div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 flex-shrink-0 p-1 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-1">Nom de l'enfant</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border-2 border-amber-200 rounded-xl bg-white outline-none font-bold focus:border-amber-400 text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-1">Date de naissance</label>
            <div className="flex gap-2">
              <input type="number" min={1} max={30} placeholder="Jour"
                className="w-1/4 p-2.5 border-2 border-amber-200 rounded-xl bg-white outline-none font-bold text-sm text-center focus:border-amber-400"
                value={day} onChange={(e) => setDay(e.target.value)} />
              <input type="number" min={1} max={12} placeholder="Mois"
                className="w-1/4 p-2.5 border-2 border-amber-200 rounded-xl bg-white outline-none font-bold text-sm text-center focus:border-amber-400"
                value={month} onChange={(e) => setMonth(e.target.value)} />
              <input type="number" min={800} max={1500} placeholder="Année"
                className="flex-1 p-2.5 border-2 border-amber-200 rounded-xl bg-white outline-none font-bold text-sm text-center focus:border-amber-400"
                value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            {day && month && year && (
              <p className="text-[9px] text-amber-700 italic mt-1">Âge actuel : {Math.max(0, gd.year - parseInt(year))} ans environ</p>
            )}
          </div>
          <button onClick={save} disabled={!name.trim()}
            className="w-full py-2.5 bg-amber-600 text-white text-xs font-black uppercase rounded-xl hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modale de mariage arrangé au nom d'un enfant sous tutelle active ────────
function GuardianMarriageModal({ child, safeUsers, onClose, onPropose }) {
  const [search, setSearch] = useState("");
  const [targetId, setTargetId] = useState("");
  const [contractType, setContractType] = useState("sacre");
  const [regime, setRegime] = useState("separation");
  const [dotType, setDotType] = useState("aucune");
  const [dot, setDot] = useState(0);
  const [dominance, setDominance] = useState("egal");

  const target = safeUsers.find((u) => u.id === targetId);
  const results = search.trim()
    ? safeUsers.filter((u) => u.id !== child.id && u.name?.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : [];

  const submit = () => {
    if (!targetId) return;
    onPropose(child.id, targetId, { contractType, regime, dotType, dot: parseFloat(dot) || 0, dominance });
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-stone-100 bg-rose-50 shrink-0">
          <div className="w-10 h-10 rounded-full bg-rose-100 border-2 border-rose-200 flex items-center justify-center flex-shrink-0">
            <Heart size={16} className="text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-base text-stone-900 truncate">Arranger un mariage — {child.name}</div>
            <div className="text-[10px] text-stone-500">En tant que tuteur, vous proposez cette union en son nom.</div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 flex-shrink-0 p-1 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">Le prétendant(e)</label>
            {target ? (
              <div className="flex items-center justify-between gap-2 p-2.5 bg-rose-50 border-2 border-rose-300 rounded-xl">
                <span className="text-sm font-bold text-stone-800">{target.name}</span>
                <button onClick={() => { setTargetId(""); setSearch(""); }} className="text-stone-400 hover:text-stone-600"><X size={14} /></button>
              </div>
            ) : (
              <>
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un citoyen…"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-rose-300" />
                {results.length > 0 && (
                  <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 mt-1">
                    {results.map((u) => (
                      <button key={u.id} onClick={() => { setTargetId(u.id); setSearch(""); }}
                        className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-rose-50 transition-colors">
                        {u.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">Type d'union</label>
            <div className="grid grid-cols-2 gap-1.5">
              {MARRIAGE_CONTRACT_TYPES.map((ct) => (
                <button key={ct.id} onClick={() => setContractType(ct.id)}
                  className={`p-2 rounded-lg border text-left text-xs transition-all ${contractType === ct.id ? "border-rose-500 bg-rose-50 font-bold text-rose-700" : "border-stone-200 text-stone-600 hover:border-rose-300"}`}>
                  {ct.emoji} {ct.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">Régime</label>
            <div className="grid grid-cols-1 gap-1.5">
              {MARRIAGE_REGIMES.map((r) => (
                <button key={r.id} onClick={() => setRegime(r.id)}
                  className={`p-2 rounded-lg border text-left text-xs transition-all ${regime === r.id ? "border-rose-500 bg-rose-50 font-bold text-rose-700" : "border-stone-200 text-stone-600 hover:border-rose-300"}`}>
                  {r.emoji} {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">Domination</label>
            <div className="grid grid-cols-1 gap-1.5">
              {MARRIAGE_DOMINANCE.filter((d) => ["egal", "proposant_dominant", "cible_dominante"].includes(d.id)).map((d) => (
                <button key={d.id} onClick={() => setDominance(d.id)}
                  className={`p-2 rounded-lg border text-left text-xs transition-all ${dominance === d.id ? "border-purple-500 bg-purple-50 font-bold text-purple-700" : "border-stone-200 text-stone-600 hover:border-purple-300"}`}>
                  {d.emoji} {d.id === "proposant_dominant" ? `${child.name}, dominant(e)` : d.id === "cible_dominante" ? "Partenaire, dominant(e)" : d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">Dot</label>
            <div className="grid grid-cols-1 gap-1.5">
              {MARRIAGE_DOT_TYPES.map((d) => (
                <button key={d.id} onClick={() => setDotType(d.id)}
                  className={`p-2 rounded-lg border text-left text-xs transition-all ${dotType === d.id ? "border-amber-500 bg-amber-50 font-bold text-amber-700" : "border-stone-200 text-stone-600 hover:border-amber-300"}`}>
                  {d.emoji} {d.label}
                </button>
              ))}
            </div>
            {dotType !== "aucune" && (
              <input type="number" min="0" value={dot} onChange={(e) => setDot(e.target.value)}
                placeholder="Montant de la dot"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-300 mt-1.5" />
            )}
          </div>

          <button onClick={submit} disabled={!targetId}
            className="w-full py-2.5 bg-rose-600 text-white text-xs font-black uppercase rounded-xl hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Envoyer la proposition
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modale de réquisition du trésor personnel du conjoint dominé ───────────
function RequisitionModal({ spouse, spouseUser, onClose, onRequisition }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const name = spouseUser?.name || spouse.name || "votre conjoint";
  const spouseBalance = spouseUser?.balance || 0;
  const history = spouse.requisitionHistory || [];
  const amt = parseFloat(amount);
  const canSubmit = amt > 0 && amt <= spouseBalance;

  const submit = () => {
    if (!canSubmit) return;
    // Grosse ponction : confirmation explicite, même logique que pour les autres
    // actions irréversibles du site (divorce, suppression de filiation…).
    const pct = spouseBalance > 0 ? amt / spouseBalance : 0;
    if (pct >= 0.5) {
      const ok = window.confirm(
        `Vous êtes sur le point de réquisitionner ${formatMoney(amt)} — soit ${Math.round(pct * 100)}% du trésor de ${name}. Confirmer ?`
      );
      if (!ok) return;
    }
    onRequisition({ spouseId: spouse.id, amount: amt, reason: reason.trim() });
    setAmount(""); setReason("");
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-stone-100 bg-amber-50">
          <div className="w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center flex-shrink-0">
            <Coins size={16} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-base text-stone-900 truncate">Réquisitionner — {name}</div>
            <div className="text-[10px] text-stone-500">Prélever directement sur son trésor personnel.</div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 flex-shrink-0 p-1 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Trésor de {name}</span>
            <span className="text-sm font-black text-stone-800">{formatMoney(spouseBalance)}</span>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-1">Montant</label>
            <input
              type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-amber-300/30 focus:bg-white"
            />
            <div className="flex gap-1.5 mt-1.5">
              {[0.25, 0.5, 1].map((frac) => (
                <button
                  key={frac}
                  onClick={() => setAmount(String(Math.floor(spouseBalance * frac)))}
                  disabled={spouseBalance <= 0}
                  className="flex-1 py-1 bg-white border border-stone-200 text-stone-500 text-[9px] font-black uppercase rounded-lg hover:border-amber-300 hover:text-amber-600 disabled:opacity-40 transition-colors"
                >
                  {frac === 1 ? "Tout" : `${frac * 100}%`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-1">Raison (optionnel)</label>
            <input
              value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="ex : dîme du foyer…"
              maxLength={120}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-amber-300/30 focus:bg-white"
            />
          </div>

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full py-2.5 bg-amber-600 text-white text-xs font-black uppercase rounded-xl hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Réquisitionner {amt > 0 ? formatMoney(amt) : ""}
          </button>
          {amt > spouseBalance && (
            <p className="text-[10px] text-red-500 font-bold text-center">Votre conjoint ne possède pas cette somme.</p>
          )}

          {history.length > 0 && (
            <div className="pt-2 border-t border-stone-100 space-y-1.5">
              <div className="text-[9px] font-black uppercase tracking-widest text-stone-400">Réquisitions récentes</div>
              {history.slice(0, 5).map((h) => (
                <div key={h.id} className="flex items-center justify-between text-[10px] text-stone-500">
                  <span className="truncate flex-1">{h.reason || "Sans raison précisée"}</span>
                  <span className="font-bold text-stone-700 shrink-0 ml-2">{formatMoney(h.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modale "Offrir un cadeau" — argent ou objet d'inventaire, avec petit mot ──
function GiftModal({ spouse, spouseUser, user, inventoryCatalog, gifts, onClose, onSend }) {
  const [kind, setKind] = useState("money");
  const [amount, setAmount] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");
  const name = spouseUser?.name || spouse.name || "votre conjoint";

  const myItems = (user?.inventory || [])
    .map((slot) => ({ ...slot, def: (inventoryCatalog || []).find((i) => i.id === slot.itemId) }))
    .filter((s) => s.def && s.quantity > 0);

  const amt = parseFloat(amount);
  const canSendMoney = kind === "money" && amt > 0 && amt <= (user?.balance || 0);
  const qty = parseInt(quantity) || 1;
  const selectedItem = myItems.find((i) => i.itemId === itemId);
  const canSendItem = kind === "item" && !!selectedItem && qty > 0 && qty <= selectedItem.quantity;
  const canSubmit = canSendMoney || canSendItem;

  const submit = () => {
    if (!canSubmit) return;
    if (kind === "money") onSend({ type: "money", amount: amt, message: message.trim() });
    else onSend({ type: "item", itemId, quantity: qty, message: message.trim() });
    setAmount(""); setItemId(""); setQuantity("1"); setMessage("");
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-stone-100 bg-rose-50">
          <div className="w-10 h-10 rounded-full bg-rose-100 border-2 border-rose-200 flex items-center justify-center flex-shrink-0">
            <Gift size={16} className="text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-base text-stone-900 truncate">Offrir un cadeau — {name}</div>
            <div className="text-[10px] text-stone-500">Une attention pour votre conjoint(e).</div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 flex-shrink-0 p-1 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex gap-1.5 bg-stone-100 rounded-xl p-1">
            <button onClick={() => setKind("money")} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${kind === "money" ? "bg-white text-rose-600 shadow-sm" : "text-stone-400"}`}>Argent</button>
            <button onClick={() => setKind("item")} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${kind === "item" ? "bg-white text-rose-600 shadow-sm" : "text-stone-400"}`}>Objet</button>
          </div>

          {kind === "money" ? (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-1">Montant</label>
              <input
                type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-rose-300/30 focus:bg-white"
              />
              <div className="text-[10px] text-stone-400 mt-1">Votre trésor : {formatMoney(user?.balance || 0)}</div>
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-1">Objet</label>
              {myItems.length === 0 ? (
                <p className="text-xs text-stone-400 italic">Votre inventaire est vide.</p>
              ) : (
                <>
                  <select
                    value={itemId} onChange={(e) => setItemId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 outline-none focus:ring-2 focus:ring-rose-300/30 focus:bg-white"
                  >
                    <option value="">-- Choisir un objet --</option>
                    {myItems.map((i) => (
                      <option key={i.itemId} value={i.itemId}>{i.def.name} (x{i.quantity})</option>
                    ))}
                  </select>
                  {selectedItem && (
                    <input
                      type="number" min="1" max={selectedItem.quantity} value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 outline-none focus:ring-2 focus:ring-rose-300/30 focus:bg-white"
                    />
                  )}
                </>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-1">Petit mot (optionnel)</label>
            <textarea
              value={message} onChange={(e) => setMessage(e.target.value)}
              rows={2} maxLength={300}
              placeholder="Pour toi, mon amour..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-rose-300/30 focus:bg-white resize-none"
            />
          </div>

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full py-2.5 bg-rose-600 text-white text-xs font-black uppercase rounded-xl hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Envoyer le cadeau
          </button>

          {(gifts || []).length > 0 && (
            <div className="pt-2 border-t border-stone-100 space-y-1.5 max-h-40 overflow-y-auto">
              <div className="text-[9px] font-black uppercase tracking-widest text-stone-400">Cadeaux échangés</div>
              {gifts.slice(0, 10).map((g) => (
                <div key={g.id} className="text-[10px] text-stone-500">
                  <span className="font-bold text-stone-700">{String(g.fromId) === String(user?.id) ? "Vous" : g.fromName}</span>
                  {" → "}
                  {g.type === "money" ? formatMoney(g.amount) : `${g.quantity}x ${g.itemName}`}
                  {g.message && <span className="italic text-stone-400"> — "{g.message}"</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modale "Projet commun" — cagnotte à deux avec contributions ─────────────
function GoalModal({ spouse, spouseUser, user, goal, onClose, onSetGoal, onContribute, onWithdraw, onCancel }) {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [contribAmount, setContribAmount] = useState("");
  const name = spouseUser?.name || spouse.name || "votre conjoint";

  const canCreate = title.trim() && parseFloat(targetAmount) > 0;
  const contribAmt = parseFloat(contribAmount);
  const canContribute = contribAmt > 0 && contribAmt <= (user?.balance || 0);
  const progressPct = goal ? Math.min(100, Math.round(((goal.currentAmount || 0) / goal.targetAmount) * 100)) : 0;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-stone-100 bg-emerald-50">
          <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center flex-shrink-0">
            <Target size={16} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-base text-stone-900 truncate">Projet commun — {name}</div>
            <div className="text-[10px] text-stone-500">Une cagnotte à deux pour un objectif partagé.</div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 flex-shrink-0 p-1 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {!goal ? (
            <>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-1">Titre du projet</label>
                <input
                  value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
                  placeholder="ex : notre première maison..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-emerald-300/30 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-1">Objectif</label>
                <input
                  type="number" min="0" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-emerald-300/30 focus:bg-white"
                />
              </div>
              <button
                onClick={() => { if (canCreate) { onSetGoal({ title: title.trim(), targetAmount: parseFloat(targetAmount) }); setTitle(""); setTargetAmount(""); } }}
                disabled={!canCreate}
                className="w-full py-2.5 bg-emerald-600 text-white text-xs font-black uppercase rounded-xl hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Lancer le projet
              </button>
            </>
          ) : (
            <>
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
                <div className="font-bold text-sm text-stone-800">{goal.title}</div>
                <div className="w-full h-2.5 bg-stone-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-stone-500 mt-1">
                  <span className="font-bold text-emerald-700">{formatMoney(goal.currentAmount || 0)}</span>
                  <span>/ {formatMoney(goal.targetAmount)}</span>
                </div>
              </div>

              {goal.completedAt ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center space-y-2">
                  <p className="text-xs font-bold text-emerald-700">🎉 Objectif atteint !</p>
                  <button onClick={onWithdraw} className="w-full py-2 bg-emerald-600 text-white text-xs font-black uppercase rounded-xl hover:bg-emerald-500 transition-colors">
                    Retirer {formatMoney(goal.currentAmount)}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number" min="0" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)}
                    placeholder="Contribuer..."
                    className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-emerald-300/30 focus:bg-white"
                  />
                  <button
                    onClick={() => { if (canContribute) { onContribute(contribAmt); setContribAmount(""); } }}
                    disabled={!canContribute}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-black uppercase rounded-xl hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Verser
                  </button>
                </div>
              )}

              {(goal.currentAmount || 0) > 0 && !goal.completedAt && (
                <button onClick={onWithdraw} className="w-full py-1.5 text-emerald-600 text-[10px] font-bold uppercase hover:text-emerald-700 transition-colors">
                  Retirer la cagnotte ({formatMoney(goal.currentAmount)})
                </button>
              )}

              {(goal.contributions || []).length > 0 && (
                <div className="pt-2 border-t border-stone-100 space-y-1.5 max-h-32 overflow-y-auto">
                  <div className="text-[9px] font-black uppercase tracking-widest text-stone-400">Contributions récentes</div>
                  {goal.contributions.slice(0, 8).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] text-stone-500">
                      <span>{c.citizenName}</span>
                      <span className="font-bold text-stone-700">{formatMoney(c.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {(goal.currentAmount || 0) === 0 && (
                <button onClick={onCancel} className="w-full py-1.5 text-red-400 text-[10px] font-bold uppercase hover:text-red-600 transition-colors">
                  Annuler le projet
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modale "Journal partagé" — souvenirs à deux ─────────────────────────────
function JournalModal({ spouse, spouseUser, user, entries, onClose, onAdd, onDelete }) {
  const [text, setText] = useState("");
  const name = spouseUser?.name || spouse.name || "votre conjoint";

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-stone-100 bg-sky-50">
          <div className="w-10 h-10 rounded-full bg-sky-100 border-2 border-sky-200 flex items-center justify-center flex-shrink-0">
            <BookHeart size={16} className="text-sky-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-base text-stone-900 truncate">Journal partagé — {name}</div>
            <div className="text-[10px] text-stone-500">Vos souvenirs à deux, visibles par vous deux.</div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 flex-shrink-0 p-1 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex gap-2">
            <textarea
              value={text} onChange={(e) => setText(e.target.value)}
              rows={2} maxLength={500}
              placeholder="Un moment à graver..."
              className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-sky-300/30 focus:bg-white resize-none"
            />
          </div>
          <button
            onClick={() => { if (text.trim()) { onAdd(text.trim()); setText(""); } }}
            disabled={!text.trim()}
            className="w-full py-2 bg-sky-600 text-white text-xs font-black uppercase rounded-xl hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Ajouter au journal
          </button>

          <div className="pt-2 border-t border-stone-100 space-y-2 max-h-72 overflow-y-auto">
            {(entries || []).length === 0 && (
              <p className="text-xs text-stone-400 italic text-center py-4">Aucun souvenir consigné pour l'instant.</p>
            )}
            {(entries || []).map((e) => (
              <div key={e.id} className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-stone-600">{e.authorName}</span>
                  {String(e.authorId) === String(user?.id) && (
                    <button onClick={() => onDelete(e.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-stone-700 mt-0.5 whitespace-pre-wrap">{e.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Panneau complet du trésor commun / fief conjoint ────────────────────────
// Historique des mouvements, contributions par conjoint, montants rapides et
// raison optionnelle — plus qu'un simple champ + deux boutons.
function SharedAccountPanel({ pairKey, account, resolvedDominance, resolvedDominantId, userId, userName, spouseName, onDeposit, onWithdraw }) {
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [mode, setMode] = React.useState("deposit"); // "deposit" | "withdraw"
  const [showAllHistory, setShowAllHistory] = React.useState(false);

  const isFief = account?.type === "fief";
  const balance = account?.balance || 0;
  // La domination affichée provient en priorité de l'entrée spouses[] du citoyen
  // (source de vérité, toujours à jour), et non des champs dominance/fiefDominantId
  // du compte lui-même qui peuvent rester figés après une renégociation.
  const dominance = resolvedDominance !== undefined ? resolvedDominance : account?.dominance;
  const dominantId = resolvedDominantId !== undefined ? resolvedDominantId : account?.fiefDominantId;
  const canWithdraw = !isFief || dominance === "egal" || String(dominantId) === String(userId);
  const transactions = account?.transactions;

  const contributions = React.useMemo(() => {
    const byId = {};
    (transactions || []).forEach((tx) => {
      if (tx.type !== "deposit") return;
      byId[tx.citizenId] = (byId[tx.citizenId] || 0) + tx.amount;
    });
    return byId;
  }, [transactions]);
  const safeTransactions = transactions || [];
  const myContribution = contributions[userId] || 0;
  const totalContributed = Object.values(contributions).reduce((s, v) => s + v, 0);
  const myShare = totalContributed > 0 ? Math.round((myContribution / totalContributed) * 100) : 0;

  const QUICK_AMOUNTS = [10, 50, 100, 500];
  const numAmount = parseFloat(amount) || 0;

  const submit = () => {
    if (numAmount <= 0) return;
    if (mode === "deposit") onDeposit(pairKey, numAmount, reason.trim());
    else onWithdraw(pairKey, numAmount, reason.trim());
    setAmount(""); setReason("");
  };

  const visibleTx = showAllHistory ? safeTransactions : safeTransactions.slice(0, 5);

  return (
    <div className="space-y-3">
      {/* Contributions respectives */}
      {totalContributed > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-500">
            <span>Contributions</span>
            <span>{formatMoney(totalContributed)} versés au total</span>
          </div>
          <div className="h-2 rounded-full bg-stone-200 overflow-hidden flex">
            <div className="h-full bg-yellow-500" style={{ width: `${myShare}%` }} title={`Vous : ${myShare}%`} />
            <div className="h-full bg-amber-800" style={{ width: `${100 - myShare}%` }} title={`${spouseName} : ${100 - myShare}%`} />
          </div>
          <div className="flex items-center justify-between text-[9px] text-stone-500">
            <span>Vous : {formatMoney(myContribution)} ({myShare}%)</span>
            <span>{spouseName} : {formatMoney(totalContributed - myContribution)} ({100 - myShare}%)</span>
          </div>
        </div>
      )}

      {/* Mode dépôt / retrait */}
      <div className="flex gap-1 bg-white rounded-lg p-1 border border-stone-200">
        <button onClick={() => setMode("deposit")}
          className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${mode === "deposit" ? "bg-yellow-500 text-white" : "text-stone-500 hover:bg-stone-50"}`}>
          Déposer
        </button>
        <button onClick={() => setMode("withdraw")} disabled={!canWithdraw}
          className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed ${mode === "withdraw" ? "bg-stone-700 text-white" : "text-stone-500 hover:bg-stone-50"}`}>
          Retirer
        </button>
      </div>

      {mode === "withdraw" && !canWithdraw ? (
        <p className="text-[9px] text-amber-700 italic bg-amber-100 border border-amber-200 rounded-lg px-3 py-2">
          Seul l'époux dominant peut retirer du Fief Conjoint.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {QUICK_AMOUNTS.map((v) => (
              <button key={v} onClick={() => setAmount(String(v))}
                className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-[9px] font-bold text-stone-600 hover:border-yellow-400 hover:text-yellow-700 transition-colors">
                {v}
              </button>
            ))}
            {mode === "withdraw" && balance > 0 && (
              <button onClick={() => setAmount(String(balance))}
                className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-[9px] font-bold text-stone-600 hover:border-yellow-400 hover:text-yellow-700 transition-colors">
                Tout ({formatMoney(balance)})
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number" step="0.1" min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-24 p-2 border border-stone-200 rounded-lg text-xs font-bold bg-white outline-none focus:border-yellow-400"
              placeholder="Écus"
            />
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 120))}
              className="flex-1 min-w-[120px] p-2 border border-stone-200 rounded-lg text-xs bg-white outline-none focus:border-yellow-400"
              placeholder="Raison (optionnel)…"
            />
            <button
              onClick={submit}
              disabled={numAmount <= 0}
              className={`px-4 py-2 text-white text-[10px] font-black uppercase rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${mode === "deposit" ? "bg-yellow-600 hover:bg-yellow-500" : "bg-stone-700 hover:bg-stone-600"}`}
            >
              {mode === "deposit" ? "Déposer" : "Retirer"}
            </button>
          </div>
        </div>
      )}

      {/* Historique */}
      {safeTransactions.length > 0 && (
        <div className="pt-2 border-t border-stone-200 space-y-1">
          <div className="text-[9px] font-black uppercase tracking-widest text-stone-400">Historique récent</div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {visibleTx.map((tx) => {
              const isMine = String(tx.citizenId) === String(userId);
              const isDeposit = tx.type === "deposit";
              return (
                <div key={tx.id} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 text-[10px]">
                  <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isDeposit ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                    {isDeposit ? "↓" : "↑"}
                  </span>
                  <span className="flex-1 min-w-0 truncate">
                    <span className="font-bold text-stone-700">{isMine ? "Vous" : (tx.citizenName || spouseName)}</span>
                    <span className="text-stone-400"> {isDeposit ? "a déposé" : "a retiré"} </span>
                    <span className={`font-bold ${isDeposit ? "text-green-600" : "text-red-500"}`}>{formatMoney(tx.amount)}</span>
                    {tx.reason && <span className="text-stone-400 italic"> — {tx.reason}</span>}
                  </span>
                  <span className="text-stone-300 text-[9px] shrink-0">{new Date(tx.timestamp).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</span>
                </div>
              );
            })}
          </div>
          {safeTransactions.length > 5 && (
            <button onClick={() => setShowAllHistory((v) => !v)} className="text-[9px] font-bold text-yellow-700 hover:text-yellow-800">
              {showAllHistory ? "Réduire" : `Voir tout l'historique (${safeTransactions.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Modale de définition d'un parent : citoyen existant ou NPC ─────────────
function EditParentModal({ type, userId, currentId, currentName, safeUsers, onClose, onSave }) {
  const [mode, setMode] = useState(currentId ? "citizen" : "npc");
  const [search, setSearch] = useState("");
  const [citizenId, setCitizenId] = useState(currentId || "");
  const [citizenName, setCitizenName] = useState(currentId ? (currentName || "") : "");
  const [npcName, setNpcName] = useState(!currentId ? (currentName || "") : "");

  const label = type === "father" ? "Père" : "Mère";
  const results = search.trim()
    ? safeUsers.filter((u) => u.id !== userId && u.name?.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  const save = () => {
    if (mode === "citizen") {
      if (!citizenId) return;
      onSave({ id: citizenId, name: citizenName });
    } else {
      if (!npcName.trim()) return;
      onSave({ id: null, name: npcName.trim() });
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-stone-100 bg-stone-50">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${type === "father" ? "bg-blue-100 border-2 border-blue-200" : "bg-pink-100 border-2 border-pink-200"}`}>
            <User size={16} className={type === "father" ? "text-blue-500" : "text-pink-500"} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-base text-stone-900 truncate">Définir — {label}</div>
            <div className="text-[10px] text-stone-500">Un citoyen existant, ou un personnage (NPC).</div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 flex-shrink-0 p-1 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("citizen")}
              className={`flex-1 py-2 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${mode === "citizen" ? "border-stone-500 bg-stone-50 text-stone-700" : "border-stone-200 text-stone-500 hover:border-stone-300"}`}
            >
              Citoyen existant
            </button>
            <button
              onClick={() => setMode("npc")}
              className={`flex-1 py-2 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${mode === "npc" ? "border-stone-500 bg-stone-50 text-stone-700" : "border-stone-200 text-stone-500 hover:border-stone-300"}`}
            >
              Personnage (NPC)
            </button>
          </div>

          {mode === "citizen" ? (
            <div className="space-y-1">
              {citizenId ? (
                <div className="flex items-center gap-3 p-3 bg-stone-50 border-2 border-stone-200 rounded-xl">
                  <User size={14} className="text-stone-400 shrink-0" />
                  <span className="flex-1 font-bold text-stone-700 text-sm">{citizenName}</span>
                  <button onClick={() => { setCitizenId(""); setCitizenName(""); setSearch(""); }} className="text-stone-400 hover:text-red-500">✕</button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-2 border-2 border-stone-200 rounded-xl bg-white px-3 focus-within:border-stone-400">
                    <Search size={14} className="text-stone-300 shrink-0" />
                    <input
                      className="flex-1 p-2.5 outline-none text-sm font-bold bg-transparent"
                      placeholder="Nom du citoyen…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  {search && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto border border-stone-200 rounded-xl bg-white shadow-xl p-2 space-y-1">
                      {results.map((u) => (
                        <button key={u.id} onClick={() => { setCitizenId(u.id); setCitizenName(u.name); setSearch(""); }}
                          className="w-full text-left p-2 rounded-lg hover:bg-stone-50 flex items-center gap-2 transition-colors">
                          <span className="font-bold text-sm text-stone-800 truncate">{u.name}</span>
                        </button>
                      ))}
                      {results.length === 0 && (
                        <div className="text-xs text-stone-400 italic text-center py-2">Aucun citoyen trouvé.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <input
              className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none font-bold focus:border-stone-400 text-sm"
              placeholder="Nom du personnage…"
              value={npcName}
              onChange={(e) => setNpcName(e.target.value)}
            />
          )}

          <button onClick={save} disabled={mode === "citizen" ? !citizenId : !npcName.trim()}
            className="w-full py-2.5 bg-stone-800 text-white text-xs font-black uppercase rounded-xl hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modale de proposition d'adoption (recherche d'un citoyen, consentement requis) ──
function ProposeAdoptionModal({ userId, safeUsers, existingIds, onClose, onSave }) {
  const [search, setSearch] = useState("");
  const results = search.trim()
    ? safeUsers.filter((u) => u.id !== userId && !existingIds.has(u.id) && u.status !== "Décédé" && u.name?.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-stone-100 bg-stone-50">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100 border-2 border-amber-200">
            <Baby size={16} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-base text-stone-900 truncate">Proposer une adoption</div>
            <div className="text-[10px] text-stone-500">La personne devra accepter votre demande.</div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 flex-shrink-0 p-1 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="relative">
            <div className="flex items-center gap-2 border-2 border-stone-200 rounded-xl bg-white px-3 focus-within:border-stone-400">
              <Search size={14} className="text-stone-300 shrink-0" />
              <input
                className="flex-1 p-2.5 outline-none text-sm font-bold bg-transparent"
                placeholder="Nom du citoyen à adopter…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            {search && (
              <div className="relative z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto border border-stone-200 rounded-xl bg-white shadow-xl p-2 space-y-1">
                {results.map((u) => (
                  <button key={u.id} onClick={() => { onSave(u.id); onClose(); }}
                    className="w-full text-left p-2 rounded-lg hover:bg-stone-50 flex items-center gap-2 transition-colors">
                    <span className="font-bold text-sm text-stone-800 truncate">{u.name}</span>
                  </button>
                ))}
                {results.length === 0 && (
                  <div className="text-xs text-stone-400 italic text-center py-2">Aucun citoyen trouvé.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section Parents & Fratrie ──────────────────────────────────────────────
function ParentsSection({ user, safeUsers, onSetParents, onProposeAdoption, onAcceptParentRequest, onRejectParentRequest }) {
  const [editingParentType, setEditingParentType] = useState(null); // "father" | "mother" | null
  const [proposingAdoption, setProposingAdoption] = useState(false);
  const father = user.fatherId ? safeUsers.find((c) => c.id === user.fatherId) : null;
  const mother = user.motherId ? safeUsers.find((c) => c.id === user.motherId) : null;
  const adoptiveParents = user.adoptiveParents || [];
  const parentRequests = user.parentRequests || [];

  // Grands-parents — remonte un cran de plus via fatherId/motherId, déjà disponibles sur les
  // citoyens résolus comme père/mère.
  const grandparents = [
    father?.fatherId ? { ...safeUsers.find((c) => c.id === father.fatherId), via: "Père de " + father.name } : null,
    father?.motherId ? { ...safeUsers.find((c) => c.id === father.motherId), via: "Mère de " + father.name } : null,
    mother?.fatherId ? { ...safeUsers.find((c) => c.id === mother.fatherId), via: "Père de " + mother.name } : null,
    mother?.motherId ? { ...safeUsers.find((c) => c.id === mother.motherId), via: "Mère de " + mother.name } : null,
  ].filter((g) => g && g.id);

  // Trouver les frères et sœurs (même père ou même mère)
  const siblings = safeUsers.filter((c) => {
    if (c.id === user.id) return false;
    if (user.fatherId && c.fatherId && c.fatherId === user.fatherId) return true;
    if (user.motherId && c.motherId && c.motherId === user.motherId) return true;
    return false;
  });

  const hasParents = user.fatherId || user.motherId;

  const ParentCard = ({ label, parent, parentName, type }) => (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-stone-200 p-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${type === "father" ? "bg-blue-100 border-2 border-blue-200" : "bg-pink-100 border-2 border-pink-200"}`} style={{ width: 40, height: 40, minWidth: 40, minHeight: 40 }}>
        <User size={18} className={type === "father" ? "text-blue-500" : "text-pink-500"} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest">{label}</div>
        {parent ? (
          <div className="font-bold text-stone-800 text-sm truncate">{parent.name}</div>
        ) : parentName ? (
          <div className="font-bold text-stone-600 text-sm truncate italic">{parentName}</div>
        ) : (
          <div className="text-xs text-stone-400 italic">Non défini</div>
        )}
      </div>
      {onSetParents && (
        <button
          onClick={() => setEditingParentType(type)}
          className="text-stone-400 hover:text-stone-700 p-1 rounded shrink-0"
          title={`Définir — ${label}`}
        >
          <Edit3 size={13} />
        </button>
      )}
    </div>
  );

  return (
    <div className="border-t-4 border-stone-200 bg-stone-50/40 p-5 space-y-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-2">
        <User size={13} /> Filiation — Mes Parents
      </div>

      {/* Affichage des parents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ParentCard label="Père" parent={father} parentName={user.fatherName} type="father" />
        <ParentCard label="Mère" parent={mother} parentName={user.motherName} type="mother" />
      </div>

      {/* Grands-parents */}
      {grandparents.length > 0 && (
        <div className="space-y-2">
          <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
            Grands-Parents ({grandparents.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {grandparents.map((g) => (
              <div key={g.id} className="flex items-center gap-2 bg-white rounded-lg border border-stone-100 px-3 py-2">
                <div className="w-7 h-7 bg-stone-200 rounded-full flex items-center justify-center text-xs font-bold text-stone-500 shrink-0" style={{ width: 28, height: 28, minWidth: 28, minHeight: 28 }}>
                  {(g.name || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-stone-700 text-xs truncate">{g.name}</div>
                  <div className="text-[8px] text-stone-400 italic">{g.via}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demandes de filiation/adoption reçues — nécessitent mon accord */}
      {parentRequests.length > 0 && (
        <div className="space-y-2">
          <div className="text-[9px] font-black uppercase text-amber-600 tracking-widest">
            Demandes en attente de votre accord
          </div>
          {parentRequests.map((req) => (
            <div key={`${req.fromId}_${req.kind}`} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex-1 min-w-0 text-xs">
                <span className="font-bold text-stone-800">{req.fromName}</span>{" "}
                <span className="text-stone-500">
                  {req.kind === "adoptive" ? "souhaite vous adopter" : `se déclare votre ${req.kind === "father" ? "père" : "mère"}`}
                </span>
              </div>
              <button
                onClick={() => onAcceptParentRequest && onAcceptParentRequest(req.fromId)}
                className="px-3 py-1.5 bg-stone-800 text-white text-[10px] font-black uppercase rounded-lg hover:bg-stone-700 shrink-0"
              >
                Accepter
              </button>
              <button
                onClick={() => onRejectParentRequest && onRejectParentRequest(req.fromId)}
                className="px-3 py-1.5 bg-white border border-stone-200 text-stone-500 text-[10px] font-black uppercase rounded-lg hover:text-red-500 shrink-0"
              >
                Refuser
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Parents adoptifs / beaux-parents */}
      {(adoptiveParents.length > 0 || onProposeAdoption) && (
        <div className="space-y-2">
          <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
            Parents adoptifs {adoptiveParents.length > 0 ? `(${adoptiveParents.length})` : ""}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {adoptiveParents.map((p) => (
              <div key={p.id} className="flex items-center gap-2 bg-white rounded-lg border border-amber-200 px-3 py-2">
                <Baby size={13} className="text-amber-600 shrink-0" />
                <span className="font-bold text-stone-700 text-xs truncate">{p.name}</span>
              </div>
            ))}
          </div>
          {onProposeAdoption && (
            <button
              onClick={() => setProposingAdoption(true)}
              className="text-[10px] font-black uppercase tracking-wide text-stone-500 hover:text-stone-800 flex items-center gap-1"
            >
              <UserPlus size={12} /> Proposer une adoption
            </button>
          )}
        </div>
      )}

      {/* Fratrie */}
      {siblings.length > 0 && (
        <div className="space-y-2">
          <div className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
            Frères & Sœurs ({siblings.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {siblings.map((s) => {
              const isHalfSibling = (user.fatherId && s.fatherId === user.fatherId && user.motherId !== s.motherId) ||
                                    (user.motherId && s.motherId === user.motherId && user.fatherId !== s.fatherId);
              return (
                <div key={s.id} className="flex items-center gap-2 bg-white rounded-lg border border-stone-100 px-3 py-2">
                  <div className="w-7 h-7 bg-stone-200 rounded-full flex items-center justify-center text-xs font-bold text-stone-500 shrink-0" style={{ width: 28, height: 28, minWidth: 28, minHeight: 28 }}>
                    {(s.firstName || s.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-stone-700 text-xs truncate">{s.name}</div>
                    {isHalfSibling && <div className="text-[8px] text-stone-400 italic">Demi-frère/sœur</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!hasParents && (
        <div className="text-center py-3 text-stone-400 italic text-xs">
          Aucun parent déclaré.
        </div>
      )}

      {editingParentType && (
        <EditParentModal
          type={editingParentType}
          userId={user.id}
          currentId={editingParentType === "father" ? user.fatherId : user.motherId}
          currentName={editingParentType === "father" ? (father?.name || user.fatherName) : (mother?.name || user.motherName)}
          safeUsers={safeUsers}
          onClose={() => setEditingParentType(null)}
          onSave={({ id, name }) => {
            const payload = editingParentType === "father"
              ? { fatherId: id, fatherName: name }
              : { motherId: id, motherName: name };
            onSetParents && onSetParents(user.id, payload);
            setEditingParentType(null);
          }}
        />
      )}

      {proposingAdoption && (
        <ProposeAdoptionModal
          userId={user.id}
          safeUsers={safeUsers}
          existingIds={new Set(adoptiveParents.map((p) => p.id))}
          onClose={() => setProposingAdoption(false)}
          onSave={(targetId) => onProposeAdoption && onProposeAdoption(targetId)}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
const MarriageView = ({
  user,
  safeUsers,
  safeCountries,
  sharedAccounts = {},
  onProposeMarriage,
  onAcceptMarriage,
  onRejectMarriage,
  onCancelMarriageProposal,
  onDivorce,
  onDeclareChild,
  onRemoveChild,
  onConvertChildToCitizen,
  onUpdateChildInfo,
  onSetChildGuardianship,
  onSetChildRights,
  onGuardianProposeMarriage,
  onGuardianAcceptMarriage,
  onGuardianRejectMarriage,
  onSetParents,
  onProposeAdoption,
  onAcceptParentRequest,
  onRejectParentRequest,
  onSharedAccountDeposit,
  onSharedAccountWithdraw,
  onSetSpouseRights,
  onProposeMarriageDominance,
  onAcceptMarriageDominance,
  onRejectMarriageDominance,
  onRequisitionSpouseMoney,
  inventoryCatalog = [],
  coupleGifts = {},
  coupleGoals = {},
  coupleJournals = {},
  onSendCoupleGift,
  onSetCoupleGoal,
  onContributeToCoupleGoal,
  onWithdrawCoupleGoal,
  onCancelCoupleGoal,
  onAddCoupleJournalEntry,
  onDeleteCoupleJournalEntry,
  gameDate,
  notify,
  readOnly = false,
}) => {
  const gd = gameDate || { day: 1, month: 1, year: 1200 };

  // Modale de gestion des droits du conjoint dominé
  const [managingSpouseId, setManagingSpouseId] = useState(null);

  // Modale de réquisition du trésor personnel du conjoint dominé
  const [requisitioningSpouseId, setRequisitioningSpouseId] = useState(null);

  // Modales "vie de couple" — cadeau, projet commun, journal partagé
  const [giftingSpouseId, setGiftingSpouseId] = useState(null);
  const [goalSpouseId, setGoalSpouseId] = useState(null);
  const [journalSpouseId, setJournalSpouseId] = useState(null);

  // Registre matrimonial (unions passées : divorce, veuvage, rupture tutoriale)
  const [showMarriageHistory, setShowMarriageHistory] = useState(false);

  // Modale de gestion des droits de tutelle sur un enfant
  const [managingChildId, setManagingChildId] = useState(null);

  // Modale de mariage arrangé au nom d'un enfant sous tutelle active
  const [arrangingMarriageChildId, setArrangingMarriageChildId] = useState(null);

  // Identifiants du compte fraîchement créé pour un enfant NPC converti en citoyen
  const [createdAccountInfo, setCreatedAccountInfo] = useState(null);

  // Édition du nom / date de naissance d'un enfant NPC
  const [editingChildId, setEditingChildId] = useState(null);

  // Renégociation de la domination sur une union déjà existante (dominantId non résolu)
  const [renegotiatingSpouseId, setRenegotiatingSpouseId] = useState(null);
  const [renegotiateDominance, setRenegotiateDominance] = useState("proposant_dominant");

  // État formulaire de proposition
  const [marrySearch, setMarrySearch] = useState("");
  const [marryTargetId, setMarryTargetId] = useState("");
  const [marryTargetName, setMarryTargetName] = useState("");
  const [marryContractType, setMarryContractType] = useState("sacre");
  const [marryRegime, setMarryRegime] = useState("separation");
  const [marryDotType, setMarryDotType] = useState("aucune");
  const [marryDot, setMarryDot] = useState(0);
  const [marryDominance, setMarryDominance] = useState("egal");
  const [marryFiliation, setMarryFiliation] = useState("patrilineaire");
  const [marryClauses, setMarryClauses] = useState("");
  const [showMarryForm, setShowMarryForm] = useState(false);

  // État formulaire enfant
  const [showChildForm, setShowChildForm] = useState(false);
  const [childMode, setChildMode] = useState("citizen"); // "citizen" | "npc"
  const [childSearch, setChildSearch] = useState("");
  const [childCitizenId, setChildCitizenId] = useState("");
  const [childCitizenName, setChildCitizenName] = useState("");
  const [childNpcName, setChildNpcName] = useState("");
  const [childBirthDay, setChildBirthDay] = useState("");
  const [childBirthMonth, setChildBirthMonth] = useState("");
  const [childBirthYear, setChildBirthYear] = useState("");
  const [childFiliation, setChildFiliation] = useState("patrilineaire");
  const [childOtherParentSearch, setChildOtherParentSearch] = useState("");
  const [childOtherParentId, setChildOtherParentId] = useState("");
  const [childOtherParentName, setChildOtherParentName] = useState("");
  const [childNotes, setChildNotes] = useState("");

  const resetChildForm = () => {
    setShowChildForm(false);
    setChildMode("citizen");
    setChildSearch("");
    setChildCitizenId("");
    setChildCitizenName("");
    setChildNpcName("");
    setChildBirthDay("");
    setChildBirthMonth("");
    setChildBirthYear("");
    setChildFiliation("patrilineaire");
    setChildOtherParentSearch("");
    setChildOtherParentId("");
    setChildOtherParentName("");
    setChildNotes("");
  };

  const submitChild = () => {
    const name = childMode === "citizen" ? childCitizenName : childNpcName;
    if (!name.trim() && !childCitizenId) { notify("Indiquez le nom ou sélectionnez un citoyen.", "error"); return; }
    const birthDate =
      childBirthDay && childBirthMonth && childBirthYear
        ? { day: parseInt(childBirthDay), month: parseInt(childBirthMonth), year: parseInt(childBirthYear) }
        : null;
    if (onDeclareChild) {
      onDeclareChild({
        name: name.trim() || childCitizenName,
        citizenId: childMode === "citizen" ? childCitizenId : null,
        birthDate,
        filiation: childFiliation,
        otherParentId: childOtherParentId || null,
        notes: childNotes.trim(),
      });
    }
    resetChildForm();
  };

  // Dérivés mariage
  const userCountry = safeCountries.find((c) => c.id === user?.countryId);
  const marriageStructure = userCountry?.laws?.marriageStructure || "monogamie";
  const marriageDefaultFiliation = userCountry?.laws?.marriageDefaultFiliation || "patrilineaire";
  const currentSpouses = user?.spouses || (user?.spouseId ? [{ id: user.spouseId, name: safeUsers.find((u) => u.id === user.spouseId)?.name || "…" }] : []);
  const currentSpouseIds = new Set(currentSpouses.map((s) => s.id));
  // Petits-enfants — un cran plus loin que "Enfants & Descendance" : les enfants de mes
  // enfants déjà liés à un citoyen réel (child.citizenId), eux-mêmes potentiellement liés.
  const grandchildren = (user?.children || [])
    .map((ch) => (ch.citizenId ? safeUsers.find((u) => u.id === ch.citizenId) : null))
    .filter(Boolean)
    .flatMap((childCitizen) =>
      (childCitizen.children || []).map((gc) => ({
        ...gc,
        linkedCitizen: gc.citizenId ? safeUsers.find((u) => u.id === gc.citizenId) : null,
        throughName: childCitizen.name,
      }))
    );
  // Propositions que j'ai moi-même envoyées et qui attendent encore une réponse — stockées
  // côté cible (marriageProposals), pas chez moi, il faut donc les retrouver en parcourant tout le monde.
  const sentMarriageProposals = safeUsers
    .filter((u) => u.id !== user?.id)
    .flatMap((u) => (u.marriageProposals || []).filter((p) => String(p.fromId) === String(user?.id)).map((p) => ({ ...p, targetId: u.id, targetName: u.name })));
  const canProposeNewMarriage = marriageStructure !== "monogamie" || currentSpouses.length === 0;
  const marriageCandidates = safeUsers.filter(
    (u) =>
      u.id !== user?.id &&
      u.status !== "Esclave" &&
      u.status !== "Décédé" &&
      !currentSpouseIds.has(u.id) &&
      (marriageStructure !== "monogamie" || !(u.spouseId || (u.spouses || []).length > 0))
  );

  const resetForm = () => {
    setMarryTargetId("");
    setMarryTargetName("");
    setMarrySearch("");
    setMarryClauses("");
    setMarryDot(0);
    setMarryDotType("aucune");
    setMarryDominance("egal");
    setMarryRegime("separation");
    setMarryContractType("sacre");
    setShowMarryForm(false);
  };

  return (
    <div className="bg-[#fdf6e3] text-stone-900 rounded-lg shadow-2xl border-t-8 border-rose-400 overflow-hidden space-y-0">

      {/* ── EN-TÊTE ── */}
      <div className="p-6 border-b border-rose-200 bg-rose-50 flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-black uppercase text-stone-800 tracking-widest font-serif flex items-center gap-3">
          <Heart size={20} className="text-rose-500" /> Liens & Unions
        </h2>
        {userCountry && (
          <span className="text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg">
            {MARRIAGE_STRUCTURES[marriageStructure]?.emoji || "💑"}{" "}
            {MARRIAGE_STRUCTURES[marriageStructure]?.label || marriageStructure}{" "}
            — {userCountry.name}
          </span>
        )}
      </div>

      {/* ── SOUS TUTELLE ── */}
      {user.guardianship?.active && (() => {
        const activeRestrictions = CHILD_RIGHTS_LIST.filter((r) => user.guardianship.rights?.[r.key]);
        return (
          <div className="border-b border-amber-200 bg-amber-50/60 p-5 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-2">
              🛡️ Sous la tutelle de {user.guardianship.guardianName || "votre parent"}
            </div>
            {(activeRestrictions.length > 0 || user.guardianship.rights?.bankLimit) && (
              <div className="flex flex-wrap gap-1.5">
                {activeRestrictions.map((r) => (
                  <span key={r.key} className="text-[9px] font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                    {r.icon} {r.label}
                  </span>
                ))}
                {user.guardianship.rights?.bankLimit ? (
                  <span className="text-[9px] font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                    💰 Plafond de virement : {formatMoney(user.guardianship.rights.bankLimit)}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── PROPOSITIONS REÇUES ── */}
      {(user.marriageProposals || []).length > 0 && (
        <div className="border-b border-rose-200 bg-rose-50/60 p-5 space-y-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
            <Heart size={12} /> Propositions d'Union Reçues
          </div>
          {(user.marriageProposals || []).map((proposal) => {
            const ct = MARRIAGE_CONTRACT_TYPES.find((c) => c.id === proposal.contractType);
            const reg = MARRIAGE_REGIMES.find((r) => r.id === proposal.regime);
            const fil = FILIATION_TYPES.find((f) => f.id === proposal.filiation);
            const dom = MARRIAGE_DOMINANCE.find((d) => d.id === proposal.dominance);
            const domLabel = proposal.dominance === "proposant_dominant" ? `${proposal.fromName}, Dominant(e)`
              : proposal.dominance === "cible_dominante" ? "Vous, Dominant(e)"
              : dom?.label || "Égale";
            return (
              <div key={proposal.fromId} className="bg-white rounded-xl border border-rose-200 p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-stone-800 text-base">{proposal.fromName}</div>
                    <div className="text-[10px] text-stone-400">
                      {proposal.timestamp ? new Date(proposal.timestamp).toLocaleDateString("fr-FR") : ""}
                    </div>
                    <div className="text-sm font-bold text-rose-600 mt-1">
                      {ct?.emoji || "💍"} {ct?.label || "Mariage Sacré"}
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => onAcceptMarriage && onAcceptMarriage(proposal.fromId)}
                        className="px-3 py-1.5 bg-rose-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-rose-500 flex items-center gap-1"
                      >
                        <Heart size={11} /> Consentir
                      </button>
                      <button
                        onClick={() => onRejectMarriage && onRejectMarriage(proposal.fromId)}
                        className="px-3 py-1.5 bg-white border border-stone-200 text-stone-500 text-[10px] font-black uppercase rounded-lg hover:text-red-500"
                      >
                        Décliner
                      </button>
                    </div>
                  )}
                  {readOnly && (
                    <span className="text-[9px] italic text-stone-400 shrink-0">
                      Décision réservée à votre tuteur légal
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-rose-100 text-xs">
                  <div>
                    <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest block">Régime</span>
                    <span className="font-bold text-stone-700">{reg?.emoji} {reg?.label || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest block">Domination</span>
                    <span className="font-bold text-stone-700">{dom?.emoji} {domLabel}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest block">Filiation</span>
                    <span className="font-bold text-stone-700">{fil?.label || "—"}</span>
                  </div>
                  {(proposal.dot || 0) > 0 && (
                    <div>
                      <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest block">Dot</span>
                      <span className="font-bold text-stone-700">{formatMoney((proposal.dot))}</span>
                    </div>
                  )}
                  {proposal.clauses && (
                    <div className="col-span-2 md:col-span-4">
                      <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest block">Serments</span>
                      <span className="italic text-stone-600">{proposal.clauses}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PROPOSITIONS ENVOYÉES (en attente) ── */}
      {!readOnly && sentMarriageProposals.length > 0 && (
        <div className="border-b border-stone-200 bg-stone-50/60 p-5 space-y-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-2">
            <Heart size={12} /> Propositions d'Union Envoyées
          </div>
          {sentMarriageProposals.map((proposal) => {
            const ct = MARRIAGE_CONTRACT_TYPES.find((c) => c.id === proposal.contractType);
            return (
              <div key={proposal.targetId} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm flex items-center justify-between gap-3">
                <div>
                  <div className="font-black text-stone-800 text-base">{proposal.targetName}</div>
                  <div className="text-sm font-bold text-stone-500 mt-1">
                    {ct?.emoji || "💍"} {ct?.label || "Mariage Sacré"}
                  </div>
                  <div className="text-[10px] text-stone-400">En attente de sa réponse</div>
                </div>
                <button
                  onClick={() => onCancelMarriageProposal && onCancelMarriageProposal(proposal.targetId)}
                  className="px-3 py-1.5 bg-white border border-stone-200 text-stone-500 text-[10px] font-black uppercase rounded-lg hover:text-red-500 shrink-0"
                >
                  Retirer
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ÉPOUX / ÉPOUSES ACTUELS ── */}
      <div className="p-5 space-y-4">
        {currentSpouses.length > 0 && (
          <div className="space-y-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-2">
              <Shield size={12} /> Unions en vigueur
            </div>
            {currentSpouses.map((spouse) => {
              const spouseUser = safeUsers.find((u) => u.id === spouse.id);
              const ct = MARRIAGE_CONTRACT_TYPES.find((c) => c.id === spouse.contractType);
              const reg = MARRIAGE_REGIMES.find((r) => r.id === spouse.regime);
              const dom = MARRIAGE_DOMINANCE.find((d) => d.id === spouse.dominance);
              const fil = FILIATION_TYPES.find((f) => f.id === spouse.filiation);
              const pairKey = spouse.sharedBalanceKey || spouse.fiefBalanceKey;
              const sharedAccount = pairKey ? (sharedAccounts || {})[pairKey] : null;
              const iAmDominant = !!spouse.dominantId && String(spouse.dominantId) === String(user.id);
              const iAmDominated = !!spouse.dominantId && String(spouse.dominantId) !== String(user.id);
              const domLabel = spouse.dominantId
                ? (iAmDominant ? "Vous, Dominant(e)" : `${spouseUser?.name || spouse.name}, Dominant(e)`)
                : (dom?.label || "Union Égale");
              const activeRestrictions = SPOUSE_RIGHTS_LIST.filter((r) => spouse.spouseRights?.[r.key]);
              const isIndissoluble = MARRIAGE_INDISSOLUBLE_TYPES.includes(spouse.contractType);

              return (
                <div key={spouse.id} className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
                  {/* Bandeau identité */}
                  <div className="flex items-center justify-between p-4 border-b border-rose-100 bg-rose-50/40">
                    <div className="flex items-center gap-3">
                      {spouseUser?.avatarUrl ? (
                        <img
                          src={spouseUser.avatarUrl}
                          className="w-14 h-14 rounded-full object-cover border-2 border-rose-300"
                          alt=""
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center border-2 border-rose-200">
                          <Heart size={24} className="text-rose-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-black text-stone-800 text-lg leading-tight">
                          {spouseUser?.name || spouse.name || spouse.id}
                        </div>
                        <div className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-0.5">
                          {ct?.emoji || "💍"} {ct?.label || "Mariage"}
                          {spouse.date ? ` · ${new Date(spouse.date).toLocaleDateString("fr-FR")}` : ""}
                        </div>
                        {spouseUser?.occupation && (
                          <div className="text-[9px] text-stone-400 italic mt-0.5">{spouseUser.occupation}</div>
                        )}
                      </div>
                    </div>
                    {!readOnly && (
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        <button
                          onClick={() => setGiftingSpouseId(spouse.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-black uppercase rounded-lg hover:bg-rose-100 transition-colors"
                        >
                          <Gift size={12} /> Cadeau
                        </button>
                        <button
                          onClick={() => setGoalSpouseId(spouse.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-black uppercase rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <Target size={12} /> Projet
                        </button>
                        <button
                          onClick={() => setJournalSpouseId(spouse.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 border border-sky-200 text-sky-600 text-[10px] font-black uppercase rounded-lg hover:bg-sky-100 transition-colors"
                        >
                          <BookHeart size={12} /> Journal
                        </button>
                        {iAmDominant && (
                          <>
                            <button
                              onClick={() => setRequisitioningSpouseId(spouse.id)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-black uppercase rounded-lg hover:bg-amber-100 transition-colors"
                            >
                              <Coins size={12} /> Réquisitionner
                            </button>
                            <button
                              onClick={() => setManagingSpouseId(spouse.id)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-600 text-[10px] font-black uppercase rounded-lg hover:bg-purple-100 transition-colors"
                            >
                              <Lock size={12} /> Gérer les droits
                            </button>
                          </>
                        )}
                        {isIndissoluble ? (
                          <span
                            title="Cette union est indissoluble par ces vœux — seule la mort peut y mettre fin."
                            className="flex items-center gap-1.5 px-3 py-2 bg-stone-50 border border-stone-200 text-stone-400 text-[10px] font-black uppercase rounded-lg cursor-help"
                          >
                            <Lock size={12} /> Indissoluble
                          </span>
                        ) : (
                          <button
                            onClick={() => onDivorce && onDivorce(spouse.id)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 text-stone-400 text-[10px] font-black uppercase rounded-lg hover:text-red-500 hover:border-red-200 transition-colors"
                          >
                            <HeartOff size={12} /> Rompre
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Droits restreints par ce conjoint dominant */}
                  {iAmDominated && activeRestrictions.length > 0 && (
                    <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-red-600 flex items-center gap-1.5 mb-1.5">
                        <Lock size={11} /> Droits restreints par {spouseUser?.name || spouse.name}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeRestrictions.map((r) => (
                          <span key={r.key} className="text-[9px] font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                            {r.icon} {r.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Réquisitions subies de la part du conjoint dominant */}
                  {iAmDominated && (spouse.requisitionHistory || []).length > 0 && (
                    <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-1.5 mb-1.5">
                        <Coins size={11} /> Réquisitions par {spouseUser?.name || spouse.name}
                      </div>
                      <div className="space-y-1">
                        {spouse.requisitionHistory.slice(0, 3).map((h) => (
                          <div key={h.id} className="flex items-center justify-between text-[10px] text-amber-800">
                            <span className="truncate flex-1">{h.reason || "Sans raison précisée"}</span>
                            <span className="font-bold shrink-0 ml-2">{formatMoney(h.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Domination non résolue — renégociation possible sur une union déjà existante */}
                  {!readOnly && !spouse.dominantId && (
                    <div className="mx-4 mt-4 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 space-y-2">
                      {spouse.pendingDominance ? (
                        String(spouse.pendingDominance.proposedBy) === String(user.id) ? (
                          <div className="space-y-2">
                            <p className="text-[10px] text-purple-600 font-bold flex items-center gap-1.5">
                              ⏳ Proposition de domination envoyée — en attente de l'accord de {spouseUser?.name || spouse.name}.
                            </p>
                            <button
                              onClick={() => onRejectMarriageDominance && onRejectMarriageDominance({ spouseId: spouse.id })}
                              className="px-3 py-1.5 bg-white border border-stone-200 text-stone-500 text-[10px] font-black uppercase rounded-lg hover:text-red-500"
                            >
                              Annuler ma proposition
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-[10px] text-purple-700 font-bold">
                              {spouseUser?.name || spouse.name} propose : {MARRIAGE_DOMINANCE.find((d) => d.id === spouse.pendingDominance.dominance)?.label}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => onAcceptMarriageDominance && onAcceptMarriageDominance({ spouseId: spouse.id })}
                                className="px-3 py-1.5 bg-purple-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-purple-500"
                              >
                                Accepter
                              </button>
                              <button
                                onClick={() => onRejectMarriageDominance && onRejectMarriageDominance({ spouseId: spouse.id })}
                                className="px-3 py-1.5 bg-white border border-stone-200 text-stone-500 text-[10px] font-black uppercase rounded-lg hover:text-red-500"
                              >
                                Refuser
                              </button>
                            </div>
                          </div>
                        )
                      ) : renegotiatingSpouseId === spouse.id ? (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Proposer une domination</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                            {MARRIAGE_DOMINANCE.filter((d) => ["egal", "proposant_dominant", "cible_dominante"].includes(d.id)).map((d) => (
                              <button key={d.id} onClick={() => setRenegotiateDominance(d.id)}
                                className={`p-2 rounded-lg border text-left text-[10px] font-bold transition-all ${renegotiateDominance === d.id ? "border-purple-500 bg-purple-100 text-purple-700" : "border-stone-200 bg-white text-stone-600 hover:border-purple-300"}`}>
                                {d.emoji} {d.id === "cible_dominante" ? `${spouseUser?.name || spouse.name}` : d.id === "proposant_dominant" ? "Moi" : d.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setRenegotiatingSpouseId(null)}
                              className="px-3 py-1.5 bg-white border border-stone-200 text-stone-500 text-[10px] font-black uppercase rounded-lg hover:bg-stone-50"
                            >
                              Annuler
                            </button>
                            <button
                              onClick={() => { onProposeMarriageDominance && onProposeMarriageDominance({ spouseId: spouse.id, dominance: renegotiateDominance }); setRenegotiatingSpouseId(null); }}
                              className="px-3 py-1.5 bg-purple-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-purple-500"
                            >
                              Proposer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setRenegotiatingSpouseId(spouse.id); setRenegotiateDominance("proposant_dominant"); }}
                          className="text-[10px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1.5"
                        >
                          <Lock size={11} /> Définir la domination de cette union (permet ensuite de restreindre les droits)
                        </button>
                      )}
                    </div>
                  )}

                  {/* Contrat détaillé */}
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-stone-50 rounded-lg p-2.5">
                      <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-1">Partage</span>
                      <span className="font-bold text-stone-700">{reg?.emoji} {reg?.label || "Non défini"}</span>
                    </div>
                    <div className="bg-stone-50 rounded-lg p-2.5">
                      <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-1">Domination</span>
                      <span className="font-bold text-stone-700">{dom?.emoji} {domLabel}</span>
                    </div>
                    <div className="bg-stone-50 rounded-lg p-2.5">
                      <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-1">Lignée</span>
                      <span className="font-bold text-stone-700">{fil?.label || "Non défini"}</span>
                    </div>
                    {(spouse.dot || 0) > 0 && (
                      <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-100">
                        <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-1">Dot versée</span>
                        <span className="font-bold text-amber-700 flex items-center gap-1">
                          <Coins size={11} /> {formatMoney((spouse.dot))}
                        </span>
                      </div>
                    )}
                    {spouse.clauses && (
                      <div className="col-span-2 md:col-span-4 bg-stone-50 rounded-lg p-2.5">
                        <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-1">Serments & Clauses</span>
                        <span className="italic text-stone-600">{spouse.clauses}</span>
                      </div>
                    )}
                  </div>

                  {/* Trésor Commun / Fief Conjoint */}
                  {sharedAccount && (
                    <div className={`mx-4 mb-4 rounded-2xl border-2 overflow-hidden ${sharedAccount.type === "fief" ? "border-amber-300" : "border-yellow-300"}`}>
                      <div className={`px-4 py-3 flex items-center justify-between ${sharedAccount.type === "fief" ? "bg-gradient-to-r from-amber-100 to-amber-50" : "bg-gradient-to-r from-yellow-100 to-yellow-50"}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-600 flex items-center gap-1.5">
                          {sharedAccount.type === "fief" ? "🏰 Fief Conjoint" : "🪙 Trésor Commun"}
                        </span>
                        <span className="font-black text-stone-800 text-lg flex items-center gap-1.5">
                          <Coins size={16} className="text-yellow-600" />
                          {formatMoney((sharedAccount.balance || 0))}
                        </span>
                      </div>
                      <div className={`p-3 ${sharedAccount.type === "fief" ? "bg-amber-50/60" : "bg-yellow-50/60"}`}>
                        {onSharedAccountDeposit && onSharedAccountWithdraw && (
                          <SharedAccountPanel
                            pairKey={pairKey}
                            account={sharedAccount}
                            resolvedDominance={spouse.dominance}
                            resolvedDominantId={spouse.dominantId}
                            userId={user.id}
                            userName={user.name}
                            spouseName={spouseUser?.name || spouse.name}
                            onDeposit={onSharedAccountDeposit}
                            onWithdraw={onSharedAccountWithdraw}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {currentSpouses.length === 0 && (user.marriageProposals || []).length === 0 && (
          <div className="text-center py-10 text-stone-400 italic text-sm">
            <Heart size={32} className="mx-auto mb-3 opacity-20" />
            Aucune union contractée pour le moment.
          </div>
        )}

        {/* ── REGISTRE MATRIMONIAL ── */}
        {(user.marriageHistory || []).length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <button
              onClick={() => setShowMarriageHistory((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-2">
                📜 Registre matrimonial ({user.marriageHistory.length})
              </span>
              <span className="text-stone-400 text-xs">{showMarriageHistory ? "▲" : "▼"}</span>
            </button>
            {showMarriageHistory && (
              <div className="border-t border-stone-100 divide-y divide-stone-100">
                {user.marriageHistory.map((h, i) => {
                  const ct = MARRIAGE_CONTRACT_TYPES.find((c) => c.id === h.contractType);
                  const endLabel = { divorce: "Divorce", veuvage: "Veuvage", tutelle: "Rompue par le tuteur" }[h.endReason] || "Union rompue";
                  const endColor = { divorce: "text-stone-500", veuvage: "text-purple-600", tutelle: "text-amber-600" }[h.endReason] || "text-stone-500";
                  return (
                    <div key={`${h.id}_${i}`} className="px-4 py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-700 truncate">
                          {ct?.emoji || "💍"} {h.name || safeUsers.find((u) => u.id === h.id)?.name || "Inconnu"}
                        </div>
                        <div className="text-[9px] text-stone-400">
                          {ct?.label || "Mariage"}
                          {h.date ? ` · uni le ${new Date(h.date).toLocaleDateString("fr-FR")}` : ""}
                          {h.endedAt ? ` · rompue le ${new Date(h.endedAt).toLocaleDateString("fr-FR")}` : ""}
                        </div>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest shrink-0 ${endColor}`}>{endLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FORMULAIRE DE PROPOSITION ── */}
        {!readOnly && canProposeNewMarriage && (
          !showMarryForm ? (
            <button
              onClick={() => { setShowMarryForm(true); setMarryFiliation(marriageDefaultFiliation); }}
              className="w-full py-3 bg-rose-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-rose-500 flex items-center justify-center gap-2 transition-colors"
            >
              <Heart size={14} /> Proposer une Union
            </button>
          ) : (
            <div className="bg-white rounded-xl border-2 border-rose-200 p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                  <Heart size={12} /> Nouvelle Proposition
                </h4>
                <button onClick={resetForm} className="text-stone-400 hover:text-stone-600 text-lg leading-none">✕</button>
              </div>

              {/* Recherche partenaire */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">L'Élu(e)</label>
                {marryTargetId ? (
                  <div className="flex items-center gap-3 p-3 bg-rose-50 border-2 border-rose-300 rounded-xl">
                    {safeUsers.find((u) => u.id === marryTargetId)?.avatarUrl ? (
                      <img
                        src={safeUsers.find((u) => u.id === marryTargetId).avatarUrl}
                        className="w-8 h-8 rounded-full object-cover border-2 border-rose-200"
                        alt=""
                      />
                    ) : (
                      <Heart size={16} className="text-rose-400 shrink-0" />
                    )}
                    <span className="flex-1 font-black text-stone-800">{marryTargetName}</span>
                    <button
                      onClick={() => { setMarryTargetId(""); setMarryTargetName(""); setMarrySearch(""); }}
                      className="text-stone-400 hover:text-red-500"
                    >✕</button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-2 border-2 border-rose-200 rounded-xl bg-white px-3 focus-within:border-rose-400">
                      <Search size={14} className="text-rose-300 shrink-0" />
                      <input
                        className="flex-1 p-2.5 outline-none text-sm font-bold bg-transparent"
                        placeholder="Nom ou identifiant du prétendant…"
                        value={marrySearch}
                        onChange={(e) => setMarrySearch(e.target.value)}
                      />
                    </div>
                    {marrySearch && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto border border-rose-200 rounded-xl bg-white shadow-xl p-2 space-y-1">
                        {marriageCandidates
                          .filter((u) => u.name?.toLowerCase().includes(marrySearch.toLowerCase()) || u.id?.includes(marrySearch))
                          .slice(0, 8)
                          .map((u) => (
                            <button
                              key={u.id}
                              onClick={() => { setMarryTargetId(u.id); setMarryTargetName(u.name); setMarrySearch(""); }}
                              className="w-full text-left p-2 rounded-lg hover:bg-rose-50 flex items-center gap-2 transition-colors"
                            >
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} className="w-7 h-7 rounded-full object-cover border border-rose-200" alt="" style={{ width: 28, height: 28, minWidth: 28, minHeight: 28, objectFit: "cover" }} />
                              ) : (
                                <User size={12} className="text-stone-400 shrink-0" />
                              )}
                              <span className="font-bold text-sm text-stone-800 truncate">{u.name}</span>
                              <span className="text-[9px] text-stone-400 ml-auto font-mono shrink-0">{u.id}</span>
                            </button>
                          ))}
                        {marriageCandidates.filter((u) =>
                          u.name?.toLowerCase().includes(marrySearch.toLowerCase()) || u.id?.includes(marrySearch)
                        ).length === 0 && (
                          <div className="text-xs text-stone-400 italic text-center py-2">Aucun sujet trouvé.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Type de cérémonie */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">Type d'Union</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {MARRIAGE_CONTRACT_TYPES.map((ct) => (
                    <button key={ct.id} onClick={() => setMarryContractType(ct.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${marryContractType === ct.id ? "border-rose-500 bg-rose-50" : "border-stone-200 bg-white hover:border-rose-300"}`}>
                      <div className="text-xl mb-1">{ct.emoji}</div>
                      <div className="text-[10px] font-black uppercase tracking-wide text-stone-700 leading-tight">{ct.label}</div>
                      {ct.description && <div className="text-[9px] text-stone-400 mt-0.5 leading-tight">{ct.description}</div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partage des Biens */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">Partage des Biens</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {MARRIAGE_REGIMES.map((r) => (
                    <button key={r.id} onClick={() => setMarryRegime(r.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${marryRegime === r.id ? "border-rose-500 bg-rose-50" : "border-stone-200 bg-white hover:border-rose-300"}`}>
                      <div className="text-xl mb-1">{r.emoji}</div>
                      <div className="text-[10px] font-black uppercase tracking-wide text-stone-700">{r.label}</div>
                      <div className="text-[9px] text-stone-400 mt-0.5">{r.description}</div>
                    </button>
                  ))}
                </div>
                {marryRegime === "fief_conjoint" && (
                  <p className="text-[9px] text-amber-700 italic bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    🏰 Le Fief Conjoint est géré par l'époux dominant. Seul le dominant peut y retirer des Écus.
                  </p>
                )}
              </div>

              {/* Dot des Noces */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">Dot des Noces</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {MARRIAGE_DOT_TYPES.map((d) => (
                    <button key={d.id} onClick={() => { setMarryDotType(d.id); if (d.id === "aucune") setMarryDot(0); }}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${marryDotType === d.id ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white hover:border-amber-300"}`}>
                      <div className="text-xl mb-1">{d.emoji}</div>
                      <div className="text-[10px] font-black uppercase tracking-wide text-stone-700">{d.label}</div>
                      <div className="text-[9px] text-stone-400 mt-0.5">{d.description}</div>
                    </button>
                  ))}
                </div>
                {marryDotType !== "aucune" && (
                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">
                      Montant de la Dot (Écus)
                    </label>
                    <input type="number" step="0.1" min={0}
                      className="w-full p-3 border-2 border-amber-200 rounded-xl bg-white outline-none font-bold focus:border-amber-400"
                      value={marryDot}
                      onChange={(e) => setMarryDot(parseInt(e.target.value) || 0)} />
                    <p className="text-[9px] text-amber-700 italic">La dot sera automatiquement transférée lors du consentement.</p>
                  </div>
                )}
              </div>

              {/* Domination du Mariage */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">Domination de l'Union</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {MARRIAGE_DOMINANCE.filter((d) => ["egal", "proposant_dominant", "cible_dominante"].includes(d.id)).map((d) => (
                    <button key={d.id} onClick={() => setMarryDominance(d.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${marryDominance === d.id ? "border-purple-500 bg-purple-50" : "border-stone-200 bg-white hover:border-purple-300"}`}>
                      <div className="text-xl mb-1">{d.emoji}</div>
                      <div className="text-[10px] font-black uppercase tracking-wide text-stone-700">
                        {d.id === "cible_dominante" && marryTargetName ? `${marryTargetName}, Dominant(e)` : d.label}
                      </div>
                      <div className="text-[9px] text-stone-400 mt-0.5">{d.description}</div>
                    </button>
                  ))}
                </div>
                {marryDominance !== "egal" && (
                  <p className="text-[9px] text-purple-700 italic bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                    ⚠️ Le/la dominant(e) impose sa lignée aux héritiers (sauf filiation Bilinéaire ou Au Choix), et pourra restreindre l'accès de l'autre au voyage, à Mushtagram, à la banque et au marché — comme un contrat de servage.
                  </p>
                )}
              </div>

              {/* Lignée des Héritiers */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widests text-stone-400 block">Lignée des Héritiers</label>
                <div className="grid grid-cols-2 gap-2">
                  {FILIATION_TYPES.map((f) => (
                    <button key={f.id} onClick={() => setMarryFiliation(f.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${marryFiliation === f.id ? "border-rose-500 bg-rose-50" : "border-stone-200 bg-white hover:border-rose-300"}`}>
                      <div className="text-[10px] font-black uppercase tracking-wide text-stone-700">{f.label}</div>
                      <div className="text-[9px] text-stone-400 mt-0.5">{f.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Serments & Clauses */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widests text-stone-400 block">Serments & Clauses (optionnel)</label>
                <textarea
                  className="w-full p-3 border-2 border-rose-200 rounded-xl bg-white outline-none text-sm font-bold min-h-[80px] focus:border-rose-400"
                  placeholder="Terres promises, héritages, titres concédés, serments mutuels, protections magiques..."
                  value={marryClauses}
                  onChange={(e) => setMarryClauses(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={resetForm}
                  className="flex-1 py-3 border-2 border-stone-200 rounded-xl text-stone-500 text-[10px] font-black uppercase hover:bg-stone-50 transition-colors">
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (!marryTargetId) return;
                    if (onProposeMarriage) onProposeMarriage(marryTargetId, {
                      contractType: marryContractType,
                      regime: marryRegime,
                      dotType: marryDotType,
                      dot: marryDot,
                      dominance: marryDominance,
                      filiation: marryFiliation,
                      clauses: marryClauses,
                    });
                    resetForm();
                  }}
                  disabled={!marryTargetId}
                  className="flex-1 py-3 bg-rose-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  <Heart size={12} /> Sceller la Proposition
                </button>
              </div>
            </div>
          )
        )}

        {!readOnly && !canProposeNewMarriage && currentSpouses.length > 0 && (
          <p className="text-[10px] text-stone-400 italic text-center">
            Les coutumes de {userCountry?.name || "votre royaume"} ({MARRIAGE_STRUCTURES[marriageStructure]?.label}) ne permettent pas de contracter un nouveau lien.
          </p>
        )}
        {readOnly && (
          <p className="text-[10px] text-stone-400 italic text-center border border-stone-200 rounded-lg p-3 bg-stone-50">
            En tant que personne en servitude, votre tuteur légal (propriétaire) gère vos unions — propositions, acceptations et ruptures.
          </p>
        )}
      </div>

      {/* ── MES PARENTS & FRATRIE ── */}
      <ParentsSection
        user={user}
        safeUsers={safeUsers}
        onSetParents={onSetParents}
        onProposeAdoption={onProposeAdoption}
        onAcceptParentRequest={onAcceptParentRequest}
        onRejectParentRequest={onRejectParentRequest}
      />

      {/* ── ENFANTS & DESCENDANCE ── */}
      <div className="border-t-4 border-amber-200 bg-amber-50/40 p-5 space-y-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-2">
          <Baby size={13} /> Enfants & Descendance
        </div>

        {/* Liste des enfants */}
        {(user.children || []).length > 0 ? (
          <div className="space-y-3">
            {(user.children || []).map((child) => {
              const linkedCitizen = child.citizenId ? safeUsers.find((u) => u.id === child.citizenId) : null;
              const otherParent = child.otherParentId ? safeUsers.find((u) => u.id === child.otherParentId) : null;
              const fil = FILIATION_TYPES.find((f) => f.id === child.filiation);
              const displayName = linkedCitizen?.name || child.name || "Enfant sans nom";
              // Une fois l'enfant lié à un citoyen réel, sa date de naissance officielle vit sur
              // la fiche citoyen (modifiable en mode admin) — elle prime sur l'ancienne copie locale.
              const effectiveBirthDate = linkedCitizen?.birthDate || child.birthDate;
              const age = effectiveBirthDate ? getCitizenAge({ birthDate: effectiveBirthDate }, gd) : null;
              return (
                <div key={child.id} className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 flex items-start gap-3">
                  {linkedCitizen?.avatarUrl ? (
                    <img src={linkedCitizen.avatarUrl} className="w-12 h-12 rounded-full object-cover border-2 border-amber-200 shrink-0" alt="" style={{ width: 48, height: 48, minWidth: 48, minHeight: 48, objectFit: "cover" }} />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center border-2 border-amber-200 shrink-0" style={{ width: 48, height: 48, minWidth: 48, minHeight: 48 }}>
                      <Baby size={20} className="text-amber-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-stone-800 text-base leading-tight">{displayName}</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {age !== null && (
                        <span className="text-[10px] text-stone-500 font-bold">{age} ans</span>
                      )}
                      {effectiveBirthDate && (
                        <span className="text-[10px] text-stone-400 italic">né(e) le {formatRPDate(effectiveBirthDate)}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {fil && (
                        <span className="text-[9px] bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full border border-amber-200">
                          {fil.label}
                        </span>
                      )}
                      {linkedCitizen && (
                        <span className="text-[9px] bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded-full border border-stone-200">
                          Citoyen lié
                        </span>
                      )}
                    </div>
                    {otherParent && (
                      <div className="text-[9px] text-stone-400 mt-1 flex items-center gap-1">
                        <User size={9} /> Autre parent : <span className="font-bold text-stone-600">{otherParent.name}</span>
                      </div>
                    )}
                    {child.notes && (
                      <div className="text-[9px] text-stone-400 italic mt-1 border-t border-stone-100 pt-1">{child.notes}</div>
                    )}
                    {!linkedCitizen && (onConvertChildToCitizen || onUpdateChildInfo) && (
                      <div className="mt-2 pt-2 border-t border-amber-100 flex flex-wrap gap-1.5">
                        {onUpdateChildInfo && (
                          <button
                            onClick={() => setEditingChildId(child.id)}
                            className="flex items-center gap-1 px-2 py-1 bg-stone-50 border border-stone-200 text-stone-600 text-[9px] font-black uppercase rounded-lg hover:bg-stone-100 transition-colors"
                          >
                            <Edit3 size={10} /> Modifier
                          </button>
                        )}
                        {onConvertChildToCitizen && (
                          <button
                            onClick={() => {
                              const result = onConvertChildToCitizen(child.id);
                              if (result) setCreatedAccountInfo(result);
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            <UserPlus size={10} /> Créer un compte jouable
                          </button>
                        )}
                      </div>
                    )}
                    {linkedCitizen && (() => {
                      const isRecognizedParent = String(linkedCitizen.fatherId) === String(user.id) || String(linkedCitizen.motherId) === String(user.id);
                      const guardianship = linkedCitizen.guardianship;
                      const iAmGuardian = guardianship?.active && String(guardianship.guardianId) === String(user.id);
                      const activeChildRestrictions = CHILD_RIGHTS_LIST.filter((r) => guardianship?.rights?.[r.key]);
                      if (!isRecognizedParent) return null;
                      return (
                        <div className="mt-2 pt-2 border-t border-amber-100 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {iAmGuardian ? (
                              <>
                                <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                                  🛡️ Sous votre tutelle
                                </span>
                                <button
                                  onClick={() => setManagingChildId(linkedCitizen.id)}
                                  className="flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-200 text-purple-600 text-[9px] font-black uppercase rounded-lg hover:bg-purple-100 transition-colors"
                                >
                                  <Lock size={10} /> Gérer les droits
                                </button>
                                {onGuardianProposeMarriage && (linkedCitizen.spouses || []).length === 0 && (
                                  <button
                                    onClick={() => setArrangingMarriageChildId(linkedCitizen.id)}
                                    className="flex items-center gap-1 px-2 py-1 bg-rose-50 border border-rose-200 text-rose-600 text-[9px] font-black uppercase rounded-lg hover:bg-rose-100 transition-colors"
                                  >
                                    <Heart size={10} /> Arranger un mariage
                                  </button>
                                )}
                                {onSetChildGuardianship && (
                                  <button
                                    onClick={() => onSetChildGuardianship(linkedCitizen.id, false)}
                                    className="px-2 py-1 bg-white border border-stone-200 text-stone-400 text-[9px] font-black uppercase rounded-lg hover:text-red-500 hover:border-red-200 transition-colors"
                                  >
                                    Lever la tutelle
                                  </button>
                                )}
                              </>
                            ) : guardianship?.active ? (
                              <span className="text-[9px] font-bold text-stone-400 italic">Sous tutelle d'un autre parent</span>
                            ) : (
                              onSetChildGuardianship && (
                                <button
                                  onClick={() => onSetChildGuardianship(linkedCitizen.id, true)}
                                  className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-black uppercase rounded-lg hover:bg-amber-100 transition-colors"
                                >
                                  🛡️ Établir la tutelle
                                </button>
                              )
                            )}
                          </div>
                          {iAmGuardian && (activeChildRestrictions.length > 0 || guardianship?.rights?.bankLimit) && (
                            <div className="flex flex-wrap gap-1">
                              {activeChildRestrictions.map((r) => (
                                <span key={r.key} className="text-[8px] font-bold bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-full">
                                  {r.icon} {r.label}
                                </span>
                              ))}
                              {guardianship?.rights?.bankLimit ? (
                                <span className="text-[8px] font-bold bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-full">
                                  💰 Plafond : {formatMoney(guardianship.rights.bankLimit)}
                                </span>
                              ) : null}
                            </div>
                          )}
                          {iAmGuardian && (linkedCitizen.marriageProposals || []).length > 0 && (
                            <div className="space-y-1.5 pt-1.5 border-t border-amber-100">
                              <div className="text-[9px] font-black uppercase tracking-widest text-rose-500">Propositions reçues pour {linkedCitizen.name}</div>
                              {linkedCitizen.marriageProposals.map((proposal) => {
                                const ct = MARRIAGE_CONTRACT_TYPES.find((c) => c.id === proposal.contractType);
                                return (
                                  <div key={proposal.fromId} className="flex items-center justify-between gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                                    <span className="text-xs font-bold text-stone-700">{ct?.emoji || "💍"} {proposal.fromName}</span>
                                    <div className="flex gap-1.5 shrink-0">
                                      <button
                                        onClick={() => onGuardianAcceptMarriage && onGuardianAcceptMarriage(linkedCitizen.id, proposal.fromId)}
                                        className="px-2 py-1 bg-rose-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-rose-500"
                                      >
                                        Consentir
                                      </button>
                                      <button
                                        onClick={() => onGuardianRejectMarriage && onGuardianRejectMarriage(linkedCitizen.id, proposal.fromId)}
                                        className="px-2 py-1 bg-white border border-stone-200 text-stone-500 text-[9px] font-black uppercase rounded-lg hover:text-red-500"
                                      >
                                        Décliner
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  {onRemoveChild && (
                    <button
                      onClick={() => onRemoveChild(child.id)}
                      className="shrink-0 p-1.5 text-stone-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer ce lien de filiation"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-stone-400 italic text-xs">
            <Baby size={28} className="mx-auto mb-2 opacity-20" />
            Aucun enfant déclaré.
          </div>
        )}

        {/* Petits-enfants */}
        {grandchildren.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-amber-200">
            <div className="text-[9px] font-black uppercase text-amber-600 tracking-widest">
              Petits-Enfants ({grandchildren.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {grandchildren.map((gc) => (
                <div key={gc.id} className="flex items-center gap-2 bg-white rounded-lg border border-amber-100 px-3 py-2">
                  <Baby size={14} className="text-amber-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-stone-700 text-xs truncate">{gc.linkedCitizen?.name || gc.name}</div>
                    <div className="text-[8px] text-stone-400 italic">Via {gc.throughName}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bouton / formulaire déclaration enfant */}
        {!readOnly && (!showChildForm ? (
          <button
            onClick={() => setShowChildForm(true)}
            className="w-full py-2.5 border-2 border-dashed border-amber-300 text-amber-700 text-[10px] font-black uppercase rounded-xl hover:bg-amber-50 flex items-center justify-center gap-2 transition-colors"
          >
            <UserPlus size={13} /> Déclarer un enfant
          </button>
        ) : (
          <div className="bg-white rounded-xl border-2 border-amber-300 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-amber-700 flex items-center gap-2">
                <Baby size={12} /> Déclaration de Filiation
              </h4>
              <button onClick={resetChildForm} className="text-stone-400 hover:text-stone-600 text-lg leading-none">✕</button>
            </div>

            {/* Mode : citoyen existant ou NPC */}
            <div className="flex gap-2">
              <button
                onClick={() => setChildMode("citizen")}
                className={`flex-1 py-2 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${childMode === "citizen" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-stone-200 text-stone-500 hover:border-amber-300"}`}
              >
                Citoyen existant
              </button>
              <button
                onClick={() => setChildMode("npc")}
                className={`flex-1 py-2 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${childMode === "npc" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-stone-200 text-stone-500 hover:border-amber-300"}`}
              >
                Personnage (NPC)
              </button>
            </div>

            {/* Sélection enfant citoyen */}
            {childMode === "citizen" && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">Choisir le citoyen enfant</label>
                {childCitizenId ? (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl">
                    {safeUsers.find((u) => u.id === childCitizenId)?.avatarUrl ? (
                      <img src={safeUsers.find((u) => u.id === childCitizenId).avatarUrl} className="w-8 h-8 rounded-full object-cover border-2 border-amber-200" alt="" style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, objectFit: "cover" }} />
                    ) : (
                      <Baby size={16} className="text-amber-500 shrink-0" />
                    )}
                    <span className="flex-1 font-black text-stone-800">{childCitizenName}</span>
                    <button onClick={() => { setChildCitizenId(""); setChildCitizenName(""); setChildSearch(""); }} className="text-stone-400 hover:text-red-500">✕</button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-2 border-2 border-amber-200 rounded-xl bg-white px-3 focus-within:border-amber-400">
                      <Search size={14} className="text-amber-300 shrink-0" />
                      <input
                        className="flex-1 p-2.5 outline-none text-sm font-bold bg-transparent"
                        placeholder="Nom du citoyen enfant…"
                        value={childSearch}
                        onChange={(e) => setChildSearch(e.target.value)}
                      />
                    </div>
                    {childSearch && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto border border-amber-200 rounded-xl bg-white shadow-xl p-2 space-y-1">
                        {safeUsers
                          .filter((u) => u.id !== user?.id && (u.name?.toLowerCase().includes(childSearch.toLowerCase()) || u.id?.includes(childSearch)))
                          .slice(0, 8)
                          .map((u) => (
                            <button key={u.id} onClick={() => { setChildCitizenId(u.id); setChildCitizenName(u.name); setChildSearch(""); }}
                              className="w-full text-left p-2 rounded-lg hover:bg-amber-50 flex items-center gap-2 transition-colors">
                              {u.avatarUrl ? <img src={u.avatarUrl} className="w-6 h-6 rounded-full object-cover" alt="" style={{ width: 24, height: 24, minWidth: 24, minHeight: 24, objectFit: "cover" }} /> : <User size={12} className="text-stone-400 shrink-0" />}
                              <span className="font-bold text-sm text-stone-800 truncate">{u.name}</span>
                              <span className="text-[9px] text-stone-400 ml-auto font-mono shrink-0">{u.id}</span>
                            </button>
                          ))}
                        {safeUsers.filter((u) => u.id !== user?.id && (u.name?.toLowerCase().includes(childSearch.toLowerCase()) || u.id?.includes(childSearch))).length === 0 && (
                          <div className="text-xs text-stone-400 italic text-center py-2">Aucun citoyen trouvé.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Nom NPC */}
            {childMode === "npc" && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">Nom de l'enfant</label>
                <input
                  className="w-full p-3 border-2 border-amber-200 rounded-xl bg-white outline-none font-bold focus:border-amber-400 text-sm"
                  placeholder="Prénom Nom de l'enfant…"
                  value={childNpcName}
                  onChange={(e) => setChildNpcName(e.target.value)}
                />
              </div>
            )}

            {/* Date de naissance */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widests text-stone-400 block">Date de naissance (optionnel)</label>
              <div className="flex gap-2">
                <input type="number" min={1} max={30} placeholder="Jour"
                  className="w-1/4 p-2.5 border-2 border-amber-200 rounded-xl bg-white outline-none font-bold text-sm text-center focus:border-amber-400"
                  value={childBirthDay} onChange={(e) => setChildBirthDay(e.target.value)} />
                <input type="number" min={1} max={12} placeholder="Mois"
                  className="w-1/4 p-2.5 border-2 border-amber-200 rounded-xl bg-white outline-none font-bold text-sm text-center focus:border-amber-400"
                  value={childBirthMonth} onChange={(e) => setChildBirthMonth(e.target.value)} />
                <input type="number" min={800} max={1500} placeholder="Année"
                  className="flex-1 p-2.5 border-2 border-amber-200 rounded-xl bg-white outline-none font-bold text-sm text-center focus:border-amber-400"
                  value={childBirthYear} onChange={(e) => setChildBirthYear(e.target.value)} />
              </div>
              {childBirthDay && childBirthMonth && childBirthYear && (
                <p className="text-[9px] text-amber-700 italic">
                  Âge actuel : {Math.max(0, gd.year - parseInt(childBirthYear))} ans environ
                </p>
              )}
            </div>

            {/* Filiation */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widests text-stone-400 block">Lignée</label>
              <div className="grid grid-cols-2 gap-2">
                {FILIATION_TYPES.map((f) => (
                  <button key={f.id} onClick={() => setChildFiliation(f.id)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${childFiliation === f.id ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white hover:border-amber-300"}`}>
                    <div className="text-[10px] font-black uppercase tracking-wide text-stone-700">{f.label}</div>
                    <div className="text-[9px] text-stone-400 mt-0.5 leading-tight">{f.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Autre parent */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widests text-stone-400 block">Autre parent (optionnel)</label>
              {childOtherParentId ? (
                <div className="flex items-center gap-3 p-3 bg-stone-50 border-2 border-stone-200 rounded-xl">
                  <User size={14} className="text-stone-400 shrink-0" />
                  <span className="flex-1 font-bold text-stone-700 text-sm">{childOtherParentName}</span>
                  <button onClick={() => { setChildOtherParentId(""); setChildOtherParentName(""); setChildOtherParentSearch(""); }} className="text-stone-400 hover:text-red-500">✕</button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-2 border-2 border-stone-200 rounded-xl bg-white px-3 focus-within:border-stone-400">
                    <Search size={14} className="text-stone-300 shrink-0" />
                    <input
                      className="flex-1 p-2.5 outline-none text-sm font-bold bg-transparent"
                      placeholder="Nom du second parent…"
                      value={childOtherParentSearch}
                      onChange={(e) => setChildOtherParentSearch(e.target.value)}
                    />
                  </div>
                  {childOtherParentSearch && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-40 overflow-y-auto border border-stone-200 rounded-xl bg-white shadow-xl p-2 space-y-1">
                      {safeUsers
                        .filter((u) => u.id !== user?.id && (u.name?.toLowerCase().includes(childOtherParentSearch.toLowerCase()) || u.id?.includes(childOtherParentSearch)))
                        .slice(0, 6)
                        .map((u) => (
                          <button key={u.id} onClick={() => { setChildOtherParentId(u.id); setChildOtherParentName(u.name); setChildOtherParentSearch(""); }}
                            className="w-full text-left p-2 rounded-lg hover:bg-stone-50 flex items-center gap-2 transition-colors">
                            {u.avatarUrl ? <img src={u.avatarUrl} className="w-6 h-6 rounded-full object-cover" alt="" style={{ width: 24, height: 24, minWidth: 24, minHeight: 24, objectFit: "cover" }} /> : <User size={12} className="text-stone-400 shrink-0" />}
                            <span className="font-bold text-sm text-stone-800 truncate">{u.name}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widests text-stone-400 block">Notes (optionnel)</label>
              <textarea
                className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none text-sm font-bold min-h-[60px] focus:border-stone-300"
                placeholder="Légitimité, conditions de naissance, adoption, reconnu ou non…"
                value={childNotes}
                onChange={(e) => setChildNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={resetChildForm}
                className="flex-1 py-2.5 border-2 border-stone-200 rounded-xl text-stone-500 text-[10px] font-black uppercase hover:bg-stone-50 transition-colors">
                Annuler
              </button>
              <button
                onClick={submitChild}
                disabled={childMode === "citizen" ? !childCitizenId : !childNpcName.trim()}
                className="flex-1 py-2.5 bg-amber-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                <Baby size={12} /> Reconnaître l'enfant
              </button>
            </div>
          </div>
        ) )}
      </div>

      {managingSpouseId && (() => {
        const managedSpouse = currentSpouses.find((s) => s.id === managingSpouseId);
        if (!managedSpouse) return null;
        const managedSpouseUser = safeUsers.find((u) => u.id === managedSpouse.id);
        return (
          <SpouseRightsModal
            spouse={managedSpouse}
            spouseUser={managedSpouseUser}
            onClose={() => setManagingSpouseId(null)}
            onSetSpouseRights={onSetSpouseRights}
          />
        );
      })()}

      {requisitioningSpouseId && (() => {
        const targetSpouse = currentSpouses.find((s) => s.id === requisitioningSpouseId);
        if (!targetSpouse) return null;
        const targetSpouseUser = safeUsers.find((u) => u.id === targetSpouse.id);
        return (
          <RequisitionModal
            spouse={targetSpouse}
            spouseUser={targetSpouseUser}
            onClose={() => setRequisitioningSpouseId(null)}
            onRequisition={(payload) => onRequisitionSpouseMoney && onRequisitionSpouseMoney(payload)}
          />
        );
      })()}

      {giftingSpouseId && (() => {
        const targetSpouse = currentSpouses.find((s) => s.id === giftingSpouseId);
        if (!targetSpouse) return null;
        const targetSpouseUser = safeUsers.find((u) => u.id === targetSpouse.id);
        const pairKey = [user.id, giftingSpouseId].sort().join("_");
        return (
          <GiftModal
            spouse={targetSpouse}
            spouseUser={targetSpouseUser}
            user={user}
            inventoryCatalog={inventoryCatalog}
            gifts={coupleGifts[pairKey] || []}
            onClose={() => setGiftingSpouseId(null)}
            onSend={(payload) => onSendCoupleGift && onSendCoupleGift(giftingSpouseId, payload)}
          />
        );
      })()}

      {goalSpouseId && (() => {
        const targetSpouse = currentSpouses.find((s) => s.id === goalSpouseId);
        if (!targetSpouse) return null;
        const targetSpouseUser = safeUsers.find((u) => u.id === targetSpouse.id);
        const pairKey = [user.id, goalSpouseId].sort().join("_");
        return (
          <GoalModal
            spouse={targetSpouse}
            spouseUser={targetSpouseUser}
            user={user}
            goal={coupleGoals[pairKey] || null}
            onClose={() => setGoalSpouseId(null)}
            onSetGoal={(payload) => onSetCoupleGoal && onSetCoupleGoal(goalSpouseId, payload)}
            onContribute={(amount) => onContributeToCoupleGoal && onContributeToCoupleGoal(goalSpouseId, amount)}
            onWithdraw={() => onWithdrawCoupleGoal && onWithdrawCoupleGoal(goalSpouseId)}
            onCancel={() => onCancelCoupleGoal && onCancelCoupleGoal(goalSpouseId)}
          />
        );
      })()}

      {journalSpouseId && (() => {
        const targetSpouse = currentSpouses.find((s) => s.id === journalSpouseId);
        if (!targetSpouse) return null;
        const targetSpouseUser = safeUsers.find((u) => u.id === targetSpouse.id);
        const pairKey = [user.id, journalSpouseId].sort().join("_");
        return (
          <JournalModal
            spouse={targetSpouse}
            spouseUser={targetSpouseUser}
            user={user}
            entries={coupleJournals[pairKey] || []}
            onClose={() => setJournalSpouseId(null)}
            onAdd={(text) => onAddCoupleJournalEntry && onAddCoupleJournalEntry(journalSpouseId, text)}
            onDelete={(entryId) => onDeleteCoupleJournalEntry && onDeleteCoupleJournalEntry(journalSpouseId, entryId)}
          />
        );
      })()}

      {managingChildId && (() => {
        const managedChild = safeUsers.find((u) => u.id === managingChildId);
        if (!managedChild) return null;
        return (
          <ChildRightsModal
            child={managedChild}
            onClose={() => setManagingChildId(null)}
            onSetChildRights={(payload) => onSetChildRights && onSetChildRights(payload)}
          />
        );
      })()}

      {arrangingMarriageChildId && (() => {
        const arrangedChild = safeUsers.find((u) => u.id === arrangingMarriageChildId);
        if (!arrangedChild) return null;
        return (
          <GuardianMarriageModal
            child={arrangedChild}
            safeUsers={safeUsers}
            onClose={() => setArrangingMarriageChildId(null)}
            onPropose={(childId, targetId, contractData) => {
              onGuardianProposeMarriage && onGuardianProposeMarriage(childId, targetId, contractData);
              setArrangingMarriageChildId(null);
            }}
          />
        );
      })()}

      {editingChildId && (() => {
        const editedChild = (user.children || []).find((ch) => ch.id === editingChildId);
        if (!editedChild) return null;
        return (
          <EditChildModal
            child={editedChild}
            gameDate={gd}
            onClose={() => setEditingChildId(null)}
            onSave={(payload) => {
              onUpdateChildInfo && onUpdateChildInfo(editedChild.id, payload);
              setEditingChildId(null);
            }}
          />
        );
      })()}

      {createdAccountInfo && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setCreatedAccountInfo(null); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-stone-100 bg-emerald-50">
              <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center flex-shrink-0">
                <UserPlus size={16} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-base text-stone-900 truncate">Compte créé</div>
                <div className="text-[10px] text-stone-500">Transmettez ces identifiants à la personne qui incarnera {createdAccountInfo.name}.</div>
              </div>
              <button onClick={() => setCreatedAccountInfo(null)} className="text-stone-400 hover:text-stone-700 flex-shrink-0 p-1 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-1">Identifiant</label>
                <div className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-mono text-stone-800">{createdAccountInfo.id}</div>
              </div>
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-1">Mot de passe</label>
                <div className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-mono text-stone-800">{createdAccountInfo.password}</div>
              </div>
              <p className="text-[9px] text-stone-400 italic">Ces identifiants ne seront plus affichés — notez-les avant de fermer.</p>
              <button onClick={() => setCreatedAccountInfo(null)}
                className="w-full py-2.5 bg-emerald-600 text-white text-xs font-black uppercase rounded-xl hover:bg-emerald-500 transition-colors">
                C'est noté
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarriageView;
