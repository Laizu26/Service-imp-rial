import React, { useState } from "react";
import { MapPin, CheckCircle, AlertTriangle } from "lucide-react";

const PostalCheckModal = ({ user, countries, onConfirm }) => {
  const registeredCountryId = user.locationCountryId || user.countryId || "";
  const registeredRegion = user.currentPosition || "";

  const [selectedCountryId, setSelectedCountryId] = useState(registeredCountryId);
  const [selectedRegion, setSelectedRegion] = useState(registeredRegion);

  const selectedCountry = (countries || []).find((c) => c.id === selectedCountryId);
  const regions = selectedCountry?.regions || [];

  const noRegions = regions.length === 0;
  const canConfirm = selectedCountryId && (noRegions || selectedRegion);
  const countryMismatch = selectedCountryId !== registeredCountryId;
  const regionMismatch = !noRegions && registeredRegion !== "" && selectedRegion !== registeredRegion;
  const isMismatch = canConfirm && (countryMismatch || regionMismatch);
  const isMatch = canConfirm && !isMismatch;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(selectedCountryId, selectedRegion, isMismatch);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* En-tête */}
        <div className="px-6 py-5 border-b border-stone-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-900/40 border border-amber-700/60 rounded-xl flex items-center justify-center shrink-0">
            <MapPin size={18} className="text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-black text-stone-100 uppercase tracking-widest">
              Bureau de Poste
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5 uppercase tracking-wider">
              Vérification de localisation
            </div>
          </div>
        </div>

        {/* Corps */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-stone-300 leading-relaxed">
            Confirmez depuis quel bureau de poste vous accédez au service impérial.
          </p>

          {/* Sélection pays */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-0.5">
              Pays
            </label>
            <select
              className="w-full p-3 bg-stone-800 border border-stone-600 rounded-xl text-sm text-stone-100 font-bold outline-none focus:border-amber-500 transition-colors"
              value={selectedCountryId}
              onChange={(e) => {
                setSelectedCountryId(e.target.value);
                setSelectedRegion("");
              }}
            >
              <option value="">— Sélectionner —</option>
              {(countries || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sélection localité */}
          {!noRegions && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-0.5">
                Localité
              </label>
              <select
                className="w-full p-3 bg-stone-800 border border-stone-600 rounded-xl text-sm text-stone-100 font-bold outline-none focus:border-amber-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                disabled={!selectedCountryId}
              >
                <option value="">— Sélectionner —</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Feedback */}
          {isMismatch && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-900/30 border border-amber-700/40 rounded-xl">
              <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300 leading-relaxed">
                Position déclarée différente de votre localisation enregistrée.
                Les autorités impériales seront notifiées.
              </p>
            </div>
          )}

          {isMatch && (
            <div className="flex items-center gap-2.5 p-3 bg-green-900/30 border border-green-700/40 rounded-xl">
              <CheckCircle size={14} className="text-green-400 shrink-0" />
              <p className="text-[11px] text-green-300">Position confirmée.</p>
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="px-6 pb-6">
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 active:scale-95 disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed text-stone-900 font-black text-sm uppercase tracking-widest rounded-xl transition-all"
          >
            Confirmer
          </button>
        </div>

      </div>
    </div>
  );
};

export default PostalCheckModal;
