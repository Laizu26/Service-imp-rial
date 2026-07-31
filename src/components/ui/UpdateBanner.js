import React from "react";
import { RefreshCw } from "lucide-react";

export default function UpdateBanner() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 px-4 py-2.5 bg-amber-500 text-stone-900 shadow-lg"
      role="alert"
    >
      <RefreshCw size={15} className="shrink-0 animate-spin" style={{ animationDuration: "2.5s" }} />
      <span className="text-xs sm:text-sm font-bold">
        Une nouvelle version de Service Impérial est disponible. Rechargez la page pour continuer à naviguer.
      </span>
      <button
        onClick={() => window.location.reload()}
        className="shrink-0 bg-stone-900 text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors"
      >
        Recharger maintenant
      </button>
    </div>
  );
}
