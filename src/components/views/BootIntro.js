import React, { useEffect, useMemo, useRef, useState } from "react";
import { Crown, User } from "lucide-react";

const BootIntro = ({ connectedAccounts = [], worldName = "Addunya", onFinished }) => {
  const accounts = useMemo(() => connectedAccounts.slice(0, 6), [connectedAccounts]);

  const stages = useMemo(() => {
    const s = [
      { type: "welcome", duration: 1600 },
      { type: "loading", duration: 1600 },
    ];
    accounts.forEach((acc) => s.push({ type: "account", account: acc, duration: 650 }));
    s.push({ type: "ready", duration: null }); // dernière étape : attend le clic (ou une touche)
    return s;
  }, [accounts]);

  const [stageIndex, setStageIndex] = useState(0);
  const [phase, setPhase] = useState("playing"); // playing | flash | fading
  const finishedRef = useRef(false);

  // stages/onFinished sont recréés à chaque re-render du parent (sync Firestore en continu) —
  // on les lit depuis des refs pour que ça n'interfère jamais avec les minuteurs ci-dessous
  // (même bug que sur LinkStartIntro : une dépendance instable réinitialiserait le minuteur en boucle).
  const stagesRef = useRef(stages);
  useEffect(() => { stagesRef.current = stages; }, [stages]);
  const onFinishedRef = useRef(onFinished);
  useEffect(() => { onFinishedRef.current = onFinished; }, [onFinished]);

  const dismiss = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPhase("flash");
  };

  // Avance automatiquement d'étape en étape, sauf la dernière ("ready") qui attend une action.
  useEffect(() => {
    const stage = stagesRef.current[stageIndex];
    if (!stage || stage.duration == null) return;
    const t = setTimeout(
      () => setStageIndex((i) => Math.min(i + 1, stagesRef.current.length - 1)),
      stage.duration
    );
    return () => clearTimeout(t);
  }, [stageIndex]);

  // Skippable à tout moment en appuyant sur n'importe quelle touche.
  useEffect(() => {
    const handler = () => dismiss();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Flash blanc puis fondu de disparition avant de révéler l'écran de connexion en dessous.
  useEffect(() => {
    if (phase === "flash") {
      const t = setTimeout(() => setPhase("fading"), 1000);
      return () => clearTimeout(t);
    }
    if (phase === "fading") {
      const t = setTimeout(() => onFinishedRef.current && onFinishedRef.current(), 650);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const stage = stages[Math.min(stageIndex, stages.length - 1)];

  return (
    <div
      className={`fixed inset-0 z-[500] flex items-center justify-center bg-black overflow-hidden font-sans transition-opacity duration-[600ms] ${
        phase === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-600/10 blur-3xl rounded-full"></div>

      <div
        className={`relative z-10 flex flex-col items-center gap-5 px-6 text-center transition-opacity duration-150 ${
          phase === "playing" ? "opacity-100" : "opacity-0"
        }`}
      >
        {stage.type === "welcome" && (
          <div className="animate-[bootFadeIn_0.6s_ease-out]">
            <Crown size={26} className="text-yellow-500 mx-auto mb-3" />
            <p className="text-xl sm:text-2xl font-black uppercase tracking-[0.15em] text-yellow-400">
              Bon retour parmis nous
            </p>
          </div>
        )}

        {stage.type === "loading" && (
          <div className="animate-[bootFadeIn_0.6s_ease-out] flex flex-col items-center gap-3">
            <p className="text-base sm:text-xl font-black uppercase tracking-[0.2em] text-stone-300">
              Chargement du monde en cours
            </p>
            <div className="w-40 h-0.5 bg-stone-800 overflow-hidden rounded-full">
              <div className="h-full w-1/3 bg-yellow-600 rounded-full animate-[bootLoadingBar_1.1s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {stage.type === "account" && (
          <div key={stage.account.id} className="animate-[bootFadeIn_0.5s_ease-out] flex flex-col items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-500">
              Personnages reconnus sur cet appareil
            </p>
            {stage.account.avatarUrl ? (
              <img
                src={stage.account.avatarUrl}
                alt=""
                className="w-14 h-14 rounded-full object-cover border-2 border-yellow-600/50"
                style={{ width: 56, height: 56, minWidth: 56, minHeight: 56, objectFit: "cover" }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full bg-stone-800 border-2 border-yellow-600/50 flex items-center justify-center"
                style={{ width: 56, height: 56, minWidth: 56, minHeight: 56 }}
              >
                <User size={22} className="text-stone-500" />
              </div>
            )}
            <p className="text-lg font-black uppercase tracking-wide text-stone-100">
              {stage.account.name || stage.account.id}
            </p>
          </div>
        )}

        {stage.type === "ready" && (
          <div className="animate-[bootFadeIn_0.6s_ease-out] flex flex-col items-center gap-5">
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-[0.15em] text-yellow-400 font-serif drop-shadow-[0_0_25px_rgba(234,179,8,0.5)]">
              {worldName} est prêt à vous accueillir
            </h2>
            <button
              onClick={dismiss}
              className="px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-yellow-500 font-black uppercase tracking-[0.25em] rounded-xl border-2 border-yellow-700/50 hover:border-yellow-600 shadow-lg transition-all active:scale-95"
            >
              Link Start
            </button>
          </div>
        )}
      </div>

      {(phase === "flash" || phase === "fading") && (
        <div className="absolute inset-0 bg-white animate-[bootFlashIn_0.15s_ease-out_forwards]" />
      )}

      {/* Retour en couleur façon SAO : un halo prismatique éclate au moment où le blanc se dissipe */}
      {phase === "fading" && (
        <div
          className="absolute inset-0 animate-[bootColorBurst_0.6s_ease-out_forwards]"
          style={{
            background:
              "radial-gradient(circle, rgba(56,189,248,0.9) 0%, rgba(250,204,21,0.85) 35%, rgba(244,63,94,0.6) 60%, transparent 78%)",
          }}
        />
      )}

      {phase === "playing" && (
        <p className="absolute bottom-6 text-[9px] text-stone-600 uppercase tracking-widest font-bold">
          Appuyez sur une touche pour passer
        </p>
      )}

      <style>{`
        @keyframes bootFadeIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes bootLoadingBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes bootFlashIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes bootColorBurst {
          0% { opacity: 0; transform: scale(0.4); }
          35% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1.7); }
        }
      `}</style>
    </div>
  );
};

export default BootIntro;
