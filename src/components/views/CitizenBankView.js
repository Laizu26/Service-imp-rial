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
  Stamp,
  PenTool,
  Calendar,
  Percent,
} from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";

const CitizenBankView = ({
  user,
  users,
  globalLedger,
  debtRegistry,
  onTransfer,
  onProposeDebt, // Nouveau (remplace onCreateDebt)
  onSignDebt, // Nouveau
  onPayDebt,
  onCancelDebt,
  canUseBank,
  isBanned,
}) => {
  const [activeTab, setActiveTab] = useState("operations"); // 'operations' ou 'loans'

  // --- ÉTATS FORMULAIRES ---
  // Virement
  const [transferTarget, setTransferTarget] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  // Proposition de Prêt (Nouveau)
  const [loanTarget, setLoanTarget] = useState(""); // Le futur débiteur
  const [loanAmount, setLoanAmount] = useState("");
  const [loanInterest, setLoanInterest] = useState("0");
  const [loanDueDate, setLoanDueDate] = useState("");
  const [loanReason, setLoanReason] = useState("");

  // --- DONNÉES CALCULÉES ---
  const safeRegistry = Array.isArray(debtRegistry) ? debtRegistry : [];

  // Historique
  const myTransactions = (globalLedger || [])
    .filter((l) => l.fromName === user.name || l.toName === user.name)
    .sort((a, b) => b.id - a.id);

  // Dettes actives (Je dois payer)
  const myDebts = safeRegistry.filter(
    (d) => d.debtorId === user.id && d.status === "ACTIVE"
  );

  // Créances actives (On me doit)
  const myCredits = safeRegistry.filter(
    (d) => d.creditorId === user.id && d.status === "ACTIVE"
  );

  // En attente de ma signature (On me propose un prêt)
  const pendingSignatures = safeRegistry.filter(
    (d) => d.debtorId === user.id && d.status === "DRAFT"
  );

  // Mes propositions en attente (J'ai proposé, ils n'ont pas encore signé)
  const myProposals = safeRegistry.filter(
    (d) => d.creditorId === user.id && d.status === "DRAFT"
  );

  // --- ACTIONS ---
  const handleTransfer = () => {
    if (!transferTarget || !transferAmount || parseInt(transferAmount) <= 0)
      return;
    onTransfer(`U-${user.id}`, `U-${transferTarget}`, parseInt(transferAmount));
    setTransferAmount("");
    setTransferTarget("");
  };

  const handleProposeLoan = () => {
    if (!loanTarget || !loanAmount || parseInt(loanAmount) <= 0) return;

    // Appel à la nouvelle fonction de App.js
    if (onProposeDebt) {
      onProposeDebt(
        loanTarget,
        parseInt(loanAmount),
        parseInt(loanInterest) || 0,
        loanReason || "Prêt",
        loanDueDate || "Indéterminée"
      );
    }

    // Reset form
    setLoanTarget("");
    setLoanAmount("");
    setLoanReason("");
    setLoanInterest("0");
    setLoanDueDate("");
  };

  if (!canUseBank || isBanned) {
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
    <div className="space-y-6 animate-fadeIn font-sans pb-10">
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
            <div className="flex items-center">
              <FileSignature size={16} className="mr-2" />
              Contrats
              {pendingSignatures.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[9px] px-1.5 rounded-full animate-pulse">
                  {pendingSignatures.length}
                </span>
              )}
            </div>
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

          {/* Historique */}
          <div className="lg:col-span-2">
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

      {/* --- ONGLET 2 : DETTES & CONTRATS --- */}
      {activeTab === "loans" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SECTION : CONTRATS EN ATTENTE (Action requise) */}
          {(pendingSignatures.length > 0 || myProposals.length > 0) && (
            <div className="col-span-1 lg:col-span-2">
              <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest mb-3 flex items-center gap-2">
                <Stamp size={14} /> Zone de Signature
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* À SIGNER (PRIORITAIRE) */}
                {pendingSignatures.map((contract) => (
                  <div
                    key={contract.id}
                    className="bg-white p-5 rounded-xl border-l-4 border-yellow-500 shadow-lg relative animate-pulse-slow"
                  >
                    <div className="absolute top-0 right-0 p-1.5 bg-yellow-100 text-yellow-800 text-[9px] font-black uppercase tracking-widest rounded-bl-lg">
                      Signature Requise
                    </div>
                    <h4 className="font-bold text-stone-800 text-sm mb-1">
                      Proposition de Prêt
                    </h4>
                    <p className="text-xs text-stone-600 mb-3">
                      <span className="font-bold">{contract.creditorName}</span>{" "}
                      propose de vous prêter{" "}
                      <span className="font-black">{contract.principal} ¢</span>
                      .
                    </p>
                    <div className="bg-stone-50 p-2 rounded text-[10px] grid grid-cols-2 gap-2 mb-3 border border-stone-100">
                      <div>
                        <span className="text-stone-400 uppercase font-bold">
                          Remboursement
                        </span>
                        <br />
                        <span className="text-red-600 font-black text-xs">
                          {contract.totalAmount} ¢
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 uppercase font-bold">
                          Intérêts
                        </span>
                        <br />
                        {contract.interestRate}%
                      </div>
                      <div className="col-span-2">
                        <span className="text-stone-400 uppercase font-bold">
                          Échéance
                        </span>
                        <br />
                        {contract.dueDate}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSignDebt(contract.id)}
                        className="flex-1 bg-stone-900 text-white py-2 rounded text-[10px] font-black uppercase hover:bg-stone-800 flex items-center justify-center gap-2"
                      >
                        <Stamp size={12} /> Accepter (Signer)
                      </button>
                      <button
                        onClick={() => onCancelDebt(contract.id)}
                        className="px-3 bg-white border border-stone-200 text-stone-500 rounded hover:text-red-500"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}

                {/* MES PROPOSITIONS (ATTENTE) */}
                {myProposals.map((contract) => (
                  <div
                    key={contract.id}
                    className="bg-stone-50 p-4 rounded-xl border border-stone-200 opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">
                        En attente de signature
                      </div>
                      <button
                        onClick={() => onCancelDebt(contract.id)}
                        className="text-stone-400 hover:text-red-500 text-[10px] uppercase font-bold"
                      >
                        Annuler
                      </button>
                    </div>
                    <div className="text-xs font-bold text-stone-700">
                      Prêt à {contract.debtorName} : {contract.principal} ¢
                    </div>
                    <div className="text-[10px] text-stone-500 mt-1">
                      Total attendu : {contract.totalAmount} ¢
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulaire : Proposer un Prêt (Créancier) */}
          <div className="col-span-1 lg:col-span-2">
            <Card title="Rédiger un Contrat de Prêt" icon={PenTool}>
              <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1 block ml-1">
                      Bénéficiaire (Débiteur)
                    </label>
                    <UserSearchSelect
                      users={users}
                      onSelect={setLoanTarget}
                      excludeIds={[user.id]}
                      value={loanTarget}
                      placeholder="Choisir un citoyen..."
                    />
                  </div>
                  <div className="w-full md:w-1/3">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1 block ml-1">
                      Somme Prêtée
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full p-2.5 bg-white border border-stone-300 rounded font-mono font-bold text-stone-900 outline-none"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        placeholder="0"
                      />
                      <Coins
                        size={12}
                        className="absolute right-3 top-3 text-stone-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1 block ml-1">
                      Intérêts (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full p-2.5 bg-white border border-stone-300 rounded font-mono font-bold text-stone-900 outline-none"
                        value={loanInterest}
                        onChange={(e) => setLoanInterest(e.target.value)}
                      />
                      <Percent
                        size={12}
                        className="absolute right-3 top-3 text-stone-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1 block ml-1">
                      Échéance (Date)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full p-2.5 bg-white border border-stone-300 rounded text-xs font-bold text-stone-900 outline-none"
                        value={loanDueDate}
                        onChange={(e) => setLoanDueDate(e.target.value)}
                        placeholder="Ex: Fin du Cycle..."
                      />
                      <Calendar
                        size={12}
                        className="absolute right-3 top-3 text-stone-400"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1 block ml-1">
                    Motif / Conditions
                  </label>
                  <input
                    className="w-full p-2.5 bg-white border border-stone-300 rounded text-xs font-serif italic text-stone-700 outline-none"
                    value={loanReason}
                    onChange={(e) => setLoanReason(e.target.value)}
                    placeholder="Ex: Financement expédition commerciale..."
                  />
                </div>

                <div className="bg-yellow-50 p-3 rounded text-[10px] text-yellow-800 flex justify-between items-center border border-yellow-200">
                  <span className="font-bold uppercase tracking-wide">
                    Total à rembourser par le débiteur :
                  </span>
                  <span className="font-black text-lg">
                    {loanAmount
                      ? Math.floor(
                          parseInt(loanAmount) *
                            (1 + parseInt(loanInterest) / 100)
                        )
                      : 0}{" "}
                    ¢
                  </span>
                </div>

                <button
                  onClick={handleProposeLoan}
                  disabled={!loanTarget || !loanAmount}
                  className="w-full bg-stone-900 text-white px-6 py-3 rounded font-bold uppercase text-[10px] hover:bg-stone-700 disabled:opacity-50 tracking-widest shadow-lg"
                >
                  Proposer le contrat
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
                  className="bg-white p-4 rounded-xl border border-red-100 shadow-sm relative overflow-hidden group"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 group-hover:w-2 transition-all"></div>
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <div>
                      <div className="text-xs text-stone-500 uppercase font-bold">
                        Créancier
                      </div>
                      <div className="font-black text-stone-900 text-lg leading-tight">
                        {d.creditorName}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-1">
                        Échéance:{" "}
                        <span className="text-stone-600 font-bold">
                          {d.dueDate}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black font-mono text-red-600">
                        {d.totalAmount} ¢
                      </div>
                      <div className="text-[9px] text-red-300 font-bold uppercase">
                        À Rembourser
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Rembourser ${d.totalAmount} écus à ${d.creditorName} ?`
                        )
                      ) {
                        onPayDebt(d.id);
                      }
                    }}
                    className="w-full mt-2 bg-red-50 text-red-700 border border-red-100 py-2 rounded font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Coins size={14} /> Payer
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
                  Aucune créance en cours.
                </div>
              )}
              {myCredits.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-4 rounded-xl border border-green-100 shadow-sm relative overflow-hidden group"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 group-hover:w-2 transition-all"></div>
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <div>
                      <div className="text-xs text-stone-500 uppercase font-bold">
                        Débiteur
                      </div>
                      <div className="font-black text-stone-900 text-lg leading-tight">
                        {c.debtorName}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-1 italic">
                        "{c.reason || "Prêt"}"
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black font-mono text-green-600">
                        {c.totalAmount} ¢
                      </div>
                      <div className="text-[9px] text-green-300 font-bold uppercase">
                        Attendu
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Êtes-vous sûr de vouloir annuler cette dette (Cadeau) ?"
                        )
                      ) {
                        onCancelDebt(c.id);
                      }
                    }}
                    className="w-full mt-2 bg-stone-50 text-stone-400 py-2 rounded font-black uppercase text-[10px] hover:bg-stone-100 hover:text-red-500 transition-colors"
                  >
                    Faire grâce (Annuler)
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
