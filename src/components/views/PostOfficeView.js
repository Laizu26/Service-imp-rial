import React, { useMemo } from "react";
import {
  Stamp,
  MapPin,
  ArrowRight,
  XCircle,
  FileText,
  CheckCircle,
} from "lucide-react";

const PostOfficeView = ({
  travelRequests,
  countries,
  citizens,
  session,
  onUpdateRequests,
  onUpdateCitizen,
  onVisaGranted, // <--- NOUVELLE PROP
  notify,
}) => {
  const myCountryId = session.countryId;

  // Filtrer les requêtes pertinentes
  const relevantRequests = useMemo(() => {
    if (!travelRequests) return [];
    return travelRequests.filter((req) => {
      if (req.status === "APPROVED" || req.status === "REJECTED") return false;

      const isIntra = req.fromCountry === req.toCountry;
      const isDeparture = req.fromCountry === myCountryId;
      const isArrival = req.toCountry === myCountryId;
      const isGlobalAdmin = ["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(
        session.role
      );

      if (isGlobalAdmin) return true;

      // Intra : Je suis du pays concerné
      if (isIntra && isDeparture) return true;

      // Inter - Visa Sortie : Je suis au départ et sortie non validée
      if (isDeparture && !req.validations.exit) return true;

      // Inter - Visa Entrée : Je suis à l'arrivée, sortie OK, entrée non validée
      if (isArrival && req.validations.exit && !req.validations.entry)
        return true;

      return false;
    });
  }, [travelRequests, myCountryId, session]);

  // Action : REJET
  const handleReject = (req) => {
    const reason = prompt("Motif du refus (sera transmis au citoyen) :");
    if (!reason) return; // Annulation

    const updatedReq = {
      ...req,
      status: "REJECTED",
      rejectionReason: reason,
      rejectedBy: session.name,
    };

    const otherRequests = travelRequests.filter((r) => r.id !== req.id);
    onUpdateRequests([...otherRequests, updatedReq]);
    if (notify) notify("Demande de visa rejetée.", "info");
  };

  // Action : VALIDATION
  const handleValidate = (req) => {
    let updatedReq = { ...req, validations: { ...req.validations } };
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
          otherRequests
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
      <div className="flex items-center gap-4 mb-8 border-b-2 border-stone-200 pb-4">
        <div className="bg-stone-800 text-white p-3 rounded-full shadow-lg">
          <Stamp size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-stone-800 font-serif uppercase tracking-tight">
            Bureau des Visas
          </h2>
          <p className="text-xs text-stone-500 uppercase tracking-widest font-bold">
            Contrôle des Frontières & Laissez-passer
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2">
        {relevantRequests.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-stone-400 opacity-60">
            <Stamp size={64} className="mb-4" />
            <span className="italic">Aucune demande de visa en attente.</span>
          </div>
        )}

        {relevantRequests.map((req) => {
          const citizen = citizens.find((c) => c.id === req.citizenId);
          const isExitStep =
            !req.validations.exit && req.fromCountry !== req.toCountry;

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
                <div>
                  <div className="font-black text-lg text-stone-800 font-serif leading-none">
                    {req.citizenName}
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono mt-1">
                    {citizen?.role || "CITOYEN"}
                  </div>
                </div>
                <span className="text-[9px] bg-stone-100 px-2 py-1 rounded text-stone-500 uppercase tracking-widest font-bold border border-stone-200">
                  {req.fromCountry === req.toCountry
                    ? "Interne"
                    : "International"}
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

              <div className="flex gap-2 pl-2">
                <button
                  onClick={() => handleReject(req)}
                  className="px-3 py-3 bg-white border border-stone-200 text-stone-500 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  title="Refuser le visa"
                >
                  <XCircle size={16} />
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
    </div>
  );
};

export default PostOfficeView;
