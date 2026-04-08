import React, { useState } from "react";
import {
  HeartHandshake,
  Search,
  Plus,
  Save,
  X,
  Trash2,
  Edit3,
  Users,
  GitBranch,
  Coins,
  ArrowRightLeft,
  History,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { formatMoney } from "../../lib/gameUtils";

/* ── Helpers communs ── */
const Label = ({ children }) => (
  <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-1">{children}</label>
);
const Input = (props) => (
  <input {...props} className={`w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-amber-500/50 ${props.className || ""}`} />
);
const BtnPrimary = ({ children, onClick, disabled, className = "" }) => (
  <button onClick={onClick} disabled={disabled}
    className={`py-2.5 bg-amber-900/50 border border-amber-800/50 text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-900/70 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none ${className}`}>
    {children}
  </button>
);
const BtnSecondary = ({ children, onClick, className = "" }) => (
  <button onClick={onClick}
    className={`px-4 py-2 bg-stone-800 text-stone-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-stone-700 hover:text-stone-200 transition-all ${className}`}>
    {children}
  </button>
);

/* ── Constantes ── */
const FAMILY_TYPES = [
  { id: "commune", label: "Famille commune", icon: "🏠", desc: "Famille ordinaire, sans titre de noblesse." },
  { id: "noble",   label: "Maison noble",    icon: "⚜️",  desc: "Dynastie noble avec branches principales et cadettes." },
];

const EMPTY_FORM = {
  lastName: "", type: "commune",
  dynastyName: "",
  branches: [],
  coat: "", motto: "", description: "", foundedYear: "",
  extraMemberIds: [],
  headId: "",
  treasury: 0,
};

/* ── Normaliser les branches (rétrocompat anciennes données) ── */
export const normalizeBranches = (fam) => {
  if (Array.isArray(fam.branches) && fam.branches.length > 0) return fam.branches;
  // Format legacy : houseName + dynastyName sans branches[]
  if (fam.type === "noble") {
    const dynName = fam.dynastyName || fam.lastName;
    const main = { name: dynName, lastName: dynName, isMain: true };
    if (fam.houseName && fam.houseName.toLowerCase() !== dynName.toLowerCase()) {
      return [main, { name: fam.houseName, lastName: fam.lastName || fam.houseName, isMain: false }];
    }
    return [main];
  }
  return [];
};

export const getFamilyDisplayName = (fam) => {
  if (fam.type === "noble") {
    return `Dynastie ${fam.dynastyName || fam.lastName}`;
  }
  return `Famille ${fam.lastName}`;
};

export const getBranchDisplayName = (branch, fam) => {
  if (branch.isMain) return `Branche principale (${fam.dynastyName || branch.name})`;
  return `Maison ${branch.name}`;
};

export const getFamilyMembers = (fam, citizens) => {
  if (fam.type === "noble") {
    const branches = normalizeBranches(fam);
    const byBranch = branches.flatMap((b) =>
      citizens.filter((c) => c.lastName && b.lastName && c.lastName.toLowerCase() === b.lastName.toLowerCase())
    );
    const extra = (fam.extraMemberIds || []).map((id) => citizens.find((c) => c.id === id)).filter(Boolean);
    const all = [...byBranch];
    extra.forEach((c) => { if (!all.find((x) => x.id === c.id)) all.push(c); });
    return all;
  }
  const byName = citizens.filter((c) => c.lastName && c.lastName.toLowerCase() === fam.lastName.toLowerCase());
  const extra = (fam.extraMemberIds || []).map((id) => citizens.find((c) => c.id === id)).filter(Boolean);
  const all = [...byName];
  extra.forEach((c) => { if (!all.find((x) => x.id === c.id)) all.push(c); });
  return all;
};

export const getFamilyForCitizen = (citizen, families) => {
  if (!Array.isArray(families)) return null;
  return families.find((f) => {
    if (f.type === "noble") {
      const branches = normalizeBranches(f);
      const byBranch = branches.some((b) => citizen.lastName && b.lastName && citizen.lastName.toLowerCase() === b.lastName.toLowerCase());
      const byExtra = (f.extraMemberIds || []).includes(citizen.id);
      return byBranch || byExtra;
    }
    const byName = citizen.lastName && f.lastName && citizen.lastName.toLowerCase() === f.lastName.toLowerCase();
    const byExtra = (f.extraMemberIds || []).includes(citizen.id);
    return byName || byExtra;
  }) || null;
};

export const getBranchForCitizen = (citizen, fam) => {
  if (!fam || fam.type !== "noble") return null;
  const branches = normalizeBranches(fam);
  return branches.find((b) => citizen.lastName && b.lastName && citizen.lastName.toLowerCase() === b.lastName.toLowerCase()) || null;
};

/* ── Composant principal ── */
const FamiliesAdminView = ({ state, onUpdateState, notify }) => {
  const safeCitizens = Array.isArray(state.citizens) ? state.citizens : [];
  const safeFamilies = Array.isArray(state.families) ? state.families : [];

  const [view,        setView]        = useState("list");
  const [editingId,   setEditingId]   = useState(null);
  const [detailId,    setDetailId]    = useState(null);
  const [detailTab,   setDetailTab]   = useState("members"); // "members" | "treasury"
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [search,      setSearch]      = useState("");
  const [addMemberId, setAddMemberId] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchLastName, setNewBranchLastName] = useState("");
  // Treasury admin controls
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [transferToFamId, setTransferToFamId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferReason, setTransferReason] = useState("");

  const generateId = () => `FAM-${Date.now().toString(36).toUpperCase()}`;
  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setView("form"); };
  const openEdit = (fam) => {
    const branches = normalizeBranches(fam);
    setForm({ ...EMPTY_FORM, ...fam, branches });
    setEditingId(fam.id);
    setView("form");
  };

  const saveForm = () => {
    if (form.type === "commune" && !form.lastName.trim()) {
      notify("Le nom de famille est requis.", "error"); return;
    }
    if (form.type === "noble" && !form.dynastyName.trim()) {
      notify("Le nom de la dynastie est requis.", "error"); return;
    }
    // Pour les nobles, s'assurer qu'il y a au moins la branche principale
    let branches = form.branches || [];
    if (form.type === "noble") {
      const hasMain = branches.some((b) => b.isMain);
      if (!hasMain) {
        branches = [{ name: form.dynastyName.trim(), lastName: form.dynastyName.trim(), isMain: true }, ...branches];
      }
    }
    const toSave = { ...form, branches };
    // Nettoyer les champs legacy
    delete toSave.houseName;

    if (editingId) {
      onUpdateState({ ...state, families: safeFamilies.map((f) => f.id === editingId ? { ...f, ...toSave, id: editingId } : f) });
      notify("Famille mise à jour.", "success");
    } else {
      const checkName = form.type === "noble" ? form.dynastyName.trim() : form.lastName.trim();
      const dup = safeFamilies.find((f) => {
        const existing = f.type === "noble" ? (f.dynastyName || f.lastName) : f.lastName;
        return existing.toLowerCase() === checkName.toLowerCase();
      });
      if (dup) { notify("Une famille/dynastie avec ce nom existe déjà.", "error"); return; }
      onUpdateState({ ...state, families: [...safeFamilies, { ...toSave, id: generateId() }] });
      notify("Famille créée.", "success");
    }
    setView("list"); setEditingId(null);
  };

  const deleteFamily = (id) => {
    onUpdateState({ ...state, families: safeFamilies.filter((f) => f.id !== id) });
    notify("Famille supprimée.", "info");
    if (detailId === id) { setDetailId(null); setView("list"); }
  };

  const addBranch = () => {
    if (!newBranchName.trim()) return;
    const ln = newBranchLastName.trim() || newBranchName.trim();
    const exists = (form.branches || []).some((b) => b.name.toLowerCase() === newBranchName.trim().toLowerCase());
    if (exists) { notify("Cette branche existe déjà.", "error"); return; }
    setForm({ ...form, branches: [...(form.branches || []), { name: newBranchName.trim(), lastName: ln, isMain: false }] });
    setNewBranchName("");
    setNewBranchLastName("");
  };

  const removeBranch = (idx) => {
    const branch = form.branches[idx];
    if (branch.isMain) { notify("Impossible de supprimer la branche principale.", "error"); return; }
    setForm({ ...form, branches: form.branches.filter((_, i) => i !== idx) });
  };

  const addExtraMember = (famId) => {
    if (!addMemberId) return;
    const fam = safeFamilies.find((f) => f.id === famId);
    if (!fam) return;
    if ((fam.extraMemberIds || []).includes(addMemberId)) { notify("Déjà membre.", "error"); return; }
    onUpdateState({ ...state, families: safeFamilies.map((f) => f.id === famId ? { ...f, extraMemberIds: [...(f.extraMemberIds || []), addMemberId] } : f) });
    notify("Membre ajouté.", "success");
    setAddMemberId("");
  };

  const removeExtraMember = (famId, citizenId) => {
    onUpdateState({ ...state, families: safeFamilies.map((f) => f.id === famId ? { ...f, extraMemberIds: (f.extraMemberIds || []).filter((x) => x !== citizenId) } : f) });
    notify("Membre retiré.", "info");
  };

  const adminAdjustTreasury = (famId, delta, reason) => {
    const amt = parseInt(delta);
    if (!amt || amt === 0) { notify("Montant invalide.", "error"); return; }
    const ts = Date.now();
    const type = amt > 0 ? "admin_add" : "admin_remove";
    const label = `${amt > 0 ? "Ajout admin" : "Prélèvement admin"} (${reason || "Correction GM"})`;
    onUpdateState({
      ...state,
      families: safeFamilies.map((f) => {
        if (f.id !== famId) return f;
        const newTreasury = Math.max(0, (f.treasury || 0) + amt);
        return { ...f, treasury: newTreasury, treasuryLog: [{ id: ts, type, amount: Math.abs(amt), label, timestamp: ts }, ...(f.treasuryLog || [])].slice(0, 60) };
      }),
    });
    notify(`Trésorerie ajustée de ${amt > 0 ? "+" : ""}${formatMoney(amt)}.`, "success");
    setAdjustAmount(""); setAdjustReason("");
  };

  const adminTransferTreasury = (fromFamId, toFamId, amount, reason) => {
    const amt = parseInt(amount);
    if (!amt || amt <= 0) { notify("Montant invalide.", "error"); return; }
    if (fromFamId === toFamId) { notify("Impossible de transférer vers la même famille.", "error"); return; }
    const fromFam = safeFamilies.find((f) => f.id === fromFamId);
    const toFam = safeFamilies.find((f) => f.id === toFamId);
    if (!fromFam || !toFam) return;
    if ((fromFam.treasury || 0) < amt) { notify("Fonds insuffisants.", "error"); return; }
    const ts = Date.now();
    const fromName = fromFam.dynastyName || fromFam.lastName;
    const toName = toFam.dynastyName || toFam.lastName;
    const motif = reason || "Transfert admin";
    onUpdateState({
      ...state,
      globalLedger: [{ id: ts, fromName: `Famille: ${fromName}`, toName: `Famille: ${toName}`, amount: amt, timestamp: ts, reason: motif, type: "FAMILY_TRANSFER" }, ...(state.globalLedger || [])],
      families: safeFamilies.map((f) => {
        if (f.id === fromFamId) return { ...f, treasury: (f.treasury || 0) - amt, treasuryLog: [{ id: ts, type: "transfer_out", amount: amt, label: `Virement vers ${toName} — ${motif}`, timestamp: ts }, ...(f.treasuryLog || [])].slice(0, 60) };
        if (f.id === toFamId) return { ...f, treasury: (f.treasury || 0) + amt, treasuryLog: [{ id: ts, type: "transfer_in", amount: amt, label: `Virement reçu de ${fromName} — ${motif}`, timestamp: ts }, ...(f.treasuryLog || [])].slice(0, 60) };
        return f;
      }),
    });
    notify(`${formatMoney(amt)} transférés de ${fromName} vers ${toName}.`, "success");
    setTransferToFamId(""); setTransferAmount(""); setTransferReason("");
  };

  const filtered = safeFamilies.filter((f) =>
    getFamilyDisplayName(f).toLowerCase().includes(search.toLowerCase()) ||
    f.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    f.dynastyName?.toLowerCase().includes(search.toLowerCase())
  );
  const detailFam = safeFamilies.find((f) => f.id === detailId) || null;

  /* ── FORMULAIRE ── */
  if (view === "form") return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 pb-2 border-b border-stone-700">
        <button onClick={() => setView("list")} className="text-stone-500 hover:text-stone-300 transition-colors p-1"><X size={16} /></button>
        <h2 className="text-sm font-black uppercase tracking-widest text-stone-200 flex items-center gap-2">
          <HeartHandshake size={16} className="text-amber-400" />
          {editingId ? "Modifier la famille" : "Nouvelle famille"}
        </h2>
      </div>
      <div className="bg-stone-800/40 border border-stone-700 rounded-xl p-5 space-y-4">

        {/* Type */}
        <div>
          <Label>Type de famille</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {FAMILY_TYPES.map((t) => (
              <button key={t.id} type="button" onClick={() => setForm({ ...form, type: t.id })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all ${
                  form.type === t.id ? "bg-amber-900/30 border-amber-700 text-amber-300" : "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200"
                }`}>
                <span className="text-base">{t.icon}</span>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest">{t.label}</div>
                  <div className="text-[9px] opacity-60">{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Commune : Nom + blason */}
        {form.type === "commune" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Nom de famille *</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="ex: Durand" />
              <div className="text-[9px] text-stone-500 mt-1">Lie automatiquement tous les citoyens portant ce nom.</div>
            </div>
            <div>
              <Label>Blason / Symbole</Label>
              <Input value={form.coat} onChange={(e) => setForm({ ...form, coat: e.target.value })} placeholder="Emoji : 🦁 🐍 ⚔️ 🌹…" />
            </div>
          </div>
        )}

        {/* Noble : Dynastie + branches */}
        {form.type === "noble" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-yellow-900/10 border border-yellow-900/30 rounded-lg">
              <div className="md:col-span-2 text-[9px] font-black uppercase tracking-widest text-yellow-600 flex items-center gap-1">
                ⚜️ Dynastie Noble
              </div>
              <div>
                <Label>Nom de la Dynastie *</Label>
                <Input value={form.dynastyName} onChange={(e) => setForm({ ...form, dynastyName: e.target.value })} placeholder="ex: Loro" />
                <div className="text-[9px] text-stone-500 mt-1">La branche principale porte ce nom de famille.</div>
              </div>
              <div>
                <Label>Blason / Symbole</Label>
                <Input value={form.coat} onChange={(e) => setForm({ ...form, coat: e.target.value })} placeholder="Emoji : 🦁 🐍 ⚔️ 🌹…" />
              </div>
            </div>

            {/* Branches cadettes */}
            <div className="p-3 bg-stone-800/60 border border-stone-600 rounded-lg space-y-3">
              <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-1">
                <GitBranch size={10} /> Branches de la Dynastie
              </div>

              {/* Branche principale (auto) */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-900/20 border border-yellow-800/40">
                <span className="text-yellow-400 text-xs">👑</span>
                <span className="text-xs text-yellow-300 font-bold flex-1">
                  Branche principale — {form.dynastyName || "…"}
                </span>
                <span className="text-[8px] text-yellow-600 uppercase font-black tracking-widest">auto</span>
              </div>

              {/* Branches cadettes existantes */}
              {(form.branches || []).filter((b) => !b.isMain).map((b, idx) => {
                const realIdx = (form.branches || []).indexOf(b);
                return (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-700/50 border border-stone-600">
                    <span className="text-stone-400 text-xs">⚜️</span>
                    <span className="text-xs text-stone-200 font-bold flex-1">
                      Maison {b.name}
                    </span>
                    <span className="text-[9px] text-stone-500">nom: {b.lastName}</span>
                    <button onClick={() => removeBranch(realIdx)} className="text-red-500/50 hover:text-red-400 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                );
              })}

              {/* Ajouter une branche cadette */}
              <div className="border-t border-stone-600 pt-3">
                <div className="text-[9px] text-stone-500 mb-2">Ajouter une branche cadette (maison)</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <Input value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)}
                      placeholder="Nom de la maison" className="text-xs" />
                  </div>
                  <div>
                    <Input value={newBranchLastName} onChange={(e) => setNewBranchLastName(e.target.value)}
                      placeholder="Nom de famille (auto)" className="text-xs" />
                  </div>
                  <BtnPrimary onClick={addBranch} className="px-3"><Plus size={14} /> Ajouter</BtnPrimary>
                </div>
                <div className="text-[9px] text-stone-600 mt-1">
                  Le nom de famille lie automatiquement les citoyens à cette branche. Par défaut = nom de la maison.
                </div>
              </div>
            </div>
          </>
        )}

        {/* Chef de famille */}
        <div className="p-3 bg-stone-800/60 border border-stone-600 rounded-lg space-y-2">
          <Label>Chef de famille</Label>
          <select value={form.headId || ""} onChange={(e) => setForm({ ...form, headId: e.target.value || "" })}
            className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-amber-500/50">
            <option value="">— Aucun chef désigné —</option>
            {safeCitizens.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : c.name}
              </option>
            ))}
          </select>
          <div className="text-[9px] text-stone-500">Le chef peut gérer la trésorerie et les informations familiales depuis son espace citoyen.</div>
        </div>

        {/* Régent (nobles uniquement) */}
        {form.type === "noble" && (
          <div className="p-3 bg-purple-900/10 border border-purple-900/30 rounded-lg space-y-2">
            <Label>Régent (optionnel)</Label>
            <select value={form.regentId || ""} onChange={(e) => setForm({ ...form, regentId: e.target.value || "" })}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-purple-500/50">
              <option value="">— Aucun régent —</option>
              {safeCitizens.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : c.name}
                </option>
              ))}
            </select>
            <div className="text-[9px] text-stone-500">Le régent possède les mêmes pouvoirs que le chef : trésorerie, édition des informations. Seul le chef peut le nommer ou le révoquer.</div>
          </div>
        )}

        {/* Trésorerie : lecture seule — modification via frappe impériale uniquement */}
        <div>
          <Label>Trésorerie familiale (Écus)</Label>
          <div className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-sm font-mono text-yellow-400 opacity-70 cursor-not-allowed select-none">
            {formatMoney((form.treasury || 0))} — géré par la frappe impériale
          </div>
        </div>

        <div>
          <Label>Devise / Motto</Label>
          <Input value={form.motto} onChange={(e) => setForm({ ...form, motto: e.target.value })} placeholder="ex: Toujours fidèle…" />
        </div>
        <div>
          <Label>Description / Histoire</Label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Origine, histoire, réputation…" rows={3}
            className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 outline-none focus:border-amber-500/50 resize-none" />
        </div>
        <div>
          <Label>Année de fondation (RP)</Label>
          <Input type="number" value={form.foundedYear} onChange={(e) => setForm({ ...form, foundedYear: e.target.value })} placeholder="ex: 1150" />
        </div>

        <div className="flex gap-2 pt-2">
          <BtnPrimary onClick={saveForm} className="flex-1"><Save size={14} /> {editingId ? "Sauvegarder" : "Créer la famille"}</BtnPrimary>
          <BtnSecondary onClick={() => setView("list")}><X size={14} /></BtnSecondary>
        </div>
      </div>
    </div>
  );

  /* ── DÉTAIL ── */
  if (view === "detail" && detailFam) {
    const branches = normalizeBranches(detailFam);
    const allMembers = getFamilyMembers(detailFam, safeCitizens);
    const extraIds = detailFam.extraMemberIds || [];
    const nonMembers = safeCitizens.filter((c) => !allMembers.find((m) => m.id === c.id));
    const otherFamilies = safeFamilies.filter((f) => f.id !== detailFam.id);
    const treasuryLog = detailFam.treasuryLog || [];

    const logIcon = (type) => {
      if (type === "deposit") return <ArrowDownLeft size={11} className="text-green-400" />;
      if (type === "withdraw") return <ArrowUpRight size={11} className="text-amber-400" />;
      if (type === "transfer_out") return <ArrowUpRight size={11} className="text-red-400" />;
      if (type === "transfer_in") return <ArrowDownLeft size={11} className="text-blue-400" />;
      if (type === "admin_add") return <TrendingUp size={11} className="text-emerald-400" />;
      if (type === "admin_remove") return <TrendingDown size={11} className="text-rose-400" />;
      return <Coins size={11} className="text-stone-400" />;
    };
    const logColor = (type) => {
      if (type === "deposit" || type === "transfer_in" || type === "admin_add") return "text-green-400";
      return "text-red-400";
    };
    const logSign = (type) => (type === "deposit" || type === "transfer_in" || type === "admin_add") ? "+" : "-";

    return (
      <div className="space-y-4 max-w-4xl">
        <div className="flex items-center gap-3 pb-2 border-b border-stone-700">
          <button onClick={() => { setView("list"); setDetailTab("members"); }} className="text-stone-500 hover:text-stone-300 transition-colors p-1"><X size={16} /></button>
          <div className="text-4xl">{detailFam.coat || (detailFam.type === "noble" ? "⚜️" : "🏠")}</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-black uppercase tracking-widest text-stone-200 flex items-center gap-2">
              <HeartHandshake size={16} className="text-amber-400" />
              {getFamilyDisplayName(detailFam)}
            </h2>
            {detailFam.motto && <div className="text-[10px] text-stone-500 italic mt-0.5">« {detailFam.motto} »</div>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <div className="bg-amber-900/30 border border-amber-800/50 rounded-lg px-3 py-1.5 text-right">
              <div className="text-[8px] text-amber-600 uppercase font-black tracking-widest">Trésorerie</div>
              <div className="text-sm font-black font-mono text-amber-300">{formatMoney((detailFam.treasury || 0))}</div>
            </div>
            <button onClick={() => openEdit(detailFam)} className="text-stone-500 hover:text-stone-300 p-1.5 rounded hover:bg-stone-800 transition-all"><Edit3 size={14} /></button>
          </div>
        </div>

        {/* Fiche synthèse */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: "Type", value: detailFam.type === "noble" ? "Dynastie noble" : "Famille commune", color: detailFam.type === "noble" ? "text-yellow-400" : "text-stone-300" },
            { label: "Membres", value: allMembers.length, color: "text-stone-200" },
            detailFam.type === "noble" && { label: "Branches", value: branches.length, color: "text-stone-200" },
            detailFam.foundedYear && { label: "Fondée en", value: detailFam.foundedYear, color: "text-stone-400" },
          ].filter(Boolean).map((s, i) => (
            <div key={i} className="bg-stone-800/40 border border-stone-700 rounded-lg px-3 py-2">
              <div className="text-[8px] text-stone-500 uppercase font-black tracking-widest">{s.label}</div>
              <div className={`text-sm font-black mt-0.5 ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Chef / Régent */}
        <div className="flex gap-2 flex-wrap">
          {detailFam.headId && (() => {
            const head = safeCitizens.find((c) => c.id === detailFam.headId);
            return <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-amber-400 text-xs">👑</span>
              <div>
                <div className="text-[8px] text-amber-600 uppercase font-black">Chef de famille</div>
                <div className="text-xs text-amber-300 font-bold">{head ? (head.firstName ? `${head.firstName} ${head.lastName || ""}`.trim() : head.name) : "Inconnu"}</div>
              </div>
            </div>;
          })()}
          {detailFam.regentId && (() => {
            const rg = safeCitizens.find((c) => c.id === detailFam.regentId);
            return <div className="bg-purple-900/20 border border-purple-800/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-purple-400 text-xs">🛡️</span>
              <div>
                <div className="text-[8px] text-purple-600 uppercase font-black">Régent</div>
                <div className="text-xs text-purple-300 font-bold">{rg ? (rg.firstName ? `${rg.firstName} ${rg.lastName || ""}`.trim() : rg.name) : "Inconnu"}</div>
              </div>
            </div>;
          })()}
          {detailFam.description && <div className="text-[10px] text-stone-400 italic flex-1 min-w-0 self-center">{detailFam.description}</div>}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-stone-700 pb-0">
          {[
            { id: "members", label: "Membres", icon: <Users size={12} /> },
            { id: "treasury", label: "Trésorerie", icon: <Coins size={12} /> },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setDetailTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 -mb-px transition-all ${
                detailTab === tab.id ? "border-amber-500 text-amber-300" : "border-transparent text-stone-500 hover:text-stone-300"
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* === TAB MEMBRES === */}
        {detailTab === "members" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {detailFam.type === "noble" ? (
              branches.map((branch, bIdx) => {
                const branchMembers = safeCitizens.filter(
                  (c) => c.lastName && branch.lastName && c.lastName.toLowerCase() === branch.lastName.toLowerCase()
                );
                return (
                  <div key={bIdx} className="bg-stone-800/40 border border-stone-700 rounded-xl p-4">
                    <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
                      {branch.isMain ? "👑" : "⚜️"}
                      {branch.isMain ? `Branche principale — ${branch.name}` : `Maison ${branch.name}`}
                      <span className="text-stone-600 ml-auto">({branchMembers.length})</span>
                    </div>
                    {branchMembers.length === 0 ? (
                      <div className="text-xs text-stone-600 text-center py-3 italic">Aucun membre (nom: {branch.lastName})</div>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {branchMembers.map((c) => (
                          <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800/50">
                            <div className="w-6 h-6 rounded bg-stone-700 flex items-center justify-center text-[10px] font-black text-stone-400 shrink-0">
                              {(c.firstName || c.name || "?")[0].toUpperCase()}
                            </div>
                            <span className="text-xs text-stone-200 font-bold flex-1 truncate">
                              {c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : c.name}
                            </span>
                            <span className="text-[9px] text-stone-500 shrink-0">{c.occupation || "Citoyen"}</span>
                            {c.id === detailFam.headId && <span className="text-amber-400 text-[9px]">👑</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-stone-800/40 border border-stone-700 rounded-xl p-4 md:col-span-2">
                <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-1">
                  <Users size={10} /> Membres ({allMembers.length})
                </div>
                {allMembers.length === 0 ? (
                  <div className="text-xs text-stone-600 text-center py-6 italic">Aucun membre actuellement</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-56 overflow-y-auto">
                    {allMembers.map((c) => {
                      const isExtra = extraIds.includes(c.id);
                      return (
                        <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800/50">
                          <div className="w-6 h-6 rounded bg-stone-700 flex items-center justify-center text-[10px] font-black text-stone-400 shrink-0">
                            {(c.firstName || c.name || "?")[0].toUpperCase()}
                          </div>
                          <span className="text-xs text-stone-200 font-bold flex-1 truncate">
                            {c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : c.name}
                          </span>
                          <span className="text-[9px] text-stone-500 shrink-0">{c.occupation || "Citoyen"}</span>
                          {isExtra ? (
                            <button onClick={() => removeExtraMember(detailFam.id, c.id)} className="text-red-500/50 hover:text-red-400 transition-colors shrink-0"><X size={12} /></button>
                          ) : (
                            <span className="text-[8px] text-stone-600 shrink-0">auto</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {detailFam.type === "noble" && extraIds.length > 0 && (
              <div className="bg-stone-800/40 border border-stone-700 rounded-xl p-4">
                <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-1">
                  <Users size={10} /> Membres manuels ({extraIds.length})
                </div>
                <div className="space-y-1.5">
                  {extraIds.map((id) => {
                    const c = safeCitizens.find((x) => x.id === id);
                    if (!c) return null;
                    return (
                      <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800/50">
                        <div className="w-6 h-6 rounded bg-stone-700 flex items-center justify-center text-[10px] font-black text-stone-400 shrink-0">
                          {(c.firstName || c.name || "?")[0].toUpperCase()}
                        </div>
                        <span className="text-xs text-stone-200 font-bold flex-1 truncate">
                          {c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : c.name}
                        </span>
                        <button onClick={() => removeExtraMember(detailFam.id, c.id)} className="text-red-500/50 hover:text-red-400 transition-colors shrink-0"><X size={12} /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-stone-800/40 border border-stone-700 rounded-xl p-4 md:col-span-2">
              <div className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-2">Ajouter un membre manuellement</div>
              <div className="flex gap-2">
                <select value={addMemberId} onChange={(e) => setAddMemberId(e.target.value)}
                  className="flex-1 bg-stone-800 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 outline-none focus:border-amber-500/50">
                  <option value="">— Choisir un citoyen —</option>
                  {nonMembers.map((c) => (
                    <option key={c.id} value={c.id}>{c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : c.name}</option>
                  ))}
                </select>
                <BtnPrimary onClick={() => addExtraMember(detailFam.id)} className="px-3"><Plus size={14} /></BtnPrimary>
              </div>
              <div className="text-[9px] text-stone-500 mt-1.5">
                {detailFam.type === "noble"
                  ? `Liés automatiquement par le nom de famille de chaque branche. Ce champ sert pour les membres à nom différent.`
                  : `Les citoyens portant le nom « ${detailFam.lastName} » sont liés automatiquement.`}
              </div>
            </div>
          </div>
        )}

        {/* === TAB TRÉSORERIE === */}
        {detailTab === "treasury" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Ajustement direct */}
            <div className="bg-stone-800/40 border border-stone-700 rounded-xl p-4 space-y-3">
              <div className="text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                <Coins size={11} /> Ajustement direct (GM)
              </div>
              <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] text-amber-600 uppercase font-black">Solde actuel</span>
                <span className="font-black font-mono text-amber-300 text-sm">{formatMoney((detailFam.treasury || 0))}</span>
              </div>
              <div className="space-y-2">
                <div>
                  <Label>Montant (positif = ajouter, négatif = retirer)</Label>
                  <Input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} placeholder="ex: 500 ou -200" />
                </div>
                <div>
                  <Label>Motif</Label>
                  <Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="ex: Correction, tribut reçu…" />
                </div>
                <BtnPrimary onClick={() => adminAdjustTreasury(detailFam.id, adjustAmount, adjustReason)} disabled={!adjustAmount} className="w-full">
                  <TrendingUp size={13} /> Appliquer l'ajustement
                </BtnPrimary>
              </div>
            </div>

            {/* Transfert vers une autre famille */}
            <div className="bg-stone-800/40 border border-stone-700 rounded-xl p-4 space-y-3">
              <div className="text-[9px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                <ArrowRightLeft size={11} /> Virement vers une autre famille
              </div>
              <div className="space-y-2">
                <div>
                  <Label>Famille destinataire</Label>
                  <select value={transferToFamId} onChange={(e) => setTransferToFamId(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-xs text-stone-200 outline-none focus:border-blue-500/50">
                    <option value="">— Choisir une famille —</option>
                    {otherFamilies.map((f) => (
                      <option key={f.id} value={f.id}>{getFamilyDisplayName(f)} — {formatMoney((f.treasury || 0))}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Montant</Label>
                  <Input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="Montant en Écus" />
                </div>
                <div>
                  <Label>Motif du virement</Label>
                  <Input value={transferReason} onChange={(e) => setTransferReason(e.target.value)} placeholder="ex: Tribut, dot, remboursement…" />
                </div>
                <BtnPrimary
                  onClick={() => adminTransferTreasury(detailFam.id, transferToFamId, transferAmount, transferReason)}
                  disabled={!transferToFamId || !transferAmount}
                  className="w-full">
                  <ArrowRightLeft size={13} /> Effectuer le virement
                </BtnPrimary>
              </div>
            </div>

            {/* Historique des transactions */}
            <div className="md:col-span-2 bg-stone-800/40 border border-stone-700 rounded-xl p-4 space-y-3">
              <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
                <History size={11} /> Historique des transactions ({treasuryLog.length})
              </div>
              {treasuryLog.length === 0 ? (
                <div className="text-xs text-stone-600 text-center py-6 italic">Aucune transaction enregistrée</div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {treasuryLog.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-stone-800/50 hover:bg-stone-700/40 transition-colors">
                      <div className="shrink-0">{logIcon(entry.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-stone-300 truncate">{entry.label}</div>
                        <div className="text-[9px] text-stone-600">{new Date(entry.timestamp).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                      <div className={`font-black font-mono text-xs shrink-0 ${logColor(entry.type)}`}>
                        {logSign(entry.type)}{formatMoney(entry.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── LISTE ── */
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-stone-200 flex items-center gap-2">
            <HeartHandshake size={16} className="text-amber-400" /> Familles & Dynasties Nobles
          </h2>
          <p className="text-[9px] text-stone-500 mt-0.5 uppercase tracking-widest">Gestion HRP — non visible des personnages</p>
        </div>
        <BtnPrimary onClick={openCreate} className="px-4 shrink-0"><Plus size={14} /> Nouvelle famille</BtnPrimary>
      </div>

      <div className="relative">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Chercher une famille, dynastie ou nom…"
          className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-8 pr-3 py-2 text-xs text-stone-200 outline-none focus:border-amber-500/50" />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-600 gap-3 border border-dashed border-stone-700 rounded-xl">
          <HeartHandshake size={36} className="opacity-30" />
          <div className="text-xs font-bold uppercase tracking-widest">Aucune famille enregistrée</div>
          <button onClick={openCreate} className="text-amber-500 text-xs underline">Créer la première famille</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((fam) => {
            const members = getFamilyMembers(fam, safeCitizens);
            const branches = normalizeBranches(fam);
            return (
              <div key={fam.id} className={`bg-stone-800/40 border rounded-xl p-4 flex flex-col gap-3 hover:border-stone-600 transition-all ${
                fam.type === "noble" ? "border-yellow-900/60" : "border-stone-700"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-2xl shrink-0 ${
                    fam.type === "noble" ? "bg-yellow-900/20 border border-yellow-800/40" : "bg-stone-700/50 border border-stone-600"
                  }`}>
                    {fam.coat || (fam.type === "noble" ? "⚜️" : "🏠")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-stone-200 truncate">{getFamilyDisplayName(fam)}</div>
                    {fam.type === "noble" && branches.length > 1 && (
                      <div className="text-[9px] text-stone-500 mt-0.5 truncate">
                        {branches.filter((b) => !b.isMain).map((b) => `Maison ${b.name}`).join(", ")}
                      </div>
                    )}
                    {fam.motto && <div className="text-[9px] text-stone-500 italic truncate mt-0.5">« {fam.motto} »</div>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                        fam.type === "noble"
                          ? "bg-yellow-900/30 text-yellow-400 border-yellow-800/40"
                          : "bg-stone-700 text-stone-400 border-stone-600"
                      }`}>
                        {fam.type === "noble" ? "Dynastie" : "Commune"}
                      </span>
                      {fam.type === "noble" && (
                        <span className="text-[9px] text-stone-500">
                          {branches.length} branche{branches.length > 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="text-[9px] text-stone-500">
                        {members.length} membre{members.length > 1 ? "s" : ""}
                      </span>
                      {fam.foundedYear && (
                        <span className="text-[9px] text-stone-600">· {fam.foundedYear}</span>
                      )}
                      {(fam.treasury || 0) > 0 && (
                        <span className="text-[9px] text-amber-500 font-mono font-bold">{formatMoney((fam.treasury || 0))}</span>
                      )}
                    </div>
                    {fam.headId && (() => {
                      const head = safeCitizens.find((c) => c.id === fam.headId);
                      return head ? (
                        <div className="text-[9px] text-amber-400 mt-0.5 flex items-center gap-1">
                          👑 Chef : {head.firstName ? `${head.firstName} ${head.lastName || ""}`.trim() : head.name}
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
                <div className="flex gap-1.5 pt-1 border-t border-stone-700/60">
                  <button onClick={() => { setDetailId(fam.id); setView("detail"); }}
                    className="flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-200 hover:bg-stone-700/50 rounded-lg transition-all">
                    Détails
                  </button>
                  <button onClick={() => openEdit(fam)}
                    className="flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-200 hover:bg-stone-700/50 rounded-lg transition-all">
                    Modifier
                  </button>
                  <button onClick={() => deleteFamily(fam.id)}
                    className="px-2 py-1.5 text-red-500/40 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FamiliesAdminView;
