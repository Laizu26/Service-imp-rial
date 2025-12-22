import React, { useState } from "react";
import { Coins, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import UserSearchSelect from "../ui/UserSearchSelect";

const BankView = ({
  users,
  countries,
  treasury,
  ledger,
  onTransfer,
  session,
  roleInfo,
}) => {
  const [srcType, setSrcType] = useState("CITIZEN"); // GLOBAL, COUNTRY, CITIZEN
  const [srcId, setSrcId] = useState(session.id); // Default to current user
  const [tgtType, setTgtType] = useState("CITIZEN");
  const [tgtId, setTgtId] = useState("");
  const [amount, setAmount] = useState("");

  const isEmperor = session?.role === "EMPEREUR";
  const safeUsers = Array.isArray(users) ? users : [];
  const safeCountries = Array.isArray(countries) ? countries : [];
  const safeLedger = Array.isArray(ledger) ? ledger : [];

  // Helper to build ID string for onTransfer
  const getRaw = (type, id) => {
    if (type === "GLOBAL") return "GLOBAL";
    if (type === "COUNTRY") return `C-${id}`;
    if (type === "CITIZEN") return `U-${id}`;
    return "";
  };

  // Helper to get current balance for display
  const getBalance = (type, id) => {
    if (type === "GLOBAL") return treasury;
    if (type === "COUNTRY")
      return safeCountries.find((c) => c.id === id)?.treasury || 0;
    if (type === "CITIZEN")
      return safeUsers.find((u) => u.id === id)?.balance || 0;
    return 0;
  };

  const currentSrcBalance = getBalance(srcType, srcId);

  return (
    <div className="flex flex-col h-full gap-6 font-sans">
      <div className="bg-[#fdf6e3] p-6 md:p-8 rounded-2xl border border-stone-300 shadow-md font-serif">
        <h3 className="font-black border-b-2 border-stone-200 pb-4 mb-8 uppercase text-[12px] tracking-[0.3em] text-stone-500 flex items-center gap-3 font-sans">
          <Coins size={18} className="text-yellow-600" /> Console de Transaction
          Impériale
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* SOURCE COLUMN */}
          <div className="bg-white/50 p-4 rounded-xl border border-stone-200">
            <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3 flex items-center gap-2">
              <ArrowUpRight className="text-red-500" size={14} /> Compte
              Débiteur (Source)
            </div>

            {/* Source Type Selector */}
            <div className="flex gap-2 mb-4">
              {isEmperor && (
                <button
                  onClick={() => {
                    setSrcType("GLOBAL");
                    setSrcId("GLOBAL");
                  }}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase border transition-all ${
                    srcType === "GLOBAL"
                      ? "bg-stone-800 text-white border-stone-800"
                      : "bg-white text-stone-500 hover:bg-stone-100"
                  }`}
                >
                  Empire
                </button>
              )}
              {["EMPEREUR", "ROI", "INTENDANT"].includes(session.role) && (
                <button
                  onClick={() => {
                    setSrcType("COUNTRY");
                    setSrcId(safeCountries[0]?.id || "");
                  }}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase border transition-all ${
                    srcType === "COUNTRY"
                      ? "bg-stone-800 text-white border-stone-800"
                      : "bg-white text-stone-500 hover:bg-stone-100"
                  }`}
                >
                  Nation
                </button>
              )}
              <button
                onClick={() => {
                  setSrcType("CITIZEN");
                  setSrcId(session.id);
                }}
                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase border transition-all ${
                  srcType === "CITIZEN"
                    ? "bg-stone-800 text-white border-stone-800"
                    : "bg-white text-stone-500 hover:bg-stone-100"
                }`}
              >
                Citoyen
              </button>
            </div>

            {/* Source Selector */}
            <div className="mb-4">
              {srcType === "GLOBAL" && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded font-bold text-yellow-800 text-sm">
                  Trésor Impérial Central
                </div>
              )}
              {srcType === "COUNTRY" && (
                <select
                  className="w-full p-3 border rounded font-bold text-sm bg-white"
                  value={srcId}
                  onChange={(e) => setSrcId(e.target.value)}
                >
                  {safeCountries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              {srcType === "CITIZEN" && (
                <UserSearchSelect
                  users={safeUsers}
                  onSelect={setSrcId}
                  value={srcId}
                  placeholder="Rechercher le débiteur..."
                />
              )}
            </div>

            {/* Balance Preview */}
            <div className="text-right">
              <span className="text-[10px] uppercase text-stone-400 font-bold mr-2">
                Solde Actuel:
              </span>
              <span
                className={`font-mono font-bold text-lg ${
                  currentSrcBalance < (parseInt(amount) || 0)
                    ? "text-red-500"
                    : "text-stone-800"
                }`}
              >
                {Number(currentSrcBalance).toLocaleString()} Écus
              </span>
            </div>
          </div>

          {/* TARGET COLUMN */}
          <div className="bg-white/50 p-4 rounded-xl border border-stone-200">
            <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3 flex items-center gap-2">
              <ArrowDownLeft className="text-green-500" size={14} /> Compte
              Créditeur (Cible)
            </div>

            {/* Target Type Selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setTgtType("GLOBAL");
                  setTgtId("GLOBAL");
                }}
                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase border transition-all ${
                  tgtType === "GLOBAL"
                    ? "bg-stone-800 text-white border-stone-800"
                    : "bg-white text-stone-500 hover:bg-stone-100"
                }`}
              >
                Empire
              </button>
              <button
                onClick={() => {
                  setTgtType("COUNTRY");
                  setTgtId(safeCountries[0]?.id || "");
                }}
                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase border transition-all ${
                  tgtType === "COUNTRY"
                    ? "bg-stone-800 text-white border-stone-800"
                    : "bg-white text-stone-500 hover:bg-stone-100"
                }`}
              >
                Nation
              </button>
              <button
                onClick={() => {
                  setTgtType("CITIZEN");
                  setTgtId("");
                }}
                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase border transition-all ${
                  tgtType === "CITIZEN"
                    ? "bg-stone-800 text-white border-stone-800"
                    : "bg-white text-stone-500 hover:bg-stone-100"
                }`}
              >
                Citoyen
              </button>
            </div>

            {/* Target Selector */}
            <div className="mb-4">
              {tgtType === "GLOBAL" && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded font-bold text-yellow-800 text-sm">
                  Caisse Centrale Impériale
                </div>
              )}
              {tgtType === "COUNTRY" && (
                <select
                  className="w-full p-3 border rounded font-bold text-sm bg-white"
                  value={tgtId}
                  onChange={(e) => setTgtId(e.target.value)}
                >
                  {safeCountries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              {tgtType === "CITIZEN" && (
                <UserSearchSelect
                  users={safeUsers}
                  onSelect={setTgtId}
                  value={tgtId}
                  placeholder="Rechercher le bénéficiaire..."
                />
              )}
            </div>
          </div>
        </div>

        {/* AMOUNT & ACTION */}
        <div className="flex flex-col md:flex-row gap-6 items-end bg-stone-100 p-4 rounded-xl border border-stone-200">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-black uppercase text-stone-400 block mb-2 tracking-widest ml-1 font-sans">
              Montant du Transfert
            </label>
            <div className="relative">
              <input
                type="number"
                className="w-full p-4 border-2 border-stone-300 rounded-xl text-xl font-bold bg-white outline-none focus:border-stone-800 font-mono"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
              <span className="absolute right-4 top-4 text-stone-400 font-bold font-sans">
                Écus
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              if (amount > 0 && srcId && tgtId) {
                onTransfer(
                  getRaw(srcType, srcId),
                  getRaw(tgtType, tgtId),
                  parseInt(amount)
                );
                setAmount("");
              }
            }}
            disabled={!amount || amount <= 0 || !srcId || !tgtId}
            className={`w-full md:w-auto px-12 py-5 rounded-xl text-[11px] font-black uppercase tracking-widest border-b-4 transition-all shadow-xl flex items-center justify-center gap-3 ${
              !amount || amount <= 0 || !srcId || !tgtId
                ? "bg-stone-300 text-stone-500 border-stone-400 cursor-not-allowed"
                : "bg-stone-800 text-white border-black hover:bg-stone-700 active:scale-95"
            }`}
          >
            <RefreshCw size={18} /> Exécuter
          </button>
        </div>
      </div>
      <div className="flex-1 bg-white/60 rounded-2xl border border-stone-300 overflow-auto p-4 md:p-6 shadow-inner font-serif">
        <table className="w-full text-xs text-left min-w-[600px]">
          <thead className="bg-stone-100 uppercase sticky top-0 border-b-2 border-stone-200 z-10 font-sans">
            <tr>
              <th className="p-4 font-black text-stone-500 tracking-[0.2em] font-sans">
                Source du Flux
              </th>
              <th className="p-4 font-black text-stone-500 tracking-[0.2em] font-sans">
                Bénéficiaire
              </th>
              <th className="p-4 text-right font-black text-stone-500 tracking-[0.2em] font-sans">
                Quantité Scellée
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-sans uppercase font-bold text-stone-700 font-sans">
            {safeLedger.slice(0, 50).map((l, i) => (
              <tr key={i} className="hover:bg-white/50 font-sans">
                <td className="p-4 font-sans">
                  {String(l?.fromName || "Archives")}
                </td>
                <td className="p-4 font-sans">
                  {String(l?.toName || "Archives")}
                </td>
                <td className="p-4 text-right font-mono text-stone-900 font-black text-sm font-sans">
                  {Number(l?.amount || 0).toLocaleString()} Écus
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BankView;
