import React, { useState } from "react";
import {
  Coins,
  Send,
  Scroll,
  FileSignature,
  ArrowUpRight,
  ArrowDownLeft,
  Handshake,
  ShieldAlert,
  History,
  Wallet,
} from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";

const CitizenBankView = ({
  user,
  users,
  globalLedger,
  debtRegistry,
  onTransfer,
  onCreateDebt,
  onPayDebt,
  onCancelDebt,
  canUseBank,
  isBanned,
}) => {
  const [activeTab, setActiveTab] = useState("operations"); // 'operations' ou 'loans'

  // États pour les formulaires
  const [transferTarget, setTransferTarget] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const [debtCreditor, setDebtCreditor] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtReason, setDebtReason] = useState("");

  // Données calculées
  const myTransactions = (globalLedger || [])
    .filter((l) => l.fromName === user.name || l.toName === user.name)
    .sort((a, b) => b.id - a.id);

  const myDebts = (debtRegistry || []).filter(
    (d) => d.debtorId === user.id && d.status === "ACTIVE"
  );

  const myCredits = (debtRegistry || []).filter(
    (d) => d.creditorId === user.id && d.status === "ACTIVE"
  );

  // --- ACTIONS ---
  const handleTransfer = () => {
    if (!transferTarget || !transferAmount || parseInt(transferAmount) <= 0)
      return;
    onTransfer(`U-${user.id}`, `U-${transferTarget}`, parseInt(transferAmount));
    setTransferAmount("");
    setTransferTarget("");
  };

  const handleCreateDebt = () => {
    if (!debtCreditor || !debtAmount || parseInt(debtAmount) <= 0) return;
    onCreateDebt(
      debtCreditor,
      parseInt(debtAmount),
      debtReason || "Prêt personnel"
    );
    setDebtCreditor("");
    setDebtAmount("");
    setDebtReason("");
  };

  if (!canUseBank) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-50">
        <ShieldAlert size={64} className="mb-4 text-red-400" />
        <div className="uppercase font-black tracking-widest text-sm text-red-900">
          Accès Bancaire Interdit
        </div>
        <p className="text-xs">Vos droits économiques ont été révoqués.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* --- EN-TÊTE : SOLDE --- */}
      <div className="bg-stone-900 text-yellow-500 rounded-xl p-6 shadow-xl border-2 border-yellow-600/30 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative z-10">
          <div className="text-[10px] uppercase font-bold tracking-[0.3em] text-yellow-700 mb-1">
            Avoirs Personnels
          </div>
          <div className="text-5xl font-black font-serif tracking-tighter">
            {Number(user?.balance || 0).toLocaleString()}{" "}
            <span className="text-lg font-sans font-medium text-yellow-600/80">
              Écus
            </span>
          </div>
        </div>
        <div className="relative z-10 flex gap-2">
          <button
            onClick={() => setActiveTab("operations")}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "operations"
                ? "bg-yellow-600 text-stone-900 shadow-lg scale-105"
                : "bg-stone-800 text-stone-500 hover:bg-stone-700"
            }`}
          >
            <Wallet size={16} className="inline mr-2 mb-0.5" /> Opérations
          </button>
          <button
            onClick={() => setActiveTab("loans")}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "loans"
                ? "bg-yellow-600 text-stone-900 shadow-lg scale-105"
                : "bg-stone-800 text-stone-500 hover:bg-stone-700"
            }`}
          >
            <FileSignature size={16} className="inline mr-2 mb-0.5" /> Dettes &
            Crédits
          </button>
        </div>
        <Coins
          size={120}
          className="absolute -right-6 -bottom-8 opacity-10 text-yellow-100"
        />
      </div>

      {/* --- ONGLET 1 : OPÉRATIONS (VIREMENTS & HISTORIQUE) --- */}
      {activeTab === "operations" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire Virement */}
          {!isBanned && (
            <div className="lg:col-span-1">
              <Card title="Ordre de Virement" icon={Send}>
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1 block ml-1">
                      Bénéficiaire
                    </label>
                    <UserSearchSelect
                      users={users}
                      onSelect={setTransferTarget}
                      placeholder="Rechercher un citoyen..."
                      excludeIds={[user.id]}
                      value={transferTarget}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1 block ml-1">
                      Montant
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full p-3 bg-white border border-stone-300 rounded font-mono font-bold text-stone-900 outline-none focus:border-stone-800 transition-colors"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-3 text-xs font-bold text-stone-400">
                        ÉCUS
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleTransfer}
                    disabled={!transferTarget || !transferAmount}
                    className="w-full bg-stone-900 text-yellow-500 py-3 rounded font-black uppercase text-[10px] tracking-[0.2em] hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 mt-2"
                  >
                    Exécuter le Transfert
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* Historique */}
          <div className={`${isBanned ? "col-span-3" : "lg:col-span-2"}`}>
            <Card title="Grand Livre des Comptes" icon={Scroll}>
              <div className="max-h-[400px] overflow-y-auto pr-1 space-y-2">
                {myTransactions.length === 0 && (
                  <div className="text-center py-10 text-stone-400 italic text-xs">
                    Aucun mouvement de fonds enregistré.
                  </div>
                )}
                {myTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-3 bg-white border border-stone-100 rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          tx.toName === user.name
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {tx.toName === user.name ? (
                          <ArrowDownLeft size={16} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-stone-800 text-sm">
                          {tx.toName === user.name
                            ? `Reçu de ${tx.fromName}`
                            : `Envoyé à ${tx.toName}`}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          Ref: {tx.id}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-black font-mono ${
                        tx.toName === user.name
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.toName === user.name ? "+" : "-"}
                      {tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* --- ONGLET 2 : DETTES & CRÉDITS --- */}
      {activeTab === "loans" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Création de Dette */}
          <div className="col-span-1 lg:col-span-2">
            <Card
              title="Reconnaissance de Dette (Je dois de l'argent)"
              icon={FileSignature}
            >
              <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1 block ml-1">
                    Créancier (À qui dois-je ?)
                  </label>
                  <UserSearchSelect
                    users={users}
                    onSelect={setDebtCreditor}
                    excludeIds={[user.id]}
                    value={debtCreditor}
                    placeholder="Sélectionner..."
                  />
                </div>
                <div className="w-full md:w-32">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1 block ml-1">
                    Montant
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded font-mono font-bold"
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1 block ml-1">
                    Motif (Optionnel)
                  </label>
                  <input
                    className="w-full p-2 border rounded font-serif italic"
                    value={debtReason}
                    onChange={(e) => setDebtReason(e.target.value)}
                    placeholder="Ex: Prêt pour achat d'épée..."
                  />
                </div>
                <button
                  onClick={handleCreateDebt}
                  disabled={!debtCreditor || !debtAmount}
                  className="w-full md:w-auto bg-stone-900 text-white px-6 py-2.5 rounded font-bold uppercase text-[10px] hover:bg-stone-700 disabled:opacity-50"
                >
                  Signer
                </button>
              </div>
            </Card>
          </div>

          {/* MES DETTES (Ce que je dois payer) */}
          <Card
            title="Passif : Mes Dettes"
            icon={ArrowUpRight}
            className="border-t-4 border-red-500"
          >
            <div className="space-y-3">
              {myDebts.length === 0 && (
                <div className="text-center py-6 text-stone-400 italic text-xs">
                  Vous êtes libre de toute dette.
                </div>
              )}
              {myDebts.map((d) => (
                <div
                  key={d.id}
                  className="bg-white p-4 rounded-xl border border-red-100 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xs text-stone-500 uppercase font-bold">
                        Doit à
                      </div>
                      <div className="font-black text-stone-900 text-lg">
                        {d.creditorName}
                      </div>
                      <div className="text-xs text-stone-400 italic">
                        "{d.reason || "Dette"}"
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black font-mono text-red-600">
                        {d.amount}
                      </div>
                      <div className="text-[9px] text-red-300 font-bold uppercase">
                        À Rembourser
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onPayDebt(d.id)}
                    className="w-full mt-2 bg-red-50 text-red-700 border border-red-100 py-2 rounded font-black uppercase text-[10px] hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Coins size={14} /> Rembourser maintenant
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* MES CRÉANCES (Ce qu'on me doit) */}
          <Card
            title="Actif : On me doit"
            icon={Handshake}
            className="border-t-4 border-green-500"
          >
            <div className="space-y-3">
              {myCredits.length === 0 && (
                <div className="text-center py-6 text-stone-400 italic text-xs">
                  Personne ne vous doit d'argent.
                </div>
              )}
              {myCredits.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-4 rounded-xl border border-green-100 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xs text-stone-500 uppercase font-bold">
                        Débiteur
                      </div>
                      <div className="font-black text-stone-900 text-lg">
                        {c.debtorName}
                      </div>
                      <div className="text-xs text-stone-400 italic">
                        "{c.reason || "Prêt"}"
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black font-mono text-green-600">
                        {c.amount}
                      </div>
                      <div className="text-[9px] text-green-300 font-bold uppercase">
                        En attente
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onCancelDebt(c.id)}
                    className="w-full mt-2 bg-stone-100 text-stone-500 py-2 rounded font-black uppercase text-[10px] hover:bg-stone-200 transition-colors"
                  >
                    Annuler la dette (Cadeau)
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CitizenBankView;
