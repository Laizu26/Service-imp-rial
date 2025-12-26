import React, { useMemo } from "react";
import { Stamp, MapPin, ArrowRight } from "lucide-react";

const PostOfficeView = ({
  travelRequests,
  countries,
  citizens,
  session,
  onUpdateRequests,
  onUpdateCitizen,
}) => {
  const myCountryId = session.countryId;

  // Filtrer les requêtes pertinentes pour cette postière
  const relevantRequests = useMemo(() => {
    if (!travelRequests) return [];
    return travelRequests.filter((req) => {
      const isIntra = req.fromCountry === req.toCountry;
      const isDeparture = req.fromCountry === myCountryId;
      const isArrival = req.toCountry === myCountryId;

      // Si Intra: Je vois si je suis du pays
      if (isIntra && isDeparture) return true;

      // Si Inter:
      // Je vois si je suis au départ et que le visa de sortie n'est pas encore donné
      if (isDeparture && !req.validations.exit) return true;
      // Je vois si je suis à l'arrivée, que le visa de sortie EST donné, mais pas encore l'entrée
      if (isArrival && req.validations.exit && !req.validations.entry)
        return true;

      if (session.role === "EMPEREUR") return true;

      return false;
    });
  }, [travelRequests, myCountryId, session]);

  const handleValidate = (req) => {
    let updatedReq = { ...req, validations: { ...req.validations } }; // Deep clone validations
    let moveCitizen = false;
    const isIntra = req.fromCountry === req.toCountry;

    // 1. Déterminer l'action requise
    if (isIntra) {
      updatedReq.validations.exit = true;
      updatedReq.validations.entry = true;
      updatedReq.status = "APPROVED";
      moveCitizen = true;
    } else {
      // Voyage International
      if (!updatedReq.validations.exit) {
        // --- CAS 1 : VISA DE SORTIE ---
        const fromCountry = countries.find((c) => c.id === req.fromCountry);

        // Vérification Loi : Interdiction de sortie
        if (fromCountry?.laws?.forbidExit && session.role !== "EMPEREUR") {
          alert("Sortie interdite par la loi du pays de départ.");
          return;
        }

        // Vérification Droits : Pays de départ OU Empereur
        if (
          session.role === "EMPEREUR" ||
          session.countryId === req.fromCountry
        ) {
          updatedReq.validations.exit = true;
          // On ne déplace pas encore le citoyen, il faut le visa d'entrée ensuite
        } else {
          alert(
            "Vous n'avez pas l'autorité pour le visa de sortie (Pays de départ requis)."
          );
          return;
        }
      } else {
        // --- CAS 2 : VISA D'ENTRÉE (Exit déjà validé) ---
        const toCountry = countries.find((c) => c.id === req.toCountry);

        // Vérification Loi : Frontières fermées
        if (toCountry?.laws?.closeBorders && session.role !== "EMPEREUR") {
          alert("Entrée impossible : frontières hermétiques.");
          return;
        }

        // Vérification Droits : Pays d'arrivée OU Empereur
        if (
          session.role === "EMPEREUR" ||
          session.countryId === req.toCountry
        ) {
          updatedReq.validations.entry = true;
          updatedReq.status = "APPROVED";
          moveCitizen = true; // C'est le dernier visa, on déplace le citoyen
        } else {
          alert(
            "Vous n'avez pas l'autorité pour le visa d'entrée (Pays d'arrivée requis)."
          );
          return;
        }
      }
    }

    // 2. Appliquer les changements
    if (moveCitizen) {
      // Déplacer le citoyen + Supprimer la requête (ou la marquer archivée)
      onUpdateCitizen(req.citizenId, req.toCountry);
      // Optionnel : on peut garder la requête en statut APPROVED ou la supprimer.
      // Ici, on la met à jour pour l'historique si on ne filtre pas les APPROVED,
      // ou on la retire de la liste active.
      // Pour l'instant, on met à jour la requête.

      const otherRequests = travelRequests.filter((r) => r.id !== req.id);
      onUpdateRequests([...otherRequests, updatedReq]);
      alert("Visa accordé. Citoyen déplacé avec succès.");
    } else {
      // Juste mettre à jour la requête (ex: juste sortie validée)
      const otherRequests = travelRequests.filter((r) => r.id !== req.id);
      onUpdateRequests([...otherRequests, updatedReq]);
    }
  };

  return (
    <div className="h-full bg-[#fdf6e3] rounded-2xl border border-stone-300 flex flex-col p-6 md:p-8 font-sans">
      <div className="flex items-center gap-4 mb-8 border-b-2 border-stone-200 pb-4">
        <div className="bg-stone-800 text-white p-3 rounded-full">
          <Stamp size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-stone-800 font-serif">
            Bureau des Visas
          </h2>
          <p className="text-xs text-stone-500 uppercase tracking-widest">
            Gestion des Laissez-passer
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
        {relevantRequests.length === 0 && (
          <div className="col-span-full text-center text-stone-400 italic py-20">
            Aucune demande de visa en attente.
          </div>
        )}
        {relevantRequests.map((req) => (
          <div
            key={req.id}
            className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
            <div className="flex justify-between items-start mb-4">
              <span className="font-bold text-lg text-stone-800 font-sans">
                {req.citizenName}
              </span>
              <span className="text-[9px] bg-stone-100 px-2 py-1 rounded text-stone-500 uppercase tracking-widest font-sans">
                {req.fromCountry === req.toCountry
                  ? "Interne"
                  : "International"}
              </span>
            </div>
            <div className="space-y-2 text-sm text-stone-600 mb-6 font-sans">
              <div className="flex items-center gap-2">
                <MapPin size={14} />{" "}
                <span>
                  De : {countries.find((c) => c.id === req.fromCountry)?.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight size={14} />{" "}
                <span>
                  Vers : {countries.find((c) => c.id === req.toCountry)?.name} -{" "}
                  {req.toRegion}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleValidate(req)}
              className="w-full py-3 bg-stone-800 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-sans"
            >
              <Stamp size={14} />{" "}
              {!req.validations.exit && req.fromCountry !== req.toCountry
                ? "Valider SORTIE"
                : "Valider ENTRÉE"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostOfficeView;
