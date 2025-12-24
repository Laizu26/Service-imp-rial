import React, { useState } from "react";
import {
  X,
  Heart,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";

const MaisonDeAsiaCitizen = ({
  citizens,
  countries,
  houseRegistry,
  onBook,
  userBalance,
}) => {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  const availableProfiles = houseRegistry
    .map((entry) => {
      const cit = citizens.find((c) => c.id === entry.citizenId);
      if (!cit) return null;
      return { ...entry, ...cit, maisonDetails: entry };
    })
    .filter((p) => p !== null);

  if (selectedProfile) {
    const images = [
      selectedProfile.avatarUrl,
      ...(selectedProfile.maisonDetails.images || []),
    ].filter(Boolean);
    const countryName =
      countries.find((c) => c.id === selectedProfile.countryId)?.name ||
      "Inconnu";

    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
        <div className="bg-stone-900 w-full max-w-4xl h-[80vh] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
          <div className="md:w-1/2 bg-black relative flex items-center justify-center">
            {images.length > 0 && (
              <img
                src={images[currentImgIdx]}
                className="max-h-full max-w-full object-contain"
                alt=""
              />
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImgIdx(
                      (prev) => (prev - 1 + images.length) % images.length
                    );
                  }}
                  className="absolute left-4 p-2 bg-black/50 text-white rounded-full"
                >
                  <ChevronLeft />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImgIdx((prev) => (prev + 1) % images.length);
                  }}
                  className="absolute right-4 p-2 bg-black/50 text-white rounded-full"
                >
                  <ChevronRight />
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full md:hidden"
            >
              <X />
            </button>
          </div>
          <div className="md:w-1/2 p-8 text-stone-200 overflow-y-auto bg-[#1c1917]">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-4xl font-black font-serif uppercase text-yellow-500">
                {selectedProfile.name}
              </h2>
              <button
                onClick={() => setSelectedProfile(null)}
                className="hidden md:block text-stone-500"
              >
                <X />
              </button>
            </div>
            <div className="flex items-center gap-2 text-stone-400 text-xs uppercase mb-6">
              <MapPin size={12} /> {countryName}
              <span
                className={`ml-3 px-2 py-0.5 text-[10px] font-bold rounded ${
                  selectedProfile.maisonDetails.status === "Disponible"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-600 text-white"
                }`}
              >
                {selectedProfile.maisonDetails.status}
              </span>
            </div>
            <p className="font-serif italic text-lg text-stone-300 mb-6">
              "{selectedProfile.maisonDetails.description || "..."}"
            </p>
            <div className="mb-6">
              <span className="text-xs font-bold text-stone-500 uppercase">
                Spécialités:
              </span>{" "}
              <span className="text-yellow-500">
                {selectedProfile.maisonDetails.specialties}
              </span>
            </div>
            <button
              disabled={
                userBalance < selectedProfile.maisonDetails.price ||
                selectedProfile.maisonDetails.status !== "Disponible"
              }
              onClick={() => {
                if (
                  window.confirm(
                    `Réserver pour ${selectedProfile.maisonDetails.price} écus ?`
                  )
                ) {
                  onBook(
                    selectedProfile.maisonDetails.id,
                    selectedProfile.maisonDetails.price
                  );
                  setSelectedProfile(null);
                }
              }}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-stone-950 py-4 rounded-xl font-black uppercase disabled:opacity-50"
            >
              {selectedProfile.maisonDetails.status !== "Disponible"
                ? selectedProfile.maisonDetails.status
                : `Réserver (${selectedProfile.maisonDetails.price} ¢)`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <Star className="text-yellow-600" size={32} />
        <h1 className="text-3xl font-black uppercase text-stone-800">
          Maison de Asia
        </h1>
      </div>
      {availableProfiles.length === 0 ? (
        <div className="text-center text-stone-400 italic">
          Aucune maison enregistrée.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {availableProfiles.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                setCurrentImgIdx(0);
                setSelectedProfile(p);
              }}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-lg group"
            >
              {p.maisonDetails.status !== "Disponible" && (
                <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] uppercase px-2 py-1 rounded z-10">
                  {p.maisonDetails.status}
                </div>
              )}
              <img
                src={p.maisonDetails.images?.[0] || p.avatarUrl}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                alt=""
              />
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                <div className="font-bold uppercase text-yellow-400 text-xs">
                  {p.maisonDetails.price} ¢
                </div>
                <div className="font-black font-serif text-xl">{p.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default MaisonDeAsiaCitizen;
