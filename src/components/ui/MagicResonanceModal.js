import React from "react";
import { Sparkles, X } from "lucide-react";

/**
 * Grande alerte plein écran déclenchée quand la trace magique d'un citoyen entre en
 * résonance avec celle de son conjoint (pacte arcanique) — voir driftMagicBond dans
 * gameUtils.js et la section "Dérive quotidienne des pactes arcaniques" de onPassDay.
 * C'est un événement rare et définitif (la résonance ne se défait jamais), d'où un
 * traitement visuel volontairement plus imposant qu'un toast standard.
 */
const MagicResonanceModal = ({ alert, onAcknowledge }) => {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative max-w-md w-full">
        <div
          className="absolute -inset-6 rounded-full blur-3xl opacity-60 animate-pulse"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.5) 0%, rgba(217,119,6,0.35) 55%, transparent 75%)" }}
        />
        <div className="relative bg-gradient-to-br from-stone-900 via-purple-950 to-stone-900 border-2 border-purple-400/50 rounded-2xl shadow-2xl p-7 text-center overflow-hidden">
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="absolute top-3 right-3 text-stone-400 hover:text-stone-200 p-1"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>

          <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-amber-400 shadow-[0_0_30px_8px_rgba(168,85,247,0.5)]">
            <Sparkles size={28} className="text-white" />
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300 mb-1">
            Pacte Arcanique
          </p>
          <h2 className="text-2xl font-black font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-200 to-amber-300 mb-3">
            Résonance Atteinte !
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            Votre trace magique et celle de <span className="font-bold text-amber-300">{alert.spouseName}</span> viennent
            de se rejoindre. Vos deux auras vibrent désormais à l'unisson — un lien magique achevé, permanent,
            que rien ne pourra plus dénouer.
          </p>

          <button
            onClick={() => onAcknowledge(alert.id)}
            className="mt-6 w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-black uppercase text-xs tracking-widest py-3 rounded-xl transition-all shadow-lg"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
};

export default MagicResonanceModal;
