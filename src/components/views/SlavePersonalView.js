import React, { useState } from "react";
import {
  ShieldAlert,
  Eye,
  EyeOff,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Coins,
  AlertTriangle,
  User,
  Banknote,
  Landmark,
  CreditCard,
} from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";
import { formatMoney } from "../../lib/gameUtils";

const SlavePersonalView = ({
  user,
  users = [],
  companies = [],
  countries = [],
  owner,
  onHideMoney,
  onWithdrawHiddenMoney,
  onHiddenTransfer,
}) => {
  const [hideAmount, setHideAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [transferTargetType, setTransferTargetType] = useState("CITIZEN");
  const [transferTarget, setTransferTarget] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const safeCompanies = Array.isArray(companies) ? companies : [];
  const safeCountries = Array.isArray(countries) ? countries : [];

  const hiddenBalance = user.hiddenBalance || 0;
  const visibleBalance = user.balance || 0;

  // Calcul du risque pour l'affichage
  const hideAmtNum = parseInt(hideAmount) || 0;
  const detectionRisk =
    hideAmtNum > 0 ? Math.min(100, 10 + Math.floor(hideAmtNum / 15) * 5) : 0;

  const handleHide = () => {
    if (hideAmtNum <= 0) return;
    onHideMoney(hideAmtNum);
    setHideAmount("");
  };

  const handleWithdraw = () => {
    const amt = parseInt(withdrawAmount) || 0;
    if (amt <= 0) return;
    onWithdrawHiddenMoney(amt);
    setWithdrawAmount("");
  };

  const handleHiddenTransfer = () => {
    if (!transferTarget || !transferAmount) return;
    const amt = parseInt(transferAmount);
    if (amt <= 0 || amt > hiddenBalance) return;
    const tgtRaw =
      transferTargetType === "COMPANY"
        ? `E-${transferTarget}`
        : transferTargetType === "COUNTRY"
        ? `C-${transferTarget}`
        : transferTarget;
    onHiddenTransfer(tgtRaw, amt);
    setTransferAmount("");
    setTransferTarget("");
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-10">
      {/* EN-TÊTE */}
      <div className="bg-stone-900 text-stone-300 rounded-xl p-6 shadow-xl border border-stone-700 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-[0.3em] text-stone-500 mb-1">
              Votre Condition
            </div>
            <h2 className="text-2xl font-black font-serif text-stone-100">
              Servitude
            </h2>
            {owner && (
              <div className="flex items-center gap-2 mt-2 text-xs text-stone-400">
                <User size={12} />
                <span>
                  Propriétaire :{" "}
                  <span className="font-bold text-stone-300">{owner.name}</span>
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <div className="bg-stone-800 p-4 rounded-xl border border-stone-700 text-center min-w-[130px]">
              <div className="text-[9px] uppercase font-bold tracking-widest text-stone-500 mb-1">
                Solde Visible
              </div>
              <div className="text-2xl font-mono font-black text-stone-200">
                {formatMoney(visibleBalance)}
              </div>
            </div>
            <div className="bg-stone-800 p-4 rounded-xl border border-amber-900/40 text-center min-w-[130px]">
              <div className="text-[9px] uppercase font-bold tracking-widest text-amber-600 mb-1 flex items-center justify-center gap-1">
                <EyeOff size={10} /> Compte Caché
              </div>
              <div className="text-2xl font-mono font-black text-amber-400">
                {formatMoney(hiddenBalance)}
              </div>
            </div>
          </div>
        </div>
        <ShieldAlert
          size={100}
          className="absolute -right-4 -bottom-6 opacity-5 text-stone-400"
        />
      </div>

      {/* AVERTISSEMENT */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <strong>Dissimulation d'argent :</strong> Chaque transfert vers votre
          compte caché comporte un risque de détection. Votre maître sera alerté
          si vous êtes pris.
          <br />
          <span className="text-[10px] text-amber-600 mt-1 block">
            Risque de base : 10% — augmente de +5% par tranche de 15 Écus.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CACHER DE L'ARGENT */}
        <Card title="Dissimuler des Écus" icon={EyeOff}>
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1 block ml-1">
                Montant à cacher
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full p-3 bg-white border border-stone-300 rounded font-mono font-bold text-stone-900 outline-none focus:border-amber-500 transition-colors"
                  value={hideAmount}
                  onChange={(e) => setHideAmount(e.target.value)}
                  placeholder="0"
                  max={visibleBalance}
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-stone-400">
                  ÉCUS
                </span>
              </div>
            </div>

            {/* Jauge de risque */}
            {hideAmtNum > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-stone-400">Risque de détection</span>
                  <span
                    className={`${
                      detectionRisk >= 60
                        ? "text-red-600"
                        : detectionRisk >= 30
                        ? "text-amber-600"
                        : "text-green-600"
                    }`}
                  >
                    {detectionRisk}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      detectionRisk >= 60
                        ? "bg-red-500"
                        : detectionRisk >= 30
                        ? "bg-amber-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(detectionRisk, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleHide}
              disabled={hideAmtNum <= 0 || hideAmtNum > visibleBalance}
              className="w-full bg-stone-900 text-amber-400 py-3 rounded font-black uppercase text-[10px] tracking-[0.2em] hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <EyeOff size={14} /> Dissimuler
            </button>
          </div>
        </Card>

        {/* RETIRER DE L'ARGENT CACHÉ */}
        <Card title="Retirer du Compte Caché" icon={Eye}>
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
            <p className="text-[10px] text-stone-500 italic">
              Attention : les fonds retirés redeviennent visibles et
              confiscables par votre propriétaire.
            </p>
            <div>
              <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1 block ml-1">
                Montant à retirer
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full p-3 bg-white border border-stone-300 rounded font-mono font-bold text-stone-900 outline-none focus:border-stone-500 transition-colors"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0"
                  max={hiddenBalance}
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-stone-400">
                  ÉCUS
                </span>
              </div>
            </div>
            <button
              onClick={handleWithdraw}
              disabled={
                !withdrawAmount ||
                parseInt(withdrawAmount) <= 0 ||
                parseInt(withdrawAmount) > hiddenBalance
              }
              className="w-full bg-stone-800 text-white py-3 rounded font-black uppercase text-[10px] tracking-[0.2em] hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <Eye size={14} /> Retirer
            </button>
          </div>
        </Card>
      </div>

      {/* BANQUE SECRÈTE — visible uniquement si hiddenBalance > 0 */}
      {hiddenBalance > 0 && (
        <Card title="Banque Secrète" icon={Coins}>
          <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-200 space-y-4">
            <p className="text-[10px] text-stone-500">
              Envoyez de l'argent depuis votre compte caché. Ce transfert sera discret.
            </p>
            <div>
              <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1 block ml-1">
                Type de bénéficiaire
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setTransferTargetType("CITIZEN"); setTransferTarget(""); }}
                  className={`flex-1 px-2 py-2 rounded text-[9px] font-bold uppercase border transition-all flex items-center justify-center gap-1.5 ${
                    transferTargetType === "CITIZEN"
                      ? "bg-stone-800 text-white border-stone-800"
                      : "bg-white text-stone-400 border-stone-200 hover:text-stone-600"
                  }`}
                >
                  <CreditCard size={10} /> Citoyen
                </button>
                {safeCompanies.length > 0 && (
                  <button
                    onClick={() => { setTransferTargetType("COMPANY"); setTransferTarget(safeCompanies[0]?.id || ""); }}
                    className={`flex-1 px-2 py-2 rounded text-[9px] font-bold uppercase border transition-all flex items-center justify-center gap-1.5 ${
                      transferTargetType === "COMPANY"
                        ? "bg-stone-800 text-white border-stone-800"
                        : "bg-white text-stone-400 border-stone-200 hover:text-stone-600"
                    }`}
                  >
                    <Banknote size={10} /> Entreprise
                  </button>
                )}
                {safeCountries.length > 0 && (
                  <button
                    onClick={() => { setTransferTargetType("COUNTRY"); setTransferTarget(safeCountries[0]?.id || ""); }}
                    className={`flex-1 px-2 py-2 rounded text-[9px] font-bold uppercase border transition-all flex items-center justify-center gap-1.5 ${
                      transferTargetType === "COUNTRY"
                        ? "bg-stone-800 text-white border-stone-800"
                        : "bg-white text-stone-400 border-stone-200 hover:text-stone-600"
                    }`}
                  >
                    <Landmark size={10} /> Pays
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1 block ml-1">
                Bénéficiaire
              </label>
              {transferTargetType === "CITIZEN" ? (
                <UserSearchSelect
                  users={users}
                  onSelect={setTransferTarget}
                  placeholder="Rechercher un citoyen..."
                  excludeIds={[user.id]}
                  value={transferTarget}
                />
              ) : transferTargetType === "COMPANY" ? (
                <select
                  className="w-full p-3 bg-white border border-stone-300 rounded font-bold text-sm outline-none focus:border-amber-500 transition-colors"
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                >
                  <option value="">-- Choisir une entreprise --</option>
                  {safeCompanies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <select
                  className="w-full p-3 bg-white border border-stone-300 rounded font-bold text-sm outline-none focus:border-amber-500 transition-colors"
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                >
                  <option value="">-- Choisir un pays --</option>
                  {safeCountries.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1 block ml-1">
                Montant
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full p-3 bg-white border border-stone-300 rounded font-mono font-bold text-stone-900 outline-none focus:border-amber-500 transition-colors"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0"
                  max={hiddenBalance}
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-amber-500">
                  CACHÉ
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-stone-400">
                Disponible :{" "}
                <span className="font-mono font-bold text-amber-600">
                  {formatMoney(hiddenBalance)}
                </span>
              </span>
            </div>
            <button
              onClick={handleHiddenTransfer}
              disabled={
                !transferTarget ||
                !transferAmount ||
                parseInt(transferAmount) <= 0 ||
                parseInt(transferAmount) > hiddenBalance
              }
              className="w-full bg-amber-700 text-white py-3 rounded font-black uppercase text-[10px] tracking-[0.2em] hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <Send size={14} /> Transférer Secrètement
            </button>
          </div>
        </Card>
      )}

      {/* HISTORIQUE DES PERMISSIONS */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
        <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest mb-4">
          Vos Droits Actuels
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Banque",
              key: "bank",
              icon: Coins,
            },
            {
              label: "Poste",
              key: "post",
              icon: Send,
            },
            {
              label: "Voyage",
              key: "travel",
              icon: ArrowUpRight,
            },
          ].map((perm) => {
            const granted = user.permissions?.[perm.key] !== false;
            return (
              <div
                key={perm.key}
                className={`p-3 rounded-lg border text-center ${
                  granted
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <perm.icon
                  size={16}
                  className={`mx-auto mb-1 ${
                    granted ? "text-green-600" : "text-red-400"
                  }`}
                />
                <div
                  className={`text-[10px] font-bold uppercase ${
                    granted ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {perm.label}
                </div>
                <div className="text-[9px] text-stone-400 mt-0.5">
                  {granted ? "Autorisé" : "Interdit"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SlavePersonalView;
