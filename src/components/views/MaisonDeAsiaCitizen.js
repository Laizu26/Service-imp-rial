import React from "react";
import { Gem, Heart, Sparkles, LogOut, Info } from "lucide-react";

const MaisonDeAsiaCitizen = ({
  citizens,
  houseRegistry,
  staff = [], // On reçoit la liste définie par l'admin
  onBook,
  userBalance,
  user, // L'utilisateur courant (pour savoir s'il a déjà réservé)
}) => {
  // Vérifier si JE suis déjà en train de consommer
  const myBooking = houseRegistry.find((r) => r.citizenId === user?.id);
  const myWorker = myBooking
    ? staff.find((s) => s.id === myBooking.staffId)
    : null;

  const handleBooking = (worker) => {
    if (userBalance < worker.price) {
      alert("Vos bourses sont trop légères pour ses charmes.");
      return;
    }
    // Vérif si déjà occupé (double sécurité)
    const isBusy = houseRegistry.find((r) => r.staffId === worker.id);
    if (isBusy) {
      alert("Cette personne est déjà en charmante compagnie.");
      return;
    }

    if (
      window.confirm(
        `Passer un moment avec ${worker.name} pour ${worker.price} Écus ?`
      )
    ) {
      onBook(worker.id); // On envoie l'ID du staff
    }
  };

  const handleLeave = () => {
    if (window.confirm("Quitter la Maison de Asia ?")) {
      onBook(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-stone-900 to-fuchsia-950 rounded-xl overflow-hidden border border-fuchsia-900 shadow-2xl font-serif text-fuchsia-50">
      {/* HEADER AMBIANCE */}
      <div className="p-8 text-center relative shrink-0 border-b border-fuchsia-800/30">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20"></div>
        <Gem
          size={40}
          className="mx-auto mb-2 text-fuchsia-500 animate-pulse"
        />
        <h1 className="text-3xl font-black uppercase tracking-[0.4em] text-fuchsia-100">
          Le Harem
        </h1>
        <p className="text-[10px] font-sans uppercase tracking-widest mt-2 text-fuchsia-400">
          Maison de Asia • Plaisirs Nocturnes
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin scrollbar-thumb-fuchsia-900 scrollbar-track-transparent">
        {/* CAS 1 : UTILISATEUR DÉJÀ EN COMPAGNIE */}
        {myBooking ? (
          <div className="max-w-md mx-auto bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-fuchsia-500/30 text-center shadow-[0_0_50px_rgba(192,38,211,0.2)]">
            <div className="w-24 h-24 mx-auto rounded-full p-1 border-2 border-fuchsia-500 mb-4 shadow-lg overflow-hidden">
              <img
                src={myWorker?.avatarUrl || "https://i.pravatar.cc/150"}
                alt=""
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {myWorker?.name || "Inconnu"}
            </h2>
            <p className="text-fuchsia-300 text-sm mb-6 italic">
              "Profitez de l'instant..."
            </p>

            <div className="text-xs text-stone-400 mb-8 font-mono">
              Début : {new Date(myBooking.startTime).toLocaleTimeString()}
            </div>

            <button
              onClick={handleLeave}
              className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-bold uppercase tracking-widest transition-all border border-stone-600 flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Prendre congé
            </button>
          </div>
        ) : (
          /* CAS 2 : CATALOGUE */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {staff.length === 0 && (
              <div className="col-span-full text-center py-20 text-fuchsia-800/50 italic">
                Les rideaux sont tirés. Revenez plus tard.
              </div>
            )}

            {staff.map((worker) => {
              // Est-elle occupée ?
              const isOccupied = houseRegistry.find(
                (r) => r.staffId === worker.id
              );

              return (
                <div
                  key={worker.id}
                  className={`group relative bg-stone-900/80 rounded-xl overflow-hidden border transition-all duration-500 ${
                    isOccupied
                      ? "border-stone-800 opacity-50 grayscale"
                      : "border-fuchsia-900/50 hover:border-fuchsia-500 hover:shadow-[0_0_30px_rgba(192,38,211,0.15)]"
                  }`}
                >
                  {/* Image */}
                  <div className="h-64 overflow-hidden relative">
                    <img
                      src={worker.avatarUrl}
                      alt={worker.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-90"></div>

                    {/* Badge Prix */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-fuchsia-500/30 text-xs font-bold text-fuchsia-200">
                      {worker.price} 💎
                    </div>
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 w-full p-5">
                    <div className="flex justify-between items-end mb-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-fuchsia-300 transition-colors">
                        {worker.name}
                      </h3>
                      {isOccupied && (
                        <span className="text-[10px] font-black uppercase text-red-500 bg-black/50 px-2 py-0.5 rounded">
                          Occupée
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-400 italic mb-4">
                      {worker.specialty}
                    </p>

                    <button
                      onClick={() => handleBooking(worker)}
                      disabled={isOccupied || userBalance < worker.price}
                      className={`w-full py-3 rounded-lg font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                        isOccupied
                          ? "bg-stone-800 text-stone-500 cursor-not-allowed"
                          : userBalance < worker.price
                          ? "bg-stone-800 text-red-400 cursor-not-allowed border border-red-900/30"
                          : "bg-fuchsia-900 hover:bg-fuchsia-700 text-white shadow-lg border border-fuchsia-700"
                      }`}
                    >
                      {isOccupied ? (
                        "Indisponible"
                      ) : userBalance < worker.price ? (
                        "Trop Cher"
                      ) : (
                        <>
                          {" "}
                          <Heart size={14} fill="currentColor" /> Choisir{" "}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaisonDeAsiaCitizen;
