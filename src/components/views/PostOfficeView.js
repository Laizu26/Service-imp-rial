import React, { useState, useMemo } from "react";
import {
  Stamp,
  MapPin,
  ArrowRight,
  XCircle,
  CheckCircle,
  Clock,
  History,
  Search,
  X,
} from "lucide-react";

const PostOfficeView = ({
  travelRequests,
  countries,
  citizens,
  session,
  isGlobalScope = false,
  onUpdateRequests,
  onUpdateCitizen,
  onVisaGranted,
  notify,
}) => {
  const myCountryId = session.countryId;

  const [activeTab, setActiveTab] = useState("pending"); // pending | history
  const [pendingSearch, setPendingSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null); // { req, reason }
  const [rejectReason, setRejectReason] = useState("");

  // Filtrer les requêtes pertinentes
  const relevantRequests = useMemo(() => {
    if (!travelRequests) return [];
    return travelRequests.filter((req) => {
      if (req.status === "APPROVED" || req.status === "REJECTED") return false;

      // Protection contre requêtes sans validations (données legacy)
      const validations = req.validations || { exit: false, entry: false };

      const isIntra = req.fromCountry === req.toCountry;
      const isDeparture = req.fromCountry === myCountryId;
      const isArrival = req.toCountry === myCountryId;
      const isGlobalAdmin =
        isGlobalScope ||
        ["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(session.role);

      if (isGlobalAdmin) return true;

      // Intra : Je suis du pays concerné
      if (isIntra && isDeparture) return true;

      // Inter - Visa Sortie : Je suis au départ et sortie non validée
      if (isDeparture && !validations.exit) return true;

      // Inter - Visa Entrée : Je suis à l'arrivée, sortie OK, entrée non validée
      if (isArrival && validations.exit && !validations.entry) return true;

      return false;
    });
  }, [travelRequests, myCountryId, session]);

  const historyRequests = useMemo(() => {
    if (!travelRequests) return [];
    return travelRequests
      .filter((req) => req.status === "APPROVED" || req.status === "REJECTED")
      .sort((a, b) => (b.processedAt || b.id || 0) - (a.processedAt || a.id || 0))
      .slice(0, 50);
  }, [travelRequests]);

  const filteredPending = useMemo(() => {
    if (!pendingSearch) return relevantRequests;
    const q = pendingSearch.toLowerCase();
    return relevantRequests.filter(
      (req) =>
        (req.citizenName || "").toLowerCase().includes(q) ||
        (countries.find((c) => c.id === req.fromCountry)?.name || "").toLowerCase().includes(q) ||
        (countries.find((c) => c.id === req.toCountry)?.name || "").toLowerCase().includes(q)
    );
  }, [relevantRequests, pendingSearch, countries]);

  // Action : REJET
  const openReject = (req) => {
    setRejectTarget(req);
    setRejectReason("");
  };

  const confirmReject = () => {
    if (!rejectTarget) return;
    const updatedReq = {
      ...rejectTarget,
      status: "REJECTED",
      rejectionReason: rejectReason || "Refus sans motif",
      rejectedBy: session.name,
      processedAt: Date.now(),
    };
    const otherRequests = travelRequests.filter((r) => r.id !== rejectTarget.id);
    onUpdateRequests([...otherRequests, updatedReq]);
    if (notify) notify("Demande de visa rejetée.", "info");
    setRejectTarget(null);
    setRejectReason("");
  };

  // Action : VALIDATION
  const handleValidate = (req) => {
    const safeValidations = req.validations || { exit: false, entry: false };
    let updatedReq = { ...req, validations: { ...safeValidations } };
    let moveCitizen = false;
    const isIntra = req.fromCountry === req.toCountry;

    // Logique de validation
    if (isIntra) {
      updatedReq.validations.exit = true;
      updatedReq.validations.entry = true;
      updatedReq.status = "APPROVED";
      moveCitizen = true;
    } else {
      if (!updatedReq.validations.exit) {
        // VISA SORTIE
        const fromCountry = countries.find((c) => c.id === req.fromCountry);
        if (
          fromCountry?.laws?.forbidExit &&
          !["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(session.role)
        ) {
          if (notify)
            notify(
              "Action impossible : Sortie interdite par la loi locale.",
              "error"
            );
          return;
        }
        updatedReq.validations.exit = true;
      } else {
        // VISA ENTRÉE
        const toCountry = countries.find((c) => c.id === req.toCountry);
        if (
          toCountry?.laws?.closeBorders &&
          !["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(session.role)
        ) {
          if (notify)
            notify(
              "Action impossible : Frontières fermées par décret.",
              "error"
            );
          return;
        }
        updatedReq.validations.entry = true;
        updatedReq.status = "APPROVED";
        moveCitizen = true;
      }
    }

    if (moveCitizen) {
      // --- CORRECTION DU BUG DE POSITION ---
      // On prépare la nouvelle liste de requêtes (sans celle qu'on vient de valider)
      const otherRequests = travelRequests.filter((r) => r.id !== req.id);

      // On utilise la fonction groupée si elle existe
      if (typeof onVisaGranted === "function") {
        onVisaGranted(
          req.citizenId,
          req.toCountry,
          req.toRegion,
          [...otherRequests, updatedReq]
        );
      } else {
        // Ancien comportement (risque de bug)
        if (typeof onUpdateCitizen === "function")
          onUpdateCitizen(req.citizenId, req.toCountry, req.toRegion);
        onUpdateRequests(otherRequests);
      }

      if (notify) notify("Visa accordé. Citoyen déplacé.", "success");
    } else {
      const otherRequests = travelRequests.filter((r) => r.id !== req.id);
      onUpdateRequests([...otherRequests, updatedReq]);
      if (notify)
        notify(
          "Visa de sortie apposé. En attente du visa d'entrée.",
          "success"
        );
    }
  };

  return (
    <div className="h-full bg-[#fdf6e3] rounded-2xl border border-stone-300 flex flex-col p-6 md:p-8 font-sans">
      {/* Modal de rejet */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-stone-800 uppercase tracking-widest text-sm flex items-center gap-2">
                <XCircle size={16} className="text-red-500" /> Refuser le visa
              </h3>
              <button onClick={() => setRejectTarget(null)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs text-stone-600">
              Demande de <span className="font-black">{rejectTarget.citizenName}</span> —{" "}
              {countries.find(c => c.id === rejectTarget.fromCountry)?.name} → {countries.find(c => c.id === rejectTarget.toCountry)?.name}
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                Motif du refus
              </label>
              <textarea
                className="w-full p-3 border border-stone-200 rounded-xl text-sm bg-white outline-none focus:border-red-400 resize-none"
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Expliquez le motif du refus (optionnel)..."
                maxLength={300}
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={confirmReject}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-500 flex items-center justify-center gap-2"
              >
                <XCircle size={14} /> Confirmer le refus
              </button>
              <button
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="border-b-2 border-stone-200 pb-4 mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="bg-stone-800 text-white p-3 rounded-full shadow-lg">
            <Stamp size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-stone-800 font-serif uppercase tracking-tight">
              Bureau des Visas
            </h2>
            <p className="text-xs text-stone-500 uppercase tracking-widest font-bold">
              Contrôle des Frontières & Laissez-passer
            </p>
          </div>
          {/* Mini stats */}
          <div className="flex gap-4 text-[11px] text-right shrink-0">
            <div>
              <div className="font-black text-2xl text-stone-800">{relevantRequests.length}</div>
              <div className="text-stone-400 uppercase tracking-widest">En attente</div>
            </div>
            {historyRequests.length > 0 && (
              <div>
                <div className="font-black text-2xl text-stone-500">{historyRequests.length}</div>
                <div className="text-stone-400 uppercase tracking-widest">Traités</div>
              </div>
            )}
          </div>
        </div>
        {/* Onglets */}
        <div className="flex gap-2">
          {[
            { id: "pending", label: "En attente", count: relevantRequests.length },
            { id: "history", label: "Historique", count: historyRequests.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? "bg-stone-800 text-white shadow-md"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              }`}
            >
              {tab.id === "pending" ? <Stamp size={12} /> : <History size={12} />}
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-stone-200 text-stone-600"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        {/* Barre de recherche — visible seulement sur "pending" */}
        {activeTab === "pending" && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-stone-400" />
            <input
              className="w-full pl-9 pr-8 py-2.5 border border-stone-200 rounded-xl text-sm bg-white outline-none focus:border-stone-500"
              placeholder="Rechercher par citoyen ou pays..."
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
            />
            {pendingSearch && (
              <button onClick={() => setPendingSearch("")} className="absolute right-3 top-3 text-stone-400 hover:text-stone-600">
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {activeTab === "pending" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2">
          {filteredPending.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-stone-400 opacity-60">
              <Stamp size={64} className="mb-4" />
              <span className="italic">Aucune demande de visa en attente.</span>
            </div>
          )}

          {filteredPending.map((req) => {
            const citizen = citizens.find((c) => c.id === req.citizenId);
            const reqValidations = req.validations || { exit: false, entry: false };
            const isExitStep =
              !reqValidations.exit && req.fromCountry !== req.toCountry;

            return (
              <div
                key={req.id}
                className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all flex flex-col"
              >
                <div
                  className={`absolute top-0 left-0 w-1.5 h-full ${
                    isExitStep ? "bg-orange-400" : "bg-green-500"
                  }`}
                />

                <div className="flex justify-between items-start mb-3 pl-2">
                  <div className="flex items-center gap-3">
                    {citizen?.avatarUrl ? (
                      <img src={citizen.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-stone-200 shrink-0" style={{ width: 40, height: 40, minWidth: 40, minHeight: 40, objectFit: "cover" }} />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-black text-sm shrink-0" style={{ width: 40, height: 40, minWidth: 40, minHeight: 40 }}>
                        {(req.citizenName || "?")[0]}
                      </div>
                    )}
                    <div>
                      <div className="font-black text-lg text-stone-800 font-serif leading-none">
                        {req.citizenName}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono mt-1">
                        {citizen?.role || "CITOYEN"} — Allégeance:{" "}
                        {countries.find((c) => c.id === citizen?.countryId)?.name || "?"}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] bg-stone-100 px-2 py-1 rounded text-stone-500 uppercase tracking-widest font-bold border border-stone-200">
                    {req.fromCountry === req.toCountry ? "Interne" : "International"}
                  </span>
                </div>

                <div className="space-y-3 text-xs text-stone-600 mb-6 flex-1 pl-2">
                  <div className="flex items-center gap-2 bg-stone-50 p-2 rounded border border-stone-100">
                    <MapPin size={12} className="text-stone-400" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-stone-400">
                        Origine
                      </span>
                      <span className="font-bold">
                        {countries.find((c) => c.id === req.fromCountry)?.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-stone-50 p-2 rounded border border-stone-100">
                    <ArrowRight size={12} className="text-stone-400" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-stone-400">
                        Destination
                      </span>
                      <span className="font-bold text-stone-800">
                        {countries.find((c) => c.id === req.toCountry)?.name}
                        <span className="text-stone-400 font-normal">
                          {" "}
                          — {req.toRegion}
                        </span>
                      </span>
                    </div>
                  </div>

                  {citizen?.status !== "Actif" && (
                    <div className="flex items-center gap-2 text-red-600 font-bold uppercase text-[9px] bg-red-50 p-1 rounded justify-center">
                      <XCircle size={10} /> Attention: Statut {citizen?.status}
                    </div>
                  )}
                </div>

                {req.fromCountry !== req.toCountry && (
                  <div className="flex items-center gap-1 mb-3 pl-2">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black uppercase ${reqValidations.exit ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                      {reqValidations.exit ? "✓" : "·"} Visa Sortie
                    </div>
                    <div className="flex-1 h-0.5 bg-stone-200 mx-1">
                      <div className={`h-full transition-all ${reqValidations.exit ? "bg-green-400 w-full" : "bg-stone-300 w-0"}`} />
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black uppercase ${reqValidations.entry ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-400"}`}>
                      {reqValidations.entry ? "✓" : "·"} Visa Entrée
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pl-2">
                  <button
                    onClick={() => openReject(req)}
                    className="px-3 py-2 bg-white border border-stone-200 text-stone-500 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"
                    title="Refuser le visa"
                  >
                    <XCircle size={14} /> Refuser
                  </button>
                  <button
                    onClick={() => handleValidate(req)}
                    className={`flex-1 py-3 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 ${
                      isExitStep ? "bg-stone-700" : "bg-green-700"
                    }`}
                  >
                    {isExitStep ? (
                      <>
                        Valider Sortie <ArrowRight size={14} />
                      </>
                    ) : (
                      <>
                        Valider Entrée <CheckCircle size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-3">
          {historyRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400 opacity-60">
              <History size={48} className="mb-4" />
              <span className="italic">Aucune demande traitée.</span>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-100 text-stone-500 uppercase text-[10px] tracking-widest font-black">
                  <tr>
                    <th className="p-4">Citoyen</th>
                    <th className="p-4">Trajet</th>
                    <th className="p-4 text-center">Décision</th>
                    <th className="p-4">Par</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {historyRequests.map((req) => {
                    const citizen = citizens.find((c) => c.id === req.citizenId);
                    return (
                      <tr key={req.id} className="hover:bg-stone-50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {citizen?.avatarUrl ? (
                              <img src={citizen.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-stone-200" style={{ width: 28, height: 28, minWidth: 28, minHeight: 28, objectFit: "cover" }} />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-black text-stone-500" style={{ width: 28, height: 28, minWidth: 28, minHeight: 28 }}>{(req.citizenName || "?")[0]}</div>
                            )}
                            <span className="font-bold text-stone-800">{req.citizenName || "Inconnu"}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-stone-500">
                          {countries.find((c) => c.id === req.fromCountry)?.name || req.fromCountry}
                          {" → "}
                          {countries.find((c) => c.id === req.toCountry)?.name || req.toCountry}
                          {req.toRegion && <span className="text-stone-400"> ({req.toRegion})</span>}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black uppercase ${req.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {req.status === "APPROVED" ? "✓ Approuvé" : "✗ Refusé"}
                          </span>
                          {req.rejectionReason && (
                            <div className="text-[9px] text-stone-400 italic mt-0.5">{req.rejectionReason}</div>
                          )}
                        </td>
                        <td className="p-4 text-xs text-stone-500">{req.rejectedBy || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostOfficeView;
