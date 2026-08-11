import React, { useEffect, useRef, useState } from "react";
import { Crown } from "lucide-react";

const STAGES = [
  { type: "link", duration: 1700 },
  { type: "world", duration: 1900 },
  { type: "count", value: 3, duration: 750 },
  { type: "count", value: 2, duration: 750 },
  { type: "count", value: 1, duration: 750 },
  { type: "count", value: 0, duration: 750 },
  { type: "sync", duration: 1500 },
];

const LinkStartIntro = ({ worldName = "Addunya", onFinished }) => {
  const [stageIndex, setStageIndex] = useState(0);

  // onFinished est recréé à chaque rendu du parent (App.js re-render sur chaque sync Firestore) —
  // le stocker dans une ref évite que ce changement de référence ne fasse dépendre le minuteur
  // ci-dessous, qui sinon se réinitialiserait en boucle avant d'atteindre son délai.
  const onFinishedRef = useRef(onFinished);
  useEffect(() => { onFinishedRef.current = onFinished; }, [onFinished]);

  useEffect(() => {
    if (stageIndex >= STAGES.length) {
      onFinishedRef.current && onFinishedRef.current();
      return;
    }
    const t = setTimeout(() => setStageIndex((i) => i + 1), STAGES[stageIndex].duration);
    return () => clearTimeout(t);
  }, [stageIndex]);

  const stage = STAGES[Math.min(stageIndex, STAGES.length - 1)];

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black overflow-hidden font-sans">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-600/10 blur-3xl rounded-full"></div>

      <div className="relative z-10 flex flex-col items-center gap-5 px-6 text-center">
        {stage.type === "link" && (
          <div className="animate-[linkFadeIn_0.6s_ease-out]">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Crown size={26} className="text-yellow-500" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-[0.3em] text-yellow-400 drop-shadow-[0_0_25px_rgba(234,179,8,0.5)]">
              Link Start
            </h1>
          </div>
        )}

        {stage.type === "world" && (
          <div className="animate-[linkFadeIn_0.6s_ease-out]">
            <p className="text-sm sm:text-lg text-stone-300 uppercase tracking-[0.25em] font-bold">
              Vous entrez dans le monde de
            </p>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black uppercase tracking-[0.2em] text-yellow-400 font-serif drop-shadow-[0_0_25px_rgba(234,179,8,0.5)]">
              {worldName}
            </h2>
          </div>
        )}

        {stage.type === "count" && (
          <div
            key={stage.value}
            className="animate-[linkPulse_0.75s_ease-out]"
          >
            <span className="text-7xl sm:text-9xl font-black text-yellow-400 drop-shadow-[0_0_35px_rgba(234,179,8,0.6)]">
              {stage.value}
            </span>
          </div>
        )}

        {stage.type === "sync" && (
          <div className="animate-[linkFadeIn_0.6s_ease-out] flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full border-2 border-yellow-500 flex items-center justify-center">
              <span className="text-yellow-400 text-2xl">✓</span>
            </div>
            <p className="text-base sm:text-xl font-black uppercase tracking-[0.2em] text-yellow-400">
              Synchronisation réussie
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes linkFadeIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes linkPulse {
          0% { opacity: 0; transform: scale(0.6); }
          40% { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default LinkStartIntro;
